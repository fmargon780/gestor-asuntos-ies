# La dirección del buzón de soporte viene del Centro de datos (fila 316 de la cola)

Diseño cerrado con Francisco el 9-oct-2026, en Cowork (conversación del proyecto «Centro de datos
ies»). **Va después de la 313** (`docs/CONFIGURACION-DEL-CENTRO-DE-DATOS.md`): usa su módulo, su
pasada y su fichero de apuntes. Si la 313 no está HECHA, esta fila no se empieza: se deja
PENDIENTE y se coge la siguiente.

## Por qué

Francisco quiere escribir la dirección del buzón de soporte **una sola vez**, en el Centro de
datos, y no copiarla en cada aplicación. Hoy el Gestor la guarda en Ajustes → El centro → «Buzón
de soporte» (`registro.ajustesAvisos.urlSoporte`, en `asuntos.json`).

## Lo que el Centro de datos promete

`configuracion.json` (el mismo que lee la fila 313) gana un grupo:

    "soporte": { "buzon": "https://script.google.com/macros/s/…/exec" }

- `contrato` sigue en 1. Un valor vacío, o el grupo sin poner, quiere decir «no está puesto».
- El Gestor solo lee. Solo usa el valor si empieza por `https://`.
- No hace falta esperar a que el Centro de datos lo tenga publicado (es la fila 4 de su cola):
  mientras no venga, el Gestor se queda exactamente como hoy.

## Decisiones ya tomadas (no se vuelven a discutir)

1. Lo que viene del Centro de datos **se copia a donde ya vive**:
   `registro.ajustesAvisos.urlSoporte`. Así el botón «Soporte», la copia sin internet y el
   ordenador del compañero siguen funcionando igual, sin saber de dónde vino el dato.
2. Lo que viene del Centro de datos **no se cambia en el Gestor**: se cambia allí. Es la misma
   regla de la fila 313 para los datos del centro.
3. Si el Centro de datos no lo trae, **no se borra** la dirección que el Gestor ya tiene.

## Qué hay que hacer

### 1. Leer y copiar

En la misma lectura de `configuracion.json` de la fila 313, con sus mismas guardas
(`SoloConsulta.activo()`, guardado en marcha, `contrato` mayor que 1) y solo cuando `actualizado`
ha cambiado:

- Si `soporte.buzon` no está vacío, empieza por `https://` y es distinto de
  `registro.ajustesAvisos.urlSoporte`, se copia ahí, por el camino con el que ya se guarda ese
  ajuste.
- Si está vacío, no viene o no empieza por `https://`, no se toca nada.

En `_GESTOR/centro-de-datos.json`, dentro de `configuracion` (el apunte de la 313), se añade
`"buzonSoporte": true` cuando la dirección viene del Centro de datos, y se quita cuando deja de
venir.

Si se ha copiado, se añade al aviso verde: «… y la dirección del buzón de soporte».

### 2. Enseñarlo en Ajustes

Ajustes → El centro → «Buzón de soporte» (el campo `#soporte-url`, que pinta `js/soporte.js`):

- Si la dirección viene del Centro de datos, el campo se enseña **sin poder escribir en él**, con
  la nota pequeña «Se cambia en el Centro de datos».
- Si no viene, el campo sigue como hoy.
- En el ordenador sin carpeta señalada se ve igual: sale de `centro-de-datos.json`.

`js/soporte.js` tiene 519 líneas y el tope es 600: en él, solo la llamada que pregunta si la
dirección viene de fuera. La lógica va en `js/centro-de-datos-configuracion.js` (el de la 313).

## Ficheros que se tocan (lista completa)

Se cambian: `js/centro-de-datos-configuracion.js`, `js/soporte.js` (lo mínimo), `js/demo/datos.js`
(el `configuracion.json` de la carpeta de mentira lleva `soporte.buzon` con
`https://buzon.demo.invalido/exec`), `js/novedades.js`,
`pruebas/centro-de-datos-configuracion.mjs`.

**No se toca** `apps-script/soporte.gs` ni el envío del aviso.

Documentos: `docs/CONTEXTO-CORTO.md` (sustituyendo; cuidado con su tope), `docs/HISTORIA.md`.

## Cómo sabemos que está bien

Pruebas de la sesión (`npm test -- centro-de-datos soporte`):

- Con `soporte.buzon` puesto y distinto, se copia a `registro.ajustesAvisos.urlSoporte`; vacío o
  sin el grupo, la dirección del Gestor no cambia; con `http://no-vale`, tampoco.
- Con el mismo `actualizado`, no se lee ni se escribe. Con `SoloConsulta.activo()` o `contrato: 2`,
  tampoco.
- Un aviso enviado después de copiar sale hacia la dirección nueva.

Para el revisor, con datos de demostración:

1. Entrar y abrir Ajustes → El centro → «Buzón de soporte»: el campo enseña
   `https://buzon.demo.invalido/exec`, no se puede escribir en él y a su lado dice «Se cambia en
   el Centro de datos».
2. El botón «Soporte» sigue abajo a la derecha y su ventana se abre y se cierra como antes.
3. En esa ventana, elegir «Propongo una mejora», escribir «Prueba de la revisión» y pulsar
   «Enviar»: como esa dirección no existe, sale el aviso rojo de que no se ha podido contactar con
   el buzón, y el texto sigue en el recuadro.
4. Ajustes → El centro → «Datos del centro» se ve igual que antes de esta fila.
5. **[SOLO FRANCISCO]** Con el enlace ya escrito en el Centro de datos, entrar en el Gestor en el
   centro: Ajustes → El centro → «Buzón de soporte» enseña esa misma dirección y «Se cambia en el
   Centro de datos», y un aviso de prueba llega al Centro de mando.
