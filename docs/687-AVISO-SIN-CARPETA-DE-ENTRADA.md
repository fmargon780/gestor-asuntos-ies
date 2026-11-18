# 687 — Avisar cuando falta señalar la carpeta de entrada

## Lo que escribió Francisco
No lo escribió él: es una idea de Claude salida de la fila 677 (`docs/notas-diseno/677.md`). Francisco dijo que sí a apuntarla el 17-nov-2026 y a hacerla como tarea pequeña ese mismo día («Sí»).

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- Hoy, si las carpetas de la app están en Drive y en ese ordenador no se ha señalado la carpeta de entrada de documentos sueltos, «Por clasificar» se queda vacío y la app no dice nada. Pasó en el instituto el 16-nov-2026.
- En ese caso sale un aviso ámbar, en la línea «Ha llegado» de Inicio y arriba de la pantalla de «Por clasificar»: «En este ordenador falta señalar la carpeta de entrada: los documentos sueltos no se ven.», con el botón «Señalar la carpeta», que abre la misma ventana que «Señalar» de Ajustes.
- Al señalarla, el aviso desaparece y salen los documentos.
- En la comprobación al entrar, la línea «Carpeta de entrada de documentos sueltos» sale en ese caso como «Falta», con «Arreglarlo», y no como «Bien».
- Con la carpeta señalada, o con las carpetas fuera de Drive, no cambia nada.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- La lentitud de los documentos en la carpeta de un asunto vivo: sigue en la fila 677.

## Notas técnicas de Claude
- La carpeta de entrada: `js/entrada.js` (sin señalar y con `nube: "drive"` en `_GESTOR/rutas.json` queda en «no está»). Los sueltos: `js/asuntos-lista.js` (`App.E.sueltos`). La comprobación al entrar: `js/comprobacion-entrada.js` (fila 455, hacia la línea 255).
- El aviso de Inicio, por el camino de los avisos que ya hay; no es una franja nueva. No sale en «solo consultar» el botón, sí el texto.
- Cambios quirúrgicos; prueba nueva con la demostración puesta como Drive sin carpeta de entrada. Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En el ordenador de Diego (o en uno sin la carpeta de entrada señalada): al entrar, el aviso ámbar con «Señalar la carpeta».
- En el tuyo, con la carpeta ya señalada: no sale ningún aviso.

## Revisión y respuestas durante el trabajo
- (18-nov-2026, tarea pequeña, comparada por la sesión con la prueba `aviso-sin-carpeta-de-entrada.mjs`)
- Aviso ámbar con la frase pedida y «Señalar la carpeta», en Inicio y arriba de «Por clasificar»: coincide.
- Al señalarla, desaparece el aviso y salen los documentos: coincide.
- Comprobación al entrar: «Falta» con «Arreglarlo» (lleva a Ajustes, donde está «Señalar»): coincide.
- Con la carpeta señalada o fuera de Drive no cambia nada; en solo consultar sale el texto sin botón: coincide.
- No lo he podido ver en un ordenador real con Drive (solo en el navegador de pruebas con disco de mentira).
