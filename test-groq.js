import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function run() {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'Hello' }]
    });
    console.log("Groq Success:", response.choices[0].message.content);
  } catch (err) {
    console.log("Groq Error:", err.message);
  }
}
run();
