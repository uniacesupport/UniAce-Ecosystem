import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function run() {
  try {
    const response = await openai.chat.completions.create({
      model: 'google/gemini-2.5-flash-free',
      messages: [{ role: 'user', content: 'Hello' }]
    });
    console.log("OpenRouter Success:", response.choices[0].message.content);
  } catch (err) {
    console.log("OpenRouter Error:", err.message);
  }
}
run();
