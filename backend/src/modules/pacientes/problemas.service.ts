import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class ProblemasService {
  constructor(private readonly prisma: PrismaService) {}
}
