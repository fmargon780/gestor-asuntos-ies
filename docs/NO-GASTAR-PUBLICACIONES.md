# No gastar publicaciones de Vercel

Acordado con Francisco el 17-sep-2026, el día que Vercel dejó de publicar.

## Qué pasó

A media tarde del 17-sep-2026 todas las publicaciones empezaron a fallar con este error, y a
Francisco le llegaron decenas de correos de Vercel:

    Resource is limited - try again in 24 hours
    (more than 100, code: "api-deployments-free-per-day").

El plan gratuito (Hobby) de Vercel permite **100 publicaciones al día**. Ese día `main` recibió
exactamente 100 commits. Más de la mitad no cambiaban nada de lo que se ve en la web: eran
`docs/COLA.md`, `docs/CONTEXTO.md`, `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`, commits de
reconciliación con `main` y commits de "completa el commit anterior". Además, cada push a una rama
`claude/...` con pull request abierto dispara su propia publicación de vista previa, que tampoco
hace falta para nada.

Hay un solo proyecto de Vercel y no se crea ninguno más. Tampoco se pasa a plan de pago.

## Qué hay que hacer

### 1. Apuntar esta instrucción en la cola

`docs/COLA.md` todavía no tiene esta fila: esta instrucción llegó por otro camino. Lo primero es
añadirla a la tabla de la cola, **detrás de la fila 43 pero marcada como la primera que se hace**:

    | 44 | `docs/NO-GASTAR-PUBLICACIONES.md` | EN CURSO (fecha) | **Va la primera de toda la cola**, antes de la fila 36. Acordado con Francisco el 17-sep-2026, el día que Vercel dejó de publicar por agotar el cupo del plan gratuito (100 publicaciones al día, `api-deployments-free-per-day`). `vercel.json` gana un `ignoreCommand` que se salta la publicación cuando la rama no es `main` o cuando el cambio solo toca `docs/`, `pruebas/`, `.github/` o ficheros `.md`. Y esta cola gana la regla 13: como máximo dos subidas por fila. |

Y añadir al final de las "Reglas para Claude Code" de esa misma cola:

> 13. **Como máximo dos subidas por fila.** Cada push que llega a GitHub le cuesta una publicación
>     a Vercel, y el plan gratuito solo da 100 al día: el 17-sep-2026 se agotaron y la web se quedó
>     sin actualizar hasta el día siguiente. Una subida para marcar la fila **EN CURSO** (regla 2) y
>     una sola al terminar, con el código, las pruebas, `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`,
>     `docs/CONTEXTO.md` y `docs/HISTORIA.md` en el mismo commit. Nada de un commit por fichero, ni
>     de "completa el commit anterior": se prepara todo y se sube una vez. Ver
>     `docs/NO-GASTAR-PUBLICACIONES.md`.

### 2. `vercel.json`: no publicar lo que no cambia la web

`vercel.json` ya existe y tiene un bloque `headers`. **No lo toques**: solo se añade la clave
`ignoreCommand` al mismo nivel. Vercel ejecuta ese comando antes de construir: si termina con
código 0, se salta la publicación; si termina con código 1, publica.

El comando tiene que saltarse la publicación en dos casos:

- la rama no es `main` (adiós a todas las vistas previas de las ramas de trabajo), o
- el cambio solo toca `docs/`, `pruebas/`, `.github/` o ficheros `.md`.

Punto de partida (adáptalo si hace falta, pero mantén el comportamiento y lo de fallar hacia
publicar):

    bash -c 'if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then exit 0; fi; BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"; git cat-file -e "$BASE^{commit}" 2>/dev/null || exit 1; git diff --quiet "$BASE" HEAD -- . ":(exclude)docs" ":(exclude)pruebas" ":(exclude).github" ":(exclude)*.md" && exit 0 || exit 1'

Detalles que importan:

- `VERCEL_GIT_PREVIOUS_SHA` es el commit de la última publicación buena, y Vercel solo lo pone
  cuando hay un `ignoreCommand` configurado. Se usa como referencia **en primer lugar**: si se
  comparara siempre `HEAD^` con `HEAD`, un push con dos commits (el código en el primero y los
  documentos en el segundo) se saltaría la publicación y el cambio de código no llegaría nunca a
  la web.
- `HEAD^` es solo el respaldo para la primera vez, cuando esa variable todavía no existe.
- **Ante cualquier duda, publicar.** Si la referencia no se puede resolver, el comando sale con
  código 1. Vale más una publicación de sobra que un cambio que no se publica.

### 3. Una prueba

Añade a `pruebas/` una prueba que lea `vercel.json` y compruebe que:

- existe `ignoreCommand`,
- menciona `main` y `VERCEL_GIT_PREVIOUS_SHA`,
- y sigue existiendo el bloque `headers` con el `Cache-Control` de siempre.

### 4. Comprobarlo de verdad

El cupo se recupera solo 24 horas después, así que puede que la comprobación haya que dejarla
para el 18-sep-2026. Cuando vuelva a publicar:

- un commit que solo toque `docs/` tiene que salir en Vercel como saltado ("The Deployment has
  been skipped"), no como publicado;
- un commit que toque `index.html`, `js/` o `css/` tiene que publicar como siempre, y
  `https://gestor-de-asuntos.vercel.app` tiene que servir la versión nueva (`curl`).

Si un commit de solo documentos publica igual, el comando está mal y hay que arreglarlo antes de
cerrar esta fila.

## Lo que no sabemos y hay que mirar

Una publicación saltada se crea en Vercel y luego se marca como saltada. **No está documentado si
esas saltadas siguen contando para el límite de 100 al día.** Si contaran, el `ignoreCommand`
ahorraría tiempo de construcción pero no cupo, y lo único que salvaría el día sería la regla 13.
Apunta en `docs/HISTORIA.md` lo que se observe la próxima vez que se toque el tope, con la cuenta
de publicaciones de ese día.

Si el tope se vuelve a alcanzar con la regla 13 puesta, la salida siguiente (sin plan de pago) es
apagar del todo las publicaciones automáticas de Git (`git.deploymentEnabled: false` en
`vercel.json`) y publicar con un *deploy hook* llamado desde una acción de GitHub solo cuando
cambie algo fuera de `docs/`. Eso no se hace ahora: es más complicado y todavía no hace falta.
