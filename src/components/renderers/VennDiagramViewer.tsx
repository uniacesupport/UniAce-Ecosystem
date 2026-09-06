import React, { useMemo, useState } from 'react';
import { Copy, Check, Download, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface VennSet {
  name: string;
  label?: string;
  size?: number;
  elements?: (string | number)[];
  color?: string;
}

export interface VennIntersection {
  sets: string[]; // e.g. ['A', 'B'] or ['A', 'B', 'C']
  size?: number;
  elements?: (string | number)[];
  label?: string;
}

export interface VennDiagramData {
  title?: string;
  description?: string;
  sets: VennSet[];
  intersections?: VennIntersection[];
  universeSize?: number;
  universeLabel?: string;
}

interface VennDiagramViewerProps {
  code?: string;
  data?: VennDiagramData;
}

const DEFAULT_COLORS = [
  { fill: 'rgba(99, 102, 241, 0.35)', stroke: '#4f46e5', text: '#312e81', darkText: '#e0e7ff' }, // Indigo
  { fill: 'rgba(16, 185, 129, 0.35)', stroke: '#059669', text: '#064e3b', darkText: '#d1fae5' }, // Emerald
  { fill: 'rgba(245, 158, 11, 0.35)', stroke: '#d97706', text: '#78350f', darkText: '#fef3c7' }, // Amber
  { fill: 'rgba(236, 72, 153, 0.35)', stroke: '#db2777', text: '#831843', darkText: '#fce7f3' }, // Pink
];

export default function VennDiagramViewer({ code, data }: VennDiagramViewerProps) {
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Parse code if provided as JSON or custom DSL
  const parsedData: VennDiagramData = useMemo(() => {
    if (data) return data;
    if (!code) {
      return {
        title: 'Sample Two-Set Venn Diagram',
        sets: [
          { name: 'A', label: 'Set A (Math)', size: 10, elements: ['Algebra', 'Calculus', 'Trig'] },
          { name: 'B', label: 'Set B (Physics)', size: 12, elements: ['Mechanics', 'Waves', 'Optics'] }
        ],
        intersections: [
          { sets: ['A', 'B'], size: 5, label: 'A ∩ B', elements: ['Vectors', 'Differential Eq'] }
        ]
      };
    }

    try {
      const trimmed = code.trim();
      if (trimmed.startsWith('{')) {
        return JSON.parse(trimmed);
      }

      // Parse simple line-based syntax:
      // Title: Student Enrollment
      // Set A: Math = 25 (Calculus, Algebra)
      // Set B: Physics = 20 (Thermodynamics, Waves)
      // Set C: CS = 30 (Algorithms, Data Structures)
      // A & B: 8
      // B & C: 6
      // A & C: 7
      // A & B & C: 3
      const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
      let title = 'Venn Diagram';
      const sets: VennSet[] = [];
      const intersections: VennIntersection[] = [];

      for (const line of lines) {
        if (line.toLowerCase().startsWith('title:')) {
          title = line.replace(/title:/i, '').trim();
          continue;
        }

        // Check for intersection: A & B: 5 or A and B = 5
        const intersectMatch = line.match(/^([A-Za-z0-9_\s&,+]+)(?::|=)\s*([0-9]+)?(?:\s*\((.*?)\))?/);
        if (line.includes('&') || line.toLowerCase().includes(' and ') || line.includes('∩')) {
          const parts = line.split(/[:=]/);
          const left = parts[0] || '';
          const right = parts[1] || '';
          const setNames = left.split(/&|\band\b|∩/i).map(s => s.trim().replace(/^Set\s+/i, ''));
          const sizeMatch = right.match(/(\d+)/);
          const elementsMatch = right.match(/\((.*?)\)/);
          const elements = elementsMatch ? elementsMatch[1].split(',').map(e => e.trim()) : undefined;

          intersections.push({
            sets: setNames,
            size: sizeMatch ? parseInt(sizeMatch[1], 10) : undefined,
            elements,
            label: setNames.join(' ∩ ')
          });
          continue;
        }

        // Check for set: Set A: Calculus = 20 (x, y, z) or A: Math
        const setMatch = line.match(/^(?:Set\s+)?([A-Za-z0-9_]+)\s*(?::|=)\s*(.+)$/i);
        if (setMatch) {
          const name = setMatch[1].trim();
          const rest = setMatch[2].trim();
          const sizeMatch = rest.match(/(\d+)/);
          const elementsMatch = rest.match(/\((.*?)\)/);
          const elements = elementsMatch ? elementsMatch[1].split(',').map(e => e.trim()) : undefined;
          let label = rest.replace(/\(.*?\)/, '').replace(/=\s*\d+/, '').trim();
          if (!label) label = `Set ${name}`;

          sets.push({
            name,
            label,
            size: sizeMatch ? parseInt(sizeMatch[1], 10) : undefined,
            elements
          });
        }
      }

      if (sets.length === 0) {
        // Fallback default
        return {
          title,
          sets: [
            { name: 'A', label: 'Set A', size: 10 },
            { name: 'B', label: 'Set B', size: 10 }
          ],
          intersections: [{ sets: ['A', 'B'], size: 4 }]
        };
      }

      return { title, sets, intersections };
    } catch (err) {
      console.warn('Failed to parse Venn diagram code:', err);
      return {
        title: 'Venn Diagram',
        sets: [
          { name: 'A', label: 'Set A' },
          { name: 'B', label: 'Set B' }
        ],
        intersections: [{ sets: ['A', 'B'] }]
      };
    }
  }, [code, data]);

  const numSets = Math.min(Math.max(parsedData.sets.length, 2), 3);

  // SVG Geometry Calculations
  const width = 540;
  const height = numSets === 3 ? 420 : 320;
  const radius = numSets === 3 ? 115 : 120;

  // Center coordinates for sets
  const setGeometry = useMemo(() => {
    if (numSets === 2) {
      return [
        { cx: 210, cy: 160, r: radius, name: parsedData.sets[0]?.name || 'A' },
        { cx: 330, cy: 160, r: radius, name: parsedData.sets[1]?.name || 'B' }
      ];
    } else {
      // 3 sets: equilateral layout
      return [
        { cx: 210, cy: 165, r: radius, name: parsedData.sets[0]?.name || 'A' }, // Left
        { cx: 330, cy: 165, r: radius, name: parsedData.sets[1]?.name || 'B' }, // Right
        { cx: 270, cy: 265, r: radius, name: parsedData.sets[2]?.name || 'C' }  // Bottom
      ];
    }
  }, [numSets, radius, parsedData.sets]);

  // Label and Value Positions
  const labelPositions = useMemo(() => {
    if (numSets === 2) {
      const setA = parsedData.sets[0];
      const setB = parsedData.sets[1];
      const interAB = parsedData.intersections?.find(i => 
        i.sets.includes(setA?.name) && i.sets.includes(setB?.name)
      );

      return {
        onlyA: { x: 155, y: 160, label: setA?.label || 'Set A', size: setA?.size, elements: setA?.elements },
        onlyB: { x: 385, y: 160, label: setB?.label || 'Set B', size: setB?.size, elements: setB?.elements },
        bothAB: { x: 270, y: 160, label: interAB?.label || 'A ∩ B', size: interAB?.size, elements: interAB?.elements }
      };
    } else {
      // 3-set positions
      const setA = parsedData.sets[0];
      const setB = parsedData.sets[1];
      const setC = parsedData.sets[2];

      const interAB = parsedData.intersections?.find(i => i.sets.length === 2 && i.sets.includes(setA?.name) && i.sets.includes(setB?.name));
      const interAC = parsedData.intersections?.find(i => i.sets.length === 2 && i.sets.includes(setA?.name) && i.sets.includes(setC?.name));
      const interBC = parsedData.intersections?.find(i => i.sets.length === 2 && i.sets.includes(setB?.name) && i.sets.includes(setC?.name));
      const interABC = parsedData.intersections?.find(i => i.sets.length === 3 || (i.sets.includes(setA?.name) && i.sets.includes(setB?.name) && i.sets.includes(setC?.name)));

      return {
        onlyA: { x: 160, y: 135, label: setA?.label || 'Set A', size: setA?.size, elements: setA?.elements },
        onlyB: { x: 380, y: 135, label: setB?.label || 'Set B', size: setB?.size, elements: setB?.elements },
        onlyC: { x: 270, y: 345, label: setC?.label || 'Set C', size: setC?.size, elements: setC?.elements },
        interAB: { x: 270, y: 135, label: interAB?.label || 'A ∩ B', size: interAB?.size, elements: interAB?.elements },
        interAC: { x: 210, y: 235, label: interAC?.label || 'A ∩ C', size: interAC?.size, elements: interAC?.elements },
        interBC: { x: 330, y: 235, label: interBC?.label || 'B ∩ C', size: interBC?.size, elements: interBC?.elements },
        interABC: { x: 270, y: 205, label: interABC?.label || 'A ∩ B ∩ C', size: interABC?.size, elements: interABC?.elements }
      };
    }
  }, [numSets, parsedData]);

  const handleCopyCode = async () => {
    const exportText = code || JSON.stringify(parsedData, null, 2);
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    const svgEl = document.getElementById(`venn-svg-${parsedData.title?.replace(/\s+/g, '-') || 'diagram'}`);
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `venn-diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-6 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 shadow-sm overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-slate-900 dark:text-zinc-100 text-[12px]">
            {parsedData.title || 'Venn Diagram'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">
            {numSets}-Set Overlap
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.min(z + 0.15, 1.8))}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.15, 0.6))}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={handleDownloadSvg}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Download SVG"
          >
            <Download size={14} />
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors text-[11px]"
            title="Copy Diagram Source"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Source'}</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="p-4 sm:p-6 flex items-center justify-center overflow-x-auto bg-slate-50/40 dark:bg-zinc-900/50">
        <div 
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
          className="w-full max-w-[540px] flex justify-center"
        >
          <div ref={chartRef} className="venn-diagram-container" />
        </div>
      </div>

      {/* Legend & Elements Breakdown */}
      {parsedData.sets.some(s => s.elements && s.elements.length > 0) && (
        <div className="px-4 py-3 bg-slate-50/70 dark:bg-zinc-800/80 border-t border-slate-200 dark:border-zinc-700 flex flex-wrap gap-4 text-xs">
          {parsedData.sets.map((s, idx) => (
            <div key={s.name} className="flex items-start gap-2">
              <span 
                className="w-3 h-3 rounded-full mt-0.5 shrink-0" 
                style={{ backgroundColor: DEFAULT_COLORS[idx % DEFAULT_COLORS.length].stroke }}
              />
              <div>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{s.label || s.name}:</span>{' '}
                <span className="text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                  {s.elements?.join(', ') || 'No listed elements'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
