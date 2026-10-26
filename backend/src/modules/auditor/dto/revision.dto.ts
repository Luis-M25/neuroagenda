import { IsString, IsOptional } from 'class-validator';

export class RevisarHcDto {
  @IsString()
  estado: 'REVISADO' | 'REVISADO_CON_OBSERVACIONES';

  @IsOptional()
  @IsString()
  observacion?: string;
}
