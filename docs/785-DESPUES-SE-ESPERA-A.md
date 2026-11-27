# 785 — La guía dice a quién se espera después de una tarea

**Título llano:** Que la guía diga a quién se espera después de una tarea
**Para qué:** que, al hacer una tarea que deja el asunto en manos de otro (la familia, Jefatura, otro centro), la app la ponga en espera sola, con su día para volver a mirarla, sin tener que acordarse de pulsar «Esperando a…» en cada asunto.

## Lo que escribió Francisco
Tema 694 (pasar los tipos al molde nuevo), 27-nov-2026. En el repaso de las cinco tandas
(`docs/notas-diseno/694-repaso.md`, punto 1) Claude vio que las tandas daban por hecho que una tarea
«queda esperando a…» sola, y que la guía del molde nuevo no sabe decirlo. Le dio a elegir entre una
tarea pequeña más («en la guía, cada tarea puede decir "Después se espera a…", y al hacerla la app la
deja esperando sola, con su día para volver a mirarla») o ponerlas a mano. Francisco: «1».

## Lo que entendió Claude (acordado con Francisco el 27-nov-2026)

En la guía de un tipo «sin hitos», con una tarea elegida:
- Debajo de «Cuándo se hace» sale **«Después se espera a»**, un desplegable con «Nadie» (lo normal) y
  la misma lista de «A quién esperamos» que ya tiene la ventana «Esperando a…» (con «+ Nuevo…» al
  final, como en los demás desplegables).
- En la lista de la izquierda, la tarea lleva una marca: «⏳ <a quién>».
- Los rótulos no lo llevan.

En el asunto, según la tarea:
- **Tarea sin papel.** Al marcar la casilla no queda hecha: queda «Esperando a X desde el <hoy> ·
  volver a mirarlo el <día>», con los tres botones de hoy («Ya ha llegado», «Cambiar el día» y «Dejar
  de esperar»). «Ya ha llegado» la da por hecha. Si esa vez no hay que esperar a nadie, se pulsa «Ya
  ha llegado» y listo.
- **Tarea de un papel que enviamos** (su recorrido acaba en «Enviado»). Lo mismo, en el momento en
  que el papel queda enviado: la tarea no queda hecha hasta «Ya ha llegado».
- **Tarea de un papel que tiene que llegar** (todavía sin documento). Queda esperando a X cuando se
  termina la tarea que tiene justo encima en la lista. Cuando llega su documento, deja de esperar
  sola, como hoy.
- El día de volver a mirarlo lo propone la app sin preguntar: hoy más los días hábiles de Ajustes
  (el mismo número que para la firma). Se cambia con «Cambiar el día».
- Todo lo demás de la espera es lo de hoy: el asunto pasa a «Esperando a X»; al llegar el día vuelve
  a «En Administración» con «Reclamar a…» y el aviso de Inicio; queda apuntado en el Registro.
- Una tarea que ya está esperando o hecha no se toca. Una tarea «No aplica» tampoco.
- Las tareas que se añaden a mano en un asunto no lo llevan: ahí se sigue con «⋮ › Esperando a…».

Lo que cambia de lo que ya hay:
- La guía de la expulsión al aula de convivencia sigue funcionando igual: su tarea «Recibir la parte
  firmada y el compromiso» pasa a decir «Después se espera a: Familia» y espera al terminar la nota
  (que es cuando se envía).

## Pantalla de prueba
- No se pidió. Lo que se ve es lo escrito arriba.

## Qué NO se hace en esta tarea
- Poner «Después se espera a» en las guías de los tipos que se pasan al molde nuevo: lo hará el
  botón «Pasar los tipos al molde nuevo» (tema 694).
- Que una espera termine sola por algo distinto de la llegada del documento de su tarea.
- Plazo por tarea: en el molde nuevo el plazo es del asunto (17-nov-2026).

## Notas técnicas de Claude
- Dato en la tarea de la guía: `esperaA: '<id de «A quién esperamos»>'` (los de
  `EstadoHito.aQuienSePuedeEsperar`). `js/guia-sin-hitos.js`: el desplegable en la tarea elegida y la
  marca en `marcasHTML`; se borra en los rótulos, como `papel` y `soloSi`.
- Como `esperaAlEnviar` y «Cómo se hace», **se lee de la guía por `origenGuia`**, no se copia al
  asunto (`js/papel-espera-recibir.js` › `laGuiaLoDice`).
- `esperaAlEnviar: true` (fila 723) se sigue entendiendo: equivale a `esperaA` con «Familia» si el
  asunto es de alumnado y «Tercero» si no. `datos-biblioteca/aula-convivencia.json` puede quedarse
  como está.
- La espera es la de la fila 702: `guionHecho[<id>].espera = { quien, desde, volver }`, con
  `TareaPapel.diaPropuesto()` y `TareaEspera.avisar()`.
- Tarea sin papel: en `js/asunto-sin-hitos.js`, el `onchange` de `.ash-casilla` (línea 242): si la
  guía dice `esperaA` y la tarea no tiene espera, se pone la espera en vez de marcarla (y la casilla
  vuelve a quedar sin marcar). «Ya ha llegado» ya la marca hecha.
- Papel que enviamos: en `js/tarea-papel.js` › `ponerHechas`, una tarea con todos los pasos hechos y
  `esperaA` en la guía no se marca hecha: se le pone la espera una sola vez (apuntar en `papelDoc`
  que ya se puso, para que «Dejar de esperar» no la vuelva a poner) y queda hecha con «Ya ha
  llegado».
- Papel que tiene que llegar: hoy salta desde `js/papel-enviado.js` línea 60, con cualquier envío del
  asunto. Pasa a saltar cuando **la tarea de encima** (la anterior en el guion que no sea «No
  aplica») queda hecha: por su casilla, o en `ponerHechas`. Solo si la tarea de papel no tiene
  documento, ni espera, ni está hecha.
- Mira `SoloConsulta.activo()` antes de escribir. Sin envolver: puntos de enganche.
- Pruebas: las de `tarea-espera`, `tarea-papel`, `papel-espera` y `aula`; casos nuevos en
  `docs/CASOS-DE-PRUEBA.md` (una tarea sin papel, un papel que se envía y uno que tiene que llegar).
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- En la guía de un tipo «sin hitos», una tarea elegida enseña «Después se espera a», con «Nadie» y
  la lista de a quién se espera; al elegir a alguien, la tarea lleva su marca en la lista.
- En un asunto nuevo de ese tipo, al marcar una tarea sin papel con «Después se espera a: Familia»,
  no queda hecha: queda «Esperando a Familia…» con «Ya ha llegado», «Cambiar el día» y «Dejar de
  esperar», y el asunto sale como esperando.
- «Ya ha llegado» la deja hecha.
- Una tarea de un papel que se envía queda esperando al marcarse enviado, y no hecha.
- Una tarea de un papel que tiene que llegar queda esperando al terminar la tarea de encima, y deja
  de esperar al añadirle su documento.
- Un asunto nuevo de la expulsión al aula de convivencia: al enviar la nota, «Recibir la parte
  firmada y el compromiso» queda esperando a la familia, como antes.
- Una tarea sin «Después se espera a» se marca hecha como siempre.

## Qué mirar al terminar
- En la demostración, en «Cambiar la guía…» de un tipo sin hitos, poner «Después se espera a:
  Familia» en una tarea sin papel.
- Crear un asunto de ese tipo y marcar esa tarea: queda esperando, con su día.
- Pulsar «Ya ha llegado»: queda hecha.
- Un asunto del aula de convivencia: enviar la nota y ver que la tarea de recibir queda esperando.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
