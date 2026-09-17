# Apuntar un documento a un hito

Acordado con Francisco el 17-sep-2026, después de crear sus primeros hitos y no encontrar la
forma de asociarles un documento. Es la fila 30 de `docs/COLA.md`.

No es una función nueva: es la mitad que falta de la fila 15 (`docs/HITOS.md`, sección 5). El
modelo ya guarda los documentos apuntados, la lista ya se pinta y el botón de quitar (✕) ya
funciona. **Lo único que no existe es la forma de apuntar uno.**

## Reglas de esta instrucción

- **Sube directamente a `main`. No abras ninguna pull request.** Si tu sesión no puede tocar
  `main`, abre la pull request y **fusiónala tú mismo** en cuanto esté en verde y sin conflictos
  (permiso permanente de Francisco, al final de `docs/COLA.md`).
- Cambios quirúrgicos. No reescribas ficheros enteros.
- **No leas el repositorio entero.** Te basta con este documento, `docs/CONTEXTO.md` y los
  ficheros de la lista de abajo.
- **Una sola prueba al final**, con `npm test`, no una comprobación después de cada cambio.
- Si algún fichero que tocas pasa de unas 400 líneas, pártelo.
- Comprueba lo publicado con `curl`. Nunca des la publicación por hecha.
- `App.VERSION` con la hora de verdad (`TZ='Europe/Madrid' date`, receta en `js/version.js`).

## 1. Lo que hay que hacer

En el cuerpo desplegado de cada hito, en un asunto **abierto**, un botón nuevo:

    Apuntar un documento

Al pulsarlo se abre un cuadro con **los documentos que ya tiene la carpeta de ese asunto**, cada
uno con su casilla. Los que ya estén apuntados a ese hito salen marcados. Al aceptar:

- Los recién marcados se apuntan (`Hitos.anadirDocumento`).
- Los que se hayan desmarcado se quitan (`Hitos.quitarDocumento`).

Nada más. **Apuntar es solo señalar**: se guarda el nombre del fichero, el documento sigue
viviendo en la carpeta del asunto, no se copia, no se mueve y no se crean subcarpetas. Un mismo
documento puede estar apuntado en varios hitos. Esto ya estaba decidido en `docs/HITOS.md`,
sección 2.1; aquí no cambia.

## 2. Detalles del cuadro

- Se monta con `U.preguntar` (el único cuadro de diálogo que hay: no abras un segundo mientras el
  primero espera). Botón de aceptar: **Apuntar**.
- La lista sale de `Carpetas.ficheros(a.handle)`, ordenada por nombre, como hace
  `js/ficha-documentos.js`. Reutiliza el orden y la marca de extensión de ahí si te sirve; no
  dupliques la lógica de borrar, registrar ni PDF: aquí solo hay casillas.
- Si la carpeta está vacía, el cuadro lo dice en una línea y solo tiene "Dejarlo".
- **Nombres que ya no están**: un documento apuntado cuyo fichero ya no exista en la carpeta (lo
  renombró el registro, o se fue a la papelera) sale igualmente en la lista, marcado, en gris y
  con "(ya no está)" detrás, para poder desmarcarlo y limpiarlo. No lo quites tú solo.
- Al aceptar, un solo guardado por cambio y repintado con
  `window.HitosPanel.programarRepintado()`.
- Usa `U.mientrasGuarda(control, fn)` en el botón de aceptar.

## 3. La lista de documentos apuntados, en el hito

Hoy solo se pinta el nombre con su ✕. Dos retoques pequeños, en el mismo sitio:

- El nombre pasa a ser pulsable y abre el documento en el panel de la derecha
  (`window.Visor.abrir(handle, nombre)`, como `js/ficha-documentos.js`). Si el fichero ya no está
  en la carpeta, no es pulsable y sale en gris.
- El bloque de documentos se pinta **siempre** que el asunto esté abierto, aunque esté vacío, con
  el botón de apuntar debajo. Hoy solo aparece si ya hay alguno, que es justo por lo que
  Francisco no encontró por dónde empezar.

## 4. Trampas conocidas

- **El observador de `js/hitos-panel.js` repinta cada 30 ms.** Si añades algo a mano fuera de un
  repintado entero, pásalo entre `window.HitosPanel.observadorPausar()` y
  `observadorReanudar()`, como hace `mostrarOpcionesDeRama`.
- **Modo consulta y archivo**: el botón solo se pinta con el asunto abierto (`abierto` en
  `filaDeHito`), y `aplicarModoConsulta` (`js/presencia.js`) lo apagará solo, como al resto.
- Nombres ya cogidos: `window.Hitos`, `window.HitosPanel`, `HitosPanelLista`,
  `window.FichaDocumentos`. **No cuelgues nada nuevo de `App`.**
- `Hitos.anadirDocumento` y `Hitos.quitarDocumento` ya existen en `js/hitos-archivo.js`. No hagas
  otras: llámalas.

## 5. Ficheros que hay que tocar

- `js/hitos-documentos.js` — **nuevo**, `window.HitosDocumentos`: el cuadro de elegir documentos.
  Se carga en `index.html` después de `js/hitos-panel-lista.js` y antes de `js/inicio.js`.
- `js/hitos-panel-lista.js` — el botón en el cuerpo del hito, el bloque siempre visible y el
  nombre pulsable. Vigila las 400 líneas: si se pasa, el cuerpo desplegado se va a otro fichero.
- `css/hitos.css` — lo justo para la lista con casillas y el gris de "(ya no está)".
- `pruebas/hitos.mjs` — un escenario nuevo (punto 6).
- `index.html` — la línea del `<script>`.
- `docs/CONTEXTO.md`, `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`, `docs/COLA.md`.

No toques `js/hitos.js`, `js/hitos-archivo.js`, `js/ficha-documentos.js`, `js/ficha-asunto.js`
ni `js/que-me-toca.js`.

## 6. Qué hay que probar

Un escenario nuevo en `pruebas/hitos.mjs`, en navegador: un asunto abierto con dos documentos en
su carpeta y un hito desplegado; se pulsa "Apuntar un documento", se marca uno, se acepta, y ese
nombre aparece en el hito y queda guardado en `hitos.json`. Se vuelve a abrir el cuadro: sale
marcado; se desmarca y desaparece del hito. Un documento apuntado que ya no está en la carpeta
sale en gris con "(ya no está)".

Después, `npm test` entero una vez, y comprobar lo publicado con `curl`.

## 7. Al terminar

- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja, no
  añadiendo una debajo** (la línea de hitos de la sección 5 gana los documentos apuntados).
- Anota en `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- Marca la fila 30 de `docs/COLA.md` como HECHA, con la versión publicada.
- Mensaje final a Francisco: tres frases, qué va a ver en un hito y dónde está el botón.
