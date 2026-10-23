# Todo el correo de la cuenta común entra en la app (fila 440)

Diseñado con Francisco el 23-oct-2026 (tema 431, idea 420). Una sola sesión.

## Qué pasa hoy

Un correo solo llega a «Ha llegado» si alguien le pone en Gmail la etiqueta `GESTOR`. El
recolector de Apps Script (`apps-script/gestor-correos.gs`, `recogerCorreos`) coge los hilos con
esa etiqueta, los guarda en `GESTOR-BANDEJA` y les cambia la etiqueta a `GESTOR/Hecho`. Además
sigue los hilos ya enganchados a un asunto (`seguidos.json`, `seguirHilosConocidos`).

Desde la fila 411 el Gestor recoge y envía solo con la cuenta común de Administración
(29700692.administracion@g.educaand.es). Esa cuenta es solo de trabajo: ya no hay que separar
correos personales de correos de trabajo.

## Qué se pide

Que todo correo que llegue a la bandeja de entrada de la cuenta común entre solo en «Ha llegado»,
sin etiquetas. La persona decide allí, como hoy, si crea asunto, lo guarda en uno o lo descarta.

## Reglas decididas con Francisco

1. **Desde cuándo.** Solo entran los correos que lleguen a partir del momento en que el script
   nuevo empieza a funcionar. Los correos antiguos no entran solos. La fecha de arranque la
   apunta el propio script en sus propiedades la primera vez que corre esta versión, sea
   `prepararTodo()` o la vuelta de cada minuto (el disparador ya existe y empieza a correr el
   código nuevo en cuanto se guarda). Una vez apuntada no cambia. Nunca se recoge nada de la
   bandeja sin esa fecha.
2. **Qué entra.** Todo correo recibido en la cuenta común, en cualquier pestaña de Gmail y aunque
   alguien lo haya archivado antes de que pase el script. Quedan fuera solo el spam y la papelera.
   No hay lista de remitentes excluidos ni filtros. No entran los correos que envía la propia
   cuenta común; en particular, ni la prueba del botón «Probar» de Ajustes ni los envíos a grupos
   en copia oculta (que llevan la propia cuenta en «Para»). Los hilos ya enganchados a un asunto
   siguen como hoy. Pon una prueba para estos dos casos.
3. **La etiqueta `GESTOR` se queda** solo para traer a mano un correo antiguo: quien le pone
   `GESTOR` en Gmail a un correo de antes de la fecha de arranque lo hace entrar, como hasta ahora.
4. **Descartar** funciona como hoy: el correo sale de «Ha llegado» y sigue en Gmail con
   `GESTOR/Hecho`. Por eso todo hilo que se recoja (entre por la etiqueta o solo) lleva
   `GESTOR/Hecho`. Además, al recogerlo, el script **archiva** el hilo en Gmail: sale de la
   bandeja de entrada y se encuentra buscando la etiqueta `GESTOR/Hecho`. Lo leído o sin leer no
   se toca. Si llega una respuesta, Gmail lo devuelve a la bandeja de entrada; al recogerla, se
   vuelve a archivar. Ponerle `GESTOR` a mano a un hilo ya descartado lo vuelve a traer, como hoy.
5. **Respuesta a un correo descartado.** Si después llega un mensaje nuevo en esa misma
   conversación, vuelve a entrar en «Ha llegado» como una entrada nueva (con el hilo entero en
   su PDF, como siempre). Lo que cuenta es que haya un mensaje recibido más nuevo que la última
   vez que se recogió ese hilo. Si ese hilo sigue en «Ha llegado» sin decidir cuando llega el
   mensaje nuevo, su entrada se pone al día (la misma, no una segunda), como hoy. Los adjuntos
   entran como hoy al recoger un hilo.
6. **Hilos de un asunto.** Una respuesta a un hilo que ya está en `seguidos.json` entra en su
   asunto como hoy y **no** sale además en «Ha llegado». Un mismo mensaje nunca entra dos veces.
   Para saber si un hilo ya está seguido, mira por identificador de hilo y por matrícula, como
   `hiloDeSeguido`. La búsqueda de la bandeja va después de `seguirHilosConocidos` y salta esos
   hilos, para no pisar la ficha de un asunto.

## Qué hay que tocar

- `apps-script/gestor-correos.gs`: la vuelta de cada minuto busca, además de los hilos con
  `GESTOR`, los hilos de la bandeja de entrada (fuera de spam) con algún mensaje recibido después
  de la fecha de arranque que todavía no se haya recogido. Cómo se sabe qué está recogido (fecha
  del último mensaje recogido por hilo, matrícula, búsqueda con `after:`) lo decides tú; que no
  dependa de que la etiqueta esté puesta. Respeta los topes por vuelta (`MAX_POR_VUELTA`).
  Actualiza el comentario de la cabecera (qué hace cada minuto y la fecha de esta versión).
- Versión del script: sube la fecha de la cabecera. No subas `SCRIPT_ESPERADO`
  (`js/correo-enviar.js`) salvo que cambie `doPost`: si no, el aviso de «script anticuado» no se
  quitaría solo con pegar el código.
- Los textos de la app que dicen que hay que poner `GESTOR` para que un correo llegue (búscalos:
  hoy salen en `js/bandeja-correos.js`, `js/bandeja-guardar.js`, `js/ajustes-reparto.js`,
  `js/problemas-textos.js`, `js/bandeja-huella.js`, `js/bandeja-latido.js`). Deben decir que
  entra todo lo que llega a la cuenta común, y que `GESTOR` sirve para traer un correo antiguo.
  El cuadro de «Descartar» dice: «El correo sigue en Gmail. Si contestan en esta conversación,
  o si le pones la etiqueta GESTOR, volverá a la bandeja.»
- `docs/contexto/CORREO-Y-SENECA.md` y la línea de la bandeja en `docs/CONTEXTO-CORTO.md`.
- Una entrada en «Qué hay de nuevo» (`js/novedades.js`).
- Pruebas en `pruebas/` para la parte de la app que cambie.

**El script no se publica desde aquí.** Francisco lo pega a mano en script.google.com. Al
terminar, añade su paso en `docs/TE-TOCA.md` con el formato de ese fichero: abrir
https://script.google.com/home con la cuenta común de Administración, entrar en «Gestor -
Correos», borrar todo el código, pegar el de
https://github.com/fmargon780/gestor-asuntos-ies/blob/main/apps-script/gestor-correos.gs, guardar
y ejecutar una vez `prepararTodo()`. Si el envío (`doPost`) cambia, añade también volver a
implementar la aplicación web como dicen los pasos de siempre.

## Ejemplo con datos reales

Cuando el script nuevo esté pegado, Francisco se manda un correo desde su cuenta
fmargon780@g.educaand.es a la cuenta común, con el asunto «Prueba tema 431» y sin etiquetas.

## Cómo sabré que está bien

1. Un correo que llega a la cuenta común aparece en «Ha llegado» en pocos minutos, sin ponerle
   ninguna etiqueta (el de «Prueba tema 431»).
2. Un correo que Gmail manda a spam no aparece.
3. Al descartar un correo, desaparece de «Ha llegado». Si después contestan en esa
   conversación, el mensaje nuevo sí aparece.
4. Un correo antiguo al que le pones la etiqueta GESTOR en Gmail aparece en «Ha llegado».
5. Una respuesta a un correo que ya está en un asunto entra en ese asunto, como hasta ahora, y
   no sale repetida en «Ha llegado».
