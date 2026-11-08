'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

type Fila = { key: string; label: string };
type Col = { key: string; label: string };
type TablaCfg = { titulo: string; prefijo: string; filas: Fila[]; cols: Col[] };

const METADATA_KEYS = new Set(['id', 'consultaId', 'createdAt', 'updatedAt', 'tipo', 'hcNumero']);

// Campos que se editan fuera del formulario principal (secciones de cierre y el
// modal de observaciones de devolución): el formulario no los envía para no
// sobrescribir cambios hechos allí.
const CAMPOS_SECCIONES_CIERRE = ['diagnosticoAO', 'tratamiento', 'evaluacion', 'observacion', 'recomendaciones'];

const FILAS_OJOS: Fila[] = [
  { key: 'Od', label: 'O.D' },
  { key: 'Oi', label: 'O.I' },
  { key: 'Ao', label: 'A.O' },
];
const FILAS_VL_VP: Fila[] = [
  { key: 'Vl', label: 'V.L.' },
  { key: 'Vp', label: 'V.P.' },
];

const COLS_RX_USO: Col[] = [
  { key: '', label: 'FÓRMULA' },
  { key: 'Av', label: 'AV' },
  { key: 'Add', label: 'ADD' },
  { key: 'AvVp', label: 'AV VP' },
  { key: 'Obs', label: 'OBSERVACIONES' },
];
const TABLA_RX_USO_INTEGRAL: TablaCfg = {
  titulo: 'Rx en uso (gafas actuales)',
  prefijo: 'rxUso',
  filas: FILAS_OJOS.slice(0, 2), // Formato Integral: solo O.D / O.I
  cols: COLS_RX_USO,
};

const TABLA_AV: TablaCfg = {
  titulo: 'Agudeza visual',
  prefijo: 'av',
  filas: FILAS_OJOS,
  cols: [
    { key: 'Vl', label: 'V.L.' },
    { key: 'Ph', label: 'P.H.' },
    { key: 'Vp', label: 'V.P.' },
    { key: 'Obs', label: 'OBSERVACIONES' },
  ],
};

const COLS_RX_FINAL_INTEGRAL: Col[] = [
  { key: '', label: 'FÓRMULA' },
  { key: 'AvVl', label: 'AV VL' },
  { key: 'Add', label: 'ADD' },
  { key: 'AvVp', label: 'AV VP' },
  { key: 'Dnp', label: 'DNP' },
];

const TABLA_MOTOR: TablaCfg = {
  titulo: 'Examen motor',
  prefijo: 'motor',
  filas: [{ key: 'Vl', label: 'V.L.' }], // Formato oficial: una sola línea (V.L.)
  cols: [
    { key: 'Tecnica', label: 'TÉCNICA' },
    { key: 'Ppc', label: 'P.P.C.' },
    { key: 'Or', label: 'O.R.' },
    { key: 'Luz', label: 'LUZ' },
    { key: 'Versiones', label: 'VERSIONES' },
  ],
};

const TABLA_SENT: TablaCfg = {
  titulo: 'Sensorialidad',
  prefijo: 'sent',
  filas: FILAS_VL_VP,
  cols: [
    { key: 'Worth', label: 'LUCES DE WORTH' },
    { key: 'BaseSup', label: '6 Δ BASE SUPERIOR' },
    { key: 'FusionRojo', label: 'FUSIÓN CON FILTRO ROJO' },
  ],
};

const EXT_INTEGRAL: { key: string; label: string }[] = [
  { key: 'extPestanas', label: 'Pestañas' },
  { key: 'extParpados', label: 'Párpados' },
  { key: 'extConjuntiva', label: 'Conjuntiva' },
  { key: 'extCornea', label: 'Córnea' },
  { key: 'extEsclerotica', label: 'Esclerótica' },
  { key: 'extIris', label: 'Iris' },
  { key: 'extCristalino', label: 'Cristalino' },
  { key: 'extPeliculaLacrimal', label: 'Película lagrimal' },
  { key: 'extPio', label: 'Presión intraocular' },
  { key: 'extPupila', label: 'Pupila' },
];

// Formato Integral: todos los hallazgos del examen externo.

export default function OptometriaInformeForm({
  consultaId,
  editable,
  onLoaded,
}: {
  consultaId: string | null;
  editable: boolean;
  onLoaded?: (informe: Record<string, any> | null) => void;
}) {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existente, setExistente] = useState(false);

  useEffect(() => {
    if (!consultaId) return;
    let active = true;
    setLoading(true);
    apiClient<Record<string, any> | null>(`/hce/consulta/${consultaId}/optometria`)
      .then((d) => {
        if (!active) return;
        if (d) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(d)) {
            if (typeof v === 'string' && !METADATA_KEYS.has(k)) flat[k] = v;
          }
          setData(flat);
          setExistente(true);
        }
        onLoaded?.(d ?? null);
      })
      .catch(() => {
        if (active) onLoaded?.(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultaId]);

  const set = (key: string, value: string) => setData((d) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    if (!consultaId) return;
    setSaving(true);
    try {
      // Los campos de las secciones de cierre (Diagnóstico A.O., Tratamiento, Evaluar,
      // Observación y Notas adicionales) se guardan por separado; se excluyen aquí
      // para no pisar cambios hechos en esas secciones.
      const camposInforme = Object.fromEntries(
        Object.entries(data).filter(([k]) => !CAMPOS_SECCIONES_CIERRE.includes(k)),
      );
      const saved = await apiClient<Record<string, any>>(`/hce/consulta/${consultaId}/optometria`, {
        method: 'POST',
        body: JSON.stringify(camposInforme),
      });
      setExistente(true);
      onLoaded?.(saved ?? data);
      toast.success('Informe agregado');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!consultaId) {
    return <p className="text-sm text-gray-400">Inicie la atención para llenar la Historia Clínica de Optometría.</p>;
  }
  if (loading) {
    return <p className="text-sm text-gray-400">Cargando informe de optometría…</p>;
  }

  const tablaRxUso = TABLA_RX_USO_INTEGRAL;
  const tablaRxFinal: TablaCfg = {
    titulo: 'RX Final',
    prefijo: 'rxFinal',
    filas: FILAS_OJOS,
    cols: COLS_RX_FINAL_INTEGRAL,
  };

  return (
    <div className="space-y-4">
      {!existente && editable && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-amber-600">Aún no guardado</span>
        </div>
      )}

      <Campo label="Procedencia" value={data.procedencia || ''} onChange={(v) => set('procedencia', v)} disabled={!editable} />

      <TablaOptometria cfg={tablaRxUso} data={data} set={set} editable={editable} />
      <Campo label="Tipo de lente" value={data.tipoLente || ''} onChange={(v) => set('tipoLente', v)} disabled={!editable} />

      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-semibold text-gray-600">Optotipo</p>
          <select
            value={data.avOptotipo || ''}
            onChange={(e) => set('avOptotipo', e.target.value)}
            disabled={!editable}
            className="border rounded px-2 py-1 text-xs disabled:bg-gray-50"
          >
            <option value="">—</option>
            <option value="SNELLEN">Snellen</option>
            <option value="LOGMAR">LOGMAR</option>
          </select>
        </div>
        <TablaOptometria cfg={TABLA_AV} data={data} set={set} editable={editable} />
      </div>

      <TablaOptometria cfg={tablaRxFinal} data={data} set={set} editable={editable} />

      <TablaOptometria cfg={TABLA_MOTOR} data={data} set={set} editable={editable} />
      <TablaOptometria cfg={TABLA_SENT} data={data} set={set} editable={editable} />

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Examen externo</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="border border-gray-200 px-2 py-1 text-left font-medium w-[35%]">O.D</th>
                <th className="border border-gray-200 px-2 py-1 text-center font-medium"></th>
                <th className="border border-gray-200 px-2 py-1 text-left font-medium w-[35%]">O.I</th>
              </tr>
            </thead>
            <tbody>
              {EXT_INTEGRAL.map((c) => (
                <tr key={c.key}>
                  <td className="border border-gray-200 p-0.5 align-middle">
                    <EntradaCelda
                      value={data[`${c.key}Od`] || ''}
                      onChange={(v) => set(`${c.key}Od`, v)}
                      editable={editable}
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 font-semibold text-gray-600 whitespace-nowrap text-center">
                    {c.label}
                  </td>
                  <td className="border border-gray-200 p-0.5 align-middle">
                    <EntradaCelda
                      value={data[`${c.key}Oi`] || ''}
                      onChange={(v) => set(`${c.key}Oi`, v)}
                      editable={editable}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Reflejos pupilares</p>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Fotomotor" value={data.reflFotomotor || ''} onChange={(v) => set('reflFotomotor', v)} disabled={!editable} datalist />
          <Campo label="Consensual" value={data.reflConsensual || ''} onChange={(v) => set('reflConsensual', v)} disabled={!editable} datalist />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Oftalmoscopía</p>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="O.D" value={data.oftOd || ''} onChange={(v) => set('oftOd', v)} disabled={!editable} datalist />
          <Campo label="O.I" value={data.oftOi || ''} onChange={(v) => set('oftOi', v)} disabled={!editable} datalist />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Visión al color</p>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="O.D" value={data.colorOd || ''} onChange={(v) => set('colorOd', v)} disabled={!editable} datalist />
          <Campo label="O.I" value={data.colorOi || ''} onChange={(v) => set('colorOi', v)} disabled={!editable} datalist />
        </div>
      </div>

      {/* Cierre del informe */}
      <div className="space-y-2 border-t pt-3">
        <CampoArea label="Disposición" value={data.disposicion || ''} onChange={(v) => set('disposicion', v)} disabled={!editable} />
      </div>

      {editable && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Agregar Informe'}
        </button>
      )}

      <datalist id="opto-quick">
        <option value="SIN ALTERACION" />
        <option value="N/V" />
        <option value="NORMAL" />
        <option value="REACTIVO" />
        <option value="presente" />
      </datalist>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  datalist,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  datalist?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        list={datalist ? 'opto-quick' : undefined}
        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
      />
    </div>
  );
}

function CampoArea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        disabled={disabled}
        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600"
      />
    </div>
  );
}

function TablaOptometria({
  cfg,
  data,
  set,
  editable,
}: {
  cfg: TablaCfg;
  data: Record<string, string>;
  set: (k: string, v: string) => void;
  editable: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1">{cfg.titulo}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-gray-200">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="border border-gray-200 px-2 py-1 text-left font-medium w-14"></th>
              {cfg.cols.map((c) => (
                <th key={c.key} className="border border-gray-200 px-2 py-1 text-left font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cfg.filas.map((f) => (
              <tr key={f.key}>
                <td className="border border-gray-200 px-2 py-1 font-semibold text-gray-600 whitespace-nowrap">{f.label}</td>
                {cfg.cols.map((c) => {
                  const key = `${cfg.prefijo}${f.key}${c.key}`;
                  return (
                    <td key={c.key} className="border border-gray-200 p-0.5 align-middle">
                      {editable ? (
                        <input
                          value={data[key] || ''}
                          onChange={(e) => set(key, e.target.value)}
                          className="w-full min-w-[70px] px-2 py-1 text-xs outline-none"
                        />
                      ) : (
                        <span className="block px-2 py-1 min-h-[24px] text-gray-700">{data[key] || '—'}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EntradaCelda({
  value,
  onChange,
  editable,
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
}) {
  if (!editable) {
    return <span className="block px-2 py-1 min-h-[24px] text-gray-700">{value || '—'}</span>;
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      list="opto-quick"
      className="w-full min-w-[70px] px-2 py-1 text-xs outline-none"
    />
  );
}
