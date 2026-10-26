'use client';

import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  citaId: string;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
}

export default function CancelarCitaModal({ citaId, onClose, onConfirm }: Props) {
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleConfirm = async () => {
    if (motivo.trim().length < 3) return;
    setGuardando(true);
    try {
      await onConfirm(motivo.trim());
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={containerRef}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Cancelar cita"
      >
        <div className="flex items-center justify-between p-4 border-b bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">Cancelar cita</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="motivo-cancelacion" className="block text-sm font-medium text-neutral-700 mb-1">
              Motivo de cancelación <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              id="motivo-cancelacion"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Indique el motivo de la cancelación"
              disabled={guardando}
              aria-required="true"
            />
            {motivo.length > 0 && motivo.trim().length < 3 && (
              <p className="text-xs text-red-500 mt-1">Debe escribir al menos 3 caracteres</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Volver
            </button>
            <button
              onClick={handleConfirm}
              disabled={motivo.trim().length < 3 || guardando}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {guardando ? 'Cancelando...' : 'Cancelar cita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
