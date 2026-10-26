import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-100',
        paddings[padding],
        hover && 'hover:border-neutral-200 hover:shadow-sm transition-all duration-150',
        className,
      )}
    >
      {children}
    </div>
  );
}
