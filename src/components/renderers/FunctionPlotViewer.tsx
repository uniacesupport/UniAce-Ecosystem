import React, { useEffect, useRef, useState } from 'react';
import functionPlot from 'function-plot';
import { Activity, RefreshCw, ZoomIn, ZoomOut, RotateCcw, AlertCircle } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';

interface FunctionPlotViewerProps {
  code: string;
}

export default function FunctionPlotViewer({ code }: FunctionPlotViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [formulas, setFormulas] = useState<string[]>([]);
  const [xDomain, setXDomain] = useState<[number, number]>([-10, 10]);
  const [yDomain, setYDomain] = useState<[number, number]>([-10, 10]);

  useEffect(() => {
    if (!containerRef.current) return;
    setError(null);

    // Parse options from code
    // Code can be lines of equations like:
    // y = x^2 - 4
    // sin(x)
    // or JSON options
    const cleanLines = code
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('//'));

    if (cleanLines.length === 0) return;

    const parsedFunctions: { fn: string; color?: string; graphType?: 'polyline' }[] = [];
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

    cleanLines.forEach((line, idx) => {
      // Remove "y =" or "f(x) ="
      let fnStr = line.replace(/^(y|f\(x\))\s*=\s*/i, '').trim();
      parsedFunctions.push({
        fn: fnStr,
        color: colors[idx % colors.length],
        graphType: 'polyline'
      });
    });

    setFormulas(parsedFunctions.map(p => p.fn));

    try {
      const width = Math.min(containerRef.current.clientWidth || 500, 700);
      const height = Math.min(Math.round(width * 0.65), 400);

      containerRef.current.innerHTML = '';
      functionPlot({
        target: containerRef.current,
        width,
        height,
        grid: true,
        xAxis: { domain: xDomain },
        yAxis: { domain: yDomain },
        data: parsedFunctions.map(f => ({
          fn: f.fn,
          color: f.color,
          sampler: 'builtIn',
          graphType: 'polyline'
        }))
      });
    } catch (err: any) {
      console.warn('FunctionPlot evaluation error:', err);
      setError(err?.message || 'Invalid mathematical function expression');
    }
  }, [code, xDomain, yDomain]);

  const handleResetZoom = () => {
    setXDomain([-10, 10]);
    setYDomain([-10, 10]);
  };

  return (
    <div className="my-6 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold uppercase tracking-wider text-[11px] text-slate-800 dark:text-zinc-200">
            Interactive Function Graph
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setXDomain([xDomain[0] * 0.75, xDomain[1] * 0.75]);
              setYDomain([yDomain[0] * 0.75, yDomain[1] * 0.75]);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => {
              setXDomain([xDomain[0] * 1.35, xDomain[1] * 1.35]);
              setYDomain([yDomain[0] * 1.35, yDomain[1] * 1.35]);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors text-[11px]"
            title="Reset View"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>

      {/* Equations Legend */}
      {formulas.length > 0 && (
        <div className="px-4 py-2 bg-slate-50/50 dark:bg-zinc-900/40 border-b border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-3 text-xs">
          {formulas.map((fn, idx) => (
            <div key={idx} className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'][idx % 5] }}
              />
              <span className="font-mono font-semibold text-slate-700 dark:text-zinc-200">
                f{idx + 1}(x) = {fn}
              </span>
            </div>
          ))}
        </div>
      )}

      {error ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-mono">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertCircle size={14} />
            Graph Plotting Error
          </div>
          <p>{error}</p>
        </div>
      ) : (
        <div className="p-4 flex items-center justify-center overflow-x-auto bg-white dark:bg-zinc-900/60">
          <div ref={containerRef} className="function-plot-canvas select-none" />
        </div>
      )}
    </div>
  );
}
