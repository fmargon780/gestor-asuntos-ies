# Separar, unir y sacar páginas de un PDF

Acordado con Francisco el 17 de septiembre de 2026. Fila 22 de `docs/COLA.md`.

Es el punto 4 de `docs/PROXIMOS-ASUNTOS.md`. Hoy la aplicación no sabe hacer nada de esto: no hay
ni un trozo de código que parta o junte un PDF.

## Los tres casos, con las palabras de Francisco

Le pasan los tres, y los tres en su trabajo normal:

1. Escanea varios documentos de una vez y le sale **un solo PDF con todo**. Necesita partirlo.
2. Un mismo documento le llega **en varios ficheros** (hojas sueltas, anexos aparte). Necesita
   juntarlos.
3. De un PDF largo solo le interesan **una o dos páginas**.

## Dónde se hace, y por qué

Francisco propuso hacerlo con el papel ya vinculado al asunto, "para que los documentos que
generemos sigan vinculados con el asunto". Es lo correcto y es el sitio principal: dentro de la
carpeta del asunto está la maquinaria de nombrar y de apuntar, y cada trozo nace ya colocado.

Pero hay un caso que eso deja fuera: un escaneo de golpe con papeles de **tres asuntos distintos**.
Si hubiera que vincularlo antes de partirlo, no se podría repartir. Por eso las mismas tres acciones
están **también en Por clasificar**, y desde allí cada trozo usa los botones que ya existen: "Crear
asunto con él" y "Meter en un asunto" (fila 12).

Es la misma máquina en los dos sitios: un módulo, un cuadro, dos entradas.

## La librería

Partir y juntar PDF no se puede hacer a mano como se hizo con el `.docx` (fila 17): la estructura
interna de un PDF, con su tabla de objetos y sus referencias cruzadas, no es un ZIP con XML dentro.
Se usa **pdf-lib**, copiada en `js/lib/` como ya está copiada pdf.js, y **cargada solo la primera
vez que hace falta**, con el mismo truco de `js/registro-lector.js`. No se trae de internet en
caliente: el fichero va en el repositorio, porque la aplicación tiene que funcionar con la red del
centro.

Las páginas se copian tal cual (`copyPages`), sin volver a dibujarlas: no se pierde calidad, ni el
texto, ni el sello de registro que lleven dentro. Para las miniaturas se usa pdf.js, que ya está.

## 1. Separar

Acción **Separar** en el menú de un PDF.

Sale un cuadro con **las páginas en miniatura**, en rejilla, aprovechando el ancho (Francisco lo
pidió el 11-sep-2026: páginas densas, sin huecos y sin obligar a bajar). Entre página y página, una
**tijera**: pulsarla marca un corte, volver a pulsarla lo quita.

- Arriba, en una línea: "Van a salir 3 documentos: páginas 1-2, 3-5 y 6".
- Los cortes se pueden poner y quitar cuantas veces se quiera antes de confirmar.
- Botón **Separar**, y un botón **Dejarlo**.

Al confirmar:

- **En un asunto:** por cada trozo, uno detrás de otro, sale el cuadro de ponerle nombre de siempre,
  con el número de trozo a la vista ("1 de 3") y su primera página en miniatura, para saber qué se
  está nombrando. Si a mitad de camino le da a Dejarlo, lo ya nombrado se queda y el resto no se
  crea; se avisa en una línea de lo que ha quedado a medias.
- **En Por clasificar:** no se pregunta nada. Cada trozo se queda ahí con el nombre del original y
  un número detrás: `escaneo 17-09 (1 de 3).pdf`.

El original se va a la **papelera** (`Papelera.mandarDocumentoDeAsunto` en un asunto,
`Papelera.mandarSuelto` en Por clasificar), igual que se acordó en la fila 20. No se borra nada de
verdad.

## 2. Unir

Acción **Unir** en el menú de un PDF. Se parte de ese PDF, que es el primero de la lista.

- Sale la lista de los **demás PDF del mismo sitio** (la carpeta del asunto, o Por clasificar), con
  casillas.
- Los señalados se ordenan con **flechas arriba y abajo**. El orden que se ve es el orden en que se
  van a pegar, y se ve la cuenta de páginas de cada uno.
- Botón **Unir**.

Al confirmar: sale un PDF con todas las páginas, en ese orden. En un asunto pasa por el cuadro de
ponerle nombre; en Por clasificar se queda con el nombre del primero y `(unido)` detrás.

**Todos** los originales que han entrado en la unión se van a la papelera. Si alguno no se puede
mover, la unión no se deshace: se avisa en una línea de cuál se ha quedado, para que no aparezca el
mismo papel dos veces sin saber por qué.

## 3. Sacar páginas

Acción **Sacar páginas** en el menú de un PDF.

El mismo cuadro de miniaturas del punto 1, pero en vez de tijeras, **una casilla en cada página**.
Se señalan las que interesan y sale **un solo documento** con ellas, en el orden del original.

Aquí **el original no se toca**: no va a la papelera. Sacar una copia de dos páginas no significa
que el documento entero deje de hacer falta.

## Reglas comunes

- Solo para PDF. En un fichero que no sea PDF, estas tres acciones no salen.
- Un PDF de una sola página no ofrece Separar (no hay dónde cortar), pero sí Unir.
- **Nunca se pisa un fichero.** Si el nombre que toca ya existe, no se escribe: se avisa en una
  línea y no se toca nada, como ya se hace en la fila 12.
- Si el PDF está protegido o roto y pdf-lib no puede abrirlo, se dice en una línea con palabras
  llanas ("este PDF no se puede partir: viene protegido") y no se hace nada.
- Los PDF grandes se trabajan en el navegador, que es donde vive la aplicación. Con un PDF de más de
  100 páginas, el cuadro de miniaturas las pinta **a medida que se ven**, no todas de golpe, para
  que no se quede pillado.
- Ninguna de las tres acciones toca `asuntos.json` más de lo que ya lo toca crear un documento
  nuevo: no hay campos nuevos, ni ficheros compartidos nuevos.

## Pruebas

Fichero nuevo `pruebas/separar-unir.mjs`, sin navegador, con un PDF de prueba montado en el propio
test con pdf-lib:

1. Partir un PDF de 6 páginas en 1-2, 3-5 y 6 da tres ficheros con 2, 3 y 1 páginas.
2. Sin ningún corte, Separar no hace nada y no borra el original.
3. Unir tres PDF respeta el orden señalado, y la cuenta de páginas es la suma.
4. Sacar las páginas 2 y 5 da un PDF de dos páginas, y el original sigue existiendo.
5. Si el nombre de salida ya existe, no se escribe nada y se devuelve el aviso.
6. Un fichero que no es PDF no ofrece ninguna de las tres acciones.
7. El original de Separar y los originales de Unir quedan apuntados en la papelera.

La batería completa (`npm test`) tiene que quedar en verde.

## Al terminar

- `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`: añadir la línea de este módulo y de la librería
  nueva de `js/lib/`, y sustituir lo que deje de ser verdad.
- `docs/HISTORIA.md`: esto, y por qué se usa pdf-lib en vez de hacerlo a mano como el `.docx`.
- En `docs/PROXIMOS-ASUNTOS.md`, dejar dicho que el punto 4 se hace en esta fila. Con eso la lista
  del 14-sep-2026 queda entera.
- Esto no toca el script de Apps Script: Francisco no tiene que pegar nada.
