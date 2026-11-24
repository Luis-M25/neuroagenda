'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { citasApi, especialistasApi, pacientesApi } from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import { cn, getEstadoCitaColor, formatDate, ESTADOS_CITA } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { requirePermission } from '@/lib/use-permission';
import { ROUTES } from '@/lib/routes';
import { validateCedulaEcuador } from '@/lib/validators';
import { toast } from 'sonner';
import Link from 'next/link';
import { UbicacionSelector } from '@/components/shared/UbicacionSelector';
import {
  Plus, X,
  User, RotateCcw, Eye, XCircle, ArrowRight,
} from 'lucide-react';
import { usePacienteSearch } from '../hooks/usePacienteSearch';
import { usePacienteQuick } from '../hooks/usePacienteQuick';
import { useCitaModify } from '../hooks/useCitaModify';
import { useCitaDetail } from '../hooks/useCitaDetail';
import { useCitaCancel } from '../hooks/useCitaCancel';

import AppointmentFilters from './components/AppointmentFilters';
import AppointmentTable from './components/AppointmentTable/AppointmentTable';
import { WizardModal } from './components/WizardModal';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useAppointmentHce } from './hooks/useAppointmentHce';
import { useAppointmentWizard } from './hooks/useAppointmentWizard';

function CheckCircle({ className, size }: { className?: string; size?: number }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
}

function maxDateStr(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CitasPage() {
  const searchParams = useSearchParams();
  const [citas, setCitas] = useState<any[]>([]);
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  const calcEdadCita = (fechaNac?: string) => {
    if (!fechaNac) return '-';
    const nac = new Date(fechaNac);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return `${edad} años`;
  };

  const [filtroFechaInicio, setFiltroFechaInicio] = useState(searchParams.get('fechaInicio') || '');
  const [filtroFechaFin, setFiltroFechaFin] = useState(searchParams.get('fechaFin') || '');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState(searchParams.get('especialidad') || '');
  const [filtroEspecialista, setFiltroEspecialista] = useState(searchParams.get('especialistaId') || '');
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get('estado') || '');
  const [filtroPaciente, setFiltroPaciente] = useState(searchParams.get('searchPaciente') || '');
  const [expandedRecurrente, setExpandedRecurrente] = useState<Set<string>>(new Set());
  const [viewRecurrenteCalendar, setViewRecurrenteCalendar] = useState<any>(null);

  const [showWizard, setShowWizard] = useState(false);
  const wizardCtl = useAppointmentWizard();
  const { wizard, setWizard, wizardErrors, setWizardErrors, saving, totalCitasAgendadas, validateStep2, validateStep3, handleSaveAll, INITIAL_WIZARD } = wizardCtl;
  const [pacienteData, setPacienteData] = useState<any>(null);

  const pacienteSearch = usePacienteSearch();
  const pacienteQuick = usePacienteQuick((p: any) => {
    setWizard((prev) => ({
      ...prev, pacienteId: p.id, pacienteNombre: `${p.nombres} ${p.apellidos}`, pacienteIdentificacion: p.numeroIdentificacion,
    }));
    setPacienteData(p);
    setWizardErrors({});
  });
  const citaModify = useCitaModify();
  const citaDetail = useCitaDetail();
  const citaCancel = useCitaCancel();
  const hce = useAppointmentHce();

  useEffect(() => {
    if (citaDetail.showDetail) {
      hce.loadHceData(citaDetail.showDetail);
      hce.setDetailTab('cita');
      hce.setExpandedHce(new Set());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- callbacks estables via useCallback en useAppointmentHce
  }, [citaDetail.showDetail, hce.loadHceData, hce.setDetailTab, hce.setExpandedHce]);

  useEffect(() => {
    if (wizard.pacienteId) {
      pacientesApi.getById(wizard.pacienteId)
        .then(setPacienteData)
        .catch(() => setPacienteData(null));
    }
  }, [wizard.pacienteId]);

  const loadCitas = useCallback(() => {
    const params: Record<string, string> = {};
    if (filtroFechaInicio) params.fechaInicio = filtroFechaInicio;
    if (filtroFechaFin) params.fechaFin = filtroFechaFin;
    if (filtroEspecialidad) params.especialidad = filtroEspecialidad;
    if (filtroEspecialista) params.especialistaId = filtroEspecialista;
    if (filtroEstado) params.estado = filtroEstado;
    if (filtroPaciente.trim()) params.searchPaciente = filtroPaciente.trim();
    citasApi.getAll(params).then(setCitas).catch((e) => toast.error(e.message));
  }, [filtroFechaInicio, filtroFechaFin, filtroEspecialidad, filtroEspecialista, filtroEstado, filtroPaciente]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filtroFechaInicio) params.fechaInicio = filtroFechaInicio;
    if (filtroFechaFin) params.fechaFin = filtroFechaFin;
    if (filtroEspecialidad) params.especialidad = filtroEspecialidad;
    if (filtroEspecialista) params.especialistaId = filtroEspecialista;
    if (filtroEstado) params.estado = filtroEstado;
    if (filtroPaciente.trim()) params.searchPaciente = filtroPaciente.trim();
    Promise.all([
      citasApi.getAll(params),
      especialistasApi.getAll({ activo: true }),
      especialistasApi.getEspecialidades(),
    ]).then(([c, esp, espcs]) => {
      setCitas(c); setEspecialistas(esp); setEspecialidades(espcs);
    }).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, [filtroFechaInicio, filtroFechaFin, filtroEspecialidad, filtroEspecialista, filtroEstado, filtroPaciente]);

  const openWizard = () => {
    if (!requirePermission('crearCita')) return;
    setWizard({ ...INITIAL_WIZARD });
    pacienteSearch.setBusquedaPaciente('');
    pacienteSearch.setPacientesResult([]);
    setWizardErrors({});
    setPacienteData(null);
    setShowWizard(true);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Citas" description="Gestión de citas médicas" actions={<Button onClick={openWizard} icon={<Plus size={18} />}>Nueva Cita</Button>} />

      <AppointmentFilters
        filtroFechaInicio={filtroFechaInicio} filtroFechaFin={filtroFechaFin}
        filtroEspecialidad={filtroEspecialidad} filtroEspecialista={filtroEspecialista}
        filtroEstado={filtroEstado} filtroPaciente={filtroPaciente}
        especialidades={especialidades} especialistas={especialistas}
        onFechaInicioChange={setFiltroFechaInicio} onFechaFinChange={setFiltroFechaFin}
        onEspecialidadChange={setFiltroEspecialidad}
        onEspecialistaChange={(val) => {
          setFiltroEspecialista(val);
          if (val) { const esp = especialistas.find(es => es.especialista?.id === val); if (esp?.especialista?.especialidad) setFiltroEspecialidad(esp.especialista.especialidad); }
          else setFiltroEspecialidad('');
        }}
        onEstadoChange={setFiltroEstado} onPacienteChange={setFiltroPaciente} onFiltrar={loadCitas}
        onLimpiar={() => {
          setFiltroFechaInicio(''); setFiltroFechaFin('');
          setFiltroEspecialidad(''); setFiltroEspecialista('');
          setFiltroEstado(''); setFiltroPaciente('');
          citasApi.getAll({}).then(setCitas).catch((e) => toast.error(e.message));
        }}
      />

      <AppointmentTable
        citas={citas}
        expandedRecurrente={expandedRecurrente}
        onToggleExpand={(id) => { const s = new Set(expandedRecurrente); expandedRecurrente.has(id) ? s.delete(id) : s.add(id); setExpandedRecurrente(s); }}
        onOpenDetail={(c) => citaDetail.openDetail(c)}
        onOpenModify={(c) => citaModify.openModifyModal(c)}
        onOpenCancel={(c) => citaCancel.openCancel(c)}
        onReload={loadCitas}
      />

      {/* --- Modals (keep inline for now to avoid massive refactor) --- */}

      {/* Wizard Modal */}
      {showWizard && (
        <WizardModal
          wizard={wizard} setWizard={setWizard}
          wizardErrors={wizardErrors} setWizardErrors={setWizardErrors}
          saving={saving} totalCitasAgendadas={totalCitasAgendadas}
          validateStep2={validateStep2} validateStep3={validateStep3}
          handleSaveAll={handleSaveAll} INITIAL_WIZARD={INITIAL_WIZARD}
          onClose={() => setShowWizard(false)} onSuccess={() => { setShowWizard(false); loadCitas(); }}
          especialistas={especialistas} especialidades={especialidades}
          pacienteSearch={pacienteSearch} pacienteQuick={pacienteQuick}
          pacienteData={pacienteData}
        />
      )}

      {/* Quick Paciente Modal */}
      {pacienteQuick.showQuickPaciente && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Crear Paciente Rápido</h2>
              <button onClick={() => pacienteQuick.setShowQuickPaciente(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Identificación</label>
                  <select name="tipoIdentificacion" value={pacienteQuick.quickPaciente.tipoIdentificacion} onChange={pacienteQuick.handleQuickChange} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="CEDULA">Cédula</option><option value="RUC">RUC</option><option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número <span className="text-red-500">*</span></label>
                  <input name="numeroIdentificacion" value={pacienteQuick.quickPaciente.numeroIdentificacion} onChange={pacienteQuick.handleQuickChange} onBlur={(e) => pacienteQuick.handleQuickBlur('numeroIdentificacion', e.target.value)} className={cn('w-full border rounded-lg px-3 py-2 text-sm outline-none', pacienteQuick.quickTouched?.numeroIdentificacion && pacienteQuick.quickErrors?.numeroIdentificacion && 'border-red-400')} />
                  {pacienteQuick.quickTouched?.numeroIdentificacion && pacienteQuick.quickErrors?.numeroIdentificacion && <p className="text-xs text-red-500 mt-1">{pacienteQuick.quickErrors.numeroIdentificacion}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres <span className="text-red-500">*</span></label>
                  <input name="nombres" value={pacienteQuick.quickPaciente.nombres} onChange={pacienteQuick.handleQuickChange} onBlur={(e) => pacienteQuick.handleQuickBlur('nombres', e.target.value)} className={cn('w-full border rounded-lg px-3 py-2 text-sm outline-none', pacienteQuick.quickTouched?.nombres && pacienteQuick.quickErrors?.nombres && 'border-red-400')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos <span className="text-red-500">*</span></label>
                  <input name="apellidos" value={pacienteQuick.quickPaciente.apellidos} onChange={pacienteQuick.handleQuickChange} onBlur={(e) => pacienteQuick.handleQuickBlur('apellidos', e.target.value)} className={cn('w-full border rounded-lg px-3 py-2 text-sm outline-none', pacienteQuick.quickTouched?.apellidos && pacienteQuick.quickErrors?.apellidos && 'border-red-400')} />
                </div>
              </div>
              <UbicacionSelector provincia={pacienteQuick.quickPaciente.provincia} canton={pacienteQuick.quickPaciente.canton} parroquia={pacienteQuick.quickPaciente.parroquia} zona={pacienteQuick.quickPaciente.zona} onChange={pacienteQuick.setQuickPacienteField} onBlur={pacienteQuick.handleQuickBlur} errors={pacienteQuick.quickErrors} touched={pacienteQuick.quickTouched} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <textarea name="direccion" value={pacienteQuick.quickPaciente.direccion} onChange={(e) => pacienteQuick.setQuickPacienteField('direccion', e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button onClick={() => pacienteQuick.setShowQuickPaciente(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={pacienteQuick.handleQuickSave} disabled={pacienteQuick.savingQuick} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {pacienteQuick.savingQuick ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Guardando...</> : 'Guardar Paciente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {citaDetail.showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Detalle de Cita</h2>
              <button onClick={citaDetail.closeDetail} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex border-b">
              <button onClick={() => hce.setDetailTab('cita')} className={cn('px-6 py-3 text-sm font-medium border-b-2 transition-colors', hce.detailTab === 'cita' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>Cita</button>
              <button onClick={() => hce.setDetailTab('hce')} className={cn('px-6 py-3 text-sm font-medium border-b-2 transition-colors', hce.detailTab === 'hce' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>Historia Clínica</button>
            </div>
            {hce.detailTab === 'cita' ? (
              <div>
                <div className="p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="block text-gray-500 font-medium">Paciente</span><span className="text-gray-900">{citaDetail.showDetail.paciente?.nombres} {citaDetail.showDetail.paciente?.apellidos}</span></div>
                    <div><span className="block text-gray-500 font-medium">Identificación</span><span className="text-gray-900">{citaDetail.showDetail.paciente?.numeroIdentificacion}</span></div>
                    <div><span className="block text-gray-500 font-medium">Edad</span><span className="text-gray-900">{citaDetail.showDetail.paciente?.fechaNacimiento ? calcEdadCita(citaDetail.showDetail.paciente.fechaNacimiento) : '-'}</span></div>
                    <div><span className="block text-gray-500 font-medium">Especialista</span><span className="text-gray-900">{citaDetail.showDetail.especialista?.nombres} {citaDetail.showDetail.especialista?.apellidos}</span></div>
                    <div><span className="block text-gray-500 font-medium">Especialidad</span><span className="text-gray-900">{citaDetail.showDetail.especialidad}</span></div>
                    <div><span className="block text-gray-500 font-medium">Fecha</span><span className="text-gray-900">{formatDate(citaDetail.showDetail.fecha)}</span></div>
                    <div><span className="block text-gray-500 font-medium">Horario</span><span className="text-gray-900">{citaDetail.showDetail.horaInicio} - {citaDetail.showDetail.horaFin}</span></div>
                    <div><span className="block text-gray-500 font-medium">Estado</span><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium inline-block', getEstadoCitaColor(citaDetail.showDetail.estado))}>{ESTADOS_CITA.find(e => e.value === citaDetail.showDetail.estado)?.label || citaDetail.showDetail.estado}</span></div>
                    <div><span className="block text-gray-500 font-medium">Lugar</span><span className="text-gray-900">{citaDetail.showDetail.lugar || '-'}</span></div>
                  </div>
                </div>
                <div className="flex items-center justify-end p-6 border-t">
                  <button onClick={citaDetail.closeDetail} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cerrar</button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {hce.hceLoading ? <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" /></div>
                : hce.hceData && hce.hceData.consultasHCE?.length > 0 ? (
                  <div className="space-y-4">
                    <span className="text-sm font-medium text-gray-700">Total consultas: <strong>{hce.hceData.consultasHCE.length}</strong></span>
                    {hce.hceData.consultasHCE.map((c: any) => (
                      <div key={c.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-500">{formatDate(c.createdAt)}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{c.especialista?.especialidad || '-'}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-1">{c.motivoConsulta || 'Consulta sin motivo especificado'}</p>
                      </div>
                    ))}
                    <div className="pt-3 border-t">
                      <Link href={`${ROUTES.admin.hceEspecialistas}/${citaDetail.showDetail.especialistaId || citaDetail.showDetail.especialista?.id}/pacientes/${citaDetail.showDetail.pacienteId || citaDetail.showDetail.paciente?.id}`} className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                        Ver historia completa <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center"><p className="text-sm text-gray-500">Sin historial clínico disponible</p></div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modify Modal */}
      {citaModify.showModify && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Modificar Cita</h2>
              <button onClick={() => citaModify.setShowModify(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Mes</label><select value={citaModify.modCalMonth} onChange={(e) => citaModify.setModCalMonth(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm">{Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(2000, i).toLocaleString('es-EC', { month: 'long' })}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Año</label><select value={citaModify.modCalYear} onChange={(e) => citaModify.setModCalYear(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm">{Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i).map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas de modificación</label>
                <textarea value={citaModify.modifyData.notasModificacion} onChange={(e) => citaModify.setModifyData((prev: any) => ({ ...prev, notasModificacion: e.target.value }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Razón del cambio..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button onClick={() => citaModify.setShowModify(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={() => citaModify.handleModify(loadCitas)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {citaCancel.showCancel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-red-600">Cancelar Cita</h2>
              <button onClick={citaCancel.closeCancel} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">¿Está seguro de cancelar la cita de <strong>{citaCancel.showCancel.paciente?.nombres} {citaCancel.showCancel.paciente?.apellidos}</strong> del {formatDate(citaCancel.showCancel.fecha)} a las {citaCancel.showCancel.horaInicio}?</p>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Motivo de cancelación</label><textarea value={citaCancel.cancelMotivo} onChange={(e) => citaCancel.setCancelMotivo(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Indique el motivo..." /></div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button onClick={citaCancel.closeCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Volver</button>
              <button onClick={() => citaCancel.handleCancel(loadCitas)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Confirmar Cancelación</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
