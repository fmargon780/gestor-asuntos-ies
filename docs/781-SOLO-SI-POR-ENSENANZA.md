# 781 — «Solo si» también por la enseñanza del alumno

**Título llano:** Que una tarea salga solo para el alumnado de una enseñanza
**Para qué:** que en la guía se pueda decir «esta tarea, solo si el alumno es de ESO» (por ejemplo, el certificado de devolución de libros), sin tener que rellenar un dato a mano en cada asunto.

## Lo que escribió Francisco
Tema 694 (pasar los tipos al molde nuevo), 27-nov-2026, primera tanda (`docs/notas-diseno/694-tanda-1.md`, duda de ANULACIÓN): el certificado de entrega de libros solo va en ESO. Decidido: «Solo si» mirará también la enseñanza del alumno, sacada sola de su unidad (Centro de datos), igual que mira la clase del tercero; sin unidad, la tarea sale y se marca «No aplica». Es una tarea pequeña de este tema, antes de aplicar las guías (Francisco: «Sí»).

## Lo que entendió Claude (acordado con Francisco el 27-nov-2026)
- En la guía de un tipo «sin hitos», en «Cuándo se hace» › «Solo si», se puede elegir **«Enseñanza del alumno»**, igual que hoy se elige «Clase del tercero» (fila 701).
- Sus valores: **E.S.O.**, **Bachillerato** y **Formación Profesional**. La Diversificación cuenta como E.S.O. (es parte de la ESO).
- La etiqueta amarilla dice «Solo si el alumno es de E.S.O.» (o de las enseñanzas marcadas, unidas con «o»).
- En el asunto, la enseñanza sale sola de la unidad del alumno: la del asunto si la tiene; si no, la del Centro de datos (la de este curso o, si ya no está matriculado, la última).
- Si el tercero no es un alumno, o no se sabe su unidad, la tarea sale con la marca amarilla «Falta: Enseñanza del alumno», como cualquier otro dato que falta, y se puede marcar «No aplica».
- Si es de otra enseñanza, la tarea no sale (como hoy con «Solo si»).

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba (copia lo que ya hace «Clase del tercero»).

## Qué NO se hace en esta tarea
- Poner el «Solo si» en las guías de ANULACIÓN MATRÍCULA y TRAS. MATR. VIVA: lo hará la herramienta que pasa los tipos al molde nuevo (tema 694).
- «Solo si» por nivel (1.º, 2.º…): no se ha pedido.

## Notas técnicas de Claude
- `js/solo-si.js`: un segundo nombre fijo, como `CAMPO_TERCERO` (fila 701): `CAMPO_ENSENANZA = 'Enseñanza del alumno'`, con sus valores en `camposLista` y su valor en `campos` dentro de `valoresDe`. Solo en tipos «sin hitos», como el de la clase del tercero.
- La enseñanza con `Nombres.nivelYEnsenanza(unidad).ensenanza` (`js/nombres-montar.js`); «PMAR» (diversificación) se lee como «E.S.O.». No cambiar `ENSENANZA_DE_ETAPA` (lo usan los grupos de alumnado): la equivalencia va solo aquí.
- La unidad: la de la ficha del asunto (`ficha.grupo` si es texto) o la del alumno en el Centro de datos (`persona.unidad || persona.unidadUltima`, como `{grupo}` en `js/plantillas-valores.js`, fila 525). `valoresDe` es síncrono: la unidad del Centro de datos tiene que estar ya en memoria (cargarla al abrir el asunto, o guardarla en la ficha al crearlo); que no haga falta un `await` en `marcarTodo`.
- Etiqueta en `etiqueta()`: «Solo si el alumno es de …».
- Pruebas: las de `solo-si` y un caso nuevo en `docs/CASOS-DE-PRUEBA.md` (alumno de ESO, de Bachillerato y sin unidad).

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En la demostración, en la guía de un tipo «sin hitos» de alumnado, «Solo si» ofrece «Enseñanza del alumno» con E.S.O., Bachillerato y Formación Profesional.
- Con «Solo si: E.S.O.», un asunto de un alumno de 3.º de ESO enseña la tarea; uno de 1.º de Bachillerato no.
- Un asunto de un alumno de Diversificación la enseña.
- Un asunto sin unidad enseña la tarea con «Falta: Enseñanza del alumno».

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
