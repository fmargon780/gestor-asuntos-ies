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

Segundo revisor (5-nov-2026). Visto en Chromium con el disco falso de `pruebas/campos-catalogo.mjs` (3 alumnos, con Importe y fechas) y con `?demo=1&auto=1`: Ajustes › tipo › «+ Añadir campo» › Calculados, Ajustes › El centro › Campos › «+ Crear a partir de otros» y la ventana de elegir campo de una plantilla.

- Segundo revisor, punto 1 (nombre, grupo, parte de, pasos con flechas): coincide. Subir, bajar y quitar pasos cambian al momento el resultado y los números de paso.
- Segundo revisor, punto 2 (resultado de cada paso y tabla con varias personas): coincide. Cada paso dice «Tras este paso, con <persona>»; la tabla saca hasta 6 personas y pone «vacío» donde no hay dato (Lucía sin fecha de nacimiento, Pablo sin importe).
- Segundo revisor, punto 3 (texto): coincide. Visto: partir por «,» y quedarse con la 2ª parte, mayúsculas, texto fijo delante, juntar con otro campo con separador, delante y detrás. Quitar primeros y últimos, minúsculas y cada palabra con mayúscula, solo por `pruebas/campos-pasos.mjs` (en verde). Sobran, sin estar pedidas, «Solo si es una letra» y dos formas más de partir (todo lo de después del primer signo, todo lo de antes del último): vienen de leer los calculados de antes.
- Segundo revisor, punto 4 (decidir): coincide. Visto: «contiene» (Matriculada/Matriculado dan MUJER/HOMBRE), «está vacío» (la casilla «Valor» desaparece), «tiene dato», casilla vacía = sigue el valor de arriba, «si está vacío, usar otro campo» y tabla de equivalencias (esta última solo en las pruebas).
- Segundo revisor, punto 5 (fechas): coincide. 14/03/2013 +10 hábiles = 28/03/2013, +10 días = 24/03/2013, +10 meses = 14/01/2014; fecha larga, día de la semana (martes), mes, año y edad (12 hoy). Fecha vacía o que no es fecha da «vacío». Sobra «Curso académico» en el desplegable (viene del calculado de antes `deFecha`); el mock no lo trae.
- Segundo revisor, punto 6 (números): coincide. 1.250,50 +2 = 1252,5; −2 = 1248,5; ×2 = 2501; ÷4 = 312,63; ÷0 = vacío; dividir por otro campo (Año de la matrícula) = 0,62; en letra «mil doscientos cincuenta con cincuenta». Diferencia con el mock: cuando un paso no se puede hacer (algo que no es fecha o número) el mock deja el valor de arriba y la app da «vacío». Es decisión de la app y lo dice la nota de `campos-pasos.js`; el texto de Francisco no dice qué pasa.
- Segundo revisor, punto 7 (festivos de la app): coincide. Con un festivo guardado el 18/03/2013 (`Hitos.guardarFestivos`), +10 hábiles desde 14/03/2013 pasa de 28/03 a 29/03/2013 sin reabrir el editor. No lo he hecho tecleando en Ajustes › Hitos sino con la función que usa esa pantalla. Solo cuentan los festivos; los «días no lectivos» de Hitos no se saltan (el texto solo pide festivos).
- Segundo revisor, punto 8 («Vale para…»): coincide. Sin campo de partida, «Vale para todos los tipos de persona»; partiendo de «Alumno/a» o «Grupo», «Vale para Alumnado, porque sale de sus datos.» Con datos de Personal no lo he podido ver (el disco falso y la demo solo traen columnas de Alumnado); lo cubre el código, que hace la unión de las clases de los campos de los que sale.
- Segundo revisor, punto 9 (sale en la lista, sirve para otros, sin ciclos): coincide. Se creó «Apellidos» y encima «Etiqueta» (parte de Apellidos, texto fijo «Sr. »); al cambiar Apellidos a mayúsculas, Etiqueta lo recoge. Al editar Apellidos, «Etiqueta» no se ofrece como campo (no hay forma de crear el ciclo desde la pantalla) y `Calculo.validar` lo rechaza igualmente (`campos-calculo.mjs` en verde). El campo nuevo sale en la lista de Ajustes › El centro y en la ventana de elegir, y se inserta en la plantilla como `{campo:…}`. Los tres sitios desde donde se llama al editor funcionan sin errores de consola.
- Segundo revisor, «Curso y los calculados de antes dan lo mismo»: coincide. «Curso» (quitar la última letra del grupo) se abre como un paso, «Quitar los últimos caracteres» sobre «Grupo», y da 1º, 2º, 3º; sigue guardado como `quitarFinal` y se lee con `deLegado`. Lo cubre la sección 7 de `campos-pasos.mjs`.
- Segundo revisor, DECISIÓN DECLARADA («solo los datos de la ficha de la persona»): NO COINCIDE con el texto de Francisco («de qué campo parte, cualquiera de la lista, también otro calculado») ni con el mock, y hay que escribirla como decisión. En «Parte de» y «Con qué campo» solo salen las columnas de los ficheros (del Centro de datos), «Grupo» y otros calculados. No salen: nombre del tercero, nº escolar, DNI, teléfono y correo del tercero, los tutores, Año académico, tipo y fecha de hoy y demás datos del asunto, el centro, los firmantes ni los datos de tablas de datos. Con la demo, «Parte de» trae 17 opciones, todas del grupo Persona, mientras que la lista de Ajustes trae 103. Consecuencias que se ven: se puede elegir el grupo «Tutores», «Centro» o «Firmantes» para el campo nuevo pero no partir de ningún dato de esos grupos; y el ejemplo de la fila 510 («Nombre con tratamiento» juntando «Nombre completo» con otro) no se puede montar con «Nombre del tercero». La razón (`Campos.valorInicial` es síncrono) es técnica, no de Francisco.
- Segundo revisor, qué hace la app que el texto no pide: (a) en «Parte de» sale dos veces «Curso» (la columna del RegAlum y el calculado «Curso»), sin nada que los distinga; (b) selector «Persona de ejemplo» y botón «Cancelar» (el mock trae «Empezar otro»; el de la app es «Crear y añadir» donde el mock dice «Crear el campo»), razonable por venir de una ventana y no de una pestaña; (c) «Probar con uno ya hecho» solo trae los calculados que ya están guardados: con el disco falso sin ninguno sale vacío, y al pulsar uno se sustituyen los pasos del campo que se está editando, sin avisar (igual que en el mock); (d) la disposición es la del mock (panel de pasos y panel «Resultado») pero en la app se apilan, porque el editor vive dentro del panel lateral. Ficheros tocados: los previstos, más `docs/HISTORIA.md` y `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (solo texto).
- Segundo revisor, pruebas en verde con `DIRECCION=http://127.0.0.1:8123/index.html`: campos-pasos, campos-calculo, campos-catalogo, campos-del-documento, campos-de-hito, lista-de-campos, scripts-cargados. `campos-elegir.mjs` no existe. `campos.mjs` falla (espera un único bloque «Campos»), y falla igual con una copia de `origin/main`.
- Segundo revisor, veredicto: NO APRUEBO todavía solo por la decisión de arriba. Todo lo demás coincide. Hay que escribir como decisión de Francisco si basta con la ficha de la persona o si «cualquiera de la lista» exige ofrecer también el resto, o abrir una fila para ello. Y de paso, distinguir los dos «Curso» en el desplegable.
- Segundo revisor, segunda vuelta (5-nov-2026), punto 1 («cualquiera de la lista»): coincide. Visto en Chromium con el disco falso de `pruebas/campos-catalogo.mjs` (más alumnos): «Parte de» trae 75 opciones y la lista de campos (`CamposListaDatos.lista()`) trae 75, ninguna sin ofrecer; salen los grupos Persona (nombre del tercero, en orden normal, grupo, nº escolar, DNI, teléfono y correo, especialidad, tablas de datos y las columnas del RegAlum), Tutores, Asunto, Centro y Firmantes. Los campos manuales del asunto no se ofrecen (`origenDeEntrada` los descarta, y no tienen valor de persona): me parece bien, es lo razonable. Un campo «Nombre del tercero» + «Añadir un texto fijo» («Sr. ») muestra «Tras este paso, con Aguilar Ponce, Marina Sr. Aguilar Ponce, Marina», la tabla con las dos personas, «Vale para todos los tipos de persona», se guarda en `campos.json` con origen `{clase:'dato', id:'h:nombre'}` y sale en la lista de campos. Igual con «Nº escolar» + «Id. »: «Id. 1140233», «Id. 1140999», etc. Sin errores de consola. El segundo «Curso» repetido de la primera vuelta no lo he mirado de nuevo.
- Segundo revisor, segunda vuelta, punto 2 («Nuevo asunto»): coincide. Con el campo «Escolar» (Nº escolar + «Id. ») añadido al tipo MATRICULA, y eligiendo una alumna que el editor no había leído (la 8ª, no entre las 6 de la tabla), «Nuevo asunto» muestra el campo con «Id. 770008», el valor correcto, tras la repintada. Con «Nombre del tercero» + «Sr. » sale «Sr. Beltrán Sanz, Pablo». Sin errores de consola. No he probado datos de tutores ni de tablas en «Nuevo asunto» (el disco falso no los trae); los cubre la misma ruta de código.
- Segundo revisor, segunda vuelta, punto 3 (pruebas, con `DIRECCION=http://127.0.0.1:8123/index.html`): campos-pasos, campos-calculo, campos-catalogo, lista-de-campos, scripts-cargados, nuevo-asunto-mas-comodo y nuevo-asunto-sin-repetir en verde. nuevo-asunto-categoria-guia y nuevo-asunto-persona-primero fallan (ya se sabía que fallan igual en origin/main; no `asuntos-nuevo*` existe). No he tocado código.
- Segundo revisor, segunda vuelta, veredicto: APRUEBO. Queda abierto, sin bloquear, lo de la primera vuelta de distinguir los dos «Curso» en el desplegable.
