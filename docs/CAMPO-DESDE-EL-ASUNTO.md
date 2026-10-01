# Añadir un campo desde un asunto abierto (fila 245)

Diseñado con Francisco el 1-oct-2026 en Cowork, a partir de su aviso de soporte (fila 245):
https://drive.google.com/file/d/1CDISgGbu-whXMwTabSBEiAXaOyASlnKE/view?usp=drivesdk

## Qué quiere Francisco

Hoy un campo (propio, de fichero o calculado) solo se añade desde Ajustes → la pantalla del tipo →
«+ Añadir campo». Francisco quiere poder hacerlo **desde un asunto abierto**, cuando se da cuenta
de que le falta un dato, y elegir en ese momento si el campo pasa a formar parte del **tipo de
asunto** o si es **solo para ese asunto**. Es el mismo patrón que ya existe para hitos y tareas
(fila 235, `docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md`): «¿Dónde se guarda?», con la opción del tipo
marcada y «Deshacer» después.

## Antes de empezar

- Lee `docs/CONTEXTO.md`, `docs/contexto/CAMPOS-Y-TIPOS.md` (sección «Los campos de cada tipo de
  asunto») y la parte de la ficha del asunto que toque. Como referencia del patrón,
  `docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md` y `js/donde-se-guarda.js`. **No leas el repositorio
  entero.**
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Cambios quirúrgicos. Nada de reescribir módulos ni envolver (`docs/CONTEXTO-CORTO.md`, §6).
- Método de la fila 242 (`docs/REVISOR-EN-LOCAL.md`): rama `fila-245`, revisor en local, y solo
  con su APROBADA a `main`. Una sola publicación de código.

## 1. El botón «+ Añadir campo» en la ficha del asunto

- En la ficha de un asunto abierto, en el bloque o tarjeta donde salen sus campos («Datos del
  asunto» o como se llame hoy), un botón **«+ Añadir campo»**. Si el asunto todavía no tiene
  ningún campo con valor, el bloque sale igualmente, solo con el botón.
- Abre **el mismo panel** que «+ Añadir campo» de Ajustes del tipo (`js/campos-catalogo.js`): las
  mismas pestañas (de fichero, calculados, «Míos») y la posibilidad de crear un campo propio
  nuevo ahí mismo. Reutilizar el panel, no copiarlo. No ofrecer los campos que el asunto ya tiene.
- No sale en modo consulta, ni en el ARCHIVO, ni en un asunto sin tipo (en un asunto sin tipo, el
  campo se añade directamente «solo en este asunto», sin preguntar).

## 2. El valor, en el mismo paso

- Elegido el campo, se pide ya su valor para **este** asunto, en el mismo cuadro (texto, o lista
  cerrada si el campo es de lista), con el valor inicial ya puesto si lo hay
  (`Campos.valorInicial`: de fichero o calculado). Se puede dejar vacío.

## 3. «¿Dónde se guarda?»

Antes de guardar, el mismo bloque de la fila 235 (`js/donde-se-guarda.js`), con su teclado
(flechas, Intro acepta, Escape cancela sin guardar nada):

- **«En el tipo <tipo corto>»** — marcada siempre al abrirse. Debajo, en letra pequeña:
  «Llegará a N asuntos abiertos de este tipo, vacío.» (N = los demás abiertos del tipo); si N es
  0: «No hay más asuntos abiertos de este tipo. Valdrá para los próximos.»
  Al aceptar: el campo entra en la configuración del tipo (`porTipo` de `_GESTOR/campos.json`, al
  final de la lista, con «Obligatorio» y «Añadir al nombre» sin marcar, como un campo nuevo del
  catálogo en Ajustes) y en este asunto se guarda el valor. Los demás asuntos abiertos del tipo lo
  tienen desde ese momento, vacío: sale al pulsar «Cambiar el asunto» y se rellena cuando se
  quiera. **No se rellena solo en los demás**, aunque sea de fichero.
- **«Solo en este asunto»**: el campo y su valor quedan guardados solo en la ficha de este
  asunto. El tipo no cambia.

## 4. El campo de «solo este asunto»

- Se guarda en la ficha del asunto (por ejemplo una lista `camposPropiosDelAsunto` con la clave de
  cada campo, `Campos.claveDeCampo`), y su valor junto a los demás valores de campos del asunto.
  Si la ficha usa listas que se funden por elemento, que esta también (`App.anotarLista`).
- En la ficha sale igual que los demás campos, con una marca pequeña «solo aquí» (la misma idea
  que las tareas de la fila 224).
- En «Cambiar el asunto» (`App.pintarCamposEditar`) sale también, para cambiar su valor.
- Lleva un «⋮» con **«Pasar al tipo»** (lo lleva a la configuración del tipo, como el punto 3, con
  su aviso de a cuántos llega) y **«Quitar»** (pide confirmación; quita el campo y su valor de este
  asunto).
- Si después alguien añade ese mismo campo al tipo desde Ajustes, deja de ser «solo aquí» sin
  perder su valor.

## 5. El aviso de después, con «Deshacer»

- Verde, una línea: «Campo añadido al tipo <tipo> y a N asuntos abiertos.» o «Campo añadido solo
  a este asunto.»
- Cuando ha ido al tipo, lleva **«Deshacer»** (unos 8 segundos, como la fila 235): el tipo vuelve
  a como estaba y en este asunto el campo se queda como «solo aquí», con su valor. Después:
  «Deshecho: se queda solo en este asunto.» Si mientras tanto el tipo ha cambiado por otro lado,
  no pisarlo: aviso ámbar.
- Principal y accesorio por separado (`U.fallo` / `U.accesorio`).

## Ficheros

- Nuevo `js/campo-desde-el-asunto.js` (o el nombre que encaje): el botón, el paso del valor, la
  llamada a `js/donde-se-guarda.js`, el «⋮» de un campo «solo aquí» y el «Deshacer».
- `js/campos-catalogo.js`: solo lo justo para poder abrirlo desde la ficha (por ejemplo, que
  devuelva el campo elegido en vez de guardarlo en el tipo).
- `js/campos.js`: que los campos de un asunto sean los del tipo **más** los «solo aquí» de su ficha
  (una función pura, para que la usen la ficha, «Cambiar el asunto», exportar, etc.).
- La ficha del asunto y `js/asuntos-editar.js`: pintar los «solo aquí».
- `index.html` y la lista de ficheros de la copia sin internet: el `<script>` nuevo.
- Pruebas: nueva `pruebas/campo-desde-el-asunto.mjs` con los puntos de «Cómo sabemos que está
  bien»; pasar `pruebas/campos.mjs`.
- Datos de demostración: al menos dos asuntos abiertos del mismo tipo, para ver «Llegará a N».
- Documentación al terminar: `docs/CONTEXTO-CORTO.md` (§5, línea de campos, sustituyendo),
  `docs/contexto/CAMPOS-Y-TIPOS.md`, `docs/HISTORIA.md` y `docs/COLA.md`.

## Qué dirá Claude Code a Francisco al terminar

En la ficha de un asunto abierto hay «+ Añadir campo». Al elegirlo se pone su valor y se decide si
va «En el tipo» (marcada) o «Solo en este asunto»; el aviso verde lleva «Deshacer».

## Cómo sabemos que está bien

1. Abrir un asunto abierto de un tipo que tenga al menos otro asunto abierto. En su ficha está
   «+ Añadir campo». Pulsarlo: sale el mismo panel que en Ajustes del tipo, sin los campos que el
   asunto ya tiene.
2. Elegir un campo, escribir un valor y aceptar: sale «¿Dónde se guarda?» con «En el tipo …»
   marcada y «Llegará a N asuntos abiertos de este tipo, vacío». Intro: aviso verde con
   «Deshacer». El campo sale en la ficha con su valor.
3. Abrir Ajustes → ese tipo → Campos: el campo está, al final, sin «Obligatorio» ni «Añadir al
   nombre».
4. Abrir otro asunto abierto del mismo tipo y pulsar «Cambiar el asunto»: el campo está, vacío.
5. En el primer asunto, añadir otro campo y elegir «Solo en este asunto»: sale en la ficha con
   «solo aquí»; en Ajustes del tipo no está; en el otro asunto no está.
6. Añadir un campo al tipo y pulsar «Deshacer»: en este asunto sigue, con «solo aquí» y su valor;
   en Ajustes del tipo ya no está.
7. En un campo «solo aquí», «⋮» → «Pasar al tipo»: pasa a Ajustes del tipo y pierde la marca.
   «⋮» → «Quitar» en otro: pide confirmación y desaparece de la ficha.
8. Pulsar «+ Añadir campo», elegir un campo y pulsar Escape en «¿Dónde se guarda?»: no se guarda
   nada.
9. Crear desde el panel un campo propio nuevo («Míos») y añadirlo: funciona igual que uno ya
   existente.
10. En un asunto del ARCHIVO y en modo consulta, no sale «+ Añadir campo».
