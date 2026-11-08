import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

/**
 * Utilidades compartidas por los PDF de Optometría (Historia Clínica y
 * Devolución de Resultados). El membrete y el pie son las imágenes
 * institucionales usadas en la plantilla oficial.
 */

export const PAGE = { width: 595.28, height: 841.89 };

export const LAYOUT = {
  header: { x: 52.8, y: 54.1, width: 489.1, height: 34.6 },
  footer: { x: 0, y: 773.6, width: 202.4, height: 67.6 },
  devolucion: {
    left: 97.8,
    width: 412.5,
    titleY: 100,
    observationsLeft: 85,
    observationsWidth: 425.5,
    firstLineY: 121,
    lineGap: 23,
    footerTextY: 691,
  },
  hc: {
    left: 97.8,
    top: 110,
    bottom: 730,
    width: 412.5,
  },
};

const BODY_COLOR = '#111111';
const MUTED_COLOR = '#4b5563';
const RULE_COLOR = '#cbd5e1';
const HEADER_FILL = '#eef2f7';

/** Ruta de un recurso institucional, tolerante al directorio de ejecución. */
export function resolveAsset(name: string): string | null {
  const candidates = [
    path.join(process.cwd(), 'assets', name),
    path.join(__dirname, '..', '..', '..', '..', 'assets', name),
    path.join(__dirname, '..', '..', '..', 'assets', name),
    path.join(process.cwd(), '..', 'backend', 'assets', name),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

export function createPdf(options: {
  margins?: { top: number; bottom: number; left: number; right: number };
  info?: Record<string, string>;
} = {}): PDFKit.PDFDocument {
  return new PDFDocument({
    size: 'A4',
    margins: options.margins ?? { top: 0, bottom: 0, left: 0, right: 0 },
    info: options.info,
  });
}

export function drawInstitutionalHeader(doc: PDFKit.PDFDocument): void {
  const asset = resolveAsset('membrete-instituto.jpeg');
  if (asset) {
    doc.image(asset, LAYOUT.header.x, LAYOUT.header.y, {
      width: LAYOUT.header.width,
      height: LAYOUT.header.height,
    });
    return;
  }
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(BODY_COLOR)
    .text('Instituto de Neurociencias — Ecuador', LAYOUT.header.x, 62, {
      width: LAYOUT.header.width,
      align: 'center',
    });
}

export function drawInstitutionalFooter(doc: PDFKit.PDFDocument): void {
  const asset = resolveAsset('pie-instituto.png');
  if (asset) {
    doc.image(asset, LAYOUT.footer.x, LAYOUT.footer.y, {
      width: LAYOUT.footer.width,
      height: LAYOUT.footer.height,
    });
    return;
  }
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(MUTED_COLOR)
    .text('Instituto de Neurociencias — Ecuador', LAYOUT.footer.x + 20, 800, {
      width: LAYOUT.footer.width,
      align: 'left',
    });
}

/** Dibuja membrete y pie en la página actual. */
export function drawInstitutionalPage(doc: PDFKit.PDFDocument): void {
  drawInstitutionalHeader(doc);
  drawInstitutionalFooter(doc);
}

/** Repite membrete y pie en cada página nueva. */
export function attachInstitutionalPage(doc: PDFKit.PDFDocument): void {
  doc.on('pageAdded', () => drawInstitutionalPage(doc));
}

export function savePdf(doc: PDFKit.PDFDocument, outputPath: string): Promise<string> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputPath);
    stream.on('error', reject);
    stream.on('finish', () => resolve(outputPath));
    doc.pipe(stream);
    doc.end();
  });
}

// ── Formato de datos ───────────────────────────────────────────────

export function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function valueOrDash(value: unknown): string {
  return toText(value) || '—';
}

export function formatDate(value?: Date | string | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatLongDate(value?: Date | string | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(value?: Date | string | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(value?: Date | string | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = formatDate(date);
  const time = formatTime(date);
  return time ? `${day} ${time}` : day;
}

export function calcularEdad(
  fechaNacimiento?: Date | string | null,
  referencia?: Date | string | null,
): string {
  if (!fechaNacimiento) return '—';
  const nac = fechaNacimiento instanceof Date ? fechaNacimiento : new Date(fechaNacimiento);
  const ref = referencia ? (referencia instanceof Date ? referencia : new Date(referencia)) : new Date();
  if (Number.isNaN(nac.getTime()) || Number.isNaN(ref.getTime())) return '—';

  let edad = ref.getFullYear() - nac.getFullYear();
  const mes = ref.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && ref.getDate() < nac.getDate())) edad -= 1;
  return edad >= 0 ? `${edad} años` : '—';
}

export function nombrePaciente(paciente: any): string {
  if (!paciente) return '—';
  const completo = `${toText(paciente.nombres)} ${toText(paciente.apellidos)}`.trim();
  if (completo) return completo;
  return (
    [paciente.primerNombre, paciente.segundoNombre, paciente.primerApellido, paciente.segundoApellido]
      .map(toText)
      .filter(Boolean)
      .join(' ') || '—'
  );
}

export function nombreEspecialista(especialista: any): string {
  if (!especialista) return '—';
  const completo = `${toText(especialista.nombres)} ${toText(especialista.apellidos)}`.trim();
  if (completo) return completo;
  return (
    [especialista.primerNombre, especialista.segundoNombre, especialista.primerApellido, especialista.segundoApellido]
      .map(toText)
      .filter(Boolean)
      .join(' ') || '—'
  );
}

/** Nombre para el bloque "Elaborado por", con tratamiento profesional. */
export function nombreFirma(especialista: any): string {
  const nombre = nombreEspecialista(especialista);
  if (nombre === '—') return nombre;
  if (/^(dr|dra|lic|lcdo|lcda|md|mgs)\.?\s/i.test(nombre)) return nombre;
  return `Lic. ${nombre}`;
}

export function esOptometria(especialidad?: string | null): boolean {
  return /opto/i.test(toText(especialidad));
}

export function fechaAtencion(consulta: any): Date {
  return consulta?.cita?.fecha ? new Date(consulta.cita.fecha) : new Date(consulta?.createdAt ?? Date.now());
}

export function humanizarEnum(value: unknown): string {
  const raw = toText(value);
  if (!raw) return '—';
  const map: Record<string, string> = {
    NO_EVALUADO: 'No evaluado',
    NORMAL: 'Normal',
    ANORMAL: 'Anormal',
    SIN_ALTERACION: 'Sin alteración',
    PRESUNTIVO: 'Presuntivo',
    DEFINITIVO: 'Definitivo',
    ACTIVA: 'Activa',
    ACTIVO: 'Activo',
    INACTIVA: 'Inactiva',
    INACTIVO: 'Inactivo',
    PENDIENTE: 'Pendiente',
    COMPLETADO: 'Completado',
    REALIZADO: 'Realizado',
    LEVE: 'Leve',
    MODERADA: 'Moderada',
    GRAVE: 'Grave',
    PERSONAL: 'Personal',
    FAMILIAR: 'Familiar',
    QUIRURGICO: 'Quirúrgico',
    NO_QUIRURGICO: 'No quirúrgico',
    MEDICO: 'Médico',
    FARMACOLOGICO: 'Farmacológico',
    TRAUMATICO: 'Traumático',
    GINECOLOGICO: 'Ginecológico',
    OBSTETRICO: 'Obstétrico',
    PSIQUIATRICO: 'Psiquiátrico',
    CEDULA: 'Cédula',
    PASAPORTE: 'Pasaporte',
    RUC: 'RUC',
    A_POSITIVO: 'A positivo',
    A_NEGATIVO: 'A negativo',
    B_POSITIVO: 'B positivo',
    B_NEGATIVO: 'B negativo',
    O_POSITIVO: 'O positivo',
    O_NEGATIVO: 'O negativo',
    AB_POSITIVO: 'AB positivo',
    AB_NEGATIVO: 'AB negativo',
  };
  return map[raw.toUpperCase()] ?? raw.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/** Humaniza el tipo de seguro sin destruir siglas institucionales (IESS, ISSPOL, etc.). */
export function humanizarSeguro(value: unknown): string {
  const raw = toText(value);
  if (!raw) return '—';
  const map: Record<string, string> = {
    PRIVADO: 'Privado',
    PUBLICO: 'Público',
    NINGUNO: 'Ninguno',
  };
  return map[raw.toUpperCase()] ?? raw;
}

export function siNo(value: unknown): string {
  if (value === true) return 'Sí';
  if (value === false) return 'No';
  return '—';
}

// ── Flujo de contenido para la Historia Clínica ────────────────────

export interface PdfFlow {
  doc: PDFKit.PDFDocument;
  x: number;
  width: number;
  y: number;
  top: number;
  bottom: number;
}

export function createFlow(
  doc: PDFKit.PDFDocument,
  options: { x: number; width: number; top: number; bottom: number; y?: number },
): PdfFlow {
  return {
    doc,
    x: options.x,
    width: options.width,
    top: options.top,
    bottom: options.bottom,
    y: options.y ?? options.top,
  };
}

export function flowNewPage(flow: PdfFlow): void {
  flow.doc.addPage();
  flow.y = flow.top;
}

export function flowEnsure(flow: PdfFlow, height: number): void {
  if (flow.y + height > flow.bottom) flowNewPage(flow);
}

export function flowSpacer(flow: PdfFlow, height: number): void {
  flow.y += height;
}

export function flowSection(flow: PdfFlow, title: string): void {
  flowEnsure(flow, 26);
  const { doc, x, width } = flow;
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#1f4e79')
    .text(title.toUpperCase(), x, flow.y, { width });
  doc
    .moveTo(x, flow.y + 12)
    .lineTo(x + width, flow.y + 12)
    .lineWidth(0.8)
    .strokeColor('#1f4e79')
    .stroke();
  flow.y += 18;
}

export function flowParagraph(
  flow: PdfFlow,
  text: string,
  options: { size?: number; lineGap?: number; color?: string; italic?: boolean; spacingAfter?: number } = {},
): void {
  const { doc, x, width } = flow;
  const content = toText(text) || 'Sin registro.';
  const size = options.size ?? 9.5;
  const lineGap = options.lineGap ?? 2;
  const spacingAfter = options.spacingAfter ?? 7;

  doc.font(options.italic ? 'Helvetica-Oblique' : 'Helvetica').fontSize(size);
  const height = doc.heightOfString(content, { width, lineGap });
  flowEnsure(flow, Math.min(height, flow.bottom - flow.top));
  doc
    .fillColor(options.color ?? BODY_COLOR)
    .text(content, x, flow.y, { width, lineGap, align: 'justify' });
  flow.y = doc.y + spacingAfter;
}

export interface KeyValueItem {
  label: string;
  value: string;
  /** Si es true, el valor ocupa todo el ancho (direcciones, observaciones). */
  full?: boolean;
}

/** Formulario vertical etiqueta/valor; robusto para textos largos. */
export function flowKeyValues(flow: PdfFlow, items: KeyValueItem[]): void {
  if (!items.length) return;
  const { doc, x, width } = flow;
  const labelWidth = 112;
  const valueWidth = width - labelWidth - 8;

  for (const item of items) {
    const value = toText(item.value) || '—';
    doc.font('Helvetica').fontSize(9);
    const valueHeight = doc.heightOfString(value, { width: valueWidth });
    const rowHeight = Math.max(14, valueHeight + 4);
    flowEnsure(flow, rowHeight + 4);

    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(MUTED_COLOR)
      .text(item.label, x, flow.y + 1, { width: labelWidth - 6 });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(BODY_COLOR)
      .text(value, x + labelWidth, flow.y, { width: valueWidth });

    flow.y += rowHeight;
    doc
      .moveTo(x, flow.y)
      .lineTo(x + width, flow.y)
      .lineWidth(0.3)
      .strokeColor('#e5e7eb')
      .stroke();
    flow.y += 2;
  }
  flow.y += 5;
}

export interface TableColumn {
  label: string;
  /** Proporción del ancho total (se normaliza). */
  width: number;
  align?: 'left' | 'center' | 'right';
}

export function flowTable(
  flow: PdfFlow,
  columns: TableColumn[],
  rows: string[][],
  options: { fontSize?: number; minRowHeight?: number; headerFill?: string; after?: number } = {},
): void {
  if (!columns.length) return;
  const { doc, x, width } = flow;
  const fontSize = options.fontSize ?? 8;
  const minRowHeight = options.minRowHeight ?? 14;
  const pad = 3;
  const sum = columns.reduce((acc, col) => acc + col.width, 0) || 1;
  const widths = columns.map((col) => (width * col.width) / sum);

  const drawHeader = () => {
    const rowHeight = 15;
    flowEnsure(flow, rowHeight + 2);
    let cellX = x;
    columns.forEach((col, index) => {
      doc.rect(cellX, flow.y, widths[index], rowHeight).lineWidth(0.5).fillAndStroke(options.headerFill ?? HEADER_FILL, '#64748b');
      doc
        .font('Helvetica-Bold')
        .fontSize(fontSize)
        .fillColor('#1f2937')
        .text(col.label, cellX + pad, flow.y + pad + 1, {
          width: widths[index] - pad * 2,
          align: col.align ?? 'left',
        });
      cellX += widths[index];
    });
    flow.y += rowHeight;
  };

  drawHeader();

  rows.forEach((row) => {
    doc.font('Helvetica').fontSize(fontSize);
    let rowHeight = minRowHeight;
    row.forEach((cell, index) => {
      const colWidth = widths[index] ?? widths[widths.length - 1];
      const height = doc.heightOfString(toText(cell), {
        width: colWidth - pad * 2,
        align: columns[index]?.align ?? 'left',
      });
      rowHeight = Math.max(rowHeight, height + pad * 2 + 1);
    });

    if (flow.y + rowHeight > flow.bottom) {
      flowNewPage(flow);
      drawHeader();
    }

    let cellX = x;
    row.forEach((cell, index) => {
      const colWidth = widths[index] ?? widths[widths.length - 1];
      doc.rect(cellX, flow.y, colWidth, rowHeight).lineWidth(0.4).strokeColor('#94a3b8').stroke();
      doc
        .font('Helvetica')
        .fontSize(fontSize)
        .fillColor(BODY_COLOR)
        .text(toText(cell) || '—', cellX + pad, flow.y + pad, {
          width: colWidth - pad * 2,
          align: columns[index]?.align ?? 'left',
        });
      cellX += colWidth;
    });
    flow.y += rowHeight;
  });

  flow.y += options.after ?? 8;
}
