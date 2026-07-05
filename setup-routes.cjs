const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const importAdminRoutes = `import { setupAdminRoutes } from './server/routes/admin';\n`;
const endOfImports = server.indexOf('const app = express()');
server = server.slice(0, endOfImports) + importAdminRoutes + server.slice(endOfImports);

// Call setupAdminRoutes just before `app.use(express.static(distPath));` or something near the end
server = server.replace(
  /app\.get\('\/\*', \(req, res\) => \{/g,
  `setupAdminRoutes(app, verifyAuth, getAdminApp, isAdminEmail);\n\n  app.get('/*', (req, res) => {`
);

fs.writeFileSync('server.ts', server);
console.log("Done");
