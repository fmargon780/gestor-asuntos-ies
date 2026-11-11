# 609 — Avisar cuando la carpeta no queda señalada

## Lo que escribió el usuario (aviso de soporte, 11-nov-2026 08:36)

> Aviso de usuario (algo no funciona)
> App: Gestor de Asuntos · Pantalla: Inicio · Contexto: copia sin internet · perfil Administración
> Quién lo envía: Francisco Javier Marmolejo González · Versión de la app: 10-nov-2026 · 21:35
>
> Diego en el día de ayer borró los datos de navegación, caché y demás del navegador donde tiene la
> cuenta 29700692.administracion@g.educaand.es. Hoy al iniciar no le recuerda la elección de carpetas
> ni el nombre. Al elegir de nuevo la primera de las carpetas no se la guarda y no puede iniciar la app.
> Yo en mi ordenador teniendo el mismo perfil de chrome no tengo ese problema.

## Lo que entendió Claude (acordado con Francisco el 11-nov-2026)

- Diego elige la carpeta en el cuadro de Chrome, lo ha intentado dos veces con cada una, y en la
  pantalla de entrada no cambia nada: la carpeta sigue «Sin señalar» y no sale ningún aviso.
- Ese es el único caso que la app calla a propósito: cuando Chrome devuelve «cancelado», la app lo
  toma como que la persona cerró el cuadro sin elegir. No se sabe por qué Chrome lo da por cancelado
  en ese ordenador; esta tarea sirve para saberlo.
- Desde ahora, en la pantalla de entrada, cuando se pulsa el botón de una de las dos carpetas y la
  carpeta no queda señalada, sale siempre un aviso en rojo, también si Chrome dice «cancelado»:
  «La carpeta no ha quedado señalada. Chrome dice: <lo que diga Chrome, tal cual>. Si has cerrado el
  cuadro tú, no pasa nada; si no, manda este aviso con el botón «Soporte».»
- En los demás fallos de ese paso sale el aviso de hoy, añadiendo también lo que dice Chrome tal cual.
- Si la carpeta sí se señala pero no se puede recordar para la próxima vez, sale un aviso ámbar:
  «La carpeta está señalada, pero este navegador no la va a recordar. Chrome dice: <…>». Se puede
  entrar igual.
- Lo demás de la pantalla de entrada no cambia.

## Pantalla de prueba

- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea

- Arreglar la causa en el ordenador de Diego: se sabrá con el aviso nuevo y irá en otra fila.

## Notas técnicas de Claude

- `App.pedirCarpeta` (`js/nucleo.js`): hoy `catch (e) { if (e.name === 'AbortError') return; … }`.
  El `AbortError` pasa a avisar con `U.aviso(…, 'malo')`. El texto de Chrome es `e.name + ': ' +
  e.message`; además `console.warn` con el error entero.
- Separar el `Almacen.guardar` en su propio `try`: si falla, `U.accesorio`/aviso ámbar con su texto,
  sin deshacer lo señalado (la carpeta ya está en `App.E` y «Entrar» se enciende).
- Mismo trato a `btn-archivo` (comparte `App.pedirCarpeta`). No tocar otros sitios que llaman a
  `Carpetas.elegir` (Ajustes, Drive, bandeja…).
- Línea en `js/novedades.js` (cambia algo visible).

## Cómo lo comprueba el segundo revisor

- Tarea pequeña: sin segundo revisor. Claude Code lo comprueba con una prueba que sustituye
  `showDirectoryPicker` por uno que lanza `AbortError`, otro que lanza `NotAllowedError` y uno que
  funciona con `Almacen.guardar` fallando, y mira los tres avisos y el estado de «Entrar».

## Qué mirar al terminar

- En el ordenador de Diego, abrir la app, pulsar el botón de la primera carpeta y elegirla: debe
  salir el aviso rojo con lo que dice Chrome. Mandarlo con «Soporte» (o una foto).

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
