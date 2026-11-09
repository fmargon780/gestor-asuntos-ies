# 566 — Al registrar, el documento registrado nunca se aparta

## Lo que escribió Francisco
Aviso de usuario (algo no funciona) desde el botón de soporte, 9-nov-2026 10:07.
Pantalla: Ficha de un asunto · Contexto: copia sin internet · perfil Administración ·
Versión: 6-nov-2026 · 14:17. Aviso completo:
https://drive.google.com/file/d/1M868kApzshcV7lz31fvBlHQkFMoMfdw0/view?usp=drivesdk

> En la imagen puedes ver que al pasar al hito de poner a la firma digital, el documento ha
> desparecido del panel derecho.

Captura: asunto COMPRA A26-0581 (Amazon), hito 4 de 5 «Firma digital Dirección», hitos 1 a 3
hechos. En el hito, «Documentos 0 · Ninguno todavía». En «Documentos de la carpeta»: «La carpeta
todavía está vacía» y «1 versión previa»: `261106 FACTURA D26-00416 SIN SELLAR.pdf`.

Añadió en el debate: «Al llegar a ese hito, lo que toca es primero poner el documento a la firma
del director en Séneca. Para ello, lo más cómodo es copiar la ruta del documento y ponerla en el
explorador de documentos a adjuntar en la parte correspondiente de Séneca. Si al llegar a este
hito no tengo documento a la vista, no sé qué ruta copiar.»

## Lo que entendió Claude (acordado con Francisco el 9-nov-2026)
- El fallo no está en pasar de hito: pasó al registrar la factura (hito 2). La factura registrada
  dejó de estar en la carpeta del asunto y solo quedó el original, apartado como «SIN SELLAR».
- Causa más probable: al registrar, la app tomó el mismo fichero como «sellado» y como
  «original», y lo apartó entero a versiones previas. No está confirmado en el disco del centro.
- Tras registrar, el documento registrado sigue siempre en la carpeta del asunto, con su «Ruta»
  y su marca de hito. A versiones previas solo va el original sin sellar, si es otro fichero.
- Si el fichero sellado y el original son el mismo, no se aparta nada: se apunta el registro y
  el documento se queda donde está, con su nombre.
- Nada más cambia en pantalla.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Que el hito nuevo muestre solo el documento del hito anterior (hoy se trae con «Traer a este
  hito» desde «Documentos de la carpeta»). No se ha pedido.
- Arreglar asuntos ya afectados: se hace a mano con «Sacar de versiones previas», que ya existe.

## Notas técnicas de Claude
- `js/registro-sellado.js`, `asociarNumerado` y `asociarSinMarcar`: si `nombrePdf ===
  nombreDocumentoOriginal` (mismo fichero), no renombrar a «SIN SELLAR» ni mover a previas; solo
  anotar el registro (`DocumentosDatos.anotar`, nota) y devolver el nombre del documento.
  Comparar también por handle (`isSameEntry`) por si los nombres difieren en mayúsculas.
- Antes de mover el original a previas, comprobar que el sellado sigue en la carpeta y que no es
  el mismo fichero. Al terminar, si el nombre final no existe en la carpeta, devolver desde previas
  lo apartado (`VersionesPrevias.sacar`) y avisar en rojo con `U.fallo`, en vez de dejarla vacía.
- Mismo patrón y misma protección en `js/ficha-firmas.js` (líneas 78-86, firmado sobre el propio
  original) y en `js/registro.js`, `guardarNumerado` (`otroFichero` cuando el fichero elegido es
  el mismo documento con otro handle).
- Revisar los que llaman a `RegistroSellado.asociar` (`ficha-sellos.js`, `grupo-registro.js`,
  `ruta-copia.js`, `hacer-este-hito-sello.js`) para que ninguno pase el mismo fichero dos veces.
- Prueba nueva en `pruebas/`: registrar con sellado y original iguales deja el documento en la
  carpeta y previas vacía; el caso normal sigue igual (registrado arriba, «SIN SELLAR» en previas).
- Línea en `js/novedades.js`: «Al registrar un documento, el registrado ya no puede quedar
  apartado en versiones previas».

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor. Claude Code lo comprueba con la prueba nueva y las de
  registro (`npm test -- registro sellado ruta firmas`).

## Qué mirar al terminar
- Registra un documento como siempre: tras registrar, sigue en «Documentos de la carpeta» con su
  «Ruta», y en versiones previas está solo el «SIN SELLAR».
- En el asunto COMPRA A26-0581, si no lo has hecho ya, saca la factura con «Sacar de versiones
  previas» y mira si trae el sello de Séneca.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
