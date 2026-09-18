# El cuadro de "Mensaje de Séneca", que se vea entero

Fila 53 de `docs/COLA.md`. Acordada con Francisco el 18-sep-2026, mirando una captura del
cuadro abierto en un asunto de CERT. MATRICULA.

**Sube directamente a `main`, sin abrir ninguna petición de cambios.**

---

## 1. Qué está mal hoy

En la captura, con el cuadro abierto en un navegador normal:

1. Todo va en **una sola columna estrecha**, con sitio libre a izquierda y derecha. Francisco
   trabaja con un monitor ancho y le molesta el renglón estrecho.
2. El **asunto se corta**: es un `input` de una línea y solo se lee
   `CERT. MATRICULA · Albarracín Beltrán, María Teresa · 1ºBachA · curs…`. No puede comprobar
   lo que va a pegar en Séneca.
3. El **texto del mensaje tiene un agujero vacío** entre el saludo y la despedida: ese tipo de
   asunto no tiene plantilla de Séneca escrita, y el cuadro no lo dice.
4. Debajo hay **cuatro párrafos** explicando el marcador ("Instalar el ayudante de Séneca").
   Ocupan más alto que la propia herramienta y se leen una vez en la vida.
5. Hay **seis botones sueltos** sin jerarquía (Copiar la lista, Copiar el siguiente, Nombre de
   la carpeta, Versión legible, 1. Copiar el asunto, Instalar el ayudante). No se ve cuál es el
   primer paso.

No hay ningún cambio de funcionamiento: se copia lo mismo, con las mismas piezas. Es
disposición y claridad.

## 2. Ficheros que hay que tocar

| Fichero | Qué pasa con él |
|---|---|
| `js/correo.js` | **Se le quita** todo lo del cuadro de Séneca y se queda solo con el de Correo |
| `js/seneca-cuadro.js` | **Nuevo.** Recibe lo que se le quita a `correo.js`, ya rehecho |
| `css/seneca.css` | **Nuevo.** El estilo del cuadro |
| `js/seneca-destinatarios.js` | Cambio pequeño: dónde caen sus dos botones |
| `js/seneca-ayudante.js` | Cambio pequeño: la explicación pasa a un desplegable |
| `index.html` | Las dos etiquetas nuevas, en su sitio del orden de carga |
| `pruebas/` | Una prueba del fichero nuevo |
| `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/HISTORIA.md`, `docs/COLA.md` | Al cerrar |

`js/correo.js` pasa de 38 KB. Por eso el cuadro de Séneca sale a fichero propio, igual que ya
se hizo con `js/seneca-destinatarios.js` y `js/correo-adjuntos.js`. **No reescribas
`js/correo.js` entero**: corta lo de Séneca, pega en el fichero nuevo, y deja en `correo.js`
la llamada al fichero nuevo si existe (`window.SenecaCuadro`), igual que hoy llama a
`SenecaDestinatarios`.

Ojo con el orden de los `<script>` de `index.html`: `js/seneca-cuadro.js` va **después** de
`js/correo.js` y de `js/seneca-destinatarios.js`, y **antes** de `js/copiar.js`, que se carga el
último a propósito.

## 3. Cómo queda el cuadro

### 3.1 El ancho

- El cuadro llega a **1100 px** de ancho como máximo, y a `96vw` si la ventana es menor.
- A partir de **900 px** de ancho útil, el cuerpo va en **dos columnas** con rejilla
  (`grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr)`, hueco de 20 px):
  - **Columna izquierda**: el aviso de arriba, "Añadir un grupo", los destinatarios con sus
    dos botones, y el Asunto.
  - **Columna derecha**: el Texto del mensaje, que ocupa todo el alto de la columna.
- Por debajo de 900 px, una sola columna, en ese mismo orden.
- **Ningún bloque más estrecho que su columna**: nada de `max-width` sueltos dentro. El título
  del cuadro y el cuerpo terminan en el mismo borde.
- La barra de pasos (3.4) va abajo, cruzando las dos columnas.

### 3.2 El asunto, entero

- El `input` de una línea se cambia por un `textarea` que **crece con su contenido** (sin barra
  de desplazamiento; se recalcula el alto al pintarlo y al escribir en él, entre 2 y 5
  renglones). Sigue siendo editable, como ahora.
- Debajo, a la derecha y en gris pequeño: **`N caracteres`**, que se actualiza al escribir. Sin
  aviso ni color de alarma: todavía no sabemos qué largo acepta Séneca (está apuntado en
  `docs/CONTEXTO-CORTO.md`, sección 8).
- Los dos botones que hoy están debajo del asunto, **"Nombre de la carpeta"** y **"Versión
  legible"**, se quedan ahí pero como **botones pequeños** (`boton-chico`) en la misma línea que
  la cuenta de caracteres, a la izquierda. Hacen exactamente lo de ahora.

### 3.3 El texto del mensaje

- El `textarea` ocupa el alto de su columna (mínimo 14 renglones), y crece si el cuadro crece.
- **Si el tipo de asunto no tiene plantilla de mensaje de Séneca**, hoy queda un hueco vacío
  entre el saludo y la firma. En su lugar, encima del `textarea`, una línea de aviso suave:

  > Este tipo de asunto no tiene plantilla de mensaje de Séneca. Escríbela una vez y saldrá
  > rellena siempre. → **Escribir la plantilla**

  El enlace abre la pantalla del tipo (la de la fila 39), en su sección de plantillas. Si desde
  aquí no se puede saltar a esa pantalla sin enredar, deja solo el texto sin enlace: **no
  inventes un camino nuevo**.
- El saludo y la firma se siguen poniendo igual que hoy. Lo que se quita es el hueco mudo.

### 3.4 Los pasos, numerados

Hoy hay un solo botón grande ("1. Copiar el asunto") que cambia de significado al pulsarlo, y
debajo una frase que lo explica ("Pulsa, pega en Séneca, y vuelve a pulsar para el texto").
Eso se sustituye por **dos botones, uno al lado del otro**, abajo del cuadro:

    [ 1. Copiar el asunto ]   [ 2. Copiar el texto ]

- Cada uno copia lo suyo, siempre, se pulse en el orden que se pulse.
- El que toca **se ve destacado** (el 1 al abrir el cuadro; el 2 en cuanto se ha copiado el 1).
- Al copiar, el botón dice **"Copiado"** un segundo y medio, como ya hace `boton()` de
  `js/copiar.js`. Reutiliza ese aviso, no montes otro.
- Desaparece la frase de debajo: con dos botones numerados ya no hace falta.

### 3.5 El ayudante de Séneca, plegado

Los cuatro párrafos de `js/seneca-ayudante.js` (arrastrar el enlace a marcadores, el permiso
del portapapeles, qué hacer si no funciona) pasan **dentro de un `<details>` cerrado**:

    ▸ ¿Cómo se instala el ayudante de Séneca? (se hace una sola vez)

El enlace **"Instalar el ayudante de Séneca"** se queda fuera, a la vista, en una sola línea
junto a ese desplegable. El texto de los párrafos no cambia: solo se mete dentro.

### 3.6 El aviso de arriba

El recuadro amarillo ("En Séneca: Utilidades → Comunicaciones. Los destinatarios se marcan
allí, en su lista: los tutores legales de …") se queda, pero **en una sola línea**, con letra
normal y sin el bloque de color tan alto: fondo suave, borde izquierdo, 6 px de relleno
arriba y abajo.

## 4. Reglas de esta instrucción

1. **No leas el repositorio entero.** Con `docs/CONTEXTO.md`, `js/correo.js`,
   `js/seneca-destinatarios.js`, `js/seneca-ayudante.js` y `css/correo.css` basta.
2. **Cambios quirúrgicos.** Lo único que se reescribe es lo que se mueve al fichero nuevo.
3. **Una sola prueba al final** (`npm test`), no una después de cada cambio.
4. **Como máximo dos subidas** (regla 13 de la cola): una para marcar la fila EN CURSO y otra
   con todo lo demás.
5. **Sube directamente a `main`**, sin petición de cambios.
6. Al terminar, sustituye en `docs/CONTEXTO-CORTO.md` la línea que habla del mensaje de Séneca,
   añade la regla del fichero nuevo a `docs/CONTEXTO.md` y anota el día en `docs/HISTORIA.md`.

## 5. Cómo se comprueba

- Abrir un asunto de alumnado, botón **Mensaje de Séneca**.
- El cuadro ocupa el ancho, en dos columnas.
- El asunto se lee entero, sin cortarse, con su cuenta de caracteres debajo.
- Con un tipo sin plantilla de Séneca, sale el aviso en vez del hueco vacío.
- Los dos botones numerados copian lo suyo y dicen "Copiado".
- La explicación del ayudante está plegada.
- Estrechando la ventana a menos de 900 px, todo cae en una columna y nada se sale.
