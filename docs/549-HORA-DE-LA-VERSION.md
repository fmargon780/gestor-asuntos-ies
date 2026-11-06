# 549 — La hora de la versión, siempre la real

## Lo que escribió Francisco

Al actualizar la copia sin internet en el instituto, el 6-nov-2026 a las 8:28:

> No te parece rara la fecha y hora de la versión nueva?

(El aviso decía «Hay una versión nueva del Gestor (6-nov-2026 · 12:30)» a las 8 de la mañana.)

## Lo que entendió Claude (acordado con Francisco el 6-nov-2026)

- La fila 546 dejó en `js/version.js` la hora «6-nov-2026 · 12:30», cuando su commit es de las
  05:24 (hora de España). Las filas anteriores la pusieron bien. Es la que ve la copia sin
  internet en su aviso de versión nueva y en la cabecera.
- La versión que se ve tiene que llevar siempre la hora real de España del momento en que se
  sube el cambio, sin escribirla a mano.
- La versión equivocada de hoy se corrige sola con la siguiente publicación, que pondrá la hora
  real.
- Lo que desaparece o se sustituye: nada de lo que se ve.

## Pantalla de prueba

Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea

- Lo de que la copia sin internet se quede «Actualizando…» sin terminar si un fichero se cuelga
  (pasó también el 6-nov-2026): no está pedido aquí.

## Notas técnicas de Claude

- La regla ya existe (comentario de `js/version.js` y regla 4 de `docs/COLA.md`), pero se
  escribe a mano y la fila 546 no la cumplió.
- Un programa pequeño, `scripts/poner-version.mjs`, que escribe la línea `App.VERSION` con la
  hora de España del reloj (`Intl.DateTimeFormat` con `timeZone: 'Europe/Madrid'`), con el
  mismo formato de hoy (`6-nov-2026 · 05:24`). Las filas lo ejecutan en vez de escribir la hora.
  Cambiar el comentario de `js/version.js`, la regla 4 de `docs/COLA.md` y `CLAUDE.md` si lo
  repite, para que digan que se usa ese programa.
- Una prueba en `pruebas/` que falle si `App.VERSION` está más de 15 minutos por delante de la
  hora real al pasar la tanda, para que una hora inventada no llegue a `main`.
- Esta propia fila deja la hora real con el programa nuevo.

## Cómo lo comprueba el segundo revisor

- Ejecutar `scripts/poner-version.mjs` deja en `js/version.js` la hora real de España, con el
  formato de siempre.
- Con una hora puesta a mano por delante de la real, la prueba nueva falla; con la del programa,
  pasa.
- `js/version.js`, la regla 4 de `docs/COLA.md` y `CLAUDE.md` mandan usar el programa.
- Publicada la fila, la copia sin internet y `asuntos.fmargon.com` enseñan una hora que no está
  por delante de la real.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
