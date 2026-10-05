# Cambiar los datos del tercero desde el asunto, y que las carpetas le sigan (fila 266)

Aviso de usuario del 5-oct-2026 (pantalla «Ficha de un asunto»), diseñado con Francisco el mismo
día.

## Qué pasó

Un usuario preguntó por el botón de soporte, desde la ficha de un asunto: «¿Cómo puedo modificar
el CIF de una empresa?». Versión `05-oct-2026 · 09:04`.

No es un error. Hoy se puede, pero solo desde Personas y empresas: se busca la empresa y se pulsa
«Cambiar los datos» (`App.cambiarDatosDelTercero`, `js/archivo-personas.js`). Desde la ficha de un
asunto no hay camino hasta ese botón.

Además, hoy el cambio se queda a medias. El NIF va en el texto del tercero, y ese texto va en el
nombre de la carpeta de cada asunto y en el de la carpeta del tercero en el ARCHIVO. Al cambiar el
NIF, esas carpetas conservan el viejo y la aplicación solo avisa. Solo hay un caso que ya renombra:
el aspirante al que se le escribe el Nº de identificación escolar (fila 42,
`App.renombrarAsuntosAbiertosDelTercero`, `js/asuntos-editar.js`).

## Qué quiere Francisco

1. En la ficha de un asunto abierto, junto a los datos del tercero, sale **«Cambiar los datos»**.
   Abre el mismo cuadro que ya existe (`App.cuadroDeTercero`), relleno.
2. Sale solo para terceros dados de alta a mano, con la misma condición que usa hoy el botón de
   Personas y empresas. Los que vienen de Séneca se corrigen en Séneca. No se amplía a nadie más.
3. Si al guardar cambia el **texto del tercero** (`App.textoTercero`: el NIF, la razón social, el
   nombre, el documento, el Nº escolar), la aplicación enseña antes la lista de asuntos abiertos
   de ese tercero y, con «Adelante», les cambia el nombre a las carpetas.
4. En el ARCHIVO cambia el nombre de **la carpeta del tercero**. Los asuntos archivados de dentro
   **no se tocan**: conservan su nombre, con el NIF viejo, tal como se cerraron.
5. Vale igual desde Personas y empresas. El resultado es el mismo se entre por donde se entre.
6. Vale para cualquier tercero dado de alta a mano, no solo empresas.
7. Donde ese tercero figure con su texto viejo (relacionado de otro asunto, miembro de un grupo,
   asunto recurrente), se pone al día.

## Parte A — el botón en la ficha del asunto

- Va en la tarjeta del tercero de la ficha del asunto (`js/ficha-tercero.js`), en la línea de
  «Datos y contacto», a la derecha. Texto: «Cambiar los datos», igual que en Personas y empresas.
- Sale solo si se cumplen las tres cosas: el asunto está **abierto**; el tercero se ha encontrado
  en el CSV de hoy (no sale si los datos vienen de la foto guardada, `persona.foto`); y es de alta
  a mano (la misma condición de hoy, `p.deSeneca !== true`, y la que ya excluya a tutores legales
  y Administraciones: no la reescribas, llámala).
- Apagado en modo consulta (el compañero dentro) y en solo consulta (fila 260), como todo control
  que cambia algo.
- Al pulsarlo llama al mismo camino que el botón de Personas y empresas. **Un solo camino**: no se
  copia el código de `App.cambiarDatosDelTercero`; si hace falta, se le añade un parámetro para
  saber desde dónde se llama y qué repintar al acabar.
- En la ficha de un asunto archivado el botón no sale.

## Parte B — al guardar, si cambia el texto del tercero

Se calcula `App.textoTercero` de antes y de después. Si es el mismo (cambió el teléfono, el correo,
el nombre comercial), se guarda como hoy y no pasa nada más.

Si es distinto, este es el orden:

### 1. Preguntar antes de guardar nada

Se cierra el cuadro de los datos y se abre otro (un solo `U.preguntar` a la vez). Ancho, con la
lista a todo el ancho: Francisco no quiere renglones estrechos con hueco a los lados.

- Título: «Cambia el nombre de las carpetas».
- Texto: «El nombre de este tercero pasa de «VIEJO» a «NUEVO». Las carpetas de sus asuntos llevan
  ese nombre, así que cambian también.»
- Lista «Asuntos abiertos (N)»: el nombre de cada carpeta, uno por línea. Con más de 12, la lista
  lleva su propia barra y los botones no se van de la vista. Sin ninguno, la lista no sale.
- Una línea más si el tercero tiene carpeta en el ARCHIVO: «Su carpeta del archivo cambia de
  nombre. Los asuntos archivados de dentro se quedan como están.»
- Si no hay ni asuntos abiertos ni carpeta en el ARCHIVO, este cuadro no sale: se guarda sin más.
- Botones: «Adelante» y «Cancelar». Con «Cancelar» **no se guarda nada**, tampoco los datos.

Los asuntos abiertos de ese tercero se buscan como ya lo hace
`App.renombrarAsuntosAbiertosDelTercero`: las carpetas de `App.E.abiertos` que terminan en el
texto de antes.

### 2. Guardar los datos (lo principal)

`Datos.guardarEnLista`, como hoy. Si falla: `U.fallo`, rojo, y no se renombra nada.

### 3. Cambiar el nombre de las carpetas de los asuntos abiertos

- Una a una. **Siempre por `AsuntoRenombrar`** (`js/asunto-renombrar.js`): mueve a la vez la
  ficha, los hitos y la señal de presencia, y deja la lápida de la clave vieja. Si
  `App.renombrarAsuntosAbiertosDelTercero` hoy va por `Carpetas.renombrar` y mueve la ficha a
  mano, se cambia para que vaya por `AsuntoRenombrar`.
- Esa función se generaliza: hoy solo sirve para el aspirante que estrena Nº escolar; pasa a
  servir para cualquier cambio del texto del tercero. El caso del aspirante sigue funcionando por
  este mismo camino, con el cuadro nuevo.
- Un asunto que el compañero tiene abierto en el otro ordenador (presencia) o que está ocupado
  (`App.E.ocupados`) **no se renombra**: se salta.
- En cada asunto renombrado se pone al día `ficha.contacto` (la foto del contacto) con
  `Datos.fotoDeContacto` de los datos nuevos.
- El largo de la ruta nunca impide el cambio (fila 263): si alguna carpeta se pasa, sale su aviso
  ámbar de siempre.

### 4. Cambiar el nombre de la carpeta del tercero en el ARCHIVO

- Es `<ARCHIVO>/<categoría>/<tercero>`, la que da `Duplicados.carpetaDelTercero` (con el nombre
  pasado por `Nombres.carpetaDeTercero`). Se le cambia el nombre con las funciones de `Carpetas`
  que ya usa archivar.
- Si ya existe una carpeta con el nombre nuevo, se **fusiona** dentro de ella
  (`Carpetas.fusionarEn`), igual que al archivar sobre un destino que ya existe.
- Lo de dentro no se toca: ni el nombre de los asuntos archivados, ni sus documentos, ni sus
  fichas, ni las carpetas-nota `(RELACIONADO) …`.
- Después se ponen al día en `_GESTOR/indice-archivo.json` las entradas de ese tercero (`tercero`
  y `ruta`), por la cola de ese fichero, para que el buscador del Archivo no apunte a la carpeta
  vieja. Si ya hay una función que rehace el índice de un solo tercero, se usa esa.
- Si el tercero no tiene carpeta en el ARCHIVO, este paso no hace nada.

### 5. Poner al día los demás sitios que guardan el texto viejo

- `ficha.relacionados` de los asuntos abiertos donde figure (`{ categoria, nombre }`): por el
  mismo camino que quitar y añadir un relacionado a mano (`App.anotarLista`; la lista nunca se
  sustituye entera).
- `_GESTOR/grupos.json`: los miembros con esa categoría y ese nombre (`Grupos.guardar`).
- `_GESTOR/recurrentes.json`: los recurrentes de ese tercero.
- Busca si algún otro fichero de `_GESTOR` guarda el texto del tercero (una búsqueda de quién
  guarda `App.textoTercero`, no una lectura del repositorio). Si lo hay, se pone al día igual.
- **No se tocan**: los relacionados de asuntos ya archivados y el texto de los ficheros `DONDE
  ESTA ESTE ASUNTO.txt`. Es un límite aceptado: se apunta en `docs/contexto/PERSONAS.md`.

### 6. Avisos

- Todo bien: verde, «Datos cambiados. N carpetas con el nombre nuevo.» (o «Datos cambiados.» si no
  había carpetas).
- Los pasos 3, 4 y 5 son accesorios: si alguno falla, `U.accesorio`, ámbar, diciendo qué no se ha
  podido cambiar, con el nombre de la carpeta. Los datos quedan guardados.
- Asuntos saltados por estar abiertos en el otro ordenador: ámbar, «N asunto(s) no han cambiado
  de nombre porque están abiertos en otro ordenador: NOMBRES. Cuando queden libres, cámbialos con
  «Cambiar el asunto».»
- Todo el tiempo que dura, el botón en «Guardando…» (`U.mientrasGuarda`, solo alrededor de la
  escritura, nunca del cuadro).

### 7. La pantalla, al acabar

- **Desde la ficha de un asunto**: la ficha sigue abierta, en el mismo asunto, ya con el nombre
  nuevo de la carpeta y los datos nuevos del tercero. **Sin ningún aviso rojo.** Ojo: hay un fallo
  conocido (apuntado en `docs/COLA.md`): al cambiar el nombre de la carpeta desde la ficha,
  `App.reengancharFicha` (`js/ficha-huella.js`) busca el nombre viejo y saca «Este asunto ya no
  está en Asuntos abiertos…». Aquí no puede salir. Si el arreglo es común, que valga también para
  el cambio de tipo desde la ficha, y se quita esa nota de la cola.
- **Desde Personas y empresas**: la ficha de la persona se repinta con los datos nuevos, y «Sus
  asuntos» enseña los abiertos con su nombre nuevo y los archivados, todos juntos.
- Inicio, al volver, enseña los asuntos con el tercero nuevo.

## Qué NO se toca

- El cuadro de los datos (`App.cuadroDeTercero`) y su guardia de duplicados: igual que hoy.
- Los terceros de Séneca, los tutores legales y las Administraciones: sin botón nuevo.
- El nombre de ninguna carpeta de asunto archivado, ni de ningún documento.
- «Cambiar el asunto» de la ficha: sigue igual.
- No hay botón «Cambiar los datos» en el buscador de «Nuevo asunto» (sigue pendiente de ver con
  el uso).

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/PERSONAS.md` (apartados
  «Cambiar los datos de un tercero» y «Aspirantes a plaza»), `docs/contexto/ASUNTOS-ARCHIVO.md`
  (archivar y el índice del ARCHIVO) y los ficheros de la lista basta.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- Ningún fichero de `js/` pasa de 600 líneas. Lo nuevo de la parte B va en un fichero nuevo y
  pequeño; `js/archivo-personas.js` y `js/asuntos-editar.js` solo lo llaman. Si alguno de los que
  tocas ya pasa de unas 400, pártelo.
- El módulo nuevo no envuelve nada: se le llama.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Rama `fila-266`, revisor en local y, con su APROBADA, a `main`. Nada se queda en una petición de
  cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs empresas
  aspirantes cambiar-datos`); la pasada completa, una sola vez al final.
- Ningún dato real de personas ni de empresas en las pruebas ni en los documentos: inventados.

## Ficheros

- `js/tercero-renombrar.js` (nuevo: el cuadro «Cambia el nombre de las carpetas» y los pasos 3, 4
  y 5 de la parte B).
- `js/archivo-personas.js` (`App.cambiarDatosDelTercero`: comparar el texto de antes y de después,
  y llamar a lo nuevo; valer también llamado desde la ficha del asunto).
- `js/asuntos-editar.js` (`App.renombrarAsuntosAbiertosDelTercero`: generalizada y por
  `AsuntoRenombrar`; si queda mejor entera en el fichero nuevo, se mueve).
- `js/ficha-tercero.js` (el botón en la tarjeta del tercero).
- `js/ficha-huella.js` (solo si hace falta para que la ficha siga al asunto renombrado).
- `index.html` y la lista de ficheros de la copia sin internet (el `js/` nuevo); `css/` solo si el
  botón o el cuadro necesitan algo.
- `pruebas/cambiar-datos-desde-el-asunto.mjs` (nueva, con los puntos de abajo);
  `pruebas/empresas.mjs` y `pruebas/aspirantes-numero.mjs` (los textos y pasos que cambian).
- `js/novedades.js`: «Los datos de una empresa, o de cualquier tercero dado de alta a mano, se
  pueden cambiar desde la ficha del asunto. Si cambia el NIF o el nombre, las carpetas de sus
  asuntos abiertos y la suya del archivo cambian de nombre solas.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (sustituyendo la línea «Nombre comercial de empresas;
  cambiar un tercero dado de alta a mano.»), `docs/contexto/PERSONAS.md` («Cambiar los datos de un
  tercero» y «Aspirantes a plaza»), `docs/HISTORIA.md` y, si se arregla, la nota del fallo de
  `App.reengancharFicha` en `docs/COLA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que «Cambiar los datos» ya sale en la ficha del asunto; que al cambiar el NIF o
el nombre las carpetas abiertas y la del archivo cambian solas; y la respuesta para quien mandó el
aviso, en una línea: «En la ficha del asunto, junto a los datos de la empresa, pulsa «Cambiar los
datos».»

## Cómo sabemos que está bien

Para todos los puntos: una empresa inventada dada de alta a mano, «TALLERES INVENTADOS SL», NIF
`B00000001`, con dos asuntos abiertos y uno archivado.

1. En la ficha de uno de sus asuntos abiertos, en la tarjeta del tercero, sale «Cambiar los
   datos». Al pulsarlo se abre el cuadro de los datos, relleno con los de la empresa.
2. Cambiar solo el teléfono y guardar: no sale ningún cuadro más, el teléfono nuevo se ve en la
   ficha del asunto y ninguna carpeta cambia de nombre.
3. Cambiar el NIF a `B00000002` y guardar: sale «Cambia el nombre de las carpetas» con el texto de
   antes y el de después, «Asuntos abiertos (2)» con las dos carpetas, y la línea de la carpeta
   del archivo.
4. «Cancelar» en ese cuadro: `empresas.csv` sigue con `B00000001` y ninguna carpeta ha cambiado.
5. Repetir y pulsar «Adelante»: `empresas.csv` tiene `B00000002`; las dos carpetas de ASUNTOS
   ABIERTOS terminan en el texto nuevo; la ficha, los hitos y los documentos de cada asunto siguen
   con él (mismo número `A26-…`, mismos hitos hechos).
6. Tras el punto 5, la ficha del asunto desde la que se pulsó sigue abierta, con el nombre nuevo
   en la cabecera, y no hay ningún aviso rojo en pantalla.
7. En el ARCHIVO, la carpeta de la empresa lleva el texto nuevo y ya no existe la del texto viejo.
   Dentro, la carpeta del asunto archivado conserva su nombre exacto de antes, con `B00000001`.
8. En Personas y empresas, la ficha de la empresa enseña en «Sus asuntos» los dos abiertos y el
   archivado. Buscar el asunto archivado en Archivo lo encuentra y se abre.
9. Lo mismo empezando desde Personas y empresas («Cambiar los datos» de la ficha de la empresa):
   mismo cuadro, mismo resultado en carpetas.
10. La empresa figuraba como relacionada en un asunto abierto de otro tercero, como miembro de un
    grupo y en un asunto recurrente: después del cambio, en los tres sitios sale con el texto
    nuevo, una sola vez.
11. Con uno de los dos asuntos abierto por otro usuario (presencia): ese no cambia de nombre, el
    otro sí, y sale el aviso ámbar «1 asunto(s) no han cambiado de nombre porque están abiertos en
    otro ordenador…» con su nombre.
12. Si en el ARCHIVO ya existía una carpeta con el texto nuevo: después hay una sola carpeta, con
    los asuntos de las dos dentro.
13. Un tercero de Séneca (alumnado matriculado, personal de `RelPerCen`): en la ficha de su asunto
    no sale «Cambiar los datos».
14. En la ficha de un asunto archivado, en modo consulta y en solo consulta: el botón no sale o
    está apagado.
15. El aspirante sin Nº escolar al que se le escribe el número (`pruebas/aspirantes-numero.mjs`):
    sigue renombrando solo el asunto abierto, ahora con el cuadro nuevo.
16. Ningún fichero de `js/` pasa de 600 líneas.
