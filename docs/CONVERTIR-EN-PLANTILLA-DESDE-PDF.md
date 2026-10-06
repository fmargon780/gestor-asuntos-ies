# Convertir en plantilla un PDF que no tiene su Word (fila 281)

Cerrado con Francisco el 6-oct-2026, en la misma conversación que la fila 280. **Va después de la
fila 280** (`docs/CONVERTIR-EN-PLANTILLA.md`) y se apoya en todo lo que ella deja hecho: léela
antes. Aquí solo está lo que cambia.

## Qué pidió

Al cerrar la fila 280 preguntó: «¿No podría valer también con documentos PDF?». Se le explicó, y
lo aceptó así:

- Si el PDF tiene su Word en el asunto, se usa el Word (ya lo hace la fila 280).
- Si no, la app lee el **texto** del PDF y monta una plantilla nueva: membrete de la app, título y
  párrafos. El formato del PDF (tablas, columnas, recuadros) no se puede copiar.
- Un PDF escaneado no tiene texto: no se puede.

## Qué hay que hacer

### 1. La entrada del menú

Con la fila 280, «Convertir en plantilla» sale apagada en un PDF sin Word, con «No encuentro el
Word de este PDF.». Desde esta fila, en un PDF sin Word **la entrada funciona**. Ese texto
desaparece.

### 2. Leer el PDF

Al pulsarla se lee el PDF con pdf.js (`js/lib/pdf.min.mjs`; cárgalo como lo hace
`js/registro-lector.js`, no de otra forma). Antes de abrir la pantalla se mira esto, por este
orden:

- **No tiene texto** (menos de 40 caracteres entre todas sus páginas): no se abre. Aviso ámbar:
  **«Este PDF es una imagen escaneada: no tiene texto que leer. No se puede convertir en
  plantilla.»**
- **Tiene casillas para rellenar** (campos de formulario, mirados con pdf-lib): no se abre. Aviso
  ámbar: **«Este PDF es un impreso con casillas. Los impresos van en «Impresos», no en
  plantillas.»**
- **Parece tener una tabla**: tres o más renglones seguidos con tres o más trozos de texto
  separados por huecos anchos (más de tres veces el ancho de un espacio) y alineados en las mismas
  columnas. Se pregunta antes de seguir (`U.preguntar`): **«Parece que este documento tiene una
  tabla. La tabla no se puede copiar: saldrá como renglones de texto.»**, con «Seguir» y
  «Cancelar».

Esto último es un cambio pequeño sobre lo hablado con Francisco (se le dijo que con tablas el
botón no haría nada): se avisa y se deja seguir, porque la regla que detecta una tabla puede
equivocarse y bloquear un documento que sí vale. Él lo descarta en la comparación si no le sirve.

### 3. Del texto del PDF a un Word

Dos funciones puras, cada una en su fichero, con su prueba sin navegador.

**a) Del PDF a párrafos** (`js/pdf-a-parrafos.js`). De los trozos de texto de pdf.js, con su
posición y su tamaño de letra:

- Los trozos de la misma altura forman un renglón, de izquierda a derecha.
- Renglones seguidos forman un párrafo mientras la separación entre ellos no pase de 1,5 veces el
  alto del renglón. Un salto mayor empieza párrafo. Un renglón que termina en guion de corte de
  palabra se une al siguiente sin el guion.
- De cada párrafo se guarda: el texto, si va centrado (sus renglones quedan centrados en la
  página, con margen de 10 puntos) y el tamaño de letra.
- El **título** es el primer párrafo centrado, o si no hay ninguno centrado, el primero de una
  sola línea con letra mayor que la del cuerpo. Puede no haber título.
- Los párrafos que se repiten iguales en todas las páginas (cabeceras y pies, números de página)
  se dan una sola vez y marcados como «repetido».

**b) De los párrafos a un `.docx`** (`js/docx-crear.js`). Un Word con el mismo aspecto que las
plantillas del centro: misma letra, tamaños y márgenes que salen de `scripts/hacer-plantillas.mjs`
(mira ese guion y uno de los `plantillas/*.docx`; no inventes otro estilo). El título, centrado y
en negrita; los demás párrafos, justificados. Para el ZIP, JSZip (`js/lib/jszip.min.js`, ya está) o
las funciones de `Docx.interno`.

Ese `.docx` es «el original» para todo el camino de la fila 280: las propuestas, lo que se marca a
mano, el membrete y el guardado funcionan igual, sin tocarlos.

### 4. Lo que cambia en la pantalla

- Arriba, una línea fija: **«Este PDF no tiene su Word: he copiado solo el texto. Las tablas y los
  recuadros no se copian.»**
- La casilla «Poner el membrete de la app» sale marcada, como siempre.
- En el grupo «Quitar» se proponen, marcados, además de lo de la fila 280:
  - los párrafos «repetidos» (cabeceras y pies del PDF);
  - los sellos de firma y de registro que el PDF lleva como texto: párrafos con «Firmado
    digitalmente», «Firmado por», «Código seguro de verificación», «CSV», «Verificación», la huella
    de AutoFirma, o un código de registro de Séneca suelto (`26EM1234`).
  Cada uno en su línea, con el principio del texto, y se puede desmarcar.
- En el paso 2, la columna «El original» enseña **el PDF** (con el visor de PDF de la app), no el
  Word montado. Así se compara con el documento de verdad.

### 5. Lo demás

Todo lo demás es la fila 280, sin cambios: de dónde sale, los grupos de cambios, «Esto se pregunta
cada vez», los datos de la plantilla, el hito y el guardado.

## Qué NO se toca

- El camino del `.docx` y el del PDF con su Word: siguen como en la fila 280.
- No se intenta copiar tablas, imágenes, columnas ni recuadros del PDF.
- No se lee texto de imágenes (un PDF escaneado no se convierte).
- El PDF original y la carpeta del asunto.

## Antes de empezar

- Lee `docs/CONVERTIR-EN-PLANTILLA.md` y cómo quedó hecho (`docs/contexto/` y los ficheros
  `js/convertir-en-plantilla*.js`). No leas el repositorio entero.
- Lo nuevo va en ficheros propios, ninguno por encima de 600 líneas. Cambios quirúrgicos en los de
  la fila 280.
- Textos de pantalla: los de este documento, tal cual.
- Rama `fila-281`, revisor en local y, con su APROBADA, a `main`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs convertir pdf`); la
  pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas, en la copia de demostración ni en los documentos.

## Ficheros

- `js/pdf-a-parrafos.js` (nuevo): apartado 3.a y las tres comprobaciones del apartado 2. Puro,
  salvo la lectura con pdf.js.
- `js/docx-crear.js` (nuevo): apartado 3.b. Puro.
- Los dos, en `index.html`, delante de `js/convertir-en-plantilla.js`.
- `js/convertir-en-plantilla.js`: el camino nuevo al elegir de qué fichero se parte.
- `js/convertir-en-plantilla-propuestas.js`: las propuestas de «Quitar» de un PDF.
- `js/convertir-en-plantilla-pantalla.js`: la línea fija y el PDF en «El original».
- `js/ficha-documentos.js` y `js/hito-mesa-documentos.js`: solo si la condición de «apagada» vive
  ahí.
- `js/demo/datos.js` o `js/demo/datos-plantilla.js`: lo de «Copia de demostración», abajo.
- `pruebas/convertir-en-plantilla-pdf.mjs` (nueva): renglones y párrafos con trozos inventados; el
  título; los repetidos; las tres comprobaciones; el `.docx` creado se abre y se rellena con
  `Docx.rellenar`. Y los puntos de abajo en navegador.
- `js/novedades.js`: «"Convertir en plantilla" vale también con un PDF que no tiene su Word: la app
  copia el texto y monta la plantilla con el membrete. Las tablas no se copian.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (en la misma línea que tocó la fila 280, sustituyendo),
  el hijo de `docs/contexto/` que tocó la fila 280, y `docs/HISTORIA.md`.

## Copia de demostración

En el asunto de **Aguilar Ponce, Pablo** (tipo MATRICULA):

1. Un PDF con texto de verdad, hecho con pdf-lib como los demás de la copia, con nombre de
   documento nuevo (`AAMMDD JUSTIFICANTE D26-….pdf`, fecha de hace 2 días), de dos páginas. En las
   dos páginas, arriba, el renglón «IES Fuente Lucena (copia de pruebas) - Secretaría». En la
   primera: el título centrado «JUSTIFICANTE DE MATRÍCULA»; un párrafo de dos renglones «Se hace
   constar que Pablo Aguilar Ponce, con número de identificación escolar 2100002, ha formalizado su
   matrícula en este centro.»; y otro «En Localidad de pruebas, a » con la fecha del documento en
   letra. En la segunda, un párrafo «Este justificante no tiene validez sin el sello del centro.»
   y, abajo, «Firmado digitalmente por Fernando Reyes Palma».
2. Un PDF con una tabla: tres renglones seguidos con tres columnas de texto bien separadas
   (`AAMMDD LISTADO D26-….pdf`).
3. Los PDF de mentira que ya hay (sin texto) sirven de PDF escaneado.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que «Convertir en plantilla» ya vale con un PDF sin Word, que copia solo el texto
y le pone el membrete, que con un PDF escaneado avisa y no hace nada, y que con una tabla avisa y
deja seguir (y por qué eso es distinto de lo hablado).

## Cómo sabemos que está bien

1. Abrir el asunto de «Aguilar Ponce, Pablo». En el menú ⋮ del PDF «JUSTIFICANTE», «Convertir en
   plantilla» está encendida. Pulsarla.
2. Se abre la pantalla «Convertir en plantilla» con la línea «Este PDF no tiene su Word: he copiado
   solo el texto. Las tablas y los recuadros no se copian.»
3. En el documento de la izquierda, «JUSTIFICANTE DE MATRÍCULA» está centrado y en negrita, y el
   párrafo «Se hace constar que…» es un solo párrafo, no dos renglones sueltos.
4. En «Datos de este asunto» hay líneas, marcadas, para «Pablo Aguilar Ponce» y «2100002».
5. En «Quitar» hay, marcadas, una línea con «IES Fuente Lucena (copia de pruebas) - Secretaría»
   (una sola, aunque está en las dos páginas) y otra con «Firmado digitalmente por…».
6. Poner de nombre «Justificante de matrícula» y pulsar «Ver cómo queda». En «El original» se ve
   el PDF, con sus dos páginas. En «Con la plantilla nueva» se lee «Pablo Aguilar Ponce»,
   «2100002» y «Este justificante no tiene validez sin el sello del centro.», lleva el membrete de
   la app, y no se lee «Firmado digitalmente».
7. Pulsar «Guardar plantilla»: aviso verde. En el asunto, el PDF sigue estando, con su nombre, y
   no hay ningún Word nuevo en su carpeta.
8. En el asunto de «Aguilar Ponce, Marina» (también MATRICULA), generar un documento con
   «Justificante de matrícula»: lleva «Marina Aguilar Ponce», «2100001» y la fecha de hoy.
9. En el asunto de Pablo, «Convertir en plantilla» sobre el PDF «LISTADO»: pregunta «Parece que
   este documento tiene una tabla…», con «Seguir» y «Cancelar». «Cancelar»: no se abre nada.
   Repetir y pulsar «Seguir»: se abre la pantalla. Cerrar con «Cancelar».
10. «Convertir en plantilla» sobre uno de los PDF sin texto que ya había en ese asunto: aviso ámbar
    «Este PDF es una imagen escaneada: no tiene texto que leer. No se puede convertir en
    plantilla.», y no se abre nada.
11. En el asunto de «Otero Campos, Marta», el PDF «COMUNICACION» (que tiene su Word en versiones
    previas) sigue abriendo la pantalla con «He encontrado el Word de este PDF y uso ese.», sin la
    línea de «he copiado solo el texto».
12. En el asunto de «Espejo Montes, Carla», «Convertir en plantilla» sobre su Word funciona como
    antes.
13. **[SOLO FRANCISCO]** Con un PDF de verdad del centro firmado con AutoFirma, guardado en un
    asunto real y sin su Word: mirar que el texto sale entero y en orden, y que los sellos de
    firma y de registro se proponen en «Quitar».
