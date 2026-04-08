import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class MathErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Math Rendering Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-auto">Failed to render mathematical content. Displaying raw text instead.</div>;
    }
    return this.props.children;
  }
}

interface MarkdownRendererProps {
  content?: string;
  className?: string;
}

export default function MarkdownRenderer({ content = '', className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none markdown-body ${className}`}>
      <MathErrorBoundary fallback={<div className="whitespace-pre-wrap font-mono text-sm opacity-80">{content}</div>}>
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
      </MathErrorBoundary>
    </div>
  );
}
