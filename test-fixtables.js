import fs from 'fs';

const code = fs.readFileSync('src/components/MarkdownRenderer.tsx', 'utf8');

const match = code.match(/export function fixMarkdownTables\([\s\S]*?\n\}/);
if (match) {
  let fnBody = match[0].replace('export function fixMarkdownTables', 'function fixMarkdownTables');
  eval(fnBody);

  const content = `$$\\begin{aligned} \\sum_{i=1}^{k+1} i &= \\left(\\sum_{i=1}^{k} i\\right) + (k+1) \\\\ &= \\frac{k(k+1)}{2} + (k+1) \\quad\\text{[by the hypothesis]}\\\\[4pt] &= \\frac{k(k+1)+2(k+1)}{2} \\\\ &= \\frac{(k+1)(k+2)}{2}. \\end{aligned}$$`;

  console.log("Original:", content);
  console.log("Processed:", fixMarkdownTables(content));
}
