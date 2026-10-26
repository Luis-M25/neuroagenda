from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

ROLES = {
    "A": {
        "name": "Backend Developer A",
        "title": "Backend — Módulos NestJS + Prisma + HCE",
        "file": "Bitacora_Backend_A.docx"
    },
    "B": {
        "name": "Backend Developer B / Infra",
        "title": "Backend/Infra — Docker + Auth + Seguridad + Testing",
        "file": "Bitacora_Backend_B.docx"
    },
    "C": {
        "name": "Frontend Developer",
        "title": "Frontend — Next.js + Componentes + Auth UI",
        "file": "Bitacora_Frontend.docx"
    }
}

MEETINGS = {
    "m1":  ("26/05", "9:00", "Reunión tutor institucional sobre requisitos del sistema, planificación de trabajo y stack tecnológico escogido", "10:00", "1"),
    "m2":  ("26/05", "14:00", "Reunión para recoger los requisitos del sistema con el equipo", "16:00", "2"),
    "m3":  ("02/06", "14:00", "Presentación con el tutor de los avances del proyecto", "16:00", "2"),
    "m4":  ("09/06", "14:00", "Reunión con especialista comparando sistema anterior con el nuevo — feedback: la HC debe manejar diagnósticos CIE-10 estructurados, no texto libre", "16:00", "2"),
    "m5":  ("16/06", "14:00", "Reunión con especialista comparando sistema anterior con el nuevo", "16:00", "2"),
    "m6":  ("23/06", "14:00", "Reunión con especialista comparando sistema anterior con el nuevo", "16:00", "2"),
    "m7":  ("30/06", "14:00", "Reunión con especialista comparando sistema anterior con el nuevo", "16:00", "2"),
    "m8":  ("07/07", "14:00", "Reunión de revisión MVP — evaluación del módulo HCE completo. Feedback: agregar firma digital y PDF", "16:00", "2"),
    "m9":  ("14/07", "14:00", "Reunión con personal que usa el sistema — evaluaron flujo HC. Feedback: interfaz más intuitiva con tabs y filtros", "16:00", "2"),
    "m10": ("24/07", "13:00", "Última revisión del sistema con el equipo — pruebas E2E flujo completo: triage → consulta → firma → PDF → auditoría", "15:00", "2"),
    "m11": ("29/07", "17:00", "Firma de documentos de prácticas y cierre oficial del proyecto", "18:00", "1"),
}

ACTIVITIES = {

    "A": {
        "initial": [
            ("", "", "--- TRABAJO INDIVIDUAL ---", "", ""),
            ("27/05", "16:00", "Creación de modelos Prisma: especialistas, pacientes, citas, horarios en schema", "20:00", "4"),
            ("28/05", "9:00", "Configurar Prisma + conexión a postgres en Docker + pruebas de conexión", "13:00", "4"),
            ("29/05", "13:00", "Definir relaciones entre tablas principales (especialista↔cita↔paciente↔horario)", "15:00", "2"),
            ("29/05", "18:00", "Inicio implementación CRUD endpoints base (citas, pacientes, especialistas)", "20:00", "2"),
            ("01/06", "14:00", "Estructura módulos NestJS: citas, pacientes, especialistas con PrismaService", "18:00", "4"),
            ("02/06", "16:00", "Implementación CRUD especialistas + pacientes + validaciones", "19:00", "3"),
            ("03/06", "17:00", "Implementación CRUD citas con relación a horarios y especialistas", "21:00", "4"),
            ("04/06", "9:00", "Pruebas unitarias de endpoints de citas, pacientes y especialistas", "13:00", "4"),
            ("05/06", "13:00", "Seed de especialistas y pacientes con datos de prueba", "15:00", "2"),
            ("05/06", "18:00", "Corrección de errores en endpoints y relaciones entre módulos", "20:00", "2"),
        ],
        "w1": [
            ("08/06", "14:00", "Diseño de modelo ConsultaHCE en Prisma con relaciones a Paciente, Cita, Especialista", "18:00", "4"),
            ("09/06", "16:00", "Creación de modelos Prisma: Diagnostico con relación CIE-10, Prescripcion con campos médicos", "19:00", "3"),
            ("10/06", "17:00", "Creación de modelos: Evolucion (SOAP), PedidoExamen, ExamenComplementario", "21:00", "4"),
            ("11/06", "9:00", "Creación de modelos: ExamenMental (12 campos), HistoriaFamiliar (8 campos), Indicacion", "13:00", "4"),
            ("12/06", "13:00", "Migración Prisma db push de todas las tablas HCE + verificación en BD", "15:00", "2"),
            ("12/06", "18:00", "Seed inicial de tablas HCE con datos de prueba y corrección de relaciones", "20:00", "2"),
        ],
        "w2": [
            ("15/06", "14:00", "Estructura del módulo hce: hce.module.ts, hce.controller.ts, hce.service.ts", "18:00", "4"),
            ("16/06", "16:00", "Implementación CRUD ConsultaHCE con búsqueda CIE-10 desde cie10.json", "19:00", "3"),
            ("17/06", "17:00", "Endpoints CRUD para Diagnósticos con integración de catálogo CIE-10 (autocomplete)", "21:00", "4"),
            ("18/06", "9:00", "Endpoints CRUD para Prescripción médica (medicamento, dosis, vía, frecuencia)", "13:00", "4"),
            ("19/06", "13:00", "Pruebas unitarias de endpoints CRUD ConsultaHCE y Diagnósticos", "15:00", "2"),
            ("19/06", "18:00", "Corrección de errores en DTOs y validación de campos obligatorios en prescripciones", "20:00", "2"),
        ],
        "w3": [
            ("22/06", "14:00", "Endpoints CRUD SignosVitales (PA, FC, temp, peso, talla, IMC automático, escala dolor)", "18:00", "4"),
            ("23/06", "16:00", "Implementación de campos de prescripción con dosis/frecuencia según feedback del especialista", "19:00", "3"),
            ("24/06", "17:00", "Endpoints Examen Físico completo (8 sistemas: general, CV, resp, abdomen, neuro, extrem, piel, cabeza/cuello)", "21:00", "4"),
            ("25/06", "9:00", "Endpoints Evolución Clínica en formato SOAP (subjetivo, objetivo, análisis, plan)", "13:00", "4"),
            ("26/06", "13:00", "Pruebas unitarias de signos vitales, examen físico y evolución SOAP", "15:00", "2"),
            ("26/06", "18:00", "Endpoints Antecedentes y Alergias desde perfil del paciente + ajustes finales SOAP", "20:00", "2"),
        ],
        "w4": [
            ("29/06", "14:00", "Endpoints CRUD PedidoExamen e Interconsultas con relación a ConsultaHCE", "18:00", "4"),
            ("30/06", "16:00", "Implementación ExamenComplementario con subida de archivos (Multer) y tipos de archivo", "19:00", "3"),
            ("01/07", "17:00", "Endpoints Indicaciones + Tratamiento y Plan Terapéutico por consulta", "21:00", "4"),
            ("02/07", "9:00", "Implementación del nuevo módulo historia-clinica/ con sub-módulos (consulta, plantillas, alertas, auditoria)", "13:00", "4"),
            ("03/07", "13:00", "Pruebas de integración de pedidos, exámenes e indicaciones con correcciones de flujo", "15:00", "2"),
            ("03/07", "18:00", "Correcciones en Multer para tipos de archivo (PDF, imágenes, DICOM) y límites de tamaño", "20:00", "2"),
        ],
        "w5": [
            ("06/07", "14:00", "Examen Mental (12 campos: conciencia, memoria, percepción, afecto, lenguaje, orientación, etc.)", "18:00", "4"),
            ("07/07", "16:00", "Implementación de AuditoriaHC — registro de trazabilidad por cada acción en cada tab de HC", "19:00", "3"),
            ("08/07", "17:00", "ConsultaVersion — snapshot y versionado automático de consultas al editar", "21:00", "4"),
            ("09/07", "9:00", "Refactorización: separación de servicios por tab (diagnosticos.service, prescripciones.service, pedidos.service)", "13:00", "4"),
            ("10/07", "13:00", "Pruebas unitarias de examen mental, historia familiar y versionado", "15:00", "2"),
            ("10/07", "18:00", "Corrección de bugs en ConsultaVersion y tabla AuditoriaHC", "20:00", "2"),
        ],
        "w6": [
            ("13/07", "14:00", "Firma digital: endpoint verify-password + modelo Firma (CIERRE_HC y CERTIFICADO_ASISTENCIA)", "18:00", "4"),
            ("14/07", "16:00", "Generación de PDF con pdfkit — documento completo de HC con todos los módulos", "19:00", "3"),
            ("15/07", "17:00", "Certificado Médico de Asistencia (PDF con hash SHA-256 para verificación)", "21:00", "4"),
            ("16/07", "9:00", "Endpoints de configuración HCE (HceFormConfig, TemplateHCE) y DynamicForm backend", "13:00", "4"),
            ("17/07", "13:00", "Endpoints para listado de pacientes por especialista con conteo de consultas", "15:00", "2"),
            ("17/07", "18:00", "Correcciones en layout de PDF y formato de certificado", "20:00", "2"),
        ],
        "w7": [
            ("20/07", "14:00", "Endpoints admin HCE: listado especialistas con total consultas, detalle HC read-only", "18:00", "4"),
            ("21/07", "14:00", "Endpoints auditoría: estadísticas, listado HC, detalle completo, acción revisión (REVISADO / REVISADO_CON_OBS)", "19:00", "5"),
            ("22/07", "17:00", "Fix filtro por especialistaId en backend para consultas HCE del especialista", "21:00", "4"),
            ("23/07", "9:00", "Refactor del backend: limpieza de código, estandarización de respuestas", "13:00", "4"),
            ("24/07", "15:00", "Corrección de errores backend encontrados en la última revisión", "17:00", "2"),
            ("24/07", "18:00", "Últimas correcciones en endpoints HCE y validaciones finales", "20:00", "2"),
        ],
        "close": [
            ("27/07", "14:00", "Consolidación de seeds en prisma:seed unificado para todo el sistema", "18:00", "4"),
            ("28/07", "14:00", "Limpieza de módulos legacy (historia-clinica-legacy, users) + verificación de imports", "18:00", "4"),
        ],
    },

    "B": {
        "initial": [
            ("", "", "--- TRABAJO INDIVIDUAL ---", "", ""),
            ("27/05", "16:00", "Configuración de Docker: docker-compose con postgres + volúmenes + redes", "20:00", "4"),
            ("28/05", "9:00", "Creación de base de datos postgres en Docker + pruebas de conexión externa", "13:00", "4"),
            ("29/05", "13:00", "Creación de seed de datos de prueba para horarios, sedes y consultorios", "15:00", "2"),
            ("29/05", "18:00", "Scripts de inicialización del proyecto (package.json scripts, README setup)", "20:00", "2"),
            ("01/06", "14:00", "Configurar JWT + módulo auth backend con bcrypt y refresh tokens", "18:00", "4"),
            ("02/06", "16:00", "Implementación de sistema de autenticación: login, register, refresh token", "19:00", "3"),
            ("03/06", "17:00", "Implementación de refresh token rotativo + guards de autenticación", "21:00", "4"),
            ("04/06", "9:00", "Pruebas de autenticación: login, refresh, expiración y manejo de errores", "13:00", "4"),
            ("05/06", "13:00", "Seed de horarios y bloques disponibles para especialistas", "15:00", "2"),
            ("05/06", "18:00", "Validaciones de seguridad en endpoints + manejo de excepciones global", "20:00", "2"),
        ],
        "w1": [
            ("08/06", "14:00", "Carga e integración del catálogo CIE-10 (cie10.json) en el backend", "18:00", "4"),
            ("09/06", "16:00", "Creación de modelos Prisma: SignoVital, Vacuna, Alergia, Habito", "19:00", "3"),
            ("10/06", "17:00", "Creación de modelos: ExamenComplementario con campos de archivo, Indicacion", "21:00", "4"),
            ("11/06", "9:00", "Creación de modelos: ProblemaActivo, AlertaManual, Antecedente, Consentimiento", "13:00", "4"),
            ("12/06", "13:00", "Script de migración Prisma + verificación de integridad de tablas HCE", "15:00", "2"),
            ("12/06", "18:00", "Corrección de relaciones entre modelos HCE y tablas existentes", "20:00", "2"),
        ],
        "w2": [
            ("15/06", "14:00", "Creación de DTOs completos para todos los submódulos de ConsultaHCE", "18:00", "4"),
            ("16/06", "16:00", "Implementación de pipe de validación para códigos CIE-10", "19:00", "3"),
            ("17/06", "17:00", "Validación de DTOs en endpoints de Diagnósticos con decoradores personalizados", "21:00", "4"),
            ("18/06", "9:00", "Validación de campos en Prescripción: dosis, frecuencia, vía administración", "13:00", "4"),
            ("19/06", "13:00", "Pruebas unitarias de validación de DTOs y pipes de transformación", "15:00", "2"),
            ("19/06", "18:00", "Corrección de validaciones en CIE-10 y ajustes en pipes de transformación", "20:00", "2"),
        ],
        "w3": [
            ("22/06", "14:00", "Implementación del cálculo automático de IMC en SignosVitales", "18:00", "4"),
            ("23/06", "16:00", "Pipe de validación para dosis y frecuencia en prescripciones del especialista", "19:00", "3"),
            ("24/06", "17:00", "Validación de campos del Examen Físico (8 sistemas con campos específicos)", "21:00", "4"),
            ("25/06", "9:00", "Estructuración del guardado de Evolución SOAP en campos separados", "13:00", "4"),
            ("26/06", "13:00", "Pruebas de integración de cálculos de IMC y validaciones físicas", "15:00", "2"),
            ("26/06", "18:00", "Correcciones en Antecedentes y Alergias desde perfil del paciente", "20:00", "2"),
        ],
        "w4": [
            ("29/06", "14:00", "Creación de catálogo de exámenes y pedidos médicos en base de datos", "18:00", "4"),
            ("30/06", "16:00", "Configuración de Multer: tipos de archivo permitidos, límites de tamaño, directorios", "19:00", "3"),
            ("01/07", "17:00", "Validaciones de campos en Indicaciones y Tratamiento + pipe de transformación", "21:00", "4"),
            ("02/07", "9:00", "Implementación de auditoría en módulo historia-clinica/ (AuditoriaHCService)", "13:00", "4"),
            ("03/07", "13:00", "Pruebas de subida de archivos con Multer y distintos formatos", "15:00", "2"),
            ("03/07", "18:00", "Ajuste de límites de tamaño de archivos y mensajes de error personalizados", "20:00", "2"),
        ],
        "w5": [
            ("06/07", "14:00", "Validaciones de campos de Examen Mental (12 campos obligatorios/opcionales)", "18:00", "4"),
            ("07/07", "16:00", "Creación del modelo AuditoriaHC + migración + seed de prueba", "19:00", "3"),
            ("08/07", "17:00", "Implementación de versionado automático de consultas (ConsultaVersion)", "21:00", "4"),
            ("09/07", "9:00", "Refactorización: separación servicios (signos.service, evoluciones.service, documentos.service)", "13:00", "4"),
            ("10/07", "13:00", "Pruebas de integración de auditoría y versionado de consultas", "15:00", "2"),
            ("10/07", "18:00", "Correcciones en registro de AuditoriaHC y creación de versiones", "20:00", "2"),
        ],
        "w6": [
            ("13/07", "14:00", "Implementación de verificación de contraseña para firma digital", "18:00", "4"),
            ("14/07", "16:00", "Diseño de layout para PDF de HC con pdfkit: encabezado, cuerpo, pie de página", "19:00", "3"),
            ("15/07", "17:00", "Implementación de hash SHA-256 para verificación de certificados de asistencia", "21:00", "4"),
            ("16/07", "9:00", "Creación de modelo HceFormConfig + TemplateHCE en base de datos", "13:00", "4"),
            ("17/07", "13:00", "Pruebas de generación de PDF y certificados con datos reales", "15:00", "2"),
            ("17/07", "18:00", "Correcciones en el formato de certificado y layout del PDF", "20:00", "2"),
        ],
        "w7": [
            ("20/07", "14:00", "Endpoints de configuración de módulos HCE por especialidad (EspecialidadModuloHCE)", "18:00", "4"),
            ("21/07", "14:00", "Modelos y endpoints para revisión de auditoría: permisos, estados, historial", "19:00", "5"),
            ("22/07", "17:00", "Correcciones de CORS y seguridad en endpoints de HCE", "21:00", "4"),
            ("23/07", "9:00", "Implementación de single-flight refresh en backend para evitar refresh duplicados", "13:00", "4"),
            ("24/07", "15:00", "Fix de cookies (431) y headers de autenticación", "17:00", "2"),
            ("24/07", "18:00", "Últimas correcciones de seguridad y middleware", "20:00", "2"),
        ],
        "close": [
            ("27/07", "14:00", "Documentación técnica del backend: endpoints, modelos, flujos", "18:00", "4"),
            ("28/07", "14:00", "PLAN_BUILD.md con resumen de fases completadas, pendientes y arquitectura", "18:00", "4"),
        ],
    },

    "C": {
        "initial": [
            ("", "", "--- TRABAJO INDIVIDUAL ---", "", ""),
            ("27/05", "16:00", "Setup de Next.js 14 App Router + instalación de dependencias base", "20:00", "4"),
            ("28/05", "9:00", "Instalación y configuración de Tailwind CSS + shadcn/ui + diseño del sistema de colores", "13:00", "4"),
            ("29/05", "13:00", "Creación de layout base + sidebar navegación + estructura de rutas por rol", "15:00", "2"),
            ("29/05", "18:00", "Componentes UI base: botones, inputs, tablas, cards reutilizables", "20:00", "2"),
            ("01/06", "14:00", "Página de login con formulario + validación + integración con API", "18:00", "4"),
            ("02/06", "16:00", "Auth context con localStorage + hooks de autenticación + protección de rutas", "19:00", "3"),
            ("03/06", "17:00", "Interceptor API con refresh automático + api-client base con fetch wrapper", "21:00", "4"),
            ("04/06", "9:00", "Dashboard por rol: admin, especialista, enfermero, auditor, portero", "13:00", "4"),
            ("05/06", "13:00", "Sidebar responsivo con menú por rol y submenús", "15:00", "2"),
            ("05/06", "18:00", "Correcciones de responsive en layout y sidebar para mobile", "20:00", "2"),
        ],
        "w1": [
            ("08/06", "14:00", "Página de listado de pacientes con tabla, búsqueda y filtros básicos", "18:00", "4"),
            ("09/06", "16:00", "Página de detalle de paciente con información personal y citas", "19:00", "3"),
            ("10/06", "17:00", "Cards de paciente reutilizables con info de última cita y estado", "21:00", "4"),
            ("11/06", "9:00", "Buscador de pacientes con debounce y filtros por identificación/nombre", "13:00", "4"),
            ("12/06", "13:00", "Hook useApi personalizado + tipos e interfaces básicas del sistema", "15:00", "2"),
            ("12/06", "18:00", "Tipos e interfaces TypeScript para módulo HCE (consulta, diagnósticos, etc.)", "20:00", "2"),
        ],
        "w2": [
            ("15/06", "14:00", "Tipos detallados de TypeScript para todos los submódulos de HCE", "18:00", "4"),
            ("16/06", "16:00", "Componente de input con búsqueda y autocomplete para CIE-10", "19:00", "3"),
            ("17/06", "17:00", "Página de listado de consultas HCE por paciente con tabla expandible", "21:00", "4"),
            ("18/06", "9:00", "Formulario de nueva consulta HCE con estructura de tabs", "13:00", "4"),
            ("19/06", "13:00", "Correcciones en el formulario de consulta y validaciones del lado frontend", "15:00", "2"),
            ("19/06", "18:00", "Mejoras visuales en el formulario y responsive de tabs", "20:00", "2"),
        ],
        "w3": [
            ("22/06", "14:00", "Tab de Signos Vitales en formulario HCE con inputs para PA, FC, temp, IMC", "18:00", "4"),
            ("23/06", "16:00", "Tab de Prescripción en formulario con campos de medicamento, dosis, frecuencia", "19:00", "3"),
            ("24/06", "17:00", "Tab de Examen Físico con toggles por sistema y campos desplegables", "21:00", "4"),
            ("25/06", "9:00", "Tab de Evolución Clínica con editor SOAP (subjetivo, objetivo, análisis, plan)", "13:00", "4"),
            ("26/06", "13:00", "Correcciones en tabs del formulario y sincronización de datos", "15:00", "2"),
            ("26/06", "18:00", "Visualización de Antecedentes y Alergias en el perfil del paciente", "20:00", "2"),
        ],
        "w4": [
            ("29/06", "14:00", "Tab de Pedidos e Interconsultas en formulario HCE", "18:00", "4"),
            ("30/06", "16:00", "Componente de subida de archivos con drag & drop y vista previa", "19:00", "3"),
            ("01/07", "17:00", "Tab de Indicaciones y Tratamiento en formulario HCE", "21:00", "4"),
            ("02/07", "9:00", "Refactor de páginas HCE para usar el nuevo módulo historia-clinica/", "13:00", "4"),
            ("03/07", "13:00", "Ajustes en componente de subida de archivos y feedback de progreso", "15:00", "2"),
            ("03/07", "18:00", "Correcciones de validación en formularios de pedidos e indicaciones", "20:00", "2"),
        ],
        "w5": [
            ("06/07", "14:00", "Formulario de Examen Mental con 12 campos estructurados (conciencia, memoria, etc.)", "18:00", "4"),
            ("07/07", "16:00", "Indicadores visuales de auditoría y estado de revisión en consultas", "19:00", "3"),
            ("08/07", "17:00", "Componente de historial de versiones de consulta con diff visual", "21:00", "4"),
            ("09/07", "9:00", "Refactor de componentes frontend para separar responsabilidades por tab", "13:00", "4"),
            ("10/07", "13:00", "Pruebas de componentes frontend y correcciones de renderizado", "15:00", "2"),
            ("10/07", "18:00", "Ajustes UI en historial de versiones y visualización de datos", "20:00", "2"),
        ],
        "w6": [
            ("13/07", "14:00", "Componente FirmaDigitalModal con prompt de contraseña y confirmación", "18:00", "4"),
            ("14/07", "16:00", "Botón de descarga de PDF de HC integrado en el detalle de consulta", "19:00", "3"),
            ("15/07", "17:00", "Componente CertificadoModal para generación de certificado médico", "21:00", "4"),
            ("16/07", "9:00", "Componente DynamicForm para formularios dinámicos + TemplateSelector", "13:00", "4"),
            ("17/07", "13:00", "Vista HCE del especialista: listado de pacientes con grid de módulos", "15:00", "2"),
            ("17/07", "18:00", "Formulario de consulta completo con todos los tabs integrados y funcionales", "20:00", "2"),
        ],
        "w7": [
            ("20/07", "14:00", "Frontend admin HCE: listado especialistas → pacientes → HC read-only + configuración módulos", "18:00", "4"),
            ("21/07", "14:00", "Frontend auditor: dashboard estadísticas, listado HC, detalle completo, modal revisión", "19:00", "5"),
            ("22/07", "17:00", "Fix filtros frontend: filtro por especialistaId, mostrar nombre/especialidad en encabezado", "21:00", "4"),
            ("23/07", "9:00", "AuthProvider + middleware matcher + mejorar manejo de sesión y refresh", "13:00", "4"),
            ("24/07", "15:00", "Ajustes responsive finales en frontend HCE para mobile", "17:00", "2"),
            ("24/07", "18:00", "Últimas correcciones visuales y de usabilidad en frontend", "20:00", "2"),
        ],
        "close": [
            ("27/07", "14:00", "Documentación del frontend: componentes, rutas, flujos de navegación", "18:00", "4"),
            ("28/07", "14:00", "Últimas correcciones frontend y ajustes finales de UI/UX", "18:00", "4"),
        ],
    }
}

WEEKS = [
    ("initial", "Período Inicial — Requisitos, Setup DB y Backend (26 may – 5 jun)"),
    ("w1", "Semana 1 — Modelos HCE en Prisma (8–12 jun)"),
    ("w2", "Semana 2 — Módulo HCE Backend: CRUD Base (15–19 jun)"),
    ("w3", "Semana 3 — Signos Vitales, Examen Físico y Evolución (22–26 jun)"),
    ("w4", "Semana 4 — Pedidos, Exámenes y Subida Archivos (29 jun – 3 jul)"),
    ("w5", "Semana 5 — Examen Mental, Historia Familiar y Auditoría (6–10 jul)"),
    ("w6", "Semana 6 — Firma Digital y PDF (13–17 jul)"),
    ("w7", "Semana 7 — Frontend Completo HCE + Auditoría (20–24 jul)"),
    ("close", "Cierre Final (27–29 jul)"),
]

WEEK_MEETINGS = {
    "initial": ["m1", "m2", "m3"],
    "w1": ["m4"],
    "w2": ["m5"],
    "w3": ["m6"],
    "w4": ["m7"],
    "w5": ["m8"],
    "w6": ["m9"],
    "w7": ["m10"],
    "close": ["m11"],
}

MEETING_KEY_MAP = {
    "m1": 0, "m2": 1, "m3": 2, "m4": 3, "m5": 4,
    "m6": 5, "m7": 6, "m8": 7, "m9": 8, "m10": 9, "m11": 10
}

def set_cell_shading(cell, color):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def make_cell(cell, text, bold=False, size=9, color=None, align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.text = ""
    p = cell.paragraphs[0]
    run = p.add_run(str(text))
    run.bold = bold
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = color
    p.alignment = align

def add_section_title(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(31, 78, 121)
    p.space_before = Pt(10)
    p.space_after = Pt(4)

def add_mejora_text(doc, text):
    p = doc.add_paragraph()
    run = p.add_run("⬆ ")
    run.font.color.rgb = RGBColor(0, 128, 0)
    run.font.size = Pt(9)
    run = p.add_run(text)
    run.italic = True
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0, 100, 0)
    p.space_before = Pt(1)
    p.space_after = Pt(4)

def add_subtotal(doc, label, acumulado=None, highlight=False):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    t = label
    if acumulado:
        t += f"  |  Acumulado: {acumulado}"
    run = p.add_run(t)
    run.bold = True
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(31, 78, 121)
    if highlight:
        set_cell_shading(p, "FFF3CD")
    p.space_before = Pt(2)
    p.space_after = Pt(5)

def create_meeting_entry(m):
    return [m[0], m[1], m[2], m[3], m[4]]

MEETING_LABELS = {
    "initial": ["Reunión 1 — 26/05 9:00", "Reunión 2 — 26/05 14:00", "Reunión 3 — 02/06 14:00"],
    "w1": ["Reunión 4 — 09/06 14:00 (Especialista)"],
    "w2": ["Reunión 5 — 16/06 14:00 (Especialista)"],
    "w3": ["Reunión 6 — 23/06 14:00 (Especialista)"],
    "w4": ["Reunión 7 — 30/06 14:00 (Especialista)"],
    "w5": ["Reunión 8 — 07/07 14:00 (Revisión MVP)"],
    "w6": ["Reunión 9 — 14/07 14:00 (Personal sistema)"],
    "w7": ["Reunión 10 — 24/07 13:00 (Última revisión)"],
    "close": ["Reunión 11 — 29/07 17:00 (Firma documentos)"],
}

def generate_doc(role_key):
    role = ROLES[role_key]
    doc = Document()

    for section in doc.sections:
        section.top_margin = Cm(1.5)
        section.bottom_margin = Cm(1.5)
        section.left_margin = Cm(1.5)
        section.right_margin = Cm(1.5)

    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("BITÁCORA DE ACTIVIDADES")
    run.bold = True
    run.font.size = Pt(16)
    run.font.color.rgb = RGBColor(31, 78, 121)

    st = doc.add_paragraph()
    st.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = st.add_run(f"Rol: {role['title']}")
    run.font.size = Pt(12)
    run.font.color.rgb = RGBColor(31, 78, 121)

    st2 = doc.add_paragraph()
    st2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = st2.add_run("Proyecto: Sistema de Agendamiento de Citas Médicas — Instituto de Neurociencias, Ecuador")
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(100, 100, 100)

    info = doc.add_paragraph()
    run = info.add_run("Total: 192 h  |  Reuniones compartidas con el equipo: 20 h  |  Trabajo individual: 172 h  |  Período: 26 may – 29 jul 2026")
    run.bold = True
    run.font.size = Pt(9)

    BLOCKED = doc.add_paragraph()
    run = BLOCKED.add_run("Restricciones de horario: ")
    run.bold = True
    run.font.size = Pt(8)
    run = BLOCKED.add_run("Lun 10–13 bloqueado | Mié 10–12 y 13–16 bloqueado | Jue 15–18 bloqueado | Vie 9–13 y 15–17 bloqueado")
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(100, 100, 100)

    doc.add_paragraph()

    headers = ["Fecha", "Entrada", "Actividad desarrollada", "Salida", "Horas"]

    running_total = 0

    for wk_id, wk_title in WEEKS:
        add_section_title(doc, wk_title)

        meeting_keys = WEEK_MEETINGS.get(wk_id, [])
        activities = ACTIVITIES[role_key].get(wk_id, [])
        mtg_labels = MEETING_LABELS.get(wk_id, [])

        all_rows = []
        mtg_used = 0

        for act in activities:
            if act[0] == "":
                continue
            all_rows.append(act)

        for i, mk in enumerate(meeting_keys):
            m = MEETINGS[mk]
            label = mtg_labels[i] if i < len(mtg_labels) else ""
            row = list(m)
            row[2] = "🔴 " + row[2]
            all_rows.append(row)

        all_rows.sort(key=lambda r: (r[0], r[1]))

        table = doc.add_table(rows=1 + len(all_rows), cols=5)
        table.style = 'Table Grid'
        table.alignment = WD_TABLE_ALIGNMENT.CENTER

        for i, h in enumerate(headers):
            c = table.rows[0].cells[i]
            make_cell(c, h, bold=True, size=9, color=RGBColor(255,255,255), align=WD_ALIGN_PARAGRAPH.CENTER)
            set_cell_shading(c, "1F4E79")

        wk_work = 0
        for ri, row_data in enumerate(all_rows):
            is_mtg = str(row_data[2]).startswith("🔴")
            for ci, val in enumerate(row_data):
                c = table.rows[ri+1].cells[ci]
                sz = 8.5 if ci == 2 else 9
                make_cell(c, val, size=sz)
                if is_mtg:
                    set_cell_shading(c, "FFF3CD")
                elif ri % 2 == 0:
                    set_cell_shading(c, "EBF5FB")
            wk_work += int(row_data[4])

        running_total += wk_work

        add_subtotal(doc, f"Subtotal: {wk_work} h", f"{running_total} h", highlight=False)

        mejora_map = {
            "w1": "Mejora (09/06): Especialista solicitó diagnóstico CIE-10 estructurado → implementado en Semana 2",
            "w2": "Mejora (16/06): Especialista solicitó prescripciones con dosis/frecuencia y signos vitales con IMC → implementado en Semana 3",
            "w3": "Mejora (23/06): Especialista solicitó evolución SOAP y examen físico detallado. Además pidió pedidos/subida archivos → implementado en Semana 4",
            "w4": "Mejora (30/06): Especialista indicó necesidad de trazabilidad y examen mental estructurado → implementado en Semana 5",
            "w5": "Mejora (07/07 - MVP): Se requiere firma digital, PDF de HC y certificado de asistencia → implementado en Semana 6",
            "w6": "Mejora (14/07): Personal solicitó interfaz más intuitiva con tabs, filtros y vista admin/auditor → implementado en Semana 7",
        }
        if wk_id in mejora_map:
            add_mejora_text(doc, mejora_map[wk_id])

        doc.add_paragraph()

    final = doc.add_paragraph()
    final.alignment = WD_ALIGN_PARAGRAPH.CENTER
    final.space_before = Pt(8)
    run = final.add_run(f"TOTAL GENERAL: {running_total} HORAS")
    run.bold = True
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(31, 78, 121)

    summary_data = [
        ["Período Inicial (26 may – 5 jun)", "36"],
        ["Semana 1 — Modelos HCE (8–12 jun)", "21"],
        ["Semana 2 — CRUD Base HCE (15–19 jun)", "21"],
        ["Semana 3 — Signos/Examen/Evolución (22–26 jun)", "21"],
        ["Semana 4 — Pedidos/Archivos (29 jun – 3 jul)", "21"],
        ["Semana 5 — Mental/Auditoría (6–10 jul)", "21"],
        ["Semana 6 — Firma/PDF (13–17 jul)", "21"],
        ["Semana 7 — Frontend Completo (20–24 jul)", "21"],
        ["Cierre Final (27–29 jul)", "9"],
        ["TOTAL", "192"],
    ]

    add_section_title(doc, "Resumen General")
    tbl2 = doc.add_table(rows=len(summary_data)+1, cols=2)
    tbl2.style = 'Table Grid'
    tbl2.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Período", "Horas"]):
        c = tbl2.rows[0].cells[i]
        make_cell(c, h, bold=True, size=9, color=RGBColor(255,255,255), align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_shading(c, "1F4E79")
    for ri, rd in enumerate(summary_data):
        is_total = rd[0] == "TOTAL"
        for ci, val in enumerate(rd):
            c = tbl2.rows[ri+1].cells[ci]
            make_cell(c, val, bold=is_total, size=9, align=WD_ALIGN_PARAGRAPH.CENTER if ci==1 else WD_ALIGN_PARAGRAPH.LEFT)
            if is_total:
                set_cell_shading(c, "D6EAF8")
            elif ri % 2 == 0:
                set_cell_shading(c, "EBF5FB")

    # Meeting summary
    add_section_title(doc, "Reuniones Compartidas (aparecen igual en las 3 bitácoras)")
    mtg_all = list(MEETINGS.values())
    tbl3 = doc.add_table(rows=len(mtg_all)+1, cols=5)
    tbl3.style = 'Table Grid'
    tbl3.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        c = tbl3.rows[0].cells[i]
        make_cell(c, h, bold=True, size=9, color=RGBColor(255,255,255), align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_shading(c, "1F4E79")
    for ri, m in enumerate(mtg_all):
        for ci, val in enumerate(m):
            c = tbl3.rows[ri+1].cells[ci]
            sz = 8.5 if ci == 2 else 9
            make_cell(c, val, size=sz)
            set_cell_shading(c, "FFF3CD")
        if ri % 2 == 0:
            for ci in range(5):
                c = tbl3.rows[ri+1].cells[ci]
                set_cell_shading(c, "FFF8E1")

    out = f"C:\\Users\\anton\\Desktop\\agendamiento\\{role['file']}"
    doc.save(out)
    print(f"OK Generado: {out}")

for rk in ["A", "B", "C"]:
    generate_doc(rk)
