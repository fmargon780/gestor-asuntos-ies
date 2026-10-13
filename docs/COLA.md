# Cola de instrucciones para Claude Code

Estados: PENDIENTE / EN CURSO / HECHA / BLOQUEADA / DEVUELTA / IDEA / EN DISEÑO. IDEA: apuntada por
Francisco, sin diseñar. EN DISEÑO: se está diseñando en una conversación de Cowork; lleva el
enlace. DEVUELTA: el revisor la rechazó dos veces (`docs/REVISOR-ANTES-DE-PUBLICAR.md`); el
siguiente lanzamiento la retoma antes que cualquier PENDIENTE. Claude Code no toca IDEA ni EN
DISEÑO.

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

> **Este documento se compacta cuando crece.** Se hizo el 18-sep-2026 (había llegado a 90 KB), el
> 20-sep-2026 (45 KB), el 25-sep-2026 (50 KB) y el 29-sep-2026, fila 226 (110 KB, con la norma
> nueva de la regla 20: por debajo de 40 KB siempre). La tabla guarda solo número, documento y
> estado; **las notas largas van a `docs/HISTORIA.md`, no aquí**. El detalle de cada fila HECHA
> está en `docs/HISTORIA.md`, en el documento de la propia fila y en el historial de git.

## Reglas para Claude Code

0. **Una sola sesión a la vez, una fila tras otra** (norma del 27-sep-2026, cambiada el 1-oct-2026,
   `docs/REPARTO-DE-LA-COLA-2026-09-27.md`; ampliada el 28-sep-2026 por
   `docs/REVISOR-ANTES-DE-PUBLICAR.md`, fila 223). Nunca trabajan dos sesiones de Claude Code a la
   vez en este repositorio, y no hay ninguna tarea programada que lance la cola: la lanza
   Francisco. Por defecto, cada lanzamiento hace, en una conversación de Claude Code nueva, **solo la
   primera fila DEVUELTA** (si la hay) **o, si no hay ninguna, la primera fila PENDIENTE**. Si la
   frase de lanzamiento pide varias («las N primeras filas PENDIENTE» o «todas»), la misma
   conversación las hace **de una en una**, en el orden de la cola, cada una completa (EN CURSO,
   revisor, publicación comprobada, HECHA) antes de empezar la siguiente; y **antes de empezar cada
   fila nueva** mira `docs/PARAR.md` en `main`: si dice PARAR, lo cambia a SEGUIR, lo sube y para.
   Cada fila la trabaja en
   su rama `fila-<nº>`, la pasa por el revisor (en local, fila 242) y solo con su APROBADA la publica en `main` (detalle
   en `docs/REVISOR-ANTES-DE-PUBLICAR.md`), comprueba la publicación y **para**. Si una fila queda
   DEVUELTA o BLOQUEADA, la conversación también acaba ahí. Si al empezar hay una fila EN CURSO
   **con conversación enlazada de menos de 90 minutos**, no se coge otra: esa conversación sigue
   con ella. Una fila EN CURSO sin enlace, o con uno de más de 90 minutos, se considera abandonada:
   el siguiente lanzamiento la retoma, en conversación nueva, mirando qué quedó en su rama `fila-<nº>` (no en
   `main`). Las cláusulas comunes de las filas 188 en adelante (como mucho tres subidas, nada se
   sube con `npm test` en rojo) están en `docs/REPARTO-DE-LA-COLA-2026-09-27.md`. **«Comprueba la
   publicación» no es lo mismo que «espera a que Vercel publique»** (28-sep-2026,
   `docs/PUBLICAR-SIN-PARAR.md`): si Vercel no publica por una causa ajena a este repositorio (tope
   diario de despliegues, publicación que no arranca, cola de más de 20 minutos), la fila se deja
   **SIN PUBLICACIÓN COMPROBADA** y la sesión para con normalidad, sin quedarse esperando; el
   siguiente lanzamiento sigue con la fila siguiente. Solo una publicación **rota por el código de
   esta fila** (la construcción falla, la web da error, falta un fichero) sigue obligando a
   arreglarla antes de seguir.
1. Lee antes `docs/CONTEXTO.md`.
2. Coge la primera instrucción con estado **DEVUELTA**, y si no hay ninguna, la primera con estado
   **PENDIENTE**, leyendo la tabla **de arriba abajo** (saltando IDEA y EN DISEÑO). Ojo: desde el
   18-sep-2026 la tabla está en orden de trabajo, no de número, así que la primera PENDIENTE no
   tiene por qué ser la del número más bajo. Si es una PENDIENTE de antes de la fila 223 y no lleva
   sección «Cómo sabemos que está bien», escríbela a partir del propio documento
   (`docs/REVISOR-ANTES-DE-PUBLICAR.md`, sección 1) en esta misma subida. Cámbiala a **EN CURSO
   (fecha hora) · conversación: <enlace de esta sesión, o «sin enlace» si no lo tienes, nunca
   inventado>** (formato de la sección 5 bis de `docs/REVISOR-ANTES-DE-PUBLICAR.md`) y sube ese
   cambio, a `main` (no publica nada), en el primer commit del trabajo. Así, si otra sesión abre
   esta cola, sabe que ya hay alguien con ella y no la repite.
3. Antes de empezar una instrucción, comprueba si ya está hecha por otro camino (mira si existen
   los ficheros o funciones que pide). Si ya está hecha, márcala **HECHA** con una nota; después
   sigue la regla 0 (para, o pasa a la siguiente solo si el lanzamiento pidió varias).
4. Al terminar una, márcala **HECHA** con la fecha y **para**, salvo que el lanzamiento pida varias filas (regla 0). **La hora de `App.VERSION` sale del reloj de verdad**
   (`TZ='Europe/Madrid' date`, receta exacta en `js/version.js`), nunca a ojo: el 17-sep-2026
   salieron versiones con horas por delante de la real.
5. Si una instrucción no puede completarse, márcala **BLOQUEADA** con el motivo en una línea y
   para (regla 0). Nunca dejes el repositorio con las pruebas en rojo.
6. Si encuentras una instrucción **EN CURSO** de otra sesión y no eres tú quien la empezó,
   aplica la regla 0 (menos de 90 minutos con conversación enlazada: no se coge otra; si no, se retoma).
7. No preguntes nada a Francisco. Al final, un mensaje corto: qué instrucciones has hecho, la
   versión publicada, y qué va a ver distinto en pantalla.
8. Al terminar cualquier instrucción: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` (o
   el hijo de `docs/contexto/` que toque) **sustituyendo la línea vieja, no añadiendo una debajo**.
   Si algo deja de ser verdad, se borra.
9. Añade a `docs/HISTORIA.md` lo que merezca recordarse, con su fecha. No dejes que
   `docs/CONTEXTO-CORTO.md` pase de 40.000 caracteres.
10. **Antes de subir nada, vuelve a bajar `main`** (`git fetch`): marcar la fila EN CURSO no basta,
    y subir sin releer pisa lo de otro. Hazlo justo antes de cada subida, no una sola vez al empezar.
11. **Nunca subas un fichero con un texto de relleno en vez de su contenido.** Si no tienes el
    contenido entero delante, no lo subas: bájalo antes. El 17-sep-2026 `docs/CONTEXTO.md` se
    quedó en `main` con la palabra `PLACEHOLDER_WILL_REPLACE` y nada más, y hubo que recuperarlo
    del historial de git. Después de subir, vuelve a bajar lo subido y compruébalo.
12. **Subida de ficheros** (7-oct-2026, fila 301): ver `CLAUDE.md`, punto 3 de «Trabajar en la rama
    de la fila». Nunca se suben ficheros de código con las herramientas de ficheros de GitHub
    (`create_or_update_file`, `push_files`); si git no puede subir, la fila queda EN CURSO y se dice.
    Las reglas 14, 15, 17 y 18, que explicaban cómo subir con ellas, se han retirado.

13. **El reparto de las subidas** (fila 242, cambiada el 11-oct-2026 por la fila 331,
    `docs/PUBLICAR-SOLO-AL-TERMINAR.md`). Vercel no publica nada solo: ninguna subida a GitHub crea
    una publicación. **La única publicación de una fila con código es la hecha a propósito** con
    `create_deployment` (regla de `CLAUDE.md`), tras fusionar su rama `fila-<nº>` en `main` con la
    APROBADA del revisor. Las subidas de solo `docs/` (marca EN CURSO, estimaciones, HECHA) van
    directas a `main` y no cuentan en ningún tope. Nada de un commit por fichero.

16. **Si delegas una fila de documentación en una sesión auxiliar**, pídele explícitamente que lea
    el fichero entero de origen y lo copie tal cual, o que lo suba en trozos verificados. El
    19-sep-2026 una sesión auxiliar retipeó tres ficheros de memoria e introdujo erratas en los
    tres (`docs/COLA.md`, `docs/contexto/ASUNTOS.md`, `docs/HISTORIA.md`).
19. **Una fila solo es HECHA con las dos cosas** (fila 242, `docs/REVISOR-EN-LOCAL.md`, sección 2):
    (1) su commit está en `main` (`git merge-base --is-ancestor <sha-de-la-fila> origin/main`, o
    que aparezca en el historial de `main`); sin esto, nunca HECHA, lo diga la web o no; y (2)
    Vercel lo ha publicado, por el primer camino que funcione: a) `curl` a
    `https://asuntos.fmargon.com/js/version.js?v=<algo>` o a
    `https://gestor-de-asuntos.vercel.app/js/version.js?v=<algo>`: `App.VERSION` igual o posterior
    a la de la fila; b) el estado «Vercel» del commit en GitHub (`success`); c) `list_deployments`
    con el `sha`. Si ninguno funciona, la fila queda **SIN PUBLICACIÓN COMPROBADA** con el SHA de
    `main` en la nota, y la sesión para con normalidad. **Un `create_deployment` por fila con código**
    (es el camino normal, `CLAUDE.md`); si responde 402, no se reintenta (el tope es de toda la cuenta de Vercel,
    `docs/PUBLICAR-SIN-PARAR.md`). Al empezar cada sesión se revisan las filas SIN PUBLICACIÓN
    COMPROBADA con estas mismas dos condiciones: **«la web sirve una versión posterior» solo vale
    si además el commit de la fila está en `main`.**

20. **`docs/COLA.md` por debajo de 40 KB, siempre** (fila 226, `docs/COLA-POR-DEBAJO-DE-40-KB.md`).
    Las filas **HECHA** (salvo las de hoy y las de ayer, que se quedan hasta el día siguiente para
    el «Terminado hoy» del Centro de mando), **DESCARTADA** y **SUSTITUIDA** salen de la tabla; su
    texto completo va a `docs/HISTORIA.md` (o a `docs/COLA-CERRADAS.md` si aquel se hace
    inmanejable). Las notas largas de debajo de la tabla, igual: lo ya resuelto a
    `docs/HISTORIA.md`, lo que sigue abierto, resumido en una o dos líneas aquí o en un documento
    propio de `docs/` enlazado desde aquí. **Toda sesión que deje este documento por encima de
    40 KB (`wc -c`) lo reduce en esa misma subida**, con estos mismos criterios; es una subida solo
    de `docs/`, va directa a `main` (no publica nada).

21. **Novedades visibles** (fila 248, `docs/NOVEDADES-AL-RECARGAR.md`). Al terminar una fila que
    cambia algo que se ve en pantalla, añade su línea al principio de `js/novedades.js` en el mismo
    commit del código (no aparte: cada subida de código es una publicación). Si la fila no cambia
    nada visible, no se añade.

## Reglas para Francisco

- **Una sola conversación de Claude Code a la vez.** Mientras está trabajando, no se lanza otra.
  Las instrucciones nuevas se apuntan aquí y esperan.
- Cada lanzamiento hace **una sola fila**. Cuando Claude Code termina y la publica, se vuelve a
  pegar la misma línea para la siguiente. Si no queda nada pendiente, Claude Code lo dice y no toca
  nada.

## La línea para lanzar

    Lee docs/CONTEXTO.md y después docs/COLA.md. Haz solo la primera fila PENDIENTE, siguiendo las reglas de la cola, sin preguntarme nada, y para. Al terminar, dime en pocas frases qué has hecho, qué versión está publicada y qué voy a ver distinto en pantalla.

## La cola

Las filas 1 a 142 y de la 144 a la 146 están **HECHAS**. **Desde el 27-sep-2026 se hace una sola fila por lanzamiento** (regla 0). Sus documentos siguen en `docs/`, y el detalle de cada una en
`docs/HISTORIA.md`. Aquí queda solo lo que no está cerrado:

| Nº | Instrucción | Estado |
|---|---|---|
| 337 | `docs/REPARTIR-VARIOS-FICHEROS.md` (idea 337 de Francisco, diseñada con él el 13-oct-2026: amplía «Repartir entre terceros» de la fila 141 a varios ficheros sueltos, uno por alumno —por ejemplo, cuestionarios de altas capacidades de un colegio—: botón «Repartir ficheros entre terceros» en la tarjeta «Documentos» de un asunto abierto; se marcan los ficheros, la app propone el alumno por el nombre del fichero o lo de dentro, sin asignar por orden; cada alumno recibe un asunto ya archivado con su fichero, que sale del origen por la papelera; en el origen queda una nota con el reparto; el PDF único sigue como hoy; en los dos cuadros de reparto, al pulsar un fichero o un trozo se ve en grande a la derecha) | HECHA (13-oct-2026 11:00): revisor APROBADA a la primera; en `main` (fusión eb36f1f, PR 256), publicada a propósito (`create_deployment`) y la web sirve `App.VERSION` 13-oct-2026 · 10:49 con `js/repartir-ficheros.js` (200). Pasada completa 285: fallaron 4 pruebas de la tarjeta Documentos porque el botón nuevo partía su título en dos renglones; ahora el botón sale con la tarjeta abierta (cambio hecho después del revisor, comprobado por la prueba nueva y esas 4). Arreglada también una repintada doble en el cuadro de trozos (`change` del campo con foco). Los ficheros no pasan por «Hecho»: los que fallan siguen en el origen y se vuelven a marcar. |
| 336 | `docs/AVISO-RECOGIDA-DE-CORREOS-PARADA.md` (idea 336 de Francisco, diseñada con él el 13-oct-2026: el recolector de correos de Apps Script deja una señal con la hora, `latido.json`, en la carpeta de la bandeja; si tiene más de una hora o no existe, Inicio avisa «La recogida de correos está parada» con los pasos y sus enlaces; desaparece sola al volver; el filtro que etiquetaba todo lo quita Francisco y el proyecto borrado lo restaura él) | HECHA (13-oct-2026 10:15): revisor APROBADA a la segunda (la primera RECHAZADA: un directivo seguía viendo el aviso tras entrar con otro nombre; arreglado); en `main` (fusión 54f3372, PR 255), publicada a propósito (`create_deployment`) y la web sirve `App.VERSION` 13-oct-2026 · 10:08 con `js/bandeja-latido.js` (200). Pasada completa 284: solo falló `guardar-y-enviar-sin-sorpresas` (comprobaba la versión vieja del script; actualizada, pasa). `VERSION_SCRIPT` y `SCRIPT_ESPERADO` pasan a la fila 336: quien tenga el script viejo verá el aviso de «script viejo». Punto 8 [SOLO FRANCISCO] y paso a mano en `docs/TE-TOCA.md`. |
| 338 | `docs/ANADIR-VARIOS-MAS-CLARO.md` (aviso del botón de soporte de Francisco, diseñado con él el 13-oct-2026: en el cuadro «Añadir varios relacionados», «Cancelar», la ✕ y Esc siempre a la vista y, con gente señalada, preguntan «¿Descartar los N señalados?»; pie fijo abajo con los señalados y los botones; «Añadirlos» pasa a «Señalar los N» y el botón final a «Añadir al asunto los N»; arriba, primero las pestañas, luego el buscador, los atajos de Alumnado y al final grupo y lista pegada) | HECHA (13-oct-2026 11:35): revisor APROBADA a la primera; en `main` (fusión cdf6789, PR 257), publicada a propósito (`create_deployment`) y la web sirve `App.VERSION` 13-oct-2026 · 11:31 con `js/varios-cuadro.js` (200). Pasada completa 286: solo falló mi prueba nueva (no esperaba a que la demo estuviera montada; arreglada) y tres pruebas viejas se actualizaron a los textos y sitios nuevos. Decisión: la pregunta de descartar va en el pie del propio cuadro, no en `U.preguntar`, porque ese reutiliza el cuadro y se perdería lo señalado. Los atajos de unidad/nivel/enseñanza señalan al elegir (sin botón); «Señalar los N» está en «Por datos del alumnado». |
| 339 | `docs/REPARTIR-SEGUNDO-PDF.md` (aviso del botón de soporte de Francisco, diseñado con él el 13-oct-2026: en el cuadro de reparto de un PDF entre terceros, al elegir el alumno de un trozo la lista baja al siguiente sin asignar en vez de volver arriba; el segundo PDF de un asunto ya no hereda el reparto del primero: empieza sin asignar y propone leyendo cada trozo; el aviso «se ha quedado sin trozo» no cuenta a quien ya recibió su trozo en otro PDF del asunto) | HECHA (13-oct-2026 12:07): revisor APROBADA a la primera; en `main` (fusión 085aea9, PR 258), publicada a propósito (`create_deployment`) y la web sirve `App.VERSION` 13-oct-2026 · 12:03 con `RepartirCrear.otrosRepartos` (200). Pasada completa 287 de 287. Decisión: el aviso «N páginas no se reparten igual entre M personas» sigue contando a todos los relacionados, también a los que ya recibieron su trozo en otro PDF (el revisor lo vio; no se tocó). |
| 340 | `docs/PERSONAL-EN-EL-CENTRO.md` (aviso del botón de soporte, diseñado con Francisco el 13-oct-2026: el personal, docente y no docente, que sigue en el centro sale en «Nuevo asunto» como «Ya no está en el centro»; se arregla la regla —en el centro quien sale este curso y no tiene cese, o lo tiene hoy o después—; a quien de verdad se fue, solo aviso en ámbar con el motivo, nunca bloqueo; el motivo también en su ficha) | HECHA (13-oct-2026 12:36): revisor APROBADA a la primera; en `main` (fusión cb25801, PR 259), publicada a propósito (`create_deployment`) y la web sirve `App.VERSION` 13-oct-2026 · 12:32 con `Datos.claseDeFichero` en `js/datos-personal.js` (200). Pasada completa 288 de 288. Causa (en `docs/HISTORIA.md`): `esteCurso` se medía con el curso más alto de todos los listados; ahora cada clase de personal se mide con el suyo, y una parte del Centro de datos solo descarta los listados de las clases que trae. Sin datos reales delante, la causa es la más probable, no confirmada: si algún nombre sigue saliendo mal, Francisco lo avisa con el nombre. |
| 341 | `docs/CUADROS-CON-BOTONES-A-LA-VISTA.md` (aviso del botón de soporte de Francisco, diseñado con él el 13-oct-2026: una regla común para todos los cuadros —cabecera con la ✕ y pie con los botones fijos y siempre a la vista, solo el cuerpo se desplaza—; arreglar el cuadro de la captura (lista de casillas por persona en un asunto de grupo de 61), revisar uno a uno todos los cuadros y una prueba automática con ventana baja; nada más cambia en pantalla) | HECHA (13-oct-2026 14:34): revisor APROBADA a la primera; en `main` (fusión f0a142d, PR 260), publicada y comprobada (App.VERSION 13-oct-2026 · 14:33). Cuadro de la captura = «Avisar a los relacionados». Pasada completa en verde (centro-de-datos-entregar-cargos pasó al segundo intento). Esc no cierra «Añadir varios» (ya era así; no es de esta fila). |
| 342 | `docs/REPARTIR-CON-FILTRO.md` (aviso del botón de soporte de Francisco, diseñado con él el 13-oct-2026: en los dos cuadros de reparto —PDF en trozos y varios ficheros—, una zona «Filtrar el alumnado» con varios criterios a la vez (todos deben cumplirse); el alumno asignado desaparece de las listas; con filtro no se rellena por orden; la lectura automática solo asigna dentro del filtro y lo de fuera sale en ámbar con «Asignarlo igualmente»; línea de cuentas pulsable «Documentos sin alumno · Alumnos del filtro sin documento», que avisa sin impedir terminar; solo quedan relacionados los que reciben documento; sin filtro, todo como hoy) | EN CURSO (13-oct-2026) |
| 343 | `docs/REPARTIR-POR-NUMERO-ESCOLAR.md` (idea de Francisco, diseñada con él el 13-oct-2026: en «Repartir entre terceros», si cada página lleva el número escolar —o, si no, el nombre— la app corta donde cambia el alumno y donde empieza otro informe del mismo alumno, en vez de por tamaño fijo; asigna cada trozo buscando en todo el alumnado, sin relacionar antes a nadie; el que no está en el alumnado se crea con los datos del informe; quien recibe trozo queda relacionado con el asunto de origen; caso real: Informe final de etapa de Primaria, 896 páginas, 150 informes) | PENDIENTE (13-oct-2026) |
| 335 | `docs/COMPROBAR-CENTRO-DE-DATOS-Y-VELOCIDAD.md` (idea 335 de Francisco, diseñada con él el 12-oct-2026: **no antes del 18-oct-2026**; revisión única, sin cambiar la app ni publicar: informe corto `docs/INFORME-335-CENTRO-DE-DATOS-Y-VELOCIDAD.md` que dice si el Gestor coge todo lo que ofrece el Centro de datos y si los cambios de velocidad siguen puestos y funcionan, con una semana de medidas de la fila 332; lo que falle se apunta como IDEA) | PENDIENTE (12-oct-2026) |

## Lo que queda por hablar con Francisco (resumen; detalle completo en `docs/HISTORIA.md`)

- (2-oct-2026, fila 259) Pendiente de Francisco: subir los listados reales de Séneca y comprobar que los códigos coinciden (`docs/COMPROBAR-A-MANO.md`). Los documentos de asuntos abiertos con el registro solo en el nombre del fichero (antes de la fila 239) no se miran.
- (2-oct-2026, fila 260) Ese día se mezclaron en el Dropbox del centro los cambios hechos en casa sobre la copia de Drive con los del centro: revisar con Francisco, en el centro, las fichas sin carpeta, los ficheros en conflicto y los números de asunto `A26-…` repetidos (en casa se creó al menos un asunto ese día). Trabajar desde casa directamente contra el Dropbox del centro: `docs/PENDIENTES-DE-DISENAR.md`, punto 2, sin diseñar.
- (varias fechas) Notas viejas sobre pruebas que fallan en `main` y el botón de soporte: movidas sin tocar a `docs/HISTORIA.md` (sección «Notas movidas de `docs/COLA.md` el 7-oct-2026»).

- Del 21-sep-2026: buscador de normativa por texto para rellenar solo la clave de un paso — sigue
  sin diseñarse con Francisco.
- Del 27-sep-2026 (fila 190): falta que Francisco pueda dar de alta un impreso propio del centro
  (sin anexo del BOJA), con un campo nuevo en el catálogo que diga de quién es cada impreso.
- `docs/HISTORIA.md` podría seguir sin la entrada de las filas 53-56 (18-sep-2026: cuadro de
  Séneca en dos columnas, el ayudante fiable, el asunto sin elección, los campos calculados);
  comprobar y pegarla si falta.

## Ideas descartadas, no proponer otra vez

Ver `docs/HISTORIA.md` (informe del 18-sep-2026: editor de Word dentro de la app o plantillas en
Google Docs, un servidor propio, una base de datos del navegador en vez de ficheros, guardar los
cambios uno detrás de otro, un fichero por asunto abierto) y la sección 7 de
`docs/CONTEXTO-CORTO.md`.
