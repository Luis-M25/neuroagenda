'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function TabAntecedentes({ pacienteId, editable }: { pacienteId: string; editable: boolean }) {
  const [antecedentes, setAntecedentes] = useState<any[]>([]);
  const [form, setForm] = useState({ tipo: '', descripcion: '', fecha: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient<any>(`/historia-clinica/${pacienteId}`)
      .then(res => setAntecedentes(res.antecedentes || []))
      .catch((e) => console.error('Error:', e));
  }, [pacienteId]);

  const add = async () => {
    if (!form.tipo || !form.descripcion) { toast.error('Tipo y descripción requeridos'); return; }
    setSaving(true);
    try {
      const d = await apiClient(`/historia-clinica/${pacienteId}/antecedente`, {
        method: 'POST',
        body: JSON.stringify({
          tipo: form.tipo,
          descripcion: form.descripcion,
          fecha: form.fecha || undefined,
        }),
      });
      setAntecedentes([d, ...antecedentes]);
      setForm({ tipo: '', descripcion: '', fecha: '' });
      toast.success('Antecedente guardado');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 border-b"><th className="pb-2 pr-4">Tipo</th><th className="pb-2 pr-4">Descripción</th><th className="pb-2">Fecha</th></tr></thead>
        <tbody>
          {antecedentes.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-400">Sin antecedentes registrados</td></tr>}
          {antecedentes.map(a => (
            <tr key={a.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{a.tipo}</td>
              <td className="py-2 pr-4">{a.descripcion}</td>
              <td className="py-2 text-xs text-gray-400">{a.fecha ? new Date(a.fecha).toLocaleDateString('es-EC') : '-'}</td>
            </tr>
          ))}
        </tbody></table>

      {editable && (
        <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg">
          <div><label className="block text-[10px] text-gray-500 mb-0.5">Tipo</label>
            <input value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} placeholder="Ej: Familiar, Personal..."
              className="border rounded px-2 py-1.5 text-xs outline-none w-28" /></div>
          <div className="flex-1"><label className="block text-[10px] text-gray-500 mb-0.5">Descripción</label>
            <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              className="border rounded px-2 py-1.5 text-xs outline-none w-full" /></div>
          <div><label className="block text-[10px] text-gray-500 mb-0.5">Fecha</label>
            <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
              className="border rounded px-2 py-1.5 text-xs outline-none" /></div>
          <button onClick={add} disabled={saving} className="px-3 py-1.5 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 disabled:opacity-50"><Plus size={14} /></button>
        </div>
      )}
    </div>
  );
}
