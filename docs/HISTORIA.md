# Historia — el diario

Esto casi nunca se lee: existe para consultar por qué se hizo algo como se hizo. Entradas
nuevas arriba, de lo más nuevo a lo más viejo.

---

## 24-sep-2026 — Fila 128: crear un tipo de asunto sin salir de Nuevo asunto

`docs/TIPO-DESDE-EL-ASUNTO.md`. Idea de Francisco: hasta hoy los tipos de asunto solo se creaban
en Ajustes, nunca sobre la marcha; eso obligaba a interrumpir "Nuevo asunto", ir a Ajustes, crear
el tipo y volver a empezar. Cambia esa decisión de siempre.

- `js/tipo-al-vuelo.js` (nuevo): el botón **«+ Crear tipo nuevo»**, destacado bajo el buscador de
  tipos con texto escrito (aunque haya parecidos que no valgan, no solo sin resultados) y discreto
  al final de la parrilla sin texto. Un panel de tres datos —nombre, nombre corto opcional y
  categoría—, dentro de la misma pantalla, nunca un segundo `#capa`.
- Se enganchó a `js/tipos-buscador.js` (`TipoAlVuelo.repintar()`, llamado al final de `aplicar()`,
  que es lo único que dispara escribir en el buscador, no `App.pintarTipos` entero): un punto, no
  una envoltura.
- La creación se sacó de `js/ajustes.js` a `App.crearTipo`, ya pasada la guardia `U.dejaCrear`, y
  la usan los dos sitios. Un nombre repetido no se duplica: avisa y ofrece «Usar este».
- `js/asuntos-nuevo.js` ganó `App.marcarTipoElegido`, quirúrgica: deja el tipo elegido sin tocar
  el tercero ni lo ya escrito (descripción, campos), a diferencia de `App.elegirTipo`, por si se
  crea el tipo con el formulario ya avanzado (el buscador de tipos sigue a la vista aunque ya haya
  tercero). Si todavía no había tercero, revela ese bloque igual que siempre.
- Escape cierra el panel, no Nuevo asunto: un `keydown` propio, en captura, con `stopPropagation`,
  mismo cuidado que `js/huecos-buscador.js` por el mismo motivo (el manejador de Escape de
  `js/usabilidad.js` está en burbuja, sin captura).
- Trampa real durante las pruebas: `document.getElementById` no encuentra nada dentro de un nodo
  todavía sin colgar del documento. `construir()` montaba el panel entero y le enganchaba los
  `onclick`/`oninput` con `$()` (que es `document.getElementById`) antes de que `repintar()`
  colgara el contenedor del documento la primera vez: hubo que buscar dentro de `panel` con
  `querySelector`, no con `$()`, mientras se está montando.
- Prueba nueva `pruebas/tipo-desde-el-asunto.mjs`: el botón destacado/discreto según el texto, crear
  el tipo y que quede elegido, que un nombre repetido no se duplique y ofrezca el que ya hay, que no
  se pierda el tercero ni lo escrito al crear un tipo distinto a medio formulario, que Escape solo
  cierre el panel, y que el tipo aparezca en Ajustes. Batería completa en verde, una sola pasada.
- Versión `App.VERSION`: `24-sep-2026 · 15:32`.

---

## 24-sep-2026 — Fila 127: el membrete se guardaba pero nunca se encontraba

`docs/MEMBRETE-NO-SE-ENCUENTRA.md`. `js/membrete.js` preguntaba por `membrete.png` con
`Carpetas.existe`, que busca una CARPETA: siempre «no hay imagen», y los documentos salían con
`{{MEMBRETE}}` escrito. Tres llamadas pasan a `Carpetas.existeFichero`; la imagen que Francisco ya
subió está bien guardada y vale sin volver a subirla.

- Buscando más casos iguales salieron tres en `js/papelera.js` (devolver un documento a su asunto,
  un documento a «Por clasificar» y un suelto): comprobaban si ya había «algo con ese nombre» como
  carpeta, así que un documento devuelto podía pisar a otro que se llamara igual. También pasan a
  `existeFichero`. Las demás llamadas son de carpetas de asunto y están bien.
- `pruebas/membrete.mjs` solo probaba `Membrete.medir`: por eso no lo cazó. Prueba nueva
  `pruebas/membrete-se-encuentra.mjs`, con `js/carpetas.js` de verdad; falla sin el arreglo.
- Versión `App.VERSION`: `24-sep-2026 · 14:04`.

---

## 24-sep-2026 — Fila 126: un tipo que cambia de nombre se lleva todo lo suyo

`docs/TIPO-QUE-CAMBIA-DE-NOMBRE.md`. Caso real: «Cargar la biblioteca del centro» renombró DESEMPEÑO
FUNCIÓN TUTORIAL al nombre largo (fila 123) y su guía se quedó bajo el nombre corto, así que la mesa
del hito dejó de enseñar la plantilla. `App.renombrarTipo` tenía el mismo hueco.

- `js/tipos-nombre.js`: `TiposNombre.mover` para los dos caminos, y un arreglo al entrar que junta con
  su tipo lo que siga bajo el nombre corto o un alias. Plantillas casan por cualquiera de los nombres.
- Decisión: el arreglo al entrar solo se dispara por la guía, los campos o los recurrentes. Las
  plantillas del centro llevan el nombre corto en `indice.json`; si también dispararan el arreglo, la
  carga las devolvería al nombre corto y el arreglo al largo, en cada entrada. Como ya casan por
  cualquier nombre, no hace falta.
- La carga de plantillas no duplica (mismo nombre y fichero con otro tipo: se le cambia el tipo, salvo
  que sea el mismo tipo con otro nombre) y quita las repetidas; la del centro de Francisco, repetida
  desde la fila 110 con CERTIFICADO PERSONAL, se va a la papelera al entrar.
- «Buscar otra plantilla…» en la mesa del hito y en el cuadro de «Generar documento»
  (`js/plantilla-buscar.js`).
- Ficheros partidos: `App.renombrarTipo` sale de `js/ajustes.js` (583 → 510 líneas) y «Cargar las
  plantillas del centro», de `js/plantillas-documento.js` (730 → 624) a `js/plantillas-centro.js`.
  No se han partido `js/plantillas.js` (solo dos funciones de una línea tocadas; varias pruebas lo
  cargan solo, sin navegador) ni `js/recurrentes.js` (no se toca: el recurrente se cambia en el disco
  y se relee con `Recurrentes._cargar`). Siguen pasando de 400 líneas: queda para otra fila.
- La guía y los campos que sobran al juntar van a la papelera con clases nuevas (`guia`,
  `campos-de-tipo`) que la papelera no sabe devolver sola: si hiciera falta, se copian a mano.
- Versión `App.VERSION`: `24-sep-2026 · 13:37`.

---

## 24-sep-2026 — Fila 125: Personas, matriculados primero, buscar por la familia y hermanos

`docs/BUSCAR-PERSONAS-Y-FAMILIAS.md`. En secretaría llama la madre y hay que saber de quién es;
y en Personas el alumno buscado quedaba entre antiguos, con la ficha arriba, fuera de la vista.

- Módulo nuevo `js/personas-familias.js`, llamado desde `js/archivo-personas.js` (sin envolver).
  La parte nueva de la ficha también vive ahí: con ella dentro, `archivo-personas.js` pasaba de 420
  líneas; se queda en 403.
- Decisión: un tutor se reconoce por su DNI sin espacios, puntos ni guiones, y sin DNI por su
  nombre entero. Dos tutores sin DNI que se llamen igual se unirían: con el RegAlum no hay nada
  mejor, y en la práctica suelen ser la misma persona.
- El índice de tutores se guarda en la propia lista que devuelve `Datos.cargar` (`_familias`): así
  se calcula una vez y se rehace solo cuando la lista se vuelve a leer.
- Además de todas las palabras, lo escrito junto («600112233», «12.345.678») se busca en el DNI y
  los teléfonos compactados, para que un número escrito con espacios o puntos también case.
- Comprobado en un navegador a 1905 px con un RegAlum de 83 alumnos: tarjeta de la madre con sus dos
  hijos, «Antiguos (41)» plegado, la ficha fija bajo la cabecera al bajar y el hermano pulsable.
- En la pasada completa de `npm test`, `notas-asunto-no-se-borran.mjs` (caso 10, salir con una nota
  sin guardar) se pasó una vez del tiempo; sola, dos veces en verde. No toca nada de esta fila.
- Versión `App.VERSION`: `24-sep-2026 · 13:14`.

---

## 24-sep-2026 — Fila 124: la renuncia a formar parte de la Junta Electoral

`docs/RENUNCIA-JUNTA-ELECTORAL.md`. En el sorteo de la Junta Electoral, la madre titular del sector
de familias renunció por motivos laborales y el escrito se hizo a mano; ahora sale desde la app.

- Plantilla nueva del centro, `plantillas/renuncia-junta-electoral.md` (OTROS · ELECCIONES CONSEJO
  ESCOLAR, RENUNCIA). Los datos de quien renuncia van en blanco con casillas (sector, designación,
  motivo) y un recuadro final «A cumplimentar por el centro». Una hoja A4: comprobado con el `.docx`
  pasado a PDF con LibreOffice (hubo que instalar su parte de Writer en la sesión).
- Decisión: la persona se nombra en neutro («la persona abajo firmante», «designada»), porque
  `js/genero.js` habría cambiado «designado/a» según el sexo del tercero del asunto, que no es quien
  renuncia. El destinatario sí va con forma doble marcada `:firmante`, y por eso la plantilla lleva
  `firmante: direccion` (solo para el género; la firma del cargo no se pinta).
- Los `id` de las plantillas del centro eran al azar al cargarlas, así que ningún paso de la
  biblioteca podía citar una. Ahora el `.md` puede llevar un `id` fijo, que viaja a `indice.json` y
  se respeta al cargar si nadie lo usa. El modelo `b260` lo cita en `plantillasDocumento`.
- El guion de `b260` gana «Recoger las renuncias y avisar al suplente que corresponda»
  (`g-renuncias`, «generar») detrás de g1, marcada `nueva: true`. «Traer los guiones del instituto»
  no tocaba un guion ya escrito, así que en el centro nunca habría llegado: ahora añade a un guion
  escrito solo las líneas `nueva` que le falten, en su sitio, y las plantillas del modelo. Como el
  hito lee el guion de la guía, llega también a los asuntos ya abiertos.
- `scripts/hacer-plantillas.mjs` aprende `~` (párrafo vacío, para dejar aire). Las demás plantillas
  salen idénticas byte a byte.
- `biblioteca-centro.json` editado con un script que lee y escribe el JSON (solo el modelo `b260`).
- Versión `App.VERSION`: `24-sep-2026 · 12:58`.

---

## 24-sep-2026 — Fila 123: el certificado de función tutorial, como el del centro

`docs/CERTIFICADO-TUTORIA-DEL-CENTRO.md`. Francisco pasó el certificado que usa hoy el centro; la
plantilla de la fila 110 se reescribió sobre ese modelo. Detalle en `docs/contexto/TABLAS-DE-DATOS.md`.

- La plantilla pasa al tipo DESEMPEÑO FUNCIÓN TUTORIAL, firma Secretaría y V.º B.º Dirección. Para
  «C E R T I F I C A:» en negrita y las firmas en dos columnas, `scripts/hacer-plantillas.mjs`
  aprendió `**negrita**`, `^^mayúsculas^^` (versalitas de Word, que alcanzan al valor del hueco) y
  un bloque `| a | b |` (tabla sin bordes). Las demás plantillas salen idénticas byte a byte.
- Decisión: «Secretario/a:firmante» y «del/de la:vistobueno Director/a:vistobueno» escritos en la
  plantilla, en vez de `{{CARGO FIRMANTE}}`/`{{CARGO VISTO BUENO}}`: el cargo se llama «Secretaría»
  o «Dirección» y el texto habría dicho «y Secretaría del IES» o «del Dirección». La fecha va como
  «en {{LOCALIDAD}}, a {{HOY LARGO}}» (`{{LUGAR Y FECHA}}» empieza por «En …» y quedaba «en En …»).
- `{{DNI}}` trae ya el documento entero del personal (antes, solo del alumnado); `{{PROVINCIA}}`
  entra en el catálogo de huecos (el dato ya estaba en «El centro»).
- La plantilla casa con el tipo del asunto sin tildes ni mayúsculas, y el botón de la biblioteca
  empareja igual el tipo que ya existe, sin cambiarle el nombre corto (las carpetas lo llevan).
- Ojo: `datos-biblioteca/biblioteca-centro.json` se editó a mano (y el tipo se apuntó también en
  `docs/contenido/BIBLIOTECA-PERSONAL.md`): volver a generarlo con `herramientas/cargar-biblioteca.mjs`
  perdería los guiones de los modelos, que se añadieron después por otro camino.
- `js/plantillas.js` pasa de 400 líneas y no se ha partido: solo se tocaron líneas sueltas, y varias
  pruebas lo cargan solo, sin navegador; partirlo pide tocar esas pruebas a la vez.

Versión `App.VERSION`: `24-sep-2026 · 12:22`.

## 24-sep-2026 — Fila 122: el editor de la guía, en acordeón

`docs/GUIA-EN-ACORDEON.md`. Con varios pasos, el cuadro de escribir la guía salía con todos los
campos a la vista y no se veía el trámite de un vistazo. Ahora cada paso cerrado es una línea
(número, título, marcas) y solo hay uno abierto a la vez. Detalle en
`docs/contexto/HITOS-Y-GUIAS.md` («El editor, en acordeón»).

- Decisión: plegar con una clase y CSS, sin quitar nada del DOM, para que `recoger()` siga leyendo
  todos los campos y lo guardado no cambie en nada.
- `js/guias.js` (1.204 líneas) se partió antes de tocarlo: la barra de formato a
  `js/guias-barra.js` y la caja de opciones a `js/guias-opciones-editor.js`; el acordeón, en
  `js/guias-plegado.js`.
- El editor de un modelo de la biblioteca (un solo paso) entra con `{ irA: m.id }`, para que ese
  paso no salga cerrado.
- El punto 9 de la fila (abrir el paso con error al guardar) no tiene hoy a qué aplicarse: guardar
  no da ningún error por paso (un paso vacío se descarta sin avisar).
- Tres pruebas viejas (`preguntas-anidadas`, `documentos-desde-el-hito`) daban por hecho que los
  pasos nacían abiertos: ahora abren la línea antes de escribir.

Versión `App.VERSION`: `24-sep-2026 · 12:04`.

## 24-sep-2026 — Fila 121: el aviso de versión nueva de la copia, que no se pierda

`docs/AVISO-DE-VERSION-SEGURO.md`. La copia sin internet de Francisco se quedó en la versión de las
07:35 con la de las 10:44 ya publicada, sin ningún aviso a la vista: cuando la copia no puede leer
`version.json` de GitHub, solo salía un aviso de una línea que se borraba a los 4,5 segundos. Se
puso al día a mano con `ABRIR EL GESTOR.html`.

- Ahora, si no puede comprobarlo, la franja fija de arriba, con «Cómo actualizar a mano» (los
  pasos de `docs/INSTALAR-COPIA.md`). Cerrada, no vuelve a salir en esa ventana.
- Con la aplicación abierta, vuelve a mirar cada 30 minutos. Decisión: esa vuelta nunca se
  actualiza ni recarga sola (se perdería lo que se está escribiendo): solo la franja con
  «Actualizar ahora».

Versión `App.VERSION`: `24-sep-2026 · 11:23`.

## 24-sep-2026 — Fila 120: el guion de la guía, desde el hito

`docs/GUION-DESDE-EL-HITO.md`. Francisco quería completar las guías tramitando, sin irse a Ajustes.
En la mesa del hito, «+ Añadir un paso a la guía del tipo» (además del de «solo para este asunto»):
la línea va al final del guion del paso de la guía y sale en todos los asuntos de ese tipo, porque
`Hitos.guionDe` ya lee el paso en vivo. Detalle en `docs/contexto/HITO-MESA.md` («El guion»).

- `GuiasDelCentro.cambiarPasos(tipo, fn)` (nuevo, `js/guias-enganche.js`): relee `guias.json`,
  cambia una copia y guarda por `guardarPasos`, para no pisar lo que el otro ordenador haya
  escrito entretanto en la guía.
- No sale en un hito añadido a mano, en uno cuyo paso ya no está en la guía, ni en un paso-pregunta.
  La biblioteca de hitos no se toca.

Versión publicada `App.VERSION`: `24-sep-2026 · 10:44`.

## 24-sep-2026 — Fila 119: adónde lleva la aplicación después de cada acción

`docs/TRAS-CADA-ACCION.md`. Casi nunca dejaba en lo que se acababa de tocar. Ahora crear, reabrir y
editar dejan en la ficha; «Volver» regresa a la pantalla de la que se vino (y a la misma altura de
la lista); cuando lo lógico es quedarse, el aviso trae «Ir al asunto». Detalle en
`docs/contexto/PANTALLA.md`.

- Fichero nuevo `js/navegacion.js` (un solo nivel de memoria, sin pila de historial).
  `U.aviso` admite un tercer parámetro con el botón.
- Cambio de una regla anterior (filas 30 y 93, «de la ficha solo se sale al Volver, Editar,
  Archivar/Reabrir o Borrar»): Editar y Reabrir ya no sacan de la ficha. Se actualizaron
  `pruebas/quedarse-en-el-asunto.mjs` y once pruebas más que, tras crear un asunto, esperaban la
  lista; ahora abren la ficha y vuelven.
- Decisión: «Crear los que tocan» solo abre la ficha si tocaba uno; con varios, nada. El aviso de
  «Meter aquí» sale al cerrar el cuadro de ponerle nombre, no antes, para que el botón no quede
  debajo del cuadro.
- «Abrir el que ya existe» de un duplicado archivado abre su ficha (se expuso
  `OtrosDelTercero.montarArchivado`).

Versión publicada `App.VERSION`: `24-sep-2026 · 10:44`.

## 24-sep-2026 — Fila 118: los pasos nuevos de una guía llegan a los asuntos abiertos

`docs/GUIA-NUEVA-LLEGA-A-LOS-ASUNTOS.md`. Francisco añadió pasos a la guía de un tipo desde la
ficha de un asunto y, al volver, no estaban: los hitos se copiaban de la guía una sola vez, al
abrir la ficha por primera vez. Detalle en `docs/contexto/HITOS-Y-GUIAS.md`.

- Fichero nuevo `js/hitos-sincronizar.js` (`js/hitos.js` ya pasaba de 400 líneas). Al guardar la
  guía, una sola escritura de `hitos.json` para todos los asuntos abiertos de ese tipo con hitos;
  al pintar la ficha, la misma cuenta como red de seguridad (es el caso del asunto de Francisco,
  que cambió la guía antes de esta fila).
- Decisión: nada existente se toca, se reordena ni se borra; un paso quitado de la guía sigue en
  los asuntos; el ARCHIVO no cambia.
- `pasosConocidos` en cada asunto: lo completa `Hitos.leer` en cada lectura con los `origenGuia`
  que haya, en vez de rellenarlo solo al crear. Así cualquier escritura lo guarda (también
  «quitar a mano», el cambio de tipo o una fusión), y un hito quitado a mano no vuelve ni en los
  asuntos de antes de esta fila. Un paso podado al cambiar de rama antes de esta fila sí puede
  volver, pero dentro de la rama no elegida, donde no se ve.
- El segundo `catch` de `escribirGuia` decía «No he podido guardarla» aunque la guía ya estaba
  guardada (fallaba el repintado): ahora es ámbar.

Versión `App.VERSION`: `24-sep-2026 · 10:44`.

## 24-sep-2026 — Fila 117: el envío de correo con la aplicación web publicada

`docs/ENVIO-CUENTA-DEL-SCRIPT.md`. Francisco conectó el envío de la fila 115 con la cuenta del
centro y salieron tres fallos, uno detrás de otro:

- `prepararEnvio()`, ejecutado desde el editor, da con `getUrl()` la dirección `/dev` (la de
  pruebas de «head»), que solo funciona con la sesión del dueño: «Probar» daba `Failed to fetch`.
  Cambiarla a `/exec` a mano tampoco vale (el id corto es el de «head»: Google pide iniciar
  sesión). Ahora `prepararEnvio()` da solo la clave y dice que la URL se copia de «Gestionar
  implementaciones», y la aplicación rechaza una `/dev` o una sin `?k=` sin llamar a Google.
- Con la `/exec` buena llegaba, pero «No hay ningún destinatario»: con acceso «Cualquier
  usuario», `Session.getActiveUser()` viene vacía. Todo el script usa ya `miCorreo()`
  (`getEffectiveUser()`, la cuenta que ejecuta).
- Fuera la nota de «Cualquier usuario de la organización»: con esa opción Google pide iniciar
  sesión y la llamada desde el navegador falla siempre.
- Nuevo paso fijo al actualizar el script: «Gestionar implementaciones → lápiz → Nueva versión →
  Implementar», para conservar la misma dirección.
- Sigue sin poderse enviar un correo real desde aquí (no hay cuenta de Google): lo comprueba
  Francisco con «Probar».

Versión `App.VERSION`: `24-sep-2026 · 10:44`.

## 24-sep-2026 — Fila 63: publicar solo la aplicación

`docs/PUBLICAR-SOLO-LA-APP.md`. Estaba BLOQUEADA porque ninguna sesión podía comprobar desde fuera si
Vercel publicaba la documentación. Francisco abrió `https://asuntos.fmargon.com/docs/COLA.md` y se
veía el texto entero, con las filas bloqueadas: confirmado.

- `.vercelignore` en la raíz: `docs/`, `pruebas/`, `plantilla/`, `apps-script/`, `herramientas/`,
  `.github/`, `README.md`, `package.json` y `package-lock.json`. La aplicación no lee nada de ahí
  (la copia sin internet se actualiza desde GitHub, no desde la web).
- Decisión: `scripts/` se queda publicado. De ahí sale el `ignoreCommand` que evita gastar
  publicaciones con cambios solo de documentación (fila 48), y desde aquí no se puede probar si le
  afectaría; no tiene nada que tapar.
- El autónomo real que salía de ejemplo (una papelería, con su nombre y NIF) se cambió por uno
  inventado en `docs/PAPELERA.md`, `docs/HISTORIA-ANTERIOR.md`, `js/datos.js` y `pruebas/empresas.mjs`.
- Queda por comprobar ya publicado: que `docs/COLA.md` da error, que la aplicación entra, y que el
  siguiente cambio solo de `docs/` no publica. Lo del panel de Vercel (Analytics, registros) sigue
  pendiente de que Francisco lo mire.

Versión publicada `App.VERSION`: `24-sep-2026 · 07:35`.

## 24-sep-2026 — Fila 116: preguntas dentro del guion de un hito

`docs/PREGUNTAS-EN-EL-GUION.md`. Dentro de un mismo hito, lo que hay que hacer a menudo depende de
una respuesta («¿Viene con toda la documentación?» → «Pedir que la complete»). Ahora una línea del
guion puede ser pregunta, con un botón por respuesta y sus propias líneas. Detalle en
`docs/contexto/HITO-MESA.md» («El guion»).

- Se apuntó como fila 115, número que ya llevaba en curso la de enviar el correo desde el asunto;
  pasó a la 116. Mientras esa fila estaba a medias, `main` tuvo pruebas en rojo: esta esperó a que
  quedara en verde para subirse.
- Decisión: un solo nivel; cambiar de respuesta no borra lo ya marcado de la otra, queda plegado al
  final en gris; la pregunta cuenta como una línea (hecha al responder).
- El marcado automático solo mira lo que se ve: nunca marca una línea de una respuesta no elegida.

Prueba nueva `pruebas/preguntas-en-el-guion.mjs` (sin navegador). Batería completa en verde.
Versión publicada `App.VERSION`: `24-sep-2026 · 07:32`.

## 24-sep-2026 — Fila 114: los documentos en la tarjeta cerrada, legibles

`docs/DOCUMENTOS-EN-LA-TARJETA.md`. En la tarjeta cerrada «Documentos de la carpeta» los nombres
salían montados unos encima de otros y cortados por abajo, y la primera línea repetía el número del
círculo. Ahora cada documento va en su renglón, como mucho cinco (o los que quepan enteros), y
«y N más» abre la lista entera.

- Causa: los renglones del resumen se encogían por debajo de su alto de línea (`flex-shrink` por
  defecto en una columna flex con `overflow: hidden`); con `flex: none`, en todas las tarjetas.
- Decisión: cuántos caben se mide después de pintar (alto de la caja entre el de un renglón) y se
  vuelve a medir con `ajustarAlto()`; nunca un renglón a medias.
- `js/ficha-tarjetas.js` iba a pasar de 450 líneas: los resúmenes se fueron a
  `js/ficha-tarjetas-resumen.js`. Cada renglón lleva `title` con su texto entero.

Prueba nueva `pruebas/documentos-en-la-tarjeta.mjs`; `pruebas/ficha-en-tarjetas.mjs` ya no espera la
línea «3 documentos». Batería completa en verde.
Versión publicada `App.VERSION`: `24-sep-2026 · 05:53`.

## 24-sep-2026 — Fila 113: el mapa de la guía

`docs/MAPA-DE-LA-GUIA.md`. Con dos niveles de preguntas, al escribir la guía cada rama se veía por
separado y Francisco se perdía. Ahora hay un mapa de solo lectura, como un diagrama de flujo, con
la guía entera: en Ajustes (pantalla del tipo), dentro del cuadro de escribir la guía y en la ficha
de un asunto (con el camino elegido resaltado y el estado de cada hito). Detalle en
`docs/contexto/HITOS-Y-GUIAS.md`.

- Decisión: HTML y CSS a secas (cajas y líneas con `::before`), sin librerías, para que valga en la
  copia sin internet.
- Decisión: dentro del editor, el mapa es un panel del mismo cuadro, no un segundo cuadro; pulsar
  un paso lleva a su nivel con él desplegado y resaltado.
- `js/guias.js` pasaba de 1.200 líneas: la navegación por niveles se fue a `js/guias-niveles.js`
  antes de añadir nada.
- Lo que costó: la raya de las ramas se cortaba en el hueco entre una y otra.

Prueba nueva `pruebas/guias-mapa.mjs` (sin navegador). Batería completa en verde.
Versión publicada `App.VERSION`: `24-sep-2026 · 05:45`.

## 24-sep-2026 — Fila 112: cabecera compacta de la ficha y del hito

`docs/CABECERA-COMPACTA.md`. Con un hito abierto, lo importante empezaba a más de 500 px del borde
de arriba, detrás de tres botones de volver, el nombre del asunto dos veces y «Hitos 2/5» dos
veces. Ahora la cabecera del asunto va en dos líneas y el hito en una, y «GUION DEL HITO» queda a
unos 234 px (a 1600×920; antes, 528).

- Decisión: para volver se pulsa otra vez la pestaña abierta (desde un hito, a la lista de hitos;
  desde ahí, a las tarjetas), igual que Escape. Fuera «Volver a las tarjetas», «Volver a la lista
  de hitos» y la línea de ruta.
- Decisión: «Archivar» sube a la primera línea (`#ficha-archivar`), y la fila de copiar y la línea
  gris van a la derecha de la segunda, en pequeño.
- Con la cabecera encogida al bajar, la barra de acciones sigue a la vista (lo pedía la fila 52):
  solo se esconde la parte gris.
- Lo que costó: la clase `.ficha-datos` ya existía para otra cosa y apilaba la línea gris; se llama
  `.ficha-apertura`.

Prueba nueva `pruebas/cabecera-compacta.mjs`; `pruebas/cabecera-del-asunto.mjs` busca «Archivar» en
su sitio nuevo. Batería completa en verde.
Versión publicada `App.VERSION`: `24-sep-2026 · 05:18`.

## 24-sep-2026 — Fila 111: el masculino o el femenino, solo, en las plantillas

`docs/GENERO-EN-PLANTILLAS.md`. Las plantillas se escriben con «el/la alumno/a», «D./Dña.»,
«interesado/a»… y al generar el Word, el correo o el mensaje de Séneca sale solo la forma que toca
según el sexo de cada persona. Detalle en `docs/contexto/DOCUMENTOS-PDF.md`.

- Decisión: sin el dato, la forma se queda con su barra (nunca una por defecto) y el aviso ámbar dice
  de quién falta y dónde ponerlo.
- Decisión: para otra persona, una marca pegada detrás (`hijo/a:tutor1`, `:tutor2`, `:firmante`,
  `:vistobueno`), fácil de escribir en Word. Los cargos con barra («Director/a») y su artículo son
  de quien firma sin marcar nada.
- Decisión: solo se tocan pares conocidos y terminaciones «/a», «/as»; fechas, «y/o», registros y
  webs se quedan como están. Se resuelve antes de meter los datos, para no tocar lo que traen.
- El sexo: columna «Sexo» del RegAlum (alumno y tutores); casilla nueva en «Datos y contacto»
  (`_GESTOR/sexos.json`); y desplegable nuevo en cada persona de «Cargos del centro».
- En el Word las formas dobles también llegan partidas en trozos: se juntan como los huecos.

Prueba nueva `pruebas/genero.mjs` (nombres inventados). Batería completa en verde.
Versión publicada `App.VERSION`: `24-sep-2026 · 05:00`.

## 24-sep-2026 — Fila 110: tablas de datos y el certificado de función tutorial

`docs/TABLAS-DE-DATOS.md`. Francisco pasaba a mano a Excel el PDF «Relación de funciones
tutoriales» de cada curso para certificar en qué periodos fue tutor un profesor. Ahora la aplicación
lee esos PDF de la carpeta de datos, y cualquier CSV o Excel de `datos/Tablas`, los une a cada
persona por su DNI y los usa en huecos de plantilla: `{{ESPECIALIDAD}}`, `{{TABLA TUTORIAS}}` y los
generales `{{DATO …}}`/`{{TABLA …}}`. Plantilla nueva «Certificado de función tutorial». Detalle en
`docs/contexto/TABLAS-DE-DATOS.md` (hijo nuevo).

- Decisión: el PDF se lee por posiciones (cada trozo va a la columna cuya cabecera empieza a su
  izquierda), no por texto corrido: así los nombres partidos en dos líneas y «(Sustituto/a)» se
  pegan a su fila.
- Decisión: lo que no tiene dato no se deja en blanco: sale «[falta: …]» resaltado en amarillo en el
  Word, y en el aviso ámbar de siempre.
- `js/docx.js` pasaba de 580 líneas: el membrete se fue a `js/docx-imagen.js` y las tablas van en
  `js/docx-tabla.js`, los dos sobre `Docx.interno`.
- Lo que costó: pdf.js vacía el buffer que se le da (y el mismo PDF se quedaba luego en cero
  bytes); y el «[falta: …]» caía en un trozo de Word con un salto de línea dentro, así que se parte
  el texto donde está la marca en vez del trozo entero.

Prueba nueva `pruebas/tablas-datos.mjs` (con nombres y DNI inventados). Batería completa en verde.
Versión publicada `App.VERSION`: `24-sep-2026 · 04:51`.

---

## 24-sep-2026 — Fila 109: el hito a pantalla completa, la mesa de trabajo

`docs/EL-HITO-A-PANTALLA-COMPLETA.md`. Dentro de la tarjeta de Hitos, la lista queda compacta y
pulsar un hito abre su mesa: cabecera con etiquetas pulsables (estado, plazo en días hábiles,
responsable), "Marcar hito como hecho", menú ⋯ y la tira de hitos; y tres columnas: el guion, los
documentos (en tabla, con gemelos y selección de varios) con plantillas y formularios, y la
consulta (normativa, comunicar con destinatarios, notas e historial). Detalle en
`docs/contexto/HITO-MESA.md` (hijo nuevo: `HITOS-Y-GUIAS.md` ya pasaba de 40 KB).

- Decisión: la mesa no es una pantalla nueva sino el mismo hito con su cuerpo a la vista y los demás
  escondidos. Así todo lo que ya hacía cada botón del hito (generar, comunicar, añadir, el menú de
  cada documento, lo que falta reunir) sigue funcionando igual, con las mismas clases, y las
  pruebas de antes casi no han cambiado.
- Decisión: el guion vive en la guía y en la biblioteca; en el hito solo su estado. Los pasos con
  acción se marcan solos (generar, registrar desde el ⋯, comunicar, añadir un documento nuevo).
- El borrador de los guiones (296 hitos modelo, 1.064 pasos) lo escribió una sesión auxiliar a partir
  de los documentos del centro; la normativa solo repite la que ya citaba cada modelo (ninguna traía
  enlace, así que ninguna lo lleva). Se trae a la carpeta con "Traer los guiones del instituto",
  que nunca pisa uno escrito. Sugerencias de convertir en pregunta (no se ha cambiado nada):
  - b11 — Imponer la corrección: quién la impone cambia según la corrección (profesor, tutor, jefatura, director); convertir en pregunta "¿Qué corrección se impone?".
  - b144 — Resolver o remitir, según el supuesto: dos caminos (resuelve el centro / se remite fuera); convertir en pregunta "¿Lo resuelve el centro o se remite?".
  - b160 — Resolver o remitir a quien firma: firma la Dirección o la Delegación según el permiso; convertir en pregunta "¿Quién firma este permiso?".
  - b165 — Recibir el parte de baja: va por MUFACE o por el Régimen General según el colectivo; convertir en pregunta "¿MUFACE o Régimen General?".
  - b180 — Publicar o remitir según proceda: dos destinos distintos; convertir en pregunta "¿Se publica o se remite?".
  - b274 — Repartir o remitir: entrada (reparto interno) y salida (envío fuera) son caminos distintos; convertir en pregunta "¿Es entrada o salida?".
- Lo que no se ha hecho: "Abrir para imprimir" y "Enviar por correo" en cada formulario oficial
  (siguen sus botones de siempre); la normativa de un paso de guion es solo cita y enlace, sin el
  bloque del sistema de normativa.
- Lo que costó: la aplicación vuelve a abrir la misma ficha sola tras guardar algo (al cerrar el
  cuadro de Correo, al generar), y eso devolvía la ficha a la cuadrícula de tarjetas; ahora solo
  vuelve a la cuadrícula si se entra en otro asunto.

Prueba nueva `pruebas/hito-mesa.mjs` (los ocho puntos del encargo, a 1905 y a 1280 px), foto a
1905 px revisada. Batería completa en verde. Versión publicada `App.VERSION`: `24-sep-2026 · 04:32`.

---

## 24-sep-2026 — Fila 108: la ventana de contacto del alumno, en tarjetas

`docs/CONTACTO-EN-TARJETAS.md`. La ventana «Ver todo» del alumno pasa de cinco columnas a una
cabecera con etiquetas y una tarjeta por persona (el alumno, tutor 1, tutor 2), con «Correo a la
familia» y «Copiar todo el contacto» abajo.

- El fallo de fondo: `numeroDeTitulo` miraba la primera palabra «primer» del título, y en «Primer
  apellido Segundo tutor» esa palabra es del apellido: el segundo tutor acababa dentro del primero.
  Ahora manda el número pegado a «tutor». Y el nombre ya no sale a trozos: se monta entero.
- `js/datos.js` pasaba de 1.100 líneas: los tutores se van a `js/datos-tutores.js`; y la ventana
  del alumno, a `js/ficha-tercero-alumno.js`, para no pasar de 400 en `js/ficha-tercero.js`.
- Decisión: «Correo a la familia» cierra la ventana y abre el cuadro de Correo de siempre (un solo
  cuadro a la vez), con los correos de los tutores como destinatarios propuestos.

La prueba del caso real falla con el código de antes y pasa con el nuevo; foto a 1905 px revisada.
Batería completa en verde. Versión publicada `App.VERSION`: `24-sep-2026 · 04:08`.

---

## 24-sep-2026 — Fila 107: la ficha del asunto en tarjetas

`docs/FICHA-EN-TARJETAS.md`. Las tres columnas dejaban lo de abajo fuera de la pantalla y el
centro casi vacío. Ahora, debajo de la cabecera, una cuadrícula de tarjetas del mismo tamaño que
cabe entera sin bajar, cada una con su resumen; al pulsar una se abre en grande con las demás como
pestañas arriba y, encima, una franja con los documentos. `js/ficha-plegables.js` se retira: los
dos plegables son ya tarjetas.

- Decisión: los resúmenes se leen de lo que cada módulo ya pinta en la tarjeta (su cuerpo sigue en
  la página, oculto), en vez de abrir en cada módulo una forma nueva de preguntarle. Así no se toca
  cómo se pinta nada y el resumen nunca dice algo distinto de lo que se ve al abrirla.
- Decisión: "Datos y contacto" y "Datos del trámite" enseñan su propio contenido también cerradas:
  ya eran una línea de resumen, con sus botones de copiar.
- Lo que costó: el alto "sin bajar" no contaba el relleno de abajo de la pantalla (60 px) y la
  página seguía bajando un poco; y la franja no volvía a pintarse al volver a una tarjeta por su
  pestaña (se quedaba con la huella de la vez anterior).
- Veintidós pruebas trabajaban dentro de la ficha con todo a la vista: ahora entran con su tarjeta
  abierta (`window.__tarjeta`) o la abren; `pruebas/ficha-disposicion.mjs` pasa de columnas a
  tarjetas, y las de la cabecera encogida abren una tarjeta larga para tener por dónde bajar.

Prueba nueva `pruebas/ficha-en-tarjetas.mjs` (a 1905 y a 1280 px), con fotos revisadas antes de
publicar. Batería completa en verde. Versión publicada `App.VERSION`: `24-sep-2026 · 03:53`.

---

## 24-sep-2026 — Fila 106: quién lo pide, una sola vez en la cabecera

`docs/LO-PIDE-EN-LA-CABECERA.md`. La marca de arriba dice ya `Lo pide: García, Isabel María
(tutor legal 1)` (`LoPide.etiqueta`), y desaparece la línea gris de debajo de "El encargo", que
repetía la relación y traía la errata "por en persona". La vía se sigue viendo, con su valor
guardado, al abrir "El encargo" (comprobado en `pruebas/cabecera-del-asunto.mjs`). Nada cambia en
`asuntos.json`. Versión publicada `App.VERSION`: `24-sep-2026 · 03:26`.

---

## 24-sep-2026 — Fila 105: Ajustes plegado

`docs/AJUSTES-PLEGADO.md`. Francisco veía Ajustes con demasiadas cosas a la vez. Ahora las tres
zonas (la pantalla de un tipo, "El centro" y "Mantenimiento") nacen plegadas, con un resumen en
cada título ("2 campos", "sin plazo", "faltan 2 datos"…) y la memoria de lo que se dejó abierto
en ese ordenador. Todo lo nuevo en `js/ajustes-plegado.js`; en los demás, pocas líneas.

- Decisión: el bloque del RegAlum.csv viejo no se esconde nunca, porque es también donde se
  configuran las épocas; con aviso, sube arriba y se abre. Los otros tres avisos de fallo
  (conflictos, fichas sin carpeta) y los dos que ya existían de la misma clase (hitos huérfanos,
  envolturas sin aplicar) solo se ven cuando hay algo.
- Decisión: los resúmenes que dependen de datos privados de otro módulo (plantillas, recurrentes,
  papelera) se cuentan en lo que ese módulo pinta, en vez de abrirle una puerta nueva.
- Lo que costó: reordenar los bloques de Mantenimiento en cada repintado devolvía arriba los
  normales, por encima del aviso que acababa de subir; el orden normal empieza ahora después de
  los bloques con aviso. Y mover un nodo al sitio donde ya está despierta igual a los
  observadores: solo se mueve si no está ya en su sitio.

Prueba nueva `pruebas/ajustes-plegado.mjs` (falla sin el cambio); cinco pruebas que trabajan
dentro de la pantalla de un tipo abren antes sus secciones. Batería completa en verde. Versión
publicada `App.VERSION`: `24-sep-2026 · 03:25`.

---

## 23-sep-2026 — Fila 104: el estado del asunto sale del hito abierto

`docs/ESTADO-POR-EL-HITO.md`. Los dos paneles de Asuntos abiertos que ya existían ("En el
departamento" / "A la espera de terceros", que decidía a mano el estado del asunto con su casilla
"Depende de otros") pasan a llamarse **Pendiente de Administración** y **Pendiente de terceros**,
y el asunto se coloca solo según su hito abierto. Se aprovecharon los paneles en vez de pintar dos
bloques nuevos dentro de la lista: ya tenían su cuenta, el buscador, los filtros y las tarjetas por
tipo funcionando dentro de cada uno.

- Cada responsable de Ajustes › Hitos lleva una casilla "Administración" (de partida, `yo` y
  `companero`). Los papeles fijos son siempre terceros; un hito sin responsable, Administración.
- `Hitos.aQuienLeToca` y `Hitos.ladoDelAsunto`, puras, en `js/hitos-a-quien.js` (nuevo: `js/hitos.js`
  ya pasaba de 400 líneas). En terceros, la tarjeta dice en pequeño quién lo tiene.
- Asuntos sin hitos: por la marca de su estado, la misma `espera` de siempre, que en Ajustes se
  enseña ahora al revés, como "Administración", para que las dos casillas digan lo mismo.
- Decisión: `HitosBiblioteca.naceSoloInformativo` no tenía, en la práctica, ningún "responsable de
  Administración" configurado (nadie le pasaba ese dato); ahora admite los `ajustes` y usa la misma
  marca, para que no haya dos sitios que digan quién es Administración. "Qué me toca" también.
- `asuntos-lista.js` (más de 700 líneas) no se partió: el cambio allí son unas pocas líneas y todo lo
  nuevo vive en el fichero aparte.

Comprobado con `pruebas/estado-por-el-hito.mjs` (19 casos) y, a mano en un navegador local, que un
asunto recién creado sale en Administración y, al marcar hecho su primer hito (de Dirección), pasa
solo a terceros con "Dirección" en la tarjeta. Batería completa en verde. Versión publicada
`App.VERSION`: `23-sep-2026 · 22:05`.

---

## 23-sep-2026 — Fila 103: el hito, mesa de trabajo (segunda tanda)

`docs/EL-HITO-MESA-DE-TRABAJO.md`. Segunda tanda de que el hito sea la mesa de trabajo del
asunto, sobre lo que dejó la fila 102: añadir documentos desde el propio hito, un menú para cada
uno ya apuntado, y "Comunicar" siempre a la vista.

**1. "Añadir documento"**: sustituye al botón suelto "Apuntar un documento" por un único botón que
abre un menú pequeño (`js/hitos-anadir.js`, nuevo) con tres caminos: **Desde el ordenador** (reabre
el cuadro de siempre de `js/documentos.js`, ahora con un `{hito}` opcional que hace que lo que se
guarde quede apuntado solo); **Desde "Por clasificar"** (elige uno de los documentos sueltos y
sigue el mismo camino que "Meter aquí", con el mismo `{hito}`; sin ninguno, sale deshabilitado con
"(no hay ninguno)"); y **Uno que ya está en la carpeta** (el cuadro de siempre, sin cambios). Para
que el segundo camino llegara con el hito hasta el final, `App.meterSueltoEnAsuntoElegido` y
`App.llevarSueltoA` (`js/documentos-sueltos.js`) ganan un parámetro `opciones` que solo viaja, sin
tocar su lógica.

**2. El menú de tres puntos de cada documento del hito** (`js/hitos-documento-menu.js`, nuevo), en
vez de la ✕ de siempre: Registrar (si le falta), Separar, Unir, Sacar páginas y Ajustar tamaño
(solo PDF, mismo criterio que en la carpeta del asunto) y, siempre, "Quitar del hito" (el mismo
efecto que la ✕: desapunta, nunca borra el fichero). Cualquier documento que salga de una de esas
herramientas queda apuntado solo al mismo hito: una función pequeña y pura,
`HitosDocumentoMenu.ficherosNuevos(antes, después)`, compara el contenido de la carpeta antes y
después de la herramienta y apunta los que aparecen. Un documento "(ya no está)" solo trae "Quitar
del hito". Después de cualquier acción, `HitosPanel.desplegarAlAbrir` deja el hito desplegado él
solo, sin que haga falta volver a pulsar el título — un detalle que la propia prueba de navegador
cazó (ver "Lo que costó de verdad").

**3. "Comunicar" siempre visible**: antes solo salía si el paso tenía su propio texto de correo o
de Séneca; ahora sale siempre (salvo en un hito "decision" o "noaplica", igual que "Generar
documento"). Con texto propio, igual que hasta ahora. Sin él, el cuadro se abre con el desplegable
de plantillas del tipo — los dos canales quedan disponibles, en vez de ninguno. Los documentos que
el hito ya tiene en la carpeta salen premarcados en "Documentos de este asunto" del cuadro de
Correo, por un nuevo `extra.adjuntosMarcados` que sube desde `js/hitos-comunicar.js` hasta
`CorreoAdjuntos.pintarBloque` (`js/correo-adjuntos.js`), filtrando primero los que ya no estén.
Cuando se prepara un correo con documentos, la constancia en el historial del hito (y en la nota
del asunto) termina en "· con N documentos: a, b" — `CorreoNucleo.sufijoDocumentos`, una función
pura nueva en `js/correo.js`, que reutiliza el mismo `textoDeLaNota`/`apuntarElRastro` de siempre:
ni un camino aparte ni una copia de esa lógica.

**Ficheros nuevos**: `js/hitos-anadir.js`, `js/hitos-documento-menu.js`,
`pruebas/el-hito-mesa-de-trabajo.mjs` (puro, sin navegador). Todo lo demás, unas pocas líneas cada
uno: `js/hitos-panel-lista.js`, `js/hitos-comunicar.js`, `js/documentos.js`,
`js/documentos-sueltos.js`, `js/archivo-personas.js`, `js/asuntos-lista.js`,
`js/correo-adjuntos.js`, `js/correo.js`, `index.html`.

**Lo que costó de verdad**: dos cosas, ninguna en la aplicación, las dos cazadas por las propias
pruebas antes de subir nada. La primera, al escribir la prueba de navegador del punto 2: después
de "Quitar del hito" (que ya deja el hito desplegado solo, como se explica arriba), un clic de más
sobre el título del hito lo volvía a plegar sin querer, y el siguiente paso de la prueba —abrir
"Añadir documento"— se quedaba 30 segundos esperando un botón invisible. Se quitó ese clic de más
y se dejó la razón por escrito, para que no se repita. La segunda, en la propia subida a `main`:
la primera llamada por lotes se quedó corta sin avisar y dejó tres ficheros modificados
(`js/archivo-personas.js`, `js/asuntos-lista.js`, `js/correo-adjuntos.js`) con su contenido
antiguo; se detectó al comprobar cada fichero después de subir (regla 11 de `docs/COLA.md`) y se
repitió uno a uno hasta que los doce quedaron bien. Ninguna de las dos tocó la aplicación
publicada: la primera se cazó antes de dar la fila por buena, y la segunda antes de que Francisco
la viera.

Comprobado con `pruebas/el-hito-mesa-de-trabajo.mjs` y, en el navegador de verdad, con los
bloques nuevos de `pruebas/hitos.mjs` y `pruebas/quedarse-en-el-asunto.mjs` y la sección 1
reescrita de `pruebas/comunicar-desde-hito.mjs`. Batería completa en verde (106 ficheros de
prueba). Versión publicada `App.VERSION`: `23-sep-2026 · 20:57`.

---

## 23-sep-2026 — Fila 102: generar documentos desde el hito

`docs/DOCUMENTOS-DESDE-EL-HITO.md`. Primera tanda de que el hito sea la mesa de trabajo: las
plantillas de documento se unen a un paso de la guía (o a un modelo de la biblioteca) en
«Documentos de este paso», y el hito trae «Generar documento», que deja el papel apuntado a él.
Todo lo nuevo, en dos ficheros nuevos (`js/guias-documentos.js`, `js/hitos-generar.js`); en
`js/guias.js` y `js/plantillas-documento.js` solo unas pocas líneas.

**Una decisión que el documento dejaba abierta**: `{hecho:…}` pedía la fecha en que se marcó hecho
otro hito, «del historial». Los hitos no guardaban esa fecha en ningún sitio: desde esta fila se
apunta `hechoEl` al marcarlo (y al elegir la opción de una pregunta). Los de antes se quedan sin
ella: no se inventa.

**De paso**: editar un modelo de la biblioteca perdía sus formularios (el editor no se los pasaba);
«Comunicar» desde un hito no encontraba su paso si estaba dentro de una pregunta de dentro (fila
95); y el aviso de «huecos sin dato» al generar pasa de rojo a ámbar (el documento ya está hecho).
`pruebas/ajustes-por-tipo.mjs` buscaba la sección del plazo por el texto «Plazo», que ahora sale
también en la tabla de huecos: busca el campo.

: repintar solo lo que ha cambiado

`docs/REPINTAR-SOLO-LO-QUE-CAMBIA.md`. Tras guardar, la aplicación repintaba casi todo: cambiar el
estado desde la ficha eran 30-40 lecturas (la lista entera aunque estuviera oculta, sus 17
enganches, y la ficha entera). Se midió antes de tocar nada, con una prueba que cuenta llamadas a
`Carpetas`: el mayor gasto era el observador de «Generar documento», que releía `plantillas.json`
siete veces por tanda. Ahora el cambio de estado solo relee y escribe `asuntos.json`.

Dos fallos de paso: la fila «Formularios» de la ficha no salía nunca (`filasHtml` ignoraba su
segundo parámetro; un comentario decía que era a propósito por una prueba, que ahora cuenta solo
las filas visibles), y `js/formularios.js` usaba `Hitos.hitosDe` como si fuera síncrona. Al
arreglar lo segundo, su observador empezó a leer `hitos.json` en cada cambio de pantalla (antes
fallaba en silencio): la prueba de lecturas lo cazó, y ahora solo calcula cuando la fila es nueva.

Sin partir `js/ficha-asunto.js` (pasa de 1.000 líneas): los cambios han sido pocos y localizados,
y partirlo a la vez que se cambia su repintado era arriesgar las dos cosas.

: avisos que dicen la verdad, y botones que se bloquean de verdad

`docs/AVISOS-QUE-DICEN-LA-VERDAD.md`. Muchas acciones guardaban lo importante y luego hacían más
cosas en el mismo `try`: si fallaba una de las de después, salía rojo «No he podido…» con todo ya
guardado, y al repetir, «Ya hay…». Ahora cada una separa lo principal (rojo si falla) de lo
accesorio (ámbar), con `U.fallo` y `U.accesorio`. De paso, los ~150 avisos que pegaban `e.message`
en inglés pasan por `U.mensajeDeError`.

**El botón que se volvía a encender solo**: `aplicarModoConsulta` ponía `disabled=false` a TODOS
los controles de la ficha cada vez que el observador veía algo nuevo, también al que decía
«Guardando…» y a las casillas de hito de un asunto archivado. Ahora solo toca lo que él mismo
apagó y respeta la marca `data-guardando` de `U.mientrasGuarda`.

**Un cuadro sobre otro** dejaba colgada para siempre la espera del primero (un solo `#capa`):
ahora se da por cancelado. Lo que costó: los avisos nuevos tenían que pasar por `U.aviso` (no por
la función interna) para que las pruebas que lo sustituyen los vean; sin eso, una prueba sin
navegador reventaba con `setTimeout is not defined`.

Queda sin hacer, a propósito: partir `js/ficha-asunto.js` (pasa de 1.000 líneas), porque aquí
solo se ha tocado en unos pocos sitios (tampoco se partió en la 101: ver su entrada).

: guardar en fila y sin trabajo de más

`docs/GUARDAR-EN-FILA.md`. Francisco: al grabar sale un error o la pantalla se queda congelada,
aunque al volver a entrar sí se ha guardado. Las causas, de la revisión a fondo:

- **La copia del día se rehacía en cada guardado.** `Copias` preguntaba con `Carpetas.existe`, que
  busca una CARPETA: con un fichero siempre decía «no existe». Cada guardado releía, reescribía la
  copia y listaba `copias/` entera. Las pruebas no lo veían porque el disco de mentira no distingue
  carpeta de fichero; la prueba nueva sí (como el navegador de verdad).
- **Nada ponía los guardados en fila.** Dos a la vez leían antes de que escribiera el otro, y ganaba
  el último. `js/cola-guardado.js`: una cadena de promesas por fichero.
- **Leer no reintentaba**, y un `NotReadableError` de Dropbox tumbaba el segundo paso.
- **Las tareas de fondo** (presencia, vistazo a la carpeta, conflictos) se cruzaban con el guardado;
  el vistazo, a mitad de un archivado, veía desaparecer la carpeta y sacaba de la ficha en rojo.
- **Tres riesgos de perder datos**: un `asuntos.json` leído vacío se escribía encima; las copias en
  conflicto se quedaban fuera al trasladar una carpeta y se borraban con el original; la fusión de
  conflictos perdía todo lo que no fuera `asuntos`.

**Lo que costó**: la guardia de «lectura vacía» comparaba al principio con lo que había en memoria,
y una prueba (`archivo-indice.mjs`) mete fichas solo en memoria: la guardia saltaba y el archivado
no se hacía. Se compara con lo último leído o escrito en el disco. Y otra lección de la fila 92:
las pruebas sin navegador no cargan `js/cola-guardado.js`, así que todo lo usa con `window.` y sin
él guarda igual.

: preguntas dentro de las respuestas, sin límite de niveles

`docs/PREGUNTAS-DENTRO-DE-LAS-RESPUESTAS.md`. Reabre a propósito lo que estaba descartado
(«opciones dentro de opciones en la guía»): los procedimientos del centro lo necesitan. La línea
sale de la lista de descartado.

- **Modelo** (`js/guias.js`): `normalizarOpciones` ya no vacía `opciones` ni recorta campos en los
  pasos de una opción; `normalizar` es recursivo. Un paso-pregunta, a cualquier nivel, sale sin
  requisitos, comunicación, normativa ni formularios.
- **Editor**: entrar y salir como en carpetas, dentro del mismo `U.preguntar` (solo hay uno). El
  truco fue separar `nivel` (lo que se ve) de `pasos` (lo que se guarda), y cambiar `recoger()`
  para que actualice los objetos por su id en vez de rehacerlos: antes rehacía los pasos de una
  opción con cinco campos, y con preguntas de dentro eso se habría llevado sus opciones.
- **Hitos**: `Hitos.visibles` cortaba solo la sublista de una pregunta de dentro sin responder, y
  seguía enseñando lo de después de la de fuera. Ahora corta la lista entera. Cambiar de rama poda
  todo el subárbol (`podar`), y `huerfanos` recoge lo trabajado de cualquier nivel.

: el botón «Ruta» de la ficha del asunto

`docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md`. Francisco pidió un botón que abriera la carpeta del
asunto; el navegador no lo deja (sigue en la lista de descartado), así que se copia la ruta para
pegarla en el explorador. Los manejadores de carpeta no saben su ruta de verdad, así que la parte
de delante la apunta cada uno en Ajustes → El centro, y se guarda en `localStorage`, no en
`_GESTOR`: la ruta del ordenador de Francisco no existe en el de su compañero. Módulo nuevo
`js/copiar-ruta.js`, que se crea su propio bloque en Ajustes. `pruebas/copiar-fila.mjs` cuenta
ahora un botón más.

: campos propios en el nombre de un documento

`docs/CAMPOS-EN-EL-NOMBRE-DEL-DOCUMENTO.md`. Cada tipo de documento puede llevar campos (texto,
lista o fecha, obligatorios si se quiere) que entran en el nombre entre el tipo y el texto
adicional. Módulo nuevo `js/documentos-campos.js`.

**Dónde se guardan, y por qué ahí.** `tipos-documento.json` es una lista de nombres que usan la
fusión de borrados, la papelera y la guardia de duplicados: convertirla en objetos tocaba todo
eso. Los campos van a `campos.json`, clave `porTipoDocumento`, que ya es compartido, con copia y
releído antes de escribir. Ojo con una trampa: `Campos.normalizar` reconstruye el objeto entero,
así que cualquier clave nueva que no se añada ahí se borra en el siguiente guardado de otro trozo
(la prueba lo comprueba). La clave solo se escribe cuando hay algún campo.

Un campo de fecha entra como `AAMMDD`, igual que la fecha del documento.

: cambiar el tipo de un asunto ofrece la guía del nuevo

`docs/CAMBIAR-EL-TIPO-CAMBIA-LA-GUIA.md`. Hasta ahora, cambiar el tipo en «Editar el asunto»
renombraba la carpeta pero dejaba los hitos del tipo viejo sin decir nada. Ahora pregunta (lo
eligió Francisco: a veces el cambio es solo para corregir el nombre). Módulo nuevo
`js/hitos-cambio-de-tipo.js`, llamado desde `App.editarAsunto` solo cuando carpeta y ficha ya han
salido bien. Los hitos viejos con algo apuntado no se pierden: campo nuevo `delTipoAnterior`, que
`Hitos.visibles` salta y `Hitos.huerfanos` pliega abajo, con la misma pantalla que los de una rama
descartada.

**Una decisión que el documento dejaba abierta**: pedía conservar los hitos «hechos o en curso»,
pero también que con hitos intactos se sustituyeran todos. Un asunto recién creado ya tiene el
primero en curso sin que nadie haya hecho nada, así que "en curso" solo no cuenta como trabajo; sí
cuentan hecho, notas, documentos, requisitos marcados y una rama elegida.

: el nombre corto del tipo, también en los filtros y en la tarjeta

`docs/NOMBRE-CORTO-EN-LOS-FILTROS.md`. Las tarjetas «Por tipo de asunto» y la etiqueta del tipo
en cada tarjeta enseñan ahora el nombre corto (el largo, al pasar el ratón). Dos funciones nuevas
en `js/nombres.js`, `tipoParaVer` y `nombresDeTipo`. Se sigue agrupando por el nombre de verdad:
la prueba monta dos tipos con el mismo nombre corto y comprueba que salen dos tarjetas y que cada
una filtra solo lo suyo. El buscador encuentra por los dos nombres, abierto y archivado; en el
ARCHIVO se resuelve al buscar, así que nadie tiene que reconstruir el índice. Ojo al escribir la
prueba: la lista de tipos de partida ya trae un `TRASLADO`, y un corto igual a un tipo existente
hace que `Nombres.leer` se quede con el otro (Ajustes ya lo avisa en rojo).

## 23-sep-2026 — Fila 93: no salir del asunto salvo cuando el usuario lo pide

`docs/QUEDARSE-EN-EL-ASUNTO-SIEMPRE.md`. Repaso completo, fichero a fichero, de todo `js/` en
busca de una salida indebida de la ficha (`App.ir(` hacia otra pantalla, u ocultar
`#pantalla-asunto` fuera de las cuatro salidas permitidas): `js/nucleo.js` (dónde vive `App.ir` y
`App.PANTALLAS`), `js/ficha-asunto.js`, `js/ficha-nombre-acciones.js`, `js/ficha-documentos.js`,
`js/hitos-documentos.js`, `js/hitos-panel.js`, `js/hitos-panel-lista.js`, `js/hitos-comunicar.js`,
`js/documentos.js`, `js/documentos-sueltos.js`, `js/documentos-sueltos-lector.js`,
`js/documentos-sueltos-sugerencias.js`, `js/registro.js`, `js/registro-sellado.js`, `js/correo.js`,
`js/correo-adjuntos.js`, `js/plantillas-documento.js`, `js/pdf-separar-unir.js`,
`js/preparar-documento.js`, `js/notas.js`, `js/relacionados.js`, `js/otros-del-tercero.js`,
`js/formularios.js`, `js/formularios-rellenar.js`, `js/asuntos-lista.js`, `js/asuntos-archivar.js`,
`js/asuntos-editar.js`, `js/asuntos-nuevo.js`, `js/asunto-renombrar.js`, `js/unir-asuntos.js`,
`js/borrados-fusion.js`, `js/papelera.js`, `js/fichas-huerfanas.js`, `js/ficha-archivo.js`,
`js/ficha-tercero.js`, `js/ficha-plegables.js`, `js/lo-pide.js`, `js/elegir-asunto.js`,
`js/duplicados.js`, `js/lector.js`, `js/visor.js`, `js/vista.js`, `js/usabilidad.js`, `js/barra.js`.

**No se ha encontrado ninguna salida indebida: el código ya cumplía la regla entera.** La fila 30
(17-sep-2026) y las que la siguieron (34, 51, 52, 58...) ya habían dejado cada camino bien hecho:
asociar un documento a un hito (`js/ficha-documentos.js`, botón "Asociar a un hito") y apuntarlo
desde el propio hito (`js/hitos-documentos.js`, "Apuntar un documento") repintan solo su propio
trozo, nunca navegan; marcar un hito, "Comunicar", "Documentos ▾", registrar, generar un
documento de plantilla y separar/unir/sacar páginas de un PDF llaman todos a `App.verAbiertos()`
(que ya reengancha sola la ficha desde la fila 30) o repintan en su sitio con
`App.abrirFicha(a, modo)`, nunca a `App.ir(otra-pantalla)`. "Meter en un asunto"/"Meter aquí" de
Por clasificar (`js/documentos-sueltos.js`, `js/documentos-sueltos-lector.js`) viven en la
pantalla "Por clasificar", nunca dentro de la ficha, así que no pueden sacar de ella; y cuando el
asunto de destino es el que antes tenía la ficha abierta, `App.verAbiertos()` no lo vuelve a
enseñar porque `App.reengancharFicha()` comprueba primero si la ficha sigue **a la vista**
(`#pantalla-asunto` sin `oculto`), no solo si `actual` sigue puesto.

Se ha ampliado `pruebas/quedarse-en-el-asunto.mjs` con once casos más: marcar un hito, asociar un
documento a un hito, apuntar un documento desde el hito, comunicar, "Documentos ▾", y "Meter en
un asunto" hacia el asunto que antes tenía la ficha abierta (los seis, se quedan); y Volver,
Editar (aunque se cancele), Borrar, Escape, y el asunto que deja de estar abierto desde el otro
ordenador (los cinco, sí salen, con el aviso de una línea en el último caso). Quince
comprobaciones en total, sobre las cuatro que ya había.

**Lo que costó de verdad**: nada en el código de la aplicación, porque no hacía falta tocarlo. Lo
que costó fueron las pruebas nuevas. La primera sesión que tocó esta fila no tuvo `git push` ni
pudo montar el repositorio completo en un navegador local, así que escribió los quince casos
nuevos sin poder correrlos, y los dejó publicados así, con una nota pidiendo a la siguiente sesión
que los verificara. Esta segunda sesión sí ha podido clonar el repositorio (con `git clone` de
lectura; sigue sin permiso para `git push`, así que la subida a `main` pasa igual por la
herramienta de GitHub) y correr `npm test` de verdad en local, con `python3 -m http.server` y
Playwright. Tres de los quince casos nuevos fallaban, los tres por errores en la propia prueba,
nunca en la aplicación:

- El caso 6 (apuntar un documento a un hito) y otros tres esperaban a que el cuadro se cerrara con
  `pagina.waitForSelector('#capa.oculto')`. Con `.oculto { display: none !important; }`, ese
  selector nunca puede quedar "visible" — el propio Playwright no lo resuelve nunca así, y la
  prueba se quedaba esperando 30 segundos sin motivo. Cambiado a `pagina.waitForTimeout(400)` tras
  el clic en Aceptar, que es el patrón que ya usan `pruebas/registro.mjs` y el resto del
  repositorio para lo mismo. El caso 10 (que si sale hacia la lista, no hacia la ficha) se cambió
  en su lugar a esperar `#pantalla-abiertos:not(.oculto)`, que es el estado de verdad que ese caso
  comprueba.
- El caso 10 ("Meter en un asunto") buscaba el asunto de pruebas por su nombre en el cuadro de
  «Elegir el asunto», y no lo encontraba: ese asunto se había creado a mano, con una carpeta
  directamente en el disco de mentira, sin pasar nunca por `App.anotar`, así que no tenía ninguna
  entrada en `asuntos.json` y `ElegirAsunto.todos()` no lo veía. Arreglado dando de alta el
  asunto con `App.anotar(nombre, {})` (sin categoría ni tercero, que es lo que necesitaba seguir
  probando el caso 11) nada más crear la carpeta, antes del primer paso.
- El caso 12 (el segundo asunto, para Escape/Editar/Borrar) esperaba su tarjeta con
  `pagina.waitForSelector('.tarjeta', { hasText: 'PERMISO' })`: `waitForSelector` no admite
  `hasText` (eso es de `locator()`), así que la opción se ignoraba y la prueba esperaba a que
  fuera visible la primera `.tarjeta` que hubiera en toda la página — que podía ser la de un
  documento suelto de un paso anterior, nunca la buscada. Cambiado a
  `pagina.locator('#lista-abiertos .tarjeta', { hasText: 'PERMISO' }).first().waitFor()`.

Con los tres arreglos, las quince comprobaciones de `pruebas/quedarse-en-el-asunto.mjs` pasan, y
se ha corrido además la batería completa (`pruebas/*.mjs`, 97 ficheros): todas en verde, sin tocar
ningún otro fichero de la aplicación.

Sustituida en `docs/contexto/ASUNTOS.md` la línea vieja de la fila 30 por la lista completa y
actual de caminos revisados (ya lo había hecho la primera sesión). Versión publicada
`App.VERSION`: `23-sep-2026 · 15:47`.

## 23-sep-2026 — Fila 92: «Reintentar is not defined», la aplicación sin poder guardar

`docs/NADA-SE-GUARDA-REINTENTAR.md`. Desde la fila 90, `Carpetas.escribirTexto`/`escribirBytes`
llamaban a `Reintentar.escritura` a pelo: en un navegador con `js/carpetas.js` nuevo y un
`index.html` que no cargaba `js/reintentar-escritura.js`, fallaba **toda** escritura. Ahora pasan
por `conReintento(intento)`, que sin el módulo escribe sin reintento, y
`js/reintentar-escritura.js` se expone en `window.Reintentar`.

**De dónde salía la versión a medias.** `main` estaba bien (el `<script>` estaba, antes de
`carpetas.js`). La copia sin internet no lleva lista de ficheros escrita a mano
(`scripts/copia-local.mjs` copia `js/` e `index.html` enteros), y `vercel.json` ya manda
`max-age=0, must-revalidate` para todo, `index.html` incluido. Lo más probable: una copia a
medias, en la que un `.js` nuevo llega antes que el `index.html` que lo carga (Dropbox sincroniza
fichero a fichero al otro ordenador, y la actualización de la copia también escribe uno a uno).
Con el arreglo, ese estado a medias ya no deja a nadie sin guardar. **No se pudo mirar lo
publicado con `curl`**: esta sesión no tenía salida a `asuntos.fmargon.com` ni a `vercel.app`.

Prueba nueva `pruebas/scripts-cargados.mjs` (sin navegador): todo `js/*.js` en `index.html` y al
revés, el orden de los dos ficheros, y escribir con y sin `Reintentar`. Sin el arreglo, falla.

De paso, `docs/COLA.md` vuelve a dar por HECHAS la 89 y la 91: el commit que apuntó las filas 92
a 98 las había devuelto, por error, a BLOQUEADA y PENDIENTE.

## 23-sep-2026 — Fila 91: la copia sin internet se actualiza de verdad (y se cierra la 89)

`docs/COPIA-SE-ACTUALIZA.md`. La copia que Francisco abría en el instituto seguía en
`21-sep-2026 · 11:32` con la publicada en `14:49`, y sin decir nada. La copia pública estaba al
día: fallaba el ordenador. Dos agujeros, tapados los dos porque no se sabía cuál le había tocado:

- **`ABRIR EL GESTOR.html` solo guardaba la carpeta la primera vez.** Si la carpeta ya tenía
  `index.html`, iba directo a ella sin guardarla; en otro ordenador, navegador o perfil,
  `js/actualizar-copia.js` no encontraba carpeta y se callaba. Ahora la guarda siempre y, si ya
  está instalada, la pone al día antes de abrirla (mismo algoritmo: solo los sha256 distintos,
  `version.json` el último). Así, volver a guardar ese fichero y abrirlo rescata una copia vieja,
  que es la única salida para la de Francisco (su `js/actualizar-copia.js` es el viejo). Además,
  solo acepta una carpeta vacía, con `index.html` o con el propio `ABRIR EL GESTOR…`.
- **Sin permiso, solo un aviso pequeño abajo a la izquierda**, que no decía que había versión
  nueva. Ahora `js/actualizar-copia.js` mira PRIMERO la versión remota (si coincide con
  `App.VERSION`, no pide permiso ni toca el disco) y, si no puede actualizar sola, pinta una
  franja ámbar arriba, a todo el ancho, con las dos versiones y «Actualizar ahora» (pide permiso
  o carpeta con el clic, la guarda, actualiza y recarga).

**Contra el bucle**: antes de recargar se apunta en `sessionStorage` a qué versión y en qué
carpeta; si al volver la ventana sigue vieja, se escribió en otra copia: no se recarga más, se
olvida la carpeta y la franja dice desde qué carpeta abrir.

**La prueba** (`pruebas/copia-sin-internet.mjs`) pasó a usar copias de verdad de `copia-local/`
en una carpeta temporal, con el disco y la IndexedDB servidos desde Node (`exposeFunction`), para
que tras la recarga la página abra de verdad lo recién escrito y se pueda comprobar que
`App.VERSION` ya es la nueva. Sin el arreglo, falla. La parte 1 lleva ahora su propio servidor
"al día": la copia mira la versión remota lo primero, y sin él saldría a internet.

**La 89 queda HECHA**: Francisco creó `fmargon780/gestor-asuntos-copia` y el secreto, y la acción
publica desde el 21-sep-2026. `App.VERSION`: `23-sep-2026 · 14:28`.

## 21-sep-2026 — Fila 90: archivar sin avisos falsos ni errores en inglés

`docs/ARCHIVAR-SIN-AVISOS-FALSOS.md`. Al archivar un asunto desde su propia ficha (no desde la
tarjeta de la lista) salían dos avisos rojos sobrantes, aunque el archivado en sí salía bien: uno
de "otro ordenador" y otro con un `InvalidStateError` del navegador, en inglés, al intentar guardar
`_ficha.json`.

**Aviso 1, el falso "otro ordenador".** `App.cerrarAsunto` llama a `App.verAbiertos()` al terminar,
que reengancha la ficha abierta (`App.reengancharFicha`, `js/ficha-asunto.js`); como el asunto ya
no está en la lista (lo acaba de archivar este mismo ordenador), el aviso confundía su propio
archivado con uno ajeno. Arreglo: `App.E.recienArchivados` (`js/nucleo.js`), un conjunto en
memoria donde `App.cerrarAsunto` (`js/asuntos-archivar.js`) apunta la clave justo antes de llamar a
`App.verAbiertos()`; `App.reengancharFicha` lo consulta primero, y si está, vuelve a la lista sin
avisar (y borra la marca: es de un solo uso, para no confundir un archivado de verdad posterior del
otro ordenador con el mismo nombre).

**Aviso 2, Dropbox sincronizando al escribir `_ficha.json`.** La envoltura de `App.cerrarAsunto` en
`js/ficha-archivo.js` escribe `_ficha.json` justo después de mover la carpeta, y Dropbox a veces
todavía está sincronizando esa misma carpeta en ese instante. Dos piezas:
- `Reintentar.escritura(intento)` (nuevo `js/reintentar-escritura.js`, cargado justo antes de
  `js/carpetas.js`): un intento normal más hasta tres reintentos, con 0,5 s/1 s/2 s de espera por
  delante de cada uno, si `intento` falla con `InvalidStateError`/`NoModificationAllowedError`.
  Cualquier otro error se lanza a la primera. `Carpetas.escribirTexto`/`escribirBytes` pasan a
  llamarla, envolviendo la escritura entera (pide el manejador del fichero de nuevo en cada
  intento, nunca reutiliza uno viejo): como `Copias.guardar`, `guardarJson` y `_ficha.json` pasan
  todos por ahí, esto arregla de una vez toda escritura de la aplicación, no solo la del archivado.
- Si aun así los reintentos se agotan, la envoltura de `js/ficha-archivo.js` distingue ese caso
  (`Reintentar.esErrorDeSincronizacion(e)`) y avisa en **ámbar**, diciendo que no se ha perdido nada
  (la clave sigue en `asuntos.json`: el borrado va después de escribir `_ficha.json`) y que "Poner
  en orden las fichas del ARCHIVO" la recogerá sola. Cualquier otro error sigue en rojo, con
  `U.mensajeDeError(e)` en vez de `e.message` a pelo (también en la envoltura de
  `App.reabrirAsunto`, que no tenía este arreglo).

**Lo que costó de verdad, en la propia prueba.** El primer intento de simular el fallo cambiaba
`window.__disco.fich` (la función expuesta del disco de mentira de `pruebas/navegador.mjs`) — pero
`dir.getFileHandle` de ese disco llama a la función `fich` de su propio cierre léxico, no a esa
propiedad: cambiarla no tiene ningún efecto, y la prueba archivaba sin fallar nunca, dando un falso
verde. Arreglo: parchear en cascada el propio manejador de la carpeta ARCHIVO
(`pruebas/archivar-sin-avisos-falsos.mjs`, `hazQueFalleEnElArchivo`), envolviendo
`getDirectoryHandle`/`getFileHandle` de cualquier carpeta que cuelgue de ahí, para interceptar la
creación de `_ficha.json` sin tener que adivinar de antemano qué carpetas va a crear el archivado.

Prueba nueva, `pruebas/archivar-sin-avisos-falsos.mjs`, en navegador de verdad: archivar desde la
ficha abierta sin el aviso de "otro ordenador"; Dropbox fallando dos veces y saliendo bien a la
tercera, sin ningún aviso de más; y Dropbox fallando todo el rato, con el aviso ámbar y la ficha
todavía en `asuntos.json`. Se tuvo que añadir `js/reintentar-escritura.js` a la lista de ficheros
que cargan en su contexto `vm` otras 17 pruebas ya existentes que usan `js/carpetas.js` sin
navegador (`Carpetas.escribirTexto`/`escribirBytes` ahora llaman a `Reintentar`, que si no está
cargado revienta con `ReferenceError`).

Fila 90 HECHA. `App.VERSION`: `21-sep-2026 · 14:49`.

---

## 21-sep-2026 — Fila 89: la copia sin internet, bloqueada por el repositorio público

`docs/COPIA-SIN-INTERNET.md`, diseño cerrado por Francisco el mismo día. El filtro de red del
instituto (Junta de Andalucía) empezó a cortar también `asuntos.fmargon.com`, no solo
`vercel.app`, así que la aplicación necesitaba poder abrirse desde el disco (`file://`), con doble
clic, sin depender de esa dirección.

**Apartado 1 (que la app funcione en `file://`).** Nuevo `js/cargar-fichero.js`, con
`App.leerFicheroDeLaApp(ruta, tipo)`: en `http(s)` sigue siendo el `fetch` de siempre; en `file:`
inyecta un `<script src="copia-datos/<ruta con / cambiado por ~>.js">` que deja el dato en
`window.__COPIA__`, con carga perezosa y sin duplicar la inyección si dos módulos piden la misma
ruta a la vez. Contrato elegido: `'json'` devuelve el objeto ya interpretado, `'binario'` un
`Uint8Array`, igual que ya hacían a mano los cinco sitios de la tabla del diseño (`js/cargar-biblioteca.js`,
`js/formularios.js`, `js/formularios-rellenar.js`, `js/plantillas-documento.js` ×2), que pasaron a
llamar a esta función en vez de a `fetch` directo. Los tres módulos que repetían casi el mismo
`cargarPdfJs()` con `import('./lib/pdf.min.mjs')` (`js/registro-lector.js`,
`js/preparar-documento.js`, `js/pdf-separar-unir.js`) pasaron a llamar a la función compartida
`App.cargarPdfJs()`, también en `js/cargar-fichero.js`. `js/nucleo.js` gana `App.textoVersion()`
(`App.VERSION` + " · copia sin internet" cuando `location.protocol === 'file:'`), usada en las dos
líneas que antes pintaban `App.VERSION` a pelo.

**Apartado 2 (el paso que genera la copia).** `scripts/copia-local.mjs` (`npm run copia-local`,
nueva dependencia `esbuild`): copia `index.html`, `css/`, `js/` y `favicon.svg` tal cual, genera
`copia-datos/*.js` por cada JSON/PDF/`.docx` estático, construye `js/lib/pdf.iife.js` y
`pdf.worker.iife.js` con esbuild, copia el instalador (`scripts/plantillas-copia/ABRIR EL GESTOR.html`)
y escribe `version.json` con el sha256 de todo. No copia `docs/`, `pruebas/`, `herramientas/`,
`scripts/` ni `apps-script/`. `copia-local/` en `.gitignore`.

**Apartado 4 (se instala y se actualiza sola).** Nuevo `js/actualizar-copia.js` (solo actúa en
`file:`): compara `version.json` del disco con el de
`raw.githubusercontent.com/fmargon780/gestor-asuntos-copia/main/` (`cache: 'no-store'`), descarga
solo lo que cambió de sha256 (comprobando cada uno antes de escribir, `version.json` el último) y
recarga; sin internet, un aviso discreto (`U.aviso`) y arranca igual. El identificador de la
carpeta viaja en la misma IndexedDB que `js/almacen.js` (`gestor-asuntos` / `ajustes` /
`copiaCarpeta`), para que lo que guarda `ABRIR EL GESTOR.html` (autónomo, con su propia capa
mínima de IndexedDB, sin depender de ningún otro fichero de la copia) lo pueda releer luego este
módulo. El aviso ámbar de "hace falta el permiso otra vez" reutiliza el patrón de
`js/bandeja-pantalla.js` (caja + botón), colgado del `<body>` porque no hay un hueco fijo para él
en `index.html`.

**Lo que costó de verdad, un bug real de pdf.js:** `js/lib/pdf.min.mjs` trae, en su propio código
(no puesto por nadie del proyecto), un único `await` de nivel superior —
`globalThis.pdfjsLib = await (globalThis.pdfjsLibPromise = ...)` —, y esbuild no genera un
`<script>` clásico (`format: 'iife'`) a partir de un módulo con `await` de nivel superior: solo lo
admite en `format: 'esm'`, que a su vez no se puede cargar en `file://` (es la misma restricción de
`import()` que se quería evitar). Comprobado a mano con Playwright que `__webpack_require__(228)`
(lo que hay a la derecha del `await`) es de verdad una promesa ahí dentro: quitar el `await` sin
más deja `globalThis.pdfjsLib` con la promesa sin resolver, y `pdfjsLib.getDocument` vacío. La
solución final: `scripts/copia-local.mjs` quita ese único `await` del texto antes de pasarlo a
esbuild (comprobando primero que el patrón exacto sigue ahí, para que una subida de pdf.js no lo
rompa en silencio), sin `globalName` (así esbuild no envuelve el resultado en un `var pdfjsLib =
(()=>{...})()` que pisaría, al final, la asignación de verdad); y `App.cargarPdfJs()`, ya en el
navegador, espera esa promesa si hace falta (`if (typeof lib.then === 'function') lib = await lib`)
antes de dar la librería por cargada. El worker (`pdf.worker.min.mjs`) no tenía este problema: se
autoasigna `globalThis.pdfjsWorker` de forma síncrona, y pdf.js lo usa para montar el "fake worker"
en el hilo principal sin crear ningún `Worker` de verdad ni pedir `workerSrc`, en cuanto lo
encuentra ya puesto.

**Lo que costó de verdad, en la propia prueba de la actualización:** el primer intento de
`pruebas/copia-sin-internet.mjs` fabricaba el disco de mentira (y el `indexedDB` de mentira) con
`page.addInitScript`, el mismo truco que usa `pruebas/navegador.mjs` para toda la aplicación — pero
`js/actualizar-copia.js` hace `location.reload()` cuando actualiza, y un `addInitScript` se vuelve a
ejecutar en cada navegación: la página recién recargada "olvidaba" lo que se acababa de escribir,
porque recreaba el disco de mentira desde cero con el contenido viejo. Solución: `page.exposeFunction`
sí sobrevive a una recarga, así que el disco de mentira pasó a vivir en el propio proceso Node (un
mapa `ruta -> contenido`), y la página solo llama a `window.__disco(accion, ruta, datos)`. Aparte,
el servidor HTTP de mentira necesitó la cabecera `Access-Control-Allow-Origin: *` (como
`raw.githubusercontent.com` de verdad): una página `file://` tiene origen `"null"`, y sin CORS
abierto el `fetch` de `js/actualizar-copia.js` falla con el mismo error que si el servidor
estuviera apagado, dando un falso "sin internet, arranca igual" que en realidad escondía un
servidor de pruebas mal configurado. Y el puerto `1` (usado a mano para simular "nadie escucha
ahí") es de los que Chrome bloquea siempre por seguridad (`ERR_UNSAFE_PORT`): la prueba final abre
y cierra un servidor real para quedarse con un puerto libre de verdad, en vez de inventarse uno.

**Bloqueada, no HECHA:** el apartado 3 del diseño (publicar la copia en un repositorio público
nuevo, `fmargon780/gestor-asuntos-copia`, con una GitHub Action) no se pudo completar por dos
motivos: la API de GitHub de esta sesión devolvió `403 Resource not accessible by integration` al
intentar crear el repositorio, y esta misma sesión (en la nube) tiene bloqueado por su propia
configuración de seguridad tocar `.github/workflows/` de cualquier repositorio. El workflow, en
cambio, sí tiene que vivir en `.github/workflows/` de **este** repositorio privado
(`gestor-asuntos-ies`, no en el público): es aquí donde ocurren los `push` que lo disparan; solo
necesita permiso de escritura sobre el repositorio público, para subir ahí el resultado. Siguiendo
la opción 2 del propio diseño ("si la sesión no puede crear el repositorio público... dejarlo todo
preparado"), el contenido completo de la Action queda escrito en `docs/copia-publica.yml.txt`
(texto plano en vez del `.yml` real, con la nota de en qué repositorio va), y
`docs/CLAVE-COPIA-PUBLICA.md` explica a Francisco, paso a paso, cómo crear el repositorio público
vacío, añadir el workflow a este repositorio (con un enlace que abre GitHub ya con el nombre de
fichero puesto) y crear el token de grano fino y el secreto `COPIA_TOKEN`. `docs/INSTALAR-COPIA.md`
queda escrito también, avisando de que su primer paso depende de que se complete
`docs/CLAVE-COPIA-PUBLICA.md` primero (la dirección de
`raw.githubusercontent.com/fmargon780/gestor-asuntos-copia/...` no responde nada todavía). La fila
89 queda BLOQUEADA, no HECHA.

Prueba nueva, `pruebas/copia-sin-internet.mjs`: genera `copia-local/` y abre su `index.html` con
Playwright por `file://` (sin errores de consola, "copia sin internet" a la vista, la biblioteca y
el catálogo de formularios cargan desde `copia-datos/`, un PDF de `formularios/` se abre con pdf.js
como el lector, un `.docx` de `plantillas/` se lee con `Docx.leerEntradaDeTexto`), y
`js/actualizar-copia.js` con un servidor de mentira: descarga solo lo cambiado y recarga, y con el
servidor apagado arranca igual con el aviso. También se ajustó `pruebas/cargar-biblioteca.mjs`
(añadir `cargar-fichero.js` a la lista de ficheros que carga en su `jsdom` de mentira: sin él,
`App.leerFicheroDeLaApp` no existía y la prueba, que ya existía antes de esta fila, se rompía).

Batería completa en verde, una sola pasada al final. Versión publicada `App.VERSION`:
`21-sep-2026 · 11:32`.

---

## 21-sep-2026 — Fila 88: "Podría ir en...", sugerir un asunto ya existente desde "Por clasificar"

`docs/POR-CLASIFICAR-ASUNTO-EXISTENTE.md`. Desde la fila 41, el lector de "Por clasificar"
(`js/documentos-sueltos-lector.js`) ya proponía tipo, fecha, registro y tercero de un PDF suelto,
pero lo leído solo servía para crear un asunto nuevo. Esta fila lo usa también para encontrar un
asunto que ya existe.

**El módulo nuevo, `js/documentos-sueltos-sugerencias.js`** (`window.SugerenciasAsuntoExistente`)
no envuelve nada: `js/documentos-sueltos-lector.js` le pregunta directamente, en el mismo paso de
su cola (uno en uno, nunca en paralelo), justo después de leer el PDF y solo si ha reconocido un
tercero. Compara primero por documento —Nº de identificación escolar, los cuatro últimos
caracteres del documento del personal, o el NIF, el mismo código que va al final del nombre de la
carpeta (`js/nombres.js`)— y, si no hay documento en algún lado, por el nombre
(`ElegirAsunto.terceroDentroDe`, la misma pieza que ya usaba "Meter en un asunto"). Los abiertos se
miran en `App.E.listaAbiertos`, ya en memoria; los archivados, solo cuando no hay ningún abierto,
con el índice guardado del ARCHIVO (`_GESTOR/indice-archivo.json`) — nunca recorriendo el ARCHIVO
carpeta a carpeta.

**En la tarjeta**, debajo de la línea de lo leído, sale una línea por sugerencia («Podría ir en:
*nombre*», con «otro tipo» o «archivado» si toca) y su botón «Meter aquí», destacado. Con
sugerencias a la vista, "Aceptar" pasa a llamarse «Crear asunto nuevo» y a discreto. «Meter aquí»
reutiliza el mismo camino que "Meter en un asunto" (con su cuadro de "¿reabrir?" si el asunto está
archivado): se sacó `App.meterSueltoEnAsuntoElegido` de `App.meterSueltoEnAsunto`
(`js/documentos-sueltos.js`) para no repetir esa lógica en los dos sitios.

**Punto 8 del encargo**: "Meter en un asunto" también nota lo ya leído. `App.parecidoDelSuelto`
suma +50 si el tercero leído es el del asunto y +10 si el tipo leído es el del asunto, sin quitar
la puntuación de siempre (por palabras del nombre del fichero). Para eso, el lector expone
`window.LectorDeSueltos.resultadoDe(nombre)` (el resultado en caché de un fichero, si lo hay), y
`SugerenciasAsuntoExistente.esDelMismoTercero` queda exportado para no repetir la comparación de
documento/nombre en los dos sitios.

Prueba nueva, `pruebas/sugerir-asunto-existente.mjs`, en navegador de verdad, con cuatro empresas
distintas para no mezclar el estado de una con el de otra: un abierto del mismo tipo (sin marca);
cuatro abiertos (dos del tipo propuesto, dos de otro: salen tres, el tercero con «otro tipo»); sin
abiertos con dos archivados del mismo tipo y uno de otro (con «archivado», y "Meter aquí" pregunta
si reabrir); un abierto y un archivado del mismo tercero (solo sale el abierto); un documento sin
tercero reconocible (la tarjeta, igual que antes de esta fila); y que "Meter en un asunto" pone
arriba los asuntos del tercero leído. Comprobado que la prueba falla sin el cambio (se revirtieron
a mano los tres ficheros de código, sin la fila, y las pruebas 1 y 3 fallaron por falta de
sugerencias) antes de darla por buena.

**Lo que costó de verdad**: el cuadro de "ponerle nombre" que abre `App.meterSueltoEnAsunto`
(`App.verDocumentos`, `sinCancelar=true`) deja el botón Cancelar compartido (`#cuadro-cancelar`)
oculto hasta que otro cuadro con Cancelar lo vuelve a enseñar — no es un fallo nuevo de esta fila,
ya lo tenía "Meter en un asunto" desde siempre, pero la prueba lo destapó al encadenar varios
escenarios seguidos: el escenario del archivado (que sí necesita Cancelar) se puso antes que el
del abierto (que deja ese botón oculto al cerrarse), en vez de arreglar el cuadro compartido, que
no pedía el encargo.

**Aviso para quien lea el git log de esta fila**: al marcar la fila 88 como EN CURSO, una llamada
de subida se escribió con un valor de relleno en vez del contenido de verdad de `docs/COLA.md`
(35 caracteres, el mismo fallo de la regla 14 de `docs/COLA.md`, con otra causa: un parámetro sin
rellenar en la propia llamada, no una sustitución de shell). Se detectó al momento (tamaño de
salida muy corto) y se corrigió con una segunda subida, releyendo `docs/COLA.md` de antes de
tocarlo. Ninguna otra subida de esta fila lo repitió: todas se comprobaron con el tamaño en bytes
después de subir.

Batería completa en verde (94 ficheros de prueba), una sola pasada al final. Versión publicada
`App.VERSION`: `21-sep-2026 · 07:17`.

## 21-sep-2026 — Fila 86: pulsar la tarjeta de un documento la abre, y el aviso de huérfanas se calla 7 días

`docs/PULSAR-PARA-ABRIR-Y-AVISO-OCULTABLE.md`. Dos cambios, en una sola fila.

**1. Pulsar para abrir**, en toda la aplicación:

- `js/documentos-sueltos.js` ("Por clasificar"): la tarjeta entera llama a `App.abrirSuelto(s)`
  (que `js/visor.js` ya convierte en `Visor.abrir` con su marcador, como hacía el botón "Abrir").
- `js/documentos.js` (el cuadro "Documentos ▾"): no tiene panel de la derecha —es un cuadro modal
  con su propio visor a la izquierda—, así que pulsar la fila abre el mismo formulario que "Poner
  nombre", que ya enseña el documento mientras se rellenan los campos.
- `js/bandeja-pantalla.js` (bandeja de Gmail): solo si el correo trae su PDF, la tarjeta entera
  hace lo mismo que el botón "Leer el correo".
- `js/papelera.js`: un documento (o un suelto) se puede ver sin sacarlo de la papelera, resolviendo
  el handle igual que ya hace `devolverDocumento` (`carpetaPapelera()` →
  `getDirectoryHandle(ficha.carpeta)` → `getFileHandle(ficha.nombre)`).
- `js/ficha-documentos.js` ya cumplía (el nombre ya era un botón), y con él el ARCHIVO, que
  reutiliza esa misma pieza. `js/duplicados.js` no se toca: enseña carpetas de asuntos, no
  documentos.

Guardia común en los cuatro sitios tocados: `ev.target.closest('button, a, input, select,
textarea, label, .acciones')` antes de abrir nada, para que ningún botón de la fila —ni el menú de
tres puntos— dispare una apertura doble.

**2. El aviso de "fichas sin carpeta"** gana una ✕ (`js/avisos-que-faltan.js`) que lo calla 7 días.
Se guarda en `localStorage` (clave `aviso-huerfanas-callado`, nunca en `_GESTOR`: es una
preferencia de quien está delante del ordenador, no un dato del centro), con hasta cuándo calla y
cuántas fichas había al ocultarlo: si aparecen más antes de que pasen los 7 días, el aviso vuelve
solo. La decisión de pintar o no sale de una función sin pantalla, `sePintaHuerfanas(nAhora,
guardado)`, expuesta en `window.AvisosQueFaltan._sePintaHuerfanas` para poder probarla sola. El
aviso de la papelera vieja se queda sin ✕: la única salida sigue siendo decidir, porque son datos
de menores.

Pruebas ampliadas: `pruebas/documentos-sueltos.mjs` (test 7: pulsar la tarjeta abre el visor, y el
menú de tres puntos no lo hace) y `pruebas/avisos-que-faltan.mjs` (los cinco casos del callado:
sin nada guardado, recién ocultado, a los 3 días, a los 8 días, y con una ficha más). Batería
completa en verde, una sola pasada al final. Versión publicada `App.VERSION`: `21-sep-2026 ·
04:20`.

## 21-sep-2026 — Fila 85: las dos direcciones corregidas, fila cerrada

`datos/formularios.json`: la clave `u` de `O11:VI` y `O11:VII` pasa de
`https://www.juntadeandalucia.es/boja/2011/132/1` (la página web del BOJA, no un PDF) a
`https://www.juntadeandalucia.es/boja/2011/132/d1.pdf` (el PDF de verdad), como pedía el
documento. Las otras nueve direcciones del fichero y las cuatro entradas `via:"protocolo"`
(`O11:I` a `O11:IV`) no se tocan. Cierra la fila 85, bloqueada el 20-sep-2026 por falta de salida
a internet y ya resuelta en cuanto a los PDF: Francisco los subió a mano a `formularios/`
(`docs/FORMULARIOS-DESDE-EL-ZIP.md`), solo quedaban estas dos direcciones por corregir en el
JSON. Con esta fila y la 86, `docs/COLA.md` vuelve a quedar sin ninguna PENDIENTE.

## 21-sep-2026 — Fila 87: que el enlace de la normativa abra el artículo, no el bloque entero

`docs/ENLACE-AL-ARTICULO-DE-NORMATIVA.md`. Francisco pulsó la cita de un artículo en el bloque
"Normativa" de un hito y la aplicación le llevó a la página entera del bloque, sin abrir el
artículo. Tres causas, comprobadas contra la web publicada:

1. **La página limpia del artículo no estaba publicada** en `fmargon780/normativa-escolarizacion`
   (fusionada en `main` de aquel repositorio pero sin relanzar la publicación de Vercel). Ya
   resuelto por Francisco el propio 21-sep-2026, fuera de este repositorio: **un `main` fusionado
   no significa publicado**, hay que comprobarlo siempre.
2. **El Gestor enlazaba al bloque, no al artículo.** `HitosBiblioteca.enlaceDeNormativa`
   (`js/hitos-biblioteca.js`) montaba `<base>/<bloque>#r=<clave>`; ahora monta
   `<base>/norma#r=<clave>`, la vista de un solo artículo que pide `docs/ENLACE-POR-ARTICULO.md` de
   aquel repositorio. El bloque deja de intervenir en el enlace (sigue guardado, solo para saber
   dónde vive el artículo): la condición pasa de `bloque && clave && base` a `clave && base`. A
   `direccionBase` se le quita la barra final y, si lo llevara ya, un `/norma` final, para que no
   salga `/norma/norma`. La clave va por `encodeURIComponent`.
3. **La clave de ejemplo inducía a error**: `ROC-40.1` (con apartado) en vez de `ROC-40` (artículo
   entero, la única forma que la vista de un solo artículo sabe abrir). `js/hitos-normativa.js`
   cambia el marcador de posición, añade una línea de ayuda fija bajo la lista de referencias y un
   aviso suave por fila (nunca bloquea, nunca cambia lo escrito) cuando la clave tecleada lleva un
   punto. El desplegable de bloques pierde su frase "o enlace propio": ya no hace falta un bloque
   para que el enlace funcione.

También se retocó el texto de ayuda del campo "Dirección del sistema de normativa"
(`js/plantillas-ajustes.js`, montado por JS para no tocar `index.html`, que sigue siendo el dueño
de ese campo): la dirección exacta a escribir, `https://normativa.fmargon.com`, y el aviso de que
la red del instituto bloquea las direcciones `vercel.app`. Ningún valor guardado cambia, solo el
texto.

`pruebas/biblioteca-de-hitos.mjs`, apartado 8, reescrito con las seis comprobaciones del encargo
(clave sola, clave con bloque —mismo resultado—, base ya terminada en `/norma`, solo `url`, nada,
clave con base vacía). El apartado 9 (el espacio de la clave, guardado como guion) se queda como
estaba.

Esta sesión no tiene salida a internet a dominios fuera de la lista permitida (mismo motivo que las
filas 63 y 85): no ha podido comprobar con `curl`/`WebFetch` que
`https://normativa.fmargon.com/normas/ROC.json` responda 200 con la clave `ROC-40`. El código de
aquí queda igualmente correcto y probado con `npm test`; falta esa comprobación externa, para
quien la pueda hacer.

## 20-sep-2026 — Fila 85: bloqueada, sin salida a internet

`docs/COLA.md` pedía copiar a `formularios/` los once PDF en blanco que la fila 84 no pudo bajar
(`O-I.pdf` a `O-IX.pdf`, `O11-VI.pdf`, `O11-VII.pdf`, con sus direcciones de origen ya en
`datos/formularios.json`). Esta sesión probó dos caminos —`curl` directo y `WebFetch`— contra
`www.juntadeandalucia.es`, y los dos devolvieron el mismo rechazo del proxy de la organización
(`CONNECT tunnel failed, response 403` / `EGRESS_BLOCKED`): sin salida a internet, exactamente el
mismo motivo que ya bloqueó las filas 63 y 84. No queda ninguna fila PENDIENTE en `docs/COLA.md`;
queda esta, apuntada, para la próxima sesión con salida a internet general (o para que Francisco
copie los once PDF a mano en la carpeta `formularios/` del repositorio).

## 20-sep-2026 — Fila 84: el impreso, con los datos del centro ya puestos

`docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md`. Última de las cuatro filas acordadas de golpe el
20-sep-2026 (81 a 84): la 81 y la 82-83 las completó otra sesión en paralelo (PR #63, fusionada a
`main` mientras esta sesión hacía su propia fila 81 sin saberlo — se descartó esa duplicada, PR
#64, cerrada sin fusionar, y se sincronizó la rama con `main` antes de seguir).

**La regla que no se toca sin volver a hablarlo, escrita para que nadie la deshaga sin saberlo:**
un impreso oficial preparado con "Preparar para el tercero" rellena SOLO los datos del centro y el
año académico, nunca los de la persona (nombre, documento, domicilio, teléfono, tutores…), aunque
la aplicación los tenga. Es a propósito, decisión de Francisco: así, al recibir el impreso de
vuelta, se ve si algún dato de la persona ha cambiado desde la última vez. Un impreso que llega ya
relleno del todo no sirve para comprobar nada de eso. Queda anotado en "Descartado" de
`docs/CONTEXTO-CORTO.md`.

**Sin salida a internet para copiar los PDF de verdad**, como ya le pasó a la fila 63 (19-sep-2026):
el catálogo (`datos/formularios.json`, de la fila 82) ya trae la clave `f` con el nombre del PDF en
las once entradas de vía `descarga`/`centro`, pero la carpeta `formularios/` se queda vacía. Todo
lo demás —el mapa de casillas, `proponerMapa`, `rellenarPdf`, la pantalla de Ajustes y el botón—
está hecho y probado con PDF de mentira montados con la propia pdf-lib (que es, además, más fiable
que probar contra un PDF real de la Junta que puede cambiar de un día para otro). El mecanismo
funciona en cuanto se copien los once PDF, uno a uno, sin tocar ni una línea de código: la lista de
cuáles faltan queda en `docs/COLA.md`. Es exactamente el caso que el propio encargo preveía.

**Por qué `proponerMapa` mira "código" antes que "centro".** La regla de la tabla dice "centro,
denominación, instituto (y no código)": una casilla llamada "código del centro" contiene la
palabra "centro", así que si la regla de `{{CENTRO}}` se mirase primero, ganaría por error. El
orden de las comprobaciones es la propia regla, no un detalle de implementación: primero "código"
(-> `{{CODIGO CENTRO}}`), luego "domicilio/dirección junto a centro" (-> `{{DIRECCION CENTRO}}`,
que también contendría "centro"), y solo entonces "centro" a secas.

**Por qué el botón cuelga de un atributo (`data-clave-formulario`) y no envuelve nada nuevo.**
`js/formularios.js` (fila 82) ya pinta la lista de un hito y la línea "Formularios" de la ficha; en
vez de que `js/formularios-rellenar.js` reimplemente esa pintura o envuelva las funciones que la
hacen, `js/formularios.js` gana un atributo `data-clave-formulario` en cada chip (dos líneas de
cambio, ya en `main` gracias a la fila 82). `js/formularios-rellenar.js` solo necesita saber qué
asunto está abierto (lo consigue envolviendo `App.abrirFicha`, como el resto de módulos que
cuelgan un botón de la ficha) y vigilar la ficha con un `MutationObserver` para colgar el botón en
cuanto aparezca un chip nuevo, sin tocar el fichero de la fila 82 más que en ese punto previsto.

**Un fallo de coordinación con la sesión de la PR #63, para que quede escrito.** Esta sesión hizo
su propia fila 81 completa (cargos, membrete, `Docx.ponerImagen`) sin saber que otra sesión, en
paralelo, la estaba haciendo también — las dos partieron del mismo `docs/COLA-NUEVAS-2026-09-20.md`
casi a la vez. Se detectó a tiempo (Francisco avisó de que había "otra conversación corriendo") y
se resolvió sin pisar nada: la PR duplicada se cerró sin fusionar, y la rama se sincronizó con
`main` (`git checkout origin/main -- .` más `git rm` de los dos ficheros de Ajustes que la otra
sesión no había separado igual) antes de seguir con la única fila que quedaba. Motivo para
dejarlo escrito: cuando dos sesiones parten del mismo documento de instrucciones nuevas casi a la
vez, conviene comprobar pronto (antes de escribir mucho código) si alguna ya está en marcha.

Ficheros nuevos: `js/formularios-rellenar.js`, `pruebas/formularios-rellenar.mjs`. Tocados:
`datos/formularios.json` (clave `f`), `js/formularios.js` (`data-clave-formulario`),
`js/plantillas.js` (`provincia`), `js/plantillas-ajustes.js` e `index.html` (el campo Provincia),
`js/copias.js` (`formularios-campos.json`, decimoctavo fichero compartido),
`js/ajustes-centro.js` (engancha "Impresos oficiales"), `js/envolturas-esperadas.js`. Batería
completa en verde (86 ficheros de prueba), una sola pasada al final.

## 20-sep-2026 — Fila 83: las plantillas de documento y de correo del centro

`docs/PLANTILLAS-DEL-CENTRO.md`. Las filas 14 y 17 montaron la máquina de plantillas de correo y
de documento; llevaban vacías desde entonces. Con la biblioteca de hitos ya llena (fila 80), y
los cargos, el membrete (fila 81) y los formularios (fila 82) ya montados, esta fila por fin
escribe los textos y los mete en la aplicación sin que Francisco tenga que subir nada a mano.

**De dónde salen los `.docx`.** Viven en el repositorio, en `plantillas/`, como `.md` con un
frontmatter (`nombre`, `tipo`, `categoria`; y, solo si es de documento, `tipoDocumento`, `texto`,
`firmante`, `vistoBueno`). `scripts/hacer-plantillas.mjs` (a mano, nunca en Vercel ni en las
pruebas) los convierte: monta el `.docx` de cero, como un ZIP, con lo mínimo que Word necesita
(`[Content_Types].xml`, `_rels/.rels`, `word/document.xml`, `word/styles.xml` y
`word/_rels/document.xml.rels`, este último vacío de relaciones a propósito: `Docx.ponerImagen`,
de la fila 81, crea la suya la primera vez que un documento con esa plantilla se genera con
membrete). Entiende cinco marcas: `# `/`## ` (título/subtítulo, en negrita), línea vacía como
párrafo, `- ` lista, `> ` bloque a la derecha (la fórmula de firma) y `---` como salto de línea
grueso (un borde inferior en un párrafo vacío). Nada más: no hace falta un conversor de Markdown
completo para esto. Las de correo no generan ningún fichero: su cuerpo, ya a texto plano, se
escribe directo en `plantillas/indice.json`.

**Un hueco escrito con doble llave.** Al escribir de verdad los textos apareció un fallo latente
de la fila 81: `{{NOMBRE NATURAL}}` (con espacio, mayúsculas) no encontraba la clave `nombreNatural`
del catálogo (sin espacio, minúscula media), porque `resolverUnHueco` solo ignoraba mayúsculas y
tildes, no los espacios. Se arregló comparando sin ningún espacio en ninguno de los dos lados
(`sinEspacios`, en `js/plantillas.js`), así que ahora **cualquier** hueco, no solo los de la fila
81, se puede escribir con doble llave en las plantillas del centro, de forma uniforme.
`Plantillas.HUECOS` gana también `{{FORMULARIOS}}` (fila 82): los formularios del tipo y de los
hitos del asunto, uno por línea.

**Un párrafo que se queda vacío, desaparece.** `{{FORMULARIOS}}` sin ningún formulario se quedaba
vacío pero dejaba una línea en blanco suelta en el papel. `js/docx.js` (`rellenarXml`) gana la
regla: un párrafo que tenía texto de verdad antes de rellenar y se queda enteramente vacío después
se quita del todo; uno que ya estaba vacío de partida (un salto de línea puesto a mano) no se
toca.

**El contenido escrito**: doce plantillas (ocho de documento, cuatro de correo), repartidas entre
las tres categorías — no las cincuenta y tantas de la biblioteca de golpe, sino una muestra
representativa y cuidada de cada caso (una corrección de conducta con su citación y su aviso, una
sanción, un cambio de centro, un cese, una toma de posesión con dos firmas (empleado y dirección),
un certificado con firma y visto bueno, un permiso, un pedido a proveedor, una reclamación de
garantía): decisión tomada para no sacrificar la calidad y la comprobación de cada texto por
llegar a un número. Queda para más adelante escribir el resto, tipo a tipo, con el uso.

**El botón "Cargar las plantillas del centro"** (Ajustes → Mantenimiento, dentro de
`js/plantillas-documento.js`, mismo patrón que "Cargar la biblioteca del centro" de la fila 80):
lee `plantillas/indice.json`, descarga cada `.docx` a `_GESTOR/PLANTILLAS` y da de alta su fila en
`plantillas.json`. Fusiona y no pisa: una plantilla con el mismo nombre y tipo que una ya
existente se deja como está.

Comprobado con `pruebas/plantillas-del-centro.mjs`: que `indice.json` cite ficheros que existen,
que cada `.md` traiga su frontmatter completo, que **todo** hueco usado en los doce cuerpos esté
en el catálogo (la prueba que de verdad importa: un hueco mal escrito sale tal cual en el papel,
y esta prueba cazó los dos `{{ASUNTO}}` que se me habían escapado al escribir los primeros
borradores, huecos que sonaban bien pero no existían), que cada `.docx` se pueda releer con
`Docx.leerEntradaDeTexto`, y que `{{FORMULARIOS}}` vacío no deje una línea suelta. Batería
completa en verde, una sola pasada al final.
