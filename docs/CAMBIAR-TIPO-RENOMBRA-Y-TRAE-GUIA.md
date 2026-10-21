# Cambiar el tipo de un asunto: renombrar la carpeta y ofrecer la guía (fila 408)

Aviso de usuario del 21-oct-2026, desde el botón de soporte (pantalla Inicio, copia sin internet,
perfil Administración, versión 21-oct-2026 · 11:28): «He cambiado el tipo de asunto a Expulsión
del Centro, y la etiqueta vista desde dentro del asunto es esa, pero en la de fuera no se ha
cambiado. Tampoco se ha cambiado el nombre del asunto ni el nombre de la carpeta.» Francisco añade
después: la guía tampoco ha cambiado. No recuerda si le salió la pregunta de traer la guía nueva.
Aviso completo y captura:
https://drive.google.com/file/d/1zWRjZwZxzblfOOiuXk6DMP-IB6AMyOs0/view?usp=drivesdk

## Qué debería pasar (ya estaba así diseñado)

Al cambiar el tipo de un asunto abierto desde «Editar» (`js/asuntos-editar.js`, `guardarEdicion`):

- la carpeta se renombra con el tipo nuevo (fila 94, `docs/CAMBIAR-EL-TIPO-CAMBIA-LA-GUIA.md`);
- la ficha y los hitos viajan con ella (`AsuntoRenombrar.mover`);
- la lista de Inicio sale con el tipo nuevo;
- se ofrece traer la guía del tipo nuevo sin perder lo hecho (`HitosCambioDeTipo.ofrecer`).

En el caso del aviso solo cambió el tipo guardado en la ficha. Nada más.

## Por qué pasa

Sin confirmar: hay que averiguarlo antes de arreglar. Pista: si el nombre montado sale igual al
de antes (`nombreNuevo === a.nombre`), `guardarEdicion` solo anota la ficha y no renombra; y la
oferta de la guía depende de que `p.tipo` (el tipo de antes) y `d.tipo` (el nuevo) sean
distintos. Mira también el camino del tipo en una línea (fila 257, `js/tipo-en-linea.js`), cómo
se monta el nombre de los asuntos con número (fila 239, `A26-…`, `Nombres.montarAsunto`,
`Nombres.tipoParaCarpeta`) y si la copia sin internet hace algo distinto. Escribe en la nota de
la fila la causa encontrada, en una línea.

## Qué hay que hacer

1. **Arreglar el cambio de tipo.** Al guardar un asunto con otro tipo, siempre:
   - la carpeta pasa a llamarse con el tipo nuevo. **Solo cambia el tipo dentro del nombre**: la
     fecha, el número del asunto (A26-…) y el tercero se quedan igual (decidido por Francisco);
   - la etiqueta de Inicio muestra el tipo nuevo;
   - sale la pregunta de traer la guía del tipo nuevo, como hoy (sin perder hitos ni tareas hechas).
     Se mantienen las excepciones de hoy: sin hitos, o con un tipo nuevo sin guía, no hay pregunta
     y sale el aviso de siempre.
2. **Poner al día los asuntos que ya quedaron mal.** Al entrar en la app, se buscan los asuntos
   abiertos cuyo tipo de la ficha no coincide con el tipo del nombre de su carpeta. A cada uno se
   le renombra la carpeta con el tipo de la ficha (mismas reglas del punto 1: solo cambia el
   tipo). Después se pregunta, asunto por asunto, si traer la guía del tipo nuevo, con el mismo
   cuadro de `HitosCambioDeTipo.ofrecer`.
   - Manda el tipo de la ficha, no el del nombre.
   - Solo cuentan los asuntos cuyo tipo es **otro tipo de verdad**. Un nombre corto que cambió en
     Ajustes después de crear la carpeta no cuenta: esas carpetas no se tocan (fila 79).
   - Los documentos de dentro no se renombran: solo la carpeta del asunto.
   - Si el nombre nuevo pasa del tope de longitud (`js/nombres-topes.js`), se aplica la misma
     regla que al editar un asunto hoy.
   - Si el renombrado choca con otra carpeta que ya se llama así, ese asunto se deja como está y
     se avisa en ámbar con su nombre. Los demás siguen.
   - En el modo «solo consultar» (fila 260) no se renombra nada.
   - La pregunta de la guía le sale a la primera persona que entre con permiso para cambiar
     asuntos (no en «solo consultar»). En cuanto conteste, sí o no («Dejar los hitos como
     están» cuenta como no), ese asunto queda resuelto y no se pregunta a nadie más; la marca se
     guarda en la ficha del asunto, no en el ordenador (decidido por Francisco).
3. **Prueba automática** que reproduzca el fallo con un asunto con número (formato
   `AAMMDD A26-NNNN TIPO Tercero`): falla antes del arreglo y pasa después. Otra para la puesta
   al día del punto 2.

## Ejemplo con datos reales

Asunto de Francisco, hoy en su carpeta de abiertos:
`261020 A26-0465 EXPULSIÓN AULA CONVIVEN Baute De Armas, Álvaro Linkimp 9015476`.
Su ficha ya dice tipo «Expulsión del Centro». Tras el arreglo, al entrar, su carpeta debe pasar a
`261020 A26-0465 <nombre corto de Expulsión del Centro> Baute De Armas, Álvaro Linkimp 9015476`
(el nombre corto es el que tenga ese tipo en Ajustes). No toques esa carpeta desde la sesión: es
la prueba de Francisco. Reprodúcelo en el modo de demostración con un asunto equivalente.

## Cómo sabré que está bien

1. **[SOLO FRANCISCO]** En Inicio, el asunto A26-0465 de Álvaro Baute sale con el tipo
   «Expulsión del Centro» (con su nombre corto, si lo tiene, como cualquier tipo en Inicio).
2. **[SOLO FRANCISCO]** Su carpeta conserva la fecha 261020, el número A26-0465 y el alumno. Solo
   cambia el tipo.
3. **[SOLO FRANCISCO]** Al entrar en la app, le pregunta si traer la guía de «Expulsión del
   Centro» a ese asunto. Lo ya hecho en sus hitos sigue ahí.
4. Si se cambia el tipo de cualquier otro asunto desde Editar, cambian a la vez la etiqueta de
   Inicio y el nombre de la carpeta, y sale la pregunta de la guía. (El revisor lo pasa en el modo
   de demostración, con un asunto con número A26-….)
