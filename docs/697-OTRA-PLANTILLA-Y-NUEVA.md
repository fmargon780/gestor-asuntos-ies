# 697 — «Generar documento ▾» nunca se queda sin salida

## Lo que escribió Francisco
«En generar documento en un asunto concreto me ha salido que este tipo de documento no tiene una plantilla asociada. En este caso ralentizaría el trabajo porque supongo que habría que irse a ajustes a cambiar el tipo de asunto.»

«Y si al mostrar todas las plantillas del centro y no hay ninguna que se adecúe a la que necesito, puedo crear una plantilla nueva?»

«Qué ocurre si la que me enseña, porque ya estaba asociada al tipo de asunto, no es la que necesito?»

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- El menú de «Generar documento ▾» de la cabecera del asunto (fila 695) queda siempre igual, tenga el tipo plantillas o no:
  - Primero, las plantillas de documento del tipo del asunto, si las tiene (como hoy).
  - Después, «Otra plantilla…»: enseña todas las plantillas de documento del centro que están en uso, y se busca escribiendo. Al elegir una, se genera como siempre (lo que falta se pregunta antes).
  - Al final, «+ Nueva plantilla…»: abre el editor de plantillas de documento de siempre, ya con el tipo del asunto. Al guardarla queda para ese tipo de asunto y se vuelve al asunto.
- Desaparece el aviso «Este tipo de asunto no tiene plantillas de documento».
- Usar con «Otra plantilla…» una plantilla de otro tipo no la asocia al tipo de este asunto. Asociarla sigue haciéndose en Ajustes.
- Lo generado queda en la carpeta del asunto, sin tarea y sin marcar nada, como en la fila 695.
- En «solo consultar» el botón sigue sin salir.
- Va por delante de los temas con fecha de `docs/PLAN-2026-11.md`: es una pega sobre el último cambio (fila 695).

## Pantalla de prueba
- No se pidió.

## Qué NO se hace en esta tarea
- Cambiar los botones de generar de las tareas ni el menú «Enviar ▾».
- Asociar plantillas a tipos desde el asunto.
- Nada de los temas 691 y 693.

## Notas técnicas de Claude
- El menú se monta en `js/generar-enviar-cabecera.js` (`montarGenerar`), con `PlantillasDocumento.plantillasDelAsunto(a)`.
- Para «Otra plantilla…»: todas las de documento en uso. Regla de `docs/CONTEXTO-CORTO.md`, apartado 6: para ofrecer plantillas, siempre por `Plantillas.documentosDeTipo` (deja fuera las fuera de uso), nunca `datos.documentos` a pelo; mirar su cuarto parámetro `todas` (`js/plantillas.js`) o reunirlas tipo a tipo. En la lista, el nombre con su tipo entre paréntesis, como `textoDe` de `js/guias-plantilla-nueva.js`. Para buscar escribiendo, aprovechar el selector que ya exista (por ejemplo el de «Qué se hace» de la fila 660); un solo cuadro a la vez (`U.preguntar`).
- Para «+ Nueva plantilla…»: el texto es el de `docs/VOCABULARIO.md` (fila 615). Aprovechar `PlantillasDocumento.prepararCuadroDoc` y el aviso de parecidos de `js/lista-nuevo.js` («Usar “X”»), como hace `js/guias-plantilla-nueva.js`; aquí no hay guía abierta, así que hay que ver dónde se enseña el editor sin perder el asunto (cuadro con la regla común `.capa > .cuadro`). Al guardar, repintar el menú.
- Comprobar que generar con una plantilla de otro tipo no falla por datos que el asunto no tiene: lo que falta se pregunta antes.
- Tope de 400 líneas por fichero; si hace falta fichero nuevo, apuntado en su lista `js/cargar-piezas-N.js`.
- Línea en `js/novedades.js`. Prueba nueva. La demostración tiene tipos sin plantillas (FACTURAS, CERTIFICADO) y con ellas (BAJA MEDICA).

## Cómo lo comprueba el segundo revisor
- En un asunto cuyo tipo no tiene plantillas, «Generar documento ▾» enseña «Otra plantilla…» y «+ Nueva plantilla…», y no sale «Este tipo de asunto no tiene plantillas de documento».
- En un asunto cuyo tipo sí tiene, salen primero las suyas y después «Otra plantilla…» y «+ Nueva plantilla…».
- «Otra plantilla…» enseña las plantillas de todos los tipos, se puede buscar escribiendo, y no enseña las que están fuera de uso. Al elegir una de otro tipo, el documento se genera y queda en «Documentos de la carpeta», sin tarea y sin marcar ningún hito ni tarea.
- Tras usar una plantilla de otro tipo, esa plantilla no pasa a salir entre las del tipo de este asunto.
- «+ Nueva plantilla…» abre el editor con el tipo del asunto; al guardar se vuelve al asunto y la plantilla nueva sale en la primera parte del menú, entre las del tipo.
- Con «En este ordenador, solo consultar», el botón no sale.

## Qué mirar al terminar
- Abre un asunto de un tipo sin plantillas y pulsa «Generar documento ▾»: están «Otra plantilla…» y «+ Nueva plantilla…».
- Con «Otra plantilla…», busca una escribiendo y genera el documento.
- Con «+ Nueva plantilla…», crea una y mira que después sale en el menú de ese asunto.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
