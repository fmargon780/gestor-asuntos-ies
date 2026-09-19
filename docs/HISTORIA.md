# Historia — el diario

Esto casi nunca se lee: existe para consultar por qué se hizo algo como se hizo. Entradas
nuevas arriba, de lo más nuevo a lo más viejo.

---

## 18-sep-2026 — Comunicar desde el hito

Fila 60 de la cola (`docs/COLA.md`, `docs/COMUNICAR-DESDE-EL-HITO.md`): la plantilla de correo y de
Séneca era del tipo de asunto entero, una sola para todo el trámite, aunque pedir un papel al
principio y avisar de una resolución al final no se parecen en nada — y para comunicar algo de un
hito había que subir a la cabecera de la ficha aunque el texto que tocaba estuviera ahí delante.

- **En la guía**: cada paso (o subpaso, dentro de una opción) puede llevar su propio texto de
  correo y/o de Séneca — asunto y cuerpo, cada uno con "Insertar hueco" —, en una sección plegable
  "Comunicación de este paso" del editor, con dos pestañas (Correo/Mensaje de Séneca). Vive en
  `js/guias-comunicacion.js` (nuevo), reutilizando el mismo campo de texto con hueco que ya tenía
  el cuadro de una plantilla (`js/plantillas-ajustes.js`, sacado a una función aparte para eso: "no
  escribas un editor nuevo"). La plantilla general del tipo no se toca: sigue siendo la que usa el
  "Comunicar" de la cabecera.
- **En el hito**: no se guarda ninguna copia del texto en `hitos.json` — se lee de la guía de su
  tipo por `origenGuia` en el momento de pulsar el botón, así que si Francisco cambia el texto del
  paso, los asuntos vivos usan el nuevo directamente. El botón "Comunicar" solo sale si su paso
  tiene texto; con los dos canales, abre el mismo menú pequeño de la cabecera; con uno solo, va
  directo. El destinatario se propone según el responsable del hito: el tutor legal (1, o el 2 si
  el 1 no tiene datos) si es `tutor`; todos los relacionados con correo si es `relacionado`; el
  tercero del asunto en cualquier otro caso. En Séneca no hay forma de marcar un usuario IdEA
  concreto desde aquí: el cuadro se abre con la lista de siempre, sin bloquear el botón por eso.
- **Reutilizado, no reinventado**: el cuadro de Correo/Séneca que abre "Comunicar" es el de
  siempre (`js/correo.js`, `js/seneca-cuadro.js`, `js/correo-cuadro.js`), con el mensaje ya resuelto
  puesto encima (mismo mecanismo que "Pedir lo que falta" de la fila 59: `abrirCuadro(a, deSeneca,
  extra)`); y la constancia —una nota en el asunto y una línea en el historial del hito, una sola
  vez— reutiliza el cerrojo `yaApuntado` que ya tenía `apuntarElRastro` desde antes de esta fila,
  no uno nuevo. Todo lo propio del hito (leer la guía por `origenGuia`, resolver el destinatario)
  vive en `js/hitos-comunicar.js` (nuevo), enganchado a `window.Hitos` como `js/hitos-archivo.js`
  aunque no guarda nada en el hito.

Simplificación anotada: con varios relacionados, se proponen todos los que tengan correo (unidos
por comas, en "Otro correo"); no hay forma de elegir solo alguno desde aquí. Si hace falta más
adelante, se retoca.

Prueba nueva, sin navegador: `pruebas/comunicar-desde-hito.mjs` (sustituye `CorreoNucleo.abrirCuadro`
por uno que solo apunta con qué se le ha llamado: abrir el cuadro de verdad monta un `U.preguntar`
con el DOM entero, que no tiene sentido simular sin navegador).

**Trampa encontrada probando en el navegador de verdad** (no la coge ninguna prueba sin navegador):
"+ Añadir"/quitar/mover una fila de "Lo que hay que reunir" o escribir en "Comunicación de este
paso" hace `recoger(); mutar; pintar()` del paso ENTERO (`js/guias.js`), que reconstruye el
`<details>` desde cero — y un `<details>` recién creado nace cerrado, así que la sección se le
cerraba sola a Francisco justo después de tocarla. `pintar()` ahora apunta, antes de vaciar
`#guia-pasos`, qué `<details>` (de `.paso-extra`, `.paso-requisitos` o `.paso-comunicacion`, de un
paso o de un subpaso) estaban abiertos, con la posición del paso más el id del subpaso como clave
(`detallesAbiertos`/`restaurarAbierto`), y los vuelve a abrir al repintar. De paso arregla lo mismo
que ya le pasaba a `.paso-extra` (responsable/estado/plazo), que tenía la misma trampa desde antes
de esta fila.

## 18-sep-2026 — Lo que hay que reunir en cada hito

Fila 59 de la cola (`docs/COLA.md`, `docs/REQUISITOS-DE-HITO.md`): un hito dice qué hay que hacer,
quién y para cuándo, pero no qué papeles hay que reunir o qué datos pedir; eso vivía en la cabeza
de Francisco. Ahora cada paso del trámite de un tipo puede llevar una lista opcional de casillas
("lo que hay que reunir"), cada una un **documento** o un **dato**, obligatoria o no.

- **En la guía** (Ajustes › Tipos de asunto › un tipo › Pasos del trámite): dentro del editor de
  cada paso, una sección plegable "Lo que hay que reunir" — texto libre, Documento/Dato,
  Obligatorio, quitar y mover. Vive aparte, en `js/guias-requisitos.js` (nuevo), para no engordar
  `js/guias.js`. Los pasos de dentro de una opción de una pregunta también pueden llevar su propia
  lista; el paso-pregunta en sí, no (se resuelve eligiendo una opción, no con una casilla).
- **En el hito**: al crearse desde la guía, cada paso copia sus requisitos, sin marcar. En la
  ficha, debajo del cuerpo del hito y encima de sus documentos, un bloque con la cuenta de lo que
  falta; marcar una de clase dato pide un valor pequeño (puede quedar en blanco), que se guarda al
  salir del campo o con Intro; el de clase documento se marca **solo** al apuntar el documento que
  corresponde (con una única casilla pendiente; con varias, se pregunta con cuál). Cada fila tiene
  su menú de tres puntos (Editar el texto / Quitar de este asunto), y "+ Añadir algo que falte"
  añade una casilla solo a este asunto, sin tocar la guía del tipo. Si el tipo gana requisitos
  después de que el hito ya existiera, una línea discreta ofrece traerlos.
- **No bloquea, avisa**: dar un hito por hecho con algo obligatorio sin reunir pregunta primero
  (`Hitos.faltanObligatorios`); si Francisco sigue igual, se marca y se le apunta una nota
  automática. Nunca se le impide avanzar.
- **"Pedir lo que falta"**: un botón en el bloque, visible solo si queda algo sin marcar, abre el
  mismo menú "Comunicar" de la cabecera de la ficha (Correo/Séneca) — no un camino nuevo — con la
  lista de lo pendiente ya lista para pegar. Entra por un hueco de plantilla nuevo,
  `{{LO QUE FALTA}}` (con dos llaves a propósito, para que se note que no es un dato del asunto
  como los demás: se sustituye siempre, incluso por nada fuera de este camino, y nunca deja el
  hueco escrito); sin ese hueco en la plantilla, o sin plantilla, el texto se añade al final. Todo
  esto vive en `js/hitos-requisitos.js` (nuevo, modelo y pintura en un solo fichero, como pide el
  encargo), enganchado a `window.Hitos` igual que `js/hitos-archivo.js`.

Trampa evitada: nada de esto toca `Hitos.marcar` ni la firma de las funciones que ya existían —
todo entra por fichero nuevo o por una llamada añadida donde tocaba (`js/hitos-documentos.js` al
apuntar/quitar un documento, `js/hitos-panel-lista.js` antes de pasar a hecho, `js/correo.js` para
reutilizar el menú "Comunicar" en vez de duplicarlo).

Prueba nueva, sin navegador (con un disco de mentira en memoria, como `pruebas/logica.mjs`):
`pruebas/requisitos-de-hito.mjs`.

## 18-sep-2026 — Seis arreglos de uso diario

Fila 58 de la cola (`docs/COLA.md`, `docs/AJUSTES-DE-USO-2026-09-18.md`), seis puntos sueltos
pedidos por Francisco tras un día de uso real:

1. **La fila de copiar de un gesto** (`js/ficha-nombre-acciones.js`, `ponerFilaDeCopiar`): debajo
   del nombre del asunto, siempre a la vista y sin menú, cuatro botones — Asunto, NIE, Nombre y
   DNI/CIF (CIF en empresas) — cada uno con el mismo copiado de siempre. "Copiar el nombre del
   asunto" sale del menú de tres puntos (ya no hace falta). Nombre y DNI/CIF tardan (piden el
   tercero) y se reservan `hidden` desde el primer pintado; "revelar" solo les quita `hidden`,
   nunca añade un nodo nuevo — ver el punto 6.
2. **"Preparar el documento" pasa a llamarse "Ajustar tamaño"**, en el botón y en el título del
   cuadro; el mecanismo (fila 57) no cambia.
3. **La caja de escribir una nota no guarda al teclear**, solo al pulsar Guardar o al perder el
   foco; y si se sale de la ficha con algo sin guardar, avisa y ofrece "Guardar y salir"
   (`Notas.confirmarSalirDeFicha`).
4. **El documento sellado que sustituye a uno de Por clasificar ya no manda el original a la
   papelera**: lo renombra a "… SIN SELLAR" y lo conserva en la carpeta (`js/registro-sellado.js`).
5. **Cada documento de la ficha se puede asociar a un hito a mano** ("Asociar a un hito", con la
   etiqueta del hito ya asociado a la vista), aparte de la asociación automática al "Apuntar un
   documento" de un hito que ya existía.
6. **El cuadro de Correo se reparte en dos columnas**, como el de Séneca (fila 53): se saca su
   cuerpo propio a `js/correo-cuadro.js` (nuevo, mismo patrón que `js/seneca-cuadro.js`),
   `js/correo.js` se queda con la lógica compartida y con abrir/pintar el cuadro correcto.

**Dos carreras de datos de verdad, encontradas al pasar la batería completa** (no eran fallos de
las pruebas, sino del código):

- El botón "Nombre"/"DNI-CIF" del punto 1, al revelarse tarde, mutaba `#ficha-asunto-cuerpo`; el
  `MutationObserver` de `js/hitos-panel.js` escuchaba con `{childList:true, subtree:true}` y
  repintaba el panel de hitos por esa mutación ajena, colapsando un hito que el usuario tenía
  desplegado a medio escribir. Arreglado por dos lados: el patrón `hidden` del punto 1 (evita la
  mutación) y estrechar el observador a `{childList:true}` sin `subtree` (cada acción que de
  verdad cambia un hito ya llama a `HitosPanel.programarRepintado()` por su cuenta, comprobado a
  mano en `js/hitos-panel-lista.js`, `js/hitos-documentos.js` y `js/ficha-asunto.js`).
- Al salir de la ficha con una nota sin guardar (punto 3), el cuadro de aviso enfoca su primer
  campo y eso dispara un guardado por `blur` de la nota A LA VEZ que el "Guardar y salir" explícito
  del propio aviso. Con el cerrojo antiguo (un booleano) el segundo guardado veía el cerrojo
  puesto y se rendía sin esperar al primero, así que se podía salir antes de que el guardado
  llegase a disco. Arreglado cambiando `guardarBorrador` a una cola de promesas encadenadas:
  esperar cualquier guardado espera ahora a toda la cola, incluido uno disparado a la vez.

Pruebas: `pruebas/copiar-fila.mjs` y `pruebas/asociar-documento-a-hito.mjs` (nuevas),
`pruebas/notas-asunto-no-se-borran.mjs` y `pruebas/cabecera-del-asunto.mjs` (revisadas a fondo);
de paso se corrigió `pruebas/plantillas.mjs`, que apuntaba a ids del cuadro de Séneca de antes de
la fila 53 (ya señalado como pendiente en una revisión anterior, y bloqueaba tener la batería en
verde para esta fila).

## 18-sep-2026 — Hueco para el sello de Séneca y la firma del director

Fila 57 de la cola (`docs/COLA.md`, `docs/HUECO-PARA-SELLO-Y-FIRMA.md`), acordada con Francisco el
18-sep-2026 mirando la cabecera de un asunto de CERT. MATRICULA. El sello que Séneca pinta al
registrar a mano (banda estrecha arriba, a la derecha si es entrada y a la izquierda si es salida)
a veces pisa texto del documento; lo mismo pasa abajo con la banda de firma digital del director.
Botón nuevo **Preparar el documento**, junto a Separar, Unir y Sacar páginas: encoge el contenido
de todas las páginas y lo recoloca para dejar libres las dos bandas, de lado a lado de la hoja.

**La cuenta, en `js/pdf-margenes.js`** (sin DOM, como `js/pdf-herramientas.js`): `calcularEncaje`
hace la regla de tres del encargo (escala nunca mayor que 1, ni negativa; `cabe` falso si los dos
huecos juntos pasan de la mitad del alto); `conHueco` valida TODAS las páginas antes de escribir
nada (si una no cabe, no se toca ni una).

**Lo que costó de verdad: las páginas giradas.** `getSize()` de pdf-lib no tiene en cuenta el
`/Rotate` de la página (se comprobó leyendo el propio bundle minificado,
`js/lib/pdf-lib.min.js`: `getSize` lee el `MediaBox` a secas), y `embedPage` tampoco — su
`width`/`height` también salen del `MediaBox` crudo. Así que la escala y el hueco se calculan
sobre el tamaño VISIBLE (con ancho y alto intercambiados si el giro es de 90° o 270°), pero el
contenido se sigue dibujando en el sistema de coordenadas CRUDO de la página, sin deshacerle el
giro: la hoja nueva se crea con el mismo tamaño crudo y el mismo `/Rotate` que la original, y solo
cambia dónde y a qué escala se dibuja el contenido dentro de ese sistema. Así no hace falta saber
cómo compone `drawPage` su propio parámetro `rotate` (con su propio pivote y su propio sentido de
giro, que no coincide con el de `/Rotate`): el visor ya sabe rotar una página entera, y basta con
que el contenido encogido caiga en el sitio correcto de esa página sin rotar mentalmente nada. La
fórmula que traduce la esquina visible ya calculada a la esquina cruda donde dibujar
(`posicionCruda`, un caso por cada uno de los cuatro giros) se dedujo a mano, dos veces por
caminos distintos para el caso de 90° (una vez pensando en la hoja de papel física que se gira, y
otra resolviendo las cuatro esquinas del rectángulo de contenido con álgebra), y las dos
coincidieron. Se comprueba en la prueba con una tercera página girada 90° dentro del mismo PDF:
`conHueco` tiene que conservar su tamaño crudo y su giro tal cual (no hay forma barata de
comprobar en Node, sin `canvas`, que el contenido cae exactamente en el píxel correcto; eso
tendrá que verlo Francisco con un documento girado de verdad).

**Saber si ya hay sitio, sin abrir el cuadro para nada**: con pdf.js (que sí aplica el giro solo al
pintar en un `<canvas>`), se renderiza cada página a 700px de ancho y se mira si más del 0,3% de
los píxeles de cada banda están por debajo de 200 de luminosidad. Si las dos bandas están libres en
todas las páginas, ni se abre el cuadro: un aviso verde y ya. Esto hace que el botón sea seguro de
pulsar "por si acaso": en un documento ya con sitio, no pasa nada.

**Lo configurable**: las dos medidas (1,5 cm arriba, 2,5 cm abajo por defecto) en Ajustes → El
centro, guardadas en `_GESTOR/margenes-pdf.json` (son solo dos números, sin fusión con el disco,
igual que "Datos del centro y firma"); y `tipo.llevaSello`/`tipo.llevaFirma`, dos interruptores en
`tipos.json` con un ayudante compartido nuevo (`App.construirInterruptorDeTipo`, en `js/ajustes.js`,
junto a `App.construirCasillaPlazo`), por defecto sí y no respectivamente, así que ningún tipo
existente necesita migración.

**Ficheros nuevos**: `js/pdf-margenes.js`, `js/preparar-documento.js`, `pruebas/margenes-pdf.mjs`.
El botón se cuelga desde `js/ficha-documentos.js` y `js/documentos-sueltos.js` (no desde
`js/pdf-separar-unir.js`, como decía el encargo: ahí es donde de verdad viven los otros tres
—Separar, Unir, Sacar páginas—, cada uno con su propio `enMenu.push(...)`, así que el nuevo se
cuelga igual, al lado). Se cambiaron también `js/ajustes-centro.js`, `js/ajustes-tipo.js`,
`js/ajustes.js`, `index.html` y `css/pdf-separar-unir.css`, para lo configurable, la vista previa y
el sitio del botón.

**Sesión en la nube**: sin `git push` de verdad ni permiso para tocar `main` directamente (ver la
nota de `docs/COLA.md` sobre "sube directamente a main"), así que esta fila se subió con pull
request en vez de directa, aunque el encargo pedía lo segundo.

Comprobado con `pruebas/margenes-pdf.mjs` (`calcularEncaje` en varios casos, `conHueco`
conservando páginas/tamaños/giro, una página sin sitio que no escribe nada, `pareceFirmado`).

---

## 18-sep-2026 — La cabecera se queda arriba, y se encoge

Fila 46 de la cola (`docs/COLA.md`, `docs/CABECERA-QUE-SE-QUEDA.md`), acordada con Francisco el
17-sep-2026: la última fila pendiente, y con ella la cola queda entera. El aviso, con sus
palabras: "Cuando navegamos hacia abajo en una vista, se suele perder la referencia superior. Esto
es muy evidente cuando estamos trabajando en un asunto vivo." Al bajar por la ficha de un asunto
largo, el nombre, el estado y el botón de volver se iban por arriba, y a partir de ahí se
trabajaba a ciegas.

**La solución: fijar la cabecera, pero encogida.** Fijarla entera se comía demasiado alto, así que
se queda pegada arriba (`position: sticky`) y se reduce a una sola línea al pasar de 80px de
scroll, con histéresis (no se despliega hasta bajar de 40px, para que no parpadee justo en el
límite). Un único mecanismo (`js/cabecera-fija.js` + `css/cabecera-fija.css`) para las siete
pantallas — ficha del asunto, asuntos abiertos (con "Por clasificar" dentro), archivo, personas y
empresas, ajustes, qué me toca y duplicados; la papelera vive dentro de ajustes y usa su cabecera
— en vez de siete parches sueltos.

**El primer diseño de la CSS estaba mal, y la propia prueba lo dijo.** La primera idea, muy
razonable sobre el papel, era: al encoger, quitar alto por un lado (título más pequeño) y añadir
un poco de relleno vertical (`padding`) para que la cabecera pegada no tocara el borde de la
ventana. Al medirlo con la prueba de navegador (mirando el alto real de la cabecera antes y
después de encogerse) resultó que la cabecera **crecía en vez de encoger**: el `padding` nuevo
pesaba más que lo que se ahorraba con el título más pequeño, sobre todo cuando el buscador y los
botones de la cabecera ya iban en dos líneas por falta de sitio (con el tablón de notas puesto al
lado, en una ventana no muy ancha — nada que ver con esta fila, pasa igual sin ella). El arreglo
fue quitar ese `padding` y, en su lugar, reducir el margen de abajo de la cabecera (18px/16px de
siempre → 6px encogida): lo que de verdad mueve el contenido de debajo no es el alto de la caja de
la cabecera, es el hueco que reserva alrededor.

**Medir "que no dé un salto" tampoco era tan directo como parecía.** La prueba original comparaba
la posición de un elemento de referencia antes y después de bajar, esperando que se moviera
exactamente "lo que se ha bajado, más lo que ha encogido la cabecera". El número nunca cuadraba
así — resultó que Chrome tiene **scroll anchoring**: si algo por encima de lo visible cambia de
alto a mitad de un scroll, el navegador ajusta `window.scrollY` por su cuenta para que el
contenido visible no dé un salto. Es exactamente lo que se quería conseguir, hecho ya por el propio
navegador. La prueba se corrigió para medir lo que de verdad importa: que el contenido se mueva
justo lo que se ha pedido bajar y ni un píxel más, sin mirar el valor final de `scrollY` (que
Chrome puede tocar por su cuenta, y eso no es ningún fallo).

**El caso especial: "Por clasificar".** Con un documento abierto en el panel de la derecha, la
cabecera encogida de Asuntos abiertos añade "Viendo: `<nombre>`" y un botón "Ir a su fila"
(`scrollIntoView` a la tarjeta ya marcada `.tarjeta-abierta`, que pone `js/documentos-sueltos.js`).
Lo hace `js/cabecera-fija.js` solo mirando esa tarjeta, sin tocar `js/documentos-sueltos.js` ni
`js/visor.js`, tal y como pedía el documento.

**Ajustes se queda con las pestañas visibles también.** Como su cabecera es solo el título
"Ajustes" (`index.html`), las pestañas "Tipos de asunto · El centro · Mantenimiento"
(`#pestanas-ajustes`) se dejaron pegadas por su cuenta, justo debajo, con una variable CSS
(`--cabecera-fija-alto`) que `js/cabecera-fija.js` mide y actualiza en cada repintado con el alto
real de la cabecera (encogida o no), para que no quede ni hueco ni solape entre las dos.

**El repintado de la ficha no pierde el estado.** `js/ficha-asunto.js` rehace su
`.ficha-cabecera` entera con `innerHTML` cada vez que pinta (por ejemplo, al cambiar el estado del
asunto), por encima sigue `U.conservandoLoEscrito` como siempre. En vez de tocar ese fichero (que
ya pasa de 400 líneas, como pedía el documento), `js/cabecera-fija.js` vigila con un único
`MutationObserver` sobre `<main class="contenido">`: si el nodo de la cabecera cambia, vuelve a
poner el estado encogido sin esperar al siguiente scroll. El mismo observador, mirando la clase
`oculto` de las pantallas, se entera también de los cambios de pantalla, sin engancharse a
`App.ir`.

Comprobado que `js/barra.js` (línea ~139, `#pantalla-abiertos .cabecera`) sigue colgando el botón
grande de "Nuevo asunto" sin problema. Prueba nueva `pruebas/cabecera-fija.mjs`, navegador de
verdad, con los siete puntos del encargo. Batería completa en verde (59 ficheros de prueba), una
sola pasada al final. Versión publicada `App.VERSION`: `18-sep-2026 · 00:31`. Con esta fila,
`docs/COLA.md` queda entera: no queda ninguna fila pendiente.

---

## 17-sep-2026 — Los destinatarios de un mensaje de Séneca

Fila 47 de la cola (`docs/COLA.md`, `docs/DESTINATARIOS-EN-SENECA.md`), acordada con Francisco el
17-sep-2026. Viene de la fila 21 (`docs/GRUPOS-DE-PERSONAS.md`), que ya dejó los grupos poniendo
los destinatarios de un correo en copia oculta: aquí se lleva lo mismo a la mensajería de Séneca,
que no funciona con direcciones de correo sino con **usuarios IdEA**.

**De dónde sale.** Francisco mandó a comprobar cómo se eligen los destinatarios en Séneca
(Utilidades → Comunicaciones), y lo contó así:

> "La mensajería de Séneca para poner el destinatario usa dos sistemas, o bien haces un filtro
> dando varios clicks y con el riesgo de poder elegir a más personas de la cuenta, o haces una
> búsqueda en el mismo campo en el que si escribes primero el símbolo @ y después sin espacio el
> usuario IdEA de la persona, te ofrece la persona que dando a la flecha hacia abajo se queda
> elegida."

Y después, probando a pegar en vez de escribir:

> "Si pego el valor con el @ en un segundo o un poco más sí reconoce el destinatario. Pero hay
> que dar a la flecha hacia abajo para que el sistema coja ese destinatario."

O sea: **pegar vale**, hace falta esperar algo más de un segundo, y hace falta una flecha abajo.
Sobre eso se construyó todo: el botón "Copiar el siguiente" (pegar a mano, la red de seguridad de
siempre) y el ayudante-marcador (`js/seneca-ayudante.js`), que espera 1.400 ms antes de lanzar
`ArrowDown` y luego `Enter`, precisamente porque Séneca no reconoce el destinatario si se le da la
flecha demasiado pronto.

El usuario IdEA del profesorado y del PAS ya viene en el CSV de personal que la aplicación
importa; el del alumnado y el de los tutores legales llegará en un fichero aparte, todavía sin
ver, que Francisco podrá descargar cuando le reactiven el perfil de Gestor de PASEN. Por eso la
fila se hizo entera ahora, aunque falte ese fichero: con el personal ya se podía usar y probar de
verdad, y `IdEA.usuarioDe` lee cualquier columna de usuario que aparezca en el RegAlum el día que
llegue, sin tocar nada más.

## 17-sep-2026 — El índice guardado del ARCHIVO, y la búsqueda por palabras sueltas

Fila 44 de la cola (`docs/COLA.md`, `docs/BUSCADOR-ARCHIVO-INDICE.md`), acordada con Francisco el
17-sep-2026. Primera de tres instrucciones sobre el buscador del ARCHIVO; las otras dos (filtros
por tipo y curso, y una sola caja que busque a la vez en abiertos y archivados) quedan sin diseñar.

**El problema tenía cinco caras a la vez.** `App.verArchivo` recorría el archivo entero (categoría
→ carpeta del tercero → carpeta del asunto) cada vez que se entraba, y `App.pintarArchivo` buscaba
con `indexOf` sobre un solo texto (nombre de la carpeta, categoría y tercero, pegados). De ahí
salían: palabras sueltas que no encontraban nada si no estaban seguidas y en ese orden; ni rastro
del registro de Séneca ni del nombre de los documentos; nada de la ficha del asunto (estado, vía,
quién lo pidió, campos propios, relacionados); los asuntos archivados a mano fuera de los tres
niveles de siempre, invisibles; y todo lento, porque releía el disco entero cada vez.

**Un índice guardado, `_GESTOR/indice-archivo.json`**, compartido entre los dos ordenadores.
Módulo nuevo `js/archivo-indice.js` (`window.IndiceArchivo`): se lee y se escribe **directo con
`Carpetas`, nunca con `Copias.guardar`**, exactamente el patrón de `js/presencia.js` — fuera de
las copias de seguridad, de la papelera y de la fusión de conflictos de Dropbox, porque se puede
rehacer entero en cualquier momento con el botón nuevo "Reconstruir el índice" (junto a
"Actualizar"), y engordaría las copias diarias sin motivo real. Antes de escribir, se relee el
disco y se fusiona por nombre de carpeta de asunto, como `Grupos.guardar`: lo que el compañero
haya archivado desde el otro ordenador mientras tanto no se pierde (comprobado con un escenario
propio, guardando una foto vieja después de que "el compañero" escribiera directo al fichero).

**Nada de la ficha se copia al índice.** El estado, la vía y su dato, quién lo pidió, los
relacionados y los campos propios se leen al buscar, de `App.E.registro.asuntos`, que ya está en
memoria: un cambio en la ficha se nota al instante, sin reconstruir nada. El texto de búsqueda de
cada asunto se calcula una sola vez al cargar el índice (no en cada tecleo); `App.pintarArchivo`
deja el `indexOf` de siempre: normaliza lo escrito, lo parte en palabras, y un asunto sale si las
tiene TODAS, en cualquier orden y en cualquiera de sus datos (nombre, categoría, tercero, ruta,
tipo, curso, grupo, documentos, registros de Séneca, y los de la ficha).

**Los asuntos descolocados** entran también en el índice, sin moverlos: una carpeta justo debajo
de la categoría cuyo nombre `Nombres.leer` reconoce como asunto (tiene fecha y tipo) entra con
`tercero: ''` y `sueltoEn: 'bajo la categoría'`; una que no lo parece se mira un nivel más adentro
por si esconde uno (cuatro niveles o más), con `sueltoEn` a la ruta donde se encontró. Salen en los
resultados como cualquier otro, con su ruta en el pie de la tarjeta (`App.tarjetaAsunto`, sin
tocarla), y la línea de estado cuenta cuántos hay al final.

**Los tres casos límite de la sección 6, cubiertos sin romper nada**: si el fichero no existe, está
roto o es de otra `version`, `App.verArchivo` cae al mismo recorrido de disco de siempre
(`IndiceArchivo.construir()`, sin guardar nada) y avisa "El índice no está hecho. Reconstruir el
índice."; si un recuento barato (categorías y carpetas de tercero, un nivel, sin entrar en los
asuntos) no cuadra con el `recuento` guardado, se enseña el índice igual y avisa "El índice puede
no estar al día." — nunca se reconstruye sola; y al archivar (`App.cerrarAsunto`) se añade la
entrada, al reabrir (`App.reabrirAsunto`) se quita, los dos después de que el traslado de la
carpeta haya salido bien, sin romper nada si el índice todavía no existe. `App.reabrirAsunto` deja
de llamar a `App.verArchivo` en sus tres salidas: con el índice al día, basta repintar
`App.E.listaArchivo` en memoria.

**Una trampa que no estaba en el encargo**: el índice no puede guardar manejadores de carpeta en un
JSON, así que las tarjetas del ARCHIVO no traen `handle`. "Reabrir" no hizo falta tocarlo
(`App.reabrirAsunto` ya sabía recalcular la carpeta desde la fila 45), pero "Documentos"
(`App.verDocumentos`, en `js/asuntos-lista.js`, que no se toca) sí lo necesita de verdad: se
envuelve en `js/archivo-personas.js`, y si falta el manejador se resuelve al vuelo con
`IndiceArchivo.resolverHandle` justo antes de abrir, a partir de lo que el índice sabe (categoría,
tercero, ruta, `sueltoEn`).

Prueba nueva `pruebas/archivo-indice.mjs`, en navegador de verdad con el disco de mentira de
`pruebas/navegador.mjs` (como `pruebas/archivar-atascos.mjs`), con los nueve escenarios de la
sección 9 del documento. No se han tocado `js/asuntos-lista.js`, `js/datos.js`, `js/copias.js`,
`js/papelera.js`, `js/conflictos.js` ni `apps-script/gestor-correos.gs`, como pedía el propio
documento. Batería completa en verde, una sola pasada al final (54 ficheros de prueba). Versión
publicada `App.VERSION`: `17-sep-2026 · 23:33`.

## 17-sep-2026 — Dar de alta un tercero desde el documento, y los aspirantes a plaza

Fila 42 de la cola (`docs/COLA.md`, `docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md`), acordada con
Francisco el 17-sep-2026, justo después de la fila 41. Aquella hace que la aplicación lea el
documento y proponga el tercero cuando lo reconoce; faltaba el caso contrario: un DNI, NIE o NIF
que no cuadra con nadie, y sobre todo los aspirantes a plaza, que no salen en `RegAlum.csv` porque
todavía no son alumnado matriculado.

**Lo primero, mirando el repositorio antes de escribir nada**: los aspirantes ya existían, con otro
nombre. No hacía falta ninguna "categoría nueva de tercero, alumnado pendiente": `js/datos.js` ya
tenía `p.solicitante`, `solicitantes.csv`, el botón "+ Dar de alta un solicitante" y el aviso
"Solicitante, todavía sin matricular" en el buscador, desde antes de esta fila. Inventar una
categoría aparte habría duplicado toda esa mecánica sin necesidad, así que se ha reutilizado y
completado en vez de reescribirla — el propio encargo lo permitía ("si algún nombre de módulo no
cuadra con lo que hay de verdad, usa el que sea, sin cambiar la arquitectura").

Lo que faltaba de verdad, y lo que trae esta fila:

- **`LectorDocumentos.analizar`** (`js/lector-documentos.js`) gana `terceroDesconocido`: cuando un
  documento de identidad no cuadra con ninguno de los que ya conoce, busca un nombre o una razón
  social cerca de él en el propio texto (una razón social por su forma jurídica —S.L., S.A.,
  S.COOP., C.B.— o un nombre de persona por dos a cuatro palabras con inicial mayúscula). Si hay
  más de un documento sin cuadrar a la vez, o ningún nombre cerca, no propone nada: mejor un hueco
  que una equivocación. Categoría de partida: NIF siempre EMPRESAS; DNI o NIE, la del tipo ya
  propuesto si lo hay (una solicitud de plaza propone ALUMNADO), si no PERSONAL.
- El botón **"Dar de alta: nombre — documento"**, en `js/documentos-sueltos-lector.js` (sin tocar
  `js/documentos-sueltos.js`), debajo de la línea de la propuesta. Abre `App.cuadroDeTercero`, el
  alta que ya existe, con los datos ya escritos: la aplicación nunca da de alta sola. Guardado, la
  tarjeta se actualiza sola con el tercero recién creado, sin volver a leer el PDF.
- **`solicitantes.csv` gana la columna "Documento de identidad"**, opcional igual que el Nº de
  identificación escolar. `anadirSolicitantes` (`js/datos.js`) ahora reconoce a un aspirante ya
  matriculado también por ese documento (además de por Nº o por nombre, como ya hacía), comparando
  con `window.Dni.de` del matriculado: si coincide, no se duplica, aunque el nombre se hubiera
  escrito de otra forma.
- **El renombrado al llegar el número**: `App.renombrarAsuntosAbiertosDelTercero`, nueva en
  `js/asuntos-editar.js`, reutilizando `Carpetas.renombrar` igual que `App.editarAsunto`. Se
  dispara desde `App.cambiarDatosDelTercero` (`js/archivo-personas.js`) cuando un aspirante que no
  tenía Nº de identificación escolar lo recibe: enseña la lista de carpetas abiertas afectadas con
  `U.preguntar` ("Adelante") y las renombra una a una; las archivadas no se tocan, porque nunca se
  buscan.
- **El aviso en "Qué me toca"** (`js/que-me-toca.js`): un bloque nuevo arriba del todo mientras
  queden aspirantes sin número, sin fecha límite ni responsable (es un aviso, no un hito). Se pulsa
  y lleva a Personas y empresas, en Alumnado.
- La palabra que pedía el encargo, **"pendiente de número"**, sustituye a "sin Nº de identificación
  escolar" en la línea de debajo del nombre del buscador (`App.pieAlumno`, `js/asuntos-nuevo.js`).

Pruebas nuevas: 4 escenarios más en `pruebas/lector-documentos.mjs` (NIF desconocido con razón
social, DNI de un tercero que ya existe sin proponer nada, DNI desconocido en una solicitud de
plaza proponiendo ALUMNADO, dos documentos huérfanos a la vez sin proponer nada); tres escenarios
más en `pruebas/logica.mjs` (documento de identidad del aspirante, reconocimiento por documento sin
duplicar, y que con un documento distinto sí se suma sin número); `pruebas/aspirantes-numero.mjs`,
nueva, en navegador de verdad (alta sin número, dos asuntos —uno abierto y uno archivado—, el aviso
de "Qué me toca", y que al escribir el número solo se renombra el abierto); y
`pruebas/dar-de-alta-desde-documento.mjs`, nueva, en navegador de verdad con un PDF de mentira (el
botón sale con la razón social y el NIF, abre el alta con los datos escritos, no se da de alta
hasta guardar, y la tarjeta se actualiza sola después). Batería completa en verde, una sola pasada
al final. Con esto termina la cadena de "leer documentos" (filas 41 y 42).

---

## 17-sep-2026 — Leer los documentos que entran en "Por clasificar"

Fila 41 de la cola (`docs/COLA.md`, `docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md`), acordada con
Francisco el 17-sep-2026, después de la fila 39 (la casilla de palabras clave vive en la pantalla
propia de cada tipo). Hasta ahora, un documento suelto en "Por clasificar" solo se podía abrir,
borrar, convertir en asunto nuevo o meter en uno que ya existiera: el tipo, la fecha, el registro
de Séneca y el tercero los escribía Francisco a mano, documento a documento, aunque la mayoría son
PDF de Séneca que traen todo eso escrito ya dentro.

La aplicación lee ahora el texto del PDF con pdf.js (reutilizando `js/registro-lector.js`, que
gana una función pública `textoDe`) y **propone** lo que ha encontrado; nunca decide sola. Se
descartó de entrada, sin volver a discutirlo, cualquier servicio de inteligencia artificial por
internet y cualquier OCR (un escaneado sin texto se queda exactamente como estaba). El tipo se
acierta contando coincidencias de palabras clave escritas por Francisco —clave nueva
`palabrasClave` en `tipos.json`, editable en la pantalla propia del tipo que creó la fila 39—, más
el propio nombre del tipo; nada de aprendizaje automático.

El análisis vive en un módulo nuevo y **puro**, `js/lector-documentos.js`
(`LectorDocumentos.analizar(texto, contexto)`): sin tocar el disco, la pantalla ni pdf.js, así se
prueba con textos y listas de mentira. Saca el registro (con la función ya hecha y probada
`RegistroLector.buscarEnTexto`), la fecha del documento (la del sello si la hay; si no, la primera
del texto en varios formatos; nunca la de hoy), los documentos de identidad que aparezcan (DNI y
NIE con la letra comprobada por tabla; NIF de empresa; Nº de identificación escolar) y, cotejando
esos documentos y los nombres contra las listas de alumnado, personal y empresas que ya tiene la
aplicación, propone un tercero —un documento que cuadra vale más que un nombre que cuadra— y un
tipo. **Si cuadran dos terceros distintos, o empatan dos tipos, no se propone ninguno**: mejor un
hueco que un acierto a medias, y Francisco elige.

En "Por clasificar", cada tarjeta de documento suelto enseña, debajo del nombre del fichero, una
línea gris mientras se lee ("Leyendo el documento…", nunca bloquea la pantalla: se lee de uno en
uno, en una cola de fondo, solo al abrir esa pantalla y nunca al arrancar) y, al terminar, lo
encontrado separado por puntos (`26EM0368 · 10-sep-2026 · SOLICITUD · García Pérez, Ana`); lo que
no se haya encontrado, no sale. Con tipo y tercero claros, un botón **"Aceptar"** crea el asunto de
un clic, metiendo el documento dentro, **reutilizando tal cual el mismo camino que ya existía para
crear un asunto nuevo** (`App.crearAsuntoConPropuesta` en `js/asuntos-nuevo.js`, quince líneas que
llaman a las funciones de siempre y disparan el mismo botón "Crear", con su aviso de asunto
duplicado intacto): no se ha escrito ningún camino nuevo. Módulo nuevo
`js/documentos-sueltos-lector.js` envuelve `App.tarjetaSuelto` igual que ya hace `js/papelera.js`
con el botón Borrar, sin tocar `js/documentos-sueltos.js` por dentro.

Trampa encontrada al escribir las pruebas, que no estaba en el encargo: los ficheros de mentira que
usan muchas pruebas de `pruebas/` llevan extensión `.pdf` pero no son un PDF de verdad por dentro
(su contenido es texto plano). Pasárselos a pdf.js sin más habría hecho que, la primera vez que se
abriera "Por clasificar" en cualquiera de esas pruebas, pdf.js intentara leerlos y avisara por
consola de un PDF corrupto, tirando pruebas que no tienen nada que ver con esta fila. Se resolvió
mirando los cinco primeros bytes del fichero antes de cargar pdf.js: un PDF de verdad siempre
empieza por `%PDF-`; si no, `textoDe` devuelve cadena vacía sin más, sin avisar de nada.

`js/ajustes-tipo.js` (429 líneas) y `js/asuntos-nuevo.js` (en torno a 895) ya pasaban de las 400
líneas antes de esta fila —son pantallas de un solo módulo, el mismo criterio que se dejó para
`js/ajustes.js` en la fila 39—, y lo que ha hecho falta añadir en cada uno es una veintena de
líneas de enganche a un módulo nuevo (`js/ajustes-tipo-palabras-clave.js`), sin repetir ninguna
lógica: no se han partido. `js/campos.js` no se ha tocado nada: el relleno de los campos propios
del tipo ya ocurría solo, al fijar el tercero, desde antes de esta fila.

Prueba nueva `pruebas/lector-documentos.mjs`, sin pdf.js ni navegador (los seis escenarios del
encargo: sello completo, DNI de un alumno de la lista, dos alumnos distintos sin proponer ninguno,
dos tipos empatados sin proponer tipo, un DNI con la letra mal descartado, un texto vacío sin
romper nada). `pruebas/ajustes-por-tipo.mjs` ajustada: la pantalla de un tipo pasa de siete a ocho
secciones. Batería completa en verde, una sola pasada al final (51 ficheros de prueba). Versión
publicada `App.VERSION`: `17-sep-2026 · 22:13`.

La parte de dar de alta terceros que todavía no existen (un DNI/NIE/NIF que no está en ninguna
lista) queda para la fila siguiente de la cola, `docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md`: esta
fila no la toca.

---

## 17-sep-2026 — Ajustes: tres pestañas, y la pantalla propia de un tipo de asunto

Fila 39 de la cola (`docs/COLA.md`, `docs/AJUSTES-POR-TIPO.md`), acordada con Francisco el
17-sep-2026: Ajustes había crecido hasta ser inmanejable. Seis cosas colgaban de un tipo de
asunto —campos, pasos de la guía, plantillas de correo, plantillas de Word, días de plazo y
recurrencia— y cada una vivía en un bloque distinto de una pantalla larguísima; para dejar un
tipo terminado hacía falta entrar y salir de seis sitios, y en ninguno se veía el tipo entero.

Ajustes pasa a tener **tres pestañas** arriba: **Tipos de asunto** (lo de siempre, sin perder
nada: pestañas de categoría, buscador cruzado, aviso en vivo de nombres repetidos, categoría
recordada), **El centro** (las listas que valen para todos los tipos: estados de tramitación,
tipos de documento, catálogo de campos propios, grupos de personas, responsables y días no
lectivos de los hitos, ficheros de datos, cómo se abrevia cada grupo, y datos del centro y
firma) y **Mantenimiento** (lo que no relaciona nada con nada: carpetas de este ordenador,
bandeja de correo, aviso de RegAlum viejo, copias de seguridad, papelera, conflictos de Dropbox,
duplicados descartados y fichas sin carpeta). Y pulsar la tarjeta de un tipo de asunto ya no
abre un cuadro emergente: abre su **pantalla entera**, a dos columnas (una sola por debajo de
1000px), con siete secciones **siempre desplegadas**, sin un solo `<details>` que abrir: Datos
del tipo, Campos, Pasos del trámite, Plantillas de correo y de Séneca, Plantilla de documento de
Word, Plazo y Se repite (recurrencia).

Regla de la cola: mover y envolver lo que ya existe, no reescribir editores. Cada sección de la
pantalla del tipo llama al mismo módulo que ya sabía pintar eso, dentro de su hueco en vez de
como cuadro suelto: `js/campos.js` (la parte que pintaba `App.pintarCuadroDeCampos`, con el
"Aceptar" del cuadro cambiado por un botón propio "Guardar campos", porque una pantalla entera
no tiene un botón de aceptar común; y un aviso ámbar nuevo cuando un campo propio también está
puesto en otros tipos, con `Campos.tiposQueUsanPropio`, que ya existía), `js/guias-enganche.js`
(sin tocar ni una línea: ya exponía `GuiasDelCentro.escribir`/`pasosDe`, justo lo que hacía
falta para una vista de solo lectura más un botón "Escribir/Cambiar la guía"), `js/plantillas-
ajustes.js` y `js/plantillas-documento.js` (cada uno gana una función `pintarDeTipo(contenedor,
tipo)` que filtra sus tarjetas por ese tipo, con el cuadro de alta preseleccionando ya el tipo y
la categoría; los campos de "Datos del centro y firma" pasan de generarse por JavaScript a ser
estáticos en `index.html`, y `plantillas-ajustes.js` se limita a rellenarlos y guardarlos) y
`js/recurrentes.js` (la fila de un recurrente se saca a función compartida, `filaDeRecurrente`,
y gana `pintarEnContenedor(contenedor, tipo)`, filtrada, más un `alta(tipoPreset, alGuardar)`
que abre el alta con el tipo ya puesto). El menú de los tres puntos de la tarjeta se queda con
Cambiar el nombre y Quitar; "Campos" desaparece de ahí, porque ya vive dentro de la pantalla.

La pantalla del tipo se registra en `App.PANTALLAS`, igual que "asunto" (la ficha) o
"que-me-toca": con eso, el botón "← Volver" y la tecla Escape los pone solos `js/usabilidad.js`,
sin escribir una sola línea para ellos, porque su cabecera tiene la misma forma
(`<header class="cabecera"><h2>...</h2></header>`) que todas las demás pantallas de la
aplicación — el mismo mecanismo que ya usaban esas otras dos.

`js/ajustes.js` (52 KB) se parte en cuatro: se queda con el marco (las tres pestañas, la lista de
tipos de la primera y el buscador cruzado, unas 500 líneas) y nacen `js/ajustes-tipo.js` (la
pantalla del tipo y sus siete secciones), `js/ajustes-centro.js` (la pestaña "El centro") y
`js/ajustes-mantenimiento.js` (la pestaña "Mantenimiento"). Los ocho bloques que se enganchan
solos a Ajustes (hitos, conflictos, fichas huérfanas, RegAlum viejo, bandeja de correo,
duplicados descartados, y las dos plantillas) no se tocan por dentro: cambia solo el
`id` del contenedor al que apuntan (`#ajustes-tab-centro` o `#ajustes-tab-mantenimiento` en vez
de `#pantalla-ajustes`).

**Dos trampas de verdad, encontradas probándolo en un navegador, no solo leyendo el código.**
La primera: la sección Campos se pinta entera (con su `document.getElementById` de toda la
vida) ANTES de colgarse del documento —se construye completa y solo después el orquestador la
añade a su columna—, así que `document.getElementById` no encontraba nada dentro de un trozo de
DOM todavía suelto; se resuelve sombreando, dentro de esa única función, un `$` local que busca
con `cuerpo.querySelector` en vez del global. La segunda, más tonta y más reveladora de por qué
"probarlo de verdad" no es opcional: al partir `js/ajustes.js`, el `onclick` de
`#btn-anadir-tipo` (crear un tipo nuevo) se perdió por el camino —se movieron los de estados,
tipos de documento, campos propios y grupos a `js/ajustes-centro.js`, y ese se quedó sin
wire—; nada en la consola avisaba, el botón se veía y respondía al clic con normalidad, y solo
`pruebas/navegador.mjs` lo pilló, fallando en "el tipo nuevo se guarda en mayúsculas". Devuelto
a `js/ajustes.js`, que es donde sigue viviendo la pestaña de tipos.

Pruebas: `pruebas/ajustes-agil.mjs` actualizada para las tres pestañas (el paso que antes
contaba "once bloques en una sola lista larga" ahora cuenta los de la pestaña "Mantenimiento",
que sigue siendo la más larga, para seguir probando que la barra queda fija con la página
larga); nueva `pruebas/ajustes-por-tipo.mjs` (las tres pestañas cambian de contenido, la
pantalla de un tipo trae sus siete secciones sin plegar en dos columnas, cambiar el Plazo y los
Campos se guarda de verdad, volver a la lista no pierde la categoría ni el texto del buscador, y
Escape hace lo mismo que el botón). Doce ficheros de prueba más, tocados solo porque el sitio de
un bloque cambió, sin tocar la lógica que prueban: `pruebas/campos.mjs` (el flujo entero pasa de
cuadro a pantalla del tipo, con capturas de pantalla actualizadas), `pruebas/guias.mjs`,
`pruebas/plantillas-huecos.mjs`, `pruebas/conflictos.mjs`, `pruebas/duplicados.mjs`,
`pruebas/grupos-navegador.mjs`, `pruebas/huerfanas.mjs`, `pruebas/hitos.mjs`,
`pruebas/navegador.mjs`, `pruebas/papelera.mjs`, `pruebas/correo-dos-buzones.mjs`,
`pruebas/correos.mjs` y `pruebas/envios.mjs`. Batería completa en verde, una sola pasada al
final (50 ficheros de prueba). Versión publicada `App.VERSION`: `17-sep-2026 · 21:47`.

---

## 17-sep-2026 — "Lo pide": el nombre del tutor legal, no un número

Fila 38 de la cola (`docs/COLA.md`, `docs/LO-PIDE-NOMBRE-DEL-TUTOR.md`), apuntada por Francisco:
en el bloque "Lo pide" de un asunto de alumnado (Nuevo asunto y ficha), al desplegar "Quién lo
pide" las opciones de tutor legal salían como `Tutor legal 1 · 12345678`, con un número en vez de
un nombre. La causa estaba en `LoPide.datosDeTutor` (`js/lo-pide.js`, fila 28): cogía como nombre
"la primera columna del tutor que no fuera teléfono ni correo", y en el RegAlum del centro esa
primera columna suele ser el documento del tutor, no su nombre.

Cambio quirúrgico, solo en cómo `datosDeTutor` elige la columna del nombre (teléfono, correo,
opciones y guardado se quedan igual). Primero, una lista más larga de columnas que nunca son el
nombre: además de teléfono y correo, documento/dni/nif/nie/pasaporte, identificación/identificador,
número/num/nº/código, parentesco/relación/sexo, fecha/nacimiento y domicilio/dirección/localidad/
municipio/provincia/país/nacionalidad/postal. Con las columnas que sobreviven, el nombre se arma
por prioridad: Apellidos + Nombre si hay las dos columnas (una sola coma, salvo que Apellidos ya
traiga una), si no la que haya de las dos, y si ninguna habla de nombre ni de apellidos, la primera
que quede, como antes. Una red de seguridad cierra el círculo: el valor final tiene que traer al
menos una letra (`\p{L}`, con acentos y ñ) o el nombre se queda vacío, para que un número suelto
nunca vuelva a colarse como si fuera una persona.

Y una mejora que no empeora lo de antes: si el RegAlum no trae el nombre del tutor pero sí su
teléfono o su correo, la opción ya no desaparece del desplegable (antes sí, si `datosDeTutor` no
sacaba nombre no se ofrecía nada); se sigue ofreciendo como "Tutor legal 1" (o 2) a secas, sin
" · " detrás, guardando `relacion: ''` para que la línea de la ficha salga limpia ("Tutor legal 1 ·
por teléfono · fecha", sin repetir "Tutor legal 1" entre paréntesis). `js/plantillas.js` no se ha
tocado: `{tutor1}`/`{tutor2}` llaman a la misma `LoPide.datosDeTutor` y se benefician solos.

Pruebas nuevas en `pruebas/lo-pide.mjs` (escenario "2b", junto a las demás de "Lo pide"), con los
cuatro juegos de columnas de la sección "Pruebas" del encargo, más el caso de solo teléfono/correo
y la comprobación de que `{tutor1}` de las plantillas trae el nombre. Batería completa en verde.
Subido con pull request (fmargon780/gestor-asuntos-ies#30), junto con la fila 40. Versión publicada
`App.VERSION`: `17-sep-2026 · 20:32`.

## 17-sep-2026 — La ficha del asunto, colocada de otra manera

Fila 37 de la cola (`docs/COLA.md`, `docs/FICHA-DEL-ASUNTO-NUEVA.md`), acordada con Francisco en
la misma conversación que la fila 36 y hecha justo después de ella. La izquierda pasa a ser lo que
se trabaja de verdad (Hitos, y ahora también Documentos, que se muda desde la derecha); la derecha,
lo que se consulta y se anota, con "Datos y contacto" la primera (antes era de las últimas cosas
que se veían, al final de la columna), Otros asuntos, Relacionados, Datos del asunto y Notas, ahora
la última: las notas del asunto se usan poco desde que casi todo se escribe como nota de un hito.

**"Datos y contacto" pasa de una tabla de filas a una sola línea**: nombre, grupo (o una etiqueta
de estado en su lugar — ámbar `NO MATRICULADO AA-AA` con "última matrícula" debajo, o azul
`SOLICITANTE`), edad, un solo teléfono etiquetado (el del primer tutor si el alumno es menor de
edad, el suyo si es mayor) y DNI, cada dato con su botón de copiar. Un botón "Ver todo" abre una
ventana con el resto: identificación, matrícula, contacto del alumno, tutores legales, otros datos
de la familia y el volcado plegado de siempre. Lo que no estaba resuelto hasta hoy: **los tutores
legales de Séneca salen agrupados por persona**, en vez de una fila suelta por columna con los
datos de los dos tutores mezclados. `Datos.tutoresDe(alumno)` (nueva, `js/datos.js`) lee el título
de cada columna que ya reconocía `Datos.destacadosAlumno` (`/tutor|padre|madre|responsable|familia/`)
y saca de ahí el número de tutor (un dígito, o "primer"/"segund" en cualquier parte del título) y
la clase de dato (nombre, teléfonos, correos, documento, relación); una columna sin número
reconocible no se pierde, cae en `.otros` del propio array que devuelve. `Datos.destacadosAlumno`
se queda exactamente como estaba: la usan la pantalla de Personas y `js/asuntos-nuevo.js`, y
tocarla se salía del encargo.

Módulo nuevo `js/ficha-asunto.js` ya rondaba las 1.100 líneas, y el encargo pedía explícitamente
no engordarlo más: toda la lógica de "Datos y contacto" (la línea y la ventana "Ver todo") vive en
`js/ficha-tercero.js` nuevo, que se habla con la ficha solo por
`window.FichaTercero.pintarLinea(caja, a)`, el mismo patrón que ya usaba `FichaDocumentos.pintar`.
El resultado es que `js/ficha-asunto.js` no solo no engorda: baja, de 1.065 a 968 líneas, porque
`pintarContacto`/`contactoPlegado`/`contactoSuelto` y el cuerpo entero de `pintarLasNotas`
desaparecen, sustituidos por envoltorios de una línea que llaman a `js/ficha-tercero.js` y
`js/notas.js`. Como `js/copiar.js` es privado a sus propias pantallas (nada colgado de `window`),
`js/ficha-tercero.js` rehace en pequeño su mismo botón de copiar, sin tocar ese fichero. Tampoco
hay botón "Escribirle" en las tarjetas de tutor: `js/correo.js` no expone ninguna función pública
para abrir su cuadro con un destinatario ya puesto (`abrirCuadro` es privado a su propio IIFE), y
el propio encargo preveía dejarlo fuera si eso pedía tocar ese fichero.

**Las notas del asunto pasan a ser una caja de escribir directa**, al estilo del tablón: ya no hace
falta pulsar "Añadir nota" antes de escribir. `Notas.pintarEnFicha` (`js/notas.js`) guarda sola,
con `U.mientrasGuarda` y un retardo de un segundo desde la última tecla, nunca una escritura por
pulsación; mientras se sigue escribiendo (aunque la ficha se repinte sola por debajo) el texto va a
la MISMA nota, con `Notas.sustituir` y una clave de sesión (`borradorAbierto`); `App.abrirFicha`
llama a `Notas.olvidarBorrador()` para que la próxima ficha que se abra empiece una nota nueva.

**Trampa encontrada probándolo, que no estaba en el encargo**: el guardado automático cambia
`a.ficha` por dentro sin que nadie más se entere, y eso dejaba atrasada la "huella" que decide si
la ficha necesita repintarse de verdad (fila 34, `docs/NOTAS-DEL-ASUNTO-NO-SE-BORRAN.md`). El
próximo repintado en segundo plano (cada pocos segundos, por `App.mirarLaCarpeta` o la vigilancia
de presencia) se creía entonces que algo había cambiado DE VERDAD fuera de la ficha, y rehacía la
ficha entera sin hacer falta — llevándose por delante, de paso, una nota de un hito que se
estuviera escribiendo a la vez en otro campo. Lo cazaron `pruebas/notas-asunto-no-se-borran.mjs`
(el escenario 4, ya existente) y, de rebote, también `pruebas/notas-no-se-borran.mjs`, una prueba
casi idéntica que dejó otra sesión en paralelo ese mismo día para la fila 34. Se arregla pasando
`apuntarHuella` (que `js/ficha-asunto.js` ya tenía) como cuarto argumento de `Notas.pintarEnFicha`,
para volver a apuntar la huella justo después de cada guardado automático: así un cambio que ya se
sabe de sobra no vuelve a disparar un repintado de más.

**Al empezar esta fila, `docs/COLA.md` estaba corrupto en `origin/main`**: un commit de otra
sesión, arreglando una tilde perdida de la fila 27 (regla 12 de la cola, comprobar el hash tras
subir un fichero grande), subió literalmente el texto `$(cat /tmp/test-clone/docs/COLA.md)` en vez
del contenido de verdad — la misma trampa de la regla 11 (nunca subir un texto de relleno), esta
vez disparada al revés, intentando arreglar justo lo que esa regla avisa. Al fusionar `main` con
esta rama se resolvió el conflicto quedándose con la versión buena de `docs/COLA.md`; en cuanto
esta fila se fusione, `main` queda arreglado también.

Prueba nueva `pruebas/ficha-tercero.mjs` (jsdom, sin navegador), con los 8 escenarios del encargo:
`Tutor1`/`Tutor 2` y `Primer tutor`/`Segundo tutor`, una columna de familia sin número, un alumno
sin tutores, el teléfono de un menor (el del tutor) y de un mayor (el suyo), y las etiquetas de
matrícula (no matriculado, con su renglón de última matrícula, y solicitante, sin él). Escenario
nuevo en `pruebas/notas-asunto-no-se-borran.mjs`: el orden de los bloques nuevo, y que la nota se
guarda sola sin perder lo escrito. Batería completa en verde. Subido con pull request
(fmargon780/gestor-asuntos-ies#29). Versión `App.VERSION`: `17-sep-2026 · 20:05`.

---

## 17-sep-2026 — Archivar sin atascos: mensajes en castellano y carpetas movidas

Fila 45 de la cola (`docs/COLA.md`, `docs/ARCHIVAR-ATASCOS.md`), escrita el mismo día pidiendo
ser la fila 33, pero ese número se lo llevó `TABLON-NO-SE-BORRA.md` y quedó fuera de la cola
hasta ahora. Seguía habiendo un asunto real atascado incluso después de la fila 32: al pulsar
Archivar salía "No se ha podido archivar: A requested file or directory could not be found at
the time an operation was processed" — un `NotFoundError` del navegador, en inglés, porque
`App.cerrarAsunto` enseñaba `e.message` tal cual.

Antes de escribir nada, se comprobó qué quedaba pendiente de verdad: las filas 32, 33 y 34 ya
habían tocado `js/carpetas.js`/`js/asuntos-archivar.js`, pero `U.mensajeDeError` no existía, la
cuenta de ficheros no se saltaba los temporales de sincronización al copiar, y ni
`App.cerrarAsunto` ni `App.reabrirAsunto` reconocían una carpeta que ya se había movido por otro
camino (el otro ordenador, o un intento anterior que sí llegó a completarse).

- `U.mensajeDeError(e)` nuevo (`js/util.js`): un solo sitio para traducir por `e.name`
  (`NotFoundError`, `NotAllowedError`, `NoModificationAllowedError`/`InvalidStateError`,
  `QuotaExceededError`, `AbortError`; cualquier otro, tal cual, porque los nuestros ya están en
  castellano). Lo usan las dos funciones de `js/asuntos-archivar.js` en su `catch`.
- `js/carpetas.js`: `contarFicheros`, `copiarDentro` y la fusión se saltan ahora todo lo que
  `esCarpetaTemporalDeSincronizacion` reconozca (antes solo se usaba en otro sitio; ahora también
  aquí, con ficheros y no solo carpetas), para que la cuenta de origen y la de destino hablen de
  lo mismo. Y un `getFile()` que revienta con `NotFoundError` a mitad de copia (un fichero que
  Dropbox está moviendo justo en ese instante) se reintenta una vez tras esperar un segundo
  (`leerFicheroParaCopiar`); si sigue sin estar, el error dice su nombre, en castellano, y no se
  borra nada.
- `js/asuntos-archivar.js`: `App.cerrarAsunto` mira primero, dentro del `try`, si la carpeta
  sigue en Asuntos abiertos. Si no está pero ya está en `ARCHIVO/categoría/tercero`, es que el
  archivado ya se hizo por otro camino: no copia nada, pone la ficha al día y avisa en verde. Si
  no está en ningún sitio, avisa en ámbar pidiendo pulsar Recargar, nunca con un mensaje del
  navegador. `App.reabrirAsunto` hace lo mismo con `a.padre` (el manejador guardado al pintar la
  pantalla ARCHIVO, que puede estar viejo): si no sirve, se recalcula con los datos de la ficha; si
  tampoco aparece ahí pero ya está en Asuntos abiertos, se da por reabierto sin copiar nada.
- Clase CSS nueva `.mensaje.ambar` en `css/estilos.css` (con `--ambar-linea`, que ya existía para
  otras cosas): los avisos flotantes de `U.aviso` solo tenían `malo` y `bueno`.

Prueba nueva `pruebas/archivar-atascos.mjs`, en navegador de verdad (reutiliza el disco de
mentira de `pruebas/navegador.mjs`, como ya hace `pruebas/tablon-no-se-borra.mjs`), con los seis
escenarios del documento; comprobado con `git stash` de los cuatro ficheros de código (sin tocar
la prueba) que fallaba sin el arreglo. Batería completa en verde (44 ficheros).

No se han partido `js/carpetas.js` (478 líneas) ni `js/util.js` (421 líneas), aunque pasan de las
"unas 400" habituales: `js/carpetas.js` ya estaba en 449 antes de esta fila, y partir cualquiera
de los dos habría obligado a tocar además cuatro ficheros de prueba que los cargan sueltos, sin
más scripts (`pruebas/copias.mjs`, `pruebas/dni-personal.mjs`, `pruebas/logica.mjs`,
`pruebas/plantillas-documento.mjs`), fuera del alcance de este documento. Queda anotado por si
conviene una fila dedicada a partirlos.

---

## 17-sep-2026 — "Insertar hueco": un buscador en vez de un muro de botones

Fila 35 de la cola (`docs/COLA.md`, `docs/HUECOS-INSERTAR.md`), acordada con Francisco el mismo
día: al crear o editar una plantilla de correo en Ajustes, un botón por cada hueco disponible
(más de treinta: nombre del tercero, grupo, año académico, DNI, teléfono de cada tutor...)
ocupaba casi toda la pantalla y tapaba el nombre de la plantilla y el tipo de asunto, arriba del
todo.

Se sustituye por un solo botón, "Insertar hueco", que abre un cuadro pequeño y flotante junto al
propio botón —no un segundo `U.preguntar`: el editor de la plantilla ya está usando el único
cuadro de diálogo que hay— con un buscador (sin mayúsculas ni tildes), la lista de huecos que
encajan (nombre en claro y, en gris, el código entre llaves), navegable con las flechas y Enter, y
Escape que cierra sin insertar nada, con su propio `stopPropagation` para no disparar el Escape
general de `js/usabilidad.js`. El hueco elegido entra donde estuviera el cursor del campo de
texto, sustituyendo lo seleccionado si había algo, y si no se había tocado el campo todavía, al
final.

La ayuda es reutilizable: `U.engancharInsertarHueco(boton, campos, huecos, alInsertar)`, nueva en
`js/util.js`, recibe una lista de campos (por si algún día hace falta más de uno) y recuerda cuál
tuvo el foco por última vez, guardando también su cursor al perderlo (en el propio `blur`, porque
al abrir el buscador el foco se va de todos). **El encargo daba por hecho un segundo campo, el
"asunto del correo", que hoy no existe**: el editor de una plantilla solo tiene un campo con
huecos (`#pl-texto`); el asunto del correo lo monta él solo `js/correo.js`, sin plantilla ni
huecos. La ayuda queda lista para un segundo campo si se añade alguna vez, pero no se ha inventado
ninguno para poder probarlo.

Revisado también `js/plantillas-documento.js` (el editor de plantillas de Word), que tiene su
propia lista de huecos (`#pd-huecos`): es una tabla de referencia con botón "Copiar", no un muro
que inserte en el cursor de un campo (el documento se edita en Word, fuera de la aplicación), y
vive en su propio bloque plegado sin tapar ningún formulario. No es el mismo fallo, y no se ha
tocado; tampoco `js/plantillas.js`, que ya exponía `Plantillas.HUECOS` como `{clave, etiqueta}`.

Prueba nueva `pruebas/plantillas-huecos.mjs`, en navegador de verdad: ya no existe el muro, el
buscador filtra, el hueco entra en el sitio exacto del cursor o al final si no se había tocado el
campo, Escape cierra sin insertar y sin propagarse, y la vista previa se actualiza sola.
Comprobado que falla sin el arreglo (sin el botón, la prueba no encuentra `#pl-insertar-hueco`).
Batería completa en verde.

## 17-sep-2026 — El tablón y las notas de un asunto no se borran mientras se escriben

Dos fallos urgentes, en el mismo sitio del código y con la misma causa, avisados por Francisco el
mismo día (filas 33 y 34 de la cola, `docs/TABLON-NO-SE-BORRA.md` y
`docs/NOTAS-DEL-ASUNTO-NO-SE-BORRAN.md`): un repintado automático de fondo rehacía con `innerHTML`
un `<textarea>` a medio escribir, sin mirar si Francisco tenía el foco puesto ahí, y se llevaba por
delante lo que llevaba escrito.

**Fila 33, el tablón.** La vigilancia de presencia (fila 24, `js/presencia.js`) repintaba
`App.pintarAbiertos()` cada 10 segundos, hubiera cambiado algo o no; como el tablón de notas
rápidas vive dentro de `#pantalla-abiertos`, se llevaba por delante `#tablon-texto`.
`Presencia.huella()` (claves y usuarios de la caché, en texto) deja que el intervalo solo repinte
si de verdad cambia quién está dentro de algún asunto, con una segunda barrera que lo frena entero
mientras el foco esté en cualquier `input`/`textarea`/`select`/`contenteditable`. En `js/tablon.js`,
lo escrito en la nota nueva vive también en variables del módulo (`borrador`, `borradorFecha`, al
día con `input`/`change`), no solo en el DOM, y `pintar()` devuelve el foco y el cursor
(`selectionStart`/`selectionEnd`) al campo nuevo o al de una nota en edición. Prueba nueva
`pruebas/tablon-no-se-borra.mjs`, comprobado que falla sin el arreglo.

**Fila 34, dentro de un asunto: el mismo fallo donde Francisco lo sufría de verdad.** La ficha de
un asunto se repintaba entera cada vez que se reenganchaba (`App.mirarLaCarpeta` →
`App.verAbiertos` → `App.reengancharFicha`, fila 30), hubiera cambiado algo o no, y rehacía con
`innerHTML` el `<textarea id="ficha-nota-texto">` de la nota del asunto y el
`<textarea class="hito-nota-texto">` de la nota de un hito. No hacía falta esperar al reloj:
bastaba con que el compañero dejara un papel suelto en "Por clasificar" para que la ficha abierta
se rehiciera entera.

- `U.conservandoLoEscrito(raiz, hacer, clavePara)`, nueva en `js/util.js`, reutilizada por las dos
  filas: apunta valor, foco y cursor de cada `textarea`/`input` de escribir de `raiz` antes del
  repintado, y se los devuelve a los que vuelvan a salir **vacíos** (nunca pisa un valor que el
  repintado haya traído con contenido). La identidad de un campo es su `id`, o la clave que dé
  `clavePara` para los que no pueden llevarlo (uno por hito).
- `js/ficha-asunto.js`: `pintar()` y `pintarNotas()` pasan por esa ayuda. Y la otra mitad del
  arreglo: **la ficha ya no se repinta si no ha cambiado nada**, comparando una huella de texto del
  asunto partida en dos (ficha e hitos), para que un cambio solo de hitos le pida el repintado al
  panel de hitos en vez de rehacer la ficha entera. Trampa encontrada probándolo, fuera del
  encargo: con la pantalla quieta, los botones ya pintados se quedaban con el objeto viejo del
  asunto, y "Archivar el asunto" volvía a preguntar "¿Dónde va esta carpeta?" con la categoría ya
  puesta; se arregla metiendo los datos frescos DENTRO al objeto que la ficha ya tiene (un asunto
  es un solo objeto en toda la aplicación).
- `js/hitos-panel.js`: su repintado entero va dentro de la misma ayuda, con el `MutationObserver`
  desconectado mientras tanto (devolver un valor no puede disparar otro repintado, fila 31) y
  volviendo a desplegar el hito que tuviera algo a medias antes de devolver el foco.

Prueba nueva `pruebas/notas-asunto-no-se-borran.mjs`, en navegador de verdad, comprobado que falla
sin el arreglo. Batería completa en verde. La fila 33 se subió directo a `main`, sin pull request;
la 34 también, en la misma sesión que además reparó `docs/CONTEXTO.md` (ver la entrada siguiente).

## 17-sep-2026 — `docs/CONTEXTO.md` se quedó con un texto de relleno, y se ha recuperado

Durante el trabajo de la fila 33, un intento de subir `docs/CONTEXTO.md` entero dejó el fichero en
`main` con solo la palabra `PLACEHOLDER_WILL_REPLACE` (24 bytes) en vez de sus 1.817 líneas: la
sesión estaba escribiendo el fichero a mano, de una vez, y algo se truncó a mitad. La siguiente
sesión (la de la fila 34) lo notó, y varios intentos de recuperarlo con el mismo método (escribir
el fichero entero a mano, en dos o tres partes por su tamaño) volvieron a dejarlo a medias más de
una vez, con la cola apuntando cada tropiezo (de ahí la regla 11, nueva, al final de esta página).

Se ha recuperado del todo con `git show a29a7cf:docs/CONTEXTO.md` (la última versión completa,
antes del incidente) y, encima, se le han metido los dos cambios que faltaban: la descripción de
`App.reengancharFicha` puesta al día con la fila 34 (huella en dos mitades; un asunto es un solo
objeto) y `U.conservandoLoEscrito` añadido a "Avisos técnicos". Comprobado con `wc -l` que el
fichero recuperado tiene sus 1.817 líneas de partida, más lo nuevo.

## 17-sep-2026 — Apuntar un documento a un hito

Fila 31 de la cola (`docs/COLA.md`, `docs/APUNTAR-DOCUMENTO-A-HITO.md`), la mitad que le faltaba
a la fila 15: el modelo ya guardaba los documentos apuntados y la lista ya se pintaba con su ✕,
pero no había ninguna forma de apuntar uno. Botón nuevo "Apuntar un documento" en el cuerpo
desplegado de cada hito abierto, que abre `js/hitos-documentos.js` (nuevo, `window.HitosDocumentos`):
un cuadro con casillas sobre los documentos de la carpeta del asunto; al aceptar, llama a
`Hitos.anadirDocumento`/`quitarDocumento` (ya existían) y pide el repintado. El bloque de
documentos pasa a pintarse siempre que el asunto está abierto, aunque no haya ninguno apuntado
(antes solo salía si ya había uno, y por eso Francisco no encontraba por dónde empezar). Cada
nombre es pulsable y abre el documento en el panel de la derecha.

Dos trampas de verdad, encontradas probándolo en un navegador de verdad (no solo leyendo el
código):

- **Saber si un apuntado ya no está en la carpeta no se puede corregir después de pintar, a
  mano.** La primera versión leía `Carpetas.ficheros` en un `.then()` tras el repintado y tocaba
  el botón directamente; el `MutationObserver` de `js/hitos-panel.js` (vigila `#ficha-guia`)
  detectaba esa propia corrección como un cambio más y volvía a repintar, sin parar. Arreglado
  leyendo la carpeta **una vez por repintado**, en `js/hitos-panel.js`, antes de tocar el DOM, y
  pintando ya bien "(ya no está)" en el HTML de la primera pasada.
- **Nunca marcar ese botón con el atributo `disabled`.** `js/ficha-asunto.js`
  (`aplicarModoConsulta`) reactiva solo, sin preguntar por qué estaba apagado, todo lo que
  encuentre dentro de `#ficha-asunto-cuerpo` en cuanto no hay nadie en modo consulta: un botón
  "ya no está" con `disabled` se quedaba reactivado unos 30 ms después de cada repintado, siempre.
  Se resuelve sin ese atributo: solo la clase `hito-doc-falta` (en gris por CSS, sin engancharle
  ningún `onclick`).

Prueba nueva en `pruebas/hitos.mjs` (escenario 6, en navegador de verdad): apuntar, reabrir el
cuadro (sale marcado), desmarcar (desaparece), y un apuntado que ya no está en la carpeta sale en
gris con "(ya no está)", también dentro del propio cuadro de apuntar. Batería completa en verde.

## 17-sep-2026 — Quedarse en el asunto tras guardar un documento

Fila 30 de la cola (`docs/COLA.md`, `docs/QUEDARSE-EN-EL-ASUNTO.md`): "Tras guardar un documento
en un asunto, la aplicación nos expulsa fuera del asunto, a la lista de asuntos abiertos", con
palabras de Francisco. La causa no estaba en ninguna de las siete acciones que guardan un
documento (todas ya se quedaban en su sitio y refrescaban su propio trozo de la ficha), sino en
que `App.verAbiertos` relee la carpeta entera y crea asuntos nuevos cada vez que se llama —y se
llama sola, desde `App.mirarLaCarpeta`, cada `App.SEGUNDOS_ENTRE_MIRADAS`—: el asunto que tenía la
ficha en la mano se quedaba con un objeto viejo, y su lista de documentos no se enteraba de lo que
había llegado por el barrido automático (comprobado en vivo con un navegador de verdad: sin el
arreglo, un documento guardado mientras la ficha estaba abierta no aparecía en `#ficha-documentos`
hasta salir y volver a entrar).

`js/ficha-asunto.js` envuelve `App.verAbiertos` (mismo patrón que sus demás envolturas) para que
cualquier llamada —el barrido automático, el botón "Recargar", añadir un tipo que faltaba, meter
un suelto o un correo en un asunto— reenganche sola el asunto de la ficha abierta, por su nombre,
y la repinte en su sitio, con dos funciones públicas nuevas: `App.fichaAbierta()` (el nombre del
asunto que se ve de verdad, comprobando el DOM, no solo una variable que se queda puesta al
cambiar de pestaña sin pulsar "Volver") y `App.reengancharFicha()` (la reenganche, o vuelve a la
lista con un aviso si el asunto ya no está en absoluto). `anadirTipo` (que ya hacía este apaño a
mano) pasa a apoyarse en el mismo mecanismo, sin repetirlo. **Editar**, **Archivar/Reabrir** y
**Borrar** siguen siendo los únicos que de verdad vuelven a la lista.

Prueba nueva `pruebas/quedarse-en-el-asunto.mjs`, en navegador de verdad, con los cuatro
escenarios del encargo (comprobado que falla sin el arreglo: sin `App.fichaAbierta`, y sin que el
documento nuevo apareciera en la ficha). Batería completa en verde.

## 17-sep-2026 — Archivar cuando la carpeta ya existe en el destino

Fila 32 de la cola (`docs/COLA.md`, `docs/ARCHIVAR-CARPETA-YA-EXISTE.md`), la primera de la lista
porque le estaba bloqueando un asunto real ahora mismo: al archivar, Francisco recibía "Ya hay
una carpeta llamada ... en el destino" y ya no podía volver a intentarlo nunca.

La causa: `Carpetas.trasladar` crea la carpeta de destino y copia dentro; si la copia falla a
mitad (Dropbox sincronizando, un fichero bloqueado), esa carpeta se quedaba a medias, sin nadie
que la limpiara, y el siguiente intento se la encontraba y se paraba ahí, siempre. Ahora
`trasladar` limpia el destino a medias si algo falla, y se añade `Carpetas.fusionarEn` para
cuando el destino ya existe de verdad (de un archivado de antes de este arreglo): junta las dos
carpetas sin perder nada (mismo nombre y tamaño, no se duplica; mismo nombre y distinto tamaño,
se guarda al lado con "(2)"), y solo borra el origen si la comprobación final sale en verde.
`App.cerrarAsunto`/`App.reabrirAsunto` avisan en el propio cuadro de confirmación cuando toca
fusionar, con el mismo botón de siempre, sin preguntar nada más.

De paso, `js/documentos-sueltos.js` (pasaba de 400 líneas) suelta esas dos funciones a
`js/asuntos-archivar.js` nuevo, sin que `js/relacionados.js` ni `js/hitos-archivo.js` (que las
envuelven) hayan tenido que tocarse. Prueba nueva `pruebas/archivar-fusion.mjs`, sin navegador,
con los siete escenarios del encargo (comprobado que falla sin el arreglo). Batería completa en
verde.

## 17-sep-2026 — El DNI del personal, a la vista

Fila 29 de la cola (`docs/COLA.md`, `docs/DNI-DEL-PERSONAL.md`), acordada con Francisco el mismo
día. El dato ya estaba (`persona.documento`, de la columna `DNI/Pasaporte` de Séneca o de
`Documento` en `personal.csv`), pero `Datos.destacadosPersona` no lo subía a los destacados: caía
en `resto`, escondido detrás de "Ver los demás datos del fichero". Ahora sale la primera fila de
todas, por encima de `Puesto`, y ya no se repite abajo (misma comparación por valor que hace
`js/dni.js` con el alumnado). En la línea de debajo del nombre (`App.piePersona`,
`js/asuntos-nuevo.js`) ya se enseñaba el documento a secas, en medio de la línea; ahora sale
etiquetado ("DNI ...") y al final, después de "alta a mano" si toca. Sin aviso por edad: eso es
solo del alumnado, y `js/dni.js` no se ha tocado. Prueba nueva `pruebas/dni-personal.mjs`, sin
navegador, más los casos que se han tenido que corregir en `pruebas/logica.mjs` (los índices de
`destacados[]` se desplazan una posición al meter el DNI delante). Batería completa en verde.

## 17-sep-2026 — "Lo pide": quién ha pedido la gestión

Fila 28 de la cola (`docs/COLA.md`, `docs/LO-PIDE.md`), acordada con Francisco el mismo día. Nace
del problema real: se pide un certificado, pasan los días, y cuando está listo ya no se recuerda a
quién hay que contestar (el padre, la madre, el propio alumno...).

**Qué cambia.** Cada asunto puede guardar, si se quiere, quién lo pidió, por qué vía y en qué
fecha: clave nueva y opcional `loPide` en `_GESTOR/asuntos.json`, con `nombre`, `categoria`,
`relacion`, `correo`, `telefono`, `via`, `fecha` y `apuntadoPor`. Se apunta al crear el asunto
(grupo "Lo pide (opcional)" en `js/asuntos-nuevo.js`) o después, con el botón "Lo pide" de la
ficha (`js/ficha-asunto.js`), que también enseña una fila ("Lo pide", debajo de "Vía de
comunicación") y una marca en la cabecera cuando hay dato. En el cuadro de Correo
(`js/correo.js`), si se conoce el correo de quien lo pide, se marca su casilla sola (y se
desmarcan las demás); si no está en la lista, va a "Otro correo"; y sale una línea gris "Lo pidió
Fulano (relación), el día tal" encima de "Para". En Séneca, `aQuien` dice el nombre de quien lo
pide en vez del de siempre. Cuatro huecos nuevos de plantilla (`js/plantillas.js`):
`{quienlopide}`, `{quienlopiderelacion}`, `{quienlopidevia}`, `{quienlopidefecha}`.

**Toda la lógica, en un módulo nuevo.** `js/lo-pide.js` (`window.LoPide`) para no engordar
`js/asuntos-nuevo.js`, `js/ficha-asunto.js` ni `js/correo.js`: `LoPide.opciones(persona)` ofrece
"El propio interesado", "Tutor legal 1/2" (solo alumnado, y solo si Séneca trae su nombre) y "Otra
persona…"; `LoPide.controles(caja, persona, valorInicial)` pinta esos controles (con clases, nunca
con id: el mismo módulo se monta a la vez en la pantalla de "Nuevo asunto", que queda en el
documento aunque escondida, y en el cuadro de la ficha, y dos elementos con el mismo id habrían
roto el segundo sitio); `LoPide.texto`/`LoPide.correoDe` leen el dato guardado. `datosDeTutor`
(antes privada de `js/plantillas.js`) se sacó aquí, pública, porque `LoPide.opciones` también la
necesita: `js/plantillas.js` ahora la llama en vez de tener su propia copia. La decisión de qué
casilla marcar en el cuadro de Correo también se sacó como función pura, `LoPide.elegirDestinatarios`,
para poder probarla sin cargar ese cuadro (no expone nada hacia fuera).

**El parentesco real (padre, madre, abuela) queda fuera**, a propósito: el RegAlum no trae esa
columna, así que la relación se enseña como "Tutor legal 1"/"Tutor legal 2", y solo con "Otra
persona…" se escribe a mano. Ya estaba anotado en "Lo que vendrá después" de `docs/COLA.md`.

Prueba nueva `pruebas/lo-pide.mjs`, sin navegador (jsdom), con los siete escenarios del encargo.
Batería completa en verde. No se ha tocado `js/conflictos.js`, `js/asuntos-editar.js`,
`js/papelera.js`, `js/asuntos-lista.js` ni `apps-script/gestor-correos.gs`.

## 17-sep-2026 — Las horas de `App.VERSION` iban por delante de la real

Francisco avisó: siendo las 09:13 de verdad, la aplicación decía `17-sep-2026 · 18:20`. La causa
no era código: `App.VERSION` es una línea que Claude Code escribe a mano cada vez que publica algo,
y en esta sesión se había ido subiendo el número a ojo (12:10 → 16:40 → 18:20) sin mirar ningún
reloj de verdad. El contenedor de esta sesión sí tiene la hora real de España
(`TZ='Europe/Madrid' date` da la hora correcta); el fallo era no usarla. Corregido a la hora real
(`09:15`) y dejada la receta exacta en un comentario de `js/version.js`, más el aviso en
`docs/CONTEXTO.md` y en la regla 4 de `docs/COLA.md`, para que no se repita.

## 17-sep-2026 — La bandeja de correos, dentro de "Por clasificar" y plegada

Fila 27 de la cola (`docs/COLA.md`, `docs/CORREOS-DENTRO-DE-POR-CLASIFICAR.md`), detrás de la 26.
No era una función nueva: la bandeja ya funcionaba, lo que molestaba a Francisco era que ocupara
la parte de arriba de la pantalla todo el rato, siempre desplegada, se trabajara con ella o no.

**Qué cambia.** La bandeja se ve solo dentro de "Por clasificar" (`#zona-clasificar`), encima de
la lista de documentos sueltos, detrás de una barra "Correos sin clasificar (N)" que se pliega y
despliega al pulsarla y que **siempre arranca plegada** al entrar en la vista, se dejara como se
dejara la última vez (sin memoria en `localStorage`, a propósito, y sin `<details>`: el mismo
patrón que el plegado de "Filtros"). El botón "Mirar ahora" se va dentro del bloque desplegado, y
desaparece la cabecera "Correos por convertir en asunto" con su cuenta: la sustituye la barra. La
lectura de correos sigue corriendo igual con el bloque plegado, y el número de la barra se
actualiza aunque no se esté mirando esa vista.

**Una trampa real, no solo teórica.** La caja de envíos (`#bandeja-envios`, "Borrador en camino")
se anclaba con `$('bandeja-correos') || paneles.nextSibling`: al dejar `#bandeja-correos` de ser
hermana de `.paneles` (ahora vive dentro de `#zona-clasificar`), esa línea habría intentado
`insertBefore` sobre un nodo que ya no es hijo directo del mismo padre. Se fijó explícitamente a
`paneles.nextSibling`, tal como pedía el encargo, y `pruebas/envios.mjs` lo confirma en verde.

**El reparto de ficheros.** `js/bandeja-correos.js` bajaba de 1.478 líneas: la parte de pantalla
(la barra, la caja, cada tarjeta, la línea de "ya guardado") pasa a `js/bandeja-pantalla.js`
nuevo, hablándose con el de siempre por `window.Bandeja`, al que se le han añadido las piezas que
le faltaban (leer el estado actual de `correos`, adivinar, guardar, mirar de nuevo, pedir permiso,
las utilidades de fecha e icono) sin renombrar ni quitar nada de lo que ya usaban
`js/bandeja-enlace.js` y `js/correo-adjuntos.js`.

**Pruebas**: `pruebas/correos.mjs` y `pruebas/correo-dos-buzones.mjs` ajustan su ayudante
`mirarLaBandeja()` para entrar en "Por clasificar" y desplegar la barra; se suma en
`pruebas/correos.mjs` una prueba de que la barra arranca plegada con el número ya al día, y de que
vuelve a plegarse sola al reentrar en la vista aunque se dejara abierta. `pruebas/envios.mjs` y
`pruebas/refresco.mjs` no necesitaban cambios. Batería completa en verde.

## 17-sep-2026 — Los hitos son la guía, no un añadido

Fila 26 de la cola (`docs/COLA.md`, `docs/HITOS-SON-LA-GUIA.md`). Corrige un malentendido de
diseño de la fila 15 (`docs/HITOS.md`): al ver el resultado en pantalla, Francisco dejó claro que
nunca quiso dos cosas — la guía como texto con casillas por un lado, y los hitos por otro. Quiso
una: los pasos de la guía SON los hitos.

**Qué cambia.** Al abrir la ficha de un asunto abierto cuyo tipo tiene guía y que todavía no
tiene hitos, estos se crean solos, importando lo que ya estuviera marcado en
`pasosHechos`/`pasosElegidos` si el asunto ya existía desde antes. Sin botón, sin preguntar. La
guía deja de pintarse como texto con casillas en la ficha: en su sitio queda la lista de hitos,
bajo el título "Hitos" (antes "Guía del procedimiento"). Se conserva el enlace de escribir o
cambiar la guía del tipo, al final del bloque. Desaparecen el botón "Crear los hitos de la guía"
y el bloque `#hitos-entrada`: si el tipo no tiene guía, el bloque "Hitos" sale vacío con
"+ Añadir el primer hito".

**La trampa de la doble creación.** El observador de `js/hitos-panel.js` repinta cada 30 ms y
crear los hitos es asíncrono (una lectura y una escritura); mirar solo si ya hay hitos no basta,
porque dos repintados pueden colarse antes de que la escritura anterior termine. Se ha añadido un
cerrojo por clave de asunto (`creandoDesdeGuia`). Al probarlo, salió una segunda carrera más sutil:
`modoActual` (si la ficha se abrió como abierta o archivada) se queda **fijo** desde que se abrió
la ficha, y archivar un asunto no vuelve a llamar a `App.abrirFicha`. Si algo repintaba la ficha
(la vigilancia de presencia, por ejemplo) justo mientras se archivaba, después de que
`hitos.json` ya se hubiera vaciado pero antes de salir de la pantalla, los hitos se recreaban
solos sobre un asunto que se estaba cerrando. Se comprueba también contra `App.E.registro`, que sí
se actualiza al momento, tratando "sin ficha en el registro todavía" (un asunto recién encontrado,
nunca anotado) como abierto: solo un `estado: 'cerrado'` explícito bloquea la creación.

**El reparto de ficheros.** `js/ficha-asunto.js` bajaba de 1.100 líneas al quitarle este cambio la
guía-con-casillas, pero se ha aprovechado para partirlo: los documentos de la carpeta pasan a
`js/ficha-documentos.js` (hablándose por `window.FichaDocumentos.pintar`), dejando en
`js/ficha-asunto.js` solo la cabecera, las acciones, las notas, el contacto y el enlace de la
guía.

**Pruebas reescritas del todo**: `pruebas/guias.mjs` y `pruebas/opciones.mjs` ya no esperan
`.paso-casilla`/`.guia-opcion`/`.guia-rama` dentro de la ficha, sino hitos; `pruebas/hitos.mjs`
cambia su escenario 2 (ya no hay botón que pulsar) y suma una prueba de que abrir la misma ficha
dos veces seguidas no duplica los hitos.

## 17-sep-2026 — Separar, unir y sacar páginas de un PDF

Fila 22 de la cola (`docs/COLA.md`, `docs/SEPARAR-Y-UNIR-PDF.md`), punto 4 de
`docs/PROXIMOS-ASUNTOS.md`. Con esta fila se termina la lista que Francisco dictó el
14-sep-2026: no queda ningún punto suelto de aquella conversación.

Contado por Francisco, tres casos de su trabajo normal: escanea varios papeles de una vez y le
sale un solo PDF que hay que partir; un mismo documento le llega en varios ficheros que hay que
juntar; y de un PDF largo solo le interesan una o dos páginas.

**Por qué pdf-lib, y no a mano.** La fila 17 escribió los `.docx` a mano (ZIP y XML, sin
librerías), porque un `.docx` es un ZIP con XML dentro y eso se puede hacer sin depender de
nadie. Un PDF no: la tabla de objetos y las referencias cruzadas de su estructura interna no se
pueden montar a mano sin escribir, en la práctica, un lector y un escritor de PDF enteros. Se ha
copiado **pdf-lib** en `js/lib/`, igual que ya está copiada pdf.js, y cargada solo la primera vez
que hace falta: no se trae de internet en caliente, tiene que funcionar con la red del centro.
Las páginas se copian tal cual (`copyPages`), así que no se pierde calidad ni el sello de
registro que llevaran dentro.

**Dónde se hace.** Francisco pidió hacerlo con el papel ya vinculado al asunto, para que lo que
salga siga vinculado. Pero un escaneo de golpe puede traer papeles de varios asuntos distintos, y
si hubiera que vincular antes de partir no se podría repartir; por eso las tres acciones están
también en Por clasificar, con la misma máquina (`js/pdf-herramientas.js` para los bytes,
`js/pdf-separar-unir.js` para la pantalla) y solo cambia qué se hace con el resultado: en un
asunto, el cuadro de ponerle nombre de siempre; en Por clasificar, un nombre automático
(`(i de N)`, `(unido)`, `(paginas sacadas)`) sin preguntar nada.

**Alcance decidido aquí**: los botones nuevos van en la ficha del asunto y en las tarjetas de Por
clasificar, no dentro del cuadro "Gestionar documentos" (que ya tiene cuatro botones por fila).
Y en vez de leer el número de páginas de cada PDF solo para decidir si el botón Separar se
enseña o no (que obligaría a abrir todos los PDF de la carpeta de antemano, sea cual sea el
tamaño), el botón siempre sale, y si el PDF tiene una sola página, el propio cuadro lo dice al
abrirse.

Al escribir la prueba en navegador se ha encontrado y arreglado un fallo del disco de mentira
compartido por todas las pruebas (`pruebas/navegador.mjs`): `createWritable().write(...)` leía
cualquier `Blob` o `File` con `.text()`, que decodifica el contenido como UTF-8; con un PDF de
verdad (bytes binarios, no texto) eso cambia el tamaño al volver a codificarlo, y la
comprobación de "la copia ha salido completa" (la misma que usan `Carpetas.renombrarFichero` y la
papelera) fallaba en seco. Se ha cambiado a `.arrayBuffer()`, que es como lo hace de verdad el
navegador; los PDF de prueba de filas anteriores, escritos como texto ASCII a propósito, no han
notado el cambio.

---

## 17-sep-2026 — Grupos de personas

Fila 21 de la cola (`docs/COLA.md`, `docs/GRUPOS-DE-PERSONAS.md`), punto 3 de
`docs/PROXIMOS-ASUNTOS.md`. Lo pidió Francisco para los terceros relacionados —hoy, para
relacionar a media clase con un asunto, hacían falta veinte vueltas al mismo cuadro, una persona
cada vez—, pero en la conversación añadió: "no solo relacionar asuntos, pienso que estos grupos
también serían útiles para enviar comunicaciones". De ahí que la misma pieza (señalar varios de
golpe) sirva para dos cosas: relacionar en bloque y poner los destinatarios de un correo.

Tres capas, de abajo arriba:

1. **Señalar varios**, en el buscador de terceros de siempre (`App.pintarBuscadorDeTercero`,
   `js/asuntos-nuevo.js`): un modo `multiple` opcional, sin tocar el modo de siempre que ya usan
   "Nuevo asunto" y el "Añadir un relacionado" de toda la vida. Lo señalado vive fuera de la
   búsqueda, así que cambiar de categoría o de texto no lo pierde; una barra fija con la cuenta y
   el botón de añadir, con un × por cada señalado para poder quitarlo sin volver a buscarlo —
   necesario porque un miembro de un grupo puede no salir en ningún resultado (ya no está en las
   listas), y aun así hay que poder verlo y quitarlo.
2. **Atajos de alumnado** (toda una unidad, todo un nivel, toda una enseñanza), construidos sobre
   `Datos.unidadesDistintas` (ya existía, en Ajustes) y una pieza nueva, `Nombres.nivelYEnsenanza`,
   que reutiliza el mismo análisis de texto que `Nombres.grupoCompacto` en vez de duplicarlo:
   Séneca escribe "1º de E.S.O. A", y de ahí hay que sacar el nivel y la enseñanza sueltos. Solo
   entra el alumnado matriculado este curso.
3. **Grupos propios**, guardados con nombre en el decimotercer fichero compartido,
   `_GESTOR/grupos.json` (`js/grupos.js`), con su bloque en Ajustes: crear, cambiar el nombre, ver
   y cambiar los miembros (reutilizando el mismo buscador en modo `multiple`) y borrar por
   papelera. Un miembro que ya no está en las listas —se ha ido, o se ha borrado a mano— se
   conserva igual, marcado aparte en gris, hasta que se quita a mano: nunca se toca un grupo sin
   que se lo manden.

**La decisión de la copia oculta.** Los destinatarios de un grupo, en el cuadro de Correo, van
**siempre en copia oculta**, nunca en "Para". Decisión de Francisco, 17-sep-2026: si un grupo
mete a varias familias en el mismo correo y todas van en "Para" (o en copia visible), cada una ve
la dirección de las demás — un problema de protección de datos evidente en un centro educativo.
La copia oculta lo evita del todo, al precio de que el remitente (Francisco) tiene que ir en
"Para" si no hay nadie más: así lo exige Gmail, y es lo que hace todo el mundo con un envío en
copia oculta. Se ha resuelto en el propio `apps-script/gestor-correos.gs`, poniendo
`Session.getActiveUser().getEmail()` cuando hace falta: la aplicación no necesita saber la
dirección de correo de Francisco para nada.

**Lo que se ha dejado fuera**, a falta de datos que la aplicación no tiene: departamentos,
tutorías y equipos educativos. `personal.csv` (Séneca) solo trae nombre, documento, puesto,
teléfono y correo — nada de a qué departamento pertenece nadie, ni quién tutoriza qué grupo. Eso
se habla aparte el día que haga falta, y hasta entonces esos grupos se montan a mano como
cualquier otro grupo propio.

Detalle técnico completo en `docs/CONTEXTO.md`, sección "Grupos de personas".

---

## 17-sep-2026 — Registrar un papel sellado sin quedarse con dos

Fila 20 de la cola (`docs/COLA.md`, `docs/REGISTRO-SIN-DUPLICAR.md`), punto 9 de
`docs/PROXIMOS-ASUNTOS.md`. Contado por Francisco, el camino de siempre para un papel que ya
había pasado por el registro de Séneca eran seis pasos: subir el documento sin registrar y
dejar que la aplicación lo nombre; subirlo a Séneca y que le ponga el sello, devolviendo un PDF
nuevo; bajar ese PDF sellado a la carpeta del asunto, donde queda como un documento más con el
nombre que le pone Séneca; volver al documento **viejo** y pulsar Registrar; buscar en el
explorador el PDF sellado que se acababa de bajar, señalarlo y confirmar; y por último borrar a
mano ese PDF, porque la aplicación **generaba un tercer fichero** (el sellado con el nombre
bueno) y el mismo papel quedaba dos veces con dos nombres distintos.

El error de fondo era el orden: había que avisar primero (pulsar Registrar) y buscar el papel
después, aunque ya estuviera en la propia carpeta. Se ha dado la vuelta: la ficha del asunto mira
sola los PDF de su carpeta cuyo nombre no ha puesto la aplicación, les lee el sello y, si lo
tienen, pregunta de qué documento es en vez de esperar a que Francisco avise. Al contestar, el
PDF sellado se renombra en el sitio (no se genera nada nuevo) y el documento viejo se manda a la
papelera. Detalle técnico completo en `docs/CONTEXTO.md`, sección "Un papel que ya trae el
sello, sin duplicarlo".

Dos quejas más de Francisco, resueltas de paso:

- El sello se detectaba unas veces sí y otras no, con el mismo documento: era que
  `js/registro-lector.js` solo leía la página 1 del PDF, y si el sello caía en otra página no
  aparecía. Ahora se leen hasta 10, y además el texto se busca normalizado y, si hace falta, sin
  ningún espacio (el sello de Séneca a veces viene pegado del todo a lo que sigue).
- El explorador de "Abrir archivo" nunca se abría en la carpeta del asunto: `Carpetas.elegirFichero`
  admite ahora una carpeta de inicio (`startIn`, del propio navegador), que le pasan sus llamadores
  cuando la conocen.

De paso, `js/notas.js` gana `Notas.sustituir`: como `Notas.anadir`, pero sustituye una nota
anterior con la misma clave en vez de apilar otra debajo. Hacía falta para que registrar dos
veces el mismo documento (por este camino nuevo o por el botón de siempre, que también lo usa ya)
deje una sola nota de registro, no dos.

Francisco probará esto con papeles de verdad y avisará si hay que ajustar algo: es la única fila
de esta cola donde su prueba con casos reales hace falta de verdad, porque el PDF de muestra con
el sello no se puede subir al repositorio (lleva datos personales).

---

## 17-sep-2026 — El código de verificación del pie de un documento

Fila 19 de la cola (`docs/COLA.md`, `docs/CSV-DEL-DOCUMENTO.md`), punto 1 de
`docs/PROXIMOS-ASUNTOS.md`, reducido a lo que de verdad se podía hacer: Francisco comprobó el
16-sep-2026 que la página de verificación de un documento de Séneca no pide ni certificado ni
captcha, solo el código. Lo único que pedía era no tener que teclearlo a mano.

- **Descartado a propósito**: traer la copia auténtica sola (la página no se abre con una
  dirección que lleve el código dentro, hay que rellenar su formulario, y cada administración
  tiene el suyo) y poner nosotros la dirección de verificación (la pone el propio documento: así
  vale para cualquier organismo, sin ninguna lista que mantener).
- `js/verificacion.js` nuevo, reutilizando `RegistroLector.textoDePrimeraPagina`
  (`js/registro-lector.js`, sacada de ahí para esto: la misma máquina que ya lee el sello de
  Séneca, sin cargar pdf.js dos veces). Busca la etiqueta del código (CSV, CVE, "Código de
  verificación"...) sin mayúsculas ni tildes, y una dirección `http(s)://` que contenga
  `verifica`/`csv`/`cve`/`valida`/`cotejo`/`sede`, recortando la puntuación de la frase que suele
  quedar pegada al final.
- **En `js/lector.js`** (el panel de leer un correo): al abrir un PDF se lee el pie sin retrasar
  el panel, y si aparece código y dirección salen "Copiar el código" (con el código en gris al
  lado) y "Abrir la verificación". Solo se toca este panel, no `js/visor.js`: es donde se lee un
  correo antes de archivarlo, que es cuando hace falta el atajo.
- Nada se guarda: ni en `asuntos.json` ni en ningún fichero compartido. Es un botón para no
  teclear, no un dato del asunto.
- Prueba nueva `pruebas/verificacion.mjs`, sin PDF ni navegador (mismo patrón que
  `pruebas/logica.mjs`, con `vm` de Node).

## 17-sep-2026 — Un mismo correo en dos buzones

Fila 18 de la cola (`docs/COLA.md`, `docs/CORREO-EN-DOS-BUZONES.md`). Francisco y su compañero
tienen cada uno su buzón de Gmail, su recolector y su `GESTOR-BANDEJA`, pero los asuntos son
comunes. Como la aplicación reconocía un correo por el identificador de hilo de Gmail —que es de
cada buzón—, un correo dirigido a los dos aparecía como dos correos sin relación: si uno lo
guardaba, al otro le seguía saliendo como nuevo.

- **La matrícula**: el `Message-ID` de la cabecera de un mensaje, el mismo en todos los buzones
  por los que pasa. El recolector ya lo leía para el enlace (`enlaceAlHilo`), pero no lo guardaba.
  Ahora sí: `matricula(mensaje)` nueva en `apps-script/gestor-correos.gs`, y `guardarHilo` apunta
  `matriculas` (todas las del hilo) y `matricula` (la del último mensaje) en la ficha.
- `js/bandeja-correos.js`: `asuntoDeLaMatricula(matriculas)`, hermana de `asuntoDelHilo`.
  `asuntoDeEsteCorreo` mira ahora, en orden: identificador de hilo propio, el de la respuesta,
  matrícula, y solo entonces el texto. La huella (`hilos` en `asuntos.json`) gana `matriculas`,
  `metidoPor` y `metidoEl`, los tres opcionales (los asuntos de antes no los tienen).
- **La línea gris**: cuando un correo encaja por matrícula pero su propio identificador de hilo
  no está en las huellas de ese asunto (o sea: es del compañero, no suyo), en vez de tarjeta sale
  una línea aparte, debajo de las normales — "Ya está en el asunto «...» · lo metió Juan el
  17-sep-2026 · 09:14" — con "Abrir el asunto" y "Quitar de mi bandeja" (esto último borra los
  ficheros de esta bandeja sin pasar por la papelera: son copias de trabajo, el correo de verdad
  sigue en Gmail).
- **La trampa del `visto` compartido** (`apps-script/gestor-correos.gs`,
  `seguirHilosConocidos`/`hiloDeSeguido`): un hilo puede tener un número de mensajes distinto en
  cada buzón (correos internos, borradores, reenvíos que no están en los dos sitios), así que la
  cuenta de mensajes vistos no puede compararse contra el `visto` que escribe el buzón que
  enganchó el correo: se recogería cada minuto para siempre, o nunca. Se guarda aparte, por buzón,
  en `PropertiesService.getScriptProperties()` del propio proyecto de Apps Script; el `visto`
  compartido solo sirve de arranque la primera vez que se sigue un hilo.
- De paso: se descubrió que el recolector llevaba **seis días** dejando los correos en una
  `GESTOR-BANDEJA` distinta de la que leía la aplicación (alguien había movido la de verdad
  dentro de otra carpeta; el script solo mira la raíz del Drive, no la encontró, y se creó una
  nueva sin decir nada — la bandeja se veía simplemente vacía, sin ningún error). Arreglado por el
  lado de la aplicación, que es donde se mira: en Ajustes, "Último correo recogido", con la fecha
  del propio fichero más nuevo de la carpeta; con más de 3 días sin moverse, avisa.
- Prueba nueva `pruebas/correo-dos-buzones.mjs`. `pruebas/correos.mjs` se ha tenido que tocar: sus
  comprobaciones de `hilos` esperaban el objeto exacto, y ahora lleva los campos nuevos (se
  proyectan solo los campos estables en la comparación, para no depender de la hora exacta de
  `metidoEl`).

## 17-sep-2026 — No pisarse en un mismo asunto

Fila 24 de la cola (`docs/COLA.md`, `docs/NO-PISARSE-EN-UN-ASUNTO.md`): la aplicación la usan
Francisco y su compañero sobre la misma carpeta de Dropbox, y hasta hoy nada avisaba de que los
dos estuvieran tocando el mismo asunto a la vez.

- Módulo nuevo `js/presencia.js` (`window.Presencia`), fichero nuevo `_GESTOR/presencia.json`
  (`{ <clave>: { usuario, ultima } }`). **A propósito fuera de los doce ficheros protegidos**: se
  escribe cada 30 segundos y caduca sola a los 3 minutos, así que no necesita copia de seguridad,
  papelera ni fusión de conflictos; se lee y escribe directo con `Carpetas`, nunca con
  `Copias.guardar`. `js/copias.js`, `js/papelera.js` y `js/conflictos.js` no se han tocado: los
  tres trabajan con listas propias de ficheros, y esta nunca entra en ninguna.
- Al abrir la ficha de un asunto libre, se anuncia la propia señal y se renueva sola; al cerrarla,
  se quita. Si ya está ocupado por otro, se entra en modo consulta: aviso arriba
  ("Fulano está en este asunto ahora mismo. Estás mirando, no puedes modificar.") y botón "Tomar
  el mando", con confirmación.
- **Apagar los controles que modifican no ha tocado ningún otro módulo**: `js/ficha-asunto.js`
  recorre `#ficha-asunto-cuerpo` entero y apaga todo (`button, select, input, textarea`) salvo una
  lista blanca de solo lectura (volver, abrir un documento, copiar un nombre, desplegar un hito,
  tomar el mando). Como media ficha se pinta sola después de `pintar()` (guía, documentos, hitos,
  "Generar documento", "Correo"...), hace falta un `MutationObserver` propio sobre
  `#ficha-asunto-cuerpo` que lo vuelva a aplicar cada vez que aparece algo nuevo, con el mismo
  patrón (y el mismo aviso sobre estos observadores) que ya usa `js/hitos-panel.js`.
- La marca en la tarjeta de "Asuntos abiertos" (una letra, el nombre completo en el `title`) la
  cuelga `js/presencia.js` envolviendo `App.tarjetaAsunto`, sin tocar `js/asuntos-lista.js`. Una
  copia en memoria de `presencia.json` se refresca sola cada 10 segundos, enganchada a
  `App.vigilarLaCarpeta` (ya arranca sola al entrar, así que tampoco ha hecho falta tocar
  `js/nucleo.js`).
- Descartado, por ahora (lo pidió Francisco expresamente): una base de datos pequeña en internet
  para que el aviso fuera instantáneo. Si se hace algún día, solo viajarían el identificador del
  asunto y el nombre de quien lo abre, nunca datos de alumnado o personal, con servidor en la UE.
- Prueba nueva `pruebas/presencia.mjs`: la "otra persona" se simula escribiendo directamente en
  el disco de mentira (mismo truco que `pruebas/conflictos.mjs`), sin dos pestañas ni dos
  navegadores. Cubre: señal propia al abrir y quitada al cerrar, modo consulta con otro dentro,
  tomar el mando, señal caducada que no cuenta, la marca en la lista, y que el fichero queda
  fuera de copias y papelera.

## 17-sep-2026 — "Por clasificar": el documento a la vista, marcado en la lista

Fila 25 de la cola (`docs/COLA.md`, `docs/POR-CLASIFICAR-DOCUMENTO-A-LA-VISTA.md`): Francisco
pedía saber, de un vistazo, cuál de la lista de la izquierda es el documento que se está viendo a
la derecha, sin tener que adivinarlo por el nombre.

- `js/visor.js` gana un `marcador` opcional (un texto libre que pone quien abre el documento) y
  un aviso (`Visor.alCambiar`) cada vez que cambia, además de un hueco de acciones bajo la
  cabecera (`opts.acciones`). Sin esos dos parámetros se comporta exactamente igual que antes, así
  que `js/ficha-asunto.js` y `js/unir-asuntos.js` no han tenido que tocarse.
- `js/documentos-sueltos.js` usa el marcador `'suelto:<nombre>'`: al cambiar, marca la tarjeta que
  toca (`.tarjeta-abierta`) y le hace `scrollIntoView`; al repintar la lista entera, cada tarjeta
  nace ya marcada si le toca. `App.accionesDeSuelto(s)` reutiliza `App.tarjetaSuelto` entero (con
  el "Borrar" que le cuelga `js/papelera.js`) para no tener una segunda copia de los tres botones.
  `App.pintarSueltos` cierra el visor solo si el marcador abierto ya no está en `App.E.sueltos`
  (se apoya en que `App.verAbiertos` ya se llama tras crear, meter o borrar: no hizo falta tocar
  esas tres acciones).
- El nombre en la cabecera del panel se corta por el medio, no por el final, cuando no cabe: se
  mide el ancho de verdad (`scrollWidth` contra `clientWidth`) y se van quitando caracteres del
  lado más largo hasta que entra, con el `title` siempre con el nombre completo.
- Prueba nueva `pruebas/documento-a-la-vista.mjs`, con la aplicación entera en un navegador de
  verdad: abrir marca, abrir otro mueve la marca (nunca se acumula), cerrar la quita, y borrar
  desde el propio panel hace desaparecer la tarjeta y cierra el visor solo.

## 17-sep-2026 — La pantalla no se repintaba sola tras guardar

Fila 23 de la cola (`docs/COLA.md`, `docs/REFRESCO-DE-PANTALLA.md`), la primera de las que
Francisco pidió el 17-sep-2026: cambiar el estado de un asunto, marcar un hito como hecho o
archivar parecía no hacer nada hasta salir y volver a entrar, aunque el dato ya se había guardado
bien.

- **Buscada la causa de verdad**: cada acción ya hacía `await` hasta el final y ya llamaba a quien
  pinta después (`App.anotar` relee el registro, guarda con `Copias.guardar` y llama a
  `App.refrescarFichas()`; `App.ponerEstado`, `App.cerrarAsunto` y `Hitos.marcar` seguían la misma
  regla). Se comprobó con `pruebas/navegador.mjs` (disco de mentira, escritura instantánea) que
  las tres acciones YA refrescaban bien sin recargar: el fallo no está en la lógica de repintado,
  sino en que **nada avisa de que se está guardando**. Con la carpeta de verdad en Dropbox, el
  guardado tarda de forma perceptible; el botón o el desplegable se quedan pulsables, no cambian
  de aspecto, y a Francisco le parece que la aplicación no ha hecho nada —cuando en realidad el
  guardado sigue en marcha, y al volver a entrar (con el guardado ya terminado) lo ve bien—.
- **El arreglo**: `U.mientrasGuarda(control, fn)` (`js/util.js`), nuevo. Apaga el control mientras
  `fn` hace su trabajo asíncrono y lo devuelve a como estaba al terminar, guarde o falle; en un
  botón, además, el texto pasa a "Guardando…". Puesto en el estado del asunto (ficha y tarjeta de
  la lista), la vía, el plazo, archivar/reabrir (`js/ficha-asunto.js`, `js/asuntos-lista.js`), y en
  marcar un hito, cambiar de rama, y tocar su responsable, fecha, notas o documentos
  (`js/hitos-panel-lista.js`). Así se ve que la aplicación está trabajando y no se puede pulsar dos
  veces mientras tanto (evita además una carrera si dos guardados del mismo asunto se solapan).
- Prueba nueva `pruebas/refresco.mjs`, con la aplicación entera en un navegador de verdad: crea un
  asunto de verdad (con categoría y tercero, no una carpeta suelta), y comprueba las tres acciones
  —cambiar el estado, marcar un hito y archivar— sin recargar nada, más que el control usado se
  apaga mientras guarda.
- Las notas (`js/ficha-asunto.js`, `pintarNotas`) ya tenían su propio apagado del botón durante el
  guardado, de antes: no se ha tocado, porque ya cumplía la regla.

## 16-sep-2026 — Plantillas de documento de Word

Fila 17 de la cola (`docs/COLA.md`, `docs/PLANTILLAS-DE-DOCUMENTO.md`), el gemelo en papel de las
plantillas de correo (fila 14, más abajo en este mismo diario): Francisco cuelga un `.docx` de un
tipo de asunto en Ajustes, y el botón **Generar documento** de la ficha saca una copia con los
huecos rellenos, ya guardada en la carpeta del asunto, sin preguntar nada.

- **`Plantillas.valoresDeAsunto(asunto)`** (`js/plantillas.js`), pública: hasta hoy era
  `valoresDePlantilla()`, privada de `js/correo.js`. Ahora es async —el DNI, los tutores y el
  registro salen de ficheros— y amplía el catálogo de huecos (`Plantillas.HUECOS`) con
  `nombreNatural`, `referencia` (según la categoría), `dni`, `telefono`, `correo`, los dos tutores
  con su teléfono y correo (leídos por el título de la columna, como `js/dni.js`), `descripcion`,
  `estado`, `registro`, `hoyLargo`, `lugarYFecha`, y los datos del centro (`localidad`,
  `direccionCentro`, `codigoCentro`, `cargo`, y `firma` ya relleno). `js/correo.js` la llama una
  vez por apertura del cuadro y ya no tiene su propia función.
- `js/plantillas.js` pasó de 423 a más de 750 líneas con este motor, así que **el bloque de
  Ajustes "Plantillas de correo" se sacó a `js/plantillas-ajustes.js`**, sin cambiar lo que hace
  (usa la API pública de `Plantillas`, nada privado). El fichero se queda en unas 450 líneas, solo
  con el motor.
- **`js/docx.js` nuevo** (`window.Docx`, sin librerías ni CDN): lee y escribe un `.docx` (que es
  un ZIP) a mano —directorio central buscado desde el final, cabeceras locales, CRC-32 con tabla
  propia (polinomio `0xEDB88320`)—. Las entradas que no hacen falta tocar se copian tal cual; las
  que sí (`word/document.xml`, `header*.xml`, `footer*.xml`) se descomprimen con
  `DecompressionStream('deflate-raw')` si hace falta y se reescriben **sin comprimir** (método 0):
  así no hace falta `CompressionStream` para nada. La parte delicada, y la primera que se probó:
  Word reparte el texto de un párrafo en varias `<w:t>` (por ejemplo, una palabra suelta en
  negrita), así que `{nombre}` puede llegar partido en dos o tres. Antes de sustituir, cada
  `<w:p>` se repara moviendo solo los caracteres del hueco hasta dejarlo entero en una única
  `<w:t>` — nunca fundiendo todas las de un párrafo en una, que perdería el formato de las
  palabras que no son parte de ningún hueco.
- **`js/plantillas-documento.js` nuevo**: el botón "Generar documento" en la ficha (mismo patrón
  que `js/correo.js` con "Correo" y "Mensaje Séneca": se envuelve `App.abrirFicha`), que no sale
  si el tipo no tiene plantillas, elige sola con una y pregunta con varias (como
  `Relacionados.elegirTercero`, dentro de `#capa`, sin `U.preguntar`). Guarda sin pisar, deja nota
  con `Notas.anadir`, avisa de los huecos sin datos y refresca la ficha. En Ajustes, bloque
  hermano "Plantillas de documento": buscador, tarjetas, alta (con un desplegable de los `.docx`
  que ya haya en `_GESTOR/PLANTILLAS`, que Francisco sube a mano), edición, borrado con
  `Papelera.botonBorrar`, y la lista de huecos con un botón de copiar en cada uno.
- **`plantillas.json` gana la clave `documentos`** y cuatro claves de raíz del centro
  (`localidad`, `direccion`, `codigo`, `cargo`); `limpio()` las normaliza, así que un fichero
  viejo sigue cargando igual. No es ningún fichero compartido nuevo: sigue siendo el mismo de
  siempre, y los `.docx` de `_GESTOR/PLANTILLAS` tampoco cuentan como fichero compartido (no
  llevan copia de seguridad).
- Ocho escenarios en `pruebas/plantillas-documento.mjs`, con **jsdom** en vez de Playwright (no
  hace falta un navegador de verdad para probar ZIP y XML a mano): construye un `.docx` de mentira
  con su propio escritor de ZIP, independiente del de `js/docx.js` para no acabar probándose a sí
  mismo, comprimiendo de verdad con `CompressionStream` como haría Word. El ZIP de salida se
  comprobó además con `unzip -t` y `zipinfo`, herramientas de línea de comandos, no solo con el
  lector propio.

## 16-sep-2026 — El enganche que faltaba en el correo, de las plantillas

Fila 14 de la cola (`docs/COLA.md`, `docs/PLANTILLAS-DE-CORREO.md`), que se había dado por
`HECHA` estando solo a medias: `js/plantillas.js` ya existía entero y funcionaba —el fichero
`_GESTOR/plantillas.json`, `Plantillas.rellenar` y el bloque "Plantillas de correo" de
Ajustes—, pero **`js/correo.js` no lo usaba para nada**. Seguía con la constante `CENTRO`
escrita a mano y sin ningún desplegable de plantilla, ni en el cuadro de Correo ni en el de
Séneca. Por eso `pruebas/plantillas.mjs` llevaba días en rojo: no era, como se apuntó el
16-sep-2026 en la entrada de "Qué me toca", "algo del entorno de pruebas" — era que faltaba el
trabajo.

Lo que se ha completado en `js/correo.js` (secciones 2.3 y 3 de
`docs/PLANTILLAS-DE-CORREO.md`; no se ha tocado nada de `js/plantillas.js`):

- `cuerpoDelCorreo(a, idPlantilla)` ya no la escribe a mano: si el tipo del asunto tiene alguna
  plantilla, el medio sale de `Plantillas.rellenar(plantilla.texto, valores)`; la firma sale
  siempre de `Plantillas.rellenar(datos.firma, valores)` —con o sin plantilla de por medio—, y
  `Plantillas.cargar` ya resuelve sola el caso de que `plantillas.json` no exista todavía. Los
  valores de los huecos los monta `valoresDePlantilla(a)`, nueva y privada del fichero: nombre
  (`soloElNombre`), grupo y curso (`piezasDelNombre`), tipo, hoy, límite, usuario y centro, más
  `campos` con los campos propios del asunto (`camposDelAsunto`, mirando `App.E.campos.porTipo`
  como hace `filasDeCampos` en `js/ficha-asunto.js`).
- **El desplegable "Plantilla"** (`#correo-plantilla`), encima del cuerpo, en los dos cuadros: lo
  pinta `camposComunes`, que es la única función que ya compartían Correo y Séneca, así que no ha
  hecho falta ningún contenedor `#correo-comunes` aparte. Con una sola plantilla del tipo, sale
  puesta; con varias, sale la primera; sin ninguna, no se pinta nada. Al cambiar de plantilla
  (`cambiarPlantilla`), si lo escrito coincide con lo último que puso el propio código se cambia
  sin más; si no, se pregunta **en línea, dentro del propio cuadro** (`#correo-plantilla-confirmar`,
  con "Seguir con lo escrito" / "Cambiar de todas formas"), nunca con un segundo `U.preguntar`:
  solo puede haber un cuadro de diálogo abierto en toda la aplicación, y ese ya lo tiene el
  cuadro de Correo.
- El aviso ámbar de huecos sin datos (`#correo-faltan-datos`, "Faltan datos: …") sale con las
  etiquetas en castellano de `Plantillas.HUECOS`, que ya venían así de `Plantillas.rellenar`.
- En Séneca, al copiar el texto (paso 2 de `engancharSeneca`) se recorta a 4.000 letras si hace
  falta, avisando en `#seneca-explica`.

`index.html` ya cargaba `js/plantillas.js`... no lo cargaba en absoluto: se ha añadido, justo
antes de `js/correo.js`.

Los 7 escenarios de `pruebas/plantillas.mjs` pasan, y la batería completa (`npm test`, 24
ficheros, `CHROMIUM_PATH` apuntando al Chromium ya instalado en el entorno) sale entera en
verde, incluidos `pruebas/correos.mjs` y `pruebas/envios.mjs` (que también usan `js/correo.js`,
para la bandeja de correos y los adjuntos): un asunto sin plantillas de su tipo sigue
comportándose exactamente igual que antes de este cambio.

**Corrección, al fusionar**: mientras esta sesión hacía este mismo arreglo en su rama, otra
sesión en paralelo hizo también el suyo directamente sobre `main` (en el mismo pull request que
las filas 12 y 13), sin verse la una a la otra, y con el diseño que de verdad pedía el encargo:
`camposComunes`/`interiorDeComunes` con su propio contenedor `#correo-comunes`, tal y como sigue
descrito en `docs/CONTEXTO.md`. Al fusionar esta rama se ha mantenido la de `main` —llegó antes—
y se ha descartado todo lo de `js/correo.js` descrito arriba; lo único que ha sobrevivido de
esta entrada es el diagnóstico (fila 14 se había dado por hecha sin estarlo) y la corrección de
la entrada de "Qué me toca" sobre por qué fallaba `pruebas/plantillas.mjs`. Encima de la versión
de `main` se ha aplicado, ya sí, el cambio de la fila 17: `valoresDePlantilla(a)` pasa a ser
`Plantillas.valoresDeAsunto(asunto)`, pública y en `js/plantillas.js`.

## 16-sep-2026 — Qué me toca

Fila 16 de la cola (`docs/QUE-ME-TOCA.md`), depende de la fila 15 (hitos, ya `HECHA`).

Los hitos de la fila 15 se veían dentro de cada asunto, uno a uno. Esta pantalla nueva los cruza
todos: lee `Hitos.leer()` una vez y `window.Gestor.asuntos()`, y saca los hitos `pendiente` y
`encurso` de todos los asuntos abiertos en tres bloques — "En tu tejado" (responsable `yo` o
`companero`, con fecha límite, los vencidos arriba y en rojo, reutilizando tal cual
`Plazos.de`/`.marca-plazo` de `css/plazos.css`, sin inventar otra escala de colores), "Esperando
a otros" (cualquier otro responsable, con los días parado desde `desde`, los más parados arriba)
y "Sin fecha" (plegado con `<details>`, para que no se pierda lo que no tiene fecha límite) — con
filtro por responsable arriba (recordado en `localStorage`) y entrada propia en la barra de la
izquierda, con la cuenta de vencidos al lado (sin número si no hay ninguno).

Vive entera en `js/que-me-toca.js` (`css/que-me-toca.css`), con el mismo patrón que la pantalla
"Duplicados" (`js/unir-asuntos.js`): `App.PANTALLAS.push`, la sección se crea a mano y no está en
`index.html`. A diferencia de "Duplicados" sí tiene entrada en la barra (`js/barra.js`): como se
añade después de cargada la página, el bucle de `js/nucleo.js` que pone el `onclick` de las
pestañas ya existentes no la alcanza, así que se le pone a mano; el resaltado como "activa" sí
sale solo, porque `App.ir` vuelve a mirar los `.pestana` que haya cada vez que se llama. Al
pulsar una línea se abre la ficha del asunto con ese hito ya desplegado: enganche nuevo y pequeño
en `js/hitos-panel.js` (`window.HitosPanel.desplegarAlAbrir(clave, idHito)`, guarda el par y lo
aplica en el siguiente repintado de esa ficha, sin depender de en qué orden se hayan cargado los
dos ficheros).

Esta sesión sí tenía un Chromium a mano (con `CHROMIUM_PATH` apuntando a él, porque el que trae
`playwright` de fábrica no coincidía de versión): los 7 escenarios de `pruebas/que-me-toca.mjs`
pasan, y la batería completa (`npm test`, 24 ficheros) sale en verde salvo `pruebas/plantillas.mjs`,
que ya fallaba antes de esta fila por algo del entorno de pruebas (un `locator.inputValue` que
no llega a tiempo), sin relación con "Qué me toca" ni con los hitos.

Ficheros nuevos: `js/que-me-toca.js`, `css/que-me-toca.css`, `pruebas/que-me-toca.mjs`.

## 16-sep-2026 — Los hitos de un asunto

Fila 15 de la cola (`docs/HITOS.md`).

Hasta hoy la guía de un tipo era texto que se leía y se marcaba con una casilla, igual para
todos los asuntos de ese tipo. Desde hoy, dentro de un asunto abierto, esos mismos pasos se
convierten en **hitos**: además de marcados o no, llevan estado (pendiente · en curso · hecho ·
no aplica), fecha límite, responsable, notas y documentos apuntados.

**Fichero nuevo, `_GESTOR/hitos.json`**, el duodécimo compartido: pasan de once a doce
(`js/copias.js`, `js/conflictos.js`). No va en `asuntos.json` porque ese fichero se lee en toda
pantalla y se escribe entero cada vez; `hitos.json` solo se lee al abrir un asunto, al archivarlo
y (en la fila 16) en "Qué me toca".

**De dónde salen.** Un asunto nuevo copia los pasos de la guía de su tipo al crearse (se envolvió
`App.anotar`, mirando el `abiertoEl` que solo pone la creación, en vez de tocar
`js/asuntos-nuevo.js` y `js/recurrentes.js`). Uno viejo no los recibe solo: sale el botón "Crear
los hitos de la guía", que además importa `pasosHechos`/`pasosElegidos` (se quedan en
`asuntos.json`, por si hay que volver atrás). El id del hito es el mismo que el del paso de la
guía: así un plazo "desde tal paso" o un `pasosElegidos` viejo se traducen solos.

**Bifurcaciones.** Un paso-pregunta se convierte en un hito de clase `decision`: mientras no se
elige una opción, la lista se corta ahí (`Hitos.visibles`); al elegir, los hitos de la rama
cuentan como si vinieran debajo. Cambiar de rama quita los hitos vacíos de la vieja y marca
`noaplica` (plegados al final, `Hitos.huerfanos`) los que ya tenían notas o documentos.

**Responsable, plazo y estado.** El cuadro de escribir la guía (`Guias.editar`) gana tres campos
opcionales y plegados por paso: responsable por defecto (personas de Ajustes + los papeles fijos
`tercero`/`tutor`/`relacionado`, que se resuelven solos con datos del asunto), estado del asunto
(de `estados.json`) y plazo (días y desde qué paso). Los días se cuentan hábiles, descontando los
no lectivos de Ajustes › Hitos (`Plazos.sumarDiasHabiles`, nombre propio para que lo reutilice la
fila 16). El estado del asunto lo decide una sola función, `Hitos.estadoDelAsunto`, para poder
cambiar el criterio sin tocar diez sitios si algún día el estado del asunto lo sustituye el
propio hito en curso.

**Al archivar**, los hitos salen de `hitos.json` y se escriben, ya dentro del ARCHIVO, como
`HISTORIAL DE TRAMITACION.txt`: legible sin la aplicación, sin copiar ningún documento (mismo
criterio que `DONDE ESTA ESTE ASUNTO.txt` de los relacionados). Al reabrir, si el fichero sigue
ahí, los hitos vuelven a `hitos.json` y el fichero se borra.

**En la ficha del asunto**, los hitos sustituyen a la lista de pasos, en el mismo sitio de
siempre, envolviendo lo que pinta la guía sin tocar `js/ficha-asunto.js`: `pintarGuia` es una
función privada de ese fichero, así que en vez de envolver una función de `App` se usó un
`MutationObserver` sobre `#ficha-guia`, como ya sugería `docs/CONTEXTO.md` para un panel que se
repinta entero.

**Ficheros nuevos**: `js/hitos.js` y `js/hitos-archivo.js` (el modelo, partido en dos por las
400 líneas), `js/hitos-panel.js` y `js/hitos-panel-lista.js` (la ficha, también partido en dos:
el repintado en uno, la fila de cada hito en el otro, hablándose por `window.HitosPanel`),
`js/hitos-ajustes.js` (el bloque "Hitos" de Ajustes: responsables y días no lectivos),
`css/hitos.css` y `pruebas/hitos.mjs`.

Al probar de verdad en un navegador (esta sesión sí tenía Chromium a mano, cosa que el trabajo
inicial no pudo comprobar) salieron tres fallos reales, ya arreglados: `pasosDe(tipo)` de
`js/guias-enganche.js` solo lee `guias.json` una vez, al entrar, así que la guía de prueba había
que escribirla en el disco de mentira ANTES del primer "Entrar", no después; `App.verAbiertos`
(el botón Actualizar) no relee `asuntos.json`, así que escribir a mano la ficha de un asunto
viejo necesitaba también `App.cargarRegistro()`; y el `MutationObserver` de `js/hitos-panel.js`
se disparaba con su propio repintado (mutaba el mismo `#ficha-guia` que vigilaba), lo que lo
metía en un bucle sin fin en cuanto había que interactuar con un hito desplegado — se arregló
desconectándolo mientras se repinta y reconectándolo al terminar.

## 16-sep-2026 — Un documento suelto puede entrar en un asunto que ya existe

Fila 12 de la cola (`docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md`). Versión publicada
`16-sep-2026 · 21:40`.

"Por clasificar" tenía el mismo agujero que tenía la bandeja de correos antes de la fila 11: el
único destino posible de un documento suelto era **un asunto nuevo**. Si el papel era de una
gestión que ya existía, no había por dónde meterlo desde la aplicación; había que ir al
explorador de archivos y arrastrarlo a mano.

**"Meter en un asunto".** Botón nuevo en cada tarjeta de "Por clasificar", entre "Crear asunto
con él" y "Borrar". Abre el cuadro de elegir asunto, y al elegir uno el fichero se lleva a su
carpeta y se abre el cuadro de ponerle nombre: exactamente el camino de "Crear asunto con él",
pero sin crear nada.

**Un solo elegidor para los dos.** La fila 11 había dejado el cuadro de escoger asunto dentro de
`js/bandeja-enlace.js`. Copiarlo habría sido tener dos buscadores y dos listas que mantener, así
que se sacó a **`js/elegir-asunto.js`** y ahora lo usan los dos. Lo que sí es distinto en cada
uno es la puntuación de "Podrían encajar", y por eso no se compartió: de un correo se sabe el
remitente, el asunto y el texto; de un documento suelto solo se sabe el nombre del fichero. El
cuadro recibe la lista de sugeridos ya puntuada, y el resto —lista completa, buscador, orden,
filas, "está archivado"— es común. También son comunes las piezas que sí valían para los dos:
los trozos del nombre del tercero, si el asunto se movió este mes, y el corte de 40 puntos.

**Lo que no se pierde.** El traslado va por `Carpetas.moverFichero`, que copia, comprueba que la
copia pesa lo mismo y solo entonces borra: en las carpetas de Dropbox el `move()` del navegador
existe pero lo rechaza. Si ya hay un fichero con ese nombre en el destino no se pisa; si la ruta
se pasa de 180 caracteres se avisa y se deja decidir; y si el traslado falla, el documento se
queda en "Por clasificar" y se dice con una línea. Si el asunto elegido está archivado, se puede
reabrir o meter el papel dentro del ARCHIVO sin tocar su estado.

Se comprueba con `pruebas/documentos-sueltos.mjs` (15 comprobaciones). Se descartó, como ya
estaba descartado, abrir la carpeta del asunto en el explorador del ordenador.

---

## 16-sep-2026 — Los correos se enganchan al asunto, y el hilo se sigue

Fila 11 de la cola (`docs/CORREOS-AL-ASUNTO.md`). Versión publicada `16-sep-2026 · 20:41`.

La bandeja de correos tenía tres agujeros. Si no acertaba con el asunto de destino, la única
salida era crear otro asunto nuevo, y acababan naciendo carpetas repetidas para la misma
gestión. Al guardar un correo no quedaba ningún rastro del hilo, así que el siguiente correo
empezaba de cero. Y el recolector de Apps Script le quitaba la etiqueta `GESTOR` al hilo, de
modo que las respuestas posteriores no las recogía nadie.

**La huella del hilo.** Al guardar un correo en un asunto se apunta ahora
`hilos: [{ id, asunto, visto }]` en su ficha de `asuntos.json`. Esa huella manda sobre la
adivinación por texto: da igual cómo venga escrito el asunto del correo, si el hilo ya es
conocido la tarjeta dice "Respuesta de <asunto>". `hilos` es opcional, así que los asuntos de
antes siguen funcionando igual. Un asunto puede tener varios hilos; un hilo, un solo asunto.

**"Elegir asunto".** Botón nuevo en cada tarjeta morada, en `js/bandeja-enlace.js`. Abre un
cuadro con "Podrían encajar" (cinco como mucho, por puntuación de parecido: la dirección del
tercero vale 50 puntos, su nombre escrito en el correo 40, cada palabra compartida 10, estar
abierto 15 y haberse movido este mes 10) y "Todos los asuntos" con buscador. Nunca se guarda
nada solo: siempre hay que pulsar.

Se partió `js/bandeja-correos.js`, que pasaba de 400 líneas: lo de elegir a mano y la
puntuación se fueron al fichero nuevo.

**`seguidos.json`.** La aplicación escribe en `GESTOR-BANDEJA` la lista de hilos enganchados con
su `visto`. En cada pasada, el script de Apps Script hace lo de siempre con la etiqueta y
después mira esos hilos con `GmailApp.getThreadById`: si han crecido, los recoge otra vez, con
`respuestaDe` y con `enviado: true` cuando el último mensaje lo mandó el propio usuario (la
tarjeta lo dice: "Lo enviaste tú"). Así vuelven a la bandeja tanto las respuestas del tercero
como los correos que manda Francisco desde Gmail.

**Los documentos.** El PDF del hilo entero pasa a llamarse `AAMMDD HILO <asunto>.pdf` y **se
sustituye**: el anterior va a la papelera, para que no se acumule una copia del hilo completo
por cada respuesta. El mensaje nuevo entra aparte, como `AAMMDD CORREO <asunto>.pdf`. Los
adjuntos siguen igual. El script también borra ahora lo que quedara de una recogida anterior del
mismo hilo: Drive admite dos ficheros con el mismo nombre y la aplicación no sabría cuál coger.

**Apps Script sigue sin desplegarse desde el repositorio.** El fichero lleva en sus tres
primeras líneas qué hay que hacer para actualizarlo. Va pegado también el arreglo del enlace a
Gmail (`#search/rfc822msgid:<Message-ID>`), que seguía sin llevarse a la cuenta desde el
9-sep-2026.

De paso, `pruebas/logica.mjs` estaba en rojo por su cuenta: llevaba dos fechas de cese escritas
a mano (15-sep-2026 y 6-sep-2026) que el calendario ya había alcanzado. Ahora se cuentan desde
hoy. **Regla nueva: nada de fechas escritas a mano en una prueba.**

## 12-sep-2026 — Reparto del contexto en tres documentos

`docs/CONTEXTO.md` había crecido hasta 1291 líneas: leerlo entero, en cada conversación y en
cada sesión de Claude Code, se había convertido en el mayor gasto de cuota del proyecto.
`docs/COLA.md` tenía el mismo problema con las notas de las filas HECHAS.

Se repartió en tres documentos:

- `docs/CONTEXTO-CORTO.md` (nuevo, máximo 160 líneas): para **decidir**, se lee siempre.
- `docs/CONTEXTO.md` (reescrito): para **programar**, solo lo que es verdad hoy, sin fechas ni
  relatos.
- `docs/HISTORIA.md` (este documento, nuevo): el diario completo, con fechas, para consultar el
  porqué.

También se podó `docs/COLA.md`: las notas de las filas HECHAS quedan en una sola línea cada
una, con el detalle largo trasladado aquí (ver más abajo, "Notas largas de `COLA.md` antes de
la poda").

Instrucción: `docs/REPARTO-CONTEXTO.md`. No se tocó código ni se ejecutaron pruebas.

A partir de ahora, cada instrucción de la cola debe anotar aquí lo que merezca recordarse, con
su fecha, en vez de dejarlo crecer dentro de `CONTEXTO.md`.

---

## Diario heredado (todo lo anterior al 12-sep-2026)

Lo que sigue es el contenido íntegro de `docs/CONTEXTO.md` tal como estaba antes del reparto de
hoy, sin cambiar una palabra, conservado en su orden original (el documento crecía añadiendo lo
nuevo debajo, así que dentro de este bloque va de lo más viejo a lo más nuevo). La versión
resumida y sin fechas de todo esto vive ahora en `docs/CONTEXTO.md`; lo que sigue siendo cierto
hoy, en `docs/CONTEXTO-CORTO.md`.

> # Proyecto: Gestor de Asuntos / Expedientes — IES Fuente Lucena
>
> Documento de contexto. Léelo entero antes de proponer nada.
> Última actualización: 11 de septiembre de 2026 (plan de robustez de
> `docs/PLAN-ROBUSTEZ-2026-09.md` hecho entero: copias de seguridad, conflictos de Dropbox,
> pruebas automáticas en GitHub Actions, fichas sin carpeta y nombres repetidos. Resumen para
> Francisco en `docs/CAMBIOS-2026-09.md`. Después, el mismo día: "Registrar un documento en un
> paso", "Terceros relacionados con un asunto", "Que no se dupliquen los asuntos", "Ajustes
> ágiles: encontrar y crear tipos sin scroll" y "La papelera: borrar sin miedo" y "Los duplicados,
> a su propia pantalla", sección 5).
>
> **Este documento vive en dos sitios**: en el proyecto de Claude (`Contexto.md`) y aquí, en
> `docs/CONTEXTO.md` del repositorio. Se cambia en el mismo commit en que cambia el código.
>
> ---
>
> ## 0. LO PRIMERO: la dirección buena cambió el 10-sep-2026
>
>     https://gestor-de-asuntos.vercel.app
>
> **La antigua, `asuntos-ies.vercel.app`, ya no existe.** El proyecto de Vercel que la servía se
> borró ese día. Si en algún sitio de este documento o de una conversación vieja aparece
> `asuntos-ies`, está desfasado.
>
> Por qué cambió: había **cuatro proyectos de Vercel colgados del mismo repositorio**
> (`asuntos-ies`, `gestor-de-asuntos`, `gestor-asuntos` y `gestor-asuntos-ies`). Cada subida al
> repositorio disparaba cuatro publicaciones a la vez. Ese día `asuntos-ies` se quedó atrás: su
> última publicación fue el commit `c220440` de las 10:32, y los cinco commits siguientes se
> publicaron en `gestor-de-asuntos` pero **en `asuntos-ies` no**, sin ningún error y sin ningún
> aviso.
>
> Se quedó el proyecto **`gestor-de-asuntos`**, que era el que estaba publicando bien, y se
> borraron los otros tres. **Ahora hay un solo proyecto de Vercel. Que siga siendo así.**
>
> **Efecto secundario que hay que saber:** las dos carpetas señaladas y el nombre de usuario se
> guardan en el navegador **atados a la dirección**. Al cambiar de dirección, la aplicación
> arranca de cero y el botón Entrar sale apagado. **No es un fallo**: hay que volver a señalar
> las dos carpetas y escribir el nombre, una vez en cada ordenador. Le pasó a él nada más
> cambiar, y a su compañero le pasará igual.
>
> ---
>
> ## 1. Quién soy y cómo quiero trabajar
>
> Francisco, auxiliar administrativo del IES Fuente Lucena (Alhaurín el Grande, Málaga).
> No soy programador. Yo propongo, pruebo y digo si el resultado se ajusta a lo que buscaba.
> El diseño y la comprobación del código son tuyos.
>
> Cómo quiero que me escribas:
>
> - Pocas frases. Si escribes mucho, me pierdo.
> - Una idea por frase. Sin jerga y sin dar por sabido lo anterior.
> - Una sola pregunta o decisión por mensaje. Espera mi respuesta antes de seguir.
> - Si hay que elegir, dame las opciones numeradas y marca la recomendada. Contesto con el número.
> - No me pidas permiso para cambiar código: aplícalo.
> - Verifica tú tu propio trabajo. Solo pídeme comprobar lo que solo yo puedo ver.
> - Cuando me guíes por una interfaz, ve paso a paso y dime dónde está cada botón.
>
> **Nada de tareas manuales mías.** Si algo se puede hacer desde la aplicación, se hace desde
> la aplicación. Copiar ficheros de una carpeta a otra a mano, o abrir un CSV para tocarlo, es
> justo lo que no quiero. **Cada vez que se añade un dato nuevo, hay que preguntarse cómo lo
> pone en los que ya estaban dados de alta**: si la respuesta es "editando el fichero a mano",
> falta media función. Pasó con el nombre comercial el 10-sep-2026.
>
> **Y donde se usa una cosa, se cambia.** Si tramitando un asunto se ve que falta un paso en la
> guía, la guía se escribe ahí, sin salir a Ajustes. Misma idea.
>
> Mi ordenador es un **Chromebook Plus**. Trabajo en el navegador, no en terminal.
> En el trabajo uso un monitor bastante más ancho que el del Chromebook.
>
> **Ya no trabajo solo con esto: mi compañero administrativo también lo está usando**
> (9-sep-2026). Todo lo que se guarda en `_GESTOR` lo ven los dos.
>
> ---
>
> ## 2. Qué es este proyecto, y qué NO es
>
> Este proyecto es **el gestor de asuntos del centro**: una aplicación web para crear,
> nombrar y archivar las carpetas de cada gestión administrativa.
>
> **No es el proyecto de la base de datos de alumnado.** Ese es otro, con su propio
> repositorio (`fmargon780/bd-alumnado-ies`), su propio contexto y su propio cuaderno de
> Google Sheets. Si aparece aquí una duda sobre informes de tutores, PIL, repeticiones o
> censo NEAE, es del otro proyecto y hay que llevarla allí.
>
> **Lo único que comparten los dos** es el fichero `RegAlum.csv` de Séneca, que aquí se usa
> solo para consultar datos de contacto del alumnado y de sus tutores legales.
>
> ---
>
> ## 3. El problema que resuelve
>
> Por cada gestión administrativa creo una carpeta con nombre estructurado.
>
> - Mientras el asunto está abierto, la carpeta vive en una carpeta de **asuntos abiertos**.
> - Al cerrarlo, la muevo al **ARCHIVO**.
> - Si se reabre, vuelve a abiertos.
>
> Estructura del ARCHIVO: la raíz `ARCHIVO`, y dentro `ALUMNADO`, `EMPRESAS`, `PERSONAL` y
> `OTROS`. Dentro de cada una, una carpeta por tercero. Dentro de cada tercero, las carpetas
> de sus asuntos.
>
> Las carpetas viven en el **Dropbox del centro**, sincronizado en mi ordenador.
>
> ---
>
> ## 4. Las reglas de nombres ← ES LO IMPORTANTE DEL PROYECTO
>
> ### Carpeta de asunto
>
>     AAMMDD TIPO [AÑO ACADÉMICO] [texto libre] Tercero
>
> - `AAMMDD` = fecha de inicio del asunto.
> - `TIPO` = el tipo de asunto en mayúsculas: MATRICULA, COMPRA, SANCION...
> - El año académico, si procede.
> - A veces un texto libre.
> - **El tercero va siempre al final.**
>
> ### Cómo se escribe el tercero
>
> | Categoría | Formato |
> |---|---|
> | Alumnado | `Apellido1 Apellido2, Nombre` + número de identificación escolar |
> | Personal | `Apellido1 Apellido2, Nombre` + los **4 últimos caracteres** del documento, con la letra: `12345678Z` → `678Z` |
> | Empresas | **Razón social** + NIF |
>
> En las empresas manda **la razón social, no el nombre comercial**: es la que viene en las
> facturas y la que hay que poder cruzar con la contabilidad. El rótulo del negocio se guarda
> aparte y sirve para buscar (sección 5).
>
> ### Documento dentro de la carpeta
>
>     AAMMDD [REGISTRO] TIPO [TEXTO ADICIONAL].ext
>
> - `AAMMDD` es la fecha **del propio documento** (la que trae impresa la factura), no la
>   del día en que se archiva.
> - `TIPO` = FACTURA, CERTIFICADO, MATRICULA, SOLICITUD...
> - **El último hueco es texto libre** (10-sep-2026). Antes se llamaba "Año académico" y se
>   rellenaba solo con el curso; ver la sección 5.
>
> ### Lo que entra por correo
>
> El hilo del correo en PDF: `AAMMDD CORREO.pdf`, con la fecha del último mensaje.
>
> Los adjuntos: `AAMMDD ADJUNTO <el nombre que traían>.ext` (10-sep-2026, decidido por él).
> Gmail los manda como venían —`1000082963.jpg`, `LITNAC2026050413001031751487.pdf`— y esos
> nombres no dicen nada y se mezclaban con los papeles del expediente. El nombre de origen se
> limpia y se recorta a 40 caracteres. Si el adjunto merece un nombre de verdad, se le pone
> después desde "Gestionar documentos".
>
> ### El número de registro de Séneca
>
> Formato `26EM1234`:
>
> - `26` = el año. Se coge de la fecha del día en que se incluye el documento, y se puede cambiar.
> - `E` = entrada · `S` = salida.
> - `M` = serie manual · `A` = serie automática.
> - `1234` = los cuatro dígitos del asiento.
>
> Hacen falta las cuatro piezas porque Séneca lleva dos series y el número se repite cada año.
>
> ### El grupo en el nombre de la carpeta
>
> Hay un interruptor para añadir el grupo del alumno. **Cuidado con Bachillerato:** en la ESO
> el grupo se abrevia `1ºA`; en Bachillerato lleva la etapa, `1ºBachA`, para que no se
> confunda con el `1ºA` de la ESO.
>
> ### Los campos del tipo, en el nombre (11-sep-2026)
>
> El hueco de texto libre se concreta así:
>
>     AAMMDD TIPO [AÑO ACADÉMICO] [GRUPO] [campos del tipo, en el orden de Ajustes] [descripción corta] Tercero
>
> - Solo entran los campos configurados en Ajustes con **"Añadir al nombre"** marcado y con
>   valor. Uno vacío no deja hueco ni doble espacio.
> - Si el tipo trae configurada la columna de la unidad o el campo calculado Curso, el
>   interruptor viejo de "Añadir el grupo" se esconde solo: si no, el grupo saldría dos veces.
> - Ver la sección 5, "Los campos de cada tipo de asunto".
>
> ### Lo que NO va en el nombre
>
> El estado del asunto y la vía de comunicación **no** entran en el nombre de la carpeta.
> Cambian mientras se tramita, y renombrar carpetas en un Dropbox sincronizado cada vez que
> algo avanza sería pedir problemas. Van en `_GESTOR/asuntos.json`, que está en la misma
> carpeta compartida y lo lee cualquiera que abra la aplicación.
>
> ### Comunicaciones
>
> Guardo también copia en PDF de los hilos de correo o de Passen. El asunto del mensaje es
> el nombre de la carpeta del asunto.
>
> ---
>
> ## 5. Cómo funciona la aplicación
>
> Es una **web publicada en Vercel** que trabaja sobre la carpeta de Dropbox **de mi propio
> ordenador**, con el selector de carpetas del navegador (Chrome o Edge).
>
> - Sin cuenta de Dropbox, sin servidor y sin base de datos aparte.
> - Los datos no salen del ordenador.
>
> **Por qué es así:** no tengo la contraseña de la cuenta común de Dropbox del centro, y no
> sé si me la darían. Acabo de llegar y apenas me conocen. **El diseño no puede depender de
> esa contraseña.**
>
> Decisiones de diseño ya aprobadas:
>
> - Primero se elige la **categoría** (ALUMNADO, PERSONAL, EMPRESAS, OTROS), y después el tipo.
> - Los **tipos de asunto** solo se crean en Ajustes, nunca sobre la marcha. Los de DOCUMENTO
>   sí se crean al vuelo, desde el propio cuadro.
> - Se puede ver el archivo completo de un tercero.
> - La ficha del alumnado enseña arriba la edad actual, el DNI y los datos de contacto de los
>   tutores legales.
> - Además de arrastrar un documento a la carpeta, se puede elegir desde la app en la carpeta
>   donde esté: se guarda una copia ya con el nombre montado, y el original se queda donde estaba.
> - **Estado del asunto** (septiembre de 2026). Dice por dónde va la tramitación. La lista la
>   pone el centro en Ajustes, en el orden del trámite, no alfabético. Se guarda en
>   `_GESTOR/estados.json`. De partida: PENDIENTE, EN TRÁMITE, ENVIADO A FIRMA, FIRMADO,
>   A LA ESPERA DEL TERCERO, RESUELTO. La casilla "Depende de otros" decide en cuál de las tres
>   tarjetas de arriba sale el asunto.
> - **Vía de comunicación preferente** (septiembre de 2026). Es del asunto, no del tercero:
>   lo que ha pedido para esa gestión concreta. Teléfono, correo, iPasen o en persona.
>   `js/via-contacto.js` ofrece como botones los teléfonos o correos que ya están en el CSV del
>   tercero, para no escribirlos a mano.
> - **Fecha límite** (`js/plazos.js`). Opcional, va en la ficha de `asuntos.json`, nunca en el
>   nombre: cambia mientras se tramita, y renombrar la carpeta cada vez sería pedir problemas.
>   Los días se cuentan **naturales**, de calendario, que es lo que trae el papel del trámite; si
>   en un caso hace falta contar días hábiles, se cambia la fecha a mano. Un plazo vencido, el de
>   hoy o el de mañana salen en rojo o ámbar en la tarjeta del asunto; el resto, en gris. Los
>   tipos de asunto pueden llevar unos días de plazo por defecto (en Ajustes), para que la fecha
>   límite de un asunto nuevo salga puesta sola.
> - **Asuntos recurrentes** (`js/recurrentes.js`, `_GESTOR/recurrentes.json`). Gestiones que
>   vuelven cada mes, cada tres meses o una vez al año: la misma factura del mismo proveedor, el
>   mismo parte. Se apuntan una vez, con el tipo, el tercero, cada cuánto y el día (y el mes, si
>   es anual), y la aplicación calcula sola cuándo toca la siguiente a partir de la última vez que
>   se creó. **Las carpetas no se crean solas**: sale un aviso arriba de "Asuntos abiertos" y
>   hasta que no se pulsa el botón no se crea nada, para no llenar el Dropbox de carpetas vacías
>   que nadie ha pedido.
> - **¿Esto no lo hicimos ya?** (`js/duplicados.js`). Antes de abrir un asunto se mira si ese
>   tercero ya tuvo otro igual. Se mira barato: solo su carpeta del ARCHIVO y los abiertos.
> - **Buscador de tipos** (`js/tipos-buscador.js`). Con muchos tipos, tres letras filtran la
>   parrilla y arriba salen los más usados.
> - **Las dos listas de la pantalla de asuntos abiertos se distinguen a simple vista**
>   (septiembre de 2026). Documentos sueltos: hoja y franja arena. Asuntos: carpeta y franja azul.
> - **Editar un asunto ya creado** (septiembre de 2026, `js/asuntos-editar.js`). Botón Editar en
>   cada asunto abierto. Cambiar datos es cambiar el nombre de la carpeta, y la ficha viaja con
>   ella. **En el ARCHIVO no hay botón Editar**: el nombre de una carpeta archivada es el rastro
>   de aquel día.
> - **Copiar el Nº de identificación escolar** (9 de septiembre de 2026). Botón `Nº 1139877` en
>   la tarjeta de cada asunto de alumnado, en la ficha del asunto, en las listas de resultados y
>   en la ficha del alumno. **Solo en la categoría ALUMNADO**, para no confundirlo con los
>   cuatro caracteres del documento del personal ni con el NIF de una empresa.
> - **Copiar el nombre de un documento, sin la extensión** (9 de septiembre de 2026). En la
>   ficha del asunto y en el cuadro de gestionar documentos.
> - **Crear el tipo de documento desde el propio cuadro** (9 de septiembre de 2026). La última
>   opción del desplegable abre un campo para crearlo ahí mismo, sin salir a Ajustes.
> - **La guardia contra duplicados, en las cinco puertas** (9 de septiembre de 2026; quinta
>   puerta, 11-sep-2026). El cuadro de documentos, las tres listas de Ajustes —**tipos de
>   asunto, estados y tipos de documento**— y, desde el 11-sep-2026, **los campos propios**
>   (`js/ajustes.js`, sección 5, "Los campos de cada tipo de asunto"). Cada nombre se reduce a
>   su hueso: sin mayúsculas, sin tildes, sin espacios, guiones ni puntos, y sin la S del plural.
>   - Si ya está escrito de otra manera, **no se crea** y se dice cuál es el que hay.
>   - Si solo se parece —una errata a una o dos letras, o un nombre que contiene a otro—, se
>     avisa, se enseñan los parecidos y se deja decidir.
>   Vive en `js/util.js` (`U.parecidos` y `U.dejaCrear`). Si hace falta en otro sitio, se llama
>   desde allí: no se copia.
> - **Aviso de que el RegAlum.csv está viejo** (9 de septiembre de 2026). Al abrir se mira la
>   fecha del propio fichero en `_GESTOR/datos`. Ámbar al pasarse, rojo al doblar el plazo, y
>   rojo también si no hay ningún RegAlum.csv.
>   **Cuántos días es "viejo" depende de la época del año.** Las épocas van en día-mes, sin año,
>   y pueden dar la vuelta al año. Se cambian en Ajustes y se guardan en `_GESTOR/frescura.json`.
>   De partida: comienzo de curso (01-09 a 31-10) cada 7 días; matrícula y verano (01-06 a
>   31-08) cada 15; escolarización (01-03 a 30-04) cada 15; el resto del año, cada 30.
> - **La versión, a la vista** (9 de septiembre de 2026). En la pantalla de entrada y, ya
>   dentro, abajo a la izquierda. Nació de un susto: no veía el tablón porque el navegador tenía
>   la página vieja. **Se cambia en `App.VERSION` cada vez que se publica algo que él tenga que
>   ver.** Desde el 10-sep-2026 la versión lleva también la hora, en formato
>   `10-sep-2026 · 13:55`, hora de España. Es además el termómetro para saber si Vercel ha
>   publicado de verdad: ver más abajo.
> - **Botón de Salir** (9 de septiembre de 2026). Al pie de la barra de la izquierda, debajo de
>   Ajustes, separado por una línea. Salir aquí es **cerrar la sesión**: se recarga la página y
>   se vuelve a la pantalla de entrada, con las dos carpetas ya señaladas. Pide confirmación.
>   Vive en `js/salir.js`.
> - **La barra de la izquierda se pliega, y nace plegada** (10 de septiembre de 2026). Un botón
>   de tres rayas arriba del todo la abre y la cierra. Al elegir una pantalla se vuelve a plegar
>   sola. Lo que él elija se recuerda (`gestor-barra`), pero **de partida está plegada**.
>   Vive en `js/barra.js`.
> - **Botón grande de "+ Nuevo asunto"** (10 de septiembre de 2026). En la cabecera de la
>   pantalla de asuntos abiertos. Lo pone el mismo `js/barra.js`.
> - **El panel de lectura de la derecha** (10 de septiembre de 2026). La aplicación se queda a
>   la izquierda y lo que se lee sale a la derecha. Se cierra con la equis o con Escape. **El
>   borde izquierdo se arrastra**, y el ancho se recuerda (`gestor-lector-ancho`); con doble
>   clic vuelve al 46%. En pantalla estrecha (menos de 1100 píxeles) se pone a lo ancho.
>   Es un servicio para los demás módulos: `Lector.abrir({ titulo, pie, blob, botones })`.
>   Vive en `js/lector.js`.
> - **Comodidades de pantalla** (`js/usabilidad.js`): botón Volver, Cancelar, etiquetas de lo
>   que se está filtrando, vista compacta y la tecla Escape. No toca datos.
>
> ### La ficha de un asunto
>
> Al pulsar el nombre de un asunto se entra en su ficha, y ahí está todo lo suyo: sus datos, el
> contacto del tercero, la guía de su tipo con las casillas, sus notas, sus documentos y los
> demás asuntos del mismo tercero.
>
> **Por eso la tarjeta de la lista se queda con lo justo**: el desplegable del estado, "Copiar
> nombre" y "Archivar". `js/ficha-asunto.js` quita de la tarjeta cualquier otro botón, con una
> lista blanca (`BOTONES_DE_LA_TARJETA`). **Ojo con esto**: un módulo que añada un botón a la
> tarjeta con `window.Gestor.botonesDeTarjeta` **no se verá** si su texto no está en esa lista.
>
> ### Las tarjetas por tipo de asunto (10 de septiembre de 2026)
>
> Dentro de **En el departamento** y de **A la espera de terceros**, encima de la lista, sale
> una fila de tarjetas pequeñas: una por cada tipo de asunto que haya en ese montón, con
> cuántos son y, en rojo, cuántos están fuera de plazo. La primera tarjeta es **Todos**.
>
> - Al pulsar una, la lista de abajo se queda solo con los asuntos de ese tipo.
> - Al volver a pulsarla, o al pulsar Todos, vuelven a salir todos.
> - Al cambiar de montón se empieza siempre viendo todos los tipos.
> - **Con un solo tipo las tarjetas no salen.**
> - Las cuentas se hacen sobre lo que ya han dejado pasar el buscador y los filtros.
> - Si el tipo elegido desaparece del montón se vuelve solo a Todos.
>
> El orden es por cantidad, de más a menos, y a igualdad por orden alfabético. Vive en
> `js/asuntos-lista.js`, y sus estilos en `css/vista.css`.
>
> **Un tropiezo del que hay que aprender.** La primera versión llamó a su función
> `App.elegirTipo`. Ese nombre ya existía en `js/asuntos-nuevo.js`, que se carga **después**. La
> función de las tarjetas se perdía sin dar ningún error. Ahora se llama `App.filtrarPorTipo`.
> **Regla: antes de colgar una función nueva de `App`, comprobar que ese nombre no está ya
> cogido en otro fichero.** Las pruebas de jsdom no lo cazan: hace falta el navegador con la
> aplicación entera.
>
> ### Lo que deja un correo dentro del asunto (10 de septiembre de 2026)
>
> Palabras suyas al ver un asunto que había recibido correos: *"es un poco caótico y con textos
> complejos en las notas"*. De ahí salieron cuatro cosas, y las cuatro están hechas.
>
> - **La nota de un correo es de dos líneas.** *"Correo de Mercedes Pacheco · 09/09/2026"* y
>   debajo el asunto del correo. **El enlace ya no se escribe en el texto**: la nota lo guarda
>   aparte y lo enseña como un botón **Abrir en Gmail**.
>   `Notas.anadir(a, texto, extra)`, con `enlace`, `enlaceTexto` y `correo`.
> - **Un correo no entra dos veces** (`Notas.yaTieneCorreo`).
> - **Los adjuntos entran con nombre de la casa**: `AAMMDD ADJUNTO …`.
> - **Los documentos de la ficha van en dos grupos**: "Del expediente" y "Llegados por correo".
>   Los rótulos solo salen cuando hay de las dos clases. Lo de correo se reconoce por el nombre:
>   CORREO, HILO o ADJUNTO.
>
> Un detalle de fontanería: las fechas que trae el correo se recortan a `AAAA-MM-DD` al leer la
> bandeja. Se comprueba con `pruebas/correos.mjs`.
>
> ### El tablón, desplegado por defecto (10 de septiembre de 2026)
>
> Palabras suyas: *"si no se ve, se olvidará de mirarlo"*. El tablón **se ve siempre**. Solo se
> quita cuando hay algo abierto en el panel de la derecha, porque entonces no cabe.
>
> - El botón **Tablón** de la cabecera lo esconde y lo trae de vuelta a mano.
> - Si lo esconde y se va a otra pantalla, **al volver vuelve a estar desplegado**.
> - Por debajo de 900 píxeles de zona de trabajo se quita.
>
> **Hay DOS paneles a la derecha, no uno.** El de leer un correo pone `con-lector`, y el de ver
> un documento pone `con-visor`. En `js/vista.js` la lista se llama `PANELES_DE_LA_DERECHA`:
> **si nace un tercer panel, hay que apuntarlo ahí.**
>
> **Esa prueba corre a 1905 píxeles a propósito**, el ancho del monitor del trabajo. A 1600 el
> CSS ya quitaba el tablón por su cuenta y la prueba pasaba **con el fallo dentro**.
>
> ### El DNI del alumnado, y el aviso de que falta (10 de septiembre de 2026)
>
> Debajo del nombre de un alumno sale ahora **su DNI**. Y cuando no consta y por edad ya debería
> tenerlo, sale un **aviso**: *"FALTA EL DNI (16 años, ya debería tenerlo)"*.
>
> - La edad son **14 años**, cuando el DNI es obligatorio en España (Real Decreto 1553/2005,
>   artículo 1). Está en una constante, `EDAD_OBLIGATORIA`.
> - El DNI sale del propio `RegAlum.csv`, buscando la columna **por su título**: DNI, NIF, NIE,
>   documento, identidad o pasaporte. **Se dejan fuera las columnas de los tutores.**
> - **Si la descarga no trae ninguna columna de documento, no se enseña nada ni se avisa.**
> - Vale igual el DNI que el NIE que un pasaporte.
>
> **Aviso importante:** si no le sale el DNI de nadie, es que su descarga de Séneca no trae esa
> columna. Se arregla marcándola al generar el RegAlum, no en la aplicación.
>
> Vive en `js/dni.js`, que **no toca ninguna pantalla**: envuelve `App.pieAlumno` y
> `Datos.destacadosAlumno`. Se comprueba con `pruebas/dni.mjs`.
>
> **Un tropiezo del que hay que aprender.** `p.campos` **se queda solo con las columnas que
> traen algo**, así que a los alumnos sin DNI se les caía la columna. La solución: envolver
> también `Datos.cargar` y **guardarse la cabecera del CSV** (`r.cabecera`).
>
> ### Las tres mejoras del buscador de alumnado (10 de septiembre de 2026)
>
> 1. **Se busca también por el DNI y por el Nº de identificación escolar.**
> 2. **El que ya no está sale en naranja.** Lo decide `App.claseDeResultado`, en
>    `js/asuntos-nuevo.js`. Los estilos, en `css/tipos-buscador.css`.
> 3. **El Nº ya no sale dos veces.** Va solo en el botón. Cada fila lleva el número en su
>    `data-nie`, y `js/copiar.js` lo saca de ahí.
>
> ### El nombre comercial de las empresas (10 de septiembre de 2026)
>
> Las empresas tienen una columna más, **Nombre comercial**, la segunda del cuadro de alta.
>
> - **El buscador encuentra al proveedor escribiendo cualquiera de los dos**, y por trozos.
> - **Debajo del nombre se lee `Rótulo: Papelería Pintor Palomo · 33385414V`.** Lo pinta
>   `App.pieEmpresa`.
> - **En el nombre de la carpeta sigue mandando la razón social.**
>
> **Los ficheros viejos siguen valiendo.** `js/datos.js` lee las columnas **por su título**
> (`porTitulo`), con el sitio de antes como reserva. El fichero se reescribe con la cabecera
> nueva la primera vez que se da de alta o se cambia una empresa.
>
> ### Cambiar los datos de un tercero (10 de septiembre de 2026)
>
> En la ficha de **Personas y empresas** sale el botón **Cambiar los datos**. Abre el mismo
> cuadro del alta, relleno con lo que hay, y guarda encima.
>
> - **Solo para los dados de alta a mano** (`p.deSeneca !== true`).
> - Si se cambia el nombre, **las carpetas de sus asuntos de antes conservan el nombre viejo**,
>   y se avisa.
>
> El cuadro es uno solo para el alta y para el cambio: `App.cuadroDeTercero`, en
> `js/asuntos-nuevo.js`. Escribe `Datos.guardarEnLista`. Vive en `js/archivo-personas.js`, y se
> comprueba con `pruebas/empresas.mjs`.
>
> ### "Año académico" pasa a ser "Texto adicional" (10 de septiembre de 2026)
>
> En el cuadro de nombrar un documento ese campo se llama ahora **Texto adicional**, nace vacío y
> **no depende de ningún otro campo**. Al releer el nombre de un fichero se recoge **entero** lo
> que haya después del tipo, **solo si el tipo se ha reconocido**.
>
> Ojo: el campo sigue llamándose `curso` por dentro, y en la ficha del asunto el dato del asunto
> sigue rotulado "Año académico" —ese es otro campo, el del propio asunto—.
>
> ---
>
> ### Las guías del procedimiento
>
> Cada tipo de asunto puede llevar una lista de pasos, con título y explicación con negrita,
> viñetas y enlaces. Van en el orden del trámite. Se guardan en `_GESTOR/guias.json`.
>
> Dentro de un asunto abierto los pasos salen con casilla. Lo marcado se guarda en la ficha del
> asunto (`pasosHechos`), y lo elegido en `pasosElegidos`: lo ve todo el que abra la aplicación.
>
> **Se escriben desde dos sitios**: en **Ajustes**, y en la **ficha de un asunto abierto**, en
> el bloque "Guía del procedimiento". El botón lo pone `js/ficha-asunto.js`, pero **quien guarda
> es `js/guias-enganche.js`**, a través de `window.GuiasDelCentro.escribir(tipo)`. **El fichero
> se relee justo antes de abrir el cuadro**, por si el compañero ha escrito otra.
>
> #### Un paso hecho se pliega (10 de septiembre de 2026)
>
> Al marcar un paso, su explicación se esconde y queda solo el título tachado en verde. El enlace
> **ver** de la esquina lo vuelve a abrir.
>
> #### Preguntas con opciones (10 de septiembre de 2026)
>
> **Un paso puede ser una PREGUNTA.** Se marca con una casilla al escribir la guía y entonces se
> le ponen opciones. Cada opción tiene su nombre y **sus propios pasos**. Al elegir una, aparecen
> **solo** los pasos de esa opción. La cuenta de arriba **suma solo los pasos de la rama elegida**.
>
> Decisiones de diseño, para no rehacerlas:
>
> - **Una bifurcación por paso.** Las opciones no llevan opciones dentro.
> - **Las dos ramas se pintan desde el principio y solo se enseña la elegida.**
> - **Los identificadores viajan en el `data-id` del recuadro**, no por su posición.
> - **Ojo con los selectores al leer el cuadro de escribir la guía**: pedir solo los hijos
>   directos (`:scope >`).
> - Quién se entera de que se ha elegido una opción es un solo hueco, `Guias.cuandoSeElige(fn)`.
>
> Se comprueba con `pruebas/guias.mjs` y `pruebas/opciones.mjs`.
>
> ---
>
> ### La pantalla se mide a sí misma (10 de septiembre de 2026)
>
> `css/vista.css` pone `container-type: inline-size` en `.contenido`, y las reglas miran el
> ancho que le queda de verdad al contenido, no el de la ventana. Bajo 1000 las tres tarjetas
> sueltan la frase que las explica; bajo 900 se quita el tablón y la cabecera baja de línea;
> bajo 620 todo a una columna.
>
> El tope de 1180 píxeles de `css/estilos.css` se anula en `css/vista.css`. Conservan tope las
> dos pantallas que se leen seguidas: Nuevo asunto (940) y Ajustes (1600 desde el 11-sep-2026,
> antes 1040; ver la sección 5, "Ajustes ágiles").
>
> Con esto van los **filtros plegados**, también en `js/vista.js`: estado, plazo y orden se van a
> un panel que abre el botón **Filtros**. Se recuerda si se dejó abierto (`gestor-filtros`).
>
> ### El tablón de notas rápidas
>
> Columna a la derecha de los asuntos abiertos, para lo que llega y todavía no es un asunto.
> Color, autor, fecha y opcionalmente "para el día X". Botones: Hecha, Cambiar, A asunto y
> Borrar. Se guardan en `_GESTOR/tablon.json`.
>
> **Notas "Solo para mí"** (9 de septiembre de 2026). La nota marcada sale únicamente en el
> tablón de quien la escribió. **No es un secreto**: el fichero sigue en la carpeta compartida.
>
> ### Los ficheros de datos, sin trabajo manual (9 de septiembre de 2026)
>
> Los CSV de Séneca van en `_GESTOR/datos`.
>
> - **Los que aparecen un piso más arriba se recogen solos.** Vive en `js/rescate-datos.js`.
>   El traslado usa `Carpetas.moverFichero`: copia, comprueba el tamaño y solo entonces borra.
> - **Botón "Traer ficheros de Séneca".** El de alumnado se guarda **siempre como
>   `RegAlum.csv`**; los de personal **conservan su nombre**. Vive en `js/traer-datos.js`.
>
> ### De un correo a un asunto (9 de septiembre de 2026)
>
> En Gmail se le pone a un correo la etiqueta `GESTOR`. Un script de Apps Script lo recoge cada
> 5 minutos y deja su ficha, el hilo en PDF y sus adjuntos en la carpeta `GESTOR-BANDEJA` de
> Drive. La aplicación lee esa carpeta y enseña los correos arriba, con el tercero, el tipo y la
> fecha ya propuestos. Si el correo es **la respuesta de un asunto que ya existe** se ofrece
> guardarlo dentro. Y si estaba **archivado**, se ofrece **reabrirlo**.
>
> **"Leer el correo"** abre el PDF del hilo en el panel de la derecha. **Gmail no se deja meter
> dentro de otra página.** **Cada uno tiene su bandeja.**
>
> **El detalle entero está en el documento `Correos-a-asuntos.md` del proyecto de Claude.** El
> script vive en `apps-script/gestor-correos.gs`, pero **Apps Script no se despliega desde aquí**.
>
> ### El correo y la mensajería de Séneca (9 de septiembre de 2026)
>
> Dos botones en la ficha del asunto: **Correo** y **Mensaje Séneca**. La aplicación **no envía
> nada**: prepara los campos y los deja listos. Vive en `js/correo.js`. Al copiar el texto o
> abrir la ventana de redactar se apunta sola una nota (**una sola vez por cuadro**).
>
> **Solo Séneca:** **no hay campo Para**, y hay **un solo botón que se va cambiando**:
> "1. Copiar el asunto" → "2. Ahora, copiar el texto" → "Copiado. Pégalo y envía".
>
> ### Registrar un documento en un paso (11-sep-2026)
>
> Dar registro de entrada o salida a un documento era nombrarlo dos veces: se nombraba sin
> registro, había que salir de la ficha, añadir la copia sellada como si fuera otro documento y
> volver a escribir la fecha, el tipo y el texto adicional, ahora con el número de registro. Los
> dos ficheros hay que conservarlos (el original y el sellado), así que lo único que sobraba era
> nombrar dos veces y salir de la ficha.
>
> - **Botón Registrar**, en cada documento que todavía no lleve las cuatro piezas del registro en
>   su nombre: en la lista de "Gestionar documentos" y en la lista de la ficha del asunto. Al
>   pulsarlo se elige la copia sellada donde esté, y luego solo se pide **el número de registro**:
>   el resto del nombre (fecha, tipo, texto adicional) se lee del documento original, con
>   `Documentos.leerNombre`, igual que hace el cuadro de nombrar documentos. El nombre se monta
>   con `Nombres.montarDocumento`, la copia se guarda con `Carpetas.copiarFicheroEn`, el original
>   se queda como está, y se apunta una nota en el asunto: "Registrado 26EM1234 · <nombre del
>   documento>". Si ya hay un fichero con ese nombre, avisa y no lo sobrescribe.
> - **Casilla "Pendiente de registro"**, en el cuadro de nombrar un documento. Solo se enseña
>   cuando el documento no lleva registro. Lo marcado se guarda en la ficha del asunto, en
>   `_GESTOR/asuntos.json`, en una lista `pendientesRegistro` con los nombres de fichero. Un
>   documento pendiente lleva una marca ámbar "Sin registrar" al lado de su nombre, y su botón
>   Registrar sale destacado. Al registrarlo se quita solo de la lista; al renombrarlo desde
>   "Gestionar documentos", el nombre de la lista se actualiza con él.
> - **La tarjeta del asunto no lleva nada de esto**: se queda con lo justo, a propósito (ver
>   `BOTONES_DE_LA_TARJETA` más arriba).
> - Vive en `js/registro.js`, un módulo aparte porque lo usan dos sitios que no comparten cuadro:
>   "Gestionar documentos" (`js/documentos.js`) ya tiene su propio `U.preguntar` abierto, así que
>   ahí se pinta DENTRO de ese mismo cuadro (`Registro.pintarEnContenedor`); la ficha del asunto
>   (`js/ficha-asunto.js`) no tiene ningún cuadro abierto, así que ahí se abre uno nuevo
>   (`Registro.abrirCuadro`). **Solo hay un cuadro de diálogo en toda la aplicación**: abrir un
>   segundo `U.preguntar` mientras el primero sigue esperando le roba los botones al de fuera, y
>   el de fuera se queda colgado para siempre.
> - `Registro.proponer({ anio, tipo, serie, numero })` rellena las cuatro piezas del cuadro ya
>   pintado; `tipo` es `E`/`S` (entrada o salida) y `serie` es `M`/`A` (manual o automática).
> - **Leer el número solo, del sello de Séneca dentro del PDF** (11-sep-2026, más tarde el mismo
>   día). Comprobado con un PDF real: el sello va como texto en la primera página, aunque el
>   documento sea un escaneado (imagen). El texto trae, tal cual:
>
>       2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02
>
>   `AÑO / CÓDIGO DEL CENTRO / SERIE + número con ceros por delante`, pegado a `ENTRADA` o
>   `SALIDA`, pegado a `Fecha: dd/mm/aaaa hh:mm:ss`. Ese ejemplo es el registro `26EM0368`.
>   - `js/registro-lector.js` lee el texto de la primera página con **pdf.js** (Mozilla), y lo
>     busca con `(\d{4})\s*\/\s*\d+\s*\/\s*([MA])\s*0*(\d+)\s*(ENTRADA|SALIDA)`, tolerante a
>     espacios y saltos de línea. Si el número tiene más de cuatro cifras, se deja entero (no se
>     recorta) y se avisa; si no, se rellena con ceros por delante hasta cuatro.
>   - Al elegir la copia sellada, si se encuentra el sello, el cuadro de Registrar sale ya
>     relleno, con una línea verde "Leído del sello de Séneca", y **el foco va directo al botón
>     de aceptar**: solo hay que confirmar. Si no se encuentra —no es un PDF, o no trae el
>     sello—, el cuadro sale vacío como siempre, con el foco en los cuatro dígitos.
>   - **Ojo con el foco**: `js/usabilidad.js` vigila cuándo se abre el cuadro (`#capa`) y pone el
>     cursor solo en su primer campo, con un `MutationObserver`. Ese observador se dispara
>     después del código que abre el cuadro, así que pisaría cualquier `.focus()` puesto ahí
>     mismo. El foco de Registrar se pone con `setTimeout(fn, 0)`, para que se aplique después.
>   - La fecha del sello no cambia la fecha `AAMMDD` del nombre, que es la del propio documento:
>     se guarda en la nota, `"Registrado 26EM0368 el 10/09/2026 · <documento>"`.
>   - **pdf.js va copiado en el repositorio**, en `js/lib/pdf.min.js` y `js/lib/pdf.worker.min.js`
>     (versión 3.11.174, la del `build/` de `pdfjs-dist` en npm — no la de `legacy/`, de sobra
>     para Chrome y Edge). No se carga de ninguna dirección externa, y solo se trae la primera
>     vez que se pulsa Registrar sobre un PDF, no al arrancar la aplicación.
>   - El PDF de muestra con el que se comprobó **no está en el repositorio**: lleva datos
>     personales. La prueba monta un PDF mínimo válido en su propio código, con el texto del
>     sello dentro, para no necesitar ninguno de verdad.
> - Se comprueba con `pruebas/registro.mjs`.
>
> ### Terceros relacionados con un asunto (11-sep-2026)
>
> Un asunto puede afectar a más de una persona o entidad, además de su tercero principal: un
> expediente disciplinario donde hay dos alumnos implicados, una incidencia entre dos empresas.
> Antes de esto no había dónde apuntarlo, y no se podía saber, desde la ficha del otro implicado,
> que ese asunto también le afecta.
>
> - **Bloque "Personas y entidades relacionadas"**, en la ficha del asunto (`js/ficha-asunto.js`),
>   al lado de "Otros asuntos de este tercero". **Solo ahí**: la tarjeta de la lista no lleva nada
>   de esto, a propósito (ver `BOTONES_DE_LA_TARJETA` más arriba).
> - Se guarda en la propia ficha del asunto, en `asuntos.json`: `ficha.relacionados`, una lista de
>   `{ categoria, nombre }`. Los asuntos de antes no tienen ese campo, y no hace falta migrar nada:
>   una ficha sin `relacionados` simplemente no tiene ninguno.
> - **Para elegir o dar de alta el relacionado se reutiliza todo lo que ya existía**: el nombre se
>   monta con `App.textoTercero` (las mismas reglas de la sección 4), el alta de uno nuevo con
>   `App.cuadroDeTercero` y `Datos.anadirALista`, y no se repiten dos veces con nombre parecido
>   gracias a `U.parecidos`/`U.dejaCrear`, igual que los tipos o los estados. El propio buscador de
>   "Nuevo asunto" se ha sacado a una función reutilizable, `App.pintarBuscadorDeTercero`
>   (categoría + buscador + resultados + alta), en `js/asuntos-nuevo.js`, para no repetir esa
>   lógica en el módulo nuevo.
> - **Nunca se copia ningún documento del asunto.** Al archivar, si el asunto tiene relacionados,
>   se pregunta a cuáles de ellos avisar (todos marcados por defecto) y, en la carpeta de cada uno
>   dentro de ARCHIVO (se crea si no existe), se deja una carpeta `(RELACIONADO) <nombre del
>   asunto>` con un único fichero de texto, `DONDE ESTA ESTE ASUNTO.txt`, que dice dónde está el
>   asunto de verdad. Al reabrir el asunto, esa carpeta-nota se borra sola; **si alguien ha metido
>   algo más dentro, no se borra**, y se avisa para revisarla a mano.
> - Esas carpetas-nota viven al mismo nivel que un asunto de verdad (`ARCHIVO / categoría /
>   tercero / carpeta`), así que sin más se confundirían con asuntos archivados: `App.verArchivo`
>   y `Duplicados.delTercero` (usado por "Otros asuntos de este tercero") se envuelven para
>   quitarlas de en medio, por su nombre (`(RELACIONADO) `).
> - La ficha de la persona o empresa (`js/archivo-personas.js`, `App.verFicha`) enseña un bloque
>   "Relacionado con este asunto" cuando aparece como relacionada de alguno, esté el asunto abierto
>   o archivado, mirando directamente `App.E.registro.asuntos` (ya está en memoria).
> - Vive en `js/relacionados.js`, cargado después de `js/duplicados.js` (envuelve
>   `Duplicados.delTercero`) y de `js/archivo-personas.js` (envuelve `App.verFicha` y
>   `App.verArchivo`); no importa que cargue antes o después de `js/ficha-asunto.js`, porque a
>   `window.Relacionados` solo se le llama en tiempo de uso, no al cargar el fichero.
> - Se comprueba con `pruebas/relacionados.mjs`: sin relacionados no cambia nada, alta de dos
>   relacionados y su guardado en `asuntos.json`, el propio tercero no se puede añadir como
>   relacionado, ni el mismo relacionado dos veces (ni con un nombre casi igual), las notas al
>   archivar con su texto y su ruta, la carpeta del relacionado se crea si falta, al reabrir se
>   borran las dos notas pero la lista de relacionados sigue en la ficha, una nota con algo más
>   dentro no se borra y avisa, y la ficha de la persona enseña el asunto relacionado, abierto y
>   archivado.
>
> ### Los campos de cada tipo de asunto (11-sep-2026)
>
> Hasta ahora, lo único que distinguía a dos asuntos del mismo tipo y del mismo tercero era la
> descripción corta, texto libre escrito a mano cada vez. Ahora cada tipo de asunto puede llevar
> sus propios **campos**: datos que ya están en los ficheros (la unidad, la modalidad de
> Bachillerato, el puesto, el NIF...), o que Francisco crea a mano, y que salen solos y ya
> rellenos al crear el asunto.
>
> - **De dónde salen los campos disponibles** (`js/campos.js`, `Campos.catalogoDeCategoria`):
>   - **Del fichero de la categoría**, leyendo su **cabecera** (no `p.campos`, que solo trae las
>     columnas que traen algo — el mismo cuidado del DNI). Para ALUMNADO es la cabecera de verdad
>     del RegAlum.csv; para PERSONAL, EMPRESAS y OTROS, la de su propio CSV. Por eso
>     `Datos.cargarLista` (`js/datos.js`) devuelve ahora también `.cabecera` para esas tres, no
>     solo para ALUMNADO.
>   - **Calculados**: de momento uno, **Curso** (`Campos.calcularCurso`), la unidad sin su última
>     letra y sin el espacio que deja al quitarla (`1ºA`→`1º`, `1ºBachA`→`1ºBach`, `2ºFPB B`→
>     `2ºFPB`). Se aplica sobre la forma **compacta** del grupo (`Nombres.grupoCompacto`), no
>     sobre la columna Unidad tal cual la escribe Séneca: así no queda el hueco de en medio.
>   - **Propios**: los que Francisco crea en Ajustes (texto libre o lista cerrada), y valen para
>     cualquier categoría. Al crear uno pasa por `U.dejaCrear`/`U.parecidos` — la misma guardia
>     contra duplicados de tipos, estados y tipos de documento. **Es la quinta puerta** que usa
>     esa guardia.
> - **Cómo se guarda**, en `_GESTOR/campos.json` (ver la tabla de la sección 6): `propios` (con
>   su clase y sus valores) y `porTipo` (indexado por la misma clave que usa `tipos.json`). Cada
>   entrada de `porTipo` guarda solo `origen`, `columna` o `id`, `obligatorio` y `enNombre` — **no**
>   copia la clase ni los valores de un campo propio: quien tenga que pintarlo (`js/asuntos-nuevo.js`,
>   `js/asuntos-editar.js`) los busca en `propios` con `Campos.propioDe`, así un cambio en la lista
>   de valores se ve en todos los tipos que lo usan, sin migrar nada.
> - **Configurar los campos de un tipo**: en Ajustes, cada tipo lleva un botón **Campos**
>   (`App.abrirCamposDeTipo`), con los ya puestos arriba (con flechas para ordenarlos, y sus dos
>   casillas Obligatorio y Añadir al nombre) y el catálogo abajo, con buscador. Al añadir uno del
>   catálogo nace con las dos casillas **sin marcar**: Francisco decide caso por caso. El cuadro
>   usa `cuadro-ancho`, igual que otros cuadros anchos de la aplicación. Bloque nuevo **Campos
>   propios**, para verlos y borrarlos todos juntos; al borrar uno en uso se avisa y se dice en
>   qué tipos está (`Campos.tiposQueUsanPropio`).
> - **Al crear un asunto** (`js/asuntos-nuevo.js`), tras elegir tipo y tercero sale el bloque
>   **Datos del asunto**, con los campos del tipo ya rellenos (`Campos.valorInicial`). Un dato
>   vacío —la modalidad de un alumno de la ESO— no es un error: el campo sale en blanco y se
>   puede escribir a mano. Obligatorio impide crear el asunto hasta rellenarlo (foco en el que
>   falte). La vista previa del nombre se actualiza al escribir o al marcar/desmarcar.
> - **Al editar** (`js/asuntos-editar.js`), el cuadro trae los mismos campos con lo guardado
>   (`App.pintarCamposEditar`); al aceptar, si cambia algo que va al nombre, la carpeta se
>   renombra igual que hoy. Como el cuadro puede quedarse más alto que la pantalla con estos
>   campos de más, se le añade la clase `cuadro-alto` (scroll por dentro) mientras está abierto.
> - **En la ficha del asunto** (`js/ficha-asunto.js`), los campos con valor salen en el bloque de
>   datos del asunto, uno por línea, entre la descripción y el estado.
> - Un tipo sin campos configurados se comporta exactamente igual que antes de este cambio; los
>   asuntos creados antes se quedan sin campos y no pasa nada.
> - Decisiones de diseño, sin preguntar (11-sep-2026): la clave de un campo es `fichero:<columna>`
>   o `<origen>:<id>` (`Campos.claveDeCampo`); el catálogo de PERSONAL/EMPRESAS/OTROS sale de la
>   cabecera que ya devolvía `Datos.cargarLista`, ampliada para exponerla también en esas tres
>   categorías; Curso se calcula sobre el grupo compacto, no sobre la columna en crudo; las dos
>   casillas de un campo nuevo del catálogo nacen sin marcar; y `porTipo` no migra nada al borrar
>   o cambiar un campo propio, porque nunca copia su clase ni sus valores.
> - Se comprueba con `pruebas/campos.mjs` (ocho escenarios más la edición), con capturas a 1905
>   píxeles del bloque "Datos del asunto" y del cuadro de Campos de Ajustes.
>
> ### Que no se dupliquen los asuntos (11-sep-2026)
>
> Caso real: dos carpetas de TRANSPORTE del mismo alumno, mismo curso académico, que solo se
> diferenciaban en el grupo (uno lo llevaba en el nombre y el otro no) — un aviso ámbar nunca las
> hubiera evitado, porque nunca impide crear nada.
>
> - **Al crear un asunto** (`js/duplicados.js`, el `onclick` de `btn-crear` envuelto), si ya hay un
>   asunto abierto o archivado del mismo tercero, mismo tipo y mismo año académico, se para del
>   todo: cuadro "Este asunto ya existe", con "Abrir el que ya existe" (a la ficha si está abierto,
>   o a su carpeta del ARCHIVO si está archivado) o "Crear otro de todas formas". El grupo y el
>   texto libre **no cuentan**: son justo lo que hizo que dos carpetas parecieran distintas a
>   simple vista. Si a alguno de los dos le falta el año académico, cuenta como coincidencia
>   (`Duplicados.coincideCurso`): más vale preguntar de más que dejar pasar un duplicado de verdad.
>   - Con varios candidatos abiertos, el de partida es el que se abrió más recientemente
>     (`Duplicados.candidatoMasReciente`).
>   - La comprobación nunca debe impedir crear un asunto por su cuenta: si algo falla al mirar, se
>     sigue como si no hubiera nada (todo envuelto en `try/catch`).
> - **Unir dos que ya existen** (`js/unir-asuntos.js`), para los creados antes de esta parada o a
>   mano: cuando dos o más coinciden en tercero, tipo y curso, se puede revisar y unir. Desde el
>   11-sep-2026 esto vive en su propia pantalla, ver "Los duplicados, a su propia pantalla" más
>   abajo. Se elige cuál se queda (de partida, el de nombre más largo); los ficheros del otro se
>   mueven a la carpeta que se queda, las notas se juntan (con una nota de la unión al final), los
>   pasos de la guía se copian del que se queda si no tenía, y la carpeta que se va se borra. Si
>   algún fichero choca de nombre entre las dos carpetas, no se mueve ni se borra nada, y se avisa
>   de cuáles.
> - Vive en `js/duplicados.js` (la parada al crear) y `js/unir-asuntos.js` (unir los que ya
>   existen), cargado justo después de `js/asuntos-lista.js`, que es quien define
>   `App.pintarAbiertos`.
> - Se comprueba con `pruebas/duplicados.mjs`: el caso real de TRANSPORTE para al crear; dos
>   MATRICULA del mismo alumno en cursos distintos NO paran; con varios candidatos, el de partida
>   es el abierto más reciente y "Abrir el que ya existe" lleva a su ficha; con un candidato
>   archivado, lleva a su carpeta del ARCHIVO; Unir fusiona ficheros, notas y guía, y borra la
>   carpeta que sobra; y un choque de nombres entre las dos carpetas no mueve ni borra nada. Los
>   escenarios de la pantalla propia de duplicados están en la sección siguiente.
>
> ### Los duplicados, a su propia pantalla (11-sep-2026)
>
> Antes, cuando dos o más asuntos abiertos coincidían en tercero, tipo y curso, salía una franja
> amarilla "Parecen el mismo asunto" encima de la lista de Asuntos abiertos, con las columnas de
> cada grupo una debajo de otra: con varios grupos a la vez, ocupaba media pantalla antes de llegar
> a ver ningún asunto de verdad.
>
> - **Un aviso de una línea**, junto al botón Actualizar de Asuntos abiertos:
>   `⚠ N posible(s) duplicado(s) — Revisar`. Sin ningún duplicado no se ve nada (`#btn-duplicados`
>   queda oculto).
> - **Pantalla propia "Duplicados"**, a la que solo se llega pulsando ese aviso — no está en la
>   barra de la izquierda —, con su botón Volver. Cada grupo se enseña con sus asuntos en columnas,
>   una al lado de otra: el nombre de la carpeta (enlaza a su ficha), una línea con fecha de
>   apertura / estado / vía / fecha límite, sus documentos (se abren en el visor de la derecha de
>   siempre, `Visor.abrir`) y sus notas (las tres últimas, con "y N más" si hay más), con quién la
>   escribió y cuándo.
> - El botón **Unir** es el mismo de siempre, sin cambios en su lógica.
> - Botón nuevo **"No son el mismo"**: descarta ese grupo concreto, hasta que se diga lo contrario.
>   Se guarda por la firma exacta de los nombres del grupo (ordenados y unidos) en
>   `_GESTOR/no-duplicados.json`. Si más adelante se crea o cambia un asunto que amplía ese grupo,
>   la firma ya no coincide, y el aviso vuelve a salir solo, sin que nadie tenga que hacer nada.
> - Reversible desde Ajustes: bloque nuevo **"Duplicados descartados"**, con un botón "Volver a
>   avisar" en cada entrada.
> - Vive entero en `js/unir-asuntos.js` (estilos en `css/unir-asuntos.css`) y no toca `js/ajustes.js`
>   ni la barra de la izquierda: la pantalla y el bloque de Ajustes los crea el propio módulo
>   (`App.PANTALLAS.push`, y enganchado a Ajustes con `window.Gestor.alRefrescar`, igual que
>   `js/frescura.js` o `js/conflictos.js`).
> - `no-duplicados.json` entra en la lista de ficheros protegidos por copia de seguridad
>   (`js/copias.js`).
> - Se comprueba con `pruebas/duplicados.mjs`: ya no sale ninguna franja en Asuntos abiertos; el
>   aviso no se ve sin duplicados y dice cuántos hay cuando los hay; lleva a la pantalla propia;
>   cada columna enseña sus datos, documentos y solo las tres notas más recientes con "y N más";
>   Unir sigue funcionando igual desde la pantalla nueva; "No son el mismo" guarda el descarte (con
>   quién y cuándo) y el grupo deja de avisar; "Volver a avisar" en Ajustes lo deshace; y si al
>   grupo descartado se le suma un tercer asunto que coincide, la firma cambia y vuelve a avisar
>   solo.
>
> ### Ajustes ágiles: encontrar y crear tipos sin scroll (11-sep-2026)
>
> Sus palabras: *"Aunque me pide que elija a qué tipo de tercero asociar el tipo de asunto, debajo
> me aparecen todos los tipos de asuntos empezando por el alumnado, de modo que tengo que hacer un
> scroll-down casi infinito para ver qué tipos existen y no duplicar."* Y del botón de Ajustes en la
> barra: *"no esté debajo del todo, porque si hay mucho desplegado, me tengo que desplazar mucho
> hacia abajo."*
>
> **A. El bloque "Tipos de asunto" de Ajustes** (`js/ajustes.js`, `css/ajustes.css`):
>
> - **Una sola categoría a la vez.** La lista de `#tabla-tipos` obedece al desplegable
>   `#nueva-categoria`: solo se ve la categoría elegida. Se recuerda en `localStorage`
>   (`gestor-ajustes-categoria`), de partida ALUMNADO. `App.E.categoriaAjustes` es el estado; la
>   cambia `App.cambiarCategoriaAjustes(cat)`, que pone de acuerdo el desplegable y las pestañas.
> - **Cuatro pestañas** (`App.pintarPestanasTipos`), ALUMNADO · PERSONAL · EMPRESAS · OTROS, con la
>   cuenta de cada una. Pulsar una pestaña o cambiar el desplegable hace lo mismo: los dos mandos
>   van siempre de acuerdo. Una categoría sin tipos sale igual, con un 0.
> - **Buscador cruzado** (`#buscar-tipos`), a la derecha de las pestañas. Con dos letras o más,
>   `App.pintarTiposAjustes` deja de mirar la pestaña y enseña las coincidencias de **las cuatro
>   categorías**, cada una con su categoría en una etiqueta (`.marca-categoria`, ya existía para
>   otra cosa). Mientras se busca, las pestañas se apagan (clase `.apagadas`) y arriba sale
>   "Buscando en todas las categorías · N resultados" (`#tipos-buscando-info`). Al vaciar el campo
>   vuelve la categoría marcada. Es justo lo que evita duplicar sin verlo: el tipo aparece aunque
>   esté colgado de otra categoría.
> - **Aviso en vivo al escribir un tipo nuevo** (`#aviso-nuevo-tipo`, `App.pintarAvisoNuevoTipo`,
>   con el `oninput` de `#nuevo-tipo`). Usa la misma guardia de siempre (`U.parecidos` /
>   `U.dejaCrear`, `js/util.js`), no una comparación nueva. Si el nombre ya existe (mismo hueso),
>   línea roja "Ya existe: X, en CATEGORIA", el botón Añadir se apaga, y un enlace "Verlo"
>   (`App.verTipoEnAjustes`) cambia a esa categoría y da un destello de un segundo a su tarjeta.
>   Si solo se parece, línea ámbar con los parecidos: es un aviso, no una prohibición, y el botón
>   sigue encendido. Lo mismo, más sencillo (sin categoría), para los estados (`#aviso-nuevo-estado`)
>   y los tipos de documento (`#aviso-nuevo-tipo-doc`), con `App.pintarAvisoSimple`.
> - **Rejilla de tarjetas, no filas.** `#tabla-tipos`, `#tabla-estados` y `#tabla-tipos-documento`
>   pasan de `.fila-tipo` (una fila de lado a lado) a `.rejilla-tipos` con tarjetas `.tarjeta-tipo`:
>   `display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr))`. Cada tarjeta lleva su
>   contenido y, arriba a la derecha, un botón de tres puntos (`App.botonMenuTarjeta`, genérico) con
>   el menú de esa fila: Campos / Cambiar el nombre / Quitar para los tipos, Cambiar el nombre /
>   Quitar para los estados (que siguen con sus flechas de orden fuera del menú, a la vista: el
>   orden del trámite no se toca, solo cambia el sitio en la rejilla, no la columna) y Quitar para
>   los tipos de documento. Quitar sigue pidiendo confirmación en los tres (antes tipos y tipos de
>   documento no la pedían).
> - **Ajustes aprovecha el ancho**: su tope sube de 1040 a 1600 píxeles (`css/vista.css`,
>   `#pantalla-ajustes`). Nuevo asunto conserva su 940. La cabecera y el cuerpo de los bloques
>   comparten el mismo relleno lateral (`#pantalla-ajustes > .cabecera { padding: 0 16px }`), y los
>   párrafos de explicación no pasan de 90 caracteres de ancho (`max-width: 90ch`).
> - **Igual, en pequeño, para Tipos de documento y Estados del asunto**: misma rejilla, mismo menú
>   de tres puntos, mismo aviso en vivo. Campos propios y Asuntos que se repiten no se han tocado.
>
> **B. Llegar a Ajustes sin bajar la página** (`index.html`, `css/estilos.css`, `css/barra.css`,
> `js/barra.js`):
>
> - **La barra de la izquierda se queda fija** (`position: fixed`, con su propio `overflow-y:auto`
>   por si algún día no cupiera). El contenido se desplaza con un `margin-left` (232px, o 52px con
>   la barra plegada) en vez de dejar que la barra se lleve sitio del flujo. Así su pie —y ahora
>   también Ajustes— se ven sin bajar del todo, aunque la pantalla sea larga.
> - **Ajustes sube a la lista de pestañas**, justo después de "Personas y empresas" y separado por
>   una línea fina (`.separador-lateral`). En `.lateral-pie` se quedan solo el nombre de quien ha
>   entrado y el botón Salir. `js/fichas-huerfanas.js` y `js/recurrentes.js` siguen encontrando el
>   botón por `.pestana[data-pantalla="ajustes"]`, así que no hizo falta tocarlos.
> - **Con la barra plegada, un icono de rueda dentada** (`#btn-barra-ajustes`, junto al de las tres
>   rayas, `js/barra.js`) lleva directo a Ajustes, sin tener que abrir la barra primero. Solo se ve
>   plegada (`css/barra.css`).
>
> **Un tropiezo del que aprender.** La primera versión de la rejilla llamó a la tarjeta de un tipo
> `App.tarjetaDeTipo`; ese nombre ya estaba cogido en `js/asuntos-lista.js` (las tarjetas por tipo
> de la lista de asuntos abiertos). Se detectó con `pruebas/nombres-app.mjs` antes de subir nada, y
> se renombró a `App.tarjetaTipoAjustes`. Sigue valiendo la regla de siempre: comprobar con un
> `grep` antes de colgar una función nueva de `App`.
>
> Se comprueba con `pruebas/ajustes-agil.mjs`, a 1905 píxeles: una categoría a la vez, la pestaña y
> el desplegable de acuerdo en los dos sentidos, el buscador encuentra en otra categoría con su
> etiqueta, el aviso en vivo (igual y parecido) en tipos, veinte tipos de prueba en al menos tres
> columnas, la pestaña Ajustes visible sin más scroll con la página larga, y el icono de la rueda
> dentada con la barra plegada. Hizo falta ajustar dos pasos de `pruebas/navegador.mjs` y
> `pruebas/campos.mjs` que abrían "Cambiar el nombre" o "Campos" con un clic directo sobre
> `.fila-tipo`: ahora pasan primero por el menú de los tres puntos de la tarjeta.
>
> ### La papelera: borrar sin miedo (11-sep-2026)
>
> Hasta ahora no se podía borrar nada desde la aplicación. Desde hoy sí, pero **nada se borra de
> verdad a la primera: se manda a una papelera** compartida, de la que se puede devolver a su
> sitio. Por qué: las carpetas viven en el Dropbox del centro y las usan dos administrativos; un
> borrado de verdad desaparecería también del ordenador del compañero, sin aviso y sin deshacer.
> Encargo completo en `docs/PAPELERA.md`.
>
> - **Dónde hay botón Borrar, y dónde no**: documento dentro de un asunto (ficha del asunto y
>   "Gestionar documentos"), documento suelto, un asunto **abierto** desde su ficha (nunca desde la
>   tarjeta de la lista, ni en el ARCHIVO), tipo de asunto, estado, tipo de documento, campo propio
>   y persona o empresa dada de alta a mano (nunca la que viene de Séneca). El botón se llama
>   siempre **Borrar**, con el aspecto de botón de peligro (`.boton-peligro`, ya existía) y va el
>   último de su fila. Los sitios que ya tenían un "Quitar" (tipos, estados, tipos de documento y
>   campos propios en Ajustes; la nota del tablón) se han cambiado para que pasen por la papelera,
>   en vez de duplicar el botón.
> - **La papelera**: carpeta `_GESTOR/PAPELERA`, y su índice `_GESTOR/papelera.json` (una lista de
>   fichas, la más nueva arriba). Lo que es un fichero o una carpeta se mueve dentro, en su propia
>   subcarpeta `AAMMDD-HHMM <nombre>` (así dos borrados del mismo nombre no chocan), con
>   `Carpetas.trasladar` / `Carpetas.moverFichero`: si la copia no sale completa, no se borra nada.
>   Lo que no es un fichero (un tipo, un estado, una persona, una nota…) no tiene carpeta: su dato
>   se guarda entero en la ficha del índice. `papelera.json` es un fichero compartido más: se relee
>   antes de escribirlo y entra en las copias de seguridad de `js/copias.js` (ver más abajo).
> - **Las comprobaciones antes de borrar**: un tipo de asunto no se borra si hay asuntos (abiertos
>   o en `asuntos.json`) con ese tipo — se dice cuántos —, y si tiene guía escrita se avisa de que
>   se va con él (guardada en la papelera, para poder devolverla junto con el tipo). Un estado no
>   se borra si algún asunto lo tiene puesto. Un campo propio no se borra si está asociado a algún
>   tipo — se dice a cuáles —. Un tipo de documento se borra siempre: los documentos ya nombrados
>   conservan su nombre. Una persona o empresa no se borra si tiene asuntos, abiertos o archivados
>   (se mira con `Duplicados.delTercero`), y solo se puede borrar si se dio de alta a mano.
> - **El cuadro de confirmación**: uno solo, "¿Mandar a la papelera?", con el nombre en negrita y
>   "Se podrá recuperar desde Ajustes › Papelera" en gris. Sin escribir nada para confirmar.
>   Excepción: un asunto abierto con documentos dentro lleva un segundo cuadro, "¿Seguro?", después
>   del primero — nunca los dos a la vez, que solo hay un `#capa`.
> - **El bloque Papelera de Ajustes**, el último de todos: cada línea con qué era, el nombre, de
>   dónde salía, quién y cuándo ("hace N días"), y dos botones, **Devolver a su sitio** y **Borrar
>   del todo** (esta última pide su propia confirmación: "Esto sí lo quita de verdad. Dropbox aún
>   lo guarda 30 días más en su propia papelera."). Si hay algo de más de 30 días, aviso ámbar con
>   un botón para borrarlo todo de golpe. **La papelera no se vacía sola, nunca.**
> - **Devolver a su sitio**: si el asunto de un documento ya no existe, se ofrece llevarlo a "Por
>   clasificar" en vez de a su asunto. Si ya hay algo con ese nombre en el destino, no se pisa
>   nada y se dice qué hay. Al devolver algo, sale de `papelera.json` y su subcarpeta (si tenía) se
>   quita también.
> - **El rastro**: al mandar un documento a la papelera desde un asunto, se apunta sola una nota en
>   ese asunto (`Notas.anadir`); al devolverlo, otra nota. Un asunto entero no tiene dónde
>   apuntarlo: el rastro es la propia ficha de `papelera.json`.
> - Vive en `js/papelera.js` (`window.Papelera`), cargado después de `js/dni.js` y antes de
>   `js/inicio.js`. Los sitios donde no había botón todavía (documento suelto, persona dada de alta
>   a mano) lo llevan por **envoltura** (`App.tarjetaSuelto`, `App.verFicha`), como hace
>   `js/dni.js`; donde el botón va dentro de una función privada (los documentos de un asunto, la
>   ficha misma, la nota del tablón, las listas de Ajustes) se ha tocado el fichero directamente.
> - Se comprueba con `pruebas/papelera.mjs`.
>
> ---
>
> ## 6. Cómo trabajamos el código ← LÉELO ANTES DE TOCAR NADA
>
> **El repositorio de GitHub es la versión buena.** Repositorio privado
> `fmargon780/gestor-asuntos-ies`, rama `main`.
>
> 1. Tú escribes el código y lo subes al repositorio.
> 2. Vercel publica solo, en la misma dirección.
>
> Dirección buena: **https://gestor-de-asuntos.vercel.app** — proyecto de Vercel
> `gestor-de-asuntos`, equipo `team_gnCjBLTS8m8PNTFVUf7ST0uN`.
>
> **Un solo proyecto de Vercel. No crear más.** Ver la sección 0.
>
> **Nunca me pidas que edite líneas sueltas. Fichero entero, siempre.**
>
> ### Publicar: comprobarlo siempre, no darlo por hecho ← IMPORTANTE
>
> **Subir al repositorio no garantiza que Vercel publique.** Después de subir algo hay que
> comprobar qué se está sirviendo:
>
>     curl -s "https://gestor-de-asuntos.vercel.app/js/nucleo.js?v=<algo distinto cada vez>"
>     y mirar la línea App.VERSION
>
> El `?v=` es imprescindible: sin él se puede recibir una copia guardada.
>
> Lo aprendido el 10-sep-2026, en un día con veinte publicaciones:
>
> - **Comprobar la versión no basta: hay que comprobar cada fichero que se ha cambiado.** Un
>   `curl` con `grep` de un nombre de función nuevo en cada fichero tocado es la comprobación.
> - **Cada commit es una publicación, y van en cola.** Con la cuenta gratuita cuatro o cinco
>   commits seguidos tardan **quince o veinte minutos**, y mientras tanto la web sirve una mezcla.
>   **Conviene agrupar los ficheros en los menos commits posibles** y comprobar al final.
> - **Una publicación de Vercel es del árbol entero.** Cuando la cola se atasca, **un commit
>   trivial nuevo publica todo lo que hubiera pendiente**.
> - **`curl -sI`** devuelve `x-vercel-cache` y `last-modified`. Si ese `last-modified` no se
>   mueve en quince minutos, está atascado: entonces se fuerza. **Forzar más de dos veces no
>   arregla nada.**
> - **El panel de Vercel solo lo puede mirar él**, y hay que decirle exactamente qué mirar.
>
> **Comprobar que está publicado no es comprobar que funciona.** La comprobación de verdad es la
> prueba en navegador de `pruebas/`.
>
> **El conector de Vercel no sirve para esto:** da 403 y 404.
>
> **`vercel.json`** manda `Cache-Control: public, max-age=0, must-revalidate` para todo.
>
> [Las tablas de ficheros del repositorio, de lo que guarda `_GESTOR`, de las columnas de cada
> CSV y de las carpetas que se señalan en cada ordenador, y el resto de la sección 6 y de la
> sección 7 ("Qué falta por hacer"), se mantienen ahora, ya sin fechas, dentro del propio
> `docs/CONTEXTO.md`, que es donde se consultan para programar. No se repiten aquí para no
> duplicar dos veces el mismo contenido casi literal.]

---

## Notas largas de `COLA.md` antes de la poda (12-sep-2026)

Al podar `docs/COLA.md` el 12-sep-2026, las notas de las filas 1 a 8 (todas HECHA) se dejaron en
una línea cada una. El texto largo que tenían antes era:

- **1 · `docs/PLAN-ROBUSTEZ-2026-09.md`**: Ya estaba hecho antes de apuntarse aquí (PR #4,
  fusionada 11-sep-2026 03:50): copias de seguridad y fichero roto, conflictos de Dropbox,
  pruebas automáticas en GitHub Actions, fichas sin carpeta, nombres repetidos y documentación.
  Comprobado de nuevo el 11-sep-2026: ficheros y pruebas en el repo, versión publicada
  `11-sep-2026 · 05:33`.
- **2 · `docs/REGISTRO-EN-UN-PASO.md`**: Ya estaba hecho antes de apuntarse aquí (PR #5, fusionada
  11-sep-2026 05:01): botón Registrar sin nombrar dos veces, casilla "Pendiente de registro" y
  lectura sola del sello de Séneca en el PDF. Comprobado de nuevo el 11-sep-2026.
- **3 · `docs/CAMPOS-POR-TIPO.md`**: Terminada 11-sep-2026 · 11:59. Cada tipo de asunto puede
  llevar sus propios campos (de fichero, calculados o propios), configurables en Ajustes con el
  botón "Campos"; salen ya rellenos al crear el asunto, se pueden marcar obligatorios y añadir al
  nombre en el orden elegido, se guardan con la ficha y se enseñan al editar y en la ficha del
  asunto. `pruebas/campos.mjs`, los ocho escenarios del encargo más la edición, todas en verde.
  Versión publicada `11-sep-2026 · 11:37`; con la corrección de la fila 4, la versión real en la
  web es `11-sep-2026 · 12:00`.
- **4 · `docs/TERCEROS-RELACIONADOS.md`**: Terminada 11-sep-2026 · 11:51. Lista de personas o
  entidades relacionadas con un asunto, en el bloque "Personas y entidades relacionadas" de su
  ficha. Al archivar se deja una nota (nunca una copia de documentos) en la carpeta de cada
  relacionado, diciendo dónde está el asunto de verdad; al reabrir se borra sola, salvo que tenga
  algo más dentro. Pruebas en `pruebas/relacionados.mjs`, todas en verde. La instrucción 3 subió a
  la vez una versión completa de index.html, ficha-asunto.js y asuntos-nuevo.js basada en una
  copia anterior a estos cambios, y los borró sin querer; se detectó por el número de versión y se
  fusionaron ambos cambios en un commit aparte. Versión publicada, ya fusionada y comprobada en la
  web: `11-sep-2026 · 12:00`.
- **5 · `docs/NO-DUPLICAR-ASUNTOS.md`**: Terminada 11-sep-2026 · 13:22. Al pulsar "Crear el
  asunto", si ya hay uno abierto o archivado del mismo tercero, mismo tipo y mismo año académico
  (el grupo y el texto libre no cuentan), se para y sale "Este asunto ya existe": abrir el que
  hay, o crear otro de todas formas. Para los que ya existían antes de esto (o se crearon a
  mano), franja "Parecen el mismo asunto" en Asuntos abiertos, con un botón Unir que junta
  ficheros y notas y borra el que sobra. Pruebas en `pruebas/duplicados.mjs`, los seis escenarios
  del encargo, todas en verde; ajustada también `pruebas/campos.mjs`, que creaba a propósito un
  segundo asunto igual el mismo día para otra cosa. Toda la batería en verde salvo los dos
  escenarios de sello de Séneca de `pruebas/registro.mjs`, que en esta sesión no se han podido
  comprobar por no tener aquí `js/lib/pdf.worker.min.js` (no se ha tocado ese fichero); sin
  relación con este cambio. Versión publicada y comprobada en la web: `11-sep-2026 · 13:08`.
- **6 · `docs/AJUSTES-AGIL.md`**: Terminada 11-sep-2026 · 14:58. Ajustes: una sola categoría a la
  vez en "Tipos de asunto", con pestañas ALUMNADO/PERSONAL/EMPRESAS/OTROS de acuerdo con el
  desplegable, buscador que mira en las cuatro categorías a la vez (con su etiqueta de categoría)
  y aviso en vivo al escribir un nombre nuevo (rojo si ya existe, con "Verlo"; ámbar si solo se
  parece), en tipos, estados y tipos de documento. Los tres pasan a una rejilla de tarjetas con
  menú de tres puntos. Ajustes sube su tope a 1600px. La barra de la izquierda se queda fija en
  pantalla, Ajustes sube a la lista de pestañas (separado por una línea) y, con la barra plegada,
  un icono de rueda dentada lleva directo a Ajustes. Pruebas en `pruebas/ajustes-agil.mjs`, los
  nueve escenarios del encargo, todas en verde; ajustados también dos pasos de
  `pruebas/navegador.mjs` y `pruebas/campos.mjs` que abrían "Cambiar el nombre" o "Campos" con un
  clic directo, ahora a través del menú de tres puntos. Batería completa (`npm test`, 21
  ficheros) en verde, `js/lib/pdf.worker.min.js` incluido. Versión publicada `11-sep-2026 ·
  14:58`.
- **7 · `docs/PAPELERA.md`**: Terminada 11-sep-2026 · 16:20. Nada se borra de verdad a la primera:
  se manda a `_GESTOR/PAPELERA`, con su ficha en `_GESTOR/papelera.json`. Botón Borrar (rojo
  suave, siempre el último de su fila) en: documentos de un asunto (ficha y "Gestionar
  documentos"), documentos sueltos, un asunto abierto desde su ficha (nunca desde la tarjeta ni
  en el ARCHIVO), tipos de asunto, estados, tipos de documento, campos propios y personas o
  empresas dadas de alta a mano. Los que ya tenían un "Quitar" (tipos, estados, tipos de
  documento, campos propios en Ajustes; la nota del tablón) ahora pasan por la papelera en vez de
  duplicar el botón, y llevan la comprobación que les faltaba: un tipo o un estado en uso, o un
  campo propio asociado a algún tipo, ya no se pueden borrar (antes sí, sin avisar bien). Bloque
  nuevo **Papelera** al final de Ajustes, con Devolver a su sitio y Borrar del todo (esta última
  con su aviso de que es definitivo); si algo lleva más de 30 días, aviso ámbar para vaciar de
  golpe lo viejo. La papelera nunca se vacía sola. Vive en `js/papelera.js`; se expone además
  `Carpetas.trasladar` (ya existía por dentro, pero no se podía llamar desde fuera) y
  `Datos.quitarDeLista`, que hacían falta para esto. Pruebas en `pruebas/papelera.mjs`, los once
  escenarios del encargo, todas en verde. Batería completa (`npm test`, 23 ficheros) en verde
  salvo los dos escenarios de sello de Séneca de `pruebas/registro.mjs`, que en esta sesión
  tampoco se han podido comprobar por no tener aquí `js/lib/pdf.worker.min.js` (pesa más de 1 MB
  y esta sesión no ha podido bajarlo; no se ha tocado ese fichero, sin relación con este cambio,
  mismo aviso que dejó la fila 5). Versión publicada `11-sep-2026 · 16:20`.
- **8 · `docs/UNIR-VER-DENTRO.md`**: Terminada 11-sep-2026 · 17:15. Quitada la franja amarilla
  "Parecen el mismo asunto" de encima de la lista de Asuntos abiertos. En su lugar, un aviso de
  una línea junto a Actualizar (`⚠ N posible(s) duplicado(s) — Revisar`, oculto si no hay
  ninguno) que lleva a una pantalla propia **Duplicados** (fuera de la barra de la izquierda, con
  su botón Volver): cada grupo en columnas, una por asunto, con el nombre como enlace a su ficha,
  sus datos (fecha, estado, vía, plazo), sus documentos (abren en el visor lateral de siempre) y
  sus notas (las tres últimas, con "y N más"). El botón Unir sigue igual. Botón nuevo "No son el
  mismo" que descarta el grupo por la firma de sus nombres, en `_GESTOR/no-duplicados.json`; si
  el grupo cambia de miembros (por ejemplo, un tercer asunto que encaja), la firma ya no coincide
  y vuelve a avisar solo. Reversible desde Ajustes, bloque nuevo "Duplicados descartados" con
  "Volver a avisar". Todo en `js/unir-asuntos.js` y `css/unir-asuntos.css`, sin tocar
  `js/ajustes.js` ni la barra. Pruebas en `pruebas/duplicados.mjs` ampliada con los seis
  escenarios nuevos del encargo (30 en total), todas en verde, comprobado también en rojo antes
  del arreglo. Batería completa (`npm test`, 19 ficheros) en verde salvo los dos escenarios de
  sello de Séneca de `pruebas/registro.mjs`, que en esta sesión tampoco se han podido comprobar
  por no tener aquí `js/lib/pdf.worker.min.js`; no se ha tocado ese fichero, sin relación con
  este cambio, mismo aviso que dejaron las filas 5 y 7.
- **10 · `docs/ARREGLOS-USO-2026-09-14.md`**: Terminada 14-sep-2026 · 16:36. Cuatro arreglos
  pequeños, acordados con Francisco por lo que le pasó a su compañero (se quedó atrapado en una
  pantalla y tuvo que cerrar el navegador). El **3** (borrar un documento en Por clasificar) ya
  estaba hecho desde la papelera (fila 7, `js/papelera.js`, `envolverSueltos`): solo se ha
  comprobado. Los otros tres:
  - **1 · Que de toda pantalla se pueda salir.** El Escape general de `js/usabilidad.js` no hacía
    nada fuera del cuadro (`#capa`), un buscador o el lector de correos: en la ficha de un
    asunto, en la pantalla Duplicados o en Ajustes/Archivo/Personas con historial, no pasaba
    nada. Ahora, sin cuadro ni panel abierto, Escape hace lo mismo que el botón de salida de la
    pantalla que se ve; en Nuevo asunto equivale a Cancelar, preguntando antes si hay algo
    escrito. El visor de un documento (`js/visor.js`) no tenía Escape (solo el aspa): ahora
    también se cierra con Escape, desde el mismo sitio, sin tocar `js/visor.js`. Dos cuadros
    pequeños que ya ponían su propio Escape (el tipo de documento nuevo de `js/documentos.js`, el
    menú de tres puntos de `js/ajustes.js`) se han tocado para que corten la propagación: si no,
    el Escape general de aquí se disparaba también por detrás y cerraba de más (por ejemplo, todo
    el cuadro de "Gestionar documentos" al salir solo del recuadro de crear un tipo).
  - **2 · Copiar el nombre en orden normal.** Cada relacionado de la ficha del asunto lleva ahora
    un botón "Copiar" (`js/relacionados.js`, `Relacionados.nombreEnOrdenNormal`) con el nombre
    como se escribe a mano: de alumnado y personal quita el código final y da la vuelta a
    "Apellidos, Nombre"; en empresas copia la razón social tal cual. No toca cómo se guarda el
    nombre ni cómo se nombran las carpetas.
  - **4 · Carpetas temporales de Drive/Dropbox.** `App.verAbiertos` (`js/asuntos-lista.js`) solo
    descartaba las carpetas que empiezan por `_`: una carpeta temporal de sincronización
    (`.tmp.driveupload`, `.dropbox`, `desktop.ini`...) se colaba como si fuera un asunto abierto
    más. `Carpetas.esCarpetaTemporalDeSincronizacion` (`js/carpetas.js`), en un solo sitio,
    descarta las que empiezan por `.` o `~` y las de siempre (`desktop.ini`, `Icon\r`, un nombre
    con "conflicted copy"); si la carpeta ya tiene ficha en `asuntos.json`, se respeta igual,
    aunque el nombre sea raro.
  Cambios quirúrgicos, sin tocar la arquitectura. Batería completa (`npm test`, 19 ficheros) en
  verde, con `js/lib/pdf.worker.min.js` esta vez sí presente. Subido a `main`, versión
  `14-sep-2026 · 16:36`; **esta sesión no ha podido comprobarlo con `curl` contra la web
  publicada** (la red de esta sesión concreta no llega a `gestor-de-asuntos.vercel.app`: la
  bloquea la política de salida de este contenedor, no algo del código). Queda pendiente de
  confirmar en el navegador la próxima vez que se entre.
- **12 · `docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md`**: Terminada 16-sep-2026 · 20:40. Botón "Meter en
  un asunto" en cada tarjeta de Por clasificar, para mandar un documento suelto a un asunto que
  ya existe en vez de crear uno nuevo. La fila 11 de la cola (`docs/CORREOS-AL-ASUNTO.md`) seguía
  **EN CURSO** de otra sesión al empezar esta (regla 6 de `docs/COLA.md`: se saltó y se cogió la
  siguiente PENDIENTE), así que el elegidor de asuntos nace en su propio módulo,
  `js/elegir-asunto.js` (`window.ElegirAsunto`), pensado para que la bandeja de correos lo
  reutilice cuando esa fila se retome, en vez de duplicar el buscador y la puntuación. El cuadro
  enseña "Podrían encajar" (como mucho cinco, más de 40 puntos) y la lista completa con buscador,
  abiertos primero y archivados con su etiqueta. La puntuación de un documento suelto (en
  `js/documentos-sueltos.js`) sale de las palabras del nombre del fichero, del nombre del
  tercero, de si el asunto está abierto y de si se movió hace menos de 30 días. Al elegir un
  asunto archivado, ofrece reabrirlo (con `App.reabrirAsunto`, que pide su propia confirmación) o
  meterlo sin reabrir. Nada se pierde: nombre repetido en el destino o un traslado a medias dejan
  el documento donde estaba, con aviso. Pruebas nuevas en `pruebas/documentos-sueltos.mjs` (seis
  escenarios del encargo). De paso se arregló `pruebas/logica.mjs`: la fecha de cese del personal
  estaba escrita a mano (`15/09/2026` y `06/09/2026`) y se quedó desfasada al llegar esa fecha,
  igual que ya le pasó una vez a la edad (ver el comentario de "la edad" en ese mismo fichero);
  ahora sale de `fechaHace(0, …)`, relativa a hoy (este arreglo de `pruebas/logica.mjs` sí se ha
  conservado). Batería completa en verde (`npm test`, 20 ficheros) en esa rama.

  **Corrección, al fusionar**: mientras esta sesión trabajaba en su rama, otra sesión en paralelo
  hizo también la fila 12 directamente en `main`, sin verse la una a la otra, y con mejor diseño:
  un solo `js/elegir-asunto.js` compartido desde el principio con la bandeja de correos
  (`js/bandeja-enlace.js`), en vez de dos elegidores por separado. Al fusionar esta rama, todo lo
  descrito arriba sobre `js/elegir-asunto.js` y `js/documentos-sueltos.js` (el propio y el de la
  bandeja) se ha descartado a favor de lo que ya había en `main`; `pruebas/documentos-sueltos.mjs`
  también se ha sustituido por la versión de la otra sesión. Lo único de esta entrada que ha
  sobrevivido es el arreglo de las fechas de `pruebas/logica.mjs`.
- **13 · `docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md`**: Terminada 16-sep-2026 · 20:57, en la misma
  sesión y el mismo pull request que la fila 12. Gmail no deja que una página web adjunte
  ficheros, así que la salida sigue siendo la carpeta `GESTOR-BANDEJA`: bloque nuevo "Documentos
  de este asunto" en el cuadro de Correo (`js/correo-adjuntos.js`, solo ahí, nunca en el de
  Séneca), con una casilla por documento (desmarcadas de partida) y un límite de 20 MB. Al
  preparar, se copian los marcados a la bandeja con el nombre `<id> - <original>` y, el último,
  el encargo `<id>.envio.json` (con el hilo del asunto si `hilos` ya existe, de la fila 11; si no,
  cadena vacía y sale como correo nuevo, tal como preveía el propio encargo). Se apunta en
  `_GESTOR/envios.json` (una lista, no un objeto) para que la tarjeta "Borrador en camino" se vea
  aunque se cierre el cuadro; esa tarjeta y su vigilancia (cada 15 segundos, solo mientras haya
  algún encargo vivo) viven en `js/bandeja-correos.js`, que también deja de leer los
  `.envio.json`/`.listo.json`/`.error.json` como si fueran correos recogidos. El script de Apps
  Script (`mandarBorradores()`, en `apps-script/gestor-correos.gs`) monta el borrador con
  `GmailApp.createDraft` o, si hay hilo, `createDraftReply`, siempre como borrador, nunca lo
  envía; el disparador pasa de cinco minutos a uno. Pruebas nuevas en `pruebas/envios.mjs` (los
  seis escenarios del encargo), batería completa en verde.
- **14 · `docs/PLANTILLAS-DE-CORREO.md`**: Terminada 16-sep-2026 · 21:12, en la misma sesión y el
  mismo pull request que las filas 12 y 13. Una plantilla es solo el cuerpo del medio: el saludo
  y la firma los sigue poniendo `js/correo.js`, solo. Se crean en Ajustes pegadas a un tipo de
  asunto y se guardan en `_GESTOR/plantillas.json` (`js/plantillas.js`, `window.Plantillas`),
  compartido con el compañero; también saca de ahí la firma y el nombre del centro, que hasta hoy
  estaban escritos a mano en `js/correo.js`. Los huecos entre llaves (`{nombre}`, `{grupo}`,
  `{curso}`, `{tipo}`, `{hoy}`, `{limite}`, `{usuario}`, `{centro}`, y `{campo:LO QUE SEA}` para
  un campo propio del tipo) se comparan sin mayúsculas ni acentos y nunca rompen nada: uno sin
  dato se deja vacío y se avisa ("Faltan datos: …"), uno que no se reconoce se deja tal cual y
  también avisa. El desplegable "Plantilla" sale en los dos cuadros (correo y Séneca), dentro de
  su propio `#correo-comunes` para poder repintarse sin tocar el resto del cuadro; cambiar de
  plantilla con algo escrito a mano pregunta antes, **en línea, dentro del propio cuadro**
  (`#correo-plantilla-confirmar`), nunca con un segundo `U.preguntar`, porque solo hay un cuadro
  de diálogo en toda la aplicación y ya está ocupado por el de Correo. En Séneca, copiar el texto
  lo recorta a 4.000 letras si hace falta. El bloque de Ajustes vive entero en `js/plantillas.js`
  (no ha hecho falta tocar `js/ajustes.js`): lista con buscador, alta y edición con botones para
  insertar cada hueco y una vista previa en vivo, y un bloque aparte para la firma y el centro. El
  borrado pasa por `Papelera.mandarDato`, pero `js/papelera.js` no sabe devolver la clase
  `'plantilla'` (no estaba en el encargo): queda anotado en "Qué falta por hacer". Pruebas nuevas
  en `pruebas/plantillas.mjs` (los siete escenarios del encargo), más una comprobación manual del
  alta/edición/borrado en Ajustes (no pedida por las pruebas del encargo, pero es la parte que usa
  Francisco a diario). Batería completa en verde (`npm test`, 22 ficheros). Con esta fila, la cola
  se queda sin ninguna PENDIENTE: solo la fila 11 sigue EN CURSO, de otra sesión.
- **36 · `docs/FILAS-QUE-NO-SE-ESTRUJAN.md`**: Terminada 17-sep-2026 · 19:20, a partir de una
  captura de Francisco: con el panel de la derecha abierto, el nombre de un documento se quedaba
  a un carácter por renglón, porque `.ficha-documento-fila` no envolvía (`display:flex` sin
  `flex-wrap`) y el nombre era el único que cedía. `css/filas.css` nuevo, enlazado el último de
  todos en `index.html`: regla general de fila (texto con ancho mínimo, botones que bajan de línea
  en vez de estrujarlo) aplicada a `.ficha-documento-fila`, `.relacionado-fila`, `.hito-linea` y
  `.fila-tipo`; `.rejilla-tipos` y `#lista-personas` ya envolvían bien, sin tocar. `U.menuDeAcciones`
  nueva en `js/util.js`: menú de tres puntos compartido, con los botones que recibe siempre en el
  DOM (ocultos con `.oculto`) para que `aplicarModoConsulta` los alcance igual que a los demás, sin
  ningún caso especial. En `js/ficha-documentos.js` solo quedan a la vista el nombre y "Registrar";
  Copiar (que sigue añadiéndolo `js/copiar.js`, por envoltura, buscando el `.fila-menu` ya montado),
  Separar, Unir, Sacar páginas y Borrar van al menú. En `js/documentos-sueltos.js` quedan a la vista
  "Crear asunto con él" y "Meter en un asunto"; Abrir, Separar, Unir, Sacar páginas y Borrar (que
  sigue añadiéndolo `js/papelera.js`) van al menú — `App.accionesDeSuelto` (fila 25) ahora busca
  "Abrir" por su texto en cualquier profundidad. La barra azul (`js/barra.js`) se pliega sola al
  aparecer `con-visor`/`con-lector` en `<body>` (un `MutationObserver`, sin tocar `localStorage`) y
  vuelve a como estaba al desaparecer las dos; y pierde el tope de 1360px que tenía en
  `css/barra.css` con la barra plegada, que dejaba franjas vacías en el monitor ancho del trabajo.
  Prueba nueva `pruebas/filas-estrechas.mjs`, en navegador de verdad (comprobado que la 1 falla sin
  `css/filas.css`: sin él, `flex-wrap` computado sale `nowrap` y el ancho mínimo del nombre, `0px`).
  Media docena de pruebas ya existentes (`documentos-sueltos.mjs`, `documento-a-la-vista.mjs`,
  `papelera.mjs`, `separar-unir-navegador.mjs`) daban por hecho que Abrir/Separar/Unir/Sacar
  páginas/Borrar/Copiar estaban siempre a la vista: se han ajustado para abrir el menú antes de
  pulsarlos (o de comprobar que están, con `getByRole`, que no ve dentro de un `display:none`).
  Batería completa en verde.
- **48 · `docs/NO-GASTAR-PUBLICACIONES.md`**: Terminada 17-sep-2026 · 19:24. Llegó fuera de orden
  directa a `main` (commit `7757e33`), pidiendo ser la fila 44 (ya ocupada) y la primera de la
  cola; esta sesión ya había terminado la fila 36 al verla, así que la cogió justo después. El
  cupo del plan gratuito de Vercel (100 publicaciones al día) se agotó el 17-sep-2026 con `main`
  recibiendo exactamente 100 commits ese día, más de la mitad sin tocar nada que se vea en la web
  (`docs/COLA.md` y compañía), más cada push a una rama `claude/...` con pull request abierto
  gastando su propia vista previa. `vercel.json` gana `ignoreCommand`, con la receta exacta del
  encargo: se salta la publicación cuando la rama no es `main`, o cuando el cambio solo toca
  `docs/`, `pruebas/`, `.github/` o ficheros `.md`, comparando contra `VERCEL_GIT_PREVIOUS_SHA`
  (el commit de la última publicación buena; `HEAD^` sirve de respaldo solo la primera vez, antes
  de que esa variable exista) para que un push con el código en un commit y los documentos en
  otro no se salte la publicación del código. Ante cualquier duda, publica. **Trampa encontrada
  al publicar de verdad, no estaba en el encargo**: Vercel exige `ignoreCommand` en 256
  caracteres o menos, y la receta tal cual pasaba de 296; el primer intento de esta fila lo
  publicó igual (el PR de la fila 36, #28, avisó del error `ignoreCommand should NOT be longer
  than 256 characters`). Arreglado sacando la receta entera a `scripts/vercel-ignore-build.sh`
  (nuevo, con permiso de ejecución) y dejando `ignoreCommand` como un simple `bash
  scripts/vercel-ignore-build.sh` (35 caracteres). Entra también la regla 13 de `docs/COLA.md`:
  como mucho dos subidas por fila. Prueba nueva `pruebas/vercel-ignore-command.mjs`, sin
  navegador (lee `vercel.json` y `scripts/vercel-ignore-build.sh`, y comprueba que
  `ignoreCommand` existe, no pasa de 256 caracteres y llama al script, que el script menciona
  `main` y `VERCEL_GIT_PREVIOUS_SHA`, y que el bloque `headers` de siempre sigue igual);
  comprobado también a mano contra el propio historial de git de este repositorio: un commit que
  solo toca `docs/` se salta, uno que toca `js/`/`css/` publica.
  **No se ha podido comprobar en Vercel de verdad** (el punto 4 del encargo pedía ver un
  despliegue saltado y uno publicado de verdad): el cupo agotado ese mismo día, mientras se
  trabajaba esta fila, solo se recupera pasadas 24 horas — de hecho, el PR de la fila 36 (#28)
  dio ahí mismo el aviso de Vercel `Resource is limited - try again in 24 hours`, confirmando el
  problema que esta fila arregla. Queda para la próxima vez que se toque el límite: apuntar aquí
  si las publicaciones saltadas también cuentan para el cupo de 100 (el propio encargo dice que
  no está documentado). No se ha tocado `git.deploymentEnabled` ni ningún *deploy hook*: esa es
  la salida si la regla 13 no bastara, y no hacía falta todavía.
- **49 · `docs/ADJUNTOS-DE-CORREO-POR-DENTRO.md`**: Terminada 18-sep-2026 · 03:27. La bandeja de
  correos (fila 27) proponía tercero y tipo mirando solo el texto del correo; el dato bueno —DNI,
  registro de Séneca, fecha del documento, la palabra que marca el tipo— suele estar dentro del
  PDF adjunto, no en las dos líneas del mensaje. Ahora la bandeja lee también esos adjuntos y
  **completa** la propuesta sin pisarla: manda siempre lo que ya haya adivinado el correo
  (`Bandeja.proponer`, sin tocar), el PDF solo rellena el tercero o el tipo cuando el correo no
  los encuentra, y aporta el registro y la fecha del documento, que el correo nunca trae. Hermana
  de la fila 41 (`LEER-DOCUMENTOS-POR-CLASIFICAR.md`): reutiliza `LectorDocumentos.analizar` tal
  cual, sin escribir otro lector.
  - `js/contexto-documentos.js` (nuevo): `ContextoDocumentos.delCentro()`, las tres listas de
    terceros y los tipos, sacada de `js/documentos-sueltos-lector.js` (que ahora la llama en vez
    de montarlas por su cuenta) para que la use también el módulo de esta fila, sin duplicar
    `Datos.cargar`/`window.Dni`.
  - `js/bandeja-adjuntos-lector.js` (nuevo): la cola de uno en uno (nunca en paralelo), la caché
    por identificador de correo, la lectura de como mucho 3 adjuntos PDF por correo (nunca `pdf`
    ni `pdfMensaje`) a 5 páginas cada uno, la mezcla del punto 2 del encargo, y la línea "Del
    documento: …" en la tarjeta. El gancho en `js/bandeja-pantalla.js` es mínimo, dentro de
    `tarjeta(item)` (no está exportada): solo se lee con la barra desplegada.
  - **Trampa encontrada al probar, no estaba prevista**: `js/bandeja-pantalla.js` rehace la
    bandeja entera con `c.innerHTML = ''` en cada `pintar()`, así que la línea recién creada de
    una tarjeta puede no estar todavía enganchada al documento cuando le toca aplicarle un
    resultado ya en caché; buscarla con `document.querySelectorAll` en ese instante no la
    encuentra, y se queda con el hueco vacío puesto (oculto por CSS, pero seguía contando como
    una fila más: así falló primero `pruebas/bandeja-adjuntos.mjs`, casos 2, 4 y 7). Arreglado
    aplicando el resultado en caché directamente sobre el elemento recién creado que ya se tiene
    en la mano, y dejando la búsqueda por `document.querySelectorAll` solo para cuando termina de
    leerse de verdad (para entonces la tarjeta ya lleva un rato montada del todo).
  - Completar la pantalla de "Nuevo asunto" (`window.Bandeja.llevarANuevo`, envuelta como
    propiedad del objeto, sin tocar `js/bandeja-correos.js`) solo cuando el correo no dejó tercero
    **ni** tipo puestos: `App.elegirTipo`/`App.elegirCategoria` reinician lo que venga detrás en
    su propio orden, así que completar solo uno de los dos cuando el correo ya dejó el otro
    puesto lo borraría. En ese caso el dato del PDF se queda solo en la línea de la tarjeta.
  - Prueba nueva `pruebas/bandeja-adjuntos.mjs`, en navegador de verdad con un PDF real montado a
    mano (mismo `pdfConTexto` que `pruebas/dar-de-alta-desde-documento.mjs`, copiado sin atar los
    dos ficheros entre sí): los 7 casos del encargo, más "Descartar" sin romper nada.
  - **Aviso, sin tocar en esta fila**: al entrar en este trabajo, `node_modules` no estaba
    instalado en la sesión (`npm test` fallaba con `Cannot find package 'playwright'`) y el
    Chromium empaquetado por Playwright no coincidía con el de `/opt/pw-browsers` (`npm install`
    trae la versión 1194, y hacía falta pasar `CHROMIUM_PATH=/opt/pw-browsers/chromium` a `npm
    test`, como ya preveían los propios ficheros de prueba). Y `pruebas/notas-asunto-no-se-borran.mjs`
    sigue en rojo en este contenedor concreto (un clic sobre `.hito-nota-texto` que llega justo
    cuando el panel de hitos se repinta, "element is not visible" tras varios reintentos): falla
    igual en el commit de partida de esta sesión (`bb53ee9`, antes de tocar nada de la fila 49),
    así que no es de esta fila. Queda apuntado por si se repite en otra sesión.
- **50 · `docs/CABECERA-NO-TIEMBLA.md`**: Terminada 18-sep-2026 · 04:06. Arregla un defecto de la
  fila 46: en una pantalla cuyo contenido apenas pasa del alto de la ventana, al cruzar el umbral
  de encoger la cabecera perdía alto de golpe, el navegador recortaba `window.scrollY` al nuevo
  máximo, ese valor caía por debajo del umbral de despliegue, la cabecera se desplegaba, la página
  volvía a crecer, y el gesto empujaba otra vez por encima del umbral de encoger: temblor. Tres
  arreglos en `js/cabecera-fija.js`: (1) de fondo, se guarda por pantalla el alto del documento con
  la cabecera desplegada y, si esa pantalla es corta (menos que el alto de la ventana + 400px), se
  le devuelve a `main.contenido` el alto perdido con la variable `--cabecera-compensa`
  (`css/cabecera-fija.css`); (2) los umbrales de la histéresis se separan más, de 80/40 a 120/24;
  (3) un candado de 400 ms entre un cambio y el contrario.
  - **Dos trampas encontradas al escribir las pruebas nuevas, no estaban previstas**: la primera,
    el candado se armaba también en la realineación que hace una pantalla nueva con el scroll que
    ya hubiera (p.ej. al cambiar de "Asuntos abiertos" a "Ajustes" estando bajado, Ajustes nace ya
    encogida para no dar un salto), y ese armado bloqueaba luego el primer scroll de verdad del
    usuario en la pantalla nueva; arreglado sin armar el candado en ese caso (la pantalla nueva
    "se alinea", no "cambia"). La segunda, la misma idea pero al cambiar el tamaño de la ventana:
    redimensionarla puede mover `window.scrollY` por su cuenta —el "scroll anchoring" de Chrome,
    para que la vista no salte cuando la rejilla de Ajustes cambia de alto al reflotar con menos
    columnas—, y ese movimiento tampoco lo ha pedido nadie; `aplicar()` gana un parámetro
    `realineacion` que también evita armar el candado ahí. Las dos se encontraron con la prueba
    nueva de "cambiar el tamaño de la ventana" (la ya existente de Ajustes, fila 46), que se ponía
    en rojo con el candado recién puesto: sin esas pruebas end-to-end, ninguna de las dos trampas
    se habría visto escribiendo solo la lógica.
  - Prueba: `pruebas/cabecera-fija.mjs` gana dos casos (en una pantalla corta —calculada al vuelo,
    recortando la ventana a 200px más que el alto real del contenido, no a un tamaño de pantalla
    fijo— cruzar el umbral no deja el estado temblando; el candado, manejado a mano con
    `window.CabeceraFija.evaluar()`, bloquea el cambio contrario y lo deja pasar pasados los 400
    ms) y ajusta los umbrales de las pruebas ya existentes (80/40 → 120/24, con las mismas
    comprobaciones).
  - **Aviso posterior**: esa misma prueba del candado salió flaky en CI (GitHub Actions), aunque
    en local pasaba siempre: los dos `pagina.evaluate()` seguidos que hacían el cambio y el
    contrario dejaban demasiado tiempo real entre uno y otro en una máquina más cargada,
    acercándose a los 400 ms del propio candado y dejando pasar el cambio que debía bloquearse.
    Arreglado metiendo los dos cambios dentro de un mismo `evaluate()`, sin ningún `await` de por
    medio (microsegundos de verdad, no el viaje de ida y vuelta al navegador).
- **51 · `docs/FICHA-DISPOSICION.md`**: Terminada 18-sep-2026 · 04:30. Cambio de disposición de la
  ficha de un asunto, ningún funcionamiento distinto: "Datos del asunto" repetía la cabecera y
  "Datos y contacto", las Notas quedaban fuera de la pantalla, y sobraba medio panel en el monitor
  ancho. Regla nueva: arriba a la izquierda lo que hay que hacer (Hitos), arriba a la derecha lo
  que hay que saber (Datos y contacto primero), lo que casi nunca se mira, plegado con su número.
  - Cabecera con una línea gris nueva (`.ficha-subtitulo`) con lo suelto que no se repite en
    ningún otro sitio; se esconde con la cabecera encogida.
  - Rejilla de tres tramos (`css/ficha-asunto.css`, `@media (min-width: …)`, al revés que el resto
    del fichero): Hitos, Documentos (columna nueva, `.ficha-centro`) y Datos y contacto/Notas/lo
    plegado/Datos del trámite. Una columna por debajo de 1000px, dos de 1000 a 1499 (el centro
    debajo de la izquierda), tres desde 1500px. Con el visor o el lector abiertos, una columna con
    `grid-column/row: auto` en los tres tramos (si no, un tramo pedía una columna o una fila que ya
    no existía, y el sitio salía mal).
  - "Datos del asunto" pasa a llamarse "Datos del trámite" y se recorta a lo que no se ve en
    ningún otro lado (campos propios, Vía, Lo pide, En el archivo); sin ninguna fila, el bloque no
    se pinta en absoluto (antes decía "Nada que enseñar aquí.").
  - `js/ficha-plegables.js` (nuevo, pequeño a propósito): "Otros asuntos de este tercero" y
    "Personas y entidades relacionadas" pasan a `<details class="ficha-bloque ficha-plegable">`
    (el molde ya estaba en el CSS desde antes, sin que nadie lo usara), cerrados de partida, con
    su cuenta en el resumen ("1 asunto"/"ninguno todavía", "2 personas"/"nadie todavía") aunque
    sigan cerrados, y sobreviven a que `pintarLaFicha()` rehaga el `innerHTML` entero (mismo
    patrón que `volverADesplegar` de `js/hitos-panel.js`).
  - Un bloque vacío (hoy solo Documentos, sin ningún fichero) ocupa una línea, no una tarjeta
    (`.ficha-bloque.vacio`).
  - Prueba nueva `pruebas/ficha-disposicion.mjs`, en navegador de verdad, con los 8 escenarios del
    encargo. **Trampa encontrada al escribirla**: los estados de prueba tienen que ser de la lista
    por defecto de verdad (`ESTADOS_POR_DEFECTO` en `js/nombres.js`) — un nombre inventado para la
    situación inicial ("EN EL DEPARTAMENTO" no es uno de ellos) solo se enseña como opción del
    desplegable mientras sea el valor actual; en cuanto se cambia a otro estado, desaparece de la
    lista y ya no se puede volver a él desde el propio desplegable.
  - **Regresión encontrada tras fusionar la fila**: `pruebas/notas-asunto-no-se-borran.mjs` seguía
    comprobando el reparto de columnas de la fila 37, que esta fila cambió a propósito
    (Documentos pasa a su propio tramo central; Notas va antes que los plegables, no después). No
    era el fallo "de siempre" de ese fichero (uno de foco al desplegar un hito, ya conocido y
    documentado en la fila 49): era un cambio real sin actualizar. Corregido en un commit aparte
    sobre la misma PR (#39), antes de fusionarla.
- **52 · `docs/CABECERA-DEL-ASUNTO.md`**: Terminada 18-sep-2026 · 05:51. Los doce botones de la
  cabecera de un asunto (todos con el mismo peso, en dos filas) pasan a cinco, agrupados por el
  momento del trámite en vez de por el orden en que se fueron añadiendo. Ningún funcionamiento
  distinto: solo dónde vive cada acción y con quién va agrupada.
  - `#ficha-acciones` queda en `[estado] · [vencimiento] · El encargo · Comunicar ·
    Archivar/Reabrir`, con `.boton-principal` pegado al borde derecho (`margin-left: auto`).
  - El desplegable de estado toma el color de fondo/texto de `App.colorEstado(situacion)`
    (`estado-0`…`estado-5`), sin CSS nuevo: `.estado-N` y `.campo` tienen la misma especificidad
    de una clase, y `.estado-N` va después en `css/estilos.css`, así que gana.
  - `Plazos.etiquetaVencimiento(limite)` (nueva, `js/plazos.js`), aparte de `Plazos.de` (que
    sigue igual para avisos/"Qué me toca"/la tarjeta de la lista, con su propio significado de
    "vencido" que incluye "vence hoy"): "Vence el D-mmm · quedan N días" / "Vence hoy" / "Venció
    hace N días" / "Sin plazo", con un umbral de ámbar propio (2 días, no los 7 de `DIAS_CERCA`).
    Sustituye al botón "Plazo" y a `.marca-plazo`, quitada de la cabecera.
  - **"El encargo"**: un solo botón que abre "Lo pide" de siempre (`abrirLoPide`,
    `js/ficha-asunto.js`) con la vía de comunicación (`a.ficha.via`/`viaDato`, antes su propio
    botón vía `App.editarVia`) dentro, como un campo más. `LoPide.controles` gana un 4º parámetro
    `viaInicial` y devuelve además `leerVia()` (siempre `{via, dato}`, nunca `null`, a diferencia
    de `leer()`): las dos preguntas se guardan en un solo `App.anotar`, pero no dependen la una de
    la otra. Ninguna clave cambia de sitio en `asuntos.json`. `App.editarVia` no se toca (sigue
    usándolo la tarjeta de la lista); `js/via-contacto.js` envuelve también `LoPide.controles`
    para poner ahí las mismas sugerencias de teléfono/correo. Resumen de una línea debajo del
    botón (`relación · por vía`) cuando hay algo que enseñar.
  - **"Comunicar"**: `js/correo.js` deja de montar "Correo" y "Mensaje Séneca" sueltos y monta un
    botón con un menú de dos opciones (`FichaMenus.montar`), insertado con `insertBefore` antes de
    `.boton-principal` (no `appendChild`: si no, podía acabar después de "Archivar" según el orden
    de llegada de los `MutationObserver`).
  - **El menú de tres puntos del nombre** (`js/ficha-nombre-acciones.js`, nuevo): Editar, Copiar
    el nombre del asunto, y (con papelera) Borrar en rojo — las dos últimas cosas solo si el
    asunto está abierto. El icono de copiar el número del tercero (`js/copiar.js`) se muda de la
    barra al propio `<h2>`. "Documentos ▾" (antes "Gestionar documentos") se muda a la cabecera
    del bloque de documentos (`js/ficha-documentos.js`), también con la carpeta vacía.
  - **`js/ficha-menus.js`** (nuevo): el menú pequeño reutilizable (abrir, cerrar con Escape/al
    pulsar fuera, uno solo a la vez) de los tres puntos y "Comunicar". **Trampa real**: sin
    `ev.stopPropagation()` en el manejador de Escape (en captura), cerrar el menú con esa tecla se
    llevaba por delante la ficha entera, porque `js/usabilidad.js` también escucha Escape sobre
    todo el documento y, sin ningún `#capa` abierto, pulsa `#ficha-volver` — mismo cuidado que ya
    tomaba `js/huecos-buscador.js` por el mismo motivo. Se depuró con un script aparte que abría
    la ficha, pulsaba los tres puntos y miraba `getBoundingClientRect()` del icono de copiar
    (salía con todo en cero: el nodo real seguía existiendo pero la pantalla ya era la lista de
    abiertos, prueba de que se había navegado fuera).
  - El nombre pasa a `<h2 class="ficha-nombre"><span class="ficha-nombre-texto">…</span></h2>`:
    solo ese `<span>` lleva la elipsis con la cabecera encogida, nunca el `<h2>` entero, para que
    el icono de copiar y los tres puntos (hermanos del `<span>`) no se recorten con un nombre
    largo.
  - `esControlDeSoloLectura` gana el disparador de los tres puntos (para que el menú se pueda
    abrir en modo consulta) y el texto nuevo `'Copiar el nombre del asunto'`.
  - Prueba nueva `pruebas/cabecera-del-asunto.mjs`, en navegador de verdad, con los 11 escenarios
    del encargo. **Trampa de la prueba**: los cuadros de Correo, Séneca y Documentos abren con
    `sinCancelar` (el botón de aceptar queda como "Cerrar"); en una pantalla corta ese botón podía
    quedar fuera de la parte visible del cuadro y el `click` de Playwright no lo alcanzaba —se
    cierran con la tecla Escape en la prueba, que además comprueba de paso que no rompe nada.
  - **Regresión encontrada al pasar la batería completa**: trece ficheros de prueba interactuaban
    directamente con los botones viejos ("Editar", "Correo", "Mensaje Séneca", "Gestionar
    documentos", "Borrar" en la ficha) o comprobaban `.ficha-marcas .marca-estado`/`.ficha-nombre`
    entero como texto plano. Se corrigieron todos para pasar por el menú de tres puntos, por
    "Comunicar", por "Documentos ▾", por el valor del propio `<select>` o por
    `.ficha-nombre-texto` en vez del `<h2>` completo (que ahora también lleva el icono y el
    menú).

## 19-sep-2026 — Fila 61: guardar sin pisar al compañero

Arreglo del fallo grave 1 del informe crítico (`docs/INFORME-CRITICO-2026-09-18.md`, 2.2):
`js/papelera.js` tenía los dos únicos sitios que escribían `asuntos.json` entero sin releerlo
antes: `mandarAsunto` (borrar un asunto abierto) y `devolverAsunto` (sacarlo de la papelera). Con
la copia en memoria de este ordenador desactualizada durante horas (la pantalla de abiertos nunca
la refresca sola), borrar o devolver un asunto podía escribir encima de notas, estados o plazos
que el compañero hubiera guardado desde el otro ordenador, sin aviso ni error.

**El arreglo**: `App.guardarRegistroFresco(cambiar)`, nueva en `js/nucleo.js`, junto a `App.anotar`
(que ahora se apoya en ella). Relee `asuntos.json` del disco, deja que `cambiar(registro)` mute lo
que haga falta sobre esa copia recién leída, guarda con `Copias.guardar` y repinta con
`App.refrescarFichas()`. Es el mismo patrón que ya usaba `Hitos.cambiar` en `js/hitos.js`.

`mandarAsunto` y `devolverAsunto` pasan ahora por ahí, con la relectura pegada al momento de
escribir (después de mover la carpeta, no al principio de la función, porque el traslado puede
tardar segundos). `mandarAsunto` tenía además una segunda trampa: guardaba en la papelera la ficha
vieja que traía el objeto `a` en vez de releer la fresca de `App.E.registro` — con eso, al devolver
el asunto se habría perdido lo mismo por el otro lado. Se corrigió cogiendo la ficha de la copia
recién releída antes de archivarla.

Los otros ocho sitios que escriben el registro entero (`js/unir-asuntos.js`,
`js/fichas-huerfanas.js` ×2, `js/ajustes-centro.js`, `js/asuntos-editar.js` ×2, y el propio
`App.anotar`) ya releían antes de escribir, así que pasarlos por `guardarRegistroFresco` no les
cambia el comportamiento; solo cierra la puerta a que alguien añada un tercer sitio que escriba
directo. `js/conflictos.js` se queda como estaba a propósito: fusiona una copia en conflicto de
Dropbox que ya se acaba de leer dos líneas antes.

**La prueba** (`pruebas/guardar-sin-pisar.mjs`) es la primera de la cola que carga `nucleo.js` y
`papelera.js` de verdad en un contexto `vm` sin navegador, ampliando el patrón de
`pruebas/archivar-fusion.mjs`: hace falta un `document` de mentira mínimo (solo
`getElementById`/`querySelectorAll`, porque `nucleo.js` engancha `onclick` a unos pocos botones al
cargarse) y un `window` que sea el propio contexto (`window === global`, como en un navegador de
verdad), con un `Gestor` de mentira encima de `App.E` en vez de cargar `js/puente.js` entero. Monta
dos asuntos, A y B; simula al compañero escribiendo notas nuevas directamente en el fichero del
disco (sin pasar por `App.E.registro`) mientras este ordenador tiene la copia vieja en memoria; y
comprueba que mandar A a la papelera y devolverlo no se llevan por delante lo que el compañero
había guardado en B, ni archivan una versión vieja de la ficha de A. Comprobado a mano que la
prueba falla sin el arreglo (revirtiendo `js/nucleo.js` y `js/papelera.js`) y pasa con él.

## 19-sep-2026 — Fila 62: renombrar un asunto sin perder sus hitos

Arreglo del fallo grave 2 del informe crítico (`docs/INFORME-CRITICO-2026-09-18.md`, 2.3): el
nombre de la carpeta de un asunto es la clave con la que se guardan tres cosas, en tres ficheros
distintos (`asuntos.json`, `hitos.json` y `presencia.json`). Renombrar un asunto solo movía la
ficha; los hitos (fecha límite, responsable, historial, documentos apuntados, lo reunido) se
quedaban bajo el nombre viejo, y como `crearSiToca` (`js/hitos-panel.js`) ve que el asunto "no
tiene hitos" y los vuelve a crear desde la guía, la pérdida no daba ningún error: solo salían
hitos en blanco donde antes había un historial.

**El arreglo**: `js/asunto-renombrar.js` (nuevo), con `AsuntoRenombrar.mover(claveVieja,
claveNueva, datosExtra)` como único sitio que mueve la ficha, los hitos y la señal de presencia a
la vez. Si el destino ya tenía hitos (unir dos asuntos, o enlazar una huérfana con una carpeta que
ya los tenía), se fusionan por identificador en vez de pisarse, reutilizando
`Conflictos.unirPorId` (ahora exportado en `window.Conflictos`, antes solo interno de
`js/conflictos.js`) — el mismo problema que fusionar una copia en conflicto de Dropbox.
`AsuntoRenombrar.fusionar(claveQueda, claveVa)` cubre el caso de unir asuntos (la ficha la sigue
fundiendo `js/unir-asuntos.js` con sus propias reglas de notas/pasosHechos/pasosElegidos; aquí
solo se mueven hitos y presencia). `AsuntoRenombrar.quitar(clave)` y `.restaurar(clave, hitos)`
cubren el borrado y la devolución desde la papelera: los hitos viajan ahora dentro de la propia
ficha de `papelera.json` (campo `hitos`, junto a `datos`).

Los cuatro caminos que renombran un asunto y el quinto que lo borra pasan todos por ahí:
`App.editarAsunto` y `App.renombrarAsuntosAbiertosDelTercero` (`js/asuntos-editar.js`),
`fusionarFicha` (`js/unir-asuntos.js`), `enlazar` (`js/fichas-huerfanas.js`) y `mandarAsunto`/
`devolverAsunto` (`js/papelera.js`). Ninguno vuelve a tocar `App.E.registro.asuntos`, `Hitos` o
`Presencia` por su cuenta para esto. De paso, `App.renombrarAsuntosAbiertosDelTercero` se
simplificó: ya no hace falta envolver el bucle en `App.guardarRegistroFresco` a mano, porque cada
llamada a `AsuntoRenombrar.mover` relee y guarda fresco por su cuenta.

`js/presencia.js` gana `mover(claveVieja, claveNueva)` y `borrarClave(clave)`, hermanas de la
`quitar(clave)` que ya existía (esa solo quita la señal propia; las nuevas mueven o quitan
cualquiera, para el renombrado y el borrado). Nuevo también un bloque de Ajustes → Mantenimiento,
"Hitos huérfanos" (`App.pintarHitosHuerfanos`, dentro del propio `js/asunto-renombrar.js`), que
cuenta las entradas de `hitos.json` que ya no corresponden a ningún asunto abierto ni archivado
—rastro de renombrados de antes de este arreglo— y deja borrarlas con confirmación, sin adivinar
a qué asunto pertenecían.

**La prueba** (`pruebas/renombrar-asunto.mjs`), sin navegador, amplía el patrón de
`pruebas/guardar-sin-pisar.mjs` cargando también `js/conflictos.js`, `js/presencia.js` y
`js/hitos.js` en el contexto `vm`. Prueba `AsuntoRenombrar` directamente (mover, fusionar en un
destino que ya tenía hitos, unir dos asuntos, enlazar una huérfana, borrar y devolver desde la
papelera, mover la señal de presencia, y detectar hitos huérfanos) con un hito "rico" que lleva
las seis cosas que el informe decía que se perdían. Los cuatro caminos de la aplicación en sí
(`App.editarAsunto` y compañía) no se prueban de extremo a extremo sin navegador porque todos
abren antes un `U.preguntar`, que necesita un DOM de verdad para contestar; la batería completa de
Playwright (`huerfanas.mjs`, `papelera.mjs`) sigue en verde tras el cambio, confirmando que los
envoltorios finos sobre `AsuntoRenombrar` no rompieron nada del camino ya cubierto. Comprobado a
mano que la prueba falla (7 comprobaciones) si se desactiva la migración de hitos y presencia
dentro de `AsuntoRenombrar.mover`, y pasa entera con el arreglo puesto.
