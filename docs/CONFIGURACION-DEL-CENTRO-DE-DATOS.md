# Beber del Centro de datos: los datos del centro y la firma

Fila 313 de `docs/COLA.md`. Diseño cerrado con Francisco el 8-oct-2026. **Va después de la 312**
(`docs/BEBER-DEL-CENTRO-DE-DATOS.md`): usa su carpeta señalada, su módulo y su fichero de apuntes.

## Por qué

Francisco quiere escribir los datos del centro y la configuración del correo **una sola vez**, en
el Centro de datos, y no en cada aplicación. El Centro de datos los guarda en
`configuracion.json`, en la misma carpeta «CENTRO DE DATOS» que la fila 312 ya sabe leer.

## Lo que el Centro de datos promete (copia de su contrato, versión 1)

    { "contrato": 1, "actualizado": "2026-10-08T21:40:00+02:00",
      "actualizadoPor": "fmargon780@g.educaand.es",
      "centro": { "nombre": "", "codigo": "", "direccion": "", "localidad": "",
                  "provincia": "", "telefono": "" },
      "correo": { "direccionDelCentro": "", "firma": "" } }

- **Un valor vacío quiere decir «no está puesto»**, no «bórralo». El gestor conserva el suyo.
- Los campos que no se conozcan se ignoran. Con `contrato` mayor que 1, no se toca nada.
- El gestor solo lee.

## Decisiones ya tomadas (no se vuelven a discutir)

1. **La dirección con la que cada persona envía correo no cambia.** Sigue en cada ordenador
   (`gestor-envio-correo`, `js/correo-enviar.js`): lleva la clave de esa persona y no puede estar en
   una carpeta común. Esta fila **no toca el envío**.
2. Lo que viene del Centro de datos **se copia a `_GESTOR/plantillas.json`**, donde ya vive. Así
   las plantillas, el membrete y el ordenador del compañero siguen funcionando igual, sin saber de
   dónde vino el dato.
3. Lo que viene del Centro de datos **no se cambia en el gestor**: se cambia allí.

## Qué hay que hacer

### 1. Leer y copiar

En la misma pasada de la fila 312 (al entrar y con «Traer ahora del Centro de datos»), y con sus
mismas guardas (`SoloConsulta.activo()`, guardado en marcha): leer `configuracion.json`.

| En `configuracion.json` | En `_GESTOR/plantillas.json` |
|---|---|
| `centro.nombre` | `centro` |
| `centro.codigo` | `codigo` |
| `centro.direccion` | `direccion` |
| `centro.localidad` | `localidad` |
| `centro.provincia` | `provincia` |
| `correo.firma` | `firma` |

Por cada fila: si el valor del Centro de datos **no está vacío** y es distinto del que tiene el
gestor, se copia. Si está vacío, no se toca. Se guarda con la función que ya guarda
`plantillas.json` (por su cola), **una sola escritura** con todos los cambios.

`centro.telefono` y `correo.direccionDelCentro` no tienen hoy sitio en el gestor: se leen y se
dejan apuntados (punto 2), sin copiarlos a ninguna parte. `cargo` y `direccionNormativa` son solo
del gestor: no se tocan.

Para no repetir el trabajo en cada entrada, se apunta en `_GESTOR/centro-de-datos.json` (el de la
fila 312), junto a `tomado`:

    "configuracion": { "actualizado": "…", "actualizadoPor": "…", "tomadoEl": "…",
                       "vienen": ["centro", "codigo", "localidad", "provincia", "firma"],
                       "telefono": "…", "direccionDelCentro": "…" }

`vienen` es la lista de los campos del gestor que tienen valor en el Centro de datos. Solo se
vuelve a mirar cuando `actualizado` cambia.

Si se ha copiado algo, se añade al aviso verde de la 312: «… y los datos del centro».

### 2. Enseñarlo en Ajustes

Ajustes → «El centro» → «Datos del centro» (`#bloque-datos-centro`, `js/plantillas-ajustes.js`):

- Cada campo que está en `vienen` se enseña **sin poder escribir en él**, con una nota pequeña al
  lado: «Se cambia en el Centro de datos». Los demás siguen como hoy.
- Si hay alguno, arriba del bloque una línea: «Estos datos vienen del Centro de datos (cambiados
  el 8-oct-2026 por fmargon780).» con el enlace «Abrir el Centro de datos» si `indice.json` trae `web`.
- En el ordenador sin carpeta señalada se ve igual: sale de `centro-de-datos.json`.

`js/plantillas-ajustes.js` tiene 525 líneas y el tope es 600: **la lógica nueva va en un módulo
nuevo**, `js/centro-de-datos-configuracion.js`, y en `plantillas-ajustes.js` solo la llamada que
pregunta si un campo viene de fuera.

## Ficheros que se tocan (lista completa)

Nuevos: `js/centro-de-datos-configuracion.js`, `pruebas/centro-de-datos-configuracion.mjs`.

Se cambian: `js/centro-de-datos.js` (llamar a la lectura de la configuración en la pasada),
`js/plantillas-ajustes.js` (lo mínimo), `index.html` (el `<script>`), `js/demo/datos.js` (un
`configuracion.json` en la carpeta de mentira), `js/novedades.js`.

**No se tocan** `js/correo-enviar.js`, `js/soporte.js` ni `js/cargos.js`.

Documentos: `docs/CONTEXTO-CORTO.md` (sustituyendo; cuidado con su tope), `docs/HISTORIA.md`.

## Cómo sabemos que está bien

1. Con `centro.nombre` puesto y distinto, se copia a `plantillas.json`; con `centro.codigo` vacío,
   el código del gestor no cambia.
2. Con todos los valores vacíos, no se escribe nada y Ajustes se ve como hoy.
3. Entrar otra vez con el mismo `actualizado` no lee ni escribe nada.
4. Los campos de `vienen` no se pueden editar y llevan su nota; los demás, sí.
5. Con `SoloConsulta.activo()`, no se escribe. Con `contrato: 2`, tampoco.
6. Una plantilla con el hueco del nombre del centro sale con el valor nuevo.
7. Nada del envío de correo ha cambiado: `npm test -- correo plantillas` en verde.
