# Enviar el correo desde el asunto, con sus documentos (fila 114)

Cerrado con Francisco el 24-sep-2026. Sustituye al "borrador con documentos" de
`docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md` (16-sep-2026).

## Por qué

- El camino de hoy no funciona y, aunque funcionara, no sirve. La app deja una copia de los
  documentos y un `<id>.envio.json` en `GESTOR-BANDEJA` (Drive), y el script de Apps Script, cada
  minuto, monta un borrador en Gmail. Francisco tiene que pulsar "Preparar borrador con los
  documentos", esperar, irse a Gmail a buscar el borrador y enviarlo allí.
- Comprobado el 24-sep-2026: los encargos se quedan en la carpeta sin que nadie los recoja
  ("Borrador en camino" → "Está tardando"). La carpeta está en `APP GESTION ASUNTOS/GESTOR-BANDEJA`
  y el script solo la buscaba en la raíz de «Mi unidad" (ya corregido en
  `apps-script/gestor-correos.gs`, commit `736842b`), pero ni con eso arrancó. Es un mecanismo que
  falla en silencio.
- Francisco: "no le veo sentido a tener que irme del asunto para buscar el borrador y terminar de
  enviarlo". Y: "con elegir el documento a adjuntar debería ser suficiente".

## Lo que se quiere (lo que ve Francisco)

1. En el cuadro de Correo (el del asunto y el de "Comunicar" de un hito, que es el mismo), escribe
   el correo y marca los documentos con su casilla. **No hay botón "Preparar borrador"**: marcar
   basta.
2. Pulsa **"Enviar"** (botón principal del cuadro).
3. Sale un **resumen** en el mismo cuadro (no un segundo cuadro encima, regla de `U.preguntar`):
   Para, Copia oculta (si hay), Asunto, primeras líneas del texto y la lista de adjuntos con su
   tamaño. Botones **"Confirmar y enviar"** y **"Volver"** (vuelve al cuadro con todo lo escrito).
4. Al confirmar, el correo **sale en ese momento** desde la cuenta de Google de quien usa la app
   (Francisco: `g.educaand.es`), con los adjuntos. Aviso verde "Correo enviado a …". No se sale
   del asunto.
5. Queda anotado en el asunto (el rastro de siempre, `apuntarElRastro`): "Correo enviado a … ·
   con N documentos: …". Si se mandó desde un hito, en las notas de ese hito, como hoy.
6. Si falla, aviso rojo con el motivo en castellano (`U.mensajeDeError`) y el cuadro se queda
   abierto con todo lo escrito, para reintentar. Nunca se pierde el texto.

"Abrir en Gmail" y "Abrir en el correo del ordenador" siguen, pero como botones secundarios
(para quien quiera escribir allí, sin adjuntos). El cuadro de Séneca no cambia.

**Esto cambia una regla de siempre**: "la aplicación nunca envía nada". Desde esta fila, la app
envía correo, **solo** tras "Confirmar y enviar" con el resumen delante. Cambiar esa línea donde
aparezca (`docs/CONTEXTO-CORTO.md` sección 5, `docs/contexto/CORREO-Y-SENECA.md`).

## Cómo (para Claude Code)

### El envío: una aplicación web de Apps Script que la app llama directamente

Nada de carpeta intermedia ni de revisión cada minuto.

- En `apps-script/gestor-correos.gs` (el mismo proyecto que ya tiene Francisco), añadir
  `doPost(e)`:
  - Cuerpo JSON (la app lo manda con `Content-Type: text/plain` para que el navegador no haga
    consulta previa CORS): `{ clave, para, cco, asunto, cuerpo, hilo, adjuntos: [{ nombre, tipo,
    base64 }] }`.
  - Comprueba `clave` contra una propiedad del script (`PropertiesService`); si no coincide,
    responde error y no hace nada.
  - Envía con `GmailApp.sendEmail(para, asunto, cuerpo, { attachments, bcc })`. Mismo caso del
    grupo que hoy: sin nadie en "Para" pero con copia oculta, "Para" es la propia cuenta.
  - Con `hilo`: si el hilo existe y los destinatarios elegidos son los del hilo, responder
    **dentro** del hilo (`createDraftReply(...)` + `.send()` del borrador, que conserva el hilo y
    admite adjuntos y `bcc`). Si no, correo nuevo. Decidirlo y dejarlo escrito.
  - Responde JSON `{ ok: true, hilo, matricula }` (identificador del hilo y Message-ID del mensaje
    enviado) o `{ ok: false, motivo }`. Con `ContentService`, tipo JSON.
  - Tope: 20 MB entre todos los adjuntos, como hoy (se comprueba también en la app antes de
    mandar, para avisar sin gastar la llamada).
- Una función que se ejecuta una sola vez, `prepararEnvio()`: crea la clave (aleatoria, larga) si
  no existe y escribe en el registro **una sola línea para copiar**: la dirección de la aplicación
  web con la clave dentro (`…/exec?k=<clave>`), o, si aún no hay implementación, qué hacer.
  `doPost` acepta la clave también por `e.parameter.k`. Así Francisco pega **una sola cosa** en
  Ajustes.
- `prepararTodo()` y `recogerCorreos()` (la bandeja de correos que entran) no cambian.
  `mandarBorradores()` se queda como está, sin uso, para no romper un encargo viejo que quede.
- Cabecera del fichero: fecha y qué cambia, como las demás.

### En la app

- **Ajustes → "Enviar correo"** (bloque plegado, con resumen en el título: "Conectado" / "Sin
  conectar"): un campo para pegar la dirección, un botón **"Probar"** que se manda un correo a sí
  mismo sin adjuntos y dice si llegó bien, y los pasos para conseguir la dirección, escritos para
  alguien que no es programador (ver abajo).
- La dirección **se guarda en este navegador, por persona** (no en `_GESTOR`): cada uno envía
  desde su propia cuenta. El compañero conecta la suya.
- Sin dirección puesta, el botón "Enviar" dice "Conecta el envío en Ajustes → Enviar correo" y
  lleva allí; "Abrir en Gmail" sigue funcionando.
- `js/correo-adjuntos.js`: quitar el botón "Preparar borrador con los documentos"; la lista con
  casillas se queda (desmarcadas de partida, salvo lo que ya viene marcado desde la tabla del
  hito). Los ficheros se leen de Dropbox al confirmar, se pasan a base64 y van en la llamada.
- Quitar las tarjetas "Borrador en camino" y su vigilancia de 15 segundos
  (`js/bandeja-correos.js`), y vaciar `_GESTOR/envios.json` de encargos viejos (limpiar también
  sus copias en `GESTOR-BANDEJA` si siguen ahí). Que no quede nada que vigile un encargo.
- Tras enviar: si la respuesta trae `hilo`, apuntarlo en `hilos` del asunto (como un correo
  enganchado), para que la respuesta del tercero entre sola por la bandeja.
- "Guardando…" solo alrededor de la llamada (`U.mientrasGuarda`); verde / rojo / ámbar según la
  regla de siempre (lo principal es que el correo salga; apuntar el rastro o el hilo es
  accesorio).

### Los pasos que verá Francisco en Ajustes (texto para la pantalla)

1. Abre script.google.com con tu cuenta del centro y entra en el proyecto "Gestor - Correos".
2. Copia el código nuevo desde GitHub (enlace directo al fichero) y pégalo en lugar del viejo.
   Guarda.
3. Arriba a la derecha: "Implementar" → "Nueva implementación". Tipo: "Aplicación web". Ejecutar
   como: "Yo". Quién tiene acceso: "Cualquier usuario". Pulsa "Implementar" y acepta los permisos.
4. Elige `prepararEnvio` en el desplegable y pulsa "Ejecutar". Copia la línea que sale abajo.
5. Pégala aquí y pulsa "Probar".

Si en el paso 3 no aparece "Cualquier usuario" (la cuenta del centro puede tenerlo limitado),
que la pantalla lo diga así y proponga "Cualquier usuario de la organización"; en ese caso,
comprobar si la llamada desde la app funciona igual y dejar escrito lo que pase. No se puede
probar sin la cuenta real: dejarlo en `docs/COMPROBAR-A-MANO.md`.

## Pruebas

- En `pruebas/`: el cuadro sin botón "Preparar borrador"; "Enviar" abre el resumen con lo
  escrito y los adjuntos marcados; "Volver" conserva todo; "Confirmar" llama a la dirección
  (simulada) con el cuerpo correcto (base64 de los ficheros, clave, hilo); respuesta `ok` → aviso
  verde, rastro y `hilos`; respuesta de error → rojo y el cuadro sigue con todo; más de 20 MB →
  aviso sin llamada; sin dirección → lleva a Ajustes. Ninguna tarjeta "Borrador en camino".
- Las pruebas de correo de hoy (`plantillas.mjs`, `envios.mjs`, `grupos-navegador.mjs`,
  `asunto-sin-eleccion.mjs`) siguen en verde, ajustando lo que dependía del borrador.

## Al terminar

- `docs/CONTEXTO-CORTO.md`: sustituir la línea "Mandar documentos de un asunto por correo, con un
  borrador que deja Apps Script en Gmail" y la de "Correo y mensaje de Séneca preparados (la app
  nunca envía nada)". En la sección 8, la tarea de Francisco: "Conectar el envío en Ajustes →
  Enviar correo".
- `docs/contexto/CORREO-Y-SENECA.md`: la sección "Mandar los documentos de un asunto por correo",
  reescrita.
- Mensaje final a Francisco: qué verá, y que tiene que hacer los cinco pasos de Ajustes una vez.
