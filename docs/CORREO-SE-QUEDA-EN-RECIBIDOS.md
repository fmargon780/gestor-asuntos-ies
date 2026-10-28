# El correo se queda en recibidos hasta que se archiva su asunto (idea 480)

Fila 480 de `docs/COLA.md`. Aviso de soporte de Francisco (27-oct-2026 12:52, desde Inicio): «Los
correos recibidos se están archivando automáticamente y etiquetándose como GESTOR/Hecho. No es el
comportamiento que esperaba». Diseñada con Francisco el 28-oct-2026. Una sola sesión de Claude Code.

## Por qué

Desde la fila 440 (`docs/TODO-EL-CORREO-ENTRA.md`), el script de Gmail recoge todo lo que llega a
la cuenta común, le pone la etiqueta `GESTOR/Hecho` y **lo archiva** (sale de recibidos). Francisco
y Diego trabajan el correo desde la bandeja de recibidos de Gmail: ahora la ven vacía, y pierden lo
leído / sin leer como señal de lo pendiente.

Lo que quiere Francisco: Gmail refleja lo que pasa en la app.

| Momento | Gmail (cuenta común) | La app |
|---|---|---|
| Llega un correo (nuevo o respuesta) | Se queda en recibidos, **sin leer** (la app no lo toca), con la etiqueta `En la app` | Sale en «Ha llegado» |
| Se mete en un asunto («Guardar en ese asunto», crear asunto con él, etc.) | Se marca **leído**; sigue en recibidos | Como hoy |
| Se descarta en «Ha llegado» | Se marca **leído** y se **archiva** | Como hoy |
| Se archiva el asunto | Se **archivan** todos sus hilos | Como hoy |
| Se reabre el asunto (a mano o con «Reabrir y guardar» de una respuesta) | Todos sus hilos **vuelven a recibidos** (lo leído no se toca) | Como hoy |

Las respuestas a un correo que ya está en un asunto **ya pasan hoy por «Ha llegado»** (tarjeta
«Respuesta de …» con «Guardar en ese asunto»); eso no cambia. Si el asunto está archivado, la
tarjeta ya ofrece reabrirlo: tampoco cambia (Francisco eligió reabrir).

## Ficha del cambio

### Resumen que aprobó Francisco (máx. cinco líneas)
- Desaparece el archivado automático: el correo recogido se queda en recibidos, sin leer, y sale en «Ha llegado».
- Al meterlo en un asunto se marca leído; al descartarlo, leído y archivado.
- Al archivar un asunto se archivan en Gmail sus correos; al reabrirlo (también por una respuesta) vuelven a recibidos.
- Los correos archivados desde el 23-oct vuelven a recibidos si su asunto sigue abierto o siguen en «Ha llegado».
- La etiqueta `GESTOR/Hecho` pasa a llamarse `En la app`. Francisco pega una vez el script nuevo en Gmail (como en la fila 472).

### Qué verá y hará la usuaria cuando esté terminado
1. Un correo que llega a la cuenta común se queda en recibidos de Gmail, sin leer, con la etiqueta
   `En la app`, y sale en «Ha llegado».
2. Al meterlo en un asunto, en Gmail pasa a leído y sigue en recibidos.
3. Al descartarlo en «Ha llegado», en Gmail pasa a leído y sale de recibidos. El cuadro de
   «Descartar» dice: «Se quita de la bandeja sin crear ningún asunto.» · el título del correo ·
   «En Gmail se marca como leído y se archiva. Si contestan en esta conversación, o si le pones la
   etiqueta GESTOR, volverá a la bandeja.»
4. Al archivar un asunto, sus correos salen de recibidos en Gmail. El cuadro «Archivar el asunto»
   lleva, debajo de la carpeta de destino (y del aviso de fusión, si lo hay), la línea «Sus correos
   también se archivan en Gmail.» solo si el asunto tiene algún hilo de correo.
5. Al reabrir un asunto, sus correos vuelven a recibidos en Gmail. Eso incluye «Reabrir y guardar»
   de una respuesta que llega a un asunto archivado.
6. Los correos que el script archivó entre el 23-oct-2026 y hoy (los que llevan `GESTOR/Hecho`)
   vuelven a recibidos si su asunto está abierto o si siguen esperando en «Ha llegado». Los
   descartados y los de asuntos archivados se quedan archivados. Un hilo que alguien archivó a mano
   y que nunca llevó `GESTOR/Hecho` no se toca.
7. La etiqueta `GESTOR/Hecho` ya no existe en Gmail; los hilos que la tenían llevan `En la app`.
8. Lo que pasa en Gmail nunca frena la app: si el script no contesta (sin red, script viejo), el
   guardado, el descarte, el archivado y el reabrir se hacen igual, y la orden a Gmail se reintenta
   después sola (ver «Qué más se ve afectado»).

### Qué NO cambia
- Qué correos entran en «Ha llegado» y cuándo (reglas de la fila 440: fecha de arranque, spam,
  papelera, lo que envía la propia cuenta, `seguidos.json`, `recogido:<id>`).
- La etiqueta `GESTOR` para traer a mano un correo antiguo (sigue igual; al recogerlo se le quita
  `GESTOR` y se le pone `En la app`, sin archivar).
- Las tarjetas de «Ha llegado», la propuesta de asunto, la línea gris «Ya está en el asunto…», el
  envío de correos, los PDF del hilo y de cada mensaje.
- Lo leído / sin leer al llegar: la app nunca marca un correo como **no** leído. Si alguien lo abre
  en Gmail, Gmail lo marca leído por su cuenta y la app no lo deshace.

### Qué NO se hace en esta tarea
- No se toca el spam, la papelera ni los correos enviados.
- No se borra ningún correo de Gmail.
- No se añade ningún botón ni ajuste nuevo.
- No se cambia el aviso de versión del script más allá de subir `VERSION_SCRIPT` y `SCRIPT_ESPERADO`.

### Qué más se ve afectado (y qué pasa con cada cosa)
- **`apps-script/gestor-correos.gs`, `recogerCorreos` y `recogerLoQueLlega`**: se quitan los
  `hilo.moveToArchive()`. Se cambia `ETIQUETA_HECHO` a `'En la app'` (y la consulta que la usa:
  `-label:En-la-app` o la forma que acepte la búsqueda de Gmail para un nombre con espacios,
  comprobada en la documentación; en la duda, `-label:"En la app"`). — decidido por Claude.
- **Renombrar la etiqueta**: después de la puesta al día única (ver más abajo), si existe
  `GESTOR/Hecho`, se renombra (o, si Apps Script no deja renombrar con `GmailApp`, se crea `En la app`, se pone a cada
  hilo que tenga `GESTOR/Hecho`, por tandas, y al quedar vacía se borra `GESTOR/Hecho`). Se apunta
  en una propiedad del script que ya se hizo. — decidido por Claude (Francisco eligió el nombre).
- **Riesgo nuevo de recoger dos veces**: hoy los hilos recogidos salen de recibidos, así que la
  consulta `in:inbox` no los vuelve a ver. Ahora se quedan en recibidos semanas o meses (mientras el
  asunto esté abierto), y `limpiarRecogidosViejos` olvida `recogido:<id>` a los 90 días: un hilo
  olvidado y aún en recibidos entraría otra vez en «Ha llegado» sin mensaje nuevo. Regla: un hilo
  que lleva `En la app` y no tiene `recogido:<id>` solo se recoge si tiene un mensaje recibido de los
  últimos `DIAS_RECORDAR_RECOGIDO` días (lo más viejo ya se recogió antes de olvidarse). Claude Code
  puede elegir otra forma si es más simple, con la prueba 9 en verde. — decidido por Claude.
- **Muchos hilos en recibidos y cuota diaria de Gmail**: hoy la consulta `in:inbox` encuentra poco
  porque lo recogido sale de recibidos. Ahora recibidos se llena de hilos ya recogidos, y leer hasta
  40 hilos con `getMessages()` cada minuto pasaría de la cuota diaria de Apps Script. Por eso la
  consulta de recibidos deja de usar `after:<arranque>` y pasa a
  `after:<segundos de la última vuelta buena menos 1 hora, nunca antes del arranque>` (propiedad
  nueva del script, apuntada al acabar cada vuelta sin error). `after:` encuentra los hilos con algún
  mensaje posterior, así que una respuesta nueva sigue entrando y lo quieto no se vuelve a leer. La
  segunda consulta (fuera de recibidos, sin la etiqueta) no cambia. — decidido por Claude.
- **Órdenes de la app al script**: nuevas acciones en `doPost` (misma clave que el envío,
  `PROPIEDAD_CLAVE`), por ejemplo `{ accion: 'gmail', leido: [ids], archivar: [ids], recibidos: [ids] }`,
  con hilos identificados por `id` y, si el `id` no existe en el buzón, por matrículas (como
  `hiloDeSeguido`). Sin `accion`, `doPost` sigue enviando como hoy. Contesta qué hizo con cada uno.
  La app las manda desde un módulo nuevo (por ejemplo `js/correo-gmail.js`), no engordando
  `js/correo-enviar.js` (pasa de 400 líneas). — decidido por Claude.
- **Cómo se guarda lo que hay que hacer en cada hilo**: por hilo, dos cosas independientes:
  `leido: true` (una vez puesto no se quita) y `bandeja: 'archivar' | 'recibidos'` (gana la última).
  Así «Descartar» (leído + archivar) y «Reabrir y guardar» (leído + recibidos) no se pisan.
- **Si el script no contesta**: lo pendiente se guarda en un fichero propio
  `_GESTOR/gmail-pendiente/<ordenador>.json` (uno por ordenador, como otros ficheros por ordenador
  del Gestor; así dos ordenadores no se pisan; `App.anotarLista` no sirve porque solo escribe dentro
  de `asuntos.json`) y se reintenta al abrir la app y cada pocos minutos, solo desde ese ordenador.
  Nunca bloquea ni avisa en rojo; si algo lleva más de un día sin salir, una tarjeta en Ajustes →
  Problemas («Hay N cambios de Gmail sin hacer») junto al aviso de script viejo. — decidido por Claude.
- **Las órdenes en el script**: van por `doPost` con `accion: 'gmail'` y **no** pasan por
  `enviarUnaVez` ni por su bloqueo de 30 s (no envían nada). Por cada hilo contestan `hecho` o
  `noEsta` (no aparece ni por `id` ni por matrícula); `noEsta` cuenta como hecho y se quita de
  pendientes (no tiene arreglo). — decidido por Claude.
- **Hilos que solo tienen correos enviados** (los que `js/correo-cuadro.js` apunta en el asunto al
  enviar desde la app): `recibidos` solo mueve un hilo a recibidos si tiene algún mensaje recibido
  (no escrito por la propia cuenta, como `hayRecibidoNuevo`); si no, no lo mete en recibidos. Sí se
  archivan al archivar el asunto. Enviar desde la app no manda ninguna orden. — decidido por Claude.
- **Meter en un asunto** (`js/bandeja-guardar.js`: `guardarEnAsunto` y `engancharCorreo`, que son
  los que apuntan la huella en `hilos`, incluido «Reabrir y guardar» y crear asunto con el correo):
  `leido: true` del hilo. Lo de recibidos al reabrir lo pone `App.reabrirAsunto` (punto siguiente),
  no `reabrirYGuardar`: así no sale dos veces. — decidido por Claude.
- **Descartar** (`descartar` en `js/bandeja-guardar.js`): orden `leido` + `archivar` del hilo; texto
  nuevo del cuadro (punto 3). «Quitar de mi bandeja» de la línea gris **no** manda nada a Gmail
  (ese correo ya está en un asunto). — decidido por Claude.
- **Archivar un asunto**: un solo enganche, dentro de `App.cerrarAsunto` (`js/asuntos-archivar.js`),
  que es por donde pasan también el archivado en bloque de `js/repartir-crear.js`, el de fondo
  (`ArchivarFondo`) y la fusión (`haciendoFusion`). Copiar la lista de `hilos` de la ficha **al
  empezar** (antes de que `js/ficha-archivo.js` borre la ficha del registro) y apuntar
  `bandeja: 'archivar'` solo en el punto donde el archivado ya ha salido bien (si hace falta, que la
  función lo diga devolviendo `true`). Si falla, o sale por «ya estaba archivado», no se apunta nada.
  La línea nueva (punto 4) va en el cuadro de confirmación que se enseñe: el de siempre o el de
  rutas largas (`ArchivarCabe.cuadro`). En bloque no hay cuadro y no se enseña. — decidido por Claude.
- **Reabrir un asunto**: un solo enganche, dentro de `App.reabrirAsunto`, que es por donde pasan
  el botón de la pantalla, «Reabrir y guardar» (`js/bandeja-guardar.js`), `js/documentos-sueltos.js`
  y `js/encargos-llegada.js`: todos devuelven sus correos a recibidos. Tras reabrir bien,
  `bandeja: 'recibidos'` de todos sus `hilos`; si sale por «ya estaba reabierto», nada. — decidido
  por Claude.
- **Correos sueltos de un asunto** que se mueven a otro o se quitan del asunto: no se manda nada
  (el estado del hilo lo decide el asunto en el que queda; si queda en uno archivado, en el próximo
  archivado/reabrir se ajusta). — decidido por Claude.
- **Puesta al día única (punto 6)**: la app, la primera vez que habla con el script nuevo y una
  sola vez (marca en `_GESTOR`, compartida entre ordenadores, con cerrojo), manda al script una
  orden `accion: 'gmail', ponerAlDia: [ids]` con los hilos de los asuntos **abiertos** y de las
  fichas que siguen en `GESTOR-BANDEJA` sin decidir. El script solo mueve a recibidos los de esa
  lista que **llevan todavía `GESTOR/Hecho`** (los que archivó él); por eso esta orden debe ir antes
  de renombrar la etiqueta: el renombrado espera a que la puesta al día esté hecha (propiedad del
  script) o, si en 7 días no llega, se hace igual. — decidido por Claude.
- **Textos que hablan del archivado**: en pantalla solo los dos cuadros (puntos 3 y 4); si al
  buscar aparece otro texto visible que diga que el correo se archiva al recogerlo, se corrige a la
  regla nueva con las mismas palabras de esta ficha. En documentación: `docs/contexto/CORREO-Y-SENECA.md` («Al recogerlo el hilo se archiva en Gmail y lleva
  `GESTOR/Hecho`»), `docs/TODO-EL-CORREO-ENTRA.md` (nota al principio: «cambiado por la fila 480»),
  comentarios de cabecera de `gestor-correos.gs` (punto 4 de la lista de arriba del fichero).
  Buscar `GESTOR/Hecho`, `moveToArchive`, `archiva` en todo el repositorio. — decidido por Claude.
- **Versión del script**: `VERSION_SCRIPT` y `SCRIPT_ESPERADO` pasan a `'<fecha> · fila 480'`; así
  la tarjeta «El envío de correo está anticuado» de la fila 471 avisa sola hasta que Francisco pegue
  el script. Mientras tanto la app guarda las órdenes como pendientes (no las pierde). — decidido
  por Claude.
- **Pruebas que hablan del archivado**: `pruebas/todo-el-correo-entra.mjs` y las que comprueben
  `moveToArchive` o `GESTOR/Hecho`: se cambian a la regla nueva. — decidido por Claude.

### Suposiciones
- Preguntadas a Francisco:
  - Qué problema da el archivado → trabajan el correo desde recibidos y lo ven vacío; pierden lo
    leído como señal de pendiente.
  - Regla general → la del cuadro de «Por qué» (dicha por él el 28-oct-2026).
  - Respuestas a un correo ya en un asunto → pasan por «Ha llegado» (ya es así hoy).
  - Descartar → leído y archivado.
  - Respuesta a un asunto archivado → se reabre el asunto (ya se ofrece hoy) y sus correos vuelven a recibidos.
  - Etiqueta → `En la app`, sin `GESTOR/` delante.
- Decididas por Claude:
  - Reabrir a mano también devuelve a recibidos → es lo simétrico de archivar.
  - Al llegar no se toca lo leído → Gmail ya deja los correos nuevos sin leer.
  - Puesta al día de lo archivado desde el 23-oct → aplicar la regla nueva a lo que ya hay.

### Ejemplo real (solo si la persona lo dio)
- No lo dio.

### Pendiente (lo que la persona aún no tiene claro; no se programa)
- Nada.

### Cómo se comprueba (para Claude Code; un punto por cada línea de «Qué verá y hará la usuaria»)
1. Prueba del script con un Gmail simulado: un hilo nuevo en recibidos se recoge, recibe `En la
   app`, **no** se archiva y no cambia su estado de leído.
2. Prueba de la app: «Guardar en ese asunto» y crear asunto con un correo mandan `leido` de ese
   hilo; el script simulado lo marca leído y lo deja en recibidos.
3. Prueba: «Descartar» manda `leido` + `archivar`; el cuadro dice el texto nuevo, letra a letra.
4. Prueba: archivar un asunto con dos hilos manda `archivar` de los dos; el cuadro lleva la línea
   nueva; un asunto sin hilos no la lleva; si el archivado falla no se manda nada.
5. Prueba: reabrir a mano y «Reabrir y guardar» mandan `recibidos` de todos los hilos del asunto.
6. Prueba: la puesta al día se hace una sola vez, con dos ordenadores a la vez solo uno la hace, y
   solo incluye los hilos de asuntos abiertos y de fichas sin decidir.
7. Prueba del script: con `GESTOR/Hecho` presente, tras una vuelta los hilos llevan `En la app` y
   `GESTOR/Hecho` ya no existe; la consulta de recogida excluye bien `En la app`.
8. Prueba: con el script sin contestar, guardar/descartar/archivar/reabrir terminan bien y la orden
   queda en `gmail-pendiente.json`; al volver el script, sale y desaparece de la lista; dos órdenes
   del mismo hilo dejan solo la última. Más de un día sin salir → tarjeta en Problemas.
9. Prueba de la cuota y de los 90 días: un hilo en recibidos ya recogido, sin mensaje nuevo, no se
   vuelve a leer con `getMessages()` en la vuelta siguiente (queda fuera de la consulta por la fecha
   de la última vuelta); un hilo en recibidos al que se le ha borrado `recogido:<id>` no vuelve a
   entrar en «Ha llegado» sin mensaje nuevo; con un mensaje recibido nuevo, entra.
10. Prueba: «Reabrir y guardar» deja el hilo leído **y** en recibidos; reabrir un asunto con un hilo
   solo de correos enviados no lo mete en recibidos; la puesta al día no mueve un hilo sin `GESTOR/Hecho`.
11. Puntos SOLO FRANCISCO (con el script real, tras pegarlo): 1 a 5 y 7 en su Gmail. Apuntarlos
    como NO COMPROBADOS en la nota de la fila.

Al terminar, añadir a `docs/TE-TOCA.md`: `- [ ] (fila 480 · <fecha>) En https://script.google.com/home
con la cuenta común de Administración, abre «Gestor - Correos», borra el código, pega el de
apps-script/gestor-correos.gs (enlace a GitHub) y guarda. Después: «Implementar» › «Gestionar
implementaciones» › el lápiz › «Nueva versión» › «Implementar». Al volver al Gestor, la tarjeta «El
envío de correo está anticuado» desaparece y los correos vuelven a recibidos.`

### Respuestas de la persona durante el trabajo
- (las apunta Claude Code si tiene que preguntarle algo)
