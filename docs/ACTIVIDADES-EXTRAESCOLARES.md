# Actividades extraescolares: apuntar la actividad, su alumnado y su profesorado (fila 306)

Cerrado con Francisco el 8-oct-2026. Es la primera de cuatro filas:

- **306 (esta)**: el registro de actividades, el formulario y la tarjeta «La actividad».
- **309**, `docs/ACTIVIDADES-EXTRAESCOLARES-AVISO.md`: el aviso al claustro, con su informe en PDF.
- **310**, `docs/ACTIVIDADES-EXTRAESCOLARES-PANTALLA.md`: la pantalla con todas las actividades, y
  las actividades antiguas.
- **311**, `docs/ACTIVIDADES-EXTRAESCOLARES-CERTIFICADO.md`: el certificado del profesorado.

Van en ese orden. Cada una deja la aplicación usable por sí sola.

## La idea, tal cual la escribió Francisco

> Tengo que montar un sistema para el control de las Actividades Extraescolares del centro.
> Dicho control consistiría en tener una base de datos en la que registramos qué actividades
> extraescolares se realizan, cuando, a qué unidades va destinadas, qué alumnado va y que
> profesores les acompañan.
> Las acciones principales son dos:
> - Certificar la actividad como desempeño del profesorado para futuros concursos de méritos. Hay
>   que tener en cuenta que el profesorado puede pedirnos certificados de las actividades
>   extraescolares realizadas durante los últimos 5 años.
> - Comunicación para avisar al resto del claustro del alumnado que no va a asistir a clase por
>   estar de actividad extraescolar. (Actualmente se hace esta comunicación adjuntando a un correo
>   una documentación escaneada que prepara el profesorado encargado de las organización de las
>   actividades extraescolares en la que aparece toda la documentación y de la que nos hace entrega
>   algún día antes de la actividad).
>
> Esta actividad concreta me hace pensar en montar un sistema que permita este control y otros
> similares que intuyo que debe consistir en que el asunto concreto sirva de formulario para
> introducir los valores de un registro en una base de datos y que además sirva para generar algún
> documento con su plantilla y alguna comunicación también con su plantilla. Y además esa base de
> datos debería servir para usara en otro tipo de asuntos relacionados para emitir documentos y
> comunicaciones con información agrupada o consolidada de dichas bases de datos.

## Qué decidió Francisco

1. **Ahora, solo las actividades extraescolares**, hechas de forma que valgan después para otros
   controles parecidos. El sistema general no se diseña todavía. (Pidió que, cuando encargue otro
   control semejante, se le recuerde que se empezó por este.)
2. **El alumnado no se teclea.** Se eligen las unidades convocadas, sale su alumnado ya marcado y
   se desmarca a quien no va. Con «Desmarcar todos» se hace al revés.
3. **De cada actividad se apunta**: nombre, fecha de inicio y de fin, hora de salida y de regreso,
   lugar, departamento que la organiza, unidades convocadas, alumnado que va y profesorado.
4. **Del profesorado se apunta quién organiza y quién acompaña.**
5. Las actividades de cursos anteriores se podrán apuntar en corto (fila 310) y, más adelante,
   importar de una base de datos de Access que tiene su compañero (sin diseñar:
   `docs/PENDIENTES-DE-DISENAR.md`, punto 4).

Dos cosas las decidió la conversación de diseño, y se le dijeron:

- **Una actividad cuenta como realizada desde el día siguiente a su fecha de fin**, sin que nadie
  marque nada, salvo que se haya anulado. Así nadie tiene que acordarse de marcarla.
- **«Horas de dedicación»** se apunta también, sin ser obligatorio: el certificado que usa hoy el
  centro (`plantillas/participacion-actividad.md`) las lleva.

## Qué pasa hoy

- Ya existe el tipo de asunto **ACTIVIDAD EXTRAESCOLAR** (categoría OTROS, lo encarga Jefatura de
  Estudios), con su guía de cinco hitos en la biblioteca del centro. No se toca.
- Tiene una plantilla, «Participación del profesorado en actividad extraescolar», pensada para
  generarse una vez por cada relacionado, cuando los relacionados eran los profesores, y que
  pregunta a mano la actividad, el lugar, las fechas y las horas.
- No hay ningún sitio donde quede apuntado, de forma que se pueda consultar años después, qué
  actividades hubo y quién fue.

## Palabras de este documento

- **Registro de actividades**: el fichero nuevo `_GESTOR/actividades.json`. Es la única fuente de
  los datos de una actividad. En pantalla no se usa «registro» para esto (ya es otra cosa): se
  dice «actividades extraescolares».
- **Asunto de actividad**: un asunto de grupo (fila 293) de un tipo marcado para actividades, que
  lleva `ficha.actividad = { id }`. Su alumnado son sus personas del grupo (`ficha.relacionados`).
  Su profesorado **no** son relacionados: vive en el registro.

## Qué hay que hacer

### 1. El registro: `_GESTOR/actividades.json`

    { _esquema: 1, tipoMarcado: true, actividades: [ {
        id,                      // U.nuevoId('act')
        asunto: { numero, nombre } | null,   // null en una actividad antigua (fila 310)
        nombre,                  // el nombre completo, hasta 120 letras
        inicio, fin,             // 'AAAA-MM-DD'; fin = inicio si es de un día
        salida, regreso,         // 'HH:MM' o ''
        lugar, departamento,
        horas,                   // número o null
        unidades: [ { unidad, van, de } ],   // calculado del alumnado que va
        alumnado,                // cuántos van
        profesorado: [ { nombre, clave, papel } ],   // papel: 'organiza' | 'acompana'
        anulada, enPapelera, antigua,
        creadaPor, creadaEl, cambiadaPor, cambiadaEl
    } ] }

- Módulo nuevo `js/actividades.js` (`window.Actividades`; mira antes que el nombre esté libre).
  Cargar con caché, `guardar` que relee el disco y funde por `id` antes de escribir (como
  `Grupos.guardar`; en un mismo `id` gana el `cambiadaEl` más reciente), siempre por `ColaGuardado`.
- Es un fichero compartido más: dalo de alta donde están `encargos.json` y `correos-a-mano.json`
  (`js/copias.js`, `js/conflictos.js`) y en la tabla «Lo que la aplicación guarda en `_GESTOR`» de
  `docs/CONTEXTO.md`.
- `nombre` del profesorado: como lo da `App.textoTercero` de la persona. `clave`: los dígitos de su
  documento (`Datos.clavePersona`), para unirlo después a su certificado.
- Funciones sin efectos, que se prueban solas:
  - `Actividades.situacion(act, hoyIso)` → `'anulada'`, `'realizada'` (fin anterior a hoy) o
    `'prevista'`.
  - `Actividades.cuenta(act, hoyIso)` → verdadero si es realizada y no está en la papelera.
  - `Actividades.unidadesDe(personas)` → la lista `{ unidad, van, de }` ordenada como
    `Datos.unidadesDistintas`.
  - `Actividades.fechasLegibles(act)` → «15 de octubre de 2026» o «del 15 al 17 de octubre de 2026».

### 2. Qué tipo de asunto apunta actividades

- Una marca en el tipo, `tipo.actividades = true` (en `tipos.json`, como `liquidar`).
- Una pasada única al entrar (marca `tipoMarcado` en `actividades.json`; modelo:
  `PlazosDelCentro.pasada`): pone la marca al tipo llamado ACTIVIDAD EXTRAESCOLAR (o al que lo
  tenga como nombre antiguo). Si el centro no lo tiene, lo crea con `App.crearTipo` (categoría
  OTROS, lo encarga Jefatura de Estudios). No toca su guía ni sus plantillas. En solo consulta, o
  con un guardado en marcha, no corre.
- A partir de ahí, el único criterio es la marca: `Actividades.esTipoDeActividad(tipo)`. Si el tipo
  cambia de nombre, la marca va con él. Si se une a otro, la marca pasa al que se queda (mira cómo
  lo hace `liquidar` en `js/tipos-unir.js`).

### 3. El formulario «La actividad»

Una sola ventana ancha, en columnas, sin tener que bajar con un monitor ancho. Fichero nuevo
`js/actividades-formulario.js`.

- **Nombre de la actividad** (obligatorio, hasta 120 letras).
- **Nombre corto, para la carpeta** (obligatorio, hasta 40 letras). Se rellena solo con el
  principio del nombre, limpio con `U.limpiarNombre`, mientras no se toque a mano. Es el nombre
  del grupo del asunto.
- **Fecha de inicio** (obligatoria) y **Fecha de fin** (se pone sola igual a la de inicio; no puede
  ser anterior).
- **Hora de salida** y **Hora de regreso** (no obligatorias).
- **Lugar** y **Departamento que la organiza** (texto; al escribir propone los departamentos ya
  usados en otras actividades).
- **Horas de dedicación** (número, no obligatorio).
- **Unidades convocadas**: se señalan una o varias de las unidades con alumnado matriculado
  (`Datos.unidadesDistintas`). Por cada unidad señalada sale un bloque con su título
  «2.º ESO B · van 26 de 28» y su alumnado (`Relacionados.filtrarPorUnidad`) con una casilla por
  persona, **todas marcadas**, en varias columnas. Arriba, **«Desmarcar todos»** y **«Marcar
  todos»**. Quitar una unidad quita su bloque.
- **«+ Añadir a alguien de otra unidad»**: el buscador de terceros de siempre, limitado a
  alumnado; la persona entra marcada en un bloque «Otras unidades».
- **Profesorado**: el buscador de terceros en su modo de señalar varios, limitado a PERSONAL
  (`App.pintarBuscadorDeTercero` con `multiple: true`). Cada persona elegida sale en una lista con
  un selector **«Organiza» / «Acompaña»** (de partida, «Acompaña») y su ×.
- Abajo, a la vista siempre: «Van N alumnos/as · M profesores/as», **«Seguir»** y «Cancelar».
  «Seguir» está apagado sin nombre, sin nombre corto, sin fecha de inicio o sin nadie marcado.
- Lo escrito no se pierde al marcar o desmarcar (`U.conservandoLoEscrito` si algo se repinta).

### 4. Crear el asunto

- **Por dónde se entra**: en «Nuevo asunto», al elegir un tipo con la marca, donde se busca al
  tercero sale un botón principal **«Apuntar la actividad»**, que abre el formulario. El buscador
  normal sigue debajo: no se bloquea nada.
- **«Seguir»** vuelve a «Nuevo asunto» con todo puesto, por `App.nuevoAsuntoCon` y
  `App.fijarTercero`: el tipo en una línea, el tercero **«Grupo <nombre corto> · N personas»**
  (el seudo-tercero de `js/asunto-de-grupo.js`, con sus `grupoDatos` y, además, los datos de la
  actividad) y **«Fecha límite»** con la fecha de inicio de la actividad. «Cambiar» en el recuadro
  del grupo vuelve al formulario con todo lo que se había puesto.
- Al pulsar «Crear asunto», en la misma escritura que el resto de la ficha (una línea en
  `js/asuntos-nuevo-crear.js`, junto a la de `AsuntoDeGrupo.alDatosNuevos`): `ficha.grupo` con
  `origen: 'actividad'`, las personas en `ficha.relacionados` y `ficha.actividad = { id }`.
  Después, la actividad entra en el registro con `asunto: { numero, nombre }`. Si falla el
  registro, aviso ámbar (`U.accesorio`): el asunto ya está creado y la tarjeta ofrece apuntarla.
- La carpeta se llama como todas: `AAMMDD A26-0137 ACTIVIDAD EXTRAESCOLAR GRUPO <nombre corto>`.
- El formulario se prepara desde cero cada vez (`App.prepararNuevo`): no queda nada de la vez
  anterior.

### 5. La tarjeta «La actividad», en la ficha del asunto

Una tarjeta nueva en `js/ficha-tarjetas.js`, la primera, **solo en asuntos de un tipo con la
marca**. Fichero nuevo `js/actividades-ficha.js`.

- Cerrada, su resumen: «15-oct-2026 · Granada · 52 alumnos/as · 4 profesores/as · Prevista».
- Abierta en grande, a todo el ancho y en columnas: todos los datos; las unidades con «van 26 de
  28»; el profesorado en dos listas, **Organiza** y **Acompaña**; y la situación, **Prevista**,
  **Realizada** o **Anulada**.
- **«Cambiar»** abre el mismo formulario con lo guardado. Al guardar: los datos van al registro;
  el alumnado marcado de más entra en `ficha.relacionados` y el desmarcado sale
  (`Relacionados.combinarRelacionados` y `App.anotarLista`). Quien ya tiene algo generado o
  enviado en «Personas del grupo» sale marcado y con la casilla apagada, con el motivo al pasar el
  ratón. Si cambia el nombre corto, se cambia el nombre del grupo por el camino de «Cambiar el
  asunto» (`AsuntoDeGrupo.grupoRenombrado`), nunca moviendo la carpeta a mano.
- **«Anular la actividad»** (pregunta antes) y **«Deshacer la anulación»**. Una anulada sigue
  siendo un asunto normal: se archiva cuando se quiera.
- La tarjeta «Personas del grupo» sigue igual: es el alumnado que va.
- **La cuenta siempre es la verdadera.** Si el alumnado cambia por otro camino («+ Añadir
  personas», «Quitar del grupo»), `unidades` y `alumnado` del registro se ponen al día solos
  (`Actividades.ponerAlDia(a)`, enganchado en `window.Gestor.alRefrescar`; nunca en solo consulta
  ni con un guardado en marcha; solo escribe si algo ha cambiado). Lo mismo con `asunto.nombre` si
  la carpeta cambia de nombre.
- En solo consulta, cuando el compañero tiene el mando y para un directivo: se ve todo, los
  botones apagados.

### 6. Papelera, archivar y unir

- Mandar el asunto a la papelera pone `enPapelera: true` en su actividad; recuperarlo lo quita.
  Engánchalo en el único sitio por donde pasa borrar y recuperar un asunto, no en cada botón.
- Archivar y reabrir no tocan el registro: la actividad sigue ahí, que es para lo que sirve.
- Si se unen dos asuntos y los dos llevan actividad, se queda la del asunto que se queda y la otra
  pasa a `enPapelera`.

### 7. Los asuntos de ese tipo que ya existen

- Un asunto de un tipo con la marca que no lleva `ficha.actividad` enseña la tarjeta con una
  frase y un botón: **«Apuntar los datos de la actividad»**. Abre el formulario: el alumnado, con
  sus relacionados de alumnado ya marcados; el profesorado, con sus relacionados de PERSONAL ya
  puestos como «Acompaña». Al guardar no se quita a nadie de relacionados.
- Si ese asunto no es de grupo (su tercero es una persona o una entidad), se queda como está: la
  actividad se apunta igual y no se le pone `ficha.grupo`.

### 8. La plantilla vieja, uno por relacionado

En un asunto de actividad los relacionados son el alumnado. La plantilla del centro
«Participación del profesorado en actividad extraescolar» (fichero `participacion-actividad.docx`)
**no se ofrece** en «Generar para todos ▾» ni en «… para cada relacionado» de un asunto que lleve
`ficha.actividad`. La plantilla no se borra ni se cambia. La sustituye el certificado de la fila
311.

## Qué NO se toca

- La guía del tipo ACTIVIDAD EXTRAESCOLAR, sus hitos y sus plantillas.
- Cómo se crea un asunto de grupo normal, ni su tabla «Personas del grupo».
- Los campos propios del tipo: los datos de la actividad no son campos propios.
- El aviso al claustro, la pantalla y el certificado: son las filas 309, 310 y 311.

## Trampas

- `asuntos.json` se reescribe entero: en la ficha, solo `actividad: { id }`. Nada más.
- `js/tercero-renombrar.js` pone al día `ficha.relacionados` cuando una persona cambia de nombre.
  Tiene que poner al día también el `nombre` de esa persona en `profesorado` del registro; si no,
  ese profesor pierde sus actividades.
- El alumnado antiguo (no matriculado este curso) no sale en ninguna unidad: no se ofrece.
- Un módulo nuevo no envuelve: se engancha por un punto previsto o por uno nuevo.
- Las horas son texto `HH:MM`; las fechas, ISO. Nada de fechas escritas a mano.

## Antes de empezar

- No leas el repositorio entero. Basta con `docs/CONTEXTO.md`, `docs/contexto/PERSONAS.md`
  («Terceros relacionados», «Grupos propios»), `docs/contexto/ASUNTOS.md` (Nuevo asunto y la ficha
  en tarjetas), `docs/TRABAJO-EN-BLOQUE.md`, `js/asunto-de-grupo.js`, `js/personas-del-grupo.js`,
  `js/relacionados.js`, `js/grupos.js`, `js/asuntos-nuevo.js`, `js/asuntos-nuevo-campos.js`,
  `js/asuntos-nuevo-crear.js`, `js/ficha-tarjetas.js`, `js/ficha-tarjetas-resumen.js`,
  `js/plazos-del-centro.js` y `js/tipos-unir.js`.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas (`js/asuntos-nuevo.js` tiene
  513: ahí, solo el botón y la llamada).
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`. Añade ahí: **actividad
  extraescolar**, la tarjeta **«La actividad»**, **«Apuntar la actividad»**, **Unidades
  convocadas**, **Organiza** / **Acompaña**, y **Prevista** / **Realizada** / **Anulada**.
- La demostración (`js/demo/datos-actividades.js`, nuevo) tiene que traer: el tipo con la marca;
  al menos cuatro personas de PERSONAL y alumnado de dos unidades; una actividad **prevista** (un
  asunto de actividad abierto, dos unidades, nueve alumnos y tres profesores, uno de ellos
  «Organiza»); una **realizada** (fecha pasada); y una **anulada**.
- Rama `fila-306`, revisor en local y, con su APROBADA, a `main`. Cláusulas comunes en
  `docs/REPARTO-DE-LA-COLA-2026-09-27.md`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs actividades grupo
  nuevo-asunto relacionados`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/actividades.js`: nuevo. El registro, las funciones sin efectos, la pasada del tipo,
  `ponerAlDia`, papelera y unir.
- `js/actividades-formulario.js`: nuevo. El formulario.
- `js/actividades-ficha.js`: nuevo. La tarjeta «La actividad».
- `css/actividades.css`: nuevo.
- `js/asunto-de-grupo.js`: solo lo justo para que el seudo-tercero lleve los datos de la
  actividad y `origen: 'actividad'`.
- `js/asuntos-nuevo.js`, `js/asuntos-nuevo-campos.js`, `js/asuntos-nuevo-crear.js`: el botón
  «Apuntar la actividad» y la línea que apunta la actividad al crear.
- `js/ficha-tarjetas.js`, `js/ficha-tarjetas-resumen.js`: la tarjeta nueva y su resumen.
- `js/copias.js`, `js/conflictos.js`: el fichero compartido nuevo.
- `js/tercero-renombrar.js`: lo de «Trampas».
- `js/personas-del-grupo.js` y `js/generar-para-relacionados.js` (o `js/hitos-generar.js`, donde se
  monte la lista de plantillas): el punto 8.
- El sitio único de borrar y recuperar un asunto (`js/asunto-renombrar.js` o `js/papelera.js`) y
  `js/tipos-unir.js`: una línea cada uno.
- `index.html`, `js/novedades.js`, `js/demo/datos-actividades.js`, `js/demo/arrancar.js` (la
  lista de ficheros de la demostración), `docs/VOCABULARIO.md`.
- `pruebas/actividades.mjs`: nueva. Casos: `situacion` y `cuenta` (prevista, realizada desde el
  día siguiente al fin, anulada, en la papelera); `unidadesDe`; `fechasLegibles` de un día y de
  varios; crear una actividad desde «Nuevo asunto» con una unidad y dos personas desmarcadas;
  nombre de carpeta `… GRUPO <nombre corto>`; `ficha.actividad` y el registro guardados;
  «Desmarcar todos»; «Cambiar» añade y quita alumnado; anular y deshacer; a la papelera y de
  vuelta; la plantilla vieja no se ofrece; solo consulta, nada escribe.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (una línea), `docs/CONTEXTO.md` (la tabla de `_GESTOR`),
  `docs/contexto/ASUNTOS.md`, `docs/contexto/PERSONAS.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`
  y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que al elegir el tipo «Actividad extraescolar» en «Nuevo asunto» sale el botón
«Apuntar la actividad»; que se eligen las unidades, sale su alumnado marcado y se desmarca a quien
no va; que el profesorado se apunta diciendo quién organiza y quién acompaña; y que la ficha del
asunto tiene una tarjeta «La actividad» con todo y con «Cambiar» y «Anular la actividad».

## Cómo sabemos que está bien

En la copia de demostración.

1. Abrir «Nuevo asunto» y elegir el tipo «ACTIVIDAD EXTRAESCOLAR»: sale un botón «Apuntar la
   actividad».
2. Pulsarlo: se abre una ventana ancha con Nombre de la actividad, Nombre corto, fechas, horas,
   Lugar, Departamento, Horas de dedicación, Unidades convocadas y Profesorado. «Seguir» está
   apagado.
3. Escribir un nombre: el nombre corto se rellena solo. Poner la fecha de inicio: la de fin se
   pone igual.
4. Señalar una unidad: sale su alumnado, todo marcado, y el título dice «van N de N». Desmarcar a
   dos personas: dice «van N-2 de N» y la cuenta de abajo baja en dos.
5. Pulsar «Desmarcar todos»: nadie queda marcado y «Seguir» se apaga. Pulsar «Marcar todos»: todos
   vuelven.
6. Señalar una segunda unidad: sale un segundo bloque con su alumnado marcado.
7. En Profesorado, elegir a tres personas: salen en una lista, cada una con «Acompaña». Cambiar una
   a «Organiza».
8. Pulsar «Seguir»: se vuelve a «Nuevo asunto» con «Grupo <nombre corto> · N personas» y la fecha
   límite puesta con la fecha de la actividad. Pulsar «Cambiar» en ese recuadro: el formulario
   vuelve con todo lo que se había puesto.
9. Crear el asunto: la carpeta se llama `… ACTIVIDAD EXTRAESCOLAR GRUPO <nombre corto>` y la ficha
   se abre sin ningún error en la consola.
10. En la ficha hay una tarjeta «La actividad» con la fecha, el lugar, cuánto alumnado y cuánto
    profesorado, y «Prevista». Abrirla en grande: se ven las unidades con «van N de M» y el
    profesorado separado en «Organiza» y «Acompaña». Ocupa todo el ancho.
11. La tarjeta «Personas del grupo» tiene una fila por cada alumno marcado, ni uno más.
12. En «La actividad», pulsar «Cambiar», desmarcar a un alumno y guardar: la tarjeta cuenta uno
    menos y «Personas del grupo» también.
13. En «Personas del grupo», quitar a una persona del grupo: la tarjeta «La actividad» cuenta uno
    menos sin tocar nada más.
14. Pulsar «Anular la actividad» y aceptar: dice «Anulada» y aparece «Deshacer la anulación».
15. Abrir la actividad de la demostración con la fecha ya pasada: dice «Realizada».
16. En «Personas del grupo» → «Generar para todos ▾» no sale «Participación del profesorado en
    actividad extraescolar».
17. Con «En este ordenador, solo consultar» puesto: la tarjeta se ve y sus botones están apagados.
18. Crear después un asunto normal de otro tipo: no queda nada de la actividad en «Nuevo asunto».
