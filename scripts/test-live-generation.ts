import dotenv from 'dotenv';
dotenv.config();
import { getAdminApp, getDb } from '../server/firebaseAdmin';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

async function testGeneration() {
  const db = getDb();
  if (!db) {
    console.error('Firestore not initialized.');
    return;
  }

  const apiKeysDoc = await db.collection('system_settings').doc('api_keys').get();
  const apiKeysData = apiKeysDoc.data() || {};

  console.log('=== TESTING REAL GENERATION WITH LIVE PROVIDERS ===\n');

  // 1. Test Gemini with 'gemini-2.5-flash'
  try {
    const key = apiKeysData.gemini_direct?.keys?.[0]?.key;
    if (key) {
      console.log('Testing Gemini with gemini-2.5-flash...');
      const ai = new GoogleGenAI({ apiKey: key });
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'Output JSON: {"status": "ok"}' }] }],
        config: { responseMimeType: 'application/json' }
      });
      console.log('✔ Gemini success:', resp.text);
    }
  } catch (err: any) {
    console.error('✖ Gemini failed:', err.message);
  }

  // 2. Test Groq with 'openai/gpt-oss-20b' and 'qwen/qwen3.8-27b'
  try {
    const key = apiKeysData.groq?.keys?.[0]?.key;
    if (key) {
      console.log('\nTesting Groq with qwen/qwen3.8-27b...');
      const groq = new Groq({ apiKey: key });
      const resp = await groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content: 'Output JSON: {"status": "ok"}' }],
        response_format: { type: 'json_object' }
      });
      console.log('✔ Groq (qwen/qwen3.8-27b) success:', resp.choices[0]?.message?.content);
    }
  } catch (err: any) {
    console.error('✖ Groq failed:', err.message);
  }

  // 3. Test Nvidia NIM with 'openai/gpt-oss-20b'
  try {
    const key = apiKeysData.nvidia?.keys?.[0]?.key;
    if (key) {
      console.log('\nTesting NVIDIA NIM with openai/gpt-oss-20b...');
      const openai = new OpenAI({
        baseURL: 'https://integrate.api.nvidia.com/v1',
        apiKey: key
      });
      const resp = await openai.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: 'Output JSON: {"status": "ok"}' }],
        response_format: { type: 'json_object' }
      });
      console.log('✔ NVIDIA NIM success:', resp.choices[0]?.message?.content);
    }
  } catch (err: any) {
    console.error('✖ NVIDIA NIM failed:', err.message);
  }
}

testGeneration().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
