import { IsString, IsEmail, IsOptional } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password-strength.validator';

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsString()
  nombres: string;

  @IsString()
  apellidos: string;

  @IsString()
  tipoIdentificacion: string;

  @IsString()
  numeroIdentificacion: string;

  @IsString()
  telefono: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;
}
