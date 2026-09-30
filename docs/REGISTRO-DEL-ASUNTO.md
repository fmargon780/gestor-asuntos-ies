# El registro del asunto (fila 229)

Diseño cerrado con Francisco el 30-sep-2026. Nace de su idea: «convertir la zona de tareas de un
hito en un registro de lo que ocurre, en vez de una lista que nos recuerde lo que hay que tener en
cuenta. O un modelo global para todo esto».

## Qué quiere Francisco

Al volver a un asunto días después, o cuando lo abre su compañero, quiere saber **qué ha pasado**:
qué se hizo, cuándo, quién y en qué hito. Hoy eso está repartido: las notas a mano en la libreta
del asunto, y lo automático («Historia») dentro de cada hito, así que hay que abrir los hitos uno
a uno.

## Lo decidido

1. **La lista de tareas de cada hito no cambia.** Sigue sirviendo para recordar lo que falta.
   Nada de esta fila toca la tarjeta de tareas, salvo el punto 6.
2. **Un solo registro por asunto.** Una lista por fechas, lo más reciente arriba. Cada línea: qué
   pasó, fecha y hora, quién, y una etiqueta con el hito (la misma etiqueta `⚑ título` que ya
   llevan las notas; pulsada en la ficha, abre la mesa de ese hito). Una línea sin hito no lleva
   etiqueta.
3. **Dónde se ve.**
   - En la **ficha del asunto**: la tarjeta de notas pasa a llamarse **«Registro»** y enseña el
     registro entero (todas las líneas, de todos los hitos y las que no son de ninguno).
   - En la **mesa de un hito**: la tarjeta «Notas e historia» pasa a llamarse **«Registro»** y
     enseña solo las líneas de ese hito, en **una sola lista** por fechas (ya no dos columnas,
     «notas» a un lado e «Historia» al otro). Su resumen en pequeño: «N líneas», la primera línea
     de la última y «Última: quién · día»; vacío, «Sin nada todavía».
4. **Lo que se anota solo** (líneas automáticas). Todo lo que hoy ya va a la «Historia» del hito
   (marcar una tarea, generar, comunicar, dar el hito por hecho…) y, además, lo que falte de esta
   lista. Antes de añadir nada, comprobar qué se anota ya, para no duplicar:
   - generar un documento desde una plantilla;
   - registrar un documento (con su número de registro);
   - enviar un correo o preparar un mensaje de Séneca (a quién);
   - guardar un documento en el asunto (desde «Ver todo», soltándolo, o desde un correo);
   - marcar o desmarcar una tarea, y «No aplica»;
   - dar un hito por hecho, o reabrirlo;
   - crear el asunto, cambiarlo («Cambiar el asunto»), archivarlo y reabrirlo.
   Cada línea automática dice quién lo hizo y cuándo. Si la acción ocurre fuera de un hito, la
   línea queda sin hito. Se ven en gris, más pequeñas que las escritas a mano, como hoy.
5. **Lo que anota la persona.** Encima del registro, en la ficha y en la mesa, una caja con el
   texto **«Anotar algo que ha pasado…»** (una llamada, una visita, algo que dice la directora).
   Intro guarda, Mayúsculas+Intro salta de línea, como la caja de notas de hoy. Desde la mesa, la
   línea queda con ese hito; desde la ficha, sin hito. Las notas que ya existen **son** estas
   líneas: no se pierde ninguna y no hay otro sitio donde escribir.
6. **«Anotar» de una tarea** (el «⋮» de la fila 224) sigue igual, y su nota es una línea más del
   registro, con su hito. El 💬 de la tarea no cambia.
7. **Qué se puede tocar.** Una línea escrita a mano se puede **cambiar** o **borrar** (un «⋮» en
   la línea, con «Cambiar» y «Borrar»; borrar pide confirmación de una línea). Una línea
   automática **no se puede tocar**: no lleva «⋮». En modo consulta, nada se toca y la caja no
   sale.
8. **Asuntos que ya están abiertos.** El registro no empieza vacío: enseña desde el primer día
   las notas del asunto y la historia que ya tiene guardada cada hito.
9. **Asuntos reservados**: el registro sigue las mismas reglas que hoy las notas (no sale en
   buscadores ni en tarjetas tapadas).
10. **Al archivar**, el `HISTORIAL DE TRAMITACION.txt` sigue juntando las dos cosas, ahora en el
    mismo orden en que se ven en pantalla, con las líneas nuevas del punto 4.

## Cómo hacerlo (decisiones técnicas ya tomadas)

- **No se cambia dónde se guarda nada, ni se migra nada.** Las notas a mano siguen en la libreta
  del asunto (`asuntos.json`, por `App.anotarLista`) y lo automático sigue en `h.notas` de cada
  hito (`hitos.json`). El registro es una **vista** que junta las dos fuentes y las ordena por
  fecha. Así no hay riesgo para los datos de verdad ni para el otro ordenador.
- Las líneas automáticas que ocurren fuera de un hito (crear, cambiar, archivar, reabrir, guardar
  un documento sin hito) necesitan un sitio: van a la libreta del asunto, con una marca
  (`auto: true`) que las distingue de las escritas a mano. Una línea con esa marca no se puede
  cambiar ni borrar, y se pinta en gris.
- Un módulo nuevo (por ejemplo `js/registro-asunto.js`, `RegistroAsunto`) con una sola función que
  devuelve las líneas del asunto ya fundidas y ordenadas, con filtro opcional por hito. La ficha y
  la mesa pintan con ella. Reutilizar `NotasHito` (`js/notas-migracion.js`) para la etiqueta y
  para escribir; no envolver (regla de `docs/CONTEXTO-CORTO.md`, sección 6).
- Las líneas automáticas nuevas se enganchan donde ya se hace la acción, por un punto previsto.
  Anotar es **accesorio**: si falla, ámbar (`U.accesorio`), nunca rojo, y la acción principal no
  se deshace.
- Todo guardado, por la cola de guardado de siempre. Repintar solo lo que cambia, con
  `U.conservandoLoEscrito` en la caja.
- Textos de pantalla según `docs/VOCABULARIO.md`: «Anotar», «Cambiar», «Borrar». La palabra
  «Registro» aquí es el registro del asunto; **no confundir** en pantalla con el registro de
  Séneca: los botones «Registrar» y la columna de registro de los documentos no cambian de nombre.
  Si en alguna pantalla las dos cosas quedan juntas y se confunden, el título de la tarjeta puede
  ser «Registro del asunto».
- Pantalla densa y a todo el ancho (preferencia de Francisco): una línea por renglón cuando
  quepa, sin huecos.
- Leer antes `docs/contexto/HITO-MESA.md` («Notas e historia», «Las notas de la mesa») y
  `docs/contexto/ASUNTOS.md` («Una sola libreta de notas»), y ponerlos al día al terminar.
- Pruebas nuevas (`pruebas/registro-del-asunto.mjs`) y poner al día las que miran «Notas e
  historia». Datos de demostración: que al menos un asunto traiga líneas de los dos tipos en dos
  hitos distintos.

## Cómo sabemos que está bien

1. Abrir la ficha de un asunto con varios hitos trabajados: se ve una tarjeta «Registro» con
   líneas de varios hitos mezcladas por fecha, la más reciente arriba, cada una con fecha, quién
   y la etiqueta de su hito.
2. Abrir la mesa de un hito de ese asunto y su tarjeta «Registro»: se ven solo las líneas de ese
   hito, en una sola lista, y ya no hay dos columnas «notas» e «Historia».
3. Escribir en la caja «Anotar algo que ha pasado…» de la mesa y pulsar Intro: la línea aparece
   arriba, con el nombre de quien escribe; al volver a la ficha, está en el registro con la
   etiqueta de ese hito.
4. Escribir otra línea desde la caja de la ficha: aparece arriba, sin etiqueta de hito.
5. Marcar una tarea del hito y generar un documento: aparecen solas dos líneas en gris, con quién
   y cuándo, y no llevan «⋮».
6. Pulsar «⋮» en una línea escrita a mano, elegir «Cambiar», corregir el texto y guardar: se ve
   el texto nuevo. Pulsar «⋮» y «Borrar», confirmar: la línea desaparece de la ficha y de la mesa.
7. Pulsar en la ficha la etiqueta de hito de una línea: se abre la mesa de ese hito.
8. Guardar un documento en el asunto desde «Ver todo»: en el registro de la ficha aparece sola la
   línea de que se guardó.
9. Pulsar «Anotar» en el «⋮» de una tarea y escribir: la nota sale en el registro del hito, y la
   tarea lleva su 💬 como antes.
10. **[SOLO FRANCISCO]** Abrir un asunto de verdad que ya tuviera notas e historia de antes: están
    todas en el registro, ninguna se ha perdido, y el compañero las ve igual desde su ordenador.
