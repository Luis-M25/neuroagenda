'use client';

import { useEffect, useState, useCallback } from 'react';
import { reportesApi, citasApi, hceApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes';
import { getUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  CalendarDays, Users, Activity, Clock, ChevronLeft, ChevronRight,
  Eye, X, RotateCcw, XCircle, UserX, Ban, FileText, Stethoscope,
  ArrowRight,
} from 'lucide-react';

function formatDateEs(fechaStr: string): string {
  const [y, m, d] = fechaStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysStr(fechaStr: string, dias: number): string {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  fecha.setDate(fecha.getDate() + dias);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function isValidDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.getFullYear() === y && fecha.getMonth() === m - 1 && fecha.getDate() === d;
}

const STATUS_MAP: Record<string, { variant: 'warning' | 'info' | 'purple' | 'success' | 'neutral' | 'danger' | 'orange' }> = {
  PENDIENTE: { variant: 'warning' },
  CONFIRMADA: { variant: 'info' },
  EN_ESPERA: { variant: 'purple' },
  EN_ATENCION: { variant: 'success' },
  ATENDIDA: { variant: 'neutral' },
  NO_ASISTIO: { variant: 'orange' },
  CANCELADA: { variant: 'danger' },
};

export default function AdminDashboard() {
  const router = useRouter();
  const user = getUser();
  useEffect(() => {
    if (user?.rol === 'AUDITOR') {
      router.replace(ROUTES.auditor.dashboard);
    }
  }, [user, router]);

  const [fecha, setFecha] = useState(todayStr());
  const [fechaInput, setFechaInput] = useState(todayStr());
  const [stats, setStats] = useState<any>(null);
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailCita, setDetailCita] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'estado' | 'hce'>('estado');
  const [hceData, setHceData] = useState<any>(null);
  const [loadingHce, setLoadingHce] = useState(false);
  const [reagendarTarget, setReagendarTarget] = useState<any | null>(null);
  const [reagendarFecha, setReagendarFecha] = useState('');
  const [reagendarHoraInicio, setReagendarHoraInicio] = useState('');
  const [reagendarHoraFin, setReagendarHoraFin] = useState('');
  const [reagendarSaving, setReagendarSaving] = useState(false);

  const handleReagendar = (cita: any) => {
    setReagendarTarget(cita);
    setReagendarFecha(cita.fecha?.split('T')[0] || '');
    setReagendarHoraInicio(cita.horaInicio || '');
    setReagendarHoraFin(cita.horaFin || '');
  };

  async function submitReagendar() {
    if (!reagendarTarget) return;
    setReagendarSaving(true);
    try {
      await citasApi.reagendar(reagendarTarget.id, {
        fecha: reagendarFecha,
        horaInicio: reagendarHoraInicio,
        horaFin: reagendarHoraFin,
      });
      toast.success('Cita reagendada');
      setReagendarTarget(null);
      loadData(fecha);
    } catch (e: any) {
      toast.error(e.message || 'No se pudo reagendar');
    } finally {
      setReagendarSaving(false);
    }
  }
  const handleCancelar = async (cita: any) => {
    if (!window.confirm('Cancelar esta cita?')) return;
    try {
      await citasApi.updateEstado(cita.id, { estado: 'CANCELADA' });
      toast.success('Cita cancelada');
      setDetailCita(null);
      loadData(fecha);
    } catch (e: any) { toast.error(e.message); }
  };
  const handleNoAsistio = async (cita: any) => {
    if (!window.confirm('Marcar como No Asistio?')) return;
    try {
      await citasApi.updateEstado(cita.id, { estado: 'NO_ASISTIO' });
      toast.success('Cita marcada como no asistio');
      loadData(fecha);
    } catch (e: any) { toast.error(e.message); }
  };
  const handleLiberar = async (cita: any) => {
    if (!window.confirm('Liberar el horario de esta cita cancelada?')) return;
    try {
      await citasApi.liberarHorario(cita.id);
      toast.success('Horario liberado');
      loadData(fecha);
    } catch (e: any) { toast.error(e.message); }
  };

  const loadData = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ fechaInicio: f, fechaFin: f });
      // Las dos llamadas en PARALELO: en serie costaban 2 round-trips (bajo el
      // tunel ~250 ms cada uno -> el dashboard tardaba el doble en cargar).
      const [dash, c] = await Promise.all([
        reportesApi.getDashboard(qs as any),
        citasApi.getAll({ fechaInicio: f, fechaFin: f }),
      ]);
      setStats(dash);
      setCitas(Array.isArray(c) ? c : []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(fecha); }, [fecha, loadData]);

  const handlePrev = () => { const prev = addDaysStr(fecha, -1); setFecha(prev); setFechaInput(prev); };
  const handleNext = () => { const next = addDaysStr(fecha, 1); setFecha(next); setFechaInput(next); };
  const handleHoy = () => { const hoy = todayStr(); setFecha(hoy); setFechaInput(hoy); };
  const handleDateInput = (val: string) => {
    setFechaInput(val);
    if (isValidDate(val)) setFecha(val);
  };

  const openDetail = async (cita: any) => {
    setDetailCita(cita);
    setActiveTab('estado');
    setHceData(null);
    setLoadingHce(true);
    try {
      const cons = await hceApi.getHistorialPaciente(cita.pacienteId);
      setHceData(cons);
    } catch { setHceData(null); }
    finally { setLoadingHce(false); }
  };

  const estados = ['PENDIENTE', 'CONFIRMADA', 'EN_ESPERA', 'EN_ATENCION', 'ATENDIDA', 'NO_ASISTIO', 'CANCELADA'];
  const groupedByEstado: Record<string, any[]> = {};
  for (const est of estados) groupedByEstado[est] = citas.filter((c: any) => c.estado === est);

  const hoyStr = todayStr();
  const isToday = fecha === hoyStr;

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={isToday ? 'Dashboard' : formatDateEs(fecha)} description="Resumen del dia seleccionado" />

      {/* Date picker */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <button onClick={handlePrev} className="p-2 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-700 transition-colors"><ChevronLeft size={18} /></button>
          <input type="date" value={fechaInput} onChange={(e) => handleDateInput(e.target.value)}
            className="px-3 py-2 text-sm border-x border-neutral-200 bg-transparent outline-none text-neutral-700 [color-scheme:light]"
          />
          <button onClick={handleNext} className="p-2 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-700 transition-colors"><ChevronRight size={18} /></button>
        </div>
        <Button variant="outline" size="sm" onClick={handleHoy} disabled={isToday}>Hoy</Button>
        <span className="text-xs text-neutral-400">{citas.length} citas</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: CalendarDays, label: 'Citas del dia', value: stats?.totalCitas || 0 },
          { icon: Stethoscope, label: 'Especialistas con citas', value: stats?.especialistasConCitas || 0 },
          { icon: Users, label: 'Total especialistas', value: stats?.totalEspecialistas || 0 },
          { icon: Activity, label: 'Pacientes con citas', value: stats?.pacientesConCitas || 0 },
          { icon: Users, label: 'Total pacientes', value: stats?.totalPacientes || 0 },
          { icon: Clock, label: 'Atendidas', value: stats?.citasAtendidas || 0 },
        ].map((kpi, i) => (
          <Card key={i} className="flex items-center gap-3" padding="sm" hover>
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <kpi.icon size={18} className="text-primary-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900">{kpi.value}</p>
              <p className="text-[11px] text-neutral-500 leading-tight">{kpi.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Citas by status */}
      <div className="space-y-3">
        {estados.map((est) => {
          const items = groupedByEstado[est] || [];
          if (items.length === 0) return null;
          const badge = STATUS_MAP[est] || { variant: 'neutral' as const };
          return (
            <Card key={est} padding="none">
              <div className="px-5 py-3 border-b border-neutral-100 flex items-center gap-2 bg-neutral-50/50">
                <Badge variant={badge.variant}>{est}</Badge>
                <span className="text-xs text-neutral-500">({items.length})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed min-w-[680px]">
                  <colgroup>
                    <col className="w-[12%]" />
                    <col className="w-[28%]" />
                    <col className="w-[22%]" />
                    <col className="w-[18%]" />
                    <col className="w-[12%]" />
                    <col className="w-[8%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-left border-b border-neutral-100 bg-neutral-50/50">
                      <th className="px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Hora</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Paciente</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Especialista</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Especialidad</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Motivo</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((cita: any) => (
                      <tr key={cita.id} onClick={() => openDetail(cita)} className="border-t border-neutral-50 hover:bg-primary-50/30 cursor-pointer transition-colors">
                        <td className="px-4 py-3 font-medium text-neutral-800 whitespace-nowrap font-mono text-xs">{cita.horaInicio}</td>
                        <td className="px-4 py-3 text-neutral-800 truncate" title={`${cita.paciente?.nombres} ${cita.paciente?.apellidos}`}>{cita.paciente?.nombres} {cita.paciente?.apellidos}</td>
                        <td className="px-4 py-3 text-neutral-700 truncate" title={`${cita.especialista?.nombres} ${cita.especialista?.apellidos}`}>{cita.especialista?.nombres?.split(' ')[0]} {cita.especialista?.apellidos?.split(' ')[0]}</td>
                        <td className="px-4 py-3 text-neutral-500 truncate" title={cita.especialidad}>{cita.especialidad}</td>
                        <td className="px-4 py-3 text-neutral-500 truncate" title={cita.motivo}>{cita.motivo || '-'}</td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-0.5">
                            {cita.estado !== 'CANCELADA' && (
                              <>
                                <button onClick={() => handleReagendar(cita)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Reagendar"><RotateCcw size={14} /></button>
                                <button onClick={() => handleCancelar(cita)} className="p-1.5 text-danger-500 hover:bg-danger-50 rounded-lg" title="Cancelar"><XCircle size={14} /></button>
                                {cita.estado !== 'ATENDIDA' && <button onClick={() => handleNoAsistio(cita)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg" title="No Asistio"><UserX size={14} /></button>}
                              </>
                            )}
                            {cita.estado === 'CANCELADA' && !cita.slotLiberado && <button onClick={() => handleLiberar(cita)} className="p-1.5 text-success-500 hover:bg-success-50 rounded-lg" title="Liberar"><Ban size={14} /></button>}
                            <button onClick={() => openDetail(cita)} className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded-lg" title="Ver"><Eye size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>

      {citas.length === 0 && (
        <EmptyState icon={<CalendarDays size={24} />} title="Sin citas para este dia" description="No hay citas registradas para la fecha seleccionada." />
      )}

      {/* Detail Modal */}
      {detailCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetailCita(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/50">
              <div>
                <h2 className="text-base font-bold text-neutral-900">{detailCita.paciente?.nombres} {detailCita.paciente?.apellidos}</h2>
                <p className="text-xs text-neutral-500">{detailCita.motivo} · {detailCita.horaInicio} - {detailCita.horaFin}</p>
              </div>
              <button onClick={() => setDetailCita(null)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-600"><X size={18} /></button>
            </div>

            <div className="flex border-b border-neutral-100">
              {(['estado', 'hce'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors', activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700')}>
                  {tab === 'estado' ? 'Estado' : 'Historia Clinica'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeTab === 'estado' ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-neutral-400">Especialista</p><p className="font-medium text-neutral-800">{detailCita.especialista?.nombres} {detailCita.especialista?.apellidos}</p></div>
                    <div><p className="text-xs text-neutral-400">Especialidad</p><p className="font-medium text-neutral-800">{detailCita.especialidad}</p></div>
                    <div><p className="text-xs text-neutral-400">Lugar</p><p className="font-medium text-neutral-800">{detailCita.lugar || '-'}</p></div>
                    <div><p className="text-xs text-neutral-400">Telefono</p><p className="font-medium text-neutral-800">{detailCita.paciente?.telefono || '-'}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detailCita.estado !== 'CANCELADA' && detailCita.estado !== 'ATENDIDA' && (
                      <>
                        <Button variant="outline" size="sm" icon={<RotateCcw size={14} />} onClick={() => handleReagendar(detailCita)}>Reagendar</Button>
                        <Button variant="danger" size="sm" icon={<XCircle size={14} />} onClick={() => handleCancelar(detailCita)}>Cancelar</Button>
                        <Button variant="outline" size="sm" icon={<UserX size={14} />} onClick={() => handleNoAsistio(detailCita)}>No Asistio</Button>
                      </>
                    )}
                    {detailCita.estado === 'CANCELADA' && !detailCita.slotLiberado && (
                      <Button variant="secondary" size="sm" icon={<Ban size={14} />} onClick={() => handleLiberar(detailCita)}>Liberar horario</Button>
                    )}
                  </div>
                </>
              ) : (
                loadingHce ? (
                  <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
                ) : hceData && hceData.length > 0 ? (
                  <div className="space-y-3">
                    {hceData.map((cons: any) => (
                      <Card key={cons.id} padding="sm">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={cons.estado === 'EN_CURSO' ? 'info' : 'success'}>{cons.estado || 'Sin estado'}</Badge>
                          <span className="text-xs text-neutral-400">{new Date(cons.createdAt).toLocaleDateString('es-EC')}</span>
                        </div>
                        {cons.motivoConsulta && <p className="text-sm text-neutral-700"><strong>Motivo:</strong> {cons.motivoConsulta}</p>}
                        {cons.diagnosticos?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-neutral-500">Diagnosticos:</p>
                            {cons.diagnosticos.map((d: any) => (
                              <div key={d.id} className="flex items-center gap-2 text-xs">
                                <Badge size="sm" variant="purple">{d.tipo}</Badge>
                                <span className="font-medium">{d.codigoCIE10}</span>
                                <span className="text-neutral-500">{d.descripcion}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <Link href={`${ROUTES.admin.hce}/especialistas/${cons.especialistaId}/pacientes/${cons.pacienteId}`}
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-2">
                          Ver HCE completa <ArrowRight size={12} />
                        </Link>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<FileText size={20} />} title="Sin historia clinica" description="No se encontraron registros de HCE para este paciente." />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {reagendarTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setReagendarTarget(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-neutral-900">Reagendar Cita</h3>
            <p className="text-sm text-neutral-500">{reagendarTarget.paciente?.nombres} {reagendarTarget.paciente?.apellidos} · {reagendarTarget.horaInicio} - {reagendarTarget.horaFin}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha</label>
                <input type="date" value={reagendarFecha} onChange={(e) => setReagendarFecha(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Hora inicio</label>
                  <input type="time" value={reagendarHoraInicio} onChange={(e) => setReagendarHoraInicio(e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Hora fin</label>
                  <input type="time" value={reagendarHoraFin} onChange={(e) => setReagendarHoraFin(e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setReagendarTarget(null)}>Cancelar</Button>
              <Button onClick={submitReagendar} disabled={reagendarSaving}>
                {reagendarSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
