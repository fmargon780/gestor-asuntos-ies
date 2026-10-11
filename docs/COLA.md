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
| 310 | `docs/ACTIVIDADES-EXTRAESCOLARES-PANTALLA.md` (tercera de cuatro, va después de la 306: en Herramientas, pantalla «Actividades extraescolares» con una tabla de todas, buscador, filtros por curso, profesor, unidad y situación, y «Exportar» a hoja de cálculo; «+ Nueva actividad» y «+ Apuntar una actividad antigua», en corto, sin alumnado ni asunto; módulos nuevos `js/actividades-pantalla.js`, `js/actividades-antigua.js` y `js/actividades-exportar.js`) | HECHA (10-oct-2026 03:58): revisor APROBADA a la primera, en `main` (fusión 1820b57, PR 241), web sirve `js/actividades-pantalla.js` (versión 03:57). Pasada completa 272 de 274; las 2 que fallaban (`novedades`: mi novedad era demasiado larga; `plantillas-pantalla`: el orden de bloques) arregladas. Decisión: «Quitar» no toca el curso elegido. TROPIEZO T9: `novedades.mjs` no usa CHROMIUM_PATH y pide otro Chromium (1243); lo resolví con un enlace en /opt/pw-browsers. |
| 311 | `docs/ACTIVIDADES-EXTRAESCOLARES-CERTIFICADO.md` (cuarta de cuatro, va después de la 306 y la 310: tipo de asunto CERTIFICADO ACTIVIDADES EXTRAESCOLARES, a nombre del profesor, con «Actividades desde» y «Actividades hasta»; su plantilla lleva una tabla con una línea por actividad realizada, que dice «Organización» o «Acompañante»; la ficha del profesor enseña sus actividades; módulo nuevo `js/actividades-tabla.js`) | HECHA (10-oct-2026 04:55): revisor APROBADA a la primera, en `main` (fusión aee4587, PR 242), web sirve `js/actividades-tabla.js` (versión 04:51). Pasada completa 272 de 275: `campo-desde-el-asunto` y `convertir-en-plantilla-pantalla` actualizadas (dos campos y una plantilla más en la copia de pruebas); `hitos-no-huerfanos-al-archivar` pasa en solitario. Decisión: la tablita de la ficha está donde ya viven «Datos de las tablas» (tarjeta «Datos y contacto»). |
| 323 | `docs/NUCLEO-GESTOR-FICHA-DEL-CENTRO-DE-DATOS.md` (plan «el Centro de datos como núcleo», `docs/PLAN-NUCLEO.md`, diseñado con Francisco el 10-oct-2026; única fila del Gestor, sin condición: el Gestor acepta `ALUMNADO-BD.json` venga de quien venga —hoy lo hace la base de datos de alumnado, después lo hará el Centro de datos—; se deja atado con pruebas, tres frases dicen de dónde viene de verdad y se ponen al día las copias de los acuerdos; con el fichero de hoy no cambia nada en pantalla) | HECHA (10-oct-2026 06:47). Revisor: APROBADA a la primera. Publicado y comprobado (la web sirve 10-oct-2026 · 06:46 con el código nuevo). Nota: de código solo `AlumnadoBD.hechoPor` y tres frases; `nucleo=1` en la demo; prueba `pruebas/nucleo-ficha-del-centro.mjs`. `exportar-asuntos.mjs` falló en la pasada completa y pasa en solitario: va a EN_SOLITARIO (20 de 20, tope alcanzado). `docs/ACUERDO-ALUMNADO.md` puesto al día aquí; falta copiarlo idéntico en `bd-alumnado-ies`. La rama `pruebas` ya no existe en origin, no se nivela. |
| 324 | `docs/FECHA-REAL-DEL-LISTADO.md` (apuntada al escribir la fila 323 y diseñada con Francisco: sin la carpeta de la base de datos de alumnado señalada, la «Comprobación al entrar» decía que la copia del alumnado era más vieja que el listado de matrícula sin serlo, porque miraba el día en que el listado se copió; ahora se compara con la fecha real del listado, la de «Lo que tengo ahora», en la comprobación al entrar, al decidir qué datos mandan y en el aviso de alumnado viejo; sin fecha real apuntada no avisa y manda la base de datos de alumnado; si la copia es vieja de verdad, la frase dice las dos fechas y quién actualiza; función nueva `DatosQueTengo.fechaReal`) | HECHA (11-oct-2026 05:22): comprobada después: la web sirve `App.VERSION` 11-oct-2026 · 05:14 y `js/demo/copia-alumnado.js` da 200, con el commit 870fbfc en `main`; antes: revisor APROBADA a la segunda (la primera RECHAZADA: la demostración no repetía la comprobación al entrar tras montar la copia; arreglado); en `main` (fusión 870fbfc, PR 245, `App.VERSION` 11-oct-2026 · 00:48), pero Vercel no ha publicado: `create_deployment` a mano da 402 «api-deployments-free-per-day»; la web sigue sirviendo la de las 00:51 y `js/demo/copia-alumnado.js` da 404. No se reintenta. Pasada completa 276 de 278: `hitos-no-huerfanos-al-archivar.mjs` y `por-liquidar-al-cambiar-tipo.mjs` fallaron bajo carga y en solitario pasan (`EN_SOLITARIO` está en el tope de 20, no han entrado). Decisiones: el aviso de alumnado viejo usa `fechaReal` del fichero elegido (o la copia si da 0); la prueba de frescura usa 400 días en vez de 40 para no depender de la época. TROPIEZO T5: tope diario de Vercel (más de 100). TROPIEZO T10: ninguna prueba flaca puede entrar en `EN_SOLITARIO` (tope 20). |
| 325 | `docs/VERSION-NUEVA-SIN-FRANJA.md` (idea de Francisco: preguntó por qué el Gestor tiene el problema del bloqueo de la red del centro para actualizarse y BD Alumnado y el Centro de datos no; al pulsar «Entrar», la copia sin internet pide también el permiso de su carpeta y, si hay versión nueva, la baja, recarga y entra sola; con la aplicación abierta, en la copia y en la web, ya no sale la franja amarilla sino una marca «hay versión nueva» junto al número de versión, que pregunta antes de recargar; la franja queda solo para cuando algo falla; módulos nuevos `js/marca-version.js` y `js/aviso-version-web.js`) | HECHA (11-oct-2026 00:40): comprobada después: la web sirve `App.VERSION` 10-oct-2026 · 16:51 y `js/marca-version.js` da 200; antes: revisor APROBADA a la primera; en `main` (fusión d744ee0, PR 244, `App.VERSION` 10-oct-2026 · 08:27), pero Vercel no ha publicado: el bot de Vercel dice «Resource is limited … api-deployments-free-per-day»; la web sigue sirviendo la de las 06:46 y `js/marca-version.js` da 404. No se ha reintentado. Pasada completa 275 de 277: `perfil.mjs` y `por-liquidar-al-cambiar-tipo.mjs` fallaron bajo carga y en solitario pasan (`EN_SOLITARIO` está en el tope de 20, no han entrado). Decisiones: la petición del permiso de la copia sale en la tanda de `pedirAlEntrar`; la marca se vuelve a colgar con un observador de `#usuario-pie`. TROPIEZO T5: tope diario de Vercel (más de 100). TROPIEZO T10: ninguna prueba nueva puede entrar en `EN_SOLITARIO` (tope 20). Punto 11 en `docs/COMPROBAR-A-MANO.md` y `docs/TE-TOCA.md`. |
| 326 | `docs/BOTON-UNICO-DE-SOPORTE.md` (idea de Francisco, diseñada con él el 11-oct-2026: el Gestor deja su botón «Soporte» copiado y usa el botón único de `fmargon780/soporte-apps`, que pide a Google después de cargar; sin conexión con Google no sale ningún botón; se quita el bloque «Buzón de soporte» de Ajustes → El centro y lo que copiaba su dirección desde el Centro de datos; se borra de aquí el programa del buzón y sus pruebas; `vercel.json` deja pasar los dos sitios de Google; módulo nuevo `js/soporte-cargar.js`) | EN CURSO (11-oct-2026 05:22) · conversación: https://claude.ai/code/session_01SkiSVuJxmuxKnQG7hT8bRM |
| 327 | `docs/PERSONAL-DEL-CENTRO-DE-DATOS.md` (apuntada al diseñar la idea 11 del Centro de datos y diseñada con Francisco el 11-oct-2026: el Gestor lee el personal ya preparado por el Centro de datos —una parte por curso, copiada a `_GESTOR/datos`— en vez de abrir cada `RelPerCen`; la subida a mano se queda y, curso por curso, gana si es más nueva; quien viene sin DNI sigue saliendo, con nombre y puesto; los avisos del curso de ahora salen en Ajustes → Problemas, en tres tarjetas; la copia del acuerdo está en `docs/ACUERDO-PERSONAL.md`; módulos nuevos `js/centro-de-datos-personal.js`, `js/datos-personal-hecho.js` y `js/problemas-personal.js`) | PENDIENTE (11-oct-2026) |
| 328 | `docs/ENTREGAR-EMPRESAS-AL-CENTRO-DE-DATOS.md` (idea 23 de la cola del Centro de datos, diseñada con Francisco el 11-oct-2026: el Gestor entrega solo al Centro de datos la lista entera de empresas —razón social, nombre comercial, NIF, contacto, teléfono y correo— al entrar y tras cada cambio, dejando un fichero en su carpeta `entrada/`; solo entrega si el Centro de datos dice en su índice que la recibe, así que no espera a su fila 23; el permiso de esa carpeta pasa a pedirse para leer y escribir, un clic una vez por ordenador; una línea nueva en Ajustes → Este ordenador; nada cambia en «Personas y empresas»; módulo nuevo `js/centro-de-datos-entregar.js`) | PENDIENTE (11-oct-2026) |
| 329 | `docs/ENTREGAR-ADMINISTRACIONES-AL-CENTRO-DE-DATOS.md` (idea 24 de la cola del Centro de datos, diseñada con Francisco el 11-oct-2026: el Gestor entrega solo al Centro de datos la lista entera de Administraciones —organismos y centros, con todos sus datos y sus departamentos— por el camino de la fila 328, sin la que no se puede hacer; no espera a la fila 24 del Centro de datos; una línea más en Ajustes → Este ordenador; nada cambia en «Personas y empresas») | PENDIENTE (11-oct-2026) |
| 330 | `docs/ENTREGAR-CARGOS-AL-CENTRO-DE-DATOS.md` (idea 25 de la cola del Centro de datos, diseñada con Francisco el 11-oct-2026: el Gestor entrega solo al Centro de datos los cargos del centro con todos sus ocupantes, por el camino de la fila 328, sin la que no se puede hacer; no espera a la fila 25 del Centro de datos; una línea más en Ajustes → Este ordenador; nada cambia en «Cargos del centro») | PENDIENTE (11-oct-2026) |

## Lo que queda por hablar con Francisco (resumen; detalle completo en `docs/HISTORIA.md`)

- (9-oct-2026, fila 315) Francisco: añadir `centro-de-datos-ies` al permiso «Soporte del Gestor» de GitHub y volver a pegar `apps-script/soporte.gs` (`prepararTodo`, «Nueva versión»); el mismo pegado vale para los demás pendientes del buzón.
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
