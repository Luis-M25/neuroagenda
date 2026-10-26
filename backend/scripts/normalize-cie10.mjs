import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://raw.githubusercontent.com/cayasso/cie10/master/cie10-array.json';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '..', 'src', 'data', 'cie10.json');

function normalizeCode(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!/^[A-Z]\d{2}\d{0,2}$/.test(code)) return null;
  if (code.length <= 3) return code;
  return `${code.slice(0, 3)}.${code.slice(3)}`;
}

const response = await fetch(SOURCE_URL);
if (!response.ok) {
  throw new Error(`No se pudo descargar el catálogo CIE-10: HTTP ${response.status}`);
}

const source = await response.json();
if (!Array.isArray(source)) {
  throw new Error('El catálogo CIE-10 no tiene el formato esperado');
}

const byCode = new Map();
for (const row of source) {
  const codigo = normalizeCode(row?.c);
  const descripcion = String(row?.d || '').trim();
  if (!codigo || !descripcion || byCode.has(codigo)) continue;
  byCode.set(codigo, { codigo, descripcion });
}

const catalog = Array.from(byCode.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
await writeFile(outputPath, `${JSON.stringify(catalog)}\n`, 'utf8');

console.log(`CIE-10 generado: ${catalog.length} códigos en ${outputPath}`);
console.log('Muestra:', catalog.slice(0, 5));
