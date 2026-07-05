const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  /app\.post\('\/api\/ai\/stream', verifyAuth, async \(req, res\) => \{\n  if \(systemConfig\.aiKillswitch\) \{\n    return res\.status\(503\)\.json\(\{ error: 'AI services are currently disabled by administrator\.' \}\);\n  \}\n  const \{ prompt, systemInstruction, complexity = 'standard', taskType \} = req\.body;/g,
  `app.post('/api/ai/stream', verifyAuth, async (req, res) => {
  if (systemConfig.aiKillswitch) {
    return res.status(503).json({ error: 'AI services are currently disabled by administrator.' });
  }

  // Zod Validation
  const parseResult = StreamSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
  }

  const { prompt, systemInstruction, complexity = 'standard', taskType } = parseResult.data;`
);
fs.writeFileSync('server.ts', server);
console.log("Done");
