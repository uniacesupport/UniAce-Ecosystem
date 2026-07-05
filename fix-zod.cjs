const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const zodImports = `
import { z } from 'zod';

const AiGenerateSchema = z.object({
  prompt: z.any().optional(),
  systemInstruction: z.string().max(50000).optional(),
  responseFormat: z.enum(['json', 'text']).optional(),
  maxTokens: z.number().max(32000).optional(),
  complexity: z.enum(['standard', 'high', 'quiz']).optional(),
  taskType: z.string().max(50).optional(),
  preferredProvider: z.string().max(50).optional()
});

const ChatSchema = z.object({
  message: z.string().max(50000),
  image: z.string().optional(),
  history: z.array(z.any()).optional(),
  context: z.string().max(100000).optional(),
  complexity: z.enum(['standard', 'high']).optional(),
  isHintRequest: z.boolean().optional(),
  masteryLevel: z.number().optional(),
  personality: z.string().max(50).optional(),
  currentSparks: z.number().optional(),
  planType: z.string().max(50).optional()
});

const StreamSchema = z.object({
  prompt: z.any(),
  systemInstruction: z.string().max(50000).optional(),
  complexity: z.enum(['standard', 'high', 'quiz']).optional(),
  taskType: z.string().max(50).optional(),
  preferredProvider: z.string().max(50).optional(),
  responseFormat: z.enum(['json', 'text']).optional()
});
`;

// Insert Zod schemas after the imports
const endOfImports = server.indexOf('const app = express()');
server = server.slice(0, endOfImports) + zodImports + '\n' + server.slice(endOfImports);

// 1. /api/chat
server = server.replace(
  /app\.post\('\/api\/chat', verifyAuth, async \(req, res\) => \{\n  console\.log\('API \/api\/chat called'\);\n  const \{ message, image, history, context, complexity = 'standard', isHintRequest = false, masteryLevel = 0, personality = 'encouraging', currentSparks = 50, planType = 'free' \} = req\.body;/g,
  `app.post('/api/chat', verifyAuth, async (req, res) => {
  console.log('API /api/chat called');
  
  // Zod Validation
  const parseResult = ChatSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
  }
  
  const { message, image, history, context, complexity = 'standard', isHintRequest = false, masteryLevel = 0, personality = 'encouraging', currentSparks = 50, planType = 'free' } = parseResult.data;`
);

// 2. /api/ai/generate (First one)
// Note: there are two generate routes or something similar.
server = server.replace(
  /app\.post\('\/api\/ai\/generate', verifyAuth, async \(req, res\) => \{\n  if \(systemConfig\.aiKillswitch\) \{\n    return res\.status\(503\)\.json\(\{ error: 'AI services are currently disabled by administrator\.' \}\);\n  \}\n  const \{ prompt, systemInstruction, responseFormat, maxTokens, complexity, taskType \} = req\.body;/g,
  `app.post('/api/ai/generate', verifyAuth, async (req, res) => {
  if (systemConfig.aiKillswitch) {
    return res.status(503).json({ error: 'AI services are currently disabled by administrator.' });
  }
  
  // Zod Validation
  const parseResult = AiGenerateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.format() });
  }
  
  const { prompt, systemInstruction, responseFormat, maxTokens, complexity, taskType } = parseResult.data;`
);

// 3. /api/ai/stream
server = server.replace(
  /app\.post\('\/api\/ai\/stream', verifyAuth, async \(req, res\) => \{\n  if \(systemConfig\.aiKillswitch\) \{\n    return res\.status\(503\)\.json\(\{ error: 'AI services are currently disabled by administrator\.' \}\);\n  \}\n\n  const \{ prompt, systemInstruction, complexity = 'standard', taskType \} = req\.body;/g,
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
