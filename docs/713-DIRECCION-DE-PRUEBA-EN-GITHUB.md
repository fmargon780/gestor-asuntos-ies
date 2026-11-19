# 713 — Dirección de prueba que abra en el instituto

**Título llano:** Una dirección de prueba que abra también en el instituto
**Para qué:** poder mirar la versión nueva con datos inventados desde la red del instituto, que bloquea `fmargon.com`, y sin el login de Vercel.

## Lo que escribió Francisco (19-nov-2026)
«Estoy en el instituto, los dominios fmargon.com se bloquean en la red de la Junta de Andalucía. Ya ha pasado en otras apps. Se ha solucionado cambiando de dominio a uno de github que sí está permitido.»

Preguntado si el cambio era solo para la prueba o también para producción, eligió hacerlo solo en la dirección de prueba y apuntar producción como idea aparte.

## Lo que entendió Claude (acordado con Francisco el 19-nov-2026)
- La dirección de prueba pasa a ser `https://fmargon780.github.io/gestor-asuntos-ies/`, publicada por GitHub (Pages), no por Vercel.
- Funciona igual que hoy `pruebas.fmargon.com`: entra sola en demostración, con datos inventados, y no ofrece señalar carpetas de verdad.
- Enseña una sola versión a la vez: la de la última fila grande aprobada por el segundo revisor, con su rama `fila-<nº>`.
- El camino de una fila grande no cambia: revisor → dirección de prueba → `ESPERA TU VISTAZO` → vistazo → `PENDIENTE` «vista» → fusionar y publicar en producción. Solo cambia la dirección.
- `pruebas.fmargon.com` se deja de usar para esto.
- Producción no cambia: sigue en `https://asuntos.fmargon.com`, publicada por Vercel, y la copia sin internet sigue igual.
- Visto por Claude el 19-nov-2026: en el Chrome conectado, `github.io` se abre y la extensión puede leerlo; `pruebas.fmargon.com` no deja leer.

## Pantalla de prueba
- Sin pantalla: no cambia ninguna pantalla de la app.

## Qué NO se hace en esta tarea
- Mudar producción a GitHub (idea aparte, fila 714).
- Cambiar la copia sin internet.
- Cambiar los datos de la demostración (fila 711).

## Notas técnicas de Claude
- Publicar con una acción de GitHub nueva (por ejemplo `.github/workflows/pruebas-pages.yml`) que se lanza a mano con la rama como dato (`workflow_dispatch`, entrada `rama`), sube a Pages **solo la app** (lo mismo que deja fuera `.vercelignore`: sin `docs/`, `pruebas/`, `plantilla/`, `apps-script/`, `herramientas/`, `.github/`) y no se dispara con cada subida. Desde la sesión se lanza con `gh workflow run` y se espera a que termine.
- La app se sirve bajo `/gestor-asuntos-ies/`: comprobar que nada carga con rutas que empiecen por `/` (mirado el 19-nov-2026: en `js/` e `index.html` no se vio ninguna, pero `js/demo/` y los `fetch` de datos hay que mirarlos).
- `soloEnPruebas()` de `js/demo/franja.js` reconoce también `location.hostname === 'fmargon780.github.io'`. Quitar `pruebas.fmargon.com` de ahí no hace falta.
- Comprobar que en Pages se cargan `js/demo/` y los ficheros de datos de la demostración (Pages no sirve lo que empieza por `_` salvo con `.nojekyll`: añadirlo a lo publicado).
- Activar Pages con fuente «GitHub Actions» es un paso de Francisco si la sesión no puede (`docs/METODO-COMUN.md` 9): fila `IDEA (fecha · paso de Francisco)` con el enlace https://github.com/fmargon780/gestor-asuntos-ies/settings/pages, y esta fila `ESPERA A LA IDEA M`. Si la acción tampoco se puede subir (permiso de `.github/workflows`), `docs/METODO-COMUN.md` 3.C.
- No gasta publicaciones de Vercel: quitar de `CLAUDE.md` lo de «una publicación más por fila grande» y el 402 de la dirección de prueba.
- Cambiar en `CLAUDE.md` el apartado «La dirección de prueba» y las menciones a `pruebas.fmargon.com` del apartado «El revisor»; en `docs/CONTEXTO-CORTO.md` (apartado 1) la línea de la dirección de prueba; `docs/HISTORIA.md`.
- Prueba: ampliar `pruebas/copia-de-pruebas.mjs` con `hostname` simulado `fmargon780.github.io`: entra en demostración sin `?demo=1` y sin botón de señalar carpetas.
- Línea en `js/novedades.js`: no.

## Cómo lo comprueba el segundo revisor
- `https://fmargon780.github.io/gestor-asuntos-ies/` abre sin login, entra sola en demostración, con la franja «Copia de pruebas» y asuntos en Inicio.
- No hay ningún botón para señalar carpetas de verdad.
- `?demo=1&auto=1&grande=1` también funciona allí.
- En lo publicado no están `docs/`, `pruebas/` ni `.github/`.
- `https://asuntos.fmargon.com` no ha cambiado.
- `CLAUDE.md` dice la dirección nueva y cómo se publica en ella.

## Qué mirar al terminar
- Lo mira Claude con Chrome: la dirección nueva entra en demostración, sin señalar carpetas.
- Tú, en el instituto: abre `https://fmargon780.github.io/gestor-asuntos-ies/` y mira que abre.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
