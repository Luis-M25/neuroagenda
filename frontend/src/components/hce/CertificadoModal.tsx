'use client';

import { useState } from 'react';
import { Lock, FileText, Loader2 } from 'lucide-react';

interface CertificadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerar: (password: string, observaciones?: string) => Promise<void>;
}

export function CertificadoModal({ isOpen, onClose, onGenerar }: CertificadoModalProps) {
  const [password, setPassword] = useState('');
  const [observaciones, setObservaciones] = useState('');
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
      await onGenerar(password, observaciones.trim() || undefined);
      setPassword('');
      setObservaciones('');
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al generar certificado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Certificado de Asistencia</h2>
          <p className="text-sm text-gray-500 mt-1">
            Genere un certificado médico que justifique la asistencia del paciente a esta consulta.
          </p>
        </div>

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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Ej: Paciente requiere reposo por 3 días..."
            />
            <p className="text-xs text-gray-400 mt-1">{observaciones.length}/500</p>
          </div>

          {error && <p className="text-xs text-danger-600">{error}</p>}

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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              {submitting ? 'Generando...' : 'Generar Certificado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}