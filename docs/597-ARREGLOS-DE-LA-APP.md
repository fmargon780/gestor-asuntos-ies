# 597 — Arreglos de la app

## Lo que escribió Francisco
Tema: Arreglos de la app. Junta las ideas 593, 594 y 596: que «Imprimir etiquetas» y «Ver todas
las plantillas» vuelvan a abrir su pantalla; que al crear un asunto desde el control de registro se
reconozca a tutores legales y administraciones; y que el menú «⋮» de la mesa del hito no quede
tapado por la barra lateral. Salieron al repasar las pruebas (fila 584).

## Lo que entendió Claude (acordado con Francisco el 10-nov-2026)
- «Imprimir etiquetas» (desde un asunto de grupo) y «Ver todas las plantillas» (desde la pantalla
  de un tipo) vuelven a abrir su pantalla, como antes de la fila 551.
- Al crear un asunto desde el control del registro, el remitente o destinatario se reconoce también
  entre los tutores legales y las Administraciones, además de alumnado, personal, empresas y otros.
- El menú «Hito ▾» del hito abierto se despliega entero a la vista: ninguna parte queda bajo la
  barra lateral y todas sus opciones se pueden pulsar por cualquier sitio.
- No cambia nada más de lo que se ve.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Los textos de los botones de los cuadros (ideas 569 y 595): van en el tema 502.

## Notas técnicas de Claude
- Etiquetas y plantillas: en `App.pintarHerramientas` (`js/herramientas.js`), `EtiquetasPantalla.cerrar()`
  y `PlantillasPantalla.cerrar()` van antes del `await PlanGuiasAplicar.leerMarca()` (antes de
  cualquier espera), como ya dice el comentario de la fila 344.
- Control del registro: en `terceroQueEncaja` (`js/control-registro-pantalla.js`, línea 269) la
  lista sale de `Nombres.CATEGORIAS` en vez de estar escrita a mano.
- Menú del hito: el menú de `.mesa-mas` (`js/hito-mesa.js`, estilos de `.ficha-menu` en
  `css/ficha-asunto.css`) se coloca de modo que su borde izquierdo nunca quede a la izquierda del
  borde derecho de la barra lateral (si al abrirse hacia la izquierda no cabe, se corre hacia la
  derecha). Comprobarlo a 1400 px de ancho y en la anchura mínima que use la app.
- Sacar de `RETIRADAS` en `pruebas/ejecutar.mjs`: `etiquetas-desde-el-grupo.mjs`,
  `plantillas-desde-un-tipo.mjs` y `categorias-del-control-de-registro.mjs`.
- En `pruebas/donde-se-guarda.mjs` (líneas 101, 233 y 278), quitar `position: { x: 180, y: 8 }`
  y su comentario: el clic normal tiene que funcionar.
- Línea en `js/novedades.js` (cambia algo que se ve).

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor. Las cuatro pruebas citadas, en verde.

## Qué mirar al terminar
- Abre un asunto de grupo y pulsa «Imprimir etiquetas»: se abre su pantalla.
- En la pantalla de un tipo, pulsa «Ver todas las plantillas»: se abre su pantalla.
- En el control del registro, crea un asunto de una entrada de un tutor legal: el tercero sale ya puesto.
- En un asunto, abre un hito y pulsa «Hito ▾»: el menú se ve entero, sin nada bajo la barra lateral.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
