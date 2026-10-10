# La fecha real del listado de matrícula

Fila 324 de `docs/COLA.md` (si en la tabla lleva otro número, vale el de la tabla). Diseñada con
Francisco el 11-oct-2026. Lee antes `docs/CONTEXTO.md` y `docs/contexto/PERSONAS.md` (apartados «El
alumnado de la base de datos…» y «Lo que tengo ahora»).

## Qué quiere Francisco

En un ordenador que no tiene señalada la carpeta de la base de datos de alumnado, la «Comprobación
al entrar» dice a veces que la copia del alumnado es más vieja que el listado de matrícula, y no es
verdad. Para saber cuál es más nuevo, el gestor mira **el día en que `RegAlum.csv` se copió a
`_GESTOR/datos`**, no el día en que ese listado salió de Séneca. Un listado antiguo copiado hoy
parece nuevo. Cuando la ficha la haga el Centro de datos (plan del núcleo, fila 323), el listado se
copiará siempre después de hecha la ficha y el aviso falso saldría siempre.

La misma comparación está en tres sitios, y se arregla en los tres:

1. La fila «Base de datos de alumnado» de la «Comprobación al entrar» (`js/comprobacion-entrada.js`,
   función `alumnado`, el caso «sin carpeta pero con copia»).
2. La regla «la base de datos manda si no es más vieja que el RegAlum» (`AlumnadoBD.unir` en
   `js/alumnado-bd.js`; la fecha se la pasa `js/datos-alumnado.js`). Decide de quién son
   «matriculado», la unidad y las columnas que se llaman igual.
3. El aviso de fichero de alumnado viejo (`js/frescura.js`, `mirarElRegAlum`), que cuenta los días
   desde la copia.

**Decidido por Francisco:**

1. Se compara con la **fecha real** del listado: la que el gestor apunta desde la fila 319 en
   `_GESTOR/datos-origen.json` (`fechaOriginal`) y enseña en «Lo que tengo ahora».
2. **Si no hay fecha real apuntada** (listados traídos antes de la fila 319, o un apunte que ya no
   vale), **no se avisa y manda la base de datos de alumnado**. El caso desaparece solo la próxima
   vez que se traiga un listado.
3. Si la copia es más vieja **de verdad**, la fila de la comprobación dice **las dos fechas y quién
   actualiza los datos**. Ya no dice «Hay que traerla de nuevo desde el otro ordenador».
4. El aviso de fichero de alumnado viejo cuenta los días desde la fecha real. Francisco sabe que
   puede salirle donde hoy no sale, y que será correcto.

## Qué hay que hacer

Cambios quirúrgicos. Ficheros de código que se tocan: `js/datos-que-tengo.js`,
`js/comprobacion-entrada.js`, `js/datos-alumnado.js`, `js/frescura.js`, `js/novedades.js`,
`js/version.js` y lo que haga falta dentro de `js/demo/`. `js/alumnado-bd.js` solo si hace falta
para la frase (apartado 2). Nada más.

### 1. Una sola función que dice la fecha real

En `js/datos-que-tengo.js`, función nueva (mira antes que el nombre esté libre; por ejemplo
`DatosQueTengo.fechaReal(nombre)`):

- Devuelve los milisegundos de `fechaOriginal` del apunte de ese fichero **solo si el apunte sigue
  valiendo** (la misma regla de `vale`: la `marca` coincide con la fecha de la copia, con el margen
  de siempre). Si no hay apunte, no vale o no trae `fechaOriginal`, devuelve `0`.
- **No puede llamar a `estado()` ni a `Datos.cargar`**: la va a usar la propia carga del alumnado y
  entraría en bucle. Solo `leerApuntes()` y `Carpetas.fechaFichero`.
- Nunca lanza: ante cualquier fallo, `0`.

Los tres sitios la usan. **Ninguno vuelve a leer la fecha de la copia para comparar.**

### 2. La comprobación al entrar

En `alumnado()` de `js/comprobacion-entrada.js`, caso «sin carpeta pero con copia»:

- `reg` pasa a ser `DatosQueTengo.fechaReal('RegAlum.csv')`.
- Con `reg` a `0`: la fila sale bien, «Se usa la copia que hay guardada.», como hoy cuando no avisa.
- Con `generado` anterior a `reg`: la fila sigue en `falta` y en ámbar, con el mismo «Arreglarlo».
  Frase nueva, con las dos fechas en el formato de «Lo que tengo ahora» (`DatosQueTengo.fechaHora`):

  | Quién hace la ficha (`AlumnadoBD.hechoPor`) | Frase |
  |---|---|
  | La base de datos de alumnado (hoy, y cualquier otro `origen`) | «La copia de la base de datos de alumnado es del 3-oct-2026 · 10:30 y el listado de matrícula, del 8-oct-2026 · 09:15: la copia es más vieja. Hay que pulsar «Actualizar los datos» en la base de datos de alumnado y entrar en el gestor desde el ordenador que la trae.» |
  | El Centro de datos (`origen: "centro-de-datos-ies"`) | «La copia del alumnado que hace el Centro de datos es del 3-oct-2026 · 10:30 y el listado de matrícula, del 8-oct-2026 · 09:15: la copia es más vieja. Hay que subir ese listado al Centro de datos: él hace la copia nueva.» |

  Ajusta las palabras a `docs/VOCABULARIO.md` si alguna choca; lo que no puede faltar son las dos
  fechas y quién actualiza. Las demás ramas de `alumnado()` no se tocan.

### 3. Quién manda al unir

En `js/datos-alumnado.js` (línea 204 de hoy), `fechaRegAlum` deja de ser el `lastModified` de la
copia: es `DatosQueTengo.fechaReal(<nombre del fichero que se ha cargado>)` convertido a fecha, o
`null` si da `0` o no existe `DatosQueTengo`. `AlumnadoBD.unir` **no cambia de firma ni de regla**:
con `null` ya manda la base de datos, que es lo decidido.

### 4. El aviso de fichero viejo

En `mirarElRegAlum` de `js/frescura.js`: `cuando` es la fecha real del fichero elegido si
`DatosQueTengo.fechaReal` la da; si da `0`, el `lastModified` de siempre (aquí sin fecha real **no**
cambia nada: se sigue contando desde la copia). `mirarElFichero` no se toca.

### 5. La copia de demostración

Parámetro nuevo en `js/demo/` (por ejemplo `copiaalumnado=`), para que el revisor vea los tres
casos sin tocar nada. En los tres, este ordenador **no** tiene señalada la carpeta de la base de
datos de alumnado y hay una copia válida de `ALUMNADO-BD.json`, hecha hace 5 días:

- `copiaalumnado=aldia`: `RegAlum.csv` copiado hoy, con apunte válido y `fechaOriginal` de hace 10
  días. Es el aviso falso de hoy: tiene que salir bien.
- `copiaalumnado=vieja`: `RegAlum.csv` con apunte válido y `fechaOriginal` de ayer.
- `copiaalumnado=sinfecha`: `RegAlum.csv` copiado hoy y sin apunte.

Sin el parámetro, la demostración queda **exactamente** como hoy. Apúntalo en
`docs/COPIA-DE-PRUEBAS.md`.

### 6. Pruebas

Prueba nueva `pruebas/fecha-real-del-listado.mjs`, con datos inventados:

1. `fechaReal`: con apunte válido da su `fechaOriginal`; sin apunte, con la `marca` que ya no
   coincide o sin `fechaOriginal`, da `0`; no llama a `Datos.cargar`.
2. Comprobación al entrar, sin carpeta y con copia: los tres casos del apartado 5 (bien, `falta`
   con las dos fechas, bien). Y la frase del Centro de datos con `origen: "centro-de-datos-ies"`.
3. Carga del alumnado: con el listado copiado hoy pero de fecha real anterior a `generado`,
   `bd.manda` es `true` (hoy sale `false`); con fecha real posterior, `false`; sin apunte, `true`.
4. Frescura, **sin copia de la base de datos** (si la hay y es más reciente, cuenta su fecha, como
   hoy): con fecha real de hace 40 días y el listado copiado hoy, los días son 40; sin apunte, 0.
   Esto solo lo mira la prueba: el revisor no lo pasa.

Las pruebas de antes que montan un `RegAlum.csv` sin apunte siguen igual, salvo las que esperaban
que la fecha de la copia quitara el mando a la base de datos: esas se ponen al día y se dice en la
nota de la fila. La de `AlumnadoBD.unir` con fecha explícita (`pruebas/alumnado-desde-la-bd.mjs`) no
debe cambiar.

### 7. Novedades y documentos

- `js/novedades.js`: una línea **corta** al principio, en el mismo commit del código (la prueba
  `novedades` falla si es larga). Por ejemplo: «El aviso de alumnado viejo mira ya la fecha real del
  listado, no el día en que se copió.»
- `docs/CONTEXTO-CORTO.md`, sección 6, una regla nueva (sustituyendo, sin pasar de 40.000
  caracteres): para saber de cuándo es un fichero de datos se usa `DatosQueTengo.fechaReal`, nunca
  la fecha de su copia. De paso, su sección 1 dice todavía que el repositorio es «privado»: es público.
- `docs/contexto/PERSONAS.md` (línea «Frescura» y apartado de «Lo que tengo ahora»),
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (la prueba nueva), `docs/HISTORIA.md`.
- `docs/ACUERDO-ALUMNADO.md`: solo si dice con qué fecha se compara; si lo cambias, dilo en la nota
  de la fila, porque vive idéntico en `bd-alumnado-ies`.

## No se hace en esta fila

- `js/centro-de-datos-reparto.js` (líneas 50-59) también mira la fecha de la copia, para decidir si
  trae un listado del Centro de datos. Es otra pregunta y no se toca.
- Cambiar la regla de `AlumnadoBD.unir`, las demás filas de la comprobación al entrar, o lo que
  enseña «Lo que tengo ahora».
- Apuntar fechas a los listados que ya están sin apunte.

## Cuidado

- **El repositorio es público.** Ni un nombre real, ni un número de identificación real, ni
  direcciones, en el código, las pruebas, los documentos, los commits ni la nota de la cola.
- Sigue `CLAUDE.md`: rama `fila-324`, revisor en local y, con su APROBADA, a `main`. Mientras
  programas, `npm test -- fecha-real comprobacion alumnado datos-que-tengo ajustes-agil novedades`;
  la pasada completa, **una sola vez**, antes de fusionar. `App.VERSION` con la hora del reloj.
  `docs/ESTIMACIONES.md` en la subida de EN CURSO. `docs/COLA.md` por debajo de 40 KB.
- `EN_SOLITARIO` está en su tope de 20: la prueba nueva tiene que esperar a condiciones, no a pausas.
- Ningún fichero de `js/` pasa de 600 líneas. No preguntes nada: decide y apúntalo en la nota.

## Qué decirle a Francisco al terminar

En tres frases. Que el gestor ya compara con la fecha en que el listado salió de Séneca, en la
comprobación al entrar, al decidir qué datos mandan y en el aviso de alumnado viejo. Que el aviso
falso de «la copia es más vieja» ya no sale. Y que el aviso de alumnado viejo puede salirle ahora
donde antes no salía, y que entonces es verdad.

## Cómo sabemos que está bien

1. Abrir `?demo=1&auto=1&copiaalumnado=aldia`. Pulsar la marca de la barra lateral que abre la
   «Comprobación al entrar». La fila «Base de datos de alumnado» sale bien y dice «Se usa la copia
   que hay guardada.». No se lee «más vieja» en ningún sitio del panel.
2. Con esa misma dirección, ir a Herramientas y abrir «Traer el alumnado». En «Lo que tengo ahora»,
   la fecha de «Alumnado de Séneca» es anterior a la de «Alumnado de la base de datos».
3. Abrir `?demo=1&auto=1&copiaalumnado=vieja` y abrir la «Comprobación al entrar». La fila «Base de
   datos de alumnado» sale en ámbar, con «Arreglarlo». Su frase trae dos fechas con día y hora,
   dice que la copia es más vieja y nombra «Actualizar los datos». No dice «desde el otro ordenador».
4. Con esa misma dirección, comparar las dos fechas de la frase con las de «Lo que tengo ahora»
   (Herramientas → «Traer el alumnado»): son las mismas.
5. Abrir `?demo=1&auto=1&copiaalumnado=sinfecha` y abrir la «Comprobación al entrar». La fila «Base
   de datos de alumnado» sale bien, sin la palabra «vieja».
6. Con esa misma dirección, ir a Personas y empresas y abrir la ficha de un alumno: se abre sin
   error, con sus tarjetas.
7. Abrir `?demo=1&auto=1`, sin el parámetro nuevo. La «Comprobación al entrar» dice lo mismo que
   antes de este cambio en todas sus filas.
