# Gestor de asuntos del IES

Antes de nada, lee `docs/CONTEXTO.md` y después `docs/COLA.md`, como dice la cola.

**Una sola sesión a la vez, una fila tras otra** (27-sep-2026, cambiado el 1-oct-2026): nunca
trabajan dos sesiones de Claude Code a la vez en este repositorio ni dos filas a la vez. Por
defecto, cada lanzamiento hace, en una conversación nueva, solo la primera fila **DEVUELTA** (si la
hay) o si no la primera **PENDIENTE** de `docs/COLA.md`, la lleva hasta el final (revisor incluido)
y para. Si la frase de lanzamiento pide varias («las N primeras filas PENDIENTE» o «todas»), la
misma conversación las hace de una en una, en el orden de la cola, cada una completa (EN CURSO,
revisor, publicación comprobada, HECHA) antes de empezar la siguiente; antes de empezar cada fila
nueva mira `docs/PARAR.md` en `main`: si dice PARAR, lo cambia a SEGUIR, lo sube y para. Detalle en la regla 0 de la cola y en `docs/REVISOR-ANTES-DE-PUBLICAR.md`.

**Trabajar en la rama de la fila; a `main` solo con el revisor** (30-sep-2026, fila 242,
`docs/REVISOR-EN-LOCAL.md`: sustituye la norma «Trabajar en `pruebas`» del 28-sep-2026; las
sesiones no entran en `pruebas.fmargon.com`, el tope de Vercel es de toda la cuenta y nivelar
`pruebas` a la fuerza perdió trabajo):

1. Cada fila trabaja en su propia rama `fila-<nº>`, creada desde `main` al empezar (o en la rama
   `claude/...` que el entorno permita). **Nunca se nivela ninguna rama a la fuerza** si tiene
   commits que no están en `main`. La rama de una fila no se borra hasta que su trabajo está en
   `main`. Las subidas que solo tocan `docs/` (EN CURSO, estimaciones, HECHA) van directas a
   `main`: no publican nada.
2. Nada se sube a `pruebas` para revisarlo y nada espera a Vercel antes del revisor. Si git rechaza
   la subida a tu rama, sube a una `claude/...`, abre una petición de cambios y fusiónala tú mismo
   al momento (`merge_pull_request`). Nunca dejes una petición de cambios abierta.
3. Nunca subas ficheros de código uno a uno con las herramientas de ficheros de GitHub
   (`create_or_update_file` o `push_files`): los ficheros grandes se cortan al subir. Si git no
   puede subir de ninguna manera, para: deja la fila EN CURSO y dilo en tu mensaje final.
4. No esperes a GitHub Actions ni arregles sus fallos como condición para publicar. Lo que vale es
   `npm test` en tu sesión y la publicación comprobada (regla general de abajo). Si Actions falla
   en una prueba que en tu sesión pasa, apúntala en una línea en `docs/COLA.md` («Lo que queda por
   hablar con Francisco») y sigue.
5. Con la aprobación del revisor, la rama de la fila se fusiona en `main` (avance limpio o fusión
   normal; sin `git push`, petición de cambios fusionada al momento): es la única publicación de
   código de la fila. Después, `pruebas` se pone igual que `main` (`git push --force origin
   main:pruebas`) solo si antes `git merge-base --is-ancestor origin/pruebas origin/main` lo
   confirma; si no, no se toca y se apunta en una línea. No es un paso: nadie la espera.

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

**`docs/COLA.md` por debajo de 40 KB, siempre** (29-sep-2026, fila 226,
`docs/COLA-POR-DEBAJO-DE-40-KB.md`): las filas HECHA (salvo las de hoy y de ayer, que se quedan
hasta el día siguiente para el «Terminado hoy» del Centro de mando), DESCARTADA y SUSTITUIDA salen
de la tabla de `docs/COLA.md`; su texto completo, sin tocar, va a `docs/HISTORIA.md` (o a
`docs/COLA-CERRADAS.md` si aquel se hace inmanejable). Las notas largas de debajo de la tabla,
igual: lo resuelto a `docs/HISTORIA.md`, lo que sigue abierto, resumido en una o dos líneas en
`docs/COLA.md` o en un documento propio de `docs/`. Toda sesión que deje `docs/COLA.md` por
encima de 40 KB (`wc -c`) lo reduce en esa misma subida, con estos mismos criterios; es una subida
solo de `docs/`, va directa a `main` (regla de arriba) y no publica nada.

**El revisor** (28-sep-2026, `docs/REVISOR-ANTES-DE-PUBLICAR.md`, fila 223): antes de tocar
`main`, cada tarea PENDIENTE lleva su sección «Cómo sabemos que está bien» (si una fila anterior a
la 223 no la tiene, la sesión la escribe al cogerla, a partir del propio documento). Con el cambio
hecho en la rama de la fila, la propia sesión arranca un servidor local con ese código y lanza un
agente aparte, con contexto limpio (sin ver el código ni el diff), que entra por Playwright en
`http://localhost:<puerto>/?demo=1&auto=1` y pasa esa lista, con el guion fijo de
`docs/REVISOR-GUION.md` (fila 242). Un punto
**[SOLO FRANCISCO]** no lo pasa el revisor: queda NO COMPROBADO, se copia a
`docs/COMPROBAR-A-MANO.md` y se avisa a Francisco en una línea al terminar. **APROBADA**: se
publica en `main` (regla general de abajo) y la fila se marca HECHA. Con la APROBADA del revisor se publica en `main` sin esperar a Francisco (1-oct-2026:
`docs/VISTO-BUENO-DE-FRANCISCO.md` está ANULADO; nada pasa a esperar su revisión ni existe el estado
EN EL PAQUETE). **RECHAZADA** la primera vez:
se arregla solo lo que dice el informe, se rearranca el servidor local y se llama a un revisor nuevo
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
   pruebas, compilar) es necesario, pero no basta. Hacen falta las dos cosas (fila 242,
   `docs/REVISOR-EN-LOCAL.md`): (a) **el commit de la fila está en `main`**
   (`git merge-base --is-ancestor <sha> origin/main`; «la web sirve una versión posterior» no lo
   demuestra); y (b) Vercel lo ha publicado (la dirección sirve la versión nueva, o la
   plataforma dice que ese commit terminó bien).
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

Cómo se comprueba en este proyecto: se publica en Vercel. Por el primer camino que funcione:
a) `curl` a `js/version.js?v=<algo distinto>` de `asuntos.fmargon.com` o
`gestor-de-asuntos.vercel.app`: `App.VERSION` igual o posterior a la de la fila; b) el estado
«Vercel» del commit en GitHub (`success`); c) `list_deployments` con el `sha`. Detalle en la regla
19 de `docs/COLA.md`.
