import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { HceService } from './hce.service';
import { PrismaService } from '../../common/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { MailService } from '../notificaciones/mail/mail.service';

jest.mock('bcryptjs');

const consultaMock = {
  id: 'consulta-1',
  firmada: false,
  motivoConsulta: 'Dolor de cabeza',
  enfermedadActual: 'Cefalea de 3 dias',
  tipoConsulta: 'Control',
  condicionConsulta: 'Subsecuente',
  formaConsulta: 'Presencial',
  tipoAtencion: 'Consulta externa',
  updatedAt: new Date('2026-07-20T15:00:00.000Z'),
  especialistaId: 'esp-1',
  pacienteId: 'pac-1',
  especialista: { id: 'esp-1', usuarioId: 'user-1', usuario: { id: 'user-1', passwordHash: 'hash-mock' } },
  diagnosticos: [],
  prescripciones: [],
  paciente: { id: 'pac-1' },
};

describe('HceService', () => {
  let service: HceService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      consultaHCE: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), aggregate: jest.fn() },
      firma: { create: jest.fn() },
      diagnostico: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: { crear: jest.fn(), crearParaAdmision: jest.fn() } },
        { provide: MailService, useValue: { sendMail: jest.fn() } },
      ],
    }).compile();

    service = module.get<HceService>(HceService);

    jest.spyOn(service as any, 'generateConsultaPdf').mockResolvedValue('test.pdf');
    jest.spyOn(service, 'getConsulta').mockResolvedValue({ id: 'consulta-1' } as any);
    jest.clearAllMocks();
  });

  describe('createConsulta', () => {
    it('createConsulta con citaId existente devuelve la misma', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(consultaMock);

      const result = await service.createConsulta({ citaId: 'cita-1', pacienteId: 'pac-1', especialistaId: 'esp-1' } as any, 'user-1');

      expect(mockPrisma.consultaHCE.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { citaId: 'cita-1' } }),
      );
      expect(result).toEqual({ id: 'consulta-1' });
    });
  });

  describe('updateConsulta', () => {
    it('updateConsulta con efEstadoGeneral no lanza', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(consultaMock);
      mockPrisma.consultaHCE.update.mockResolvedValue({});

      await expect(
        service.updateConsulta('consulta-1', { efEstadoGeneral: 'NORMAL' } as any),
      ).resolves.not.toThrow();
    });

    it('rechaza una llamada telefónica con forma presencial', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(consultaMock);

      await expect(
        service.updateConsulta('consulta-1', {
          tipoConsulta: 'Llamada telefónica',
          formaConsulta: 'Presencial',
          tipoAtencion: 'Consulta externa',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza una atención virtual que no sea consulta externa', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(consultaMock);

      await expect(
        service.updateConsulta('consulta-1', {
          formaConsulta: 'Virtual',
          tipoAtencion: 'Emergencia',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('firmarConsulta', () => {
    it('lanza NotFoundException si la consulta no existe', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(null);

      await expect(service.firmarConsulta('consulta-x', 'pass', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza ForbiddenException si userId no coincide con el especialista', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(consultaMock);

      await expect(service.firmarConsulta('consulta-1', 'pass', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lanza UnauthorizedException si la contrasena es incorrecta', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(consultaMock);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.firmarConsulta('consulta-1', 'wrong-pass', 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('addDiagnostico', () => {
    it('addDiagnostico lanza HC_CERRADA si firmada', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue({ ...consultaMock, firmada: true });

      await expect(
        service.addDiagnostico('consulta-1', { codigoCIE10: 'R51', descripcion: 'Cefalea', tipo: 'PRINCIPAL' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('addPedido', () => {
    it('addPedido lanza HC_CERRADA si firmada', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue({ ...consultaMock, firmada: true });

      await expect(
        service.addPedido('consulta-1', { tipo: 'LAB', descripcion: 'Hemograma' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('generarReceta', () => {
    it('lanza ConflictException si la cita ya está ATENDIDA', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue({
        ...consultaMock,
        cita: { estado: 'ATENDIDA' },
      });

      await expect(
        service.generarReceta('consulta-1', { password: 'secreta' } as any, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
