'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

// Escala en vertical (filas), columnas horizontales: Escala | Objetivo | Observación.
// La observación es por cada nivel de escala, no general.
const ESCALA = [2, 1, 0, -1, -2];

interface Nivel {
  objetivo: string;
  observacion: string;
}

interface ObjetivoDraft {
  numero: number;
  descripcion: string;
  niveles: Record<number, Nivel>;
}

const emptyNivel = (): Nivel => ({ objetivo: '', observacion: '' });

const emptyObjetivo = (numero: number): ObjetivoDraft => ({
  numero,
  descripcion: '',
  niveles: { 2: emptyNivel(), 1: emptyNivel(), 0: emptyNivel(), [-1]: emptyNivel(), [-2]: emptyNivel() },
});

const fmtEscala = (v: number) => (v > 0 ? `+${v}` : `${v}`);

// Mapeo formulario <-> API (plano: escalaMas2..., obsMas2...)
function draftToPayload(o: ObjetivoDraft) {
  const g = (v: number) => o.niveles[v] || emptyNivel();
  return {
    numero: o.numero,
    descripcion: o.descripcion,
    escalaMas2: g(2).objetivo,
    escalaMas1: g(1).objetivo,
    escalaCero: g(0).objetivo,
    escalaMenos1: g(-1).objetivo,
    escalaMenos2: g(-2).objetivo,
    obsMas2: g(2).observacion,
    obsMas1: g(1).observacion,
    obsCero: g(0).observacion,
    obsMenos1: g(-1).observacion,
    obsMenos2: g(-2).observacion,
  };
}

function planToDraft(o: any, idx: number): ObjetivoDraft {
  const niv = (esc: string, obs: string) => ({ objetivo: esc || '', observacion: obs || '' });
  return {
    numero: o.numero ?? idx + 1,
    descripcion: o.descripcion || '',
    niveles: {
      2: niv(o.escalaMas2, o.obsMas2),
      1: niv(o.escalaMas1, o.obsMas1),
      0: niv(o.escalaCero, o.obsCero),
      [-1]: niv(o.escalaMenos1, o.obsMenos1),
      [-2]: niv(o.escalaMenos2, o.obsMenos2),
    },
  };
}

export default function PlanTratamientoForm({
  consultaId,
  editable,
}: {
  consultaId: string | null;
  editable: boolean;
}) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [numeroCitas, setNumeroCitas] = useState('');
  const [objetivos, setObjetivos] = useState<ObjetivoDraft[]>([emptyObjetivo(1)]);
  const [saving, setSaving] = useState(false);
  const [showExtension, setShowExtension] = useState(false);
  const [citasExtension, setCitasExtension] = useState('');
  const [motivoExtension, setMotivoExtension] = useState('');
  const [extending, setExtending] = useState(false);
  const [resultados, setResultados] = useState<Record<number, number | ''>>({});
  const [finishing, setFinishing] = useState(false);
  const [validar, setValidar] = useState(false);

  useEffect(() => {
    if (!consultaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiClient<any>(`/hce/consulta/${consultaId}/plan-tratamiento`)
      .then((p) => {
        setPlan(p);
        if (p) {
          setNumeroCitas(String(p.numeroCitas ?? ''));
          if (p.objetivos?.length > 0) {
            setObjetivos(p.objetivos.map((o: any, i: number) => planToDraft(o, i)));
          }
        }
      })
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [consultaId]);

  const finalizado = plan?.estado === 'FINALIZADO';

  const addObjetivo = () => {
    if (objetivos.length >= 3) {
      toast.error('Máximo 3 objetivos generales');
      return;
    }
    setObjetivos([...objetivos, emptyObjetivo(objetivos.length + 1)]);
  };

  const removeObjetivo = (idx: number) => {
    if (objetivos.length <= 1) return;
    setObjetivos(objetivos.filter((_, i) => i !== idx).map((o, i) => ({ ...o, numero: i + 1 })));
  };

  const setDesc = (idx: number, value: string) => {
    setObjetivos((prev) => prev.map((o, i) => (i === idx ? { ...o, descripcion: value } : o)));
  };

  const setNivel = (idx: number, esc: number, key: keyof Nivel, value: string) => {
    setObjetivos((prev) =>
      prev.map((o, i) =>
        i === idx ? { ...o, niveles: { ...o.niveles, [esc]: { ...o.niveles[esc], [key]: value } } } : o,
      ),
    );
  };

  const NIVELES_REQ = [2, 1, 0, -1, -2];
  const fmtNivelReq = (v: number) => (v > 0 ? `+${v}` : `${v}`);

  // Objetivos obligatorios: descripción + los 5 niveles de escala con su objetivo
  const validarObjetivos = (): string | null => {
    for (let i = 0; i < objetivos.length; i++) {
      const o = objetivos[i];
      if (!o.descripcion.trim()) return `El objetivo ${i + 1} debe tener una descripción`;
      for (const esc of NIVELES_REQ) {
        if (!(o.niveles[esc]?.objetivo || '').trim()) {
          return `El objetivo ${i + 1} debe tener completo el nivel ${fmtNivelReq(esc)} de la escala`;
        }
      }
    }
    return null;
  };

  const handleCreate = async () => {
    if (!consultaId) return;
    const n = parseInt(numeroCitas, 10);
    if (!n || n < 1) {
      toast.error('Indique el número de citas asignadas');
      return;
    }
    const errCreate = validarObjetivos();
    if (errCreate) {
      setValidar(true);
      toast.error(errCreate);
      return;
    }
    setSaving(true);
    try {
      const p = await apiClient(`/hce/consulta/${consultaId}/plan-tratamiento`, {
        method: 'POST',
        body: JSON.stringify({ numeroCitas: n, objetivos: objetivos.map(draftToPayload) }),
      });
      setPlan(p);
      setValidar(false);
      toast.success('Plan de tratamiento guardado (sin finalizar)');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!plan || !editable || finalizado) return;
    const errUpdate = validarObjetivos();
    if (errUpdate) {
      setValidar(true);
      toast.error(errUpdate);
      return;
    }
    setSaving(true);
    try {
      const p = await apiClient(`/hce/plan-tratamiento/${plan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ objetivos: objetivos.map(draftToPayload) }),
      });
      setPlan(p);
      setValidar(false);
      toast.success('Plan de tratamiento actualizado (sin finalizar)');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExtend = async () => {
    if (!plan) return;
    const n = parseInt(citasExtension, 10);
    if (!n || n < 1 || n > 5) {
      toast.error('La extensión es de hasta 5 citas');
      return;
    }
    if (!motivoExtension.trim()) {
      toast.error('Debe indicar por qué se extiende el plazo');
      return;
    }
    setExtending(true);
    try {
      const p = await apiClient(`/hce/plan-tratamiento/${plan.id}/extension`, {
        method: 'POST',
        body: JSON.stringify({ citasExtension: n, motivo: motivoExtension.trim() }),
      });
      setPlan(p);
      setShowExtension(false);
      setCitasExtension('');
      setMotivoExtension('');
      toast.success('Plazo extendido (por única vez)');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExtending(false);
    }
  };

  const handleFinish = async () => {
    if (!plan) return;
    const nums = (plan.objetivos || []).map((o: any) => o.numero);
    const missing = nums.filter((n: number) => resultados[n] === undefined || resultados[n] === '');
    if (missing.length > 0) {
      toast.error('Seleccione un valor de la escala (+2 a -2) por cada objetivo para finalizar');
      return;
    }
    setFinishing(true);
    try {
      const p = await apiClient(`/hce/plan-tratamiento/${plan.id}/finalizar`, {
        method: 'POST',
        body: JSON.stringify({
          resultados: nums.map((n: number) => ({ numero: n, resultadoFinal: resultados[n] })),
        }),
      });
      setPlan(p);
      toast.success('Plan de tratamiento finalizado');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setFinishing(false);
    }
  };

  if (loading) return <p className="text-xs text-gray-400">Cargando plan de tratamiento...</p>;

  // ── Finalizado: solo lectura, muestra solo la escala ──
  if (plan && finalizado) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="font-medium">Citas asignadas: {plan.numeroCitas}</span>
          {plan.citasExtension ? (
            <span className="text-xs text-gray-500">(+{plan.citasExtension} extensión)</span>
          ) : null}
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Finalizado</span>
        </div>
        {(plan.objetivos || []).map((o: any) => {
          const d = planToDraft(o, 0);
          return (
            <div key={o.numero} className="border rounded-lg p-3">
              <p className="text-sm font-semibold">Objetivo {o.numero}: {o.descripcion}</p>
              <TablaEscala draft={d} readOnly resultado={o.resultadoFinal} />
              <p className="text-xs mt-1.5">
                Resultado: <strong className="text-green-700">{fmtEscala(o.resultadoFinal)}</strong>
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">1. Número de citas asignadas para cumplir los objetivos</label>
        <input
          type="number"
          min={1}
          value={numeroCitas}
          onChange={(e) => setNumeroCitas(e.target.value)}
          disabled={!editable || !!plan}
          placeholder="Ej: 8"
          className="w-40 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
        />
        {plan && (
          <span className="ml-2 text-xs text-gray-500">
            Estado: <strong>{plan.estado === 'EXTENDIDO' ? `Extendido (+${plan.citasExtension})` : plan.estado}</strong>
            <span className="ml-2 text-gray-400">(n.º de citas fijado al crear, no modificable)</span>
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">2. Objetivos generales (máx. 3, obligatorios con su escala completa)</label>
        <div className="space-y-3">
          {objetivos.map((o, idx) => (
            <div key={idx} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Objetivo {idx + 1}</span>
                {editable && objetivos.length > 1 && (
                  <button onClick={() => removeObjetivo(idx)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input
                value={o.descripcion}
                onChange={(e) => setDesc(idx, e.target.value)}
                disabled={!editable}
                placeholder="Descripción del objetivo general... (obligatoria)"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 ${validar && !o.descripcion.trim() ? 'border-red-400 bg-red-50/50' : ''}`}
              />
              <TablaEscala
                draft={o}
                readOnly={!editable}
                marcarVacios={validar}
                onChange={(esc, key, v) => setNivel(idx, esc, key, v)}
                resultado={plan ? resultados[o.numero] : undefined}
                onSelectResultado={plan && editable ? (v) => setResultados({ ...resultados, [o.numero]: v }) : undefined}
              />
            </div>
          ))}
        </div>
        {editable && objetivos.length < 3 && (
          <button
            onClick={addObjetivo}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs text-primary-700 hover:bg-primary-50"
          >
            <Plus size={14} /> Agregar objetivo ({objetivos.length}/3)
          </button>
        )}
      </div>

      {editable && (
        <div className="flex flex-wrap gap-2">
          {!plan ? (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar plan (sin finalizar)'}
            </button>
          ) : (
            <>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios (sin finalizar)'}
              </button>
              {!plan.extensionUsada && (
                <button
                  onClick={() => setShowExtension(!showExtension)}
                  className="px-4 py-2 border border-amber-400 text-amber-700 rounded-lg text-sm hover:bg-amber-50"
                >
                  Extender plazo (+5 citas, única vez)
                </button>
              )}
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {finishing ? 'Finalizando...' : 'Finalizar plan'}
              </button>
            </>
          )}
        </div>
      )}

      {showExtension && editable && plan && !plan.extensionUsada && (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 space-y-2">
          <p className="text-sm font-semibold text-amber-800">Extensión del plazo (por única vez, hasta 5 citas)</p>
          <div className="flex gap-2 items-end flex-wrap">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Citas adicionales (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={citasExtension}
                onChange={(e) => setCitasExtension(e.target.value)}
                className="w-28 border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">¿Por qué se extiende el plazo?</label>
              <input
                value={motivoExtension}
                onChange={(e) => setMotivoExtension(e.target.value)}
                placeholder="Motivo de la extensión..."
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <button
              onClick={handleExtend}
              disabled={extending}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50"
            >
              {extending ? 'Guardando...' : 'Guardar extensión'}
            </button>
          </div>
        </div>
      )}

      {plan?.extensionUsada && plan?.motivoExtension && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Plazo extendido (+{plan.citasExtension} citas). Motivo: {plan.motivoExtension}
        </p>
      )}
    </div>
  );
}

// ── Tabla SMART vertical: filas = escala, columnas = Escala | Objetivo | Observación ──
export function TablaEscala({
  draft,
  readOnly,
  onChange,
  resultado,
  onSelectResultado,
  marcarVacios,
}: {
  draft: ObjetivoDraft;
  readOnly?: boolean;
  onChange?: (esc: number, key: keyof Nivel, v: string) => void;
  resultado?: number | '' | null;
  onSelectResultado?: (v: number) => void;
  marcarVacios?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border px-2 py-1 w-14">Escala</th>
            <th className="border px-2 py-1">Objetivo</th>
            <th className="border px-2 py-1">Observación</th>
          </tr>
        </thead>
        <tbody>
          {ESCALA.map((v) => {
            const niv = draft.niveles[v] || emptyNivel();
            const selected = resultado === v;
            return (
              <tr key={v} className={selected ? 'bg-green-50' : undefined}>
                <td className={`border px-2 py-1 text-center font-bold ${selected ? 'text-green-700' : 'text-gray-600'}`}>
                  {fmtEscala(v)}
                </td>
                <td className="border px-1 py-1">
                  {readOnly ? (
                    <p className="px-1 py-1">{niv.objetivo || '—'}</p>
                  ) : (
                    <textarea
                      value={niv.objetivo}
                      onChange={(e) => onChange?.(v, 'objetivo', e.target.value)}
                      rows={2}
                      placeholder="Obligatorio"
                      className={`w-full text-xs outline-none resize-y min-w-[140px] px-1 py-1 rounded border ${marcarVacios && !niv.objetivo.trim() ? 'border-red-400 bg-red-50/50' : 'border-transparent'}`}
                    />
                  )}
                </td>
                <td className="border px-1 py-1">
                  {readOnly ? (
                    <p className="px-1 py-1">{niv.observacion || '—'}</p>
                  ) : (
                    <textarea
                      value={niv.observacion}
                      onChange={(e) => onChange?.(v, 'observacion', e.target.value)}
                      rows={2}
                      className="w-full text-xs outline-none resize-y min-w-[140px] px-1 py-1"
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {onSelectResultado && (
        <div className="flex gap-1.5 items-center flex-wrap mt-1.5">
          <span className="text-[11px] text-gray-500 mr-1">Resultado final (seleccione escala):</span>
          {ESCALA.map((v) => (
            <button
              key={v}
              onClick={() => onSelectResultado(v)}
              className={`px-2.5 py-1 rounded text-xs font-bold border ${
                resultado === v
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 hover:border-green-400'
              }`}
            >
              {fmtEscala(v)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
