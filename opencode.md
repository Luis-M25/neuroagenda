1. roles
	administrador
	admisión
	especialista
	auditores
	enfermeros
2. administrador:
	habrá un super admin que hara todas las cosas del sistema las cuales son
	- creación del especialista el cual tendrá 
	datos personales 
	primer nombre y apellido  obligatorio el segundo de ambos opcional
	escoger su tipo de identificación si es cedula o pasaporte con validación y validar que no exitsa en el sistema ese usario 	con 	la cedula de algoritmo ecuatoriano genero, FECHA DE NACIMIENTO 
	contacto 
	correo institucional el cual debería ser el primario para el inicio de sesión del especialista  correo secundario el cual sera 	opcional y en caso de problemas con el correo institucional este sera una opción para el ingreso al sistema , numero de 	teléfono y dirección donde vive 
	credenciales que sera el correo institucional por defecto si lo tiene si no el personal y contraseña que tenga la opción de 	verla en el fronted y que se genere automáticamente 
	datos profecionbales código msp opcional , especialidad escoger de las que administrador crea titulo profesional y sub 	especilidad sede que se escojera del que el admin cree y lo mismo con consultorio y tendrá una opción de habiolitar 	pasantes 
	- craecion de especialidades 
	el admin podrá crear especilidades que se darán uso en la creación del especialista
	-horarios el admin podrá asignar horarios a los especialistas desde un calendario semanla el admin podrá escoger el la 	columna del dia la hora y se podrá escoger la duración es decir si escogeblas 8 am y duración 120 min en el horario se 	debe de marcar dos horas
	- bloqueos de especialista
	el admin podrá bloquear a un especialista con fecha de inicio y fecha de fin el sistema tiene que validar si es esas fecha 	el especilista no tiene citas y si las tiene el sistema tendrá que arertar al admin ya sea cancelasndo las citas cambiándole  	el especilista a la cita o bien solo cambiándole el horario a ese mismo especialista
	- bloqueos por especilidad
	lo mismo quie bloqueo de especialista pero este tendrá que bloquer de manera masiva a todos los especialista de esa 	especialidad con la opción de seleccionar  o deseleccionar a un especialista de esa lista de bloqueo y validar lo mismo de 	la  citas
	- bloqueos gruopales 
	es lo mismo que por especialidad pero con la condición de que no importa la especialidad este lo buscara lo pondrá en 	una lista de bloqueo y los que esten en la lsita serán bloqueados  
	- bloquear por dia 
	este a diferencia de bloqueo por especialisat este el sistema bloquea a todos estos días a poder crear una cita ese dia 	
	aquí entra todos los días festivos de ecuador también el admin podrá marcar un dia x y con motivo x si se marca ese dia 
	y hay citas se advirtira al admin y el sistema le dará la opocion de reagendar o cancelar la citas 
	- el admin podrá crear pacientes que estos no serán usuarios en sistema no podrán iniciar sesión ni interuactira con el 	
	sistema el admin tendrá que llenar el formulario de datos personales los mismo que especilista con adcion de estado civil
	tendrá el formulario de contacto Teléfono * Teléfono Secundario Dirección * Provincia * Seleccione provincia... Cantón 	* Seleccione cantón... Parroquia Seleccione parroquia... Zona Seleccione zona...
	en información medica Grupo Sanguíneo * O POSITIVO Tipo Seguro * PARTICULAR Convenio PUBLICA Alergias 	Enfermedades Preexistentes las alergias y enfermedades pre existentes como antecedentes serán parte de un 	formulario de historial clínico tendta contacto de emergencia Nombre Contacto * Teléfono * Parentesco *
	y un formulario para llenar estado lobaral Empresa Cargo Dirección Trabajo Teléfono Trabajo
	- creación de cita 
	se buacara al padiente por nombre o cedula pasapoerte se escojera el protocolo de la cita si es de 	evaluación de control unica o de mantenimiento luego se escogerá las especialidades en las que se basara el protocolo 	de citas luego de eso se escogerá al especialista por especialidad luego de esto pasara a esoger las citas por especilista  	en el cual el primer requisito es el numero de citas con ese especialista luego se escogerá la fechas para cada cita por 	especilsita luego que ya se escogio las citas del primer especilista se escogerá el nuemro de citas del segundo con sus 	fecha y asi al escoger las fechas en el calendario se deberá mostra en verde las fechas disponibles en gris las fechas 	vbloqueadas el morado intenso las fechas feriados o fechas que nse agregaran al días bloquedos azul seleccionado rojo 	si el paciente tiene cita ese dia anaranjado si el especdilista tiene cita ese dia a esa hora validar que no se pueda esocger 	días anteriosres a la fecha actual no dejar seguir si no se ha escojodo el numero de citas establecidos al final un resumen 	de la citas deonde resumirá el horario poer especilista protocolo especialistas lugar y si desea notificar por correo o por 	whatapps al paciente si desea cconfirmar la cita es este se deberá mostrar los conusltorios por especilista pero se podrá 	modificar en esta parte el consultoerio que tiene por defecto el especilista SE PODRA VER EL PERFIL DEL PACDIENTE A LOS LADOS DEL FORMUARIO DE LA CREACION DE LA CITA PARA VER SI EL PACIENTE YA ESTUVI EN PROTOCOSLOS DE EVALUACION TRATAMIENTO CONTROL ETC VALIDAR QUE SU PRIMER PROTOCOLO DE LA CITA SEA DE EVALUACION 
	-sedes 
	aquí se agragaran modificaran eliminiaran las sedes y consultorios cada consultorio debe tener su sede asignada 
	- seguros 
	el admin administrara la lista de segurios que se usaran en la creación de pacientes Gestion de seguros medicos Nombre 	del seguro Tipo (Publico/Privado)   Agregar Seguro 	
	- creación de admisión 
	el admin podrá crear usuarios con persimos dinámicos en el cual la creación pedirá los mismo datos de especilista pero 	sin la pare medica y tendrá un apartado de permisos que esto es loq ue tendrá acceso el admisión tendrá una lista con 	check para habilitar los permisos desde ver un paciente crear citas ver historial clienico creación de especilista en si todo 	lo que hace el admin tendrá la opción de habilitar a adminsion Permisos Ver Especialistas Crear Especialista Editar 	Especialista Deshabilitar Especialista Bloqueo Grupal Especialistas Ver Pacientes Crear Paciente Editar Paciente Ver 	Inasistencias Bloquear Paciente Ver Todas las Citas Crear Cita Editar Cita Cancelar Cita Reagendar Cita Marcar No 	Asistió Ver Calendario Ver Reportes Gestionar Administradores Gestionar Permisos también ver administra nnmor 	dicho las hsitorial clinica
	creación del portero 
	el admin podrá crear al portero con un formulario como el de admisión este solo podrá buscar por cedula pasaporte o 	nombre al paciente y cambiar el estado de las citas solo del dia actual a estado de espera no podrá modificar a otro 	estado solo a en espera y solo las citas del ese dia
	-calendario 
	el admini tendrá un calendario semanal donde se mostraran las citas del dia poer semana con el nombre del paciente 	código de color mas código alfabetico en donde este reperenetara al especialista Calendario de Citas Hoy 13 jul – 17 jul 	2026 Estados: Pendiente Confirmada En espera En atención Atendida No asistió Cancelada Reagendada Reservado 	Lunes 13/7 Reagendar Bloquear Martes 14/7 Reagendar Bloquear Miércoles 15/7 Reagendar Bloquear Jueves 16/7 	Reagendar Bloquear Viernes 17/7 Reagendar Bloquear 08:00 Juan Perez CP Miguel Torres CP 08:30 09:00 Sofia Lopez 	MM Miguel Torres CP Sofia Lopez CP Gabriela Silva MM 09:30 Laura Mendez MM Juan Perez CP 10:00 Miguel 	Torres LV Juan Perez CP ▼ 1 más Miguel Torres CP Roberto Castro LV desde el calendario podrá cancelar ese dia con la advertencias de cancelar tiodas las citas o reagendar citas en el cual se podrá hjacer en reagendar esatc opciones 14 cita(s) activa(s) en este día Seleccione una opción para gestionar las citas de este día. Reagendar citas de hoy Filtre por especialidad y especialista, asigne nuevas fechas y horarios en el calendario semanal. Pendiente Reagendada Cancelada Cancelar todas las citas del día Cancela todas las citas activas de este día de forma masiva. Esta acción es irreversible. Reagendamiento automático El sistema busca automáticamente el siguiente día hábil disponible para cada cita. Configure el orden y las preferencias de búsqueda. Reagendamiento automático El sistema buscará automáticamente el siguiente día disponible para cada cita. Opciones de búsqueda Mismo día de la semana (lunes → próximo lunes) Misma hora (conserva el horario original) 14 citas serán procesadas Volver Reagendar citas de hoy lunes, 13 de julio de 2026 Especialidades Buscar especialidad... Cardiologia Dermatologia Medicina General Neurologia Pediatria Traumatologia Especialistas Marcar todos | Desmarcar Buscar por nombre o cédula... Especialista	Especialidad	Citas CP Carlos Paredes Medicina General	5 JD Jorge Diaz Neurologia	2 LV Luis Vega Pediatria	2 MM Maria Martinez Cardiologia	2 PM Pedro Mora Traumatologia	2 AR Ana Ruiz Dermatologia	1 Citas del día (9) Buscar paciente... Todas Mañana Tarde Cita seleccionada. Haga clic en un horario del calendario para asignarla. Elena Rojas 11:30 – 11:00 · JD Jorge Diaz Gabriela Silva 11:00 – 11:30 · JD Jorge Diaz Ricardo NuñEz 10:30 – 10:00 · LV Luis Vega Miguel Torres 10:00 – 10:30 · LV Luis Vega Selecc. Juan Perez 10:00 – 10:30 · CP Carlos Paredes Sofia Lopez 10:00 – 10:30 · CP Carlos Paredes Juan Perez 09:30 – 09:60 · CP Carlos Paredes Miguel Torres 09:00 – 09:30 · CP Carlos Paredes Juan Perez 08:00 – 08:30 · CP Carlos Paredes Pend: 9 Reag: 0 Canc: 0 ⚠️ Pendiente ❓ Reagendada ❌ Cancelada Calendario semanal 6 jul – 10 jul 2026 Disponible Ocupado Feriado No laboral Asignado Lun 6/7 Mar 7/7 Mié 8/7 Jue 9/7 Vie 10/7 09:00 09:30 10:00 10:30 11:00 11:30 12:00 12:30 Asignadas: 0/9 Reagendadas: 0 Canceladas: 0 Pendientes: 9  

	- administración de historial clínico 
 	el admin podrá administrar las historia clínicas por especialidad Habilitar/deshabilitar módulos por especialidad 	Cardiologia de 15 módulos habilitados Dermatologia de 15 módulos habilitados Medicina General de 15 módulos 	habilitados Neurologia de 15 módulos habilitados Pediatria de 15 módulos habilitados Traumatologia de 15 módulos 	habilitados Y PODRA VER POR ESPECILISTA SUS HC POR PACIENTES istoria Clínica Electrónica por especialista Buscar especialista... Jorge Diaz Neurologia · Sucursal Norte 1 consultas Maria Martinez Cardiologia · Clinica Central 0 consultas Pedro Mora Traumatologia · Sucursal Sur 0 consultas Carlos Paredes Medicina General · Clinica Central 3 consultas Ana Ruiz Dermatologia · Sucursal Norte 1 consultas Luis Vega Pediatria · Clinica Central 0 consultas Pacientes Consulta las historias clínicas Buscar paciente... Roberto Castro 1712244447 · 61 años


	- ESPECILISTA 
	- mis citas 
	podrá ver sus citas  podrá escoger una cita y según los estados pendiente confirmada en espera el especialista podrá marcar la cita born atendre y se cambiara al estado a atendiento a la vez de le abrirá los hc habilitados en el cual lo primero y obligatorio es el hc consulta que tiene que mostrar el motivo con sus respectivas opción nes tipo de consuta tipo de tencion motivi y enfermedad actual  si no se llena esto no se cerrara el hc luego esatn los demás hc evolución tiene descripción general conciencia memoria sesasacion y percepción afectividad funciones cognitivas juicio e insight atención y concentración orientación pensamiento lenguaje funciones relacionales . hc antecedentes familiares tiene que tener plantillas , cardiopatía diabetes enf cadio vascuñlar hipertnwecion cancer tuberculossis enf mental enf infecciosa malformación otro se puede agregar y luego seleccionar a) Edad y estado de salud o motivo de fallecimiento de padres, hermanos e hijos

b) Logros educativos de padres, hermanos e hijos

c) Logros ocupacionales de padres, hermanos e hijos

d) Historial de perdida visual y auditiva

e) Historial psiquiátrico de padres, hermanos e hijos

f) Historial médico y neurológico de padres, hermanos e hijos

g) Trasfondo cultural

h) Estructura, dinámica y subjetividad de la familia actual
hc habitos toxicos alchgol drogas tabaco alimentación sueño otro también se puede agragr y luego seleccionaer 
hc de diagnostico escoger en enfermedad CIE.10  obsevacions plantilla nuevo diagniostico elminar diagnostico 
hc enfermedades personales y quirúrgicas CARDIOPATÍA

DIABETES

ENF. C. VASCULAR

ENDOCRINO METABÓLICO

CÁNCER

TUBERCULOSIS

ENFERMERA. MENTAL

GUARDERÍA INFECCIOSA

MAL FORMACIÓN

OTRO

a) Lesión cerrada de la cabeza:

b) Episodios de pérdida de conciencia:

c) Epilepsia o ataques de apoplejía:

d) Accidentes y otras anomalías cerebrovasculares (por ejemplo, aneurisma):

e) Enfermedad cardíaca, hipertensión, diabetes, enfermedad pulmonar obstructiva crónica:

f) Enfermedades infecciosas (por ejemplo, encefalitis, meningitis, absceso cerebral):

g) Enfermedades degenerativas (p. ej., esclerosis múltiple, enfermedad de Parkinson):

h) Trastornos metabólicos (p. ej., hipertiroidismo, hipotiroidismo, enfermedad hepática):

i) Encefalopatía tóxica:

j) Enfermedades o trastornos congénitos o del desarrollo (p. ej., Sturge-Weber, esclerosis:

k) tuberosa, trastorno persistente del desarrollo):

1) Trastornos demenciales (p. ej., enfermedad de Alzheimer, enfermedad de Pick):

m) Impedimentos físicos:

n) Consumo de alcohol o drogas:

o) Antecedentes de pérdida visual y auditiva y uso de dispositivos electrónicos:

q) Medicamentos y dosis actuales y pasadas

r

) Proveedores de atención a la salud pasados y actuales

a) Síntomas y quejas:

b) Inicio y curso de los síntomas:

c) Grado de extensión y gravedad:

d) Hallazgos en evaluaciones pasadas y actuales:

e) Hospitalizaciones:

f) Intentos de suicidio en el pasado:

g) Tratamiento pasado y actual:

h

) Efectos de los síntomas en la vida cotidiana:

a) Más alto nivel de estudios cursado:

b) Escuelas en las que estuvo:

hc historial familiar Edad y estado de salud o motivo de fallecimiento de padres, hermanos e hijos*

Logros ocupacionales de padres, hermanos e hijos*

Historial psiquiátrico de padres her hermanos e < hijos*

Trasfondo cultural*

Información detallada sobre edad, estado de salud y motivos de fallecimiento de familiares...

Descripción de los logros ocupacionales de la familia...

Antecedentes familiares de trastornos psiquiátricos...

Antecedentes culturales, tradiciones, idiomas hablados en casa...

Logros educativos de padres, hermanos e hijos*

Historial de perdida visual y auditiva*

Historial médico y neurológico de padres, hermanos e hijos*

Estructura, dinámica y subjetividad de la familia actual *

Descripción de los logros educativos de la familia...

Historia familiar de problemas auditivos y visuales...

Antecedentes familiares de problemas médicos y neurológicos...

Descripción de la estructura familiar actual...

Aceptar

Cancelar
hc exámenes de laboratorio e imegnes seleccionar documento nombre del examen resultados fecha de resultados fase pretratamiento, tratamiento o postratamioento
el especisluista podrá ver sus hc por poacientes solo su hc y ver los moduilos que tiene hanbilitado un apartado para ver su horario el perfil si quiere cambiar la conmtrasela o añadir su código mps
el especilista no pùede atender citas pasadas ni futuras solo las del dia actual el hc desde citas podrá acceder a info del paciente con sis hc de una manera mas visual su citas dberan verse por fecha y hora y porderanrse por la misma tambun podrá ver su calndario pero con solo sus citas 
las hc pueden quedar abvirtas poero con ionformacion guardada al finalizar cada hc de debe generar un diumento con las hc con la firma digital al poner la fierma digital que ponga de nuevo su contrasela pata verdificar una vez cerrado el hc no se pùede modificar
enfermera 
esta se encagara de triage es decir de llenar las hc de signos vitales de la cita que esta programada para el dia la hc de las alergia si no las tiene llena y las hc básicas que se hacen el las triajes 
debe seleccionar al pwciente y la cita y al igia que el especialiosta solo deberá llenar las hc y en cuando el padiente ya este con el especilista si el especilista tiene habilitado estas hc se ya se leveran reflejados estas hc 

auditores 
estos solo dene tener prmisos de ver las hc de todos los es`pecilistas y verificarq ue esten bien con un estado de revisado o poner quie eta revisado pero tiene mal algo 



 co,portamiento del sistema 
toda accion que de a¡haga en el sistema debe tener una auditoria es decir quien a que hora y si es algo critico de debe de poner motivo además estos debe ser visto por el admin es decir en detalle quiein creao una cita si se modifico de qiehn fue la modificaion cuando la fecha original y la fecha de reagendado la cracion de un especiliosta un paciente todo 

al seleccionar un especilista de su lista se podrá ver detalles del especilista básicos también de la auditoria 
paciente al seleccionar un paciente de debe de ver sus datos persinalies por tabs en potra el registros de sus hc por citas ordenada cronologicvamnete  ver un tab de prograso en donde se vera sus scitas de evalucion cuantas citas tiene cuantas a asistido cuantas se le ha cancelado cuantas reagendado las inasistencia por especialidad si  si un paciente no llega a una cita notificar al especialista y al admin y el admin puede poner el inasistencia al paciente en nesa cita y se le agragara a la espcilialida a las 3 citas de inasistencia poer protocolo o especilidad se deberá notificar al administrador y al especilita pàra ver si se le cancela el protocolo de citas que tiene el paciente esto se vera en reportes se vera la lista edee pacientes y su etadisticas y repotes en loq eu va de sus citas para llenar un registro y administra bien los tienpos  estos son los etados de las citas Pendiente
Confirmada
En espera
En atención
Atendida
No asistió
Cancelada
Reagendada los código de coloes de especilista en el calendato de amin se puede mofificar tambuien el alfabetico  y el de los etados en el calendario y losque se veranb los estados en citas al selecionaer una cita en el calendario de bede deplegar tabs de estados de la cita citaespecilista dende se podrá modificar la cita consultorio horario etc y otro tabs tara ver los datos del paciente y acceso directo a las hc del paciente 
en la pestaña de pacienbrte se podrá modificar del paxiente ver sus datos una lista de sus citas y reosrtes y estadísticas tenr opciones de ver dertalle modificar bloquer paciente y ver reportes estadísticas si un paciente la opción de bloqueo debe preguntar si se deberían cancelar las citas si es asi cancelar las citas se cancela pero el hario queda libre del especialista pero que qeude un resgitro de las citas canceladas del paciente Nombre	Identificación	Teléfono	Próxima Cita	Estado	Acciones
en la pestañla de citas sde mostraran la citas del dia cpon  Paciente	Especialista	Fecha	Hora	Especialidad	Estado	Acciones