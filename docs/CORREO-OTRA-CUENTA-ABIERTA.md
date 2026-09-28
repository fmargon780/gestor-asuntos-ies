# Fila 217 — Enviar correo con otra cuenta de Google abierta en el navegador

Diseñada con Francisco el 28-sep-2026 (Cowork). Es un arreglo pequeño, en `js/correo-enviar.js`.

## Lo que pasó

El primer correo del día falló, y volvió a fallar al repetirlo, con este aviso:

> No he podido enviarlo: No he podido contactar con Google: Failed to fetch

Francisco tenía abierta en el navegador su cuenta personal de Google, no la del centro
(`g.educaand.es`), que es la dueña del script de envío (`apps-script/gestor-correos.gs`).
Con la dirección del script en su forma de dominio
(`https://script.google.com/a/g.educaand.es/macros/s/<id>/exec` o
`https://script.google.com/a/macros/g.educaand.es/s/<id>/exec`), Google responde con una
redirección a la página de inicio de sesión. Esa respuesta no trae cabeceras CORS, así que
`fetch` se rechaza con `TypeError: Failed to fetch` y la app enseña ese texto en inglés, sin
decir qué hacer. Es el mismo síntoma que ya se vio en la fila 117 (`docs/ENVIO-CUENTA-DEL-SCRIPT.md`,
punto 2: `curl` daba 302 a la página de inicio de sesión).

## Lo que decidió Francisco

1. **Un aviso claro** en lugar de «Failed to fetch».
2. **Intentar que el envío funcione tenga abierta la cuenta que tenga.** Si Google no lo permite,
   se queda solo el aviso claro.

## Qué hay que cambiar

### 1. El aviso (`js/correo-enviar.js`, función `llamar`)

En la rama `catch` que hoy devuelve `'No he podido contactar con Google: ' + …`, cuando el error
no es `AbortError` (el que no es de tiempo agotado: en la práctica, `TypeError`), el motivo pasa a
ser exactamente este:

> Google no ha dejado pasar el envío. Lo más habitual es que en este navegador esté abierta otra
> cuenta de Google. Entra con la cuenta del centro (g.educaand.es) y vuelve a pulsar «Enviar».
> Si sigue fallando, mira que haya conexión a internet.

- El dominio `g.educaand.es` no se escribe a mano en el código: se saca de la propia dirección
  guardada (el trozo después de `/a/` o de `/a/macros/`). Si la dirección no lo trae, la frase
  dice «Entra con la cuenta de Google del centro».
- Nada de «Failed to fetch» ni de ningún texto en inglés en pantalla.
- Volver a pulsar «Enviar» en el mismo cuadro es seguro: el cuadro reutiliza su `idEnvio` y el
  script no manda dos veces el mismo (fila 178). No añadir el aviso de «mira en Enviados» en este
  caso; ese sigue solo para el tiempo agotado (`sinSaber`), como ahora.
- El mismo aviso sale en «Probar» de Ajustes › Enviar correo (usa `llamar`, así que sale solo;
  comprobarlo).
- Respetar `pruebas/palabras-prohibidas` (o como se llame la prueba de vocabulario de la fila
  190) y `docs/VOCABULARIO.md`.

### 2. Que no dependa de la cuenta abierta (`js/correo-enviar.js`)

La forma general de la dirección, `https://script.google.com/macros/s/<id>/exec`, no obliga a
iniciar sesión cuando la implementación tiene acceso «Cualquier usuario» (que es como está, fila
117). Por eso:

- Nueva función `formaGeneral(url)`: si la dirección es de dominio (las dos formas de arriba),
  devuelve la general con el mismo `<id>` y la misma consulta (`?k=…`); si no, devuelve `''`.
- En `llamar`: si hay forma general, **se prueba primero con ella**. Solo si esa llamada acaba en
  `TypeError` (no en tiempo agotado ni en una respuesta de Google, sea buena o de error), se
  repite **una vez** con la dirección guardada tal cual, con el mismo cuerpo (mismo `idEnvio`:
  el script descarta el duplicado si la primera hubiera llegado a enviar). Si las dos fallan, el
  aviso del punto 1.
- Si la forma general contesta bien (JSON válido del script), se guarda en
  `localStorage` como dirección de envío en vez de la de dominio, para no volver a probar dos cada
  vez. Si la forma general falla y la de dominio funciona, se deja la de dominio y se recuerda en
  `localStorage` (clave aparte) que la general no vale en este ordenador, para no gastar el
  intento siempre.
- El límite de tiempo (`LIMITE_MS`) cuenta para todo el envío, no para cada intento por
  separado.
- `problemaDeDireccion` sigue igual (`/dev`, falta de `?k=`).
- Anotar en `docs/COMPROBAR-A-MANO.md` una línea: «Con la cuenta personal abierta en el navegador,
  pulsar Probar en Ajustes › Enviar correo: debe llegar el correo de prueba; si no, debe salir el
  aviso claro».

No se puede comprobar con la dirección real desde aquí (vive en el navegador de Francisco). Si
algo de lo anterior resulta imposible de hacer bien sin ella, se hace solo el punto 1 y se deja
anotado en «Lo que queda por hablar con Francisco» de `docs/COLA.md`.

### 3. Pruebas (`pruebas/correo-enviar.mjs`)

- `fetch` que se rechaza con `TypeError('Failed to fetch')` → el motivo es el aviso nuevo, con el
  dominio sacado de la dirección, y sin «Failed to fetch».
- Dirección de dominio: la primera llamada va a la forma general; si responde bien, no hay
  segunda llamada y la dirección guardada pasa a ser la general.
- Dirección de dominio con la forma general rechazada por `TypeError` y la de dominio bien: dos
  llamadas, mismo cuerpo (mismo `idEnvio`), y queda recordado que la general no vale.
- Tiempo agotado (`AbortError`) o respuesta HTTP de error: una sola llamada, sin repetir.
- Dirección ya general: una sola llamada, como ahora.

## Qué verá Francisco

Si vuelve a tener abierta su cuenta personal, lo normal será que el correo salga igual. Si Google
no lo deja pasar, verá un aviso en castellano que le dice que entre con la cuenta del centro y
vuelva a pulsar «Enviar».
