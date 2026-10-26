'use client';

import { useEffect, useState } from 'react';
import { apiClient, hceApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { X, Plus, Trash2, Search, ChevronDown, ChevronRight, Save, AlertTriangle, Lock, FileDown, FileText, UserMinus, Share2, Check, MessageSquare } from 'lucide-react';
import { FirmaDigitalModal } from '@/components/hce/FirmaDigitalModal';
import { ObservacionesDevolucionModal } from '@/components/hce/ObservacionesDevolucionModal';
import EvalNeuroconductualForm from '@/components/hce/EvalNeuroconductualForm';
import EvalNeuropsicometricaForm from '@/components/hce/EvalNeuropsicometricaForm';
import DiscusionDiagnosticaForm from '@/components/hce/DiscusionDiagnosticaForm';
import PlanTratamientoForm from '@/components/hce/PlanTratamientoForm';
import TratamientosPublicos from '@/components/hce/TratamientosPublicos';
import OptometriaInformeForm from '@/components/hce/OptometriaInformeForm';
import { RecetaModal } from '@/components/hce/RecetaModal';
import { CertificadoMedicoModal } from '@/components/hce/CertificadoMedicoModal';
import { AltaPacienteModal, DerivacionModal } from '@/components/hce/AltaDerivacionModals';
import { todayStr } from '@/lib/utils';

const ESPECIALIDAD_NEUROPSICOLOGIA = 'Neuropsicología';
const ESPECIALIDAD_OPTOMETRIA = 'Optometría';

function formatFechaHora(value?: string | Date | null) {
  if (!value) return '';
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

interface Props {
  cita: any;
  onClose: () => void;
}

export default function AtencionView({ cita, onClose }: Props) {
  const [estado, setEstado] = useState(cita.estado);
  const [consultaId, setConsultaId] = useState<string | null>(null);
  const [espId, setEspId] = useState<string>('');
  const [especialidad, setEspecialidad] = useState<string>('');
  const [loading, setLoading] = useState(true);
  // Módulos HCE habilitados para la especialidad (configuración del admin)
  const [modulosOn, setModulosOn] = useState<Set<string> | null>(null);
  const [modulosConfiguradosSet, setModulosConfiguradosSet] = useState<Set<string> | null>(null);
  const esNeuropsi = especialidad === ESPECIALIDAD_NEUROPSICOLOGIA;
  const esOptometria = especialidad === ESPECIALIDAD_OPTOMETRIA;

  // ── Datos del paciente (colapsado) ──
  const [showPaciente, setShowPaciente] = useState(false);
  const [paciente, setPaciente] = useState<any>(null);
  const [antecedentes, setAntecedentes] = useState<any[]>([]);
  const [alergias, setAlergias] = useState<any[]>([]);
  const [habitos, setHabitos] = useState<any[]>([]);

  // ── Consulta ──
  const [consultaData, setConsultaData] = useState({
    motivoConsulta: '', enfermedadActual: '', tipoConsulta: '',
    condicionConsulta: '', formaConsulta: '', tipoAtencion: '',
  });
  const esTeleconsulta = consultaData.tipoConsulta === 'Llamada telefónica' || consultaData.formaConsulta === 'Virtual';

  // ── Signos Vitales ──
  const [signosData, setSignosData] = useState({ presionArterial: '', frecuenciaCardiaca: '', temperatura: '', peso: '', talla: '', imc: '', dolorEVA: '', observaciones: '' });

  // ── Diagnósticos ──
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [discusionDiagnostica, setDiscusionDiagnostica] = useState<any>(null);
  const [cieSearch, setCieSearch] = useState('');
  const [cieResults, setCieResults] = useState<any[]>([]);
  const [cieLoading, setCieLoading] = useState(false);
  const [diagSistema, setDiagSistema] = useState<'CIE10' | 'DSM5'>('CIE10');
  const [diagEstado, setDiagEstado] = useState<'DEFINITIVO' | 'PRESUNTIVO'>('PRESUNTIVO');
  const [diagForm, setDiagForm] = useState({ codigoCIE10: '', descripcion: '', tipo: 'PRINCIPAL', esPrincipal: false });

  // ── Receta ──
  const [prescripciones, setPrescripciones] = useState<any[]>([]);

  // ── Pedidos ──
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedForm, setPedForm] = useState({ tipo: 'LABORATORIO', descripcion: '', urgente: false });

  // ── Evolución ──
  const [evoluciones, setEvoluciones] = useState<any[]>([]);
  const [evolForm, setEvolForm] = useState({ nota: '' });

  // ── Indicaciones ──
  const [indicaciones, setIndicaciones] = useState<any[]>([]);
  const [indForm, setIndForm] = useState({ tipo: 'RECOMENDACION', descripcion: '' });

  // ── Documentos ──
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [docForm, setDocForm] = useState({ tipo: 'LAB', nombre: '', resultado: '' });

  // ── Examen Físico ──
  const [examen, setExamen] = useState<Record<string, string>>({});

  // ── Optometría ──
  const [informeOptometria, setInformeOptometria] = useState<any | null>(null);
  // Cierre del informe de optometría (secciones separadas del formulario principal)
  const [optCierre, setOptCierre] = useState({
    diagnosticoAO: '', tratamiento: '', evaluacion: '', observacion: '',
  });
  const [optSaving, setOptSaving] = useState<string | null>(null);

  const [showFirma, setShowFirma] = useState(false);
  const [showCertificado, setShowCertificado] = useState(false);
  const [showAlta, setShowAlta] = useState(false);
  const [showDerivacion, setShowDerivacion] = useState(false);
  const [showObsDevolucion, setShowObsDevolucion] = useState(false);
  const [firmada, setFirmada] = useState(false);
  const editable = estado === 'EN_ATENCION' && !firmada;
  const finalizado = ['ATENDIDA', 'CANCELADA', 'NO_ASISTIO'].includes(estado);
  const recetaBloqueada = estado === 'ATENDIDA';

  const validarConsulta = (): string | null => {
    const faltantes: string[] = [];
    if (!consultaData.tipoConsulta) faltantes.push('tipo de consulta');
    if (!consultaData.condicionConsulta) faltantes.push('condición');
    if (!consultaData.formaConsulta) faltantes.push('forma');
    if (!consultaData.tipoAtencion) faltantes.push('tipo de atención');
    if (faltantes.length > 0) {
      return `Complete los datos de la consulta: ${faltantes.join(', ')}`;
    }
    if (consultaData.tipoConsulta === 'Llamada telefónica' && consultaData.formaConsulta !== 'Virtual') {
      return 'Una llamada telefónica debe registrarse con forma Virtual';
    }
    if (consultaData.tipoConsulta === 'Llamada telefónica' && consultaData.tipoAtencion !== 'Consulta externa') {
      return 'Una llamada telefónica solo puede ser de tipo Consulta externa';
    }
    if (consultaData.formaConsulta === 'Virtual' && consultaData.tipoAtencion !== 'Consulta externa') {
      return 'Una atención virtual solo puede ser de tipo Consulta externa';
    }
    if (
      ['Emergencia', 'Hospitalizacion', 'Domiciliaria'].includes(consultaData.tipoAtencion)
      && consultaData.formaConsulta !== 'Presencial'
    ) {
      return 'Emergencia, Hospitalización y Domiciliaria requieren forma Presencial';
    }
    return null;
  };

  // ── Init ──
  const citaFecha = cita.fecha?.slice(0, 10) || '';
  const esHoy = citaFecha === todayStr();
  // Una cita ya iniciada (EN_ATENCION) puede continuarse y firmarse aunque no sea de hoy;
  // solo *iniciar* la atención exige que sea del día actual.
  const puedeGestionar = esHoy || estado === 'EN_ATENCION';
  // Si la especialidad tiene módulos configurados (al menos uno habilitado), se respetan:
  // las secciones de módulos deshabilitados no se muestran. Sin configuración, todo visible.
  const modulosConfigurados = modulosOn !== null && modulosOn.size > 0;
  const modOn = (key: string) => {
    if (!modulosConfigurados) return true;
    // Compatibilidad: "Enfermedad actual" e "Indicaciones" antes formaban parte del
    // flujo estándar. Si la especialidad no tiene una fila propia para estos módulos,
    // se mantienen visibles (las filas explícitamente deshabilitadas sí se respetan).
    if (['historial_enfermedad', 'indicaciones'].includes(key) && modulosConfiguradosSet && !modulosConfiguradosSet.has(key)) return true;
    return modulosOn!.has(key);
  };
  // Neuropsicología registra el diagnóstico dentro del módulo "Discusión diagnóstica";
  // el buscador CIE-10/DSM-5 debe estar disponible también en ese flujo.
  const diagModuleOn = modOn('diagnosticos') || (esNeuropsi && modOn('diagnostico_discusion'));

  // Hidrata las secciones de cierre de optometría con lo ya guardado, sin pisar
  // lo que el doctor esté escribiendo en ese momento.
  useEffect(() => {
    if (!informeOptometria) return;
    setOptCierre((prev) => ({
      diagnosticoAO: prev.diagnosticoAO || informeOptometria.diagnosticoAO || '',
      tratamiento: prev.tratamiento || informeOptometria.tratamiento || '',
      evaluacion: prev.evaluacion || informeOptometria.evaluacion || '',
      observacion: prev.observacion || informeOptometria.observacion || '',
    }));
  }, [informeOptometria]);

  // Carga el informe de optometría aunque el acordeón del formulario esté colapsado
  // (lo necesitan las secciones de cierre y el botón de devolución de resultados).
  useEffect(() => {
    if (!esOptometria || !consultaId) return;
    let active = true;
    hceApi.getOptometria(consultaId)
      .then((d) => { if (active) setInformeOptometria(d ?? null); })
      .catch(() => { /* aún no hay informe */ });
    return () => { active = false; };
  }, [esOptometria, consultaId]);

  // Diagnóstico libre de la discusión diagnóstica (Neuropsicología): sirve como
  // respaldo para la receta cuando aún no se ha agregado un CIE-10/DSM-5.
  useEffect(() => {
    if (!consultaId) return;
    let active = true;
    hceApi.getDiscusionDiagnostica(consultaId)
      .then((d) => { if (active) setDiscusionDiagnostica(d ?? null); })
      .catch(() => { /* aún no hay discusión guardada */ });
    return () => { active = false; };
  }, [consultaId]);

  useEffect(() => {
    (async () => {
      const eId = cita.especialistaId || cita.especialista?.id;
      setEspId(eId || '');
      const espFromCita = cita.especialista?.especialidad || '';
      if (espFromCita) {
        setEspecialidad(espFromCita);
      } else if (eId) {
        apiClient<any>(`/especialistas/${eId}`)
          .then((e) => { if (e?.especialidad) setEspecialidad(e.especialidad); })
          .catch(() => {});
      }

      const p = await apiClient<any>(`/pacientes/${cita.pacienteId || cita.paciente?.id}`).catch(() => null);
      setPaciente(p);
      if (p) {
        const hc = await apiClient<any>(`/hce/paciente/${p.id}/historial`).catch(() => null);
        setAntecedentes(Array.isArray(hc?.antecedentes) ? hc.antecedentes : []);

        const rawAlergias = hc?.alergias;
        if (Array.isArray(rawAlergias)) {
          setAlergias(rawAlergias);
        } else if (typeof rawAlergias === 'string' && rawAlergias.trim()) {
          setAlergias(rawAlergias.split(',').map((s: string) => ({ descripcion: s.trim(), gravedad: 'MODERADA', activa: true })));
        } else {
          setAlergias(hc?.historialAlergias || []);
        }

        setHabitos(Array.isArray(hc?.habitos) ? hc.habitos : []);

        const tieneDatos = (Array.isArray(hc?.antecedentes) && hc.antecedentes.length > 0)
                        || (Array.isArray(hc?.alergias) && hc.alergias.length > 0)
                        || (Array.isArray(hc?.habitos) && hc.habitos.length > 0);
        if (!tieneDatos) setShowPaciente(true);
      }

      const byCita = await apiClient<any>(`/hce/consulta/by-cita/${cita.id}`).catch(() => null);
      const full = byCita?.id ? byCita : null;
      if (full) {
        setConsultaId(full.id);
        setFirmada(!!full.firmada);
        setConsultaData({
          motivoConsulta: full.motivoConsulta || '', enfermedadActual: full.enfermedadActual || '',
          tipoConsulta: full.tipoConsulta || '', condicionConsulta: full.condicionConsulta || '',
          formaConsulta: full.formaConsulta || '',
          tipoAtencion: full.tipoAtencion || '',
        });
        setDiagnosticos(full.diagnosticos || []);
        setPrescripciones(full.prescripciones || []);
        setPedidos(full.pedidos || []);
        setEvoluciones(full.evoluciones || []);
        setIndicaciones(full.indicaciones || []);
        setDocumentos(full.examenes || []);
        setExamen({
          efEstadoGeneral: full.efEstadoGeneral || 'NO_EVALUADO', efCardiovascular: full.efCardiovascular || 'NO_EVALUADO',
          efRespiratorio: full.efRespiratorio || 'NO_EVALUADO', efAbdomen: full.efAbdomen || 'NO_EVALUADO',
          efNeurologico: full.efNeurologico || 'NO_EVALUADO', efExtremidades: full.efExtremidades || 'NO_EVALUADO',
          efPiel: full.efPiel || 'NO_EVALUADO', efCabezaCuello: full.efCabezaCuello || 'NO_EVALUADO',
          efObsGeneral: full.efObsGeneral || '', efObsCardio: full.efObsCardio || '', efObsResp: full.efObsResp || '',
          efObsAbdomen: full.efObsAbdomen || '', efObsNeuro: full.efObsNeuro || '', efObsExtrem: full.efObsExtrem || '',
          efObsPiel: full.efObsPiel || '', efObsCabeza: full.efObsCabeza || '',
        });
        const sig = full.signosVitales?.[0];
        if (sig) setSignosData({ presionArterial: sig.presionArterial || '', frecuenciaCardiaca: sig.frecuenciaCardiaca || '', temperatura: sig.temperatura || '', peso: sig.peso || '', talla: sig.talla || '', imc: sig.imc || '', dolorEVA: sig.dolorEVA || '', observaciones: sig.observaciones || '' });
      }
      if (eId) {
        const mods = await hceApi.getModulos(eId).catch(() => null);
        if (Array.isArray(mods)) {
          const modsArr = mods as unknown as any[];
          setModulosOn(new Set(modsArr.filter((m) => m?.habilitado).map((m) => m.modulo)));
          setModulosConfiguradosSet(new Set(modsArr.filter((m) => m?.configurado).map((m) => m.modulo)));
        }
      }
      setLoading(false);
    })();
  }, [cita]);

  // ── Búsqueda de diagnósticos CIE-10 / DSM-5 ──
  useEffect(() => {
    const q = cieSearch.trim();
    if (!q) {
      setCieResults([]);
      setCieLoading(false);
      return;
    }
    let cancelled = false;
    setCieLoading(true);
    const t = setTimeout(async () => {
      const res = await apiClient<any[]>(`/hce/diagnosticos/search?q=${encodeURIComponent(q)}&sistema=${diagSistema}`).catch(() => []);
      if (!cancelled) {
        setCieResults(Array.isArray(res) ? res : []);
        setCieLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [cieSearch, diagSistema]);

  const refreshAntecedentes = async () => {
    if (!paciente?.id) return;
    const list = await hceApi.getAntecedentes(paciente.id).catch(() => []);
    setAntecedentes(Array.isArray(list) ? list : []);
  };

  // ── Acciones ──
  const cambiarEstado = async (nuevo: string) => {
    try {
      if (nuevo === 'EN_ATENCION' && !consultaId) {
        const res = await apiClient<any>('/hce/consulta', { method: 'POST', body: JSON.stringify({ pacienteId: cita.paciente?.id || cita.pacienteId, citaId: cita.id, especialistaId: espId }) });
        setConsultaId(res.id);
      }
      await apiClient(`/citas/${cita.id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado: nuevo }) });
      setEstado(nuevo);
      if (nuevo === 'ATENDIDA') onClose();
      toast.success(`Cita ${nuevo}`);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleFirmar = async (password: string) => {
    if (!consultaId) throw new Error('Sin consulta');
    await apiClient(`/hce/consulta/${consultaId}/firmar`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    setFirmada(true);
    // La firma ya quedó registrada. Si falla el cambio de estado de la cita,
    // no se debe mostrar como error de firma ni invitar a firmar de nuevo.
    let citaMarcadaAtendida = false;
    try {
      await apiClient(`/citas/${cita.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'ATENDIDA' }),
      });
      setEstado('ATENDIDA');
      citaMarcadaAtendida = true;
    } catch (e: any) {
      toast.error(`La HCE se firmó, pero no se pudo marcar la cita como atendida: ${e.message}`);
    }
    toast.success(citaMarcadaAtendida
      ? 'HCE firmada. La cita quedó ATENDIDA; no se pueden emitir nuevas recetas.'
      : 'HCE firmada correctamente.');
    // Mantener la vista abierta para descargar documentos y emitir certificado, alta o derivación.
  };

  const saveConsulta = async () => {
    if (!consultaId) return;
    const errorConsulta = validarConsulta();
    if (errorConsulta) {
      toast.error(errorConsulta);
      return;
    }
    try {
      await apiClient(`/hce/consulta/${consultaId}`, { method: 'PATCH', body: JSON.stringify(consultaData) });
      toast.success('Consulta guardada');
    } catch (e: any) { toast.error(e.message); }
  };

  const saveExamen = async () => {
    if (!consultaId) return;
    try {
      const payload: any = {};
      for (const [k, v] of Object.entries(examen)) payload[k] = v;
      await apiClient(`/hce/consulta/${consultaId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      toast.success('Examen guardado');
    } catch (e: any) { toast.error(e.message); }
  };

  const addDiagnostico = async () => {
    if (!consultaId || !diagForm.codigoCIE10) return;
    try {
      const payload: any = {
        codigo: diagForm.codigoCIE10,
        codigoCIE10: diagForm.codigoCIE10,
        descripcion: diagForm.descripcion,
        tipo: diagForm.tipo,
        sistema: diagSistema,
        estado: diagEstado,
      };
      if (diagForm.esPrincipal) payload.esPrincipal = true;
      const d = await apiClient(`/hce/consulta/${consultaId}/diagnostico`, { method: 'POST', body: JSON.stringify(payload) });
      setDiagnosticos([...diagnosticos, d]);
      setDiagForm({ codigoCIE10: '', descripcion: '', tipo: 'PRINCIPAL', esPrincipal: false });
      setCieSearch('');
      setCieResults([]);
    } catch (e: any) { toast.error(e.message); }
  };

  const removeDiag = async (id: string) => {
    await apiClient(`/hce/diagnostico/${id}`, { method: 'DELETE' });
    setDiagnosticos(d => d.filter(x => x.id !== id));
  };

  const confirmarDiag = async (id: string) => {
    try {
      const d = await apiClient<any>(`/hce/diagnostico/${id}/confirmar`, { method: 'PATCH' });
      setDiagnosticos((prev) => prev.map((x) => x.id === id ? { ...x, ...d } : x));
      toast.success('Diagnóstico confirmado como definitivo');
    } catch (e: any) { toast.error(e.message); }
  };

  const addPedido = async () => {
    if (!consultaId || !pedForm.descripcion) return;
    const d = await apiClient(`/hce/consulta/${consultaId}/pedido`, { method: 'POST', body: JSON.stringify(pedForm) });
    setPedidos([...pedidos, d]);
    setPedForm({ tipo: 'LABORATORIO', descripcion: '', urgente: false });
  };

  const addEvolucion = async () => {
    if (!consultaId) return;
    const d = await apiClient(`/hce/consulta/${consultaId}/evolucion`, { method: 'POST', body: JSON.stringify(evolForm) });
    setEvoluciones([...evoluciones, d]);
    setEvolForm({ nota: '' });
  };

  const addIndicacion = async () => {
    if (!consultaId || !indForm.descripcion) return;
    const d = await apiClient(`/hce/consulta/${consultaId}/indicacion`, { method: 'POST', body: JSON.stringify(indForm) });
    setIndicaciones([...indicaciones, d]);
    setIndForm({ tipo: 'RECOMENDACION', descripcion: '' });
  };

  const addDocumento = async () => {
    if (!consultaId || !docForm.nombre) return;
    const d = await apiClient(`/hce/consulta/${consultaId}/examen`, { method: 'POST', body: JSON.stringify(docForm) });
    setDocumentos([...documentos, d]);
    setDocForm({ tipo: 'LAB', nombre: '', resultado: '' });
  };

  const addSignos = async () => {
    if (!consultaId) return;
    const calcIMC = signosData.peso && signosData.talla ? (+signosData.peso / ((+signosData.talla / 100) ** 2)).toFixed(1) : signosData.imc;
    const d = await apiClient(`/hce/paciente/${paciente?.id}/signo-vital`, { method: 'POST', body: JSON.stringify({ ...signosData, imc: calcIMC, consultaId }) });
    toast.success('Signos guardados');
  };

  // Guarda un campo del cierre del informe de optometría (sección independiente).
  const saveOptCierre = async (campo: keyof typeof optCierre, label: string) => {
    if (!consultaId) return;
    setOptSaving(campo);
    try {
      await hceApi.saveOptometria(consultaId, { [campo]: optCierre[campo] });
      toast.success(`${label} guardado`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setOptSaving(null);
    }
  };

  // Numeración del flujo de optometría: mismas tarjetas numeradas y colapsables
  // que la HCE de Neuropsicología (solo se cuentan las secciones visibles).
  const optOrden = [
    'antecedente', 'consulta', 'historial_enfermedad', 'signos_vitales', 'examen_fisico', 'pedidos',
    'optometria', 'diagnosticos', 'tratamiento', 'evaluar', 'observacion',
    'prescripcion', 'evolucion', 'indicaciones', 'documentos',
  ];
  const optVisibles = optOrden.filter((k) => {
    if (esTeleconsulta && ['signos_vitales', 'examen_fisico'].includes(k)) return false;
    if (['antecedente', 'evaluar', 'observacion', 'documentos'].includes(k)) return true;
    if (['optometria', 'diagnosticos', 'tratamiento'].includes(k)) return modOn('optometria') && modOn(k);
    return modOn(k);
  });
  const optTitulo = (key: string, label: string) => {
    if (!esOptometria) return label;
    const i = optVisibles.indexOf(key);
    return i >= 0 ? `${i + 1}. ${label}` : label;
  };

  // Secciones compartidas: en optometría se reubican dentro del flujo solicitado
  // (Exámenes = Examen Físico + Pedidos; Diagnóstico dentro de la HC Optometría).
  const seccionDiagnosticos = (
    <Section
      titulo={esNeuropsi ? '6. Diagnóstico - Discusión diagnóstica' : esOptometria ? optTitulo('diagnosticos', 'Diagnóstico') : 'Diagnósticos'}
      defaultCollapsed={esOptometria}
      hidden={!diagModuleOn}
    >
      {editable && diagModuleOn && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Diagnóstico codificado (CIE-10/DSM-5)</p>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex rounded-lg border overflow-hidden">
              {(['CIE10', 'DSM5'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setDiagSistema(s); setCieSearch(''); setCieResults([]); setDiagForm({ ...diagForm, codigoCIE10: '', descripcion: '' }); }}
                  className={`px-3 py-1.5 text-xs font-medium ${diagSistema === s ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {s === 'CIE10' ? 'CIE-10' : 'DSM-5'}
                </button>
              ))}
            </div>
            <select value={diagEstado} onChange={(e) => setDiagEstado(e.target.value as any)} className="border rounded-lg px-2 py-1.5 text-xs">
              <option value="DEFINITIVO">Definitivo</option>
              <option value="PRESUNTIVO">Presuntivo / temporal</option>
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
            <input value={cieSearch} onChange={e => { setCieSearch(e.target.value); setDiagForm({...diagForm, codigoCIE10: '', descripcion: ''}); }} placeholder={diagSistema === 'DSM5' ? 'Buscar DSM-5...' : 'Buscar CIE-10...'} className="w-full pl-8 border rounded-lg px-3 py-2 text-sm" />
          </div>
          {cieSearch.trim() && (
            <div className="border rounded-lg max-h-36 overflow-y-auto">
              {cieLoading ? (
                <div className="px-3 py-2 text-xs text-gray-500">Buscando...</div>
              ) : cieResults.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500">Sin resultados para “{cieSearch.trim()}”.</div>
              ) : (
                cieResults.map((r: any) => (
                  <button key={`${r.codigo}-${r.descripcion}`} onClick={() => { setDiagForm({...diagForm, codigoCIE10: r.codigo, descripcion: r.descripcion}); setCieSearch(''); setCieResults([]); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 border-b last:border-0">
                    <span className="font-mono text-blue-600">{r.codigo}</span> — {r.descripcion}
                  </button>
                ))
              )}
            </div>
          )}
          {diagForm.codigoCIE10 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">{diagSistema} {diagForm.codigoCIE10}</span>
              <span className="text-sm text-gray-600 flex-1">{diagForm.descripcion}</span>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={diagForm.esPrincipal} onChange={e => setDiagForm({...diagForm, esPrincipal: e.target.checked})} /> Principal</label>
              <button onClick={addDiagnostico} className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg flex items-center gap-1"><Plus size={12} /> Agregar</button>
            </div>
          )}
        </div>
      )}
      {diagModuleOn && (
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Historial de diagnósticos</p>
          {diagnosticos.length === 0 ? (
            <p className="text-xs text-gray-400">Aún no hay diagnósticos registrados en esta consulta.</p>
          ) : (
            <div className="relative space-y-3">
              <div className="absolute left-[5px] top-1 bottom-1 w-px bg-gray-200" />
              {[...diagnosticos]
                .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((d: any, index: number) => {
                  const cerrado = d.estado === 'DEFINITIVO';
                  const sistema = d.sistema === 'DSM5' ? 'DSM-5' : 'CIE-10';
                  const codigo = d.codigo || d.codigoCIE10 || '';
                  return (
                    <div key={d.id} className="relative pl-6">
                      <span className={`absolute left-0 top-2 h-2.5 w-2.5 rounded-full border-2 ${cerrado ? 'border-green-500 bg-green-500' : 'border-amber-400 bg-white'}`} />
                      <div className={`rounded-lg border px-3 py-2 ${cerrado ? 'bg-white' : 'border-amber-200 bg-amber-50/40'}`}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-gray-700">
                            Diagnóstico {String(index + 1).padStart(3, '0')}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cerrado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {cerrado ? 'Definitivo · cerrado' : 'Temporal · presuntivo'}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                            {sistema}
                          </span>
                          {d.esPrincipal && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-800">
                          {codigo && <span className="font-mono">{codigo}</span>}
                          {codigo && d.descripcion ? ' — ' : ''}
                          {d.descripcion}
                        </p>
                        <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
                          <p>Creado: {formatFechaHora(d.createdAt)}</p>
                          {cerrado ? (
                            d.confirmadoEn ? (
                              <p>Confirmado definitivo: {formatFechaHora(d.confirmadoEn)}</p>
                            ) : (
                              <p>Registrado como definitivo</p>
                            )
                          ) : (
                            <p>Pendiente de confirmar</p>
                          )}
                        </div>
                        {editable && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {!cerrado && (
                              <button
                                onClick={() => confirmarDiag(d.id)}
                                className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1 text-xs text-white hover:bg-green-700"
                              >
                                <Check size={12} /> Marcar definitivo
                              </button>
                            )}
                            <button
                              onClick={() => removeDiag(d.id)}
                              className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={12} /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
      {esNeuropsi && modOn('diagnostico_discusion') && (
        <div className="mt-3 pt-3 border-t">
          <DiscusionDiagnosticaForm consultaId={consultaId} editable={editable} onSaved={setDiscusionDiagnostica} />
        </div>
      )}
      {esOptometria && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <Field
            label="Diagnóstico A.O. (informe de optometría)"
            value={optCierre.diagnosticoAO}
            onChange={(v) => setOptCierre({ ...optCierre, diagnosticoAO: v })}
            disabled={!editable}
            placeholder="Emetrope, astigmatismo…"
          />
          {editable && (
            <button
              onClick={() => saveOptCierre('diagnosticoAO', 'Diagnóstico A.O.')}
              disabled={optSaving === 'diagnosticoAO'}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <Save size={14} className="inline mr-1" />{optSaving === 'diagnosticoAO' ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>
      )}
    </Section>
  );

  const seccionAntecedentes = (
    <Section
      titulo={esNeuropsi ? '3. Antecedentes' : optTitulo('antecedente', 'Antecedentes')}
      defaultCollapsed={esNeuropsi || esOptometria}
      hidden={!modOn('antecedentes')}
    >
      <AntecedentesPanel
        pacienteId={paciente?.id}
        antecedentes={antecedentes}
        editable={editable}
        onChanged={refreshAntecedentes}
      />
    </Section>
  );

  const seccionHistorialEnfermedad = (
    <Section
      titulo={esNeuropsi ? '2. Enfermedad actual' : optTitulo('historial_enfermedad', 'Enfermedad actual')}
      defaultCollapsed={esNeuropsi || esOptometria}
      hidden={!modOn('historial_enfermedad')}
    >
      <div className="grid grid-cols-1 gap-3">
        <FieldArea
          label="Enfermedad actual"
          value={consultaData.enfermedadActual}
          onChange={v => setConsultaData({ ...consultaData, enfermedadActual: v })}
          disabled={!editable}
        />
        {editable && (
          <button
            onClick={saveConsulta}
            className="self-start px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
          >
            <Save size={14} className="inline mr-1" />Guardar
          </button>
        )}
      </div>
    </Section>
  );

  const seccionPedidos = (
    <Section titulo={optTitulo('pedidos', 'Pedidos / Órdenes')} defaultCollapsed={esOptometria} hidden={!modOn('pedidos')}>
      {editable && (
        <div className="flex gap-2">
          <select value={pedForm.tipo} onChange={e => setPedForm({...pedForm, tipo: e.target.value})} className="border rounded-lg px-3 py-2 text-sm">
            {['LABORATORIO','IMAGEN','ECOGRAFIA','TOMOGRAFIA','RESONANCIA','INTERCONSULTA','PROCEDIMIENTO','OTRO'].map(t => <option key={t}>{t}</option>)}
          </select>
          <input value={pedForm.descripcion} onChange={e => setPedForm({...pedForm, descripcion: e.target.value})} placeholder="Descripción..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={pedForm.urgente} onChange={e => setPedForm({...pedForm, urgente: e.target.checked})} /> Urgente</label>
          <button onClick={addPedido} className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg"><Plus size={14} /></button>
        </div>
      )}
      {pedidos.map((p: any) => (
        <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mt-1 text-sm">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{p.tipo}</span>
          <span className="flex-1 ml-2">{p.descripcion}</span>
          {p.urgente && <span className="text-xs text-red-500 font-bold">URGENTE</span>}
          {editable && <button onClick={async () => { await apiClient(`/hce/pedido/${p.id}`, { method: 'DELETE' }); setPedidos(d => d.filter(x => x.id !== p.id)); }}><Trash2 size={14} className="text-red-500" /></button>}
        </div>
      ))}
    </Section>
  );

  if (loading) return <div className="flex items-center justify-center py-24"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="w-full space-y-6 pb-24">
          {/* Header sticky: top-[53px] para quedar debajo de la barra superior fija del DashboardLayout */}
          <div className="bg-white border rounded-2xl shadow-sm">
            <div className="sticky top-[53px] bg-white px-6 py-4 flex items-center justify-between z-10 rounded-2xl">
              <div>
                <h2 className="text-lg font-bold">Atención Médica</h2>
                <p className="text-sm text-gray-500">{paciente?.nombres} {paciente?.apellidos} — {cita.horaInicio}</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                {puedeGestionar && !finalizado && ['PENDIENTE', 'CONFIRMADA', 'REAGENDADA', 'EN_ESPERA'].includes(estado) && (
                  <button
                    onClick={() => cambiarEstado('EN_ATENCION')}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Atender
                  </button>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                  estado === 'PENDIENTE' ? 'bg-yellow-500' : estado === 'CONFIRMADA' ? 'bg-blue-500' : estado === 'EN_ESPERA' ? 'bg-purple-500' : estado === 'EN_ATENCION' ? 'bg-green-500' : estado === 'ATENDIDA' ? 'bg-gray-500' : 'bg-red-500'
                }`}>{estado}</span>
                <button
                  onClick={onClose}
                  className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
                >
                  <X size={16} /> Cerrar
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* ── DATOS DEL PACIENTE: mismo bloque y ubicación para todas las especialidades ── */}
            <div className={`border rounded-xl ${editable && antecedentes.length === 0 && alergias.length === 0 && habitos.length === 0 ? 'border-amber-300 bg-amber-50' : 'bg-white'}`}>
              <button
                type="button"
                onClick={() => setShowPaciente((v) => !v)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {showPaciente ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  <span className="font-semibold text-sm">Datos del Paciente</span>
                  {antecedentes.length > 0 && !modOn('antecedentes') && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{antecedentes.length} antecedentes</span>
                  )}
                  {alergias.length > 0 && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{alergias.length} alergias</span>}
                  {editable && antecedentes.length === 0 && alergias.length === 0 && habitos.length === 0 && (
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full animate-pulse">Completar datos</span>
                  )}
                </div>
              </button>

              {showPaciente && (
                <div className="px-4 pb-4 border-t pt-3">
                  <DatosPacientePanel
                    paciente={paciente}
                    antecedentes={antecedentes}
                    alergias={alergias}
                    habitos={habitos}
                    mostrarAntecedentes={!modOn('antecedentes')}
                    editable={editable}
                  />
                </div>
              )}
            </div>

            {/* ── NEUROPSICOLOGÍA: secciones 1–5 ── */}
            {esNeuropsi && (
              <>
                <Section titulo="1. Consulta y motivo de consulta" hidden={!modOn('consulta') && !modOn('motivo_consulta')}>
                  <ConsultaSelects data={consultaData} setData={setConsultaData} disabled={!editable} />
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    <FieldArea label="Motivo de consulta" value={consultaData.motivoConsulta} onChange={v => setConsultaData({...consultaData, motivoConsulta: v})} disabled={!editable} />
                  </div>
                  {editable && <button onClick={saveConsulta} className="mt-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"><Save size={14} className="inline mr-1" />Guardar</button>}
                </Section>

                {seccionHistorialEnfermedad}

                {seccionAntecedentes}

                <Section titulo="4. Evaluación neuroconductual" defaultCollapsed hidden={!modOn('eval_neuroconductual')}>
                  <EvalNeuroconductualForm consultaId={consultaId} editable={editable} />
                </Section>

                <Section titulo="5. Evaluación neuropsicométrica" defaultCollapsed hidden={!modOn('eval_neuropsicometrica')}>
                  <EvalNeuropsicometricaForm consultaId={consultaId} editable={editable} />
                </Section>
              </>
            )}

            {/* ── ANTECEDENTES (todas las especialidades) ── */}
            {!esNeuropsi && seccionAntecedentes}

            {/* ── CONSULTA ── */}
            {!esNeuropsi && (
            <Section titulo={optTitulo('consulta', 'Consulta y motivo de consulta')} defaultCollapsed={esOptometria} hidden={!modOn('consulta') && !modOn('motivo_consulta')}>
              <ConsultaSelects data={consultaData} setData={setConsultaData} disabled={!editable} />
              <div className="grid grid-cols-1 gap-3 mt-3">
                <FieldArea label="Motivo de consulta" value={consultaData.motivoConsulta} onChange={v => setConsultaData({...consultaData, motivoConsulta: v})} disabled={!editable} />
                {editable && <button onClick={saveConsulta} className="self-end px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"><Save size={14} className="inline mr-1" />Guardar</button>}
              </div>
            </Section>
            )}

            {/* ── ENFERMEDAD ACTUAL ── */}
            {!esNeuropsi && seccionHistorialEnfermedad}

            {/* ── SIGNOS VITALES ── */}
            {!esNeuropsi && (
            <Section titulo={optTitulo('signos_vitales', 'Signos Vitales')} defaultCollapsed={esOptometria} hidden={!modOn('signos_vitales') || esTeleconsulta}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Field label="PA" value={signosData.presionArterial} onChange={v => setSignosData({...signosData, presionArterial: v})} disabled={!editable} placeholder="120/80" />
                <Field label="FC" value={signosData.frecuenciaCardiaca} onChange={v => setSignosData({...signosData, frecuenciaCardiaca: v})} disabled={!editable} placeholder="72" />
                <Field label="T°" value={signosData.temperatura} onChange={v => setSignosData({...signosData, temperatura: v})} disabled={!editable} placeholder="36.5" />
                <Field label="Dolor (0-10)" value={signosData.dolorEVA} onChange={v => setSignosData({...signosData, dolorEVA: v})} disabled={!editable} placeholder="0" />
                <Field label="Peso (kg)" value={signosData.peso} onChange={v => setSignosData({...signosData, peso: v, imc: ''})} disabled={!editable} />
                <Field label="Talla (cm)" value={signosData.talla} onChange={v => setSignosData({...signosData, talla: v, imc: ''})} disabled={!editable} />
                <Field label="IMC" value={signosData.peso && signosData.talla ? (+signosData.peso / ((+signosData.talla / 100) ** 2)).toFixed(1) : signosData.imc} onChange={() => {}} disabled />
                <Field label="Observaciones" value={signosData.observaciones} onChange={v => setSignosData({...signosData, observaciones: v})} disabled={!editable} />
              </div>
              {editable && <button onClick={addSignos} className="mt-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"><Save size={14} className="inline mr-1" />Guardar Signos</button>}
            </Section>
            )}

            {/* ── EXAMEN FÍSICO ── */}
            {!esNeuropsi && (
            <Section titulo={optTitulo('examen_fisico', 'Examen Físico')} defaultCollapsed={esOptometria} hidden={!modOn('examen_fisico') || esTeleconsulta}>
              <div className="grid grid-cols-2 gap-3">
                {['General', 'Cardiovascular', 'Respiratorio', 'Abdomen', 'Neurológico', 'Extremidades', 'Piel', 'Cabeza/Cuello'].map((s, i) => {
                  const key = ['efEstadoGeneral', 'efCardiovascular', 'efRespiratorio', 'efAbdomen', 'efNeurologico', 'efExtremidades', 'efPiel', 'efCabezaCuello'][i];
                  const obsKey = ['efObsGeneral', 'efObsCardio', 'efObsResp', 'efObsAbdomen', 'efObsNeuro', 'efObsExtrem', 'efObsPiel', 'efObsCabeza'][i];
                  return (
                    <div key={s} className="border rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium w-28">{s}</span>
                        <select value={examen[key] || 'NO_EVALUADO'} onChange={e => setExamen({...examen, [key]: e.target.value})} disabled={!editable} className="text-xs border rounded px-2 py-1 flex-1">
                          <option value="NO_EVALUADO">No evaluado</option>
                          <option value="NORMAL">Normal</option>
                          <option value="ALTERADO">Alterado</option>
                        </select>
                      </div>
                      {editable && <textarea value={examen[obsKey] || ''} onChange={e => setExamen({...examen, [obsKey]: e.target.value})} className="w-full border rounded px-2 py-1 text-xs mt-1" placeholder="Observación..." rows={1} />}
                      {!editable && examen[obsKey] && <p className="text-xs text-gray-500 mt-1">{examen[obsKey]}</p>}
                    </div>
                  );
                })}
              </div>
              {editable && <button onClick={saveExamen} className="mt-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"><Save size={14} className="inline mr-1" />Guardar Examen</button>}
            </Section>
            )}

            {/* Optometría: "Exámenes 2" = Examen Físico + Pedidos/Órdenes */}
            {esOptometria && seccionPedidos}

            {/* ── DIAGNÓSTICOS / 6. DIAGNÓSTICO-DISCUSIÓN (neuropsi) ── */}
            {!esOptometria && seccionDiagnosticos}

            {/* ── 7. TRATAMIENTO (neuropsi) ── */}
            {esNeuropsi && (
              <Section titulo="7. Tratamiento" defaultCollapsed hidden={!modOn('tratamiento')}>
                {!consultaId ? (
                  <p className="text-sm text-gray-400">Inicie la atención para registrar el plan de tratamiento.</p>
                ) : (
                  <>
                    <PlanTratamientoForm consultaId={consultaId} editable={editable} />
                    {paciente?.id && (
                      <div className="mt-3">
                        <TratamientosPublicos pacienteId={paciente.id} miEspecialistaId={espId || undefined} />
                      </div>
                    )}
                  </>
                )}
              </Section>
            )}

            {/* ── OPTOMETRÍA: Historia Clínica Optometría ── */}
            {esOptometria && modOn('optometria') && (
              <>
                <Section titulo={optTitulo('optometria', 'Informe optométrico')} defaultCollapsed={esOptometria}>
                  <p className="text-xs text-gray-500 mb-3">
                    Flujo de atención: complete los datos y pulse <strong>Agregar Informe</strong>.
                  </p>
                  <OptometriaInformeForm consultaId={consultaId} editable={editable} onLoaded={setInformeOptometria} />
                </Section>

                {seccionDiagnosticos}

                <Section titulo={optTitulo('tratamiento', 'Tratamiento')} defaultCollapsed hidden={!modOn('tratamiento')}>
                  <FieldArea label="Tratamiento" value={optCierre.tratamiento} onChange={(v) => setOptCierre({ ...optCierre, tratamiento: v })} disabled={!editable} />
                  {editable && (
                    <button
                      onClick={() => saveOptCierre('tratamiento', 'Tratamiento')}
                      disabled={optSaving === 'tratamiento'}
                      className="mt-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Save size={14} className="inline mr-1" />{optSaving === 'tratamiento' ? 'Guardando...' : 'Guardar'}
                    </button>
                  )}
                </Section>

                <Section titulo={optTitulo('evaluar', 'Evaluar')} defaultCollapsed>
                  <FieldArea label="Evaluación (nota clínica interna)" value={optCierre.evaluacion} onChange={(v) => setOptCierre({ ...optCierre, evaluacion: v })} disabled={!editable} />
                  {editable && (
                    <button
                      onClick={() => saveOptCierre('evaluacion', 'Evaluación')}
                      disabled={optSaving === 'evaluacion'}
                      className="mt-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Save size={14} className="inline mr-1" />{optSaving === 'evaluacion' ? 'Guardando...' : 'Guardar'}
                    </button>
                  )}
                </Section>

                <Section titulo={optTitulo('observacion', 'Observación')} defaultCollapsed>
                  <FieldArea label="Observación" value={optCierre.observacion} onChange={(v) => setOptCierre({ ...optCierre, observacion: v })} disabled={!editable} />
                  {editable && (
                    <button
                      onClick={() => saveOptCierre('observacion', 'Observación')}
                      disabled={optSaving === 'observacion'}
                      className="mt-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Save size={14} className="inline mr-1" />{optSaving === 'observacion' ? 'Guardando...' : 'Guardar'}
                    </button>
                  )}
                </Section>
              </>
            )}

            {/* ── RECETA ── */}
            <Section titulo={optTitulo('prescripcion', 'Receta')} defaultCollapsed={esOptometria} hidden={!modOn('prescripcion')} keepMounted>
              {consultaId ? (
                <RecetaModal
                  isOpen
                  inline
                  consultaId={consultaId}
                  paciente={paciente}
                  diagnosticos={diagnosticos}
                  diagnosticoDiscusion={discusionDiagnostica?.diagnosticoClinico || ''}
                  signosVitales={signosData}
                  prescripciones={prescripciones}
                  citaAtendida={recetaBloqueada}
                  onClose={() => {}}
                />
              ) : (
                <p className="text-sm text-neutral-500">
                  Inicie la atención para habilitar el formulario de receta médica oficial.
                </p>
              )}
            </Section>

            {/* ── PEDIDOS ── */}
            {!esNeuropsi && !esOptometria && seccionPedidos}

            {/* ── EVOLUCIÓN ── */}
            <Section titulo={esNeuropsi ? '8. Evolución' : optTitulo('evolucion', 'Evolución')} defaultCollapsed={esNeuropsi || esOptometria} hidden={!modOn('evolucion')}>
              {editable && (
                <div className="space-y-2">
                  <FieldArea label="Evolución del paciente" value={evolForm.nota} onChange={v => setEvolForm({ nota: v })} />
                  <button onClick={addEvolucion} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg"><Plus size={14} className="inline mr-1" />Agregar Evolución</button>
                </div>
              )}
              {evoluciones.map((ev: any) => (
                <div key={ev.id} className="bg-gray-50 rounded-lg p-3 mt-2 text-sm space-y-1">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {ev.nota || [ev.subjetivo, ev.objetivo, ev.analisis, ev.plan].filter(Boolean).join('\n')}
                  </p>
                  <p className="text-[10px] text-gray-400">{new Date(ev.createdAt).toLocaleString('es-EC')}</p>
                </div>
              ))}
            </Section>

            {/* ── INDICACIONES ── */}
            {!esNeuropsi && (
            <Section titulo={optTitulo('indicaciones', 'Indicaciones')} defaultCollapsed={esOptometria} hidden={!modOn('indicaciones')}>
              {editable && (
                <div className="flex gap-2">
                  <select value={indForm.tipo} onChange={e => setIndForm({...indForm, tipo: e.target.value})} className="border rounded-lg px-3 py-2 text-sm">
                    {['REPOSO','DIETA','CONTROL','RETORNO','RECOMENDACION','FISIOTERAPIA','OTRO'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input value={indForm.descripcion} onChange={e => setIndForm({...indForm, descripcion: e.target.value})} placeholder="Descripción..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                  <button onClick={addIndicacion} className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg"><Plus size={14} /></button>
                </div>
              )}
              {indicaciones.map((ind: any) => (
                <div key={ind.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mt-1 text-sm">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{ind.tipo}</span>
                  <span className="flex-1 ml-2">{ind.descripcion}</span>
                  {editable && <button onClick={async () => { await apiClient(`/hce/indicacion/${ind.id}`, { method: 'DELETE' }); setIndicaciones(d => d.filter(x => x.id !== ind.id)); }}><Trash2 size={14} className="text-red-500" /></button>}
                </div>
              ))}
            </Section>
            )}

            {/* ── DOCUMENTOS ── */}
            {!esNeuropsi && (
            <Section titulo={optTitulo('documentos', 'Documentos Adjuntos')} defaultCollapsed={esOptometria}>
              <p className="text-xs text-gray-400">Subir documentos desde la HCE completa</p>
            </Section>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border rounded-2xl shadow-lg px-6 py-4 flex justify-between items-center z-10">
            <div className="flex flex-wrap items-center gap-2">
              {puedeGestionar && !finalizado && ['PENDIENTE', 'CONFIRMADA', 'REAGENDADA', 'EN_ESPERA'].includes(estado) && (
                <button
                  onClick={() => cambiarEstado('EN_ATENCION')}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Atender
                </button>
              )}
              <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cerrar</button>
              {consultaId && firmada && (
                <>
                  <button
                    onClick={() => hceApi.descargarConsultaPdf(consultaId).catch((e: any) => toast.error(e.message))}
                    className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
                  >
                    <FileDown size={14} /> Descargar HC
                  </button>
                  <button
                    onClick={() => setShowCertificado(true)}
                    className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
                  >
                    <FileText size={14} /> Certificado
                  </button>
                  <button
                    onClick={() => setShowDerivacion(true)}
                    className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
                  >
                    <Share2 size={14} /> Derivar
                  </button>
                  <button
                    onClick={() => setShowAlta(true)}
                    className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-1 hover:bg-red-50"
                  >
                    <UserMinus size={14} /> Alta
                  </button>
                  {esOptometria && informeOptometria && (
                    <button
                      onClick={() => hceApi.descargarDevolucionPdf(consultaId).catch((e: any) => toast.error(e.message))}
                      className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-primary-700"
                    >
                      <FileDown size={14} /> Devolución de resultados
                    </button>
                  )}
                </>
              )}
            </div>
            {!puedeGestionar ? (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle size={16} />
                Solo se pueden atender citas del día de hoy ({todayStr()})
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {esOptometria && estado === 'EN_ATENCION' && !firmada && (
                  <button
                    onClick={() => setShowObsDevolucion(true)}
                    className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50 ${
                      String(informeOptometria?.recomendaciones || '').trim() ? '' : 'border-amber-300 text-amber-700 bg-amber-50'
                    }`}
                  >
                    <MessageSquare size={14} /> Observaciones de devolución
                  </button>
                )}
                {estado === 'EN_ATENCION' && !firmada && (
                  <button
                    onClick={async () => {
                      if (!consultaId) {
                        toast.error('No hay consulta HCE');
                        return;
                      }
                      if (!consultaData.motivoConsulta?.trim()) {
                        toast.error('Complete el motivo de consulta antes de firmar');
                        return;
                      }
                      const errorConsulta = validarConsulta();
                      if (errorConsulta) {
                        toast.error(errorConsulta);
                        return;
                      }
                      if (esOptometria) {
                        const informe: any = await hceApi.getOptometria(consultaId).catch(() => null);
                        if (!String(informe?.recomendaciones || '').trim()) {
                          setShowObsDevolucion(true);
                          toast.error('Registre las observaciones / recomendaciones adicionales de la devolución antes de firmar');
                          return;
                        }
                      }
                      try {
                        await apiClient(`/hce/consulta/${consultaId}`, {
                          method: 'PATCH',
                          body: JSON.stringify(consultaData),
                        });
                      } catch (e: any) {
                        toast.error(e.message);
                        return;
                      }
                      setShowFirma(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Lock size={14} /> Firmar y finalizar
                  </button>
                )}
              </div>
            )}
          </div>
      <FirmaDigitalModal
        isOpen={showFirma}
        onClose={() => setShowFirma(false)}
        onFirmar={handleFirmar}
      />
      <ObservacionesDevolucionModal
        isOpen={showObsDevolucion}
        consultaId={consultaId}
        editable={editable}
        initialValue={informeOptometria?.recomendaciones || ''}
        onClose={() => setShowObsDevolucion(false)}
        onSaved={(value) =>
          setInformeOptometria((prev: any) => ({ ...(prev || {}), recomendaciones: value }))
        }
      />
      <CertificadoMedicoModal
        isOpen={showCertificado}
        consultaId={consultaId}
        onClose={() => setShowCertificado(false)}
      />
      <AltaPacienteModal
        isOpen={showAlta}
        pacienteId={paciente?.id || cita.pacienteId || null}
        especialidad={especialidad}
        onClose={() => setShowAlta(false)}
      />
      <DerivacionModal
        isOpen={showDerivacion}
        pacienteId={paciente?.id || cita.pacienteId || null}
        consultaId={consultaId}
        especialistaOrigenId={espId}
        onClose={() => setShowDerivacion(false)}
      />
    </div>
  );
}

function Section({ titulo, children, defaultCollapsed, hidden, keepMounted }: { titulo: string; children: React.ReactNode; defaultCollapsed?: boolean; hidden?: boolean; keepMounted?: boolean }) {  const [collapsed, setCollapsed] = useState(!!defaultCollapsed);
  if (hidden) return null;
  return (
    <div className="border rounded-xl p-4 bg-white">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between gap-2 text-left">
        <h3 className="text-sm font-semibold text-gray-700">{titulo}</h3>
        {collapsed ? <ChevronRight size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>
      {keepMounted ? (
        <div className={collapsed ? 'hidden' : 'mt-3'}>{children}</div>
      ) : (
        !collapsed && <div className="mt-3">{children}</div>
      )}
    </div>
  );
}

// ── Datos del paciente: mismo bloque para todas las especialidades ──
function DatosPacientePanel({
  paciente,
  antecedentes,
  alergias,
  habitos,
  mostrarAntecedentes,
  editable,
}: {
  paciente: any;
  antecedentes: any[];
  alergias: any[];
  habitos: any[];
  mostrarAntecedentes: boolean;
  editable: boolean;
}) {
  if (!paciente) return <p className="text-sm text-gray-400">Sin datos del paciente</p>;

  const formatFecha = (f?: string) => {
    if (!f) return '-';
    return new Date(f).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const calcEdad = (f?: string) => {
    if (!f) return null;
    const nac = new Date(f);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };
  const alergiasTxt = typeof paciente.alergias === 'string'
    ? paciente.alergias
    : Array.isArray(paciente.alergias) ? paciente.alergias.join(', ') : '';
  const alergiasActivas = alergias.filter((a: any) => a.activa !== false);
  const sinDatos = antecedentes.length === 0 && alergias.length === 0 && habitos.length === 0 && !alergiasTxt;

  return (
    <div className="space-y-3">
      {editable && sinDatos && (
        <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Complete los datos del paciente</p>
            <p className="text-xs text-amber-600 mt-0.5">Registre antecedentes, alergias y hábitos. Estos datos quedarán guardados para futuras consultas.</p>
          </div>
        </div>
      )}

      {!editable && sinDatos && (
        <div className="bg-gray-100 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">No se han registrado datos del paciente</p>
          <p className="text-xs text-gray-400 mt-0.5">Estos datos deben completarse durante la atención</p>
        </div>
      )}

      <div className="space-y-1 text-xs">
        <p className="text-gray-500">{paciente.numeroIdentificacion}</p>
        {paciente.telefono && <p className="text-gray-500">📞 {paciente.telefono}</p>}
        {paciente.fechaNacimiento && (
          <p className="text-gray-500">
            🎂 {formatFecha(paciente.fechaNacimiento)}
            {calcEdad(paciente.fechaNacimiento) != null && <span className="ml-1">({calcEdad(paciente.fechaNacimiento)} años)</span>}
          </p>
        )}
        {paciente.grupoSanguineo && <p className="text-gray-500">🩸 {paciente.grupoSanguineo}</p>}
        {paciente.tipoSeguro && <p className="text-gray-500">🏥 {paciente.tipoSeguro}</p>}
      </div>

      {/* Antecedentes: solo si el módulo editable no está visible (evita duplicar el listado) */}
      {mostrarAntecedentes && antecedentes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Antecedentes</p>
          <div className="flex flex-wrap gap-1">
            {antecedentes.filter((a: any) => !a.resuelto).map((a: any) => (
              <span key={a.id} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{a.categoria}: {a.descripcion}</span>
            ))}
            {antecedentes.filter((a: any) => a.resuelto).length > 0 && (
              <span className="text-xs text-gray-400">+{antecedentes.filter((a: any) => a.resuelto).length} resueltos</span>
            )}
          </div>
        </div>
      )}

      {/* Alergias */}
      {(alergiasActivas.length > 0 || alergiasTxt) && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Alergias</p>
          <div className="flex flex-wrap gap-1">
            {alergiasActivas.length > 0 ? (
              alergiasActivas.map((a: any, i: number) => (
                <span key={a.id || i} className={`text-xs px-2 py-0.5 rounded-full ${a.gravedad === 'GRAVE' ? 'bg-red-100 text-red-700 font-bold' : a.gravedad === 'MODERADA' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  ⚠ {a.descripcion} ({a.gravedad})
                </span>
              ))
            ) : (
              <span className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1">{alergiasTxt}</span>
            )}
          </div>
        </div>
      )}

      {/* Hábitos */}
      {habitos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Hábitos</p>
          <div className="flex flex-wrap gap-1">
            {habitos.map((h: any) => (
              <span key={h.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{h.tipo}: {h.afirmativo ? (h.cantidad || 'Sí') : 'No'}</span>
            ))}
          </div>
        </div>
      )}

      {paciente.citas && paciente.citas.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Historial ({paciente.citas.length} citas)</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {paciente.citas.slice(0, 20).map((c: any, i: number) => (
              <div key={i} className="text-[10px] bg-gray-50 rounded p-1.5 border space-y-0.5">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-gray-600">{c.fecha ? new Date(c.fecha).toLocaleDateString('es-EC') : '-'}</span>
                  {c.horaInicio && <span className="text-gray-400">{String(c.horaInicio).slice(0, 5)}</span>}
                  <span className="text-gray-300">·</span>
                  <span className="font-medium text-gray-700 truncate">{c.especialidad || '-'}</span>
                  {c.estado && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-500">{c.estado}</span>
                    </>
                  )}
                </div>
                {c.especialista && <div className="text-gray-400 truncate">{c.especialista.nombres?.split(' ')[0]} {c.especialista.apellidos?.split(' ')[0]}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AntecedentesPanel({
  pacienteId,
  antecedentes,
  editable,
  onChanged,
}: {
  pacienteId?: string;
  antecedentes: any[];
  editable?: boolean;
  onChanged: () => void;
}) {
  const [form, setForm] = useState({
    ambito: 'PERSONAL' as 'PERSONAL' | 'FAMILIAR',
    categoria: 'ENFERMEDAD',
    descripcion: '',
    parentesco: '',
    observacion: '',
  });
  const [saving, setSaving] = useState(false);

  const categorias = form.ambito === 'FAMILIAR'
    ? ['ENFERMEDAD', 'CARDIACA', 'DIABETES', 'HIPERTENSION', 'CANCER', 'MENTAL', 'OTRO']
    : ['ENFERMEDAD', 'QUIRURGICO', 'TRAUMATICO', 'ALERGIA', 'MEDICAMENTO', 'HABITO', 'OTRO'];

  // Los registros antiguos solo guardaban `tipo` (FAMILIAR/PERSONAL); `ambito` quedó
  // con el valor por defecto. Se usa `tipo` como respaldo para clasificarlos bien.
  const esFamiliar = (a: any) => a?.ambito === 'FAMILIAR' || a?.tipo === 'FAMILIAR';
  const personales = antecedentes.filter((a) => !esFamiliar(a));
  const familiares = antecedentes.filter((a) => esFamiliar(a));

  const agregar = async () => {
    if (!pacienteId || !form.descripcion.trim()) {
      toast.error('Escriba la descripción del antecedente');
      return;
    }
    setSaving(true);
    try {
      await hceApi.addAntecedente(pacienteId, {
        ambito: form.ambito,
        categoria: form.categoria,
        descripcion: form.descripcion.trim(),
        parentesco: form.ambito === 'FAMILIAR' ? form.parentesco.trim() || undefined : undefined,
        observacion: form.observacion.trim() || undefined,
      });
      toast.success('Antecedente agregado al historial clínico');
      setForm({ ...form, descripcion: '', parentesco: '', observacion: '' });
      onChanged();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo agregar el antecedente');
    } finally {
      setSaving(false);
    }
  };

  const lista = (items: any[], titulo: string, color: string) => (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1">{titulo}</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">Sin antecedentes {titulo.toLowerCase()}</p>
      ) : (
        <div className="space-y-1">
          {items.map((a) => (
            <div key={a.id} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2 text-sm">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${color}`}>{a.categoria || a.tipo}</span>
              <span className="flex-1">
                {a.descripcion}
                {a.parentesco && <span className="text-xs text-gray-500"> — {a.parentesco}</span>}
                {a.observacion && <span className="block text-[11px] text-gray-400">{a.observacion}</span>}
              </span>
              {a.fecha && <span className="text-[10px] text-gray-400">{new Date(a.fecha).toLocaleDateString('es-EC')}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {lista(personales, 'Personales', 'bg-orange-50 text-orange-700')}
      {lista(familiares, 'Familiares', 'bg-purple-50 text-purple-700')}

      {editable && (
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600">Agregar antecedente</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={form.ambito}
              onChange={(e) => {
                const ambito = e.target.value as 'PERSONAL' | 'FAMILIAR';
                setForm({ ...form, ambito, categoria: 'ENFERMEDAD' });
              }}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="PERSONAL">Personal</option>
              <option value="FAMILIAR">Familiar</option>
            </select>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {form.ambito === 'FAMILIAR' ? (
              <input
                value={form.parentesco}
                onChange={(e) => setForm({ ...form, parentesco: e.target.value })}
                placeholder="Parentesco (madre, padre...)"
                className="border rounded-lg px-3 py-2 text-sm"
              />
            ) : (
              <input
                value={form.observacion}
                onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                placeholder="Observación (opcional)"
                className="border rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción del antecedente"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={agregar}
              disabled={saving}
              className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
              <Plus size={14} /> {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
          {form.ambito === 'FAMILIAR' && (
            <input
              value={form.observacion}
              onChange={(e) => setForm({ ...form, observacion: e.target.value })}
              placeholder="Observación (opcional)"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
}

function ConsultaSelects({ data, setData, disabled }: { data: any; setData: (d: any) => void; disabled?: boolean }) {
  const cls = 'w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500';
  const esTelefonica = data.tipoConsulta === 'Llamada telefónica';
  const esVirtual = data.formaConsulta === 'Virtual';
  const requierePresencial = ['Emergencia', 'Hospitalizacion', 'Domiciliaria'].includes(data.tipoAtencion);
  const tipoAtencionSoloExterna = esTelefonica || esVirtual;

  useEffect(() => {
    if (disabled) return;
    if (esTelefonica && (data.formaConsulta !== 'Virtual' || data.tipoAtencion !== 'Consulta externa')) {
      setData({ ...data, formaConsulta: 'Virtual', tipoAtencion: 'Consulta externa' });
      return;
    }
    if (esVirtual && data.tipoAtencion !== 'Consulta externa') {
      setData({ ...data, tipoAtencion: 'Consulta externa' });
      return;
    }
    if (requierePresencial && data.formaConsulta !== 'Presencial') {
      setData({ ...data, formaConsulta: 'Presencial' });
    }
  }, [data.tipoConsulta, data.formaConsulta, data.tipoAtencion, esTelefonica, esVirtual, requierePresencial, data, setData, disabled]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Tipo de consulta *</label>
        <select
          value={data.tipoConsulta}
          onChange={e => {
            const tipoConsulta = e.target.value;
            setData({
              ...data,
              tipoConsulta,
              ...(tipoConsulta === 'Llamada telefónica'
                ? { formaConsulta: 'Virtual', tipoAtencion: 'Consulta externa' }
                : {}),
            });
          }}
          disabled={disabled}
          className={cls}
        >
          <option value="">—</option>
          <option value="Llamada telefónica">Llamada telefónica</option>
          <option value="Evaluación">Evaluación</option>
          <option value="Tratamiento">Tratamiento</option>
          <option value="Control">Control</option>
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Condición *</label>
        <select value={data.condicionConsulta} onChange={e => setData({ ...data, condicionConsulta: e.target.value })} disabled={disabled} className={cls}>
          <option value="">—</option>
          <option value="Primera vez">Primera vez</option>
          <option value="Subsecuente">Subsecuente</option>
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Forma *</label>
        <select
          value={data.formaConsulta}
          onChange={e => {
            const formaConsulta = e.target.value;
            if (esTelefonica && formaConsulta === 'Presencial') return;
            setData({
              ...data,
              formaConsulta,
              ...(formaConsulta === 'Virtual' ? { tipoAtencion: 'Consulta externa' } : {}),
            });
          }}
          disabled={disabled}
          className={cls}
        >
          <option value="">—</option>
          <option value="Presencial" disabled={esTelefonica}>Presencial</option>
          <option value="Virtual" disabled={requierePresencial && !esTelefonica}>Virtual</option>
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Tipo atención *</label>
        <select
          value={data.tipoAtencion}
          onChange={e => {
            const tipoAtencion = e.target.value;
            if (tipoAtencionSoloExterna && tipoAtencion !== 'Consulta externa') return;
            const requierePresencialSeleccion = ['Emergencia', 'Hospitalizacion', 'Domiciliaria'].includes(tipoAtencion);
            setData({
              ...data,
              tipoAtencion,
              ...(requierePresencialSeleccion ? { formaConsulta: 'Presencial' } : {}),
            });
          }}
          disabled={disabled}
          className={cls}
        >
          <option value="">—</option>
          <option value="Consulta externa">Consulta externa</option>
          <option value="Emergencia" disabled={tipoAtencionSoloExterna}>Emergencia</option>
          <option value="Hospitalizacion" disabled={tipoAtencionSoloExterna}>Hospitalización</option>
          <option value="Domiciliaria" disabled={tipoAtencionSoloExterna}>Domiciliaria</option>
        </select>
      </div>
      {esTelefonica && (
        <p className="sm:col-span-2 lg:col-span-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          Llamada telefónica: se registra como <b>Virtual</b> y con tipo de atención <b>Consulta externa</b>.
        </p>
      )}
    </div>
  );
}

function Field({ label, value, onChange, disabled, placeholder }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string }) {  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500" />
    </div>
  );
}

function FieldArea({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-0.5">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} disabled={disabled} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500" />
    </div>
  );
}
