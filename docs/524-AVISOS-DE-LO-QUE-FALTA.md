# 524 — Avisos de lo que falta por firmar o registrar

## Lo que escribió Francisco

Aviso de usuario (idea 508, 4-nov-2026):

> Hay que buscar la forma de que los documentos que haya que registrar de entrada o de salida, avisen o impidan hacer algo si no está registrado.

Idea 513:

> Guías: una tarea de tipo «firmar» que se marque sola cuando llega el documento firmado, para que el hito avance sin tocarlo; segunda parte del tema 392, acordada con Francisco el 5-nov-2026

Tema 516, «El hito sabe si falta registrar o firmar», que junta las dos.

## Lo que entendió Claude (acordado con Francisco el 5-nov-2026)

Tercera parte del tema. Necesita las filas 522 y 523 HECHAS. Si algo cambia el texto de arriba, manda esto.

1. **Avisar, no impedir.** Nunca se bloquea: el cuadro siempre deja seguir. Francisco lo aceptó sabiendo que no garantiza que nada se cierre sin registrar.
2. **Qué cuenta.** Solo lo que hay que firmar o registrar: documentos con la casilla «Pendiente de registro» sin registrar, y tareas de firmar o registrar sin hacer. Una tarea «No aplica» o «Sin acción» no cuenta. «Comunicar» o «Generar» sin hacer, tampoco.
3. **Marcar como hecho.** Si falta algo **de ese hito**, cuadro «Falta por hacer en este hito», con la lista y los botones «Volver» y «Marcar como hecho igualmente». Si no falta nada, como hoy.
4. **Archivar el asunto.** Si falta algo en **todo el asunto**, cuadro «Falta por hacer en este asunto», con «Volver» y «Archivar igualmente». Si no falta nada, el cuadro de siempre.
5. **Enviar un correo.** Si un documento adjunto tiene algo por firmar o registrar, cuadro «Falta por hacer en lo que vas a enviar», con «Volver» y «Enviar igualmente». Solo mira los adjuntos.
6. **Cada línea** dice qué falta y de qué documento: «Firmar: <documento> (falta 1 de 2 firmas)», «Registrar: <documento>». Sin documento: «<tarea> (sin documento)».
7. **«Sin registrar».** En la mesa del hito, como en la ficha, esa marca sale solo en los documentos con la casilla y en los que cuelgan de una tarea de registrar sin hacer. Los demás no llevan marca. «Registrado» sigue igual.

**Lo que desaparece o se sustituye:** «Sin registrar» en los documentos que no hay que registrar.

## Pantalla de prueba (aprobada el 5-nov-2026)

- `docs/pantallas/516.html` · https://claude.ai/artifact/GNma3BBTQc3rnSjavekkrn
- Es la misma pantalla para las filas 522, 523 y 524. Esta fila programa solo lo de arriba.

## Qué NO se hace en esta tarea

- Impedir, en cualquier caso.
- Avisos en Inicio o en «Qué me toca».
- Asuntos de grupo y archivado de varios a la vez sin pregunta (`App.E.archivarSinPreguntar`), que siguen como hoy.

## Notas técnicas de Claude

- Una función pura que devuelva lo que falta, con alcance hito, asunto o lista de documentos, para las tres entradas y para `estadoDe` de `js/hito-mesa-documentos.js`.
- Marcar: `HitosPanelLista.marcarDesdeCasilla` (la casilla y el botón pasan por ahí; solo al marcar, no al desmarcar). Archivar: `js/asuntos-archivar.js`, antes de la pregunta, sin dos cuadros seguidos (`yaPreguntado`). Enviar: `js/correo-enviar.js`, con `U.preguntar`.
- Un solo cuadro a la vez (`CONTEXTO-CORTO`, sección 6). Regla común de cuadros. Línea en `js/novedades.js`. Prueba nueva: `pruebas/avisos-de-lo-que-falta.mjs`.

## Cómo lo comprueba el segundo revisor

1. Marcar un hito con firma o registro pendiente: cuadro con solo lo de ese hito; «Volver» no cambia nada; «igualmente» lo marca.
2. Marcar sin pendientes: sin cuadro. Desmarcar: sin cuadro.
3. Archivar: lista lo de todo el asunto, también una casilla de otro hito; «Archivar igualmente» archiva.
4. Enviar con adjunto pendiente: cuadro solo por ese adjunto; sin pendiente, sin cuadro.
5. Tarea «No aplica» o sin acción: no sale.
6. Con 2 firmas y una llegada: «falta 1 de 2 firmas».
7. «Sin registrar» solo en los casos del punto 7.
8. Coincide con `docs/pantallas/516.html` en lo de esta fila.

## Revisión y respuestas durante el trabajo

- **Segundo revisor (5-nov-2026), una línea por punto:**
  1. Marcar un hito con pendientes: coincide («Volver» no cambia nada; «igualmente» lo marca; solo lo de ese hito).
  2. Sin pendientes y desmarcar: coincide, sin cuadro.
  3. Archivar: coincide (lista también la casilla de otro hito; «Archivar igualmente» archiva; sin pendientes, el cuadro de siempre). Con su escenario de PDF falsos el asunto siguió en la lista tras archivar; en una prueba limpia desapareció (atribuido a los PDF falsos; la prueba `archivar-no-cabe.mjs` archiva bien).
  4. Enviar: coincide. El aviso va dentro del resumen del correo con «Enviar igualmente» y «Volver», en vez de «Confirmar y enviar» (decisión de Claude: un solo cuadro a la vez). Sin pendiente, «Confirmar y enviar».
  5. «No aplica», «Comunicar» y sin acción: coincide, no salen.
  6. «falta 1 de 2 firmas»: coincide.
  7. «Sin registrar»: coincide (mesa y ficha). No ha podido ver «Registrado» con sus PDF falsos (no cambia).
  8. Pantalla 516: coincide en lo de esta fila.
  - **Hacía de más y se quitó**: los textos «Todavía falta:» y «No se impide nada: tú decides.» de los cuadros (la pantalla no los lleva).
- **Notas de Claude Code**: `hacer-este-hito.mjs` ya fallaba en `main`; `archivar-no-cabe.mjs` (prueba 14, `js/carpetas.js` de 624 líneas) también falla en `main` sin este cambio. Se adaptaron `mesa-tarjetas-que-se-abren.mjs` (sin marca donde no hay casilla) y `archivar-no-cabe.mjs` (pasa por el cuadro nuevo). Pasada completa no repetida (ya hecha hoy).
