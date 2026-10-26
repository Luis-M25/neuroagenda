import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

describe('PacientesService', () => {
  let service: PacientesService;
  let mockPrisma: any;
  let mockAuditoria: any;

  beforeEach(async () => {
    mockPrisma = {
      paciente: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      inasistenciaPorEspecialidad: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      cita: { updateMany: jest.fn(), findMany: jest.fn() },
      antecedente: { deleteMany: jest.fn(), createMany: jest.fn() },
      $transaction: jest.fn((fn: any) => fn(mockPrisma)),
    };
    mockAuditoria = { registrar: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacientesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditoriaService, useValue: mockAuditoria },
      ],
    }).compile();

    service = module.get<PacientesService>(PacientesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('lanza ConflictException si identificacion existe', async () => {
      mockPrisma.paciente.findUnique.mockResolvedValue({ id: 'exists' });

      await expect(
        service.create({ numeroIdentificacion: '1234567890', tipoIdentificacion: 'PASAPORTE', fechaNacimiento: '1990-01-01' } as any, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si no existe', async () => {
      mockPrisma.paciente.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('not-found'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bloquear', () => {
    it('setea bloqueado true y registra auditoria', async () => {
      mockPrisma.paciente.findUnique.mockResolvedValue({ id: 'pac-1', especialidadesBloqueadas: null });
      mockPrisma.paciente.update.mockResolvedValue({ id: 'pac-1', bloqueado: true, motivoBloqueo: 'Muchas inasistencias' });

      const result = await service.bloquear('pac-1', 'Muchas inasistencias', 'user-1', 'NEUROLOGIA');

      expect(mockPrisma.paciente.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pac-1' },
          data: expect.objectContaining({
            bloqueado: true,
            motivoBloqueo: 'Muchas inasistencias',
          }),
        }),
      );
      expect(mockAuditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'BLOQUEAR_PACIENTE',
          entidad: 'Paciente',
        }),
      );
      expect(result.bloqueado).toBe(true);
    });
  });

  describe('cancelarProtocolo', () => {
    it('lanza NotFoundException si no hay registro de inasistencias', async () => {
      mockPrisma.inasistenciaPorEspecialidad.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelarProtocolo('pac-1', 'NEUROLOGIA', 'Muchas faltas', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('cancela citas futuras, resetea contador y registra auditoria', async () => {
      mockPrisma.inasistenciaPorEspecialidad.findUnique.mockResolvedValue({
        id: 'inasis-1',
        contador: 3,
      });
      mockPrisma.cita.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.inasistenciaPorEspecialidad.update.mockResolvedValue({});
      mockAuditoria.registrar.mockResolvedValue(undefined);

      const result = await service.cancelarProtocolo('pac-1', 'NEUROLOGIA', 'Muchas faltas', 'user-1');

      expect(mockPrisma.cita.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
          }),
        }),
      );

      expect(mockPrisma.inasistenciaPorEspecialidad.update).toHaveBeenCalledWith({
        where: { id: 'inasis-1' },
        data: {
          contador: 0,
          ultimaNotificacionSeveridad: 'PROTOCOLO_CANCELADO',
        },
      });

      expect(mockAuditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CANCELAR_PROTOCOLO',
          entidad: 'Paciente',
        }),
      );

      expect(result).toEqual({
        ok: true,
        especialidad: 'NEUROLOGIA',
        citasCanceladas: 2,
        message: expect.any(String),
      });
    });
  });
});
