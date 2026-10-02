# El tipo de asunto en una línea, con buscador vacío, y «Cambiar el asunto» compacto (fila 257)

Aviso de usuario del 2-oct-2026 (lo envía Francisco), diseñado con él ese mismo día.
Aviso completo: https://drive.google.com/file/d/1AuJUMwypI6RyDEnfsAWZrSdUynNPtGg9/view?usp=drivesdk

## El problema

En «Cambiar el asunto» (`js/asuntos-editar.js`, `abrirCuadroDeEdicion`), el tipo de asunto es un
desplegable (`<select id="ed-tipo">`) con todos los tipos de todas las categorías, uno debajo de
otro. Sale con el tipo actual y, al abrirlo, una lista larguísima: no se puede escribir para
buscar. Además el cuadro tiene los campos apilados y obliga a bajar.

## Lo que decidió Francisco

1. **El tipo, en una sola línea**, igual que el tercero del mismo cuadro: el nombre del tipo y,
   a su lado, «Cambiar». Ejemplo: `SEGURO ESCOLAR · Cambiar`. Desaparece el desplegable.
2. **Al pulsar «Cambiar»** sale una caja de búsqueda **vacía**, con el cursor dentro, y **nada
   debajo**. Texto de ayuda dentro de la caja: «Escribe para buscar un tipo».
3. **Al escribir** salen debajo **como mucho 8 tipos** que se parecen, **de todas las
   categorías**, cada uno con su categoría en pequeño. Da igual tildes, mayúsculas y el orden de
   las palabras: usar `BuscarOCrear.coincidencias` (`js/buscar-o-crear.js`) o `U.parecidos`, sin
   inventar otra comparación; que encuentre también por nombre corto y por los `alias` del tipo.
   Primero los más usados (la cuenta de `usos()` de `js/tipos-buscador.js`; si hace falta, se
   saca a un sitio común, sin envolver). Si hay más de 8: una línea gris «y N más: sigue
   escribiendo».
4. **Elegir uno** (con el ratón, o con flechas e Intro) cierra la búsqueda y vuelve a la línea
   del punto 1 con el tipo nuevo. Todo lo que hoy pasa al cambiar el desplegable sigue pasando
   igual: los campos del tipo, el aviso ámbar de categoría (`#ed-aviso-categoria`) y «Se llamará».
5. **Una ✕ al lado de la caja** (y la tecla Esc, sin cerrar el cuadro entero) deja el tipo que
   había y vuelve a la línea.
6. **Si nada se parece** (decisión de Claude, aceptada): al final de la lista sale «Ninguno es el
   que busco: crear «<lo escrito, en mayúsculas y limpio>»», nunca con la caja vacía, como en
   Ajustes (fila 250). Crea el tipo con la misma función de siempre (`App.crearTipo`), con la
   pregunta de parecidos de `BuscarOCrear.confirmarParecidos` si los hay, y con la categoría
   propuesta —la del tipo que tenía el asunto—, cambiable. **Ojo con `U.preguntar`**: solo deja
   un cuadro a la vez. Hacerlo como el alta de tercero de este mismo cuadro
   (`js/asuntos-editar-tercero.js` y `pedirAlta` en `js/asuntos-editar.js`): el cuadro se cierra
   solo, se crea el tipo y se vuelve a abrir con todo lo escrito y el tipo nuevo ya elegido.
7. **Un tipo que ya no está en la lista** (asunto antiguo): la línea lo enseña igual, con
   «(no está en la lista)», y no cambia mientras no se elija otro.
8. **Dónde se aplica**: en «Cambiar el asunto», y en «Nuevo asunto» **solo cuando llega con el
   tipo ya reconocido** (`App.nuevoAsuntoCon` con `opciones.tipo`: por ejemplo «Crear asunto con
   él» desde «Ver todo»). En ese caso, en vez del buscador y la parrilla sale la línea
   `Tipo de asunto: <TIPO> · Cambiar`; «Cambiar» enseña la caja `#buscar-tipo` vacía y la
   parrilla escondida hasta que se escribe (máximo 8, con las mismas reglas de categoría que la
   parrilla tiene hoy); elegir uno vuelve a la línea; la ✕ deja el que había. El «+ Crear tipo
   nuevo» de `js/tipo-al-vuelo.js` sigue como está.
   **«Nuevo asunto» en blanco no cambia**: conserva su buscador, sus 8 más usados y «Ver todos».
   Tampoco cambia cuando el tipo se elige a mano en la parrilla.
9. **El cuadro «Cambiar el asunto», compacto**, en este orden:
   - una fila de tres columnas: Fecha de inicio · Grupo · Año académico;
   - Descripción corta, a todo el ancho;
   - Tipo de asunto (la línea del punto 1) y, debajo, su aviso ámbar si toca;
   - los campos del tipo, en dos columnas si son más de uno;
   - Tercero (su línea con «Cambiar», como hoy) y el departamento si lo hay;
   - «Se llamará» / «Ahora se llama».
   El cuadro puede ser más ancho que ahora (Francisco trabaja con monitor ancho y quiere que se
   aproveche): título, campos y vista previa terminan en el mismo borde derecho. Con un tipo de
   hasta cuatro campos propios, a 1280 × 720 **cabe entero sin barra de desplazamiento**, con
   «Guardar» a la vista. En pantalla estrecha, las columnas se apilan.

**No se toca**: cómo se guarda el cambio (`guardarEdicion`, `AsuntoRenombrar`, la guía nueva,
«Por liquidar»), el buscador de tercero, Ajustes, ni «Nuevo asunto» en blanco.

## Dónde mirar (cambios quirúrgicos; no leer el repositorio entero)

- `js/asuntos-editar.js` (500 líneas; el tope es 600): `abrirCuadroDeEdicion`, líneas ~211-272
  (el HTML del cuadro y las `opciones` del desplegable), `refrescarAvisoCategoria`, `refrescar`,
  `snapshotDelCuadro`, `pedirAlta`. Para tocar lo mínimo, `#ed-tipo` puede quedarse como campo
  oculto con el valor del tipo, y que el resto del fichero siga leyendo `$('ed-tipo').value`.
- **Fichero nuevo `js/tipo-en-linea.js`** con la línea, la caja y la lista de resultados (el
  mismo estilo que `js/asuntos-editar-tercero.js`: estado propio, local a la llamada, sin tocar
  `App.E.nuevo`). Enganchado sin envolver; darlo de alta en `index.html` y en
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`.
- `js/buscar-o-crear.js` (`coincidencias`, `confirmarParecidos`), `js/util-parecidos.js`.
- `js/tipos-buscador.js` (`usos`, `aplicar`) y `js/asuntos-nuevo.js` (`App.nuevoAsuntoCon`,
  `App.elegirTipo`, `App.prepararNuevo`) para el punto 8. `App.prepararNuevo` deja siempre el
  formulario desde cero: la línea del punto 8 no puede quedarse de una vez para otra.
- CSS: las clases del cuadro (`cuadro-alto`, `dos-columnas`) donde ya estén; si hace falta una
  de tres columnas o un cuadro ancho, mirar antes si ya existe una.
- Pruebas que usan hoy `#ed-tipo` como desplegable: `pruebas/cambiar-tipo-y-guia.mjs` y
  `pruebas/tercero-con-buscador-al-cambiar.mjs`. Se adaptan al camino nuevo (pulsar «Cambiar»,
  escribir, elegir) sin relajar lo que comprueban.
- Textos con las palabras de `docs/VOCABULARIO.md`.

## Cómo sabemos que está bien

1. En la copia de pruebas (`?demo=1&auto=1`), abrir un asunto → «Cambiar el asunto»: no hay
   desplegable de tipos; el tipo se ve en una línea con «Cambiar», como el tercero.
2. Pulsar «Cambiar» del tipo: caja vacía con el cursor dentro y ninguna lista debajo.
3. Escribir tres letras: salen como mucho 8 tipos, de varias categorías, cada uno con su
   categoría. Escribir un nombre con otras tildes, en minúsculas o con las palabras en otro
   orden: sale el tipo. Con más de 8 coincidencias: «y N más: sigue escribiendo».
4. Elegir uno: vuelve la línea con el tipo nuevo; cambian los campos del tipo y «Se llamará»; si
   la categoría no encaja con el tercero, sale el aviso ámbar. «Guardar» cambia el tipo de
   verdad (la carpeta y la ficha), como antes.
5. Pulsar «Cambiar», escribir algo y pulsar la ✕ (y otra vez con Esc): queda el tipo que había y
   el cuadro sigue abierto, con lo demás escrito intacto.
6. Escribir un nombre que no se parece a ninguno: «Ninguno es el que busco: crear «…»»; al
   crearlo, el cuadro vuelve con el tipo nuevo elegido y sin perder la fecha, el grupo, la
   descripción ni el tercero que se hubieran cambiado.
7. A 1280 × 720, con un tipo de hasta cuatro campos: el cuadro entero cabe sin barra de
   desplazamiento; Fecha de inicio, Grupo y Año académico están en la misma fila; nada se sale
   por la derecha.
8. «Nuevo asunto» desde un documento de «Ver todo» con el tipo reconocido: sale
   `Tipo de asunto: <TIPO> · Cambiar` y no la parrilla; «Cambiar» → caja vacía sin parrilla;
   escribir → hasta 8; elegir → vuelve la línea. Salir y entrar en «Nuevo asunto» en blanco:
   buscador, 8 más usados y «Ver todos», como siempre.
9. Prueba nueva `pruebas/tipo-en-linea-al-cambiar.mjs` con los puntos 1 a 8, en verde; las dos
   pruebas adaptadas, en verde. Mientras se trabaja, solo las pruebas de lo tocado; la pasada
   completa, una sola vez al final.

## Al terminar

- Línea en `js/novedades.js` (regla 21): «Cambiar el asunto: el tipo se busca escribiendo, en
  una línea como el tercero, y el cuadro cabe entero en pantalla».
- Poner al día, sustituyendo lo que ya no sea verdad, la línea de «Cambiar un asunto abierto» de
  la sección 5 de `docs/CONTEXTO-CORTO.md` y `docs/contexto/ASUNTOS.md`.
- Reglas de la cola de siempre: rama `fila-257`, revisor en local, una sola publicación de
  código, sin preguntar nada a Francisco.
