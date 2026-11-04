# 504 — Filas devueltas a la vista

## Lo que escribió Francisco
Centro de mando: que las filas DEVUELTA salgan en «En cola» (en la tabla de entrada y en la pestaña
Trabajo) y que «Abrir Claude Code» las ofrezca primero. Hoy solo salen en una pastilla «Devueltas»
dentro de la app, y la fila 59 de Dieta familiar no se veía (31-oct-2026).

## Lo que entendió Claude (acordado con Francisco el 4-nov-2026)
- El cambio está en el Centro de mando, así que vale para todas las apps. Cada app no cambia.
- Las filas DEVUELTA cuentan como filas en cola: en la tabla de entrada, en la pestaña Trabajo y en
  el recuadro de estado («N filas en cola», «La siguiente es la fila X»).
- Tabla de entrada: en la columna «En cola», el número total y, a su derecha, en rojo y entre
  paréntesis, cuántas de esas filas están devueltas: «5 (2)». Si no hay devueltas, no sale paréntesis.
  También en la fila de totales. Los números de la columna quedan alineados en vertical, unos debajo
  de otros, y los paréntesis en un hueco fijo a su derecha.
- Debajo de la tabla, esta leyenda: «En rojo y entre paréntesis, junto al número de «En cola»:
  cuántas de esas filas están devueltas.»
- Pestaña Trabajo: las devueltas salen en la lista «En cola» con la marca «Devuelta». Llevan
  estimación de tiempo como las demás.
- Una fila devuelta llega arriba de la cola, pero tiene flechas como las demás: **Francisco decide
  el orden completo** y puede poner una PENDIENTE delante de una devuelta. Sustituye a la regla «la
  DEVUELTA va siempre delante».
- «Abrir Claude Code» ofrece la primera fila de «En cola», sea devuelta o pendiente. Si solo hay
  devueltas, también sale el botón: ya no pone «Nada en cola».
- Desaparecen la pastilla «Devueltas» y el texto «Devuelta por el revisor: se retoma antes que las
  demás». «Ver todas» no cuenta dos veces las devueltas.

## Pantalla de prueba (aprobada el 4-nov-2026)
- `docs/pantallas/504.html` · https://claude.ai/artifact/A5bQ7cdyUNdLaVPkVbJ1bp
- El botón «Simular…» y la franja verde de arriba son solo de la prueba: no van a la app.

## Qué NO se hace en esta tarea
- Cambiar la regla en el método (`disenar-idea`, «Ordenar la cola»): es la idea 506, que se trata en
  el proyecto «Método de desarrollo de apps».
- Tocar el orden de las filas DEVUELTA que ya están en las colas.

## Notas técnicas de Claude
- Es el artefacto Centro de mando (https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E): no se programa
  en este repositorio, se publica el artefacto, igual que la fila 499. Antes se lee entero. Si la
  sesión no puede publicarlo, BLOQUEADA con «ATASCO PARA CLAUDE».
- `analiza`: `r.pend` incluye las DEVUELTA en el orden de la cola; `r.devueltas` queda para contar.
  Quitar la tarjeta «devuelta», su lista y la suma doble en «Ver todas».
- `mover` y «Guardar el nuevo orden» deben poder mover las filas DEVUELTA en `docs/COLA.md`.
- `bloqueLanzar`, `fraseBase`: la primera de `r.pend`. Frase: «Coge la primera fila DEVUELTA o
  PENDIENTE de docs/COLA.md, en el orden de la cola: debe ser la fila N.» Si es DEVUELTA: «Está
  DEVUELTA: lee su nota y retómala desde lo que quedó hecho.» Si es PENDIENTE con una DEVUELTA detrás:
  «Hazla aunque haya una DEVUELTA detrás: Francisco ha puesto este orden.» Aplicarlo también al
  encargo de varias filas (`frase`, rama `varias`).
- Quien marca una fila DEVUELTA la deja encima de las PENDIENTE: decirlo en el encargo. Cambiar en
  este repositorio «coge primero las DEVUELTA» por «la primera DEVUELTA o PENDIENTE en el orden de la
  cola» (`CLAUDE.md`, reglas 0 y 2 de `docs/COLA.md`, `docs/REVISOR-ANTES-DE-PUBLICAR.md`).
- Línea nueva en la lista de versiones del artefacto y en el texto del pie («En cola»).

## Cómo lo comprueba el segundo revisor
- Tabla: una app con devueltas enseña «5 (2)» con el paréntesis en rojo; sin devueltas, sin paréntesis.
- Fila de totales con su paréntesis, leyenda debajo y números alineados en vertical.
- Una app con solo devueltas tiene botón «Abrir Claude Code: fila N».
- Pestaña Trabajo: devueltas en «En cola» con su marca y sin pastilla «Devueltas».
- Las flechas mueven también las devueltas; al guardar, el orden llega a `docs/COLA.md`.
- Con una PENDIENTE delante, el botón ofrece esa fila y la frase dice que se haga aunque haya una
  DEVUELTA detrás.
- Lo que no pueda ver en las colas reales lo dice en vez de darlo por bueno.

## Revisión y respuestas durante el trabajo
