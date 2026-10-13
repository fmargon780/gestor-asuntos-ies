# Repartir varios ficheros entre terceros

Fila 337 de `docs/COLA.md`. Diseño cerrado con Francisco el 13-oct-2026. Amplía la fila 141
(`docs/REPARTIR-ENTRE-TERCEROS.md`): léela antes, porque esta fila reutiliza todo lo que pueda de
aquella.

## De dónde sale esto

Un colegio adscrito manda los cuestionarios de altas capacidades del alumnado que viene a 1º de ESO.
A veces llegan en **un solo PDF** con todos seguidos: eso ya lo resuelve «Repartir entre terceros»
(fila 141) y no cambia. Otras veces llegan, o Francisco los deja, **en un fichero suelto por
alumno**. Hoy, en ese caso, tiene que crear a mano un asunto por alumno. Lo quiere igual de
automático que con el PDF único.

## Lo que se pide

### 1. El botón

En la tarjeta «Documentos» de la ficha de un asunto **abierto** (no en Por clasificar ni en el
ARCHIVO), con las mismas condiciones que hoy pone `Repartir.puede(a)`: un botón
**«Repartir ficheros entre terceros»**. Solo sale si el asunto tiene al menos dos documentos.

El botón de la barra del visor de un PDF (fila 141) se queda como está.

### 2. Elegir los ficheros

Al pulsarlo, el mismo cuadro de la fila 141 (`U.preguntar` ancho, con «Cerrar») empieza con la
lista de documentos del asunto, cada uno con una casilla, sin ninguna marcada. Francisco marca los
de los alumnos (por ejemplo, todos menos el oficio) y pulsa «Seguir». Vale cualquier clase de
fichero (PDF, Word, imagen); no se exige PDF.

### 3. La lista de ficheros

Una fila por fichero marcado, en lugar de los trozos de la fila 141, con lo mismo que tenía cada
trozo salvo lo de páginas:

- El nombre del fichero y, si es PDF, la miniatura de su primera página.
- El desplegable del tercero, igual que en la fila 141: los relacionados del asunto, tachados si ya
  tienen fichero, y debajo el buscador de todo el alumnado (si se usa, esa persona se añade a los
  relacionados). Sin la opción «Se queda en este asunto»: lo que no se quiera repartir, no se marca.
- La marca de lectura (verde «Leído del documento» / ámbar «Revísalo» / sin marca), con la misma
  comparación de nombres de `RepartirNucleo`.

**Verlo en grande** (pedido por Francisco el 13-oct-2026: con las miniaturas no puede leer de quién
es cada documento). El cuadro se parte en dos: la lista a la izquierda y, a la derecha, un visor
grande. Al pulsar una fila (o su miniatura), el fichero se ve ahí, a todo el alto disponible y con
sus páginas una debajo de otra: el PDF con pdf.js, la imagen tal cual y el Word con el visor de
Word que ya tiene la app. Al elegir el alumno de esa fila, el visor pasa solo al siguiente fichero
sin asignar. Lo mismo vale para el cuadro de trozos de la fila 141: al pulsar un trozo, sus páginas
se ven en grande en ese mismo visor de la derecha.

Para proponer el alumno de cada fichero:

1. Primero, **el nombre del fichero** (con la misma comparación tolerante de nombres).
2. Si el nombre no lo resuelve y es un PDF con texto, **el texto de dentro**, como en la fila 141.
3. Si nada lo resuelve, queda **sin asignar y en ámbar**. Aquí **no** se asigna por orden: el orden
   de unos ficheros sueltos no dice nada.

Un fichero sin asignar no se reparte. El resumen (punto 4) lo dice en ámbar, y se queda en el
asunto de origen.

### 4. Tipo y resumen

Igual que en la fila 141: «Crear para cada persona un asunto de tipo…» y «Tipo de documento de cada
fichero», con los valores del tipo (`repartirTipo`, `repartirTipoDocumento`) si los tiene. El
resumen, dentro del mismo cuadro: cuántos asuntos se crean, ya archivados; en ámbar, los
relacionados sin fichero, los ficheros sin asignar y quien ya tiene un asunto de ese tipo (con
«Crear igual»). Botones «Confirmar y repartir» y «Volver».

### 5. Al confirmar

Por cada fichero asignado:

1. Crea el asunto del alumno, **ya archivado**, como en la fila 141 (`RepartirCrear`, mismo
   archivado sin pregunta). La fecha y el registro de Séneca salen **del propio fichero** (su
   nombre o su ficha), no de otro.
2. Guarda dentro el fichero entero, con su extensión, nombrado con `Nombres.montarDocumento` y el
   tipo de documento elegido. Nota en ese asunto: «Viene de <carpeta de origen>, fichero <nombre>».
3. **Solo si el paso 2 ha salido bien**, quita el fichero del asunto de origen, por la papelera de
   siempre (nunca borrado a secas). Si algo falla, el fichero se queda en el origen.

En el asunto de origen:

- Una nota con el reparto: una línea por fichero, «<nombre del fichero> → Pérez López, Ana (asunto
  …)».
- La lista `repartos` de su ficha, con una entrada por esta tanda: los ficheros, el tercero de cada
  uno, la clave del asunto creado y si salió bien.

Progreso, aviso final y reintento, como en la fila 141: «Creando 5 de 29…», verde o ámbar con los
que fallaron, y al volver a abrir el cuadro, lo hecho sale como «Hecho» y solo se reintenta lo
fallido. Como un fichero ya repartido sale del origen, el reintento se ve en los que siguen ahí.

## Qué ficheros tocar

- `js/repartir-pantalla.js` (375 líneas): el paso de elegir ficheros y la lista por fichero. Si se
  acerca a 600 líneas, lo nuevo va a un módulo propio, `js/repartir-ficheros.js`
  (`window.RepartirFicheros`), con el estado común en `Repartir._interno`.
- `js/repartir-nucleo.js`: una función sin efectos que propone el tercero de un fichero por su
  nombre (reutilizando la comparación que ya hay).
- `js/repartir-crear.js`: crear el asunto con un fichero entero en vez de un trozo, y quitarlo del
  origen por la papelera tras comprobar que se guardó.
- `js/ficha-documentos.js` (413 líneas): el botón en la tarjeta «Documentos». Si hay punto de
  enganche, usarlo; si no, uno nuevo.
- `css/repartir.css` (el cuadro en dos columnas, a todo el ancho), `index.html` (solo si hay módulo
  nuevo). El visor grande, si no cabe en `js/repartir-pantalla.js`, en `js/repartir-visor.js`.
- `pruebas/repartir-ficheros.mjs` (nueva).
- `js/novedades.js`: «Repartir ficheros entre terceros: con un fichero por alumno, la app crea el
  asunto de cada uno, ya archivado, con su fichero.»
- `docs/contexto/DOCUMENTOS-PDF.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`,
  `docs/CONTEXTO-CORTO.md` (una línea en la sección 5), `docs/HISTORIA.md`, `docs/COLA.md`.

## Reglas de trabajo

- Las de `CLAUDE.md`: rama `fila-337`, revisor en local, fusión en `main` y una sola publicación a
  propósito.
- Cambios quirúrgicos: no reescribir ficheros enteros que ya existen.
- No leas el repositorio entero: `docs/CONTEXTO.md`, los hijos citados aquí, la fila 141 y los
  ficheros de esta lista.
- Pruebas: mientras trabajas, `npm test -- repartir`; la pasada completa, una vez al final.

## La prueba

`pruebas/repartir-ficheros.mjs`:

- Sin navegador (`vm`): proponer el tercero por el nombre del fichero (orden cambiado, sin tildes,
  Nº escolar → verde, solo nombre y primer apellido → ámbar, nadie → sin asignar).
- Con navegador y el disco de mentira: un asunto de colegio con 3 relacionados, un oficio y 4
  ficheros sueltos (2 con el nombre del alumno en el nombre del fichero, 1 PDF con el nombre solo
  dentro, 1 que no encaja con nadie). Se marcan los 4 y se reparte. Comprobar: 3 asuntos archivados
  en la carpeta de cada alumno con su fichero entero, su registro y la nota «Viene de…»; los 3
  ficheros ya no están en el origen y sí en la papelera; el cuarto y el oficio siguen en el origen;
  la nota del reparto y `repartos` están en la ficha del origen. Repetir no crea nada nuevo.
- La prueba de la fila 141 (`pruebas/repartir-entre-terceros.mjs`) sigue pasando sin cambios.

## Para Francisco al terminar

Lo que va a ver: en la tarjeta «Documentos» de un asunto abierto, el botón «Repartir ficheros
entre terceros». No hay nada que tenga que hacer él.

## Cómo sabemos que está bien

1. En la demo, la ficha de un asunto abierto con varios documentos enseña en su tarjeta
   «Documentos» el botón «Repartir ficheros entre terceros».
2. Al pulsarlo sale la lista de documentos con casillas, sin ninguna marcada.
3. Tras marcar varios y pulsar «Seguir», cada fichero sale con un alumno propuesto cuando su
   nombre lo dice, y sin asignar, en ámbar, cuando no encaja con nadie.
4. El resumen dice cuántos asuntos se crean y avisa en ámbar de los ficheros sin asignar.
5. Al confirmar, cada alumno asignado tiene un asunto archivado con su fichero (se ve en Archivo o
   en su ficha de persona).
6. En el asunto de origen ya no están los ficheros repartidos; sí siguen los no marcados y los sin
   asignar, y hay una nota con el reparto.
7. Los ficheros repartidos están en la Papelera.
8. El botón «Repartir entre terceros» de la barra del visor de un PDF sigue funcionando como antes
   (abre el cuadro de trozos por páginas).
9. Al pulsar una fila del cuadro de ficheros, el fichero se ve grande a la derecha y se puede leer
   el nombre del alumno; al elegir su alumno, el visor pasa al siguiente sin asignar.
10. En el cuadro de trozos (botón de la barra del visor de un PDF), al pulsar un trozo sus páginas
   se ven grandes a la derecha.
