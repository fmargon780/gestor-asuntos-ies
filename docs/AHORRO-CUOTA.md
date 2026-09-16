# Reglas para gastar menos cuota

Acordado el 12 de septiembre de 2026. Léelo antes de trabajar una instrucción de la cola.

Francisco paga la cuota y se le agotó el 97% en tres días. Estas reglas no son opcionales.

## Al leer

- **Empieza por `docs/CONTEXTO-CORTO.md`.** Abre `docs/CONTEXTO.md` solo si necesitas el
  detalle técnico de un módulo que vas a tocar. `docs/HISTORIA.md` no se lee casi nunca.
- **Lee solo los ficheros que nombre la instrucción**, más los dos anteriores y `docs/COLA.md`.
  No recorras el repositorio entero ni abras ficheros "por si acaso".
- Si la instrucción no dice qué ficheros tocar, es un fallo de la instrucción: apúntalo y
  búscalos con un `grep` concreto, no leyendo carpetas enteras.

## Al escribir

- **Sube directamente a la rama `main`.** No abras una pull request y no crees una rama nueva.
  Una PR en borrador deja el trabajo sin publicar y obliga a otra intervención.
  **Excepción**: si el propio entorno de ejecución (por ejemplo, Claude Code en la nube) obliga a
  trabajar en una rama concreta y a abrir pull request, eso manda sobre esta regla; dilo claro en
  el mensaje final, para que Francisco sepa que hace falta fusionar el pull request antes de que
  Vercel publique nada.
- **Cambios quirúrgicos.** No reescribas un fichero entero para cambiar unas líneas.
  La regla de "fichero entero, siempre" es para lo que se le enseña a Francisco, no para ti.
- **Si tienes que tocar un fichero que pasa de unas 400 líneas, pártelo** en dos, por módulos.
- Agrupa los ficheros de un mismo bloque en **un solo commit**. Cada commit es una publicación
  de Vercel y van en cola.

## Al actualizar la documentación

- `CONTEXTO-CORTO.md` y `CONTEXTO.md` se mantienen **sustituyendo la línea vieja, nunca
  añadiendo una debajo**. Si algo deja de ser verdad, se borra.
- El relato con fecha va a `HISTORIA.md`.
- `CONTEXTO-CORTO.md` no pasa nunca de 160 líneas.

## Al comprobar

- **Una tanda de pruebas al final**, no una después de cada cambio.
- Comprueba lo publicado con un solo `curl` por fichero tocado, no en bucle.
- No pegues registros largos en el mensaje final.

## Al terminar

- Mensaje corto para Francisco: qué has hecho, qué versión está publicada, si las pruebas están
  en verde y qué va a ver distinto en pantalla. Nada más.

## Modelo

Este trabajo se hace con **Sonnet**, no con Opus. Opus se reserva para las conversaciones de
diseño con Francisco.
