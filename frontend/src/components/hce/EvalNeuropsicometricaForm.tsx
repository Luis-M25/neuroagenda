'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

const CAMPOS: { key: string; label: string }[] = [
  { key: 'alerta', label: '1. Alerta' },
  { key: 'funcionesMotoras', label: '2. Funciones motoras' },
  { key: 'orientacion', label: '3. Orientación' },
  { key: 'atencionConcentracion', label: '4. Atención y concentración' },
  { key: 'memoria', label: '5. Memoria' },
  { key: 'lenguaje', label: '6. Lenguaje' },
  { key: 'lectura', label: '7. Lectura' },
  { key: 'escritura', label: '8. Escritura' },
  { key: 'calculo', label: '9. Cálculo' },
  { key: 'habilidadesMotorasComplejas', label: '10. Habilidades motoras complejas' },
  { key: 'habilidadesVisoperceptuales', label: '11. Habilidades visoperceptuales' },
  { key: 'problemasAfectivos', label: '12. Problemas afectivos' },
  { key: 'otrasValoraciones', label: '13. Otras valoraciones' },
];

const emptyForm = () => Object.fromEntries(CAMPOS.map((c) => [c.key, '']));

export default function EvalNeuropsicometricaForm({
  consultaId,
  editable,
}: {
  consultaId: string | null;
  editable: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consultaId) return;
    apiClient<any>(`/hce/consulta/${consultaId}/eval-neuropsicometrica`)
      .then((d) => {
        if (d) {
          const next = emptyForm();
          for (const c of CAMPOS) next[c.key] = (d[c.key] as string) || '';
          setForm(next);
        }
      })
      .catch(() => {});
  }, [consultaId]);

  const handleSave = async () => {
    if (!consultaId) return;
    setSaving(true);
    try {
      await apiClient(`/hce/consulta/${consultaId}/eval-neuropsicometrica`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('Evaluación neuropsicométrica guardada');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {CAMPOS.map((c) => (
        <div key={c.key}>
          <label className="block text-sm font-medium mb-1">{c.label}</label>
          <textarea
            value={form[c.key] || ''}
            onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
            rows={2}
            disabled={!editable}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
          />
        </div>
      ))}
      {editable && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar evaluación neuropsicométrica'}
        </button>
      )}
    </div>
  );
}
