# Repartir un PDF cortando donde cambia de alumno

Fila 343 de `docs/COLA.md`. Idea de Francisco, diseñada con él el 13-oct-2026. **Va después de la
fila 342** (`docs/REPARTIR-CON-FILTRO.md`): toca los mismos cuadros.

## De dónde sale esto

Séneca da en un solo PDF el «Informe final de etapa» de Primaria de todo el alumnado de un colegio:
896 páginas, 150 informes. Francisco quiere un asunto general con el PDF entero y, para cada informe,
un asunto del alumno, ya archivado, para poder consultarlo en el futuro.

Eso ya lo hace «Repartir entre terceros» (fila 141, con las filas 337, 339 y 342). Lo que falla es
**dónde se corta**: hoy los trozos son todos del mismo tamaño. En este PDF casi todos los informes
tienen 6 páginas, pero dos tienen 4, y desde la página 43 todo se descuadraría. Además, hoy la
lectura solo busca entre los relacionados del asunto (o el filtro), y Francisco tendría que
relacionar antes a 148 alumnos.

Cómo es el PDF real (no se sube al repositorio: datos de menores):

- Cada página lleva el nombre del alumno y su Nº de identificación escolar. En la primera hoja de
  cada informe van en un bloque («APELLIDOS Y NOMBRE:» y, más abajo, «Nº EXPTE.: … Nº I.ESCOLAR:» con
  los números en la línea de debajo). En las demás hojas, en una línea: «APELLIDOS: Pérez Gil
  NOMBRE: Ana Nº I. ESCOLAR: 1234567».
- La primera hoja también trae otros números (Nº de expediente, teléfonos, DNI de los tutores
  legales, códigos postales). Solo cuenta el número escolar.
- Cada informe termina en una hoja con «LUGAR, FECHA Y FIRMA».
- **Dos alumnas tienen dos informes seguidos** (uno por cada colegio en el que estuvieron en 6º):
  páginas 43–46 y 47–52 la misma alumna, con el mismo número escolar. Los dos son válidos. Cortar
  solo «donde cambia el número» los juntaría en un trozo de 10 páginas: no vale.
- Lo genera Oracle Reports y trae texto (no es escaneado).

## Lo que se pide

### 1. Cortar por alumno

Al abrir el cuadro de reparto de un PDF, antes de proponer trozos de tamaño fijo, la app lee el
texto de todas las páginas (pdf.js, como ya hace `N.leerTrozo`) y busca en cada una quién es:

1. **El número escolar.** Primero, cualquier número de la página que sea el Nº de identificación
   escolar de un alumno del alumnado (actuales y antiguos). Si no casa ninguno, el número que va
   junto a la etiqueta («Nº I. ESCOLAR», «Nº I.ESCOLAR», «Nº de identificación escolar», con o sin
   punto y espacio, sin mirar mayúsculas ni tildes), en la misma línea o justo debajo.
2. **Si no hay número, el nombre:** nombre y apellidos de un alumno del alumnado, con la comparación
   tolerante que ya existe (sin tildes, en cualquier orden, «Apellidos, Nombre»), o lo que vaya junto
   a las etiquetas «APELLIDOS Y NOMBRE:» o «APELLIDOS: … NOMBRE: …».

Con eso, la app propone los trozos:

- **Se corta donde cambia el alumno.**
- **Y también donde, con el mismo alumno, empieza otro informe.** Regla general, no solo para este
  PDF: se calcula una huella de cada página con su texto fijo (sin el nombre, sin números y sin
  fechas). Si una página tiene la misma huella que la primera página del trozo en curso, empieza
  un trozo nuevo. Así, en este PDF, la primera hoja de cada informe abre trozo.
- Las páginas de delante sin alumno (un oficio, una portada) forman el trozo «Se queda en este
  asunto», como hoy.
- **Solo se usa este corte si al menos el 80 % de las páginas tienen alumno.** Si no, todo sigue
  como hoy: trozos de tamaño fijo con «Páginas de cada trozo».
- Arriba del cuadro, una línea gris que dice cómo se ha cortado: «Cortado donde cambia el número
  escolar: 150 trozos» o «Cortado donde cambia el nombre: 150 trozos». Los «+1 página» y
  «−1 página» siguen funcionando igual para corregir a mano.

Con 896 páginas, la lectura va por tandas, con «Leyendo página 120 de 896…» dentro del cuadro, sin
congelar la pantalla. Las miniaturas se siguen pintando solo a medida que se ven.

### 2. Asignar el alumno

- Con número escolar que casa con un alumno: asignado, en **verde «Leído del documento»**. Se busca
  en **todo el alumnado**, no solo entre los relacionados.
- Con nombre (sin número): si casa con un solo alumno por nombre y los dos apellidos, verde. Si casa
  con más de uno, o solo con parte del nombre: **ámbar «Revísalo»**, con el más probable propuesto.
- **Dos trozos seguidos del mismo alumno** (los dos informes de una alumna): los dos asignados a
  ella, el segundo con ámbar suave «Mismo alumno que el trozo anterior: dos documentos». No se
  quita ninguno.
- **Alumno que no está en el alumnado** (por ejemplo, se matriculó en otro centro): se asigna igual,
  con el nombre y el número escolar que trae el propio informe, y una marca gris «No está en el
  alumnado: se crea con los datos del informe». Su asunto se crea con ese tercero, escrito con la
  regla de siempre (`Apellido1 Apellido2, Nombre` + Nº de identificación escolar). Usa el camino que
  ya exista para un tercero alumno que no está en el RegAlum (el de «Buscar a otra persona…» o el de
  Personas y empresas); si no hay ninguno, el tercero se monta con esos dos datos y lo dices en la
  nota de la fila.
- Con el filtro de la fila 342 puesto, mandan sus reglas: un alumno leído fuera del filtro sale en
  ámbar con «Asignarlo igualmente».

### 3. Crear los asuntos

Igual que hoy, sin cambios: un asunto por trozo asignado, del tipo elegido, ya archivado, con su
trozo dentro y la nota «Viene de…»; en el asunto de origen se queda el PDF entero y la nota con el
reparto. Además:

- **Cada alumno que recibe trozo queda relacionado con el asunto de origen** (si no lo estaba), para
  que el asunto general diga quiénes van dentro.
- Dos trozos del mismo alumno: dos asuntos, uno por informe.
- El aviso de antes de confirmar («ya tiene un asunto de ese tipo», con «Crear igual») sigue como hoy.
- Con 150 asuntos, «Creando 37 de 150…» dentro del cuadro, como hoy. Si se corta a mitad, volver a
  pulsar «Repartir entre terceros» retoma sin duplicar (ya lo hace).

### 4. El tipo de asunto

Nada nuevo: la primera vez Francisco elige en el cuadro el tipo de asunto y de documento; si lo pone
en el tipo del asunto de origen («Al repartir, crear asuntos de tipo…»), ya sale elegido las
siguientes veces.

## Qué ficheros tocar

- `js/repartir-nucleo.js` (`RepartirNucleo`): funciones sin efectos, probables con `vm`: buscar el
  número escolar y el nombre en el texto de una página, la huella de una página, proponer los trozos
  por alumno, la regla del 80 %.
- `js/repartir-pantalla.js`: leer todas las páginas por tandas al abrir, usar el corte por alumno,
  la línea gris, las marcas nuevas y la búsqueda en todo el alumnado.
- `js/repartir-crear.js`: relacionar con el origen a quien recibe trozo y el tercero que no está en el
  alumnado.
- Si alguno pasa de 600 líneas, se parte en un fichero nuevo (por ejemplo, `js/repartir-leer.js`) y
  se añade a `index.html`.
- `js/novedades.js`: una línea (cambia lo que se ve).

## Reglas de trabajo

- Las de `CLAUDE.md`: rama `fila-343`, revisor en local, fusión en `main` y una sola publicación a
  propósito.
- Cambios quirúrgicos: no reescribir ficheros enteros.
- No leas el repositorio entero: `docs/CONTEXTO.md`, el hijo de `docs/contexto/` que hable del
  reparto, `docs/REPARTIR-ENTRE-TERCEROS.md`, `docs/REPARTIR-SEGUNDO-PDF.md`,
  `docs/REPARTIR-CON-FILTRO.md` y los ficheros de esta lista.
- Pruebas: mientras trabajas, `npm test -- repartir`; la pasada completa, una vez al final.
- Ningún PDF real en el repositorio: los de las pruebas se fabrican con nombres inventados.

## La prueba

`pruebas/repartir-por-numero-escolar.mjs`:

- Sin navegador (`vm`): en el texto de una primera hoja con número de expediente, teléfono y DNI,
  solo se coge el número escolar; en una hoja de la forma «APELLIDOS: … NOMBRE: … Nº I. ESCOLAR: …»,
  también. Trozos por alumno con dos informes seguidos del mismo alumno: salen dos trozos. Con menos
  del 80 % de páginas con alumno: tamaño fijo, como hoy.
- Con navegador y el disco de mentira: un PDF fabricado con texto, con la forma del real: 2 páginas
  de oficio y 6 informes, cuatro de 6 páginas y dos de 4 páginas seguidos del mismo alumno; cinco
  alumnos del alumnado de demostración y uno que no está; el asunto, **sin relacionados**.
  - Al abrir el cuadro salen 7 trozos (el oficio + 6) y la línea «Cortado donde cambia el número
    escolar: 6 trozos».
  - Los del alumnado, en verde, asignados sin estar relacionados; los dos del mismo alumno, los dos
    asignados a él con su aviso; el que no está, asignado con sus datos y la marca gris.
  - Al repartir: 6 asuntos archivados, cada uno con su trozo del tamaño correcto; los 5 alumnos y el
    de fuera quedan relacionados con el origen; el PDF entero sigue en el origen.
- `repartir-entre-terceros.mjs`, `repartir-ficheros.mjs`, `repartir-segundo-pdf.mjs` y
  `repartir-con-filtro.mjs` siguen pasando (un PDF sin números ni nombres se corta como antes).

## Para Francisco al terminar

Lo que va a ver: al pulsar «Repartir entre terceros» en un PDF con un informe por alumno, la app
corta sola donde cambia de alumno y asigna cada trozo por su número escolar, sin tener que relacionar
antes a nadie. No hay nada que tenga que hacer él.

Lo que solo él puede comprobar con datos reales: el PDF del Informe final de etapa de Primaria del
CEIP Jorge Guillén debe salir en 150 trozos, con las dos alumnas que tienen dos informes en dos
trozos cada una.

## Cómo sabemos que está bien

1. En la demo, en un asunto sin relacionados, «Repartir entre terceros» sobre el PDF de prueba
   propone 7 trozos (el oficio y 6 informes), con la línea gris «Cortado donde cambia el número
   escolar».
2. Los trozos tienen el tamaño de cada informe (6, 6, 6, 6, 4 y 4 páginas), no un tamaño fijo.
3. Los alumnos del alumnado salen asignados en verde «Leído del documento» sin estar relacionados.
4. Los dos informes del mismo alumno son dos trozos, los dos asignados a él, con su aviso.
5. El alumno que no está en el alumnado sale asignado con su nombre y número, y la marca gris.
6. Al confirmar se crean 6 asuntos archivados, y todos esos alumnos quedan relacionados con el
   asunto de origen, que conserva el PDF entero.
7. Un PDF sin números ni nombres se sigue cortando por tamaño fijo, como antes.
