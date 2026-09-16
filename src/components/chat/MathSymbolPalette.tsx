import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface MathSymbolPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSymbol: (symbol: string) => void;
}

const MATH_SYMBOLS = [
  { category: 'Calculus & Algebra', symbols: [
    { label: '∫', insert: '\\int_{a}^{b} f(x)\\,dx', desc: 'Definite Integral' },
    { label: '∑', insert: '\\sum_{i=1}^{n} ', desc: 'Summation' },
    { label: 'd/dx', insert: '\\frac{d}{dx}', desc: 'Derivative' },
    { label: '∂/∂x', insert: '\\frac{\\partial}{\\partial x}', desc: 'Partial Derivative' },
    { label: 'lim', insert: '\\lim_{x \\to 0} ', desc: 'Limit' },
    { label: '√x', insert: '\\sqrt{x}', desc: 'Square Root' },
    { label: 'x/y', insert: '\\frac{a}{b}', desc: 'Fraction' },
    { label: 'xⁿ', insert: 'x^{2}', desc: 'Exponent' },
    { label: 'xₙ', insert: 'x_{n}', desc: 'Subscript' },
    { label: '∞', insert: '\\infty', desc: 'Infinity' },
  ]},
  { category: 'Greek & Constants', symbols: [
    { label: 'α', insert: '\\alpha', desc: 'Alpha' },
    { label: 'β', insert: '\\beta', desc: 'Beta' },
    { label: 'θ', insert: '\\theta', desc: 'Theta' },
    { label: 'λ', insert: '\\lambda', desc: 'Lambda' },
    { label: 'μ', insert: '\\mu', desc: 'Mu' },
    { label: 'π', insert: '\\pi', desc: 'Pi' },
    { label: 'σ', insert: '\\sigma', desc: 'Sigma' },
    { label: 'Δ', insert: '\\Delta', desc: 'Delta' },
    { label: 'Ω', insert: '\\Omega', desc: 'Omega' },
  ]},
  { category: 'Relations & Logic', symbols: [
    { label: '±', insert: '\\pm', desc: 'Plus-Minus' },
    { label: '≈', insert: '\\approx', desc: 'Approximately' },
    { label: '≠', insert: '\\neq', desc: 'Not Equal' },
    { label: '≤', insert: '\\le', desc: 'Less or Equal' },
    { label: '≥', insert: '\\ge', desc: 'Greater or Equal' },
    { label: '∈', insert: '\\in', desc: 'Element of' },
    { label: '⊆', insert: '\\subseteq', desc: 'Subset of' },
    { label: '⇒', insert: '\\implies', desc: 'Implies' },
    { label: '⇔', insert: '\\iff', desc: 'If and only if' },
  ]}
];

export const MathSymbolPalette: React.FC<MathSymbolPaletteProps> = ({ isOpen, onClose, onInsertSymbol }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="mb-3 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-20"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              📐 Mathematical Symbols & LaTeX
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold">
              Instant Insert
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-2.5">
          {MATH_SYMBOLS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase">
                {group.category}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {group.symbols.map((item, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => onInsertSymbol(item.insert)}
                    title={`${item.desc}: ${item.insert}`}
                    className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-50 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 transition-all active:scale-95 shadow-2xs"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MathSymbolPalette;
