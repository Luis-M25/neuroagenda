'use client';

import { useEffect, useState } from 'react';
import { hceApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { Loader2, MessageSquare, X } from 'lucide-react';

interface ObservacionesDevolucionModalProps {
  isOpen: boolean;
  consultaId: string | null;
  editable: boolean;
  initialValue?: string;
  onClose: () => void;
  onSaved?: (value: string) => void;
}

/**
 * Observaciones / recomendaciones adicionales de la Devolución de resultados
 * de Optometría. Se imprime en el bloque homónimo del PDF oficial.
 */
export function ObservacionesDevolucionModal({
  isOpen,
  consultaId,
  editable,
  initialValue,
  onClose,
  onSaved,
}: ObservacionesDevolucionModalProps) {
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Al abrir, precarga lo que ya está guardado en el informe (fuente autoritativa).
  useEffect(() => {
    if (!isOpen) return;
    setTexto(initialValue || '');
    if (!consultaId) return;
    let active = true;
    setLoading(true);
    hceApi
      .getOptometria(consultaId)
      .then((d: any) => {
        if (active) setTexto(d?.recomendaciones || initialValue || '');
      })
      .catch(() => {
        /* si aún no hay informe, se mantiene el valor inicial */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, consultaId]);

  if (!isOpen) return null;

  const guardar = async () => {
    if (!consultaId) {
      toast.error('No hay consulta HCE');
      return;
    }
    if (!texto.trim()) {
      toast.error('Escriba las observaciones / recomendaciones adicionales');
      return;
    }
    setSaving(true);
    try {
      const saved: any = await hceApi.saveOptometria(consultaId, { recomendaciones: texto.trim() });
      const value = saved?.recomendaciones || texto.trim();
      toast.success('Observaciones de devolución guardadas');
      onSaved?.(value);
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'No se pudieron guardar las observaciones');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-primary-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Observaciones de devolución</h2>
              <p className="text-xs text-gray-500">Optometría · Devolución de resultados</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Observaciones / recomendaciones adicionales *
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={6}
              disabled={!editable || loading}
              placeholder="Ej: Uso de lentes monofocales con protección UV y antirreflejo. Lágrimas artificiales 4-6 horas, una gota en ambos ojos. Por siempre."
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
          <p className="text-[11px] text-gray-500">
            Este texto se imprime en <strong>OBSERVACIONES / RECOMENDACIONES ADICIONALES</strong> de la
            Devolución de resultados. Es obligatorio para firmar la HC.
          </p>
          {loading && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Cargando observaciones guardadas…
            </p>
          )}
          {!editable && (
            <p className="text-xs text-amber-600">La HC ya está firmada; las observaciones no se pueden modificar.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">
            {editable ? 'Cancelar' : 'Cerrar'}
          </button>
          {editable && (
            <button
              onClick={guardar}
              disabled={saving || loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              {saving ? 'Guardando...' : 'Guardar observaciones'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
