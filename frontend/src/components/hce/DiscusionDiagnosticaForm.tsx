'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

// Módulo 8 (opción B): diagnóstico clínico libre + discusión general.
// Los diagnósticos codificados (CIE-10/DSM-5) se gestionan en el historial superior.
export default function DiscusionDiagnosticaForm({
  consultaId,
  editable,
  onSaved,
}: {
  consultaId: string | null;
  editable: boolean;
  onSaved?: (d: { diagnosticoClinico?: string; discusionGeneral?: string }) => void;
}) {
  const [form, setForm] = useState({ diagnosticoClinico: '', discusionGeneral: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consultaId) return;
    apiClient<any>(`/hce/consulta/${consultaId}/discusion-diagnostica`)
      .then((d) => {
        if (d) {
          setForm({
            diagnosticoClinico: d.diagnosticoClinico || '',
            discusionGeneral: d.discusionGeneral || '',
          });
        }
      })
      .catch(() => {});
  }, [consultaId]);

  const handleSave = async () => {
    if (!consultaId) return;
    setSaving(true);
    try {
      const saved = await apiClient<{ diagnosticoClinico?: string; discusionGeneral?: string }>(
        `/hce/consulta/${consultaId}/discusion-diagnostica`,
        { method: 'POST', body: JSON.stringify(form) },
      );
      onSaved?.(saved ?? form);
      toast.success('Diagnóstico y discusión guardados');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Diagnóstico</label>
        <textarea
          value={form.diagnosticoClinico}
          onChange={(e) => setForm({ ...form, diagnosticoClinico: e.target.value })}
          rows={2}
          disabled={!editable}
          placeholder="Diagnóstico clínico del paciente..."
          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Detalles</label>
        <textarea
          value={form.discusionGeneral}
          onChange={(e) => setForm({ ...form, discusionGeneral: e.target.value })}
          rows={4}
          disabled={!editable}
          placeholder="Explicación detallada del diagnóstico..."
          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
        />
      </div>
      {editable && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar diagnóstico y discusión'}
        </button>
      )}
    </div>
  );
}
