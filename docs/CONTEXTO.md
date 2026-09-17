# Proyecto: Gestor de Asuntos / Expedientes — IES Fuente Lucena

Documento técnico, **para programar**: solo lo que es verdad hoy, sin fechas ni relatos. Para
decidir, lee primero `docs/CONTEXTO-CORTO.md` (dirección, reglas de nombres, qué está hecho, qué
falta). El porqué de cada decisión y el diario completo están en `docs/HISTORIA.md`.

---

## 1. Cómo funciona la aplicación

Web publicada en Vercel (**https://gestor-de-asuntos.vercel.app**, proyecto `gestor-de-asuntos`,
equipo `team_gnCjBLTS8m8PNTFVUf7ST0uN`) que trabaja sobre la carpeta de Dropbox del propio
ordenador, con el selector de carpetas del navegador (Chrome o Edge). Sin cuenta de Dropbox, sin
servidor y sin base de datos aparte: los datos no salen del ordenador.

Las carpetas señaladas y el nombre de usuario se guardan en el navegador (IndexedDB, ver la
sección 6) **atados a la dirección de la web**: si la dirección cambia, hay que volver a
señalarlas.

Decisiones de diseño:

- Primero se elige la categoría (ALUMNADO, PERSONAL, EMPRESAS, OTROS), y después el tipo.
- Los tipos de asunto solo se crean en Ajustes, nunca sobre la marcha. Los de DOCUMENTO sí se
  crean al vuelo, desde el propio cuadro.
- Se puede ver el archivo completo de un tercero.
- La ficha del alumnado enseña arriba la edad actual, el DNI y el contacto de los tutores.
- Además de arrastrar un documento a la carpeta, se puede elegir desde la app en la carpeta
  donde esté: se guarda una copia ya con el nombre montado, y el original se queda donde estaba.

**Estado del asunto.** Lista configurable en Ajustes, en el orden del trámite, no alfabético.
Se guarda en `_GESTOR/estados.json`. La casilla "Depende de otros" decide en cuál de las tres
tarjetas de arriba sale el asunto.

**Vía de comunicación preferente.** Es del asunto, no del tercero. `js/via-contacto.js` ofrece
como botones los teléfonos o correos que ya están en el CSV del tercero.

**Fecha límite** (`js/plazos.js`). Opcional, en la ficha de `asuntos.json`, nunca en el nombre.
Los días se cuentan naturales; si hace falta contar días hábiles, se cambia la fecha a mano. Un
plazo vencido, el de hoy o el de mañana salen en rojo o ámbar; el resto, en gris. Los tipos de
asunto pueden llevar unos días de plazo por defecto, en Ajustes.

**Asuntos recurrentes** (`js/recurrentes.js`, `_GESTOR/recurrentes.json`). Se apuntan una vez,
con el tipo, el tercero, cada cuánto y el día (y el mes, si es anual); la aplicación calcula sola
cuándo toca la siguiente a partir de la última vez que se creó. Las carpetas no se crean solas:
sale un aviso y hasta que no se pulsa el botón no se crea nada.

**¿Esto no lo hicimos ya?** (`js/duplicados.js`). Antes de abrir un asunto se mira si ese
tercero ya tuvo otro igual, mirando barato: solo su carpeta del ARCHIVO y los abiertos.

**Buscador de tipos** (`js/tipos-buscador.js`). Con muchos tipos, tres letras filtran la
parrilla y arriba salen los más usados.

**Editar un asunto abierto** (`js/asuntos-editar.js`). Cambiar datos es cambiar el nombre de la
carpeta, y la ficha viaja con ella. **En el ARCHIVO no hay botón Editar**: el nombre de una
carpeta archivada es el rastro de aquel día.

**Copiar el Nº de identificación escolar** (`js/copiar.js`). Solo en la categoría ALUMNADO, para
no confundirlo con los cuatro caracteres del documento del personal ni con el NIF de una
empresa. También se copia el nombre de un documento, sin la extensión.

**Crear el tipo de documento desde el propio cuadro.** La última opción del desplegable abre un
campo para crearlo ahí mismo, sin salir a Ajustes.

**La guardia contra duplicados de nombres** (`js/util.js`, `U.parecidos` / `U.dejaCrear`).
Reduce cada nombre a su hueso: sin mayúsculas, sin tildes, sin espacios, guiones ni puntos, y
sin la S del plural. Si ya está escrito de otra manera, no se crea y se dice cuál es el que hay;
si solo se parece, avisa, enseña los parecidos y deja decidir. Se usa en **cinco puertas**: el
cuadro de documentos, tipos de asunto, estados, tipos de documento y campos propios. Si hace
falta en otro sitio, se llama desde `js/util.js`: no se copia.

**Aviso de que el RegAlum.csv está viejo.** Se mira la fecha del propio fichero en
`_GESTOR/datos`: ámbar al pasarse, rojo al doblar el plazo o si no hay ninguno. Cuántos días es
"viejo" depende de la época del año (día-mes, sin año, pueden dar la vuelta al año), configurable
en Ajustes y guardado en `_GESTOR/frescura.json`. De partida: comienzo de curso (01-09 a 31-10)
cada 7 días; matrícula y verano (01-06 a 31-08) cada 15; escolarización (01-03 a 30-04) cada 15;
el resto del año, cada 30.

**La versión, a la vista** (`App.VERSION`, en `js/version.js`). En la pantalla de entrada y,
dentro, abajo a la izquierda. Se cambia cada vez que se publica algo que Francisco tenga que ver,
con fecha y hora de España (`10-sep-2026 · 13:55`). Sirve también para comprobar que Vercel ha
publicado de verdad (ver la sección 8).

**Botón de Salir** (`js/salir.js`). Al pie de la barra de la izquierda. Cierra la sesión: recarga
la página y vuelve a la pantalla de entrada, con las carpetas ya señaladas. Pide confirmación.

**La barra de la izquierda** (`js/barra.js`, `css/barra.css`). Se pliega y nace plegada; un
botón de tres rayas la abre y la cierra; al elegir una pantalla se vuelve a plegar sola; se
recuerda en `gestor-barra`. **Queda fija en pantalla** (`position:fixed`); el contenido se
desplaza con `margin-left` (232px, o 52px plegada). Ajustes está en la lista de pestañas,
separado por una línea (`.separador-lateral`); con la barra plegada, un icono de rueda dentada
(`#btn-barra-ajustes`) lleva directo a Ajustes. El botón grande "+ Nuevo asunto" va en la
cabecera de Asuntos abiertos, y lo pone el mismo fichero.

**El panel de lectura de la derecha** (`js/lector.js`). Se cierra con la equis o con Escape. El
borde izquierdo se arrastra; el ancho se recuerda (`gestor-lector-ancho`); doble clic vuelve al
46%. En pantalla estrecha (menos de 1100px) se pone a lo ancho. Servicio genérico:
`Lector.abrir({ titulo, pie, blob, botones })`.

**Comodidades de pantalla** (`js/usabilidad.js`): botón Volver, Cancelar, etiquetas de lo que se
está filtrando, vista compacta y la tecla Escape. No toca datos.

**Que de toda pantalla se pueda salir.** Con el cuadro (`#capa`) abierto, Escape lo cierra
(cancela; si no lleva Cancelar, acepta). Con el visor de un documento abierto (`con-visor`),
Escape lo cierra (el lector de correos vigila el suyo aparte, en `js/lector.js`). Si no hay nada
de eso y el cursor no está en un buscador, Escape hace lo mismo que el botón de salida de la
pantalla que se ve (`.boton-volver`, `#ficha-volver` o `#dup-pantalla-volver`); en Nuevo asunto
equivale a Cancelar, y si hay algo escrito (descripción, tercero elegido o categoría marcada)
pregunta antes de tirarlo. Todo esto vive en el Escape general de `js/usabilidad.js`. **Un cuadro
pequeño que ponga su propio Escape** (el tipo de documento nuevo de `js/documentos.js`, el menú
de tres puntos de `js/ajustes.js`) tiene que cortar la propagación (`ev.stopPropagation()`), o
el Escape general de aquí se dispara también y hace algo de más.

### La ficha de un asunto

Al pulsar el nombre de un asunto se entra en su ficha: sus datos, el contacto del tercero, la
guía de su tipo con las casillas, sus notas, sus documentos y los demás asuntos del mismo
tercero.

**La tarjeta de la lista se queda con lo justo**: el desplegable del estado, "Copiar nombre" y
"Archivar". `js/ficha-asunto.js` quita de la tarjeta cualquier otro botón, con una lista blanca
(`BOTONES_DE_LA_TARJETA`). **Ojo con esto**: un módulo que añada un botón a la tarjeta con
`window.Gestor.botonesDeTarjeta` **no se verá** si su texto no está en esa lista.

### Las tarjetas por tipo de asunto

Dentro de "En el departamento" y de "A la espera de terceros", encima de la lista, sale una fila
de tarjetas pequeñas: una por cada tipo de asunto presente, con cuántos son y, en rojo, cuántos
están fuera de plazo. La primera es "Todos". Con un solo tipo, las tarjetas no salen. Las cuentas
se hacen sobre lo que ya han dejado pasar el buscador y los filtros. Orden por cantidad, de más a
menos, y a igualdad alfabético. Vive en `js/asuntos-lista.js`, estilos en `css/vista.css`.

### Lo que deja un correo dentro del asunto

- La nota de un correo son dos líneas: quién y cuándo, y debajo el asunto del correo. El enlace
  no se escribe en el texto: se guarda aparte (`enlace`, `enlaceTexto`, `correo`) y se enseña
  como botón "Abrir en Gmail" (`Notas.anadir`).
- Un correo no entra dos veces (`Notas.yaTieneCorreo`).
- Los adjuntos entran con nombre de la casa: `AAMMDD ADJUNTO …`.
- Los documentos de la ficha van en dos grupos, "Del expediente" y "Llegados por correo" (los
  rótulos solo salen cuando hay de las dos clases); lo de correo se reconoce por el nombre
  (CORREO, HILO o ADJUNTO).
- Las fechas que trae el correo se recortan a `AAAA-MM-DD` al leer la bandeja.

Se comprueba con `pruebas/correos.mjs`.

### El tablón, desplegado por defecto

El tablón se ve siempre. Solo se quita cuando hay algo abierto en el panel de la derecha (no
cabe), y por debajo de 900px de zona de trabajo. El botón "Tablón" de la cabecera lo esconde y lo
trae de vuelta a mano; al volver a la pantalla, vuelve a estar desplegado.

**Hay DOS paneles a la derecha, no uno**: leer un correo pone `con-lector`, ver un documento pone
`con-visor`. En `js/vista.js` la lista se llama `PANELES_DE_LA_DERECHA`: **un tercer panel debe
apuntarse ahí.**

### El DNI del alumnado

Debajo del nombre de un alumno sale su DNI; si no consta y por edad ya debería tenerlo, sale un
aviso ("FALTA EL DNI (16 años, ya debería tenerlo)").

- La edad obligatoria son 14 años (constante `EDAD_OBLIGATORIA`, Real Decreto 1553/2005, art. 1).
- El DNI sale de `RegAlum.csv`, buscando la columna **por su título** (DNI, NIF, NIE, documento,
  identidad o pasaporte), dejando fuera las columnas de los tutores. Si la descarga no trae
  ninguna columna de documento, no se enseña nada ni se avisa.
- **Aviso**: si no sale el DNI de nadie, la descarga de Séneca no trae esa columna; se arregla
  marcándola al generar el RegAlum, no en la aplicación.

Vive en `js/dni.js`, que no toca ninguna pantalla: envuelve `App.pieAlumno` y
`Datos.destacadosAlumno`, y también `Datos.cargar`, para guardarse la cabecera del CSV
(`r.cabecera`) — **`p.campos` solo trae las columnas que traen algo**, así que para saber si una
columna existe hay que mirar la cabecera, no `p.campos`. Se comprueba con `pruebas/dni.mjs`.

El buscador de alumnado busca también por DNI y por Nº de identificación escolar; el que ya no
está sale en naranja (`App.claseDeResultado`, en `js/asuntos-nuevo.js`); el Nº va solo en el
botón (en el `data-nie` de la fila, que `js/copiar.js` lee de ahí).

### El nombre comercial de las empresas

Columna adicional en el alta. El buscador encuentra al proveedor por cualquiera de los dos
nombres, y por trozos. Debajo del nombre se lee "Rótulo: … · NIF" (`App.pieEmpresa`). **En el
nombre de la carpeta sigue mandando la razón social.** `js/datos.js` lee las columnas por su
título (`porTitulo`), con el sitio de antes como reserva; el fichero se reescribe con la
cabecera nueva la primera vez que se da de alta o se cambia una empresa.

### Cambiar los datos de un tercero

Botón "Cambiar los datos" en la ficha de Personas y empresas: abre el mismo cuadro del alta,
relleno, y guarda encima. **Solo para los dados de alta a mano** (`p.deSeneca !== true`). Si
cambia el nombre, las carpetas de sus asuntos de antes conservan el nombre viejo, y se avisa. El
cuadro es uno solo para alta y cambio: `App.cuadroDeTercero`, en `js/asuntos-nuevo.js`, escribe
`Datos.guardarEnLista`. Vive en `js/archivo-personas.js`, se comprueba con `pruebas/empresas.mjs`.

### Las guías del procedimiento

Cada tipo de asunto puede llevar una lista de pasos, con título y explicación (negrita, viñetas,
enlaces), en el orden del trámite, guardados en `_GESTOR/guias.json`. Dentro de un asunto
abierto los pasos salen con casilla; lo marcado se guarda en `pasosHechos`, lo elegido en
`pasosElegidos`.

Se escriben desde Ajustes y desde la ficha de un asunto abierto. El botón lo pone
`js/ficha-asunto.js`, pero quien guarda es `js/guias-enganche.js`, vía
`window.GuiasDelCentro.escribir(tipo)`. El fichero se relee justo antes de abrir el cuadro.

Al marcar un paso, su explicación se pliega y queda el título tachado en verde; el enlace "ver"
lo vuelve a abrir. Un paso puede ser una PREGUNTA con opciones, cada una con sus propios pasos;
al elegir una, salen solo esos pasos, y la cuenta de arriba suma solo la rama elegida.

- Una bifurcación por paso (las opciones no llevan opciones dentro).
- Las dos ramas se pintan desde el principio y solo se enseña la elegida.
- Los identificadores viajan en el `data-id` del recuadro, no por su posición.
- Al leer el cuadro de escribir la guía, pedir solo los hijos directos (`:scope >`).
- `Guias.cuandoSeElige(fn)` es el único hueco que avisa de que se ha elegido una opción.

Se comprueba con `pruebas/guias.mjs` y `pruebas/opciones.mjs`.

### Los hitos de un asunto

Dentro de un asunto abierto, la guía deja de ser texto que se marca con una casilla y pasa a ser
la lista de **hitos** que se trabaja: cada paso, vivo dentro de ese asunto, con estado (pendiente
· en curso · hecho · no aplica), fecha límite, responsable, notas y documentos apuntados.

- Viven en `_GESTOR/hitos.json` (el duodécimo fichero compartido), no en `asuntos.json`: se leen
  solo al abrir un asunto, al archivarlo y en la pantalla "Qué me toca". Estructura:
  `{ ajustes: { responsables, noLectivos }, porAsunto: { <clave del asunto>: { creados, hitos } } }`.
- **Al crear un asunto**, si su tipo tiene guía, sus pasos se convierten en hitos solos (el id del
  hito es el mismo que el del paso: `origenGuia`), y el primero queda en curso. Un asunto que ya
  existía no los recibe solo: en el sitio de la guía sale el botón "Crear los hitos de la guía",
  que además importa `pasosHechos`/`pasosElegidos` (que se quedan en `asuntos.json` tal cual).
  Tocar los hitos de un asunto nunca cambia la guía del tipo.
- **Bifurcaciones**: un paso-pregunta se convierte en un hito de clase `decision`. Mientras no se
  elige una opción, la lista se corta ahí. Cambiar de rama quita los hitos vacíos de la vieja y
  marca `noaplica` (plegados, al final) los que tenían notas o documentos.
  `Hitos.visibles`/`Hitos.huerfanos` (`js/hitos.js`) son quienes saben qué se ve y qué se pliega.
- **Un solo hito en curso a la vez**: al marcar uno hecho, el siguiente pendiente de la lista
  visible pasa a "en curso" solo (`Hitos.recomputeEnCurso`).
- **Responsable**: persona del centro (configurable en Ajustes › Hitos) o un papel fijo
  (`tercero`, `tutor`, `relacionado`) que la aplicación resuelve sola con datos del asunto
  (`Hitos.resolverResponsable`); sin resolver, se enseña en gris.
- **Plazo**: un paso puede llevar "tantos días hábiles desde que se complete otro paso". Al
  marcarlo hecho, `Plazos.sumarDiasHabiles` (días no lectivos de Ajustes › Hitos incluidos) pone
  sola la fecha límite del siguiente, salvo que Francisco la haya tocado a mano.
- **Estado del asunto**: un paso puede llevar apuntado un estado de `estados.json`; al pasar su
  hito a "en curso", el asunto pasa solo a ese estado. La única función que lo decide es
  `Hitos.estadoDelAsunto` (`js/hitos.js`), para poder cambiar el criterio sin tocar diez sitios.
- **Al archivar**, los hitos salen de `hitos.json` y se escriben, dentro de la carpeta ya
  archivada, como `HISTORIAL DE TRAMITACION.txt` (legible sin la aplicación, sin copiar ningún
  documento; gemelo de `DONDE ESTA ESTE ASUNTO.txt` de `js/relacionados.js`). Si el asunto se
  reabre y el fichero sigue ahí, los hitos se cargan de vuelta a `hitos.json` y el fichero se
  borra.
- Se escriben desde el mismo cuadro de la guía (`Guias.editar`, con tres campos nuevos y
  opcionales por paso: responsable por defecto, estado del asunto y plazo) y se pintan en la
  ficha del asunto **envolviendo** lo que hoy pinta la guía, con un `MutationObserver` sobre
  `#ficha-guia` (no hay ninguna función de `App` que envolver: `pintarGuia` es privada de
  `js/ficha-asunto.js`).
- Vive en `js/hitos.js` y `js/hitos-archivo.js` (el modelo; se parte en dos para no pasar de las
  400 líneas), `js/hitos-panel.js` y `js/hitos-panel-lista.js` (la ficha del asunto: el
  repintado y el bloque de entrada en uno, cómo se pinta cada hito en el otro, hablándose por
  `window.HitosPanel`) y `js/hitos-ajustes.js` (el bloque "Hitos" de Ajustes: responsables y
  días no lectivos).

Se comprueba con `pruebas/hitos.mjs`.

### La pantalla "Qué me toca"

Cruza los hitos `pendiente`/`encurso` de **todos los asuntos abiertos** (nunca archivados), para
no tener que entrar en ellos uno a uno: lee `Hitos.leer()` una vez y `window.Gestor.asuntos()`, y
cruza por la clave del asunto.

- Tres bloques, en este orden: **"En tu tejado"** (responsable `yo`/`companero`, **con** fecha
  límite, ordenados por `Plazos.diasHasta` — los vencidos arriba; el color es el de siempre,
  reutilizando tal cual `Plazos.de`/`.marca-plazo` de `css/plazos.css`, sin inventar otra escala);
  **"Esperando a otros"** (cualquier otro responsable, tenga fecha o no: se ordena por los días
  parado desde `desde`, los más parados arriba); **"Sin fecha"**, plegado con `<details>` — el
  resto: sin fecha límite, o sin un responsable que encaje en los dos bloques de arriba. Cada
  hito visible sale en un solo bloque.
- Cada línea lleva el título del hito, el nombre del asunto y su tercero. Al pulsarla, llama a
  `window.HitosPanel.desplegarAlAbrir(clave, idHito)` —enganche nuevo y pequeño en
  `js/hitos-panel.js`: guarda ese par y, en el siguiente repintado de esa ficha, quita `.oculto`
  al `.hito-cuerpo` de ese hito y hace scroll hasta él— y luego `App.abrirFicha(a, 'abierto')`.
- Filtro por responsable arriba (los de Ajustes › Hitos, no los papeles fijos), recordado en
  `localStorage` (`gestor-que-me-toca-responsable`).
- Entrada en la barra de la izquierda (`js/barra.js`, junto a las de siempre), con la cuenta de
  hitos vencidos al lado; sin número si no hay ninguno.
- Vive entera en `js/que-me-toca.js` (estilos en `css/que-me-toca.css`), con el mismo patrón que
  la pantalla "Duplicados": `App.PANTALLAS.push`, la sección se crea a mano y no está en
  `index.html`, enganchada a `window.Gestor.alRefrescar` para que la cuenta de la barra esté al
  día aunque no se haya visitado la pantalla todavía.

Se comprueba con `pruebas/que-me-toca.mjs`.

### La pantalla se mide a sí misma

`css/vista.css` pone `container-type: inline-size` en `.contenido`: las reglas miran el ancho
real del contenido, no el de la ventana. Bajo 1000px las tres tarjetas sueltan su frase
explicativa; bajo 900 se quita el tablón y la cabecera baja de línea; bajo 620 todo a una
columna. El tope de 1180px de `css/estilos.css` se anula en `css/vista.css`; conservan tope
propio Nuevo asunto (940px) y Ajustes (1600px). Los filtros (estado, plazo, orden) van plegados
en un panel que abre el botón "Filtros", recordado en `gestor-filtros`.

### El tablón de notas rápidas

Columna a la derecha de asuntos abiertos, para lo que aún no es un asunto. Color, autor, fecha y
opcionalmente "para el día X". Botones: Hecha, Cambiar, A asunto y Borrar. Se guarda en
`_GESTOR/tablon.json`. Las notas "Solo para mí" salen únicamente en el tablón de quien las
escribió (no es un secreto: el fichero sigue en la carpeta compartida).

### Los ficheros de datos, sin trabajo manual

Los CSV de Séneca van en `_GESTOR/datos`. Los que aparecen un piso más arriba se recogen solos
(`js/rescate-datos.js`, con `Carpetas.moverFichero`: copia, comprueba el tamaño y solo entonces
borra). El botón "Traer ficheros de Séneca" (`js/traer-datos.js`) guarda el de alumnado siempre
como `RegAlum.csv`; los de personal conservan su nombre.

### De un correo a un asunto

En Gmail, la etiqueta `GESTOR` en un correo lo pone a disposición: un script de Apps Script lo
recoge cada 5 minutos y deja su ficha, el hilo en PDF y los adjuntos en la carpeta
`GESTOR-BANDEJA` de Drive. La aplicación lee esa carpeta y propone tercero, tipo y fecha.
"Leer el correo" abre el PDF del hilo en el panel de la derecha. **Gmail no se deja meter dentro
de otra página.** Cada usuario tiene su propia bandeja.

De cada correo, la tarjeta morada mira en este orden:

1. **La huella del hilo.** Si el `id` del hilo ya está en el `hilos` de algún asunto, la tarjeta
   dice "Respuesta de <asunto>" y su botón principal es "Guardar en ese asunto". La huella manda
   sobre todo lo demás.
2. **El texto del asunto.** Si el asunto del correo (sin `Re:`/`RV:`/`Fwd:`) lleva dentro el
   nombre de un asunto de `asuntos.json`, con al menos 12 letras por los dos lados, también se
   ofrece guardarlo ahí.
3. **Nada.** Entonces el botón principal es "Crear el asunto".

En los tres casos hay además un botón **"Elegir asunto"** (`js/bandeja-enlace.js`), que abre el
cuadro compartido de `js/elegir-asunto.js` (ver "El cuadro de elegir asunto", más abajo). Si el
elegido está archivado se ofrece "Reabrir y guardar aquí" o "Guardar sin reabrir". **Nunca se
guarda nada solo: siempre hay que pulsar.**

La puntuación de parecido de un correo suma: +50 si una dirección del correo es la del tercero
del asunto o de uno de sus relacionados, +40 si el nombre del tercero aparece escrito en el
correo, +10 por cada palabra de cuatro letras o más del asunto del correo que esté en el nombre
del asunto, +15 si el asunto está abierto y +10 si se movió en los últimos 30 días. Se enseñan
los que pasen de 40 puntos.

#### `hilos`, en la ficha del asunto

Al guardar un correo en un asunto —por el camino que sea— se apunta la huella en su ficha de
`_GESTOR/asuntos.json`:

    hilos: [ { id: "<id del hilo de Gmail>", asunto: "<asunto limpio, en minúsculas>", visto: 2 } ]

`visto` es cuántos mensajes tenía el hilo al guardar. Si el `id` ya estaba, se actualiza `visto`
en vez de añadir otra entrada. Un asunto puede tener varios hilos; un hilo pertenece a un solo
asunto (al cambiarlo de asunto, el `id` se quita del viejo). `hilos` **es opcional**: los asuntos
de antes del 16-sep-2026 no lo tienen y todo funciona igual. Se escribe con `App.anotar`, que
relee el fichero antes y guarda con `Copias.guardar`.

#### `seguidos.json`, para el recolector

Cada vez que cambia una huella, la aplicación reescribe entero `seguidos.json` en la carpeta de
la bandeja: `{ "hilos": [ { "id": ..., "visto": ..., "asunto": ... } ] }`. En cada pasada, el
script de Apps Script hace lo de siempre con la etiqueta `GESTOR` y **después** lee ese fichero,
abre cada hilo con `GmailApp.getThreadById` y, si tiene más mensajes que `visto`, lo recoge otra
vez. Así vuelven a la bandeja las respuestas del tercero y también los correos que manda
Francisco desde Gmail. Si el hilo ya no existe, se salta sin fallar; si `seguidos.json` no está o
está roto, el script sigue con su trabajo normal.

Esas fichas traen dos campos más: `respuestaDe` (el `id` del hilo) y `enviado: true` cuando el
último mensaje lo mandó el propio usuario, que es lo que hace que la tarjeta diga "Lo enviaste
tú".

#### Qué entra en la carpeta del asunto

- `AAMMDD CORREO <asunto recortado>.pdf` — el mensaje nuevo, él solo (campo `pdfMensaje`).
- `AAMMDD HILO <asunto recortado>.pdf` — el hilo entero (campo `pdf`). **Se sustituye**: el
  anterior del mismo hilo va a la papelera, no se acumulan copias del hilo completo.
- `AAMMDD ADJUNTO <nombre>` — cada documento adjunto.

En un hilo de un solo mensaje no hay `pdf`: ese PDF entra ya como `CORREO`. La ficha del asunto
reconoce los tres por su nombre (`DE_CORREO`, en `js/ficha-asunto.js`) y los enseña en el grupo
"Llegados por correo".

El script vive en `apps-script/gestor-correos.gs`, pero **Apps Script no se despliega desde
aquí**: Francisco lo pega a mano en `script.google.com` (las tres primeras líneas del fichero
dicen cómo).

### El correo y la mensajería de Séneca

Botones "Correo" y "Mensaje Séneca" en la ficha del asunto (`js/correo.js`). La aplicación **no
envía nada**: prepara los campos y los deja listos. Al copiar el texto o abrir la ventana de
redactar se apunta sola una nota (una sola vez por cuadro). Solo Séneca: no hay campo Para, y un
solo botón que se va cambiando: "1. Copiar el asunto" → "2. Ahora, copiar el texto" → "Copiado.
Pégalo y envía".

### Mandar los documentos de un asunto por correo

Gmail no deja que una página web le enganche ficheros. Bloque **"Documentos de este asunto"**
(`js/correo-adjuntos.js`, `window.CorreoAdjuntos`), solo en el cuadro de Correo (nunca en el de
Séneca): la lista de ficheros del asunto con una casilla cada uno (desmarcadas de partida) y el
botón **"Preparar borrador con los documentos"**.

- Al pulsar, se copian los documentos marcados a `GESTOR-BANDEJA` con el nombre `<id> -
  <nombre original>` y, **el último**, el encargo `<id>.envio.json` (`para`, `asunto`, `cuerpo`,
  `adjuntos`, `hilo` —de `hilos` en la ficha del asunto si lo tiene, si no cadena vacía— y
  `asuntoCarpeta`). Si lo marcado suma más de **20 MB**, no se prepara nada y sale un aviso.
- Se apunta también en `_GESTOR/envios.json` (una lista, no un objeto como los demás ficheros de
  `_GESTOR`), para que la tarjeta **"Borrador en camino — \<asunto\>"** se vea aunque se cierre
  el cuadro. Se relee antes de escribir, con `Copias.guardar`.
- **La vigilancia y la tarjeta viven en `js/bandeja-correos.js`** (no en `js/correo-adjuntos.js`):
  cada 15 segundos, y solo mientras haya algún encargo vivo, mira si ha aparecido `<id>.listo.json`
  (pasa a botón "Abrir el borrador en Gmail") o `<id>.error.json` (aviso rojo con el motivo y
  botón "Entendido"); pasados 3 minutos sin respuesta, aviso ámbar y botón "Dejarlo" (borra el
  `.envio.json` y sus copias de la bandeja, y el encargo de `envios.json`). `window.Bandeja`
  expone `carpeta()` (la misma carpeta de los correos recogidos) y `avisarEnvioNuevo()`, para que
  la tarjeta no espere a la próxima vuelta de 15 segundos.
- `js/bandeja-correos.js` **no lee un `.envio.json`, `.listo.json` ni `.error.json` como si fuera
  un correo recogido**: se descartan antes de mirar el `.id` de dentro.
- El rastro reutiliza `apuntarElRastro` de `js/correo.js`: si se ha preparado un borrador con
  documentos en este cuadro, la nota añade "· con N documentos: …".
- **Siempre borrador, nunca envío automático.** El script de Apps Script
  (`apps-script/gestor-correos.gs`, `mandarBorradores()`) lo monta con `GmailApp.createDraft` o,
  si el encargo trae `hilo`, con `createDraftReply`, y pasa a revisar cada **minuto** (antes,
  cinco). El enlace que deja en `.listo.json` es siempre la lista de borradores
  (`#drafts`), nunca uno construido con el identificador del borrador.

Se comprueba con `pruebas/envios.mjs`.

### Plantillas de correo y de mensaje de Séneca

Una plantilla es **solo el cuerpo del medio**: el saludo y la despedida los sigue poniendo
`js/correo.js`, solos. La misma plantilla sirve para el correo y para el mensaje de Séneca; se
crean en Ajustes, pegadas a un tipo de asunto, y se guardan en `_GESTOR/plantillas.json`
(`js/plantillas.js`, `window.Plantillas`), compartido con el compañero.

- **El fichero**: `{ firma, centro, lista: [{ id, tipo, categoria, nombre, texto }] }`. `firma` y
  `centro` sustituyen a lo que hasta el 16-sep-2026 estaba escrito a mano en `js/correo.js` (la
  constante `CENTRO` y el `'Un saludo.'` de `cuerpoDelCorreo`); si el fichero no existe, sale eso
  mismo de partida y se crea de verdad al primer guardado. **Se relee cada vez que se abre el
  cuadro de Correo, sin caché entre aperturas**: es un fichero compartido, y releerlo una vez por
  cuadro no cuesta nada.
- **Los huecos**, entre llaves: `{nombre}` (el tercero sin su número ni su NIF), `{grupo}`,
  `{curso}`, `{tipo}`, `{hoy}`, `{limite}`, `{usuario}` (`App.E.usuario`), `{centro}`, y
  `{campo:LO QUE SEA}` para un campo propio del tipo (por su nombre, buscado con `Campos.
  nombreDeCampo` sobre `App.E.campos.porTipo`). `Plantillas.rellenar(texto, valores)` los
  sustituye: uno sin valor se deja **vacío** (nunca se escribe `{grupo}` en lo que le llega al
  tercero) y se apunta en la lista de "faltan"; uno que no se reconozca se deja tal cual, también
  apuntado, para que un hueco mal escrito no rompa nada. Las llaves se comparan con
  `U.normalizar` (sin mayúsculas ni acentos), nunca al sustituir.
- **En el cuadro de Correo y en el de Séneca** (los dos, `js/correo.js`): un desplegable
  "Plantilla" encima del cuerpo, dentro de `camposComunes`/`interiorDeComunes`, en su propio
  `#correo-comunes` para poder repintarse solo sin tocar el "Para" ni los documentos. Con una
  plantilla, sale puesta; con varias, sale la primera; sin ninguna, el desplegable no se pinta y
  el cuerpo sale como siempre. Encima del cuerpo, si falta algún dato, un aviso ámbar "Faltan
  datos: …". **Cambiar de plantilla con algo escrito a mano pregunta antes de pisarlo — en línea,
  dentro del propio cuadro (`#correo-plantilla-confirmar`), nunca con un segundo `U.preguntar`**:
  solo hay un cuadro de diálogo en toda la aplicación, y este ya está ocupado por el de Correo.
  En Séneca, al copiar el texto (paso 2 de `engancharSeneca`) se recorta a **4.000 letras** si
  hace falta, avisando en una línea.
- **En Ajustes**, bloque propio "Plantillas de correo" (vive entero en `js/plantillas.js`, no
  toca `js/ajustes.js`, que ya pasa de 47 KB: se engancha solo con `window.Gestor.alRefrescar`,
  igual que `js/bandeja-correos.js` y `js/unir-asuntos.js`). Lista con buscador cruzado, alta y
  edición en un `U.preguntar` con botones para insertar cada hueco en el cursor y una vista previa
  en vivo (con el primer asunto abierto de ese tipo, o datos de muestra si no hay ninguno).
  Bloque aparte para la firma y el centro. **El borrado pasa por `Papelera.mandarDato` para dejar
  rastro, pero `js/papelera.js` no sabe devolver la clase `'plantilla'`** (no estaba en la lista
  de ficheros del encargo): cae en su "No sé devolver esto." Si hace falta devolver una borrada,
  hay que copiarla a mano desde el bloque Papelera de Ajustes.

Se comprueba con `pruebas/plantillas.mjs`. El bloque de pantalla vive en `js/plantillas-ajustes.js`
(se sacó de `js/plantillas.js` el 16-sep-2026, al crecer con el motor de las plantillas de
documento, para no pasar de 450 líneas): usa la API pública de `Plantillas` (`cargar`, `guardar`,
`deTipo`, `idNuevo`, `rellenar`, `HUECOS`...), no toca nada privado.

### Plantillas de documento de Word

El gemelo en papel de las de correo (16-sep-2026, `docs/PLANTILLAS-DE-DOCUMENTO.md`, fila 17 de
`docs/COLA.md`): un botón **Generar documento** en la ficha de un asunto saca una copia de un
`.docx` con los huecos rellenos, ya guardada en la carpeta del asunto, sin preguntar nada.

- **El fichero**: mismo `_GESTOR/plantillas.json` que las de correo, con la clave de raíz nueva
  `documentos`: `[{ id, categoria, tipo, nombre, fichero, tipoDocumento, texto }]`. Una misma
  plantilla puede colgar de varios tipos, cada uno con su propia fila. `limpio()` la normaliza
  como la `lista` de correo: un fichero viejo sin esa clave sigue cargando con `documentos: []`.
  Junto a `firma` y `centro` se guardan cuatro claves de raíz más, editables en el mismo bloque de
  Ajustes de "Plantillas de correo": `localidad`, `direccion`, `codigo`, `cargo` (del centro).
- **Los `.docx` viven en `_GESTOR/PLANTILLAS`**, sin subcarpetas, dentro de la carpeta de asuntos
  abiertos (`Carpetas.crear(App.E.gestor, 'PLANTILLAS')`, que la crea si no existe). Francisco los
  sube a mano a esa carpeta de Dropbox; la aplicación nunca escribe ahí, solo lee y cuelga el
  nombre del fichero de un tipo en Ajustes. No es ninguno de los doce ficheros compartidos: no
  lleva copia de seguridad ni detección de fichero roto.
- **`Plantillas.valoresDeAsunto(asunto)`** (`js/plantillas.js`), pública desde el 16-sep-2026:
  hasta entonces era `valoresDePlantilla()`, privada de `js/correo.js`, y solo traía lo que hacía
  falta para el correo. Ahora es async (el DNI, los tutores y el registro salen de ficheros) y
  monta, con un solo argumento, todos los huecos del catálogo (`Plantillas.HUECOS`, ampliado):
  `nombre`, `nombreNatural` (en orden normal, sin el código pegado), `grupo`, `curso`, `tipo`,
  `referencia` (Nº escolar en alumnado, cuatro cifras del documento en personal, NIF en empresas,
  el campo "Referencia" en otros), `dni` (solo alumnado, con `window.Dni.de`), `telefono`,
  `correo`, `tutor1`/`tutor1telefono`/`tutor1correo`, `tutor2`/... (solo alumnado, buscando por el
  título de la columna como `js/dni.js`, nunca por su posición ni desde `persona.campos` para
  saber si existe), `descripcion`, `estado`, `registro` (el código `26EM1234` del documento más
  reciente de la carpeta que ya lo lleve en el nombre, sin depender de `js/documentos.js`), `hoy`,
  `hoyLargo` ("16 de septiembre de 2026"), `lugarYFecha` ("En Alhaurín el Grande, a..."), `limite`,
  `usuario`, `centro`, `localidad`, `direccionCentro`, `codigoCentro`, `cargo` y `firma` (el texto
  de la firma del centro, ya relleno con el resto de estos mismos valores). `js/correo.js`
  (`abrirCuadro`) la llama una vez por apertura del cuadro, junto a `Plantillas.cargar`, y guarda
  el resultado en `valoresActuales`; `cuerpoDelMedio` y `textoDeLaFirma` lo usan en vez de tener
  su propia función de valores (`valoresDePlantilla`/`camposDelAsunto`, que ya no existen).
- **`js/docx.js`** (`window.Docx`, sin librerías ni CDN): un `.docx` es un ZIP, leído y escrito a
  mano. `Docx.rellenar(bufferDocx, valores)` -> `{ blob, faltan }` (acepta `ArrayBuffer` o
  `Uint8Array`). Lee el directorio central (buscado desde el final del fichero, que es el único
  sitio fiable) y, por cada entrada: si no es `word/document.xml` ni `word/header*.xml` /
  `word/footer*.xml`, la copia tal cual (cabecera local + bytes, sin descomprimir), y en el
  directorio central copia también su entrada, solo parcheando el offset. Las que sí tocan se
  descomprimen con `DecompressionStream('deflate-raw')` si hace falta (método 8; si ya vienen
  "almacenadas", método 0, no hace falta), se reparan y sustituyen, y se escriben **sin comprimir**
  (método 0): mismo tamaño comprimido que sin comprimir, y CRC-32 calculado a mano (tabla con el
  polinomio `0xEDB88320`). No hace falta `CompressionStream` para nada.
  - **La reparación de huecos partidos**: por cada `<w:p>...</w:p>`, se localizan sus `<w:t>` en
    orden y, si un hueco (`{...}`) cruza de uno al siguiente, se mueven solo los caracteres que
    forman el hueco hasta dejarlo entero en uno de ellos — nunca se funden todos los `<w:t>` del
    párrafo en uno, que perdería la negrita o el subrayado de las palabras que no son parte de
    ningún hueco. Hecho esto, cada `<w:t>` (toque o no un hueco) se decodifica de entidades XML, se
    pasa por `Plantillas.rellenar`, y se vuelve a escapar (`&`, `<`, `>`; las comillas de un texto
    normal no hace falta escaparlas). Un salto de línea en el valor sustituido se escribe
    `</w:t><w:br/><w:t xml:space="preserve">`.
  - Simplificación consciente: no contempla los "data descriptors" del ZIP (banderas con el
    tamaño después de los datos, típico de escritores en flujo): un `.docx` de verdad, escrito por
    Word, LibreOffice o cualquier librería que genere ficheros, siempre lleva el tamaño y el CRC
    en la propia cabecera local.
  - `Docx.leerEntradaDeTexto(bufferDocx, nombre)` (solo para depurar y para las pruebas): lee y
    descomprime una entrada de texto ya generada, reutilizando el mismo lector.
- **`js/plantillas-documento.js`**: el botón **Generar documento**, puesto en `#ficha-acciones`
  con el mismo patrón que `js/correo.js` (se envuelve `App.abrirFicha` y se vigila la pantalla con
  un `MutationObserver`). No sale si el tipo no tiene ninguna plantilla de documento; con una sola,
  un clic y a generar; con varias, un cuadro para elegir (como `Relacionados.elegirTercero`: se
  pinta dentro de `#capa`, sin `U.preguntar`, porque aquí se elige pulsando una de la lista, no
  aceptando). Comprobar si el tipo tiene plantillas es async (hay que leer `plantillas.json`), así
  que el botón puede salir un instante después que el resto de la ficha.
  - **Al generar**: lee el `.docx` de `_GESTOR/PLANTILLAS` (si no está, avisa con su nombre y
    para); `Plantillas.valoresDeAsunto(asunto)` + `Docx.rellenar`; monta el nombre con
    `Nombres.montarDocumento` (`tipoDocumento` y `texto` de la plantilla, fecha de hoy, extensión
    `.docx`; se vigila `App.LARGO_MAXIMO_NOMBRE`); si ya hay un fichero con ese nombre en la
    carpeta, avisa y no lo pisa; si no, lo guarda (`getFileHandle`/`createWritable`, como
    `Carpetas.escribirTexto` pero con un `Blob`) y deja una nota en el asunto con `Notas.anadir`
    ("Generado &lt;nombre&gt;"); avisa de los huecos sin datos, sin impedir nada; y vuelve a
    abrir la ficha para refrescar la lista de documentos.
  - **En Ajustes**, bloque hermano **"Plantillas de documento"**: buscador, tarjetas por tipo,
    alta/edición/borrado con `Papelera.botonBorrar` (clase `'plantilla-documento'`, que
    `js/papelera.js` tampoco sabe devolver, igual que `'plantilla'`). En el alta se elige el
    `.docx` de un desplegable con los que ya haya en `_GESTOR/PLANTILLAS` (Francisco los sube a
    mano; el cuadro nunca escribe ahí), y se escriben el nombre visible, el tipo de documento y el
    texto adicional. Debajo, la lista de `Plantillas.HUECOS` con un botón de copiar en cada uno.

Se comprueba con `pruebas/plantillas-documento.mjs` (jsdom, sin navegador: construye un `.docx` de
mentira a mano, con su propio escritor de ZIP, independiente del de `js/docx.js`).

### Registrar un documento en un paso

Botón **Registrar**, en cada documento que aún no lleve las cuatro piezas del registro en su
nombre (en "Gestionar documentos" y en la ficha del asunto). Al pulsarlo se elige la copia
sellada, y solo se pide el número de registro: el resto del nombre (fecha, tipo, texto
adicional) se lee del documento original (`Documentos.leerNombre`). El nombre se monta con
`Nombres.montarDocumento`, la copia se guarda con `Carpetas.copiarFicheroEn`, el original se
queda como está, y se anota una nota en el asunto ("Registrado 26EM1234 · <documento>"). Si ya
hay un fichero con ese nombre, avisa y no lo sobrescribe.

Casilla "Pendiente de registro" en el cuadro de nombrar un documento (solo si aún no lleva
registro); lo marcado se guarda en `pendientesRegistro`, en la ficha del asunto. Un pendiente
lleva marca ámbar "Sin registrar" y su botón Registrar sale destacado; al registrarlo se quita
solo de la lista, y al renombrarlo desde "Gestionar documentos" se actualiza con él.

**La tarjeta del asunto no lleva nada de esto** (ver `BOTONES_DE_LA_TARJETA`). Vive en
`js/registro.js`: "Gestionar documentos" ya tiene su `U.preguntar` abierto y pinta dentro
(`Registro.pintarEnContenedor`); la ficha del asunto no tiene cuadro abierto y abre uno nuevo
(`Registro.abrirCuadro`). **Solo hay un cuadro de diálogo en toda la aplicación**: abrir un
segundo `U.preguntar` mientras el primero espera le roba los botones al de fuera, que se queda
colgado. `Registro.proponer({ anio, tipo, serie, numero })` rellena las cuatro piezas (`tipo` es
E/S, `serie` es M/A).

**Lectura del número del sello de Séneca, dentro del PDF.** El sello va como texto en la primera
página, aunque el documento sea un escaneado, con este formato tal cual:

    2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02

`AÑO / CÓDIGO DEL CENTRO / SERIE + número con ceros por delante`, pegado a `ENTRADA`/`SALIDA`,
pegado a `Fecha: dd/mm/aaaa hh:mm:ss`.

- `js/registro-lector.js` lee el texto de la primera página con **pdf.js** (Mozilla) y lo busca
  con `(\d{4})\s*\/\s*\d+\s*\/\s*([MA])\s*0*(\d+)\s*(ENTRADA|SALIDA)`, tolerante a espacios y
  saltos de línea. Si el número tiene más de cuatro cifras se deja entero y se avisa; si no, se
  rellena con ceros por delante hasta cuatro.
- Si se encuentra el sello, el cuadro de Registrar sale relleno, con una línea verde "Leído del
  sello de Séneca", y el foco va directo al botón de aceptar. Si no, el cuadro sale vacío, con el
  foco en los cuatro dígitos.
- **Ojo con el foco**: `js/usabilidad.js` vigila la apertura del cuadro (`#capa`) y pone el
  cursor en su primer campo con un `MutationObserver`, que se dispara después del código que
  abre el cuadro y pisaría cualquier `.focus()` puesto ahí mismo. El foco de Registrar se pone
  con `setTimeout(fn, 0)`.
- La fecha del sello no cambia la fecha `AAMMDD` del nombre (la del propio documento); se guarda
  en la nota ("Registrado 26EM0368 el 10/09/2026 · <documento>").
- **pdf.js va copiado en el repositorio**, en `js/lib/pdf.min.js` y `js/lib/pdf.worker.min.js`
  (versión 3.11.174, del `build/` de `pdfjs-dist`, no de `legacy/`). No se carga de ninguna
  dirección externa, y solo se trae la primera vez que se pulsa Registrar sobre un PDF.

Se comprueba con `pruebas/registro.mjs` (con un PDF mínimo montado por la propia prueba, con el
texto del sello dentro: el PDF real con datos personales no está en el repositorio).

### Terceros relacionados con un asunto

Un asunto puede afectar a más de una persona o entidad, además de su tercero principal.

- Bloque "Personas y entidades relacionadas" en la ficha del asunto (`js/ficha-asunto.js`), al
  lado de "Otros asuntos de este tercero". Solo ahí (nada en la tarjeta de la lista).
- Se guarda en `asuntos.json`: `ficha.relacionados`, lista de `{ categoria, nombre }`. Una ficha
  sin `relacionados` simplemente no tiene ninguno.
- Para elegir o dar de alta el relacionado se reutiliza `App.textoTercero` (reglas de nombres de
  `CONTEXTO-CORTO.md`), `App.cuadroDeTercero` y `Datos.anadirALista`, con la guardia de
  duplicados de siempre. El buscador de "Nuevo asunto" está sacado a `App.pintarBuscadorDeTercero`
  (categoría + buscador + resultados + alta), en `js/asuntos-nuevo.js`, para reutilizarlo aquí.
- **Nunca se copia ningún documento del asunto.** Al archivar, si tiene relacionados, se
  pregunta a cuáles avisar (todos marcados por defecto) y, en la carpeta de cada uno dentro de
  ARCHIVO (se crea si no existe), se deja una carpeta `(RELACIONADO) <nombre del asunto>` con un
  único fichero `DONDE ESTA ESTE ASUNTO.txt`. Al reabrir, esa carpeta-nota se borra sola; si
  tiene algo más dentro, no se borra, y avisa.
- Esas carpetas-nota viven al mismo nivel que un asunto de verdad (`ARCHIVO / categoría /
  tercero / carpeta`): `App.verArchivo` y `Duplicados.delTercero` las filtran por su prefijo
  (`(RELACIONADO) `).
- La ficha de la persona (`App.verFicha`, en `js/archivo-personas.js`) enseña un bloque
  "Relacionado con este asunto" cuando aparece como relacionada de alguno, mirando
  `App.E.registro.asuntos` directamente.
- **Copiar el nombre en orden normal.** Cada relacionado lleva un botón "Copiar"
  (`Relacionados.nombreEnOrdenNormal`) que copia su nombre tal como se escribe a mano, no como se
  guarda: de alumnado y personal quita el código pegado al final (el Nº escolar o las cuatro
  cifras del documento — siempre en mayúsculas, nunca como lleva un nombre de pila) y da la
  vuelta a "Apellidos, Nombre"; en empresas copia la razón social tal cual, sin darle la vuelta.
- Vive en `js/relacionados.js`, cargado después de `js/duplicados.js` (envuelve
  `Duplicados.delTercero`) y de `js/archivo-personas.js` (envuelve `App.verFicha` y
  `App.verArchivo`).

Se comprueba con `pruebas/relacionados.mjs`.

### Los campos de cada tipo de asunto

Cada tipo de asunto puede llevar sus propios campos: datos ya presentes en los ficheros (unidad,
modalidad, puesto, NIF...) o creados a mano, que salen solos y ya rellenos al crear el asunto.

- **Catálogo por categoría** (`js/campos.js`, `Campos.catalogoDeCategoria`):
  - **De fichero**: la cabecera del CSV de la categoría (no `p.campos`, que solo trae columnas
    con datos). `Datos.cargarLista` (`js/datos.js`) devuelve `.cabecera` para las cuatro
    categorías.
  - **Calculados**: por ahora uno, Curso (`Campos.calcularCurso`), la unidad sin su última letra
    ni el espacio que deja al quitarla (`1ºA`→`1º`, `1ºBachA`→`1ºBach`, `2ºFPB B`→`2ºFPB`),
    aplicado sobre la forma compacta del grupo (`Nombres.grupoCompacto`).
  - **Propios**: creados en Ajustes (texto libre o lista cerrada), válidos para cualquier
    categoría; pasan por la guardia de duplicados (quinta puerta).
- **Se guarda** en `_GESTOR/campos.json`: `propios` (con su clase y valores) y `porTipo`
  (indexado como `tipos.json`), que solo guarda `origen`, `columna` o `id`, `obligatorio` y
  `enNombre` — **no** copia clase ni valores de un campo propio: quien lo pinta
  (`js/asuntos-nuevo.js`, `js/asuntos-editar.js`) lo busca en `propios` con `Campos.propioDe`,
  así un cambio en los valores se ve en todos los tipos que lo usan.
- **Configurar los campos de un tipo**: en Ajustes, botón "Campos" por tipo
  (`App.abrirCamposDeTipo`), con los ya puestos arriba (flechas para ordenar, casillas
  Obligatorio y Añadir al nombre) y el catálogo abajo, con buscador. Un campo nuevo del catálogo
  nace con las dos casillas sin marcar. Bloque "Campos propios" para verlos y borrarlos todos
  juntos; al borrar uno en uso, avisa y dice en qué tipos está (`Campos.tiposQueUsanPropio`).
- **Al crear un asunto**: bloque "Datos del asunto" con los campos del tipo ya rellenos
  (`Campos.valorInicial`); un dato vacío no es un error, sale en blanco y se puede escribir a
  mano. Obligatorio bloquea hasta rellenar. La vista previa del nombre se actualiza al escribir.
- **Al editar** (`App.pintarCamposEditar`): mismos campos con lo guardado; si cambia algo que va
  al nombre, la carpeta se renombra. El cuadro lleva la clase `cuadro-alto` (scroll interno).
- **En la ficha del asunto**: los campos con valor salen entre la descripción y el estado.
- Un tipo sin campos configurados se comporta igual que antes de esto; los asuntos creados antes
  se quedan sin campos.
- La clave de un campo es `fichero:<columna>` o `<origen>:<id>` (`Campos.claveDeCampo`).

Se comprueba con `pruebas/campos.mjs` (ocho escenarios más la edición).

### Que no se dupliquen los asuntos

- **Al crear un asunto** (`js/duplicados.js`, el `onclick` de `btn-crear` envuelto): si ya hay
  uno abierto o archivado del mismo tercero, mismo tipo y mismo año académico (el grupo y el
  texto libre **no cuentan**), se para del todo: cuadro "Este asunto ya existe", con "Abrir el
  que ya existe" (a la ficha si está abierto, o a su carpeta del ARCHIVO si está archivado) o
  "Crear otro de todas formas". Si a alguno de los dos le falta el año académico, cuenta como
  coincidencia (`Duplicados.coincideCurso`).
  - Con varios candidatos abiertos, el de partida es el más reciente
    (`Duplicados.candidatoMasReciente`).
  - Todo envuelto en `try/catch`: **la comprobación nunca debe impedir crear un asunto**; si
    falla al mirar, se sigue como si no hubiera nada.
- **Unir dos que ya existen** (`js/unir-asuntos.js`), desde la pantalla propia "Duplicados" (ver
  más abajo): se elige cuál se queda (de partida, el de nombre más largo); los ficheros del otro
  se mueven a la carpeta que se queda, las notas se juntan (con una nota de la unión al final),
  los pasos de la guía se copian del que se queda si no tenía, y la carpeta que se va se borra.
  Si algún fichero choca de nombre entre las dos carpetas, no se mueve ni se borra nada, y avisa
  de cuáles.
- Vive en `js/duplicados.js` (la parada al crear) y `js/unir-asuntos.js` (unir), cargado justo
  después de `js/asuntos-lista.js` (define `App.pintarAbiertos`).

Se comprueba con `pruebas/duplicados.mjs`.

### La pantalla propia "Duplicados"

- Aviso de una línea junto al botón Actualizar de Asuntos abiertos: `⚠ N posible(s)
  duplicado(s) — Revisar` (`#btn-duplicados`, oculto sin ninguno).
- Pantalla propia "Duplicados" (no está en la barra lateral), con botón Volver. Cada grupo en
  columnas: nombre de la carpeta (enlaza a su ficha), fecha de apertura / estado / vía / fecha
  límite, documentos (se abren con `Visor.abrir`) y las tres últimas notas ("y N más" si hay
  más).
- Botón Unir, igual que siempre.
- Botón "No son el mismo": descarta el grupo por la firma exacta de sus nombres (ordenados y
  unidos) en `_GESTOR/no-duplicados.json`. Si el grupo cambia de miembros, la firma deja de
  coincidir y el aviso vuelve a salir solo.
- Reversible en Ajustes: bloque "Duplicados descartados", con "Volver a avisar" por entrada.
- Vive entero en `js/unir-asuntos.js` (estilos en `css/unir-asuntos.css`), sin tocar
  `js/ajustes.js` ni la barra: la pantalla y el bloque de Ajustes los crea el propio módulo
  (`App.PANTALLAS.push`, enganchado con `window.Gestor.alRefrescar`).
- `no-duplicados.json` entra en las copias de seguridad de `js/copias.js`.

Se comprueba con `pruebas/duplicados.mjs`.

### Ajustes ágiles: tipos, estados y tipos de documento

**Bloque "Tipos de asunto"** (`js/ajustes.js`, `css/ajustes.css`):

- **Una sola categoría a la vez.** `#tabla-tipos` obedece al desplegable `#nueva-categoria`, se
  recuerda en `localStorage` (`gestor-ajustes-categoria`). Estado en `App.E.categoriaAjustes`,
  se cambia con `App.cambiarCategoriaAjustes(cat)` (sincroniza desplegable y pestañas).
- **Cuatro pestañas** (`App.pintarPestanasTipos`): ALUMNADO · PERSONAL · EMPRESAS · OTROS, con
  su cuenta; pestaña y desplegable van siempre de acuerdo.
- **Buscador cruzado** (`#buscar-tipos`): con dos letras o más, `App.pintarTiposAjustes` mira
  las cuatro categorías a la vez, cada resultado con su etiqueta (`.marca-categoria`). Mientras
  se busca, las pestañas se apagan (`.apagadas`) y sale "Buscando en todas las categorías · N
  resultados" (`#tipos-buscando-info`).
- **Aviso en vivo** al escribir un nombre nuevo (`App.pintarAvisoNuevoTipo`, `oninput` de
  `#nuevo-tipo`, sobre `U.parecidos`/`U.dejaCrear`): si ya existe, línea roja "Ya existe: X, en
  CATEGORIA", botón Añadir apagado y enlace "Verlo" (`App.verTipoEnAjustes`) que cambia de
  categoría y destella la tarjeta; si solo se parece, línea ámbar con los parecidos, sin apagar
  el botón. Igual, más simple, para estados (`#aviso-nuevo-estado`) y tipos de documento
  (`#aviso-nuevo-tipo-doc`), con `App.pintarAvisoSimple`.
- **Rejilla de tarjetas**, no filas: `#tabla-tipos`, `#tabla-estados` y `#tabla-tipos-documento`
  son `.rejilla-tipos` de tarjetas `.tarjeta-tipo` (`grid-template-columns:
  repeat(auto-fill,minmax(300px,1fr))`), cada una con un menú de tres puntos
  (`App.botonMenuTarjeta`): Campos / Cambiar el nombre / Quitar (tipos), Cambiar el nombre /
  Quitar (estados, que conservan sus flechas de orden fuera del menú), Quitar (tipos de
  documento). Quitar siempre pide confirmación.
- Ajustes sube su tope a 1600px (`#pantalla-ajustes`, `css/vista.css`); Nuevo asunto conserva
  940px. Los párrafos de explicación no pasan de 90 caracteres (`max-width: 90ch`).

**Llegar a Ajustes sin bajar la página**: la barra lateral queda fija (`position:fixed`, con su
propio `overflow-y:auto`); Ajustes va en la lista de pestañas, tras "Personas y empresas",
separado por `.separador-lateral`; con la barra plegada, el icono de rueda dentada
(`#btn-barra-ajustes`, `js/barra.js`) lleva directo a Ajustes.

Se comprueba con `pruebas/ajustes-agil.mjs`, a 1905 píxeles.

### El cuadro de elegir asunto, y "Por clasificar"

El cuadro para escoger un asunto a mano vive en **`js/elegir-asunto.js`** (`window.ElegirAsunto`)
y lo usan dos sitios: la bandeja de correos ("Elegir asunto") y "Por clasificar" ("Meter en un
asunto"). Se carga antes que `js/documentos-sueltos.js`, `js/bandeja-enlace.js` y
`js/papelera.js`.

- `elegir({titulo, cabecera, sugeridos})` monta el cuadro sobre `#capa`, con "Podrían encajar"
  arriba (solo si hay) y "Todos los asuntos" debajo, con buscador (`#enlace-buscar`,
  `#enlace-todos`), abiertos primero y archivados después con su etiqueta. Devuelve
  `{nombre, ficha}` o `null`. **La puntuación no se calcula aquí**: cada sitio mide su propio
  parecido y le pasa `sugeridos` ya hecho, porque de un correo se sabe mucho más que del nombre
  de un fichero.
- `preguntarSiReabrir(elAsunto, {explica, reabrir, sinReabrir})` es el cuadro de "Ese asunto
  está archivado", con los textos de cada sitio. Se abre cuando el otro ya está cerrado.
- Piezas comunes de puntuación: `trozosDelTercero`, `terceroDentroDe`, `puntosPorPalabras`,
  `puntosDeBase` (+15 abierto, +10 movido en 30 días), `mejores` (los que pasan de 40 puntos,
  como mucho cinco). Y `carpetaDelAsunto(nombre, ficha)`, que baja al ARCHIVO si está archivado.

**"Meter en un asunto"** (`App.meterSueltoEnAsunto`, en `js/documentos-sueltos.js`) es el tercer
botón de cada tarjeta de "Por clasificar", entre "Crear asunto con él" y "Borrar" (este último
se lo pone `js/papelera.js` por envoltura). Su puntuación solo tiene el nombre del fichero: +10
por cada palabra de cuatro letras o más (sin extensión, sin la fecha AAMMDD de delante y sin el
código de registro) que esté en el nombre del asunto, +40 si el nombre del tercero del asunto
sale en el nombre del fichero, +15 abierto y +10 movido hace poco.

El traslado (`App.llevarSueltoA`) usa `Carpetas.moverFichero`, que copia, comprueba que la copia
pesa lo mismo y solo entonces borra: en Dropbox el `move()` del navegador no vale. Si ya hay un
fichero con ese nombre en el destino **no se pisa**; si la ruta pasa de
`App.LARGO_MAXIMO_NOMBRE` (180) se avisa y se deja decidir; si el traslado falla, el documento
sigue en "Por clasificar" y se dice con una línea. Si sale bien, se abre el cuadro de ponerle
nombre (`App.verDocumentos`), igual que al crear un asunto con un documento. Si el asunto
elegido está archivado se ofrece "Reabrir y meterlo aquí" (`App.reabrirAsunto`) o "Meterlo sin
reabrir", y entonces el fichero va a la carpeta del asunto dentro del ARCHIVO.

Se comprueba con `pruebas/documentos-sueltos.mjs`.

### "Por clasificar": el documento a la vista, marcado en la lista

(17-sep-2026, fila 25). Al abrir un documento suelto en el panel de la derecha, su tarjeta en la
lista de la izquierda queda marcada (`.tarjeta-abierta`, fondo y borde), la lista se desplaza sola
hasta ella si hace falta, y la cabecera del panel enseña su nombre completo (cortado por el medio,
no por el final, si no cabe: así se ve la extensión). Debajo de la cabecera van los mismos botones
de la tarjeta —Crear asunto con él, Meter en un asunto, Borrar—, y al terminar una acción el panel
se cierra solo si el documento ya no está en "Por clasificar".

- **`js/visor.js` no sabe nada de "Por clasificar"**: solo lleva un `marcador` (un texto
  cualquiera que pone quien abre, aquí `'suelto:<nombre>'`) y avisa (`Visor.alCambiar(fn)`) cada
  vez que cambia, al abrir o al cerrar. `Visor.marcadorAbierto()` lo devuelve en cualquier
  momento. `Visor.abrir(handle, nombre, {marcador, acciones})` acepta los dos como opcionales: sin
  ellos se comporta exactamente como antes (así lo siguen usando `js/ficha-asunto.js` y
  `js/unir-asuntos.js`, sin marcador ni acciones). `acciones` es un elemento que se cuelga en un
  hueco nuevo bajo la cabecera (`#visor-acciones`, `css/visor.css`).
- **`js/documentos-sueltos.js` traduce el marcador a la tarjeta de verdad**: se engancha a
  `Visor.alCambiar` (esperando a `DOMContentLoaded`, porque `js/visor.js` se carga después) y, con
  cada aviso, quita `.tarjeta-abierta` de todas y la pone en la que tenga
  `dataset.suelto === nombre`, con `scrollIntoView({behavior:'smooth', block:'nearest'})`. Al
  repintar la lista entera (`App.pintarSueltos`), cada tarjeta nace ya con la clase puesta si le
  toca, sin esperar al aviso.
- **Las acciones del panel no duplican nada**: `App.accionesDeSuelto(s)` construye la tarjeta
  entera con `App.tarjetaSuelto` (que a esa altura ya lleva el botón "Borrar" que le cuelga
  `js/papelera.js` por envoltura), le quita el botón "Abrir" —huelga, ya se está viendo— y
  devuelve su `.acciones`. Un solo sitio con la lógica de los tres botones.
- **El cierre solo si ya no está**: `App.pintarSueltos` empieza siempre comprobando si el
  marcador abierto es un `'suelto:...'` que ya no aparece en `App.E.sueltos`, y si es así llama a
  `Visor.cerrar()`. Como `App.verAbiertos` (que releva `App.E.sueltos` y llama a
  `App.pintarSueltos`) ya se llama tras crear un asunto, meter el documento en uno o borrarlo, no
  hace falta tocar esas tres acciones para nada.

Se comprueba con `pruebas/documento-a-la-vista.mjs`.

### La papelera

Nada se borra de verdad a la primera: se manda a una papelera compartida, de la que se puede
devolver a su sitio.

- **Dónde hay botón Borrar, y dónde no**: documento dentro de un asunto (ficha y "Gestionar
  documentos"), documento suelto, un asunto **abierto** desde su ficha (nunca desde la tarjeta,
  ni en el ARCHIVO), tipo de asunto, estado, tipo de documento, campo propio, y persona o
  empresa dada de alta a mano (nunca la que viene de Séneca). Botón siempre "Borrar"
  (`.boton-peligro`), el último de su fila.
- **La papelera**: carpeta `_GESTOR/PAPELERA` + índice `_GESTOR/papelera.json` (la más nueva
  arriba). Un fichero o carpeta se mueve a su propia subcarpeta `AAMMDD-HHMM <nombre>`, con
  `Carpetas.trasladar` / `Carpetas.moverFichero` (si la copia no sale completa, no se borra
  nada). Lo que no es fichero (tipo, estado, persona, nota…) no tiene carpeta: su dato se guarda
  entero en la ficha del índice. `papelera.json` se relee antes de escribir y entra en las
  copias de seguridad.
- **Comprobaciones antes de borrar**: un tipo de asunto no se borra si hay asuntos con ese tipo
  (se dice cuántos), y si tiene guía se avisa de que se va con él (se guarda en la papelera para
  poder devolverla junto con el tipo). Un estado no se borra si algún asunto lo tiene puesto. Un
  campo propio no se borra si está asociado a algún tipo (se dice a cuáles). Un tipo de
  documento se borra siempre. Una persona o empresa no se borra si tiene asuntos (se mira con
  `Duplicados.delTercero`), y solo si se dio de alta a mano.
- **Confirmación**: un solo cuadro, "¿Mandar a la papelera?", con el nombre en negrita. Un
  asunto abierto con documentos lleva un segundo cuadro "¿Seguro?" después del primero (nunca
  los dos a la vez).
- **Bloque Papelera de Ajustes** (el último): qué era, nombre, de dónde salía, quién y cuándo
  ("hace N días"), y botones **Devolver a su sitio** / **Borrar del todo** (con su propia
  confirmación). Aviso ámbar si algo lleva más de 30 días, con botón para borrarlo todo de
  golpe. **La papelera no se vacía sola, nunca.**
- **Devolver a su sitio**: si el asunto de un documento ya no existe, se ofrece "Por
  clasificar". Si ya hay algo con ese nombre en el destino, no se pisa nada.
- **El rastro**: al mandar/devolver un documento desde un asunto, se anota una nota
  (`Notas.anadir`). Un asunto entero no tiene dónde apuntarlo: el rastro es la ficha de
  `papelera.json`.
- Vive en `js/papelera.js` (`window.Papelera`), cargado tras `js/dni.js` y antes de
  `js/inicio.js`. Documento suelto y persona dada de alta a mano lo llevan por envoltura
  (`App.tarjetaSuelto`, `App.verFicha`); donde el botón va dentro de una función privada, se ha
  tocado el fichero directamente.

Se comprueba con `pruebas/papelera.mjs`.

---

## 2. Cómo trabajamos el código ← LÉELO ANTES DE TOCAR NADA

**El repositorio de GitHub es la versión buena.** Repositorio privado
`fmargon780/gestor-asuntos-ies`, rama `main`.

1. Se escribe el código y se sube al repositorio.
2. Vercel publica solo, en la misma dirección.

**Un solo proyecto de Vercel** (`gestor-de-asuntos`). No crear otro: ver `CONTEXTO-CORTO.md`,
sección 7.

**Nunca editar líneas sueltas con Francisco delante: fichero entero, siempre.**

**La regla que no se puede olvidar** (ver `CONTEXTO-CORTO.md`, sección 0): al terminar
cualquier instrucción de la cola, actualizar este documento y `CONTEXTO-CORTO.md` **sustituyendo
la línea vieja, no añadiendo una debajo**, y anotar en `docs/HISTORIA.md` lo que merezca
recordarse, con su fecha.

### Publicar: comprobarlo siempre, no darlo por hecho ← IMPORTANTE

**Subir al repositorio no garantiza que Vercel publique.** Después de subir algo hay que
comprobar qué se está sirviendo:

    curl -s "https://gestor-de-asuntos.vercel.app/js/nucleo.js?v=<algo distinto cada vez>"
    y mirar la línea App.VERSION

El `?v=` es imprescindible: sin él se puede recibir una copia guardada.

- **Comprobar la versión no basta: hay que comprobar cada fichero que se ha cambiado**, con
  `curl` + `grep` de un nombre de función nuevo por cada fichero tocado.
- **Cada commit es una publicación, y van en cola.** Con la cuenta gratuita, varios commits
  seguidos pueden tardar quince o veinte minutos, y mientras tanto la web sirve una mezcla.
  **Conviene agrupar los ficheros en los menos commits posibles** y comprobar al final.
- **Una publicación de Vercel es del árbol entero.** Si la cola se atasca, un commit trivial
  nuevo publica todo lo pendiente.
- `curl -sI` devuelve `x-vercel-cache` y `last-modified`. Si no se mueve en quince minutos, está
  atascado: se fuerza. **Forzar más de dos veces no arregla nada.**
- El panel de Vercel solo lo puede mirar Francisco: hay que decirle exactamente qué mirar.
- **Comprobar que está publicado no es comprobar que funciona.** La comprobación de verdad es la
  prueba en navegador de `pruebas/`.
- **El conector de Vercel no sirve para esto:** da 403 y 404.
- `vercel.json` manda `Cache-Control: public, max-age=0, must-revalidate` para todo.

### Ficheros del repositorio

En el orden en que los carga `index.html`. **Ese orden importa**: un módulo que envuelve algo
de `App` va después del fichero que lo define.

| Fichero | Qué hace |
|---|---|
| `index.html` | La página |
| `vercel.json` | Que el navegador no se quede con copias viejas |
| `css/estilos.css` | El aspecto general. Los demás `css/` van con su módulo del mismo nombre |
| `css/vista.css` | El ancho de la pantalla, los filtros plegados y las tarjetas por tipo |
| `css/guias.css` | La guía: pasos, plegado, preguntas y opciones |
| `css/tipos-buscador.css` | Las listas de resultados, y la marca naranja del que ya no está |
| `css/copiar-nie.css` | Los estilos de `js/copiar.js` (nombre viejo del módulo) |
| `js/util.js` | Utilidades comunes, y la comparación de nombres parecidos |
| `js/almacen.js` | Guarda los ajustes en el navegador |
| `js/carpetas.js` | Habla con el selector de carpetas del navegador. Lee y escribe los JSON. `Carpetas.esCarpetaTemporalDeSincronizacion` descarta, en un solo sitio, las carpetas que dejan Dropbox y Drive al sincronizar |
| `js/copias.js` | Copia de seguridad diaria de los ficheros de `_GESTOR`, y detección de fichero roto |
| `js/conflictos.js` | Las copias en conflicto que deja Dropbox: fusión sola o aviso para elegir |
| `js/fichas-huerfanas.js` | Fichas de `asuntos.json` cuya carpeta ya no está: enlazar o borrar |
| `js/nombres.js` | Monta los nombres de carpetas y documentos |
| `js/plazos.js` | La fecha límite de los asuntos |
| `js/guias.js` | Pintar y escribir una guía, con sus preguntas y opciones |
| `js/datos.js` | Lee los CSV; el nombre comercial y las columnas leídas por su título |
| `js/campos.js` | Los campos de cada tipo de asunto: catálogo, cálculo y guardado |
| `css/campos.css` | Los estilos del bloque "Datos del asunto" y del cuadro de Campos |
| `js/documentos.js` | Nombra los documentos, con el texto adicional y los tipos sin duplicados |
| `js/usabilidad.js` | Volver, Cancelar, etiquetas de filtros, vista compacta y Escape |
| `js/nucleo.js` | El estado, el arranque y el cambio de pantalla |
| `js/version.js` | `App.VERSION`, la fecha y hora de la última publicación |
| `js/asuntos-lista.js` | Asuntos abiertos: las tres tarjetas, las tarjetas por tipo y la lista. Al leer la carpeta, descarta las que parecen temporales de sincronización, salvo que ya tengan ficha en `asuntos.json` |
| `js/unir-asuntos.js` | Une asuntos duplicados que ya existen: aviso junto a Actualizar y pantalla propia "Duplicados" (`css/unir-asuntos.css`) |
| `js/asuntos-editar.js` | Editar un asunto abierto: renombra la carpeta y mueve su ficha |
| `js/elegir-asunto.js` | El cuadro de escoger un asunto a mano, compartido por "Por clasificar" y por la bandeja de correos |
| `js/documentos-sueltos.js` | Los papeles sin asunto, "Meter en un asunto", cerrar y reabrir, y la vigilancia de la carpeta |
| `js/asuntos-nuevo.js` | Crear un asunto, el cuadro de datos de un tercero y los pies |
| `js/archivo-personas.js` | Personas y empresas, el ARCHIVO, y cambiar los datos de un tercero |
| `js/ajustes.js` | La pantalla de Ajustes: tipos (pestañas, buscador, aviso en vivo), estados y tipos de documento |
| `js/puente.js` | El enganche de los módulos que se añaden por fuera (`window.Gestor`) |
| `js/avisos.js` | El aviso de lo que vence |
| `js/frescura.js` | El aviso de que el RegAlum.csv está viejo, y sus épocas |
| `js/recurrentes.js` | Los asuntos que se repiten cada mes, trimestre o curso |
| `js/guias-enganche.js` | Las guías dentro de la app, y `window.GuiasDelCentro` |
| `js/hitos.js`, `js/hitos-archivo.js` | El modelo de los hitos de un asunto: leer/escribir `hitos.json`, crearlos desde la guía, marcarlos, bifurcaciones, responsables y el historial al archivar |
| `js/que-me-toca.js` | Pantalla propia "Qué me toca": cruza los hitos pendientes y en curso de todos los asuntos abiertos, en tres bloques (`css/que-me-toca.css`) |
| `js/notas.js` | Las notas de cada asunto, con su enlace y su botón |
| `js/registro.js` | Registrar un documento en un paso, sin nombrarlo dos veces |
| `js/registro-lector.js` | Leer el número de registro del sello de Séneca, dentro del PDF |
| `js/lib/pdf.min.js`, `js/lib/pdf.worker.min.js` | pdf.js (Mozilla) 3.11.174, copiado tal cual |
| `js/ficha-asunto.js` | La pantalla de un asunto: guía, notas, documentos y contacto |
| `js/hitos-panel.js` | Pinta los hitos en la ficha del asunto, envolviendo lo que pinta la guía: el observador y el repintado |
| `js/hitos-panel-lista.js` | La otra mitad del panel de hitos: la fila de cada hito, su cuerpo desplegado y el cambio de rama |
| `js/duplicados.js` | ¿Esto no lo hicimos ya? Asuntos iguales del mismo tercero |
| `js/relacionados.js` | Terceros relacionados con un asunto, y la nota al archivar |
| `js/hitos-archivo.js` | La otra mitad del modelo de hitos: bifurcaciones, responsables de Ajustes y el `HISTORIAL DE TRAMITACION.txt` al archivar/reabrir |
| `js/visor.js` | El panel de la derecha para ver un documento (`con-visor`); marcador y acciones opcionales para que quien lo abre sepa qué se está viendo |
| `js/tipos-buscador.js` | Buscar el tipo de asunto por letras, y los más usados arriba |
| `js/via-contacto.js` | Los teléfonos y correos del tercero, como botones |
| `js/tablon.js` | El tablón de notas rápidas, con las notas "Solo para mí" |
| `js/copiar.js` | Los botones de copiar: el Nº escolar y el nombre del documento |
| `js/plantillas.js` | Leer y guardar `plantillas.json`, montar `Plantillas.valoresDeAsunto` y rellenar los huecos: el motor, sin pantalla |
| `js/plantillas-ajustes.js` | El bloque "Plantillas de correo" de Ajustes (sacado de `js/plantillas.js`) |
| `js/correo.js` | El correo y el mensaje de Séneca, con su rastro y sus plantillas |
| `js/docx.js` | Rellenar los huecos de una plantilla de Word: ZIP y XML a mano, sin librerías (`window.Docx`) |
| `js/plantillas-documento.js` | Botón "Generar documento" en la ficha, y el bloque "Plantillas de documento" de Ajustes (`css/plantillas-documento.css`) |
| `js/salir.js` | El botón de Salir del pie de la barra |
| `js/rescate-datos.js` | Recoge los CSV que se hayan quedado un piso más arriba |
| `js/traer-datos.js` | El botón de traer los CSV de Séneca desde donde estén |
| `js/lector.js` | El panel de la derecha para leer, con su borde para estirarlo |
| `js/bandeja-correos.js` | La bandeja de correos, la huella del hilo, lo que deja un correo dentro del asunto, y la tarjeta "Borrador en camino" (`window.Bandeja`) |
| `js/bandeja-enlace.js` | "Elegir asunto": llama al cuadro compartido, con la puntuación de parecido de un correo |
| `js/correo-adjuntos.js` | El bloque "Documentos de este asunto" del cuadro de Correo, y el encargo `<id>.envio.json` |
| `js/barra.js` | La barra plegable, el botón grande de Nuevo asunto y el icono de Ajustes plegado |
| `js/vista.js` | Los filtros plegados y cuándo se ve el tablón |
| `js/dni.js` | El DNI del alumnado, el aviso de que falta y la búsqueda por DNI |
| `js/papelera.js` | Borrar con papelera: mandar, devolver, borrar del todo y el bloque de Ajustes |
| `css/papelera.css` | El bloque de la papelera en Ajustes, y su icono por clase |
| `js/hitos-ajustes.js` | El bloque "Hitos" de Ajustes: responsables y días no lectivos |
| `css/hitos.css` | El aspecto de la lista de hitos en la ficha del asunto, y del bloque de Ajustes |
| `js/inicio.js` | La última línea: `App.arrancar()` |
| `package.json` | Las dependencias de las pruebas (`playwright`, `jsdom`) y `npm test` |
| `pruebas/ejecutar.mjs` | Levanta el servidor local y ejecuta todas las pruebas de esta carpeta |
| `.github/workflows/pruebas.yml` | Ejecuta `npm test` en cada subida y cada pull request a `main` |
| `pruebas/logica.mjs` | Pruebas de la lógica, sin navegador |
| `pruebas/copias.mjs` | Prueba de las copias de seguridad y del fichero roto |
| `pruebas/conflictos.mjs` | Prueba de las copias en conflicto de Dropbox |
| `pruebas/huerfanas.mjs` | Prueba de las fichas sin carpeta |
| `pruebas/nombres-app.mjs` | Falla si dos ficheros definen la misma función de `App` |
| `pruebas/navegador.mjs` | Prueba de la aplicación entera |
| `pruebas/tipos.mjs` | Prueba de las tarjetas por tipo |
| `pruebas/correos.mjs` | Prueba de lo que deja un correo dentro de un asunto, de la huella del hilo y del elegidor |
| `pruebas/tablon.mjs` | Prueba de cuándo se ve el tablón (a 1905 píxeles) |
| `pruebas/dni.mjs` | Prueba del DNI, del aviso y de las tres mejoras del buscador |
| `pruebas/empresas.mjs` | Prueba del nombre comercial y de cambiar los datos de un tercero |
| `pruebas/guias.mjs` | Prueba de escribir la guía desde la ficha, y del plegado |
| `pruebas/opciones.mjs` | Prueba de las preguntas con opciones, con el caso de la factura |
| `pruebas/registro.mjs` | Prueba de registrar un documento en un paso, sin nombrarlo dos veces |
| `pruebas/campos.mjs` | Prueba de los campos de cada tipo de asunto (ocho escenarios más editar) |
| `pruebas/relacionados.mjs` | Prueba de los terceros relacionados con un asunto, y la nota al archivar |
| `pruebas/duplicados.mjs` | Prueba de que no se dupliquen los asuntos, y de unir los que ya existen |
| `pruebas/ajustes-agil.mjs` | Prueba de las pestañas, el buscador cruzado, el aviso en vivo y la barra fija |
| `pruebas/papelera.mjs` | Prueba de borrar con papelera, devolver y borrar del todo |
| `pruebas/documentos-sueltos.mjs` | Prueba de "Meter en un asunto": un documento suelto a un asunto que ya existe |
| `pruebas/envios.mjs` | Prueba de mandar documentos por correo: el encargo, el hilo, el límite de 20 MB, "listo" y "error" |
| `pruebas/plantillas.mjs` | Prueba de las plantillas: huecos, "Faltan datos", cambiar de plantilla, sin plantillas, y el recorte de Séneca |
| `pruebas/hitos.mjs` | Prueba de los hitos de un asunto: crearlos, marcarlos, bifurcaciones, plazo, responsable y el historial al archivar |
| `pruebas/que-me-toca.mjs` | Prueba de "Qué me toca": los tres bloques, el filtro por responsable, abrir la ficha con el hito desplegado y la cuenta de la barra |
| `pruebas/plantillas-documento.mjs` | Prueba (jsdom, sin navegador) de las plantillas de documento: la reparación de huecos partidos, las cuatro clases de hueco, "faltan", el escapado XML, releer el ZIP de salida, el nombre del documento y un `plantillas.json` viejo |
| `apps-script/gestor-correos.gs` | El script de Gmail. No se ejecuta desde la web |
| `docs/CONTEXTO-CORTO.md` | Para decidir: se lee siempre |
| `docs/CONTEXTO.md` | Este documento, para programar |
| `docs/HISTORIA.md` | El diario, con fechas y el porqué de cada cosa |
| `docs/COLA.md` | La cola de instrucciones pendientes |
| `docs/PLAN-ROBUSTEZ-2026-09.md` | El plan de robustez de septiembre de 2026 |
| `docs/CAMBIOS-2026-09.md` | El resumen en llano del plan de robustez, para Francisco |
| `docs/CAMPOS-POR-TIPO.md` | El encargo de los campos de cada tipo de asunto |
| `docs/PAPELERA.md` | El encargo de borrar con papelera |
| `docs/UNIR-VER-DENTRO.md` | El encargo de la pantalla propia de duplicados |
| `docs/REPARTO-CONTEXTO.md` | El encargo de repartir el contexto en tres documentos |
| `docs/CORREOS-AL-ASUNTO.md` | El encargo de enlazar correos a un asunto y seguir el hilo |
| `docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md` | El encargo de meter un documento suelto en un asunto que ya existe |
| `docs/AHORRO-CUOTA.md` | Reglas para gastar menos cuota al trabajar la cola |
| `docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md` | El encargo de adjuntar documentos del asunto a un borrador de Gmail |
| `docs/PLANTILLAS-DE-CORREO.md` | El encargo de las plantillas de correo y de mensaje por tipo |
| `docs/HITOS.md` | El encargo de los hitos de un asunto |
| `docs/QUE-ME-TOCA.md` | El encargo de la pantalla "Qué me toca" |
| `docs/PLANTILLAS-DE-DOCUMENTO.md` | El encargo de las plantillas de documento de Word por tipo |
| `README.md` | — |

### Lo que la aplicación guarda en `_GESTOR`

Dentro de la carpeta de asuntos abiertos, y por tanto compartido:

| Fichero | Qué es |
|---|---|
| `tipos.json` | Tipos de asunto y su categoría |
| `tipos-documento.json` | Tipos de documento |
| `estados.json` | Estados de tramitación, en el orden del trámite |
| `asuntos.json` | Ficha de cada asunto: quién lo abrió, estado, vía, notas, cierre, pasos, fecha límite, documentos pendientes de registro, relacionados, campos configurados del tipo, hilos de correo enganchados |
| `guias.json` | Los pasos de cada tipo de asunto, con sus preguntas y opciones |
| `recurrentes.json` | Los asuntos que se repiten y cuándo tocan |
| `frescura.json` | Cada cuántos días avisar de que el RegAlum.csv está viejo |
| `tablon.json` | Las notas rápidas del tablón, con su marca de privada |
| `campos.json` | Los campos propios y los campos configurados de cada tipo de asunto |
| `papelera.json` | El índice de la papelera: qué se ha borrado, de dónde y cuándo |
| `no-duplicados.json` | Grupos de posibles duplicados descartados con "No son el mismo", por la firma de sus nombres |
| `envios.json` | **Es una lista, no un objeto.** Los encargos vivos de "mandar documentos por correo": `{ id, asunto, para, creado }` |
| `plantillas.json` | `{ firma, centro, localidad, direccion, codigo, cargo, lista: [{ id, tipo, categoria, nombre, texto }], documentos: [{ id, tipo, categoria, nombre, fichero, tipoDocumento, texto }] }`: `lista` para el correo y el mensaje de Séneca, `documentos` para las plantillas de Word |
| `hitos.json` | `{ ajustes: { responsables, noLectivos }, porAsunto: { <clave>: { creados, hitos } } }`: los hitos vivos de cada asunto abierto (ver "Los hitos de un asunto") |
| `datos/*.csv` | Alumnado (Séneca), personal, empresas y otros |
| `PAPELERA/` | Las carpetas y ficheros borrados, cada uno en su subcarpeta `AAMMDD-HHMM <nombre>` |
| `PLANTILLAS/` | Los `.docx` que Francisco sube a mano, colgados de un tipo desde Ajustes › Plantillas de documento. No lleva copia de seguridad: no es uno de los doce ficheros compartidos |
| `copias/*.json` | Copias de seguridad de los doce ficheros de arriba, una por día, 30 como mucho de cada uno |

**Los CSV van en `datos`, no en `_GESTOR`.** `js/rescate-datos.js` los baja solos al entrar.

Cada nota de `asuntos.json` es `{ texto, quien, cuando }`, y las de correo llevan además
`correo`, `enlace` y `enlaceTexto`. La ficha de un asunto guarda también `pasosHechos`,
`pasosElegidos`, `pendientesRegistro` (los nombres de fichero que faltan por registrar) y
`hilos` (los hilos de Gmail enganchados a ese asunto; ver "De un correo a un asunto").

**La carpeta de la bandeja de correos no es de `_GESTOR`**: está en el Drive de cada uno, y ahí
la aplicación escribe `seguidos.json` para el recolector de Apps Script.

**Todo fichero compartido se relee justo antes de escribirlo.** Son dos ordenadores sobre la
misma carpeta: sin releer, el último en guardar borra lo del otro. Lo hacen los doce ficheros de
arriba.

### Copias de seguridad y fichero roto

`Carpetas.leerJson` no confunde "no existe" con "no se puede leer": si el fichero existe pero el
JSON está roto, lanza un error `FicheroRoto` en vez de devolver `null` (antes se trataba igual
que si no existiera, y el siguiente guardado lo escribía encima, perdiendo todo).

- `js/copias.js` guarda, antes de escribir cualquiera de los doce ficheros compartidos, una
  copia de cómo estaba justo antes, en `_GESTOR/copias/<nombre>-AAMMDD.json`. Una copia por
  fichero y día; se conservan las últimas 30 de cada uno.
- Todo lo que escribe uno de esos ficheros llama a `Copias.guardar` en vez de a
  `Carpetas.guardarJson` directamente.
- Al pulsar Entrar se comprueban los doce ficheros (`Copias.comprobarTodos`). Si alguno está
  roto, **no se entra**: sale un aviso en rojo con un botón para restaurar la última copia de
  cada uno. El fichero roto se aparta como `<nombre>-roto-AAMMDD-HHMM.json` y no se borra nunca.
- En Ajustes, el bloque **Copias de seguridad** enseña cuántas copias hay de cada fichero y deja
  restaurar cualquiera a mano, por si hiciera falta sin que nada esté roto.

Se comprueba con `pruebas/copias.mjs`.

### Copias en conflicto de Dropbox, y releer siempre

Si los dos ordenadores guardan casi a la vez, Dropbox no pisa nada: deja aparte un fichero como
`asuntos (copia en conflicto de PC2 2026-09-11).json`.

- `js/conflictos.js` busca esos ficheros al entrar y cada cinco minutos.
- `asuntos.json`, `tablon.json` y `hitos.json` se fusionan solos: se unen los asuntos (o las
  notas del tablón) por su clave, y dentro de cada uno se unen las notas, los pasos hechos y los
  pasos elegidos (`asuntos.json`), o los hitos por su id (`hitos.json`), sin repetir nada. En
  `hitos.json`, dentro de `ajustes` solo se fusionan las altas de `responsables` y `noLectivos`.
- Los demás (`tipos.json`, `estados.json`, `tipos-documento.json`, `guias.json`,
  `recurrentes.json`, `frescura.json`, `campos.json`) cambian mucho menos y no se fusionan
  solos: salen en el bloque **Conflictos de Dropbox** de Ajustes, con dos botones para elegir
  con cuál de los dos ordenadores quedarse. El que no se elige no se pierde: los dos se guardan
  en `_GESTOR/copias` antes de decidir.
- **Releer antes de escribir**, en todos los ficheros compartidos: antes de guardar se relee el
  fichero y se suma lo que el otro ordenador haya añadido y nosotros no tengamos
  (`App.fusionarConDisco`). **No se detectan los borrados** del otro ordenador (aviso vigente,
  ver `CONTEXTO-CORTO.md`, sección 8).

Se comprueba con `pruebas/conflictos.mjs`.

### Pruebas automáticas en cada subida

`package.json` trae `playwright` y `jsdom`; `npm test` (ejecuta `pruebas/ejecutar.mjs`) levanta
el servidor local y corre todas las pruebas de `pruebas/` una tras otra, fallando si falla
cualquiera. `.github/workflows/pruebas.yml` lo lanza en cada subida y en cada pull request a
`main`, con Ubuntu, Node 20 y Chromium instalado por Playwright.

Las pruebas de navegador leen `process.env.CHROMIUM_PATH` (si no está, Playwright usa el suyo),
para funcionar igual en local y en Actions.

**Nada de fechas escritas a mano en una prueba.** Una fecha fija (un cese, un plazo) pone la
prueba en rojo ella sola en cuanto el calendario la alcanza. Se cuentan desde hoy.

### Fichas sin carpeta

La ficha de un asunto se busca por el nombre exacto de la carpeta. Si alguien renombra o mueve
una carpeta a mano, por fuera de la aplicación, la ficha se queda huérfana: sigue en
`asuntos.json` pero no se ve en ningún lado.

- En Ajustes, el bloque **Fichas sin carpeta** (`js/fichas-huerfanas.js`) calcula, al abrirlo,
  qué claves de `asuntos.json` no tienen carpeta ni en abiertos ni en el archivo.
- Cada huérfana se enseña con su estado y un resumen de sus notas, y dos botones: **Enlazar con
  una carpeta** (con las carpetas de abiertos y archivo sin ficha) y **Borrar la ficha** (con
  confirmación; guarda copia antes, como todo lo que toca `asuntos.json`).
- Un punto ámbar en el botón de Ajustes de la barra avisa de que hay huérfanas.

Se comprueba con `pruebas/huerfanas.mjs`.

### Nombres repetidos

`pruebas/nombres-app.mjs`, sin navegador: lee todos los `js/*.js`, busca las líneas `App.algo =
function` y falla si el mismo nombre se define en dos ficheros. Entra en `npm test`.

`App.VERSION` sale de `js/nucleo.js` y vive en `js/version.js`, cargado justo después: así
cambiar la versión (casi todos los commits) no obliga a resubir `nucleo.js` entero.

### Las columnas de cada CSV que mantiene la aplicación

| Fichero | Columnas |
|---|---|
| `solicitantes.csv` | Nombre · Nº Id. Escolar · Fecha de nacimiento · Teléfono de contacto · Correo de contacto |
| `personal.csv` | Nombre · Documento · Puesto · Teléfono · Correo |
| `empresas.csv` | Razón social · **Nombre comercial** · NIF · Contacto · Teléfono · Correo |
| `otros.csv` | Nombre · Referencia · Teléfono · Correo |

La primera columna es siempre el nombre, y es la clave con la que se busca al cambiar los
datos. **Las demás se leen por su título, no por su sitio.**

### Las carpetas que se señalan en cada ordenador

En el navegador (IndexedDB), con `Almacen`, y no se comparten entre ordenadores:

| Clave | Qué es |
|---|---|
| `abiertos` | La carpeta de asuntos abiertos |
| `archivo` | La carpeta ARCHIVO |
| `usuario` | El nombre de quien entra. **Es lo que distingue a uno de otro** |
| `bandeja` | La carpeta de Drive con los correos recogidos (opcional) |

**Van atadas a la dirección de la web.** Si la dirección cambia, hay que volver a señalarlas.

Aparte, en `localStorage`: `gestor-barra`, `gestor-filtros`, `gestor-lector-ancho` y
`gestor-ajustes-categoria`. **El tablón no se recuerda**: nace desplegado siempre, a propósito.

### Avisos técnicos ("ojo con...")

- **Antes de colgar una función nueva de `App`, comprobar que el nombre no está cogido.** Un
  `grep` por todos los `js/` basta; las pruebas de jsdom no cazan esto, hace falta el navegador
  con la aplicación entera.
- **Solo hay un cuadro de diálogo.** `U.preguntar` usa siempre el mismo `#capa`: hay que cerrar
  el primero antes de abrir otro.
- **`p.campos` solo trae las columnas que traen algo.** Para saber si una columna existe hay que
  mirar la cabecera del CSV (`Datos.cargarLista` la expone en `.cabecera`).
- **Ojo con los `MutationObserver` sobre la clase de un elemento que uno mismo cambia.**
- **Toda acción que guarda y repinta debe esperar (`await`) hasta el final antes de repintar.**
  El fallo de siempre no es que falte el repintado, sino que nada avisa de que se está guardando:
  con la carpeta en Dropbox, el guardado tarda, el control sigue pulsable y parece que no ha
  pasado nada hasta salir y volver a entrar (cuando sí se había guardado). La regla:
  `await U.mientrasGuarda(control, function () { return laAccionQueGuarda(); })` antes de repintar
  (`js/util.js`, 17-sep-2026, fila 23 de la cola). Apaga el control y, si es un botón, pone
  "Guardando…", y lo devuelve a como estaba, guarde o falle. Ya se usa en el estado del asunto, la
  vía, el plazo, archivar/reabrir (`js/ficha-asunto.js`, `js/asuntos-lista.js`) y en marcar,
  cambiar de rama, o tocar el responsable/fecha/notas/documentos de un hito
  (`js/hitos-panel-lista.js`). Se comprueba con `pruebas/refresco.mjs`.
- **Ojo con el orden de los `<script>` de `index.html`.** `ficha-asunto.js` poda la tarjeta con
  su lista blanca, así que un módulo que quiera poner un botón ahí tiene que cargarse después.
  `lector.js` va antes que `bandeja-correos.js`, y `bandeja-enlace.js` después de los dos.
  `dni.js` va casi el último; `inicio.js`, el último.
- **Envolver una función que ya existe es la mejor manera de añadir algo a muchas pantallas a la
  vez** (hay más de 17 envolturas así). Condición: cargarse **después** del fichero que define lo
  que se envuelve. No siempre compensa: cuando lo que hay que cambiar está dentro de una función
  privada, sale mejor tocar ese fichero directamente.

### Cómo probar

- **La aplicación entera se puede probar en local**, y es lo único que caza los fallos de
  verdad: `python3 -m http.server 8123` y las pruebas de `pruebas/`, que traen su disco de
  mentira. En Ajustes los bloques son `<details>` cerrados; hay que abrirlos antes de escribir.
  Para el portapapeles, dar `permissions: ['clipboard-read','clipboard-write']`.
- Para un módulo suelto sale más barato `jsdom` cargando el `index.html` de verdad, con dobles de
  App, Carpetas, Datos, Almacen, Gestor y Notas. **Pero jsdom solo carga el fichero que se
  prueba**, así que no ve los choques de nombres ni el orden de carga; un `DOMContentLoaded` no
  llega a dispararse nunca. El doble de un fichero del disco tiene que traer su `getFile()`.
- **Para lo que se ve, una foto.** Captura con Playwright con el CSS de verdad, a la anchura
  donde el fallo se ve (por ejemplo, 1905px para el monitor del trabajo). Comprobar siempre que
  la prueba **falla** sin el arreglo, antes de darla por buena.
- Un módulo nuevo puede crearse su propio bloque en Ajustes, su propia columna, su propio botón
  en la barra o su propio panel; así `index.html` solo necesita la línea del `<script>`. Para
  meter un botón en un panel que se repinta entero, vale un `MutationObserver`.

---

## 3. Descartado, y no proponer otra vez

- **Publicar con el conector de Vercel sobre un proyecto ya existente.** Da 403.
- **Crear un proyecto de Vercel más "por si acaso".** Un repositorio, un proyecto, una dirección.
- **Abrir la carpeta del asunto en el explorador de archivos del ordenador.** Una página web no
  tiene permiso.
- **Opciones dentro de opciones en la guía.** Una bifurcación por paso.
- **Una hoja de Google Sheets como interfaz.**
- **Enlazar un correo de Gmail con `#all/<identificador del hilo>`.** Se enlaza por el
  `Message-ID`: `#search/rfc822msgid:<id>`.
- **Meter Gmail dentro de la aplicación, en un marco.** Google no lo permite.
- **Esconder el tablón para dejar sitio.**
- **Sacar el DNI de la columna del tutor.**
- **Poner el nombre comercial en el nombre de la carpeta de un asunto de empresa.**
- **Reescribir la arquitectura de módulos y envolturas.** Funciona; se protege con una prueba de
  nombres repetidos.
- **Meter los campos de cada tipo en el nombre de los documentos.** Son del asunto, no del papel.

---

## 4. Qué falta por hacer

1. **Avisar al compañero de la dirección nueva** (`gestor-de-asuntos.vercel.app`) y de que
   tendrá que volver a señalar las dos carpetas y escribir su nombre.
2. Coordinar con el compañero la **lista de tipos de asunto**. Está aceptado empezar sin ella.
3. Coordinar con él también la **lista de estados**.
4. **Poner en marcha el script de Gmail** en la cuenta `g.educaand.es`, y señalar la carpeta
   `GESTOR-BANDEJA` en Ajustes. **Pendiente volver a pegar el script**: el del 16-sep-2026 es el
   que sigue los hilos ya enganchados (`seguidos.json`) y el que arregla el enlace a Gmail. Sin
   pegarlo, las respuestas no vuelven a la bandeja.
5. Ver con el uso si la bandeja **acierta con el tipo**. Si falla mucho, palabras clave por tipo.
6. Comprobar, con Séneca delante, si desde el perfil de administrativo la pantalla de
   Comunicaciones es la misma, y si el asunto admite el largo que le estamos dando.
7. Pendiente de decidir: si el aviso de fichero viejo debe vigilar también el `RelPerCen`.
8. **Cuando tengan una cuenta de correo común**, replantear la bandeja: una sola compartida.
9. Descartado por ahora: un filtro de Gmail que etiquete **todo** el correo entrante.
10. Ver con el uso si el panel de la derecha se queda corto para leer: hoy el 46%.
11. Ver con el uso si las tarjetas por tipo se quedan cortas: hoy son solo del tipo.
12. Mirar si el tablón debería ensancharse: hoy son 320 píxeles fijos.
13. Las notas viejas de correo se quedan como están: son el rastro.
14. Si el DNI no sale de nadie, **marcar la columna del documento al generar el RegAlum**.
15. Ver con el uso si el aviso de "falta el DNI" conviene también en la tarjeta del asunto.
16. Ver con el uso si el botón "Cambiar los datos" hace falta también en el buscador de Nuevo
    asunto.
17. Ver con el uso si a las preguntas de la guía les hace falta algo más.
18. **Cuando el uso lo pida**: búsqueda dentro de las notas, cuentas por tipo para la memoria de
    fin de curso, qué hacer con los asuntos vivos al cambiar de curso, y pasar el repositorio y
    Vercel a una cuenta del centro para el relevo.
19. Los borrados en `tipos.json`, `estados.json`, `tipos-documento.json` y `recurrentes.json` no
    se fusionan entre ordenadores (solo las altas, ver "Copias en conflicto de Dropbox" arriba).
    Y las copias en conflicto de `guias.json`, `recurrentes.json` y `frescura.json` no se
    fusionan solas: avisan en Ajustes para elegir con cuál quedarse. Revisar si con el uso hace
    falta algo más fino.
20. `js/papelera.js` no sabe devolver una plantilla de correo borrada (clase `'plantilla'`, no
    estaba en el encargo de las plantillas): si hace falta, se copia a mano desde el bloque
    Papelera de Ajustes.
