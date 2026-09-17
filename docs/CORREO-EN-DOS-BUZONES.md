# Un mismo correo en dos buzones

Acordado con Francisco el 17 de septiembre de 2026. Fila 18 de `docs/COLA.md`.

## De dónde sale esto

En el instituto hay dos personas usando el gestor: Francisco y su compañero. Cada uno tiene su
buzón de Gmail, su propia copia del recolector de Apps Script y su propia carpeta
`GESTOR-BANDEJA` en su Drive. Los asuntos, en cambio, son comunes: viven en los ficheros
compartidos de `_GESTOR`.

Hoy la aplicación reconoce un correo por el **identificador de hilo de Gmail** (`hilos` en
`asuntos.json`, la "huella del hilo" de `js/bandeja-correos.js`). Ese identificador es de cada
buzón: el mismo correo tiene un número distinto en el buzón de Francisco y en el de su compañero.
Consecuencias, todas reales:

- Un correo dirigido a los dos (o con los dos en copia) aparece como dos correos sin relación, uno
  en cada bandeja.
- Si uno lo mete en un asunto, al otro le sigue saliendo como correo nuevo, sin ninguna señal de
  que ya está atendido. Los dos hacen el mismo trabajo, o se crea el asunto dos veces.
- Las respuestas del hilo solo vuelven al buzón de quien lo enganchó: `seguidos.json` lleva
  identificadores de hilo, y el recolector del otro buzón no encuentra ninguno
  (`GmailApp.getThreadById` devuelve `null` y se salta la entrada).

Lo que sí hay que dejar como está: la parada de duplicados al crear un asunto (fila 5) ya evita
buena parte del destrozo, y sigue haciendo falta.

## La idea

Todo mensaje de correo lleva en su cabecera un identificador único y universal, el `Message-ID`.
Es el mismo en todos los buzones por los que pasa. El recolector ya lo lee (lo usa en
`enlaceAlHilo` para construir el enlace `#search/rfc822msgid:`), pero no lo guarda en ningún
sitio.

A partir de ahora se guarda. En este documento se le llama **matrícula** del mensaje.

Con la matrícula apuntada en la ficha del asunto, cualquiera de los dos buzones puede reconocer
que un correo suyo es el mismo que otro ya guardado, y Gmail puede encontrar el hilo local de un
correo en cualquier buzón que lo tenga.

## 1. El recolector: guardar las matrículas

En `apps-script/gestor-correos.gs`.

**1.1** Función nueva, al lado de `quien` y `recortar`:

    matricula(mensaje)      -> el Message-ID sin los signos `<` `>`, recortado y en minúsculas,
                               o cadena vacía si el mensaje no lo trae.

Que no reviente nunca: `getHeader` va dentro de su `try`, igual que en `enlaceAlHilo`.

**1.2** En `guardarHilo`, dos campos nuevos en la ficha:

    matriculas: [ ... ]     todas las matrículas del hilo, en el orden de los mensajes, sin las
                            vacías y sin repetir.
    matricula:  '...'       la del último mensaje (la del correo que acaba de llegar).

Nada más cambia en la ficha. Los campos de ahora se quedan exactamente como están.

**1.3** En `seguirHilosConocidos`, buscar el hilo también por matrícula.

Hoy la entrada de `seguidos.json` solo trae `id`. Ahora traerá además `matriculas` (lo escribe la
aplicación, punto 2.4). El orden de búsqueda para cada entrada:

1. `GmailApp.getThreadById(s.id)`. Si devuelve un hilo, ese es.
2. Si no, recorrer `s.matriculas` **de la última a la primera** y, para cada una, probar
   `GmailApp.search('rfc822msgid:' + m, 0, 1)`. El primer resultado que salga, ese es el hilo en
   este buzón.
3. Si no sale ninguno, saltar la entrada sin ruido: ese correo no ha pasado por este buzón.

Todo dentro del `try` que ya hay, y con el `Logger.log` que ya hay.

**1.4** La cuenta de mensajes vistos tiene que ser de cada buzón, no compartida.

Esto es la trampa de todo el punto 1, y hay que hacerlo bien. `seguidos.json` trae `visto`
(cuántos mensajes tenía el hilo la última vez), pero lo escribe la aplicación con lo que sabe el
buzón que enganchó el correo. En el otro buzón el mismo hilo puede tener otro número de mensajes
—los correos internos del centro, los borradores, los reenvíos, no están en los dos sitios—. Si se
compara el `visto` compartido con la cuenta local, el hilo se recoge cada minuto para siempre, o
no se recoge nunca.

Así que la cuenta se guarda **en el propio proyecto de Apps Script**, con
`PropertiesService.getScriptProperties()`:

    clave:  'visto:' + hilo.getId()        (el identificador local, el de este buzón)
    valor:  el número de mensajes que tenía el hilo la última vez que se recogió

Reglas:

- Si no hay valor guardado para ese hilo, se toma el `visto` que venga en `seguidos.json` (o 1).
- Se recoge solo si `hilo.getMessageCount()` es mayor que ese número.
- Justo después de `guardarHilo`, se escribe la cuenta nueva en la propiedad.

**1.5** En la cabecera del fichero, en el comentario de "PARA ACTUALIZARLO", añadir una línea con
la fecha de este cambio, para que se vea de un golpe que la copia pegada en `script.google.com`
está vieja si no la lleva.

## 2. La aplicación: apuntar la matrícula y reconocerla

En `js/bandeja-correos.js`, y en `js/elegir-asunto.js` si por ahí pasa algo de esto.

**2.1** La huella del hilo que se guarda en `asuntos.json` (`hilos`) gana tres campos:

    hilos: [ { id, asunto, visto,
               matriculas: [ ... ],     las del correo que se guardó
               metidoPor: '...',        App.E.usuario
               metidoEl: '...' } ]      U.ahora()

`matriculas`, `metidoPor` y `metidoEl` son opcionales: los asuntos de antes no los tienen y todo
tiene que seguir funcionando igual con ellos.

**2.2** Función nueva `asuntoDeLaMatricula(matriculas)`, hermana de la `asuntoDelHilo` que ya
existe: recorre los asuntos del registro y devuelve el primero en el que alguna matrícula de su
`hilos` coincida con alguna de las que se le pasan. Devuelve, además de nombre y ficha, **la
huella que ha coincidido** (hace falta para saber quién lo metió y cuándo).

**2.3** `asuntoDeEsteCorreo(d)` pasa a mirar en este orden:

1. La huella por identificador de hilo (`asuntoDelHilo(d.id)`), como hasta ahora.
2. La huella por identificador del hilo del que es respuesta (`asuntoDelHilo(d.respuestaDe)`).
3. **La huella por matrícula** (`asuntoDeLaMatricula(d.matriculas)`). Nuevo.
4. La adivinación por el texto del asunto, como hasta ahora, la última.

**2.4** `escribirSeguidos()` escribe también las matrículas de cada hilo:

    { hilos: [ { id, visto, asunto, matriculas: [ ... ] } ] }

Se juntan las matrículas de todas las huellas que compartan identificador de hilo, sin repetir.

## 3. La línea gris

Esto es lo único que Francisco va a ver en pantalla, y es lo que él pidió.

Cuando un correo de la bandeja encaja con un asunto **por matrícula** y su propio identificador de
hilo **no** está en las huellas de ese asunto, no es un correo que haya que atender: es la copia
del correo que el compañero ya guardó. Entonces, en vez de la tarjeta normal, sale una sola línea,
en gris, pequeña, con el mismo ancho que las tarjetas:

    Ya está en el asunto «NOMBRE DEL ASUNTO» · lo metió Juan el 17-sep-2026 · 09:14
    [ Abrir el asunto ]  [ Quitar de mi bandeja ]

- El nombre del asunto es el nombre de la carpeta, tal cual.
- Quien lo metió es el `metidoPor` de la huella. Si la huella no lo trae (asuntos de antes), se
  quita ese trozo de la frase: nunca sale "lo metió undefined" ni "lo metió alguien".
- **Abrir el asunto** hace lo mismo que ya hace abrir su ficha desde los asuntos abiertos. Si el
  asunto está archivado, lo dice en la propia línea y el botón no sale.
- **Quitar de mi bandeja** borra la ficha del correo y sus ficheros (`<id>.json`, los PDF, los
  adjuntos) de la carpeta `GESTOR-BANDEJA` de este Drive, con el mismo código que ya se usa
  cuando un correo se convierte en asunto. **No pasa por la papelera**: esos ficheros son copias
  de trabajo, y el correo de verdad sigue en Gmail. Nada se borra sin que él pulse ese botón.
- Las líneas grises van todas juntas, debajo de las tarjetas de correo, no mezcladas con ellas.

Lo que **no** hay que hacer: si el correo les ha llegado a los dos y ninguno lo ha guardado
todavía, los dos ven su tarjeta normal. No se inventa ninguna coordinación entre los dos buzones,
ni reservas, ni "lo está mirando tu compañero". Eso no se ha pedido y no hay dónde apuntarlo.

## 4. De paso: que no se vuelva a romper en silencio

El 17-sep-2026, montando esto, se descubrió que el recolector llevaba seis días dejando los
correos en una carpeta y la aplicación leyendo otra. El recolector busca `GESTOR-BANDEJA` solo en
la raíz del Drive (`DriveApp.getRootFolder()`); alguien movió esa carpeta dentro de otra, el
script no la encontró, se creó una nueva en la raíz y siguió trabajando como si nada. En pantalla
no se veía ningún error: la bandeja simplemente estaba siempre vacía.

Se arregla por el lado de la aplicación, que es donde se mira:

En el bloque de la bandeja de correos de Ajustes, debajo del nombre de la carpeta señalada, una
línea con **la fecha del fichero más nuevo que hay en ella**:

    Último correo recogido: 17-sep-2026 · 09:14

Y si el fichero más nuevo tiene más de tres días, la misma línea en color de aviso:

    Último correo recogido: hace 6 días. Si esperabas correos, comprueba que el recolector está
    dejándolos en esta carpeta y no en otra con el mismo nombre.

Nada más: ni se busca la carpeta sola, ni se arregla nada por su cuenta.

## 5. Pruebas

Fichero nuevo `pruebas/correo-dos-buzones.mjs`, del estilo de los que ya hay. Como mínimo:

1. Una matrícula compartida encuentra el asunto, aunque el identificador de hilo sea otro.
2. Un correo cuyo identificador de hilo **sí** está en el asunto no saca línea gris: es suyo.
3. Un correo con matrícula compartida y hilo distinto **sí** saca línea gris, con el nombre de
   quien lo metió.
4. Una huella antigua, sin `matriculas` ni `metidoPor`, no rompe nada y no saca línea gris.
5. `escribirSeguidos` junta las matrículas del mismo hilo sin repetirlas.
6. El orden de `asuntoDeEsteCorreo`: la huella por hilo manda sobre la matrícula, y las dos
   mandan sobre la adivinación por texto.

La batería completa (`npm test`) tiene que quedar en verde.

## 6. Al terminar

- `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`: sustituir las líneas que hablan de la huella del
  hilo, no añadir otras debajo. Tiene que quedar dicho que la huella son dos cosas: el
  identificador del hilo y las matrículas.
- `docs/HISTORIA.md`: esto, y el incidente de las dos carpetas `GESTOR-BANDEJA` del 17-sep-2026.
- En el mensaje final para Francisco, **decirle que tiene que volver a pegar el script** en
  `script.google.com` (proyecto "Gestor - Correos"), porque sin eso las matrículas no se guardan y
  la mitad de esto no funciona. Él ya sabe cómo: copiar el fichero desde GitHub, Ctrl+A, Ctrl+V,
  guardar y ejecutar `prepararTodo`.
