# Nuevo asunto: la categoría guía el formulario (fila 215)

Acordado con Francisco el 28-sep-2026. Diseño cerrado. Corrige lo que salió de la fila 197
(`docs/NUEVO-ASUNTO-PERSONA-PRIMERO.md`), que está HECHA y publicada.

## Lo que ve Francisco hoy (y por qué)

Al usar Nuevo asunto pulsa primero una pastilla de categoría («tipo de tercero») y luego busca el
tipo de asunto. Se encuentra con:

1. **No hay botón para aceptar.** «Crear el asunto» solo aparece (o solo se activa) cuando hay
   persona y tipo; como aún no ha elegido persona, no ve nada que pulsar.
2. **La lista de tipos no se filtra por la categoría pulsada.** Hoy `categoriaDeLaParrilla()` solo
   mira `App.E.nuevo.tercero` / `terceroPropuesto`; la pastilla (`App.E.nuevo.categoria`) solo
   filtra el buscador de personas.
3. **La lista de tipos es enorme.** Sin categoría salen todos.
4. **Al elegir la categoría no se le ofrece buscar la persona.** El buscador está, pero no se nota.

## Ficheros que se tocan

- `js/asuntos-nuevo.js` (`pintarCategorias`, `elegirCategoria`, `categoriaDeLaParrilla`,
  `pintarTipos`, y donde se pinte o active «Crear el asunto»)
- `js/asuntos-nuevo-alta.js` (`pintarBuscadorDeTercero`: el foco y la posición del buscador)
- `js/tipos-buscador.js` (los 8 más usados + «Ver todos»)
- `js/asuntos-nuevo-crear.js` (el botón siempre visible, con lo que falta)
- `index.html` (`#pantalla-nuevo`) y el `css/` que toque
- `pruebas/nuevo-asunto-persona-primero.mjs` y las que rellenen Nuevo asunto
- `docs/contexto/ASUNTOS.md`

No leas el repositorio entero. Cambios quirúrgicos. Los identificadores internos se quedan.

## Cómo tiene que quedar

1. **Pulsar una pastilla de categoría** (p. ej. ALUMNADO):
   - El buscador de personas queda **justo debajo de las pastillas**, visible y **con el cursor
     dentro**, listo para escribir, filtrado a esa categoría (como hoy).
   - **A la vez, la lista de tipos de asunto enseña solo los de esa categoría.**
     `categoriaDeLaParrilla()` pasa a mirar, por este orden: tercero elegido → tercero propuesto →
     pastilla pulsada (`App.E.nuevo.categoria`) → ninguna.
   - Volver a pulsar la pastilla la apaga y todo vuelve a «todas las categorías».
2. **Lista de tipos corta**: con categoría (por pastilla o por persona), arriba salen **los 8 más
   usados** de esa categoría (el orden que ya da `js/tipos-buscador.js`) y debajo un enlace
   **«Ver todos (N)»** que despliega el resto, agrupado por órgano como hoy, y se vuelve a plegar.
   Sin categoría, lo mismo con los 8 más usados de todas (con su etiqueta de categoría) y «Ver
   todos». El buscador de tipos, si existe, sigue buscando en todos los de la categoría.
3. **«Crear el asunto» siempre a la vista**, abajo, en el mismo sitio. Mientras falte algo, en gris
   (desactivado) y con el texto de lo que falta: «Falta elegir la persona», «Falta elegir el tipo
   de asunto» o «Falta elegir la persona y el tipo de asunto». Con las dos cosas, se activa y dice
   «Crear el asunto». Todo lo demás de crear, igual que hoy (parada de duplicados, abrir la mesa del
   primer hito).
4. **Lo que no cambia**: el camino «tipo primero» (elegir un tipo sin persona fija la categoría y
   filtra el buscador), el buscador único cuando no hay pastilla, «+ Dar de alta», «+ Crear tipo
   nuevo», el recuadro de la fila 163, `App.nuevoAsuntoCon(...)`. Si se elige una persona de otra
   categoría distinta de la pastilla (no debería poder, pero por si acaso), manda la de la persona.

## Prueba

Prueba de navegador: pulsar ALUMNADO → el cursor está en el buscador de personas y la lista de
tipos solo tiene tipos de ALUMNADO, como mucho 8 más «Ver todos»; «Ver todos» despliega el resto;
el botón se ve en gris con «Falta elegir la persona y el tipo de asunto», cambia de texto al elegir
el tipo y se activa al elegir la persona; crear abre la mesa del hito 1. Apagar la pastilla vuelve a
todas. `npm test` entero al final, con las pruebas viejas puestas al día.

## Al terminar

`docs/contexto/ASUNTOS.md` (el formulario). Entrada en `docs/HISTORIA.md`. Sube directamente a
`main`, sin pull request, en como mucho dos subidas.
