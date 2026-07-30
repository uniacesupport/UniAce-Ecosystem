const text = `**Proof by Induction** We want to show that for every positive integer \\(n\\), \\[ S_n:=1+2+\\dots +n=\\frac{n(n+1)}{2}. \\] --- **Base case (\\(n=1\\))** \\[ S_1 = 1 = \\frac{1\\cdot(1+1)}{2}= \\frac{2}{2}=1. \\] The formula holds. --- **Inductive hypothesis** Assume the formula is true for some arbitrary positive integer \\(k\\); i.e., \\[ S_k = \\sum_{i=1}^k i = \\frac{k(k+1)}{2} \\] --- **Inductive step (\\(n=k+1\\))** \\[ \\begin{aligned} \\sum_{i=1}^{k+1} i &= \\left(\\sum_{i=1}^{k} i\\right) + (k+1) \\\\ &= \\frac{k(k+1)}{2} + (k+1) \\quad\\text{[by the hypothesis]}\\\\[4pt] &= \\frac{k(k+1)+2(k+1)}{2} \\\\ &= \\frac{(k+1)(k+2)}{2}. \\end{aligned} \\] This is exactly the formula with $n$ replaced by $k+1$. Hence the statement holds for $k+1$. By the principle of mathematical induction, the formula is true for all $n\\in\\mathbb{N}$.`;

let processedText = text
  .replace(/\\infinity\b/gi, '\\infty')
  .replace(/\\\[([\s\S]+?)\\\]/g, (_m, p1) => `\n\n$$\n${p1.trim()}\n$$\n\n`)
  .replace(/\\\(([\s\S]+?)\\\)/g, (_m, p1) => `$${p1.trim()}$`);

const mathBlocks = [];
let protectedText = processedText;

protectedText = protectedText.replace(/\$\$([\s\S]+?)\$\$/g, (match) => {
  mathBlocks.push(match);
  return `__MATH_BLOCK_PLACEHOLDER_${mathBlocks.length - 1}__`;
});

protectedText = protectedText.replace(/\$([^$\n]+?)\$/g, (match) => {
  mathBlocks.push(match);
  return `__MATH_BLOCK_PLACEHOLDER_${mathBlocks.length - 1}__`;
});

let restored = protectedText;
for (let i = 0; i < mathBlocks.length; i++) {
  restored = restored.replace(`__MATH_BLOCK_PLACEHOLDER_${i}__`, () => {
    let mathContent = mathBlocks[i];
    let isBlock = mathContent.startsWith('$$');
    let inner = isBlock ? mathContent.slice(2, -2) : mathContent.slice(1, -1);
    
    let fixedInner = inner;
    fixedInner = fixedInner.replace(/\\?infinity\b/gi, 'infty');
    
    const stripped = fixedInner.replace(/\\(text|mathrm|textbf|textit)\{.*?\}/g, '');
    const words = stripped.match(/(?<!\\)[a-zA-Z]{3,}/g) || [];
    const isRunaway = words.length >= 3 && !isBlock;
    
    if (isRunaway) {
      fixedInner = fixedInner.replace(/\\(in|to|cap|cup|times|pm|div|cdot|hat|vec|text)\b/gi, '$1');
      fixedInner = fixedInner.replace(/\\\s/g, ' ');
      if (fixedInner.endsWith('\\')) fixedInner = fixedInner.slice(0, -1);
      return fixedInner;
    }
    
    const mathKeywords = ['frac', 'sqrt', 'sum', 'int'];
    for (const kw of mathKeywords) {
      const regex = new RegExp(`(?<!\\\\)\\b${kw}\\b`, 'g');
      fixedInner = fixedInner.replace(regex, `\\${kw}`);
    }
    
    return isBlock ? `$$${fixedInner}$$` : `$${fixedInner}$`;
  });
}

console.log(restored);
