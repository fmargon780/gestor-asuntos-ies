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

## 2. El equipo usa el gestor sin entrar en él («camino 1»)

**Fecha:** 26-sep-2026. Sale de `claude/Analisis-estabilidad-crecimiento-2026-09-26.md`
(proyecto de Claude). Decidido con Francisco: dirección quiere que el equipo **consulte y encargue**,
no que tramite. La app no se abre a más usuarios; Administración sigue siendo la única que escribe.

**La idea.** El resto del centro se relaciona con los asuntos por correo. Son tres piezas, cada una
una conversación de diseño y una fila de la cola:

1. **Aviso automático a quien lo pidió** («Lo pide» ya guarda su correo) cuando el asunto cambia de
   hito o se cierra. Texto corto, con el paso en el que está.
2. **Resumen de estado con un clic**, desde la ficha o la mesa: «Tu asunto va por el paso 3 de 7:
   pendiente de firma», por correo a quien lo pidió o a quien se elija.
3. **Informe periódico para dirección** por correo (lo que hoy es «Cuentas» y «Qué me toca», por
   órgano), sin que dirección tenga que entrar en la app.

**Lo que habría que decidir antes de escribir nada:** si el aviso del punto 1 sale solo o se
confirma antes; qué plantilla usa cada pieza; cada cuánto y a quién va el informe del punto 3; y si
la entrada de encargos con datos (un formulario que llegue por correo con etiqueta) se diseña ya o
se espera a la cuenta de correo común del centro.

**Va después** de la tanda de estabilidad (filas 176-178) y de las tandas 2 y 3 de usabilidad.
