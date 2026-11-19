import { hceApi } from '@/lib/api-client';

export type EtiquetasModulos = {
  ocupacionEtiquetas: string[];
  escolaridadEtiquetas: string[];
  nivelAcademico: string[];
  actividadesVidaDiaria: string[];
  actividadesInstrumentales: string[];
};

export const ETIQUETAS_DEFAULT: EtiquetasModulos = {
  ocupacionEtiquetas: ['Ama de casa', 'Docente', 'Estudiante', 'Comerciante', 'Empleado', 'Independiente', 'Jubilado', 'Otro'],
  escolaridadEtiquetas: ['Alfabetizado', 'Primaria incompleta', 'Primaria completa', 'Secundaria incompleta', 'Secundaria completa', 'Técnico', 'Superior', 'Posgrado'],
  nivelAcademico: ['Sin instrucción', 'Preescolar', 'Primaria', 'Secundaria', 'Técnico', 'Superior', 'Posgrado'],
  actividadesVidaDiaria: ['Baño', 'Vestirse', 'Alimentación', 'Movilidad', 'Higiene personal', 'Continencia'],
  actividadesInstrumentales: ['Compras', 'Cocina', 'Manejo de dinero', 'Transporte', 'Medicamentos', 'Limpieza', 'Teléfono'],
};

async function cargarEtiquetasDe(
  especialidad: string | undefined,
  forms: { ocupacion: string; actividad: string },
): Promise<EtiquetasModulos> {
  if (!especialidad) return ETIQUETAS_DEFAULT;
  try {
    const cfg: any = await hceApi.getFormsConfig(especialidad);
    const opciones = (form: string, field: string): string[] | null => {
      const f = cfg?.[form]?.fields?.find((x: any) => x.name === field);
      return Array.isArray(f?.options) && f.options.length ? f.options.map(String) : null;
    };
    return {
      ocupacionEtiquetas: opciones(forms.ocupacion, 'ocupacion_etiquetas') ?? ETIQUETAS_DEFAULT.ocupacionEtiquetas,
      escolaridadEtiquetas: opciones(forms.ocupacion, 'escolaridad_etiquetas') ?? ETIQUETAS_DEFAULT.escolaridadEtiquetas,
      nivelAcademico: opciones(forms.ocupacion, 'nivel_academico') ?? ETIQUETAS_DEFAULT.nivelAcademico,
      actividadesVidaDiaria: opciones(forms.actividad, 'actividades_vida_diaria') ?? ETIQUETAS_DEFAULT.actividadesVidaDiaria,
      actividadesInstrumentales: opciones(forms.actividad, 'actividades_instrumentales') ?? ETIQUETAS_DEFAULT.actividadesInstrumentales,
    };
  } catch {
    return ETIQUETAS_DEFAULT;
  }
}

export function cargarEtiquetas(especialidad?: string): Promise<EtiquetasModulos> {
  return cargarEtiquetasDe(especialidad, {
    ocupacion: 'ocupacion_escolaridad',
    actividad: 'actividad_funcional',
  });
}

export function cargarEtiquetasNino(especialidad?: string): Promise<EtiquetasModulos> {
  return cargarEtiquetasDe(especialidad, {
    ocupacion: 'ocupacion_escolaridad_nino',
    actividad: 'actividad_funcional_nino',
  });
}
