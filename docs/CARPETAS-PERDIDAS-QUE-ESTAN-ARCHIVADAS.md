# Asuntos «sin carpeta» cuya carpeta sí existe (fila 303)

Cerrado con Francisco el 8-oct-2026. Sale de su idea 303, apuntada desde el Centro de mando con un
recorte de pantalla. Sigue a la fila 292 (`docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md`), que dejó
«Buscar su carpeta» proponiendo la carpeta que más se parece.

## Qué pasó

En el centro, Ajustes → «Problemas» enseña la tarjeta «21 asuntos han perdido su carpeta». Al
pulsar «Buscar su carpeta» en uno de ellos, el cuadro ofreció **una sola carpeta**, de otra persona
y de otro tipo. No había forma de buscar otra. Francisco: «si no, no podremos arreglar casi
ninguna de esas incidencias».

Lo que se comprobó con él, con ese asunto (los nombres de aquí son inventados; el caso es el real):

- La app tiene apuntado `260917 TRASLADO MATR VIVA 26-27 Apellido Apellido, Nombre 1234567`.
- La carpeta existe. Está en el ARCHIVO, dentro de la carpeta de esa persona:
  `ARCHIVO/ALUMNADO/Apellido Apellido, Nombre 1234567/260917 TRAS. MATR. VIVA 26-27 Apellido Apellido, Nombre 1234567`.
- Misma fecha, mismo curso, misma persona. Solo cambia cómo está escrito el tipo.

Por qué el cuadro no la ofrecía: `carpetasSinFicha()` de `js/fichas-huerfanas.js` solo da por
candidatas las carpetas de **asuntos abiertos que no tienen asunto apuntado**. Las archivadas y las
que ya tienen asunto no entran nunca.

## Qué quiere Francisco (decidido por él el 8-oct-2026)

1. La app **busca sola** la carpeta de cada asunto perdido, antes de pedirle nada.
2. Lo que encuentre lo enseña en **una lista, con un solo botón** «Enlazar los N», y él puede
   desmarcar el que no le cuadre. No se arregla nada sin que lo vea, y no va uno por uno.
3. Para los que la app no encuentre, un **buscador por palabras** entre todas las carpetas: las de
   asuntos abiertos y las archivadas.
4. Si la carpeta elegida **ya tiene su propio asunto**, la app avisa antes y **los une en uno**, que
   conserva los hitos y las notas de los dos, sin repetir los iguales. Con «Deshacer».

Decidido por la conversación de diseño, sin preguntarle: si la carpeta está en el ARCHIVO, el
asunto queda archivado y toma el nombre de la carpeta (la carpeta ni se mueve ni cambia de nombre);
y en esta misma fila se busca la causa (apartado 7).

## Qué hay que hacer

### 1. Qué carpetas son candidatas

Para un asunto perdido, candidatas son:

- Todas las carpetas de asuntos abiertos, tengan o no asunto apuntado.
- Todas las carpetas de asuntos del ARCHIVO, de cualquier curso.

De dónde salen las archivadas, sin lecturas caras:

- Primero, el índice guardado del ARCHIVO (`IndiceArchivo.leerDisco({ todos: true })`).
- Además, y aunque el índice exista, **la carpeta de esa persona en el ARCHIVO se lee directamente**
  (`ARCHIVO/<categoría>/<tercero>`, una sola carpeta por asunto perdido). El índice puede estar sin
  hacer o atrasado, y es justo ahí donde están los casos del centro. La categoría y el tercero salen
  de la ficha si los tiene y, si no, del nombre (`Nombres.leer`).
- Esa lectura se hace **al abrir la pestaña «Problemas» o al pulsar**, nunca de fondo en cada
  repintado, y nunca con un guardado en marcha. El número de la tarjeta, el de Inicio y el del menú
  siguen saliendo del cálculo barato de hoy.

### 2. Cuándo «encaja» una carpeta (la app la propone sola)

Se amplía `js/parecido-de-carpetas.js`; no se escribe otra función de parecido aparte.

Una candidata **encaja** con un asunto perdido si:

- lleva el mismo número del asunto (`A26-0137`); o
- tiene la **misma fecha** (`AAMMDD`) y el **mismo tercero**, y su tipo **no es otro tipo distinto**.
  «No es otro distinto» quiere decir: es el mismo tipo; o uno es el nombre corto, el nombre antiguo
  o un alias del otro; o uno es el otro abreviado (palabra a palabra, quitando puntos, cada palabra
  de uno es el principio de la del otro: `TRAS. MATR. VIVA` ≈ `TRASLADO MATR VIVA`).

Y además es **la única** que encaja. Con dos que encajan, la app no propone ninguna: ese asunto va
al buscador, con las dos arriba.

Una carpeta que ya es la propuesta de otro asunto perdido no se propone dos veces: ninguno de los
dos entra en la lista.

### 3. La lista y su botón

En la tarjeta «N asuntos han perdido su carpeta», encima de «Asunto por asunto:», un bloque nuevo
cuando la app ha encontrado alguna:

- Título: «La app ha encontrado la carpeta de N de ellos».
- Una fila por asunto, con su casilla **ya marcada**:
  - el nombre del asunto perdido;
  - debajo, «Su carpeta:» y el nombre de la carpeta encontrada;
  - dónde está: «En asuntos abiertos» o «En el ARCHIVO»;
  - si la carpeta ya tiene asunto: «Ya tiene su asunto: se unen en uno.»;
  - si el asunto perdido tiene hitos sin hacer y la carpeta está en el ARCHIVO: «Queda archivado
    con N hitos sin hacer.»
- Un botón: **«Enlazar los N»**. El número sigue a las casillas marcadas; con una sola dice
  «Enlazar 1». Con ninguna, apagado.
- Al pulsarlo, sin más preguntas, se enlazan uno detrás de otro (apartado 5). Con más de cinco,
  una barra de progreso.
- Al terminar, aviso verde «N asuntos enlazados con su carpeta.», con **«Deshacer»**. Si alguno
  falla, los demás siguen, y el aviso sale en ámbar diciendo cuáles no y por qué
  (`U.mensajeDeError`).
- Los enlazados desaparecen de la tarjeta. Los que la app no encontró, y los desmarcados, siguen
  debajo, en «Asunto por asunto», con sus dos botones de siempre.

Mientras la app busca, el bloque dice «Buscando sus carpetas…». Si no encuentra ninguna, el bloque
no sale.

### 4. El buscador de «Buscar su carpeta»

El cuadro de hoy pasa a ser ancho y lleva arriba una caja: **«Buscar entre todas las carpetas…»**.

- Sin escribir nada: las candidatas ordenadas de más a menos parecida, como hoy, pero ahora con las
  archivadas y con las que ya tienen asunto. La primera, con «Parece esta:» si encaja (apartado 2).
- Al escribir: busca por palabras sueltas, sin importar mayúsculas ni tildes, en el nombre de la
  carpeta; salen las que tienen todas las palabras. Es la misma forma de buscar del Archivo.
- Como mucho 30 resultados, y «y N más: escribe otra palabra».
- Cada resultado dice: el nombre; «En asuntos abiertos» o «En el ARCHIVO · <categoría> /
  <tercero>»; y «Ya tiene su asunto» si lo tiene. Los documentos que tiene dentro se cuentan solo
  de la que está elegida, no de las 30.
- Si el índice del ARCHIVO no está hecho, una línea lo dice: «El ARCHIVO no está leído entero: de
  lo archivado solo busco en la carpeta de esta persona.», con el botón que ya existe para leerlo
  («Reconstruir el índice»).
- Ya no sale nunca el aviso «No hay ninguna carpeta sin asunto»: el cuadro se abre siempre.
- El botón es «Enlazar». Si la elegida ya tiene asunto, antes de enlazar sale el aviso del
  apartado 5 y el botón dice «Unir y enlazar».

### 5. Qué hace «Enlazar», según el caso

Siempre por `AsuntoRenombrar` y la cola de guardado. Nada de escribir `asuntos.json`, `hitos.json`
ni `_ficha.json` a mano. Antes de cada uno se vuelve a leer lo guardado (`App.cargarRegistro`): si
el asunto ya no está, se salta y se dice.

a) **Carpeta de asuntos abiertos, sin asunto**: lo de hoy (`AsuntoRenombrar.mover`).

b) **Carpeta de asuntos abiertos, con asunto**: aviso antes, «Esta carpeta ya tiene su asunto. Se
   unen en uno: se queda con los hitos y las notas de los dos, sin repetir los que sean iguales.»
   Después, `AsuntoRenombrar.fusionar`, quedándose con el de la carpeta. Regla de la unión de la
   ficha: campo a campo manda el asunto de la carpeta; lo que él tenga vacío se rellena con lo del
   perdido; las listas (`notas`, `hilos`, `relacionados`, `pendientesRegistro`) se funden por
   elemento con `App.anotarLista`; los hitos, por título, como en la fila 292 (lo hecho en
   cualquiera de los dos cuenta como hecho).

c) **Carpeta del ARCHIVO**: el asunto termina archivado, en esa carpeta y con su nombre.
   - Si la carpeta tiene `_ficha.json`, se une con ella por la misma regla de b), con el mismo
     aviso antes. Si no lo tiene, la ficha del perdido baja tal cual.
   - La ficha queda con `estado: 'cerrado'`, la categoría y el tercero de la carpeta, y `cerradoEl`:
     el que ya tuviera la ficha de la carpeta; si no, el del perdido; si no, hoy.
   - Sus hitos bajan al historial de hitos de la carpeta (el de `js/hitos-archivo.js`), unidos con
     los que hubiera.
   - Su clave sale de `asuntos.json` y de `hitos.json`, con su lápida en `borrados-listas.json`
     para que no vuelva desde el otro ordenador (fila 176).
   - El índice del ARCHIVO se pone al día para esa carpeta (alta o cambio, sin reconstruirlo).
   - La carpeta **no se mueve ni cambia de nombre**. No se toca ningún documento.
   - Se usan los mismos caminos que archivar y que «Poner en orden las fichas del ARCHIVO»
     (`FichaArchivo`, `HitosArchivo`, `IndiceArchivo`); si falta una puerta de entrada, se añade
     ahí, no se copia su lógica.

**«Deshacer»** (del enlace suelto y del de la lista entera) devuelve todo a como estaba: la clave en
`asuntos.json`, sus hitos, y el `_ficha.json` y el historial de hitos de la carpeta tal como eran
(o su ausencia). Vale mientras el aviso está en pantalla.

En «solo consultar» (`SoloConsulta.activo()`, que incluye a los directivos) la búsqueda se ve, y
los botones de enlazar salen apagados. La búsqueda sola nunca escribe.

### 6. Textos de la tarjeta

- «Por qué» pasa a: «Alguien cambió el nombre de la carpeta o la movió a mano, o el asunto se
  archivó y la app no se enteró.»
- La explicación de «Buscar su carpeta» pasa a: «Buscas su carpeta entre todas, las abiertas y las
  archivadas. El asunto conserva sus hitos y sus notas.»
- «El asunto ya no existe» no cambia: es la salida cuando la carpeta no aparece en ningún sitio.
- Palabras nuevas a `docs/VOCABULARIO.md`: **Enlazar los N**, **Unir y enlazar**, «Su carpeta:».

### 7. Buscar la causa (en esta misma fila)

En el centro hay 21 asuntos apuntados con un nombre que no es el de su carpeta. En el caso mirado,
la carpeta está archivada y lleva el tipo escrito de otra forma. Hay que averiguar cómo se llega
ahí y cerrarlo. Dónde mirar primero:

- Todo lo que cambia la clave de un asunto al cambiar un tipo: `App.renombrarTipo`
  (`js/tipos-nombre.js`), la unión sola de tipos que son alias (fila 277, `js/tipos-parecidos.js`),
  «Unir con otro tipo» (fila 207) y el cambio de nombre corto. ¿Alguno renombra la clave de una
  ficha cuya carpeta ya no está en asuntos abiertos, o falla al renombrar la carpeta y deja la clave
  cambiada?
- Un asunto archivado en un ordenador que vuelve a `asuntos.json` desde el otro, o por la fusión de
  un conflicto de Dropbox (el 2-oct-2026 se mezclaron los cambios de casa y los del centro, nota de
  la fila 260 en `docs/COLA.md`). ¿Faltó la lápida?
- `FichasHuerfanas.calcular`: ¿da por perdido un asunto cuya carpeta está en el ARCHIVO con el
  mismo nombre, porque el índice está atrasado?

Si se encuentra: prueba que lo reproduce, y arreglo. Regla que debe quedar en todo caso: **ningún
código cambia la clave de una ficha sin comprobar antes que su carpeta existe con el nombre viejo**;
si no existe, no la toca.

Si en una hora de trabajo no se encuentra, no se sigue: se escribe en `docs/HISTORIA.md` qué se
miró y qué se descartó, y se dice en el mensaje final. Los apartados 1 a 6 se publican igual.

## Lo que no cambia

- Cómo se cuenta el problema para el número de la pestaña, de Inicio y del menú.
- «El asunto ya no existe».
- La tarjeta de los hitos de asuntos que ya no existen (fila 292).
- Ninguna carpeta se mueve, se renombra ni se borra en esta fila.

## Cómo hacerlo (orientación; decide la sesión)

- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`,
  `docs/contexto/ASUNTOS-ARCHIVO.md` y los ficheros de abajo.
- `js/fichas-huerfanas.js` tiene 183 líneas y hoy lo hace todo. Lo nuevo va en módulos aparte, que
  él llama; ningún fichero pasa de 600 líneas.
- Mientras programas, solo las pruebas de lo tocado (`npm test -- huerfanas parecido problemas
  carpetas-perdidas`). La pasada completa, una sola vez, al final.

## Ficheros

- `js/carpetas-perdidas-buscar.js`: nuevo. Las candidatas (abiertas y archivadas), la lectura de la
  carpeta de la persona en el ARCHIVO, cuál encaja con cuál, y la búsqueda por palabras. Sin
  pantalla y sin escribir nada.
- `js/carpetas-perdidas-enlazar.js`: nuevo. Enlazar uno o varios según los casos a), b) y c), y su
  «Deshacer».
- `js/parecido-de-carpetas.js`: el apartado 2 (tipo abreviado, nombre corto, alias, fecha).
- `js/fichas-huerfanas.js`: el cuadro con el buscador y el bloque de la lista; deja de usar
  `carpetasSinFicha()` como única fuente.
- `js/problemas-textos.js` y, solo si hace falta para pintar el bloque, `js/problemas.js`.
- `js/asunto-renombrar.js`, `js/ficha-archivo.js`, `js/hitos-archivo.js`, `js/archivo-indice.js`:
  solo una puerta de entrada nueva si falta; sin cambiar lo que hacen hoy.
- Lo que salga del apartado 7 (`js/tipos-nombre.js`, `js/tipos-parecidos.js` u otro).
- `index.html`: los dos módulos nuevos, después de `js/archivo-indice.js`, `js/ficha-archivo.js` y
  `js/parecido-de-carpetas.js`.
- `js/demo/datos.js`: que la demostración tenga, además de lo de la fila 292: (1) un asunto perdido
  cuya carpeta está en el ARCHIVO, en la carpeta de su persona, con el tipo abreviado y con su
  `_ficha.json` con una nota propia; (2) otro perdido cuya carpeta está en asuntos abiertos con
  otro nombre y sin asunto; (3) otro perdido cuya carpeta no está en ningún sitio; (4) una carpeta
  archivada de otra persona, para encontrarla escribiendo.
- `pruebas/carpetas-perdidas.mjs`: nueva (encaja y no encaja, dos que empatan, índice sin hacer,
  los casos a, b y c, deshacer, solo consultar). Se ponen al día `pruebas/huerfanas.mjs`,
  `pruebas/parecido-de-carpetas.mjs` y `pruebas/problemas.mjs`.
- `js/novedades.js`: «En Ajustes → Problemas, la app encuentra sola la carpeta de los asuntos que
  la habían perdido, también si está archivada, y los enlaza todos con un botón. «Buscar su
  carpeta» ya busca entre todas las carpetas.»
- Al terminar: `docs/CONTEXTO-CORTO.md`, `docs/contexto/ASUNTOS-ARCHIVO.md`, `docs/VOCABULARIO.md`
  y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en Ajustes → Problemas la app enseña la lista de asuntos con la carpeta que
les ha encontrado y el botón «Enlazar los N»; que «Buscar su carpeta» busca entre todas; y qué
causa encontró, o que no la encontró.

## Cómo sabemos que está bien

En la copia de demostración, en Ajustes → «Problemas», tarjeta de los asuntos que han perdido su
carpeta.

1. Sale el bloque «La app ha encontrado la carpeta de 2 de ellos», con dos filas, las dos con la
   casilla marcada. Una dice «En el ARCHIVO» y la otra «En asuntos abiertos».
2. La fila del ARCHIVO enseña una carpeta con el tipo escrito abreviado, de la misma persona y la
   misma fecha, y dice «Ya tiene su asunto: se unen en uno.»
3. El tercer asunto perdido, el que no tiene carpeta en ningún sitio, no está en el bloque: sigue
   debajo, en «Asunto por asunto», con «Buscar su carpeta» y «El asunto ya no existe».
4. El botón dice «Enlazar los 2». Al desmarcar una casilla dice «Enlazar 1», y con ninguna marcada
   está apagado.
5. Con las dos marcadas, pulsar el botón: aviso verde «2 asuntos enlazados con su carpeta.» con
   «Deshacer». La tarjeta pasa a decir «1 asunto ha perdido su carpeta».
6. En «Archivo», buscar a la persona del asunto archivado: su asunto está, con el nombre de la
   carpeta, y al abrirlo tiene las notas de los dos (la suya y la del asunto perdido).
7. En «Inicio», el otro asunto enlazado está entre los abiertos, con el nombre de su carpeta y con
   sus hitos.
8. Volver a «Problemas» y repetir desde el principio («Volver a empezar» en la demostración).
   Enlazar los 2 y pulsar «Deshacer»: la tarjeta vuelve a decir 3 y el bloque vuelve a salir con
   sus dos filas.
9. En el tercer asunto, pulsar «Buscar su carpeta»: se abre un cuadro con la caja «Buscar entre
   todas las carpetas…». No sale ningún aviso de que no hay carpetas.
10. Escribir en la caja una palabra del nombre de la carpeta archivada de la otra persona: sale esa
    carpeta, con «En el ARCHIVO» y su categoría y su persona.
11. Escribir dos palabras que no están juntas en ningún nombre: no sale ninguna carpeta, y el cuadro
    lo dice.
12. Elegir una carpeta de asuntos abiertos que ya tiene asunto: antes de enlazar sale el aviso de
    que se unen en uno, y el botón dice «Unir y enlazar». Pulsar «Cancelar»: no cambia nada.
13. Entrar con la casilla «En este ordenador, solo consultar»: el bloque se ve, y «Enlazar los N»
    está apagado.
14. **[SOLO FRANCISCO]** En el centro, en Ajustes → Problemas: comprobar que el traslado del recorte
    de la idea 303 sale en la lista con su carpeta del ARCHIVO, repasar la lista, y pulsar «Enlazar
    los N». Decir cuántos de los 21 quedan sin encontrar.
