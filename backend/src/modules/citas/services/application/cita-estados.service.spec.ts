import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CitaEstadosService } from './cita-estados.service';
import { PrismaService } from '../../../../common/prisma.service';
import { AuditoriaService } from '../../../auditoria/auditoria.service';
import { NotificationDispatcher } from '../../../notificaciones/dispatcher/notification-dispatcher.service';
import { NotificacionesService } from '../../../notificaciones/notificaciones.service';

describe('CitaEstadosService', () => {
  let service: CitaEstadosService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      cita: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      consultaHCE: { findFirst: jest.fn() },
      inasistenciaPorEspecialidad: { upsert: jest.fn(), update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitaEstadosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditoriaService, useValue: { registrar: jest.fn() } },
        { provide: NotificationDispatcher, useValue: { dispatchInasistencia: jest.fn() } },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn(), crearParaAdmision: jest.fn(), existeReciente: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CitaEstadosService>(CitaEstadosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rechaza ATENDIDA si consulta no esta firmada', async () => {
    mockPrisma.cita.findUnique.mockResolvedValue({
      id: 'cita-1',
      estado: 'EN_ATENCION',
      pacienteId: 'pac-1',
      especialidad: 'NEUROLOGIA',
      paciente: { nombres: 'Juan', apellidos: 'Perez' },
      especialista: { usuario: {} },
      citaOriginal: null,
      citaReagendada: null,
      modificadaPor: null,
      modificaciones: [],
      citasDerivadas: [],
    });
    mockPrisma.consultaHCE.findFirst.mockResolvedValue({ motivoConsulta: 'Dolor', firmada: false });

    await expect(
      service.updateEstado('cita-1', { estado: 'ATENDIDA' }, 'user-1', 'ESPECIALISTA'),
    ).rejects.toThrow(BadRequestException);
  });

  it('acepta ATENDIDA si consulta firmada y con motivo', async () => {
    mockPrisma.cita.findUnique.mockResolvedValue({
      id: 'cita-1',
      estado: 'EN_ATENCION',
      pacienteId: 'pac-1',
      especialidad: 'NEUROLOGIA',
      paciente: { nombres: 'Juan', apellidos: 'Perez' },
      especialista: { usuario: {} },
      citaOriginal: null,
      citaReagendada: null,
      modificadaPor: null,
      modificaciones: [],
      citasDerivadas: [],
    });
    mockPrisma.consultaHCE.findFirst.mockResolvedValue({ motivoConsulta: 'Dolor de cabeza', firmada: true });
    mockPrisma.cita.update.mockResolvedValue({ estado: 'ATENDIDA' });

    await expect(
      service.updateEstado('cita-1', { estado: 'ATENDIDA' }, 'user-1', 'ESPECIALISTA'),
    ).resolves.not.toThrow();
  });
});
