import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle } from 'lucide-react';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setError(null);

    const renderChart = async () => {
      if (containerRef.current) {
        try {
          // Generate a unique ID for the diagram to avoid conflicts
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (err: any) {
          console.error('Mermaid rendering error:', err);
          if (isMounted) {
            setError(err.message || 'Failed to render diagram');
          }
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 my-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Diagram Rendering Error</h4>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono break-all">{error}</p>
            <div className="mt-3 bg-white dark:bg-slate-900 rounded border border-red-100 dark:border-red-800/50 p-2 overflow-x-auto">
              <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{chart}</pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid-container flex justify-center my-6" />;
};

export default Mermaid;
