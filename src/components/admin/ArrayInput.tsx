'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArrayInputProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ArrayInput({
  label,
  value,
  onChange,
  placeholder = 'Add item...',
  className,
}: ArrayInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--gray-600)] mb-3">
          {label}
        </label>
      )}

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'flex-1 px-0 py-3',
            'bg-transparent',
            'border-0 border-b border-[var(--gray-300)]',
            'text-black text-base',
            'placeholder:text-[var(--gray-400)]',
            'transition-all duration-300',
            'focus:outline-none focus:border-black',
            'hover:border-[var(--gray-500)]'
          )}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-black text-white hover:bg-[var(--gray-800)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--gray-100)] text-sm rounded-full"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-1 text-[var(--gray-500)] hover:text-black transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
