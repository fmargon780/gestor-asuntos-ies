# Pantalla "Qué me toca"

Encargo acordado con Francisco el 16 de septiembre de 2026. Es la fila 16 de `docs/COLA.md`.

**Depende de la fila 15 (`docs/HITOS.md`).** Si los hitos no están hechos, marca esta como
BLOQUEADA y sigue con la siguiente.

## Reglas de esta instrucción

- **Sube directamente a `main`. No abras ninguna pull request.**
- Cambios quirúrgicos. No reescribas ficheros enteros.
- **No leas el repositorio entero.** Solo los ficheros de la lista de abajo.
- **Una sola prueba al final**, con `npm test`.
- Si algún fichero que tocas pasa de unas 400 líneas, pártelo en dos.
- Comprueba lo publicado con `curl`.

## 1. Para qué es

Los hitos de la fila 15 se ven dentro de cada asunto. Esta pantalla los cruza todos: qué está
pendiente hoy, en todos los asuntos abiertos, sin tener que entrar en ellos uno a uno.

Es la razón por la que los hitos viven en un fichero aparte (`_GESTOR/hitos.json`): se lee uno y
sale la pantalla entera.

## 2. Qué enseña

Una pantalla nueva, **"Qué me toca"**, con los hitos en estado `pendiente` y `encurso` de todos
los asuntos abiertos. Los `hecho` y los `noaplica` no salen.

Tres bloques, en este orden:

1. **En tu tejado** — hitos cuyo responsable es `yo` o `companero`. Ordenados por fecha límite, los
   **vencidos arriba y en rojo**. Los de hoy y mañana, en naranja.
2. **Esperando a otros** — hitos cuyo responsable es cualquier otro. Cada línea dice a quién se
   espera y **cuántos días lleva parado**, contados desde su `desde`. Los más parados, arriba. Este
   bloque es el que sirve para saber a quién hay que ir a dar la lata.
3. **Sin fecha** — los pendientes que no tienen fecha límite. Van abajo, plegados. **Tienen que
   salir**: si solo se vieran los que tienen fecha, los pasos que se olvidan serían justo los
   invisibles.

Cada línea lleva: el hito, el asunto al que pertenece y su tercero. Al pulsarla se abre la ficha
de ese asunto, con ese hito desplegado.

Arriba, un filtro por responsable, para ver solo lo de una persona. Se recuerda en `localStorage`.

## 3. Cómo se llega

Una entrada en la barra de la izquierda, junto a las que ya hay. Lleva la cuenta de lo que está
vencido, como un número al lado. Si no hay nada vencido, no sale número.

## 4. Cómo se hace

Módulo propio que **vive entero en su fichero**, como hizo la pantalla "Duplicados" en
`js/unir-asuntos.js`:

- Se registra con `App.PANTALLAS.push` y se engancha con `window.Gestor.alRefrescar`.
- **No toca `js/ajustes.js`.**
- Salida con Escape, con `.boton-volver`.
- Antes de colgar una función nueva de `App`, comprueba que el nombre no está cogido.

**Aprovecha el ancho.** Monitor ancho, página densa, sin huecos a los lados y sin obligar a bajar
para ver lo importante. El título y el cuerpo terminan en el mismo borde.

## 5. Ficheros que hay que tocar

Nuevos:

- `js/que-me-toca.js`
- `css/que-me-toca.css`
- `pruebas/que-me-toca.mjs`

Que se tocan:

- `js/barra.js` — la entrada nueva y su cuenta de vencidos.
- `index.html` — la línea del `<script>` (después de `js/hitos.js`, antes de `js/inicio.js`) y el
  `<link>` del CSS.
- `docs/CONTEXTO.md`, `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`, `docs/COLA.md`.

Esta pantalla **no trae panel a la derecha**, así que no hay que tocar `PANELES_DE_LA_DERECHA` de
`js/vista.js`.

## 6. Qué hay que probar

Una sola prueba nueva, `pruebas/que-me-toca.mjs`, en navegador, a 1905 píxeles:

1. Con hitos de varios asuntos, salen repartidos en los tres bloques que tocan.
2. Un hito vencido sale arriba y en rojo.
3. Un hito de otro responsable sale en "Esperando a otros", con los días parados bien contados.
4. Un hito sin fecha sale en "Sin fecha".
5. El filtro por responsable deja solo lo de esa persona.
6. Pulsar una línea abre la ficha del asunto con ese hito desplegado.
7. La cuenta de la barra coincide con los vencidos.

Nada de fechas escritas a mano: se cuentan desde hoy.

## 7. Al terminar

- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` sustituyendo la línea vieja.
- Anota en `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- Marca la fila 16 de `docs/COLA.md` como HECHA, con la versión publicada.
