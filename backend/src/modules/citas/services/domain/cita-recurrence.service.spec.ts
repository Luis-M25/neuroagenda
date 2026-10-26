import { Test, TestingModule } from '@nestjs/testing';
import { CitaRecurrenceService } from './cita-recurrence.service';
import { PrismaService } from '../../../../common/prisma.service';

describe('CitaRecurrenceService', () => {
  let service: CitaRecurrenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitaRecurrenceService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<CitaRecurrenceService>(CitaRecurrenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
