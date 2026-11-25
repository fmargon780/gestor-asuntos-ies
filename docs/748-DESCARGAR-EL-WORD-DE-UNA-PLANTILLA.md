# 748 — Descargar el Word de una plantilla

**Título llano:** Descargar el Word de una plantilla
**Para qué:** poder cambiar en Word el formato de los documentos del centro, algo que la app no deja hacer, y devolver el fichero a la app.

## Lo que escribió Francisco
¿Se puede exportar una plantilla de la app a word?

(25-nov-2026, al hablarlo) «Lo que busco con esto es poder hacer cambios de formato en los documentos que no puedo hacer en la app.»

## Lo que entendió Claude (acordado con Francisco el 25-nov-2026)
- En Herramientas → Plantillas, pestaña **Word**, el menú «⋮» de cada plantilla lleva una opción nueva, **«Descargar el Word»**, la primera del menú (encima de «Sustituir el fichero…»).
- Al pulsarla, el navegador descarga el fichero de la plantilla tal cual, con su nombre (el de la columna «Fichero») y con sus huecos escritos como están, por ejemplo `{{NOMBRE}}`.
- Sale un aviso verde: «Descargado «<fichero>». Cámbialo en Word sin tocar lo que va entre llaves y, para devolverlo, usa «Sustituir el fichero…».»
- Para devolver el fichero ya cambiado no hay nada nuevo: se usa «Sustituir el fichero…», que ya existe. El fichero de antes se queda donde estaba y se puede «Deshacer».
- Si el fichero no está en la carpeta de plantillas, el aviso es el mismo de «Ver»: «No encuentro «<fichero>» en la carpeta de plantillas.» y la fila queda marcada «Falta el fichero».
- Funciona también con «solo consultar» (no escribe nada), igual que «Ver».
- Las plantillas de **correo** no llevan este botón.
- No desaparece nada de la pantalla.

## Pantalla de prueba
Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Descargar las plantillas de correo a Word: el correo que manda la app es solo texto (el script de envío no usa HTML) y el formato no sobreviviría. Un correo con formato es la idea 749.
- Un botón para descargar desde otras pantallas (la tarjeta de un tipo, la ficha del asunto).
- Comprobar al devolver el fichero que sus huecos siguen igual: «Sustituir el fichero…» queda como está.

## Notas técnicas de Claude
- Módulo nuevo `js/plantillas-descargar.js` (por debajo de 400 líneas), apuntado en `js/cargar-piezas-2.js` junto a `plantillas-fichero.js`. Lo llama `PlantillasPantalla.hacer` con la acción `descargar`.
- Leer el fichero como hace «Ver»: `PlantillasDocumento._interno.carpetaDePlantillas()` → `getFileHandle(p.fichero)` → `getFile()`; crear un enlace con `URL.createObjectURL` y `download = p.fichero`; liberar la dirección después.
- El botón va en `acciones(p)` de `js/plantillas-pantalla.js`, dentro de `.pt-menu`, solo en la pestaña `word`, con `data-solo-lectura` (vale en solo consulta, como «Ver»).
- Fallo: `U.aviso(..., 'malo')` con `U.mensajeDeError`; si no encuentra el fichero, `E.falta[p.id] = true` y repintar, como en `ver`.
- Texto del aviso verde con `U.aviso`. Palabras de `docs/VOCABULARIO.md`; no inventar ninguna.
- Línea en `js/novedades.js`: «Plantillas de Word: ya puedes descargar el Word de una plantilla (⋮ › Descargar el Word) para cambiarle el formato y devolverlo con «Sustituir el fichero…».»

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.
- La sesión comprueba con una prueba nueva (`pruebas/plantillas-descargar.mjs`, con la copia de pruebas): el menú «⋮» de una plantilla de Word lleva «Descargar el Word» la primera; al pulsarla se descarga un fichero con el nombre de la columna «Fichero» y el mismo contenido; en la pestaña Correo la opción no sale; con el fichero ausente sale el aviso y «Falta el fichero»; en solo consulta el botón sigue activo.

## Qué mirar al terminar
- En producción, Herramientas → Plantillas → Word → «⋮» de una plantilla → «Descargar el Word»: baja el fichero y abre en Word con sus huecos a la vista.
- Cambiarle el formato en Word y devolverlo con «Sustituir el fichero…»; generar un documento con esa plantilla y ver el formato nuevo `[solo en: la app real]`.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude)
