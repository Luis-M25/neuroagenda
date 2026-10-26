'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const TIPOS_INDICACION = ['REPOSO', 'DIETA', 'CONTROL', 'RETORNO', 'RECOMENDACION', 'FISIOTERAPIA', 'OTRO'];

export default function TabIndicaciones({ consultaId, editable }: { consultaId: string | null; editable: boolean }) {
  const [indicaciones, setIndicaciones] = useState<any[]>([]);
  const [form, setForm] = useState({ tipo: 'RECOMENDACION', descripcion: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consultaId) return;
    apiClient<any>(`/hce/consulta/${consultaId}`).then(c => setIndicaciones(c.indicaciones || [])).catch((e) => console.error('Error:', e));
  }, [consultaId]);

  const add = async () => {
    if (!form.descripcion) { toast.error('Descripción requerida'); return; }
    if (!consultaId) return;
    setSaving(true);
    try {
      const d = await apiClient(`/hce/consulta/${consultaId}/pedido`, { method: 'POST', body: JSON.stringify(form) });
      setIndicaciones([...indicaciones, d]);
      setForm({ tipo: 'RECOMENDACION', descripcion: '' });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {indicaciones.length > 0 && (
        <div className="space-y-2">
          {indicaciones.map((ind: any) => (
            <div key={ind.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">{ind.tipo}</span>
                <span className="text-sm">{ind.descripcion}</span>
              </div>
              {editable && <button onClick={async () => { try { await apiClient(`/hce/consulta/${consultaId}/pedido`, { method: 'DELETE' }); setIndicaciones(d => d.filter(x => x.id !== ind.id)); } catch (e: any) { toast.error(e.message); } }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      )}
      {editable && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex gap-3">
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                {TIPOS_INDICACION.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <input type="text" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Indicación..." />
            </div>
          </div>
          <button onClick={add} disabled={saving} className="inline-flex items-center gap-1 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"><Plus size={14} /> Agregar Indicación</button>
        </div>
      )}
    </div>
  );
}
