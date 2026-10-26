'use client';

import { cn } from '@/lib/utils';

interface Props {
  actual: number;
  total: number;
}

export default function BarraProgreso({ actual, total }: Props) {
  const pct = total > 0 ? Math.round((actual / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{actual} de {total} procesadas</span>
        <span className="font-semibold text-neutral-700">{pct}%</span>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn('h-2.5 rounded-full transition-all duration-300', pct === 100 ? 'bg-green-500' : 'bg-primary-600')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
