# Ordenar la lista de Inicio pulsando el título de una columna (fila 367)

Segunda mejora del aviso de la idea 353 (botón de soporte, 16-oct-2026), diseñada con Francisco el
16 y el 18-oct-2026. Aviso completo:
https://drive.google.com/file/d/1R_zF67tcKTP54vciIB3ku6UHAxgbWGOu/view?usp=drivesdk
Lo que pidió: «Poder ordenar la lista pulsando en la cabecera de la columna por la que queramos
ordenar la lista.» La primera mejora (Inicio más compacto) es la fila 353,
`docs/INICIO-MAS-COMPACTO.md`; esta fila no depende de ella.

## Qué hay hoy

- Tabla de Inicio: `#inicio-thead-normal` con las columnas Plazo, Tercero, Tipo, Hito actual,
  Le toca a, Inicio y una última sin título (acciones). La pestaña «Por liquidar» usa otra cabecera
  (`#inicio-thead-liquidar`, `js/por-liquidar.js`).
- Orden: un desplegable «Ordenar» (`#orden-abiertos`, `index.html`) que solo manda en «Todos los
  abiertos» (`App.ORDENES` en `js/asuntos-lista.js`, `App.pintarAbiertos` en
  `js/asuntos-lista-pintar.js`, comentario en `js/inicio-tabla.js`). Las demás pestañas tienen su
  orden natural (vencidos primero en «En Administración»; más días esperando o dormido arriba en
  «En espera» y «Dormidos»). El título «Inicio» ya es hoy pulsable (`#th-inicio`).

## Lo que cambia

1. **Cada título de columna con datos se puede pulsar** (todas menos la última, la de acciones).
   Primera pulsación: orden ascendente (A→Z, fecha más antigua primero, plazo que antes vence
   primero). Segunda pulsación sobre la misma columna: al revés. Pulsar otra columna: ascendente
   por esa.
2. **Una flecha** (▲ o ▼) junto al título que manda. Los títulos pulsables se notan al pasar el
   ratón (cursor de mano y subrayado suave), sin cambiar su aspecto en reposo.
3. **Qué se compara en cada columna**: siempre lo que se ve en esa pestaña. Plazo: en «Todos los
   abiertos», la fecha límite; en «En Administración», la fecha del hito actual; en «En espera» y
   «Dormidos», los días parado, con más días arriba en la primera pulsación. En «Dormidos» mandan
   siempre los días sin novedades, también en los asuntos que en esa columna enseñan su fecha
   límite (decisión de Francisco, 18-oct-2026). Lo que no tenga dato,
   al final en los dos sentidos. Tercero, Tipo, Hito actual y Le toca a, por el texto que se ve,
   sin distinguir mayúsculas ni tildes (`localeCompare` con `es` y `sensitivity: 'base'`).
   Inicio, por la fecha de inicio. Empate: por fecha de inicio, la más antigua primero, en los dos sentidos (el desempate no se da la vuelta). Un asunto
   reservado (candado) se ordena por lo que se ve en su fila, no por el tercero oculto.
4. **Vale en todas las pestañas**, también «Por liquidar»: Tercero y Tipo como en las demás,
   «Por liquidar desde» como fecha, Importe como número; la columna de casillas no ordena. Su orden
   natural sigue siendo por «desde». Ojo: `js/por-liquidar.js` rehace la cabecera entera en cada
   pintado (`cabecera()`) y fija su orden dentro de `PorLiquidar.lista()`: pinta la flecha y
   engancha las pulsaciones después de cada `pintarTabla`, y ordena la lista ya filtrada antes de
   pintarla.
5. **Vuelve el orden de siempre** (el natural de hoy de cada pestaña, sin flecha) solo al cambiar
   de pestaña —también cuando la cambia sola un aviso que filtra la lista (`js/inicio-tabla.js`)— y
   al pulsar «Inicio» en el menú de la izquierda. **Se conserva** al volver de la ficha («← Volver»,
   fila 165, con la misma altura de página), en los repintados, al buscar, al filtrar y con
   «Actualizar». No se guarda en `localStorage` ni en `_GESTOR`: se deja de leer y escribir la clave
   `orden-abiertos` que hoy recuerda el orden de «Todos los abiertos» por ordenador. Como volver de
   la ficha y pulsar «Inicio» en el menú pasan por la misma `App.ir('abiertos')` (`js/nucleo.js`),
   no se toca `App.ir`: el orden se pone a cero en el clic del botón «Inicio» del menú y al cambiar
   de pestaña.
6. **Desaparece el desplegable «Ordenar»** (`#orden-abiertos` y su `label.inicio-orden`). Lo que lo
   use (`App.ORDENES` y la lectura del orden en `js/asuntos-lista-montones.js` y
   `js/asuntos-lista-pintar.js`) pasa a leer el orden de la columna. Lo que hoy hace pulsable
   `#th-inicio` se sustituye por lo nuevo. Se reescriben `pruebas/inicio.mjs` y
   `pruebas/navegador.mjs` donde usen el desplegable o `orden-abiertos`. «Exportar ▾» no se toca:
   ya saca las filas en el orden que se ven (`js/exportar-datos.js`).
7. Los títulos de la tabla siguen fijos al bajar (fila 243, `js/cabecera-fija.js`). El filtro, el
   buscador y el filtro por aviso siguen funcionando con cualquier orden.

## Ejemplo con datos reales

Francisco no tiene hoy ningún tercero con varios asuntos abiertos, así que el ejemplo es la
columna «Inicio»: en la pestaña «Todos los abiertos», al pulsar «Inicio», arriba sale el asunto
abierto más antiguo del centro; al pulsar otra vez, arriba sale el último que se creó. En la demo
(`?demo=1&auto=1`) el revisor lo comprueba con los asuntos inventados, y además con «Tercero»
(los de un mismo tercero, juntos).

## Cómo sabré que está bien

(Acordado con Francisco.)

1. Al pulsar el título «Tercero», la lista se ordena de la A a la Z, con una flecha. Al pulsarlo
   otra vez, de la Z a la A.
2. Al pulsar «Inicio» en «Todos los abiertos», arriba sale el asunto más antiguo; otra vez, el más
   reciente.
3. Al cambiar de pestaña, la nueva sale con su orden de siempre, sin flecha.
4. Ya no está el desplegable «Ordenar».

## Al terminar

- Línea en `js/novedades.js`: «En Inicio, pulsa el título de una columna para ordenar la lista
  por ella; otra vez, al revés.»
- Pon al día `docs/CONTEXTO-CORTO.md` y `docs/contexto/PANTALLA.md`, sustituyendo lo viejo.
- Prueba nueva `pruebas/inicio-ordenar.mjs`: las dos pulsaciones por columna, la flecha, el orden
  natural al cambiar de pestaña, «Por liquidar» y que «Exportar» saca el orden que se ve.
