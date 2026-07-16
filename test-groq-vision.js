import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function run() {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [{ role: 'user', content: 'What is 1+1?' }]
    });
    console.log("Groq Vision Success:", response.choices[0].message.content);
  } catch (err) {
    console.log("Groq Vision Error:", err.message);
  }
}
run();
