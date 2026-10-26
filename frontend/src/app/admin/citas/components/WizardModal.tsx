'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PROTOCOLOS } from '../hooks/useAppointmentWizard';
import type { WizardState, CitaFecha } from '../hooks/useAppointmentWizard';
import { horariosApi, feriadosApi, especialistasApi, citasApi } from '@/lib/api-client';
import {
  X, Search, User, ChevronLeft, ChevronRight, Plus,
  CalendarDays, Clock,
} from 'lucide-react';

function CheckCircle({ className, size }: { className?: string; size?: number }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
}

interface WizardModalProps {
  wizard: WizardState;
  setWizard: (updater: WizardState | ((prev: WizardState) => WizardState)) => void;
  wizardErrors: Record<string, string>;
  setWizardErrors: (e: Record<string, string>) => void;
  saving: boolean;
  totalCitasAgendadas: number;
  validateStep2: () => boolean;
  validateStep3: () => boolean;
  handleSaveAll: (onSuccess: () => void) => Promise<void>;
  INITIAL_WIZARD: WizardState;
  onClose: () => void;
  onSuccess: () => void;
  especialistas: any[];
  especialidades: string[];
  pacienteSearch: any;
  pacienteQuick: any;
  pacienteData: any;
}

export function WizardModal({
  wizard, setWizard, wizardErrors, setWizardErrors, saving, totalCitasAgendadas,
  validateStep2, validateStep3, handleSaveAll, INITIAL_WIZARD,
  onClose, onSuccess, especialistas, especialidades,
  pacienteSearch, pacienteQuick, pacienteData,
}: WizardModalProps) {
  const [step, setStep] = useState(1);
  const [busquedaEspecialista, setBusquedaEspecialista] = useState('');
  const [showEspecialistaList, setShowEspecialistaList] = useState(false);
  const [globalCalMonth, setGlobalCalMonth] = useState(new Date().getMonth());
  const [globalCalYear, setGlobalCalYear] = useState(new Date().getFullYear());

  const filteredEspecialistas = useMemo(
    () => wizard.especialidad
      ? especialistas.filter((e: any) => e.especialista?.especialidad === wizard.especialidad)
      : especialistas,
    [especialistas, wizard.especialidad],
  );

  const disponibleSinCita = filteredEspecialistas.filter(
    (e: any) => !wizard.especialistas.some(es => es.id === e.especialista?.id),
  );

  const goToStep = (s: number) => {
    if (s === 3 && !validateStep2()) return;
    setWizardErrors({});
    setStep(s);
  };

  const selectPaciente = (p: any) => {
    setWizard((prev) => ({ ...prev, pacienteId: p.id, pacienteNombre: `${p.nombres} ${p.apellidos}`, pacienteIdentificacion: p.numeroIdentificacion }));
    setWizardErrors({});
    setStep(2);
  };

  const selectProtocolo = (value: string) => {
    const proto = PROTOCOLOS.find((pp) => pp.value === value);
    setWizard((prev) => ({
      ...prev,
      tipo: value,
      totalCitas: proto?.citas || 1,
      especialistas: value === 'UNICA'
        ? prev.especialistas.slice(0, 1).map(e => ({ ...e, citasCount: 1 }))
        : prev.especialistas,
    }));
  };

  const addEspecialista = (esp: any) => {
    const e = esp.especialista || esp;
    setWizard((prev) => ({
      ...prev,
      especialidad: prev.especialidad || e.especialidad,
      especialistas: [...prev.especialistas, {
        id: e.id,
        nombre: `${e.nombres || e.primerNombre || ''} ${e.apellidos || e.primerApellido || ''}`.trim(),
        especialidad: e.especialidad,
        tienePasantes: e.tienePasantes || false,
        sede: e.sede || '',
        consultorio: e.consultorioPredeterminado || '',
        citasCount: prev.tipo === 'UNICA' ? 1 : 0,
        fechas: [],
      }],
    }));
    setBusquedaEspecialista('');
    setShowEspecialistaList(false);
  };

  const removeEspecialista = (id: string) => {
    setWizard((prev) => ({
      ...prev,
      especialistas: prev.especialistas.filter((e) => e.id !== id),
    }));
  };

  const updateEspCitasCount = (id: string, count: number) => {
    setWizard((prev) => ({
      ...prev,
      especialistas: prev.especialistas.map((e) =>
        e.id === id ? { ...e, citasCount: Math.max(0, count), fechas: count < e.fechas.length ? e.fechas.slice(0, count) : e.fechas } : e,
      ),
    }));
  };

  const addFechaToEspecialista = (espId: string, fecha: CitaFecha) => {
    setWizard((prev) => ({
      ...prev,
      especialistas: prev.especialistas.map((e) => {
        if (e.id !== espId) return e;
        if (e.fechas.length >= e.citasCount) return e;
        return { ...e, fechas: [...e.fechas, fecha] };
      }),
    }));
  };

  const removeFechaFromEspecialista = (espId: string, idx: number) => {
    setWizard((prev) => ({
      ...prev,
      especialistas: prev.especialistas.map((e) => {
        if (e.id !== espId) return e;
        return { ...e, fechas: e.fechas.filter((_, i) => i !== idx) };
      }),
    }));
  };

  const totalAsignadas = wizard.especialistas.reduce((s, e) => s + e.citasCount, 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-4 pb-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 flex overflow-hidden" style={{ minHeight: '600px', maxHeight: '90vh' }}>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <div><h2 className="text-lg font-bold">Nueva Cita</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {step === 1 && 'Buscar paciente'}{step === 2 && 'Protocolo y especialistas'}{step === 3 && `Agendar ${wizard.totalCitas} cita(s)`}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
          </div>

          <div className="flex px-4 pt-3 gap-1.5 shrink-0">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500')}>{s}</div>
                {s < 3 && <div className={cn('w-10 h-0.5', step > s ? 'bg-primary-400' : 'bg-gray-200')} />}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Nombre o identificación..." value={pacienteSearch.busquedaPaciente} onChange={(e) => pacienteSearch.setBusquedaPaciente(e.target.value)} autoFocus className="w-full pl-10 pr-4 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  {pacienteSearch.searchingPaciente && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" /></div>}
                </div>
                {pacienteSearch.pacientesResult.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {pacienteSearch.pacientesResult.map((p: any) => (
                      <button key={p.id} onClick={() => selectPaciente(p)} className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0"><User size={14} className="text-primary-600" /></div>
                        <div className="min-w-0"><p className="font-medium truncate">{p.nombres} {p.apellidos}</p><p className="text-xs text-gray-500">{p.numeroIdentificacion}</p></div>
                      </button>
                    ))}
                  </div>
                )}
                {wizard.pacienteId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600 shrink-0" /><span className="font-medium text-green-800">{wizard.pacienteNombre}</span><span className="text-green-600">({wizard.pacienteIdentificacion})</span>
                  </div>
                )}
                <button onClick={() => pacienteQuick.openQuickPaciente()} className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"><Plus size={14} /> Crear Paciente Rápido</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Protocolo de atención</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROTOCOLOS.map((p) => (
                      <button key={p.value} onClick={() => selectProtocolo(p.value)}
                        className={cn('text-left p-3 rounded-lg border-2 transition-all', wizard.tipo === p.value ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 bg-white hover:border-primary-200')}>
                        <div className="font-semibold text-sm">{p.label}</div><div className="text-xs text-gray-500 mt-0.5">{p.desc}</div><div className="text-xs font-bold text-primary-600 mt-1">{p.citas} cita{p.citas !== 1 ? 's' : ''}</div>
                      </button>
                    ))}
                  </div>
                  {wizard.tipo && wizard.tipo !== 'UNICA' && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-2 flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Total citas:</span>
                      <input type="number" min={1} max={20} value={wizard.totalCitas} onChange={(e) => setWizard((prev) => ({ ...prev, totalCitas: Math.max(1, parseInt(e.target.value) || 1) }))} className="w-16 border rounded px-2 py-1 font-bold text-center text-sm" />
                    </div>
                  )}
                  {wizardErrors.tipo && <p className="text-xs text-red-500 mt-1">{wizardErrors.tipo}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Especialidad <span className="text-red-500">*</span></label>
                  <select value={wizard.especialidad} onChange={(e) => setWizard((prev) => ({ ...prev, especialidad: e.target.value }))}
                    className={cn('w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500', wizardErrors.especialidad && 'border-red-400')}>
                    <option value="">Seleccione especialidad...</option>{especialidades.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {wizardErrors.especialidad && <p className="text-xs text-red-500 mt-1">{wizardErrors.especialidad}</p>}
                </div>

                {wizard.especialidad && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Agregar especialistas</label>
                    {wizard.tipo === 'UNICA' && wizard.especialistas.length >= 1 ? (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Cita única: solo se permite 1 especialista</p>
                    ) : (
                      <div className="relative">
                        <input type="text" value={busquedaEspecialista} onChange={(e) => { setBusquedaEspecialista(e.target.value); setShowEspecialistaList(true); }} onFocus={() => setShowEspecialistaList(true)} onBlur={() => setTimeout(() => setShowEspecialistaList(false), 200)}
                          placeholder="Escriba para buscar especialista..." className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                        {showEspecialistaList && (
                          <div className="absolute z-10 top-full mt-1 w-full border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto">
                            {(() => {
                              const filtered = disponibleSinCita.filter((e: any) => `${e.especialista?.nombres} ${e.especialista?.apellidos}`.toLowerCase().includes(busquedaEspecialista.toLowerCase()));
                              if (filtered.length === 0) return <div className="px-3 py-2 text-xs text-gray-400">Sin resultados</div>;
                              return filtered.map((e: any) => (<button key={e.especialista?.id} onMouseDown={() => addEspecialista(e)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{e.especialista?.nombres} {e.especialista?.apellidos}</button>));
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {wizard.especialistas.length > 0 && (
                  <div className="space-y-1.5"><label className="block text-xs font-medium text-gray-500">Seleccionados ({wizard.especialistas.length})</label>
                    {wizard.especialistas.map((esp) => (
                      <div key={esp.id} className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 text-sm">
                        <div className="flex-1 min-w-0"><span className="font-medium truncate block">{esp.nombre}</span><span className="text-xs text-gray-400">{esp.especialidad}</span></div>
                        <button onClick={() => removeEspecialista(esp.id)} className="p-1 text-red-400 hover:text-red-600"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {wizardErrors.especialistas && <p className="text-xs text-red-500">{wizardErrors.especialistas}</p>}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {wizard.especialistas.map((esp) => (
                  <div key={esp.id} className="border rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{esp.nombre}</p><p className="text-xs text-gray-400">{esp.especialidad}</p></div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-gray-500">Citas:</span>
                        <button onClick={() => updateEspCitasCount(esp.id, esp.citasCount - 1)} disabled={esp.citasCount <= 0 || wizard.tipo === 'UNICA'} className="w-6 h-6 rounded border bg-white text-xs hover:bg-gray-100 disabled:opacity-30">-</button>
                        <span className="text-sm font-bold w-5 text-center">{esp.citasCount}</span>
                        <button onClick={() => updateEspCitasCount(esp.id, esp.citasCount + 1)} disabled={wizard.tipo === 'UNICA'} className="w-6 h-6 rounded border bg-white text-xs hover:bg-gray-100 disabled:opacity-30">+</button>
                      </div>
                    </div>
                    {esp.citasCount > 0 && (
                      <CalendarMini
                        esp={esp}
                        wizardId={wizard.pacienteId}
                        globalCalMonth={globalCalMonth} globalCalYear={globalCalYear}
                        setGlobalCalMonth={setGlobalCalMonth} setGlobalCalYear={setGlobalCalYear}
                        addFecha={addFechaToEspecialista} removeFecha={removeFechaFromEspecialista}
                      />
                    )}
                  </div>
                ))}

                <div className="flex items-center gap-2 text-sm">
                  <span className={cn('font-bold', totalAsignadas === wizard.totalCitas && totalCitasAgendadas === wizard.totalCitas ? 'text-green-600' : 'text-amber-600')}>
                    Progreso: {totalCitasAgendadas} / {wizard.totalCitas} agendadas
                  </span>
                  {totalAsignadas !== wizard.totalCitas && <span className="text-xs text-gray-400">({totalAsignadas} asignadas)</span>}
                </div>
                {wizardErrors.citasCount && <p className="text-xs text-red-500">{wizardErrors.citasCount}</p>}
                {wizardErrors.fechas && <p className="text-xs text-red-500">{wizardErrors.fechas}</p>}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la consulta (opcional)</label>
                  <textarea value={wizard.motivo} onChange={(e) => setWizard((prev) => ({ ...prev, motivo: e.target.value }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Describa el motivo de la consulta..." />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={wizard.notificarWhatsapp} onChange={(e) => setWizard((prev) => ({ ...prev, notificarWhatsapp: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600" />
                  Notificar por WhatsApp
                </label>

                <button onClick={() => handleSaveAll(onSuccess)} disabled={saving}
                  className="w-full py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Guardando...</> : `Guardar ${totalCitasAgendadas} Cita(s)`}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border-t shrink-0">
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Anterior</button>
            {step < 3 ? (
              <button onClick={() => goToStep(step + 1)} disabled={step === 1 && !wizard.pacienteId} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">Siguiente</button>
            ) : null}
          </div>
        </div>

        {/* Right Panel */}
        <SidePanel pacienteData={pacienteData} pacienteId={wizard.pacienteId} />
      </div>
    </div>
  );
}

function SidePanel({ pacienteData, pacienteId }: { pacienteData: any; pacienteId: string }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pacienteId) { setDetail(null); return; }
    setLoading(true);
    import('@/lib/api-client').then(({ pacientesApi }) =>
      pacientesApi.getById(pacienteId).then((d: any) => setDetail(d)).catch(() => setDetail(null)).finally(() => setLoading(false)),
    );
  }, [pacienteId]);

  const data = detail || pacienteData;

  const formatFecha = (f?: string) => {
    if (!f) return '-';
    const d = new Date(f);
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

  const getEstadoLabel = (estado: string) => {
    const map: Record<string, string> = { PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', EN_ESPERA: 'En espera', EN_ATENCION: 'En atención', ATENDIDA: 'Atendida', NO_ASISTIO: 'No asistió', CANCELADA: 'Cancelada', REAGENDADA: 'Reagendada' };
    return map[estado] || estado;
  };

  return (
    <div className="w-72 border-l bg-gray-50 shrink-0 hidden lg:flex flex-col">
      <div className="p-4 border-b bg-white"><h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><User size={14} /> Paciente</h3></div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><div className="animate-spin h-4 w-4 border-b-2 border-primary-600 rounded-full" /></div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-gray-800">{data.nombres} {data.apellidos}</p>
            <p className="text-gray-500">{data.numeroIdentificacion}</p>
            {data.telefono && <p className="text-gray-500">📞 {data.telefono}</p>}
            {data.fechaNacimiento && (
              <p className="text-gray-500">
                🎂 {formatFecha(data.fechaNacimiento)}
                {calcEdad(data.fechaNacimiento) != null && <span className="ml-1">({calcEdad(data.fechaNacimiento)} años)</span>}
              </p>
            )}
            {data.grupoSanguineo && <p className="text-gray-500">🩸 {data.grupoSanguineo}</p>}
            {data.tipoSeguro && <p className="text-gray-500">🏥 {data.tipoSeguro}</p>}
          </div>
          {data.alergias && (
            <div><p className="text-xs font-semibold text-gray-600 mb-1">Alergias</p><p className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1">{typeof data.alergias === 'string' ? data.alergias : data.alergias.join(', ')}</p></div>
          )}
          {data.citas && data.citas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Historial ({data.citas.length} citas)</p>
              <div className="space-y-1">
                {data.citas.slice(0, 20).map((c: any, i: number) => (
                  <div key={i} className="text-[10px] bg-white rounded p-1.5 border space-y-0.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      <CalendarDays size={10} className="text-gray-400 shrink-0" />
                      <span className="text-gray-600">{c.fecha ? new Date(c.fecha).toLocaleDateString('es-EC') : '-'}</span>
                      {c.horaInicio && <span className="text-gray-400">{c.horaInicio.slice(0, 5)}</span>}
                      <span className="text-gray-300">·</span>
                      <span className="font-medium text-gray-700 truncate">{c.especialidad || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      {c.especialista && <span className="truncate">{c.especialista.nombres?.split(' ')[0]} {c.especialista.apellidos?.split(' ')[0]}</span>}
                      {c.estado && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className={cn(
                            c.estado === 'ATENDIDA' && 'text-green-600',
                            c.estado === 'PENDIENTE' && 'text-blue-600',
                            c.estado === 'CANCELADA' && 'text-red-500',
                            c.estado === 'NO_ASISTIO' && 'text-orange-600',
                          )}>{getEstadoLabel(c.estado)}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 p-4 text-center">
          {pacienteId ? 'Cargando...' : 'Seleccione un paciente'}
        </div>
      )}
    </div>
  );
}

const ESTADOS_COLOR: Record<string, string> = {
  PENDIENTE: 'text-blue-600', CONFIRMADA: 'text-green-600', EN_ESPERA: 'text-yellow-600',
  EN_ATENCION: 'text-purple-600', ATENDIDA: 'text-green-700', NO_ASISTIO: 'text-orange-600',
  CANCELADA: 'text-red-500', REAGENDADA: 'text-cyan-600',
};

function CalendarMini({ esp, wizardId, globalCalMonth, globalCalYear, setGlobalCalMonth, setGlobalCalYear, addFecha, removeFecha }: any) {
  const [fechaSel, setFechaSel] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [horarioLocal, setHorarioLocal] = useState<any[]>([]);
  const [feriados, setFeriados] = useState<any[]>([]);
  const [bloqueos, setBloqueos] = useState<any[]>([]);
  const [citasMes, setCitasMes] = useState<any[]>([]);

  useEffect(() => {
    horariosApi.getByEspecialista(esp.id, true).then(setHorarioLocal).catch(() => setHorarioLocal([]));
    feriadosApi.getAll().then(setFeriados).catch(() => setFeriados([]));
    especialistasApi.getAllBloqueos().then(setBloqueos).catch(() => setBloqueos([]));
  }, [esp.id]);

  useEffect(() => {
    const inicio = `${globalCalYear}-${String(globalCalMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(globalCalYear, globalCalMonth + 1, 0).getDate();
    const fin = `${globalCalYear}-${String(globalCalMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    citasApi.getAll({ fechaInicio: inicio, fechaFin: fin, especialistaId: esp.id })
      .then(setCitasMes).catch(() => setCitasMes([]));
  }, [esp.id, globalCalMonth, globalCalYear]);

  const getDayStatus = useCallback((day: number) => {
    const dateStr = `${globalCalYear}-${String(globalCalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(globalCalYear, globalCalMonth, day);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (dateObj < today) return { label: 'Pasado', color: 'bg-gray-100 text-gray-300 cursor-not-allowed', clickable: false, title: 'Fecha pasada' };

    const diaSemana = dateObj.getDay();
    const trabaja = horarioLocal.some((h: any) => h.diaSemana === diaSemana && h.activo === true);
    if (!trabaja) return { label: 'No laboral', color: 'bg-gray-50 text-gray-300 cursor-not-allowed', clickable: false, title: 'No laboral' };

    const esFeriado = feriados.find((f: any) => {
      const fd = new Date(f.fecha);
      return fd.getFullYear() === globalCalYear && fd.getMonth() === globalCalMonth && fd.getDate() === day && f.activo;
    });
    if (esFeriado) return { label: esFeriado.nombre || 'Feriado', color: 'bg-purple-200 text-purple-700 border border-purple-400 cursor-not-allowed', clickable: false, title: `Feriado: ${esFeriado.nombre}` };

    const diaBloqueado = bloqueos.filter((b: any) => {
      const inicio = new Date(b.fechaInicio);
      const fin = b.fechaFin ? new Date(b.fechaFin) : new Date(8640000000000000);
      return dateObj >= inicio && dateObj <= fin && (b.especialistaId === esp.id || b.especialistas?.some((e: any) => e.especialistaId === esp.id || e.id === esp.id));
    });
    if (diaBloqueado.length > 0) return { label: 'Bloqueado', color: 'bg-red-100 text-red-600 border border-red-300 cursor-not-allowed', clickable: false, title: `Bloqueado: ${diaBloqueado[0].motivo || diaBloqueado[0].nombre || '—'}` };

    const citasDia = citasMes.filter((c: any) => {
      const cf = typeof c.fecha === 'string' ? c.fecha.slice(0, 10) : new Date(c.fecha).toISOString().slice(0, 10);
      const [fy, fm, fd] = cf.split('-').map(Number);
      return fm === globalCalMonth + 1 && fd === day && c.estado !== 'CANCELADA';
    });
    const tieneCitaPaciente = citasDia.some((c: any) => c.pacienteId === wizardId);
    const numCitas = citasDia.length;

    if (numCitas > 0) {
      const label = tieneCitaPaciente ? 'Paciente' : `${numCitas} cita${numCitas > 1 ? 's' : ''}`;
      const color = tieneCitaPaciente
        ? 'bg-orange-100 text-orange-700 border border-orange-400 hover:bg-orange-200 cursor-pointer'
        : 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 cursor-pointer';
      return { label, color, clickable: true, title: tieneCitaPaciente ? 'El paciente ya tiene cita este día — click para ver horarios' : `${numCitas} cita(s) de otros pacientes. Click para ver horarios disponibles` };
    }

    return { label: 'Libre', color: 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 cursor-pointer', clickable: true, title: 'Disponible — click para ver horarios' };
  }, [globalCalYear, globalCalMonth, horarioLocal, feriados, bloqueos, citasMes, wizardId, esp.id]);

  const handleDayClick = (day: number) => {
    const fechaStr = `${globalCalYear}-${String(globalCalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setFechaSel(fechaStr);
    setHoraInicio('');
    setLoadingSlots(true);
    setSlots([]);
    horariosApi.getDisponibles(esp.id, fechaStr, wizardId)
      .then(setSlots)
      .catch((e) => {
        console.error('Error al cargar horarios:', e?.message || e);
        setSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button onClick={() => { if (globalCalMonth === 0) { setGlobalCalMonth(11); setGlobalCalYear(globalCalYear - 1); } else { setGlobalCalMonth(globalCalMonth - 1); } }} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={14} /></button>
        <span className="text-xs font-semibold">{new Date(globalCalYear, globalCalMonth).toLocaleString('es-EC', { month: 'short', year: 'numeric' })}</span>
        <button onClick={() => { if (globalCalMonth === 11) { setGlobalCalMonth(0); setGlobalCalYear(globalCalYear + 1); } else { setGlobalCalMonth(globalCalMonth + 1); } }} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-0.5">{d}</div>)}
        {(() => {
          const firstDay = new Date(globalCalYear, globalCalMonth, 1).getDay();
          const daysInMonth = new Date(globalCalYear, globalCalMonth + 1, 0).getDate();
          const cells: React.ReactNode[] = [];
          for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} />);
          for (let d = 1; d <= daysInMonth; d++) {
            const fechaStr = `${globalCalYear}-${String(globalCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const status = getDayStatus(d);
            const isSel = fechaSel === fechaStr;
            cells.push(
              <button key={d} disabled={!status.clickable} onClick={() => handleDayClick(d)}
                className={cn('text-[10px] p-0.5 rounded text-center relative', status.color, isSel && 'ring-2 ring-primary-500 ring-offset-1')}
                title={status.title}>
                <div className="font-semibold">{d}</div>
                <div className="text-[8px] leading-none truncate">{status.label}</div>
              </button>
            );
          }
          return cells;
        })()}
      </div>

      <div className="flex flex-wrap gap-1 text-[9px] text-gray-400">
        <span className="bg-green-100 text-green-700 border border-green-300 rounded px-1">Libre/Disp.</span>
        <span className="bg-orange-100 text-orange-700 border border-orange-400 rounded px-1">Cita paciente</span>
        <span className="bg-purple-200 text-purple-700 border border-purple-400 rounded px-1">Feriado</span>
        <span className="bg-red-100 text-red-600 border border-red-300 rounded px-1">Bloqueo</span>
      </div>

      {fechaSel && (
        <div>
          {loadingSlots ? (
            <div className="text-[10px] text-gray-400 flex items-center gap-1"><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600" /> Cargando horarios...</div>
          ) : slots.length > 0 ? (
            <div className="grid grid-cols-7 gap-0.5">
              {slots.filter((s: any) => s.estado === 'DISPONIBLE').map((s: any, i: number) => (
                <button key={i} onClick={() => setHoraInicio(s.horaInicio)}
                  className={cn('py-0.5 px-0.5 rounded text-[10px] font-semibold border text-center', horaInicio === s.horaInicio ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400')}>
                  {s.horaInicio.slice(0, 5)}
                </button>
              ))}
              {slots.filter((s: any) => s.estado !== 'DISPONIBLE').map((s: any, i: number) => {
                const isPaciente = s.estado === 'OCUPADO_PACIENTE';
                const color = isPaciente
                  ? 'bg-orange-50 border-orange-300 text-orange-600'
                  : 'bg-red-50 border-red-200 text-red-500';
                const title = s.estado === 'OCUPADO_PACIENTE' ? 'El paciente ya tiene cita' : s.estado === 'OCUPADO_ESPECIALISTA' ? 'Ocupado — especialista' : 'Ocupado — pasante';
                return (
                  <div key={`oc-${i}`} className={cn('py-0.5 px-0.5 rounded text-center border cursor-not-allowed', color)} title={title}>
                    <div className="text-[10px] font-bold line-through">{s.horaInicio.slice(0, 5)}</div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-[10px] text-gray-400">Sin horarios para esta fecha (verificá horario del especialista)</p>}
        </div>
      )}

      {fechaSel && horaInicio && esp.fechas.length < esp.citasCount && (
        <button onClick={() => {
          const slot = slots.find((s: any) => s.horaInicio === horaInicio);
          addFecha(esp.id, { fecha: fechaSel, horaInicio, horaFin: slot?.horaFin || horaInicio, duracionMinutos: slot?.duracionMinutos || 30, consultorio: esp.consultorio });
          setFechaSel(''); setHoraInicio('');
        }}
          className="px-2.5 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700">Agendar {new Date(fechaSel + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })} {horaInicio.slice(0, 5)}</button>
      )}
      {fechaSel && horaInicio && esp.fechas.length >= esp.citasCount && (
        <p className="text-[10px] text-amber-600">Ya agendaste todas las citas para este especialista</p>
      )}

      {esp.fechas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {esp.fechas.map((f: CitaFecha, i: number) => (
            <div key={i} className="flex items-center gap-1 text-[10px] bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
              <CalendarDays size={10} className="text-green-600 shrink-0" />
              <span className="font-medium">{new Date(f.fecha + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit' })}</span>
              <Clock size={10} className="text-green-600 shrink-0" />
              <span>{f.horaInicio.slice(0, 5)}</span>
              <button onClick={() => removeFecha(esp.id, i)} className="text-red-400 hover:text-red-600"><X size={10} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
