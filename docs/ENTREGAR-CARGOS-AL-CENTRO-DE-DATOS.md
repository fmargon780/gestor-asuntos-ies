# El Gestor entrega los cargos del centro al Centro de datos

Fila 330 de `docs/COLA.md` (si en la tabla lleva otro número, vale el de la tabla). Diseñada con Francisco el 11-oct-2026, en la
conversación de la idea 25 de la cola del Centro de datos (`fmargon780/centro-de-datos-ies`,
`docs/25-CARGOS.md`, que es la otra mitad de este trabajo).

Lee antes `docs/CONTEXTO.md`, `docs/ENTREGAR-EMPRESAS-AL-CENTRO-DE-DATOS.md` (fila 328: el camino de
entrega) y `docs/ENTREGAR-ADMINISTRACIONES-AL-CENTRO-DE-DATOS.md` (fila 329: la segunda lista, que
ya no sale de un CSV; esta fila es la tercera y se hace igual), `docs/BEBER-DEL-CENTRO-DE-DATOS.md`,
`docs/CENTRO-DE-DATOS-CONTRATO-2.md` y `docs/FIRMANTES-Y-MEMBRETE.md` (parte 1: los cargos). De
código: `js/centro-de-datos-entregar.js`, `js/centro-de-datos-ver.js`, `js/comprobacion-entrada.js`
(función `centroDeDatos`), `js/cargos.js`, `js/administraciones.js` (su `paraEntregar`, como
modelo), `js/demo/datos-centro-de-datos.js` y `pruebas/centro-de-datos-entregar.mjs`.

**Esta fila va detrás de la 328 y de la 329.** Sin la 328 HECHA no se puede hacer: márcala BLOQUEADA
con ese motivo. Si la que falta es la 329, sí se puede: haz aquí lo que la tabla de listas necesite
para admitir una lista que no sale de un CSV (punto 1 de la 329), sin tocar las Administraciones, y
dilo en la nota de la fila.

**No espera a la fila del Centro de datos.** El Gestor no entrega nada hasta que el índice del
Centro de datos dice que recibe los cargos (`recibe`). Si esa fila todavía no está hecha, aquí queda
todo listo y probado con una carpeta de mentira, y empezará a entregar solo el día en que lo esté.

## Qué quiere Francisco

Los cargos del centro y quién los ha ocupado se escriben en el Gestor (Ajustes → El centro →
«Cargos del centro»). Quiere que estén también en el Centro de datos, para que cualquier otra
aplicación los lea de allí, y que allí cada ocupante quede unido a su ficha del personal.

### Decidido por Francisco (no se cambia)

1. **Los cargos se siguen escribiendo en el Gestor, como hoy.** El Gestor es su dueño. Nada cambia
   en «Cargos del centro» ni en `cargos.json`. El nombre del ocupante se sigue escribiendo a mano,
   como debe salir en la firma: **no se elige de la lista del personal.**
2. **Se entregan todos los cargos, con todos sus ocupantes**, los de hoy y los anteriores, tal cual
   están escritos: nombre del cargo, tratamiento, nombre de la persona, sexo si está puesto, fecha
   de inicio y fecha de fin.
3. **La entrega es automática.** Cada vez que los cargos cambian, el Gestor deja la lista entera en
   el Centro de datos. Sin botón.
4. **El Gestor no corrige nada antes de entregar.** Unir cada ocupante con su ficha del personal
   (por el nombre) y avisar de lo que no cuadre lo hace el Centro de datos.

### Decidido al escribir esta instrucción

1. **Es una línea más de la tabla de listas que se entregan** (fila 328, decisión 6), hecha como la
   de las Administraciones (fila 329): la línea dice de qué fichero sale (`_GESTOR/cargos.json`) y
   una función que, con ese fichero ya leído, da los registros. Esa función vive en `js/cargos.js`
   (por ejemplo `Cargos.paraEntregar(d)`). Da **un registro por cargo y ocupante**.
2. **Todo lo demás es lo de la fila 328, sin cambios:** qué ordenador entrega, el permiso de
   escribir (el mismo; no se pide nada nuevo), las condiciones para entregar, la función única que
   escribe, la huella de los datos y el apunte de lo último entregado.
3. **De tener ocupantes a no tener ninguno no se entrega sola**, como las empresas (su decisión 5).
   Y **si `cargos.json` no existe, no se entrega**: los seis cargos de fábrica que `Cargos.leer`
   devuelve en ese caso no son un dato, casi siempre es un Dropbox a medio sincronizar.

## Lo que se sabe hoy

- **Los cargos** viven en `_GESTOR/cargos.json` (fichero compartido):
  `{ cargos: [{ id, nombre, orden, tratamiento, ocupantes: [{ id, persona, sexo, desde, hasta }] }] }`.
  Los escribe `js/cargos.js`, siempre por su función `cambiar` (`Copias.guardar`). También cambia
  cuando se elige una copia en conflicto de Dropbox o se recupera una copia.
- `persona` es texto libre («Nombre Apellido1 Apellido2»). `sexo` es `H`, `M` o vacío. `desde` y
  `hasta` son `AAAA-MM-DD`; `hasta` vacío es que sigue en el cargo. `Cargos.ordenados` da los cargos
  por su `orden`.
- `js/cargos.js` tiene 415 líneas.

## El acuerdo con el Centro de datos (copia; la versión buena es `docs/25-CARGOS.md` de su repositorio)

Fichero `ENTREGA cargos gestor-asuntos-ies.json`, en `entrada/`, en UTF-8:

    { "entrega": 1, "conjunto": "cargos", "origen": "gestor-asuntos-ies",
      "generado": "2026-10-11T09:30:00+02:00", "hechoCon": [],
      "campos": [
        { "clave": "cargo", "etiqueta": "Cargo (identificador)", "apartado": "Cargo", "tipo": "texto", "dueno": "gestor-asuntos-ies" },
        { "clave": "cargoNombre", "etiqueta": "Cargo", "apartado": "Cargo", "tipo": "texto", "dueno": "gestor-asuntos-ies" },
        { "clave": "tratamiento", "etiqueta": "Tratamiento", "apartado": "Cargo", "tipo": "texto", "dueno": "gestor-asuntos-ies" },
        { "clave": "orden", "etiqueta": "Orden", "apartado": "Cargo", "tipo": "numero", "dueno": "gestor-asuntos-ies" },
        { "clave": "persona", "etiqueta": "Persona", "apartado": "Ocupante", "tipo": "texto", "dueno": "gestor-asuntos-ies" },
        { "clave": "sexo", "etiqueta": "Sexo", "apartado": "Ocupante", "tipo": "texto", "dueno": "gestor-asuntos-ies" },
        { "clave": "desde", "etiqueta": "Desde", "apartado": "Ocupante", "tipo": "fecha", "dueno": "gestor-asuntos-ies" },
        { "clave": "hasta", "etiqueta": "Hasta", "apartado": "Ocupante", "tipo": "fecha", "dueno": "gestor-asuntos-ies" } ],
      "registros": [
        { "id": "direccion/c-inventado-1", "datos": { "cargo": "direccion", "cargoNombre": "Dirección", "tratamiento": "La Directora",
                                                       "orden": 1, "persona": "Rosa Sellés Manzano", "sexo": "M", "desde": "2025-07-01" } },
        { "id": "direccion/c-inventado-2", "datos": { "cargo": "direccion", "cargoNombre": "Dirección", "tratamiento": "La Directora",
                                                       "orden": 1, "persona": "Miguel Prado Soler", "sexo": "H",
                                                       "desde": "2019-07-01", "hasta": "2025-06-30" } },
        { "id": "vicedireccion", "datos": { "cargo": "vicedireccion", "cargoNombre": "Vicedirección", "tratamiento": "El Vicedirector", "orden": 2 } } ] }

- **La entrega es siempre la lista entera.** Lo que no viene en ella ya no está.
- **Un registro por cargo y ocupante.** Su `id`: el `id` del cargo, una barra y el `id` del
  ocupante, los dos tal como están en `cargos.json`. **Un cargo sin ningún ocupante** da un solo
  registro, con el `id` del cargo y solo los cuatro datos del cargo.
- Los cuatro datos del cargo (`cargo`, `cargoNombre`, `tratamiento`, `orden`) se repiten en cada
  registro de ese cargo. `cargo` es su `id`; `cargoNombre`, su `nombre`.
- **El orden:** los cargos por su `orden` (a igual `orden`, como están en el fichero) y, dentro de
  cada cargo, los ocupantes **en el orden en que están en el fichero**. No se reordenan: si dos
  ocupan el cargo el mismo día, firma el primero, y el Centro de datos tiene que verlos igual.
- Un dato vacío no se escribe. Los valores van tal como están escritos: la `persona` no se limpia,
  el `sexo` es `H` o `M`, y las fechas, `AAAA-MM-DD`.
- Una lista sin ningún cargo es una entrega válida (pero ver la decisión 3).
- **No se corrige nada:** fechas que se pisan, al revés o que faltan se entregan como están.

Y en `indice.json` del Centro de datos, cuando sabe recibirla:

    "recibe": [ { "conjunto": "cargos", "de": "gestor-asuntos-ies", "entrega": 1, "entero": true } ]

**Una aplicación no entrega a un conjunto que no esté en `recibe` con su nombre y `entrega: 1`.**

## Qué hay que hacer

### 1. La línea de los cargos en la tabla de listas

En `js/centro-de-datos-entregar.js`: conjunto `cargos`, fichero
`ENTREGA cargos gestor-asuntos-ies.json`, sus ocho datos (cada uno con su `clave`, `etiqueta`,
`apartado` y `tipo`) y de dónde sale.

- Se lee **del fichero, en ese momento** (`Carpetas.leerJson` sobre `cargos.json`), sin fiarse de lo
  guardado en memoria y sin pisarse con un guardado en marcha. Si el fichero no existe o no se puede
  leer, no hay nada que entregar. **Ojo: `cargos.json` está en `_GESTOR`, no en `_GESTOR/datos`.**
- `Cargos.paraEntregar(d)` no inventa nada: si a un cargo o a un ocupante le falta el `id` en el
  fichero, su registro va sin `id` y el aviso lo da el Centro de datos. No se usa el `id` nuevo que
  `normalizar` le pondría al leer.
- Cada línea de la tabla dice **cómo se cuenta** lo entregado para la frase de Ajustes: las
  empresas, por registros; los cargos, por cargos distintos.

### 2. Cuándo se entrega

Lo de la fila 328, punto 3, con sus siete condiciones, cambiando «empresas» por «cargos»:

- al entrar, en la misma pasada que las demás listas (el índice se lee una sola vez para todas);
- unos 5 segundos después del último cambio en los cargos. Engánchalo en `cambiar` de
  `js/cargos.js` con el mínimo de líneas, avisando por la misma lista de avisos «ha cambiado esta
  lista» de la fila 328, sin que `cargos.js` sepa nada del Centro de datos.

Cada lista se entrega por separado: que una no se pueda entregar no impide la otra.

### 3. Escribir y apuntar

La misma función única que escribe en `entrada/`. El apunte, junto a los de las otras listas, sin
tocarlos:

    "entregado": { "empresas": { … }, "administraciones": { … },
                   "cargos": { "huellaDatos": "…", "registros": 9, "cuenta": 6, "generado": "…",
                               "entregadoEl": "…", "entregadoPor": "Francisco" } }

`cuenta` es el número que se enseña (cargos distintos). Una entrega que sale bien no avisa de nada.

### 4. Lo que se ve

Solo en Ajustes → Este ordenador → «Carpeta del Centro de datos», **una línea más, debajo de las de
las otras listas**, con las mismas frases para esta:

- «Cargos entregados al Centro de datos: 6, el 11-oct-2026 (Francisco).»
- «Los cargos los entrega el otro ordenador. Última entrega: 6, el 11-oct-2026.»
- «El Centro de datos todavía no recibe los cargos.»
- «Los cargos no tienen ningún ocupante y antes sí: no los he entregado.» con el botón «Entregar de
  todos modos».

- «Falta el permiso para escribir en esta carpeta: los cargos no se entregan.» El botón «Dar
  permiso» sigue saliendo una sola vez.

«Entregar ahora» sigue siendo un solo botón: entrega todas las listas y contesta por cada una.

**La comprobación al entrar:** la fila ámbar nombra también los cargos cuando el Centro de datos los
recibe y falta el permiso de escribir («las empresas, las Administraciones y los cargos no se
entregan al Centro de datos»).

### 5. La copia de pruebas

- `js/demo/datos-centro-de-datos.js`: el índice de mentira trae también `recibe` con los cargos.
- La demostración tiene que tener cargos con ocupantes inventados: Dirección con dos (el de hoy y
  uno anterior) y al menos un cargo sin ninguno.

### 6. Novedades y documentos

- `js/novedades.js`, una línea, en el mismo commit del código: «Los cargos del centro se entregan
  solos al Centro de datos, como las empresas.»
- `docs/BEBER-DEL-CENTRO-DE-DATOS.md`: donde se dice qué ficheros escribe el Gestor en `entrada/`,
  añadir el de los cargos, y enlazar este documento.
- `docs/CENTRO-DE-DATOS-CONTRATO-2.md`: añadir el conjunto `cargos`. Cópialo de `docs/CONTRATO.md`
  de `centro-de-datos-ies` si su fila 25 ya está hecha; si no, copia el acuerdo de este documento y
  dilo en la nota de la fila.
- `docs/LOS-DATOS-DEL-CENTRO.md`: en llano, que los cargos y quién los ha ocupado se copian además
  al Centro de datos.
- `docs/CONTEXTO-CORTO.md` (**sustituyendo**; vigila el tope de 40.000 caracteres),
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`.

## Ficheros que se tocan

Se cambian, con el mínimo de líneas: `js/centro-de-datos-entregar.js`, `js/centro-de-datos-ver.js`,
`js/comprobacion-entrada.js`, `js/cargos.js` (solo el aviso de que ha cambiado),
`js/demo/datos-centro-de-datos.js`, lo que haga falta de `js/demo/` para los cargos inventados,
`js/novedades.js` y `pruebas/centro-de-datos-entregar.mjs` (o una prueba nueva a su lado).

**No tocar** `js/carpetas.js` ni `js/nucleo.js`. Ningún fichero de `js/` puede pasar de 600 líneas al
terminar.

## No se hace en esta fila

- Leer los cargos del Centro de datos: el Gestor es su dueño y los tiene en `cargos.json`.
- Ningún cambio en «Cargos del centro», ni en `cargos.json`, ni en quién firma un documento.
- Elegir al ocupante de la lista del personal, o guardar su DNI (decisión 1 de Francisco).
- Enseñar aquí los avisos que dé el Centro de datos sobre los cargos (un ocupante que no encuentra
  en el personal, fechas que se pisan). Si Francisco lo pide, será otra fila.

## Cuidado

- **El Gestor no puede escribir en esa carpeta nada más que sus entregas.** La prueba lo comprueba
  mirando la carpeta entera antes y después.
- **Las entregas de las empresas y de las Administraciones no cambian en nada:** ni su fichero, ni
  su huella, ni su apunte. Un Centro de datos que las recibe y no recibe los cargos las sigue
  recibiendo igual.
- **Nada de esto puede retrasar la entrada ni dejar un aviso rojo.**
- **Quién firma un documento no cambia:** `Cargos.enFecha` y `Cargos.vigente` no se tocan.
- **Son datos personales** (nombres de personas del centro). Solo van a esa carpeta. En las pruebas
  y en la copia de pruebas, nombres inventados.

## Qué decirle a Francisco al terminar

En dos frases: que los cargos del centro se entregan ya solos al Centro de datos, sin que tenga que
hacer nada (el permiso es el que ya dio para las empresas); y que lo verá en el Centro de datos, en
la línea «Cargos: …», cuando la fila 25 de su cola esté hecha.

## Cómo sabemos que está bien

Con la carpeta de mentira, en `pruebas/centro-de-datos-entregar.mjs` o en una prueba nueva a su
lado:

1. Con `recibe` sin los cargos (aunque traiga las otras listas), o sin permiso de escribir, o en
   «solo consultar»: no se escribe `ENTREGA cargos …`, no sale ningún aviso y las otras listas se
   entregan (o no) exactamente como antes de esta fila.
2. Con todo en regla y tres cargos (Dirección con dos ocupantes, Secretaría con uno, Vicedirección
   sin ninguno): al entrar aparece `entrada/ENTREGA cargos gestor-asuntos-ies.json` con `entrega: 1`,
   `conjunto`, `origen`, `hechoCon: []`, los ocho campos con su `dueno` y **cuatro** registros.
3. Los `id` son `direccion/<id del ocupante>` y, el de Vicedirección, `vicedireccion`. Ese registro
   lleva solo `cargo`, `cargoNombre`, `tratamiento` y `orden`.
4. El orden: Dirección, Vicedirección, Secretaría (por `orden`), y los dos ocupantes de Dirección
   como están en el fichero, aunque el segundo sea más antiguo.
5. Un ocupante sin `hasta` no lleva `hasta`; uno sin `sexo` no lleva `sexo`; uno sin `desde` no
   lleva `desde`. La `persona` sale tal como está escrita. `orden` es un número.
6. Dos ocupantes con fechas que se pisan, y uno con las fechas al revés, se entregan los dos tal
   cual.
7. Queda apuntado `entregado.cargos` (con `cuenta: 3` y `registros: 4`); los apuntes de las otras
   listas y `tomado` siguen igual.
8. Entrar otra vez no escribe nada. Añadir un ocupante, cerrarle la fecha a otro, renombrar un cargo
   o borrarlo: a los pocos segundos hay una entrega nueva con lo de ese momento. Tres cambios
   seguidos dan una sola entrega.
9. Un cambio hecho «por el otro ordenador» (`cargos.json` cambia en el disco sin pasar por la
   aplicación): se entrega en la siguiente entrada.
10. Sin `cargos.json`: no se entrega nada (no salen los seis de fábrica). De tener ocupantes a no
    tener ninguno: no se entrega, Ajustes lo dice con su botón y, al pulsarlo, se entrega.
11. **Solo se han escrito las entregas:** el resto de la carpeta de mentira es idéntico antes y
    después, byte a byte. Los ficheros de las otras listas son los mismos, byte a byte, que sin esta
    fila.
12. Un documento generado con firmante sale firmado por la misma persona que antes de esta fila.
13. `npm test -- centro-de-datos comprobacion permisos solo-consulta cargos` sigue en verde.

En la copia de pruebas (`?demo=1&auto=1`), lo que mira el revisor:

14. Ajustes → Este ordenador → «Carpeta del Centro de datos»: debajo de las líneas de las otras
    listas sale «Cargos entregados al Centro de datos: N, el <hoy> (…)», con N igual al número de cargos de
    Ajustes → El centro → «Cargos del centro».
15. Al añadir un cargo nuevo en «Cargos del centro» y volver a ese bloque pasados diez segundos, la
    línea dice N + 1. No ha salido ningún aviso por entregar.
16. Con `?demo=1&auto=1&recibe=0`: todas las líneas dicen que el Centro de datos todavía no las
    recibe.
17. Con `?demo=1&auto=1&sinescribir=1`: el botón «Dar permiso» sale una sola vez, y la fila ámbar de
    la «Comprobación al entrar» nombra también los cargos.
18. «Cargos del centro» se ve y funciona exactamente como antes.

Para Francisco, lo que solo se ve con datos reales, en `docs/COMPROBAR-A-MANO.md`:

19. [SOLO FRANCISCO] En Ajustes → Este ordenador → «Carpeta del Centro de datos» tiene que salir
    «Cargos entregados al Centro de datos: …» (si dice «todavía no recibe los cargos», falta la
    fila 25 del Centro de datos). Pasado un cuarto de hora, la página del Centro de datos tiene que
    decir «Cargos: …» con el mismo número; si además dice «avisos de cargos», es que el nombre de
    algún ocupante no coincide con el del listado de personal o que hay fechas que se pisan.
