'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';

interface SearchFieldProps {
  field: {
    name: string;
    label: string;
    required?: boolean;
    placeholder?: string;
  };
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}

export default function SearchField({ field, value, onChange, readOnly }: SearchFieldProps) {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const fieldId = `search_${field.name}`;
  const displayValue =
    typeof value === 'object' && value?.descripcion
      ? value.descripcion
      : value || '';

  const search = async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const data = await apiClient(`/hce/cie10/search?q=${encodeURIComponent(q)}`);
      setSearchResults(Array.isArray(data) ? data : []);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={fieldId}
        type="text"
        value={displayValue}
        onChange={(e) => {
          onChange(e.target.value);
          search(e.target.value);
        }}
        onFocus={() => searchResults.length > 0 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        placeholder={field.placeholder || `Buscar ${field.label}...`}
        required={field.required}
        readOnly={readOnly}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm disabled:bg-gray-50"
      />
      {isSearching && (
        <div className="absolute right-3 top-9">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {searchResults.map((item: any, idx: number) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-primary-50 border-b border-gray-50 last:border-0"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange({
                  codigo: item.codigo,
                  descripcion: item.descripcion,
                });
                setShowResults(false);
              }}
            >
              <span className="font-medium text-primary-700">{item.codigo}</span>
              <span className="text-gray-500 ml-2">{item.descripcion}</span>
            </button>
          ))}
        </div>
      )}
      {typeof value === 'object' && value?.codigo && (
        <p className="mt-0.5 text-xs text-green-600">
          Seleccionado: {value.codigo} - {value.descripcion}
        </p>
      )}
    </div>
  );
}
