
import { GoogleGenAI } from '@google/genai';
import { Course } from '../src/types';
import { getDb } from './firebaseAdmin';

export interface SearchResult {
  content: string;
  source: string;
  type: 'question' | 'syllabus' | 'formula';
  score: number;
}

let indexedItems: { id: string; content: string; source: string; type: 'question' | 'syllabus' | 'formula'; embedding: number[] }[] = [];

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing. Please check your environment variables.');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export function addVectorItem(id: string, content: string, source: string, type: 'question' | 'syllabus' | 'formula', embedding: number[]) {
  // Remove if it already exists to handle updates
  removeVectorItem(id);
  indexedItems.push({ id, content, source, type, embedding });
}

export function removeVectorItem(id: string) {
  indexedItems = indexedItems.filter(item => item.id !== id);
}

/**
 * Loads embeddings from the Firestore knowledge_base collection.
 */
export async function initializeVectorStore() {
  indexedItems = []; // Reset

  console.log('Starting Vector Store Initialization from Firestore...');
  
  try {
    const db = getDb();
    const knowledgeBaseRef = db.collection('knowledge_base');
    const snapshot = await knowledgeBaseRef.get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.embedding && data.content) {
        // Convert VectorValue to array if necessary
        const embeddingArray = typeof data.embedding.toArray === 'function' 
          ? data.embedding.toArray() 
          : data.embedding;

        indexedItems.push({
          id: doc.id,
          content: data.content,
          source: data.source || 'Knowledge Base',
          type: data.type || 'question',
          embedding: embeddingArray,
        });
      }
    });

    console.log(`Vector store initialized with ${indexedItems.length} items from Firestore.`);
  } catch (error) {
    console.error('Failed to initialize vector store from Firestore:', error);
  }
}

/**
 * Performs semantic search using cosine similarity.
 */
export async function findRelevantContentSemantic(query: string, limit: number = 5): Promise<SearchResult[]> {
  if (indexedItems.length === 0) return [];

  try {
    const ai = getAI();
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: query,
    });

    const queryEmbedding = result.embeddings![0].values as number[];

    const scoredItems = indexedItems.map((item) => {
      const score = cosineSimilarity(queryEmbedding, item.embedding);
      return { ...item, score };
    });

    return scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ content, source, type, score }) => ({ content, source, type, score }));
  } catch (error) {
    console.error('Error in semantic search:', error);
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
