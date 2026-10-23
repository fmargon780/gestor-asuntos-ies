# Contestar con nuestro asunto (fila 441)

Diseñado con Francisco el 23-oct-2026, dentro del tema 431. Va después de la fila 440
(`docs/TODO-EL-CORREO-ENTRA.md`): toca el mismo script. Una sola sesión.

## Qué pasa hoy

Desde un asunto, el cuadro de Correo envía con `doPost` → `enviarCorreo` en
`apps-script/gestor-correos.gs`. Si todos los destinatarios ya estaban en un hilo del asunto
(`hiloParaResponder`), el correo sale con `hilo.createDraftReply(...)`: lleva «Re:» y el asunto
que puso el remitente. Lo escrito en el campo «Asunto» del cuadro (`#correo-asunto`, que trae por
defecto el asunto de la plantilla o el nombre del asunto de la app, `asuntoDelCorreo`) se ignora
sin avisar.

## Qué se pide

Que el correo salga siempre con el asunto escrito en el cuadro de Correo.

## Reglas decididas con Francisco

1. Si el asunto del cuadro es el mismo que el del primer mensaje del hilo
   (`getFirstMessageSubject`), sin contar prefijos `Re:`, `RV:`, `Fw:`, `Fwd:` (también repetidos y
   en cualquier mayúscula), mayúsculas ni espacios de más, y se cumple la regla de hoy de los destinatarios, la
   respuesta sale dentro del hilo, como hoy.
2. Si es distinto, sale como **correo nuevo** con ese asunto, aunque los destinatarios sean los
   del hilo. Quien lo recibe lo ve aparte de su conversación original; se acepta.
3. El hilo nuevo queda enganchado al asunto como cualquier correo enviado desde la app (lo
   devuelve `enviarCorreo` y `anadirHiloAlAsunto` ya lo apunta; no hace falta código nuevo aquí), para que la respuesta del tercero entre
   en el asunto y no en «Ha llegado».
4. El cuadro de Correo no cambia de aspecto. La decisión la toma solo el script, que es quien
   sabe quién ha recibido cada hilo.

## Qué hay que tocar

- `apps-script/gestor-correos.gs`: `enviarCorreo` ya recibe `cuerpo.asunto`; hoy lo ignora al
  responder dentro del hilo. Que decida con la regla 1. Como cambia `doPost`, sube `SCRIPT_ESPERADO` en `js/correo-enviar.js` y la fecha de la
  cabecera del script.
- `docs/contexto/CORREO-Y-SENECA.md`, una entrada en «Qué hay de nuevo» (`js/novedades.js`) y
  pruebas en `pruebas/` (`pruebas/envio-apps-script.mjs` ya simula `GmailApp`).
- Paso de Francisco en `docs/TE-TOCA.md` (formato de ese fichero): abrir
  https://script.google.com/home con la cuenta común de Administración, entrar en «Gestor -
  Correos», borrar todo el código, pegar el de
  https://github.com/fmargon780/gestor-asuntos-ies/blob/main/apps-script/gestor-correos.gs,
  guardar, y en «Implementar → Gestionar implementaciones» editar la implementación y elegir
  «Nueva versión». Si el paso de la fila 440 sigue sin marcar, júntalos en uno.

## Ejemplo con datos reales

Con la fila 440 ya funcionando: Francisco contesta desde la app al correo «Prueba tema 431» que se
mandó desde fmargon780@g.educaand.es, dejando el asunto que trae el cuadro. Después contesta a ese correo
desde la misma cuenta, fmargon780@g.educaand.es, que es donde lo recibe.

## Cómo sabré que está bien

1. Contestas desde un asunto a un correo recibido, dejando el asunto que trae el cuadro: el
   destinatario lo recibe con ese asunto, no con «Re:» y el suyo.
2. Si contesta a ese correo, su respuesta entra en el mismo asunto de la app.
3. Si en el cuadro escribes el mismo asunto que puso el remitente, la respuesta sale dentro de su
   conversación, como hoy.
