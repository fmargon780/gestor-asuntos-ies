# 541 — Que las pruebas arranquen

## Lo que escribió Francisco
Tema: Que las pruebas arranquen. Junta las ideas 537 (solo la parte de las pruebas) y 542: que `npm test` no se caiga al arrancar con el fallo de `undici`, sin depender del remedio a mano de `docs/LECCIONES.md`, y aclarar si las pruebas de guías que fallan también en `main` (cambiar-tipo-y-guia, editor-de-la-guia-tareas, nuevo-asunto-categoria-guia, hacer-este-hito) son del entorno o de la app, para dejar la pasada completa funcionando. La parte de Vercel se queda fuera porque no ha vuelto a pasar.

## Lo que entendió Claude (acordado con Francisco el 9-nov-2026)
- Tarea pequeña: arreglo de las pruebas. En la app no cambia nada de lo que se ve ni de lo que hace la usuaria.
- `npm test` arranca y termina sin caerse con el fallo de `undici`, sin ningún remedio a mano (ni repetir, ni matar servidores, ni `NODE_OPTIONS`).
- Lo que vio Claude el 9-nov-2026 al lanzar las pruebas en una sesión:
  - La caída con `assert(!this.paused)` de `undici` se repite y la produce el `fetch` de Node 22, no la app.
  - `cambiar-tipo-y-guia` y `editor-de-la-guia-tareas` pasan enteras lanzadas a mano (`DIRECCION=… node pruebas/<f>.mjs`): fallaban solo por esa caída. Son del entorno.
  - `nuevo-asunto-categoria-guia` falla por sí misma: `page.evaluate: NotFoundError` en `getDirectoryHandle` (línea 51), busca una carpeta de prueba que ya no existe. La prueba está desfasada.
  - `hacer-este-hito` (ya en `RETIRADAS`) falla ahora por otro motivo: en el apartado 7 («solo consultar») no puede pulsar `#ficha-guia .hito .hito-titulo` porque no está visible; seguramente por los recuadros de la fila 553. La prueba está desfasada.
- Las dos pruebas desfasadas se ponen al día con cómo es hoy la app, sin cambiar la app.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- La parte de Vercel de la idea 537 (las herramientas de Vercel que daban timeout): no ha vuelto a pasar.
- Las demás pruebas de `RETIRADAS` que no son de guías: se quedan como están.
- Ningún cambio en la app (`js/`, `index.html`, `css/`). Si al poner al día una prueba aparece un fallo real de la app, no se arregla aquí: se apunta como IDEA nueva en la cola y la prueba queda en `RETIRADAS` con el motivo nuevo.

## Notas técnicas de Claude
- Causa: el `fetch` de Node 22 (undici) lanza una excepción no capturada contra el servidor local de `python3 -m http.server`. Mata el proceso; no se puede atrapar con `try`.
- Arreglo: un ayudante en `pruebas/apoyo/` (por ejemplo `pedir.mjs`) que haga la petición con `node:http` / `node:https` y devuelva `{ ok, status, text() }` (y `json()` si alguna prueba lo usa). Sustituir con él todos los `fetch(` de `pruebas/ejecutar.mjs` (`servidorListo`) y de las pruebas que lo usan: `actividades-certificado`, `archivar-no-cabe`, `asuntos-reservados`, `campos-sin-anadir-al-nombre`, `consejo-escolar`, `ficha-entrega-libros`, `genero`, `guardado-pendiente`, `ruta-larga-avisa`, `tablas-datos`, `tutor-desde-el-centro-de-datos` (comprobar antes con `grep -n "fetch(" pruebas/*.mjs` que no se escapa ninguna; los `fetch` que corren dentro del navegador, en `page.evaluate`, no se tocan).
- `nuevo-asunto-categoria-guia`: mirar qué carpeta espera en la línea 51 y qué crea hoy la app en la demostración; ajustar la prueba a eso.
- `hacer-este-hito`: ajustar el apartado 7 a cómo se ven hoy los hitos de la guía (abrir el recuadro o pulsar el elemento visible). Si pasa entera, sacarla de `RETIRADAS`. Si sigue fallando por la app (lo que ya decía su motivo: «esperando-sello»), dejarla en `RETIRADAS` con el motivo al día.
- `docs/LECCIONES.md` de la app: quitar las tres filas de `undici` (4, 5 y 6-nov-2026) en el mismo commit; ya no hacen falta.
- No se toca nada de la app, así que no hay versión nueva, ni línea en `js/novedades.js`, ni publicación en Vercel. La fila pasa a HECHA cuando el commit está en `main`.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor. Claude Code lo comprueba él mismo:
- `npm test` (pasada completa) arranca y termina sin la caída de `undici`, dos veces seguidas.
- `npm test -- cambiar-tipo-y-guia editor-de-la-guia-tareas nuevo-asunto-categoria-guia hacer-este-hito` en verde (o `hacer-este-hito` en `RETIRADAS` con su motivo nuevo).
- `grep -n "fetch(" pruebas/*.mjs pruebas/apoyo/*.mjs` solo devuelve `fetch` dentro del navegador.
- `git diff main --stat` no toca nada fuera de `pruebas/` y `docs/`.

## Qué mirar al terminar
- En la nota de la fila 541 de la cola: que la pasada completa terminó sin caerse y cuántas pruebas pasaron.
- Si `hacer-este-hito` sigue apartada, el motivo en una línea y, si aparece, el número de la IDEA nueva.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
