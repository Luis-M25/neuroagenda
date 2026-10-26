import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateEspecialistaEstadoDto {
  @IsString()
  estado: string;

  @IsOptional()
  @IsDateString()
  fechaInicioSuspension?: string;

  @IsOptional()
  @IsDateString()
  fechaFinSuspension?: string;
}
