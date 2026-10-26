import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CitasService } from './citas.service';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CitaDomainService } from './services/domain/cita-domain.service';
import { CitaConflictsService } from './services/domain/cita-conflicts.service';
import { CitaSlotsService } from './services/domain/cita-slots.service';
import { CitaRecurrenceService } from './services/domain/cita-recurrence.service';
import { CitaCreateService } from './services/application/cita-create.service';
import { CitaUpdateService } from './services/application/cita-update.service';
import { CitaEstadosService } from './services/application/cita-estados.service';
import { CitaReagendarService } from './services/application/cita-reagendar.service';
import { NotificationDispatcher } from '../notificaciones/dispatcher/notification-dispatcher.service';
import { NotificacionesService, TIPO_NOTIFICACION } from '../notificaciones/notificaciones.service';

describe('CitasService', () => {
  let citasService: CitasService;
  let mockPrisma: any;
  let mockAuditoria: any;

  function buildMockPrisma() {
    const mp: any = {
      especialista: { findUnique: jest.fn() },
      paciente: { findUnique: jest.fn() },
      cita: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
      horarioEspecialista: { findMany: jest.fn() },
      feriado: { findFirst: jest.fn(), findUnique: jest.fn() },
      diaBloqueado: { findUnique: jest.fn() },
      bloqueoGrupal: { findMany: jest.fn() },
      auditoria: { create: jest.fn() },
      citaModificacion: { create: jest.fn(), findFirst: jest.fn() },
      inasistenciaPorEspecialidad: { upsert: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      syncedChange: { create: jest.fn() },
      pasante: { findFirst: jest.fn(), create: jest.fn() },
    };
    mp.$transaction = jest.fn((cb: Function) => cb(mp));
    return mp;
  }

  beforeEach(async () => {
    mockPrisma = buildMockPrisma();
    mockAuditoria = { registrar: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditoriaService, useValue: mockAuditoria },
        CitaDomainService,
        CitaConflictsService,
        CitaSlotsService,
        CitaRecurrenceService,
        CitaCreateService,
        CitaUpdateService,
        CitaEstadosService,
        CitaReagendarService,
        { provide: NotificationDispatcher, useValue: { dispatchInasistencia: jest.fn() } },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn(), crearParaAdmision: jest.fn(), existeReciente: jest.fn(), listar: jest.fn(), contarNoLeidas: jest.fn(), marcarLeida: jest.fn(), marcarTodasLeidas: jest.fn() },
        },
      ],
    }).compile();

    citasService = module.get<CitasService>(CitasService);
  });

  describe('create', () => {
    const dateToLocalISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    it('debe lanzar BadRequestException si la fecha es pasada', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const y = dateToLocalISO(yesterday);

      await expect(
        citasService.create({
          fecha: y,
          horaInicio: '09:00',
          horaFin: '09:30',
          especialistaId: 'esp-1',
          pacienteId: 'pac-1',
          especialidad: 'Cardiologia',
          lugar: 'Consultorio 301',
          motivo: 'Control',
        } as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si el especialista no existe', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fecha = dateToLocalISO(tomorrow);

      mockPrisma.especialista.findUnique.mockResolvedValue(null);

      await expect(
        citasService.create({
          fecha,
          horaInicio: '09:00',
          horaFin: '09:30',
          especialistaId: 'esp-1',
          pacienteId: 'pac-1',
          especialidad: 'Cardiologia',
          lugar: 'Consultorio 301',
          motivo: 'Control',
        } as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException si el paciente esta bloqueado para esa especialidad', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fecha = dateToLocalISO(tomorrow);

      mockPrisma.especialista.findUnique.mockResolvedValue({
        id: 'esp-1', estado: 'HABILITADO',
      });
      mockPrisma.paciente.findUnique.mockResolvedValue({
        id: 'pac-1',
        bloqueado: true,
        especialidadesBloqueadas: JSON.stringify(['Cardiologia']),
      });

      await expect(
        citasService.create({
          fecha,
          horaInicio: '09:00',
          horaFin: '09:30',
          especialistaId: 'esp-1',
          pacienteId: 'pac-1',
          especialidad: 'Cardiologia',
          lugar: 'Consultorio 301',
          motivo: 'Control',
        } as any, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateEstado', () => {
    it('debe validar transiciones de estado validas', async () => {
      mockPrisma.cita.findUnique.mockResolvedValue({
        id: 'cita-1',
        estado: 'PENDIENTE',
        especialistaId: 'esp-1',
        pacienteId: 'pac-1',
        especialidad: 'Cardiologia',
        fecha: new Date(),
        horaInicio: '09:00',
        horaFin: '09:30',
      });
      mockPrisma.cita.update.mockResolvedValue({ id: 'cita-1', estado: 'CONFIRMADA' });

      await expect(
        citasService.updateEstado(
          'cita-1',
          { estado: 'CONFIRMADA' } as any,
          'user-1',
          'ADMISION_PRINCIPAL',
        ),
      ).resolves.toBeDefined();
    });

    it('debe rechazar PORTERO intentando marcar ATENDIDA', async () => {
      mockPrisma.cita.findUnique.mockResolvedValue({
        id: 'cita-1',
        estado: 'EN_ESPERA',
        especialistaId: 'esp-1',
        pacienteId: 'pac-1',
        especialidad: 'Cardiologia',
        fecha: new Date(),
        horaInicio: '09:00',
        horaFin: '09:30',
      });

      await expect(
        citasService.updateEstado(
          'cita-1',
          { estado: 'ATENDIDA' } as any,
          'user-1',
          'PORTERO',
        ),
      ).rejects.toThrow();
    });
  });
});
