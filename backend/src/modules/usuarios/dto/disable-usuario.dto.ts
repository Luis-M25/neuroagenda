import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisableUsuarioDto {
  @ApiProperty({ description: 'Deshabilitar (true) o habilitar (false)' })
  @IsBoolean()
  disable: boolean;
}
