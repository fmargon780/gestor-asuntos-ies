# El título del informe en PDF se puede escribir (fila 308)

Cerrado con Francisco el 8-oct-2026. Sale de la idea 308, apuntada por él desde el Centro de
mando. Sigue a `docs/EXPORTAR-ASUNTOS.md` (fila 241), `docs/INFORME-AGRUPADO.md` (fila 278) y
`docs/INFORME-EN-PDF-QUE-PIERDE-ASUNTOS.md` (fila 307).

## Qué pidió

> En la última tarea, de arreglo del listado .pdf, he olvidado pedir que el título sea
> personalizable.

Adjuntó un recorte del informe de «Exportar ▾ → Informe en PDF»: membrete, título «Listado de
asuntos», la fecha, «Agrupado por: Unidad» y las tablas por unidad con la columna «Importe
cobrado».

## Qué pasa hoy

El informe se titula siempre «Listado de asuntos». Ese texto está escrito a mano en tres sitios de
`js/exportar-informe.js`: el título de la hoja (`cabeceraHtml`), el nombre que se ve en la barra
del visor (`abrir`) y el nombre del fichero (`nombrePdf`, «AAMMDD Listado de asuntos.pdf»).

## Qué quiere Francisco (decidido por él el 8-oct-2026)

1. En la ventana de «Exportar ▾ → Informe en PDF» hay una casilla **«Título»**.
2. Al abrir la ventana, la casilla trae escrito **«Listado de asuntos», siempre**. No recuerda el
   último título que se escribió. Él escribe encima si quiere otro.
3. El título escrito sale en la hoja, donde hoy pone «Listado de asuntos».
4. El título pasa también al **nombre del fichero PDF**: «261008 Cobros de matrícula por
   unidad.pdf».

Decidido por Claude en el diseño, y contado a Francisco:

- Con la casilla vacía (o solo con espacios), sale «Listado de asuntos», como hoy.
- Los signos que un nombre de fichero no admite se quitan **solo del nombre del fichero**. En la
  hoja el título se ve tal como se escribió.
- La hoja de cálculo no lleva título: no cambia.

## Qué hay que hacer

### 1. La casilla en la ventana

En `abrirVentana` de `js/exportar-ventana.js`, solo cuando `destino === 'pdf'`:

- Una línea «Título» con una casilla de texto (`id="exp-titulo"`, clase `campo`), justo debajo de
  la frase «Se exporta lo que se ve ahora en…» y encima de «Incluir también los archivados».
- Ocupa todo el ancho de la ventana. `maxlength="120"`.
- Trae el valor «Listado de asuntos» cada vez que se abre la ventana. **No se guarda** en
  `localStorage` ni en `_GESTOR`.
- Al entrar en la casilla (foco) se selecciona todo su texto, para escribir encima sin borrar.
- Al aceptar, se lee el valor: se le quitan los espacios de los extremos y los espacios repetidos
  de dentro se dejan en uno. Si queda vacío, vale «Listado de asuntos». Ese texto viaja a
  `exportar(...)` y de ahí a `ExportarInforme.abrir(datos)` como `datos.titulo`.

En «Exportar ▾ → Hoja de cálculo» la casilla no aparece.

### 2. El título en el informe

En `js/exportar-informe.js`, el texto «Listado de asuntos» deja de estar escrito en tres sitios.
Una sola constante (`TITULO_POR_DEFECTO`) y el título del informe abierto guardado en `actual`
(`actual.titulo`):

- `cabeceraHtml`: el `<h1 class="exportar-titulo">` lleva el título, **escapado**.
- `abrir`: el nombre de la barra del visor (`.word-visor-nombre`) es el título.
- `abrir` sin `datos.titulo` (lo llaman así las pruebas de hoy) sigue dando «Listado de asuntos».

Un título largo ocupa dos o tres renglones en la hoja. El reparto de páginas ya mide la cabecera
tal como queda pintada: comprueba que con un título de 120 caracteres ninguna página desborda y que
la cuenta de la fila 307 (`ExportarComprobar`) sigue dando el informe por completo. Si el `h1`
no parte bien una palabra muy larga, `overflow-wrap: anywhere` en `css/exportar.css`.

### 3. El nombre del fichero

`nombrePdf()` devuelve `AAMMDD <título para fichero>.pdf`, con el título del informe abierto:

- Del título se quitan `\ / : * ? " < > |` y los caracteres de control; los espacios repetidos se
  dejan en uno; se quitan los puntos y espacios del final.
- Si después de limpiar no queda nada, «Listado de asuntos».
- Si en el repositorio ya hay una función que limpia nombres de fichero (mira `js/nombres*.js` y
  `U`), úsala en vez de escribir otra.
- `nombrePdf()` sigue pudiendo llamarse sin argumentos (lo usan `hacerPdf`, el aviso «PDF guardado:
  …» y las pruebas). Sin informe abierto, «AAMMDD Listado de asuntos.pdf», como hoy.

## Lo que no cambia

- La fecha y la línea de filtros («Pestaña: …», «Agrupado por: …») debajo del título.
- Las columnas, el agrupado, los hitos, los totales, el reparto de páginas y la comprobación de la
  fila 307.
- Lo que la ventana recuerda (columnas y «Agrupar por»).
- La hoja de cálculo y su nombre de fichero.
- Cómo se hace el PDF y cómo se imprime.

## Cómo hacerlo (orientación; decide la sesión)

- Sigue `CLAUDE.md`: rama `fila-308`, revisor en local y, con su aprobación, a `main`.
- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`, el apartado de
  «Exportar ▾» de `docs/contexto/PANTALLA.md` y los ficheros de abajo.
- `js/exportar-informe.js` tiene 446 líneas y `js/exportar-ventana.js`, 305: caben sin partir.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Mientras programas, solo las pruebas de lo tocado (`npm test -- informe exportar`). La pasada
  completa, una sola vez, al final.

## Ficheros

- `js/exportar-ventana.js`: la casilla «Título» (solo en el PDF), su lectura al aceptar y el paso
  de `titulo` a `exportar` y a `ExportarInforme.abrir`.
- `js/exportar-informe.js`: `TITULO_POR_DEFECTO`, `actual.titulo`, `cabeceraHtml`, la barra del
  visor y `nombrePdf`.
- `css/exportar.css`: la línea de la casilla (rótulo y casilla a todo el ancho) y, solo si hace
  falta, el corte de palabras largas del título.
- `pruebas/informe-titulo.mjs`: nueva, con Chromium real y la demostración. Comprueba:
  1. La ventana del PDF trae la casilla con «Listado de asuntos»; la de la hoja de cálculo no la
     tiene.
  2. Sin tocar la casilla: el `h1` de la hoja, la barra del visor y `nombrePdf()` dan «Listado de
     asuntos» (el fichero, «AAMMDD Listado de asuntos.pdf»).
  3. Con «Cobros de matrícula por unidad»: sale en el `h1`, en la barra y en el nombre del fichero
     que se descarga con «Guardar PDF».
  4. Con «  Cobros 1º/2º: «ESO» <b>  »: en el `h1` se ve el texto tal cual (sin los espacios de
     los extremos, y sin que `<b>` se convierta en negrita); el nombre del fichero no lleva `/`,
     `:`, `<` ni `>`.
  5. Con la casilla vacía, y con solo espacios: «Listado de asuntos» en los tres sitios.
  6. Con un título de 120 caracteres y «Agrupar por» puesto: ninguna página desborda y
     `visibles === esperados` (la cuenta de la fila 307), dos segundos después de abrir.
  7. Cerrar y volver a abrir «Exportar ▾ → Informe en PDF»: la casilla vuelve a traer «Listado de
     asuntos».
- Siguen en verde, sin cambiar lo que comprueban: `pruebas/exportar-asuntos.mjs`,
  `pruebas/informe-agrupado.mjs`, `pruebas/informe-paginas.mjs`.
- `js/novedades.js`: «En el informe en PDF de «Exportar» puedes escribir el título. El fichero se
  guarda con ese mismo nombre.»
- Al terminar: `docs/contexto/PANTALLA.md` (apartado de «Exportar ▾»),
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (la prueba nueva) y `docs/HISTORIA.md`.
  `docs/CONTEXTO-CORTO.md`, sin añadir línea si no cambia nada de lo que dice.

## Qué dirá Claude Code a Francisco al terminar

En dos frases: que en «Exportar ▾ → Informe en PDF» ya hay una casilla «Título», que trae
«Listado de asuntos» y se puede cambiar; y que el fichero PDF se guarda con ese título.

## Cómo sabemos que está bien

En la copia de demostración, en Inicio, pestaña «Todos los abiertos».

1. «Exportar ▾» → «Informe en PDF»: en la ventana hay una casilla «Título», encima de las
   columnas, y trae escrito «Listado de asuntos».
2. Aceptar sin tocar la casilla: el informe se titula «Listado de asuntos», con la fecha debajo,
   igual que antes.
3. Cerrar. Abrir otra vez «Informe en PDF», escribir «Cobros de matrícula por unidad» en «Título»
   y aceptar: ese texto es el título de la hoja, y también el nombre que se ve en la barra de
   arriba del informe.
4. En ese informe, «Guardar PDF»: el aviso verde y el fichero descargado se llaman con la fecha de
   hoy y «Cobros de matrícula por unidad.pdf».
5. Cerrar. Abrir otra vez «Informe en PDF»: la casilla vuelve a traer «Listado de asuntos», no el
   título anterior.
6. Escribir «Altas 1º/2º: ESO» y aceptar: la hoja muestra «Altas 1º/2º: ESO» tal cual. «Guardar
   PDF»: el nombre del fichero no lleva ni la barra ni los dos puntos.
7. Borrar todo el texto de la casilla y aceptar: el informe se titula «Listado de asuntos».
8. Escribir un título muy largo (unas veinte palabras), elegir «Agrupar por»: Tipo y aceptar: el
   título ocupa más de un renglón sin salirse de la hoja, ninguna fila queda tapada por el pie, no
   hay aviso rojo en la barra y «Guardar PDF» e «Imprimir» están encendidos.
9. «Exportar ▾» → «Hoja de cálculo»: en esa ventana no hay casilla «Título».
