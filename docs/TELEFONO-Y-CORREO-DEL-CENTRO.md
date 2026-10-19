# Teléfono y correo común del centro en documentos y correos (fila 375)

Tema 362, primera parte (idea 355). Diseñado con Francisco el 18-oct-2026.
La segunda parte del tema (el tutor sacado del Centro de datos) es la fila 376,
`docs/TUTOR-DESDE-EL-CENTRO-DE-DATOS.md`, y no se toca aquí.

## Qué pasa hoy

El Centro de datos entrega en su `configuracion.json` el **teléfono del centro**
(`centro.telefono`) y el **correo común del centro** (`correo.direccionDelCentro`).
El Gestor ya los lee y los apunta en `_GESTOR/centro-de-datos.json` (campos
`telefono` y `direccionDelCentro`, `js/centro-de-datos-configuracion.js`), pero
ninguna pantalla, plantilla ni documento los usa.

## Qué hay que hacer

1. **Dos huecos nuevos para las plantillas**, igual que el que ya existe para el
   nombre del centro (`{{CENTRO}}` en Word, `{centro}` en correos):
   - «teléfono del centro»: en Word `{{TELÉFONO DEL CENTRO}}`, en correos
     `{teléfono del centro}`.
   - «correo del centro»: en Word `{{CORREO DEL CENTRO}}`, en correos
     `{correo del centro}`.
   Se rellenan con lo apuntado del Centro de datos. El nombre interno tiene que ser
   literalmente «telefono del centro» y «correo del centro» (la app compara los huecos
   sin tildes ni espacios, `sinEspacios` en `js/plantillas.js`; un nombre como
   `telefonoCentro` no casaría). Se añaden a `Plantillas.HUECOS` (la lista de
   `js/huecos-buscador.js`) con etiquetas que digan claramente «del centro», para no
   confundirlos con `{telefono}` y `{correo}`, que son los de la persona del asunto.
   Si el dato no ha llegado, el hueco sale **en blanco y sin preguntar** (se añaden a la
   lista `SIN_FALTA` de `js/plantillas.js`): es un dato del centro y se arregla en el
   Centro de datos, no en cada documento.

2. **Un pie común** en todos los documentos de Word **que llevan membrete**, es
   decir, los que tienen el párrafo `{{MEMBRETE}}` (`js/membrete.js`). No se toca
   ninguna plantilla una a una: lo pone la app al generar el documento.
   - Una sola línea pequeña, centrada, en el pie de cada página:
     `Teléfono 9XX XXX XXX · Correo xxx@xxx` (con los datos reales).
   - Si falta uno de los dos datos, sale solo el otro, sin el «·» ni la palabra
     del que falta. Si faltan los dos, no hay pie.
   - Si la plantilla ya trae un `word/footer*.xml` con algún texto o campo (también
     solo el número de página), se deja tal cual y no se añade nada (sin aviso). Si
     no trae pie, o el que trae está vacío, se pone el nuestro.
   - Los documentos sin `{{MEMBRETE}}` (por ejemplo, formularios oficiales) salen
     exactamente como hoy, sin pie.
   - Letra: la del estilo Normal de `styles.xml` si lo tiene; si no, la de los
     valores por defecto del documento (en las plantillas de la app, Calibri 11).
     Tamaño 2 puntos menos, gris oscuro.

3. No se cambia la firma de los correos ni el membrete. No se cambia nada en
   Ajustes: estos dos datos se cambian en el Centro de datos, como el resto de
   datos del centro.

## Ejemplo con datos reales

El **Certificado de función tutorial** (`plantillas/certificado-funcion-tutorial.md`,
lleva `{{MEMBRETE}}`) de **Virginia Ruiz Martín**, que fue tutora en el centro (hay
un certificado suyo de noviembre de 2023). Al sacarlo, debajo de cada página sale la
línea con el teléfono y el correo del centro. En el modo de prueba (`?demo=1`) se usa
el profesorado de prueba y los datos de centro de prueba
(`js/demo/datos-centro-de-datos.js`): ya traen teléfono, pero el correo del centro va
vacío; hay que añadirle uno.

## Cómo sabré que está bien

1. Al sacar el Certificado de función tutorial de un profesor (en la prueba, uno del
   profesorado de prueba; en real, Virginia Ruiz Martín), abajo sale una línea
   pequeña con el teléfono y el correo del centro.
2. Otro documento con membrete sale con el mismo pie, sin haber tocado su plantilla.
3. Un documento sin membrete sale como hasta ahora, sin pie.
4. En una plantilla de correo se pueden poner el teléfono y el correo del centro, y
   el correo preparado los muestra ya rellenos.
5. Si al centro le falta el teléfono, el pie sale solo con el correo, sin huecos
   raros.

## Al terminar

Cuenta en `docs/CONTEXTO-CORTO.md`, en una línea, los dos huecos nuevos y el pie
común. Marca la fila 375 HECHA como siempre.
