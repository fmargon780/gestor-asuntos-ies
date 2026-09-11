# Campos asociados a cada tipo de asunto

Instrucción para Claude Code. Lee antes `docs/CONTEXTO.md` y respeta sus reglas de trabajo
(pocos commits, `App.VERSION` con hora, una prueba por cada cambio, releer los ficheros
compartidos antes de escribirlos, `docs/CONTEXTO.md` al día en el mismo commit, comprobar que
Vercel sirve de verdad los ficheros nuevos). **No le preguntes nada a Francisco**: decide,
apunta la decisión en `docs/CONTEXTO.md` y sigue.

Diseño cerrado con Francisco el 11 de septiembre de 2026.

## El problema

Hoy, al crear un asunto, lo único que distingue a dos asuntos del mismo tipo y del mismo
tercero es la **descripción corta**, un texto libre que se escribe a mano cada vez. Dos
personas escriben lo mismo de dos maneras, y el nombre de la carpeta deja de ser homogéneo.

Al mismo tiempo, la aplicación **ya tiene** los datos que de verdad distinguen un asunto: la
unidad del alumno, la modalidad de Bachillerato, el puesto de un empleado, el NIF de una
empresa. Están en los CSV y no se usan para nombrar.

Lo que quiere Francisco: que **cada tipo de asunto sepa qué datos lleva**, que esos datos
salgan solos y ya rellenos al crear el asunto, y que vayan al nombre de la carpeta sin
escribirlos a mano.

## Lo que hay que hacer

### 1. De dónde salen los campos disponibles

Un tipo de asunto pertenece a una categoría (ALUMNADO, PERSONAL, EMPRESAS, OTROS). Los campos
que se le pueden asociar salen de tres sitios:

**a) Del fichero de esa categoría.** Cada columna del CSV es un campo posible: `RegAlum.csv`
para ALUMNADO, `personal.csv`, `empresas.csv`, `otros.csv`. La lista se construye **leyendo la
cabecera del fichero**, no una lista escrita a mano en el código. Si la descarga de Séneca trae
"Modalidad de Bachillerato", ese campo aparece solo.

> **Ojo, esto ya nos mordió una vez** (ver el apartado del DNI en `docs/CONTEXTO.md`):
> `p.campos` se queda **solo con las columnas que traen algo**. Para saber qué columnas
> **existen** hay que mirar la cabecera del CSV (`r.cabecera`), como hace `js/dni.js`. Usa la
> cabecera para ofrecer la lista, y `p.campos` para leer el valor de una persona concreta.

**b) Calculados.** Campos que no están en ninguna columna pero se sacan de otra. De momento uno
solo:

- **Curso**: la unidad sin su última letra. `1ºA` → `1º`, `1ºBachA` → `1ºBach`, `2ºFPB B` → se
  limpia el espacio sobrante. Sirve para cuando todavía no se conoce la unidad definitiva pero
  sí el curso. **No inventes la etapa**: si la unidad no la lleva, el curso sale sin ella. Si el
  CSV trae además una columna propia de curso o de etapa, esa columna ya está disponible por la
  vía (a) y Francisco elegirá la que prefiera.

Deja el mecanismo abierto: una tabla de campos calculados donde cada entrada es
`{ id, nombre, deQueColumna, comoSeCalcula }`, para poder añadir otro sin tocar el resto.

**c) Propios.** Los que Francisco cree a mano en Ajustes, para lo que no está en ningún fichero
(el trimestre, por ejemplo). Cada campo propio tiene:

- Nombre.
- Clase: **texto libre** o **lista cerrada** de valores.
- Si es lista, los valores, en el orden que él ponga.

Al crear un campo propio pasa por la guardia contra duplicados que ya existe
(`U.parecidos` y `U.dejaCrear` en `js/util.js`). **No la copies: llámala.** Es la quinta puerta;
apúntalo en `docs/CONTEXTO.md` junto a las otras cuatro.

### 2. Configurar los campos de un tipo, en Ajustes

En la pantalla de Ajustes (`js/ajustes.js`), en la lista de tipos de asunto, cada tipo lleva un
botón nuevo: **Campos**. Abre un cuadro con:

- Arriba, los campos ya asociados a ese tipo, **en orden**, con flechas para subir y bajar.
- Cada uno con dos casillas: **Obligatorio** y **Añadir al nombre de partida**.
- Abajo, el catálogo de campos disponibles para su categoría, **con un buscador de texto**: el
  `RegAlum.csv` trae muchas columnas y una lista entera no se puede leer.
- Un botón para crear un campo propio sin salir de ahí (misma idea que el tipo de documento,
  que se crea desde el propio cuadro).

Bloque nuevo en Ajustes, **Campos propios**, para verlos y cambiarlos todos juntos. Si un campo
propio está en uso por algún tipo, al borrarlo se avisa y se dice en qué tipos está.

El cuadro **aprovecha el ancho disponible**: nada de una columna estrecha con hueco a los lados,
y el título termina en el mismo borde que el contenido.

### 3. Cómo se guarda

Fichero nuevo `_GESTOR/campos.json`, en la carpeta compartida:

    {
      "propios": [
        { "id": "p1", "nombre": "Trimestre", "clase": "lista",
          "valores": ["1º", "2º", "3º"] }
      ],
      "porTipo": {
        "<la misma clave que usa tipos.json>": [
          { "origen": "fichero",   "columna": "Unidad", "obligatorio": true,  "enNombre": true },
          { "origen": "calculado", "id": "curso",       "obligatorio": false, "enNombre": true },
          { "origen": "propio",    "id": "p1",          "obligatorio": false, "enNombre": true }
        ]
      }
    }

- Usa **la misma clave con la que `tipos.json` identifica un tipo**. Míralo antes de escribir
  nada; no inventes una clave nueva.
- **Se relee justo antes de escribirlo**, como todos los ficheros compartidos. Son dos
  ordenadores sobre la misma carpeta.
- Entra en las copias de seguridad y en la guardia de fichero roto del plan de robustez, igual
  que los demás JSON.
- Si el fichero no existe, todo funciona como hoy. **Un tipo sin campos configurados se comporta
  exactamente igual que antes de este cambio.**

### 4. Crear un asunto

En `js/asuntos-nuevo.js`, después de elegir el tipo y el tercero, sale un bloque **Datos del
asunto** con los campos configurados para ese tipo, en su orden.

- Cada campo sale **ya relleno** con el dato de ese tercero (vía (a) o (b)). Los propios salen
  vacíos, o con su desplegable si son de lista cerrada.
- Cada campo lleva al lado su casilla **Añadir al nombre**, marcada o no según lo configurado.
  Francisco puede desmarcarla en ese asunto concreto, sin tocar Ajustes.
- **Si el dato viene vacío** —la modalidad de un alumno de la ESO—, el campo sale vacío y se
  puede escribir a mano. No es un error y no se avisa de nada.
- **Obligatorio** quiere decir que el asunto no se crea hasta rellenarlo. Se marca con un
  asterisco, y al intentar crear se enfoca el primero que falte y se dice cuál es. Obligatorio y
  "añadir al nombre" son cosas distintas: un campo puede ser obligatorio y no salir en el nombre.
- La **vista previa del nombre** se actualiza al escribir o al marcar y desmarcar.

### 5. Dónde van en el nombre

La regla de nombres de `docs/CONTEXTO.md` no cambia de forma; se concreta el hueco del texto
libre:

    AAMMDD TIPO [AÑO ACADÉMICO] [campos, en el orden de Ajustes] [descripción corta] Tercero

- El tercero **sigue yendo siempre al final**.
- Solo entran los campos con "Añadir al nombre" marcado y con valor. Un campo vacío no deja
  hueco ni doble espacio.
- Cada valor se limpia antes de entrar: se quitan los caracteres que no valen en un nombre de
  fichero (`/ \ : * ? " < > |`), se recortan los espacios de los extremos y los espacios
  repetidos se convierten en uno.
- El montaje vive en `js/nombres.js`. **Ahí, y en ningún otro sitio.**
- Si el nombre resultante pasa de **180 caracteres**, se avisa antes de crear y se deja decidir:
  las rutas largas dan problemas en un Dropbox sincronizado.

**El interruptor "Añadir el grupo al nombre" que ya existe se queda como está**, para no romper
lo que funciona. Pero si el tipo tiene configurado como campo la columna de la unidad o el
campo calculado Curso, **el interruptor viejo no se enseña**, para que el grupo no salga dos
veces. La regla de Bachillerato (`1ºBachA`, no `1ºA`) sigue valiendo igual.

### 6. Los valores se guardan con el asunto

En la ficha del asunto de `_GESTOR/asuntos.json`, una entrada nueva `campos`:

    "campos": { "<clave del campo>": { "valor": "1ºBach", "enNombre": true } }

Para qué sirve: para poder **editar** el asunto después, y para que más adelante se pueda contar
y filtrar por esos datos sin releer el nombre de la carpeta.

En `js/asuntos-editar.js` el cuadro de editar enseña los mismos campos, rellenos con lo que se
guardó, y al aceptar **renombra la carpeta** como ya hace hoy. En el ARCHIVO sigue sin haber
botón Editar.

En `js/ficha-asunto.js`, los campos con valor se enseñan en el bloque de datos del asunto, uno
por línea, junto al estado y a la vía de comunicación.

## Cosas que no hay que hacer

- **No** meter estos campos en el nombre de los documentos. Esto es del asunto, no del papel.
- **No** añadir botones ni datos a la tarjeta de la lista de asuntos abiertos: la tarjeta se
  queda con lo justo, a propósito (`BOTONES_DE_LA_TARJETA`).
- **No** tocar el nombre de las carpetas ya creadas. Lo que está archivado es el rastro de aquel
  día.
- **No** pedirle a Francisco que rellene nada de los asuntos que ya existen. Los asuntos de
  antes se quedan sin campos y no pasa nada.
- Antes de colgar una función nueva de `App`, **comprueba con un `grep` que ese nombre no está
  cogido** en otro fichero. Pasó con `App.elegirTipo` el 10-sep-2026.

## Pruebas

Fichero nuevo `pruebas/campos.mjs`, prueba de navegador con el disco de mentira:

1. Con un `RegAlum.csv` que trae las columnas Unidad y Modalidad, se configura el tipo SANCION
   con Unidad (obligatorio, al nombre) y Modalidad (opcional, al nombre). Al crear el asunto los
   dos salen rellenos y el nombre de la carpeta los lleva en ese orden.
2. Se desmarca "Añadir al nombre" en Modalidad: la carpeta se crea sin ella, pero el valor se
   guarda en `asuntos.json`.
3. Un alumno de la ESO, con la Modalidad vacía: el campo sale vacío, deja crear el asunto y el
   nombre no lleva doble espacio.
4. Con Unidad marcada como obligatoria y vacía, no deja crear y dice qué falta.
5. El campo calculado Curso: `1ºBachA` da `1ºBach` y `1ºA` da `1º`.
6. Un campo propio de lista cerrada sale como desplegable, y su valor entra en el nombre.
7. Un tipo sin campos configurados crea el asunto **exactamente igual que antes**.
8. Editar el asunto cambiando un campo renombra la carpeta y la ficha viaja con ella.

Comprueba que cada prueba **falla sin el cambio** antes de darla por buena. Y una captura con
Playwright del bloque "Datos del asunto" y del cuadro de Campos de Ajustes, a 1905 píxeles, para
ver que aprovechan el ancho.

## Documentación

- Apartado nuevo en la sección 5 de `docs/CONTEXTO.md`: "Los campos de cada tipo de asunto",
  con qué hace, dónde vive, de dónde sale la lista y las decisiones de diseño de arriba.
- `campos.json` en la tabla de lo que se guarda en `_GESTOR`, y `campos` en la descripción de la
  ficha de `asuntos.json`.
- Los ficheros nuevos en la tabla de ficheros del repositorio.
- La concreción del hueco del texto libre, en la sección 4 (las reglas de nombres).
- En "Descartado, y no proponer otra vez": meter estos campos en el nombre de los documentos.

Mensaje final a Francisco: tres frases. Qué va a ver en Ajustes y qué va a ver al crear un
asunto.
