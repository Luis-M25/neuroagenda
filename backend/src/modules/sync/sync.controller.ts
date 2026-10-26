import { Controller, Get } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Get('status')
  getStatus() {
    return this.syncService.getStatus();
  }
}
