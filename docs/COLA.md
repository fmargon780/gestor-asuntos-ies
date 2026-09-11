# Cola de instrucciones para Claude Code

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

## Reglas para Claude Code

1. Lee antes `docs/CONTEXTO.md`.
2. Coge la primera instrucción con estado **PENDIENTE**. Cámbiala a **EN CURSO** con la fecha y
   sube ese cambio en el primer commit del trabajo. Así, si otra sesión abre esta cola, sabe que
   ya hay alguien con ella y no la repite.
3. Antes de empezar una instrucción, comprueba si ya está hecha por otro camino (mira si existen
   los ficheros o funciones que pide). Si ya está hecha, márcala **HECHA** con una nota y pasa a
   la siguiente.
4. Al terminar una, márcala **HECHA** con la fecha y la versión publicada, y sigue con la
   siguiente PENDIENTE. No pares hasta que no quede ninguna.
5. Si una instrucción no puede completarse, márcala **BLOQUEADA** con el motivo en una línea y
   sigue con la siguiente. Nunca dejes el repositorio con las pruebas en rojo.
6. Si encuentras una instrucción **EN CURSO** de otra sesión y no eres tú quien la empezó,
   sáltala y coge la siguiente PENDIENTE.
7. No preguntes nada a Francisco. Al final, un mensaje corto: qué instrucciones has hecho, la
   versión publicada, y qué va a ver distinto en pantalla.

## Reglas para Francisco

- Mientras Claude Code está trabajando, **no se lanza otra vez**. Las instrucciones nuevas se
  apuntan aquí y esperan.
- Cuando Claude Code termina, se vuelve a pegar la misma línea. Si no queda nada pendiente,
  Claude Code lo dice y no toca nada.

## La línea para lanzar

    Lee docs/CONTEXTO.md y después docs/COLA.md. Haz en orden todo lo que esté PENDIENTE, siguiendo las reglas de la cola, sin preguntarme nada. Al terminar, dime en pocas frases qué has hecho, qué versión está publicada y qué voy a ver distinto en pantalla.

## La cola

| Nº | Instrucción | Estado | Notas |
|---|---|---|---|
| 1 | `docs/PLAN-ROBUSTEZ-2026-09.md` | HECHA | Ya estaba hecho antes de apuntarse aquí (PR #4, fusionada 11-sep-2026 03:50): copias de seguridad y fichero roto, conflictos de Dropbox, pruebas automáticas en GitHub Actions, fichas sin carpeta, nombres repetidos y documentación. Comprobado de nuevo el 11-sep-2026: ficheros y pruebas en el repo, versión publicada `11-sep-2026 · 05:33` |
| 2 | `docs/REGISTRO-EN-UN-PASO.md` | HECHA | Ya estaba hecho antes de apuntarse aquí (PR #5, fusionada 11-sep-2026 05:01): botón Registrar sin nombrar dos veces, casilla "Pendiente de registro" y lectura sola del sello de Séneca en el PDF. Comprobado de nuevo el 11-sep-2026 |
| 3 | `docs/CAMPOS-POR-TIPO.md` | PENDIENTE | Campos asociados a cada tipo de asunto: salen de la cabecera del CSV de su categoría, calculados o propios; obligatorios u opcionales; se rellenan solos y van al nombre, con casilla para dejarlos fuera en un asunto concreto. Diseño cerrado con Francisco el 11-sep-2026 |
