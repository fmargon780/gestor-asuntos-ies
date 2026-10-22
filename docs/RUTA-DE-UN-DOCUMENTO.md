# Botón «Ruta» en cada documento

Fila 423 de `docs/COLA.md`. Tema 391, idea 379. Diseñado con Francisco el 22-oct-2026.

## De dónde sale

Aviso de usuario de Francisco (20-oct-2026, pantalla «Ficha de un asunto»):

> Igual que tenemos la ruta de la carpeta, ¿podríamos tener un botón con la ruta del documento? Lo
> usaría para cuando tengo que adjuntar el documento a Séneca, ir directo al documento y no tener
> que elegir de entre los documentos de la carpeta como ahora.

Hoy el botón «Ruta» de la ficha copia la ruta de la **carpeta** del asunto. Al adjuntar en Séneca,
Francisco pega esa ruta en la ventana de elegir fichero y después tiene que buscar el documento
entre todos los de la carpeta. Con la ruta del **documento**, pegarla abre directamente ese fichero.

## Lo que decidió Francisco

1. **Dónde sale:** en tres sitios, todos con el mismo botón:
   - en cada documento de la lista de la ficha del asunto;
   - en cada documento de la mesa de un hito;
   - en la barra de arriba del visor, junto al nombre del fichero abierto (el visor de PDF y el de
     Word).
2. **Cómo se llama:** «Ruta», la misma palabra que el botón «Ruta» de la carpeta, pero en
   **tamaño pequeño**, como el ⧉ que tiene al lado (`boton boton-chico`), para que la fila del
   documento no crezca ni se parta. Va justo detrás del botón ⧉ que ya tiene cada documento (el ⧉ sigue igual: copia el
   nombre sin la extensión).
3. **Versiones previas:** los documentos de «Versiones previas» (carpeta `_Previas` o, en asuntos
   antiguos, `Versiones previas`), al desplegarla, también llevan el botón.

## Lo que hay que programar

Cambios quirúrgicos. No leas el repositorio entero: basta con los ficheros de esta lista.
Sube directamente a `main` siguiendo `CLAUDE.md` (rama de la fila, revisor y fusión), sin dejar
ninguna petición de cambios abierta.

1. `js/copiar-ruta.js` (`window.RutaCarpetas`). Una función nueva y pública que dé la ruta de un
   documento: la misma ruta que hoy da `de(a, modo)` para la carpeta del asunto (abierto o
   archivado), más las subcarpetas en las que esté el documento (por ejemplo la de versiones
   previas, con su nombre real en el disco) y el nombre del fichero **con su extensión**. Mismo
   separador (`\` o `/`) que la ruta de la carpeta, nunca `file:///`. Y una función para el botón
   que haga lo mismo que el botón «Ruta» de la carpeta:
   - si falta la ruta de Dropbox de este ordenador o la del centro, la pide con el mismo cuadro de
     siempre (`cuerpoPedirRutaHTML` / `guardarYCopiar`) y después copia la del documento;
   - al copiar, el aviso verde de siempre: «Ruta copiada: <ruta entera>».
   El fichero tiene 456 líneas: si al añadir pasa de 600, saca lo nuevo a un fichero aparte
   (`js/copiar-ruta-documento.js`) y cárgalo en `index.html` detrás de `js/copiar-ruta.js`.
2. `js/ficha-documentos.js` (`filaDeDocumento`): el botón «Ruta» justo detrás del ⧉
   (`ficha-documento-copiar`), con `ev.stopPropagation()` como el ⧉.
3. `js/hito-mesa-documentos.js`: el mismo botón en cada documento de la mesa del hito: las filas
   de `filasHTML`, los «gemelos» sangrados, las filas de otros hitos y las previas de
   `previasHTML`. **No** en las filas de `filaP` (son plantillas de «Generar documento», no
   documentos).
4. Versiones previas: en la ficha las pinta el bloque `ficha-previas` de `js/ficha-documentos.js`;
   en la mesa, `previasHTML` (punto 3). El botón va en las dos. `js/versiones-previas.js` solo se
   toca, si hace falta, para saber el nombre real de la subcarpeta (`_Previas` o
   `Versiones previas`).
5. `js/visor.js` y `js/word-visor.js`: el botón «Ruta» en la barra de arriba, junto al nombre del
   fichero abierto. Hoy el visor no sabe de qué asunto es el fichero (`abrirDocumento`, en
   `js/ficha-documentos.js`, solo le pasa `acciones`): quien lo abre desde la ficha, la mesa del
   hito o las versiones previas le pasa también el asunto, si está archivado y la subcarpeta. Con
   eso, el botón sale siempre que el documento sea de un asunto (también la factura del ejemplo,
   abierta desde la ficha). Solo un documento suelto que no es de ningún asunto («Ver todo») se
   queda sin él.
6. Una sola función para pintar el botón, usada en todos los sitios: nada de copias. Si está
   archivado o abierto, cada sitio lo saca del mismo dato que ya usa la ficha (`modoDelAsunto`,
   en `js/ficha-nombre-acciones.js`): se pasa como parámetro, no se adivina.
6 bis. El cuadro que pide la ruta cuando falta (`guardarYCopiar`, `pedirRutaConPreguntar`) recibe
   qué copiar al terminar (la carpeta o el documento), con un parámetro; su texto no cambia,
   porque lo que pide es la ruta de la carpeta del centro, igual que hoy.
7. Solo consulta y perfil directivo: copiar no escribe nada, así que el botón sale también ahí.
8. `css/estilos.css` solo si hace falta para que el botón pequeño quede bien junto al ⧉.
9. `js/novedades.js`: una línea al principio, «Cada documento tiene ahora su botón «Ruta»: copia
   la ruta del documento para pegarla al adjuntarlo en Séneca.» (regla 21 de la cola).
10. Prueba nueva `pruebas/ruta-de-un-documento.mjs`: con la demostración (si no trae puestas las
    rutas de Dropbox y del centro, la prueba las pone antes), la ruta copiada de un
    documento de un asunto abierto, de uno archivado y de uno de «Versiones previas» acaba en
    `\<carpeta del asunto>\<nombre del fichero>.pdf` (y `\_Previas\…` o
    `\Versiones previas\…` en el tercero). Una sola pasada completa de `npm test` al final.
11. Al terminar, `docs/CONTEXTO-CORTO.md` (línea del botón «Ruta», sección 5) y
    `docs/contexto/DOCUMENTOS.md` (y `docs/contexto/HITO-MESA.md` por la mesa): sustituir la línea, no añadir otra.

### Lo que no cambia

- El botón «Ruta» de la carpeta y el ⧉ de cada documento siguen igual.
- No se abre el documento ni la carpeta en el explorador (descartado, `docs/CONTEXTO-CORTO.md`,
  sección 7): solo se copia la ruta.

## Ejemplo real

La factura «261019 FACTURA D26-00259.pdf» del asunto de Amazon (W0184081H) del 19-oct-2026: es la
que Francisco tenía abierta cuando pidió la idea. Pulsar «Ruta» junto a ella copia la ruta entera
de ese PDF. En la demostración se usa un documento equivalente.

## Cómo sabré que está bien

1. En la ficha de un asunto, cada documento lleva el botón «Ruta» justo detrás del ⧉.
2. Al pulsarlo y pegar lo copiado en cualquier sitio, sale la ruta entera del documento, con su
   nombre y su «.pdf» al final.
3. El mismo botón sale en la mesa de un hito y en la barra de arriba del visor, junto al nombre del
   fichero.
4. Al desplegar «Versiones previas», sus documentos también lo llevan.
5. **[SOLO FRANCISCO]** En Séneca, al adjuntar, pegar la ruta de la factura D26-00259 en la ventana
   de elegir fichero abre directamente la factura, sin buscarla.
