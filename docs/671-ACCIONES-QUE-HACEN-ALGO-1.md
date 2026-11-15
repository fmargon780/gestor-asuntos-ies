# 671 — Acciones que hacen algo (1 de 2): «Cómo se hace», Grabar, Entregar, Recoger y Comprobar

Primera de las dos partes del tema 665. Detrás va la 672 (Publicar, Cobrar o pagar y Archivar).

## Lo que escribió Francisco

Ideas 652 a 656 (14-nov-2026, apartadas del tema 650), juntas en el tema 665:

> Que la acción «En Séneca» de una tarea haga algo propio al usarla, además de clasificar. Por ejemplo, enseñar la ruta de Séneca para copiarla.

> Que la acción «Entregar o recoger en mano» de una tarea haga algo propio al usarla, además de clasificar. Por ejemplo, apuntar a quién y cuándo.

> Que las acciones «Publicar», «Cobrar o pagar» y «Comprobar» hagan algo propio al usarlas, además de clasificar. Qué hacen, por decidir al diseñarlas.

Durante el diseño (14-nov-2026): «Archivar» entra también en el tema (opción 1). Sobre quitar la casilla de estas tareas, preguntó «no habrá situaciones de bloqueo en los que no se pueda seguir porque no se tenga el dato, verdad?» y, con los datos opcionales, eligió la opción 2 (la casilla desaparece).

## Lo que entendió Claude (acordado con Francisco el 14-nov-2026)

**Para las siete acciones del tema** («Grabar o cambiar datos», «Entregar», «Recoger», «Comprobar» en esta parte; «Publicar», «Cobrar o pagar» y «Archivar» en la 672):
- **La casilla desaparece.** La tarea se marca con su botón o con «No aplica».
- Cada botón abre una ventana pequeña; **todos sus datos son opcionales**: se puede guardar en blanco y la tarea queda hecha.
- Al guardar, la tarea queda hecha y enseña debajo, en verde, lo apuntado, con la fecha y quién la marcó (por ejemplo «✔ Entregado a Dirección · 14-nov-2026 · Francisco»).
- Lo apuntado queda también en el Registro del asunto, una línea por cosa.
- Como ya no hay casilla, el menú ⋮ de una tarea hecha (o «No aplica») trae **«Deshacer»**: vuelve a dejarla sin hacer y lo apunta en el Registro.
- Hasta que salga la 672, «Publicar», «Cobrar o pagar» y «Archivar» siguen como hoy, con su casilla.

**«Cómo se hace», en cualquier tarea** (no solo en las de estas acciones):
- Texto opcional de pasos, uno por línea.
- Se escribe en «Cambiar» de la tarea (en el asunto, y en la guía si la marca «Los cambios… van también a la guía» está encendida) y en la guía del tipo.
- En el asunto, debajo de la tarea sale «▸ Cómo se hace» plegado; al abrirlo, los pasos numerados. Si está vacío, no sale.

**«Grabar o cambiar datos»:** botón «Grabado».
- La ventana enseña los pasos de «Cómo se hace» con «Copiar los pasos». Si no hay, dice: «La guía no dice cómo se hace. Se puede escribir en «Cambiar».»
- Pide fecha (hoy, se puede cambiar) y nota. «Guardar y marcar hecha».

**«Entregar» y «Recoger»:** botones «Entregado» y «Recogido».
- La ventana pide «A quién se entrega» / «De quién se recoge», fecha (hoy) y nota.
- La persona se elige de una lista: el tercero (la alumna o el alumno, con su nombre), la familia (con nombre), el tutor o la tutora (con nombre), Dirección, Jefatura de Estudios y Secretaría.
- En la guía y en «Cambiar», la tarea lleva «A quién» (en Entregar) o «De quién» (en Recoger): Tercero, Familia, Relacionado, Tutor/a, Dirección, Jefatura de Estudios o Secretaría. La ventana propone esa persona; se puede cambiar.

**«Comprobar»:** dos botones en la tarea, «Está bien» y «Falta algo».
- «Está bien» la marca hecha al momento, sin ventana.
- «Falta algo» pide «Qué falta o qué está mal». La tarea **sigue sin hacer**, en rojo, con «Falta: …», la fecha y quién lo apuntó. Se apunta en el Registro.
- Después se puede pulsar «Está bien» (queda hecha) o volver a «Falta algo» para cambiar la nota.

**Lo que desaparece:** la casilla de las tareas de estas cuatro acciones.

## Pantalla de prueba

- Aprobada el 14-nov-2026: `docs/pantallas/665.html` · https://claude.ai/artifact/2B98byXjiSvEN1HhC1nehA. De esta parte salen de ella: las tareas de Grabar, Comprobar, Recoger y Entregar, «Cómo se hace», «Deshacer», «No aplica» y el Registro. Las de Publicar, Cobrar y Archivar son de la 672.

## Qué NO se hace en esta tarea

- «Publicar», «Cobrar o pagar» y «Archivar»: fila 672.
- Las tareas con otras acciones (Generar documento, Registrar, Enviar…) siguen como hoy, con su casilla.

## Notas técnicas de Claude

- Casilla: `js/hito-mesa-guion.js` (`guion-casilla`, línea ~91). No se pinta para `seneca`, `entregar`, `recoger` y `comprobar` (en la 672, también `publicar`, `cobrar` y `archivar`). Poner la lista en un solo sitio (por ejemplo `Comunes.ACCIONES_CON_VENTANA` en `js/comunes.js`) para que la 672 solo la amplíe.
- Botones: junto a los de `js/hito-mesa-recetas.js` (`TEXTO`, botón de la tarea). Ventana nueva en un fichero propio (por ejemplo `js/tarea-hecha-ventana.js`), con el aspecto de la de llamadas (`js/llamadas-ventana.js`).
- Marcar: por `js/hitos-guion-marcar.js`, que ya guarda `quien` y `cuando`. Lo apuntado va en la tarea del asunto como `hechoCon: { fecha, aQuien, nota, texto }` (`texto` es la línea verde ya compuesta). «Falta algo»: `falta: { texto, quien, cuando }`, sin marcar. «Deshacer» borra `hecho`, `noaplica`, `hechoCon`, `quien` y `cuando`.
- Registro: `RegistroAsunto.auto(a, línea, h)`, como `js/llamadas.js`.
- «Cómo se hace»: campo `como` (texto con saltos de línea) de la tarea en la guía, en la lista común y en el asunto, igual que `tipoDocumento` y `aQuien` de la fila 659; viaja con la marca de la guía (fila 660).
- «A quién» / «De quién»: reutilizar `aQuien` de la 659 ampliando sus claves con `tutorDocente`, `direccion`, `jefatura` y `secretaria` (hoy `PAPELES` de `js/guias-toca.js`: `tutor` es la familia). Los nombres de alumno, familia y tutor salen de donde ya los saca «Apuntar llamada» (`js/llamadas-personas.js`); el del tutor docente, del listado de unidades del Centro de datos si ya lo tiene la app; si no, solo «Tutor/a».
- Una versión anterior de la app no debe borrar `como`, `hechoCon` ni `falta` al guardar (comprobarlo como en la 651 y la 659).
- Textos: `js/ayudas-rotulos.js`, `js/ayudas-textos.js` y `docs/VOCABULARIO.md`.
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- Las tareas de Grabar o cambiar datos, Entregar, Recoger y Comprobar no tienen casilla; las de Publicar, Cobrar o pagar, Archivar y las demás acciones, sí.
- «Grabado» enseña los pasos de «Cómo se hace» y «Copiar los pasos»; sin pasos, el texto que lo dice; guardar en blanco la deja hecha.
- «Entregado» propone la persona del «A quién» de la guía; se puede cambiar; la línea verde y el Registro dicen a quién y la fecha.
- «Recogido», igual con «De quién».
- «Falta algo» deja la tarea sin hacer, en rojo, con la nota; «Está bien» después la marca hecha.
- «Deshacer» en el menú ⋮ de una tarea hecha o con «No aplica» la deja sin hacer; queda en el Registro.
- «Cómo se hace» escrito en «Cambiar» sale plegado debajo de la tarea, con los pasos numerados; vacío, no sale.
- Con la marca de la guía encendida, «Cómo se hace» y «A quién» llegan a la guía del tipo.
- Consola sin errores.

## Qué mirar al terminar

- En un asunto con una tarea «Grabar o cambiar datos», abre «Cambiar», escribe la ruta de Séneca en «Cómo se hace» y pulsa «Grabado».
- En una tarea «Entregar», pulsa «Entregado» y mira la línea verde y el Registro.
- En una tarea «Comprobar», pulsa «Falta algo» y después «Está bien».
- Abre el menú ⋮ de una tarea hecha y pulsa «Deshacer».

## Revisión y respuestas durante el trabajo

- 15-nov-2026, revisor independiente (sin ver el código), APROBADA, sobre la copia de pruebas local:
  - Coincide: sin casilla en Grabar, Entregar, Recoger y Comprobar, con casilla en Publicar, Cobrar, Archivar, Llamar y Otra cosa; «Grabado» (sin pasos: el aviso; en blanco la deja hecha); «Entregado» y «Recogido» con la lista de siete personas y la línea verde; «Está bien» y «Falta algo» (rojo, «Falta: …», Registro); «Deshacer» en el menú ⋮ solo en las tareas sin casilla; «Cómo se hace» plegado y numerado, escrito en «Cambiar» y ausente en «+ Añadir tarea»; «A quién» / «De quién» con siete opciones y «Llamar» con sus cuatro; la ventana propone la persona de la tarea; cancelar y Escape no marcan; consola sin errores; pantallas principales y crear/archivar un asunto, bien.
  - No lo pudo ver el revisor, y lo comprueba la prueba `pruebas/acciones-que-hacen-algo-1.mjs` (en verde): la ventana de «Grabado» con pasos y «Copiar los pasos», el Registro de «Entregado a Dirección» con nota y «Deshacer» de las otras clases (mismo código).
  - Lo que la app hace y el texto no pide: la línea verde de «Está bien» («✔ Comprobado: está bien · fecha · quién»); «Falta algo» pide texto (no deja guardar en blanco, porque es la propia nota); en «Cambiar» de cualquier tarea sale también «Cómo se hace» (el texto dice «en cualquier tarea»).
- Pasada completa del día: 391 de 394; `relacionados` falla también en `main` sin este cambio (apuntada como IDEA de tropiezo); `donde-se-hace` se actualizó (Recoger ya tiene botón); las otras dos (`copiar-ruta`, `inicio-columnas`) pasan a solas.
