import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, Download, AlertTriangle, RefreshCw, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
  themeVariables: {
    fontSize: '14px',
    primaryColor: '#6366f1',
    primaryTextColor: '#1e293b',
    primaryBorderColor: '#cbd5e1',
    lineColor: '#64748b',
    secondaryColor: '#f8fafc',
    tertiaryColor: '#ffffff'
  }
});

interface MermaidViewerProps {
  chart: string;
}

export default function MermaidViewer({ chart }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!chart.trim()) return;
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      try {
        setHasError(false);
        const { svg } = await mermaid.render(id, chart.trim());
        if (isMounted) {
          setSvgContent(svg);
          setIsRendered(true);
        }
      } catch (err) {
        console.warn('Mermaid rendering failed, falling back:', err);
        if (isMounted) {
          setHasError(true);
        }
      }
    };

    renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (hasError) {
    return (
      <div className="my-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-mono">
        <div className="flex items-center gap-2 font-bold mb-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle size={16} />
          <span>Diagram Source (Raw Format)</span>
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="my-6 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 shadow-sm overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-indigo-600 dark:text-indigo-400">
          Visual Diagram
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.min(z + 0.15, 2.0))}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.15, 0.5))}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleDownloadSvg}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Download SVG"
          >
            <Download size={14} />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Copy Diagram Code"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Source'}</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div 
        ref={containerRef}
        className="p-6 overflow-x-auto flex items-center justify-center min-h-[140px] bg-slate-50/50 dark:bg-zinc-900/40"
      >
        {svgContent ? (
          <div 
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
            dangerouslySetInnerHTML={{ __html: svgContent }} 
            className="mermaid-svg-wrapper flex justify-center max-w-full"
          />
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500 animate-pulse">
            <RefreshCw className="animate-spin" size={14} />
            Rendering visual flowchart...
          </div>
        )}
      </div>
    </div>
  );
}
