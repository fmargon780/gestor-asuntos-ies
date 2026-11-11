# 612 — Aceptar la carpeta de Google Drive aunque no se llame «Mi unidad»

## Lo que escribió Francisco
El jueves y viernes estaré solo en la oficina y he pensado que será un buen momento para terminar de
hacer el traslado de las carpetas de dropbox a las de Drive de la nueva cuenta de administración.
Realmente no recuerdo por dónde nos quedamos.

## Lo que entendió Claude (acordado con Francisco el 11-nov-2026)
- El traslado sigue adelante: todo pasa a Google Drive, como dice `docs/PASAR-A-DRIVE.md`.
- En los dos ordenadores del instituto, Drive para ordenadores va en «Replicar archivos» con la carpeta
  elegida en `C:\Google Drive` («Seleccionar carpeta»). Drive usa esa carpeta como «Mi unidad»
  directamente: no hay ninguna carpeta «Mi unidad» dentro. En el ordenador «Propietario» ya está así.
- Hoy «Pasar a Drive» rechaza esa carpeta porque no se llama «Mi unidad» ni «My Drive». Desde esta fila
  acepta como carpeta de Google Drive:
  - una que se llame «Mi unidad» o «My Drive», también con algo detrás entre paréntesis
    (por ejemplo «Mi unidad (29700692.administracion@g.educaand.es)»);
  - una que se llame «Google Drive»;
  - cualquier otra que tenga dentro las carpetas ocultas que pone Drive para ordenadores
    (`.tmp.drivedownload` o `.tmp.driveupload`).
- Si no es ninguna de esas, sigue sin aceptarla, con este texto: «Esa carpeta se llama «X». Tiene que
  ser la carpeta de Google Drive de la cuenta común (en el instituto, `C:\Google Drive`).»
- En Ajustes → Mantenimiento → «Pasar las carpetas a Google Drive», antes de señalar:
  - el texto pasa a ser: «Señala la carpeta de Google Drive de la cuenta común (en el instituto,
    `C:\Google Drive`). Dentro se crearán «asuntos vivos», «ARCHIVO» y la carpeta de la copia sin
    internet.»;
  - el botón «Señalar «Mi unidad»» pasa a llamarse «Señalar la carpeta de Google Drive».
- El botón «Ruta» reconoce como de Google Drive las rutas que pasan por esas mismas carpetas
  (por ejemplo `C:\Google Drive\asuntos vivos\…`).
- Nada más cambia en la app.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Avisar del espacio que queda en la cuenta común: la app no puede leerlo desde el navegador; se mira a
  mano en https://drive.google.com/settings/storage.
- Dejar el ARCHIVO en Dropbox o comprimirlo: descartado por Francisco el 11-nov-2026.

## Notas técnicas de Claude
- `js/pasar-a-drive.js`: `NOMBRES_DRIVE` y `elegirDrive()` (hacia la línea 139). La comprobación de las
  carpetas ocultas: recorrer `h.values()` del primer nivel buscando `.tmp.drivedownload` o
  `.tmp.driveupload` (no se sabe si el navegador las lista siempre; si no, vale el nombre).
- `js/pasar-a-drive-ajustes.js`: `pasoSenalar()` (hacia la línea 97), texto y botón.
- `js/copiar-ruta.js`: `esTrozoDrive` (línea 106) acepta `Mi unidad`, `My Drive` (con o sin
  « (…)» detrás) y `Google Drive`. Revisar que ningún otro sitio que use `nubeDeRuta` cambie de
  comportamiento con Dropbox.
- `js/nombres-topes.js`: con la ruta real conocida ya manda su largo; el valor por defecto de 40 sirve.
- Pruebas: `pruebas/pasar-a-drive.mjs` y `pruebas/nube-drive.mjs` con carpetas «Google Drive»,
  «Mi unidad (correo)» y una con `.tmp.drivedownload`, y una que se rechaza. El disco de mentira de la
  demostración (`js/demo/disco.js`) puede seguir llamándose «Mi unidad».
- Lo visto en el ordenador real está en `docs/612-LO-VISTO-EN-EL-INSTITUTO.md` (incluye que Drive deja las copias en
  conflicto como `registro (1).json`, lo que suponía la fila 457).
- Novedades: una línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En Ajustes → Mantenimiento, «Pasar a Drive»: el botón dice «Señalar la carpeta de Google Drive».
- El día del traslado, al señalar `C:\Google Drive`, la acepta y enseña cuántos documentos va a copiar.

## Revisión y respuestas durante el trabajo
- Tarea pequeña, sin segundo revisor; comprobado por Claude contra la instrucción (11-nov-2026): coincide todo (nombres aceptados, rechazo con el texto nuevo, texto y botón de Ajustes, «Ruta» con `C:\Google Drive`). Pruebas `pasar-a-drive` y `nube-drive` en verde. No visto: el navegador real con `C:\Google Drive` (solo el día del traslado).
