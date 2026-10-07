# Trabajo en bloque: formar el grupo pegando una lista (fila 296)

Cerrado con Francisco el 7-oct-2026. Cuarta de cuatro filas. **Va después de la 293**
(`docs/TRABAJO-EN-BLOQUE.md`); no depende de la 294 ni de la 295.

## Qué pasa hoy

Un grupo de personas se forma por unidad, por nivel, por enseñanza, con un grupo propio guardado, o
buscando y señalando una a una (`App.pintarBuscadorDeTercero` en modo `multiple`,
`js/relacionados.js`, `js/grupos.js`).

Hay grupos que no son ni una clase ni un nivel: los alumnos del transporte escolar, los que tienen
una materia pendiente, los de una actividad. Esos salen de un listado de Séneca o de una hoja de
cálculo, y hoy habría que buscarlos de uno en uno.

## Qué decidió Francisco

Se le propuso dejarlo fuera, por ser bastante más trabajo, salvo que tuviera casos reales. Su
respuesta: «Pues va a tener que ser la 2». **Entra**: poder pegar una lista sacada de Séneca o de
una hoja de cálculo, que la aplicación reconozca a cada persona y diga a quién no encuentra.

## Qué hay que hacer

### 1. Dónde sale

En el buscador de señalar varios, junto a los atajos de alumnado y «Meter un grupo entero», un
tercer camino: **«Pegar una lista»**. Como vive en el buscador, vale en los tres sitios que lo
usan sin hacer nada más: «Es para un grupo de personas» de Nuevo asunto (fila 293), «+ Añadir
personas» de un asunto y «Ver y cambiar los miembros» de un grupo propio en Ajustes.

### 2. El cuadro

- Un cuadro grande de texto: **«Pega aquí la lista: una persona por línea.»** Debajo, **«o elige
  un fichero»** (CSV o Excel), que se lee con lo que ya hay en `js/tablas-datos-leer.js` (`deCsv`,
  `deXlsx`) y con `js/cargar-fichero.js` para la codificación (los CSV de Séneca vienen en
  Latin-1).
- Lo pegado desde una hoja de cálculo trae las columnas separadas por tabulador; un CSV, por punto
  y coma o coma. Se parte igual que un fichero.
- La primera línea se salta si es una cabecera (ninguna de sus celdas se reconoce como persona y
  alguna dice «nombre», «alumno», «apellidos», «DNI», «NIE», «Nº», «identificación»…).
- Categoría en la que se busca: la que esté elegida en el buscador (Alumnado al entrar). Un
  desplegable deja cambiarla o poner «En todas».
- Botón **«Reconocer»**.

### 3. Cómo se reconoce cada línea

Por este orden, y parando en el primero que dé **una sola** persona:

1. **Nº de identificación escolar** (alumnado): cualquier celda que sea ese número.
2. **DNI o NIE** completo, con o sin letra, con o sin guiones ni espacios, contra el documento de
   la persona, de sus tutores (categoría Tutores legales) o del personal.
3. **Nombre**: se prueban las celdas sueltas y la unión de las que parecen nombre («Apellido1
   Apellido2, Nombre», «Nombre Apellido1 Apellido2», o apellidos y nombre en columnas distintas).
   Se compara sin tildes, sin mayúsculas, sin comas y sin importar el orden de las palabras
   (`U.normalizar`). Tiene que coincidir **el nombre entero**: una línea «García López» no elige a
   nadie si hay dos.
- En alumnado solo se busca entre los matriculados de este curso, como hacen los atajos. Si no
  aparece ahí pero sí entre los antiguos, la línea va a «dudosas» diciéndolo.
- Una persona repetida en dos líneas entra una sola vez.

Todo esto es una función sin efectos: `ListaPegada.reconocer(texto, personasPorCategoria,
categoria)` → `{ encontradas, dudosas, noEncontradas }`. Se prueba sola.

### 4. El resultado

En el mismo cuadro, tres apartados, cada uno con su cuenta:

- **«Reconocidas (41)»**: nombre de la persona tal como está en la aplicación y, en pequeño, la
  línea pegada de la que sale. Todas marcadas; se puede quitar la marca a cualquiera.
- **«Hay que elegir (3)»**, en ámbar: la línea pegada y sus candidatas (hasta cinco), con su
  unidad, para pulsar la buena. O «Ninguna».
- **«No encontradas (2)»**, en rojo: las líneas tal cual, con **«Copiar»** (para revisarlas en
  Séneca). No impiden seguir.

Botón **«Señalar las N»**: cierra el cuadro y las deja señaladas en el buscador, sumadas a las que
ya hubiera, con sus chips de siempre. A partir de ahí todo sigue como hoy («Usar los N señalados»,
«Añadir los N señalados»). Con las de «Hay que elegir» sin resolver, el botón avisa de cuántas se
quedan fuera y deja seguir.

### 5. Guardarla como grupo

En ese cuadro, una casilla sin marcar: **«Guardar también como grupo, con el nombre…»**. Marcada y
con nombre, al pulsar «Señalar las N» se crea además un grupo propio con esas personas
(`Grupos.guardar`), para volver a usarlo sin pegar otra vez. Si ya hay un grupo con ese nombre,
pregunta si lo sustituye.

Desde Nuevo asunto (fila 293), un grupo formado así tiene `origen: 'lista'` y su «Nombre del
grupo» sale relleno con el del grupo guardado, si se guardó; si no, vacío y obligatorio.

## Qué NO se toca

- Los atajos de alumnado, «Meter un grupo entero» y la búsqueda una a una.
- No se da de alta a nadie desde la lista: quien no está en la aplicación va a «No encontradas».
- No se guarda la lista pegada en ningún sitio: solo las personas reconocidas.
- Las Tablas de datos y sus huecos.

## Trampas

- Dos alumnos con el mismo nombre y apellidos existen. Por nombre, dos candidatos son siempre
  «Hay que elegir», nunca el primero.
- Un DNI con la letra cambiada no es el mismo DNI: no se «arregla».
- Listados de 600 líneas: el reconocimiento monta un índice por número, por documento y por nombre
  normalizado una sola vez; nada de recorrer la lista entera por cada línea.
- Nada de lo pegado sale del ordenador ni se apunta en el registro de errores del botón «Soporte».

## Antes de empezar

- No leas el repositorio entero. Basta con `docs/CONTEXTO.md`, `docs/TRABAJO-EN-BLOQUE.md`,
  `docs/contexto/PERSONAS.md` (el apartado «Grupos de personas» y el modo `multiple`),
  `js/asuntos-nuevo.js` (solo `App.pintarBuscadorDeTercero`), `js/relacionados.js` (los atajos),
  `js/grupos.js`, `js/tablas-datos-leer.js` y `js/cargar-fichero.js`.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas (`js/asuntos-nuevo.js` tiene
  509: ahí, solo el botón y la llamada; el código, en el módulo nuevo).
- Un módulo nuevo no envuelve: el buscador devuelve ya `{ marcar(lista), marcados() }`; se usa eso.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- La demostración tiene que traer dos alumnos con el mismo nombre y apellidos en unidades
  distintas (inventados).
- Rama `fila-296`, revisor en local y, con su APROBADA, a `main`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs lista-pegada grupos
  relacionados`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/lista-pegada.js`: nuevo (`ListaPegada`; mira antes que el nombre esté libre). Partir el
  texto, saltar la cabecera, `reconocer` y el cuadro con sus tres apartados.
- `js/asuntos-nuevo.js` o `js/relacionados.js` (donde se pintan hoy los atajos del modo
  `multiple`): solo el botón «Pegar una lista».
- `js/ajustes.js` (o el fichero que pinte «Ver y cambiar los miembros»): solo si el botón no sale
  ahí por sí solo.
- `index.html`, `css/…`, `js/novedades.js`, `js/demo/…`.
- `pruebas/lista-pegada.mjs`: nueva. Casos: por Nº escolar; por DNI con y sin letra, con guiones;
  por «Apellidos, Nombre» y por «Nombre Apellidos»; apellidos y nombre en dos columnas; con
  tabuladores y con punto y coma; cabecera saltada; tildes y mayúsculas; dos tocayos van a «Hay
  que elegir»; uno que no existe va a «No encontradas»; repetido entra una vez; antiguo no
  matriculado va a «Hay que elegir» diciéndolo; un Excel y un CSV en Latin-1 dan lo mismo que el
  texto pegado; 600 líneas en menos de un segundo; «Guardar también como grupo» crea el grupo.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo), `docs/contexto/PERSONAS.md` y
  `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que al formar un grupo hay un camino nuevo, «Pegar una lista»; que se pega el
listado de Séneca o de una hoja de cálculo, o se elige el fichero; que la aplicación reconoce a
cada persona por su número, su DNI o su nombre, pregunta cuando hay dos iguales y dice a quién no
encuentra; y que la lista se puede guardar como grupo para otra vez.

## Cómo sabemos que está bien

En la copia de demostración.

1. «Nuevo asunto» → «Es para un grupo de personas»: junto a los atajos hay «Pegar una lista».
2. Pegar cuatro líneas con el nombre de cuatro alumnos de la demostración, dos escritos
   «Apellidos, Nombre» y dos «Nombre Apellidos», uno sin tildes. «Reconocer»: «Reconocidas (4)».
3. Añadir una línea con un nombre que no existe: sale en «No encontradas (1)», en rojo, con
   «Copiar».
4. Añadir una línea con el nombre de los dos alumnos que se llaman igual: sale en «Hay que elegir
   (1)», con los dos y su unidad. Pulsar uno: pasa a «Reconocidas».
5. Poner una primera línea «Alumno/a»: no cuenta como persona ni como no encontrada.
6. Pegar las mismas líneas separadas por tabulador con una columna más delante (un número de
   orden): el resultado es el mismo.
7. «Señalar las N»: el cuadro se cierra y en el buscador están esas personas señaladas, con su
   chip. «Usar los N señalados» sigue como en la fila 293.
8. Repetir marcando «Guardar también como grupo» con un nombre: en Ajustes, «Grupos de personas»
   tiene ese grupo con esas personas.
9. En un asunto de grupo ya creado, «+ Añadir personas» → «Pegar una lista»: funciona igual y las
   personas nuevas entran en la tabla.
10. Sin errores en la consola en ningún punto.
11. **[SOLO FRANCISCO]** Con un listado de verdad exportado de Séneca (por ejemplo, el de
    transporte escolar): elegir el fichero y mirar que casi todas las personas salen en
    «Reconocidas». Si muchas van a «No encontradas», decírselo a Claude con el nombre del listado.
