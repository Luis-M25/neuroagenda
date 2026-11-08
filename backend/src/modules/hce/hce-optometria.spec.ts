import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { HceService } from './hce.service';
import { PrismaService } from '../../common/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { MailService } from '../notificaciones/mail/mail.service';

const informeMock = {
  id: 'info-1',
  consultaId: 'consulta-1',
  tipo: 'INTEGRAL',
  avOdVl: '20/20',
  avOiVl: '20/25',
  rxUsoOd: '-0.50 -0.25 x 180',
  rxFinalOd: '-0.50 -0.25 x 180',
  extCorneaOd: 'SIN ALTERACION',
  extCorneaOi: 'SIN ALTERACION',
  diagnosticoAO: 'Astigmatismo',
  recomendaciones: 'Control en 6 meses',
};

describe('HceService - Optometría', () => {
  let service: HceService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      consultaHCE: { findUnique: jest.fn(), update: jest.fn() },
      optometriaInforme: { findUnique: jest.fn(), upsert: jest.fn() },
      firma: { create: jest.fn() },
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

  describe('saveOptometria', () => {
    it('hace upsert por consultaId y filtra campos undefined', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue({ id: 'consulta-1', firmada: false });
      mockPrisma.optometriaInforme.upsert.mockResolvedValue(informeMock);

      await service.saveOptometria('consulta-1', {
        avOdVl: '20/20',
        rxUsoOd: '-0.50 -0.25 x 180',
        extCorneaOd: 'SIN ALTERACION',
        tratamiento: 'Uso permanente de lentes',
        notasAdicionales: 'Control en 6 meses',
        rxUsoOdAv: undefined,
      });

      expect(mockPrisma.optometriaInforme.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { consultaId: 'consulta-1' },
          create: expect.objectContaining({
            consultaId: 'consulta-1',
            tipo: 'INTEGRAL',
            avOdVl: '20/20',
            rxUsoOd: '-0.50 -0.25 x 180',
            extCorneaOd: 'SIN ALTERACION',
            tratamiento: 'Uso permanente de lentes',
            notasAdicionales: 'Control en 6 meses',
          }),
          update: expect.not.objectContaining({ rxUsoOdAv: expect.anything() }),
        }),
      );
    });

    it('fuerza tipo INTEGRAL aunque el cliente envíe un tipo legado', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue({ id: 'consulta-1', firmada: false });
      mockPrisma.optometriaInforme.upsert.mockResolvedValue(informeMock);

      await service.saveOptometria('consulta-1', { avOdVl: '20/20', tipo: 'TAMIZAJE' } as any);

      expect(mockPrisma.optometriaInforme.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ tipo: 'INTEGRAL' }),
          update: expect.objectContaining({ tipo: 'INTEGRAL' }),
        }),
      );
    });

    it('lanza ConflictException si la consulta ya fue firmada (inmutable)', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue({ id: 'consulta-1', firmada: true });

      await expect(service.saveOptometria('consulta-1', { avOdVl: '20/20' })).rejects.toThrow(ConflictException);
      expect(mockPrisma.optometriaInforme.upsert).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si la consulta no existe', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(null);

      await expect(service.saveOptometria('x', { avOdVl: '20/20' })).rejects.toThrow(NotFoundException);
      expect(mockPrisma.optometriaInforme.upsert).not.toHaveBeenCalled();
    });
  });

  describe('getOptometria', () => {
    it('busca el informe por consultaId', async () => {
      mockPrisma.optometriaInforme.findUnique.mockResolvedValue(informeMock);

      const res = await service.getOptometria('consulta-1');

      expect(res).toEqual(informeMock);
      expect(mockPrisma.optometriaInforme.findUnique).toHaveBeenCalledWith({ where: { consultaId: 'consulta-1' } });
    });
  });

  describe('firmarConsulta con informe de optometría', () => {
    const passwordHash = bcrypt.hashSync('secreta', 4);

    const consultaFirma = (conInforme: boolean) => ({
      id: 'consulta-1',
      firmada: false,
      motivoConsulta: 'Control visual',
      enfermedadActual: null,
      tipoConsulta: 'Control',
      condicionConsulta: 'Subsecuente',
      formaConsulta: 'Presencial',
      tipoAtencion: 'Consulta externa',
      pacienteId: 'pac-1',
      especialistaId: 'esp-1',
      updatedAt: new Date(),
      diagnosticos: [],
      prescripciones: [],
      paciente: { id: 'pac-1' },
      especialista: { id: 'esp-1', usuarioId: 'user-1', usuario: { id: 'user-1', passwordHash } },
      evaluacionNeuroconductual: null,
      evaluacionNeuropsicometrica: null,
      discusionDiagnostica: null,
      planTratamiento: null,
      optometriaInforme: conInforme ? informeMock : null,
    });

    it('crea Firma DEVOLUCION_RESULTADOS con el usuario real y genera el PDF', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(consultaFirma(true));
      mockPrisma.firma.create.mockResolvedValue({});
      mockPrisma.consultaHCE.update.mockResolvedValue({});
      const genHc = jest.spyOn(service as any, 'generateConsultaPdf').mockResolvedValue('uploads/hce/consulta-1.pdf');
      const genDev = jest.spyOn(service as any, 'generateDevolucionPdf').mockResolvedValue('uploads/hce/devolucion-consulta-1.pdf');

      await service.firmarConsulta('consulta-1', 'secreta', 'user-1');

      expect(genHc).toHaveBeenCalledWith('consulta-1');
      expect(mockPrisma.firma.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            consultaId: 'consulta-1',
            usuarioId: 'user-1',
            tipo: 'DEVOLUCION_RESULTADOS',
            algoritmoHash: 'sha256',
          }),
        }),
      );
      expect(genDev).toHaveBeenCalledWith('consulta-1', expect.any(String));
    });

    it('sin informe no crea firma de devolución ni genera PDF', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(consultaFirma(false));
      mockPrisma.firma.create.mockResolvedValue({});
      mockPrisma.consultaHCE.update.mockResolvedValue({});
      jest.spyOn(service as any, 'generateConsultaPdf').mockResolvedValue('uploads/hce/consulta-1.pdf');
      const genDev = jest.spyOn(service as any, 'generateDevolucionPdf');

      await service.firmarConsulta('consulta-1', 'secreta', 'user-1');

      expect(mockPrisma.firma.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.firma.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tipo: 'CIERRE_HC' }) }),
      );
      expect(genDev).not.toHaveBeenCalled();
    });

    it('rechaza la firma con contraseña incorrecta', async () => {
      mockPrisma.consultaHCE.findUnique.mockResolvedValue(consultaFirma(true));

      await expect(service.firmarConsulta('consulta-1', 'incorrecta', 'user-1')).rejects.toThrow();
      expect(mockPrisma.firma.create).not.toHaveBeenCalled();
    });
  });
});
