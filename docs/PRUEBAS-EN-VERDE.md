# Fila 148 — Las pruebas de GitHub, en verde, y menos ejecuciones

Apuntada el 25-sep-2026, cerrada con Francisco (Cowork).

## Por qué

A Francisco le llegan centenares de correos de GitHub con «Run failed» de este repositorio (y de
otros). Cada subida a `main` lanza `.github/workflows/pruebas.yml`; si falla, GitHub manda un
correo. Una noche de cola son 30 subidas o más, incluidas las que solo marcan una fila EN CURSO
en `docs/COLA.md`. Si la batería está en rojo, son 30 correos.

La regla 5 de la cola dice «nunca dejes el repositorio con las pruebas en rojo». Algo se ha roto
sin que nadie lo vea, porque muchas sesiones no pueden leer el resultado de GitHub Actions.

## Qué hay que hacer

### 1. Saber qué falla

- Mira las últimas ejecuciones de «Pruebas» en `main` (`gh run list --workflow pruebas.yml
  --branch main --limit 20` y `gh run view <id> --log-failed`, o la API de Actions).
- Si la sesión no puede leer Actions, ejecuta `npm ci`, `npx playwright install --with-deps
  chromium` y `npm test` en local, igual que el workflow.
- Mira también «Publicar la copia sin internet» (`copia-publica.yml`): si falla, arréglalo igual.
- Apunta en `docs/HISTORIA.md` desde qué commit falla y por qué.

### 2. Arreglar la causa

- Si falla la aplicación, se arregla la aplicación.
- Si falla la prueba porque la pantalla cambió a propósito (filas recientes), se actualiza la
  prueba a lo que la pantalla hace hoy.
- Si una prueba es inestable (a veces pasa, a veces no), se arregla la espera que falla, no se
  reintenta a ciegas.
- **Prohibido** quitar, saltar (`skip`) o vaciar una prueba para ponerla en verde. Solo se borra
  una prueba si comprueba algo que ya no existe en la aplicación, y se dice en `docs/HISTORIA.md`.

### 3. Menos ejecuciones en `pruebas.yml`

Cambio quirúrgico en `.github/workflows/pruebas.yml`:

- En `push` y en `pull_request`, `paths-ignore: ['docs/**']`. Marcar una fila EN CURSO o
  escribir una instrucción ya no lanza la batería.
- Añadir al workflow:

      concurrency:
        group: pruebas-${{ github.ref }}
        cancel-in-progress: true

  Si llegan dos subidas seguidas, la primera se cancela y solo se prueba la última.

No toques los avisos por correo de GitHub: eso es de la cuenta de Francisco, no del repositorio.

## Ficheros que se tocan

- `.github/workflows/pruebas.yml`
- Los ficheros de `pruebas/` o de `js/` que resulten ser la causa del rojo (solo esos).
- `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`.

## Cómo trabajar

- No leas el repositorio entero: empieza por el registro del fallo y ve solo a los ficheros que
  cita.
- Cambios quirúrgicos, no reescribir ficheros enteros.
- Sube directamente a `main`, sin abrir ninguna petición de cambios (si el entorno te obliga,
  fusiónala tú en cuanto esté en verde, como dice la cola).
- Una sola pasada de `npm test` completa al final.

## Cuándo está HECHA

- La última ejecución de «Pruebas» en `main` termina en verde (si la sesión puede verlo; si no,
  `npm test` completo en verde en local y la nota «Actions sin comprobar»).
- `pruebas.yml` ya no se lanza con un cambio solo de `docs/`.
- En la nota de la fila: qué fallaba, en una línea.
