# Historia — el diario

Esto casi nunca se lee: existe para consultar por qué se hizo algo como se hizo. Entradas
nuevas arriba, de lo más nuevo a lo más viejo.

---

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

## 19-sep-2026 — Fila 69: las pruebas que faltan

`docs/PRUEBAS-QUE-FALTAN.md`, parte 3.2 del informe crítico. Punto de partida: 70 ficheros de
prueba, 1.478 comprobaciones, todo en verde — y aun así, `js/unir-asuntos.js` (615 líneas) y
`js/recurrentes.js` (487 líneas) no los probaba nadie.

- **`pruebas/unir-asuntos.mjs`** (nuevo): la unión de verdad (`window.UnirAsuntos.unirAsuntos`,
  exportado solo para esta prueba), sin navegador, con el disco de mentira. Dos asuntos con notas,
  pasos hechos, hitos y documentos se unen bien; la carpeta que se va desaparece de disco y del
  registro; y si falla la copia de un documento, no se borra nada del origen.
- **`pruebas/recurrentes.mjs`** (nuevo): avisa cuando toca, no avisa dos veces del mismo (la
  próxima fecha queda en el futuro tras crearlo), y crear desde el aviso monta la carpeta y la
  ficha bien.
- **`docs/COMPROBAR-A-MANO.md`** (nuevo): la lista de lo que solo se puede comprobar entrando de
  verdad (Séneca, Dropbox sincronizando, el script de Google, la red del IES), para repasar antes
  de una publicación importante.
- El script de Google (`apps-script/gestor-correos.gs`) se deja sin probar, tal como permite el
  encargo ("si esto se complica, se deja y se apunta"): sacar sus partes puras a funciones
  probables habría significado tocar el fichero de verdad sin poder ejecutarlo contra Gmail para
  comprobar que el cambio no rompe nada.

**Dos huecos entre lo que pedía el papel y lo que hace el código de verdad**, encontrados al
escribir las pruebas y explicados en `docs/HUECOS-ENCONTRADOS-FILA-69.md` (apuntados como fila 75,
no urgente, en vez de tocarlos aquí sin permiso): unir dos asuntos con un documento del mismo
nombre no lo renombra con " (2)", para la unión entera y avisa; y el aviso de los asuntos
recurrentes no tiene ningún botón "Ocultar por hoy" (ese botón es de `js/avisos.js`, los plazos,
un aviso distinto). Las pruebas nuevas comprueban el comportamiento de verdad, no el del papel.

## 19-sep-2026 — Fila 68: los avisos que faltan

Tres cosas que la aplicación ya sabía pero no decía (`docs/AVISOS-QUE-FALTAN.md`, del informe
crítico, partes 2.3 y 4). Independientes entre sí.

**1. Fichas huérfanas, avisadas de verdad.** `js/fichas-huerfanas.js` ya encontraba las fichas de
`asuntos.json` sin carpeta, pero solo se veía entrando a propósito en Ajustes → Mantenimiento. De
paso, `calcular()` forzaba un recorrido entero del ARCHIVO (`App.verArchivo()`) si no se había
leído ya esta sesión, solo para poder pintar un número. Ahora usa el índice guardado
(`IndiceArchivo.leerDisco()`) si existe, y solo si no existe mira el ARCHIVO ya leído por otro
motivo, sin forzar nunca esa lectura; sin ninguna de las dos cosas, un asunto **cerrado** no se
comprueba y no se acusa de huérfano por error. `js/avisos-que-faltan.js` (nuevo) pinta con este
mismo cálculo una línea junto al aviso de plazos en "Asuntos abiertos".

**2. El bloque "Dormidos" en "Qué me toca".** Nada avisaba de un asunto abierto sin una nota desde
hace meses: los tres bloques de esa pantalla cruzan hitos, no asuntos enteros. Bloque nuevo,
`js/que-me-toca.js`, con los abiertos sin novedades desde hace `App.diasDormido()` días (60 por
defecto, campo nuevo en Ajustes → El centro, `registro.ajustesAvisos.diasDormido`, de todo el
centro). "Sin novedades" se calcula solo con lo que ya trae la ficha (`notaEl`, `situacionEl`,
`editadoEl`), a propósito: mirar el documento más nuevo de cada carpeta costaría un recorrido del
disco por asunto. Botón "Ocultar por 30 días" por si un asunto de verdad está esperando a algo de
fuera (`ficha.dormidoOcultoHasta`).

**3. La papelera vieja, avisada también en la pantalla principal.** El aviso de más de 30 días ya
existía dentro de la papelera de Ajustes; ahora sale también junto al aviso de plazos en "Asuntos
abiertos", con cuántas cosas son y cuánto ocupan de verdad en disco (`Papelera.tamanoDeViejas`,
nuevo, que solo se llama para este aviso). Sin botón para quitarlo sin decidir: lleva al mismo
bloque de Ajustes de siempre.

**Lo que NO se ha hecho, a propósito**: si la papelera debería vaciarse ella sola a los N días es
una decisión de Francisco, no de quien programe, y el propio encargo pide preguntársela antes de
tocar esa parte. Esta sesión no pregunta nada (instrucción de la cola), así que se queda sin
hacer: solo el aviso más insistente, nunca el borrado automático. Apuntado en `docs/CONTEXTO-
CORTO.md`, sección "Qué falta", para que Francisco lo decida cuando lea esto.

Los dos avisos nuevos de la pantalla principal se repintan al envolver `App.verAbiertos` (que solo
se llama al entrar, al pulsar "Actualizar" y tras crear/cerrar un asunto), nunca en cada tecla del
buscador (`window.Gestor.alRefrescar`, que se dispara mucho más a menudo): las dos comprobaciones
cuestan algo de disco.

Prueba nueva, `pruebas/avisos-que-faltan.mjs`, sin navegador, con los cinco escenarios del
encargo.

## 19-sep-2026 — Fila 67: las cuentas y los datos, por escrito

Fila que no toca código (`docs/LAS-CUENTAS-Y-LOS-DATOS.md`, partes 1.2 y 4.12 del informe crítico):
todo el proyecto cuelga hoy de las cuentas personales de Francisco, y nadie ha escrito en una
página qué datos maneja la aplicación ni adónde van.

Dos documentos nuevos, pensados para dejarse también en el Dropbox del centro (no solo en el
repositorio, que no le sirve de nada a quien no sea Francisco):

- **`docs/LAS-CUENTAS.md`**, para el relevo: dónde vive cada cosa, cómo se publica un cambio, qué
  hacer si la web o el correo dejan de funcionar, qué no hay que hacer nunca, y a quién llamar.
  Los datos del repositorio y de Vercel se han comprobado de verdad con las herramientas de esta
  sesión, no a ojo: proyecto de Vercel `gestor-de-asuntos` (cuenta `fjmarmolejoglez@gmail.com`),
  dominio `fmargon.com` con renovación automática activada y caducidad el 18-sep-2027, y **hoy
  Francisco es el único colaborador**, tanto en GitHub como en Vercel.
- **`docs/LOS-DATOS-DEL-CENTRO.md`**, para dirección: qué ficheros con datos personales crea la
  aplicación y qué llevan, qué sale del centro y qué no (la lista tal cual del informe crítico,
  1.2), y cuánto tiempo se guarda cada cosa. Termina con lo único que queda por decidir: si la
  papelera debería vaciarse sola.

**Lo que sigue pendiente, y no se puede hacer desde esta sesión**: poner a una segunda persona del
centro como colaboradora en el repositorio y en el proyecto de Vercel (lo tiene que hacer Francisco
desde la web, con su propia cuenta), y llevar una copia de los dos documentos al Dropbox del centro
(esta sesión no tiene acceso a esa carpeta, solo al repositorio). Apuntado en `docs/CONTEXTO-
CORTO.md`, sección "Qué falta".

## 19-sep-2026 — Fila 66: el contacto del tercero, guardado en la ficha

Problema de septiembre de 2027, no de hoy (`docs/CONTACTO-GUARDADO-EN-LA-FICHA.md`, del informe
crítico, parte 4.8): cuando se baje el `RegAlum.csv` del curso siguiente, el alumnado que ya no
esté en el centro desaparece del fichero, y un asunto suyo que siguiera abierto se quedaría sin
teléfono, sin correo y sin tutores legales, con la carpeta ahí pero sin forma de contactar. Igual
con el personal que se traslada.

**`js/datos.js` gana `Datos.fotoDeContacto(persona, categoria)`** (guarda, de una persona ya
encontrada en el CSV, solo lo que de verdad se mira: nombre, documento, Nº de identificación
escolar, grupo/curso, fecha de nacimiento, puesto, y de sus `campos` solo las columnas de
tutor/familia, teléfono, correo, domicilio, cuenta o documento —los mismos patrones que ya usaban
`destacadosAlumno`/`tutoresDe`/`telefonoPropio`/`js/dni.js` para encontrarlas por el título—, más
de qué fichero y de qué fecha) **y `Datos.personaDesdeFoto(contacto, categoria)`** (el camino de
vuelta: una "persona" con la misma forma que el CSV, para que toda la pintura de siempre la acepte
sin saber de dónde ha salido, marcada con `.foto = true`).

`js/ficha-tercero.js` (`buscarPersona`) y `js/via-contacto.js` (`filasDeContacto`, en el cuadro de
la vía de un asunto ya existente) siguen ahora la cascada del encargo: 1) el CSV de hoy, que manda
si está; 2) si no, `ficha.contacto`; 3) si tampoco, sin datos, como siempre. Los buscadores de alta
no la llevan a propósito: ahí interesa el CSV de verdad, nunca una foto vieja. Cuando la persona
viene de una foto, la ficha avisa con una línea gris ("Datos guardados el ... ; esta persona ya no
está en RegAlum.csv").

La foto se guarda sola al crear un asunto (`js/asuntos-nuevo.js`, si se cogió un tercero del CSV o
se acaba de dar de alta). Para los asuntos de antes de esta fila, botón nuevo **"Guardar el
contacto de los asuntos abiertos"** en Ajustes → Mantenimiento (`js/contacto-migracion.js`, mismo
patrón que "Poner en orden las fichas del ARCHIVO" de la fila 64): recorre los abiertos sin
`contacto`, busca a cada tercero en el CSV de hoy y rellena el que encuentra. **Hay que pulsarlo
antes de que acabe este curso**: después de septiembre de 2027 ya no habrá de dónde sacarlo.

De paso, 2.4 del encargo: `solicitantes.csv` ganó la columna **"Curso de alta"** (la rellena sola
`Datos.anadirALista` con el curso de hoy si no se escribe), y Ajustes → Centro ofrece un botón para
apartar (nunca borrar) a `solicitantes-anteriores.csv` los que sean de un curso distinto del de
hoy.

Se comprueba con `pruebas/contacto-guardado.mjs` (sin navegador, seis bloques): crear guarda la
foto; con el tercero en el CSV manda siempre el CSV, hasta si cambia un dato; sin el tercero en el
CSV manda la foto con su fecha; sin foto y sin CSV, sin datos y sin romperse; el botón de rellenar
cuenta y guarda bien sin tocar lo que no debe; y apartar solicitantes de cursos anteriores.

## 19-sep-2026 — Fila 64: la ficha de un asunto archivado, en su propia carpeta

La fila más importante del informe crítico (`docs/INFORME-CRITICO-2026-09-18.md`, 1.1 y 1.3):
`_GESTOR/asuntos.json` llevaba dentro la ficha de todos los asuntos de la vida del centro,
abiertos y archivados, y se reescribía entero entre 50 y 150 veces al día. A los cinco cursos,
más de 17 MB, con lo que eso significa para Dropbox sincronizando entre dos ordenadores.

**El arreglo copia el patrón que ya usaba `js/hitos-archivo.js` con el historial de hitos, tal
como pedía el encargo** ("copiar el patrón, no inventar otro"): `js/ficha-archivo.js`
(`window.FichaArchivo`), nuevo, envuelve `App.cerrarAsunto`/`App.reabrirAsunto`
(`js/asuntos-archivar.js`) por fuera de todo lo demás —va después de `js/hitos-archivo.js` en
`index.html`, así que entra en juego cuando los hitos ya se han movido—. Al archivar, en cuanto
ve `estado === 'cerrado'`, escribe la ficha entera en `_ficha.json` dentro de la propia carpeta
ya archivada y borra la clave de `asuntos.json` con `App.guardarRegistroFresco`. Al reabrir, lee
`_ficha.json` de la carpeta ANTES de que `App.reabrirAsunto` la mueva (en cuanto se mueve, el
manejador viejo deja de servir), deja que la reapertura ponga `estado`/`reabiertoEl`/`reabiertoPor`,
funde encima la ficha guardada (`Object.assign({}, guardada, actual)`, para que esos tres campos
frescos ganen) y borra el fichero de la carpeta, ya de vuelta en abiertos. Un asunto archivado
antes de esta fila no tiene `_ficha.json`: se reabre con ficha vacía, exactamente como pedía el
encargo, sin ningún caso especial.

**Los ocho sitios que leían la ficha de un archivado desde `asuntos.json`, repasados uno a uno**
(sección 3.3 del encargo, más algunos que no estaban en la lista y aparecieron al buscar
`App.E.registro.asuntos` por todo `js/`):

- **`js/archivo-indice.js`**: `entradaDe` guarda ya en cada entrada del índice los pocos campos
  de la ficha que hacían falta para pintar la tarjeta y para buscar (situación, vía, su dato,
  quién lo pidió, relacionados —ahora estructurados, no solo texto—, y los campos propios como
  texto), tomados de la ficha en memoria al archivar (`actualizarIndiceAlArchivar`, en
  `js/asuntos-archivar.js`, que ahora se la pasa) o releídos de `_ficha.json` al reconstruir el
  índice entero. `textoDeBusqueda` ya no recibe una `ficha` aparte: usa la propia entrada.
- **`js/archivo-personas.js`**: `App.verArchivo` monta la ficha de cada tarjeta con esos mismos
  campos del índice (más `categoria`/`tercero`, que `App.reabrirAsunto` necesita para recalcular
  la carpeta si el manejador se ha quedado viejo); `App.verAsuntosDeTercero` lee `_ficha.json` de
  cada carpeta archivada (ya tiene el manejador de `Carpetas.subcarpetas`) en vez de mirar el
  registro.
- **`js/ficha-asunto.js`**: el clic en el nombre de una tarjeta del ARCHIVO llama ahora a
  `FichaArchivo.completar(a)` (resuelve el manejador si hacía falta, con
  `IndiceArchivo.resolverHandle`, y sustituye `a.ficha` por la de verdad) antes de
  `App.abrirFicha`: la ficha detallada pinta de forma síncrona con `a.ficha`, así que tiene que
  llegar ya completa.
- **`js/otros-del-tercero.js`**: `montarArchivado` hace lo mismo con `FichaArchivo.completar` en
  vez de leer `App.E.registro.asuntos`.
- **`js/fichas-huerfanas.js`**: `carpetasSinFicha` ya no cuenta las carpetas del ARCHIVO: no
  tener entrada en `asuntos.json` es lo normal para un archivado, no una huérfana.
- **`js/papelera.js`**: revisado, no hace falta tocarlo — el ARCHIVO no tiene ningún botón
  Borrar (`js/ficha-nombre-acciones.js` solo ofrece "Borrar el asunto" en modo abierto), así que
  nunca llega a leer la ficha de un archivado.
- **`js/unir-asuntos.js`** y **`js/asuntos-archivar.js`**: revisados, operan sobre la ficha del
  asunto que se está archivando/uniendo AHORA MISMO (todavía en `asuntos.json` en ese momento),
  no sobre la de uno ya archivado: no hacía falta tocarlos, salvo pasarle la ficha a
  `actualizarIndiceAlArchivar` (arriba).
- **`js/relacionados.js`**: `asuntosDondeEsRelacionado` (usado en la ficha de una persona, "está
  relacionado con estos asuntos") pasa a ser async y mira también el índice del ARCHIVO
  (`IndiceArchivo.leerDisco`), que ahora guarda los relacionados de cada entrada; sin índice
  hecho, se enseñan solo los abiertos, igual que antes de esta fila para quien no lo tenga
  construido. `App.verFicha` pinta el bloque cuando la promesa responde.
- **`js/ajustes.js`**: `App.contarAsuntosConTipo` (bloquea borrar un tipo si algún asunto lo
  usa) pasa a ser async y mira también el índice, para no dejar borrar un tipo que siguen usando
  cientos de asuntos ya archivados.
- **`js/hitos-panel.js`**: `sigueAbiertoDeVerdad` (evita repintar hitos de un asunto que se
  acaba de archivar mientras se estaba viendo) ya no puede fiarse de "sin ficha en el registro
  = recién encontrado": ahora también puede significar "archivado del todo". Se mira si sigue en
  `App.E.listaAbiertos`.

**Aceptado a propósito, sin arreglar**: renombrar un estado y contar cuántos asuntos usan un
tipo ya no cuentan el histórico completo de archivados sin índice construido (antes sí, porque
la ficha vivía siempre en memoria); con el índice hecho, sí se cuentan. La cuenta del "buscador
de tipos" (badges de la pantalla Nuevo asunto) pasa a contar solo abiertos, lo que de hecho es
más útil (uso activo, no histórico). Ninguno de los dos pierde datos: son cuentas, no fichas.

**La conversión de lo que ya hay** (sección 3.4): botón "Poner en orden las fichas del ARCHIVO"
en Ajustes → Mantenimiento, dentro del propio `js/ficha-archivo.js`. El número de pendientes
(cuántos asuntos con `estado: 'cerrado'` siguen en `asuntos.json`) se calcula sin tocar disco, y
se enseña siempre; localizar la carpeta de cada uno (para el botón de mover de verdad) solo pasa
al desplegar el bloque `<details>`, no cada vez que se pinta la pestaña. Los que no encuentran su
carpeta se cuentan aparte y no se tocan. No se hace nada en silencio al arrancar.

**La prueba** (`pruebas/ficha-del-archivo.mjs`), sin navegador, amplía el patrón de
`pruebas/renombrar-asunto.mjs` cargando también `js/asuntos-archivar.js` y `js/ficha-archivo.js`
de verdad en el contexto `vm` — esta es la primera prueba de la cola que ejercita el
`App.cerrarAsunto`/`App.reabrirAsunto` reales sin navegador: los dos cuadros de confirmación que
abren (`U.preguntar`) se sustituyen por un `async () => true` después de cargar `util.js`, y
`U.aviso`/`App.verAbiertos` por no-ops, ya que aquí no se prueba la interfaz. Comprueba el viaje
completo de una ficha "rica" (notas, campos, lo pide, relacionados) al archivar y al reabrir, la
compatibilidad con un archivado sin `_ficha.json`, `FichaArchivo.completar` y el botón de
conversión. Comprobado a mano que falla (6 comprobaciones) si se desactiva el envoltorio de
archivar, y pasa entero con el arreglo puesto.

**Regresiones cazadas por la batería completa, arregladas en las propias pruebas** (no en el
código: eran las pruebas las que asumían el comportamiento viejo): `pruebas/archivar-atascos.mjs`
(el camino "ya estaba archivado" también mueve la ficha ahora, se lee de `_ficha.json`);
`pruebas/archivo-indice.mjs` (el escenario de un relacionado "que solo vive en la ficha" se monta
con `FichaArchivo.escribir` en la carpeta en vez de inyectarlo en `asuntos.json`, y el de
"archivar añade la entrada al índice; reabrir la quita" reutiliza la ficha que ya tenía a mano en
vez de leerla del registro, que ya no la tiene); `pruebas/relacionados.mjs` (la ficha de un
tercero relacionado con un asunto archivado ahora depende del índice, así que la prueba
reconstruye el índice antes de comprobarlo, como haría Francisco en el uso real).

## 19-sep-2026 — Fila 63: bloqueada, sin salida a internet

`docs/PUBLICAR-SOLO-LA-APP.md` pide comprobar con `curl` qué sirve de verdad
`https://gestor-de-asuntos.vercel.app` (si `docs/`, `pruebas/` y el resto del repositorio se
publican junto con la aplicación) antes de tocar nada. Esta sesión no tiene salida a redes
generales: el proxy de la organización rechaza la conexión (`CONNECT tunnel failed, response
403`, confirmado también contra `www.google.com`, no solo contra Vercel). El propio encargo pide
explícitamente no adivinar en este caso y marcar la fila bloqueada en vez de aplicar el
`.vercelignore` sin comprobar antes si hace falta de verdad. Queda pendiente de una sesión con
salida a internet (o de que Francisco lo compruebe él mismo y lo apunte aquí).

## 19-sep-2026 — Fila 65: documentos que quepan en una subida

Arregla el método, no el código (`docs/DOCUMENTOS-QUE-QUEPAN.md`, partes 3.3 y 3.4 del informe
crítico): `docs/CONTEXTO.md` (244 KB) y `docs/HISTORIA.md` (233 KB) habían roto ya tres subidas
(un `PLACEHOLDER_WILL_REPLACE`, un fichero cortado a la mitad, y las filas 53-56 sin documentar
por no caber). Las reglas 10-14 de `docs/COLA.md` pedían "ten más cuidado"; eso no arregla nada
si depende de que una sesión se acuerde.

**`docs/CONTEXTO.md` partido por módulos**: se queda como índice, reglas comunes de código y la
sección de qué falta/qué está descartado (29,6 KB). El resto —sección 1, "Cómo funciona la
aplicación"— se reparte por zona en `docs/contexto/`: `ASUNTOS.md`, `PERSONAS.md`,
`DOCUMENTOS.md`, `DOCUMENTOS-PDF.md` (separado de `DOCUMENTOS.md` porque juntos pasaban de 40 KB),
`CORREO-Y-SENECA.md`, `HITOS-Y-GUIAS.md`, `CAMPOS-Y-TIPOS.md`, `PANTALLA.md` y
`FICHEROS-DEL-REPOSITORIO.md` (la tabla de ficheros, que sola pesaba 22,7 KB). Ninguno pasa de
39 KB. La partición se hizo con un script (`/tmp/split_contexto.py`, no forma parte del
repositorio) que corta por rango de líneas exacto y verifica que la suma de bytes de todos los
trozos coincide con la del original: **no se ha resumido ni reescrito ni una frase**, solo
movido. Dos paréntesis explicativos se corrigieron de paso (la dirección publicada, que ya era
`https://asuntos.fmargon.com` y no `vercel.app`, en dos sitios de la sección 1).

**`docs/HISTORIA.md` cortado por fecha**: se queda con las entradas del 18 y 19 de septiembre
(28 KB); todo lo anterior (17-sep hacia atrás, más el "Diario heredado" de antes del reparto del
12-sep) se movió tal cual a `docs/HISTORIA-ANTERIOR.md` (201 KB, no se vuelve a tocar). De paso se
corrigió un descuido de esta misma sesión: las entradas de las filas 61 y 62 se habían añadido al
final del fichero con `cat >>` en vez de arriba, rompiendo el orden "lo nuevo primero"; quedan ya
en su sitio.

**Las reglas de la cola, cambiadas** (`docs/COLA.md`): la regla 8 ahora solo obliga a subir
`docs/CONTEXTO-CORTO.md` en la misma subida que el código; `docs/CONTEXTO.md`, sus hijos y
`docs/HISTORIA.md` pueden ir en una subida aparte (la regla 13 pasa de dos a **tres** subidas por
fila, la tercera sin gastar publicación de Vercel porque solo toca `docs/`). Las reglas 9, 11 y 12
añaden que un documento de más de 40.000 caracteres se parte, no se reescribe con cuidado.

**`docs/CONTEXTO-CORTO.md` podado**: el tope pasa de 160 líneas a **14.000 caracteres** (un tope
de líneas no protegía de nada si las líneas podían medir lo que quisieran: la sección "Qué está
hecho" tenía líneas de más de 1.300 caracteres). Esa sección se reescribió a una línea por cosa,
sin números de fila ni fechas (quedan en `HISTORIA.md` y en el documento de cada fila); de
18.861 caracteres el documento entero baja a 13.093.

**Cómo se comprobó** (esta fila no tiene prueba automática, per el propio encargo): a mano,
tamaño de cada documento nuevo (todos por debajo de 40 KB salvo `HISTORIA-ANTERIOR.md`, que no se
vuelve a tocar), suma de bytes de los trozos de `CONTEXTO.md` contra el original (243.638 bytes
en ambos lados), y `npm test` en verde sin que le tocara nada.

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

## Lo anterior al 18-sep-2026

Se ha movido a `docs/HISTORIA-ANTERIOR.md` (fila 65, 19-sep-2026), que no se vuelve a tocar.
