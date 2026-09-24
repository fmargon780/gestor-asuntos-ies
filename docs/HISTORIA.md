
## 20-sep-2026 — Fila 82: los formularios oficiales, a un clic

`docs/FORMULARIOS-OFICIALES.md`. El catálogo de 29 impresos del trámite de escolarización y
convivencia ya estaba escrito, en otro repositorio (`fmargon780/normativa-escolarizacion`,
`datos/formularios.json`): esta fila lo trae aquí, tal cual (`get_file_contents`, sin tocar nada),
y lo cuelga de los sitios donde de verdad hace falta un impreso — un hito, un tipo de asunto, la
ficha del asunto — en vez de salir a buscarlo.

**Se copia, no se lee en vivo.** La red del centro bloquea direcciones que no hacen falta, y la
aplicación trabaja sobre ficheros del ordenador: depender de otra web para pintar una pantalla
habría sido frágil. `js/formularios.js` lo lee con `fetch` relativo del propio sitio, una sola vez
por sesión; el botón "Actualizar el catálogo" (Ajustes → Mantenimiento) fuerza a releerlo, para
cuando se publique una versión de la aplicación con más formularios.

**Dónde se elige.** Un paso de guía (y, copiado, un hito modelo de la biblioteca y un hito vivo)
gana `formularios: [clave, ...]`, con el mismo criterio que la normativa de la fila 79: solo en el
paso de arriba, nunca en una opción. El buscador con casillas se pinta DENTRO del mismo `<details>`
de normativa —`HitosNormativa.bloqueHTML` gana un segundo argumento, `formulariosHTML`, en vez de
crear un `<details>` hermano— para no alargar más la pantalla del paso, tal y como pedía el
encargo. Un tipo de asunto también gana su propia lista, en "Datos del tipo", para lo que no
depende de ningún paso concreto.

**Dónde se ven.** En el cuerpo de un hito vivo, igual que la normativa: un enlace con aspecto de
botón para los de vía "descarga"/"centro" (hay un impreso real que bajar), un aviso —con su nota,
si la tiene— para "protocolo"/"seneca" (no hay nada que descargar, y no debía parecer que sí). En
la ficha del asunto, una línea nueva "Formularios" dentro de "Datos del trámite", con los de todos
los hitos VISIBLES del asunto (la rama en curso, sin repetir) más los del tipo; como hace falta leer
los hitos —async— y `datosDelAsunto` es síncrona, se pinta un hueco vacío y `js/formularios.js` lo
rellena después, envolviendo `App.abrirFicha` (mismo patrón que ya usan `js/correo.js` y
`js/plantillas-documento.js`). Y una pantalla propia "Formularios", con su entrada en la barra
lateral junto a "Qué me toca" y "Cuentas": el catálogo entero, buscable, agrupado por norma, para
cuando hace falta un impreso sin tener un asunto delante.

Comprobado con `pruebas/formularios.mjs` (sin navegador: solo las dos funciones puras, `buscar` y
`etiquetaDeVia`) y `pruebas/nombres-app.mjs` (ningún nombre de `App` repetido). Batería completa en
verde, una sola pasada al final.

## 20-sep-2026 — Fila 81: los firmantes del centro y el membrete

`docs/FIRMANTES-Y-MEMBRETE.md`. Un documento generado salía sin membrete y con una firma fija
escrita a mano en `plantillas.json`. Dos problemas de fondo: las personas que ocupan un cargo
cambian, y un documento antiguo debería seguir diciendo quién firmaba entonces; y el membrete
llevaba el nombre de la Consejería dentro de la imagen, así que un cambio de nombre obligaba a
rehacer la imagen entera.

**Los cargos, con fechas.** `_GESTOR/cargos.json` (decimoséptimo fichero compartido) guarda, por
cargo, quién lo ha ocupado y desde/hasta cuándo (`hasta` vacío = sigue). `js/cargos.js`
(`Cargos.enFecha`) resuelve por texto `AAAA-MM-DD`, sin `Date`, para no arrastrar líos de huso
horario ni depender de que la sesión y el reloj del sistema coincidan de un día para otro. Sin
fichero, nace con seis cargos de fábrica sin ningún ocupante: Dirección, Vicedirección, Jefatura de
Estudios, Secretaría, Administración, Orientación. La pantalla (`Cargos.pintarEnAjustes`) vive en
el mismo fichero que el modelo, como ya hacía `js/recurrentes.js`: separar en un "-ajustes.js" no
lo pedía el encargo y habría sido una fila más para nada.

**Quién firma cada plantilla.** Cada fila de `documentos[]` en `plantillas.json` gana `firmante`
y `vistoBueno` (el `id` de un cargo). Los huecos nuevos (`{{FIRMANTE}}`, `{{CARGO FIRMANTE}}`,
`{{TRATAMIENTO FIRMANTE}}` y su pareja de visto bueno, más `{{CONSEJERIA}}`) van con **doble
llave**, resueltos aparte de los huecos normales de una sola llave, antes de que
`Plantillas.rellenar` los vea: con una sola llave, `{CARGO FIRMANTE}` funciona igual de bien
mientras el texto no lleve nada raro alrededor, pero deja las dos llaves de fuera sueltas en el
papel en cuanto el hueco viene escrito `{{...}}` (que es como pide escribirlo la fila 83, para que
no se confunda con un dato de asunto corriente) — así que `Plantillas.rellenar` gana un paso previo
genérico para cualquier hueco reconocido entre llave doble, no solo para `{{LO QUE FALTA}}` como
hasta ahora.

**El membrete, sin el nombre de la Consejería dentro.** La imagen (PNG/JPG) se sube una vez, en
Ajustes → El centro → Membrete, a `_GESTOR/PLANTILLAS/membrete.png`: la única vez que la aplicación
escribe en esa carpeta (el resto de `PLANTILLAS/` sigue siendo de Francisco). El nombre de la
Consejería se escribe ENCIMA al generar (`js/membrete.js`, `Membrete.montar`), con un `<canvas>` y
`createImageBitmap`, según una caja en % del ancho/alto de la imagen (así vale igual si la imagen
cambia de tamaño). `Membrete.medir` (sin efectos, con las pruebas de siempre) decide el tamaño de
letra —bajándolo hasta un mínimo del 55 % si no cabe— y, si ni así cabe, parte el texto en dos
líneas por el espacio más parejo; como no hay canvas en las pruebas, el ancho se estima con un
factor medio de letra de palo seco, que basta para decidir "cabe"/"no cabe" sin arrastrar la
máquina de pintar a un contexto sin DOM. La vista previa de Ajustes, en vivo, usa `Membrete.dibujar`
sobre la imagen y los valores TODAVÍA SIN GUARDAR del formulario: así se ve el resultado de cambiar
un número sin tener que guardar primero para comprobarlo.

**Meter la imagen en el `.docx`.** `Docx.ponerImagen` (nuevo en `js/docx.js`) busca el párrafo
`{{MEMBRETE}}` en `word/document.xml` y en cada `word/headerN.xml` (con la misma reparación de
huecos partidos entre varios `<w:t>` que ya usa `rellenar`, para que un corrector ortográfico de
Word no rompa la detección) y lo sustituye por un párrafo con un `<w:drawing>` en línea, a 17 cm de
ancho. Añade la imagen al ZIP, la relación que le toque —creando el `.rels` de cero si el `.docx`
no traía ninguno— y el tipo `png` a `[Content_Types].xml` si falta. Se aplica ANTES de `rellenar`,
porque busca el hueco en el XML tal cual viene de la plantilla, no en el texto ya sustituido.

Comprobado con `pruebas/cargos.mjs` (fechas contadas desde hoy, nunca escritas a mano),
`pruebas/membrete.mjs` (solo `medir`, que es la parte sin efectos) y un escenario nuevo de
`pruebas/plantillas-documento.mjs` que construye un `.docx` de mentira con `{{MEMBRETE}}` y
`{{FIRMANTE}}`/`{{TRATAMIENTO FIRMANTE}}`, comprueba con Python `zipfile` (lector independiente del
propio de `js/docx.js`) que el ZIP de salida es válido, y que el firmante sale del cargo en la
fecha del documento. Batería completa en verde, una sola pasada al final.

## 20-sep-2026 — Fila 80: cargar el contenido de la biblioteca

`docs/CARGAR-BIBLIOTECA.md`. Con la herramienta de la fila 79 ya hecha, esta fila la llena con el
contenido que Francisco y Claude prepararon en otra conversación (`docs/contenido/BIBLIOTECA-
ALUMNADO.md`, `-PERSONAL.md` y `-EMPRESAS-Y-OTROS.md`, cerca de 55 tipos de asunto de un IES
andaluz).

**Cómo se carga.** `herramientas/cargar-biblioteca.mjs` (Node, se ejecuta a mano cuando el
contenido cambie) lee los tres documentos y escribe `datos-biblioteca/biblioteca-centro.json`, un
dato estático más de la aplicación (como `js/lib/pdf.min.mjs`). `js/cargar-biblioteca.js` es el
botón nuevo en Ajustes → Mantenimiento, "Cargar la biblioteca del centro": lo lee con `fetch` y lo
fusiona con `tipos.json`, `campos.json`, `hitos-biblioteca.json` y `guias.json` — nunca pisa nada
ya escrito, y se puede pulsar más de una vez sin duplicar.

**Decisiones del programa que carga el contenido, para que quede escrito por qué:**

- El tramo de "plazo" de cada línea del documento (casi siempre una frase — "el mismo día", "antes
  de imponer nada, sin excepción" — no un número) **no** se convierte al campo `plazo` de la
  aplicación (una fecha calculada, `{dias, desde}`): eso habría rellenado casi todos los plazos con
  una interpretación mía, exactamente lo que la regla 3 del encargo prohíbe ("los plazos que el
  documento deja vacíos, se dejan vacíos"). Se deja como parte de la explicación del hito. Lo mismo
  con "comunica:" (a quién se avisa, no la plantilla del correo: esa se escribe con el uso).
- **Un hito que se repite se guarda una sola vez**: se deduplica por título + responsable exactos.
  Con 69 tipos y cerca de 300 líneas de hito, sin esto la biblioteca habría nacido con decenas de
  copias de "Grabar en Séneca". Dos hitos con el mismo título pero distinto responsable sí son dos
  modelos: de verdad los hace gente distinta.
- **"Mismos hitos que X."** (SUMINISTRO, OBRA y CONTRATO MENOR, en EMPRESAS, dicen literalmente que
  tienen los mismos diez pasos que COMPRA): en vez de repetirlos, esos tipos apuntan a la misma
  lista de modelos ya creada para COMPRA. Es el mismo mecanismo de la fila 79, ya en el contenido
  de partida.
- Dos campos (`Colectivo`, en PERSONAL; `Objeto`, en EMPRESAS) son de lista cerrada, pero sus
  valores están explicados en la prosa de cada documento, no en la propia línea "Campos:": se
  dejan a mano en el programa (`CAMPOS_LISTA_CONOCIDOS`), más fiable que adivinar una enumeración
  dentro de un párrafo.
- `CONTRATO MENOR` es, según la prosa del documento, "el tipo que hoy se llama CONTRATO": una
  frase así no se intenta parsear sola, va a mano en `RENOMBRES_ESPECIALES`.

**Lo que no ha resuelto solo, y queda a la vista de Francisco:** con la regla de arriba de que el
segmento sin prefijo después del responsable es "el plazo" y no una explicación, unas pocas líneas
del documento (el propio responsable escrito como una frase, del tipo "el mismo día" o "según cuál
sea") acaban guardadas tal cual en el campo `responsable` del modelo. No es un dato perdido ni un
error de guardado: se ve rarísimo como una insignia corta, pero está todo el texto. Se corrige a
mano, en dos clics, desde Ajustes → El centro → Biblioteca de hitos → Editar el modelo (el mismo
editor de un paso que ya existía).

Comprobado con `pruebas/cargar-biblioteca.mjs` (jsdom, un contenido pequeño inventado para la
prueba, no el real): altas, renombrados con nombre corto, modelos compartidos entre dos tipos,
campos propios, una guía ya escrita a mano que no se toca, y que cargarlo dos veces no duplica
nada. El contenido real se ha comprobado a mano mirando la salida de
`node herramientas/cargar-biblioteca.mjs` (69 tipos, 296 modelos, 69 guías, 21 tipos con campos
propios) y revisando varios tipos completos contra el documento de origen.

## 20-sep-2026 — Fila 79: la biblioteca de hitos del centro

`docs/BIBLIOTECA-DE-HITOS.md`. Hasta hoy la guía de un tipo se escribía a mano, paso por paso, sin
reutilizar nada entre tipos casi idénticos. Se construye una **biblioteca de hitos del centro**:
una colección de hitos modelo, guardada una sola vez en `_GESTOR/hitos-biblioteca.json` (el
decimosexto fichero compartido), que se trae a la guía de un tipo como copia.

**Lo que ve Francisco**, con detalle en `docs/contexto/HITOS-Y-GUIAS.md` (sección nueva) y
`docs/contexto/CAMPOS-Y-TIPOS.md`: "+ Traer de la biblioteca" y "Guardar en la biblioteca" en el
cuadro de la guía; el aviso ámbar de un paso desactualizado en la pantalla de un tipo, con "Ver el
cambio"; un hito puede marcarse "Solo informativo" (se ve, no reclama trabajo) y llevar su
normativa citada, con enlace al sistema de normativa del centro; un Tipo de Asunto puede llevar un
nombre corto para el nombre de la carpeta; el bloque "Biblioteca de hitos" en Ajustes → El centro.

**El truco de "solo hay un cuadro de diálogo".** Toda la aplicación tiene una sola regla de oro
para `U.preguntar`: nunca dos a la vez. "Traer de la biblioteca" y "Guardar en la biblioteca"
pasan mientras el cuadro de la guía SIGUE ABIERTO, así que no pueden abrir un segundo
`U.preguntar`: se resuelven con un panel dentro del propio cuadro, con el mismo patrón que ya
usaba "guia-enlace-fila". En cambio, la revisión automática al pulsar Guardar
(`GuiasBiblioteca.revisarAlGuardar`) se dispara DESPUÉS de que `U.preguntar` haya cerrado `#capa`
al resolver su promesa: ahí sí se puede volver a abrir un cuadro, uno por paso cambiado. Las dos
mitades del mismo problema, resueltas de dos formas distintas porque el momento en que se disparan
es distinto.

**Qué cuenta como cambio, y qué no.** `HitosBiblioteca.diferencias` compara un paso con su modelo
por: título, explicación, responsable, estado del asunto, plazo, requisitos, comunicación y
normativa. `soloInformativo` queda fuera a propósito (es una decisión de cada tipo, no del
modelo). El aviso en los DEMÁS tipos (apartado 4.4) no compara contenido en directo: compara
`origenBiblioteca.revision` contra la del modelo. Así, "Solo en este tipo" y "Dejarlo como está"
pueden silenciar el aviso para siempre (marcando `divergido: true`, o subiendo la `revision`
apuntada) aunque el contenido del paso siga siendo distinto del modelo — es la propia decisión de
Francisco de que esa copia es suya, no un olvido que haya que seguir recordándole.

**El arreglo suelto del apartado 9: el tipo renombrado que resucitaba.** `App.renombrarTipo`
cambiaba el nombre y guardaba, pero nunca marcaba el nombre viejo como borrado en
`js/borrados-fusion.js` (fila 77): `App.fusionarConDisco` veía el nombre viejo como algo que el
otro ordenador tenía de más, y lo devolvía a la vida como tipo fantasma en cuanto alguien guardara
cualquier otra cosa con su copia vieja en memoria — exactamente lo que le pasó a Francisco con
ANULACIÓN/ANULACIÓN MATRÍCULA y con DTMA. Mismo arreglo en `App.renombrarEstado`
(`js/ajustes-centro.js`); los tipos de documento no tienen función de renombrar, así que no
aplica. De paso, `App.borrarTipo` ya no cuenta como "en uso" un tipo cuyo nombre figura como alias
de otro tipo vivo: sin eso, un tipo fantasma no se podía borrar nunca, porque las carpetas
archivadas con su nombre viejo se le seguían adjudicando a él.

**Lo que se ha dejado fuera, a propósito, de esta fila:**

- El `?v=` de caché en los `<script>` de `index.html` (para que una publicación nueva llegue
  siempre, aunque el navegador tenga una copia vieja): el propio encargo lo marca como "aparte, y
  conviene", no como parte de la fila. Tocar el mecanismo de carga de TODA la aplicación sin que
  Francisco esté delante para comprobarlo es más riesgo del que compensa aquí; queda para otra
  fila si hace falta de verdad.
- Los tres buscadores (Ajustes, Nuevo asunto, ARCHIVO) buscan hoy por el nombre de siempre y por
  los alias; no se ha extendido explícitamente la búsqueda por el nombre corto en los dos primeros
  (el del ARCHIVO sí lo encuentra, porque pasa por `Nombres.leer`, ya arreglado). No es un fallo
  conocido, solo una comprobación que no ha dado tiempo a hacer a fondo.
- No se ha escrito una prueba de navegador nueva para la interfaz de la fila (el panel de "traer",
  los paneles en línea, el aviso ámbar): las pruebas de esta fila son todas de lógica pura
  (`pruebas/biblioteca-de-hitos.mjs`, `pruebas/nombre-corto-de-tipo.mjs`), más una escena nueva en
  `pruebas/borrados-que-se-fusionan.mjs` para el apartado 9. Es la misma cobertura que ya tienen
  `js/campos-catalogo.js` o `js/hitos-requisitos.js`: bien probados por dentro, sin foto de
  Playwright de la pantalla entera.

Ficheros nuevos: `js/hitos-biblioteca.js`, `js/hitos-normativa.js`, `js/guias-biblioteca.js`,
`pruebas/biblioteca-de-hitos.mjs`, `pruebas/nombre-corto-de-tipo.mjs`. Tocados, lo mínimo:
`js/guias.js` (ya rondaba las 900 líneas: los botones nuevos y la casilla llaman a los ficheros de
arriba, la lógica no vive aquí), `js/hitos.js`, `js/hitos-archivo.js`, `js/hitos-panel-lista.js`,
`js/que-me-toca.js`, `js/nombres.js` (y los siete sitios que montan un nombre de carpeta:
`js/asuntos-nuevo.js`, `js/asuntos-editar.js`, `js/recurrentes.js`, `js/bandeja-correos.js`),
`js/ajustes-tipo.js`, `js/ajustes.js`, `js/ajustes-centro.js`, `js/plantillas.js`,
`js/plantillas-ajustes.js`, `js/copias.js`, `js/guias-enganche.js` (gana `guardarPasos`, para
escribir una guía sin reabrir el editor), `index.html` (los `<script>` nuevos y el campo de
dirección del sistema de normativa), `css/guias.css`, `css/hitos.css`.

## 20-sep-2026 — Fila 78: repartir docs/contexto/ASUNTOS.md

`docs/contexto/ASUNTOS.md` había llegado a 44,9 KB, por encima del objetivo de 40 KB de la fila 65
(`docs/DOCUMENTOS-QUE-QUEPAN.md`). Se partió por el medio, moviendo texto tal cual, sin resumir ni
reescribir nada: `docs/contexto/ASUNTOS.md` se queda con crear, editar, la ficha de un asunto
abierto, "Lo pide" y los duplicados (27,4 KB); el nuevo `docs/contexto/ASUNTOS-ARCHIVO.md` se lleva
la papelera, archivar/reabrir, los atascos al archivar, el índice del ARCHIVO, la ficha de un
asunto archivado y las fichas huérfanas (18,3 KB). Se actualizó el índice de `docs/CONTEXTO.md` con
la fila nueva, y la única referencia cruzada que apuntaba al contenido movido
(`docs/contexto/HITOS-Y-GUIAS.md`, la pantalla Cuentas citando "El índice del ARCHIVO"). Ninguna
prueba automática cubre esto: se comprobó a mano que la suma de los dos trozos coincide con el
original y que ningún documento vivo pasa ya de 40 KB.

## 20-sep-2026 — Fila 77: los borrados que se fusionan

`docs/DETALLES-DE-MANTENIMIENTO.md`, punto 3, separado de la fila 72 el 19-sep-2026 al ver que
resolverlo de verdad ("respeta el borrado si es más nuevo que el alta del otro lado") necesitaba
una fecha de alta por elemento que ninguno de los cuatro ficheros guarda hoy.

**El fallo de siempre.** Borrar un tipo de asunto, un estado, un tipo de documento o un asunto
recurrente era solo quitarlo del array en memoria. `App.fusionarConDisco` (`js/nucleo.js`) solo
suma lo que el disco tenga de más, nunca quita nada: si el compañero tenía la misma lista cargada
desde antes del borrado, la próxima vez que guardaba algo suyo sin relación (activar un
interruptor, cambiar un plazo) el elemento borrado volvía, porque su copia en memoria todavía lo
traía.

**La solución, sin fechas de alta por elemento.** Fichero nuevo, `js/borrados-fusion.js`, con un
`_GESTOR/borrados-listas.json` de solo `{ tipos, estados, tiposDocumento, recurrentes }`, cada uno
un array de `{ clave, borradoEl }`. Borrar llama a `Borrados.marcar` (apunta la clave, sin quitar
nada más de lo que ya se quitaba); dar de alta a mano, o devolver desde la papelera, llama a
`Borrados.revivir` (quita la marca: un gesto explícito y posterior gana siempre a un borrado
viejo, sin necesitar saber cuándo se dio de alta cada cosa). Cada `guardarX()` —
`App.guardarTipos`, `App.guardarEstados`, `App.guardarTiposDocumento` y el `guardar()` de
`js/recurrentes.js` — pasa lo que sale de `fusionarConDisco` por `Borrados.filtrarActivos`, que
quita cualquier clave que siga marcada: así el borrado se respeta aunque el otro ordenador todavía
lo tenga en memoria. Los recurrentes no necesitan `revivir` en su alta: su id siempre es nuevo
(`'r' + Date.now()`), nunca reutiliza uno ya borrado.

`borrados-listas.json` entra en `Copias.FICHEROS` (decimoquinto fichero compartido, con sus
propias copias de seguridad) y, por estar ahí, en el bloque genérico de "Conflictos de Dropbox"
que ya avisa y deja elegir cuando dos ordenadores lo tocan casi a la vez (no hizo falta tocar
`js/conflictos.js`: la lista de ficheros que vigila es la de `Copias.FICHEROS`).

**Dónde se llama a `Borrados.marcar`/`revivir`.** Borrar: `App.borrarTipo` (`js/ajustes.js`),
`App.quitarEstado` y `App.borrarTipoDocumento` (`js/ajustes-centro.js`), y el botón "Quitar" de un
recurrente (`js/recurrentes.js`). Alta o revivir: el botón "+ Añadir" de tipos y de tipos de
documento (`js/ajustes.js`, `js/ajustes-centro.js`), "Añadir ... a la lista" desde la ficha del
asunto (`js/ficha-asunto.js`), crear un tipo de documento al vuelo desde el propio cuadro
(`js/nucleo.js`, `Documentos.configurar.crearTipo`), y las tres devoluciones desde la papelera
(`devolverTipo`, `devolverEstado`, `devolverTipoDocumento` en `js/papelera.js`).

**Ajustes → Mantenimiento** enseña un bloque nuevo, "Borrados que se fusionan"
(`App.pintarBorradosFusion`, en el propio `js/borrados-fusion.js`, enganchado en
`App.pintarAjustesMantenimiento` con el mismo "si existe la función, se llama" que ya usan las
fichas huérfanas): cuántos borrados hay de cada una de las cuatro listas, y un botón para quitar
del todo, sin vuelta atrás, los de hace más de 90 días. Los borrados no se ven en ningún otro
sitio.

Prueba nueva, `pruebas/borrados-que-se-fusionan.mjs` (sin navegador, disco de mentira en un
contexto `vm`, el mismo patrón que `pruebas/copias.mjs`): reproduce el escenario completo del
documento con dos "ordenadores" (dos variables sobre el mismo disco) para tipos, estados y tipos
de documento — el borrado no reaparece con la memoria vieja del otro, y un alta a mano después del
borrado sí entra — más las funciones sueltas de `Borrados` (incluido `recurrentes`) y la caducidad
a los 90 días. Comprobado que falla sin el arreglo (quitando solo los cambios de `js/nucleo.js`,
las nueve comprobaciones que dependen de la fusión fallan) antes de darla por buena.
`pruebas/recurrentes.mjs` pasó a cargar también `js/borrados-fusion.js`, que su `guardar()` ya
necesita. Batería completa en verde (85 ficheros de prueba), una sola pasada al final.

Versión publicada `App.VERSION`: `20-sep-2026 · 06:53`.

---

## 19-sep-2026 — Fila 75: los dos huecos que dejó la fila 69

`docs/HUECOS-ENCONTRADOS-FILA-69.md`. Al escribir las pruebas de unir asuntos y de recurrentes
(fila 69) aparecieron dos sitios donde el código no hacía lo que describía el encargo original; se
dejaron sin tocar entonces (no eran arreglos de una línea) y se resuelven aquí.

**1. Unir con un documento del mismo nombre en las dos carpetas.** Antes, `js/unir-asuntos.js`
paraba la unión entera y pedía renombrar a mano desde "Gestionar documentos". Ahora el documento
que viene de la carpeta que se va entra con " (2)", " (3)"... — el mismo patrón que ya usa
`Carpetas.fusionarEn` al archivar sobre un destino que ya existe. `Carpetas.existeFichero` y
`Carpetas.nombreLibreConSufijo` (ya existían, solo para uso interno de `fusionarEn`) se exportan
también para este segundo uso. Nada se pierde ni se para: al terminar se avisa de cuántos
documentos se han tenido que renombrar así. `pruebas/unir-asuntos.mjs` (sin navegador) y
`pruebas/duplicados.mjs` (navegador de verdad) comprueban el comportamiento nuevo; la sección de
`duplicados.mjs` que antes comprobaba el bloqueo se ha rehecho para comprobar el renombrado, y la
prueba de "No son el mismo" se ha movido a un grupo sin choque de ficheros, porque ya no depende de
uno.

**2. "Ocultar por hoy" en los asuntos recurrentes.** El panel de recurrentes pendientes
(`js/recurrentes.js`, `pintarPanel`) no tenía ese botón, aunque el encargo de avisos (fila 68) lo
daba por hecho junto a "Crear" y "Ver la lista en Ajustes". Se añade con el mismo patrón que ya usa
`js/avisos.js`: una clave de `localStorage` con la fecha de hoy, de este ordenador. No cambia qué
toca crear (`_pendientes` sigue igual): solo esconde el aviso el resto del día.
`pruebas/recurrentes.mjs` lo comprueba con un `localStorage` de mentira en el contexto `vm`.

Versión publicada `App.VERSION`: `19-sep-2026 · 15:55`.

---

## 19-sep-2026 — Fila 74: cuentas de fin de curso

`docs/CUENTAS-DE-FIN-DE-CURSO.md`, informe crítico 4.4. La memoria de fin de curso siempre pedía
"cuántos certificados de matrícula hemos hecho este curso" y la única respuesta era contar
carpetas a mano. Pantalla nueva, **"Cuentas"**, con su botón en la barra junto al de "Qué me toca".

**De dónde salen los números, sin recorrer el ARCHIVO.** Los abiertos, de
`window.Gestor.asuntos()`; los archivados, del índice guardado (`js/archivo-indice.js`, el mismo
de la fila 44). Si el índice no está hecho, la pantalla lo dice y remite a ARCHIVO →
"Reconstruir el índice", sin enseñar números a medias: exactamente lo que pedía el documento.

**Las cuatro cuentas.** Una tabla categoría → tipo → cuántos/abiertos/archivados (un tipo que no
encaja con ningún tipo de Ajustes se cuenta aparte, en "Sin clasificar", sin perderse), con botón
"Copiar la tabla" (separado por tabuladores, para pegar en un documento o una hoja de cálculo);
por mes; por quién lo pidió (familia, alumnado, centro o empresa, según `ficha.loPide`); y cuánto
se tarda de media en tramitar un asunto archivado. Un desplegable arriba filtra por curso
académico, calculado de la **fecha de apertura** del asunto (no del año académico opcional que
algunos tipos llevan en el nombre: muchos, como los de EMPRESAS, no lo llevan nunca).

**El índice del ARCHIVO crece de nuevo** (`VERSION` 2 → 3, fila 73 la había dejado en 2): cada
entrada guarda ahora también si su tipo se reconoció, la categoría y relación de quien lo pidió,
y las fechas de apertura y cierre. Un índice viejo se reconstruye solo, como siempre.
`cursoYGrupoDeResto` (antes privada de `js/archivo-indice.js`) se saca a `js/nombres.js`: hacía
falta también para los asuntos abiertos, que no pasan por el índice.

**Un fallo encontrado y corregido en el camino**: el desplegable de curso volvía él solo al curso
actual en cuanto se elegía "Todos", porque repintaba sus opciones (y su valor por defecto) en
cada repintado de la pantalla, no solo la primera vez. Ahora el desplegable solo se rellena una
vez, al entrar.

Prueba nueva, `pruebas/cuentas.mjs`, sin navegador: la cuenta por tipo exacta, "Sin clasificar"
sin perder ninguno, los cursos que de verdad hay, por mes, por quién lo pidió, cuánto se tarda, y
que "Copiar la tabla" deje tantas líneas como filas. Comprobado también a mano en un navegador de
verdad, con datos abiertos y archivados de varios cursos.

## 19-sep-2026 — Fila 73: buscar en las notas

`docs/BUSCAR-EN-LAS-NOTAS.md`. Hasta ahora el buscador (Asuntos abiertos y ARCHIVO) solo miraba
nombre, categoría, tercero, tipo, curso, grupo, documentos y registros de Séneca: si lo que se
recordaba de un asunto estaba escrito en una nota, no aparecía.

**Las notas entran en la búsqueda.** `js/notas.js` gana `textoParaBuscar(ficha)` (junta el texto
de todas las notas del asunto y lo recorta a 2.000 caracteres, para que una nota gigante no
ralentice nada). En Asuntos abiertos (`js/asuntos-lista.js`, `App.verAbiertos`) ese texto se suma
al de siempre. En el ARCHIVO, el índice guardado (`js/archivo-indice.js`) pasa a llevar también
las notas de cada entrada; eso sube su `VERSION` de 1 a 2, así que un índice viejo se reconstruye
solo, con el aviso de siempre.

**De paso, un fallo real:** `App.pintarAbiertos` comparaba la frase escrita entera con `indexOf`,
sin partirla en palabras — buscar "Pérez empadronamiento" no encontraba nada aunque las dos
palabras estuvieran, una en el nombre y otra en una nota, porque nunca aparecen juntas y en ese
orden. `App.pintarArchivo` ya lo hacía bien (palabra a palabra, en cualquier orden); se ha
igualado el buscador de Asuntos abiertos al mismo criterio, que además era parte de lo que pedía
esta fila.

**Por qué ha salido, a la vista.** Cuando la única razón de que un asunto aparezca es una nota, la
tarjeta enseña ahora un trocito de esa nota con la palabra buscada resaltada
(`.tarjeta-nota-encontrada`, `App.fragmentoDeNota`); si el asunto ya se explicaba por el nombre u
otro campo, no se enseña nada de más. La comparación es `busca` (todo, incluidas notas) contra
`buscaSinNotas` (todo menos notas), palabra a palabra: si una palabra buscada está en el primero
pero no en el segundo, vino de una nota.

Prueba nueva sin navegador, `pruebas/buscar-en-notas.mjs` (once comprobaciones: nota que aparece,
dos palabras en cualquier orden, con y sin tildes, cuándo se enseña fragmento y cuándo no, recorte
de una nota de 50.000 caracteres, y la subida de `VERSION` del índice). Comprobado también a mano
en un navegador de verdad, en Asuntos abiertos y en el ARCHIVO.

## 19-sep-2026 — Fila 72: cinco detalles de mantenimiento (tres hechos, dos separados)

`docs/DETALLES-DE-MANTENIMIENTO.md`, informe crítico 2.8 y 4. Cinco cosas pequeñas e
independientes; tres se hicieron, dos se complicaron y pasan a las filas 76 y 77 (regla propia
del documento).

**Punto 2, el nombre de quien entra, de una lista.** `js/usuarios.js` (nuevo) guarda
`_GESTOR/usuarios.json` (`{ nombres: [...] }`), un fichero compartido más (el decimocuarto,
`js/copias.js`). La pantalla de entrada pinta un desplegable con los nombres ya usados más
"Otro…" en cuanto la carpeta de asuntos abiertos tiene permiso concedido (`App.pintarListaUsuarios`,
llamado tras elegir la carpeta y al recordar una de antes); si la lista está vacía, el campo de
texto de siempre, sin cambios. Comparación exacta a propósito: "Francisco" y "francisco" quedan
como dos nombres, nunca se unifican solos, y nunca se tocan los nombres ya escritos en notas e
historiales. **Fallo real encontrado y corregido en el camino**: registrar el nombre nuevo
(`Usuarios.anadirSiHaceFalta`) se lanzaba sin esperar, a la vez que `Copias.comprobarTodos`
leía los catorce ficheros al entrar; la lectura podía pillar `usuarios.json` a medio escribir y
darlo por roto, bloqueando la entrada. Se espera ahora, y se hace después de comprobarTodos, no
antes ni en paralelo.

**Punto 4, las copias de seguridad, con caducidad.** `js/copias.js`: además de quedarse con las
últimas 30, `podar()` borra las de más de 90 días (nuevo campo `Ajustes → El centro`,
`App.diasCaducidadCopias`/`guardarDiasCaducidadCopias`/`pintarDiasCaducidadCopias`, mismo patrón
que `App.diasDormido()`), aunque no lleguen a las 30. `js/copias.js` no puede llamar a `App`
directamente (se carga antes que `js/nucleo.js`): lee el ajuste con `window.App && ...`, nunca
`App` a secas.

**Punto 5, pdf.js al día.** La 3.11.174 vendida tenía el CVE-2024-4367 (ejecución de JavaScript
arbitrario al abrir un PDF con una fuente manipulada), arreglado en la 4.2.67. Sube a esa
versión (`js/lib/pdf.min.mjs`/`pdf.worker.min.mjs`, del `build/` de `pdfjs-dist`, no de
`legacy/`). Desde la 4.x pdf.js solo se distribuye como módulo: los tres sitios que lo cargan
(`js/registro-lector.js`, `js/pdf-separar-unir.js`, `js/preparar-documento.js`) pasan de una
etiqueta `<script>` a `import()` (que, en un script normal, toma como base la URL del propio
script que lo llama, no la de la página: gotcha real encontrado al hacerlo). `pdf-lib` ya está en
su última versión (1.17.1, sin mantenimiento activo hace más de un año), sin avisos de
seguridad: se deja como está y se apunta en `docs/COMPROBAR-A-MANO.md` mirarlo una vez al año.
Prueba nueva, `pruebas/registro-lector-navegador.mjs`: un PDF de verdad (montado con pdf-lib), en
un navegador de verdad, leído con la pdf.js nueva.

**Puntos 1 y 3, separados.** El 1 (la versión sacada del reloj por un paso de GitHub Actions o al
publicar) y el 3 (que los borrados de listas se fusionen entre ordenadores) se complicaron más de
lo que le tocaba a esta fila: el 1 arriesga un bucle de publicaciones de Vercel que esta sesión no
puede probar de verdad; el 3 necesita una fecha de alta por elemento que hoy ninguno de los cuatro
ficheros guarda. Pasan a las filas 76 y 77, con la razón anotada en el propio
`docs/DETALLES-DE-MANTENIMIENTO.md`.

`npm test` entero en verde varias veces (dos regresiones reales se detectaron y arreglaron por el
camino, arriba).

## 19-sep-2026 — Fila 71: las cosas repetidas, a la caja común

`docs/COSAS-REPETIDAS.md`, informe crítico 3.1. Fila de limpieza, la menos urgente de la cola:
ninguna pantalla cambia, la prueba principal es que `npm test` siga entero en verde.

Cuatro utilidades nuevas en `js/util.js`:

- **`U.copiar(texto, boton, opciones)`**: copia al portapapeles (con reserva por si el navegador
  no deja usar el portapapeles nuevo), pone "Copiado" en el botón 1.400 ms si se le pasa uno, y
  **avisa si falla**, algo que hoy no hacían casi ninguno de los doce sitios que copiaban cada uno
  a su manera. Pasan los doce: `asuntos-lista`, `asuntos-nuevo`, `copiar`, `correo-cuadro`,
  `documentos`, `ficha-tercero`, `lector`, `plantillas-documento`, `relacionados`, `seneca-cuadro`
  y `seneca-destinatarios` (adaptado: "Copiar el siguiente" no vuelve a su texto, avanza por la
  lista de chips). `js/seneca-ayudante.js` se queda como estaba: su copiado vive dentro del texto
  del marcador de Séneca, donde no existe `U`.
- **`U.nuevoId(prefijo)`**: la letra del módulo, la hora en base 36 y unas letras al azar. Pasan
  `grupos`, `guias`, `guias-requisitos` e `hitos`. La parte al azar lleva más letras que antes (de
  tres a ocho): con solo tres, una lista entera creada de golpe en el mismo milisegundo sí llegaba
  a chocar (lo detectó la prueba nueva, con diez mil tiradas). `js/papelera.js` se queda con el
  suyo: no va en base 36, es un formato propio, no de los cinco que compartían este.
- **`U.fechaCorta(fecha)`**: "dd/mm/aaaa" → "10-sep-2026". Solo escribían la fecha igual
  `bandeja-adjuntos-lector` y `documentos-sueltos-lector`; `hitos-archivo` (deja la fecha en ISO,
  sin mes en letra) y `lo-pide` (espera la fecha en ISO, no en dd/mm/aaaa) se quedan con el suyo,
  con un comentario que dice por qué.
- El buscador de elementos por su nombre (39 copias) se deja como recomendaba el informe: no
  aporta lo suficiente para tocar 39 sitios.

Prueba nueva, `pruebas/utilidades-comunes.mjs`, sin navegador (disco y portapapeles de mentira,
mismo estilo que `pruebas/logica.mjs`).

## 19-sep-2026 — Fila 70: las envolturas, comprobadas al arrancar

`docs/ENVOLTURAS-COMPROBADAS.md`, informe crítico 2.5: la aplicación está construida
"envolviendo" funciones (`var comoEra = App.loQueSea; App.loQueSea = function () { ...; return
comoEra(); };`), y eso descansa en que `index.html` cargue cada fichero en el orden justo. Si uno
se cuela en el sitio equivocado, la envoltura no se aplica **sin que salte ningún error**: la
función simplemente hace menos de lo que debería, y se descubre semanas después. El 11-sep-2026
había 17 sitios así; hoy, 42, en 24 ficheros.

**`U.envolver(objeto, nombre, fichero, hacerNueva)`** (js/util.js), nuevo: la misma mecánica de
siempre —guarda la vieja, pone la nueva—, pero comprobando primero que `objeto[nombre]` (la
última palabra tras el punto: `App.abrirFicha` mira `App['abrirFicha']`) existe y es una función.
Si no, lo apunta como fallo (con el motivo) en vez de fallar en silencio o reventar; si la nueva
función tampoco sale bien construida, también se apunta como fallo. Si todo va bien, guarda la
vieja, pone la nueva y lo apunta como aplicado, con el nombre y el fichero. Los 42 sitios de la
aplicación se han pasado por ella, uno a uno, sin cambiar lo que hacían.

**Encontrar los 42 de verdad costó más que convertirlos**: un primer repaso con `grep` solo
encontraba lo que ya se sabía (38, la cifra de este mismo documento antes de hoy, ya desfasada
tras las filas 66-69). Hubo que mirar fichero a fichero y, para los casos dudosos, comprobar con
el árbol de sintaxis si la envoltura se aplica **de verdad al cargar la página** o solo la primera
vez que se abre una pantalla que casi nunca se usa. Dos casos así se han dejado fuera a propósito,
porque avisar de ellos sería una falsa alarma constante: `js/ajustes-tipo.js` (envuelve un botón
"Volver" que no existe hasta que se abre la pantalla de un tipo) y `js/bandeja-correos.js`
(envuelve el botón "Crear el asunto" de la bandeja de correos, que no existe hasta que hay
carpetas señaladas y la bandeja arranca).

**Dos cambios de comportamiento, a propósito, y documentados aquí para que no se confundan con un
error**: primero, algunos sitios envolvían una función aunque no existiera de verdad (por ejemplo
si el orden de `<script>` fallaba), y ahora `U.envolver` lo rechaza y lo apunta como fallo en vez
de dejar pasar una envoltura rota en silencio —es justo la mejora que pide esta fila—. Segundo,
unos pocos ficheros miraban `typeof App !== 'undefined'` para no reventar si `App` todavía no
existía; como `U.envolver` ya hace esa comprobación por su cuenta, esos ficheros pasan a mirar
`window.App`/`window.Datos` (acceder a una propiedad de `window` nunca revienta, exista o no),
y se ha quitado la comprobación manual que sobraba.

**`js/envolturas-esperadas.js`** (nuevo, `window.EnvolturasEsperadas`), el **último** `<script>`
de `index.html`: trae la lista de las 42 que tienen que estar y la compara con
`U.envolturasAplicadas()` y `U.envolturasFallidas()`. Si falta alguna, aviso rojo en la pantalla
de entrada (`#aviso-envolturas`), diciendo el fichero y la función de cada una; no impide entrar.
También hay un bloque nuevo en Ajustes → Mantenimiento (`App.pintarEnvolturas`) con las 42 y su
estado, con el mismo aspecto que los demás bloques de esa pestaña.

**Nueva regla de código** (`docs/CONTEXTO-CORTO.md`, sección 6, y `docs/CONTEXTO.md`): un módulo
nuevo **no envuelve**. Se engancha por un punto previsto (`window.Gestor.alRefrescar` y los que
haya) o se le añade uno. Envolver solo si no hay más remedio, y entonces con `U.envolver`,
apuntándolo en `js/envolturas-esperadas.js`.

Se comprueba con `pruebas/envolturas.mjs`, en navegador de verdad (hace falta la aplicación
entera cargada, con las 42 envolturas de verdad, sin necesidad de "entrar" eligiendo carpetas:
`U.envolver` actúa al cargar cada `<script>`, no al usar la aplicación): al arrancar no sale
ningún aviso; quitando una a mano de la lista de aplicadas, sale el aviso rojo con su fichero y su
nombre, y se oculta otra vez al restaurarla; envolver una función que no existe no revienta, no
devuelve nada y queda apuntada como fallo; y el número de `U.envolver(...)` que hay de verdad en
`js/` coincide exactamente con la lista de `envolturas-esperadas.js` (la comprobación más útil de
las cuatro: salta sola si alguien añade una envoltura y se olvida de apuntarla, sin depender de
que quien lo haga se acuerde de tocar también la lista). `npm test` entero, 87 ficheros de
prueba, sigue en verde: es la red de seguridad de esta fila, tal como pedía el encargo, porque se
han tocado 24 ficheros y lo que hay que demostrar es que nada cambia de comportamiento (salvo los
dos cambios de arriba, buscados a propósito).
