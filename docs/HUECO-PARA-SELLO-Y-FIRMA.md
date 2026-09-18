# Hueco para el sello de Séneca y para la firma del director

Instrucción de la cola, fila 57. Diseño cerrado con Francisco el 18 de septiembre de 2026.

**Sube directamente a `main`, sin abrir ninguna petición de cambios.** Cambios quirúrgicos: no
reescribas ficheros enteros y no leas el repositorio entero. Una sola prueba al final. Como
máximo dos subidas (regla 13 de la cola).

**Va después de la fila 56**, porque las dos tocan `js/ajustes-tipo.js`.

---

## 1. El problema

Cuando se registra un documento a mano en Séneca, Séneca pinta su sello **en todas las páginas**:

- Registro de **entrada**: banda estrecha arriba a la **derecha**.
- Registro de **salida**: banda estrecha arriba a la **izquierda**.

Si el documento tiene texto ahí, el sello lo pisa y el documento registrado queda ilegible en esa
zona.

Lo mismo pasa por abajo: los documentos que firma digitalmente el director (con AutoFirma) llevan
una banda de firma visible al pie, y esa banda también puede pisar texto.

Francisco no tiene medida exacta de ninguna de las dos bandas, así que las dos son configurables.

## 2. La solución, en corto

Un botón nuevo, **Preparar el documento**, que coge un PDF y deja libres la banda de arriba y la de
abajo: encoge el contenido de todas las páginas y lo recoloca dentro de la misma hoja.

Como el sello puede caer a la derecha o a la izquierda según sea entrada o salida, **se deja libre
toda la banda de arriba, de lado a lado**. Así vale igual para los dos casos y no hay que elegir.

**El orden de trabajo importa y hay que respetarlo:** primero preparar el documento, después
firmarlo, y por último registrarlo en Séneca. Un PDF ya firmado no se puede tocar sin invalidar la
firma (ver el punto 6).

## 3. Reglas de comportamiento

**Solo encoger, nunca agrandar.** Agrandar un documento escaneado lo deja borroso, y un documento
oficial no debe cambiar de tamaño respecto al original. La escala calculada nunca puede pasar de 1.

**Si ya hay sitio, no se toca nada.** Antes de trabajar, se comprueba página a página si las dos
bandas están libres. Si lo están en todas, no se escribe ningún fichero y se avisa con
`U.aviso(..., 'bueno')`: "Este documento ya tiene sitio para el sello y para la firma. No he tocado
nada."

**Solo se encoge lo necesario.** La escala se calcula con el hueco que hace falta, no con un valor
fijo.

**No se cambia el tamaño de la hoja.** Si una página es más pequeña que un A4 (media hoja, A5, un
justificante), se queda con su tamaño: se hace el hueco dentro de ella y no se convierte a A4. Si
un PDF trae páginas de tamaños distintos, cada una se trata por separado, con su propio tamaño.

**Las páginas giradas se respetan:** hay que trabajar sobre el tamaño visible de la página
(teniendo en cuenta su `/Rotate`), no sobre el crudo, o el hueco saldrá en el lado equivocado.

## 4. La cuenta

Todo en puntos PDF: **1 cm = 28,3465 pt**.

Para cada página, con `alto` y `ancho` del tamaño visible:

```
huecoArriba  = medida de Ajustes, en pt   (0 si el tipo no lleva sello)
huecoAbajo   = medida de Ajustes, en pt   (0 si el tipo no lleva firma)
altoUtil     = alto - huecoArriba - huecoAbajo
escala       = min(1, altoUtil / alto)
anchoNuevo   = ancho * escala
x            = (ancho - anchoNuevo) / 2          (centrado de lado a lado)
y            = huecoAbajo + (altoUtil - alto * escala) / 2
```

Se hace con **pdf-lib**, que ya está en el repositorio (`js/lib/pdf-lib.min.js`, cargada en
caliente por `PdfHerramientas.cargarPdfLib`). El camino es: documento nuevo → por cada página del
original, `embedPage` para incrustarla, `addPage` con el tamaño de la original, y `drawPage` con la
escala y la posición de arriba. El texto sigue siendo texto y no se pierde calidad.

**Aviso conocido:** `embedPage` no arrastra los enlaces ni las anotaciones de la página original.
Para los documentos que se registran esto no importa (son papeles para sellar), pero hay que
dejarlo escrito en `docs/CONTEXTO.md`.

**Si el hueco pedido no cabe** (los dos huecos sumados pasan de la mitad del alto de la página), no
se hace nada y se avisa: "El hueco que pides no cabe en esta hoja. Baja las medidas en Ajustes."

## 5. Saber si una banda está libre

Con **pdf.js**, que ya se carga en caliente igual que pdf-lib (`js/registro-lector.js`,
`js/documentos-sueltos-lector.js`): se pinta cada página en un `canvas` a resolución baja (ancho de
unos 700 px, suficiente y rápido) y se miran los píxeles de las dos bandas.

- Un píxel cuenta como "hay algo" si su luminosidad está por debajo de 200 (sobre 255). Así el
  gris del escaneo no cuenta.
- Una banda está **ocupada** si más del **0,3 %** de sus píxeles cuentan. Ese margen evita que una
  mota de polvo del escáner obligue a encoger un documento que está bien.
- Basta con que una sola página tenga una banda ocupada para que haya que preparar el documento
  entero: el sello se pinta en todas.

Funciona igual con documentos escaneados que con los escritos a ordenador, porque se mira la
página como imagen, no su texto.

Si pdf.js no puede abrir el PDF (protegido o roto), se avisa con el mensaje llano que ya existe
(`PdfHerramientas` tiene `errorDeLectura`) y no se toca el fichero.

## 6. Protección de los documentos ya firmados

Antes de preparar, hay que mirar si el PDF trae ya una firma digital. Basta con buscar en los bytes
del fichero las marcas `/ByteRange` y `/Type /Sig` (`/Type/Sig` también, sin espacio).

Si las trae, no se prepara sin más: se pregunta con `U.preguntar`, con este texto exacto:

> Este PDF ya está firmado digitalmente. Si le hago hueco ahora, la firma dejará de valer.
> Lo suyo es hacer el hueco antes de firmar. ¿Sigo de todas formas?

Si Francisco dice que no, no se toca nada.

## 7. Dónde está el botón

Donde ya viven las herramientas de PDF hoy, para no inventar un sitio nuevo:

- En la ficha de un asunto, en el bloque de **Documentos**, junto a Separar, Unir y Sacar páginas.
- En **Por clasificar**, con las mismas acciones, porque ahí entran los documentos que llegan de
  fuera.

Solo se ofrece para ficheros PDF (`PdfHerramientas.esPdf`).

## 8. El cuadro de Preparar el documento

Un solo `U.preguntar` (no se puede abrir un segundo mientras el primero espera):

1. **Vista previa de la primera página**, pintada con pdf.js, con las dos bandas marcadas encima en
   un color claro y semitransparente, y su rótulo ("sello de registro" arriba, "firma" abajo). Es
   lo que permite comprobar de un vistazo que el hueco basta.
2. **Una línea de texto llano** con lo que va a pasar: "Se encogerá al 94 % y quedará libre una
   banda de 1,5 cm arriba y 2,5 cm abajo, en las 3 páginas."
3. **Dos casillas**, *Hueco para el sello de registro* y *Hueco para la firma*, marcadas ya según
   los interruptores del tipo del asunto (punto 10). Al cambiar una casilla, la vista previa y la
   línea de texto se recalculan solas.
4. Botones **Cancelar** y **Preparar**.

Si al abrirlo las dos bandas ya están libres, no se abre el cuadro: se avisa y se acaba.

## 9. Qué se escribe al aceptar

- Primero el fichero viejo se manda a la **papelera** (`js/papelera.js`, que lo mueve), y después
  se escribe el nuevo **con el mismo nombre**. En ese orden, para que no choquen dos ficheros con
  el mismo nombre en la carpeta.
- Nada se borra del todo: el original se recupera desde la papelera.
- Todo el proceso dentro de `U.mientrasGuarda(boton, fn)`, con el botón apagado mientras trabaja.
- Al acabar se avisa en verde y se repinta el bloque de documentos, no la ficha entera.

## 10. Lo configurable

**En Ajustes → El centro** (`js/ajustes-centro.js`, en el mismo fichero de ajustes donde ya viven
los datos del centro), dos medidas nuevas, en centímetros con un decimal:

- *Banda para el sello de registro (arriba)* — por defecto **1,5**.
- *Banda para la firma (abajo)* — por defecto **2,5**.

Validar: entre 0 y 6 cm cada una. Si alguna se deja vacía, vale la de por defecto.

**En la pantalla de cada tipo de asunto** (`js/ajustes-tipo.js`, dentro de la sección "Datos del
tipo", sin crear una sección nueva), dos interruptores guardados en `tipos.json`:

- `llevaSello` — por defecto **sí**.
- `llevaFirma` — por defecto **no**.

Un tipo sin esos campos en `tipos.json` se comporta con esos valores por defecto: nada que migrar.

Si un tipo no lleva firma, el hueco de abajo es 0 y el documento se encoge menos.

## 11. Ficheros que hay que tocar

Nuevos:

- `js/pdf-margenes.js` — la cuenta y el PDF nuevo, con pdf-lib. **Sin nada de DOM**, igual que
  `js/pdf-herramientas.js`, para poder probarlo sin navegador:
  `PdfMargenes.calcularEncaje(ancho, alto, huecoArriba, huecoAbajo)` y
  `PdfMargenes.conHueco(bytes, huecoArribaCm, huecoAbajoCm)`, más
  `PdfMargenes.pareceFirmado(bytes)` y `PdfMargenes.CM_EN_PT`.
- `js/preparar-documento.js` — el cuadro, la vista previa con pdf.js, la comprobación de bandas
  libres, y el guardado con papelera.
- `pruebas/margenes-pdf.mjs` — con el estilo de `pruebas/separar-unir.mjs`.

Se cambian:

- `js/pdf-separar-unir.js` — añadir el botón "Preparar el documento" donde ya están Separar, Unir
  y Sacar páginas, en la ficha y en Por clasificar. Cambio corto: la lógica no va aquí.
- `js/ajustes-centro.js` — las dos medidas.
- `js/ajustes-tipo.js` — los dos interruptores, dentro de "Datos del tipo".
- `index.html` — los dos `<script>` nuevos, **después** de `js/pdf-herramientas.js` y **antes** de
  `js/pdf-separar-unir.js`. El orden importa.
- El CSS donde ya vive el de separar y unir: solo lo poco que haga falta para las bandas marcadas
  de la vista previa. Nada de una hoja nueva.
- `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/HISTORIA.md` al terminar,
  sustituyendo la línea vieja, no añadiendo una debajo.

Antes de colgar nada nuevo de `App`, comprobar que el nombre no está ya cogido.

## 12. La prueba

Un solo fichero de pruebas, al final, sobre `js/pdf-margenes.js` (no sobre la interfaz), con un PDF
hecho en la propia prueba con pdf-lib:

- `calcularEncaje` con A4 (595 × 842 pt) y huecos de 1,5 y 2,5 cm: escala menor que 1, contenido
  centrado de lado a lado, y el borde de abajo del contenido justo en el hueco de abajo.
- Con huecos de 0 y 0: escala exactamente 1 y ningún desplazamiento.
- Con un hueco absurdo (10 y 10 cm en un A4): devuelve que no cabe, sin escala negativa.
- **Nunca agranda**: una página muy pequeña (200 × 200 pt) con huecos pequeños da escala ≤ 1.
- `conHueco` conserva el número de páginas y el tamaño de cada hoja, incluidas dos páginas de
  tamaños distintos en el mismo PDF.
- `pareceFirmado` da falso en un PDF recién creado, y verdadero en unos bytes que contengan
  `/ByteRange`.

## 13. Qué no se toca

- Las plantillas de Word de la app: sus ficheros `.docx` los mantiene Francisco a mano. El botón
  sirve igual para los documentos que salen de ellas.
- El nombre del documento: el fichero preparado se llama igual que el de antes.
- Las reglas de nombres de carpetas y documentos.
- El registro en Séneca y la detección del PDF sellado (`js/registro-sellado.js`): siguen igual.
- `js/pdf-herramientas.js`: se usa tal cual (para `cargarPdfLib` y `esPdf`), no se cambia.
