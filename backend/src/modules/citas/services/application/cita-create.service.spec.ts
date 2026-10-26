import { Test, TestingModule } from '@nestjs/testing';
import { CitaCreateService } from './cita-create.service';
import { PrismaService } from '../../../../common/prisma.service';
import { AuditoriaService } from '../../../auditoria/auditoria.service';
import { CitaDomainService } from '../domain/cita-domain.service';

describe('CitaCreateService', () => {
  let service: CitaCreateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitaCreateService,
        { provide: PrismaService, useValue: {} },
        { provide: AuditoriaService, useValue: { registrar: jest.fn() } },
        { provide: CitaDomainService, useValue: { conflicts: {}, recurrence: {} } },
      ],
    }).compile();

    service = module.get<CitaCreateService>(CitaCreateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
