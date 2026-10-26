import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FirmarConsultaDto {
  @ApiProperty({ description: 'Contraseña del especialista para verificar identidad' })
  @IsString()
  password: string;
}
