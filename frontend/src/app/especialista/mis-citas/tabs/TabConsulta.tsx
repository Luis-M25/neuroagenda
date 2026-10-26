'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function TabConsulta({ consultaId, editable }: { consultaId: string | null; editable: boolean }) {
  const [form, setForm] = useState({ motivoConsulta: '', enfermedadActual: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consultaId) return;
    apiClient<any>(`/hce/consulta/${consultaId}`).then(c => {
      setForm({
        motivoConsulta: c.motivoConsulta || '',
        enfermedadActual: c.enfermedadActual || '',
      });
    }).catch((e) => console.error('Error:', e));
  }, [consultaId]);

  const handleSave = async () => {
    if (!consultaId) return;
    setSaving(true);
    try {
      await apiClient(`/hce/consulta/${consultaId}`, { method: 'PATCH', body: JSON.stringify(form) });
      toast.success('Consulta guardada');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Motivo de consulta</label>
        <textarea value={form.motivoConsulta} onChange={e => setForm({ ...form, motivoConsulta: e.target.value })} rows={2}
          disabled={!editable} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Enfermedad actual</label>
        <textarea value={form.enfermedadActual} onChange={e => setForm({ ...form, enfermedadActual: e.target.value })} rows={2}
          disabled={!editable} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50" />
      </div>
      {editable && (
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar consulta'}
        </button>
      )}
    </div>
  );
}
