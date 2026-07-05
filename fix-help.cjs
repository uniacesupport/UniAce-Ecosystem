const fs = require('fs');

const path2 = 'src/components/HelpSupport.tsx';
if (fs.existsSync(path2)) {
    let content2 = fs.readFileSync(path2, 'utf8');
    content2 = content2.replace(/value: \{import\.meta\.env\.VITE_SUPPORT_EMAIL \|\| "support@example\.com"\}/g, 'value: import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com"');
    fs.writeFileSync(path2, content2, 'utf8');
}

console.log("Done");
