'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface Template {
  id: string;
  titulo: string;
  contenido: string;
}

interface TemplateSelectorProps {
  especialidad: string;
  formName: string;
  fieldName: string;
  onSelect: (content: string) => void;
}

export default function TemplateSelector({ especialidad, formName, fieldName, onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || templates.length > 0) return;
    (async () => {
      setLoading(true);
      try {
        const data = await apiClient<Template[]>(`/hce/templates/${especialidad}/${formName}/${fieldName}`);
        setTemplates(data);
      } catch (e) {
        console.error('Error loading templates:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, especialidad, formName, fieldName, templates.length]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
        title="Templates"
      >
        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Plantillas
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Plantillas</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-400">Cargando...</div>
          ) : templates.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">Sin plantillas</div>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className="w-full text-left px-3 py-2 text-xs hover:bg-primary-50 border-b border-gray-50 last:border-0"
                onClick={() => {
                  onSelect(t.contenido);
                  setIsOpen(false);
                }}
              >
                <div className="font-medium text-gray-700">{t.titulo}</div>
                <div className="text-gray-400 truncate">{t.contenido.slice(0, 60)}...</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
