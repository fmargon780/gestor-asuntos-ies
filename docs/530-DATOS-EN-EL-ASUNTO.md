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

- Segundo revisor (5-nov-2026), visto con Chromium real, mesa del hito con el disco falso (guía MATRICULA con tareas de generar, comunicar por correo, comunicar por Séneca y «Pedir datos»; plantillas Word reales de dos párrafos con `{campo:…}` y `{si:…}`) y la demo; comparado con `docs/pantallas/518.html`. Pruebas: datos-del-asunto, plantillas-documento, scripts-cargados, campos-de-hito, campos-importe-numero-fecha, rellenar-campo-que-ya-esta, lista-de-campos, campos-catalogo y las de guion/hito/word/correo/seneca (por palabras) pasan; fallan igual en `origin/main` (copia servida en otro puerto): campos, contadores-de-inicio, tutores-legales, tablon-no-se-borra, nuevo-asunto-categoria-guia, nuevo-asunto-persona-primero, y también hacer-este-hito (falla en main con el mismo «1 listos para enviar»; no estaba en la lista conocida).
- Segundo revisor, punto 1 (el campo no lleva regla de cuándo pedirse): coincide. No hay casilla de regla; los datos con valor salen puestos (Tutor con custodia con un tutor, Fecha ya escrita) y el resto se pide en la tarea.
- Segundo revisor, punto 2 (un valor por asunto, sin «Solo para este documento»): coincide. Un solo valor en el asunto; el modal «Faltan datos» ya no dice «solo para este documento».
- Segundo revisor, punto 3 (lista de datos en la tarea): coincide. La primera tarea de generar muestra «Plantilla «Resolución». Faltan 3 de 3 datos.» con caja y «Pedirlo antes» por cada dato; con uno escrito, «Faltan 2 de 3; el resto ya está»; «Si sigues, lo que falta sale en amarillo.» Generando con datos sin rellenar, el Word sale con «[falta: Protocolo X]» resaltado. La de la siguiente tarea nace abierta y las demás con «Ver los datos». Parecido a la pantalla 518.
- Segundo revisor, punto 4 (lo escrito se guarda y no se vuelve a pedir): coincide con una salvedad. Escribir «Fecha de alegaciones» en una tarea la deja en la segunda plantilla ya con valor, y tras volver a abrir el asunto sale en «Campos del asunto» (como «solo aquí»). Un campo de lista (Protocolo X con Sí/No) se elige en la tarea con desplegable y el texto condicional sale igual en los dos Word. Salvedad: la lista de otra tarea que ya estaba pintada (y la pestaña «Campos del asunto» ya abierta) no se repinta al guardar en la tarea de al lado ni desde el cuadro de correo: sigue enseñando «falta» hasta volver a abrir el asunto. Los datos están bien guardados; es solo lo que se ve.
- Segundo revisor, punto 5 (correo, Séneca y generar fuera de tarea): coincide con una salvedad. Correo y Séneca: en lugar del aviso ámbar sale una caja «Faltan datos. Escribe lo que falte…» con una caja por dato; al escribir, el texto del cuerpo se rellena y el dato queda en el asunto (el aviso viejo ya no sale). «Faltan datos» fuera de una tarea (Generar documento ▾) guarda los tres datos en el asunto y no lleva «Pedirlo antes» (decisión 6, aceptable). Salvedad: en esa ventana un campo de lista (Protocolo X, del catálogo con Sí/No) sale como caja de texto libre, no como desplegable, y en la tarea sí es desplegable; si se escribe «si» o «sí » el `{si:Protocolo X=Sí}` puede no coincidir. Debería usar el mismo control que la lista de la tarea.
- Segundo revisor, punto 6 (cambiar el dato no toca lo generado): coincide. Cambiada la fecha a 20/11/2026 tras generar la resolución, ese Word sigue con 10/11/2026; el anexo generado después sale con 20/11/2026. Regenerar la resolución desde la UI no lo he repetido, pero usa el mismo camino.
- Segundo revisor, punto 7 («Pedirlo antes»): coincide. Dónde: «Al crear el asunto», «En la parte general, sin pedirlo al crear», «Hito «…»»; para quién: «Este asunto y los siguientes (en la guía)» y «Solo este asunto». Resultado visto: crear + guía deja el campo en `porTipo` sin marca; general + guía le pone `sinPedirAlCrear`; hito + «solo este asunto» lo guarda en `camposPropiosDelAsunto` con el hito y el tipo no cambia. En «Nuevo asunto» de MATRICULA sale solo el campo «al crear» («Pais destino»); el «sin pedirlo al crear» no sale. (Visto llamando a `App.pintarCamposDelTipo` con un tercero de mentira; no he completado el alta entera de un asunto nuevo con el disco falso.)
- Segundo revisor, punto 8 («+ Añadir campo»): coincide. Parte general: ventana de elegir con «Para»: Solo este asunto / Los siguientes: pedirlo al crear el asunto / Los siguientes: en la parte general, sin pedirlo al crear (igual que 518). Hito: Solo este asunto / Los siguientes: pedirlo en este hito. Tarea «Pedir datos»: abre la ventana sin «Para» (decisión 4). Los tres dejan el campo y el aviso esperados.
- Segundo revisor, punto 9 (tarea «Pedir datos»): coincide. Existe en «Qué se hace» de la mesa y del editor de la guía; con «+ Añadir campo» recibe sus campos, al rellenar el último se marca sola (visto en una tarea de la guía y en una nueva creada en la mesa). El editor de la guía muestra la acción y su «+ Añadir campo»; no he creado una tarea «Pedir datos» entera desde el editor y guardado la guía.
- Segundo revisor, punto 10 («Dónde se pide»): coincide. En Ajustes › El centro › Campos, el detalle dice «MATRICULA: al crear el asunto», «MATRICULA: en la parte general, sin pedirlo al crear», «MATRICULA: hito «Resolver»», y la columna resume «En 1 tipo». «Al usarlo» sin uso: solo visto en el código y en la prueba, no en pantalla.
- Segundo revisor, punto 11 (Tutor con custodia): coincide. Con RegAlum de mentira con dos tutores sale «Elige» con los dos y lo elegido queda guardado; con un solo tutor sale ya puesto («Soto Gil, Pilar») sin preguntar. Con la demo los alumnos no traen tutores: se vio con el disco falso.
- Segundo revisor, punto 12 (campo reservado): coincide. No he visto ningún cambio en qué datos son reservados.
- Segundo revisor, «Cómo lo comprueba»: dos plantillas con el mismo dato, el dato en «Campos del asunto» tras reabrir, condicional elegido en la tarea, correo y Séneca, «Faltan datos» fuera de tarea, amarillo, cambiar el dato sin tocar lo generado, «Pedirlo antes» a cada sitio y «Pedir datos» que se marca sola: coinciden (ver puntos 3 a 9). Tutor con custodia: coincide.
- Segundo revisor, [SOLO FRANCISCO] un Word real generado con datos escritos en la tarea: no lo he podido ver. Sí vi Word generados con la propia aplicación (docx mínimos de prueba) con los datos escritos; no es un Word real de Francisco.
- Segundo revisor, decisiones declaradas: (1) crear un campo propio de texto en `campos.json` por cada dato desconocido que se escribe: distinta de la nota técnica (que decía «solo aquí» de la ficha); funciona, pero mete en Ajustes › Campos entradas «Manual» como «Pais destino» (con un nombre mal escrito, otro campo). (2) solo guardables: coincide con la ventana vista. (3) desplegable con rótulo, la siguiente nace abierta: coincide con 518. (4) sin «Para» en «Pedir datos»: en una tarea de la guía cambia la guía de todos los asuntos sin avisar; aceptable pero conviene que el aviso lo diga. (5) flujo viejo sin botón: no lo he visto abrirse desde ninguna parte. (6) «Faltan datos» sin «Pedirlo antes»: coincide con lo visto.
- Segundo revisor, otros: ningún error de consola en ninguna de las pasadas. Ningún fichero nuevo pasa de 400 líneas (el mayor, hito-mesa-guion.js 369); `plantillas.js` (509) y `plantillas-valores.js` (437) ya pasaban de 400 y solo suben 2 líneas. La app hace además lo que el texto no pide: el resumen dice «Falta 1 de 1 datos» (concordancia), la lista de una tarea y la del cuadro no se repintan entre sí (punto 4), y «Pedir datos» nace con «Sin campos todavía».
- Segundo revisor, veredicto: APRUEBO CON DOS CORRECCIONES PEQUEÑAS (no tocan los datos guardados): (a) repintar las listas de datos de las demás tareas y la pestaña «Campos del asunto» tras guardar un dato (en una tarea o desde el cuadro de correo o Séneca); (b) en «Faltan datos» usar el desplegable para los campos de lista (y el selector de tutor), como en la tarea. Lo demás coincide con lo pedido y con la pantalla 518.
- Segundo revisor, segunda vuelta (5-nov-2026), visto en Chromium real (demo, disco falso, mesa del hito de un asunto FACTURA con dos tareas de comunicar con plantillas de correo que usan el mismo dato «Dato Rev», ambas abiertas): (a) escribir el dato en la lista de la primera tarea: la lista de la segunda pasa a «Ya están todos los datos» con el valor y «Campos del asunto» (ficha) lo muestra sin reabrir: coincide. Escribirlo desde la segunda: la primera y la ficha se ponen al día: coincide. Quitar el dato y volver a escribirlo desde el cuadro de Correo (`CorreoNucleo.abrirCuadro`, caja «Faltan datos»): las dos listas de la mesa y la ficha pasan a tener el valor sin reabrir: coincide. Séneca: no lo he visto en pantalla (mismo `DatosDelAsuntoCuadro.enganchar` que Correo): no he podido ver. (b) «Faltan datos» fuera de tarea (`WordFaltan.preguntar`, la propia ventana) con «Protocolo X» como campo de lista del catálogo (Sí/No): sale un desplegable «—|Sí|No», y un dato normal sale como caja de texto: coincide. Tutor con custodia como desplegable: lo cubre la prueba 14, no lo he visto en pantalla. Concordancia «Falta 1 de 1 dato.»: coincide, visto en las listas. No he generado un Word real con plantilla .docx en esta vuelta (la ventana se abrió llamándola directamente). Pruebas: datos-del-asunto, plantillas-documento, scripts-cargados, campos-de-hito pasan; sin errores de consola. Veredicto segunda vuelta: APRUEBO.
