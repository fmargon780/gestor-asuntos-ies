# Gestor de asuntos del IES

## Reglas comunes (método de trabajo, 26-oct-2026)

**Lee y sigue `docs/METODO-COMUN.md` antes de coger cualquier fila.** Son las reglas comunes a
todas las apps: qué leer al empezar (incluido `docs/LECCIONES.md`), la ficha manda, cuándo parar
y preguntar, atascos, lecciones, ahorro, comprobar y publicar. Es una copia del método
(`fmargon780/metodo-apps`): no se edita aquí. Lo que sigue en este fichero son reglas propias de
esta app; mandan solo en lo propio (cómo se publica, ramas, revisor, pruebas).

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
   `main`: no publican nada (Vercel ya no publica solo, ver «Vercel no publica nada solo» abajo).
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
   normal; sin `git push`, petición de cambios fusionada al momento) y se publica a propósito, una
   sola vez (`create_deployment`, regla de abajo): es la única publicación de la fila. La rama `pruebas` ya no existe ni se nivela.

**Pruebas: parciales mientras trabajas, completas una sola vez** (28-sep-2026, pedido por
Francisco; manda sobre cualquier otra regla de la cola que pida más pasadas completas):

1. Mientras programas, pasa solo las pruebas de lo que tocas: `npm test -- <palabra> [<palabra>…]`
   (el ejecutor lanza las que llevan esas palabras en el nombre), más las pruebas nuevas de la fila.
2. La pasada completa (`npm test` sin palabras) se hace **una sola vez**, justo antes de la subida
   del cambio (salvo que sea larga: ver «Pasada completa de pruebas: una vez al día si tarda»). Si sale en verde, se sube; no se repite «para confirmar».
3. Si en esa pasada falla una prueba: arréglalo y repite **solo esa prueba y las de lo que hayas
   vuelto a tocar**, no las 170. Y además:
   - (11-oct-2026, fila 333, `docs/PRUEBAS-SEGUNDO-INTENTO-A-SOLAS.md`) El ejecutor repite solo, una
     vez y a solas, cada prueba que falla en la tanda en paralelo. Si pasa en ese segundo intento,
     la pasada sale en verde y no hay nada que apuntar ni que apartar: **a `EN_SOLITARIO` ya no se
     añade ninguna prueba**.
   - Excepción: si la que ha necesitado segundo intento es una prueba **de tu fila** (nueva, o que
     has tocado), no vale. Arréglala para que espere a una condición y no a una pausa fija.
   - Una prueba que falla **también en el segundo intento**: si es de tu cambio, se arregla. Si
     falla igual en `main` sin tu cambio, va a `RETIRADAS` (mismo fichero) con fecha y motivo, y se
     dice en la nota de la fila en una línea.

## Pasada completa de pruebas: una vez al día si tarda (norma de Francisco, 22-oct-2026)

Sustituye a «la pasada completa, una sola vez justo antes de subir» cuando esa pasada es larga.
Manda sobre cualquier otra regla de `docs/COLA.md` o de `docs/` que diga lo contrario.

1. **`docs/PASADA-DIARIA.md`** guarda una sola línea viva, que se sustituye cada vez:
   `Última pasada completa: <fecha y hora de Madrid> · <minutos> min · <verde | con fallos> · commit <sha corto de main>`.
   Si no existe, la primera sesión que haga una pasada completa lo crea.
2. **Pasada corta (10 minutos o menos, o sin dato todavía):** todo sigue como antes. Pruebas de lo
   tocado mientras se trabaja; la completa, una vez justo antes de subir. Al terminarla se apunta en
   `docs/PASADA-DIARIA.md` cuánto ha tardado.
3. **Pasada larga (más de 10 minutos según `docs/PASADA-DIARIA.md`):** modo diario.
   a. Al empezar la sesión, si la fecha apuntada no es la de hoy (hora de Madrid), **lo primero** es
      la pasada completa sobre `main` recién bajado, antes de tocar la fila. Se apunta el resultado.
   b. Si sale en verde, se sigue con la fila normal.
   c. Si falla una prueba, se repite a solas. Si a solas pasa, es fallo de carga: se apunta en una
      línea y no cuenta como fallo. Si a solas también falla, se añade una fila nueva
      «Arreglar la prueba <nombre>, que falla en la pasada diaria del <fecha>» **encima de todas las
      PENDIENTE** de la cola (solo una DEVUELTA va delante), y esta misma sesión trabaja esa fila en
      vez de la que iba a hacer.
   d. Durante la fila, solo las pruebas de lo tocado, más las fijas que este repositorio obligue
      siempre. **No se repite la pasada completa antes de subir.** El revisor, donde lo haya, sigue
      igual.
   e. Si la sesión hace varias filas seguidas, la pasada diaria se hace una sola vez, al principio.
   f. Si en el día no se lanza ninguna fila, no se hace pasada: nada se programa solo.
4. **El mensaje final** de la primera fila del día empieza su resumen con
   «Pasada completa del día: <minutos> min, <en verde | con N fallos, arreglo apuntado el primero>.»
   Las demás filas del día no la mencionan.
5. Si una pasada completa (la diaria o una corta) tarda más o menos de lo apuntado, se actualiza el
   dato: la frontera de 10 minutos se mira siempre con la última medida.

**Terminal de la sesión** (fila 466, 27-oct-2026): **nunca `pkill -f` ni `pgrep -f`**: buscan en la línea de órdenes de todos los
procesos, también en la de la terminal de la sesión, y la cierran. Para parar un proceso, guarda su
número (PID) al lanzarlo y usa `kill <PID>`. `npm test` elige solo un puerto libre desde el 8123, así
que pueden correr dos tandas a la vez.

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

**Vercel no publica nada solo** (11-oct-2026, `docs/PUBLICAR-SOLO-AL-TERMINAR.md`). Ninguna subida a GitHub crea una
publicación. Una tarea que cambia la app publica **una sola vez, a propósito**, cuando su código ya está en `main`: herramienta `create_deployment` de Vercel con `teamId` `team_gnCjBLTS8m8PNTFVUf7ST0uN`, `name` y `project` `gestor-de-asuntos`, `target` `production` y `gitSource` `{ type: github, org: fmargon780, repo: gestor-asuntos-ies, ref: main }`; después `get_deployment` hasta `READY` y comprobar la dirección publicada. Las subidas de solo documentos no publican y no hay nada que comprobar. Si responde 402 no se reintenta. Nunca se vuelve a encender la publicación automática ni se añade un `ignoreCommand`: las publicaciones canceladas también cuentan en el tope de 100 al día de toda la cuenta.

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
   que los cambios estén publicados.» **Un `create_deployment` por fila con código** (es el camino normal, ya no el de emergencia); si
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
