import { IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// ── Módulo 1: Ocupación, escolaridad y responsables del cuidado ──

export class ResponsableCuidadoDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  contacto?: string;

  @IsOptional()
  @IsString()
  parentesco?: string;
}

export class SaveOcupacionEscolaridadDto {
  @IsOptional()
  @IsString()
  ocupacionTexto?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ocupacionEtiquetas?: string[];

  @IsOptional()
  @IsString()
  nivelAcademico?: string;

  @IsOptional()
  @IsString()
  escolaridadTexto?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  escolaridadEtiquetas?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponsableCuidadoDto)
  responsables?: ResponsableCuidadoDto[];

  @IsOptional()
  @IsString()
  motivo?: string;
}

// ── Módulo 2: Actividad significativa y funcionalidad ──

export class SaveActividadFuncionalDto {
  @IsOptional()
  @IsString()
  actividadSignificativa?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  medidaIndependencia?: number;

  @IsOptional()
  @IsString()
  cambiosDesempeno?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actividadesVidaDiaria?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actividadesInstrumentales?: string[];

  @IsOptional()
  @IsString()
  motricidadFina?: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}
