# Fila 63 — Publicar solo la aplicación, no el repositorio entero

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, parte 1.2, punto D.

---

## 1. Qué pasa hoy

Vercel publica **todo lo que hay en el repositorio**. No hay ningún `.vercelignore`, ni
`outputDirectory` en `vercel.json`, ni protección con contraseña.

Eso quiere decir que estas carpetas se sirven en `https://asuntos.fmargon.com` igual que la
aplicación:

- `docs/` — 70 documentos, entre ellos `CONTEXTO.md` (244 KB) y `HISTORIA.md` (226 KB), que cuentan
  por dentro cómo trabaja el centro, cómo se nombran las carpetas, qué hay en `_GESTOR` y qué se ha
  ido rompiendo por el camino.
- `pruebas/` — 71 ficheros.
- `plantilla/`, `scripts/`, `apps-script/`, `package.json`, `README.md`.

**Esto no está comprobado.** La sesión que escribió el informe no tenía salida a esa dirección. Sale
de leer la configuración, y la configuración no deja mucho margen de duda.

No hay ningún dato de alumnado ni de tutores legales en esos documentos: se miró fichero a fichero.
Sí hay al menos un proveedor con su nombre y su NIF, que parece real, en `HISTORIA.md` y en
`PAPELERA.md`.

## 2. Lo primero: comprobarlo

Antes de tocar nada, pedir con `curl` desde fuera del centro:

    https://gestor-de-asuntos.vercel.app/docs/HISTORIA.md
    https://gestor-de-asuntos.vercel.app/package.json
    https://gestor-de-asuntos.vercel.app/pruebas/logica.mjs

Si responden 200 con el contenido, está confirmado y se sigue con el punto 3.

Si responden 404, no hay nada que arreglar: se marca la fila **HECHA** con una nota que diga que se
comprobó y que Vercel no los sirve, y se apunta el resultado en `docs/HISTORIA.md`. Eso también es
trabajo terminado.

## 3. Qué hay que hacer si se confirma

Crear un `.vercelignore` en la raíz con las carpetas que no son la aplicación:

    docs/
    pruebas/
    plantilla/
    scripts/
    apps-script/
    .github/
    README.md

Cuidado con `scripts/`: ahí vive `vercel-ignore-build.sh`, que es el que se salta las publicaciones
cuando solo cambian documentos (fila 48). Hay que comprobar que **`ignoreCommand` se sigue
ejecutando** con `scripts/` en el `.vercelignore`; el `ignoreCommand` corre antes de la subida de
ficheros, así que en principio no le afecta, pero **hay que verificarlo de verdad**, no darlo por
hecho: si dejara de funcionar, cada cambio de documentación volvería a gastar una publicación, que
es justo lo que costó un día de web sin actualizar el 17-sep-2026.

Si resultara que sí le afecta, la salida es dejar `scripts/` fuera del `.vercelignore`: ese fichero
no tiene nada sensible, y lo que importa tapar es `docs/`.

## 4. Cómo se comprueba

1. `npm test` en verde (no debería tocarle nada, pero se comprueba).
2. Después de publicar, con `curl`: que `index.html`, `js/util.js` y `css/estilos.css` siguen
   respondiendo 200, y que `docs/HISTORIA.md` y `package.json` responden 404.
3. Que la aplicación entra y funciona en la dirección publicada.
4. Que el siguiente cambio que solo toque `docs/` **no** dispara una publicación.

Esta fila gasta una publicación de Vercel a propósito: el `.vercelignore` es un fichero de la raíz y
no está en la lista de los que se saltan.

## 5. De paso, mirar el panel de Vercel

No es código, pero va aquí porque es el mismo tema y lo pregunta el informe. Francisco entra en el
panel de Vercel, en el proyecto `gestor-de-asuntos`, y mira dos cosas:

- Si están activados **Analytics** o **Speed Insights**. Se activan desde la web sin tocar el
  repositorio, así que leer el código no lo descarta. Si están activados, decidir si se quitan.
- Qué dice el apartado de registros sobre cuánto tiempo se guardan las peticiones.

Lo que salga, se apunta en `docs/HISTORIA.md` y, si cambia algo de lo que dice el informe, también
en `docs/INFORME-CRITICO-2026-09-18.md`, en el apartado "Lo que NO he podido comprobar desde aquí".

## 6. Qué NO hay que hacer

- **No** poner contraseña a la aplicación. Es de pago en Vercel, y no hace falta: el programa sin los
  datos no vale para nada, y los datos necesitan que alguien señale las carpetas del Dropbox a mano.
- **No** sacar los documentos del repositorio ni moverlos a otro sitio. Tienen que seguir donde
  están: son la memoria del proyecto y se leen en cada sesión.
- **No** borrar ni cambiar los ejemplos de los documentos, salvo el del proveedor real, que sí
  conviene sustituir por uno inventado.

## 7. Cuánto es

Medio día, casi todo comprobar.
