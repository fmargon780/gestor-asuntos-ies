# Fila 153 — «Enviar» de un documento: por correo o por Séneca

Cerrado con Francisco el 25-sep-2026.

## Qué ha visto Francisco

Asunto de Convalidación o exención, hito 5 «Comunicar a la familia y a la tutoría», tarjeta
«Documentos del hito». Cada documento tiene los enlaces «Abrir» y «Enviar». **«Enviar» solo abre
el cuadro de Correo.** No hay forma de mandar ese documento por Séneca desde ahí, y precisamente
el guion de ese hito dice «Enviarla a la familia por iPasen» (los mensajes de iPasen salen de
Séneca).

## Qué hay que hacer

- «Enviar» de cada documento pasa a ser **«Enviar ▾»**: un menú pequeño con dos opciones,
  **«Por correo»** y **«Por Séneca»**.
- Las dos opciones abren **lo mismo** que las opciones de «Comunicar ▾» de la cabecera del hito
  (el mismo cuadro, las mismas plantillas, los mismos destinatarios), pero con **ese documento ya
  elegido**:
  - Por correo: el documento ya va adjunto (como hoy).
  - Por Séneca: el cuadro de Séneca de siempre (`js/seneca-cuadro.js`), con el documento ya
    señalado como el que hay que adjuntar. Séneca no deja enviar desde fuera: la app prepara el
    mensaje y deja el documento a mano para adjuntarlo, igual que ya hace hoy el cuadro de Séneca
    (ruta del fichero con el botón «Ruta», o lo que ya use el cuadro para adjuntos).
- Al dar por enviado desde ese menú, se marca solo el paso del guion que corresponda, con la misma
  regla que ya se usa al comunicar desde la cabecera (fila 150). En el caso de Francisco:
  «Enviarla a la familia por iPasen» al enviarlo por Séneca.
- Queda anotado en el historial del hito y en la vía de comunicación, como cualquier comunicación
  hecha desde la cabecera.
- Si el mismo enlace «Enviar» de un documento existe en otro sitio (pestaña «Documentos de la
  carpeta» de la ficha, menú «···» del documento), que se comporte igual. No hacer una copia del
  menú: una sola función, usada en todos los sitios.
- Si la fila 150 ya dejó un punto común para abrir «Comunicar» desde fuera de la cabecera,
  usarlo. Si no, crearlo en `js/hito-mesa-comunicar.js` y usarlo desde aquí.

## Ficheros que hay que tocar

- `js/hito-mesa-documentos.js` (el enlace «Enviar» de cada documento → menú)
- `js/hito-mesa-comunicar.js` (abrir Correo o Séneca con un documento ya elegido)
- `js/hitos-documento-menu.js` y `js/ficha-documentos.js`, solo si también tienen «Enviar»
- `js/seneca-cuadro.js`, solo si no admite todavía un documento ya elegido al abrirse
- Una prueba en `pruebas/`: en la mesa del hito, «Enviar ▾ → Por Séneca» de un documento abre el
  cuadro de Séneca con ese documento señalado y, al darlo por enviado, marca el paso del guion.
- `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de hitos de `docs/contexto/` y `docs/HISTORIA.md`.

## Cómo trabajar

- Hazla **después de la fila 150** (toca los mismos ficheros).
- No leas el repositorio entero: solo `docs/CONTEXTO.md`, el hijo de hitos de `docs/contexto/` y
  los ficheros de arriba.
- Cambios quirúrgicos; no reescribas ficheros enteros. Ningún fichero de `js/` pasa de 600 líneas.
- Una sola prueba al final (`npm test`).
- Sube a `main`, sin pull request (si la sesión solo puede con pull request, fusiónalo tú en verde,
  según el permiso permanente). Máximo dos subidas (regla 13 de la cola).
- Comprueba con `curl` lo publicado.
