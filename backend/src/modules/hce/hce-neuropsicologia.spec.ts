import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { HceService } from './hce.service';
import { PrismaService } from '../../common/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { MailService } from '../notificaciones/mail/mail.service';

const planMock = {
  id: 'plan-1',
  consultaId: 'consulta-1',
  numeroCitas: 8,
  estado: 'EN_CURSO',
  extensionUsada: false,
  objetivos: [
    { numero: 1, descripcion: 'Mejorar memoria de trabajo' },
    { numero: 2, descripcion: 'Reducir impulsividad' },
  ],
};

const objDto = (numero: number) => ({
  numero,
  descripcion: `Objetivo ${numero}`,
  escalaMas2: '+2',
  escalaMas1: '+1',
  escalaCero: '0',
  escalaMenos1: '-1',
  escalaMenos2: '-2',
});

describe('HceService - PlanTratamientoNeuropsi', () => {
  let service: HceService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      consultaHCE: { findUnique: jest.fn(), findMany: jest.fn() },
      planTratamientoNeuropsi: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      objetivoTratamiento: { deleteMany: jest.fn(), updateMany: jest.fn() },
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
    jest.clearAllMocks();
  });

  describe('createPlanTratamiento', () => {
    it('lanza ConflictException si ya existe un plan para la consulta', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue({ id: 'consulta-1', pacienteId: 'p', especialistaId: 'e' });
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue(planMock);

      await expect(
        service.createPlanTratamiento('consulta-1', { numeroCitas: 8, objetivos: [objDto(1)] }),
      ).rejects.toThrow(ConflictException);
    });

    it('crea el plan en estado BORRADOR con sus objetivos', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue({ id: 'consulta-1', pacienteId: 'p', especialistaId: 'e' });
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue(null);
      mockPrisma.planTratamientoNeuropsi.create.mockResolvedValue({ ...planMock, estado: 'BORRADOR' });

      await service.createPlanTratamiento('consulta-1', { numeroCitas: 8, objetivos: [objDto(1), objDto(2)] });

      expect(mockPrisma.planTratamientoNeuropsi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numeroCitas: 8, estado: 'BORRADOR' }),
        }),
      );
    });

    it('lanza NotFoundException si la consulta no existe', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(null);

      await expect(
        service.createPlanTratamiento('x', { numeroCitas: 8, objetivos: [objDto(1)] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequest si un objetivo no tiene la escala completa', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue({ id: 'consulta-1', pacienteId: 'p', especialistaId: 'e' });
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue(null);

      await expect(
        service.createPlanTratamiento('consulta-1', { numeroCitas: 8, objetivos: [{ ...objDto(1), escalaCero: '' }] }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.planTratamientoNeuropsi.create).not.toHaveBeenCalled();
    });
  });

  describe('extenderPlanTratamiento', () => {
    it('lanza BadRequest si el plan ya fue extendido una vez', async () => {
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue({ ...planMock, extensionUsada: true });

      await expect(
        service.extenderPlanTratamiento('plan-1', { citasExtension: 3, motivo: 'Falta progreso' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequest si el plan está finalizado', async () => {
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue({ ...planMock, estado: 'FINALIZADO' });

      await expect(
        service.extenderPlanTratamiento('plan-1', { citasExtension: 3, motivo: 'Falta progreso' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('extiende a estado EXTENDIDO con motivo y citas', async () => {
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue(planMock);
      mockPrisma.planTratamientoNeuropsi.update.mockResolvedValue({});

      await service.extenderPlanTratamiento('plan-1', { citasExtension: 5, motivo: 'Paciente no cumple objetivos' });

      expect(mockPrisma.planTratamientoNeuropsi.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            citasExtension: 5,
            motivoExtension: 'Paciente no cumple objetivos',
            extensionUsada: true,
            estado: 'EXTENDIDO',
          }),
        }),
      );
    });
  });

  describe('finalizarPlanTratamiento', () => {
    it('lanza BadRequest si falta el resultado de un objetivo', async () => {
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue(planMock);

      await expect(
        service.finalizarPlanTratamiento('plan-1', { resultados: [{ numero: 1, resultadoFinal: 1 }] }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.planTratamientoNeuropsi.update).not.toHaveBeenCalled();
    });

    it('lanza BadRequest si el plan ya está finalizado', async () => {
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue({ ...planMock, estado: 'FINALIZADO' });

      await expect(
        service.finalizarPlanTratamiento('plan-1', {
          resultados: [
            { numero: 1, resultadoFinal: 1 },
            { numero: 2, resultadoFinal: 0 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('finaliza cuando cada objetivo tiene su valor de escala', async () => {
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue(planMock);
      mockPrisma.objetivoTratamiento.updateMany.mockResolvedValue({});
      mockPrisma.planTratamientoNeuropsi.update.mockResolvedValue({});

      await service.finalizarPlanTratamiento('plan-1', {
        resultados: [
          { numero: 1, resultadoFinal: 2 },
          { numero: 2, resultadoFinal: -1 },
        ],
      });

      expect(mockPrisma.objetivoTratamiento.updateMany).toHaveBeenCalledTimes(2);
      expect(mockPrisma.planTratamientoNeuropsi.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ estado: 'FINALIZADO' }) }),
      );
    });
  });

  describe('updatePlanTratamiento', () => {
    it('lanza BadRequest si el plan está finalizado', async () => {
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue({ ...planMock, estado: 'FINALIZADO' });

      await expect(service.updatePlanTratamiento('plan-1', { numeroCitas: 10 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequest si se intenta cambiar el número de citas', async () => {
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue(planMock);

      await expect(service.updatePlanTratamiento('plan-1', { numeroCitas: 10 })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.planTratamientoNeuropsi.update).not.toHaveBeenCalled();
    });

    it('permite actualizar objetivos sin tocar el número de citas', async () => {
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue(planMock);
      mockPrisma.planTratamientoNeuropsi.update.mockResolvedValue({});

      await service.updatePlanTratamiento('plan-1', { numeroCitas: 8, objetivos: [objDto(1)] });

      expect(mockPrisma.planTratamientoNeuropsi.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ numeroCitas: expect.anything() }),
        }),
      );
    });

    it('lanza BadRequest si un objetivo no tiene la escala completa', async () => {
      mockPrisma.planTratamientoNeuropsi.findUnique.mockResolvedValue(planMock);

      await expect(
        service.updatePlanTratamiento('plan-1', { objetivos: [{ ...objDto(1), descripcion: '' }] }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.planTratamientoNeuropsi.update).not.toHaveBeenCalled();
    });
  });

  describe('getTratamientosPaciente', () => {
    it('expone objetivos siempre (solo lectura) y especialistaId; sin finalizar sin resultado', async () => {
      mockPrisma.consultaHCE.findMany.mockResolvedValue([
        {
          id: 'c1',
          createdAt: new Date(),
          especialista: { id: 'esp-1', especialidad: 'Neuropsicología', nombres: 'Ana', apellidos: 'Ruiz' },
          prescripciones: [],
          planTratamiento: {
            id: 'plan-1',
            estado: 'FINALIZADO',
            numeroCitas: 8,
            motivoExtension: 'x',
            objetivos: [
              { numero: 1, descripcion: 'O1', escalaMas2: '+2', resultadoFinal: 1, observacion: 'obs' },
            ],
          },
        },
        {
          id: 'c2',
          createdAt: new Date(),
          especialista: { especialidad: 'Neurologia', nombres: 'Luis', apellidos: 'Vega' },
          prescripciones: [{ id: 'p1', medicamento: 'X' }],
          planTratamiento: { id: 'plan-2', estado: 'EN_CURSO', objetivos: [{ numero: 1 }] },
        },
      ]);

      const res: any[] = await service.getTratamientosPaciente('pac-1');

      expect(res[0].planTratamiento.estado).toBe('FINALIZADO');
      expect(res[0].planTratamiento.objetivos[0]).not.toHaveProperty('observacion');
      expect(res[0].planTratamiento).not.toHaveProperty('motivoExtension');
      expect(res[0].especialistaId).toBe('esp-1');
      expect(res[1].planTratamiento.estado).toBe('EN_CURSO');
      expect(res[1].planTratamiento.totalObjetivos).toBe(1);
      expect(res[1].planTratamiento.objetivos).toHaveLength(1);
      expect(res[1].planTratamiento.objetivos[0].numero).toBe(1);
    });
  });
});
