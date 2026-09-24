# Fila 109 — El hito a pantalla completa: la mesa de trabajo

Diseño cerrado con Francisco el 24-sep-2026. **Va después de la fila 107** (`docs/FICHA-EN-TARJETAS.md`):
esta fila se monta dentro de la tarjeta "Hitos" abierta en grande. Bajar `main` antes de empezar.

Maqueta de referencia (datos de ejemplo), aprobada por Francisco:
https://claude.ai/artifact/6JHwWbsrprnYkw7ULL46db

## El problema

Hoy un hito desplegado enseña, en grande y arriba, responsable, fecha límite y la caja de la nota.
Lo importante (qué hay que hacer, la normativa, los documentos y los formularios) queda abajo,
como una fila de botones. Francisco lo ve pobre: quiere que el hito sea la mesa de trabajo desde la
que se hace y se consulta todo.

## Las tres decisiones de Francisco

1. **El hito se abre a pantalla completa**, no desplegado dentro de la lista.
2. **Los pasos del guion se marcan solos** cuando la app ve la acción (generar, registrar,
   comunicar, añadir documento). Los que la app no ve se marcan a mano.
3. **El primer borrador del guion de cada hito lo escribe Claude Code** a partir de las guías del
   instituto. Francisco lo corrige después.

Dos detalles que decidió Claude y Francisco aceptó:

- Con todos los pasos del guion hechos (o "no aplica"), el botón "Marcar hito como hecho" se
  resalta, pero **no se marca solo**.
- La normativa del borrador enlaza al BOE o al BOJA, y solo la que ya citan las guías.

## 1. Dónde vive

- Dentro de la tarjeta "Hitos" abierta en grande (fila 107), la lista de hitos pasa a ser
  **compacta**: una línea por hito con casilla, título, estado, plazo y responsable. Ya no se
  despliega nada en la lista.
- **Pulsar un hito abre su mesa**, que ocupa todo el sitio de la tarjeta. Arriba, "← Volver a la
  lista de hitos". **Escape** vuelve primero a la lista; el siguiente Escape, a lo de la fila 107.
- Si hay un documento abierto en el panel de la derecha (`js/visor.js`), la mesa ocupa el resto:
  la tercera columna baja debajo de las otras dos. Abrir o cerrar el documento no cierra la mesa.
- Con la mesa abierta, la franja de documentos de la fila 107 no sale (la mesa ya los tiene).
- Desde "Qué me toca": entra directo en la mesa de ese hito (sustituye al "hito desplegado").
- Un repintado (guardar, llega un documento, presencia) no cierra la mesa ni pierde lo escrito
  (`U.conservandoLoEscrito`).

## 2. La cabecera de la mesa

- Camino: `Asuntos abiertos › <nombre del asunto> › Hito N de M`.
- Título del hito, grande.
- Tres **etiquetas pequeñas pulsables**: estado, plazo ("Vence 15-oct · quedan N días hábiles",
  con `Plazos.sumarDiasHabiles` y los no lectivos de Ajustes › Hitos; colores de `Plazos.de`) y
  responsable. Pulsar cada una abre un menú pequeño para cambiarla (`js/ficha-menus.js`). Los
  campos grandes de responsable y fecha de hoy desaparecen.
- Botón principal **"Marcar hito como hecho"** (sigue avisando de lo obligatorio sin reunir, como
  hoy). Resaltado cuando el guion está completo.
- Menú **⋯**: "Dejarlo solo informativo" / "Pedírmelo a mí", "Quitar este hito" (en rojo, con
  confirmación, como hoy).
- Debajo, la **tira de hitos** visibles del asunto (hecho con ✓, el actual marcado, los demás en
  gris). Pulsar uno salta a su mesa. Los `noaplica` y los del tipo anterior no salen en la tira.

## 3. Columna izquierda: el guion

- Título "Guion del hito", cuenta "N de M" y barra de progreso.
- Un paso de guion: casilla, texto en negrita, explicación corta en gris, y debajo sus botones:
  la acción (si tiene), su normativa como etiqueta azul "§ cita" (abre el enlace) y "No aplica".
- Marcado: tachado en gris, con quién y cuándo en el `title`.
- "+ Añadir un paso solo para este asunto" (no toca la guía del tipo).
- **Hito-pregunta** (clase `decision`): la mesa enseña arriba "¿Qué supuesto es?" con las opciones
  como tarjetas elegibles (la marcada, en verde). Elegir hace lo de siempre (`Hitos` poda y crea
  la rama) y la tira de hitos se actualiza. Un hito-pregunta no tiene guion, documentos ni
  formularios: la mesa enseña solo la pregunta, la normativa y las notas.

### El dato del guion

- Campo nuevo `guion: [{ id, texto, explicacion, accion, normativa }]` en un paso, en un subpaso de
  una opción y en un modelo de la biblioteca. Nunca en un paso-pregunta (`Guias.normalizar` lo
  vacía). `accion` es `'generar' | 'registrar' | 'comunicar' | 'anadir' | ''`. `normativa`, la
  misma forma que la del paso (`{ cita, bloque, clave, url }`).
- **En `hitos.json` no se copia el guion**: el hito lo lee de su paso por `origenGuia`, como la
  comunicación. Así un guion corregido vale también para los asuntos vivos. En el hito solo se
  guarda el estado: `guionHecho: { <id>: { hecho, noaplica, quien, cuando } }` y
  `guionPropio: [{ id, texto }]` (lo añadido solo a este asunto).
- Un paso de guion que desaparece de la guía se deja de ver; su estado se queda guardado sin
  estorbar.
- Entra en `HitosBiblioteca.diferencias` ("Guion"), se copia al traer un modelo y al guardarlo.
- Editor: sección plegable **"Guion de este paso"** en el cuadro de la guía, con el patrón de
  `js/guias-requisitos.js` (añadir, quitar, subir, bajar; texto, explicación, acción en un
  desplegable, normativa con el mismo bloque de `HitosNormativa`).

### Marcar solo (decisión 2)

Cuando pasa la acción **desde ese hito**, se marca el primer paso del guion sin marcar con esa
`accion`:

- `generar`: al generar un documento desde el hito (`js/hitos-generar.js`).
- `registrar`: al registrar un documento del hito (menú de tres puntos o el registro normal, si el
  documento está apuntado a ese hito).
- `comunicar`: cuando queda la constancia del "Comunicar" del hito (`apuntarElRastro`).
- `anadir`: al añadir un documento al hito por cualquiera de sus caminos.

Se apunta `quien` y `cuando`. No crítico: si falla, la acción ya está hecha (ámbar con
`U.accesorio`). Desmarcar a mano siempre se puede.

## 4. Columna central: documentos y formularios

### Documentos del hito

- Cabecera con "Añadir documento" y "Desde Por clasificar" (los caminos de hoy,
  `js/hitos-anadir.js`) y una zona de **arrastrar y soltar** que hace lo mismo que "Desde el
  ordenador".
- **Tabla**: casilla de selección, documento (nombre del tipo en negrita y el nombre del fichero en
  gris debajo), estado y acciones.
  - Estado: "Registrado"/"Sellado" con el código (`26SM0617`) si el nombre lo lleva; "Sin
    registrar" en ámbar si no; "(ya no está)" en gris.
  - **Documentos gemelos**: el `SIN SELLAR` y el `.doc`/`.docx` con el mismo nombre base cuelgan
    debajo del sellado, en pequeño, como "Original sin sellar" y "Borrador en Word".
  - Acciones a la vista: **Abrir** (panel de la derecha), **Enviar** (Comunicar del hito con ese
    documento premarcado) y **⋯** (el menú de hoy, más "Renombrar" y "Mover a otro hito").
  - Un documento que viene de otro hito lleva "viene del hito N" en gris.
- **Selección de varios**: aparece una barra con "Enviar por correo" (Comunicar con todos
  premarcados), "Unir en un PDF" (la herramienta de hoy, ya con esos), "Abrir para imprimir" (cada
  uno en una pestaña nueva del navegador) y "Mover a otro hito".
- **"Lo que falta reunir"**: los requisitos de clase `documento` sin marcar salen como huecos
  ámbar con su botón "Añadir"; los de clase `dato`, como casillas pequeñas con su valor (lo de hoy
  de `js/hitos-requisitos.js`). "+ Añadir algo que falte" sigue aquí.

### Formularios y plantillas de este hito

- Una fila por plantilla de documento del paso (`plantillasDocumento`) con **"Generar documento"**
  y "Ver plantilla"; y otras del tipo en un "Otras plantillas" plegado.
- Una fila por formulario oficial del paso (`formularios`) con **"Preparar para el tercero"**,
  **"Abrir para imprimir"** y **"Enviar por correo"** (lo prepara, lo guarda en la carpeta del
  asunto apuntado al hito y abre Comunicar con él premarcado). Los de vía `protocolo`/`seneca`,
  como aviso, igual que hoy.
- Icono pequeño DOC (azul) o PDF (rojo) a la izquierda.

## 5. Columna derecha: consulta, comunicar y notas

- **Normativa**: la del hito y la de sus pasos de guion, sin repetir, cada una con cita, una línea
  de qué dice (si la guía la trae) y "Abrir". "Añadir" abre el bloque de normativa del hito.
- **Comunicar**: chips marcables con los destinatarios posibles (tercero, tutores legales,
  relacionados, y el responsable si es persona del centro), premarcados según el responsable del
  hito (lógica de hoy de `resolverDestinatario`). Botones **"Preparar correo"** y **"Mensaje de
  Séneca"**, que abren los cuadros de siempre con esos destinatarios y los documentos del hito
  premarcados. Sustituye al botón "Comunicar" suelto del hito. "Pedir lo que falta" pasa a ser la
  línea "Pedir lo que falta" dentro de este bloque, solo si falta algo.
- **Notas e historial**, juntos en una sola línea de tiempo (lo más nuevo arriba): las notas en un
  fondo suave y lo automático (generado, registrado, comunicado, cambios de estado) en texto
  normal. Caja de nota arriba: Intro guarda, Mayúsculas+Intro salta de línea.

## 6. El borrador del guion (decisión 3)

- Escribir un `guion` para **cada paso** (y subpaso de opción) de las guías de
  `datos-biblioteca/biblioteca-centro.json`, y para cada modelo de la biblioteca. Entre 3 y 7
  pasos de guion por hito, concretos, en el lenguaje del centro. Marcar con su `accion` los que
  correspondan.
- Normativa: solo la que ya citan esas guías o la biblioteca, con su enlace oficial (BOE o BOJA);
  no inventar artículos. Si no hay, sin normativa.
- Si un paso hoy dice "según el supuesto" y en realidad son dos caminos, no cambiarlo en esta
  fila: apuntarlo en `docs/HISTORIA.md` como sugerencia de convertirlo en pregunta.
- **Traerlo a la carpeta del centro**: botón nuevo en Ajustes → Mantenimiento, **"Traer los
  guiones del instituto"**. Añade el `guion` a los pasos de `guias.json` y a los modelos de
  `hitos-biblioteca.json` que **no tengan ya uno**, emparejando por id del paso o del modelo.
  Nunca pisa un guion que ya exista. Al terminar dice cuántos ha traído. Relee antes de escribir y
  pasa por `Copias.guardar`, como todo.

## Ficheros

- **Nuevos**: `js/hito-mesa.js` (abrir/cerrar la mesa, cabecera, tira, Escape, las tres
  columnas), `js/hito-mesa-guion.js` (el guion y la pregunta), `js/hito-mesa-documentos.js` (tabla,
  gemelos, selección, formularios y plantillas), `js/hitos-guion.js` (modelo: `Hitos.marcarGuion`,
  `Hitos.marcarGuionPorAccion`, `Hitos.anadirGuionPropio`, `Hitos.guionDe(hito)`; enganchado a
  `window.Hitos` como `js/hitos-requisitos.js`), `js/guias-guion.js` (editor), `css/hito-mesa.css`.
  Si alguno pasa de 400 líneas, partirlo.
- `js/hitos-panel.js`, `js/hitos-panel-lista.js`: la lista compacta y abrir la mesa al pulsar;
  `desplegarAlAbrir` abre la mesa.
- `js/ficha-tarjetas.js` (de la fila 107): punto de enganche para que la mesa ocupe la tarjeta y
  oculte la franja.
- `js/hitos-generar.js`, `js/hitos-comunicar.js`, `js/correo.js` (`apuntarElRastro`),
  `js/hitos-anadir.js`, `js/hitos-documento-menu.js`, `js/documentos.js`, `js/registro.js`: avisar
  para marcar solo.
- `js/hitos-requisitos.js`: pintar "Lo que falta reunir" dentro de la mesa.
- `js/guias.js` (solo llamar a `GuiasGuion.bloqueHTML`/`leer` y copiar en `recoger()`; no engordarlo),
  `js/hitos-biblioteca.js`, `js/guias-biblioteca.js`: el campo `guion`.
- `js/cargar-biblioteca.js` y `js/ajustes-mantenimiento.js`: "Traer los guiones del instituto".
- `datos-biblioteca/biblioteca-centro.json`: el borrador de los guiones.
- `js/que-me-toca.js`, `js/usabilidad.js`, `js/visor.js`.
- `index.html`, `js/version.js`, y `js/envolturas-esperadas.js` si hiciera falta envolver algo.
- Nueva prueba `pruebas/hito-mesa.mjs`; ajustar `pruebas/hitos.mjs` y las que dependan del hito
  desplegado.
- Al terminar: `docs/CONTEXTO-CORTO.md` (sustituir la línea de "Hitos: …"),
  `docs/contexto/HITOS-Y-GUIAS.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md`,
  `docs/COLA.md`.

## Cómo trabajar

- **No leas el repositorio entero**: solo los ficheros de arriba, `docs/CONTEXTO.md` y sus hijos
  `HITOS-Y-GUIAS.md`, `ASUNTOS.md` y `PANTALLA.md`, y `docs/FICHA-EN-TARJETAS.md`.
- Cambios quirúrgicos, no reescribir ficheros enteros. `datos-biblioteca/biblioteca-centro.json`
  pasa de 140 KB: modificarlo con un script, nunca retipeándolo, y comprobar el tamaño después.
- Sube directamente a `main`, sin pull request (si la sesión lo impide, la nota final de
  `docs/COLA.md`).
- **Una sola prueba al final**: `pruebas/hito-mesa.mjs`, en navegador de verdad, a 1905×1000 y a
  1280×800:
  1. Pulsar un hito en la lista abre su mesa con las tres columnas, sin desplazarse a 1905 px.
  2. Cambiar el responsable y el plazo desde sus etiquetas; se guarda.
  3. Generar un documento desde la mesa marca solo el paso de guion `generar`, y el documento sale
     en la tabla con su gemelo `.docx` colgando.
  4. Seleccionar dos documentos y "Enviar por correo": el cuadro sale con los dos premarcados.
  5. Un hito-pregunta enseña las opciones; elegir una actualiza la tira.
  6. Con un documento abierto a la derecha, la mesa sigue abierta.
  7. Escape vuelve a la lista; desde "Qué me toca" se entra directo en la mesa.
  8. "Traer los guiones del instituto" no pisa un guion ya escrito.
  Más `npm test` completo en verde. Una foto a 1905 px de la mesa, para comprobarlo tú antes de
  publicar.
