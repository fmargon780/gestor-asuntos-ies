# Fila 157 — «Actualizar ahora» no falla si se pulsa mientras se publica

25-sep-2026. Diseño cerrado con Francisco en la conversación.

## Qué pasó

Francisco abrió la copia sin internet (la de `file:`). La franja ámbar decía «Hay una versión
nueva del Gestor (25-sep-2026 · 10:47)». Pulsó «Actualizar ahora» hacia las 11:18 y salió:

> No se ha podido actualizar: el sha256 de js/version.js no coincide

Causa: a las 11:18 (09:18 UTC, commit `9e76e9e` de `fmargon780/gestor-asuntos-copia`) se había
publicado otra versión, la de las 11:10. La franja guardaba el `version.json` leído al abrir (el
de las 10:47), con los sha256 de entonces. Al pulsar, `descargarYEscribir` bajó el
`js/version.js` nuevo, cuyo sha256 ya era otro. Es una carrera entre la lista vieja y el fichero
nuevo. No se escribió nada roto: el control funcionó. Pero al usuario le sale un error que no
entiende. También puede pasar por la caché de `raw.githubusercontent.com` (unos 5 minutos), que
a veces sirve un fichero más nuevo o más viejo que el `version.json`.

## Qué hay que hacer (solo `js/actualizar-copia.js`, y su prueba)

1. **Al pulsar «Actualizar ahora», volver a leer el `version.json` remoto** antes de descargar
   nada, y usar ese, no el que se guardó al pintar la franja. Si la versión leída ahora es igual
   a `App.VERSION`, no descargar nada: quitar la franja y ya está. Si es distinta de la que
   decía la franja, actualizar el texto de la franja con la nueva.
2. **Si un fichero no coincide en sha256, reintentar una vez la actualización entera**: esperar
   unos segundos (5 s está bien), volver a leer el `version.json` remoto (con un parámetro que
   salte la caché, por ejemplo `?t=<Date.now()>`, también en la descarga de cada fichero del
   reintento) y repetir `actualizarEn`. Solo si el segundo intento también falla, se enseña el
   error.
3. Lo mismo para la actualización sola al abrir (`comprobar()` sin `enMarcha`): un reintento con
   lista nueva antes de dar error.
4. **El mensaje de error, en lenguaje llano**, sin «sha256»: «No se ha podido actualizar porque
   se estaba publicando una versión nueva justo ahora. Espera un par de minutos y pulsa otra vez.»
   El detalle técnico, a la consola (`console.warn`), no a la franja.
5. Nada de esto cambia la regla de oro: **ningún fichero se escribe si su sha256 no coincide**, y
   `version.json` se escribe el último.

## Prueba

Añadir a `pruebas/` (junto a la prueba de la copia sin internet, que ya usa
`window.__COPIA_BASE_REMOTO__` / `ActualizarCopia._cambiarBase`) un caso en que el servidor de
prueba sirve primero un `version.json` con un sha256 que no coincide con el fichero, y en la
segunda lectura uno bueno. Debe terminar actualizado y sin error. Otro caso en que falla las dos
veces: la franja enseña el mensaje llano, y el disco no se ha tocado (sigue el `version.json`
viejo).

## Qué verá Francisco

Nada nuevo en pantalla. Si pulsa «Actualizar ahora» justo mientras se publica, se actualiza igual
(tarda unos segundos más). Si aun así falla, un mensaje que se entiende.
