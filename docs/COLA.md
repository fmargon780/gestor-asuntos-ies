# Cola de instrucciones para Claude Code

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

> **18-sep-2026: esta cola se ha compactado.** Había llegado a 90 KB, casi todo notas largas de
> filas ya HECHAS, y ningún cambio cabía ya en una sola subida (regla 12). Ahora la tabla guarda
> solo número, documento y estado. El detalle de cada fila hecha sigue en `docs/HISTORIA.md` y en
> el historial de git (versión anterior: el commit anterior a este en `docs/COLA.md`). **Manténla
> así**: las notas largas van a `docs/HISTORIA.md`, no aquí.

## Reglas para Claude Code

1. Lee antes `docs/CONTEXTO.md`.
2. Coge la primera instrucción con estado **PENDIENTE**, leyendo la tabla **de arriba abajo**. Ojo:
   desde el 18-sep-2026 la tabla está en orden de trabajo, no de número, así que la primera
   PENDIENTE no tiene por qué ser la del número más bajo. Cámbiala a **EN CURSO** con la fecha y
   sube ese cambio en el primer commit del trabajo. Así, si otra sesión abre esta cola, sabe que
   ya hay alguien con ella y no la repite.
3. Antes de empezar una instrucción, comprueba si ya está hecha por otro camino (mira si existen
   los ficheros o funciones que pide). Si ya está hecha, márcala **HECHA** con una nota y pasa a
   la siguiente.
4. Al terminar una, márcala **HECHA** con la fecha, y sigue con la siguiente PENDIENTE. No pares
   hasta que no quede ninguna. **La hora de `App.VERSION` sale del reloj de verdad**
   (`TZ='Europe/Madrid' date`, receta exacta en `js/version.js`), nunca a ojo: el 17-sep-2026
   salieron versiones con horas por delante de la real.
5. Si una instrucción no puede completarse, márcala **BLOQUEADA** con el motivo en una línea y
   sigue con la siguiente. Nunca dejes el repositorio con las pruebas en rojo.
6. Si encuentras una instrucción **EN CURSO** de otra sesión y no eres tú quien la empezó,
   sáltala y coge la siguiente PENDIENTE.
7. No preguntes nada a Francisco. Al final, un mensaje corto: qué instrucciones has hecho, la
   versión publicada, y qué va a ver distinto en pantalla.
8. Al terminar cualquier instrucción: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`
   **sustituyendo la línea vieja, no añadiendo una debajo**. Si algo deja de ser verdad, se borra.
9. Añade a `docs/HISTORIA.md` lo que merezca recordarse, con su fecha. No dejes que
   `docs/CONTEXTO-CORTO.md` pase de 160 líneas.
10. **Antes de subir nada, vuelve a bajar `main`.** Marcar la fila EN CURSO no basta: otra sesión
    puede haber fusionado su trabajo mientras tanto, y subir ficheros enteros sin releer pisa lo
    suyo. Pasó el 16-sep-2026 con las filas 13 y 14, y el 17-sep-2026 con la fila 38 y con
    `vercel.json` en la fila 48. **Vuelve a bajar `main` justo antes de cada llamada que suba un
    fichero, no una sola vez al empezar el cierre.**
11. **Nunca subas un fichero con un texto de relleno en vez de su contenido.** Si no tienes el
    contenido entero delante, no lo subas: bájalo antes. El 17-sep-2026 `docs/CONTEXTO.md` se
    quedó en `main` con la palabra `PLACEHOLDER_WILL_REPLACE` y nada más, y hubo que recuperarlo
    del historial de git. Después de subir, vuelve a bajar lo subido y compruébalo.
12. **Algunas sesiones no pueden subir un fichero de más de unos 45-50 KB de una sola vez**: la
    llamada que sube el contenido se corta sola sin avisar de ningún error, y el fichero queda en
    `main` con solo el primer trozo. Pasó el 17-sep-2026 con `docs/HISTORIA.md`. **Antes de subir
    un fichero grande** (`docs/CONTEXTO.md`, `docs/HISTORIA.md`), compruébalo después de subirlo
    (`get_file_contents` o `git show origin/main:<ruta>`) y compara el tamaño con el de antes: si
    ha quedado más corto de lo esperado, esa sesión no puede con ese fichero de una vez, y hay que
    dejarlo apuntado aquí en vez de reintentarlo mil veces.
13. **Como máximo dos subidas por fila.** Cada push que llega a GitHub le cuesta una publicación
    a Vercel, y el plan gratuito solo da 100 al día: el 17-sep-2026 se agotaron y la web se quedó
    sin actualizar hasta el día siguiente. Una subida para marcar la fila **EN CURSO** (regla 2) y
    una sola al terminar, con el código, las pruebas, `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`,
    `docs/CONTEXTO.md` y `docs/HISTORIA.md` en el mismo commit. Nada de un commit por fichero, ni
    de "completa el commit anterior": se prepara todo y se sube una vez. Ver
    `docs/NO-GASTAR-PUBLICACIONES.md`.
14. **Nunca uses `$(cat fichero)` ni ninguna sustitución de shell como valor de `content` al
    subir un fichero: el servidor no lo ejecuta, lo sube tal cual, como texto literal.** El
    17-sep-2026 esto dejó `docs/COLA.md` en 35 bytes con el comando sin ejecutar. El contenido
    tiene que ir escrito entero, de verdad, en el propio parámetro.

## Reglas para Francisco

- Mientras Claude Code está trabajando, **no se lanza otra vez**. Las instrucciones nuevas se
  apuntan aquí y esperan.
- Cuando Claude Code termina, se vuelve a pegar la misma línea. Si no queda nada pendiente,
  Claude Code lo dice y no toca nada.

## La línea para lanzar

    Lee docs/CONTEXTO.md y después docs/COLA.md. Haz en orden todo lo que esté PENDIENTE, siguiendo las reglas de la cola, sin preguntarme nada. Al terminar, dime en pocas frases qué has hecho, qué versión está publicada y qué voy a ver distinto en pantalla.

## La cola

| Nº | Instrucción | Estado |
|---|---|---|
| 1 | `docs/PLAN-ROBUSTEZ-2026-09.md` | HECHA |
| 2 | `docs/REGISTRO-EN-UN-PASO.md` | HECHA |
| 3 | `docs/CAMPOS-POR-TIPO.md` | HECHA |
| 4 | `docs/TERCEROS-RELACIONADOS.md` | HECHA |
| 5 | `docs/NO-DUPLICAR-ASUNTOS.md` | HECHA |
| 6 | `docs/AJUSTES-AGIL.md` | HECHA |
| 7 | `docs/PAPELERA.md` | HECHA |
| 8 | `docs/UNIR-VER-DENTRO.md` | HECHA |
| 9 | `docs/REPARTO-CONTEXTO.md` | HECHA |
| 10 | `docs/ARREGLOS-USO-2026-09-14.md` | HECHA |
| 11 | `docs/CORREOS-AL-ASUNTO.md` | HECHA |
| 12 | `docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md` | HECHA |
| 13 | `docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md` | HECHA |
| 14 | `docs/PLANTILLAS-DE-CORREO.md` | HECHA |
| 15 | `docs/HITOS.md` | HECHA |
| 16 | `docs/QUE-ME-TOCA.md` | HECHA |
| 17 | `docs/PLANTILLAS-DE-DOCUMENTO.md` | HECHA |
| 18 | `docs/CORREO-EN-DOS-BUZONES.md` | HECHA |
| 19 | `docs/CSV-DEL-DOCUMENTO.md` | HECHA |
| 20 | `docs/REGISTRO-SIN-DUPLICAR.md` | HECHA |
| 21 | `docs/GRUPOS-DE-PERSONAS.md` | HECHA |
| 22 | `docs/SEPARAR-Y-UNIR-PDF.md` | HECHA |
| 23 | `docs/REFRESCO-DE-PANTALLA.md` | HECHA |
| 24 | `docs/NO-PISARSE-EN-UN-ASUNTO.md` | HECHA |
| 25 | `docs/POR-CLASIFICAR-DOCUMENTO-A-LA-VISTA.md` | HECHA |
| 26 | `docs/HITOS-SON-LA-GUIA.md` | HECHA |
| 27 | `docs/CORREOS-DENTRO-DE-POR-CLASIFICAR.md` | HECHA |
| 28 | `docs/LO-PIDE.md` | HECHA |
| 29 | `docs/DNI-DEL-PERSONAL.md` | HECHA |
| 30 | `docs/QUEDARSE-EN-EL-ASUNTO.md` | HECHA |
| 31 | `docs/APUNTAR-DOCUMENTO-A-HITO.md` | HECHA |
| 32 | `docs/ARCHIVAR-CARPETA-YA-EXISTE.md` | HECHA |
| 33 | `docs/TABLON-NO-SE-BORRA.md` | HECHA |
| 34 | `docs/NOTAS-DEL-ASUNTO-NO-SE-BORRAN.md` | HECHA |
| 35 | `docs/HUECOS-INSERTAR.md` | HECHA |
| 36 | `docs/FILAS-QUE-NO-SE-ESTRUJAN.md` | HECHA |
| 37 | `docs/FICHA-DEL-ASUNTO-NUEVA.md` | HECHA (17-sep-2026) |
| 38 | `docs/LO-PIDE-NOMBRE-DEL-TUTOR.md` | HECHA (17-sep-2026) |
| 39 | `docs/AJUSTES-POR-TIPO.md` | HECHA (17-sep-2026) |
| 40 | `docs/SALTAR-A-OTRO-ASUNTO.md` | HECHA (17-sep-2026) |
| 41 | `docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md` | HECHA (17-sep-2026) |
| 42 | `docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md` | HECHA (17-sep-2026) |
| 43 | `docs/REPASO-DE-LA-COLA-2026-09-17.md` | HECHA (17-sep-2026) |
| 44 | `docs/BUSCADOR-ARCHIVO-INDICE.md` | HECHA (17-sep-2026) |
| 45 | `docs/ARCHIVAR-ATASCOS.md` | HECHA (17-sep-2026) |
| 46 | `docs/CABECERA-QUE-SE-QUEDA.md` | HECHA (18-sep-2026) |
| 47 | `docs/DESTINATARIOS-EN-SENECA.md` | HECHA (17-sep-2026) |
| 48 | `docs/NO-GASTAR-PUBLICACIONES.md` | HECHA (17-sep-2026) |
| 49 | `docs/ADJUNTOS-DE-CORREO-POR-DENTRO.md` | HECHA (18-sep-2026) |
| 50 | `docs/CABECERA-NO-TIEMBLA.md` | HECHA (18-sep-2026) |
| 51 | `docs/FICHA-DISPOSICION.md` | HECHA (18-sep-2026) |
| 52 | `docs/CABECERA-DEL-ASUNTO.md` | HECHA (18-sep-2026) |
| 53 | `docs/SENECA-CUADRO-ANCHO.md` | HECHA (18-sep-2026 · 07:22) |
| 54 | `docs/AYUDANTE-SENECA-FIABLE.md` | HECHA (18-sep-2026 · 07:22) |
| 55 | `docs/ASUNTO-SIN-ELECCION.md` | HECHA (18-sep-2026 · 07:22) |
| 56 | `docs/CAMPOS-CATALOGO-Y-CALCULADOS.md` | HECHA (18-sep-2026 · 07:22) |
| 57 | `docs/HUECO-PARA-SELLO-Y-FIRMA.md` | HECHA (18-sep-2026 · 09:46) |
| 58 | `docs/AJUSTES-DE-USO-2026-09-18.md` | HECHA (18-sep-2026 · 19:26) |
| 59 | `docs/REQUISITOS-DE-HITO.md` | HECHA (18-sep-2026 · 20:04) |
| 60 | `docs/COMUNICAR-DESDE-EL-HITO.md` | HECHA (18-sep-2026 · 20:36) |
| 61 | `docs/GUARDAR-SIN-PISAR.md` | HECHA (19-sep-2026) |
| 62 | `docs/RENOMBRAR-SIN-PERDER-HITOS.md` | HECHA (19-sep-2026) |
| 65 | `docs/DOCUMENTOS-QUE-QUEPAN.md` | HECHA (19-sep-2026) |
| 63 | `docs/PUBLICAR-SOLO-LA-APP.md` | BLOQUEADA (19-sep-2026): sin salida a internet desde esta sesión |
| 64 | `docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md` | HECHA (19-sep-2026) |
| 66 | `docs/CONTACTO-GUARDADO-EN-LA-FICHA.md` | HECHA (19-sep-2026) |
| 67 | `docs/LAS-CUENTAS-Y-LOS-DATOS.md` | HECHA (19-sep-2026) |
| 68 | `docs/AVISOS-QUE-FALTAN.md` | HECHA (19-sep-2026): partes 1 y 3 hechas; falta si la papelera debe vaciarse sola (decisión de Francisco, sin preguntar) |
| 69 | `docs/PRUEBAS-QUE-FALTAN.md` | HECHA (19-sep-2026) |
| 70 | `docs/ENVOLTURAS-COMPROBADAS.md` | HECHA (19-sep-2026) |
| 71 | `docs/COSAS-REPETIDAS.md` | HECHA (19-sep-2026) |
| 72 | `docs/DETALLES-DE-MANTENIMIENTO.md` | HECHA (19-sep-2026): puntos 2, 4 y 5. Los puntos 1 y 3 se complicaron y pasan a las filas 76 y 77 (regla del propio documento: "si alguna se complica, se deja para otra fila") |
| 73 | `docs/BUSCAR-EN-LAS-NOTAS.md` | HECHA (19-sep-2026) |
| 74 | `docs/CUENTAS-DE-FIN-DE-CURSO.md` | HECHA (19-sep-2026) |
| 75 | `docs/HUECOS-ENCONTRADOS-FILA-69.md` | HECHA (19-sep-2026 · 15:55): muchas más subidas de las debidas, y hubo que corregir erratas (nota más abajo) |
| 76 | `docs/DETALLES-DE-MANTENIMIENTO.md`, punto 1 (la versión, sacada del reloj) | BLOQUEADA (20-sep-2026): riesgo real de bucle de commits o de publicaciones de Vercel duplicadas si el paso automático falla, y no hay forma de probarlo a fondo sin que Francisco mire el panel de Vercel. Ya lo avisaba el propio `docs/DETALLES-DE-MANTENIMIENTO.md`, punto 1, cuando se separó de la fila 72: mejor dejarlo pendiente que arriesgar la cuota o la publicación entera sin nadie delante. |
| 77 | `docs/DETALLES-DE-MANTENIMIENTO.md`, punto 3 (los borrados que se fusionen) | EN CURSO (20-sep-2026) |
| 78 | Repartir `docs/contexto/ASUNTOS.md` (ha pasado los 40 KB del objetivo de la fila 65) | PENDIENTE (no urgente: se puede seguir editando, solo cuesta un poco más) |

**Orden de trabajo:** las filas 1 a 74 están HECHAS (las del informe crítico del 18-sep-2026,
`docs/INFORME-CRITICO-2026-09-18.md`, que Francisco pidió tener todas desarrolladas antes de
seguir añadiendo cosas nuevas). Las PENDIENTES que quedan (75 a 78) son huecos pequeños que
salieron por el camino, todas marcadas "no urgente": no hace falta encadenarlas sin parar, se
cogen cuando toque.

**El orden de trabajo NO es el de los números.** La tabla de arriba está puesta **en el orden en que
hay que hacerlas**, de arriba abajo, y por eso la 65 aparece entre la 62 y la 63. Los números no se
han cambiado porque los catorce documentos y el informe se citan entre sí por número. Coge siempre
la primera PENDIENTE **de arriba abajo en la tabla**, no la del número más bajo.

El orden, escrito otra vez para que no haya duda:

    61 · 62 · 65 · 63 · 64 · 66 · 67 · 68 · 69 · 70 · 71 · 72 · 73 · 74

Por qué está así:

- La **61** y la **62** van primero de todo, sean cuales sean las prisas: son los dos fallos que
  pueden costar datos mientras tanto.
- La **65** va la tercera (18-sep-2026, decidido con Francisco al preparar la cola para sesiones con
  un modelo más pequeño). Parte `docs/CONTEXTO.md` y corta `docs/HISTORIA.md`, y hasta que eso esté
  hecho **cada fila siguiente arrastra medio megabyte de documentación** que hay que leer y
  reescribir. Hacerla pronto abarata y hace más seguras las once que vienen detrás. Además cambia
  las reglas 8 y 13: **a partir de la 65, la documentación puede ir en una subida aparte**, y son
  tres subidas por fila en vez de dos.
- La **68** (la parte de fichas huérfanas), la **73** y la **74** van **después de la 64**, porque
  las tres dependen de dónde viva la ficha de un asunto archivado. Cada documento lo explica.
- La **71** es la menos urgente de todas. Si otra fila ya está tocando esos ficheros, se aprovecha;
  si no, se queda donde está.

**Ninguna de estas catorce se sube junto con otra.** Cada una, su subida.

**Aviso sobre la 64:** es la más delicada de las catorce. Toca ocho ficheros, hay que revisar a mano
cada sitio que lee la ficha de un asunto archivado, y si sale mal, sale mal en los datos.
**Conviene hacerla en una sesión con el modelo grande**, no con uno pequeño. Si la sesión que llegue
a ella no lo es, mejor saltarla, seguir con la 66 y dejar la 64 apuntada.

### Las catorce, en una línea cada una

(Aquí van por número, para poder buscarlas. **El orden de trabajo es el de la tabla de arriba.**)

**61 · Guardar sin pisar al compañero.** Mandar un asunto a la papelera y devolverlo son los dos
únicos sitios que escriben `asuntos.json` entero sin releerlo antes; con la copia en memoria vieja
se puede borrar una mañana de trabajo del compañero, sin aviso. Se arreglan los dos y se cierra la
puerta con una función única de guardado fresco. **Medio día. GRAVE, va primero.**

**62 · Renombrar un asunto sin perder sus hitos.** `hitos.json` se indexa por el nombre de la
carpeta y no viaja cuando el nombre cambia; los hitos se recrean desde la guía y la pérdida es
silenciosa (fechas, responsables, historial, documentos apuntados, lo reunido). Un solo sitio que
renombre, y que pasen por él los cuatro caminos. **Un día. GRAVE.**

**63 · Publicar solo la aplicación.** Vercel publica el repositorio entero, `docs/` incluida.
Primero comprobarlo con `curl`; si se confirma, un `.vercelignore`. **Medio día.**

**64 · La ficha de un asunto archivado, en su propia carpeta.** `asuntos.json` no se limpia nunca y
se reescribe entero 50-150 veces al día: 0,6 MB hoy, 9 MB en tres cursos. Se copia el patrón que ya
funciona con el historial de hitos al archivar. **De dos a cuatro días. Es la fila que más rinde, y
conviene hacerla antes de que el fichero pase de 3 MB.**

**65 · Documentos que quepan en una subida.** `CONTEXTO.md` (244 KB) e `HISTORIA.md` (226 KB) ya no
caben, y de ahí salieron las tres averías de ficheros del 17-sep. Se parte el primero por módulos,
se corta el segundo por fecha, y se cambian las reglas 8 y 13 para que la documentación pueda ir en
una subida aparte. **Medio día.**

**66 · El contacto del tercero, guardado en la ficha.** En septiembre de 2027 el alumnado que se va
desaparece del RegAlum y sus asuntos abiertos se quedan sin teléfono, correo ni tutores. Se guarda
una foto del contacto al crear el asunto, y se usa solo si el CSV ya no trae a la persona. **Un
día, y hay que pulsar su botón de relleno antes de que acabe este curso.**

**67 · Las cuentas y los datos, por escrito.** Dos papeles, sin código: uno para el relevo (dónde
vive cada cosa y cómo se publica) y otro para dirección (qué datos personales crea la aplicación,
qué sale del centro y cuánto se guarda). Y poner a una segunda persona como colaboradora del
repositorio. **Una hora.**

**68 · Los avisos que faltan.** Las fichas huérfanas no avisan, los asuntos dormidos no salen por
ningún lado, y la papelera no insiste. **Un día.**

**69 · Las pruebas que faltan.** No hay ninguna que edite el nombre de un asunto, que una dos
asuntos ni que toque los recurrentes; nada prueba Dropbox de verdad y nadie prueba el script de
Google. Se escriben las que faltan y se deja una lista de lo que solo puede comprobar Francisco a
mano. **Un día.**

**70 · Las envolturas, comprobadas al arrancar.** De 17 sitios el 11-sep a 38 hoy, en 23 ficheros,
con 103 `<script>` en orden fijo y fallos silenciosos. No se reescribe nada (sigue descartado): se
apuntan, y si al arrancar falta alguna, se avisa. **Un día.**

**71 · Las cosas repetidas, a la caja común.** 12 formas de copiar al portapapeles, 5 de inventar un
identificador, 4 de escribir una fecha corta. **Medio día. La menos urgente.**

**72 · Cinco detalles de mantenimiento.** La versión sacada del reloj y no a mano; el nombre de
usuario de una lista; que los borrados de tipos y estados se fusionen entre ordenadores; caducidad
en las copias de seguridad; y mirar si pdf.js (congelado en una versión de 2023) tiene avisos de
seguridad. **Un día los cinco, independientes.**

**73 · Buscar dentro de las notas.** Hoy se busca por nombre, documentos y registro, pero no por lo
escrito en las notas, que es donde está la memoria de cada gestión. **Un día, mejor después de la
64.**

**74 · Cuentas por tipo, para la memoria de fin de curso.** Una pantalla que cuente asuntos por
tipo, por mes y por quién los pidió, sacándolo del índice del ARCHIVO, con un botón para copiar la
tabla. **Dos días, antes de junio de 2027.**

**Fila 58, en una línea** (18-sep-2026, acordada con Francisco tras usar la aplicación con trabajo
real): seis arreglos de uso diario, independientes entre sí. (1) Cuatro botones de copiar siempre
visibles bajo el nombre del asunto —Asunto, Nombre (`Apellido1 Apellido2, Nombre`), NIE y DNI o
CIF—, fuera del menú de tres puntos. (2) "Preparar el documento" pasa a llamarse **Ajustar
tamaño**. (3) Las notas dejan de guardarse solas mientras se escribe: solo al pulsar Guardar o al
salir del recuadro, con aviso si se sale con texto sin guardar. (4) Al registrar, el original sin
sellar ya no va a la papelera: se queda en la carpeta con `SIN SELLAR` al final del nombre. (5) El
cuadro de Correo se rehace como el de Séneca (ancho hasta 1100 px, dos columnas, cabecera y
botones fijos) para que se vea la lista de documentos del asunto que ya existe y hoy queda fuera de
pantalla. (6) Asociar un documento a un hito también desde la lista de documentos, y cada hito
enseña debajo los suyos. Detalle en `docs/AJUSTES-DE-USO-2026-09-18.md`. Sube directamente a
`main`, sin petición de cambios.

**Fila 59, en una línea** (18-sep-2026, acordada con Francisco): cada paso del trámite de un tipo
puede llevar una lista de **lo que hay que reunir**, y esa lista llega a su hito como casillas.
Cada casilla es un documento o un dato, y puede ser obligatoria. La del documento se marca sola al
apuntar ese documento al hito; la del dato se marca a mano y deja escribir el valor. Si al dar un
hito por hecho quedan obligatorias sin marcar, avisa (no lo impide) y deja nota. Botón **Pedir lo
que falta** en el hito: mete las casillas sin marcar como lista dentro del correo o del mensaje de
Séneca, con un hueco nuevo `{{LO QUE FALTA}}`. Ficheros nuevos: `js/hitos-requisitos.js`,
`js/guias-requisitos.js`, `pruebas/requisitos-de-hito.mjs`. Detalle en
`docs/REQUISITOS-DE-HITO.md`. Sube directamente a `main`, sin petición de cambios.

**Fila 60, en una línea** (18-sep-2026, acordada con Francisco): cada paso del trámite puede llevar
**su propio texto de comunicación**, de correo y de Séneca, escrito en la pantalla del tipo; el hito
enseña entonces un botón **Comunicar** que abre el cuadro de siempre ya relleno, con el destinatario
propuesto por el responsable del hito (tercero, tutor o relacionado; si es alguien del centro, el
tercero del asunto). Al preparar el mensaje queda una línea en el historial del hito y una nota en
el asunto, una sola vez. La plantilla general del tipo no se toca. Ficheros nuevos:
`js/guias-comunicacion.js`, `js/hitos-comunicar.js`, `pruebas/comunicar-desde-hito.mjs`. Detalle en
`docs/COMUNICAR-DESDE-EL-HITO.md`. Sube directamente a `main`, sin petición de cambios.

**Fila 52, en una línea** (18-sep-2026, acordada con Francisco mirando la cabecera de un asunto de
CERT. MATRICULA): los doce botones de la cabecera se agrupan por el momento del trámite en que se
usan y bajan a cinco. Detalle en `docs/CABECERA-DEL-ASUNTO.md`.

**Fila 53, en una línea** (18-sep-2026, HECHA): el cuadro de Mensaje de Séneca se rehizo para que
se vea entero. Todo lo de Séneca salió de `js/correo.js` (38 KB) a `js/seneca-cuadro.js` +
`css/seneca.css`; el cuadro ocupa el ancho (hasta 1100 px) en dos columnas a partir de 900 px, con
destinatarios y asunto a la izquierda y el texto del mensaje a la derecha; el asunto es ahora un
`<textarea>` que crece, con su cuenta de caracteres; sin plantilla de Séneca para el tipo, un aviso
en vez del hueco vacío; dos botones numerados ("1. Copiar el asunto" y "2. Copiar el texto") en vez
del botón único que cambiaba de significado; y la explicación del ayudante se pliega en un
`<details>`. Ningún cambio de funcionamiento. Lo compartido con Correo se expone en
`window.CorreoNucleo`. Detalle en `docs/SENECA-CUADRO-ANCHO.md`; diario en `docs/HISTORIA.md`.
Comprobado con `pruebas/seneca-cuadro-ancho.mjs`.

**Fila 54, en una línea** (18-sep-2026, HECHA): el ayudante de `js/seneca-ayudante.js` ya no fía
todo a un reloj fijo de 1400 ms. Ahora espera a que aparezca la sugerencia de Séneca (hasta 5 s,
mirando cada 150 ms, también en `iframe`), separa la flecha abajo del Intro con 350 ms, comprueba
hasta 2,5 s que el campo se ha vaciado de verdad, reintenta una vez más despacio (7 s) si no, y al
terminar con fallos dice por su nombre quién no ha entrado, con un botón "Copiar los que faltan".
Solo se tocó `js/seneca-ayudante.js`. Detalle en `docs/AYUDANTE-SENECA-FIABLE.md`. Comprobado con
`pruebas/seneca-ayudante.mjs` (sin navegador: no se puede probar contra Séneca de verdad desde
aquí, eso lo comprueba Francisco).

**Fila 55, en una línea** (18-sep-2026, HECHA): desaparecieron los dos botones "Nombre de la
carpeta" / "Versión legible" de debajo del campo Asunto, en Correo y en Séneca. El asunto del
mensaje es siempre el nombre de la carpeta (`asuntoDelCorreo(a)`, ya sin el parámetro `largo`); el
campo se sigue viendo y editando a mano. Detalle en `docs/ASUNTO-SIN-ELECCION.md`. Comprobado con
`pruebas/asunto-sin-eleccion.mjs`.

**Fila 56, en una línea** (18-sep-2026, HECHA): la sección Campos de la pantalla de un tipo ya no
enseña el catálogo entero desplegado. Se queda con los campos puestos y un botón "+ Añadir campo"
que abre un panel de tres pestañas (De la ficha · Míos · Calculados) en `js/campos-catalogo.js`
(nuevo, dentro de la propia sección, no un cuadro emergente). Francisco puede crear campos
calculados (`js/campos-calculo.js`, el motor; `js/campos-calculados-editor.js`, el formulario con
vista previa) con seis operaciones, encadenables hasta 3 saltos. El calculado "Curso" pasa a ser
una receta más en `campos.json`, migrada sola la primera vez que se lee el fichero si ya existía,
con la función de siempre como respaldo mientras tanto. Si se añaden campos sin guardar, la
pantalla avisa al salir. Detalle en `docs/CAMPOS-CATALOGO-Y-CALCULADOS.md`; lo que costó de más
(bugs cazados por las propias pruebas, antes de subir) en `docs/HISTORIA.md`. **La prueba del
motor se guardó como `pruebas/campos-calculo.mjs`, no `campos-calculo.test.js`** como decía el
encargo: `pruebas/ejecutar.mjs` solo recoge ficheros `*.mjs`, así que con ese nombre no se habría
ejecutado nunca con `npm test`. Comprobado también con `pruebas/campos-catalogo.mjs`, y con
`pruebas/campos.mjs` y `pruebas/ajustes-por-tipo.mjs` (actualizadas al panel nuevo).

**Fila 57, en una línea** (18-sep-2026, HECHA): botón nuevo **Preparar el documento**, junto a
Separar, Unir y Sacar páginas (en la ficha de un asunto y en Por clasificar), que encoge todas las
páginas de un PDF para dejar libre la banda del sello de registro de Séneca (arriba) y la de la
firma del director (abajo), de lado a lado de la hoja. Nunca agranda, nunca cambia el tamaño de la
hoja, respeta las páginas giradas, y si ya hay sitio no toca nada (lo comprueba pintando cada
página con pdf.js y mirando los píxeles de las dos bandas). Si el PDF ya está firmado
digitalmente, pregunta antes de seguir. Las dos medidas (1,5 cm arriba, 2,5 cm abajo por defecto)
se configuran en Ajustes → El centro; cada tipo de asunto dice si lleva sello y si lleva firma, en
su propia pantalla. Ficheros nuevos: `js/pdf-margenes.js` (la cuenta y el PDF nuevo, con pdf-lib,
sin DOM, como `js/pdf-herramientas.js`), `js/preparar-documento.js` (el cuadro) y
`pruebas/margenes-pdf.mjs`. Detalle en `docs/HUECO-PARA-SELLO-Y-FIRMA.md`; diario en
`docs/HISTORIA.md`. Sesión en la nube: subido con pull request, no directo a `main` (ver la nota
de más abajo). **Su botón se llama "Ajustar tamaño" desde la fila 58.**

## Nota de esta sesión (18-sep-2026, mañana): docs/CONTEXTO.md y docs/HISTORIA.md sin actualizar

El código, las pruebas y `docs/CONTEXTO-CORTO.md` de las filas 53-56 ya están en `main` y
comprobados en producción (`App.VERSION = '18-sep-2026 · 07:54'`, `js/campos-catalogo.js` y
`js/campos-calculados-editor.js` responden 200 en `https://gestor-de-asuntos.vercel.app`). Pero
esta sesión **no ha podido subir** `docs/CONTEXTO.md` (225 KB) ni `docs/HISTORIA.md` (217 KB) con
las secciones de esas filas: son demasiado grandes para volver a escribirlos enteros a mano dentro
de una sola llamada sin riesgo de un error de transcripción (regla 12 de más arriba, llevada al
límite: aquí no se trata de que la subida se corte sola, sino de que retipear 225 KB o 217 KB de
un tirón, sin `git push` disponible en esta sesión —el proxy de git rechaza este repositorio desde
`bash`—, es demasiado riesgo para un fichero de referencia). Se ha preferido dejarlo apuntado aquí,
como pide la regla 12, en vez de forzarlo.

**Qué le falta a `docs/CONTEXTO.md`**: la sección "El correo y la mensajería de Séneca" con el
cuadro de Séneca en dos columnas (fila 53), el ayudante fiable (fila 54) y el asunto sin elección
(fila 55); la sección "Los campos de cada tipo de asunto" con el panel de tres pestañas y los
campos calculados (fila 56); las filas correspondientes de "Ficheros del repositorio"
(`js/seneca-cuadro.js`, `css/seneca.css`, `js/campos-calculo.js`, `js/campos-catalogo.js`,
`js/campos-calculados-editor.js`, `js/ajustes-tipo.js` actualizado).

**Qué le falta a `docs/HISTORIA.md`**: una entrada nueva, fechada 18-sep-2026, "Filas 53 a 56:
Séneca ancho, el ayudante fiable, el asunto sin elección y los campos calculados", con una
subsección "Lo que costó de verdad" documentando los bugs que las propias pruebas cazaron antes de
llegar a producción: `js/campos-calculo.js` usando `window.U`/`window.Nombres` en vez de las
variables sueltas (rompía en el contexto `vm` de las pruebas, donde `window` es un objeto de
mentira aparte, no el global de verdad); un `toLocaleString('es')` que en este entorno de pruebas
no ponía el punto de los millares y hubo que formatear a mano con una expresión regular; la
pestaña Calculados sin enseñar "Curso" antes de guardar nada (había que fusionar también
`Campos.RECETA_CURSO_DE_FABRICA`, no solo `App.E.campos.calculados`); y
`borrarPropio`/`borrarCalculado` guardando de más (persistían de golpe cambios sin guardar del
propio tipo —orden, obligatorio— al borrar un campo propio o calculado usado en otro tipo).

**Para la próxima sesión que la coja**: `docs/CONTEXTO.md` y `docs/HISTORIA.md` en el propio
repositorio (`git clone` o `git pull`) ya tienen, en teoría, el contenido final correcto si se
parte del último commit de código de esta sesión — pero esta sesión trabajó sobre una copia local
del contenedor que puede haberse quedado desincronizada de `main` a medio camino (ver el aviso de
`docs/COLA.md` sobre sesiones en paralelo), así que **no dar nada por hecho: comparar con cuidado**
contra lo que de verdad dice `main` antes de sustituir. Si esa sesión tiene `git push` de verdad
(terminal u ordenador de Francisco, no esta nube), es mucho más simple que ir fichero a fichero con
la API.

## Nota de esta sesión (19-sep-2026): fila 75, muchas más subidas de las debidas, y tres ficheros con erratas que hubo que corregir

La fila 75 no es una de las catorce de la fila 65 (esas sí tienen permitida una tercera subida
para documentación): le tocaban dos subidas, como a cualquier fila normal (regla 13). No fue así.

La segunda subida llevó por error solo `js/version.js`, en vez de los once ficheros previstos: un
fallo al montar la llamada, no un límite de tamaño. Para terminarla se delegó el resto en otra
sesión auxiliar, con instrucciones explícitas de subir los diez ficheros que faltaban en un solo
commit y de comprobar el número de ficheros antes de disparar la llamada. Esa sesión auxiliar
cometió el mismo fallo dos veces más (una llamada con un solo fichero, otra con dos) y acabó
necesitando ocho commits en total para dejar los diez ficheros en `main`. Además, al retipear a
mano el contenido de tres ficheros de documentación, introdujo erratas en los tres:
`docs/COLA.md` (tres sitios), `docs/contexto/ASUNTOS.md` (dos sitios) y `docs/HISTORIA.md` (seis
sitios) — letras y tildes perdidas, y una palabra de más. Los otros siete ficheros (todo el código
y las pruebas) llegaron a `main` byte a byte iguales a lo previsto, comprobado con el hash de git
de cada uno.

Se detectó comparando, fichero a fichero, el contenido subido con el contenido local ya
verificado, y se corrigió con una subida más, solo de esos tres ficheros de documentación, sin
tocar código: no gasta una publicación de Vercel de más porque Vercel solo publica cuando cambia
código de la aplicación, no documentación (ver `docs/NO-GASTAR-PUBLICACIONES.md`).

En total, entre ambas partes, la fila 75 se cerró en muchas más de las dos subidas que marca la
regla 13. Motivo para dejarlo escrito: si una fila de documentación grande vuelve a necesitar
delegarse en una sesión auxiliar, conviene pedirle explícitamente que lea el fichero entero de
origen y lo copie tal cual (o lo suba en trozos verificados), en vez de retipearlo de memoria.

## Lo que queda por hablar con Francisco (no son filas de la cola)

- De la fila 21: departamentos del personal, tutorías y equipos educativos. `personal.csv` no
  guarda nada de eso; hay que ver qué se puede sacar de Séneca antes de diseñar nada.
- De la fila 28: el parentesco de verdad (padre, madre, abuela). El RegAlum no trae esa columna,
  así que se enseña "Tutor legal 1" y "Tutor legal 2".
- De la fila 34, a sabiendas: si la ficha entera se repinta de verdad (llega un documento a la
  carpeta) mientras se escribe una nota **de hito**, esa nota se pierde. La nota del asunto sí
  sobrevive. Arreglarlo pedía memoria propia del panel de hitos, con riesgo de resucitar texto de
  otro asunto, y el caso es raro desde que la ficha casi no se repinta.
- Guardado por si se replantea (17-sep-2026): una base de datos pequeña en internet para que el
  aviso de la fila 24 sea instantáneo en vez de esperar a Dropbox. Descartada ahora. Si se hace,
  solo viajarían el identificador del asunto y el nombre de quien lo abre, nunca el nombre de la
  carpeta ni dato alguno de alumnado o personal, y con servidor en la Unión Europea.
- Cuando los hitos (fila 15) estén en uso: si el estado del asunto desaparece y lo sustituye el
  hito en curso. Lo de que un hito apunte a su plantilla de correo lo resuelve la fila 60; queda
  pendiente lo mismo con la plantilla de documento (fila 17).
- Los nueve asuntos de `docs/PROXIMOS-ASUNTOS.md` (14-sep-2026) están todos metidos en la cola:
  esa lista queda cerrada.
- De la fila 54 (18-sep-2026): para un grupo de destinatarios que se repite todos los meses, lo
  suyo es crearlo una vez en el gestor de contactos del propio Séneca. El ayudante es para listas
  de un día. Si algún día se ve que casi todas las listas son fijas, habrá que replantear si el
  ayudante merece seguir existiendo.
- De la fila 57 (18-sep-2026): hay que comprobar con un documento de verdad qué pasa cuando Séneca
  sella un PDF que ya viene firmado digitalmente. Es posible que el visor avise de que el documento
  se modificó después de firmarse. Eso no depende de la aplicación. Si ocurre, habrá que decidir el
  orden bueno (firmar después de registrar) y dejarlo escrito en la guía del tipo.
- De la fila 57: las medidas de 1,5 cm y 2,5 cm son una estimación. Francisco no tenía la medida
  real de las bandas de Séneca ni de la de AutoFirma. Cuando pruebe el botón con un documento
  registrado de verdad, ajustará las dos medidas en Ajustes → El centro.
- De la fila 59 (18-sep-2026): con el uso se verá si conviene que "Qué me toca" cuente también lo
  que falta por reunir, y si la casilla de un dato debería poder rellenarse sola desde la ficha
  del tercero.
- De la fila 60 (18-sep-2026): con el uso se verá si el historial de comunicaciones conviene verlo
  junto, en un sitio solo del asunto, en vez de repartido hito por hito.
- **Del informe del 18-sep-2026: los tres botones de comunicar.** En la misma ficha hay
  "Comunicar" en la cabecera (plantilla del tipo), "Comunicar" en un hito (texto de ese paso) y
  "Pedir lo que falta" en un hito. Por dentro están bien: los tres abren el mismo cuadro y no hay
  código duplicado. Desde la pantalla, tres botones parecidos van a confundir. **No se toca hasta
  que Francisco haya usado los hitos un mes**: entonces se decide si "Pedir lo que falta" pasa a ser
  una opción dentro de "Comunicar". Por eso no es una fila de la cola.
- **Del informe del 18-sep-2026: la papelera, ¿se vacía sola?** Hoy avisa a los 30 días pero no
  borra nada sin que alguien pulse. Para datos de menores, un borrado que nunca ocurre no es lo
  ideal. **Hay que preguntárselo a Francisco antes de hacer esa parte de la fila 68**, y apuntar lo
  que decida.
- **Del informe del 18-sep-2026: la ficha del asunto.** Se ha rehecho tres veces en cuatro días
  (filas 51, 52 y 58). Va a necesitar una cuarta pasada cuando los hitos lleven un mes en uso. No se
  adelanta nada: se espera al uso real.

## Descartado, no proponer otra vez (del informe del 18-sep-2026)

- **Un servidor.** Ni en internet ni dentro del centro, mientras sean dos o tres personas. En
  internet rompería el límite de no sacar datos personales. Dentro del centro lo respetaría, pero
  cambia "un fichero que crece" por "una máquina que nadie administra en agosto". Además, las cuatro
  cosas que un servidor resolvería —aviso instantáneo, cierre de verdad, buscar sin cargar nada
  entero, copias automáticas— o no son problema hoy, o ya están resueltas (el índice del ARCHIVO,
  las copias diarias), o las arregla la fila 64. **Se replantea solo si algún día entran cinco o
  seis personas de varios departamentos a la vez; y entonces, una máquina en el centro, nunca en la
  nube.**
- **Una base de datos del navegador** en vez de los ficheros del Dropbox. Rompería el modelo: los
  datos vivirían dentro de un ordenador, el compañero no los vería, un borrado de datos del
  navegador se lo llevaría todo, y se perdería lo mejor del diseño de hoy, que es poder abrir la
  carpeta y ver el trabajo sin la aplicación.
- **Guardar los cambios uno detrás de otro** (un registro de apuntes en vez de reescribir el
  fichero). Es la solución correcta para diez personas escribiendo a la vez. Con dos, dos semanas de
  trabajo y fallos que tardan meses en aparecer. La fila 64 da casi el mismo beneficio por mucho
  menos.
- **Un fichero por asunto abierto.** La pantalla de abiertos tendría que abrir cien ficheros
  pequeños en una carpeta de Dropbox, que puede ser más lento que lo de hoy, no menos.

## Nota sobre "sube directamente a main"

Muchas instrucciones piden subir a `main` sin pull request. La sesión de Claude Code "en la nube"
(disparada desde GitHub) tiene forzado lo contrario: rama propia y pull request, sin permiso para
tocar `main`. Mientras se lance así, las filas se suben con pull request. Para volver a "directo a
main", hay que lanzar la cola desde una sesión de Claude Code normal (terminal u ordenador).

**Permiso permanente de Francisco (16-sep-2026): fusionar el pull request lo hace Claude Code
solo**, sin esperar a que Francisco lo haga a mano. Antes de fusionar: `npm test` en verde, el PR
sin conflictos con `main` (`mergeable_state: clean`) y sin ningún comentario de revisión pendiente
de responder. Fusionado eso, Vercel publica solo: comprobar lo publicado con `curl` sigue haciendo
falta después, no antes.

## Cuidado con varias sesiones a la vez

17-sep-2026: con tres sesiones en paralelo tocando esta cola, más de una subida pisó el arreglo de
otra (una fila volvió a PENDIENTE varias veces). Mientras la cola esté muy activa, conviene lanzar
las sesiones de una en una. El detalle de aquel día, y de los ficheros que se rompieron y se
recuperaron (`docs/CONTEXTO.md` con un `PLACEHOLDER`, `docs/HISTORIA.md` truncado a la mitad),
está en `docs/HISTORIA.md`; de ahí salieron las reglas 10, 11, 12 y 14.
