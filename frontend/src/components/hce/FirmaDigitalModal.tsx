'use client';

import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';

interface FirmaDigitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFirmar: (password: string) => Promise<void>;
  documentoHash?: string;
}

export function FirmaDigitalModal({ isOpen, onClose, onFirmar, documentoHash }: FirmaDigitalModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!password) {
      setError('La contraseña es requerida');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onFirmar(password);
      setPassword('');
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al firmar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-primary-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Firma Digital</h2>
          <p className="text-sm text-gray-500 mt-1">
            Ingrese su contraseña para firmar digitalmente esta consulta. Una vez firmada, no podrá ser modificada.
          </p>
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 text-left">
            Al firmar, la cita quedará <b>ATENDIDA</b> y no se podrán emitir nuevas recetas.
            Si necesita una receta, emítala antes de continuar.
          </p>
        </div>

        {documentoHash && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Hash del documento (SHA-256)</p>
            <p className="text-xs font-mono text-gray-700 break-all">{documentoHash}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ingrese su contraseña"
              autoFocus
            />
            {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !password}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {submitting ? 'Firmando...' : 'Firmar y Cerrar HC'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
