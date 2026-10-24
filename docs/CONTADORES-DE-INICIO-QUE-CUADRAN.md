# Contadores de Inicio que cuadran (fila 451)

Diseñado con Francisco el 24-oct-2026 (tema 403, idea 400). Valen las cláusulas comunes de
`docs/REPARTO-DE-LA-COLA-2026-09-27.md` (a `main` sin pull request, como mucho tres subidas, nada se
sube con `npm test` en rojo) y el revisor de `docs/REVISOR-ANTES-DE-PUBLICAR.md`. Manda sobre
`docs/INICIO-EN-PESTANAS.md` (fila 209) y `docs/POR-LIQUIDAR.md` (fila 249) en lo que diga distinto.

## Por qué

En Inicio, los números de las pestañas no suman el de «Todos los abiertos». Captura de Francisco del
21-oct-2026 (copia sin internet, perfil Administración):

| En Administración | En espera | Todos los abiertos | Dormidos | Por liquidar |
|---|---|---|---|---|
| 11 | 3 | 26 | 0 | 11 |

11 + 3 + 0 + 11 = 25. Falta uno. Hay dos causas:

1. **Un asunto abierto sin ningún hito por hacer no sale en ninguna pestaña.** «En Administración» y
   «En espera» salen de `QueMeToca.reunir()` / `QueMeToca.clasificar()`, que solo recogen asuntos con
   hito actual.
2. **Un asunto dormido cuenta dos veces**: en «Dormidos» y en «En Administración» o «En espera».

Francisco y Claude repasaron para qué sirven las pestañas (fila 209): contestar de un vistazo **qué
tiene que hacer Administración** y **qué se espera de otros**. «Dormido» no es un sitio sino un aviso:
un dormido en espera pide reclamar al otro; uno de Administración, que se ha olvidado. Por eso
«Dormidos» deja de ser pestaña y pasa a ser una marca en la fila.

## Cómo queda Inicio

Pestañas, en este orden: **En Administración · En espera · Todos los abiertos · Por liquidar**. Ya
no hay pestaña «Dormidos».

Cada asunto de «Todos los abiertos» sale en **una y solo una** de las otras tres:

1. **Por liquidar**: como ahora (`PorLiquidar.estaPorLiquidar`).
2. **En espera**: su hito actual es de otro responsable o está esperando a otro (ver abajo, `lado`).
3. **En Administración**: su hito actual es de Administración o sin responsable (como ahora), **y
   además los asuntos abiertos sin ningún hito por hacer** (sin hitos, o con todos hechos). En esos,
   donde las demás filas ponen el hito actual, pone **«Añade un hito o archívalo»**, en gris; van al
   final de la lista, después de los «Sin plazo». Si se les añade un hito, se colocan según él.

Por tanto: En Administración + En espera + Por liquidar = Todos los abiertos, siempre.

- **Un solo criterio de «hito por hacer» para todas las pestañas**: el del hito actual
  (`aQuienLeToca` de `js/hitos-a-quien.js`). Así un asunto no puede salir en dos pestañas ni en
  ninguna por culpa de las preguntas sin responder o de los hitos marcados «no aplica».
- **El reparto entre «En Administración» y «En espera» lo decide el `lado` de `aQuienLeToca`**, no
  solo el responsable del hito (decidido por Francisco): un hito de Administración marcado a mano
  «Esperando a…» va a «En espera». Es lo mismo que ya enseña la columna de «Todos los abiertos».
- **Un asunto de un tipo con la casilla «Por liquidar» y sin hito por hacer pasa solo a «Por
  liquidar»** (decidido por Francisco): al pintar Inicio (`auto`), con la regla de
  `PorLiquidar.revisar`, sin aviso, como `alEntrar`, y nunca con un guardado en marcha. Manda esa regla:
  un asunto sin hitos cuya guía aún tiene pasos por crear (se crean al abrir la ficha) no pasa; se
  queda en «En Administración» con el texto **«Abre el asunto para cargar sus pasos»** en lugar de
  «Añade un hito o archívalo».
- «Por liquidar» se ve cuando algún tipo lleva la casilla **o cuando tiene algún asunto** (puede haber
  asuntos marcados de antes).
- La suma cuadra **también con la búsqueda y con los filtros de «Filtros»** puestos. No hace falta
  que cuadre con el filtro de un aviso («Filtrado por…»), que solo recorta «Todos los abiertos».
- El perfil directivo no cambia: sigue viendo solo «Todos los abiertos».

## Dormido: una marca en la fila

- Qué es dormido no cambia: `QueMeToca.reunirDormidos()` (sin novedades desde hace
  `App.diasDormido()` días; los ocultados con `ficha.dormidoOcultoHasta` todavía en el futuro no
  llevan marca).
- El asunto dormido se queda en su pestaña. En su fila, junto al nombre, una etiqueta pequeña en
  ámbar: **«Dormido · N días»**. Sale en «En Administración», «En espera» y «Todos los abiertos».
  **No** sale en «Por liquidar» (esos asuntos están quietos a propósito, como hoy, que se excluyen de
  los dormidos), y allí tampoco vale el filtro «Solo dormidos».
- En cuanto alguien hace algo en él, la marca desaparece. Cuenta como actividad: una nota, un cambio
  de situación, una edición del asunto y **marcar o desmarcar un hito** (hoy `ultimaActividad` no mira
  ni la situación, porque nadie guarda `situacionEl`, ni los hitos: hay que añadir las dos cosas, la
  de los hitos con `hechoEl`).
- Lo que hoy se puede hacer desde la pestaña «Dormidos» (dejar de avisar hasta una fecha,
  `dormidoOcultoHasta`) pasa al menú ⋮ de la fila de un asunto dormido. El perfil directivo ve la
  marca, pero no esa opción del menú.
- **Filtro «Solo dormidos»**: una opción más en «Filtros» (en el desplegable de Situación o como
  casilla, lo que encaje mejor). Con él puesto, cada pestaña y su número muestran solo los dormidos.
- Los días de dormido siguen en Ajustes → El centro → «Días de aviso». No se crea ningún aviso nuevo
  de dormidos en la línea de avisos: basta con la marca y el filtro.

## Qué no se toca

- El número de «Todos los abiertos» y su tabla.
- La ayuda al pasar el ratón por pestañas y botones es otra idea (fila 452, IDEA): no se hace aquí.

## Ejemplo con datos reales

Los datos reales del centro no los ve Claude Code. El ejemplo real es la captura de arriba: tras el
cambio, en el ordenador de Francisco, En Administración + En espera + Por liquidar tienen que sumar
lo mismo que «Todos los abiertos» (26 aquel día), y el asunto que faltaba tiene que salir en «En
Administración» con «Añade un hito o archívalo». **[SOLO FRANCISCO]**: apuntarlo en
`docs/COMPROBAR-A-MANO.md`.

Para comprobarlo aquí, en la demostración: un asunto abierto sin hitos, otro con todos los hitos
hechos y de un tipo sin «Por liquidar», otro igual pero de un tipo con «Por liquidar», y uno dormido
(última actividad de hace más de 60 días). Si la demostración no los trae, añadirlos.

## Cómo sabré que está bien

Acordadas con Francisco:

1. En Inicio, En Administración + En espera + Por liquidar suman lo mismo que «Todos los abiertos».
   Con los datos de Francisco del 21-oct, 26.
2. Ya no hay pestaña «Dormidos». Un asunto dormido sigue en su pestaña, con la marca «Dormido · N
   días» junto al nombre.
3. Con el filtro «Solo dormidos» puesto, cada pestaña enseña solo sus dormidos.
4. Un asunto sin hito pendiente sale en «En Administración», al final, con el texto «Añade un hito o
   archívalo».
5. Si se escribe una nota en un asunto dormido, la marca desaparece.

Prueba nueva (`pruebas/contadores-de-inicio.mjs`) que cubra estos puntos con la demostración, también
la suma con un filtro y con una búsqueda puestos. Adaptar las pruebas que contaban con la pestaña
«Dormidos».

## Al terminar

- Poner al día en `docs/CONTEXTO-CORTO.md` la línea de Inicio (cuatro pestañas, la regla de una sola
  pestaña por asunto, la marca y el filtro de dormidos) y la de «Por liquidar».
- Decirle a Francisco, en pocas frases, qué va a ver distinto en Inicio.
