from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

doc = Document()

style = doc.styles['Normal']
font = style.font
font.name = 'Calibri'
font.size = Pt(10)

sections = doc.sections
for section in sections:
    section.top_margin = Cm(1.5)
    section.bottom_margin = Cm(1.5)
    section.left_margin = Cm(1.5)
    section.right_margin = Cm(1.5)

def set_cell_shading(cell, color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def add_header_row(table, row_idx, text, color="1F4E79"):
    row = table.rows[row_idx]
    for cell in row.cells:
        set_cell_shading(cell, color)
        for paragraph in cell.paragraphs:
            p = paragraph
    p = row.cells[0].paragraphs[0]
    p.text = ""
    run = p.add_run(text)
    run.bold = True
    run.font.color.rgb = RGBColor(255, 255, 255)
    run.font.size = Pt(10)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

def add_section_title(doc, text, color="1F4E79"):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(31, 78, 121)
    p.space_before = Pt(8)
    p.space_after = Pt(4)
    return p

def add_mejora_text(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run("⬆ ")
    run.font.color.rgb = RGBColor(0, 128, 0)
    run.font.size = Pt(9)
    run = p.add_run(text)
    run.italic = True
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0, 100, 0)
    p.space_before = Pt(1)
    p.space_after = Pt(4)
    return p

def add_total_row(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(31, 78, 121)
    p.space_before = Pt(2)
    p.space_after = Pt(2)
    return p

def create_data_table(doc, headers, data, col_widths=None):
    table = doc.add_table(rows=1 + len(data), cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cell_shading(cell, "1F4E79")
    
    for row_idx, row_data in enumerate(data):
        for col_idx, val in enumerate(row_data):
            cell = table.rows[row_idx + 1].cells[col_idx]
            cell.text = ""
            p = cell.paragraphs[0]
            run = p.add_run(str(val))
            run.font.size = Pt(9)
            if col_idx == 2:
                run.font.size = Pt(8.5)
            if row_idx % 2 == 0:
                set_cell_shading(cell, "EBF5FB")
    
    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Cm(w)
    
    doc.add_paragraph().space_before = Pt(2)
    return table

title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run("BITÁCORA DE ACTIVIDADES")
run.bold = True
run.font.size = Pt(16)
run.font.color.rgb = RGBColor(31, 78, 121)

subtitle = doc.add_paragraph()
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = subtitle.add_run("Proyecto: Sistema de Agendamiento de Citas Médicas")
run.font.size = Pt(12)
run.font.color.rgb = RGBColor(31, 78, 121)

sub2 = doc.add_paragraph()
sub2.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = sub2.add_run("Instituto de Neurociencias — Ecuador")
run.font.size = Pt(10)
run.font.color.rgb = RGBColor(100, 100, 100)

# Info section
info = doc.add_paragraph()
info.alignment = WD_ALIGN_PARAGRAPH.LEFT
run = info.add_run("Total horas: 192 h  |  Período: 26 de mayo al 29 de julio de 2026")
run.bold = True
run.font.size = Pt(10)

restricciones = doc.add_paragraph()
run = restricciones.add_run("Restricciones de horario: ")
run.bold = True
run.font.size = Pt(9)
run = restricciones.add_run("Lun 10–13 bloqueado | Mié 10–12 y 13–16 bloqueado | Jue 15–18 bloqueado | Vie 9–13 y 15–17 bloqueado")
run.font.size = Pt(9)
run.font.color.rgb = RGBColor(100, 100, 100)

doc.add_paragraph()  # spacing

# ============================================================
# PARTIAL PERIOD
# ============================================================
add_section_title(doc, "Período Inicial — Requisitos, Setup DB y Backend (26 may – 5 jun)")

headers = ["Fecha", "Entrada", "Actividad desarrollada", "Salida", "Horas"]
data = [
    ["26/05", "9:00", "Reunión tutor institucional sobre requisitos del sistema, planificación de trabajo y stack tecnológico escogido", "10:00", "1"],
    ["26/05", "14:00", "Reunión para recoger los requisitos del sistema con el equipo", "16:00", "2"],
    ["27/05", "16:00", "Creación de tablas en base de datos local (especialistas, pacientes, citas, horarios)", "20:00", "4"],
    ["28/05", "9:00", "Levantar Docker para probar las tablas en postgres + configuración docker-compose", "13:00", "4"],
    ["29/05", "13:00", "Corrección de relaciones en las tablas (especialistas ↔ citas ↔ pacientes)", "15:00", "2"],
    ["29/05", "18:00", "Agregar asignación de horarios y bloques disponibles para creación de citas", "20:00", "2"],
    ["01/06", "14:00", "Conexión de la base de datos local en Docker con el backend (NestJS + Prisma)", "18:00", "4"],
    ["02/06", "14:00", "Presentación con el tutor de los avances del proyecto", "16:00", "2"],
    ["02/06", "16:00", "Reunión con especialista comparando sistema anterior con el nuevo — se identificó mejorar modelo de horarios y slots configurables por especialidad", "19:00", "3"],
    ["03/06", "17:00", "Corrección de endpoints según retroalimentación del especialista + modificación en tablas y relaciones de horarios", "21:00", "4"],
    ["04/06", "9:00", "Pruebas unitarias de endpoints + refactorización de módulos con más de una responsabilidad", "13:00", "4"],
    ["05/06", "13:00", "Agregar seed para probar el sistema (especialistas, pacientes, horarios de prueba)", "15:00", "2"],
    ["05/06", "18:00", "Correcciones generales y validación de datos en seed", "20:00", "2"],
]

create_data_table(doc, headers, data)
add_total_row(doc, "Subtotal: 36 h  |  Acumulado: 36 h")

# ============================================================
# WEEK 1
# ============================================================
add_section_title(doc, "Semana 1 — Modelos HCE en Prisma (8–12 jun)")

data = [
    ["08/06", "14:00", "Diseño de modelo ConsultaHCE y relaciones con Paciente, Cita, Especialista en Prisma", "18:00", "4"],
    ["09/06", "14:00", "Reunión con especialista comparando sistema anterior con el nuevo — feedback: la HC debe manejar diagnósticos CIE-10 estructurados, no texto libre. Creación de modelos Diagnostico, Prescripcion", "19:00", "5"],
    ["10/06", "17:00", "Creación de modelos Prisma: Diagnostico, Prescripcion, SignoVital, Vacuna", "21:00", "4"],
    ["11/06", "9:00", "Creación de modelos: Evolucion, PedidoExamen, ExamenComplementario, Indicacion, Alergia, Habito", "13:00", "4"],
    ["12/06", "13:00", "Migración Prisma db push + verificación de tablas HCE en base de datos", "15:00", "2"],
    ["12/06", "18:00", "Seed de prueba para tablas HCE + corrección de relaciones entre modelos", "20:00", "2"],
]
create_data_table(doc, headers, data)
add_mejora_text(doc, "Mejora identificada (09/06): El especialista indicó que la HC debe tener diagnóstico CIE-10 estructurado — se implementará CRUD con búsqueda en la Semana 2")
add_total_row(doc, "Subtotal: 21 h  |  Acumulado: 57 h")

# ============================================================
# WEEK 2
# ============================================================
add_section_title(doc, "Semana 2 — Módulo HCE Backend: CRUD Base (15–19 jun)")

data = [
    ["15/06", "14:00", "Estructura del módulo hce (module, controller, service) + DTOs para ConsultaHCE y sus submódulos", "18:00", "4"],
    ["16/06", "14:00", "Reunión con especialista comparando sistema anterior + Implementación de CRUD ConsultaHCE con búsqueda CIE-10 (cie10.json) según feedback de la semana anterior", "19:00", "5"],
    ["17/06", "17:00", "Endpoints CRUD para Diagnósticos con integración de catálogo CIE-10 (autocomplete)", "21:00", "4"],
    ["18/06", "9:00", "Endpoints CRUD para Prescripción médica (medicamento, dosis, vía, frecuencia, duración)", "13:00", "4"],
    ["19/06", "13:00", "Pruebas unitarias de endpoints CRUD ConsultaHCE y Diagnósticos", "15:00", "2"],
    ["19/06", "18:00", "Corrección de errores en DTOs y validación de campos obligatorios en prescripciones", "20:00", "2"],
]
create_data_table(doc, headers, data)
add_mejora_text(doc, "Mejora identificada (16/06): El especialista solicitó que las prescripciones incluyan dosis exacta y frecuencia, y que se agreguen signos vitales con cálculo de IMC — se implementa en Semana 3")
add_total_row(doc, "Subtotal: 21 h  |  Acumulado: 78 h")

# ============================================================
# WEEK 3
# ============================================================
add_section_title(doc, "Semana 3 — Signos Vitales, Examen Físico y Evolución (22–26 jun)")

data = [
    ["22/06", "14:00", "Endpoints CRUD SignosVitales (presión arterial, FC, temp, peso, talla, IMC automático, escala dolor)", "18:00", "4"],
    ["23/06", "14:00", "Reunión con especialista comparando sistema anterior + Implementación de campos de prescripción con dosis/frecuencia según feedback pendiente", "19:00", "5"],
    ["24/06", "17:00", "Endpoints Examen Físico (8 sistemas: general, CV, respiratorio, abdomen, neurológico, extremidades, piel, cabeza/cuello)", "21:00", "4"],
    ["25/06", "9:00", "Endpoints Evolución Clínica en formato SOAP (subjetivo, objetivo, análisis, plan)", "13:00", "4"],
    ["26/06", "13:00", "Pruebas unitarias de signos/examen/evolución + correcciones de validaciones", "15:00", "2"],
    ["26/06", "18:00", "Endpoints Antecedentes y Alergias desde perfil del paciente + ajustes finales", "20:00", "2"],
]
create_data_table(doc, headers, data)
add_mejora_text(doc, "Mejora identificada (23/06): El especialista solicitó evolución SOAP estructurada y examen físico detallado (implementado esta semana). Además pidió pedidos de exámenes y subida de archivos para Semana 4")
add_total_row(doc, "Subtotal: 21 h  |  Acumulado: 99 h")

# ============================================================
# WEEK 4
# ============================================================
add_section_title(doc, "Semana 4 — Pedidos, Exámenes y Subida de Archivos (29 jun – 3 jul)")

data = [
    ["29/06", "14:00", "Endpoints PedidoExamen e Interconsultas CRUD", "18:00", "4"],
    ["30/06", "14:00", "Reunión con especialista comparando sistema anterior + Implementación de ExamenComplementario con subida de archivos (Multer)", "19:00", "5"],
    ["01/07", "17:00", "Endpoints Indicaciones + Tratamiento y Plan Terapéutico", "21:00", "4"],
    ["02/07", "9:00", "Implementación del nuevo módulo historia-clinica/ con sub-módulos: consulta, plantillas, alertas, auditoria", "13:00", "4"],
    ["03/07", "13:00", "Pruebas de integración pedidos/exámenes/indicaciones + correcciones de flujo", "15:00", "2"],
    ["03/07", "18:00", "Configuración Multer para tipos de archivo (PDF, imágenes, DICOM) y límites de tamaño", "20:00", "2"],
]
create_data_table(doc, headers, data)
add_mejora_text(doc, "Mejora identificada (30/06): El especialista indicó que se necesita trazabilidad de cambios en HC y examen mental estructurado — se implementa en Semana 5")
add_total_row(doc, "Subtotal: 21 h  |  Acumulado: 120 h")

# ============================================================
# WEEK 5
# ============================================================
add_section_title(doc, "Semana 5 — Examen Mental, Historia Familiar y Auditoría (6–10 jul)")

data = [
    ["06/07", "14:00", "Examen Mental (12 campos: conciencia, memoria, percepción, afecto, lenguaje, etc.) + Historia Familiar (8 campos) — relación 1:1 con ConsultaHCE", "18:00", "4"],
    ["07/07", "14:00", "Reunión de revisión MVP (2h) — evaluación del módulo HCE completo. Feedback: agregar firma digital y PDF. Luego: AuditoriaHC — trazabilidad cada acción por tab", "19:00", "5"],
    ["08/07", "17:00", "ConsultaVersion — snapshot y versionado automático de consultas al editar", "21:00", "4"],
    ["09/07", "9:00", "Refactorización: separación de servicios por tab (diagnosticos, prescripciones, signos, evoluciones, pedidos)", "13:00", "4"],
    ["10/07", "13:00", "Pruebas unitarias de examen mental, historia familiar, auditoría y versionado", "15:00", "2"],
    ["10/07", "18:00", "Corrección de bugs en versionado y registro de tabla AuditoriaHC", "20:00", "2"],
]
create_data_table(doc, headers, data)
add_mejora_text(doc, "Mejora identificada (07/07 - MVP): Se requiere firma digital con verificación de contraseña, PDF de HC con pdfkit y certificado de asistencia — se implementa en Semana 6")
add_total_row(doc, "Subtotal: 21 h  |  Acumulado: 141 h")

# ============================================================
# WEEK 6
# ============================================================
add_section_title(doc, "Semana 6 — Firma Digital y PDF (13–17 jul)")

data = [
    ["13/07", "14:00", "Firma digital: endpoint verify-password + modelo Firma (CIERRE_HC y CERTIFICADO_ASISTENCIA)", "18:00", "4"],
    ["14/07", "14:00", "Reunión con personal que usa el sistema — evaluaron flujo HC. Feedback: interfaz debe ser más intuitiva con tabs y filtros. Luego: generación de PDF con pdfkit", "19:00", "5"],
    ["15/07", "17:00", "Certificado Médico de Asistencia (PDF con hash SHA-256 para verificación)", "21:00", "4"],
    ["16/07", "9:00", "Componentes frontend: FirmaDigitalModal + CertificadoModal + DynamicForm", "13:00", "4"],
    ["17/07", "13:00", "Vista frontend HCE especialista — listado pacientes con búsqueda y grid de módulos", "15:00", "2"],
    ["17/07", "18:00", "Formulario consulta con tabs (Consulta, Signos, Diagnósticos, Prescripción, Evolución, Ex. Físico)", "20:00", "2"],
]
create_data_table(doc, headers, data)
add_mejora_text(doc, "Mejora identificada (14/07): El personal solicitó interfaz más intuitiva con tabs organizadas, filtros y vista admin/auditor — se implementa en Semana 7")
add_total_row(doc, "Subtotal: 21 h  |  Acumulado: 162 h")

# ============================================================
# WEEK 7
# ============================================================
add_section_title(doc, "Semana 7 — Frontend Completo HCE + Auditoría (20–24 jul)")

data = [
    ["20/07", "14:00", "Frontend admin HCE: listado especialistas → pacientes → HC read-only + página configuración módulos por especialidad", "18:00", "4"],
    ["21/07", "14:00", "Frontend auditor: dashboard estadísticas, listado HC, detalle completo, modal revisión (REVISADO / REVISADO_CON_OBSERVACIONES)", "19:00", "5"],
    ["22/07", "17:00", "Correcciones filtros HCE: fix filtro por especialistaId, mostrar nombre/especialidad en encabezado", "21:00", "4"],
    ["23/07", "9:00", "Refactor auth: single-flight refresh, AuthProvider, middleware matcher, fix 431 cookies", "13:00", "4"],
    ["24/07", "13:00", "Última revisión del sistema con el equipo — pruebas E2E flujo completo: triage → consulta → firma → PDF → auditoría", "15:00", "2"],
    ["24/07", "18:00", "Correcciones finales de bugs y ajustes responsive en frontend HCE", "20:00", "2"],
]
create_data_table(doc, headers, data)
add_total_row(doc, "Subtotal: 21 h  |  Acumulado: 183 h")

# ============================================================
# CLOSING
# ============================================================
add_section_title(doc, "Cierre Final (27–29 jul)")

data = [
    ["27/07", "14:00", "Revisión de documentos de prácticas — preparación de informe final y PLAN_BUILD.md con resumen de fases", "18:00", "4"],
    ["28/07", "14:00", "Consolidación de seeds (prisma:seed unificado) + limpieza de módulos legacy + documentación técnica", "18:00", "4"],
    ["29/07", "17:00", "Firma de documentos de prácticas y cierre oficial del proyecto", "18:00", "1"],
]
create_data_table(doc, headers, data)
add_total_row(doc, "Subtotal: 9 h  |  Acumulado: 192 h ✅")

# FINAL SUMMARY
doc.add_paragraph()
add_section_title(doc, "Resumen General")

summary_data = [
    ["Período inicial (26 may – 5 jun)", "36 h"],
    ["Semana 1 — Modelos HCE (8–12 jun)", "21 h"],
    ["Semana 2 — CRUD Base HCE (15–19 jun)", "21 h"],
    ["Semana 3 — Signos/Examen/Evolución (22–26 jun)", "21 h"],
    ["Semana 4 — Pedidos/Archivos (29 jun – 3 jul)", "21 h"],
    ["Semana 5 — Mental/Auditoría (6–10 jul)", "21 h"],
    ["Semana 6 — Firma/PDF (13–17 jul)", "21 h"],
    ["Semana 7 — Frontend Completo (20–24 jul)", "21 h"],
    ["Cierre final (27–29 jul)", "9 h"],
]
create_data_table(doc, ["Período", "Horas"], summary_data)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.space_before = Pt(12)
run = p.add_run("TOTAL GENERAL: 192 HORAS")
run.bold = True
run.font.size = Pt(14)
run.font.color.rgb = RGBColor(31, 78, 121)

output_path = "C:\\Users\\anton\\Desktop\\agendamiento\\Bitacora_Proyecto_Agendamiento.docx"
doc.save(output_path)
print(f"Documento generado: {output_path}")
