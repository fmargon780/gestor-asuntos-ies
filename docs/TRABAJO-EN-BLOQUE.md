# Trabajo en bloque: el asunto de grupo y su lista de personas (fila 293)

Cerrado con Francisco el 7-oct-2026. Idea suya: «un sistema de creación y gestión de tareas en
bloque, como emitir un certificado a un grupo de alumnos de una clase, emitir un mailing masivo y
cosas así». Es la primera de cuatro filas:

- **293 (esta)**: crear un asunto para un grupo y ver, persona por persona, qué se le ha hecho.
- **294**, `docs/TRABAJO-EN-BLOQUE-PDF-Y-REGISTRO.md`: el PDF de cada uno y el registro de Séneca.
- **295**, `docs/TRABAJO-EN-BLOQUE-ENVIAR-A-TODOS.md`: enviar a todos de una vez, y los avisos.
- **296**, `docs/TRABAJO-EN-BLOQUE-LISTA-PEGADA.md`: formar el grupo pegando una lista.

Van en ese orden. Cada una deja la aplicación usable por sí sola.

## Qué pasa hoy

Casi todo existe, pero escondido y sin seguimiento:

- Un asunto puede llevar «relacionados» (`ficha.relacionados`), y con «+ Añadir varios» entra una
  unidad, un nivel o un grupo propio de una vez (`js/relacionados.js`, `js/grupos.js`).
- En la mesa de un hito, «… para cada relacionado (N)» genera un Word por persona y, al acabar,
  ofrece «Enviar a cada uno» (`js/generar-para-relacionados.js`).
- La ficha de una persona enseña, al final, «Relacionado con este asunto» con el nombre del asunto
  y nada más (`js/relacionados-archivar.js`).

Lo que falta: no hay un sitio claro por donde empezar un trabajo para un grupo; el asunto tiene que
tener un tercero que es una persona, aunque el trabajo sea de treinta; y la app solo apunta
«Generados 30 documentos», sin decir a quién se le ha hecho qué.

## Qué decidió Francisco

1. **Un solo asunto para todo el grupo**, con una sola carpeta. No un asunto por persona.
2. **El documento de cada persona se guarda solo en la carpeta del asunto de grupo.** No se copia
   a la carpeta de la persona en el ARCHIVO. La ficha de la persona lleva hasta él.
3. **Tiene que poder saber, el día de mañana, qué se le envió o se le emitió a cada persona.** Lo
   mira en la ficha de la persona.
4. El grupo se elige por unidad, por nivel o por un grupo propio, y antes de crear se pueden quitar
   o añadir personas sueltas. (Pegar una lista: fila 296.)

## Palabras de este documento

- **Asunto de grupo**: un asunto cuyo tercero no es una persona sino un grupo. Lleva `ficha.grupo`.
- **Personas del grupo**: sus relacionados de siempre (`ficha.relacionados`). No hay lista nueva.
- **Trabajo**: lo que se le hace a todo el grupo con una misma plantilla de documento (o, desde la
  fila 295, un aviso). En pantalla no se usa la palabra «lote».

## Qué hay que hacer

### 1. Crear un asunto de grupo

- En «Nuevo asunto», debajo del buscador de la persona, un botón: **«Es para un grupo de
  personas»**.
- Abre el buscador de terceros en su modo de señalar varios, **el mismo que ya usa «+ Añadir
  varios»** (`App.pintarBuscadorDeTercero` con `multiple: true`), con sus atajos de alumnado
  (unidad, nivel, enseñanza) y «Meter un grupo entero». Ahí se quita o se añade a quien haga falta,
  con los chips de siempre. Botón: **«Usar los N señalados»**. Con menos de dos, apagado.
- Después pide **«Nombre del grupo»**, ya relleno cuando se puede: de una unidad, el nombre
  compacto que da `Nombres.grupoCompacto`; de un nivel, nivel y enseñanza; de un grupo propio, su
  nombre. Si se han mezclado caminos o se ha tocado la lista a mano, vacío y obligatorio. Hasta 40
  caracteres, limpio con `U.limpiarNombre`.
- En el formulario, donde sale la persona elegida, sale **«Grupo <nombre> · N personas»** con
  «Cambiar» (vuelve al buscador con los mismos señalados).
- **Categoría del asunto**: la de sus personas si todas son de la misma; si no, `OTROS`. La
  parrilla de tipos se limita a esa categoría, como hoy con una persona.
- **Tercero del asunto**: el texto `GRUPO <nombre>`. La carpeta se llama como todas:
  `AAMMDD A26-0137 TIPO GRUPO <nombre>`.
- Al crear: `ficha.grupo = { nombre, origen, creado }` (`origen`: `unidad`, `nivel`, `grupo` o
  `mano`) y las personas entran en `ficha.relacionados`, de una sola escritura, por
  `Relacionados.combinarRelacionados`. La parada de «idéntico» y el recuadro de «lo que ya tiene el
  tercero» funcionan solos con el tercero `GRUPO <nombre>`.
- El formulario se sigue preparando desde cero cada vez (`App.prepararNuevo`): no queda ningún
  grupo de la vez anterior.

### 2. Un asunto de grupo no tiene una persona detrás

En todos los sitios donde la aplicación busca al tercero del asunto en las listas de personas, un
asunto con `ficha.grupo` enseña **«Grupo de N personas»** y nunca un «no encontrado», un hueco
vacío ni un error. Un solo criterio, en un solo sitio: una función `EsGrupo(a)` (en el módulo
nuevo). Sitios a mirar, como mínimo (búscalos con `grep` de `Datos.resumenDeTercero`,
`buscarPersonaDelAsunto`, `personaDelAsunto` y `terceroDelAsunto`):

- La cabecera de la ficha del asunto: los datos del tercero junto al nombre y «Elegir datos».
- «Datos y contacto», «Ver todo» del alumno y «Correo a la familia».
- «Quién lo pide»: no se propone el propio tercero.
- El cuadro de Correo y el de Séneca abiertos desde el asunto: sin destinatario propuesto.
- «Generar documento ▾» normal (un solo documento): se puede usar, pero los huecos de persona
  quedan como «lo que falta»; no se toca.
- **«Hacer este hito» (fila 285) no sale en un asunto de grupo**: generaría un solo documento sin
  persona. Lo sustituyen los botones de la lista.
- En «Personas y empresas» y en el buscador de terceros, `GRUPO <nombre>` **no sale como si fuera
  una persona**.
- «Cambiar el asunto»: se puede cambiar el nombre del grupo; no se puede convertir en asunto de
  una persona ni al revés (aviso claro).

### 3. La lista: tarjeta «Personas del grupo»

En la ficha del asunto, la tarjeta de personas relacionadas de hoy (`#ficha-relacionados`) pasa a
ser, en un asunto de grupo, **«Personas del grupo (N)»**. En pequeño, su resumen de una línea:
«30 personas · 28 generados · 12 registrados · 0 enviados». Abierta en grande, a todo el ancho:

- Una **tabla con una fila por persona**: Persona · Unidad (solo alumnado) · **Generado** ·
  **Registrado** · **Enviado** · «⋯».
  - *Generado*: la fecha. Pulsarla abre ese documento en el visor.
  - *Registrado*: el número de registro (`26SM0412`). Vacío si no lo tiene.
  - *Enviado*: fecha y dirección. Vacío si no se le ha enviado.
  - «⋯»: «Abrir su ficha», «Copiar el nombre» (el de `Relacionados.nombreEnOrdenNormal`) y «Quitar
    del grupo» (apagado si ya tiene algo generado o enviado).
- **Todo sale de lo que la aplicación ya guarda; no hay fichero ni lista nuevos**:
  - generado: `ficha.documentos[<número>]` con `generadoDe` = `plantilla|categoría|nombre`
    (fila 239), mientras su fichero siga en la carpeta;
  - registrado: los `registros` de ese mismo documento;
  - enviado: `ficha.enviosPorPersona` (`{ documento, correo, cuando, quien }`).
  Una función sin efectos, `PersonasDelGrupo.estado(a, ficherosDeLaCarpeta)`, devuelve la tabla
  entera. Se prueba sola.
- Arriba: la cuenta, un buscador por nombre (con más de 15 personas), la casilla **«Solo lo que
  falta»** y, si en el asunto se ha generado con más de una plantilla, un desplegable **«Qué se
  mira»** con cada trabajo («Certificado de matrícula · 7-oct-2026»). Las columnas son las del
  trabajo elegido; por defecto, el último.
- Botones: **«Generar para todos ▾»**, con las mismas plantillas que ofrece la mesa del hito
  actual y que llama a `GenerarParaRelacionados.generar(a, plantilla, hitoActual)` sin cambiarlo
  (queda apuntado en el hito actual, como desde su mesa); y **«+ Añadir personas»**, que es el
  «+ Añadir varios» de hoy.
- La tabla se repinta sola al terminar de generar o de enviar, sin perder la posición ni lo
  escrito en el buscador (`U.conservandoLoEscrito`). Con 600 filas tiene que seguir siendo ágil:
  una sola pasada, sin leer un fichero por fila.
- En solo consulta y cuando el compañero tiene el mando: se ve todo, los botones apagados.
- **Un asunto normal con relacionados** (el de una actividad extraescolar con sus profesores) usa
  la misma tabla en cuanto alguno tenga algo generado o enviado. Sin nada, se queda como hoy.

### 4. En la ficha de cada persona

En «Personas y empresas», tarjeta «Sus asuntos», debajo de los suyos, un apartado **«En asuntos de
grupo»**. Sustituye al bloque suelto «Relacionado con este asunto» de hoy.

- Una línea por asunto y trabajo:
  **«Certificado de matrícula · generado el 7-oct-2026 · registrado 26SM0412 · enviado el
  8-oct-2026 a familia@correo.es»**, y debajo, en pequeño, el nombre del asunto y «Abierto» o
  «Archivado».
- Pulsar la línea abre el documento de esa persona (asunto abierto) o la ficha del asunto.
- Un asunto en el que la persona es relacionada pero no se le ha hecho nada sale como hoy: solo su
  nombre.
- **Archivados**: qué asuntos son ya lo sabe el índice del ARCHIVO
  (`Relacionados.asuntosDondeEsRelacionado`). El detalle se lee de la ficha que bajó a la carpeta
  de cada uno de esos asuntos, solo de esos, y solo al abrir la tarjeta. Nunca se recorre el
  ARCHIVO entero.
- El título de la tarjeta cuenta también estas líneas.

### 5. Que se encuentre

- El buscador de Inicio encuentra un asunto de grupo abierto escribiendo el nombre de una de sus
  personas. (El del ARCHIVO ya lo hace: su índice guarda los relacionados.) Si hoy no lo hace,
  añádelo donde se monta el texto de búsqueda de un asunto abierto.
- En la tabla de Inicio, en la columna «Tercero», un asunto de grupo dice «Grupo <nombre> · N».

## Qué NO se toca

- Cómo se genera cada documento (`js/generar-para-relacionados.js`): Word por persona, como hoy.
  El PDF de cada uno y la muestra previa son de la fila 294.
- «Enviar a cada uno» del resumen: sigue como está hasta la fila 295.
- Archivar con relacionados: sigue preguntando a quién se deja la nota en su carpeta.
- Los grupos propios de Ajustes y el desplegable «Añadir un grupo» del cuadro de Correo.
- Los asuntos que ya existen: ninguno pasa a ser de grupo. No hay nada que migrar.

## Trampas

- `asuntos.json` es un fichero compartido que se reescribe entero. Un grupo de 600 personas pesa.
  No añadas nada por persona que se pueda deducir (por eso la tabla es calculada).
- `js/tercero-renombrar.js` pone al día `ficha.relacionados` cuando una persona cambia de nombre o
  de Nº escolar. Comprueba que también pone al día el `generadoDe` de sus documentos y la persona
  de `enviosPorPersona`; si no, esa persona «pierde» lo que se le hizo en la tabla. Arréglalo ahí.
- Todo guardado de la ficha, por `ColaGuardado`; las listas, con `App.anotarLista`.
- La carpeta de `GRUPO <nombre>` en el ARCHIVO (`ARCHIVO / categoría / GRUPO <nombre>`) no debe
  convertir al grupo en una persona «antigua» en ninguna lista.

## Antes de empezar

- No leas el repositorio entero. Basta con `docs/CONTEXTO.md`, `docs/contexto/PERSONAS.md` (los
  apartados «Terceros relacionados» y «Grupos de personas»), `docs/contexto/ASUNTOS.md` (Nuevo
  asunto y la ficha en tarjetas), `js/relacionados.js`, `js/relacionados-ficha.js`,
  `js/relacionados-archivar.js`, `js/generar-para-relacionados.js`, `js/asuntos-nuevo.js`,
  `js/asuntos-nuevo-campos.js`, `js/asuntos-nuevo-crear.js`, `js/ficha-tarjetas.js`,
  `js/ficha-persona.js` y `js/archivo-personas.js`.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas (`js/asuntos-nuevo.js` tiene
  509: ahí, solo el botón y la llamada).
- Un módulo nuevo no envuelve: se engancha por un punto previsto o por uno nuevo.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`; añade ahí «asunto de grupo» y
  «personas del grupo».
- La demostración tiene que traer: alumnado de al menos dos unidades; un asunto de grupo de una
  unidad con seis personas, tres de ellas con su documento generado, una con registro y una con
  envío; y una plantilla de documento con huecos de persona para el tipo de ese asunto.
- Rama `fila-293`, revisor en local y, con su APROBADA, a `main`. Nada en una petición de cambios
  abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs grupo relacionados
  generar-para ficha-persona nuevo-asunto`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/asunto-de-grupo.js`: nuevo (`AsuntoDeGrupo`; mira antes que el nombre esté libre).
  `EsGrupo(a)`, el botón y el paso de «Nuevo asunto», el nombre del grupo, crear con sus personas.
- `js/personas-del-grupo.js`: nuevo (`PersonasDelGrupo`). `estado(a, ficheros)` sin efectos, la
  tabla, sus filtros y sus botones.
- `js/personas-del-grupo-ficha.js`: nuevo. El apartado «En asuntos de grupo» de la ficha de la
  persona.
- `js/asuntos-nuevo.js`, `js/asuntos-nuevo-campos.js`, `js/asuntos-nuevo-crear.js`: solo el botón,
  el tercero de grupo y `ficha.grupo` al crear.
- `js/relacionados-ficha.js` y `js/ficha-tarjetas.js` (y `js/ficha-tarjetas-resumen.js`): la
  tarjeta, su título y su resumen.
- `js/relacionados-archivar.js`: quitar el bloque «Relacionado con este asunto» (lo sustituye el
  apartado nuevo) y su envoltura de `App.verFicha`, con su línea de
  `js/envolturas-esperadas.js`.
- `js/archivo-personas.js` o `js/ficha-persona.js`: el sitio del apartado nuevo.
- Los sitios del punto 2 que haga falta, cada uno con una línea (`AsuntoDeGrupo.esGrupo`).
- `js/tercero-renombrar.js`: solo si falla lo de «Trampas».
- `index.html`, `css/…`, `js/novedades.js`, `js/demo/…`, `docs/VOCABULARIO.md`.
- `pruebas/asunto-de-grupo.mjs`: nueva. Casos: crear desde una unidad con una persona quitada y
  otra añadida; nombre de carpeta `… GRUPO <nombre>`; `ficha.grupo` y relacionados guardados;
  categoría mezclada da `OTROS`; con una persona señalada el botón está apagado; el formulario
  vuelve a salir limpio; `GRUPO …` no sale como persona en el buscador; «Hacer este hito» no sale.
- `pruebas/personas-del-grupo.mjs`: nueva. Casos: `estado` con generado, registrado y enviado;
  documento borrado de la carpeta deja de contar; dos plantillas dan dos trabajos; «Solo lo que
  falta»; «Quitar del grupo» apagado con algo hecho; la ficha de la persona enseña la línea con
  sus tres fechas, de un asunto abierto y de uno archivado; solo consulta, nada escribe.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituyendo la línea de «Terceros relacionados», no
  añadiendo), `docs/contexto/PERSONAS.md`, `docs/contexto/ASUNTOS.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en «Nuevo asunto» hay un botón «Es para un grupo de personas»; que el asunto
de grupo tiene una sola carpeta y una tarjeta «Personas del grupo» con una fila por persona y lo
que se le ha generado, registrado y enviado; que desde ahí se genera para todos; y que la ficha de
cada persona dice, en «Sus asuntos», qué se le hizo y cuándo.

## Cómo sabemos que está bien

En la copia de demostración.

1. «Nuevo asunto»: debajo del buscador hay un botón «Es para un grupo de personas».
2. Pulsarlo, elegir una unidad con su atajo: quedan señaladas todas sus personas. Quitar una con
   su ×. «Usar los N señalados».
3. Pide «Nombre del grupo», ya relleno con el de la unidad. Aceptar: el formulario dice «Grupo
   <nombre> · N personas» y la parrilla enseña los tipos de alumnado.
4. Elegir un tipo y crear: la carpeta se llama `… GRUPO <nombre>`. Se abre la ficha (o la mesa del
   primer hito, si el tipo tiene guía) sin ningún error en la consola.
5. En la ficha del asunto: la cabecera dice «Grupo de N personas», no hay ningún «no encontrado»
   y hay una tarjeta «Personas del grupo (N)».
6. Abrir esa tarjeta en grande: una fila por persona, con las columnas Generado, Registrado y
   Enviado, vacías. Ocupa todo el ancho.
7. «Generar para todos ▾», elegir la plantilla: al terminar, la columna Generado tiene la fecha de
   hoy en todas las filas y el resumen dice «N personas · N generados».
8. Pulsar la fecha de una fila: se abre el documento de esa persona, con su nombre dentro.
9. En el asunto de grupo que trae la demostración: tres filas con Generado, una con número en
   Registrado y una con fecha y dirección en Enviado. «Solo lo que falta» deja fuera a la que lo
   tiene todo.
10. En una fila con algo generado, «⋯» → «Quitar del grupo» está apagado. En una sin nada, quita a
    la persona y la cuenta baja en uno.
11. «Personas y empresas» → abrir a una persona de ese grupo que tiene documento: en «Sus
    asuntos», apartado «En asuntos de grupo», una línea con el nombre de la plantilla y «generado
    el …». Pulsarla abre su documento.
12. En «Personas y empresas» → Alumnado, buscar «GRUPO»: no sale ningún grupo como si fuera una
    persona.
13. En Inicio, escribir en el buscador el apellido de una persona del grupo: sale el asunto de
    grupo. En la columna «Tercero» dice «Grupo <nombre> · N».
14. En la mesa de un hito del asunto de grupo no hay botón «Hacer este hito».
15. Con «En este ordenador, solo consultar» puesto: la tabla se ve y sus botones están apagados.
    Sin errores en la consola en ningún punto.
