import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';

export interface RecetaPdfData {
  numeroReceta: number;
  fecha: Date | string;
  validezDias?: number;
  estadoEnfermedad?: string | null;
  diagnostico?: string | null;
  signosAlarma?: string | null;
  recomendacionesNoFarmacologicas?: string | null;
  peso?: string | null;
  talla?: string | null;
  alergias?: string | null;
  paciente: {
    nombres: string;
    apellidos: string;
    numeroIdentificacion?: string | null;
    numeroHistoriaClinica?: string | null;
    sexo?: string | null;
    genero?: string | null;
    fechaNacimiento?: Date | string | null;
  };
  especialista: {
    nombres?: string | null;
    apellidos?: string | null;
    primerNombre?: string | null;
    segundoNombre?: string | null;
    primerApellido?: string | null;
    segundoApellido?: string | null;
    telefono?: string | null;
    codigoMsp?: string | null;
    especialidad?: string | null;
  };
  items: Array<{
    medicamento: string;
    presentacion?: string | null;
    formaFarmaceutica?: string | null;
    concentracion?: string | null;
    via?: string | null;
    cantidad?: string | null;
    cantidadLetras?: string | null;
    dosis?: string | null;
    frecuencia?: string | null;
    duracion?: string | null;
    indicaciones?: string | null;
  }>;
  hashDocumento?: string;
}

function clean(value?: string | null): string {
  return (value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7e\xa0-\xff\n]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value?: string | null): string {
  return clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatDate(value?: Date | string | null): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatDateOnly(value?: Date | string | null): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function calculateAge(birthDate?: Date | string | null): { years: string; months: string } {
  if (!birthDate) return { years: '', months: '' };
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return { years: '', months: '' };
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years -= 1;
    months = (months + 12) % 12;
  }
  return { years: String(years), months: String(months) };
}

function fitText(text: string, maxWidth: number, font: PDFFont, size: number): string {
  if (!text) return '';
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let output = text;
  while (output.length > 1 && font.widthOfTextAtSize(`${output}...`, size) > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}...`;
}

function wrapText(text: string, maxWidth: number, font: PDFFont, size: number, maxLines: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    const consumed = lines.join(' ').split(/\s+/).length;
    if (consumed < words.length) {
      lines[maxLines - 1] = fitText(`${lines[maxLines - 1]} ...`, maxWidth, font, size);
    }
  }
  return lines;
}

function resolveTemplatePath(): string {
  const candidates = [
    path.join(process.cwd(), 'assets', 'plantilla-receta.pdf'),
    path.join(__dirname, '..', '..', '..', '..', 'assets', 'plantilla-receta.pdf'),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('No se encontró la plantilla de receta');
  return found;
}

export async function buildRecetaPdf(data: RecetaPdfData, outputPath: string): Promise<string> {
  const templateBytes = await fs.promises.readFile(resolveTemplatePath());
  const pdf = await PDFDocument.load(templateBytes);
  const page = pdf.getPages()[0];
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);

  const draw = (text: string, x: number, y: number, size = 9.96, useBold = false) => {
    const value = clean(text);
    if (!value) return;
    page.drawText(value, { x, y, size, font: useBold ? bold : font, color: black });
  };

  const drawFitted = (text: string, x: number, y: number, maxWidth: number, size = 9.96, useBold = false) => {
    const value = fitText(clean(text), maxWidth, useBold ? bold : font, size);
    if (!value) return;
    draw(value, x, y, size, useBold);
  };

  // Ajusta el tamaño de fuente para que quepan varios diagnósticos en la línea
  // del formato antes de recurrir a truncar el texto.
  const drawAutoFit = (text: string, x: number, y: number, maxWidth: number, maxSize = 9.96, minSize = 5.2) => {
    const value = clean(text);
    if (!value) return;
    let size = maxSize;
    while (size > minSize && font.widthOfTextAtSize(value, size) > maxWidth) {
      size = Math.round((size - 0.2) * 10) / 10;
    }
    draw(fitText(value, maxWidth, font, size), x, y, size);
  };

  const drawWrapped = (text: string, x: number, y: number, maxWidth: number, maxLines: number, size = 8) => {
    const lines = wrapText(clean(text), maxWidth, font, size, maxLines);
    lines.forEach((line, index) => {
      page.drawText(line, { x, y: y - index * (size + 1.5), size, font, color: black });
    });
  };

  const clear = (x: number, y: number, width: number, height: number) => {
    page.drawRectangle({ x, y, width, height, color: white });
  };

  const numeroReceta = Math.max(1, Math.trunc(Number(data.numeroReceta) || 1));
  const numeroTitulo = String(numeroReceta).padStart(3, '0');
  const numeroCompleto = String(numeroReceta).padStart(4, '0');

  clear(341, 754, 28, 12);
  draw(numeroTitulo, 343.63, 759.6, 12, true);

  clear(86, 607, 30, 12);
  draw(numeroCompleto, 88.944, 612.46);

  const pacienteNombre = `${data.paciente.apellidos || ''} ${data.paciente.nombres || ''}`.trim();
  const pacienteDocumento = data.paciente.numeroIdentificacion || '';
  const pacienteHistoria = data.paciente.numeroHistoriaClinica || data.paciente.numeroIdentificacion || '';
  const sexoRaw = (data.paciente.sexo || data.paciente.genero || '').toUpperCase();
  const sexo = sexoRaw.startsWith('F') || sexoRaw.startsWith('MUJER') || sexoRaw.startsWith('FEMEN') ? 'F'
    : sexoRaw.startsWith('M') || sexoRaw.startsWith('HOMBRE') || sexoRaw.startsWith('MASCUL') ? 'M'
    : '';
  const fechaNacimiento = formatDateOnly(data.paciente.fechaNacimiento);
  const edad = calculateAge(data.paciente.fechaNacimiento);

  drawFitted(pacienteNombre, 31.92, 711.94, 525);
  drawFitted(pacienteDocumento, 302, 717.94, 145);
  if (sexo === 'F') draw('X', 494, 711.94);
  if (sexo === 'M') draw('X', 526, 711.94);

  drawFitted(pacienteHistoria, 104, 699.46, 80);
  const estado = normalize(data.estadoEnfermedad);
  if (estado.includes('agud')) draw('X', 333, 699.46);
  if (estado.includes('cron')) draw('X', 400, 699.46);

  drawFitted(fechaNacimiento, 128, 686.86, 55);
  drawFitted(edad.years, 218, 686.86, 30);
  if (Number(edad.years) < 5) drawFitted(edad.months, 280, 686.86, 38);

  drawFitted(data.peso || '', 62, 674.38, 45);
  drawFitted(data.talla || '', 218, 662.38, 52);

  const alergiaTexto = clean(data.alergias);
  const tieneAlergias = Boolean(
    alergiaTexto &&
      !/^(no|ninguna|ninguno|sin alergias|no refiere|no refiere alergias)/.test(normalize(alergiaTexto)),
  );
  draw('X', tieneAlergias ? 94 : 131.5, 649.9);
  drawFitted(tieneAlergias ? alergiaTexto : 'No refiere', 203, 649.9, 350);

  // El formato impreso dice "(CIE-10)"; lo reemplazamos por una etiqueta
  // neutral porque la receta puede incluir CIE-10 y DSM-5 a la vez.
  clear(32.5, 635.5, 95, 11);
  draw('Diagnóstico:', 31.92, 637.42, 9.96, true);
  drawAutoFit(data.diagnostico || '', 128, 637.42, 430);

  const tableX = [28.68, 115.82, 180.62, 251.45, 324.67, 391.27];
  const tableW = [86.904, 64.32, 70.344, 72.744, 66.24, 175.49];
  const rowHeight = 41.983;
  const firstRowY = 523.99;

  const items = (data.items || []).slice(0, 6);
  items.forEach((item, index) => {
    const y = firstRowY - index * rowHeight;
    const medicamento = [item.medicamento, item.presentacion].filter(Boolean).join(' ');
    const cantidad = [item.cantidad, item.cantidadLetras ? `(${item.cantidadLetras})` : '']
      .filter(Boolean)
      .join(' ');
    const posologia = [
      item.dosis,
      item.frecuencia,
      item.duracion,
      item.indicaciones,
    ]
      .filter(Boolean)
      .join('. ');

    drawWrapped(medicamento, tableX[0] + 4, y, tableW[0] - 8, 3, 7.4);
    drawWrapped(item.formaFarmaceutica || item.presentacion || '', tableX[1] + 4, y, tableW[1] - 8, 3, 7.4);
    drawWrapped(item.concentracion || '', tableX[2] + 4, y, tableW[2] - 8, 3, 7.4);
    drawWrapped(item.via || '', tableX[3] + 4, y, tableW[3] - 8, 3, 7.4);
    drawWrapped(cantidad, tableX[4] + 4, y, tableW[4] - 8, 3, 7.4);
    drawWrapped(posologia, tableX[5] + 4, y, tableW[5] - 8, 3, 7.4);
  });

  drawWrapped(
    data.signosAlarma || 'Fiebre alta persistente, dificultad respiratoria, reacciones alérgicas agudas, convulsiones o deterioro del estado general.',
    119.5,
    250.01,
    443,
    3,
    8,
  );

  drawWrapped(
    data.recomendacionesNoFarmacologicas || 'Mantener hidratación adecuada, reposo relativo, dieta balanceada y acudir a controles programados.',
    119.5,
    225.5,
    443,
    3,
    8,
  );

  const especialista = data.especialista;
  const especialistaNombre =
    [especialista.primerNombre, especialista.segundoNombre, especialista.primerApellido, especialista.segundoApellido]
      .filter(Boolean)
      .join(' ') ||
    `${especialista.nombres || ''} ${especialista.apellidos || ''}`.trim();

  drawFitted(especialistaNombre, 118, 164.42, 160);
  drawFitted(especialista.telefono || '', 76, 152.42, 145);
  drawFitted(especialista.codigoMsp || '', 147, 127.94, 105);

  drawFitted(formatDate(data.fecha), 135, 599.98, 130);

  if (Number(data.validezDias || 3) !== 3) {
    clear(248, 584.9, 100, 11.7);
    page.drawLine({
      start: { x: 248, y: 584.98 },
      end: { x: 348, y: 584.98 },
      thickness: 0.48,
      color: black,
    });
    draw(`VALIDEZ DE ${data.validezDias} DÍAS`, 253.97, 587.38);
  }

  pdf.setTitle(`Receta médica ${numeroCompleto}`);
  pdf.setSubject('Receta médica');
  pdf.setAuthor(especialistaNombre || 'Instituto de Neurociencias');
  pdf.setCreator('Sistema de Agendamiento');
  pdf.setProducer('Sistema de Agendamiento');
  if (data.hashDocumento) {
    pdf.setKeywords([`SHA-256:${data.hashDocumento}`, `Receta:${numeroCompleto}`]);
  }

  const bytes = await pdf.save();
  await fs.promises.writeFile(outputPath, bytes);
  return outputPath;
}
