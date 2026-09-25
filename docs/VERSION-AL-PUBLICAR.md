# La versión, generada sola al publicar (fila 76)

Sustituye a la fila 72, punto 1 (`docs/DETALLES-DE-MANTENIMIENTO.md`), que se separó y quedó
bloqueada el 19-sep-2026: el riesgo de entonces era que un commit automático desde GitHub Actions
podía acabar en un bucle de commits o en publicaciones de Vercel duplicadas. Diseño cerrado con
Francisco el 25-sep-2026, con ese riesgo fuera del diseño desde el principio.

## La decisión

**Nunca un commit nuevo al repositorio.** La fecha y hora de `App.VERSION` (hoy escrita a mano en
`js/version.js`) se generan solas **en el momento de publicar en Vercel**, dentro del propio
proceso de publicación, sin tocar `main` para nada. Así no hay ningún paso que pueda disparar una
publicación detrás de otra.

## Qué hay que hacer

- Hoy Vercel no construye nada: sirve los ficheros del repositorio tal cual (no hay
  `buildCommand` en `vercel.json`, solo `ignoreCommand`, de la fila 48/63). Añadir un
  `buildCommand` que, al publicar, escriba la hora real (calculada en `Europe/Madrid`, nunca en
  UTC a pelo) en el sitio donde hoy está escrita a mano la línea `App.VERSION = '...'` de
  `js/version.js`, y sobrescriba ese fichero como parte del propio build de Vercel (no como un
  commit al repositorio: el fichero que queda en git no cambia).
- El `buildCommand` nuevo tiene que convivir con el `ignoreCommand` que ya existe: uno decide si
  se publica, el otro qué se sirve. No lo toques ni cambies su comportamiento.
- Sin ese `buildCommand` de por medio —alguien abre `index.html` en local, o la copia sin
  internet (`scripts/copia-local.mjs`, que no pasa por Vercel)— `js/version.js` tiene que
  seguir funcionando con la última fecha que tuviera escrita a mano: nunca vacío, nunca roto.
- Sigue existiendo la posibilidad de escribirla a mano alguna vez (por ejemplo, si este
  automatismo se desactiva): el aviso de siempre en `js/version.js`, de sacar la hora del reloj
  de verdad y nunca a ojo, se queda como red de seguridad.

## Cuidado

- **Si en algún momento parece que hace falta un commit al repositorio para que esto funcione,
  es que el diseño se ha torcido.** Para ahí, no lo fuerces, y deja anotado el problema en
  `docs/COLA.md` en vez de intentar un camino distinto sin que Francisco lo haya cerrado.
- **Esto solo se puede comprobar publicando de verdad.** Ninguna prueba de `npm test` lo
  demuestra (no hay manera de ejecutar un build de Vercel real en local). Publica normal,
  fusiona si hace falta, y en el mensaje final para Francisco pídele explícitamente que entre un
  momento a la web y mire si la hora de abajo a la izquierda es la de ahora mismo, hora de
  España.
- **Si no sale bien, vuelve a la fecha escrita a mano** (lo de siempre, con la receta de
  `TZ='Europe/Madrid' date` que ya trae `js/version.js`) y marca esta fila como BLOQUEADA otra
  vez, con el motivo exacto en una línea. No lo reintentes más de una vez sin que Francisco lo
  vuelva a cerrar.
- Como siempre: como mucho dos subidas para el código, y una más de documentación (regla 13 de
  la cola).

## Al terminar

- `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`, sección "La versión, a la vista": la línea dice
  que la hora se genera sola al publicar, no que se escribe a mano; el aviso de "si se edita a
  mano, sacarla del reloj de verdad" se queda, como red de seguridad.
- `docs/HISTORIA.md`: cómo quedó montado, y si hizo falta volver atrás y por qué.

**Ojo (25-sep-2026):** con `buildCommand` y sin marco, Vercel busca la web en `public/`. Hace falta
`"outputDirectory": "."` en `vercel.json`; sin eso, todas las publicaciones fallaban.
