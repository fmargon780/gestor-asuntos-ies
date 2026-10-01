# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 01-oct-2026 (fila 240 HECHA)

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por `pruebas` y el
revisor: los minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 233 | 60 | `docs/SELLO-DOCUMENTO-NUEVO.md`: tercer botón en `js/ficha-sellos.js`, abrir el cuadro de poner nombre con el sello ya leído (`js/registro-sellado.js`), hito en curso y tarea marcada sola, datos de demostración y prueba nueva `pruebas/sello-documento-nuevo.mjs` |
| 243 | 45 | `docs/TITULOS-DE-LA-TABLA-FIJOS.md`: pestañas y `thead` de Inicio fijos bajo la cabecera encogida (`css/inicio.css`, variable de altura desde `js/cabecera-fija.js`, resolver el `overflow-x` del envoltorio), lo mismo en el Archivo si tiene títulos, y prueba nueva `pruebas/titulos-de-la-tabla-fijos.mjs` |
| 244 | 90 | `docs/CAMPOS-IMPORTE-NUMERO-FECHA.md`: tres clases nuevas en `js/campos.js` y `js/campos-catalogo.js`, controles y ámbar en Nuevo asunto, Cambiar el asunto y ficha, conversión de valores al cambiar de clase (abiertos e índice del ARCHIVO), clase declarada en `js/exportar-datos.js`, datos de demostración y prueba nueva |
| 247 | 50 | `docs/NOMBRES-DE-PILA-LARGOS.md`: acortar nombres de pila de más de 40 caracteres en `js/nombres.js` (alumnado, personal, tutores), reutilizar la carpeta de tercero ya existente con el nombre largo, medidor de rutas, persona de demostración y prueba nueva `pruebas/nombres-de-pila-largos.mjs` |
| 234 | 45 | `docs/RESPONSABLE-SECRETARIA-CON-VB.md`: responsable fijo nuevo en `js/hitos-administracion.js` (`asegurar`, `cuentaPara`), fila fija en `js/hitos-ajustes.js`, «Esperando a…» y filtro de Inicio, asunto de demostración y prueba nueva `pruebas/responsable-secretaria-con-vb.mjs` |
| 248 | 60 | `docs/NOVEDADES-AL-RECARGAR.md`: `js/novedades.js` (datos, con el relleno de las filas desde el 29-sep-2026) y `js/novedades-ventana.js` (ventana tras entrar, lo visto en `localStorage`, versión pulsable), carga en `index.html` y en la copia sin internet, regla 21 en la cola y prueba nueva `pruebas/novedades.mjs` |
