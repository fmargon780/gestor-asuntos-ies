# El Gestor entrega sus empresas al Centro de datos

Fila 328 de `docs/COLA.md` (si en la tabla lleva otro número, vale el de la tabla). Diseñada con
Francisco el 11-oct-2026, en la conversación de la idea 23 de la cola del Centro de datos
(`fmargon780/centro-de-datos-ies`, `docs/23-EMPRESAS.md`, que es la otra mitad de este trabajo).

Lee antes `docs/CONTEXTO.md`, `docs/BEBER-DEL-CENTRO-DE-DATOS.md`,
`docs/CENTRO-DE-DATOS-CONTRATO-2.md`, `docs/PERMISOS-DE-CARPETAS-AL-ENTRAR.md` y, de
`docs/contexto/PERSONAS.md`, lo de las empresas. De código: `js/centro-de-datos.js`,
`js/centro-de-datos-ver.js`, `js/permisos-carpetas.js`, `js/comprobacion-entrada.js` (función
`centroDeDatos`), `js/datos.js` (`LISTAS.EMPRESAS`, `cargarLista`), `js/datos-listas.js`,
`js/demo/disco.js`, `js/demo/datos-centro-de-datos.js` y `pruebas/centro-de-datos.mjs`.

**Esta fila no espera a la del Centro de datos.** El Gestor no entrega nada hasta que el índice del
Centro de datos dice que lo recibe (punto 3). Si esa fila todavía no está hecha, aquí queda todo
listo y probado con una carpeta de mentira, y empezará a entregar solo el día en que lo esté.

## Qué quiere Francisco

Las empresas y los proveedores del centro se escriben en el Gestor (Personas y empresas). Quiere
que estén también en el Centro de datos, para que cualquier otra aplicación los lea de allí sin
pedirle nada al Gestor. Hoy solo los usa el propio Gestor: se deja preparado.

### Decidido por Francisco (no se cambia)

1. **Las empresas se siguen escribiendo en el Gestor, como hoy.** El Gestor es su dueño. Nada
   cambia en «Personas y empresas», ni en `empresas.csv`.
2. **Se entregan seis datos, tal cual están escritos:** razón social, nombre comercial, NIF, persona
   de contacto, teléfono y correo. Es una sola lista, **sin marca de proveedor**. Si un día hace
   falta otro dato, se añade aquí y llega solo al Centro de datos.
3. **La entrega es automática.** Cada vez que la lista cambia, el Gestor deja la lista entera en el
   Centro de datos. No hay ningún botón que haya que pulsar.
4. **Lo único que le toca a una persona**, una vez en cada ordenador: dar permiso al navegador para
   escribir en la carpeta del Centro de datos. Un clic.
5. El Gestor no corrige nada antes de entregar. Lo que no cuadre (dos empresas con el mismo NIF) lo
   dice el Centro de datos como aviso.

### Decidido al escribir esta instrucción

1. **Solo entrega el ordenador que tiene señalada la carpeta «CENTRO DE DATOS» y permiso para
   escribir en ella.** El otro no hace nada ni avisa de nada.
2. **Se entrega cuando lo que hay es distinto de lo último entregado**, no cada vez que alguien
   guarda. Se mira al entrar y unos segundos después de cada cambio en las empresas. Así también
   llega lo que añadió el compañero desde un ordenador sin la carpeta.
3. **Lo último entregado se apunta en `_GESTOR/centro-de-datos.json`**, que comparten los dos
   ordenadores: ninguno repite la entrega del otro.
4. **El Gestor solo escribe un fichero en esa carpeta**, siempre el mismo:
   `entrada/ENTREGA empresas gestor-asuntos-ies.json`. Todo lo demás lo sigue solo leyendo.
5. **De tener empresas a no tener ninguna no se entrega sola.** Una lista vacía casi siempre es un
   Dropbox a medio sincronizar. Se dice en Ajustes y se entrega solo si alguien lo pide ahí.
6. **Lo que se entrega sale de una tabla**, una línea por dato, y el módulo vale para más de una
   lista: las Administraciones y los cargos (ideas 24 y 25 del Centro de datos) vendrán después por
   este mismo camino. Aquí solo se entregan las empresas.

## Lo que se sabe hoy

- **La lista** vive en `_GESTOR/datos/empresas.csv`: «Razón social», «Nombre comercial», «NIF»,
  «Contacto», «Teléfono», «Correo». La escriben `Datos.anadirALista`, `Datos.guardarEnLista` y
  `Datos.quitarDeLista` (`js/datos-listas.js`), por `ColaGuardado`. También cambia cuando se une una
  copia en conflicto de Dropbox o se recupera una copia.
- Hay ficheros antiguos sin la columna «Nombre comercial»: `cargarLista` lee por el título de la
  columna y ya lo resuelve (`nombre`, `nif`, `comercial` y `campos` de cada empresa).
- **La carpeta del Centro de datos** se señala en Ajustes → Este ordenador y se pide **en modo
  lectura** en tres sitios: al señalarla (`showDirectoryPicker`), en `CentroDeDatos.permiso` y, por
  ella, en `PermisosCarpetas` (al pulsar «Entrar») y en «Volver a dar permiso».
  `docs/BEBER-DEL-CENTRO-DE-DATOS.md` dice «el gestor solo lee esa carpeta»: con esta fila deja de
  ser verdad del todo, y hay que decirlo donde se dice.
- **El contrato del Centro de datos permite dejar ficheros en `entrada/`** (su regla 1 y su apartado
  7): él los recoge en unos minutos, los guarda y vacía `entrada/`. Si ya hay uno con ese nombre sin
  recoger, el nuevo lo sustituye.
- Al escribir un fichero, el navegador crea primero un temporal acabado en `.crswap` y lo renombra
  al cerrar. El Centro de datos no recoge esos temporales (su fila 23).
- `js/actualizar-copia.js` ya tiene una función de huella (`sha256Hex`, con `crypto.subtle`).

## El acuerdo con el Centro de datos (copia; la versión buena es `docs/23-EMPRESAS.md` de su repositorio)

Fichero `ENTREGA empresas gestor-asuntos-ies.json`, en `entrada/`, en UTF-8:

    { "entrega": 1, "conjunto": "empresas", "origen": "gestor-asuntos-ies",
      "generado": "2026-10-11T09:30:00+02:00", "hechoCon": [],
      "campos": [
        { "clave": "razonSocial", "etiqueta": "Razón social", "apartado": "Empresa", "tipo": "texto", "dueno": "gestor-asuntos-ies" },
        { "clave": "nombreComercial", "etiqueta": "Nombre comercial", "apartado": "Empresa", "tipo": "texto", "dueno": "gestor-asuntos-ies" },
        { "clave": "nif", "etiqueta": "NIF", "apartado": "Empresa", "tipo": "texto", "dueno": "gestor-asuntos-ies" },
        { "clave": "contacto", "etiqueta": "Persona de contacto", "apartado": "Contacto", "tipo": "texto", "dueno": "gestor-asuntos-ies" },
        { "clave": "telefono", "etiqueta": "Teléfono", "apartado": "Contacto", "tipo": "texto", "dueno": "gestor-asuntos-ies" },
        { "clave": "correo", "etiqueta": "Correo electrónico", "apartado": "Contacto", "tipo": "texto", "dueno": "gestor-asuntos-ies" } ],
      "registros": [
        { "id": "B00000000", "datos": { "razonSocial": "Papelería Inventada, S.L.", "nombreComercial": "La Pluma Azul",
                                         "nif": "B-00000000", "contacto": "Ana Prueba", "telefono": "600 000 000",
                                         "correo": "pluma@example.com" } },
        { "id": "sin-nif-reparaciones-de-mentira", "datos": { "razonSocial": "Reparaciones de Mentira" } } ] }

- **La entrega es siempre la lista entera.** Quien no viene en ella ya no está.
- **El `id`:** el NIF en mayúsculas, quitando todo lo que no sea letra o cifra. Sin NIF (o si tras
  limpiarlo no queda nada), `sin-nif-` seguido de la razón social sin tildes (la ñ queda como n), en
  minúsculas y con cada tramo que no sea letra o cifra convertido en un guion, sin guion al
  principio ni al final. Una empresa sin NIF cambia de `id` el día en que se le pone.
- Un dato vacío no se escribe. Los valores van tal como están escritos en el Gestor (el `nif` de
  `datos` no se limpia).
- El orden de los registros es el de la lista del Gestor (por razón social).
- Una lista con cero empresas es una entrega válida.
- **Dos empresas con el mismo `id` se entregan las dos**, cada una en su registro. No se juntan ni
  se quita ninguna: el aviso lo da el Centro de datos.

Y en `indice.json` del Centro de datos, cuando sabe recibirla:

    "recibe": [ { "conjunto": "empresas", "de": "gestor-asuntos-ies", "entrega": 1, "entero": true } ]

**Una aplicación no entrega a un conjunto que no esté en `recibe` con su nombre y `entrega: 1`.**

## Qué hay que hacer

### 1. El permiso para escribir

- `CentroDeDatos.permiso(dir, pedir)` **sigue pidiendo solo leer**: traer los listados tiene que
  seguir funcionando con solo ese permiso, exactamente como hoy.
- Función nueva `CentroDeDatos.permisoEscribir(dir, pedir)`, con `{ mode: 'readwrite' }`.
- **Donde hoy se pide el permiso con una pulsación, pasa a pedirse para leer y escribir**, en una
  sola petición: al señalar la carpeta (`showDirectoryPicker` con `mode: 'readwrite'`), en «Volver a
  dar permiso» y en `PermisosCarpetas` (al pulsar «Entrar»). Si la persona dice que no, se intenta
  quedar al menos con el de leer, como hoy, sin una segunda ventana si el navegador ya lo tenía.
- `PermisosCarpetas.estado('centro-de-datos')` sigue diciendo `con-permiso` con solo el de leer:
  nada de lo que hoy funciona pasa a pedir más. El de escribir se mira aparte.
- En «solo consultar» no se pide ni se escribe nada, como hoy.
- **Nunca se pide un permiso sin una pulsación.** Al entrar solo se mira (`queryPermission`).

### 2. Qué se entrega

Módulo nuevo `js/centro-de-datos-entregar.js` (`CentroDeDatosEntregar`).

- Una tabla de listas que se entregan. Hoy, una línea: conjunto `empresas`, fichero
  `ENTREGA empresas gestor-asuntos-ies.json`, de dónde sale (`empresas.csv`) y sus seis datos, cada
  uno con su `clave`, `etiqueta`, `apartado`, `tipo` y el título de su columna. **Un dato nuevo es
  una línea de esa tabla.**
- La lista se lee **del fichero, en ese momento**, sin fiarse de lo guardado en memoria, y dentro de
  `ColaGuardado.poner('empresas.csv', …)`, para no leerla a medio guardar.
- Se monta el JSON del acuerdo, con el `id` de cada empresa hecho como dice el acuerdo y `generado`
  en hora de Madrid con su desfase.
- **La huella de los datos** es la de `campos` y `registros` (sin `generado`), con la misma función
  de huella de `js/actualizar-copia.js` (sácala a un sitio común si hace falta, sin cambiar lo que
  hace). Sirve para saber si hay algo nuevo que entregar.

### 3. Cuándo se entrega

Se mira en dos momentos:

- **Al entrar**, una vez por sesión, después de que termine `CentroDeDatos.traer` (para no leer el
  índice dos veces ni pisarse con él).
- **Unos 5 segundos después del último cambio en las empresas** (alta, cambio o baja). Engánchalo
  con el mínimo de líneas en `js/datos-listas.js`: una lista de avisos «ha cambiado esta lista» a la
  que este módulo se apunta, sin que `datos-listas.js` sepa nada del Centro de datos.

Se entrega **solo si se cumplen todas**:

1. no está en «solo consultar» y no hay un guardado en marcha (si lo hay, espera y reintenta, como
   `CentroDeDatos.alEntrar`);
2. hay carpeta señalada, con permiso de leer y de escribir (mirado sin pedir);
3. el índice se lee, su `contrato` no es mayor que el que conoce el Gestor y no está `ocupado`;
4. el índice trae `recibe` con `conjunto: "empresas"`, `de: "gestor-asuntos-ies"` y `entrega: 1`;
5. `empresas.csv` existe y se ha leído sin error;
6. la huella de los datos es distinta de la última apuntada;
7. no es el caso «antes había empresas y ahora no hay ninguna» (decisión 5), salvo que se haya
   pedido desde Ajustes.

Si falta la 2, la 3 o la 4, no se hace nada y no sale ningún aviso: se ve en Ajustes (punto 5).

### 4. Escribir y apuntar

- **Una sola función escribe en la carpeta del Centro de datos**, y solo sabe escribir en `entrada/`
  un fichero cuyo nombre empiece por `ENTREGA ` y acabe en ` gestor-asuntos-ies.json`. Si `entrada/`
  no existe, no la crea: falla y lo dice.
- Se escribe entero y se cierra. Si falla, no se apunta nada, se dice una vez por sesión en ámbar
  (`U.accesorio`) y se vuelve a intentar en la siguiente entrada.
- Después se apunta en `_GESTOR/centro-de-datos.json`, por `ColaGuardado` y `Copias.guardar`, junto
  a `tomado` y sin tocarlo:

      "entregado": { "empresas": { "huellaDatos": "…", "registros": 42, "generado": "…",
                                   "entregadoEl": "…", "entregadoPor": "Francisco" } }

  Un apunte nunca se sustituye por otro de `generado` anterior. `_esquema` no cambia: es añadir.
- Una entrega que sale bien **no avisa de nada**: no hay nada que ver.

### 5. Lo que se ve

Solo en Ajustes → Este ordenador → «Carpeta del Centro de datos» (`#bloque-centro-de-datos`), una
línea más, en `js/centro-de-datos-ver.js`. Dice una de estas cosas:

- «Empresas entregadas al Centro de datos: 42, el 11-oct-2026 (Francisco).»
- «Las empresas las entrega el otro ordenador. Última entrega: 42, el 11-oct-2026.» (sin carpeta
  señalada aquí, con algo apuntado)
- «El Centro de datos todavía no recibe las empresas.» (el índice no trae `recibe` con ellas)
- «Falta el permiso para escribir en esta carpeta: las empresas no se entregan.» con el botón «Dar
  permiso».
- «La lista de empresas está vacía y antes no lo estaba: no la he entregado.» con el botón «Entregar
  la lista vacía».

Y un botón pequeño, **«Entregar ahora»**, que hace lo mismo que al entrar y contesta siempre
(«Entregadas 42 empresas» o «No hay nada nuevo que entregar»). Es una reserva, como «Traer ahora
del Centro de datos».

**La comprobación al entrar** (`centroDeDatos` en `js/comprobacion-entrada.js`): con la carpeta
señalada, el índice leído, `recibe` con las empresas y sin permiso de escribir, la fila sale en
**ámbar**: «Falta el permiso para escribir: las empresas no se entregan al Centro de datos.», con
«Arreglarlo», que pide ese permiso. En los demás casos, lo de hoy.

### 6. La copia de pruebas

- `js/demo/datos-centro-de-datos.js`: la carpeta de mentira trae `entrada/` y un índice con
  `recibe` (con `?recibe=0`, sin él).
- `js/demo/datos.js`: al menos cuatro empresas inventadas, una sin NIF y dos con el mismo NIF.
- En la copia de pruebas la carpeta de mentira ya da permiso de escribir (con `?sinescribir=1`, no).

### 7. Novedades y documentos

- `js/novedades.js`, una línea, en el mismo commit del código: «La lista de empresas se entrega
  sola al Centro de datos. La primera vez, el navegador pide permiso para escribir en su carpeta.»
- `docs/BEBER-DEL-CENTRO-DE-DATOS.md`: donde dice «el gestor solo lee esa carpeta», añadir que desde
  esta fila escribe un único fichero en `entrada/`, y enlazar este documento.
- `docs/CENTRO-DE-DATOS-CONTRATO-2.md`: añadir `recibe`, los conjuntos que se entregan enteros y el
  conjunto `empresas`. Cópialo de `docs/CONTRATO.md` de `centro-de-datos-ies` si su fila 23 ya está
  hecha; si no, copia el acuerdo de este documento y dilo en la nota de la fila.
- `docs/LOS-DATOS-DEL-CENTRO.md`: en llano, que la lista de empresas y proveedores se copia además
  al Centro de datos (la carpeta privada de Drive de la cuenta del instituto de Francisco, a la que
  solo entran él y su compañero), y que es lo único que el Gestor escribe allí.
- `docs/CONTEXTO-CORTO.md` (la línea del Centro de datos de la sección 5, **sustituyendo**; vigila
  el tope de 40.000 caracteres), `docs/contexto/PERSONAS.md`,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`.

## Ficheros que se tocan

Nuevos: `js/centro-de-datos-entregar.js` y `pruebas/centro-de-datos-entregar.mjs`.

Se cambian, con el mínimo de líneas: `index.html` (el `<script>`), `js/centro-de-datos.js`
(`permisoEscribir`, el modo al señalar y que `leerApuntes` conserve `entregado`),
`js/centro-de-datos-ver.js`, `js/permisos-carpetas.js`, `js/comprobacion-entrada.js`,
`js/datos-listas.js`, `js/demo/datos-centro-de-datos.js`, `js/demo/datos.js`, `js/demo/disco.js` si
hace falta, y `js/novedades.js`.

**No tocar** `js/carpetas.js` ni `js/nucleo.js`. Ningún fichero de `js/` puede pasar de 600 líneas
al terminar: `js/centro-de-datos.js` tiene 370.

## No se hace en esta fila

- Leer empresas del Centro de datos: el Gestor es su dueño y las tiene en `empresas.csv`.
- Las Administraciones y los cargos (ideas 24 y 25 del Centro de datos): cada una tendrá su fila.
- Ningún cambio en «Personas y empresas», ni en las columnas de `empresas.csv`.
- Enseñar aquí los avisos que dé el Centro de datos sobre las empresas.

## Cuidado

- **El Gestor no puede escribir en esa carpeta nada más que su entrega.** Ni `indice.json`, ni
  `listados/`, ni `hecho/`. La prueba lo comprueba mirando la carpeta entera antes y después.
- **Lo que hoy funciona con el permiso de leer sigue funcionando con solo ese permiso.** Un
  ordenador donde la persona no da el de escribir trae los listados como hoy.
- **Nada de esto puede retrasar la entrada ni dejar un aviso rojo.** Si entregar falla, el Gestor
  sigue como si nada y lo dice en Ajustes.
- **Son datos personales** (hay autónomos: su NIF es su DNI). Solo van a esa carpeta. En las
  pruebas y en la copia de pruebas, empresas inventadas con NIF que no existan.
- Dos ordenadores con la carpeta: el segundo ve la huella apuntada por el primero y no repite. Si
  los dos entregan a la vez, gana el apunte de `generado` más reciente.
- En la copia sin internet (`file://`) tiene que funcionar igual. Si en ese navegador no hay con
  qué hacer la huella, no se entrega y la línea de Ajustes lo dice.

## Qué decirle a Francisco al terminar

En dos o tres frases: que en el ordenador donde tiene señalada la carpeta del Centro de datos, la
próxima vez que pulse «Entrar» el navegador le pedirá permiso para **editar** esa carpeta, y tiene
que aceptarlo una vez; que a partir de ahí la lista de empresas se entrega sola; y que lo verá en
el Centro de datos, en la línea «Empresas: …», cuando la fila 23 de su cola esté hecha.

## Cómo sabemos que está bien

Prueba nueva `pruebas/centro-de-datos-entregar.mjs`, con la carpeta de mentira, calcada de
`pruebas/centro-de-datos.mjs`:

1. Sin carpeta señalada, o con `recibe` sin las empresas, o sin permiso de escribir, o en «solo
   consultar»: no se escribe nada en ningún sitio, no sale ningún aviso y se entra como hoy.
2. Con todo en regla y cuatro empresas: al entrar aparece `entrada/ENTREGA empresas
   gestor-asuntos-ies.json` con `entrega: 1`, `conjunto`, `origen`, `hechoCon: []`, los seis
   campos con su `dueno` y cuatro registros en el orden de la lista.
3. Los `id`: «B-00000000» da `B00000000`; «b00000000 » da lo mismo; la empresa sin NIF «Reparaciones
   de Mentira» da `sin-nif-reparaciones-de-mentira`; «Añil & Cía., S.L.» sin NIF da
   `sin-nif-anil-cia-s-l`. El `nif` de `datos` sale tal como está escrito.
4. Una empresa que solo tiene razón social lleva solo `razonSocial` en `datos`. Las dos con el
   mismo NIF salen las dos, con el mismo `id`.
5. Un `empresas.csv` antiguo, sin la columna «Nombre comercial», se entrega bien y sin esa clave.
6. Queda apuntado `entregado.empresas` en `_GESTOR/centro-de-datos.json`, y `tomado` sigue igual.
7. Entrar otra vez no escribe nada. Con el fichero de `entrada/` ya recogido (borrado), tampoco.
8. Dar de alta una empresa, cambiarle el teléfono o quitarla: a los pocos segundos hay una entrega
   nueva con la lista de ese momento. Tres cambios seguidos dan una sola entrega.
9. Un cambio hecho «por el otro ordenador» (el CSV cambia en el disco sin pasar por la aplicación):
   se entrega en la siguiente entrada.
10. De cuatro empresas a ninguna: no se entrega, y Ajustes lo dice con su botón; al pulsarlo, se
    entrega la lista vacía. Con un `empresas.csv` que no se puede leer, no se entrega.
11. Si la escritura falla, no se apunta nada, se entra con normalidad y la siguiente entrada lo
    vuelve a intentar.
12. **Solo se ha escrito ese fichero:** el resto de la carpeta de mentira (índice, `listados/`,
    `hecho/`) es idéntico antes y después, byte a byte.
13. Con solo el permiso de leer, `CentroDeDatos.traer` trae los listados como antes, y
    `PermisosCarpetas.estado('centro-de-datos')` da `con-permiso`.
14. `npm test -- centro-de-datos comprobacion permisos solo-consulta datos` sigue en verde.

En la copia de pruebas (`?demo=1&auto=1`), lo que mira el revisor:

15. Ajustes → Este ordenador → «Carpeta del Centro de datos»: sale la línea «Empresas entregadas al
    Centro de datos: N, el <hoy> (…)», con N igual al número de empresas de «Personas y empresas».
16. Al dar de alta una empresa nueva en «Personas y empresas» y volver a ese bloque pasados diez
    segundos, la línea dice N + 1. No ha salido ningún aviso por entregar.
17. «Entregar ahora» contesta «No hay nada nuevo que entregar».
18. Con `?demo=1&auto=1&recibe=0`: la línea dice «El Centro de datos todavía no recibe las
    empresas.» y no hay botón de permiso.
19. Con `?demo=1&auto=1&sinescribir=1`: la línea dice que falta el permiso para escribir, con «Dar
    permiso», y la «Comprobación al entrar» saca la fila «Carpeta del Centro de datos» en ámbar con
    esa frase. Los listados del Centro de datos se han traído igual.
20. «Personas y empresas» se ve y funciona exactamente como antes.

Para Francisco, lo que solo se ve con datos reales, en `docs/COMPROBAR-A-MANO.md`:

21. [SOLO FRANCISCO] En el ordenador con la carpeta del Centro de datos señalada: al pulsar
    «Entrar», el navegador pide permiso para editar la carpeta; aceptarlo. En Ajustes → Este
    ordenador → «Carpeta del Centro de datos» tiene que salir «Empresas entregadas al Centro de
    datos: …» (si dice «todavía no recibe las empresas», falta la fila 23 del Centro de datos).
    Pasado un cuarto de hora, la página del Centro de datos tiene que decir «Empresas: …» con el
    mismo número.
