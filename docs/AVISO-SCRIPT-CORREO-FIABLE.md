# Aviso del script de correo fiable y con enlaces (tema 469)

Fila 471 de `docs/COLA.md` (tema 469). Junta la idea 468 (aviso de soporte de Francisco, 27-oct-2026 08:14,
desde Ajustes). Diseñada con Francisco el 27-oct-2026. Una sola sesión de Claude Code.

## Por qué

1. **Sale sin ser verdad.** El 27-oct-2026 la tarjeta «El envío de correo está anticuado» de
   Problemas salió con el script de Gmail ya al día. La app guarda en el navegador
   (`localStorage`, clave `gestor-envio-script-version`) la última versión del script que ha visto,
   y solo la renueva cuando el script contesta a un envío o a «Probar». Si el script se actualiza y
   no se envía nada desde ese navegador, la app sigue creyendo que es el viejo. Se fue al pulsar
   «Probar», que además manda un correo de prueba.
2. **No lleva a ningún sitio.** Cuando sí es verdad, la tarjeta dice «copia el código nuevo… en el
   proyecto «Gestor - Correos» de script.google.com», pero no da ni el enlace al código ni el enlace
   al sitio donde se pega.

Solo Francisco hace esta actualización: el texto puede seguir siendo corto.

## Lo que hay hoy (para situarse)

- `js/correo-enviar.js`: `SCRIPT_ESPERADO` (hoy `'23-oct-2026 · fila 441'`), `leerVersionConocida`,
  `registrarVersionScript`, `scriptDesactualizado`, `calcularProblema` (la tarjeta de Problemas),
  `pintarAvisoVersion` (línea ámbar en Ajustes → Mantenimiento → Enviar correo),
  `insertarAvisoEnCuadro` (línea ámbar al abrir el cuadro de Correo), `probar()` (manda un correo).
- `js/problemas-textos.js`, función `script()`: textos de la tarjeta.
- `js/problemas.js`: pinta las tarjetas; los `pasos` son texto (sin enlaces); las `acciones` son
  botones.
- `js/comprobacion-entrada.js`: la revisión de la entrada usa `CorreoEnviar.scriptDesactualizado()`.
- `apps-script/gestor-correos.gs`: `VERSION_SCRIPT`, `doPost` (envía), `conVersion` (añade
  `version` y `cuenta` a cada respuesta). **No tiene `doGet`.**

## El aviso de soporte que dio origen (idea 468, copia del archivo adjunto)

Archivo «2026-10-27 081427 mejora.txt» (Drive de Francisco). No hace falta abrirlo:

- Aviso de usuario (propuesta de mejora). App: Gestor de Asuntos. Pantalla: Ajustes. Contexto:
  copia sin internet · perfil Administración. Envía: Francisco Javier Marmolejo González
  (fmargon780@g.educaand.es). Fecha: 2026-10-27 08:14. Versión de la app: 26-oct-2026 · 05:53.
- Texto: «Problema en la aplicación: El envío de correo está anticuado. Qué pasa: Los correos se
  siguen enviando, pero sin las últimas mejoras. Por qué: El script de Gmail que está puesto en
  Google es más antiguo que la aplicación. Propongo: que en este mensaje ubicado en la sección
  Problemas se especifique el archivo de github que tenemos que pegar con el enlace para acceder a
  él y que tengamos también el enlace donde tenemos que pegarlo en el proyecto GAS».

## Ficha del cambio

### Resumen que aprobó Francisco (máx. cinco líneas)
1. La app pregunta al script su versión al abrirse, sin enviar ningún correo. Si está al día, el
   aviso no sale.
2. Cuando sí sale, trae dos botones: «Copiar el enlace del código» (para pegarlo en el Chrome de su
   cuenta personal) y «Abrir mis proyectos de Google».
3. Los pasos se reescriben: copiar, pegar, «Nueva versión», recargar. Ya no hace falta «Probar».
4. Sustituye: el enlace al código de la tarjeta de recogida de correos, que hoy no abre; pasa a ser
   el mismo de GitHub, también para copiar.
5. Al publicarse, el aviso saldrá una vez y será verdad: hay que poner el script nuevo.

### Qué verá y hará la usuaria cuando esté terminado
1. Si el script de Gmail ya está al día, la tarjeta «El envío de correo está anticuado» **no sale**
   en Problemas, aunque desde ese ordenador no se haya enviado nada ni pulsado «Probar». Lo mismo
   las líneas ámbar de Ajustes → Enviar correo, del cuadro de Correo y de la revisión de la entrada.
2. Si de verdad está anticuado, la tarjeta sale como hoy (título, qué pasa, por qué) y además lleva
   **dos botones nuevos**, delante del que ya tiene:
   - «Copiar el enlace del código»: **no abre nada**; copia al portapapeles
     `https://github.com/fmargon780/gestor-asuntos-ies/blob/main/apps-script/gestor-correos.gs`
     y avisa «Enlace copiado. Pégalo en el Chrome de tu cuenta personal.» (`U.aviso`, 'bueno').
     Motivo (Francisco, 27-oct-2026): la app se usa con cuentas g.educaand.es y el repositorio es
     de su cuenta personal de gmail.com; un enlace que se abre en ese navegador da «no encontrado».
     Además, la dirección se ve escrita en la tarjeta, como texto seleccionable (no enlace), en el
     paso 1, por si el portapapeles falla.
   - «Abrir mis proyectos de Google»: abre en una pestaña nueva la lista de proyectos de
     script.google.com con la cuenta de Administración
     (`https://script.google.com/home?authuser=<cuenta de Administración>`, la misma que usa hoy
     `cuentaDeAdministracion()`; si no se conoce, `https://script.google.com/home`).
   - El de siempre, «Ver «Enviar correo»», se queda el último.
   - «Copiar el enlace del código» es la acción «normal» de la tarjeta (la primera, con «(lo normal)»,
     como define `js/problemas.js`). Los tres botones son `acciones` con `alPulsar`; «Abrir mis
     proyectos de Google» abre con `window.open(url, '_blank', 'noopener')`; el de copiar usa el
     mismo sistema de copiar al portapapeles que ya usa la app (`js/copiar-ruta.js` o el que haya). `calcularProblema` deja de enganchar
     «Ver «Enviar correo»» por posición (`d.acciones[0]`): lo busca por su `id`
     (`problema-script-ver`). Ids nuevos: `problema-script-codigo` y `problema-script-proyectos`.
3. Los pasos de la tarjeta quedan así (texto, en este orden):
   1. «Pulsa «Copiar el enlace del código» y pégalo en el Chrome de tu cuenta personal (la que
      tiene el repositorio): https://github.com/fmargon780/gestor-asuntos-ies/blob/main/apps-script/gestor-correos.gs . Allí copia el archivo con su botón de copiar (arriba a la
      derecha del código).»
   2. «Pulsa «Abrir mis proyectos de Google», entra en «Gestor - Correos», borra el código que hay,
      pega el nuevo y guarda.»
   3. «Pulsa «Implementar» → «Gestionar implementaciones» → el lápiz → «Versión: Nueva versión» →
      «Implementar». Así la dirección no cambia.»
   4. «Vuelve aquí y recarga la página: si todo ha ido bien, esta tarjeta desaparece sola. No hace
      falta pulsar «Probar» ni pegar ninguna dirección.»
4. Al recargar la app con el script ya actualizado, la tarjeta desaparece sola en pocos segundos,
   **sin que se envíe ningún correo**.

### Qué NO cambia
- El envío de correos, «Probar» (sigue mandando el correo de prueba), la dirección guardada y su
  clave.
- Los pasos de alta del bloque Ajustes → Enviar correo (ya tienen sus enlaces).
- La tarjeta «Este ordenador no usa la cuenta de Administración» (fila 411), salvo que la
  consulta nueva también le renueva la cuenta conocida (ver «Decididas por Claude»).
- El envío nunca se bloquea por la versión.

### Qué NO se hace en esta tarea
- Guardar en Ajustes la dirección exacta del proyecto de Google (Francisco eligió el enlace a la
  lista de proyectos).
- Copiar el código desde la propia app (Francisco eligió el enlace a GitHub).
- Abrir GitHub desde la app: solo se copia su enlace.
- Que la app actualice el script por sí sola.
- Cambiar el texto de las líneas ámbar de Ajustes, del cuadro de Correo y de la revisión de la
  entrada (solo cambia cuándo salen).

### Qué más se ve afectado (y qué pasa con cada cosa)
- Línea ámbar de Ajustes → Enviar correo, línea ámbar del cuadro de Correo, línea «Envío de correo»
  de la revisión de la entrada: dependen de `scriptDesactualizado()`; con la versión renovada al
  abrir, dejan de salir cuando no toca — decidido por Claude.
- `apps-script/gestor-correos.gs`: gana `doGet` (ver Suposiciones) y sube `VERSION_SCRIPT` a
  `'<fecha> · fila 469'`; `SCRIPT_ESPERADO` sube igual. **Efecto:** en cuanto se publique, la
  tarjeta saldrá una vez, y será verdad, porque el script puesto en Google aún no tiene `doGet`.
  Francisco lo actualiza siguiendo la propia tarjeta nueva — decidido por Claude; se le dice en el
  resumen.
- Copia de demostración (`?demo=1`): hoy `js/demo/datos-problemas.js` siembra a propósito una
  versión vieja (`'20-sep-2026 · fila 180'`) para que se vea la tarjeta, y `pruebas/problemas.mjs`
  (puntos 3 y 7) cuenta con ella. Eso se mantiene: el script de mentira tiene una «versión puesta»
  que por defecto es esa misma vieja, y la consulta silenciosa de la demo contesta con ella, así que
  la tarjeta sigue saliendo en la demostración y esas pruebas no cambian. Si en `localStorage` está
  `gestor-demo-script-al-dia` = `'1'`, el script de mentira tiene puesta `SCRIPT_ESPERADO` y la
  consulta contesta con ella. En la demostración, la consulta se lanza **después** de
  `Demo.problemas.construir` (si se lanzara antes, la siembra la pisaría) — decidido por Claude.
- Enlace al código en `js/bandeja-latido.js` (`ENLACE_CODIGO`, tarjeta de la recogida de correos):
  hoy apunta a `raw.githubusercontent.com`, que en un repositorio privado no abre ni con la sesión
  de GitHub iniciada. Se cambia a la misma dirección `github.com/.../blob/main/apps-script/gestor-correos.gs`
  y, como en la tarjeta nueva, se copia en vez de abrirse (mismo texto de aviso), para que la app
  trate igual el enlace al código en todas partes — decidido por Claude.
- Ordenador que nunca ha visto ninguna respuesta del script (versión desconocida) con el script
  viejo, sin `doGet`, puesto en Google: la consulta no dice nada y la tarjeta no sale, como hoy. Con
  el script nuevo puesto, la consulta sí trae la versión — decidido por Claude.
- `latido.json` también lleva `version` (lo escribe la recogida con el código guardado, que puede
  no ser el implementado). **No se usa** para esto: la fuente buena es la respuesta del script
  implementado (la consulta o un envío) — decidido por Claude.
- Revisión de la entrada (`js/comprobacion-entrada.js`): en la demostración siempre dice «bien» para
  el envío; no se toca y el revisor no la comprueba — decidido por Claude.
- Perfil de directivo: la consulta se hace igual si en ese navegador hay dirección guardada; no
  cambia nada de lo que ve — decidido por Claude.

### Suposiciones
- Preguntadas a Francisco:
  - Quién actualiza el script → solo él; el aviso puede ser corto.
  - Cómo coger el código → enlace al archivo en GitHub, **para copiarlo y pegarlo en su Chrome
    personal**, no un botón que lo abra (la app va en cuentas g.educaand.es; el repositorio es de su
    gmail.com).
  - Enlace al proyecto de Google → la lista de proyectos de script.google.com, sin configurar nada
    (sabe que es un clic más y que necesita la cuenta de Administración en el navegador).
- Decididas por Claude:
  - **Consulta silenciosa de la versión.** El script nuevo añade `doGet(e)`: con `?k=<clave>`
    correcta (la misma `PROPIEDAD_CLAVE` que `doPost`) contesta
    `{ ok: true, soloVersion: true, version, cuenta }` y **no envía nada**; con clave mala o sin
    clave, `{ ok: false, motivo }` sin `version`. Se usa GET porque un script viejo, que no tiene
    `doGet`, no puede confundirlo con un envío: contesta una página de error, la app no la entiende
    como JSON y **no toca** lo que ya sabía (si sabía «viejo», la tarjeta sigue: es verdad).
  - **Cuándo se consulta.** Al cargar la app, una vez por carga, solo si hay dirección del script
    guardada en ese navegador, sin esperar a nada más ni bloquear nada; con tiempo límite corto
    (unos 15 s). Y otra vez cada vez que se entra en Ajustes → Mantenimiento (donde
    `App.pintarAjustesMantenimiento` ya recalcula todas las tarjetas), como mucho una vez por
    minuto. No se crea ningún botón «Volver a calcular» para esta tarjeta. Si contesta con
    `version`, se llama a `registrarVersionScript(version, cuenta)` como hoy, y la tarjeta y las
    líneas ámbar se recalculan solas.
  - **Cuenta.** Esa misma llamada renueva también la cuenta conocida, y eso puede encender o apagar
    al cargar la tarjeta «Este ordenador no usa la cuenta de Administración» (fila 411). Se quiere
    así: dice la verdad sin esperar a un envío.
  - **A qué dirección.** La consulta va a la dirección guardada tal cual (con su `?k=`), sin probar
    la «forma general» de `llamar()`, y **nunca** apunta nada en `generalNoVale` ni cambia la
    dirección guardada: un fallo de la consulta no puede afectar a los envíos.
  - Fallo de red, tiempo agotado o respuesta que no es JSON: no dicen nada de la versión; no se
    toca lo guardado (misma regla que hoy en `llamar`).
  - El enlace de GitHub apunta a `main`, que es lo publicado: siempre es el código que la app
    espera.
  - `authuser` con la cuenta de Administración, para que la lista de proyectos se abra con esa
    cuenta si está en el navegador.

### Ejemplo real
- 27-oct-2026, 08:14, Francisco en Ajustes, perfil Administración, app «26-oct-2026 · 05:53»:
  Problemas enseñaba «El envío de correo está anticuado» con el script de Google ya al día
  (`'23-oct-2026 · fila 441'`). Al pulsar «Probar», desapareció. Con este cambio, al recargar la
  página no habría salido.

### Pendiente
- Nada.

### Cómo sabré que está bien (Francisco, en pantalla)
1. Con la app publicada, en el ordenador de Francisco (que ya conoce la versión vieja), Problemas enseña «El envío de correo está anticuado» con los botones
   «Copiar el enlace del código» y «Abrir mis proyectos de Google» (sale una vez y es verdad: hay que
   poner el script nuevo).
2. «Copiar el enlace del código» copia la dirección; pegada en el Chrome de su cuenta personal,
   abre el archivo `gestor-correos.gs`.
3. «Abrir mis proyectos de Google» abre en una pestaña nueva la lista de proyectos de Apps Script,
   donde está «Gestor - Correos».
4. Tras pegar el código y hacer «Nueva versión», al recargar la app la tarjeta desaparece sola, sin
   pulsar «Probar» y sin que llegue ningún correo de prueba.
5. Al día siguiente, al abrir la app, la tarjeta no vuelve a salir.

Los puntos 1 a 4 los mira Francisco con el script real: para el revisor son **[SOLO FRANCISCO]** en
su parte real; el revisor pasa la versión de demostración de abajo.

### Cómo se comprueba (para Claude Code y el revisor; un punto por cada línea de «Qué verá y hará»)
1. Pruebas unitarias de la decisión: versión guardada vieja + consulta que contesta `SCRIPT_ESPERADO`
   → `scriptDesactualizado()` falso y la tarjeta se quita; consulta que no contesta JSON → no cambia
   lo guardado; clave mala (`ok:false` sin `version`) → no cambia lo guardado.
2. En `?demo=1&auto=1` tal cual → Problemas enseña la tarjeta con los tres botones en este orden:
   «Copiar el enlace del código» (lo normal), «Abrir mis proyectos de Google», «Ver «Enviar correo»»,
   y los cuatro pasos de arriba.
3. En la demostración, poner en `localStorage` `gestor-demo-script-al-dia` = `'1'` y recargar → la
   tarjeta **desaparece sola** en pocos segundos, sin pulsar nada, y no aparece ningún aviso de
   «correo de prueba enviado».
4. «Copiar el enlace del código» deja en el portapapeles la dirección exacta de GitHub, enseña el
   aviso «Enlace copiado…» y no abre ninguna pestaña; la dirección se ve escrita en el paso 1.
   «Abrir mis proyectos de Google» abre pestaña nueva con `script.google.com/home?authuser=` y la
   cuenta de Administración de la demo. El enlace al código de la tarjeta de
   la recogida (`js/bandeja-latido.js`) es la misma dirección `github.com/.../blob/...`.
6. `pruebas/problemas.mjs` sigue en verde sin tocar sus puntos 3 y 7.
5. `apps-script/gestor-correos.gs`: `doGet` con clave buena devuelve `version` y no llama a ninguna
   función de envío; con clave mala no devuelve `version`. `VERSION_SCRIPT` = `SCRIPT_ESPERADO`.

### Respuestas de Francisco durante el trabajo
- (las apunta Claude Code si tiene que preguntarle algo)
