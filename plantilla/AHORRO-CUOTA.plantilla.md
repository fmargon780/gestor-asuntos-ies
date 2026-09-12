# Reglas para gastar menos cuota

Léelo antes de trabajar una instrucción de la cola. Estas reglas no son opcionales.

## Al leer

- **Empieza por `docs/CONTEXTO-CORTO.md`.** Abre `docs/CONTEXTO.md` solo si necesitas el
  detalle técnico de un módulo que vas a tocar. `docs/HISTORIA.md` no se lee casi nunca.
- **Lee solo los ficheros que nombre la instrucción**, más los anteriores y `docs/COLA.md`.
  No recorras el repositorio entero ni abras ficheros "por si acaso".
- Si la instrucción no dice qué ficheros tocar, apúntalo y búscalos con un `grep` concreto.

## Al escribir

- **Sube directamente a la rama `main`.** No abras peticiones de cambios y no crees ramas.
  Una petición en borrador deja el trabajo sin publicar.
- **Cambios quirúrgicos.** No reescribas un fichero entero para cambiar unas líneas.
- **Si tienes que tocar un fichero que pasa de unas 400 líneas, pártelo** primero.
- Agrupa los ficheros de un mismo bloque en **un solo commit**.

## Al actualizar la documentación

- `CONTEXTO-CORTO.md` y `CONTEXTO.md` se mantienen **sustituyendo la línea vieja, nunca
  añadiendo una debajo**.
- El relato con fecha va a `HISTORIA.md`.
- `CONTEXTO-CORTO.md` no pasa nunca de 160 líneas.

## Al comprobar

- **Una tanda de pruebas al final**, no una después de cada cambio.
- No pegues registros largos en el mensaje final.

## Al terminar

- Mensaje corto: qué has hecho, qué versión está publicada, si las pruebas están en verde y
  qué va a ver distinto en pantalla. Nada más.

## Modelo

Este trabajo se hace con **Sonnet**, no con Opus. Opus se reserva para las conversaciones de
diseño con Francisco.
