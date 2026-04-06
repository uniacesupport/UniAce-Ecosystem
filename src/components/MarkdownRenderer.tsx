import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content?: string;
  className?: string;
}

export default function MarkdownRenderer({ content = '', className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none markdown-body ${className}`}>
      <Markdown 
        children={content}
        remarkPlugins={[remarkMath, remarkGfm]} 
        rehypePlugins={[
          [rehypeKatex, { 
            strict: false, 
            trust: true,
            throwOnError: false,
            errorColor: '#ef4444' // Tailwind red-500
          }],
          [rehypeHighlight, { ignoreMissing: true }]
        ]}
      />
    </div>
  );
}
