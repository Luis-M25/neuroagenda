import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CitaReagendarService } from './cita-reagendar.service';
import { PrismaService } from '../../../../common/prisma.service';
import { AuditoriaService } from '../../../auditoria/auditoria.service';
import { CitaDomainService } from '../domain/cita-domain.service';

describe('CitaReagendarService', () => {
  let service: CitaReagendarService;
  let mockPrisma: any;
  let mockAuditoria: any;
  let mockDomain: any;

  const baseCita = {
    id: 'cita-1',
    estado: 'PENDIENTE',
    especialistaId: 'esp-1',
    pacienteId: 'pac-1',
    fecha: new Date('2025-01-01'),
    horaInicio: '10:00',
    horaFin: '11:00',
    duracionMinutos: 60,
    especialidad: 'NEUROLOGIA',
    lugar: 'Consultorio 1',
    motivo: 'Control',
    notaAdmin: null,
    paciente: { nombres: 'Juan', apellidos: 'Perez' },
    especialista: { nombres: 'Dr.', apellidos: 'Smith', usuario: {} },
    citaOriginal: null,
    citaReagendada: null,
    modificadaPor: null,
    modificaciones: [],
    citasDerivadas: [],
  };

  beforeEach(async () => {
    mockPrisma = {
      cita: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(mockPrisma)),
    };
    mockAuditoria = { registrar: jest.fn() };
    mockDomain = {
      conflicts: {
        validarConflictos: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitaReagendarService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditoriaService, useValue: mockAuditoria },
        { provide: CitaDomainService, useValue: mockDomain },
      ],
    }).compile();

    service = module.get<CitaReagendarService>(CitaReagendarService);
  });

  it('marca cita original como REAGENDADA', async () => {
    mockPrisma.cita.findUnique.mockResolvedValue(baseCita);
    mockPrisma.cita.create.mockResolvedValue({ ...baseCita, id: 'cita-2', estado: 'PENDIENTE' });
    mockPrisma.cita.update.mockResolvedValue({ ...baseCita, estado: 'REAGENDADA' });

    const result = await service.reagendar('cita-1', {
      fecha: '2025-01-02',
      horaInicio: '10:00',
      horaFin: '11:00',
    } as any, 'user-1');

    expect(mockPrisma.cita.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cita-1' },
        data: expect.objectContaining({ estado: 'REAGENDADA' }),
      }),
    );
    expect(result.citaOriginal.estado).toBe('REAGENDADA');
  });

  it('rechaza estado ATENDIDA', async () => {
    mockPrisma.cita.findUnique.mockResolvedValue({ ...baseCita, estado: 'ATENDIDA' });

    await expect(
      service.reagendar('cita-1', {
        fecha: '2025-01-02',
        horaInicio: '10:00',
        horaFin: '11:00',
      } as any, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('crea nueva cita PENDIENTE linkeada', async () => {
    mockPrisma.cita.findUnique.mockResolvedValue(baseCita);
    const newCita = { ...baseCita, id: 'cita-2', estado: 'PENDIENTE', citaOrigenId: 'cita-1' };
    mockPrisma.cita.create.mockResolvedValue(newCita);
    mockPrisma.cita.update.mockResolvedValue({ ...baseCita, estado: 'REAGENDADA' });

    const result = await service.reagendar('cita-1', {
      fecha: '2025-01-02',
      horaInicio: '10:00',
      horaFin: '11:00',
    } as any, 'user-1');

    expect(mockPrisma.cita.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'PENDIENTE',
          citaOrigenId: 'cita-1',
        }),
      }),
    );
    expect(result.nuevaCita.estado).toBe('PENDIENTE');
    expect(result.nuevaCita.id).toBe('cita-2');
  });
});
