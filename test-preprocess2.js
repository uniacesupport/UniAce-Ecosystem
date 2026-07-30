import fs from 'fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

let code = fs.readFileSync('src/components/MarkdownRenderer.tsx', 'utf8');
// Convert TS to JS by simply running esbuild on it first
