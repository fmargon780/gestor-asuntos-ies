# Cola de instrucciones para Claude Code

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

> **Este documento se compacta cuando crece.** Se hizo el 18-sep-2026 (había llegado a 90 KB) y
> otra vez el 20-sep-2026 (45 KB). La tabla guarda solo número, documento y estado; **las notas
> largas van a `docs/HISTORIA.md`, no aquí**. El detalle de cada fila HECHA está en
> `docs/HISTORIA.md`, en el documento de la propia fila y en el historial de git.

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
8. Al terminar cualquier instrucción: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` (o
   el hijo de `docs/contexto/` que toque) **sustituyendo la línea vieja, no añadiendo una debajo**.
   Si algo deja de ser verdad, se borra.
9. Añade a `docs/HISTORIA.md` lo que merezca recordarse, con su fecha. No dejes que
   `docs/CONTEXTO-CORTO.md` pase de 14.000 caracteres.
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
    `docs/NO-GASTAR-PUBLICACIONES.md`. (Desde la fila 65, la documentación puede ir en una subida
    aparte: tres por fila en vez de dos.)
14. **Nunca uses `$(cat fichero)` ni ninguna sustitución de shell como valor de `content` al
    subir un fichero: el servidor no lo ejecuta, lo sube tal cual, como texto literal.** El
    17-sep-2026 esto dejó `docs/COLA.md` en 35 bytes con el comando sin ejecutar. El contenido
    tiene que ir escrito entero, de verdad, en el propio parámetro.
15. **`push_files` con muchos ficheros grandes en una sola llamada es donde más falla el volcado
    del contenido.** El 20-sep-2026, en la fila 77, una llamada de doce ficheros dejó seis con la
    palabra `PLACEHOLDER` en vez del contenido, y `js/nucleo.js` con `PLACEHOLDER` es la
    aplicación entera sin arrancar, publicada. Para una fila con más de cuatro o cinco ficheros de
    código, súbelos con `create_or_update_file` uno a uno (o en dos o tres llamadas de
    `push_files` más pequeñas), comprobando el tamaño de cada uno nada más subirlo.
16. **Si delegas una fila de documentación en una sesión auxiliar**, pídele explícitamente que lea
    el fichero entero de origen y lo copie tal cual, o que lo suba en trozos verificados. El
    19-sep-2026 una sesión auxiliar retipeó tres ficheros de memoria e introdujo erratas en los
    tres (`docs/COLA.md`, `docs/contexto/ASUNTOS.md`, `docs/HISTORIA.md`).
17. **Sin `git push` ni acceso a `api.github.com`** (algunas sesiones, por la política de red de su
    entorno): todo pasa por la herramienta MCP de GitHub, fichero a fichero. `docs/HISTORIA.md` (más
    de 120 KB) ya no se puede reconstruir con fiabilidad en una sola sesión así: en vez de
    arriesgarse a truncarlo (regla 12), esa sesión deja el texto de la entrada ya escrito, listo
    para pegar, en una nota al final de este documento, para que una sesión con `git push` de
    verdad lo incorpore. Pasó con la fila 93 (23-sep-2026).
18. **Nunca pases el mensaje del commit como contenido del fichero.** El 23-sep-2026, al marcar la
    fila 103 EN CURSO, una llamada a `create_or_update_file` dejó por error el texto del mensaje
    de commit en el parámetro `content`, y `docs/COLA.md` se quedó en 83 bytes. Antes de cada
    llamada, comprueba que `content` es el documento entero y `message` es la frase del commit:
    son dos parámetros distintos, nunca el mismo texto.
19. **Tras fusionar o subir, comprueba con `curl` que lo publicado coincide con `main`** (por
    ejemplo `js/version.js?v=<algo distinto>`). Si `App.VERSION` publicada se queda atrás varios
    minutos, puede que Vercel no haya llegado a lanzar la publicación de los últimos commits (sin
    error visible: sencillamente no hay ninguna `deployment` para esos SHA). Pasó el 24-sep-2026
    con la fila 63 (`216bff3a`, ~40 min sin publicarse). Si tienes acceso a la herramienta MCP de
    Vercel, `list_deployments` con el `sha` del commit lo confirma, y un `create_deployment` con
    `deploymentId` de la última publicación buena y `withLatestCommit: true` (`target: production`)
    fuerza una nueva publicación desde el commit actual de `main` sin tocar el repositorio. Si no
    tienes esa herramienta, déjalo anotado aquí para que otra sesión lo compruebe: no reintentes
    subidas del mismo fichero pensando que el problema está en el contenido.

## Reglas para Francisco

- Mientras Claude Code está trabajando, **no se lanza otra vez**. Las instrucciones nuevas se
  apuntan aquí y esperan.
- Cuando Claude Code termina, se vuelve a pegar la misma línea. Si no queda nada pendiente,
  Claude Code lo dice y no toca nada.

## La línea para lanzar

    Lee docs/CONTEXTO.md y después docs/COLA.md. Haz en orden todo lo que esté PENDIENTE, siguiendo las reglas de la cola, sin preguntarme nada. Al terminar, dime en pocas frases qué has hecho, qué versión está publicada y qué voy a ver distinto en pantalla.

## La cola

Las filas 1 a 140 están **HECHAS**. Sus documentos siguen en `docs/`, y el detalle de cada una en
`docs/HISTORIA.md`. Aquí queda solo lo que no está cerrado:

| Nº | Instrucción | Estado |
|---|---|---|

**La fila 140 está HECHA** (25-sep-2026): `docs/TIEMPO-DE-TRAMITACION.md`. Cuentas gana, por tipo,
«Media (días)» y «Máximo (días)» (también al copiar), el número «Abiertos hace más de 30 días» y la
tabla «Los que más tiempo llevan abiertos» (los diez más antiguos; pulsar abre la ficha; reservados,
tapados), todo con el curso elegido (`js/cuentas-tiempos.js`). Prueba
`pruebas/tiempo-de-tramitacion.mjs` (y `pruebas/quien-encarga-cada-tipo.mjs`, en la pantalla de
verdad), batería completa en verde. Versión `App.VERSION`: `25-sep-2026 · 01:58`.

**La fila 139 está HECHA** (25-sep-2026): `docs/UNA-SOLA-LIBRETA-DE-NOTAS.md`. Una sola libreta de
notas por asunto: la que se escribe desde la mesa de un hito va a las del asunto con la etiqueta
del hito (pulsarla en la ficha abre la mesa); la mesa enseña solo las suyas y, aparte, la
«Historia» automática del hito. `js/notas-migracion.js` pasó las notas a mano de los hitos al
asunto, una vez. Prueba `pruebas/una-sola-libreta-de-notas.mjs` (y `pruebas/hitos.mjs`, que ya
busca la nota en el asunto), batería completa en verde. Versión `App.VERSION`: `25-sep-2026 · 01:52`.

**La fila 76 está HECHA** (25-sep-2026): `docs/VERSION-AL-PUBLICAR.md`. La web pone sola la hora de
la versión al publicar: `vercel.json` gana `"buildCommand": "node scripts/version-al-publicar.mjs"`,
que escribe la hora de España de ese momento en la copia que sirve Vercel, sin ningún commit (el
`ignoreCommand` no se ha tocado). Si falla, se queda la escrita a mano. La escrita en
`js/version.js` se sigue poniendo en cada subida (la usa la copia sin internet). Prueba
`pruebas/version-al-publicar.mjs`, batería completa en verde. **Pendiente de comprobar publicando**:
esta sesión no llega a la web; si la hora de abajo a la izquierda no es la de la publicación, se
vuelve a la escrita a mano quitando el `buildCommand` y la fila pasa a BLOQUEADA (una vez, sin
insistir). Versión escrita a mano: `25-sep-2026 · 01:37`.

**La fila 138 está HECHA** (25-sep-2026): `docs/UNA-SOLA-LISTA-EN-EL-HITO.md`. Dentro del hito queda
una sola lista, el guion: lo que hay que reunir es una línea más (📎 documento, ✎ dato, «obligatorio»;
casilla «Hay que reunirlo» en el editor). `js/reunir-migracion.js` pasó lo que había, una vez
(guías, biblioteca de hitos y hitos, conservando lo hecho; los requisitos viejos siguen en los
ficheros). El contenido del instituto ya lo trae en el guion. Prueba
`pruebas/una-sola-lista-en-el-hito.mjs` (y `pruebas/repintar-solo-lo-que-cambia.mjs`, que deja
puesta la marca), batería completa en verde. Versión `App.VERSION`: `25-sep-2026 · 01:26`.

**La fila 137 está HECHA** (25-sep-2026): `docs/INDICE-DEL-EXPEDIENTE.md`. `000 ÍNDICE DEL
EXPEDIENTE.pdf` (`js/indice-expediente.js`): lista numerada de los documentos (fecha, registro,
nombre, páginas), hecha al archivar (si falla, ámbar y archivado igual) y con «Índice del
expediente» en el menú de la ficha (el viejo, a la papelera). No cuenta como documento. Prueba
`pruebas/indice-del-expediente.mjs` (y `pruebas/cabecera-del-asunto.mjs`, con la opción nueva),
batería completa en verde. Versión `App.VERSION`: `25-sep-2026 · 01:10`.

**La fila 136 está HECHA** (25-sep-2026): `docs/PLAZO-DE-CONSERVACION.md`. Cada tipo puede llevar
cuántos años se conserva después de archivar (`conservarAnios`, con el enlace a las tablas de la
Junta); `js/conservacion.js` avisa (al entrar, una vez al día, y en Ajustes › Mantenimiento) de los
archivados que lo han cumplido, con «Mandar a la papelera» (se pueden devolver a su sitio del
ARCHIVO) y «Conservar más tiempo…». Nunca borra nada solo. Prueba
`pruebas/plazo-de-conservacion.mjs`, batería completa en verde. Versión `App.VERSION`: `25-sep-2026 · 01:01`.

**La fila 135 está HECHA** (25-sep-2026): `docs/ASUNTOS-RESERVADOS.md`. Un tipo (casilla en su
pantalla) o un asunto (menú de la ficha) puede ser reservado (`js/reservados.js`, la única regla):
en Asuntos abiertos, ARCHIVO y «Qué me toca» sale con candado y sin el nombre del tercero; el
buscador solo lo encuentra por el nombre de la carpeta; «Mostrar reservados» lo destapa solo en esa
sesión; en Cuentas, «Reservado» en «quién lo pide». Prueba `pruebas/asuntos-reservados.mjs`
(y `pruebas/cabecera-del-asunto.mjs`, con la opción nueva del menú), batería completa en verde.
Versión `App.VERSION`: `25-sep-2026 · 00:52`.

**La fila 134 está HECHA** (25-sep-2026): `docs/QUIEN-ENCARGA-CADA-TIPO.md`. Cada tipo dice quién
lo encarga (`organo` en `tipos.json`, `js/tipos-organo.js`): desplegable en la pantalla del tipo y
en «+ Crear tipo nuevo», bloque «Quién encarga cada tipo» en Ajustes › Tipos de asunto (con «N sin
asignar»), parrilla de Nuevo asunto agrupada, filtro «Lo encarga» en Asuntos abiertos, y columna y
tabla por órgano en Cuentas. Prueba `pruebas/quien-encarga-cada-tipo.mjs`, batería completa en
verde. Versión `App.VERSION`: `25-sep-2026 · 00:38`.

**La fila 133 está HECHA** (24-sep-2026): `docs/PARTIR-FICHEROS-GRANDES.md`. Partidos los quince,
sin cambiar nada de lo que se ve: `bandeja-correos.js`, `datos.js`, `ficha-asunto.js`, `guias.js`,
`asuntos-nuevo.js`, `papelera.js`, `asuntos-lista.js`, `plantillas.js`, `documentos.js`,
`relacionados.js`, `util.js`, `correo.js`, `unir-asuntos.js` y `plantillas-documento.js` (35
ficheros nuevos, en `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`); `ajustes-centro.js` ya había
bajado de 600 con la fila 132. Ninguno de `js/` pasa ya de 600 líneas. Batería completa en verde
tras cada fichero; `npm run copia-local` sigue funcionando. Versión `App.VERSION`: `25-sep-2026 · 00:18`.

**La fila 132 está HECHA** (24-sep-2026): `docs/ARREGLOS-POR-DENTRO.md`. Terceros que se releen solos
(fecha de los CSV), fuera el código de los estados escritos a mano, cabeceras de seguridad en
`vercel.json`, pdf.js 4.10.38 y una sola regla de destinatarios (`js/destinatarios.js`). Prueba
`pruebas/arreglos-por-dentro.mjs`, batería completa en verde. Versión `App.VERSION`: `24-sep-2026 · 23:00`.
Pendiente de comprobar con `curl -I` que las cabeceras nuevas salen (esta sesión no llega a la web).

**La fila 131 está HECHA** (24-sep-2026): `docs/PLAZOS-BIEN-CONTADOS.md`. Cada plazo de un paso dice
cómo se cuenta (hábiles por defecto, lectivos o naturales; `js/guias-plazo.js`, `Plazos.sumarPlazo`);
Ajustes › Hitos gana la caja de festivos (aviso ámbar si está vacía); la mesa dice «quedan N días»
en el modo del hito. Prueba `pruebas/plazos-bien-contados.mjs`, batería completa en verde. Versión
`App.VERSION`: `24-sep-2026 · 22:44`.

**La fila 130 está HECHA** (24-sep-2026): `docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md`. Tablón, CSV de
terceros (`js/datos-listas.js`), borrados e índice del ARCHIVO, por la cola; copias en conflicto de
los CSV unidas solas; un correo no sale dos veces (hay que pegar el script); carpeta ≤150 y
documento ≤120 caracteres, con aviso ámbar. Prueba `pruebas/guardar-y-enviar-sin-sorpresas.mjs`,
batería completa en verde. Versión `App.VERSION`: `24-sep-2026 · 22:30`.

**La fila 129 está HECHA** (24-sep-2026): `docs/EL-HITO-ES-EL-ESTADO.md`. El estado del asunto es
su hito actual: «Paso N de M · título» en la tarjeta y en la cabecera (pulsable a su mesa), y de
él sale el montón. Cada paso de la guía dice «Nos toca» / «Esperamos a…» (`js/guias-toca.js`);
«Esperando a…» / «Ya ha llegado» en la ficha y «Estamos en este paso» en los hitos
(`js/estado-hito.js`); guía mínima para los tipos sin guía; paso único de los abiertos
(`js/estado-migracion.js`). Fuera los estados escritos a mano. Prueba
`pruebas/el-hito-es-el-estado.mjs`, batería completa en verde. Versión `App.VERSION`:
`24-sep-2026 · 19:51`. De paso, `docs/HISTORIA.md` vuelve
a estar entero. Esta sesión no tiene salida a `vercel.app` ni permiso en el conector de Vercel
(403): la próxima, comprobar con `curl` que `App.VERSION` publicada es la de esta fila.

**La fila 128 está HECHA** (24-sep-2026, sesión programada): `docs/TIPO-DESDE-EL-ASUNTO.md`. En
Nuevo asunto, junto al buscador de tipos, «+ Crear tipo nuevo»: destacado bajo el buscador con
texto escrito, discreto al final de la parrilla sin texto (`js/tipo-al-vuelo.js`, enganchado a
`js/tipos-buscador.js`). Panel de tres datos (nombre, nombre corto, categoría), dentro de la
misma pantalla, nunca un segundo cuadro; Escape solo lo cierra a él. Guarda con `App.crearTipo`
(`js/ajustes.js`, compartida con «Añadir» de Ajustes) tras la misma guardia de nombres de
siempre; un nombre repetido no se duplica, ofrece «Usar este». Deja el tipo elegido con
`App.marcarTipoElegido` (`js/asuntos-nuevo.js`), que no toca el tercero ni lo ya escrito. Prueba
`pruebas/tipo-desde-el-asunto.mjs`, batería completa (`npm test`) en verde. Versión `App.VERSION`:
`24-sep-2026 · 15:32`.

**La fila 127 está HECHA** (24-sep-2026): `docs/MEMBRETE-NO-SE-ENCUENTRA.md`. El membrete ya se encuentra: `js/membrete.js` pregunta por `membrete.png` con `Carpetas.existeFichero` (antes, `Carpetas.existe`, que busca una carpeta). Lo mismo en tres sitios de `js/papelera.js` al devolver documentos. Francisco no tiene que volver a subir la imagen. Prueba `pruebas/membrete-se-encuentra.mjs`. Versión `App.VERSION`: `24-sep-2026 · 14:04` (ver la nota del cupo de Vercel: puede tardar en publicarse).

**La fila 126 está HECHA** (24-sep-2026): `docs/TIPO-QUE-CAMBIA-DE-NOMBRE.md`. Renombrar un tipo (a mano o con «Cargar la biblioteca del centro») se lleva su guía, campos, plantillas y recurrentes (`js/tipos-nombre.js`); al entrar, lo que se quedó bajo el nombre corto o un alias se junta solo con aviso verde (arregla la guía de DESEMPEÑO FUNCIÓN TUTORIAL) y la plantilla repetida va a la papelera; las plantillas casan con el tipo por cualquiera de sus nombres; «Cargar las plantillas del centro» ya no duplica; «Buscar otra plantilla…» en la mesa del hito y en «Generar documento». Prueba `pruebas/tipos-nombre.mjs`. Versión `App.VERSION`: `24-sep-2026 · 13:37`.

**24-sep-2026, cupo de Vercel agotado otra vez:** al abrir los pull request de las filas 124 y 125 (hacia las 12:59 y las 13:22), Vercel respondió «Resource is limited - try again in 24 hours (code: "api-deployments-free-per-day")». Las dos filas quedan en `main`, pero la web puede seguir en `24-sep-2026 · 12:22` hasta que el cupo se libere. La próxima sesión: comprobar con `curl` (`js/version.js?v=<algo>`) que `App.VERSION` es `24-sep-2026 · 14:04` o posterior; si sigue atrás pasadas 24 horas, un commit nuevo en `main` (o `create_deployment` con `withLatestCommit`, regla 19) lo publica todo. Esta sesión no tiene salida a `vercel.app` ni permiso en el conector de Vercel (403).

**La fila 125 está HECHA** (24-sep-2026): `docs/BUSCAR-PERSONAS-Y-FAMILIAS.md`. Personas y empresas → Alumnado: bloque «Familias» arriba al buscar un padre, madre o tutor legal (nombre, apellidos, DNI, teléfono o correo; una tarjeta por tutor con sus hijos matriculados), luego los de este curso y aspirantes, y «Antiguos (N)» plegado; la ficha se queda a la vista al bajar y la tarjeta vista, marcada; en la ficha del alumno, «Hermanos en el centro». `js/personas-familias.js`, `css/personas.css`, prueba `pruebas/personas-familias.mjs`. Versión `App.VERSION`: `24-sep-2026 · 13:14`.

**La fila 124 está HECHA** (24-sep-2026): `docs/RENUNCIA-JUNTA-ELECTORAL.md`. Plantilla «Renuncia a formar parte de la Junta Electoral» (OTROS · ELECCIONES CONSEJO ESCOLAR, una hoja A4, datos de quien renuncia en blanco), con `id` fijo `pd-centro-renuncia-junta-electoral`, unida al hito `b260` «Constituir la Junta Electoral», cuyo guion gana «Recoger las renuncias y avisar al suplente que corresponda» (generar). «Traer los guiones del instituto» ahora añade a un guion ya escrito las líneas nuevas del centro que le falten. Falta que Francisco pulse «Cargar las plantillas del centro» y «Traer los guiones del instituto» en Mantenimiento. Versión `App.VERSION`: `24-sep-2026 · 12:58`.

**La fila 123 está HECHA** (24-sep-2026): `docs/CERTIFICADO-TUTORIA-DEL-CENTRO.md`. El certificado de función tutorial, como el del centro: tipo DESEMPEÑO FUNCIÓN TUTORIAL (casa también sin tilde), firma Secretaría con su especialidad (`{{ESPECIALIDAD FIRMANTE}}`), V.º B.º de Dirección, «C E R T I F I C A:» en negrita, tabla Cargo · Curso · Toma de posesión · Cese y firmas en dos columnas. Campo «Cursos que pide» del tipo (en la biblioteca del centro): filtra la tabla (`js/tablas-datos-cursos.js`). `{{DNI}}` trae el documento entero del personal y `{{PROVINCIA}}` es hueco. Falta que Francisco vuelva a pulsar «Cargar las plantillas del centro» y «Cargar la biblioteca del centro» en Mantenimiento. Versión `App.VERSION`: `24-sep-2026 · 12:22`.

**La fila 122 está HECHA** (24-sep-2026): `docs/GUIA-EN-ACORDEON.md`. El editor de la guía, en acordeón: cada paso cerrado en una línea con su título y sus marcas (Normativa, Documentos, Guion, Pregunta, Solo informativo, responsable); un solo paso abierto a la vez (el de una opción deja abierta su pregunta); un paso nuevo sale abierto con el cursor en el título; desde el mapa, el paso sale abierto. «Documentos» y «Guion» con la caja gris de los demás apartados. `js/guias.js` partido: `js/guias-plegado.js`, `js/guias-barra.js`, `js/guias-opciones-editor.js`. Prueba `pruebas/guia-en-acordeon.mjs`. Versión `App.VERSION`: `24-sep-2026 · 12:04`.

**La fila 121 está HECHA** (24-sep-2026): `docs/AVISO-DE-VERSION-SEGURO.md`. Si la copia sin internet no puede comprobar si hay versión nueva, franja fija arriba con «Cómo actualizar a mano», en vez del aviso que se borraba solo; con la aplicación abierta, vuelve a mirar cada 30 minutos, sin recargar nunca. Versión `App.VERSION`: `24-sep-2026 · 11:23`.

**24-sep-2026, cupo de Vercel agotado:** al abrir el pull request de las filas 117 y 118 (hacia las 09:58), Vercel respondió «Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")». Las filas 117 a 120 están fusionadas en `main`, pero puede que la web no las publique hasta que el cupo se libere. La próxima sesión: comprobar con `curl` (`js/version.js?v=<algo>`) que `App.VERSION` es `24-sep-2026 · 10:44` o posterior; si sigue atrás pasadas 24 horas, un commit nuevo en `main` (o `create_deployment` con `withLatestCommit`, regla 19) publica todo lo pendiente. Esta sesión no tiene salida a `vercel.app` ni permiso en el conector de Vercel (403), así que no ha podido comprobarlo.

**La fila 120 está HECHA** (24-sep-2026): `docs/GUION-DESDE-EL-HITO.md`. En la mesa del hito, «+ Añadir un paso a la guía del tipo» añade la línea al final del guion del paso de la guía (`GuiasDelCentro.cambiarPasos`), y sale en todos los asuntos de ese tipo; «+ Añadir un paso solo para este asunto» sigue igual. No sale en hitos añadidos a mano, en pasos que ya no están en la guía ni en preguntas. Versión `App.VERSION`: `24-sep-2026 · 10:44`.

**La fila 119 está HECHA** (24-sep-2026): `docs/TRAS-CADA-ACCION.md`. Crear, reabrir y editar dejan en la ficha del asunto; «Volver» (y Escape) regresa a la pantalla de origen y a la misma altura de la lista; meter un documento, guardar un correo, unir y devolver de la papelera dan un aviso con «Ir al asunto»; un duplicado archivado abre su ficha. Fichero nuevo `js/navegacion.js`; prueba `pruebas/tras-cada-accion.mjs`. Versión `App.VERSION`: `24-sep-2026 · 10:44`.

**La fila 118 está HECHA** (24-sep-2026): `docs/GUIA-NUEVA-LLEGA-A-LOS-ASUNTOS.md`. Al guardar la guía de un tipo, sus pasos nuevos se añaden, en su sitio, a los asuntos abiertos de ese tipo que ya tienen hitos (una sola escritura de `hitos.json`), y el aviso dice a cuántos; al abrir la ficha, lo mismo como red de seguridad. No se toca, reordena ni borra nada de lo que ya hay; el ARCHIVO no cambia; un hito quitado a mano no vuelve (`pasosConocidos`). Fichero nuevo `js/hitos-sincronizar.js`. Versión `App.VERSION`: `24-sep-2026 · 10:44`.

**La fila 117 está HECHA** (24-sep-2026): `docs/ENVIO-CUENTA-DEL-SCRIPT.md`. El script usa la cuenta que lo ejecuta (`getEffectiveUser()`, `miCorreo()`) en vez de `getActiveUser()`, que llega vacía con acceso «Cualquier usuario»; `prepararEnvio()` da solo la clave y dice de dónde copiar la URL `/exec`; Ajustes → Enviar correo rechaza sin llamar a Google una dirección `/dev` o sin `?k=`, y explica los pasos corregidos. Falta que Francisco pegue el script nuevo, haga «Nueva versión» y pulse «Probar» (no hay cuenta de Google en estas sesiones). Versión `App.VERSION`: `24-sep-2026 · 10:44`.

**24-sep-2026, sesión programada (taller automático):** al llegar, la fila 115 ya estaba
**EN CURSO** por otra sesión (la marqué yo mismo a las 04:08 y, mientras tanto, esa otra sesión la
completó entera con `git push` real: commits `d07e080e`…`be0bb513`). Entre las 04:08 y las 05:50
esa misma sesión (u otra en paralelo) también cerró las filas 116 y 63. Resultado al comprobarlo:
**ninguna fila PENDIENTE**, solo la 76 sigue BLOQUEADA como estaba. Lo único que hizo falta
arreglar: la publicación de Vercel se había quedado parada en el commit de la fila 116 (`App.VERSION`
`07:32`) sin publicar los dos commits siguientes de la fila 63 (`cb98ef75` y el merge `216bff3a`,
`07:35`) — **más de 40 minutos sin ninguna `deployment` para esos commits**, sin error visible (ver
regla 19, arriba). Con la herramienta MCP de Vercel (`create_deployment`, `deploymentId` de la
última publicación buena + `withLatestCommit: true`) se forzó una publicación nueva: quedó
`READY` en segundos y `curl` confirmó `App.VERSION`: `24-sep-2026 · 07:35`, con `docs/COLA.md`
dando 404 en producción (la fila 63 funcionando). No se ha tocado código ni pruebas en esta
sesión, solo la marca EN CURSO de la fila 115 (ya sin efecto, sobrescrita por la fila HECHA) y esta
nota.

**La fila 63 está HECHA** (24-sep-2026): `docs/PUBLICAR-SOLO-LA-APP.md`. Francisco comprobó que `asuntos.fmargon.com/docs/COLA.md` se veía: `.vercelignore` deja fuera `docs/`, `pruebas/`, `plantilla/`, `apps-script/`, `herramientas/`, `.github/`, `README.md` y `package*.json` (`scripts/` se queda, por el `ignoreCommand`). El autónomo real de los ejemplos, cambiado por uno inventado. Queda por comprobar, ya publicado, que `docs/COLA.md` da error y que un cambio solo de `docs/` no publica. Versión publicada `App.VERSION`: `24-sep-2026 · 07:35`.

**La fila 116 está HECHA** (24-sep-2026): `docs/PREGUNTAS-EN-EL-GUION.md`. Una línea del guion de un hito puede ser pregunta: en la mesa, un botón por respuesta y, debajo, las líneas de la elegida; cambiar de respuesta deja plegado lo ya marcado. Un solo nivel. Se escribe con la casilla «Es una pregunta» en «Guion de este paso»; el mapa marca con «¿» los pasos cuyo guion tiene pregunta. Versión publicada `App.VERSION`: `24-sep-2026 · 07:32`.

**La fila 115 está HECHA** (24-sep-2026): `docs/ENVIAR-DESDE-EL-ASUNTO.md`. En el cuadro de
Correo, marcar documentos y pulsar "Enviar" muestra un resumen (Para, Copia oculta, Asunto,
primeras líneas y documentos con su tamaño) dentro del mismo cuadro, nunca un segundo diálogo;
"Confirmar y enviar" manda el correo de verdad con una aplicación web nueva de Apps Script
(`apps-script/gestor-correos.gs`, `doPost`) que el navegador llama directamente. Sustituye al
"borrador con documentos" de la fila del 16-sep-2026, que no funcionaba. **Cambia una regla de
siempre**: desde hoy la aplicación sí envía correo, pero solo tras esa confirmación explícita.
"Abrir en Gmail" y "Abrir en el correo del ordenador" siguen como opciones secundarias, sin
adjuntos. La dirección de la aplicación web se conecta una vez por persona en Ajustes → Enviar
correo (`docs/COMPROBAR-A-MANO.md` tiene los pasos). No se ha podido enviar ningún correo real en
esta sesión, sin cuenta de Google; la lógica se probó con pruebas sin navegador
(`pruebas/envio-apps-script.mjs`, 30 comprobaciones, y `pruebas/correo-enviar.mjs`, 14, las dos en
verde), y `pruebas/envios.mjs` (navegador de verdad) se ha escrito pero no se ha ejecutado en esta
sesión; queda para `npm test` en GitHub Actions. Detalle completo en `docs/HISTORIA.md`. Versión
publicada `App.VERSION`: `24-sep-2026 · 06:27`.

**La fila 114 está HECHA** (24-sep-2026): `docs/DOCUMENTOS-EN-LA-TARJETA.md`. En la tarjeta cerrada «Documentos de la carpeta», cada documento en su renglón, sin aplastarse (`flex: none` en todas las tarjetas); sin la línea «N documentos»; como mucho 5 nombres (o los que quepan enteros) y «y N más», que abre la lista entera. Los resúmenes pasaron a `js/ficha-tarjetas-resumen.js`. Versión publicada `App.VERSION`: `24-sep-2026 · 05:53`.

**La fila 113 está HECHA** (24-sep-2026): `docs/MAPA-DE-LA-GUIA.md`. Mapa de la guía de solo lectura (cajas y líneas, sin librerías): en Ajustes → tipo → «Pasos del trámite», dentro del cuadro de escribir la guía (panel en el mismo cuadro) y en la ficha de un asunto, con el camino elegido resaltado y el estado de cada hito. Pulsar una caja lleva a ese paso o abre la mesa del hito. La navegación por niveles salió de `js/guias.js` a `js/guias-niveles.js`. Versión publicada `App.VERSION`: `24-sep-2026 · 05:45`.

**La fila 112 está HECHA** (24-sep-2026): `docs/CABECERA-COMPACTA.md`. La cabecera del asunto va en dos líneas y la del hito en una; fuera «Volver a las tarjetas», «Volver a la lista de hitos» y la línea de ruta (se vuelve pulsando otra vez la pestaña abierta, o con Escape). Con un hito abierto, «GUION DEL HITO» queda a unos 234 px del borde (antes, 528). Versión publicada `App.VERSION`: `24-sep-2026 · 05:18`.

**La fila 111 está HECHA** (24-sep-2026): `docs/GENERO-EN-PLANTILLAS.md`. Las plantillas se escriben con «el/la alumno/a», «D./Dña.»… y sale solo la forma que toca según el sexo de cada persona (RegAlum, casilla nueva en «Datos y contacto», desplegable en cada persona de los cargos); sin el dato, se queda con la barra y aviso ámbar. Marca para otra persona: `hijo/a:tutor1`, `:tutor2`, `:firmante`, `:vistobueno`. Versión publicada `App.VERSION`: `24-sep-2026 · 05:00`.

**La fila 110 está HECHA** (24-sep-2026): `docs/TABLAS-DE-DATOS.md`. Tablas de datos (el PDF de funciones tutoriales de Séneca y los CSV/Excel de `datos/Tablas`) unidas por DNI, huecos `{{ESPECIALIDAD}}`, `{{TABLA TUTORIAS}}`, `{{DATO …}}` y `{{TABLA …}}`, y plantilla «Certificado de función tutorial» (`docs/contexto/TABLAS-DE-DATOS.md`). Versión publicada `App.VERSION`: `24-sep-2026 · 04:51`.

**La fila 109 está HECHA** (24-sep-2026): `docs/EL-HITO-A-PANTALLA-COMPLETA.md`. El hito se abre a pantalla completa como mesa de trabajo (guion que se marca solo, documentos en tabla, plantillas y formularios, comunicar y notas), con borrador de guion para los 296 hitos modelo del centro (`docs/contexto/HITO-MESA.md`). Versión publicada `App.VERSION`: `24-sep-2026 · 04:32`.

**La fila 108 está HECHA** (24-sep-2026): `docs/CONTACTO-EN-TARJETAS.md`. La ventana «Ver todo» del alumno pasa a una cabecera con etiquetas y una tarjeta por persona (el alumno, tutor 1, tutor 2), con el nombre entero de cada tutor bien montado (`js/datos-tutores.js`, `js/ficha-tercero-alumno.js`). Versión publicada `App.VERSION`: `24-sep-2026 · 04:08`.

**La fila 107 está HECHA** (24-sep-2026): `docs/FICHA-EN-TARJETAS.md`. La ficha del asunto pasa de tres columnas a una cuadrícula de tarjetas con su resumen; al pulsar una se abre en grande, con las demás como pestañas y una franja con los documentos (`js/ficha-tarjetas.js`). Versión publicada `App.VERSION`: `24-sep-2026 · 03:53`.

**La fila 106 está HECHA** (24-sep-2026): `docs/LO-PIDE-EN-LA-CABECERA.md`. En la ficha, quién lo pide sale una sola vez, arriba, con la relación entre paréntesis; debajo de "El encargo", nada. Versión publicada `App.VERSION`: `24-sep-2026 · 03:26`.

**La fila 105 está HECHA** (24-sep-2026): `docs/AJUSTES-PLEGADO.md`. En Ajustes todo nace
plegado, con un resumen en cada título (`js/ajustes-plegado.js`), y los avisos de fallo de
Mantenimiento solo salen cuando hay uno. Versión publicada `App.VERSION`: `24-sep-2026 · 03:25`.

**La fila 104 está HECHA** (23-sep-2026): `docs/ESTADO-POR-EL-HITO.md`. Los dos paneles de
Asuntos abiertos pasan a ser "Pendiente de Administración" y "Pendiente de terceros", y el asunto
se coloca solo según su hito abierto (`js/hitos-a-quien.js`); quién es Administración se marca en
Ajustes › Hitos (responsables) y en la rejilla de estados (para los asuntos sin hitos). Versión
publicada `App.VERSION`: `23-sep-2026 · 22:05`. Detalle en `docs/HISTORIA.md`.

**La fila 103 está HECHA** (23-sep-2026): `docs/EL-HITO-MESA-DE-TRABAJO.md`, segunda tanda del
hito como mesa de trabajo. Su entrada de `docs/HISTORIA.md`, que quedó aquí lista para pegar, ya
está incorporada (sesión de la fila 104, con `git push`).

**Las filas 92 a 98 se apuntaron el 23-sep-2026**, diseñadas y cerradas con Francisco esa tarde.
Van en ese orden de trabajo: primero la 92, que hoy deja la aplicación sin poder guardar nada.
Las filas 95 y 98 reabren o rodean cosas de la lista de descartado: cada documento dice qué hacer
con esa línea al terminar.

**La 89 y la 91 están HECHAS** (23-sep-2026, commit `db2f7d2`): el apunte de las filas 92 a 98
las devolvió aquí por error a PENDIENTE y BLOQUEADA, y la fila 92 las volvió a cerrar. **La 92
está HECHA** (23-sep-2026). **La 93 está HECHA** (23-sep-2026): repaso completo de todo `js/`
buscando una salida indebida de la ficha, y no se encontró ninguna — la regla ya se cumplía
entera desde las filas 30, 34, 51, 52 y 58. Ampliadas las pruebas de
`pruebas/quedarse-en-el-asunto.mjs` (quince casos). Una sesión anterior, sin `git push`, las
escribió sin poder correrlas; esta sesión sí tiene `git push` de verdad (sin permiso para escribir
en `main`, solo para clonar y probar en local) y ha corrido `npm test` completo en un navegador
local: tres fallos en las pruebas nuevas (nunca en la aplicación), los tres arreglados, y las 97
pruebas de `pruebas/` en verde. La 63 y la 76 siguen BLOQUEADAS y no se retoman sin que Francisco lo diga. La
tabla está en orden de trabajo, no de número, así que en cuanto se apunte una fila nueva,
la primera PENDIENTE **de arriba abajo** es la que se coge.

**Las filas 99, 100 y 101 se apuntaron el 23-sep-2026** tras una revisión a fondo de cómo
guarda y repinta la aplicación (error o pantalla congelada al guardar, aunque sí se guarda). Son
lo más urgente y van en ese orden: cada una usa lo que deja la anterior.

**La fila 102 se apuntó el 23-sep-2026**, cerrada con Francisco: primera tanda de que el hito sea
la mesa de trabajo del asunto. Va detrás de la 101.

**La fila 103 se apuntó el 23-sep-2026**, cerrada con Francisco: segunda tanda del hito como
mesa de trabajo, sobre lo que dejó la 102.

**Ninguna fila se sube junto con otra.** Cada una, su subida.

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
- De las filas 79 y 80 (20-sep-2026): el contenido de la biblioteca ya está escrito y cerrado con
  Francisco. Lo que queda para más adelante, y no es fila: (a) que la vigilancia diaria del BOJA
  del repositorio `fmargon780/normativa-escolarizacion` deje sola una instrucción en esta cola
  cuando cambie un artículo citado por un hito; (b) las plantillas de correo y de Séneca de cada
  tipo, que se escribirán con el uso, no de golpe; y (c) revisar el contenido tipo por tipo
  conforme Francisco los vaya trabajando de verdad, que es cuando verá si algo sobra o falta.
- De la fila 104 (23-sep-2026): con el uso, un aviso que devuelva el asunto a "Pendiente de
  Administración" cuando vence el plazo de un hito de terceros, para reclamarlo.
- **Del informe del 18-sep-2026: los tres botones de comunicar.** En la misma ficha hay
  "Comunicar" en la cabecera (plantilla del tipo), "Comunicar" en un hito (texto de ese paso) y
  "Pedir lo que falta" en un hito. Por dentro están bien: los tres abren el mismo cuadro y no hay
  código duplicado. Desde la pantalla, tres botones parecidos van a confundir. **No se toca hasta
  que Francisco haya usado los hitos un mes**: entonces se decide si "Pedir lo que falta" pasa a ser
  una opción dentro de "Comunicar". Por eso no es una fila de la cola.
- **Del informe del 18-sep-2026: la papelera, ¿se vacía sola?** Hoy avisa a los 30 días pero no
  borra nada sin que alguien pulse. Para datos de menores, un borrado que nunca ocurre no es lo
  ideal. **Hay que preguntarselo a Francisco**, y apuntar lo que decida. Es la parte que quedó sin
  hacer de la fila 68.
- **Del informe del 18-sep-2026: la ficha del asunto.** Se ha rehecho tres veces en cuatro días
  (filas 51, 52 y 58). La cuarta pasada la adelantó Francisco el 24-sep-2026: es la fila 107.
- **Del 21-sep-2026: quitar el tecleo de la clave de normativa.** En el apartado "Normativa" de un
  paso, un buscador que encuentre el artículo por su texto ("consejo escolar") y rellene la clave
  solo. Necesita que el sistema de normativa publique un índice ligero de claves y títulos. **Se
  diseña con Francisco a partir del miércoles 23-sep-2026 a las 14:00**, no antes.
- **Del 23-sep-2026: revisión de usabilidad.** Francisco ve pantallas con demasiadas cosas. Ajustes
  va en la fila 105 y la ficha del asunto en la 107. Queda por hablar Asuntos abiertos (qué plegar),
  con la misma regla: plegado, resumen en el título, y se recuerda lo abierto.

## Descartado, no proponer otra vez (del informe del 18-sep-2026)

- **Un servidor.** Ni en internet ni dentro del centro, mientras sean dos o tres personas. En
  internet rompería el límite de no sacar datos personales. Dentro del centro lo respetaría, pero
  cambia "un fichero que crece" por "una máquina que nadie administra en agosto". Además, las cuatro
  cosas que un servidor resolvería —aviso instantáneo, cierre de verdad, buscar sin cargar nada
  entero, copias automáticas— o no son problema hoy, o ya están resueltas (el índice del ARCHIVO,
  las copias diarias), o las arregló la fila 64. **Se replantea solo si algún día entran cinco o
  seis personas de varios departamentos a la vez; y entonces, una máquina en el centro, nunca en la
  nube.**
- **Una base de datos del navegador** en vez de los ficheros del Dropbox. Rompería el modelo: los
  datos vivirían dentro de un ordenador, el compañero no los vería, un borrado de datos del
  navegador se lo llevaría todo, y se perdería lo mejor del diseño de hoy, que es poder abrir la
  carpeta y ver el trabajo sin la aplicación.
- **Guardar los cambios uno detrás de otro** (un registro de apuntes en vez de reescribir el
  fichero). Es la solución correcta para diez personas escribiendo a la vez. Con dos, dos semanas de
  trabajo y fallos que tardan meses en aparecer. La fila 64 dio casi el mismo beneficio por mucho
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

24-sep-2026: dos sesiones a la vez en la fila 115 (una programada, sin `git push`; otra con `git
push` real) no llegaron a pisarse — la segunda la completó entera antes de que la primera subiera
nada más que la marca EN CURSO. Pero si una sesión sin `git push` intenta escribir de un tirón un
fichero grande (por ejemplo, pasarle a un subagente el contenido entero de un fichero de más de
~50 KB dentro del propio mensaje), puede agotar su propio límite de respuesta antes de llegar a
subir nada: no es un fallo del repositorio, es la sesión quedándose sin aire a mitad de frase. Si
pasa, no ha tocado nada todavía (compruébalo con `docs/COLA.md` y el historial de commits antes de
seguir) — deshazte de esa sesión y, si hace falta ayuda, repártela en trozos más pequeños.

## Nota para la próxima sesión: docs/CONTEXTO.md y docs/HISTORIA.md de las filas 53-56

El código, las pruebas y `docs/CONTEXTO-CORTO.md` de las filas 53-56 están en `main` y comprobados
en producción, pero la sesión del 18-sep-2026 (mañana) **no pudo subir** las secciones
correspondientes de `docs/CONTEXTO.md` ni de `docs/HISTORIA.md` (225 y 217 KB: demasiado para
retipear de un tirón sin `git push`). Puede que falten todavía.

- A `docs/CONTEXTO.md`: el cuadro de Séneca en dos columnas (fila 53), el ayudante fiable (54), el
  asunto sin elección (55), el panel de campos de tres pestañas y los campos calculados (56), y
  las filas correspondientes de "Ficheros del repositorio" (`js/seneca-cuadro.js`,
  `css/seneca.css`, `js/campos-calculo.js`, `js/campos-catalogo.js`,
  `js/campos-calculados-editor.js`, `js/ajustes-tipo.js`).
- A `docs/HISTORIA.md`: la entrada del 18-sep-2026 de esas cuatro filas, con su "Lo que costó de
verdad" (los bugs que las propias pruebas cazaron antes de producción).

Compruébalo contra lo que de verdad dice `main` antes de sustituir nada. Si la sesión tiene
`git push` de verdad (terminal u ordenador de Francisco), es mucho más simple que ir fichero a
fichero con la API.

## docs/HISTORIA.md, otra vez entero

24-sep-2026, fila 129: `docs/HISTORIA.md`, que se había cortado en la fila 82 al cerrar la fila
128, se ha recompuesto con el historial de git (lo de la fila 82 hacia atrás, sacado tal cual del
commit `86d22d4`) y se ha subido con `git push` de verdad. Nada pendiente.
