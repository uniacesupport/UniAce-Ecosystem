import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CalculatorContextType {
  display: string;
  equation: string;
  setDisplay: (display: string) => void;
  setEquation: (equation: string) => void;
  isCalculatorOpen: boolean;
  setIsCalculatorOpen: (isOpen: boolean) => void;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <CalculatorContext.Provider value={{ display, equation, setDisplay, setEquation, isCalculatorOpen, setIsCalculatorOpen }}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator() {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return context;
}
