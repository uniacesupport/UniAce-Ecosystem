import { Mistral } from '@mistralai/mistralai';
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

async function run() {
  try {
    const response = await mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'Hello' }]
    });
    console.log("Mistral Success:", response.choices[0].message.content);
  } catch (err) {
    console.log("Mistral Error:", err.message);
  }
}
run();
