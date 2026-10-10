# El Gestor entrega sus Administraciones al Centro de datos

Fila 329 de `docs/COLA.md` (si en la tabla lleva otro número, vale el de la tabla). Diseñada con
Francisco el 11-oct-2026, en la conversación de la idea 24 de la cola del Centro de datos
(`fmargon780/centro-de-datos-ies`, `docs/24-ADMINISTRACIONES.md`, que es la otra mitad de este
trabajo).

**Es la segunda lista que el Gestor entrega, por el camino de la fila 328**
(`docs/ENTREGAR-EMPRESAS-AL-CENTRO-DE-DATOS.md`). Aquí no se inventa nada de permisos, ni de cuándo
se entrega, ni de cómo se escribe o se apunta: **todo eso es lo de la 328, sin cambios**. Lo nuevo
es añadir la lista a su tabla, y lo poco que esa tabla todavía no sabe hacer.

Lee antes `docs/CONTEXTO.md`, `docs/ENTREGAR-EMPRESAS-AL-CENTRO-DE-DATOS.md` **entero**,
`docs/contexto/TUTORES-Y-ADMINISTRACIONES.md` (la parte de las Administraciones) y
`docs/CENTRO-DE-DATOS-CONTRATO-2.md`. De código: `js/centro-de-datos-entregar.js` y
`pruebas/centro-de-datos-entregar.mjs` (los deja la 328), `js/centro-de-datos-ver.js`,
`js/comprobacion-entrada.js` (función `centroDeDatos`), `js/administraciones.js` (`leer`, `cambiar`,
`recorrer`, `superiorPorId`, `unirDatos`), `js/nombres.js` (`terceroAdministracion`),
`js/conflictos-datos.js` (donde se une `administraciones.json`) y la copia de pruebas (`js/demo/`).

**Esta fila va detrás de la 328 y no se puede hacer sin ella.** Si la 328 no está HECHA cuando cojas
esta, no la empieces: márcala BLOQUEADA con ese motivo en una línea.

**No espera a la fila 24 del Centro de datos.** El Gestor no entrega nada hasta que el índice del
Centro de datos dice que recibe las Administraciones. Si esa fila todavía no está hecha, aquí queda
todo listo y probado con una carpeta de mentira, y empezará a entregar solo el día en que lo esté.

## Qué quiere Francisco

Las Administraciones con las que trata el centro se escriben en el Gestor (Personas y empresas).
Quiere que estén también en el Centro de datos, para que cualquier otra aplicación las lea de allí
sin pedirle nada al Gestor. Hoy solo las usa el propio Gestor: se deja preparado.

### Decidido por Francisco (no se cambia)

1. **Las Administraciones se siguen escribiendo en el Gestor, como hoy.** El Gestor es su dueño.
   Nada cambia en «Personas y empresas», ni en la ficha de una Administración, ni en
   `administraciones.json`.
2. **Entran las dos clases:** los organismos y los otros centros educativos.
3. **Se entrega todo lo que el Gestor guarda de cada una, tal cual:** clase, de quién depende,
   nombre corto, nombre oficial, nombres anteriores, DIR3 o código de centro, correo, teléfono,
   dirección y sus departamentos, cada uno con su correo, teléfono y persona de contacto. Si un día
   se guarda un dato más, se añade aquí y llega solo al Centro de datos.
4. **La entrega es automática.** Cada vez que la lista cambia, el Gestor deja la lista entera en el
   Centro de datos. No hay ningún botón que haya que pulsar.
5. **A Francisco no le toca nada nuevo.** El permiso para escribir en la carpeta del Centro de datos
   es el mismo que ya pide la fila 328.
6. El Gestor no corrige nada antes de entregar. Lo que no cuadre (dos centros con el mismo código)
   lo dice el Centro de datos como aviso.

### Decidido al escribir esta instrucción

1. **El `id` de cada Administración es el que ya tiene en `administraciones.json`** (`org-…`). No
   se calcula nada.
2. **El árbol de departamentos se entrega como una tabla**, una fila por departamento, en el orden
   del árbol (el de `Administraciones.recorrer`), con su nivel y el `id` del departamento del que
   cuelga.
3. **Las mismas reglas de la 328 para todo lo demás:** solo entrega el ordenador con la carpeta
   señalada y permiso de escribir; se entrega cuando lo que hay es distinto de lo último entregado;
   lo entregado se apunta en `_GESTOR/centro-de-datos.json`; de tener Administraciones a no tener
   ninguna no se entrega sola.

## El acuerdo con el Centro de datos (copia; la versión buena es `docs/24-ADMINISTRACIONES.md` de su repositorio)

Fichero `ENTREGA administraciones gestor-asuntos-ies.json`, en `entrada/`, en UTF-8:

    { "entrega": 1, "conjunto": "administraciones", "origen": "gestor-asuntos-ies",
      "generado": "2026-10-11T09:30:00+02:00", "hechoCon": [],
      "campos": [ … los catorce de la tabla de abajo, todos con "dueno": "gestor-asuntos-ies" … ],
      "registros": [
        { "id": "org-inventado1", "datos": {
            "clase": "organismo", "tercero": "Delegación de Mentira", "nombreCorto": "Delegación de Mentira",
            "nombreOficial": "Delegación Territorial Inventada de Educación", "dir3": "A00000001",
            "dependeDe": "Consejería Inventada", "dependeDeId": "sup-inventado1",
            "nombresAnteriores": [ { "nombre": "Delegación Provincial Inventada", "hasta": "2026-09-25" } ],
            "dependeDeAnteriores": [ { "nombre": "Consejería de Antes", "hasta": "2026-07-01" } ],
            "correo": "delegacion@example.com", "telefono": "600 000 001", "direccion": "Calle Falsa, 1",
            "departamentos": [
              { "id": "dep-inventado1", "nombre": "Planificación", "nivel": 0, "correo": "planificacion@example.com", "contacto": "Ana Prueba" },
              { "id": "dep-inventado2", "nombre": "Escolarización", "nivel": 1, "dependeDe": "dep-inventado1", "telefono": "600 000 002" } ] } },
        { "id": "org-inventado2", "datos": {
            "clase": "centro", "tercero": "IES Ejemplo 29000000", "nombreCorto": "IES Ejemplo",
            "codigoCentro": "29000000",
            "departamentos": [ { "id": "dep-inventado3", "nombre": "Secretaría", "nivel": 0 } ] } } ] }

Los catorce campos, en este orden:

| `clave` | `etiqueta` | `apartado` | `tipo` | De dónde sale |
|---|---|---|---|---|
| `clase` | Clase | Administración | texto | `centro` si `clase` es `centro`; si no, `organismo` |
| `tercero` | Nombre en el Gestor | Administración | texto | `Nombres.terceroAdministracion(o)` |
| `nombreCorto` | Nombre corto | Administración | texto | `corto` |
| `nombreOficial` | Nombre oficial | Administración | texto | `oficial` |
| `dir3` | DIR3 | Administración | texto | `dir3` |
| `codigoCentro` | Código de centro | Administración | texto | `codigoCentro` |
| `dependeDe` | Depende de | Administración | texto | El `nombre` del superior enlazado por `superior` |
| `dependeDeId` | Depende de (identificador) | Administración | texto | `superior` |
| `nombresAnteriores` | Nombres anteriores | Administración | tabla | `antes` del organismo: `nombre` y `hasta` |
| `dependeDeAnteriores` | Nombres anteriores de «Depende de» | Administración | tabla | `antes` del superior: `nombre` y `hasta` |
| `correo` | Correo electrónico | Contacto | texto | `correo` |
| `telefono` | Teléfono | Contacto | texto | `telefono` |
| `direccion` | Dirección | Contacto | texto | `direccion` |
| `departamentos` | Departamentos | Departamentos | tabla | El árbol aplanado: `id`, `nombre`, `nivel` (0 el de arriba), `dependeDe` (el `id` del padre; el de arriba no lo lleva), `correo`, `telefono`, `contacto` y `dir3` |

Los campos de tabla llevan `columnas`, como `{ clave, etiqueta }`. Etiquetas: «Nombre» y «Hasta» en
las dos de nombres anteriores; «Identificador», «Nombre», «Nivel», «Depende de», «Correo
electrónico», «Teléfono», «Persona de contacto» y «DIR3» en `departamentos`.

- **La entrega es siempre la lista entera.** La que no viene en ella ya no está.
- Un dato vacío no se escribe, tampoco dentro de una fila de una tabla; una tabla sin filas no se
  escribe. `nivel` es un número y se escribe siempre, también el 0. Los valores van tal como están
  escritos en el Gestor.
- Si `superior` apunta a un superior que ya no está en `superiores`, se entrega `dependeDeId` y no
  `dependeDe`.
- El orden de los registros es el de la lista del Gestor: por nombre corto, como
  `Administraciones.cargar`.
- Una lista con cero Administraciones es una entrega válida.
- **No se corrige nada.** Si en el fichero hubiera dos con el mismo `id`, el mismo nombre o el
  mismo código de centro (puede pasar al unir una copia en conflicto), se entregan todas, cada una
  en su registro. Una sin `id` se entrega sin `id`. El aviso lo da el Centro de datos.

Y en `indice.json` del Centro de datos, cuando sabe recibirla:

    "recibe": [ … { "conjunto": "administraciones", "de": "gestor-asuntos-ies", "entrega": 1, "entero": true } ]

**Una aplicación no entrega a un conjunto que no esté en `recibe` con su nombre y `entrega: 1`.**
Las dos listas son independientes: el Centro de datos puede recibir ya las empresas y todavía no
las Administraciones.

## Qué hay que hacer

### 1. La tabla de listas gana una línea

En `js/centro-de-datos-entregar.js`, la tabla de listas que se entregan pasa a tener dos: `empresas`
(como está) y `administraciones`, con su fichero `ENTREGA administraciones gestor-asuntos-ies.json`.

La tabla solo sabía sacar los datos de las columnas de un CSV. Tiene que admitir además:

- **Una lista que no sale de un CSV:** la línea dice el fichero de `_GESTOR/datos` del que sale
  (`administraciones.json`) y una función que, con ese fichero ya leído, da los registros
  (`{ id, datos }`). Esa función vive en `js/administraciones.js` (por ejemplo
  `Administraciones.paraEntregar(d)`), que es quien conoce el árbol; `centro-de-datos-entregar.js`
  no sabe nada de organismos ni de departamentos.
- **Campos de tipo `tabla`**, con sus `columnas`.

Los catorce campos siguen siendo catorce líneas de esa tabla: **un dato nuevo es una línea más** (y,
si hace falta, una línea en la función que da los registros).

La lista se lee **del fichero, en ese momento**, sin fiarse de `Administraciones.enMemoria()`, y
dentro de `ColaGuardado.poner('administraciones.json', …)`, para no leerla a medio guardar. Si el
fichero no existe todavía, es una lista con cero Administraciones que nunca tuvo ninguna: no se
entrega.

La huella de los datos, `generado` y el montaje del JSON son los de la 328.

### 2. Cuándo se entrega

Las mismas dos ocasiones y las mismas siete condiciones de la 328, **mirando cada lista por
separado**: su línea de `recibe`, su huella y su apunte. Que una no se pueda entregar no para la
otra.

- **Al entrar**, una vez por sesión, las dos listas en la misma pasada, leyendo el índice una sola
  vez.
- **Unos 5 segundos después del último cambio.** `Administraciones.cambiar` avisa, cuando de verdad
  ha escrito el fichero, por la misma lista de avisos «ha cambiado esta lista» que la 328 puso en
  `js/datos-listas.js`. Con eso quedan cubiertos el alta, los cambios de datos, los departamentos y
  «Pasar a Administraciones». Lo que cambia sin pasar por ahí (unir una copia en conflicto,
  recuperar una copia) se entrega en la siguiente entrada.

### 3. Escribir y apuntar

Sin cambios en la función que escribe (ya solo deja escribir en `entrada/` un fichero
`ENTREGA … gestor-asuntos-ies.json`). El apunte va al lado del de las empresas:

    "entregado": { "empresas": { … }, "administraciones": { "huellaDatos": "…", "registros": 34,
                   "generado": "…", "entregadoEl": "…", "entregadoPor": "Francisco" } }

Escribir el apunte de una lista no toca el de la otra, ni `tomado`.

### 4. Lo que se ve

En Ajustes → Este ordenador → «Carpeta del Centro de datos», **una línea más, debajo de la de las
empresas**, con las mismas cinco variantes:

- «Administraciones entregadas al Centro de datos: 34, el 11-oct-2026 (Francisco).»
- «Las Administraciones las entrega el otro ordenador. Última entrega: 34, el 11-oct-2026.»
- «El Centro de datos todavía no recibe las Administraciones.»
- «Falta el permiso para escribir en esta carpeta: las Administraciones no se entregan.» El botón
  «Dar permiso» sale una sola vez, no uno por línea.
- «La lista de Administraciones está vacía y antes no lo estaba: no la he entregado.» con su botón
  «Entregar la lista vacía».

**«Entregar ahora» sigue siendo un solo botón** y entrega todo lo que haya: contesta con una frase
por lista («Entregadas 34 Administraciones. No hay nada nuevo de las empresas.») o, si no hay nada,
«No hay nada nuevo que entregar».

**La comprobación al entrar:** la fila ámbar de la 328 nombra las listas que el Centro de datos
recibe y no se pueden entregar: «Falta el permiso para escribir: las empresas y las Administraciones
no se entregan al Centro de datos.» Si solo recibe una, nombra solo esa.

Una entrega que sale bien **no avisa de nada**.

### 5. La copia de pruebas

- La carpeta de mentira del Centro de datos trae en `recibe` las dos listas. `?recibe=0` quita las
  dos; `?recibe=empresas` deja solo las empresas.
- La copia de pruebas trae al menos cuatro Administraciones inventadas: dos organismos que dependen
  del mismo superior (uno con dos niveles de departamentos y una persona de contacto, y con un nombre
  anterior) y dos centros con código. Si ya hay algunas, se completan sin quitar ninguna.

### 6. Novedades y documentos

- `js/novedades.js`, una línea, en el mismo commit del código: «La lista de Administraciones se
  entrega sola al Centro de datos, igual que la de empresas.»
- `docs/BEBER-DEL-CENTRO-DE-DATOS.md`: que el Gestor escribe en `entrada/` dos ficheros, y enlazar
  este documento.
- `docs/CENTRO-DE-DATOS-CONTRATO-2.md`: el conjunto `administraciones`. Cópialo de
  `docs/CONTRATO.md` de `centro-de-datos-ies` si su fila 24 ya está hecha; si no, copia el acuerdo de
  este documento y dilo en la nota de la fila.
- `docs/LOS-DATOS-DEL-CENTRO.md`: en llano, que la lista de Administraciones (con las personas de
  contacto de sus departamentos) se copia además al Centro de datos.
- `docs/CONTEXTO-CORTO.md` (la línea del Centro de datos de la sección 5, **sustituyendo**; vigila
  el tope de 40.000 caracteres), `docs/contexto/TUTORES-Y-ADMINISTRACIONES.md`,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`.

## Ficheros que se tocan

Se cambian, con el mínimo de líneas: `js/centro-de-datos-entregar.js`, `js/administraciones.js` (la
función que da los registros y el aviso de «ha cambiado»; tiene 484 líneas y no puede pasar de 600:
si no cabe, la función va a un fichero nuevo `js/administraciones-entregar.js`),
`js/centro-de-datos-ver.js`, `js/comprobacion-entrada.js`, `js/demo/datos-centro-de-datos.js`, los
datos de la copia de pruebas, `js/novedades.js` y `pruebas/centro-de-datos-entregar.mjs` (o una
prueba nueva a su lado).

**No tocar** `js/carpetas.js`, `js/nucleo.js`, `js/administraciones-ficha.js` ni
`js/administraciones-traer.js`. Ningún fichero de `js/` puede pasar de 600 líneas al terminar.

## No se hace en esta fila

- Leer Administraciones del Centro de datos: el Gestor es su dueño y las tiene en su fichero.
- Los cargos (idea 25 del Centro de datos): tendrán su fila.
- Ningún cambio en «Personas y empresas», en la ficha de una Administración ni en la forma de
  `administraciones.json`.
- Enseñar aquí los avisos que dé el Centro de datos sobre las Administraciones.

## Cuidado

- **Las empresas se siguen entregando exactamente como las dejó la 328.** Su fichero, sus `id`, su
  apunte y su línea de Ajustes no cambian. La prueba de la 328 tiene que pasar sin tocar lo que
  comprueba.
- **El Gestor no puede escribir en esa carpeta nada más que sus dos entregas.** La prueba lo
  comprueba mirando la carpeta entera antes y después.
- **Nada de esto puede retrasar la entrada ni dejar un aviso rojo.** Si entregar falla, el Gestor
  sigue como si nada y lo dice en Ajustes.
- **Son datos personales** (personas de contacto, correos y teléfonos). Solo van a esa carpeta. En
  las pruebas y en la copia de pruebas, Administraciones inventadas, con códigos de centro que no
  existan y correos de `example.com`.
- `Administraciones.cambiar` no puede tardar más ni fallar por avisar: el aviso va después de
  escribir y un fallo suyo no llega a quien guardaba.
- En la copia sin internet (`file://`) tiene que funcionar igual.

## Qué decirle a Francisco al terminar

En dos frases: que la lista de Administraciones se entrega sola al Centro de datos desde el mismo
ordenador que las empresas, sin que tenga que hacer nada; y que lo verá en el Centro de datos, en la
línea «Administraciones: …», cuando la fila 24 de su cola esté hecha.

## Cómo sabemos que está bien

Con la carpeta de mentira, en `pruebas/centro-de-datos-entregar.mjs` o en una prueba nueva calcada
de ella:

1. Sin carpeta señalada, o sin permiso de escribir, o en «solo consultar», o con `recibe` sin
   ninguna de las dos listas: no se escribe nada y se entra como hoy.
2. Con `recibe` solo con las empresas: se entregan las empresas y **no** las Administraciones. Con
   las dos: aparecen los dos ficheros en `entrada/`.
3. `ENTREGA administraciones gestor-asuntos-ies.json` trae `entrega: 1`, `conjunto`, `origen`,
   `hechoCon: []`, los catorce campos en su orden y con su `dueno` (los tres de tabla, con sus
   `columnas`) y un registro por Administración, por nombre corto.
4. El `id` de cada registro es el de su organismo en `administraciones.json`, sin cambiar.
5. Un organismo con un departamento que tiene dentro otro: su tabla `departamentos` trae dos filas,
   la primera con `nivel: 0` y sin `dependeDe`, la segunda con `nivel: 1` y `dependeDe` con el `id`
   de la primera; la persona de contacto sale en `contacto`.
6. Un centro: `clase: "centro"`, `codigoCentro` con sus 8 cifras, `tercero` con el nombre corto y el
   código, sin `dir3`. Un organismo sin «Depende de»: sin `dependeDe` ni `dependeDeId`.
7. Tras cambiar el nombre oficial de un organismo y el nombre de su superior: el registro trae el
   nombre oficial nuevo, el viejo en `nombresAnteriores` con su `hasta`, y el nombre viejo del
   superior en `dependeDeAnteriores`. El `id` es el mismo de antes.
8. Una Administración que solo tiene nombre corto lleva solo `clase`, `tercero` y `nombreCorto`.
9. Queda apuntado `entregado.administraciones` en `_GESTOR/centro-de-datos.json`;
   `entregado.empresas` y `tomado` siguen igual.
10. Entrar otra vez no escribe nada. Dar de alta una Administración, cambiarle el teléfono, añadirle
    un departamento o quitarla: a los pocos segundos hay una entrega nueva de Administraciones y
    **ninguna** de empresas. Tres cambios seguidos dan una sola entrega.
11. Un cambio hecho «por el otro ordenador» (el fichero cambia en el disco sin pasar por la
    aplicación): se entrega en la siguiente entrada.
12. De cuatro Administraciones a ninguna: no se entrega y Ajustes lo dice con su botón; al pulsarlo,
    se entrega la lista vacía. Sin `administraciones.json`: no se entrega y no se avisa de nada.
13. **Solo se han escrito esos dos ficheros:** el resto de la carpeta de mentira es idéntico antes y
    después, byte a byte.
14. La prueba de la 328 y `npm test -- centro-de-datos comprobacion permisos administraciones
    conflictos` siguen en verde.

En la copia de pruebas (`?demo=1&auto=1`), lo que mira el revisor:

15. Ajustes → Este ordenador → «Carpeta del Centro de datos»: debajo de la línea de las empresas
    sale «Administraciones entregadas al Centro de datos: N, el <hoy> (…)», con N igual al número de
    Administraciones de «Personas y empresas» (organismos más centros).
16. Al dar de alta una Administración nueva en «Personas y empresas» y volver a ese bloque pasados
    diez segundos, la línea dice N + 1 y la de las empresas no ha cambiado. No ha salido ningún
    aviso por entregar.
17. «Entregar ahora» contesta «No hay nada nuevo que entregar».
18. Con `?demo=1&auto=1&recibe=empresas`: la línea dice «El Centro de datos todavía no recibe las
    Administraciones.» y la de las empresas sigue diciendo que están entregadas.
19. Con `?demo=1&auto=1&sinescribir=1`: las dos líneas dicen que falta el permiso, hay un solo botón
    «Dar permiso», y la «Comprobación al entrar» saca la fila «Carpeta del Centro de datos» en ámbar
    nombrando las empresas y las Administraciones.
20. «Personas y empresas» y la ficha de una Administración (con su árbol de departamentos) se ven y
    funcionan exactamente como antes.

Para Francisco, lo que solo se ve con datos reales, en `docs/COMPROBAR-A-MANO.md`:

21. [SOLO FRANCISCO] En el ordenador con la carpeta del Centro de datos señalada: en Ajustes → Este
    ordenador → «Carpeta del Centro de datos» tiene que salir «Administraciones entregadas al Centro
    de datos: …» (si dice «todavía no recibe las Administraciones», falta la fila 24 del Centro de
    datos). Pasado un cuarto de hora, la página del Centro de datos tiene que decir
    «Administraciones: …» con el mismo número.
