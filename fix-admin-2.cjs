const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(/user\.email === 'uniace\.support@gmail\.com' \|\s*\|\s*\n\s*user\.email === 'olalekan4565@gmail\.com'/g, 'isAdminEmail(user.email)');

fs.writeFileSync('server.ts', server);
console.log("Done");
