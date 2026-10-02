# Solo consultar en este ordenador (fila 260)

Aviso de usuario del 2-oct-2026 (lo envía Francisco), diseñado con él ese mismo día.
Aviso completo: https://drive.google.com/file/d/1ZGg_naix3qbZwLjUg_RGJThsf849f5xC/view?usp=drivesdk

## El problema

En casa Francisco trabaja con un Chromebook. Ahí **no tiene el Dropbox del centro**: tiene una
**copia** de las dos carpetas en su Google Drive. La sube su ordenador del centro con «Drive para
ordenadores» (en Drive sale en «Ordenadores»). En casa señala esas carpetas de Drive, y la
aplicación trabaja sobre la copia sin saber que lo es.

Lo que se cambia en casa solo llega al Dropbox del centro si el ordenador de Francisco en el centro
está encendido. Y entonces llega a trozos, por dos programas de sincronización a la vez (Drive y
Dropbox), mientras el compañero trabaja sobre el Dropbox de verdad. El 2-oct-2026 pasó esto:
cambios hechos en casa que no aparecían en el centro, fichas sin carpeta, y números de asunto
(`A26-…`) repartidos por separado en cada copia.

No es un fallo de la copia sin internet ni de la cola de guardado. Son dos copias de los mismos
datos que se cambian a la vez, por fuera de la aplicación.

Tampoco vale «en casa solo miro»: al abrirse, la aplicación guarda cosas ella sola (la copia
diaria, el nombre de quien entra, la señal de presencia al abrir un asunto, el paso automático a
«Por liquidar», índices, fusión de ficheros en conflicto…). Todo eso también viaja al centro.

La solución de fondo (que en casa la aplicación se conecte directamente al Dropbox del centro) está
en `docs/PENDIENTES-DE-DISENAR.md`, punto 2, **sin diseñar**. Esta fila es la protección de mientras
tanto, y se queda después para cualquier ordenador que trabaje sobre una copia.

## Lo que decidió Francisco

1. **Una casilla «En este ordenador, solo consultar»** en la pantalla de entrada (la de señalar
   las dos carpetas y elegir el nombre, `index.html` ~líneas 74-107), **encima de «Entrar»**. Con
   una línea gris debajo: «La aplicación no guardará nada en las carpetas. Para cuando este
   ordenador trabaja sobre una copia.» Así se marca **antes de que la aplicación haya guardado
   nada**. La misma casilla está también en Ajustes → Mantenimiento → «Carpetas de este ordenador».
2. **Se recuerda solo en ese ordenador** (en el navegador, nunca en `_GESTOR`, que es de los dos).
   Marcarla en el Chromebook no cambia nada en el centro. Las siguientes veces se entra ya en solo
   consulta, con la casilla marcada a la vista en la pantalla de entrada.
3. **Con ella marcada, la aplicación no guarda nada en las carpetas señaladas**: ni lo que haga el
   usuario ni lo que hace sola al entrar o de fondo. Cero escrituras, cero borrados, cero cambios
   de nombre.
4. **Aviso fijo arriba, en todas las pantallas**: «Solo consulta: en este ordenador no se puede
   cambiar nada.» y a la derecha «Quitar». «Quitar» pregunta antes: «¿Quitar «solo consultar» en
   este ordenador? La aplicación volverá a guardar en las carpetas señaladas. Hazlo solo si son
   las carpetas del centro, no una copia.» (Quitar / Cancelar). Al quitarlo (y al marcarlo desde
   Ajustes) la aplicación se recarga y vuelve a la pantalla de entrada.
5. **Los botones que cambian algo salen apagados**, con el motivo al pasar el ratón («Solo
   consulta»). Buscar, filtrar, ordenar, abrir asuntos, hitos, fichas de personas y documentos,
   copiar la «Ruta», «Exportar» (va a Descargas, no a las carpetas) e «Imprimir» funcionan igual.
6. **No se envían correos ni mensajes de Séneca** desde ese ordenador (al enviar se guarda un PDF
   `CORREO` en el asunto). El cuadro se puede abrir y leer; «Enviar» sale apagado.
7. El botón «Soporte» sigue funcionando (no guarda en las carpetas).

## Decisiones de Claude (internas; Francisco no las ha visto ni hace falta)

**a) La marca vive en el navegador** (`localStorage`, por ejemplo `gestor.soloConsulta`, o
`Almacen`), y se lee **lo primero**, antes de cualquier lectura o escritura de las carpetas.
Comprobar de paso que hoy no se escribe nada en las carpetas antes de pulsar «Entrar».

**b) La garantía no puede depender de haber apagado bien cada botón.** Hay 43 ficheros de `js/` que
usan directamente los manejadores de carpetas y ficheros. Hacen falta dos capas:

- *Capa 1, el permiso:* en solo consulta, las carpetas se piden al navegador en modo de lectura
  (`mode: 'read'` en `Carpetas.elegir` y `Carpetas.permiso`, `js/carpetas.js` líneas 15-30, y en
  `js/nucleo.js` ~líneas 181-204). Ojo: no basta, porque Chrome puede conservar el permiso de
  escritura dado antes a esas mismas carpetas, y porque `createWritable()` sobre un permiso de
  lectura puede hacer que el navegador ofrezca darlo.
- *Capa 2, el cierre de verdad:* un único punto por el que todo pasa. La propuesta: fichero nuevo
  `js/solo-consulta.js` con `SoloConsulta.activo()` y `SoloConsulta.proteger(manejador)`, que
  devuelve la carpeta raíz envuelta de forma que ella y **todo lo que salga de ella**
  (`getDirectoryHandle`, `getFileHandle`, `values()`, `entries()`, `keys()`) rechace
  `createWritable`, `removeEntry`, `move`, `remove` y cualquier `{ create: true }` con un error
  reconocible (`error.name === 'SoloConsulta'`). Se aplica en `js/nucleo.js` a `App.E.abiertos`,
  `App.E.archivo` y `App.E.gestor` nada más tenerlas, y a las demás carpetas que se señalen
  (bandeja de correos, `js/bandeja-correos.js`). El modelo de cómo imitar un manejador ya existe:
  `js/demo/disco.js`. Cuidado con lo que necesita el manejador de verdad: guardarlo en `Almacen`
  (IndexedDB), `isSameEntry`, `resolve`, `startIn` de los cuadros de elegir fichero. Si al mirar el
  código hay un punto único mejor que este, se usa ese; lo que no se negocia es la prueba del
  punto 1 de «Cómo sabemos que está bien».

**c) Lo que la aplicación hace sola, se salta** cuando `SoloConsulta.activo()`, sin aviso ni
error: copias diarias y su caducidad (`js/copias.js`), `Usuarios.anadirSiHaceFalta`, la señal de
presencia (`js/presencia.js`), `PorLiquidar.alEntrar`, el vaciado de la papelera, guardar el índice
del ARCHIVO (se puede hacer en memoria, sin guardarlo), la fusión de ficheros en conflicto de
Dropbox, el renombrado de carpetas de aspirantes, la llegada de hitos nuevos de una guía a los
asuntos abiertos, los asuntos recurrentes, `js/actualizar-copia.js` y todo lo que pase por
`ColaGuardado`. Buscar el resto con `grep` de quién llama a las funciones que escriben de
`js/carpetas.js` (`escribirTexto`, `escribirBytes`, `guardarJson`, `crear`, `mover`, `renombrar`,
`trasladar`, `fusionarEn…`, `renombrarFichero`, `moverFichero`, `copiarFicheroEn`) y a
`Copias.guardar`. Si `Copias.comprobarTodos` encuentra un fichero roto, en solo consulta se dice
y no se ofrece restaurar.

**d) El error `SoloConsulta` nunca sale en rojo ni se queda en silencio.** Si viene de una acción
del usuario (un botón que se haya escapado del punto 5), un aviso gris o ámbar: «Solo consulta: no
se ha guardado nada.» Si viene de una tarea de fondo, se calla. Hacerlo en un solo sitio
(`U.mensajeDeError`, `U.fallo`, `U.accesorio`), no en cada llamada. Y tras un intento rechazado, la
pantalla no puede quedarse enseñando el cambio como si se hubiera guardado: se repinta con lo que
hay en las carpetas.

**e) Los botones apagados.** En la ficha y en la mesa de un hito ya existe el modo consulta
(`aplicarModoConsulta`, `js/ficha-consulta.js`, el de «tu compañero está en este asunto»): en solo
consulta se fuerza siempre, sin «Tomar el mando» y sin el aviso de presencia (ya está el aviso fijo
de arriba). En el resto, apagar como mínimo:

- «+ Nuevo asunto» (cabecera y menú de la izquierda) y el tablón (escribir una nota, marcarla).
- Inicio: «Archivar» del ⋮, «Pasar a Por liquidar», las casillas y «Liquidar» de «Por liquidar», y
  los avisos del cuadro que arreglan algo.
- «Ver todo»: «Guardar en un asunto», «Guardar aquí», «Crear asunto con él», «Borrar», «Cambiar el
  nombre», y lo mismo en la bandeja de Gmail.
- Archivo: reabrir. Personas y empresas: altas, cambios y «+ Nuevo asunto para esta persona».
- Impresos: lo que guarde en un asunto. Word en la app: «Guardar PDF» («Imprimir» sí funciona).
- Herramientas: Papelera, Traer el alumnado, Tablas de datos y Restaurar una copia.
- Ajustes: todo se ve, nada se cambia, salvo esta casilla.
- Correo y Séneca: «Enviar».

Lo que se escape de esta lista lo recoge la capa 2 con el aviso del apartado d. Mejor una regla
general (una clase en `<body>` y un repaso de los controles, como hace `aplicarModoConsulta`) que
un `if` en cada pantalla.

**f) El aviso fijo** usa el mismo sitio y el mismo mecanismo que la franja fija de arriba de la
copia sin internet (`#franja-copia`, `js/actualizar-copia.js`), sin taparla ni romper la cabecera
fija (`pruebas/cabecera-fija.mjs`) ni la altura de la lista de Inicio (fila 256).

**g) Lo que el navegador guarda para sí** (`localStorage`, `Almacen`: novedades vistas, tarjetas
abiertas, las carpetas señaladas, el nombre de usuario) no son las carpetas: sigue funcionando.

**h) En el centro no cambia nada.** Sin la casilla marcada, la aplicación hace exactamente lo de
hoy; `SoloConsulta.proteger` devuelve el manejador tal cual.

## Dónde mirar (cambios quirúrgicos; no leer el repositorio entero)

- `index.html`: pantalla de entrada (~74-107) y Ajustes → Mantenimiento, bloque «Carpetas de este
  ordenador» (~834-842). Alta del fichero nuevo.
- `js/nucleo.js` (la entrada, ~líneas 80-270), `js/carpetas.js` (568 líneas; el tope es 600: si
  hace falta sitio, lo nuevo va al fichero nuevo).
- **Fichero nuevo `js/solo-consulta.js`** (y, si se pasa de 600 líneas, `js/solo-consulta-botones.js`).
  Enganchado por un punto previsto, sin envolver funciones de otros módulos; si no hay más remedio,
  con `U.envolver` y apuntado en `js/envolturas-esperadas.js`.
- `js/util.js` (`U.mensajeDeError`, `U.fallo`, `U.accesorio`), `js/ficha-consulta.js`,
  `js/presencia.js`, `js/copias.js`, `js/cola-guardado.js`, `js/comprobacion-entrada.js`,
  `js/bandeja-correos.js`, `js/actualizar-copia.js`, `js/por-liquidar.js`.
- `js/demo/disco.js`: añadir un contador de escrituras para la prueba (solo en la copia de pruebas;
  producción no carga `js/demo/`).
- Textos con las palabras de `docs/VOCABULARIO.md` («cambiar», «borrar», «guardar»). Añadir ahí la
  fila: el modo de un ordenador que no guarda nada → **solo consulta** («En este ordenador, solo
  consultar»); no usar «solo lectura» ni «modo lectura».
- Dar de alta lo nuevo en `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`.

## Cómo sabemos que está bien

En la copia de pruebas (`?demo=1&auto=1`), con la marca de solo consulta puesta en el navegador
antes de cargar:

1. **Cero escrituras.** Entrar, esperar a que acaben las tareas de fondo, y pasar por Inicio (las
   pestañas), la ficha de un asunto, la mesa de un hito, «Ver todo», Archivo (abrir un asunto
   archivado), Personas y empresas (abrir una ficha), Impresos, Cuentas, Herramientas y Ajustes
   (abrir un tipo): el contador de escrituras del disco de demostración sigue en **0**.
2. **El cierre aguanta.** Llamar desde la consola a `Carpetas.escribirTexto(App.E.gestor, 'x.txt',
   'x')`, a `Carpetas.crear(App.E.abiertos, 'X')` y a `Copias.guardar(...)`: las tres se rechazan
   con `SoloConsulta` y el contador sigue en 0.
3. El aviso «Solo consulta: en este ordenador no se puede cambiar nada.» se ve arriba en todas las
   pantallas del punto 1, sin tapar la cabecera ni mover la lista de Inicio.
4. Están apagados, con su motivo: «+ Nuevo asunto», la caja del tablón, «Archivar» del ⋮, todos
   los controles de la ficha y de la mesa que cambian algo, las acciones de «Ver todo», los
   controles de Ajustes (menos la casilla) y «Enviar» del cuadro de Correo.
5. Buscar, filtrar, ordenar, abrir un documento, copiar la «Ruta» y «Exportar» funcionan.
6. Forzar un botón que cambia algo (quitándole el apagado a mano): sale «Solo consulta: no se ha
   guardado nada.», nunca un aviso rojo, y la pantalla no enseña el cambio.
7. Ningún aviso rojo ni ámbar al entrar por culpa de las tareas de fondo que se han saltado.
8. «Quitar» del aviso: pregunta, recarga y deja en la pantalla de entrada con la casilla sin
   marcar. Entrando así, todo funciona como siempre y el contador sube (hay escrituras).
9. La casilla de la pantalla de entrada: marcarla y pulsar «Entrar» entra en solo consulta sin
   una sola escritura; recargar la página: la casilla sigue marcada.
10. Sin la marca: la pasada completa de pruebas, igual que antes de esta fila.
11. Prueba nueva `pruebas/solo-consulta.mjs` con los puntos 1 a 9, en verde. Mientras se trabaja,
    solo las pruebas de lo tocado; la pasada completa, una sola vez al final.
12. **[SOLO FRANCISCO]**, a `docs/COMPROBAR-A-MANO.md`: en casa, en el Chromebook, marcar la
    casilla en la pantalla de entrada, entrar, mirar unos minutos (Inicio, un asunto, un
    documento). Después, en Drive («Ordenadores» → la carpeta → `_GESTOR`), ningún fichero tiene
    fecha de modificación posterior a la hora de entrada.

## Al terminar

- Línea en `js/novedades.js` (regla 21): «En un ordenador que trabaja sobre una copia de las
  carpetas se puede marcar «En este ordenador, solo consultar»: la aplicación no guarda nada ahí».
- Una línea nueva en la sección 5 de `docs/CONTEXTO-CORTO.md` (corta; ese documento ya pasa de su
  tope) y el detalle en el hijo de `docs/contexto/` que toque. En la sección 6, una regla: «todo
  código nuevo que escriba en las carpetas de fondo mira antes `SoloConsulta.activo()`».
- En `docs/HISTORIA.md`, con fecha, el diagnóstico de «El problema» en cuatro líneas.
- Reglas de la cola de siempre: rama `fila-260`, revisor en local, una sola publicación de código,
  sin preguntar nada a Francisco.
