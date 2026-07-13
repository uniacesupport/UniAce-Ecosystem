import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeStringify);

const text1 = "**Electric Flux ( $$\\Phi_E$$ )**";
const text2 = "text $$\\Phi_E$$ text";

Promise.all([
  processor.process(text1),
  processor.process(text2)
]).then(([file1, file2]) => {
  console.log("1:", String(file1));
  console.log("2:", String(file2));
});
