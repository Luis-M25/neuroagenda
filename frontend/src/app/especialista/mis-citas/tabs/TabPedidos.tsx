'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const TIPOS_PEDIDO = ['LABORATORIO', 'IMAGEN', 'ECOGRAFIA', 'TOMOGRAFIA', 'RESONANCIA', 'INTERCONSULTA', 'PROCEDIMIENTO', 'OTRO'];

export default function TabPedidos({ consultaId, editable }: { consultaId: string | null; editable: boolean }) {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [form, setForm] = useState({ tipo: 'LABORATORIO', descripcion: '', urgente: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consultaId) return;
    apiClient<any>(`/hce/consulta/${consultaId}`).then(c => setPedidos(c.pedidos || [])).catch((e) => console.error('Error:', e));
  }, [consultaId]);

  const add = async () => {
    if (!form.descripcion) { toast.error('Descripción requerida'); return; }
    if (!consultaId) return;
    setSaving(true);
    try {
      const d = await apiClient(`/hce/consulta/${consultaId}/pedido`, { method: 'POST', body: JSON.stringify(form) });
      setPedidos([...pedidos, d]);
      setForm({ tipo: 'LABORATORIO', descripcion: '', urgente: false });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {pedidos.length > 0 && (
        <div className="space-y-2">
          {pedidos.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{p.tipo}</span>
                <span className="text-sm">{p.descripcion}</span>
                {p.urgente && <span className="text-xs font-bold text-red-500">URGENTE</span>}
              </div>
              {editable && <button onClick={async () => { try { await apiClient(`/hce/pedidoExamen/${p.id}`, { method: 'DELETE' }); setPedidos(d => d.filter(x => x.id !== p.id)); } catch (e: any) { toast.error(e.message); } }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      )}
      {editable && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                {TIPOS_PEDIDO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.urgente} onChange={(e) => setForm({ ...form, urgente: e.target.checked })} className="rounded" />
                <span className="text-sm text-red-600 font-medium">Urgente</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Detalle del pedido..." />
          </div>
          <button onClick={add} disabled={saving} className="inline-flex items-center gap-1 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"><Plus size={14} /> Agregar Pedido</button>
        </div>
      )}
    </div>
  );
}
