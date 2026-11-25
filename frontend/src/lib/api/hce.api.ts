import { apiClient, getAccessToken, refreshSession } from './client';
import type { Paciente, Consulta, FormConfig, Template } from '@/types/api';
import type {
  OcupacionEscolaridad, ActividadFuncional, ResponsableCuidado,
  OcupacionEscolaridadNino, ActividadFuncionalNino,
} from '@/types/historia-clinica';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Descarga de PDFs autenticados (fetch → blob → object URL)
async function descargarPdfAutenticado(path: string, filename: string) {
  const request = () => {
    const token = getAccessToken();
    return fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
  };

  let res = await request();
  if (res.status === 401 && await refreshSession()) {
    res = await request();
  }
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'No se pudo descargar el PDF');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface ModuloEspecialidad {
  especialidad: string;
  modulos: string[];
}

interface ExamenMental {
  id: string;
  consultaId: string;
  datos: Record<string, unknown>;
}

interface HistoriaFamiliar {
  id: string;
  consultaId: string;
  datos: Record<string, unknown>;
}

export interface PacienteConConteo {
  id: string;
  paciente: Paciente;
  totalConsultas: number;
}

export interface CIE10Result {
  codigo: string;
  descripcion: string;
}

export interface AntecedenteHCE {
  id: string;
  pacienteId: string;
  ambito: 'PERSONAL' | 'FAMILIAR';
  categoria: string;
  descripcion: string;
  parentesco?: string | null;
  observacion?: string | null;
  fecha?: string | null;
  activo: boolean;
  createdAt: string;
}

export interface HistorialDiagnostico {
  id: string;
  codigo: string;
  sistema: 'CIE10' | 'DSM5';
  estado: 'PRESUNTIVO' | 'DEFINITIVO';
  descripcion: string | null;
  tipo?: string | null;
  fecha: string;
  consultaId: string;
  especialidad: string | null;
  especialista: string | null;
  esMio: boolean;
}

export interface RecetaMedica {
  id: string;
  numeroReceta: number;
  fecha: string;
  indicaciones?: string | null;
  estadoEnfermedad?: string | null;
  diagnostico?: string | null;
  signosAlarma?: string | null;
  recomendacionesNoFarmacologicas?: string | null;
  peso?: string | null;
  talla?: string | null;
  alergias?: string | null;
  validezDias?: number | null;
  firmada: boolean;
  archivoPdfUrl?: string | null;
  hashDocumento?: string | null;
  paciente?: {
    id: string;
    nombres: string;
    apellidos: string;
    numeroIdentificacion?: string | null;
    numeroHistoriaClinica?: string | null;
  } | null;
  items: Array<{
    id?: string;
    medicamento: string;
    presentacion?: string | null;
    formaFarmaceutica?: string | null;
    concentracion?: string | null;
    dosis?: string | null;
    via?: string | null;
    frecuencia?: string | null;
    duracion?: string | null;
    cantidad?: string | null;
    cantidadLetras?: string | null;
    indicaciones?: string | null;
  }>;
  especialista?: { nombres: string; apellidos: string; especialidad: string } | null;
}

export interface RecetasPagina {
  data: RecetaMedica[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CertificadoMedico {
  id: string;
  tipo: 'ASISTENCIA' | 'REPOSO';
  motivo?: string | null;
  observaciones?: string | null;
  diasReposo?: number | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  archivoPdfUrl?: string | null;
  createdAt: string;
  especialista?: { nombres: string; apellidos: string; especialidad: string } | null;
}

export interface ConsentimientoHCE {
  id: string;
  pacienteId: string;
  consultaId?: string | null;
  tipo: string;
  titulo: string;
  archivoUrl?: string | null;
  firmado: boolean;
  fechaFirma?: string | null;
  createdAt: string;
}

export interface DerivacionHCE {
  id: string;
  pacienteId: string;
  consultaId?: string | null;
  especialistaOrigenId: string;
  motivo: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  estado: string;
  observacion?: string | null;
  createdAt: string;
  paciente?: { id: string; nombres: string; apellidos: string; numeroIdentificacion: string; telefono?: string } | null;
  especialistaOrigen?: { id: string; nombres: string; apellidos: string; especialidad: string } | null;
  destinos: Array<{
    id: string;
    especialistaId: string;
    especialidad: string;
    estado: string;
    citaId?: string | null;
    especialista?: { id: string; nombres: string; apellidos: string; especialidad: string; sede?: string; consultorioPredeterminado?: string | null } | null;
    cita?: { id: string; fecha: string; horaInicio: string; estado: string } | null;
  }>;
}

export interface HistorialClinico {
  paciente: any;
  antecedentes: { personales: AntecedenteHCE[]; familiares: AntecedenteHCE[] };
  diagnosticos: HistorialDiagnostico[];
  recetas: RecetaMedica[];
  certificados: CertificadoMedico[];
  altas: any[];
  derivaciones: DerivacionHCE[];
  evoluciones: any[];
}

export const hceApi = {
  getPacientes: (especialistaId: string) =>
    apiClient<PacienteConConteo[]>(`/hce/admin/especialista/${especialistaId}/pacientes`),
  getConsulta: (id: string) =>
    apiClient<Consulta>(`/hce/admin/consulta/${id}`),
  getHistorialPaciente: (pacienteId: string, especialistaId?: string) =>
    apiClient<Consulta[]>(`/hce/paciente/${pacienteId}/historial${especialistaId ? `?especialistaId=${especialistaId}` : ''}`),
  getConsultasPorModulo: (especialistaId: string, modulo: string) =>
    apiClient<Consulta[]>(`/hce/especialista/${especialistaId}/modulo/${modulo}`),
  getModulos: (especialistaId: string) =>
    apiClient<string[]>(`/hce/admin/especialista/${especialistaId}/modulos`),
  getEspecialidadesModulos: () =>
    apiClient<ModuloEspecialidad[]>(`/hce/admin/especialidades/modulos`),
  updateModulosEspecialidad: (especialidad: string, modulos: { modulo: string; habilitado: boolean; label?: string }[]) =>
    apiClient<ModuloEspecialidad>(`/hce/admin/especialidad/${especialidad}/modulos`, {
      method: 'PATCH',
      body: JSON.stringify({ modulos }),
    }),
  inicializarModulosEspecialidad: (especialidad: string) =>
    apiClient<ModuloEspecialidad>(`/hce/admin/especialidad/${especialidad}/inicializar-modulos`, {
      method: 'POST',
    }),

  getFormsConfig: (especialidad: string, especialistaId?: string) => {
    const query = especialistaId ? `?especialistaId=${especialistaId}` : '';
    return apiClient<FormConfig>(`/hce/config/${especialidad}${query}`);
  },
  getDefaultConfig: () => apiClient<FormConfig>('/hce/config/default'),
  saveFormConfig: (data: Partial<FormConfig>) =>
    apiClient<FormConfig>('/hce/config', { method: 'POST', body: JSON.stringify(data) }),
  getSpecialtyConfigs: (especialidad: string) =>
    apiClient<FormConfig[]>(`/hce/config/especialidad/${especialidad}`),
  getSpecialistConfigs: (especialistaId: string) =>
    apiClient<FormConfig[]>(`/hce/config/especialista/${especialistaId}`),
  removeFormConfig: (id: string) =>
    apiClient<void>(`/hce/config/${id}`, { method: 'DELETE' }),

  getTemplates: (especialidad: string, formName: string, fieldName: string) =>
    apiClient<Template[]>(`/hce/templates/${especialidad}/${formName}/${fieldName}`),
  createTemplate: (data: Partial<Template>) =>
    apiClient<Template>('/hce/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id: string, data: Partial<Template>) =>
    apiClient<Template>(`/hce/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTemplate: (id: string) =>
    apiClient<void>(`/hce/templates/${id}`, { method: 'DELETE' }),

  getExamenMental: (consultaId: string) =>
    apiClient<ExamenMental>(`/hce/consulta/${consultaId}/examen-mental`),
  saveExamenMental: (consultaId: string, data: Partial<ExamenMental>) =>
    apiClient<ExamenMental>(`/hce/consulta/${consultaId}/examen-mental`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  getHistoriaFamiliar: (consultaId: string) =>
    apiClient<HistoriaFamiliar>(`/hce/consulta/${consultaId}/historia-familiar`),
  saveHistoriaFamiliar: (consultaId: string, data: Partial<HistoriaFamiliar>) =>
    apiClient<HistoriaFamiliar>(`/hce/consulta/${consultaId}/historia-familiar`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  // ── Neuropsicología ──
  getEvalNeuroconductual: (consultaId: string) =>
    apiClient<Record<string, unknown>>(`/hce/consulta/${consultaId}/eval-neuroconductual`),
  saveEvalNeuroconductual: (consultaId: string, data: Record<string, unknown>) =>
    apiClient<Record<string, unknown>>(`/hce/consulta/${consultaId}/eval-neuroconductual`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  getEvalNeuropsicometrica: (consultaId: string) =>
    apiClient<Record<string, unknown>>(`/hce/consulta/${consultaId}/eval-neuropsicometrica`),
  saveEvalNeuropsicometrica: (consultaId: string, data: Record<string, unknown>) =>
    apiClient<Record<string, unknown>>(`/hce/consulta/${consultaId}/eval-neuropsicometrica`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  // ── Optometría ──
  getOptometria: (consultaId: string) =>
    apiClient<Record<string, unknown> | null>(`/hce/consulta/${consultaId}/optometria`),
  saveOptometria: (consultaId: string, data: Record<string, unknown>) =>
    apiClient<Record<string, unknown>>(`/hce/consulta/${consultaId}/optometria`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  getDiscusionDiagnostica: (consultaId: string) =>
    apiClient<{ diagnosticoClinico?: string; discusionGeneral?: string }>(`/hce/consulta/${consultaId}/discusion-diagnostica`),
  saveDiscusionDiagnostica: (consultaId: string, data: { diagnosticoClinico?: string; discusionGeneral?: string }) =>
    apiClient<unknown>(`/hce/consulta/${consultaId}/discusion-diagnostica`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  getPlanTratamiento: (consultaId: string) =>
    apiClient<any>(`/hce/consulta/${consultaId}/plan-tratamiento`),
  createPlanTratamiento: (consultaId: string, data: { numeroCitas: number; objetivos: any[] }) =>
    apiClient<any>(`/hce/consulta/${consultaId}/plan-tratamiento`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  updatePlanTratamiento: (planId: string, data: { numeroCitas?: number; objetivos?: any[] }) =>
    apiClient<any>(`/hce/plan-tratamiento/${planId}`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  extenderPlanTratamiento: (planId: string, data: { citasExtension: number; motivo: string }) =>
    apiClient<any>(`/hce/plan-tratamiento/${planId}/extension`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  finalizarPlanTratamiento: (planId: string, data: { resultados: { numero: number; resultadoFinal: number }[] }) =>
    apiClient<any>(`/hce/plan-tratamiento/${planId}/finalizar`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  // ── Tratamientos públicos (todas las especialidades del paciente) ──
  getTratamientosPaciente: (pacienteId: string) =>
    apiClient<any[]>(`/hce/paciente/${pacienteId}/tratamientos`),

  searchCIE10: (query: string) =>
    apiClient<CIE10Result[]>(`/hce/cie10/search?q=${encodeURIComponent(query)}`),
  searchDiagnosticos: (query: string, sistema: 'CIE10' | 'DSM5' = 'CIE10') =>
    apiClient<CIE10Result[]>(`/hce/diagnosticos/search?q=${encodeURIComponent(query)}&sistema=${sistema}`),

  createConsulta: (data: any) =>
    apiClient<any>('/hce/consulta', { method: 'POST', body: JSON.stringify(data) }),
  updateConsulta: (id: string, data: any) =>
    apiClient<any>(`/hce/consulta/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addDiagnostico: (consultaId: string, data: {
    codigoCIE10?: string;
    codigo?: string;
    descripcion: string;
    tipo?: string;
    esPrincipal?: boolean;
    sistema?: 'CIE10' | 'DSM5';
    estado?: 'PRESUNTIVO' | 'DEFINITIVO';
    observacion?: string;
  }) =>
    apiClient<any>(`/hce/consulta/${consultaId}/diagnostico`, { method: 'POST', body: JSON.stringify(data) }),
  confirmarDiagnostico: (id: string) =>
    apiClient<any>(`/hce/diagnostico/${id}/confirmar`, { method: 'PATCH' }),
  removeDiagnostico: (id: string) =>
    apiClient<void>(`/hce/diagnostico/${id}`, { method: 'DELETE' }),
  getHistorialDiagnosticos: (pacienteId: string) =>
    apiClient<HistorialDiagnostico[]>(`/hce/paciente/${pacienteId}/diagnosticos`),
  getHistorialClinico: (pacienteId: string) =>
    apiClient<HistorialClinico>(`/hce/paciente/${pacienteId}/historial-clinico`),

  // ── Antecedentes personales / familiares ──
  getAntecedentes: (pacienteId: string, ambito?: 'PERSONAL' | 'FAMILIAR') =>
    apiClient<AntecedenteHCE[]>(`/hce/paciente/${pacienteId}/antecedentes${ambito ? `?ambito=${ambito}` : ''}`),
  addAntecedente: (pacienteId: string, data: {
    ambito: 'PERSONAL' | 'FAMILIAR';
    categoria: string;
    descripcion: string;
    parentesco?: string;
    observacion?: string;
    fecha?: string;
  }) =>
    apiClient<AntecedenteHCE>(`/hce/paciente/${pacienteId}/antecedentes`, { method: 'POST', body: JSON.stringify(data) }),

  // ── Módulos funcionales por paciente ──
  getOcupacionEscolaridad: (pacienteId: string) =>
    apiClient<OcupacionEscolaridad | null>(`/hce/paciente/${pacienteId}/ocupacion-escolaridad`),
  saveOcupacionEscolaridad: (pacienteId: string, data: {
    ocupacionTexto?: string;
    ocupacionEtiquetas?: string[];
    nivelAcademico?: string;
    escolaridadTexto?: string;
    escolaridadEtiquetas?: string[];
    responsables?: Array<Pick<ResponsableCuidado, 'nombre' | 'contacto' | 'parentesco'>>;
    motivo?: string;
  }) =>
    apiClient<OcupacionEscolaridad>(`/hce/paciente/${pacienteId}/ocupacion-escolaridad`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getActividadFuncional: (pacienteId: string) =>
    apiClient<ActividadFuncional | null>(`/hce/paciente/${pacienteId}/actividad-funcional`),
  saveActividadFuncional: (pacienteId: string, data: {
    actividadSignificativa?: string;
    medidaIndependencia?: number;
    cambiosDesempeno?: string;
    actividadesVidaDiaria?: string[];
    actividadesInstrumentales?: string[];
    motricidadFina?: string;
    motivo?: string;
  }) =>
    apiClient<ActividadFuncional>(`/hce/paciente/${pacienteId}/actividad-funcional`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Versión pediátrica: API independiente ──
  getOcupacionEscolaridadNino: (pacienteId: string) =>
    apiClient<OcupacionEscolaridadNino | null>(`/hce/paciente/${pacienteId}/ocupacion-escolaridad-nino`),
  saveOcupacionEscolaridadNino: (pacienteId: string, data: {
    ocupacionTexto?: string;
    ocupacionEtiquetas?: string[];
    nivelAcademico?: string;
    escolaridadTexto?: string;
    escolaridadEtiquetas?: string[];
    responsables?: Array<Pick<ResponsableCuidado, 'nombre' | 'contacto' | 'parentesco'>>;
    motivo?: string;
  }) =>
    apiClient<OcupacionEscolaridadNino>(`/hce/paciente/${pacienteId}/ocupacion-escolaridad-nino`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getActividadFuncionalNino: (pacienteId: string) =>
    apiClient<ActividadFuncionalNino | null>(`/hce/paciente/${pacienteId}/actividad-funcional-nino`),
  saveActividadFuncionalNino: (pacienteId: string, data: {
    actividadSignificativa?: string;
    medidaIndependencia?: number;
    cambiosDesempeno?: string;
    actividadesVidaDiaria?: string[];
    actividadesInstrumentales?: string[];
    motricidadFina?: string;
    motivo?: string;
  }) =>
    apiClient<ActividadFuncionalNino>(`/hce/paciente/${pacienteId}/actividad-funcional-nino`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Recetas ──
  generarReceta: (consultaId: string, data: {
    password: string;
    indicaciones?: string;
    estadoEnfermedad?: string;
    diagnostico?: string;
    signosAlarma?: string;
    recomendacionesNoFarmacologicas?: string;
    peso?: string;
    talla?: string;
    alergias?: string;
    validezDias?: number;
    items: any[];
  }) =>
    apiClient<RecetaMedica>(`/hce/consulta/${consultaId}/receta`, { method: 'POST', body: JSON.stringify(data) }),
  getRecetasConsulta: (consultaId: string) =>
    apiClient<RecetaMedica[]>(`/hce/consulta/${consultaId}/recetas`),
  getRecetasPaciente: (pacienteId: string) =>
    apiClient<RecetaMedica[]>(`/hce/paciente/${pacienteId}/recetas`),
  getRecetas: (params: { pacienteId?: string; q?: string; desde?: string; hasta?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
    });
    const query = qs.toString();
    return apiClient<RecetasPagina>(`/hce/recetas${query ? `?${query}` : ''}`);
  },
  getReceta: (id: string) =>
    apiClient<RecetaMedica>(`/hce/receta/${id}`),
  descargarRecetaPdf: (id: string) =>
    descargarPdfAutenticado(`/hce/receta/${id}/pdf`, `receta-${id}.pdf`),

  // ── Certificados de asistencia / reposo ──
  generarCertificadoMedico: (consultaId: string, data: {
    tipo: 'ASISTENCIA' | 'REPOSO';
    password: string;
    motivo?: string;
    observaciones?: string;
    diasReposo?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }) =>
    apiClient<CertificadoMedico>(`/hce/consulta/${consultaId}/certificado`, { method: 'POST', body: JSON.stringify(data) }),
  getCertificadosPaciente: (pacienteId: string) =>
    apiClient<CertificadoMedico[]>(`/hce/paciente/${pacienteId}/certificados`),
  descargarCertificadoMedicoPdf: (id: string) =>
    descargarPdfAutenticado(`/hce/certificado-medico/${id}/pdf`, `certificado-${id}.pdf`),

  // ── Alta por especialidad ──
  darAlta: (pacienteId: string, data: { motivo: string; observacion?: string; especialidad?: string }) =>
    apiClient<any>(`/hce/paciente/${pacienteId}/alta`, { method: 'POST', body: JSON.stringify(data) }),
  getAltasPaciente: (pacienteId: string) =>
    apiClient<any[]>(`/hce/paciente/${pacienteId}/altas`),

  // ── Derivaciones ──
  getEspecialistasDerivacion: () =>
    apiClient<Array<{
      id: string;
      nombres: string;
      apellidos: string;
      especialidad: string;
      sede?: string | null;
      consultorioPredeterminado?: string | null;
    }>>('/hce/especialistas-destino'),
  crearDerivacion: (data: {
    pacienteId: string;
    consultaId?: string;
    motivo: string;
    prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
    observacion?: string;
    especialistaIds: string[];
  }) =>
    apiClient<DerivacionHCE>('/hce/derivaciones', { method: 'POST', body: JSON.stringify(data) }),
  getDerivaciones: (filtros?: { estado?: string; prioridad?: string; especialistaId?: string; pacienteId?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.estado) params.set('estado', filtros.estado);
    if (filtros?.prioridad) params.set('prioridad', filtros.prioridad);
    if (filtros?.especialistaId) params.set('especialistaId', filtros.especialistaId);
    if (filtros?.pacienteId) params.set('pacienteId', filtros.pacienteId);
    const qs = params.toString();
    return apiClient<DerivacionHCE[]>(`/hce/derivaciones${qs ? `?${qs}` : ''}`);
  },
  getDerivacionesPaciente: (pacienteId: string) =>
    apiClient<DerivacionHCE[]>(`/hce/paciente/${pacienteId}/derivaciones`),
  programarDerivacion: (destinoId: string, citaId: string) =>
    apiClient<any>(`/hce/derivacion-destino/${destinoId}/programar`, { method: 'PATCH', body: JSON.stringify({ citaId }) }),

  // ── Privacidad de diagnósticos ──
  getPrivacidadDiagnosticos: () =>
    apiClient<Array<{ especialidad: string; compartirDiagnosticos: boolean }>>('/hce/admin/privacidad-diagnosticos'),
  updatePrivacidadDiagnosticos: (especialidad: string, compartirDiagnosticos: boolean) =>
    apiClient<any>(`/hce/admin/privacidad-diagnosticos/${encodeURIComponent(especialidad)}`, {
      method: 'PATCH', body: JSON.stringify({ compartirDiagnosticos }),
    }),
  addPrescripcion: (consultaId: string, data: any) =>
    apiClient<any>(`/hce/consulta/${consultaId}/prescripcion`, { method: 'POST', body: JSON.stringify(data) }),
  removePrescripcion: (id: string) =>
    apiClient<void>(`/hce/prescripcion/${id}`, { method: 'DELETE' }),
  addEvolucion: (
    consultaId: string,
    data: { nota: string },
  ) =>
    apiClient<any>(`/hce/consulta/${consultaId}/evolucion`, { method: 'POST', body: JSON.stringify(data) }),
  addSignoVital: (pacienteId: string, data: any) =>
    apiClient<any>(`/hce/paciente/${pacienteId}/signo-vital`, { method: 'POST', body: JSON.stringify(data) }),

  // ── Consentimientos ──
  getConsentimientos: (consultaId: string) =>
    apiClient<ConsentimientoHCE[]>(`/hce/consulta/${consultaId}/consentimientos`),
  addConsentimiento: (
    consultaId: string,
    data: { tipo: string; titulo: string; firmado?: boolean },
  ) =>
    apiClient<ConsentimientoHCE>(`/hce/consulta/${consultaId}/consentimientos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeConsentimiento: (id: string) =>
    apiClient<void>(`/hce/consentimiento/${id}`, { method: 'DELETE' }),

  uploadExamen: (consultaId: string, pacienteId: string, formData: FormData) =>
    apiClient<void>(`/hce/consulta/${consultaId}/examen`, {
      method: 'POST',
      body: formData,
    }),

  getByCitaId: (citaId: string) =>
    apiClient<unknown>(`/hce/consulta/by-cita/${citaId}`),
  addIndicacion: (consultaId: string, data: { tipo: string; descripcion: string }) =>
    apiClient<unknown>(`/hce/consulta/${consultaId}/indicacion`, { method: 'POST', body: JSON.stringify(data) }),
  removePedido: (id: string) =>
    apiClient<void>(`/hce/pedido/${id}`, { method: 'DELETE' }),
  removeIndicacion: (id: string) =>
    apiClient<void>(`/hce/indicacion/${id}`, { method: 'DELETE' }),

  addDocumento: (consultaId: string, data: { tipo: string; nombre: string; resultado?: string; archivoUrl?: string }) =>
    apiClient<unknown>(`/hce/consulta/${consultaId}/examen`, { method: 'POST', body: JSON.stringify(data) }),

  // ── Firma Digital ──
  firmarConsulta: (consultaId: string, password: string) =>
    apiClient<unknown>(`/hce/consulta/${consultaId}/firmar`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  getConsultaPdfUrl: (consultaId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/hce/consulta/${consultaId}/pdf`,

  // ── Certificado Médico de Asistencia ──
  generarCertificado: (consultaId: string, data: { password: string; observaciones?: string }) =>
    apiClient<{ ok: boolean; pdfUrl: string }>(`/hce/consulta/${consultaId}/certificado-asistencia`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCertificadoPdfUrl: (consultaId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/hce/consulta/${consultaId}/certificado-asistencia/pdf`,

  // ── Descargas PDF (con Authorization) ──
  descargarConsultaPdf: (consultaId: string) =>
    descargarPdfAutenticado(`/hce/consulta/${consultaId}/pdf`, `consulta-${consultaId}.pdf`),
  descargarDevolucionPdf: (consultaId: string) =>
    descargarPdfAutenticado(`/hce/consulta/${consultaId}/devolucion/pdf`, `devolucion-${consultaId}.pdf`),

  // ── Alergias ──
  getAlergias: (pacienteId: string) =>
    apiClient<unknown[]>(`/hce/paciente/${pacienteId}/alergias`),
  addAlergia: (pacienteId: string, data: { tipo: string; descripcion: string; gravedad?: string }) =>
    apiClient<unknown>(`/hce/paciente/${pacienteId}/alergias`, { method: 'POST', body: JSON.stringify(data) }),
  removeAlergia: (id: string) =>
    apiClient<void>(`/hce/alergia/${id}`, { method: 'DELETE' }),

  // ── Hábitos ──
  getHabitos: (pacienteId: string) =>
    apiClient<unknown[]>(`/hce/paciente/${pacienteId}/habitos`),
  addHabito: (pacienteId: string, data: { tipo: string; afirmativo?: boolean; cantidad?: string; desde?: string; observacion?: string }) =>
    apiClient<unknown>(`/hce/paciente/${pacienteId}/habitos`, { method: 'POST', body: JSON.stringify(data) }),
  removeHabito: (id: string) =>
    apiClient<void>(`/hce/habito/${id}`, { method: 'DELETE' }),

  // ── Problemas Activos ──
  getProblemasActivos: (pacienteId: string) =>
    apiClient<unknown[]>(`/hce/paciente/${pacienteId}/problemas-activos`),
  addProblemaActivo: (pacienteId: string, data: { descripcion: string }) =>
    apiClient<unknown>(`/hce/paciente/${pacienteId}/problemas-activos`, { method: 'POST', body: JSON.stringify(data) }),
  resolverProblemaActivo: (id: string) =>
    apiClient<void>(`/hce/problema-activo/${id}/resolver`, { method: 'PATCH' }),
};
