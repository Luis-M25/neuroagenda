import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateFeriadoDto {
  @IsDateString()
  fecha: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
