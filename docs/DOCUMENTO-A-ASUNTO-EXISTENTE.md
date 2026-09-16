# Instrucción: meter un documento de "Por clasificar" en un asunto ya creado

Acordada con Francisco el 16 de septiembre de 2026. Fila 12 de `docs/COLA.md`.

**Sube directamente a `main`. No abras ninguna pull request.**
**No leas el repositorio entero.** Baja solo los ficheros de la lista de abajo.
**Cambios quirúrgicos.** No reescribas ficheros enteros.
**Una sola pasada de pruebas al final**, no una comprobación después de cada cambio.

---

## 1. Qué pasa hoy, y qué falla

"Por clasificar" es la tarjeta `data-vista="clasificar"` de Asuntos abiertos. Lista los ficheros
sueltos que están en la raíz de la carpeta de asuntos abiertos: lo que el equipo directivo deja
ahí desde el explorador.

Cada tarjeta (`App.tarjetaSuelto`, en `js/documentos-sueltos.js`) tiene hoy tres botones:
**Abrir**, **Crear asunto con él** y **Borrar** (este último se lo añade `js/papelera.js` por
envoltura).

Falla lo evidente: **el único destino posible es un asunto nuevo**. Si el documento pertenece a
un asunto que ya existe, no hay por dónde meterlo desde la aplicación.

Las dos piezas que hacen falta ya existen y se usan juntas en `$('btn-crear').onclick` de
`js/asuntos-nuevo.js`: `Carpetas.moverFichero(App.E.abiertos, nombre, carpetaDestino)` y, justo
después, `App.verDocumentos(asunto)` para abrir el cuadro de ponerle nombre.

## 2. Qué hay que construir

### 2.1 Botón "Meter en un asunto"

Botón nuevo en cada tarjeta de "Por clasificar", entre **Crear asunto con él** y **Borrar**.

Abre un cuadro (`U.preguntar`; recuerda que solo hay uno y no se puede abrir un segundo
mientras el primero espera) con dos bloques:

- Arriba, **"Podrían encajar"**: como mucho cinco asuntos, por puntuación de parecido
  (sección 2.2). Si ninguno pasa el mínimo, este bloque no se pinta.
- Debajo, **"Todos los asuntos"**: la lista completa con buscador por texto, abiertos primero y
  archivados después, con la etiqueta "Archivado" bien visible.

Si la fila 11 (`docs/CORREOS-AL-ASUNTO.md`) ya está hecha, **este cuadro y el de los correos son
el mismo**: saca el elegidor a una función compartida en `js/elegir-asunto.js` y que lo usen los
dos. No dupliques el buscador ni la puntuación.

### 2.2 Cómo se mide el parecido

Lo único que se sabe de un documento suelto es el nombre de su fichero. Puntuación:

- **+10 por cada palabra** de cuatro letras o más del nombre del fichero (sin extensión, sin la
  fecha AAMMDD si la trae, sin código de registro) que aparezca en el nombre del asunto.
- **+40** si el nombre del tercero del asunto (apellidos y nombre, en cualquier orden) aparece
  en el nombre del fichero.
- **+15** si el asunto está abierto.
- **+10** si el asunto se creó o se movió en los últimos 30 días.

Se muestran los que pasen de **40 puntos**, como mucho cinco, de mayor a menor.

### 2.3 Qué pasa al elegir un asunto

- **Asunto abierto**: se **mueve** el fichero con `Carpetas.moverFichero` desde la raíz de
  asuntos abiertos a la carpeta del asunto, y acto seguido se abre el cuadro de ponerle nombre
  (`App.verDocumentos`). Es exactamente el camino de "Crear asunto con él", sin crear nada.
- **Asunto archivado**: dos botones, **"Reabrir y meterlo aquí"** (con `App.reabrirAsunto`, que
  deja `estado:'abierto'`, `reabiertoEl`, `reabiertoPor`) y **"Meterlo sin reabrir"**. Si no se
  reabre, el fichero va a la carpeta del asunto dentro del ARCHIVO.
- **Si el traslado falla**: el documento se queda donde estaba y se avisa con una línea:
  "El documento no ha podido entrar en el asunto. Sigue en Por clasificar." No se pierde nada.
- **Si ya hay un fichero con ese nombre en el destino**: no se pisa. Se avisa y se deja el
  documento donde estaba, igual que hace hoy `Documentos.guardar`.
- **No se toca el estado del asunto** cuando ya estaba abierto.
- La tarjeta desaparece de "Por clasificar" en cuanto el traslado sale bien.

### 2.4 Cuidado con el traslado

`Carpetas.moverFichero` ya trae el plan B que hace falta: `handle.move()` no funciona en
carpetas sincronizadas con Dropbox, así que copia, comprueba que la copia pesa lo mismo y solo
entonces borra. **No lo cambies ni lo esquives.** Si la copia no cuadra, no se borra el
original.

Respeta también `App.LARGO_MAXIMO_NOMBRE = 180`: si la ruta de destino se pasa, avisa y deja
decidir, como ya se hace en otros sitios.

### 2.5 Lo que no se toca

- "Crear asunto con él" sigue exactamente igual.
- El cálculo de la fecha de los sueltos sigue limitado a 40 ficheros o menos
  (`var conFecha = lista.length <= 40;`). No lo toques: es lo que mantiene la vista rápida.
- La papelera y la pantalla de Duplicados no se tocan.
- No se abre la carpeta del asunto en el explorador del ordenador: está descartado.

## 3. Ficheros que hay que tocar

| Fichero | Qué |
|---|---|
| `js/documentos-sueltos.js` | Botón "Meter en un asunto" en `App.tarjetaSuelto`, y el traslado |
| `js/elegir-asunto.js` | **Nuevo si no existe.** El cuadro de elegir asunto y la puntuación, compartido con la bandeja de correos |
| `js/bandeja-enlace.js` | Solo si la fila 11 ya está hecha: que use el elegidor compartido en vez de su copia |
| `index.html` | Añadir `js/elegir-asunto.js` **antes** de `js/documentos-sueltos.js` y de `js/bandeja-enlace.js`, y **antes** de `js/papelera.js` |
| `pruebas/documentos-sueltos.mjs` | **Nuevo si no existe.** Pruebas de la sección 4 |
| `docs/CONTEXTO-CORTO.md` | Sustituir la línea de "Por clasificar" por la nueva realidad. Máximo 160 líneas |
| `docs/CONTEXTO.md` | El detalle del elegidor compartido y del traslado |
| `docs/HISTORIA.md` | Anotar el cambio con su fecha |
| `docs/COLA.md` | Fila 12 a EN CURSO al empezar y a HECHA al terminar |

`js/papelera.js` envuelve `App.tarjetaSuelto`, así que **carga después**. Comprueba que tu botón
nuevo sobrevive a esa envoltura y que el botón Borrar sigue apareciendo. `js/documentos.js` y
`js/documentos-sueltos.js` no pasan de 400 líneas, así que no hay que partirlos.

Comprueba que el nombre de cada función nueva de `App` no esté ya cogido.

## 4. Pruebas

En `pruebas/documentos-sueltos.mjs`, con el disco de mentira que ya usan las otras pruebas. Los
dobles de fichero deben traer su `getFile()`. Cada prueba debe fallar sin su cambio antes de
darla por buena.

1. La tarjeta de un documento suelto trae el botón "Meter en un asunto", y sigue trayendo
   "Crear asunto con él" y "Borrar".
2. Elegir un asunto abierto mueve el fichero a su carpeta y lo quita de la raíz.
3. Después del traslado se abre el cuadro de ponerle nombre.
4. Si ya existe un fichero con ese nombre en el destino, no se pisa y el original sigue en la
   raíz.
5. Si el traslado falla, el documento sigue en la raíz y se avisa.
6. La puntuación de parecido pone primero el asunto cuyo tercero aparece en el nombre del
   fichero.

Levanta `python3 -m http.server 8123` y ejecuta las pruebas con Playwright usando
`executablePath '/opt/pw-browsers/chromium'`. No ejecutes `npx playwright install`.
No dejes el repositorio con las pruebas en rojo.

## 5. Al terminar

- Versión `App.VERSION` con fecha y hora de España.
- Comprueba con `curl` que `https://gestor-de-asuntos.vercel.app` sirve los ficheros nuevos,
  usando `?v=<algo distinto>`. No des la publicación por hecha.
- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**.
- Fila 12 de `docs/COLA.md` a HECHA, con fecha y versión.
- Mensaje corto para Francisco, en español, sin jerga: qué has hecho, qué versión está
  publicada, si las pruebas están en verde, y qué va a ver distinto en pantalla.
