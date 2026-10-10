# El Centro de datos pasa a su contrato 2: elegir qué se coge

Fila 317 de `docs/COLA.md`. Diseñada el 9-oct-2026 con Francisco, en la conversación de la idea 6
del Centro de datos (`fmargon780/centro-de-datos-ies`). Va después de la 312 (HECHA) y de la 313.

## Por qué

Francisco vio que el Centro de datos mezclaba ficheros distintos como si fueran versiones de uno
solo: el personal docente con el no docente, un curso con otro. Se ha rediseñado (allí, filas 6 a
9). Desde ahora cada fichero lleva una **ficha** (qué es, curso escolar, a quién se refiere,
periodo) y **puede haber varias entradas de la misma clave** en el índice: `personal` de 26-27
docentes, `personal` de 26-27 no docentes, `personal` de 25-26, la función tutorial de dos cursos…

El gestor, desde la fila 312, coge **todas** las entradas de sus siete claves sin mirar nada más.
Con una entrada por clave eso valía. Con varias, cogería la función tutorial del curso pasado
encima de la de este, o un Consejo Escolar viejo.

Por eso el Centro de datos ha subido su `contrato` a **2**: el gestor de hoy, al verlo, no toca
nada y dice «El Centro de datos es más nuevo que esta aplicación». Esta fila le enseña el
contrato 2. **Hasta que se haga, el gestor no coge nada del Centro de datos**; la subida a mano
sigue funcionando.

No depende de que el Centro de datos haya publicado ya su parte: tiene que valer con un índice de
contrato 1 y con uno de contrato 2. Se prueba con la carpeta de mentira.

## Lo que cambia en el contrato (copia; la versión buena es `docs/CONTRATO.md` de `centro-de-datos-ies`)

    { "contrato": 2, "actualizado": "…", "cursoActual": "26-27", "ocupado": false, "web": "…",
      "listados": [
        { "clave": "personal", "variante": "26-27/docentes", "cursoEscolar": "26-27",
          "ambito": "docentes", "periodo": "", "alumno": "",
          "fichero": "RelPerCen 26-27.csv", "ruta": "listados/personal/26-27/docentes/RelPerCen 26-27.csv",
          "subido": "…", "subidoPor": "…", "huella": "…", "resumen": "84 personas" },
        { "clave": "personal", "variante": "26-27/no-docentes", "cursoEscolar": "26-27",
          "ambito": "no-docentes", … },
        { "clave": "expediente-secundaria", "variante": "", "porAlumno": true, "alumnos": 214 } ] }

- `cursoActual`: el curso escolar de hoy según el Centro de datos.
- `ocupado`: si es `true`, el Centro de datos está recolocando ficheros. **No se toma nada** y se
  vuelve a intentar la próxima vez.
- Cada entrada lleva `cursoEscolar`, `ambito` (a quién se refiere), `periodo` y `alumno`; `""`
  cuando no toca. `variante` son las partes no vacías de los tres primeros, unidas con `/`.
- `personal`: `ambito` es `docentes`, `no-docentes` o `""` (todo el personal).
- `consejo-escolar`: `periodo` son los años, `2024-2026`, o `""`.
- Hay claves nuevas que no son del gestor (censo NEAE, admisión, expedientes…) y entradas con
  `porAlumno: true`, que no llevan `fichero` ni `ruta`. Se ignoran, como hasta ahora.
- La carpeta `sin-reconocer/` se llama ahora `sin-clasificar/`. El gestor no la mira.
- `configuracion.json` **no cambia** y sigue con su propio `"contrato": 1`.

## Lo que añade el plan del núcleo (el contrato sigue en 2)

Fila 323, `docs/PLAN-NUCLEO.md`. El índice puede traer `capacidades`, `hechos` (con la carpeta `hecho/`)
y entradas de una clave nueva, `entrega`. El gestor **ignora** todo eso: solo mira las claves que ya
conoce. `subidoPor` puede ser el nombre de una aplicación (`centro-de-datos-ies`) en vez de un correo.
De la entrada `alumnado-bd` el gestor necesita **una sola**, con `ruta`, `subido` y `huella`; la `ruta`
puede estar en cualquier carpeta, también dentro de `hecho/`. El fichero que trae puede ser de
`origen: "centro-de-datos-ies"` (ver `docs/ACUERDO-ALUMNADO.md`).

## Decisiones ya tomadas (no se vuelven a discutir)

1. **No se escribe ninguna importación nueva.** Solo cambia **qué entradas se eligen**. Lo elegido
   se entrega como en la fila 312.
2. Con `contrato` mayor que 2, como hoy: no se toca nada y se dice.
3. Con `ocupado: true`: no se toma nada. No es un error ni un aviso ámbar: en el bloque de Ajustes
   sale en gris «El Centro de datos está recolocando sus ficheros. Lo traeré más tarde.», y el
   botón de traer contesta eso mismo.
4. La regla de la fila 312 no cambia: nunca se sustituye un dato por otro más viejo (las tres
   condiciones siguen igual, por `clave` + `variante`).
5. **Nada de lo ya tomado se vuelve a tomar por este cambio.** Con el contrato 2 cambian algunas
   `variante` (`registro-entrada` pasa de `""` a `26-27`; `personal`, de `26-27` a
   `26-27/docentes`), y el apunte de antes ya no casa por su llave. Por eso se añade una cuarta
   condición: **una entrada no se toma si algún apunte de esa misma `clave`, con la variante que
   sea, tiene su misma `huella`.**

## Qué hay que hacer

### 1. Admitir el contrato 2 (`js/centro-de-datos.js`, `js/centro-de-datos-ver.js`)

`CONTRATO = 2`. Busca con `grep -n "contrato" js/centro-de-datos*.js js/*centro*` todos los sitios
donde se compara, también los que haya dejado la fila 313 al leer `configuracion.json`. **La
lectura de la configuración del centro (filas 313 y 316) no puede pararse por el contrato del
índice ni por `ocupado`**: `configuracion.json` es otro fichero y no ha cambiado.

### 2. Elegir (`js/centro-de-datos.js`)

Una función nueva, `elegir(indice)`, sustituye al filtro `interesa`. Devuelve las entradas que se
tomarían, con esta regla por clave. Antes de nada se descartan las que no tienen `ruta` o llevan
`porAlumno`, y las que llevan `alumno` no vacío.

| `clave` | Qué se elige |
|---|---|
| `alumnado` | la única. **Si hay más de una, ninguna**, y se dice en ámbar: «En el Centro de datos hay más de un listado de alumnado. No he traído ninguno.» |
| `alumnado-bd` | la única; con más de una, ninguna, igual |
| `personal` | **todas**: todos los cursos, docentes y no docentes. Es lo que quiere `js/datos-personal.js`, que lee todos los `RelPerCen…` de la carpeta |
| `tutorias` | la de `cursoEscolar` igual a `cursoActual`; si no hay ninguna, la de `cursoEscolar` vacío; si tampoco, ninguna |
| `consejo-escolar` | **todas**, una por `periodo`. `js/tablas-datos-consejo.js` ya guarda un fichero por periodo y los funde: un periodo viejo no pisa a uno nuevo |
| `registro-entrada`, `registro-salida` | la de `cursoEscolar` igual a `cursoActual`; si no hay, la de `cursoEscolar` vacío |

Con un índice de contrato 1 (sin `cursoActual` ni fichas), `cursoActual` es `U.cursoActual()` y
los campos que falten se leen como vacíos: el resultado es el de hoy.

### 3. El nombre con el que se guarda cada fichero de personal (`js/centro-de-datos-reparto.js`)

`js/datos-personal.js` saca el curso de cada `RelPerCen…` **de su nombre**, y sin curso en el
nombre supone el de hoy. El Centro de datos puede saber el curso aunque el nombre no lo lleve (lo
eligió Francisco al soltarlo). Para que no se pierda, y para que dos entradas no se pisen:

- Si `e.cursoEscolar` viene vacío (índice de contrato 1): con su nombre original, como hoy.
- Si el nombre **lleva escrito** un curso, es el mismo que `e.cursoEscolar`, **y** ninguna otra
  entrada elegida de `personal` tiene ese mismo `fichero`: con su nombre original, como hoy.
- En cualquier otro caso (el nombre no lleva curso, lleva otro, o se repite): se guarda como
  `RelPerCen <cursoEscolar>.csv` si `ambito` es `docentes`, `RelPerCenNodocente <cursoEscolar>.csv`
  si es `no-docentes`, y `RelPerCenTodo <cursoEscolar>.csv` si viene vacío (todo el personal).

«Lleva escrito un curso» no es lo que devuelve hoy `cursoDelFichero`, que sin curso en el nombre
contesta el curso de hoy: un `RelPerCen.csv` guardado así se leería en septiembre como del curso
siguiente. Hace falta saber si el curso salió del nombre o se supuso. Saca esa parte de
`js/datos-personal.js` a donde las dos puedan usarla; no la copies.

`fechaDelGestor` tiene que mirar el mismo nombre con el que se guarda.

### 4. La carpeta de mentira y los documentos

- `js/demo/datos.js`: el índice de la carpeta `gestor-centro-de-datos` pasa a contrato 2, con
  `cursoActual`, `ocupado: false`, y **dos** entradas de `personal` (docentes y no docentes del
  curso actual) además de lo que ya tenía.
- `docs/BEBER-DEL-CENTRO-DE-DATOS.md`: en el apartado de la copia del contrato, una línea que diga
  que la copia vigente es este documento. No lo reescribas.
- `js/novedades.js`: una línea, en el mismo commit del código: «El gestor ya distingue el personal
  docente del no docente y los cursos cuando trae los datos del Centro de datos.»

## Ficheros que se tocan (lista completa)

`js/centro-de-datos.js`, `js/centro-de-datos-reparto.js`, `js/centro-de-datos-ver.js`,
`js/datos-personal.js` (solo para compartir `cursoDelFichero`), `js/demo/datos.js`,
`js/novedades.js`, `pruebas/centro-de-datos.mjs`, y lo que salga del `grep` del apartado 1.
Documentos: `docs/CONTEXTO-CORTO.md` (sustituyendo; está al borde de su tope),
`docs/BEBER-DEL-CENTRO-DE-DATOS.md`, `docs/HISTORIA.md`.

**No tocar** `js/carpetas.js` ni `js/nucleo.js`. Ningún fichero de `js/` pasa de 600 líneas.

## Cómo sabemos que está bien

En `pruebas/centro-de-datos.mjs`, con la carpeta de mentira:

1. Con un índice de **contrato 1** como el de la fila 312, todo lo que ya comprobaba esa prueba
   sigue igual.
2. Con `contrato: 2` ya no sale «El Centro de datos es más nuevo que esta aplicación» y se toma lo
   que toca. Con `contrato: 3`, sale y no se toca nada.
3. Con `ocupado: true`: no se copia nada, no hay aviso ámbar, y el bloque de Ajustes dice la frase
   gris. Al pasar a `false`, se toma.
4. `personal` con tres entradas (26-27 docentes, 26-27 no docentes, 25-26 docentes): quedan **tres**
   ficheros en `_GESTOR/datos` y `Datos` ve a las personas de los tres.
5. Dos entradas de `personal` con el mismo `fichero` (`RelPerCen.csv`) y distinto `ambito`
   (`docentes` y vacío), del mismo curso: quedan `RelPerCen 26-27.csv` y `RelPerCenTodo 26-27.csv`,
   y ninguno pisa al otro.
5b. Una entrada con `fichero: "RelPerCen.csv"` y `cursoEscolar` igual al curso de hoy se guarda
   como `RelPerCen <curso>.csv`, no como `RelPerCen.csv`.
6. Una entrada de `personal` con `fichero: "RelPerCen.csv"` y `cursoEscolar: "25-26"` se guarda
   como `RelPerCen 25-26.csv`, y `datos-personal.js` la lee como de 25-26.
7. `tutorias` con una entrada de 25-26 y otra de 26-27 (`cursoActual: "26-27"`): solo se copia la
   de 26-27. Con solo la de 25-26: no se copia ninguna.
8. `consejo-escolar` con `periodo` `2022-2024` y `2024-2026`: entran los dos, cada uno en su
   fichero, como si se hubieran añadido a mano.
9. `registro-entrada` con una entrada de 25-26 y otra de 26-27: solo se sube la de 26-27.
9b. Con los apuntes que dejó la fila 312 (`registro-entrada|`, `personal|26-27`) y el mismo índice
   pasado a contrato 2 **sin cambiar huellas** (ahora `registro-entrada` tiene `variante: "26-27"`
   y `personal`, `26-27/docentes`): no se toma nada y no sale ningún aviso verde.
10. Dos entradas de `alumnado`: no se copia ninguna y sale el aviso ámbar.
11. Una entrada con `porAlumno: true` y otra de clave `censo-neae` no hacen nada y no dan error.
12. Con `contrato: 2` u `ocupado: true` en el índice, los datos del centro de
    `configuracion.json` (fila 313) se siguen leyendo.
13. `npm test -- centro-de-datos personal tablas control-registro` en verde.

Para el revisor, en la copia de pruebas (su carpeta de mentira ya es de contrato 2): al entrar no
sale ningún aviso ámbar que nombre el Centro de datos, y el bloque del Centro de datos de Ajustes →
Este ordenador sigue diciendo de cuándo son los datos, sin la frase «es más nuevo que esta
aplicación».

**[SOLO FRANCISCO]** (a `docs/COMPROBAR-A-MANO.md`): cuando el Centro de datos haya terminado de
recolocar (su fila 7), señalar la carpeta «CENTRO DE DATOS» en Ajustes → Este ordenador y ver que
el aviso verde trae el personal docente y el no docente.
