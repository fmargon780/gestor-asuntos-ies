# La cabecera de un asunto, ordenada por el proceso de trabajo

Fila 52 de `docs/COLA.md`. Acordado con Francisco el 18-sep-2026, mirando una captura de la
cabecera de un asunto de CERT. MATRICULA.

**Va después de la fila 51** (`docs/FICHA-DISPOSICION.md`), que toca la misma cabecera para
añadirle la línea gris `.ficha-subtitulo`. Si la 51 todavía no está HECHA, hazla antes. Esta fila
da por hecho que esa línea gris ya existe.

Es un cambio **de disposición y de agrupación**. Ninguna acción desaparece y ninguna cambia lo que
hace: lo que cambia es dónde vive cada una y con quién va agrupada.

## 1. El problema

Hoy la cabecera de un asunto abierto tiene doce botones seguidos, todos con el mismo peso visual,
en dos filas, con hueco libre a la derecha:

`Nº 6523240 · [estado] · Vía · Plazo · Lo pide · Editar · Copiar nombre · Gestionar documentos ·
Archivar el asunto · Borrar · Correo · Mensaje Séneca`

Tres cosas fallan:

- **No se ve cuál es la importante.** Solo "Archivar el asunto" va en oscuro, y no es la acción
  más frecuente.
- **Se agrupan por nada.** Los botones están puestos en el orden en que se fueron añadiendo, no
  en el orden en que se trabaja.
- **"Borrar" está pegado a los demás**, con riesgo de pulsarlo sin querer.

## 2. La regla de colocación

Cada acción va **donde está la cosa sobre la que actúa**, y las que se hacen **en el mismo momento
del trámite** van juntas bajo un solo botón.

## 3. Cómo queda

Cabecera (`<header class="ficha-cabecera">`, `js/ficha-asunto.js`):

1. `← Volver a la lista`, como hoy.
2. Marca del tipo (`.marca-tipo`), como hoy. **La marca de estado (`.marca-estado`) desaparece**
   de aquí: su sitio pasa a ser el desplegable de estado de la fila de abajo.
3. `<h2 class="ficha-nombre">` con el nombre del asunto y, dentro de él, dos cosas nuevas (ver la
   sección 4): el número del tercero copiable y el menú de tres puntos.
4. La línea gris `.ficha-subtitulo` de la fila 51, como la dejó esa fila.
5. La barra `#ficha-acciones`, en **una sola fila**, con cinco elementos y nada más:

   `[desplegable de estado] · [vencimiento] · El encargo · Comunicar · Archivar el asunto`

## 4. Dónde va cada botón de hoy

| Botón de hoy | A dónde va |
|---|---|
| `Nº 6523240` | Dentro del `<h2>`, pegado al número que ya sale en el nombre (sección 5) |
| desplegable de estado | Se queda en la barra, el primero, y toma el color del estado (sección 6) |
| `Vía` | Dentro de **El encargo** (sección 7) |
| `Lo pide` | Dentro de **El encargo** (sección 7) |
| `Plazo` | Deja de ser botón: pasa a ser el **vencimiento**, a la vista (sección 8) |
| `Correo` | Dentro de **Comunicar** (sección 9) |
| `Mensaje Séneca` | Dentro de **Comunicar** (sección 9) |
| `Editar` | Dentro del menú de **tres puntos** del nombre (sección 5) |
| `Borrar` | Dentro del menú de **tres puntos** del nombre (sección 5) |
| `Copiar nombre` | Desaparece de la cabecera; se reparte (sección 10) |
| `Gestionar documentos` | Se va al bloque "Documentos de la carpeta" (sección 11) |
| `Archivar el asunto` | Se queda en la barra, el último, pegado al borde derecho (sección 12) |

## 5. El nombre manda sobre el asunto entero

Dentro del `<h2 class="ficha-nombre">`, después del texto del nombre:

- **Un icono de copiar** el número de identificación del tercero (el `6523240` del ejemplo), solo
  si el nombre del asunto lo lleva. Copia únicamente ese número, sin el nombre. Reutiliza el
  ayudante que ya existe en `js/copiar.js`, con el mismo aviso de "Copiado" de siempre.
- **Un botón de tres puntos** (`⋯`) que abre un menú pequeño, anclado debajo, con:
  - `Editar el asunto` — exactamente lo que hace hoy el botón `Editar` (`js/asuntos-editar.js`).
  - `Copiar el nombre del asunto` — el nombre entero de la carpeta (sección 10).
  - una raya de separación.
  - `Borrar el asunto` — en rojo, exactamente lo que hace hoy `Borrar`, con su misma pregunta de
    confirmación y su mismo paso por la papelera.

Reglas del menú:

- Se cierra con `Escape`, pulsando fuera, o al elegir una opción.
- Solo puede haber uno abierto. No abre ningún `U.preguntar` por sí mismo: el diálogo de confirmar
  el borrado es el de hoy, y se abre después de cerrar el menú.
- En **modo consulta** (`aplicarModoConsulta()`), el menú se abre y `Copiar el nombre del asunto`
  funciona; `Editar el asunto` y `Borrar el asunto` salen apagados, igual que hoy salen apagados
  sus botones.
- Con la cabecera **encogida** (mecanismo de la fila 46), el icono de copiar y los tres puntos
  **siguen a la vista**: son parte del `<h2>`.

## 6. El estado, con su color

El desplegable de estado se queda donde está, el primero de la barra, y **toma el color de fondo y
de texto que hoy lleva la marca `.marca-estado`** para ese estado. Así no se pierde el golpe de
vista al quitar la marca de arriba.

No cambia nada de su funcionamiento: sigue guardando al cambiar, con `U.mientrasGuarda`.

## 7. "El encargo": quién lo pide y por dónde

Un botón nuevo, **El encargo**, que al pulsarse abre el cuadro de "Lo pide" que ya existe
(`js/lo-pide.js`) con la **vía de comunicación** (`js/via-contacto.js`) dentro, como un campo más
del mismo cuadro.

El porqué, en palabras de Francisco: quién nos encarga la gestión, por qué vía y en qué fecha son
tres datos del mismo momento —el de recibir el encargo—, y se anotan de una vez.

- El cuadro queda con estos campos, en este orden: **quién lo pide**, **por qué vía**, **en qué
  fecha** (opcional, la que ya tiene hoy "Lo pide").
- Se guardan los dos juntos, en una sola pasada: ni la vía ni "Lo pide" cambian de sitio en
  `asuntos.json`, y lo que hoy lee cada uno sigue leyendo lo mismo.
- Lo que ya usa la vía por su cuenta (el cuadro de Correo, el mensaje de Séneca, la línea de
  "Datos del trámite") **no se toca**.
- Si el asunto ya tiene los dos datos, el botón muestra debajo, en gris y pequeño, un resumen de
  una línea: `Tutor legal 1 · por correo`. Si no tiene ninguno, el botón va solo.

## 8. El vencimiento, a la vista y no detrás de un botón

El botón `Plazo` desaparece. En su lugar, el segundo elemento de la barra es una **etiqueta con el
vencimiento**, que se pulsa para cambiarlo.

El porqué: el plazo casi nunca lo pone quien hace el encargo, sino la normativa del procedimiento,
y por eso ya está guardado en el tipo de asunto y se calcula solo al crear el asunto. No es una
decisión del día a día: es un dato que hay que ver.

Qué dice la etiqueta:

| Situación | Texto | Color |
|---|---|---|
| Vence más adelante | `Vence el 25-sep · quedan 7 días` | normal |
| Quedan 2 días o menos | `Vence el 20-sep · quedan 2 días` | ámbar |
| Vence hoy | `Vence hoy` | ámbar |
| Ya pasó | `Venció hace 3 días` | rojo |
| Sin fecha límite | `Sin plazo` | gris suave |

- Se pulsa y abre **el mismo cuadro de fecha límite de hoy** (`js/plazos.js`), sin cambiarlo.
- La cuenta de días es en días naturales, y se calcula con la fecha de hoy del navegador a las
  00:00, para que "quedan 0 días" no aparezca nunca (ese caso es `Vence hoy`).
- Esta etiqueta **sustituye a la marca `.marca-plazo`** de la cabecera, que se quita: el dato
  estaba dos veces.
- En modo consulta se ve igual, pero no se puede pulsar.

## 9. "Comunicar": el sitio donde se habla con el tercero

Los botones `Correo` y `Mensaje Séneca` se juntan en un solo botón, **Comunicar**, que al pulsarse
abre un menú pequeño con dos opciones:

- `Correo electrónico` — abre el cuadro de Correo de hoy (`js/correo.js`), tal cual.
- `Mensaje de Séneca` — abre el de hoy (`js/seneca-ayudante.js`), tal cual.

Mismas reglas de menú que los tres puntos (sección 5): `Escape`, pulsar fuera, uno solo abierto.

## 10. "Copiar nombre" se reparte

Hoy el botón `Copiar nombre` es engañoso: no se sabe si copia el nombre del asunto o el del
tercero. Se quita de la cabecera y cada copia se pone al lado de lo que copia:

- **El nombre del asunto** se copia desde el menú de tres puntos, con la opción escrita entera:
  `Copiar el nombre del asunto`.
- **El nombre del tercero** ya se copia hoy desde su línea en "Datos y contacto"
  (`js/ficha-tercero.js`). No se toca.

**Antes de escribir esto, mira qué copia hoy `Copiar nombre` de verdad.** Si copia el nombre del
tercero y no el del asunto, la opción del menú se llama `Copiar el nombre del tercero` y hace lo
mismo que hacía. Lo que no puede quedar es un botón que no diga qué copia.

## 11. Gestionar documentos, en el bloque de documentos

El botón `Gestionar documentos` sale de la cabecera y pasa a la **cabecera del bloque "Documentos
de la carpeta"** (`js/ficha-documentos.js`), a la derecha de su título, como un botón pequeño
`Documentos ▾` que abre exactamente lo mismo que abre hoy.

- **No** se pone un clic sobre todo el bloque: un bloque entero que es pulsable no se ve, y
  además ahí dentro ya se pulsan documentos sueltos.
- Si el bloque está vacío (clase `vacio`, de la fila 51), el botón **sigue estando**: desde él se
  traen documentos a una carpeta vacía.

## 12. Archivar, separado

`Archivar el asunto` se queda como está (oscuro, y "Reabrir el asunto" cuando toca), el último de
la barra y **pegado al borde derecho**, con `margin-left: auto`. Es la única acción que saca al
usuario de la ficha, y por eso va sola.

La barra entera termina en el mismo borde que el título, sin hueco libre: Francisco trabaja en un
monitor ancho y le molesta el espacio muerto a la derecha.

## 13. Lo que no se toca

- Todo lo de la fila 51: la línea gris, las tres columnas, los plegables, "Datos del trámite".
- El mecanismo de cabecera pegada y encogida de las filas 46 y 50 (`js/cabecera-fija.js`). Al
  encogerse, se esconden la línea gris y la marca de tipo; **el nombre y la barra de acciones se
  quedan**, en una sola línea.
- La ficha del ARCHIVO: allí no hay ni editar ni archivar, y eso sigue igual. Lo que sí se aplica
  allí es el menú de tres puntos con lo que esté permitido, y `Comunicar`.
- Los avisos `#ficha-presencia`, `#ficha-sellos` y `#ficha-aviso-tipo`.
- La pantalla de lista, "Qué me toca", el tablón y el visor.

## 14. Ficheros que hay que tocar

| Fichero | Qué |
|---|---|
| `js/ficha-asunto.js` | La barra `#ficha-acciones` nueva; quitar `.marca-estado` y `.marca-plazo`; el color del desplegable de estado |
| `js/ficha-nombre-acciones.js` | **Nuevo.** El icono de copiar el número y el menú de tres puntos del `<h2>` |
| `js/ficha-menus.js` | **Nuevo.** El menú pequeño reutilizable (abrir, cerrar con Escape y al pulsar fuera, uno solo a la vez), que usan los tres puntos y `Comunicar` |
| `js/lo-pide.js` | Meter la vía dentro del cuadro, y guardar los dos de una vez |
| `js/via-contacto.js` | Dejar de montar su propio botón en la cabecera; su cuadro lo llama ahora `lo-pide.js` |
| `js/plazos.js` | La etiqueta de vencimiento con su texto y su color; el cuadro no cambia |
| `js/ficha-documentos.js` | El botón `Documentos ▾` en la cabecera del bloque |
| `css/ficha-asunto.css` | La barra en una sola fila terminando en el borde; el desplegable de estado con color; la etiqueta de vencimiento; los tres puntos y el icono de copiar dentro del `<h2>` |
| `index.html` | Los `<script>` de los dos ficheros nuevos, después de `js/ficha-asunto.js` |
| `pruebas/cabecera-del-asunto.mjs` | **Nueva** (sección 15) |

`js/ficha-asunto.js` ya pasa de 900 líneas. **No lo partas aquí**, por el mismo criterio de la
fila 51: lo nuevo va a los dos ficheros nuevos.

## 15. La prueba

`pruebas/cabecera-del-asunto.mjs`, en navegador de verdad, con el disco de mentira de
`pruebas/navegador.mjs` (como `pruebas/cabecera-fija.mjs`). Escenarios:

1. En la barra `#ficha-acciones` hay exactamente cinco elementos, en este orden: desplegable de
   estado, vencimiento, `El encargo`, `Comunicar`, `Archivar el asunto`.
2. Ya no existe ningún botón `Vía`, `Plazo`, `Lo pide`, `Editar`, `Copiar nombre`,
   `Gestionar documentos`, `Borrar`, `Correo` ni `Mensaje Séneca` dentro de `#ficha-acciones`.
3. Los tres puntos del `<h2>` abren un menú con `Editar el asunto`, la opción de copiar el nombre
   y `Borrar el asunto`; `Escape` lo cierra.
4. El icono de copiar el número sale cuando el nombre del asunto lleva número de identificación, y
   no sale cuando no lo lleva.
5. Con fecha límite dentro de 7 días, la etiqueta dice `quedan 7 días`; con la de hoy, `Vence hoy`;
   con una pasada, `Venció hace N días` y en rojo; sin fecha, `Sin plazo`.
6. Pulsar la etiqueta de vencimiento abre el cuadro de fecha límite de siempre.
7. `Comunicar` abre un menú con las dos opciones, y cada una abre su cuadro.
8. `El encargo` abre un cuadro que trae a la vez quién lo pide y la vía; al guardar, los dos
   quedan escritos en `asuntos.json` donde estaban antes.
9. El botón `Documentos ▾` está dentro del bloque de documentos, también con la carpeta vacía.
10. En modo consulta, el menú de tres puntos se abre, copiar funciona, y editar y borrar salen
    apagados.
11. Con la cabecera encogida, el `<h2>` con sus dos añadidos y la barra de acciones siguen
    visibles.

**Una sola pasada de la batería completa al final**, no una comprobación después de cada cambio.

## 16. Cómo trabajar esta fila

- **Hazla después de la fila 51.** Si la 51 está PENDIENTE, primero esa.
- **Sube directamente a `main`. No abras ninguna pull request** (si la sesión es de las que no
  pueden tocar `main`, vale el pull request y lo fusionas tú al estar en verde).
- **Cambios quirúrgicos.** No reescribas ficheros enteros.
- **No leas el repositorio entero.** Con `docs/CONTEXTO-CORTO.md`, la parte de `docs/CONTEXTO.md`
  que habla de la ficha y los ficheros de la sección 14 basta.
- **Como máximo dos subidas** (regla 13 de la cola).
- Al terminar: `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, y la
  entrada en `docs/HISTORIA.md`.
