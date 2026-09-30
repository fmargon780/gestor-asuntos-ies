# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 30-sep-2026 (fila 240 PENDIENTE)

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por `pruebas` y el
revisor: los minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 231 | 45 | `docs/CREAR-ASUNTO-DESDE-POR-CLASIFICAR.md`: reproducir con varios documentos sueltos, encontrar por qué «Nuevo asunto» sale sin buscador ni parrilla, arreglarlo en `js/documentos-sueltos.js` o `App.prepararNuevo`, y ampliar la prueba de la fila 220 |
| 217 | 35 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md`: solo `js/correo-enviar.js` (aviso nuevo y un segundo intento con la forma general de la dirección) y sus pruebas en `pruebas/correo-enviar.mjs` |
| 229 | 150 | `docs/REGISTRO-DEL-ASUNTO.md`: módulo nuevo que junta las notas del asunto y la historia de cada hito en una sola lista, tarjeta «Registro» en la ficha y en la mesa, líneas automáticas que falten, «⋮» de Cambiar/Borrar en las escritas a mano, pruebas nuevas y datos de demostración |
| 235 | 120 | `docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md`: el bloque «¿Dónde se guarda?» común para hitos y tareas (sustituye la casilla y los menús «Cambiar aquí / Cambiar en la guía»), llevar a la guía un hito propio con sus tareas, «Deshacer» en el aviso, buscar por qué «Cambiar la guía…» sale sin la guía previa, y poner al día las pruebas de las filas 206 y 224 |
| 238 | 130 | `docs/CERTIFICADO-CONSEJO-ESCOLAR.md`: lector de los CSV del Consejo Escolar y su tabla unida por nombre, botón para subir ficheros con avisos, hueco `{{TABLA CONSEJO ESCOLAR}}`, plantilla y tipo nuevos en la biblioteca, datos de demostración y prueba nueva |
| 239 | 240 | `docs/NOMBRES-FIJOS-CON-NUMERO.md`: contadores anuales de asunto y documento en `_GESTOR` con comprobación entre ordenadores, estructura fija en `js/nombres.js` sin romper la lectura de nombres antiguos, datos de documento (registros, campos) en la ficha e índice, «_Previas», tope de 25 en nombres cortos con lista «Arreglarlo», medidor de rutas en Ajustes, demostración y pruebas |
| 240 | 40 | `docs/SOPORTE-TEXTO-SIN-LIMITE.md`: quitar el tope de 5.000 caracteres en `js/soporte.js` y `apps-script/soporte.gs`, ventana más ancha y cuadro que crece al escribir en `css/soporte.css`, guion gris y contador de palabras, y poner al día `pruebas/soporte.mjs` y `pruebas/soporte-script.mjs` |
