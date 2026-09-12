# Cola de instrucciones para Claude Code

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.

## Reglas para Claude Code

1. Lee antes `docs/CONTEXTO-CORTO.md` y `docs/AHORRO-CUOTA.md`. `docs/CONTEXTO.md` solo si vas
   a tocar un módulo concreto.
2. Coge la primera instrucción **PENDIENTE**. Cámbiala a **EN CURSO** con la fecha y sube ese
   cambio en el primer commit. Si encuentras una EN CURSO de otra sesión, sáltala.
3. Antes de empezar, comprueba si ya está hecha por otro camino. Si lo está, márcala **HECHA**
   y pasa a la siguiente.
4. **Sube siempre a `main`. No abras ninguna petición de cambios y no crees ramas nuevas.**
5. Al terminar una, márcala **HECHA** con la fecha y la versión publicada. La nota es de **una
   sola línea**; el detalle va a `docs/HISTORIA.md`.
6. Si no puede completarse, márcala **BLOQUEADA** con el motivo en una línea y sigue.
   Nunca dejes el repositorio con las pruebas en rojo.
7. Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, y
   añade el relato a `docs/HISTORIA.md`.
8. No preguntes nada a Francisco. Al final, un mensaje corto: qué has hecho, la versión
   publicada y qué va a ver distinto en pantalla.

## Reglas para Francisco

- Mientras Claude Code trabaja, no se lanza otra vez. Las instrucciones nuevas esperan aquí.
- Cuando termina, se vuelve a pegar la misma línea. Si no queda nada, lo dice y no toca nada.

## La línea para lanzar

    Lee docs/CONTEXTO-CORTO.md, docs/AHORRO-CUOTA.md y docs/COLA.md. Haz en orden todo lo que esté PENDIENTE, siguiendo las reglas de la cola, sin preguntarme nada. Sube a main, sin abrir ninguna petición de cambios. Al terminar, dime en pocas frases qué has hecho, qué versión está publicada y qué voy a ver distinto en pantalla.

## La cola

| Nº | Instrucción | Estado | Notas |
|---|---|---|---|
| | | | |
