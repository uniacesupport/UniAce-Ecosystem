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
  
  // 3. Fix common AI mistakes where it might double escape backslashes
  sanitized = sanitized.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // 4. Ensure math blocks have newlines around them for better rendering, but avoid double newlines
  sanitized = sanitized.replace(/\s*\$\$([^\$]+)\$\$\s*/g, (match, p1) => {
    return `\n$$\n${p1.trim()}\n$$\n`;
  });

  // 5. Heuristic: Wrap common LaTeX commands and mathematical patterns if they are not already wrapped in $ or $$
  // We split the content by math blocks to avoid touching things already inside them
  const parts = sanitized.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);
  
  const processedParts = parts.map(part => {
    // If this part is a math block, return it as is
    if (part.startsWith('$')) return part;

    let p = part;
    
    // Pattern 1: Common LaTeX commands
    p = p.replace(/\\(mathbf|vec|frac|sqrt|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\{?([^\s\}]*)\}?/g, (match) => {
      return `$${match}$`;
    });

    // Pattern 2: Variable assignments like a = (a_1, ...) or x = 5
    p = p.replace(/([a-zA-Z](?:_[a-zA-Z0-9]+)?\s*=\s*[^.,\s\n]+(?:[^.,\n]*[^.,\s\n])?)/g, (match) => {
      if (match.includes('_') || match.includes('(') || match.includes('\\') || match.includes('^')) {
        return `$${match}$`;
      }
      return match;
    });

    // Pattern 3: Subscripts like a_1, x_n
    p = p.replace(/([a-zA-Z]_[a-zA-Z0-9]+)/g, (match) => {
      return `$${match}$`;
    });

    return p;
  });

  return processedParts.join('');
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
