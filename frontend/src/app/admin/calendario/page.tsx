'use client';

import dynamic from 'next/dynamic';

const WeeklyCalendar = dynamic(
  () => import('@/components/calendario/WeeklyCalendar'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    ),
  },
);

export default function CalendarioPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WeeklyCalendar />
    </div>
  );
}
