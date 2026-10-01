# El correo enviado desde la app se guarda en PDF en el asunto (fila 236)

Diseñado con Francisco el 1-oct-2026, a partir de un aviso del botón de soporte (idea 236:
«Estoy enviando correos desde la aplicación, pero no veo que se está generando el documento
HILO»). Diseño cerrado.

Valen las cláusulas comunes de `docs/REPARTO-DE-LA-COLA-2026-09-27.md` y las reglas de la cola
(rama `fila-236`, revisor en local, una sola publicación de código). **No leas el repositorio
entero**: basta con los ficheros de la lista. Cambios quirúrgicos, no reescribir ficheros.

## Qué quiere Francisco

Hoy, al enviar un correo desde la ficha o desde la mesa de un hito («Confirmar y enviar»), en la
carpeta del asunto **no se guarda ningún documento**: solo la nota «Correo enviado a…» y el hilo
queda enganchado para que la respuesta entre sola. El HILO solo aparece cuando el otro contesta.
Francisco quiere ver el correo que acaba de mandar como un documento más del asunto, en el
momento.

Decidido: **al enviar bien, la app guarda en la carpeta del asunto un PDF `CORREO`** del mensaje
enviado. Cuando llegue la respuesta por la bandeja, el HILO se crea como hasta ahora (no cambia
nada de la bandeja ni del script de Google).

## Lo que tiene que pasar

1. **Cuándo.** Justo después de un envío de verdad con respuesta `ok` del script, en el mismo
   sitio donde hoy se llama a `anadirHiloAlAsunto`, `marcarEnvioRealizado` y `apuntarElRastro`
   (`js/correo-cuadro.js`, `confirmarEnvio`). También cuando el script contesta `yaEnviado: true`
   (el correo salió en un intento anterior), **solo si** ese PDF no está ya en la carpeta. Nunca
   en «Abrir en Gmail», «Abrir en el correo del ordenador», ni en el mensaje de Séneca (esos no
   se envían desde la app).
2. **Qué lleva el PDF**, hecho en el navegador con pdf-lib (`PdfHerramientas.cargarPdfLib()`,
   igual que `js/indice-expediente.js`; ojo con lo que Helvetica no sabe escribir, ver su línea
   «Helvetica de pdf-lib solo sabe escribir WinAnsi»):
   - Cabecera: De (la cuenta que envía, si se sabe; si no, se omite la línea), Para, Copia oculta
     (si la hay), Fecha y hora del envío, Asunto del correo.
   - El texto del correo tal como salió (el HTML pasado a texto, con sus saltos de párrafo).
   - Al final, «Adjuntos:» y la lista de nombres de los documentos adjuntados (sin el contenido;
     ya están en la carpeta del asunto). Sin adjuntos, la línea no sale.
   - Varias páginas si hace falta, con el número de página al pie.
3. **Nombre**, el mismo que la bandeja da hoy a un correo suelto (`AAMMDD CORREO <trozo del
   asunto>.pdf`, `js/bandeja-guardar.js`, `meterLosFicheros`), con la fecha del envío y el mismo
   recorte del asunto; si con la fila 239 los documentos llegados por correo ya llevan otro
   formato, usar ese. Si ya existe un fichero con ese nombre, el siguiente libre (como
   `nombreLibre`). Así la ficha lo reconoce sola como «Llegado por correo» (`DE_CORREO`).
4. **Los adjuntos no se vuelven a guardar.**
5. **Si el PDF falla** (no se puede montar o no se puede escribir), el correo ya ha salido: aviso
   ámbar con `U.accesorio` y `U.mensajeDeError`, por ejemplo «El correo ha salido, pero no he
   podido guardar su PDF en el asunto: …». Nunca rojo, nunca bloquea el cierre del cuadro.
6. Tras guardarlo, se repinta la tarjeta de documentos de la ficha / la mesa si está a la vista,
   para que el CORREO aparezca sin recargar.
7. Funciona también en la copia de pruebas con `?demo=1&auto=1` (envío simulado): el PDF se
   escribe en el disco de mentira y se ve en la ficha.

## Ficheros que tocar

- `js/correo-cuadro.js` (llamada tras el envío) y un fichero nuevo pequeño,
  `js/correo-enviado-pdf.js` (`window.CorreoEnviadoPdf.guardar(asunto, datos)`), para no pasar de
  600 líneas. Enganche por el punto ya previsto, sin envolturas.
- `index.html` (cargar el fichero nuevo) y el modo demo si el envío simulado necesita devolver
  `ok`.
- Prueba nueva `pruebas/correo-enviado-pdf.mjs` (envío simulado con `page.route`, como
  `pruebas/envios.mjs`): tras enviar, existe `… CORREO ….pdf` en la carpeta del asunto, abre, y
  contiene el asunto, el destinatario y los nombres de los adjuntos; con fallo de escritura
  simulado, sale ámbar y el cuadro se cierra igual.
- `docs/contexto/CORREO-Y-SENECA.md`, apartado «Qué entra en la carpeta del asunto» y el del
  envío: sustituir la línea que dice que al enviar no se guarda nada. Y la línea de correo de la
  sección 5 de `docs/CONTEXTO-CORTO.md`.

## Cómo sabemos que está bien

1. Abrir un asunto con un tercero que tenga correo, pulsar «Comunicar ▾» → correo, escribir un
   texto, marcar un documento como adjunto y pulsar «Confirmar y enviar»: al cerrarse el cuadro,
   en la tarjeta de documentos del asunto aparece, sin recargar, un documento nuevo con «CORREO»
   en el nombre, en el grupo «Llegados por correo».
2. Abrir ese documento: es un PDF que enseña a quién se envió, la fecha, el asunto del correo, el
   texto escrito y, al final, «Adjuntos:» con el nombre del documento marcado.
3. Enviar otro correo sin adjuntos desde el mismo asunto: aparece un segundo documento CORREO,
   sin la línea de adjuntos, y el primero sigue igual.
4. Enviar un correo con un adjunto: en la carpeta del asunto no aparece ninguna copia nueva del
   documento adjuntado.
5. Pulsar «Abrir en Gmail» en vez de enviar: no aparece ningún documento CORREO nuevo.
6. [SOLO FRANCISCO] Enviar un correo real desde la app y, cuando el destinatario conteste y la
   respuesta entre por la bandeja, guardarla en el asunto: aparece el HILO como siempre, y el
   CORREO del envío sigue en su sitio.
