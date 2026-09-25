# Fila 150 — La mesa del hito: el «Comunicar» de cada paso, y cambiar el guion desde ahí

Cerrado con Francisco el 25-sep-2026. Dos arreglos en la mesa del hito (la pantalla completa de
un hito, `js/hito-mesa*.js`).

## Qué ha visto Francisco

Asunto de Convalidación o exención, hito 5 «Comunicar a la familia y a la tutoría». En «Qué hay
que hacer» (el guion) hay pasos con su propio botón: «Comunicar» en «Enviarla a la familia por
iPasen» y en «Avisar a la tutoría».

1. **Ese botón «Comunicar» del paso no hace nada.** El «Comunicar ▾» de la cabecera del hito sí
   funciona.
2. **Desde la mesa solo puede «+ Añadir un paso solo para este asunto».** No puede cambiar el
   guion del hito (la lista de pasos que sale en todos los asuntos de ese tipo). Tiene que irse a
   Ajustes, y no lo encuentra.

## Qué hay que hacer

### 1. El «Comunicar» de cada paso

- Pulsarlo abre **lo mismo** que el «Comunicar ▾» de la cabecera del hito: el mismo cuadro, con
  las mismas plantillas y destinatarios. Si el menú de la cabecera ofrece varias vías (correo,
  Séneca…), el botón del paso abre ese mismo menú, no una copia.
- Al terminar de comunicar desde ese botón, **se marca hecho ese paso**, no otro. (Hoy se marca
  solo un paso al comunicar desde la cabecera: mantener eso tal cual.)
- Buscar por qué el botón está muerto (manejador que no se engancha, que se pierde al repintar la
  tarjeta, o nombre de función que no existe) y arreglar la causa. Mirar si los otros botones de
  paso («Registrar…», «Generar…») tienen el mismo fallo; si sí, arreglarlos en el mismo cambio.

### 2. Cambiar el guion desde la mesa

- Debajo del guion, junto a «+ Añadir un paso solo para este asunto», un segundo enlace:
  **«✎ Cambiar el guion de este hito (para todos los asuntos de este tipo)»**.
- Abre el editor del guion de ese hito **en la misma mesa** (en la tarjeta del guion, o en un
  cuadro encima), sin salir a Ajustes. Reutilizar el editor que ya existe en Ajustes; no hacer
  otro.
- Se pueden cambiar el texto de los pasos, su orden, borrarlos y añadirlos, igual que en Ajustes.
- Al guardar: el cambio va a la guía del tipo y llega a los asuntos abiertos de ese tipo, como ya
  pasa hoy con los pasos nuevos de una guía. Los pasos ya marcados en un asunto no se desmarcan.
- Si la guía del tipo es de la biblioteca del centro, se guarda igual en la guía del tipo (no en
  la biblioteca).

## Ficheros que hay que tocar

- `js/hito-mesa-guion.js` (los botones de cada paso y el enlace nuevo)
- `js/hito-mesa-comunicar.js` (que el botón del paso use lo mismo que la cabecera)
- `js/hito-mesa.js` solo si hace falta el punto de enganche
- `js/hitos-guion.js` y/o `js/guias-guion.js` (el editor del guion que ya existe, para reutilizarlo)
- Una prueba en `pruebas/`: pulsar el «Comunicar» de un paso abre el cuadro y, al enviar, marca ese
  paso; y el enlace nuevo abre el editor y guarda un cambio que se ve en otro asunto abierto del
  mismo tipo.
- `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` de hitos y `docs/HISTORIA.md`.

## Cómo trabajar

- No leas el repositorio entero: solo `docs/CONTEXTO.md`, el hijo de hitos de `docs/contexto/` y
  los ficheros de arriba.
- Cambios quirúrgicos; no reescribas ficheros enteros. Ningún fichero de `js/` pasa de 600 líneas:
  si alguno se acerca, pártelo.
- Una sola prueba al final (`npm test`).
- Sube a `main`, sin pull request (si la sesión solo puede con pull request, fusiónalo tú en verde,
  según el permiso permanente). Máximo dos subidas (regla 13 de la cola).
- Comprueba con `curl` lo publicado.
