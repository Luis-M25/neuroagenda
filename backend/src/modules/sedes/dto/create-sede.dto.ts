import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSedeDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
