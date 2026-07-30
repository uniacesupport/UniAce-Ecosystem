import dotenv from "dotenv";
dotenv.config();

async function main() {
  try {
    const response = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.NVIDIA_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text_prompts: [{ text: "A realistic dog" }],
        seed: 42,
        temperature: 1,
        top_p: 1,
        top_k: 0
      })
    });
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Success!", Object.keys(data), data?.artifacts?.length);
  } catch (err: any) {
    console.error(err.message || err);
  }
}
main();
