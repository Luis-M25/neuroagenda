import { useState, useMemo, useCallback } from 'react';

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useCalendarNavigation() {
  const [weekOffset, setWeekOffset] = useState(0);

  const dates = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const startStr = useMemo(() => fmtDate(dates[0]), [dates]);
  const endStr = useMemo(() => {
    const e = new Date(dates[4]);
    e.setDate(e.getDate() + 1);
    return fmtDate(e);
  }, [dates]);

  const todayStr = fmtDate(new Date());

  const weekLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${dates[0].toLocaleDateString('es-EC', opts)} – ${dates[4].toLocaleDateString('es-EC', { ...opts, year: 'numeric' })}`;
  }, [dates]);

  const goToday = useCallback(() => setWeekOffset(0), []);
  const prevWeek = useCallback(() => setWeekOffset((o) => o - 1), []);
  const nextWeek = useCallback(() => setWeekOffset((o) => o + 1), []);

  return { weekOffset, dates, startStr, endStr, todayStr, weekLabel, goToday, prevWeek, nextWeek };
}
