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

function fixMarkdownTables(text: string): string {
  if (!text) return '';
  
  // Split content by newlines to inspect line-by-line
  const lines = text.split('\n');
  const processedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if the line is a compressed table:
    // It contains multiple row dividers "| |" or "||" and has many pipes
    const pipeCount = (line.match(/\|/g) || []).length;
    const hasRowDividers = /\|\s*\|/g.test(line);
    
    if (pipeCount > 8 && hasRowDividers) {
      // Split the compressed line into separate row chunks
      const chunks = line.split(/\s*\|\s*\|\s*/);
      
      const reconstructedRows = chunks.map((chunk) => {
        let trimmed = chunk.trim();
        if (!trimmed) return '';
        
        // Ensure row starts with pipe
        if (!trimmed.startsWith('|')) {
          trimmed = '| ' + trimmed;
        }
        // Ensure row ends with pipe
        if (!trimmed.endsWith('|')) {
          trimmed = trimmed + ' |';
        }
        return trimmed;
      }).filter(Boolean);
      
      processedLines.push(...reconstructedRows);
    } else {
      processedLines.push(line);
    }
  }
  
  const processedText = processedLines.join('\n');
  
  // Now align columns of any table in the text
  const finalLines = processedText.split('\n');
  const alignedLines: string[] = [];
  let inTable = false;
  let tableHeaderCols = 0;
  
  for (let i = 0; i < finalLines.length; i++) {
    const line = finalLines[i].trim();
    const isTableRow = line.startsWith('|') && line.endsWith('|') && (line.match(/\|/g) || []).length > 1;
    
    if (isTableRow) {
      // Split by pipe, remove empty first and last elements
      const rawCols = line.split('|').map(c => c.trim());
      const cols = rawCols.slice(1, rawCols.length - 1);
      
      if (!inTable) {
        inTable = true;
        tableHeaderCols = cols.length;
        alignedLines.push(line);
      } else {
        const isSeparator = cols.every(col => /^[:\s-]*$/.test(col));
        if (isSeparator) {
          let adjustedCols = [...cols];
          if (adjustedCols.length < tableHeaderCols) {
            while (adjustedCols.length < tableHeaderCols) {
              adjustedCols.push('---');
            }
          } else if (adjustedCols.length > tableHeaderCols) {
            adjustedCols = adjustedCols.slice(0, tableHeaderCols);
          }
          alignedLines.push('| ' + adjustedCols.join(' | ') + ' |');
        } else {
          let adjustedCols = [...cols];
          if (adjustedCols.length < tableHeaderCols) {
            while (adjustedCols.length < tableHeaderCols) {
              adjustedCols.push('');
            }
          } else if (adjustedCols.length > tableHeaderCols) {
            adjustedCols = adjustedCols.slice(0, tableHeaderCols);
          }
          alignedLines.push('| ' + adjustedCols.join(' | ') + ' |');
        }
      }
    } else {
      inTable = false;
      tableHeaderCols = 0;
      alignedLines.push(finalLines[i]);
    }
  }
  
  return alignedLines.join('\n');
}

function preprocessMarkdownContent(text: string): string {
  if (!text) return '';

  // 0. Disable indented code blocks by reducing any indentation that is 4 or more spaces to 2 spaces
  // (unless it's inside a fenced code block with ```). This is because AI-generated lists/paragraphs
  // often get accidentally indented by 4+ spaces, which standard markdown renders as preformatted code blocks.
  const lines = text.split('\n');
  let inFencedCodeBlock = false;
  const processedLines = lines.map(line => {
    if (line.trim().startsWith('```')) {
      inFencedCodeBlock = !inFencedCodeBlock;
      return line;
    }
    if (inFencedCodeBlock) {
      return line;
    }
    const match = line.match(/^(\s+)(.*)/);
    if (match) {
      const indent = match[1];
      const rest = match[2];
      if (indent.includes('\t') || indent.length >= 4) {
        // Replace with 2 spaces to preserve nesting under list items without triggering indented code block
        return '  ' + rest;
      }
    }
    return line;
  });
  let processed = processedLines.join('\n');

  // 1. Convert any mistakenly wrapped single-line paragraphs from math formatting to normal text
  // If a block $ ... $ has 3 or more spaces, and lacks clear mathematical characters/indicators, strip the outer dollar signs.
  // CRITICAL: We restrict matching to single lines to prevent an unclosed single dollar sign from crossing line boundaries and consuming the entire document.
  processed = processed.replace(/\$([^$\n]+)\$/g, (match, p1) => {
    const trimmed = p1.trim();
    const spaceCount = (trimmed.match(/\s+/g) || []).length;
    const hasMathSymbols = /([=+\-*/^_{}\\]|\\frac|\\sqrt|\\sum|\\int|\\alpha|\\beta|\\theta|\\pi|\\sigma|\\lambda|\\delta|\\partial|\\infty|\\ge|\\le|\\ne|\\cdot|\\times)/.test(trimmed);
    
    if (spaceCount >= 3 && !hasMathSymbols) {
      return trimmed;
    }
    return match;
  });

  // 2. Also strip double dollar signs if used purely for a regular text paragraph
  processed = processed.replace(/\$\$([^$\n]+)\$\$/g, (match, p1) => {
    const trimmed = p1.trim();
    const spaceCount = (trimmed.match(/\s+/g) || []).length;
    const hasMathSymbols = /([=+\-*/^_{}\\]|\\frac|\\sqrt|\\sum|\\int|\\alpha|\\beta|\\theta|\\pi|\\sigma|\\lambda|\\delta|\\partial|\\infty|\\ge|\\le|\\ne|\\cdot|\\times)/.test(trimmed);
    
    if (spaceCount >= 3 && !hasMathSymbols) {
      return trimmed;
    }
    return match;
  });

  // 3. Fix unescaped backslashes that are followed by regular letters (but aren't real LaTeX commands)
  // This avoids KaTeX trying to interpret regular text containing \something (like \delocalized) as a math macro
  const validCommands = new Set([
    'frac', 'sqrt', 'sum', 'int', 'alpha', 'beta', 'theta', 'pi', 'sigma', 'lambda', 'delta', 'partial', 'infinity', 'infty', 'ge', 'le', 'ne', 'times', 'div', 'pm', 'mp', 'approx', 'equiv', 'cdots', 'dots', 'overline', 'underline', 'hat', 'bar', 'tilde', 'vec', 'text', 'left', 'right', 'begin', 'end', 'align', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix', 'cases', 'del', 'nabla', 'degree', 'sin', 'cos', 'tan', 'log', 'ln', 'lim', 'micro', 'mu', 'rho', 'phi', 'psi', 'omega', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'iota', 'kappa', 'nu', 'xi', 'omicron', 'tau', 'upsilon', 'chi', 'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega', 'cdot',
    'rightarrow', 'leftarrow', 'to', 'leftrightarrow', 'Rightarrow', 'Leftarrow', 'Leftrightarrow', 'mathrm', 'mathbf', 'mathit', 'mathsf', 'mathtt', 'mathcal', 'mathbb', 'mathfrak', 'ce', 'deg', 'leq', 'geq', 'neq', 'cong', 'propto', 'sim', 'subset', 'supset', 'subseteq', 'supseteq', 'in', 'ni', 'notin',
    'cup', 'cap', 'forall', 'exists', 'implies', 'iff', 'varnothing', 'emptyset', 'setminus'
  ]);

  processed = processed.replace(/\\([a-zA-Z]+)/g, (match, word) => {
    if (validCommands.has(word.toLowerCase())) {
      return match; // Keep valid LaTeX command
    }
    return word; // Strip backslash from regular word (e.g., \delocalized -> delocalized)
  });

  // 4. Fix missing backslashes for all math/logic/set keywords inside math blocks or interval notations
  const mathKeywords = [
    'cup', 'cap', 'subset', 'supset', 'subseteq', 'supseteq', 'in', 'notin', 
    'setminus', 'emptyset', 'varnothing', 'infty', 'forall', 'exists', 
    'implies', 'iff', 'to', 'le', 'leq', 'ge', 'geq', 'ne', 'neq', 
    'approx', 'times', 'pm', 'div', 'cdot', 'alpha', 'beta', 'gamma', 
    'delta', 'theta', 'omega', 'pi', 'sigma', 'mu', 'lambda', 'tau', 
    'phi', 'psi'
  ];

  const fixMathKeywords = (mathContent: string) => {
    let fixed = mathContent;
    for (const kw of mathKeywords) {
      const regex = new RegExp(`(?<!\\\\)\\b${kw}\\b`, 'g');
      fixed = fixed.replace(regex, `\\${kw}`);
    }
    return fixed;
  };

  // Inside $$...$$ block math
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, mathContent) => {
    return `$$${fixMathKeywords(mathContent)}$$`;
  });

  // Inside $...$ inline math
  processed = processed.replace(/\$([^$\n]+?)\$/g, (match, mathContent) => {
    return `$${fixMathKeywords(mathContent)}$`;
  });

  // For cases outside of math blocks that look exactly like interval notation (e.g. )cup( or ) cup ( )
  processed = processed.replace(/(?<=[)\]])\s*(cup|cap)\s*(?=[([\]])/gi, (match, p1) => {
    return p1.toLowerCase() === 'cup' ? '\\cup' : '\\cap';
  });

  return processed;
}

export default function MarkdownRenderer({ content = '', className = '' }: MarkdownRendererProps) {
  const preprocessedContent = fixMarkdownTables(preprocessMarkdownContent(content));

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none markdown-body ${className}`}>
      <MathErrorBoundary fallback={<div className="whitespace-pre-wrap font-mono text-sm opacity-80">{content}</div>}>
        <Markdown 
          children={preprocessedContent}
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
          components={{
            table: ({ node, ...props }) => (
              <div className="my-6 w-full overflow-x-auto rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm scrollbar-hide">
                <table className="w-full text-left border-collapse text-sm text-slate-600 dark:text-zinc-300" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-slate-50 dark:bg-zinc-800/40 border-b border-slate-200 dark:border-zinc-800 font-semibold text-slate-900 dark:text-white uppercase text-xs tracking-wider" {...props} />
            ),
            tbody: ({ node, ...props }) => (
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40" {...props} />
            ),
            tr: ({ node, ...props }) => (
              <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="px-5 py-3.5 font-black text-slate-700 dark:text-zinc-200" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-400 font-medium" {...props} />
            ),
          }}
        />
      </MathErrorBoundary>
    </div>
  );
}
