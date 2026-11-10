# 575 — Representante de la AMPA en la papeleta

(Sigue a la fila 571, `docs/571-PAPELETAS-CONSEJO-ESCOLAR.md`. Diseñado con Francisco el 10-nov-2026.)

## Lo que escribió Francisco
Ahora entiendo la norma y entiendo porqué en años anteriores han puesto en la papeleta a ese representante con la casilla marcada. ¿Podríamos hacer lo mismo este año, aunque la norma no obligue a incluirla? Más que nada, porque veo que en el listado definitivo de candidatos lo han incluido, lo cual entiendo que es un error, ya que ese representante no es candidato, si no miembro.

Yo este año soy un recién aterrizado y no quiero cambiar demasiadas cosas. Elijo la opción 1. Dentro de dos años, cuando tenga más confianza con el equipo directivo, propondré hacerlo conforme al estricto cumplimiento de la norma.

(La opción 1: «la persona designada sale en la papeleta con el nombre de la AMPA y la cruz ya puesta, y arriba "Marca hasta 4 cruces más"».)

## Lo que entendió Claude (acordado con Francisco el 10-nov-2026)
- En la ventana «Papeletas», al marcar «La AMPA ha designado representante (madres y padres eligen uno menos)», sale debajo un desplegable **«¿Quién?»** con las candidaturas admitidas de Madres y padres y, al final, «Nadie (no sale en la papeleta)».
- Viene ya elegida la candidatura marcada con «Es de la AMPA»; si no hay ninguna, «Nadie». Al desmarcar la casilla, el desplegable se oculta. La ventana lo recuerda como recuerda las papeletas.
- En la papeleta de Madres y padres, la persona elegida sale en su sitio por apellidos, con el nombre de la AMPA a la derecha y **la cruz ya impresa** en su casilla. Las demás casillas, vacías como hoy.
- Arriba pone «Marca hasta 4 cruces más» (las cruces del sector, ya rebajadas en uno; «cruz más» si es 1). Con «Nadie», como hoy: «Marca hasta 4 cruces», sin «más», y sin esa persona.
- La persona elegida cuenta para las papeletas por hoja (hasta 8 nombres, 10 por hoja; con más, 8).
- Sin la casilla marcada, todo sigue como hoy. Los otros sectores no cambian.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba (solo se añade un desplegable a la ventana aprobada en `docs/pantallas/570.html`).

## Qué NO se hace en esta tarea
- Nada en Séneca ni en la lista de candidaturas: la persona designada sigue siendo una candidatura más en la tarjeta.

## Notas técnicas de Claude
- Todo en `js/candidaturas-papeletas.js`: `preguntar` añade el desplegable (`id="pap-quien"`) bajo `#pap-designada` y devuelve el `id` de la candidatura elegida (o vacío); `recordado` lo guarda.
- `pdfDe` recibe para Madres y padres qué candidato va marcado: dibuja una cruz dentro de su casilla (dos líneas con `drawLine`, en negro) y usa `textoMarca(n, true)` → «Marca hasta N cruces más».
- La derecha del elegido es su `ampa` si la tiene; si no, el texto «AMPA».
- `js/novedades.js`: una línea. Ajustar `pruebas/candidaturas-papeletas.mjs`.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor. Claude Code comprueba: el desplegable sale y se oculta con la casilla; viene elegida la de «Es de la AMPA»; en el PDF esa persona lleva la cruz impresa y el nombre de la AMPA, y arriba «Marca hasta 4 cruces más»; con «Nadie», como antes.

## Qué mirar al terminar
- Abre «Papeletas», marca la casilla de la AMPA y mira que en «¿Quién?» ya viene elegida su representante.
- Saca las de Madres y padres: ella sale con la cruz puesta y arriba «Marca hasta 4 cruces más».

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
