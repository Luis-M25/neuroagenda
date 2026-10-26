-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Auditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Auditoria" ("accion", "createdAt", "detalle", "entidad", "entidadId", "id", "ipAddress", "usuarioId") SELECT "accion", "createdAt", "detalle", "entidad", "entidadId", "id", "ipAddress", "usuarioId" FROM "Auditoria";
DROP TABLE "Auditoria";
ALTER TABLE "new_Auditoria" RENAME TO "Auditoria";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
