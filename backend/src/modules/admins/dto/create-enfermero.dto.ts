import { IsString, IsEmail } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password-strength.validator';

export class CreateEnfermeroDto {
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
  numeroIdentificacion: string;
}
