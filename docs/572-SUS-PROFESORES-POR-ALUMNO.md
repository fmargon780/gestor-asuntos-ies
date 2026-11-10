# 572 — Sus profesores por alumno

Diseñada en el tema 564 (junta la idea 559).

## Lo que escribió Francisco
«Sus profesores» por alumno: que el correo de un asunto proponga solo los profesores que dan clase al
alumno (los de sus materias), cogiéndolos del dato «profesores de cada alumno» del Centro de datos, en
vez de todos los del grupo. Lo decidió Francisco al diseñar el tema 134 del Centro de datos (su fila 136).

## Lo que entendió Claude (acordado con Francisco el 9-nov-2026)
- Hoy el correo de un asunto no propone ningún profesor: el papel «Profesores del grupo» de la
  plantilla no coloca a nadie y al buscar «profesor» en Para, Copia o Copia oculta no sale ninguno.
- En el correo de un asunto de un alumno salen, en la lista que se busca escribiendo (Para, Copia y
  Copia oculta), sus profesores: solo los de las materias de su matrícula.
- Cada uno sale como «Profesor/a de <materia>». Se encuentra escribiendo su nombre, «profesor»,
  «profesora», «profesores» o el nombre de la materia.
- Un profesor que le da dos o más materias sale una sola vez, con todas: «Profesor/a de Matemáticas
  y Física y Química».
- En un asunto de grupo salen todos los profesores de ese grupo, cada uno una vez, con sus materias
  en ese grupo (decidido por Francisco: opción 1, «en esta idea»).
- Con varios alumnos relacionados con el asunto salen los profesores de todos ellos, cada profesor
  una vez, con todas sus materias.
- En la plantilla de correo, el papel «Profesores del grupo» pasa a llamarse **«Sus profesores»** y
  coloca a esos mismos profesores. Las plantillas que ya lo tienen siguen funcionando igual.
- Un profesor sin correo en el personal sale igual, con el aviso «Falta el correo de…» que ya sale
  hoy con el tutor del grupo.
- Si el Centro de datos no tiene el dato de este curso, no sale ningún profesor y lo demás del
  correo funciona igual, sin aviso nuevo.
- No desaparece nada de la app.

## Pantalla de prueba
- Sin pantalla: no cambia dónde está nada; solo aparecen más personas en la misma lista (decidido
  por Francisco el 9-nov-2026).

## Qué NO se hace en esta tarea
- Nada en el Centro de datos: el dato ya existe (su fila 136, HECHA).
- No se avisa en ninguna parte de que falta subir el listado «Materias, profesorado y unidades».

## Notas técnicas de Claude
- Datos: conjuntos `profesorado-alumnos` y `profesorado-grupos` del Centro de datos. Su contrato,
  copiado en `docs/CENTRO-DE-DATOS-CONTRATO-2.md`, sección «Lo que el Gestor toma: los conjuntos
  `profesorado-grupos` y `profesorado-alumnos` (fila 572)». Se toman igual que `tutorias`
  (`js/centro-de-datos-tutorias.js`, `js/tablas-datos-tutorias.js`): por el índice `hechos`, parte
  `curso`, todos los cursos; copia a `_GESTOR/datos` apuntada con `DatosQueTengo.apuntar`.
- Curso: el del asunto; si no tiene, el actual.
- Alumno: su `id` en `profesorado-alumnos` es el de su ficha en `alumnado` (`actuales`) del mismo
  curso. Las materias de un profesor se juntan cruzando por nombre de profesor (sin tildes ni
  mayúsculas).
- Correo del profesor: con `fichaId` de `profesorado-grupos` (misma unidad y materia), desde el
  personal pedido a `Datos` (`cargarPersonal`), como el tutor. Sin `fichaId`, buscar en el personal
  por nombre; si no aparece o hay dos, sale sin correo (`sinCorreo`, aviso de siempre).
- Asunto de grupo: el mismo criterio que ya usa `esFamiliaForzada` (`AsuntoDeGrupo.esGrupo`); la
  unidad, la del grupo del asunto; se usa `profesorado-grupos`.
- Enganche ya previsto: `Horario.profesoresDeUnidades(a)` en `js/correo-para.js` (fila 555). Crear
  el módulo que lo cumple (devuelve `{ clave, nombre, materia, correos }`); `materia` ya junta las
  materias con « y ». El papel sigue siendo `profes` (no cambia lo guardado en las plantillas); solo
  cambia su nombre en `js/plantilla-papeles.js` y su búsqueda (añadir «sus profesores»).
- Datos de demostración: añadir al modo demo un alumno con profesores, uno con dos materias y uno
  sin correo, para el revisor.
- Repasar los textos que nombren «Profesores del grupo» (ayuda, `docs/VOCABULARIO.md`).

## Cómo lo comprueba el segundo revisor
- En el correo de un asunto de un alumno, al escribir «profesor» salen sus profesores, cada uno como
  «Profesor/a de <materia>», y ninguno que no le dé clase.
- Al escribir una materia («Lengua») sale su profesor.
- Un profesor con dos materias sale una sola vez, con las dos.
- En un asunto de grupo salen todos los profesores del grupo, cada uno una vez.
- Con varios alumnos relacionados salen los de todos, sin repetir.
- En la plantilla de correo el papel se llama «Sus profesores»; puesto en Copia, al abrir un correo
  con esa plantilla los profesores salen ya en Copia.
- Un profesor sin correo sale con el aviso «Falta el correo de…».
- Sin el dato del Centro de datos no sale ningún profesor y el correo funciona igual.

## Qué mirar al terminar
- Abre el correo de un asunto de un alumno y escribe «profesor» en Para: salen solo los suyos, con su materia.
- Escribe el nombre de una materia: sale quien se la da.
- Abre el correo de un asunto de grupo y escribe «profesor»: salen todos los del grupo.
- En una plantilla de correo, mira que el papel se llama «Sus profesores».

## Revisión y respuestas durante el trabajo
- Segundo revisor (10-nov-2026, copia de pruebas local, sin leer el código):
  - Profesores de un alumno al escribir «profesor»: coincide (Otero Campos, Reyes Palma, Cabello Ruiz; Uceda Molina, que no le da clase, no sale).
  - Escribir una materia: coincide. Dos materias de un profesor, una sola vez: coincide.
  - Asunto de grupo: no lo he podido ver del todo con la demo (sus grupos no traen unidad o solo un profesor); lo cubre `pruebas/sus-profesores.mjs` con datos propios (4º A: cuatro profesores, una vez cada uno).
  - Varios alumnos: visto con un relacionado puesto desde la consola (la profesora común sale una vez); `pruebas/sus-profesores.mjs` lo comprueba.
  - Plantilla: coincide («Sus profesores» en Copia coloca a los que tienen correo; el que no, no).
  - Sin correo: coincide en lo visible («Falta el correo de…» con casilla; guardarlo lo cubre la prueba).
  - Sin el dato del curso: no sale nadie y no hay errores. Nada que el texto no pida.
  - Observación: si el tutor del grupo es también profesor del alumno, sale en Para (como tutor) y en Copia (como profesor); el texto no lo trata y no se ha cambiado.
  - Pruebas: `plantillas-pantalla` y `convertir-en-plantilla-pdf-pantalla` fallan igual en `main` sin esta fila (no son de este cambio).
