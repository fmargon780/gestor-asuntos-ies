# Fila 154 — Hitos más sencillos: las acciones en el hito, los pasos como lista

Cerrado con Francisco el 25-sep-2026. Va **después de las filas 150 a 153** y sustituye en parte a
la 150: el «Comunicar» de cada paso que arregla la fila 150 se quita de la lista y pasa al menú del
hito. El arreglo de la fila 150 (que comunicar marque el paso correcto) se aprovecha tal cual. El
enlace «✎ Cambiar el guion de este hito» de la fila 150 se mantiene. El «Enviar ▾» de cada
documento de la fila 153 se mantiene también.

## Por qué

Francisco trabaja con la mesa del hito y le resulta poco fluida:

- El mismo botón («Comunicar», «Generar documento») sale en tres sitios: la barra de arriba del
  asunto, la cabecera del hito y cada paso. No sabe cuál usar.
- Los números no cuadran. En un asunto con el hito 5 en curso, el aviso de arriba decía «Paso 4 de
  4», la pestaña «Hitos 4/5» y la barra del guion «1 de 4», con el primer paso tachado («No aplica»).
- Los documentos asociados a un hito no se ven desde el hito siguiente, y a veces hacen falta.

## Qué hay que hacer

### 1. Las acciones, solo en el hito

- En la cabecera de la mesa del hito quedan: **«Generar documento ▾»**, **«Comunicar ▾»** y
  **«Registrar»** (el registro de salida/entrada que hoy vive en el paso «Registrar la salida…»).
  Además de «Marcar como hecho» y «···».
- **Se quitan los botones de cada paso** del guion («Comunicar», «Registrar (en el ··· del
  documento)», y cualquier otro botón de acción dentro de un paso).
- **Se quitan «Comunicar» y «Generar documento» de la barra de arriba de la ficha del asunto**
  cuando el asunto tiene hitos. En un asunto **sin** guía ni hitos, se quedan donde están.

### 2. Los pasos: una lista para marcar

- Cada paso es una casilla con su texto. Marcarla apunta la fecha y quién lo hizo (se ve al lado,
  en pequeño). Desmarcarla lo borra.
- «No aplica» sigue existiendo (en el ✎ o el ··· del paso). Un paso que no aplica se ve tachado y
  **no cuenta** ni para el total ni para lo hecho.

### 3. La «receta» de un paso (opcional)

- En el editor del guion (el de Ajustes y el que abre la fila 150 desde la mesa), cada paso puede
  llevar una receta. Tres tipos:
  - **Comunicar**: a quién (el tercero, la familia/tutores, la tutoría, un relacionado, otro),
    por qué vía (correo o Séneca) y con qué plantilla del tipo.
  - **Generar documento**: qué plantilla de Word o qué impreso.
  - **Registrar**: entrada o salida.
- Un paso sin receta es solo un recordatorio.
- Al abrir **«Comunicar ▾»** del hito, arriba del menú salen los **pasos pendientes con receta de
  comunicar** (con su texto: «Enviarla a la familia por iPasen»). Al elegir uno, el cuadro de
  correo o de Séneca se abre **ya relleno** con los destinatarios y la plantilla de la receta.
  Debajo, lo de siempre (comunicar libremente).
- Lo mismo con **«Generar documento ▾»** y **«Registrar»**.
- Al terminar la acción elegida desde un paso, **se marca ese paso**. Si la acción se hace sin
  elegir paso, se sigue marcando como hoy (el primer pendiente que encaje), sin cambiar nada.
- Los pasos que hoy ya tienen botón (la guía del instituto: «Comunicar», «Registrar»…) se
  convierten solos en pasos con receta equivalente, sin perder nada. Hacerlo en la carga, sin que
  Francisco toque nada.

### 4. Los documentos: todos a la vista en cada hito

- La tarjeta de documentos de la mesa enseña **todos los documentos del asunto**:
  - arriba, los de este hito;
  - debajo, un apartado «De otros hitos», con una etiqueta en cada uno con el número y nombre
    corto del hito del que vienen;
  - al final, los de la carpeta sin hito asociado.
- Se pueden abrir, adjuntar a un correo y usar igual que los del propio hito. Un documento sigue
  asociado a un solo hito; esto es solo verlo.
- El título de la tarjeta cuenta los del hito: «Documentos del hito · 2 (y 5 más del asunto)».

### 5. Que los números cuadren

- El aviso de la cabecera del asunto («Paso N de M · título»), la pestaña «Hitos N/M» y la
  numeración del hito abierto tienen que decir lo mismo. Usar un único cálculo para los tres.
- Revisar la causa del «Paso 4 de 4» con el hito 5 en curso (probablemente cuenta los hechos, o
  se salta un hito de la bifurcación) y corregirla.
- La barra del guion cuenta solo pasos que aplican: con 4 pasos, uno «No aplica» y uno hecho, dice
  «1 de 3».

## Ficheros que hay que tocar

- `js/hito-mesa.js`, `js/hito-mesa-guion.js`, `js/hito-mesa-comunicar.js`,
  `js/hito-mesa-documentos.js`, `js/hito-mesa-tarjetas.js`
- `js/hitos-guion.js`, `js/guias-guion.js`, `js/guias-editor.js` (la receta en el editor)
- `js/hitos-comunicar.js`, `js/hitos-generar.js`, `js/hitos-documentos.js`
- `js/estado-hito.js` y `js/hitos-panel.js` (el cálculo único de «Paso N de M»)
- `js/ficha-menus.js` / `js/ficha-asunto.js` (quitar los dos botones de la barra de arriba si hay hitos)
- `js/cargar-biblioteca.js` o donde se carguen los guiones, para convertir los botones de hoy en recetas
- Pruebas en `pruebas/`: (a) un paso con receta de comunicar sale arriba en «Comunicar ▾», abre el
  cuadro relleno y al enviar marca ese paso; (b) un documento del hito 2 se ve en la mesa del hito 3
  con su etiqueta; (c) los tres números coinciden en un asunto con un paso «No aplica».
- `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de hitos de `docs/contexto/` y `docs/HISTORIA.md`.

## Cómo trabajar

- No leas el repositorio entero: solo `docs/CONTEXTO.md`, el hijo de hitos de `docs/contexto/` y
  los ficheros de arriba.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas: si alguno se acerca, pártelo.
- Si es demasiado para una sesión, parte la fila en dos (1-2-5 primero, 3-4 después) y apunta la
  segunda mitad como fila nueva PENDIENTE, justo debajo.
- Una sola prueba al final (`npm test`).
- Sube a `main`, sin pull request (si la sesión solo puede con pull request, fusiónalo tú en verde,
  según el permiso permanente). Máximo dos subidas por fila (regla 13 de la cola).
- Comprueba con `curl` lo publicado.
