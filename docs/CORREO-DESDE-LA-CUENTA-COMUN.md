# Correo del Gestor desde la cuenta común de Administración

Fila 411 de `docs/COLA.md`. Diseñada con Francisco el 21-oct-2026. Primer paso del cambio de
Dropbox a Google (análisis en el proyecto de Claude: `claude/Analisis-cambio-de-nube-2026-10-21.md`).

## De dónde sale

El 21-oct-2026 dirección dio a Francisco y a Diego una cuenta común de Google para Administración:
**29700692.administracion@g.educaand.es**. Hasta ahora:

- la recogida de correos (etiqueta `GESTOR` → carpeta `GESTOR-BANDEJA`) iba solo por la cuenta de
  Francisco (fmargon780@g.educaand.es), con su copia del script «Gestor - Correos»;
- en el ordenador de Diego solo se montaba el envío (16-oct-2026);
- lo que llegaba a la cuenta común se reenviaba a las cuentas de los dos.

## Lo que decidió Francisco

1. **El Gestor recoge y envía solo desde la cuenta común.** No recoge de las cuentas personales.
   Si a una cuenta personal le llega algo para un asunto, se reenvía a mano a la común y se etiqueta
   allí. Las respuestas a correos que salieron antes desde la cuenta de Francisco seguirán llegando a
   su cuenta durante un tiempo; esas también se reenvían a mano. No hay que programar nada para eso.
2. **Se quita el reenvío** de la cuenta común a las personales (paso de Francisco, ver abajo).
3. **Nombre del remitente: «Administración · IES Fuente Lucena».** Es lo que ve quien recibe el
   correo, sea quien sea quien pulse «Enviar».

## Lo que hay que programar

1. **El nombre del remitente.** Todo correo que envíe `apps-script/gestor-correos.gs` (envío
   normal, respuesta dentro de un hilo, avisos, envíos de grupo) lleva como nombre visible
   «Administración · IES Fuente Lucena». Ese texto se guarda en Ajustes → El centro (un campo
   «Nombre del remitente de los correos», en `_GESTOR`, con ese valor por defecto) y la app lo manda
   al script en cada envío; el script lo usa en la opción `name` de Gmail. Si el script recibe la
   petición sin nombre (app vieja), envía como hasta ahora. Sube `VERSION_SCRIPT` y
   `SCRIPT_ESPERADO`, para que la app avise de pegar el script nuevo.
2. **La cuenta de Administración, apuntada una vez para el centro.** En Ajustes → El centro, un
   campo «Cuenta de correo de Administración» (en `_GESTOR`), con
   29700692.administracion@g.educaand.es ya puesto.
3. **Ajustes dice con qué cuenta trabaja cada ordenador.** En el bloque del correo de Ajustes →
   Este ordenador, una línea «Este ordenador envía y recoge con: <cuenta>», sacada de la respuesta
   del script (`miCorreo()`; si hace falta, que «Probar» y cada envío devuelvan la cuenta). Si no
   coincide con la cuenta de Administración del punto 2, la línea sale en ámbar: «Este ordenador no
   usa la cuenta de Administración. Conecta el script de 29700692.administracion@g.educaand.es.»
   El mismo aviso ámbar va a Ajustes → Problemas (una tarjeta, como las demás).
4. **Los pasos de conexión de Ajustes** («Enviar correo» y la bandeja de correos) hablan de «la
   cuenta de Administración», no de «tu cuenta».
5. **Responder dentro de los hilos antiguos** (decidido por Francisco: opción buscar). Los hilos
   guardados en los asuntos llevan identificadores del buzón de Francisco. Cuando
   `hiloParaResponder` no encuentre el hilo con `GmailApp.getThreadById`, lo busca en la cuenta común
   por los identificadores de mensaje (`rfc822msgid:`) que la app ya guarda para ese hilo, de la
   última a la primera, igual que hace `hiloDeSeguido` en la recogida (si la app no los manda hoy en
   la petición de envío, que los mande). Si lo encuentra, responde dentro de él con las mismas reglas
   de siempre (todos los destinatarios ya estaban en el hilo); si no, correo nuevo, sin ruido.
6. Nada más cambia: la recogida, `seguidos.json`, las plantillas y el cuadro de correo siguen igual.
   Lo que se sigue de la cuenta vieja y no aparece en la común se salta sin ruido, como ya hace el
   script.

### Notas técnicas (resueltas al revisar la instrucción)

- Ajustes → El centro es el bloque `#bloque-datos-centro` («Datos del centro y firma»): lo pinta y
  guarda `js/plantillas-ajustes.js` (`guardarFirma` → `Plantillas.guardar`, en
  `_GESTOR/plantillas.json`); los valores por defecto, en `js/plantillas.js` (`POR_DEFECTO_*`). Los
  dos campos nuevos van ahí, creados desde JS (como `ayudarConLaDireccionNormativa`), sin tocar
  `index.html`.
- El nombre del remitente se añade una sola vez dentro de `llamar()` de `js/correo-enviar.js`; así
  lo llevan `js/correo-cuadro.js`, `js/grupo-enviar.js` y «Probar» sin tocarlos. En el script va en
  el objeto `opciones` de `enviarCorreo` (sirve a `createDraft` y `createDraftReply`). Todo envío
  pasa por `doPost` → `enviarCorreo`; `mandarBorradores` no se usa y no se toca.
- La cuenta: el script la devuelve añadiendo `cuenta: miCorreo()` en `conVersion()`, y la app la
  guarda en el navegador como ya guarda la versión. «Envía con» sale de esa respuesta; «recoge con»
  sale de `latido.json` (lleva `cuenta` desde la fila 336). Si cualquiera de las dos no es la cuenta
  de Administración, la línea va en ámbar. Antes del primer «Probar» o envío: «todavía no se sabe:
  pulsa Probar», sin ámbar. La tarjeta de Problemas sale solo si se conoce la cuenta y no coincide,
  nunca para perfiles de directivo. Comparación sin distinguir mayúsculas.
- El bloque «Enviar correo» lo crea `js/correo-enviar.js` y `js/ajustes-reparto.js` lo pasa a
  «Este ordenador»; el de la bandeja es `#bloque-bandeja` (`js/bandeja-ajustes.js`). En
  `js/bandeja-latido.js`, «la cuenta del centro» pasa a «la cuenta de Administración».
- Versión: `'21-oct-2026 · fila 411'` en `VERSION_SCRIPT` y `SCRIPT_ESPERADO`; poner al día la cita
  de la versión en `docs/contexto/CORREO-Y-SENECA.md`.
- Copia de pruebas: la respuesta simulada de `llamar()` devuelve también `cuenta` con la cuenta de
  Administración (si no, sale siempre en ámbar).
- Buscador de Ajustes: añadir «remitente, cuenta de Administración» al campo `otras` de
  `bloque-datos-centro` en `js/ajustes-reparto.js`; no hace falta entrada nueva.
- `seguidos.json` lo reescribe la app en la carpeta señalada (`js/bandeja-huella.js`): al señalar la
  de la cuenta común se crea allí solo.

Ficheros a tocar (cambios quirúrgicos, nada de rehacer módulos): `apps-script/gestor-correos.gs`,
`js/correo-enviar.js`, `js/plantillas-ajustes.js`, `js/plantillas.js`, `js/bandeja-ajustes.js`,
`js/bandeja-latido.js`, `js/ajustes-reparto.js`, `js/problemas.js`, `js/novedades.js` (línea con
`id: '411'`), `docs/contexto/CORREO-Y-SENECA.md`, y las pruebas (`pruebas/envio-apps-script.mjs` y una
nueva `pruebas/correo-cuenta-comun.mjs`, que `pruebas/ejecutar.mjs` encuentra sola). Una sola tanda
de pruebas completa al final.

## Pasos de Francisco (van a `docs/TE-TOCA.md` al terminar la fila)

0. Antes de cambiar de carpeta: dejar vacío «Ha llegado» en el Gestor (meter en su asunto o
   descartar los correos que queden), porque lo que espere en la bandeja vieja deja de verse.
1. Quitar el reenvío de la cuenta común. Con la cuenta común abierta:
   https://mail.google.com/mail/u/0/#settings/fwdandpop → «Inhabilitar el reenvío» → «Guardar
   cambios». (Si el reenvío lo hizo dirección con un filtro, el filtro está en
   https://mail.google.com/mail/u/0/#settings/filters.)
2. En https://script.google.com/home, con la cuenta común: proyecto nuevo «Gestor - Correos», pegar
   `apps-script/gestor-correos.gs`, ejecutar `prepararTodo`, «Implementar» → aplicación web («Ejecutar
   como: Yo», acceso «Cualquier usuario»), y pegar la dirección `/exec` con su clave en Ajustes de
   los dos ordenadores (los pasos ya están en Ajustes).
3. En los dos ordenadores del centro: Google Drive para ordenadores con la cuenta común, en modo
   «Duplicar archivos», y en Ajustes → Este ordenador señalar la `GESTOR-BANDEJA` de la cuenta común.
4. Parar el recolector viejo de la cuenta de Francisco: en su proyecto «Gestor - Correos»,
   «Activadores» (el reloj de la izquierda) → borrar el activador.

## Ejemplo real

Cuenta: 29700692.administracion@g.educaand.es. Remitente: «Administración · IES Fuente Lucena».
Primer correo de prueba: el primero que Francisco envíe desde un asunto tras pegar el script.

## Cómo sabré que está bien

1. Etiquetas «GESTOR» un correo en la cuenta común y aparece en «Ha llegado» del Gestor, en el
   ordenador de Francisco y en el de Diego.
2. Envías un correo desde un asunto: quien lo recibe ve «Administración · IES Fuente Lucena» y la
   dirección 29700692.administracion@g.educaand.es.
3. Ese correo queda en «Enviados» de la cuenta común, no en la de Francisco.
4. Un correo etiquetado «GESTOR» en la cuenta personal de Francisco ya no aparece en el Gestor.
5. En Ajustes, la app dice con qué cuenta de correo trabaja cada ordenador (y avisa en ámbar si no
   es la de Administración).

Los puntos 1 a 4 los comprueba Francisco tras sus pasos ([SOLO FRANCISCO]); el 5 y el nombre del
remitente (con `GmailApp` simulado) se comprueban en las pruebas y en la copia de pruebas.
