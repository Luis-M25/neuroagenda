import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReportPaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function ReportPagination({
  page,
  limit,
  total,
  onPageChange,
  disabled = false,
}: ReportPaginationProps) {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-neutral-500">
        Mostrando {from}-{to} de {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Página anterior"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="rounded-lg border border-neutral-200 p-2 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-neutral-600">
          Pág. {page} de {totalPages}
        </span>
        <button
          type="button"
          aria-label="Página siguiente"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          className="rounded-lg border border-neutral-200 p-2 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
