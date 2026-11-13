# 637 — Vista del asunto (1 de 2): cabecera y panel derecho

Primera de las dos tareas del tema 630. La segunda es la 638 (el hito y sus tareas). Las dos tienen que estar hechas antes de que vuelva Diego, que está de permiso unos días.

## Lo que escribió Francisco

Idea 622 (12-nov-2026):

> Me gustaría que miraras la app con la extensión además de mirar el código y que busques vestigios de esta mentalidad primera que creo que ha llenado de elementos la vista general del asunto y la ventana de inicio del asunto. Creo que se puede simplificar llevando esos elementos donde realmente hacen falta en cada momento.

Al ver la vista de hoy (12-nov-2026):

> Tremendamente recargado. No invita a pensar y veo difícil encontrar nada si no te conoces el asunto de memoria. Tampoco veo un flujo de trabajo claro.

## Lo que entendió Claude (acordado con Francisco el 13-nov-2026)

Todo es de la vista de un asunto abierto. Manda la pantalla de prueba, en la cabecera, la fila de hitos y la columna derecha. La columna izquierda (el hito) no se toca en esta tarea: es la 638.

La cabecera:
- Una sola línea: «← Volver», el tipo, el número del asunto y el tercero (nombre e identificación). El nombre de la carpeta deja de ser el título.
- A la derecha de esa línea, a la vista: «Ruta» y «Archivar el asunto».
- Un menú «⋯» con: Cambiar el asunto, Índice del expediente, Marcar como reservado, copiar (Asunto, NIE o DNI, Nombre) y Borrar el asunto.
- Debajo, la fila de hitos con el actual marcado y «+ Añadir hito» al final.
- Desaparecen: la etiqueta «Hito 2 de 4 · …», el número repetido, los botones «El encargo» y «Elegir datos», la fila de botones de copiar y la línea «Abierto el…».

La columna derecha:
- Desaparecen las seis pestañas (Trabajo, Datos y contacto, Campos del asunto, Registro, Otros asuntos de este tercero, Personas y entidades relacionadas). La vista es siempre la misma: el hito a la izquierda y, a la derecha, cinco bloques plegados.
- Los cinco bloques, cada uno con su icono y en este orden: Datos, Personas y entidades relacionadas, Documentos de la carpeta, Registro, Otros asuntos de este tercero. Los que llevan cuenta la enseñan plegados.
- «Datos» junta lo que hoy son «Datos y contacto», «Campos del asunto» y «El encargo». Plegado, enseña la línea de datos elegidos, cada uno con su botón de copiar. Abierto, tres recuadros: la persona (con «Ver todo» y «Elegir qué se ve plegado», que sustituye a «Elegir datos»), «Contacto» y «Campos de este asunto» (con «+ Añadir campo»). Al pie, «Abierto el… · quién».
- Según la clase de tercero cambian el título y lo de dentro de los dos primeros recuadros: alumnado, «La alumna» o «El alumno»; personal y tutor legal, «La persona»; empresa, «La empresa»; Administración, «El organismo»; grupo, «El grupo», sin «Contacto».
- «Quién lo pide» y «Por qué vía» no tienen recuadro ni ventana propia («El encargo» desaparece): salen dentro de «Campos de este asunto», solo si están rellenos o si el tipo los pide.
- «Registro» es el del asunto, con su hueco para escribir una nota arriba.
- Al pulsar un documento se ve a la derecha, como hoy, y tapa toda la columna derecha; el hito sigue a la izquierda. «← Volver» lo cierra.

## Pantalla de prueba

- Aprobada el 13-nov-2026: `docs/pantallas/630.html` · https://claude.ai/artifact/KwnBtqfZxgRDkvV5Qn1v1w
- De ella, en esta tarea: la cabecera, la fila de hitos y la columna derecha. La columna izquierda es de la 638.

## Qué NO se hace en esta tarea

- El hito y sus tareas, el asunto sin hitos, la pregunta «¿De qué tarea es?» y la marca «sin tarea»: fila 638. Hasta entonces, «Documentos de la carpeta» conserva sus botones de hoy.
- Elegir hito y tarea al clasificar un documento de la bandeja: idea 634.
- La marca única para llevar o no los cambios a la guía: idea 635.
- No se cambia nada de lo que hacen las ventanas que se abren desde aquí (Cambiar el asunto, Archivar, Índice, Ver todo, Añadir relacionado…): solo desde dónde se abren.

## Notas técnicas de Claude

- La ficha: `js/ficha-asunto.js`, `js/ficha-bloques.js`, `js/ficha-menus.js`, `js/ficha-nombre-acciones.js` (copiar), `js/ficha-tarjetas*.js` (las pestañas, fila 425), `js/ficha-datos-favoritos.js` («Elegir datos»), `js/ficha-tercero*.js`, `js/ficha-persona*.js`, `js/lo-pide.js` («El encargo»), `js/ficha-documentos*.js`, `js/ficha-trabajo-visor.js` (el documento a la derecha). Leer antes `docs/contexto/ASUNTOS.md` («La ficha en pestañas») y `docs/contexto/PANTALLA.md`.
- Lo que hoy pinta cada pestaña se reutiliza dentro de su bloque plegado; no se reescribe. Qué bloques están abiertos se recuerda mientras no se salga del asunto.
- «Quién lo pide» y «Por qué vía» ya son campos de la lista única desde la fila 629: aquí solo se pintan con los demás campos y se cambian como ellos.
- El asunto que copia «Asunto» es el que compone la app (fila 627), no el nombre de la carpeta.
- Asunto archivado y «solo consulta»: la misma vista, sin lo que escribe, como hoy.
- Repasar todos los textos y pruebas que nombran las pestañas o «El encargo». Línea en `js/novedades.js`. Al terminar, poner al día `docs/contexto/ASUNTOS.md`, `docs/contexto/QUE-ESTA-HECHO.md` y `docs/VOCABULARIO.md`.

## Cómo lo comprueba el segundo revisor

- Cabecera de un asunto de alumno: una línea con «← Volver», tipo, número y «Apellidos, Nombre + identificación»; a la derecha «Ruta» y «Archivar el asunto»; el nombre de la carpeta no sale como título.
- El menú «⋯» trae, en este orden: Cambiar el asunto, Índice del expediente, Marcar como reservado, Copiar (Asunto, NIE, Nombre) y Borrar el asunto; cada uno abre o hace lo de hoy.
- No salen: «Hito N de M · …», «El encargo», «Elegir datos», la fila de copiar ni «Abierto el…» en la cabecera.
- Fila de hitos con el actual marcado y «+ Añadir hito»; pulsar un hito lo enseña a la izquierda.
- No hay pestañas. A la derecha, cinco bloques plegados en el orden dicho; cada uno se abre y se pliega al pulsarlo.
- «Datos» plegado enseña la línea de datos con sus botones de copiar; abierto, los tres recuadros, «Ver todo», «Elegir qué se ve plegado», «+ Añadir campo» y «Abierto el…» al pie.
- Un asunto de empresa, uno de Administración y uno de grupo: títulos «La empresa», «El organismo» y «El grupo»; el de grupo, sin «Contacto».
- «Quién lo pide» y «Por qué vía»: salen en «Campos de este asunto» en un asunto que los tiene rellenos y no salen en uno que no los tiene ni los pide su tipo.
- Pulsar un documento de la carpeta: se ve a la derecha tapando los cinco bloques; el hito sigue a la izquierda; «← Volver» lo cierra.
- Escribir una nota en «Registro»: queda la primera de la lista.
- La colocación coincide con `docs/pantallas/630.html` en la cabecera y la columna derecha.

## Qué mirar al terminar

- Abre un asunto: la cabecera es una línea, y a la derecha hay cinco bloques plegados en vez de pestañas.
- Abre «Datos»: la persona, el contacto y los campos del asunto, juntos.
- Abre el menú «⋯» y copia el asunto.
- Pulsa un documento de la carpeta y mira que el hito sigue a la izquierda.
- Abre un asunto de una empresa y mira el bloque «Datos».

## Revisión y respuestas durante el trabajo

- **Revisión (13-nov-2026, segundo revisor, ayudante aparte con la demo en Chromium).** Coincide: cabecera de una línea con «← Volver», tipo, número y tercero, y «Ruta» y «Archivar el asunto» a la derecha, sin la carpeta como título; el menú «⋯» en su orden y cada opción hace lo de hoy; no salen «Hito N de M», «El encargo», «Elegir datos», la fila de copiar ni «Abierto el…» en la cabecera; fila de hitos con el actual marcado y «+ Añadir hito», y pulsar un hito lo enseña; sin pestañas y cinco bloques plegados en su orden que se abren y se pliegan; «Datos» plegado con la línea y su ⧉, abierto con sus tres recuadros, «Ver todo», «Elegir qué se ve plegado», «+ Añadir campo» y «Abierto el…» al pie; «La empresa», «El grupo» (sin «Contacto»), «La persona», «El alumno»/«La alumna»; «Quién lo pide» y «Por qué vía» solo con datos; el documento tapa los bloques y «← Carpeta» lo cierra; una nota de «Registro» queda la primera; consola sin errores; archivado y tipo sin guía abren bien; a 1000 px no hay desbordes.
- No lo he podido ver: «El organismo» (la demo no tiene asuntos de Administración) y «el tipo los pide aunque estén vacíos» (ningún tipo de la demo pide «Quién lo pide» ni «Por qué vía»); ambos los cubre el código y no se han probado en pantalla.
- Lo que el revisor señaló y no coincide con el texto, y qué se decidió (Claude, sin cambiar lo que el texto pide):
  - «Esperando a…» y el plazo del asunto («Venció hace N días») siguen a la derecha de la fila de hitos (`#ficha-acciones`). El texto y la pantalla de prueba no dicen dónde van; para no perder esas dos funciones se dejan ahí hasta que la 638 los lleve al hito. **Para Francisco: confirmar o decir dónde van.**
  - Los bloques «La actividad» (asuntos de actividad extraescolar) y «Candidaturas» (elecciones) salen delante de «Datos»: eran pestañas aparte y el texto no los nombra; se conservan como bloques.
  - «Quién lo pide» y «Por qué vía» llevan un botón «Cambiar» que abre el cuadro «El encargo» de siempre: sin él no habría forma de cambiarlos al desaparecer el botón de la cabecera.
  - Se quitó también el botón «← Hitos» de la fila de hitos (no está en la pantalla de prueba); la lista de hitos sigue con Escape.
  - De fábrica, la línea plegada de «Datos» en alumnado lleva NIE, curso y unidad (antes de «Elegir datos» solo la unidad).
  - Sin cambios por ser de la 638 o previos: el aviso amarillo del sello de registro entre cabecera y hitos; asuntos sin hitos o con todos hechos no llevan fila de hitos; la columna izquierda repite Campos, Documentos y Registro.
  - Contadores: salen en Documentos, Registro (tras haber notas), Personas y Otros asuntos cuando hay; plegado, «Registro» no enseña la última entrada (el texto solo pide la cuenta).
- Errores que se arreglaron tras el revisor y las pruebas: los botones «+ Añadir documento», «Generar documento» y «Repartir» no salían en «Documentos de la carpeta»; «Ver todo» y las opciones de copiar del menú «⋯» se apagaban en solo consulta.
