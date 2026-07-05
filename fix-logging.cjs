const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

// Add logger import
const endOfImports = server.indexOf('const app = express()');
server = server.slice(0, endOfImports) + `import { logger } from './server/logger';\n` + server.slice(endOfImports);

// Replace crash handlers
server = server.replace(
  /console\.error\('CRITICAL: UNCAUGHT EXCEPTION:', err\);/g,
  `logger.fatal({ err }, 'CRITICAL: UNCAUGHT EXCEPTION');`
);
server = server.replace(
  /console\.error\('CRITICAL: UNHANDLED REJECTION at:', promise, 'reason:', reason\);/g,
  `logger.fatal({ promise, reason }, 'CRITICAL: UNHANDLED REJECTION');`
);

// Replace some key generic 500 errors
server = server.replace(
  /console\.error\('Auth Error:', error\.message\);/g,
  `logger.error({ err: error }, 'Auth Error during verifyAuth');`
);

server = server.replace(
  /console\.error\('OpenRouter Stream Error:', error\);/g,
  `logger.error({ err: error }, 'OpenRouter Stream Error');`
);

server = server.replace(
  /console\.warn\("Failed to fetch user context for AI:", err\);/g,
  `logger.warn({ err }, "Failed to fetch user context for AI");`
);

fs.writeFileSync('server.ts', server);
console.log("Done");
