import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayNotEmpty,
  ArrayMaxSize,
} from 'class-validator';

// ── Antecedentes personales / familiares ──
export class AddAntecedenteDto {
  @IsIn(['PERSONAL', 'FAMILIAR'])
  ambito: string;

  @IsString()
  categoria: string;

  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  parentesco?: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}

// ── Recetas médicas ──
export class RecetaItemDto {
  @IsString()
  medicamento: string;

  @IsOptional() @IsString() presentacion?: string;
  @IsOptional() @IsString() formaFarmaceutica?: string;
  @IsOptional() @IsString() concentracion?: string;
  @IsOptional() @IsString() dosis?: string;
  @IsOptional() @IsString() via?: string;
  @IsOptional() @IsString() frecuencia?: string;
  @IsOptional() @IsString() duracion?: string;
  @IsOptional() @IsString() cantidad?: string;
  @IsOptional() @IsString() cantidadLetras?: string;
  @IsOptional() @IsString() indicaciones?: string;
}

export class GenerarRecetaDto {
  @IsString()
  password: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => RecetaItemDto)
  items: RecetaItemDto[];

  @IsOptional()
  @IsString()
  indicaciones?: string;

  @IsOptional()
  @IsString()
  estadoEnfermedad?: string;

  @IsOptional()
  @IsString()
  diagnostico?: string;

  @IsOptional()
  @IsString()
  signosAlarma?: string;

  @IsOptional()
  @IsString()
  recomendacionesNoFarmacologicas?: string;

  @IsOptional()
  @IsString()
  peso?: string;

  @IsOptional()
  @IsString()
  talla?: string;

  @IsOptional()
  @IsString()
  alergias?: string;

  @IsOptional()
  @IsInt()
  validezDias?: number;
}

// ── Certificados médicos (asistencia / reposo) ──
export class GenerarCertificadoDto {
  @IsIn(['ASISTENCIA', 'REPOSO'])
  tipo: string;

  @IsString()
  password: string;

  @IsOptional() @IsString() motivo?: string;
  @IsOptional() @IsString() observaciones?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  diasReposo?: number;

  @IsOptional() @IsDateString() fechaInicio?: string;
  @IsOptional() @IsDateString() fechaFin?: string;
}

// ── Alta por especialidad ──
export class DarAltaDto {
  @IsString()
  motivo: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;
}

// ── Derivaciones ──
export class CrearDerivacionDto {
  @IsString()
  pacienteId: string;

  @IsOptional()
  @IsString()
  consultaId?: string;

  @IsString()
  motivo: string;

  @IsIn(['BAJA', 'MEDIA', 'ALTA'])
  prioridad: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  especialistaIds: string[];
}

export class ProgramarDerivacionDto {
  @IsString()
  citaId: string;
}

export class PrivacidadDiagnosticosDto {
  @IsBoolean()
  compartirDiagnosticos: boolean;
}
