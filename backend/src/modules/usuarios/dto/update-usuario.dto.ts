import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ description: 'Email del usuario' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Rol del usuario' })
  @IsString()
  @IsOptional()
  rol?: string;

  @ApiPropertyOptional({ description: 'Estado activo del usuario' })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
