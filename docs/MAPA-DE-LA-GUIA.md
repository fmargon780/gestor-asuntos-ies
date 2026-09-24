# El mapa de la guía

Apuntada el 24-sep-2026. Fila 113 de `docs/COLA.md`.

## Para qué

Las guías tienen pasos-pregunta con ramas, y preguntas dentro de las respuestas sin límite de
niveles (fila 95). Dentro de un asunto se entiende bien: solo se ve el camino elegido. Pero al
escribir la guía, cada rama se ve por separado («Entrar» / «← Volver») y nunca se ve el conjunto.
Con dos niveles de preguntas, Francisco se pierde.

Se añade un **mapa de la guía**: un dibujo de solo lectura, como un diagrama de flujo, con la guía
entera de un vistazo. Más adelante servirá también para las preguntas dentro del guion de un hito
(aún no existen; no se hacen en esta fila).

## Qué tiene que hacer

### 1. El dibujo

- Los pasos, de arriba abajo, en su orden, unidos por una línea.
- En cada paso-pregunta, las ramas se abren **una al lado de otra**, con el texto de la respuesta
  encima de cada rama. Cada rama sigue hacia abajo con sus pasos, y sus preguntas se vuelven a
  abrir igual, a cualquier profundidad.
- Después de las ramas, los pasos comunes siguen debajo, unidos de nuevo (si la guía los tiene).
- Cada paso es una caja con su título. Si tiene responsable o plazo, una línea pequeña debajo.
  Los pasos `soloInformativo`, en gris, como en el resto de la app. Las preguntas, con una forma
  o marca que las distinga a primera vista (rombo o borde distinto y la palabra «pregunta»).
- Ocupa **todo el ancho disponible**. Si hay tantas ramas que no caben, se desplaza a los lados
  dentro de su propia caja; la página no se desplaza de lado.
- Se dibuja con HTML y CSS (cajas y líneas), sin librerías externas. Tiene que funcionar también
  en la copia sin internet (`file://`).
- Colores con las variables de siempre, y bien en modo claro y oscuro.

### 2. Dónde sale

1. **Ajustes → pantalla de cada tipo → «Pasos del trámite»** (`js/ajustes-tipo.js`, sección 3):
   un botón **«Ver mapa»** junto a lo que ya hay. Abre el mapa en un cuadro grande.
   Pulsar una caja del mapa abre el editor de la guía (`Guias.editar`) **ya colocado en el nivel
   de ese paso** y con ese paso desplegado.
2. **Dentro del cuadro de escribir la guía** (`Guias.editar`): un botón **«Ver mapa»** junto a
   «Añadir un paso». Como ya hay un `U.preguntar` abierto, el mapa se abre como **panel dentro del
   mismo cuadro** (mismo patrón que «+ Traer de la biblioteca»), nunca un segundo `U.preguntar`.
   El mapa se dibuja con lo que hay en pantalla en ese momento (llamar antes a `recoger()`).
   Pulsar una caja lleva a ese nivel y a ese paso, y cierra el panel.
3. **Dentro de un asunto**: un botón **«Ver mapa»** en la cabecera del bloque de hitos de la
   ficha (`js/hitos-panel.js`). El mismo dibujo, pero:
   - el **camino elegido, resaltado**; las ramas no elegidas y las preguntas sin responder, en gris;
   - cada caja del camino lleva el estado de su hito (pendiente · en curso · hecho · no aplica),
     con los colores que ya usa la lista de hitos;
   - pulsar un hito del camino abre su mesa (`HitoMesa.abrir(a, idHito)`); las cajas en gris no
     hacen nada.
   - Los hitos que no vienen de la guía (añadidos a mano o `delTipoAnterior`) salen aparte, al
     final, en una fila «Fuera de la guía».

## Ficheros

- **Nuevo** `js/guias-mapa.js` (`window.GuiasMapa`): una función pura que convierte los pasos (y,
  si se le pasan, los hitos del asunto) en el HTML del mapa, y las funciones que lo abren en cada
  sitio. Nada de lógica de guardado aquí.
- **Nuevo** `css/guias-mapa.css`.
- `index.html`: enlazar los dos, `js/guias-mapa.js` después de `js/guias.js`.
- `js/ajustes-tipo.js`: el botón de la sección «Pasos del trámite».
- `js/guias.js`: el botón y el panel dentro del editor, y poder abrir el editor en un paso
  concreto (`Guias.editar(..., { irA: idPaso })`). **Este fichero tiene unas 1.225 líneas**: antes
  de añadir nada, sacar a un fichero aparte (por ejemplo `js/guias-niveles.js`) la navegación por
  niveles («Entrar», «← Volver», la línea de camino), y hacer ahí el cambio.
- `js/hitos-panel.js`: el botón de la cabecera del bloque de hitos.
- **Nueva prueba** `pruebas/guias-mapa.mjs`, sin navegador: la función pura, con una guía de dos
  niveles de preguntas (ramas, respuestas, pasos comunes después) y con hitos (camino resaltado,
  ramas en gris, «Fuera de la guía»).
- Al cerrar: `docs/CONTEXTO-CORTO.md` (una línea en la sección 5), `docs/contexto/HITOS-Y-GUIAS.md`
  y `docs/HISTORIA.md`.

## Cómo trabajar

- **Sube directamente a `main`, sin abrir ninguna pull request** (salvo lo que dice la nota de
  `docs/COLA.md` sobre las sesiones en la nube).
- **Cambios quirúrgicos**: no reescribas ficheros enteros.
- **No leas el repositorio entero**: solo `docs/CONTEXTO.md`, `docs/contexto/HITOS-Y-GUIAS.md`,
  `docs/contexto/HITO-MESA.md` y los ficheros de la lista.
- **Una sola prueba al final** (`npm test`), no una después de cada cambio.
- Comprueba lo publicado con `curl`.
