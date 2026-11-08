import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  wrapperClassName?: string;
}

export function Input({
  label,
  error,
  icon,
  trailing,
  className,
  wrapperClassName,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700">
          {label}
          {props.required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-all duration-150',
            'placeholder:text-neutral-400',
            icon && 'pl-10',
            trailing && (error ? 'pr-16' : 'pr-10'),
            !trailing && error && 'pr-10',
            error
              ? 'border-danger-300 focus:ring-2 focus:ring-danger-200 focus:border-danger-400'
              : 'border-neutral-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-400',
            props.disabled && 'bg-neutral-50 text-neutral-500 cursor-not-allowed',
            className,
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {trailing}
          </div>
        )}
        {error && (
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-danger-500 pointer-events-none',
              trailing ? 'right-10' : 'right-3',
            )}
          >
            <AlertCircle size={16} />
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger-500 flex items-center gap-1">{error}</p>
      )}
    </div>
  );
}
