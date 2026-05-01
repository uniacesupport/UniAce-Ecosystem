const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /You are an academic API\. Your primary goal is to process the input and output ONLY valid JSON according to the requested schema\. Do NOT include greetings or conversational text\./g;
const replacement = "You are an expert academic data generator. Your ONLY task is to generate the requested educational content based on the prompt. You MUST output strictly valid JSON matching the exact requested schema. Do NOT include any conversational text or metadata like 'status: ready'.";

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    console.log('Successfully replaced roleplay prompt.');
    fs.writeFileSync('server.ts', content, 'utf8');
} else {
    console.log('Target string not found');
}
