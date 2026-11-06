# 553 — Las partes del hito, ordenar tareas y añadir hitos

## Lo que escribió Francisco

Aviso de usuario (algo no funciona), enviado por Francisco desde el botón de soporte el
6-nov-2026 10:54 (copia sin internet, perfil Administración, pantalla «Ficha de un asunto»):

> Las opciones Qué se hace de la Tarea creo que no debe ser una opción desplegada por defecto, debe ser algo más escondido que se use solo cuando el usuario lo necesite.
> Por otro lado entiendo que haya un botón +Añadir tarea justo debajo de la última tarea creada y que se pueda subir o baja a demanda. pero no entiendo ahí mismo el botón + Añadir Hito
> En el Hito las secciones Tareas, Campos, Documentos y Registro deben estar muy bien diferenciadas y que se vean muy fácilmente

Captura: el hito 2 «Esperar respuesta» abierto, con la caja «Nueva tarea…» y «Qué se hace» a la
vista, y «+ Añadir tarea» y «+ Añadir hito» juntos bajo las tareas. Aviso completo:
https://drive.google.com/file/d/1p71tyny-flAiSHedsN0-0HSjqHVP-FTd/view?usp=drivesdk

## Lo que entendió Claude (acordado con Francisco el 6-nov-2026)

- No es un fallo del código: es una mejora de la pantalla del hito abierto.
- Regla que se mantiene (`docs/REGLAS-NEGOCIO.md`, 5-nov-2026): la guía de un tipo se crea y se
  modifica desde un asunto concreto. Esta tarea completa lo que faltaba para hacerlo desde ahí.
- **«Qué se hace» no se toca aquí.** La caja «Nueva tarea…», con su «Qué se hace» a la vista,
  desaparece al aplicar el plan de las guías (fila 551, paso 554). Después, «Qué se hace» solo
  sale dentro de «+ Añadir tarea» → «Crear una tarea nueva» y de «Cambiar la tarea».
- **Las cuatro partes del hito, cada una en su recuadro**: Tareas, Campos, Documentos y Registro.
  Cada recuadro con su cabecera de fondo propio y el título más grande y oscuro que hoy, con su
  cuenta al lado («1 de 4», «2», «1», «2 líneas»). Los títulos pasan a ser «Tareas», «Campos»,
  «Documentos» y «Registro». Lo de dentro de cada parte, igual que hoy. «Normativa», plegada al
  pie, igual que hoy.
- **El menú ⋮ de una tarea nunca se corta** por el borde del recuadro ni de la pantalla: si no cabe
  por debajo, se abre hacia arriba.
- **Subir y bajar tareas.** El menú ⋮ de cada tarea lleva, arriba, «Subir» y «Bajar» (apagados en
  la primera y la última), separados por una raya de las opciones de siempre. Mover una tarea
  cambia el orden en este asunto al momento.
- Si el orden de las tareas de la guía queda distinto del de la guía, sale debajo de las tareas una
  franja: «Has cambiado el orden de las tareas en este asunto.» con dos botones:
  - «Guardar también en la guía»: la guía de este tipo guarda el orden nuevo. Los asuntos nuevos
    de este tipo salen así; los demás asuntos abiertos siguen como están.
  - «Solo en este asunto»: la guía no cambia y la franja se va.
  Las tareas «solo aquí» se mueven igual, pero no cuentan para la franja ni van a la guía.
- **«Cambiar la tarea» deja cambiar también «Qué se hace».** La ventana tiene Nombre, «Qué se hace»
  (las mismas acciones que al crear una tarea nueva) y, si genera o comunica, Plantilla (con
  «+ Plantilla nueva…», que abre el editor de plantillas de siempre). Al cambiar «Qué se hace»
  cambian los datos de debajo (plantilla, o lo que pida esa acción, como hoy al crear). El aviso
  de cuántos tipos la usan sigue igual: cambia en todas las guías; los asuntos abiertos siguen como
  están. En una tarea «solo aquí», «Cambiar» hace lo mismo pero solo en este asunto.
- Cada tarea con acción lleva una etiqueta pequeña con ella («Comunicar», «Pedir datos»…), al lado
  del nombre, como en la pantalla de prueba.
- **«+ Añadir hito» sale de debajo de las tareas** y pasa al final de la tira de hitos de arriba.
  Bajo las tareas solo queda «+ Añadir tarea».
- **La ventana de «+ Añadir hito»** (la de la lista común, con buscar, «+ Crear un hito nuevo» y
  «Para», como hoy) añade «Va detrás de»: un desplegable con todos los hitos del asunto, con el
  último marcado por defecto («(al final)»). El hito nuevo entra donde diga.
- **«Hito ▾» pierde «Crear».** Para hitos nuevos queda solo «+ Añadir hito». «Cambiar», «Borrar» y
  el resto de «Hito ▾» se quedan como están.

## Pantalla de prueba (aprobada el 6-nov-2026)

- `docs/pantallas/553.html` · https://claude.ai/artifact/1v2TDESpsDGkWTDAcsfJoS
- La pantalla enseña el hito como quedará después de aplicar el plan de las guías (sin la caja
  «Nueva tarea…»). Los botones que dicen «igual que hoy» no cambian.
- Las listas, los tipos y las plantillas de la pantalla son inventados; en la app son los de la
  lista común y de las plantillas del centro.

## Qué NO se hace en esta tarea

- La caja «Nueva tarea…» y su «Qué se hace»: los quita el plan de las guías (fila 551, paso 554).
- «Llamar por teléfono» como «Qué se hace», con su registro de llamadas: idea 557.
- Nada cambia en los asuntos abiertos al guardar un orden o una tarea en la guía.

## Notas técnicas de Claude

- Ficheros que tocan esto: `js/hitos-panel-lista.js` (`cuerpoDeHito`: las secciones), `js/hito-mesa-guion.js`
  (cabecera «Tareas», etiqueta de acción, franja del orden), `js/hito-mesa-tarea-menu.js`
  (`opciones`: «Subir»/«Bajar»), `js/comunes-asunto.js` (`botonesHTML` sin «+ Añadir hito»;
  `anadirHito`/`ponerHito` con la posición elegida), `js/comunes-ventana.js` y
  `js/comunes-ventana-nuevo.js` («Va detrás de»), `js/hito-mesa.js` (la tira con «+ Añadir hito»;
  `opcionesMas` sin «Crear»), `js/comunes-cambiar.js` (`tarea`: «Qué se hace» con `Comunes.HACE` y
  los datos de cada acción, incluido `TareaCopiarEditor` de la fila 552), `css/hito-mesa.css`.
- El orden en este asunto se guarda en el propio hito del asunto (por ejemplo, la lista de `id` de
  su guion) y `Hitos.guionDe` lo respeta; tareas que no estén en esa lista (nuevas de la guía) van
  al final, en su orden. El orden de la guía se guarda con `GuiasDelCentro.guardarPasos` sobre el
  paso del hito, sin repartirlo a los asuntos abiertos.
- «Va detrás de» usa `HitosDesdeElAsuntoNucleo.colocarTrasAncla` con el hito elegido, en el asunto
  y, con «este asunto y los siguientes», en la guía (`pasoAnclaDeHito`).
- Al cambiar la acción de una tarea común: lista común → `ComunesGuardado.fijarEnAbiertos` →
  `repartirEnGuias`, como hoy con el nombre y la plantilla. La receta vieja que ya no sirva a la
  acción nueva se quita.
- Un recuadro no lleva `overflow: hidden` (cortaría el menú ⋮); la esquina redonda de la cabecera va
  en la propia cabecera.
- Ningún fichero de `js/` pasa de 600 líneas (regla de `docs/CONTEXTO-CORTO.md`).
- Esta tarea deja hacer el paso 556 (cambiar una tarea a «Copiar a otra carpeta» con «Cambiar la
  tarea»), que hoy no se puede.

## Cómo lo comprueba el segundo revisor

- Con el hito abierto, Tareas, Campos, Documentos y Registro salen cada uno en su recuadro, con
  cabecera de fondo propio, título «Tareas», «Campos», «Documentos», «Registro» y su cuenta.
- El menú ⋮ de la última tarea se ve entero (se abre hacia arriba si no cabe).
- ⋮ → «Subir» y «Bajar» mueven la tarea; «Subir» está apagado en la primera y «Bajar» en la última.
- Tras mover una tarea de la guía sale la franja; «Guardar también en la guía» guarda el orden en la
  guía (un asunto nuevo del tipo sale con ese orden; otro asunto abierto del tipo, no cambia);
  «Solo en este asunto» deja la guía igual y quita la franja.
- Mover solo tareas «solo aquí» no hace salir la franja.
- ⋮ → «Cambiar la tarea» enseña Nombre, «Qué se hace» y, si genera o comunica, Plantilla; cambiar
  «Qué se hace» cambia los datos de debajo; al guardar, la etiqueta de la tarea dice la acción
  nueva y un asunto abierto del mismo tipo conserva la vieja.
- Cada tarea con acción enseña su etiqueta.
- Bajo las tareas solo está «+ Añadir tarea»; «+ Añadir hito» está al final de la tira de hitos.
- La ventana de «+ Añadir hito» tiene «Va detrás de», con el último hito marcado «(al final)»; el
  hito entra donde se elige, eligiendo de la lista y creando uno nuevo.
- «Hito ▾» no tiene «Crear»; sí «Cambiar» y «Borrar».
- Comparar todo con `docs/pantallas/553.html`.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
