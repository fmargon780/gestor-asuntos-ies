# Fila 227 — «Ruta» copia la ruta normal de Windows, no `file:///`

Diseñada con Francisco el 29-sep-2026. Sustituye el formato de copia de la fila 152
(`docs/RUTA-QUE-NO-VA-A-BING.md`). No toca cómo se deduce ni se guarda la ruta (fila 161,
`docs/RUTA-SIN-PREGUNTAR.md`): eso funciona.

## El problema

En el ordenador del instituto (Windows, carpetas sincronizadas con Dropbox, que se ven como
locales), el botón «Ruta» copia algo, pero al pegarlo en el explorador de archivos no abre la
carpeta. La pregunta de la primera vez («Pega la ruta de la carpeta ASUNTOS ABIERTOS…») salió una
sola vez y se quedó guardada: esa parte va bien.

La causa: `comoFileUrl` (`js/copiar-ruta.js`) copia una dirección `file:///C:/Users/.../...` con
cada trozo pasado por `encodeURIComponent`. Espacios, comas y tildes salen como `%20`, `%2C`,
`%C3%93` (`ADMINISTRACIÓN` → `ADMINISTRACI%C3%93N`). La barra del explorador de Windows y la
ventana «Abrir archivo» (la de adjuntar en Séneca o en el correo) no descodifican bien eso,
sobre todo las tildes, y no llegan a la carpeta. Francisco no puede probarlo desde casa (en su
Chromebook no tiene el Dropbox del centro).

## Qué hay que hacer

1. **Copiar la ruta normal, tal como se escribe en el explorador.** Base apuntada + piezas,
   unidas con `unir()` (el separador de la base: `\` en Windows y en red `\\servidor\...`, `/` en
   Linux). Sin `file:///`, sin `encodeURIComponent`. Ejemplos:
   - `C:\Users\Francisco\Dropbox\ADMINISTRACIÓN\...\ASUNTOS ABIERTOS\260929 TIPO Núñez, José 1234567`
   - archivado: `...\ARCHIVO\PERSONAL\Tercero\<nombre de la carpeta>`
   - Si la base apuntada es una `file:...` antigua, se convierte primero a ruta normal con
     `sinFileUrl()` (ya existe) y después se une. Nunca se copia una `file:`.
2. **Los separadores de las piezas siguen a la base.** Si `rutas.json` guarda la parte común con
   `/`, en Windows se copia con `\`. Nada de mezclas `C:\...\Dropbox/ADMINISTRACIÓN/...`.
3. **El aviso verde enseña lo copiado**: «Ruta copiada: C:\Users\…\carpeta». Si es muy larga,
   que el aviso la parta en varias líneas (no cortarla con «…»): sirve para ver qué parte está mal.
   Mismo aviso desde la ficha y desde los cuadros de Correo y de Séneca; y también tras «Guardar y
   copiar» cuando se ha tenido que pedir la ruta.
4. **Nada más cambia**: la pregunta cuando falta la ruta, `rutas.json`, `gestor-ruta-dropbox`,
   Ajustes → El centro → «Rutas de las carpetas», la deducción en la copia sin internet.
5. Quitar `comoFileUrl` si ya no la usa nadie (hoy solo la usan `de()` y `pruebas/copiar-ruta.mjs`),
   o dejarla sin uso solo si otra parte la necesita. El `title` del botón sigue diciendo «para
   pegarla en el navegador o en el explorador de archivos» (Edge y Chrome abren `C:\...` pegado en
   la barra como carpeta, sin buscar en Bing: lo que buscaba Bing era el nombre suelto, que ya no
   se copia nunca).

## Ficheros

- `js/copiar-ruta.js` (función `de()`, el bloque de conversión y el comentario de cabecera).
- `pruebas/copiar-ruta.mjs`: cambiar las comprobaciones de `comoFileUrl` por las de la ruta
  normal. Casos mínimos: Windows con espacios, coma, `#` y tildes (`Núñez, José #1`) sale tal
  cual con `\`; red `\\servidor\recurso`; Linux con `/`; base `file:///C:/...%C3%93...` antigua →
  sale `C:\...Ó...`; parte común con `/` sobre base Windows → todo con `\`; el aviso verde lleva
  la ruta. Solo esta prueba mientras se trabaja; la pasada completa al final, como siempre.
- Al cerrar: `docs/COLA.md`, la línea del botón «Ruta» de `docs/CONTEXTO-CORTO.md` (sustituir:
  «copia la ruta normal», no `file:///`), el hijo de `docs/contexto/` donde esté el botón,
  una línea en `docs/RUTA-QUE-NO-VA-A-BING.md` diciendo que el formato lo sustituye la fila 227,
  y `docs/HISTORIA.md`.

## Qué verá Francisco

Pulsa «Ruta», el aviso verde le enseña `C:\Users\…\la carpeta del asunto`, lo pega en la barra
del explorador de archivos (o en la ventana de adjuntar de Séneca) y se abre la carpeta. Lo único
que tiene que comprobar él, en el instituto, es eso: que se abre.
