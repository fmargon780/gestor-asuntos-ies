# Botón de soporte (fila 213 de la cola)

Diseño cerrado con Francisco el 28-sep-2026, en Cowork.

## Qué se quiere

Un botón «Soporte» en el Gestor para que quien lo usa (Francisco y su compañero) avise de un
error o proponga una mejora. Cada aviso llega a la cola de la app como una IDEA, y Francisco la
ve en su página «Centro de mando» junto a todo lo demás.

Sustituye a la vieja app «Soporte App-to-All» (tenía su base de datos en el proyecto de Supabase
`soporte-app-to-all`, hoy en pausa, y sus pantallas no están en ningún repositorio). **No se
reactiva ni se usa nada de ella.** No toques ese proyecto de Supabase.

El buzón se hace pensando en todas las apps de Francisco: más adelante se pondrá el mismo botón
en las demás, y todas enviarán al mismo buzón. En esta fila solo se pone el botón en el Gestor.

## 1. Lo que ve el usuario

- Un botón pequeño «Soporte», siempre visible en una esquina de la pantalla (abajo a la
  derecha), en todas las pantallas. Que no tape botones de la app.
- Al pulsarlo, una ventana con:
  1. Qué es: dos opciones, «Algo no funciona» y «Propongo una mejora». Obligatorio.
  2. Un recuadro de texto para contarlo. Obligatorio.
  3. Una zona para pegar una captura de pantalla con Ctrl+V (también arrastrar o elegir un
     fichero). Opcional. Se ve en pequeño y se puede quitar. Una sola imagen; si pesa mucho, se
     reduce en el navegador antes de enviar (máximo unos 1.500 px de ancho, JPEG).
- La app añade sola, sin preguntar: app («Gestor de Asuntos»), pantalla en la que estaba, quién
  lo envía (lo que la app ya sepa de la persona que ha entrado; si no sabe nada, pedir el nombre
  una vez y recordarlo en ese ordenador), fecha y hora, y la versión de la app. Si es «Algo no
  funciona», añade también los últimos errores de la consola que la app tenga guardados, si los
  tiene.
- Al enviar: «Recibido. Gracias». Si no se puede enviar (sin internet, buzón sin configurar),
  un aviso claro y el texto no se pierde: se queda en la ventana para reintentar.

## 2. El buzón: un script de Google, no Vercel

**Motivo:** en el centro se usa la copia sin internet (`file://`), porque la red del IES bloquea
`vercel.app` y `asuntos.fmargon.com`. Google sí funciona allí. Por eso el buzón es un script de
Google Apps Script publicado como aplicación web, no una función de Vercel.

- Código en el repositorio: `apps-script/soporte.gs`. Es la versión buena; la copia que se
  ejecuta se pega en script.google.com (igual que `gestor-correos.gs`).
- Recibe un POST con `Content-Type: text/plain` y el cuerpo en JSON (así el navegador no hace
  la pregunta previa de CORS y funciona desde `file://` y desde la web). Responde JSON con
  `ContentService`.
- Datos que recibe: `app`, `repo` (p. ej. `fmargon780/gestor-asuntos-ies`), `tipo` (`error` o
  `mejora`), `texto`, `pantalla`, `quien`, `fecha`, `version`, `errores` (opcional),
  `captura` (opcional, imagen en base64).
- Una lista de repositorios permitidos dentro del script (de momento solo
  `fmargon780/gestor-asuntos-ies`). Lo que venga de otro repositorio se rechaza. Límite de
  tamaño razonable del cuerpo.
- **Guarda el aviso entero en Drive**, en una carpeta `SOPORTE-AVISOS` (la crea si no existe),
  una subcarpeta por app: un documento o fichero de texto con todo lo recibido y, si la hay, la
  captura. Nada de esto va a GitHub.
- **Apunta una fila IDEA en `docs/COLA.md` del repositorio de la app**, con la API de GitHub
  (leer el fichero, añadir la fila, subir con su `sha`; si hay conflicto, releer y reintentar
  hasta 3 veces). Número: el siguiente al más alto de la cola. Texto de la fila, **sin nada del
  texto del usuario ni de la captura**, porque el repositorio del Gestor es público:
  `| N | Aviso de usuario: error en «<pantalla>» (o: mejora en «<pantalla>») | IDEA (fecha): enviada por un usuario desde el botón de soporte · aviso completo: <enlace a Drive> |`
  El enlace a Drive solo lo abre quien tenga permiso en esa carpeta (Francisco).
- El permiso de GitHub va en las propiedades del script (`PropertiesService`), nunca en el
  código ni en el repositorio.
- Función `prepararTodo` para la primera vez: crea la carpeta y comprueba que el permiso de
  GitHub funciona escribiendo nada (solo leyendo la cola).

## 3. La dirección del buzón en el Gestor

- En Ajustes, un campo «Dirección del buzón de soporte». Se guarda en `_GESTOR` (compartido por
  los dos ordenadores), no solo en el navegador.
- Sin dirección puesta, el botón se ve igual, y al enviar avisa: «El buzón de soporte aún no
  está configurado».
- El botón y su ventana deben funcionar en la web y en la copia sin internet. Comprueba que la
  copia sin internet (`scripts/copia-local.mjs`, `js/actualizar-copia.js`) incluye los ficheros
  nuevos y que nada de esto rompe su arranque.

## 4. Los pasos de Francisco, una sola vez

Escribe `docs/PONER-EN-MARCHA-SOPORTE.md`, en lenguaje llano, paso a paso, con enlaces directos:

1. Crear el permiso de GitHub: token de acceso *fine-grained*, solo para
   `fmargon780/gestor-asuntos-ies`, con permiso de escritura en *Contents*. (Más adelante se le
   añaden los repositorios de las demás apps.)
2. En script.google.com, con la cuenta `g.educaand.es` (los avisos pueden traer datos de
   alumnado): proyecto nuevo «Gestor - Soporte», pegar `soporte.gs`, guardar el token en las
   propiedades del script, ejecutar `prepararTodo` y autorizar.
3. Implementar como aplicación web: ejecutar como «Yo», acceso «Cualquier usuario». **Si la
   cuenta `g.educaand.es` no deja elegir «Cualquier usuario»**, repetir el paso 2 y 3 con la
   cuenta personal `fjmarmolejoglez@gmail.com` y decirlo en el documento.
4. Copiar la dirección de la aplicación web y pegarla en Ajustes → «Dirección del buzón de
   soporte» del Gestor.
5. Enviar un aviso de prueba y ver que aparece en el Centro de mando.

Añade este documento a «Lo que queda por hablar con Francisco» para que sepa que tiene que
hacerlo.

## 5. Pruebas

- Prueba en `pruebas/` del botón y la ventana: validación de campos, pegar una imagen,
  reducirla, enviar a un buzón falso, mensaje de recibido, mensaje de error sin perder el texto,
  buzón sin configurar.
- Prueba del script con un GitHub falso: la fila nueva lleva el número correcto, no lleva el
  texto del usuario, y el reintento por conflicto funciona.
- `npm test` completo en verde antes de publicar.

## 6. Fuera de esta fila

- Poner el botón en las demás apps.
- Cambiar la visibilidad del repositorio. (Hacerlo privado no rompería la copia sin internet,
  que se descarga de `fmargon780/gestor-asuntos-copia`, que sí tiene que seguir público. Solo
  habría que cambiar el enlace a `gestor-correos.gs` de `js/correo-enviar.js`. Se decidirá
  aparte con Francisco.)

## Cómo sabemos que está bien

1. Abrir la copia de pruebas con datos de demostración y entrar: abajo a la derecha, en Inicio y en
   cualquier otra pantalla, hay un botón pequeño «Soporte» que no tapa ningún otro botón.
2. Pulsar «Soporte»: se abre una ventana con dos opciones («Algo no funciona» y «Propongo una
   mejora»), un recuadro de texto, una zona para pegar una captura, y «Cancelar» y «Enviar». Con ✕,
   con «Cancelar» y con la tecla Escape la ventana se cierra.
3. Pulsar «Enviar» sin elegir nada, y luego eligiendo «Algo no funciona» sin escribir texto: la
   ventana sigue abierta y dice en cada caso qué falta.
4. Elegir «Propongo una mejora», escribir «Prueba de la revisión» y pulsar «Enviar» (sin haber
   puesto todavía ninguna dirección de buzón): sale un aviso rojo que dice que el buzón de soporte
   aún no está configurado, y el texto «Prueba de la revisión» sigue en el recuadro.
5. Ir a Ajustes → El centro, abrir «Buzón de soporte», escribir `http://no-vale` y salir del campo: la
   dirección no se guarda (dice que tiene que empezar por https://). Escribir
   `https://buzon.invalido/exec` y salir del campo: dice que se ha guardado, y al salir de Ajustes y
   volver a entrar el campo la sigue mostrando.
6. Con esa dirección puesta, volver al botón «Soporte», escribir un texto y pulsar «Enviar»: como
   el buzón de esa dirección no existe, sale un aviso rojo de que no se ha podido contactar con el
   buzón, y el texto sigue en el recuadro para reintentar (no se pierde).
7. **[SOLO FRANCISCO]** Pegar de verdad una captura con Ctrl+V dentro de la ventana: se ve en
   pequeño, se puede quitar con «Quitar la captura» y, al enviar de verdad, llega a Drive.
8. **[SOLO FRANCISCO]** Con el buzón de verdad puesto en marcha (`docs/PONER-EN-MARCHA-SOPORTE.md`),
   enviar un aviso: sale «Recibido. Gracias», el aviso completo está en Drive (`SOPORTE-AVISOS`) y
   aparece una fila IDEA nueva en el Centro de mando, sin el texto que se escribió.
9. **[SOLO FRANCISCO]** En la copia sin internet del centro (`file://`), el botón y la ventana
    funcionan igual y la app arranca como siempre.

## Cómo se hizo (30-sep-2026)

- Botón y ventana: `js/soporte.js` y `css/soporte.css`. Se carga justo después de `js/version.js`
  para recoger cuanto antes los errores de la consola (`window.onerror`, promesas rechazadas y
  `console.error`; se guardan los 10 últimos y solo viajan en «Algo no funciona»).
- La dirección del buzón vive en `registro.ajustesAvisos.urlSoporte` (`asuntos.json`, compartido por
  los dos ordenadores), como los demás días de aviso. El campo está en Ajustes → El centro → «Buzón de
  soporte»; solo se admite una dirección que empiece por `https://`.
- Decisión de la sesión: la pantalla que viaja es solo su **nombre** (Inicio, Archivo…), sacado del
  identificador de la pantalla, nunca el título que se ve (en la ficha sería el nombre del asunto y
  de la persona, y la fila de la cola es pública). El script además la limpia y la corta.
- Decisión de la sesión: si el aviso llega a Drive pero GitHub falla (permiso caducado, tres
  conflictos seguidos), el buzón contesta `ok` con `colaApuntada: false`: el aviso no se pierde y la
  persona no ve un error que no puede arreglar. Sin `GITHUB_TOKEN`, igual.
- El nombre de quien avisa: el usuario que ha entrado; si no lo hay (pantalla de entrada), se pide una
  vez y se recuerda en ese ordenador (`localStorage`, `gestor-soporte-nombre`).
- El buzón: `apps-script/soporte.gs`. Pruebas: `pruebas/soporte.mjs` (botón, ventana, Ajustes, envío
  con un buzón de mentira) y `pruebas/soporte-script.mjs` (el script con Drive y GitHub falsos).
