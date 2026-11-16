'use client';

import React, { useMemo } from 'react';
import { formatDate, todayStr } from '@/lib/utils';
import AppointmentRow from './AppointmentRow';

interface AppointmentTableProps {
  citas: any[];
  expandedRecurrente: Set<string>;
  onToggleExpand: (id: string) => void;
  onOpenDetail: (c: any) => void;
  onOpenModify: (c: any) => void;
  onOpenCancel: (c: any) => void;
  onReload: () => void;
}

function dateKey(fecha: string) {
  return typeof fecha === 'string' ? fecha.slice(0, 10) : new Date(fecha).toISOString().slice(0, 10);
}

export default function AppointmentTable({
  citas, expandedRecurrente, onToggleExpand,
  onOpenDetail, onOpenModify, onOpenCancel, onReload,
}: AppointmentTableProps) {
  const grouped = useMemo(() => {
    const today = todayStr();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const sorted = [...citas].sort((a: any, b: any) => {
      const da = dateKey(a.fecha);
      const db = dateKey(b.fecha);
      if (da === db) return (a.horaInicio || '').localeCompare(b.horaInicio || '');
      if (da === today) return -1;
      if (db === today) return 1;
      if (da === yesterdayStr) return -1;
      if (db === yesterdayStr) return 1;
      const aIsFuture = da > today;
      const bIsFuture = db > today;
      if (aIsFuture && !bIsFuture) return -1;
      if (!aIsFuture && bIsFuture) return 1;
      if (aIsFuture) return da.localeCompare(db);
      return db.localeCompare(da);
    });

    const groups: { label: string; fecha: string; items: any[] }[] = [];
    for (const cita of sorted) {
      const f = dateKey(cita.fecha);
      const last = groups[groups.length - 1];
      if (last && last.fecha === f) {
        last.items.push(cita);
      } else {
        const isToday = f === today;
        const isYesterday = f === yesterdayStr;
        const label = isToday ? `Hoy — ${formatDate(cita.fecha)}` : isYesterday ? `Ayer — ${formatDate(cita.fecha)}` : formatDate(cita.fecha);
        groups.push({ label, fecha: f, items: [cita] });
      }
    }
    return groups;
  }, [citas]);

  return (
    <div className="space-y-4">
      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">No se encontraron citas</div>
      ) : (
        grouped.map((group) => (
          <div key={group.fecha} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-primary-50 border-b border-primary-100 px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-sm font-semibold text-primary-800">{group.label}</span>
              <span className="text-xs text-primary-500 ml-auto">{group.items.length} cita{group.items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed min-w-[900px]">
                <colgroup>
                  <col className="w-[25%]" />
                  <col className="w-[19%]" />
                  <col className="w-[11%]" />
                  <col className="w-[16%]" />
                  <col className="w-[11%]" />
                  <col style={{ width: '160px' }} />
                </colgroup>
                <thead>
                  <tr className="text-left text-neutral-400 border-b bg-neutral-50/50">
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">Paciente</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">Especialista</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">Hora</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">Especialidad</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">Estado</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((c: any) => (
                    <AppointmentRow
                      key={c.id}
                      cita={c}
                      isExpanded={expandedRecurrente.has(c.id)}
                      onToggleExpand={() => onToggleExpand(c.id)}
                      onOpenDetail={onOpenDetail}
                      onOpenModify={onOpenModify}
                      onOpenCancel={onOpenCancel}
                      onReload={onReload}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
