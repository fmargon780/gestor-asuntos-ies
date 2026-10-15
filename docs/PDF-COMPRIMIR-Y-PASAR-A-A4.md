# PDF: comprimir a 5 MB y pasar las hojas a A4 (fila 349)

Idea 349 de Francisco, diseñada con él el 15-oct-2026.

## Lo que pidió (tal cual)

> 1º) Que si el pdf que subimos pesa más de 5 mbs la app lo comprima a un tamaño que cómo máximo
> sean esos 5 Mbs.
> 2º) A veces los documentos nos llegan en un tamaño muy grande, y el visor nos ajusta el tamaño
> con el zoom y no nos damos cuenta. Cuando registramos ese documento sale un sello minúsculo. La
> app debería poder detectar esos casos y ajustar el tamaño de la hoja a A4, por defecto, con la
> opción de otros tamaños estándar.

El sello lo pone Séneca sobre el PDF que se le sube: si la hoja es enorme, el sello sale diminuto.
Por eso el tamaño se arregla **al guardar el documento en la app**, antes de subirlo a Séneca, y no
al registrar.

## Lo decidido

### 1. Comprimir los PDF de más de 5 MB, sin preguntar

- Al guardar un PDF en un asunto (o en «Ver todo») por el cuadro de ponerle nombre, si pesa más de
  5 MB (5 × 1024 × 1024 bytes), la app lo comprime sola. Vale para todos los caminos que pasan por
  ese cuadro: subir un fichero, adjuntos de la bandeja de Gmail, «Ver todo», añadir desde un hito.
- Si queda en 5 MB o menos: aviso verde «Comprimido de 12,3 MB a 4,8 MB». Se guarda solo el
  comprimido (no se conserva el original).
- Si no consigue bajar de 5 MB sin que se lea mal (ver «Calidad mínima»), guarda el original tal
  cual y avisa en ámbar: «No se ha podido bajar de 5 MB sin que se lea mal; se guarda como está
  (12,3 MB)». Nunca es un error rojo ni impide guardar.
- Lo normal en lo que llega al centro son escaneos: la compresión consiste en volver a guardar las
  imágenes de las páginas con menos resolución y calidad JPEG, de menos a más agresivo, parando en
  el primer intento que baje de 5 MB. Calidad mínima: no bajar de 150 ppp de resolución efectiva ni
  de calidad JPEG 0,6. Un PDF de solo texto que pase de 5 MB se intenta igual (quitar duplicados,
  reescribir el fichero); si no baja, se guarda como está con el aviso ámbar.
- Mientras comprime, el cuadro dice «Comprimiendo…» (puede tardar unos segundos); no se queda
  colgado sin decir nada.
- Se hace en el navegador, como el resto de herramientas de PDF (pdf-lib / pdf.js ya cargados por
  `PdfHerramientas`). Código nuevo en su propio fichero (`js/pdf-comprimir.js`, solo bytes, sin
  disco ni DOM, igual que `js/pdf-margenes.js`).

### 2. Hojas más grandes que un A4: casilla en el cuadro de nombre

- Al abrir el cuadro de ponerle nombre a un PDF, la app mira el tamaño de sus hojas. Si alguna es
  claramente más grande que un A4 (más de un 10 % por encima de 210 × 297 mm en cualquiera de los
  dos lados, en cualquier orientación), sale en el cuadro una casilla **ya marcada**:
  «Las hojas son más grandes que un A4. Pasarlas a [A4 ▾]».
- El desplegable trae A4 (por defecto), A3, A5, Carta y Oficio. Si se desmarca (un A3 de verdad,
  un plano), el PDF se guarda tal cual.
- Pasar a un tamaño: cada hoja pasa a ese tamaño, conservando su orientación (una hoja apaisada
  queda en A4 apaisado), con el contenido encogido en proporción y centrado. Nunca se agranda una
  hoja que ya es menor que el tamaño elegido.
- Al terminar, en el mismo aviso verde del guardado: «Hojas pasadas a A4».
- Si un PDF necesita las dos cosas, primero se pasan las hojas a A4 y después se comprime.
- Si el PDF no necesita nada, el cuadro de nombre sale exactamente como hoy.

### 3. Para un PDF ya guardado

El botón **Ajustar tamaño** del visor (`PrepararDocumento`, `js/pdf-margenes.js`) añade una opción
«Pasar las hojas a [A4 ▾]», con el mismo desplegable y la misma cuenta que el punto 2. Usar la
misma función para los dos sitios (sin copiar código). El hueco para sello y firma sigue como está.

### 4. Un PDF con firma electrónica no se toca nunca

Si el PDF lleva firma electrónica (AutoFirma, el sello de Séneca, cualquier firma digital: campo
de firma o diccionario `/Sig` / `/ByteRange`), ni se comprime ni se le cambia el tamaño, porque
eso rompería la firma. En su lugar:
- Si pesa más de 5 MB: aviso ámbar «Lleva firma electrónica: no se comprime para no romperla».
- Si sus hojas son grandes: en vez de la casilla, una línea ámbar «Las hojas son más grandes que
  un A4, pero lleva firma electrónica y no se pueden cambiar».
- En «Ajustar tamaño», la opción nueva sale apagada con ese mismo motivo.
- El PDF sellado que devuelve un registro (camino de «Registrar») nunca pasa por esto.

## Lo que no cambia

- Word y otros ficheros: nada (solo PDF).
- Los documentos ya guardados no se recorren ni se comprimen en una pasada; solo lo nuevo que
  entra, y lo que alguien ajuste a mano desde el visor.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Añadir la línea de novedades en `js/novedades.js` (cambia algo visible).

## Cómo sabemos que está bien

1. En la demo, guardar en un asunto un PDF de prueba de más de 5 MB (escaneo de imágenes): se
   guarda en 5 MB o menos y sale el aviso verde con los dos tamaños.
2. Un PDF de más de 5 MB que no se puede bajar sin pasar de la calidad mínima se guarda tal cual,
   con aviso ámbar, sin error rojo.
3. Un PDF de 1 MB se guarda igual que hoy: sin aviso nuevo y con los mismos bytes.
4. Un PDF con hojas de 420 × 594 mm (A2): el cuadro de nombre trae marcada «Pasarlas a A4»; al
   guardar, todas sus hojas miden 210 × 297 mm (o 297 × 210 si eran apaisadas) y el contenido
   está entero y centrado.
5. Con la casilla desmarcada, el mismo PDF se guarda con sus hojas originales.
6. Eligiendo A3 en el desplegable, las hojas quedan en A3.
7. Un PDF A4 normal no enseña la casilla.
8. Un PDF con firma electrónica de más de 5 MB y hojas grandes: no cambia ni un byte, no sale la
   casilla y salen las dos líneas ámbar de «lleva firma electrónica».
9. En el visor, «Ajustar tamaño» tiene «Pasar las hojas a A4» y funciona sobre un PDF ya guardado;
   con un PDF firmado, la opción está apagada con su motivo.
10. Un PDF que entra por la bandeja de Gmail pasa por lo mismo (compresión y casilla).
11. El hueco para sello y firma de «Ajustar tamaño» sigue igual (sus pruebas pasan sin cambios).
12. **[SOLO FRANCISCO]** Con un PDF real que llegó enorme al centro: guardarlo, subirlo a Séneca y
    ver que el sello sale a su tamaño normal.
