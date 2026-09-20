# La biblioteca de hitos del centro

Fila 79 de `docs/COLA.md`. Acordada con Francisco el 20-sep-2026.

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
  su `revision`.
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

## 5. Qué NO se toca

- `js/hitos.js`, `js/hitos-panel.js`, `js/hitos-panel-lista.js`, `js/hitos-requisitos.js`,
  `js/hitos-comunicar.js`, `js/hitos-documentos.js`: **nada**. Los hitos de un asunto vivo no
  cambian ni se enteran de la biblioteca. `hitos.json` no gana ningún campo.
- Un tipo sin ningún paso traído de la biblioteca se comporta exactamente igual que hoy.
- Los asuntos ya creados, igual que hoy.

## 6. Los ficheros

Nuevos:

- `js/hitos-biblioteca.js` — el modelo: leer y escribir `_GESTOR/hitos-biblioteca.json` (con la
  relectura previa obligatoria), crear/editar/borrar un modelo, subir `revision`, y la función que
  compara un paso con su modelo y devuelve la lista de diferencias campo a campo (pura, sin DOM:
  es lo que se prueba sin navegador).
- `js/guias-biblioteca.js` — la pintura: el panel "+ Traer de la biblioteca", el botón "Guardar en
  la biblioteca" de cada paso, el cuadro de comparación (uno solo, usado por 4.3 y por 4.4) y el
  bloque de Ajustes → El centro.
- `pruebas/biblioteca-de-hitos.mjs` — sin navegador: crear un modelo, traerlo a dos tipos,
  cambiarlo en uno, las dos respuestas de la pregunta (solo aquí / subir), que el otro tipo avisa,
  que "Dejarlo como está" calla el aviso, que borrar un modelo no rompe los pasos ya insertados, y
  que un paso-pregunta no se puede guardar en la biblioteca.

Se tocan, lo mínimo:

- `js/guias.js` — enganchar los dos botones nuevos y la pregunta al aceptar. Toda la lógica va en
  los ficheros nuevos: `js/guias.js` solo llama. **Ya está cerca de su tope**: no lo engordes.
- `js/ajustes-tipo.js` — la línea ámbar de la sección 3.
- `js/ajustes-centro.js` — colgar el bloque nuevo, nada más.
- `index.html` — los dos `<script>` nuevos, en el orden que toca (después de `js/guias.js`).
- `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/contexto/HITOS-Y-GUIAS.md`,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md`, `docs/COLA.md`.

Cualquier fichero que se acerque a las 400 líneas, se parte.

## 7. Al terminar

`npm test` en verde, subida a `main`, comprobar lo publicado con `curl`, y marcar la fila 79 como
HECHA. Un mensaje corto a Francisco: qué va a ver distinto en la pantalla de un Tipo de Asunto y
en Ajustes → El centro.
