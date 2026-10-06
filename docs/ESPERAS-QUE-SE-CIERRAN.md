# Las esperas se cierran al llegar el documento (fila 286)

Cerrado con Francisco el 6-oct-2026. Segunda mitad del diseño de la fila 285; va después de ella,
pero no depende de su código.

## Qué pasa hoy

Un asunto está en espera cuando su hito actual le toca a otro (el tercero, un tutor, otro
organismo): sale en la pestaña «En espera» de Inicio. Cuando llega lo que se esperaba, hay que
guardar el documento en el asunto, abrir el hito, marcar su tarea y dar el hito por hecho. Y si el
plazo vence sin que llegue nada, la app solo lo pone en rojo: no ofrece ningún paso.

## Qué quiere Francisco

- Que guardar el documento esperado termine la espera, sin más clics.
- Que no se cierre por error: a un asunto en espera también llegan papeles que no son la
  respuesta. Por eso es una casilla ya marcada, que se puede quitar.
- Que, si vence el plazo sin respuesta, haya un botón que lo anote y pase al hito siguiente.

## Palabras de este documento

- **Hito de espera**: el hito actual de un asunto que `Hitos.estadoDelAsunto` da como «en espera»
  (no le toca a Administración). Es la misma regla de la pestaña «En espera». No hay campo nuevo.
- **Cuadro de nombre**: el cuadro de ponerle nombre a un documento que entra en un asunto
  (`js/documentos.js` y `js/documentos-guardar.js`).

## Qué hay que hacer

### 1. La casilla en el cuadro de nombre

- Cuando el cuadro de nombre se abre para un documento **que entra** en un asunto cuyo hito actual
  es de espera, lleva una casilla **ya marcada**, encima de los botones:
  **«Es lo que se esperaba. Termina la espera de «<título del hito>».»**
- «Que entra» es: desde «Ver todo» (un documento suelto o un adjunto de la bandeja de correo, con
  «Guardar aquí» o al crear), con «+ Añadir documento» y al soltar un fichero del ordenador. **No**
  sale al cambiar el nombre de un documento que ya estaba, ni con los que genera la aplicación, ni
  con el PDF sellado de un registro.
- Si el cuadro ya dejaba elegir a qué hito va el documento y se elige otro, la casilla desaparece.
- Con varios documentos seguidos (los adjuntos de un correo, uno detrás de otro): la casilla sale
  marcada solo en el primero. En los siguientes ya no hay espera que cerrar.

### 2. Al guardar con la casilla marcada

1. El documento se guarda como hoy y se apunta al hito de espera, por el camino de siempre. Eso ya
   marca sola su tarea de añadir o de reunir un documento, si la tiene.
2. El hito se da por hecho, por el mismo camino que «Marcar como hecho» (con su aviso de lo
   obligatorio y su «avisar a quien lo pide»). Con eso el plazo del hito siguiente empieza a
   contar solo, como hoy.
3. Aviso verde: «Espera terminada: «<título>». Ahora toca: «<hito siguiente>».», con «Deshacer».
   «Deshacer» vuelve a dejar el hito sin hacer; el documento se queda guardado y apuntado.
4. **No abre la mesa del hito siguiente ni cambia de pantalla**: quien está clasificando en «Ver
   todo» sigue donde estaba.
5. Si al hito le queda algo obligatorio sin hacer, no se da por hecho. Aviso ámbar: «Guardado. La
   espera no se ha terminado: falta «<lo que falta>».»

Con la casilla quitada, todo como hoy.

### 3. «No ha llegado nada»

- En la mesa de un hito de espera **con la fecha límite ya pasada**, un botón en la cabecera:
  **«No ha llegado nada»**.
- Al pulsarlo, sin preguntar: anota en el registro del hito «Venció el <fecha> sin respuesta.»,
  da el hito por hecho con una marca `sinRespuesta: true` y abre la mesa del hito siguiente. Aviso
  verde: «Anotado: sin respuesta.», con «Deshacer».
- Un hito con esa marca se lee «Hecho · sin respuesta» donde hoy se lee «Hecho» (la lista de
  hitos, la mesa, el mapa y el índice del expediente). `Hitos.normalizarHito` conserva la marca.
  Desmarcar el hito la borra.
- Antes de que venza el plazo, el botón no sale: para eso está «Marcar como hecho».
- Apagado en solo consulta y cuando el compañero tiene el mando.

## Qué NO se toca

- Qué asuntos están «En espera» y cómo se decide.
- El cuadro de nombre en todo lo demás: lo que propone, lo que lee del documento, sus botones.
- Las guías y la biblioteca: no hay nada nuevo que configurar.
- Los hitos que le tocan a Administración, aunque sean una espera de hecho («Plazo de
  reclamación», de Secretaría): ahí no sale la casilla ni el botón.
- El «Hacer este hito» de la fila 285.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/DOCUMENTOS.md` (el cuadro
  de nombre y «Ver todo»), `docs/contexto/HITO-MESA.md` (la cabecera y «Se marca solo»),
  `docs/contexto/ESTADO-DEL-ASUNTO.md`, `js/documentos-guardar.js`, `js/documentos-sueltos.js`,
  `js/hitos-documentos.js` y la función de `js/hitos-panel-lista.js` que da un hito por hecho
  basta.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas. `js/hitos.js` ya pasa: ahí,
  solo conservar `sinRespuesta`.
- Un módulo nuevo no envuelve: se engancha por un punto previsto o por uno nuevo.
- Un bloque que se repinta nunca tira lo que se está escribiendo en el cuadro de nombre
  (`U.conservandoLoEscrito`).
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- La demostración tiene que traer un asunto en espera con un documento suelto por clasificar que
  sea de su tercero, y otro asunto en espera con el plazo vencido.
- Rama `fila-286`, revisor en local y, con su APROBADA, a `main`. Nada en una petición de cambios
  abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs esperas
  por-clasificar hito-desde-por-clasificar hito-mesa estado`); la pasada completa, una sola vez al
  final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/esperas.js`: nuevo (`Esperas`; mira antes que el nombre esté libre). Saber si un asunto está
  en un hito de espera, la casilla, terminar la espera y «No ha llegado nada».
- `js/documentos-guardar.js` (y `js/documentos.js` si hace falta): el sitio de la casilla y la
  llamada al guardar.
- `js/hito-mesa.js`: solo el sitio del botón. Tiene 516 líneas: el código va en `js/esperas.js`.
- `js/hitos.js`: conservar `sinRespuesta`.
- Donde se pinta «Hecho» de un hito (lista, mesa, mapa, índice del expediente): «· sin respuesta».
- `index.html`, `css/…`, `js/novedades.js`, `js/demo/…`.
- `pruebas/esperas.mjs`: nueva. Casos: la casilla sale marcada en un asunto en espera y no sale
  en uno que le toca a Administración; no sale al cambiar un nombre ni con un documento generado;
  al guardar marcada, documento apuntado al hito, tarea marcada, hito hecho y fecha del siguiente
  calculada; «Deshacer» deja el hito sin hacer y el documento en su sitio; con algo obligatorio
  pendiente, no cierra y avisa en ámbar; con la casilla quitada, como hoy; segundo adjunto de la
  misma tanda, sin casilla; «No ha llegado nada» solo con el plazo vencido, anota, marca
  `sinRespuesta` y abre el siguiente; desmarcar borra la marca; solo consulta, nada escribe.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo), `docs/contexto/DOCUMENTOS.md`,
  `docs/contexto/HITO-MESA.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que al guardar un documento en un asunto que está en espera sale una casilla ya
marcada, «Es lo que se esperaba. Termina la espera»; que con ella el hito se da por hecho y el
plazo siguiente empieza a contar, sin moverle de pantalla; que si el papel es otra cosa, basta
quitar la marca; y que un hito de espera con el plazo vencido lleva el botón «No ha llegado nada».

## Cómo sabemos que está bien

En la copia de demostración.

1. Inicio → «Ha llegado» → «Ver todo». En el documento suelto del tercero que está en espera,
   «Guardar aquí». El cuadro de nombre lleva la casilla marcada, con el título del hito de espera.
2. «Guardar»: aviso verde «Espera terminada: «…». Ahora toca: «…».» con «Deshacer». Sigue en «Ver
   todo»; no ha cambiado de pantalla.
3. Volver a Inicio: ese asunto ya no está en «En espera». Abrirlo: el hito de espera está hecho,
   el documento sale en sus documentos, y el hito siguiente tiene su fecha límite si lleva plazo.
4. Repetir con otro documento y pulsar «Deshacer» en el aviso: el asunto vuelve a «En espera» y el
   documento sigue guardado en el asunto.
5. Repetir quitando la marca de la casilla: el documento se guarda y el asunto sigue en «En
   espera».
6. En un asunto que le toca a Administración, «+ Añadir documento»: el cuadro de nombre no lleva
   la casilla.
7. En un asunto en espera, cambiar el nombre de un documento que ya estaba: el cuadro no lleva la
   casilla.
8. Abrir la mesa del hito de espera con el plazo vencido: está el botón «No ha llegado nada».
9. Pulsarlo: aviso verde «Anotado: sin respuesta.» con «Deshacer», y se abre la mesa del hito
   siguiente. En la lista de hitos, el anterior dice «Hecho · sin respuesta». En su registro está
   la línea «Venció el … sin respuesta.».
10. En un hito de espera con el plazo sin vencer: no hay botón «No ha llegado nada».
11. Con «En este ordenador, solo consultar» puesto: el botón está apagado. Sin errores en la
    consola en ningún punto.
