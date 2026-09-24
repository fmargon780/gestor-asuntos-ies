# Cabecera compacta de la ficha y del hito (fila 112)

Cerrada con Francisco el 24-sep-2026, a partir de una captura de la ficha de un asunto de
ADMISION con un hito abierto a pantalla completa (filas 107 y 109).

## El problema

Con un hito abierto, el contenido del hito (guion, documentos, comunicar) empieza a unos 530 px
del borde superior. Casi todo lo que hay encima está repetido:

- Tres botones de volver: «← Volver a la lista», «← Volver a las tarjetas» y «← Volver a la
  lista de hitos».
- El nombre del asunto dos veces: en el título y en la línea de ruta «Asuntos abiertos › …
  › Hito 1 de 5».
- «Hitos 2/5» dos veces: en la pestaña y como título del recuadro.
- «Comunicar» en la cabecera del asunto y en la columna derecha del hito (esto último se deja:
  ver «Qué no se toca»).

Francisco pide aprovechar el alto igual que el ancho: páginas densas, sin huecos y sin tener
que desplazarse hacia abajo para llegar a lo importante.

## Lo que hay que hacer

### Cabecera del asunto (dos líneas en total)

1. **Línea 1:** botón «← Volver» (vuelve a la lista, como el actual «Volver a la lista»), la
   etiqueta del tipo (ADMISION), el título del asunto y el botón «···». En el extremo derecho de
   esa misma línea, «Archivar el asunto».
2. **Línea 2:** el desplegable de estado, «Sin plazo», «El encargo» y «Comunicar». En el
   extremo derecho, en letra pequeña y gris y en una sola línea: las etiquetas Asunto · Ruta ·
   NIE (siguen siendo pulsables) y «Abierto el 17/07/2026 · ALUMNADO · 26-27».
3. Se quita la línea horizontal y el margen grande entre la cabecera y las pestañas.

### Pestañas

4. Se quita el botón «← Volver a las tarjetas». Para volver a la cuadrícula de tarjetas basta
   con pulsar otra vez la pestaña que está abierta (la que va resaltada). Pon un `title` en la
   pestaña activa: «Volver a las tarjetas».

### Dentro del hito abierto

5. Se quita el título del recuadro «Hitos 2/5» (ya está en la pestaña).
6. Se quitan el botón «← Volver a la lista de hitos» y la línea de ruta «Asuntos abiertos › …».
   Para volver a la lista de hitos: pulsar otra vez la pestaña «Hitos» (igual que en el punto 4,
   pero un nivel más adentro: desde un hito abierto, primero a la lista de hitos; desde la lista
   de hitos, a las tarjetas). La tecla Escape hace lo mismo.
7. **Una sola línea** con: el nombre del hito, sus etiquetas (Hecho, Sin plazo, Sin
   responsable) y, a la derecha, el botón «Hecho ✓ (desmarcar)» y «···».
8. Debajo, la tira de pasos 1 a 5, como ahora.

### Objetivo medible

Con un hito abierto en una ventana de 1600 × 920, el título «GUION DEL HITO» debe quedar a
**250 px o menos** del borde superior (hoy, unos 660). Compruébalo en las pruebas con el
navegador (`getBoundingClientRect().top`) y deja la prueba en `pruebas/`.

En pantallas estrechas (menos de 900 px de ancho) las líneas pueden partirse en dos; no pasa
nada, pero nunca con desplazamiento lateral.

## Qué no se toca

- «Comunicar» y «Pedir lo que falta» dentro del hito: está pendiente de decidir con Francisco
  tras un mes de uso (ver «Lo que queda por hablar» en `docs/COLA.md`).
- Las columnas del hito (guion, documentos, comunicar y notas) y su contenido.
- La cuadrícula de tarjetas cuando no hay ninguna abierta.

## Dónde mirar

- `js/ficha-tarjetas.js` (fila 107) y la cabecera de la ficha.
- La vista del hito a pantalla completa (fila 109, `docs/contexto/HITO-MESA.md`).
- Regla de siempre: salir de un hito o de una tarjeta nunca saca de la ficha del asunto
  (`pruebas/quedarse-en-el-asunto.mjs` debe seguir en verde).

## Al terminar

Qué va a ver Francisco: la cabecera del asunto en dos líneas, sin «Volver a las tarjetas» ni
«Volver a la lista de hitos», y el hito empezando casi arriba del todo.
