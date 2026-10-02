# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`), y la conversación de diseño al dejar una fila PENDIENTE. Minutos por fila entera:
programar, pruebas, publicar y comprobar. La página «Estado de la cola» de Francisco lee esta
tabla desde `main`.

Última puesta al día: 02-oct-2026 (filas 254 y 255 PENDIENTE)

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por el revisor: los
minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 253 | 60 | Una regla en `js/por-liquidar.js` llamada desde tres sitios (cambio de tipo, casilla de Ajustes, pasada al entrar), aviso con «Deshacer» y una prueba nueva |
| 254 | 75 | Buscar y arreglar por qué no se añade el campo desde la ficha (hay que reproducirlo), cambio de nombre de la tarjeta con el botón en su título, y la ventana de elegir campo ancha y en columnas, con su prueba ampliada |
| 255 | 130 | Campos de un hito: marca de hito en los campos del tipo y de «solo aquí», tarjeta nueva en la mesa con rellenado en el sitio, ventana con «Ya están en este asunto», rótulos por hito en la ficha, desplegable «Hito» en Ajustes y una prueba nueva |
