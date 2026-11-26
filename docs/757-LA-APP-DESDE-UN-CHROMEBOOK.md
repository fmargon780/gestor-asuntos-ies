# 757 — La app desde un Chromebook

**Título llano:** «Ruta» y «Abrir en Drive» en el Chromebook
**Para qué:** que desde un Chromebook se pueda encontrar la carpeta o el documento de un asunto (para adjuntarlo en Séneca o en el correo, o para verlo en Drive) y que al entrar no salga un aviso rojo de la ruta que no se puede arreglar.

## Lo que escribió Francisco

Idea de la fila 756 (26-nov-2026): «el botón «Ruta» no sirve en un Chromebook. Hoy la app pide la ruta de la nube escrita como en Windows (por ejemplo `G:\Mi unidad`) y la copia así, y la ventana «Abrir archivo» del Chromebook no la entiende. Estudiar qué haría falta para abrir o enseñar la carpeta de un asunto desde un Chromebook con Drive, y mientras tanto no enseñar el aviso rojo «Ruta de la nube en este ordenador» en Comprobación al entrar.»

## Lo que entendió Claude (acordado con Francisco el 26-nov-2026)

- Francisco ha comprobado en su Chromebook que la lupa de la ventana «Abrir archivo» (al adjuntar en Séneca o en Gmail) encuentra una carpeta de Drive escribiendo su número de asunto.
- **Solo cuando la app se usa en un Chromebook** cambia esto:
  - Todos los botones «Ruta» (el del asunto en la ficha, en el hito y en el registro de grupo; el de los cuadros de Correo y de Séneca; y el pequeño de cada documento) copian **solo el nombre**: el de la carpeta del asunto o el del documento, sin nada delante. No piden ninguna ruta.
  - El aviso verde tras copiar dice: «Copiado: <nombre>. Pégalo en la lupa de la ventana «Abrir archivo».»
  - En la ficha del asunto, junto a «Ruta», sale un botón nuevo, **«Abrir en Drive»**. Abre en otra pestaña la búsqueda de la carpeta del asunto en Google Drive, con la cuenta común de Administración. Desde ahí se entra con un clic.
  - En «Comprobación al entrar» no sale la línea «Ruta de la nube en este ordenador» (ni en rojo ni en verde).
- En los ordenadores que no son Chromebook (Windows y los demás) no cambia nada: «Ruta» copia la ruta completa como hoy, no hay «Abrir en Drive» y la comprobación sigue igual.
- Lo que «Ruta» de un documento hace además de copiar (guardar la copia del original antes de registrarlo en Séneca) se sigue haciendo igual en el Chromebook.

## Pantalla de prueba

- Sin pantalla: es un cambio de texto en un botón que ya existe y un botón nuevo junto a él.

## Qué NO se hace en esta tarea

- Abrir la carpeta en el explorador de archivos del ordenador (descartado: el navegador no lo deja).
- Abrir directamente la carpeta en Drive sin pasar por la búsqueda (haría falta saber su identificador en Drive, que la app no tiene).

## Notas técnicas de Claude

- Saber si es un Chromebook: `/\bCrOS\b/.test(navigator.userAgent)` (ya se usa así en `js/medidas-enviar.js`). Ponerlo en un solo sitio, por ejemplo `RutaCarpetas.esChromebook()`, con un punto para las pruebas (`window.__ES_CHROMEBOOK__` = true/false manda sobre el navegador).
- `js/copiar-ruta.js`: en `de(a, modo, doc)` (o donde se compone el texto), si es Chromebook devolver `{ texto: <nombre>, completa: true }` con el nombre de la carpeta del asunto (abierto o archivado, el que tiene ahora en disco) o el del documento; nunca llamar a `pedirRutaConPreguntar` ni `pedirRutaEnLinea`. El texto del aviso verde, el de arriba. `copiaDelDocumento` se sigue llamando igual.
- «Abrir en Drive»: `https://drive.google.com/drive/search?q=<nombre de la carpeta, con encodeURIComponent>&authuser=<cuenta común>`; la cuenta, la de Administración que ya tiene la app (`Plantillas`, la configurada; si no hay, `POR_DEFECTO_CUENTA_ADMIN`). `window.open(url, '_blank', 'noopener')`. Va en `js/ficha-asunto.js`, al lado del `RutaCarpetas.boton` (fila 637), solo si es Chromebook. Con la clase `boton-copiar-fila` (encendido en solo consulta: no cambia nada). Fichero nuevo si `js/copiar-ruta.js` pasa de 400 líneas (ya tiene 570: lo nuevo va en un fichero aparte, por ejemplo `js/ruta-chromebook.js`, apuntado en su `js/cargar-piezas-N.js`).
- `js/comprobacion-entrada.js`, `ruta()`: si es Chromebook, `return null` (la lista ya quita los `null`).
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

Con `?demo=1&auto=1` y `window.__ES_CHROMEBOOK__ = true` (o el agente de usuario de un Chromebook):
- En la ficha de un asunto abierto, «Ruta» copia solo el nombre de su carpeta y el aviso verde dice «Copiado: <nombre>. Pégalo en la lupa de la ventana «Abrir archivo».»; no pide ninguna ruta.
- Lo mismo con un asunto archivado (el nombre de su carpeta en el ARCHIVO).
- El «Ruta» pequeño de un documento copia solo el nombre del documento.
- El «Ruta» del cuadro de Correo y del de Séneca copian solo el nombre de la carpeta.
- En la ficha sale «Abrir en Drive» junto a «Ruta»; al pulsarlo se abre otra pestaña con `drive.google.com/drive/search?q=<nombre de la carpeta>` y `authuser` de la cuenta común.
- En «Comprobación al entrar» no aparece «Ruta de la nube en este ordenador».

Con `window.__ES_CHROMEBOOK__ = false`:
- «Ruta» se comporta como antes (pide la ruta si falta y copia la ruta completa), no hay «Abrir en Drive» y la línea de la comprobación sale como antes.

## Qué mirar al terminar

- (Claude) Lo de la lista del revisor, en la dirección publicada, desde un Chrome que no es Chromebook: todo sigue como antes.
- (Francisco, solo en su Chromebook) Pulsar «Ruta» en un asunto, abrir «Adjuntar» en Séneca o en Gmail, pegar en la lupa y ver que sale la carpeta.
- (Francisco, solo en su Chromebook) Pulsar «Abrir en Drive» y ver que Drive enseña la carpeta del asunto.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
