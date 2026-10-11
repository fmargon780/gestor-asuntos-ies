# Tablas para estadísticas y cruces

Fila 334 de `docs/COLA.md` (si en la tabla lleva otro número, vale el de la tabla). Diseñada con
Francisco el 11-oct-2026. Lee antes `docs/PLAN-DATOS-DEL-GESTOR.md` (es corto), `docs/CONTEXTO.md`
y, de `docs/contexto/`, `ASUNTOS-ARCHIVO.md` (el índice del ARCHIVO y la ficha en su carpeta),
`PERSONAS.md` (cómo se reconoce a cada persona) y `NOMBRES-FIJOS.md` (los datos del documento en la
ficha).

## Qué quiere Francisco

Poder relacionar la información de los asuntos y sacar estadísticas «como las que daría un gestor
de bases de datos profesional». Hoy no se puede (plan, apartado 4): los hitos de un asunto
archivado están dentro de su carpeta, las personas se enlazan por el texto de su nombre y los
campos propios se guardan como texto corrido.

**Decidido por Francisco:**

1. Las carpetas y los ficheros de hoy **se quedan como están**. Las tablas son un duplicado
   ordenado, que se puede rehacer entero desde las carpetas.
2. Cuatro tablas: **asuntos, hitos, personas de cada asunto y documentos**.
3. **Cada persona lleva un código fijo.**
4. **Entra también lo ya archivado.**
5. En pantalla no cambia nada todavía: es la base de los informes que pida después.

## Cómo es por dentro (decidido en la conversación, sin pregunta)

Todo vive en `_GESTOR/base/` (siempre a través de `App.E.gestor`, nunca con el nombre escrito).

### Los apuntes

- `base/<curso>/<AAAA-MM>-<ordenador>.jsonl`. **Un fichero por curso, mes y ordenador.** Texto, una
  línea por apunte, cada línea un JSON entero sin saltos dentro. `<curso>` es el mismo en que el
  índice del ARCHIVO guarda esa entrada (`IndiceArchivo`). `<AAAA-MM>` es el mes en que se escribe
  la línea. `<ordenador>` es `U.ordenador()` (plan, regla 5.2).
- **Cada ordenador escribe solo sus ficheros, y solo añadiendo líneas al final.** Así no puede
  haber copias en conflicto y nunca se reescribe un fichero grande.
- Tres clases de línea:

      {"v":1,"que":"alta","cuando":"<ISO>","ordenador":"…","clave":"<nombre de la carpeta>","marca":"…",
       "asunto":{…},"hitos":[…],"personas":[…],"documentos":[…]}
      {"v":1,"que":"baja","cuando":"<ISO>","ordenador":"…","clave":"<nombre de la carpeta>"}
      {"v":1,"que":"equivale","cuando":"<ISO>","ordenador":"…","de":"<código viejo>","a":"<código nuevo>"}

- `marca` es `cerradoEl + '|' + tercero`, tal como están en la entrada del índice. Sirve para
  saber si un apunte sigue al día sin abrir la carpeta.
- Al leer, **gana la línea más reciente de cada `clave`** (`cuando`), venga del fichero que
  venga. Una `baja` más reciente que su `alta` la quita. Una línea que no se puede leer se salta.
  Se leen todos los `.jsonl` de la carpeta, se llamen como se llamen (también una copia en
  conflicto, si algún día apareciera).

### Lo que lleva un alta

- `asunto`: `id` (el número `A26-0137` si lo tiene; si no, la `clave`), `clave`, `numero`, `tipo`,
  `categoria`, `organo` (quién encarga ese tipo, `js/tipos-organo.js`, el de hoy), `persona` (el
  código del tercero), `curso`, `grupo`, `abiertoEl`, `cerradoEl`, `dias` (naturales entre los
  dos), `via`, `loPideCategoria`, `loPideRelacion`, `terminado`, `seQuedoEn`, `reservado`,
  `deGrupo`, `incompleto`, y `campos`: una lista `{ nombre, clase, valor }` con el valor **tal como
  se guarda** (número, fecha ISO o texto; `js/campos-clases.js`), no como se enseña.
- `hitos`: una fila por hito, en el orden en que se ven, con los de la rama elegida de una
  pregunta detrás de ella: `asunto` (su `id`), `orden`, `id`, `titulo`, `origen` (`origenGuia`),
  `clase`, `estado`, `desde`, `hechoEl`, `fecha` (la límite), `dias` (naturales de `desde` a
  `hechoEl`, o vacío), `responsable`, `sinRespuesta`, `elegida` (el texto de la opción, en las
  preguntas) y `documentos` (cuántos lleva apuntados).
- `personas`: `asunto`, `codigo`, `papel` (`tercero`, `relacionado`, `lo-pide` o `grupo`) y
  `categoria`. El tercero siempre; los de `ficha.relacionados`; quien lo pide, si es una persona
  de las listas.
- `documentos`: `asunto`, `nombre`, `numero`, `tipo`, `fecha`, `registros` (los códigos), `hito`.
  Salen de `ficha.documentos` (`DocumentosDatos`) y, para los de antes de la fila 239, de los
  nombres que ya guarda la entrada del índice.
- **No van** el texto de las notas ni el de los correos: siguen en la ficha.

### El código de una persona

- `Base.codigoDe(categoria, nombre)` devuelve `P-` y los doce primeros caracteres en hexadecimal
  del SHA-256 (`crypto.subtle`, como ya hace `js/actualizar-copia.js`) de
  `categoria + '|' + clase + '|' + valor`.
- `clase` y `valor` son lo primero que haya, por este orden: el Nº de identificación escolar
  (alumnado); el NIF (empresas); el código o `id` (Administraciones y centros); el nombre reducido
  con `U.hueso` más los cuatro caracteres del documento (personal y tutores legales, que es lo que
  lleva el nombre de su carpeta); y, si no hay nada de eso, el nombre reducido con `U.hueso`. Usa
  las funciones que ya separan el nombre de su código (`docs/contexto/PERSONAS.md`); para un
  relacionado o un «lo pide», que solo traen `categoria + nombre`, búscalo antes en las listas
  cargadas para dar con su identificador.
- Los dos ordenadores calculan el mismo código sin ponerse de acuerdo. **No es un secreto**: solo
  evita que el DNI o el Nº escolar aparezcan en las tablas.
- `base/personas-<ordenador>.jsonl`: una línea `{ v, cuando, codigo, categoria, nombre, clase }`
  la primera vez que este ordenador usa un código, o cuando cambia su nombre. Al leer, la más
  reciente de cada código. Es el diccionario para enseñar el nombre de un código.
- Cuando una persona cambia de identificador o de nombre (`IndiceArchivo.cambiarTercero`, un
  aspirante al que se le escribe el Nº escolar), se añade una línea `equivale` del código viejo al
  nuevo. Al leer, los códigos viejos se cambian por el nuevo en todas las filas.

### Una sola manera de apuntar: `Base.ponerAlDia`

`Base.ponerAlDia({ claves })` (sin `claves`, todo):

1. Lee el índice del ARCHIVO de todos los cursos (`IndiceArchivo.leerDisco({ todos: true })`) y
   lo ya apuntado.
2. Para cada asunto archivado sin apunte, o con la `marca` distinta: localiza su carpeta
   (`IndiceArchivo.resolverHandle`), lee su `_ficha.json` (`FichaArchivo.leer`) y los hitos del
   final de su «HISTORIAL DE TRAMITACION.txt» (hoy `Hitos._leerHitosDeHistorial`: dale nombre de
   función normal), y añade su `alta`. Si falta alguno de los dos ficheros, el alta lleva lo que
   da la entrada del índice y `incompleto: true`.
3. Para cada `clave` apuntada que ya no está en el índice: una `baja`.
4. Escribe en tandas de 50 líneas como mucho, pasando por `ColaGuardado.poner` con el nombre del
   fichero. Entre tanda y tanda cede el paso (`setTimeout`) y, si hay un guardado en marcha,
   espera. Se puede cortar en cualquier momento: lo escrito vale y la siguiente pasada sigue.

Nunca corre en «solo consultar» ni con perfil directivo. Mientras corre, un fichero
`base/poniendo-al-dia-<ordenador>.json` con la hora; si hay uno **de otro ordenador** de menos de
30 minutos, la pasada completa no arranca (la de unas `claves` concretas, sí).

Cuándo se llama:

- Una línea al final de `anadirEntradaYa`, `quitarEntradaYa` y `cambiarTerceroYa` de
  `js/archivo-indice.js`: `if (window.Base) Base.avisar(clave)`. `Base.avisar` junta las claves y,
  cinco segundos después, llama a `ponerAlDia({ claves })`. En `cambiarTercero`, además, la línea
  `equivale`. **Nada de esto puede hacer fallar ni esperar a quien archiva**: va suelto y dentro de `try`.
- Una vez al día en cada ordenador (marca en `localStorage`), 90 segundos después de entrar: la
  pasada completa. La primera vez es la que apunta todo lo archivado hasta hoy.
- El botón de la tarjeta (abajo).

### Leer

`Base.leer({ cursos, conAbiertos })` devuelve `{ asuntos, hitos, personas, documentos, gente }`:
cuatro listas planas y el diccionario de códigos. `cursos` es una lista o `'todos'`. Con
`conAbiertos`, añade los asuntos abiertos, montados **con la misma función** que monta un alta
(`Base.filasDe(ficha, hitos, entrada)`), desde la memoria y con `abierto: true`. Una regla, un sitio.

Nadie la usa todavía en pantalla: la usan las pruebas y la usarán los informes.

### Que se vea desde fuera si funciona

Si existe `Medidas` (fila 332), la pasada completa apunta `Medidas.tiempo('base.poner-al-dia')` y,
al acabar, deja en la foto del día `apuntados`, `archivados` e `incompletos` (tres números). Así
Claude ve en las medidas si en el centro se ha apuntado todo, sin pedirle a Francisco que lo mire.
Añade esos rótulos a la lista fija de `js/medidas.js`.

## Qué hay que hacer

Cambios quirúrgicos. No leas el repositorio entero. Ficheros que se tocan:

- Nuevos: `js/base.js` (leer y escribir los apuntes), `js/base-filas.js` (montar las filas y el
  código de persona), `js/base-poner-al-dia.js`, `js/base-pantalla.js`, `pruebas/base.mjs`.
- Una o dos líneas: `js/archivo-indice.js` (los tres avisos), `js/hitos-archivo.js` (el nombre de
  la función que lee los hitos del historial), `js/nucleo.js` o el punto previsto que ya haya para
  «después de entrar» (`window.Gestor`), `js/ajustes-reparto.js` (la tarjeta), `js/util.js`
  (`U.ordenador`, si la fila 332 no la ha dejado ya), `js/medidas.js` solo si existe (el rótulo de fichero `base` y los
  de «Que se vea desde fuera»), `index.html`, `js/novedades.js`, `js/version.js`, y lo que haga falta en
  `js/demo/` para que la demostración tenga asuntos archivados con hitos.

### La tarjeta

En Herramientas → «Puesta a punto y reparaciones», una tarjeta plegada, «Tablas para informes»:

- «Asuntos archivados apuntados: N de M.» (M, los del índice.) Si faltan: «Faltan K. Se apuntan
  solos, poco a poco.»
- «Última puesta al día: <fecha y hora>, en este ordenador.»
- Un botón «Poner al día ahora», con una barra mientras trabaja, y al acabar «Apuntados N asuntos.»
- Si alguno quedó `incompleto`: «K asuntos antiguos no tienen guardados sus hitos: se han apuntado
  con lo que hay.»

Ajusta las palabras a `docs/VOCABULARIO.md`. Aprovecha el ancho.

### Pruebas (`pruebas/base.mjs`)

Con datos inventados:

1. Archivar un asunto con tres hitos hechos, un relacionado, un campo de importe y dos documentos:
   a los pocos segundos `Base.leer` lo devuelve con una fila de asunto, tres de hitos con sus
   `dias`, dos de personas con códigos distintos, dos de documentos, y el importe como número.
2. Reabrirlo: desaparece de lo archivado y sale con `abierto: true` si se pide `conAbiertos`.
   Mandarlo a la papelera y devolverlo: baja y alta.
3. El mismo alumno como tercero de dos asuntos, y como relacionado de un tercero: un solo código.
4. Dos «ordenadores» (dos identificadores) apuntando el mismo asunto: se lee una sola vez, la más
   reciente. Una línea rota en medio de un fichero no impide leer las demás.
5. Cambiar el nombre de un tercero archivado: sus asuntos salen con el código nuevo, también los
   apuntados antes.
6. `ponerAlDia` completa con 300 asuntos archivados inventados, cortada a la mitad y vuelta a
   lanzar: acaba con 300, sin repetir, y una tercera pasada no escribe nada.
7. Un archivado sin `_ficha.json` ni historial: se apunta con `incompleto`.
8. En «solo consultar» no se escribe nada en `base/`. Con un guardado en marcha, espera.
9. Archivar sigue tardando lo mismo: la llamada a `App.cerrarAsunto` no espera a las tablas.
10. Ningún fichero de `base/` se reescribe entero al archivar: el del mes solo crece por el final.

### Documentos

- `js/novedades.js`: una línea corta. Por ejemplo: «Los asuntos archivados se apuntan ya en unas
  tablas, para los informes que vengan (Herramientas → Puesta a punto).»
- `docs/CONTEXTO.md`, tabla «Lo que la aplicación guarda en `_GESTOR`»: la fila de `base/`, «fuera
  de los diecinueve: sin copia de seguridad ni fusión, se rehace con Poner al día».
- `docs/contexto/ASUNTOS-ARCHIVO.md` (un apartado con todo lo de arriba, en presente),
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/CONTEXTO-CORTO.md` (una línea en la sección 5
  y una regla en la 6: «para una estadística o un cruce de asuntos archivados se usa `Base.leer`,
  no se abre carpeta por carpeta»; regla 5.6 del plan), `docs/HISTORIA.md`.
- `docs/LOS-DATOS-DEL-CENTRO.md`: la carpeta `base` entre los ficheros con datos personales.

## No se hace en esta fila

- Ninguna pantalla de estadísticas, ningún informe nuevo y ninguna exportación.
- Cambiar «Cuentas», el índice del ARCHIVO, `_ficha.json` o el historial de hitos.
- Apuntar las notas o los correos.
- Dar código a las personas de las listas que no salen en ningún asunto.

## Cuidado

- **El repositorio es público.** Todo dato de las pruebas y de la demostración, inventado.
- Sigue `CLAUDE.md`: rama `fila-334`, revisor en local y, con su APROBADA, a `main`; una sola
  publicación. Mientras programas, `npm test -- base archiv indice papelera hitos-archivo
  tercero novedades scripts`; la pasada completa, una sola vez, antes de fusionar.
- La primera pasada completa, con miles de carpetas de verdad, puede tardar minutos. Por eso va
  en tandas y cede el paso. No la conviertas en una sola lectura de todo.
- `js/archivo-indice.js`: comprueba cuántas líneas tiene antes de tocarlo; si tu cambio lo acerca
  a 600, no añadas más de las tres líneas.
- `EN_SOLITARIO` está en su tope: la prueba nueva espera a condiciones, no a pausas.
- No preguntes nada: decide y apúntalo en la nota de la fila.

## Qué decirle a Francisco al terminar

En tres frases. Que cada asunto que se archiva queda ya apuntado en las tablas, con sus hitos, sus
personas y sus documentos, y cada persona con su código. Que lo archivado hasta hoy se irá
apuntando solo y puede verlo en Herramientas → Puesta a punto → «Tablas para informes». Y que en
el resto de la pantalla no cambia nada: es la base para el primer informe que pida.

## Cómo sabemos que está bien

1. Abrir `?demo=1&auto=1`. Ir a Herramientas → «Puesta a punto y reparaciones» y desplegar «Tablas
   para informes». Se lee «Asuntos archivados apuntados: N de M» con un botón «Poner al día ahora».
2. Pulsar «Poner al día ahora». Sale una barra y, al acabar, «Apuntados N asuntos.». La primera
   línea dice ahora que están apuntados todos (los dos números son iguales).
3. Ir a Inicio y archivar un asunto. Se archiva igual que siempre, con su aviso de siempre. Volver
   a la tarjeta: los dos números han subido en uno, sin pulsar nada.
4. Ir a Archivo, abrir ese asunto y reabrirlo. Volver a la tarjeta: los dos números han bajado en uno.
5. Pulsar «Poner al día ahora» otra vez. Acaba enseguida y los números no cambian.
6. Ir a Cuentas. Se ve igual que antes de este cambio, con sus mismas cifras.
7. Ir a Archivo y buscar un asunto por el nombre de su tercero. Sale como siempre.
