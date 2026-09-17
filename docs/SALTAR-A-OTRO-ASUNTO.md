# Saltar a otro asunto del mismo tercero, y volver

Acordado con Francisco el 17-sep-2026. Va **después** de la fila 37
(`docs/FICHA-DEL-ASUNTO-NUEVA.md`), que recoloca la ficha: el bloque puede haber cambiado de
sitio, pero su hueco sigue llamándose `#ficha-otros`.

## Qué pasa hoy

En la ficha de un asunto, el bloque **"Otros asuntos de este tercero"** enseña los nombres de los
demás asuntos de ese mismo tercero (abiertos y en el ARCHIVO). Son texto muerto: no se puede ir a
verlos. Para consultar uno hay que salir a la lista, buscarlo, entrar, y luego volver a buscar el
asunto que se estaba tramitando.

## Qué se quiere

1. Cada línea de ese bloque se pulsa y abre la ficha de ese asunto.
2. En la ficha a la que se ha saltado, arriba, sale un botón **"← Volver a *[asunto de
   partida]*"**.
3. Un solo clic en ese botón devuelve al asunto vivo.
4. Si desde ahí se salta a un tercer asunto, el botón sigue apuntando **al asunto de partida**,
   no al anterior. Nunca hay una cadena de vueltas.

## Ficheros que hay que tocar

| Fichero | Qué se hace |
|---|---|
| `js/otros-del-tercero.js` | **Nuevo.** `window.OtrosDelTercero`: el bloque, el salto y la vuelta |
| `js/ficha-asunto.js` | Quirúrgico: se le quita el bloque y se le añade el hueco de la vuelta |
| `js/duplicados.js` | Una línea: exportar `carpetaDelTercero` en `window.Duplicados` |
| `index.html` | Cargar el `<script>` nuevo |
| `css/ficha-asunto.css` | Estilos de la línea pulsable y del botón de vuelta |
| `pruebas/saltar-a-otro-asunto.mjs` | **Nueva**, en navegador de verdad |

No hay que tocar nada más. **No leas el repositorio entero**: con estos ficheros, `docs/CONTEXTO.md`
y `js/archivo-personas.js` (para copiar cómo se monta un asunto del ARCHIVO) basta.

## El fichero nuevo, y por qué

`js/ficha-asunto.js` ya pasa de 1.000 líneas, así que no puede engordar más (regla de los 400).
Se lleva al módulo nuevo lo que hoy son `listaDeOtros` y `pintarOtrosDelTercero`, tal cual, y ahí
se les añade lo de saltar. Mismo patrón que `js/relacionados.js`: la ficha solo da el hueco.

En `js/ficha-asunto.js`:

- `pintarOtrosDelTercero(a)` se queda reducida a llamar a
  `window.OtrosDelTercero.pintarEnFicha(caja, a, modoActual, { categoria, tercero, tipo })`, con
  la categoría, el tercero (`nombreDelTercero(a)`, que **se queda donde está**, porque también la
  usa "Lo pide") y el tipo ya calculados. Si el módulo no ha cargado, el hueco se queda como está
  y la ficha no se rompe.
- En la cabecera, junto a `#ficha-volver`, un hueco `<div id="ficha-volver-origen"></div>`, y al
  final de `pintarLaFicha` una llamada a `OtrosDelTercero.pintarVuelta($('ficha-volver-origen'), a)`.
- `volverALaLista()` avisa al módulo (`OtrosDelTercero.olvidarOrigen()`).
- `esControlDeSoloLectura` devuelve `true` para `el.id === 'ficha-volver-al-origen'`: es un botón
  que solo navega, tiene que seguir encendido en modo consulta.

## Cómo se abre cada asunto

**Uno abierto**: se busca por nombre en `App.E.listaAbiertos` y se llama a
`App.abrirFicha(a, 'abierto')`, igual que hace `irAlCandidatoAbierto` en `js/duplicados.js`. Si no
está (se ha archivado desde el otro ordenador), aviso de una línea y no se salta.

**Uno del ARCHIVO**: **no se llama a `App.verArchivo`**. Recorre el ARCHIVO entero y es la
operación más cara de la aplicación. Como aquí ya se sabe la categoría y el tercero (son los
mismos con los que se ha buscado), el objeto del asunto se monta a mano, que es una sola lectura
de carpeta:

- si ese nombre ya está en `App.E.listaArchivo`, se usa ese objeto y no se monta nada;
- si no: `padre` = `Duplicados.carpetaDelTercero(categoria, tercero)` (por eso se exporta),
  `handle` = `padre.getDirectoryHandle(nombre)`, `ruta` = `categoria + ' / ' + tercero`,
  `leido` = `Nombres.leer(nombre, App.E.tipos)`,
  `ficha` = `(App.E.registro.asuntos && App.E.registro.asuntos[nombre]) || {}`,
  `busca` montado igual que en `App.verArchivo` (`js/archivo-personas.js`);
- y después `App.abrirFicha(objeto, 'archivado')`.

Si la carpeta no se puede abrir (ya no está, o el permiso del ARCHIVO no está dado): aviso de una
línea, y no se salta. Todo dentro de `try/catch`: **saltar nunca debe romper la ficha**.

## El botón de vuelta

- El módulo guarda `origen = { nombre, modo }` la **primera** vez que se salta. Si ya hay origen
  guardado, no se sustituye: así el botón apunta siempre al asunto de partida.
- Se pinta como `<button id="ficha-volver-al-origen" class="boton">← Volver a …</button>`. El
  nombre del asunto es largo: se recorta a lo que quepa en una línea, con el nombre entero en el
  `title`. La cabecera no debe crecer ni partirse en dos alturas.
- No se pinta en la ficha del propio asunto de partida, ni cuando no hay origen.
- Al pulsarlo se vuelve al origen con las mismas dos reglas de arriba (abierto: de
  `App.E.listaAbiertos`; archivado: montado a mano), y se olvida el origen. Si el asunto de partida
  ya no está, aviso de una línea y a la lista.
- El origen se olvida también: al pulsar "Volver a la lista", y al abrir cualquier ficha desde
  otro sitio (la lista, "Qué me toca", el aviso de duplicados, Por clasificar). Para esto el
  módulo **envuelve `App.abrirFicha`** —el patrón de envolturas de siempre— y borra el origen en
  cada llamada, salvo cuando la llamada la hace el propio módulo (una bandera interna suya).

## Cuidados

- Antes de colgar cualquier función de `App`, comprobar que el nombre no esté ya cogido.
- El `<script>` nuevo va **después** de `js/ficha-asunto.js` y de `js/duplicados.js`.
- Nada de abrir un segundo cuadro de diálogo: aquí no hace falta ninguno.
- No tocar `js/salir.js` ni el comportamiento de Escape.
- La línea pulsable tiene que verse pulsable (cursor, sombreado al pasar por encima, foco visible
  con el teclado), y la marca de "mismo tipo" (`.otros-mismo-tipo`) se queda como está.

## La prueba

`pruebas/saltar-a-otro-asunto.mjs`, en navegador de verdad, con el mismo montaje que
`pruebas/quedarse-en-el-asunto.mjs`. Seis escenarios:

1. El bloque pinta las líneas como pulsables.
2. Pulsar un asunto abierto abre su ficha.
3. Ahí sale el botón "← Volver a …" con el nombre del asunto de partida, y devuelve a él.
4. Saltando A → B → C, en C el botón sigue diciendo "Volver a A".
5. Al salir por "Volver a la lista" y entrar en otro asunto desde la lista, el botón ya no está.
6. Un asunto del ARCHIVO se abre en modo solo lectura sin llamar a `App.verArchivo`.

Una sola pasada de la batería al final (`npm test`), no una comprobación después de cada cambio.

## Al terminar

- **Subir directamente a `main`, sin abrir ninguna pull request.**
- `App.VERSION` con la hora del reloj de verdad (`TZ='Europe/Madrid' date`), nunca a ojo.
- Actualizar `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, y
  anotar en `docs/COLA.md` lo que merezca recordarse.
