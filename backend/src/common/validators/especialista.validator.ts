import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Centraliza la validación de especialistas para evitar duplicación
 * Usado por: CitasService, EspecialistasService, HceService
 */
@Injectable()
export class EspecialistaValidator {
  private readonly logger = new Logger(EspecialistaValidator.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Valida que un especialista exista, esté habilitado y disponible
   * @throws NotFoundException si no existe
   * @throws BadRequestException si no está habilitado o tiene bloqueos
   */
  async validarEspecialistaDisponible(
    especialistaId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    options?: { ignorarBloqueos?: boolean; ignorarEstado?: boolean },
  ) {
    // 1. Validar que existe
    const especialista = await this.prisma.especialista.findUnique({
      where: { id: especialistaId },
      include: { usuario: true },
    });

    if (!especialista) {
      this.logger.warn(`Especialista no encontrado: ${especialistaId}`);
      throw new NotFoundException(`Especialista no encontrado: ${especialistaId}`);
    }

    // 2. Validar estado
    if (!options?.ignorarEstado && especialista.estado !== 'HABILITADO') {
      this.logger.warn(
        `Especialista no habilitado: ${especialistaId} (estado: ${especialista.estado})`,
      );
      throw new BadRequestException(
        `El especialista ${especialista.nombres} no está habilitado (${especialista.estado})`,
      );
    }

    // 3. Validar que no esté bloqueado en esa fecha
    if (!options?.ignorarBloqueos) {
      const bloqueoEspecialista = await this.prisma.bloqueoGrupalEspecialista.findFirst({
        where: {
          especialistaId,
          bloqueoGrupal: {
            activo: true,
            fechaInicio: { lte: new Date(`${fecha}T23:59:59`) },
            OR: [
              { fechaFin: null },
              { fechaFin: { gte: new Date(`${fecha}T00:00:00`) } },
            ],
          },
        },
        include: { bloqueoGrupal: true },
      });

      if (bloqueoEspecialista) {
        this.logger.warn(
          `Especialista bloqueado: ${especialistaId} en ${fecha}`,
        );
        throw new ConflictException(
          `El especialista está bloqueado en esa fecha. Motivo: ${bloqueoEspecialista.bloqueoGrupal.nombre || 'Bloqueo'}`,
        );
      }
    }

    return especialista;
  }

  /**
   * Valida que un especialista exista (validación básica)
   */
  async validarEspecialistaExiste(especialistaId: string) {
    const especialista = await this.prisma.especialista.findUnique({
      where: { id: especialistaId },
    });

    if (!especialista) {
      throw new NotFoundException(`Especialista no encontrado: ${especialistaId}`);
    }

    return especialista;
  }

  /**
   * Valida disponibilidad en una franja horaria específica
   */
  async validarDisponibilidadHoraria(
    especialistaId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    citaIdExcluir?: string,
  ) {
    // Validar contra otras citas confirmadas en mismo rango horario
    const citasConflictivas = await this.prisma.cita.findMany({
      where: {
        especialistaId,
        fecha: new Date(fecha),
        estado: { in: ['CONFIRMADA', 'EN_ESPERA', 'EN_ATENCION'] },
        id: citaIdExcluir ? { not: citaIdExcluir } : undefined,
        OR: [
          {
            // Nueva cita comienza antes de que termine la existente
            horaInicio: { lt: horaFin },
            horaFin: { gt: horaInicio },
          },
        ],
      },
    });

    if (citasConflictivas.length > 0) {
      throw new ConflictException(
        `Especialista no disponible en ese horario (${citasConflictivas.length} cita(s) superpuesta(s))`,
      );
    }

    return true;
  }

  /**
   * Valida cambio de estado (para reagendamiento, etc.)
   */
  async validarCambioEstado(estadoActual: string, estadoNuevo: string) {
    // Definir transiciones válidas
    const transicionesValidas: Record<string, string[]> = {
      PENDIENTE: ['CONFIRMADA', 'CANCELADA'],
      CONFIRMADA: ['EN_ESPERA', 'EN_ATENCION', 'CANCELADA', 'REAGENDADA'],
      EN_ESPERA: ['EN_ATENCION', 'CANCELADA'],
      EN_ATENCION: ['ATENDIDA', 'NO_ASISTIO', 'CANCELADA'],
      ATENDIDA: [],
      NO_ASISTIO: [],
      CANCELADA: [],
      REAGENDADA: [],
    };

    if (!transicionesValidas[estadoActual]?.includes(estadoNuevo)) {
      throw new BadRequestException(
        `Transición no permitida: ${estadoActual} → ${estadoNuevo}`,
      );
    }

    return true;
  }
}
