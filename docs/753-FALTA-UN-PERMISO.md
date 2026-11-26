# Fila 753 · falta un permiso (26-nov-2026)

**Qué se negó.** La fila 753 («Pedir precios por correo», parte 4 de `docs/583-COMPRAS-DE-MATERIAL.md`) está programada y
con sus pruebas en verde, pero no ha pasado por el segundo revisor, que en una fila grande es obligatorio antes de publicar
(`docs/METODO-COMUN.md` 6.1 y `CLAUDE.md`, «El revisor»). Para lanzarlo hay que arrancar un servidor local con el código de
la rama. La sesión intentó arrancarlo (`python3 -m http.server 8300`, solo en local y solo para el revisor, con la
autorización escrita de Francisco en el encargo) y el sistema de permisos de la sesión **negó la orden**. Siguiendo
`docs/METODO-COMUN.md` 3.C no se ha buscado ningún rodeo ni se ha reintentado.

**Dónde está el trabajo.** Rama `claude/peaceful-bohr-gzgwgi` (no está en `main`; `main` solo lleva la marca EN CURSO de la fila):
- `js/material-peticiones.js` (nuevo): el cuadro «Pedir precios», el correo, el envío por `CorreoEnviar.enviar` y el apunte de lo pedido.
- `js/material-precios.js`: `material-precios.json` guarda también `peticiones`.
- `js/material-falta.js`: la línea pedida enseña en «Mejor precio» «precios pedidos el … a N proveedores».
- `css/material.css`, `js/cargar-piezas-2.js`, `js/demo/datos-material.js` (un cuarto proveedor de demostración, sin correo), `js/novedades.js`, `js/version.js`.
- Pruebas: `pruebas/material-peticiones.mjs` y `pruebas/material-peticiones-pantalla.mjs` (nuevas); `pruebas/material.mjs`,
  `pruebas/material-precios.mjs` y `pruebas/material-precios-pantalla.mjs` ajustadas al proveedor de demostración nuevo.

**Qué falta para terminarla** (en este orden): 1) arrancar el servidor local y pasar el revisor con contexto limpio
(`docs/REVISOR-GUION.md`, punto «Parte 4» de «Cómo lo comprueba el segundo revisor»); 2) con la APROBADA, publicar la rama en la
dirección de prueba (`pruebas-pages.yml`, rama = la de la fila) y dejar la fila en `ESPERA TU VISTAZO`, como manda `CLAUDE.md`
para una fila grande; 3) con el vistazo, fusionar en `main` y publicar una sola vez.

**Qué frase tiene que escribir Francisco para darlo:** «Permito a la sesión arrancar `python3 -m http.server` en un puerto
local (8300) para el revisor de la fila 753, y pararlo con `kill <PID>` al terminar». O bien añadir a los permisos de la
sesión una regla de Bash para `python3 -m http.server`.

## Lo que sí se comprobó sin servidor propio
- `npm test -- material`: las pruebas de «Material» pasan, incluidas las dos nuevas (el cuadro con proveedores sin correo
  deshabilitado, «Enviar N correos», el texto del correo, la nota «precios pedidos el … a N proveedores», cancelar no manda nada).
- Pasada completa (`npm test`): ver la nota de la fila.
- Sin ver: la mirada del segundo revisor; el envío de verdad (en la demostración no sale ningún correo).
