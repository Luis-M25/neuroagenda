import {
  LAYOUT,
  PdfFlow,
  attachInstitutionalPage,
  calcularEdad,
  createFlow,
  createPdf,
  drawInstitutionalPage,
  esOptometria,
  fechaAtencion,
  flowEnsure,
  flowKeyValues,
  flowNewPage,
  flowParagraph,
  flowSection,
  flowTable,
  formatDate,
  formatDateTime,
  formatLongDate,
  humanizarEnum,
  humanizarSeguro,
  nombreEspecialista,
  nombreFirma,
  nombrePaciente,
  savePdf,
  siNo,
  toText,
  valueOrDash,
} from './optometry-pdf.utils';
import type { Prisma } from '@prisma/client';

/**
 * Datos necesarios para construir los PDF de Optometría. Se usa el include
 * completo de la consulta para que la Historia Clínica sea autocontenida.
 */
export const optometriaConsultaInclude: Prisma.ConsultaHCEInclude = {
  paciente: {
    include: {
      antecedentes: {
        where: { activo: true },
        orderBy: [{ ambito: 'asc' }, { fecha: 'desc' }],
      },
      historialAlergias: { where: { activa: true } },
      habitos: true,
    },
  },
  especialista: true,
  cita: { select: { fecha: true, horaInicio: true, horaFin: true, lugar: true } },
  diagnosticos: { orderBy: [{ esPrincipal: 'desc' }, { orden: 'asc' }] },
  prescripciones: true,
  pedidos: true,
  examenes: true,
  indicaciones: true,
  evoluciones: true,
  signosVitales: { orderBy: { createdAt: 'asc' } },
  optometriaInforme: true,
  firmas: {
    where: { tipo: 'CIERRE_HC' },
    orderBy: { fechaFirma: 'desc' },
    take: 1,
  },
};

export interface BuildOptometriaPdfInput {
  consulta: any;
  hashDocumento?: string | null;
}

// ── Devolución de Resultados ──────────────────────────────────────

const NORMAL_AV_X = 337;
const NORMAL_RX_X = 334;
const RX_AV_X = 240;
const NORMAL_REF = '20/20';

function drawNormal(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  value?: string,
): void {
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text('Normal', x, y);
  const labelWidth = doc.widthOfString('Normal');
  doc
    .font('Helvetica')
    .fontSize(11)
    .text(value ? `: ${value}` : ':', x + labelWidth, y);
}

function fitText(doc: PDFKit.PDFDocument, value: string, maxWidth: number): string {
  if (doc.widthOfString(value) <= maxWidth) return value;
  let truncated = value;
  while (truncated.length > 0 && doc.widthOfString(`${truncated}…`) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

function drawPatientLine(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
  value: string,
  boldValue = false,
): void {
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text(label, x, y, {
    continued: true,
    width: LAYOUT.devolucion.width,
  });
  doc
    .font(boldValue ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(11)
    .text(` ${value || '—'}`);
}

/**
 * Devolución de resultados: replica la plantilla oficial (una página,
 * membrete y pie institucionales, cuerpo a 11 pt, columna "Normal: 20/20").
 * El hash de verificación queda únicamente en los metadatos del PDF.
 */
export async function buildDevolucionOptometriaPdf(
  input: BuildOptometriaPdfInput,
  outputPath: string,
): Promise<string> {
  const { consulta } = input;
  const info: any = consulta.optometriaInforme;
  if (!info) throw new Error('La consulta no tiene informe de optometría');

  const paciente = consulta.paciente ?? {};
  const especialista = consulta.especialista ?? {};
  const fecha = fechaAtencion(consulta);
  const edad = calcularEdad(paciente.fechaNacimiento, fecha);
  const hash = toText(input.hashDocumento);

  const doc = createPdf({
    margins: { top: 110, bottom: 170, left: 0, right: 0 },
    info: {
      Title: 'Informe de Resultados Optométricos Especializados',
      Author: nombreFirma(especialista),
      Subject: `Devolución de resultados — ${nombrePaciente(paciente)}`,
      Keywords: hash ? `SHA-256: ${hash}` : 'Documento sin firma electrónica',
      Creator: 'Instituto de Neurociencias — Ecuador',
      Producer: 'Instituto de Neurociencias — Ecuador',
    },
  });

  attachInstitutionalPage(doc);
  drawInstitutionalPage(doc);

  const left = LAYOUT.devolucion.left;
  const width = LAYOUT.devolucion.width;

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111111')
    .text('INFORME DE RESULTADOS OPTOMÉTRICOS ESPECIALIZADOS', LAYOUT.header.x, LAYOUT.devolucion.titleY, {
      width: LAYOUT.header.width,
      align: 'center',
    });

  let y = LAYOUT.devolucion.firstLineY;
  drawPatientLine(doc, left, y, 'Nombres y apellidos:', nombrePaciente(paciente));
  y += LAYOUT.devolucion.lineGap;
  drawPatientLine(doc, left, y, 'Cédula de Identidad:', valueOrDash(paciente.numeroIdentificacion), true);
  y += LAYOUT.devolucion.lineGap;
  drawPatientLine(doc, left, y, 'Edad:', edad, true);
  y += LAYOUT.devolucion.lineGap;
  drawPatientLine(doc, left, y, 'Fecha:', formatDate(fecha), true);

  // Agudeza visual de lejos sin corrección
  y += 36;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text('Agudeza Visual de lejos sin corrección.', left, y);
  y += LAYOUT.devolucion.lineGap;
  doc.font('Helvetica').fontSize(11).text(`O.D: ${valueOrDash(info.avOdVl)}`, left, y);
  drawNormal(doc, NORMAL_AV_X, y, NORMAL_REF);
  y += LAYOUT.devolucion.lineGap;
  doc.font('Helvetica').fontSize(11).text(`O.I: ${valueOrDash(info.avOiVl)}`, left, y);

  // Agudeza visual de cerca
  y += LAYOUT.devolucion.lineGap;
  doc.font('Helvetica-Bold').fontSize(11).text('Agudeza Visual de cerca:', left, y);
  y += LAYOUT.devolucion.lineGap;
  doc.font('Helvetica').fontSize(11).text(`O.D: ${valueOrDash(info.avOdVp)}`, left, y);
  drawNormal(doc, NORMAL_AV_X, y, NORMAL_REF);
  y += LAYOUT.devolucion.lineGap;
  doc.font('Helvetica').fontSize(11).text(`O.I: ${valueOrDash(info.avOiVp)}`, left, y);

  // Refracción final: fórmula + AV VL + referencia "Normal: 20/20"
  y += LAYOUT.devolucion.lineGap;
  doc.font('Helvetica-Bold').fontSize(11).text('Refracción Final', left, y);
  drawNormal(doc, NORMAL_RX_X, y);
  y += LAYOUT.devolucion.lineGap;

  const drawRxLine = (label: string, rx: unknown, av: unknown) => {
    doc.font('Helvetica').fontSize(11).fillColor('#111111').text(`${label}:`, left, y);
    const rxWidth = RX_AV_X - left - 38;
    doc
      .font('Helvetica')
      .fontSize(11)
      .text(fitText(doc, toText(rx) || '—', rxWidth), left + 32, y, { lineBreak: false });
    doc.font('Helvetica').fontSize(11).text(valueOrDash(av), RX_AV_X, y);
    doc.font('Helvetica').fontSize(11).text(NORMAL_REF, NORMAL_RX_X, y);
  };
  drawRxLine('O.D', info.rxFinalOd, info.rxFinalOdAvVl);
  y += LAYOUT.devolucion.lineGap;
  drawRxLine('O.I', info.rxFinalOi, info.rxFinalOiAvVl);

  // Diagnóstico A.O.
  y += LAYOUT.devolucion.lineGap;
  doc.font('Helvetica').fontSize(11).fillColor('#111111').text('Diagnostico:', left, y);
  y += LAYOUT.devolucion.lineGap;
  doc.font('Helvetica').fontSize(11).text(valueOrDash(info.diagnosticoAO), left, y, {
    width,
  });

  // Observaciones / recomendaciones: texto regular, como la plantilla.
  const obsTop = Math.max(491, doc.y + 20);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111111')
    .text('OBSERVACIONES / RECOMENDACIONES ADICIONALES', LAYOUT.devolucion.observationsLeft, obsTop);
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#111111')
    .text(toText(info.recomendaciones) || '—', LAYOUT.devolucion.observationsLeft, obsTop + 26, {
      width: LAYOUT.devolucion.observationsWidth,
      lineGap: 2,
      align: 'left',
    });

  // Bloque de firma y pie institucional (fijo en la plantilla).
  let firmaY = Math.max(LAYOUT.devolucion.footerTextY, doc.y + 28);
  if (firmaY + 52 > 760) {
    doc.addPage();
    firmaY = LAYOUT.devolucion.footerTextY;
  }
  // El bloque de firma vive por debajo del margen inferior del flujo; se
  // desactiva temporalmente el salto automático para no crear páginas vacías.
  const bottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text('Elaborado por:', 96.8, firmaY);
  doc.font('Helvetica-Bold').fontSize(11).text(nombreFirma(especialista), 96.8, firmaY + 17);
  doc.font('Helvetica-Bold').fontSize(11).text('Optometrista – Instituto de Neurociencias', 96.8, firmaY + 34);
  doc.page.margins.bottom = bottomMargin;

  return savePdf(doc, outputPath);
}

// ── Historia Clínica de Optometría ────────────────────────────────

function eyeValue(info: any, key: string, eye: 'Od' | 'Oi'): string {
  const perEye = toText(info?.[`${key}${eye}`]);
  if (perEye) return perEye;
  return toText(info?.[key]);
}

function hasAny(info: any, keys: string[]): boolean {
  return keys.some((key) => toText(info?.[key]));
}

function drawHcTitle(flow: PdfFlow, consulta: any): void {
  const { doc } = flow;
  const paciente = consulta.paciente ?? {};
  const numero = consulta.numeroConsulta
    ? `Consulta N.° ${String(consulta.numeroConsulta).padStart(3, '0')}`
    : 'Consulta';
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#111111')
    .text('HISTORIA CLÍNICA ELECTRÓNICA', 0, 96, { width: 595.28, align: 'center' });
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#1f4e79')
    .text('OPTOMETRÍA', 0, 113, { width: 595.28, align: 'center' });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#4b5563')
    .text(`${numero}  ·  ${nombrePaciente(paciente)}`, 0, 126, { width: 595.28, align: 'center' });
  flow.y = 144;
}

function hcPatientSection(flow: PdfFlow, consulta: any): void {
  const paciente = consulta.paciente ?? {};
  const partesDireccion = [paciente.direccion, paciente.parroquia, paciente.canton, paciente.provincia]
    .map(toText)
    .filter(Boolean)
    .flatMap((parte) => parte.split(',').map((token) => token.trim()).filter(Boolean));
  const direccion = partesDireccion
    .filter(
      (parte, index) =>
        index === 0 || parte.toLowerCase() !== partesDireccion[index - 1].toLowerCase(),
    )
    .join(', ');
  flowSection(flow, 'Datos del paciente');
  flowKeyValues(flow, [
    { label: 'Nombres y apellidos', value: nombrePaciente(paciente) },
    {
      label: 'Identificación',
      value: `${
        toText(paciente.tipoIdentificacion)
          ? humanizarEnum(paciente.tipoIdentificacion)
          : 'Cédula'
      } ${toText(paciente.numeroIdentificacion)}`.trim(),
    },
    {
      label: 'Fecha de nacimiento',
      value: paciente.fechaNacimiento
        ? `${formatDate(paciente.fechaNacimiento)} (${calcularEdad(paciente.fechaNacimiento, fechaAtencion(consulta))})`
        : '—',
    },
    { label: 'Sexo', value: humanizarEnum(paciente.genero) },
    { label: 'Estado civil', value: humanizarEnum(paciente.estadoCivil) },
    { label: 'Teléfono', value: toText(paciente.telefono) || '—' },
    { label: 'Dirección', value: direccion || '—' },
    {
      label: 'Seguro de salud',
      value:
        [
          toText(paciente.tipoSeguro) ? humanizarSeguro(paciente.tipoSeguro) : '',
          paciente.nombreConvenio,
        ]
          .map(toText)
          .filter(Boolean)
          .join(' — ') || '—',
    },
    { label: 'Grupo sanguíneo', value: humanizarEnum(paciente.grupoSanguineo) },
    {
      label: 'Contacto de emergencia',
      value:
        [paciente.emergenciaNombre, paciente.emergenciaParentesco, paciente.emergenciaTelefono]
          .map(toText)
          .filter(Boolean)
          .join(' · ') || '—',
    },
  ]);
}

function hcConsultationSection(flow: PdfFlow, consulta: any): void {
  const especialista = consulta.especialista ?? {};
  const fecha = fechaAtencion(consulta);
  flowSection(flow, 'Datos de la consulta');
  flowKeyValues(flow, [
    {
      label: 'Fecha de atención',
      value: `${formatLongDate(fecha)}${consulta.cita?.horaInicio ? ` · ${consulta.cita.horaInicio}` : ''}`,
    },
    { label: 'N.° de consulta', value: consulta.numeroConsulta ? String(consulta.numeroConsulta).padStart(3, '0') : '—' },
    { label: 'Tipo de consulta', value: humanizarEnum(consulta.tipoConsulta) },
    { label: 'Condición', value: humanizarEnum(consulta.condicionConsulta) },
    { label: 'Forma de atención', value: humanizarEnum(consulta.formaConsulta) },
    { label: 'Tipo de atención', value: humanizarEnum(consulta.tipoAtencion) },
    { label: 'Especialista', value: nombreEspecialista(especialista) },
    { label: 'Especialidad', value: toText(especialista.especialidad) || 'Optometría' },
    {
      label: 'Sede / consultorio',
      value: toText(consulta.cita?.lugar) || toText(especialista.sede) || '—',
    },
  ]);
}

function hcClinicalSections(flow: PdfFlow, consulta: any): void {
  flowSection(flow, 'Motivo de consulta');
  flowParagraph(flow, consulta.motivoConsulta);

  flowSection(flow, 'Enfermedad actual');
  flowParagraph(flow, consulta.enfermedadActual);
  flowKeyValues(flow, [
    { label: 'Tiempo de evolución', value: toText(consulta.tiempoEvolucion) || '—' },
    { label: 'Tratamientos previos', value: toText(consulta.tratamientosPrevios) || '—' },
  ]);
}

function hcAntecedentesSection(flow: PdfFlow, consulta: any): void {
  const antecedentes: any[] = consulta.paciente?.antecedentes ?? [];
  flowSection(flow, 'Antecedentes');
  if (!antecedentes.length) {
    flowParagraph(flow, 'Sin antecedentes registrados.', { italic: true, color: '#6b7280' });
    return;
  }
  flowTable(
    flow,
    [
      { label: 'Ámbito', width: 1.1 },
      { label: 'Tipo', width: 1.4 },
      { label: 'Descripción', width: 3.2 },
      { label: 'Fecha', width: 1.2 },
      { label: 'Observación', width: 2.1 },
    ],
    antecedentes.map((a) => [
      humanizarEnum(a.ambito),
      humanizarEnum(a.tipo),
      toText(a.descripcion),
      formatDate(a.fecha ?? a.fechaDiagnostico),
      toText(a.observacion),
    ]),
  );
}

function hcAlergiasSection(flow: PdfFlow, consulta: any): void {
  const paciente = consulta.paciente ?? {};
  const alergias: any[] = paciente.historialAlergias ?? [];
  const legacy = toText(paciente.alergias);
  flowSection(flow, 'Alergias');
  if (!alergias.length && !legacy) {
    flowParagraph(flow, 'Sin alergias registradas.', { italic: true, color: '#6b7280' });
    return;
  }
  if (alergias.length) {
    flowTable(
      flow,
      [
        { label: 'Tipo', width: 1.5 },
        { label: 'Descripción', width: 3.7 },
        { label: 'Gravedad', width: 1.3 },
        { label: 'Estado', width: 1.2 },
      ],
      alergias.map((a) => [humanizarEnum(a.tipo), toText(a.descripcion), humanizarEnum(a.gravedad), a.activa ? 'Activa' : 'Inactiva']),
    );
  }
  if (legacy) flowParagraph(flow, `Registro previo: ${legacy}`);
}

function hcHabitosSection(flow: PdfFlow, consulta: any): void {
  const habitos: any[] = consulta.paciente?.habitos ?? [];
  flowSection(flow, 'Hábitos');
  if (!habitos.length) {
    flowParagraph(flow, 'Sin hábitos registrados.', { italic: true, color: '#6b7280' });
    return;
  }
  flowTable(
    flow,
    [
      { label: 'Tipo', width: 1.4 },
      { label: 'Presente', width: 1.1 },
      { label: 'Cantidad', width: 1.4 },
      { label: 'Desde', width: 1.3 },
      { label: 'Observación', width: 2.8 },
    ],
    habitos.map((h) => [humanizarEnum(h.tipo), siNo(h.afirmativo), toText(h.cantidad), toText(h.desde), toText(h.observacion)]),
  );
}

function hcSignosVitalesSection(flow: PdfFlow, consulta: any): void {
  const signos: any[] = [...(consulta.signosVitales ?? [])].sort(
    (a, b) =>
      new Date(a.createdAt ?? a.fecha ?? 0).getTime() -
      new Date(b.createdAt ?? b.fecha ?? 0).getTime(),
  );
  flowSection(flow, 'Signos vitales');
  if (!signos.length) {
    flowParagraph(flow, 'Sin signos vitales registrados para esta consulta.', { italic: true, color: '#6b7280' });
    return;
  }
  flowTable(
    flow,
    [
      { label: 'Fecha', width: 1.3 },
      { label: 'PA', width: 1.1 },
      { label: 'FC', width: 0.8, align: 'center' },
      { label: 'Temp.', width: 0.9, align: 'center' },
      { label: 'SpO2', width: 0.9, align: 'center' },
      { label: 'Peso', width: 0.9, align: 'center' },
      { label: 'Talla', width: 0.9, align: 'center' },
      { label: 'IMC', width: 0.8, align: 'center' },
      { label: 'Dolor', width: 0.8, align: 'center' },
      { label: 'Observaciones', width: 2.1 },
    ],
    signos.map((s) => [
      formatDateTime(s.fecha ?? s.createdAt),
      toText(s.presionArterial),
      toText(s.frecuenciaCardiaca),
      s.temperatura != null ? `${s.temperatura} °C` : '',
      s.saturacionOxigeno != null ? `${s.saturacionOxigeno}%` : '',
      s.peso != null ? `${s.peso} kg` : '',
      s.talla != null ? `${s.talla} cm` : '',
      s.imc != null ? String(s.imc) : '',
      s.dolorEVA != null ? `${s.dolorEVA}/10` : '',
      toText(s.observaciones),
    ]),
  );
}

function hcExamenFisicoSection(flow: PdfFlow, consulta: any): void {
  const sistemas: Array<[string, string, string]> = [
    ['Estado general', 'efEstadoGeneral', 'efObsGeneral'],
    ['Cardiovascular', 'efCardiovascular', 'efObsCardio'],
    ['Respiratorio', 'efRespiratorio', 'efObsResp'],
    ['Abdomen', 'efAbdomen', 'efObsAbdomen'],
    ['Neurológico', 'efNeurologico', 'efObsNeuro'],
    ['Extremidades', 'efExtremidades', 'efObsExtrem'],
    ['Piel', 'efPiel', 'efObsPiel'],
    ['Cabeza y cuello', 'efCabezaCuello', 'efObsCabeza'],
  ];
  flowSection(flow, 'Examen físico');
  if (!sistemas.some(([, key]) => toText(consulta[key]) && consulta[key] !== 'NO_EVALUADO')) {
    flowParagraph(flow, 'Examen físico no evaluado.', { italic: true, color: '#6b7280' });
    return;
  }
  flowTable(
    flow,
    [
      { label: 'Sistema', width: 1.9 },
      { label: 'Hallazgo', width: 1.5 },
      { label: 'Observación', width: 4.1 },
    ],
    sistemas.map(([label, key, obsKey]) => [label, humanizarEnum(consulta[key]), toText(consulta[obsKey])]),
  );
}

function hcOptometriaSection(flow: PdfFlow, consulta: any): void {
  const info: any = consulta.optometriaInforme;
  flowSection(flow, 'Informe optométrico');
  if (!info) {
    flowParagraph(flow, 'Sin informe de optometría registrado para esta consulta.', { italic: true, color: '#6b7280' });
    return;
  }

  flowKeyValues(flow, [
    { label: 'Fecha del informe', value: formatDate(info.createdAt ?? fechaAtencion(consulta)) },
    { label: 'Procedencia', value: toText(info.procedencia) || '—' },
    { label: 'Optotipo', value: toText(info.avOptotipo) || '—' },
    { label: 'Tipo de lente', value: toText(info.tipoLente) || '—' },
  ]);

  // Rx en uso
  flowParagraph(flow, 'Rx en uso (gafas actuales)', { size: 9, color: '#1f4e79', spacingAfter: 3 });
  flowTable(
    flow,
    [
      { label: 'Ojo', width: 0.8 },
      { label: 'Fórmula', width: 3.1 },
      { label: 'AV', width: 1.0, align: 'center' },
      { label: 'ADD', width: 1.0, align: 'center' },
      { label: 'AV VP', width: 1.1, align: 'center' },
      { label: 'Observaciones', width: 2.4 },
    ],
    [
      ['O.D.', toText(info.rxUsoOd), toText(info.rxUsoOdAv), toText(info.rxUsoOdAdd), toText(info.rxUsoOdAvVp), toText(info.rxUsoOdObs)],
      ['O.I.', toText(info.rxUsoOi), toText(info.rxUsoOiAv), toText(info.rxUsoOiAdd), toText(info.rxUsoOiAvVp), toText(info.rxUsoOiObs)],
      ...(hasAny(info, ['rxUsoAo', 'rxUsoAoAv', 'rxUsoAoAdd', 'rxUsoAoAvVp', 'rxUsoAoObs'])
        ? [['A.O.', toText(info.rxUsoAo), toText(info.rxUsoAoAv), toText(info.rxUsoAoAdd), toText(info.rxUsoAoAvVp), toText(info.rxUsoAoObs)] as string[]]
        : []),
    ],
  );

  // Agudeza visual
  flowParagraph(flow, 'Agudeza visual', { size: 9, color: '#1f4e79', spacingAfter: 3 });
  flowTable(
    flow,
    [
      { label: 'Ojo', width: 0.8 },
      { label: 'V.L.', width: 1.4, align: 'center' },
      { label: 'P.H.', width: 1.1, align: 'center' },
      { label: 'V.P.', width: 1.1, align: 'center' },
      { label: 'Observaciones', width: 3.2 },
    ],
    [
      ['O.D.', toText(info.avOdVl), toText(info.avOdPh), toText(info.avOdVp), toText(info.avOdObs)],
      ['O.I.', toText(info.avOiVl), toText(info.avOiPh), toText(info.avOiVp), toText(info.avOiObs)],
      ...(hasAny(info, ['avAoVl', 'avAoPh', 'avAoVp', 'avAoObs'])
        ? [['A.O.', toText(info.avAoVl), toText(info.avAoPh), toText(info.avAoVp), toText(info.avAoObs)] as string[]]
        : []),
    ],
  );

  // Rx final
  flowParagraph(flow, 'Refracción final', { size: 9, color: '#1f4e79', spacingAfter: 3 });
  flowTable(
    flow,
    [
      { label: 'Ojo', width: 0.8 },
      { label: 'Fórmula', width: 2.7 },
      { label: 'AV VL', width: 1.0, align: 'center' },
      { label: 'ADD', width: 0.9, align: 'center' },
      { label: 'AV VP', width: 1.0, align: 'center' },
      { label: 'DNP', width: 0.9, align: 'center' },
      { label: 'ALT', width: 0.9, align: 'center' },
    ],
    [
      ['O.D.', toText(info.rxFinalOd), toText(info.rxFinalOdAvVl), toText(info.rxFinalOdAdd), toText(info.rxFinalOdAvVp), toText(info.rxFinalOdDnp), toText(info.rxFinalOdAlt)],
      ['O.I.', toText(info.rxFinalOi), toText(info.rxFinalOiAvVl), toText(info.rxFinalOiAdd), toText(info.rxFinalOiAvVp), toText(info.rxFinalOiDnp), toText(info.rxFinalOiAlt)],
      ...(hasAny(info, ['rxFinalAo', 'rxFinalAoAvVl', 'rxFinalAoAdd', 'rxFinalAoAvVp', 'rxFinalAoDnp', 'rxFinalAoAlt'])
        ? [[
            'A.O.',
            toText(info.rxFinalAo),
            toText(info.rxFinalAoAvVl),
            toText(info.rxFinalAoAdd),
            toText(info.rxFinalAoAvVp),
            toText(info.rxFinalAoDnp),
            toText(info.rxFinalAoAlt),
          ] as string[]]
        : []),
    ],
  );

  // Examen motor
  if (hasAny(info, ['motorVlTecnica', 'motorVlPpc', 'motorVlOr', 'motorVlLuz', 'motorVlVersiones', 'motorVpTecnica', 'motorVpPpc', 'motorVpOr', 'motorVpLuz', 'motorVpVersiones'])) {
    flowParagraph(flow, 'Examen motor', { size: 9, color: '#1f4e79', spacingAfter: 3 });
    flowTable(
      flow,
      [
        { label: 'Ojo', width: 0.9 },
        { label: 'Técnica', width: 1.7 },
        { label: 'P.P.C.', width: 1.5 },
        { label: 'O.R.', width: 1.3 },
        { label: 'Luz', width: 1.1 },
        { label: 'Versiones', width: 3.0 },
      ],
      [
        ['V.L.', toText(info.motorVlTecnica), toText(info.motorVlPpc), toText(info.motorVlOr), toText(info.motorVlLuz), toText(info.motorVlVersiones)],
        ...(hasAny(info, ['motorVpTecnica', 'motorVpPpc', 'motorVpOr', 'motorVpLuz', 'motorVpVersiones'])
          ? [['V.P.', toText(info.motorVpTecnica), toText(info.motorVpPpc), toText(info.motorVpOr), toText(info.motorVpLuz), toText(info.motorVpVersiones)] as string[]]
          : []),
      ],
    );
  }

  // Sensorialidad
  if (hasAny(info, ['sentVlWorth', 'sentVlBaseSup', 'sentVlFusionRojo', 'sentVpWorth', 'sentVpBaseSup', 'sentVpFusionRojo'])) {
    flowParagraph(flow, 'Sensorialidad', { size: 9, color: '#1f4e79', spacingAfter: 3 });
    flowTable(
      flow,
      [
        { label: 'Ojo', width: 0.9 },
        { label: 'Luces de Worth', width: 2.2 },
        { label: '6 dioptrías base superior', width: 2.2 },
        { label: 'Fusión con filtro rojo', width: 2.5 },
      ],
      [
        ['V.L.', toText(info.sentVlWorth), toText(info.sentVlBaseSup), toText(info.sentVlFusionRojo)],
        ['V.P.', toText(info.sentVpWorth), toText(info.sentVpBaseSup), toText(info.sentVpFusionRojo)],
      ],
    );
  }

  // Examen externo
  if (hasAny(info, [
    'extPestanasOd', 'extPestanasOi', 'extParpadosOd', 'extParpadosOi', 'extConjuntivaOd', 'extConjuntivaOi',
    'extCorneaOd', 'extCorneaOi', 'extEscleroticaOd', 'extEscleroticaOi', 'extIrisOd', 'extIrisOi',
    'extCristalinoOd', 'extCristalinoOi', 'extPeliculaLacrimalOd', 'extPeliculaLacrimalOi', 'extPioOd', 'extPioOi',
    'extPupilaOd', 'extPupilaOi', 'extPestanas', 'extParpados', 'extConjuntiva', 'extCornea', 'extEsclerotica',
    'extIris', 'extCristalino', 'extPeliculaLacrimal', 'extPio', 'extPupila',
  ])) {
    const externos: Array<[string, string]> = [
      ['Pestañas', 'extPestanas'],
      ['Párpados', 'extParpados'],
      ['Conjuntiva', 'extConjuntiva'],
      ['Córnea', 'extCornea'],
      ['Esclerótica', 'extEsclerotica'],
      ['Iris', 'extIris'],
      ['Cristalino', 'extCristalino'],
      ['Película lagrimal', 'extPeliculaLacrimal'],
      ['Presión intraocular', 'extPio'],
      ['Pupila', 'extPupila'],
    ];
    flowParagraph(flow, 'Examen externo', { size: 9, color: '#1f4e79', spacingAfter: 3 });
    flowTable(
      flow,
      [
        { label: 'Hallazgo', width: 2.4 },
        { label: 'O.D.', width: 3.2 },
        { label: 'O.I.', width: 3.2 },
      ],
      externos.map(([label, key]) => [label, eyeValue(info, key, 'Od'), eyeValue(info, key, 'Oi')]),
    );
  }

  // Reflejos, oftalmoscopía, color y campo visual
  const tieneReflejos = hasAny(info, ['reflFotomotor', 'reflConsensual']);
  const tieneOftalmo = hasAny(info, ['oftOd', 'oftOi']);
  const tieneColor = hasAny(info, ['colorOd', 'colorOi']);
  const tieneCampo = hasAny(info, ['cvOd', 'cvOi', 'cvObs']);
  if (tieneReflejos || tieneOftalmo || tieneColor || tieneCampo) {
    flowSection(flow, 'Examen oftalmológico complementario');
    if (tieneReflejos) {
      flowKeyValues(flow, [
        { label: 'Reflejo fotomotor', value: toText(info.reflFotomotor) || '—' },
        { label: 'Reflejo consensual', value: toText(info.reflConsensual) || '—' },
      ]);
    }
    if (tieneOftalmo) {
      flowTable(
        flow,
        [
          { label: 'Oftalmoscopía', width: 2.0 },
          { label: 'O.D.', width: 3.5 },
          { label: 'O.I.', width: 3.5 },
        ],
        [['Hallazgo', toText(info.oftOd), toText(info.oftOi)]],
      );
    }
    if (tieneColor) {
      flowTable(
        flow,
        [
          { label: 'Visión al color', width: 2.0 },
          { label: 'O.D.', width: 3.5 },
          { label: 'O.I.', width: 3.5 },
        ],
        [['Hallazgo', toText(info.colorOd), toText(info.colorOi)]],
      );
    }
    if (tieneCampo) {
      flowTable(
        flow,
        [
          { label: 'Campo visual', width: 1.7 },
          { label: 'O.D.', width: 2.6 },
          { label: 'O.I.', width: 2.6 },
          { label: 'Observaciones', width: 2.3 },
        ],
        [['Hallazgo', toText(info.cvOd), toText(info.cvOi), toText(info.cvObs)]],
      );
    }
  }

  // Cierre del informe
  const cierre: Array<[string, string]> = [
    ['Diagnóstico A.O.', toText(info.diagnosticoAO)],
    ['Tratamiento', toText(info.tratamiento)],
    ['Disposición', toText(info.disposicion)],
    ['Observación', toText(info.observacion)],
    ['Recomendaciones', toText(info.recomendaciones)],
    ['Evaluación (nota interna)', toText(info.evaluacion)],
    ['Notas adicionales', toText(info.notasAdicionales)],
  ].filter(([, value]) => value) as Array<[string, string]>;

  if (cierre.length) {
    flowSection(flow, 'Cierre del informe optométrico');
    for (const [label, value] of cierre) {
      flowParagraph(flow, label, { size: 8.5, color: '#4b5563', spacingAfter: 1 });
      flowParagraph(flow, value, { spacingAfter: 7 });
    }
  }
}

function hcDiagnosticosSection(flow: PdfFlow, consulta: any): void {
  const diagnosticos: any[] = [...(consulta.diagnosticos ?? [])].sort((a, b) => {
    if (Boolean(a.esPrincipal) !== Boolean(b.esPrincipal)) return a.esPrincipal ? -1 : 1;
    return (a.orden ?? 0) - (b.orden ?? 0);
  });
  flowSection(flow, 'Diagnósticos');
  if (!diagnosticos.length) {
    flowParagraph(flow, 'Sin diagnósticos registrados.', { italic: true, color: '#6b7280' });
    return;
  }
  flowTable(
    flow,
    [
      { label: 'Código', width: 1.2 },
      { label: 'Descripción', width: 4.0 },
      { label: 'Tipo', width: 1.2 },
      { label: 'Estado', width: 1.2 },
      { label: 'Principal', width: 0.9, align: 'center' },
    ],
    diagnosticos.map((d) => [
      toText(d.codigoCIE10 || d.codigo),
      toText(d.descripcion),
      humanizarEnum(d.tipo),
      humanizarEnum(d.estado),
      d.esPrincipal ? 'Sí' : 'No',
    ]),
  );
}

function hcPrescripcionesSection(flow: PdfFlow, consulta: any): void {
  const prescripciones: any[] = consulta.prescripciones ?? [];
  flowSection(flow, 'Prescripciones');
  if (!prescripciones.length) {
    flowParagraph(flow, 'Sin prescripciones registradas.', { italic: true, color: '#6b7280' });
    return;
  }
  flowTable(
    flow,
    [
      { label: 'Medicamento', width: 2.2 },
      { label: 'Dosis', width: 1.1 },
      { label: 'Vía', width: 1.0 },
      { label: 'Frecuencia', width: 1.2 },
      { label: 'Duración', width: 1.2 },
      { label: 'Indicaciones', width: 2.5 },
    ],
    prescripciones.map((p) => [
      toText(p.medicamento),
      toText(p.dosis),
      toText(p.via),
      toText(p.frecuencia),
      toText(p.duracion),
      toText(p.indicaciones),
    ]),
  );
}

function hcPedidosSection(flow: PdfFlow, consulta: any): void {
  const pedidos: any[] = consulta.pedidos ?? [];
  if (!pedidos.length) return;
  flowSection(flow, 'Pedidos de exámenes');
  flowTable(
    flow,
    [
      { label: 'Tipo', width: 1.3 },
      { label: 'Descripción', width: 4.0 },
      { label: 'Urgente', width: 1.0, align: 'center' },
      { label: 'Estado', width: 1.2 },
    ],
    pedidos.map((p) => [humanizarEnum(p.tipo), toText(p.descripcion), p.urgente ? 'Sí' : 'No', humanizarEnum(p.estado)]),
  );
}

function hcExamenesSection(flow: PdfFlow, consulta: any): void {
  const examenes: any[] = consulta.examenes ?? [];
  if (!examenes.length) return;
  flowSection(flow, 'Exámenes complementarios');
  flowTable(
    flow,
    [
      { label: 'Fecha', width: 1.3 },
      { label: 'Tipo', width: 1.4 },
      { label: 'Nombre', width: 2.5 },
      { label: 'Resultado', width: 3.2 },
    ],
    examenes.map((e) => [formatDate(e.fecha), humanizarEnum(e.tipo), toText(e.nombre), toText(e.resultado)]),
  );
}

function hcIndicacionesSection(flow: PdfFlow, consulta: any): void {
  const indicaciones: any[] = consulta.indicaciones ?? [];
  if (!indicaciones.length) return;
  flowSection(flow, 'Indicaciones');
  flowTable(
    flow,
    [
      { label: 'Tipo', width: 1.6 },
      { label: 'Descripción', width: 5.4 },
    ],
    indicaciones.map((i) => [humanizarEnum(i.tipo), toText(i.descripcion)]),
  );
}

function hcEvolucionSection(flow: PdfFlow, consulta: any): void {
  const evoluciones: any[] = consulta.evoluciones ?? [];
  if (!evoluciones.length) return;
  flowSection(flow, 'Evolución');
  for (const ev of evoluciones) {
    const texto = toText(ev.nota) || [ev.subjetivo, ev.objetivo, ev.analisis, ev.plan].map(toText).filter(Boolean).join('\n');
    flowParagraph(flow, formatDateTime(ev.createdAt), { size: 8, color: '#4b5563', spacingAfter: 1 });
    flowParagraph(flow, texto, { spacingAfter: 8 });
  }
}

function hcSignatureSection(
  flow: PdfFlow,
  consulta: any,
  inputHash?: string | null,
): void {
  const especialista = consulta.especialista ?? {};
  const firma: any = (consulta.firmas ?? [])[0];
  const hash = toText(firma?.hashDocumento || inputHash);
  const fechaFirma = firma?.fechaFirma ?? consulta.firmadaEn ?? null;
  const firmado = Boolean(firma || hash || consulta.firmada);
  const boxHeight = hash ? 70 : 58;
  flowEnsure(flow, boxHeight + 2);

  const { doc, x, width } = flow;
  doc
    .rect(x, flow.y, width, boxHeight)
    .lineWidth(0.5)
    .fillAndStroke('#f8fafc', '#94a3b8');

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#1f4e79')
    .text('FIRMA Y VERIFICACIÓN', x + 9, flow.y + 8, { width: width - 18 });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#111111')
    .text(
      `Especialista: ${nombreEspecialista(especialista)}  ·  ${toText(especialista.especialidad) || 'Optometría'}`,
      x + 9,
      flow.y + 21,
      { width: width - 18 },
    );

  if (especialista.codigoMsp) {
    doc.text(`Código MSP: ${especialista.codigoMsp}`, x + 9, flow.y + 33, { width: width - 18 });
  }

  if (firmado) {
    doc.text(
      `Firmado digitalmente el ${
        fechaFirma ? formatDateTime(fechaFirma) : 'fecha no registrada'
      }${hash ? '' : ' (sin hash registrado)'}`,
      x + 9,
      flow.y + (especialista.codigoMsp ? 45 : 33),
      { width: width - 18 },
    );
    if (hash) {
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#4b5563')
        .text(`Verificación SHA-256: ${hash}`, x + 9, flow.y + 59, { width: width - 18 });
    }
  } else {
    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor('#6b7280')
      .text('Documento pendiente de firma electrónica.', x + 9, flow.y + 35, { width: width - 18 });
  }

  flow.y += boxHeight + 10;
}

/**
 * Historia Clínica completa de la consulta de Optometría. Usa el mismo
 * membrete, pie, márgenes y tipografía que la devolución, y añade todas
 * las secciones clínicas de la atención.
 */
export async function buildHistoriaClinicaOptometriaPdf(
  input: BuildOptometriaPdfInput,
  outputPath: string,
): Promise<string> {
  const { consulta } = input;
  if (!esOptometria(consulta?.especialista?.especialidad)) {
    throw new Error('La consulta no pertenece a Optometría');
  }

  const paciente = consulta.paciente ?? {};
  const especialista = consulta.especialista ?? {};
  const firma: any = (consulta.firmas ?? [])[0];
  const hash = toText(firma?.hashDocumento || input.hashDocumento);

  const doc = createPdf({
    margins: { top: LAYOUT.hc.top, bottom: 120, left: LAYOUT.hc.left, right: LAYOUT.hc.left },
    info: {
      Title: 'Historia Clínica Electrónica — Optometría',
      Author: nombreEspecialista(especialista),
      Subject: `Historia clínica de ${nombrePaciente(paciente)}`,
      Keywords: hash ? `SHA-256: ${hash}` : 'Documento sin firma electrónica',
      Creator: 'Instituto de Neurociencias — Ecuador',
      Producer: 'Instituto de Neurociencias — Ecuador',
    },
  });

  attachInstitutionalPage(doc);
  drawInstitutionalPage(doc);

  const flow = createFlow(doc, {
    x: LAYOUT.hc.left,
    width: LAYOUT.hc.width,
    top: LAYOUT.hc.top,
    bottom: LAYOUT.hc.bottom,
  });
  drawHcTitle(flow, consulta);

  hcPatientSection(flow, consulta);
  hcConsultationSection(flow, consulta);
  hcClinicalSections(flow, consulta);
  hcAntecedentesSection(flow, consulta);
  hcAlergiasSection(flow, consulta);
  hcHabitosSection(flow, consulta);
  hcSignosVitalesSection(flow, consulta);
  hcExamenFisicoSection(flow, consulta);
  hcOptometriaSection(flow, consulta);
  hcDiagnosticosSection(flow, consulta);
  hcPrescripcionesSection(flow, consulta);
  hcPedidosSection(flow, consulta);
  hcExamenesSection(flow, consulta);
  hcIndicacionesSection(flow, consulta);
  hcEvolucionSection(flow, consulta);
  hcSignatureSection(flow, consulta, input.hashDocumento);

  return savePdf(doc, outputPath);
}
