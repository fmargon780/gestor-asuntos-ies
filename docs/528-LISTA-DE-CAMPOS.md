# 528 — Lista única de campos y ventana de elegir

## Lo que escribió Francisco

Idea 512 (tema 518), tal cual:

> Tema: cómo se meten en un asunto los campos que luego usan las plantillas (campos variables y los datos de los textos condicionales) para que se rellenen; Francisco quiere profundizar en ello. Sale del diseño de la fila 510.

En el diseño, el 5-nov-2026:

> Creo que lo que yo pretendía cuando escribí esta idea y que posiblemente no estuve muy lúcido, era que diseñaramos un sistema que nos permita elegir los campos (de nuestra base de datos, calculados, manuales o de otro tipo), que nos van a servir después en las plantillas de documentos y correos o de otras herramientas que tengamos que pudieramos configurar. En definitiva un sistema para manejar todos los campos posibles que podamos tener y necesitar y usarlos allá donde nos haga falta de la forma más sistemática, ágil y ordenada.

> Ten en cuenta que no valdrá solo un buscador normal para elegir los campos a insertar

> La creación de campos a partir de campos anteriores también debe ser muy potente

> Tengo experiencia en este campo y sé que es fundamental saber la tabla de origen del dato. [...] si el Número de Identificación Escolar me viene del archivo RegAlum a través de centro de datos esa es un información muy útil

> Imaginate siempre en la situación de que estamos trabajando en un asunto concreto y nos damos cuenta de que queremos generar un documento, correo, tener una información disponible para consulta en el mismo, o usarlo para una herramienta (Listados, cálculos, etc). [...] En ese momento y lugar donde tenemos la necesidad del campo es cuando tenemos que decidir dónde nos tiene que pedir el proceso el dato. Muchos de esos datos ya nos vendrán puestos.

> Entonces la idea es que si quiero una nueva tarea, en vez de dejarme escribir cualquier nombre y asignarle una acción, me dejará elegir de entre las tareas que ya existan en nuestro sistema y además si no hay la que yo quiero, crear una nueva y la configuro aquí mismo, incluyendo sus plantillas? Y lo mismo con los hitos?

> Si hay dos expulsiones al Aula de convivencia generos dos asuntos distintos del mismo tipo para el mismo alumno. Los asuntos no son contenedores en el tiempo [...] Se hace un asunto por cada expulsión. Y esta es la norma general.

## Lo que entendió Claude (acordado con Francisco el 5-nov-2026)

El tema 518 se parte en cuatro, en este orden: 528, 529, 530 y 531. Esta es la primera. Si algo cambia el texto de arriba, manda esto.

1. **Una sola lista.** Ajustes tiene una pantalla «Campos» con todos los datos posibles, de cualquier origen, una línea por dato. Se ven: Campo, Grupo, De dónde sale, Ejemplo, Dónde se pide y en cuántos sitios se usa.
2. **Grupo** dice de qué trata el dato: Persona, Tutores, Asunto, Centro, Firmantes. **No** hay grupos «Calculados», «Manuales» ni «Tablas».
3. **De dónde sale** dice cómo llega: Centro de datos, El asunto, Ajustes del centro, Tabla de datos, Calculado, Manual. Debajo, la tabla y la columna de origen, por ejemplo «RegAlum › Nº Id. Escolar».
4. **Al pulsar un campo**, a la derecha: el camino entero («Centro de datos → RegAlum → columna Nº Id. Escolar»), cuándo se recibió el fichero, un ejemplo y dónde se usa. Quien lo pulsa elige arriba con qué persona salen los ejemplos.
5. **Filtros:** por grupo, por origen o por tabla. El buscador encuentra por campo, tabla o columna.
6. **Campo manual:** se crea con nombre, grupo y clase de dato (texto, lista, fecha, importe, número); si es lista, sus opciones. **Cuándo se pide no se decide en el campo**, lo decide cada tipo de asunto. En su detalle sale «Dónde se pide», solo para leer.
7. **Quitar** un campo manual o calculado solo se puede si no se usa.
8. **Ventana de elegir.** El botón «Campo variable» de las plantillas abre una ventana con: buscador en todos los grupos; los más usados en ese tipo de asunto; los grupos a la izquierda; en el centro los campos del grupo, cada uno con un ejemplo y su tabla. Primero salen los que sirven para la clase de persona del tipo; los demás, con «Ver N de otra clase de persona».
9. **Crear desde la ventana:** «+ Campo manual nuevo» y «+ Crear a partir de otros», sin salir de la plantilla; al terminar, el campo queda insertado y en la lista para siempre.
10. **Nunca se escribe a mano** el nombre de un campo nuevo en una plantilla: se elige o se crea. Las plantillas actuales siguen funcionando igual, y lo que ya usan (también los nombres escritos a mano) entra en la lista.

**Lo que desaparece o se sustituye:** el buscador actual de «Campo variable»; el catálogo con pestañas De la ficha, Míos y Calculados pasa a ser esta lista.

## Pantalla de prueba (aprobada el 5-nov-2026)

- `docs/pantallas/518.html` · https://claude.ai/artifact/EW1cjJnK9PrLBJ97wMAvBy
- Es la misma pantalla para las filas 528, 529, 530 y 531. Esta fila programa solo lo de arriba: lista de campos y ventana de elegir.
- Sus datos son inventados: tablas como «Calificaciones» y «Faltas de asistencia» y algunas columnas de tutores no existen. Salen las tablas y columnas que traiga de verdad el Centro de datos.

## Qué NO se hace en esta tarea

- Crear campos por pasos: fila 529. «+ Crear a partir de otros» abre el editor de hoy hasta que esté esa fila.
- Pedir datos en las tareas y guardarlos en el asunto: fila 530.
- Tareas e hitos comunes: fila 531.

## Notas técnicas de Claude

- Hoy hay cuatro fuentes: `HUECOS` de `js/plantillas.js`; `Campos.catalogoDeCategoria` y `_GESTOR/campos.json` (`js/campos.js`, `js/campos-catalogo.js`); tablas de datos (`{{DATO tabla: columna}}`, `js/tablas-datos*.js`); `{campo:Nombre}` a mano. La lista las reúne con una función pura; no hace falta mover sus datos ni cambiar la forma de las marcas en las plantillas.
- De cuándo es un fichero: `DatosQueTengo.fechaReal`. La lista de personal siempre por `Datos.cargarPersonal`.
- Para ofrecer plantillas y saber dónde se usa un campo: `Plantillas.documentosDeTipo` y los textos de las plantillas.
- `js/huecos-buscador.js` se sustituye manteniendo `HuecosBuscador.montar`. Cuadros con la regla común `.capa > .cuadro`. Ningún fichero de más de 600 líneas.
- Textos con `docs/VOCABULARIO.md`. Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- La pantalla «Campos» lista datos de todos los orígenes, con las columnas del punto 1.
- Grupos: solo los cinco del punto 2. Un calculado y un manual salen en su grupo por tema.
- Un campo de RegAlum muestra tabla y columna, y su detalle el camino y la fecha del fichero.
- El filtro por tabla y el buscador por «regalum» encuentran sus campos.
- Crear un campo manual de lista: sale en la lista, sin ningún ajuste de cuándo se pide.
- Un campo en uso no deja quitarse; uno sin usar sí.
- «Campo variable»: los más usados cambian con el tipo; los grupos filtran; el buscador mira todos; los de otra clase salen plegados; cada campo lleva ejemplo y tabla.
- Crear un campo manual desde la ventana lo inserta en la plantilla.
- Una plantilla antigua con `{campo:Nombre}` a mano sigue saliendo igual.
- [SOLO FRANCISCO] Con los listados reales, tablas y columnas son las de verdad.

## Revisión y respuestas durante el trabajo

- **Segundo revisor, 5-nov-2026 (primera vuelta; comparó con el texto, lo entendido y `docs/pantallas/518.html`):**
  - Puntos 1, 2, 3, 5, 6, 8 y 9: COINCIDE (lista con las seis columnas y cinco grupos; origen con tabla › columna; filtros y buscador; manual sin ajuste de «cuándo se pide»; ventana con grupos, buscador en todos, «Ver N de otra clase de persona», ejemplo y tabla; crear desde la ventana lo inserta).
  - Punto 4 NO COINCIDÍA: faltaba la fecha del fichero, y «Grupo» y «Curso» salían «sin dato». Corregido.
  - Punto 7 NO COINCIDÍA: «Se usa en: todavía no se usa» junto a «No se puede quitar». Corregido (los tipos que lo piden cuentan como uso).
  - Punto 10 NO COINCIDÍA: elegir la columna «Nº Id. Escolar» dejaba un campo manual fantasma duplicado. Corregido (una columna que ya sale con otro nombre no se repite).
  - Móvil (390 px): la sección ensanchaba la página. Corregido.
  - Escape, flechas y Enter, consola sin errores, plantilla antigua con `{campo:Nombre}`: COINCIDE.
  - NO LO HE PODIDO VER (solo Francisco): tablas y columnas con los listados reales.
- **Segunda vuelta del revisor (comprobó solo lo corregido):** fecha del fichero («Fichero copiado aquí el …» en la demo, sin apunte de Séneca), ejemplos de Grupo y Curso, «Ejemplos con» sin repetidos, sin duplicado, 390 px sin desbordar y «Se usa en» con el tipo: todo COINCIDE.
- **Lo que hace la app y el texto no pide** (se deja): en el detalle, la marca que se escribe en la plantilla; confirmación antes de quitar un campo.
- **Aviso de Claude:** una columna de fichero sin equivalente (p. ej. otra columna del RegAlum) se inserta como `{campo:Columna}` y solo sale rellena si el tipo de asunto la lleva como campo; es como funcionaba ya, y lo resolverá la fila 530.
- **Pruebas:** la nueva `pruebas/lista-de-campos.mjs` y las cinco antiguas adaptadas pasan. `npm test` entero no arranca en esta sesión (fallo de `undici` al arrancar, ya conocido); se pasaron 93 pruebas de las áreas tocadas con un servidor propio: 85 verdes; de las 8 que fallan, 3 pasan a solas (carga) y las otras 5 fallan igual en `main` sin este cambio (`cambiar-tipo-y-guia`, `campo-desde-el-asunto`, `campos`, `convertir-en-plantilla-pdf-pantalla`, `nuevo-asunto-categoria-guia`, `tipo-en-linea-al-cambiar`).
