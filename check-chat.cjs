const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const chatRoute = content.split("app.post('/api/chat'")[1].slice(0, 3000);
console.log(chatRoute);
