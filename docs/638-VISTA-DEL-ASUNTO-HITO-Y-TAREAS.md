# 638 — Vista del asunto (2 de 2): el hito y sus tareas

Segunda de las dos tareas del tema 630. Va detrás de la 637 (cabecera y panel derecho). Las dos tienen que estar hechas antes de que vuelva Diego.

## Lo que escribió Francisco

Idea 622 (12-nov-2026):

> Me gustaría que miraras la app con la extensión además de mirar el código y que busques vestigios de esta mentalidad primera que creo que ha llenado de elementos la vista general del asunto y la ventana de inicio del asunto. Creo que se puede simplificar llevando esos elementos donde realmente hacen falta en cada momento.

Durante el diseño (12 y 13-nov-2026):

> Creo que en la tarea es necesario [ver los documentos] para poder usarlos en las acciones que esas tareas conlleven.

> El hito pasaría a ser una mera estructura a la que colgar tareas. […] Tarea y acción son casi sinónimos.

> [De «Dejarlo solo informativo» y «Enviar estado»:] No recuerdo haberlos usado nunca.

> Yo obligaría a crear el hito y la tarea también para poder añadir un documento al asunto.

> [Del fichero sin tipo:] Crear una tarea nueva, sí. Que le ponga ese nombre, no.

## Lo que entendió Claude (acordado con Francisco el 13-nov-2026)

Todo es de la columna izquierda de la vista del asunto (el hito) y de «Documentos de la carpeta». Manda la pantalla de prueba.

El hito:
- En el hito no queda ningún botón suelto: desaparecen «Generar documento ▾», «Comunicar ▾» y «Hacer este hito». Todo documento y toda comunicación salen de una tarea. La siguiente tarea pendiente va resaltada, con su botón.
- Arriba del hito: su nombre, «Marcar como hecho» (solo en el hito actual) y el menú «Hito ▾» con Cambiar, Borrar y Cambiar la guía… Se quitan de ese menú «Dejarlo solo informativo» (sigue en la guía del tipo) y «Enviar estado».
- Una línea debajo: «Hito actual · En curso · plazo». El plazo se pulsa ahí mismo, como hoy, para ponerlo, cambiarlo o quitarlo. En un hito que no es el actual, «Hecho» o «Sin empezar».
- «Esperando a…» va en esa línea, a la vista, solo en el hito actual. En espera, la línea dice «Esperando a … desde el …» y lleva al lado «Ya ha llegado». La ventana y lo que hace, los de hoy.
- El responsable no se enseña cuando el hito es de Administración; si es de otro, la línea dice «Le toca a: …». Se cambia en «Hito ▾ → Cambiar». En esta pantalla deja de verse si es de Francisco o de Diego; en el resto de la app el responsable sigue como hoy.
- Debajo, la explicación del hito y sus tareas. Desaparecen los recuadros «Tareas», «Campos», «Documentos» y «Registro» del hito.
- Hito sin tareas: su explicación, «Este hito no tiene tareas», «Marcar como hecho» (si es el actual) y «+ Añadir tarea».

Las tareas:
- Cada tarea: su casilla, su nombre, qué se hace (Generar documento, Firmar, Registrar, Comunicar, Añadir documento, Pedir datos, o nada), su único botón y el menú «⋮» de hoy.
- Su documento va colgado debajo, con «Ruta» y «Extracto» (y el número de registro, si lo tiene). Pulsarlo lo enseña a la derecha.
- Los datos que pide una tarea salen bajo esa tarea, en un desplegable «Datos». Los demás datos del asunto están en el bloque «Datos» de la derecha.
- El botón de registrar o comunicar un documento que aún no existe sale apagado, con la línea «Saldrá aquí al generar…».
- «+ Añadir tarea» abre el formulario (nombre y qué se hace), que ya no está siempre abierto. Al añadirla, la tarea queda en la lista y nada más; no se abre ninguna ventana. Después se pulsa su botón.
- Las notas y lo hecho en cada hito se apuntan en el único registro, el del asunto (bloque «Registro» de la derecha); cada línea dice de qué hito es.

Asunto sin hitos:
- El centro sigue con su mensaje de hoy, «+ Añadir el primer hito» y «Escribir la guía de <tipo>», y debajo la línea «Para generar, comunicar o añadir un documento, crea antes el hito y su tarea».
- Desaparece el «Comunicar» de arriba. No se enseña la fila de hitos.
- «+ Añadir el primer hito» abre la ventana «Crear un hito» de hoy, sin cambios.

Añadir un documento:
- En «Documentos de la carpeta» ya no hay «Generar documento».
- «+ Añadir documento» de «Documentos de la carpeta»: tras la ventana de hoy (fichero y tipo), la app pregunta «¿De qué tarea es?». Sale elegido el hito actual, con sus tareas que esperan un documento; la última opción es «Tarea nueva: «<tipo de documento>»», que la app crea en ese hito con el nombre del tipo y deja hecha. Si no hay tareas que esperen, solo «Tarea nueva». Se puede elegir otro hito. «Cancelar» no añade nada.
- El botón «Añadir documento» de una tarea no pregunta: ya se sabe de qué tarea es.
- Un fichero que llega solo a la carpeta (copiado desde el ordenador, sin la app) y los documentos de antes que no cuelgan de ninguna tarea salen en «Documentos de la carpeta» con la marca «sin tarea» y el botón «Colgar de una tarea», que abre la misma pregunta (con «Colgar» en vez de «Añadir»). Nadie está obligado a pulsarlo.
- Si ese fichero no tiene tipo ni nombre según la norma, «Colgar de una tarea» abre antes la ventana «Cambiar el nombre» de hoy; después, la pregunta. La tarea nueva se llama como el tipo, nunca como el fichero.
- En un asunto sin hitos, «+ Añadir documento» sale apagado, con la línea «Para añadir un documento, crea antes el hito».
- Al colgar un documento, la marca «sin tarea» desaparece y se apunta en el registro.

## Pantalla de prueba

- Aprobada el 13-nov-2026: `docs/pantallas/630.html` · https://claude.ai/artifact/KwnBtqfZxgRDkvV5Qn1v1w
- De ella, en esta tarea: la columna izquierda, el asunto sin hitos (botón «Ver un asunto sin hitos» de la franja de arriba, que es solo de la prueba), la pregunta «¿De qué tarea es?» y «Documentos de la carpeta».
- En la prueba, las ventanas de hoy (Crear un hito, Cambiar el nombre, elegir fichero y tipo, registrar, correo) no se pintan: un aviso dice que se abren.

## Qué NO se hace en esta tarea

- Elegir hito y tarea al clasificar un documento de la bandeja: idea 634. La bandeja y «Ver todo» siguen como hoy; lo que metan sin tarea sale «sin tarea».
- La marca única para llevar o no los cambios de hitos y tareas a la guía: idea 635. «Solo para este asunto», «Pasar a la guía» y la franja del orden siguen como hoy.
- Ordenar la lista de «Qué se hace» y ponerle buscador: idea 636.
- No se obliga a colgar los documentos «sin tarea» ni se cuelgan solos los de antes.
- No se cambia la guía del tipo ni su editor.
- El responsable no se quita de «Qué me toca», Inicio ni la guía.

## Notas técnicas de Claude

- El hito abierto es la mesa: `js/hito-mesa*.js`, `js/hitos-panel*.js`, `js/hitos-guion*.js`, `js/hacer-este-hito.js`, `js/hito-mesa-comunicar.js`, `js/ficha-generar-documento.js`, `js/hitos-documentos.js`, `js/hitos-documento-menu.js`, `css/hito-mesa.css`. Leer antes `docs/contexto/HITO-MESA.md` y `docs/contexto/HITOS-Y-GUIAS.md`. La regla de los cuatro recuadros (fila 553, `docs/553-PARTES-DEL-HITO.md`) queda sustituida.
- Casi todo existe: cada tarea de generar o comunicar ya lleva su botón (fila 410), el documento ya cuelga de su tarea (fila 522, `TareasConDocumento`), «Firmar» se marca sola (fila 523), «Pedir datos» ya tiene sus campos (fila 530) y «Qué se hace» ya se elige al añadir una tarea «solo aquí» (fila 522). Aquí se recoloca y se quita lo suelto.
- «Sin tarea» es un documento de la carpeta que ninguna tarea de ningún hito tiene colgado. Se calcula al pintar; no se guarda una marca aparte.
- «Tarea nueva» es una tarea «solo aquí» con «Añadir un documento», creada ya hecha y con el documento colgado. Las tareas «que esperan un documento» son las de «Añadir un documento» sin hacer y sin documento.
- Las notas de hito que ya existen se enseñan en el registro del asunto con su hito; no se migran datos.
- Todo cuadro nuevo, con la regla común (`.capa > .cuadro`, `U.preguntar`); guardados por `ColaGuardado`; nada de fondo escribe en «solo consulta».
- Repasar todos los textos y pruebas que nombran «Hacer este hito», los recuadros del hito, «Enviar estado» o «Generar documento» de la carpeta. Línea en `js/novedades.js`. Al terminar, poner al día `docs/contexto/HITO-MESA.md`, `docs/contexto/DOCUMENTOS.md`, `docs/contexto/QUE-ESTA-HECHO.md` y `docs/VOCABULARIO.md`.

## Cómo lo comprueba el segundo revisor

- Hito actual con tareas: arriba solo su nombre, «Marcar como hecho» y «Hito ▾»; no hay «Generar documento ▾», «Comunicar ▾» ni «Hacer este hito»; no hay recuadros «Tareas», «Campos», «Documentos» ni «Registro».
- «Hito ▾» trae Cambiar, Borrar y Cambiar la guía…, y no «Dejarlo solo informativo» ni «Enviar estado».
- La línea del hito: «Hito actual · En curso · plazo»; pulsar el plazo lo pone y lo quita; «Esperando a…» pone la espera y la línea pasa a «Esperando a … desde el …» con «Ya ha llegado», que la quita.
- Un hito de Administración no dice a quién le toca; uno de otro responsable dice «Le toca a: …». No se ve si es de una persona u otra de Administración.
- Un hito que no es el actual no tiene «Marcar como hecho» ni «Esperando a…».
- La siguiente tarea pendiente sale resaltada, con su botón; pulsarlo abre la ventana de hoy de esa acción.
- Generar un documento desde su tarea: queda colgado bajo la tarea con «Ruta» y «Extracto», la tarea queda hecha y el documento sale también en «Documentos de la carpeta». Las tareas de registrar y comunicar ese documento pasan de apagadas a encendidas.
- «+ Añadir tarea» abre el formulario; al añadir, la tarea queda en la lista y no se abre nada más; «Cancelar» lo cierra.
- Hito sin tareas: explicación, «Este hito no tiene tareas» y «+ Añadir tarea».
- Asunto sin hitos: mensaje, «+ Añadir el primer hito», «Escribir la guía de <tipo>» y la línea de aviso; sin «Comunicar»; «+ Añadir documento» apagado con su línea. Tras crear el primer hito, se enciende.
- «+ Añadir documento» de la carpeta: tras elegir fichero y tipo, pregunta «¿De qué tarea es?» con el hito actual elegido; con una tarea que espera documento, sale la primera y «Tarea nueva» la última; al cambiar de hito cambian las tareas; «Cancelar» no añade nada.
- Eligiendo «Tarea nueva»: aparece en ese hito una tarea hecha con el nombre del tipo y el documento colgado, y una línea en el registro.
- El botón «Añadir documento» de una tarea no hace la pregunta.
- Un fichero copiado a mano a la carpeta: sale con «sin tarea» y «Colgar de una tarea»; al pulsarlo, primero «Cambiar el nombre» y después la pregunta; la tarea nueva lleva el nombre del tipo; la marca desaparece.
- En «Documentos de la carpeta» no hay «Generar documento».
- El registro del asunto dice de qué hito es cada línea.
- La colocación coincide con `docs/pantallas/630.html` en la columna izquierda.

## Qué mirar al terminar

- Abre un asunto con guía: el hito trae solo sus tareas, y la siguiente va resaltada con su botón.
- Genera el documento desde su tarea y mira que queda colgado debajo.
- Pulsa «+ Añadir tarea», añade una y pulsa su botón.
- En «Documentos de la carpeta», pulsa «+ Añadir documento» y contesta «¿De qué tarea es?» con «Tarea nueva».
- Copia un fichero a la carpeta de un asunto desde el ordenador y mira que sale «sin tarea»; cuélgalo de una tarea.
- Abre un asunto sin hitos y mira que no deja añadir documentos hasta crear el hito.

## Revisión y respuestas durante el trabajo

- **Revisión (13-nov-2026, segundo revisor, ayudante aparte con la demo en Chromium).** Coincide: arriba del hito solo nombre, «Marcar como hecho» y «Hito ▾» (Cambiar, Borrar, Cambiar la guía…, sin «Dejarlo solo informativo» ni «Enviar estado»); sin «Generar documento ▾», «Comunicar ▾», «Hacer este hito» ni los recuadros Tareas, Campos, Documentos y Registro; la línea «Hito actual · En curso · plazo» con el plazo que se pone y se quita, «Esperando a…» → «Esperando a … desde el …» y «Ya ha llegado»; responsable de Administración sin «Le toca a», otro con «Le toca a: …»; hito no actual sin «Marcar como hecho» ni «Esperando a…»; siguiente tarea resaltada con su botón; generar desde la tarea cuelga el documento con «Ruta» y «Extracto», la tarea queda hecha y el documento sale en la carpeta, y registrar y comunicar pasan de apagados a encendidos; «+ Añadir tarea» con formulario y sin ventana al añadir; hito sin tareas; asunto sin hitos (mensaje, «+ Añadir el primer hito», «Escribir la guía de <tipo>», línea de aviso, sin «Comunicar», sin fila de hitos, «+ Añadir documento» apagado y encendido tras crear el hito); «¿De qué tarea es?» con hito actual, tareas que esperan, «Tarea nueva» la última y «Cancelar» sin añadir; «Tarea nueva» deja tarea hecha con el nombre del tipo, documento colgado y línea en el registro; el botón «Añadir documento» de una tarea no pregunta; fichero a mano con «sin tarea» y «Colgar de una tarea» (primero «Cambiar el nombre» si hace falta); sin «Generar documento» en la carpeta; registro con el hito de cada línea; consola sin errores.
- No lo he podido ver: «Pedir datos» y «Firmar»/«Comunicar» hasta abrir la ventana del correo, ni registrar con el registro completo (solo con la demo, sin tocar datos reales); lo cubre `pruebas/vista-del-asunto-hito-y-tareas.mjs`.
- Corregido tras el revisor: la pregunta «¿De qué tarea es?» no ofrecía tareas antiguas de «reunir un documento» (sin acción apuntada); ahora sí.
- Lo que el revisor señaló y no está en el texto, y qué se dejó (**para Francisco, confirmar**): botón «No ha llegado nada» (fila 286) sigue arriba del hito en los hitos que lo traen; «Hecho ✓ (desmarcar)» en un hito hecho; «Contacto: …» al final de la línea del hito; el documento generado cuelga también bajo las tareas de registrar y comunicar; «Datos» de la tarea de generar sale desplegado; las tareas creadas a mano llevan «solo aquí» y el formulario un enlace «Elegir de la lista común de tareas»; tras añadir un documento se abre la ventana «Los documentos guardados en esta carpeta» de siempre; «Quitar la fecha» sale también sin plazo.
- Decisiones técnicas que cambian lo que se ve y no definían ni el texto ni la pantalla: «Firmar» pulsa el «Ruta» del documento colgado; «Rellenar» abre «Datos» de la tarea y lleva al primer dato que falta; «Registrar» abre la ventana de registrar del documento; «Le toca a: …» también con «Esperamos a…»; con el plan de las guías aplicado (fila 551) «+ Añadir tarea» abre la lista común de siempre. En la prueba 630 una nota escrita en «Registro» sale con el hito actual; aquí sigue siendo del asunto, sin hito (fila 426).
- Se pierde, por quitar los recuadros del hito: la barra de marcados del hito (enviar/imprimir/mover), «Enviar ▾» y el menú ⋯ por documento dentro del hito, la tarjeta «Campos de este hito» con «+ Añadir campo» desde el hito, las cajas de notas del hito y el menú «Añadir documento ▾» desde Por clasificar. El código de «Hacer este hito» sigue sin botón. Código muerto sin retirar: `HitoMesaDocumentos.filasHTML`, `HacerEsteHito.botonHTML/lineaHTML`, `CamposDeHito.tarjetaHtml`, `HitosAnadir`.
- `pruebas/arreglos-del-hito-demo.mjs` (sección «2. el aviso trae la casilla…») falla también en `main`: fila «Arreglar la prueba» apuntada en la cola.
