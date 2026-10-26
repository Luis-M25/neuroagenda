import ubicacionesData from './ubicaciones.json';

interface Parroquia {
  nombre: string;
  codigo: string;
}

interface Canton {
  nombre: string;
  codigo: string;
  parroquias: Parroquia[];
}

interface Provincia {
  nombre: string;
  codigo: string;
  cantones: Canton[];
}

const provincias = ubicacionesData as Provincia[];

export function getProvincias(): { codigo: string; nombre: string }[] {
  return provincias.map((p) => ({ codigo: p.codigo, nombre: p.nombre }));
}

export function getProvinciaByCodigo(codigo: string): Provincia | undefined {
  return provincias.find((p) => p.codigo === codigo);
}

export function getProvinciaByNombre(nombre: string): Provincia | undefined {
  return provincias.find((p) => p.nombre.toUpperCase() === nombre.toUpperCase().trim());
}

export function getCantones(provinciaCodigo: string): { codigo: string; nombre: string }[] {
  const provincia = provincias.find((p) => p.codigo === provinciaCodigo);
  if (!provincia) return [];
  return provincia.cantones.map((c) => ({ codigo: c.codigo, nombre: c.nombre }));
}

export function getCantonByNombre(provinciaCodigo: string, nombre: string): Canton | undefined {
  const provincia = provincias.find((p) => p.codigo === provinciaCodigo);
  if (!provincia) return undefined;
  return provincia.cantones.find((c) => c.nombre.toUpperCase() === nombre.toUpperCase().trim());
}

export function getParroquias(provinciaCodigo: string, cantonCodigo: string): { codigo: string; nombre: string }[] {
  const provincia = provincias.find((p) => p.codigo === provinciaCodigo);
  if (!provincia) return [];
  const canton = provincia.cantones.find((c) => c.codigo === cantonCodigo);
  if (!canton) return [];
  return canton.parroquias.map((p) => ({ codigo: p.codigo, nombre: p.nombre }));
}

export function getParroquiaByNombre(
  provinciaCodigo: string,
  cantonCodigo: string,
  nombre: string,
): Parroquia | undefined {
  const provincia = provincias.find((p) => p.codigo === provinciaCodigo);
  if (!provincia) return undefined;
  const canton = provincia.cantones.find((c) => c.codigo === cantonCodigo);
  if (!canton) return undefined;
  return canton.parroquias.find((p) => p.nombre.toUpperCase() === nombre.toUpperCase().trim());
}

export function findInData(
  provinciaNombre?: string,
  cantonNombre?: string,
  parroquiaNombre?: string,
): { provincia: string; canton: string; parroquia: string } {
  let provinciaCodigo = '';
  let cantonCodigo = '';

  if (provinciaNombre) {
    const p = getProvinciaByNombre(provinciaNombre);
    if (p) provinciaCodigo = p.codigo;
  }

  if (provinciaCodigo && cantonNombre) {
    const c = getCantonByNombre(provinciaCodigo, cantonNombre);
    if (c) cantonCodigo = c.codigo;
  }

  return {
    provincia: provinciaCodigo,
    canton: cantonCodigo,
    parroquia: provinciaCodigo && cantonCodigo && parroquiaNombre
      ? getParroquiaByNombre(provinciaCodigo, cantonCodigo, parroquiaNombre)?.codigo || ''
      : '',
  };
}
