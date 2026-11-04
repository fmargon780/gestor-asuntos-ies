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

- Segundo revisor (4-nov-2026): COINCIDE. Correo con `{si:Campo=Sí}` / `{si:Campo=No}` y asunto de la demo con «Sí»: sale solo el párrafo del «Sí», sin la marca (con «No», solo el otro; sin tocar la línea en blanco de más).
- Segundo revisor (4-nov-2026): COINCIDE. Word (docx montado, marca partida en tres tramos): sale solo el párrafo que toca, sin marca, el otro desaparece (`pruebas/texto-condicional.mjs`, que he ejecutado y pasa). No he abierto el .docx en Word real, solo he mirado su XML.
- Segundo revisor (4-nov-2026): COINCIDE. Campo vacío: salen los dos párrafos con «[falta: Protocolo de absentismo iniciado]» delante (correo comprobado por mí en la página; en el Word, 4 marcas de amarillo = los dos párrafos, y el campo entra en `faltan`).
- Segundo revisor (4-nov-2026): COINCIDE. «Faltan datos para este documento» pide el campo de lista con un desplegable («—», «Sí», «No») y el resto con una casilla normal; lo elegido decide el párrafo de ese documento.
- Segundo revisor (4-nov-2026): COINCIDE. Campo que el tipo no tiene («Inventado») y valor que no está en la lista («Quizá») salen con «[falta: Campo]» delante, tanto con el campo vacío como con «Sí» o «No».
- Segundo revisor (4-nov-2026): COINCIDE. En el editor de plantillas de correo ya no hay «Insertar hueco»: hay un recuadro con el título «Insertar» y los botones «Campo variable» (abre el buscador de siempre, «Buscar un campo variable…») y «Texto condicional». No he abierto a mano el recuadro de la guía ni el de Ajustes del centro; solo he visto en el código que usan el mismo recuadro (sin «Texto condicional» en el de plantillas de Word, que no se escribe ahí).
- Segundo revisor (4-nov-2026): COINCIDE. «Texto condicional» ofrece solo los campos de lista del tipo y sus valores (con otro campo de texto en el tipo no sale); Cancelar no cambia nada; «Poner la marca» la escribe al principio del párrafo del cursor; una segunda vez la cambia (no añade otra); el aviso es exactamente «Marca puesta: el párrafo solo saldrá si «Protocolo de absentismo iniciado» es «Sí».» (la pantalla de prueba añade detrás «Si el párrafo ya tenía una marca, se cambia por la nueva.»; la app no lo escribe, diferencia pequeña).
- Segundo revisor (4-nov-2026): COINCIDE. «Retocar» (plantilla de Word «Aviso de revisión»): el menú es «Cambiar por un campo variable…», «Cambiar por otro texto…», «Esto se pregunta cada vez», «Quitar del documento», «Quitar el párrafo entero» y, separado y en azul, «Texto condicional…». Pone la marca en morado al principio del párrafo de lo seleccionado, deja una línea en «Lo que has cambiado» (con ✕ para deshacer; la repetición cambia la marca, probado por `pruebas/texto-condicional-pantalla.mjs`, que pasa).
- Segundo revisor (4-nov-2026): NO COINCIDE (parcial). Ningún botón/menú/aviso de las pantallas pedidas (editor de correo, buscador, cuadro «Texto condicional», «Retocar», «Faltan datos», tarjeta de Plantillas, Ajustes) dice «hueco» (lo he rastreado en el texto, `title`, `placeholder` y `aria-label` visibles). Pero quedan estas con la palabra a la vista de la usuaria: (a) `js/plantillas-ajustes.js` ~línea 457, en el cuadro de correo «Guardar como plantilla nueva» (el que lleva el recuadro «Insertar»): «He cambiado estos datos por su hueco. Revísalos:» (es un aviso visible; el texto dice que los avisos se cambian); (b) `index.html` línea 790, subtítulo del bloque «Datos del centro y firma»: «Lo que rellena los huecos de correos y documentos»; (c) tooltips de `js/ayudas.js` líneas 354 y 475 («Pega el texto en el hueco…», «Usa este texto en el hueco.»), probablemente de otro contexto. Las novedades antiguas (`js/novedades.js`) también dicen «hueco», eso es historia y vale.
- Segundo revisor (4-nov-2026): COINCIDE. Tipo sin campos de lista: el cuadro dice «Este tipo de asunto no tiene campos de lista. Un texto condicional necesita un campo de lista del asunto (por ejemplo, «Sí» o «No»): créalo en los campos del tipo, en Ajustes.», sin desplegables, con el botón «Cerrar».
- Segundo revisor (4-nov-2026): COINCIDE. Plantillas sin marcas salen igual que antes (`Hola {nombre}.\n\nAdiós.` → texto normal, `faltan` vacío; el Word sin marcas no cambia en los tests de la fila). No he comparado byte a byte un Word real antes/después del cambio.
- Segundo revisor (4-nov-2026): COINCIDE con `docs/pantallas/510.html` en nombres («Insertar», «Campo variable», «Texto condicional», «Campo del asunto», «Valor», «Cancelar», «Poner la marca», «Cambiar por un campo variable…», «Texto condicional…» al final y en azul), en el recuadro azul con título y en el cuadro; salvo la frase añadida del aviso (arriba) y que la leyenda del cuadro en «Retocar» dice «donde está el cursor» y la pantalla de prueba «donde está el párrafo seleccionado» (menor).
- Segundo revisor (4-nov-2026): NO LO HE PODIDO VER: no he generado un Word real desde un asunto de la demo con «Generar» ni lo he abierto en Word (solo el XML de un docx de prueba), ni el cuadro de «Guardar como plantilla nueva», la guía de pasos ni Ajustes del centro en pantalla.
- Segundo revisor (4-nov-2026): aviso de limpieza: mis dos primeros scripts `pruebas/_rev510a.mjs` y `_rev510b.mjs` entraron en un commit hecho mientras yo trabajaba (5b64623, «Fila 510…»); los he borrado del directorio de trabajo y aparecen como borrados: hay que sacarlos de git (`git rm`) antes de fusionar. `_rev510c.mjs` ya no existe.
- Hace la app y el texto no pide: un campo que existe en el tipo pero NO es de lista (por ejemplo, de texto) usado en una marca sale como «[falta: Campo]», igual que uno inexistente (el texto solo habla de campo inexistente; es coherente con «campo de lista» pero no estaba dicho); en el cuadro de «Retocar» el aviso verde «Marca puesta…» sale también como mensaje general; «Texto condicional» aparece en el recuadro del texto para Séneca; se ha cambiado «Huecos que se pueden usar en el Word» y el placeholder del buscador a «campo variable» (razonable, en línea con el texto).
