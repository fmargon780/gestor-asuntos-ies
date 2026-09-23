# Fila 100 — Avisos que dicen la verdad, y botones que se bloquean de verdad

Acordado con Francisco el 23-sep-2026. Segunda de tres (99, 100 y 101). Va **después** de la 99:
usa su cola de guardados y su contador «hay un guardado en marcha».

## El problema

Muchas acciones hacen varios pasos: primero guardan lo importante y luego actualizan otras cosas
(índice, notas, lista, hitos). Todo va en el mismo `try`. Si falla un paso de después, sale
«No he podido guardar…» aunque lo importante ya estaba en el disco. Al repetir, sale «Ya hay…».
Además, el botón «Guardando…» se vuelve a encender solo, y se puede pulsar dos veces.

## Reglas de trabajo

- Sube directamente a `main`, sin abrir ninguna pull request.
- Cambios quirúrgicos. No leas el repositorio entero: solo la lista de abajo.
- Si un fichero que toques a fondo pasa de unas 400 líneas, pártelo en dos
  (`js/ficha-asunto.js` ya pasa de 1.000).
- Una sola prueba al final.

## La regla que tiene que quedar

Cada acción separa **lo principal** de **lo accesorio**:

- Si falla lo principal: aviso rojo, «No he podido …», y la pantalla como estaba.
- Si lo principal sale bien: aviso verde, «Guardado».
- Si después falla algo accesorio: aviso **ámbar**, «Guardado, pero no he podido …», diciendo qué.
  Nunca rojo encima de un verde.
- Todo error se muestra con `U.mensajeDeError` (en castellano). Hoy hay unos 140 avisos que
  pegan `e.message` en inglés; cámbialos todos.

## Sitios concretos

Principal y accesorio en el mismo `try`:

- Marcar un hito: `Hitos.marcar` y luego `anadirNota`, dos escrituras (`js/hitos-panel-lista.js:153-160`).
  Mejor: la nota dentro del mismo `cambiar`.
- Estado: `App.ponerEstado` mete `pintarAbiertos()` en el mismo `try` (`js/asuntos-lista.js:190-199`).
- Archivar: `js/asuntos-archivar.js:143-174`, `js/ficha-archivo.js:98-125`, `js/hitos-archivo.js:329`.
- Registrar: `js/registro.js:231-243` (`quitarDePendientes`, `Notas.sustituir`).
- Nombre de un documento: `js/documentos.js:607-614` (`actualizarPendiente`).
- Crear asunto: `js/asuntos-nuevo.js:616` (relectura final).
- Renombrar: `js/asuntos-editar.js:309-318` (`Hitos.cambiar` después de mover).
- Meter un papel en un asunto: `js/documentos-sueltos.js:325-333` (error callado; decir el motivo).
- Papel suelto a la papelera: `js/papelera.js:683`.
- Mandar un asunto a la papelera: `js/papelera.js:138-160`. Anotar primero en `papelera.json` y
  mover después, para que nunca quede una carpeta en la papelera sin apuntar.
- Unir asuntos: `js/unir-asuntos.js:501`. Mover también subcarpetas, o ámbar si queda algo.

Traslados de carpeta: si la copia está completa en el destino pero falla el borrado del original
(`js/carpetas.js:200`, fichero abierto en Word o Acrobat, o Dropbox bloqueándolo), el traslado se
da por bueno, se anota la ficha y sale ámbar: «Queda una copia vieja en … ; ciérrala y bórrala».

Sin `try` ni aviso (el error se pierde y no se repinta): responsable, fecha, nota, quitar,
«solo informativo» y quitar documento de un hito (`js/hitos-panel-lista.js:277, 300-332`);
`abrirLoPide` (`js/ficha-asunto.js:700, 705`); «Tomar el mando» (`js/ficha-asunto.js:429-437`);
desplegable de sellos (`js/ficha-asunto.js:537-546`). `try/catch` con aviso y el repintado en
`finally`.

## Botones que se bloquean de verdad

1. `aplicarModoConsulta` (`js/ficha-asunto.js:467-475`) pone `disabled=false` en **todos** los
   controles cada vez que el observador ve un cambio, también el texto «Guardando…». Solo debe
   tocar los controles que él mismo apagó, y respetar una marca `data-guardando` que ponga
   `U.mientrasGuarda`. El mismo fallo reactiva las casillas de hito de un asunto archivado.
2. Sin `U.mientrasGuarda`: «Crear» (`js/asuntos-nuevo.js:537`), «Guardar» del documento
   (`js/documentos.js:355`), «Meter en un asunto» (`js/documentos-sueltos.js:318`).
3. `U.mientrasGuarda` no envuelve el diálogo, solo la escritura (`js/ficha-asunto.js:766, 778`):
   hoy el botón dice «Guardando…» con el cuadro aún abierto. Y `abrirLoPide` abre el cuadro
   enseguida y carga la persona después (hoy espera a `Datos.cargar`, `ficha-asunto.js:677`).
4. Un asunto con una acción larga en marcha (archivar, renombrar, unir) queda marcado
   (`App.E.ocupados[nombre]`). Su tarjeta sale con los botones apagados aunque se repinte, y
   `cerrarAsunto`, `reabrirAsunto` y `editarAsunto` no arrancan otra vez.
5. Un diálogo sobre otro deja la primera espera colgada para siempre (`js/util.js:216-234`, un
   solo `#capa`). Al abrir un segundo, el primero se da por cancelado.
6. Registrar desde el cuadro (`js/registro.js:276-281`): el cuadro se cierra y el guardado sigue
   sin señal. Que se vea «Guardando…» hasta el final.

## Ficheros que hay que tocar

`js/util.js`, `js/hitos-panel-lista.js`, `js/asuntos-lista.js`, `js/asuntos-archivar.js`,
`js/ficha-archivo.js`, `js/hitos-archivo.js`, `js/registro.js`, `js/documentos.js`,
`js/asuntos-nuevo.js`, `js/asuntos-editar.js`, `js/documentos-sueltos.js`, `js/papelera.js`,
`js/unir-asuntos.js`, `js/carpetas.js`, `js/ficha-asunto.js` (partido en dos si hace falta), y
los que tengan avisos con `e.message`. Prueba nueva en `pruebas/`.

## Cómo se comprueba

Una sola prueba: con el disco simulado, forzar que falle solo el paso accesorio de marcar un hito,
de cambiar el estado y de archivar. En los tres, el dato está guardado y el aviso es ámbar, no
rojo. Y que el botón de la ficha sigue apagado mientras dura el guardado.

## Al terminar

Regla de la sección 6 de `docs/CONTEXTO-CORTO.md` sobre `U.mientrasGuarda`, sustituida por la
nueva (principal/accesorio, verde/ámbar/rojo, `U.mensajeDeError` siempre). Causa en
`docs/HISTORIA.md`.
