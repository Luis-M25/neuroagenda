'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  filterKey?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
  className,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(
    () => options.filter((o) => {
      const searchText = o.filterKey ? `${o.label} ${o.filterKey}` : o.label;
      return searchText.toLowerCase().includes(query.toLowerCase());
    }),
    [options, query],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {open || query ? (
        <div className={cn(
          'flex items-center border rounded-xl px-3 py-2 transition-all',
          disabled ? 'bg-neutral-50 border-neutral-200' : 'bg-white focus-within:ring-2 focus-within:ring-primary-500/40 focus-within:border-primary-500 border-neutral-200',
        )}>
          <Search size={16} className="text-neutral-400 shrink-0 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={selected ? selected.label : placeholder}
            className="flex-1 text-sm bg-transparent outline-none min-w-0"
            autoComplete="off"
            disabled={disabled}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-0.5 hover:bg-neutral-100 rounded shrink-0">
              <X size={14} className="text-neutral-400" />
            </button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className={cn(
            'flex items-center gap-2 w-full border rounded-xl px-3 py-2 transition-colors text-left',
            disabled
              ? 'bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'bg-white border-neutral-200 hover:border-neutral-300 cursor-pointer',
          )}
        >
          <Search size={16} className="text-neutral-400 shrink-0" />
          <span className={cn('flex-1 text-sm', selected ? (disabled ? 'text-neutral-400' : 'text-neutral-800') : 'text-neutral-400')}>
            {selected ? selected.label : placeholder}
          </span>
          {value && !disabled && (
            <button type="button" onClick={(e) => { e.stopPropagation(); handleClear(); }} className="p-0.5 hover:bg-neutral-100 rounded shrink-0">
              <X size={14} className="text-neutral-400" />
            </button>
          )}
          <ChevronDown size={16} className={cn('shrink-0', disabled ? 'text-neutral-300' : 'text-neutral-400')} />
        </div>
      )}

      {open && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-neutral-400 text-center">{emptyMessage}</div>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-primary-50',
                  option.value === value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-neutral-700',
                )}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
