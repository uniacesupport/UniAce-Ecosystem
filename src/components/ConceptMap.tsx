import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Module, SubTopic } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Maximize2, Info, BookOpen, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ConceptMapProps {
  syllabus: Module[];
  onSubTopicSelect: (subTopicId: string) => void;
  onClose: () => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  color: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

export default function ConceptMap({ syllabus, onSubTopicSelect, onClose }: ConceptMapProps) {
  const { user } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current || !syllabus || !syllabus.length) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    // Prepare data
    const nodes: Node[] = [];
    const links: Link[] = [];

    const moduleColors = [
      '#10b981', // emerald
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#f59e0b', // amber
      '#ef4444', // red
      '#06b6d4', // cyan
      '#ec4899', // pink
    ];

    (syllabus || []).forEach((module, mIdx) => {
      if (!module) return;
      const color = moduleColors[mIdx % moduleColors.length];
      (module.subTopics || []).forEach(st => {
        if (!st) return;
        nodes.push({
          id: st.id,
          title: st.title,
          moduleId: module.id,
          moduleTitle: module.title,
          color: color,
        });

        if (st.relatedTo && Array.isArray(st.relatedTo)) {
          st.relatedTo.forEach(relatedId => {
            links.push({
              source: st.id,
              target: relatedId,
            });
          });
        }
      });
    });

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Render links
    const link = g.append("g")
      .attr("stroke", "#e4e4e7")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    // Render nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d);
        event.stopPropagation();
      })
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", 8)
      .attr("fill", d => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("class", "shadow-sm");

    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(d => d.title)
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("fill", "#3f3f46")
      .attr("class", "pointer-events-none select-none");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [syllabus]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 dark:bg-zinc-100 p-2 rounded-xl text-white dark:text-zinc-900">
            <Maximize2 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Interactive Concept Map</h2>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Visualizing Biological Relationships</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
        >
          <X size={24} />
        </button>
      </header>

      {/* Main Map Area */}
      <div ref={containerRef} className="flex-1 relative bg-zinc-50 dark:bg-zinc-900/50">
        <svg ref={svgRef} className="w-full h-full" />

        {/* Controls */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-2">
          <button className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 transition-all">
            <ZoomIn size={20} />
          </button>
          <button className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 transition-all">
            <ZoomOut size={20} />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-8 left-8 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl shadow-xl max-w-xs">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Module Legend</h3>
          <div className="space-y-2">
            {(syllabus || []).map((module, idx) => (
              <div key={module.id || idx} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'][idx % 7] }} 
                />
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 truncate">{module.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Node Info Overlay */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-8 right-8 w-80 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      <BookOpen size={10} />
                      <span>{selectedNode.moduleTitle}</span>
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">
                      {selectedNode.title}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full text-zinc-400"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={14} className="text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Concept Insight</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    This topic is a fundamental building block in {selectedNode.moduleTitle}. Understanding it is crucial for mastering related concepts.
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSubTopicSelect(selectedNode.id);
                    onClose();
                  }}
                  className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-white transition-all active:scale-95"
                >
                  <Brain size={18} />
                  <span>Study This Concept</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Instructions */}
      <footer className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
          <span>Drag nodes to explore</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
          <span>Scroll to zoom</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
          <span>Click concept for details</span>
        </div>
      </footer>
    </div>
  );
}
