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

13. **El reparto de las subidas** (30-sep-2026, fila 242, `docs/REVISOR-EN-LOCAL.md`). Cada push a
    `main` con código le cuesta una publicación a Vercel, y el plan gratuito solo da 100 al día,
    de toda la cuenta. **Una sola publicación de código por fila**: la fusión de su rama
    `fila-<nº>` en `main` tras la APROBADA del revisor (más la de `pruebas` al nivelarla después).
    Las subidas de solo `docs/` (marca EN CURSO, estimaciones, HECHA) van directas a `main` y no
    publican nada. Nada de un commit por fichero. Ver `docs/NO-GASTAR-PUBLICACIONES.md`.

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
    `main` en la nota, y la sesión para con normalidad. **Como mucho un `create_deployment` a mano
    por sesión**; si responde 402, no se reintenta (el tope es de toda la cuenta de Vercel,
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
| 283 | Aviso de usuario: mejora en «Ficha de un asunto» | DESCARTADA (6-oct-2026): descartada por Francisco desde el Centro de mando |
| 284 | `docs/PLAZOS-LEGALES-EN-LA-BIBLIOTECA.md` (de la auditoría de procedimiento del 6-oct-2026: la biblioteca de hitos trae los plazos legales ya puestos; un plazo se puede contar en meses; un hito de la biblioteca puede llevar plazo y, al llegar a una guía, cuenta desde el hito de arriba; seis hitos que ya estaban reciben su plazo en número y entran siete hitos comunes nuevos —requerir que completen la solicitud, audiencia, pedir informe, cada uno con su espera, y la espera del recurso de alzada—; llega solo al centro, una vez, al entrar, sin pisar ningún plazo ya puesto ni tocar los asuntos abiertos; módulo nuevo `js/plazos-del-centro.js`) | HECHA (7-oct-2026 00:55): revisor APROBADA, en main, Vercel sirve la versión (07-oct-2026 · 00:05, tras un retraso de Vercel de más de una hora) |
| 285 | `docs/HACER-ESTE-HITO.md` (de la auditoría del 6-oct-2026, automatizar: en la pantalla de un hito, un botón «Hacer este hito» que encadena sus tareas con acción: genera el documento y guarda el PDF solo; si hay registro en Séneca se para y sigue sola cuando el PDF sellado está en la carpeta, reconociéndolo sin preguntar; deja el correo preparado con el documento adjunto, con «Enviar» o «Todavía no»; al enviar da el hito por hecho y abre el siguiente; aviso «N listos para enviar» en Inicio; módulo nuevo `js/hacer-este-hito.js`) | HECHA (7-oct-2026 00:55): revisor APROBADA, en main, Vercel sirve la versión (07-oct-2026 · 00:05); punto 13 a mano en `docs/COMPROBAR-A-MANO.md` |
| 286 | `docs/ESPERAS-QUE-SE-CIERRAN.md` (segunda mitad del diseño de la fila 285, va después de ella: al guardar un documento en un asunto que está en espera, el cuadro de nombre lleva una casilla ya marcada «Es lo que se esperaba. Termina la espera», que da el hito por hecho sin cambiar de pantalla, con «Deshacer»; un hito de espera con el plazo vencido lleva el botón «No ha llegado nada», que lo anota y pasa al siguiente; módulo nuevo `js/esperas.js`) | HECHA (7-oct-2026 00:55): revisor APROBADA, en main (882cfa7), Vercel sirve la versión 07-oct-2026 · 00:53 |
| 287 | `docs/PERFIL-DIRECTIVO.md` (idea de Francisco: abrir la aplicación al equipo directivo para consultar y encargar, no para tramitar; primera de tres filas, 287, 289 y 290: en Ajustes → El centro, «Quién usa la aplicación» dice quién es de Dirección, Secretaría o Jefatura de Estudios; quien entra con ese nombre ve solo Inicio y Archivo con los asuntos de su órgano, sin poder cambiar nada; fichero nuevo `perfiles.json`, módulo nuevo `js/perfil.js`) | HECHA (7-oct-2026 04:25) · revisor APROBADA a la primera de este lanzamiento, en `main` (fusión 65c4a07, PR 211), servida en gestor-de-asuntos.vercel.app · conversación: https://claude.ai/code/session_01GT3D9xFzwkzDaLbGtfXf6d. Pruebas completas: fallan en solitario `cabecera-compacta`, `control-registro`, `tutores-legales` y `hacer-este-hito`, también en `main` sin el cambio (entorno de esta sesión) |
| 288 | `docs/AJUSTES-EN-CUATRO-PESTANAS.md` (idea de Francisco: «el módulo de ajustes es un caos»; primera de tres: Ajustes pasa a cuatro pestañas —Lo de cada día, El centro, Este ordenador y Problemas— con un buscador arriba que encuentra cualquier opción; cada sección en un solo sitio; las reparaciones que se usan de vez en cuando pasan a Herramientas; desaparece «Mantenimiento») | HECHA (7-oct-2026 06:20): revisor APROBADA, en `main` (fusión 8167360, PR 212), Vercel sirve la versión |
| 289 | `docs/ENCARGOS-DE-DIRECTIVOS.md` (segunda de tres, va después de la 287: el directivo tiene «Nuevo encargo» y «Mis encargos»; el encargo llega a «Ha llegado» de Inicio con «Crear asunto con él», «Guardar en un asunto que ya existe» y «No procede»; el asunto lo crea Administración, con tercero, fecha límite y quién lo pide ya puestos; fichero nuevo `encargos.json`, módulo nuevo `js/encargos.js`) | HECHA (7-oct-2026 06:22): revisor APROBADA, en `main` (fusión 5c3b801, PR 213), Vercel sirve la versión |
| 290 | `docs/NOTAS-DE-DIRECTIVOS.md` (tercera de tres, va después de la 289: el directivo deja una nota con documentos en un asunto suyo; aviso «N notas de directivos» en Inicio; en la ficha, «Vista» y «Guardar en el asunto»; archivar con notas sin ver pregunta antes; módulo nuevo `js/notas-directivos.js`) | HECHA (7-oct-2026 07:15): revisor APROBADA a la primera, en `main` (fusión 50d8a2b, PR 214), Vercel sirve la versión |
| 291 | `docs/PROBLEMAS-CON-SU-SOLUCION.md` (segunda de tres, va después de la 288: en Ajustes → Problemas, cada aviso es una tarjeta con «Qué pasa», «Por qué» y «Qué hacer», y cada botón dice qué ocurre al pulsarlo y si tiene vuelta atrás; Inicio y el menú avisan con «N problemas por resolver»; módulo nuevo `js/problemas.js`) | HECHA (7-oct-2026 09:20): revisor APROBADA a la segunda (la primera, solo por la demostración), en `main` (fusión 2178834, PR 215), Vercel sirve la versión; punto 13 a mano |
| 292 | `docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md` (tercera de tres, va después de la 291: los hitos de un asunto que cambió de nombre pueden volver a él; «Buscar su carpeta» propone la que más se parece; al elegir entre dos versiones guardadas a la vez se ve en qué se diferencian; los asuntos que se repiten preguntan antes de crearse) | HECHA (7-oct-2026 10:48): revisor APROBADA a la primera, en `main` (fusión 21e6a05, PR 216), Vercel sirve la versión; punto 11 a mano |
| 293 | `docs/TRABAJO-EN-BLOQUE.md` (idea de Francisco: tareas en bloque, como un certificado para toda una clase; primera de cuatro, 293 a 296: en «Nuevo asunto», «Es para un grupo de personas» crea un solo asunto para una unidad, un nivel o un grupo, con una sola carpeta; en su ficha, tarjeta «Personas del grupo» con una fila por persona y lo que se le ha generado, registrado y enviado, calculado de lo que ya se guarda; «Generar para todos» desde ahí; la ficha de cada persona dice en «Sus asuntos» qué se le hizo y cuándo; módulos nuevos `js/asunto-de-grupo.js` y `js/personas-del-grupo.js`) | HECHA (7-oct-2026 12:35): revisor APROBADA a la primera, en `main` (fusión b987e6e, PR 217), Vercel sirve la versión |
| 297 | `docs/PREGUNTA-DE-LA-BIBLIOTECA-AL-GUARDAR.md` (aviso de usuario: al cambiar el nombre de un hito y guardar la guía, la ventana «¿solo aquí o también en la biblioteca?» no se cerraba; salía una pregunta por cada hito de la biblioteca distinto de su modelo, tocado o no, todas iguales a la vista; ahora solo pregunta por los hitos cambiados esta vez, dice de cuál habla, enseña solo lo cambiado con «Antes» y «Ahora», sube a la biblioteca solo esos campos y lleva «Cancelar», que vuelve a la guía sin guardar nada; de paso, comprobar la pantalla que dice el botón de soporte) | HECHA (7-oct-2026 16:00): revisor APROBADA a la primera, en `main` (fusión 93a1c98, PR 221), Vercel sirve la versión · aviso completo: https://drive.google.com/file/d/16M5QZivlkiP12JmzxNUZD3jcptxvJkmM/view?usp=drivesdk |
| 294 | `docs/TRABAJO-EN-BLOQUE-PDF-Y-REGISTRO.md` (segunda de cuatro, va después de la 293: «Generar para todos» enseña antes uno de muestra y deja ya el PDF de cada persona, con su referencia «Ref. D26-…» al pie; al guardar en la carpeta los PDF sellados que se descargan de Séneca, la app reconoce de quién es cada uno por esa referencia y lo marca en la tabla; lo que no reconoce sale con «¿De quién es?»; módulos nuevos `js/grupo-generar.js` y `js/grupo-registro.js`) | HECHA (7-oct-2026 13:15): revisor APROBADA a la primera, en `main` (fusión 70b82b0, PR 218), Vercel sirve la versión; punto 13 a mano |
| 295 | `docs/TRABAJO-EN-BLOQUE-ENVIAR-A-TODOS.md` (tercera de cuatro, va después de la 294: «Enviar…» en la tabla enseña un correo de muestra y a quién va, y con un botón manda un correo a cada persona con su PDF registrado; los fallos, con «Reintentar»; si Google corta por el tope del día, «Seguir enviando» al día siguiente sin repetir a nadie; «Enviar un aviso…» hace lo mismo sin documento; un solo PDF `CORREO` por tanda; módulos nuevos `js/grupo-enviar.js` y `js/grupo-avisos.js`) | HECHA (7-oct-2026 15:40): revisor APROBADA a la primera, en `main` (fusión 4fc68f4, PR 219), Vercel sirve la versión; punto 15 a mano |
| 296 | `docs/TRABAJO-EN-BLOQUE-LISTA-PEGADA.md` (cuarta de cuatro, va después de la 293: al formar un grupo, «Pegar una lista» de Séneca o de una hoja de cálculo, o elegir el fichero; la app reconoce a cada persona por su número, su DNI o su nombre, pregunta cuando hay dos iguales y dice a quién no encuentra; se puede guardar como grupo; módulo nuevo `js/lista-pegada.js`) | HECHA (7-oct-2026 15:40): revisor APROBADA a la primera, en `main` (fusión 92843a1, PR 220), Vercel sirve la versión; punto 11 a mano |
| 298 | Aviso de usuario: error en «Inicio» | DESCARTADA (7-oct-2026): descartada por Francisco desde el Centro de mando |
| 299 | `docs/CORREO-AL-TUTOR-DEL-GRUPO.md` (aviso de usuario: el correo de un hito va solo al tutor/a del grupo del alumno; una plantilla de correo adjunta sola un documento; cambios pedidos en SANCIÓN) | HECHA (7-oct-2026 20:00): revisor APROBADA a la primera, en `main` (fusión 91c41af, PR 222), Vercel sirve la versión; punto 12 a mano · aviso completo: https://drive.google.com/file/d/1XW4NDCPJZ0DmAZ66hzSD568VW8jrRelI/view?usp=drivesdk |
| 300 | `docs/ORDEN-DE-LA-GUIA-LLEGA-A-LOS-ASUNTOS.md` (aviso de usuario: al subir un hito en «Cambiar la guía» el asunto seguía igual; el orden nuevo llega a los asuntos abiertos del tipo, solo para los hitos sin hacer, y el aviso verde lo dice) | HECHA (7-oct-2026 20:00): revisor APROBADA a la primera, en `main` (fusión cc39979, PR 223), Vercel sirve la versión · aviso completo: https://drive.google.com/file/d/1whMmWcTx9RweW0jXrfPfBf4EN249LDHj/view?usp=drivesdk |
| 301 | `docs/REGLAS-DE-ACUERDO.md` (una sola regla por asunto) | HECHA (7-oct-2026 18:35): solo documentación, directa a `main`. 5 contradicciones resueltas, sin ninguna por decidir; el tope de `docs/CONTEXTO-CORTO.md` se corrige a 40.000 caracteres (mide 39.540); `CLAUDE.md` sin tocar. Detalle en `docs/HISTORIA.md` |
| 302 | `docs/PRUEBAS-ROTAS.md` (arreglar o retirar las que fallan) | HECHA (7-oct-2026 20:00): en `main` (fusión c159edb, PR 224), solo pruebas, `CLAUDE.md` y `docs/`. Pasada completa en verde (260 de 260, 1 retirada: `tutores-legales`, en `docs/PRUEBAS-RETIRADAS.md`); 10 pruebas arregladas; `EN_SOLITARIO` en 19 con tope 20. Fallo real de la aplicación: al crear un asunto desde el control de registro no se reconoce como ya conocido a un tutor legal ni a una administración. A mirar: unos segundos después de pulsar «N encargos» en «Ha llegado», la vista vuelve sola a enseñar correos y documentos juntos (sin confirmar) · TROPIEZO T7: dos sesiones trabajaron la fila 302 a la vez; la retomada (18:31) descartó su trabajo al ver la fusión de la otra |
| 303 | `docs/CARPETAS-PERDIDAS-QUE-ESTAN-ARCHIVADAS.md` (idea de Francisco: en «asuntos que han perdido su carpeta», «Buscar su carpeta» solo ofrecía una, y equivocada; la carpeta estaba en el ARCHIVO con el tipo escrito de otra forma; la app busca sola la carpeta de cada asunto perdido entre las abiertas y en el ARCHIVO, enseña la lista con un solo botón «Enlazar los N», y «Buscar su carpeta» pasa a buscar por palabras entre todas; si la carpeta ya tiene asunto, los une en uno; si está archivada, el asunto queda archivado; además, buscar por qué pasó; módulos nuevos `js/carpetas-perdidas-buscar.js` y `js/carpetas-perdidas-enlazar.js`) [recorte: https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E · 3d6fbeae01684de43e42aa8e862c770a] | HECHA (8-oct-2026 10:50): en `main` (fusión 20dac70, PR 225), publicada (web con `App.VERSION` 08-oct-2026 · 10:44 y el bloque «Enlazar los N» a la vista). Revisor: APROBADA a la primera (el punto 14 queda para Francisco, en `docs/COMPROBAR-A-MANO.md` y `docs/TE-TOCA.md`). Causa encontrada y corregida: `App.renombrarTipo` dejaba la ficha vieja sin carpeta. Pasada completa: fallaron 8; las de mi cambio, arregladas; `perfil` y `exportar-asuntos` fallaron solo por la carga y pasan en solitario (no entran en `EN_SOLITARIO`: tope de 20); `hacer-este-hito` y `conflictos-que-cambia` fallan igual en `main` y se retiran a `RETIRADAS`. TROPIEZO T9: el navegador del entorno no era el que pide Playwright (hubo que usar `CHROMIUM_PATH`) y dos pruebas fallan igual sin mi cambio. |
| 304 | Aviso de usuario: mejora en «Ajustes» [nota de Francisco: Esto ya lo estamos diseñando. Se llama Centro de Datos Ies. De todos modos revisalo.] | IDEA (8-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1N7V13ibj8MMkJdU_EQub5jDLfAS9HWPe/view?usp=drivesdk |
| 305 | `docs/CONTACTO-DEL-ENCARGO-DONDE-HACE-FALTA.md` (aviso de usuario: el teléfono o el correo apuntado en «El encargo» sale en la cabecera del asunto y de cada hito, con botón de copiar; el correo escrito a mano sale marcado en «Para» y lo usan «Enviar estado» y los avisos; huecos nuevos para plantillas) | HECHA (8-oct-2026 12:57) · en main 02028a7, publicada (vercel.app sirve 08-oct-2026 · 12:56); revisor APROBADA a la 2.ª (la 1.ª: copiar apagado en solo consultar, arreglado) · TROPIEZO T9: `node_modules` va en git como enlace y Playwright pedía un Chromium que no está; con `npm ci` y `CHROMIUM_PATH` las pruebas pasan · aviso completo: https://drive.google.com/file/d/1GqLZRcf1OGRMrQi81d4Z98z2UhMs3_Tz/view?usp=drivesdk |
| 306 | `docs/ACTIVIDADES-EXTRAESCOLARES.md` (idea de Francisco, movida desde Club Tolox Corre, idea 96: control de las actividades extraescolares; primera de cuatro filas, 306, 309, 310 y 311: fichero nuevo `actividades.json` con cada actividad; al elegir el tipo ACTIVIDAD EXTRAESCOLAR en «Nuevo asunto», botón «Apuntar la actividad» con nombre, fechas, horas, lugar, departamento, unidades convocadas con su alumnado ya marcado para desmarcar a quien no va, y profesorado con «Organiza» o «Acompaña»; crea un asunto de grupo con el alumnado; tarjeta «La actividad» en la ficha, con «Cambiar» y «Anular la actividad»; cuenta como realizada al pasar su fecha; módulos nuevos `js/actividades.js`, `js/actividades-formulario.js` y `js/actividades-ficha.js`) | DEVUELTA (9-oct-2026): retomada tras la primera devolución; el revisor la rechazó otras dos veces. Primera vez: punto 10 (la línea de resumen de la tarjeta «La actividad» se cortaba con «…»); arreglada en dos renglones. Segunda vez: otra vez el punto 10 (el segundo renglón, «10 alumnos/as · 3 profesores/as · P…», sigue cortándose y «Prevista»/«Realizada» no se lee). Los otros 17 puntos y las 3 fijas, BIEN; el punto 13 de la devolución anterior, arreglado y BIEN. Todo el trabajo está en la rama `fila-306` (commit 0321151), `main` sin tocar. Pasada completa hecha en verde. Para retomar: resumen en tres renglones (fecha · lugar / alumnado · profesorado / situación) en `resumirActividad` de `js/ficha-tarjetas-resumen.js` y actualizar la línea 166 de `pruebas/actividades.mjs`. Las filas 309, 310 y 311 dependen de ella y no se pueden hacer hasta que esté en `main`. TROPIEZO T9: `node_modules` va en git como enlace roto y hubo que hacer `npm ci` y `CHROMIUM_PATH`
| 307 | `docs/INFORME-EN-PDF-QUE-PIERDE-ASUNTOS.md` (aviso de usuario: el informe en PDF de «Exportar» pierde asuntos al pasar de página, y «Imprimir» saca una hoja de más) | HECHA (8-oct-2026 14:16) · aviso completo: https://drive.google.com/file/d/1_PD6Uw_Hx_w8FgQQzgMr_qHY3KaIJ3u9/view?usp=drivesdk · Nota: revisor APROBADA a la primera; fusionado en `main` (PR 226, 57444c6) y publicado (`gestor-de-asuntos.vercel.app` sirve `App.VERSION` 14:12 con `js/exportar-informe-comprobar.js`; `asuntos.fmargon.com` no se pudo abrir desde el entorno, la de vercel.app sí). Las tres causas arregladas y comprobadas; `informe-agrupado.mjs` se ajustó (una tabla por página en vez de una sola). `css/word-visor.css` tiene el mismo fallo de última página con salto forzado al imprimir: sin tocar. TROPIEZO nuevo: `node_modules` estaba subido a git como enlace roto a sí mismo; reinstalado con `npm ci` para probar y restaurado tal cual. |
| 308 | `docs/TITULO-DEL-INFORME-EN-PDF.md` (idea de Francisco: en «Exportar ▾ → Informe en PDF», casilla «Título» que trae «Listado de asuntos» y se puede cambiar; el título sale en la hoja y en el nombre del fichero PDF) | HECHA (8-oct-2026 17:20) · revisor APROBADA a la primera; en `main` (fusión 1413691, PR 227), publicada (vercel.app sirve `App.VERSION` 17:17 con la novedad 308). Casilla «Título» en el informe en PDF; sale en la hoja, la barra y el nombre del fichero. En el Chromium sin pantalla un nombre de descarga con tilde sale como «download»; la prueba usa un título sin tilde |
| 309 | `docs/ACTIVIDADES-EXTRAESCOLARES-AVISO.md` (segunda de cuatro, va después de la 306: en la tarjeta «La actividad», botón «Avisar al claustro» que genera un informe en PDF con los datos de la actividad y el alumnado que va, por unidades, y abre el correo con el informe adjunto y el grupo del profesorado ya puesto en copia oculta; el grupo se elige en Ajustes → El centro; si la lista cambia después del aviso, la tarjeta lo dice y ofrece «Volver a avisar»; módulo nuevo `js/actividades-informe.js`) | PENDIENTE (8-oct-2026) |
| 310 | `docs/ACTIVIDADES-EXTRAESCOLARES-PANTALLA.md` (tercera de cuatro, va después de la 306: en Herramientas, pantalla «Actividades extraescolares» con una tabla de todas, buscador, filtros por curso, profesor, unidad y situación, y «Exportar» a hoja de cálculo; «+ Nueva actividad» y «+ Apuntar una actividad antigua», en corto, sin alumnado ni asunto; módulos nuevos `js/actividades-pantalla.js`, `js/actividades-antigua.js` y `js/actividades-exportar.js`) | PENDIENTE (8-oct-2026) |
| 311 | `docs/ACTIVIDADES-EXTRAESCOLARES-CERTIFICADO.md` (cuarta de cuatro, va después de la 306 y la 310: tipo de asunto CERTIFICADO ACTIVIDADES EXTRAESCOLARES, a nombre del profesor, con «Actividades desde» y «Actividades hasta»; su plantilla lleva una tabla con una línea por actividad realizada, que dice «Organización» o «Acompañante»; la ficha del profesor enseña sus actividades; módulo nuevo `js/actividades-tabla.js`) | PENDIENTE (8-oct-2026) |
| 312 | `docs/BEBER-DEL-CENTRO-DE-DATOS.md` (idea de Francisco: un centro de datos del que beban sus aplicaciones, proyecto aparte `centro-de-datos-ies`; primera de dos filas, 312 y 313: el gestor señala una vez por ordenador la carpeta «CENTRO DE DATOS» de Drive y, al entrar, coge él solo lo nuevo —alumnado, personal, alumnado de la base de datos, función tutorial, Consejo Escolar y registro de entrada y salida— pasándolo por la importación de siempre; donde hoy se sube a mano sale «Datos del Centro de datos, de <fecha>» y la subida a mano se queda; módulos nuevos `js/centro-de-datos*.js`; no necesita que el Centro de datos esté terminado) | EN CURSO (9-oct-2026) |
| 313 | `docs/CONFIGURACION-DEL-CENTRO-DE-DATOS.md` (segunda de dos, va después de la 312: los datos del centro y la firma de los correos se escriben una vez en el Centro de datos; el gestor los copia a `plantillas.json` y en Ajustes → El centro salen sin poder cambiarse, con «Se cambia en el Centro de datos»; la dirección con la que cada persona envía correo no cambia) | PENDIENTE (8-oct-2026) |

## Lo que queda por hablar con Francisco (resumen; detalle completo en `docs/HISTORIA.md`)

- (6-oct-2026, fila 268) Francisco: volver a pegar `apps-script/soporte.gs`, ejecutar `prepararTodo` (Google pedirá un permiso nuevo, una vez), leer el correo de resumen e «Implementar» → «Nueva versión»; el mismo pegado vale para las filas 240, 261 y 262. Opcional: propiedad `CORREO_AVISOS`. Pasos en `docs/COMPROBAR-A-MANO.md`.
- (2-oct-2026, fila 259) Pendiente de Francisco: subir los listados reales de Séneca y comprobar que los códigos coinciden (`docs/COMPROBAR-A-MANO.md`). Los documentos de asuntos abiertos con el registro solo en el nombre del fichero (antes de la fila 239) no se miran.
- (4-oct-2026, fila 262) Francisco: añadir `Focus_Lingo` al permiso «Soporte del Gestor» de GitHub y volver a pegar `apps-script/soporte.gs`, ejecutar `prepararTodo` e «Implementar» → «Nueva versión» (mismo pegado que 240 y 261; pasos en `docs/COMPROBAR-A-MANO.md`). `pruebas` no es ascendiente de `main`: no se nivela.
- (2-oct-2026, fila 261) Volver a pegar `apps-script/soporte.gs`, ejecutar `prepararTodo` (leer el registro; autorizar el correo) e «Implementar» → «Nueva versión»; el mismo pegado vale para la fila 240.
- (2-oct-2026, fila 260) Ese día se mezclaron en el Dropbox del centro los cambios hechos en casa sobre la copia de Drive con los del centro: revisar con Francisco, en el centro, las fichas sin carpeta, los ficheros en conflicto y los números de asunto `A26-…` repetidos (en casa se creó al menos un asunto ese día). Trabajar desde casa directamente contra el Dropbox del centro: `docs/PENDIENTES-DE-DISENAR.md`, punto 2, sin diseñar.
- (varias fechas) Notas viejas sobre pruebas que fallan en `main` y el botón de soporte: movidas sin tocar a `docs/HISTORIA.md` (sección «Notas movidas de `docs/COLA.md` el 7-oct-2026»).

- Vercel: el tope diario de despliegues es de toda la cuenta, no solo de este proyecto; Francisco
  decide si separa cuentas, cambia de plan, o coordina cuándo se trabaja cada cola.
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
