# 760 — Un documento con número de asunto va a su asunto

**Título llano:** Un documento de «Por clasificar» con el número de un asunto propone guardarse en ese asunto
**Para qué:** que un correo guardado en PDF (o cualquier documento) que lleva el número de un asunto (A26-0588) no obligue a buscar el asunto a mano.

## Lo que escribió Francisco

Aviso de soporte (idea 726), del 20-nov-2026, pantalla Inicio, copia sin internet, perfil Administración:

> El correo recibido dice el número de asunto, sin embargo la aplicación no propone guardarlo en el de mismo número.

En la captura, el documento suelto se llamaba «Correo de Consejería de Educación - Fwd_ INFORME ALUMNADO Servicios Sociales Municipales · A26-0588.pdf», y la tarjeta ofrecía «Crear asunto con él» como botón principal.

Tema 759: «El correo que entra va a su asunto. Para qué: que si un correo que llega dice el número de un asunto, la app proponga guardarlo en ese asunto.»

## Lo que entendió Claude (acordado con Francisco el 26-nov-2026)

- La bandeja de correos ya reconoce el número de asunto en el asunto del correo (fila 627). Lo que falla es «Por clasificar»: un documento suelto no se busca por número.
- En «Por clasificar», si el **nombre** del documento suelto lleva el número de un asunto (`A26-0588`, entero y suelto, igual que en los correos), la tarjeta dice **«Es de»** y el nombre de ese asunto.
- Si el nombre no lo lleva, se busca el número en el **texto del PDF** que la app ya lee. Si lo encuentra, lo mismo.
- Con el asunto abierto, el botón principal pasa a ser **«Guardar en ese asunto»**. Lleva al mismo cuadro del nombre de siempre (con su tarea), con ese asunto ya elegido.
- Con el asunto cerrado (archivado), sale lo mismo que en los correos: **«Reabrir y guardar aquí»** (principal) y **«Guardar sin reabrir»**.
- **«Crear asunto con él»** y **«Guardar en un asunto»** siguen en la tarjeta, sin destacar, por si la propuesta se equivoca.
- Cuando hay número, no salen las sugerencias por tercero de debajo (las de la fila 88): manda el número.
- Nunca se guarda nada sin pulsar.
- Si el documento cita el número de otro asunto, la propuesta será errónea: se ve antes de pulsar y se usa «Guardar en un asunto».

## Pantalla de prueba

- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea

- La bandeja de correos no cambia (ya busca el número en el asunto del correo; no se busca en el cuerpo).
- No se lee nada que hoy no se lea: los escaneados sin texto solo se reconocen por el nombre.

## Notas técnicas de Claude

- La búsqueda del número ya existe: `asuntoPorNumeroEnElTexto` en `js/bandeja-huella.js` (exportada en `window.Bandeja`). Usarla tal cual; si «Por clasificar» se carga sin la bandeja, moverla a un sitio común sin copiarla.
- Con el nombre del fichero se mira al pintar la tarjeta (`App.tarjetaSuelto`, `js/documentos-sueltos.js`), sin esperar al lector.
- Con el texto: `js/documentos-sueltos-lector.js` ya lee el PDF (`RegistroLector.textoDe`). Buscar el número en ese texto y guardar el resultado en la misma caché de lo leído (`LectorDeSueltos.resultadoDe`), sin volver a leer el fichero.
- El guardado: `App.meterSueltoEnAsuntoElegido(s, { nombre, ficha })`, que ya lleva al cuadro del nombre. Para los dos botones del asunto cerrado, separar en esa función la pregunta de reabrir de lo demás, sin repetir el traslado.
- El aspecto de la línea «Es de», igual que «Respuesta de» de la bandeja (`marca-tipo`).
- Demostración: añadir un documento suelto cuyo nombre lleve el número de un asunto abierto de los datos inventados, y otro con el de uno archivado, para poder verlo en `?demo=1&auto=1`.
- Prueba nueva en `pruebas/` con los cuatro casos: número en el nombre, número solo en el texto, asunto archivado, sin número (la tarjeta queda como hoy).
- Línea en `js/novedades.js`.
- Al terminar, actualizar `docs/contexto/DOCUMENTOS.md` (Por clasificar) y `docs/contexto/QUE-ESTA-HECHO.md`.

## Cómo lo comprueba el segundo revisor

- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar

- En demostración, «Por clasificar»: el documento con número de un asunto abierto dice «Es de» y ese asunto, y su botón principal es «Guardar en ese asunto».
- Al pulsarlo, se abre el cuadro del nombre con ese asunto, y al guardar el documento queda en él.
- El documento con número de un asunto archivado ofrece «Reabrir y guardar aquí» y «Guardar sin reabrir».
- Un documento sin número se ve igual que antes.
- En la app real, con un correo guardado en PDF con número de asunto (solo Francisco, en el instituto).

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
