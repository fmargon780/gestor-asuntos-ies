# 639 — Llamar por teléfono

Tema 565. Va detrás de las filas 637 y 638 (vista del asunto): usa su cabecera y sus tareas.

## Lo que escribió Francisco

Idea 557 (6-nov-2026, al diseñar la idea 553):

> «Qué se hace» nuevo: «Llamar por teléfono», con un registro de las llamadas de esa tarea (intentos, contactos y comentarios).

Durante el diseño (13-nov-2026):

> Me gustaría también poder anotar llamadas emitidas, y sobre todo, recibidas, no ligadas a una tarea.

> No veo que en el registro tenga dentro el botón Apuntar llamada. Hay que acordarse de que está ahí. Creo más útil que esté fuera, como otro botón con un símbolo.

> En la tarea cambia también el botón Apuntar llamada, por el icono.

> ¿Y no podríamos poner que en el botón de cabecera […] te preguntara si quieres asociar esa llamada a una tarea existente?

> ¿Y si la tarea no es de llamar, pero me llaman para preguntarme por ella o para aportarme alguna información que necesito para esa tarea?

> En las tareas, la línea de llamadas puede salir plegada por defecto y no ocuparía tanto espacio.

> Al desplegar, aparecen los hitos en negrita, sin mostrar sus tareas. Al pulsar sobre uno se muestran sus tareas y se elije.

> [Del día y la hora:] Creo que estaría bien poder cambiarla.

> [De la llamada ya apuntada:] Una vez añadida, sería bueno poder corregir algo, quedando registrada la modificación si es posible.

## Lo que entendió Claude (acordado con Francisco el 13-nov-2026)

Manda la pantalla de prueba.

La tarea:
- En «Qué se hace» hay una opción nueva, la última: «Llamar por teléfono». Sale en todos los sitios donde se elige «Qué se hace»: la guía, «+ Añadir tarea» del asunto y «Cambiar la tarea».
- Una tarea de llamar lleva la etiqueta «Llamar por teléfono» y un botón con el icono de un teléfono (sin texto; al pasar el ratón, «Apuntar llamada»). El botón sigue estando con la tarea hecha, para seguir apuntando.
- Sin llamadas, debajo de la tarea pone «Sin llamadas todavía».

La ventana «Apuntar llamada»:
- Arriba se elige «He llamado yo» o «Me han llamado».
- «A quién» (o «Quién ha llamado»): salen las personas del asunto de las que la app conoce un teléfono, cada una con su papel, su teléfono y un botón para copiarlo: el tercero, sus tutores legales (con «tiene la custodia» junto a quien la tiene), quien pide el asunto y los relacionados. Se elige una pulsándola. Debajo, la casilla «Otra persona o número» para escribir a mano; escribir en ella suelta la persona elegida.
- «Qué ha pasado»: «He hablado» o «No contesta». Solo sale con «He llamado yo»; una llamada recibida cuenta siempre como hablada.
- «Comentario», libre, no obligatorio.
- Abajo a la izquierda, el día y la hora, puestos con los de ese momento y que se pueden cambiar, y el nombre de quien la apunta, que no se cambia.
- «Apuntar» no deja seguir sin persona, sin «Qué ha pasado» (si he llamado yo) o sin día y hora, y dice qué falta.
- La app no marca el número: solo lo enseña y lo copia.

Desde el botón de la tarea:
- La ventana sale con «He llamado yo» elegido y el nombre de la tarea en el título. No pregunta de qué tarea es.
- La llamada queda debajo de la tarea y en el Registro del asunto, con su hito y su tarea.
- Con «He hablado» (o si es recibida), la tarea se marca sola y un aviso lo dice; se puede desmarcar a mano para seguir llamando. Con «No contesta» sigue pendiente.

Desde el botón de la cabecera:
- En la cabecera del asunto, a la derecha, antes de «Ruta», hay un botón con el mismo icono del teléfono («Apuntar llamada»). Se ve siempre.
- La ventana sale con «Me han llamado» elegido.
- Pregunta «¿Es de una tarea?», encima del comentario. Sale elegido «No, de ninguna». Al desplegar salen «No, de ninguna» y los hitos del asunto en negrita, el actual el primero, sin sus tareas; al pulsar un hito se abren sus tareas debajo (todas, no solo las de llamar); al pulsar una queda elegida, la lista se cierra y se lee «Hito › Tarea».
- Sin tarea, la llamada queda solo en el Registro del asunto.
- Con una tarea de llamar, es como apuntarla desde su botón: queda debajo de ella y, si se habló, la tarea se marca sola.
- Con una tarea que no es de llamar, la llamada queda debajo de esa tarea y en el Registro, y la tarea no se marca.
- En un asunto sin hitos o sin tareas la pregunta no sale.

Las llamadas debajo de una tarea:
- Salen plegadas en una línea con la cuenta: «3 llamadas · 1 con respuesta». Al pulsarla se abren, la más reciente arriba, cada una con día y hora, quién la apuntó, a quién o de quién, «Hablado» o «No contesta» y el comentario.
- Se ordenan por el día y la hora de la llamada, también en el Registro.

Corregir una llamada (no está en la pantalla de prueba; manda este texto):
- Cada llamada, debajo de su tarea y en el Registro, lleva un «⋮» con «Corregir».
- «Corregir» abre la misma ventana, con el título «Corregir llamada» y todo relleno como se apuntó. Se puede cambiar todo menos la tarea de la que es. El botón es «Guardar».
- Al guardar, la llamada queda con lo nuevo y con la marca «corregida» al lado.
- En el Registro queda además una línea nueva, con el día y la hora de la corrección y quién la hizo: «Llamada del <día y hora> corregida. Antes: <cómo estaba>». Lo de antes nunca se pierde.
- Si al corregir pasa de «No contesta» a «He hablado» y es de una tarea de llamar pendiente, la tarea se marca sola. Al revés no se desmarca.
- Una llamada no se puede borrar.

## Pantalla de prueba

- Aprobada el 13-nov-2026: `docs/pantallas/565.html` · https://claude.ai/artifact/53aZ9zGaBMhjBthtrDriT4
- Parte de la vista del asunto de las filas 637 y 638 (`docs/pantallas/630.html`). Solo pinta la cabecera, un hito con sus tareas y el bloque «Registro».
- En la prueba, las demás ventanas (correo, menús) no se pintan: un aviso dice que se abren.

## Qué NO se hace en esta tarea

- Apuntar una llamada sin asunto, con un botón en Inicio y una lista de llamadas sin asunto: idea 640.
- Borrar una llamada ya apuntada: solo se corrige.
- Cambiar de tarea una llamada ya apuntada.
- La app no marca números ni abre ningún programa de teléfono.
- No se añade ninguna tarea de llamar a ninguna guía: cada guía la pondrá cuando se diseñe.
- No cambia «Qué me toca», Inicio ni el resto de la vista del asunto.

## Notas técnicas de Claude

- Las acciones de tarea: `ACCIONES` de `js/guias-guion.js` (la lista con textos) y de `js/hitos-guion.js` (los valores); valor nuevo `llamar`. Modelo cercano: `js/tarea-copiar*.js` (fila 552) y `js/tarea-firmar.js` (fila 523). Leer antes `docs/contexto/HITO-MESA.md` y `docs/contexto/HITOS-Y-GUIAS.md`, y cómo han dejado las filas 637 y 638 la cabecera y las tareas.
- Dónde se guarda: cada llamada es una línea del registro con sus datos aparte (sentido, persona, teléfono, resultado, día y hora de la llamada, hito y tarea). Las de una tarea, en las notas de su hito (`hitos.json`); las sueltas, en `ficha.notas` (`asuntos.json`) con `App.anotarLista`. La lista bajo la tarea se saca de ahí; no se guarda dos veces. Si al programar resulta mejor otro sitio, vale, siempre que nada se guarde dos veces.
- La corrección guarda en la propia llamada cuándo y quién la corrigió, y lo de antes va en la línea nueva del registro (automática). Las líneas de llamada no llevan el «Cambiar» y «Borrar» de las notas a mano.
- El registro ya funde las dos fuentes (`js/registro-asunto.js`); la línea de una llamada se ordena por la hora de la llamada, no por la de apuntarla.
- Los teléfonos: los mismos sitios de donde ya los saca la app (contacto del tercero, tutores legales de `js/datos-tutores.js` con su custodia, `LoPide.contactoDe`, relacionados). Una persona con dos teléfonos, una línea por teléfono. Sin ningún teléfono conocido, solo la casilla «Otra persona o número».
- Cuadro con la regla común (`.capa > .cuadro`); guardado por `ColaGuardado`; en «solo consulta» los dos botones no apuntan nada. Ficheros nuevos por debajo de 400 líneas y apuntados en su `js/cargar-piezas-N.js`.
- El icono, de un solo color (toma el del texto del botón), nunca un emoji.
- Línea en `js/novedades.js`. Al terminar, poner al día `docs/contexto/HITO-MESA.md`, `docs/contexto/QUE-ESTA-HECHO.md`, `docs/CONTEXTO-CORTO.md` y `docs/VOCABULARIO.md`.

## Cómo lo comprueba el segundo revisor

- «Qué se hace» trae «Llamar por teléfono» al final, en la guía, en «+ Añadir tarea» y en «Cambiar la tarea».
- Una tarea de llamar nueva: etiqueta «Llamar por teléfono», botón con el icono y «Sin llamadas todavía».
- Botón de la tarea: la ventana sale con «He llamado yo», el nombre de la tarea en el título y sin «¿Es de una tarea?».
- «Apuntar» sin persona, sin «Qué ha pasado» o sin hora no apunta y dice qué falta.
- Elegir una persona y escribir en «Otra persona o número» suelta a la persona.
- El botón de copiar de cada teléfono lo copia.
- «No contesta»: la cuenta sube, «0 con respuesta», la tarea sigue pendiente; la línea sale en el Registro con su hito y su tarea.
- «He hablado»: la tarea se marca sola y el aviso lo dice; al desmarcarla, el botón sigue.
- Con «Me han llamado» no sale «Qué ha pasado» y el rótulo es «Quién ha llamado».
- Las llamadas de la tarea salen plegadas, con la cuenta; se abren al pulsar.
- Botón de la cabecera: se ve con cualquier bloque plegado; la ventana sale con «Me han llamado» y «¿Es de una tarea?» en «No, de ninguna».
- Al desplegar «¿Es de una tarea?»: «No, de ninguna» y los hitos en negrita, el actual primero, sin tareas; al pulsar un hito salen sus tareas; al elegir una se cierra y se lee «Hito › Tarea».
- Sin tarea: la llamada sale solo en el Registro, sin hito.
- Con una tarea que no es de llamar: queda bajo esa tarea, plegada, y la tarea no se marca.
- Con una tarea de llamar, desde la cabecera: queda bajo ella y, hablada, la marca.
- Cambiando el día y la hora a una anterior, la llamada se coloca en su sitio bajo la tarea y en el Registro.
- «⋮ → Corregir» de una llamada abre «Corregir llamada» con sus datos; al guardar un cambio, la llamada sale con lo nuevo y «corregida», y el Registro tiene una línea nueva con «Antes: …» y lo que había. No hay «Borrar».
- Corregir una llamada de «No contesta» a «He hablado» en una tarea de llamar pendiente la marca.
- En un asunto sin hitos, el botón de la cabecera apunta la llamada y no pregunta por la tarea.
- La colocación coincide con `docs/pantallas/565.html`.

## Qué mirar al terminar

- En un asunto, pulsa «+ Añadir tarea», elige «Llamar por teléfono» y añádela.
- Pulsa el teléfono de esa tarea, elige a alguien, «No contesta» y «Apuntar»: mira la cuenta bajo la tarea.
- Apunta otra con «He hablado»: la tarea se marca sola. Desmárcala.
- Pulsa el teléfono de la cabecera, elige quién ha llamado y, en «¿Es de una tarea?», una tarea que no sea de llamar: mira esa tarea.
- Apunta otra desde la cabecera sin tarea y mírala en el Registro.
- Apunta una llamada cambiando la hora a una de ayer y mira dónde queda.
- Pulsa el «⋮» de una llamada, «Corregir», cambia el comentario y guarda: mira la marca «corregida» y la línea nueva del Registro con lo de antes.
- Mira que los teléfonos que salen son los del alumno, sus tutores y quien pide el asunto.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
