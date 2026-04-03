import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle, RefreshCw, Loader2, Info } from 'lucide-react';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  mindmap: {
    useMaxWidth: true,
  },
});

interface MermaidProps {
  chart: string;
}

/**
 * Advanced Mermaid Sanitizer
 * Fixes common AI-generated syntax errors dynamically.
 */
const sanitizeMermaid = (chart: string): string => {
  if (!chart) return '';
  
  let sanitized = chart.trim();

  // 1. Remove markdown code block wrappers if they exist
  sanitized = sanitized.replace(/^```mermaid\n?/, '').replace(/\n?```$/, '');
  
  // 2. Ensure it starts with a valid diagram type
  const validTypes = ['flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'mindmap', 'timeline'];
  const firstLine = sanitized.split('\n')[0].trim();
  const hasValidType = validTypes.some(type => firstLine.startsWith(type));
  
  if (!hasValidType) {
    // Default to flowchart if missing
    sanitized = 'flowchart TD\n' + sanitized;
  }

  // 3. Fix mindmap syntax (common AI error: missing quotes for nodes with spaces)
  if (sanitized.includes('mindmap')) {
    const lines = sanitized.split('\n');
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0) {
        processedLines.push(line);
        continue;
      }
      
      const indentMatch = line.match(/^(\s+)(.+)$/);
      if (indentMatch) {
        const indent = indentMatch[1];
        let content = indentMatch[2].trim();
        
        // Fix: If AI put multiple nodes on one line like "Node 1" "Node 2"
        if (content.match(/"[^"]+"\s+"[^"]+"/)) {
          const parts = content.match(/"[^"]+"/g);
          if (parts) {
            parts.forEach(part => processedLines.push(indent + part));
            continue;
          }
        }

        // If it's not already quoted or in parentheses/brackets, and contains spaces or special chars
        if (!content.startsWith('"') && 
            !content.startsWith('(') && 
            !content.startsWith('[') && 
            !content.startsWith('{') &&
            (content.includes(' ') || content.includes('(') || content.includes(')'))) {
          
          // Handle cases where AI put parentheses inside but not around the whole thing
          content = `"${content.replace(/"/g, "'")}"`;
        }
        processedLines.push(`${indent}${content}`);
      } else {
        processedLines.push(line);
      }
    }
    sanitized = processedLines.join('\n');
  }

  // 4. Fix flowchart node syntax (common AI error: A[Text with (brackets)] -> A["Text with (brackets)"])
  if (sanitized.includes('flowchart') || sanitized.includes('graph')) {
    // Find nodes like A[Text] and ensure Text is quoted if it has special chars
    sanitized = sanitized.replace(/([a-zA-Z0-9_-]+)\[(.*?)\]/g, (match, id, text) => {
      if (text.includes('(') || text.includes(')') || text.includes('[') || text.includes(']') || text.includes('"')) {
        if (!text.startsWith('"')) return `${id}["${text.replace(/"/g, "'")}"]`;
      }
      return match;
    });
  }

  // 5. Remove any trailing semicolons (Mermaid doesn't like them in some places)
  sanitized = sanitized.replace(/;$/gm, '');

  return sanitized;
};

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setError(null);
    setIsRendering(true);

    const renderChart = async () => {
      if (!containerRef.current) return;

      try {
        const sanitizedChart = sanitizeMermaid(chart);
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        
        // Clear previous content
        containerRef.current.innerHTML = '';
        
        const { svg } = await mermaid.render(id, sanitizedChart);
        
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          // Try one more time with a very aggressive sanitization if it failed
          if (retryCount === 0) {
            setRetryCount(1);
            return;
          }
          setError(err.message || 'Failed to render diagram');
        }
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(renderChart, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [chart, retryCount]);

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    setIsRendering(true);
  };

  if (error) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 my-8 transition-all">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-full">
            <Info className="text-amber-600 dark:text-amber-400" size={24} />
          </div>
          <div className="max-w-md">
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Visual Summary Unavailable</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              We encountered a minor formatting issue while drawing this diagram. You can still read the structured data below.
            </p>
          </div>
          
          <button 
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-95"
          >
            <RefreshCw size={14} className={isRendering ? 'animate-spin' : ''} />
            Try to Repair
          </button>

          <details className="w-full mt-4">
            <summary className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer hover:text-zinc-600 transition-colors">
              View Technical Details
            </summary>
            <div className="mt-3 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 text-left">
              <p className="text-[10px] font-mono text-red-500 mb-2">{error}</p>
              <pre className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                {chart}
              </pre>
            </div>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group my-8">
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-[2px] rounded-2xl z-10">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
        </div>
      )}
      <div 
        ref={containerRef} 
        className={`mermaid-container flex justify-center p-6 bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 transition-opacity duration-300 ${isRendering ? 'opacity-0' : 'opacity-100'}`} 
      />
    </div>
  );
};

export default Mermaid;
