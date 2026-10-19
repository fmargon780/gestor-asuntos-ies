# El tutor de cada grupo, sacado del Centro de datos (fila 376)

Tema 362, segunda parte (idea 357). Diseñado con Francisco el 18-oct-2026.
La primera parte (teléfono y correo del centro) es la fila 375.

## Cuándo se puede hacer

**No se empieza hasta que la idea 53 del Centro de datos esté HECHA** (repositorio
`fmargon780/centro-de-datos-ies`, `docs/COLA.md`, fila 53: «El ensayo de las tutorías
sale distinto de la aplicación de hoy en 19 de 20 partes con los datos reales»).
Hoy esa fila 53 es una IDEA sin diseñar: hay que diseñarla en el Centro de datos.
Mientras tanto la fila 376 está BLOQUEADA y nadie la coge. Cuando la 53 esté HECHA,
quien lo vea cambia la 376 a PENDIENTE (solo esa palabra y la fecha) en una subida de
`docs/`.

## Qué pasa hoy

El Gestor lee él mismo el PDF de la función tutorial de Séneca
(`js/tablas-datos-leer.js`, `tutoriasDePdf`) y de ahí saca la tabla TUTORIAS. Con ella
funcionan: el tutor de hoy de cada grupo (`js/tutor-del-grupo.js`), el botón «+ Tutor/a
de …» del correo (fila 348, `js/correo-tutor-botones.js`), el aviso al tutor
(`js/informar-al-tutor.js`), el correo del hito al tutor (fila 299) y la tabla de
periodos del Certificado de función tutorial (`{{TABLA TUTORIAS}}`).

El Centro de datos ya hace ese mismo trabajo y lo entrega hecho: el conjunto
`tutorias` (contrato del Centro de datos, `docs/CONTRATO.md`, apartado «El conjunto
`tutorias`»): una parte por curso escolar en `hecho/tutorias/<curso>/curso.json`, un
registro por grupo con `tutores` (todas las líneas del curso con `desde`, `hasta`,
`sustituto`, `id` del documento…), `tutorHoy` y `tutorHoyId`, y además
`funcionesSinGrupo`. Hay dos maneras de saber lo mismo.

## Qué hay que hacer

1. **Lector nuevo.** Hoy la importación de la fila 312 (`js/centro-de-datos-reparto.js`,
   caso `tutorias`) solo copia el PDF, y `delCurso('tutorias')` (`js/centro-de-datos.js`)
   coge solo el curso actual. Hace falta un lector nuevo de las fichas
   `hecho/tutorias/<curso>/curso.json`, al estilo del del personal
   (`js/centro-de-datos-personal.js`), que lea **todos los cursos que traiga**, no solo
   el actual: el certificado necesita los periodos de cursos pasados.
2. **Misma forma que hoy.** El lector convierte las fichas a la misma forma de la tabla
   TUTORIAS que hoy devuelve `TablasDatos.cargar()` (`{curso, grupo, nombre, dni, desde,
   hasta, clave}`), con el curso en el formato de hoy («2025/2026», no «25-26») y el
   documento en `dni`/`clave` como hoy. Lo que usa esa tabla (tutor de hoy, «+ Tutor/a»,
   aviso al tutor, correo del hito, tabla del certificado y «Tablas de datos») no se
   reescribe. Las líneas de `funcionesSinGrupo` entran también, como hoy entran las
   tutorías sin grupo («Tutoría de Pedagogía Terapéutica…», `cargoDe` en
   `js/tablas-datos.js`).
3. El Gestor **deja de leer el PDF** de la función tutorial, también los que haya en
   `_GESTOR/datos`. No hay vuelta atrás al PDF si falta algo (un solo sitio para cada
   dato).
4. **Curso que falta.** Si en `_GESTOR/datos` queda un PDF de función tutorial de un
   curso que el Centro de datos no trae, la app lo dice en ámbar, como los demás avisos
   de dato que falta: «El curso X está en un PDF suelto, pero no en el Centro de datos.
   Súbelo al Centro de datos». No lo lee ni inventa nada.
5. **Comparar antes de quitar.** El resultado tiene que ser el mismo que hoy con los
   mismos datos. En `pruebas/` no hay PDF de tutorías y la prueba
   (`js/demo/datos-tutor.js`) dibuja solo el curso actual: la sesión fabrica datos de
   prueba de dos cursos, a la vez como PDF y como fichas `hecho/tutorias`, y compara
   que la tabla y los tutores salen iguales por los dos caminos. Si sale distinto, la
   fila queda BLOQUEADA con lo que no cuadra, sin publicar. El modo de prueba
   (`?demo=1`) se queda con esas fichas de dos cursos.
6. **Fuera la subida a mano.** En «Tablas de datos» se quita la opción de subir el PDF
   de la función tutorial. En su lugar sale una línea: «Las tutorías se suben al Centro
   de datos». Las demás tablas que se suben a mano allí (Consejo Escolar, CSV/Excel)
   no cambian.

## Ejemplo con datos reales

El **Certificado de función tutorial** de **Virginia Ruiz Martín** (fue tutora en el
centro; hay un certificado suyo de noviembre de 2023): tiene que salir con la misma
tabla de periodos que hoy. En el modo de prueba (`?demo=1`), un profesor de prueba que
tenga tutorías en dos cursos distintos.

## Cómo sabré que está bien

1. El Certificado de función tutorial de un profesor (en la prueba, uno del profesorado
   de prueba con tutorías en dos cursos; en real, Virginia Ruiz Martín) sale con la
   misma tabla de periodos que hoy.
2. En un correo de un alumno, «+ Tutor/a de su grupo» pone el mismo tutor que tiene el
   Centro de datos.
3. La tabla de tutorías de «Tablas de datos» sale igual que hoy.
4. Si al Centro de datos le falta un curso, la app lo avisa en ámbar y no lo saca del
   PDF por su cuenta.
5. En «Tablas de datos» ya no se puede subir el PDF de tutorías; sale la línea «Las
   tutorías se suben al Centro de datos».

## Al terminar

Cuenta en `docs/CONTEXTO-CORTO.md`, en una línea, que el tutor y las tutorías vienen
solo del Centro de datos. Marca la fila 376 HECHA como siempre.
