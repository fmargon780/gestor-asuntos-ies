# Guardar el registrado de Séneca desde la ruta del documento

Fila 478 de `docs/COLA.md`. Tema 477, idea 473 (aviso de soporte de Francisco, 27-oct-2026 10:46).
Diseñado con Francisco el 27-oct-2026.

## Por qué

Desde la fila 423 cada documento tiene su botón pequeño «Ruta», que copia la ruta del documento con
su nombre y extensión. Francisco lo usa para subir el PDF a Séneca. Al descargar el registrado, si
pega esa misma ruta en el «Guardar como» del navegador, el registrado **sustituye en el disco** al
documento sin sellar:

- el original se pierde (no pasa a «Versiones previas»);
- `RegistroSellado.detectar` no lo mira, porque el nombre «parece de la aplicación»
  (`Documentos.pareceDeLaAplicacion`), así que no se apunta el registro ni se marca la tarea.

Antes guardaba en la carpeta con el nombre del navegador y la app hacía todo eso al detectar el
sello. Quiere aprovechar la ruta del documento y que sea automático, con menos clics.

Clave técnica: cuando el navegador escribe encima, el original ya no existe y la app no puede
recuperarlo (lee la carpeta con el permiso de carpeta del navegador, no con la API de Dropbox). Por
eso la copia del original se hace **al pulsar «Ruta»**, antes de descargar.

## Ficha del cambio

### Resumen que aprobó Francisco (máx. cinco líneas)
1. Pulsas el «Ruta» pequeño de un PDF y la app guarda por dentro una copia de ese PDF.
2. En Séneca descargas el registrado y lo guardas con esa ruta, encima del documento.
3. Al volver a la app, ve el sello: el anterior pasa a versiones anteriores como «SIN SELLAR», se
   apunta el número de registro en las notas y se marca la tarea «Registrar» del hito.
4. Si lo que llega no trae sello (por ejemplo, un firmado), no lo da por registrado: lo deja en su
   sitio, pasa el anterior a versiones anteriores y te avisa.
5. Desaparece el «pisado» de ahora; el resto (Registrar a mano, ruta de la carpeta, documento nuevo)
   no cambia.

### Qué verá y hará la usuaria cuando esté terminado
1. El botón «Ruta» de un PDF del asunto se ve y se comporta igual que hoy (copia la ruta, aviso
   verde con la ruta copiada). No hay botón nuevo ni pregunta nueva.
2. Tras guardar encima el PDF registrado y volver a la app (o al cabo de la mirada periódica de la
   carpeta), sale un aviso verde, **sin preguntar nada**:
   «Documento registrado (26SM0123). El original sin sellar se conserva en «_Previas».»
   (el código, el que dé `Nombres.codigoRegistro` con lo leído del sello; el nombre de la carpeta de
   previas, el que dé `VersionesPrevias.nombreDeCarpeta`).
3. En la ficha, el documento queda con el nombre y el registro que le pondría hoy «Registrar»: si su
   nombre lleva número de documento, el mismo nombre y el registro anotado en sus datos; si no lo
   lleva, el nombre con el código, igual que hace hoy `RegistroSellado` para esos nombres. En «Versiones previas» aparece el original como «SIN SELLAR».
4. En las notas del asunto aparece «Registrado 26SM0123 el … · <documento>. Se conserva el original
   sin sellar.» (la misma nota que hoy) y la tarea «Registrar» del hito queda marcada.
5. Si lo que se guardó encima no trae sello: lo llegado **se queda en su sitio** con el nombre del
   documento, el original pasa a «Versiones previas» con « ANTERIOR» en el nombre, no se apunta
   registro ni nota ni se marca tarea, y sale un aviso ámbar:
   «Lo que has guardado encima de <documento> no trae sello de registro. Lo he dejado; el anterior
   se conserva en «_Previas».»

### Qué NO cambia
- El «Ruta» de la carpeta, de los cuadros de Correo y de Séneca, y el de los documentos Word.
- La detección de PDF sellados con nombre del navegador (`RegistroSellado.detectar`, aviso con
  «Es un documento nuevo» / «Elige un documento…» / «No es un registro»): sigue igual. Es la vía
  para lo que llega por la bandeja electrónica ya registrado.
- «Registrar» a mano desde el menú de cada documento.
- El registro de los asuntos de grupo (`js/grupo-registro.js`, por referencia «Ref.»).

### Qué NO se hace en esta tarea
- Documentos firmados (tema 392). Pero el mecanismo (copia al pulsar «Ruta» y comprobación al
  volver) se escribe de forma que el tema 392 pueda añadir «trae firma» como otro caso sin rehacerlo:
  deja la decisión «¿qué ha llegado?» en una sola función.
- No se recupera nada de lo ya pisado antes de esta fila.

### Qué más se ve afectado (y qué pasa con cada cosa)
- Botón de documento de `js/copiar-ruta.js` (`botonDocumento`, y los huecos `ruta-documento-lugar`
  de la mesa del hito y de la barra del visor): al copiar la ruta de un **PDF** que está en la
  carpeta principal de un asunto **abierto**, guarda antes la copia. No en versiones previas, no en
  asuntos archivados, no en Word — decidido por Claude.
- Orden al pulsar «Ruta»: primero se copia la ruta al portapapeles (como hoy, para no perder el
  permiso del navegador) y después se hace la copia del PDF. Si la copia falla, aviso ámbar «No he
  podido guardar una copia de seguridad del documento»; la ruta ya está copiada — decidido por Claude.
- Dónde vive la copia: subcarpeta oculta del asunto, `_copia-ruta`, con el mismo nombre de fichero
  (así la ve también el otro ordenador, porque se sincroniza con la nube). Si ya había copia de ese
  documento, se sustituye. — decidido por Claude.
- Todo lo que recorre la carpeta del asunto tiene que ignorar `_copia-ruta`, igual que ignora la
  carpeta de previas: lista de documentos de la ficha y de la mesa, documentos sueltos y vigilancia
  (`js/documentos-vigilancia.js`, `App.esDocumentoDeTrabajo`), `RegistroSellado.detectar`,
  contadores, índice del expediente, comprimir/unir, archivar (al archivar, `_copia-ruta` se borra
  antes, no se lleva al ARCHIVO), cambio de nube (fila 458) y medida de rutas largas. Claude Code
  busca todos los sitios que listan subcarpetas del asunto — decidido por Claude.
- Cuándo se comprueba: al volver el foco a la pestaña, cada `App.SEGUNDOS_ENTRE_MIRADAS` y al abrir
  la ficha del asunto. Para no abrir todas las carpetas, al hacer la copia se apunta el asunto y el
  documento en una lista compartida en `_GESTOR` (la ven los dos ordenadores) y solo se miran esos;
  se quita de la lista al resolver o al borrar la copia. La comprobación se engancha de forma que no
  la corte la salida temprana de `App.mirarLaCarpeta` cuando no cambia nada arriba (función propia
  llamada desde el mismo temporizador y el mismo foco). En cada uno se comparan tamaño y fecha de modificación del
  documento con los de la copia, y si difieren, el contenido. — decidido por Claude.
- Escrituras de la propia app sobre ese PDF (preparar documento, guardar con tratamiento, sellar,
  comprimir, cualquier `escribir` de `Carpetas` sobre ese nombre): borran la copia y la quitan de la
  lista, para que la mirada no las tome por «llegado de fuera». Claude Code busca todos los sitios que
  escriben un fichero del asunto — decidido por Claude.
- Qué se hace cuando ha cambiado y trae sello (leído con `RegistroLector`, el mismo de hoy): lo mismo
  que `RegistroSellado.asociarNumerado`, pero con el original sacado de la copia: la copia se lleva a
  previas con el nombre «SIN SELLAR» (`nombreSinSellar`, `nombreLibreEntre`), el documento se queda
  con su nombre, `DocumentosDatos.anotar` con `anadirRegistro`, `Notas.sustituir` con la misma nota,
  y la tarea con acción `registrar` del hito marcada con la misma regla de hoy
  (`registro-sellado.js`, líneas de `Hitos.marcarGuionPorAccion`). Mejor reutilizar esas funciones
  que copiarlas.
- Si ha cambiado y no trae sello: lo llegado no se toca; la copia se lleva a previas como
  «<nombre> ANTERIOR» (con `nombreLibreEntre` si ya existe), aviso ámbar del punto 5. Así un PDF
  firmado con AutoFirma guardado encima nunca se deshace (el tema 392 decidirá qué más hacer con él).
- Si el documento no ha cambiado: la copia se queda hasta que pase una de estas: se vuelve a pulsar
  «Ruta» de ese documento (se sustituye), el documento ya no está con ese nombre al mirar (se
  borró o se renombró, desde la app o por fuera: la copia se borra), o el asunto se archiva (se
  borra). Sin límite de días: el registro en Séneca puede tardar. `_copia-ruta` vacía se borra.
- Dos ordenadores: antes de resolver, el ordenador renombra la copia a
  `<nombre>.resolviendo-<identificador del ordenador>`; si el renombrado falla o, tras releer la
  carpeta, aparece otro `.resolviendo-`, no hace nada. Así no quedan dos «SIN SELLAR». Un
  `.resolviendo-` de más de una hora se da por abandonado y se resuelve de nuevo — decidido por Claude.
- Si el registrado llega con el mismo tamaño y fecha que el original (no debería pasar): se compara
  el contenido; si es idéntico, no ha cambiado.
- Copia sin internet (`docs/` de la copia local): funciona igual, lee la misma carpeta.
- Demo y pruebas: el disco de demostración tiene que permitir simular «guardar encima».
- Ayudas: el texto de ayuda del botón «Ruta» de documento (`ayudas.js` / fichero de textos de la
  fila 462) añade una frase: «Si guardas aquí el registrado de Séneca, la app conserva el original y
  apunta el registro sola».

### Suposiciones
- Preguntadas a Francisco:
  - Qué botón se pulsa → el mismo «Ruta» pequeño de cada documento, con la copia invisible.
  - Al llegar el registrado → lo hace sola y avisa, sin preguntar (sabe que si se confunde de
    documento en Séneca, lo da por bueno; se arregla desde versiones previas).
  - Si lo que llega no trae sello → se deja lo llegado y el original pasa a previas como «ANTERIOR»
    (sabe que, si descargó el PDF equivocado, lo recupera él desde versiones previas).
  - Documentos que llegan ya registrados por la bandeja electrónica, sin documento previo → siguen
    por la vía de hoy (carpeta y «Es un documento nuevo»).
- Decididas por Claude: las marcadas arriba como «decidido por Claude»; además, solo PDF, porque
  Séneca devuelve PDF y guardar un PDF con la ruta de un Word dejaría un fichero con extensión falsa.

### Ejemplo real (solo si la persona lo dio)
- No lo dio.

### Pendiente (lo que la persona aún no tiene claro; no se programa)
- Nada.

### Cómo se comprueba (para Claude Code; un punto por cada línea de «Qué verá y hará la usuaria»)
1. Con un asunto de la demo con un PDF: pulsar «Ruta» del PDF copia la misma ruta que hoy, sale el
   mismo aviso verde y aparece `_copia-ruta/<nombre>.pdf` en el disco de demostración; la ficha no
   enseña esa subcarpeta en ningún sitio.
2. Escribir encima del PDF un PDF de prueba con sello de registro de salida y lanzar la mirada (foco):
   sale el aviso verde con el código, sin ventanas.
3. La ficha muestra el documento con su registro y «Versiones previas» tiene el original «SIN SELLAR»;
   `_copia-ruta` ya no existe.
4. La nota «Registrado …» está en las notas y la tarea con acción `registrar` del hito está marcada;
   repetir la mirada no añade otra nota.
5. Escribir encima un PDF sin sello: el documento conserva lo llegado, el original está en previas
   con « ANTERIOR», no hay nota nueva ni tarea marcada, y sale el aviso ámbar.
Además: pulsar «Ruta» y no cambiar nada no deja rastro visible; archivar un asunto con `_copia-ruta`
no la lleva al ARCHIVO; pruebas existentes de registro sin duplicar, versiones previas y copiar ruta
siguen pasando.

### Respuestas de la persona durante el trabajo
- (las apunta Claude Code si tiene que preguntarle algo)
