# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`), y la conversación de diseño al dejar una fila PENDIENTE. Minutos por fila entera:
programar, pruebas, publicar y comprobar. La página «Estado de la cola» de Francisco lee esta
tabla desde `main`.

Última puesta al día: 11-oct-2026 00:40 (fila 324 EN CURSO); fila 328 PENDIENTE, puesta después por la conversación de diseño; fila 327 PENDIENTE, igual; fila 329 PENDIENTE, puesta después por la conversación de diseño; fila 330 PENDIENTE, igual

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por el revisor: los
minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 324 | 75 | Una función nueva que da la fecha real del listado y tres sitios que la usan (comprobación al entrar, quién manda al unir, aviso de alumnado viejo); parámetro nuevo en la demostración, prueba nueva y revisor |
| 326 | 110 | Módulo pequeño que presenta la app y pide el botón único a Google, quitar el botón copiado, el bloque de Ajustes y lo que copiaba la dirección del buzón, borrar el programa del buzón y sus pruebas; prueba nueva con botón de mentira, una comprobación con el de verdad y revisor |
| 327 | 150 | Tres módulos nuevos (tomar las partes del personal, convertirlas en las filas de hoy, tarjetas de Problemas), la regla curso por curso con la subida a mano, filas nuevas en «Lo que tengo ahora», tres variantes en la demostración, prueba nueva de doce puntos y revisor |
| 328 | 110 | Módulo nuevo que monta la entrega de empresas y la escribe en la carpeta del Centro de datos; permiso de escribir además del de leer en tres sitios; línea y botones en Ajustes; fila ámbar en la comprobación al entrar; dos parámetros nuevos en la demostración, prueba nueva y revisor |
| 329 | 80 | Segunda lista en el módulo de entregas de la fila 328: admitir una lista que sale de un JSON con árbol y campos de tabla, aplanar los departamentos, avisar al cambiar, segunda línea en Ajustes y el botón y la fila ámbar para las dos listas; datos nuevos en la demostración, prueba y revisor |
| 330 | 70 | Tercera lista en el módulo de entregas de las filas 328 y 329: los cargos salen de `cargos.json`, un registro por cargo y ocupante, contados por cargos distintos; avisar al cambiar, tercera línea en Ajustes y la fila ámbar para las tres; cargos inventados en la demostración, prueba y revisor |
