# 562 — Relacionar a alguien desde el aviso del correo

## Lo que escribió Francisco
Aviso de usuario (algo no funciona) · Gestor de Asuntos · Pantalla: Ficha de un asunto ·
Contexto: copia sin internet · perfil Administración · Envía: Francisco Javier Marmolejo González ·
9-nov-2026 09:10 · Versión: 6-nov-2026 · 14:17

> Al tratar de elegir a quién envío un correo si escribo una dirección que no está en el sistema,
> al dar a enviar nos dice que no se envía porque esa persona no existe.
> El comportamiento creo que debería ser otro. Si no existe en la lista de contactos esa dirección
> o el resultado de esa búsqueda debería dejar crear a esa persona (contacto) en ese momento.

## Lo que entendió Claude (acordado con Francisco el 9-nov-2026)
- No es un fallo: sigue en pie la regla del 6-nov-2026 (tema 487, `docs/REGLAS-NEGOCIO.md`): un
  correo solo va a gente ligada al asunto. No se deja mandar a una dirección suelta.
- La app ya deja darlo de alta con el botón «Relacionar a alguien con el asunto», al pie del cuadro
  de correo, pero no se encuentra: el aviso no dice dónde y lo escrito se pierde.
- En el cuadro «Correo de este asunto», cuando lo escrito en «Para», «Copia» o «Copia oculta» no
  encaja con nadie, el aviso de debajo lleva un botón «Relacionar a alguien con el asunto».
- Ese botón hace lo mismo que el del pie: abre «Añadir un relacionado» y, al terminar, vuelve al
  correo con lo que había (Para, Copia, Copia oculta, plantilla, asunto y cuerpo).
- Si lo escrito es una dirección de correo y se pulsa «+ Dar de alta», la ficha de alta sale con esa
  dirección ya puesta en su casilla de correo.
- Si lo escrito es un nombre, el buscador de «Añadir un relacionado» sale con ese nombre ya escrito.
- El botón del pie del cuadro se queda como está.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- No se deja escribir una dirección suelta sin ficha.
- No cambia el editor de plantillas (usa el mismo campo, pero ahí no sale el botón).

## Notas técnicas de Claude
- `js/campo-destinatarios.js`, `pintarLista`: con `cfg.alRelacionar` (opcional, nuevo), el aviso
  «sin resultado» lleva el botón; al pulsarlo llama a `cfg.alRelacionar(textoEscrito)`. Sin esa
  opción (editor de plantillas, `js/plantilla-papeles.js`), el aviso sigue igual que hoy.
- `js/correo-para.js` (línea ~284, al montar los tres campos): pasar `alRelacionar` que llame a
  `CorreoRelacionar.relacionar(a, texto)`.
- `js/correo-relacionar.js`: `relacionar(a, texto)` pasa el texto a
  `Relacionados.agregarRelacionado(a, texto)`; `js/relacionados.js`, `elegirTercero`: si el texto
  es un nombre, se escribe en el buscador; si es una dirección (`Destinatarios.RE_CORREO`), al dar
  de alta va a la columna de correo de esa categoría (si la categoría no tiene correo, a ninguna).
- Ajustar el texto del aviso para que no diga «relaciónalo antes» sin más: por ejemplo «Nadie de este
  asunto se llama así. Para escribirle, relaciónalo con el asunto:» + botón. Palabras de
  `docs/VOCABULARIO.md`.
- Línea en `js/novedades.js` (cambia algo visible). Ficheros por debajo del límite de líneas.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En un asunto, abre el correo, escribe en «Para» una dirección que no esté: sale el botón en el aviso.
- Púlsalo, da de alta con «+ Dar de alta»: la dirección ya está puesta.
- Al volver al correo, lo que habías escrito sigue ahí y la persona nueva sale al buscarla.

## Revisión y respuestas durante el trabajo
- (9-nov-2026, tarea pequeña: sin segundo revisor; la sesión compara lo hecho con la instrucción, con Chromium real, `pruebas/relacionar-desde-el-aviso.mjs`)
- Coincide: en Para, Copia y Copia oculta, un nombre o una dirección que no encaja con nadie saca en el aviso el botón «Relacionar a alguien con el asunto».
- Coincide: el botón abre «Añadir un relacionado»; al terminar o cancelar vuelve al correo con las pastillas que había.
- Coincide: con una dirección, «+ Dar de alta» abre la ficha con esa dirección en la casilla de correo (Correo / Correo de contacto).
- Coincide: con un nombre, el buscador sale con ese nombre escrito (al elegir la categoría).
- Coincide: el botón del pie del cuadro sigue igual; el editor de plantillas no recibe el botón (no se le pasa la opción).
- Cambio de texto del aviso (lo pedía la nota técnica): «Nadie de este asunto se llama así / tiene esa dirección. Para escribirle, relaciónalo con el asunto:» + botón. Se ajustó la prueba 555 que comprobaba el texto antiguo.
- No lo he podido ver: dar de alta de verdad y que la persona nueva salga al buscarla (la prueba cancela el alta para no tocar datos); y los textos en la app publicada con la copia real.
