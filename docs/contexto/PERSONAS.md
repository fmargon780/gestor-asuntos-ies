# Terceros, RegAlum, personal, empresas, grupos, DNI y la ficha del tercero

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026). Actualízalo al tocar terceros, contacto, RegAlum/personal.csv, grupos o el alta manual. El índice general, las reglas de código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

Los tutores legales y las Administraciones como tercero (filas 166 y 167), y la lista única de
categorías, viven en `docs/contexto/TUTORES-Y-ADMINISTRACIONES.md`.

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

### El DNI del personal

Fila 29 de `docs/COLA.md`, 17-sep-2026. El personal ya traía el documento (`persona.documento`,
sacado de la columna `DNI/Pasaporte` de Séneca o de `Documento` en `personal.csv` para quien se
dio de alta a mano): solo faltaba subirlo a la vista. A diferencia del alumnado, no lleva ningún
aviso por edad ni por columna que falte: eso es solo de `js/dni.js`, que no se toca.

- `Datos.destacadosPersona` (`js/datos.js`) mete una fila **`DNI`** la primera de todas, por
  encima de `Puesto`, cuando `persona.documento` tenga algo; si no tiene, no hay fila ni aviso.
  Para que no se repita abajo, se quita de `resto` la fila cuyo valor sea igual al documento
  (misma comparación por valor que hace `js/dni.js` con el alumnado).
- `App.piePersona` (`js/asuntos-nuevo.js`) añade `DNI <documento>` al final de la línea de
  debajo del nombre, después de "alta a mano" si toca; antes ya enseñaba el documento a secas,
  en medio de la línea.

Se comprueba con `pruebas/dni-personal.mjs` (sin navegador, con un contexto de mentira que carga
`js/datos.js` y `js/asuntos-nuevo.js`) y con los casos nuevos de `pruebas/logica.mjs`.

### El nombre comercial de las empresas

Columna adicional en el alta. El buscador encuentra al proveedor por cualquiera de los dos
nombres, y por trozos. Debajo del nombre se lee "Rótulo: … · NIF" (`App.pieEmpresa`). **En el
nombre de la carpeta sigue mandando la razón social.** `js/datos.js` lee las columnas por su
título (`porTitulo`), con el sitio de antes como reserva; el fichero se reescribe con la
cabecera nueva la primera vez que se da de alta o se cambia una empresa.

### Cambiar los datos de un tercero

**Escribir las listas** (fila 130): `anadirALista`, `guardarEnLista`, `quitarDeLista` y
`apartarSolicitantesAnteriores` viven en `js/datos-listas.js` (colgadas de `Datos`, mismos nombres).
Cada una va por `ColaGuardado.poner(<fichero del CSV>, …)` y relee el CSV dentro de la cola. Las
copias en conflicto de Dropbox de esos CSV las une `js/conflictos.js` (ver `CONTEXTO.md`).

**Los terceros se releen solos** (fila 132): la caché de `Datos` ya no dura toda la sesión. En la
revisión de `js/conflictos.js` (cada cinco minutos, nunca con un guardado en marcha,
`revisarFechasDatos`) se mira la fecha de cada CSV de `_GESTOR/datos`; si ha cambiado, se olvida
esa categoría (`Datos.olvidar`) y se relee la próxima vez que se pida, sin repintar nada.

Botón "Cambiar los datos" en la ficha de Personas y empresas: abre el mismo cuadro del alta,
relleno, y guarda encima. **Solo para los dados de alta a mano** (`p.deSeneca !== true`). Si
cambia el nombre, las carpetas de sus asuntos de antes conservan el nombre viejo, y se avisa. El
cuadro es uno solo para alta y cambio: `App.cuadroDeTercero`, en `js/asuntos-nuevo.js`, escribe
`Datos.guardarEnLista`. Vive en `js/archivo-personas.js`, se comprueba con `pruebas/empresas.mjs`.

### Aspirantes a plaza ("alumnado pendiente")

17-sep-2026, fila 42, `docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md`. No es una categoría de tercero
aparte: son alumnado dado de alta a mano (`p.solicitante === true`, en `js/datos.js`), la misma
mecánica que ya existía desde antes de esta fila (`solicitantes.csv`, botón "+ Dar de alta un
solicitante" en el buscador y en Personas). Lo que trae esta fila:

- **Documento de identidad**, columna nueva de `solicitantes.csv` (antes solo tenía el Nº de
  identificación escolar). Los dos son opcionales; `window.Dni.de` ya la reconoce sola, porque su
  título contiene "documento" (la misma expresión regular de `js/dni.js` sirve para las dos).
- **Reconocimiento por documento, no solo por Nº o por nombre**: `anadirSolicitantes` (en
  `js/datos.js`) descarta un aspirante que ya está matriculado si su Nº de identificación escolar
  coincide (como antes), si su nombre normalizado coincide (como antes), **o si su Documento de
  identidad coincide con el de un matriculado del RegAlum** (comparado sin espacios ni guiones, en
  mayúsculas, leyendo el documento del matriculado con `window.Dni.de`). Así no se duplica aunque
  el aspirante escribiera su nombre de otra forma. No hay ningún aviso aparte: al recargar, sale ya
  como matriculado y deja de contar como aspirante, sin más.
- **La carpeta sin número**: ya lo hacía `Nombres.terceroAlumno` desde que existen los solicitantes
  (si `alumno.id` está vacío, no añade nada: nunca inventa un número ni usa el DNI). Lo único nuevo
  es la palabra "pendiente de número" en `App.pieAlumno` (`js/asuntos-nuevo.js`), donde antes decía
  "sin Nº de identificación escolar".
- **Al escribir el número más tarde** (botón "Cambiar los datos" en la ficha, categoría ALUMNADO,
  solicitante, sin Nº antes y con Nº después): `App.cambiarDatosDelTercero`
  (`js/archivo-personas.js`) llama a `App.renombrarAsuntosAbiertosDelTercero` (nueva en
  `js/asuntos-editar.js`), que busca en `App.E.abiertos` las carpetas que terminan en el texto de
  tercero de antes (`App.textoTercero`), enseña la lista con `U.preguntar` ("Adelante") y, si se
  confirma, las renombra una a una con `Carpetas.renombrar` —el mismo camino que
  `App.editarAsunto`— moviendo también su ficha en `App.E.registro.asuntos` a la clave nueva. Las
  archivadas no se tocan: no se buscan en `App.E.archivo`, así que nunca entran en la lista.
- **El aviso en "Qué me toca"** (`js/que-me-toca.js`): un bloque nuevo arriba del todo, "N
  aspirante(s) sin Nº de identificación escolar", que cuenta `Datos.cargar(..., 'ALUMNADO').lista`
  filtrando `solicitante && !id`. Se pulsa y lleva a Personas y empresas, categoría Alumnado (no
  filtra solo los pendientes: el buscador ya los marca "Solicitante"). Sin fecha límite ni
  responsable, como pide el encargo.

Se comprueba con `pruebas/logica.mjs` (el documento de identidad y el reconocimiento por
documento, sin navegador) y `pruebas/aspirantes-numero.mjs` (en navegador de verdad: alta sin
número, dos asuntos —uno abierto y uno archivado—, el aviso de "Qué me toca", y que al escribir el
número solo se renombra el abierto).

**Curso de alta y limpieza (19-sep-2026, fila 66, `docs/CONTACTO-GUARDADO-EN-LA-FICHA.md`, 2.4).**
`solicitantes.csv` no se limpiaba nunca solo: arrastraba a los aspirantes de todos los cursos.
`Datos.LISTAS.ALUMNADO.cabecera` tiene ahora una columna más, **"Curso de alta"**, que
`Datos.anadirALista` rellena sola con `U.cursoActual()` cuando quien da de alta no la escribe (sale
como un campo más del cuadro de alta, editable igual que los demás). En Ajustes → Centro,
`App.pintarSolicitantesAnteriores` cuenta con `Datos.contarSolicitantesAnteriores` cuántos son de
un curso que no es el de hoy y ofrece un botón que llama a `Datos.apartarSolicitantesAnteriores`:
mueve esas filas a `solicitantes-anteriores.csv` y las quita de `solicitantes.csv`. **Aparta, no
borra.**

### Dar de alta un tercero desconocido desde el documento

17-sep-2026, fila 42, `docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md`. Va justo después de "Leer los
documentos que entran en Por clasificar" (fila 41, más abajo en este mismo fichero): aquella hace
que la aplicación proponga el tercero cuando lo reconoce; esta cubre el caso contrario, cuando el
documento de identidad no cuadra con nadie.

- **`LectorDocumentos.analizar`** (`js/lector-documentos.js`, sigue puro) gana
  `terceroDesconocido: { categoria, nombre, documento } | null`. Se calcula así:
  - Si ya hay un `tercero` claro, no se calcula nada: no tiene sentido proponer un alta de quien ya
    se ha reconocido.
  - Si hay exactamente UN documento de identidad de los encontrados que no está en ninguna de las
    tres listas de `contexto` ("huérfano"), se busca un nombre o una razón social **cerca de él en
    el propio texto** (una ventana de 120 caracteres a cada lado): una razón social por su forma
    jurídica (`SUFIJOS_EMPRESA`: S.L., S.A., S.COOP., C.B., con o sin puntos) o, si no, dos a cuatro
    palabras con la inicial en mayúscula, al estilo "García Pérez, Ana". Si hay más de un documento
    huérfano a la vez, no se propone nada: no se sabe de cuál es el nombre.
  - Si NO hay ningún documento de identidad en todo el texto, pero tampoco ningún tercero conocido
    cuadra por nombre, se propone igual con el documento vacío, **solo** si aparece una razón
    social con forma clara en algún sitio del texto (patrón exigente, para no disparar con
    cualquier texto en mayúsculas).
  - La categoría propuesta: un NIF siempre es EMPRESAS; un DNI o un NIE toma la categoría del tipo
    ya propuesto (`elegirTipo`) si lo hay —así una solicitud de plaza propone ALUMNADO (aspirante)—
    y si no, PERSONAL por defecto. Es solo el punto de partida: Francisco cambia la categoría en el
    propio cuadro de alta antes de guardar, como pide el encargo.
- **El botón, en `js/documentos-sueltos-lector.js`** (no se ha tocado `js/documentos-sueltos.js`,
  el mismo patrón que la fila 41): debajo de la línea de la propuesta, en su propia línea, "Dar de
  alta: nombre — documento" (`.boton-dar-de-alta`; sin documento si no se encontró ninguno). Nunca
  sale a la vez que "Aceptar": uno solo se propone cuando NO hay tercero claro, el otro cuando SÍ
  lo hay. Al pulsarlo abre `App.cuadroDeTercero` (el alta que ya existe, `js/asuntos-nuevo.js`) con
  el nombre y el documento ya escritos (`COLUMNA_DOCUMENTO`: NIF para EMPRESAS, Documento para
  PERSONAL, Documento de identidad para ALUMNADO); al guardar, `Datos.anadirALista` escribe el CSV
  y la propuesta en memoria se actualiza sola con el tercero recién creado (`propuesta.tercero`,
  buscándolo en la lista que devuelve la propia `anadirALista`) sin volver a leer el PDF: si el
  tipo también estaba claro, "Aceptar" aparece solo, sin recargar la tarjeta.
- La aplicación **nunca da de alta sola**: cancelar el cuadro no escribe nada.

Se comprueba con `pruebas/lector-documentos.mjs` (4 escenarios nuevos: NIF desconocido con razón
social, DNI de un tercero que ya existe sin proponer nada, DNI desconocido en una solicitud de
plaza proponiendo ALUMNADO, y dos documentos huérfanos a la vez sin proponer nada) y con
`pruebas/dar-de-alta-desde-documento.mjs` (en navegador de verdad, con un PDF de mentira: el botón
sale con la razón social y el NIF, abre el alta con los datos escritos, no se da de alta hasta
guardar, y la tarjeta se actualiza sola después).

### Los ficheros de datos, sin trabajo manual

Los CSV de Séneca van en `_GESTOR/datos`. Los que aparecen un piso más arriba se recogen solos
(`js/rescate-datos.js`, con `Carpetas.moverFichero`: copia, comprueba el tamaño y solo entonces
borra). El botón "Traer ficheros de Séneca" (`js/traer-datos.js`) guarda el de alumnado siempre
como `RegAlum.csv`; los de personal conservan su nombre.

### Saltar a otro asunto del mismo tercero, y volver (17-sep-2026, fila 40, docs/SALTAR-A-OTRO-ASUNTO.md)

El bloque "Otros asuntos de este tercero" (fila 37, arriba) ya no pinta solo texto: cada línea se
pulsa y abre la ficha de ese asunto. Vive entero en `js/otros-del-tercero.js`
(`window.OtrosDelTercero`), sacado tal cual de `js/ficha-asunto.js` (`listaDeOtros` y
`pintarOtrosDelTercero`), mismo patrón que `js/relacionados.js`: la ficha solo cuelga el hueco
(`#ficha-otros`) llamando a `OtrosDelTercero.pintarEnFicha(caja, a, modoActual, { categoria,
tercero, tipo })`, con la categoría, el tercero (`nombreDelTercero(a)`, que se queda en
`js/ficha-asunto.js` porque también la usa "Lo pide") y el tipo ya calculados allí.

- **Cada línea es un `<button>`** (antes un `<div>`), con la misma marca `.otros-mismo-tipo` de
  siempre. Al pulsarla:
  - **Un asunto ABIERTO**: se busca por nombre en `App.E.listaAbiertos` y se llama a
    `App.abrirFicha(a, 'abierto')`, igual que `irAlCandidatoAbierto` en `js/duplicados.js`.
  - **Un asunto del ARCHIVO**: **nunca se llama a `App.verArchivo`** (recorre el ARCHIVO entero: la
    operación más cara de la aplicación). Como aquí ya se sabe la categoría y el tercero, el objeto
    se monta a mano, con una sola lectura de carpeta (función interna `montarArchivado`, igual que
    hace `App.verArchivo` en `js/archivo-personas.js` para cada asunto suyo): si el nombre ya está
    en `App.E.listaArchivo` se usa ese objeto tal cual; si no, `padre =
    Duplicados.carpetaDelTercero(categoria, tercero)` (exportada para esto, una línea nueva en
    `window.Duplicados`), `handle = padre.getDirectoryHandle(nombre)`, y el resto de campos
    (`ruta`, `leido`, `ficha`, `busca`) igual que allí.
  - Todo dentro de `try/catch`: si la carpeta ya no está o falla el permiso, un aviso de una línea
    y no se salta a ningún sitio roto.
- **El botón "← Volver a …"**: el módulo guarda `origen = { nombre, modo, categoria, tercero }` la
  **primera vez** que se salta (con la categoría y el tercero del asunto de partida, para poder
  reconstruirlo igual si también es del ARCHIVO); si ya hay origen guardado, no se sustituye, así
  que saltando A → B → C el botón en C sigue diciendo "Volver a A", nunca "Volver a B". Se pinta
  con `OtrosDelTercero.pintarVuelta($('ficha-volver-origen'), a)`, llamado al final de
  `pintarLaFicha`; no sale en la ficha del propio asunto de partida, ni cuando no hay origen. El
  nombre se recorta con CSS (`text-overflow: ellipsis`) para que la cabecera nunca crezca ni se
  parta en dos alturas; el nombre entero va en el `title`.
- **Se olvida el origen**: al pulsar el propio botón de vuelta (tras volver), al pulsar "Volver a
  la lista" (`js/ficha-asunto.js` llama a `OtrosDelTercero.olvidarOrigen()`), y al abrir cualquier
  ficha desde otro sitio (la lista, "Qué me toca", el aviso de duplicados, Por clasificar): el
  módulo envuelve `App.abrirFicha` y borra el origen en cada llamada, salvo cuando la llamada la
  hace el propio módulo (bandera interna `saltandoDesdeAqui`). La envoltura vive dentro del mismo
  cierre del módulo (no aparte, como en otros ficheros), porque necesita ver esa bandera
  directamente.
- `esControlDeSoloLectura` (`js/ficha-asunto.js`) deja encendido `#ficha-volver-al-origen` en modo
  consulta: solo navega, no modifica nada.
- El `<script>` va después de `js/ficha-asunto.js` y de `js/duplicados.js` en `index.html`.

Se comprueba con `pruebas/saltar-a-otro-asunto.mjs`, navegador de verdad, mismo montaje que
`pruebas/quedarse-en-el-asunto.mjs`: las líneas salen como `<button>` pulsables; pulsar un asunto
abierto abre su ficha; el botón de vuelta lleva el nombre de partida y devuelve con un clic;
saltando A → B → C el botón en C sigue diciendo "Volver a A"; al salir por "Volver a la lista" y
entrar en otro asunto desde la lista, el botón ya no sale; y un asunto del ARCHIVO se abre en modo
solo lectura sin que `App.verArchivo` se llame ni una sola vez.

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
- **"+ Añadir varios"** (17-sep-2026, fila 21): abre el mismo buscador en modo `multiple`, con los
  atajos de alumnado y "Meter un grupo entero" encima (ver la sección siguiente). Añade con
  `Relacionados.combinarRelacionados`, sin preguntar uno a uno.

Se comprueba con `pruebas/relacionados.mjs` (el modo de siempre) y con `pruebas/grupos.mjs` /
`pruebas/grupos-navegador.mjs` (el modo `multiple` y los grupos).

### Grupos de personas (17-sep-2026, fila 21, docs/GRUPOS-DE-PERSONAS.md)

Señalar varios terceros a la vez, en vez de uno por vuelta al cuadro, y guardar listas con
nombre ("equipo directivo", "tutores de 1º…") que sirven tanto para relacionar de golpe con un
asunto como para poner los destinatarios de un correo.

**El modo `multiple` de `App.pintarBuscadorDeTercero`** (`js/asuntos-nuevo.js`), opcional y sin
tocar el modo de siempre:

- `App.pintarBuscadorDeTercero(contenedor, categoriaInicial, alElegir, { multiple: true,
  marcadosIniciales, alCambiarCategoria })`. Cada resultado lleva una casilla
  (`.resultado-marcable`) en vez de pulsarse; `estado.marcados` (un objeto, clave
  `categoria + '|' + nombre`, fuera de `buscar()`) sobrevive a cambiar de búsqueda y de
  categoría. Devuelve `{ marcar(lista), marcados() }` para que quien llama pueda señalar desde
  fuera (los atajos, un grupo entero); en el modo de siempre no devuelve nada.
- La barra fija (`#rel-marcados-barra` / `.marcados-barra`) enseña la cuenta, el botón "Añadir los
  N señalados" (llama a `alElegir` UNA VEZ, con la lista entera) y un chip por señalado con su ×
  para quitarlo sin tener que volver a buscarlo — es la única forma de quitar uno que no salga
  en ningún resultado (un miembro de un grupo que ya no está en las listas).
- **Miembros perdidos**: si `marcadosIniciales` trae uno sin `persona` (los de un grupo guardado,
  que solo llevan `{ categoria, nombre }`), se resuelve contra `Datos.cargar` de su categoría
  (`resolverPerdidos`, una lectura por categoría, no una por miembro); si no aparece, se marca
  `perdido: true` y el chip sale en gris (`.marcado-chip-perdido`) con su aviso, sin quitarse
  solo. Los que traen `persona` (los atajos, ya resueltos) no se comprueban.
- `App.textoTercero(p)` es el nombre canónico que se guarda (igual que el modo de siempre): un
  miembro se identifica por `categoria + nombre`, nunca por el objeto `persona`.

**Los atajos de alumnado** (`Nombres.nivelYEnsenanza(unidad)`, en `js/nombres.js`): reutiliza el
mismo análisis de texto que `grupoCompacto` (`etapaDe`, `sinPalabrasDeEtapa`, sacadas a función
para no duplicarlo), y devuelve `{ nivel: '1º', ensenanza: 'E.S.O.' }` (`Bachillerato`,
`Formación Profesional` o `PMAR` cuando la etapa se escribe). Los tres filtros —unidad, nivel,
enseñanza— viven en `js/relacionados.js` (`filtrarPorUnidad`, `filtrarPorNivel`,
`filtrarPorEnsenanza`; exportados y sin efectos), y los reutiliza también `js/correo.js`: solo
entra el alumnado `matriculado` de este curso (`Datos.unidadesDistintas` ya filtra por eso), y
elegir un atajo solo señala, no añade nada todavía.

**Grupos propios**, `js/grupos.js` (`window.Grupos`), decimotercer fichero compartido
(`_GESTOR/grupos.json`, ver la tabla de ficheros): `{ grupos: [{ id, nombre, miembros: [{
categoria, nombre }], creadoPor, creadoEl }] }`. `Grupos.guardar()` relee el disco y fusiona por
`id` antes de escribir (como `App.fusionarConDisco`, pero para el fichero envuelto en `{ grupos:
[...] }` en vez de una lista suelta). Bloque "Grupos de personas" en Ajustes (`js/ajustes.js`,
`App.pintarGruposPersonas`), mismo aire que tipos/estados/tipos de documento: crear, cambiar el
nombre, "Ver y cambiar los miembros" (abre el buscador en modo `multiple` con
`marcadosIniciales: g.miembros`, y al pulsar "Añadir" **sustituye entera** la lista de miembros,
no la suma: así también se puede QUITAR a alguien) y borrar por papelera
(`Papelera.mandarDato('grupo', ...)`, con `devolverGrupo` en `js/papelera.js` delegando en
`Grupos.devolver`).

**En Relacionados**: "+ Añadir varios" (arriba) abre el buscador `multiple` con, encima, los tres
atajos de alumnado (solo si la categoría elegida es ALUMNADO) y "Meter un grupo entero"
(desplegable con los grupos de `Grupos.lista()`); elegir uno de los dos solo señala.
`Relacionados.combinarRelacionados(actuales, categoriaPrincipal, terceroPrincipal, candidatos)`
(sin efectos) decide qué entra: nunca el propio tercero del asunto, nunca un duplicado exacto
(por `categoria` + nombre normalizado) de lo que ya había; sin preguntar uno a uno como
`validarYAgregar` (con veinte señalados serían veinte cuadros). Un aviso final resume añadidos,
ya-estaban y propio-tercero.

**En Correo** (`js/correo.js`): desplegable "Añadir un grupo" (grupos propios + los mismos
atajos de alumnado, con `<optgroup>`), solo en el cuadro de correo normal (no en el de Séneca).
Decisión de Francisco, 17-sep-2026: los destinatarios de un grupo van **siempre en copia oculta**,
nunca en Para, para que una familia no vea el correo de las demás.

- `combinarCorreosDeGrupo(miembrosConPersona)` (sin efectos): de cada miembro saca TODOS sus
  correos (`correosDe`, la misma máquina que ya usa "Para": busca la arroba en cualquier columna,
  no por título), sin repetidos (por dirección en minúsculas); quien no tenga ninguno va aparte,
  en `sinCorreo`.
- `resolverMiembros(miembros)` busca la ficha de cada uno que no la traiga ya puesta (los atajos
  sí, los de un grupo guardado no: solo llevan `{ categoria, nombre }`), una lectura de
  `Datos.cargar` por categoría, no una por miembro.
- La caja `#correo-cco-caja` pinta la cuenta, un chip por dirección (con su × — `js/correo.js`
  guarda el estado en `cco`, un objeto tipo `Set`) y la línea "N no tienen correo: …" si hace
  falta. `ccoDelCuadro()` es a `cco` lo que `paraDelCuadro()` es a "Para".
- `abrirGmail()`/`abrirDelOrdenador()` añaden `&bcc=...` cuando hay copia oculta. Si el borrador
  se prepara con documentos (`js/correo-adjuntos.js`, `.envio.json`), el campo nuevo `cco` viaja
  igual que `para` (`ccoActual()`, misma técnica que `paraActual()`: se lee del propio DOM, de
  los chips, para no exponer nada solo para esto).
- **Apps Script** (`apps-script/gestor-correos.gs`, `mandarUnBorrador`): `opciones.bcc =
  encargo.cco` cuando lo trae; si no hay nadie en "Para" pero sí hay `cco`, el destinatario es
  `Session.getActiveUser().getEmail()` (Gmail no admite un borrador sin nadie en Para). **Hay que
  volver a pegar el script en `script.google.com`.**

**En Séneca** (17-sep-2026, fila 47, `docs/DESTINATARIOS-EN-SENECA.md`): la mensajería de Séneca
no usa correos, usa **usuarios IdEA**. Francisco lo comprobó en Séneca de verdad: pegar el valor
con la arroba delante vale, pero hace falta esperar algo más de un segundo y lanzar la flecha
abajo para que el sistema se quede con el destinatario elegido (detalle en `docs/HISTORIA.md`).

- `js/idea.js` (`window.IdEA`), sin pantalla, calcado de `js/dni.js` (busca por el TÍTULO de la
  columna, nunca por su posición): `IdEA.usuarioDe(persona)` vale con un título que lleve "idea"
  o "usuario", nunca si lleva "clave"/"contraseña"/"pin"/"correo"; un título con
  "tutor"/"padre"/"madre"/"responsable"/"familia" es el del tutor legal, aparte, en
  `IdEA.usuarioDelTutor(persona, 1|2)` (mismo patrón que `LoPide.datosDeTutor` para distinguir
  tutor 1 de tutor 2 por el título). El valor solo se acepta si parece un usuario (4-30
  caracteres, sin espacios ni arroba; si la trae delante, se quita). `IdEA.usuariosDeGrupo(...)`
  junta sin repetidos, como `combinarCorreosDeGrupo`. El usuario IdEA del alumnado y de los
  tutores legales **todavía no se importa** (fichero aparte, pendiente de que a Francisco le
  reactiven el perfil de Gestor de PASEN): el del profesorado y el PAS ya viene en su CSV.
- `js/correo.js` expone `window.CorreoGrupos` (`opciones`/`miembrosDeOpcion`/`resolverMiembros`,
  las mismas piezas privadas de "Añadir un grupo" de Correo) para no duplicarlas: el desplegable
  del cuadro de Séneca es literalmente el mismo HTML que el de Correo, solo cambia lo que se hace
  al elegir uno.
- `js/seneca-destinatarios.js` (`window.SenecaDestinatarios`), aparte para no engordar
  `js/correo.js`: al elegir un grupo, saca usuarios IdEA (`IdEA.usuariosDeGrupo`) en vez de
  correos y los pinta en `#seneca-destinatarios` (chips con la arroba delante y su ×, la cuenta
  arriba, "N sin usuario IdEA: …" cuando falte alguno). Estado en memoria (`destinatarios`,
  `sinUsuario`, `copiados`), reiniciado en cada apertura del cuadro (`limpiar()`, llamado desde
  `abrirCuadro`). Botón **"Copiar la lista"**: todos al portapapeles, uno por línea, con la
  arroba (`textoDelaLista`). Botón **"Copiar el siguiente"**: copia solo el primero que quede sin
  copiar (`siguienteSinCopiar`) y lo marca (clase `.marcado-chip-copiado`, `css/relacionados.css`)
  sin quitarlo de la lista, para poder pegarlo a mano en Séneca uno detrás de otro.
- `js/seneca-ayudante.js` (`window.SenecaAyudante`): el enlace-marcador que Francisco **arrastra
  una vez a la barra de marcadores** (no se pulsa: pulsarlo en el propio gestor solo avisa de
  eso). `textoDelMarcador()` monta el texto "javascript:…" a partir de un código de verdad
  (`CODIGO_INTERNO`, legible, no minificado a mano) que se ejecuta dentro de la pestaña de Séneca:
  lee el portapapeles (`navigator.clipboard.readText`), busca el campo (`document.activeElement`
  si es un input de texto; si no, el primero visible de la página, mirando también dentro de los
  `iframe` a los que se pueda entrar) y, por cada usuario, pone el valor con arroba, dispara
  `input`/`keyup`, **espera 1.400 ms**, dispara `ArrowDown` y `Enter`, espera 400 ms más y sigue.
  Pinta arriba a la derecha "Metiendo N de M" con un botón "Parar". Si no encuentra campo o el
  portapapeles viene vacío, lo dice ahí mismo: "Haz clic dentro del campo de destinatarios y
  vuelve a pulsar". `insertarEnlace(contenedor)` pinta el enlace y sus tres frases (arrastrar,
  permiso del portapapeles la primera vez, usar "Copiar el siguiente" si no funciona); se llama
  desde Ajustes (`js/ajustes-mantenimiento.js`, pestaña "Mantenimiento") y desde el propio cuadro
  de Séneca. **El ayudante puede no funcionar** si Séneca ignora eventos que no vienen de un
  teclado de verdad: por eso "Copiar el siguiente" es la red de seguridad, no depende de él.
- No se manda ningún mensaje desde la aplicación (Séneca no lo permite), no se hace el filtro por
  pantallas de Séneca (el de los clics, que es justo lo que se evita) y no se guarda ningún
  usuario IdEA en `_GESTOR`: sale siempre de los CSV, como el DNI.

Se comprueba con `pruebas/idea.mjs` (sin navegador: `usuarioDe` con títulos buenos y malos, con la
arroba delante, con valores que no parecen un usuario, con las columnas de tutor;
`usuariosDeGrupo` con repetidos y con gente sin usuario), `pruebas/seneca-destinatarios-
navegador.mjs` (navegador de verdad: el desplegable sale en el cuadro de Séneca, elegir un grupo
pinta los chips y la línea de sin-usuario, "Copiar el siguiente" avanza de uno en uno) y
`pruebas/seneca-ayudante.mjs` (sin navegador: el texto del marcador se genera, empieza por
"javascript:" y su código es JavaScript válido; contra Séneca de verdad lo prueba Francisco).

Fuera de esta fila, a falta de datos que la aplicación no tiene: departamentos, tutorías y
equipos educativos (`personal.csv` no guarda esa información).

Se comprueba con `pruebas/grupos.mjs` (sin navegador: `nivelYEnsenanza`, los tres filtros,
`combinarRelacionados`, `combinarCorreosDeGrupo`) y `pruebas/grupos-navegador.mjs` (navegador de
verdad: un miembro perdido se conserva y se ve distinto, señalar no se pierde al cambiar de
categoría ni de búsqueda, "Meter un grupo entero" en Relacionados, "Añadir un grupo" en Correo).

### La foto del contacto en la ficha (19-sep-2026, fila 66, `docs/CONTACTO-GUARDADO-EN-LA-FICHA.md`)

El problema es de septiembre de 2027, no de hoy: cuando se descargue el `RegAlum.csv` del curso
siguiente, el alumnado que ya no esté en el centro desaparece del fichero, y un asunto suyo que
siguiera abierto se quedaría sin teléfono, sin correo y sin tutores legales. Lo mismo con el
personal que se traslada.

**`ficha.contacto`**, un bloque pequeño y opcional dentro de la ficha de un asunto (nunca de uno
archivado: su ficha vive en su propia carpeta desde la fila 64, y viaja entera con ella). Lo crean
dos funciones nuevas de `js/datos.js`:

- `Datos.fotoDeContacto(persona, categoria)` — de una persona ya encontrada en el CSV, guarda solo
  lo que de verdad se mira: nombre, documento, Nº de identificación escolar, grupo/curso, fecha de
  nacimiento, puesto, y de `persona.campos` **solo** las columnas de tutor/familia, teléfono,
  móvil, correo, domicilio, cuenta o documento de identidad (`CAMPO_UTIL`, la misma lista de
  patrones que ya usan `destacadosAlumno`, `tutoresDe`, `telefonoPropio` y `js/dni.js` para
  encontrar esas columnas por el título). Nunca el CSV entero. Añade `fichero` (`RegAlum.csv` /
  `RelPerCen.csv` / `<categoría>.csv`) y `fecha` (`U.hoyIso()`, de hoy).
- `Datos.personaDesdeFoto(contacto, categoria)` — el camino de vuelta: reconstruye una "persona"
  con la misma forma que devuelve el CSV (mismos nombres de campo), para que
  `destacadosAlumno`/`destacadosPersona`/`tutoresDe`/`telefonoPropio`/`resumenDeTercero` y
  `window.Dni` la acepten sin saber de dónde ha salido. Lleva `.foto = true`, `.fotoFecha` y
  `.fotoFichero` para que quien la pinte pueda avisar de que son datos guardados, no de hoy.

**El orden al buscar a un tercero, en `js/ficha-tercero.js` (`buscarPersona`) y en
`js/via-contacto.js` (`filasDeContacto`, solo en el cuadro de la vía de un asunto que ya existe):**
1) el CSV de hoy, como siempre —manda si está—; 2) si no está, `ficha.contacto` con
`Datos.personaDesdeFoto`; 3) si tampoco hay eso, sin datos, como antes de esta fila. Los
buscadores de alta (`asuntos-nuevo.js`, `relacionados.js`, etc.) **no** llevan este camino: ahí se
busca en el CSV a propósito, para no dar de alta a nadie con datos viejos.

`js/ficha-tercero.js` pinta, cuando la persona viene de una foto, una línea gris debajo de "Datos
y contacto": "Datos guardados el 5 de septiembre de 2026; esta persona ya no está en
RegAlum.csv." (`avisoDeFotoHtml`).

**Cuándo se guarda la foto**: `js/asuntos-nuevo.js`, al crear el asunto, si `App.E.nuevo.tercero`
tiene algo (se cogió del CSV o se acaba de dar de alta): `datosNuevoAsunto.contacto =
Datos.fotoDeContacto(...)`. Los asuntos de antes de esta fila no la tienen: `js/contacto-
migracion.js` añade el botón "Guardar el contacto de los asuntos abiertos" en Ajustes →
Mantenimiento (mismo patrón que "Poner en orden las fichas del ARCHIVO", fila 64: un número barato
al pintar la pestaña, el trabajo de verdad solo al desplegar o pulsar), que recorre los abiertos
sin `contacto`, busca a cada tercero en el CSV y rellena el que encuentra, sin tocar el que ya
tenía foto. **Hay que pulsarlo antes de que acabe este curso.**

Se comprueba con `pruebas/contacto-guardado.mjs` (sin navegador): crear guarda la foto; con el
tercero en el CSV manda el CSV, incluso si cambia un dato; sin el tercero en el CSV manda la foto,
con su fecha y su fichero; sin foto y sin CSV, sin datos y sin romperse; el botón de rellenar
cuenta y guarda bien, sin tocar los que ya tenían foto ni los cerrados.


### La ventana «Ver todo» del alumno, en tarjetas (24-sep-2026, fila 108, `docs/CONTACTO-EN-TARJETAS.md`)

`js/ficha-tercero-alumno.js` (`FichaTerceroAlumno.ventana(persona, resumen, a)`, que devuelve
`{ html, titulo, montar(raiz), alCerrar() }`); `js/ficha-tercero.js` (`abrirVerTodo`) solo la llama
para ALUMNADO. Personal y el resto de terceros no cambian.

- **Cabecera**: círculo con iniciales, nombre en orden natural (`Datos.nombreNatural`), «13 años ·
  nacido el …» («nacida» si la columna `Sexo` del alumno dice mujer; si no se sabe, «nacimiento:
  …») y tres etiquetas: unidad (azul), estado de la matrícula (verde si está matriculado) y NIE con
  su copiar. «Curso» ya no sale: la unidad lo dice.
- **Tarjetas del mismo ancho** (`.vt-tarjetas`, en columna por debajo de 900px): el alumno, cada
  tutor que traiga algo (círculo, nombre entero de título y etiqueta «Tutora 1»/«Tutor 2»/«Tutor
  legal N» según su sexo; nunca «Madre»/«Padre»; si Séneca trae relación o parentesco, manda esa)
  y «Otros datos de la familia» solo si hay algo. Dentro, teléfono(s), correo(s) y DNI, con icono y
  copiar; los teléfonos en grupos de tres, copiados sin espacios; un teléfono repetido del alumno
  sale una vez, y si coincide con el de un tutor, «mismo que la tutora 1».
- **Abajo**: «Correo a la familia» (cierra la ventana y abre `CorreoNucleo.abrirCuadro(a, false,
  { correoPreferente })` con los correos de los tutores; sin correos de tutor, no sale) y «Copiar
  todo el contacto» (una línea por persona). A la derecha, «Todo lo que trae Séneca», como antes.
- **El arreglo de fondo** (`js/datos-tutores.js`, sacado de `js/datos.js`): el número del tutor es
  el pegado a «tutor» («Primer apellido **Segundo tutor**» es del 2); el nombre se monta con nombre +
  primer apellido + segundo apellido (o una columna entera, dándole la vuelta a «Apellidos,
  Nombre»); `sexo` (M/H/vacío) e `iniciales` son campos nuevos, sin cambiar los que ya había.

Se comprueba en `pruebas/ficha-tercero.mjs` (escenario 9, el caso real de las ocho columnas).

### Matriculados primero, familias y hermanos (24-sep-2026, fila 125, `docs/BUSCAR-PERSONAS-Y-FAMILIAS.md`)

En Personas y empresas, categoría ALUMNADO (`js/personas-familias.js`, `window.PersonasFamilias`,
llamado desde `App.buscarPersonas` y `App.verFicha` de `js/archivo-personas.js`, sin envolver nada):

- **La lista en bloques** (`PersonasFamilias.pintar` / `resultados`): arriba «Familias (N)» si algún
  tutor casa; luego los matriculados de este curso y los aspirantes (`p.matriculado || p.solicitante`);
  debajo, `<details class="personas-antiguos">` «Antiguos (N)», plegado (abierto si no hay nada más;
  si se abre a mano, se recuerda mientras la página siga abierta). El tope de 60 de `Datos.buscar` va
  por bloque; N es el total de antiguos. Las demás categorías, como siempre.
- **El índice de tutores** (`indice(lista)`, guardado como `_familias` en la propia lista de
  `Datos.cargar`, así que se rehace solo con `Datos.olvidar`): de cada alumno **matriculado**, sus
  tutores de `Datos.tutoresDe`, unidos por DNI sin espacios, puntos ni guiones (sin DNI, por nombre
  entero normalizado), con sus hijos matriculados y su etiqueta («Tutora 1»…, la de
  `FichaTerceroAlumno.etiquetaDeTutor`). `porAlumno` da los tutores de cada alumno.
- **Buscar por la familia** (`buscarFamilias`): desde 3 caracteres; un tutor casa si su nombre, DNI,
  teléfonos y correos tienen todas las palabras, o si lo escrito, sin espacios ni puntos, está en su
  DNI o teléfono compactos. Tarjeta `.familia-tarjeta`: nombre, etiqueta, DNI · teléfonos · correos,
  y un botón por hijo (nombre, grupo · curso) que abre su ficha.
- **Hermanos en el centro** (`hermanosDe`, `filasConHermanos`): en la ficha del alumno, detrás de
  «Curso» (o de la última fila de matrícula), los matriculados que comparten un tutor, sin él;
  pulsables. Sin hermanos, la fila no sale.
- **La ficha acompaña** (`css/personas.css`): `#ficha-persona` es `position: sticky` bajo
  `--cabecera-fija-alto`, con su propia barra; en pantallas estrechas, normal. La tarjeta de quien se
  está viendo lleva `.resultado-elegido` (`marcarTarjeta`/`marcarVista`, por `data-persona` =
  categoría + Nº o nombre), en todas las categorías.

Se comprueba con `pruebas/personas-familias.mjs` (sin navegador).

### El alumnado de la base de datos, desde la carpeta de Drive (25-sep-2026, filas 142 y 144, `docs/ALUMNADO-BD-DESDE-DRIVE.md`)

El acuerdo entre las dos aplicaciones está en `docs/ACUERDO-ALUMNADO.md` (versión 2: un archivo en
Drive, nada de dirección web ni clave; la fila 142 lo hacía por dirección web y la 144 lo quitó).

- **La carpeta** (`js/alumnado-bd.js`): Ajustes › El centro › «Carpeta de la base de datos de
  alumnado» → «Señalar la carpeta» (la «Datos de matrícula» de Google Drive para ordenador). Se
  recuerda en este ordenador (Almacen, `alumnado-bd-carpeta`), como las del Dropbox; el otro
  ordenador no la señala y usa la copia. Debajo, la última copia (alumnos, datos y fecha).
- **Traer**: al entrar (sin pedir permiso) y con «Traer el alumnado ahora» en Mantenimiento (pide
  permiso si hace falta). Si el `ALUMNADO-BD.json` de la carpeta es válido (`acuerdo: 2`, `campos`,
  todos con `idEscolar`) y su `generado` es más nuevo que el de la copia, se copia a
  `_GESTOR/datos/ALUMNADO-BD.json` por `ColaGuardado`. Si no vale, la copia y ámbar (`U.accesorio`).
  La copia se lee una vez y queda en memoria (`AlumnadoBD.leer`, `enMemoria`).
- **Mezcla**: `js/datos-alumnado.js` llama a `AlumnadoBD.unir(lista, porId, fechaRegAlum)`. El
  RegAlum sigue siendo la base: el archivo no añade personas. A cada alumno que esté en los dos le
  pone `bd` (sus `datos`) y `bdGenerado`; si el archivo no es más viejo que el RegAlum, manda en
  `matriculado` y en las columnas del RegAlum que se llamen igual que una `etiqueta`; si es más
  viejo, solo rellena las vacías.
- **Todo guiado por `campos`** (`js/alumnado-bd-ver.js`): ningún dato con nombre propio salvo
  `idEscolar` y `matriculado`. Cada tipo a su manera (`lista` con comas, `si-no`, `fecha`
  dd-mm-aaaa, `tabla` como tabla; lo desconocido, como texto).
  - Ficha («Ver todo» del alumno): una tarjeta plegada por `apartado`, con resumen en el título y la
    fecha de los datos al pie.
  - Plantillas: tabla «ALUMNADO BD» (una columna por dato) y una tabla «ALUMNADO BD <etiqueta>» por
    cada dato de tipo `tabla`, unidas por Nº escolar (ver `TABLAS-DE-DATOS.md`). En el cuadro de
    insertar huecos, agrupados por apartado («Alumnado · …»).
  - Relacionados: en las altas por grupo de alumnado, «Por datos del alumnado»: uno o varios datos
    con su valor (desplegable con los que hay), cuántos salen y «Añadirlos». Solo matriculados,
    salvo «Incluir antiguos». Quien no está en el RegAlum no se puede añadir (se cuenta aparte).
- **Frescura**: `js/frescura.js` usa `generado` si es más reciente que el RegAlum.
