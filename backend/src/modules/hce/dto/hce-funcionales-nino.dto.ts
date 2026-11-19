import { IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// ── Versión pediátrica: estructura independiente de la versión adulto ──
// Hoy replica los campos de adulto; puede divergir sin afectar a adulto.

export class ResponsableCuidadoNinoDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  contacto?: string;

  @IsOptional()
  @IsString()
  parentesco?: string;
}

export class SaveOcupacionEscolaridadNinoDto {
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
  @Type(() => ResponsableCuidadoNinoDto)
  responsables?: ResponsableCuidadoNinoDto[];

  @IsOptional()
  @IsString()
  motivo?: string;
}

export class SaveActividadFuncionalNinoDto {
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
