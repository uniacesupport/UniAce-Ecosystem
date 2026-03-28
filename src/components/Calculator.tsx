import React, { useState, useRef } from 'react';
import { X, Calculator as CalcIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCalculator } from '../context/CalculatorContext';
import { create, all } from 'mathjs';
import { sanitizeInput } from '../utils/calculatorUtils';

const math = create(all, {
  number: 'BigNumber',
  precision: 14
});

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Calculator({ isOpen, onClose }: CalculatorProps) {
  const { display, equation, setDisplay, setEquation } = useCalculator();
  const [isScientific, setIsScientific] = useState(false);
  const [isShift, setIsShift] = useState(false);
  const [errorText, setErrorText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (val: string) => {
    setErrorText(''); // Clear error on new input
    
    // Decimal validation logic
    if (val === '.') {
      // Split by operators to get the current number token
      const tokens = display.split(/[\+\-\×\÷\(\)\^\/]/);
      const currentToken = tokens[tokens.length - 1];
      if (currentToken.includes('.')) return; // Ignore if already has decimal
      if (currentToken === '') val = '0.'; // Prepend 0 if empty
    }

    if (display === '0' || display === 'Error') {
      if (val === '.') setDisplay('0.');
      else setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleFraction = () => {
    const input = inputRef.current;
    if (!input) return;

    let newDisplay = '';
    let newCursorPos = 0;

    if (display === '0' || display === '') {
      newDisplay = '( / )';
      newCursorPos = 1; // Between ( and /
    } else {
      // Wrap existing number
      newDisplay = '(' + display + ')/()';
      newCursorPos = newDisplay.length - 1; // Inside the second ()
    }
    
    setDisplay(newDisplay);
    
    // Focus and set selection after state update
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setErrorText('');
  };

  const handleDelete = () => {
    setErrorText('');
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const calculate = () => {
    try {
      setErrorText('');
      const safeExpression = sanitizeInput(display);
      
      const result = math.evaluate(safeExpression, {
        sin: math.sin,
        cos: math.cos,
        tan: math.tan,
        asin: math.asin,
        acos: math.acos,
        atan: math.atan,
        log10: math.log10,
        log: math.log,
        sqrt: math.sqrt,
        pi: math.pi,
        e: math.e
      });
      
      setEquation(display + ' =');
      
      // Format result
      const formattedResult = result.toString();
      setDisplay(formattedResult);
    } catch (error) {
      setErrorText('Syntax Error');
    }
  };

  const standardButtons = [
    ['C', 'DEL', '(', ')'],
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+']
  ];

  const scientificButtons = [
    { label: isShift ? 'SHIFT' : 'SHIFT', action: () => setIsShift(!isShift), isSpecial: true },
    { label: isShift ? 'sin⁻¹' : 'sin', input: isShift ? 'sin⁻¹(' : 'sin(' },
    { label: isShift ? 'cos⁻¹' : 'cos', input: isShift ? 'cos⁻¹(' : 'cos(' },
    { label: isShift ? 'tan⁻¹' : 'tan', input: isShift ? 'tan⁻¹(' : 'tan(' },
    
    { label: 'a/b', action: handleFraction, isSpecial: true },
    { label: isShift ? 'eˣ' : 'ln', input: isShift ? 'e^(' : 'ln(' },
    { label: 'log', input: 'log(' },
    { label: '×10ˣ', input: 'EXP' },
    
    { label: 'π', input: 'π' },
    { label: 'e', input: 'e' },
    { label: isShift ? '∛' : '√', input: isShift ? '∛(' : '√(' },
    { label: 'xʸ', input: '^' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-4 pb-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalcIcon size={20} className="text-emerald-500" />
              <span className="font-bold text-slate-900">Engineering Calculator</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Display */}
          <div className="bg-slate-50 p-4 rounded-xl mb-4 text-right">
            <div className="text-slate-500 text-sm h-5 font-mono">{equation}</div>
            <input 
              ref={inputRef}
              type="text"
              value={display}
              inputMode="none"
              className="w-full text-3xl font-light text-slate-900 font-mono bg-transparent text-right outline-none"
            />
            {errorText && <div className="text-red-500 text-sm text-right">{errorText}</div>}
          </div>

          {/* Controls */}
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setIsScientific(!isScientific)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isScientific ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
            >
              {isScientific ? 'Standard' : 'Scientific'}
            </button>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-2">
            {isScientific && (
              <div className="col-span-4 grid grid-cols-4 gap-2 mb-2">
                {scientificButtons.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={() => btn.isSpecial ? btn.action() : handleInput(btn.input!)}
                    className={`py-3 rounded-xl font-medium transition-colors text-sm ${
                      btn.label === 'SHIFT' ? (isShift ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-800') :
                      'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
            {standardButtons.flat().map(btn => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === 'C') handleClear();
                  else if (btn === 'DEL') handleDelete();
                  else if (btn === '=') calculate();
                  else handleInput(btn);
                }}
                className={`py-4 rounded-xl font-medium text-lg transition-colors ${
                  btn === '=' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
                  ['C', 'DEL'].includes(btn) ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                  ['÷', '×', '-', '+'].includes(btn) ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' :
                  'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
