# Al volver de una ficha, la lista queda a la misma altura (fila 256)

Fila 256 de `docs/COLA.md`. Salió de revisar las pruebas que fallaban en las pasadas completas
(2-oct-2026): `pruebas/tras-cada-accion.mjs`, punto 3, falla de forma estable.

## Qué pasa hoy

En Inicio → «Todos los abiertos», con la lista muy larga, se baja (por ejemplo a 1200 px), se abre la
ficha de un asunto y se pulsa «← Volver»: la lista vuelve **unos 36 px más abajo** (1236 en vez de
1200; un poco antes, durante unos instantes, 1197). Pasa también antes de la fila 243, así que no es de
ninguna fila reciente. No es de tiempos ni de la altura de pantalla: esperando un segundo entero el valor
es siempre el mismo.

Dónde mirar: `js/navegacion.js` (`volver` y `ponerAltura` guardan y devuelven `scrollY`) y
`js/cabecera-fija.js` (la cabecera se encoge al bajar de unos 120 px y `aplicarCompensacion` cambia el
alto de la página; una pantalla que se vuelve a mostrar «empieza desplegada» y luego se encoge, y esa
diferencia de alto es la candidata a esos 36 px).

## Qué quiere Francisco

Que al volver de una ficha la lista esté exactamente donde estaba, para seguir mirando la misma fila
sin buscarla. Hoy es un salto pequeño pero se nota.

## Qué hay que hacer

1. Reproducirlo (la prueba `pruebas/tras-cada-accion.mjs`, punto 3, lo hace) y encontrar por qué el
   `scrollY` final difiere del guardado: probablemente la cabecera pasa de desplegada a encogida (o la
   compensación de alto cambia) **después** de `ponerAltura`, y el navegador reajusta el scroll.
2. Arreglarlo en la aplicación, no en la prueba: al volver, la altura final tiene que ser la guardada
   (con un margen de pocos píxeles). La solución más probable: guardar también si la cabecera estaba
   encogida y devolverla a ese estado **antes** de poner la altura (o volver a poner la altura cuando
   la cabecera termina de cambiar). Sin tocar lo que ya funciona de la fila 50 (el candado de la
   cabecera) ni de la fila 119 (repintar la lista no la sube).
3. Dejar la prueba tal cual (no se relaja el margen de 12 px) y comprobar que pasa 5 veces seguidas en
   solitario.
4. Quitar de `docs/COLA.md` la nota «Lo que queda por hablar» sobre `tras-cada-accion.mjs`.

## Cómo sabemos que está bien

1. En Inicio → «Todos los abiertos» con muchos asuntos (los de demostración bastan; si no hay
   suficientes, crear varios): bajar unos 1200 px, abrir un asunto, pulsar «← Volver»: la lista está en
   la misma posición (la misma fila a la misma altura, como mucho unos pocos píxeles de diferencia).
2. Lo mismo desde la pestaña «En Administración» y desde Personas y empresas (la lista de la izquierda
   y la ficha), y volviendo con la tecla Escape.
3. Repintar la lista (cambiar de pestaña de Inicio y volver) no la sube arriba.
4. La cabecera sigue encogiéndose al bajar y desplegándose al subir, sin parpadeos ni saltos.
5. `pruebas/tras-cada-accion.mjs` pasa 5 veces seguidas en solitario, y la pasada completa no la rompe.
