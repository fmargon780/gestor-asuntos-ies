# 646 — Coger un documento de «Por clasificar» desde la tarea

**Título llano:** Coger un documento de «Por clasificar» desde la tarea de añadir documento
**Para qué:** que quien tiene delante una tarea de añadir un documento pueda coger el documento de «Por clasificar» desde esa misma tarea, sin tener que salir al otro lado a «Guardar en un asunto».

## Lo que escribió Francisco

Aviso de usuario (13-nov-2026 09:45, copia sin internet, perfil Administración, pantalla «Ficha de un asunto», versión 13-nov-2026 · 08:59), tal cual:

> Si marco que la tarea tiene por acción añadir un documento, solo me deja soltar el pdf. Debería dejarme también coger el documento de la bandeja Por Clasificar.

La captura (`2026-11-13 094510 error.jpg`) enseña el asunto A26-0624, el hito «Registro de salida» y, debajo de la tarea «Añadir documento», solo el recuadro «Suelta aquí el PDF».

## Lo que entendió Claude (acordado con Francisco el 20-nov-2026)

- Causa: la tarea de añadir documento solo ofrece el recuadro «Suelta aquí el PDF» (`js/hito-mesa-guion.js`). No hay forma de coger un documento de «Por clasificar» desde ella. Hoy el camino es el contrario: en «Por clasificar», «Guardar en un asunto» (fila 661).
- Junto al recuadro «Suelta aquí el PDF» sale un botón «Coger de Por clasificar». Sale en las mismas tareas y en las mismas condiciones que el recuadro: la siguiente tarea de añadir documento, con el hito abierto.
- Al pulsarlo sale una lista con los documentos sueltos de «Por clasificar»: nombre y fecha, el más reciente arriba. Se elige uno.
- Al elegirlo sale el cuadro del nombre de siempre, con el hito y la tarea ya puestos y el documento todavía en «Por clasificar». El documento entra en el asunto al pulsar «Guardar», con su nombre y la tarea hecha, como en la fila 661. «Volver», «Cerrar» y la ✕ no guardan nada: el documento sigue en «Por clasificar».
- Si no hay ningún documento suelto, la lista dice «No hay documentos en «Por clasificar».»
- Quien entra como directivo no ve el botón, igual que no ve el recuadro de soltar.
- Soltar un PDF en el recuadro sigue como lo deja la fila 686.

## Pantalla de prueba

- Sin pantalla: es un botón y una lista como la de «Guardar en un asunto». Lo que verá la usuaria es lo escrito arriba, y eso es lo que se aprueba.

## Qué NO se hace en esta tarea

- Los correos de la bandeja y sus adjuntos no se ofrecen en esta lista: solo los documentos sueltos. Siguen entrando por «Guardar en un asunto».
- No se cambia el recuadro «Suelta aquí el PDF» ni su texto (es de la fila 686).
- No se cambian «Añadir documento» de la cabecera ni «Colgar de una tarea».

## Notas técnicas de Claude

- Necesita la fila 686: toca el mismo sitio (`js/hito-mesa-guion.js`, línea del recuadro `.guion-soltar`). Se empieza con la 686 HECHA.
- Pieza nueva `js/tarea-coger-de-bandeja.js`, por debajo de 400 líneas y apuntada en su lista `js/cargar-piezas-3.js` (no en `index.html`). `js/hito-mesa-guion.js` solo añade la llamada que pinta el botón y engancha su pulsación; no debe crecer más de lo imprescindible.
- Los documentos sueltos salen de `App.E.sueltos` (`nombre`, `handle`); la fecha, de `App.fechaDeSuelto`. La lista usa `U.preguntar`: solo puede haber un cuadro a la vez, así que se cierra la lista antes de abrir el cuadro del nombre.
- Al elegir: `App.llevarSueltoA(s, a.nombre, {}, { hito, tarea })`, que ya deja el fichero en la bandeja hasta «Guardar» (`js/bandeja-a-asunto.js`, fila 661). Mirar allí cómo se pasan el hito y la tarea (`opciones.hito`); si la tarea no se admite todavía, añadirla ahí por el mismo camino.
- Textos con las palabras de `docs/VOCABULARIO.md`. Línea en `js/novedades.js`. Poner al día `docs/contexto/DOCUMENTOS.md` y los casos de la demostración: un asunto con una tarea que espera un documento y dos sueltos en «Por clasificar» (y uno sin ninguno).

## Cómo lo comprueba el segundo revisor

- En una tarea de añadir documento (la siguiente sin hacer), junto a «Suelta aquí el PDF» sale «Coger de Por clasificar»; en una tarea que no es la siguiente, o con el hito cerrado, no sale.
- Con documentos sueltos, la lista los enseña con nombre y fecha, el más reciente arriba. Sin ninguno, dice «No hay documentos en «Por clasificar».»
- Al elegir uno sale el cuadro del nombre con el hito y la tarea puestos y el fichero aún en «Por clasificar»; «Volver», «Cerrar» y ✕ lo dejan allí y no apuntan nada.
- Al pulsar «Guardar», el documento está en la carpeta del asunto con su nombre, sale de «Por clasificar», la tarea queda hecha y el Registro lleva su línea.
- Como directivo no sale el botón.
- Soltar un PDF en el recuadro sigue igual que tras la fila 686; «Guardar en un asunto» desde «Por clasificar» sigue igual.

## Qué mirar al terminar

- Abre un asunto con una tarea de añadir documento y pulsa «Coger de Por clasificar».
- Elige un documento: mira que sale el cuadro del nombre con la tarea puesta.
- Pulsa «Volver»: el documento sigue en «Por clasificar».
- Repítelo y pulsa «Guardar»: la tarea queda hecha y el documento ya no está en «Por clasificar».

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
- (25-nov-2026) Revisor (agente aparte, sin ver el código) **APROBADA a la primera**, en `?demo=1&auto=1&latido=hoy`:
  - Botón junto al recuadro, solo en la siguiente tarea de añadir documento con el hito abierto: coincide (en un hito ya hecho no sale).
  - Lista con nombre y fecha, el más reciente arriba; sin sueltos dice «No hay documentos en «Por clasificar».»: coincide.
  - Elegir uno: cuadro del nombre con hito y tarea puestos y el fichero aún en «Por clasificar»; «Volver», «Cerrar» y Escape no guardan nada: coincide.
  - «Guardar»: el documento entra con su nombre, sale de «Por clasificar», la tarea queda hecha y el Registro lleva su línea: coincide.
  - Directivo no ve el botón; soltar un PDF y «Guardar aquí» siguen como antes; consola sin errores; a 1500 y 800 de ancho se ve bien: coincide.
  - No lo he podido ver: la ✕ del cuadro del nombre (no la encontró) y un asunto con el hito cerrado de verdad (probó con un hito ya hecho). Van a `docs/COMPROBAR-A-MANO.md`.
  - Lo que hace y no se pedía (no estorba): el botón sale como enlace subrayado; Escape no cierra la lista (solo «Volver»); el nombre lo pone el cuadro de siempre (fecha de hoy y tipo por defecto).
- `npm test` completo en verde; prueba nueva `pruebas/coger-de-por-clasificar.mjs`.
