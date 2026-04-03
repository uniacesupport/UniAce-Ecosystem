import { HuggingFaceProvider } from './server/providers.js';

async function test() {
  const provider = new HuggingFaceProvider(process.env.HUGGINGFACE_API_KEY || '');
  try {
    const res = await provider.generate([{ role: 'user', content: 'Hello' }], { complexity: 'standard' });
    console.log("Success:", res.text.substring(0, 50));
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
