# 738 — Cambiar un dato de lista dentro del asunto abierto

Sale del tema 734 (guía de IPASEN ALUMNADO). Notas: `docs/notas-diseno/734.md`.

## Lo que escribió Francisco
Probó la guía en la app real: con «¿Quién hace la solicitud?» = Otra persona y «Cómo llega la petición» = En persona salen solo «Rechazar la solicitud…» y «Comprobar la identidad…». Pidió que la tarea de comprobar la identidad diga qué hacer si no se puede comprobar. Eso obliga a poder cambiar el dato después de crear el asunto. Eligió «1»: se programa ya.

## Lo que entendió Claude
- En «Campos de este asunto» (asunto abierto), un dato de lista **con valor** sale hoy como texto fijo. Solo los vacíos tienen desplegable (fila 592).
- Cada dato de lista con valor debe tener un «Cambiar» que abre el mismo desplegable con sus valores, con el valor actual elegido. Elegir otro lo guarda al momento, como cualquier dato (`DatosDelAsunto.guardar`).
- Al guardar, la lista de tareas del asunto se vuelve a calcular con el «Solo si» nuevo: salen las tareas que tocan y las demás se quitan (las ya hechas se quedan, como hoy).
- Solo en asuntos abiertos. En consulta y archivo, sin «Cambiar».
- Se anota en el registro del asunto: «<dato>: de <antes> a <ahora>».
- No cambia nada en datos que no son de lista, ni en tipos con hitos.

## Qué NO se hace en esta tarea
- Cambiar datos de lista de hitos (esos se rellenan en su hito).
- Pedir confirmación antes de cambiar.

## Notas técnicas de Claude
- Lugar del cambio: `js/ficha-bloques.js` `filasDeCampos` (rama `g && g.valor`) y `js/ficha-campos-lista-vacia.js` (`fila`, `filaHtml`, `alPintar`): reutilizar su desplegable para un dato con valor.
- Recalcular la guía: `js/solo-si.js` (`marcarLista`, `ajustarEnCurso`) y `js/hitos-sincronizar.js` (`completarAsuntoConGuia`); mirar cómo lo hace hoy el relleno de un dato vacío y llamar a lo mismo.
- Cambios quirúrgicos, ficheros nuevos por debajo de 400 líneas, una sola tanda de pruebas al final (`npm test -- <palabras>` más la prueba nueva).
- Novedades visibles: línea al principio de `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- Asunto abierto con un dato de lista con valor: sale con «Cambiar».
- Al cambiarlo, el valor nuevo se ve y queda guardado al recargar.
- Las tareas con «Solo si» de ese dato aparecen y desaparecen según el valor nuevo; las ya hechas no se quitan.
- El registro del asunto lleva la línea del cambio.
- En un asunto cerrado o de archivo no hay «Cambiar».
- Un dato vacío sigue con su desplegable «Elegir…» de siempre.

- (25-nov-2026, Claude Code) Segundo revisor (agente aparte, contexto limpio, servidor local, copia de pruebas con «Baja de matrícula»): **APROBADA a la primera**. Coincide: «Cambiar» en un dato de lista con valor; el desplegable abre con el valor de ahora; se guarda al momento y queda al reabrir; el registro lleva «<dato>: de <antes> a <ahora>»; las tareas con «Solo si» salen y se quitan (la ya hecha se queda); en un asunto cerrado no hay «Cambiar»; el dato vacío sigue con «Elegir…»; soltar sin elegir lo deja como estaba; consola sin errores; pantallas principales abren.
- Observaciones del revisor, sin tocar: al dar el primer valor a un dato vacío no se anota línea en el registro (solo el cambio, como pide la instrucción); en un asunto cerrado los datos vacíos conservan su desplegable «Elegir…» (ya era así).
- No visto: probar con la guía real de IPASEN ALUMNADO (solo en el instituto).
