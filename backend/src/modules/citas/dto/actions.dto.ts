import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class UpdateCitaEstadoDto {
  @IsString()
  estado: string;

  @IsOptional()
  @IsString()
  notaEspecialista?: string;

  @IsOptional()
  @IsString()
  motivoCancelacion?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'PACIENTE'])
  canceladaPor?: string;
}

export class ReagendarCitaDto {
  @IsDateString()
  fecha: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsOptional()
  @IsString()
  notasModificacion?: string;
}

export class ReagendarMasivoDto {
  citas: {
    id: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
  }[];

  @IsOptional()
  @IsString()
  notasModificacion?: string;
}
