# Que el enlace de la normativa abra el artículo, no el bloque entero

Fila 87 de `docs/COLA.md`. Diseño cerrado con Francisco el 21 de septiembre de 2026.

## Lo que pasa hoy

Francisco pulsó la cita de un artículo en el bloque "Normativa" de un hito y la aplicación le
llevó a la página entera del bloque, sin abrir el artículo.

Tres causas, las tres comprobadas el 21-sep-2026 contra la web publicada:

1. **La página limpia del artículo no estaba publicada.** El sistema de normativa
   (`fmargon780/normativa-escolarizacion`) tiene desde el 20-sep-2026 una vista que enseña un
   solo artículo, en `/norma#r=<clave>`. Su commit se fusionó en `main` pero Vercel no llegó a
   publicarlo: la última producción era la del commit anterior. **Ya está resuelto**: el
   21-sep-2026 se relanzó la publicación y `https://normativa.fmargon.com/norma#r=ROC-40` abre
   el artículo. No hay nada que hacer en este repositorio por esta causa; se apunta solo para
   que se entienda el resto.
2. **El Gestor enlaza al bloque, no al artículo.** `HitosBiblioteca.enlaceDeNormativa` monta
   hoy `<base>/<bloque>#r=<clave>`. El documento `docs/ENLACE-POR-ARTICULO.md` de aquel
   repositorio dice, desde el 20-sep-2026, que el enlace que debe usar el Gestor es
   `<base>/norma#r=<clave>`. Esto es lo que hay que cambiar aquí.
3. **La clave de ejemplo induce a error.** El recuadro de la clave lleva de marcador de posición
   `Clave: ROC-40.1`. Las claves reales son de **artículo entero, sin apartado**: `ROC-40`,
   `LOE-127`, `D19-12`. Con una clave con apartado no hay artículo que abrir y la página se
   queda como está, que es exactamente lo que vio Francisco.

## Qué hay que hacer

Cambios quirúrgicos. **No reescribas ningún fichero entero. No leas el repositorio entero.**

### 1. `js/hitos-biblioteca.js` — la función `enlaceDeNormativa`

Es una función pura, sin estado. Se queda con la misma firma, `(ref, direccionBase)`, y pasa a
comportarse así:

- **Con `ref.clave` y `direccionBase`**: devuelve la dirección de la vista de un solo artículo,
  `<base>/norma#r=<clave>`. El bloque **ya no interviene** en el enlace.
  - A `direccionBase` se le quita la barra final, como hasta ahora, y además un `/norma` final
    si lo llevara (Francisco podría haberlo escrito ya en Ajustes; que no salga `/norma/norma`).
  - La clave va por `encodeURIComponent`. La vista de destino hace `decodeURIComponent`, así que
    una clave con paréntesis o con acentos viaja bien.
- **Sin `ref.clave` y con `ref.url`**: devuelve `ref.url` tal cual. Ojo: la condición de hoy es
  `!ref.bloque && !ref.clave`; el bloque deja de contar, así que basta con que no haya clave.
- **En cualquier otro caso** (sin clave y sin url, o con clave pero sin dirección base
  configurada): devuelve `''`, y la cita se ve como texto suelto, sin enlace. Igual que hoy.

### 2. `js/hitos-normativa.js` — el editor de referencias

Tres retoques de texto, nada de lógica:

- El marcador de posición del recuadro de la clave pasa de `Clave: ROC-40.1` a `Clave: ROC-40`.
- Debajo de la lista de referencias, dentro del mismo `<details>`, una línea de ayuda en letra
  pequeña y color apagado: **«La clave es del artículo entero, sin apartado: ROC-40, no
  ROC-40.1.»**
- La primera opción del desplegable de bloques pasa de
  `(sin bloque: solo texto, o enlace propio)` a `(sin bloque)`, y el propio desplegable pierde
  protagonismo: **el bloque ya no hace falta para que el enlace funcione**. No se quita el
  campo ni se toca lo guardado — sigue sirviendo para saber dónde vive el artículo —, pero que
  su texto no dé a entender que sin bloque no hay enlace.

Si el retoque de texto de ayuda necesita CSS, va en el fichero de estilos donde ya vivan las
clases `paso-normativa` / `normativa-fila`, sin crear un fichero nuevo.

### 3. `js/hitos-normativa.js` — un aviso suave por la clave con apartado

Cuando el texto escrito en un recuadro de clave contenga un punto, se enseña junto a esa fila,
en letra pequeña, **«Las claves son de artículo entero: prueba con `ROC-40`.»** Es un aviso, no
un bloqueo: no se cambia lo escrito, no se impide guardar y no se abre ningún cuadro de diálogo.

### 4. Ajustes → El centro — el texto de ayuda de la dirección

En el campo "Dirección del sistema de normativa" (`js/plantillas-ajustes.js`, dato
`direccionNormativa`), que el texto de ayuda diga exactamente qué hay que escribir ahí:
**`https://normativa.fmargon.com`**, solo eso, sin `/norma` y sin el nombre de ningún bloque.
Y que avise de que la red del instituto bloquea las direcciones `vercel.app`.

No se cambia el valor guardado de nadie: solo el texto de ayuda.

### 5. `pruebas/biblioteca-de-hitos.mjs` — el apartado 8

El apartado 8 de esa prueba ("el enlace de una referencia de normativa") comprueba hoy la forma
vieja. Hay que reescribir sus cuatro comprobaciones y añadir dos:

1. Con clave y dirección base → `https://normativa.fmargon.com/norma#r=ROC-40`.
2. Con clave, dirección base y **bloque** → el mismo resultado: el bloque no cambia nada.
3. Con una dirección base que ya termina en `/norma` → el mismo resultado, sin `/norma/norma`.
4. Sin clave y con `url` → la `url` tal cual.
5. Sin clave, sin url → `''`.
6. Con clave pero con la dirección base vacía → `''`.

El apartado 9 (el espacio de la clave que se guarda como guion) se queda como está.

## Cómo se comprueba, una sola vez al final

`npm test` en verde. No hace falta comprobar nada después de cada cambio.

Además, un `curl` a `https://normativa.fmargon.com/normas/ROC.json` tiene que devolver 200 y
contener la clave `ROC-40`: es el fichero del que se alimenta la vista de un solo artículo. Si
devolviera 404, el sistema de normativa habría vuelto a quedarse sin publicar, y entonces esta
fila se marca **HECHA** igualmente (el código de aquí estaría bien) con una nota diciéndolo.

## Al cerrar la fila

- Apunta esta fila como **87** en la tabla de `docs/COLA.md`, ya **HECHA** con la fecha. Nació
  fuera de la cola, escrita directamente como documento; regístrala al cerrarla.
- En `docs/COLA.md`, sección **"Lo que queda por hablar con Francisco"**, añade esta línea:
  «Del 21-sep-2026: quitar el tecleo de la clave de normativa. En el apartado "Normativa" de un
  paso, un buscador que encuentre el artículo por su texto ("consejo escolar") y rellene la clave
  solo. Necesita que el sistema de normativa publique un índice ligero de claves y títulos.
  **Se diseña con Francisco a partir del miércoles 23-sep-2026 a las 14:00**, no antes.»
- `docs/CONTEXTO-CORTO.md` y el hijo de `docs/contexto/` que cubre hitos y guías: **sustituye la
  línea vieja**, no añadas una debajo. La línea que toca decir ahora es que la normativa de un
  hito enlaza a la vista de un solo artículo del sistema de normativa
  (`<base>/norma#r=<clave>`), con la clave de artículo entero y sin depender del bloque.
- `docs/HISTORIA.md`: la entrada del 21-sep-2026, con las tres causas de arriba y con el aviso
  de que un `main` fusionado no significa publicado — hubo que relanzar la publicación a mano en
  el otro repositorio.

## Ficheros que se tocan, y ningún otro

| Fichero | Qué |
|---|---|
| `js/hitos-biblioteca.js` | `enlaceDeNormativa` |
| `js/hitos-normativa.js` | marcador de la clave, línea de ayuda, texto del desplegable, aviso del punto |
| `js/plantillas-ajustes.js` | texto de ayuda del campo "Dirección del sistema de normativa" |
| el CSS donde vivan `paso-normativa` / `normativa-fila` | solo si hace falta para la letra pequeña |
| `pruebas/biblioteca-de-hitos.mjs` | apartado 8 |
| `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, `docs/contexto/<el de hitos y guías>`, `docs/HISTORIA.md` | al cerrar |

Sube directamente a `main`, **sin abrir ninguna petición de cambios**. Si la sesión no puede
tocar `main`, abre la petición y fusiónala tú mismo en cuanto esté en verde, según el permiso
permanente de Francisco anotado al final de `docs/COLA.md`.
