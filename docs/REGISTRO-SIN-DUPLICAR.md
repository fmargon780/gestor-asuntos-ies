# Registrar un papel sellado sin quedarse con dos

Acordado con Francisco el 17 de septiembre de 2026. Fila 20 de `docs/COLA.md`.

Es el punto 9 de `docs/PROXIMOS-ASUNTOS.md`. La fila 2 (`docs/REGISTRO-EN-UN-PASO.md`) ya lee el
sello de Séneca dentro del PDF, y funciona; lo que no funciona es el camino que hay que recorrer
para llegar hasta ahí.

## Lo que hace hoy, contado por Francisco

1. Sube un documento a la carpeta del asunto y la aplicación lo nombra. Todavía no está
   registrado.
2. Ese fichero, ya nombrado, lo sube al registro de Séneca. Séneca le pone el sello y le devuelve
   un PDF nuevo.
3. Descarga ese PDF sellado a la carpeta del asunto. Ahí aparece como un documento más, con el
   nombre que le pone Séneca.
4. Vuelve al documento **viejo** y pulsa Registrar. Se abre el explorador de carpetas. Busca el PDF
   sellado que acaba de descargar, lo señala, la aplicación le lee el sello y él pulsa Registrar.
5. La aplicación **genera un tercer fichero**: el sellado, con el nombre bueno y su número de
   registro.
6. Y entonces tiene que borrar a mano el PDF que descargó, porque el mismo papel está dos veces
   con dos nombres distintos.

Dos quejas más, textuales:

- El sello **unas veces se detecta y otras no, con el mismo documento**. Él sospecha que depende de
  por dónde empieza el proceso.
- El explorador de carpetas **nunca se abre en la carpeta del asunto**, ni aquí ni en ningún otro
  sitio de la aplicación, y eso obliga a buscar a mano cada vez.

## El orden nuevo

El error de fondo es el orden: hoy Francisco tiene que avisar primero (pulsar Registrar) y buscar
el papel después. Pero el papel sellado **ya está en la carpeta**. Así que lo ve la aplicación, y
él solo señala de qué documento es.

### 1. Ver el papel sellado solo

Al abrir un asunto (y al refrescarlo), se miran los PDF de su carpeta y se les lee el sello.

Para no ponerse a leer PDF cada vez que se abre un asunto, dos filtros:

- **Solo los PDF cuyo nombre no lo ha puesto la aplicación.** El nombre de un documento del gestor
  sigue las reglas de `js/nombres.js`; lo que baja de Séneca no. Si el nombre ya cumple las reglas,
  no se toca: ese papel ya está colocado.
- **Memoria de lo ya mirado**, en `js/almacen.js` (no en los ficheros compartidos: esto es de cada
  ordenador). Se guarda, por asunto, el nombre y el tamaño de cada PDF ya leído y si tenía sello o
  no. Un fichero ya mirado no se vuelve a leer.

### 2. La línea de arriba

Si algún PDF trae sello, en la ficha del asunto, arriba, sale una línea:

    Este papel trae el sello de registro 26EM0368 (ENTRADA, 10/09/2026).
    ¿De qué documento es el registro?   [ lista de los documentos del asunto ]

- La lista son los documentos del propio asunto, el más reciente primero, con el mismo aspecto que
  las listas que ya se usan para elegir.
- Hay también un botón **No es un registro**, que marca ese fichero como mirado y deja de
  preguntar por él. No borra nada.
- Si hay varios PDF con sello, sale una línea por cada uno.

### 3. Renombrar, no copiar

Al señalar el documento del que es registro:

1. El PDF sellado **se renombra** con el nombre que le toca a ese documento ya registrado, con su
   número de registro, exactamente el mismo nombre que la aplicación genera hoy en el paso 5. Se
   usa `Carpetas.renombrarFichero`, que ya existe y ya prueba primero con `move()`.
2. El documento viejo, el que se subió sin sellar, **se va a la papelera** con
   `Papelera.mandarDocumentoDeAsunto`. Es lo que Francisco eligió: de la papelera se puede
   recuperar, así que no se pierde nada.
3. No se crea ningún fichero nuevo y no queda nada que borrar a mano.
4. En la ficha del asunto se apunta la nota de registro igual que se apunta hoy. Si ya había una
   nota del registro anterior, se sustituye, no se añade otra debajo.

Si el nombre nuevo ya existe en la carpeta (por ejemplo porque el paso se hizo dos veces), no se
pisa: se avisa en una línea y no se toca nada.

### 4. El botón Registrar de siempre se queda

Sigue haciendo falta para el papel que está en otro sitio (el escritorio, Descargas, una memoria).
No se quita, no se cambia de sitio y funciona igual. Solo se le arregla el explorador, que es el
punto siguiente.

### 5. El explorador, dentro de la carpeta del asunto

Esto se arregla **en toda la aplicación**, no solo aquí.

`window.showOpenFilePicker` y `window.showDirectoryPicker` admiten `startIn`, y acepta el
manejador de una carpeta. Donde la aplicación sepa en qué carpeta está trabajando, se le pasa:

- `Carpetas.elegirFichero()` gana un argumento opcional con la carpeta donde empezar, y todos sus
  llamadores le pasan la que corresponda: la carpeta del asunto abierto cuando se está en un
  asunto, la de Por clasificar cuando se está ahí, y así.
- Lo mismo en `js/traer-datos.js` y en cualquier otro sitio donde se abra un explorador.
- Si no hay carpeta conocida, se deja como está hoy: sin `startIn`, y el explorador se abre donde
  quiera. Nunca se revienta por esto.

### 6. Que el sello no falle unas veces sí y otras no

Es el arreglo de `js/registro-lector.js`, y es la causa de la queja de Francisco:

- **Todas las páginas, no solo la primera.** Hoy solo se lee la página 1. Se leen todas, hasta un
  tope de 10 páginas, y se para en cuanto se encuentre el sello.
- **El texto, limpio antes de buscar.** pdf.js devuelve el texto en trozos, y el mismo PDF puede
  partirlos de forma distinta según cómo se abra. Antes de aplicar la expresión de búsqueda se
  normaliza: todos los espacios, tabuladores y saltos de línea se convierten en un espacio simple.
  Y si así no se encuentra, se prueba una segunda vez sobre el texto **sin ningún espacio**. El
  sello de Séneca viene pegado (`.../M000000000368ENTRADAFecha: ...`), así que esa segunda pasada
  es la que salva los casos raros.
- Con las dos pasadas, la expresión de ahora se queda como está: no hay que reinventarla.
- Si después de todo eso no hay sello, el cuadro de Registrar sale vacío como hoy, para escribirlo
  a mano, y no se avisa de nada raro.

## Pruebas

Fichero nuevo `pruebas/registro-sin-duplicar.mjs`, con lo que se puede probar sin navegador:

1. La normalización del texto: el sello pegado, el sello con espacios de más y el sello partido en
   varias líneas dan los tres el mismo número de registro.
2. Un texto sin sello devuelve null y no lanza error.
3. Un nombre de fichero que ya cumple las reglas de `js/nombres.js` no se manda a leer.
4. Un fichero ya mirado y sin sello no se vuelve a leer.
5. El nombre nuevo del papel sellado es exactamente el que genera hoy el paso de Registrar, para el
   mismo documento y el mismo número de registro.
6. Si el nombre nuevo ya existe, no se renombra nada y se devuelve el aviso.

La batería completa (`npm test`) tiene que quedar en verde.

## Al terminar

- `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`: sustituir las líneas del registro y del lector del
  sello, no añadir otras debajo.
- `docs/HISTORIA.md`: esto, con el camino viejo de seis pasos y por qué se ha dado la vuelta al
  orden.
- En `docs/PROXIMOS-ASUNTOS.md`, dejar dicho que el punto 9 se termina en esta fila.
- Esto no toca el script de Apps Script: Francisco no tiene que pegar nada.
- Francisco ha dicho que probará el resultado con papeles de verdad y avisará si hay que cambiar
  algo. Es el único punto de esta cola donde su prueba hace falta de verdad.
