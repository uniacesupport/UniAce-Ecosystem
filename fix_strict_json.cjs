const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const regex1 = /Do NOT include any conversational response like 'Here is your quiz' or 'I am ready to assist'\./g;
const replacement1 = "Return only the JSON structure.";

if (content.match(regex1)) {
    content = content.replace(regex1, replacement1);
    console.log('Successfully replaced strict JSON requirement.');
    fs.writeFileSync('server.ts', content, 'utf8');
} else {
    console.log('Target string not found');
}
