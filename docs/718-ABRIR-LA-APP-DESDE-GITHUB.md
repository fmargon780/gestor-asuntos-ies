# 718 — Abrir la app desde la web de GitHub

**Título llano:** Abrir la app desde la web de GitHub
**Para qué:** que la app de verdad se abra por una sola dirección que también funcione en el instituto, para acabar con las confusiones entre direcciones y copias, tener siempre la misma versión y trabajar igual desde casa y desde el centro.
**Partes:**
1. Publicar la app también en la dirección nueva
2. Pasar de la dirección actual a la nueva sin perder nada
3. Cerrar la dirección actual (solo cuando todos hayan pasado)

## Lo que escribió Francisco

19-nov-2026 (al pedir la dirección de prueba, fila 713):

> «Estoy en el instituto, los dominios fmargon.com se bloquean en la red de la Junta de Andalucía. Ya ha pasado en otras apps. Se ha solucionado cambiando de dominio a uno de github que sí está permitido.»

20-nov-2026: pidió diseñar ya, separado del molde, la mudada de la app de verdad (idea 714).

## Lo que entendió Claude (acordado con Francisco el 20-nov-2026)

- La app de verdad vive en **https://gestor-asuntos-ies.github.io**. La dirección de prueba (`fmargon780.github.io/gestor-asuntos-ies`) no cambia y sigue en demostración.
- Comprobado el 20-nov-2026 por Francisco, en un ordenador del instituto: esa dirección abre.
- **Parte 1.** Cada publicación en producción llega a las dos direcciones, `asuntos.fmargon.com` y la nueva. No se quita nada. La versión nueva se ve en la dirección nueva en 10 minutos como mucho, y nunca se mezclan piezas viejas y nuevas.
- **Parte 2.** Lo que verá la usuaria:
  - En `asuntos.fmargon.com`, un botón **«Pasar a la dirección nueva»**. Lleva el identificador de ese ordenador (el de `gestor-ordenador`) y la lista de carpetas que tenía señaladas, con su nombre.
  - En la dirección nueva, la app dice qué carpetas hay que señalar, **una por una y por su nombre**, y marca cada una al señalarla. Hasta señalarlas todas, no guarda nada en ellas.
  - Un navegador no deja pasar el permiso de una carpeta de una dirección a otra: **hay que señalarlas de nuevo en cada ordenador**. Es inevitable.
  - Las dos direcciones trabajan sobre las mismas carpetas, como hasta ahora, y la app avisa si el otro ordenador ha cambiado algo.
- **Orden de la mudanza:** primero un ordenador del instituto con Edge (señalar carpetas y guardar un asunto de verdad); después los demás; Diego el último.
- **Parte 3.** Al final, `asuntos.fmargon.com` solo dice que la app se ha mudado, con el enlace a la nueva. Se hace solo cuando Francisco dice que todos han pasado.
- **La copia sin internet se queda** como plan B, sin tocar.
- **Lo que desaparece:** nada hasta la parte 3. Entonces, usar la app desde `asuntos.fmargon.com`.

## Pantalla de prueba

- Sin pantalla: solo cambian el botón y el aviso de la parte 2 y el aviso de la parte 3. Sus textos están arriba.

## Qué NO se hace en esta tarea

- Que la copia sin internet se actualice sola aunque el instituto no pueda abrir GitHub (idea 720).
- Cambiar la dirección de prueba ni sus datos inventados (filas 710, 711 y 713).
- Mudar otras apps.

## Notas técnicas de Claude

**Parte 1: publicar en la dirección nueva**
- La dirección nueva es un repositorio público de la organización de GitHub `gestor-asuntos-ies`: `gestor-asuntos-ies/gestor-asuntos-ies.github.io` (ya creado, con una página de prueba; Pages ya está activo). Otra dirección es otro sitio para el navegador, así que sus permisos y datos son aparte de los de la de prueba.
- Una acción nueva, `.github/workflows/publicar-github.yml`, que se lanza a mano (`workflow_dispatch`, sin entradas) desde `main`. Monta la app igual que `pruebas-pages.yml` (misma lista de lo que se deja fuera, más `.nojekyll`), ejecuta `node scripts/version-al-publicar.mjs` sobre la copia (Pages no pasa por Vercel, así que la hora de la versión no se pondría sola) y sube el resultado a la rama `main` del repositorio de la organización, sustituyendo todos sus ficheros.
- Para subir al repositorio de la organización hace falta una clave (como `COPIA_TOKEN`, `docs/CLAVE-COPIA-PUBLICA.md`) guardada como secreto `PAGES_TOKEN`. Es un **paso de Francisco** (`docs/METODO-COMUN.md` 9): fila `IDEA (fecha · paso de Francisco)` con los enlaces https://github.com/settings/personal-access-tokens/new (dueño: la organización `gestor-asuntos-ies`, solo ese repositorio, permiso Contents lectura y escritura) y https://github.com/fmargon780/gestor-asuntos-ies/settings/secrets/actions/new. La fila de la parte 1 queda `ESPERA A LA IDEA M`. Si la organización pide aprobar la clave, el enlace de la aprobación va en la misma fila.
- **Sin mezclar versiones:** GitHub Pages sirve con caché de 10 minutos y no deja cambiar las cabeceras. Para que un `index.html` viejo no cargue piezas nuevas (ni al revés), la acción escribe en la copia, no en el repositorio, `?v=<App.VERSION>` en cada pieza que carga `js/cargar-piezas-*.js` y en las hojas de estilo, fuentes y scripts de `index.html`. Hay que comprobar cómo `document.write` de `js/cargar-piezas-N.js` y la copia sin internet (`scripts/copia-local.mjs`) leen esas direcciones, para no romperlas.
- La Content-Security-Policy de `vercel.json` no existe en Pages: poner en `index.html` de la copia una `<meta http-equiv="Content-Security-Policy">` con la misma lista (sin `frame-ancestors`, que una `<meta>` no admite). Comprobar que el envío de correo (`script.google.com`) sigue funcionando.
- Rutas: aquí la app va en la raíz (`/`), no bajo `/gestor-asuntos-ies/` como la dirección de prueba.
- `js/demo/franja.js` y `js/demo/arrancar.js`: la dirección nueva **no** es de pruebas; no entra en demostración. Prueba en `pruebas/copia-de-pruebas.mjs` con el `hostname` simulado `gestor-asuntos-ies.github.io`: sin franja y con el botón de señalar carpetas.
- Pasos de la sesión tras fusionar en `main`: `create_deployment` de Vercel como siempre; después lanzar `publicar-github.yml` y comprobar con `curl` que `https://gestor-asuntos-ies.github.io/js/version.js?v=<algo>` sirve la misma `App.VERSION`. Si la acción falla, la fila no es HECHA; si Vercel responde 402, vale lo de siempre. Cambiar `CLAUDE.md` («Cómo se publica y se comprueba aquí») y `docs/CONTEXTO-CORTO.md` (apartado 1) en la misma subida.

**Parte 2: el paso de una dirección a la otra**
- Nueva pieza `js/pasar-a-direccion-nueva.js` (en `js/cargar-piezas-N.js`; menos de 400 líneas). Solo se ve en `asuntos.fmargon.com` y `gestor-de-asuntos.vercel.app`, y solo mientras la parte 3 no esté hecha. El botón abre `https://gestor-asuntos-ies.github.io/#pasar=<datos>`, con el identificador de ordenador y la lista de nombres de carpetas recordadas (de `almacen.js`, IndexedDB `BASE`). Nunca una ruta de disco, un permiso ni una clave.
- En la dirección nueva, al leer `#pasar=` (y quitarlo de la barra de direcciones), guarda el identificador en `gestor-ordenador` si ese ordenador aún no tiene uno, y muestra la lista «Carpetas por señalar» con una casilla por carpeta, que se marca al señalarla (se compara con el nombre de la carpeta señalada y se avisa si no coincide). Reutilizar `PermisosCarpetas.pedir` y el flujo de señalar carpetas que ya existe; no escribir otro.
- Todo texto con las palabras de `docs/VOCABULARIO.md`. Línea en `js/novedades.js`: sí (es visible).
- Esta parte necesita la parte 1 HECHA y probada en el instituto antes de lanzarse.

**Parte 3: cerrar la dirección actual**
- `index.html` de `asuntos.fmargon.com` pasa a una página que dice «La app se ha mudado» con el enlace a la nueva; `gestor-de-asuntos.vercel.app` igual. La copia sin internet no cambia. No se programa hasta que Francisco diga que todos han pasado: fila `IDEA`, no PENDIENTE.

## Cómo lo comprueba el segundo revisor

- Parte 1: la acción deja en el repositorio de la organización solo la app (sin `docs/`, `pruebas/`, `.github/`, `apps-script/`, `herramientas/`); `js/version.js` tiene la hora puesta por el programa; todas las piezas de `index.html` y de `js/cargar-piezas-N.js` llevan `?v=`; `asuntos.fmargon.com` sigue funcionando igual.
- Parte 1: con `hostname` simulado `gestor-asuntos-ies.github.io`, la app no entra en demostración y ofrece señalar carpetas.
- Parte 2: en la copia de pruebas, con un ordenador simulado con dos carpetas recordadas, el botón lleva a la dirección nueva con el identificador y los dos nombres; la dirección nueva enseña las dos carpetas sin marcar y marca cada una al señalarla; un nombre distinto da aviso; ni el enlace ni la barra llevan rutas o permisos.
- Parte 2: el botón no aparece en la dirección nueva ni en la de prueba.

## Qué mirar al terminar

- Parte 1: abrir `https://gestor-asuntos-ies.github.io` (lo mira Claude con Chrome; Francisco, en el instituto, con Edge): sale la app con la misma versión que `asuntos.fmargon.com`.
- Parte 2: en `asuntos.fmargon.com`, pulsar «Pasar a la dirección nueva»; en la nueva, señalar las carpetas que pide, una por una, y guardar un asunto de verdad. **Solo se puede en el instituto, con Edge.**
- Después, en cada ordenador, lo mismo.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
- Parte 1 (fila 730), revisor: coincide todo (copia solo con la app, hora de versión puesta, `?v=` en todas las piezas, sin demostración y con botón de señalar carpetas en la dirección nueva, Content-Security-Policy en `<meta>`, `asuntos.fmargon.com` igual). No visto: la acción en GitHub (después sí: run 45626308501 bien) y abrir la dirección real con Edge. Aviso: la copia lleva también `js/demo/`, que no se usa.
- Parte 2 (fila 731), revisor: coincide todo (botón con identificador y solo nombres; no sale en la nueva, la de prueba ni en local; lista «Carpetas por señalar» que marca al señalar, avisa de otro nombre, bloquea «Entrar» hasta señalar abiertos y ARCHIVO; «Quitar la lista»; cargas mal formadas ignoradas). Menor: «Hasta señalar las dos primeras» no dice cuáles, pero la lista las numera. No visto: las direcciones reales, `gestor-de-asuntos.vercel.app`, carpetas reales. Las carpetas de entrada, bandeja, alumnado, Centro de datos y copia sin internet no bloquean: se señalan ya dentro.
- No se pudo mirar el repositorio de la organización desde la sesión (permiso denegado a `add_repo`).
