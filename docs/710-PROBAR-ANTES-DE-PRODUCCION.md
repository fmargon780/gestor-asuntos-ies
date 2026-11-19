# 710 — Probar la versión nueva antes de que llegue a producción

**Título llano:** Probar la versión nueva antes de que llegue a producción
**Para qué:** que Francisco, o Claude con la extensión de Chrome, puedan entrar en la versión nueva con datos inventados y probarla de todo tipo antes de que Diego y Francisco la usen en producción.
**Partes:** esta es la primera de dos; la segunda es la 711 (datos inventados del tamaño de un instituto y con casos raros). No dependen una de otra.

## Lo que escribió Francisco (19-nov-2026)
«Necesitamos una app de pruebas donde yo directamente o tú con la extensión de Claude en Chrome podamos hacer pruebas de todo tipo sobre los últimos cambios hechos en la app antes de pasarlos a la versión de producción.»

«Yo no necesito que tú veas datos reales. ¿Podemos hacerlo todo con datos inventados y casos inventados? Lo que sí creo que es interesante es probar antes de pasar a la versión de producción.»

Eligió la opción «1»: producción espera a la mirada de Claude solo en las filas grandes, las que ya llevan segundo revisor. «Hazlo, pero ponlo lo primero de la lista para poder empezar ya.»

## Lo que entendió Claude (acordado con Francisco el 19-nov-2026)
- **Solo las filas grandes** (las que llevan segundo revisor). Las pequeñas siguen como hoy: sin dirección de prueba y sin espera.
- Con la **APROBADA del segundo revisor** y **antes de fusionar en `main`**, la sesión publica esa versión (la rama `fila-<nº>`) en una **dirección de prueba abierta**, sin login de Vercel, y pasa la fila a `ESPERA TU VISTAZO`. En la nota de la fila escribe la dirección, el número de la fila y la versión (`App.VERSION`) publicada.
- Francisco, o Claude desde el chat con la extensión de Chrome, entran con `?demo=1&auto=1` y pasan «Qué mirar al terminar» de la instrucción de la fila. **Todo con datos inventados**: Claude no ve ni recibe nunca datos reales.
- Cómo sigue la fila después del vistazo, con los estados que ya existen y sin inventar ninguno:
  - **Está bien:** Claude, desde el chat, pasa la fila a `PENDIENTE` con «vista (fecha, por Claude)» al principio de la nota. El siguiente lanzamiento de Claude Code **no programa nada**: fusiona la rama en `main`, publica en producción como siempre y marca la fila HECHA.
  - **Falla algo:** la fila pasa a `DEVUELTA` con lo que falla, y Claude Code la retoma desde su rama, como cualquier fila DEVUELTA.
- **Una sola fila grande espera a la vez**, porque la dirección de prueba enseña una sola versión. Mientras haya una fila en `ESPERA TU VISTAZO`, la sesión no empieza otra fila grande (las pequeñas siguen). Al fusionar, si `main` ha cambiado, se actualiza la rama y se repiten las pruebas de lo tocado.
- **En esa dirección la app solo entra en demostración.** Aunque falte `?demo=1`, entra en demostración y **no ofrece señalar carpetas de verdad**: una versión sin aprobar nunca puede escribir en los datos reales. Francisco notará solo que en esa dirección no sale el botón de señalar carpetas.
- Producción no cambia: `https://asuntos.fmargon.com` sigue sin franja, sin botón de demostración y sin descargar `js/demo/`.
- Esta fila **no se espera a sí misma**: se publica por el camino de siempre. Su prueba es la primera fila grande que se haga después.

## Pantalla de prueba
- Sin pantalla: no cambia ninguna pantalla de la app, salvo que en la dirección de prueba no sale el botón de señalar carpetas de verdad.

## Qué NO se hace en esta tarea
- Datos de demostración grandes y casos raros: es la fila 711.
- Copiar datos reales, ni cambiándoles los nombres (idea 496, descartada el 19-nov-2026).
- Poner espera en las filas pequeñas.
- Que la espera pare la cola de noche en las filas pequeñas, o que Claude Code publique solo tras el vistazo sin un nuevo lanzamiento.
- Una dirección de prueba por fila (solo una, la última).

## Notas técnicas de Claude
**Mirado el 19-nov-2026 (no repetir a ciegas, volver a comprobar al empezar):**
- Proyecto de Vercel `gestor-de-asuntos` (`prj_cMhYvmPZnoZayDBxEPyVoWFE5nRq`), equipo `team_gnCjBLTS8m8PNTFVUf7ST0uN`.
- La protección con login de Vercel está en «todas menos los dominios propios» (`all_except_custom_domains`): las direcciones `*.vercel.app` piden login, **un dominio propio como `pruebas.fmargon.com` no**.
- `pruebas.fmargon.com` ya es un dominio del proyecto, pero atado a la rama `pruebas`, que ya no existe: hoy redirige al login de Vercel. No hay «entornos propios» de Vercel (límite 0 en la cuenta), así que no es el camino.
- Hay herramientas de Vercel para asignar un dominio a una publicación (`assign_alias`) y para pasar una publicación a producción (`request_promote`).

**Cómo (la sesión decide los detalles):**
- Publicar la rama `fila-<nº>` como publicación **de prueba, no de producción** (`create_deployment`, `gitSource` con `ref: fila-<nº>`, sin `target: production`) y asignarle `pruebas.fmargon.com`. Si el dominio atado a la rama `pruebas` lo impide, quitarle esa atadura y dejarlo como dominio normal del proyecto. `vercel.json` sigue con `git.deploymentEnabled: false` y sin `ignoreCommand`.
- Si la herramienta no puede hacerlo o hace falta un clic en el panel de Vercel, no se pide a Francisco en el chat: se añade una fila `IDEA (fecha · paso de Francisco)` con el enlace directo a la página exacta (`docs/METODO-COMUN.md`, apartado 9) y la fila queda `ESPERA A LA IDEA M`.
- Cuesta **una publicación más por fila grande** (tope de 100 al día de toda la cuenta de Vercel). Si responde 402, no se reintenta: esa fila sigue el camino de siempre (fusionar y publicar) y la nota dice «sin vistazo previo: tope de Vercel».
- Probar si `request_promote` permite llevar a producción **esa misma publicación** sin construirla otra vez. Si no queda claro que sea la misma versión de `main`, se usa `create_deployment` como hoy y no se gasta tiempo en esto.
- En la app, el cambio de «solo demostración» va en el mismo punto de entrada que ya decide cuándo cargar `js/demo/` (`docs/COPIA-DE-PRUEBAS.md`, apartado 3): por `location.hostname === 'pruebas.fmargon.com'`, sin condiciones repartidas por los módulos.
- Cambiar `CLAUDE.md`: el apartado «El revisor» y «Vercel no publica nada solo» pasan a decir el camino nuevo (revisor → dirección de prueba → `ESPERA TU VISTAZO` → vistazo → `PENDIENTE` «vista» → fusionar y publicar). Una fila `PENDIENTE` cuya nota empieza por «vista (» se **fusiona y se publica, no se programa**. Si el entorno niega editar `CLAUDE.md`, vale `docs/METODO-COMUN.md` 3.C (documento en `docs/` y `FALTA UN PERMISO`).
- Poner al día: `docs/CONTEXTO-CORTO.md` (apartado 1: la dirección de prueba y que ya no hay rama `pruebas`; apartado 6), `docs/COPIA-DE-PRUEBAS.md` (nota al principio) y `docs/HISTORIA.md`.
- `docs/COLA.md`: `ESPERA TU VISTAZO` ya existe en los estados de `docs/METODO-COMUN.md` y en `comprueba-cola.js`.
- Línea en `js/novedades.js`: **no** (no cambia nada que vean Diego ni Francisco en producción).
- Prueba nueva `pruebas/copia-de-pruebas.mjs` (o ampliar la que ya hay): con `hostname` simulado `pruebas.fmargon.com` y sin `?demo=1` entra en demostración y no existe el botón de señalar carpetas; con `asuntos.fmargon.com` no existe `window.Demo`.

## Cómo lo comprueba el segundo revisor
- `https://pruebas.fmargon.com/?demo=1&auto=1` abre sin pedir login de Vercel, con la franja «Copia de pruebas», y Inicio muestra asuntos.
- `https://pruebas.fmargon.com` **sin** `?demo=1` entra también en demostración y no hay ningún botón para señalar carpetas de verdad.
- En `https://asuntos.fmargon.com` no hay franja, ni botón de demostración, ni petición a `js/demo/` en la red del navegador.
- `CLAUDE.md` describe el camino nuevo y dice cómo se retoma una fila `PENDIENTE` con «vista (».
- No lo puede ver: una fila grande de verdad pasando por `ESPERA TU VISTAZO`. Se verá con la primera fila grande que se haga después de esta; que lo mire Claude.

## Qué mirar al terminar
- Abre `https://pruebas.fmargon.com/?demo=1&auto=1`: entra sin login, con la franja y asuntos de ejemplo.
- Quita el `?demo=1&auto=1`: sigue entrando en demostración y no puedes señalar tus carpetas.
- Abre `https://asuntos.fmargon.com`: nada ha cambiado.
- Cuando acabe la primera fila grande después de esta, su estado debe ser `ESPERA TU VISTAZO` con la dirección en la nota. (Lo mira Claude.)

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
- 19-nov-2026 (cierre): coincide · `CLAUDE.md` describe el camino nuevo y la fila `PENDIENTE` con «vista (» · coincide · la dirección de prueba ya no es `pruebas.fmargon.com` sino `fmargon780.github.io/gestor-asuntos-ies` (fila 713): entra sola en demostración, con franja y sin botones de carpetas visibles · coincide · `asuntos.fmargon.com` sin franja ni `window.Demo` · no lo he podido ver · una fila grande pasando de verdad por `ESPERA TU VISTAZO`.
