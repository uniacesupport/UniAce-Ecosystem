const mathContent = "E\\ is the magnitude of the electric field";
const stripped = mathContent.replace(/\\(text|mathrm|textbf|textit)\{.*?\}/g, '');
const words = stripped.match(/(?<!\\)[a-zA-Z]{3,}/g) || [];
console.log(words.length >= 3);
