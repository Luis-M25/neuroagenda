import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AlergiasService {
  constructor(private readonly prisma: PrismaService) {}
}
