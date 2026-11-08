import { IsString, IsOptional, IsDateString, Matches, IsEnum, IsArray } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

const normalizePhone = ({ value }: TransformFnParams) =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;

export class CreatePacienteDto {
  @IsString() primerNombre: string;
  @IsOptional() @IsString() segundoNombre?: string;
  @IsString() primerApellido: string;
  @IsOptional() @IsString() segundoApellido?: string;

  @IsString() nombres: string;
  @IsString() apellidos: string;

  @IsString() tipoIdentificacion: string;
  @IsString() numeroIdentificacion: string;
  @IsString() genero: string;
  @IsDateString() fechaNacimiento: string;

  @IsString() estadoCivil: string;

  @IsString()
  @Matches(/^09\d{8}$/, { message: 'El teléfono debe ser formato Ecuador (09XXXXXXXX)' })
  @Transform(normalizePhone)
  telefono: string;
  @IsOptional() @IsString() @Transform(normalizePhone) telefonoSecundario?: string;
  @IsString() direccion: string;
  @IsString() provincia: string;
  @IsString() canton: string;
  @IsOptional() @IsString() parroquia?: string;
  @IsString() zona: string;

  @IsString() grupoSanguineo: string;
  @IsString() tipoSeguro: string;
  @IsOptional() @IsString() nombreConvenio?: string;

  @IsOptional() @IsArray() @IsString({ each: true }) alergias?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) enfermedadesPreexistentes?: string[];

  @IsString() emergenciaNombre: string;
  @IsString() @Transform(normalizePhone) emergenciaTelefono: string;
  @IsString() emergenciaParentesco: string;

  @IsOptional() @IsString() laboralEmpresa?: string;
  @IsOptional() @IsString() laboralCargo?: string;
  @IsOptional() @IsString() laboralDireccion?: string;
  @IsOptional() @IsString() @Transform(normalizePhone) laboralTelefono?: string;
}

export class UpdatePacienteDto {
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

  @IsOptional() @IsString() @Transform(normalizePhone) telefono?: string;
  @IsOptional() @IsString() @Transform(normalizePhone) telefonoSecundario?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() provincia?: string;
  @IsOptional() @IsString() canton?: string;
  @IsOptional() @IsString() parroquia?: string;
  @IsOptional() @IsString() zona?: string;

  @IsOptional() @IsString() grupoSanguineo?: string;
  @IsOptional() @IsString() tipoSeguro?: string;
  @IsOptional() @IsString() nombreConvenio?: string;

  @IsOptional() @IsArray() @IsString({ each: true }) alergias?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) enfermedadesPreexistentes?: string[];

  @IsOptional() @IsString() emergenciaNombre?: string;
  @IsOptional() @IsString() @Transform(normalizePhone) emergenciaTelefono?: string;
  @IsOptional() @IsString() emergenciaParentesco?: string;

  @IsOptional() @IsString() laboralEmpresa?: string;
  @IsOptional() @IsString() laboralCargo?: string;
  @IsOptional() @IsString() laboralDireccion?: string;
  @IsOptional() @IsString() @Transform(normalizePhone) laboralTelefono?: string;
}
