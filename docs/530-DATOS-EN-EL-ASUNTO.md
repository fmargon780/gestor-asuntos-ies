# 530 — Cada tarea pide lo que falta y se guarda en el asunto

## Lo que escribió Francisco

Idea 512 (tema 518), tal cual:

> Tema: cómo se meten en un asunto los campos que luego usan las plantillas (campos variables y los datos de los textos condicionales) para que se rellenen; Francisco quiere profundizar en ello. Sale del diseño de la fila 510.

En el diseño, el 5-nov-2026:

> Creo que lo que yo pretendía cuando escribí esta idea y que posiblemente no estuve muy lúcido, era que diseñaramos un sistema que nos permita elegir los campos (de nuestra base de datos, calculados, manuales o de otro tipo), que nos van a servir después en las plantillas de documentos y correos o de otras herramientas que tengamos que pudieramos configurar. En definitiva un sistema para manejar todos los campos posibles que podamos tener y necesitar y usarlos allá donde nos haga falta de la forma más sistemática, ágil y ordenada.

> Ten en cuenta que no valdrá solo un buscador normal para elegir los campos a insertar

> La creación de campos a partir de campos anteriores también debe ser muy potente

> Tengo experiencia en este campo y sé que es fundamental saber la tabla de origen del dato. [...] si el Número de Identificación Escolar me viene del archivo RegAlum a través de centro de datos esa es un información muy útil

> Imaginate siempre en la situación de que estamos trabajando en un asunto concreto y nos damos cuenta de que queremos generar un documento, correo, tener una información disponible para consulta en el mismo, o usarlo para una herramienta (Listados, cálculos, etc). [...] En ese momento y lugar donde tenemos la necesidad del campo es cuando tenemos que decidir dónde nos tiene que pedir el proceso el dato. Muchos de esos datos ya nos vendrán puestos.

> Entonces la idea es que si quiero una nueva tarea, en vez de dejarme escribir cualquier nombre y asignarle una acción, me dejará elegir de entre las tareas que ya existan en nuestro sistema y además si no hay la que yo quiero, crear una nueva y la configuro aquí mismo, incluyendo sus plantillas? Y lo mismo con los hitos?

> Si hay dos expulsiones al Aula de convivencia generos dos asuntos distintos del mismo tipo para el mismo alumno. Los asuntos no son contenedores en el tiempo [...] Se hace un asunto por cada expulsión. Y esta es la norma general.

## Lo que entendió Claude (acordado con Francisco el 5-nov-2026)

Tercera parte del tema 518. Necesita la 528 HECHA. Si algo cambia el texto de arriba, manda esto.

1. **El campo no lleva regla de cuándo pedirse.** Los datos caen solos si se pueden saber. Lo que no, se pide donde se necesita.
2. **Un valor de cada dato por asunto.** Un asunto es un solo hecho: dos expulsiones son dos asuntos. No hay casilla «Solo para este documento».
3. **Tarea de generar o comunicar:** al abrirla sale la lista de datos de su plantilla. Los que existen, con su valor; los que faltan, para escribir ahí mismo. Dice cuántos faltan. Se puede seguir: lo que falte sale en amarillo, como hoy.
4. **Lo escrito se guarda en el asunto** al momento. Ninguna otra plantilla lo vuelve a pedir, y sale en sus «Campos del asunto». Vale igual para los campos de lista que deciden un texto condicional.
5. **Correo, Séneca y generar fuera de una tarea** usan la misma forma: se escribe lo que falta y se guarda en el asunto. La ventana «Faltan datos» sigue donde no hay tarea, pero guarda en el asunto.
6. **Si el dato cambia**, los documentos ya generados no cambian; volver a generar usa el valor nuevo.
7. **«Pedirlo antes»**, junto a cada dato que falta: se elige dónde (al crear el asunto; en la parte general, sin pedirlo al crear; o un hito) y para quién (este asunto y los siguientes, o solo este asunto). Para los siguientes queda en la guía del tipo.
8. **«+ Añadir campo»** en la parte general, en un hito o en una tarea «Pedir datos» abre la ventana de elegir. Para los siguientes asuntos, en la parte general se elige si se pide al crear o no.
9. **Tarea «Pedir datos»:** un tipo de tarea nuevo, con sus campos para rellenar.
10. **«Dónde se pide»** de la lista de campos muestra lo que hace cada tipo; si no hay nada, «Al usarlo».
11. **Tutor con custodia:** un dato manual. Si el alumno tiene un solo tutor, cae solo; con dos, se elige una vez y queda guardado.
12. **Campo reservado:** esta tarea no toca qué datos son reservados.

**Lo que desaparece o se sustituye:** lo escrito en «Faltan datos» deja de valer solo para ese documento. El aviso ámbar de correo y Séneca se sustituye por poder escribir el dato.

## Pantalla de prueba (aprobada el 5-nov-2026)

- `docs/pantallas/518.html` · https://claude.ai/artifact/EW1cjJnK9PrLBJ97wMAvBy
- Es la misma pantalla para las filas 528, 529, 530 y 531. Esta fila programa solo lo de arriba: la pestaña «En un asunto», salvo las ventanas de tareas e hitos comunes.
- Sus datos son inventados: tablas como «Calificaciones» y «Faltas de asistencia» y algunas columnas de tutores no existen. Salen las tablas y columnas que traiga de verdad el Centro de datos.

## Qué NO se hace en esta tarea

- Tareas e hitos comunes: fila 531.
- Documentos para varias personas: tema 393.
- Aula de convivencia y a quién se avisa: temas 520 y 487. Aquí solo el comportamiento del punto 11.

## Notas técnicas de Claude

- Guardar en `ficha.campos` con `App.anotar`/`ColaGuardado`; escribir un campo que no es del tipo lo añade a `ficha.camposPropiosDelAsunto`, como «solo aquí».
- `js/word-faltan.js` deja de devolver `aMano` de un solo uso; `js/plantillas-documento.js` guarda antes de rellenar. Hoy `valores.aMano` también decide textos condicionales (`js/texto-condicional.js`).
- `cuerpo.faltan` de `js/correo-cuadro.js` y `js/seneca-cuadro.js`: pasan de aviso a campos.
- Lista de campos de una plantilla: sacarla con la misma función que resuelve los huecos (`Plantillas.rellenar`), con `faltan`.
- «Pedirlo antes» para siguientes usa `porTipo` y `hito` (`js/campos-de-hito.js`, `js/donde-se-guarda.js`). «Sin pedirlo al crear» es una marca nueva en `porTipo`, que `js/asuntos-nuevo-campos.js` respeta.
- Acción nueva `pedir` en `ACCIONES` (`js/guias-guion.js`, `js/hitos-guion.js`); se marca sola al tener todos sus campos. Fichero `js/hitos-guion.js` ya es largo (idea 526): no pasar de 600 líneas.
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- Con dos plantillas que usan el mismo dato: se escribe en una tarea y la otra ya lo tiene.
- El dato sale en «Campos del asunto» tras recargar.
- Un texto condicional cuyo campo se elige en la tarea sale igual en los dos documentos.
- El correo y Séneca dejan escribir lo que falta y lo guardan.
- «Faltan datos» fuera de una tarea guarda en el asunto.
- Generar con datos sin rellenar los deja en amarillo.
- Cambiar el dato no toca el documento ya generado; regenerar usa el nuevo.
- «Pedirlo antes» a cada sitio: en un asunto nuevo del tipo aparece donde toca; «sin pedirlo al crear» no sale en «Nuevo asunto»; «solo este asunto» no cambia el tipo.
- Una tarea «Pedir datos» se marca sola al rellenarlos.
- Tutor con custodia: cae solo con un tutor; se elige con dos.
- [SOLO FRANCISCO] Un Word real generado con datos escritos en la tarea.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
