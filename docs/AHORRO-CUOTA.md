# Reglas para gastar menos cuota

Acordado el 12 de septiembre de 2026. Léelo antes de trabajar una instrucción de la cola.

Francisco paga la cuota y se le agotó el 97% en tres días. Estas reglas no son opcionales.

## Al leer

- **Lee solo los ficheros que nombre la instrucción**, más `docs/CONTEXTO.md` y `docs/COLA.md`.
  No recorras el repositorio entero ni abras ficheros "por si acaso".
- Si la instrucción no dice qué ficheros tocar, es un fallo de la instrucción: apúntalo y
  búscalos con un `grep` concreto, no leyendo carpetas enteras.

## Al escribir

- **Cambios quirúrgicos.** No reescribas un fichero entero para cambiar unas líneas.
  La regla de "fichero entero, siempre" es para lo que se le enseña a Francisco, no para ti.
- **Si tienes que tocar un fichero que pasa de unas 400 líneas, pártelo** en dos, por módulos,
  y anótalo en `docs/CONTEXTO.md`.
- Agrupa los ficheros de un mismo bloque en **un solo commit**. Cada commit es una publicación
  de Vercel y van en cola.

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
