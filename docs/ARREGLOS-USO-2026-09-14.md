# Arreglos de uso — 14 de septiembre de 2026

Cuatro arreglos pequeños, acordados con Francisco el 14-sep-2026. Van juntos en una sola
ejecución porque ninguno toca la arquitectura.

## Cómo trabajar esta instrucción

- **Sube directamente a `main`. No abras ninguna pull request.**
- Cambios **quirúrgicos**: toca solo lo necesario, no reescribas ficheros enteros.
- **No leas el repositorio entero.** Lee `docs/CONTEXTO.md` y solo los ficheros que se citan
  abajo. Si alguno de los comportamientos vive en otro fichero, búscalo con una búsqueda de
  texto concreta, no abriendo carpetas enteras.
- **Una sola prueba al final**, con `curl` contra https://gestor-de-asuntos.vercel.app, no una
  comprobación después de cada cambio.
- Si tienes que tocar un fichero de más de 400 líneas y el cambio lo justifica, pártelo en dos.
- Al terminar: `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, y
  lo que merezca recordarse en `docs/HISTORIA.md`.

## Ficheros previstos

| Arreglo | Fichero principal | Otros posibles |
|---|---|---|
| 1. Salidas y tecla Escape | `js/usabilidad.js` | `js/util.js` (diálogo `U.preguntar`), `js/vista.js`, `js/barra.js` |
| 2. Copiar nombre en orden normal | `js/relacionados.js` | `js/copiar.js`, `js/nombres.js` |
| 3. Borrar documento en Sin Clasificar | `js/documentos-sueltos.js` | `js/papelera.js` |
| 4. Carpetas temporales de Drive | `js/carpetas.js` | `js/asuntos-lista.js` |

---

## 1. Que de toda pantalla se pueda salir

**Problema real:** el compañero de Francisco se quedó atrapado en una pantalla sin salida y tuvo
que cerrar el navegador. No recuerda cuál era, así que hay que revisarlas todas.

**Qué hacer:**

1. Recorre todas las pantallas y todas las ventanas emergentes de la aplicación, listándolas
   primero (una búsqueda de las funciones que pintan pantalla o abren diálogo basta; no hace
   falta leer los ficheros enteros).
2. En cada una comprueba dos cosas:
   - Hay un botón de salida **visible sin desplazarse**: «Volver» en una pantalla, «Cancelar»
     en una ventana que pide datos, «Cerrar» en una que solo informa.
   - La tecla **Escape** cierra la ventana o vuelve a la pantalla anterior, sin guardar nada.
3. Donde falte, añádelo, con el mismo aspecto y el mismo sitio que ya tienen los demás.
4. Cuidado con `U.preguntar`: Escape debe cerrar el diálogo abierto y devolver «no», sin dejar
   la aplicación esperando una respuesta que ya no va a llegar, y sin abrir un segundo diálogo.
5. Si una pantalla tiene cambios sin guardar, Escape pregunta antes de descartarlos.
6. Deja en `docs/HISTORIA.md` la lista de pantallas donde faltaba la salida.

## 2. Copiar el nombre en orden normal, desde el asunto

**Para qué:** hasta que existan las plantillas de documentos y de correos, Francisco escribe los
documentos a mano y necesita el nombre en orden normal, sin teclearlo.

**Qué hacer:**

- En la **ficha del asunto**, en la lista de **terceros relacionados**, cada tercero lleva al
  lado un botón pequeño de copiar.
- Al pulsarlo copia al portapapeles el nombre en **orden normal**: `Nombre Apellido1 Apellido2`.
  Es decir, lo contrario de cómo se guarda (`Apellido1 Apellido2, Nombre`).
- En empresas copia la **razón social** tal cual, sin darle la vuelta.
- Confirmación breve en pantalla, del estilo que ya use `js/copiar.js`.
- **No cambia nada de cómo se guarda el nombre** ni de cómo se nombran las carpetas.

## 3. Borrar un documento en Sin Clasificar

- En la categoría **Sin Clasificar** se puede borrar un documento.
- Antes pide confirmación, diciendo el nombre del documento.
- El borrado va a la **papelera** existente, no borra del todo a la primera.

## 4. Que las carpetas temporales de Drive no cuenten como asuntos

- Google Drive y Dropbox dejan carpetas y ficheros temporales que la aplicación está tomando
  por carpetas de asunto abiertas.
- Al recorrer carpetas, descarta las que no encajen con la regla de nombre de asunto
  (`AAMMDD TIPO …`) y las típicas de sincronización: las que empiezan por `.`, `~`, `.tmp`,
  `.~lock`, `Icon\r`, `desktop.ini`, `.DS_Store`, `conflicted copy`, `.dropbox`, `.driveupload`,
  `.tmp.driveupload`, `.tmp.drivedownload`.
- Que el descarte quede en un solo sitio del código, para poder ampliarlo luego sin buscarlo.
- No debe desaparecer ningún asunto de verdad: si una carpeta tiene ficha en
  `_GESTOR/asuntos.json`, se respeta aunque su nombre sea raro.
