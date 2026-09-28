# Aviso «esperando tu respuesta» para el Centro de mando

Diseñada con Francisco en una conversación de Cowork el 28-sep-2026. Diseño cerrado.

**Número de fila:** el siguiente libre en `docs/COLA.md` cuando se apunte (no es el 224: ese
número lo cogió una idea apuntada desde el Centro de mando). Se apunta justo después de la 214.

## Para qué

Francisco sigue el trabajo desde el **Centro de mando**, una página de claude.ai que lee este
repositorio en GitHub. Esa página no puede ver las conversaciones de Claude Code por dentro: solo
las huellas que dejan en GitHub.

Hoy, cuando una conversación de Claude Code se para a pedirle un permiso o a hacerle una pregunta,
no sube nada. El Centro de mando la ve quieta: a los 30 minutos pone «Sin noticias» y a los 90
pone «Parada» y le sugiere empezar la fila de nuevo. Es un error, porque bastaba con contestar.

Queremos que, en cuanto Claude Code se quede esperando a Francisco, deje una marca en GitHub. El
Centro de mando ya sabe leerla (ya está publicado) y pone en naranja: «La fila N está esperando
tu respuesta. Abre la conversación de la fila N y contesta».

## Qué hay que hacer

### 1. El script `scripts/aviso-esperando.sh`

Un script de bash, ejecutable, que se llama con un argumento: `esperando` o `libre`.

Recibe por la entrada estándar el JSON que Claude Code pasa a los «hooks» (con `message` en el
caso de `Notification`). Tiene que leerlo sin fallar si viene vacío.

Con `esperando`:

- Averigua la fila EN CURSO leyendo `docs/COLA.md` de la copia de trabajo (la primera fila con
  estado que empiece por «EN CURSO»). Si no hay ninguna, `fila` va vacía.
- Escribe en la rama **`avisos`** un único fichero, `ESPERANDO.json`, con esta forma exacta:

  ```json
  {"estado":"esperando","fila":"214","motivo":"permiso","desde":"2026-09-28T21:40:00Z","mensaje":"texto corto"}
  ```

  - `motivo`: `"permiso"` si el mensaje habla de permiso (`permission`), si no `"pregunta"`.
  - `desde`: la hora actual en UTC, formato ISO.
  - `mensaje`: el `message` del JSON de entrada, recortado a 200 caracteres. Sin datos de alumnos
    ni de personas: si no se puede garantizar, déjalo vacío.
- Crea un fichero de marca local, `${TMPDIR:-/tmp}/aviso-esperando.flag`.

Con `libre`:

- Solo si existe el fichero de marca local: escribe `ESPERANDO.json` en la rama `avisos` con
  `{"estado":"libre","fila":"","motivo":"","desde":"<ahora>","mensaje":""}` y borra la marca.
- Si la marca no existe, sale en el acto sin hacer nada (se llama muy a menudo).

**Cómo escribir en la rama `avisos` sin tocar la copia de trabajo** (ni el índice, ni la rama en
la que se está trabajando): con las órdenes de bajo nivel de git, por ejemplo
`git hash-object -w --stdin` → `git mktree` → `git commit-tree` → `git push -f origin
<commit>:refs/heads/avisos`. El historial de `avisos` no importa: cada aviso puede ser un commit
suelto sin padre.

Reglas del script:

- **Nunca debe romper la sesión**: todo error se traga y el script sale siempre con 0.
- Rápido: como mucho unos 15 segundos; el `push` con tiempo límite.
- No imprime nada en la salida estándar (Claude Code lo leería).
- La rama `avisos` no publica en Vercel: `scripts/vercel-ignore-build.sh` ya se salta todas las
  ramas que no sean `main` ni `pruebas`. Compruébalo, no lo cambies.

### 2. `.claude/settings.json`: NO lo toques

Claude Code no puede modificar su propio `.claude/settings.json` (lo rechaza como
«Self-Modification»). Los «hooks» que llaman al script **ya los ha puesto la conversación de
Cowork** en ese fichero, protegidos para que no hagan nada mientras el script no exista:

- `Notification` → `scripts/aviso-esperando.sh esperando`
- `UserPromptSubmit` y `PostToolUse` → `scripts/aviso-esperando.sh libre` (solo si existe la marca
  local)

Léelo para comprobar que las rutas y los argumentos coinciden con tu script. Si hiciera falta
cambiar algo, **no lo cambies**: apúntalo en «Lo que queda por hablar con Francisco» de
`docs/COLA.md` y deja la fila BLOQUEADA.

### 3. Prueba

Una prueba en `pruebas/` que ejecute el script contra un repositorio git de mentira (un `bare`
local como `origin`) y compruebe:

- `esperando` deja en `avisos` un `ESPERANDO.json` con `estado":"esperando"` y la fila EN CURSO de
  una `COLA.md` de ejemplo.
- `libre` sin marca no hace nada; con marca, deja `estado":"libre"` y borra la marca.
- La rama de trabajo y la copia de trabajo quedan intactas (`git status` limpio, mismo `HEAD`).
- Con `origin` inalcanzable, sale con 0.

## Cómo sabemos que está bien

1. `scripts/aviso-esperando.sh` existe, es ejecutable y la prueba nueva pasa en verde.
2. Tras ejecutarlo de verdad una vez con `esperando` y otra con `libre` en esta sesión, la rama
   `avisos` de GitHub existe y su `ESPERANDO.json` termina en `"estado":"libre"`.
3. La rama en la que trabaja la sesión no tiene ningún commit de avisos.
4. Vercel no ha lanzado ninguna publicación por la rama `avisos`.
5. `.claude/settings.json` no se ha modificado en esta fila.

Esta fila no cambia nada de lo que ve la usuaria de la aplicación: el revisor solo comprueba la
lista de arriba, no la copia de pruebas.
