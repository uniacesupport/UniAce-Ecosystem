import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function sanitizeLatex(content: string): string {
  if (!content) return content;
  
  // 1. Replace \[ ... \] with $$ ... $$ for block math
  let sanitized = content.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$');
  
  // 2. Replace \( ... \) with $ ... $ for inline math
  sanitized = sanitized.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
  
  // 3. Fix common AI mistakes where it might double escape backslashes in raw markdown
  // or fail to escape them in a way that the renderer expects.
  // Most common: \\frac -> \frac
  sanitized = sanitized.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // 4. Ensure math blocks have newlines around them for better rendering
  sanitized = sanitized.replace(/\$\$([^\$]+)\$\$/g, (match, p1) => {
    return `\n\n$$\n${p1.trim()}\n$$\n\n`;
  });

  return sanitized;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const sanitizedContent = sanitizeLatex(content);
  
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
