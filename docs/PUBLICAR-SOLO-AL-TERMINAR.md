# Publicar solo al terminar una tarea, nunca en cada subida

Diseñado y cerrado con Francisco el 11-oct-2026. La misma instrucción va en sus cinco
repositorios que publican en Vercel (`gestor-asuntos-ies`, `Cancionero-Parroquia`,
`normativa-escolarizacion`, `Partituras-de-Caja-Clara` y `comparador-listas`). Cada uno la hace
por su cuenta, sin esperar a los demás.

## Por qué

- El plan gratuito de Vercel da **100 publicaciones cada 24 horas a toda la cuenta** (error 402,
  `api-deployments-free-per-day`). Francisco no cambia de plan ni separa cuentas.
- Entre el 10 y el 11 de octubre de 2026 se gastaron las 100 en 24 horas: Cancionero 60,
  Normativa 27, Gestor 9, Partituras 4. Casi todas eran apuntes de las colas (idea nueva,
  EN CURSO, HECHA, estimaciones, «Te toca a ti»), que no cambian ninguna app. Las filas 324 y
  325 del Gestor se quedaron horas sin publicar.
- `ignoreCommand` **no ahorra nada**: Vercel crea la publicación, la cancela y la cuenta igual
  en el tope. Lo dice su documentación, apartado «Ignored Build Step» de
  https://vercel.com/docs/project-configuration/project-settings. La regla del 17-sep-2026 del
  Gestor y la de Partituras se basaban en lo contrario.
- Lo único que no gasta es que Vercel **no llegue a crear** la publicación:
  `git.deploymentEnabled: false`
  (https://vercel.com/docs/project-configuration/git-configuration).

## Qué cambia (decidido por Francisco)

1. Vercel deja de publicar solo. Ninguna subida a GitHub publica nada, en ninguna rama.
2. Se publica **a propósito, una sola vez por tarea**, cuando su código ya está en `main`. Una
   tarea que solo toca documentos no publica.
3. Francisco no nota nada en la app. Los apuntes de la cola dejan de gastar publicaciones.

## Antes de tocar nada: comprueba que tienes la herramienta de Vercel

Esta tarea deja la publicación en manos de la herramienta `create_deployment` del conector de
Vercel. Si no la ves en tu lista, cárgala con ToolSearch:
`select:mcp__Vercel__create_deployment,mcp__Vercel__get_deployment,mcp__Vercel__list_deployments`
(el prefijo puede salir como `mcp__vercel__`; prueba también a buscar `create_deployment`).

**Si esta conversación no tiene esa herramienta, no toques `vercel.json`**: la app se quedaría
sin forma de publicarse. Deja la tarea BLOQUEADA con el motivo «esta conversación no tiene la
herramienta de Vercel» y para.

## Ficheros que se tocan

Cambios quirúrgicos: solo estos ficheros y solo las líneas que hablan de publicar. No se
reescribe ningún documento entero.

- `vercel.json`
- `scripts/vercel-ignore-build.sh` (se borra)
- `pruebas/vercel-ignore-command.mjs` (se borra) y `pruebas/sin-publicacion-automatica.mjs` (nueva)
- `CLAUDE.md` («Trabajar en la rama de la fila», puntos 1 y 5, y «Regla general de publicación»)
- `docs/COLA.md` (reglas 0, 13 y 19, y la nota «Vercel: el tope diario…» de «Lo que queda por
  hablar con Francisco», que queda resuelta)
- `docs/CONTEXTO-CORTO.md` (sección 6: la línea «Vercel: 100 publicaciones/día…» y la de «El
  repositorio es la versión buena…»)
- `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/CONTEXTO.md`, solo donde nombran el
  `ignoreCommand` o el guion borrado
- `docs/NO-GASTAR-PUBLICACIONES.md` y `docs/PUBLICAR-SIN-PARAR.md`: una línea arriba que diga
  «Sustituido en lo de publicar por `docs/PUBLICAR-SOLO-AL-TERMINAR.md` (11-oct-2026)»; el
  resto no se toca
- `docs/HISTORIA.md` (la entrada de esta fila)

## Paso 1. `vercel.json`

Dos cambios, sin tocar `buildCommand`, `outputDirectory` ni `headers`:

- El bloque `git` queda así (sustituye al que hoy apaga solo `claude/**` y `avisos`):

      "git": { "deploymentEnabled": false }

- Se quita la clave `ignoreCommand` y se borra `scripts/vercel-ignore-build.sh`.

`scripts/version-al-publicar.mjs` sigue igual: pone la hora de la versión al publicar, también
cuando se publica a propósito. La rama `pruebas` ya no existe en GitHub y
`pruebas.fmargon.com` deja de actualizarse sola; no es un paso de la cola desde la fila 242.

Sube ese cambio a `main` junto con el paso 3 (las reglas), en la subida del cambio de esta
tarea. Esa misma subida ya no debe crear ninguna publicación.

## Paso 2. Publicar a propósito

Así se publica desde ahora. Probado el 11-oct-2026 a las 05:14 en el Gestor (antes de este
cambio): quedó `READY` en siete segundos, con el dominio bueno asignado.

Herramienta `create_deployment` del conector de Vercel, con estos datos exactos:

    teamId: team_gnCjBLTS8m8PNTFVUf7ST0uN
    requestBody:
      name: gestor-de-asuntos
      project: gestor-de-asuntos
      target: production
      gitSource:
        type: github
        org: fmargon780
        repo: gestor-asuntos-ies
        ref: main

Publica lo último que haya en `main`, así que se llama **después** de que el código de la tarea
esté en `main`. Con el `id` que devuelve, `get_deployment` (mismo `teamId`) hasta que el estado
sea `READY` y su `meta.githubCommitSha` sea el último commit de `main`. Después se comprueba la
dirección publicada: `curl` a `https://asuntos.fmargon.com/js/version.js?v=<algo distinto>` (o a
`https://gestor-de-asuntos.vercel.app/js/version.js?v=<algo distinto>`): `App.VERSION` lleva la
hora de esta publicación a propósito.

Reglas de uso:

- **Una vez por tarea**, y solo si la tarea ha cambiado algo de lo que se publica. Nunca para
  «ver si ya hay cupo».
- Si responde **402** (tope diario): no se reintenta. La tarea queda SIN PUBLICACIÓN
  COMPROBADA y se sigue como mande la regla general de publicación de este repositorio.
- Si otra conversación futura no tiene la herramienta de Vercel: la tarea queda SIN
  PUBLICACIÓN COMPROBADA con ese motivo. **Nunca se vuelve a encender la publicación
  automática** para salir del paso.
- Al empezar una sesión, si hay tareas SIN PUBLICACIÓN COMPROBADA: se publica `main` a
  propósito una vez y se comprueban con esa publicación.

## Paso 3. Las reglas, al día

En los documentos de la lista de arriba, sustituye lo que diga que Vercel publica cada subida
(o que se salta las de solo documentos) por la regla nueva. Sustituyendo la línea vieja, no
añadiendo otra debajo. El texto de la regla, para `CLAUDE.md`:

> **Vercel no publica nada solo** (11-oct-2026, `docs/PUBLICAR-SOLO-AL-TERMINAR.md`). Ninguna subida a GitHub crea una
> publicación. Una tarea que cambia la app publica **una sola vez, a propósito**, cuando su
> código ya está en `main`: herramienta `create_deployment` de Vercel con `teamId`
> `team_gnCjBLTS8m8PNTFVUf7ST0uN`, `name` y `project` `gestor-de-asuntos`, `target` `production` y
> `gitSource` `{ type: github, org: fmargon780, repo: gestor-asuntos-ies, ref: main }`; después
> `get_deployment` hasta `READY` y comprobar la dirección publicada. Las subidas de solo
> documentos no publican y no hay nada que comprobar. Si responde 402 no se reintenta. Nunca se
> vuelve a encender la publicación automática ni se añade un `ignoreCommand`: las publicaciones
> canceladas también cuentan en el tope de 100 al día de toda la cuenta.

En este repositorio, además:

- La regla 13 de `docs/COLA.md` pasa a decir que la única publicación de una fila es la
  publicación a propósito, hecha tras fusionar su rama en `main` con la APROBADA del revisor.
  Las subidas de solo `docs/` siguen yendo directas a `main` y ahora no cuentan en ningún tope.
- La regla 19 y la «Regla general de publicación» de `CLAUDE.md` conservan sus dos condiciones
  (commit en `main` y web sirviendo la versión). Cambia el «como mucho un `create_deployment` a
  mano por sesión»: ahora es **uno por fila con código**, y es el camino normal, no el de
  emergencia.
- Esta fila **no pasa por el revisor de pantalla**: no cambia nada de la aplicación ni de la
  demostración. Su comprobación es la lista de abajo.
- `pruebas/sin-publicacion-automatica.mjs`, corta: lee `vercel.json` y falla si
  `git.deploymentEnabled` no es exactamente `false` o si existe `ignoreCommand`. Sustituye a
  `pruebas/vercel-ignore-command.mjs`. La pasada completa de `npm test`, una sola vez, antes de
  fusionar.
- Los otros tres proyectos de Vercel de la cuenta (`gestor-soporte`,
  `parroquia-conteo-colectas-ais-dev` y `diplomator`) no tienen trabajo desde julio y no se
  tocan. Apúntalo en una línea en `docs/CONTEXTO-CORTO.md`: si alguno vuelve a tener cola, lo
  primero es ponerle esta misma regla.

## Cómo sabemos que está bien

Lo comprueba la propia sesión, con las herramientas de Vercel, y deja el resultado de cada punto
en la nota de la tarea.

1. `vercel.json` en `main` lleva `"git": { "deploymentEnabled": false }` y no lleva
   `ignoreCommand`.
2. Tres minutos después de la subida del cambio, `list_deployments` de `gestor-de-asuntos` (con
   `since` igual a la hora de la subida) **no enseña ninguna publicación nueva** de ese commit:
   ni `READY` ni `CANCELED`.
3. La publicación a propósito del paso 2 termina en `READY`, con `target` `production`, y su
   `meta.githubCommitSha` es el último commit de `main`.
4. La dirección publicada sirve lo último de `main`: `curl` a `https://asuntos.fmargon.com/js/version.js?v=<algo distinto>` (o a
`https://gestor-de-asuntos.vercel.app/js/version.js?v=<algo distinto>`): `App.VERSION` lleva la
hora de esta publicación a propósito.
5. Tras la siguiente subida de solo documentos (la marca HECHA), tres minutos después sigue sin
   haber ninguna publicación nueva. Apúntalo en la nota con una subida más de solo documentos:
   ya no gastan.
6. En `CLAUDE.md`, `docs/COLA.md` y `docs/CONTEXTO-CORTO.md` no queda ninguna frase que diga que
   Vercel publica cada subida a `main` o que se salta las de documentos.
7. `npm test`, pasada completa: en verde, con la prueba nueva dentro y sin la borrada.
8. `App.VERSION` de la web es posterior a la que había antes de esta fila (11-oct-2026 · 05:14 o
   la que haya dejado la última fila).

No hay ningún punto **[SOLO FRANCISCO]**: en pantalla no cambia nada.

## Si algo no sale

- **La publicación a propósito es rechazada o sale `CANCELED` por tener apagada la publicación
  automática.** Prueba una sola vez el segundo camino: `create_deployment` con
  `requestBody: { name: gestor-de-asuntos, project: gestor-de-asuntos, target: production,
  deploymentId: <id de la última publicación READY de producción, de list_deployments>,
  withLatestCommit: true }`. Si también falla: deshaz el cambio de `vercel.json`
  (`git revert` de ese commit), súbelo, comprueba que Vercel vuelve a publicar como antes y deja
  la tarea **BLOQUEADA** con el texto literal del error. No busques otro camino: ni ganchos de
  publicación, ni proyectos nuevos de Vercel, ni acciones de GitHub, ni otro plan.
- **En el punto 2 o en el 5 aparece una publicación nueva.** Vercel no está leyendo el ajuste:
  mira que `vercel.json` es el que usa el proyecto (su carpeta raíz en Vercel) y que el JSON
  es válido. Si no das con ello en un intento, deshaz el cambio y deja la tarea BLOQUEADA con lo
  que has visto.
- **402 al publicar a propósito.** Es el tope que esta tarea viene a quitar. No se reintenta y
  **no se deshace el cambio**: la tarea queda SIN PUBLICACIÓN COMPROBADA y la siguiente sesión
  publica a propósito y pasa los puntos 3 a 5.

## Al terminar

Mensaje corto a Francisco, sin jerga: que Vercel ya no publica en cada apunte de la cola, que
cada tarea publica una vez al acabar, y cuántas publicaciones ha gastado esta tarea (debe ser
una). En pantalla no va a ver nada distinto.
