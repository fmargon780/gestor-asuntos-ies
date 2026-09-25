# La mesa del hito, enfocada

Fila 145 de `docs/COLA.md`. Diseño cerrado con Francisco el 25-sep-2026, a partir de una captura de
la mesa del hito «Recoger la solicitud» (tipo Convalidación o exención) y de un ejemplo en HTML que
aprobó. **Cambia cómo se ve la mesa, no lo que hace**: cada botón sigue llamando a lo mismo que hoy.

Antes de empezar, lee `docs/contexto/HITO-MESA.md` (y nada más del repositorio que no necesites).

## El problema

La mesa enseña todo a la vez y con el mismo peso: tres columnas iguales, unos quince botones y
enlaces (cinco «No aplica», dos «Añadir documento», «Comunicar», «Preparar correo», «Mensaje de
Séneca», «Pedir lo que falta», «Generar documento», «Añadir nota», «Cambiar la guía», dos «+ Añadir
un paso…») y huecos vacíos que ocupan sitio. El ojo no sabe por dónde empezar.

La idea: **el guion manda**. Al abrir un hito se ve de un vistazo qué falta y con qué botón se hace.

## Lo que hay que hacer

### 1. La tira de hitos

- Ocupa todo el ancho, en celdas iguales (el texto largo se corta con «…» y va entero en `title`).
- El hito abierto, con fondo azul claro y una raya azul abajo. Los hechos, en verde con ✓.
- Sigue saltando a la mesa del hito que se pulsa, como hoy.

### 2. La cabecera del hito (una línea)

- Título grande. A su lado, en texto pequeño y gris, «Sin plazo · Sin responsable» (o «Vence el
  15-oct · quedan N días hábiles · Secretaría»). **Siguen siendo pulsables** con los mismos
  `FichaMenus` de hoy (estado, plazo, responsable), pero sin forma de etiqueta de color. El estado
  («Hecho») sí se queda como etiqueta verde, porque es lo que más importa.
- A la derecha, cuatro botones y nada más:
  1. **«Generar documento ▾»**: abre un panel desplegable debajo del botón con las plantillas del
     paso, «Otras plantillas» (las del tipo), «Buscar otra plantilla…» y los formularios oficiales.
     Es lo que hoy está en la columna del centro («Formularios y plantillas de este hito»); se mueve
     aquí, con las mismas funciones (`PlantillasDocumento`, `PlantillaBuscar`, `Formularios`).
  2. **«Comunicar ▾»**: panel desplegable con los chips de destinatarios (premarcados como hoy),
     «Preparar correo», «Mensaje de Séneca» y, **solo si falta algo**, «Pedir lo que falta». Es lo que
     hoy está en la tercera columna (`js/hito-mesa-comunicar.js`); se mueve aquí sin cambiar su lógica.
  3. **«Marcar como hecho»** (botón principal, azul). Con el hito hecho, «Hecho ✓ (desmarcar)», como hoy.
  4. **«···»**: el menú de siempre, que suma «Cambiar la guía…» y «+ Añadir un paso a la guía del
     tipo» (lo que hoy hay debajo del guion y al pie de la mesa).
- Los dos paneles desplegables se cierran con Escape (antes que la mesa), al pulsar fuera o al abrir
  el otro. Uno solo abierto a la vez. **No son un cuadro de diálogo** (`U.preguntar`): van dentro de
  la página, para no chocar con el cuadro único.

### 3. Dos zonas en vez de tres

- Rejilla `2fr 1fr`, **ocupando todo el ancho disponible** (Francisco pide aprovechar el ancho: sin
  márgenes blancos a los lados ni ancho máximo).
- **Izquierda: «Qué hay que hacer»**, el guion (`js/hito-mesa-guion.js`).
- **Derecha, con fondo algo más gris: lo que ya existe.** En este orden:
  1. «Documentos del hito»: la tabla de hoy (`js/hito-mesa-documentos.js`), con sus gemelos, su
     selección de varios y su barra. Sin documentos, una sola línea gris: «Ninguno todavía.» y, en
     pequeño, «Suelta aquí un documento del ordenador» (la zona de soltar sigue funcionando sobre toda
     la columna derecha, sin recuadro grande).
  2. «Normativa» del hito, plegada, con su número: «Normativa (2)». Sin normativa, no sale.
  3. «Notas»: la caja de escribir, de una línea que crece al escribir. Sin el botón «Añadir nota»:
     Intro guarda, como hoy (el texto de ayuda lo dice). Debajo, las notas del hito.
  4. «Historia»: lo automático, lo más nuevo arriba, en texto pequeño.
- Por debajo de 1100 px de ancho, o con el visor o el lector abiertos, la derecha baja debajo de la
  izquierda (como hoy la tercera columna).

### 4. El guion

- Barra de progreso y «N de M» en la misma línea que el título «Qué hay que hacer».
- **Pasos hechos**: una sola línea, en gris y tachados, casilla verde. Sin explicación ni botones.
- **El siguiente paso**: el primero que se ve sin hacer y sin «No aplica». Fondo ámbar claro con
  borde ámbar, título un poco más grande, su explicación debajo y **su botón de acción como botón
  principal** (azul), a la derecha del renglón. Si su acción es añadir un documento o es una línea
  📎 de reunir, lleva debajo una zona de soltar pequeña («Suelta aquí el PDF, o pulsa el botón»),
  que hace lo mismo que la de la columna derecha pero asociado a ese paso.
- **Los demás pasos pendientes**: una línea, con la explicación en gris pequeño debajo, y su botón de
  acción (si lo tiene) como botón normal, blanco.
- Con el hito ya hecho, no se resalta ningún paso.
- **«No aplica»**: solo se ve al pasar el ratón por el paso o cuando el paso tiene el foco del
  teclado (`:hover`, `:focus-within`). En pantallas táctiles (`@media (hover: none)`), siempre visible.
- 📎 / ✎ y «obligatorio» (en rojo, pequeño), como hoy. La caja de un dato ✎, como hoy.
- Las preguntas del guion y los hitos-pregunta, como hoy: solo cambia el aspecto de las líneas.
- «+ Añadir un paso solo para este asunto»: se queda al pie del guion, como enlace pequeño y gris.
  «+ Añadir un paso a la guía del tipo» se va al menú «···» (punto 2).
- El pie «Cambiar la guía — Vale para todos los asuntos…» desaparece de la mesa (va al menú «···»,
  con esa misma advertencia en el cuadro que abre).

### 5. Lo que no cambia

- Ninguna función de guardado, marcado automático del guion, comunicar, generar ni registrar.
- Los datos (`guias.json`, `hitos.json`): no se tocan.
- El modo consulta (compañero dentro): los botones nuevos se apagan igual que los de hoy.

## Ficheros que hay que tocar

- `js/hito-mesa.js` (cabecera, tira, paneles «Generar documento ▾» y «Comunicar ▾», menú «···»).
- `js/hito-mesa-guion.js` (aspecto de los pasos, el siguiente resaltado, «No aplica» al pasar).
- `js/hito-mesa-documentos.js` (vacío en una línea, zona de soltar sin recuadro; las plantillas y
  formularios salen de aquí hacia el panel de la cabecera).
- `js/hito-mesa-comunicar.js` (pintar dentro del panel desplegable en vez de en la columna).
- `js/hitos-panel-lista.js` (`cuerpoDeHito`: dos zonas en vez de tres).
- `js/usabilidad.js` (Escape cierra primero un panel desplegable abierto).
- `css/hito-mesa.css`.
- Si algún fichero pasa de 600 líneas, se parte (regla de siempre); si hace falta, un
  `js/hito-mesa-paneles.js` nuevo para los dos desplegables, cargado en `index.html` justo después
  de `js/hito-mesa.js`, y apuntado en `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`.
- Pruebas: ajustar `pruebas/hito-mesa.mjs` y `pruebas/cabecera-compacta.mjs` a la mesa nueva, y
  una nueva `pruebas/mesa-del-hito-enfocada.mjs`.
- Documentos: `docs/contexto/HITO-MESA.md` (sustituir «Las tres columnas» por las dos zonas y los
  dos desplegables), `docs/CONTEXTO-CORTO.md` (la línea de «Hitos» de la sección 5), `docs/HISTORIA.md`.
- En `docs/COLA.md`, en «Lo que queda por hablar», el punto de «los tres botones de comunicar»:
  queda resuelto con esta fila («Pedir lo que falta» vive dentro de «Comunicar ▾»); se borra.

## La prueba (una sola, al final)

`pruebas/mesa-del-hito-enfocada.mjs`, con el navegador y el disco de mentira, a 1905×1000 y a
1280×800, sobre un asunto con un hito de cinco pasos (dos hechos):

1. La mesa tiene dos zonas; la izquierda es más ancha que la derecha; no hay tercera columna.
2. En la cabecera hay exactamente «Generar documento ▾», «Comunicar ▾», «Marcar como hecho» y «···».
3. El tercer paso tiene la clase del siguiente paso y su botón de acción es el principal; los dos
   hechos no enseñan explicación ni botones.
4. «No aplica» no se ve sin pasar el ratón y sí al pasarlo.
5. Abrir «Comunicar ▾» enseña los chips y «Preparar correo»; Escape lo cierra y la mesa sigue abierta.
6. «Buscar otra plantilla…» está dentro de «Generar documento ▾».
7. Sin documentos, la columna derecha dice «Ninguno todavía.» en una línea.
8. Una captura a 1905×1000 para `pruebas/capturas/` (sin datos reales).

Después, `npm test` completo en verde.

## Cómo trabajar

- **No leas el repositorio entero**: con `docs/contexto/HITO-MESA.md` y los ficheros de la lista basta.
- **Cambios quirúrgicos**, sin reescribir ficheros enteros que no lo necesiten.
- **Sube directamente a `main`, sin abrir pull request** (si la sesión lo tiene forzado, pull request
  y fusión automática, según la nota de `docs/COLA.md`).
- Como mucho dos subidas (regla 13). `App.VERSION` con la hora real.
- Al terminar, en el mensaje a Francisco: qué va a ver distinto al abrir un hito, en tres frases.
