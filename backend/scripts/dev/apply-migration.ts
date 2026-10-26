// Aplica manualmente la migración:
// BACKUP data → ADD columnas con default '' → BACKFILL nombres/apellidos → CREATE nuevas tablas
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const BACKEND_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.resolve(BACKEND_DIR, 'prisma', 'dev.db');
const BACKUP_PATH = path.resolve(BACKEND_DIR, 'prisma', `dev.db.backup-${Date.now()}`);

async function run() {
  console.log('[1] Backup DB →', BACKUP_PATH);
  fs.copyFileSync(DB_PATH, BACKUP_PATH);

  const prisma = new PrismaClient();

  console.log('[2a] Adding primerNombre/segundoNombre/primerApellido/segundoApellido as nullable with default...');
  const ddl = [
    `ALTER TABLE Usuario ADD COLUMN primerNombre TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE Usuario ADD COLUMN segundoNombre TEXT`,
    `ALTER TABLE Usuario ADD COLUMN primerApellido TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE Usuario ADD COLUMN segundoApellido TEXT`,
    `ALTER TABLE Especialista ADD COLUMN primerNombre TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE Especialista ADD COLUMN segundoNombre TEXT`,
    `ALTER TABLE Especialista ADD COLUMN primerApellido TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE Especialista ADD COLUMN segundoApellido TEXT`,
    `ALTER TABLE Especialista ADD COLUMN estadoCivil TEXT`,
    `ALTER TABLE Especialista ADD COLUMN emailSecundario TEXT`,
    `ALTER TABLE Especialista ADD COLUMN telefonoSecundario TEXT`,
    `ALTER TABLE Especialista ADD COLUMN colorCalendario TEXT`,
    `ALTER TABLE Especialista ADD COLUMN codigoAlfabetico TEXT`,
    `ALTER TABLE Paciente ADD COLUMN primerNombre TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE Paciente ADD COLUMN segundoNombre TEXT`,
    `ALTER TABLE Paciente ADD COLUMN primerApellido TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE Paciente ADD COLUMN segundoApellido TEXT`,
    `ALTER TABLE Pasante ADD COLUMN primerNombre TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE Pasante ADD COLUMN segundoNombre TEXT`,
    `ALTER TABLE Pasante ADD COLUMN primerApellido TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE Pasante ADD COLUMN segundoApellido TEXT`,
    `ALTER TABLE Administracion ADD COLUMN primerNombre TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE Administracion ADD COLUMN segundoNombre TEXT`,
    `ALTER TABLE Administracion ADD COLUMN primerApellido TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE Administracion ADD COLUMN segundoApellido TEXT`,
  ];
  for (const sql of ddl) {
    try { await prisma.$executeRawUnsafe(sql); } catch (e: any) { console.warn('  skip:', sql.split('\n')[0].slice(0,80), '→', e.message.split('\n').pop()?.trim()); }
  }

  console.log('[2b] Backfill nombres → primerNombre / apellidos → primerApellido...');
  const tablesWithSplit = ['Especialista', 'Paciente', 'Pasante', 'Administracion'];
  for (const t of tablesWithSplit) {
    await prisma.$executeRawUnsafe(`UPDATE ${t} SET primerNombre = nombres WHERE nombres IS NOT NULL AND (primerNombre IS NULL OR primerNombre = '')`);
    await prisma.$executeRawUnsafe(`UPDATE ${t} SET primerApellido = apellidos WHERE apellidos IS NOT NULL AND (primerApellido IS NULL OR primerApellido = '')`);
  }
  console.log('[2] Backfill OK');

  await prisma.$disconnect();

  console.log('[3] prisma db push...');
  try {
    execSync(`npx prisma db push --schema prisma/schema.prisma --skip-generate --accept-data-loss`, {
      stdio: 'inherit',
      cwd: BACKEND_DIR,
    });
  } catch (e: any) {
    console.error('[3] Failed', e.message);
    process.exit(1);
  }

  console.log('[4] prisma generate...');
  execSync(`npx prisma generate`, {
    stdio: 'inherit',
    cwd: BACKEND_DIR,
  });

  console.log('MIGRACIÓN APLICADA. Backup guardado en:', BACKUP_PATH);
}

run().catch((e) => { console.error(e); process.exit(1); });
