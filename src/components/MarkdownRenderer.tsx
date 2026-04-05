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
  // Pre-process content to handle literal \n strings that might have leaked through
  const processedContent = content.replace(/\\n/g, '\n');

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none markdown-body ${className}`}>
      <Markdown 
        children={processedContent}
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
