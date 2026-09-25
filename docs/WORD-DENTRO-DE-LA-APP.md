# Fila 155 — El Word, de principio a fin dentro de la aplicación

Cerrado con Francisco el 25-sep-2026, en la conversación del proyecto.

## Lo que pasa hoy (y por qué molesta)

1. **El aviso de datos que faltan llega tarde.** `generarDocumento` (`js/plantillas-documento.js`)
   rellena el Word, lo guarda en la carpeta del asunto y solo después avisa en ámbar:
   «Documento generado, con huecos sin dato: …». Para entonces el Word ya está hecho a medias.
2. **El Word acaba en Descargas con un nombre raro.** El Word generado sí se guarda bien, en la
   carpeta del asunto y con su nombre. Pero al pulsarlo, `Visor.abrir` (`js/visor.js`) ve que no es
   PDF ni imagen y hace `window.open(url)` de un `blob:`: el Chromebook lo descarga en Descargas con
   un nombre de letras y números. Si Francisco lo corrige ahí, **la corrección no vuelve a la
   carpeta del asunto en Dropbox**. Luego tiene que pasarlo a PDF fuera de la app.

## Lo que Francisco hace con el Word

Casi siempre: revisarlo y pasarlo a PDF (para firmarlo). A veces: corregir algo en la revisión, o
imprimirlo en papel. Quiere hacerlo todo **sin salir de la aplicación**.

## Lo que hay que hacer

### A. Avisar de lo que falta ANTES de generar

- En `generarDocumento`, después de `Docx.rellenar` (que ya trabaja en memoria y devuelve
  `faltan`) y **antes de guardar nada**: si `faltan` no está vacío, abrir un cuadro
  «Faltan datos para este documento».
- Una línea por hueco que falta: el nombre del hueco en palabras legibles y un recuadro para
  escribir el valor. Tres botones: **Generar** (con lo escrito), **Generar igualmente** (los
  huecos vacíos se quedan como hoy) y **Cancelar** (no se guarda nada).
- Con lo escrito, volver a rellenar la plantilla original (no el resultado) con esos valores
  añadidos a `valores`, y seguir. Lo escrito vale **solo para este documento**: no se guarda en la
  ficha del asunto ni del tercero.
- Los huecos de las tablas de datos (`TablasDatos`, lo que sale en amarillo) se quedan como están:
  no entran en este cuadro.
- Un solo cuadro a la vez: usar el cuadro compartido (`#capa`), como `elegirPlantilla`.
- El aviso ámbar de después se queda solo para el caso «Generar igualmente».

### B. Ver, corregir, guardar en PDF e imprimir el Word dentro de la aplicación

Nada más generarse, el Word se abre **en grande dentro de la aplicación, editable** (una capa a
pantalla completa, con la barra de la app a la vista para cerrarla). Abajo o arriba, tres botones:

- **Guardar PDF**: guarda un PDF en la carpeta del asunto, con el mismo nombre que el Word y
  extensión `.pdf`. Si ya existe uno con ese nombre, preguntar antes de sustituirlo. Si el Word se
  generó desde un hito, el PDF queda apuntado en ese hito igual que el Word
  (`Hitos.anadirDocumento`, nota «PDF guardado «…»»). Nota en el asunto como hoy con el Word.
- **Imprimir**: manda el documento a la impresora (el diálogo de imprimir del navegador).
- **Guardar cambios**: sustituye el Word de la carpeta del asunto por el corregido. Si hay cambios
  sin guardar y se pulsa «Guardar PDF», guardar también el Word, para que Word y PDF digan lo mismo.
  Al cerrar con cambios sin guardar, preguntar.

**Lo mismo al abrir cualquier `.docx` ya existente** desde la ficha del asunto
(`js/ficha-documentos.js`) o desde la mesa del hito (`js/hito-mesa-documentos.js`): en vez de
descargarlo, se abre en este editor. Si el asunto está en modo consulta (el compañero está dentro),
el editor se abre solo para leer: se puede guardar PDF e imprimir, pero no guardar cambios.

Los demás tipos que el navegador no sabe enseñar (Excel, etc.) siguen abriéndose fuera, pero
**con su nombre de verdad**, no con el nombre de letras y números del `blob:` (enlace con el
atributo `download` puesto al nombre del fichero).

### Condiciones para el editor

- **Todo en el navegador.** Ni un servidor, ni un servicio de internet: son datos de alumnado
  menor de edad. Nada sale del ordenador.
- **La librería va dentro del repositorio**, en `js/lib/`, como `pdf-lib`: la copia sin internet
  (`file://`, ver `docs/COPIA-SIN-INTERNET.md`) tiene que seguir funcionando. Nada de cargarla de
  una CDN.
- Elegir la librería que mejor respete el Word: membrete en la cabecera (imagen), tablas, negritas,
  márgenes y tipos de letra. Mirar la licencia y apuntarla en `docs/HISTORIA.md`. Candidata a
  evaluar primero: SuperDoc (editor de `.docx` en el navegador); si no sirve, otra.
- El PDF, a ser posible **con texto seleccionable**. Si solo se puede como imagen de cada página,
  vale, siempre que se lea bien al imprimir (al menos 200 ppp) y AutoFirma pueda firmarlo.
- **Probar con plantillas reales** (las de `plantillas/` del repositorio y las que usan las
  pruebas): el PDF tiene que parecerse al Word abierto en Word. Si no se consigue algo aceptable,
  **no publicar la parte B**: publicar la A, marcar la fila BLOQUEADA con el motivo en una línea
  (qué se ve mal) y dejar dicho qué librería se probó.

## Ficheros que se tocan

- `js/plantillas-documento.js` (363 líneas): la parte A la hace pasar de 400. **Partirlo antes**:
  sacar el motor (`generarDocumento` y sus ayudantes) a `js/plantillas-documento-generar.js`,
  manteniendo `window.PlantillasDocumento.generar` (lo usa `js/hitos-generar.js`).
- `js/plantillas-documento-generar.js` (nuevo, partes A y la llamada al editor).
- `js/word-editor.js` (nuevo) y `css/word-editor.css` (nuevo): el editor y sus tres botones.
- `js/lib/<librería>` (nuevo).
- `js/visor.js`: un `.docx` va al editor; lo demás, fuera con su nombre de verdad.
- `index.html`: las etiquetas de los ficheros nuevos, en su sitio (después de `js/docx.js`).
- Si la copia sin internet lleva una lista de ficheros (`js/actualizar-copia.js`), añadir los
  nuevos.
- `pruebas/word-dentro-de-la-app.mjs` (nuevo).
- `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md` (o su hijo de `docs/contexto/`), `docs/HISTORIA.md`
  y `docs/COLA.md`, como mandan las reglas de la cola.

## Cómo trabajar

- **No leas el repositorio entero.** Solo los ficheros de arriba y lo que ellos llamen.
- **Cambios quirúrgicos**, no reescribir ficheros enteros.
- Ningún fichero de `js/` pasa de 600 líneas (y si uno que tocas pasa de 400, pártelo).
- El editor no envuelve funciones: se engancha por `Visor.abrir` y por `PlantillasDocumento`.
- **Una sola prueba al final**, `pruebas/word-dentro-de-la-app.mjs`, que compruebe:
  1. Con una plantilla con un hueco sin dato, sale el cuadro antes de que haya ningún fichero
     nuevo en la carpeta; al escribir el valor, el Word guardado lo lleva.
  2. «Cancelar» no deja nada en la carpeta.
  3. Tras generar, se abre el editor; «Guardar PDF» deja en la carpeta un `.pdf` con el mismo
     nombre que el Word.
  4. Abrir un `.docx` existente desde la ficha no hace `window.open` de un `blob:`.
- **Subir directamente a `main`, sin abrir ninguna pull request** (si la sesión no puede, ver la
  nota «Sube directamente a main» de `docs/COLA.md`: pull request y fusionarla sola, en verde).
- Comprobar lo publicado con `curl`.

## Qué verá Francisco

- Al generar un documento al que le falta algún dato, un cuadro para escribirlo antes.
- El Word se abre dentro de la aplicación, para corregirlo si hace falta.
- «Guardar PDF» deja el PDF en la carpeta del asunto, listo para firmar. «Imprimir» lo saca en papel.
- Nada pasa por la carpeta Descargas.
