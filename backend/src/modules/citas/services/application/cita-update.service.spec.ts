import { Test, TestingModule } from '@nestjs/testing';
import { CitaUpdateService } from './cita-update.service';
import { PrismaService } from '../../../../common/prisma.service';
import { AuditoriaService } from '../../../auditoria/auditoria.service';
import { CitaDomainService } from '../domain/cita-domain.service';

describe('CitaUpdateService', () => {
  let service: CitaUpdateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitaUpdateService,
        { provide: PrismaService, useValue: {} },
        { provide: AuditoriaService, useValue: { registrar: jest.fn() } },
        { provide: CitaDomainService, useValue: { conflicts: {} } },
      ],
    }).compile();

    service = module.get<CitaUpdateService>(CitaUpdateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
