# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 01-oct-2026 (fila 241 EN CURSO)

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por `pruebas` y el
revisor: los minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 217 | 35 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md`: solo `js/correo-enviar.js` (aviso nuevo y un segundo intento con la forma general de la dirección) y sus pruebas en `pruebas/correo-enviar.mjs` |
| 238 | 130 | `docs/CERTIFICADO-CONSEJO-ESCOLAR.md`: lector de los CSV del Consejo Escolar y su tabla unida por nombre, botón para subir ficheros con avisos, hueco `{{TABLA CONSEJO ESCOLAR}}`, plantilla y tipo nuevos en la biblioteca, datos de demostración y prueba nueva |
| 240 | 40 | `docs/SOPORTE-TEXTO-SIN-LIMITE.md`: quitar el tope de 5.000 caracteres en `js/soporte.js` y `apps-script/soporte.gs`, ventana más ancha y cuadro que crece al escribir en `css/soporte.css`, guion gris y contador de palabras, y poner al día `pruebas/soporte.mjs` y `pruebas/soporte-script.mjs` |
| 241 | 150 | `docs/EXPORTAR-ASUNTOS.md`: filtro «Fechas» en Inicio, ventana de exportar con columnas recordadas, lectura de archivados por el índice del ARCHIVO, `.xlsx` con pestaña de hitos y totales (librería en `lib/` si falta), PDF con membrete en el visor, reservados ocultos, datos de demostración y prueba nueva |
| 245 | 90 | `docs/CAMPO-DESDE-EL-ASUNTO.md`: botón en la ficha que reutiliza `js/campos-catalogo.js`, paso del valor, «¿Dónde se guarda?» de `js/donde-se-guarda.js`, campos «solo aquí» en la ficha y en «Cambiar el asunto», «Deshacer», datos de demostración y prueba nueva |
