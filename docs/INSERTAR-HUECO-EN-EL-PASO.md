# «Insertar hueco» en la comunicación de un paso (fila 158)

25-sep-2026. Francisco: «el botón Insertar hueco no funciona». Pantalla: Ajustes › un tipo ›
guion › un paso › «Comunicación de este paso» › Correo o Mensaje de Séneca › botón «Insertar
hueco» encima del «Texto». Se pulsa y no pasa nada.

## La causa (ya localizada, no hace falta buscarla)

`js/guias-comunicacion.js`, función `enganchar(raiz, idPaso)`, llama a
`PlantillasAjustes.engancharCampoDeTexto(idCuerpo, idHueco, [document.getElementById(idAsunto)])`.
`engancharCampoDeTexto` (en `js/plantillas-ajustes.js`) busca el botón y el texto con
`document.getElementById`. Pero `enganchar` se llama desde `js/guias-paso-bloques.js` (`anadir`,
paso) y `js/guias-opciones-editor.js` (subpaso de una pregunta) **antes** de que el recuadro del
paso se meta en la página (`caja.appendChild(d)` va después, en `js/guias-editor.js`). El botón
todavía no está en el documento, `getElementById` da `null`, y `engancharCampoDeTexto` sale sin
hacer nada, sin error.

## Lo que hay que hacer

1. En `js/guias-comunicacion.js`, `enganchar`: buscar el botón «Insertar hueco», el texto y el
   asunto de cada canal **dentro de `raiz`** (`raiz.querySelector('#' + CSS.escape(id))`, como ya
   hace `leer`), y llamar directamente a
   `HuecosBuscador.montar({ boton: boton, campos: [asunto, cuerpo] })` (mismo orden que hoy: el
   asunto primero, el cuerpo al final). Si falta el botón o el texto, no hacer nada para ese canal.
   Quitar la dependencia de `PlantillasAjustes.engancharCampoDeTexto` en este punto (el HTML del
   campo, `campoDeTextoHTML`, se sigue usando igual).
2. No tocar `js/plantillas-ajustes.js`: allí el cuadro ya está en la página cuando se engancha.
3. Comprobar con `grep` si algún otro sitio llama a `engancharCampoDeTexto` o a
   `HuecosBuscador.montar` sobre un elemento que aún no está en la página (mismo fallo). Si lo
   hay, arreglarlo igual, en el mismo commit.

Lo que Francisco tiene que ver: pulsar «Insertar hueco» abre el buscador de huecos, y el hueco
elegido entra donde estaba el cursor (el asunto o el texto), en Correo y en Séneca, en un paso
normal y en un paso que cuelga de una pregunta.

## Ficheros

- `js/guias-comunicacion.js` (el cambio).
- Una prueba en `pruebas/` (añadir a la que cubra el editor del guion, o una nueva pequeña):
  abrir el editor de un tipo, desplegar «Comunicación de este paso», pulsar «Insertar hueco»,
  elegir un hueco y comprobar que aparece en el texto.
- `docs/COLA.md`, `docs/CONTEXTO-CORTO.md` (solo si dice algo de esto), el hijo de
  `docs/contexto/` que describa `js/guias-comunicacion.js`, y `docs/HISTORIA.md`.

## Reglas

- Cambio quirúrgico: no reescribir ficheros enteros. No leer el repositorio entero.
- Subir directamente a `main`, sin pull request (si la sesión lo obliga, PR y fusionarla sola,
  según la nota de `docs/COLA.md`).
- Una sola pasada de `npm test` al final.
- Reglas de `docs/COLA.md` (sobre todo 10, 11, 13 y 18).
