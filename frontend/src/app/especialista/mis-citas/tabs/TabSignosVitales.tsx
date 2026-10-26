'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export default function TabSignosVitales({ pacienteId, editable, consultaId, especialistaId }: { pacienteId: string; editable: boolean; consultaId: string | null; especialistaId: string | null }) {
  const [form, setForm] = useState({ presionArterial: '', frecuenciaCardiaca: '', temperatura: '', peso: '', talla: '', observaciones: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient(`/hce/paciente/${pacienteId}/signo-vital`, {
        method: 'POST',
        body: JSON.stringify({
          presionArterial: form.presionArterial || undefined,
          frecuenciaCardiaca: form.frecuenciaCardiaca ? parseInt(form.frecuenciaCardiaca) : undefined,
          temperatura: form.temperatura ? parseFloat(form.temperatura) : undefined,
          peso: form.peso ? parseFloat(form.peso) : undefined,
          talla: form.talla ? parseFloat(form.talla) : undefined,
          observaciones: form.observaciones || undefined,
        }),
      });
      toast.success('Signos vitales guardados');
      setForm({ presionArterial: '', frecuenciaCardiaca: '', temperatura: '', peso: '', talla: '', observaciones: '' });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Presión Arterial</label>
          <input placeholder="120/80" value={form.presionArterial} onChange={e => setForm({ ...form, presionArterial: e.target.value })}
            disabled={!editable} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Frec. Cardíaca</label>
          <input type="number" placeholder="lpm" value={form.frecuenciaCardiaca} onChange={e => setForm({ ...form, frecuenciaCardiaca: e.target.value })}
            disabled={!editable} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Temperatura</label>
          <input type="number" step="0.1" placeholder="°C" value={form.temperatura} onChange={e => setForm({ ...form, temperatura: e.target.value })}
            disabled={!editable} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Peso (kg)</label>
          <input type="number" step="0.1" value={form.peso} onChange={e => setForm({ ...form, peso: e.target.value })}
            disabled={!editable} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Talla (cm)</label>
          <input type="number" step="0.1" value={form.talla} onChange={e => setForm({ ...form, talla: e.target.value })}
            disabled={!editable} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Observaciones</label>
          <input value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })}
            disabled={!editable} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50" />
        </div>
      </div>
      {form.peso && form.talla && (
        <p className="text-xs text-gray-500">IMC: {(parseFloat(form.peso) / (parseFloat(form.talla) / 100) ** 2).toFixed(1)}</p>
      )}
      {editable && (
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar signos vitales'}
        </button>
      )}
    </div>
  );
}
