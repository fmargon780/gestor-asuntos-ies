# Poner de acuerdo las reglas que se contradicen (fila 301 de la cola)

Problema que resuelve: hay asuntos con dos reglas escritas en sitios distintos que dicen cosas
contrarias, y una sesión que lee las dos se para o hace lo que ya no vale.
Sale del repaso de tropiezos del 7-oct-2026 (tropiezo T10). Diseño cerrado y aprobado por Francisco
ese día. No hay nada que preguntarle.

## Lo que se quiere

1. Cada asunto tiene **una sola regla**, escrita en **un solo sitio**.
2. Lo caducado **desaparece**: se borra o se corrige. No se añade más texto encima («esto ya no
   vale, ver…»).
3. Donde un documento repite una regla de `CLAUDE.md`, queda **una línea que remite a ella**, y
   nada más.

No cambia el método de trabajo. No cambia nada de la aplicación. En pantalla no cambia nada.

## Qué regla gana

Por este orden:

1. Lo que Francisco decidió **más tarde**, si la regla lleva fecha.
2. Si no hay fechas que lo aclaren: `CLAUDE.md` gana a `docs/COLA.md`, y `docs/COLA.md` gana a los
   demás documentos de `docs/`.
3. Si no se puede saber cuál vale: **no se cambia ninguna de las dos**. Se apunta en la nota de la
   fila, en una línea, qué dos reglas chocan y dónde está cada una.

## Contradicciones ya vistas

Comprueba cada una antes de tocar: alguna puede estar ya resuelta. Los números de regla son los de
`docs/COLA.md` del 7-oct-2026.

1. **En qué rama se trabaja.** `docs/AHORRO-CUOTA.md` dice «Sube el código a la rama `pruebas`» y
   manda abrir las peticiones de cambios contra `pruebas`. `docs/REPARTO-DE-LA-COLA-2026-09-27.md`
   dice lo mismo («Sube a `pruebas`», «una a `pruebas` con todo el código»). `CLAUDE.md`
   (30-sep-2026, fila 242) manda trabajar en una rama `fila-<nº>` y no subir nada a `pruebas`.
2. **Cómo se suben los ficheros.** La regla 15 de `docs/COLA.md` dice subir los ficheros de código
   con `create_or_update_file` uno a uno. `docs/REPARTO-DE-LA-COLA-2026-09-27.md` manda usar
   `push_files`. `CLAUDE.md` (punto 3 de «Trabajar en la rama de la fila») dice que nunca se suben
   ficheros de código con ninguna de las dos. Esto ya paró la fila 220. Mira también las reglas
   12, 14, 17 y 18 de `docs/COLA.md`, que hablan de esas mismas herramientas.
3. **Qué pasa cuando una fila se bloquea o está cogida.** La regla 5 de `docs/COLA.md` dice
   «márcala BLOQUEADA […] y sigue con la siguiente», y la regla 6, «sáltala y coge la siguiente
   PENDIENTE». La regla 0 dice que con una fila BLOQUEADA o DEVUELTA «la conversación también acaba
   ahí», y que con una fila EN CURSO de menos de 90 minutos «no se coge otra». Mira también la
   regla 3 («pasa a la siguiente») contra la regla 4 («para»).
4. **`.claude/settings.json`.** `docs/COLA.md`, en «Lo que queda por hablar con Francisco», dice
   que ese fichero «sigue sin poder crearlo ninguna sesión». El fichero existe desde el
   28-sep-2026. Comprueba que está en `main`; si está, esa nota sobra.
5. **El tamaño de `docs/CONTEXTO-CORTO.md`.** La regla 9 de `docs/COLA.md` pone el tope en 14.000
   caracteres. El fichero mide unos 39.000 (`wc -m`). O se recorta el fichero o se corrige el
   tope. Decides tú con el criterio de «Qué regla gana», y dices en la nota de la fila, en una
   línea, cuál de las dos cosas has hecho. Si recortas, no se pierde nada: lo que salga va a
   `docs/CONTEXTO.md` o a su hijo de `docs/contexto/`. Si corriges el tope, borra también la nota
   de `docs/COLA.md` que dice que el fichero «sigue por encima de los 14.000 caracteres».

## Busca si hay más

Después de esas cinco, busca otras. Como mínimo:

- En `CLAUDE.md`, `docs/COLA.md` (reglas y notas de debajo de la tabla), `docs/AHORRO-CUOTA.md`,
  `docs/REPARTO-DE-LA-COLA-2026-09-27.md`, `docs/REVISOR-ANTES-DE-PUBLICAR.md`,
  `docs/REVISOR-EN-LOCAL.md`, `docs/PUBLICAR-SIN-PARAR.md`, `docs/NO-GASTAR-PUBLICACIONES.md` y
  `docs/VISTO-BUENO-DE-FRANCISCO.md`.
- Estas palabras: `pruebas` como rama, `create_or_update_file`, `push_files`, «sigue con la
  siguiente», «EN EL PAQUETE», «visto bueno», «tarea programada», «pasada completa», «40 KB»,
  «14.000».

No toques los documentos de instrucción de filas ya HECHAS ni `docs/HISTORIA.md`: cuentan lo que
se hizo en su día, no son reglas.

## Cómo hacerlo

1. Solo se tocan `CLAUDE.md` y documentos de `docs/`. Ningún fichero de `js/`, `pruebas/`,
   `apps-script/` ni de configuración.
2. Borra o corrige el texto caducado en su sitio. Si un párrafo entero ya no vale, se borra entero.
3. Donde un documento repite una regla de `CLAUDE.md`, deja una sola línea: «Ver `CLAUDE.md`,
   apartado …».
4. Si un documento entero queda sin ninguna regla vigente, no lo borres: deja arriba una línea que
   diga dónde está la regla que vale, y quita el resto de sus reglas.
5. `docs/COLA.md` tiene que seguir por debajo de 40 KB (`wc -c`). Esta fila quita texto: debería
   bajar.
6. No cambies el formato de la tabla de la cola ni ninguna fila que no sea la tuya.
7. **Si el entorno no te deja modificar `CLAUDE.md`:** sube antes todo lo que sí puedas arreglar
   en `docs/`. Deja el texto exacto que propones para `CLAUDE.md` (párrafo viejo y párrafo nuevo)
   en `docs/REGLAS-DE-ACUERDO-PROPUESTA.md`. Marca la fila **BLOQUEADA** con ese motivo en una
   línea.
8. Es solo documentación, como la fila 226: va directa a `main`, en una sola subida, y no publica
   ninguna versión nueva. No hay nada que mirar en pantalla, así que el revisor no tiene lista que
   pasar: los puntos de abajo los compruebas tú. La fila es HECHA cuando su commit está en `main`.

## La nota de la fila

Corta, en lenguaje llano. Como mucho estas líneas:

- Cuántas contradicciones has resuelto.
- Qué has hecho con el tope de `docs/CONTEXTO-CORTO.md`.
- Una línea por cada pareja de reglas que choca y no has podido decidir.

El detalle de qué has borrado y dónde va a `docs/HISTORIA.md`, no a la cola.

## Cómo sabemos que está bien

1. Buscar `create_or_update_file` y `push_files` en `CLAUDE.md`, `docs/COLA.md`,
   `docs/AHORRO-CUOTA.md` y `docs/REPARTO-DE-LA-COLA-2026-09-27.md` ya no devuelve ninguna
   instrucción de subir ficheros de código con ellas.
2. Buscar «rama `pruebas`» y «a `pruebas`» en esos mismos cuatro documentos ya no devuelve ninguna
   instrucción de subir ahí el trabajo de una fila.
3. Las reglas 0, 3, 4, 5 y 6 de `docs/COLA.md` dicen lo mismo sobre cuándo para la conversación.
4. `docs/COLA.md` ya no dice que `.claude/settings.json` no se puede crear (si el fichero existe).
5. `wc -m docs/CONTEXTO-CORTO.md` queda por debajo del tope que diga la regla 9.
6. `docs/COLA.md` ocupa menos de 40 KB (`wc -c`) y su tabla tiene las mismas filas, en el mismo
   orden, que antes de empezar (salvo el estado de esta fila).
7. `git diff --stat` de la fila solo enseña `CLAUDE.md` y ficheros de `docs/`.
8. Las pruebas del repositorio siguen como estaban: no se ha tocado ninguna.
