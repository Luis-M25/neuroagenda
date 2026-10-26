import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateConsultorioDto {
  @IsString()
  nombre: string;

  @IsString()
  sede: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
