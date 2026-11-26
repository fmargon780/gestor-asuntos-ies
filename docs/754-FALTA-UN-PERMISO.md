# Fila 754 · falta un permiso (26-nov-2026)

**Qué se negó.** La fila 754 («Comprobar lo recibido y la factura», parte 5 de `docs/583-COMPRAS-DE-MATERIAL.md`) está
programada y con sus pruebas en verde, pero no ha pasado por el segundo revisor, que en una fila grande es obligatorio antes de
publicar (`docs/METODO-COMUN.md` 6.1 y `CLAUDE.md`, «El revisor»). Para lanzarlo hay que arrancar un servidor local con el código
de la rama. La sesión intentó arrancarlo (`python3 -m http.server 8300`, solo en local y solo para el revisor, con la
autorización escrita de Francisco en el encargo) y el clasificador de permisos de la sesión **negó la orden** («Undermining
Oversight»). Siguiendo `docs/METODO-COMUN.md` 3.C no se ha buscado ningún rodeo ni se ha reintentado. **Es la misma negativa que
en la fila 753** (`docs/753-FALTA-UN-PERMISO.md`): la frase escrita en el encargo no basta; hace falta una regla de permisos.

**Dónde está el trabajo.** Rama `claude/vibrant-archimedes-bbvr90` (no está en `main`; `main` solo lleva la marca de la fila):
- `js/material-factura-datos.js` (nuevo): la lógica pura (recibido, factura, las tres comprobaciones, lo que vuelve a «Lo que falta», los precios facturados, a qué pedidos se puede juntar).
- `js/material-factura.js` (nuevo): el bloque «Pedido y factura» (tarjeta plegable del asunto COMPRA, `#ficha-pedido`) y `Material.comprobarPedido`.
- `js/material-factura-guardar.js` (nuevo): los guardados (la ficha del asunto por `App.guardarRegistroFresco`; lo de «Lo que falta» y los precios por sus colas).
- `js/ficha-tarjetas.js`, `js/ficha-asunto.js`, `js/cargar-piezas-2.js`: enganchan el bloque.
- `js/material-precios.js` (`facturas` en `material-precios.json`, para que lo facturado siga contando al cerrar el asunto) y `js/material-pedidos.js` (`cifrasDeProveedor` con lo facturado de verdad).
- `js/demo/datos-material.js` y `js/demo/datos.js`: tres asuntos COMPRA de demostración con su pedido (dos de Dobla, uno de La Esquina).
- `css/material.css`, `js/novedades.js`, `js/version.js`, `docs/CASOS-DE-PRUEBA.md`, `docs/CONTEXTO-CORTO.md`.
- Pruebas: `pruebas/material-factura-datos.mjs` y `pruebas/material-factura-pantalla.mjs` (nuevas); `pruebas/material.mjs`, `pruebas/material-pedir-pantalla.mjs`, `pruebas/material-precios.mjs` y `pruebas/material-precios-pantalla.mjs` ajustadas a los tres pedidos de demostración y al campo `facturas`.

**Qué falta para terminarla** (en este orden): 1) arrancar el servidor local y pasar el revisor con contexto limpio
(`docs/REVISOR-GUION.md`, punto «Parte 5» de «Cómo lo comprueba el segundo revisor»); 2) con la APROBADA, publicar la rama en la
dirección de prueba (`pruebas-pages.yml`, rama = la de la fila) y dejar la fila en `ESPERA TU VISTAZO`, como manda `CLAUDE.md`
para una fila grande; 3) con el vistazo, fusionar en `main` y publicar una sola vez. La fila 755 («Devoluciones y facturas
rectificativas») necesita esta: no se ha tocado.

**Qué frase tiene que escribir Francisco para darlo:** «Permito a la sesión arrancar `python3 -m http.server` en un puerto
local (8300) para el revisor de la fila 754, y pararlo con `kill <PID>` al terminar». O, mejor, añadir a los permisos de las sesiones
de este repositorio una regla de Bash para `python3 -m http.server` (así no hace falta repetirlo en cada fila grande).

## Lo que sí se comprobó sin servidor propio
- `npm test -- material` (las pruebas de «Material», incluidas las dos nuevas): todo bien. La nueva de pantalla recorre en Chromium, con la demostración: «Comprobar recibido y factura» desde «Pedidos» abre el asunto con el bloque abierto; recibido de menos en rojo y «Volver a pedir lo no recibido (1)»; la factura con las tres comprobaciones en verde, el veredicto «✓ Factura conforme» o «Con diferencias»; un precio y un IVA distintos; juntar el otro pedido del mismo proveedor y quitarlo; volver a pedir (suma a la línea de «Lo que falta» y solo una vez); pasar los precios al catálogo con «Factura <nº>»; y «Facturado en el año» y «Pedido sin facturar» de «Proveedores» con cifras de verdad.
- Pasada completa (`npm test`): ver la nota de la fila.
- Sin ver: la mirada del segundo revisor; el bloque con datos reales (solo se probó con la demostración).
