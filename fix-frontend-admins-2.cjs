const fs = require('fs');

const path1 = 'src/components/ApiDebuggerPage.tsx';
if (fs.existsSync(path1)) {
    let content1 = fs.readFileSync(path1, 'utf8');
    content1 = content1.replace(/"to": "uniace\.support@gmail\.com"/g, '"to": "support@example.com"');
    fs.writeFileSync(path1, content1, 'utf8');
}

const path2 = 'src/components/HelpSupport.tsx';
if (fs.existsSync(path2)) {
    let content2 = fs.readFileSync(path2, 'utf8');
    content2 = content2.replace(/"uniace\.support@gmail\.com"/g, '{import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com"}');
    fs.writeFileSync(path2, content2, 'utf8');
}

console.log("Done");
