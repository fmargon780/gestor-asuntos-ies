# Editor de la guía claro y fácil (tema 448, filas 463, 464 y 465)

Diseñado con Francisco el 25-oct-2026. Junta la idea 442. Sigue el método de `docs/METODO-FICHA.md`:
**lo que no está en la ficha no se programa**, y si aparece algo que la ficha no cubre y cambia lo
que ve o hace la usuaria, se para y se pregunta (Parte 2 de ese documento).

Dibujo de cómo queda la pantalla: `docs/EDITOR-DE-LA-GUIA-CLARO-dibujo.png` (los títulos de hitos y
tareas del dibujo son inventados; solo vale la colocación). **Si el dibujo y el texto no coinciden en
un detalle (rótulos, palabras de los resúmenes), manda el texto.**

## De dónde sale

Aviso de Francisco del 23-oct-2026 (idea 442), copiado tal cual:

> la vista en la que configuramos la guía es un infierno visual. Requiere de una revisión profunda,
> tanto desde el punto de vista visual como operativo. Por ejemplo, no veo como asociar a una tarea
> dentro de una hito una plantilla de correo.

Su captura era la ventana «Cambiar en la guía de EXPULSIÓN DEL CENTRO» (la de «⋮ → Abrir en la
guía»): una columna de casillas y desplegables sin rótulo. La plantilla de correo **sí estaba** (el
tercer desplegable de «Detalles:», con «Notificación Sanción Tutor/a y Familia (Medida
disciplinaria…)»), pero nada decía que fuera la plantilla. Lo que quería hacer era **cambiar el
texto de esa plantilla**, y desde la guía no se puede: hoy se cambia en Ajustes → tarjeta del tipo →
«Plantillas de correo y de Séneca» → «Cambiar».

Problemas que Francisco aceptó como base (revisión del 25-oct-2026 en la demostración, tipo BAJA
MEDICA):

1. Desplegables sin rótulo (en la tarea: destinatario, vía y plantilla; en el plazo: unidad y «desde»).
2. La plantilla de correo no se puede abrir desde la guía.
3. Dos maneras de mandar un correo que se confunden: la tarea «Comunicar» y la casilla del hito
   «Al terminar este hito, avisar a quien lo pide».
4. El «desde» del plazo es un desplegable tan estrecho que no deja ver lo elegido.
5. La barra «N / Viñetas / Enlace / Quitar formato» está arriba del todo, lejos de la explicación
   del hito, que es lo que formatea.
6. «Obligatorio» y «📎 Un documento / ✎ Un dato» se ven aunque «Hay que reunirlo» esté sin marcar.
7. Dos casillas «es una pregunta» casi iguales (la del hito y la de la tarea).
8. «Más ajustes» mezcla todo, sin títulos.
9. Las tareas, lo más usado, están escondidas tras «▸ Tareas de este hito».
10. Una columna estrecha y muy larga: un hito con una tarea abierta ocupa más de dos pantallas.

## Ficha del cambio

### Qué verá y hará la usuaria cuando esté terminado

**Parte A (fila 463)**
- A1. La ventana de la guía ocupa todo el ancho de la pantalla (no la caja mediana de hoy) y tiene
  dos columnas. Arriba, el título «Guía de <TIPO>» y, a la derecha del título, «Ver mapa» y «+ Traer
  un hito de otro tipo». Abajo, «Cancelar» y «Guardar», como hoy.
- A2. **Columna izquierda**: la lista de hitos del nivel que se está viendo, uno por recuadro: número
  y título en la primera línea; debajo, en gris pequeño, el responsable y cuántas tareas tiene
  («Administración · 3 tareas»). Las marcas que hoy salen en la línea plegada del hito
  (pregunta, solo informativo, espera…) siguen saliendo en esa línea gris. El hito elegido va
  resaltado. Al final, «+ Añadir un hito» (añade al final del nivel y lo deja elegido, con el cursor
  en su título). Al abrir la ventana queda elegido el primer hito, salvo que se abra hacia un hito
  concreto (ver «Qué más se ve afectado»). Si la guía está vacía, la columna derecha dice «Añade el
  primer hito» y no enseña nada más.
- A3. **Columna derecha**: el hito elegido. Pulsar otro hito de la izquierda cambia la derecha sin
  perder lo escrito en el anterior. Cada columna se desplaza por su cuenta; la ventana no.
- A4. Primer apartado, con título **«Datos del hito»**, todo en una fila (bajando a dos si no cabe),
  cada cosa con su rótulo encima: «Título del hito», «Responsable», «A quién le toca», y el plazo en
  tres piezas, cada una con su rótulo: «Plazo (días)», «Cómo se cuentan» (Días hábiles, lectivos,
  naturales o Meses) y «Desde» (el hito desde el que cuenta); y a la derecha ↑, ↓ y «Quitar» (mueven o quitan este hito). «A quién le toca» se ve
  siempre (hoy solo se ve con «Más ajustes» abierto). El desplegable «desde» es lo bastante ancho
  para leer entero el título del hito elegido.
- A5. Segundo apartado, con título **«Tareas de este hito (N)»**, siempre a la vista, sin desplegar
  nada. En la parte A las tareas se ven con el editor de tareas de hoy (lo cambia la parte B). Un
  hito que es pregunta no tiene tareas (como hoy): en él este apartado no sale.
- A6. Debajo, apartados **plegados**, cada uno con título y, en la misma línea, un resumen en gris
  de lo que tiene activado (como la línea gris de hoy de «Más ajustes»); si no tiene nada, sin
  resumen. En este orden:
  1. **«Explicación del hito»**: el recuadro de texto con formato, con la barra «N / Viñetas /
     Enlace / Quitar formato» justo encima del recuadro (deja de estar arriba del todo).
  2. **«Al terminar este hito»**: la casilla «Avisar a quien lo pide» y su «Con la plantilla:».
     Debajo, en gris, una frase: «Manda un aviso a quien encargó el asunto cuando este hito se
     marca hecho. Para escribir a otras personas durante el hito, usa una tarea «Comunicar».»
     Funciona igual que hoy. Resumen en la línea plegada: «avisar a quien lo pide: sí» o «: no».
  3. **«Documentos de este hito»**: «Recibe varios documentos» (con su nota de hoy), «Texto para los
     documentos de este hito» con «Insertar hueco» y «Tipo de documento que suele salir de aquí».
  4. **«Normativa e impresos»**: las referencias de normativa y los impresos oficiales, como hoy
     (lo cambia la parte C).
  5. **«Otros»**: «Solo informativo: se ve, pero no reclama trabajo» y la casilla que convierte el
     hito en pregunta, que pasa a decir **«Este hito es una pregunta: el trámite sigue por un camino
     o por otro»**.
  Desaparece el botón «Más ajustes»: sus cosas quedan repartidas en estos apartados.
  «Ver mapa» enseña el mapa en la columna derecha, en lugar del hito, con «← Volver al hito»
  arriba; pulsar un hito del mapa lo elige y vuelve a enseñarlo.
- A7. Si el hito elegido es una pregunta, sus respuestas y los hitos de cada respuesta salen en la
  columna derecha, debajo de «Datos del hito», como hoy (con el editor de opciones de hoy). A un hito
  de dentro que a su vez es pregunta se entra con «Entrar», como hoy: la columna izquierda pasa a
  enseñar los hitos de ese nivel y, encima de ella, el camino («Guía › ¿…? › Respuesta») con
  «← Volver».
- A8. Los hitos de dentro de cada respuesta (decisión de Francisco del 25-oct-2026) llevan el
  mismo aspecto nuevo que los demás: su título con rótulo, «Tareas de este hito (N)» a la vista y
  los apartados con título que les correspondan (hoy solo tienen explicación y la casilla de
  pregunta: «Explicación del hito» plegado y «Otros» con «Este hito es una pregunta: el trámite sigue
  por un camino o por otro»). Pierden también su botón «Más ajustes». No ganan ajustes que hoy no
  tienen. En la parte B, sus tareas también van en una línea.

**Parte B (fila 464)**
- B1. En «Tareas de este hito», cada tarea ocupa **una línea**: a la izquierda su texto; a la
  derecha, en gris, lo que hace («Comunicar · Tutor/a del grupo · por correo», «Generar un
  documento», «Sin acción»…) y un «▸».
- B2. Al pulsar la línea, la tarea se abre ahí mismo (las demás siguen en una línea; solo una
  abierta a la vez). Abierta lleva: el texto de la tarea (campo con rótulo «Texto de la tarea»),
  ↑, ↓ y «Quitar» en la misma línea que el texto, y debajo, con rótulo encima de cada uno:
  **«Qué se hace»** (Sin acción, Generar un documento, Registrar un documento, Comunicar, Añadir un
  documento). Si es «Comunicar», además **«A quién»**, **«Por dónde»** y **«Plantilla de correo»**
  (los tres desplegables de hoy, mismos valores). Los desplegables que hoy acompañan a las otras
  acciones se quedan, cada uno con su rótulo: «Plantilla de documento» en «Generar un documento» y
  «Entrada o salida» en «Registrar un documento».
  Una tarea que es pregunta: en su línea, a la derecha, «Pregunta · N respuestas»; abierta, enseña
  sus respuestas y las tareas de cada una como hoy (sin «Qué se hace»).
- B3. Debajo, plegado, **«▸ Más de esta tarea»** con: «Explicación corta», «Normativa: la cita»,
  «Enlace al BOE o al BOJA», «Hay que reunirlo» y **«Esta tarea es una pregunta: lo que hay que
  hacer depende de la respuesta»**. Al pulsar «Más de esta tarea» se despliega dentro de la tarea.
- B4. «Obligatorio» y el desplegable «📎 Un documento / ✎ Un dato» **solo salen** cuando «Hay que
  reunirlo» está marcado. Al desmarcarlo se esconden (lo que tuvieran guardado no se borra).
- B5. «+ Añadir una tarea» al final de la lista: añade una tarea abierta, con el cursor en su texto.
- B6. Desde un asunto, en el hito, «⋮» de una tarea → **«Abrir en la guía»** abre este editor
  completo (no la ventana pequeña «Cambiar en la guía de…» de hoy), con ese hito elegido y esa
  tarea abierta y resaltada. «Guardar» guarda la guía y vuelve al asunto, como hoy. El aviso de hoy
  («Vale para todos los asuntos de…») sale arriba del editor, y «Abrir en la guía» sigue apagado en
  los mismos casos que hoy.

**Parte C (fila 465)**
- C1. En una tarea con «Plantilla de correo» elegida, a la derecha del desplegable, un botón
  **«Ver y cambiar el texto»**. Si no hay plantilla elegida («Sin plantilla fija»), el botón no sale.
- C2. Al pulsarlo, la columna derecha enseña el editor de plantillas de siempre (los mismos campos
  y huecos que Ajustes → «Plantillas de correo y de Séneca» → «Cambiar»), con «← Volver a la guía»
  arriba. Ahí se ve y se cambia el texto. «Guardar la plantilla» la guarda y vuelve a la guía, al
  mismo hito con la misma tarea abierta; «← Volver a la guía» vuelve sin guardar la plantilla. Lo
  escrito en la guía mientras tanto no se pierde. La plantilla se guarda en ese momento, aunque
  luego se pulse «Cancelar» en la guía. Se puede cambiar desde aquí cualquier plantilla que hoy se
  pueda cambiar en Ajustes, con las mismas reglas y avisos (también las fuera de uso).
- C3. Lo mismo para «Con la plantilla:» del apartado «Al terminar este hito»: botón «Ver y cambiar
  el texto» al lado, con el mismo funcionamiento.
- C4. En «Normativa e impresos», de los impresos oficiales **solo se ven los marcados** en este hito
  (cada uno con su casilla marcada, para poder quitarlo). Encima, el buscador «Buscar un impreso…»:
  al escribir salen los que coinciden, sin marcar, y marcar uno lo añade a los de este hito. Con el
  buscador vacío no sale la lista larga. La línea plegada dice cuántos hay («1 impreso marcado»).

### Qué NO cambia
- Las guías ya escritas: no se toca ningún dato guardado (`guias.json` ni hitos de asuntos). Solo
  cambia cómo se ven y se editan.
- Lo que hace cada ajuste, cada tarea y cada aviso: mismas opciones y mismos valores.
- La casilla «Al terminar este hito, avisar a quien lo pide»: funciona igual; solo cambia de sitio.
- El editor de plantillas (sus campos, huecos y forma de guardar): es el mismo, solo se abre
  también desde la guía.
- Crear o cambiar un hito desde un asunto («Crear este hito», «Cambiar», «Borrar»), el cuadro
  «¿Dónde se guarda?», Nuevo asunto, unir tipos, tipos parecidos, el aviso «N por configurar» de
  Ajustes y «Al terminar el asunto» del tipo.
- El mapa de la guía (su dibujo).

### Qué NO se hace en esta tarea
- No se crean plantillas nuevas desde la guía (sin plantilla elegida no hay botón).
- No se cambia el funcionamiento de las preguntas anidadas (respuestas, «Entrar», «← Volver»):
  solo se colocan en las columnas y toman el aspecto nuevo (A7, A8).
- No se cambia el nombre «pregunta» de los hitos y tareas que dividen el trámite en caminos.
- No se juntan en una sola las dos maneras de mandar correo.
- No se cambia la ventana de crear o cambiar un hito desde un asunto.
- No se toca la versión para móvil más allá de que no se rompa (en pantalla estrecha, las dos
  columnas pueden ir una encima de otra).

### Qué más se ve afectado (y qué pasa con cada cosa) — confirmado por Francisco el 25-oct-2026
1. Ajustes → tarjeta del tipo → «Cambiar la guía» / «Escribir la guía»
   (`js/ajustes-tipo.js`, `GuiasDelCentro.escribir`): abre el editor nuevo. — Parte A.
2. «Ver mapa», en Ajustes (`GuiasMapa.abrirEnAjustes` → `escribir(tipo,{irA})`) y dentro del
   editor (`#guia-ver-mapa`, `irAPaso`): al pulsar un hito del mapa queda elegido en la columna
   izquierda (y, si está dentro de una respuesta, se entra en su nivel). — Parte A.
3. Pantalla de plantillas, enlace a un hito (`js/plantillas-pantalla.js`, `.pt-hito`): abre el
   editor nuevo con ese hito elegido. — Parte A.
4. Ficha de un asunto, botón de la guía (`js/ficha-bloques.js`, `#ficha-guia-nota`) y «⋮ → Cambiar
   la guía…» de la mesa del hito (`js/hito-mesa.js`): abren el editor nuevo, con el primer hito
   elegido (como hoy, no pasan hito). — Parte A.
5. «⋮ → Abrir en la guía» de una tarea (`js/hito-mesa-tarea-menu.js` →
   `HitoMesaGuion.cambiarGuionDelPaso` en `js/hito-mesa-guion.js`): abre el editor nuevo con esa
   tarea abierta; la ventana pequeña desaparece. — Parte B.
6. «+ Traer un hito de otro tipo» (`js/guias-biblioteca.js`, panel dentro del mismo cuadro): igual
   que hoy, dentro de la ventana (el panel puede ocupar la columna derecha). — Parte A.
7. No cambian: crear o cambiar un hito desde un asunto (`js/hitos-desde-el-asunto*.js`), «¿Dónde se
   guarda?» (`js/donde-se-guarda-tareas.js`), Nuevo asunto (`pintarGuiaNuevo`), unir tipos y tipos
   parecidos, el aviso «N por configurar» (abre la sección «Guía» de la tarjeta, no el editor), el
   buscador de Ajustes y «Al terminar el asunto» del tipo (`js/ajustes-tipo-al-terminar.js`).

### Lo que Claude había supuesto (aceptado por Francisco el 25-oct-2026)
1. Las guías ya escritas no cambian; solo cómo se ven y se editan → aceptada.
2. Si un hito es una pregunta, sus respuestas y los hitos de cada respuesta salen en la columna
   derecha, como hoy; a un hito de dentro se entra con «Entrar» y se sale con «← Volver» → aceptada.
3. «Obligatorio» y «Un documento / Un dato» solo salen al marcar «Hay que reunirlo» → aceptada.
4. Las dos casillas de pregunta se distinguen: «Esta tarea es una pregunta…» y «Este hito es una
   pregunta…» → aceptada.
5. La barra «N / Viñetas / Enlace» va justo encima de la explicación del hito → aceptada.
6. El «desde» del plazo es lo bastante ancho para leer el hito elegido → aceptada.
7. «Ver y cambiar el texto» solo sale si la tarea tiene una plantilla elegida → aceptada.
8. El editor de plantillas se abre dentro de la misma ventana, en la columna derecha, con «← Volver
   a la guía» (la app no deja abrir una ventana encima de otra sin perder lo escrito: `U.preguntar`
   usa una sola capa `#capa`) → aceptada (Francisco aprobó el dibujo con esta explicación).

### Decisiones de Francisco (25-oct-2026)
- Ventana a todo lo ancho en dos columnas: hitos a la izquierda, el hito elegido a la derecha con
  las tareas a la vista y el resto en apartados con título.
- Cada tarea en una línea, que se abre al pulsarla con sus datos rotulados.
- El texto de la plantilla se ve y se cambia desde la tarea con «Ver y cambiar el texto», usando el
  editor de plantillas de siempre (un solo editor en toda la app).
- Las dos maneras de mandar correo se quedan; la casilla de aviso va a su apartado «Al terminar este
  hito», con una frase que diga a quién avisa.
- «Abrir en la guía» desde un asunto lleva al editor nuevo con la tarea abierta.
- En normativa, solo los impresos marcados; los demás, con el buscador.
- Los hitos de dentro de cada respuesta llevan el mismo aspecto nuevo.

### Ejemplo real que ha dado Francisco
- Guía de **EXPULSIÓN DEL CENTRO**, hito de título parecido a «Comunicación a la familia y tutor»
  (Francisco no recuerda el título exacto), tarea «Se envía comunicación por mail al tutor de la
  unidad y a los tutores…», con la plantilla «Notificación Sanción Tutor/a y Familia (Medida
  disciplinaria…)». Lo que quería hacer: cambiar el texto de esa plantilla desde la guía.
- Los datos reales están en el Dropbox del centro, no en el repositorio: las comprobaciones con este
  ejemplo son **[SOLO FRANCISCO]** y se copian a `docs/COMPROBAR-A-MANO.md`. En la demostración
  (`?demo=1&auto=1`) se usa el equivalente: tipo **BAJA MEDICA**, hito «1 Recibir el parte de baja»,
  tarea «Acusar recibo del parte» con plantilla «Acuse de recibo del parte» (es el único tipo de la
  demostración con una tarea «Comunicar» con plantilla), y el asunto de BAJA MEDICA de la
  demostración (`js/demo/datos.js`, el que está en «Hito 2 de 3 · Esperar el parte de alta») para
  «Abrir en la guía».

### Cómo se comprueba («Cómo sabré que está bien», acordado con Francisco)

**Parte A (fila 463)**
1. La ventana ocupa todo el ancho: hitos a la izquierda, el hito elegido a la derecha. (A1, A2, A3)
2. Al pulsar otro hito de la izquierda, cambia la derecha sin bajar la página. (A3)
3. Las tareas del hito se ven sin desplegar nada. (A5)
4. Cada desplegable del hito tiene su rótulo, y el «desde» del plazo se lee entero. (A4)
Además, sin que lo mire Francisco: lo escrito en un hito no se pierde al pulsar otro y se guarda con
«Guardar»; los apartados de A6 tienen su título y su resumen; «Ver mapa» y el enlace de la pantalla
de plantillas abren con el hito correcto elegido, y el botón de la ficha abre el editor nuevo; un hito-pregunta enseña sus
respuestas y «Entrar»/«← Volver» funcionan (A7).
[SOLO FRANCISCO] Lo mismo en la guía real de EXPULSIÓN DEL CENTRO.

**Parte B (fila 464)**
1. Cada tarea ocupa una línea; al pulsarla se abre con «Qué se hace», «A quién», «Por dónde» y
   «Plantilla de correo». (B1, B2)
2. «Obligatorio» solo sale al marcar «Hay que reunirlo». (B4)
3. Desde un asunto, «⋮ → Abrir en la guía» abre el editor con esa tarea abierta. (B6) En la
   demostración, con el asunto de BAJA MEDICA; [SOLO FRANCISCO] con un asunto real de expulsión.
Además: «Más de esta tarea» y «Esta tarea es una pregunta…» (B3), «+ Añadir una tarea» (B5).

**Parte C (fila 465)**
1. En la tarea del correo, «Ver y cambiar el texto» enseña el texto de su plantilla. (C1, C2) En la
   demostración, «Acuse de recibo del parte»; [SOLO FRANCISCO] «Notificación Sanción Tutor/a y
   Familia» en EXPULSIÓN DEL CENTRO.
2. Cambias una palabra, guardas y vuelves a la guía donde estabas; el cambio queda en la plantilla
   (se ve también en Ajustes → «Plantillas de correo y de Séneca»). (C2)
3. En «Normativa e impresos» solo salen los impresos marcados, y el buscador encuentra los demás. (C4)
Además: el botón también junto a «Con la plantilla:» del aviso (C3); sin plantilla, no hay botón (C1).

### Respuestas de Francisco durante el trabajo
- (las apunta Claude Code si tiene que preguntarle algo)

## Para Claude Code

Reglas comunes de las tres filas: las de `docs/COLA.md` y `CLAUDE.md` (rama `fila-<nº>`, revisor en
local, una publicación por fila, novedad en `js/novedades.js` si cambia algo visible). Además:

- **No leas el repositorio entero.** Empieza por los ficheros de la lista de cada parte.
- **Cambios quirúrgicos**: no reescribas ficheros enteros. Si un fichero que tocas pasa de unas 400
  líneas, pártelo (`js/guias-editor.js` tiene 576 hoy: en la parte A, saca lo de la nueva
  disposición a un fichero propio, por ejemplo `js/guias-editor-columnas.js`).
- **Una sola pasada de pruebas al final** de cada fila (más la prueba nueva de la fila).
- **No cambia la forma de guardar las guías.** `recoger()` de `js/guias-editor.js` lee el DOM: si
  cambian los contenedores, adapta `recoger()` para que guarde exactamente lo mismo que hoy. Prueba
  de oro: abrir y guardar sin tocar nada deja `guias.json` igual, byte a byte, en la demostración.
  El editor guarda todos los hitos, no solo el elegido: los no elegidos deben conservar lo suyo
  (se puede pintar cada hito en la derecha y esconder los no elegidos, o guardar en memoria al
  cambiar de hito; decide tú, sin cambiar lo guardado).
- **Pruebas que dependen del HTML del editor** y que habrá que adaptar (no borrar comprobaciones,
  solo cambiar selectores o pasos): `guia-en-acordeon.mjs` (la que más; el acordeón de un hito
  abierto a la vez pasa a ser «un hito elegido a la vez»), `preguntas-anidadas.mjs`,
  `traer-hito-de-otro-tipo.mjs`, `opciones.mjs`, `guias.mjs`, `personas-archivo-y-menu.mjs`,
  `texto-del-documento-propuesto.mjs`, `responsable-organismo.mjs`, `documentos-desde-el-hito.mjs`,
  `donde-se-guarda.mjs`, `formularios.mjs`, `el-hito-es-el-estado.mjs`; y del cuadro de «Abrir en
  la guía» (parte B): `mesa-comunicar-del-paso-y-guion.mjs`, `correo-al-tutor.mjs`,
  `tareas-del-hito-sencillas.mjs`, `menu-en-las-preguntas-del-hito.mjs`. Si una comprobación vieja
  contradice la ficha (por ejemplo, que «A quién le toca» solo salga con «Más ajustes»), manda la
  ficha: cambia la comprobación y apúntalo en la nota de la fila.
- Textos en pantalla según `docs/VOCABULARIO-EN-PANTALLA.md`.

### Fila 463 — Parte A

Hacer A1 a A7. Ficheros: `js/guias-editor.js` (monta el cuadro con `U.preguntar` y clase
`cuadro-medio`: pasa a una clase de ventana a todo lo ancho; `pintar`, `recoger`, `irAPaso`),
`js/guias-plegado.js` (acordeón → hito elegido), `js/guias-mas-ajustes.js` (desaparece el botón;
los ajustes pasan a apartados), `js/guias-paso-bloques.js` (reparto en apartados y frase del aviso),
`js/guias-barra.js` (barra junto a la explicación), `js/guias-plazo.js` y `js/guias-toca.js`
(rótulos, «desde» ancho, «A quién le toca» siempre visible), `js/guias-niveles.js` (camino encima de
la columna izquierda), `js/guias-opciones-editor.js` (respuestas en la columna derecha),
`js/guias-biblioteca.js` (panel de traer dentro de la nueva disposición), `js/guias-mapa.js`
(`irAPaso` elige el hito), el CSS del editor, `js/novedades.js`. Prueba nueva:
`pruebas/editor-de-la-guia-columnas.mjs` (puntos 1-4 de «Cómo se comprueba» de la parte A y la
prueba de oro de guardar sin cambios).

### Fila 464 — Parte B (empezar con la 463 HECHA)

Hacer B1 a B6. Ficheros: `js/guias-guion.js` (tarea en una línea, apertura, rótulos, «Más de esta
tarea», casillas que dependen de «Hay que reunirlo», texto de la casilla de pregunta),
`js/hito-mesa-guion.js` (`cambiarGuionDelPaso` deja de montar su cuadro: abre
`GuiasDelCentro.escribir(tipo, {irA: idDelHito, tarea: idDeLaTarea})` o lo equivalente, y al
guardar vuelve al asunto como hoy; si el cuadro viejo ya no lo usa nadie, se quita), 
`js/hito-mesa-tarea-menu.js` si hace falta, `js/guias-editor.js` (abrir con una tarea abierta),
CSS, `js/novedades.js`. Prueba nueva: `pruebas/editor-de-la-guia-tareas.mjs` (puntos 1-3 de la
parte B).

### Fila 465 — Parte C (empezar con la 464 HECHA)

Hacer C1 a C4. Ficheros: `js/guias-guion.js` (botón junto a «Plantilla de correo»),
`js/guias-paso-bloques.js` (botón junto a «Con la plantilla:»), `js/plantillas-ajustes.js`
(`abrirCuadroDePlantilla` usa `U.preguntar` y cerraría la guía: hace falta una forma de pintar su
editor dentro de un contenedor dado —la columna derecha— con «Guardar la plantilla» y «← Volver a la
guía», sin duplicar el editor; el de Ajustes sigue abriéndose como hoy), `js/formularios.js`
(`bloqueEmbebidoHTML` y `engancharBuscador`: solo marcados + buscador), `js/hitos-normativa.js` si
hace falta, CSS, `js/novedades.js`. Prueba nueva: `pruebas/editor-de-la-guia-plantilla.mjs` (puntos
1-3 de la parte C y que lo escrito en la guía sigue ahí al volver).
