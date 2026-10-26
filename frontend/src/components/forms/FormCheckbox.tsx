'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FormCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: string;
  error?: string;
  helpText?: string;
  wrapperClassName?: string;
  labelClassName?: string;
}

/**
 * Componente de checkbox reutilizable con etiqueta y manejo de errores.
 *
 * @example
 * <FormCheckbox
 *   label="Acepto los términos y condiciones"
 *   error={errors.accepted}
 *   required
 * />
 */
export const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, helpText, wrapperClassName, labelClassName, ...props }, ref) => {
    return (
      <div className={cn('relative', wrapperClassName)}>
        <div className="flex items-start gap-2">
          <input
            ref={ref}
            type="checkbox"
            className={cn(
              'mt-1 w-4 h-4 border border-gray-300 rounded bg-white text-primary-600',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
              'transition-all duration-200',
            )}
            {...props}
          />
          <label
            htmlFor={props.id}
            className={cn(
              'text-sm font-medium text-gray-700 cursor-pointer transition-colors duration-200',
              error ? 'text-red-700' : 'text-gray-700',
              labelClassName,
            )}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-1 text-xs text-red-600 ml-6 animate-fadeIn">
            {error}
          </p>
        )}

        {helpText && !error && <p className="mt-1 text-xs text-gray-400 ml-6">{helpText}</p>}
      </div>
    );
  },
);

FormCheckbox.displayName = 'FormCheckbox';
