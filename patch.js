const fs = require('fs');
const file = 'src/services/validators/aiSchemas.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  /explanation: explanation \|\| \`The correct answer is: \$\{correctAnswer\}\.\`/g,
  "explanation: explanation || `The correct answer is: ${correctAnswer}.`,\n    difficulty: Math.max(1, Math.min(5, Math.round(Number(q.difficulty) || 3)))"
);
fs.writeFileSync(file, code);
