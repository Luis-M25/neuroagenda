import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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

@Injectable()
export class UbicacionService {
  private provinciasData: Provincia[];

  constructor() {
    const filePath = path.resolve(process.cwd(), '..', 'frontend', 'src', 'lib', 'ubicaciones.json');
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      this.provinciasData = JSON.parse(raw);
    } catch {
      this.provinciasData = [];
    }
  }

  getProvincias() {
    return this.provinciasData.map((p) => ({ codigo: p.codigo, nombre: p.nombre }));
  }

  getCantones(provinciaCodigo: string) {
    const provincia = this.provinciasData.find((p) => p.codigo === provinciaCodigo);
    if (!provincia) return [];
    return provincia.cantones.map((c) => ({ codigo: c.codigo, nombre: c.nombre }));
  }

  getParroquias(provinciaCodigo: string, cantonCodigo: string) {
    const provincia = this.provinciasData.find((p) => p.codigo === provinciaCodigo);
    if (!provincia) return [];
    const canton = provincia.cantones.find((c) => c.codigo === cantonCodigo);
    if (!canton) return [];
    return canton.parroquias.map((p) => ({ codigo: p.codigo, nombre: p.nombre }));
  }
}
