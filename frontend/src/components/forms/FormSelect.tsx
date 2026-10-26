'use client';

import React from 'react';
import { FormField } from '@/components/shared/FormField';

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  isValid?: boolean;
  wrapperClassName?: string;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

/**
 * Componente de select reutilizable con etiqueta y manejo de errores.
 *
 * @example
 * <FormSelect
 *   label="Estado"
 *   options={[
 *     { value: 'PENDIENTE', label: 'Pendiente' },
 *     { value: 'CONFIRMADA', label: 'Confirmada' },
 *   ]}
 *   error={errors.estado}
 *   touched={touched.estado}
 * />
 */
export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({
    label,
    error,
    touched,
    required,
    helpText,
    isValid,
    wrapperClassName,
    options,
    placeholder,
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
        <select
          ref={ref}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200"
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>
    );
  },
);

FormSelect.displayName = 'FormSelect';
