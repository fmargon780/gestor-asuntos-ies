# Que la prueba del Centro de datos no falle sin motivo

Fila 420 de `docs/COLA.md`. Diseñada con Francisco el 22-oct-2026.

## Por qué

`pruebas/centro-de-datos.mjs` comprueba que el Gestor coge bien los listados del Centro de datos
(alumnado, personal, alumnado de la base de datos, tutorías, Consejo Escolar, registro). Desde el
15-oct-2026 está en `RETIRADAS` (`pruebas/ejecutar.mjs`): la pasada completa no la lanza. Mientras
siga ahí, ningún cambio comprueba que el Gestor sigue cogiendo bien esos listados.

El informe de la fila 335 (`docs/INFORME-335-CENTRO-DE-DATOS-Y-VELOCIDAD.md`) vio que falla también a
solas y sin tocar nada. La causa apuntada está en la comprobación «al entrar, con un guardado en
marcha, espera y luego lo toma»: sustituye `ColaGuardado.hayGuardado` por una función que dice «sí» en
las dos primeras llamadas. Pero otra tarea de fondo de la página también llama a `hayGuardado`, se
queda con esas dos llamadas, y cuando `CentroDeDatos._alEntrarDeNuevo()` pregunta ya le dicen «no».
Además usa dos pausas fijas (1,7 s y 5,2 s).

No cambia nada de lo que se ve en la aplicación.

## Alcance (decidido con Francisco)

- **Solo esta prueba.** Las demás de `RETIRADAS` no se tocan.
- **Solo se cambia la prueba**, no la aplicación (`js/`). Si para que la prueba pase hiciera falta
  cambiar la aplicación, la fila queda BLOQUEADA (ver «Si no sale»). La única excepción es la rotura
  a propósito del paso 5, que se deshace antes del primer commit (`git diff js/` tiene que salir
  vacío al subir).

## Qué hay que hacer

1. Lanzar `npm test -- centro-de-datos.mjs` (con `.mjs`: sin él se lanzan también otras cinco pruebas
   que llevan esa palabra) en `main` sin tocar nada y apuntar **todas** las
   comprobaciones que fallan, no solo la del guardado en marcha. Puede haber más de una.
2. Arreglar la del guardado en marcha:
   - El «guardado en marcha» de mentira tiene que ser un interruptor que la prueba enciende y apaga
     ella misma (por ejemplo, una variable que `hayGuardado` lee), no un contador de llamadas. Así da
     igual quién más pregunte.
   - Ojo: `js/centro-de-datos.js` espera como mucho unos 15 s (10 intentos de 1,5 s) y después coge
     el listado aunque siga habiendo un guardado. Así que la primera fase dura menos de 10 s.
   - Primera fase: con el interruptor encendido, llamar a `_alEntrarDeNuevo()`, dejar pasar unos 3 s
     y comprobar que el personal sigue con la huella vieja (`h-per-1`). No se cuentan llamadas a
     `hayGuardado`: también la consultan otras tareas de la página.
   - Segunda fase: apagar el interruptor y esperar a la condición «la huella es la nueva (`h-per-9`)»,
     con un tope de 20 s que solo sirve para no colgarse.
   - La función `hayGuardado` original se devuelve siempre al terminar, aunque la comprobación falle
     (`finally`), para no dejar colgadas las comprobaciones siguientes.
3. Quitar **todas** las pausas fijas de la prueba (`waitForTimeout(…)`, `setTimeout` de espera), fallen
   o no en el paso 1, salvo la de 3 s de la primera fase del paso 2: cambiarlas por esperas a una
   condición. Cualquiera de ellas puede hacer fallar una de las tres pasadas del paso 7.
4. **Modelo de datos reales: el alumnado.** La carpeta inventada trae `REGALUM_LATIN1` (4 alumnos,
   latin-1). La referencia del fichero real de Séneca son las columnas que exige `js/datos-alumnado.js`,
   que es quien lee el `RegAlum.csv` de verdad. Si a `REGALUM_LATIN1` le falta alguna columna que ese
   código necesita, se añade al final, sin quitar ni mover las que hay y sin cambiar los 4 alumnos
   (otras comprobaciones cuentan «4 alumnos» y lo comparan byte a byte). Si no le falta ninguna, no se
   toca y se dice en la nota. El otro RegAlum escrito dentro de la prueba (el de `_GESTOR/datos`) no se
   toca. Nombres siempre inventados.
5. Comprobar que la prueba sigue vigilando de verdad: romper a propósito, solo en tu copia y sin
   subirlo, la parte de `js/centro-de-datos.js` que espera a que termine un guardado (que tome el
   listado aunque haya uno en marcha). La prueba tiene que fallar. Después, deshacerlo.
6. Sacar `centro-de-datos.mjs` de `RETIRADAS` en `pruebas/ejecutar.mjs` y poner al día
   `docs/PRUEBAS-RETIRADAS.md` si la nombra.
7. La pasada completa (`npm test`) tres veces seguidas: esta prueba tiene que pasar las tres **a la
   primera**, sin el segundo intento a solas. Es la excepción de `CLAUDE.md` («si la que ha necesitado
   segundo intento es una prueba de tu fila, no vale»). Si alguna de las tres necesita segundo
   intento, no está arreglada.

Excepción de esta fila a la regla «la pasada completa una sola vez» de `CLAUDE.md`: aquí son tres,
porque lo que se arregla es justo que falle de vez en cuando.

## Cómo sabré que está bien

No cambia nada en pantalla. Francisco lo lee en la nota de la fila de `docs/COLA.md`:

1. La nota dice que `centro-de-datos.mjs` pasó en la pasada completa tres veces seguidas, las tres a
   la primera (sin segundo intento).
2. La nota dice que la prueba ya no está en la lista de pruebas apartadas (`RETIRADAS`).
3. La nota dice que, con la espera del guardado rota a propósito (paso 5), la prueba falló; y que
   después se deshizo.
4. El revisor, con la copia de pruebas de la aplicación (`?demo=1&auto=1`), ve que el Gestor sigue
   cogiendo los listados del Centro de datos como hasta ahora: en Ajustes, el bloque «Centro de datos»
   sale con su carpeta y sus listados, sin avisos nuevos.

## Ejemplo con datos reales

El listado de alumnado (`RegAlum.csv` de Séneca), punto 4 de «Qué hay que hacer».

## Si no sale

- Lo que cuenta en las tres pasadas es solo esta prueba. Si falla otra, se apunta en una línea en la
  nota y se sigue.
- Si alguna comprobación falla porque la aplicación hace algo mal (no por cómo está escrita la
  prueba): no se arregla la aplicación. La fila queda **BLOQUEADA**, con la comprobación y lo que
  hace mal la aplicación en una línea. Se apunta como IDEA nueva en `docs/COLA.md` con ese texto.
  La prueba sigue en `RETIRADAS`. Los arreglos de la prueba que ya estén hechos se suben igual
  (por la rama y el revisor, como abajo).
- Si en una de las tres pasadas la prueba necesita segundo intento: se busca la espera que falta y
  se repiten las tres. Si tras dos intentos de arreglo sigue igual, BLOQUEADA con lo visto.

## Publicar

Cambia `pruebas/`, así que va por la rama `fila-420` y el revisor en local antes de `main`, como
cualquier fila con código (`CLAUDE.md`). No cambia nada de `js/`: no se publica en Vercel ni se
comprueba `App.VERSION`. La fila es HECHA cuando su commit está en `main`. Sin línea en
`js/novedades.js` (no hay nada visible).
