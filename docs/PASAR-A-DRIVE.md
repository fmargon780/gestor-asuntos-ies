# Pasar las carpetas del Gestor de Dropbox a Google Drive (filas 455 a 459)

Diseñado con Francisco el 24-oct-2026 (tema 447, idea 446). Valen las cláusulas comunes de
`docs/REPARTO-DE-LA-COLA-2026-09-27.md` (a `main` sin pull request, como mucho tres subidas por
fila, nada se sube con `npm test` en rojo) y el revisor de `docs/REVISOR-ANTES-DE-PUBLICAR.md`.
Contexto de la decisión: análisis del 21-oct-2026 (proyecto de Claude,
`claude/Analisis-cambio-de-nube-2026-10-21.md`), resumido abajo.

Son **cinco filas**, una sesión cada una, en este orden. Las filas 455, 456 y 457 no cambian nada
mientras las carpetas sigan en Dropbox: se pueden publicar en cuanto estén.

## Por qué

1. **Un solo marcador.** Francisco y Diego comparten la cuenta común de Administración
   (`29700692.administracion@g.educaand.es`) y, con ella, los marcadores de Chrome. La copia sin
   internet se abre desde el disco (`file:///C:/Users/<usuario>/Dropbox/...`) y el usuario de
   Windows se llama distinto en cada ordenador («Usuario» y «Propietario»). Hoy necesitan un marcador
   cada uno. Con las carpetas en Google Drive para ordenadores, puesto en la **misma carpeta en los
   dos ordenadores** (paso de Francisco, fila 460), la dirección es la misma y basta un marcador.
2. **Trabajar desde casa de verdad**, no solo consultar (hoy, modo «En este ordenador, solo
   consultar», fila 260).
3. Lo decidido el 21-oct-2026: las carpetas de Administración van a la **«Mi unidad» de la cuenta
   común** (50 GB). Drive para ordenadores en modo **«duplicar archivos»** (copia completa en el
   disco), no «transmitir».

## Lo decidido con Francisco (24-oct-2026)

- **Qué pasa a Drive:** las carpetas de cada asunto de «asuntos vivos», el ARCHIVO, `_GESTOR` y la
  carpeta de la copia sin internet («Gestor de Asuntos - aplicación» o la que tenga).
- **Qué se queda en Dropbox:** la carpeta «asuntos vivos» misma. En su raíz el resto del centro deja
  los documentos sueltos («Por clasificar»); ese hábito no se cambia. A partir del traslado, esa raíz
  de Dropbox es solo la **entrada** de documentos sueltos.
- **Desde casa se trabaja igual que en el instituto** (crear asuntos, guardar documentos, enviar
  correos). En casa, Francisco entra en el Chromebook con un segundo usuario de ChromeOS que es la
  cuenta común (fila 461) y abre la versión web. Desde casa no se ven los documentos por clasificar
  (están en Dropbox): «Por clasificar» lo dice con una frase, sin error.
- **El traslado lo hace la app**, con un botón **«Pasar a Drive»**, en el instituto, una tarde sin
  trabajo. Copia todo, comprueba que no falta nada, enseña el resultado y desde ese momento trabaja
  en Drive. **Si se corta, sigue donde lo dejó** al volver a abrir la app y pulsar otra vez el botón.
  No se hace desde casa.
- **Las carpetas viejas de Dropbox** (las de cada asunto, el ARCHIVO, `_GESTOR` y la copia sin
  internet) van a una carpeta **«NO USAR – pasado a Drive el <fecha>»**. Como en Dropbox el navegador
  no puede mover carpetas (`move()` falla, ver `js/carpetas.js`, y copiar y borrar es justo lo que no
  se quiere), **la app crea esa carpeta y les pide a ellos que arrastren las viejas con el explorador
  de Windows** (un minuto: dentro de Dropbox mover es instantáneo). La app dice exactamente qué
  carpetas arrastrar y después comprueba que no queda ninguna fuera. La app no borra nada: pasado un
  mes, las borran ellos a mano.

## Ejemplo con datos reales

El asunto de las **Elecciones al Consejo Escolar** (el más grande que tienen ahora, con muchos
documentos). Después del traslado tiene que abrirse con todos sus documentos y sus versiones
previas, desde el ordenador de Francisco, desde el de Diego y desde casa. En demostración
(`?demo=1`) se usa el asunto de demostración con más documentos (si no hay ninguno con más de diez,
crea uno «Elecciones al Consejo Escolar» en los datos de demostración, con diez documentos y una
carpeta de versiones previas).

## Lo que ya hay en el código (revisado el 24-oct-2026)

- Las carpetas se recuerdan como «handles» en IndexedDB (`js/almacen.js`, base `gestor-asuntos`,
  almacén `ajustes`): `abiertos`, `archivo`, `usuario`, `bandeja` (es la carpeta de correos
  `GESTOR-BANDEJA`, no la de documentos sueltos), `copiaCarpeta`, `alumnado-bd-carpeta`,
  `centro-de-datos-carpeta`. Son de cada ordenador, de cada perfil de Chrome y de cada dirección
  (web, vercel.app y `file://` tienen cada una las suyas). Un handle no se puede construir desde una
  ruta: hay que señalar la carpeta a mano.
- `_GESTOR` está dentro de `abiertos` (`js/nucleo.js`, hacia la línea 223).
- Los documentos sueltos se leen de la raíz de `abiertos`: `js/asuntos-lista.js` (34, 64),
  `js/documentos-vigilancia.js` (33), `js/documentos-sueltos.js` (173, 370).
- Copias en conflicto de Dropbox: `js/conflictos.js` (`ficheroReal`, expresión con «conflic», repaso
  cada 5 minutos), `js/conflictos-datos.js` (27, 181), `js/conflictos-diferencias.js` (121, saca
  «quién» del nombre de Dropbox), enganches en `js/actividades.js` (402), `js/perfil.js` (124),
  `js/administraciones.js` (476); `js/carpetas.js` (91-104) se salta carpetas «conflicted copy».
- Largo de rutas: `js/nombres-topes.js` (`TOPE_TOTAL_RUTA = 259`, raíz de Dropbox por defecto de 45
  caracteres), usado por `js/largo-de-rutas.js`, `js/archivar-cabe.js`, `js/nombres.js` (154-181),
  `js/documentos-sueltos.js` (342-349).
- Botón «Ruta»: `js/copiar-ruta.js` (92-170, `esTrozoDropbox`; clave `gestor-ruta-dropbox` en
  `localStorage`; `_GESTOR/rutas.json` con `{abiertos, archivo}` relativas a la raíz de Dropbox).
- Comprobación al entrar: `js/comprobacion-entrada.js` (127, 276-284, 364, 397-402: «Carpetas de
  Dropbox», «Ruta de Dropbox en este ordenador»).
- Copia sin internet: `js/actualizar-copia.js` (clave `copiaCarpeta`), instalador
  `scripts/plantillas-copia/ABRIR EL GESTOR.html`, `scripts/copia-local.mjs`,
  `docs/COPIA-SIN-INTERNET.md`.
- Mover ficheros entre carpetas: `js/carpetas.js` (400-450) ya copia, comprueba el tamaño y borra si
  `move()` falla; sirve para mover de la entrada (Dropbox) a un asunto (Drive).
- Unas 80 piezas nombran Dropbox, casi todas en comentarios. Textos que ve el usuario:
  `js/util.js` (321, 333), `js/nucleo.js` (309), `js/problemas-textos.js` (47, 93, 212-213),
  `js/plantillas-documento-ajustes.js` (85), `js/conflictos-datos.js` (193), `js/alumnado-bd.js`
  (277, 312).
- Modo demostración: `js/demo/` (disco de mentira en memoria, `js/demo/disco.js`).

---

## Fila 455 — La carpeta de entrada de documentos sueltos, aparte

**Qué hay que hacer.** Un handle nuevo, `entrada`: la carpeta de donde salen los documentos sueltos
(«Por clasificar») y la que vigila `js/documentos-vigilancia.js`. Si no está señalada, todo sigue como
hoy: la entrada es la raíz de `abiertos`. Así, mientras las carpetas sigan en Dropbox, no cambia nada.

- En Ajustes → Mantenimiento, junto a las demás carpetas: **«Carpeta de entrada de documentos
  sueltos»**, con «Señalar» y «Usar la de asuntos vivos» (vuelve a lo de hoy). Debajo, una frase: «Es
  donde el resto del centro deja los documentos para Administración.»
- Tres casos, distintos:
  - `entrada` señalada **sin permiso**: se pide el permiso como los demás (`js/comprobacion-entrada.js`).
  - `entrada` señalada pero **la carpeta no se encuentra** (error al abrirla): la app arranca igual y
    «Por clasificar» dice: **«Los documentos por clasificar solo se ven en el instituto.»** Sin error
    ni aviso en Problemas.
  - `entrada` **sin señalar**: si `_GESTOR/rutas.json` no dice `nube: "drive"`, la entrada es la raíz
    de `abiertos` (lo de hoy). Si dice `nube: "drive"` (después del traslado; lo escribe la fila 458),
    «Por clasificar» dice la misma frase. (Mientras no exista la fila 458 nadie escribe `nube`; la
    prueba lo pone a mano.)
- Clasificar un documento de la entrada a un asunto mueve el fichero de una carpeta a otra aunque
  estén en nubes distintas (ya lo hace `js/carpetas.js`; comprobarlo con una prueba).
- La raíz de `abiertos` deja de leerse como entrada cuando `entrada` está señalada, salvo que sea la
  misma carpeta (`isSameEntry`).
- En la entrada, la lista de documentos sueltos y `js/documentos-vigilancia.js` se saltan las carpetas
  (ya lo hacen) y en especial «NO USAR – pasado a Drive…».
- Demostración: un segundo disco de mentira para la entrada, apagado por defecto; un interruptor de
  prueba lo enciende.

**Cómo sabré que está bien (fila 455)**
1. En Ajustes → Mantenimiento aparece «Carpeta de entrada de documentos sueltos», con «Señalar» y
   «Usar la de asuntos vivos».
2. Sin señalarla, «Por clasificar» enseña los mismos documentos que antes.
3. Señalando otra carpeta, «Por clasificar» enseña los documentos de esa carpeta, y clasificar uno lo
   lleva a la carpeta del asunto y desaparece de la entrada.
4. Con la entrada señalada pero sin encontrar su carpeta, «Por clasificar» dice «Los documentos por
   clasificar solo se ven en el instituto.» y el resto de la app funciona.

---

## Fila 456 — Rutas y textos que valgan para Dropbox y para Drive

**Qué hay que hacer.**

- `js/copiar-ruta.js` y `js/nombres-topes.js` aprenden una **raíz de nube** que puede ser Dropbox o
  Google Drive. Ojo: el navegador **no da la ruta** de una carpeta señalada, solo su nombre. La ruta
  sale, como hoy, de la dirección `file://` de la copia sin internet o de la clave guardada en
  `localStorage`. Se reconoce Drive porque esa ruta contiene el trozo «Mi unidad» o «My Drive», o
  porque `rutas.json` dice `nube: "drive"`. `_GESTOR/rutas.json` guarda también la nube: `{nube: "dropbox" |
  "drive", abiertos, archivo}`. La clave de `localStorage` `gestor-ruta-dropbox` pasa a
  `gestor-ruta-nube` (se lee la vieja si no está la nueva).
- El tope de 259 caracteres sigue. Con Drive, el largo de la raíz se toma de la ruta real (si no se
  conoce, 40 caracteres).
- Los textos que ve el usuario dejan de decir «Dropbox» cuando hablan de las carpetas de la app: dicen
  «la nube» o el nombre de la nube en uso («Dropbox» o «Google Drive»). Los de la entrada de
  documentos sueltos siguen diciendo «Dropbox» si está allí. La comprobación al entrar dice «Carpetas
  de la app» y «Ruta de la nube en este ordenador».
- Los ficheros propios de Google (`.gdoc`, `.gsheet`, `.gslides`, `.gform`, `.gdraw`, `.gmap`,
  `.gsite`, `.gjam`) **no cuentan como documentos**: no salen en las carpetas de los asuntos, ni en
  «Por clasificar», ni en el ARCHIVO.

**Cómo sabré que está bien (fila 456)**
1. Con las carpetas en Dropbox (como hoy), el botón «Ruta» copia la misma ruta que antes.
2. En demostración con la nube puesta en Google Drive, el botón «Ruta» copia una ruta que contiene
   «Mi unidad» y ninguna que contenga «Dropbox».
3. En Ajustes y en la comprobación al entrar, las carpetas de la app ya no se llaman «Carpetas de
   Dropbox».
4. Un fichero `.gdoc` dentro de la carpeta de un asunto no aparece en su lista de documentos.

---

## Fila 457 — Copias en conflicto de Google Drive

**Qué hay que hacer.** Cuando dos ordenadores cambian a la vez un fichero de datos, Google Drive para
ordenadores no hace copias «(conflicted copy)» como Dropbox. **No está comprobado** cómo las nombra en
modo «duplicar»; lo más probable es que deje la otra versión con el mismo nombre y ` (1)`, ` (2)`…
delante de la extensión (`asuntos (1).json`). Hay que tratar las dos formas, sin dejar de tratar la de
Dropbox:

- En `js/conflictos.js` y `js/conflictos-datos.js`, además de la expresión de Dropbox, cuenta como
  copia en conflicto un fichero `<nombre> (N).<ext>` **solo dentro de `_GESTOR`** (y sus
  subcarpetas) **y solo si existe también `<nombre>.<ext>`**. Fuera de `_GESTOR` no: la app pone
  ` (2)` a documentos de los usuarios a propósito (`js/carpetas.js`, 292-299).
- `js/conflictos-diferencias.js`: si el nombre no dice quién (caso Drive), «quién» sale de la fecha de
  modificación del fichero y del último que guardó según `presencia` si se sabe; si no, «el otro
  ordenador».
- Se junta igual que hoy (mismas reglas de unión). Tras juntar, la copia se mueve a la papelera de la
  app como hoy.
- Comprobar que la app no crea ella misma ficheros `<nombre> (N).<ext>` dentro de `_GESTOR` (copias
  diarias, papelera, `base/`); si alguno lo hace, excluir esa carpeta de la regla.
- Puede que Drive no deje ninguna copia y se quede con el último cambio. Lo cubre lo que ya hay: cada
  guardado de `_GESTOR` lee el fichero recién, lo cambia y lo escribe (`ColaGuardado`,
  `App.guardarRegistroFresco`), y `presencia` avisa de quién está en el mismo asunto. Comprobar que
  todos los guardados de `_GESTOR` pasan por ahí; los que no, pasarlos.
- Apuntar en `docs/CONTEXTO.md` que la forma de Drive no está comprobada en los ordenadores reales y
  que, si Francisco ve en Ajustes → Problemas ficheros `_GESTOR` con otro nombre raro, hay que
  añadirlo aquí.

**Cómo sabré que está bien (fila 457)**
1. En demostración, si aparece `asuntos (1).json` junto a `asuntos.json` en `_GESTOR`, al poco los
   cambios de los dos se ven juntos y la copia desaparece.
2. Un documento de un asunto llamado `Acta (2).pdf` no se toca: sigue en su carpeta.
3. Las copias en conflicto de Dropbox se siguen juntando igual que antes.

---

## Fila 458 — El botón «Pasar a Drive»

**Qué hay que hacer.** En Ajustes → Mantenimiento, una sección «Pasar las carpetas a Google Drive»
con el botón **«Pasar a Drive»**. Solo para el perfil Administración y nunca en «solo consultar».

1. **Antes de empezar:**
   - Si `presencia` dice que hay otra persona dentro de la app (señal no caducada: 3 minutos, como
     hoy), no empieza: «<nombre> está dentro de la app. Pídele que la cierre y vuelve a pulsar.» Con
     varias personas, sus nombres separados por comas. Debajo, «Seguir de todas formas» (por si la
     señal es de alguien que cerró mal).
   - Deja un **cerrojo** `_GESTOR/traslado-en-marcha.json` (de Dropbox) para que nadie más trabaje
     mientras dura: quien entre ve «Se están pasando las carpetas a Google Drive. Espera a que
     termine.» y no puede escribir. El cerrojo **no se copia** a Drive. Salidas: en el ordenador que
     lo puso, «Cancelar el traslado» (quita el cerrojo; lo copiado en Drive se queda y no se usa); en
     cualquier otro, si el cerrojo lleva más de 12 horas sin moverse, «Quitar el cerrojo».
   - Pide señalar la carpeta **«Mi unidad»** de Google Drive (en el disco puede llamarse «Mi unidad»
     o «My Drive»). La app solo comprueba el **nombre** de la carpeta señalada (no puede saber su
     ruta); si no es uno de esos dos, avisa y no sigue. Dentro crea «asuntos vivos» y «ARCHIVO» (con
     los nombres que tengan hoy) y la carpeta de la copia sin internet.
   - Cuenta lo que va a copiar y enseña: **«Vas a copiar N documentos (X GB). La cuenta común tiene
     50 GB. Mira el espacio libre aquí antes de seguir: https://drive.google.com/settings/storage»**,
     con «Empezar» y «Cancelar». La app no puede leer el espacio libre de Drive desde el navegador.
2. **Copia**, con barra de progreso y el nombre de lo que va copiando: cada carpeta de asunto de
   «asuntos vivos» (no los ficheros sueltos de su raíz: esos se quedan, son la entrada), el ARCHIVO,
   `_GESTOR` y la carpeta de la copia sin internet si existe. Se mantienen los mismos nombres y la misma
   estructura dentro de una carpeta «asuntos vivos» y otra «ARCHIVO» en el destino (con los nombres
   que tengan hoy).
   - **Se puede cortar y seguir**: la app apunta lo que ya está copiado y comprobado en un fichero de
     avance en el `_GESTOR` de destino. Al volver a pulsar «Pasar a Drive» (o al abrir la app con un
     traslado a medias), dice «Hay un traslado a medias. Seguir» y continúa sin volver a copiar lo
     que ya está bien.
   - Si un fichero no se puede copiar, sigue con los demás y al final lo enseña en la lista de fallos.
   - El navegador no puede conservar la fecha de modificación al copiar: cada fichero copiado tendrá
     la hora de la copia. Para que no cambien fechas ni orden en la app, se guarda en el `_GESTOR` de
     destino `fechas-de-dropbox.json` (ruta relativa → fecha original y tamaño). Donde la app usa la
     fecha de modificación de un fichero (`lastModified`, unos 16 sitios), si el fichero está en esa
     lista y su tamaño no ha cambiado y su fecha es la de la copia, usa la fecha original.
3. **Comprobación**: por cada carpeta, mismo número de documentos y mismo tamaño de cada uno; todos
   los ficheros de `_GESTOR`, con sus subcarpetas, idénticos byte a byte. Se excluyen de la
   comprobación los ficheros que escribe el propio traslado (avance, identificador,
   `fechas-de-dropbox.json`) y el cerrojo. Resultado: **«Copiados N documentos. No falta
   ninguno.»** o la lista de lo que falta, con «Reintentar lo que falta». **No se sigue al paso 4
   mientras falte algo.**
4. **Cambio**: el handle `abiertos` pasa a la «asuntos vivos» de Drive, `archivo` al ARCHIVO de
   Drive, y `entrada` (fila 455) a la «asuntos vivos» de Dropbox. `rutas.json` se reescribe con
   `nube: "drive"`. Se escribe una marca `PASADO-A-DRIVE.json` (fecha, quién, nombres de las carpetas
   nuevas y un identificador único) en la raíz de «asuntos vivos» de Dropbox y el mismo identificador
   en el `_GESTOR` de Drive.
5. **Carpetas viejas**: la app crea «NO USAR – pasado a Drive el <fecha>» dentro de la «asuntos
   vivos» de Dropbox (es la única carpeta madre que conoce) y enseña la lista exacta de lo que hay que
   arrastrar allí con el explorador de Windows: cada carpeta de asunto, `_GESTOR`, y además el ARCHIVO
   y la carpeta de la copia sin internet (de estos dos dice el nombre y dónde suelen estar, porque la
   app no conoce su carpeta madre). Botón «Ya las he arrastrado»: la app comprueba que en la raíz de
   «asuntos vivos» ya no queda ninguna carpeta de asunto ni `_GESTOR`, y que los handles viejos del
   ARCHIVO y de la copia ya no se abren (o están dentro de «NO USAR»); si queda algo, lo lista. Nada se
   borra. Se quita el cerrojo.
6. **Final**: «Las carpetas ya están en Google Drive. Antes de usar la app desde el otro ordenador o
   desde casa, espera a que Google Drive termine de subirlo todo (el icono de Drive deja de girar).
   Diego tendrá que señalarlas la próxima vez que entre. Abre a partir de ahora la copia de la app que
   está en Google Drive: <ruta>. Las carpetas viejas de Dropbox, en "NO USAR – pasado a Drive el
   <fecha>": borradlas dentro de un mes.» **La app no recarga** (en el instituto se trabaja con la
   copia sin internet, cuya carpeta acaba de cambiar de sitio): da la ruta de la copia nueva para
   copiarla y un botón «Abrir la copia nueva» si se puede.

- Demostración: segundo disco de mentira para Drive (`js/demo/disco.js`), que se reconoce como Drive.
  Un interruptor de prueba corta el traslado a la mitad para comprobar que sigue.

**Cómo sabré que está bien (fila 458)**
1. En Ajustes aparece el botón «Pasar a Drive». Antes de empezar dice cuántos documentos va a copiar,
   cuánto ocupan y dónde mirar si cabe en la cuenta común.
2. Al terminar enseña «Copiados N documentos. No falta ninguno», y el asunto de las Elecciones al
   Consejo Escolar se abre con todos sus documentos.
3. Al terminar la copia, la app crea en Dropbox la carpeta «NO USAR – pasado a Drive el (fecha)», dice
   qué carpetas arrastrar allí y avisa si queda alguna fuera. Los documentos sueltos de «asuntos
   vivos» siguen saliendo en «Por clasificar».
4. Si el traslado se corta a la mitad, al volver a pulsar el botón sigue donde lo dejó y termina con
   «No falta ninguno».

---

## Fila 459 — El otro ordenador, casa y la copia sin internet en Drive

**Qué hay que hacer.**

- **El otro ordenador del instituto** (y cualquier instalación que aún apunte a Dropbox: la web, la
  copia sin internet): al entrar, si en la raíz de «asuntos vivos» (Dropbox) hay
  `PASADO-A-DRIVE.json` y sus carpetas guardadas siguen siendo las de Dropbox, sale una franja:
  **«Las carpetas están ahora en Google Drive. Señálalas para seguir.»** con un botón que pide
  señalar la «asuntos vivos» de Drive y el ARCHIVO de Drive. Solo acepta carpetas cuyo `_GESTOR` lleve
  el mismo identificador; si no, «Esa no es la carpeta que se pasó a Drive. Si acabáis de hacer el
  traslado, puede que Google Drive aún no haya terminado de subirla: espera y vuelve a probar.»
- **Esa comprobación va antes de crear nada**: hoy, al entrar, `js/nucleo.js` (hacia la línea 223)
  crea `_GESTOR` si no existe. Si la raíz de «asuntos vivos» tiene `PASADO-A-DRIVE.json`, no se crea
  `_GESTOR` ni ningún otro fichero en Dropbox: se enseña la franja. Después guarda
  `abiertos`, `archivo` y `entrada` (la raíz de Dropbox) y entra. Hasta señalarlas, la app no deja
  escribir (las carpetas viejas están en «NO USAR»).
- **Casa** (Chromebook, usuario con la cuenta común, versión web, sin Dropbox): la primera vez pide
  señalar las carpetas de Drive como cualquier instalación nueva (en ChromeOS se señalan desde
  Archivos → Google Drive → Mi unidad). Como `rutas.json` dice `nube: "drive"` y en ese navegador no
  hay `entrada`, «Por clasificar» dice la frase de la fila 455 (no lee la raíz de la «asuntos vivos»
  de Drive como entrada). Si el modo «En este ordenador, solo consultar» estaba
  puesto en ese navegador, no se quita solo; Ajustes lo enseña como hoy.
- **Copia sin internet**: pasa a la carpeta copiada en Drive. `js/actualizar-copia.js` y el
  instalador `ABRIR EL GESTOR.html` tienen que funcionar igual allí (abrir con doble clic desde
  Drive, actualizarse sola, `copiaCarpeta` apuntando a la carpeta de Drive). Ojo: en Chrome todas las
  páginas `file://` comparten almacenamiento, así que la copia nueva hereda los handles de la vieja.
  La copia vieja se reconoce por su propia dirección (`location.pathname` contiene «NO USAR», o
  contiene «Dropbox» y `rutas.json` dice `nube: "drive"`): dice «Esta copia es la vieja. Abre la que
  está en Google Drive.» con la ruta nueva para copiarla, y no deja trabajar.
- Poner al día `docs/COPIA-SIN-INTERNET.md` y `docs/CONTEXTO.md` con dónde vive ahora todo.
- Añadir a `docs/COMPROBAR-A-MANO.md` (punto [SOLO FRANCISCO]): «Después de pasar a Drive, abrir el
  asunto de las Elecciones al Consejo Escolar desde el ordenador de Diego y desde casa, y comprobar
  que el marcador de la copia sin internet es el mismo en los dos ordenadores del instituto.»

**Cómo sabré que está bien (fila 459)**
1. En el otro ordenador, al entrar, un aviso pide señalar las carpetas de Drive. Después funciona
   igual, con el mismo marcador.
2. Si se señala una carpeta que no es la del traslado, lo dice y no la acepta.
3. Desde casa, con la versión web, se abren los asuntos, se puede guardar un documento y «Por
   clasificar» dice que solo se ve en el instituto.
4. El botón «Ruta» copia una ruta de Drive, no de Dropbox.
5. Abrir la copia sin internet vieja avisa de que es la vieja y dice dónde está la nueva.

---

## Pasos de Francisco (filas 460 y 461, en la cola como ideas suyas)

- **460** — Antes de pulsar «Pasar a Drive», en los **dos** ordenadores del instituto: instalar
  Google Drive para ordenadores, entrar con la cuenta común, elegir «Duplicar archivos» y poner la
  carpeta de Drive **en el mismo sitio en los dos**: `C:\Google Drive` (fuera de la carpeta de
  usuario; Drive crea dentro «Mi unidad»), para que la dirección sea la misma. Esperar a que termine
  de sincronizar. Después, un viernes por la tarde en el
  instituto, pulsar «Pasar a Drive» con Diego fuera de la app. Necesita las filas 455 a 459 HECHAS.
- **461** — En casa, añadir en el Chromebook un usuario con la cuenta común y abrir con él
  https://asuntos.fmargon.com. Necesita la 460 hecha. Si el Chromebook no deja entrar con la cuenta
  común (puede que la Junta lo impida en un Chromebook personal), decírselo a Claude: no se ha
  comprobado. En el Chromebook Drive no guarda copia completa: abrir el ARCHIVO puede ir más lento.
