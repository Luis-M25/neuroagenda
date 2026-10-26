import { IsInt, IsString, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateHorarioDto {
  @IsString()
  especialistaId: string;

  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsInt()
  @Min(5)
  duracionMinutos: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  esFeriado?: boolean;
}

export class BatchHorariosDto {
  @IsString()
  especialistaId: string;

  horarios: {
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    duracionMinutos: number;
    observaciones?: string;
  }[];
}
