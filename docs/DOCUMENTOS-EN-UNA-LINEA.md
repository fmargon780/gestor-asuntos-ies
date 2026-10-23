# Cada documento, en una sola línea

Fila 439 de `docs/COLA.md`. Diseñado con Francisco el 23-oct-2026, al comprobar la fila 438.

## De dónde sale

Francisco, mirando la carpeta del asunto de Nicolás Amortegui (A26-0464):

> No me gusta la vista de la zona de documentos. Debajo del nombre de cada documento otra línea con
> los botones de opciones no me gusta. Creo que solo deberíamos tener un botón para la ruta, si es
> incorporado a la línea del documento mejor, y el resto de opciones en los tres puntitos a la
> derecha de la línea del documento, de modo que tendríamos una sola línea por documento. En esa
> misma línea tendríamos toda la información necesaria.

Hoy cada documento ocupa dos o tres renglones: el recuadro con el tipo (PDF, ODT…), el nombre y,
debajo, la línea gris de datos (registro, «Alumno: …», fila 436); y debajo del recuadro, una fila
de botones: ⧉, «Ruta», «Registrar», «Cambiar el nombre», «Asociar a un hito», «Traer a este hito»
y ⋮. Con cuatro documentos la lista ya obliga a bajar.

## Lo que decidió Francisco

1. **Una sola línea por documento**, de izquierda a derecha:
   casilla · etiqueta del tipo (PDF, ODT…) · nombre · botón «Ruta» pequeño pegado al nombre ·
   datos en gris (registro, campos como «Alumno: …», candidato) · y, del todo a la derecha, ⋮.
2. **Los datos van en la misma línea, en gris, detrás del nombre** (opción elegida frente a dejarlos
   en un segundo renglón). Si no caben, se cortan con «…» y al pasar el ratón por encima se ven
   enteros (`title`). El nombre no se corta antes que los datos: se corta primero la línea de datos.
3. **Solo «Ruta» queda a la vista.** Todo lo demás pasa al menú ⋮ de la derecha, en este orden:
   copiar el nombre (lo que hacía ⧉), Registrar, Cambiar el nombre, Asociar a un hito, Traer a este
   hito (o Quitar de este hito, según el caso), y después lo que ya tenía el ⋮. Cada acción sale en
   el menú solo cuando hoy saldría su botón (por ejemplo, «Registrar» solo si hoy se ofrece).
4. **Igual en todas las listas de documentos de un asunto**: la carpeta de la ficha (pestaña
   «Trabajo» y las demás donde salga), la mesa del hito, los «gemelos» sangrados, las filas de otros
   hitos y las versiones previas, en la ficha y en la mesa. Mismo aspecto en toda la app.

## Lo que hay que programar

Cambios quirúrgicos. Basta con los ficheros de esta lista.

1. `js/ficha-documentos.js` (`filaDeDocumento`, 511 líneas): rehacer la fila como una sola línea
   (punto 1 de arriba). Los botones ⧉ (`ficha-documento-copiar`), «Registrar», «Cambiar el nombre»,
   `ficha-documento-asociar` y `ficha-documento-traer` dejan de ser botones sueltos y pasan a ser
   entradas del menú ⋮, con la misma función que hoy y las mismas condiciones para salir. La línea
   de datos (`DocumentosDatos.lineaHTML`, clase `ficha-documento-datos`) va dentro de la misma línea,
   tras el botón «Ruta». Si el fichero pasa de 600 líneas, se parte por temas (regla de
   `docs/CONTEXTO-CORTO.md`, sección 6).
2. `js/hito-mesa-documentos.js` (`filasHTML`, gemelos, filas de otros hitos y `previasHTML`): la
   misma fila de una línea. **Una sola función** pinta la fila de un documento en los dos sitios
   (ficha y mesa), o al menos una sola para el menú ⋮ y otra para la línea: nada de copias. Las
   filas de `filaP` (plantillas de «Generar documento», no documentos) no se tocan.
3. El botón «Ruta» es el de la fila 423 (`js/copiar-ruta.js`), sin cambiar lo que hace; solo cambia
   su sitio: pegado al nombre.
4. `css/estilos.css`: la línea no se parte en dos renglones a ningún ancho de escritorio; el texto
   de datos se corta con `text-overflow: ellipsis`. En pantalla estrecha (móvil) puede bajar a dos
   renglones, nunca a una fila de botones.
5. Las pruebas que buscan esos botones por su clase (`ficha-documento-copiar`, `-asociar`,
   `-traer`, «Registrar», «Cambiar el nombre» dentro de la fila) se adaptan para abrir el ⋮ y
   pulsar la entrada. Entre otras: `pruebas/ruta-de-un-documento.mjs`,
   `pruebas/documentos-linea-de-datos.mjs`, `pruebas/quitar-documento-del-hito.mjs`.
6. Prueba nueva `pruebas/documentos-en-una-linea.mjs`: en la demostración, con la ventana a
   1280 px de ancho, cada documento de la carpeta de la ficha y de la mesa del hito mide la altura
   de un solo renglón; su ⋮ trae «Copiar el nombre», «Cambiar el nombre» y «Asociar a un hito»; y un
   documento con datos largos los enseña cortados con «…» y enteros en el `title`.
7. `js/novedades.js`: al principio, «Cada documento ocupa ahora una sola línea: nombre, «Ruta» y sus
   datos; el resto de opciones, en los tres puntitos de la derecha.» (regla 21 de la cola).
8. Al terminar, `docs/CONTEXTO-CORTO.md` (línea «Cada documento, todo en su fila» de la sección 5)
   y `docs/contexto/DOCUMENTOS.md` y `docs/contexto/HITO-MESA.md`: sustituir la línea, no añadir.

### Lo que no cambia

- Lo que hace cada acción: solo cambia dónde está.
- El botón «Ruta» de la carpeta del asunto y la barra del visor.
- La casilla de la izquierda y abrir el documento al pulsar su nombre.

## Ejemplo real

La carpeta del asunto de Nicolás Amortegui (A26-0464): cuatro documentos (un ODT y tres PDF, uno con
registro 26EM0493 y otro con 26SM0724) y «2 versiones previas». En la demostración, un asunto
equivalente.

## Cómo sabré que está bien

1. En la ficha de un asunto, cada documento de la carpeta ocupa una sola línea: casilla, tipo,
   nombre, «Ruta», datos en gris y ⋮ a la derecha. No hay fila de botones debajo.
2. Al pulsar ⋮ salen «Copiar el nombre», «Cambiar el nombre», «Asociar a un hito» y, en un PDF sin
   registrar, «Registrar»; cada una hace lo mismo que hacía su botón.
3. Un documento con muchos datos los enseña cortados con «…» y, al pasar el ratón, enteros.
4. La mesa de un hito y las versiones previas, al desplegarlas, enseñan sus documentos igual, en
   una sola línea.
5. **[SOLO FRANCISCO]** En el asunto A26-0464, los cuatro documentos caben a la vista sin bajar y
   se lee en cada línea lo necesario para saber cuál es.
