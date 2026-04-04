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
  // Pre-process content to ensure LaTeX delimiters are correctly handled
  // AI often uses $...$ for inline math, but remark-math sometimes needs a little help
  // We also ensure there's a space before/after inline math if it's touching text
  const processedContent = content
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');

  const components = {
    code({ node, inline, className, children, ...props }: any) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none markdown-body ${className}`}>
      <Markdown 
        components={components}
        remarkPlugins={[remarkMath, remarkGfm]} 
        rehypePlugins={[
          [rehypeKatex, { strict: false, trust: true }],
          [rehypeHighlight, { ignoreMissing: true }]
        ]}
      >
        {processedContent}
      </Markdown>
    </div>
  );
}
