# Plan de robustez — septiembre de 2026

Instrucción para Claude Code. Sale del análisis `Analisis-critico-2026-09-11.md` del proyecto.
Léela entera antes de tocar nada. Lee también `docs/CONTEXTO.md`: ahí está cómo funciona la
aplicación, cómo se trabaja el código y lo que está descartado.

Francisco no es programador y no revisa código. No le hagas preguntas salvo que sea imposible
seguir. Decide tú, apunta la decisión en `docs/CONTEXTO.md`, y sigue. Verifica tú tu trabajo.

## Reglas de trabajo, obligatorias

1. La aplicación es HTML + JS sin compilar, servida por Vercel desde `main`. Un solo proyecto
   de Vercel. **No crear otro.** Dirección: https://gestor-de-asuntos.vercel.app
2. **Agrupa el trabajo en pocos commits** (uno por bloque de este plan, máximo seis). Cada
   commit que cambie algo visible sube `App.VERSION` con fecha y hora de España
   (`11-sep-2026 · 17:40`).
3. **Todo cambio de código lleva su prueba en `pruebas/`**, y la prueba tiene que fallar sin el
   arreglo antes de darla por buena. Las pruebas de navegador usan Playwright con Chromium y un
   `python3 -m http.server` local; las de módulo suelto, jsdom. Mira cómo lo hacen las que ya hay.
4. **Antes de colgar una función nueva de `App`, `grep` por todos los `js/`** para ver que el
   nombre no está cogido. Los `<script>` de `index.html` cargan en orden y un nombre repetido se
   pierde sin error.
5. **`docs/CONTEXTO.md` se actualiza en el mismo commit** en que cambia el código: tabla de
   ficheros, tabla de ficheros de `_GESTOR`, y el apartado de decisiones. Escrito en el mismo
   estilo: frases cortas, sin jerga, con el porqué.
6. Al terminar cada bloque, comprueba que Vercel sirve los ficheros nuevos:
   `curl -s "https://gestor-de-asuntos.vercel.app/js/<fichero>?v=<algo distinto>"` y busca en
   la respuesta un nombre de función nuevo. La cola de Vercel puede tardar 15-20 minutos.
7. Los ficheros compartidos de `_GESTOR` los escriben dos ordenadores sobre un Dropbox
   sincronizado. **Todo fichero compartido se relee justo antes de escribirlo.** Sin excepción.
8. Nada de tareas manuales para Francisco. Si un dato nuevo necesita "editar un fichero a mano",
   falta media función.

## Bloque 1 — Copias de seguridad y fichero roto (lo más importante)

Hoy, si `asuntos.json` no se puede leer, `Carpetas.leerJson` devuelve `null`, `App.cargarRegistro`
arranca con `{ asuntos: {} }` y el siguiente `App.anotar` lo escribe encima. Se pierde todo.

Hacer:

- Nuevo módulo `js/copias.js` (y su prueba). Envuelve `Carpetas.guardarJson` o se llama desde
  él: **antes de escribir cualquier `.json` de `_GESTOR`, guarda la versión anterior** en
  `_GESTOR/copias/<nombre>-AAMMDD.json`. Una copia por fichero y día (la primera escritura del
  día). Conserva las últimas 30 de cada fichero; borra las más viejas.
- **Distinguir "no existe" de "no se puede leer".** `leerJson` devuelve `null` solo si el
  fichero no existe. Si existe y no se puede interpretar, lanza un error con nombre
  (`FicheroRoto`) que lleve el nombre del fichero.
- En el arranque (`btn-entrar` en `js/nucleo.js`), si algún fichero de `_GESTOR` está roto:
  **no entrar**. Aviso claro en rojo: qué fichero, y un botón **Restaurar la última copia**, que
  copia la más reciente de `_GESTOR/copias` encima y vuelve a intentar entrar. El fichero roto se
  guarda como `<nombre>-roto-AAMMDD-HHMM.json` en `copias`, nunca se borra.
- En Ajustes, un bloque **Copias de seguridad**: lista de copias por fichero y fecha, y botón
  Restaurar (pide confirmación). Después de restaurar se recarga la página.
- Aplica esto a los ocho ficheros: `asuntos.json`, `guias.json`, `tipos.json`, `estados.json`,
  `tipos-documento.json`, `tablon.json`, `recurrentes.json`, `frescura.json`.

Prueba: un `asuntos.json` con contenido `{"asuntos": {"a` no deja entrar, muestra el aviso, y al
restaurar entra con las fichas de la copia. Otra: tras 31 días de escrituras quedan 30 copias.

## Bloque 2 — Copias en conflicto de Dropbox, y releer siempre

Dropbox tarda segundos en sincronizar. Si los dos ordenadores guardan en ese hueco, Dropbox deja
un fichero `asuntos (copia en conflicto de <ordenador> 2026-09-11).json` (en inglés,
`asuntos (<ordenador>'s conflicted copy 2026-09-11).json`). Hoy nadie lo mira.

Hacer:

- Nuevo módulo `js/conflictos.js`. Al entrar y cada 5 minutos (engánchalo a
  `App.mirarLaCarpeta` en `js/documentos-sueltos.js`), busca en `_GESTOR` ficheros cuyo nombre
  contenga `conflicto` o `conflicted`.
- Para `asuntos.json`: **fusión automática** por clave de asunto. Clave solo en uno de los dos →
  se queda. Clave en los dos → se unen las notas (sin repetir: misma `cuando` + mismo `texto`),
  `pasosHechos` y `pasosElegidos` se unen, y el resto de campos los da la ficha con el
  `editadoEl` / última nota más reciente. Se escribe el resultado (releyendo antes), y el fichero
  en conflicto se mueve a `_GESTOR/copias/`. Aviso azul: "Se han unido los cambios de los dos
  ordenadores".
- Para `tablon.json`: unir notas por `id` (si no tienen `id`, por `texto` + `cuando`).
- Para el resto de ficheros: no fusionar. Aviso ámbar en Ajustes con los dos ficheros y un botón
  para quedarse con uno u otro. Los dos se guardan en `copias` antes.
- **Releer antes de escribir** también en `recurrentes.js` (`guardar`), `App.guardarTipos`,
  `App.guardarEstados` y `App.guardarTiposDocumento`. Patrón: leer el fichero, aplicar el cambio
  sobre lo leído, escribir. Mira `tablon.js` (`cambiar`) que ya lo hace bien.

Prueba: dos ficheros `asuntos.json` y `asuntos (copia en conflicto de PC2 2026-09-11).json` con
un asunto distinto cada uno y uno común con notas distintas → al entrar queda un solo fichero con
los tres asuntos y las notas unidas, y el de conflicto está en `copias`.

## Bloque 3 — Pruebas automáticas en cada subida

Hacer:

- `package.json` con `playwright` y `jsdom` como dependencias y un `npm test` que levanta el
  servidor local y ejecuta **todas** las pruebas de `pruebas/` una detrás de otra. Que falle si
  falla una.
- Las pruebas que hoy arrancan Chromium con `executablePath: '/opt/pw-browsers/chromium'` pasan
  a leerlo de la variable de entorno `CHROMIUM_PATH`; si no está, Playwright usa el suyo.
- `.github/workflows/pruebas.yml`: en cada push y cada pull request a `main`, Ubuntu, Node 20,
  `npm ci`, `npx playwright install --with-deps chromium`, `npm test`.
- **Arreglar `pruebas/logica.mjs`**: las dos comprobaciones que dan por hecho que hoy es
  07/09/2026 (`U.edadDesde` y `U.yaPaso`) se hacen relativas a hoy, como en `dni.mjs`.
- **Arreglar `pruebas/navegador.mjs`**, desfasada desde que la barra nace plegada: abrir la barra
  antes de pulsar, o pulsar por `data-pantalla` sin depender de la barra.
- Añade al `README.md` cómo se ejecutan las pruebas (tres líneas).

Prueba de que funciona: el primer push con el workflow tiene que salir en verde en la pestaña
Actions. Si sale en rojo, se arregla antes de seguir.

## Bloque 4 — Fichas sin carpeta

La ficha de un asunto se busca por el nombre exacto de la carpeta. Si alguien renombra o mueve la
carpeta a mano, la ficha se queda huérfana y no se ve nunca más.

Hacer:

- En Ajustes, bloque **Fichas sin carpeta**. Al abrirlo se calcula: claves de `asuntos.json` cuya
  carpeta no está ni en abiertos ni en el ARCHIVO (usa `App.E.listaAbiertos` y
  `App.E.listaArchivo`; si el archivo no está cargado, cárgalo).
- Cada ficha huérfana se enseña con su nombre, su estado y sus notas resumidas, y dos botones:
  **Enlazar con una carpeta** (desplegable con las carpetas de abiertos y archivo que **no**
  tienen ficha; al elegir, la ficha se copia a la clave nueva y se borra la vieja, como hace
  `asuntos-editar.js`) y **Borrar la ficha** (confirmación; antes se guarda copia, Bloque 1).
- Un contador discreto en el botón de Ajustes de la barra cuando hay huérfanas (punto ámbar).

Prueba: una clave en `asuntos.json` sin carpeta aparece en el bloque; al enlazarla con una
carpeta sin ficha, la ficha pasa a esa clave y el bloque queda vacío.

## Bloque 5 — Nombres repetidos y código muerto

- Prueba `pruebas/nombres-app.mjs`, sin navegador: lee todos los `js/*.js`, busca
  `^App\.(\w+) = (async )?function` y **falla si el mismo nombre se define en dos ficheros**.
  Entra en `npm test`.
- Quitar el botón "Guía n/m" de `js/guias-enganche.js`: existe pero `js/ficha-asunto.js` lo poda
  (`BOTONES_DE_LA_TARJETA`). Se quita el código, no se añade a la lista blanca: la tarjeta se
  queda con lo justo, a propósito.
- Sacar `App.VERSION` a `js/version.js`, cargado justo después de `js/nucleo.js`. Así cambiar la
  versión no obliga a resubir `nucleo.js` entero.

## Bloque 6 — Documentación

- `docs/CONTEXTO.md` es la copia dentro del repositorio del documento de contexto. Ya trae la
  tabla de ficheros puesta al día. Después de cada bloque, añade su apartado: qué se hizo, dónde
  vive, qué prueba lo comprueba, y qué se decidió. Actualiza también "Qué falta por hacer":
  quita los puntos 15, 16, 18 y 21, que quedan hechos aquí.
- Añade a `docs/CONTEXTO.md` dos apartados que faltaban: **fechas límite** (`js/plazos.js`) y
  **asuntos recurrentes** (`js/recurrentes.js`, `_GESTOR/recurrentes.json`). Sácalo de los
  comentarios de cabecera de esos ficheros.
- Al final, escribe un resumen de diez líneas en `docs/CAMBIOS-2026-09.md`: qué se hizo en cada
  bloque y qué tiene que ver Francisco en pantalla. En lenguaje llano.

## Orden y cierre

Bloques 1 → 2 → 3 → 4 → 5 → 6. Si algo de un bloque no sale, se apunta en `docs/CONTEXTO.md`
en "Qué falta por hacer" y se sigue con el siguiente; no se deja el repositorio a medias ni con
las pruebas en rojo.

Al terminar, el último mensaje para Francisco tiene que ser corto: versión publicada, si Actions
está en verde, y qué va a ver distinto en la pantalla (el bloque de Copias de seguridad y el de
Fichas sin carpeta en Ajustes, y el aviso si hubiera copias en conflicto). Nada más.
