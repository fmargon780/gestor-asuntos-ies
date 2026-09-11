# Los duplicados, a su propia pantalla

Instrucción para Claude Code. Escrita el 11 de septiembre de 2026.
Lee antes `docs/CONTEXTO.md`. Continúa `docs/NO-DUPLICAR-ASUNTOS.md`, ya hecha.

## Los dos problemas

La franja "Parecen el mismo asunto" de `js/unir-asuntos.js` funciona: Francisco ve tres grupos
en su pantalla. Pero tiene dos pegas, y las dos las ha dicho él.

**Una: estorba.** Las franjas van encima de la lista y le tapan sus asuntos. *"Lo que no me gusta
es el lugar donde aparecen, me quita visión del resto de asuntos"*.

**Dos: no puede decidir.** Solo tiene el botón Unir, y con el nombre de la carpeta no le basta.
*"¿Cómo puedo ver con agilidad esos asuntos por dentro para poder determinar si son un duplicado
o no?"*.

Y hay un caso en su pantalla de hoy que hace falta poder callar: tres COMPRA del mismo proveedor
el mismo día que **no** son duplicados.

    260909 COMPRA 26-27 B37177 Executive Training Institute Malta MT 1918-8731
    260909 COMPRA 26-27 Díaz Torres, María Executive Training Institute Malta MT 1918-8731
    260909 COMPRA 26-27 Executive Training Institute Malta MT 1918-8731

## 1. En la lista de asuntos abiertos queda una sola línea

**Quita las franjas de la lista.** La detección y el agrupado se quedan como están
(`gruposDuplicados`, `claveDe`): lo que cambia es dónde se enseña.

En la cabecera de asuntos abiertos, al lado del botón **Tablón**, un aviso de una sola línea:

    ⚠ 3 posibles duplicados — Revisar

- **Revisar** lleva a la pantalla nueva del punto 2.
- Con un solo grupo, "1 posible duplicado".
- **Si no hay ninguno, la línea no sale.** Nada de un hueco vacío.
- No ocupa más de un renglón y no empuja la lista hacia abajo.

## 2. La pantalla "Duplicados"

Una pantalla propia, con su botón **Volver**, como tiene Ajustes. No hace falta ponerla en la
barra de la izquierda: se entra desde el aviso.

Dentro, los grupos uno debajo de otro. Cada grupo, en un recuadro, con los asuntos **en columnas,
uno al lado del otro**, para compararlos de un vistazo. Aprovecha todo el ancho: las columnas se
reparten el espacio a partes iguales. Por debajo de 900 píxeles de zona de trabajo, una debajo de
otra.

Cada columna lleva, en este orden:

- El **nombre de la carpeta**, y es un enlace: lleva a la ficha de ese asunto.
- Una línea con **fecha de apertura, estado y vía de comunicación**. Y la fecha límite si la tiene.
- **Los documentos**, uno por línea, con su nombre entero. Si no hay ninguno, "Sin documentos".
- **Las notas**, con su autor y su fecha. Si son más de tres, las tres últimas y "y N más".

Debajo de cada grupo, sus dos botones: **Unir** (lo que ya existe, sin cambios) y **No son el
mismo** (punto 4).

Lo de dentro de las carpetas **se lee al entrar en esta pantalla**, no al pintar la lista de
asuntos abiertos. La lista de abiertos se repinta a menudo y no puede ponerse a leer carpetas.

## 3. Los documentos se abren desde ahí

El nombre de cada documento es un botón. Al pulsarlo se abre en el panel de la derecha, con
`Visor.abrir(handle, nombre)`, que ya existe en `js/visor.js`.

- El panel no se cierra al moverse por la aplicación, así que Francisco puede ir pulsando un
  documento de una columna y luego otro de la otra, con la comparación siempre delante.
- Los PDF y las imágenes se ven dentro. Un Word o un Excel se abren en otra pestaña, que es lo
  que `js/visor.js` ya hace hoy.
- El documento que se esté viendo queda marcado en su columna.
- Con el panel abierto las columnas se estrechan: comprueba que siguen legíbles, y si no caben,
  que pasen a una debajo de otra.

## 4. Botón "No son el mismo"

Quita ese grupo para siempre. Vuelve a la pantalla de abiertos con el aviso ya actualizado.

- Lo descartado se guarda en un fichero nuevo `_GESTOR/no-duplicados.json`, dentro de la carpeta
  compartida: si lo descarta uno, no le sale tampoco al compañero. Se escribe con `Copias.guardar`
  y **releyendo justo antes**, como todo lo compartido.
- Lo que se guarda es **la lista exacta de nombres de carpeta** del grupo, ordenada. Así, si
  mañana aparece un cuarto asunto con el mismo tercero, tipo y curso, el grupo ya es otro y vuelve
  a avisar. Eso es lo que se quiere.
- Si un asunto del grupo se archiva o se renombra, su apunte deja de valer solo, porque el grupo
  ya no coincide. No hay que limpiarlo.
- En **Ajustes**, un bloque nuevo **Duplicados descartados**, con la lista de lo descartado y un
  botón **Volver a avisar** en cada uno. Sin esto no hay vuelta atrás, y eso no vale.

## Cómo hacerlo

- Todo va en `js/unir-asuntos.js`, que ya existe. Sus estilos, en `css/unir-asuntos.css` (créalo
  si no está, y añade su línea en `index.html`).
- La pantalla nueva y el bloque de Ajustes los crea el propio módulo, como hacen otros: no hay
  que tocar `js/ajustes.js` ni la barra de la izquierda.
- Quita de `js/unir-asuntos.js` lo que pintaba las franjas dentro de `#zona-asuntos`
  (`cajaDeFranjas`, `pintarFranjas`), y con ello los estilos que ya no se usen.
- Antes de colgar cualquier función de `App`, comprueba con un `grep` por `js/` que ese nombre no
  está cogido.
- Amplia `pruebas/duplicados.mjs`: que en la lista de abiertos **ya no haya franjas** y sí el
  aviso de una línea; que sin duplicados el aviso no salga; que la pantalla enseñe los documentos
  y las notas de cada asunto; que pulsar un documento llame al visor; que "No son el mismo" quite
  el grupo y siga quitado al recargar; y que vuelva a salir si al grupo se le añade un asunto más.
  Comprueba que las pruebas fallan sin el arreglo antes de darlas por buenas.
- Sube `App.VERSION` con la hora de España.
- Apunta esto en `docs/CONTEXTO.md`, en la sección 5, junto a lo de duplicados, y añade
  `no-duplicados.json` a la tabla de lo que se guarda en `_GESTOR`.

## Lo que Francisco verá

Su lista de asuntos abiertos, entera, sin franjas amarillas tapándola. Arriba, una línea que dice
cuántos posibles duplicados hay. Y una pantalla donde compararlos en columnas, abrir sus
documentos, unirlos o decir que no son el mismo.
