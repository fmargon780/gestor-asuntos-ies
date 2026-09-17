# Pendientes de diseñar

Ideas aceptadas pero **sin diseñar todavía**. No son instrucciones: no entran en
`docs/COLA.md` hasta que Francisco cierre el diseño en una conversación.

Cuando Francisco pregunte por tareas pendientes de diseñar, se le lee esta lista.

---

## 1. Nombre de documento configurable por tipo de documento, tipo de asunto e hito

**Fecha:** 17-sep-2026.

**La idea.** Que el nombre de un documento no se escriba a mano cada vez. Que salga
propuesto solo, según tres cosas: el tipo de documento, el tipo de asunto en el que
está, y el hito al que pertenece.

**Cómo está hoy.** El nombre se pone en "Gestionar documentos", botón "Poner nombre".
Se elige fecha, tipo de documento y texto adicional. El mismo botón sirve para cambiar
un nombre ya puesto: relee lo que hay y rellena los campos.

**Por qué no está diseñado.** Los hitos no están normalizados. Cada tipo de asunto trae
sus propios pasos, escritos con palabras distintas, y no hay una lista común de hitos a
la que agarrar una regla de nombres. Sin eso, la configuración se volvería una tabla
enorme, una fila por cada combinación.

**Lo que habría que decidir antes de escribir nada:**

- Si primero se normalizan los hitos (una lista común, y cada tipo de asunto elige de
  ella), o si la regla se cuelga del tipo de documento y el hito solo aporta la fecha.
- Dónde se configura: en Ajustes, dentro de cada tipo de asunto, o en una pantalla
  aparte de reglas de nombres.
- Si el nombre propuesto se puede cambiar antes de guardar (previsiblemente sí).
- Qué pasa con los documentos que no cuelgan de ningún hito.
