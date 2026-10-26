import { Injectable } from '@nestjs/common';
import { CitaConflictsService } from './cita-conflicts.service';
import { CitaSlotsService } from './cita-slots.service';
import { CitaRecurrenceService } from './cita-recurrence.service';

@Injectable()
export class CitaDomainService {
  constructor(
    readonly conflicts: CitaConflictsService,
    readonly slots: CitaSlotsService,
    readonly recurrence: CitaRecurrenceService,
  ) {}
}
