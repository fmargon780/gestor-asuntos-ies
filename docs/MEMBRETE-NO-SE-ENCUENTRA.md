# El membrete se guarda pero nunca se encuentra (fila 127, URGENTE)

24-sep-2026. Francisco sube la imagen del membrete en Ajustes → El centro → Membrete, sale
«Membrete guardado.», pero al volver a Ajustes dice «Todavía no se ha subido ninguna imagen» y
todo documento generado sale con el texto `{{MEMBRETE}}` literal en lugar de la imagen.

## La causa (comprobada leyendo el código)

`js/membrete.js` pregunta si existe `membrete.png` con `Carpetas.existe(carpeta, 'membrete.png')`.
`Carpetas.existe` (`js/carpetas.js`) usa `getDirectoryHandle`: comprueba si hay una **carpeta**
con ese nombre, no un fichero. Siempre da `false`. Hay que usar `Carpetas.existeFichero`
(`getFileHandle`, ya exportada).

Tres sitios, todos en `js/membrete.js`:

- `montar()` (hacia la línea 116): por eso el documento sale sin membrete.
- `hayImagen()` (hacia la línea 142).
- `imagenGuardada()` (hacia la línea 154): por eso Ajustes dice que no hay imagen.

La escritura (`guardarImagen` → `Carpetas.escribirBytes`) está bien: la imagen ya está en
`_GESTOR/PLANTILLAS/membrete.png`. Francisco **no** tiene que volver a subirla.

## Qué hacer

1. Cambiar esas tres llamadas a `Carpetas.existeFichero`.
2. Buscar en todo `js/` cualquier otra llamada a `Carpetas.existe(` con un nombre de **fichero**
   (con extensión) y corregirla igual. Las de carpetas de asuntos están bien.
3. Prueba nueva en `pruebas/membrete.mjs` (o fichero aparte): con una carpeta simulada que tenga
   el fichero `membrete.png`, `hayImagen()` e `imagenGuardada()` lo encuentran; sin él, no. Ya se
   comprobó a mano que `Docx.ponerImagen` mete bien la imagen en las plantillas del centro y en
   `certificado-funciones-y-horario.docx`, así que el fallo es solo este.
4. Publicar y comprobar con `curl` que `js/membrete.js` publicado ya usa `existeFichero`.

## Ojo con Vercel

Esta fila es urgente. Si el cupo diario de Vercel sigue agotado (nota del 24-sep-2026 en
`docs/COLA.md`), dejarlo subido a `main` y anotar en la cola que falta la publicación, sin
reintentar en bucle.
