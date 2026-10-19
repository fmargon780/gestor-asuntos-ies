# Lista con casillas: todos los nombres, sin tope (idea 373)

Aviso del botón de soporte (19-oct-2026, Herramientas, copia sin internet, perfil Administración):
«La lista de etiquetas no me deja ver todos los nombres disponibles. Mira en la imagen donde dice
… y 80 más …». Aviso completo: https://drive.google.com/file/d/1UVUGD3oQdxLRITF9kxpJZFzVDEUBk6xD/view?usp=drivesdk
(captura en la misma carpeta de Drive: `2026-10-19 135140 error.jpg`). Diseñado con Francisco el 19-oct-2026.

## Qué pasa hoy

`js/lista-con-casillas.js` (fila 350) pinta como mucho 200 personas (`TOPE`, o `op.tope`) y debajo
la línea «…y N más (cuentan igual).». Las que pasan del tope no se ven y no se pueden desmarcar. La
lista la usan Etiquetas (`js/etiquetas-pantalla.js`, id `et`) y el filtro del alumnado
(`js/repartir-filtro.js`, id `rf`: repartos, «Añadir varios relacionados», exportar).

## Qué hay que hacer

1. `ListaConCasillas.html` pinta **todos** los items, sin tope. Desaparece la línea «…y N más
   (cuentan igual).», la constante `TOPE` y la opción `op.tope` (quitarla también del comentario de
   cabecera del fichero; `op.abierta`, que tampoco usa nadie, se quita del comentario igual). Ningún llamador pasa hoy `op.tope`; comprobarlo con `grep` y, si alguno lo
   pasa, quitarlo.
2. La lista sigue bajando **dentro de su propio recuadro**, pero el recuadro se hace **más alto**
   (decisión de Francisco): ocupa el alto libre de la ventana, unos 30 nombres a la vista en el
   monitor del centro. Hoy `.cc-lista` (`css/etiquetas.css`) tiene `max-height: 220px; overflow:
   auto`; pasa a un alto que dependa de la ventana (por ejemplo `max-height: max(220px, 60vh)`, a
   ajustar mirándolo en pantalla), nunca menos de 220 px. Con pocas personas, el recuadro mide lo
   que su contenido (sin hueco vacío). En Etiquetas la lista vive en el panel de la izquierda, que
   tiene su propio desplazamiento: comprobar a 1920 y a 1366 px que no queda una barra de
   desplazamiento dentro de otra con la pantalla recién abierta; si queda, ajustar el alto para que
   la lista quepa en el panel. `css/etiquetas.css` se carga para toda la app desde `index.html`, así
   que vale también para el filtro del alumnado; no se mueve.
3. `enganchar` ya engancha todas las casillas que encuentra y conserva la posición de la lista y el
   foco al repintar: comprobar que sigue así con más de 200 personas (desmarcar la última no debe
   devolver la lista arriba).
4. Rendimiento: con ~300 personas (y hasta ~1.000, todo el alumnado) marcar o desmarcar una casilla
   no debe notarse lento. Se mide el repintado completo que hace `alCambiar` (en Etiquetas,
   `pintarVista()` con sus hojas; en repartos, la pantalla del filtro). Si pasa de unos 300 ms con
   1.000 personas en la copia de pruebas, se puede dejar de rehacer la **lista** al marcar una
   casilla (cambiar solo su número «N de M marcadas»), pero las hojas de etiquetas y los recuentos
   de la pantalla tienen que seguir poniéndose al día. Si lo lento son las hojas, no se toca aquí:
   se apunta como IDEA y se dice en la nota de la fila.
5. Pruebas: hoy ninguna prueba mira el tope de 200 ni «cuentan igual» (las que contienen la palabra
   «tope» son de otras cosas y no se tocan). Añadir en `pruebas/etiquetas-350.mjs` una comprobación
   con más de 200 personas: salen todas, no sale «más (cuentan igual)», y desmarcar la última baja la
   cuenta en uno; y otra igual en `pruebas/repartir-con-filtro.mjs` para el filtro del alumnado.
6. Novedades (`js/novedades.js`): «Las listas de personas con casilla (Etiquetas, repartos,
   exportar) enseñan ya todos los nombres, sin cortar en 200.»

## Ejemplo con datos reales

Francisco lo vio en Herramientas → Etiquetas eligiendo **los grupos de 1º ESO**: salían 280 personas
(200 a la vista + «…y 80 más»). Con los datos de la copia de pruebas, hacer el mismo recorrido con
los grupos de 1º ESO; si la demo no llega a 200 personas en esos grupos, usar una selección que pase
de 200 (por ejemplo, todo el alumnado) y decirlo en la nota.

## Cómo sabré que está bien

1. En Herramientas → Etiquetas, con los grupos de 1º ESO, la lista enseña todos los nombres. Ya no
   sale «… y 80 más».
2. Bajando dentro de la lista se llega al último nombre. Se puede desmarcar, y «N de M marcadas» baja
   en uno.
3. «Marcar todas» y «Desmarcar todas» siguen funcionando con todos.
4. En el filtro del alumnado (repartos y exportar), una lista de más de 200 personas también sale
   entera.
5. El recuadro de la lista es alto (unos 30 nombres a la vista) y la lista baja dentro de él: la
   página no se alarga.

Cabe en una sola sesión de Claude Code.
