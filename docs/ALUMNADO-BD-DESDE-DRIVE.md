# El alumnado de la base de datos, desde la carpeta de Drive

Fila 144 de `docs/COLA.md`. Cerrada con Francisco el 25-sep-2026. **Sustituye el camino de la
fila 142** (`docs/ALUMNADO-DESDE-LA-BD.md`).

## Por qué

La fila 142 traía el alumnado de una dirección web de Apps Script con clave. Al hacer su mitad en
`bd-alumnado-ies`, el control de seguridad de Claude Code la paró: datos de menores abiertos a
quien tuviera la línea. Francisco lo descartó: **nada de dirección web ni de clave**. La base de
datos de alumnado deja ahora un archivo en Drive, y ese archivo lleva **todo** lo que sabe de cada
alumno, no una selección.

Lee entero `docs/ACUERDO-ALUMNADO.md` (versión 2) antes de empezar. La otra mitad es la fila 4 de
la cola de `bd-alumnado-ies`. Esta fila no depende de que esa esté hecha: se prueba con un
archivo inventado.

## Qué quiere Francisco

Usar en el gestor toda la información de cada alumno de la base de datos, actual e histórica:
materias matriculadas, centro de procedencia, repeticiones, NEAE… Ejemplo que dio: hacer el grupo
de 1º de ESO por centro de procedencia para el asunto de los cuestionarios de altas capacidades.
Y que lo que la base de datos añada en el futuro aparezca solo, sin tocar el gestor.

## Qué hay que hacer

1. **Quitar la dirección web** de la fila 142: la caja para pegarla, «Probar», la llamada con
   `fetch` y lo que se guardó de ella en los ajustes. Nada de `script.google.com` para el alumnado.
2. **Señalar la carpeta**: en Ajustes, el bloque «Base de datos de alumnado» pasa a ser «Carpeta
   de la base de datos de alumnado»: botón para señalarla (la carpeta «Datos de matrícula» que
   Google Drive para ordenador enseña en el ordenador), con el mismo mecanismo y la misma memoria
   que las carpetas del Dropbox. Es de cada ordenador, como ellas. Debajo: fecha de la última
   copia y cuántos alumnos y datos trae.
3. **Traer el archivo**: al entrar y con «Traer el alumnado ahora» (Mantenimiento), si la carpeta
   está señalada y su `ALUMNADO-BD.json` es más nuevo que la copia, se valida (sección 4 del
   acuerdo) y se copia a `_GESTOR/datos/ALUMNADO-BD.json` **por la cola de guardado**
   (`ColaGuardado`). Sin carpeta señalada (el compañero), se usa la copia tal cual. Si el archivo
   no vale, se sigue con la copia y aviso ámbar (`U.accesorio`).
4. **Todo es genérico, guiado por `campos`**. Ningún dato con nombre propio en el código, salvo
   `idEscolar` y `matriculado`. Un dato nuevo en el archivo aparece solo en los tres sitios de
   abajo, sin tocar nada.
   - **Ficha del alumno** («Ver todo»): una tarjeta por `apartado`, plegadas, con su resumen en el
     título (la regla de siempre). Cada tipo se enseña a su manera: `tabla` como tabla, `lista` con
     comas, `si-no` como «Sí»/«No», `fecha` como `dd-mm-aaaa`; un tipo desconocido, como texto.
     Sustituye a la tarjeta «Datos académicos» de la fila 142. Al pie, la fecha de los datos.
   - **Plantillas**: cualquier dato como hueco, por su `etiqueta`, por el camino de las tablas de
     datos (`docs/contexto/TABLAS-DE-DATOS.md`), unido por Nº escolar; las `tabla`, como
     `{{TABLA …}}`. En el cuadro de insertar huecos, agrupados por `apartado`.
   - **Grupos de terceros relacionados** (las altas por grupo de un asunto): además de unidad,
     nivel y grupo propio, «Por datos del alumnado»: elegir uno o varios datos y su valor (p. ej.
     Curso = 1º ESO y Centro de procedencia = …), ver cuántos salen y añadirlos. Valores
     desplegables con los que existen. Solo matriculados, salvo que se marque «Incluir antiguos».
5. **Mezcla con el RegAlum**: el RegAlum sigue siendo la base del alumnado, como hoy. El archivo
   **suma** datos, unidos por Nº escolar. Si un dato está en los dos, manda el del archivo, salvo
   que el archivo sea más viejo que el RegAlum. Nada de lo que hoy funciona con el RegAlum puede
   dejar de funcionar.
6. **Tamaño**: el archivo puede pesar varios megas (antiguos e historia). Se lee una vez y se
   guarda en memoria; la ficha, el buscador y la lista de personas no pueden ir más lentos.
7. **Frescura** (`js/frescura.js`): mira `generado`, como en la fila 142.
8. **Copia sin internet**: funciona igual con la copia del Dropbox.

## Ficheros que hay que tocar

- `js/alumnado-bd.js` (de la fila 142): quitar lo de la dirección; leer de la carpeta, validar,
  copiar y unir. Si pasa de 600 líneas, en dos.
- El bloque de Ajustes y el de Mantenimiento que puso la fila 142.
- `js/ficha-tercero-alumno.js` (tarjetas por apartado), `js/tablas-datos-leer.js` (huecos), el
  fichero de las altas por grupo de terceros relacionados (`js/relacionados*.js`, el que toque).
- `pruebas/alumnado-desde-la-bd.mjs`: rehacerla con un archivo inventado de acuerdo 2 (un
  matriculado de 1º ESO con materias y centro de procedencia, uno antiguo con historia, un dato de
  tipo desconocido que sale como texto, y un archivo con `acuerdo: 99` que se rechaza). Comprueba
  también que un grupo «Curso = 1º ESO y Centro de procedencia = X» saca a quien debe.
- Documentación: `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` que toque,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md` y `docs/COMPROBAR-A-MANO.md`
  (quitar lo de pegar la dirección; poner cómo señalar la carpeta de Drive).

## Cómo trabajar

- **Sube directamente a `main`, sin abrir ninguna petición de cambios** (si la sesión no puede,
  sigue la nota de `docs/COLA.md`).
- Cambios quirúrgicos: no reescribas ficheros enteros. Ninguno de `js/` pasa de 600 líneas.
- No leas el repositorio entero: `docs/CONTEXTO.md`, este documento, el acuerdo y los ficheros de
  la lista.
- Una sola prueba al final (`npm test` completo). Solo alumnos inventados.
- Si algo del acuerdo no encaja, **no lo cambies por tu cuenta**: apúntalo en «Lo que queda por
  hablar con Francisco» de `docs/COLA.md` y sigue con lo demás.
