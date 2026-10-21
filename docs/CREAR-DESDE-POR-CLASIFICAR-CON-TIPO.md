# Ningún asunto sin tipo al crearlo desde «Por clasificar»

Fila 385 de `docs/COLA.md`. Aviso del botón de soporte de Diego Herrera (20-oct-2026, «Ficha de un
asunto», perfil Administración, versión 19-oct-2026 · 22:25; aviso completo:
https://drive.google.com/file/d/1jP5_vPA0mibX-IgfbhK9pGbvoZLgO3Fn/view?usp=drivesdk). Texto del
usuario: «No debe dejar crear asunto de un documento sin clasificar, sin tipo de asunto.» Diseñada
con Francisco el 21-oct-2026.

## El problema

En «Por clasificar», el botón «Crear asunto con él» (`js/documentos-sueltos.js`,
`App.empezarAsuntoCon`) usa lo que el lector ha adivinado del documento
(`LectorDeSueltos.resultadoDe`). Si ha adivinado un tipo **y** un tercero, crea el asunto de un clic
con `App.crearAsuntoConPropuesta` (`js/asuntos-nuevo-crear.js`), que hace, por este orden:
`App.elegirCategoria(tipo.categoria)`, `App.elegirTipo(tipo)`, `App.fijarTercero(tercero)` y
`$('btn-crear').onclick()`.

Cuando el tipo adivinado y el tercero adivinado son **de categorías distintas**,
`App.fijarTercero` (`js/asuntos-nuevo-campos.js`, hacia la línea 146) descarta el tipo
(`App.E.nuevo.tipo = null`), como debe. Pero después se llama a `$('btn-crear').onclick()`
directamente: eso se salta que el botón esté desactivado («Falta elegir el tipo de asunto», en
`App.refrescarVista`), y `App.crearAsuntoDelFormulario` crea la carpeta y la ficha con `tipo: ''`.
El asunto queda «Sin tipo» y hay que ponérselo a mano después.

Pasó varias veces el 20-oct-2026 por la tarde, probablemente con candidaturas a las elecciones al
Consejo Escolar.

## Lo que hay que hacer

1. **Con tipo y tercero de la misma categoría**, «Crear asunto con él» sigue creando de un clic,
   exactamente como hoy (tipo puesto, documento dentro, cuadro de ponerle nombre al documento).
2. **Con tipo y tercero de categorías distintas**, no se crea nada de un clic. Se hace lo mismo que
   hoy cuando hay tercero y no hay tipo: `App.E.pendiente = s` y `App.nuevoAsuntoCon({ tercero,
   fecha })`, **sin pasar el tipo**. Resultado en pantalla (decidido con Francisco): Nuevo asunto,
   con la persona **como sugerencia**, «Para: [persona] · Elige el tipo de asunto» y el enlace «Otra
   persona», igual que hoy cuando hay persona y no hay tipo; el aviso «Este asunto se crea con un
   documento» arriba; la fecha leída en «Fecha de inicio»; la parrilla de tipos para elegir, y el
   botón de abajo desactivado (su texto, el que ya pone `App.refrescarVista`; no se cambia). Al
   elegir un tipo de la categoría de la persona, la persona queda puesta sola; al elegir uno de otra
   categoría, la sugerencia se olvida (comportamiento de hoy). Al elegir tipo y pulsar «Crear el asunto», todo
   sigue como hoy.
3. La comprobación de «misma categoría» se hace en `App.empezarAsuntoCon`, antes de decidir el
   camino. Además, en `js/documentos-sueltos-lector.js`, `actualizarBotonCrear` tiene que usar el
   mismo criterio: el título «Crea el asunto con lo leído y mete el documento dentro» solo cuando
   tipo y tercero encajan; si no encajan, el mismo título que hoy lleva el caso «tercero sin tipo».
   En la línea gris de lo leído de la tarjeta (`textoDeLaPropuesta`, «registro · fecha · tipo ·
   persona»), si tipo y persona no encajan se quita **solo el tipo**; registro, fecha y persona se
   quedan.
4. **Barrera general:** `App.crearAsuntoDelFormulario` no crea **nunca** un asunto sin tipo o sin
   tercero, la llame quien la llame. Si falta alguno de los dos, no crea nada, no da error y deja la
   pantalla de Nuevo asunto como está (con su botón desactivado y su texto «Falta elegir…»). La
   comprobación va **al principio del botón «Crear»**, antes de la comprobación de duplicados de
   `js/duplicados.js` (que envuelve ese botón), para que sin tipo no salga ni el aviso de
   «ya existe un asunto parecido».
   `App.crearAsuntoConPropuesta` comprueba **antes** de tocar nada que tipo y tercero son de la misma
   categoría; si no, no crea nada y hace lo mismo que el punto 2 (persona como sugerencia, sin tipo).
   Y después de `App.fijarTercero`, si por lo que sea el tipo ya no está elegido, no pulsa «Crear».
5. Revisar con el mismo criterio `App.nuevoAsuntoCon` cuando recibe `tipo` y `tercero` que no
   encajan (lo usan la bandeja de correo, `js/bandeja-propuesta.js` `llevarANuevo`, y también
   encargos, control del registro, actividades y el archivo de personas). Hoy la parrilla ya se ve
   cuando `App.fijarTercero` descarta el tipo, pero la marca `App.E.nuevo.tipoEnLinea` se queda en
   `true`: al elegir después un tipo, la pantalla pasa a la línea «Tipo de asunto: X · Cambiar».
   Compruébalo en el navegador; si es así, pon `tipoEnLinea = false` cuando el tipo se descarta.
   El cambio vale para todos los que usan `App.nuevoAsuntoCon` y no debe cambiar nada cuando tipo y
   tercero sí encajan.
6. Los asuntos ya creados sin tipo no se tocan. Se arreglan a mano (salen en el filtro «Sin tipo»
   de la lista). No hace falta avisar de nada en pantalla.
7. No se cambia cómo adivina el lector ni qué tipos o personas propone. Solo qué se hace cuando lo
   adivinado no encaja.

## Pruebas automáticas

- Una prueba nueva: documento suelto cuya propuesta trae un tipo de una categoría y un tercero de
  otra; al pulsar «Crear asunto con él» no se crea ninguna carpeta, se abre Nuevo asunto con la
  persona como sugerencia («Para: … · Elige el tipo de asunto») y el botón «Crear» desactivado.
- Una prueba nueva: llamar a `App.crearAsuntoDelFormulario` sin tipo no crea carpeta.
- Siguen en verde las que ya existen: `pruebas/lector-documentos.mjs`,
  `pruebas/nuevo-asunto-sin-repetir.mjs`, `pruebas/por-clasificar-usa-lo-leido.mjs`,
  `pruebas/crear-asunto-desde-por-clasificar.mjs` y `pruebas/crear-asunto-desde-todos-los-sitios.mjs`.

## Ejemplo con datos reales

Una candidatura a las elecciones al Consejo Escolar que llega a «Por clasificar». Si el lector
adivina el tipo de las elecciones al Consejo Escolar y, como persona, a una madre, un padre o un
alumno de otra categoría, hoy se crea un asunto «Sin tipo». Con el arreglo se abre Nuevo asunto con
esa persona como sugerencia y hay que elegir el tipo antes de crear. Para el revisor, en el modo de demostración: no se añade
ningún documento fijo a «Por clasificar». El caso se monta solo dentro de la prueba automática y de
la sesión del revisor (por ejemplo, forzando el resultado de `LectorDeSueltos.resultadoDe` para un
documento de prueba con un tipo de una categoría y un tercero de otra).

## Cómo sabré que está bien

Acordadas con Francisco el 21-oct-2026:

1. En «Por clasificar», con un documento donde la app adivina bien el tipo y la persona, «Crear
   asunto con él» lo crea de un clic, con su tipo puesto. Igual que hoy.
2. Con un documento donde lo adivinado no encaja, se abre Nuevo asunto con la persona como sugerencia y el
   aviso «Este asunto se crea con un documento» arriba.
3. En ese caso, la persona sale como sugerencia («Para: … · Elige el tipo de asunto») y el botón de
   abajo no deja crear hasta elegir el tipo.
4. Al elegir el tipo y pulsar Crear, la ficha del asunto nuevo muestra su Tipo de asunto.
5. Ningún asunto creado después del arreglo aparece en el filtro «Sin tipo» de la lista.
