# Quién lo pide, una sola vez en la cabecera (fila 106)

Cerrado con Francisco el 24-sep-2026.

## El problema

En la cabecera de la ficha del asunto, "quién lo pide" sale dos veces, muy cerca y de forma
distinta:

1. Arriba, la etiqueta morada: `Lo pide: García, Isabel María`. Es la que aclara, pero no dice
   qué es esa persona del interesado.
2. Debajo del botón "El encargo", una línea gris: `Tutor legal 1 · por en persona`. No dice
   quién es, y además tiene una errata ("por en persona").

## Lo que hay que hacer

1. **La etiqueta de arriba lleva también la relación**, entre paréntesis, cuando la haya:
   `Lo pide: García, Isabel María (tutor legal 1)`. La relación va en minúscula dentro de la
   etiqueta. Si `loPide.relacion` está vacía, la etiqueta queda como hoy, solo con el nombre.
   Si el nombre guardado ya es "Tutor legal N" (tutor sin nombre en Séneca), no se repite.
2. **Se quita la línea gris de debajo del botón "El encargo"**, entera. La vía (en persona, por
   correo, por teléfono…) no se muestra en la cabecera. Sigue viéndose y editándose al abrir
   "El encargo" (el desplegable "Por qué vía" de `LoPide.controles`). Comprueba que ahí se ve
   con el valor guardado; si no, arréglalo para que sí.
3. Si al quitar la línea el botón queda con un hueco vacío debajo, que se alinee con los demás
   botones de la fila (estado, plazo, Comunicar).
4. No cambia nada de lo que se guarda en `asuntos.json`. Solo es cómo se pinta.

## Ficheros

- `js/ficha-asunto.js` — donde se pinta la cabecera (la etiqueta "Lo pide" y la línea bajo
  "El encargo"). Si alguna de las dos se pinta en otro fichero, localízalo con
  `grep -rn "Lo pide\|El encargo" js/` y toca solo ese.
- `js/lo-pide.js` — solo si hace falta una función pequeña para el texto de la etiqueta.
- El CSS de la cabecera, solo si queda un hueco (punto 3).
- Las pruebas de `pruebas/` que miren esa cabecera, si las hay: ajústalas.

## Cómo trabajar

- **No leas el repositorio entero.** Solo los ficheros de arriba.
- **Cambios quirúrgicos**, no reescribas ficheros enteros. Si un fichero que tocas pasa de unas
  400 líneas, pártelo en dos.
- **Sube directamente a `main`, sin abrir ninguna pull request** (ver la nota de `docs/COLA.md`
  si la sesión no lo permite).
- **Una sola prueba al final**: `npm test` en verde.

## Qué verá Francisco

En la ficha del asunto: arriba, `Lo pide: García, Isabel María (tutor legal 1)`; debajo del
botón "El encargo", nada.
