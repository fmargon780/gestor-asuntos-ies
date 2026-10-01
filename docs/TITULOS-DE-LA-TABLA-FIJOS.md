# Títulos de la tabla fijos al bajar (fila 243)

Diseño cerrado con Francisco el 1-oct-2026, a partir del aviso de usuario de la fila 243
(botón de soporte, pantalla Inicio, 30-sep-2026 22:50, versión 30-sep-2026 · 22:34):

> «La cabecera (primera fila de la tabla) de la vista principal al hacer scroll down desaparece.»

## 1. Qué quiere Francisco

En **Inicio**, al bajar por la tabla de asuntos, se quedan fijas arriba, una debajo de otra:

1. La cabecera de la pantalla, como ya hace hoy (`js/cabecera-fija.js`, se encoge a una línea).
2. **Las cuatro pestañas** («En Administración», «En espera», «Todos los abiertos», «Dormidos»,
   con sus números), justo debajo de la cabecera encogida.
3. **La fila de títulos de las columnas** (Plazo, Tercero, Tipo, Hito actual, Le toca a,
   Inicio…), justo debajo de las pestañas.

Lo demás (la fila «Ha llegado» con el cuadro de avisos, los filtros plegados, «Filtrado por…»)
se va con la página, como ahora. Decisión de Francisco: opción «títulos + pestañas», no la de
dejar también fija «Ha llegado».

## 2. Lo mismo en el Archivo

Si la lista del **Archivo** (`#lista-archivo`) tiene una fila de títulos de columnas, se queda fija
igual, debajo de la cabecera encogida (y debajo de sus pestañas o selector de curso, si los
tiene). Si no tiene fila de títulos, no se toca. Ninguna otra pantalla entra en esta fila.

## 3. Pistas técnicas (para Claude Code)

- El envoltorio `.inicio-tabla-envoltorio` (`css/inicio.css`) lleva `overflow-x: auto`: eso anula
  `position: sticky` en el `thead`. Hay que resolverlo sin perder el desplazamiento lateral en
  pantallas estrechas (por ejemplo, `overflow-x: clip` / `visible` en anchos grandes, o los títulos
  fijos con otro mecanismo). Buscar la forma más sencilla que funcione en Chrome (Chromebook).
- La altura de la cabecera encogida no es fija: el `top` de las pestañas y de los títulos tiene
  que salir de la altura real de la cabecera (una variable CSS que ponga `js/cabecera-fija.js`
  al encoger/desplegar, por ejemplo), sin temblor (ver fila 50 en ese fichero).
- Fondo opaco en pestañas y títulos fijos, para que las filas no se transparenten al pasar por
  debajo; borde inferior o sombra suave para que se vea dónde acaba lo fijo.
- Al cambiar de pestaña, al filtrar, al volver de «Ver todo» (fila 214) y al repintar la tabla,
  lo fijo sigue fijo y no salta.
- Los menús «⋮» de las filas y el desplegable «Ordenar» se siguen viendo por encima de lo fijo
  (ojo con `z-index`).
- Sin `U.envolver`: es CSS y, como mucho, una variable puesta desde `js/cabecera-fija.js`.

## 4. Cómo sabemos que está bien

Con `?demo=1&auto=1` y una ventana baja (por ejemplo 1280×700) para que haya que bajar:

1. En Inicio, «Todos los abiertos», bajar hasta el final de la tabla: la cabecera encogida, las
   cuatro pestañas y la fila de títulos siguen a la vista, en ese orden, sin huecos entre ellas
   y sin taparse unas a otras.
2. La fila «Ha llegado» y los avisos sí desaparecen al bajar.
3. Bajado, pulsar otra pestaña: cambia la tabla y las pestañas y los títulos siguen fijos.
4. Bajado, abrir el «⋮» de una fila cercana a lo fijo: el menú se ve entero, por encima.
5. Las filas que pasan por debajo de lo fijo no se transparentan.
6. Subir del todo: todo vuelve a su sitio, sin saltos ni temblor (también con una tabla
   corta, de pocas filas).
7. En ventana estrecha (por ejemplo 800 px), la tabla sigue pudiendo verse entera
   (desplazamiento lateral o lo que haya hoy) y los títulos siguen alineados con sus columnas.
8. Archivo: si tiene fila de títulos, se queda fija al bajar; si no la tiene, la pantalla queda
   igual que antes.

Prueba automática nueva: `pruebas/titulos-de-la-tabla-fijos.mjs`, con los puntos 1, 3 y 6
(posición de pestañas y `thead` respecto a la cabecera tras bajar).
