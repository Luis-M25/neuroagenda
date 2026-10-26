import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePermisosDto {
  @IsOptional() @IsBoolean() verEspecialistas?: boolean;
  @IsOptional() @IsBoolean() crearEspecialista?: boolean;
  @IsOptional() @IsBoolean() editarEspecialista?: boolean;
  @IsOptional() @IsBoolean() deshabilitarEspecialista?: boolean;
  @IsOptional() @IsBoolean() bloquearEspecialistaGrupal?: boolean;
  @IsOptional() @IsBoolean() verPacientes?: boolean;
  @IsOptional() @IsBoolean() crearPaciente?: boolean;
  @IsOptional() @IsBoolean() editarPaciente?: boolean;
  @IsOptional() @IsBoolean() verInasistenciasPaciente?: boolean;
  @IsOptional() @IsBoolean() bloquearPaciente?: boolean;
  @IsOptional() @IsBoolean() verTodasCitas?: boolean;
  @IsOptional() @IsBoolean() crearCita?: boolean;
  @IsOptional() @IsBoolean() editarCita?: boolean;
  @IsOptional() @IsBoolean() cancelarCita?: boolean;
  @IsOptional() @IsBoolean() reagendarCita?: boolean;
  @IsOptional() @IsBoolean() marcarNoAsistio?: boolean;
  @IsOptional() @IsBoolean() verCalendario?: boolean;
  @IsOptional() @IsBoolean() verReportes?: boolean;
  @IsOptional() @IsBoolean() gestionarAdmins?: boolean;
  @IsOptional() @IsBoolean() gestionarPermisos?: boolean;
  @IsOptional() @IsBoolean() verHistoriaClinica?: boolean;
}
