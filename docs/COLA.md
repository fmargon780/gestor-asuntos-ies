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
| 303 | `docs/CARPETAS-PERDIDAS-QUE-ESTAN-ARCHIVADAS.md` (idea de Francisco: en «asuntos que han perdido su carpeta», «Buscar su carpeta» solo ofrecía una, y equivocada; la carpeta estaba en el ARCHIVO con el tipo escrito de otra forma; la app busca sola la carpeta de cada asunto perdido entre las abiertas y en el ARCHIVO, enseña la lista con un solo botón «Enlazar los N», y «Buscar su carpeta» pasa a buscar por palabras entre todas; si la carpeta ya tiene asunto, los une en uno; si está archivada, el asunto queda archivado; además, buscar por qué pasó; módulos nuevos `js/carpetas-perdidas-buscar.js` y `js/carpetas-perdidas-enlazar.js`) [recorte: https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E · 3d6fbeae01684de43e42aa8e862c770a] | HECHA (8-oct-2026 10:50): en `main` (fusión 20dac70, PR 225), publicada (web con `App.VERSION` 08-oct-2026 · 10:44 y el bloque «Enlazar los N» a la vista). Revisor: APROBADA a la primera (el punto 14 queda para Francisco, en `docs/COMPROBAR-A-MANO.md` y `docs/TE-TOCA.md`). Causa encontrada y corregida: `App.renombrarTipo` dejaba la ficha vieja sin carpeta. Pasada completa: fallaron 8; las de mi cambio, arregladas; `perfil` y `exportar-asuntos` fallaron solo por la carga y pasan en solitario (no entran en `EN_SOLITARIO`: tope de 20); `hacer-este-hito` y `conflictos-que-cambia` fallan igual en `main` y se retiran a `RETIRADAS`. TROPIEZO T9: el navegador del entorno no era el que pide Playwright (hubo que usar `CHROMIUM_PATH`) y dos pruebas fallan igual sin mi cambio. |
| 304 | Aviso de usuario: mejora en «Ajustes» [nota de Francisco: Esto ya lo estamos diseñando. Se llama Centro de Datos Ies. De todos modos revisalo.] | DESCARTADA (9-oct-2026): repetida, ya cubierta por el Centro de datos y las filas 312 y 313 · enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1N7V13ibj8MMkJdU_EQub5jDLfAS9HWPe/view?usp=drivesdk |
| 305 | `docs/CONTACTO-DEL-ENCARGO-DONDE-HACE-FALTA.md` (aviso de usuario: el teléfono o el correo apuntado en «El encargo» sale en la cabecera del asunto y de cada hito, con botón de copiar; el correo escrito a mano sale marcado en «Para» y lo usan «Enviar estado» y los avisos; huecos nuevos para plantillas) | HECHA (8-oct-2026 12:57) · en main 02028a7, publicada (vercel.app sirve 08-oct-2026 · 12:56); revisor APROBADA a la 2.ª (la 1.ª: copiar apagado en solo consultar, arreglado) · TROPIEZO T9: `node_modules` va en git como enlace y Playwright pedía un Chromium que no está; con `npm ci` y `CHROMIUM_PATH` las pruebas pasan · aviso completo: https://drive.google.com/file/d/1GqLZRcf1OGRMrQi81d4Z98z2UhMs3_Tz/view?usp=drivesdk |
| 306 | `docs/ACTIVIDADES-EXTRAESCOLARES.md` (idea de Francisco, movida desde Club Tolox Corre, idea 96: control de las actividades extraescolares; primera de cuatro filas, 306, 309, 310 y 311: fichero nuevo `actividades.json` con cada actividad; al elegir el tipo ACTIVIDAD EXTRAESCOLAR en «Nuevo asunto», botón «Apuntar la actividad» con nombre, fechas, horas, lugar, departamento, unidades convocadas con su alumnado ya marcado para desmarcar a quien no va, y profesorado con «Organiza» o «Acompaña»; crea un asunto de grupo con el alumnado; tarjeta «La actividad» en la ficha, con «Cambiar» y «Anular la actividad»; cuenta como realizada al pasar su fecha; módulos nuevos `js/actividades.js`, `js/actividades-formulario.js` y `js/actividades-ficha.js`) | DEVUELTA (9-oct-2026): retomada tras la primera devolución; el revisor la rechazó otras dos veces. Primera vez: punto 10 (la línea de resumen de la tarjeta «La actividad» se cortaba con «…»); arreglada en dos renglones. Segunda vez: otra vez el punto 10 (el segundo renglón, «10 alumnos/as · 3 profesores/as · P…», sigue cortándose y «Prevista»/«Realizada» no se lee). Los otros 17 puntos y las 3 fijas, BIEN; el punto 13 de la devolución anterior, arreglado y BIEN. Todo el trabajo está en la rama `fila-306` (commit 0321151), `main` sin tocar. Pasada completa hecha en verde. Para retomar: resumen en tres renglones (fecha · lugar / alumnado · profesorado / situación) en `resumirActividad` de `js/ficha-tarjetas-resumen.js` y actualizar la línea 166 de `pruebas/actividades.mjs`. Las filas 309, 310 y 311 dependen de ella y no se pueden hacer hasta que esté en `main`. TROPIEZO T9: `node_modules` va en git como enlace roto y hubo que hacer `npm ci` y `CHROMIUM_PATH`
| 307 | `docs/INFORME-EN-PDF-QUE-PIERDE-ASUNTOS.md` (aviso de usuario: el informe en PDF de «Exportar» pierde asuntos al pasar de página, y «Imprimir» saca una hoja de más) | HECHA (8-oct-2026 14:16) · aviso completo: https://drive.google.com/file/d/1_PD6Uw_Hx_w8FgQQzgMr_qHY3KaIJ3u9/view?usp=drivesdk · Nota: revisor APROBADA a la primera; fusionado en `main` (PR 226, 57444c6) y publicado (`gestor-de-asuntos.vercel.app` sirve `App.VERSION` 14:12 con `js/exportar-informe-comprobar.js`; `asuntos.fmargon.com` no se pudo abrir desde el entorno, la de vercel.app sí). Las tres causas arregladas y comprobadas; `informe-agrupado.mjs` se ajustó (una tabla por página en vez de una sola). `css/word-visor.css` tiene el mismo fallo de última página con salto forzado al imprimir: sin tocar. TROPIEZO nuevo: `node_modules` estaba subido a git como enlace roto a sí mismo; reinstalado con `npm ci` para probar y restaurado tal cual. |
| 308 | `docs/TITULO-DEL-INFORME-EN-PDF.md` (idea de Francisco: en «Exportar ▾ → Informe en PDF», casilla «Título» que trae «Listado de asuntos» y se puede cambiar; el título sale en la hoja y en el nombre del fichero PDF) | HECHA (8-oct-2026 17:20) · revisor APROBADA a la primera; en `main` (fusión 1413691, PR 227), publicada (vercel.app sirve `App.VERSION` 17:17 con la novedad 308). Casilla «Título» en el informe en PDF; sale en la hoja, la barra y el nombre del fichero. En el Chromium sin pantalla un nombre de descarga con tilde sale como «download»; la prueba usa un título sin tilde |
| 314 | `docs/FECHA-QUE-NO-DEJA-ESCRIBIR-EL-ANO.md` (idea de Francisco: en «Control del registro» no se podía escribir el año en «Revisar desde el día», porque la fecha se guardaba con la primera cifra; ahora se guarda al salir del campo o con Intro, solo con año de 2000 a 2099; la fecha 01/01/0020 guardada cuenta como sin fecha; antes de quitar apuntes al adelantar la fecha, pregunta con «Quitar» y «Cancelar»; repaso de los demás campos de fecha, con los de los cargos arreglados igual; función nueva `U.alTerminarFecha`) [recorte: https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E · b7df2e6bd250f8f578298038faab5c63] | HECHA (9-oct-2026 07:12): revisor APROBADA a la primera, en `main` (fusión ad0d8ec, PR 230), web sirve `U.alTerminarFecha`. Pasada completa 265 de 265 en verde. Campos de fecha arreglados: «Revisar desde el día» y los `desde`/`hasta` de los cargos; el resto van en cuadros con botón y no se tocaron. TROPIEZO T9: `node_modules` va en git como enlace roto y hubo que hacer `npm ci` y `CHROMIUM_PATH` |
| 309 | `docs/ACTIVIDADES-EXTRAESCOLARES-AVISO.md` (segunda de cuatro, va después de la 306: en la tarjeta «La actividad», botón «Avisar al claustro» que genera un informe en PDF con los datos de la actividad y el alumnado que va, por unidades, y abre el correo con el informe adjunto y el grupo del profesorado ya puesto en copia oculta; el grupo se elige en Ajustes → El centro; si la lista cambia después del aviso, la tarjeta lo dice y ofrece «Volver a avisar»; módulo nuevo `js/actividades-informe.js`) | BLOQUEADA (9-oct-2026): depende de la fila 306 (módulos `js/actividades*.js` y `actividades.json`), que está DEVUELTA y no está en `main`; se desbloquea cuando la 306 llegue a `main` (vuelve a PENDIENTE) |
| 310 | `docs/ACTIVIDADES-EXTRAESCOLARES-PANTALLA.md` (tercera de cuatro, va después de la 306: en Herramientas, pantalla «Actividades extraescolares» con una tabla de todas, buscador, filtros por curso, profesor, unidad y situación, y «Exportar» a hoja de cálculo; «+ Nueva actividad» y «+ Apuntar una actividad antigua», en corto, sin alumnado ni asunto; módulos nuevos `js/actividades-pantalla.js`, `js/actividades-antigua.js` y `js/actividades-exportar.js`) | BLOQUEADA (9-oct-2026): depende de la fila 306 (módulos `js/actividades*.js` y `actividades.json`), que está DEVUELTA y no está en `main`; se desbloquea cuando la 306 llegue a `main` (vuelve a PENDIENTE) |
| 311 | `docs/ACTIVIDADES-EXTRAESCOLARES-CERTIFICADO.md` (cuarta de cuatro, va después de la 306 y la 310: tipo de asunto CERTIFICADO ACTIVIDADES EXTRAESCOLARES, a nombre del profesor, con «Actividades desde» y «Actividades hasta»; su plantilla lleva una tabla con una línea por actividad realizada, que dice «Organización» o «Acompañante»; la ficha del profesor enseña sus actividades; módulo nuevo `js/actividades-tabla.js`) | BLOQUEADA (9-oct-2026): depende de la fila 306 (módulos `js/actividades*.js` y `actividades.json`), que está DEVUELTA y no está en `main`; se desbloquea cuando la 306 llegue a `main` (vuelve a PENDIENTE) |
| 312 | `docs/BEBER-DEL-CENTRO-DE-DATOS.md` (idea de Francisco: un centro de datos del que beban sus aplicaciones, proyecto aparte `centro-de-datos-ies`; primera de dos filas, 312 y 313: el gestor señala una vez por ordenador la carpeta «CENTRO DE DATOS» de Drive y, al entrar, coge él solo lo nuevo —alumnado, personal, alumnado de la base de datos, función tutorial, Consejo Escolar y registro de entrada y salida— pasándolo por la importación de siempre; donde hoy se sube a mano sale «Datos del Centro de datos, de <fecha>» y la subida a mano se queda; módulos nuevos `js/centro-de-datos*.js`; no necesita que el Centro de datos esté terminado) | HECHA (9-oct-2026 05:47): revisor APROBADA a la primera, en `main` (fusión e26067a, PR 228), web sirve `js/centro-de-datos.js`. Pasada completa en verde salvo 2 pruebas que solo contaban filas (Ajustes y comprobación al entrar), actualizadas. Decisiones: líneas grises y aviso del registro con un observador; el Consejo Escolar de la carpeta sustituye sin preguntar. Falta solo señalar la carpeta real (`docs/TE-TOCA.md`). TROPIEZO T9: `node_modules` va en git como enlace roto y hubo que hacer `npm ci` y `CHROMIUM_PATH` |
| 313 | `docs/CONFIGURACION-DEL-CENTRO-DE-DATOS.md` (segunda de dos, va después de la 312: los datos del centro y la firma de los correos se escriben una vez en el Centro de datos; el gestor los copia a `plantillas.json` y en Ajustes → El centro salen sin poder cambiarse, con «Se cambia en el Centro de datos»; la dirección con la que cada persona envía correo no cambia) | HECHA (9-oct-2026 06:22): revisor APROBADA a la primera, en `main` (fusión db84257, PR 229), web sirve `js/centro-de-datos-configuracion.js`. Pasada completa 264 de 264 en verde. Decisión: la marca de los campos la ponen el observador de `centro-de-datos-ver.js` y una línea de `plantillas-ajustes.js`. TROPIEZO T9: `node_modules` va en git como enlace roto y hubo que hacer `npm ci` y `CHROMIUM_PATH` |
| 315 | `docs/BUZON-ADMITE-CENTRO-DE-DATOS.md` (idea de Francisco, idea 4 de la cola del Centro de datos: el buzón de soporte admite los avisos de `fmargon780/centro-de-datos-ies`, que va a tener su botón «Soporte»; solo cambia la lista de repositorios permitidos del script y sus documentos; lleva dos pasos de Francisco: añadir el repositorio al permiso de GitHub y volver a pegar el script) | HECHA (9-oct-2026 07:37): revisor APROBADA a la primera, en `main` (fusión 6f4a797, PR 231). Solo cambia `apps-script/`, pruebas y `docs/` (no se publican en Vercel; la web sirve la versión de las 07:11). Pasada completa en verde tras actualizar `pruebas/vigilante-script.mjs` a la versión nueva del buzón. Faltan dos pasos de Francisco (`docs/TE-TOCA.md`). TROPIEZO T9: `node_modules` va en git como enlace roto y hubo que hacer `npm ci` y `CHROMIUM_PATH` |
| 316 | `docs/BUZON-DE-SOPORTE-DEL-CENTRO-DE-DATOS.md` (idea de Francisco, idea 4 de la cola del Centro de datos; va después de la 313: la dirección del buzón de soporte se escribe una vez en el Centro de datos; el gestor la copia a su ajuste de siempre y en Ajustes → El centro → «Buzón de soporte» sale sin poder cambiarse, con «Se cambia en el Centro de datos»; si no viene, todo sigue como hoy) | HECHA (9-oct-2026 08:11): revisor APROBADA a la primera, en `main` (fusión 984eca6, PR 232), web sirve `js/centro-de-datos-configuracion.js` con `buzonSoporte`. Pasada completa en verde salvo `carpetas-perdidas` (agotó una espera de 60 s con la máquina cargada, pasa en solitario: a `EN_SOLITARIO` con fecha de hoy, ya 20 de 20). Decisión: en la copia de pruebas la dirección de demostración sale al señalar la carpeta «CENTRO DE DATOS» de mentira, no antes (el revisor la señaló). Detalle menor visto: el texto de arriba del bloque «Buzón de soporte» sigue diciendo «Pega aquí su dirección…» con el campo bloqueado. TROPIEZO T9: `node_modules` va en git como enlace roto y hubo que hacer `npm ci` y `CHROMIUM_PATH` |
| 317 | `docs/CENTRO-DE-DATOS-CONTRATO-2.md` (rediseño de la idea 6 de la cola del Centro de datos; va después de la 313: el Centro de datos pasa a su contrato 2, con una ficha por fichero y varias entradas por clave; el gestor lo admite y **elige** qué coge —todo el personal, docente y no docente, con el curso en el nombre; la función tutorial y el registro solo del curso actual; el Consejo Escolar, todos sus periodos; el alumnado solo si hay uno— y no coge nada mientras el Centro de datos recoloca; hasta que se haga, el gestor no coge nada de allí y la subida a mano sigue) | HECHA (9-oct-2026 08:58): revisor APROBADA a la primera, en `main` (fusión ed388a8, PR 233), web sirve `elegir` de `js/centro-de-datos.js`. Pasada completa en verde salvo `hitos-desde-el-asunto` (clic de menú de la mesa que se desprendía con la máquina cargada; pasa en solitario): arreglada la propia prueba, sin gastar plaza de `EN_SOLITARIO`. Decisión: la configuración del centro se lee antes de mirar el contrato del índice y `ocupado`. TROPIEZO T9: `node_modules` va en git como enlace roto y hubo que hacer `npm ci` y `CHROMIUM_PATH` |
| 318 | `docs/PERMISOS-DE-CARPETAS-AL-ENTRAR.md` (idea de Francisco: en el ordenador del centro, cada mañana el panel «Comprobación al entrar» decía que había que volver a señalar la carpeta del alumnado y la de la bandeja; al pulsar «Entrar» la aplicación pide también el permiso de las carpetas recordadas —alumnado, bandeja y Centro de datos— sin señalar nada, para que el navegador lo guarde con «Permitir en cada visita»; en el panel, esas filas llevan «Dar permiso», que lo arregla con una pulsación sin cerrar el panel; solo manda a señalar la carpeta si se ha movido o borrado; módulo nuevo `js/permisos-carpetas.js`) [recorte: https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E · 1894710a50292ffa1103cf8c2e0d1ce1] | PENDIENTE (9-oct-2026) |
| 319 | Mientras terminamos el desarrollo del Centro de Datos, tengo que asegurarme que tengo la base de datos actual. Pero realmente ya no sé donde tengo que guardar el csv, ni con la información que ofrece (solo la fecha) tengo la certeza de que es el más actual [recorte: https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E · d5d535201b224980f9ff180114722e3f] | EN DISEÑO (9-oct-2026) · conversación: https://claude.ai/code/session_01TNUdRHoLZFu18QQSjtwZsj |

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
