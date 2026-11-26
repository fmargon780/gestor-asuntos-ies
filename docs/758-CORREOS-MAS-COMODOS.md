# 758 — Correos más cómodos

**Título llano:** Correos más cómodos
**Para qué:** que crear una plantilla de correo sea cómodo y que el correo pueda llevar negrita y tablas, sin tener que adjuntar un Word.
**Partes:**
1. La plantilla de correo, como un correo nuevo (fila 771)
2. Negrita y tablas en el correo (fila 772)

## Lo que escribió Francisco
Aviso de soporte del 25-nov-2026 (fila 741, pantalla «Herramientas», perfil Administración):
«Mejorar la usabilidad de esta pantalla de creación de plantillas de correo.»
(Captura: la ventana estrecha «Nueva plantilla», con Categoría, Tipo de asunto, Nombre, Asunto, Saludo, un recuadro «Texto» pequeño con barra de desplazamiento propia, Firma y más campos debajo que obligan a bajar.)

Idea del 25-nov-2026 (fila 749): «poder dar formato (negrita, tablas) al cuerpo de los correos que manda la app. Hoy el correo sale solo como texto; lo que se hace ahora es adjuntar un Word con formato.»

A la propuesta de Claude (26-nov-2026): «Me vale. Adelante.»

## Lo que entendió Claude (acordado con Francisco el 26-nov-2026)

### Parte 1 — La plantilla de correo, como un correo nuevo (fila 771)
- La ventana «Nueva plantilla» / «Cambiar plantilla» de correo deja de ser estrecha y **ocupa toda la pantalla**. Arriba, en una línea: el título, y los botones «Cancelar» y «Crear» (o «Guardar»).
- **Debajo del título, una línea** con Categoría, Tipo de asunto y Nombre de la plantilla, uno al lado del otro.
- **A la izquierda, el correo en el orden en que se lee:** Para, Copia y Copia oculta (los papeles de hoy), Asunto, Saludo, Texto y Firma. El recuadro «Texto» es grande y crece con lo escrito: no tiene barra de desplazamiento propia. Encima del Texto siguen «Campo variable» y «Texto condicional».
- Debajo de la Firma, lo que hay hoy y no es el correo: «Texto para Séneca (opcional)», plegado como ahora, y el desplegable de qué documento adjuntar.
- **A la derecha, «Así le llega»:** el correo entero como lo verá quien lo recibe (Asunto, saludo, texto y firma), con los datos de un asunto de ese tipo, o de muestra si no hay ninguno. Se actualiza mientras se escribe en cualquiera de los campos. Sustituye a la «Vista previa» de abajo de hoy.
- **Se arregla «Así sale»** del Asunto: tiene que usar el mismo asunto de ejemplo que «Así le llega» (hoy enseña otro asunto distinto, de otro tipo: en la captura, una baja de matrícula para una plantilla de «PAGO AYUDA TRANSPORTE»).
- Cada columna se desplaza por su cuenta; nada obliga a bajar para ver los botones.
- Lo mismo en el editor que se abre desde el cuadro de Correo («Guardar como plantilla nueva» y cambiar la plantilla desde ahí).
- Lo que se guarda en la plantilla no cambia en esta parte.
- Desaparecen: la ventana estrecha y la «Vista previa» de abajo.

### Parte 2 — Negrita y tablas en el correo (fila 772)
- **Encima del Texto de la plantilla, una barra de formato:** Negrita, Cursiva, Subrayado, Lista con puntos, Lista numerada y Tabla. «Tabla» mete una tabla (se elige cuántas filas y columnas) y, con el cursor dentro de una tabla, deja añadir o quitar una fila o una columna. «Campo variable» y «Texto condicional» siguen al lado y funcionan también dentro de una tabla.
- **Pegar desde Word conserva** la negrita, la cursiva, el subrayado, las listas y las tablas. El resto (letra, tamaño, colores, márgenes) se quita, para que todos los correos se vean igual.
- «Así le llega» enseña el formato.
- **La misma barra en el cuadro de Correo** al enviar, encima del cuerpo, para retocar el correo con formato antes de mandarlo.
- **El correo sale con su formato.** Quien lo recibe ve la negrita y las tablas (con sus bordes). Vale para todo lo que manda la app: el cuadro de Correo, el envío a todos de un asunto de grupo y los borradores.
- **El PDF del correo enviado** que se guarda en el asunto conserva la negrita y las tablas.
- **Séneca sigue en texto sencillo:** al pasar el texto al mensaje de Séneca, la app quita el formato y cada fila de una tabla queda en una línea, con sus casillas separadas por « · ». Si la plantilla tiene su «Texto para Séneca» propio, se usa ese, como hoy.
- «Copiar Cuerpo» copia con formato: al pegarlo en Gmail sale con negrita y tablas.
- **Las plantillas que ya existen se pasan solas,** sin perder nada: su texto sale igual, ahora en el editor con formato.
- **Mientras Francisco no actualice el script de Gmail,** el correo sale como hoy, en texto, y al enviar sale una línea ámbar: «El correo ha salido sin formato: falta actualizar el script de Gmail.» El envío nunca falla por esto.
- Las plantillas de correo siguen sin poderse descargar (regla del 25-nov-2026): con la barra ya no hace falta.
- Saludo y Firma siguen en texto sencillo, sin barra.
- Desaparece: el recuadro de texto sencillo del Texto de la plantilla y del cuerpo del cuadro de Correo.

## Pantalla de prueba
- Sin pantalla: el texto de arriba dice qué hay y dónde va; las dos partes pasan por la dirección de prueba antes de publicarse, y Claude las mira ahí.

## Qué NO se hace en esta tarea
- Formato en el Saludo y la Firma.
- Formato en el mensaje de Séneca (Séneca no lo admite).
- Descargar las plantillas de correo.
- Las plantillas de documento (Word) no cambian.

## Notas técnicas de Claude

### Las dos partes
- Leer antes `docs/PLANTILLAS-DE-CORREO.md` (origen), `docs/627-ASUNTO-Y-EXTRACTO.md`, `docs/510-PARRAFOS-SEGUN-EL-ASUNTO.md` (texto condicional) y `docs/737-GUIA-A-TODA-LA-PANTALLA.md` (cómo se hizo la otra ventana a toda la pantalla, `.capa > .cuadro`: cabecera y botones fijos, cada columna con su propio desplazamiento, nunca `overflow` en el cuadro entero).
- Ficheros: `js/plantillas-ajustes.js` (`cuerpoDelCuadroHTML`, `engancharCuadro`, `abrirCuadroDePlantilla`, `datosDeMuestra`), `js/plantillas-ajustes-editor.js` (editor en línea), `js/plantilla-papeles.js` (saludo, firma y destinatarios), `js/correo-cuadro-cuerpo.js` y `js/correo-cuadro.js` (cuadro de Correo). `js/plantillas-ajustes.js` pasa de 19 KB: lo nuevo, en ficheros nuevos apuntados en su `js/cargar-piezas-N.js`.
- Quien abre la ventana hoy (`js/comunes-cambiar.js`, `js/comunes-ventana-nuevo.js`, Herramientas › Plantillas, Ajustes del tipo) no cambia de llamada.
- Colores, letras y botones, los de la app. Aprovechar el ancho: sin renglones estrechos con espacio a los lados.
- Añadir la línea de cada parte a `js/novedades.js`. Poner al día lo que describa estas pantallas en `docs/contexto/`.
- El juego de demostración (`?demo=1&auto=1`) debe tener al menos un tipo con un asunto abierto y una plantilla de correo con papeles, saludo, firma y un campo variable; si no, añadirlo.

### Parte 1
- «Así sale»: pasar a `engancharAsunto` (`AsuntoExtractoCampo.enganchar`, opción `valores`) los valores del mismo asunto de ejemplo que usa `datosDeMuestra`, para el tipo elegido; al cambiar de tipo, se recalculan los dos.
- «Así le llega»: componer saludo + texto + firma como los compone el cuadro de Correo al abrir con esa plantilla (vacíos: el saludo de siempre y la firma de Ajustes), con `Plantillas.rellenar`.

### Parte 2
- Editor: `contenteditable` con su barra, sin librería nueva si se puede. Solo se admiten estas etiquetas: `b/strong`, `i/em`, `u`, `p`, `br`, `ul`, `ol`, `li`, `table`, `thead`, `tbody`, `tr`, `th`, `td`. Todo lo demás se limpia al pegar y al guardar (sin `style`, `class` ni `font`), y nunca entra `script` ni atributos `on…`.
- Guardado en `plantillas.json`: el `texto` de siempre en texto sencillo (sacado del formato, con la regla de Séneca para las tablas) y un campo nuevo `html` con el formato. Así un ordenador con la versión anterior sigue leyendo `texto`. Una plantilla sin `html` se abre con su `texto` pasado a HTML (escapado, saltos de línea a párrafos o `<br>`).
- `Plantillas.rellenar` sobre el HTML: los valores de los campos se escapan antes de entrar; el texto condicional tiene que funcionar igual que en texto sencillo. Pruebas con un campo cuyo valor lleva `<` y `&`.
- Envío: el cuerpo viaja al script en dos formas, `cuerpo` (texto sencillo, como hoy) y `cuerpoHtml` (con estilos en línea para las tablas: borde fino, separación en las casillas). En `apps-script/gestor-correos.gs`, `enviarCorreo` y el borrador (línea 1049 y siguientes) pasan `htmlBody` en `opciones` cuando llega `cuerpoHtml`; `texto` sigue como texto alternativo. Subir `VERSION_SCRIPT`. La app sabe si el script ya admite formato por su versión (`js/correo-version.js`); si no, manda solo `cuerpo` y enseña la línea ámbar. Mismo camino en `js/grupo-enviar.js`.
- PDF del correo enviado (`js/correo-enviado-pdf.js`, pdf-lib): negrita con Helvetica-Bold y tablas con sus líneas; si una tabla no cabe a lo ancho, se reparte el ancho entre columnas y el texto salta de línea dentro de la casilla.
- Séneca (`js/correo.js`, `MAXIMO_LETRAS_SENECA`): se cuenta y se recorta sobre el texto ya sin formato.
- «Copiar Cuerpo»: `navigator.clipboard.write` con `text/html` y `text/plain`; si el navegador no deja, texto sencillo como hoy.
- **Paso de Francisco:** al terminar, la fila `IDEA (fecha · paso de Francisco)` de `docs/METODO-COMUN.md` 9 para actualizar el script de Gmail, con el enlace a la lista de proyectos de script.google.com (regla del 27-oct-2026). La fila 772 queda `ESPERA A LA IDEA M` hasta que esté hecho.

## Cómo lo comprueba el segundo revisor

### Parte 1
- En la demostración, Herramientas › Plantillas › nueva plantilla de correo: la ventana ocupa toda la pantalla, con «Cancelar» y «Crear» arriba.
- Categoría, Tipo y Nombre en una línea; a la izquierda Para, Copia, Copia oculta, Asunto, Saludo, Texto y Firma, en ese orden; debajo, «Texto para Séneca» plegado y el adjunto.
- El Texto crece al escribir mucho, sin barra propia; los botones siguen a la vista.
- A la derecha, «Así le llega» enseña el correo entero y cambia al escribir en Asunto, Saludo, Texto o Firma, y al insertar un campo variable.
- «Así sale» del Asunto y «Así le llega» usan un asunto del tipo elegido; al cambiar de tipo, cambian los dos.
- Crear y volver a abrir: todo sigue (papeles, asunto, saludo, texto, firma, Séneca, adjunto). Cambiar una plantilla que ya existía: guarda igual que antes.
- Desde el cuadro de Correo de un asunto, «Guardar como plantilla nueva» abre el mismo diseño.
- Qué hace la app que este texto no pide.

### Parte 2
- En la plantilla, la barra pone y quita negrita, cursiva, subrayado y listas sobre lo elegido.
- «Tabla» mete una tabla de las filas y columnas pedidas; dentro, se añade y se quita una fila y una columna; un campo variable entra en una casilla.
- Pegar un trozo con negrita, una tabla y un color: quedan la negrita y la tabla, no el color.
- «Así le llega» enseña negrita y tabla; guardar y volver a abrir las conserva.
- Una plantilla antigua, de solo texto, se abre igual que antes, sin perder saltos de línea.
- En un asunto, el cuadro de Correo con esa plantilla trae el formato y deja retocarlo con la misma barra.
- Con el script de la demostración sin actualizar, al enviar sale la línea ámbar y el correo se da por enviado.
- El texto que va a Séneca sale sin formato y con cada fila de la tabla en una línea.
- Qué hace la app que este texto no pide.

## Qué mirar al terminar
- Parte 1: abrir una plantilla de correo real y ver la ventana a toda la pantalla con «Así le llega».
- Parte 2: con el script actualizado, mandar un correo de prueba con negrita y una tabla y ver cómo llega a la bandeja y el PDF que queda en el asunto.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
