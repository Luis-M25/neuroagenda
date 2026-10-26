'use client';

import React from 'react';
import { FormField } from '@/components/shared/FormField';

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  isValid?: boolean;
  wrapperClassName?: string;
}

/**
 * Componente de input reutilizable con etiqueta y manejo de errores.
 * Soporta todos los tipos de input (text, email, password, number, etc).
 *
 * @example
 * <FormInput
 *   label="Email"
 *   type="email"
 *   placeholder="tu@email.com"
 *   error={errors.email}
 *   touched={touched.email}
 *   required
 * />
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched, required, helpText, isValid, wrapperClassName, ...props }, ref) => {
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
        <input
          ref={ref}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200"
          {...props}
        />
      </FormField>
    );
  },
);

FormInput.displayName = 'FormInput';
