import dotenv from 'dotenv';
dotenv.config();
import { getAdminApp, getDb } from '../server/firebaseAdmin';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

async function checkLiveModels() {
  const db = getDb();
  if (!db) {
    console.error('Firestore not initialized.');
    return;
  }

  const apiKeysDoc = await db.collection('system_settings').doc('api_keys').get();
  const apiKeysData = apiKeysDoc.data() || {};

  console.log('=== CHECKING LIVE PROVIDER MODEL-LIST ENDPOINTS ===\n');

  // 1. Check Gemini
  try {
    const geminiKeys = apiKeysData.gemini_direct?.keys?.map((k: any) => k.key).filter(Boolean) || [process.env.GEMINI_API_KEY];
    console.log(`[Gemini] Testing key (total keys: ${geminiKeys.length})...`);
    if (geminiKeys.length > 0 && geminiKeys[0]) {
      const ai = new GoogleGenAI({ apiKey: geminiKeys[0] });
      // List models
      const modelsList = await ai.models.list();
      const models = [];
      for await (const m of modelsList) {
        if (m.name && (m.name.includes('gemini') || m.name.includes('flash') || m.name.includes('pro'))) {
          models.push(m.name);
        }
      }
      console.log(`[Gemini] Live models found (${models.length}):`, models.slice(0, 10));
      console.log(`[Gemini] Configured model in DB: "${apiKeysData.gemini_direct?.model}"`);
    }
  } catch (err: any) {
    console.error('[Gemini] Error fetching live models:', err.message);
  }

  // 2. Check Groq
  try {
    const groqKeys = apiKeysData.groq?.keys?.map((k: any) => k.key).filter(Boolean) || [process.env.GROQ_API_KEY];
    console.log(`\n[Groq] Testing key (total keys: ${groqKeys.length})...`);
    if (groqKeys.length > 0 && groqKeys[0]) {
      const groq = new Groq({ apiKey: groqKeys[0] });
      const list = await groq.models.list();
      const activeModels = list.data.filter((m: any) => m.active !== false).map((m: any) => m.id);
      console.log(`[Groq] Live active models found (${activeModels.length}):`, activeModels);
      console.log(`[Groq] Configured model in DB: "${apiKeysData.groq?.model}"`);
    }
  } catch (err: any) {
    console.error('[Groq] Error fetching live models:', err.message);
  }

  // 3. Check NVIDIA NIM
  try {
    const nvidiaKeys = apiKeysData.nvidia?.keys?.map((k: any) => k.key).filter(Boolean) || [process.env.NVIDIA_API_KEY];
    console.log(`\n[NVIDIA NIM] Testing key (total keys: ${nvidiaKeys.length})...`);
    if (nvidiaKeys.length > 0 && nvidiaKeys[0]) {
      const openai = new OpenAI({
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey: nvidiaKeys[0],
      });
      const list = await openai.models.list();
      const models = list.data.map((m: any) => m.id);
      console.log(`[NVIDIA NIM] Live models found (${models.length}):`, models.slice(0, 15));
      console.log(`[NVIDIA NIM] Configured model in DB: "${apiKeysData.nvidia?.model}"`);
      console.log(`[NVIDIA NIM] Configured fallback in DB: "${apiKeysData.nvidia?.fallbackModel}"`);
      // Check if configured models exist in the live list
      const hasConfigured = models.includes(apiKeysData.nvidia?.model);
      const hasFallback = models.includes(apiKeysData.nvidia?.fallbackModel);
      console.log(`[NVIDIA NIM] Is configured model in live list? ${hasConfigured}`);
      console.log(`[NVIDIA NIM] Is fallback model in live list? ${hasFallback}`);
    }
  } catch (err: any) {
    console.error('[NVIDIA NIM] Error fetching live models:', err.message);
  }

  // 4. Check Mistral
  try {
    const mistralKeys = apiKeysData.mistral_direct?.keys?.map((k: any) => k.key).filter(Boolean) || [process.env.MISTRAL_API_KEY];
    console.log(`\n[Mistral] Testing key (total keys: ${mistralKeys.length})...`);
    if (mistralKeys.length > 0 && mistralKeys[0]) {
      const resp = await fetch('https://api.mistral.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${mistralKeys[0]}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        const models = data.data?.map((m: any) => m.id) || [];
        console.log(`[Mistral] Live models found (${models.length}):`, models.slice(0, 10));
        console.log(`[Mistral] Configured model in DB: "${apiKeysData.mistral_direct?.model}"`);
      } else {
        console.log(`[Mistral] Response not ok: ${resp.status}`);
      }
    }
  } catch (err: any) {
    console.error('[Mistral] Error fetching live models:', err.message);
  }
}

checkLiveModels().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
