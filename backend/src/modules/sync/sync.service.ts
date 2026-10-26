import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import format from 'pg-format';
import { PrismaService } from '../../common/prisma.service';
import { ConfigService } from '../../common/config.service';

@Injectable()
export class SyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncService.name);
  private pgPool: Pool | null = null;
  private isSyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.connectPg();
    if (this.isEnabled) {
      this.startSyncLoop();
    }
  }

  private connectPg(): void {
    const url = process.env.SYNC_DATABASE_URL;
    if (!url) {
      this.logger.warn('SYNC_DATABASE_URL not set, sync disabled');
      return;
    }

    try {
      this.pgPool = new Pool({ connectionString: url });

      this.pgPool.on('error', (err) => {
        this.logger.error('PostgreSQL pool error', err.message);
      });
      this.logger.log('PostgreSQL connection pool created');
    } catch (err) {
      this.logger.error('Failed to create PostgreSQL pool', err);
    }
  }

  private startSyncLoop() {
    const intervalMs = this.configService.sync.intervalMs;
    this.syncTimer = setInterval(() => this.syncChanges(), intervalMs);
    this.logger.log(`Sync loop started (${intervalMs}ms)`);
  }

  get isEnabled(): boolean {
    return this.configService.sync.enabled && this.pgPool !== null;
  }

  async getStatus() {
    if (!this.pgPool) {
      return { enabled: false, reason: 'SYNC_DATABASE_URL not configured' };
    }

    const pendingCount = await this.prisma.syncedChange.count({
      where: { syncedAt: null },
    });

    let postgresStatus = 'disconnected';
    try {
      const client = await this.pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      postgresStatus = 'connected';
    } catch {
      postgresStatus = 'unreachable';
    }

    return {
      enabled: this.configService.sync.enabled,
      postgresStatus,
      pendingChanges: pendingCount,
      intervalMs: this.configService.sync.intervalMs,
      batchSize: this.configService.sync.batchSize,
    };
  }

  registerChange(entidad: string, entidadId: string, operacion: string, datos: Record<string, unknown>) {
    this.prisma.syncedChange
      .create({
        data: {
          entidad,
          entidadId,
          operacion,
          datos: JSON.stringify(datos),
        },
      })
      .catch((err) => this.logger.error('Error registering sync change', err));
  }

  private async syncChanges() {
    if (!this.isEnabled || this.isSyncing) return;
    this.isSyncing = true;

    try {
      const batchSize = this.configService.sync.batchSize;
      const changes = await this.prisma.syncedChange.findMany({
        where: { syncedAt: null },
        take: batchSize,
        orderBy: { createdAt: 'asc' },
      });

      if (changes.length === 0) {
        this.isSyncing = false;
        return;
      }

      for (const change of changes) {
        try {
          const datos = JSON.parse(change.datos);
          await this.applyChange(change.entidad, change.operacion, datos);

          await this.prisma.syncedChange.update({
            where: { id: change.id },
            data: { syncedAt: new Date() },
          });
        } catch (err) {
          this.logger.error(`Sync failed for change ${change.id}`, err);
          await this.prisma.syncedChange.update({
            where: { id: change.id },
            data: {
              intentos: change.intentos + 1,
              error: err.message?.slice(0, 500) || 'Unknown error',
            },
          });
        }
      }

      this.logger.log(`Synced ${changes.length} changes`);
    } catch (err) {
      this.logger.error('Sync batch failed', err);
    } finally {
      this.isSyncing = false;
    }
  }

  private async applyChange(entidad: string, operacion: string, datos: Record<string, unknown>) {
    if (!this.pgPool) return;

    const tableMap: Record<string, string> = {
      cita: 'Cita',
      paciente: 'Paciente',
      especialista: 'Especialista',
      usuario: 'Usuario',
    };

    const pgTable = tableMap[entidad] || entidad;
    const { id, createdAt, updatedAt, ...fields } = datos;

    if (operacion === 'CREATE' || operacion === 'UPDATE') {
      const keys = Object.keys(fields);
      const values = Object.values(fields);
      const placeholders = values.map((_, i) => `$${i + 1}`);

      const escapedKeys = keys.map((k) => format.ident(k)).join(', ');
      const escapedTable = format.ident(pgTable);
      const setClauses = keys.map((k, i) => `${format.ident(k)} = $${i + 1}`).join(', ');

      await this.pgPool.query(
        `INSERT INTO ${escapedTable} (${escapedKeys})
         VALUES (${placeholders.join(', ')})
         ON CONFLICT (${format.ident('id')}) DO UPDATE SET ${setClauses}`,
        [...values, ...values],
      );
    } else if (operacion === 'DELETE') {
      await this.pgPool.query(
        `DELETE FROM ${format.ident(pgTable)} WHERE ${format.ident('id')} = $1`,
        [id],
      );
    }
  }

  onModuleDestroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    if (this.pgPool) {
      this.pgPool.end();
      this.logger.log('PostgreSQL pool closed');
    }
  }
}
