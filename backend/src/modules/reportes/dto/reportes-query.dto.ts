import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class PaginacionReporteDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export class AsistenciasQueryDto extends PaginacionReporteDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pacienteId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  estado?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'fechaInicio debe tener formato YYYY-MM-DD' })
  fechaInicio?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'fechaFin debe tener formato YYYY-MM-DD' })
  fechaFin?: string;
}

export class RegistroHcQueryDto extends PaginacionReporteDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pacienteId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  especialidad?: string;

  @IsOptional()
  @IsIn(['FIRMADA', 'PENDIENTE'])
  estadoFirma?: 'FIRMADA' | 'PENDIENTE';

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'fechaInicio debe tener formato YYYY-MM-DD' })
  fechaInicio?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'fechaFin debe tener formato YYYY-MM-DD' })
  fechaFin?: string;
}

export class BuscarPacientesHcQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit = 15;
}

export class ExportarReporteQueryDto {
  @IsIn([
    'no-asistidos',
    'citas-por-especialista',
    'dashboard',
    'asistencias-por-paciente',
    'registro-hc',
  ])
  tipo!:
    | 'no-asistidos'
    | 'citas-por-especialista'
    | 'dashboard'
    | 'asistencias-por-paciente'
    | 'registro-hc';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  especialidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pacienteId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  estado?: string;

  @IsOptional()
  @IsIn(['FIRMADA', 'PENDIENTE'])
  estadoFirma?: 'FIRMADA' | 'PENDIENTE';

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'fechaInicio debe tener formato YYYY-MM-DD' })
  fechaInicio?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'fechaFin debe tener formato YYYY-MM-DD' })
  fechaFin?: string;
}
