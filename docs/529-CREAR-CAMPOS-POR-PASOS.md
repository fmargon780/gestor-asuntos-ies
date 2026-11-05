# 529 — Crear campos a partir de otros, por pasos

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

Segunda parte del tema 518. Necesita la 528 HECHA. Si algo cambia el texto de arriba, manda esto.

1. Un campo se crea con: nombre, grupo en el que sale, de qué campo parte (cualquiera de la lista, también otro calculado) y una **lista de pasos** que se pueden añadir, quitar y ordenar con flechas.
2. Cada paso muestra su resultado con la persona de ejemplo. Al lado, una tabla con el resultado final para varias personas.
3. **Pasos de texto:** juntar con otro campo (qué va entre los dos y si va delante o detrás); añadir un texto fijo; quitar los primeros o últimos caracteres; partir por un signo y quedarse con una parte; mayúsculas, minúsculas o cada palabra con mayúscula.
4. **Pasos para decidir:** «Si… entonces… si no…» (mirar el valor de arriba u otro campo; es igual a, es distinto de, contiene, empieza por, está vacío, tiene dato; casilla vacía: sigue el valor de arriba); si está vacío, usar otro campo; tabla de equivalencias.
5. **Pasos de fechas:** sumar días hábiles, días naturales o meses; escribir la fecha larga, el día de la semana, el mes en letra, el año o la edad a día de hoy.
6. **Pasos de números:** sumar, restar, multiplicar o dividir por una cifra u otro campo; escribir un número en letra.
7. Los días hábiles cuentan también los festivos de la app.
8. El campo dice solo para qué personas vale, según los campos de los que sale.
9. Un campo creado así sale en la lista, se usa en plantillas y sirve para crear otros. No se puede crear uno que dependa de sí mismo.

**Lo que desaparece o se sustituye:** el editor de hoy (una sola operación) se sustituye por este. Los calculados que existen siguen dando el mismo resultado.

## Pantalla de prueba (aprobada el 5-nov-2026)

- `docs/pantallas/518.html` · https://claude.ai/artifact/EW1cjJnK9PrLBJ97wMAvBy
- Es la misma pantalla para las filas 528, 529, 530 y 531. Esta fila programa solo lo de arriba: la pestaña «Crear a partir de otros».
- Sus datos son inventados: tablas como «Calificaciones» y «Faltas de asistencia» y algunas columnas de tutores no existen. Salen las tablas y columnas que traiga de verdad el Centro de datos.

## Qué NO se hace en esta tarea

- Pedir datos en las tareas: fila 530.

## Notas técnicas de Claude

- Hoy: `js/campos-calculados-editor.js`, cálculo en `js/campos-calculo.js`, seis operaciones. Un calculado de hoy es una receta de un paso; se lee así, sin reescribir `campos.json` de golpe.
- Festivos: los de Ajustes › Hitos.
- Fechas y números con `CamposClases`. Cálculo en funciones puras, con su prueba.
- Comprobar ciclos al guardar. Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- Cada paso de los puntos 3 a 6 da el resultado esperado con la demostración.
- Encadenar: un campo sobre otro calculado da bien; cambiar el de abajo cambia el de arriba.
- Quitar y mover pasos cambia el resultado al momento.
- La tabla de resultados muestra varias personas, con «vacío» donde no hay dato.
- Los días hábiles saltan un festivo de la app.
- Curso y los calculados de antes dan lo mismo que antes.
- No deja crear un campo que dependa de sí mismo.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
