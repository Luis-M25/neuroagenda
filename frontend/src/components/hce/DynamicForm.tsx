'use client';

import { useState, useCallback } from 'react';
import VoiceInput from './VoiceInput';
import TemplateSelector from './TemplateSelector';
import SearchField from './fields/SearchField';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'search' | 'datetime' | 'date' | 'file';
  required?: boolean;
  options?: string[];
  default?: string;
  has_voice?: boolean;
  has_templates?: boolean;
  accepted?: string[];
  placeholder?: string;
}

interface FormConfig {
  fields: FieldConfig[];
}

interface DynamicFormProps {
  config: FormConfig;
  formName: string;
  especialidad: string;
  initialData?: Record<string, any>;
  onChange?: (data: Record<string, any>) => void;
  readOnly?: boolean;
}

function getDefaultValue(field: FieldConfig): any {
  if (field.default === 'current') {
    return new Date().toISOString().slice(0, 16);
  }
  if (field.default) return field.default;
  if (field.type === 'radio') return field.options?.[0] || '';
  if (field.type === 'select') return field.options?.[0] || '';
  return '';
}

export default function DynamicForm({
  config,
  formName,
  especialidad,
  initialData = {},
  onChange,
  readOnly = false,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    for (const field of config.fields) {
      defaults[field.name] = initialData[field.name] ?? getDefaultValue(field);
    }
    return defaults;
  });

  const updateField = useCallback(
    (name: string, value: any) => {
      const newData = { ...formData, [name]: value };
      setFormData(newData);
      onChange?.(newData);
    },
    [formData, onChange],
  );

  if (!config || !config.fields) {
    return <p className="text-sm text-gray-400">Formulario no configurado</p>;
  }

  return (
    <div className="space-y-4">
      {config.fields.map((field) => {
        const fieldId = `${formName}_${field.name}`;
        const value = formData[field.name];

        const Label = () => (
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        );

        if (field.type === 'textarea') {
          return (
            <div key={field.name}>
              <Label />
              <div className="flex items-center gap-1 mb-1">
                {field.has_templates && (
                  <TemplateSelector
                    especialidad={especialidad}
                    formName={formName}
                    fieldName={field.name}
                    onSelect={(content) => updateField(field.name, content)}
                  />
                )}
              </div>
              {field.has_voice ? (
                <VoiceInput
                  value={value || ''}
                  onResult={(text) => updateField(field.name, text)}
                  placeholder={field.placeholder || field.label}
                />
              ) : (
                <textarea
                  id={fieldId}
                  value={value || ''}
                  onChange={(e) => updateField(field.name, e.target.value)}
                  required={field.required}
                  readOnly={readOnly}
                  placeholder={field.placeholder || field.label}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y min-h-[80px] text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              )}
            </div>
          );
        }

        if (field.type === 'select') {
          return (
            <div key={field.name}>
              <Label />
              <select
                id={fieldId}
                value={value || ''}
                onChange={(e) => updateField(field.name, e.target.value)}
                required={field.required}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Seleccionar...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === 'radio') {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="flex flex-wrap gap-3">
                {field.options?.map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name={`${formName}_${field.name}`}
                      value={opt}
                      checked={value === opt}
                      onChange={(e) => updateField(field.name, e.target.value)}
                      disabled={readOnly}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          );
        }

        if (field.type === 'datetime') {
          return (
            <div key={field.name}>
              <Label />
              <input
                id={fieldId}
                type="datetime-local"
                value={value || ''}
                onChange={(e) => updateField(field.name, e.target.value)}
                required={field.required}
                readOnly={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          );
        }

        if (field.type === 'date') {
          return (
            <div key={field.name}>
              <Label />
              <input
                id={fieldId}
                type="date"
                value={value || ''}
                onChange={(e) => updateField(field.name, e.target.value)}
                required={field.required}
                readOnly={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          );
        }

        if (field.type === 'search') {
          return (
            <SearchField
              key={field.name}
              field={field}
              value={value}
              onChange={(v: any) => updateField(field.name, v)}
              readOnly={readOnly}
            />
          );
        }

        if (field.type === 'file') {
          return (
            <div key={field.name}>
              <Label />
              <input
                id={fieldId}
                type="file"
                accept={field.accepted?.map((ext) => `.${ext}`).join(',')}
                onChange={(e) => updateField(field.name, e.target.files?.[0] || null)}
                disabled={readOnly}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {field.accepted && (
                <p className="mt-1 text-xs text-gray-400">
                  Formatos: {field.accepted.join(', ')}
                </p>
              )}
            </div>
          );
        }

        return (
          <div key={field.name}>
            <Label />
            <input
              id={fieldId}
              type="text"
              value={value || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              required={field.required}
              readOnly={readOnly}
              placeholder={field.placeholder || field.label}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        );
      })}
    </div>
  );
}
