# 705 — El papel: enviar y «Marcar enviado»

Parte del tema 692 (el molde nuevo). Va detrás de la fila 704.

## Lo que escribió Francisco
Eligió «1»: «enviado» sin prueba se apunta con el botón «Marcar enviado».

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- El paso «Enviado» lleva su botón según el «Por dónde» del recorrido del tipo.
- **Por correo electrónico: «Enviar correo».** Abre el correo a quien dice el recorrido (Familia, Interesado, Quien lo pide, Tutor/a del grupo o Personas relacionadas), con el documento adjunto. Cuando el correo sale de verdad, la app apunta sola el paso.
- **En mano, correo postal, tablón e iPasen: «Marcar enviado».** Apunta sola quién, el día de hoy y la vía del recorrido, sin abrir ninguna ventana.
- El día y la vía se corrigen desde el ⋮ de la tarea.
- En el Registro queda una línea: «Enviado en mano a la familia · Francisco · 17-nov».
- Con «Enviado» hecho, la tarea de papel queda hecha.

**No estaba en la pantalla de prueba; lo propuso Claude y Francisco lo aprobó el 17-nov-2026 («1»):**
- «Enviar correo» usa la plantilla de correo del tipo de asunto que adjunta ese tipo de documento; si hay varias, deja elegir; si no hay ninguna, abre el correo sin plantilla, con el destinatario y el adjunto puestos.
- Si el correo se cierra sin enviar, no se apunta nada.
- Tras enviar, en un asunto sin hitos no se ofrece «Dejar el asunto esperando a…»: si hace falta esperar respuesta, se pone desde otra tarea.
- Un mensaje por iPasen se sigue mandando con «Enviar ▾» de la cabecera; después se pulsa «Marcar enviado».

## Pantalla de prueba
- Aprobada el 17-nov-2026: `docs/pantallas/692.html` · https://claude.ai/artifact/HyjmGcwogUBkAmwcq6TEwV

## Qué NO se hace en esta tarea
- Que la app sepa sola si un mensaje de iPasen ha salido: queda por ver.
- Enviar un mismo papel a varias personas con envíos separados: tema 393.
- Cambiar «Enviar ▾» de la cabecera.

## Notas técnicas de Claude
- Leer antes `docs/notas-diseno/692.md` («Lo visto en el código») y `docs/notas-diseno/692-documentos.md`. Reglas del plan (`docs/PLAN-2026-11.md`): lo nuevo se añade, no sustituye; un asunto con hitos y un tipo sin la marca no cambian en nada.
- Cambios quirúrgicos: se tocan solo los ficheros nombrados aquí y los nuevos. Ficheros nuevos por debajo de 400 líneas, apuntados en su lista `js/cargar-piezas-N.js`. Una sola tanda de pruebas al final.
- Colores, letras y botones, los de la app; la pantalla de prueba solo dice qué hay y dónde va.
- Dato nuevo en la ficha del documento: `enviado: { a, cuando, via, quien, aMano }`, por `DocumentosDatos.anotar` (`js/documentos-datos.js`). Hoy el envío solo deja una frase en el Registro (`js/correo-rastro.js`) y no apunta nada en el documento.
- Correo: `js/correo-enviar.js` y `js/hitos-comunicar.js`; el punto donde el correo ha salido de verdad es el que escribe el rastro (`js/correo-rastro.js`): ahí se apunta `enviado` en cada documento adjunto con número. En un asunto `sinHitos` no llamar a `EstadoHito.ponerEsperando` (hacia la línea 206 de `js/correo-rastro.js`).
- Destinatarios: los papeles de la plantilla de correo (`para`), fila 555.
- «Marcar enviado» y corregir: fichero nuevo `js/papel-enviado.js`. La línea del Registro, por el camino de siempre del Registro.

## Cómo lo comprueba el segundo revisor
- Con un tipo que va por correo electrónico, el botón es «Enviar correo», abre el correo con el destinatario del recorrido y el documento adjunto, y al enviarlo «Enviado» queda con ✓.
- Cerrando el correo sin enviar, el paso sigue sin hacer.
- Con un tipo que va en mano, postal, tablón o iPasen, el botón es «Marcar enviado» y no abre ventana.
- El ⋮ deja corregir el día y la vía.
- El Registro tiene la línea del envío con vía, a quién, quién y día.
- Con todos los pasos hechos, la tarea queda hecha y, si era la última, el panel dice «Listo para cerrar».

## Qué mirar al terminar
- Con una COMUNICACION firmada y registrada, pulsar «Enviar correo» y mirar el destinatario y el adjunto.
- Cambiar el recorrido de un tipo a «En mano» y probar «Marcar enviado»; mirar el Registro.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
