import React, { useState, useRef, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface MathEditableInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function MathEditableInput({ value, onChange, className = '' }: MathEditableInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsEditing(false);
          }
        }}
        className={className}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-text hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center min-h-[28px] !p-0`}
    >
      <div className="w-full flex items-center pointer-events-none [&_.markdown-body]:!p-0 [&_.markdown-body>p]:!m-0 [&_.markdown-body>p]:!leading-normal">
        <MarkdownRenderer content={value} />
      </div>
    </div>
  );
}
