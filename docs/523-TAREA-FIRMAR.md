# 523 — Tarea «Firmar un documento»

## Lo que escribió Francisco

Aviso de usuario (idea 508, 4-nov-2026):

> Hay que buscar la forma de que los documentos que haya que registrar de entrada o de salida, avisen o impidan hacer algo si no está registrado.

Idea 513:

> Guías: una tarea de tipo «firmar» que se marque sola cuando llega el documento firmado, para que el hito avance sin tocarlo; segunda parte del tema 392, acordada con Francisco el 5-nov-2026

Tema 516, «El hito sabe si falta registrar o firmar», que junta las dos.

## Lo que entendió Claude (acordado con Francisco el 5-nov-2026)

Segunda parte del tema. Necesita la fila 522 HECHA. Si algo cambia el texto de arriba, manda esto.

1. **Acción nueva.** «Qué se hace» gana «Firmar un documento», en la guía y en las tareas del hito, con el dato «Firmas necesarias» (1, 2 o 3; por defecto 1).
2. **Se marca sola.** Con «Ruta» pulsado y el firmado guardado encima de **su documento**, la tarea se marca sola al llegar a las firmas necesarias. Aviso verde de siempre, más « Marcado: <tarea>.». Reconocer la firma sigue funcionando igual sin tarea.
3. **Faltan firmas.** Si no llega al número, no se marca, y el aviso verde añade « Aún no se marca la tarea: falta 1 de 2 firmas.». La etiqueta de la tarea dice «Firmar · 2 firmas». El documento lleva «Firmado (N)» como hoy.
4. **El hito no se cierra solo.** Con todas las tareas hechas se resalta «Marcar como hecho», como hoy. Decidido: nada cierra un hito sin que alguien lo vea.
5. **«Hacer este hito».** Se para en la tarea de firmar con «Esperando el PDF firmado» y «Dejar de esperar», igual que con el sello. La línea gris dice «espera la firma». Al llegar las firmas, sigue. Una tarea de firmar o registrar **sin documento** no se espera: pasa a la siguiente y queda pendiente.
6. La tarea se marca a mano si la app no se entera, por ejemplo si se guardó sin pulsar «Ruta». «No aplica» funciona como en las demás.

**Lo que desaparece o se sustituye:** nada.

## Pantalla de prueba (aprobada el 5-nov-2026)

- `docs/pantallas/516.html` · https://claude.ai/artifact/GNma3BBTQc3rnSjavekkrn
- Es la misma pantalla para las filas 522, 523 y 524. Esta fila programa solo lo de arriba.

## Qué NO se hace en esta tarea

- Los avisos: fila 524.
- Comprobar que la firma es válida o quién firma.
- Que el hito se marque hecho solo (la idea 513 lo pedía; Francisco aceptó que no).
- Asuntos de grupo.

## Notas técnicas de Claude

- Añadir `firmar` a `ACCIONES` de `js/guias-guion.js`, `js/hitos-guion.js`, `js/hacer-este-hito.js` y al texto del editor, con `normalizarReceta` para `{ firmas }`.
- El punto de enganche es `js/documentos-firmados.js`, donde se anotan las firmas. Las firmas ya vienen contadas (`firmas` de `DocumentosDatos`).
- `cadena.estado` gana `esperando-firma`. La pasada de `js/hacer-este-hito-sello.js` no decide por la firma: la marca la pone la llegada del firmado. Mirar que `App.E` y `SoloConsulta` se respeten igual.
- Ayudas de botón y `docs/VOCABULARIO.md`. Línea en `js/novedades.js`. Prueba nueva: `pruebas/tarea-firmar.mjs`.

## Cómo lo comprueba el segundo revisor

1. La acción sale en la guía y en «Nueva tarea…», con «Firmas necesarias».
2. Firmado encima de su documento: tarea marcada y aviso.
3. Firmado encima de otro documento: la tarea no se marca.
4. Con 2 necesarias: la primera no marca y avisa; la segunda marca; sale «Firmar · 2 firmas».
5. «Hacer este hito»: espera la firma, luego el sello, luego «Enviar».
6. Tarea sin documento: no se espera.
7. Hito con todo hecho: «Marcar como hecho» resaltado, sin cerrarse solo.
8. Sin cambios: reconocer un firmado sin tarea.
9. Coincide con `docs/pantallas/516.html` en lo de esta fila.
10. **[SOLO FRANCISCO]** Con un PDF real de AutoFirma y otro de Séneca, que la tarea se marque. Se copia a `docs/COMPROBAR-A-MANO.md`.

## Revisión y respuestas durante el trabajo

- **Segundo revisor (5-nov-2026), una línea por punto:**
  1. Coincide («Firmar un documento» y «Firmas necesarias» 1/2/3 en la guía y en «Nueva tarea…»).
  2. Coincide (tarea marcada y « Marcado: …» en el aviso).
  3. Coincide (firmado de otro documento: no se marca nada).
  4. Coincide («Aún no se marca la tarea: falta 1 de 2 firmas.»; la segunda marca; etiqueta «Firmar · 2 firmas»).
  5. Coincide hasta el sello («Esperando el PDF firmado», luego «Esperando el PDF sellado»); no ha visto «Enviar» (lo hace el flujo del sello, que no cambia).
  6. Coincide (sin documento no se espera, queda pendiente).
  7. Coincide en que no se cierra solo; no ha visto el resalte de «Marcar como hecho» (código de antes, no tocado).
  8. Coincide.
  9. Coincide con `516.html` en lo de esta fila; diferencia menor: la 516 enseña «(falta 1 de 2 firmas)» en la línea gris; la app lo dice en el aviso al llegar.
  10. No lo ha podido ver ([SOLO FRANCISCO], copiado a `docs/COMPROBAR-A-MANO.md`).
  - **Lo que hacía de más y se quitó**: la franja del visor «Documento listo. Ahora toca firmarlo…» con «Ruta» al generar antes de firmar. Se deja: la etiqueta «Firmar» también con 1 firma (como la 516), la coletilla «· esperando la firma» en Inicio y la ayuda del botón.
- **Notas de Claude Code**: `hacer-este-hito.mjs` («1 listos para enviar») y `nuevo-asunto-categoria-guia.mjs` fallan igual en `main` sin este cambio. `editor-de-la-guia-tareas.mjs` se adaptó (ahora son seis opciones en «Qué se hace»). Pasada completa no repetida (ya hecha hoy). Un firmado con sello y firma a la vez no marca la tarea de firmar (el texto solo habla del firmado encima de su documento).
