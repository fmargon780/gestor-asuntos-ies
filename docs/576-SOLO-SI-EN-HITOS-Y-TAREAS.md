# 576 — «Solo si» en hitos y tareas (sustituye a los hitos-pregunta)

## Lo que escribió Francisco

> Hasta ahora, en los hitos, puedo hacer que sea una pregunta y que según la respuesta se habiliten
> unos hitos posteriores u otros. Creo que algo similar podríamos hacer con las tareas de cada hito?
> También sería muy útil que todos esos campos que se debe o se puede cuplimentar en los hitos y
> tareas apuntaran a tablas o listas editables. Por ejemplo, ahora mismo si quiero marcar que el
> responsable de un hito es el equipo educativo no tengo esa opción disponible. Debería poder crear
> ese valor desde el mismo proceso de trabajo.

Después, sobre la propuesta de Claude de condicionar con un campo del asunto: «me interesa mucho.
Porque además estoy teniendo ahora mismo problemas con los "hitos-pregunta", ya que los hitos que van
dentro de la respuesta a una pregunta no me deja cambiarlos de orden».

## Lo que entendió Claude (acordado con Francisco el 10-nov-2026)

- Esta tarea es solo la primera parte (tareas e hitos según una condición). Las listas editables
  con «+ Nuevo…» van aparte (fila 577).
- En el editor de la guía, cada hito y cada tarea llevan un recuadro **«Cuándo se hace»** con un
  desplegable: «Siempre» (por defecto) o «Solo si el campo «X» vale…».
- Los campos que ofrece el desplegable son **los campos de lista de ese tipo de asunto** (los mismos
  que usan los textos condicionales). Al elegir uno salen sus opciones como casillas; se pueden
  marcar una o varias («Familia o Alumno mayor de edad»). Debajo, la nota: «En el asunto, si el campo
  tiene otro valor, esto no sale.»
- Si el tipo no tiene campos de lista, el desplegable solo ofrece «Siempre».
- En la tira de hitos de la guía y en la lista de tareas, lo condicionado lleva una **etiqueta
  amarilla** «Solo si <campo>: <valor> o <valor>».
- **Ya no hay hitos dentro de respuestas**: todos los hitos de la guía van en una sola lista, y
  todos (también los condicionados) se ordenan con ↑ ↓. Las tareas de un hito, igual.
- En el asunto:
  - Un hito o tarea con «Solo si» sale cuando el campo tiene uno de los valores marcados; si tiene
    otro valor, no sale.
  - Con el campo **vacío** salen todos, marcados en amarillo con «Falta: <campo>», igual que los
    textos condicionales.
  - Al rellenar o cambiar el campo, lo que no toca desaparece solo y lo que toca aparece.
  - Un hito o una tarea **ya hecho no desaparece** aunque después cambie el campo.
- **Desaparecen los hitos-pregunta** (la casilla «esto es una pregunta», las opciones y los hitos
  dentro de cada respuesta).
- **Las guías que ya tienen preguntas las pasa la app sola**:
  - Cada pregunta se convierte en un campo de lista del tipo, con sus respuestas como opciones.
  - Los hitos que había dentro de cada respuesta pasan a la lista única, en el sitio de la pregunta,
    con «Solo si <ese campo> vale <esa respuesta>». Las preguntas dentro de respuestas se pasan
    igual, sumando las condiciones de arriba.
  - En los asuntos abiertos que ya contestaron una pregunta, el campo queda relleno con la
    respuesta elegida.

## Pantalla de prueba

- Aprobada el 10-nov-2026: `docs/pantallas/576.html` ·
  https://claude.ai/artifact/KfeVFVjVanJFQ8Tv5XZu85

## Qué NO se hace en esta tarea

- Listas editables y crear un valor nuevo desde el propio hito o la guía (por ejemplo, el
  responsable «Equipo educativo», o un campo nuevo desde «Cuándo se hace»): fila 577.
- Condiciones con algo que no sea un campo de lista del asunto.

## Notas técnicas de Claude

- Modelo de la guía: `js/guias.js` (`normalizar`, `esPregunta`, `opciones`); `esPregunta` está
  repetida en `js/guias-columnas.js` y `js/guias-mapa.js`. Editor: `js/guias-editor.js` (niveles y
  «entrar en una pregunta», fila 95), `js/guias-paso-bloques.js`, `js/guias-plegado.js`,
  `js/guias-vista.js`, `js/guias-mapa.js`. En el asunto: `js/hitos-arbol.js`, `js/hitos-sincronizar.js`,
  `js/hitos-desde-el-asunto*.js`, `js/hito-mesa.js`, «Qué me toca».
- Guardar la condición como `soloSi: { campo, valores: [] }` en el hito y en el uso de la tarea
  dentro del hito de la guía (no en la lista común de tareas del plan de las guías, fila 551: una
  misma tarea común puede ir condicionada en una guía y no en otra).
- Campos y opciones: `TextoCondicional.camposDeLista(tipo, ficha)` (`js/texto-condicional.js`). El
  valor del campo en el asunto se lee de donde lo leen los textos condicionales.
- La conversión de las preguntas: una vez, sola, al entrar (como el plan de las guías), con copia
  previa del fichero de guías; si un campo con ese nombre ya existe en el tipo y sus opciones no
  casan, se le da otro nombre («<pregunta> (respuesta)») en vez de mezclarlo. Pasa por
  `ColaGuardado` y respeta `SoloConsulta.activo()`.
- La demo no tiene ninguna guía con pregunta: añadir una (por ejemplo en CAMBIO DE GRUPO, «¿Quién
  lo pide?» con dos respuestas y un hito dentro de una) y un asunto abierto que la haya contestado,
  para que el revisor vea la conversión.
- Ojo con `docs/VOCABULARIO.md`: «Cuándo se hace», «Solo si», «Falta: <campo>».

## Cómo lo comprueba el segundo revisor (Cómo sabemos que está bien)

- En el editor de la guía, cada hito y cada tarea tienen «Cuándo se hace» con «Siempre» y «Solo si
  el campo «X» vale…» por cada campo de lista del tipo; al elegir un campo salen sus opciones como
  casillas.
- Marcar un campo y un valor pone la etiqueta amarilla en la tira de hitos o en la tarea.
- Ya no existe la casilla de pregunta ni se entra en respuestas; un hito condicionado se sube y se
  baja con ↑ ↓.
- La guía de demo que tenía pregunta sale convertida: hay un campo de lista con las respuestas y el
  hito que estaba dentro lleva «Solo si».
- En el asunto de demo que ya contestó la pregunta, el campo está relleno y solo sale lo que toca.
- En un asunto con el campo vacío salen todos los condicionados en amarillo con «Falta: <campo>».
- Al rellenar el campo desaparece lo que no toca; un hito ya hecho no desaparece al cambiar el
  campo.
- Comparar el editor con `docs/pantallas/576.html`: lo de «Cuándo se hace» está en el mismo sitio.

## Qué mirar al terminar

- Abre la guía de un tipo que tuviera preguntas: los hitos que estaban dentro de respuestas están en
  la lista con su etiqueta amarilla.
- Sube con ↑ uno de esos hitos.
- En una tarea, pon «Solo si» con un campo de lista.
- En un asunto de ese tipo con el campo vacío, mira lo amarillo; rellena el campo y mira qué
  desaparece.

## Revisión y respuestas durante el trabajo

- Segundo revisor (10-nov-2026, demo con Playwright, sin errores de consola): **APROBADA**.
  - «Cuándo se hace» en cada hito y tarea, con «Siempre» y los campos de lista del tipo, casillas y nota: coincide (mismo sitio que `docs/pantallas/576.html`).
  - Etiqueta amarilla en la tira de hitos y en la línea de la tarea: coincide.
  - Tipo sin campos de lista (solo «Siempre»): coincide. Sin casilla de pregunta ni respuestas: coincide. ↑ ↓ de un hito condicionado: coincide.
  - Guía de RECLAMACIÓN DE NOTAS convertida (campo de lista, hitos en lista única con «Solo si»): coincide.
  - Asunto que contestó (campo «Familia», solo lo que toca) y asunto con el campo vacío (todo con «Falta: …» en amarillo): coincide.
  - Cambiar el campo repinta sola la pantalla (sin recargar) y lo que no toca desaparece y vuelve: coincide. Un hito ya hecho no desaparece: coincide.
  - No lo he podido ver: «Guardar» de la guía en un asunto real (la demo no guarda nada).
  - Rareza vista y corregida antes de publicar: al volver el campo a un valor que hace reaparecer un hito de más arriba, dos hitos quedaban «en curso»; ahora el en curso es siempre el primero sin hacer que sale.
  - Límite conocido (no es de esta fila): en «Campos del asunto» un campo de lista vacío no aparece (solo los que tienen valor); se rellena desde «Cambiar el asunto → Datos del asunto». La etiqueta «Falta: …» no es pulsable.
- Pasada completa de `npm test`: en verde.
