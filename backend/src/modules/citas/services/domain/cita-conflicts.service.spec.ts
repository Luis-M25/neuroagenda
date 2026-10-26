import { Test, TestingModule } from '@nestjs/testing';
import { CitaConflictsService } from './cita-conflicts.service';
import { PrismaService } from '../../../../common/prisma.service';

describe('CitaConflictsService', () => {
  let service: CitaConflictsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitaConflictsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<CitaConflictsService>(CitaConflictsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
