import { IsString, IsOptional, IsBoolean, IsInt, IsNumber, IsDateString, IsArray, IsIn } from 'class-validator';

export class CreateConsultaDto {
  @IsString()
  pacienteId: string;

  @IsOptional()
  @IsString()
  citaId?: string;

  @IsString()
  especialistaId: string;

  @IsOptional()
  @IsString()
  motivoConsulta?: string;

  @IsOptional()
  @IsString()
  enfermedadActual?: string;

  @IsOptional()
  @IsString()
  tiempoEvolucion?: string;

  @IsOptional()
  @IsString()
  tratamientosPrevios?: string;
}

export class AddDiagnosticoDto {
  @IsOptional()
  @IsString()
  codigoCIE10?: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;

  @IsOptional()
  @IsInt()
  orden?: number;

  @IsOptional()
  @IsIn(['CIE10', 'DSM5'])
  sistema?: string;

  @IsOptional()
  @IsIn(['PRESUNTIVO', 'DEFINITIVO'])
  estado?: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}

export class AddPrescripcionDto {
  @IsString()
  medicamento: string;

  @IsString()
  dosis: string;

  @IsOptional()
  @IsString()
  via?: string;

  @IsString()
  frecuencia: string;

  @IsOptional()
  @IsString()
  duracion?: string;

  @IsOptional()
  @IsString()
  indicaciones?: string;
}

export class AddEvolucionDto {
  @IsOptional()
  @IsString()
  nota?: string;

  @IsOptional()
  @IsString()
  subjetivo?: string;

  @IsOptional()
  @IsString()
  objetivo?: string;

  @IsOptional()
  @IsString()
  analisis?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}

export class AddPedidoDto {
  @IsString()
  tipo: string;

  @IsString()
  descripcion: string;

  @IsOptional()
  @IsBoolean()
  urgente?: boolean;
}

export class AddIndicacionDto {
  @IsString()
  tipo: string;

  @IsString()
  descripcion: string;
}

export class AddSignoVitalDto {
  @IsOptional()
  @IsString()
  presionArterial?: string;

  @IsOptional()
  @IsNumber()
  frecuenciaCardiaca?: number;

  @IsOptional()
  @IsNumber()
  temperatura?: number;

  @IsOptional()
  @IsNumber()
  peso?: number;

  @IsOptional()
  @IsNumber()
  talla?: number;

  @IsOptional()
  @IsNumber()
  imc?: number;

  @IsOptional()
  @IsInt()
  dolorEVA?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  consultaId?: string;
}

export class AddVacunaDto {
  @IsString()
  nombre: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  dosis?: string;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsString()
  aplicadoPor?: string;
}

export class AddAlergiaDto {
  @IsString()
  tipo: string;

  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  gravedad?: string;
}

export class AddHabitoDto {
  @IsString()
  tipo: string;

  @IsOptional()
  @IsBoolean()
  afirmativo?: boolean;

  @IsOptional()
  @IsString()
  cantidad?: string;

  @IsOptional()
  @IsString()
  desde?: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}

export class AddProblemaActivoDto {
  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  estado?: string;
}

export class UpdateConsultaDto {
  @IsOptional() @IsString() motivoConsulta?: string;
  @IsOptional() @IsString() enfermedadActual?: string;
  @IsOptional() @IsString() tiempoEvolucion?: string;
  @IsOptional() @IsString() tratamientosPrevios?: string;
  @IsOptional() @IsString() tipoConsulta?: string;
  @IsOptional() @IsString() condicionConsulta?: string;
  @IsOptional() @IsString() formaConsulta?: string;
  @IsOptional() @IsString() tipoAtencion?: string;

  @IsOptional() @IsString() efEstadoGeneral?: string;
  @IsOptional() @IsString() efObsGeneral?: string;
  @IsOptional() @IsString() efCardiovascular?: string;
  @IsOptional() @IsString() efObsCardio?: string;
  @IsOptional() @IsString() efRespiratorio?: string;
  @IsOptional() @IsString() efObsResp?: string;
  @IsOptional() @IsString() efAbdomen?: string;
  @IsOptional() @IsString() efObsAbdomen?: string;
  @IsOptional() @IsString() efNeurologico?: string;
  @IsOptional() @IsString() efObsNeuro?: string;
  @IsOptional() @IsString() efExtremidades?: string;
  @IsOptional() @IsString() efObsExtrem?: string;
  @IsOptional() @IsString() efPiel?: string;
  @IsOptional() @IsString() efObsPiel?: string;
  @IsOptional() @IsString() efCabezaCuello?: string;
  @IsOptional() @IsString() efObsCabeza?: string;
}

export class UpdateModulosDto {
  @IsArray()
  modulos: { modulo: string; habilitado: boolean; orden?: number }[];
}
