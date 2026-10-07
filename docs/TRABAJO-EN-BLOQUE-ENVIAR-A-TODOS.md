# Trabajo en bloque: enviar a todos de una vez, y los avisos (fila 295)

Cerrado con Francisco el 7-oct-2026. Tercera de cuatro filas; **va después de la 294**
(`docs/TRABAJO-EN-BLOQUE-PDF-Y-REGISTRO.md`). Lee antes `docs/TRABAJO-EN-BLOQUE.md`: aquí se usan
sus palabras.

## Qué pasa hoy

- Tras generar, el resumen ofrece «Enviar a cada uno…»: una lista de nombres y direcciones y
  «Confirmar y enviar» (`js/generar-para-relacionados.js`, `enviarACadaUno`). No se ve ningún
  correo antes de enviarlo, manda el Word (no el PDF registrado) y, cerrado ese cuadro, no hay por
  dónde volver a él.
- Un aviso igual para todos sale como **un solo correo** con el grupo en copia oculta (cuadro de
  Correo, «Añadir un grupo»). No queda apuntado a quién le llegó.
- En el envío de un solo documento, Francisco decidió (6-oct-2026, fila 285) que la aplicación
  enseña el correo preparado y él pulsa «Enviar». Con treinta personas eso no vale.

## Qué decidió Francisco

1. **Ver uno de muestra y enviar todos de una vez.** La aplicación enseña el correo de la primera
   persona, con su nombre y su documento adjunto. Al lado, a quién va y, en ámbar, quién no tiene
   correo. Un solo botón: «Enviar a los 28».
2. **Si un envío falla, la lista dice cuál** y se repite solo para esa persona.
3. **Se envía el documento registrado**, no el recién generado, cuando el trabajo lleva registro.
   Los que aún no lo tienen se quedan pendientes.
4. **Un aviso sin documento es también un correo a cada persona, con su nombre.** Cada respuesta
   llega por separado, y la lista dice a quién le llegó y a quién le falló.
5. **Tope diario de Google**: si un envío grande lo alcanza, la lista marca quién queda pendiente
   y al día siguiente se sigue con un botón, sin repetir a nadie.

## Qué hay que hacer

### 1. El botón «Enviar…» de la tabla

En la tarjeta «Personas del grupo», junto a «Generar para todos ▾», el botón **«Enviar…»**, con
la cuenta de a cuántos se puede enviar ahora: «Enviar… (28)». Apagado si no hay ninguno. Se puede
enviar a una persona cuando:

- tiene el PDF del trabajo que se está mirando;
- si el trabajo lleva registro (`ficha.registroPorPersona`), ese PDF tiene registro;
- no se le ha enviado ya ese documento;
- y tiene alguna dirección de correo.

### 2. La pantalla de envío

A pantalla completa, en dos columnas que ocupan todo el ancho.

**Izquierda: el correo de muestra.**

- El correo de la primera persona tal como va a salir: Para, Asunto, el texto con su saludo y el
  nombre de su adjunto (se abre al pulsarlo). Flechas **◀ ▶** para ver el de cualquier otra.
- Encima, «Plantilla»: las plantillas de correo del tipo, con la propia del tipo elegida, o «Sin
  plantilla». El texto se puede cambiar ahí mismo, **una vez para todos**: los huecos
  (`{{NOMBRE NATURAL}}`…) se ven como en el editor de plantillas y la muestra de debajo enseña el
  resultado con la persona elegida. El saludo y la firma, como en `cuerpoPara` de hoy.
- El asunto del correo, el de siempre (`CorreoNucleo.asuntoDelCorreo`), y se puede cambiar.

**Derecha: a quién.**

- **«Se envía a N personas»**, con la lista (nombre y direcciones).
- En ámbar, **«Sin correo (M)»**: sus nombres, con «Copiar los nombres» (para mandárselo por
  Séneca). No se envía nada por ellas.
- En gris, **«Ya enviado (K)»** y, si el trabajo lleva registro, **«Sin registrar todavía (J)»**.
- Solo con alumnado, **«A quién»**: «Al alumno o alumna», «A su familia» o «A todas las
  direcciones de su ficha». Sale elegida la tercera, que es la regla de hoy
  (`Destinatarios.correosDe`). Al cambiarla se recalculan las listas.
- Cada persona recibe **un solo correo**, con todas sus direcciones elegidas en «Para». Nunca van
  en el mismo correo direcciones de dos personas distintas del grupo.

**Abajo:** **«Enviar a los N»** y «Cancelar». Sin conexión de envío (`CorreoEnviar.tieneConexion`),
el botón apagado y la línea de siempre que lleva a conectarla.

### 3. Al enviar

- De uno en uno, nunca dos a la vez. Barra: **«Enviando 12 de 28… No cierres esta pestaña.»** con
  «Parar». «Parar» deja terminar el que está saliendo.
- Cada correo lleva su `idEnvio` fijo, hecho con el asunto, el documento (o el aviso) y **la
  persona** (no la dirección): el mismo documento no sale dos veces para la misma persona aunque
  se le cambie el correo o se pulse otra vez.
- Cada envío bueno se apunta en `ficha.enviosPorPersona`, con `persona` (`CATEGORÍA|nombre`)
  además de lo de hoy. **Se guarda cada diez envíos y al terminar**, no solo al final: si se cierra
  la pestaña a medias, lo ya enviado consta.
- Al acabar, la misma pantalla enseña el resultado: «26 enviados. 2 no han salido:» con el nombre
  y el motivo de cada uno, y **«Reintentar los 2»**. En la tabla, esas dos filas dicen en
  «Enviado»: «No ha salido: <motivo>», en rojo.
- En la carpeta del asunto queda **un solo PDF `CORREO` por tanda**, no uno por persona: el texto
  de muestra, y debajo la lista de personas con dirección, fecha y hora. Se hace con lo que ya hay
  en `js/correo-enviado-pdf.js`. La columna «Enviado» de la tabla y la línea de la ficha de la
  persona abren ese PDF.
- Cuando todas las personas con correo tienen su envío: se marca sola la tarea de comunicar del
  hito actual (`Hitos.marcarGuionPorAccion(a, hito, 'comunicar')`), una vez.
- Una nota en el asunto, una sola: «Enviado a 26 personas, cada una con su documento.»

### 4. El tope diario de Google

- Si Google rechaza un envío por haber llegado al tope del día (su mensaje habla de demasiadas
  veces en un día: «too many times», «demasiadas veces», «limit»), **o si fallan tres seguidos**,
  la tanda se para sola. No se sigue probando con los demás.
- La pantalla dice: **«Google no deja enviar más por hoy. Quedan 140 por enviar. Mañana, pulsa
  «Seguir enviando».»** Las personas que faltan quedan en la tabla como «Pendiente de enviar».
- En la tarjeta, el botón pasa a llamarse **«Seguir enviando (140)»** y abre la misma pantalla con
  lo que falta. No se repite a nadie: lo decide `ficha.enviosPorPersona`, que es común a los dos
  ordenadores, así que puede seguir el compañero desde el suyo.
- En Inicio, en el cuadro de avisos (`AvisosLinea`): **«N envíos por terminar»**, que filtra la
  tabla a esos asuntos. Se guarda en la ficha `envioPendiente: { trabajo, cuantos, cuando }` y se
  borra al terminar.
- No se toca el script de Google: Francisco no tiene que volver a pegar nada.

### 5. Avisos sin documento

- En la tarjeta, otro botón: **«Enviar un aviso…»**. Abre la misma pantalla, sin adjunto.
- Pide el asunto del correo (obligatorio) y el texto: una plantilla de correo o escrito ahí mismo.
- Se puede enviar a toda persona del grupo con correo. Lo demás, igual: muestra con ◀ ▶, «A
  quién», «Sin correo», un correo por persona con su saludo, la barra, los fallos, el tope diario
  y un solo PDF `CORREO`.
- Cada aviso queda en `ficha.avisosEnBloque` (`{ id, asunto, cuando, quien }`) y sus envíos en
  `ficha.enviosPorPersona` con `aviso: <id>` en vez de `documento`.
- En la tabla, el desplegable «Qué se mira» lo ofrece como un trabajo más («Aviso: <asunto> ·
  9-oct-2026»), con una sola columna: «Enviado».
- En la ficha de la persona, su línea: **«Aviso: <asunto> · enviado el 9-oct-2026 a …»**.
- Un asunto de grupo puede existir solo para avisos, sin generar ningún documento.

### 6. El «Enviar a cada uno» de antes

Desaparece del resumen de generar: el resumen termina con «Cerrar» y una línea «Para enviarlos:
«Enviar…», en la lista de personas.». `enviarACadaUno` se quita; lo que valga de él (`idEnvioDe`,
`cuerpoPara`) se muda al módulo nuevo.

## Qué NO se toca

- El cuadro de Correo y el de Séneca de un asunto normal, y «Añadir un grupo» en copia oculta.
- El script de Google (`apps-script/gestor-correos.gs`).
- «Hacer este hito» y el envío de un solo documento.
- Mandar por Séneca a quien no tiene correo: se sigue haciendo a mano, con la lista copiada.

## Trampas

- Un envío de seiscientos correos dura veinte o treinta minutos. La barra tiene que moverse, la
  pestaña no se puede bloquear, y un refresco de fondo no puede repintar la pantalla de envío ni
  cortar la tanda.
- Los envíos antiguos de `ficha.enviosPorPersona` no llevan `persona`: se siguen emparejando por
  su documento (`generadoDe`), como en la fila 293.
- `asuntos.json` se reescribe entero: los apuntes de un aviso a 600 personas, lo más cortos
  posible.
- En solo consulta y con el compañero al mando, los botones apagados. Dos ordenadores no envían a
  la vez el mismo trabajo: antes de empezar se relee la ficha, y la presencia del asunto manda.
- La demostración no envía nada de verdad (`CorreoEnviar` ya responde bien en demo).

## Antes de empezar

- No leas el repositorio entero. Basta con `docs/CONTEXTO.md`, `docs/TRABAJO-EN-BLOQUE.md`,
  `docs/contexto/CORREO-Y-SENECA.md`, `js/generar-para-relacionados.js`, `js/correo-enviar.js`,
  `js/correo-enviado-pdf.js`, `js/destinatarios.js`, `js/personas-del-grupo.js`,
  `js/grupo-registro.js` y el módulo de avisos de Inicio (`AvisosLinea`).
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas.
- Un módulo nuevo no envuelve.
- Pantalla a todo el ancho, sin columnas estrechas con hueco a los lados, y sin tener que bajar
  para ver el botón de enviar (pedido de Francisco para todas las pantallas).
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- La demostración tiene que traer, en el asunto de grupo: tres personas con su PDF registrado y
  sin enviar, una de ellas sin ninguna dirección de correo.
- Rama `fila-295`, revisor en local y, con su APROBADA, a `main`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs grupo generar-para
  correo destinatarios`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/grupo-enviar.js`: nuevo (`GrupoEnviar`). A quién se puede enviar, la tanda, el `idEnvio`, el
  apunte cada diez, los fallos, el tope diario, «Seguir enviando».
- `js/grupo-enviar-pantalla.js`: nuevo. La pantalla de dos columnas, la muestra con ◀ ▶, «A quién».
- `js/grupo-avisos.js`: nuevo (`GrupoAvisos`). «Enviar un aviso…» y `ficha.avisosEnBloque`.
- `js/personas-del-grupo.js` y `js/personas-del-grupo-ficha.js`: los botones, «Pendiente de
  enviar», «No ha salido», los avisos como trabajo y su línea en la ficha de la persona.
- `js/generar-para-relacionados.js`: quitar `enviarACadaUno` y su botón del resumen.
- `js/correo-enviado-pdf.js`: el PDF de una tanda (si hace falta una función nueva, al lado).
- `index.html`, `css/…`, `js/novedades.js`, `js/demo/…`.
- `pruebas/grupo-enviar.mjs`: nueva. Casos: quién entra en «se envía», «sin correo», «ya enviado» y
  «sin registrar»; «A quién» cambia las listas; un correo por persona con sus direcciones en Para;
  el `idEnvio` no cambia al cambiar la dirección; el apunte lleva `persona`; se guarda a los diez
  envíos; un fallo suelto sigue con los demás y sale en «Reintentar»; tres fallos seguidos paran
  la tanda y dejan `envioPendiente`; «Seguir enviando» no repite a nadie; todos enviados marca la
  tarea una vez; un solo PDF `CORREO` por tanda; solo consulta, nada sale.
- `pruebas/grupo-avisos.mjs`: nueva. Casos: sin asunto no deja enviar; cada persona recibe su
  saludo; queda en `avisosEnBloque` y en «Qué se mira»; la ficha de la persona enseña la línea.
- `pruebas/generar-para-relacionados.mjs`: poner al día lo que miraba «Enviar a cada uno».
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo),
  `docs/contexto/CORREO-Y-SENECA.md`, `docs/contexto/PERSONAS.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en la lista de personas hay «Enviar…», que enseña un correo de muestra y a
quién va, y con un botón los envía todos, cada uno con su documento registrado; que lo que falle
sale con «Reintentar»; que si Google corta por el tope del día, al día siguiente se sigue con
«Seguir enviando»; y que «Enviar un aviso…» hace lo mismo sin documento.

## Cómo sabemos que está bien

En la copia de demostración, en el asunto de grupo que trae.

1. En la tarjeta «Personas del grupo» hay un botón «Enviar… (2)»: son las personas con PDF
   registrado, sin enviar y con correo.
2. Pulsarlo: pantalla a todo el ancho. A la izquierda, el correo de la primera persona, con su
   nombre en el saludo y el nombre de su PDF como adjunto. A la derecha, «Se envía a 2 personas» y,
   en ámbar, «Sin correo (1)» con su nombre.
3. La flecha ▶ enseña el correo de la segunda persona, con otro nombre y otro adjunto.
4. Cambiar una palabra del texto: la muestra de las dos personas cambia igual.
5. En «A quién», elegir «A su familia»: las direcciones de la lista cambian.
6. «Enviar a los 2»: barra «Enviando … de 2…» y después «2 enviados.». En la tabla, esas filas
   tienen fecha y dirección en «Enviado». El botón pasa a «Enviar… (0)», apagado.
7. En los documentos del asunto hay **un** PDF `CORREO` nuevo, no dos. Dentro están las dos
   personas con su fecha.
8. Pulsar la fecha de «Enviado» de una fila: se abre ese PDF.
9. En «Personas y empresas», la ficha de una de las dos: en «En asuntos de grupo», su línea dice
   «… · enviado el … a …».
10. En el resumen de «Generar para todos» ya no hay botón «Enviar a cada uno…».
11. «Enviar un aviso…»: sin asunto, «Enviar» está apagado. Con asunto y texto, la muestra saluda a
    la primera persona por su nombre y no lleva adjunto. Enviar.
12. En la tabla, «Qué se mira» ofrece «Aviso: <asunto> · <hoy>», con la columna «Enviado» rellena.
13. En la mesa del hito actual, la tarea de comunicar (si la tiene) está marcada.
14. Con «En este ordenador, solo consultar» puesto: «Enviar…» y «Enviar un aviso…» están apagados.
    Sin errores en la consola en ningún punto.
15. **[SOLO FRANCISCO]** En el centro, con un grupo de verdad de dos o tres personas (por ejemplo,
    él y su compañero como personal): «Enviar un aviso…» y comprobar que a cada uno le llega su
    correo, con su nombre, y que al contestar la respuesta llega a quien lo envió.
