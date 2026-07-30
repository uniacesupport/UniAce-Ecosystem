import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

const content = `**Inductive step ($n=k+1$)** $$\n\\begin{aligned} \\sum_{i=1}^{k+1} i &= \\left(\\sum_{i=1}^{k} i\\right) + (k+1) \\\\ &= \\frac{k(k+1)}{2} + (k+1) \\quad\\text{[by the hypothesis]}\\\\[4pt] &= \\frac{k(k+1)+2(k+1)}{2} \\\\ &= \\frac{(k+1)(k+2)}{2}. \\end{aligned}$$ This is exactly...`;

try {
  renderToStaticMarkup(
    <Markdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
    >
      {content}
    </Markdown>
  );
  console.log("No error!");
} catch (e) {
  console.log("Error during render:", e);
}
