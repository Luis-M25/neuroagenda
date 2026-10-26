import { IsString, IsEmail, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password-strength.validator';

export class CreateEspecialistaDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsString()
  primerNombre: string;

  @IsOptional()
  @IsString()
  segundoNombre?: string;

  @IsString()
  primerApellido: string;

  @IsOptional()
  @IsString()
  segundoApellido?: string;

  @IsString()
  nombres: string;

  @IsString()
  apellidos: string;

  @IsString()
  tipoIdentificacion: string;

  @IsString()
  numeroIdentificacion: string;

  @IsString()
  genero: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  estadoCivil?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsString()
  codigoMsp: string;

  @IsString()
  especialidad: string;

  @IsOptional()
  @IsString()
  subEspecialidad?: string;

  @IsString()
  tituloProfesional: string;

  @IsEmail()
  emailInstitucional: string;

  @IsOptional()
  @IsEmail()
  emailSecundario?: string;

  @IsOptional()
  @IsEmail()
  emailPersonal?: string;

  @IsString()
  telefono: string;

  @IsOptional()
  @IsString()
  telefonoSecundario?: string;

  @IsString()
  direccion: string;

  @IsString()
  sede: string;

  @IsOptional()
  @IsString()
  consultorioPredeterminado?: string;

  @IsOptional()
  @IsBoolean()
  tienePasantes?: boolean;

  @IsOptional()
  @IsString()
  colorCalendario?: string;

  @IsOptional()
  @IsString()
  codigoAlfabetico?: string;
}

export class UpdateEspecialistaDto {
  @IsOptional() @IsEmail() email?: string;

  @IsOptional() @IsString() primerNombre?: string;
  @IsOptional() @IsString() segundoNombre?: string;
  @IsOptional() @IsString() primerApellido?: string;
  @IsOptional() @IsString() segundoApellido?: string;
  @IsOptional() @IsString() nombres?: string;
  @IsOptional() @IsString() apellidos?: string;

  @IsOptional() @IsString() tipoIdentificacion?: string;
  @IsOptional() @IsString() numeroIdentificacion?: string;
  @IsOptional() @IsString() genero?: string;
  @IsOptional() @IsDateString() fechaNacimiento?: string;
  @IsOptional() @IsString() estadoCivil?: string;
  @IsOptional() @IsString() fotoUrl?: string;

  @IsOptional() @IsString() codigoMsp?: string;
  @IsOptional() @IsString() especialidad?: string;
  @IsOptional() @IsString() subEspecialidad?: string;
  @IsOptional() @IsString() tituloProfesional?: string;

  @IsOptional() @IsEmail() emailInstitucional?: string;
  @IsOptional() @IsEmail() emailSecundario?: string;
  @IsOptional() @IsEmail() emailPersonal?: string;

  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() telefonoSecundario?: string;
  @IsOptional() @IsString() direccion?: string;

  @IsOptional() @IsString() sede?: string;
  @IsOptional() @IsString() consultorioPredeterminado?: string;

  @IsOptional() @IsBoolean() tienePasantes?: boolean;
  @IsOptional() @IsString() colorCalendario?: string;
  @IsOptional() @IsString() codigoAlfabetico?: string;
}
