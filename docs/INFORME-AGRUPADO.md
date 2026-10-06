# El informe en PDF de «Exportar», agrupado por una o dos columnas (fila 278)

Cerrado con Francisco el 6-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/1nphZ_1FGEoIKEkK3Zy1EqVx5KGrBCwmI/view?usp=drivesdk).

## Qué pidió

Desde Inicio, como propuesta de mejora: «A la hora de hacer un informe en pdf con la exportación de
los registros que nos aparecen en pantalla sería muy útil poder decirle al sistema que nos agrupe
los registros por alguno/s de los campos incluidos en dicho informe.»

Hoy el informe («Exportar ▾» → «Informe en PDF», fila 241, `docs/EXPORTAR-ASUNTOS.md`) saca una
sola tabla con todos los asuntos, en el orden de la pantalla, y el total al final. La sección 7 de
aquel documento decía «no hay más informes PDF que este (ni agrupados por tipo ni por
responsable)»: **esta fila cambia eso**. Aquel documento es una instrucción cerrada y no se
reescribe.

## Qué quiere Francisco

Poder partir el informe en bloques por una columna, o por dos (una dentro de otra), eligiéndolas en
la misma ventana de exportar. Lo decidido con él:

- Hasta **dos niveles** de agrupación. Ni uno solo, ni sin límite.
- Cada bloque termina con **su número de asuntos y la suma de sus importes**. El total general del
  final sigue saliendo.
- El resto de este documento lo propuso Claude y Francisco lo aceptó entero.

## Qué hay que hacer

### 1. La ventana de exportar (solo la de «Informe en PDF»)

Debajo del bloque de columnas y encima de «Incluir los hitos», una línea con dos desplegables:

- **«Agrupar por»** y **«Y dentro, por»**.
- Los dos ofrecen «(sin agrupar)» y, debajo, **las columnas que estén marcadas en ese momento**
  (las del asunto y los campos propios), con su mismo título y en el mismo orden que en la ventana.
- «Y dentro, por» está apagado mientras «Agrupar por» esté en «(sin agrupar)», y no ofrece la
  columna ya elegida en el primero.
- Si se desmarca una columna que estaba elegida en un desplegable, ese desplegable vuelve a
  «(sin agrupar)». Si el que se vacía es el primero, el segundo también.
- Al marcar o desmarcar columnas, y al marcar «Incluir también los archivados» (que repinta las
  columnas y fuerza «Situación»), los desplegables se ponen al día **sin perder lo elegido** si
  esa columna sigue marcada.
- **Se recuerda la última elección** en ese ordenador (`localStorage`, clave nueva
  `gestor-exportar-agrupar-pdf`, junto a la de las columnas). Al abrir la ventana se recupera solo
  si esas columnas salen marcadas; si no, «(sin agrupar)».
- Con los dos en «(sin agrupar)», el informe sale **exactamente como hoy**.
- En la ventana de «Hoja de cálculo» no sale nada de esto.

### 2. Cómo se forman los bloques

Se agrupa siempre sobre la tabla ya preparada para el informe (la de `ExportarAsuntos.tabla`), es
decir, **sobre lo que se lee en cada celda, nunca sobre los datos del asunto**. Así un asunto
reservado va al bloque «Tercero: Reservado» y ninguna agrupación puede descubrir su nombre.

- **Columna de texto o de número**: un bloque por cada valor distinto, tal como se lee en la celda
  (`textoDeCelda`). Dos valores que solo cambian en mayúsculas, tildes o espacios de los extremos
  son el mismo bloque.
- **Columna de fecha** (Plazo, Inicio, Fecha de archivo, Por liquidar desde, un campo propio de
  clase Fecha): un bloque **por mes**, con el título «Octubre de 2026». Una celda de esa columna que
  no sea una fecha de verdad pero tenga texto forma bloque con ese texto.
- **Celda vacía**: todos esos asuntos van a un bloque **«Sin dato»**.
- **Orden de los bloques**: texto, alfabético en español (sin distinguir mayúsculas ni tildes, y
  «Grupo 2» antes que «Grupo 10»); números, de menor a mayor; meses, en orden de calendario;
  después los textos sueltos de una columna de fecha; **«Sin dato», siempre el último**.
- **Dentro de cada bloque**, los asuntos conservan el orden que traían (el de la pantalla y, detrás,
  los archivados).
- Con dos niveles, cada bloque del primero se parte igual por la segunda columna.

### 3. Cómo se pinta el informe agrupado

- La línea de filtros de la cabecera añade al final «Agrupado por: Lo encarga y Tipo» (o
  «Agrupado por: Tipo» con un solo nivel).
- **Título de bloque**: «Tipo: CERTIFICADO» (título de la columna, dos puntos, valor). El del
  primer nivel, en negrita y algo mayor que el texto de la tabla; el del segundo, más pequeño y
  con una pequeña sangría. En un asunto reservado el valor es «Reservado», como en la celda.
- **Cada bloque del último nivel lleva su propia tabla**, con su fila de títulos de columna.
- **Las columnas por las que se agrupa no salen en las tablas**: ya están en el título del bloque.
  Si al quitarlas no quedara ninguna columna, no se quita ninguna.
- «Apaisado o vertical» se decide con las columnas que quedan en las tablas (más de 5, apaisado),
  y es el mismo para todo el informe.
- **Al terminar cada bloque**, una línea de cierre: «CERTIFICADO: 12 asuntos · Total Importe:
  180,00 €». Lleva el valor del bloque, su número de asuntos («1 asunto» en singular) y, por cada
  columna de cantidades **que salga en las tablas**, su suma dentro del bloque, con el mismo
  formato y el mismo sufijo que el total general. Una columna es de cantidades si lo es en la tabla
  completa; no se vuelve a decidir bloque a bloque. Si en un bloque no hay ninguna cantidad en esa
  columna, «0,00».
- Con dos niveles: línea de cierre al terminar cada bloque de dentro (letra normal) y otra al
  terminar cada bloque de fuera (en negrita, con una raya fina encima), aunque solo tenga uno
  dentro.
- **El total general del final no cambia**: «N asuntos» y la suma de cada columna de cantidades de
  todas las elegidas, también si una de ellas es la que agrupa.
- **Sin saltos de página entre bloques**: van seguidos. Pero al cortar páginas (se sigue midiendo,
  como hoy, con cada asunto entero en una página):
  - un título de bloque nunca se queda solo al pie: el título (o los dos títulos, si empieza a la
    vez un bloque de fuera y uno de dentro), la fila de títulos de columna y el primer asunto van
    juntos; si no caben, pasan los tres a la página siguiente;
  - la línea de cierre va en la misma página que el último asunto de su bloque; si no cabe, pasan
    los dos;
  - si un bloque sigue en la página siguiente, arriba se repite su título con « (continúa)» y la
    fila de títulos de columna.
- «Incluir los hitos» funciona igual: los hitos van debajo de su asunto, dentro de su bloque.
- El pie de página, el membrete, «Guardar PDF», «Imprimir» y «Cerrar», como hoy.

## Qué NO se toca

- **La hoja de cálculo**: ni su ventana ni su fichero. Solo el PDF.
- El informe sin agrupar: tiene que salir idéntico al de hoy (misma estructura y mismas clases;
  `pruebas/exportar-asuntos.mjs` sigue pasando sin tocarla).
- Qué se exporta (lo que se ve, los archivados, los reservados), las columnas que se ofrecen y
  cómo se recuerdan.
- Ningún dato guardado en `_GESTOR`. **No hay nada que migrar.**

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/PANTALLA.md` (el párrafo
  «Fechas y «Exportar ▾»»), `docs/EXPORTAR-ASUNTOS.md` y los cuatro `js/exportar-*.js` basta.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- Ningún fichero de `js/` pasa de 600 líneas. `js/exportar-datos.js` ya tiene 559: **lo nuevo no
  va ahí**. La parte de cálculo va en un fichero nuevo, `js/exportar-agrupar.js`
  (`ExportarAgrupar`), sin tocar pantalla, que recibe la tabla y las columnas elegidas y devuelve
  los bloques ya ordenados, con las posiciones de sus filas, sus títulos, su número de asuntos y
  sus sumas. Se carga en `index.html` después de `js/exportar-datos.js` y antes de
  `js/exportar-informe.js`. Nada envuelve nada: `js/exportar-ventana.js` le pasa la elección a
  `ExportarInforme.abrir` en un dato más (`agruparPor`, lista de ids) y el informe llama a
  `ExportarAgrupar`.
- Los bloques guardan **posiciones de fila**, porque el informe necesita a la vez la fila de la
  tabla y el registro de ese asunto (para sus hitos y para el tono de los archivados).
- Si `js/exportar-informe.js` (292 líneas) se acerca al tope con el corte de páginas por bloques,
  esa parte se saca a un fichero propio con el estado común en `ExportarInforme._interno`.
- Los nombres de los meses, escritos enteros y con mayúscula inicial («Octubre de 2026»). En
  `js/util.js` solo están los cortos.
- Estilos nuevos en `css/exportar.css`, con el prefijo `exportar-`.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Rama `fila-278`, revisor en local y, con su APROBADA, a `main`. Nada se queda en una petición de
  cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs informe-agrupado
  exportar-asuntos campos-importe`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- `js/exportar-agrupar.js` (nuevo): el cálculo de los bloques (punto 2) y los textos de título y
  de línea de cierre.
- `js/exportar-ventana.js`: los dos desplegables, su puesta al día al cambiar las columnas, el
  recuerdo de la elección y el dato nuevo que se pasa al informe. Pon al día su comentario de
  cabecera.
- `js/exportar-informe.js`: el informe por bloques (punto 3) y «Agrupado por: …» en la línea de
  filtros. Pon al día su comentario de cabecera.
- `css/exportar.css`: títulos de bloque, líneas de cierre y la línea de los dos desplegables.
- `index.html`: la etiqueta `<script>` del fichero nuevo.
- `pruebas/informe-agrupado.mjs` (nueva): la parte de cálculo sin navegador (orden de los bloques,
  meses, «Sin dato», mayúsculas y tildes, dos niveles, sumas por bloque, reservado) y, con
  navegador, los puntos de «Cómo sabemos que está bien».
- `js/novedades.js`: «El informe en PDF de «Exportar» se puede agrupar por una o dos columnas: cada
  bloque lleva su título, su número de asuntos y la suma de sus importes.»
- Al terminar: `docs/contexto/PANTALLA.md` (el párrafo «Fechas y «Exportar ▾»»),
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md` y, en `docs/CONTEXTO-CORTO.md`,
  como mucho media línea en la de «Inicio».

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en la ventana de «Informe en PDF» hay dos desplegables, «Agrupar por» e «Y
dentro, por», con las columnas marcadas; que el informe sale partido en bloques con su título, su
número de asuntos y la suma de sus importes; que las fechas agrupan por meses y los asuntos sin
dato van al final; y que la hoja de cálculo no cambia.

Y la respuesta para quien mandó el aviso, en una línea: «Ya se puede: en «Exportar ▾» → «Informe
en PDF», debajo de las columnas, elige «Agrupar por» (y, si quieres, «Y dentro, por»).»

## Cómo sabemos que está bien

Preparación, en la copia de demostración: abrir Inicio y pulsar la pestaña «Todos los abiertos»,
sin filtros.

1. Pulsar «Exportar ▾» → «Hoja de cálculo»: en la ventana no sale ningún desplegable «Agrupar
   por». Cancelar.
2. Pulsar «Exportar ▾» → «Informe en PDF»: debajo de las columnas salen «Agrupar por» e «Y dentro,
   por», los dos en «(sin agrupar)»; el segundo está apagado. «Agrupar por» ofrece exactamente las
   columnas marcadas.
3. Sin tocar los desplegables, pulsar «Exportar»: el informe sale con una sola tabla y el total al
   final, sin títulos de bloque. Cerrar.
4. Otra vez «Informe en PDF», elegir «Agrupar por: Tipo» y «Exportar»: la línea de filtros termina
   en «Agrupado por: Tipo»; el informe sale en bloques con título «Tipo: …», en orden alfabético;
   las tablas no llevan la columna «Tipo»; cada bloque termina con una línea con su valor y «N
   asuntos», y N coincide con las filas de ese bloque.
5. En ese mismo informe, la suma de los asuntos de todos los bloques coincide con «N asuntos» del
   total del final, que sigue saliendo.
6. Otra vez «Informe en PDF»: los desplegables recuerdan «Tipo». Desmarcar la columna «Tipo»:
   «Agrupar por» vuelve a «(sin agrupar)» y «Tipo» ya no está entre sus opciones.
7. Marcar además la columna «Lo encarga» (y «Tipo» otra vez), elegir «Agrupar por: Lo encarga» e
   «Y dentro, por: Tipo»: «Y dentro, por» no ofrece «Lo encarga». «Exportar»: salen títulos «Lo
   encarga: …» y, dentro de cada uno, títulos «Tipo: …» más pequeños; las tablas no llevan ninguna
   de las dos columnas; hay una línea de cierre por cada bloque de dentro y otra, en negrita, por
   cada bloque de fuera.
8. Agrupar por «Plazo»: los bloques se titulan con el mes y el año («Plazo: Octubre de 2026»), en
   orden de calendario, y el último bloque es «Plazo: Sin dato», con los asuntos sin plazo.
9. Marcar la columna «Importe» (campo propio del seguro escolar) y agrupar por «Tipo»: la línea de
   cierre del bloque del seguro escolar dice «Total Importe: …» y la cifra es la suma de los
   importes de sus filas, con coma decimal y « €»; el total general del final es el mismo que sin
   agrupar.
10. Marcar un asunto como reservado, y exportar a PDF con la columna «Tercero» agrupando por
    «Tercero»: ese asunto sale en el bloque «Tercero: Reservado» y su nombre no aparece en ningún
    sitio del informe.
11. Marcar «Incluir los hitos» y agrupar por «Tipo»: debajo de cada asunto salen sus hitos en letra
    pequeña, dentro de su bloque.
12. Con un informe agrupado de más de una página (marcar «Incluir los hitos» si hace falta para
    alargarlo): ninguna página termina con un título de bloque suelto; un bloque que sigue en otra
    página repite arriba su título con «(continúa)»; ninguna línea de cierre queda separada del
    último asunto de su bloque.
13. Marcar «Incluir también los archivados» con un desplegable ya elegido: lo elegido no se
    pierde, y «Situación» aparece entre las opciones de «Agrupar por».
14. Pulsar «Guardar PDF» en un informe agrupado: se descarga el fichero y sale el aviso verde.
