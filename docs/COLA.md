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
8. Al terminar cualquier instrucción: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`
   **sustituyendo la línea vieja, no añadiendo una debajo**. Si algo deja de ser verdad, se borra.
9. Añade a `docs/HISTORIA.md` lo que merezca recordarse, con su fecha. No dejes que
   `docs/CONTEXTO-CORTO.md` pase de 160 líneas.

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
| 1 | `docs/PLAN-ROBUSTEZ-2026-09.md` | HECHA | Copias de seguridad, conflictos de Dropbox, pruebas automáticas, fichas sin carpeta y nombres repetidos. Versión publicada `11-sep-2026 · 05:33`. Detalle en `docs/HISTORIA.md` |
| 2 | `docs/REGISTRO-EN-UN-PASO.md` | HECHA | Botón Registrar sin nombrar dos veces, con lectura sola del sello de Séneca. Comprobado 11-sep-2026. Detalle en `docs/HISTORIA.md` |
| 3 | `docs/CAMPOS-POR-TIPO.md` | HECHA | Campos propios por tipo de asunto, configurables en Ajustes. Versión publicada `11-sep-2026 · 12:00`. Detalle en `docs/HISTORIA.md` |
| 4 | `docs/TERCEROS-RELACIONADOS.md` | HECHA | Personas y entidades relacionadas con un asunto, con nota (no copia) al archivar. Versión publicada `11-sep-2026 · 12:00`. Detalle en `docs/HISTORIA.md` |
| 5 | `docs/NO-DUPLICAR-ASUNTOS.md` | HECHA | Parada al crear un asunto duplicado, y unir los que ya existían. Versión publicada `11-sep-2026 · 13:08`. Detalle en `docs/HISTORIA.md` |
| 6 | `docs/AJUSTES-AGIL.md` | HECHA | Pestañas, buscador cruzado y aviso en vivo en Ajustes; barra lateral fija. Versión publicada `11-sep-2026 · 14:58`. Detalle en `docs/HISTORIA.md` |
| 7 | `docs/PAPELERA.md` | HECHA | Papelera compartida: nada se borra del todo a la primera. Versión publicada `11-sep-2026 · 16:20`. Detalle en `docs/HISTORIA.md` |
| 8 | `docs/UNIR-VER-DENTRO.md` | HECHA | Pantalla propia "Duplicados", con "No son el mismo". Versión publicada `11-sep-2026 · 17:15`. Detalle en `docs/HISTORIA.md` |
| 9 | `docs/REPARTO-CONTEXTO.md` | HECHA | Repartido `CONTEXTO.md` en `CONTEXTO-CORTO.md`, `CONTEXTO.md` y `HISTORIA.md`, y podada esta cola; no toca código ni publica nada nuevo. |
