import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, ArrayMinSize, ArrayMaxSize, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ── Evaluación Neuroconductual (14 campos) ──
export class SaveEvalNeuroconductualDto {
  @IsOptional() @IsString() funcionMotora?: string;
  @IsOptional() @IsString() juicioInsight?: string;
  @IsOptional() @IsString() aprendizajeMemoria?: string;
  @IsOptional() @IsString() conciencia?: string;
  @IsOptional() @IsString() lenguaje?: string;
  @IsOptional() @IsString() visionEspacialConstruccional?: string;
  @IsOptional() @IsString() atencionMemoriaTrabajo?: string;
  @IsOptional() @IsString() habilidadesAritmeticas?: string;
  @IsOptional() @IsString() abstraccionRazonamiento?: string;
  @IsOptional() @IsString() afectividad?: string;
  @IsOptional() @IsString() percepcionPensamiento?: string;
  @IsOptional() @IsString() descripcionGeneral?: string;
  @IsOptional() @IsString() orientacion?: string;
  @IsOptional() @IsString() funcionesCognitivasRelacion?: string;
}

// ── Evaluación Neuropsicométrica (13 campos) ──
export class SaveEvalNeuropsicometricaDto {
  @IsOptional() @IsString() alerta?: string;
  @IsOptional() @IsString() funcionesMotoras?: string;
  @IsOptional() @IsString() orientacion?: string;
  @IsOptional() @IsString() atencionConcentracion?: string;
  @IsOptional() @IsString() memoria?: string;
  @IsOptional() @IsString() lenguaje?: string;
  @IsOptional() @IsString() lectura?: string;
  @IsOptional() @IsString() escritura?: string;
  @IsOptional() @IsString() calculo?: string;
  @IsOptional() @IsString() habilidadesMotorasComplejas?: string;
  @IsOptional() @IsString() habilidadesVisoperceptuales?: string;
  @IsOptional() @IsString() problemasAfectivos?: string;
  @IsOptional() @IsString() otrasValoraciones?: string;
}

// ── Discusión Diagnóstica (opción B: clínico libre + discusión + CIE-10 opcional) ──
export class SaveDiscusionDiagnosticaDto {
  @IsOptional() @IsString() diagnosticoClinico?: string;
  @IsOptional() @IsString() discusionGeneral?: string;
}

// ── Plan de Tratamiento Neuropsicológico (escala SMART +2..-2) ──
export class ObjetivoTratamientoDto {
  @IsInt() @Min(1) @Max(3)
  numero: number;

  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsString() @IsNotEmpty() escalaMas2: string;
  @IsString() @IsNotEmpty() escalaMas1: string;
  @IsString() @IsNotEmpty() escalaCero: string;
  @IsString() @IsNotEmpty() escalaMenos1: string;
  @IsString() @IsNotEmpty() escalaMenos2: string;
  @IsOptional() @IsString() obsMas2?: string;
  @IsOptional() @IsString() obsMas1?: string;
  @IsOptional() @IsString() obsCero?: string;
  @IsOptional() @IsString() obsMenos1?: string;
  @IsOptional() @IsString() obsMenos2?: string;
  @IsOptional() @IsString() observacion?: string;
}

export class CreatePlanTratamientoDto {
  @IsInt() @Min(1)
  numeroCitas: number;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ObjetivoTratamientoDto)
  objetivos: ObjetivoTratamientoDto[];
}

export class UpdatePlanTratamientoDto {
  @IsOptional() @IsInt() @Min(1)
  numeroCitas?: number;

  @IsOptional()
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ObjetivoTratamientoDto)
  objetivos?: ObjetivoTratamientoDto[];
}

export class ExtenderPlanDto {
  @IsInt() @Min(1) @Max(5)
  citasExtension: number;

  @IsString()
  motivo: string;
}

export class ResultadoObjetivoDto {
  @IsInt() @Min(1) @Max(3)
  numero: number;

  @IsInt() @Min(-2) @Max(2)
  resultadoFinal: number;
}

export class FinalizarPlanDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ResultadoObjetivoDto)
  resultados: ResultadoObjetivoDto[];
}
