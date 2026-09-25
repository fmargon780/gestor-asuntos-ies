# Plantillas y formularios desde el hito: una sola lista

Fila 146 de `docs/COLA.md`. Va **detrás de la 145** (`docs/MESA-DEL-HITO-ENFOCADA.md`): cambia el
contenido del panel «Generar documento ▾» que la 145 pone en la cabecera de la mesa. Si al empezar
la 145 no está HECHA, marca esta fila 146 como BLOQUEADA con ese motivo. Diseño cerrado con
Francisco el 25-sep-2026, a partir de una captura de la zona «Formularios y plantillas de este hito».

Antes de empezar, lee `docs/contexto/HITO-MESA.md` y, de `docs/contexto/HITOS-Y-GUIAS.md`, solo las
secciones «Documentos desde el hito» y «El catálogo de formularios oficiales».

## El problema

Antes de la fila 145, en la zona de plantillas del hito convivían cuatro cosas: el botón «Generar
documento», el plegable «Otras plantillas (N)» (las del tipo entero), el buscador de «Buscar otra
plantilla…» y los formularios oficiales, aparte. Y para asociar o quitar una plantilla o un
formulario a un hito hay que salir a la guía del tipo (cuadro de la guía → paso → «Documentos de
este paso», o el apartado de normativa para los formularios). Francisco lo ve como una carga enorme
para quien lo usa.

## Lo que hay que hacer

### 1. Una sola lista: «Para este hito»

Es lo que se ve al abrir el panel «Generar documento ▾» de la cabecera de la mesa (fila 145).
Sustituye lo que la 145 puso dentro (plantillas del paso, «Otras plantillas», «Buscar otra
plantilla…» y formularios).

- Las plantillas del paso (`plantillasDocumento` del paso por `origenGuia`) y sus formularios
  (`formularios` del paso), **juntos, en una sola lista**, una línea cada uno: etiqueta pequeña
  («DOC» o «FORMULARIO»), el nombre y **un solo botón** a la derecha:
  - Plantilla: «Generar» → `PlantillasDocumento.generar(a, p, 'abierto', { hito: h })`, como hoy.
  - Formulario: lo mismo que hace hoy su enlace en `Formularios.listaHTML` («Abrir impreso» para
    `descarga`/`centro`; para `protocolo`/`seneca`, sin botón, solo su aviso en gris con su `nota`).
- Cada línea lleva una **✕** a la derecha para quitarla (punto 3).
- Sin ninguna, una línea gris: «Este hito no tiene plantillas ni formularios.»
- **Desaparecen** del panel: el plegable «Otras plantillas» (las plantillas del tipo ya no salen
  aquí; se encuentran en el buscador), el buscador abierto de entrada, y el bloque de formularios
  aparte.

### 2. «+ Añadir plantilla o formulario»

Un solo enlace, al pie de la lista.

- Abre, ahí mismo dentro del panel (nunca un cuadro `U.preguntar`), un buscador que busca a la vez
  en **todas las plantillas de documento del centro** (lo de `PlantillaBuscar.filtrar`) y en el
  **catálogo de formularios** (`Formularios.buscar`). Resultados mezclados, con su etiqueta DOC o
  FORMULARIO; 40 como mucho. El foco, en el campo.
- Al pulsar un resultado, en su misma línea salen dos botones:
  - **«Añadir a este hito»**: lo apunta en el paso de la guía (punto 4). Se cierra el buscador y el
    elemento aparece en la lista.
  - **«Usar solo esta vez»**: plantilla → la genera con `{ hito: h }`; formulario → lo abre. No
    apunta nada en la guía.
- Lo que ya está en la lista sale en el buscador marcado «ya está», sin «Añadir a este hito».

### 3. Quitar (✕)

- Lo quita del paso de la guía (punto 4). Sin pregunta de confirmación.
- Aviso verde: «Quitado de la guía de <tipo corto>», con un botón «Deshacer» si el aviso lo admite
  (si hoy no lo admite, sin él: se vuelve a añadir desde el buscador).
- Los documentos ya generados no se tocan.

### 4. Se guarda en la guía del tipo

Como «+ Añadir un paso a la guía del tipo» (fila 120): con `GuiasDelCentro.cambiarPasos(tipo, fn)`
(`js/guias-enganche.js`), que relee `guias.json`, cambia una copia y guarda. Se añade o quita el id
en `plantillasDocumento` o la clave en `formularios` del paso de `origenGuia`. Como el hito lee su
paso en vivo, el cambio vale para todos los asuntos de ese tipo, abiertos o no. La biblioteca de
hitos no se toca.

- Aviso verde al añadir: «Añadido a la guía de <tipo corto>». Si falla, rojo con
  `U.mensajeDeError`, y la lista queda como estaba.
- **Cuándo no se puede guardar en la guía**: hito sin `origenGuia` (añadido a mano), paso que ya no
  está en la guía, paso-pregunta, o modo consulta. Entonces no salen ni la ✕ ni «Añadir a este
  hito»; sí «Usar solo esta vez». Un formulario en un paso que vive dentro de una opción de una
  pregunta tampoco se puede guardar (`Guias.normalizar` lo quita: los formularios solo van en el
  paso de arriba): en ese caso, para formularios, solo «Usar solo esta vez».

### 5. Lo que no cambia

- El cuadro de la guía sigue pudiendo asociar plantillas y formularios como hoy («Documentos de
  este paso» y normativa). Es el mismo dato.
- Las plantillas del tipo siguen en «Generar documento» de la cabecera del asunto y en la ficha.
- El marcado automático del guion al generar, como hoy.

## Ficheros que hay que tocar

- El panel «Generar documento ▾» que deja la fila 145 (`js/hito-mesa.js` o `js/hito-mesa-paneles.js`).
- `js/hito-mesa-documentos.js` (lo que hoy pinta plantillas y formularios).
- `js/plantilla-buscar.js` (buscar también en formularios; resultados con etiqueta y los dos botones).
- `js/formularios.js` solo si hace falta sacar el botón de un formulario suelto (está a 434 líneas).
- Un fichero nuevo si hace falta para guardar en la guía (`js/hito-mesa-asociar.js`), cargado en
  `index.html` después de `js/hito-mesa.js` y apuntado en `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`.
- `css/hito-mesa.css`.
- Documentos: `docs/contexto/HITO-MESA.md` (sustituir «Buscar otra plantilla…» por esta lista),
  `docs/CONTEXTO-CORTO.md` (en la línea de «Hitos», lo que diga de plantillas y formularios pasa a
  «plantillas y formularios en una lista; se añaden o quitan desde el hito y quedan en la guía»),
  `docs/HISTORIA.md`.

## La prueba

`pruebas/plantillas-desde-el-hito.mjs` (nueva), con el disco de mentira: un hito con una plantilla
y un formulario en su paso.

1. El panel enseña los dos en una sola lista, cada uno con un botón y una ✕; no hay «Otras plantillas».
2. Buscar una plantilla de otro tipo y «Añadir a este hito»: queda en `guias.json`, en el paso; otro
   asunto abierto del mismo tipo la ve en su hito.
3. ✕ sobre el formulario: sale de `guias.json`.
4. «Usar solo esta vez» genera la plantilla y `guias.json` no cambia.
5. Un hito añadido a mano: sin ✕ ni «Añadir a este hito».

Después, `npm test` completo en verde.

## Cómo trabajar

- **No leas el repositorio entero**: con los documentos de arriba y los ficheros de la lista basta.
- **Cambios quirúrgicos.** Ningún fichero de `js/` pasa de 600 líneas.
- **Sube directamente a `main`, sin abrir pull request** (si la sesión lo tiene forzado, pull request
  y fusión automática, según la nota de `docs/COLA.md`). Como mucho dos subidas (regla 13).
- En el mensaje a Francisco, una frase: cómo se añade o quita una plantilla o un formulario desde el hito.
