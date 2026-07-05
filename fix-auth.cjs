const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

// 1. Fix populateUser
server = server.replace(
  /const populateUser = async \(req: express\.Request, res: express\.Response, next: express\.NextFunction\) => \{\n  const token = req\.headers\.authorization\?\.split\('Bearer '\)\[1\];\n  if \(\!token\) return next\(\);\n\n  try \{\n    const app = getAdminApp\(\);\n    if \(\!app\) return next\(\);\n    const decodedToken = await app\.auth\(\)\.verifyIdToken\(token\);\n    \(req as any\)\.user = decodedToken;\n    next\(\);\n  \} catch \(error\) \{\n    next\(\);\n  \}\n\};/g,
  `const populateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return next();

  try {
    const app = getAdminApp();
    if (!app) return next();
    const decodedToken = await app.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error: any) {
    // Only swallow if it's a normal populate, but let's log it or actually we should reject if token is present but invalid?
    // The prompt says "token verification failures should be explicitly rejected rather than silently falling back to anonymous/free-tier behavior"
    return res.status(401).json({ error: 'Unauthorized: Invalid token provided during populateUser', details: error.message });
  }
};`
);

// 2. Fix verifyAuth
server = server.replace(
  /if \(\!app\) \{\n      console\.warn\('Auth verification skipped: No Firebase app available\.'\);\n      \(req as any\)\.user = \{ uid: 'demo-user-' \+ token\.substring\(0, 8\), email: 'demo@example\.com' \};\n      return next\(\);\n    \}/g,
  `if (!app) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Auth verification skipped: No Firebase app available. Using demo user.');
        (req as any).user = { uid: 'demo-user-' + token.substring(0, 8), email: 'demo@example.com' };
        return next();
      } else {
        console.error('CRITICAL: Firebase app not initialized in production.');
        return res.status(500).json({ error: 'Internal Server Error: Authentication service unavailable.' });
      }
    }`
);

// 3. Fix WS auth
server = server.replace(
  /if \(\!app\) \{\n        console\.warn\('Auth verification skipped \(WS\): No Firebase app available\.'\);\n        user = \{ uid: 'demo-user-' \+ token\.substring\(0, 8\), email: 'demo@example\.com' \};\n      \} else \{/g,
  `if (!app) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Auth verification skipped (WS): No Firebase app available.');
          user = { uid: 'demo-user-' + token.substring(0, 8), email: 'demo@example.com' };
        } else {
          console.error('CRITICAL: Firebase app not initialized in production.');
          ws.close(1011, 'Auth service unavailable');
          return;
        }
      } else {`
);

fs.writeFileSync('server.ts', server);
console.log("Done");
