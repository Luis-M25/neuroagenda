import { buildRecetaPdf } from './receta-pdf.builder';
import {
  buildDevolucionOptometriaPdf,
  buildHistoriaClinicaOptometriaPdf,
} from './optometry-pdf.builder';
import { esOptometria } from './optometry-pdf.utils';
import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import * as bcrypt from 'bcryptjs';
import {
  CreateConsultaDto, UpdateConsultaDto, AddDiagnosticoDto, AddPrescripcionDto,
  AddEvolucionDto, AddPedidoDto, AddIndicacionDto, AddSignoVitalDto, AddVacunaDto, UpdateModulosDto,
  AddAlergiaDto, AddHabitoDto, AddProblemaActivoDto,
} from './dto/hce.dto';
import { ExamenMentalDto, HistoriaFamiliarDto } from './dto/hce-forms.dto';
import {
  AddAntecedenteDto, GenerarRecetaDto, GenerarCertificadoDto,
  DarAltaDto, CrearDerivacionDto, PrivacidadDiagnosticosDto,
} from './dto/hce-clinico.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { MailService } from '../notificaciones/mail/mail.service';
import {
  SaveEvalNeuroconductualDto, SaveEvalNeuropsicometricaDto, SaveDiscusionDiagnosticaDto,
  CreatePlanTratamientoDto, UpdatePlanTratamientoDto, ExtenderPlanDto, FinalizarPlanDto,
} from './dto/neuropsicologia.dto';
import { SaveOptometriaDto } from './dto/optometria.dto';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID, createHash } from 'crypto';
import PDFDocument from 'pdfkit';

export const MODULOS_HCE = [
  { key: 'consulta', label: 'Consulta', orden: 0 },
  { key: 'antecedentes', label: 'Antecedentes', orden: 1 },
  { key: 'alergias', label: 'Alergias', orden: 2 },
  { key: 'signos_vitales', label: 'Signos Vitales', orden: 3 },
  { key: 'examen_fisico', label: 'Examen Físico', orden: 4 },
  { key: 'diagnosticos', label: 'Diagnósticos', orden: 5 },
  { key: 'examenes', label: 'Exámenes', orden: 6 },
  { key: 'pedidos', label: 'Pedidos', orden: 7 },
  { key: 'prescripcion', label: 'Receta', orden: 8 },
  { key: 'tratamiento', label: 'Tratamiento', orden: 9 },
  { key: 'evolucion', label: 'Evolución', orden: 10 },
  { key: 'vacunas', label: 'Vacunas', orden: 11 },
  { key: 'consentimientos', label: 'Consentimientos', orden: 12 },
  { key: 'proxima_cita', label: 'Próxima Cita', orden: 13 },
  { key: 'observaciones', label: 'Observaciones', orden: 14 },
  { key: 'motivo_consulta', label: 'Motivo de Consulta', orden: 15 },
  { key: 'datos_generales', label: 'Datos Generales', orden: 16 },
  { key: 'historial_enfermedad', label: 'Enfermedad Actual', orden: 17 },
  { key: 'eval_neuroconductual', label: 'Evaluación Neuroconductual', orden: 18 },
  { key: 'eval_neuropsicometrica', label: 'Evaluación Neuropsicométrica', orden: 19 },
  { key: 'diagnostico_discusion', label: 'Diagnóstico - Discusión Diagnóstica', orden: 20 },
  { key: 'optometria', label: 'Historia Clínica Optometría', orden: 21 },
  { key: 'indicaciones', label: 'Indicaciones', orden: 22 },
];

// ── Módulos HCE de la especialidad Neuropsicología (orden de pestañas) ──
export const MODULOS_NEUROPSICOLOGIA = [
  'consulta',
  'motivo_consulta',
  'datos_generales',
  'antecedentes',
  'historial_enfermedad',
  'eval_neuroconductual',
  'eval_neuropsicometrica',
  'diagnostico_discusion',
  'tratamiento',
  'evolucion',
];

// ── Módulos HCE de la especialidad Optometría (orden de secciones) ──
export const MODULOS_OPTOMETRIA = [
  'consulta',
  'motivo_consulta',
  'datos_generales',
  'antecedentes',
  'historial_enfermedad',
  'signos_vitales',
  'optometria',
  'examenes',
  'diagnosticos',
  'tratamiento',
  'evolucion',
  'observaciones',
  'indicaciones',
];

@Injectable()
export class HceService {
  private diagnosticosCache = new Map<string, Array<{ codigo: string; descripcion: string }>>();

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
    private mail: MailService,
  ) {}

  // ── Admin: lista de especialidades disponibles ──
  async getAdminEspecialidades() {
    const result = await this.prisma.especialista.findMany({
      select: { especialidad: true },
      distinct: ['especialidad'],
      orderBy: { especialidad: 'asc' },
    });
    return result.map(r => r.especialidad);
  }

  // ── Admin: lista de especialistas ──
  async getAdminEspecialistas() {
    const especialistas = await this.prisma.especialista.findMany({
      select: {
        id: true, nombres: true, apellidos: true, especialidad: true, sede: true,
        _count: { select: { consultas: true } },
      },
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
    });

    return especialistas.map(e => ({
      id: e.id,
      nombre: `${e.nombres} ${e.apellidos}`,
      especialidad: e.especialidad,
      sede: e.sede,
      totalConsultas: e._count.consultas,
    }));
  }

  // ── Admin: pacientes atendidos por un especialista ──
  async getPacientesPorEspecialista(especialistaId: string, userId?: string, userRol?: string) {
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId } });
      if (!esp || esp.id !== especialistaId) throw new ForbiddenException('No autorizado');
    }
    const esp = await this.prisma.especialista.findUnique({ where: { id: especialistaId } });
    if (!esp) throw new NotFoundException('Especialista no encontrado');

    const consultas = await this.prisma.consultaHCE.findMany({
      where: { especialistaId },
      include: {
        paciente: { select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true, fechaNacimiento: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const map = new Map<string, any>();
    for (const c of consultas) {
      if (!map.has(c.pacienteId)) {
        map.set(c.pacienteId, {
          paciente: c.paciente,
          pacienteId: c.pacienteId,
          ultimaConsulta: c,
          totalConsultas: 0,
        });
      }
      map.get(c.pacienteId)!.totalConsultas++;
    }

    return Array.from(map.values());
  }

  // ── Historial completo del paciente (todas las consultas, todos los especialistas) ──
  async getHistorialPaciente(pacienteId: string, especialistaId?: string, userId?: string, userRol?: string) {
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId } });
      if (!esp) throw new ForbiddenException('No autorizado');
      if (especialistaId && esp.id !== especialistaId) throw new ForbiddenException('No autorizado');
      if (!especialistaId) especialistaId = esp.id;
    }
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: {
        antecedentes: { where: { activo: true }, orderBy: [{ ambito: 'asc' }, { fecha: 'desc' }] },
        signosVitales: { orderBy: { createdAt: 'desc' } },
        vacunas: { orderBy: { fecha: 'desc' } },
        consultasHCE: {
          where: especialistaId ? { especialistaId } : {},
          include: {
            especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
            diagnosticos: true,
            prescripciones: true,
            evoluciones: true,
            pedidos: true,
            evaluacionNeuroconductual: true,
            evaluacionNeuropsicometrica: true,
            discusionDiagnostica: true,
            planTratamiento: { include: { objetivos: { orderBy: { numero: 'asc' } } } },
            optometriaInforme: true,
          },
          orderBy: [{ numeroConsulta: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    // La evolución clínica solo la ve el especialista titular, Auditoría y Administración principal.
    const verEvoluciones = userRol === 'ESPECIALISTA' || this.rolesVenEvoluciones(userRol);
    if (!verEvoluciones) {
      (paciente as any).consultasHCE = paciente.consultasHCE.map((c: any) => ({
        ...c,
        evoluciones: [],
        evolucionesOcultas: true,
      }));
    }
    return paciente;
  }

  // ── Consultas de un especialista filtradas por módulo ──
  async getConsultasPorModulo(especialistaId: string, modulo: string, userId?: string, userRol?: string) {
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId } });
      if (!esp || esp.id !== especialistaId) throw new ForbiddenException('No autorizado');
    }
    const esp = await this.prisma.especialista.findUnique({ where: { id: especialistaId } });
    if (!esp) throw new NotFoundException('Especialista no encontrado');

    // La evolución clínica no se expone a Admisión ni Enfermería; solo al titular,
    // Auditoría y Administración principal.
    if (modulo === 'evolucion' && userRol !== 'ESPECIALISTA' && !this.rolesVenEvoluciones(userRol)) {
      throw new ForbiddenException('No autorizado para ver evoluciones clínicas');
    }

    const includeMap: any = {
      paciente: { select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true } },
    };

    if (['consulta', 'antecedentes', 'alergias', 'examen_fisico', 'tratamiento', 'observaciones', 'proxima_cita'].includes(modulo)) {
      // Datos propios de la consulta
    }
    if (modulo === 'diagnosticos') includeMap.diagnosticos = true;
    if (modulo === 'prescripcion') includeMap.prescripciones = true;
    if (modulo === 'evolucion') includeMap.evoluciones = true;
    if (modulo === 'pedidos') includeMap.pedidos = true;
    if (modulo === 'examenes') includeMap.examenes = true;
    if (modulo === 'consentimientos') includeMap.consentimientos = true;
    if (modulo === 'eval_neuroconductual') includeMap.evaluacionNeuroconductual = true;
    if (modulo === 'eval_neuropsicometrica') includeMap.evaluacionNeuropsicometrica = true;
    if (modulo === 'optometria') includeMap.optometriaInforme = true;
    if (modulo === 'diagnostico_discusion') {
      includeMap.diagnosticos = true;
      includeMap.discusionDiagnostica = true;
    }
    if (modulo === 'indicaciones') includeMap.indicaciones = true;

    const consultas = await this.prisma.consultaHCE.findMany({
      where: { especialistaId },
      include: includeMap,
      orderBy: { createdAt: 'desc' },
    });

    // Filtrar por módulo con datos
    return consultas.filter((c: any) => {
      switch (modulo) {
        case 'consulta': return !!c.motivoConsulta;
        case 'motivo_consulta': return !!c.motivoConsulta;
        case 'historial_enfermedad': return !!c.enfermedadActual;
        case 'diagnosticos': return c.diagnosticos?.length > 0;
        case 'diagnostico_discusion': return c.diagnosticos?.length > 0 || !!(c as any).discusionDiagnostica;
        case 'eval_neuroconductual': return !!(c as any).evaluacionNeuroconductual;
        case 'eval_neuropsicometrica': return !!(c as any).evaluacionNeuropsicometrica;
        case 'optometria': return !!(c as any).optometriaInforme;
        case 'prescripcion': return c.prescripciones?.length > 0;
        case 'evolucion': return c.evoluciones?.length > 0;
        case 'pedidos': return c.pedidos?.length > 0;
        case 'examenes': return c.examenes?.length > 0;
        case 'consentimientos': return c.consentimientos?.length > 0;
        case 'indicaciones': return c.indicaciones?.length > 0;
        default: return false;
      }
    });
  }

  // ── Buscar consulta por citaId ──
  async getConsultaByCitaId(citaId: string, userId?: string, userRol?: string) {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { citaId },
    });
    if (!consulta) return null;
    return this.getConsulta(consulta.id, userId, userRol);
  }

  // ── Admin: ver consulta completa ──
  async getConsulta(consultaId: string, userId?: string, userRol?: string) {
    const consulta: any = await this.prisma.consultaHCE.findUnique({
      where: { id: consultaId },
      include: {
        paciente: { select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true, fechaNacimiento: true, telefono: true, grupoSanguineo: true, alergias: true } },
        especialista: { select: { id: true, usuarioId: true, nombres: true, apellidos: true, especialidad: true } },
        diagnosticos: { orderBy: { createdAt: 'asc' } },
        prescripciones: true,
        evoluciones: true,
        pedidos: true,
        signosVitales: { orderBy: { createdAt: 'desc' }, take: 5 },
        indicaciones: true,
        examenes: true,
        firmas: { orderBy: { fechaFirma: 'desc' }, take: 1 },
        cita: { select: { fecha: true, horaInicio: true } },
        evaluacionNeuroconductual: true,
        evaluacionNeuropsicometrica: true,
        discusionDiagnostica: true,
        planTratamiento: { include: { objetivos: { orderBy: { numero: 'asc' } } } },
        optometriaInforme: true,
      },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');

    // Un especialista solo puede abrir consultas propias. El historial unificado
    // de otros especialistas se expone únicamente como código (ver getHistorialDiagnosticos).
    if (userRol === 'ESPECIALISTA' && consulta.especialista?.usuarioId !== userId) {
      throw new ForbiddenException('No autorizado para ver esta consulta');
    }

    const verEvoluciones =
      userRol === 'ESPECIALISTA'
        ? consulta.especialista?.usuarioId === userId
        : this.rolesVenEvoluciones(userRol);
    if (!verEvoluciones) {
      consulta.evoluciones = [];
      consulta.evolucionesOcultas = true;
    }
    return consulta;
  }

  // ── Admin: módulos de una especialidad (busca por especialista o directo por nombre) ──
  async getModulos(especialistaId: string, userId?: string, userRol?: string) {
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId } });
      if (!esp || esp.id !== especialistaId) throw new ForbiddenException('No autorizado');
    }
    const esp = await this.prisma.especialista.findUnique({ where: { id: especialistaId } });
    if (!esp) throw new NotFoundException('Especialista no encontrado');

    const existing = await this.prisma.especialidadModuloHCE.findMany({
      where: { especialidad: esp.especialidad },
    });

    if (existing.length === 0) {
      await this.prisma.especialidadModuloHCE.createMany({
        data: MODULOS_HCE.map(m => ({
          especialidad: esp.especialidad,
          modulo: m.key,
          habilitado: false,
          orden: m.orden,
        })),
      });
      return MODULOS_HCE.map(m => ({ modulo: m.key, habilitado: false, label: m.label, orden: m.orden, configurado: true }));
    }

    return MODULOS_HCE.map(m => {
      const mod = existing.find(e => e.modulo === m.key);
      const tieneConsulta = existing.find(e => e.modulo === 'consulta')?.habilitado ?? false;
      // Compatibilidad: módulos que antes eran parte del flujo estándar se muestran
      // habilitados si la especialidad no tiene fila propia (un false explícito se respeta).
      const habilitado = mod
        ? mod.habilitado
        : (['historial_enfermedad', 'indicaciones'].includes(m.key) && tieneConsulta);
      return { modulo: m.key, habilitado, label: m.label, orden: m.orden, configurado: !!mod };
    });
  }

  // ── Admin: actualizar módulos de una especialidad ──
  async updateModulos(especialidad: string, dto: UpdateModulosDto) {
    for (const m of dto.modulos) {
      await this.prisma.especialidadModuloHCE.upsert({
        where: { especialidad_modulo: { especialidad, modulo: m.modulo } },
        update: { habilitado: m.habilitado },
        create: {
          especialidad,
          modulo: m.modulo,
          habilitado: m.habilitado,
          orden: MODULOS_HCE.findIndex(x => x.key === m.modulo),
        },
      });
    }

    const modulos = await this.prisma.especialidadModuloHCE.findMany({
      where: { especialidad },
    });
    return MODULOS_HCE.map(m => {
      const mod = modulos.find(e => e.modulo === m.key);
      return { modulo: m.key, habilitado: mod?.habilitado || false, label: m.label, orden: m.orden };
    });
  }

  // ── Admin: listar todas las especialidades con sus módulos ──
  async getEspecialidadesModulos() {
    const especialidades = await this.prisma.especialidad.findMany({
      orderBy: { nombre: 'asc' },
    });

    const result = [];
    for (const esp of especialidades) {
      const modulos = await this.prisma.especialidadModuloHCE.findMany({
        where: { especialidad: esp.nombre },
      });
      const tieneConsulta = modulos.find(e => e.modulo === 'consulta')?.habilitado ?? false;
      result.push({
        especialidad: esp.nombre,
        modulos: MODULOS_HCE.map(m => {
          const mod = modulos.find(e => e.modulo === m.key);
          // Compatibilidad: "Enfermedad actual" e "Indicaciones" antes formaban parte
          // del flujo estándar (Consulta / siempre visibles). Si la especialidad ya tiene
          // Consulta pero no una fila propia del módulo, se muestran habilitados por
          // defecto (una fila explícita false sí se respeta).
          const habilitado = mod
            ? mod.habilitado
            : (['historial_enfermedad', 'indicaciones'].includes(m.key) && tieneConsulta);
          return { modulo: m.key, label: m.label, orden: m.orden, habilitado };
        }),
      });
    }
    return result;
  }

  // ── Consultas por especialista ──
  async getConsultasPorEspecialista(especialistaId: string, userId: string, userRol: string) {
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId } });
      if (!esp || esp.id !== especialistaId) throw new ForbiddenException('No autorizado');
    }
    return this.prisma.consultaHCE.findMany({
      where: { especialistaId },
      include: {
        paciente: { select: { id: true, nombres: true, apellidos: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ── CRUD Consulta ──
  async createConsulta(dto: CreateConsultaDto, userId: string) {
    if (dto.citaId) {
      const existing = await this.prisma.consultaHCE.findUnique({
        where: { citaId: dto.citaId },
      });
      if (existing) {
        return this.getConsulta(existing.id);
      }
    }
    // Numeración secuencial por (paciente + especialista): #001, #002, ...
    const max = await this.prisma.consultaHCE.aggregate({
      where: { pacienteId: dto.pacienteId, especialistaId: dto.especialistaId },
      _max: { numeroConsulta: true },
    });
    const consulta = await this.prisma.consultaHCE.create({
      data: {
        pacienteId: dto.pacienteId,
        citaId: dto.citaId || null,
        especialistaId: dto.especialistaId,
        numeroConsulta: (max._max.numeroConsulta ?? 0) + 1,
        motivoConsulta: dto.motivoConsulta,
        enfermedadActual: dto.enfermedadActual,
        tiempoEvolucion: dto.tiempoEvolucion,
        tratamientosPrevios: dto.tratamientosPrevios,
      },
    });
    return consulta;
  }

  async updateConsulta(id: string, data: UpdateConsultaDto, userId?: string, userRol?: string) {
    const consulta = await this.findConsultaOrFail(id);
    if (consulta.firmada) {
      throw new ConflictException({ code: 'HC_CERRADA', message: 'La consulta ya fue firmada y no se puede modificar' });
    }
    await this.assertTitularConsulta(consulta, userId, userRol);
    const camposConsulta = ['tipoConsulta', 'condicionConsulta', 'formaConsulta', 'tipoAtencion'] as const;
    if (camposConsulta.some((campo) => data[campo] !== undefined)) {
      this.validarDatosConsulta({ ...consulta, ...data });
    }
    await this.prisma.consultaHCE.update({ where: { id }, data });
    return this.getConsulta(id, userId, userRol);
  }

  private validarDatosConsulta(data: {
    tipoConsulta?: string | null;
    condicionConsulta?: string | null;
    formaConsulta?: string | null;
    tipoAtencion?: string | null;
  }) {
    const tipoConsulta = data.tipoConsulta?.trim() || '';
    const condicionConsulta = data.condicionConsulta?.trim() || '';
    const formaConsulta = data.formaConsulta?.trim() || '';
    const tipoAtencion = data.tipoAtencion?.trim() || '';

    const faltantes: string[] = [];
    if (!tipoConsulta) faltantes.push('tipo de consulta');
    if (!condicionConsulta) faltantes.push('condición');
    if (!formaConsulta) faltantes.push('forma');
    if (!tipoAtencion) faltantes.push('tipo de atención');
    if (faltantes.length > 0) {
      throw new BadRequestException(`Complete los datos de la consulta: ${faltantes.join(', ')}`);
    }

    if (!['Llamada telefónica', 'Evaluación', 'Tratamiento', 'Control'].includes(tipoConsulta)) {
      throw new BadRequestException('Tipo de consulta no válido');
    }
    if (!['Primera vez', 'Subsecuente'].includes(condicionConsulta)) {
      throw new BadRequestException('Condición de consulta no válida');
    }
    if (!['Presencial', 'Virtual'].includes(formaConsulta)) {
      throw new BadRequestException('Forma de consulta no válida');
    }
    if (!['Consulta externa', 'Emergencia', 'Hospitalizacion', 'Domiciliaria'].includes(tipoAtencion)) {
      throw new BadRequestException('Tipo de atención no válido');
    }

    if (tipoConsulta === 'Llamada telefónica' && formaConsulta !== 'Virtual') {
      throw new BadRequestException('Una llamada telefónica debe registrarse con forma Virtual');
    }
    if (tipoConsulta === 'Llamada telefónica' && tipoAtencion !== 'Consulta externa') {
      throw new BadRequestException('Una llamada telefónica solo puede ser de tipo Consulta externa');
    }
    if (formaConsulta === 'Virtual' && tipoAtencion !== 'Consulta externa') {
      throw new BadRequestException('Una atención virtual solo puede ser de tipo Consulta externa');
    }
    if (
      ['Emergencia', 'Hospitalizacion', 'Domiciliaria'].includes(tipoAtencion)
      && formaConsulta !== 'Presencial'
    ) {
      throw new BadRequestException('Emergencia, Hospitalización y Domiciliaria requieren forma Presencial');
    }
  }

  async firmarConsulta(id: string, password: string, userId: string) {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id },
      include: {
        especialista: { include: { usuario: { select: { id: true, passwordHash: true } } } },
        diagnosticos: true,
        prescripciones: true,
        paciente: true,
        evaluacionNeuroconductual: true,
        evaluacionNeuropsicometrica: true,
        discusionDiagnostica: true,
        planTratamiento: { include: { objetivos: { orderBy: { numero: 'asc' } } } },
        optometriaInforme: true,
      },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');
    if (consulta.firmada) {
      throw new ConflictException({ code: 'HC_CERRADA', message: 'La consulta ya fue firmada' });
    }
    if (!consulta.motivoConsulta?.trim()) {
      throw new BadRequestException('Debe llenar el motivo de consulta antes de firmar la HCE');
    }

    const esp = consulta.especialista;
    if (!esp?.usuarioId || esp.usuarioId !== userId) {
      throw new ForbiddenException('Solo el especialista titular puede firmar esta consulta');
    }

    const passwordHash = esp.usuario?.passwordHash;
    if (!passwordHash) {
      throw new UnauthorizedException('No se puede verificar la identidad del especialista');
    }
    const ok = await bcrypt.compare(password, passwordHash);
    if (!ok) throw new UnauthorizedException('Contrasena incorrecta');

    this.validarDatosConsulta(consulta);

    const snapshot = JSON.stringify({
      id: consulta.id,
      motivoConsulta: consulta.motivoConsulta,
      enfermedadActual: consulta.enfermedadActual,
      diagnosticos: consulta.diagnosticos,
      prescripciones: consulta.prescripciones,
      evaluacionNeuroconductual: (consulta as any).evaluacionNeuroconductual ?? null,
      evaluacionNeuropsicometrica: (consulta as any).evaluacionNeuropsicometrica ?? null,
      discusionDiagnostica: (consulta as any).discusionDiagnostica ?? null,
      planTratamiento: (consulta as any).planTratamiento ?? null,
      optometriaInforme: (consulta as any).optometriaInforme ?? null,
      updatedAt: consulta.updatedAt,
    });
    const hashDocumento = createHash('sha256').update(snapshot).digest('hex');

    await this.prisma.firma.create({
      data: {
        consultaId: id,
        usuarioId: userId,
        tipo: 'CIERRE_HC',
        hashDocumento,
        algoritmoHash: 'sha256',
      },
    });

    await this.prisma.consultaHCE.update({
      where: { id },
      data: { firmada: true, firmadaEn: new Date() },
    });

    const pdfPath = await this.generateConsultaPdf(id);
    await this.prisma.consultaHCE.update({
      where: { id },
      data: { archivoPdfUrl: pdfPath },
    });

    // Devolución de resultados (Optometría): se genera automáticamente al firmar si hay informe
    const optometria: any = (consulta as any).optometriaInforme;
    if (optometria) {
      const snapshotDevolucion = JSON.stringify({
        tipo: 'DEVOLUCION_RESULTADOS',
        consultaId: consulta.id,
        pacienteId: consulta.pacienteId,
        especialistaId: consulta.especialistaId,
        variante: 'INTEGRAL',
        informe: optometria,
      });
      const hashDevolucion = createHash('sha256').update(snapshotDevolucion).digest('hex');
      await this.prisma.firma.create({
        data: {
          consultaId: id,
          usuarioId: userId,
          tipo: 'DEVOLUCION_RESULTADOS',
          hashDocumento: hashDevolucion,
          algoritmoHash: 'sha256',
        },
      });
      await this.generateDevolucionPdf(id, hashDevolucion);
    }

    return this.getConsulta(id);
  }

  // ── Certificado médico de asistencia ──
  async generarCertificadoAsistencia(id: string, password: string, observaciones?: string, userId?: string, userRol?: string) {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id },
      include: {
        especialista: { include: { usuario: { select: { passwordHash: true } } } },
        paciente: true,
        cita: { select: { fecha: true, horaInicio: true, horaFin: true } },
      },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');
    if (!consulta.firmada) {
      throw new BadRequestException('La consulta debe estar firmada para emitir el certificado');
    }
    await this.assertTitularConsulta(consulta, userId, userRol);

    const passwordHash = consulta.especialista?.usuario?.passwordHash;
    if (!passwordHash) {
      throw new UnauthorizedException('No se puede verificar la identidad del especialista');
    }
    const ok = await bcrypt.compare(password, passwordHash);
    if (!ok) throw new UnauthorizedException('Contrasena incorrecta');

    if (observaciones?.trim()) {
      await this.prisma.consultaHCE.update({
        where: { id },
        data: { observacionesCertificado: observaciones.trim() },
      });
    }

    const snapshot = JSON.stringify({
      tipo: 'CERTIFICADO_ASISTENCIA',
      consultaId: consulta.id,
      pacienteId: consulta.pacienteId,
      fecha: consulta.cita?.fecha,
      hora: consulta.cita?.horaInicio,
      observaciones: observaciones?.trim() || consulta.observacionesCertificado || null,
    });
    const hashDocumento = createHash('sha256').update(snapshot).digest('hex');

    await this.prisma.firma.create({
      data: {
        consultaId: id,
        usuarioId: userId || consulta.especialista.usuarioId,
        tipo: 'CERTIFICADO_ASISTENCIA',
        hashDocumento,
        algoritmoHash: 'sha256',
      },
    });

    const pdfPath = await this.generateCertificadoPdf(id, hashDocumento);
    return { ok: true, pdfUrl: pdfPath };
  }

  private async generateCertificadoPdf(consultaId: string, hashDocumento: string): Promise<string> {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id: consultaId },
      include: {
        paciente: true,
        especialista: true,
        cita: { select: { fecha: true, horaInicio: true, horaFin: true } },
        firmas: {
          where: { tipo: 'CERTIFICADO_ASISTENCIA' },
          orderBy: { fechaFirma: 'desc' },
          take: 1,
        },
      },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');

    const pdfDir = path.join(process.cwd(), 'uploads', 'hce');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `certificado-${consultaId}.pdf`);

    const esp = consulta.especialista;
    const espNombre = [esp.primerNombre, esp.segundoNombre, esp.primerApellido, esp.segundoApellido]
      .filter(Boolean).join(' ') || `${esp.nombres} ${esp.apellidos}`;
    const pacienteNombre = `${consulta.paciente.nombres} ${consulta.paciente.apellidos}`;
    const fechaCita = consulta.cita?.fecha
      ? new Date(consulta.cita.fecha).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date(consulta.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
    const horaCita = consulta.cita?.horaInicio || '';
    const firma = consulta.firmas[0];
    const fechaEmision = new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Membrete
      doc.fontSize(16).text('Instituto de Neurociencias — Ecuador', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#666666').text('Dirección: Quito, Ecuador | Teléfono: (02) 000-0000', { align: 'center' });
      doc.moveDown(1.5);

      doc.fillColor('#000000').fontSize(15).text('CERTIFICADO MÉDICO DE ASISTENCIA', { align: 'center', underline: true });
      doc.moveDown(1.5);

      // Cuerpo
      doc.fontSize(11).text(
        `El suscrito, Dr./Dra. ${espNombre}, especialista en ${esp.especialidad || 'Medicina'}, ` +
        `CERTIFICA que el/la paciente ${pacienteNombre}, identificado(a) con cédula N.° ${consulta.paciente.numeroIdentificacion}, ` +
        `asistió a consulta médica el día ${fechaCita}${horaCita ? ` a las ${horaCita}` : ''}.`,
        { align: 'justify', lineGap: 4 },
      );

      const obs = consulta.observacionesCertificado;
      if (obs) {
        doc.moveDown(1);
        doc.fontSize(11).text(`Observaciones: ${obs}`, { align: 'justify', lineGap: 3 });
      }

      doc.moveDown(2);
      doc.text(`Quito, ${fechaEmision}`, { align: 'right' });
      doc.moveDown(2.5);

      // Firma
      doc.text('_________________________', { align: 'center' });
      doc.text(`Dr./Dra. ${espNombre}`, { align: 'center' });
      doc.fontSize(10).text(esp.especialidad || '', { align: 'center' });
      if (esp.codigoMsp) doc.text(`MSP: ${esp.codigoMsp}`, { align: 'center' });

      // Hash de verificación
      if (firma) {
        doc.moveDown(1.5);
        doc.fontSize(8).fillColor('#666666').text(
          `Documento firmado digitalmente el ${new Date(firma.fechaFirma).toLocaleString('es-EC')}`,
          { align: 'center' },
        );
        doc.text(`Verificación SHA-256: ${hashDocumento}`, { align: 'center' });
      }

      doc.end();
      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    });
  }

  /** Devuelve la ruta del PDF del certificado si existe (para descarga). */
  async getCertificadoPdfPath(consultaId: string): Promise<string> {
    const firma = await this.prisma.firma.findFirst({
      where: { consultaId, tipo: 'CERTIFICADO_ASISTENCIA' },
    });
    if (!firma) {
      throw new BadRequestException('El certificado no ha sido generado para esta consulta');
    }
    const pdfPath = path.join(process.cwd(), 'uploads', 'hce', `certificado-${consultaId}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      // Regenerar si el archivo se perdió (ej: rebuild de dist/)
      return this.generateCertificadoPdf(consultaId, firma.hashDocumento || '');
    }
    return pdfPath;
  }

  // ── Optometría: Devolución de resultados ──
  private async generateDevolucionPdf(consultaId: string, hashDocumento: string): Promise<string> {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id: consultaId },
      include: {
        paciente: true,
        especialista: true,
        cita: { select: { fecha: true, horaInicio: true } },
        optometriaInforme: true,
        firmas: {
          where: { tipo: 'DEVOLUCION_RESULTADOS' },
          orderBy: { fechaFirma: 'desc' },
          take: 1,
        },
      },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');

    const info: any = (consulta as any).optometriaInforme;
    if (!info) throw new BadRequestException('La consulta no tiene informe de optometría');

    const pdfDir = path.join(process.cwd(), 'uploads', 'hce');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `devolucion-${consultaId}.pdf`);

    const firma = consulta.firmas[0];
    return buildDevolucionOptometriaPdf(
      { consulta, hashDocumento: firma?.hashDocumento || hashDocumento },
      pdfPath,
    );
  }

  /** Devuelve la ruta del PDF de la devolución de resultados si existe (para descarga). */
  async getDevolucionPdfPath(consultaId: string): Promise<string> {
    const firma = await this.prisma.firma.findFirst({
      where: { consultaId, tipo: 'DEVOLUCION_RESULTADOS' },
    });
    if (!firma) {
      throw new BadRequestException('La devolución de resultados no ha sido generada para esta consulta');
    }
    const pdfPath = path.join(process.cwd(), 'uploads', 'hce', `devolucion-${consultaId}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      // Regenerar si el archivo se perdió (ej: rebuild de dist/)
      return this.generateDevolucionPdf(consultaId, firma.hashDocumento || '');
    }
    return pdfPath;
  }

  // ── Diagnósticos ──

  // ── PDF Generation ──

  private async generateConsultaPdf(consultaId: string): Promise<string> {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id: consultaId },
      include: {
        paciente: {
          include: {
            antecedentes: {
              where: { activo: true },
              orderBy: [{ ambito: 'asc' }, { fecha: 'desc' }],
            },
            historialAlergias: { where: { activa: true } },
            habitos: true,
          },
        },
        especialista: true,
        cita: { select: { fecha: true, horaInicio: true, horaFin: true, lugar: true } },
        diagnosticos: true,
        prescripciones: true,
        evoluciones: true,
        pedidos: true,
        examenes: true,
        indicaciones: true,
        signosVitales: { orderBy: { createdAt: 'desc' } },
        firmas: { where: { tipo: 'CIERRE_HC' }, orderBy: { fechaFirma: 'desc' }, take: 1 },
        evaluacionNeuroconductual: true,
        evaluacionNeuropsicometrica: true,
        discusionDiagnostica: true,
        planTratamiento: { include: { objetivos: { orderBy: { numero: 'asc' } } } },
        optometriaInforme: true,
      },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');

    const pdfDir = path.join(process.cwd(), 'uploads', 'hce');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `${consultaId}.pdf`);

    // Optometría: Historia Clínica completa con el formato institucional.
    // El resto de especialidades conserva el PDF genérico.
    if (esOptometria(consulta.especialista?.especialidad)) {
      return buildHistoriaClinicaOptometriaPdf(
        { consulta, hashDocumento: consulta.firmas[0]?.hashDocumento },
        pdfPath,
      );
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      doc.fontSize(18).text('Historia Clinica Electronica', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Instituto de Neurociencias — Ecuador`, { align: 'center' });
      if (consulta.numeroConsulta) {
        doc.fontSize(11).text(`Consulta #${String(consulta.numeroConsulta).padStart(3, '0')}`, { align: 'center' });
      }
      doc.moveDown(1);

      doc.fontSize(10);
      doc.text(`Paciente: ${consulta.paciente.nombres} ${consulta.paciente.apellidos}`);
      doc.text(`Identificacion: ${consulta.paciente.numeroIdentificacion}`);
      doc.text(`Especialista: ${consulta.especialista.primerNombre || ''} ${consulta.especialista.primerApellido || ''}`);
      doc.text(`Especialidad: ${consulta.especialista.especialidad || ''}`);
      const firma = consulta.firmas[0];
      if (firma) doc.text(`Firmado: ${new Date(firma.fechaFirma).toLocaleString('es-EC')}`);
      doc.moveDown(1);

      doc.fontSize(12).text('Datos de la Consulta', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      if (consulta.tipoConsulta) doc.text(`Tipo de consulta: ${consulta.tipoConsulta}`);
      if (consulta.condicionConsulta) doc.text(`Condicion: ${consulta.condicionConsulta}`);
      if (consulta.formaConsulta) doc.text(`Forma: ${consulta.formaConsulta}`);
      if (consulta.tipoAtencion) doc.text(`Tipo de atencion: ${consulta.tipoAtencion}`);
      doc.text(`Motivo de consulta: ${consulta.motivoConsulta || '—'}`);
      doc.text(`Enfermedad actual: ${consulta.enfermedadActual || '—'}`);
      doc.moveDown(0.5);

      if (consulta.signosVitales.length > 0) {
        doc.fontSize(12).text('Signos Vitales', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10);
        const sv = consulta.signosVitales[0];
        doc.text(`PA: ${sv.presionArterial || '—'} | FC: ${sv.frecuenciaCardiaca || '—'} | Temp: ${sv.temperatura || '—'} | SpO2: ${sv.saturacionOxigeno || '—'}%`);
        doc.text(`Peso: ${sv.peso || '—'} | Talla: ${sv.talla || '—'} | Dolor EVA: ${sv.dolorEVA || '—'}`);
        doc.moveDown(0.5);
      }

      if (consulta.diagnosticos.length > 0) {
        doc.fontSize(12).text('Diagnosticos', { underline: true });
        doc.moveDown(0.3);
        consulta.diagnosticos.forEach((d) => {
          const estado = d.estado === 'PRESUNTIVO' ? ' (presuntivo)' : '';
          doc.fontSize(10).text(`${d.sistema || 'CIE10'} ${d.codigo || d.codigoCIE10}: ${d.descripcion}${estado}`);
        });
        doc.moveDown(0.5);
      }

      if (consulta.prescripciones.length > 0) {
        doc.fontSize(12).text('Prescripciones', { underline: true });
        doc.moveDown(0.3);
        consulta.prescripciones.forEach((p) => {
          doc.fontSize(10).text(`${p.medicamento} — ${p.dosis} ${p.via || ''}, ${p.frecuencia}, ${p.duracion || ''}`);
          if (p.indicaciones) doc.text(`  Indicaciones: ${p.indicaciones}`);
        });
        doc.moveDown(0.5);
      }

      if (consulta.evoluciones.length > 0) {
        doc.fontSize(12).text('Evolucion', { underline: true });
        doc.moveDown(0.3);
        consulta.evoluciones.forEach((ev) => {
          doc.fontSize(10);
          const texto = ev.nota
            || [ev.subjetivo, ev.objetivo, ev.analisis, ev.plan].filter(Boolean).join('\n');
          if (texto) doc.text(texto);
          doc.text(`Registrada: ${new Date(ev.createdAt).toLocaleString('es-EC')}`);
        });
        doc.moveDown(0.5);
      }

      const enc: any = (consulta as any).evaluacionNeuroconductual;
      if (enc) {
        doc.fontSize(12).text('Evaluacion Neuroconductual', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10);
        const camposEnc: Array<[string, any]> = [
          ['Funcion motora', enc.funcionMotora],
          ['Juicio e insight', enc.juicioInsight],
          ['Aprendizaje y memoria', enc.aprendizajeMemoria],
          ['Conciencia', enc.conciencia],
          ['Lenguaje', enc.lenguaje],
          ['Vision espacial y construccional', enc.visionEspacialConstruccional],
          ['Atencion y memoria de trabajo', enc.atencionMemoriaTrabajo],
          ['Habilidades aritmeticas', enc.habilidadesAritmeticas],
          ['Abstraccion y razonamiento', enc.abstraccionRazonamiento],
          ['Afectividad', enc.afectividad],
          ['Percepcion y pensamiento', enc.percepcionPensamiento],
          ['Descripcion general', enc.descripcionGeneral],
          ['Orientacion', enc.orientacion],
          ['Funciones cognitivas y relacion', enc.funcionesCognitivasRelacion],
        ];
        camposEnc.forEach(([label, v]) => { if (v) doc.text(`${label}: ${v}`); });
        doc.moveDown(0.5);
      }

      const enp: any = (consulta as any).evaluacionNeuropsicometrica;
      if (enp) {
        doc.fontSize(12).text('Evaluacion Neuropsicometrica', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10);
        const camposEnp: Array<[string, any]> = [
          ['Alerta', enp.alerta],
          ['Funciones motoras', enp.funcionesMotoras],
          ['Orientacion', enp.orientacion],
          ['Atencion y concentracion', enp.atencionConcentracion],
          ['Memoria', enp.memoria],
          ['Lenguaje', enp.lenguaje],
          ['Lectura', enp.lectura],
          ['Escritura', enp.escritura],
          ['Calculo', enp.calculo],
          ['Habilidades motoras complejas', enp.habilidadesMotorasComplejas],
          ['Habilidades visoperceptuales', enp.habilidadesVisoperceptuales],
          ['Problemas afectivos', enp.problemasAfectivos],
          ['Otras valoraciones', enp.otrasValoraciones],
        ];
        camposEnp.forEach(([label, v]) => { if (v) doc.text(`${label}: ${v}`); });
        doc.moveDown(0.5);
      }

      const dd: any = (consulta as any).discusionDiagnostica;
      if (dd && (dd.diagnosticoClinico || dd.discusionGeneral)) {
        doc.fontSize(12).text('Discusion Diagnostica', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10);
        if (dd.diagnosticoClinico) doc.text(`Diagnostico clinico: ${dd.diagnosticoClinico}`);
        if (dd.discusionGeneral) doc.text(`Discusion: ${dd.discusionGeneral}`);
        doc.moveDown(0.5);
      }

      const plan: any = (consulta as any).planTratamiento;
      if (plan) {
        doc.fontSize(12).text('Plan de Tratamiento Neuropsicologico', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10);
        doc.text(`Numero de citas asignadas: ${plan.numeroCitas}`);
        doc.text(`Estado: ${plan.estado}`);
        if (plan.motivoExtension) {
          doc.text(`Extension (+${plan.citasExtension ?? ''} citas): ${plan.motivoExtension}`);
        }
        (plan.objetivos || []).forEach((o: any) => {
          doc.text(`Objetivo ${o.numero}: ${o.descripcion}`);
          if (plan.estado === 'FINALIZADO') {
            doc.text(`  Resultado escala: ${o.resultadoFinal ?? '—'} (+2 a -2)`);
          }
          const niveles: Array<[string, any, any]> = [
            ['+2', o.escalaMas2, o.obsMas2],
            ['+1', o.escalaMas1, o.obsMas1],
            ['0', o.escalaCero, o.obsCero],
            ['-1', o.escalaMenos1, o.obsMenos1],
            ['-2', o.escalaMenos2, o.obsMenos2],
          ];
          niveles.forEach(([esc, obj, obs]) => {
            if (obj || obs) {
              doc.text(`  Escala ${esc} — Objetivo: ${obj || '—'} | Observación: ${obs || '—'}`);
            }
          });
          if (o.observacion) doc.text(`  Observación general: ${o.observacion}`);
        });
        doc.moveDown(0.5);
      }

      if (firma) {
        doc.moveDown(1);
        doc.text(`Hash del documento (SHA-256):`, { align: 'center' });
        doc.fontSize(8).text(firma.hashDocumento ?? '-', { align: 'center' });
      }

      doc.end();
      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    });
  }
  async addDiagnostico(consultaId: string, dto: AddDiagnosticoDto) {
    await this.assertConsultaEditable(consultaId);
    const sistema = dto.sistema || 'CIE10';
    const codigo = (dto.codigo || dto.codigoCIE10 || '').trim();
    if (!codigo) {
      throw new BadRequestException('Debe indicar el código del diagnóstico');
    }
    return this.prisma.diagnostico.create({
      data: {
        consultaId,
        codigoCIE10: codigo,
        codigo,
        descripcion: dto.descripcion,
        tipo: dto.tipo,
        esPrincipal: dto.esPrincipal,
        orden: dto.orden,
        sistema,
        estado: dto.estado || 'DEFINITIVO',
        observacion: dto.observacion,
      },
    });
  }

  async confirmarDiagnostico(id: string, userId: string, userRol?: string) {
    const row = await this.prisma.diagnostico.findUnique({
      where: { id },
      include: {
        consulta: {
          select: {
            especialista: { select: { usuarioId: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Diagnóstico no encontrado');

    // Solo el especialista titular (o Administración principal) puede confirmar.
    // Se permite confirmar después de firmar: el diagnóstico definitivo es una
    // actualización de estado, no una modificación del contenido firmado.
    if (userRol === 'ESPECIALISTA' && row.consulta.especialista?.usuarioId !== userId) {
      throw new ForbiddenException('Solo el especialista titular puede confirmar este diagnóstico');
    }

    return this.prisma.diagnostico.update({
      where: { id },
      data: { estado: 'DEFINITIVO', confirmadoPorId: userId, confirmadoEn: new Date() },
    });
  }

  async removeDiagnostico(id: string) {
    const row = await this.prisma.diagnostico.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Diagnostico no encontrado');
    await this.assertConsultaEditable(row.consultaId);
    await this.prisma.diagnostico.delete({ where: { id } });
  }

  // ── Prescripciones ──
  async addPrescripcion(consultaId: string, dto: AddPrescripcionDto) {
    await this.assertConsultaEditable(consultaId);
    return this.prisma.prescripcion.create({
      data: { consultaId, ...dto },
    });
  }

  async removePrescripcion(id: string) {
    const row = await this.prisma.prescripcion.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Prescripcion no encontrada');
    await this.assertConsultaEditable(row.consultaId);
    await this.prisma.prescripcion.delete({ where: { id } });
  }

  // ── Evoluciones ──
  async addEvolucionFromConsulta(consultaId: string, dto: AddEvolucionDto, userId?: string, userRol?: string) {
    const consulta = await this.findConsultaOrFail(consultaId);
    if (consulta.firmada) {
      throw new ConflictException({ code: 'HC_CERRADA', message: 'La consulta ya fue firmada y no se puede modificar' });
    }
    await this.assertTitularConsulta(consulta, userId, userRol);

    const nota = dto.nota?.trim()
      || [dto.subjetivo, dto.objetivo, dto.analisis, dto.plan].filter(Boolean).join('\n').trim();
    if (!nota) {
      throw new BadRequestException('Debe escribir la evolución del paciente');
    }

    return this.prisma.evolucion.create({
      data: {
        consultaId,
        pacienteId: consulta.pacienteId,
        especialistaId: consulta.especialistaId,
        nota,
        tipo: 'NOTA',
        subjetivo: dto.subjetivo,
        objetivo: dto.objetivo,
        analisis: dto.analisis,
        plan: dto.plan,
      },
    });
  }

  async addEvolucion(consultaId: string, pacienteId: string, especialistaId: string, dto: AddEvolucionDto) {
    const nota = dto.nota?.trim()
      || [dto.subjetivo, dto.objetivo, dto.analisis, dto.plan].filter(Boolean).join('\n').trim();
    return this.prisma.evolucion.create({
      data: {
        consultaId,
        pacienteId,
        especialistaId,
        nota,
        ...dto,
      },
    });
  }

  // ── Pedidos ──
  async addPedido(consultaId: string, dto: AddPedidoDto) {
    await this.assertConsultaEditable(consultaId);
    return this.prisma.pedidoExamen.create({
      data: { consultaId, ...dto },
    });
  }

  // ── Indicaciones ──
  async addIndicacion(consultaId: string, dto: AddIndicacionDto) {
    await this.assertConsultaEditable(consultaId);
    return this.prisma.indicacion.create({
      data: { consultaId, tipo: dto.tipo, descripcion: dto.descripcion },
    });
  }

  async removePedido(id: string) {
    const row = await this.prisma.pedidoExamen.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Pedido no encontrado');
    await this.assertConsultaEditable(row.consultaId);
    await this.prisma.pedidoExamen.delete({ where: { id } });
  }

  async removeIndicacion(id: string) {
    const row = await this.prisma.indicacion.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Indicacion no encontrada');
    await this.assertConsultaEditable(row.consultaId);
    await this.prisma.indicacion.delete({ where: { id } });
  }

  // ── Signos Vitales ──
  async addSignoVital(pacienteId: string, dto: AddSignoVitalDto) {
    if (dto.consultaId) {
      const consulta = await this.findConsultaOrFail(dto.consultaId);
      if (consulta.firmada) {
        throw new ConflictException({ code: 'HC_CERRADA', message: 'La consulta ya fue firmada y no se puede modificar' });
      }
      if (consulta.pacienteId !== pacienteId) {
        throw new BadRequestException('consultaId no pertenece al paciente');
      }
    }
    return this.prisma.signoVital.create({
      data: {
        pacienteId,
        consultaId: dto.consultaId ?? null,
        presionArterial: dto.presionArterial,
        frecuenciaCardiaca: dto.frecuenciaCardiaca ?? null,
        temperatura: dto.temperatura ?? null,
        peso: dto.peso ?? null,
        talla: dto.talla ?? null,
        imc: dto.imc ?? null,
        dolorEVA: dto.dolorEVA ?? null,
        observaciones: dto.observaciones,
      },
    });
  }

  // ── Vacunas ──
  async getVacunas(pacienteId: string) {
    return this.prisma.vacuna.findMany({
      where: { pacienteId },
      orderBy: { fecha: 'desc' },
    });
  }

  async addVacuna(pacienteId: string, dto: AddVacunaDto) {
    return this.prisma.vacuna.create({
      data: {
        pacienteId,
        nombre: dto.nombre,
        fecha: new Date(dto.fecha),
        dosis: dto.dosis,
        lote: dto.lote,
        aplicadoPor: dto.aplicadoPor,
      },
    });
  }

  // ── Inicializar módulos para una especialidad ──
  async inicializarModulos(especialidad: string) {
    const existing = await this.prisma.especialidadModuloHCE.findMany({ where: { especialidad } });
    if (existing.length > 0) return existing;

    await this.prisma.especialidadModuloHCE.createMany({
      data: MODULOS_HCE.map(m => ({
        especialidad,
        modulo: m.key,
        habilitado: false,
        orden: m.orden,
      })),
    });

    return this.prisma.especialidadModuloHCE.findMany({ where: { especialidad } });
  }

  // ── Examen Mental ──
  async saveExamenMental(consultaId: string, dto: ExamenMentalDto) {
    await this.findConsultaOrFail(consultaId);

    return this.prisma.examenMental.upsert({
      where: { consultaId },
      create: { consultaId, ...dto },
      update: dto,
    });
  }

  async getExamenMental(consultaId: string) {
    return this.prisma.examenMental.findUnique({ where: { consultaId } });
  }

  // ── Historia Familiar ──
  async saveHistoriaFamiliar(consultaId: string, dto: HistoriaFamiliarDto) {
    await this.findConsultaOrFail(consultaId);

    return this.prisma.historiaFamiliar.upsert({
      where: { consultaId },
      create: { consultaId, ...dto },
      update: dto,
    });
  }

  async getHistoriaFamiliar(consultaId: string) {
    return this.prisma.historiaFamiliar.findUnique({ where: { consultaId } });
  }

  // ── Neuropsicología: Evaluación Neuroconductual ──
  async saveEvalNeuroconductual(consultaId: string, dto: SaveEvalNeuroconductualDto) {
    await this.findConsultaOrFail(consultaId);

    return this.prisma.evaluacionNeuroconductual.upsert({
      where: { consultaId },
      create: { consultaId, ...dto },
      update: dto,
    });
  }

  async getEvalNeuroconductual(consultaId: string) {
    return this.prisma.evaluacionNeuroconductual.findUnique({ where: { consultaId } });
  }

  // ── Neuropsicología: Evaluación Neuropsicométrica ──
  async saveEvalNeuropsicometrica(consultaId: string, dto: SaveEvalNeuropsicometricaDto) {
    await this.findConsultaOrFail(consultaId);

    return this.prisma.evaluacionNeuropsicometrica.upsert({
      where: { consultaId },
      create: { consultaId, ...dto },
      update: dto,
    });
  }

  async getEvalNeuropsicometrica(consultaId: string) {
    return this.prisma.evaluacionNeuropsicometrica.findUnique({ where: { consultaId } });
  }

  // ── Neuropsicología: Discusión Diagnóstica ──
  async saveDiscusionDiagnostica(consultaId: string, dto: SaveDiscusionDiagnosticaDto) {
    await this.findConsultaOrFail(consultaId);

    return this.prisma.discusionDiagnostica.upsert({
      where: { consultaId },
      create: { consultaId, ...dto },
      update: dto,
    });
  }

  async getDiscusionDiagnostica(consultaId: string) {
    return this.prisma.discusionDiagnostica.findUnique({ where: { consultaId } });
  }

  // ── Optometría: Informe Integral ──
  async saveOptometria(consultaId: string, dto: SaveOptometriaDto) {
    await this.assertConsultaEditable(consultaId);

    const data: Record<string, any> = {};
    for (const [k, v] of Object.entries(dto)) {
      if (v !== undefined) data[k] = v;
    }
    // El formato Tamizaje está discontinuado: todo informe se guarda como Integral.
    data.tipo = 'INTEGRAL';

    return this.prisma.optometriaInforme.upsert({
      where: { consultaId },
      create: { consultaId, ...data },
      update: data,
    });
  }

  async getOptometria(consultaId: string) {
    return this.prisma.optometriaInforme.findUnique({ where: { consultaId } });
  }

  // ── Neuropsicología: Plan de Tratamiento (SMART +2..-2) ──
  private findPlanOrFail(planId: string) {
    return this.prisma.planTratamientoNeuropsi.findUnique({
      where: { id: planId },
      include: { objetivos: { orderBy: { numero: 'asc' } } },
    }).then((plan) => {
      if (!plan) throw new NotFoundException('Plan de tratamiento no encontrado');
      return plan;
    });
  }

  private validarObjetivosCompletos(objetivos: any[]) {
    for (const o of objetivos || []) {
      const incompleto =
        !o?.descripcion?.trim() ||
        !o?.escalaMas2?.trim() ||
        !o?.escalaMas1?.trim() ||
        !o?.escalaCero?.trim() ||
        !o?.escalaMenos1?.trim() ||
        !o?.escalaMenos2?.trim();
      if (incompleto) {
        throw new BadRequestException('Cada objetivo debe tener descripción y los 5 niveles de escala (+2 a -2) completos');
      }
    }
  }

  async createPlanTratamiento(consultaId: string, dto: CreatePlanTratamientoDto) {
    const consulta = await this.findConsultaOrFail(consultaId);
    const existing = await this.prisma.planTratamientoNeuropsi.findUnique({ where: { consultaId } });
    if (existing) throw new ConflictException('Ya existe un plan de tratamiento para esta consulta');
    this.validarObjetivosCompletos(dto.objetivos);

    return this.prisma.planTratamientoNeuropsi.create({
      data: {
        consultaId,
        pacienteId: consulta.pacienteId,
        especialistaId: consulta.especialistaId,
        numeroCitas: dto.numeroCitas,
        estado: 'BORRADOR',
        objetivos: {
          create: dto.objetivos.map((o) => ({
            numero: o.numero,
            descripcion: o.descripcion,
            escalaMas2: o.escalaMas2,
            escalaMas1: o.escalaMas1,
            escalaCero: o.escalaCero,
            escalaMenos1: o.escalaMenos1,
            escalaMenos2: o.escalaMenos2,
            obsMas2: o.obsMas2,
            obsMas1: o.obsMas1,
            obsCero: o.obsCero,
            obsMenos1: o.obsMenos1,
            obsMenos2: o.obsMenos2,
            observacion: o.observacion,
          })),
        },
      },
      include: { objetivos: { orderBy: { numero: 'asc' } } },
    });
  }

  async getPlanTratamiento(consultaId: string) {
    return this.prisma.planTratamientoNeuropsi.findUnique({
      where: { consultaId },
      include: { objetivos: { orderBy: { numero: 'asc' } } },
    });
  }

  async updatePlanTratamiento(planId: string, dto: UpdatePlanTratamientoDto) {
    const plan = await this.findPlanOrFail(planId);
    if (plan.estado === 'FINALIZADO') {
      throw new BadRequestException('El plan ya está finalizado y no puede editarse');
    }
    // El número de citas se fija al crear el plan y no se puede modificar después
    if (dto.numeroCitas !== undefined && dto.numeroCitas !== plan.numeroCitas) {
      throw new BadRequestException('El número de citas no se puede modificar una vez guardado');
    }

    if (dto.objetivos) {
      this.validarObjetivosCompletos(dto.objetivos);
      await this.prisma.objetivoTratamiento.deleteMany({ where: { planId } });
    }

    return this.prisma.planTratamientoNeuropsi.update({
      where: { id: planId },
      data: {
        ...(plan.estado === 'BORRADOR' ? { estado: 'EN_CURSO' } : {}),
        ...(dto.objetivos
          ? {
              objetivos: {
                create: dto.objetivos.map((o) => ({
                  numero: o.numero,
                  descripcion: o.descripcion,
                  escalaMas2: o.escalaMas2,
                  escalaMas1: o.escalaMas1,
                  escalaCero: o.escalaCero,
                  escalaMenos1: o.escalaMenos1,
                  escalaMenos2: o.escalaMenos2,
                  observacion: o.observacion,
                })),
              },
            }
          : {}),
      },
      include: { objetivos: { orderBy: { numero: 'asc' } } },
    });
  }

  async extenderPlanTratamiento(planId: string, dto: ExtenderPlanDto) {
    const plan = await this.findPlanOrFail(planId);
    if (plan.estado === 'FINALIZADO') {
      throw new BadRequestException('El plan ya está finalizado y no puede extenderse');
    }
    if (plan.extensionUsada) {
      throw new BadRequestException('El plan ya fue extendido una vez. No se permite una segunda extensión');
    }

    return this.prisma.planTratamientoNeuropsi.update({
      where: { id: planId },
      data: {
        citasExtension: dto.citasExtension,
        motivoExtension: dto.motivo,
        extensionUsada: true,
        estado: 'EXTENDIDO',
      },
      include: { objetivos: { orderBy: { numero: 'asc' } } },
    });
  }

  async finalizarPlanTratamiento(planId: string, dto: FinalizarPlanDto) {
    const plan = await this.findPlanOrFail(planId);
    if (plan.estado === 'FINALIZADO') {
      throw new BadRequestException('El plan ya está finalizado');
    }

    // Exige resultado de escala (+2..-2) por cada objetivo del plan
    const numerosPlan = plan.objetivos.map((o) => o.numero).sort();
    const numerosDto = dto.resultados.map((r) => r.numero).sort();
    if (numerosPlan.length !== numerosDto.length || !numerosPlan.every((n, i) => n === numerosDto[i])) {
      throw new BadRequestException('Debe seleccionar un valor de la escala (+2 a -2) por cada objetivo para finalizar');
    }

    for (const r of dto.resultados) {
      await this.prisma.objetivoTratamiento.updateMany({
        where: { planId, numero: r.numero },
        data: { resultadoFinal: r.resultadoFinal },
      });
    }

    return this.prisma.planTratamientoNeuropsi.update({
      where: { id: planId },
      data: { estado: 'FINALIZADO' },
      include: { objetivos: { orderBy: { numero: 'asc' } } },
    });
  }

  // ── Tratamientos públicos: todas las especialidades del paciente ──
  async getTratamientosPaciente(pacienteId: string) {
    const consultas = await this.prisma.consultaHCE.findMany({
      where: { pacienteId },
      select: {
        id: true,
        createdAt: true,
        especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
        prescripciones: true,
        planTratamiento: { include: { objetivos: { orderBy: { numero: 'asc' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return consultas.map((c) => {
      const plan = c.planTratamiento;
      // Objetivos visibles siempre (solo lectura); el resultado final solo cuando está FINALIZADO.
      const objetivos = (plan?.objetivos || []).map((o) => ({
        numero: o.numero,
        descripcion: o.descripcion,
        escalaMas2: o.escalaMas2,
        escalaMas1: o.escalaMas1,
        escalaCero: o.escalaCero,
        escalaMenos1: o.escalaMenos1,
        escalaMenos2: o.escalaMenos2,
        obsMas2: o.obsMas2,
        obsMas1: o.obsMas1,
        obsCero: o.obsCero,
        obsMenos1: o.obsMenos1,
        obsMenos2: o.obsMenos2,
        resultadoFinal: o.resultadoFinal,
      }));
      return {
        consultaId: c.id,
        fecha: c.createdAt,
        especialidad: c.especialista?.especialidad ?? null,
        especialistaId: c.especialista?.id ?? null,
        especialista: c.especialista ? `${c.especialista.nombres} ${c.especialista.apellidos}` : null,
        prescripciones: c.prescripciones,
        planTratamiento: plan
          ? {
              id: plan.id,
              estado: plan.estado,
              totalObjetivos: plan.objetivos.length,
              objetivos,
            }
          : null,
      };
    });
  }

  // ── Examenes complementarios con archivo local ──
  async uploadExamen(
    consultaId: string,
    pacienteId: string,
    file: any,
    data: {
      nombre: string;
      resultados?: string;
      fechaResultado?: string;
      fase?: string;
    },
  ) {
    await this.findConsultaOrFail(consultaId);

    const uploadDir = path.join(process.cwd(), 'uploads', 'examenes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    return this.prisma.examenComplementario.create({
      data: {
        pacienteId,
        consultaId,
        nombre: data.nombre,
        resultado: data.resultados,
        archivoUrl: `/uploads/examenes/${filename}`,
        fase: data.fase,
        tipo: 'EXAMEN',
        fecha: data.fechaResultado ? new Date(data.fechaResultado) : new Date(),
      },
    });
  }

  // ── CIE-10 search (local data) ──
  async searchCIE10(query: string) {
    const cieData = this.getDiagnosticosCatalog('CIE10');
    const q = this.normalizarBusqueda(query);
    return cieData
      .filter(
        (item) =>
          this.normalizarBusqueda(item.codigo).includes(q) ||
          this.normalizarBusqueda(item.descripcion).includes(q),
      )
      .slice(0, 20);
  }

  // ── Alergias ──
  async getAlergias(pacienteId: string) {
    return this.prisma.alergia.findMany({
      where: { pacienteId, activa: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addAlergia(pacienteId: string, dto: AddAlergiaDto) {
    return this.prisma.alergia.create({
      data: { pacienteId, ...dto },
    });
  }

  async removeAlergia(id: string) {
    await this.prisma.alergia.delete({ where: { id } });
  }

  // ── Hábitos ──
  async getHabitos(pacienteId: string) {
    return this.prisma.habito.findMany({
      where: { pacienteId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addHabito(pacienteId: string, dto: AddHabitoDto) {
    return this.prisma.habito.create({
      data: { pacienteId, ...dto },
    });
  }

  async removeHabito(id: string) {
    await this.prisma.habito.delete({ where: { id } });
  }

  // ── Problemas Activos ──
  async getProblemasActivos(pacienteId: string) {
    return this.prisma.problemaActivo.findMany({
      where: { pacienteId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addProblemaActivo(pacienteId: string, dto: AddProblemaActivoDto) {
    return this.prisma.problemaActivo.create({
      data: { pacienteId, ...dto },
    });
  }

  async resolverProblemaActivo(id: string) {
    return this.prisma.problemaActivo.update({
      where: { id },
      data: { estado: 'RESUELTO' },
    });
  }

  // ── Privacidad de evolución clínica ──
  private rolesVenEvoluciones(userRol?: string) {
    if (!userRol) return true; // llamadas internas
    return ['ADMIN', 'ADMISION_PRINCIPAL', 'AUDITOR'].includes(userRol);
  }

  private async assertTitularConsulta(consulta: { especialistaId: string }, userId?: string, userRol?: string) {
    if (!userRol || userRol !== 'ESPECIALISTA') return;
    const esp = await this.prisma.especialista.findUnique({
      where: { usuarioId: userId },
      select: { id: true },
    });
    if (!esp || esp.id !== consulta.especialistaId) {
      throw new ForbiddenException('Solo el especialista titular puede registrar o ver esta evolución');
    }
  }

  /** Verifica que el usuario pueda descargar el PDF de la consulta. */
  async assertPuedeDescargarConsulta(consultaId: string, userId?: string, userRol?: string) {
    if (!userRol) return; // llamadas internas

    if (userRol !== 'ESPECIALISTA') {
      // El PDF incluye la evolución clínica: solo Auditoría y Administración
      // principal pueden descargarlo además del especialista titular.
      if (!this.rolesVenEvoluciones(userRol)) {
        throw new ForbiddenException('No autorizado para descargar esta historia clínica');
      }
      return;
    }

    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id: consultaId },
      select: { especialista: { select: { usuarioId: true } } },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');
    if (consulta.especialista?.usuarioId !== userId) {
      throw new ForbiddenException('No autorizado para descargar esta historia clínica');
    }
  }

  // ── Antecedentes personales y familiares ──
  async getAntecedentes(pacienteId: string, ambito?: string) {
    return this.prisma.antecedente.findMany({
      where: { pacienteId, activo: true, ...(ambito ? { ambito } : {}) },
      orderBy: [{ ambito: 'asc' }, { categoria: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async addAntecedente(pacienteId: string, dto: AddAntecedenteDto, userId?: string) {
    const paciente = await this.prisma.paciente.findUnique({ where: { id: pacienteId }, select: { id: true } });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    return this.prisma.antecedente.create({
      data: {
        pacienteId,
        ambito: dto.ambito,
        categoria: dto.categoria,
        descripcion: dto.descripcion,
        parentesco: dto.ambito === 'FAMILIAR' ? dto.parentesco : null,
        observacion: dto.observacion,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        tipo: dto.ambito === 'FAMILIAR' ? 'FAMILIAR' : 'PERSONAL',
        registradoPorId: userId,
        activo: true,
      },
    });
  }

  // ── Historial clínico organizado ──
  async getHistorialClinico(pacienteId: string, userId?: string, userRol?: string) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: { historialAlergias: true },
    });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    let especialistaId: string | undefined;
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId }, select: { id: true } });
      if (!esp) throw new ForbiddenException('No autorizado');
      especialistaId = esp.id;
    }

    const [antecedentes, diagnosticos, recetas, certificados, altas, derivaciones, evoluciones] = await Promise.all([
      this.getAntecedentes(pacienteId),
      this.getHistorialDiagnosticos(pacienteId, userId, userRol),
      this.prisma.receta.findMany({
        where: { pacienteId },
        include: { items: { orderBy: { orden: 'asc' } }, especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } } },
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.certificadoMedico.findMany({
        where: { pacienteId },
        include: { especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.altaEspecialidad.findMany({
        where: { pacienteId },
        include: { especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.derivacion.findMany({
        where: { pacienteId },
        include: {
          especialistaOrigen: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
          destinos: { include: { especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } }, cita: { select: { id: true, fecha: true, horaInicio: true, estado: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (async () => {
        if (userRol && userRol !== 'ESPECIALISTA' && !this.rolesVenEvoluciones(userRol)) return [];
        return this.prisma.evolucion.findMany({
          where: { pacienteId, ...(especialistaId ? { especialistaId } : {}) },
          include: { especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } } },
          orderBy: { createdAt: 'desc' },
        });
      })(),
    ]);

    return {
      paciente: {
        id: paciente.id,
        nombres: paciente.nombres,
        apellidos: paciente.apellidos,
        numeroIdentificacion: paciente.numeroIdentificacion,
        fechaNacimiento: paciente.fechaNacimiento,
        telefono: paciente.telefono,
        grupoSanguineo: paciente.grupoSanguineo,
        alergias: paciente.alergias,
      },
      antecedentes: {
        personales: antecedentes.filter((a) => a.ambito !== 'FAMILIAR' && a.tipo !== 'FAMILIAR'),
        familiares: antecedentes.filter((a) => a.ambito === 'FAMILIAR' || a.tipo === 'FAMILIAR'),
      },
      diagnosticos,
      recetas,
      certificados,
      altas,
      derivaciones,
      evoluciones,
    };
  }

  /** Historial unificado de diagnósticos: código + sistema + estado; sin descripción para otros especialistas. */
  async getHistorialDiagnosticos(pacienteId: string, userId?: string, userRol?: string) {
    const [rows, configs, esp] = await Promise.all([
      this.prisma.diagnostico.findMany({
        where: { consulta: { pacienteId }, activo: true },
        include: {
          consulta: {
            select: {
              id: true,
              createdAt: true,
              especialista: { select: { id: true, usuarioId: true, nombres: true, apellidos: true, especialidad: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.hcePrivacidadConfig.findMany(),
      userRol === 'ESPECIALISTA'
        ? this.prisma.especialista.findUnique({ where: { usuarioId: userId }, select: { id: true } })
        : Promise.resolve(null),
    ]);

    const configMap = new Map(configs.map((c) => [c.especialidad, c.compartirDiagnosticos]));
    const esAdmin = !userRol || ['ADMIN', 'ADMISION_PRINCIPAL', 'AUDITOR'].includes(userRol);

    return rows
      .filter((d) => {
        const especialidad = d.consulta.especialista?.especialidad;
        const esAutor = userRol === 'ESPECIALISTA' && d.consulta.especialista?.usuarioId === userId;
        if (esAdmin || esAutor) return true;
        return configMap.get(especialidad) !== false;
      })
      .map((d) => {
        const esAutor = userRol === 'ESPECIALISTA' && d.consulta.especialista?.usuarioId === userId;
        const puedeVerDescripcion = esAdmin || esAutor;
        return {
          id: d.id,
          codigo: d.codigo || d.codigoCIE10,
          sistema: d.sistema || 'CIE10',
          estado: d.estado,
          descripcion: puedeVerDescripcion ? d.descripcion : null,
          tipo: d.tipo,
          fecha: d.createdAt,
          consultaId: d.consulta.id,
          especialidad: d.consulta.especialista?.especialidad ?? null,
          especialista: d.consulta.especialista
            ? `${d.consulta.especialista.nombres} ${d.consulta.especialista.apellidos}`
            : null,
          esMio: esAutor || (!!esp && d.consulta.especialista?.id === esp.id),
        };
      });
  }

  async getPrivacidadDiagnosticos() {
    const [especialidades, configs] = await Promise.all([
      this.prisma.especialidad.findMany({ orderBy: { nombre: 'asc' } }),
      this.prisma.hcePrivacidadConfig.findMany(),
    ]);
    const map = new Map(configs.map((c) => [c.especialidad, c.compartirDiagnosticos]));
    return especialidades.map((e) => ({
      especialidad: e.nombre,
      compartirDiagnosticos: map.get(e.nombre) ?? true,
    }));
  }

  async updatePrivacidadDiagnosticos(especialidad: string, dto: PrivacidadDiagnosticosDto) {
    return this.prisma.hcePrivacidadConfig.upsert({
      where: { especialidad },
      create: { especialidad, compartirDiagnosticos: dto.compartirDiagnosticos },
      update: { compartirDiagnosticos: dto.compartirDiagnosticos },
    });
  }

  // ── Búsqueda de diagnósticos CIE-10 / DSM-5 ──
  async searchDiagnosticos(query: string, sistema = 'CIE10') {
    const data = this.getDiagnosticosCatalog(sistema);
    const q = this.normalizarBusqueda(query);
    if (!q) return data.slice(0, 30);
    return data
      .filter((item) =>
        this.normalizarBusqueda(item.codigo).includes(q) ||
        this.normalizarBusqueda(item.descripcion).includes(q),
      )
      .slice(0, 30);
  }

  // ── Recetas médicas ──
  async generarReceta(consultaId: string, dto: GenerarRecetaDto, userId: string, userRol?: string) {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id: consultaId },
      include: {
        paciente: true,
        especialista: { include: { usuario: { select: { passwordHash: true } } } },
        signosVitales: { orderBy: { fecha: 'desc' }, take: 1 },
        diagnosticos: { orderBy: { esPrincipal: 'desc' } },
        discusionDiagnostica: true,
        cita: { select: { estado: true } },
      },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');
    await this.assertTitularConsulta(consulta, userId, userRol);
    if (consulta.cita?.estado === 'ATENDIDA') {
      throw new ConflictException('La cita ya está atendida; no se pueden emitir nuevas recetas');
    }

    const passwordHash = consulta.especialista?.usuario?.passwordHash;
    if (!passwordHash) throw new UnauthorizedException('No se puede verificar la identidad del especialista');
    const ok = await bcrypt.compare(dto.password, passwordHash);
    if (!ok) throw new UnauthorizedException('Contraseña incorrecta');

    const max = await this.prisma.receta.aggregate({
      where: { especialistaId: consulta.especialistaId },
      _max: { numeroReceta: true },
    });
    const numeroReceta = (max._max.numeroReceta ?? 0) + 1;

    const sv = consulta.signosVitales?.[0];
    const pesoCalc = dto.peso || (sv?.peso != null ? String(sv.peso) : undefined);
    const tallaCalc = dto.talla || (sv?.talla != null ? String(sv.talla) : undefined);
    const alergiasCalc = dto.alergias || consulta.paciente.alergias || undefined;

    // La receta debe reflejar TODOS los diagnósticos registrados, indicando
    // el sistema de cada uno (CIE-10 / DSM-5) y marcando el principal.
    const diagnosticosReceta = (consulta.diagnosticos || [])
      .map((d: any) => {
        const sistema = d.sistema === 'DSM5' ? 'DSM-5' : 'CIE-10';
        const codigo = String(d.codigoCIE10 || d.codigo || '').trim();
        const descripcion = String(d.descripcion || '').trim();
        const detalle = codigo ? `${codigo} - ${descripcion}`.trim() : descripcion;
        if (!detalle) return '';
        return `${sistema}${d.esPrincipal ? ' (Principal)' : ''}: ${detalle}`;
      })
      .filter(Boolean);
    const diagnosticoDiscusion = String(consulta.discusionDiagnostica?.diagnosticoClinico || '').trim();
    if (diagnosticoDiscusion) {
      const discusionNormalizada = this.normalizarBusqueda(diagnosticoDiscusion);
      const yaIncluido = discusionNormalizada
        && diagnosticosReceta.some((item) => this.normalizarBusqueda(item).includes(discusionNormalizada));
      if (!yaIncluido) diagnosticosReceta.push(`Discusión diagnóstica: ${diagnosticoDiscusion}`);
    }
    const diagCalc = diagnosticosReceta.length > 0
      ? diagnosticosReceta.join('; ')
      : (String(dto.diagnostico || '').trim() || undefined);

    const faltantes: string[] = [];
    if (!diagCalc || diagCalc.trim().length < 3) faltantes.push('diagnóstico CIE-10/DSM-5');
    dto.items.forEach((item, index) => {
      const obligatorios: Array<[string, string | null | undefined]> = [
        ['forma farmacéutica', item.formaFarmaceutica || item.presentacion],
        ['concentración', item.concentracion],
        ['vía de administración', item.via],
        ['cantidad en números', item.cantidad],
        ['cantidad en letras', item.cantidadLetras],
        ['dosis', item.dosis],
        ['frecuencia', item.frecuencia],
        ['duración', item.duracion],
      ];
      obligatorios.forEach(([etiqueta, valor]) => {
        if (!String(valor || '').trim()) faltantes.push(`${etiqueta} (medicamento ${index + 1})`);
      });
    });
    if (faltantes.length > 0) {
      throw new BadRequestException(`Complete los datos de la receta: ${faltantes.join(', ')}`);
    }

    const receta = await this.prisma.receta.create({
      data: {
        consultaId,
        pacienteId: consulta.pacienteId,
        especialistaId: consulta.especialistaId,
        numeroReceta,
        indicaciones: dto.indicaciones,
        estadoEnfermedad: dto.estadoEnfermedad || 'AGUDO',
        diagnostico: diagCalc,
        signosAlarma: dto.signosAlarma,
        recomendacionesNoFarmacologicas: dto.recomendacionesNoFarmacologicas || dto.indicaciones,
        peso: pesoCalc,
        talla: tallaCalc,
        alergias: alergiasCalc,
        validezDias: dto.validezDias ?? 3,
        items: {
          create: dto.items.map((item, index) => ({
            medicamento: item.medicamento,
            presentacion: item.presentacion,
            formaFarmaceutica: item.formaFarmaceutica,
            concentracion: item.concentracion,
            dosis: item.dosis,
            via: item.via,
            frecuencia: item.frecuencia,
            duracion: item.duracion,
            cantidad: item.cantidad,
            cantidadLetras: item.cantidadLetras,
            indicaciones: item.indicaciones,
            orden: index,
          })),
        },
      },
      include: { items: { orderBy: { orden: 'asc' } }, paciente: true, especialista: true },
    });

    const snapshot = JSON.stringify({
      tipo: 'RECETA_MEDICA',
      recetaId: receta.id,
      consultaId,
      pacienteId: consulta.pacienteId,
      especialistaId: consulta.especialistaId,
      numeroReceta,
      items: (receta as any).items,
      indicaciones: receta.indicaciones,
    });
    const hashDocumento = createHash('sha256').update(snapshot).digest('hex');

    await this.prisma.firma.create({
      data: {
        consultaId,
        usuarioId: userId,
        tipo: 'RECETA',
        hashDocumento,
        algoritmoHash: 'sha256',
      },
    });

    const pdfPath = await this.generateRecetaPdf(receta.id, hashDocumento);
    await this.prisma.receta.update({
      where: { id: receta.id },
      data: { firmada: true, firmadaEn: new Date(), archivoPdfUrl: pdfPath, hashDocumento },
    });

    return this.prisma.receta.findUnique({
      where: { id: receta.id },
      include: { items: { orderBy: { orden: 'asc' } }, paciente: true, especialista: true },
    });
  }

  async getRecetasConsulta(consultaId: string) {
    return this.prisma.receta.findMany({
      where: { consultaId },
      include: {
        items: { orderBy: { orden: 'asc' } },
        especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async getRecetasPaciente(pacienteId: string) {
    return this.prisma.receta.findMany({
      where: { pacienteId },
      include: {
        items: { orderBy: { orden: 'asc' } },
        especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async getRecetas(
    userId: string,
    userRol: string | undefined,
    filters: { pacienteId?: string; q?: string; desde?: string; hasta?: string; page?: string; limit?: string },
  ) {
    const where: any = {};

    if (userRol === 'ESPECIALISTA') {
      const especialista = await this.prisma.especialista.findUnique({ where: { usuarioId: userId } });
      if (!especialista) throw new NotFoundException('Especialista no encontrado');
      where.especialistaId = especialista.id;
    }

    if (filters.pacienteId) where.pacienteId = filters.pacienteId;

    const rawQ = (filters.q || '').trim();
    const q = this.normalizarBusqueda(rawQ);
    const terminos = Array.from(new Set([rawQ, q].filter(Boolean)));
    if (terminos.length) {
      const insensitive = /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL || '');
      const contains = (value: string) =>
        insensitive ? { contains: value, mode: 'insensitive' as const } : { contains: value };
      where.OR = terminos.flatMap((term) => [
        { paciente: { nombres: contains(term) } },
        { paciente: { apellidos: contains(term) } },
        { paciente: { numeroIdentificacion: contains(term) } },
        { especialista: { nombres: contains(term) } },
        { especialista: { apellidos: contains(term) } },
        { diagnostico: contains(term) },
      ]);
    }

    const desde = filters.desde ? new Date(filters.desde) : null;
    const hasta = filters.hasta ? new Date(filters.hasta) : null;
    if (hasta && !String(filters.hasta).includes('T')) hasta.setHours(23, 59, 59, 999);

    if ((desde && !Number.isNaN(desde.getTime())) || (hasta && !Number.isNaN(hasta.getTime()))) {
      where.fecha = {};
      if (desde && !Number.isNaN(desde.getTime())) where.fecha.gte = desde;
      if (hasta && !Number.isNaN(hasta.getTime())) where.fecha.lte = hasta;
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));

    const [data, total] = await this.prisma.$transaction([
      this.prisma.receta.findMany({
        where,
        include: {
          items: { orderBy: { orden: 'asc' } },
          paciente: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              numeroIdentificacion: true,
            },
          },
          especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.receta.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getReceta(id: string) {
    const receta = await this.prisma.receta.findUnique({
      where: { id },
      include: { items: { orderBy: { orden: 'asc' } }, paciente: true, especialista: true },
    });
    if (!receta) throw new NotFoundException('Receta no encontrada');
    return receta;
  }

  async getRecetaPdfPath(id: string) {
    const receta = await this.prisma.receta.findUnique({ where: { id } });
    if (!receta) throw new NotFoundException('Receta no encontrada');
    if (receta.archivoPdfUrl && fs.existsSync(receta.archivoPdfUrl)) {
      return receta.archivoPdfUrl;
    }
    const firma = await this.prisma.firma.findFirst({
      where: { consultaId: receta.consultaId, tipo: 'RECETA' },
      orderBy: { fechaFirma: 'desc' },
    });
    const hash = receta.hashDocumento || firma?.hashDocumento || 'sha256-receta-regenerada';
    const pdfPath = await this.generateRecetaPdf(receta.id, hash);
    await this.prisma.receta.update({
      where: { id: receta.id },
      data: { archivoPdfUrl: pdfPath, hashDocumento: hash },
    });
    return pdfPath;
  }

  private async generateRecetaPdf(recetaId: string, hashDocumento: string): Promise<string> {
    const receta = await this.prisma.receta.findUnique({
      where: { id: recetaId },
      include: { items: { orderBy: { orden: 'asc' } }, paciente: true, especialista: true },
    });
    if (!receta) throw new NotFoundException('Receta no encontrada');

    const pdfDir = path.join(process.cwd(), 'uploads', 'hce');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, 'receta-' + receta.id + '.pdf');

    return buildRecetaPdf({
      numeroReceta: receta.numeroReceta,
      fecha: receta.fecha,
      validezDias: (receta as any).validezDias ?? 3,
      estadoEnfermedad: (receta as any).estadoEnfermedad,
      diagnostico: (receta as any).diagnostico,
      signosAlarma: (receta as any).signosAlarma,
      recomendacionesNoFarmacologicas: (receta as any).recomendacionesNoFarmacologicas || receta.indicaciones,
      peso: (receta as any).peso,
      talla: (receta as any).talla,
      alergias: (receta as any).alergias,
      paciente: receta.paciente,
      especialista: receta.especialista,
      items: receta.items,
      hashDocumento,
    }, pdfPath);
  }

  // ── Certificados de asistencia y reposo ──
  async generarCertificado(consultaId: string, dto: GenerarCertificadoDto, userId: string, userRol?: string) {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id: consultaId },
      include: {
        paciente: true,
        especialista: { include: { usuario: { select: { passwordHash: true } } } },
        cita: { select: { fecha: true, horaInicio: true, horaFin: true } },
      },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');
    if (!consulta.firmada) {
      throw new BadRequestException('La consulta debe estar firmada para emitir el certificado');
    }
    await this.assertTitularConsulta(consulta, userId, userRol);

    const passwordHash = consulta.especialista?.usuario?.passwordHash;
    if (!passwordHash) throw new UnauthorizedException('No se puede verificar la identidad del especialista');
    const ok = await bcrypt.compare(dto.password, passwordHash);
    if (!ok) throw new UnauthorizedException('Contraseña incorrecta');

    let diasReposo = dto.diasReposo;
    let fechaInicio = dto.fechaInicio ? new Date(dto.fechaInicio) : undefined;
    let fechaFin = dto.fechaFin ? new Date(dto.fechaFin) : undefined;
    if (dto.tipo === 'REPOSO') {
      if (!diasReposo && fechaInicio && fechaFin) {
        diasReposo = Math.max(1, Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / 86400000) + 1);
      }
      if (!diasReposo) throw new BadRequestException('Debe indicar los días de reposo');
      if (!fechaInicio) fechaInicio = new Date();
      if (!fechaFin) {
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + diasReposo - 1);
      }
    }

    const certificado = await this.prisma.certificadoMedico.create({
      data: {
        consultaId,
        pacienteId: consulta.pacienteId,
        especialistaId: consulta.especialistaId,
        tipo: dto.tipo,
        motivo: dto.motivo,
        observaciones: dto.observaciones,
        diasReposo,
        fechaInicio,
        fechaFin,
      },
    });

    const snapshot = JSON.stringify({
      tipo: `CERTIFICADO_${dto.tipo}`,
      certificadoId: certificado.id,
      consultaId,
      pacienteId: consulta.pacienteId,
      fecha: consulta.cita?.fecha,
      diasReposo,
      fechaInicio,
      fechaFin,
      motivo: dto.motivo,
      observaciones: dto.observaciones,
    });
    const hashDocumento = createHash('sha256').update(snapshot).digest('hex');

    await this.prisma.firma.create({
      data: {
        consultaId,
        usuarioId: userId,
        tipo: `CERTIFICADO_${dto.tipo}`,
        hashDocumento,
        algoritmoHash: 'sha256',
      },
    });

    const pdfPath = await this.generateCertificadoMedicoPdf(certificado.id, hashDocumento);
    return this.prisma.certificadoMedico.update({
      where: { id: certificado.id },
      data: { hashDocumento, archivoPdfUrl: pdfPath },
    });
  }

  async getCertificadosPaciente(pacienteId: string) {
    return this.prisma.certificadoMedico.findMany({
      where: { pacienteId },
      include: { especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCertificadoMedicoPdfPath(id: string) {
    const certificado = await this.prisma.certificadoMedico.findUnique({ where: { id } });
    if (!certificado) throw new NotFoundException('Certificado no encontrado');
    if (!certificado.archivoPdfUrl || !fs.existsSync(certificado.archivoPdfUrl)) {
      throw new NotFoundException('PDF de certificado no disponible');
    }
    return certificado.archivoPdfUrl;
  }

  private async generateCertificadoMedicoPdf(certificadoId: string, hashDocumento: string): Promise<string> {
    const cert = await this.prisma.certificadoMedico.findUnique({
      where: { id: certificadoId },
      include: {
        paciente: true,
        especialista: true,
        consulta: { include: { cita: { select: { fecha: true, horaInicio: true } } } },
      },
    });
    if (!cert) throw new NotFoundException('Certificado no encontrado');

    const pdfDir = path.join(process.cwd(), 'uploads', 'hce');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `certificado-${cert.id}.pdf`);

    const esp = cert.especialista;
    const espNombre = [esp.primerNombre, esp.segundoNombre, esp.primerApellido, esp.segundoApellido]
      .filter(Boolean).join(' ') || `${esp.nombres} ${esp.apellidos}`;
    const pacienteNombre = `${cert.paciente.nombres} ${cert.paciente.apellidos}`;
    const fmt = (d: Date) => new Date(d).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
    const fechaEmision = fmt(new Date());

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      doc.fontSize(16).text('Instituto de Neurociencias — Ecuador', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#666666').text('Dirección: Quito, Ecuador | Teléfono: (02) 000-0000', { align: 'center' });
      doc.moveDown(1.5);

      const titulo = cert.tipo === 'REPOSO' ? 'CERTIFICADO MÉDICO DE REPOSO' : 'CERTIFICADO MÉDICO DE ASISTENCIA';
      doc.fillColor('#000000').fontSize(15).text(titulo, { align: 'center', underline: true });
      doc.moveDown(1.5);
      doc.fontSize(11);

      if (cert.tipo === 'REPOSO') {
        const desde = cert.fechaInicio ? fmt(cert.fechaInicio) : '—';
        const hasta = cert.fechaFin ? fmt(cert.fechaFin) : '—';
        doc.text(
          `El suscrito, Dr./Dra. ${espNombre}, especialista en ${esp.especialidad || 'Medicina'}, ` +
          `CERTIFICA que el/la paciente ${pacienteNombre}, identificado(a) con cédula N.° ${cert.paciente.numeroIdentificacion}, ` +
          `requiere reposo médico por ${cert.diasReposo || '—'} día(s), desde el ${desde} hasta el ${hasta}.` +
          (cert.motivo ? ` Motivo: ${cert.motivo}.` : ''),
          { align: 'justify', lineGap: 4 },
        );
      } else {
        const fechaCita = cert.consulta?.cita?.fecha
          ? fmt(cert.consulta.cita.fecha)
          : fmt(cert.createdAt);
        const horaCita = cert.consulta?.cita?.horaInicio || '';
        doc.text(
          `El suscrito, Dr./Dra. ${espNombre}, especialista en ${esp.especialidad || 'Medicina'}, ` +
          `CERTIFICA que el/la paciente ${pacienteNombre}, identificado(a) con cédula N.° ${cert.paciente.numeroIdentificacion}, ` +
          `asistió a consulta médica el día ${fechaCita}${horaCita ? ` a las ${horaCita}` : ''}.` +
          (cert.motivo ? ` Motivo: ${cert.motivo}.` : ''),
          { align: 'justify', lineGap: 4 },
        );
      }

      if (cert.observaciones) {
        doc.moveDown(1);
        doc.fontSize(11).text(`Observaciones: ${cert.observaciones}`, { align: 'justify', lineGap: 3 });
      }

      doc.moveDown(2);
      doc.text(`Quito, ${fechaEmision}`, { align: 'right' });
      doc.moveDown(2.5);
      doc.text('_________________________', { align: 'center' });
      doc.text(`Dr./Dra. ${espNombre}`, { align: 'center' });
      doc.fontSize(10).text(esp.especialidad || '', { align: 'center' });
      doc.fontSize(9).text(`MSP: ${esp.codigoMsp || '—'}`, { align: 'center' });
      doc.moveDown(1.5);
      doc.fontSize(8).fillColor('#666666').text(`Firma digital SHA-256: ${hashDocumento}`, { align: 'center' });

      doc.end();
      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    });
  }

  // ── Alta por especialidad ──
  async darAlta(pacienteId: string, dto: DarAltaDto, userId: string, userRol?: string) {
    const paciente = await this.prisma.paciente.findUnique({ where: { id: pacienteId }, select: { id: true, nombres: true, apellidos: true } });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    let especialistaId: string | null = null;
    let especialidad = dto.especialidad;
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId }, select: { id: true, especialidad: true } });
      if (!esp) throw new ForbiddenException('No autorizado');
      especialistaId = esp.id;
      especialidad = esp.especialidad;
    }
    if (!especialidad) throw new BadRequestException('Debe indicar la especialidad del alta');

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const citas = await this.prisma.cita.findMany({
      where: {
        pacienteId,
        especialidad,
        fecha: { gte: hoy },
        estado: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_ESPERA', 'REAGENDADA'] },
      },
      select: { id: true },
    });

    const alta = await this.prisma.$transaction(async (tx) => {
      if (citas.length > 0) {
        await tx.cita.updateMany({
          where: { id: { in: citas.map((c) => c.id) } },
          data: {
            estado: 'CANCELADA',
            canceladaPor: userRol === 'ESPECIALISTA' ? 'ESPECIALISTA' : 'ADMIN',
            motivoCancelacion: `Alta de especialidad: ${dto.motivo}`,
            fechaCancelacion: new Date(),
            slotLiberado: true,
          },
        });
      }
      return tx.altaEspecialidad.create({
        data: {
          pacienteId,
          especialidad: especialidad!,
          especialistaId,
          usuarioId: userId,
          motivo: dto.motivo,
          observacion: dto.observacion,
          citasCanceladas: citas.length,
        },
        include: { especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } } },
      });
    });

    try {
      await this.notificaciones.crearParaAdmision({
        tipo: 'ALTA_ESPECIALIDAD',
        titulo: 'Alta de paciente por especialidad',
        mensaje: `${paciente.nombres} ${paciente.apellidos} fue dado de alta en ${especialidad}. Motivo: ${dto.motivo}. Citas canceladas: ${citas.length}.`,
        refId: pacienteId,
        refTipo: 'paciente',
      });
    } catch (e) {
      // La notificación no debe bloquear el alta
    }

    return { ...alta, citasCanceladas: citas.length };
  }

  async getAltasPaciente(pacienteId: string) {
    return this.prisma.altaEspecialidad.findMany({
      where: { pacienteId },
      include: { especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Derivaciones ──
  async getEspecialistasDestino(userId?: string, userRol?: string) {
    let excluirId: string | undefined;
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({
        where: { usuarioId: userId },
        select: { id: true },
      });
      if (!esp) throw new ForbiddenException('No autorizado');
      excluirId = esp.id;
    }

    return this.prisma.especialista.findMany({
      where: {
        estado: 'HABILITADO',
        ...(excluirId ? { id: { not: excluirId } } : {}),
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        especialidad: true,
        sede: true,
        consultorioPredeterminado: true,
      },
      orderBy: [{ especialidad: 'asc' }, { apellidos: 'asc' }, { nombres: 'asc' }],
    });
  }

  async crearDerivacion(dto: CrearDerivacionDto, userId: string, userRol?: string) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: dto.pacienteId },
      select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true },
    });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    let especialistaOrigenId: string | undefined;
    let consulta: any = null;
    if (dto.consultaId) {
      consulta = await this.prisma.consultaHCE.findUnique({
        where: { id: dto.consultaId },
        select: { id: true, pacienteId: true, especialistaId: true },
      });
      if (!consulta) throw new NotFoundException('Consulta no encontrada');
      if (consulta.pacienteId !== dto.pacienteId) {
        throw new BadRequestException('La consulta de origen no corresponde al paciente');
      }
      especialistaOrigenId = consulta.especialistaId;
    }
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId }, select: { id: true, especialidad: true } });
      if (!esp) throw new ForbiddenException('No autorizado');
      if (!especialistaOrigenId) especialistaOrigenId = esp.id;
      if (especialistaOrigenId !== esp.id) {
        throw new ForbiddenException('Solo puede derivar desde sus propias consultas');
      }
    }
    if (!especialistaOrigenId) {
      throw new BadRequestException('Debe indicar la consulta de origen o ser especialista');
    }

    const destinos = await this.prisma.especialista.findMany({
      where: { id: { in: dto.especialistaIds }, estado: 'HABILITADO' },
      select: { id: true, nombres: true, apellidos: true, especialidad: true, emailInstitucional: true, usuarioId: true, sede: true, consultorioPredeterminado: true },
    });
    if (destinos.length !== dto.especialistaIds.length) {
      throw new BadRequestException('Uno o más especialistas seleccionados no están disponibles');
    }

    const origen = await this.prisma.especialista.findUnique({
      where: { id: especialistaOrigenId },
      select: { nombres: true, apellidos: true, especialidad: true },
    });

    const derivacion = await this.prisma.derivacion.create({
      data: {
        pacienteId: dto.pacienteId,
        consultaId: dto.consultaId,
        especialistaOrigenId,
        usuarioId: userId,
        motivo: dto.motivo,
        prioridad: dto.prioridad,
        observacion: dto.observacion,
        destinos: {
          create: destinos.map((d) => ({
            especialistaId: d.id,
            especialidad: d.especialidad,
          })),
        },
      },
      include: {
        paciente: true,
        especialistaOrigen: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
        destinos: { include: { especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true, emailInstitucional: true, sede: true, consultorioPredeterminado: true } } } },
      },
    });

    // Notificaciones internas y correo solo a los especialistas seleccionados.
    for (const destino of derivacion.destinos) {
      try {
        const destinoData = destinos.find((d) => d.id === destino.especialistaId);
        const destinatarioId = destinoData?.usuarioId || userId;
        await this.notificaciones.crear({
          usuarioId: destinatarioId,
          tipo: 'DERIVACION',
          titulo: `Nueva derivación (${dto.prioridad})`,
          mensaje: `${paciente.nombres} ${paciente.apellidos} fue derivado(a) a ${destino.especialidad}. Motivo: ${dto.motivo}`,
          refId: derivacion.id,
          refTipo: 'derivacion',
        });
      } catch { /* noop */ }
      try {
        const email = destino.especialista?.emailInstitucional;
        if (email) {
          await this.mail.sendMail(
            email,
            `Derivación ${dto.prioridad}: ${paciente.nombres} ${paciente.apellidos}`,
            `<h2>Nueva derivación de paciente</h2>
             <p><strong>Paciente:</strong> ${paciente.nombres} ${paciente.apellidos} (${paciente.numeroIdentificacion})</p>
             <p><strong>Especialidad destino:</strong> ${destino.especialidad}</p>
             <p><strong>Prioridad:</strong> ${dto.prioridad}</p>
             <p><strong>Motivo:</strong> ${dto.motivo}</p>
             <p><strong>Derivado por:</strong> ${origen ? `${origen.nombres} ${origen.apellidos} (${origen.especialidad})` : 'Administración'}</p>
             ${dto.observacion ? `<p><strong>Observación:</strong> ${dto.observacion}</p>` : ''}
             <p>La cita será coordinada por Admisión.</p>`,
          );
        }
      } catch { /* el correo es opcional */ }
    }

    try {
      await this.notificaciones.crearParaAdmision({
        tipo: 'DERIVACION',
        titulo: `Derivación ${dto.prioridad} pendiente de programar`,
        mensaje: `${paciente.nombres} ${paciente.apellidos} → ${destinos.map((d) => d.especialidad).join(', ')}. Motivo: ${dto.motivo}`,
        refId: derivacion.id,
        refTipo: 'derivacion',
      });
    } catch { /* noop */ }

    return derivacion;
  }

  async getDerivaciones(
    filtros?: { estado?: string; prioridad?: string; especialistaId?: string; pacienteId?: string },
    userId?: string,
    userRol?: string,
  ) {
    let especialistaScope: any = {};
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({
        where: { usuarioId: userId },
        select: { id: true },
      });
      if (!esp) throw new ForbiddenException('No autorizado');
      especialistaScope = {
        OR: [
          { especialistaOrigenId: esp.id },
          { destinos: { some: { especialistaId: esp.id } } },
        ],
      };
    }

    return this.prisma.derivacion.findMany({
      where: {
        ...especialistaScope,
        ...(filtros?.estado ? { estado: filtros.estado } : {}),
        ...(filtros?.prioridad ? { prioridad: filtros.prioridad } : {}),
        ...(filtros?.pacienteId ? { pacienteId: filtros.pacienteId } : {}),
        ...(filtros?.especialistaId ? { destinos: { some: { especialistaId: filtros.especialistaId } } } : {}),
      },
      include: {
        paciente: { select: { id: true, nombres: true, apellidos: true, numeroIdentificacion: true, telefono: true } },
        especialistaOrigen: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
        destinos: {
          include: {
            especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true, sede: true, consultorioPredeterminado: true } },
            cita: { select: { id: true, fecha: true, horaInicio: true, estado: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDerivacionesPaciente(pacienteId: string) {
    return this.prisma.derivacion.findMany({
      where: { pacienteId },
      include: {
        especialistaOrigen: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
        destinos: { include: { especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } }, cita: { select: { id: true, fecha: true, horaInicio: true, estado: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async programarDerivacionDestino(id: string, citaId: string) {
    const destino = await this.prisma.derivacionDestino.findUnique({
      where: { id },
      include: { derivacion: true },
    });
    if (!destino) throw new NotFoundException('Destino de derivación no encontrado');
    if (destino.citaId) {
      throw new ConflictException('Este destino de derivación ya tiene una cita programada');
    }

    const cita = await this.prisma.cita.findUnique({ where: { id: citaId } });
    if (!cita) throw new NotFoundException('Cita no encontrada');
    if (cita.pacienteId !== destino.derivacion.pacienteId) {
      throw new BadRequestException('La cita no corresponde al paciente de la derivación');
    }
    if (cita.especialistaId !== destino.especialistaId) {
      throw new BadRequestException('La cita debe ser con el especialista de destino de la derivación');
    }

    const updated = await this.prisma.derivacionDestino.update({
      where: { id },
      data: { estado: 'PROGRAMADA', citaId },
      include: { especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } }, cita: true },
    });

    const pendientes = await this.prisma.derivacionDestino.count({
      where: { derivacionId: destino.derivacionId, estado: { not: 'PROGRAMADA' } },
    });
    await this.prisma.derivacion.update({
      where: { id: destino.derivacionId },
      data: { estado: pendientes === 0 ? 'PROGRAMADA' : 'EN_PROCESO' },
    });

    return updated;
  }

  /** Búsqueda de diagnósticos insensible a mayúsculas y tildes. */
  private normalizarBusqueda(value?: string) {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private getDataFilePath(file: string): string | null {
    const candidates = [
      path.join(__dirname, '..', '..', 'data', file),
      path.join(__dirname, '..', '..', '..', 'data', file),
      path.join(process.cwd(), 'src', 'data', file),
      path.join(process.cwd(), 'dist', 'src', 'data', file),
      path.join(process.cwd(), 'dist', 'data', file),
      path.join(process.cwd(), 'data', file),
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
  }

  private getDiagnosticosCatalog(sistema = 'CIE10'): Array<{ codigo: string; descripcion: string }> {
    const key = sistema === 'DSM5' ? 'DSM5' : 'CIE10';
    const cached = this.diagnosticosCache.get(key);
    if (cached) return cached;

    const file = key === 'DSM5' ? 'dsm5.json' : 'cie10.json';
    const filePath = this.getDataFilePath(file);
    if (!filePath) return [];

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data: Array<{ codigo: string; descripcion: string }> = JSON.parse(raw);
      const catalog = Array.isArray(data) ? data : [];
      this.diagnosticosCache.set(key, catalog);
      return catalog;
    } catch {
      return [];
    }
  }

  private async findConsultaOrFail(consultaId: string) {
    const consulta = await this.prisma.consultaHCE.findUnique({
      where: { id: consultaId },
    });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');
    return consulta;
  }

  private async assertConsultaEditable(consultaId: string) {
    const consulta = await this.findConsultaOrFail(consultaId);
    if (consulta.firmada) {
      throw new ConflictException({ code: 'HC_CERRADA', message: 'La consulta ya fue firmada y no se puede modificar' });
    }
    return consulta;
  }
}
