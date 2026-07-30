import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

const content = `**Inductive step ($n=k+1$)** $$\n\\sum_{i=1}^{k+1} i &= \\frac{1}{2} \\end{aligned}$$ This is exactly`;

async function run() {
  try {
    const file = await unified()
      .use(remarkParse)
      .use(remarkMath)
      .use(remarkRehype)
      .use(rehypeKatex, { strict: false, throwOnError: false, errorColor: '#ef4444' })
      .use(rehypeStringify)
      .process(content);
    
    console.log(String(file));
  } catch (e) {
    console.log("THREW ERROR!", e);
  }
}

run();
