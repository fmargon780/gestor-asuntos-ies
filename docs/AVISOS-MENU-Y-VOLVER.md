# Los avisos en una línea, el menú y un solo «Volver» (fila 178)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Tercera y última parte de la «tanda 2».
**Va después de la fila 177.** Referencia visual: la franja amarilla y el menú de
`docs/boceto-inicio.html`.

## Ficheros que se tocan

- `index.html` (hueco de la línea de avisos en Inicio; el menú)
- `js/avisos.js`, `js/avisos-que-faltan.js`, `js/recurrentes.js`, `js/frescura.js`,
  `js/unir-asuntos.js` (el botón de duplicados), `js/que-me-toca.js` o `js/inicio.js` (aspirantes)
- Un módulo nuevo `js/avisos-linea.js` que junta los avisos (enganchado por
  `window.Gestor.alRefrescar`)
- `js/barra.js` (orden y nombres del menú)
- `js/navegacion.js`, `js/usabilidad.js`, `js/cuentas.js`, `js/formularios.js`,
  `js/unir-asuntos-pantalla.js` (Volver)
- `js/hito-mesa.js` (botón para volver a los hitos)
- Las pruebas de `pruebas/` que miren los avisos o el Volver

No leas el repositorio entero. Cambios quirúrgicos.

## Qué hay que hacer

### 1. Todos los avisos de arriba, en una sola línea

Hoy se apilan hasta cinco cajas de color (alumnado desfasado, fichas sin carpeta, papelera
vieja, vencimientos, recurrentes), más el botón de duplicados de la cabecera y el de aspirantes
sin número. Cada una con su forma de callarla.

- **Una sola franja** debajo de la cabecera de Inicio, de una línea. Cada aviso es un trozo
  corto separado por « · », por ejemplo: «**3 vencidos** · 5 vencen esta semana · 2 asuntos que
  se repiten toca crearlos · 4 posibles duplicados · papelera: 12 cosas de más de 30 días ·
  fichero de alumnado de hace 20 días».
- **Cada trozo se puede pulsar** y hace lo que hacía el botón de su caja (ver los vencidos, crear
  los recurrentes, ir a Duplicados, ir a la papelera, ir a Mantenimiento…).
- Color de la franja: roja si hay algo vencido o el fichero de alumnado falta; ámbar si no. Sin
  avisos, la franja no sale.
- **Un solo botón para callarla: «Ocultar por hoy»**, a la derecha. Vuelve al día siguiente o
  cuando aparezca un aviso nuevo que no estaba.
- Los módulos de cada aviso siguen calculando lo mismo: solo dejan de pintar su caja y le pasan
  su trozo a `js/avisos-linea.js`.

### 2. El menú

Orden y nombres, como en el boceto: **Inicio · Nuevo asunto · Archivo · Personas y empresas ·
Impresos · Cuentas**, línea, **Ajustes**. Al pie, la sesión, la versión y «Salir». El número rojo
de vencidos, en «Inicio».

### 3. Un solo «Volver», que siempre vuelve a donde estabas

Hoy hay cuatro «Volver» que hacen cosas distintas: el de Cuentas, Impresos y Duplicados lleva
siempre a Asuntos abiertos, vengas de donde vengas.

- **Todas las pantallas** usan el mismo mecanismo que ya usa la ficha (`js/navegacion.js`): al
  entrar se apunta de dónde se viene; «← Volver» y Escape vuelven ahí, a la misma altura.
- Botón «← Volver» visible en todas las pantallas salvo Inicio. Sin origen apuntado, a Inicio.
- Quitar el historial aparte de `js/usabilidad.js` (el de las pestañas) si queda sin uso.

### 4. La mesa del hito tiene su «Volver»

Hoy de la mesa del hito solo se sale con Escape o pulsando la pestaña «Hitos» de arriba. Añadir
un botón **«← Volver a los hitos»** a la izquierda de la cabecera de la mesa, que hace lo mismo
que Escape en ese punto (cierra la mesa y deja la tarjeta Hitos en grande).

## Prueba

Una prueba nueva en `pruebas/` (navegador): con un asunto vencido y un recurrente pendiente, sale
una sola franja con dos trozos, pulsar «vencidos» filtra la tabla, «Ocultar por hoy» la quita;
de Cuentas se vuelve a la pantalla de la que se vino (no siempre a Inicio); la mesa tiene «← Volver
a los hitos» y funciona. Y `npm test` entero en verde.

## Al terminar

Reglas de siempre de `docs/COLA.md`. En `docs/CONTEXTO-CORTO.md`, sustituir las líneas de avisos y
navegación. Poner al día `docs/contexto/PANTALLA.md`. Entrada en `docs/HISTORIA.md`.
