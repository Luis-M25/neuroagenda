'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

const CAMPOS: { key: string; label: string }[] = [
  { key: 'funcionMotora', label: '1. Función motora' },
  { key: 'juicioInsight', label: '2. Juicio e insight' },
  { key: 'aprendizajeMemoria', label: '3. Aprendizaje y memoria' },
  { key: 'conciencia', label: '4. Conciencia' },
  { key: 'lenguaje', label: '5. Lenguaje' },
  { key: 'visionEspacialConstruccional', label: '6. Visión espacial y visión construccional' },
  { key: 'atencionMemoriaTrabajo', label: '7. Atención y memoria de trabajo' },
  { key: 'habilidadesAritmeticas', label: '8. Habilidades aritméticas' },
  { key: 'abstraccionRazonamiento', label: '9. Abstracción y razonamiento' },
  { key: 'afectividad', label: '10. Afectividad' },
  { key: 'percepcionPensamiento', label: '11. Percepción y pensamiento' },
  { key: 'descripcionGeneral', label: '12. Descripción general' },
  { key: 'orientacion', label: '13. Orientación' },
  { key: 'funcionesCognitivasRelacion', label: '14. Funciones cognitivas y relación' },
];

const emptyForm = () => Object.fromEntries(CAMPOS.map((c) => [c.key, '']));

export default function EvalNeuroconductualForm({
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
    apiClient<any>(`/hce/consulta/${consultaId}/eval-neuroconductual`)
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
      await apiClient(`/hce/consulta/${consultaId}/eval-neuroconductual`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('Evaluación neuroconductual guardada');
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
          {saving ? 'Guardando...' : 'Guardar evaluación neuroconductual'}
        </button>
      )}
    </div>
  );
}
