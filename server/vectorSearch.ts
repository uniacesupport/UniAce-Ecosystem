
import { GoogleGenAI } from '@google/genai';
import { PastPaper } from '../src/data/pastQuestionsData';
import { QuizQuestion, Course } from '../src/types';

export interface SearchResult {
  content: string;
  source: string;
  type: 'question' | 'syllabus' | 'formula';
  score: number;
}

let indexedItems: { content: string; source: string; type: 'question' | 'syllabus' | 'formula'; embedding: number[] }[] = [];

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

/**
 * Generates embeddings for all questions, syllabus topics, and formulas.
 */
export async function initializeVectorStore(pastPapers: PastPaper[], courses: Record<string, Course>) {
  indexedItems = []; // Reset

  console.log('Starting Vector Store Initialization...');
  
  try {
    // 1. Index Questions
    const allQuestions: QuizQuestion[] = [];
    pastPapers.forEach(paper => {
      allQuestions.push(...paper.questions);
    });

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const question of allQuestions) {
      const content = `Question: ${question.question} Explanation: ${question.explanation}`;
      await addIndexItem(content, `Past Paper Question`, 'question');
      await sleep(700); // 700ms delay = ~85 requests per minute (under 100/min limit)
    }

    // 2. Index Course Syllabus
    for (const courseId in courses) {
      const course = courses[courseId];
      for (const module of course.syllabus) {
        for (const subTopic of module.subTopics) {
          const content = `Course: ${course.title} Topic: ${module.title} Subtopic: ${subTopic.title} Content: ${subTopic.content}`;
          await addIndexItem(content, `${course.title} - ${subTopic.title}`, 'syllabus');
          await sleep(700);
        }
      }

      // 3. Index Formulas
      for (const formula of course.formulas) {
        const content = `Course: ${course.title} Formula: ${formula.title} LaTeX: ${formula.latex} Description: ${formula.description}`;
        await addIndexItem(content, `${course.title} - Formula: ${formula.title}`, 'formula');
        await sleep(700);
      }
    }

    console.log(`Vector store initialized with ${indexedItems.length} items.`);
  } catch (error) {
    console.error('Failed to initialize vector store:', error);
  }
}

async function addIndexItem(content: string, source: string, type: 'question' | 'syllabus' | 'formula') {
  try {
    const ai = getAI();
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: content,
    });
    
    if (result.embeddings && result.embeddings.length > 0) {
      indexedItems.push({
        content,
        source,
        type,
        embedding: result.embeddings[0].values as number[],
      });
    }

    console.log(`Vector Store Initialized with ${vectorStore.length} items.`);
  } catch (error) {
    console.error(`Error generating embedding for ${source}:`, error);
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
