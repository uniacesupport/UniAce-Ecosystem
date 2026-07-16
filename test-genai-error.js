import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'invalid_key' });

async function run() {
  try {
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: "Hello" }]
    });
  } catch (error) {
    console.log("Error object keys:", Object.keys(error));
    console.log("error.status:", error.status);
    console.log("error.statusCode:", error.statusCode);
    console.log("error.code:", error.code);
    console.log("error.message:", error.message);
  }
}
run();
