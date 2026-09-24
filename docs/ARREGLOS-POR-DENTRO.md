# Fila 132 — Arreglos por dentro

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 1, puntos D, F y G, y Parte 2, «tres formas de elegir destinatarios»). Diseño cerrado con Francisco el 24-sep-2026.

No cambia nada de lo que se ve. Son cinco arreglos pequeños que van juntos porque ninguno tiene
pantalla propia.

## Reglas de esta fila

- **No leas el repositorio entero.** Lee `docs/CONTEXTO.md`, el hijo de `docs/contexto/` que se
  cita y los ficheros de la lista. Si con `grep` aparece otro fichero que haga falta tocar, tócalo y
  apúntalo en la documentación.
- **Cambios quirúrgicos.** No reescribas ficheros enteros. Lo nuevo va en ficheros nuevos y
  pequeños (menos de 400 líneas), enganchados por un punto previsto, no envolviendo.
- Sube directamente a `main`, sin pull request (o según la nota de la cola si la sesión no puede).
  Dos subidas como mucho (regla 13 de la cola).
- **Una sola tanda de pruebas al final**, con la batería completa en verde.
- Todo guardado de `_GESTOR` por `ColaGuardado`. Todo fallo accesorio, en ámbar, sin parar lo
  principal.
- Al terminar: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` que toque,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`, sustituyendo lo viejo.

Contexto: `docs/contexto/PERSONAS.md`, `docs/contexto/ESTADO-DEL-ASUNTO.md`,
`docs/contexto/CORREO-Y-SENECA.md`.

## Ficheros que se tocan

- `js/datos.js`, `js/conflictos.js` (punto 1)
- `js/ajustes-centro.js`, `js/nucleo.js`, `js/papelera.js`, `js/archivo-indice.js`,
  `js/archivo-personas.js` y los que lean `situacion` o `App.E.estados` (punto 2)
- `vercel.json` (punto 3)
- `js/lib/pdf.min.mjs`, `js/lib/pdf.worker.min.mjs` (punto 4)
- Nuevo `js/destinatarios.js`; `js/hitos-comunicar.js`, `js/correo-cuadro.js`,
  `js/seneca-destinatarios.js`; `index.html` (punto 5)
- Prueba nueva: `pruebas/arreglos-por-dentro.mjs`

## 1. Los terceros se releen solos

La caché de `Datos` (`CACHE` en `js/datos.js`) no caduca en toda la sesión. Si el compañero da de
alta a alguien o carga un `RegAlum.csv` nuevo, no se ve hasta recargar.

- En la misma revisión periódica de `js/conflictos.js` (cada cinco minutos), mirar la fecha de
  modificación de los CSV de `_GESTOR/datos`. Si alguno ha cambiado desde la última lectura,
  `Datos.olvidar` de esa categoría. Nada más: la siguiente vez que se pida, se relee.
- Nunca con un guardado en marcha (`ColaGuardado.hayGuardado()`).
- No se repinta nada por esto.

## 2. Fuera el código de los estados manuales

Desde la fila 129 el estado es el hito. Sigue vivo el código de la tabla de estados de Ajustes
(`App.pintarTablaEstados` y lo que cuelga de ella en `js/ajustes-centro.js`, que ya no pinta nada
porque `#tabla-estados` no existe en `index.html`), `App.E.estados` en `js/nucleo.js` y su fusión
en `js/papelera.js`.

- Quitarlo, con cuidado de no romper `js/estado-migracion.js`, que sigue leyendo `estados.json`
  para los asuntos que aún no se han pasado.
- Revisar con `grep` todo lo que lee `situacion` de una ficha. En asuntos **abiertos**, que lea el
  hito actual (`Hitos.estadoDelAsunto`). En asuntos **archivados** antes de la fila 129 se puede
  seguir enseñando el estado viejo, como dato histórico.
- `estados.json` no se borra del Dropbox.

## 3. Cabeceras de seguridad

En `vercel.json`, para todas las rutas, además de `Cache-Control`:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'`

**No** poner una política de scripts o de conexiones más estricta: la aplicación llama a Apps
Script, usa `blob:` para los PDF y tiene manejadores en línea; una política estricta la rompería
sin que las pruebas lo vean. Comprobar después con `curl -I` que las cabeceras salen.

## 4. El lector de PDF al día

`js/lib/pdf.min.mjs` es pdf.js 4.2.67. Pasarlo a la última de la serie 4 (4.10.38), el lector y
su trabajador a la vez. **No** a la serie 5. Las pruebas de separar, unir, ajustar tamaño y leer
PDF tienen que seguir en verde.

## 5. Una sola regla para los destinatarios

Hoy deciden «a quién se envía» tres sitios distintos: `resolverDestinatario` de
`js/hitos-comunicar.js`, `bloqueDestinatarios` de `js/correo-cuadro.js` y
`js/seneca-destinatarios.js`. Si cambia una regla, las otras no se enteran.

- Nuevo `js/destinatarios.js` con la regla común: a partir del asunto, devuelve la lista de
  personas posibles (tercero, tutores legales, «Lo pide», relacionados, grupos) con su correo y su
  marca de si va por defecto.
- Los tres sitios la usan. Cada uno sigue pintando su propio cuadro como hoy.
- Lo que ve Francisco no cambia. Si al unificar aparece una diferencia entre los tres, manda la de
  `js/correo-cuadro.js` y se apunta en `docs/HISTORIA.md`.

## 6. La prueba

`pruebas/arreglos-por-dentro.mjs`: la caché se olvida cuando cambia la fecha del CSV; no queda
ninguna referencia a `pintarTablaEstados`; `vercel.json` lleva las tres cabeceras; los tres
módulos de destinatarios dan la misma lista para el mismo asunto.
