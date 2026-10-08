# El informe en PDF pierde asuntos al pasar de página (fila 307)

Cerrado con Francisco el 8-oct-2026. Sale del aviso 307, enviado por su compañero desde el botón
de soporte («algo no funciona», pantalla Inicio). Sigue a `docs/EXPORTAR-ASUNTOS.md` (fila 241) y a
`docs/INFORME-AGRUPADO.md` (fila 278).

## Qué pidió

> Los listados exportados en pdf no hacen bien el paso de página y cortan la lista de nombres.

Sin captura. El único listado en PDF de Inicio es «Exportar ▾ → Informe en PDF»
(`js/exportar-informe.js`).

## Qué pasa hoy (reproducido el 8-oct-2026 con la copia de demostración)

Arrancando el repositorio en local, `?demo=1&auto=1`, «Exportar ▾ → Informe en PDF», con «Incluir
también los archivados» (40 asuntos, 7 columnas, apaisado; alto útil de la página 706 px):

| Opciones | Qué sale |
|---|---|
| Sin agrupar, sin hitos | Completo. Por casualidad: ver causa 1 |
| «Incluir los hitos» | La página 1 mide 808 px: lo que pasa de 706 no se ve |
| Agrupar por «Tipo» | La página 1 mide 1121 px y la 2, 740. En la 1 se ven 10 asuntos de 16 |
| Agrupar por «Le toca a» | La página 1 mide 905 px |
| Agrupar por «Tipo» + hitos | Páginas 1 (921) y 3 (1002) |

`section.exportar-pagina` lleva `overflow: hidden`: lo que sobra por abajo no se ve ni en pantalla
ni en «Guardar PDF» ni en «Imprimir». El pie sigue diciendo «40 asuntos». Nada avisa.

Hay **tres fallos distintos**. Compruébalos antes de arreglar; no los des por buenos sin mirar.

1. **El membrete se mide antes de cargarse.** `abrir` crea la imagen del membrete con una
   dirección `blob:` y llama a `montar` en el acto. En ese momento la imagen mide 0
   (`complete: false`, `naturalHeight: 0`); después mide 168 px. Medido: la primera página daba
   476 px al repartir y 644 al terminar de cargar; con hitos, 640 → 808. Toda primera página lleva
   168 px de más. Afecta también al listado sin agrupar: en la demostración cabe de milagro.
2. **El informe agrupado deja pasar bloques enteros.** Sin membrete (`Membrete.montar` devolviendo
   `null`) sigue fallando: agrupar por «Tipo» da 769 px en la página 3, y por «Le toca a», 758 en
   la 1. Sospecha, sin confirmar: `nodos` no se vacía al empezar cada bloque, así que `hayPrevio()`
   da `false` en el segundo bloque de una página y la rama `desborda() && previo` no entra nunca.
3. **«Imprimir» saca una hoja de más.** Con 17 páginas salen 18 hojas: la primera página empieza
   unos 30 px más abajo (se ve una franja gris arriba) y su pie cae solo en la hoja 2. Visto en la
   demostración, que lleva una franja fija arriba; mira si pasa también sin ella y con la franja de
   «versión nueva» de la copia sin internet.

Las pruebas de hoy (`pruebas/exportar-asuntos.mjs`, `pruebas/informe-agrupado.mjs`) están en verde
con los tres fallos: ninguna mira si el contenido cabe en la página.

## Qué quiere Francisco (decidido por él el 8-oct-2026)

1. **Ninguna página pierde filas.** Lo que no cabe pasa entero a la página siguiente: sin agrupar,
   agrupado por una o dos columnas, y con hitos.
2. **Un asunto que no cabe en una página se reparte en dos.** Un asunto con tantos hitos que no
   cabe ni en una página vacía se parte, en vez de cortarse.
3. **La app cuenta antes de guardar o imprimir.** Si en las páginas falta algún asunto, lo dice y
   no guarda ni imprime un listado incompleto.
4. **«Imprimir» saca tantas hojas como páginas tiene el informe.**

No cambia nada más del informe: mismas columnas, mismo aspecto, mismo orden.

## Qué hay que hacer

### 1. Medir con todo cargado

Antes de `montar`, la imagen del membrete tiene que estar cargada y con su alto (esperar a su
`decode()` o a su `load`, con un tope de unos segundos; si falla, encabezado de texto, como hoy
cuando no hay membrete). Espera también a `document.fonts.ready`. El reparto no puede depender de
nada que cambie de alto después.

### 2. El reparto agrupado

Arreglar el reparto para que, al terminar `montar`, **ninguna** página tenga
`.exportar-contenido` más alto que el alto útil. Se mantiene lo que ya hace bien la fila 278: el
título de un bloque no se queda solo al pie de una página (va con su fila de títulos de columna y
su primer asunto), «(continúa)» al seguir un bloque en otra página, y la línea de cierre va con su
último asunto.

### 3. Un asunto más alto que una página

Solo puede pasar con «Incluir los hitos». Cuando un asunto no cabe ni en una página recién hecha:

- En la primera página va su fila y las líneas de hitos que quepan.
- En la siguiente, la misma fila del asunto con «(continúa)» detrás del primer dato de texto, y el
  resto de sus hitos. Y así las páginas que hagan falta.
- La fila repetida **no cuenta** como otro asunto: ni en el número de asuntos ni en las sumas ni
  en la comprobación del punto 4. Márcala (por ejemplo `exportar-fila-continua` en vez de
  `exportar-fila`).

### 4. La cuenta antes de guardar o imprimir

Una función pura de comprobación (`ExportarInforme.comprobar()` o un módulo nuevo si
`js/exportar-informe.js` se acerca a las 600 líneas), que mira las páginas ya montadas y devuelve
`{ esperados, visibles, paginasQueDesbordan }`:

- `esperados`: `datos.registros.length`.
- `visibles`: filas de asunto (`tr.exportar-fila`, sin las de «(continúa)») cuyo borde de abajo
  queda dentro del alto útil de su página.
- `paginasQueDesbordan`: páginas cuyo contenido mide más que el alto útil.

Se llama al terminar `montar` (después de un `requestAnimationFrame`, con todo pintado) y otra vez
justo antes de «Guardar PDF» y de «Imprimir». Si `visibles !== esperados` o desborda alguna página:

- Aviso rojo fijo en la barra del visor, junto al nombre: «Este listado no está completo: se ven
  N de M asuntos. No lo guardes ni lo imprimas; avisa con el botón «Soporte».» (palabras de
  `docs/VOCABULARIO.md`).
- «Guardar PDF» e «Imprimir» quedan apagados, con ese mismo texto de ayuda.
- No se intenta arreglar solo: es una red para un fallo que no debería volver a pasar.

Con el informe bien hecho, nada de esto se ve.

### 5. «Imprimir»

Al imprimir, cada `section.exportar-pagina` empieza arriba del todo de su hoja y sale una hoja por
página, ni una más (tampoco una en blanco al final). Busca qué empuja la primera página hacia
abajo (relleno o margen de la capa, la franja fija, `top` de `.exportar-visor`) y quítalo solo en
`@media print`, en `css/exportar.css`. Mira si el visor del Word (`css/word-visor.css`, mismo
estilo) tiene el mismo fallo: si lo tiene y el arreglo es la misma línea, arréglalo; si no, déjalo
apuntado en una línea en la nota de la fila, sin tocarlo.

## Lo que no cambia

- Las columnas, el orden, los títulos de bloque, las líneas de cierre y los totales.
- La ventana de «Exportar» y lo que recuerda.
- La hoja de cálculo.
- Cómo se hace el PDF (una imagen por página, 200 ppp).

## Cómo hacerlo (orientación; decide la sesión)

- Sigue `CLAUDE.md`: rama `fila-307`, revisor en local y, con su aprobación, a `main`.
- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`,
  `docs/contexto/PANTALLA.md` (el apartado de «Exportar ▾»), `docs/INFORME-AGRUPADO.md` y los
  ficheros de abajo.
- `js/exportar-informe.js` tiene 408 líneas. Si con el reparto de un asunto alto y la comprobación
  se acerca a 600, saca la comprobación a `js/exportar-informe-comprobar.js`.
- Primero escribe la prueba nueva y mírala fallar con el código de hoy; después arregla.
- Mientras programas, solo las pruebas de lo tocado (`npm test -- informe exportar`). La pasada
  completa, una sola vez, al final.

## Ficheros

- `js/exportar-informe.js`: esperar al membrete y a las fuentes; el reparto agrupado; el asunto
  más alto que una página; la llamada a la comprobación y el aviso con los botones apagados.
- `js/exportar-informe-comprobar.js`: nuevo, solo si hace falta por las 600 líneas (y entonces,
  `index.html` y `scripts/` de la copia sin internet si llevan lista de módulos).
- `css/exportar.css`: `@media print`, el aviso rojo de la barra y la fila «(continúa)».
- `css/word-visor.css`: solo si tiene el mismo fallo al imprimir y es la misma línea.
- `pruebas/informe-paginas.mjs`: nueva. Con Chromium real y la demostración, y con el membrete
  puesto (no lo quites para la prueba). Para cada caso —sin agrupar, con hitos, agrupado por
  «Tipo», agrupado por «Tipo» y dentro por «Le toca a», agrupado con hitos, y uno vertical (cinco
  columnas o menos)— comprueba, **dos segundos después de abrir**: ninguna página desborda;
  `visibles === esperados`; el número de páginas del PDF de «Guardar PDF» es el de «Página X de N».
  Además: con muchos asuntos (multiplica los registros de la demostración hasta unos 300, antes de
  calcular los bloques) sigue cumpliéndose; un asunto fabricado con 80 hitos se reparte en varias
  páginas con «(continúa)», cuenta como uno y no desborda; `page.pdf()` con `emulateMedia({ media:
  'print' })` y `preferCSSPageSize` da tantas hojas como páginas; y, forzando un informe roto (por
  ejemplo, haciendo crecer una fila después de montar), sale el aviso rojo y los dos botones quedan
  apagados.
- Siguen en verde, sin cambiar lo que comprueban: `pruebas/exportar-asuntos.mjs`,
  `pruebas/informe-agrupado.mjs`.
- `js/novedades.js`: «El informe en PDF de «Exportar» ya no pierde asuntos al pasar de página, y
  «Imprimir» no saca una hoja de más.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (sin añadir línea si no cambia nada de lo que dice),
  `docs/contexto/PANTALLA.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`
  (las tres causas, con sus medidas).

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que el informe en PDF ya no pierde asuntos al pasar de página, ni agrupado ni con
hitos; que «Imprimir» saca una hoja por página; y que, si alguna vez un listado saliera
incompleto, la app lo dice y no deja guardarlo.

## Cómo sabemos que está bien

En la copia de demostración, en Inicio, pestaña «Todos los abiertos». En todos los puntos, esperar
dos segundos después de que se abra el informe antes de mirar.

1. «Exportar ▾» → «Informe en PDF», marcar «Incluir también los archivados», «Agrupar por»: Tipo,
   y aceptar. En cada página, la última línea de texto queda entera por encima del pie («Generado
   por…»): ningún título ni fila aparece partido ni tapado por el pie.
2. En ese mismo informe, contar las filas de asuntos de todas las páginas: suman el número que dice
   la última página («N asuntos»), y es el mismo que la suma de las líneas de cierre de cada tipo.
3. Cerrar y repetir con «Agrupar por»: Tipo, «Y dentro, por»: Le toca a, y además «Incluir los
   hitos»: se cumplen los puntos 1 y 2.
4. Cerrar y repetir sin agrupar y con «Incluir los hitos»: se cumplen los puntos 1 y 2. En la
   primera página, debajo del membrete, la tabla termina antes del pie.
5. Cerrar y repetir sin agrupar, sin hitos y dejando marcadas solo cinco columnas (sale en
   vertical): se cumplen los puntos 1 y 2.
6. En cualquiera de los informes anteriores, «Guardar PDF»: el PDF descargado tiene tantas páginas
   como dice el pie («Página 1 de N»).
7. En el informe del punto 1, imprimir a PDF (emulando la impresión): salen tantas hojas como
   páginas, ninguna en blanco, y el pie de cada página está en su misma hoja.
8. En ningún informe de los puntos 1 a 5 hay un aviso rojo en la barra de arriba, y «Guardar PDF» e
   «Imprimir» están encendidos.
9. El informe sin agrupar y sin hitos se ve igual que antes: mismo membrete, mismo título, mismas
   columnas y los mismos totales al final.
