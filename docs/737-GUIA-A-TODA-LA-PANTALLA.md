# 737 — La guía a toda la pantalla

**Título llano:** Editar la guía de un tipo a toda la pantalla
**Para qué:** que crear y cambiar guías invite a hacerlo: ver el proceso entero de un vistazo, escribir tareas seguidas y ver qué tareas salen en cada caso.

## Lo que escribió Francisco
Aviso de soporte del 23-nov-2026 (pantalla «Ajustes de un tipo de asunto», copia sin internet):
«Crear y editar las guías va a ser uno de los trabajos más importantes de esta app en los próximos meses. Si te fijas en la imagen, esta pantalla no invita a crear ni a editar nada. ¿Qué podemos hacer? Salte de la caja en esto.»
(Captura: la ventana estrecha «Guía de IPASEN ALUMNADO» de hoy.)

Durante el debate (24-nov-2026):
- A la propuesta: «Me parece bien tu propuesta.»
- «Otra cosa que me preocupa […] es cómo visualizar "el mapa" de un proceso que tenga tareas con opciones distintas a Siempre en el campo Cuándo se hace.»
- «Otra cosa que creo que podría ser interesante en esta pantalla es ver las acciones que tiene configuradas el papel que vayamos a elegir en su caso.»
- Preguntado si hacía falta borrar desde la lista de la izquierda, aceptó que no («Ok. Estupendo.»).
- Sobre la pantalla de prueba: «Vale, lo veo bien.» Sobre escribir con Intro: «Sí, es mucho más cómodo.»

## Lo que entendió Claude (acordado con Francisco el 24-nov-2026)
- El editor de la guía de un tipo «sin hitos» deja de ser una ventana estrecha y **ocupa toda la pantalla**. Arriba, en una línea: el título «Guía de <TIPO>», la nota que ya tiene hoy y los botones «Cancelar» y «Guardar».
- **A la izquierda, la guía de un vistazo.** Una línea por tarea: un asa para arrastrar, su número y la frase entera, que se escribe ahí mismo. Debajo de la frase, unas marcas pequeñas: el papel («📄 <tipo>»), «Solo si <dato>: <valores>» y «Cómo se hace» si lo tiene. Los rótulos salen como títulos de grupo, sin número. Debajo de la lista, «+ Añadir una tarea» y «+ Añadir rótulo».
- **Escribir como en una lista:** Intro en la frase de una tarea crea otra justo debajo, con el cursor en ella. La tecla de borrar en una frase vacía quita esa línea y el cursor sube a la de arriba. Al pasar el ratón por una línea sale un «+» en su borde de abajo, que mete una tarea nueva ahí.
- **Arrastrar** una línea por su asa la cambia de sitio; mientras se arrastra, una raya marca dónde caerá.
- **A la derecha, la tarea elegida en grande.** Al pulsar una línea de la izquierda queda marcada y se ve a la derecha: «Frase», «Papel» y «Cuándo se hace» uno junto al otro, y «Cómo se hace (opcional)» en un cuadro grande. Abajo, «↑ Subir», «↓ Bajar» y «Quitar esta tarea» (en un rótulo, «Quitar este rótulo»). Lo que se escribe a un lado sale al momento en el otro.
- No hay botón de quitar en cada línea de la izquierda; se quita desde la derecha (o borrando la frase y pulsando otra vez borrar).
- **El recorrido del papel:** debajo de «Papel», en la derecha, sale «Así saldrá en la tarea: <pasos>» (por ejemplo «Generado › Firmado › Registrado › Enviado») y, debajo, su resumen en una frase, los mismos que enseña la ventana «Recorrido» del tipo de documento. Cambia al elegir otro papel. Si el tipo aún no tiene recorrido: «Este tipo de documento todavía no tiene recorrido.» y «Se pone en Ajustes › El centro › Tipos de documento › «Recorrido».». Sin papel, no sale nada.
- **El mapa con «Solo si»:** encima de la lista, si alguna tarea tiene «Solo si», sale la línea «Ver la guía para:» con un desplegable por cada dato que usan los «Solo si» de la guía (también la clase del tercero), cada uno con «Todos los casos» y sus valores. Al elegir un caso, las tareas que no saldrían en un asunto así quedan en gris y tachadas, sin desaparecer. Con «Todos los casos» la lista queda normal. Si ninguna tarea tiene «Solo si», la línea no sale. Elegir un caso no se guarda: es solo para mirar.
- «Cancelar», «Guardar», lo que se guarda y cómo llega a los asuntos no cambian.
- Desaparecen: la ventana estrecha y los botones ↑ ↓ y «Quitar» de cada tarea en la lista (quedan solo en la derecha).

## Pantalla de prueba
- Aprobada el 24-nov-2026: `docs/pantallas/737.html` · https://claude.ai/artifact/EFCPu2H8s71xEUbhv4jptq

## Qué NO se hace en esta tarea
- El editor de las guías con hitos (`js/guias-editor.js` sin la casilla «Sin hitos») no cambia.
- Cambiar el recorrido de un papel desde aquí: se sigue haciendo en Ajustes › El centro › Tipos de documento.
- Guardar el caso elegido en «Ver la guía para».

## Notas técnicas de Claude
- Leer antes `docs/701-GUIA-COMO-LISTA-DE-TAREAS.md`, `docs/706-ROTULOS.md`, `docs/707-COMO-SE-HACE.md` y `docs/698-RECORRIDO-DEL-TIPO-DE-DOCUMENTO.md`. Lo nuevo se añade, no sustituye: un tipo con hitos no cambia en nada.
- El editor es `js/guia-sin-hitos.js` (`GuiaSinHitos.editar`, 128 líneas), llamado desde `js/guias-editor.js:31`. Se mantiene su entrada y su salida (devuelve la guía normalizada o `null`), y todo lo que guarda hoy cada tarea (`texto`, `rotulo`, `papel`, `comoSeHace`, `soloSi`, `id`). Si pasa de 400 líneas, partirlo por temas en ficheros nuevos apuntados en su `js/cargar-piezas-N.js`.
- Pantalla completa: mirar cómo lo hace la mesa del hito (`docs/EL-HITO-A-PANTALLA-COMPLETA.md`, `css/hito-mesa.css`). Si se sigue usando `U.preguntar`, con una clase propia del cuadro para que ocupe toda la ventana, respetando la regla común `.capa > .cuadro` (cabecera y botones fijos; cada columna se desplaza por su cuenta; nunca `overflow` en el cuadro entero). Los botones «Cancelar» y «Guardar» van arriba, en la cabecera.
- «Cuándo se hace» a la derecha: el mismo `GuiasCuando.bloque` de hoy (con «+ Nuevo campo de lista…»). Papel: `TareaPapelPintar.selectorHTML`.
- Recorrido: `RecorridoTipo.tiene(tipo)`, `RecorridoTipo.pasos(tipo)` y `RecorridoTipo.resumen(tipo)`.
- «Ver la guía para»: los datos y sus valores, los mismos que ofrece `GuiasCuando` (también `SoloSi.CAMPO_TERCERO`). Para decidir si una tarea sale, usar la misma regla que el asunto (`js/solo-si.js`), incluidas las condiciones `ademas`; con un dato en «Todos los casos», esa condición no tacha.
- Arrastrar con los sucesos de arrastre del navegador; Intro y borrar en la caja de la frase.
- Colores, letras y botones, los de la app; la pantalla de prueba solo dice qué hay y dónde va.
- Añadir la línea a `js/novedades.js`. Poner al día el editor en `docs/contexto/` que lo describa.
- El juego de demostración (`?demo=1&auto=1`) debe tener al menos un tipo «sin hitos» con tareas con «Solo si», con papel con recorrido y con papel sin recorrido; si no, añadirlo.

## Cómo lo comprueba el segundo revisor
- En la demostración, abrir la guía de un tipo «sin hitos»: ocupa toda la pantalla, con «Cancelar» y «Guardar» arriba.
- A la izquierda, cada tarea en una línea con su frase entera y sus marcas (papel, «Solo si…», «Cómo se hace»); los rótulos sin número.
- Intro en una frase crea una tarea debajo con el cursor en ella; borrar en una frase vacía la quita; el «+» al pasar el ratón mete una tarea debajo.
- Arrastrar una línea por su asa la cambia de sitio, y los números se rehacen.
- Pulsar una línea la marca y la enseña a la derecha; lo escrito a un lado sale en el otro; «↑ Subir», «↓ Bajar» y «Quitar esta tarea» funcionan.
- Elegir un papel con recorrido enseña sus pasos y su resumen; uno sin recorrido, el aviso; sin papel, nada.
- «Ver la guía para» sale solo si hay «Solo si»; elegir un valor tacha en gris las tareas que no saldrían, sin quitarlas.
- «Guardar» guarda lo mismo que antes: tras volver a abrir, todo sigue (orden, papel, «Cómo se hace», «Solo si», rótulos). «Cancelar» no guarda nada.
- La guía de un tipo con hitos se edita como antes.
- Qué hace la app que este texto no pide.

## Qué mirar al terminar
- Abrir la guía de IPASEN ALUMNADO y escribir dos tareas seguidas con Intro.
- En una guía que tenga alguna tarea con «Solo si», elegir un caso en «Ver la guía para».

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
- 24-nov-2026, segundo revisor (contexto limpio, en local): **APROBADA a la primera.** Los nueve puntos de «Cómo lo comprueba el segundo revisor» coinciden, y las tres comprobaciones fijas (consola, pantallas principales, crear/abrir/cerrar un asunto) también; sin errores de consola.
- Lo que hace la app que el texto no pide (aviso del revisor, no se quita): sale el aviso «Guía de X guardada: N tareas.» al guardar (ya lo hacía antes); quitar una tarea no pide confirmación pero se deshace con «Cancelar»; el texto de un rótulo sale en mayúsculas.
- No lo he podido ver: la guía de IPASEN ALUMNADO real con datos del centro (la demostración lleva un tipo inventado con ese nombre). `npm test`: 417 de 418 en la pasada; la que fallaba (`actividades`) falla igual en `main` y se arregló aparte en la fila 739 (ya en `main`).
