# Informe crítico de la aplicación — 18 de septiembre de 2026

Encargo: `docs/ANALISIS-CRITICO-2026-09-18.md`. Lo pide Francisco.

Esto es un informe. No se ha tocado ni una línea de código.

---

## Cómo leer esto

Está ordenado de lo más grave a lo menos grave dentro de cada parte. Lo que puede costar datos va
primero.

Cada debilidad se cuenta siempre con cuatro cosas:

- **Qué pasa.**
- **Por qué importa.**
- **Cuándo puede ocurrir de verdad.**
- **Qué se haría.**

Cuando algo es una opinión mía y no un hecho que haya podido comprobar, lo digo con esta marca:
**(opinión)**. Cuando no he podido comprobarlo desde aquí, lo digo con esta otra: **(sin
comprobar)**.

### Lo que he hecho para escribirlo

He leído los tres documentos de contexto, la cola entera con sus notas, las entradas de los
últimos diez días del diario, y el código: los 103 ficheros de programa, los 32 de estilo, la
página principal, el script de Google y la configuración de publicación.

He ejecutado la batería de pruebas entera en este mismo ordenador. **Pasan las 70, con 1.478
comprobaciones, sin un solo fallo.** Eso es un hecho medido, no una impresión.

He medido con números inventados pero realistas cuánto va a ocupar cada fichero y cuánto cuesta
leerlo y escribirlo. Esas cifras están en la parte 1.

### Lo que no he podido hacer

- **No he podido entrar en las direcciones publicadas.** Esta sesión no tiene salida a internet
  hacia `asuntos.fmargon.com` ni hacia la dirección de Vercel. Todo lo que digo sobre qué se
  publica sale de leer la configuración, no de comprobarlo con el navegador. Lo marco donde toca.
- **No he podido ver el Dropbox del centro.** No sé cuánto ocupan hoy los ficheros de verdad. Las
  cifras de la parte 1 son medidas reales sobre datos inventados con la misma forma que los de
  verdad; sirven para saber cuándo se rompe, no para saber cuánto pesa hoy exactamente.
- **No he podido ver el historial completo del proyecto.** La copia con la que trabajo solo trae
  los cambios del día 18. Para saber qué pasó entre el 11 y el 18 he usado el diario, no el
  historial.

### Resumen en una línea

He encontrado **dos fallos graves que pueden costar datos**, **una cosa que sale a internet y que
conviene que dirección sepa**, y **una decisión de fondo que hay que tomar este curso**, no el que
viene.

---

# Parte 1. La decisión de fondo

## 1.1 ¿Aguanta la estructura de carpetas y ficheros?

### Qué hay hoy

Los datos viven en tres sitios, todos dentro del Dropbox del centro:

1. **Las carpetas de cada asunto**, con sus documentos dentro. Esto es lo bueno del diseño: son
   carpetas normales, se ven desde el explorador, y si la aplicación desapareciera mañana el
   trabajo del centro seguiría ahí, legible, sin necesitar nada.
2. **Una carpeta `_GESTOR`** con trece ficheros de texto que guardan lo que no cabe en el nombre de
   una carpeta: el estado de cada asunto, sus notas, quién lo ha pedido, los hitos del trámite, el
   tablón, la papelera, los tipos, los grupos de personas.
3. **Una carpeta `_GESTOR/datos`** con los listados de personas: el `RegAlum.csv` que Francisco
   baja de Séneca, el de personal, y cuatro ficheros más que crea la propia aplicación.

De los trece ficheros de `_GESTOR`, uno manda sobre todos los demás: **`asuntos.json`**. Es la
ficha de cada asunto. Cada vez que se cambia una sola palabra —marcar un estado, escribir una
nota, poner una fecha límite— **se vuelve a escribir el fichero entero**, de arriba abajo.

### Cuánto va a ocupar

He construido fichas con la misma forma que las de verdad (tercero, estado, vía, plazo, quién lo
pide, campos del tipo, relacionados, hilos de correo y unas cuantas notas) y he medido:

| Cuántos asuntos | Cuándo sería | Cuánto ocupa `asuntos.json` |
|---|---|---|
| 300 | hoy, aproximadamente | **0,6 MB** |
| 1.200 | final de este curso 26-27 | **3,0 MB** |
| 3.600 | tres cursos | **9,0 MB** |
| 6.000 | cinco cursos | **17,6 MB** |
| 12.000 | diez cursos | **35,3 MB** |

Y el índice del ARCHIVO, que guarda el nombre de cada carpeta archivada y los nombres de sus
documentos:

| Asuntos archivados | Cuánto ocupa `indice-archivo.json` |
|---|---|
| 1.000 | **0,7 MB** |
| 4.000 | **2,6 MB** |
| 10.000 | **7,6 MB** |

**El dato que más importa de esta tabla no es el tamaño: es que el fichero nunca se limpia.**
Archivar un asunto no borra su ficha de `asuntos.json`. La ficha se queda ahí para siempre. He
mirado todos los sitios donde se borra una ficha: solo se borra al mandar el asunto a la papelera,
al unir dos asuntos, y al renombrar uno (y ahí se borra para volver a escribirla con el nombre
nuevo). Al archivar, no. Así que el fichero que la aplicación carga entero en memoria cada vez que
alguien entra crece con cada asunto que se ha hecho en la vida del centro, no con los que están
vivos.

Esto tiene arreglo, y es el mejor arreglo que se me ocurre para este proyecto. Está en el punto
1.3.

### Cuánto se tarda

Convertir esos datos a texto y volver a leerlos, medido aquí:

| Tamaño | Escribir | Leer |
|---|---|---|
| 0,6 MB | 6 milésimas de segundo | 2 milésimas |
| 3,0 MB | 15 milésimas | 16 milésimas |
| 9,0 MB | 86 milésimas | 26 milésimas |
| 17,6 MB | 401 milésimas | 71 milésimas |
| 35,3 MB | 849 milésimas | 156 milésimas |

Este ordenador es bastante más rápido que un Chromebook. **(opinión)** Calculo que en el
Chromebook de Francisco hay que multiplicar por dos o por tres. Con 9 MB serían unas dos décimas
de segundo por guardado; con 17 MB, más de un segundo.

**Pero el tiempo del ordenador no es el problema.** El problema es Dropbox.

### Cuántas veces se lee y se escribe cada día

Esto es lo que de verdad decide si el diseño aguanta.

**Se escribe `asuntos.json` entero** cada vez que alguien: crea un asunto, cambia su estado,
escribe una nota, pone o quita una fecha límite, apunta quién lo pide, registra un documento,
archiva, reabre, borra, une dos asuntos o edita el nombre. **(opinión)** Entre las dos personas,
en un día normal de trabajo, eso son fácilmente entre 50 y 150 veces.

Con el fichero a 3 MB, eso son **entre 150 MB y 450 MB que Dropbox tiene que subir cada día** solo
para este fichero. Con el fichero a 9 MB, entre 0,5 y 1,3 GB al día.

Y cada una de esas subidas abre una ventana de entre 5 y 30 segundos en la que el otro ordenador
tiene una versión vieja. Cuanto más grande el fichero, más larga la ventana, y más probable que
Dropbox deje una "copia en conflicto". Las copias en conflicto ya están resueltas (ver la parte 2,
punto 2), pero cuantas más haya, más ocasiones de que algo salga mal.

**También se lee** `asuntos.json` entero: al entrar, y otra vez justo antes de cada escritura (a
propósito, para no pisar al compañero; está bien hecho). Así que cada cambio son dos viajes al
fichero entero, no uno.

Además, mientras la aplicación está abierta:

- cada **10 segundos** se lee un fichero pequeño para saber si el compañero está dentro del mismo
  asunto;
- cada **20 segundos** se miran los nombres de las carpetas de "Asuntos abiertos" (solo los
  nombres, no se abre nada: esto es barato y está bien resuelto);
- cada **5 minutos** se busca si Dropbox ha dejado alguna copia en conflicto;
- cada **90 segundos**, si la bandeja de correos está desplegada, se mira la carpeta de correos.

Nada de eso escala mal. El único que escala mal es el fichero entero.

### El índice del ARCHIVO

"Reconstruir el índice" recorre el archivo entero: categoría, luego tercero, luego asunto, y
dentro de cada asunto lista sus documentos (y una subcarpeta más, si la tiene). Lo hace **de uno en
uno, esperando a cada carpeta antes de pedir la siguiente**.

Con 300 asuntos archivados eso son unos 700 viajes al disco. **(opinión)** En una carpeta de
Dropbox en Windows, cada viaje cuesta entre 10 y 30 milésimas de segundo, así que hoy la
reconstrucción debe tardar entre 10 y 20 segundos. Es lo que Francisco ve.

Con 4.000 asuntos archivados serían unos 9.000 viajes: **entre minuto y medio y cinco minutos**.
Con 10.000, entre cuatro y quince minutos. Sigue siendo usable —es un botón que se pulsa de uvas a
peras—, pero deja de ser "cuestión de segundos". La respuesta a la pregunta del encargo es: **con
unos 3.000 o 4.000 asuntos archivados, reconstruir el índice pasa de segundos a minutos.**

Hay un detalle que lo empeora un poco: cada vez que se archiva **un** asunto, el índice entero se
lee y se vuelve a escribir para añadirle una línea. Con el índice a 2,6 MB eso es otro fichero
grande más que sube a Dropbox en cada archivado.

### **Con qué número se rompe**

Me mojo, como pide el encargo. Estas cifras son estimaciones razonadas, no medidas en el centro:
**(opinión)**.

| Qué | Hasta aquí bien | Aquí empieza a doler | Aquí se rompe |
|---|---|---|---|
| **Asuntos en total** (abiertos + archivados) | 1.500 | 3.500 | **6.000** |
| **Documentos por carpeta de asunto** | 30 | 100 | 300 |
| **Asuntos archivados** (para el índice) | 1.500 | 3.500 | 10.000 |
| **Personas escribiendo a la vez** | 2 | 3 | **4** |

Qué significa cada columna:

- **1.500 asuntos** (un curso y medio de trabajo): todo va como hoy. No hay nada que hacer.
- **3.500 asuntos** (tres cursos): `asuntos.json` ronda los 9 MB. Cada guardado se nota: unas dos
  décimas de segundo de trabajo del ordenador, más lo que tarde Dropbox en subir 9 MB. Reconstruir
  el índice pasa a minutos. Empieza a haber copias en conflicto con más frecuencia.
- **6.000 asuntos** (cinco cursos): `asuntos.json` pasa de 17 MB. Cada guardado se nota de verdad
  en el Chromebook. Dropbox está subiendo 17 MB decenas de veces al día. Dos personas trabajando a
  la vez chocan a menudo. **(opinión)** En este punto la aplicación deja de ser agradable de usar.
- **4 personas**: la aplicación no tiene un cierre de verdad sobre los ficheros. Lo que tiene es un
  aviso ("el compañero ya está en este asunto") que caduca a los tres minutos y que solo cubre
  estar dentro del mismo asunto, no escribir en el mismo fichero. Con dos personas, y con la
  relectura previa a cada escritura, aguanta bien. Con tres ya es cuestión de suerte. Con cuatro,
  las copias en conflicto de Dropbox serían la norma.

**La conclusión de este apartado:** la estructura aguanta perfectamente el uso de hoy y el de este
curso. El que se rompe no es el diseño de carpetas —ese es sólido y podría durar veinte años—: el
que se rompe es **un solo fichero, `asuntos.json`, que se reescribe entero y nunca se limpia**. Y
se rompe hacia el tercer curso de uso.

---

## 1.2 ¿Qué datos salen hoy a internet de verdad?

He recorrido el código buscando toda llamada que salga fuera. Esto es lo que hay.

### Lo que SÍ sale

**1. El programa, a Vercel.** Se publica el repositorio entero: la página, los ficheros de
programa, los de estilo y las librerías. Ni un dato de una persona pasa por ahí desde la propia
aplicación: **no hay una sola llamada de red en los 103 ficheros de programa**. Lo he comprobado
buscando todas las formas de pedir algo a un servidor; no aparece ninguna, salvo en el fichero que
lanza las pruebas, que habla con un servidor de mentira en el propio ordenador.

Pero hay algo que sí sale y que conviene saber: **se publica el repositorio entero, no solo la
aplicación**. No hay ningún fichero que le diga a Vercel qué dejar fuera, y la configuración no
pide contraseña para nada. Eso significa que la carpeta `docs/` —con `CONTEXTO.md` (244 KB) y
`HISTORIA.md` (226 KB), que describen por dentro los procedimientos del centro— y la carpeta de
pruebas se pueden bajar desde internet por cualquiera que sepa la dirección. **(sin comprobar)**:
esto sale de leer la configuración, no he podido pedir esas direcciones desde aquí. Es fácil de
comprobar: abrir `https://asuntos.fmargon.com/docs/HISTORIA.md` en el navegador. Si sale el texto,
está confirmado.

Lo digo porque en esos documentos hay ejemplos con nombres y números de documento que **podrían ser
reales**. He encontrado al menos uno que lo parece: un proveedor con su nombre y su NIF, en
`HISTORIA.md` y en `PAPELERA.md`. No hay ningún dato de alumnado ni de tutores legales: eso lo he
comprobado fichero a fichero, y los ejemplos de alumnado son todos inventados (nombres tipo "Pérez
Ruiz, Ana" y números como 11111111H).

**2. Los correos y sus documentos, a Google.** Esto es lo importante de este apartado, y es lo que
Francisco debe poder enseñar a dirección.

El script que corre en la cuenta de `g.educaand.es` hace esto cada minuto:

- Coge los correos con la etiqueta GESTOR.
- Por cada uno deja en una carpeta de Google Drive llamada **`GESTOR-BANDEJA`**: una ficha con el
  remitente, todas las direcciones del hilo, el asunto y **hasta 6.000 caracteres del texto del
  correo**; el hilo entero en PDF; el último mensaje en PDF aparte; y **una copia de cada documento
  adjunto**.

Y al revés, cuando Francisco manda documentos de un asunto por correo:

- La aplicación **copia esos documentos desde el Dropbox del centro a la carpeta de Google Drive**,
  para que el script los pueda adjuntar (el navegador no puede adjuntar ficheros a un correo por su
  cuenta).
- El script monta el borrador y luego **manda esas copias a la papelera de Drive**. No las borra
  del todo: quedan en la papelera de Google, que normalmente las conserva 30 días.

Es decir: **los documentos de un asunto —que pueden llevar datos de un menor y de sus tutores—
pasan por Google Drive**. Es a propósito y es la única forma de hacerlo con Gmail, pero no es
"nada sale a internet": sale, a una cuenta corporativa de la Junta, y deja rastro durante un mes en
una papelera.

Los correos en sí ya vivían en Google. Lo que la aplicación **añade** es: los adjuntos copiados
como ficheros sueltos en Drive, el texto del correo copiado en un fichero aparte, los PDF del hilo,
y las copias temporales de los documentos que se mandan.

**3. Nada más.** He comprobado una por una las cosas que suelen colarse:

- **No hay ninguna librería traída de un servidor ajeno.** `pdf.js` y `pdf-lib` están copiadas
  dentro del repositorio (1,8 MB entre las tres), y se cargan desde el propio sitio, solo cuando
  hace falta abrir un PDF.
- **No hay tipografías de Google ni de nadie.** Se usan las que ya tiene el ordenador.
- **No hay ninguna imagen traída de fuera.**
- **No hay medición de visitas, ni registro de errores, ni nada parecido** configurado en el
  repositorio. La configuración de publicación tiene tres cosas: la dirección del esquema, una
  receta para no gastar publicaciones cuando solo cambian documentos, y una instrucción para que el
  navegador no se quede con la página vieja. Nada más.
- **El ayudante de Séneca no manda nada fuera.** Es un enlace que Francisco arrastra a la barra de
  marcadores. Cuando lo pulsa dentro de Séneca, el código se ejecuta ahí mismo: lee la lista del
  portapapeles y la va escribiendo en el campo de destinatarios, esperando a que Séneca confirme
  cada uno. No pide nada a ningún servidor, no guarda nada, y lo único que maneja son los nombres
  de usuario de Séneca, que no salen de la pantalla de Séneca. Al terminar, si algún destinatario
  no ha entrado, lo dice y ofrece copiarlos al portapapeles. Esto está limpio.

### Lo que NO sale

- Ningún dato de alumnado, de tutores legales ni de personal llega a Vercel desde la aplicación.
- Ningún dato sale a ningún otro servidor: no hay a dónde.
- El navegador solo guarda de su lado dos cosas: el permiso sobre las dos carpetas y el nombre que
  se escribe al entrar. Ningún dato de asuntos ni de personas se guarda en el navegador.

### Lo que NO he podido comprobar desde aquí

- **Qué guarda Vercel por su cuenta.** Todo servidor web apunta quién pide qué: la hora, el fichero
  y la dirección IP desde la que se pide. Eso no está en el repositorio y no lo puedo ver. No
  incluiría datos de personas (los datos no pasan por ahí), pero sí de quién usa la aplicación y
  cuándo. Hay que mirarlo en el panel de Vercel.
- **Si alguien activó la medición de visitas desde el panel de Vercel.** Se puede activar desde la
  web sin tocar el repositorio. No aparece configurada, pero eso no lo descarta.
- **Que las direcciones publicadas respondan y qué sirven exactamente.** Esta sesión no tiene
  salida hacia ellas.
- **Qué permisos concretos tiene concedido el script de Google**, y qué conserva Google de la
  carpeta `GESTOR-BANDEJA` y de su papelera.

### La lista corta, para enseñar

**Esto sale a internet:**

1. El programa (no los datos), a Vercel, junto con toda la documentación del proyecto.
2. Los correos etiquetados, su texto, sus adjuntos y el hilo en PDF, a Google Drive.
3. Los documentos de un asunto que se manden por correo, copiados a Google Drive y borrados
   después (quedan 30 días en la papelera de Drive).

**Esto no sale:**

1. Ningún fichero de `_GESTOR`.
2. Ningún listado de personas.
3. Nada de lo que se hace en Séneca.
4. Nada al abrir, buscar, archivar, registrar ni imprimir.

**Esto no lo he podido comprobar desde aquí:**

1. Los registros de acceso de Vercel.
2. Si el panel de Vercel tiene activada la medición de visitas.
3. Qué conserva Google, y durante cuánto.

### Ficheros con datos personales que crea o copia la aplicación

Esta es la lista que pide el encargo, para dirección.

**En el Dropbox del centro, dentro de `_GESTOR`** (todos los crea la aplicación):

- `asuntos.json`: la ficha de cada asunto. Lleva el nombre del tercero, su grupo, el estado, las
  notas escritas por Francisco y su compañero, quién pidió la gestión (con nombre del tutor legal),
  la vía de contacto con su correo o teléfono, los campos propios del tipo, y los correos
  electrónicos de las personas relacionadas.
- `hitos.json`: los pasos del trámite de cada asunto, con responsables, fechas, notas de historial
  y los datos que se hayan ido apuntando en "lo que hay que reunir".
- `tablon.json`: las notas rápidas. Texto libre, puede llevar cualquier cosa.
- `indice-archivo.json`: el nombre de cada carpeta archivada (que lleva nombre y número escolar) y
  los nombres de todos sus documentos.
- `grupos.json`: los grupos de personas creados a mano, con sus nombres.
- `envios.json`: los correos preparados, con el nombre del asunto y las direcciones.
- `presencia.json`: quién está dentro de qué asunto, ahora mismo. Se limpia solo.
- `papelera.json` y la carpeta `papelera/`: **los asuntos borrados y sus documentos enteros**, con
  sus fichas. Se avisa a los 30 días, pero **no se borra nada solo**: hay que pulsar el botón.
- `copias/`: **hasta 30 copias de cada uno de los trece ficheros de arriba**. Es decir, hasta 30
  fotos del estado completo de la aplicación, con todos sus datos personales. Las copias de un
  fichero que se detectó roto no se borran nunca.

**En el Dropbox del centro, dentro de `_GESTOR/datos`** (los cuatro últimos los crea la
aplicación):

- `RegAlum.csv` y `RelPerCen.csv`: exportaciones de Séneca. No los crea la aplicación; ya estaban.
- `solicitantes.csv`: **lo crea la aplicación.** Nombre, documento de identidad, número de
  identificación escolar, fecha de nacimiento, teléfono y correo de los aspirantes a plaza que se
  dan de alta a mano.
- `personal.csv`: **lo crea la aplicación.** Nombre, documento, puesto, teléfono y correo del
  personal que no sale en Séneca (conserjería, limpieza, empresas de servicios).
- `empresas.csv`: **lo crea la aplicación.** Razón social, nombre comercial, NIF, contacto,
  teléfono y correo.
- `otros.csv`: **lo crea la aplicación.** Nombre, referencia, teléfono y correo.

**En Google Drive, cuenta de `g.educaand.es`, carpeta `GESTOR-BANDEJA`:**

- Una ficha por correo recogido: remitente, todas las direcciones, asunto y hasta 6.000 caracteres
  del texto.
- El hilo entero en PDF y el último mensaje en PDF.
- Una copia de cada documento adjunto que llegue por correo.
- Copias temporales de los documentos que se mandan desde un asunto. Se borran al preparar el
  borrador, pero pasan por la papelera de Drive.

**En el navegador de cada ordenador:** el permiso sobre las dos carpetas y el nombre escrito al
entrar. Nada más.

---

## 1.3 ¿Hay una forma mejor, sin saltarse el límite?

El límite —ningún dato personal sale a internet— no se toca. Dentro de él, estas son las opciones
reales.

### Opción A: dejarlo como está y arreglar los puntos concretos

**Qué arreglaría:** los dos fallos graves de la parte 2 y el ritmo de crecimiento del fichero
grande, no.
**Qué rompería:** nada.
**Cuánto trabajo:** un día.
**¿Merece la pena ahora?** Sí, y hay que hacerlo pase lo que pase. Pero no resuelve el fondo.

### Opción B: sacar los asuntos archivados de `asuntos.json` — **la que recomiendo**

Hoy, la ficha de un asunto archivado en 2024 sigue dentro del mismo fichero que se reescribe entero
cuando Francisco escribe una nota en un asunto de esta mañana. Eso no tiene sentido: un asunto
archivado no vuelve a cambiar casi nunca.

La aplicación **ya hace exactamente esto con los hitos**: al archivar un asunto, su historial de
hitos se escribe como un fichero dentro de la propia carpeta del asunto y se borra del fichero
compartido. Y al reabrirlo, se vuelve a leer de ahí. Funciona, está probado, y lleva desde el 16 de
septiembre en uso.

Se trata de hacer lo mismo con la ficha: al archivar, la ficha baja a la carpeta del asunto; al
reabrir, vuelve a subir. El índice del ARCHIVO ya guarda aparte lo que hace falta para buscar, así
que la pantalla de ARCHIVO no lo notaría.

**Qué arreglaría:** `asuntos.json` dejaría de crecer. Pasaría a tener tantas fichas como asuntos
abiertos haya —entre 50 y 200, no miles— y se quedaría para siempre por debajo de medio megabyte.
Se acaban los guardados lentos, se acorta la ventana de conflicto de Dropbox a casi nada, y el
número de asuntos que aguanta el sistema deja de tener techo.

**Qué rompería:** hay que mirar los sitios que hoy leen la ficha de un asunto archivado sin pensar
—"otros asuntos de este tercero", la papelera cuando devuelve algo, la pantalla de fichas
huérfanas— y darles el camino nuevo. Es trabajo de cuidado, pero es el mismo patrón que ya está
escrito para los hitos.

**Cuánto trabajo:** **(opinión)** de dos a cuatro días, con sus pruebas.

**¿Merece la pena ahora?** Sí. Y conviene hacerlo **antes de que el fichero pase de 3 MB**, porque
cuanto más grande sea, más se tarda en la conversión y más riesgo hay de romper algo por el camino.
Ese momento llega al final de este curso. **Mi recomendación es hacerlo este curso, no el que
viene.**

### Opción C: un fichero por asunto, en vez de uno para todos

Llevar la idea de la opción B hasta el final: cada asunto guarda su ficha dentro de su propia
carpeta, abierto o archivado.

**Qué arreglaría:** desaparecerían del todo las copias en conflicto de Dropbox sobre las fichas:
dos personas solo chocarían si tocan el mismo asunto a la vez, que es raro y que ya está avisado.
**Qué rompería:** la pantalla de "Asuntos abiertos" tendría que abrir cien ficheros pequeños en vez
de uno grande para pintar la lista. En una carpeta de Dropbox eso puede ser más lento que lo de
hoy, no más rápido. Habría que guardar aparte un resumen para la lista, y entonces ya se tienen dos
sitios que pueden desincronizarse.
**Cuánto trabajo:** **(opinión)** una semana o más.
**¿Merece la pena ahora?** No. La opción B da el 90% del beneficio con el 30% del trabajo y sin ese
riesgo nuevo.

### Opción D: guardar los cambios uno detrás de otro, en vez de reescribir el fichero

En vez de reescribir el fichero entero, apuntar solo el cambio al final ("el 18 de septiembre a las
11:24, Francisco puso el asunto X en PENDIENTE"), y de vez en cuando compactar.

**Qué arreglaría:** cada guardado sería de unos pocos cientos de bytes en vez de megabytes, y
fusionar el trabajo de dos ordenadores sería trivial: se juntan las dos listas de cambios y se
ordenan por fecha.
**Qué rompería:** mucho. Todo el código que hoy lee "la ficha del asunto" tendría que pasar a leer
"todos los cambios de este asunto y aplicarlos en orden". Y hace falta un paso de compactación que,
si falla a mitad, deja el registro en un estado raro. Además, los ficheros dejan de ser legibles a
simple vista desde el explorador, que es una de las cosas buenas de este diseño.
**Cuánto trabajo:** **(opinión)** dos semanas largas, y es la clase de cambio en el que los fallos
tardan meses en aparecer.
**¿Merece la pena ahora?** No. **(opinión)** Es la solución correcta para un sistema con diez
personas escribiendo. Con dos, el coste no se justifica.

### Opción E: una base de datos que viva en el propio ordenador

Poner los datos en una base de datos del navegador o en un fichero de base de datos local.

**Qué arreglaría:** las búsquedas serían instantáneas y no habría que cargar nada entero en
memoria.
**Qué rompería:** **todo el modelo.** Los datos dejarían de estar en el Dropbox compartido y
pasarían a estar dentro del navegador de un ordenador. El compañero no los vería. Un borrado de
datos del navegador se lo llevaría todo. Y se pierde la mejor propiedad del diseño actual: que
cualquiera pueda abrir la carpeta y ver el trabajo sin necesitar la aplicación.
**¿Merece la pena?** **No, y no conviene volver a proponerlo.** El navegador ya se usa para lo que
debe: guardar el permiso de carpetas y poco más.

### La respuesta a la pregunta

**Lo que hay es correcto de fondo.** Carpetas normales en Dropbox, ficheros de texto legibles, sin
servidor: para dos personas, con este límite y sin presupuesto, es la decisión acertada, y no hay
que darle la vuelta.

Lo que hay que cambiar no es la arquitectura: es **una sola cosa dentro de ella**. Que el fichero
que se reescribe entero cincuenta veces al día deje de llevar dentro todos los asuntos de la
historia del centro. Eso es la opción B, es de dos a cuatro días de trabajo, y conviene hacerlo
este curso.

---

# Parte 2. Qué sigue vivo del análisis del 11 de septiembre

He mirado el código de hoy, una por una. No me he creído lo que dice `CONTEXTO-CORTO.md`.

## 2.1 Un `asuntos.json` dañado se borraba solo — **RESUELTA**

Está bien hecho, y mejor de lo que pedía el encargo de entonces.

Al leer un fichero se distingue de verdad "no existe" (normal la primera vez) de "existe pero no se
entiende" (grave). En el segundo caso no se devuelve un fichero vacío —que es lo que hacía que el
siguiente guardado lo borrara— sino que se lanza un aviso con nombre propio, y la aplicación **no
deja entrar**: enseña la pantalla de fichero roto.

Las copias diarias existen y funcionan: antes del primer guardado del día de cualquiera de los
trece ficheros, se guarda una copia con la fecha en `_GESTOR/copias`. Se conservan las últimas 30.
Al restaurar, **el fichero roto no se borra**: se aparta con fecha y hora, y encima se copia la
última copia buena. Las copias de ficheros rotos no cuentan para el límite de 30 y no se borran
nunca.

Tres cosas que quedan, ninguna grave:

- **Se puede perder hasta un día de trabajo.** La copia del día se hace antes del primer guardado.
  Si el fichero se rompe por la tarde, la copia buena más reciente es la de esta mañana. Es
  aceptable y no veo forma barata de mejorarlo sin escribir una copia en cada guardado, que
  multiplicaría el tráfico de Dropbox. Lo dejaría como está.
- **La comprobación de "está roto" solo se hace al entrar.** Si un fichero se rompe con la sesión
  abierta, la aplicación no se entera hasta que alguien recargue. En la práctica el daño está
  contenido, porque antes de escribir siempre se vuelve a leer y esa lectura fallaría. **(opinión)**
  Lo que pasaría es que saldría un aviso poco claro en vez de la pantalla de fichero roto.
- **Dos ficheros están fuera de las copias a propósito**: el índice del ARCHIVO y el de presencia.
  Está bien pensado: los dos se pueden rehacer enteros en cualquier momento. Está escrito y
  explicado en el código.

## 2.2 Dos ordenadores podían pisarse — **RESUELTA A MEDIAS**

Lo bueno, que es casi todo:

- **Las copias en conflicto de Dropbox se miran.** Cada 5 minutos se busca en `_GESTOR` cualquier
  fichero con "conflicto" o "conflicted" en el nombre, en los dos idiomas.
- **Los tres ficheros que más se tocan se fusionan solos y sin preguntar**: las fichas de asuntos,
  el tablón y los hitos. La fusión de fichas está bien pensada: se une la lista de notas sin
  repetir, se unen los pasos hechos y los elegidos, y para los campos sueltos gana el que se tocó
  más tarde. No se pierde nada de ninguno de los dos.
- **Los demás ficheros no se mezclan a ciegas**: aparecen en Ajustes → Mantenimiento para elegir con
  cuál quedarse, y el que no se elige queda a salvo en las copias. Es la decisión correcta.
- **La relectura antes de escribir está puesta** en casi todos los sitios: al anotar cualquier cosa
  en una ficha, al renombrar, al cambiar un estado en toda la aplicación, al unir dos asuntos, al
  enlazar una ficha huérfana, al escribir una nota. Bien hecho.

**Lo que queda vivo, y es el primer fallo grave de este informe:**

### ⚠️ GRAVE 1 — La papelera puede borrar el trabajo del compañero

**Qué pasa.** Hay dos sitios en toda la aplicación que escriben el fichero de fichas entero **sin
volver a leerlo antes**: mandar un asunto a la papelera, y devolver un asunto desde la papelera.
Los dos escriben la copia que la aplicación tiene en memoria. Todos los demás sitios releen. Estos
dos, no.

**Por qué importa.** La copia en memoria se actualiza cuando este ordenador escribe algo, pero la
pantalla de asuntos abiertos **no vuelve a leer el fichero por su cuenta en ningún momento**: ni al
refrescar cada 20 segundos, ni al cambiar de pantalla. Así que esa copia puede tener horas. Si
Francisco borra un asunto con esa copia vieja en memoria, se escribe encima del fichero bueno y
**desaparece todo lo que el compañero haya escrito desde la última vez que este ordenador guardó
algo**: notas, estados, plazos, quién pidió la gestión, terceros relacionados. Sin aviso y sin
error. Las copias de seguridad permitirían recuperarlo, pero nadie se daría cuenta de que hay que
recuperar nada.

**Cuándo puede ocurrir de verdad.** Francisco abre la aplicación a las 8:30. Consulta cosas toda la
mañana sin guardar nada. A las 13:00 borra un asunto que se creó por error. En ese momento se
escribe el fichero con la foto de las 8:30, y se pierde toda la mañana de trabajo del compañero. No
es un caso rebuscado: es un martes normal.

**Qué se haría.** Añadir la relectura del fichero justo antes, exactamente igual que hacen los otros
ocho sitios que ya la tienen. Es una línea en cada uno de los dos sitios. Media hora de trabajo,
contando la prueba.

### Lo demás de este punto

- **La pantalla no se entera de lo que hace el compañero hasta que se recarga.** No es pérdida de
  datos, es pantalla desactualizada: si el compañero cambia un estado, Francisco lo sigue viendo
  como estaba hasta que él mismo guarde algo o recargue. **(opinión)** Con dos personas es molesto
  pero no peligroso; conviene resolverlo cuando se toque la opción B de la parte 1.
- **Al fusionar un conflicto de hitos, si los dos ordenadores tocaron el mismo hito, gana el de este
  ordenador y no se avisa.** Está escrito y asumido en el código. **(opinión)** Es una decisión
  razonable, pero debería quedar una nota en el asunto diciendo que hubo un conflicto, para que
  alguien pueda mirarlo.
- **Un fichero de correos preparados no entra en la búsqueda de conflictos**, porque no está en la
  lista de los trece. Es menor: se puede rehacer.

## 2.3 Carpeta renombrada a mano → ficha huérfana — **RESUELTA A MEDIAS**

Existe una pantalla en Ajustes que encuentra las fichas cuya carpeta ya no está, enseña sus notas
para reconocerlas, y deja enlazarlas con una carpeta que no tenga ficha, o borrarlas. Está bien
hecho y resuelve el caso que se planteó en septiembre.

Pero quedan dos cosas, y una de ellas es el segundo fallo grave:

- **Nadie avisa.** Hay que ir a buscarlo a Ajustes. Si no se sabe que existe esa pantalla, las
  fichas huérfanas no se ven nunca. **(opinión)** Debería salir un aviso en la pantalla principal
  cuando haya alguna.
- **Enlazar una ficha huérfana mueve la ficha, pero no los hitos.** Es el mismo fallo de fondo que
  el que viene ahora.

### ⚠️ GRAVE 2 — Editar el nombre de un asunto le borra sus hitos

**Qué pasa.** Los hitos de cada asunto se guardan usando **el nombre de la carpeta** como
identificador. Cuando se usa "Editar" para corregir el nombre de un asunto —y "Editar" renombra la
carpeta—, la ficha del asunto se mueve al nombre nuevo, pero **la entrada de hitos se queda
apuntada al nombre viejo**.

El asunto no se queda sin hitos: la pantalla, al no encontrar ninguno, **los vuelve a crear desde
cero** a partir de la guía del tipo. Rescata solo los pasos que estaban marcados como hechos,
porque esos sí viajan en la ficha. Se pierde todo lo demás del hito:

- las fechas límite de cada paso,
- el responsable de cada paso,
- las notas del historial de cada paso,
- los documentos apuntados a cada hito,
- lo que se hubiera marcado en "lo que hay que reunir", con los datos escritos,
- la constancia de las comunicaciones enviadas desde un hito.

Y la entrada vieja se queda en el fichero para siempre, ocupando sitio, sin que nadie la vea.

Lo mismo pasa al **unir dos asuntos**, al **mandar uno a la papelera** (sus hitos se quedan
huérfanos en el fichero) y al **enlazar una ficha huérfana**.

**Por qué importa.** Los hitos son ahora mismo la pieza central de la aplicación: son la guía del
trámite, lo que aparece en "Qué me toca", y desde el 18 de septiembre llevan también lo que hay que
reunir y los textos de comunicación. Perderlos en silencio es perder el rastro de una gestión.

**Cuándo puede ocurrir de verdad.** Corregir una errata en el apellido de un alumno. Cambiar la
fecha del nombre de la carpeta porque estaba mal. Añadir el número de identificación escolar a un
aspirante que ya lo tiene —esto además lo hace la aplicación sola, en cadena, para todos sus
asuntos abiertos—. Son cosas de todas las semanas. **(opinión)** Diría que ya ha pasado y no se ha
notado, porque los hitos vuelven a aparecer solos y parecen correctos: lo que falta son los
detalles.

**Qué se haría.** Un solo sitio en el código que diga "este asunto pasa a llamarse así", y que mueva
a la vez la ficha, los hitos y la señal de presencia. Después, que los cuatro caminos que hoy
renombran o borran un asunto pasen por ahí. **(opinión)** Un día de trabajo, con sus pruebas. No
más, porque los cuatro caminos ya están localizados.

Y hay un detalle que explica por qué esto no se ha cazado antes: **no hay ninguna prueba que edite
el nombre de un asunto, ni que una dos asuntos**. Lo desarrollo en la parte 3.

## 2.4 Las pruebas existían pero no se ejecutaban solas — **RESUELTA**

Hay un flujo de trabajo en GitHub que ejecuta la batería entera en cada subida a `main` y en cada
petición de cambios. Instala lo que hace falta, instala el navegador y ejecuta las 70 pruebas.

Lo he ejecutado aquí: **las 70 pasan, con 1.478 comprobaciones, sin un fallo.** No hay deuda oculta
de pruebas rojas.

## 2.5 La aplicación se construyó "envolviendo" unas funciones con otras — **SIGUE VIVA, Y HA CRECIDO**

**Qué pasa.** El 11 de septiembre había 17 sitios donde un fichero cambia por detrás lo que hace
otro. Hoy hay **38**, repartidos en 23 ficheros distintos. De ellos, 32 envuelven funciones del
objeto central de la aplicación.

Los números que acompañan a esto:

- **103 ficheros de programa** que se cargan en la página **en un orden fijo**, uno detrás de otro,
  y ese orden importa: si se cambia, las envolturas dejan de funcionar.
- **168 funciones** colgando del mismo nombre central.
- **92 nombres globales** distintos, uno o más por módulo.

**Por qué importa.** Cuando algo falla, no se ve dónde. La función que se llama no es la que está
escrita: es la que ha quedado después de que tres ficheros la envuelvan. Y el fallo es silencioso:
si una envoltura no llega a aplicarse porque su fichero se cargó antes de tiempo, no salta ningún
error, simplemente esa función hace menos de lo que debería.

**Cuándo puede ocurrir de verdad.** Cada vez que se añada un módulo que tenga que engancharse a la
ficha del asunto o a la lista de asuntos. Está pasando cada semana.

**Qué se haría.** `CONTEXTO-CORTO.md` dice que reescribir esta arquitectura está descartado, y
**estoy de acuerdo**: sería reescribir la aplicación entera por un problema que todavía no ha
costado un fallo en producción. Lo que sí haría, y es barato:

1. Un aviso en la propia página que, al arrancar, compruebe que todas las envolturas esperadas se
   han aplicado, y chille si falta alguna. Medio día.
2. Dejar de crecer por ahí: que un módulo nuevo se enganche por un punto previsto ("avísame cuando
   se pinte una ficha") en vez de envolviendo. Ya hay un mecanismo así en la aplicación para el
   refresco; se trata de usarlo también para lo demás. Esto no es un trabajo, es una regla.

## 2.6 Los documentos de contexto se quedaban atrás del código — **SIGUE VIVA, Y HA EMPEORADO**

Está confesado en la propia cola: las filas 53 a 56 se subieron con el código y las pruebas, pero
`CONTEXTO.md` y `HISTORIA.md` se quedaron sin actualizar porque ya no caben en una subida.

Lo desarrollo en la parte 3, porque no es un descuido: es el método el que ha fallado.

## 2.7 `bandeja-correos.js` era un fichero muy grande — **RESUELTA A MEDIAS**

Se han sacado piezas a ficheros propios: la pantalla de la bandeja, el lector de adjuntos, el
enganche del correo con el asunto y los adjuntos del correo. Es un trabajo real.

Pero **sigue siendo el fichero más grande de la aplicación, con 1.278 líneas**, casi el doble que
el segundo. **(opinión)** No es urgente arreglarlo, pero conviene saber que la operación de
adelgazarlo se quedó a medias.

## 2.8 Los puntos sueltos

| Lo que se dijo el 11 de septiembre | Cómo está hoy |
|---|---|
| Firma y centro escritos a pelo en el código | **RESUELTA.** Se editan en Ajustes → El centro. Lo que queda en el código es solo un valor por defecto. |
| Versión a mano | **SIGUE VIVA.** La fecha y la hora de la versión se escriben a mano en un fichero. El propio fichero avisa de que el 17 de septiembre salieron versiones con la hora adelantada. Es de las cosas más fáciles de automatizar y de las que más ruido hacen cuando fallan. |
| Leer el ARCHIVO recorriendo todas las carpetas | **RESUELTA** para el uso diario: hay un índice guardado y la búsqueda ya no recorre nada. Pero el problema no ha desaparecido, se ha movido: ahora vive en el botón "Reconstruir el índice" (ver la parte 1.1). |
| El nombre de usuario sin control | **SIGUE VIVA.** Al entrar se escribe un nombre libre, sin lista y sin comprobación. Ese nombre queda escrito en cada nota, en cada hito y en la señal de presencia. Si un día se escribe "Francsico", queda así para siempre en esos apuntes. **(opinión)** No es grave, pero un desplegable con los dos nombres del centro es media hora de trabajo y quita un ruido para siempre. |

---

# Parte 3. La deuda de la última semana

Entre el 11 y el 18 de septiembre se han hecho 24 filas de la cola. Es un ritmo altísimo. Esto es
lo que ha dejado atrás.

## 3.1 El código

| Qué | Cuánto |
|---|---|
| Ficheros de programa | **103**, con **33.995 líneas** |
| Ficheros de estilo | **32**, con **3.281 líneas** |
| La página principal | **866 líneas**, con **103 etiquetas** que cargan programa |
| Librerías copiadas dentro | **3**, con **1,8 MB** |
| Ficheros de prueba | **71**, con **15.200 líneas** |

Los que se han hecho demasiado grandes:

| Fichero | Líneas | Qué hace |
|---|---|---|
| `bandeja-correos.js` | 1.278 | La bandeja de Gmail dentro de "Por clasificar" |
| `datos.js` | 979 | De dónde salen las personas: los CSV de Séneca y los propios |
| `ficha-asunto.js` | 976 | La pantalla de un asunto |
| `guias.js` | 929 | El editor de los pasos del trámite de un tipo |
| `asuntos-nuevo.js` | 898 | Crear un asunto |
| `relacionados.js` | 745 | Los terceros relacionados con un asunto |
| `papelera.js` | 662 | La papelera |
| `asuntos-lista.js` | 638 | La lista de asuntos abiertos |

**(opinión)** Por encima de 600 líneas un fichero deja de caber en la cabeza de golpe. Ocho
ficheros están ahí. No es una emergencia, pero tres de ellos —la bandeja, la ficha y la lista— son
los que más se tocan cada semana, y cada toque es más caro de lo que debería.

### Dónde hay dos sitios que hacen lo mismo

Esto sí lo he contado, no es impresión:

- **12 formas distintas de copiar algo al portapapeles**, en doce ficheros. La caja de herramientas
  común de la aplicación comparte 21 utilidades, y copiar no es una de ellas. Cada fichero se lo ha
  montado por su cuenta, y por eso hay ocho sitios distintos que escriben "Copiado" en un botón,
  cada uno con su propio cronómetro.
- **5 formas distintas de inventar un identificador nuevo.**
- **4 formas distintas de escribir una fecha corta.**
- **39 copias de la misma línea** para buscar un elemento de la pantalla por su nombre.

**Qué se haría.** Meter esas cuatro cosas en la caja de herramientas común y que todo el mundo tire
de ahí. **(opinión)** Medio día, y lo haría aprovechando cualquier fila que ya toque esos ficheros,
no como trabajo aparte.

## 3.2 Las pruebas

**Cuántas hay y si pasan:** 70 ficheros de prueba, 1.478 comprobaciones, **todas verdes**,
ejecutadas hoy en este ordenador. De esas 70, **50 arrancan un navegador de verdad** y manejan la
aplicación como lo haría una persona; 19 prueban la lógica por separado; 1 comprueba la receta de
publicación.

Es un trabajo serio y hay que decirlo: cada fila de la cola desde la 37 ha traído su prueba. Eso no
es lo normal.

**Y ahora, qué no prueba nadie.**

### Lo que no prueba nadie, y es importante

**1. El disco de verdad.** Todas las pruebas de navegador sustituyen el acceso a carpetas por uno
de mentira, guardado en memoria. Eso está bien para probar la lógica, pero significa que **nada
prueba el acceso real a carpetas, y absolutamente nada prueba Dropbox**. Justo las cosas que más
problemas han dado —copias en conflicto, ficheros que desaparecen a mitad de una copia, permisos
que se pierden, carpetas temporales de sincronización— son las que no toca ninguna prueba. Se
prueba la reacción de la aplicación a esos casos (eso sí está probado), pero no que los casos se
detecten en un Dropbox de verdad.

**2. El script de Google.** Son 490 líneas que copian correos, adjuntos y documentos a Drive y
montan borradores. **Ninguna prueba lo toca**, y no puede ejecutarse desde el repositorio. Es el
trozo de la aplicación que más datos personales mueve y el único sin red de seguridad ninguna.

**3. Editar el nombre de un asunto.** Ninguna prueba lo hace. Es exactamente donde está el fallo
grave 2.

**4. Unir dos asuntos.** 611 líneas de código, ninguna prueba que las ejecute.

**5. Los asuntos recurrentes.** 487 líneas, ninguna prueba.

**6. El ayudante de Séneca contra Séneca de verdad.** Está asumido y escrito: no se puede probar
desde aquí, lo comprueba Francisco a mano. Me parece bien, pero significa que cada cambio ahí es un
salto al vacío.

**Qué se haría.** Por este orden: una prueba de editar el nombre de un asunto (que además pillaría
el fallo grave 2 y evitaría que vuelva); una de unir dos asuntos; y una lista escrita, en un
documento, de lo que solo puede comprobar Francisco a mano, para que se repase antes de cada
publicación importante. **(opinión)** Un día para las dos pruebas.

## 3.3 Los documentos

`CONTEXTO.md` pesa 244 KB. `HISTORIA.md` pesa 226 KB. Entre los dos, **casi medio megabyte de
texto** que hay que mantener al día a mano después de cada fila de la cola.

Ya ha fallado. La propia cola lo cuenta: las filas 53 a 56 se subieron sin actualizar ninguno de
los dos, porque no caben en una subida, y reescribirlos enteros a mano era demasiado arriesgado.
Antes, el 17 de septiembre, uno de ellos se quedó en el repositorio con una palabra de relleno y
nada más, y hubo que recuperarlo del historial.

**Esto no es un descuido. Es que la regla es imposible de cumplir.** La regla dice: al terminar
cualquier instrucción, actualiza los dos documentos sustituyendo la línea vieja. Con documentos de
244 KB, eso obliga a cada sesión a manejar el fichero entero para cambiar dos frases. Es la
definición de un método que no escala.

**Qué se haría.** De las tres salidas que plantea el encargo —partirlos, recortarlos o cambiar la
forma de mantenerlos— recomiendo **partirlos, y solo `CONTEXTO.md`**:

- **`CONTEXTO.md` se parte por módulos.** Un documento por zona de la aplicación: los asuntos, los
  correos, los hitos, los campos, los PDF, los ficheros de `_GESTOR`. Cada fila de la cola toca una
  o dos zonas, así que cada sesión solo abre y reescribe el documento pequeño que le toca, de 20 o
  30 KB. El documento principal se queda con el índice y con lo que vale para todo.
- **`HISTORIA.md` no se parte: se corta por año.** Es un diario, se escribe siempre por arriba y no
  se relee casi nunca. Basta con dejar en el fichero vivo los dos últimos meses y mandar lo anterior
  a `HISTORIA-ANTERIOR.md`, que no se vuelve a tocar. El fichero vivo se queda en 30 o 40 KB.
- **Y una regla más**, que vale más que las dos anteriores: **`CONTEXTO-CORTO.md` es el único que es
  obligatorio actualizar en la misma subida.** Los demás pueden ir en una subida aparte, al día
  siguiente si hace falta. Hoy el método exige que todo vaya en el mismo commit por la cuota de
  publicaciones, y es justamente eso lo que ha hecho que se caiga la documentación.

**(opinión)** Medio día de trabajo, y es de las cosas que más tiempo van a ahorrar de aquí en
adelante.

Una observación, ya que se habla de esto: **`CONTEXTO-CORTO.md` tiene hoy exactamente 160 líneas, y
su tope es de 160**. Está lleno hasta el borde: la próxima fila de la cola ya no cabe. Y además el
tope se ha esquivado por el otro lado, alargando las líneas en vez de añadirlas: hay líneas de más
de **1.300 caracteres**, párrafos enteros escritos en una sola línea para que cuenten como una. El
tope de 160 líneas ya no protege de nada. **(opinión)** El tope debería ser de caracteres, no de
líneas, y ese documento necesita una poda ya.

## 3.4 El método de trabajo en sí

La pregunta del encargo es: los tres días de ficheros pisados, truncados y con texto de relleno,
¿son mala suerte o una señal?

**Son una señal.** Y creo que la señal se puede leer con precisión, porque las tres averías
tuvieron la misma causa.

Las tres pasaron porque **una sesión sin `git` de verdad tuvo que reescribir un fichero grande
entero, a mano, a través de una llamada que no avisa cuando se corta**. Una vez el fichero quedó
con una palabra de relleno. Otra, cortado a la mitad. Otra, con un comando sin ejecutar dentro. Y
las cuatro reglas que se añadieron después (10, 11, 12 y 14) son todas del mismo tipo: "ten
cuidado al reescribir ficheros grandes".

Cuando la respuesta a un problema son cuatro reglas que dicen "ten más cuidado", el problema no
está resuelto: está aplazado. Las reglas dependen de que cada sesión se acuerde de cumplirlas, y ya
se ha visto que a veces no.

**Lo que de verdad lo arregla es quitar la causa:**

1. **Que ninguna sesión tenga que reescribir un fichero de más de 40 KB.** Eso es exactamente lo que
   consigue partir `CONTEXTO.md` (punto 3.3). Con los documentos por debajo de 40 KB, las reglas
   11, 12 y 14 dejan de hacer falta: no es que se cumplan mejor, es que no hay ocasión de
   incumplirlas.
2. **Que las sesiones se lancen de una en una.** Ya está escrito en la cola, y es correcto. El día
   de las tres sesiones en paralelo fue el día de las tres averías.

Sobre si la cola aguanta con 60 filas: **(opinión)** sí, y bastante bien. La compactación del 18 de
septiembre fue la decisión correcta y hay que mantenerla. Lo que no aguanta no es la cola: es la
obligación de actualizar medio megabyte de documentación en la misma subida que el código.

Una cosa más que me parece sana y conviene no perder: la regla de dos subidas por fila, y la receta
que evita publicar cuando solo cambian documentos. Está bien pensada y es la razón de que hoy no se
esté agotando la cuota. La he leído y hace lo que dice.

## 3.5 La interfaz

Aquí voy con menos seguridad que en el resto del informe, porque no he podido usar la aplicación:
solo la he leído. **(opinión)** todo este apartado.

Lo que se ve leyendo el código y el diario:

- **La ficha del asunto se ha rehecho tres veces en cuatro días.** Fila 51 (tres columnas), fila 52
  (cabecera agrupada por el momento del trámite), fila 58 (fila de copiar y menú de tres puntos).
  Tres rediseños seguidos de la misma pantalla en cuatro días es señal de que se está diseñando
  probando, no antes de probar. No es malo en sí —Francisco usa la aplicación y dice qué le sobra—,
  pero conviene saber que la ficha va a necesitar una cuarta pasada cuando los hitos lleven un mes
  en uso.
- **Hay tres caminos distintos para lo mismo: comunicar.** El botón "Comunicar" de la cabecera del
  asunto (con la plantilla del tipo), el botón "Comunicar" de un hito (con el texto de ese paso), y
  el botón "Pedir lo que falta" de un hito (con la lista de lo pendiente). Los tres abren el mismo
  cuadro, lo cual está bien hecho y es de agradecer. Pero desde la pantalla, tres botones parecidos
  con nombres parecidos en la misma ficha van a ser confusos. Habrá que ver con el uso si "Pedir lo
  que falta" no debería ser una opción dentro de "Comunicar".
- **Las pantallas de Ajustes han crecido mucho y de golpe**: tres pestañas, una pantalla propia por
  tipo de asunto con ocho secciones, un panel de tres pestañas para los campos, un creador de campos
  calculados con seis operaciones. Todo eso se ha construido en dos días. El creador de campos
  calculados, en concreto, es una pieza que exige entender qué es "partir un texto" y "una tabla de
  equivalencias"; es la parte de la aplicación que más se aleja de "no hace falta ser programador".
  Habrá que ver si Francisco la usa o si acaba pidiendo los campos a mano.
- **Un detalle concreto que sí puedo afirmar:** hay dos botones que hacen lo mismo con nombre
  distinto en la papelera y en la ficha. En la ficha, borrar se llama "Borrar"; en la lista, también;
  pero en un sitio manda a la papelera y en otro pregunta dos veces. No es un fallo, es
  inconsistencia.

---

# Parte 4. Lo que va a faltar

No son fallos. Son cosas que el uso va a pedir. Las pongo por cuándo van a hacer falta.

## Para ya (semanas)

**1. Búsqueda dentro de las notas.** Ya está apuntado como pendiente. Hoy se busca por el nombre de
la carpeta, por los documentos y por el registro de Séneca, pero no por lo que se ha escrito en las
notas, que es donde está la memoria de lo que pasó. **(opinión)** En cuanto haya 300 asuntos y
alguien pregunte "¿esto no lo habíamos hecho ya con aquella familia?", va a hacer falta. Con el
índice del ARCHIVO ya construido, es trabajo de un día.

**2. Un aviso cuando hay fichas huérfanas.** Ver la parte 2.3. Hoy hay que ir a buscarlas.

**3. Que el nombre de usuario salga de una lista.** Ver la parte 2.8.

## Para este curso (meses)

**4. Cuentas por tipo para la memoria de fin de curso.** Apuntado como pendiente. Llegará en junio,
y llegará de golpe: "cuántos certificados de matrícula hemos hecho este curso". Con el índice del
ARCHIVO ya está casi toda la información necesaria. **(opinión)** Dos o tres días, y conviene
tenerlo hecho **antes** de junio, no en junio.

**5. Sacar los asuntos archivados del fichero grande.** Es la opción B de la parte 1.3. Lo pongo
aquí porque es lo más importante de esta lista.

**6. Partir `CONTEXTO.md`.** Parte 3.3.

**7. Una lista escrita de lo que solo se puede probar a mano.** Parte 3.2.

## Para el cambio de curso, septiembre de 2027

**8. Qué pasa con el alumnado que se va con asuntos abiertos.** Está apuntado como pendiente y es lo
más gordo de esta parte. Hoy no hay respuesta, y conviene pensarla con tiempo porque toca varias
cosas a la vez:

- Un alumno que se va del centro **desaparece del `RegAlum.csv`** del curso siguiente. Su asunto
  abierto se queda con el nombre en la carpeta, pero el buscador de terceros ya no lo encuentra y
  "Datos y contacto" se queda sin teléfono ni correo. **(opinión)** Esto va a pasar en septiembre de
  2027 con unos cuantos asuntos, y va a ser desagradable.
- **Qué hacer con el año académico del nombre de la carpeta** de un asunto que empezó en 26-27 y se
  termina en 27-28.
- **Los aspirantes a plaza** que se dan de alta a mano en un fichero propio: ese fichero no se
  limpia nunca, así que arrastrará a todos los aspirantes de todos los cursos.

**Qué se haría.** **(opinión)** Guardar en la ficha del asunto una copia de los datos de contacto
del tercero en el momento de crearlo. Hoy la ficha guarda solo el nombre y va a buscar el resto al
CSV cada vez. Con la copia guardada, un alumno que se va sigue teniendo su teléfono en su asunto. Es
un cambio pequeño, y cuanto antes se haga, más asuntos lo tendrán cuando llegue septiembre de 2027.
Conviene hacerlo **este curso**, aunque la necesidad sea del que viene.

**9. Guardar el `RegAlum.csv` de cada curso, no solo el último.** Relacionado con lo anterior. Si al
cambiar de curso se sobrescribe el fichero, se pierde la única fuente de datos del alumnado que se
fue.

## Para cuando entre una tercera persona

**10. El aviso de "no pisarse" no aguanta tres.** Ver la parte 1.1. No es que falle: es que el
diseño está pensado para dos. Entra en el mismo paquete que la opción B.

**11. La lista de tipos de asunto y de estados hay que coordinarla.** Ya está apuntado como
pendiente, y con tres personas será más urgente: hoy los borrados de esas listas no se fusionan
entre ordenadores, solo las altas. Con dos personas eso ya causa que una lista borrada en un
ordenador reaparezca desde el otro. Con tres, peor.

## Para el relevo — y esto no lo pone nadie en la lista, pero es lo más importante de esta parte

**12. Hoy el proyecto entero cuelga de las cuentas personales de Francisco.** El repositorio, el
dominio `fmargon.com`, el proyecto de publicación, y el script de Google. Está apuntado como
pendiente ("pasar repositorio y Vercel a una cuenta del centro"), pero está apuntado como una tarea
más, y no lo es.

**Qué pasa.** Si Francisco se va del centro, o simplemente se pone enfermo un mes, nadie más puede
publicar un cambio, renovar el dominio ni tocar el script que recoge los correos. La aplicación
seguiría funcionando —los datos están en el Dropbox del centro, eso está bien— pero quedaría
congelada y sin mantenimiento posible.

**Por qué importa.** Un centro educativo no puede depender de la cuenta personal de un auxiliar
administrativo para una herramienta que usa a diario.

**Cuándo puede ocurrir de verdad.** Un traslado, una baja larga, o simplemente que el dominio se
renueve con una tarjeta caducada.

**Qué se haría.** Por orden de urgencia y de facilidad: (a) escribir un documento de una página con
todas las cuentas, dónde está cada cosa y cómo se publica, y dejarlo en el Dropbox del centro —eso
es una hora de trabajo y resuelve el caso "Francisco está de baja"—; (b) poner a una segunda persona
del centro como colaboradora en el repositorio y en el proyecto de publicación; (c) a medio plazo,
mover todo a cuentas del centro.

## Otras que se ven venir

**13. La papelera no se vacía sola.** Avisa a los 30 días, pero hay que pulsar el botón. Con el
tiempo acumulará asuntos borrados enteros, con sus documentos, dentro del Dropbox del centro.
**(opinión)** Para datos de menores, tener un borrado que nunca ocurre solo no es lo ideal; conviene
al menos que el aviso sea más insistente.

**14. Las copias de seguridad tampoco se limpian por fecha.** Se guardan las últimas 30 de cada
fichero. Cuando el fichero de fichas pese 3 MB, eso son 90 MB de copias. Cuando pese 9, son 270 MB.
No es un problema de espacio, pero son 30 fotos completas de los datos del centro en una carpeta que
nadie mira. Se soluciona solo si se hace la opción B de la parte 1.3.

**15. Las librerías de PDF están congeladas en una versión de 2023.** `pdf.js` versión 3.11.174.
Están copiadas dentro del repositorio a propósito, que es lo correcto para que no se traigan de
fuera. Pero eso significa que **no van a recibir nunca un arreglo de seguridad** salvo que alguien
las cambie a mano. Y esa librería es la que abre los PDF que llegan por correo desde fuera del
centro. **(opinión)** El riesgo es bajo pero no es cero, y no cuesta nada dejar apuntado que hay que
mirar una vez al año si hay versión nueva.

**16. La página carga 103 ficheros de programa, uno por uno, y pide que no se guarden en caché.**
Son 1,4 MB de programa propio en 103 peticiones, cada vez que alguien abre la aplicación.
**(opinión)** En la red del IES eso puede notarse al arrancar. No lo he podido medir. Si algún día
molesta, la solución no es tocar el código: es juntar los 103 en uno solo al publicar.

**17. Falta decidir qué pasa con un asunto que se queda abierto para siempre.** Hoy nada avisa de un
asunto abierto desde hace ocho meses sin una sola nota. "Qué me toca" mira los hitos pendientes, no
los asuntos olvidados.

---

# Parte 5. Propuesta de orden de trabajo

Pocas cosas, lo más grave primero.

| Nº | Qué | Cuánto |
|---|---|---|
| **1** | **Releer el fichero de fichas antes de escribirlo en la papelera** (los dos sitios que no lo hacen). Es el fallo que puede borrar el trabajo de una mañana del compañero. | **Medio día** |
| **2** | **Que renombrar, unir, borrar y enlazar un asunto muevan también sus hitos.** Un solo sitio que diga "este asunto pasa a llamarse así", y que los cuatro caminos pasen por él. Con su prueba, que hoy no existe. | **Un día** |
| **3** | **Comprobar qué se sirve de verdad en la dirección publicada**, y si `docs/` se puede bajar desde internet. Si se puede, dejar fuera de la publicación las carpetas que no son la aplicación. | **Medio día** |
| **4** | **Sacar los asuntos archivados del fichero de fichas**, igual que ya se hace con el historial de hitos. Es lo que evita que el sistema se ponga lento en dos cursos. | **De dos a cuatro días** |
| **5** | **Partir `CONTEXTO.md` por módulos y cortar `HISTORIA.md` por fecha**, y dejar de exigir que los dos se actualicen en la misma subida que el código. Es lo que quita la causa de las tres averías de ficheros. | **Medio día** |
| **6** | **Guardar en la ficha una copia de los datos de contacto del tercero**, para que un alumno que se va del centro no deje sus asuntos sin teléfono en septiembre de 2027. | **Un día** |
| **7** | **Escribir una página con todas las cuentas y cómo se publica**, y dejarla en el Dropbox del centro. Poner a una segunda persona como colaboradora del repositorio. | **Una hora** |
| **8** | **Pruebas de editar un asunto y de unir dos asuntos**, que hoy no existen. La primera ya la cubre el punto 2. | **Medio día** |
| **9** | **Búsqueda dentro de las notas**, y **cuentas por tipo** para la memoria de fin de curso. Esta antes de junio. | **Tres días** |

Los puntos 1, 2 y 3 son de esta semana. El 4 y el 5, de este mes. El resto, de este curso.

---

# ¿Vamos por buen camino?

**Sí.**

Y lo digo después de buscar razones para decir que no.

Lo que está bien, y no es poco:

- **La decisión de fondo es la correcta.** Carpetas normales en el Dropbox del centro, ficheros de
  texto legibles, sin servidor, con el trabajo sobreviviendo aunque la aplicación desaparezca. Con
  este límite y sin presupuesto, es lo mejor que se puede hacer. No hay que darle la vuelta.
- **El límite se está respetando de verdad**, no de boquilla. He buscado fugas y no las hay: ni una
  llamada de red en todo el programa, ni una librería traída de fuera, ni medición de visitas. Lo
  único que sale a Google sale porque tiene que salir para usar Gmail, y está acotado.
- **Las pruebas son de verdad.** 70 ficheros, 1.478 comprobaciones, todas verdes, ejecutándose solas
  en cada subida, y la mitad de ellas manejando un navegador real. Eso es mejor que muchos
  proyectos profesionales.
- **La reacción a lo que ha fallado ha sido buena.** Lo del fichero roto que se borraba solo está
  bien resuelto. Lo de las copias en conflicto de Dropbox, también. Lo de las carpetas a medias al
  archivar, también. Y todo está escrito, con la fecha y el motivo.

**Nada se torció.** No hay un punto en el que el proyecto se metiera por un camino equivocado y haya
que deshacer algo. No propongo tirar nada.

Lo que sí hay es **una cosa que hay que hacer este curso y no el que viene**: sacar los asuntos
archivados del fichero que se reescribe entero cincuenta veces al día. Hoy pesa medio megabyte y no
molesta. En junio pesará tres. En dos cursos, nueve, y entonces cada nota que escriba Francisco
tardará en guardarse y Dropbox estará subiendo nueve megabytes cincuenta veces al día. No es una
catástrofe: es una cuesta que se sube poco a poco y de la que uno se da cuenta tarde. Se arregla en
tres días ahora, y en tres semanas dentro de dos cursos.

Y hay **dos fallos concretos que pueden costar datos hoy**, los dos de la misma familia: dos sitios
que escriben sin releer, y un identificador (el nombre de la carpeta) que se usa en dos ficheros
pero solo se actualiza en uno. Los dos son de un día de trabajo entre ambos. Son la primera cosa que
haría.

Lo que más me preocupa a medio plazo no es técnico: es que **todo el proyecto cuelga de las cuentas
personales de Francisco**. Eso se arregla en una hora escribiendo una página, y nadie lo ha
escrito.

---

*Informe cerrado el 18 de septiembre de 2026. Ni una línea de código se ha tocado para escribirlo.*
