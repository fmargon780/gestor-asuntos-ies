# Archivar mide antes la ruta, y deja acortar ahí mismo (fila 265)

Aviso de usuario del 5-oct-2026 (pantalla «Inicio»), diseñado con Francisco el mismo día.

## Qué pasó

El compañero de Francisco quiso archivar desde Inicio (⋮ → Archivar) un asunto de ADMISION abierto
el 28-sep-2026, con nombre de carpeta de antes de la fila 239. Salió, en rojo: «No se ha podido
archivar: No encuentro la carpeta o el fichero. Puede que se haya movido o que lo esté
sincronizando Dropbox en este momento.» Versión `02-oct-2026 · 18:21`, copia sin internet, en
`C:\Users\Usuario\Dropbox\…`.

Ese texto engaña. La carpeta sí estaba en ASUNTOS ABIERTOS: `App.cerrarAsunto` lo mira antes
(`Carpetas.existe`) y, si falta, da otro aviso, en ámbar. Lo que salió es un `NotFoundError` del
navegador, traducido por `U.mensajeDeError`, lanzado más adentro: al crear la carpeta del tercero
en el ARCHIVO o al copiar.

**Causa más probable, sin confirmar** (desde la conversación no se ven las carpetas del centro): al
archivar, la carpeta queda dos niveles más adentro (`<ARCHIVO>/<CATEGORÍA>/<tercero>/<asunto>/…`) y
la ruta de algún documento pasa de los 259 caracteres de Windows. Windows contesta «ruta no
encontrada» y Chrome lo entrega como `NotFoundError`. Un fichero que desaparece al leerlo ya tiene
su mensaje propio (`leerFicheroParaCopiar`), así que no era eso. En ese mismo ordenador salió esa
mañana el otro problema de ruta larga (fila 263).

Como la causa no está confirmada, la fila hace dos cosas: medir antes (parte A) y, si aun así
falla, decir dónde ha fallado de verdad (parte B).

## Qué quiere Francisco

1. Al pulsar «Archivar», la aplicación **mide antes** la ruta que tendrá en el ARCHIVO cada
   documento del asunto, incluidos los de sus subcarpetas («Versiones previas» y las demás).
2. Si todo cabe, archiva como hoy, con su cuadro de siempre.
3. Si algo no cabe, **no mueve nada** y, en vez del cuadro de siempre, abre un cuadro con solo los
   documentos que no caben. Cada uno, con su nombre en una caja para acortarlo ahí mismo y con
   cuántos caracteres le sobran. Cuando caben todos, se archiva desde ese mismo cuadro.
4. Si lo que no cabe es el nombre de la carpeta del asunto, el cuadro lo dice y lleva a «Cambiar el
   asunto».
5. Si archivar falla por cualquier otra causa, el mensaje dice **en qué paso y con qué fichero**, y
   que no se ha movido nada.

Francisco eligió que el nombre lo acorte la persona, no la aplicación sola: la aplicación no sabe
qué parte del nombre importa.

## Parte A — medir antes de archivar

### La cuenta

En `js/nombres-topes.js`, una función nueva (por ejemplo `Nombres.largoEnArchivo(categoria,
tercero, nombreAsunto, rutaRelativa)`) que devuelve el largo de la ruta completa:

    raizDeEsteOrdenador() + <ruta de ARCHIVO> / <categoría> / <tercero> / <asunto> / <ruta relativa>

- `raizDeEsteOrdenador()` y `RutaCarpetas.comunConocido('archivo')` son los de la fila 263; el tope
  es `TOPE_TOTAL_RUTA` (259). No se toca nada de esa cuenta: solo se le añade esta función y se
  exporta el tope.
- `categoria` y `tercero` son los **definitivos**, los mismos que usa después el traslado (ya
  pasados por `Nombres.carpetaDeTercero`).
- A cada **fichero** se le suman 7 caracteres: Chrome escribe primero en un temporal `.crswap` al
  lado, con el nombre entero delante. Una subcarpeta cuenta por su propia ruta, sin esos 7.
- No se miden los que no se copian (`noSeCopia` de `js/carpetas.js`).
- Sin la ruta de ARCHIVO conocida (`comunConocido('archivo')` vacío) no hay con qué medir: se
  archiva como hoy, sin cuadro nuevo.

### La carpeta del asunto es el problema

Si `<…>/<asunto>/` + un nombre de documento de 30 caracteres + 7 ya pasa del tope, acortar
documentos no arregla nada. Entonces el cuadro no enseña cajas. Texto: «El nombre de la carpeta de
este asunto es demasiado largo para el archivo: le sobran N caracteres. Cámbialo y vuelve a
archivar. No se ha movido nada.» Botones: «Cambiar el asunto» (abre el cuadro de siempre, el de la
ficha) y «Cancelar».

### El cuadro «No cabe en el archivo»

Sale **en lugar** del cuadro «Archivar el asunto», no después (un solo `U.preguntar` a la vez).
Ancho, como las ventanas anchas de la ficha, y con las cajas a todo el ancho: Francisco no quiere
renglones estrechos con hueco a los lados.

- Título: «No cabe en el archivo».
- Texto: «Al archivar, esta carpeta queda dentro de la del tercero, y la ruta de N documento(s)
  sale más larga de lo que admite Windows. Acorta su nombre aquí. No se ha movido nada.» Debajo,
  la vista de destino de siempre (`ARCHIVO / categoría / tercero`) y, si toca, el aviso ámbar de
  fusión que ya existe.
- Una línea por documento que no cabe: caja con el nombre **sin la extensión**, la extensión fija
  a su derecha (no se puede cambiar), y a la derecha del todo «Sobran N» en rojo. Al escribir se
  recalcula: cuando cabe, «Cabe» en verde. Los que están en una subcarpeta llevan delante, en
  gris, el nombre de esa subcarpeta.
- Una caja no vale si queda vacía, si lleva caracteres que `U.limpiarNombre` quitaría, o si su
  nombre ya lo tiene otro fichero de la misma carpeta (o de otra caja): bajo ella, en rojo, el
  motivo en pocas palabras.
- Botones: «Acortar y archivar» (apagado hasta que todas las cajas caben y valen) y «Cancelar».
- Con más de 12 documentos, la lista tiene su propia barra; los botones no se van de la vista.

### Al pulsar «Acortar y archivar»

1. Se cambia el nombre de cada documento tocado, uno a uno.
2. Si un cambio falla, se para ahí: aviso rojo con el nombre de ese documento, no se archiva, y los
   ya cambiados se quedan cambiados.
3. Con todos cambiados, se vuelve a medir (por si acaso) y se archiva por el camino de siempre, sin
   preguntar otra vez.

**Cambiar el nombre de un documento no es solo `Carpetas.renombrarFichero`.** Hay cosas que
apuntan al documento por su nombre: `ficha.pendientesRegistro` y los documentos asociados a cada
hito (`Hitos.quitarDocumento` / `Hitos.anadirDocumento`), como se ve en `guardar` de
`js/documentos-guardar.js`. Busca si hay alguna más (una búsqueda de quién guarda nombres de
fichero en la ficha o en los hitos, no una lectura del repositorio). Haz **una función común**
(fichero nuevo y pequeño, por ejemplo `js/documento-renombrar.js`) que cambie el nombre y ponga al
día todo eso, y úsala aquí. No reescribas `documentos-guardar.js` para que la use: si encaja con un
cambio de dos o tres líneas, bien; si no, se queda como está.

### Archivar varios de golpe

`js/repartir-crear.js` y `js/por-liquidar-liquidar.js` archivan en lote con
`App.E.archivarSinPreguntar`. Ahí no se abre ningún cuadro: el asunto que no cabe **no se archiva
y se queda donde estaba**, y al acabar el lote sale un solo aviso ámbar: «N asunto(s) no se han
archivado porque algún documento no cabe en el archivo: archívalos uno a uno desde su ⋮.» Añade a
`App.cerrarAsunto` lo mínimo para que el lote sepa que ese no se archivó. En «Por liquidar», el
asunto sigue en esa pestaña con su liquidación ya guardada; al archivarlo después a mano sale el
cuadro nuevo.

## Parte B — si falla, decir dónde

Hoy el `catch` de `App.cerrarAsunto` dice solo `U.fallo('No se ha podido archivar', e)`. Pasa a
decir el paso y, si lo hay, el fichero:

    No se ha podido archivar: ha fallado <paso>. <causa> No se ha movido nada: la carpeta sigue en Asuntos abiertos.

- Pasos, con estas palabras: «al preparar la carpeta del tercero en el archivo» (`Carpetas.bajar`
  con crear), «al leer la carpeta del asunto» (abrir el origen y contar), «al copiar «NOMBRE»»
  (cada fichero o subcarpeta, en `copiarDentro` y en la fusión), «al comprobar la copia».
- La forma: que `js/carpetas.js` cuelgue del error que lanza dos datos (`paso` y `fichero`) sin
  cambiarle el `name`, y que `App.cerrarAsunto` monte la frase. `U.mensajeDeError` no se toca.
- `<causa>` es `U.mensajeDeError(e)`, salvo un caso: `NotFoundError` al **crear o escribir en el
  destino** dice «Windows no deja crearlo ahí; suele ser porque la ruta sale demasiado larga o
  porque Dropbox está sincronizando esa carpeta.»
- «No se ha movido nada…» solo se dice cuando es verdad (el traslado ya limpia lo copiado a
  medias). Si la limpieza del destino falla, se dice en su lugar: «Puede haber quedado una copia a
  medias en el archivo; al repetir, se juntan.»
- `App.reabrirAsunto` usa las mismas funciones de `Carpetas`: que su mensaje gane también el paso
  y el fichero, con «reabrir» en vez de «archivar». Reabrir no mide nada (la ruta sale más corta).

## Qué NO se toca

- La cuenta de la fila 263 ni sus avisos ámbar de «Nuevo asunto» y «Cambiar el asunto».
- El aviso ámbar de «No encuentro la carpeta de este asunto ni en Asuntos abiertos ni en el
  archivo…» y el verde de «ya estaba archivado»: siguen igual, y van antes de medir.
- Ningún nombre se acorta solo. Ninguna carpeta se renombra sola.
- En solo consulta (fila 260) no cambia nada: archivar ya está apagado.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/ASUNTOS-ARCHIVO.md`
  (apartados «Archivar» y «Los atascos al archivar»), `docs/contexto/NOMBRES-FIJOS.md` (apartado
  «Largo de las rutas») y los ficheros de la lista basta.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- `js/carpetas.js` tiene 571 líneas y el tope es 600. Si con la parte B se pasa, saca la fusión
  (`fusionarDentro`, `fusionarEn` y lo suyo) a `js/carpetas-fusion.js`, sin cambiar cómo se llaman
  desde fuera (`Carpetas.fusionarEn`).
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md` («cancelar», no «dejarlo»).
- Rama `fila-265`, revisor en local y, con su APROBADA, a `main`. Nada se queda en una petición de
  cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs archivar`); la
  pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: nombres inventados.

## Ficheros

- `js/nombres-topes.js` (la función que mide y el tope a la vista).
- `js/archivar-cabe.js` (nuevo: medir un asunto entero y el cuadro «No cabe en el archivo»).
- `js/documento-renombrar.js` (nuevo: cambiar el nombre de un documento con todo lo que arrastra).
- `js/asuntos-archivar.js` (llamar a la medida antes del cuadro de siempre; el `catch` nuevo).
- `js/carpetas.js` (paso y fichero en los errores; `js/carpetas-fusion.js` solo si hace falta).
- `js/repartir-crear.js` y `js/por-liquidar-liquidar.js` (el aviso del lote).
- `index.html` y la lista de ficheros de la copia sin internet (los `js/` nuevos), y
  `css/estilos.css` si el cuadro necesita algo.
- `pruebas/archivar-no-cabe.mjs` (nueva, con los puntos de abajo) y `pruebas/archivar-atascos.mjs`
  (los textos que cambian).
- `js/novedades.js`: «Si al archivar algún documento tiene un nombre demasiado largo para el
  archivo, la aplicación lo dice y deja acortarlo ahí mismo, en vez de fallar.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (una línea, sustituyendo si ya hay una que hable del largo
  de la ruta al archivar), `docs/contexto/ASUNTOS-ARCHIVO.md`, `docs/contexto/NOMBRES-FIJOS.md`
  («Largo de las rutas») y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que al archivar la aplicación mide antes y, si un documento no cabe, deja
acortarlo ahí mismo; que no se sabe con certeza si esa era la causa del aviso; y que, si el asunto
de su compañero sigue sin archivarse, el mensaje nuevo ya dice en qué paso y con qué fichero, y
basta con mandar ese aviso por el botón de soporte.

## Cómo sabemos que está bien

Para los puntos 1 a 9: ruta de ARCHIVO apuntada como `ADMINISTRACIÓN/REGISTROS/ARCHIVO` y Dropbox
de este ordenador en `C:\Users\Usuario\Dropbox` (`gestor-ruta-dropbox` en `localStorage`).

1. Archivar un asunto corriente de nombres cortos: sale el cuadro «Archivar el asunto» de siempre y
   se archiva.
2. En un asunto cuya ruta de carpeta en el ARCHIVO mida unos 180 caracteres, con un documento de
   90 caracteres y otro de 20: al pulsar «Archivar» sale «No cabe en el archivo» con **una** sola
   línea (el de 90), su «Sobran N» en rojo y «Acortar y archivar» apagado. La carpeta sigue entera
   en ASUNTOS ABIERTOS.
3. Borrar letras en la caja hasta que cabe: «Sobran N» baja con cada letra y pasa a «Cabe» en
   verde; «Acortar y archivar» se enciende.
4. Poner en la caja el nombre del otro documento de la carpeta: sale el motivo en rojo y el botón
   se apaga.
5. Pulsar «Acortar y archivar» con un nombre válido: el asunto queda en el ARCHIVO con el
   documento ya con su nombre corto y la misma extensión, y no sale ningún aviso rojo.
6. Lo mismo con un documento que estaba pendiente de registro y asociado a un hito: después de
   acortarlo sigue pendiente de registro y sigue en su hito, con el nombre nuevo.
7. Un documento largo dentro de «Versiones previas»: sale en el cuadro con «Versiones previas»
   delante, y al acortarlo cambia de nombre dentro de esa subcarpeta.
8. Un asunto cuya carpeta ya no deja sitio ni a un documento de 30 caracteres: el cuadro no tiene
   cajas, dice «El nombre de la carpeta de este asunto es demasiado largo para el archivo…» y
   «Cambiar el asunto» abre el cuadro de cambiar el asunto.
9. «Cancelar» en el cuadro nuevo: nada cambia de nombre y nada se mueve.
10. Sin ruta de ARCHIVO apuntada: el asunto del punto 2 enseña el cuadro de siempre, sin medir.
11. Con el disco de mentira lanzando `NotFoundError` al crear un fichero llamado `X.pdf` en el
    destino: el aviso rojo dice «…ha fallado al copiar «X.pdf». Windows no deja crearlo ahí; suele
    ser porque la ruta sale demasiado larga o porque Dropbox está sincronizando esa carpeta. No se
    ha movido nada: la carpeta sigue en Asuntos abiertos.», y la carpeta sigue entera en ASUNTOS
    ABIERTOS, sin copia a medias en el ARCHIVO.
12. Con el fallo al crear la carpeta del tercero: el aviso dice «…ha fallado al preparar la carpeta
    del tercero en el archivo…».
13. Repartir un PDF entre tres terceros, uno con un documento que no cabe: se archivan dos, el
    tercero sigue abierto y sale un solo aviso ámbar «1 asunto(s) no se han archivado porque algún
    documento no cabe en el archivo…».
14. Ningún fichero de `js/` pasa de 600 líneas.
15. **[SOLO FRANCISCO]** En el ordenador del compañero, con la copia sin internet ya actualizada,
    archivar el asunto del aviso (ADMISION, abierto el 28-sep-2026): o se archiva, o sale el cuadro
    «No cabe en el archivo» y se archiva tras acortar. Si sale otro mensaje rojo, dirá el paso y el
    fichero: mandarlo por el botón de soporte.
