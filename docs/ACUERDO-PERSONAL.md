# Acuerdo con el Centro de datos: los datos ya hechos y el personal

Copia **tal cual** de dos secciones de `docs/CONTRATO.md` de `fmargon780/centro-de-datos-ies`
(«Los datos ya hechos» y «El conjunto `personal`»), tomada el 11-oct-2026 de su commit `fe869dc`
(CD v23). El dueño de este texto es el Centro de datos: aquí **no se corrige**. Si allí cambia, se
vuelve a copiar entero. Lo que el Gestor hace con ello está en
`docs/PERSONAL-DEL-CENTRO-DE-DATOS.md` (fila 327).

Del conjunto `alumnado` el Gestor no lee las partes: coge `ALUMNADO-BD.json` (fila 323). Del
conjunto `personal` coge **todas** las partes `curso`, de todos los cursos.

---

## Los datos ya hechos

Además de guardar los ficheros tal como llegan, el Centro de datos los abre y deja **datos ya hechos**
para las demás aplicaciones. Se añade todo (carpeta, campos de `indice.json` y claves): el contrato
sigue en **2** y quien no lo conoce lo ignora. El plan completo está en `docs/PLAN-NUCLEO.md`; las
claves nuevas de la ficha y los tipos de aviso, en `docs/NUCLEO-CLAVES-EN-BRUTO.md` (aquí no se copian).

**La carpeta.** `hecho/estado.json` y `hecho/<conjunto>/` (`alumnado` y, desde CD v20, `personal`). Solo la escribe el
Centro de datos. **No se guardan versiones anteriores** de nada de `hecho/`: se puede volver a hacer.

**Las partes del alumnado.** Una parte `actuales` por curso escolar (`cursoEscolar: "26-27"`) en
`hecho/alumnado/<curso>/actuales.json`, tres como mucho: la del `cursoActual`, la del curso siguiente
(cuando `RegAlum` ya trae matrículas suyas) y, en septiembre y octubre (o mientras `RegAlum` no traiga
ninguna fila del actual), la del curso anterior. En una parte `actuales` está todo el que tiene fila de
ese curso, también con la matrícula anulada o trasladada; `matriculado` dice si lo está. Su ficha está
hecha **como si `RegAlum` acabara en ese curso**. Y una parte `antiguos` (`cursoEscolar: ""`) en
`hecho/alumnado/antiguos.json`: quien no está en ninguna de las anteriores, con `matriculado: false`.

**Cómo lee una aplicación un curso.** Coge la parte `actuales` de su curso. Los registros de las demás
partes son antiguos para ella. Un `id` que ya está en la `actuales` de su curso no se vuelve a coger de
otra; si sale en varias de las otras, vale la del curso más reciente. Si no hay `actuales` de su curso,
no hay ficha para ella: lo dice y sigue como estaba.

**Quien lee comprueba la `huella`** de lo que abre contra la de la entrada de `hechos` en el índice. Si
no coincide, no lo usa y lo intenta más tarde.

**`capacidades` y `hechos` en `indice.json`.** `capacidades` dice qué sabe hacer ya este Centro de datos
(`["hechos"]`). `hechos` lista las partes:

    { "conjunto": "alumnado", "parte": "actuales", "cursoEscolar": "26-27", "acuerdoHecho": 1,
      "ruta": "hecho/alumnado/26-27/actuales.json", "idDrive": "…", "hecho": "2026-10-12T08:10:00+02:00",
      "huella": "sha-256 en hexadecimal", "registros": 831, "bytes": 912345, "alDia": true,
      "fuentes": [ { "clave": "alumnado", "variante": "", "huella": "…" } ] }

`fuentes` dice de qué listados salió y con qué huella. `alDia` es `false` mientras alguna fuente ha
cambiado y la parte todavía no se ha rehecho: quien lee puede seguir usando la parte que hay y solo lo
dice («se está poniendo al día»). Con `ocupado: true` no se toma nada, como siempre.

**La forma de una parte.** `{ acuerdoHecho, conjunto, parte, cursoEscolar, generado, origen, campos,
registros, avisos }` y, a partir de la fila 15, `columnasMatricula`. `campos`: `clave`, `etiqueta`,
`apartado`, `tipo` (`texto`, `numero`, `fecha`, `si-no`, `lista`, `tabla` con `columnas`), `dueno` (el
repositorio de la aplicación dueña) y `fuente`. `registros`: `{ id, matriculado, datos }`; `id` es el
Nº de identificación escolar, y sin él no hay registro (va a `avisos`). Lo que no se sabe va ausente o
`null`, nunca «?». `avisos`: `{ tipo, id, datos }`, con `tipo` de una lista cerrada; llevan datos
personales y no salen de la carpeta.

**`hecho/estado.json`.** Lo escribe el Centro de datos en cada tanda que hace algo. Solo cifras y
palabras fijas, nunca un nombre ni un número de identificación:

    { "version": "CD v13", "cuando": "…",
      "conjuntos": [ { "conjunto": "alumnado", "pendiente": false, "atascado": false, "porLeer": 0, "tandasSinAvanzar": 0,
        "lectores": [ { "clave": "alumnado", "ficheros": 1, "segundos": 3 } ],
        "partes": [ { "parte": "actuales", "cursoEscolar": "26-27", "registros": 831, "segundos": 4, "alDia": true, "hecho": "…",
          "avisos": { "sinId": 0, "sinFicha": 0, "matriculaRepetida": 0, "matriculaModalidad": 0, "expedienteSinAlumno": 0,
            "expedienteAmbiguo": 0, "expedienteRepetido": 0, "expedienteIlegible": 0, "expedienteAviso": 0, "censoSinAlumno": 0,
            "censoEmpate": 0, "censoRepetida": 0, "censoFichero": 0, "personalSinId": 0, "personalEnDosListados": 0,
            "personalFichero": 0, "otros": 0 } } ] } ],
      "entregas": [] }

Desde CD v14 lleva además `comprobaciones` (`{ completo, resumen, lista }`; cada comprobación: `id`, `estado`, `cifras`,
`otros`, `ms`, `hechaCon`, `cuando`; formato en `comprobaciones/LEEME.md`) y `subida` (`{ estado, dia }`, con `estado` `bien`, `sin-permiso`,
`sin-red` o `todavia-no`). Se añade: el contrato sigue en 2.

Los dieciséis contadores de `avisos` y `otros` salen siempre, aunque valgan cero. Quien lee ignora lo que
no conoce: se podrán añadir campos, y ninguno de estos cambia de nombre.

## El conjunto `personal`

Desde CD v20 el Centro de datos abre también los listados de personal (docentes y no docentes) y deja
**una ficha por persona y curso**. Es solo añadir: el contrato sigue en **2** y `acuerdoHecho` en **1**.
El personal **no tiene entregas ni ficha completa**: solo partes. Lo que trae la ficha es lo que trae el
listado, sin corregir; la tutoría y el cargo de cada persona llegarán aparte.

**Las partes.** Una por cada curso escolar que tenga algún listado `personal` en el índice, con
`parte: "curso"`, `cursoEscolar: "26-27"` y ruta `hecho/personal/<curso>/curso.json`, para **todos los
cursos guardados**, también los antiguos. No hay `actuales` ni `antiguos`: quien no sale en los listados de
un curso no está en la parte de ese curso. Sus `fuentes` son las entradas `personal` del curso
(`<curso>/docentes`, `<curso>/no-docentes` y `<curso>`, que es «todo el personal»). Las entradas de
`hechos` llevan `conjunto: "personal"`; el alumnado no cambia de sitio ni de forma.

**Los registros.** `{ id, datos }`, **sin `matriculado`**. El `id` es el `DNI/Pasaporte` en mayúsculas y
sin espacios, puntos ni guiones; una fila sin documento no da registro (va a `avisos`). La misma persona
tiene el mismo `id` en todos los cursos. Si una persona sale varias veces en un curso, es un solo registro:
sus datos sueltos salen de la fila que manda (la última del listado subido más tarde) y todas sus filas
quedan en la tabla `puestos`. `tipoPersonal` vale `docente` o `no-docente`: lo dice el listado en que sale
y, si solo sale en «todo el personal», su puesto; si no se sabe, o si sale en un listado de docentes y en
uno de no docentes, la clave no se escribe.

**Cómo lee una aplicación.** Coge la parte del curso que quiere (`hechos` con `conjunto: "personal"` y ese
`cursoEscolar`) y comprueba su `huella`. Sin parte de ese curso, no hay ficha para ella.

**`columnasPersonal`.** Además de la forma de siempre, la parte lleva `columnasPersonal`: por cada listado
del curso (`docentes`, `no-docentes`, `todo`), los títulos de sus columnas tal como vienen.

**Los campos** (todos con `dueno: "centro-de-datos-ies"` y `fuente: "personal"`; una clave solo está si el
listado trae esa columna y la casilla no está vacía):

| Clave | Etiqueta | Tipo | De dónde sale |
|---|---|---|---|
| `empleado` | Empleado/a | texto | `Empleado/a`, tal cual |
| `apellidos`, `nombre` | Apellidos, Nombre | texto | Lo de antes y lo de después de la coma, solo si hay una sola |
| `documento` | DNI/Pasaporte | texto | `DNI/Pasaporte`, tal cual |
| `tipoPersonal` | Docente o no docente | texto | `docente` o `no-docente` |
| `puesto`, `especialidad`, `situacion` | Puesto, Especialidad, Situación | texto | Su columna |
| `fechaTomaPosesion`, `fechaCese` | Fechas | fecha | `AAAA-MM-DD`; una fecha que no se entiende no se escribe |
| `puestos` | Filas en los listados | tabla | Una línea por fila de la persona: `listado`, `puesto`, `fechaTomaPosesion`, `fechaCese` |
| `telefono`, `correo` | Teléfono, Correo electrónico | texto | `Teléfono`; `Correo` o `Correo electrónico` |
| `listados` | Listados en los que sale | lista | `docentes`, `no-docentes`, `todo` |
| `celdas` | Casillas del listado | tabla | Todas las casillas no vacías de la fila que manda: `columna` y `valor` |

**Los avisos** (lista cerrada): `personal-sin-id` (fila sin documento; `datos`: `empleado`, `puesto`,
`listado`), `personal-en-dos-listados` (lleva su `id`; `datos`: `empleado`) y `personal-fichero` (lo que un
fichero deja dicho al leerlo; `datos`: `listado` y `detalle`, una frase llana). Llevan datos personales y no
salen de la carpeta. En `hecho/estado.json` se cuentan con tres contadores nuevos: `personalSinId`,
`personalEnDosListados` y `personalFichero`.
