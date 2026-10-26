'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface ChipsInputProps {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
  touched?: boolean;
  helpText?: string;
}

function splitSeparator(value: string): string[] {
  return value
    .split(/,|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ChipsInput({
  label,
  placeholder = 'Escribe y presiona Enter o coma',
  values,
  onChange,
  error,
  touched,
  helpText,
}: ChipsInputProps) {
  const [input, setInput] = useState('');

  const commit = (raw: string) => {
    const parts = splitSeparator(raw);
    if (!parts.length) return;
    const nuevo = [...values];
    for (const p of parts) {
      if (!nuevo.includes(p)) nuevo.push(p);
    }
    onChange(nuevo);
    setInput('');
  };

  const remove = (idx: number) => {
    const next = values.filter((_, i) => i !== idx);
    onChange(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(input);
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      remove(values.length - 1);
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (/[,;\n]/.test(pasted)) {
      e.preventDefault();
      commit(pasted);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium mb-1 block">
        {label} {values.length > 0 && <span className="text-xs text-neutral-500">({values.length})</span>}
      </label>
      <div
        className={`w-full border rounded-lg px-2 py-2 flex flex-wrap gap-1.5 items-center bg-white focus-within:ring-2 focus-within:ring-primary-500 ${
          touched && error ? 'border-red-400 bg-red-50' : 'border-neutral-300'
        }`}
      >
        {values.map((v, idx) => (
          <span
            key={`${v}-${idx}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 ring-1 ring-primary-200"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="ml-0.5 rounded-full hover:bg-primary-100 w-4 h-4 inline-flex items-center justify-center"
              aria-label={`Quitar ${v}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => input && commit(input)}
          placeholder={values.length === 0 ? placeholder : undefined}
          className="flex-1 min-w-[120px] outline-none text-sm px-1 py-1 bg-transparent"
        />
      </div>
      {touched && error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {!error && helpText && <p className="text-xs text-neutral-500 mt-1">{helpText}</p>}
    </div>
  );
}
