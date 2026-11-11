# 615 — Listas editables: «+ Nuevo…» en los desplegables de hitos y tareas

## Lo que escribió Francisco

> También sería muy útil que todos esos campos que se debe o se puede cuplimentar en los hitos y
> tareas apuntaran a tablas o listas editables. Por ejemplo, ahora mismo si quiero marcar que el
> responsable de un hito es el equipo educativo no tengo esa opción disponible. Debería poder crear
> ese valor desde el mismo proceso de trabajo.

(Idea 577, apartada de la 576; tema 582: «que el valor que falta se pueda crear desde el propio
trabajo con «+ Nuevo…» (por ejemplo, un responsable o un campo de lista nuevo desde «Cuándo se
hace»)».)

## Lo que entendió Claude (acordado con Francisco el 11-nov-2026)

- En los desplegables de hitos y tareas cuyos valores son una lista del centro, la **última opción
  es «+ Nuevo…»**, y lo creado queda en esa lista para todas las guías y asuntos:
  - **Responsable** del hito: «+ Nuevo responsable…». En el editor de la guía, en «+ Añadir un
    hito» y al cambiar un hito desde el asunto, y en el responsable de la mesa del hito. Se guarda
    en Ajustes › Hitos.
  - **«Esperamos a…»** (A quién le toca): «+ Nuevo responsable…», la misma lista que Responsable.
  - **Tipo de documento que suele salir de aquí** (Documentos de este hito): «+ Nuevo tipo de
    documento…». Se guarda en Ajustes › Tipos de documento.
  - **Cuándo se hace**: «+ Nuevo campo de lista…».
  - **Plantilla de correo** y **Plantilla de documento** de la tarea: «+ Nueva plantilla…».
- Al elegir «+ Nuevo…», el desplegable se queda con lo que tenía y se abre un cuadro. «Cancelar»
  lo cierra y no cambia nada.
- **Responsable y tipo de documento**: el cuadro pide solo el nombre. Al pulsar «Crear»:
  - Si ya está en esa lista (sin contar mayúsculas ni tildes), dice «“X” ya está en esta lista.» y
    no crea nada.
  - Si se parece a uno de **esa misma lista** (uno contiene al otro como palabras enteras, de más de
    tres letras; por ejemplo «Jefatura de estudios» y «Jefatura»), sale el aviso «Ya hay algo
    parecido en esta lista:» con cada parecido y su botón «Usar “X”», y «Si es otra cosa distinta,
    pulsa otra vez el botón de crear». «Usar» elige el que ya existe; pulsar otra vez «Crear», lo
    crea. Escribir en el nombre quita el aviso.
  - Lo creado queda elegido en el desplegable desde el que se creó, y sale ya en los demás
    desplegables de la misma lista.
- **Campo de lista** (Cuándo se hace): el cuadro pide el nombre y las opciones, una por línea. Su
  lista es la lista de campos de la app (los campos de lista de todos los tipos):
  - Si el tipo ya tiene un campo con ese nombre, lo dice y no crea nada.
  - Si se parece a un campo de lista que ya existe en la lista de campos, sale el mismo aviso, con
    de dónde sale («la lista de campos (lo usa SANCION)»); «Usar» añade ese campo a este tipo y lo
    deja elegido con sus opciones.
  - Si no, pide al menos dos opciones; al crear, el campo se añade a la lista de campos y a este
    tipo, y queda elegido en «Cuándo se hace» con sus opciones como casillas, sin marcar. Sale ya
    también en los demás «Cuándo se hace» de la guía.
- **Plantilla**: «+ Nueva plantilla…» abre el editor de plantillas de siempre, ya con el tipo de la
  guía. Al guardar se vuelve a la tarea con la plantilla nueva elegida («Nombre (TIPO)»). Si el
  nombre se parece a otra plantilla, sale el mismo aviso con «Usar».
- **«Sus profesores» pasa a ser un responsable fijo**, como «El tutor del alumnado», en el grupo de
  papeles del desplegable de Responsable y en «Esperamos a…». En un asunto de grupo son todos los
  del grupo. Como los demás papeles, un hito suyo cuenta como pendiente de terceros.
- Con la app en solo consulta (directivos) no sale «+ Nuevo…».
- No desaparece nada.

## Pantalla de prueba

- Aprobada el 11-nov-2026: `docs/pantallas/582.html` · https://claude.ai/artifact/4d7JbZyHQjsBhzqmzptTy3
- Los datos son inventados. Lo que la pantalla no dibuja (el editor de plantillas entero, la mesa
  del hito) se comporta como dice el texto de arriba.

## Qué NO se hace en esta tarea

- Que el aviso busque en todo lo que la app conoce (otras listas, columnas de las tablas, papeles
  con otros nombres) y no solo en la lista del propio desplegable: idea 616.
- «+ Nuevo…» en los desplegables que son cosas que la app sabe hacer (Qué se hace, Por dónde,
  Entrada o salida, Cómo se cuentan, Desde): un valor nuevo ahí es programar.
- No cambia a quién van los correos: «Sus profesores» como responsable no propone destinatarios.

## Notas técnicas de Claude

- Un solo módulo para el cuadro y el aviso de parecidos (p. ej. `js/lista-nuevo.js`), que usan
  todos los desplegables; cada uno le pasa su lista, cómo crear y cómo usar. Valor del «+ Nuevo…»:
  `__nuevo__` (como `DocumentosFormulario.TIPO_NUEVO` en `js/documentos-formulario.js`).
- Responsables: `hitos.json › ajustes.responsables` (Ajustes › Hitos, `js/hitos-ajustes.js`). Los
  desplegables: `js/guias-editor-plazo.js` (`paso-responsable`), `js/guias-toca.js` («Esperamos
  a…», `aQuien`), `js/hitos-desde-el-asunto-formulario.js`, `js/hitos-desde-el-asunto-cambiar.js`,
  `js/hito-mesa.js` (hacia la línea 328). Un responsable nuevo se crea con la clase y la marca de
  Administración por defecto de Ajustes › Hitos. En el editor de la guía la lista sale de
  `HitosAdministracion.paraGuia`: lo creado ahí tiene que salir en la guía (no es una persona).
- «Sus profesores»: nuevo papel en `Hitos.PAPELES` (`js/hitos-normalizar.js`, id `profesores`), en
  `PAPELES` de `js/guias-toca.js` y `PAPELES_CORTOS` de `js/hitos-a-quien.js` («Sus profesores»).
  Quiénes son, de `js/correo-para.js` (fila 572), solo donde la app ya enseña a la persona del papel.
- Tipos de documento: `App.E.tiposDocumento` y su guardado de Ajustes; desplegable en
  `js/guias-paso-bloques.js` (`paso-tipo-documento`).
- Cuándo se hace: `js/guias-cuando.js`; campos de lista de la lista única (`Campos.propioDe`,
  `App.E.campos`, `porTipo`) y `TextoCondicional.camposDeLista`. Añadir un campo al tipo como lo
  hace «+ Añadir campo» del tipo (`js/campos-pasos.js`), por `ColaGuardado`.
- Plantillas: `js/guias-guion.js` (`plantillasPara`) y el editor de `js/plantillas-pantalla.js`
  («+ Nueva plantilla»), con vuelta a la tarea y la plantilla elegida.
- Respetar `SoloConsulta.activo()`. Textos a `docs/VOCABULARIO.md` si hace falta («+ Nuevo
  responsable…», «Ya hay algo parecido en esta lista:»).
- Demo: que haya un campo de lista en otro tipo (p. ej. «¿Quién lo pide?» en SANCION) para ver el
  aviso con «Usar». Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- En el editor de la guía de un tipo, Responsable termina en «+ Nuevo responsable…»; con
  «Cancelar», el desplegable sigue con el que tenía.
- «+ Nuevo responsable…» con «Jefatura de estudios»: sale el aviso con «Usar “Jefatura”»; pulsar
  otra vez «Crear» lo crea y queda elegido; sale también en «Esperamos a…», en «+ Añadir un hito» de
  un asunto y en Ajustes › Hitos.
- Con «Dirección» (o «direccion»): dice que ya está en la lista y no crea nada.
- «Sus profesores» sale entre los papeles de Responsable y en «Esperamos a…»; un hito con ese
  responsable cuenta como pendiente de terceros.
- «+ Nuevo tipo de documento…» con «PROPUESTA» lo crea, lo deja elegido y sale en Ajustes › Tipos
  de documento.
- «Cuándo se hace» › «+ Nuevo campo de lista…» con «Quién lo pide»: sale el aviso con el campo de
  otro tipo; «Usar» lo deja elegido con sus opciones como casillas.
- Un campo nuevo con una sola opción pide al menos dos; con dos, queda elegido, sale en la lista de
  campos del tipo y en el «Cuándo se hace» de otra tarea de la misma guía.
- «+ Nueva plantilla…» de una tarea de comunicar abre el editor de plantillas; al guardar vuelve a
  la tarea con la plantilla nueva elegida. Igual en Plantilla de documento.
- En solo consulta no sale ningún «+ Nuevo…».
- Lo que no pueda ver, lo dice en vez de darlo por bueno.

## Qué mirar al terminar

- En una guía, crea un responsable desde el propio hito y mira que sale en otro asunto al añadir
  un hito.
- Elige «Sus profesores» como responsable de un hito y mira en Inicio en qué montón queda el asunto.
- Desde «Cuándo se hace», crea un campo de lista y mira que aparece en los campos del tipo.
- Desde una tarea, crea una plantilla nueva y mira que vuelves a la tarea con ella elegida.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
