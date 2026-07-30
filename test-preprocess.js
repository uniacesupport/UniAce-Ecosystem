import fs from 'fs';

// Read the function preprocessMarkdownContent from MarkdownRenderer.tsx
const code = fs.readFileSync('src/components/MarkdownRenderer.tsx', 'utf8');

// Use regex to extract preprocessMarkdownContent function
const match = code.match(/export function preprocessMarkdownContent\([\s\S]*?\n\}/);
if (match) {
  let fnBody = match[0].replace('export function preprocessMarkdownContent', 'function preprocessMarkdownContent');
  eval(fnBody);

  const content = `**Inductive step ($n=k+1$)** $$\n\\begin{aligned} \\sum_{i=1}^{k+1} i &= \\left(\\sum_{i=1}^{k} i\\right) + (k+1) \\\\ &= \\frac{k(k+1)}{2} + (k+1) \\quad\\text{[by the hypothesis]}\\\\[4pt] &= \\frac{k(k+1)+2(k+1)}{2} \\\\ &= \\frac{(k+1)(k+2)}{2}. \\end{aligned}$$ This is exactly the formula with $n$ replaced by $k+1$. Hence the statement holds for $k+1$. By the principle of mathematical induction, the formula is true for all $n\\in\\mathbb{N}$.`;

  console.log("Original:", content);
  console.log("Processed:", preprocessMarkdownContent(content));
} else {
  console.log("Function not found");
}
