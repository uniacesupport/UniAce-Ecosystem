import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

const content = `**Inductive step ($n=k+1$)** $$\n\\begin{aligned} \\sum_{i=1}^{k+1} i &= \\left(\\sum_{i=1}^{k} i\\right) + (k+1) \\\\ &= \\frac{k(k+1)}{2} + (k+1) \\quad\\text{[by the hypothesis]}\\\\[4pt] &= \\frac{k(k+1)+2(k+1)}{2} \\\\ &= \\frac{(k+1)(k+2)}{2}. \\end{aligned}$$ This is exactly`;

async function run() {
  const file = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex, { strict: false })
    .use(rehypeStringify)
    .process(content);
  
  console.log(String(file));
}

run();
