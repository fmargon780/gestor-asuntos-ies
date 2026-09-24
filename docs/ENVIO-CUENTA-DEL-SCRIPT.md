# Fila 117 — El envío de correo: que funcione con la aplicación web publicada de verdad

Apuntada el 24-sep-2026. Francisco conectó el envío (fila 115, `docs/ENVIAR-DESDE-EL-ASUNTO.md`)
con la cuenta del centro, en el instituto, y salieron tres fallos. Es un arreglo, no un diseño
nuevo: Francisco confirmó que se apuntara.

## Lo que pasó, en orden

1. `prepararEnvio()` dio una dirección terminada en **`/dev`**
   (`https://script.google.com/a/g.educaand.es/macros/s/<id corto>/dev?k=…`).
   `ScriptApp.getService().getUrl()`, ejecutado desde el editor, devuelve la dirección de pruebas
   de la implementación "head", no la de la implementación publicada. Esa dirección solo funciona
   con la sesión del dueño abierta: desde la aplicación, «Probar» dio `Failed to fetch`.
2. Cambiar `/dev` por `/exec` con el mismo identificador tampoco vale: comprobado con `curl`,
   Google responde 302 a la página de inicio de sesión (el id corto es el de "head").
3. Con la URL de «Implementar → Gestionar implementaciones» (la de verdad, `/exec`, acceso
   «Cualquier usuario») más `?k=<clave>`, la llamada **sí llega** y la clave se acepta, pero
   «Probar» responde **«No hay ningún destinatario.»**. Motivo: con acceso «Cualquier usuario»,
   `Session.getActiveUser().getEmail()` devuelve cadena vacía (Google no dice al script quién
   llama). En `enviarCorreo()` se usa para la prueba y para el «Para» cuando solo hay copia oculta.

## Qué hay que cambiar

### `apps-script/gestor-correos.gs`

- En todo lo que se ejecuta dentro de `doPost` (`enviarCorreo`, `hiloParaResponder` y lo que
  llamen), usar **`Session.getEffectiveUser().getEmail()`** (la cuenta que ejecuta: «Ejecutar
  como: Yo», la del centro) en vez de `getActiveUser()`. Mejor una función pequeña `miCorreo()`
  que devuelva `getEffectiveUser()` y, si viniera vacío, `getActiveUser()`; y usarla también en
  `guardarHilo`, `direccionesDelHilo`, `enlaceAlHilo` y `enlaceABorradores` para que todo el
  fichero diga lo mismo.
- `prepararEnvio()`: no fiarse de `getUrl()`. Si la dirección termina en `/dev` o no hay
  dirección, escribir en el registro **la clave sola** y una línea clara: «Copia la URL de
  Implementar → Gestionar implementaciones (termina en /exec), y pégala en Ajustes → Enviar
  correo; añade al final ?k=<clave>». Si `getUrl()` diera una `/exec`, puede seguir dando la línea
  completa como ahora.
- Actualizar la cabecera del fichero con la fecha y una línea de qué cambió (así Francisco sabe si
  la copia pegada en script.google.com está vieja).

### `js/correo-enviar.js` (bloque de Ajustes → Mantenimiento → Enviar correo)

- Al **guardar** o **probar** una dirección que termine en `/dev` (con o sin `?k=`): no llamar a
  Google; aviso rojo: «Esa es la dirección de pruebas. Copia la de Implementar → Gestionar
  implementaciones, que termina en /exec».
- Si la dirección no lleva `?k=`: aviso rojo pidiendo añadirla, sin llamar.
- Cambiar los pasos del texto de ayuda: paso 4, la URL se copia de «Implementar → Gestionar
  implementaciones»; `prepararEnvio` solo sirve para sacar la clave. Paso 5, pegar
  `URL?k=clave`.
- **Quitar la nota** de «Cualquier usuario de la organización»: con esa opción Google pide
  iniciar sesión y la llamada desde el navegador falla siempre. Poner en su lugar: «Si no aparece
  "Cualquier usuario", la cuenta del centro no deja publicar así y el envío no puede funcionar;
  díselo a Claude».
- Añadir el paso de siempre al actualizar el script: tras pegar código nuevo, «Gestionar
  implementaciones → lápiz → Versión: Nueva versión → Implementar» (así se conserva la misma
  dirección y no hay que volver a pegarla en Ajustes).

### Pruebas y documentación

- `pruebas/envio-apps-script.mjs`: la prueba con `getActiveUser()` vacío y `getEffectiveUser()`
  con correo; «Probar» y un envío solo con copia oculta deben mandar a la cuenta efectiva.
  `prepararEnvio()` con `getUrl()` terminado en `/dev`: registra la clave y la instrucción, no la
  dirección `/dev`.
- `pruebas/correo-enviar.mjs`: `/dev` y falta de `?k=` avisan sin llamar a `fetch`.
- `docs/COMPROBAR-A-MANO.md`: corregir los cinco pasos de «Conectar el envío de verdad» igual que
  el texto de Ajustes.

## Qué verá Francisco al final

Tendrá que hacer esto una vez (dejarlo escrito en el mensaje final, en pocos pasos):

1. Copiar otra vez `apps-script/gestor-correos.gs` en el proyecto «Gestor - Correos» y guardar.
2. «Implementar → Gestionar implementaciones → lápiz → Versión: Nueva versión → Implementar».
3. En el gestor, Ajustes → Enviar correo → «Probar». La dirección que ya tiene guardada sirve
   (misma implementación, misma clave): no hay que pegar nada nuevo.
4. Le llega el correo de prueba a la bandeja de entrada de la cuenta del centro.

## Cómo trabajar

- Cambios quirúrgicos; solo estos ficheros y `docs/CONTEXTO.md` o su hijo del correo.
- Reglas de la cola: una o dos subidas; al terminar, `CONTEXTO-CORTO.md` (sección 8: la línea de
  «Conectar el envío») y `HISTORIA.md`.
