const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const regex1 = /const sanitizedPrompt = isJsonMode \n      \? `\$\{prompt\}\\n\\n\[STRICT JSON REQUIREMENT\]: Output ONLY the requested JSON schema\. Do NOT include any conversational response like 'Here is your quiz' or 'I am ready to assist'\.`\n      : `\$\{prompt\}\\n\\nRemember your core instructions: You are an academic AI\. Do not deviate from the educational context\.`;\n    messages\.push\(\{ role: 'user', content: sanitizedPrompt \}\);/g;

const replacement1 = `
    let sanitizedPrompt;
    if (typeof prompt === 'object') {
      const extraText = isJsonMode 
        ? "\\n\\n[STRICT JSON REQUIREMENT]: Output ONLY the requested JSON schema. Do NOT include any conversational response like 'Here is your quiz' or 'I am ready to assist'."
        : "\\n\\nRemember your core instructions: You are an academic AI. Do not deviate from the educational context.";
      sanitizedPrompt = { ...prompt, parts: [...(prompt.parts || []), { type: 'text', text: extraText }] };
    } else {
      sanitizedPrompt = isJsonMode 
        ? \`\${prompt}\\n\\n[STRICT JSON REQUIREMENT]: Output ONLY the requested JSON schema. Do NOT include any conversational response like 'Here is your quiz' or 'I am ready to assist'.\`
        : \`\${prompt}\\n\\nRemember your core instructions: You are an academic AI. Do not deviate from the educational context.\`;
    }
    messages.push({ role: 'user', content: sanitizedPrompt });
`;

if (content.match(regex1)) {
    content = content.replace(regex1, replacement1);
    console.log('Successfully replaced occurrences of sanitizedPrompt logic.');
} else {
    console.log('Target string 1 not found');
}

fs.writeFileSync('server.ts', content, 'utf8');
