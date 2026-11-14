# 661 — Bandeja con hito y tarea

Quinta y última parte del tema 650 («Crear tareas e hitos con fluidez»). Va detrás de la 659 («Qué documento») y de la 660 (ventana «Añadir hito» y marca de la guía).

## Lo que escribió Francisco

Idea 634 (13-nov-2026): al clasificar un documento de la bandeja y añadirlo a un asunto, que la app obligue a elegir el hito y la tarea de los que cuelga. Al diseñarla, que la app proponga la tarea ella sola, para que clasificar no cueste más pasos que hoy.

14-nov-2026, sobre el correo:

> Yo creo que el hilo de correos deben formar parte del Registro, se pueden vincular a él, porque el hilo puede tratar sobre distintos hitos y tareas a lo largo del asunto y lo normal es mantener el hilo. Distinto es el caso de los adjuntos que lleguen en su caso. Asociar ese correo a un hito o tarea por defecto es arriesgado. Otra cosa es que la app analizara el contenido del correo y del adjunto y encontrara a qué "enlaza mejor", pero creo que eso sería mucho suponer. Creo que lo mejor es que nos de a elegir el hito + tarea al que asociar el adjunto.

## Lo que entendió Claude (acordado con Francisco el 14-nov-2026)

**El documento entra al pulsar «Guardar».**
- «Guardar en un asunto» y elegir el asunto abren el cuadro del nombre de siempre. El documento todavía no ha entrado en el asunto.
- Entra al pulsar «Guardar», ya con su nombre y colgado de su tarea.
- «Volver», «Cerrar» y la ✕ no guardan nada: el documento sigue en «Por clasificar». Hoy se quedaba dentro del asunto sin nombre y sin tarea.
- Arriba del cuadro, en vez de «Se le cambia el nombre al fichero que ya está en la carpeta», dice «El documento entra en el asunto al pulsar «Guardar»».
- En el cuadro de elegir el asunto, el texto pasa a ser «Elige el asunto. Después le pones nombre y dices de qué tarea es.»

**El bloque «¿De qué tarea es?».**
- Va dentro del cuadro del nombre, justo debajo de «Tipo de documento». No hay ventana aparte.
- Sin hito y sin tarea no se guarda. Avisos: «Elige el hito y la tarea de los que cuelga el documento.» y «Elige la tarea de la que cuelga el documento.»
- **Con propuesta:** si en cualquier hito del asunto hay una tarea de añadir documento, sin hacer, cuyo «Qué documento» es justo el tipo elegido, el bloque la trae puesta: «Hito: …», «Tarea: …», «Esa tarea espera un documento de tipo X. Queda hecha.» y el botón «Cambiar». Si hay varias, la del hito actual; si no, la primera.
- **Sin propuesta:** en cualquier otro caso el bloque sale vacío: «Ninguna tarea espera un documento de tipo X. Elige el hito y la tarea.», el desplegable «Hito» en «Elige el hito…» y, al elegirlo, sus tareas. La app no propone nada más: ni «la primera tarea que espera un documento» ni nada sacado del contenido.
- **Las tareas que se ofrecen** en el hito elegido: las de añadir documento sin hacer (con «Espera un documento de tipo X» o «Espera un documento») y, la última, «Tarea nueva: «TIPO»» («La app la crea en ese hito y la deja hecha»).
- Al cambiar el tipo de documento, la propuesta se vuelve a calcular. Si ya se ha elegido a mano (con «Cambiar», el desplegable o una tarea), lo elegido no se toca; solo cambia el nombre de «Tarea nueva».
- La «Tarea nueva» obedece a la marca del asunto «Los cambios en hitos y tareas van también a la guía» (fila 660), como cualquier tarea añadida. Su texto pequeño lo dice: «…y va también a la guía» o «…solo en este asunto».
- Si se llega desde un hito o desde una tarea (el botón de añadir documento de una tarea, o la bandeja abierta desde un hito), ese hito y esa tarea vienen puestos.

**«+ Añadir hito».**
- Está siempre al lado del desplegable «Hito». Abre la ventana «Añadir hito» paso a paso de la fila 660, la misma.
- Al terminar, se vuelve al cuadro con ese hito puesto; si alguna de sus tareas espera ese tipo de documento, también la tarea.
- Si se cancela, se vuelve al cuadro como estaba.
- El hito añadido se queda en el asunto aunque después se pulse «Volver».
- **Asunto sin hitos:** el bloque dice «Este asunto no tiene hitos. Añade el hito del que cuelga el documento.», el desplegable sale apagado («No hay hitos») y «Guardar» avisa «Añade antes el hito del que cuelga el documento.»

**El correo.**
- Cada adjunto pasa por el mismo cuadro, uno detrás de otro, con «Correo de <quien> · adjunto 2 de 3» arriba. Cada uno entra en el asunto al pulsar su «Guardar».
- El PDF del correo y el del hilo entran en la carpeta al elegir el asunto, como hoy, sin cuadro. No cuelgan de ningún hito ni tarea y no llevan la marca «sin tarea» ni «Colgar de una tarea». Tampoco los que ya hay en asuntos de antes.
- Cada correo guardado deja una línea en el Registro del asunto, sin hito: «Correo recibido de <quien>: «<asunto del correo>»», con «Abrir el correo» y «Abrir el hilo» (abren esos dos PDF; el del hilo, el que haya en ese momento).
- Si se pulsa «Volver» en un adjunto: el correo ya está en el Registro, lo guardado se queda guardado, y los adjuntos que faltan siguen en la bandeja, con el correo. Aviso: «El correo queda en el Registro. Un adjunto no se ha guardado: sigue en la bandeja, con el correo.» Al guardarlo otra vez en ese asunto solo se piden los adjuntos que faltan, y no hay otra línea en el Registro.

**Al guardar** queda en el Registro la línea de siempre, «Añadido «<documento>» en la tarea «<tarea>»», en su hito, y la tarea queda hecha.

## Pantalla de prueba

- Aprobada el 14-nov-2026: `docs/pantallas/661.html` · https://claude.ai/artifact/2dJaqib3nSobNsbCp6FT1h
- Pinta la parte derecha del cuadro. «Ver más grande», «Cerrar», los campos del registro y lo demás del cuadro siguen como hoy. La ventana «Añadir hito» va resumida: la buena es la de la fila 660. La parte de abajo («Así queda el asunto») solo enseña el resultado: no es una pantalla nueva.

## Qué NO se hace en esta tarea

- Las casillas «Está registrado en Séneca» y «Pendiente de registro» se quedan como hoy (idea 662).
- «Crear asunto con él» se queda como hoy.
- La app no mira el contenido del correo ni del adjunto para proponer la tarea: «sería mucho suponer».
- «+ Añadir documento» y «Colgar de una tarea» dentro del asunto se quedan como hoy, con su ventana «¿De qué tarea es?».

## Notas técnicas de Claude

- Hoy: `App.llevarSueltoA` (`js/documentos-sueltos.js`) mueve el fichero y después abre `App.verDocumentos` con `ponerNombre`; `meterLosFicheros` y `abrirCuadroDeAdjuntos` (`js/bandeja-guardar.js`) copian todo y abren la serie. Ahora el cuadro se abre con el fichero todavía en la bandeja (para verlo y leerlo se le pasa su origen) y el movimiento se hace en el guardado, con las mismas comprobaciones de hoy (ruta larga, nombre que ya existe, `toleraNoBorrar`) y directamente con el nombre nuevo.
- El bloque es una pieza nueva (`js/documento-tarea-bloque.js`, por debajo de 400 líneas; los dos ficheros de la bandeja ya pasan el tope y no deben crecer). Usa `DocumentoATarea.hitosElegibles`, `tareasQueEsperan` y `colgar` (`js/documento-a-tarea.js`); no se duplica su lógica. La ventana `DocumentoATarea.preguntar` sigue para los caminos de dentro del asunto.
- La propuesta compara el tipo elegido con el dato «Qué documento» de la tarea, tal como lo guarda la fila 659. Si la 659 no está en `main`, esta fila no se empieza.
- «+ Añadir hito» llama a la ventana de la fila 660 por su entrada pública, en una capa encima del cuadro, y recibe el hito creado. Si la 660 no está en `main`, esta fila no se empieza.
- «Tarea nueva»: por el mismo camino que usa la fila 660 para añadir una tarea obedeciendo a la marca, con acción «Añadir documento» y «Qué documento» = el tipo.
- Correo: la línea del Registro con `RegistroAsunto` sin hito, guardando los nombres de los dos PDF para los enlaces; una sola por correo (por su `id`). Los adjuntos sin guardar se quedan en la carpeta de la bandeja y en el correo de la bandeja; `borrarDeLaBandeja` solo cuando no queda ninguno.
- La marca «sin tarea» (`js/ficha-documentos-fila.js`) se salta los PDF que la app nombra `… CORREO …` y `… HILO …`; los adjuntos, no.
- Datos de la demostración: que haya un asunto con una tarea que espere un tipo, uno sin hitos y un correo con dos adjuntos.
- Línea en `js/novedades.js`. Poner al día `docs/contexto/DOCUMENTOS.md` y `CORREO-Y-SENECA.md`.

## Cómo lo comprueba el segundo revisor

- Con un documento suelto, tras elegir el asunto y antes de «Guardar», el fichero sigue en la bandeja y no está en la carpeta del asunto.
- «Volver», «Cerrar» y ✕ lo dejan en «Por clasificar» y no apuntan nada.
- Con una tarea que espera ese tipo, el bloque la propone; al cambiar a un tipo que nadie espera, el bloque queda vacío y «Guardar» avisa.
- Tras elegir a mano, cambiar el tipo no cambia el hito ni la tarea.
- «Tarea nueva» crea la tarea en el hito elegido, hecha, con el documento colgado, y obedece a la marca de la guía.
- Asunto sin hitos: textos, desplegable apagado, «+ Añadir hito» abre la ventana de la 660 y vuelve con el hito puesto.
- «+ Añadir hito» está también cuando el asunto tiene hitos.
- Correo con dos adjuntos: dos cuadros seguidos con «adjunto n de N»; línea «Correo recibido de…» en el Registro, sin hito, con sus dos enlaces; los PDF del correo y del hilo sin «sin tarea».
- «Volver» en el segundo adjunto: el primero guardado, el segundo en la bandeja con el correo, una sola línea del correo en el Registro al repetir.
- Los textos coinciden con los de `docs/pantallas/661.html`.
- Dentro del asunto, «+ Añadir documento» y «Colgar de una tarea» siguen igual.

## Qué mirar al terminar

- En «Por clasificar», pulsa «Guardar en un asunto», elige un asunto y pulsa «Volver»: el documento sigue en la bandeja.
- Hazlo otra vez con un tipo que alguna tarea espere: mira la propuesta y guarda. En el asunto, la tarea está hecha con el documento colgado.
- Con un tipo que nadie espera: el bloque sale vacío y obliga a elegir.
- En un asunto sin hitos: «+ Añadir hito» y guardar.
- Guarda un correo con adjuntos: mira el Registro del asunto y que los PDF del correo no dicen «sin tarea».

## Revisión y respuestas durante el trabajo

- Segundo revisor (agente aparte, sin ver el código; 14-nov-2026, en local con la demostración), **APROBADA** a la primera. Coincide: el suelto sigue en la bandeja hasta «Guardar» y entra al guardar; «Volver», «Cerrar» y ✕ no guardan nada; propuesta de tarea por tipo, bloque vacío con aviso, avisos de «Guardar» sin hito/tarea; lo elegido a mano no cambia al cambiar el tipo; «Tarea nueva» (hecha, colgada, línea del Registro en su hito, texto pequeño «solo en este asunto» / «y va también a la guía» según la marca); asunto sin hitos y «+ Añadir hito» (vuelve con el hito y su tarea; cancelar deja el cuadro como estaba; el hito se queda tras «Volver»); correo con dos adjuntos («adjunto 1 de 2», «2 de 2»), una línea en el Registro con «Abrir el correo» y «Abrir el hilo», PDF del correo y del hilo sin «sin tarea»; «Volver» en el segundo adjunto con su aviso y, al repetir, solo «adjunto 1 de 1» y una sola línea; «+ Añadir documento» y «Colgar de una tarea» de la ficha igual que antes; consola sin errores y pantallas principales abren.
- No lo he podido ver: que el PDF se abra de verdad desde el Dropbox de Francisco (en la demostración «Abrir el correo» y «Abrir el hilo» abren una pestaña con el PDF). Tampoco se probó la entrada «desde un hito con tarea puesta» más allá de la prueba automática.
- Lo que hace la app y el texto no pide: nada de peso; solo avisos verdes habituales («Guardado en… Ir al asunto») y, cosmético, el aviso de «Añade antes el hito…» queda en el fondo tras añadir el hito.
- Decisiones técnicas de la sesión: el cuadro es el de «Añadir documento» (`modo: 'anadir'`) con el fichero aún en la bandeja; las pruebas antiguas que daban por hecho que el documento entraba al elegir el asunto se han adaptado (`pruebas/apoyo/bandeja-guardar.mjs`); datos de la demostración: tercer correo con dos adjuntos, tres tareas de «Añadir documento» en la matrícula de Pablo y dos sueltos más.
