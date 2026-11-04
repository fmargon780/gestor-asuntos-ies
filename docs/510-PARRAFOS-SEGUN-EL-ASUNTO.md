# 510 — Párrafos de las plantillas que salen o no según un dato del asunto

## Lo que escribió Francisco

Al diseñar el tipo de asunto de la baja por traslado al extranjero (idea 511), el 4-nov-2026:

> También había que analizar cómo gestionar las distintas posibilidades que da la resolución, como
> por ejemplo, el tema de si se ha iniciado o no el protocolo de absentismo.

Entre usar campos de lista cuyas opciones son frases enteras (un atajo) o párrafos que salen o no
según un dato, eligió los párrafos («2»). Después:

> Sería muy interesante también para las plantillas de correos. También me gustaría ver como sería
> el sistema de indicar esa información en el asunto para que se tenga en cuenta en las plantillas.

Y, sobre un botón para poner la marca sin escribirla a mano: «1» (en esta misma idea). Sobre su
nombre: «no me gusta el nombre "Párrafo que sale si ..." No me parece profesiona», «Ni insertar
hueco», «1» (cambiarlo en esta idea) y:

> Podemos tener una tarjeta llamada Insertar que tenga dentro dos botones: Campo variable y Texto
> condicional.

## Lo que entendió Claude (acordado con Francisco el 4-nov-2026)

**Nombres, iguales en toda la app** (Francisco: «cuida la coherencia en la nomenclatura»):
- **Campo variable**: lo que hasta ahora se llamaba «hueco» en los botones y menús.
- **Texto condicional**: un párrafo que sale o no según un campo del asunto.
- **Campo del asunto**: los campos propios del tipo, los de la tarjeta «Campos del asunto».

**Cómo funciona**
- Un párrafo de una plantilla puede llevar delante una **marca**: `{si:Campo=Valor}`. Por
  ejemplo, `{si:Protocolo de absentismo iniciado=Sí}`. «Campo» es un campo de lista del tipo de
  asunto (los campos de lista existen hoy) y «Valor» una de sus opciones.
- Vale para las **plantillas de Word** y para las **plantillas de correo** (también su texto para
  Séneca).
- Al generar el Word o el correo, la marca **nunca sale** en el resultado. El párrafo sale si el
  campo del asunto tiene ese valor y desaparece entero si tiene otro.
- Si el campo del asunto **está vacío**, salen **todos los párrafos que dependen de él**, en
  amarillo, con «[falta: Campo]» delante, igual que hoy un campo variable sin rellenar. Así nadie
  firma sin haber elegido cuál va.
- La ventana de hoy «Faltan datos para este documento» también pide esos campos vacíos, cada uno
  con un desplegable con sus opciones. Lo elegido ahí vale solo para ese documento, como hoy.
- Si una marca nombra un campo que el tipo no tiene, o un valor que no está en su lista, el párrafo
  sale en amarillo con «[falta: Campo]», igual que un campo vacío.

**Plantillas de correo**
- Donde hoy está el botón «Insertar hueco» (editor de plantillas de correo, guía y Ajustes del
  centro), hay un recuadro destacado en azul con el título **«Insertar»** y dos botones dentro:
  - **«Campo variable»**: es el antiguo «Insertar hueco», con otro nombre; hace lo mismo que hoy.
  - **«Texto condicional»**: el botón nuevo, solo donde se escribe una plantilla de correo (también
    su texto para Séneca).
- «Texto condicional» abre un cuadro con dos desplegables, «Campo del asunto» (solo los campos de
  lista del tipo de la plantilla) y «Valor» (sus opciones), y los botones «Cancelar» y «Poner la
  marca».
- «Poner la marca» la escribe al principio del párrafo donde está el cursor. En un correo, un
  párrafo es el texto entre dos líneas en blanco; si el cursor está en una línea en blanco, cuenta
  el párrafo de encima. Si el párrafo ya tenía una marca, se cambia por la nueva. Debajo sale:
  «Marca puesta: el párrafo solo saldrá si «Campo» es «Valor».».

**Plantillas de Word**
- En «Retocar» (plantillas de Word), el menú que sale al seleccionar un trozo del documento:
  - «Cambiar por un dato…» pasa a llamarse **«Cambiar por un campo variable…»** (hace lo mismo).
  - Al final, separado y en azul, la opción nueva **«Texto condicional…»**. Abre el mismo cuadro
    que en los correos y pone la marca al principio del párrafo donde está lo seleccionado; si ya
    tenía una, la cambia. El documento enseña la marca en morado.
- La marca también se puede seguir escribiendo a mano en el propio Word.

**En los dos**
- Si el tipo no tiene campos de lista, el cuadro lo dice en vez de enseñar desplegables vacíos.
- Nada más cambia: lo que hacen «Campo variable» y las demás opciones de «Retocar», y la forma de
  generar, siguen como hoy.

## Pantalla de prueba (aprobada el 4-nov-2026)

- `docs/pantallas/510.html` · https://claude.ai/artifact/PVwpnmwyiPQ4GyB8nDDqYv
- Cinco pestañas: el Word que sale, el correo que sale, la plantilla con sus marcas en morado, el
  editor de la plantilla de correo con el recuadro «Insertar» y «Retocar» de la plantilla de Word
  con la opción nueva del menú. Los tres desplegables de la izquierda son datos inventados del tipo
  de la idea 511.

## Qué NO se hace en esta tarea

- El tipo de asunto de la baja por traslado al extranjero, con sus plantillas: idea 511.
- Condiciones con «o», «y» o «distinto de»: no se pidieron.
- Cómo se meten y se rellenan los campos en el asunto: tema aparte, idea 512.
- Cambiar la palabra «hueco» en textos que no son botones ni menús (ayudas largas, historia): si
  aparece en un botón, un menú o un aviso que ve la usuaria, sí se cambia por «campo variable».

## Notas técnicas de Claude

- Correos: `Plantillas.rellenar` (js/plantillas.js) quita o deja los párrafos con marca **antes**
  de resolver los huecos. Párrafo = bloque separado por línea en blanco. Comparar campo y valor con
  `U.normalizar` (sin tildes ni mayúsculas), como el resto de huecos. El valor del campo sale del
  mismo sitio que `{campo:...}`.
- Word: en `js/docx-sustituir.js`, por cada `<w:p>` se junta su texto (la marca puede venir partida
  en varios `w:r`); si empieza por `{si:…}`, se quita el párrafo entero o solo la marca. El
  amarillo de «[falta: …]» es el que ya usa la app para los huecos sin dato.
- Los campos vacíos de las marcas entran en la lista de `WordFaltan.preguntar`; para ellos el
  recuadro es un `<select>` con los valores del campo de lista.
- «Retocar»: `js/plantilla-retocar-pantalla.js` (opciones del menú) y `js/plantilla-retocar.js`
  (un cambio nuevo de tipo `condicion`, que se aplica desde el original como los demás y se puede
  deshacer igual).
- El recuadro «Insertar» sustituye al botón en todos los sitios donde hoy se pinta «Insertar hueco»
  (`js/plantillas-ajustes.js`, `js/guias-paso-bloques.js`, `js/ajustes-centro.js`, y lo que repita
  ese texto en ayudas o novedades). «Texto condicional» va junto a `js/huecos-buscador.js` y lanza
  un evento `input` al terminar, como el de huecos.
- Pruebas automáticas: un párrafo que sale, uno que desaparece, dato vacío, dato inexistente y
  marca partida en varios tramos del Word.

## Cómo lo comprueba el segundo revisor

- Una plantilla de correo con `{si:Campo=Sí}` y `{si:Campo=No}`: con «Sí» sale solo el primero,
  sin la marca.
- Lo mismo con una plantilla de Word.
- Con el campo vacío salen los dos párrafos en amarillo con «[falta: Campo]».
- La ventana «Faltan datos» pide ese campo con un desplegable; lo elegido decide el párrafo.
- Una marca con un campo o un valor que no existe sale en amarillo con «[falta: Campo]».
- No queda ningún «Insertar hueco»: en su sitio, el recuadro «Insertar» con «Campo variable», que
  hace lo mismo que antes.
- «Texto condicional» está en el recuadro de las plantillas de correo, ofrece solo los campos de lista
  del tipo y sus valores, pone la marca al principio del párrafo del cursor y cambia una marca
  que ya hubiera.
- En «Retocar», el menú dice «Cambiar por un campo variable…» y tiene «Texto condicional…» al final;
  pone la marca en el párrafo de lo seleccionado y se puede deshacer.
- Ningún botón, menú ni aviso que vea la usuaria dice ya «hueco».
- Un tipo sin campos de lista: el cuadro lo dice.
- Las plantillas sin marcas salen exactamente igual que antes.
- Compararlo con `docs/pantallas/510.html`.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
