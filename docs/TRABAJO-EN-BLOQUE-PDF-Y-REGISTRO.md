# Trabajo en bloque: el PDF de cada persona y el registro de Séneca (fila 294)

Cerrado con Francisco el 7-oct-2026. Segunda de cuatro filas; **va después de la 293**
(`docs/TRABAJO-EN-BLOQUE.md`), que trae el asunto de grupo y la tabla «Personas del grupo». Lee
antes ese documento: aquí se usan sus palabras.

## Qué pasa hoy

- «… para cada relacionado» y «Generar para todos ▾» dejan **un Word por persona**. El PDF hay que
  sacarlo abriendo cada Word y pulsando «Guardar PDF», uno a uno.
- Los certificados del centro se firman **en Séneca**. Francisco, 7-oct-2026: «los certificados
  firmados se hacen en Séneca, les damos registro de salida, descargamos y enviamos».
- Con un solo documento, la aplicación ya reconoce el PDF sellado cuando llega a la carpeta
  (`js/registro-sellado.js`, `js/hacer-este-hito-sello.js`). Con treinta, no sabe de quién es cada
  uno: hoy preguntaría treinta veces «¿de qué documento es?».
- El PDF que hace la aplicación es una imagen de cada página (`js/word-visor.js`, `hacerPdf`): no
  tiene texto. Por eso no se puede leer en el PDF sellado el nombre de la persona.
- El sello de Séneca sí es texto, y Séneca lo añade sin tocar las páginas
  (`js/registro-lector.js`, comprobado el 11-sep-2026).

## Qué se decidió

- Generar deja ya el PDF de cada persona, sin abrir treinta veces el visor.
- Antes de generar todos se ve **uno de muestra**.
- Cada PDF lleva su número de documento escrito como texto, en pequeño. Es lo que deja saber, al
  volver sellado de Séneca, de quién es. **Decisión de diseño de esta conversación, no pedida por
  Francisco: se le avisó en el mensaje de cierre.** Si la descarta, el reconocimiento se queda en
  «a mano» (punto 4).
- El registro se sigue haciendo en Séneca, a mano, como hoy. La aplicación solo reconoce lo que
  vuelve.

## Qué hay que hacer

### 1. La muestra antes de generar

«Generar para todos ▾» (y «… para cada relacionado» en la mesa del hito), tras preguntar una vez lo
que falte del asunto:

- Abre en el visor de Word **el documento de la primera persona**, sin guardarlo, con una franja
  arriba: **«Así queda el de <persona>. Se van a hacer N iguales, uno por persona.»** y dos
  botones: **«Generar los N»** y «Cancelar».
- «Cancelar» cierra y no deja nada en la carpeta.
- Con una sola persona no hay muestra: se genera como hoy.

### 2. Generar deja el Word y su PDF

- Por cada persona: el Word (como hoy) y, a continuación, su PDF con el mismo nombre, hecho con la
  misma máquina de «Guardar PDF» pero **sin enseñar el visor**: el Word se pinta en un contenedor
  fuera de la vista. Saca esa parte de `js/word-visor.js` a una función reutilizable
  (`WordVisor.pdfDe(blob, opciones)`), sin cambiar lo que hace «Guardar PDF».
- Con su PDF hecho, el Word pasa a «Versiones previas», como ya pasa con uno solo.
- Mientras dura, una barra: **«Generando 12 de 30…»** con «Parar». «Parar» termina el que está a
  medias y no empieza otro; lo hecho se queda.
- Nunca dos veces el mismo: la regla de hoy (`nombreYaGenerado`: misma plantilla, misma persona,
  mismo día) vale también para el PDF. Si una persona tiene el Word pero no el PDF (se paró a
  medias), al volver a pulsar se le hace solo el PDF.
- En el hito se apunta el PDF, no el Word. La columna «Generado» de la tabla abre el PDF.
- En la fila de cada persona, «⋯» → **«Volver a generar»**: manda a la papelera su Word y su PDF y
  los hace de nuevo. Apagado si ese documento ya está registrado o enviado.
- El resumen final de hoy se queda (cuántos, a quién le falta qué dato), sin el botón «Enviar a
  cada uno…»: enviar es desde la tabla (fila 295). Hasta que esté la 295, el botón sigue.

### 3. Cada PDF lleva su número

- Solo en los PDF de un trabajo en bloque (los de este módulo), en **todas las páginas**, un
  renglón de texto de verdad escrito con `pdf-lib` (`drawText`, Helvetica estándar):
  **«Ref. D26-01234»**, a 7 puntos, gris.
- Sitio: donde no caiga ni el sello de registro ni la banda de firma. Lee
  `docs/HUECO-PARA-SELLO-Y-FIRMA.md` y `js/pdf-margenes.js`: el sello de salida va arriba a la
  izquierda y la firma abajo. Ponlo en el margen inferior, pegado a la esquina izquierda, por
  debajo de la banda de firma si cabe; si no, en vertical en el margen izquierdo.
- El número es el del propio documento (`D26-01234`), el mismo de su nombre.
- «Guardar PDF» de un documento suelto **no cambia**: no lleva la referencia.

### 4. Reconocer los PDF sellados, persona por persona

- En la tarjeta «Personas del grupo», una casilla **«Estos documentos se registran en Séneca»**
  (`ficha.registroPorPersona`). Sale marcada sola si el hito actual tiene una tarea de registrar.
  Sin marcar, la columna «Registrado» no sale y no se mira nada.
- Marcada, la columna «Registrado» dice «Pendiente» en quien tiene PDF sin registro. Encima de la
  tabla, una línea: **«Firma y registra los N en Séneca y guarda aquí los PDF que descargues.»**
  con el botón «Ruta» de siempre (`RutaCarpetas.boton`).
- Cuando en la carpeta del asunto aparece un PDF con sello que no tiene nombre de la aplicación
  (lo que ya ve `RegistroSellado.detectar`):
  1. Se busca su referencia: primero en el **nombre del fichero**, después en el **texto del PDF**
     (`RegistroLector.textoDe`), con `D\d{2}-\d{5}`, quitando antes todos los espacios (pdf.js
     parte el texto).
  2. Si trae **una sola** referencia, es de un documento de este asunto, ese documento sigue en la
     carpeta y no tiene registro: se coloca **sin preguntar**, con `RegistroSellado.asociar` (el de
     siempre: el sellado toma el nombre que le toca y el de sin sellar pasa a «Versiones previas»
     como «SIN SELLAR»).
  3. Si un mismo PDF trae **varias** referencias, una por página o grupo de páginas seguidas (Séneca
     los ha dado juntos): se parte por referencia con lo que ya hay en `js/pdf-separar-unir.js` y
     cada trozo sigue el paso 2. El PDF entero pasa a «Versiones previas».
  4. Si no trae referencia, o no cuadra: **no se decide**. Sale en la tarjeta, encima de la tabla:
     **«PDF sellados sin colocar (3)»**, cada uno con su número de registro, «Ver» y un desplegable
     **«¿De quién es?»** con las personas que siguen pendientes. Elegir una lo coloca. «No es de
     este trabajo» lo deja para el aviso de siempre de la ficha.
- Si solo queda una persona pendiente y llega un solo PDF sellado sin referencia, tampoco se
  decide solo: se pregunta. Un registro mal puesto es peor que una pregunta.
- Cuándo se mira: al abrir la ficha del asunto y en la pasada de fondo que ya existe
  (`HacerEsteHitoSello.pasada`, por `Gestor.alRefrescar`), con sus mismas condiciones: no en solo
  consulta, no con un guardado en marcha, no si el compañero tiene el mando, nunca dos a la vez.
  Solo sobre los asuntos con `registroPorPersona` y alguien pendiente.
- En un asunto con `registroPorPersona`, el aviso ámbar de la ficha («hay un PDF con sello, ¿de qué
  documento es?») **no sale** por estos PDF: van a esta lista.
- Cuando todas las personas con documento tienen registro: se marca sola la tarea de registrar del
  hito actual (`Hitos.marcarGuionPorAccion(a, hito, 'registrar')`), una vez, y aviso verde «Los N
  están registrados.».

## Qué NO se toca

- El registro de un documento suelto y «Hacer este hito»: como hoy.
- El Word que se genera y sus huecos.
- «Guardar PDF» e «Imprimir» del visor.
- Enviar: es la fila 295.
- «Ver todo» de Inicio: los PDF sellados se guardan en la carpeta del asunto, no sueltos.

## Trampas

- `html2canvas` a 200 ppp gasta memoria. Treinta seguidos sin soltarla tumban la pestaña: un
  documento cada vez, vaciando el contenedor y soltando los lienzos entre uno y otro, y cediendo el
  paso al navegador para que la barra se mueva.
- El contenedor fuera de la vista tiene que medir lo mismo que el del visor, o las páginas salen
  con otro corte. Compáralo con el PDF que da «Guardar PDF» del mismo Word: mismas páginas.
- `RegistroSellado` guarda en este ordenador qué PDF ha mirado ya (`sellos-mirados:<asunto>`). No
  lo rompas: un PDF ya colocado no se vuelve a mirar.
- Todo lo que escribe de fondo mira antes `SoloConsulta.activo()`.

## Antes de empezar

- No leas el repositorio entero. Basta con `docs/CONTEXTO.md`, `docs/TRABAJO-EN-BLOQUE.md`,
  `docs/contexto/WORD-EN-LA-APP.md`, `docs/contexto/DOCUMENTOS.md` (el registro),
  `docs/HUECO-PARA-SELLO-Y-FIRMA.md`, `js/generar-para-relacionados.js`, `js/word-visor.js`,
  `js/registro-sellado.js`, `js/registro-lector.js`, `js/hacer-este-hito-sello.js`,
  `js/pdf-separar-unir.js` y `js/personas-del-grupo.js`.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas (`js/pdf-separar-unir.js` tiene
  550: ahí no se añade nada, solo se llama).
- Un módulo nuevo no envuelve.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- La demostración tiene que traer, en el asunto de grupo de la fila 293: dos PDF sellados sin
  colocar en su carpeta, uno con la referencia de una persona pendiente y otro sin referencia.
  Hazlos con `pdf-lib`, con el texto del sello tal como lo espera `RegistroLector`.
- Rama `fila-294`, revisor en local y, con su APROBADA, a `main`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs grupo generar-para
  registro hacer-este-hito word`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/grupo-generar.js`: nuevo (`GrupoGenerar`). La muestra, la barra, el PDF de cada uno con su
  referencia, «Volver a generar».
- `js/grupo-registro.js`: nuevo (`GrupoRegistro`). La casilla, buscar la referencia, colocar,
  partir, la lista «PDF sellados sin colocar» y la pasada.
- `js/generar-para-relacionados.js`: solo los enganches (la muestra antes del lote, el PDF después
  de cada Word). Tiene 351 líneas: el código va en los módulos nuevos.
- `js/word-visor.js`: sacar `pdfDe(blob, opciones)`.
- `js/personas-del-grupo.js`: la columna «Registrado» según la casilla, «Volver a generar», el
  sitio de la lista de sin colocar.
- `js/hacer-este-hito-sello.js`: una llamada a `GrupoRegistro.pasada` en su `alRefrescar`.
- Donde la ficha pinta el aviso ámbar de PDF sellados: saltarlo con `registroPorPersona`.
- `index.html`, `css/…`, `js/novedades.js`, `js/demo/…`.
- `pruebas/grupo-generar.mjs`: nueva. Casos: la muestra no deja nada en la carpeta al cancelar;
  «Generar los N» deja N PDF y N Word en «Versiones previas»; cada PDF trae su `Ref.` como texto
  (leído con pdf.js) en todas sus páginas; «Parar» a medias y volver a pulsar no repite ninguno;
  Word sin PDF recibe solo el PDF; «Volver a generar» apagado con registro; «Guardar PDF» de un
  documento suelto no lleva `Ref.`.
- `pruebas/grupo-registro.mjs`: nueva. Casos: referencia en el nombre; referencia en el texto, con
  espacios en medio; se coloca sin preguntar y la tabla dice el registro; referencia de otro
  asunto, no se toca; sin referencia, va a «sin colocar» y «¿De quién es?» lo coloca; un PDF con
  tres referencias se parte en tres; todos registrados marca la tarea una sola vez; con la casilla
  quitada no se mira nada; solo consulta y compañero con el mando, nada escribe.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo),
  `docs/contexto/WORD-EN-LA-APP.md`, `docs/contexto/DOCUMENTOS.md`, `docs/contexto/PERSONAS.md` y
  `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que «Generar para todos» enseña antes uno de muestra y deja ya el PDF de cada
persona; que cada PDF lleva al pie su referencia en pequeño; que al guardar en la carpeta del
asunto los PDF descargados de Séneca, la tabla marca sola quién está registrado; y que lo que no
reconozca sale arriba con «¿De quién es?». **Y que hay un punto que solo él puede comprobar, en
`docs/COMPROBAR-A-MANO.md`.**

## Cómo sabemos que está bien

En la copia de demostración, en un asunto de grupo nuevo de una unidad.

1. «Generar para todos ▾», elegir la plantilla: se abre el documento de la primera persona con la
   franja «Así queda el de <persona>. Se van a hacer N iguales…» y los botones «Generar los N» y
   «Cancelar».
2. «Cancelar»: la tabla sigue sin nada en «Generado» y la carpeta no tiene documentos nuevos.
3. Repetir y pulsar «Generar los N»: sale la barra «Generando … de N…» y, al acabar, todas las
   filas tienen fecha en «Generado».
4. Pulsar la fecha de una fila: se abre un **PDF** (no un Word) con el nombre de esa persona
   dentro y, al pie, «Ref. D26-…» en pequeño.
5. En los documentos del asunto, los Word están en «Versiones previas».
6. Volver a pulsar «Generar para todos ▾» con la misma plantilla: avisa de que ya estaban y no
   repite ninguno.
7. En una fila, «⋯» → «Volver a generar»: su fila sigue con «Generado» y en la papelera está su
   documento anterior.
8. La casilla «Estos documentos se registran en Séneca»: al marcarla sale la columna «Registrado»
   con «Pendiente» y la línea «Firma y registra los N en Séneca y guarda aquí los PDF…».
9. En el asunto de grupo que trae la demostración: la persona cuyo PDF sellado traía referencia
   tiene ya su número en «Registrado», sin haber pulsado nada.
10. Encima de la tabla, «PDF sellados sin colocar (1)» con su número de registro. Elegir una
    persona en «¿De quién es?»: desaparece de ahí y esa fila pasa a tener su registro.
11. En ese asunto no sale el aviso ámbar de «hay un PDF con sello».
12. Con «En este ordenador, solo consultar» puesto: nada de lo anterior se coloca solo y los
    botones están apagados. Sin errores en la consola en ningún punto.
13. **[SOLO FRANCISCO]** Con un certificado de verdad de un trabajo en bloque: firmarlo y darle
    registro de salida en Séneca, descargarlo y guardarlo en la carpeta del asunto. La tabla marca
    sola a esa persona como registrada. Si no lo hace y el PDF sale en «PDF sellados sin colocar»,
    Séneca no conserva la referencia: decírselo a Claude, con el nombre con el que Séneca da el
    fichero y si los da de uno en uno o todos juntos.
