const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  /const routingDoc = await appAdmin\.firestore\(\)\.collection\('system_config'\)\.doc\('routing'\)\.get\(\);\n    const routingConfig = routingDoc\.data\(\) \|\| \{\n      chat: 'groq',\n      quiz: 'groq',\n      lesson: 'groq',\n      skeleton: 'cohere',\n      recommendation: 'cohere',\n      flashcard: 'huggingface',\n      rag: 'openrouter_free',\n      vision: 'gemini_direct',\n      past_questions: 'gemini_direct'\n    \};\n\n    \/\/ Fetch Global AI Mode\n    const aiModeDoc = await appAdmin\.firestore\(\)\.collection\('system_config'\)\.doc\('ai_mode'\)\.get\(\);/g,
  `const [routingDoc, aiModeDoc] = await Promise.all([
      appAdmin.firestore().collection('system_config').doc('routing').get(),
      appAdmin.firestore().collection('system_config').doc('ai_mode').get()
    ]);
    const routingConfig = routingDoc.data() || {
      chat: 'groq',
      quiz: 'groq',
      lesson: 'groq',
      skeleton: 'cohere',
      recommendation: 'cohere',
      flashcard: 'huggingface',
      rag: 'openrouter_free',
      vision: 'gemini_direct',
      past_questions: 'gemini_direct'
    };`
);

fs.writeFileSync('server.ts', server);
console.log("Done");
