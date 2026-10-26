'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const TIPOS_HABITO = ['TABACO', 'ALCOHOL', 'DROGAS', 'EJERCICIO', 'SUENO', 'ALIMENTACION', 'OTRO'];

export default function TabHabitos({ pacienteId, editable }: { pacienteId: string | null; editable: boolean }) {
  const [habitos, setHabitos] = useState<any[]>([]);
  const [form, setForm] = useState({ tipo: 'TABACO', afirmativo: false, cantidad: '', desde: '', observacion: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pacienteId) return;
    apiClient<any>(`/hce/paciente/${pacienteId}/historial`).then(d => setHabitos(d.habitos || [])).catch((e) => console.error('Error:', e));
  }, [pacienteId]);

  const add = async () => {
    if (!pacienteId) return;
    setSaving(true);
    try {
      const d = await apiClient(`/hce/paciente/${pacienteId}/signo-vital`, { method: 'POST', body: JSON.stringify(form) });
      setHabitos([...habitos, d]);
      setForm({ tipo: 'TABACO', afirmativo: false, cantidad: '', desde: '', observacion: '' });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {habitos.length > 0 && (
        <div className="space-y-2">
          {habitos.map((h: any) => (
            <div key={h.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${h.afirmativo ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{h.tipo}</span>
                <span className="text-sm">{h.afirmativo ? `${h.cantidad || 'Sí'}${h.desde ? ` desde ${h.desde}` : ''}` : 'No'}</span>
              </div>
              {editable && <button onClick={async () => { try { await apiClient(`/hce/paciente/${pacienteId}/signo-vital`, { method: 'DELETE' }); setHabitos(d => d.filter(x => x.id !== h.id)); } catch (e: any) { toast.error(e.message); } }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
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
                {TIPOS_HABITO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.afirmativo} onChange={(e) => setForm({ ...form, afirmativo: e.target.checked })} className="rounded" />
                <span className="text-sm font-medium">{form.afirmativo ? 'Sí' : 'No'}</span>
              </label>
            </div>
          </div>
          {form.afirmativo && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                <input type="text" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ej: 10 diarios" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
                <input type="text" value={form.desde} onChange={(e) => setForm({ ...form, desde: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ej: 2015" />
              </div>
            </div>
          )}
          <button onClick={add} disabled={saving} className="inline-flex items-center gap-1 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"><Plus size={14} /> Agregar Hábito</button>
        </div>
      )}
    </div>
  );
}
