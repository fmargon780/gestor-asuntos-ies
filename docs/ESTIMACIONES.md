# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 01-oct-2026 (fila 240 HECHA)

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por `pruebas` y el
revisor: los minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 248 | 60 | `docs/NOVEDADES-AL-RECARGAR.md`: `js/novedades.js` (datos, con el relleno de las filas desde el 29-sep-2026) y `js/novedades-ventana.js` (ventana tras entrar, lo visto en `localStorage`, versión pulsable), carga en `index.html` y en la copia sin internet, regla 21 en la cola y prueba nueva `pruebas/novedades.mjs` |
