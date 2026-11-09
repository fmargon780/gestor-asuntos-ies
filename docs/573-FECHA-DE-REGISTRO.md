# 573 — Fecha de registro de cada documento

## Lo que escribió Francisco

Aviso de usuario (idea 509, 4-nov-2026, «Ficha de un asunto»), tal cual:

> ¿Es necesario diferenciar en el sistema la fecha de registro de la fecha del documento?
> Ejemplo de una factura emitida el 30.11.2026 y que registramos el 03.11.2026

(El ejemplo lleva una errata: es una factura del 30 de octubre registrada el 3 de noviembre.)

## Lo que entendió Claude (acordado con Francisco el 9-nov-2026)

- Cada documento registrado guarda su **fecha de registro**, aparte de la fecha del documento
  (la suya, la de emisión, que sigue igual y sigue en el nombre del fichero).
- La fecha de registro **nunca se escribe a mano**:
  - con sello de Séneca, la app la toma del sello al registrar;
  - sin sello, la toma del listado del registro de Séneca cuando llega («Control del registro»);
  - si el sello y el listado no coinciden, manda el listado.
- Mientras no hay fecha (registrado sin sello y sin listado todavía), solo se ve el código.
- Se ve al lado del código, en la línea del documento: «Registro 26EM0123 · 03/11/2026», en
  todas las listas de documentos del asunto y en la columna de registro de la mesa del hito.
- **Plantillas:** marca nueva «fecha de registro», junto a la de «registro», con el día de ese
  mismo registro (el mismo documento que da la marca «registro»). La marca sale en la lista de
  campos (Ajustes → El centro → «Campos» y la ventana de «Campo variable»).
- La marca «registro» encuentra también los documentos con el nombre nuevo (el registro en la ficha,
  no en el nombre); hoy solo encuentra los de nombre antiguo.
- **Plazos de la guía:** al poner el plazo de un hito que cuenta desde otro, se elige
  «desde que se hace» (lo de hoy) o «desde su registro».
  - «Desde su registro» cuenta desde la fecha de registro del documento colgado de la tarea de
    registrar de ese hito (si hay varios, el registro más reciente).
  - Si ese hito se hace y su documento aún no tiene fecha de registro, cuenta desde el día en que
    se hace; cuando llega la fecha (con el listado), el plazo se recalcula solo, salvo que alguien
    haya puesto la fecha del hito a mano.
  - Las guías que ya hay siguen contando «desde que se hace» hasta que alguien lo cambie.
  - La misma elección sale al poner el plazo de un hito desde el asunto.
- No desaparece nada.

## Pantalla de prueba

- Sin pantalla: no cambia dónde está cada cosa; añade la fecha junto al código, una marca de
  plantilla y una opción en el plazo (decidido por Francisco el 9-nov-2026).

## Qué NO se hace en esta tarea

- Escribir o corregir la fecha de registro a mano.
- Cambiar la fecha del documento ni el nombre de los ficheros.

## Notas técnicas de Claude

- Dato: `fecha` (AAAA-MM-DD) en cada elemento de `documentos[n].registros` de la ficha
  (`js/documentos-datos.js`, `anadirRegistro`); `registroDe`/`enriquecer`/`resumen` la pasan y la
  enseñan (`U.fechaCorta`).
- Sello: `js/registro.js` ya tiene `estado.sello.fecha` (de `js/registro-lector.js`, formato del
  sello); se convierte a ISO y va en `anadirRegistro`. Hoy solo acaba en la nota «Registrado … el …».
- Listado: al subir o recibir el listado (`js/control-registro.js`, apuntes con `fecha` por código),
  rellenar o corregir la fecha de los registros de los asuntos abiertos con ese código, por
  `ColaGuardado`, respetando `SoloConsulta.activo()`. Para lo ya registrado antes de esta fila,
  basta con lo que traiga el listado; las notas «Registrado … el …» pueden servir de respaldo.
- Mesa del hito: columna de registro de `js/hito-mesa.js`.
- Plantillas: `registroDelAsunto` en `js/plantillas-valores.js` lee hoy solo el código del nombre
  antiguo; leer también la ficha (`documentos[n].registros`) y añadir el valor «fecha de registro»
  (formato de fecha de las demás fechas de plantilla). Darla de alta en `CamposLista.reunir`.
- Plazos: `plazo` gana `base: 'hecho' | 'registro'` (sin `base` = `'hecho'`), en `js/guias-editor.js`
  y `js/guias-plazo.js`, `js/hitos-desde-el-asunto-formulario.js`, `js/hitos-normalizar.js`,
  `js/hitos-arbol.js` (crear desde la guía y `aplicarPlazosDependientes`) y
  `js/hitos-biblioteca.js`. El recálculo al llegar la fecha se engancha donde se rellena desde el
  listado, sin tocar hitos con `fechaManual`.
- Ficheros de más de 400 líneas que se toquen: regla de `docs/METODO-COMUN.md` 5.4.
- Novedades: línea en `js/novedades.js`. Demo: algún documento registrado con fecha.

## Cómo lo comprueba el segundo revisor

- En la demo, un documento registrado con sello enseña «Registro <código> · <dd/mm/aaaa>» con la
  fecha del sello, distinta de la fecha del documento.
- La fecha del documento y el nombre del fichero no cambian al registrar.
- Un documento registrado sin sello enseña solo el código; tras subir un listado de Séneca que
  traiga ese código, enseña la fecha del listado.
- Con sello y listado distintos, queda la del listado.
- La columna de registro de la mesa del hito enseña la misma fecha.
- La lista de campos tiene «fecha de registro»; una plantilla con esa marca y con «registro» sale
  con el código y la fecha de un documento de nombre nuevo.
- En el editor de la guía, el plazo que cuenta desde otro hito deja elegir «desde que se hace» o
  «desde su registro»; una guía existente sale en «desde que se hace».
- Con «desde su registro», al hacer el hito, la fecha límite del siguiente cuenta desde la fecha de
  registro, no desde hoy.
- Sin fecha de registro, cuenta desde hoy, y se recalcula al llegar el listado; con fecha puesta a
  mano, no.
- Al poner un plazo desde el asunto sale la misma elección.

## Qué mirar al terminar

- Registra con sello un documento de fecha anterior y mira la línea del documento: dos fechas
  distintas, la del nombre y la de registro.
- Abre un hito con documento registrado y mira la columna de registro.
- Genera un documento con una plantilla que lleve «registro» y «fecha de registro».
- En una guía, pon un plazo «desde su registro», haz el hito y mira la fecha límite del siguiente.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
