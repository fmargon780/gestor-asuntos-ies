# Inicio, tercera versión: los asuntos a todo el ancho (fila 212)

Acordado con Francisco el 28-sep-2026. Diseño cerrado. **Manda sobre `docs/INICIO-EN-PESTANAS.md`**
(fila 209) en todo lo que diga distinto; lo que aquí no se nombra (pestañas, tabla, columnas,
orden, filtrado por aviso) se queda como lo dejó la fila 209. Valen las cláusulas comunes de
`docs/REPARTO-DE-LA-COLA-2026-09-27.md` (a `main` sin pull request, como mucho tres subidas, nada
se sube con `npm test` en rojo).

## Por qué

Francisco vio la fila 209 con datos reales. Desde su Chromebook se ve estrecho: la columna de la
izquierda («Ha llegado» y el tablón) le quita sitio a la tabla, la fecha de «Inicio» se parte en
tres renglones, el tablón queda muy abajo, la franja ámbar de avisos ocupa todo el ancho para una
sola frase, y el panel de filtros abierto empuja la tabla media pantalla hacia abajo.

## Cómo tiene que quedar

1. **Fuera la columna de la izquierda** (`#inicio-lado`). La zona de pestañas y tabla ocupa todo el
   ancho de la zona de trabajo. Fuera también el botón grande «Ver todo (N)» (`.paneles`), porque lo
   sustituye la fila del punto 2.

2. **Una sola fila, justo debajo de la cabecera**, en lugar de la franja de avisos y del botón
   «Ver todo»:
   - **A la izquierda, lo que ha llegado**: «Ha llegado: **2 correos** · **2 documentos por
     clasificar**». Cada trozo es un enlace.
     - «N correos» abre la pantalla «Ver todo» (`#zona-clasificar`) enseñando **solo la bandeja de
       Gmail**.
     - «N documentos por clasificar» abre la misma pantalla enseñando **solo los documentos
       sueltos**.
     - Arriba de esa pantalla, un enlace para ver también lo otro («Ver también los correos» /
       «Ver también los documentos»). «← Volver» sigue llevando a Inicio.
     - Singular/plural correcto. Un trozo con 0 no sale. Si no hay nada: «No ha llegado nada»,
       en gris.
     - Si hay algo nuevo desde la última vez (la marca que hoy lleva `#nuevos-sueltos`), el número
       va resaltado.
     - Esta parte **no** se calla con «Ocultar por hoy»: solo baja cuando se clasifica lo que ha
       llegado.
   - **A la derecha, un cuadro ámbar pequeño con los avisos** (lo que hoy es `#avisos-linea`): el
     cuadro mide lo que mida su texto, no todo el ancho. Varios avisos van seguidos dentro del mismo
     cuadro, separados por « · »; cada uno se sigue pudiendo pulsar y hace lo mismo que hoy
     (filtrar la tabla o abrir lo suyo). «Ocultar por hoy» pasa a ser una **✕** pequeña dentro del
     cuadro, con el título «Ocultar por hoy». Sin avisos, el cuadro no sale. Si no caben en una
     línea, el cuadro puede ocupar dos, pero nunca empuja a «Ha llegado» fuera de su sitio.
   - El buscador de la cabecera deja de filtrar «Ha llegado» (ya no hay lista a la vista); sigue
     filtrando la tabla.

3. **El tablón, arriba a la derecha, en la cabecera de Inicio**, en el hueco libre entre
   «+ Nuevo asunto» y el buscador. Compacto:
   - Un campo de una línea «Escribir una nota…» para añadir una nota (al pulsarlo puede crecer
     para escribir, con la fecha opcional y el resto de opciones de hoy).
   - Debajo, las notas más recientes, **una por renglón**, cortadas con «…»: como mucho tres a la
     vista. Si hay más, «y N más» despliega la lista entera por encima de la página (sin empujar
     nada hacia abajo). Los botones de cada nota (Hecha, Cambiar, A asunto, Borrar) salen al
     pulsar la nota o en su «⋮», no a la vista siempre.
   - Altura máxima del tablón plegado: la de la cabecera con dos o tres renglones. Nunca una
     columna larga.
   - **No se esconde nunca** (sigue en «Descartado»). Solo en pantallas muy estrechas (por debajo
     de unos 900 px de zona de trabajo) puede bajar a su propia línea, debajo de la cabecera.
   - Se mantiene todo lo de `docs/TABLON-NO-SE-BORRA.md`: lo escrito no se pierde al repintar
     (`U.conservandoLoEscrito`, `borrador`, foco y cursor).
   - Solo en Inicio. Las otras pantallas no cambian.

4. **Filtros plegados por defecto.** El panel de «Filtros» (Responsable, Situación, Plazo, Lo
   encarga, Tipo de asunto) empieza cerrado cada vez que se entra en Inicio. Si hay algún filtro
   puesto, el botón lo dice: «Filtros (2)», para que no pase desapercibido.

5. Con el ancho ganado, la columna «Inicio» de la tabla tiene que caber en una línea
   («04-sep-2026») a partir de 1280 px de ancho de ventana. Si hace falta, se estrecha «Tipo».

## Ficheros que se tocan

- `index.html` (`#pantalla-abiertos`: fuera `#inicio-lado` y `.paneles`; la fila nueva con
  «Ha llegado» y los avisos; el hueco del tablón en la cabecera de Inicio)
- `js/inicio.js` (sin columna izquierda; la línea «Ha llegado» con sus dos cuentas)
- `js/avisos-linea.js` (el cuadro pequeño y la ✕)
- `js/documentos-sueltos.js` y `js/bandeja-pantalla.js` (abrir «Ver todo» solo con correos o solo
  con documentos; el enlace «Ver también…»)
- `js/tablon.js` (el tablón compacto en la cabecera). Está en 541 líneas: si pasa de 600, partirlo
  por temas (por ejemplo, `js/tablon-compacto.js`)
- `js/inicio-tabla.js` (filtros plegados al entrar; «Filtros (N)»)
- `css/inicio.css`, `css/tablon.css`
- `docs/VOCABULARIO.md`, solo si entra una palabra nueva en pantalla
- Las pruebas de `pruebas/` que busquen `#inicio-lado`, el botón «Ver todo (N)», la lista de
  «Ha llegado» en Inicio o el tablón en la columna izquierda

No leas el repositorio entero. Cambios quirúrgicos: no reescribas ficheros enteros. Nada de
envolturas nuevas (engánchate por `window.Gestor.alRefrescar` o un punto previsto). Se conservan
los selectores que usan las pruebas cuando sea posible (por ejemplo `data-vista="clasificar"` en el
enlace que abre «Ver todo»).

## Reglas que no hay que romper

- El tablón no se esconde nunca y no pierde lo escrito.
- Se repinta solo lo que cambia; repintados asíncronos con contador de turno.
- Los reservados siguen tapados.
- La lista vuelve a la misma altura al volver de una ficha o de «Ver todo».

## Prueba

Una sola prueba nueva en `pruebas/` (navegador), con 2 correos y 2 documentos sueltos de ejemplo y
un aviso: no existe `#inicio-lado`; la línea dice «Ha llegado: 2 correos · 2 documentos por
clasificar»; pulsar «2 correos» abre «Ver todo» sin la lista de documentos, y pulsar «2
documentos…» la abre sin la bandeja; el cuadro de avisos no ocupa todo el ancho y su ✕ lo oculta
por hoy, sin tocar la parte de «Ha llegado»; el tablón está dentro de la cabecera de Inicio, se
puede escribir una nota y no se pierde al repintar; el panel de Filtros está cerrado al entrar y,
con un filtro puesto, el botón dice «Filtros (1)». Y `npm test` entero en verde, una sola vez al
final.

## Al terminar

Reglas de siempre de `docs/COLA.md`. En `docs/CONTEXTO-CORTO.md`, sustituir la línea de «Inicio»,
la de la franja de avisos y la de «Ver todo». Poner al día `docs/contexto/PANTALLA.md` (secciones
del tablón: ya no es una columna). Entrada en `docs/HISTORIA.md`. Publicar y comprobar con `curl`.
