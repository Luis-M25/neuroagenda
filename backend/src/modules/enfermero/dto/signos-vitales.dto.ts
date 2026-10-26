import { IsString, IsOptional, IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreateSignosVitalesDto {
  @IsOptional() @IsString() presionArterial?: string;
  @IsOptional() @IsInt() @Min(30) @Max(250) frecuenciaCardiaca?: number;
  @IsOptional() @IsNumber() @Min(34) @Max(42) temperatura?: number;
  @IsOptional() @IsNumber() @Min(60) @Max(100) saturacionOxigeno?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(300) peso?: number;
  @IsOptional() @IsNumber() @Min(20) @Max(250) talla?: number;
  @IsOptional() @IsNumber() @Min(10) @Max(80) imc?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) dolorEVA?: number;
  @IsOptional() @IsString() observaciones?: string;
}

export class CreateAlergiaDto {
  @IsString() tipo: string;
  @IsString() descripcion: string;
  @IsOptional() @IsString() gravedad?: string;
}

export class CreateAntecedenteDto {
  @IsString() tipo: string;
  @IsString() descripcion: string;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsString() fechaDiagnostico?: string;
}
