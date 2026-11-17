# 699 — El asunto sin hitos: lista de tareas y panel

Parte del tema 692 (el molde nuevo). Va detrás de la fila 698.

## Lo que escribió Francisco
«En las tareas se "hacen" cosas, en los hitos se informa de cosas.»

«Me parece muy buena tu propuesta.» (la tarea es una frase, un estado y, si trata de uno, un papel)

De «+ Añadir tarea» en una línea: «Sí, me vale.»

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- En los Ajustes de un tipo de asunto hay una casilla nueva: **«Sin hitos: el asunto es una lista de tareas»**. Solo cambian los asuntos que se creen después de ese tipo. Los asuntos ya abiertos y los tipos sin la casilla siguen exactamente como hoy.
- Un asunto de un tipo «sin hitos» no tiene fila de hitos, ni «Marcar como hecho», ni «Hito ▾». Debajo de la cabecera enseña, como en la pantalla de prueba:
  - **El panel**, una franja que dice en qué situación está: «Ahora toca: <la primera tarea sin hacer>. Le toca a Administración.» o «Listo para cerrar. Todas las tareas están hechas.», con el botón «Cerrar el asunto». A la derecha, «N de M tareas hechas».
  - **La lista de tareas.** Cada tarea es una frase con su casilla. Al marcarla queda tachada con quién y qué día («Francisco · 17-nov»). Se puede desmarcar.
  - **«+ Añadir tarea»**, en una línea al final: se escribe la frase y se pulsa «Añadir» o Intro. No se abre ninguna ventana. La tarea añadida lleva la marca «solo aquí».
- Lo que se añade o se cambia en el asunto se queda en el asunto: no hay casilla «Los cambios… van también a la guía».
- El ⋮ de cada tarea ofrece «Anotar», «Cambiar» y «Borrar».
- La cabecera no cambia: «Generar documento ▾», «Enviar ▾», el teléfono, «Ruta», el plazo del asunto y «Cerrar el asunto» siguen como hoy. Los cinco bloques plegados (Datos, Personas y entidades relacionadas, Documentos de la carpeta, Registro, Otros asuntos de este tercero) siguen como hoy.
- El plazo es del asunto: una sola fecha límite. Las tareas no llevan plazo ni responsable.
- «Cerrar el asunto» con tareas sin hacer avisa de cuántas quedan y deja seguir.
- Desaparecen de la tarea, en estos asuntos: «Qué se hace» (las diecisiete acciones), «Dónde se hace», «A quién» y «Qué documento».

**No estaba en la pantalla de prueba; lo propuso Claude y Francisco lo aprobó el 17-nov-2026 («1»):**
- Al marcar la casilla en un tipo que ya tiene guía con hitos, esa guía se guarda sin usarse y vuelve si se desmarca. Los asuntos nuevos nacen con la lista de tareas vacía hasta la fila 701.
- «Anotar» escribe una nota corta que se ve debajo de la tarea; «Cambiar» cambia la frase; «Borrar» pide confirmación.
- Un documento se guarda o se añade en estos asuntos sin decir de qué tarea es (regla del 16-nov-2026, idea 680).
- En «solo consultar» y para un directivo, la lista se ve pero no se puede marcar ni añadir.

## Pantalla de prueba
- Aprobada el 17-nov-2026: `docs/pantallas/692.html` · https://claude.ai/artifact/HyjmGcwogUBkAmwcq6TEwV

## Qué NO se hace en esta tarea
- Cómo sale el asunto en Inicio: fila 700.
- La guía del tipo y «Cambiar la guía…»: fila 701.
- «Esperando a…»: fila 702.
- La tarea con papel y el desplegable de papel en «+ Añadir tarea»: fila 703.
- Los rótulos: fila 706.
- Una explicación de «cómo se hace» dentro de la tarea: no está en la pantalla aprobada; queda por hablar (`docs/notas-diseno/692.md`).

## Notas técnicas de Claude
- Leer antes `docs/notas-diseno/692.md` («Lo visto en el código») y `docs/notas-diseno/692-documentos.md`. Reglas del plan (`docs/PLAN-2026-11.md`): lo nuevo se añade, no sustituye; un asunto con hitos y un tipo sin la marca no cambian en nada.
- Cambios quirúrgicos: se tocan solo los ficheros nombrados aquí y los nuevos. Ficheros nuevos por debajo de 400 líneas, apuntados en su lista `js/cargar-piezas-N.js`. Una sola tanda de pruebas al final.
- Colores, letras y botones, los de la app; la pantalla de prueba solo dice qué hay y dónde va.
- La marca del tipo: `js/ajustes-tipo.js` (sección de casillas del tipo) y `tipos.json`. Un nombre: `sinHitos`.
- Nacimiento: `Hitos.crearDesdeGuia` (`js/hitos.js`), enganchado a `App.anotar`. Para un tipo `sinHitos` no se copian hitos.
- Dónde viven las tareas del asunto: hoy la tarea no existe sin hito (todas las funciones reciben `(asunto, hito, tarea)`). Decide la sesión entre un hito oculto único por asunto (lo más barato: `guionPropio`, `guionHecho` y `guionOrden` siguen valiendo) o una lista propia en la ficha. Sea cual sea, ninguna pantalla puede enseñar ese hito.
- Pantalla: `HitoMesa.aplicar` (`js/hito-mesa.js`) y `HitoMesaGuion.pintar` (`js/hito-mesa-guion.js`). Para `sinHitos`, un fichero nuevo `js/asunto-sin-hitos.js` (panel, lista y línea de añadir), enganchado por `window.Gestor.alRefrescar` o un punto nuevo; no envolver.
- Lo que cuelga hoy de la tarea (llamadas, documento colgado, copiar a otra carpeta) no se ofrece en estas tareas en esta fila.
- Guardar por `Hitos.cambiar` / `ColaGuardado`; repintar con `U.conservandoLoEscrito`. Añadir la línea a `js/novedades.js`.
- Prueba nueva con la demostración: un tipo marcado «sin hitos», crear asunto, añadir, marcar, desmarcar, cerrar.

## Cómo lo comprueba el segundo revisor
- En Ajustes de un tipo está la casilla «Sin hitos: el asunto es una lista de tareas».
- Un asunto nuevo de ese tipo no enseña fila de hitos, «Marcar como hecho» ni «Hito ▾».
- El panel dice «Ahora toca: …» con la primera tarea sin hacer, y «Listo para cerrar» con todas hechas; la cuenta «N de M tareas hechas» es correcta.
- «+ Añadir tarea» añade con Intro y con «Añadir», sin ventana, y la tarea lleva «solo aquí».
- La tarea marcada enseña quién y qué día; se puede desmarcar.
- No hay casilla de llevar los cambios a la guía.
- El ⋮ ofrece «Anotar», «Cambiar» y «Borrar», y los tres funcionan.
- «Cerrar el asunto» con tareas sin hacer avisa y deja seguir.
- La cabecera y los cinco bloques son los de hoy.
- Un asunto con hitos, y uno ya abierto del tipo marcado, se ven como antes.
- Qué hace la app que este texto no pide.

## Qué mirar al terminar
- Ajustes › tipo AULA DE CONVIVENCIA (o uno de prueba): marcar «Sin hitos».
- Crear un asunto de ese tipo, añadir tres tareas, marcar una y mirar el panel.
- Abrir un asunto con hitos y ver que está como siempre.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
