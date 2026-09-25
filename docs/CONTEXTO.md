# Proyecto: Gestor de Asuntos / Expedientes — IES Fuente Lucena

Documento técnico, **para programar**: solo lo que es verdad hoy, sin fechas ni relatos. Para
decidir, lee primero `docs/CONTEXTO-CORTO.md` (dirección, reglas de nombres, qué está hecho, qué
falta). El porqué de cada decisión y el diario completo están en `docs/HISTORIA.md`.

---

## 0. Documentos por zona (fila 65, 19-sep-2026)

Este documento es el índice y las reglas comunes. El detalle de cada zona vive en su propio
documento hijo, dentro de `docs/contexto/`, por debajo de 40 KB cada uno. Al terminar una
instrucción de la cola que toque una zona, se actualiza su documento hijo, no este índice (salvo
que cambie algo general).

| Documento | Qué lleva |
|---|---|
| `docs/contexto/ASUNTOS.md` | Crear, editar, la ficha, "Lo pide" y duplicados de un asunto |
| `docs/contexto/ASUNTOS-ARCHIVO.md` | Papelera, archivar/reabrir, atascos, índice del ARCHIVO y fichas huérfanas (partido de `ASUNTOS.md` en la fila 78) |
| `docs/contexto/PERSONAS.md` | Terceros, RegAlum, personal, empresas, grupos, DNI y la ficha del tercero |
| `docs/contexto/DOCUMENTOS.md` | El nombre y el registro de un documento, el código de verificación, "Por clasificar" |
| `docs/contexto/DOCUMENTOS-PDF.md` | Generar el documento de Word, separar/unir un PDF y ajustar su tamaño |
| `docs/contexto/TABLAS-DE-DATOS.md` | Las tablas de datos (tutorías de Séneca, `datos/Tablas`), sus huecos y el certificado de función tutorial (fila 110) |
| `docs/contexto/CORREO-Y-SENECA.md` | La bandeja de Gmail, sus adjuntos, las plantillas de correo y el cuadro de Séneca |
| `docs/contexto/HITOS-Y-GUIAS.md` | Las guías del procedimiento, los hitos de un asunto, "Qué me toca" y "Cuentas" |
| `docs/contexto/ESTADO-DEL-ASUNTO.md` | El estado del asunto es su hito actual: los dos montones, «Esperando a…», «Estamos en este paso», la guía mínima (fila 129) |
| `docs/contexto/HITO-MESA.md` | El hito a pantalla completa (la mesa de trabajo), su guion y "Traer los guiones del instituto" (fila 109) |
| `docs/contexto/CAMPOS-Y-TIPOS.md` | Los campos propios y calculados de cada tipo de asunto, y Ajustes de un tipo |
| `docs/contexto/PANTALLA.md` | La cabecera fija, el refresco, la barra lateral, el tablón, el panel de lectura, la presencia |
| `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` | La tabla de todos los ficheros del repositorio, uno por uno |

**Por qué está partido así** (antes de la fila 65 esto era un único documento de 244 KB): tres
averías de fichero (`docs/HISTORIA.md`) salieron de reescribir ficheros demasiado grandes para
cambiar dos frases. Partir por módulos hace que cada subida solo toque el trozo que de verdad ha
cambiado. Detalle completo en `docs/DOCUMENTOS-QUE-QUEPAN.md` y en `docs/HISTORIA.md`.

## 1. Cómo funciona la aplicación

Web publicada en Vercel bajo el dominio propio **https://asuntos.fmargon.com** (proyecto
`gestor-de-asuntos`, equipo `team_gnCjBLTS8m8PNTFVUf7ST0uN`), que trabaja sobre la carpeta de
Dropbox del propio ordenador, con el selector de carpetas del navegador (Chrome o Edge). Sin
cuenta de Dropbox, sin servidor y sin base de datos aparte: los datos no salen del ordenador. La
dirección de Vercel, `https://gestor-de-asuntos.vercel.app`, sigue viva y sirve para comprobar lo
publicado con `curl` desde fuera del centro (la red del IES bloquea `vercel.app`).

Las carpetas señaladas y el nombre de usuario se guardan en el navegador (IndexedDB, ver la
sección 6) **atados a la dirección de la web**: si la dirección cambia, hay que volver a
señalarlas.

Decisiones de diseño:

- Primero se elige la categoría (ALUMNADO, PERSONAL, EMPRESAS, OTROS), y después el tipo.
- Los tipos de asunto se crean en Ajustes o, con nombre, nombre corto y categoría, desde Nuevo
  asunto («+ Crear tipo nuevo», `js/tipo-al-vuelo.js`, fila 128); la guía, los campos y las
  plantillas, siempre en Ajustes. Los de DOCUMENTO sí se crean al vuelo, desde el propio cuadro.
- Se puede ver el archivo completo de un tercero.
- La ficha del alumnado enseña arriba la edad actual, el DNI y el contacto de los tutores.
- Además de arrastrar un documento a la carpeta, se puede elegir desde la app en la carpeta
  donde esté: se guarda una copia ya con el nombre montado, y el original se queda donde estaba.

**Estado del asunto.** Es su hito actual («Paso N de M · título»), y de él sale solo si va en
"Pendiente de Administración" o en "Pendiente de terceros" (fila 129,
`docs/contexto/ESTADO-DEL-ASUNTO.md`). Ya no hay estados escritos a mano: `estados.json` se sigue
leyendo pero no se enseña ni se edita.

**Vía de comunicación preferente.** Es del asunto, no del tercero. `js/via-contacto.js` ofrece
como botones los teléfonos o correos que ya están en el CSV del tercero, tanto en
`App.editarVia` (el cuadro de siempre, que sigue usando la tarjeta de la lista) como, desde el
18-sep-2026 (fila 52), dentro del cuadro "El encargo" de la ficha del asunto
(`LoPide.controles`).

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
dentro, abajo a la izquierda, con fecha y hora de España (`10-sep-2026 · 13:55`). Sirve también
para comprobar que Vercel ha publicado de verdad (ver la sección 8). **Desde la fila 76
(25-sep-2026, `docs/VERSION-AL-PUBLICAR.md`) la web la genera sola al publicar**: el
`buildCommand` de `vercel.json` (`scripts/version-al-publicar.mjs`) escribe la hora de España de
ese momento en la copia que sirve Vercel, sin ningún commit (el fichero de git no cambia; si algo
falla, se queda la escrita). La escrita a mano en `js/version.js` sigue haciendo falta: la usan
la copia sin internet (que se genera del repositorio y solo se actualiza si cambia) y quien abra
`index.html` en local. Así que se sigue poniendo en cada subida de código, **con la hora real**,
sacada del reloj (`TZ='Europe/Madrid' date`), nunca a ojo ni sumando algo a la de antes (aviso de
Francisco del 17-sep-2026; receta exacta en `js/version.js`).


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

**Ningún fichero de `js/` pasa de 600 líneas** (fila 133, 24-sep-2026,
`docs/PARTIR-FICHEROS-GRANDES.md`). Si uno crece, se parte por temas en trozos de menos de 400,
moviendo funciones enteras: el estado que comparten va en un objeto interno (`X._interno`, o
`window.XNucleo`), cada trozo se carga en `index.html` justo después de su origen, y las pruebas
que cargan el origen suelto (con `vm`) cargan también sus trozos.

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
- `vercel.json` manda `Cache-Control: public, max-age=0, must-revalidate` para todo, y desde la fila
  132 `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y `Content-Security-Policy:
  frame-ancestors 'none'; object-src 'none'; base-uri 'self'` (a propósito, sin política de scripts
  ni de conexiones: la aplicación llama a Apps Script, usa `blob:` y tiene manejadores en línea).
- **El plan gratuito (Hobby) solo da 100 publicaciones al día** (fila 48, 17-sep-2026,
  `docs/NO-GASTAR-PUBLICACIONES.md`): se agotaron una vez, con `main` recibiendo 100 commits en
  un día, más de la mitad de ellos solo `docs/COLA.md` y compañía, y cada push a una rama
  `claude/...` con pull request abierto gastando además su propia vista previa. `vercel.json`
  gana `ignoreCommand`: se salta la publicación cuando la rama no es `main`, o cuando el cambio
  solo toca `docs/`, `pruebas/`, `.github/` o ficheros `.md` (comparando contra
  `VERCEL_GIT_PREVIOUS_SHA`, el commit de la última publicación buena, no siempre `HEAD^`: con
  dos commits en el mismo push —código y luego documentos— comparar solo con `HEAD^` se saltaría
  la publicación del código). Ante cualquier duda, publica. **`ignoreCommand` no puede pasar de
  256 caracteres** (Vercel lo rechaza si se pasa: pasó la primera vez, con 296): la receta vive
  en `scripts/vercel-ignore-build.sh`, y `ignoreCommand` solo lo llama. Y la regla 13 de
  `docs/COLA.md`: como mucho dos subidas por fila. Prueba: `pruebas/vercel-ignore-command.mjs`.

### Ficheros del repositorio

La tabla completa, fichero por fichero, vive en `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (fila 65, 19-sep-2026: se movió aquí por tamaño). Actualízala al añadir, quitar o mover un fichero.

### Lo que la aplicación guarda en `_GESTOR`

Dentro de la carpeta de asuntos abiertos, y por tanto compartido:

| Fichero | Qué es |
|---|---|
| `tipos.json` | Tipos de asunto y su categoría. `formularios` (fila 82): claves del catálogo de `datos/formularios.json` que aplican a cualquier asunto de ese tipo, sin depender de ningún paso |
| `tipos-documento.json` | Tipos de documento |
| `estados.json` | Estados de tramitación de antes de la fila 129: ya no se enseñan, ni se editan, ni se cargan al entrar (fila 132: fuera su código); solo los lee una vez el paso único (`js/estado-migracion.js`). No se borra del Dropbox |
| `asuntos.json` | Ficha de cada asunto: quién lo abrió, estado, vía, notas, cierre, pasos, fecha límite, documentos pendientes de registro, relacionados, campos configurados del tipo, hilos de correo enganchados, quién ha pedido la gestión (`loPide`) |
| `guias.json` | Los pasos de cada tipo de asunto, con sus preguntas y opciones |
| `recurrentes.json` | Los asuntos que se repiten y cuándo tocan |
| `frescura.json` | Cada cuántos días avisar de que el RegAlum.csv está viejo |
| `tablon.json` | Las notas rápidas del tablón, con su marca de privada |
| `campos.json` | Los campos propios y los campos configurados de cada tipo de asunto; y, en `porTipoDocumento` (fila 96), los campos de un tipo de documento que entran en el nombre del fichero |
| `papelera.json` | El índice de la papelera: qué se ha borrado, de dónde y cuándo |
| `no-duplicados.json` | Grupos de posibles duplicados descartados con "No son el mismo", por la firma de sus nombres |
| `envios.json` | **Es una lista, no un objeto.** Los encargos vivos de "mandar documentos por correo": `{ id, asunto, para, creado }` |
| `plantillas.json` | `{ firma, centro, localidad, direccion, codigo, provincia, cargo, consejeria, lista: [{ id, tipo, categoria, nombre, texto }], documentos: [{ id, tipo, categoria, nombre, fichero, tipoDocumento, texto, firmante, vistoBueno, conLogoCentro }] }`: `lista` para el correo y el mensaje de Séneca, `documentos` para las plantillas de Word. `consejeria` es del membrete (con `centro`; fila 149: lo dibuja la app, `membreteCaja` ya se ignora) y `conLogoCentro` dice si esa plantilla lleva el logo del centro (sin la clave, sí); `firmante`/`vistoBueno` de cada plantilla de documento son el `id` de un cargo de `cargos.json`; `provincia` (fila 84) solo se usa para el hueco `{{PROVINCIA}}` de un impreso oficial |
| `cargos.json` | `{ cargos: [{ id, nombre, orden, tratamiento, ocupantes: [{ id, persona, desde, hasta }] }] }`: los cargos del centro (Dirección, Secretaría…) y quién los ha ocupado, con fechas (`js/cargos.js`, fila 81, docs/FIRMANTES-Y-MEMBRETE.md). Al generar un documento, la firma la pone quien ocupaba el cargo en la fecha del documento |
| `formularios-campos.json` | `{ "<clave del catálogo>": { "<casilla del PDF>": "{{HUECO}}" } }`: qué casilla de cada impreso oficial recibe qué dato del centro (`js/formularios-rellenar.js`, fila 84, docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md). Solo siete huecos posibles, ninguno de persona: `{{CENTRO}}`, `{{CODIGO CENTRO}}`, `{{DIRECCION CENTRO}}`, `{{LOCALIDAD}}`, `{{PROVINCIA}}`, `{{CURSO}}`, `{{HOY}}` |
| `hitos.json` | `{ ajustes: { responsables, noLectivos, festivos }, porAsunto: { <clave>: { creados, hitos } } }`: los hitos vivos de cada asunto abierto (ver "Los hitos de un asunto") |
| `grupos.json` | `{ grupos: [{ id, nombre, miembros: [{ categoria, nombre }], creadoPor, creadoEl }] }`: los grupos propios de personas, gestionados en `js/grupos.js` (ver "Grupos de personas") |
| `usuarios.json` | `{ nombres: [...] }`: los nombres ya usados para entrar, para el desplegable de la pantalla de entrada (`js/usuarios.js`, fila 72). Comparación exacta a propósito: "Francisco" y "francisco" quedan como dos nombres |
| `borrados-listas.json` | `{ tipos, estados, tiposDocumento, recurrentes }`: cada uno, un array de `{ clave, borradoEl }` con lo borrado de esa lista (`js/borrados-fusion.js`, fila 77). No se enseña en ningún sitio salvo Ajustes → Mantenimiento (cuántos hay y quitarlos pasados 90 días) |
| `datos/*.csv` | Alumnado (Séneca), personal, empresas y otros |
| `PAPELERA/` | Las carpetas y ficheros borrados, cada uno en su subcarpeta `AAMMDD-HHMM <nombre>` |
| `PLANTILLAS/` | Los `.docx` que Francisco sube a mano, colgados de un tipo desde Ajustes › Plantillas de documento. También `logo-centro.png` (fila 149, el logo opcional del membrete; `membrete.png` de la fila 81 ya no se usa), y los `.docx` del centro que trae solo el botón "Cargar las plantillas del centro" (fila 83, `plantillas/` del repositorio): las dos son las únicas veces que la propia aplicación escribe ahí. No lleva copia de seguridad: no es uno de los dieciocho ficheros compartidos |
| `presencia.json` | `{ <clave del asunto>: { usuario, ultima } }`: quién tiene abierta la ficha de cada asunto, y desde cuándo. **A propósito, fuera de los dieciocho**: no pasa por `Copias.guardar` (nada de copia de seguridad), no entra en `Papelera` ni en `Conflictos` (si dos versiones chocan, se quedan las dos entradas y punto). Se escribe y relee directo con `Carpetas` (ver "No pisarse en un mismo asunto") |
| `indice-archivo.json` | `{ version, hechoEl, hechoPor, recuento: { CATEGORIA: nº de carpetas de tercero }, asuntos: [{ nombre, categoria, tercero, ruta, fecha, tipo, curso, grupo, documentos, registros, sueltoEn }] }`: el índice guardado del ARCHIVO (`js/archivo-indice.js`, ver "El índice del ARCHIVO"). **También fuera de los dieciocho**, por el mismo motivo que `presencia.json`: se puede rehacer entero en cualquier momento con "Reconstruir el índice", así que no necesita copia de seguridad, papelera ni fusión de conflictos. Se escribe y relee directo con `Carpetas` |
| `estado-migrado.json` | `{ hechoEl, hechoPor, creados, enEspera }`: la marca de que el paso único de la fila 129 ya se hizo (`js/estado-migracion.js`). **Fuera de los dieciocho**, como `presencia.json` |
| `copias/*.json` | Copias de seguridad de los dieciocho ficheros de arriba, una por día, 30 como mucho de cada uno |

**Los CSV van en `datos`, no en `_GESTOR`.** `js/rescate-datos.js` los baja solos al entrar.

Cada nota de `asuntos.json` es `{ texto, quien, cuando }`, y las de correo llevan además
`correo`, `enlace` y `enlaceTexto`. La ficha de un asunto guarda también `pasosHechos`,
`pasosElegidos`, `pendientesRegistro` (los nombres de fichero que faltan por registrar) y
`hilos` (los hilos de Gmail enganchados a ese asunto; ver "De un correo a un asunto").

**La carpeta de la bandeja de correos no es de `_GESTOR`**: está en el Drive de cada uno, y ahí
la aplicación escribe `seguidos.json` para el recolector de Apps Script.

**Todo fichero compartido se relee justo antes de escribirlo.** Son dos ordenadores sobre la
misma carpeta: sin releer, el último en guardar borra lo del otro. Lo hacen los dieciocho ficheros de
arriba.

**Y en este ordenador, de uno en uno** (fila 99, 23-sep-2026, `docs/GUARDAR-EN-FILA.md`,
`js/cola-guardado.js`). `ColaGuardado.poner(fichero, fn)` pone cada «leer-cambiar-escribir» detrás
del anterior del MISMO fichero: `App.guardarRegistroFresco` (y con él `App.anotar`), `Hitos.cambiar`
y la fusión de copias en conflicto de `asuntos.json` y `hitos.json`. Desde la fila 130
(`docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md`) también el tablón (sus cambios, su fusión y devolver una
nota de la papelera), los CSV de terceros (`js/datos-listas.js`, releyendo dentro de la cola),
`borrados-listas.json` y `indice-archivo.json`. Nunca se llama a `poner` del
mismo fichero desde dentro de un `fn` que ya está en esa cola (se esperaría a sí mismo). Sin el
módulo, se guarda igual, sin fila (`App.enFila`). `guardarRegistroFresco` trabaja sobre una copia
local y solo la pasa a `App.E.registro` al terminar la escritura. `ColaGuardado.hayGuardado()`
(también cuenta `Copias.guardar` y los traslados de carpeta) hace que presencia, el vistazo a la
carpeta y la búsqueda de conflictos se salten su pasada. Además:

- La copia del día se comprueba con `Carpetas.existeFichero` (antes `existe`, que busca una
  carpeta: rehacía la copia y listaba `copias/` en cada guardado) y se recuerda en memoria.
- Leer también reintenta (`Reintentar.lectura`); `NotReadableError` y `AbortError` cuentan como
  pasajeros, al leer y al escribir.
- Si `asuntos.json` o `hitos.json` llegan vacíos cuando la última lectura tenía datos
  (`App.E.asuntosEnDisco`), se relee dos veces y, si sigue vacío, error `LecturaVacia` sin tocar el
  disco (`App.cargarRegistro` se queda entonces con lo que tenía en memoria).
- Un traslado de carpeta copia las «(conflicted copy)» de Dropbox (el filtro de temporales es para
  carpetas); la fusión de conflictos de `asuntos.json` conserva todo lo de primer nivel.
- `asuntos.json` y `hitos.json` se guardan sin sangría. `recienArchivados` se marca antes de mover.

Se comprueba con `pruebas/guardar-en-fila.mjs`.

### Copias de seguridad y fichero roto

`Carpetas.leerJson` no confunde "no existe" con "no se puede leer": si el fichero existe pero el
JSON está roto, lanza un error `FicheroRoto` en vez de devolver `null` (antes se trataba igual
que si no existiera, y el siguiente guardado lo escribía encima, perdiendo todo).

- `js/copias.js` guarda, antes de escribir cualquiera de los dieciocho ficheros compartidos, una
  copia de cómo estaba justo antes, en `_GESTOR/copias/<nombre>-AAMMDD.json`. Una copia por
  fichero y día; se conservan las últimas 30 de cada uno.
- Todo lo que escribe uno de esos ficheros llama a `Copias.guardar` en vez de a
  `Carpetas.guardarJson` directamente.
- Al pulsar Entrar se comprueban los dieciocho ficheros (`Copias.comprobarTodos`). Si alguno está
  roto, **no se entra**: sale un aviso en rojo con un botón para restaurar la última copia de
  cada uno. El fichero roto se aparta como `<nombre>-roto-AAMMDD-HHMM.json` y no se borra nunca.
- En Ajustes, el bloque **Copias de seguridad** enseña cuántas copias hay de cada fichero y deja
  restaurar cualquiera a mano, por si hiciera falta sin que nada esté roto.

Se comprueba con `pruebas/copias.mjs`.

### Copias en conflicto de Dropbox, y releer siempre

Si los dos ordenadores guardan casi a la vez, Dropbox no pisa nada: deja aparte un fichero como
`asuntos (copia en conflicto de PC2 2026-09-11).json`.

- `js/conflictos.js` busca esos ficheros al entrar y cada cinco minutos.
- Los CSV de terceros dados de alta a mano (`solicitantes.csv`, `personal.csv`, `empresas.csv`,
  `otros.csv`, en `_GESTOR/datos`; fila 130) también se fusionan solos: unión de filas, dos iguales
  se quedan en una; con el mismo nombre y datos distintos se queda la del fichero real y la otra
  sale en **Conflictos de Dropbox** para elegir. El real se copia antes a `_GESTOR/copias`
  (`<nombre>-antes-de-unir-AAMMDD-HHMM.csv`) y la copia en conflicto se mueve allí.
- `asuntos.json`, `tablon.json` y `hitos.json` se fusionan solos: se unen los asuntos (o las
  notas del tablón) por su clave, y dentro de cada uno se unen las notas, los pasos hechos y los
  pasos elegidos (`asuntos.json`), o los hitos por su id (`hitos.json`), sin repetir nada. En
  `hitos.json`, dentro de `ajustes` solo se fusionan las altas de `responsables` y `noLectivos`.
- Los demás (`tipos.json`, `estados.json`, `tipos-documento.json`, `guias.json`,
  `recurrentes.json`, `frescura.json`, `campos.json`, `cargos.json`) cambian mucho menos y no se
  fusionan solos: salen en el bloque **Conflictos de Dropbox** de Ajustes, con dos botones para elegir
  con cuál de los dos ordenadores quedarse. El que no se elige no se pierde: los dos se guardan
  en `_GESTOR/copias` antes de decidir.
- **Releer antes de escribir**, en todos los ficheros compartidos: antes de guardar se relee el
  fichero y se suma lo que el otro ordenador haya añadido y nosotros no tengamos
  (`App.fusionarConDisco`). Por sí sola, no detecta los borrados del otro ordenador. Para tipos,
  estados, tipos de documento y recurrentes (fila 77, 20-sep-2026, `js/borrados-fusion.js`) eso ya
  no importa: borrar marca la clave en `_GESTOR/borrados-listas.json` en vez de solo quitarla de
  la lista, y cada `guardarX()` (`App.guardarTipos`, `App.guardarEstados`,
  `App.guardarTiposDocumento`, el `guardar()` de `js/recurrentes.js`) quita de lo fusionado
  cualquier clave que siga marcada, así que el borrado se respeta aunque el otro ordenador todavía
  tenga el elemento en memoria. Dar de alta a mano (o devolver desde la papelera) quita la marca:
  un alta explícita gana siempre a un borrado viejo, sin necesitar saber fechas de alta.

Se comprueba con `pruebas/conflictos.mjs`.

### Pruebas automáticas en cada subida

`package.json` trae `playwright` y `jsdom`; `npm test` (ejecuta `pruebas/ejecutar.mjs`) levanta
el servidor local y corre todas las pruebas de `pruebas/` una tras otra, fallando si falla
cualquiera. `.github/workflows/pruebas.yml` lo lanza en cada subida y en cada pull request a
`main`, con Ubuntu, Node 20 y Chromium instalado por Playwright. Desde la fila 148 no se lanza si el
cambio solo toca `docs/` (`paths-ignore`), y dos subidas seguidas cancelan la primera
(`concurrency`, `cancel-in-progress`).

**Una prueba no se fía de un aviso que ya estaba a la vista** (fila 148): el «Asunto archivado.» del
asunto anterior puede seguir en pantalla; se espera a lo que cambia de verdad (el asunto fuera de
`App.E.listaAbiertos`).

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
| `solicitantes.csv` | Nombre · **Documento de identidad** · Nº Id. Escolar · Fecha de nacimiento · Teléfono de contacto · Correo de contacto |
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

Aparte, en `localStorage`: `gestor-barra`, `gestor-filtros`, `gestor-lector-ancho`,
`gestor-ajustes-categoria`, y `gestor-ruta-abiertos`/`gestor-ruta-archivo` (fila 98: la ruta de
las dos carpetas en ese ordenador, para el botón «Ruta»). **El tablón no se recuerda**: nace desplegado siempre, a propósito.

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
  (`js/hitos-panel-lista.js`). Se comprueba con `pruebas/refresco.mjs`. Desde la fila 100 pone
  `data-guardando` en el control (el modo consulta de la ficha, `aplicarModoConsulta`, ya solo toca
  lo que él mismo apagó y respeta esa marca) y un segundo clic mientras guarda no hace nada. Va
  solo alrededor de la escritura, nunca del cuadro de diálogo (`App.editarPlazo(a, control)`,
  `abrirLoPide(a, control)`; registrar desde su cuadro lo deja abierto en «Guardando…» hasta el
  final).
- **Lo principal y lo accesorio, por separado** (fila 100, 23-sep-2026,
  `docs/AVISOS-QUE-DICEN-LA-VERDAD.md`). Si falla lo principal: `U.fallo('No he podido …', e)`,
  rojo, y la pantalla como estaba. Si sale bien: verde. Si después falla algo accesorio (índice,
  nota, lista, hitos, borrar el original de un traslado): `U.accesorio('Guardado, pero no he
  podido …', e)`, ámbar. Los dos pasan por `U.aviso` y por `U.mensajeDeError` (en castellano:
  ningún aviso lleva ya `e.message` a pelo). Aplicado en marcar un hito (la nota va en la misma
  escritura, `Hitos.marcar(clave, id, estado, nota)`), el estado, archivar, registrar, poner
  nombre, crear, renombrar, meter un papel, la papelera (se apunta ANTES de mover la carpeta) y
  unir (mueve también las subcarpetas). Un traslado con la copia completa pero sin poder borrar el
  original se da por bueno, con ámbar (`Carpetas`, `borrarOrigenYaCopiado`).
- **Un asunto con una acción larga en marcha** (archivar, reabrir, editar, unir, a la papelera)
  queda en `App.E.ocupados` (`App.conOcupado`): una segunda no arranca y su tarjeta sale apagada.
  **Un cuadro sobre otro** da por cancelado el primero (`U.preguntar`). Se comprueba con
  `pruebas/avisos-que-dicen-la-verdad.mjs`.
- **Un bloque que se repinta solo (sin que nadie lo pida) nunca puede tirar lo que se está
  escribiendo, ni el foco, ni el cursor.** Envolver ese repintado en
  `U.conservandoLoEscrito(raiz, fn, clavePara)` (`js/util.js`, 17-sep-2026, filas 33 y 34 de la
  cola): apunta valor, foco y cursor de cada `textarea`/`input` de escribir de `raiz` antes de
  repintar, y se los devuelve a los que vuelvan a salir **vacíos** después (nunca pisa un valor
  que el propio repintado haya traído con contenido). La identidad de un campo es su `id`, un
  `data-clave`, o la que pase quien llama (`clavePara`, para los campos que se repiten uno por
  fila, como la nota de un hito). Usado en `js/ficha-asunto.js` y `js/hitos-panel.js` (fila 34);
  el tablón (`js/tablon.js`, fila 33) resuelve el mismo problema con un mecanismo propio, anterior
  a esta ayuda. Se comprueba con `pruebas/tablon-no-se-borra.mjs` y
  `pruebas/notas-asunto-no-se-borran.mjs`.
- **Ojo con el orden de los `<script>` de `index.html`.** `ficha-asunto.js` poda la tarjeta con
  su lista blanca, así que un módulo que quiera poner un botón ahí tiene que cargarse después.
  `lector.js` va antes que `bandeja-correos.js`, y `bandeja-enlace.js` después de los dos.
  `bandeja-pantalla.js` va justo después de `bandeja-correos.js` (necesita `window.Bandeja`) y
  antes de `bandeja-enlace.js` y `correo-adjuntos.js`.
  `dni.js` va casi el último; `inicio.js`, el penúltimo; `envolturas-esperadas.js` (fila 70), el
  último de todos.
- **Un módulo nuevo no envuelve** (regla desde la fila 70, 19-sep-2026,
  `docs/ENVOLTURAS-COMPROBADAS.md`): se engancha por un punto previsto (`window.Gestor.
  alRefrescar` y los que haya) o se le añade uno. Envolver una función que ya existe sigue siendo
  la mejor manera de añadir algo a muchas pantallas a la vez cuando no hay más remedio (42
  envolturas así), pero **con `U.envolver(objeto, nombre, fichero, hacerNueva)`**,
  nunca a mano con `var comoEra = ...`: si la función no existe (orden de `<script>` equivocado),
  `U.envolver` lo apunta como fallo en vez de fallar en silencio, y `js/envolturas-esperadas.js`
  (el último `<script>`) avisa en rojo en la entrada si falta alguna de las esperadas. Toda
  envoltura nueva se apunta también ahí. No siempre compensa: cuando lo que hay que cambiar está
  dentro de una función privada, sale mejor tocar ese fichero directamente.

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

1. **Avisar al compañero de la dirección nueva** (`https://asuntos.fmargon.com`) y de que
   tendrá que volver a señalar las dos carpetas y escribir su nombre.
2. Coordinar con el compañero la **lista de tipos de asunto**. Está aceptado empezar sin ella.
3. **Poner en marcha el script de Gmail** en la cuenta `g.educaand.es`, y señalar la carpeta
   `GESTOR-BANDEJA` en Ajustes. **Pendiente volver a pegar el script**: el del 16-sep-2026 es el
   que sigue los hilos ya enganchados (`seguidos.json`) y el que arregla el enlace a Gmail. Sin
   pegarlo, las respuestas no vuelven a la bandeja.
4. Ver con el uso si la bandeja **acierta con el tipo**. Si falla mucho, palabras clave por tipo.
5. Comprobar, con Séneca delante, si desde el perfil de administrativo la pantalla de
   Comunicaciones es la misma, y si el asunto admite el largo que le estamos dando.
6. Pendiente de decidir: si el aviso de fichero viejo debe vigilar también el `RelPerCen`.
7. **Cuando tengan una cuenta de correo común**, replantear la bandeja: una sola compartida.
8. Descartado por ahora: un filtro de Gmail que etiquete **todo** el correo entrante.
9. Ver con el uso si el panel de la derecha se queda corto para leer: hoy el 46%.
10. Ver con el uso si las tarjetas por tipo se quedan cortas: hoy son solo del tipo.
11. Mirar si el tablón debería ensancharse: hoy son 320 píxeles fijos.
12. Las notas viejas de correo se quedan como están: son el rastro.
13. Si el DNI no sale de nadie, **marcar la columna del documento al generar el RegAlum**.
14. Ver con el uso si el aviso de "falta el DNI" conviene también en la tarjeta del asunto.
15. Ver con el uso si el botón "Cambiar los datos" hace falta también en el buscador de Nuevo
    asunto.
16. Ver con el uso si a las preguntas de la guía les hace falta algo más.
17. **Cuando el uso lo pida**: búsqueda dentro de las notas, cuentas por tipo para la memoria de
    fin de curso, qué hacer con los asuntos vivos al cambiar de curso, y pasar el repositorio y
    Vercel a una cuenta del centro para el relevo.
18. Las copias en conflicto de `guias.json`, `recurrentes.json` y `frescura.json` (las que deja
    Dropbox si los dos ordenadores guardan casi a la vez) no se fusionan solas: avisan en Ajustes
    para elegir con cuál quedarse. Revisar si con el uso hace falta algo más fino. (Los borrados de
    `tipos.json`, `estados.json`, `tipos-documento.json` y `recurrentes.json` sí se fusionan ya,
    desde la fila 77, 20-sep-2026: ver "Copias en conflicto de Dropbox" arriba.)
19. `js/papelera.js` no sabe devolver una plantilla de correo borrada (clase `'plantilla'`, no
    estaba en el encargo de las plantillas): si hace falta, se copia a mano desde el bloque
    Papelera de Ajustes.
