# 782 — Enviar un papel por la Ventanilla Electrónica

**Título llano:** Los papeles que salen por la Ventanilla Electrónica
**Para qué:** que un tipo de documento pueda decir «se envía a otro centro u organismo por la Ventanilla Electrónica», y que la tarea lo dé por enviado sola cuando llega el registro de salida, sin marcarlo a mano.

## Lo que escribió Francisco
Tema 694 (pasar los tipos al molde nuevo), 27-nov-2026, primera tanda (`docs/notas-diseno/694-tanda-1.md`): el informe personal y el historial académico del traslado se firman y se envían al centro de destino por la Ventanilla Electrónica. Decidido: «Ventanilla Electrónica como vía de envío del recorrido, con "Otro centro u organismo" como destinatario, y "Enviado" solo al llegar el registro de salida: tarea pequeña de este tema, antes de aplicar las guías».

## Lo que entendió Claude (acordado con Francisco el 27-nov-2026)
- En el recorrido de un tipo de documento (Ajustes › tipos de documento), «A quién» ofrece también **«Otro centro u organismo»**, y «Por dónde» ofrece también **«Ventanilla Electrónica»**.
- El resumen del tipo dice, por ejemplo: «Firma: Dirección · se registra de salida · a Otro centro u organismo por Ventanilla Electrónica».
- En la tarea de papel, por la Ventanilla el paso «Enviado» **se marca solo cuando llega el registro de salida** de ese documento: la Ventanilla envía al firmar, y su PDF trae el sello que la app ya lee. No abre ningún correo.
- Mientras no llegue el registro, «Enviado» sale sin hacer, con «Marcar el paso a mano» como hoy.
- «Otro centro u organismo» también vale con las otras vías (por ejemplo, por correo electrónico): entonces el envío funciona como hoy.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Poner estos recorridos en INFORME PERSONAL TRASLADO, HISTORIAL ACADÉMICO, OFICIO y AJUSTE PLANIFICACIÓN: los pondrá la herramienta que pasa los tipos al molde nuevo (tema 694).
- Elegir en cada caso quién firma (idea 778).
- Un recorrido «Nos llega y lo devolvemos resuelto» (idea 777).

## Notas técnicas de Claude
- `js/recorrido-tipo.js`: añadir `'Otro centro u organismo'` a `AQUIEN`, y la vía «Ventanilla Electrónica». Hoy las vías son los sitios de `IDS_VIAS` (`js/sitios.js`); la Ventanilla es una parte del sitio Séneca (`st-seneca`, parte `ventanilla`). Que la vía salga en «Por dónde» con ese nombre sin romper la lista de sitios del centro (un sitio nuevo `st-ventanilla`, o la parte de Séneca como vía; lo decide Claude Code) y que `limpiar` la conserve.
- `js/tarea-papel.js`: con la vía Ventanilla, el paso `enviado` tiene por prueba lo mismo que `registrado` (la ficha del documento trae un registro de salida). `viaEsCorreo` sigue diciendo que no: nunca abre el correo. Mirar `js/papel-enviado.js` para que el envío quede apuntado igual que con «Marcar enviado» (y la espera de la tarea siguiente, fila 723, salte igual).
- Quién recibe: con «Otro centro u organismo», a nadie del asunto en concreto; si la vía es el correo, el correo se abre sin destinatario puesto.
- Pruebas: las de `recorrido` y `tarea-papel`, con un caso de un papel por Ventanilla que recibe su PDF sellado de salida.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En la demostración, el recorrido de un tipo de documento ofrece «Otro centro u organismo» y «Ventanilla Electrónica».
- Una tarea de papel con ese recorrido: al llegar su PDF con el sello de salida, «Registrado» y «Enviado» se marcan solos y la tarea queda hecha.
- Antes de llegar el PDF, «Enviado» se puede marcar a mano.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
