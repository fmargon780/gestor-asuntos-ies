# 648 — Carpetas archivadas con nombre más corto

Tema 631 (junta la idea 621). Diseñado con Francisco el 13-nov-2026.

## Lo que escribió Francisco

(12-nov-2026, `docs/notas-diseno/620.md`)

> Uno de los problemas que tenemos con el largo de las rutas es porque dentro de la carpeta de la
> persona las carpetas que incluyo siguen teniendo el nombre de la persona. Esto es un vestigio de
> cuando yo usaba esta estructura de carpetas sin la app, ya que usaba el nombre de la carpeta como
> asunto en las comunicaciones. Creo que ahora mismo podríamos tener un nombre más simple en las
> carpetas y que los asuntos para las comunicaciones se generen en la app, configurables o
> personalizables, sin tener que tener ese nombre en la carpeta.

En el debate (13-nov-2026):

- A la propuesta de Claude de quitar la persona solo al archivar: «Adelante con tu forma mejor».
- Sobre las carpetas ya archivadas con número, entre dejarlas o acortarlas con un botón: «2»
  (acortarlas con un botón en Herramientas).
- Sobre la pantalla de prueba: «1» (sin pantalla).

## Lo que entendió Claude (acordado con Francisco el 13-nov-2026)

Mandan estas conclusiones sobre el texto de arriba: la persona no se quita de todas las carpetas,
solo de las archivadas.

**Al archivar**

- Un asunto abierto se sigue llamando como hoy: `261113 A26-0137 BAJA MATRICULA Cordero Navas, Lucía 1139877`.
- Al archivarlo, su carpeta entra en la carpeta de la persona sin el nombre de la persona:
  `ARCHIVO / Alumnado / Cordero Navas, Lucía 1139877 / 261113 A26-0137 BAJA MATRICULA`.
- Vale para todas las clases de tercero (alumnado, personal, empresas, Administraciones, otros).
- El cuadro «Archivar el asunto» enseña, debajo de adónde va la carpeta, cómo se llamará allí.
- Al reabrir un asunto archivado, su carpeta vuelve a Asuntos abiertos con el nombre de la persona
  al final, como cualquier asunto abierto.
- Los asuntos sin número (`A26-…`), los de antes, siguen como hoy: abiertos y archivados conservan
  su nombre entero.
- Los documentos de dentro no cambian de nombre.
- En la app, un asunto archivado se sigue viendo con su persona, igual que hoy: la app la saca de
  la ficha y de la carpeta de la persona. Donde la app enseña o copia el nombre o la ruta de una
  carpeta archivada, sale el nombre corto.
- La cuenta del largo de las rutas (el aviso ámbar de «Nuevo asunto» y «Cambiar el asunto», la
  medida al archivar y Ajustes → El centro → «Largo de las rutas») cuenta ya con el nombre corto
  en el archivo.

**Las carpetas ya archivadas**

- En Herramientas hay un botón nuevo, «Acortar las carpetas del archivo».
- Al pulsarlo, la app cuenta las carpetas archivadas con número que todavía llevan el nombre de la
  persona y abre un cuadro que dice cuántas son, que la otra persona tiene que estar fuera de la
  app y que Google Drive tardará un rato en ponerse al día en los dos ordenadores. Botones:
  «Acortar las N carpetas» y «Cancelar».
- Mientras trabaja se ve por cuál va («37 de 212»).
- Al terminar dice cuántas ha cambiado y, si alguna no ha podido, cuáles (con su persona) y por
  qué. Las que no ha podido se quedan como estaban.
- Si se corta a medias, se vuelve a pulsar y sigue con las que faltan.
- Con todas ya cortas, el cuadro dice que no queda ninguna por acortar.
- Las carpetas archivadas sin número no se tocan ni se cuentan.
- En un ordenador en «solo consulta» el botón no hace nada: lo dice.

**Qué desaparece**

- Nada de la app. Solo deja de repetirse el nombre de la persona en las carpetas archivadas con
  número.

## Pantalla de prueba

- No se pidió: no cambia de sitio nada de lo que hay; solo hay un botón nuevo con su cuadro, y lo
  que dice queda escrito arriba.

## Qué NO se hace en esta tarea

- No se quita la persona del nombre de los asuntos abiertos.
- No se cambia el nombre de las carpetas sin número, ni abiertas ni archivadas.
- No se cambia el nombre de los documentos ni de las carpetas de las personas.
- No se toca el asunto de los correos ni el extracto de Séneca (fila 627).

## Notas técnicas de Claude

Solo cómo se programa. Si al hacerlo aparece algo que cambia lo que ve quien usa la app y no está
arriba, se para y se pregunta.

- Leer antes `docs/contexto/NOMBRES-FIJOS.md` y `docs/contexto/ASUNTOS-ARCHIVO.md`, y ponerlos al
  día al terminar, junto con el apartado 4 de `docs/CONTEXTO-CORTO.md` («lo que ya existe no se
  renombra» deja de ser verdad para las archivadas con número).
- El nombre corto es el de `montarAsunto` con `datos.numero` sin el último trozo:
  `AAMMDD A26-0137 TIPO`. Conviene una función propia en `Nombres` (por ejemplo
  `nombreEnArchivo(datos)`) y su inversa para reabrir, que monta el nombre abierto con
  `ficha.tercero` (ya pasado por `acortarNombrePila`). Solo con `numero`; sin él, no se toca nada.
- Archivar: `App.cerrarAsunto` (`js/asuntos-archivar.js`) y `js/archivar-fondo.js`. La carpeta
  llega al archivo ya con el nombre corto. Ojo con todo lo que hoy busca `a.nombre` dentro de la
  carpeta del tercero: «ya existe» y la fusión de un intento a medias (`Carpetas.fusionarEn`), «ya
  archivada», y `ArchivarCabe.medir` / `Nombres.largoEnArchivo`. Tienen que reconocer las dos
  formas (larga, de un intento anterior o de antes de esta fila, y corta).
- La clave del asunto es el nombre de su carpeta: el cambio de nombre pasa siempre por
  `AsuntoRenombrar` (`js/asunto-renombrar.js`), que mueve a la vez la ficha, sus hitos y su señal
  de presencia, y respeta las lápidas de `borrados-listas.json`. Todo guardado de `_GESTOR`, por
  `ColaGuardado`.
- Reabrir: buscar todos los caminos (`js/ficha-archivo.js` `reabrirYSubirFicha`,
  `js/bandeja-guardar.js` `reabrirYGuardar`, `js/archivo-indice.js`, encargos, correo que reabre:
  fila 480). Todos devuelven la carpeta con el nombre abierto.
- Quien lee la persona del nombre de la carpeta con `Nombres.leer(...).resto` y puede recibir una
  carpeta archivada tiene que tomarla de la ficha o de la carpeta del tercero cuando el nombre no
  la trae: `js/archivo-indice-construir.js`, `js/archivo-personas.js`, `js/base.js`,
  `js/indice-expediente.js`, `js/otros-del-tercero.js`, `js/duplicados.js`,
  `js/duplicados-aviso.js`, `js/carpetas-perdidas-buscar.js`, `js/parecido-de-carpetas.js`,
  `js/cuentas.js`, `js/reservados.js`, `js/tipos-buscador.js`, `js/tipos-y-su-uso.js`,
  `js/reunir-migracion.js`. Revisar cada uno; `Nombres.leer` de `261113 A26-0137 BAJA MATRICULA`
  tiene que dar tipo reconocido y `resto` vacío (hoy el tipo se reconoce con un espacio detrás:
  `js/nombres-terceros.js`).
- Cambiar el tipo, el tercero o la fecha de un asunto archivado, unir tipos
  (`js/tipos-unir.js`) y renombrar un tercero (`js/tercero-renombrar.js`): si renombran carpetas
  archivadas, que monten el nombre corto en las que tienen número.
- La cuenta de rutas: `Nombres.cabeEnRuta`, `Nombres.medidor`, `Nombres.largoEnArchivo`
  (`js/nombres-topes.js`, `js/largo-de-rutas.js`, `js/archivar-cabe.js`) con el nombre corto para
  los asuntos con número.
- El botón de Herramientas: módulo nuevo, por debajo de 400 líneas, apuntado en su lista
  `js/cargar-piezas-N.js`. Recorre `ARCHIVO/<categoría>/<tercero>/` y cambia el nombre de las
  carpetas con número cuyo nombre termina en el tercero. De una en una, releyendo antes; si una
  falla, se apunta y se sigue. Actualiza el índice del ARCHIVO y `base/` por `BasePonerAlDia`. Mira
  `SoloConsulta.activo()`. El cuadro, con la regla común de `.capa > .cuadro`. Renombrar una
  carpeta en el navegador es copiar y borrar (`Carpetas.trasladar`): si la copia no sale completa,
  no se borra nada.
- Textos con las palabras de `docs/VOCABULARIO.md`; añadir ahí el botón nuevo.
- Línea en `js/novedades.js`.
- Pruebas nuevas: archivar con número (nombre corto en el archivo), reabrir (nombre entero),
  archivar sin número (sin cambio), intento a medias con la forma larga, el botón (cuenta, cambia,
  repetir no hace nada, una que falla queda en la lista) y que el índice del ARCHIVO y «Otros
  asuntos de este tercero» siguen dando la persona.

## Cómo lo comprueba el segundo revisor

Con la demo (`?demo=1&auto=1`). Lo que no pueda ver, lo dice.

- Archiva un asunto con número: el cuadro «Archivar el asunto» enseña adónde va y el nombre que
  tendrá, sin la persona.
- Ese asunto, buscado en el archivo, sale con su persona y se abre.
- «Ruta» de ese asunto archivado termina en `… / <persona> / <fecha> <número> <TIPO>`.
- Reábrelo: vuelve a Asuntos abiertos y su carpeta lleva otra vez la persona al final.
- Un asunto abierto recién creado lleva la persona en el nombre, como antes.
- Un asunto archivado sin número conserva su nombre entero.
- «Otros asuntos de este tercero» en un asunto abierto sigue enseñando los archivados de esa
  persona.
- Herramientas → «Acortar las carpetas del archivo»: el cuadro dice cuántas son, que la otra
  persona tiene que estar fuera y que Drive tardará; botones «Acortar las N carpetas» y
  «Cancelar».
- Al acortar se ve el avance y, al terminar, cuántas ha cambiado.
- Pulsado otra vez, dice que no queda ninguna.
- Ajustes → El centro → «Largo de las rutas» sigue saliendo y no empeora.
- **[SOLO FRANCISCO]** Con las carpetas reales en Google Drive: que tras pulsar el botón el
  archivo queda con los nombres cortos en los dos ordenadores.

## Qué mirar al terminar

- Archiva un asunto con número y mira el cuadro: debajo de adónde va, sale el nombre corto.
- Abre la carpeta de esa persona en Google Drive: la carpeta del asunto ya no lleva su nombre.
- Busca ese asunto en la app: sale con su persona, como siempre.
- Reábrelo y mira su carpeta en Asuntos abiertos: lleva otra vez la persona.
- Con Diego fuera de la app, pulsa Herramientas → «Acortar las carpetas del archivo» y mira
  cuántas dice que son antes de aceptar.
- Al terminar, mira si hay alguna que no ha podido y por qué.
- Mira Ajustes → El centro → «Largo de las rutas»: el margen tiene que haber subido.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
