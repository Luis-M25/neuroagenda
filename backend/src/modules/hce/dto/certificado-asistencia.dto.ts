import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CertificadoAsistenciaDto {
  @ApiProperty({ example: 1, description: 'Número de consulta' })
  @IsInt()
  numeroConsulta: number;

  @ApiProperty({ example: 98.5, description: 'Saturación de oxígeno (%)' })
  @IsOptional()
  saturacionOxigeno?: number;

  @ApiProperty({ example: 'Afección leve, en buen estado general', description: 'Observaciones del certificado' })
  @IsOptional()
  observacionesCertificado?: string;

  @ApiProperty({ example: 'mypassword', description: 'Contraseña del especialista para firma digital' })
  password: string;

  @ApiProperty({ example: 'Paciente acudió a consulta por control rutinario', description: 'Observaciones del certificado' })
  observaciones: string;
}