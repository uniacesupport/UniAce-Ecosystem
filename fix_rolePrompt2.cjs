const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /You are an expert academic data generator\. Your ONLY task is to generate the requested educational content based on the prompt\. You MUST output strictly valid JSON matching the exact requested schema\. Do NOT include any conversational text or metadata like 'status: ready'\./g;
const replacement = "You are an automated academic data builder API. You MUST output valid JSON only. Do not add conversational text, metadata, or greetings.";

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    console.log('Successfully replaced roleplay prompt.');
    fs.writeFileSync('server.ts', content, 'utf8');
} else {
    console.log('Target string not found');
}
