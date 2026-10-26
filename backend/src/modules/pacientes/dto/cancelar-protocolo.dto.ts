import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelarProtocoloDto {
  @ApiProperty({ description: 'Especialidad del protocolo a cancelar' })
  @IsString()
  especialidad: string;

  @ApiProperty({ description: 'Motivo de la cancelación del protocolo' })
  @IsString()
  motivo: string;
}
