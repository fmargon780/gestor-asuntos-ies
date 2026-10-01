# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 01-oct-2026 (fila 236 PENDIENTE)

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por `pruebas` y el
revisor: los minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 217 | 35 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md`: solo `js/correo-enviar.js` (aviso nuevo y un segundo intento con la forma general de la dirección) y sus pruebas en `pruebas/correo-enviar.mjs` |
| 238 | 130 | `docs/CERTIFICADO-CONSEJO-ESCOLAR.md`: lector de los CSV del Consejo Escolar y su tabla unida por nombre, botón para subir ficheros con avisos, hueco `{{TABLA CONSEJO ESCOLAR}}`, plantilla y tipo nuevos en la biblioteca, datos de demostración y prueba nueva |
| 240 | 40 | `docs/SOPORTE-TEXTO-SIN-LIMITE.md`: quitar el tope de 5.000 caracteres en `js/soporte.js` y `apps-script/soporte.gs`, ventana más ancha y cuadro que crece al escribir en `css/soporte.css`, guion gris y contador de palabras, y poner al día `pruebas/soporte.mjs` y `pruebas/soporte-script.mjs` |
| 245 | 90 | `docs/CAMPO-DESDE-EL-ASUNTO.md`: botón en la ficha que reutiliza `js/campos-catalogo.js`, paso del valor, «¿Dónde se guarda?» de `js/donde-se-guarda.js`, campos «solo aquí» en la ficha y en «Cambiar el asunto», «Deshacer», datos de demostración y prueba nueva |
| 233 | 60 | `docs/SELLO-DOCUMENTO-NUEVO.md`: tercer botón en `js/ficha-sellos.js`, abrir el cuadro de poner nombre con el sello ya leído (`js/registro-sellado.js`), hito en curso y tarea marcada sola, datos de demostración y prueba nueva `pruebas/sello-documento-nuevo.mjs` |
| 243 | 45 | `docs/TITULOS-DE-LA-TABLA-FIJOS.md`: pestañas y `thead` de Inicio fijos bajo la cabecera encogida (`css/inicio.css`, variable de altura desde `js/cabecera-fija.js`, resolver el `overflow-x` del envoltorio), lo mismo en el Archivo si tiene títulos, y prueba nueva `pruebas/titulos-de-la-tabla-fijos.mjs` |
| 244 | 90 | `docs/CAMPOS-IMPORTE-NUMERO-FECHA.md`: tres clases nuevas en `js/campos.js` y `js/campos-catalogo.js`, controles y ámbar en Nuevo asunto, Cambiar el asunto y ficha, conversión de valores al cambiar de clase (abiertos e índice del ARCHIVO), clase declarada en `js/exportar-datos.js`, datos de demostración y prueba nueva |
| 247 | 50 | `docs/NOMBRES-DE-PILA-LARGOS.md`: acortar nombres de pila de más de 40 caracteres en `js/nombres.js` (alumnado, personal, tutores), reutilizar la carpeta de tercero ya existente con el nombre largo, medidor de rutas, persona de demostración y prueba nueva `pruebas/nombres-de-pila-largos.mjs` |
| 234 | 45 | `docs/RESPONSABLE-SECRETARIA-CON-VB.md`: responsable fijo nuevo en `js/hitos-administracion.js` (`asegurar`, `cuentaPara`), fila fija en `js/hitos-ajustes.js`, «Esperando a…» y filtro de Inicio, asunto de demostración y prueba nueva `pruebas/responsable-secretaria-con-vb.mjs` |
| 236 | 50 | `docs/CORREO-ENVIADO-EN-PDF.md`: PDF del correo enviado con pdf-lib en `js/correo-enviado-pdf.js` (nuevo), llamada tras el envío en `js/correo-cuadro.js`, nombre como el CORREO de la bandeja, ámbar si falla, envío simulado en demo y prueba nueva `pruebas/correo-enviado-pdf.mjs` |
