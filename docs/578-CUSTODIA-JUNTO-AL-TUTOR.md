# 578 — Ver quién tiene la custodia junto a cada tutor legal

Parte 1 del tema 520 (Aula de convivencia), partido con Francisco el 10-nov-2026 en las filas 578,
579 y 580. Tarea grande: con segundo revisor.

## Lo que escribió Francisco

Aviso de usuario (idea 514, 5-nov-2026):

> Adjunto imagen de un tipo de asunto habitual en el centro. La expulsión al aula de convivencia.
> Me gustaría automatizar en la medida de lo posible todo lo que hacemos los administrativos en este procedimiento.
> Especial atención al tema de quién tiene la custodia del alumno.

Al diseñarlo (10-nov-2026):

> Lo de enviarlo solo al que tiene la custodia no creo que sea así. Yo creo que el envío debe enviarse a los tutores con la patria potestad. Yo solo pedía que al ver o elegir un tutor legal de un alumno se puediera ver quien tiene la custodia.

> No es necesario no mostrar a los directivos quien tiene la custodia

## Lo que entendió Claude (acordado con Francisco el 10-nov-2026)

- La app lee la columna «Custodia» del listado de alumnado de Séneca (`RegAlum.csv`), que ya usa.
  En el fichero real trae el nombre del tutor que tiene la custodia (rellena en unos 246 alumnos).
- Junto al tutor legal cuyo nombre coincide con ese texto sale **«tiene la custodia»**, en todos los
  sitios de la app donde se ve o se elige un tutor legal de un alumno: las tarjetas de «Datos y
  contacto», la ficha completa del alumno, la línea de datos de la cabecera del asunto y su
  «Elegir datos», el correo (Para, Copia y Copia oculta) y donde un documento pide elegir tutor.
- Si el texto de la columna no coincide con ningún tutor del alumno, sale **«Custodia: <texto>»**
  tal cual, junto a los tutores, para que nadie se quede sin verlo.
- Con la columna vacía (o sin columna en el fichero) no sale ninguna marca.
- La marca la ve todo el que usa la app, también los directivos.
- El dato «Tutor con custodia» de plantillas y documentos se rellena solo con lo que dice Séneca.
  Si Séneca no lo dice, se sigue eligiendo en el asunto como hoy (con un solo tutor cae solo).
  Lo ya elegido a mano en un asunto se respeta.
- Los correos siguen yendo a los tutores legales que se elijan: la custodia no quita a ninguno.

**Lo que se sustituye:** elegir a mano quién tiene la custodia, salvo cuando Séneca no lo dice.

## Pantalla de prueba

- Sin pantalla: solo añade una marca junto a nombres que ya salen, sin mover nada de sitio
  (decidido por Francisco el 10-nov-2026).

## Qué NO se hace en esta tarea

- La guía del tipo «Expulsión aula convivencia»: fila 579.
- Crear el asunto desde el correo de la intranet: fila 580.
- A quién va cada correo no cambia (fila 555).
- BD Alumnado no se toca.

## Notas técnicas de Claude

- Los tutores salen de `Datos.tutoresDe` (`js/datos-tutores.js`), que agrupa por tutor las
  columnas con «tutor» en el título. «Custodia» no lleva «tutor» en el título: leerla aparte de la
  fila del alumno, con cabecera opcional (como hace BD Alumnado en `SituacionFamiliar.gs`:
  `Custodia`), y añadir a cada tutor una marca `custodia: true` cuando su nombre coincide
  (normalizado con `U.normalizar`, sin depender del orden «Apellidos, Nombre» / «Nombre
  Apellidos»). El texto que no coincide va aparte (`custodiaSinTutor`). Comprobar antes si la
  columna sale hoy suelta en «Ver todo» y, si sale, que no se repita.
- Usuarios de `Datos.tutoresDe` a repasar: `js/correo-para.js` (hoy `custodiaEscrita`, lo del
  asunto; ahora, primero lo del asunto si está escrito, si no lo de Séneca), `js/datos-resumen.js`,
  `js/ficha-tercero-alumno.js`, `js/ficha-datos-a-mano.js`, `js/etiquetas-datos.js` (solo nombres,
  sin marca en etiquetas) y la tarjeta de tutores de «Datos y contacto».
- `DatosDelAsunto.completar` (`js/datos-del-asunto.js`): «Tutor con custodia» cae solo con lo de
  Séneca cuando el asunto no lo tiene escrito; la lista para elegir (`infoDe`) pone primero al
  que tiene la custodia. `js/plantillas-valores.js` y `js/word-faltan.js` usan lo mismo.
- La demo (`js/demo/datos.js`) lleva la columna `Custodia` en algún alumno con dos tutores, otro
  con un texto que no coincide y otro vacío.
- Ficheros de `js/` de menos de 600 líneas (regla 6 de `docs/CONTEXTO-CORTO.md`). Línea en
  `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- Alumno de la demo con dos tutores y «Custodia» igual a uno de ellos: «tiene la custodia» junto a
  ese tutor en «Datos y contacto», en la ficha completa, en la cabecera del asunto y en el correo
  (al escribir «tutor» o «custodia» en Para).
- Alumno con un texto en «Custodia» que no coincide: sale «Custodia: <texto>» junto a los tutores.
- Alumno con «Custodia» vacía: ninguna marca.
- Un documento con el dato «Tutor con custodia» en un asunto de ese alumno: sale el tutor de Séneca
  sin preguntar; en un asunto donde se eligió otro a mano, sale el elegido.
- Con el perfil de directivo (solo consultar) también se ve la marca.
- El correo sigue dejando poner a los dos tutores legales.

## Qué mirar al terminar

- Abre un alumno con dos tutores en «Datos y contacto» y mira si «tiene la custodia» está junto al
  tutor correcto.
- En el correo de un asunto de ese alumno, escribe «tutor» en Para y mira la marca.
- Genera un documento que pida el tutor con custodia y mira que salga solo.

## Revisión y respuestas durante el trabajo

- Segundo revisor (10-nov-2026), punto por punto:
  - Dos tutores, Custodia = uno: coincide (Datos y contacto / ficha completa y correo Para, Copia, Copia oculta). No coincidía: la etiqueta se veía casi blanca (usaba el fondo verde como color); corregido con un verde oscuro.
  - Texto que no coincide: coincide («Custodia: Abuela materna» en la ficha y en el correo).
  - Custodia vacía: coincide (ninguna marca; la columna no sale suelta en «Otros datos»).
  - «Tutor con custodia» de los documentos: coincide, comprobado por llamada interna y con la prueba `pruebas/custodia-junto-al-tutor.mjs`; no abierto un documento real en pantalla.
  - Perfil de directivo: coincide con el modo «solo consultar»; no he podido ver el perfil de directivo real (la demo solo le deja ver bajas médicas).
  - Los dos tutores siguen pudiendo ir en Para/Copia: coincide.
  - Cabecera del asunto: no lo he podido ver; la línea sin elegir no muestra tutores. Con «Elegir datos» sale la columna «Custodia» tal cual, y en la ayuda del teléfono del tutor se añade «· tiene la custodia».
  - Hace sin pedirlo el texto: «Custodia» sale como dato elegible en «Elegir datos» (es una columna más del fichero); con un solo tutor que no coincide, «Tutor con custodia» sigue cayendo en ese tutor (regla de antes); la lista de elegir pone primero al de Séneca.
- Pruebas: `custodia-junto-al-tutor` (nueva) y las de lo tocado, en verde; `etiquetas-desde-el-grupo` y `plantillas-desde-un-tipo` fallan igual en `main` sin este cambio (ya apuntadas: idea 593).
