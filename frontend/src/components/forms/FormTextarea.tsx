'use client';

import React from 'react';
import { FormField } from '@/components/shared/FormField';

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  isValid?: boolean;
  wrapperClassName?: string;
  rows?: number;
}

/**
 * Componente de textarea reutilizable con etiqueta y manejo de errores.
 *
 * @example
 * <FormTextarea
 *   label="Motivo de consulta"
 *   placeholder="Describe brevemente..."
 *   rows={4}
 *   error={errors.motivo}
 *   touched={touched.motivo}
 * />
 */
export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({
    label,
    error,
    touched,
    required,
    helpText,
    isValid,
    wrapperClassName,
    rows = 3,
    ...props
  },
  ref,
  ) => {
    return (
      <FormField
        label={label}
        error={error}
        touched={touched}
        required={required}
        helpText={helpText}
        isValid={isValid}
        className={wrapperClassName}
      >
        <textarea
          ref={ref}
          rows={rows}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 resize-none"
          {...props}
        />
      </FormField>
    );
  },
);

FormTextarea.displayName = 'FormTextarea';
