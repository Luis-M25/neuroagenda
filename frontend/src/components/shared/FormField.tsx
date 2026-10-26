'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import { SearchableSelect } from './SearchableSelect';

interface FormFieldBase {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
  helpText?: string;
  isValid?: boolean;
}

export function FormField({
  label,
  error,
  touched,
  required,
  className,
  labelClassName,
  children,
  helpText,
  isValid,
}: FormFieldBase) {
  const id = useId();
  const showError = touched && error;
  const showSuccess = touched && isValid && !error;

  return (
    <div className={cn('relative', className)}>
      <label
        htmlFor={id}
        className={cn(
          'block text-sm font-medium mb-1 transition-colors duration-200',
          showError ? 'text-red-700' : 'text-gray-700',
          labelClassName,
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<any>, {
              id,
              'aria-invalid': showError ? 'true' : undefined,
              'aria-describedby': showError ? `${id}-error` : undefined,
            })
          : children}

        {showError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {showSuccess && !showError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {showError && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-xs text-red-600 flex items-center gap-1 animate-fadeIn"
        >
          {error}
        </p>
      )}

      {helpText && !showError && (
        <p className="mt-1 text-xs text-gray-400">{helpText}</p>
      )}
    </div>
  );
}

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  isValid?: boolean;
  wrapperClassName?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched, required, helpText, isValid, wrapperClassName, className, ...props }, ref) => {
    const showError = touched && error;
    const showSuccess = touched && isValid && !error;

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
          {...props}
          className={cn(
            'w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 text-sm',
            'focus:ring-2 focus:border-transparent',
            showError
              ? 'border-red-400 bg-red-50 focus:ring-red-400 pr-10'
              : showSuccess
                ? 'border-green-400 bg-green-50/30 focus:ring-green-400 pr-10'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
            props.disabled && 'bg-gray-100 cursor-not-allowed',
            className,
          )}
        />
      </FormField>
    );
  },
);
FormInput.displayName = 'FormInput';

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  isValid?: boolean;
  wrapperClassName?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, touched, required, helpText, isValid, wrapperClassName, options, placeholder, value, onChange, disabled, ...props }, ref) => {
    const showError = touched && error;
    const showSuccess = touched && isValid && !error;

    const allOptions = placeholder
      ? [{ value: '', label: placeholder }, ...options]
      : options;

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
        <select ref={ref} {...props} value={value} onChange={(e) => onChange?.(e.target.value)} className="sr-only" aria-hidden="true" tabIndex={-1}>
          {allOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <SearchableSelect
          value={value || ''}
          onChange={onChange || (() => {})}
          options={allOptions}
          placeholder={placeholder || 'Seleccionar...'}
          disabled={disabled}
          className={cn(
            showError && 'ring-2 ring-red-400 ring-offset-1 rounded-xl',
            showSuccess && 'ring-2 ring-green-400 ring-offset-1 rounded-xl',
          )}
        />
      </FormField>
    );
  },
);
FormSelect.displayName = 'FormSelect';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  isValid?: boolean;
  wrapperClassName?: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, touched, required, helpText, isValid, wrapperClassName, className, ...props }, ref) => {
    const showError = touched && error;
    const showSuccess = touched && isValid && !error;

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
          {...props}
          className={cn(
            'w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 text-sm resize-none',
            'focus:ring-2 focus:border-transparent',
            showError
              ? 'border-red-400 bg-red-50 focus:ring-red-400'
              : showSuccess
                ? 'border-green-400 bg-green-50/30 focus:ring-green-400'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
            props.disabled && 'bg-gray-100 cursor-not-allowed',
            className,
          )}
        />
      </FormField>
    );
  },
);
FormTextarea.displayName = 'FormTextarea';

export function PasswordStrengthBar({ score, label }: { score: number; label: string }) {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500'];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i < score ? colors[score - 1] || 'bg-primary-500' : 'bg-gray-200',
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          'text-xs mt-1 font-medium',
          score <= 1 ? 'text-red-600' : score <= 2 ? 'text-orange-600' : score <= 3 ? 'text-yellow-600' : 'text-green-600',
        )}
      >
        {label}
      </p>
    </div>
  );
}
