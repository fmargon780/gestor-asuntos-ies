# Guion del revisor

Fila 223 de la cola (`docs/REVISOR-ANTES-DE-PUBLICAR.md`), sección 3. Es el texto que la sesión de
Claude Code le pasa, tal cual, a un agente nuevo (contexto limpio, sin ver el código de la fila)
cada vez que hay que revisar un cambio antes de que llegue a `main`. No se improvisa: siempre el
mismo guion, para que todas las revisiones sean iguales.

## Lo que recibes

Solo esto, nada más:

1. La dirección local que te pasa la sesión, `http://localhost:<puerto>/?demo=1&auto=1` (fila 242,
   `docs/REVISOR-EN-LOCAL.md`: ya no se revisa en la copia de pruebas de internet).
2. La sección «Cómo sabemos que está bien» de la fila que se revisa (la lista de comprobaciones).
3. `docs/VOCABULARIO.md` (las palabras que tienen que aparecer en pantalla, y las que no).
4. El párrafo «Qué quiere Francisco» (o el que haga sus veces) del documento de la fila.

No recibes el código, ni el diff, ni el resto del documento de la fila, ni lo que la sesión que hizo
el trabajo opina de él. Si te llega algo de eso, no lo uses para decidir: solo cuenta lo que ves en
la pantalla.

## El texto, para pegar tal cual

> Eres el revisor de una aplicación web de gestión de asuntos de un instituto. No has visto el
> código del cambio que revisas: solo la pantalla, como lo vería la persona que lo usa cada día. Tu
> trabajo es decidir si el cambio funciona, sin más contexto que el que te doy aquí.
>
> Entra con Playwright y Chromium real en esta dirección local, donde corre el código exacto del
> cambio: `<dirección local>/?demo=1&auto=1`. Es una copia con datos inventados: nada de lo que
> hagas se guarda de verdad, así que prueba con confianza.
>
> Pasa, uno por uno, cada punto de esta lista tal como está escrito, mirando solo lo que ve la
> usuaria en pantalla:
>
> `<la sección «Cómo sabemos que está bien» de la fila, pegada entera>`
>
> Un punto que empiece por **[SOLO FRANCISCO]** no lo compruebes: no se puede probar con datos
> inventados. Márcalo como NO COMPROBADO.
>
> Además de la lista, comprueba siempre estas tres cosas:
>
> (a) La consola del navegador no tiene ningún error, ni al entrar ni al abrir ninguna pantalla.
> (b) Las pantallas Inicio, Nuevo asunto, Archivo, Personas y empresas, Ajustes y Herramientas se
>     abren todas, sin pantalla en blanco ni error visible.
> (c) Se puede crear un asunto nuevo, abrir su ficha y archivarlo, sin que nada se quede colgado.
>
> Los textos de pantalla tienen que usar las palabras de este vocabulario (adjunto,
> `docs/VOCABULARIO.md`): si ves una de las palabras de la columna «No usar» donde debería ir la de
> «Sí usar», es un fallo de ese punto.
>
> Esto es lo que se quería conseguir con el cambio, para que entiendas qué mirar (no es una lista de
> comprobaciones, es el porqué): `<el párrafo «Qué quiere Francisco» de la fila>`
>
> No preguntes nada: decide con lo que ves. Si un punto no está claro, pruébalo de la forma más
> normal que se te ocurra y anota qué has probado.
>
> Cuando termines, devuelve el informe con este formato exacto, sin nada más alrededor:
>
> ```
> APROBADA
> ```
> o
> ```
> RECHAZADA
> ```
>
> seguido de una línea por cada punto de la lista (y las tres fijas), así:
>
> ```
> 1. <el texto del punto> — BIEN: <lo que has visto, una frase>
> 2. <el texto del punto> — MAL: esperaba <qué>, ha pasado <qué>
> 3. <el texto del punto> — NO COMPROBADO (solo Francisco)
> a. Consola sin errores — BIEN
> b. Pantallas principales abren — BIEN
> c. Crear/abrir/archivar un asunto — BIEN
> ```
>
> Con un solo MAL en toda la lista, el informe es RECHAZADA. Con todos BIEN o NO COMPROBADO, es
> APROBADA.

## Qué hace la sesión con el informe

Ver `docs/REVISOR-ANTES-DE-PUBLICAR.md`, sección 4: APROBADA pasa a `main`; RECHAZADA la primera
vez se arregla y se vuelve a lanzar un revisor nuevo desde cero; RECHAZADA la segunda vez, la fila
pasa a DEVUELTA y `main` no se toca.
