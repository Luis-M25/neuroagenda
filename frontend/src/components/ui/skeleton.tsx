import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-neutral-200/70', className)}
      {...props}
    />
  );
}

/**
 * Skeleton que simula la estructura completa de una página dentro del DashboardLayout
 * Especialmente útil cuando el backend está iniciando o no responde de inmediato.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-100">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards / Filters Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white p-3.5 rounded-2xl border border-neutral-100 space-y-2 shadow-xs">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Table / List Skeleton */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 sm:w-48 rounded-md" />
                  <Skeleton className="h-3 w-24 sm:w-32 rounded-md" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton específico para tablas con columnas homogéneas
 */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-xs overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="p-3.5">
                  <Skeleton className="h-4 w-20 rounded-md" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="p-3.5">
                    <Skeleton className="h-4 w-full max-w-[120px] rounded-md" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
