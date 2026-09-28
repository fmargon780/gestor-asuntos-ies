# Gestor de asuntos del IES

Antes de nada, lee `docs/CONTEXTO.md` y después `docs/COLA.md`, como dice la cola.

**Una sola sesión, una sola fila, una conversación nueva por fila** (27-sep-2026, ampliado el
28-sep-2026 por la fila 223): nunca trabajan dos sesiones de Claude Code a la vez en este
repositorio. Cada lanzamiento hace, en una conversación nueva, solo la primera fila **DEVUELTA**
(si la hay) o si no la primera **PENDIENTE** de `docs/COLA.md`, la lleva hasta el final (revisor
incluido) y para. Detalle en la regla 0 de la cola y en `docs/REVISOR-ANTES-DE-PUBLICAR.md`.

**Trabajar en `pruebas`; a `main` solo con el revisor** (28-sep-2026 por la tarde, sustituye la
norma de esa misma mañana «Subir directamente a `main`»: Francisco la cambió al ver que los
fallos le salían en producción; detalle y porqué en `docs/REVISOR-ANTES-DE-PUBLICAR.md`, fila 223,
y en el bloque «El revisor» de abajo):

1. Al empezar una fila, nivelar `pruebas` con `main` (`git fetch`; `git push --force origin
   main:pruebas`, o sin `git push`: una petición de cambios de `main` a `pruebas` fusionada al
   momento). Todo el trabajo de código de la fila sube a `pruebas`, nunca directo a `main`. Las
   subidas que solo tocan `docs/` (EN CURSO, estimaciones, HECHA) siguen yendo directas a `main`:
   no publican nada.
2. Si git rechaza la subida a `pruebas` (a veces el entorno solo deja subir a tu rama
   `claude/...`): sube a tu rama, abre una petición de cambios contra `pruebas` y fusiónala tú
   mismo en ese momento con la herramienta de GitHub (`merge_pull_request`), sin esperar a nadie.
   Nunca dejes una petición de cambios abierta.
3. Nunca subas ficheros de código uno a uno con las herramientas de ficheros de GitHub
   (`create_or_update_file` o `push_files`): los ficheros grandes se cortan al subir. Si git no
   puede subir de ninguna manera, para: deja la fila EN CURSO y dilo en tu mensaje final.
4. No esperes a GitHub Actions ni arregles sus fallos como condición para publicar. Lo que vale es
   `npm test` en tu sesión y la publicación comprobada en Vercel (regla general de abajo). Si
   Actions falla en una prueba que en tu sesión pasa, no la persigas: apúntala en una línea en
   `docs/COLA.md` («Lo que queda por hablar con Francisco») y sigue.
5. Con la aprobación del revisor, `pruebas` pasa a `main` (`git push origin pruebas:main` si es
   avance limpio; si no, fusión y subida; sin `git push`, petición de cambios `pruebas` → `main`
   fusionada al momento). Publicaciones de Vercel por fila: como mucho tres (una o dos a
   `pruebas`, una a `main`). No hagas subidas sueltas fichero a fichero.

**Pruebas: parciales mientras trabajas, completas una sola vez** (28-sep-2026, pedido por
Francisco; manda sobre cualquier otra regla de la cola que pida más pasadas completas):

1. Mientras programas, pasa solo las pruebas de lo que tocas: `npm test -- <palabra> [<palabra>…]`
   (el ejecutor lanza las que llevan esas palabras en el nombre), más las pruebas nuevas de la fila.
2. La pasada completa (`npm test` sin palabras) se hace **una sola vez**, justo antes de la subida
   del cambio. Si sale en verde, se sube; no se repite «para confirmar».
3. Si en esa pasada falla una prueba: arréglalo y repite **solo esa prueba y las de lo que hayas
   vuelto a tocar**, no las 170. Si la que falla no tiene nada que ver con tu cambio y en solitario
   pasa, es de las de tiempos finos: añádela a `EN_SOLITARIO` y sigue, sin investigarla más.

**Estimación de tiempo** (28-sep-2026, pedida por Francisco): en la misma subida que marca una fila
EN CURSO, y ya leída su instrucción y el código que toca, pon al día `docs/ESTIMACIONES.md`: una
línea por cada fila que queda (la EN CURSO y todas las PENDIENTE), con los minutos que calculas
para cada una entera (programar, pruebas, publicar y comprobar) y el motivo en pocas palabras.
Borra las filas ya HECHAS. Esa subida tiene que llegar a `main`, no solo a la rama de trabajo: la
página de estado de Francisco lee `main`. No es una subida más: va en la misma de la marca.
Al marcar una fila HECHA, escribe siempre la hora junto a la fecha, en hora de Madrid:
`HECHA (28-sep-2026 14:05)`. Así la página de estado puede calcular lo que tardó de verdad cada
fila. No cambies las filas ya escritas.

**Ideas y diseño** (28-sep-2026, decidido por Francisco): en `docs/COLA.md` puede haber filas
con estado IDEA o EN DISEÑO. No son trabajo para Claude Code: nunca se cogen, ni se marcan, ni
se estiman en `docs/ESTIMACIONES.md`, ni se mueven, ni se borran. «La primera PENDIENTE» se
cuenta saltándolas. Solo una conversación de diseño las pasa a PENDIENTE, cuando Francisco
cierra el diseño.

**El revisor** (28-sep-2026, `docs/REVISOR-ANTES-DE-PUBLICAR.md`, fila 223): antes de tocar
`main`, cada tarea PENDIENTE lleva su sección «Cómo sabemos que está bien» (si una fila anterior a
la 223 no la tiene, la sesión la escribe al cogerla, a partir del propio documento). Con el cambio
ya publicado en `pruebas` y comprobado por `curl`, la propia sesión lanza un agente aparte, con
contexto limpio (sin ver el código ni el diff), que entra por Playwright en la copia de pruebas
publicada con `?demo=1` y pasa esa lista, con el guion fijo de `docs/REVISOR-GUION.md`. Un punto
**[SOLO FRANCISCO]** no lo pasa el revisor: queda NO COMPROBADO, se copia a
`docs/COMPROBAR-A-MANO.md` y se avisa a Francisco en una línea al terminar. **APROBADA**: se
publica en `main` (regla general de abajo) y la fila se marca HECHA. **RECHAZADA** la primera vez:
se arregla solo lo que dice el informe, se sube a `pruebas` otra vez y se llama a un revisor nuevo
desde cero, sin contarle qué se arregló. **RECHAZADA** la segunda vez: la fila pasa a **DEVUELTA**
con el informe, `main` no se toca, y la sesión para (mensaje que empieza por «DEVUELTA:»). El
siguiente lanzamiento coge primero las filas DEVUELTA, antes que cualquier PENDIENTE; DEVUELTA dos
lanzamientos seguidos pasa a BLOQUEADA. Nada de esto se para a pedir permiso ni a preguntarle nada
a Francisco: las decisiones a mitad camino las toma la sesión y las deja escritas en la nota de la
fila. Detalle completo, y los permisos que hacen falta, en `docs/REVISOR-ANTES-DE-PUBLICAR.md`.

## Regla general de publicación (manda sobre cualquier otra regla)

Acordada con Francisco el 26-sep-2026 para todos sus proyectos. Ese día, en otro proyecto,
ninguna publicación salió bien durante horas y se marcaron filas como HECHAS «con todo en
verde», porque solo se probaba en el entorno de trabajo. Para que no pase:

1. **Una fila solo es HECHA cuando está publicada y comprobada.** Probar en tu entorno (tipos,
   pruebas, compilar) es necesario, pero no basta. Hay que comprobar al menos una de estas dos
   cosas: (a) la dirección publicada sirve la versión nueva; (b) la plataforma de publicación
   dice que la publicación de ese commit terminó bien.
2. **Al empezar cualquier sesión, lo primero:** comprobar la última publicación. Hay dos casos
   (28-sep-2026, `docs/PUBLICAR-SIN-PARAR.md`):
   - **Rota por nuestro código** (la construcción falla, la web da error, falta un fichero que
     debería estar): arreglarla es lo único que se hace. Nada nuevo encima de una publicación rota.
   - **Vercel no publica por una causa ajena** (tope diario, 402 «Resource is limited»,
     publicación que no arranca, cola de más de 20 minutos): no es una publicación rota. **Se
     sigue trabajando.**
   Además, las filas SIN PUBLICACIÓN COMPROBADA se comprueban ahora: si la web ya sirve una
   `App.VERSION` igual o posterior a la suya, pasan a HECHA en la misma subida que marca la nueva
   fila EN CURSO.
3. **Si no puedes comprobarlo por una causa ajena:** la fila no se marca HECHA. Se deja como
   **SIN PUBLICACIÓN COMPROBADA**, con el motivo en una línea, y la sesión termina con normalidad
   (regla 0: para, y el siguiente lanzamiento coge la siguiente PENDIENTE). El tope de Vercel
   **no para la cola**. Tu mensaje final empieza exactamente con: «AVISO: no he podido comprobar
   que los cambios estén publicados.» **Como mucho un `create_deployment` a mano por sesión**; si
   responde 402, no se reintenta. Esto sustituye el «déjalo anotado para que otra sesión lo
   compruebe» de la regla 19 de `docs/COLA.md`.
4. **Si Francisco dice que no ve un cambio,** lo primero es comprobar si se publicó. Nunca
   suponer que es la caché del navegador sin haberlo comprobado.
5. **«En verde»** en un mensaje a Francisco solo se dice si la publicación también lo está.

Cómo se comprueba en este proyecto: se publica en Vercel. `App.VERSION` de la web publicada
(`js/version.js?v=<algo distinto>`) tiene que ser de después de tu subida; con la herramienta
de Vercel, `list_deployments` con el `sha` del commit. Detalle en la regla 19 de `docs/COLA.md`.
