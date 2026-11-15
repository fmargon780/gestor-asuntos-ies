# 672 — Acciones que hacen algo (2 de 2): Publicar, Cobrar o pagar y Archivar

Segunda de las dos partes del tema 665. Va detrás de la 671, que pone la ventana, «Deshacer» y quita la casilla: esta parte solo añade tres acciones a lo que ya hace aquella.

## Lo que escribió Francisco

Ideas 654 y 655 (14-nov-2026, apartadas del tema 650), dentro del tema 665:

> Que la acción «Publicar» de una tarea haga algo propio al usarla, además de clasificar. Qué hace, por decidir al diseñarla.

> Que la acción «Cobrar o pagar» de una tarea haga algo propio al usarla, además de clasificar. Qué hace, por decidir al diseñarla.

Durante el diseño (14-nov-2026): «Archivar» entra también en el tema (opción 1); «Entiendo que los distintos lugares del archivo documental los podremos poner a nuestro gusto en algún lugar, no?». La casilla desaparece (opción 2), con todos los datos opcionales.

## Lo que entendió Claude (acordado con Francisco el 14-nov-2026)

Todo lo común de la 671 vale aquí: sin casilla, ventana con datos opcionales, línea verde con fecha y quién, línea en el Registro, «Deshacer» y «No aplica».

**«Publicar»:** botón «Publicado».
- Pide «Publicado el» (hoy), «Expuesto hasta» (fecha) y nota.
- Con «Expuesto hasta», ese día sale un aviso entre los avisos de Inicio («Termina la exposición de …», con el asunto).
- Línea verde: «Publicado hasta el 24-nov-2026 (aviso ese día) · 14-nov-2026 · Francisco».

**«Cobrar o pagar»:** botón «Apuntar cobro o pago».
- Pide «Cobro» o «Pago», importe en euros, forma (Efectivo, Tarjeta, Transferencia), fecha y nota.
- Línea verde: «Cobro de 1,12 € · Efectivo · 14-nov-2026 · Francisco».

**«Archivar»:** botón «Archivado».
- Pide «Dónde queda el papel», un detalle libre (por ejemplo «caja 2025-26»), fecha y nota.
- «Dónde queda el papel» se elige de los sitios y sus zonas; propone el «Dónde se hace» de la tarea. Debajo, «Ver todos los sitios…» abre la ventana «Sitios» de la fila 659, donde se crean las zonas del archivo (por ejemplo «Archivo del centro · Armario 2» o «Expediente del alumno · Archivador 1º Bachillerato»).
- Línea verde: «Archivado en Archivo del centro · Armario 2 · caja 2025-26 · 14-nov-2026 · Francisco».

**Lo que desaparece:** la casilla de las tareas de estas tres acciones.

## Pantalla de prueba

- Aprobada el 14-nov-2026: `docs/pantallas/665.html` · https://claude.ai/artifact/2B98byXjiSvEN1HhC1nehA. De esta parte salen de ella las tareas de Publicar, Cobrar y Archivar.

## Qué NO se hace en esta tarea

- Lo de la 671 (ventana, «Cómo se hace», «Deshacer», Grabar, Entregar, Recoger, Comprobar).
- Ninguna cuenta ni listado de cobros: lo apuntado se queda en el asunto.

## Notas técnicas de Claude

- Ampliar la lista de acciones sin casilla de la 671 con `publicar`, `cobrar` y `archivar`, y la ventana de `js/tarea-hecha-ventana.js` (o como se llame en la 671) con sus campos. `hechoCon` gana `hasta`, `cobroPago`, `importe`, `forma`, `donde` (`{ sitio, zona }` por `id`, como la 659) y `detalle`.
- Aviso de «Expuesto hasta»: por el mecanismo de avisos con fecha que ya usa Inicio (`js/avisos.js` y vecinos); no es una nota del tablón de notas (`js/tablon.js`). Al «Deshacer», el aviso desaparece.
- Importe: se escribe con coma decimal y se guarda como número; se enseña con dos decimales y «€».
- «Ver todos los sitios…»: `js/sitios-ventana.js`, abierta como desde «Dónde se hace»; al volver, la zona elegida queda en «Dónde queda el papel».
- Una versión anterior de la app no debe borrar los campos nuevos de `hechoCon`.
- Textos: `js/ayudas-rotulos.js`, `js/ayudas-textos.js` y `docs/VOCABULARIO.md`. Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- Las tareas de Publicar, Cobrar o pagar y Archivar no tienen casilla.
- «Publicado» con «Expuesto hasta» en una fecha: la línea verde lo dice; ese día (cambiando la fecha de la copia de pruebas, si se puede) sale el aviso en Inicio; «Deshacer» lo quita.
- «Apuntar cobro o pago»: cobro y pago, importe con coma, forma; la línea verde y el Registro lo dicen.
- «Archivado» propone el sitio de la tarea; «Ver todos los sitios…» abre «Sitios»; una zona nueva creada ahí se puede elegir; la línea verde dice sitio, zona y detalle.
- Guardar en blanco cualquiera de las tres la deja hecha.
- Consola sin errores.

## Qué mirar al terminar

- En Ajustes → El centro → «Sitios», crea las zonas de vuestro archivo dentro de «Archivo del centro» y de «Expediente del alumno».
- En una tarea «Archivar», pulsa «Archivado» y elige una de esas zonas.
- En una tarea «Publicar», pon una fecha en «Expuesto hasta» y mira el aviso ese día en Inicio.
- En una tarea «Cobrar o pagar», apunta un cobro y mira el Registro.

## Revisión y respuestas durante el trabajo

- 15-nov-2026, primer revisor: RECHAZADA (punto «Archivado»: la zona elegida o creada en «Sitios» no quedaba elegida en «Dónde queda el papel»). Arreglado (`alElegir` de la ventana de la tarea pone la opción al volver); prueba nueva en `pruebas/acciones-que-hacen-algo-2.mjs`.
- 15-nov-2026, segundo revisor (nuevo, desde cero): RECHAZADA, un solo MAL: tras «Deshacer» en una tarea «Publicado» con «Expuesto hasta» hoy, el aviso «Termina la exposición de …» seguía en Inicio (no se recalculaba hasta otro repintado). Todo lo demás, BIEN: sin casilla; «Publicado» y su línea verde; el aviso sale con «Expuesto hasta» hoy; cobro y pago con coma, forma y «abc» rechazado; «Archivado» con sitio propio, zona existente y zona nueva elegidas, «Ver todos los sitios…» encima y Escape; en blanco las tres quedan hechas; Cancelar/Escape; las clases de la 671; consola; pantallas; crear y archivar un asunto.
- Qué hace la app que el texto no pide (según el revisor): el desplegable de «Archivado» trae todos los sitios (Correo electrónico, Teléfono, En mano…), no solo los de archivo; el aviso solo se ve con la franja de avisos desplegada.
- Después de la segunda revisión, en la rama `fila-672` (sin pasar a `main`): `TareaHecha.aplicar` y `deshacer` llaman a `AvisosExposicion.pintar()` para quitar o poner el aviso al momento, con prueba (sin recalcular a mano). Esa corrección no la ha visto ningún revisor.
- Estado: DEVUELTA (dos rechazos). `main` no se toca. Para retomar: pasar un revisor nuevo sobre la rama `fila-672` y, si aprueba, fusionarla en `main` y publicar.
