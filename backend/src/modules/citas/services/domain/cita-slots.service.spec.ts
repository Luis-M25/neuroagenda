import { Test, TestingModule } from '@nestjs/testing';
import { CitaSlotsService } from './cita-slots.service';
import { PrismaService } from '../../../../common/prisma.service';

describe('CitaSlotsService', () => {
  let service: CitaSlotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitaSlotsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<CitaSlotsService>(CitaSlotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
