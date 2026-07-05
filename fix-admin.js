const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

// Insert isAdminEmail function after imports
const insertIndex = server.indexOf('import ');
let lastImportIndex = server.lastIndexOf('import ', server.indexOf('const app = express()'));
if (lastImportIndex === -1) lastImportIndex = 0;
const endOfImports = server.indexOf('\n', lastImportIndex) + 1;

const isAdminFunc = `
// --- ADMIN AUTHORIZATION UTILITY ---
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}
`;

server = server.slice(0, endOfImports) + isAdminFunc + server.slice(endOfImports);

// Replace instances
server = server.replace(/email === 'uniace\.support@gmail\.com' \|\| email === 'olalekan4565@gmail\.com'/g, 'isAdminEmail(email)');
server = server.replace(/user\.email === 'uniace\.support@gmail\.com' \|\| user\.email === 'olalekan4565@gmail\.com'/g, 'isAdminEmail(user.email)');
server = server.replace(/userEmail === 'uniace\.support@gmail\.com' \|\| userEmail === 'olalekan4565@gmail\.com'/g, 'isAdminEmail(userEmail)');
server = server.replace(/userEmail !== 'uniace\.support@gmail\.com' && userEmail !== 'olalekan4565@gmail\.com'/g, '!isAdminEmail(userEmail)');
// specific edge cases
server = server.replace(/user\.email === 'uniace\.support@gmail\.com' \|\/\n.*user\.email === 'olalekan4565@gmail\.com'/g, 'isAdminEmail(user.email)');
server = server.replace(/user\.email === 'uniace\.support@gmail\.com' \|\s*\n\s*user\.email === 'olalekan4565@gmail\.com'/g, 'isAdminEmail(user.email)');


fs.writeFileSync('server.ts', server);

