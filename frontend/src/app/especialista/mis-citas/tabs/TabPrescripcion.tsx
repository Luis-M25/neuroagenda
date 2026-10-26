'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function TabPrescripcion({ consultaId, editable }: { consultaId: string | null; editable: boolean }) {
  const [prescripciones, setPrescripciones] = useState<any[]>([]);
  const [form, setForm] = useState({ medicamento: '', dosis: '', via: '', frecuencia: '', duracion: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consultaId) return;
    apiClient<any>(`/hce/consulta/${consultaId}`).then(c => setPrescripciones(c.prescripciones || [])).catch((e) => console.error('Error:', e));
  }, [consultaId]);

  const add = async () => {
    if (!form.medicamento || !form.dosis || !form.frecuencia) { toast.error('Medicamento, dosis y frecuencia requeridos'); return; }
    if (!consultaId) return;
    setSaving(true);
    try {
      const d = await apiClient(`/hce/consulta/${consultaId}/prescripcion`, { method: 'POST', body: JSON.stringify(form) });
      setPrescripciones([...prescripciones, d]);
      setForm({ medicamento: '', dosis: '', via: '', frecuencia: '', duracion: '' });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await apiClient(`/hce/prescripcion/${id}`, { method: 'DELETE' }); setPrescripciones(d => d.filter(x => x.id !== id)); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-3">
      <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 border-b"><th className="pb-2 pr-4">Medicamento</th><th className="pb-2 pr-4">Dosis</th><th className="pb-2 pr-4">Frecuencia</th><th className="pb-2">Duración</th>{editable && <th className="pb-2 w-8" />}</tr></thead>
        <tbody>{prescripciones.map(p => (
          <tr key={p.id} className="border-b last:border-0"><td className="py-2 pr-4 font-medium">{p.medicamento}</td><td className="py-2 pr-4 text-xs">{p.dosis}{p.via ? ` (${p.via})` : ''}</td><td className="py-2 pr-4 text-xs">{p.frecuencia}</td><td className="py-2 text-xs">{p.duracion || '-'}</td>
            {editable && <td className="py-2"><button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>}</tr>
        ))}</tbody></table>

      {editable && (
        <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg flex-wrap">
          <input placeholder="Medicamento" value={form.medicamento} onChange={e => setForm({ ...form, medicamento: e.target.value })}
            className="border rounded px-2 py-1.5 text-xs outline-none" />
          <input placeholder="Dosis" value={form.dosis} onChange={e => setForm({ ...form, dosis: e.target.value })}
            className="border rounded px-2 py-1.5 text-xs w-20 outline-none" />
          <input placeholder="Vía" value={form.via} onChange={e => setForm({ ...form, via: e.target.value })}
            className="border rounded px-2 py-1.5 text-xs w-16 outline-none" />
          <input placeholder="Frecuencia" value={form.frecuencia} onChange={e => setForm({ ...form, frecuencia: e.target.value })}
            className="border rounded px-2 py-1.5 text-xs w-24 outline-none" />
          <input placeholder="Duración" value={form.duracion} onChange={e => setForm({ ...form, duracion: e.target.value })}
            className="border rounded px-2 py-1.5 text-xs w-24 outline-none" />
          <button onClick={add} disabled={saving} className="px-3 py-1.5 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 disabled:opacity-50"><Plus size={14} /></button>
        </div>
      )}
    </div>
  );
}
