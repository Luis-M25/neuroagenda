'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function TabDiagnosticos({ consultaId, editable }: { consultaId: string | null; editable: boolean }) {
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [form, setForm] = useState({ codigoCIE10: '', descripcion: '', tipo: 'PRINCIPAL' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consultaId) return;
    apiClient<any>(`/hce/consulta/${consultaId}`).then(c => {
      setDiagnosticos(c.diagnosticos || []);
    }).catch((e) => console.error('Error:', e));
  }, [consultaId]);

  const add = async () => {
    if (!form.codigoCIE10 || !form.descripcion) { toast.error('Código y descripción requeridos'); return; }
    if (!consultaId) return;
    setSaving(true);
    try {
      const d = await apiClient(`/hce/consulta/${consultaId}/diagnostico`, { method: 'POST', body: JSON.stringify(form) });
      setDiagnosticos([...diagnosticos, d]);
      setForm({ codigoCIE10: '', descripcion: '', tipo: 'PRINCIPAL' });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await apiClient(`/hce/diagnostico/${id}`, { method: 'DELETE' });
      setDiagnosticos(d => d.filter(x => x.id !== id));
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-3">
      <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 border-b"><th className="pb-2 pr-4">Código</th><th className="pb-2 pr-4">Descripción</th><th className="pb-2">Tipo</th>{editable && <th className="pb-2 w-8" />}</tr></thead>
        <tbody>{diagnosticos.map((d: any) => (
          <tr key={d.id} className="border-b last:border-0"><td className="py-2 pr-4 font-mono text-xs">{d.codigoCIE10}</td><td className="py-2 pr-4">{d.descripcion}</td><td className="py-2 text-xs">{d.tipo}</td>
            {editable && <td className="py-2"><button onClick={() => remove(d.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>}</tr>
        ))}</tbody></table>

      {editable && (
        <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg">
          <div className="flex-1"><input placeholder="Código CIE-10" value={form.codigoCIE10} onChange={e => setForm({ ...form, codigoCIE10: e.target.value })}
            className="w-full border rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary-500" /></div>
          <div className="flex-[2]"><input placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
            className="w-full border rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary-500" /></div>
          <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
            className="border rounded px-2 py-1.5 text-xs"><option>PRINCIPAL</option><option>SECUNDARIO</option></select>
          <button onClick={add} disabled={saving} className="px-3 py-1.5 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 disabled:opacity-50"><Plus size={14} /></button>
        </div>
      )}
    </div>
  );
}
