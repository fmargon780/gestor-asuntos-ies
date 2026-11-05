# 522 — Tareas con documento

## Lo que escribió Francisco

Aviso de usuario (idea 508, 4-nov-2026):

> Hay que buscar la forma de que los documentos que haya que registrar de entrada o de salida, avisen o impidan hacer algo si no está registrado.

Idea 513:

> Guías: una tarea de tipo «firmar» que se marque sola cuando llega el documento firmado, para que el hito avance sin tocarlo; segunda parte del tema 392, acordada con Francisco el 5-nov-2026

Tema 516, «El hito sabe si falta registrar o firmar», que junta las dos.

Durante el diseño Francisco añadió: «Me refiero a poder ver colgado de la tarea del hito el documento involucrado», y que «el documento ya no es igual al de la tarea anterior», y «Creo que es fundamental poder crear desde un asunto concreto la guía de ese tipo de asuntos para el futuro, así como modificarlo».

## Lo que entendió Claude (acordado con Francisco el 5-nov-2026)

El tema se parte en tres, en este orden: 522, 523 y 524. Esta es la primera. Si algo cambia el texto de arriba, manda esto.

1. **Documento colgado.** Debajo de cada tarea de generar o registrar (y de firmar, cuando exista: fila 523) sale su documento en una línea: nombre pulsable, «Ruta» y sus datos en gris. Los documentos del hito y la carpeta de la derecha siguen como hoy.
2. **Cómo llega.** La tarea de generar deja su documento en las tareas siguientes del hito que trabajan sobre él, sin que nadie haga nada. Antes de generar, esas tareas dicen «Saldrá aquí al generar <lo que sea>.».
3. **«Elegir documento».** Si no se puede saber solo, la tarea muestra «Elegir documento»: un desplegable con los documentos del asunto, de cualquier hito. Una tarea sin hacer con documento lleva «Cambiar» para elegir otro.
4. **Versiones.** Una tarea hecha muestra la versión con la que quedó el documento: su nombre real en «_Previas» (`… SIN FIRMAR.pdf`, `… SIN SELLAR.pdf`), sin «Ruta». Al pulsarla se abre esa versión en la derecha. La última tarea hecha muestra el documento actual. Una tarea marcada a mano muestra el documento actual. Si la versión ya no está: «(ya no está)».
5. **Abrir.** Pulsar un documento lo abre en la columna derecha, como hoy, con «← Carpeta».
6. **«Qué se hace» en las tareas del hito.** La caja «Nueva tarea…» lleva «Qué se hace» y su dato (plantilla, sentido o a quién), con las mismas opciones que la guía. Sin elegir, como hoy. Sigue guardándose solo en este asunto, con «solo aquí».
7. **«Cambiar».** «Cambiar» de una tarea deja cambiar también «Qué se hace» y su dato. Se guarda donde hoy: en la guía si es de la guía; en el asunto si es «solo aquí».
8. **«Pasar a la guía»** se lleva «Qué se hace» y su dato. El documento se queda en el asunto.
9. Las tareas de generar y registrar se marcan como hoy, pero la de registrar solo con su documento.

**Lo que desaparece o se sustituye:** nada. La tarea de registrar deja de marcarse con cualquier documento del hito: lo hace con el suyo.

## Pantalla de prueba (aprobada el 5-nov-2026)

- `docs/pantallas/516.html` · https://claude.ai/artifact/GNma3BBTQc3rnSjavekkrn
- Es la misma pantalla para las filas 522, 523 y 524. Esta fila programa solo lo de arriba.

## Qué NO se hace en esta tarea

- La acción «Firmar un documento»: fila 523. En la pantalla ya sale; aquí no se programa.
- Los avisos y «Sin registrar» solo donde toca: fila 524.
- Asuntos de grupo.

## Notas técnicas de Claude

- El documento de cada tarea se guarda en el hito de cada asunto, nunca en la guía: `h.guionDocumento[idPaso]` en `hitos.json` (o junto a `guionHecho`, lo que encaje), fundido como lo demás del hito. Al renombrar un documento (`DocumentoRenombrar`, `AsuntoRenombrar`) se actualiza.
- La versión se apunta en el momento en que el documento pasa a `_Previas` (`RutaCopia.queHaLlegado`, `RegistroSellado.asociar`, `js/documentos-firmados.js`): la tarea que dejó esa versión guarda su nombre.
- `Hitos.guionDe` ya deja pasar `accion` en `guionPropio` (`linea(...)`): guardar `accion` y `receta` en `anadirGuionPropio`, con `normalizarReceta`. «Pasar a la guía» (`DondeSeGuardaTareas.pasar`) las lleva.
- `marcarGuionPorAccion` marca «el primer paso sin marcar»: pasa a mirar el documento de la tarea.
- Asuntos ya abiertos: sus tareas hechas, sin dato, muestran el documento actual o nada. No se recorren. Tareas pendientes con un solo documento posible, sin dato: «Elegir documento».
- Las líneas repetidas no llevan menú propio; se reutiliza lo de `HitoMesaDocumentos`. Palabras según `docs/VOCABULARIO.md`. Línea en `js/novedades.js`. Demo: `?demo=1&auto=1`. Prueba nueva: `pruebas/tareas-con-documento.mjs`.

## Cómo lo comprueba el segundo revisor

1. Generar desde el hito: el documento cuelga de la tarea de generar y de la de registrar.
2. Antes de generar: «Saldrá aquí al generar…».
3. Tarea sin documento: «Elegir documento» lista todos los del asunto; «Cambiar» elige otro.
4. Registrar: al llegar el sellado de su documento se marca; con el sellado de otro documento, no.
5. Tarea hecha: muestra la versión `SIN SELLAR`, sin «Ruta»; se abre en la derecha; la última hecha muestra el actual.
6. Marcada a mano: documento actual.
7. «Nueva tarea…» con «Qué se hace» y dato: sale «solo aquí»; «Cambiar» los cambia; «Pasar a la guía» los lleva y el documento se queda.
8. «Cambiar» de una tarea de la guía llega a la guía.
9. Un asunto abierto de antes se ve sin errores.
10. Coincide con `docs/pantallas/516.html` en lo de esta fila.

## Revisión y respuestas durante el trabajo

- **Segundo revisor (5-nov-2026), una línea por punto:**
  1. Generar desde el hito: coincide (documento, «Ruta» y datos en la tarea de generar y en la de registrar).
  2. Antes de generar: coincide («Saldrá aquí al generar el certificado.»).
  3. «Elegir documento» / «Cambiar»: coincide; no ha podido ver que liste documentos de otros hitos (el asunto tenía uno solo; lo comprueba la prueba automática con los de la carpeta).
  4. Registrar: coincide con el sellado de su documento; con el de otro documento no lo ha podido ver desde la pantalla (sí lo comprueba `pruebas/tareas-con-documento.mjs`).
  5. Tarea hecha: coincide (versión `SIN SELLAR` sin «Ruta», se abre a la derecha con «← Carpeta»; la última hecha, el actual). El visor del PDF falso de la copia de pruebas sale como texto: no es de esta fila.
  6. Marcada a mano: no lo ha podido ver.
  7. «Nueva tarea…» con «Qué se hace», «Cambiar» y «Pasar a la guía»: coincide (el documento se queda).
  8. «Cambiar» de una tarea de la guía llega a la guía: coincide.
  9. Asunto de antes (Hugo): coincide, sin errores de consola. La tarea de generar hecha de antes no muestra documento (no se sabe cuál es; el texto dice «o nada»).
  10. Maqueta 516: coincide en lo de esta fila; difiere en que el «Cambiar» de una tarea de la guía y la etiqueta de la acción van en el «⋮» y no sueltos (como hoy en la app); «Firmar un documento» no está (fila 523).
  - **No coincidía y se corrigió**: al abrir «Cambiar» desde el «⋮», las otras tareas pasaban a mostrar «….docx (ya no está)». Arreglado (el repintado local perdía la lista de hitos) y cubierto en la prueba.
  - Lo que la app hace de más: nada nuevo; «No aplica» en una tarea «solo aquí» y la «Ruta» del visor de una versión son de antes. El desplegable de «Cambiar» no marca el documento actual (se deja así).
- **Notas de Claude Code**: `donde-se-guarda.mjs` (paso 5, el menú lateral tapa «Crear») y `hacer-este-hito.mjs` («1 listos para enviar») fallan igual en `main` sin este cambio, en este entorno; no son de la fila. Pasada completa de pruebas no hecha (tarda mucho): se pasaron las 72 pruebas de lo tocado; 67 verdes y las 5 que fallaron, repetidas con el arreglo (3 pasan; 2 son las de arriba). `hitos-guion.js` ya pasaba de 400 líneas antes (444; ahora 469, bajo las 600 de CONTEXTO).
