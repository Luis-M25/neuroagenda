import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SaveFormConfigDto {
  @IsOptional()
  @IsString()
  especialidad?: string;

  @IsOptional()
  @IsString()
  especialistaId?: string;

  @IsString()
  formName: string;

  config: any;

  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;

  @IsOptional()
  orden?: number;
}

export class CreateTemplateDto {
  @IsString()
  especialidad: string;

  @IsString()
  formName: string;

  @IsString()
  fieldName: string;

  @IsString()
  titulo: string;

  @IsString()
  contenido: string;

  @IsOptional()
  orden?: number;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  orden?: number;
}

export class ExamenMentalDto {
  @IsOptional() @IsString() descripcionGeneral?: string;
  @IsOptional() @IsString() conciencia?: string;
  @IsOptional() @IsString() memoria?: string;
  @IsOptional() @IsString() sensacionPercepcion?: string;
  @IsOptional() @IsString() afectividad?: string;
  @IsOptional() @IsString() funcionesConativas?: string;
  @IsOptional() @IsString() juicioInsight?: string;
  @IsOptional() @IsString() atencionConcentracion?: string;
  @IsOptional() @IsString() orientacion?: string;
  @IsOptional() @IsString() pensamiento?: string;
  @IsOptional() @IsString() lenguaje?: string;
  @IsOptional() @IsString() funcionesRelacionales?: string;
}

export class HistoriaFamiliarDto {
  @IsOptional() @IsString() edadEstadoSaludFamiliares?: string;
  @IsOptional() @IsString() logrosEducativos?: string;
  @IsOptional() @IsString() logrosOcupacionales?: string;
  @IsOptional() @IsString() historialPerdidaVisualAuditiva?: string;
  @IsOptional() @IsString() historialPsiquiatricoFamiliar?: string;
  @IsOptional() @IsString() historialMedicoNeurologico?: string;
  @IsOptional() @IsString() trasfondoCultural?: string;
  @IsOptional() @IsString() estructuraDinamicaFamiliar?: string;
}
