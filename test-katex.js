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

const text = "area $A\\ $ separated by a distance $d\\ $ . The electric field... where $E\\ $ is the magnitude... (angle $\\theta = 90^\\circ$)";

processor.process(text).then((file) => {
  console.log(String(file));
});
