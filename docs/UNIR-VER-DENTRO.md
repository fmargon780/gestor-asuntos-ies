# Ver por dentro antes de unir

Instrucción para Claude Code. Escrita el 11 de septiembre de 2026.
Lee antes `docs/CONTEXTO.md`. Continúa `docs/NO-DUPLICAR-ASUNTOS.md`, ya hecha.

## El problema

La franja "Parecen el mismo asunto" funciona: Francisco ve tres grupos en su pantalla. Pero solo
tiene el botón **Unir**, y con el nombre de la carpeta no le basta para decidir. Palabras suyas:
*"¿cómo puedo ver con agilidad esos asuntos por dentro para poder determinar si son un duplicado
o no?"*.

Y hay un caso peor en su pantalla de hoy: tres COMPRA del mismo proveedor el mismo día que **no**
son duplicados. Esa franja le va a salir todos los días y no tiene forma de quitarla.

    260909 COMPRA 26-27 B37177 Executive Training Institute Malta MT 1918-8731
    260909 COMPRA 26-27 Díaz Torres, María Executive Training Institute Malta MT 1918-8731
    260909 COMPRA 26-27 Executive Training Institute Malta MT 1918-8731

## 1. La franja se despliega

A la derecha del título "Parecen el mismo asunto", un enlace **Ver qué hay dentro**. Al pulsarlo
la franja crece; al volver a pulsarlo se pliega. Nace plegada.

Desplegada, los asuntos del grupo salen **en columnas, uno al lado del otro**, para poder
compararlos de un vistazo. Aprovecha el ancho: las columnas se reparten el espacio a partes
iguales. Por debajo de 900 píxeles de zona de trabajo, una debajo de otra.

Cada columna lleva, en este orden:

- El **nombre de la carpeta**, y es un enlace: lleva a la ficha de ese asunto.
- Una línea con **fecha de apertura, estado y vía de comunicación**. Y la fecha límite si la tiene.
- **Los documentos**, uno por línea, con su nombre entero. Si no hay ninguno, "Sin documentos".
- **Las notas**, con su autor y su fecha. Si son más de tres, las tres últimas y "y N más".

Lo de dentro **solo se lee al desplegar**, nunca al pintar la lista: leer las carpetas de todos
los grupos en cada repintado haría lenta la pantalla. Una vez leído, se guarda en memoria hasta
que se recargue la lista.

## 2. Los documentos se abren desde ahí

El nombre de cada documento es un botón. Al pulsarlo se abre en el panel de la derecha, con
`Visor.abrir(handle, nombre)`, que ya existe en `js/visor.js`.

- El panel de la derecha no se cierra al moverse por la aplicación, así que Francisco puede ir
  pulsando un documento de una columna y luego otro de la otra, con la franja siempre delante.
- Los PDF y las imágenes se ven dentro. Un Word o un Excel se abren en otra pestaña, que es lo
  que `js/visor.js` ya hace hoy.
- El documento que se esté viendo queda marcado en su columna.

## 3. Botón "No son el mismo"

Al lado de **Unir**, un botón discreto **No son el mismo**. Hace desaparecer esa franja.

- Lo descartado se guarda en un fichero nuevo `_GESTOR/no-duplicados.json`, dentro de la carpeta
  compartida: si lo descarta uno, no le sale tampoco al compañero. Se escribe con `Copias.guardar`
  y **releyendo justo antes**, como todo lo compartido.
- Lo que se guarda es **la lista exacta de nombres de carpeta** del grupo, ordenada. Así, si
  mañana aparece un cuarto asunto con el mismo tercero, tipo y curso, el grupo ya es otro y la
  franja vuelve a salir. Eso es lo que se quiere.
- Si un asunto del grupo se archiva o se renombra, su apunte deja de valer solo, porque el grupo
  ya no coincide. No hay que limpiarlo.
- En **Ajustes**, un bloque nuevo **Duplicados descartados**, con la lista de lo descartado y un
  botón **Volver a avisar** en cada uno. Sin esto no hay vuelta atrás, y eso no vale.

## Cómo hacerlo

- Todo va en `js/unir-asuntos.js`, que ya existe y ya pinta la franja. Sus estilos, en
  `css/unir-asuntos.css` (créalo si no está, y añade su línea en `index.html`).
- El bloque de Ajustes lo crea el propio módulo, como hacen otros: no hay que tocar
  `js/ajustes.js`.
- Antes de colgar cualquier función de `App`, comprueba con un `grep` por `js/` que ese nombre no
  está cogido.
- Amplia `pruebas/duplicados.mjs`: que al desplegar salgan los documentos y las notas de cada
  asunto; que pulsar un documento llame al visor; que "No son el mismo" quite la franja y siga
  quitada al recargar; y que vuelva a salir si al grupo se le añade un asunto más. Comprueba que
  las pruebas fallan sin el arreglo antes de darlas por buenas.
- Sube `App.VERSION` con la hora de España.
- Apunta esto en `docs/CONTEXTO.md`, en la sección 5, junto a lo de duplicados, y añade
  `no-duplicados.json` a la tabla de lo que se guarda en `_GESTOR`.

## Lo que Francisco verá

En cada franja de duplicados, un enlace para abrirla y ver los dos asuntos en columnas, con sus
documentos pulsables. Y un botón para decir que no son el mismo y que no se lo vuelvan a
preguntar.
