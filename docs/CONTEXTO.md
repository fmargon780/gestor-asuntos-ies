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
publicado de verdad (ver la sección 8). **La hora tiene que ser la real**, sacada del reloj
(`TZ='Europe/Madrid' date`), nunca a ojo ni sumando algo a la de antes: el 17-sep-2026 Francisco
avisó de que estaban saliendo versiones con horas por delante de la de verdad (comentario con la
receta exacta en `js/version.js`).

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

**Guardar un documento nunca echa de la ficha a la lista** (fila 30, 17-sep-2026,
`docs/QUEDARSE-EN-EL-ASUNTO.md`). `App.verAbiertos` (`js/asuntos-lista.js`) relee la carpeta
entera y crea asuntos nuevos cada vez que se llama, y se llama sola —`App.mirarLaCarpeta`, cada
`App.SEGUNDOS_ENTRE_MIRADAS`— sin que la ficha lo sepa: sin este arreglo, el asunto que tenía la
ficha en la mano se quedaba con un objeto viejo, y la lista de documentos no se refrescaba sola.
`js/ficha-asunto.js` envuelve `App.verAbiertos` (mismo patrón que las demás envolturas de este
fichero) para, cada vez que se llama, reenganchar sola el asunto que tenga la ficha abierta —por
su nombre, en la lista fresca— y repintarla en su sitio, con dos funciones públicas:

- `App.fichaAbierta()` — el nombre del asunto que se ve de verdad en pantalla (comprueba que
  `#pantalla-asunto` no esté oculta, no solo que `actual` siga puesto: si se ha cambiado de
  pestaña sin pulsar "Volver", `actual` se queda con el asunto pero ya no hay ficha que reenganchar).
- `App.reengancharFicha()` — la reenganche de verdad: si el asunto sigue en `App.E.listaAbiertos`,
  lo vuelve a coger de ahí y repinta; si ya no está (se ha archivado o borrado desde el otro
  ordenador), entonces sí vuelve a la lista, con un aviso de una línea. Solo actúa con la ficha de
  verdad visible y con un asunto **abierto**: el ARCHIVO no lo vigila `App.mirarLaCarpeta`.

Con esto, `App.verAbiertos` sirve para todas las formas de guardar un documento dentro de un
asunto (registrar, nombrar, sello de Séneca, generar desde plantilla, separar/unir/sacar páginas,
meter un suelto o un correo) sin que ninguna tenga que saber de la ficha: **Editar**,
**Archivar/Reabrir** y **Borrar** siguen siendo los únicos que de verdad vuelven a la lista,
llamando a `volverALaLista()` como hasta ahora. Se comprueba con
`pruebas/quedarse-en-el-asunto.mjs`.

**Las notas no se borran mientras se escriben** (17-sep-2026, fila 34,
`docs/NOTAS-DEL-ASUNTO-NO-SE-BORRAN.md`). `App.reengancharFicha` repintaba la ficha entera en
cada pasada, hubiera cambiado algo o no, y con ella el `<textarea>` de la nota del asunto y el de
la nota de un hito; bastaba con que el compañero dejara un papel suelto para que se llevara por
delante lo que Francisco estuviera escribiendo. Ahora:

- `U.conservandoLoEscrito(raiz, hacer, clavePara)` (`js/util.js`): antes de `hacer()` (el
  repintado), apunta valor, foco y cursor de cada campo de escribir de `raiz` (por su `id`, o por
  la clave que dé `clavePara`); después, se los devuelve solo a los campos que hayan vuelto
  **vacíos** (nunca pisa un valor que el repintado haya traído con contenido).
- `js/ficha-asunto.js`: `pintar()` pasa por esa ayuda, y además **ya no repinta si no ha cambiado
  nada**: `App.reengancharFicha` compara una huella de texto del asunto en dos mitades (ficha e
  hitos, `huellaDe`); si son iguales, la pantalla se deja quieta; si solo cambian los hitos, se le
  pide el repintado al panel de hitos en vez de rehacer la ficha entera. Un asunto pasa a ser un
  solo objeto en toda la aplicación (los datos frescos se le meten dentro al que ya tiene la
  ficha), para que los botones ya pintados no se queden apuntando a datos viejos.
- `js/hitos-panel.js`: su `repintar()` va también dentro de `U.conservandoLoEscrito`, con el
  `MutationObserver` desconectado mientras tanto (devolver un valor no puede disparar otro
  repintado, fila 31) y volviendo a desplegar el hito que tuviera algo a medias antes de devolver
  el foco.

Se comprueba con `pruebas/notas-no-se-borran.mjs`, en navegador de verdad (comprobado que falla
sin el arreglo).

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

Botón "Cambiar los datos" en la ficha de Personas y empresas: abre el mismo cuadro del alta,
relleno, y guarda encima. **Solo para los dados de alta a mano** (`p.deSeneca !== true`). Si
cambia el nombre, las carpetas de sus asuntos de antes conservan el nombre viejo, y se avisa. El
cuadro es uno solo para alta y cambio: `App.cuadroDeTercero`, en `js/asuntos-nuevo.js`, escribe
`Datos.guardarEnLista`. Vive en `js/archivo-personas.js`, se comprueba con `pruebas/empresas.mjs`.

### Las guías del procedimiento

Cada tipo de asunto puede llevar una lista de pasos, con título y explicación (negrita, viñetas,
enlaces), en el orden del trámite, guardados en `_GESTOR/guias.json`.

**Desde el 17-sep-2026 (fila 26, `docs/HITOS-SON-LA-GUIA.md`) los pasos de la guía SON los hitos
del asunto** (ver la sección siguiente): la guía ya no se lee como texto con casillas dentro de
la ficha, solo se escribe y se edita. `pasosHechos`/`pasosElegidos` (en `asuntos.json`) solo se
usan ya como entrada, una vez, al importar lo marcado de un asunto viejo a sus hitos; no se vuelven
a tocar después.

Se escriben desde Ajustes y desde la ficha de un asunto abierto. El botón lo pone
`js/ficha-asunto.js` (`pintarGuia`, que ahora solo pinta el `<p class="nota" id="ficha-guia-nota">`
del final de `#ficha-guia`), pero quien guarda es `js/guias-enganche.js`, vía
`window.GuiasDelCentro.escribir(tipo)`. El fichero se relee justo antes de abrir el cuadro.

Un paso puede ser una PREGUNTA con opciones, cada una con sus propios pasos: eso se escribe en el
cuadro de la guía; dentro de un asunto, ya como hitos, solo se ve la rama elegida.

- Una bifurcación por paso (las opciones no llevan opciones dentro).
- Las dos ramas se pintan desde el principio en el cuadro de editar, y solo se enseña la elegida.
- Los identificadores viajan en el `data-id` del recuadro, no por su posición.
- Al leer el cuadro de escribir la guía, pedir solo los hijos directos (`:scope >`).
- `Guias.vista(pasos, [], false)` sigue sirviendo de recordatorio sin casillas al crear un asunto
  (`#guia-nuevo`, `js/guias-enganche.js`): es el único sitio, aparte del propio cuadro de editar,
  que todavía la pinta. `Guias.cuandoSeElige` ya no tiene quien la llame.

Se comprueba con `pruebas/guias.mjs` y `pruebas/opciones.mjs`.

### Los hitos de un asunto

Dentro de un asunto abierto, la guía **es** la lista de **hitos** que se trabaja: cada paso, vivo
dentro de ese asunto, con estado (pendiente · en curso · hecho · no aplica), fecha límite,
responsable, notas y documentos apuntados. Ya no hay guía con casillas aparte (fila 26, 17-sep-2026,
`docs/HITOS-SON-LA-GUIA.md`): el bloque "Hitos" de la ficha es la única forma de trabajarla.

- Viven en `_GESTOR/hitos.json` (el duodécimo fichero compartido), no en `asuntos.json`: se leen
  solo al abrir un asunto, al archivarlo y en la pantalla "Qué me toca". Estructura:
  `{ ajustes: { responsables, noLectivos }, porAsunto: { <clave del asunto>: { creados, hitos } } }`.
- **Se crean solos**, sin botón ni preguntar nada, la primera vez que se abre la ficha de un asunto
  **abierto** cuyo tipo tiene guía (vale igual para uno recién creado que para uno que ya existía
  desde antes): sus pasos se convierten en hitos (el id del hito es el mismo que el del paso,
  `origenGuia`) y el primero queda en curso. Si el asunto ya traía marcado algo en
  `pasosHechos`/`pasosElegidos` (`asuntos.json`, de cuando la guía se leía con casillas), se
  importa al crearlos (`Hitos.crearDesdeGuiaImportando`); esos dos campos no se vuelven a tocar
  después. No se crean solos si el asunto está archivado, si el compañero tiene el mando
  (`aplicarModoConsulta`) o si la guía de ese tipo todavía no ha terminado de cargar (en ese caso
  no se marca nada como "ya intentado": el siguiente repintado lo reintenta). Tocar los hitos de
  un asunto nunca cambia la guía del tipo.
- **Cerrojo contra la doble creación**: `js/hitos-panel.js` repinta con un `MutationObserver`
  debounced a 30 ms, y crear los hitos es `async` (una lectura y una escritura); dos repintados
  podrían colarse antes de que `hitos.json` quedara escrito y los dos verían "sin hitos todavía".
  `creandoDesdeGuia[clave]`, puesto justo antes de la escritura (nunca antes de la lectura previa),
  evita crearlos dos veces. `Hitos.crearDesdeGuiaImportando` es además idempotente por su cuenta
  (no hace nada si el asunto ya tiene hitos), pero eso solo no basta para la carrera del repintado.
- **Bifurcaciones**: un paso-pregunta se convierte en un hito de clase `decision`. Mientras no se
  elige una opción, la lista se corta ahí. Cambiar de rama quita los hitos vacíos de la vieja y
  marca `noaplica` (plegados, al final) los que tenían notas o documentos.
  `Hitos.visibles`/`Hitos.huerfanos` (`js/hitos.js`) son quienes saben qué se ve y qué se pliega.
- **Un solo hito en curso a la vez**: al marcar uno hecho, el siguiente pendiente de la lista
  visible pasa a "en curso" solo (`Hitos.recomputeEnCurso`).
- **Documentos apuntados** (fila 31, 17-sep-2026, `docs/APUNTAR-DOCUMENTO-A-HITO.md`): el botón
  "Apuntar un documento" abre `HitosDocumentos.abrir(a, h)` (`js/hitos-documentos.js`, nuevo), un
  cuadro con casillas sobre `Carpetas.ficheros(a.handle)`; al aceptar llama a
  `Hitos.anadirDocumento`/`quitarDocumento` y pide el repintado. Apuntar es solo señalar: nunca se
  copia ni se mueve nada, y un documento puede estar apuntado en varios hitos. Cada nombre pasa a
  ser pulsable (abre en el panel de la derecha, `window.Visor.abrir`), pidiendo su handle en el
  momento de pulsar, no antes. Saber qué apuntado ya no está en la carpeta se lee **una sola vez
  por repintado**, en `js/hitos-panel.js` antes de tocar el DOM (nunca corrigiéndolo después, a
  mano: el `MutationObserver` de aquí abajo lo detectaría como un cambio más). Y nunca con el
  atributo `disabled`: `js/ficha-asunto.js` reactiva solo, sin distinguir por qué, todo lo que
  encuentre apagado dentro de `#ficha-asunto-cuerpo` en cuanto no hay nadie en modo consulta
  (`aplicarModoConsulta`) — basta la clase `hito-doc-falta` (sin enganchar ningún `onclick`, y ya
  en gris por CSS).
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
  opcionales por paso: responsable por defecto, estado del asunto y plazo) y se pintan
  directamente dentro de `#ficha-guia` (el bloque "Hitos" de la ficha), con un
  `MutationObserver` sobre `#ficha-asunto-cuerpo` para saber cuándo repintar (no hay ninguna
  función de `App` que envolver). `js/ficha-asunto.js` solo pone ahí el
  `<p class="nota" id="ficha-guia-nota">` de escribir o cambiar la guía del tipo; `js/hitos-panel.js`
  lo localiza por su id y lo conserva cada vez que repinta el resto de `#ficha-guia`.
- Vive en `js/hitos.js` y `js/hitos-archivo.js` (el modelo; se parte en dos para no pasar de las
  400 líneas), `js/hitos-panel.js` y `js/hitos-panel-lista.js` (la ficha del asunto: el
  observador, el repintado y la creación automática en uno, cómo se pinta cada hito en el otro,
  hablándose por `window.HitosPanel`), `js/hitos-documentos.js` (el cuadro de apuntar un
  documento) y `js/hitos-ajustes.js` (el bloque "Hitos" de Ajustes: responsables y días no
  lectivos).

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

### No pisarse en un mismo asunto

(17-sep-2026, fila 24). La aplicación la usan dos personas sobre la misma carpeta de Dropbox.
Nunca se deja a nadie fuera de un asunto: lo que cambia es que, si el otro ya está dentro, se
entra en **modo consulta** (se ve todo, no se toca nada), con un aviso arriba y un botón "Tomar
el mando" que siempre está ahí.

- **`js/presencia.js`** (`window.Presencia`) es el modelo y la vigilancia. Vive en
  `_GESTOR/presencia.json`: `{ <clave del asunto>: { usuario, ultima } }`. Se escribe y relee
  **directo con `Carpetas`, nunca con `Copias.guardar`**: es un fichero fuera de los trece
  protegidos, a propósito (ver "Lo que la aplicación guarda en `_GESTOR`"), porque se escribe muy
  a menudo y es un dato que caduca solo (3 minutos sin renovarse).
  - `vigilar(clave, onCambio)`: comprueba si `clave` está libre; si lo está, anuncia la propia
    señal y la renueva cada 30 segundos; si no, se queda en modo consulta y relee cada 10
    segundos, por si el otro sale. Un único `setInterval` hace las dos cosas (relee siempre;
    renueva solo si ya han pasado los 30 segundos, o si acaba de dejar de estar libre): así se
    cumplen los dos plazos del encargo sin dos temporizadores por ficha.
  - `dejarDeVigilar()` quita la propia señal **solo si se tenía el mando** (nunca la de otro).
  - `tomarElMando(clave)` pisa la señal del que estuviera antes.
  - `ocupantePor(clave)` es una lectura sin await, contra una copia en memoria
    (`refrescarCache()`) que se refresca sola cada 10 segundos, enganchada a
    `App.vigilarLaCarpeta` (así no ha hecho falta tocar `js/nucleo.js` para arrancarla): la usa la
    marca de la tarjeta de la lista.
  - **(17-sep-2026, fila 33)** esa envoltura de `App.vigilarLaCarpeta` repintaba la lista entera
    (`App.pintarAbiertos()`) cada 10 segundos pasara lo que pasara, y eso se llevaba por delante
    el tablón de notas a medio escribir (vive dentro de `#pantalla-abiertos`). Ahora
    `Presencia.huella()` da una foto de texto de quién está dentro de qué (claves y usuarios,
    ordenados); el intervalo solo llama a `App.pintarAbiertos()` si esa huella ha cambiado de
    verdad desde la última vez, y nunca si `document.activeElement` es un `input`, `textarea`,
    `select` o algo `contenteditable` (esa vuelta se salta sin actualizar la huella guardada, para
    que la siguiente vuelta sin escribir sí repinte).
- **`js/ficha-asunto.js`** pinta el aviso (`#ficha-presencia`, reutilizando `.aviso.aviso-ambar`
  de siempre) y apaga los controles. **Apagar no es "un botón más que tocar"**: se recorre
  `#ficha-asunto-cuerpo` entero (`button, select, input, textarea`) y se apaga todo menos una
  lista blanca de solo lectura (volver, abrir un documento, copiar un nombre, desplegar un hito,
  el propio "Tomar el mando"). Así ni `js/hitos-panel-lista.js`, ni `js/correo.js`, ni
  `js/plantillas-documento.js`, ni `js/relacionados.js` han tenido que tocarse para esto.
  - **La mitad de la ficha se pinta sola, después de `pintar()`** (la guía, los documentos, los
    hitos por su cuenta con su propio observador, "Generar documento" y "Correo" con un pequeño
    retraso): aplicar el modo consulta una sola vez al final de `pintar()` se comería todo lo que
    sale después. Por eso hay un `MutationObserver` propio sobre `#ficha-asunto-cuerpo` (mismo
    patrón y mismo aviso de la sección de abajo), creado una sola vez (el contenedor no se
    destruye entre una ficha y otra) y con el mismo retraso de 30&nbsp;ms que usa
    `js/hitos-panel.js`.
  - Solo se vigila la presencia en un asunto **abierto**: en el ARCHIVO no hay nada que tramitar.
- **`js/asuntos-lista.js`** no se toca por dentro: `js/presencia.js` envuelve `App.tarjetaAsunto`
  (mismo patrón que `js/puente.js`, `js/copiar.js` y el propio `js/ficha-asunto.js`) y le cuelga
  `.marca-presencia` (una letra, con el nombre completo en el `title`) delante del nombre.
- **`js/copias.js`, `js/papelera.js` y `js/conflictos.js` no se han tocado**: los tres trabajan
  solo con los ficheros que tienen apuntados en su propia lista, y `presencia.json` nunca entra en
  ninguna. Si dos ordenadores escriben casi a la vez, Dropbox deja aparte una copia en conflicto
  como con cualquier otro fichero, pero nadie la mira ni se fusiona: la próxima señal (como mucho,
  30 segundos después) la deja atrás sola.
- Descartado, por ahora: una base de datos pequeña en internet para que el aviso fuera
  instantáneo (ver `docs/COLA.md`, "Lo que vendrá después").

Se comprueba con `pruebas/presencia.mjs`.

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

**(17-sep-2026, fila 33)** lo que se lleva escrito en la nota nueva vive también en variables del
módulo (`borrador`, `borradorFecha`), no solo en el `<textarea id="tablon-texto">`: se actualizan
con el evento `input` (y el `change` de la fecha), así que sobreviven aunque algo de fuera
destruya la columna `#tablon` entera antes de que se pegue la nota. `pintar()` guarda, antes de
reconstruir, si el foco estaba en ese campo o en el de una nota que se está cambiando
(`editando`), junto con `selectionStart`/`selectionEnd`, y al terminar le devuelve el foco y el
cursor al campo nuevo.

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

**En pantalla** (desde el 17-sep-2026, fila 27, `docs/CORREOS-DENTRO-DE-POR-CLASIFICAR.md`) vive
dentro de "Por clasificar" (`#zona-clasificar`, encima de `#lista-sueltos`), detrás de una barra
plegable "Correos sin clasificar (N)" (`#btn-correos-sin-clasificar`/`#bandeja-correos`, ambos
nacidos en `index.html`, ya no creados por JavaScript). Se despliega y se pliega al pulsarla, y
**siempre arranca plegada** al entrar en la vista (`App.irVista`, en `js/asuntos-lista.js`; sin
memoria en `localStorage`, a propósito, y sin `<details>`: mismo patrón que el plegado de
"Filtros", `engancharFiltros()` en `js/vista.js`). La lectura de correos (`mirar()`, cada
`SEGUNDOS_ENTRE_MIRADAS`) no sabe nada del plegado y sigue corriendo igual; el número de la barra
se actualiza aunque no se esté mirando esa vista (a propósito, al contrario que `App.pintarSueltos`,
que si sale antes de pintar la lista si la vista no es "clasificar"). La caja de envíos
(`#bandeja-envios`, "Borrador en camino") se queda donde estaba, debajo de las tres tarjetas,
anclada explícitamente a `paneles.nextSibling` (antes se anclaba a `$('bandeja-correos')` si
existía; dejó de tener sentido al dejar `#bandeja-correos` de ser hermana de `.paneles`).

Pintar la bandeja (la barra, la caja, cada tarjeta, la línea de "ya guardado") vive en
`js/bandeja-pantalla.js`, separado de `js/bandeja-correos.js` (1.478 líneas) para no seguir
engordándolo: se habla con `window.Bandeja` (leer los correos, adivinar, guardar, descartar...),
al que se le han añadido las piezas que le faltaban (`correos`, `asuntoDeLaMatricula`,
`asuntoDeEsteCorreo`, `proponer`, `llevarANuevo`, `leerElCorreo`, `enlaceAGmail`, `descartar`,
`borrarDeLaBandeja`, `mirarDeNuevo`, `pedirPermiso`, `soloElDia`, `fechaLegible`,
`fechaHoraLegible`, `sobre`), sin renombrar ni quitar las que ya usaban `js/bandeja-enlace.js` y
`js/correo-adjuntos.js`.

De cada correo, la tarjeta morada mira en este orden (17-sep-2026, fila 18, "Un mismo correo en
dos buzones"):

1. **La huella por identificador de hilo**, el propio o el del hilo al que responde
   (`respuestaDe`). Si el `id` ya está en el `hilos` de algún asunto, la tarjeta dice "Respuesta
   de <asunto>" y su botón principal es "Guardar en ese asunto". El identificador de hilo es de
   cada buzón: solo puede coincidir en el buzón que enganchó el correo.
2. **La huella por matrícula.** El `Message-ID` de un mensaje es el mismo en todos los buzones
   por los que pasa (al contrario que el identificador de hilo), así que es lo único que permite
   al buzón del compañero reconocer un correo que **el otro** ya guardó. Si alguna matrícula del
   correo coincide con alguna matrícula de algún `hilos` y el identificador de hilo **no** ha
   encajado en el paso 1, no es un correo que atender: en vez de tarjeta, sale una **línea
   gris**, aparte, debajo de las tarjetas normales: "Ya está en el asunto «...» · lo metió Juan
   el 17-sep-2026 · 09:14", con "Abrir el asunto" (si sigue abierto) y "Quitar de mi bandeja"
   (borra los ficheros de esta bandeja, nunca por la papelera: el correo de verdad sigue en
   Gmail). Si el correo les ha llegado a los dos y ninguno lo ha guardado todavía, los dos ven su
   tarjeta normal: no hay ninguna coordinación inventada entre buzones.
3. **El texto del asunto.** Si el asunto del correo (sin `Re:`/`RV:`/`Fwd:`) lleva dentro el
   nombre de un asunto de `asuntos.json`, con al menos 12 letras por los dos lados, también se
   ofrece guardarlo ahí.
4. **Nada.** Entonces el botón principal es "Crear el asunto".

En los casos 1, 3 y 4 hay además un botón **"Elegir asunto"** (`js/bandeja-enlace.js`), que abre
el cuadro compartido de `js/elegir-asunto.js` (ver "El cuadro de elegir asunto", más abajo). Si el
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

    hilos: [ { id: "<id del hilo de Gmail>", asunto: "<asunto limpio, en minúsculas>", visto: 2,
               matriculas: [ "<message-id>", ... ], metidoPor: "<usuario>", metidoEl: "<ISO>" } ]

`visto` es cuántos mensajes tenía el hilo al guardar. `matriculas` son los `Message-ID` del
correo que se guardó (las del correo, no acumuladas de guardados anteriores); `metidoPor` y
`metidoEl` son quién lo guardó y cuándo, para la línea gris. Si el `id` ya estaba, se actualiza la
huella entera en vez de añadir otra entrada. Un asunto puede tener varios hilos; un hilo pertenece
a un solo asunto (al cambiarlo de asunto, el `id` se quita del viejo). `hilos` **es opcional**:
los asuntos de antes del 16-sep-2026 no lo tienen; `matriculas`, `metidoPor` y `metidoEl` también
lo son, para los hilos de antes del 17-sep-2026. Todo sigue funcionando igual sin ellos: no se
saca línea gris, y en la propia línea no sale "lo metió undefined" ni nada por el estilo. Se
escribe con `App.anotar`, que relee el fichero antes y guarda con `Copias.guardar`.

#### `seguidos.json`, para el recolector

Cada vez que cambia una huella, la aplicación reescribe entero `seguidos.json` en la carpeta de
la bandeja: `{ "hilos": [ { "id": ..., "visto": ..., "asunto": ..., "matriculas": [...] } ] }`.
Las matrículas de todas las huellas que compartan identificador de hilo se juntan sin repetir
(`js/bandeja-correos.js`, `escribirSeguidos`). En cada pasada, el script de Apps Script hace lo de
siempre con la etiqueta `GESTOR` y **después** lee ese fichero y, para cada entrada, busca el
hilo: primero por `GmailApp.getThreadById(id)` (el buzón que lo enganchó); si no sale, por
matrícula, de la última a la primera, con `GmailApp.search('rfc822msgid:' + m)` (el buzón del
compañero, que no tiene ese `id`). Si tiene más mensajes que lo visto **en este buzón**, lo
recoge otra vez. Así vuelven a la bandeja las respuestas del tercero y también los correos que
manda Francisco desde Gmail, en cualquiera de los dos buzones. Si el hilo no aparece en ninguno de
los dos sitios, se salta sin ruido; si `seguidos.json` no está o está roto, el script sigue con su
trabajo normal.

**La cuenta de mensajes vistos es de cada buzón**, guardada en el propio proyecto de Apps Script
(`PropertiesService.getScriptProperties()`, clave `'visto:' + <id local>`), nunca comparada
directamente con el `visto` de `seguidos.json`: el mismo hilo puede tener un número de mensajes
distinto en cada buzón (correos internos, borradores, reenvíos que no están en los dos sitios), y
compararlo a ciegas haría que el hilo se recogiera cada minuto para siempre, o que no se recogiera
nunca. Solo la primera vez que se sigue un hilo, sin cuenta propia todavía, se parte del `visto`
compartido (o 1).

Esas fichas traen dos campos más: `respuestaDe` (el `id` del hilo) y `enviado: true` cuando el
último mensaje lo mandó el propio usuario, que es lo que hace que la tarjeta diga "Lo enviaste
tú". Y las matrículas de todos los mensajes del hilo: `matriculas` (sin repetir) y `matricula`
(la del último mensaje, el que acaba de llegar).

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

**"Último correo recogido"**, en el bloque de la bandeja de correos de Ajustes: la fecha del
propio fichero más nuevo que haya en la carpeta (da igual que sea un `.json`, un PDF o un
adjunto), no algo leído de dentro de ningún fichero. Nació el 17-sep-2026 al descubrirse que el
recolector llevaba seis días dejando los correos en una `GESTOR-BANDEJA` distinta de la que leía
la aplicación (el script solo busca en la raíz del Drive; alguien había movido la de verdad
dentro de otra carpeta, y se creó una nueva sin avisar de nada). Con más de 3 días sin moverse,
la línea pasa a avisar. Vive en `js/bandeja-correos.js`, `pintarUltimoCorreoRecogido`.

### El correo y la mensajería de Séneca

Botones "Correo" y "Mensaje Séneca" en la ficha del asunto (`js/correo.js`). La aplicación **no
envía nada**: prepara los campos y los deja listos. Al copiar el texto o abrir la ventana de
redactar se apunta sola una nota (una sola vez por cuadro). Solo Séneca: no hay campo Para, y un
solo botón que se va cambiando: "1. Copiar el asunto" → "2. Ahora, copiar el texto" → "Copiado.
Pégalo y envía".

### "Lo pide": quién ha pedido la gestión (17-sep-2026, fila 28, docs/LO-PIDE.md)

Cada asunto puede guardar, si se quiere, quién lo pidió, por qué vía y en qué fecha: el problema
real es un certificado pedido hace días, ya listo, sin recordar a quién hay que contestar. Clave
opcional `loPide` en la ficha del asunto (`_GESTOR/asuntos.json`), escrita con `App.anotar` (nunca
con `Carpetas.guardarJson`), y `null` (no `undefined`) para vaciarla:

    loPide: { nombre, categoria, relacion, correo, telefono, via, fecha, apuntadoPor }

`categoria` es la del tercero elegido (`ALUMNADO`/`PERSONAL`/`EMPRESAS`/`OTROS`), vacía si se
escribió a mano; `via` es la misma clave que usa el asunto (`Nombres.VIAS`); `fecha` es ISO
(`AAAA-MM-DD`). **El parentesco real (padre, madre, abuela) no existe en los datos del centro**
(el RegAlum no trae esa columna): las opciones de alumnado son "Tutor legal 1"/"Tutor legal 2", y
solo con "Otra persona…" se escribe algo a mano.

Toda la lógica vive en el módulo nuevo `js/lo-pide.js` (`window.LoPide`), para no engordar
`js/asuntos-nuevo.js`, `js/ficha-asunto.js` ni `js/correo.js`:

- `LoPide.opciones(persona)`: los candidatos, siempre "El propio interesado" y "Otra persona…",
  más "Tutor legal 1/2" (solo alumnado, y solo si Séneca trae su nombre), con los datos de cada
  uno (`nombre`, `correo`, `telefono`) ya resueltos.
- `LoPide.datosDeTutor(campos, numero)`: sacada de `js/plantillas.js` (que ahora la llama en vez
  de tener su propia copia), porque `LoPide.opciones` también la necesita.
- `LoPide.controles(caja, persona, valorInicial)`: pinta el desplegable, los campos de "Otra
  persona…" (solo visibles con esa opción), la vía y la fecha, **con clases, nunca con id**: este
  mismo módulo se monta a la vez dentro de `#bloque-detalles` de "Nuevo asunto" (que queda en el
  documento, aunque escondido, mientras dura la sesión) y dentro del cuadro de la ficha; dos
  elementos con el mismo id habrían roto el segundo sitio que se pintara. Devuelve `{ leer() }`.
- `LoPide.texto(ficha)`/`LoPide.correoDe(ficha)`: la línea legible ("María López (Tutor legal 1)
  · por teléfono · 17-sep-2026") y la dirección de quien lo pide, o cadena vacía sin dato.
- `LoPide.elegirDestinatarios(correos, correoLoPide, elegidosDeAntes)`: pura, sin DOM, para poder
  probarse sin cargar el cuadro de Correo entero (que no expone nada hacia fuera): decide qué
  casilla queda marcada.
