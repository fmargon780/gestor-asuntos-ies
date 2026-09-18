# Cola de instrucciones para Claude Code

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

> **18-sep-2026: esta cola se ha compactado.** Había llegado a 90 KB, casi todo notas largas de
> filas ya HECHAS, y ningún cambio cabía ya en una sola subida (regla 12). Ahora la tabla guarda
> solo número, documento y estado. El detalle de cada fila hecha sigue en `docs/HISTORIA.md` y en
> el historial de git (versión anterior: el commit anterior a este en `docs/COLA.md`). **Mantenla
> así**: las notas largas van a `docs/HISTORIA.md`, no aquí.

## Reglas para Claude Code

1. Lee antes `docs/CONTEXTO.md`.
2. Coge la primera instrucción con estado **PENDIENTE**. Cámbiala a **EN CURSO** con la fecha y
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
| 49 | `docs/ADJUNTOS-DE-CORREO-POR-DENTRO.md` | PENDIENTE |
| 50 | `docs/CABECERA-NO-TIEMBLA.md` | PENDIENTE |
| 51 | `docs/FICHA-DISPOSICION.md` | PENDIENTE |
| 52 | `docs/CABECERA-DEL-ASUNTO.md` | PENDIENTE |
| 53 | `docs/SENECA-CUADRO-ANCHO.md` | PENDIENTE |
| 54 | `docs/AYUDANTE-SENECA-FIABLE.md` | PENDIENTE |
| 55 | `docs/ASUNTO-SIN-ELECCION.md` | PENDIENTE |
| 56 | `docs/CAMPOS-CATALOGO-Y-CALCULADOS.md` | PENDIENTE |

**Orden de trabajo:** están PENDIENTES la 49, la 50, la 51, la 52, la 53, la 54, la 55 y la 56, en
ese orden. Las filas 1 a 48 están HECHAS. **La 52 va después de la 51**: las dos tocan la cabecera
de la ficha. La 54 toca solo `js/seneca-ayudante.js`, así que no se pisa con la 53. **La 55 va
después de la 53**, porque la 53 mueve el cuadro de Séneca a un fichero nuevo. La 56 no se pisa con
ninguna de las demás: solo toca los campos y la pantalla de un tipo de asunto.

**Fila 49, en una línea** (18-sep-2026, acordada con Francisco): la bandeja de correos lee por
dentro los PDF adjuntos de cada correo (hasta 3 adjuntos, 5 páginas) con el lector que ya existe
de la fila 41, y **completa** la propuesta: lo que dice el correo manda, el PDF solo rellena los
huecos (tercero y tipo), y aporta el registro de Séneca y la fecha del documento, que el correo no
trae. Línea nueva en la tarjeta del correo, debajo de la propuesta de hoy. No se toca
`apps-script/gestor-correos.gs`.

**Fila 50, en una línea** (18-sep-2026, hablada con Francisco): la cabecera pegada de la fila 46
tiembla muy deprisa en un punto del principio del desplazamiento, justo antes de encogerse. Al
encogerse pierde alto, el documento se acorta, el navegador recorta `scrollY` por debajo del
umbral de despliegue, y el ciclo se repite. Se arregla compensando el alto perdido, separando los
umbrales (120 y 24) y con un candado de 400 ms entre cambios contrarios. Sube directamente a
`main`, sin petición de cambios.

**Fila 51, en una línea** (18-sep-2026, acordada con Francisco, escrita como fila 49 antes de que
ese número y el 50 se ocuparan): la ficha de un asunto se recoloca, solo disposición y ningún
cambio de funcionamiento. La cabecera gana una línea gris que se esconde al encogerse, "Datos del
asunto" se desmonta y queda solo "Datos del trámite" (que no se pinta si está vacío), las Notas
suben justo bajo "Datos y contacto", "Otros asuntos de este tercero" y "Personas y entidades
relacionadas" pasan a `<details>` plegados con su cuenta, los documentos se van a una tercera
columna con rejilla de tres tramos, y un bloque vacío ocupa una línea en vez de una tarjeta.
Detalle en `docs/FICHA-DISPOSICION.md`. Sube directamente a `main`, sin petición de cambios.

**Fila 52, en una línea** (18-sep-2026, acordada con Francisco mirando la cabecera de un asunto de
CERT. MATRICULA): los doce botones de la cabecera se agrupan por el momento del trámite en que se
usan y bajan a cinco. Editar y Borrar se van a un menú de tres puntos en el nombre, que también
copia el nombre del asunto; el número del tercero se copia desde el propio nombre; Vía entra
dentro de Lo pide, que pasa a llamarse "El encargo"; Correo y Mensaje de Séneca se juntan en
"Comunicar"; "Gestionar documentos" baja al bloque de Documentos; el botón "Plazo" deja de existir
y el vencimiento se ve escrito ("Vence el 25-sep · quedan 7 días"), pulsable para cambiarlo; y la
barra termina en el mismo borde que el título, con "Archivar el asunto" a la derecha. Detalle en
`docs/CABECERA-DEL-ASUNTO.md`. **Va después de la fila 51.** Sube directamente a `main`, sin
petición de cambios.

**Fila 53, en una línea** (18-sep-2026, acordada con Francisco mirando una captura del cuadro de
Mensaje de Séneca): ese cuadro se rehace para que se vea entero. Todo lo de Séneca sale de
`js/correo.js` (38 KB) a un fichero propio, `js/seneca-cuadro.js` con `css/seneca.css`; el cuadro
pasa a ocupar el ancho (hasta 1100 px) en dos columnas a partir de 900 px, con destinatarios y
asunto a la izquierda y el texto del mensaje a la derecha; el asunto deja de ser una línea cortada
y se lee entero, con su cuenta de caracteres; si el tipo no tiene plantilla de Séneca, un aviso en
vez del hueco vacío; el botón que cambiaba de significado se parte en dos botones numerados ("1.
Copiar el asunto" y "2. Copiar el texto"); y los cuatro párrafos del ayudante se pliegan en un
desplegable. Ningún cambio de funcionamiento. Detalle en `docs/SENECA-CUADRO-ANCHO.md`. Sube
directamente a `main`, sin petición de cambios.

**Fila 54, en una línea** (18-sep-2026, acordada con Francisco después de probar el ayudante en
Séneca de verdad con cuatro profesores: solo entró uno bien): el ayudante de `js/seneca-ayudante.js`
deja de fiarlo todo a un reloj fijo de 1400 ms. Ahora espera a que aparezca la sugerencia de Séneca
(hasta 5 s, mirando cada 150 ms si hay un elemento visible con ese usuario), separa la flecha abajo
del Intro con 350 ms, comprueba que la persona ha entrado de verdad (el campo se vacía, hasta
2,5 s), reintenta una vez más despacio si no, y al final dice por su nombre quién no ha entrado,
con un botón "Copiar los que faltan". Solo se toca `js/seneca-ayudante.js`; ni los chips ni
`js/seneca-destinatarios.js` cambian. Detalle en `docs/AYUDANTE-SENECA-FIABLE.md`. Sube
directamente a `main`, sin petición de cambios.

**Fila 55, en una línea** (18-sep-2026, acordada con Francisco): desaparecen los dos botones
"Nombre de la carpeta" / "Versión legible" que hay debajo del campo Asunto, en el cuadro de Correo
y en el de Mensaje de Séneca. El asunto del mensaje es siempre el nombre de la carpeta del asunto,
porque es lo que permite reconocer el hilo después; el campo sigue viéndose y pudiéndose editar a
mano. Se borra el código de la versión legible. Detalle en `docs/ASUNTO-SIN-ELECCION.md`. **Va
después de la fila 53.** Sube directamente a `main`, sin petición de cambios.

**Fila 56, en una línea** (18-sep-2026, acordada con Francisco): la sección Campos de la pantalla
de un tipo deja de enseñar el catálogo entero desplegado. Se queda solo con los campos que el tipo
ya tiene y un botón "+ Añadir campo", que abre un panel con tres pestañas (De la ficha · Míos ·
Calculados) y buscador. Y Francisco puede crear campos calculados: eliges el campo de origen, una
de seis operaciones (quitar los últimos caracteres, quitar los primeros, partir por un signo, tabla
de equivalencias, juntar dos campos, sacar un dato de una fecha) y ves el resultado con una persona
de verdad antes de guardar. El calculado "Curso" pasa a ser una receta más en `campos.json`, con la
función de siempre como respaldo para que ningún nombre de carpeta cambie. Ficheros nuevos:
`js/campos-calculo.js`, `js/campos-catalogo.js`, `js/campos-calculados-editor.js` y
`pruebas/campos-calculo.test.js`. Detalle en `docs/CAMPOS-CATALOGO-Y-CALCULADOS.md`. Sube
directamente a `main`, sin petición de cambios.

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
  hito en curso, y si un hito puede apuntar a su plantilla de correo (fila 14) o de documento
  (fila 17). Esto último Francisco ya lo dio por hecho el 16-sep-2026.
- Los nueve asuntos de `docs/PROXIMOS-ASUNTOS.md` (14-sep-2026) están todos metidos en la cola:
  esa lista queda cerrada.
- De la fila 54 (18-sep-2026): para un grupo de destinatarios que se repite todos los meses, lo
  suyo es crearlo una vez en el gestor de contactos del propio Séneca. El ayudante es para listas
  de un día. Si algún día se ve que casi todas las listas son fijas, habrá que replantear si el
  ayudante merece seguir existiendo.

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
