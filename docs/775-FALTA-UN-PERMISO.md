# Filas 775 y 776 · falta un permiso (26-nov-2026)

**Qué se negó.** Las filas 775 y 776 (`docs/691-QUITAR-LO-QUE-ESTORBA.md`, partes 1 y 2) están programadas y con sus pruebas de lo
tocado en verde, pero no han pasado por el segundo revisor, que en una fila grande es obligatorio antes de publicar
(`docs/METODO-COMUN.md` 6.1 y `CLAUDE.md`, «El revisor»). Para lanzarlo hay que arrancar un servidor local con el código de la
rama. La sesión intentó arrancarlo (`python3 -m http.server 8300`, solo en local y solo para el revisor, con la autorización escrita
de Francisco en el encargo) y el clasificador de permisos **negó la orden** («Undermining Oversight»). Siguiendo
`docs/METODO-COMUN.md` 3.C no se ha buscado ningún rodeo ni se ha reintentado. Es la misma negativa que en las filas 753 y 754
(`docs/753-FALTA-UN-PERMISO.md`, `docs/754-FALTA-UN-PERMISO.md`): la frase del encargo no basta; hace falta una regla de permisos.

**Dónde está el trabajo** (nada de esto está en `main`):
- Fila 775: rama `claude/peaceful-archimedes-z1tuc7` (también `fila-775` en local), commit f4a080f. Plazo sin fecha fuera de la
  cabecera y «Poner plazo…» en «⋯» (`js/ficha-asunto.js`, `js/ficha-nombre-acciones.js`); sin «Cambiar la guía» bajo la lista de
  tareas (`js/hitos-panel.js`); documentos con nombre entero y «Extracto» y «Vincular a una tarea» en el ⋮
  (`js/ficha-documentos-fila.js`, `js/extracto-documento.js`, `css/filas.css`); «colgar» → «vincular» en los textos y en
  `docs/VOCABULARIO.md`; línea 775 en `js/novedades.js`; `App.VERSION` puesta con el programa. Pruebas puestas al día: las de
  cabecera, documentos, presencia, extracto, bandeja y vista del asunto (las 10 tocadas, en verde).
- Fila 776: rama `fila-776`, commit 41531df (parte de la 775 + Nuevo asunto: orden Tercero · Tipo · Fecha, a todo el ancho; prueba
  `nuevo-asunto-mas-simple` ampliada y **sin pasar todavía**, falta comprobar la medida del ancho). Hay que rehacerle la línea de
  `js/novedades.js` (hoy solo lleva la de la 775) y `App.VERSION`.
- Pasada completa: la de antes de los últimos cambios dio 8 fallos, todos por el cambio y ya arreglados; falta repetirla entera
  una vez, justo antes de subir (`docs/METODO-COMUN.md` 5.1).

**Qué falta** (en este orden): 1) arrancar el servidor local y pasar el revisor con contexto limpio (`docs/REVISOR-GUION.md`, punto
«Parte 1» de «Cómo lo comprueba el segundo revisor»); 2) con la APROBADA, publicar la rama en la dirección de prueba
(`pruebas-pages.yml`) y dejar la fila en `ESPERA TU VISTAZO`; 3) con el vistazo, fusionar en `main` y publicar una sola vez;
4) lo mismo con la 776 sobre la 775 ya en `main`.

**Qué frase tiene que escribir Francisco para darlo:** «Permito a la sesión arrancar `python3 -m http.server` en un puerto local
(8300) para el revisor de las filas 775 y 776, y pararlo con `kill <PID>` al terminar». O, mejor, una regla de Bash en los permisos
de las sesiones de este repositorio para `python3 -m http.server` (así no hace falta repetirlo en cada fila grande).
