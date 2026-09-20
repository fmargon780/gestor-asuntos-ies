# La biblioteca de hitos del centro

Fila 79 de `docs/COLA.md`. Acordada con Francisco el 20-sep-2026.
**Ampliada el 20-sep-2026** con los apartados 4.6, 4.7 y 4.8 (hitos solo informativos y
normativa del hito), acordados con Francisco en la misma conversación.

**Sube directamente a `main`, sin abrir ninguna petición de cambios.** Cambios quirúrgicos, no
reescribas ficheros enteros. No leas el repositorio entero: con `docs/CONTEXTO.md`,
`docs/contexto/HITOS-Y-GUIAS.md` y `docs/contexto/CAMPOS-Y-TIPOS.md` tienes lo que hace falta.
Una sola tanda de pruebas al final.

---

## 1. El problema

Hoy los pasos del trámite (que son los hitos de un asunto) se escriben a mano, uno por uno, dentro
de cada Tipo de Asunto. No hay forma de reutilizar nada.

Muchos pasos se repiten entre tipos casi idénticos: "Registrar de salida en Séneca", "Comunicar a
la familia", "Pasar a firma del director", "Esperar alegaciones (3 días hábiles)". Y no se repite
solo el título: se repiten el responsable, el plazo, la lista de lo que hay que reunir y el texto
del correo. Todo eso se está reescribiendo cada vez, con el riesgo de que cada tipo acabe
diciéndolo de una manera distinta.

## 2. Qué se construye

Una **biblioteca de hitos del centro**: una colección de **hitos modelo**, guardada una sola vez,
con todos sus campos. Al escribir la guía de un Tipo de Asunto, Francisco puede traer un hito de la
biblioteca en vez de escribirlo desde cero.

Las cuatro decisiones que Francisco ya ha tomado, y que no se replantean:

1. **El hito traído es una copia.** Vive dentro de la guía de ese tipo, como cualquier otro paso.
2. **Al guardar un paso traído que ha cambiado, la app pregunta**: ¿solo para este tipo, o subo
   también el cambio a la biblioteca?
3. **Si el cambio sube a la biblioteca, los demás tipos que usan ese modelo NO se cambian solos.**
   Se les avisa: al abrir la pantalla de ese tipo sale una línea, y Francisco puede ver el cambio
   campo a campo (antes → después) y decidir si lo trae o lo deja.
4. **Los asuntos ya abiertos no se enteran de nada.** Sus hitos siguen como estaban. Un trámite
   empezado no cambia de reglas a mitad. Los asuntos nuevos sí nacen con la guía actualizada.

Y dos decisiones más, del 20-sep-2026, que se desarrollan en los apartados 4.6 a 4.8:

5. **Un hito puede estar marcado como "Solo informativo".** Se ve, pero no reclama trabajo.
6. **Un hito puede llevar su normativa**, con enlace al artículo en el sistema de normativa del
   centro.

Lo que NO entra en esta fila: los pasos-pregunta (las bifurcaciones) no se guardan en la
biblioteca. Un modelo es siempre un paso normal. Si Francisco intenta guardar un paso-pregunta en
la biblioteca, se le dice que no se puede y por qué, sin más.

## 3. Dónde se guarda

Fichero nuevo `_GESTOR/hitos-biblioteca.json`, **el decimotercer fichero compartido**. Se trata
igual que `guias.json` o `campos.json`: se relee del disco **justo antes de escribir**, nunca se
escribe desde una copia en memoria vieja (regla de siempre; ver `docs/contexto/ASUNTOS.md` y la
fila 61). Entra en las copias de seguridad diarias como los demás.

    {
      "version": 1,
      "modelos": [
        {
          "id": "<identificador corto, estable, nunca se reutiliza>",
          "nombre": "Registrar de salida en Séneca",
          "revision": 3,
          "titulo": "...",
          "explicacion": "...",
          "responsable": "...",
          "estadoDelAsunto": "...",
          "plazo": { ... },
          "requisitos": [ ... ],
          "comunicacion": { "correo": {...}, "seneca": {...} },
          "soloInformativo": false,
          "normativa": [ ... ],
          "creadoEl": "...", "actualizadoEl": "...", "actualizadoPor": "..."
        }
      ]
    }

- `nombre` es como se llama el modelo en la biblioteca (lo que Francisco busca). `titulo` es lo
  que se copia al paso. Pueden coincidir; al crear un modelo desde un paso, `nombre` nace igual
  que `titulo`.
- `revision` sube de uno en uno cada vez que el modelo cambia. Es lo único que hace falta para
  saber si un tipo está al día.
- Los campos `titulo`, `explicacion`, `responsable`, `estadoDelAsunto`, `plazo`, `requisitos` y
  `comunicacion` son **exactamente los mismos, con la misma forma**, que ya tiene un paso de guía
  (`Guias.normalizarRequisitos`, `Guias.normalizarComunicacion`). No inventes una forma nueva ni
  conviertas nada: se copian tal cual, en los dos sentidos.
- `soloInformativo` y `normativa` son campos nuevos, que a partir de esta fila tienen también los
  pasos de `guias.json`. Se describen en los apartados 4.6 y 4.7.
- Un paso de guía traído de la biblioteca gana un campo nuevo en `guias.json`:
  `origenBiblioteca: { id, revision }`. Un paso escrito a mano no lo lleva, y sigue funcionando
  exactamente como hoy.

## 4. Lo que ve Francisco

### 4.1 Traer un hito de la biblioteca

En el cuadro de escribir la guía de un tipo (`Guias.editar`), junto a "+ Añadir paso", un botón
nuevo **"+ Traer de la biblioteca"**. Abre un panel **dentro del propio cuadro** (no un segundo
cuadro emergente: solo hay un `U.preguntar`, regla de siempre) con:

- un buscador por nombre,
- la lista de modelos, cada uno con su nombre y, debajo y en gris, un resumen de una línea
  (responsable, plazo y cuántas casillas de "lo que hay que reunir" trae),
- al pulsar uno, se inserta como paso nuevo al final de la lista, ya con todos sus campos, y el
  panel se cierra.

Insertado, es un paso normal: se puede editar, mover y borrar como cualquier otro.

### 4.2 Guardar un paso en la biblioteca

En el editor de cada paso, junto al resto de sus botones, **"Guardar en la biblioteca"**:

- Si el paso **no** viene de la biblioteca: pide un nombre (propuesto: su título) y crea un modelo
  nuevo con `revision: 1`. El paso queda marcado con su `origenBiblioteca`.
- Si el paso **ya** viene de la biblioteca y no ha cambiado nada: el botón no sale.
- Si el paso viene de la biblioteca y **ha cambiado**: ver el punto siguiente.
- Si el paso es un paso-pregunta: el botón no sale.

### 4.3 Al guardar la guía, la pregunta

Al pulsar Aceptar en el cuadro de la guía, antes de escribir nada, se comparan los pasos que
llevan `origenBiblioteca` con su modelo. Por cada uno que haya cambiado, un `U.preguntar` con:

- el nombre del modelo,
- **la lista de lo que cambia, campo a campo, con el antes y el después** (el mismo componente de
  comparación del punto 4.4: escríbelo una sola vez y úsalo en los dos sitios),
- dos botones: **"Solo en este tipo"** (por defecto) y **"Subir también a la biblioteca"**.

"Solo en este tipo": no se toca la biblioteca. El paso conserva su `origenBiblioteca` con la
`revision` que ya tenía, y queda marcado como "cambiado aquí". Desde ese momento ese paso **no
vuelve a avisar** de cambios del modelo (Francisco ya dijo que esta versión es suya); el aviso del
punto 4.4 solo sale en los tipos que tienen el paso igual que el modelo.

"Subir también a la biblioteca": se relee el fichero, se guarda el modelo con los campos nuevos,
`revision` sube uno, y el paso de este tipo queda apuntado a esa `revision` nueva.

Si hay varios pasos cambiados, se pregunta uno detrás de otro, nunca dos cuadros a la vez.

**`soloInformativo` no cuenta como cambio del modelo.** Es una decisión de cada tipo, no del
modelo: si lo único que ha cambiado en un paso es esa marca, no se pregunta nada y no se toca la
biblioteca. La `normativa`, en cambio, sí es del modelo y sí cuenta como cambio.

### 4.4 El aviso en los demás tipos

En la pantalla de un Tipo de Asunto, sección 3 "Pasos del trámite", si algún paso viene de la
biblioteca con una `revision` anterior a la del modelo, sale una **línea ámbar** (misma clase
`.aviso-compartido` que ya usan los campos compartidos, no inventes otro estilo):

> "Registrar de salida en Séneca" ha cambiado en la biblioteca. **Ver el cambio**

"Ver el cambio" abre un cuadro con la comparación **campo a campo**: una fila por campo que
cambia, con el valor de este tipo a la izquierda y el de la biblioteca a la derecha, ambos
legibles (nada de código ni de JSON delante de Francisco). Los requisitos y los textos de
comunicación se comparan línea a línea, diciendo qué se añade y qué se quita. Dos botones:

- **"Traer el cambio"**: el paso se sustituye por la versión de la biblioteca y queda apuntado a
  su `revision`. **La marca `soloInformativo` del tipo se conserva**, no la pisa el modelo.
- **"Dejarlo como está"**: no se toca el paso, pero se apunta su `revision` a la del modelo, para
  que el aviso no vuelva a salir por ese mismo cambio.

Un aviso por paso. Si hay varios, varias líneas.

### 4.5 La biblioteca en Ajustes

Bloque nuevo **"Biblioteca de hitos"** en Ajustes → pestaña "El centro", con el mismo patrón que
"Campos propios": se engancha solo a `#ajustes-tab-centro`, sin tocar `js/ajustes-centro.js` por
dentro más que para colgarlo.

- Lista de modelos, cada uno con su nombre y su resumen de una línea.
- Crear uno desde cero, cambiarle el nombre, editarlo (el mismo editor de un paso que ya existe,
  reutilizado, sin escribir un segundo formulario) y borrarlo.
- Al borrar uno que está en uso, avisa y dice en qué Tipos de Asunto está (igual que
  `Campos.tiposQueUsanPropio`), sin bloquear. Los pasos ya insertados no se tocan: se quedan como
  pasos normales, sin `origenBiblioteca`.

### 4.6 Hitos solo informativos (20-sep-2026)

**El porqué.** La biblioteca va a guardar el trámite completo de cada gestión, incluidos los pasos
que hoy no hace Administración sino Jefatura de Estudios o Dirección (dar audiencia al alumno,
imponer la medida, dar cuenta a la comisión de convivencia). Francisco quiere tenerlos escritos,
porque son el mapa del procedimiento y el sitio natural donde poner la normativa. Lo que no quiere
es que esos pasos le reclamen trabajo a él mientras el equipo directivo no use la aplicación.

**Qué es.** Un campo nuevo, `soloInformativo` (sí/no, por defecto no), en un paso de guía, en un
modelo de la biblioteca y en un hito de un asunto.

**Qué hace un hito marcado así:**

- Se ve dentro del asunto, en gris más claro y con la etiqueta **Informativo**, con toda su
  información: explicación, responsable, plazo, lo que hay que reunir y su normativa.
- **No sale en "Qué me toca"**, ni en el bloque de pendientes ni en el de "Dormidos".
- **No pone fecha límite** en el asunto ni genera aviso de vencimiento.
- **No cuenta como pendiente** para saber si el asunto está al día.
- Sigue pudiendo marcarse como hecho a mano, y sigue teniendo su historial y sus documentos
  apuntados: un hito informativo que alguien decide cumplimentar funciona como cualquier otro.

**Cómo se enciende y se apaga.** Con un solo clic, en dos sitios:

- En el editor de un paso, dentro de la guía de un tipo: una casilla **"Solo informativo"**.
- En el propio hito de un asunto abierto, en su menú: **"Pedírmelo a mí"** (quita la marca) y
  **"Dejarlo solo informativo"** (la pone). Afecta a ese hito de ese asunto, no a la guía.

**Cómo nace al traer un hito de la biblioteca.** Decisión de Francisco: **nace marcado cuando su
responsable NO es Administración**. Si el responsable es Administración (o Secretaría), nace sin
marcar. La lista de responsables ya existe en Ajustes → El centro (`js/hitos-ajustes.js`): usa
esa lista, y considera "de Administración" al responsable que Francisco tenga configurado como
propio del puesto. Si no se puede determinar, nace sin marcar.

**Un asunto nuevo hereda la marca de su guía.** Un asunto ya creado no cambia, como todo lo demás
de esta fila.

### 4.7 La normativa del hito (20-sep-2026)

**El porqué.** El hito es el sitio donde ya vive lo que hay que reunir y lo que hay que comunicar.
Es también el sitio natural para dejar escrito de dónde sale el plazo o el trámite, con un enlace
para consultarlo.

**Qué es.** Un campo nuevo, `normativa`, en un paso de guía, en un modelo de la biblioteca y en un
hito de un asunto. Es una lista; cada entrada tiene cuatro datos, todos texto:

    { "cita": "Decreto 327/2010, art. 40.1",
      "bloque": "convivencia",
      "clave": "ROC-40.1",
      "url": "" }

- **`cita`** es lo único obligatorio. Es lo que se lee en pantalla.
- **`bloque`** y **`clave`** apuntan al sistema de normativa del centro
  (`fmargon780/normativa-escolarizacion`). El enlace se monta así:

        <dirección base> + "/" + bloque + "#r=" + clave

  Ejemplo: `https://normativa-escolarizacion.vercel.app/convivencia#r=ROC-40.1`
- **`url`** es para las normas que **no** están en ese sistema: un enlace directo al texto oficial
  del BOJA o del BOE. Solo se usa si no hay `bloque` y `clave`.
- Si una entrada no tiene ni claves ni `url`, la cita se ve como texto, sin enlace. No es un
  error.

**Los bloques válidos**, tal como los sirve hoy el sistema de normativa (comprobado el
20-sep-2026): `escolarizacion`, `convivencia`, `matricula`, `evaluacion`, `personal`, `economica`,
`becas`, `datos`, `opo`. En el desplegable se ven con nombre legible: Escolarización, Convivencia,
Matrícula y expedientes, Evaluación y titulación, Personal del centro, Gestión económica, Becas,
transporte y comedor, Datos y administración electrónica, Temario C1.1000.

**El formato de la clave es con guion y sin espacios**: `ROC-40.1`, `ROC-38.1.e)`, `O11-12.3`,
`D483-5`, `O11-DAprimera`, `PC-PE-11.3`. No es "ROC 40.1" con espacio. Si Francisco escribe un
espacio, conviértelo a guion al guardar, sin avisar.

**Dónde se pone la dirección base.** En Ajustes → El centro, junto a los demás Datos del centro
(donde ya vive la firma del director, `PlantillasAjustes.pintarFirmaYCentro`), un campo nuevo:
**"Dirección del sistema de normativa"**. Valor de partida:
`https://normativa-escolarizacion.vercel.app`, sin barra final. Si el campo está vacío, las citas
se ven sin enlace y no se rompe nada.

**Aviso, para que no sorprenda:** hoy el sistema de normativa todavía **no** abre el artículo con
`#r=`. Ese cambio está apuntado en la cola de aquel repositorio (`docs/ENLACE-POR-ARTICULO.md`).
Mientras no esté hecho, el enlace deja al usuario en la página del bloque, que ya es útil. No hay
que hacer nada aquí cuando se haga: los mismos hitos empezarán a abrir el artículo solos.

**Dónde se ve.** Debajo de la explicación del hito, un bloque discreto **"Normativa"** con una
línea por entrada. Cada línea: la cita, y si tiene enlace, se abre en una pestaña nueva
(`target="_blank" rel="noopener"`). Se ve igual en un hito normal y en uno informativo. En la
vista de solo lectura de los pasos de un tipo (sección 3 de su pantalla), igual.

**Dónde se escribe.** En el editor de un paso, un bloque **"Normativa"** con las mismas filas y un
botón "+ Añadir referencia": una casilla de texto para la cita, un desplegable de bloque, una
casilla para la clave y una casilla para el enlace externo. Nada de JSON delante de Francisco.

### 4.8 Qué pasa con los asuntos ya abiertos

Nada, como en el resto de la fila. Sus hitos no ganan `soloInformativo` ni `normativa` de forma
retroactiva: un hito sin esos campos se comporta como un hito normal y sin normativa. Al leer,
trata la ausencia del campo como `soloInformativo: false` y `normativa: []`.

## 5. Qué se toca de los hitos, y qué no

De la versión original de este documento decía "no se toca nada de `js/hitos*.js`". Con los
apartados 4.6 y 4.7 eso cambia, y solo en lo imprescindible:

**Sí se toca, lo mínimo:**

- El módulo que **crea los hitos de un asunto a partir de la guía**: tiene que copiar también
  `soloInformativo` y `normativa` al hito, igual que ya copia los requisitos y la comunicación.
- El módulo que **pinta la lista de hitos** (`js/hitos-panel-lista.js`): el gris y la etiqueta
  "Informativo", el bloque "Normativa", y las dos entradas del menú del hito.
- El módulo de **"Qué me toca"** (la pantalla registrada como `que-me-toca` en `App.PANTALLAS`):
  descartar los hitos con `soloInformativo` tanto en pendientes como en "Dormidos".
- Donde se calcula la **fecha límite y el aviso de vencimiento** de un asunto a partir de sus
  hitos: los informativos no cuentan.

**No se toca:** `js/hitos-requisitos.js`, `js/hitos-comunicar.js`, `js/hitos-documentos.js`.
`hitos.json` gana dos campos y ninguno es obligatorio.

**Sigue valiendo:** un tipo sin ningún paso traído de la biblioteca, y sin marcas ni normativa, se
comporta exactamente igual que hoy. Los asuntos ya creados, igual que hoy.

## 6. Los ficheros

Nuevos:

- `js/hitos-biblioteca.js` — el modelo: leer y escribir `_GESTOR/hitos-biblioteca.json` (con la
  relectura previa obligatoria), crear/editar/borrar un modelo, subir `revision`, y la función que
  compara un paso con su modelo y devuelve la lista de diferencias campo a campo (pura, sin DOM:
  es lo que se prueba sin navegador). Aquí va también la regla de 4.6 que decide si un hito traído
  nace marcado, y el montador del enlace de una referencia de normativa (función pura).
- `js/guias-biblioteca.js` — la pintura: el panel "+ Traer de la biblioteca", el botón "Guardar en
  la biblioteca" de cada paso, el cuadro de comparación (uno solo, usado por 4.3 y por 4.4) y el
  bloque de Ajustes → El centro.
- `js/hitos-normativa.js` — el bloque "Normativa": el editor de referencias dentro del editor de
  un paso, y la lista de solo lectura que se pinta en el hito y en la sección 3 de la pantalla de
  un tipo. Va aparte para no engordar los otros dos.
- `pruebas/biblioteca-de-hitos.mjs` — sin navegador: crear un modelo, traerlo a dos tipos,
  cambiarlo en uno, las dos respuestas de la pregunta (solo aquí / subir), que el otro tipo avisa,
  que "Dejarlo como está" calla el aviso, que borrar un modelo no rompe los pasos ya insertados, y
  que un paso-pregunta no se puede guardar en la biblioteca. Y de los apartados nuevos: que un
  hito traído con responsable distinto de Administración nace marcado y uno de Administración no;
  que cambiar solo la marca no pregunta nada ni toca la biblioteca; que "Traer el cambio" conserva
  la marca del tipo; que el enlace se monta bien con bloque y clave, que con solo `url` usa la
  `url`, que sin nada no hay enlace, y que con la dirección base vacía tampoco; y que un espacio
  en la clave se guarda como guion.

Se tocan, lo mínimo:

- `js/guias.js` — enganchar los botones nuevos, la casilla "Solo informativo", el bloque de
  normativa y la pregunta al aceptar. Toda la lógica va en los ficheros nuevos: `js/guias.js` solo
  llama. **Ya está cerca de su tope**: no lo engordes.
- `js/ajustes-tipo.js` — la línea ámbar de la sección 3.
- `js/ajustes-centro.js` — colgar el bloque nuevo y el campo de la dirección base, nada más.
- Los cuatro sitios de hitos que dice el apartado 5.
- `index.html` — los `<script>` nuevos, en el orden que toca (después de `js/guias.js`).
- `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/contexto/HITOS-Y-GUIAS.md`,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md`, `docs/COLA.md`.

Cualquier fichero que se acerque a las 400 líneas, se parte.

## 7. Al terminar

`npm test` en verde, subida a `main`, comprobar lo publicado con `curl`, y marcar la fila 79 como
HECHA. Un mensaje corto a Francisco: qué va a ver distinto en la pantalla de un Tipo de Asunto, en
la ficha de un asunto y en Ajustes → El centro.

## 8. Lo que viene después (no es de esta fila)

Francisco y Claude están montando el **contenido** de la biblioteca en una conversación aparte: los
Tipos de Asunto habituales de la secretaría de un IES andaluz y los hitos modelo de cada uno, con
su normativa. Eso se carga cuando esta fila esté hecha. No inventes contenido aquí: esta fila es
solo la herramienta.
