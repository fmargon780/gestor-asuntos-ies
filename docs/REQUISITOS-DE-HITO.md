# Lo que hay que reunir en cada hito

Instrucción para Claude Code. Acordada con Francisco el 18 de septiembre de 2026.
Fila 59 de `docs/COLA.md`.

**Antes de empezar**: lee `docs/CONTEXTO-CORTO.md` y, de `docs/CONTEXTO.md`, solo los apartados
de hitos, guías, plantillas y correo. **No leas el repositorio entero.** Los ficheros que hay que
tocar están listados abajo; no hace falta abrir ningún otro.

**Cómo subirlo**: directamente a `main`, sin abrir ninguna petición de cambios (si la sesión es
en la nube y no puede tocar `main`, pull request y fusionarlo tú mismo, según la nota final de
`docs/COLA.md`). Cambios quirúrgicos: no reescribas ficheros enteros. Como máximo dos subidas
(regla 13 de la cola). Una sola comprobación al final, no una después de cada cambio.

---

## 1. El problema

Un hito dice qué hay que hacer, quién y para cuándo. No dice **qué hay que reunir**: qué papeles
tiene que aportar el interesado, y qué datos hay que pedirle. Hoy eso vive en la cabeza de
Francisco o en una nota suelta, y se descubre que falta algo cuando ya se ha dado el paso por
hecho.

## 2. Qué hay que hacer, en corto

1. Cada paso del trámite de un tipo puede llevar una **lista de lo que hay que reunir**.
2. Al abrir un asunto, esa lista llega a su hito como casillas.
3. Una casilla es un **documento** o un **dato**. La del documento se marca sola al apuntar ese
   documento al hito. La del dato se marca a mano y deja escribir el valor.
4. Una casilla puede ser **obligatoria**: si lo es, el hito no se da por hecho hasta tenerla.
5. Botón **Pedir lo que falta** en el hito: mete las casillas sin marcar, como lista, dentro del
   correo o del mensaje de Séneca que ya sabe preparar la aplicación.

Nada de esto es obligatorio para el usuario: un tipo sin listas y un hito sin casillas funcionan
exactamente igual que hoy.

## 3. Dónde se guarda

### 3.1 En la guía del tipo (`_GESTOR/guias.json`)

Cada paso gana un campo nuevo, opcional:

    requisitos: [
      { id: 'r…', texto: 'Fotocopia del libro de familia', clase: 'documento', obligatorio: true },
      { id: 'r…', texto: 'Teléfono de contacto del tutor', clase: 'dato', obligatorio: false }
    ]

- `clase` solo puede ser `'documento'` o `'dato'`. Cualquier otra cosa se normaliza a `'dato'`.
- Un paso sin `requisitos`, o con la lista vacía, se comporta como hoy.
- Los pasos de dentro de una opción de una pregunta (bifurcación) también pueden llevarlos.

### 3.2 En el hito (`_GESTOR/hitos.json`)

`normalizarHito` (en `js/hitos.js`) gana el mismo campo, con el estado de cada casilla:

    requisitos: [
      { id, texto, clase, obligatorio,
        hecho: false, valor: '', documento: '', quien: '', cuando: '' }
    ]

- `valor`: lo escrito, solo para los de clase `dato`.
- `documento`: el nombre del fichero que lo satisface, solo para los de clase `documento`.
- `quien` y `cuando`: quién lo marcó y cuándo, como en las notas del hito.
- `pasoAHito` copia los `requisitos` del paso de la guía, con `hecho: false`.
- Un asunto que ya tenía hitos creados **no se toca**: si su tipo gana requisitos después, el
  botón nuevo del punto 4.3 los trae.

## 4. Las pantallas

### 4.1 En la pantalla del tipo (Ajustes › Tipos de asunto › un tipo › Pasos del trámite)

Dentro del editor de cada paso, una sección plegable **Lo que hay que reunir**, con su cuenta
cuando tiene algo (`Lo que hay que reunir (3)`). Dentro, una fila por casilla:

- El texto (campo libre).
- Dos botones de radio o un desplegable: **Documento** / **Dato**.
- Una casilla **Obligatorio**.
- Una equis para quitar la fila, y flechas para ordenarla (o el mismo mecanismo de orden que ya
  usen los pasos: reutilízalo, no inventes otro).
- Debajo, **+ Añadir**.

Se guarda con el mismo botón de guardar que ya tiene el paso. Nada de un guardado aparte.

### 4.2 En la ficha del asunto, dentro de cada hito

Debajo del cuerpo del hito y encima de sus documentos apuntados, un bloque **Lo que hay que
reunir**, con la cuenta de lo que falta (`Lo que hay que reunir — falta 2 de 5`). Cada línea:

- Casilla de marcar.
- El texto. Si es obligatorio, en negrita y con un punto ámbar mientras esté sin marcar.
- Si es de clase `dato` y está marcado: al lado, en gris, el valor escrito, con un icono de
  copiar (usa el que ya existe en `js/copiar.js`).
- Si es de clase `documento` y está marcado: al lado, en gris, el nombre del documento.
- Un icono de tres puntos (`js/ficha-menus.js`) con **Editar el texto** y **Quitar de este
  asunto**. Quitar solo afecta a este asunto; la guía del tipo no se toca.

Al marcar una casilla de clase `dato`, sale un campo pequeño para escribir el valor (se puede
dejar vacío) y se guarda al salir del campo o con Intro. Al desmarcarla, el valor se conserva
pero deja de contar.

Debajo de la lista, **+ Añadir algo que falte**: añade una casilla solo a este asunto.

Si el hito no tiene ninguna casilla, el bloque no se pinta: solo sale **+ Añadir algo que falte**
en el menú de tres puntos del hito, para no ensuciar la ficha.

### 4.3 Asuntos que ya existen

En el bloque de hitos, junto al botón que ya trae los hitos de la guía a un asunto viejo, el
mismo camino sirve aquí: si un hito no tiene `requisitos` y su paso de origen (`origenGuia`) sí
los tiene ahora, sale una línea discreta **"El tipo tiene ahora 4 cosas que reunir · Traerlas"**.
Al pulsarla se copian, sin marcar. No se hace solo nunca.

## 5. Marcar el documento sin marcarlo a mano

En `js/hitos-documentos.js`, al apuntar un documento a un hito:

- Si el hito tiene **una sola** casilla de clase `documento` sin marcar, se marca sola, con el
  nombre del fichero en `documento`, y sale un aviso verde de una línea: *"Marcado: <texto de la
  casilla>"*.
- Si tiene **varias**, sale un desplegable pequeño: *"¿Con qué se corresponde?"*, con las
  pendientes y una opción **Ninguna**. Nada se marca sin elegir.
- Si no tiene ninguna, todo sigue como hoy.

Al quitar el documento del hito, la casilla que satisfacía vuelve a estar sin marcar.

## 6. No dar por hecho un hito al que le falta algo

Función nueva en `js/hitos.js`: `Hitos.faltanObligatorios(hito)`, que devuelve la lista de
casillas obligatorias sin marcar (vacía si no hay ninguna). **No cambies la firma de
`Hitos.marcar`.**

El panel de hitos, antes de pasar un hito a `hecho`, llama a esa función. Si devuelve algo, sale
`U.preguntar` con el texto:

> Faltan 2 cosas por reunir: Fotocopia del libro de familia, Teléfono de contacto.
> ¿Lo das por hecho igualmente?

Botones: **Volver** (no hace nada) y **Darlo por hecho**. Si Francisco sigue, el hito se marca y
se le apunta una nota automática: *"Dado por hecho con 2 cosas sin reunir."* Nunca se le impide
avanzar: se le avisa.

## 7. Pedir lo que falta

Botón **Pedir lo que falta** en la cabecera del bloque de casillas, visible solo cuando queda
alguna sin marcar. Abre el mismo menú **Comunicar** que ya tiene la cabecera de la ficha (Correo
y Séneca): no dupliques ese camino, llámalo.

El texto de la lista se monta así, y nada más:

    Falta por aportar:
    - Fotocopia del libro de familia
    - Teléfono de contacto del tutor

- Se cuelan las casillas sin marcar, de las dos clases, en el orden en que están.
- Ese texto entra en el cuerpo por un **hueco de plantilla nuevo**, `{{LO QUE FALTA}}`, que se
  suma al buscador de huecos (`js/huecos-buscador.js`) y a la lista de huecos de
  `js/plantillas.js`. Si la plantilla del tipo no lleva ese hueco, o el tipo no tiene plantilla,
  el texto se añade al final del cuerpo, separado por una línea en blanco.
- Vale igual para el cuadro de Correo y para el de Séneca.
- Fuera de este camino, `{{LO QUE FALTA}}` se sustituye por nada (una plantilla usada desde otro
  sitio no puede quedarse con el hueco escrito).

Como siempre: la aplicación **prepara** el mensaje, no lo envía.

## 8. Ficheros que hay que tocar

| Fichero | Qué |
|---|---|
| `js/hitos.js` | `normalizarHito` con `requisitos`, `pasoAHito` que los copia, `faltanObligatorios`. Cambios quirúrgicos: es el modelo, no lo reescribas |
| `js/hitos-requisitos.js` | **Nuevo.** Pintar el bloque, marcar, escribir el valor, añadir, quitar, editar, "Traerlas" y el texto de "Pedir lo que falta". Se engancha a `window.Hitos`, como hace `js/hitos-archivo.js`. Menos de 400 líneas |
| `js/hitos-panel-lista.js` | Llamar al bloque nuevo al pintar cada hito, y la guarda del punto 6 antes de pasar a `hecho` |
| `js/hitos-documentos.js` | El marcado del punto 5 |
| `js/guias-requisitos.js` | **Nuevo.** La sección "Lo que hay que reunir" del editor de un paso. Aparte porque `js/guias.js` pasa de 400 líneas |
| `js/guias.js` | Solo lo justo: normalizar `requisitos` al leer y guardar un paso, y llamar al editor nuevo |
| `js/plantillas.js`, `js/huecos-buscador.js` | El hueco `{{LO QUE FALTA}}` |
| `js/correo.js`, `js/seneca-cuadro.js` | Recibir el texto de lo que falta al abrirse desde el hito |
| `index.html` | Los dos `<script>` nuevos, en su orden (después de `js/hitos-archivo.js` y de `js/guias.js`) |
| `css/` | El estilo del bloque, en la hoja que ya usen los hitos. No crees una hoja nueva si ya hay una |
| `pruebas/requisitos-de-hito.mjs` | **Nueva** |

## 9. La prueba

Una sola, al final, sin navegador (jsdom o `vm`, como las de módulo suelto):

1. Un paso de guía con dos requisitos (uno obligatorio de clase documento, uno de clase dato) se
   convierte en un hito con las dos casillas sin marcar.
2. Apuntar un documento a ese hito marca sola la única casilla de clase documento, con el nombre
   del fichero guardado.
3. `Hitos.faltanObligatorios` devuelve la casilla obligatoria mientras esté sin marcar, y nada
   cuando ya está.
4. El texto de "Pedir lo que falta" lista solo las casillas sin marcar, con la cabecera "Falta
   por aportar:".
5. Un hito sin requisitos se comporta exactamente como antes.

Comprueba que la prueba falla sin el cambio antes de darla por buena.

## 10. Al terminar

- `docs/CONTEXTO-CORTO.md`: sustituir la línea de "Hitos" por una que mencione lo que hay que
  reunir y el botón "Pedir lo que falta". No añadir una línea debajo. Máximo 160 líneas.
- `docs/CONTEXTO.md`: apartado de hitos y de guías al día, y las filas de ficheros nuevos.
- `docs/HISTORIA.md`: entrada con la fecha.
- `docs/COLA.md`: fila 59 a HECHA.
- Comprobar lo publicado con `curl` sobre `https://gestor-de-asuntos.vercel.app` (la dirección
  que usa Francisco, `https://asuntos.fmargon.com`, sirve lo mismo).
- Mensaje final para Francisco, tres frases: qué va a ver en la pantalla de un tipo y dentro de
  un hito.
