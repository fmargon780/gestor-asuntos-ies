# «Hacer este hito»: las tareas del hito, encadenadas (fila 285)

Cerrado con Francisco el 6-oct-2026. Sale de la auditoría de procedimiento de ese día: la app lo
prepara todo, pero espera un clic en cada paso. Francisco quiere que lo haga ella y que él solo
mire lo que sale del centro.

## Qué pasa hoy

En la pantalla de un hito (la mesa) hay tres menús: «Generar documento ▾», «Comunicar ▾» y
«Registrar». Cada tarea con acción tiene su receta (fila 164, `js/hito-mesa-recetas.js`): qué
plantilla genera, a quién se comunica, por qué vía y con qué plantilla de correo. O sea: la app ya
sabe qué hay que hacer y en qué orden. Pero cada tarea se lanza a mano, una a una:

1. «Generar documento ▾» → elegir la tarea → se abre el Word en grande → pulsar «Guardar PDF».
2. Firmar y registrar en Séneca, fuera de la app. Guardar el PDF sellado en la carpeta del asunto.
3. Abrir la ficha: aviso ámbar que pregunta de qué documento es ese PDF sellado
   (`js/registro-sellado.js`). Elegirlo.
4. «Comunicar ▾» → elegir la tarea → adjuntar el documento → «Enviar».
5. Marcar el hito como hecho.

## Qué quiere Francisco

Un solo botón, «Hacer este hito», que haga los pasos 1, 3, 4 y 5 seguidos. Se para solo donde
tiene que pararse: en el registro de Séneca, que se hace fuera, y antes de enviar un correo, que él
mira una vez.

## Palabras de este documento

- **La cadena**: las tareas pendientes del hito que tienen acción `generar`, `registrar` o
  `comunicar`, en el orden en que se ven (`Hitos.guionDe`). Es una palabra de este documento: en
  pantalla no sale nunca.
- **PDF sellado**: el que devuelve Séneca al registrar, con su sello.

## Qué hay que hacer

### 1. El botón

- En la cabecera de la mesa del hito, delante de «Generar documento ▾»: **«Hacer este hito»**,
  como botón principal.
- Sale solo si el hito tiene al menos una tarea pendiente con acción `generar` o `comunicar`. Si
  no, la cabecera queda como hoy.
- Debajo, una línea gris con lo que va a hacer, sacada de las tareas: «Genera «Certificado de
  matrícula» → espera el registro en Séneca → correo a la familia». Una flecha por tarea de la
  cadena.
- Apagado, con su motivo en el `title`, en solo consulta y cuando el compañero tiene el mando del
  asunto. Como los demás controles que cambian algo.
- Los tres menús de siempre se quedan donde están y hacen lo de siempre.

### 2. Lo que hace al pulsarlo

Recorre la cadena desde la primera tarea pendiente. Con cada tarea:

**`generar`**
- Con plantilla en la receta: la genera con la función de siempre (`generarDocumento`,
  `js/plantillas-documento.js`), apuntada a este hito. Si faltan datos, sale el cuadro de siempre
  («Faltan datos para este documento», `js/word-faltan.js`), una vez por documento.
- Sin plantilla en la receta: abre el cuadro de elegir plantilla de siempre y sigue con la elegida.
- El Word se abre en grande, como hoy, y **el PDF se guarda solo**, con la misma función del botón
  «Guardar PDF» (`js/word-visor.js`). El Word pasa a versiones previas, como hoy.
- La tarea se marca sola, como hoy (`Hitos.marcarGuionPorAccion`).
- Si «Cancelar» en el cuadro de datos, o si el PDF ya existe y dice que no lo sustituya: la cadena
  se para ahí, sin error, con el aviso ámbar de siempre. No queda nada a medias.

**`registrar`**
- La app no puede registrar en Séneca. La cadena **se para** y lo deja apuntado en el hito (ver
  apartado 4).
- En el visor del documento, una franja verde: «Documento listo. Ahora toca firmarlo y registrarlo
  en Séneca. Cuando guardes el PDF sellado en la carpeta del asunto, la aplicación sigue sola.»,
  con «Copiar la ruta de la carpeta» (el botón «Ruta» que ya existe) y «Cerrar».
- En la mesa, el botón pasa a decir **«Esperando el PDF sellado»** (apagado), con un enlace pequeño
  al lado: «Dejar de esperar». Pulsarlo borra el apunte y el botón vuelve a «Hacer este hito».

**`comunicar`**
- Vía correo: abre el cuadro de Correo de siempre con la receta (a quién, plantilla) y con el
  documento de la cadena ya adjunto: el PDF sellado si hubo registro, y si no el PDF recién
  guardado. Es `HitosComunicar.comunicar` con `adjuntos`. El envío es el de siempre, con su
  confirmación de siempre y su identificador para no enviar dos veces (`js/correo-enviar.js`): **no
  se toca**.
- En ese cuadro, junto a «Enviar», el botón de cerrar dice **«Todavía no»**. Al pulsarlo el cuadro
  se cierra y el hito queda «listo para enviar» (apartado 4).
- Vía Séneca: abre el cuadro de Séneca de siempre, con el documento señalado. La tarea se marca
  como hoy, al copiar.
- Si no hay ningún destinatario con correo, el cuadro se abre igual y lo dice, como hoy.

**Lo que no es de la cadena**
- Una tarea sin acción, o de añadir un documento: la cadena **la salta** y la deja para marcar a
  mano.
- Una pregunta sin responder: la cadena **se para antes**, con un aviso ámbar: «Antes hay que
  responder: «<texto de la pregunta>»».

### 3. Al terminar la cadena

- Si no queda ninguna tarea por hacer en el hito: el hito se da por hecho **sin preguntar**, por el
  mismo camino que «Marcar como hecho» (con su aviso de lo obligatorio, su «avisar a quien lo
  pide» y la apertura de la mesa del hito siguiente). Aviso verde: «Hito hecho: «<título>».», con
  «Deshacer».
- Si quedan tareas de marcar a mano: el hito no se da por hecho. Aviso verde: «Hecho lo que podía
  hacer la aplicación. Quedan N tareas por marcar.»

### 4. El apunte de la cadena, y cómo sigue sola

- En el hito, en `hitos.json`, un campo nuevo `cadena`: `{ estado: 'esperando-sello' |
  'listo-para-enviar', tarea, documento, quien, cuando }`. `tarea` es la tarea `registrar` (o
  `comunicar`) en la que está parada; `documento`, el nombre del PDF que espera sello o que va a
  enviarse. `Hitos.normalizarHito` lo conserva. Se borra al terminar la cadena, al dar el hito por
  hecho a mano y con «Dejar de esperar». Va compartido: el compañero ve lo mismo.
- **Reconocer el PDF sellado sin preguntar.** `RegistroSellado` ya lee los PDF de la carpeta que no
  ha nombrado la aplicación. Cuando encuentra uno con sello y el asunto tiene **un solo** hito con
  `cadena.estado === 'esperando-sello'`, lo asocia él solo al `cadena.documento`
  (`RegistroSellado.asociar`, que ya renombra el sellado, deja el original como «SIN SELLAR» y
  apunta la nota). Marca la tarea `registrar`. La cadena pasa a `listo-para-enviar` si la tarea
  siguiente es `comunicar`; si no, sigue como en el apartado 2.
- Si hay más de un PDF sellado sin resolver, más de un hito esperando, la fecha del sello es
  anterior al día en que se generó el documento, o el nombre nuevo ya existe: **no decide**. Sale
  el aviso ámbar de hoy, que pregunta.
- **Cuándo mira.** Hoy solo al pintar la ficha. Ahora, además, una pasada de fondo sobre las
  carpetas de los asuntos que tengan una cadena esperando: al entrar y en cada refresco
  (`window.Gestor.alRefrescar`). Solo esos asuntos, nunca todos. Como escribe (renombra), cumple
  la sección 6 del contexto corto: no corre con `SoloConsulta.activo()`, ni con un guardado en
  marcha, ni en un asunto donde el compañero tiene el mando; renombra por los caminos de siempre.
- **Nunca abre un cuadro por sorpresa.** Cuando el sello llega en una pasada de fondo, o con la
  ficha abierta, la app no abre el correo. En la mesa, el botón pasa a decir **«Enviar»** (verde),
  con la línea «El documento ya está sellado.». Pulsarlo abre el cuadro de Correo del apartado 2.

### 5. En Inicio

- Un trozo más en el cuadro de avisos (`AvisosLinea`, clave `listos-para-enviar`): **«N listos
  para enviar»**. Cuenta los asuntos abiertos con un hito en `listo-para-enviar`. Pulsarlo filtra
  la tabla, como los vencidos («Filtrado por: listos para enviar ✕ Quitar»). Abrir uno lleva a la
  mesa de ese hito.
- En la columna «Hito actual» de esos asuntos, detrás del título: «· listo para enviar». Y en los
  que esperan sello: «· esperando el sello».

## Qué NO se toca

- El envío del correo: su confirmación, su identificador y el script de Google.
- Los tres menús de la mesa y las recetas (fila 164). El botón nuevo las usa, no las cambia.
- «Generar para cada relacionado»: queda fuera de la cadena.
- Lo que lee `RegistroSellado` de un sello y cómo renombra. Solo cambia quién elige el documento.
- El aviso ámbar de la ficha cuando no hay cadena esperando: igual que hoy.
- Las guías y la biblioteca: no hay ningún campo nuevo que configurar.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/HITO-MESA.md`,
  `docs/contexto/WORD-EN-LA-APP.md`, `docs/contexto/DOCUMENTOS-PDF.md` (solo «Un papel que ya trae
  el sello»), `docs/contexto/CORREO-Y-SENECA.md` (de «El correo y la mensajería de Séneca» a «Mandar
  los documentos de un asunto por correo»), `js/hito-mesa.js`, `js/hito-mesa-recetas.js`,
  `js/hitos-comunicar.js`, `js/registro-sellado.js`, `js/word-visor.js`,
  `js/plantillas-documento.js` y `js/avisos-linea.js` basta.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas: `js/hito-mesa.js` tiene 516, así
  que el botón y la cadena van en un fichero nuevo. `js/hitos.js` ya pasa de 600: ahí, solo
  conservar `cadena` en `normalizarHito`.
- Un módulo nuevo no envuelve: se engancha por un punto previsto o por uno nuevo.
- Un solo cuadro a la vez (`U.preguntar`): la cadena espera a que se cierre uno antes de abrir el
  siguiente.
- Principal y accesorio: si falla generar o guardar el PDF, rojo y la cadena se para; si falla
  marcar una tarea o apuntar una nota, ámbar y sigue.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- La demostración tiene que dejarlo ver: un asunto con un hito cuyas tareas sean generar (con
  plantilla) y comunicar por correo; y otro con un hito ya en «esperando el sello» y su PDF sellado
  en la carpeta, para que la pasada de fondo lo encuentre al entrar. Usa el PDF sellado de ejemplo
  que ya tengan las pruebas de `RegistroSellado`. En la demostración el envío se finge, como hoy.
- Rama `fila-285`, revisor en local y, con su APROBADA, a `main`. Nada en una petición de cambios
  abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs hacer-este-hito
  hitos-recetas hito-mesa registro word-dentro`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/hacer-este-hito.js`: nuevo (`HacerEsteHito`; mira antes que el nombre esté libre). El botón,
  la línea de lo que hará, el recorrido de la cadena y el apunte. Si pasa de 400 líneas, la pasada
  de fondo va aparte, en `js/hacer-este-hito-sello.js`.
- `js/hito-mesa.js`: solo el sitio del botón en la cabecera.
- `js/registro-sellado.js`: un punto de enganche para que, con una cadena esperando, elija el
  documento sin preguntar.
- `js/word-visor.js`: poder pedirle «guarda el PDF ahora» y la franja verde.
- `js/hitos.js`: conservar `cadena`.
- `js/correo-cuadro.js`: el texto «Todavía no» cuando el cuadro lo abre la cadena.
- `js/avisos-linea.js` y el fichero de Inicio que pinta «Hito actual»: el aviso y las dos coletillas.
- `index.html`, `css/hito-mesa.css`, `js/novedades.js`, `js/demo/…`.
- `pruebas/hacer-este-hito.mjs`: nueva. Casos: el botón sale solo con tareas de generar o
  comunicar; generar con plantilla guarda el PDF solo y marca la tarea; sin registro, abre el
  correo con el PDF adjunto; con registro, deja `esperando-sello` y no abre nada; el PDF sellado
  se asocia solo y pasa a `listo-para-enviar`; con dos sellados o dos hitos esperando, pregunta
  como hoy; «Todavía no» deja `listo-para-enviar`; al enviar, hito hecho y `cadena` borrada;
  quedan tareas a mano, hito sin dar por hecho; pregunta sin responder, se para antes; solo
  consulta, botón apagado y la pasada no escribe; «Dejar de esperar» borra el apunte; el aviso de
  Inicio cuenta bien.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo), `docs/contexto/HITO-MESA.md` y
  `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que la pantalla de un hito tiene un botón «Hacer este hito»; que genera el
documento y guarda el PDF solo; que si el hito lleva registro se para hasta que el PDF sellado
esté en la carpeta, y entonces lo reconoce sin preguntar; que el correo sale preparado y él pulsa
«Enviar»; que al enviar da el hito por hecho y abre el siguiente; y que en Inicio hay un aviso «N
listos para enviar». Y que funciona en los hitos cuyas tareas dicen qué plantilla usar: en los
demás, pregunta la plantilla.

## Cómo sabemos que está bien

En la copia de demostración.

1. Al entrar, en el cuadro de avisos de Inicio sale «1 listos para enviar» (o el número que
   toque). No hay errores en la consola.
2. Pulsar ese aviso: la tabla se filtra y la fila dice «· listo para enviar» en «Hito actual».
3. Abrir ese asunto: se abre la mesa del hito. El botón dice «Enviar», con la línea «El documento
   ya está sellado.». En los documentos, el PDF sellado tiene nombre de la aplicación y hay un
   «SIN SELLAR» en versiones previas. No ha salido ningún aviso ámbar preguntando de qué
   documento es.
4. Pulsar «Enviar»: se abre el cuadro de Correo con destinatario, plantilla y el PDF sellado
   adjunto. El botón de cerrar dice «Todavía no».
5. «Todavía no»: el cuadro se cierra y el botón sigue en «Enviar».
6. «Enviar» otra vez, y enviar: aviso verde «Hito hecho: …» con «Deshacer», y se abre la mesa del
   hito siguiente. En Inicio, el aviso «listos para enviar» baja en uno o desaparece.
7. En el otro asunto de demostración, abrir el hito con tareas de generar y comunicar. Se ve
   «Hacer este hito» y, debajo, la línea «Genera «…» → correo a …».
8. Pulsarlo: se abre el Word en grande, el PDF se guarda sin pulsar nada y, detrás, sale el
   cuadro de Correo con ese PDF adjunto. La tarea de generar está marcada.
9. En un hito con una tarea de registrar: tras generar, la franja verde «Documento listo. Ahora
   toca firmarlo y registrarlo en Séneca…», y el botón dice «Esperando el PDF sellado» con
   «Dejar de esperar». En Inicio, su fila dice «· esperando el sello».
10. «Dejar de esperar»: el botón vuelve a «Hacer este hito».
11. En un hito sin tareas de generar ni comunicar: no hay botón «Hacer este hito». Los tres menús
    de siempre siguen ahí.
12. Con «En este ordenador, solo consultar» puesto: el botón está apagado.
13. **[SOLO FRANCISCO]** En el centro, con un certificado de verdad: «Hacer este hito», firmar,
    registrar en Séneca, guardar el PDF sellado en la carpeta del asunto. La app lo reconoce sin
    preguntar y el correo sale preparado con ese PDF.
