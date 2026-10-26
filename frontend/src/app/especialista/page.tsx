'use client';

import { useState } from 'react';
import { ROUTES } from '@/lib/routes';
import { getEstadoCitaColor, cn, todayStr, addDaysStr, isValidDate, formatDateEs } from '@/lib/utils';
import { useEspecialistaDashboard } from '@/hooks/useEspecialistaDashboard';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

export default function EspecialistaDashboard() {
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [dateText, setDateText] = useState<string>(todayStr());

  // Hook que maneja toda la lógica de citas y procesamiento de datos
  const { data, loading } = useEspecialistaDashboard(selectedDate);

  const handleDateInputChange = (value: string) => {
    setSelectedDate(value);
    setDateText(value);
  };

  const handleDateTextChange = (value: string) => {
    setDateText(value);
    if (isValidDate(value)) {
      setSelectedDate(value);
    }
  };

  const navigateDay = (dias: number) => {
    const nueva = addDaysStr(selectedDate, dias);
    setSelectedDate(nueva);
    setDateText(nueva);
  };

  const goToday = () => {
    const hoy = todayStr();
    setSelectedDate(hoy);
    setDateText(hoy);
  };

  const mainCards = [
    {
      label: 'Citas del día',
      value: data?.total ?? 0,
      icon: CalendarDays,
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      label: 'Atendidas',
      value: data?.atendidas ?? 0,
      icon: CheckCircle2,
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
    },
    {
      label: 'Pendientes',
      value: data?.pendientes ?? 0,
      icon: Clock,
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
    },
    {
      label: 'No asistieron',
      value: data?.noAsistio ?? 0,
      icon: XCircle,
      iconBg: 'bg-danger-100',
      iconColor: 'text-danger-600',
    },
  ];

  const estadoCards = [
    { label: 'Confirmadas', valueKey: 'confirmadas' as const, color: 'text-blue-600', estado: 'CONFIRMADA' },
    { label: 'En espera', valueKey: 'enEspera' as const, color: 'text-purple-600', estado: 'EN_ESPERA' },
    { label: 'En atención', valueKey: 'enAtencion' as const, color: 'text-green-600', estado: 'EN_ATENCION' },
    { label: 'Canceladas', valueKey: 'canceladas' as const, color: 'text-red-600', estado: 'CANCELADA' },
  ];

  const totalCitas =
    (data?.anteriores?.length ?? 0) +
    (data?.enCurso?.length ?? 0) +
    (data?.proximas?.length ?? 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">Mis Citas del Día</h1>
          <p className="text-sm text-neutral-500 mt-1">Resumen de mis citas programadas</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDay(-1)}
              className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors"
              aria-label="Día anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg">
              <CalendarDays size={16} className="text-primary-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateInputChange(e.target.value)}
                className="text-sm font-medium text-neutral-700 outline-none bg-transparent"
              />
            </div>

            <input
              type="text"
              value={dateText}
              onChange={(e) => handleDateTextChange(e.target.value)}
              placeholder="yyyy-mm-dd"
              className={cn(
                'w-32 px-3 py-2 text-sm font-medium border rounded-lg outline-none transition-colors',
                isValidDate(dateText)
                  ? 'border-neutral-200 text-neutral-700 bg-white'
                  : 'border-danger-300 text-danger-600 bg-danger-50',
              )}
            />

            <button
              onClick={() => navigateDay(1)}
              className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors"
              aria-label="Día siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={goToday}
            className="px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      <div className="text-sm font-medium text-neutral-700">
        {formatDateEs(selectedDate)}
        {data?.esHoy && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-600">
            Hoy
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {mainCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 sm:p-5 hover:shadow-md hover:border-neutral-200 transition-all duration-200 h-full">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon size={18} className={card.iconColor} />
                </div>
                <ArrowRight size={14} className="text-neutral-300" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900">{card.value}</p>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">{card.label}</p>
            </div>
          );
          return (
            <Link key={card.label} href={ROUTES.especialista.misCitas} className="block">
              {content}
            </Link>
          );
        })}
      </div>

      {/* Estado Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {estadoCards.map((card) => (
          <Link
            key={card.label}
            href={`${ROUTES.especialista.misCitas}?estado=${card.estado}`}
            className="block"
          >
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 hover:shadow-md hover:border-neutral-200 transition-all duration-200 h-full">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-2xl font-bold ${card.color}`}>{(data as any)?.[card.valueKey] ?? 0}</span>
                <ArrowRight size={14} className="text-neutral-300" />
              </div>
              <p className="text-xs sm:text-sm text-neutral-500">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Próxima Cita */}
      {data?.proxima && data.esHoy && (
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 border-l-4 border-primary-500 hover:shadow-md transition-shadow duration-200">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Próxima cita</p>
          <p className="text-lg font-semibold text-neutral-900">
            {data.proxima.paciente.nombres} {data.proxima.paciente.apellidos}
          </p>
          <div className="flex items-center gap-3 mt-2 text-sm text-neutral-600">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-neutral-400" />
              {data.proxima.horaInicio}
            </div>
            <span className="text-neutral-300">|</span>
            <span>{data.proxima.lugar}</span>
          </div>
          {data.proxima.motivo && <p className="text-sm text-neutral-500 mt-1.5">{data.proxima.motivo}</p>}
        </div>
      )}

      {/* Citas del día agrupadas por horario */}
      {totalCitas === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-50 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-neutral-300" />
          </div>
          <p className="text-neutral-600 font-medium">No tienes citas programadas para este día</p>
          <p className="text-sm text-neutral-500 mt-1">Selecciona otra fecha para ver tus citas</p>
        </div>
      ) : (
        <div className="space-y-4">
          <CitasSection
            title={data?.esHoy ? 'Citas anteriores' : 'Mis citas'}
            icon={Clock}
            citas={data?.anteriores || []}
          />

          {data?.esHoy && (
            <CitasSection
              title="Citas en curso"
              icon={Activity}
              citas={data?.enCurso || []}
              highlight
            />
          )}

          <CitasSection
            title={data?.esHoy ? 'Próximas citas' : 'Mis citas'}
            icon={CalendarDays}
            citas={data?.proximas || []}
          />
        </div>
      )}
    </div>
  );
}

function CitasSection({
  title,
  icon: Icon,
  citas,
  highlight,
}: {
  title: string;
  icon: React.ElementType;
  citas: any[];
  highlight?: boolean;
}) {
  if (!citas || citas.length === 0) return null;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border shadow-sm overflow-hidden',
        highlight ? 'border-primary-200 shadow-md' : 'border-neutral-100',
      )}
    >
      <div
        className={cn(
          'px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center gap-2',
          highlight ? 'bg-primary-50 border-primary-100' : 'border-neutral-100',
        )}
      >
        <Icon size={18} className={highlight ? 'text-primary-600' : 'text-neutral-500'} />
        <h2 className="text-sm sm:text-base font-semibold text-neutral-900">
          {title} <span className="text-neutral-500 font-normal">({citas.length})</span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-neutral-50">
              <th className="px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-neutral-700 text-xs uppercase tracking-wider">Hora</th>
              <th className="px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-neutral-700 text-xs uppercase tracking-wider">Paciente</th>
              <th className="px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-neutral-700 text-xs uppercase tracking-wider">Estado</th>
              <th className="px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-neutral-700 text-xs uppercase tracking-wider">Motivo</th>
              <th className="px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-neutral-700 text-xs uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((cita: any) => (
              <tr key={cita.id} className="border-t border-neutral-100 hover:bg-primary-50/50 transition-colors duration-100">
                <td className="px-4 sm:px-6 py-3 sm:py-3.5 font-semibold text-neutral-800">{cita.horaInicio}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-neutral-800">
                  {cita.paciente?.nombres} {cita.paciente?.apellidos}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getEstadoCitaColor(cita.estado)}`}>
                    {cita.estado}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-neutral-500">{cita.motivo || '-'}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-3.5">
                  <Link
                    href={`${ROUTES.especialista.misCitas}?id=${cita.id}`}
                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Eye size={14} />
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
