import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { load } from 'js-yaml';

interface NotificationTimingConfig {
  retryIntervalMs: number;
  maxRetries: number;
}

interface ReminderConfig {
  minutesBefore: number;
  cronExpression: string;
}

interface NotificationsConfig {
  whatsapp: NotificationTimingConfig;
  email: NotificationTimingConfig;
  reminder: ReminderConfig;
}

interface SyncConfig {
  enabled: boolean;
  intervalMs: number;
  batchSize: number;
  conflictResolution: string;
}

interface AppConfig {
  notifications: NotificationsConfig;
  sync: SyncConfig;
}

const DEFAULT_CONFIG: AppConfig = {
  notifications: {
    whatsapp: { retryIntervalMs: 30000, maxRetries: 3 },
    email: { retryIntervalMs: 15000, maxRetries: 3 },
    reminder: { minutesBefore: 5, cronExpression: '*/1 * * * *' },
  },
  sync: {
    enabled: false,
    intervalMs: 60000,
    batchSize: 100,
    conflictResolution: 'lastWriteWins',
  },
};

@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly logger = new Logger(ConfigService.name);
  private config: AppConfig = structuredClone(DEFAULT_CONFIG);

  onModuleInit() {
    const configPath = resolve(process.cwd(), '..', 'config.yml');
    if (existsSync(configPath)) {
      try {
        const raw = load(readFileSync(configPath, 'utf8')) as Partial<AppConfig>;
        this.config = this.mergeConfig(
          DEFAULT_CONFIG as unknown as Record<string, unknown>,
          raw,
        ) as unknown as AppConfig;
        this.logger.log('Config loaded from config.yml');
      } catch (err) {
        this.logger.warn('Failed to parse config.yml, using defaults', err);
      }
    } else {
      this.logger.warn('config.yml not found, using default config');
    }
  }

  private mergeConfig<T extends Record<string, unknown>>(
    defaults: T,
    overrides: unknown,
  ): T {
    if (!overrides || typeof overrides !== 'object') return structuredClone(defaults);
    const result = { ...defaults };
    for (const key of Object.keys(result) as Array<keyof T>) {
      const overrideVal = (overrides as Record<string, unknown>)[key as string];
      if (
        overrideVal &&
        typeof overrideVal === 'object' &&
        !Array.isArray(overrideVal) &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key])
      ) {
        (result as Record<string, unknown>)[key as string] = this.mergeConfig(
          result[key] as Record<string, unknown>,
          overrideVal,
        );
      } else if (overrideVal !== undefined) {
        (result as Record<string, unknown>)[key as string] = overrideVal;
      }
    }
    return result;
  }

  get notifications(): NotificationsConfig {
    return this.config.notifications;
  }

  get sync(): SyncConfig {
    return this.config.sync;
  }

  get full(): Readonly<AppConfig> {
    return this.config;
  }
}
