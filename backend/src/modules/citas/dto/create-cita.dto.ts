import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  Matches,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class RecurrenceDetailDto {
  @IsDateString()
  fecha: string;

  @IsString()
  @Matches(HHMM, { message: 'horaInicio debe tener formato HH:MM' })
  horaInicio: string;

  @IsString()
  @Matches(HHMM, { message: 'horaFin debe tener formato HH:MM' })
  horaFin: string;
}

export class CreateCitaDto {
  @IsString()
  especialistaId: string;

  @IsString()
  pacienteId: string;

  @IsDateString()
  fecha: string;

  @IsString()
  @Matches(HHMM, { message: 'horaInicio debe tener formato HH:MM' })
  horaInicio: string;

  @IsString()
  @Matches(HHMM, { message: 'horaFin debe tener formato HH:MM' })
  horaFin: string;

  @IsInt()
  @Min(5)
  duracionMinutos: number;

  @IsString()
  especialidad: string;

  @IsString()
  lugar: string;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  protocoloId?: string;

  @IsOptional()
  @IsBoolean()
  notificarWhatsapp?: boolean;

  @IsOptional()
  @IsString()
  atendidaPorId?: string;

  @IsOptional()
  @IsString()
  atendidoPorNombre?: string;

  @IsOptional()
  @IsString()
  atendidoPorCedula?: string;

  @IsOptional()
  @IsString()
  notaAdmin?: string;

  @IsOptional()
  @IsBoolean()
  esRecurrente?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  recurrenciaDiaSemana?: number;

  @IsOptional()
  @IsDateString()
  recurrenciaFechaFin?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  recurrenciaDiasSemana?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  recurrenciaCantidad?: number;

  @IsOptional()
  recurrenciaHorarios?: Record<string, { horaInicio: string; horaFin: string }>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecurrenceDetailDto)
  recurrenciaDetalle?: RecurrenceDetailDto[];
}
