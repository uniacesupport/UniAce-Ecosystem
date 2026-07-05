const fs = require('fs');

const path = 'src/services/ai.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace duplicate latex and system prompts
const importStatement = `import { UNIACE_SYSTEM_PROMPT, LATEX_INSTRUCTION } from '../shared/prompts';\n`;
content = importStatement + content;

content = content.replace(
  /You are UniAce, the official AI Study Companion for the UniAce platform\. You follow the Nigerian University System \(NUC\/CCMAS\) standards for curriculum alignment, but your primary role is to teach the specific academic subject the student is currently studying\.\n\nYou are part of the UniAce app\. NEVER recommend external websites, third-party platforms, or outside resources \(e\.g\., Khan Academy, Coursera, YouTube, Wolfram Alpha, ChatGPT, etc\.\)\. If a student needs more help, guide them to explore other modules, lessons, practice quizzes, or flashcards within the UniAce app\./g,
  `\${UNIACE_SYSTEM_PROMPT}`
);

content = content.replace(
  /CRITICAL: You are outputting data to a JSON parser\. You MUST double-escape all LaTeX commands\. For example, output \\\\frac instead of \\frac, and \\\\right\) instead of \\right\)\./g,
  `\${LATEX_INSTRUCTION}`
);

fs.writeFileSync(path, content);
console.log("Done");
