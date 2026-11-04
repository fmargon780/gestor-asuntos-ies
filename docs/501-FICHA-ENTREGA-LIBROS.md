# 501 — Ficha de entrega de libros y su duplicado por extravío

## Lo que escribió Francisco
Tema 363: «libros de texto, documento de entrega y control de los libros. Junta las ideas 356 y 366: que el Gestor coja los listados de libros de texto del Centro de datos y genere, para cada alumno, el documento del centro con los libros que recibe a principio de curso o adquiere con el cheque libro y que debe devolver; y ayudar a la secretaria a controlar la entrega, la devolución y el estado de los libros.»

Al diseñarlo (3-nov-2026): «Nos tenemos que centrar en el modelo de documento de entrega que es lo que nos podría hacer falta en este momento del curso, por si algún alumno ha perdido el que se le dió a principio de curso.»

## Lo que entendió Claude (acordado con Francisco el 3 y 4-nov-2026)
- Esta tarea es **solo el documento**. El control de entrega, devolución y estado no entra (idea 366).
- El Gestor lee los listados de libros de texto del Centro de datos.
- Tipo de asunto nuevo, **FICHA ENTREGA LIBROS**, con la ficha como plantilla de Word. Sale para **un alumno** o para **un grupo** (el asunto de grupo que ya existe).
- Cómo se usa: por cada extravío, un asunto de ese alumno con su duplicado. En septiembre, asuntos de grupo: unidad o nivel, se elige cada vez, como ya permite el asunto de grupo (Francisco, 4-nov-2026: opción «se deja libre»). No se programa nada para esto.
- La guía del tipo lleva un solo hito, «Generar la ficha».
- El alumno se elige en «Nuevo asunto» con el buscador de siempre: varias letras del nombre o los apellidos, o el DNI, o el NIE, y salen las coincidencias.
- **Nuevo en ese buscador:** al buscar alumnado, un desplegable de unidad al lado, en todo «Nuevo asunto», no solo en este tipo. Con una unidad elegida salen sus alumnos **enteros**, sin tope y sin escribir nada; escribiendo, se acotan dentro de ella.
- La ficha reproduce el modelo del centro:
  - Título «FICHA ENTREGA LIBROS 1º DE ESO» (con su nivel) y «CURSO 2026/27».
  - Recuadro con «Apellidos, Nombre» y la unidad.
  - Tabla «LIBROS | Estado de conservación»: una fila por asignatura; el estado sale en blanco.
  - Texto de compromiso, «En Alhaurín el Grande, a <fecha>», «El alumno» con «Fdo.: <nombre>» y la nota final: «Nota: Este documento será devuelto por el alumno/a a su tutor/a una vez firmado por su padre/madre».
- **Las asignaturas son las de la matrícula de cada alumno** cruzadas con el listado de libros de su nivel. Las asignaturas sin libro no salen. El número de filas cambia de un alumno a otro.
- **Ningún tutor sale impreso**: no se sabe quién firmará, ni si firma uno o los dos. Texto:
  «Quien firma abajo como padre, madre o tutor/a legal del alumno: <Nombre Apellidos>, matriculado/a en este centro en el curso de <nivel>, ha recibido TODOS los libros correspondientes a su matrícula y se compromete a devolverlos en buen estado cuando finalice el curso académico 2026-27.»
- Debajo, tabla con cabecera «Padre, madre o tutor/a legal | DNI | Firma» y **dos líneas en blanco**, y la frase «Basta con la firma de uno de ellos.»
- **Duplicado por extravío:** solo para un alumno, con una casilla «Duplicado por extravío» y la casilla «Fecha de la entrega original», que escribe quien lo genera.
  - Lleva el recuadro «DUPLICADO POR EXTRAVÍO» bajo el curso.
  - El texto cambia a: «… recibió el <fecha de la entrega original> TODOS los libros correspondientes a su matrícula y se compromete a devolverlos en buen estado cuando finalice el curso académico 2026-27. Esta ficha sustituye a la original, extraviada.»
  - Sin esa fecha no se puede generar.
- La fecha de «En Alhaurín el Grande» es siempre la del día en que se genera.
- **Si una asignatura de la matrícula no está en el listado de libros, no se puede generar la ficha de ese alumno:** aviso rojo que dice qué asignatura falta y que se arregla en el Centro de datos.
- En un grupo se generan las fichas de quien se pueda y se deja fuera al que tenga ese problema, con su aviso; el botón dice «Generar para N de M».
- **Bachillerato no lleva ficha:** el centro no entrega libros allí, los compra el alumnado. Si el listado no tiene libros de su nivel, aviso rojo y no se genera.
- El cheque libro no cambia nada en la ficha.

## Pantalla de prueba (aprobada el 4-nov-2026)
- `docs/pantallas/501.html` · https://claude.ai/artifact/3QX6MFvMDyyKCdj7xa4zts

## Qué NO se hace en esta tarea
- El control de entrega, devolución y estado de los libros: idea 366.
- El duplicado para un grupo entero.
- Corregir nombres de asignatura desde el Gestor: se arregla en el Centro de datos.
- El tema 393: esta tarea usa el asunto de grupo tal como está.

## Notas técnicas de Claude
- Datos: partes `hecho/libros/<curso>/curso.json` (`docs/37-LIBROS-DE-TEXTO.md` de centro-de-datos-ies). Leerlas de `indice.hechos` con `conjunto: "libros"` y `parte: "curso"`, como `js/centro-de-datos-personal.js`, y sumar la entrada a `js/centro-de-datos-reparto.js`. Es un cambio del contrato: ponerlo al día en `docs/CENTRO-DE-DATOS-CONTRATO-2.md`.
- El nombre de cada fila es `materia` del listado, tal cual. Solo registros con `conLibro`.
- Cruce (mismo criterio que `docs/101-CRUZAR-CONJUNTOS.md` del Centro de datos): por nivel (`bac1c`/`bac1h` → `bac1`, `bac2c`/`bac2h` → `bac2`) y materia sin tildes, en minúsculas y con espacios simples, igualdad exacta; solo materias de la matrícula en situación `MATR` o `CONV`.
- «Asignatura que no está en el listado» es la que no casa con ninguna fila del nivel, tenga o no libro. Una fila del listado sin libro casa y no sale en la ficha.
- Las materias del alumno vienen del campo `materias` de `ALUMNADO-BD.json`, que ya pinta la ficha de la persona. Comprobar con el fichero de la demo; si no llegan, parar y preguntar.
- Tabla de libros: `Docx.ponerTabla` (`js/docx-tabla.js`) pone cabecera y filas en un hueco nuevo. Hoy no hay otro hueco que haga falta para el tutor: no se añade ninguno de DNI.
- Unidad en el buscador: `App.buscarTercero` y `Datos.buscar` (`js/asuntos-nuevo*.js`) tienen tope por categoría; con unidad elegida no se aplica. La pantalla de prueba enseña el buscador junto a la ficha solo para probarlo: en la app va en «Nuevo asunto».
- Plantilla nueva en `plantillas/` (`.docx` y `.md`, como las demás) y su alta en «Cargar plantillas». Letra Times, como el modelo.
- En `.md` de esa plantilla, dejar los dos textos (original y duplicado).
- Sin datos reales en el repositorio: los modelos escaneados llevan nombres y DNI de alumnos y familias, y no se copian. Todo su texto está arriba.

## Cómo lo comprueba el segundo revisor
- Buscador de «Nuevo asunto»: por letras, por DNI y por NIE salen las coincidencias; con la unidad elegida y sin escribir sale la unidad entera, también si pasa de 30.
- Un alumno con Religión y Francés: su ficha sale con esas filas; otro sin ellas, sin esas filas.
- Duplicado marcado: sale el recuadro, «recibió el <fecha>», la frase de la original extraviada y la fecha de hoy al pie.
- Duplicado sin fecha: el botón no deja generar.
- Casilla sin marcar: texto «ha recibido» y sin recuadro.
- Alumno con una asignatura que no está en el listado: aviso rojo y no se genera.
- Grupo con ese alumno: botón «Generar para N de M», salen las demás fichas y queda su aviso.
- Alumno de Bachillerato: aviso rojo y no se genera.
- En ninguna ficha sale el nombre ni el DNI de un tutor; la tabla de firmas tiene dos líneas y «Basta con la firma de uno de ellos.»
- El Word generado se abre y coincide con `docs/pantallas/501.html`.
- [SOLO FRANCISCO] Con el listado real, generar la ficha de un alumno de 1º ESO y compararla con el modelo del centro.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
