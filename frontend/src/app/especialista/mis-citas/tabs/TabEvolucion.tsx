'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function TabEvolucion({ consultaId, pacienteId, especialistaId, editable }: { consultaId: string | null; pacienteId: string; especialistaId: string | null; editable: boolean }) {
  const [evoluciones, setEvoluciones] = useState<any[]>([]);
  const [form, setForm] = useState({ subjetivo: '', objetivo: '', analisis: '', plan: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consultaId) return;
    apiClient<any>(`/hce/consulta/${consultaId}`).then(c => setEvoluciones(c.evoluciones || [])).catch((e) => console.error('Error:', e));
  }, [consultaId]);

  const add = async () => {
    if (!consultaId || !especialistaId) return;
    setSaving(true);
    try {
      const d = await apiClient(`/hce/consulta/${consultaId}/evolucion`, {
        method: 'POST',
        body: JSON.stringify({ ...form, pacienteId, especialistaId }),
      });
      setEvoluciones([...evoluciones, d]);
      setForm({ subjetivo: '', objetivo: '', analisis: '', plan: '' });
      toast.success('Evolución guardada');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      {evoluciones.length > 0 && (
        <div className="space-y-2 mb-4">
          {evoluciones.map((ev, i) => (
            <div key={ev.id || i} className="bg-gray-50 p-3 rounded-lg text-sm">
              {ev.subjetivo && <p><strong>S:</strong> {ev.subjetivo}</p>}
              {ev.objetivo && <p><strong>O:</strong> {ev.objetivo}</p>}
              {ev.analisis && <p><strong>A:</strong> {ev.analisis}</p>}
              {ev.plan && <p><strong>P:</strong> {ev.plan}</p>}
            </div>
          ))}
        </div>
      )}

      {editable && (
        <div className="space-y-2">
          <div><label className="block text-xs font-medium mb-1">S - Subjetivo (lo que el paciente refiere)</label>
            <textarea value={form.subjetivo} onChange={e => setForm({ ...form, subjetivo: e.target.value })} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-xs font-medium mb-1">O - Objetivo (hallazgos del examen)</label>
            <textarea value={form.objetivo} onChange={e => setForm({ ...form, objetivo: e.target.value })} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-xs font-medium mb-1">A - Análisis (impresión diagnóstica)</label>
            <textarea value={form.analisis} onChange={e => setForm({ ...form, analisis: e.target.value })} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-xs font-medium mb-1">P - Plan (conducta a seguir)</label>
            <textarea value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <button onClick={add} disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Agregar evolución SOAP'}
          </button>
        </div>
      )}
    </div>
  );
}
