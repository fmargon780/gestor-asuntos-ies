# El vigilante: correos de aviso, apps caídas y respuesta a quien avisó (fila 268 de la cola)

Diseño cerrado con Francisco el 5-oct-2026, en Cowork. Lo que él decidió, y por qué, está en
`docs/CENTRO-DE-MANDO-CINCO-MEJORAS.md` (secciones 1, 2, 4 y 6): léelo antes.

## Qué se quiere

Francisco sigue sus proyectos en el Centro de mando, una página que solo sirve si la tiene
abierta. Quiere tres cosas que la página sola no puede hacer:

1. Que le llegue **un correo** cuando pasa algo que le obliga a hacer algo.
2. Que alguien compruebe cada pocos minutos que **cada app abre**.
3. Que quien envió un aviso desde el botón de soporte reciba **un correo cuando queda resuelto**.

Las tres las hace un programa que se ejecuta solo cada diez minutos: **el vigilante**. Va dentro
del buzón de soporte (`apps-script/soporte.gs`, proyecto «Gestor - Soporte» de Google), porque el
buzón ya tiene permiso para leer los repositorios, guardar en Drive y enviar correo. No gasta
cuota de Claude.

Esta fila solo toca el buzón, sus pruebas y sus documentos. No toca nada de lo que se ve en el
Gestor. La página del Centro de mando la cambia otra conversación, no esta fila.

## 1. Un solo fichero y un solo pegado

Todo va en `apps-script/soporte.gs`: Francisco pega un fichero, como siempre. `prepararTodo`,
que él ya ejecuta después de cada pegado, pone además el disparador (`vigilar`, cada 10 minutos)
si no está puesto, sin duplicarlo. Google le pedirá un permiso nuevo esa vez. Cambia
`VERSION_SCRIPT`.

`vigilar` usa `LockService` para que dos pasadas no se pisen, ni una pasada con un aviso que
entra por `doPost`.

## 2. Qué proyectos vigila

Todos los repositorios de `fmargon780` que el permiso de GitHub del buzón alcanza y que tienen
`docs/COLA.md`. La lista se averigua con el propio permiso y se vuelve a mirar cada seis horas;
si no se puede averiguar, vale `REPOS_PERMITIDOS`. Francisco no configura nada.

## 3. De qué avisa a Francisco

Cinco casos. En cada pasada se miran, por cada repositorio: `docs/COLA.md`, los últimos cambios
de `main`, el estado de publicación del último cambio de `main` y `ESPERANDO.json` de la rama
`avisos` (si existe; ver `docs/AVISO-ESPERANDO-PERMISO.md`).

1. **Claude Code espera su respuesta.** `ESPERANDO.json` dice `"estado":"esperando"` y su fila
   está EN CURSO (o no dice fila).
2. **Una tarea se ha quedado a medias.** Hay una fila EN CURSO, no está esperando respuesta, y el
   último paso de trabajo tiene más de 90 minutos. Último paso: el cambio más reciente entre
   `main`, la rama de la fila (`fila-<nº>`), `pruebas` y las ramas `claude/…`. Para no gastar
   llamadas, las ramas solo se miran en los repositorios con una fila EN CURSO. También cuenta
   aquí una fila que pasa a **BLOQUEADA**.
3. **Una publicación ha fallado.** El estado de publicación del último cambio de `main` (el que
   Vercel deja en GitHub) es de fallo. **No son fallo:** una publicación que el proyecto se salta
   a propósito (cambios solo de documentos) ni el tope diario de la cuenta de Vercel. Mira con
   ejemplos reales de este repositorio cómo deja Vercel cada caso antes de decidir la regla, y
   déjala escrita en `docs/PONER-EN-MARCHA-SOPORTE.md`. También cuenta aquí una fila que pasa a
   **SIN PUBLICACIÓN COMPROBADA**. Los proyectos que no publican en Vercel no tienen esta señal:
   de ellos se ocupa el caso 5.
4. **Un usuario ha enviado un aviso.** Se sabe en `doPost`, al guardarlo.
5. **Una app no abre**, y cuando vuelve a abrir (sección 5).

De lo que termina bien no se avisa.

## 4. Cómo son los correos a Francisco

- **A quién:** a la dirección de la propiedad del script `CORREO_AVISOS` si existe. Si no, al
  dueño del script y a las cuentas con las que está compartida la carpeta `SOPORTE-AVISOS` (así
  llega a su Gmail personal sin que él toque nada). **No escribas su dirección en el código ni en
  ningún documento: el repositorio es público.**
- **Un correo por cada cosa, sin repetirlo.** Cada suceso tiene una clave (repositorio, caso,
  fila o cambio, y la hora del hecho) que se recuerda; lo ya avisado no se vuelve a avisar. Una
  tarea que se retoma y se vuelve a parar es un suceso nuevo.
- **Asunto:** `Centro de mando · <nombre de la app>: <qué pasa>`. Ejemplos: «…: Claude Code
  espera tu respuesta (fila 214)», «…: la fila 214 lleva parada desde las 18:05», «…: la última
  publicación ha fallado», «…: aviso nuevo de un usuario», «…: la app no abre», «…: la app ya
  funciona».
- **Cuerpo:** texto sin formato, dos o tres frases en llano, una idea por frase: qué ha pasado,
  desde cuándo y qué puede hacer. Después, los enlaces: el Centro de mando
  (https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E) y, si se conoce, la conversación de Claude
  Code de esa fila (el enlace `claude.ai/code/session_…` de la fila o de sus cambios). El correo
  de un aviso de usuario lleva el tipo, la pantalla, la fila y el enlace a Drive, **nunca el
  texto ni el nombre de quien lo escribió** (como ya hace el correo de la fila 261).
- **De 23:00 a 7:00, hora de Madrid, no sale ningún correo.** Lo que pase se guarda. En la
  primera pasada desde las 7:00 sale **un solo correo**, «Centro de mando · resumen de la noche»,
  con lo guardado que **siga siendo verdad** en ese momento (se vuelve a comprobar): lo que se
  arregló solo durante la noche no se cuenta. Los avisos de usuarios llegados de noche se cuentan
  siempre. Si no queda nada, no sale correo.

## 5. Vigilar que cada app abre

- **La dirección** de cada proyecto se lee de su `docs/CONTEXTO-CORTO.md`: la primera dirección
  del renglón que empieza por «Dirección publicada» (o «Producción», «Publicada en», «Dirección»,
  «Dónde se usa»). Si no la hay, la primera de `CLAUDE.md` en un renglón que hable de dirección o
  de publicar. Se vuelve a leer cada seis horas. Sin dirección: el proyecto queda `sin-vigilar`.
  Solo la app buena; las copias de pruebas y de demostración no se vigilan.
- **En cada pasada** se pide esa dirección. Está **bien** si responde sin error. Si lo que
  responde es la pantalla de entrada de Google, también está bien, pero se apunta que solo se
  llega a la entrada (`alcance: "entrada"`). Está **mal** si no responde, si tarda más de 30
  segundos, si da un error 404 o 5xx, o si lo que llega es la página de error de Google Apps
  Script.
- **Dos pasadas seguidas mal = caída.** Entonces, correo del caso 5 y se apunta desde cuándo. Con
  una sola pasada mal no se dice nada.
- **La primera pasada bien después de una caída avisada:** correo corto, «la app ya funciona»,
  con cuánto ha durado. Si la caída no llegó a avisarse (fue de noche y se arregló antes de las
  7:00), no se manda nada.

## 6. Contestar a quien envió un aviso

- `doPost` acepta un dato nuevo y opcional, **`correo`** (texto, 120 caracteres como mucho). Si
  no tiene forma de dirección de correo, se trata como vacío; nunca se rechaza un aviso por esto.
  Se guarda en el fichero de Drive del aviso, en un renglón «Correo:». **Nunca va a GitHub.**
- Al apuntar la fila IDEA, el vigilante recuerda el aviso: repositorio, fila, app, tipo,
  pantalla, fecha, correo y enlace.
- En cada pasada, por cada aviso recordado y sin cerrar, se mira su fila en `docs/COLA.md`:
  - **HECHA** (en estos proyectos, HECHA quiere decir publicada y comprobada): se le manda el
    correo de abajo y el aviso queda `contestado`.
  - **DESCARTADA** o **SUSTITUIDA**: no se manda nada; queda `descartado`.
  - **La fila ya no está en la cola:** se busca una vez en `docs/HISTORIA.md` de ese repositorio;
    si allí consta como hecha, se contesta; si no, queda `no-encontrada`.
  - Cualquier otro estado: se espera.
- **Sin correo**, queda `sin-correo` y no se hace nada más.
- **Si el correo de quien avisa es una de las direcciones de Francisco** (las del punto 4), no se
  le escribe: queda `propio`.
- **El correo, con texto fijo.** Asunto: `<nombre de la app>: tu aviso ya está resuelto`. Cuerpo,
  para un aviso de «algo no funciona»: «Hola. Tu aviso del 3 de octubre en la pantalla «Guardias»
  de <app> ya está resuelto. Ábrela y compruébalo. Si sigue fallando, vuelve a pulsar el botón de
  soporte. Este correo sale solo; si respondes, le llega a Francisco.» Para una propuesta de
  mejora: asunto «…: tu propuesta ya está hecha» y «Tu propuesta del 3 de octubre … ya está
  hecha. Ábrela y mírala. Si no es lo que pedías, vuelve a pulsar el botón de soporte.» El
  correo no cita el texto que escribió la persona. La respuesta (`replyTo`) va a la primera
  dirección del punto 4.
- Estos correos tampoco salen de 23:00 a 7:00: esperan a las 7:00 y salen uno por aviso.

## 7. Dónde guarda el vigilante lo que recuerda

- **Su memoria** (sucesos ya avisados, lo guardado de noche, fallos seguidos de cada app, avisos
  recordados con su correo, direcciones leídas): un fichero JSON en Drive, en una subcarpeta
  `_VIGILANTE` de `SOPORTE-AVISOS`. Es privado. Las propiedades del script no valen: se quedan
  pequeñas. Lo que tenga más de 60 días y esté cerrado se borra.
- **El fichero para la página:** `SOPORTE-AVISOS/ESTADO-VIGILANTE.json`, con la forma exacta de
  la sección 6 de `docs/CENTRO-DE-MANDO-CINCO-MEJORAS.md`. Texto sin formato, siempre el mismo
  fichero, escrito al final de cada pasada. **Sin nombres, correos ni texto de avisos.**

## 8. Los topes de Google

Una cuenta personal de Google admite unas 20.000 llamadas externas al día y 90 minutos de
disparadores al día. Con diez minutos entre pasadas son 144 pasadas. Por eso:

- Las llamadas de una pasada van juntas (`UrlFetchApp.fetchAll`), y cada pasada debe acabar en
  menos de 30 segundos.
- Menos de 12.000 llamadas al día en total. Si no cabe, los proyectos sin cambios en 14 días y
  sin nada pendiente se miran una vez por hora (su app, igual que las demás).
- Una pasada que falla a medias no rompe nada: no manda correos a medias, deja la memoria como
  estaba y la siguiente lo vuelve a intentar. Si GitHub no responde, no se deduce nada de ese
  repositorio en esa pasada.
- Deja escrito en `docs/PONER-EN-MARCHA-SOPORTE.md` cuántas llamadas hace una pasada.

## 9. `prepararTodo` y los pasos de Francisco

`prepararTodo`, además de lo que ya hace: pone el disparador, hace una pasada de prueba **sin
mandar avisos** y añade al correo de resumen: a qué direcciones llegarán los avisos, qué
repositorios vigila, y de cada app su dirección y si se llega a la app entera o solo a la entrada
(o que está sin vigilar).

Pon al día `docs/PONER-EN-MARCHA-SOPORTE.md` (qué es el vigilante, la propiedad opcional
`CORREO_AVISOS`, cómo pararlo quitando el disparador) y añade a `docs/COMPROBAR-A-MANO.md` y a «Lo
que queda por hablar con Francisco» sus pasos, en llano: pegar `apps-script/soporte.gs`, ejecutar
`prepararTodo`, aceptar el permiso nuevo, leer el correo de resumen y hacer «Implementar» →
«Administrar implementaciones» → «Nueva versión».

## 10. Pruebas

Sin Google: con dobles de GitHub, Drive, correo, reloj, cerrojo y disparadores, en
`pruebas/soporte-script.mjs` o en un fichero nuevo `pruebas/vigilante-script.mjs`. Como mínimo:

1. Los cinco casos mandan cada uno su correo, una sola vez aunque haya diez pasadas seguidas.
2. Una fila parada que se retoma y se vuelve a parar manda un correo nuevo.
3. Una publicación saltada a propósito y el tope de Vercel no mandan correo.
4. A las 2:00 no sale nada; a las 7:00 sale un solo correo con lo que sigue siendo verdad, y lo
   que se arregló de noche no sale.
5. Una app con una sola pasada mal no avisa; con dos, sí; al volver, correo corto; una caída de
   noche arreglada antes de las 7:00 no manda ninguno de los dos.
6. La pantalla de entrada de Google cuenta como bien, con `alcance: "entrada"`. Un proyecto sin
   dirección queda `sin-vigilar`.
7. Un aviso con `correo`: fila HECHA → un correo a esa dirección con el texto fijo y `replyTo`;
   DESCARTADA → ninguno; sin correo → `sin-correo`; correo de Francisco → `propio`; fila que ya no
   está en la cola pero consta hecha en la historia → se contesta.
8. `correo` con mala forma no rechaza el aviso. El correo de quien avisa no aparece en la fila de
   la cola ni en `ESTADO-VIGILANTE.json`.
9. `ESTADO-VIGILANTE.json` tiene la forma acordada y es siempre el mismo fichero.
10. `prepararTodo` pone un solo disparador aunque se ejecute tres veces.
11. Si GitHub falla en mitad de una pasada, no sale ningún correo falso y la memoria no se
    estropea.
12. Todo lo que ya probaba `pruebas/soporte-script.mjs` sigue en verde.

`npm test` completo en verde antes de publicar.

## 11. Fuera de esta fila

- La página del Centro de mando (la cambia una conversación de Cowork).
- El botón de soporte del Gestor: fila 269. Los de las otras apps: sus colas.
- Que cada app avise sola de sus errores de dentro: descartado por ahora.

## Cómo sabemos que está bien

Esta fila no cambia nada que se vea en la aplicación; se comprueba con las pruebas del script.

1. La prueba del vigilante termina en verde y su salida nombra los doce casos del punto 10.
2. En esa salida, diez pasadas seguidas con la misma fila parada mandan un solo correo.
3. En esa salida, a las 2:00 no sale ningún correo y a las 7:00 sale uno solo.
4. En esa salida, el correo de quien avisa no está en la fila de la cola ni en
   `ESTADO-VIGILANTE.json`.
5. `apps-script/soporte.gs` no contiene ninguna dirección de correo escrita y `VERSION_SCRIPT` ha
   cambiado.
6. `docs/PONER-EN-MARCHA-SOPORTE.md` explica el vigilante, `CORREO_AVISOS`, cómo pararlo y
   cuántas llamadas hace una pasada.
7. Abrir la aplicación con datos de demostración: el botón «Soporte» sigue abajo a la derecha y
   su ventana se abre y se cierra como antes (no se ha tocado).
8. **[SOLO FRANCISCO]** Pegar el script, ejecutar `prepararTodo` y aceptar el permiso nuevo: le
   llega el correo de resumen, con las direcciones de aviso, los repositorios vigilados y el
   estado de cada app.
9. **[SOLO FRANCISCO]** Tras «Nueva versión», esperar veinte minutos: en su Drive, en
   `SOPORTE-AVISOS`, existe `ESTADO-VIGILANTE.json` con la hora de hace menos de veinte minutos.
10. **[SOLO FRANCISCO]** Enviar un aviso de prueba desde cualquier app, de día: le llega el correo
    «aviso nuevo de un usuario» en menos de un minuto.
