# 717 — El correo de la administración, ya puesto en «Para»

**Título llano:** El correo de la administración sale ya puesto al enviar
**Para qué:** que al enviar un correo desde un asunto cuyo tercero es una administración, el cuadro lleve ya su correo en «Para», sin tener que buscarlo ni escribirlo.

## Lo que escribió Francisco
«Fallo: al enviar un correo desde el asunto no aparece el correo del interesado.»

(19-nov-2026, desde el Centro de mando. Al hablarlo con Claude aclaró que el tercero era una administración, no una empresa.)

## Lo que entendió Claude (acordado con Francisco el 19-nov-2026)
- Tarea pequeña: es arreglar algo que no funciona como estaba previsto.
- En un asunto cuyo tercero es una administración, «Enviar ▾» › «Correo» abre el cuadro con el correo ya puesto en «Para».
- Qué correo: el del departamento del asunto, si el asunto tiene departamento y ese departamento tiene correo; si no, el correo general de la organización. Sin ninguno de los dos, «Para» queda vacío, como hoy.
- La misma dirección no sale dos veces en «Para» (hoy el correo del departamento ya sale como «Quien lo pide»; sigue pudiéndose elegir ahí si hace falta).
- Con alumnado, personal, empresas y demás terceros no cambia nada.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Correos de otros departamentos de la misma administración: quien los quiera, los elige como hasta ahora.
- Empresas y otros terceros: si al reproducir se ve que fallan por otra causa, se dice en la nota de la fila y Claude lo apunta aparte.

## Notas técnicas de Claude
- Primero reproducirlo en la demostración (`?demo=1&auto=1`): un asunto con una administración de tercero, con departamento elegido y con correo; abrir «Enviar ▾» › «Correo» y mirar «Para». Si «Para» ya sale bien, no inventar el arreglo: dejar escrito en «Revisión y respuestas» qué asunto se probó y qué se vio.
- Lo visto en el código (19-nov-2026, sin reproducir): `js/correo-para.js`, `preparar`, saca el correo de «El interesado» solo de `persona.campos` (en una administración, `Correo` es el correo general: `js/administraciones.js`, `persona`). `Administraciones.correoDelAsunto(a)` (departamento primero, luego organización) solo se usa para «Quien lo pide» (`js/correo.js`, `pintarCuadro`). Una administración sin correo general pero con departamento con correo deja «El interesado» sin dirección, y la plantilla (papel `interesado`) no pone a nadie en «Para».
- Arreglo previsto: en `preparar`, para `categoria === 'ADMINISTRACIONES'`, la pastilla «El interesado» toma `Administraciones.correoDelAsunto(a)` si no tiene dirección propia mejor. Cuidar que la dirección no salga dos veces en «Para» (la regla de `correo-para.js`: cada persona en un solo campo).
- Prueba nueva `correo-para-administracion` (con `npm test -- correo-para`): organización con correo, organización sin correo y departamento con correo, y organización sin ningún correo.
- Línea en `js/novedades.js` (cambia algo que se ve).

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- Abre un asunto de una administración que tenga departamento con correo; «Enviar ▾» › «Correo»: ese correo está en «Para».
- Lo mismo con una administración sin departamento: sale el correo general.
- Abre un asunto de un alumno: «Para» sigue como siempre.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
