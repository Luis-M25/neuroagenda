'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { hceApi } from '@/lib/api-client';
import type { RecetaMedica } from '@/lib/api/hce.api';
import { toast } from 'sonner';
import { FileDown, Loader2, Plus, Trash2, X, Pill, ShieldCheck, History } from 'lucide-react';

interface RecetaModalProps {
  isOpen: boolean;
  consultaId: string | null;
  paciente?: any;
  diagnosticos?: any[];
  diagnosticoDiscusion?: string;
  signosVitales?: any;
  prescripciones?: any[];
  onClose: () => void;
  onRecetaGenerada?: () => void;
  inline?: boolean;
  citaAtendida?: boolean;
}

interface Item {
  medicamento: string;
  formaFarmaceutica: string;
  concentracion: string;
  via: string;
  cantidad: string;
  cantidadLetras: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones: string;
}

const ITEM_VACIO: Item = {
  medicamento: '',
  formaFarmaceutica: 'Comprimidos',
  concentracion: '',
  via: 'Oral',
  cantidad: '',
  cantidadLetras: '',
  dosis: '',
  frecuencia: '',
  duracion: '',
  indicaciones: '',
};

const FORMAS_FARMACEUTICAS = [
  'Comprimidos',
  'Cápsulas',
  'Jarabe',
  'Suspensión',
  'Gotas',
  'Solución oral',
  'Inyectable (ampolla)',
  'Crema / Pomada',
  'Gel',
  'Colirio / Oftálmico',
  'Inhalador / Aerosol',
  'Óvulos / Supositorios',
  'Parche',
  'Polvo para suspensión',
  'Otro',
];

const VIAS_ADMINISTRACION = [
  'Oral',
  'Sublingual',
  'Intravenosa (IV)',
  'Intramuscular (IM)',
  'Subcutánea (SC)',
  'Tópica / Cutánea',
  'Oftálmica',
  'Ótica',
  'Nasal',
  'Inhalatoria',
  'Rectal',
  'Vaginal',
];

function calcEdad(fechaNacimiento?: string | null) {
  if (!fechaNacimiento) return '';
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return '';
  const hoy = new Date();
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
    años -= 1;
    meses += 12;
  }
  return `${Math.max(0, años)} años ${meses} meses`;
}

function sexoPaciente(paciente?: any) {
  const raw = String(paciente?.genero || paciente?.sexo || '').toUpperCase();
  if (raw.startsWith('F') || raw.startsWith('MUJER') || raw.startsWith('FEMEN')) return 'Femenino';
  if (raw.startsWith('M') || raw.startsWith('HOMBRE') || raw.startsWith('MASCUL')) return 'Masculino';
  return raw || '—';
}

function formatDiagnostico(d: any) {
  const codigo = d?.codigoCIE10 || d?.codigo || '';
  const descripcion = d?.descripcion || '';
  return codigo ? `${codigo} - ${descripcion}` : descripcion;
}

function sistemaDiagnostico(d: any) {
  return d?.sistema === 'DSM5' ? 'DSM-5' : 'CIE-10';
}

function buildDiagnosticoTexto(diagnosticos: any[], discusion?: string) {
  const items = (diagnosticos || [])
    .map((d: any) => {
      const detalle = formatDiagnostico(d).trim();
      if (!detalle) return '';
      return `${sistemaDiagnostico(d)}${d?.esPrincipal ? ' (Principal)' : ''}: ${detalle}`;
    })
    .filter(Boolean);

  const textoDiscusion = (discusion || '').trim();
  if (textoDiscusion) {
    const normalizar = (value: string) =>
      value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const yaIncluido = items.some((item) => normalizar(item).includes(normalizar(textoDiscusion)));
    if (!yaIncluido) items.push(`Discusión diagnóstica: ${textoDiscusion}`);
  }

  return items.join('; ');
}

function DatoPaciente({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border bg-white px-2.5 py-2 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-0.5 truncate text-xs font-medium text-neutral-800">{value || '—'}</p>
    </div>
  );
}

export function RecetaModal({
  isOpen,
  consultaId,
  paciente,
  diagnosticos = [],
  diagnosticoDiscusion = '',
  signosVitales,
  prescripciones = [],
  onClose,
  onRecetaGenerada,
  inline = false,
  citaAtendida = false,
}: RecetaModalProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [estadoEnfermedad, setEstadoEnfermedad] = useState<'AGUDO' | 'CRONICO'>('AGUDO');
  const [diagnostico, setDiagnostico] = useState('');
  const [validezDias, setValidezDias] = useState<number>(3);
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');
  const [alergias, setAlergias] = useState('');
  const [signosAlarma, setSignosAlarma] = useState('Fiebre alta persistente, dificultad respiratoria, reacciones alérgicas agudas, convulsiones o deterioro del estado general.');
  const [recomendacionesNoFarmacologicas, setRecomendacionesNoFarmacologicas] = useState('Mantener hidratación adecuada, reposo relativo, dieta balanceada y acudir a controles programados.');
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const passwordRef = useRef<HTMLInputElement>(null);

  const initialDataRef = useRef({ paciente, diagnosticos, diagnosticoDiscusion, signosVitales, prescripciones });

  useEffect(() => {
    initialDataRef.current = { paciente, diagnosticos, diagnosticoDiscusion, signosVitales, prescripciones };
  }, [paciente, diagnosticos, diagnosticoDiscusion, signosVitales, prescripciones]);

  // Historial de recetas emitidas en esta consulta
  const [recetasPrevias, setRecetasPrevias] = useState<RecetaMedica[]>([]);
  const [loadingPrevias, setLoadingPrevias] = useState(false);

  const cargarRecetasPrevias = useCallback(async () => {
    if (!consultaId) return;
    setLoadingPrevias(true);
    try {
      const res = await hceApi.getRecetasConsulta(consultaId).catch(() => []);
      setRecetasPrevias(Array.isArray(res) ? res : []);
    } catch {
      setRecetasPrevias([]);
    } finally {
      setLoadingPrevias(false);
    }
  }, [consultaId]);

  useEffect(() => {
    if (!isOpen) return;

    const initial = initialDataRef.current;
    setDiagnostico(buildDiagnosticoTexto(initial.diagnosticos || [], initial.diagnosticoDiscusion));

    setPeso(initial.signosVitales?.peso ? String(initial.signosVitales.peso) : '');
    setTalla(initial.signosVitales?.talla ? String(initial.signosVitales.talla) : '');
    setAlergias(initial.paciente?.alergias ? String(initial.paciente.alergias) : '');

    const base = (initial.prescripciones || []).slice(0, 6).map((p: any) => ({
      medicamento: p.medicamento || '',
      formaFarmaceutica: p.formaFarmaceutica || p.presentacion || 'Comprimidos',
      concentracion: p.concentracion || '',
      via: p.via || 'Oral',
      cantidad: p.cantidad || '',
      cantidadLetras: p.cantidadLetras || '',
      dosis: p.dosis || '',
      frecuencia: p.frecuencia || '',
      duracion: p.duracion || '',
      indicaciones: p.indicaciones || '',
    }));

    setItems(base.length > 0 ? base : [{ ...ITEM_VACIO }]);
    setEstadoEnfermedad('AGUDO');
    setValidezDias(3);
    setSignosAlarma('Fiebre alta persistente, dificultad respiratoria, reacciones alérgicas agudas, convulsiones o deterioro del estado general.');
    setRecomendacionesNoFarmacologicas('Mantener hidratación adecuada, reposo relativo, dieta balanceada y acudir a controles programados.');
    setIndicacionesGenerales('');
    setPassword('');

    cargarRecetasPrevias();
  }, [isOpen, consultaId, cargarRecetasPrevias]);

  useEffect(() => {
    if (!isOpen) return;
    setDiagnostico(buildDiagnosticoTexto(diagnosticos, diagnosticoDiscusion));
  }, [diagnosticos, diagnosticoDiscusion, isOpen]);

  if (!isOpen) return null;

  const diagDiscusion = (diagnosticoDiscusion || '').trim();
  const tieneDiagnostico = diagnosticos.length > 0 || !!diagDiscusion;

  const historiaClinica = paciente?.numeroHistoriaClinica || paciente?.numeroIdentificacion || '';
  const edadPaciente = calcEdad(paciente?.fechaNacimiento);

  const updateItem = (index: number, field: keyof Item, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const generar = async () => {
    setFormError('');
    if (citaAtendida) {
      const mensaje = 'La cita ya está atendida; no se pueden emitir nuevas recetas';
      setFormError(mensaje);
      toast.error(mensaje);
      return;
    }
    if (!consultaId) {
      toast.error('No hay consulta HCE activa');
      return;
    }
    const limpios = items.filter((it) => it.medicamento.trim());
    if (limpios.length === 0) {
      const mensaje = 'Agregue al menos un medicamento con su nombre';
      setFormError(mensaje);
      toast.error(mensaje);
      return;
    }
    if (limpios.length > 6) {
      const mensaje = 'La receta permite un máximo de 6 medicamentos';
      setFormError(mensaje);
      toast.error(mensaje);
      return;
    }

    const faltantes: string[] = [];
    const diagFinal = diagnostico.trim();
    if (diagFinal.length < 3) {
      faltantes.push('diagnóstico válido (mínimo 3 caracteres, CIE-10/DSM-5 o discusión)');
    }
    limpios.forEach((it, index) => {
      const obligatorios: Array<[keyof Item, string]> = [
        ['formaFarmaceutica', 'forma farmacéutica'],
        ['concentracion', 'concentración'],
        ['via', 'vía de administración'],
        ['cantidad', 'cantidad en números'],
        ['cantidadLetras', 'cantidad en letras'],
        ['dosis', 'dosis'],
        ['frecuencia', 'frecuencia'],
        ['duracion', 'duración'],
      ];
      obligatorios.forEach(([campo, etiqueta]) => {
        if (!String(it[campo] || '').trim()) {
          faltantes.push(`${etiqueta} (medicamento ${index + 1})`);
        }
      });
    });
    if (faltantes.length > 0) {
      const detalle = faltantes.slice(0, 4).join(', ');
      const resto = faltantes.length > 4 ? ` y ${faltantes.length - 4} campo(s) más` : '';
      const mensaje = `Complete la receta: ${detalle}${resto}`;
      setFormError(mensaje);
      toast.error(mensaje);
      return;
    }

    if (!password.trim()) {
      const mensaje = 'Ingrese su contraseña para validar la firma digital';
      setFormError(mensaje);
      toast.error(mensaje);
      passwordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      passwordRef.current?.focus({ preventScroll: true });
      return;
    }

    setSaving(true);
    try {
      const receta = await hceApi.generarReceta(consultaId, {
        password,
        estadoEnfermedad,
        diagnostico: diagFinal || undefined,
        signosAlarma: signosAlarma.trim() || undefined,
        recomendacionesNoFarmacologicas: recomendacionesNoFarmacologicas.trim() || undefined,
        peso: peso.trim() || undefined,
        talla: talla.trim() || undefined,
        alergias: alergias.trim() || undefined,
        validezDias: Number(validezDias) || 3,
        indicaciones: indicacionesGenerales.trim() || undefined,
        items: limpios,
      });

      toast.success(`Receta Médica N.° ${String(receta.numeroReceta).padStart(3, '0')} emitida y firmada`);

      await hceApi.descargarRecetaPdf(receta.id).catch(() => {
        toast.error('La receta se generó, pero ocurrió un error al abrir el PDF');
      });

      if (onRecetaGenerada) onRecetaGenerada();
      cargarRecetasPrevias();
      setItems([{ ...ITEM_VACIO }]);
      setPassword('');
      setFormError('');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo generar la receta médica');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={inline ? 'w-full' : 'fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-6 px-4'}>
      <div className={inline ? 'bg-white rounded-2xl border border-neutral-200 overflow-hidden' : 'bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-neutral-200 overflow-hidden my-auto'}>
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-600 to-sky-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Pill size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Módulo de Receta Médica Oficial</h2>
              <p className="text-xs text-white/90">
                Instituto de Neurociencias — Universidad Laica Eloy Alfaro de Manabí
              </p>
            </div>
          </div>
          {!inline && (
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <div className={inline ? 'p-4 space-y-4' : 'p-6 space-y-6 max-h-[75vh] overflow-y-auto'}>
          {/* Historial de recetas emitidas en esta consulta */}
          <div className="border border-cyan-200 bg-cyan-50/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-cyan-900 font-semibold text-xs uppercase tracking-wide">
              {loadingPrevias ? <Loader2 size={14} className="text-cyan-700 animate-spin" /> : <History size={14} className="text-cyan-700" />}
              <span>Historial de recetas de esta consulta ({recetasPrevias.length})</span>
            </div>
            {recetasPrevias.length === 0 ? (
              <p className="text-xs text-cyan-800/70">Aún no se ha emitido ninguna receta en esta consulta.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recetasPrevias.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => hceApi.descargarRecetaPdf(r.id).catch((err: any) => toast.error(err.message))}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-cyan-300 rounded-lg text-xs font-medium text-cyan-800 hover:bg-cyan-100 transition-colors shadow-sm"
                  >
                    <FileDown size={14} className="text-cyan-600" />
                    Receta N.° {String(r.numeroReceta).padStart(3, '0')} ({new Date(r.fecha).toLocaleDateString('es-EC')})
                  </button>
                ))}
              </div>
            )}
          </div>

          {citaAtendida && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
              <p className="text-sm font-semibold">La cita ya está atendida.</p>
              <p className="mt-1 text-xs">
                No se pueden emitir nuevas recetas. Puede descargar las recetas que ya fueron emitidas
                en esta consulta antes de cerrar la atención.
              </p>
            </div>
          )}

          {!citaAtendida && (
            <>
              {/* Sección 1: Datos del Paciente y Parámetros Clínicos */}
              <div className="border rounded-xl p-4 space-y-3 bg-neutral-50/50">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                1. Datos Clínicos y Paciente
              </h3>
              {paciente && (
                <span className="text-xs font-semibold text-neutral-800">
                  {paciente.nombres} {paciente.apellidos} — C.I: {paciente.numeroIdentificacion || '—'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <DatoPaciente label="Apellidos y nombres" value={`${paciente?.apellidos || ''} ${paciente?.nombres || ''}`.trim()} />
              <DatoPaciente label="Documento de identidad" value={paciente?.numeroIdentificacion} />
              <DatoPaciente label="Historia clínica" value={historiaClinica} />
              <DatoPaciente label="Sexo" value={sexoPaciente(paciente)} />
              <DatoPaciente label="Fecha de nacimiento" value={paciente?.fechaNacimiento ? new Date(paciente.fechaNacimiento).toLocaleDateString('es-EC') : ''} />
              <DatoPaciente label="Edad" value={edadPaciente} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Estado de enfermedad *</label>
                <div className="flex rounded-lg border overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setEstadoEnfermedad('AGUDO')}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${estadoEnfermedad === 'AGUDO' ? 'bg-cyan-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
                  >
                    Agudo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstadoEnfermedad('CRONICO')}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${estadoEnfermedad === 'CRONICO' ? 'bg-cyan-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
                  >
                    Crónico
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Validez de la receta</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={validezDias}
                    onChange={(e) => setValidezDias(Number(e.target.value) || 3)}
                    className="w-full border rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-neutral-500 whitespace-nowrap">días</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Peso (kg)</label>
                <input
                  type="text"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ej: 68"
                  className="w-full border rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Talla (cm)</label>
                <input
                  type="text"
                  value={talla}
                  onChange={(e) => setTalla(e.target.value)}
                  placeholder="Ej: 170"
                  className="w-full border rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Diagnóstico registrado (CIE-10/DSM-5 o discusión) *
                </label>
                {!tieneDiagnostico ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    No hay diagnóstico registrado. Búscalo y agrégalo en el módulo <b>Diagnóstico</b> (CIE-10/DSM-5) o guárdalo en la discusión diagnóstica.
                  </div>
                ) : (
                  <div className="rounded-lg border bg-neutral-50 px-3 py-2 text-xs text-neutral-700 space-y-1">
                    {(diagnostico || (diagDiscusion ? `Discusión diagnóstica: ${diagDiscusion}` : ''))
                      .split(/;\s*/)
                      .filter(Boolean)
                      .map((line, index) => (
                        <div key={`${index}-${line}`}>{line}</div>
                      ))}
                  </div>
                )}
                {diagnosticos.length > 0 ? (
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Se incluyen todos los diagnósticos registrados, con su sistema CIE-10/DSM-5 y el principal marcado.
                  </p>
                ) : diagDiscusion ? (
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Tomado del campo Diagnóstico de la discusión diagnóstica. Agrega un CIE-10/DSM-5 para codificarlo.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Alergias conocidas</label>
                <input
                  type="text"
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  placeholder="Ej: Penicilina, AINEs (o 'No refiere')"
                  className="w-full border rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Medicamentos e Indicaciones */}
          <div className="border rounded-xl p-4 space-y-3 bg-neutral-50/50">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                  2. Medicamentos e Indicaciones (DCI)
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Cumple con el formato oficial institucional de la receta médica. {items.length}/6 medicamentos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setItems((prev) => (prev.length < 6 ? [...prev, { ...ITEM_VACIO }] : prev))}
                disabled={items.length >= 6}
                className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-cyan-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={items.length >= 6 ? 'Máximo 6 medicamentos por receta' : 'Agregar medicamento'}
              >
                <Plus size={14} /> Agregar Medicamento
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, index) => (
                <div key={index} className="border border-neutral-200 rounded-xl p-3 bg-white space-y-2 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-xs font-bold text-cyan-800">Medicamento #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 p-1 rounded"
                        title="Eliminar medicamento"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500">
                        Medicamento (DCI) *
                      </label>
                      <input
                        value={it.medicamento}
                        onChange={(e) => updateItem(index, 'medicamento', e.target.value)}
                        placeholder="Ej: SERTRALINA, PARACETAMOL..."
                        autoComplete="off"
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500">
                        Forma farmacéutica *
                      </label>
                      <select
                        value={it.formaFarmaceutica}
                        onChange={(e) => updateItem(index, 'formaFarmaceutica', e.target.value)}
                        autoComplete="off"
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      >
                        {FORMAS_FARMACEUTICAS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500">
                        Concentración *
                      </label>
                      <input
                        value={it.concentracion}
                        onChange={(e) => updateItem(index, 'concentracion', e.target.value)}
                        placeholder="Ej: 50 mg, 500 mg, 10 mg/ml"
                        autoComplete="off"
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500">
                        Vía de administración *
                      </label>
                      <select
                        value={it.via}
                        onChange={(e) => updateItem(index, 'via', e.target.value)}
                        autoComplete="off"
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      >
                        {VIAS_ADMINISTRACION.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500">
                        Cantidad en números *
                      </label>
                      <input
                        value={it.cantidad}
                        onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                        placeholder="Ej: 30"
                        autoComplete="off"
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500">
                        Cantidad en letras *
                      </label>
                      <input
                        value={it.cantidadLetras}
                        onChange={(e) => updateItem(index, 'cantidadLetras', e.target.value)}
                        placeholder="Ej: treinta"
                        autoComplete="off"
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500">Dosis / Posología *</label>
                      <input
                        value={it.dosis}
                        onChange={(e) => updateItem(index, 'dosis', e.target.value)}
                        placeholder="Ej: 1 tableta, 5 ml"
                        autoComplete="off"
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500">Frecuencia *</label>
                      <input
                        value={it.frecuencia}
                        onChange={(e) => updateItem(index, 'frecuencia', e.target.value)}
                        placeholder="Ej: cada 12 horas, cada 24 horas"
                        autoComplete="off"
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500">Duración *</label>
                      <input
                        value={it.duracion}
                        onChange={(e) => updateItem(index, 'duracion', e.target.value)}
                        placeholder="Ej: 30 días, 7 días"
                        autoComplete="off"
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500">
                      Indicaciones específicas del medicamento
                    </label>
                    <input
                      value={it.indicaciones}
                      onChange={(e) => updateItem(index, 'indicaciones', e.target.value)}
                      placeholder="Ej: Tomar por la mañana después de desayunar..."
                      className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección 3: Signos de Alarma y Recomendaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-xl p-3 bg-neutral-50/50 space-y-1">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
                Signos de Alarma
              </label>
              <textarea
                value={signosAlarma}
                onChange={(e) => setSignosAlarma(e.target.value)}
                rows={2}
                className="w-full border rounded-lg p-2.5 text-xs bg-white"
              />
            </div>

            <div className="border rounded-xl p-3 bg-neutral-50/50 space-y-1">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
                Recomendaciones no farmacológicas
              </label>
              <textarea
                value={recomendacionesNoFarmacologicas}
                onChange={(e) => setRecomendacionesNoFarmacologicas(e.target.value)}
                rows={2}
                className="w-full border rounded-lg p-2.5 text-xs bg-white"
              />
            </div>
          </div>

          {/* Sección 4: Firma del Prescriptor */}
          <div className="border-2 border-cyan-200 bg-cyan-50/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-cyan-900 font-bold text-xs uppercase tracking-wide">
              <ShieldCheck size={16} className="text-cyan-700" />
              <span>Validación y Firma Digital del Prescriptor</span>
            </div>
            <p className="text-[11px] text-cyan-800">
              La receta médica será firmada digitalmente con su clave y generará el documento oficial con el membrete institucional de la ULEAM.
            </p>
            <p className="text-[11px] font-medium text-cyan-900">
              Ingrese su contraseña en la barra inferior para firmar y emitir.
            </p>
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!citaAtendida && (
          <div className="px-6 py-4 border-t bg-neutral-50">
            {formError && (
              <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {formError}
              </div>
            )}
            <div className={`flex flex-col gap-3 ${inline ? 'sm:flex-row sm:items-end sm:justify-end' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
              {!inline && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Cerrar
                </button>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div>
                  <label htmlFor="receta-password" className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Contraseña de firma del Especialista *
                  </label>
                  <input
                    id="receta-password"
                    name="receta-firma-password"
                    ref={passwordRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !saving) generar();
                    }}
                    placeholder="Ingrese su contraseña institucional"
                    autoComplete="new-password"
                    className="w-full sm:w-72 border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={generar}
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:from-cyan-700 hover:to-sky-700 transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                  {saving ? 'Emitiendo receta...' : 'Firmar y Emitir Receta Médica'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
