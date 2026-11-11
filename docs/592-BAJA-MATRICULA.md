# 592 — BAJA MATRICULA: tipo, guía y plantillas, con el traslado al extranjero

## Lo que escribió Francisco

Idea 511 (4-nov-2026), al pedirle qué debía hacer el tipo:

> Debemos tener un tipo de asunto que nos permita usar esta plantilla para gestionar este trámite en
> lo referente a nuestro puesto de administrativos del centro. Solo nuestra parte. Recibir la
> solicitud de la dirección del centro, elaborar el documento, ponerlo a la firma de dirección,
> registrarlo de salida, y dar de baja en Séneca al alumno. Y tener la posibilidad de comunicar la
> resolución a quién corresponda en su caso.

Al diseñar el tema 519 (10-nov-2026):

> Pues me parece bien tu idea si en vez de Baja lo llamamos BAJA MATRICULA, para diferenciarlo de
> otros tipos de baja. Y ya que creamos la guía, incluyamos también los otros supuestos de baja, no
> solo el de traslado al extranjero.

> Me parece bien, pero debemos incluir el diseño y creación de hitos, tareas, plantillas de
> documentos y plantillas de correo. Y todos los campos necesarios en el asunto. Y pensar si esta
> inserción de campos se pueden hacer de forma "lógica y fluida" tal como está montada la estructura
> de la app ahora mismo o si hay que hacer algún retoque

## Lo que entendió Claude (acordado con Francisco el 10-nov-2026)

- El tipo general «BAJA» (Baja del alumnado) pasa a llamarse **BAJA MATRICULA** (nombre largo «Baja
  de matrícula»). Es la baja: el alumno deja de serlo desde una fecha y lo cursado cuenta. No es la
  anulación, que tiene su propio tipo y no se toca.
- Los asuntos de antes con «BAJA» conservan su carpeta y siguen siendo de este tipo.
- En esta tarea solo entra el supuesto **traslado al extranjero (ESO)**. Los demás supuestos van
  aparte (filas 586 a 591).
- **Datos del asunto** (del tipo):
  - «Motivo de la baja», de lista, con una sola opción por ahora: «Traslado al extranjero». Se pide
    al crear el asunto.
  - «País de destino» (texto) y «Fecha de efectos de la baja» (fecha).
  - «Protocolo de absentismo iniciado» (Sí / No).
  - «Cómo se acredita el traslado» (Declaración de la familia / Diligencia de Dirección).
  - «Aporta matrícula del país de destino» (Sí / No).
  - Nombre, curso, unidad y tutores legales salen del alumno, como siempre.
- **La guía del tipo** sustituye a la genérica de «BAJA». Seis hitos, en este orden; los dos
  primeros llevan «Solo si Motivo de la baja = Traslado al extranjero», los otros cuatro valen para
  cualquier baja:
  1. «Recibir el encargo de Dirección»: tarea «Añadir documento» (la declaración firmada o la
     diligencia) y tarea «Pedir datos» (país, fecha de efectos, protocolo, cómo se acredita,
     matrícula de destino).
  2. «Preparar la resolución»: tarea «Generar documento» con la resolución.
  3. «Firma de Dirección»: tarea «Firmar», una firma.
  4. «Registro de salida»: tarea «Registrar».
  5. «Baja en Séneca»: tarea «Otra cosa»: grabar la baja en Séneca con su fecha.
  6. «Comunicar»: tarea «Comunicar» con el correo a la familia; y tarea «Comunicar» con el correo a
     Servicios Sociales, «Solo si Protocolo de absentismo iniciado = Sí».
- **Plantillas del tipo**, con los textos de `docs/592-TEXTOS-BAJA-MATRICULA.md`:
  - Word: la resolución, con textos condicionales para protocolo, acreditación y matrícula de
    destino.
  - Word: el anexo I y el anexo II, sueltos en el tipo (no son pasos de la guía), para sacarlos
    cuando Dirección los pida. Lo que rellena la familia o Dirección va como líneas en blanco, no
    como datos.
  - Correo a la familia y correo a Servicios Sociales.
- **Al entrar, la app añade sola todo esto al centro** (tipo renombrado, datos, guía y plantillas),
  sin que nadie pulse nada. Una vez: si ya está, no lo vuelve a tocar. Los asuntos abiertos de
  «BAJA» siguen con los hitos que tenían.
- **«Campos del asunto»**: los datos de lista que están vacíos también salen ahí, para rellenarlos
  en el propio asunto (hoy solo se rellenan desde «Cambiar el asunto → Datos del asunto»).
- El recorrido de los datos no necesita más retoques: «Crear asunto con él» desde el encargo abre
  «Nuevo asunto», que pide el motivo; «Pedir datos» del hito 1 recoge el resto, y ninguna plantilla
  lo vuelve a pedir.

## Pantalla de prueba

- Sin pantalla: no cambia ninguna pantalla; lo nuevo es contenido (guía, datos y plantillas), y el
  único cambio de pantalla («Campos del asunto» con los datos de lista vacíos) queda escrito arriba.

## Qué NO se hace en esta tarea

- Revisar la primera vista de «Nuevo asunto»: fila 585.
- Baja a petición en ESO con 16 años o más: fila 586.
- Baja a petición en Bachillerato: fila 587.
- Anulación de matrícula en Bachillerato: fila 588.
- Traslado a otro centro de España: fila 589.
- Cambio de centro como medida disciplinaria: fila 590.
- Fallecimiento de un alumno: fila 591.
- Avisar a la tutoría o a la Inspección: no se pidió.

## Notas técnicas de Claude

- Cómo llega al centro: los datos del tipo, la guía y las plantillas viajan con la app (como
  `datos-biblioteca/` y `plantillas/`) y una puesta al día de una sola vez, al entrar, los fusiona en
  `_GESTOR` con las mismas reglas de `js/cargar-biblioteca.js` (fusiona, no pisa) y las listas
  comunes de tareas e hitos (fila 531): tareas e hitos nuevos se crean en la lista común; si ya hay
  uno igual por nombre, se reutiliza. Respeta `SoloConsulta.activo()` y la cola de guardado.
- El cambio de nombre del tipo, con `TiposNombre` (fila 126) y el nombre de antes en `alias`, para que
  las carpetas y asuntos de «BAJA» sigan casando. Lo que hoy cuelga de «BAJA» (guía, campos,
  plantillas, recurrentes) se mueve al nombre nuevo. La guía genérica de «BAJA» se sustituye; la
  plantilla «Comunicación de baja» (`plantillas/comunicacion-baja.md`) se deja como estaba.
- Si en el centro «BAJA» está desactivado (tema 540), la puesta al día lo vuelve a activar: es el
  tipo de esta guía.
- Los campos, por la lista única de campos (fila 528), con grupo «Alumnado» y origen manual. «Motivo
  de la baja» con «se pide al crear» (fila 530, punto 8).
- Condiciones con `{si:Campo=Valor}` (fila 510) en Word y correo; «Solo si» de hitos y tareas, fila
  576. Los nombres de los campos variables de los textos se ajustan a los que ya existen
  (`CamposLista.reunir`); para NIE escolar, fecha de nacimiento y tutores legales, los que ya usan
  otras plantillas de alumnado; si no existe alguno, se crea en la lista única.
- Los Word se construyen con el mismo aspecto que las demás resoluciones de `plantillas/` (membrete,
  firma), no con el del Word del 4-nov.
- Destinatarios del correo por papeles (tema 487): familia → tutores legales; Servicios Sociales →
  relacionados del asunto.
- «Campos del asunto»: es el límite apuntado al cerrar la fila 576.

## Cómo lo comprueba el segundo revisor

- En la demo, el tipo se llama «BAJA MATRICULA» y un asunto viejo de «BAJA» sigue abriéndose como de
  ese tipo, con su carpeta de siempre.
- «Nuevo asunto» con un alumno y BAJA MATRICULA pide «Motivo de la baja», con la opción «Traslado al
  extranjero».
- El asunto creado tiene los seis hitos, con las tareas de la lista de arriba y en ese orden.
- Con el motivo vacío, los hitos 1 y 2 salen en amarillo con «Falta: Motivo de la baja».
- «Pedir datos» del hito 1 pide los cinco datos y los guarda en el asunto.
- La resolución generada con protocolo «Sí», declaración de la familia y matrícula «Sí» lleva el
  Tercero del «Sí», el Cuarto del anexo I y la frase del certificado; con «No», diligencia y «No»,
  los otros.
- La resolución lleva todos los textos de `docs/592-TEXTOS-BAJA-MATRICULA.md`, sin `{si:` ni `{{`
  sueltos.
- El anexo I y el anexo II se pueden generar desde el asunto, con nombre, curso y año del alumno
  rellenos y las líneas en blanco sin pedir nada.
- La tarea «Comunicar a Servicios Sociales» sale solo con protocolo «Sí».
- El correo a la familia propone a los tutores legales y cambia según protocolo y matrícula.
- En «Campos del asunto», un dato de lista vacío sale y se puede rellenar ahí.
- Al entrar dos veces, no se duplica nada (tipo, datos, tareas, hitos ni plantillas).

## Qué mirar al terminar

- Abre «Nuevo asunto», elige un alumno y BAJA MATRICULA: mira que pide el motivo.
- Crea el asunto y mira los seis hitos y sus tareas.
- Rellena los datos en el hito 1 y genera la resolución: léela entera.
- Cambia el protocolo a «No» y vuelve a generarla: mira el Tercero.
- Abre un asunto viejo de «BAJA»: mira que sigue igual.

## Revisión y respuestas durante el trabajo

- 11-nov-2026, 1.ª vuelta del segundo revisor (otro ayudante, sin ver el código; en la pantalla de prueba `?demo=1&auto=1&baja=1`):
  - Tipo, «Nuevo asunto» con el motivo, seis hitos con sus tareas y el «Falta: Motivo de la baja», «Pedir datos» con los cinco datos, Servicios Sociales solo con protocolo «Sí», «Campos del asunto» con desplegable, y que no se duplica nada: **coincide**.
  - Resolución leída entera en cuatro combinaciones: Tercero, Cuarto y frase del certificado **coinciden**, sin `{si:` ni `{{` sueltos. Anexos I y II con nombre, curso y año rellenos: **coinciden**.
  - **No coincidía** (corregido): el asunto de antes de «BAJA» recibía los seis hitos nuevos al abrir su ficha (9 hitos). Ahora se apuntan como ya conocidos y sigue con los suyos.
  - **No coincidía** (corregido): el correo a la familia salía sin nadie en «Para» y el de Servicios Sociales con el saludo «Estimados tutores legales». Ahora la familia propone a los tutores legales y Servicios Sociales a los relacionados, con saludo «Estimados señores:» (el saludo no estaba en el texto acordado: se pone solo para no decir «tutores» a Servicios Sociales).
  - **Hace sin que el texto lo pida** (se deja y se avisa): «Nuevo asunto» trae también «Curso» y «Fecha de nacimiento» ya rellenos con los del alumno (la resolución los necesita); en los correos no sale la línea «Asunto:» de los textos porque las plantillas de correo no tienen ese campo; cuando faltan datos la app cambia «alumno/a» por «alumna» y «el/la director/a» por «la directora» (comportamiento de siempre de la app); la ventana «Faltan datos» pide también tutores y provincia, que están en el texto acordado.
  - **No lo he podido ver**: el correo con tutor que tiene correo (en la demo no lo tienen); «entrar dos veces» con datos guardados de verdad (la demo se rehace en cada carga; la prueba automática comprueba que la pasada forzada no duplica); el tipo con un alumno de Bachillerato (la resolución es de ESO y no avisa; no se pidió).
