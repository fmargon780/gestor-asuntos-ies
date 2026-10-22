# «Es lo que se esperaba» sin marcar, y hitos que reciben varios documentos (fila 414)

Tema 394 (idea 381, aviso del botón de soporte de Francisco, 20-oct-2026, pantalla Inicio,
perfil Administración). Diseñado con Francisco el 22-oct-2026.
Aviso completo: https://drive.google.com/file/d/1dBeEMvzO0qiF7LbLkRAgxtEcQSW9U_i3/view?usp=drivesdk
Captura: https://drive.google.com/file/d/1518s_g3YIv2Rq7QDDs65JSkcGOniUzI4/view?usp=drivesdk

## Qué pasa hoy

Desde la fila 286 (`docs/ESPERAS-QUE-SE-CIERRAN.md`, `js/esperas.js`), cuando un asunto está en
espera (su hito actual le toca a un tercero) y entra un documento (cuadro de nombre en
`modo 'anadir'` o `ponerNombre`, no el PDF sellado de un registro), el cuadro lleva la casilla
**marcada** «Es lo que se esperaba. Termina la espera de «…»». Al guardar sin tocarla, el hito de
espera se da por hecho y el asunto pasa al siguiente.

Problema: un documento que no es la respuesta esperada cierra la espera igual. Y hay hitos que
esperan **muchos** documentos (la recepción de candidaturas al Consejo Escolar): con la casilla
marcada, la primera candidatura cierra el hito.

## Qué quiere Francisco

1. **La casilla sale siempre sin marcar.** Solo se cierra la espera si la persona la marca a
   propósito. Marcada y guardada, todo sigue igual que hoy (aviso verde «Espera terminada…» con
   «Deshacer», ámbar si falta algo obligatorio).
2. **Opción nueva en cada hito de la guía: «Recibe varios documentos».** Es una casilla en el
   editor del hito (Ajustes → tipo de asunto → guía), junto a responsable, estado y plazo. Si está
   puesta, la casilla «Es lo que se esperaba…» **no aparece nunca** en los asuntos cuyo hito de
   espera sea ese hito. El hito se cierra a mano con «Marcar como hecho», como cualquier otro, o con
   «No ha llegado nada» si vence sin nada.
   - Se ofrece en cualquier hito (no solo en los que hoy son de espera), porque el responsable de
     un hito puede cambiar.
   - La guarda la guía y llega a los asuntos abiertos de su tipo. Es una decisión de cada tipo,
     como «Solo informativo»: **no entra en la biblioteca de hitos** (ni en `pasoAModelo` /
     `modeloAPaso`) ni en la comparación «Antes · Ahora» de la fila 297; marcarla no abre la
     pregunta «Cancelar · Solo aquí · También en la biblioteca».
   - **Cada documento que entra mientras el asunto espera en ese hito se une a él**, sin cerrarlo,
     venga de donde venga (ficha, Ver todo, tarjeta de candidaturas, mesa del hito): queda apuntado
     al hito como hoy cuando se añade desde su mesa, y se ve en ella. No marca requisitos ni tareas
     del hito, ni lo da por hecho.
3. No se pone la opción sola en ninguna guía. Francisco la marca él en la suya (ver «Paso de
   Francisco»).

## Qué hay que hacer

1. En `Esperas.casillaHTML` (`js/esperas.js`), la casilla deja de llevar `checked`.
2. Dato nuevo del paso de la guía: `variosDocumentos: true` (ausente o `false` = como hoy). Se
   **copia al hito del asunto igual que `toca`/`tocaA`**: en `Hitos.pasoAHito` (al crear el hito),
   en `normalizarHito` (que hoy borra los campos que no conoce) y en `retocarMarcas`
   (`js/hitos-sincronizar.js`, para que llegue a los hitos ya existentes de los asuntos abiertos).
   `casillaHTML` devuelve `''` si el hito de espera lo tiene.
3. Editor de hitos de la guía: casilla «Recibe varios documentos», junto a «Solo informativo»
   (`js/guias-paso-bloques.js`), leída en `recoger()` de `js/guias-editor.js`; se guarda con el
   «Guardar» del editor, como las demás. Línea de ayuda debajo: «Con esto, al añadir un documento
   al asunto no se ofrece terminar la espera; el hito se cierra a mano.» No se ofrece en los
   hitos-pregunta. También en el «Hito ▾» de la mesa (Crear y Cambiar, fila 206,
   `js/hitos-desde-el-asunto*.js`), por el mismo camino que el plazo («A la guía» / «Solo en este
   asunto», con «Deshacer»).
4. Biblioteca de hitos: `variosDocumentos` queda fuera, igual que `soloInformativo`
   (`js/hitos-biblioteca.js`).
5. Copia de pruebas (`js/demo/`): hoy no tiene tipo de candidaturas. Añadir el tipo «Elecc.
   Consejo Escolar» (con `candidaturas: true`, fila 347) con una guía cuyo hito «Recepción de
   candidaturas» le toque a terceros (`toca: 'espera'` y `tocaA`) y lleve «Recibe varios
   documentos» puesto, y un asunto abierto de ese tipo con los hitos anteriores hechos, de modo
   que ese sea su hito actual. Y que haya otro asunto en espera sin la opción.
5 bis. En `Esperas.alGuardar` (o justo al lado): si el hito de espera tiene `variosDocumentos`, el
   documento recién guardado se apunta a ese hito con el mismo camino que usa hoy la casilla
   marcada para apuntarlo, y nada más (sin cerrar, sin marcar tareas ni requisitos).
6. Prueba nueva `pruebas/espera-sin-marcar.mjs`: casilla sin marcar; guardar sin marcarla no
   cierra el hito; marcarla sí lo cierra; con `variosDocumentos` no aparece y el documento queda unido al hito, que sigue abierto.
7. `js/novedades.js`: «Al añadir un documento a un asunto en espera, «Es lo que se esperaba» ya no
   sale marcada. En la guía, un hito puede llevar «Recibe varios documentos» para que no salga.»
8. Poner al día `docs/CONTEXTO-CORTO.md`: la línea «Esperas que se cierran» hoy está cortada a
   media frase; se reescribe entera (casilla **sin marcar**, `variosDocumentos`). También el hijo de
   `docs/contexto/` que toque. En `pruebas/esperas.mjs`, la comprobación de `checked === true`
   pasa a `false`, y donde hoy desmarca la casilla, ahora la marca antes de guardar.

Cabe en una sola sesión de Claude Code.

## Ejemplo real

Tipo de asunto «Elecc. Consejo Escolar» (el único con ese tipo en el centro), su hito de recepción
de candidaturas. Claude Code no ve los datos reales: lo prueba con el equivalente de la copia de
pruebas.

## Cómo sabré que está bien

1. En un asunto en espera, al añadir un documento, la casilla «Es lo que se esperaba…» sale **sin
   marcar**.
2. Si se guarda sin tocarla, el hito sigue abierto y el asunto no avanza.
3. Si se marca y se guarda, el hito se cierra como hasta ahora, con su aviso verde y «Deshacer».
4. En Ajustes → tipo «Elecc. Consejo Escolar» → guía, el hito de las candidaturas tiene la opción
   «Recibe varios documentos». Con ella puesta, al guardar una candidatura en un asunto de ese
   tipo, la casilla ni aparece, el hito sigue abierto y la candidatura sale dentro de él.

Los puntos 1 a 3 y el 4 con la copia de pruebas los comprueba el revisor. El punto 4 con la guía
real es [SOLO FRANCISCO]: a `docs/COMPROBAR-A-MANO.md`.

## Paso de Francisco (después de publicarla)

En Ajustes → tipo «Elecc. Consejo Escolar» → guía, abrir el hito de recepción de candidaturas y
marcar «Recibe varios documentos». Apuntado en la cola como IDEA «Paso de Francisco» (fila 415).
