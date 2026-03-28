import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Calculator as CalcIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Calculator({ isOpen, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 350, y: 100 });
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Handle window resize to keep calculator on screen
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(Math.max(20, prev.x), window.innerWidth - (isExpanded ? 400 : 320)),
        y: Math.min(Math.max(20, prev.y), window.innerHeight - 500)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag if clicking a button
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleInput = (val: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const calculate = () => {
    try {
      // Replace symbols for evaluation
      let evalStr = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**');

      // Handle trig functions (assume degrees and convert to radians)
      evalStr = evalStr.replace(/sin\(([^)]+)\)/g, (_, angle) => `Math.sin((${angle}) * Math.PI / 180)`);
      evalStr = evalStr.replace(/cos\(([^)]+)\)/g, (_, angle) => `Math.cos((${angle}) * Math.PI / 180)`);
      evalStr = evalStr.replace(/tan\(([^)]+)\)/g, (_, angle) => `Math.tan((${angle}) * Math.PI / 180)`);
      
      // Handle other functions
      evalStr = evalStr.replace(/log\(/g, 'Math.log10(');
      evalStr = evalStr.replace(/ln\(/g, 'Math.log(');
      evalStr = evalStr.replace(/√\(/g, 'Math.sqrt(');

      // Auto-close parentheses
      let openParentheses = (evalStr.match(/\(/g) || []).length;
      let closeParentheses = (evalStr.match(/\)/g) || []).length;
      while (openParentheses > closeParentheses) {
        evalStr += ')';
        closeParentheses++;
      }

      // Basic safety check before eval
      // Allow numbers, operators, parentheses, dots, spaces, and Math functions
      if (/[^0-9+\-*/(). Math.a-z]/i.test(evalStr) || evalStr.trim() === '') {
        throw new Error('Invalid characters');
      }

      // eslint-disable-next-line no-eval
      const result = eval(evalStr);
      
      if (!isFinite(result) || isNaN(result)) {
        throw new Error('Math Error');
      }

      setEquation(display + ' =');
      
      // Format result to avoid long decimals
      const formattedResult = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(10)).toString();
      setDisplay(formattedResult);
    } catch (error) {
      setDisplay('Error');
      setEquation('');
    }
  };

  const basicButtons = [
    ['C', 'DEL', '(', ')'],
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+']
  ];

  const scientificButtons = [
    ['sin(', 'cos(', 'tan('],
    ['log(', 'ln(', 'e'],
    ['π', '√(', '^']
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{ left: position.x, top: position.y }}
        className="fixed z-[100] shadow-2xl rounded-3xl overflow-hidden border border-slate-200 bg-white"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Header (Draggable Area) */}
        <div className="bg-slate-900 text-white p-3 flex items-center justify-between cursor-move select-none">
          <div className="flex items-center gap-2 px-2">
            <CalcIcon size={16} className="text-emerald-400" />
            <span className="text-sm font-bold tracking-wide">Calculator</span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-slate-400"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Display */}
        <div className="bg-slate-50 p-6 border-b border-slate-200 text-right select-none">
          <div className="text-slate-500 text-sm h-5 mb-1 font-mono tracking-wider overflow-hidden text-ellipsis whitespace-nowrap">
            {equation}
          </div>
          <div className="text-4xl font-light text-slate-900 font-mono tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 flex gap-4 select-none">
          {isExpanded && (
            <div className="grid grid-cols-3 gap-2 border-r border-slate-200 pr-4">
              {scientificButtons.map((row, i) => (
                <React.Fragment key={i}>
                  {row.map(btn => (
                    <button
                      key={btn}
                      onClick={() => handleInput(btn)}
                      className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors text-sm"
                    >
                      {btn.replace('(', '')}
                    </button>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {basicButtons.map((row, i) => (
              <React.Fragment key={i}>
                {row.map(btn => (
                  <button
                    key={btn}
                    onClick={() => {
                      if (btn === 'C') handleClear();
                      else if (btn === 'DEL') handleDelete();
                      else if (btn === '=') calculate();
                      else handleInput(btn);
                    }}
                    className={`w-14 h-14 rounded-xl font-medium text-lg transition-colors ${
                      btn === '=' ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm' :
                      ['C', 'DEL'].includes(btn) ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                      ['÷', '×', '-', '+'].includes(btn) ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' :
                      'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
