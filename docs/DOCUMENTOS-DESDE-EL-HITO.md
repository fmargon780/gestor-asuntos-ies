# Generar documentos desde el hito (fila 102)

Diseñado y cerrado con Francisco el 23-sep-2026. Es la **primera tanda** de un cambio más grande:
que el hito pase a ser la mesa de trabajo del asunto, y que desde él se pueda hacer todo lo que hoy
se hace desde la ficha. Esta fila solo trae la primera tanda; lo que queda está en el apartado 9.

Cierra lo que `docs/COLA.md` tenía apuntado en "Lo que queda por hablar con Francisco": *«queda
pendiente lo mismo con la plantilla de documento (fila 17)»* (ya cambiada al apuntar esta fila).

---

## 0. Antes de empezar (reglas de siempre)

- Lee `docs/CONTEXTO.md` y **solo** estos hijos: `docs/contexto/HITOS-Y-GUIAS.md` y
  `docs/contexto/CORREO-Y-SENECA.md` (apartado de plantillas). **No leas el repositorio entero.**
- **Sube directamente a `main`, sin abrir ninguna pull request.** Si la sesión no puede tocar
  `main`, sigue la "Nota sobre sube directamente a main" de `docs/COLA.md`.
- **Cambios quirúrgicos**: nada de reescribir ficheros enteros.
- **Una sola prueba al final** (`npm test` entero), no una después de cada cambio.
- Máximo dos subidas (regla 13 de la cola).
- `js/guias.js` (≈1.180 líneas) y `js/plantillas-documento.js` (≈660) pasan de 400 líneas. **No
  se parten en esta fila**: en cada uno solo entran unas pocas líneas que llaman a un fichero nuevo,
  igual que se hizo con `js/guias-requisitos.js` (fila 59) y `js/guias-comunicacion.js` (fila 60).
  Todo lo nuevo va en ficheros nuevos.

## 1. Qué va a ver Francisco

1. En el editor de un paso de la guía (y en el de un modelo de la biblioteca de hitos), una
   sección plegable nueva, **"Documentos de este paso"**: un buscador con casillas de todas las
   plantillas de documento del centro, agrupadas por tipo de asunto. Marca las que van con ese paso.
2. Dentro de cada hito vivo, un botón nuevo **"Generar documento"**. Al pulsarlo:
   - Si el hito tiene una sola plantilla y el tipo ninguna más, genera directamente.
   - Si hay varias, el mismo cuadro de elegir de hoy, con dos grupos: **"De este paso"** arriba y
     **"Otras de este tipo de asunto"** debajo.
3. El documento generado queda **apuntado a ese hito solo**, y marca solo la casilla de "Lo que
   hay que reunir" que le corresponda (mismo comportamiento que al apuntar un documento a mano).
4. Al volver a pintarse la ficha, el hito sigue desplegado y a la vista, no se pliega.
5. En el historial del hito aparece "Generado «nombre del documento»".
6. Huecos nuevos para las plantillas (de documento y de correo), en el catálogo de "Insertar hueco"
   y en la tabla de huecos de las plantillas de documento.

## 2. Dónde se guarda la unión plantilla ↔ paso

- Campo nuevo en un paso de guía (y en un subpaso dentro de una opción, mismo criterio que
  `requisitos` y `comunicacion`; **nunca en un paso-pregunta**): `plantillasDocumento: [id, ...]`,
  con los `id` de `plantillas.json → documentos`. Normalizado en `Guias` igual que `formularios`
  (lista de textos; sin repetir; vacío si no es lista).
- Mismo campo en un modelo de la biblioteca (`_GESTOR/hitos-biblioteca.json`). Se copia al traer un
  modelo a una guía (`HitosBiblioteca.modeloAPaso`) y al guardar un paso en la biblioteca.
- **Entra en la comparación de la biblioteca** (`CAMPOS_COMPARABLES` de `js/hitos-biblioteca.js`),
  con etiqueta "Documentos" y texto legible = los nombres de las plantillas separados por comas (si
  un id ya no existe, "(plantilla borrada)").
- **En `hitos.json` no se guarda copia.** El hito lo lee de su paso por `origenGuia` en el momento
  de pulsar, igual que `comunicacion` (fila 60, `HitosComunicar.canalesDe`). Así, si Francisco
  cambia las plantillas del paso, los asuntos vivos usan lo nuevo.
- Una plantilla unida a un paso **se puede usar aunque sea de otro tipo de asunto**: la unión al
  paso manda. Es lo que permite que un modelo de la biblioteca sirva a varios tipos.
- Si una plantilla unida se borra, el id huérfano se ignora en silencio al generar, y en el editor
  del paso sale tachado con "(plantilla borrada)" y se quita al guardar.

## 3. El botón en el hito

- Fichero nuevo `js/hitos-generar.js` (`window.HitosGenerar`), enganchado igual que
  `js/hitos-comunicar.js`: `botonHTML(a, h)` y `engancharBoton(div, a, h)`, llamados desde
  `js/hitos-panel-lista.js` dentro de `.hito-botones`, al lado de los de `HitosComunicar`.
- Sale si el hito **no** es de clase `decision`, **no** está en `noaplica`, y hay al menos una
  plantilla (del paso o del tipo). Sin ninguna, no se pinta.
- En modo consulta (el compañero tiene el mando), se apaga como el resto de botones.
- `U.mientrasGuarda` en el botón mientras genera.

## 4. El motor: reutilizar, no duplicar

En `js/plantillas-documento.js`, cambio mínimo:

- `generarDocumento(asunto, plantillaDoc, modo, opciones)` gana un cuarto argumento opcional
  `{ hito }`. Sin él, hace exactamente lo de hoy.
- Con `hito`:
  - Pasa el hito a `Plantillas.valoresDeAsunto(asunto, { ..., hito })` para los huecos nuevos.
  - Después de guardar el fichero: `Hitos.anadirDocumento(clave, hito.id, nombreDoc)`, luego
    `HitosRequisitos.marcarPorDocumento(...)` (no crítico, como en `js/hitos-documentos.js`), y
    `Hitos.anadirNota(clave, hito.id, 'Generado «' + nombreDoc + '»')`.
  - Antes del `App.abrirFicha` final: `HitosPanel.desplegarAlAbrir(clave, hito.id)`.
- `elegirPlantilla(lista)` acepta también dos grupos con rótulo (`{ delPaso: [...], delTipo: [...]
  }`). Una plantilla que esté en los dos grupos sale solo en "De este paso".
- Exponer en `window.PlantillasDocumento` lo que `js/hitos-generar.js` necesite
  (`generar`, `elegir`, `plantillasDelAsunto`), sin renombrar nada de lo que ya existe.

## 5. Los huecos nuevos

En `js/plantillas.js` (`HUECOS` y `valoresDeAsunto`). Fuera del camino de un hito, **todos se
sustituyen por nada** y no cuentan como dato que falta (mismo trato que `{{LO QUE FALTA}}`).

| Hueco | Qué pone |
|---|---|
| `{{HITO}}` | El título del hito desde el que se genera o comunica |
| `{{PLAZO DEL HITO}}` | Su fecha límite, en fecha legible; vacío si no tiene |
| `{{LO QUE FALTA}}` | Ya existe para el correo; ahora también en un documento generado desde el hito |
| `{hecho:TÍTULO DE OTRO HITO}` | La fecha en que se marcó hecho otro hito del mismo asunto, buscado por título sin mayúsculas ni tildes (como `{campo:...}`). Vacío y apuntado en "faltan" si no existe o no está hecho |

- Para la fecha de "hecho", usar el dato que ya guarda el hito al marcarse (mira su historial en
  `js/hitos.js`). Si no hubiera ninguna fecha fiable, usar la de la última entrada "hecho" del
  historial; no inventar.
- `{{HITO}}` y `{{PLAZO DEL HITO}}` también se rellenan al "Comunicar" desde un hito
  (`js/hitos-comunicar.js` ya pasa por `Plantillas.rellenar`: solo hay que darle el hito).
- Los huecos nuevos salen en "Insertar hueco" y en la tabla de huecos de plantillas de documento.
  Revisa que `pruebas/plantillas-del-centro.mjs` los acepte.

## 6. El editor del paso

- Fichero nuevo `js/guias-documentos.js` (`window.GuiasDocumentos`): `bloqueHTML(ids, catalogo)`,
  `leer(caja)`, `enganchar(caja)`. Buscador con casillas, mismo aspecto que el de formularios.
- En `js/guias.js`, solo: pintar el bloque en el editor de cada paso/subpaso que no sea pregunta
  (con `restaurarAbierto`, clase `.paso-documentos`), y leerlo en `recoger()`.
- El catálogo de plantillas se carga **una vez** al abrir el cuadro de la guía (ya se relee la guía
  justo antes: carga las plantillas en el mismo momento), nunca en cada tecla.
- En la vista de solo lectura de los pasos (`Guias.vista`), una línea "Documentos: …" con los
  nombres, si hay alguno.

## 7. Ficheros que se tocan

- Nuevos: `js/hitos-generar.js`, `js/guias-documentos.js`, `pruebas/documentos-desde-el-hito.mjs`.
- Pequeños cambios: `js/plantillas-documento.js`, `js/plantillas.js`, `js/guias.js`,
  `js/hitos-panel-lista.js`, `js/hitos-biblioteca.js`, `js/guias-biblioteca.js` (si hace falta para
  copiar el campo), `js/hitos-comunicar.js` (pasar el hito a los huecos), `index.html` (cargar los
  dos ficheros nuevos: `js/guias-documentos.js` antes de `js/guias.js`; `js/hitos-generar.js`
  después de `js/plantillas-documento.js`), `js/envolturas-esperadas.js` solo si hiciera falta.
- CSS: reutiliza las clases del bloque de formularios; si hace falta algo, en `css/hitos.css` o el
  que ya pinte `.hito-botones`.
- Documentación al cerrar: `docs/CONTEXTO-CORTO.md` (sustituir la línea de "Hitos" de la sección 5,
  no añadir otra), `docs/contexto/HITOS-Y-GUIAS.md`, `docs/HISTORIA.md`, `docs/COLA.md`.

## 8. La prueba

`pruebas/documentos-desde-el-hito.mjs`, sin navegador donde se pueda:

- Normalizar `plantillasDocumento` (lista buena, basura, repetidos, en paso-pregunta se descarta).
- `HitosBiblioteca.diferencias` detecta el cambio de plantillas.
- Agrupar "De este paso" / "Otras de este tipo", sin repetir, ignorando ids borrados.
- Huecos nuevos: con hito, rellenos; sin hito, vacíos y fuera de "faltan"; `{hecho:X}` con un hito
  hecho, uno sin hacer y uno que no existe.

Y `npm test` entero en verde al final.

## 9. No entra en esta fila (segunda tanda, otra fila)

- "Añadir documento" dentro del hito (subir, registrar o traer de "Por clasificar").
- "Comunicar" siempre visible en el hito, con los documentos del hito ya marcados para adjuntar.
- Herramientas de PDF sobre los documentos del hito.
- Más adelante: documentos de la ficha agrupados bajo su hito.
- Unir de partida las plantillas del centro (`plantillas/`) a los modelos de la biblioteca: se hará
  con el uso, a mano, desde el editor.
