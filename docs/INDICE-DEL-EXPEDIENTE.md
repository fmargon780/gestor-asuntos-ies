# Fila 137 — Índice del expediente

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 2, «lo que falta», punto 3). Diseño cerrado con Francisco el 24-sep-2026.

Cuando hay que mandar un expediente a Inspección o a un recurso, la ley pide un índice numerado de
sus documentos. Hoy se haría a mano.

## Reglas de esta fila

- **No leas el repositorio entero.** Lee `docs/CONTEXTO.md`, el hijo de `docs/contexto/` que se
  cita y los ficheros de la lista. Si con `grep` aparece otro fichero que haga falta tocar, tócalo y
  apúntalo en la documentación.
- **Cambios quirúrgicos.** No reescribas ficheros enteros. Lo nuevo va en ficheros nuevos y
  pequeños (menos de 400 líneas), enganchados por un punto previsto, no envolviendo.
- Sube directamente a `main`, sin pull request (o según la nota de la cola si la sesión no puede).
  Dos subidas como mucho (regla 13 de la cola).
- **Una sola tanda de pruebas al final**, con la batería completa en verde.
- Todo guardado de `_GESTOR` por `ColaGuardado`. Todo fallo accesorio, en ámbar, sin parar lo
  principal.
- Al terminar: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` que toque,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`, sustituyendo lo viejo.

Contexto: `docs/contexto/ASUNTOS-ARCHIVO.md`, `docs/contexto/DOCUMENTOS.md`,
`docs/contexto/DOCUMENTOS-PDF.md`.

## Ficheros que se tocan

- Nuevo `js/indice-expediente.js`, `index.html`
- `js/asuntos-archivar.js` (crearlo al archivar)
- `js/ficha-menus.js` (el botón)
- Los que listan documentos del asunto, para que no lo traten como un documento más
  (`js/documentos.js`, `js/ficha-documentos.js`, `js/archivo-indice.js`, `js/duplicados.js`,
  lo de «pendientes de registro»)
- Prueba nueva: `pruebas/indice-del-expediente.mjs`

## 1. El documento

Un PDF, `000 ÍNDICE DEL EXPEDIENTE.pdf`, dentro de la carpeta del asunto (el `000` es para que
salga el primero). Se hace con `js/lib/pdf-lib.min.js`, A4 vertical:

- Arriba: el nombre del centro (de `plantillas.json`), «Índice del expediente», el nombre de la
  carpeta, el tipo, el tercero, fecha de apertura y, si está archivado, de archivo.
- Tabla: Nº · Fecha · Registro · Documento · Páginas. Fecha y registro salen del nombre del
  fichero. Páginas, de los PDF (los demás, «—»). Orden por fecha y, a igual fecha, por nombre.
- Se excluye el propio índice. Los originales «SIN SELLAR» entran, con esa marca.
- Pie: «Generado por el Gestor de Asuntos el …, por …» y número de página.

## 2. Cuándo se crea

- **Al archivar**, después de comprobar que la carpeta llegó entera. Si falla, ámbar: el asunto
  queda archivado igual.
- **Botón en el menú de la ficha**: «Índice del expediente». Lo crea (o lo rehace) en la carpeta del
  asunto y lo abre en el visor.
- Si ya existe, se sustituye (el anterior va a la papelera).

## 3. Que no moleste

El índice no cuenta como documento del asunto: no sale en «pendientes de registro», no se asocia a
hitos, no cuenta en «N documentos» de la tarjeta ni en duplicados. Sí se ve en la lista de ficheros
de la carpeta.

## 4. La prueba

Una carpeta con tres documentos (uno registrado, uno «SIN SELLAR», un Word) da un PDF de una página
con tres filas en orden; archivar lo crea; un fallo al crearlo no impide archivar.
