# La copia de pruebas: pruebas.fmargon.com con datos inventados

Fila 222 de la cola. Diseñada con Francisco el 28-sep-2026 (conversación de Cowork). Es la
primera de las dos filas del método nuevo «purgar los fallos antes de producción»; la segunda es
`docs/REVISOR-ANTES-DE-PUBLICAR.md` (fila 223), que no tiene sentido sin esta.

> Fila 242 (30-sep-2026): la copia en internet ya no es un paso de la cola; se nivela con `main` después
> de cada publicación, para que Francisco la mire si quiere (`docs/REVISOR-EN-LOCAL.md`).

## Qué quiere Francisco

Una dirección aparte, **https://pruebas.fmargon.com**, donde vive la versión que se está
probando. Producción (`https://asuntos.fmargon.com`) no cambia hasta que un revisor da el visto
bueno (fila 223). En la copia de pruebas se entra **sin señalar ninguna carpeta**: se pulsa
«Entrar con datos de demostración» y la aplicación arranca con un juego de datos inventados que
imita lo que hay en el centro. Se puede crear, cambiar, archivar y borrar sin miedo: nada se
guarda de verdad, y al recargar todo vuelve a estar como al principio. Francisco entrará desde
el móvil cuando quiera ver algo antes que su compañero; el revisor de la fila 223 entrará siempre.

Motivo: hasta hoy el primer sitio donde se veía un fallo era producción, porque Claude Code subía
directo a `main` y Vercel publicaba al momento. Eso se acaba con las filas 222 y 223.

## 1. La rama `pruebas` y su dirección

- Rama `pruebas` en el repositorio. Vercel la publica sola como *preview* (en `vercel.json` solo
  están apagadas las ramas `claude/**`; no tocar eso).
- La dirección `pruebas.fmargon.com` se asigna a la rama `pruebas` del proyecto `gestor-de-asuntos`
  (en Vercel, un dominio de proyecto con `gitBranch: "pruebas"`; el DNS de `fmargon.com` ya está en
  Vercel, así que no hay que tocar registros). Hazlo con la herramienta MCP de Vercel si la sesión
  la tiene (`add_project_domain`), o con la API de Vercel si hay un token en el entorno. Si no
  tienes ninguna de las dos, **no pares**: usa la dirección automática de la *preview* (la que
  Vercel da a la rama, `gestor-de-asuntos-git-pruebas-<cuenta>.vercel.app`; `list_deployments` o el
  aviso de publicación la dicen), apúntala en `docs/CONTEXTO-CORTO.md` sección 1 como «copia de
  pruebas», y deja en «Lo que queda por hablar con Francisco» de `docs/COLA.md` la única acción
  que falta: en Vercel, proyecto `gestor-de-asuntos` → Settings → Domains → Add `pruebas.fmargon.com`
  → asignar a la rama `pruebas`. Es un clic suyo, y la fila no depende de él.
- Esta fila (la 222) es la primera que se trabaja ya en la rama `pruebas` y se pasa a `main` al
  final. Cómo se nivela la rama con `main` y cómo se pasa después está en
  `docs/REVISOR-ANTES-DE-PUBLICAR.md`, sección 2; para esta fila no hay revisor todavía: basta con
  `npm test` en verde, la copia de pruebas comprobada por `curl` y a ojo con Playwright (sección 5
  de aquí), y después el paso a `main` y la comprobación de producción de siempre.

## 2. Los datos de demostración (`js/demo/`)

La técnica ya existe: `pruebas/navegador.mjs` sustituye `window.showDirectoryPicker` por un disco
de mentira en memoria (y `indexedDB` por un almacén de mentira). Lo mismo, pero **dentro de la
aplicación publicada**, en una carpeta nueva `js/demo/` (`pruebas/` no se publica, por
`.vercelignore`; no muevas nada de allí: copia la idea, no el fichero). Ficheros, ninguno de más de
600 líneas:

- `js/demo/disco.js`: el disco y el almacén de mentira. Mismo comportamiento que el de
  `pruebas/navegador.mjs` (permisos siempre concedidos, ficheros y carpetas en memoria). Expone
  `window.Demo` con `activar()`, `activo()` y `reiniciar()`.
- `js/demo/datos.js`: el juego de datos. Se escribe en el disco de mentira al activar, con la
  **misma estructura de carpetas y ficheros que un centro de verdad** (`_GESTOR/` con sus JSON,
  carpetas de asuntos abiertos con su nombre reglamentario, `ARCHIVO/<curso>/…`, documentos por
  clasificar, `RegAlum.csv`). Usa las funciones de la propia aplicación para dar de alta y crear
  (no fabriques a mano JSON que la aplicación luego no reconozca): si hace falta, activa primero el
  disco vacío y crea los datos llamando a `App`/módulos como lo haría la pantalla.
- `js/demo/franja.js`: la franja fija de arriba y la entrada.

Qué tiene que haber (nombres claramente inventados; nada de personas reales):

- 25 alumnos en `RegAlum.csv`, repartidos en 6 grupos de ESO y Bachillerato, con padre, madre o
  tutor; dos parejas de hermanos; un alumno antiguo (no matriculado); un aspirante sin número
  escolar. Todos con DNI/NIE con formato válido pero ficticio.
- 3 empresas (razón social + NIF ficticio, una con nombre comercial), 2 Administraciones (un
  centro con código y la Delegación Territorial, con dos departamentos), 4 personas del personal.
- 8 tipos de asunto de distintas categorías, con quién los encarga, guía de 2 a 4 hitos con
  tareas, y al menos dos con plantilla de correo y uno con plantilla de documento; uno reservado;
  uno recurrente.
- 12 asuntos abiertos: en hitos distintos, uno vencido, uno dormido, uno «Esperando a…» un
  tercero, uno esperando a una Administración, uno reservado, dos del mismo tercero (para ver la
  parada de duplicados), uno con relacionados por grupo, uno con hilo de correo ya registrado.
- 6 asuntos archivados en dos cursos (`2025-2026` y `2026-2027`), con su ficha e índice.
- Fila 241: el tipo `SEGURO ESCOLAR` (campo propio «Importe»), con dos cobros abiertos y tres ya
  archivados (1,12 € cada uno), para probar «Exportar ▾» con totales.
- 4 documentos PDF pequeños generados al vuelo con `pdf-lib` (ya está en `js/lib/`): dos dentro
  de asuntos (uno registrado con sello simulado en «Versiones previas»), dos «por clasificar».
- Tablón con 2 notas. Ajustes del centro rellenos (nombre del centro, cargos, firmantes, días de
  aviso), para que las plantillas y el membrete salgan enteros.
- La bandeja de Gmail y el envío de correo/Séneca **no salen al exterior**: en modo demo,
  «Enviar» hace todo lo de siempre (resumen, confirmación, rastro en el asunto) pero la llamada al
  script de Google se sustituye por una respuesta de mentira «enviado» al instante. La bandeja de
  correos muestra 2 correos inventados con adjunto.
- Los dos puestos de trabajo: la señal de presencia del compañero está puesta en uno de los
  asuntos, para que «modo consulta / Tomar el mando» se pueda ver.

## 3. Cuándo se activa, y cuándo no

- **Solo** cuando la aplicación se abre en `pruebas.fmargon.com`, en una dirección de *preview* de
  Vercel (`location.hostname` contiene `-git-pruebas-`), en `localhost`/`127.0.0.1`, o con `?demo=1`
  en la dirección. En `asuntos.fmargon.com` y en la copia sin internet (`file://`) **no aparece
  nada de esto**: ni el botón, ni la franja, ni se carga `js/demo/` (cárgalo desde `index.html`
  con una comprobación previa, o desde `js/nucleo.js` con `import()` solo cuando toca; que en
  producción no se descargue ni un byte de más).
- En la pantalla de entrada (la de señalar las carpetas), un botón más, **«Entrar con datos de
  demostración»**, con una línea debajo: «Datos inventados. Nada se guarda: al recargar, vuelve a
  empezar.» El botón de señalar las carpetas de verdad sigue estando, por si algún día hace falta.
- Con `?demo=1` (o `?demo=1&auto=1`) se entra directamente, sin pulsar nada: es lo que usará el
  revisor con Playwright, y lo que usará Francisco desde el móvil si se guarda la dirección con
  eso puesto.
- Franja fija arriba del todo, en todas las pantallas, con las palabras de `docs/VOCABULARIO.md`:
  «Copia de pruebas · datos inventados · nada se guarda» y un botón «Volver a empezar»
  (`Demo.reiniciar()`: vacía el disco, vuelve a escribir los datos y recarga). La franja no tapa la
  cabecera fija ni la de la copia sin internet: mira `js/cabecera-fija.js` y `css/` para el hueco.
- Recargar la página = disco nuevo con los datos de partida. No hay persistencia entre recargas,
  a propósito: así el revisor siempre parte de lo mismo y nadie tiene que limpiar nada.

## 4. Lo que no hay que hacer

- No metas condiciones «si demo, entonces…» repartidas por los módulos. El disco de mentira
  cumple la misma interfaz que la carpeta de verdad, así que la aplicación no tiene que saber
  que está en demo. Las únicas excepciones permitidas: la entrada (botón), la franja, y la
  llamada al script de Google del envío (`js/correo-enviar.js`) y de la bandeja, que en demo
  contestan de mentira.
- No toques `pruebas/navegador.mjs` ni las pruebas que ya existen, salvo para añadir las nuevas.
- No crees otro proyecto de Vercel ni cambies el de producción. Un solo proyecto, dos ramas.
- No reescribas ficheros enteros: cambios quirúrgicos. No leas el repositorio entero: lee
  `docs/CONTEXTO.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (para saber dónde vive la entrada
  y la cabecera) y `pruebas/navegador.mjs`.

## 5. Cómo sabemos que está bien

Esta sección es la que usará el revisor (fila 223) para las filas siguientes; en esta fila la
pasa la propia sesión, a ojo, con Playwright contra la copia de pruebas ya publicada.

1. Abrir `https://pruebas.fmargon.com/?demo=1` (o la dirección automática de la *preview*): la
   aplicación entra sola, con la franja «Copia de pruebas» arriba y sin pedir carpetas.
2. Inicio muestra asuntos abiertos en las cuatro pestañas (En Administración, En espera, Todos
   los abiertos, Dormidos), con al menos un vencido en rojo, y el cuadro de avisos con algo.
3. Nuevo asunto: buscar «Pérez» (o el apellido inventado que toque) encuentra alumnos; crear un
   asunto del primer tipo de la lista termina en su ficha, y aparece en Inicio.
4. Abrir un hito de un asunto, «Generar documento» con la plantilla del tipo: se ve el documento
   dentro de la app, con membrete y firmante; «Comunicar» por correo termina con «Correo enviado
   a…» sin que salga nada al exterior.
5. Archivo: el selector de curso ofrece los dos cursos y el buscador encuentra un archivado por
   el apellido del tercero.
6. Ajustes abre y muestra los 8 tipos; Personas y empresas muestra alumnos, empresas y
   Administraciones.
7. «Volver a empezar» (o recargar) deja todo como al principio: el asunto creado en el punto 3
   ya no está.
8. Abrir `https://asuntos.fmargon.com` (producción): ni franja, ni botón de demostración, ni
   petición a `js/demo/` en la red del navegador. Y `https://asuntos.fmargon.com/?demo=1` **sí**
   entra en demo (es la puerta de emergencia si la copia no estuviera publicada), con la franja.
9. Consola del navegador sin errores en los puntos 1 a 7.

## 6. Pruebas automáticas

- `pruebas/copia-de-pruebas.mjs`, con Chromium real como las demás: entra con `?demo=1`, comprueba
  la franja, que Inicio tiene asuntos, que crear uno funciona, que `Demo.reiniciar()` lo quita, y
  que sin `?demo=1` y con un `hostname` de producción (simúlalo) `window.Demo` no existe.
- Mientras trabajas: `npm test -- demo copia`. La pasada completa una sola vez, antes de subir.

## 7. Ficheros

Nuevos: `js/demo/disco.js`, `js/demo/datos.js`, `js/demo/franja.js`, `css/demo.css`,
`pruebas/copia-de-pruebas.mjs`. Modificados: `index.html` (carga condicional), el módulo de la
entrada/señalar carpetas (`js/carpetas.js` y la pantalla que lo usa), `js/correo-enviar.js` y el
de la bandeja (respuesta de mentira en demo), `js/cabecera-fija.js` o su CSS (hueco para la
franja), `js/version.js`. Documentación: `docs/CONTEXTO-CORTO.md` (sección 1: la dirección de la
copia de pruebas; sección 5: una línea «Copia de pruebas con datos de demostración»),
`docs/CONTEXTO.md` o el hijo que toque (dónde vive `js/demo/` y qué no debe hacer), `docs/HISTORIA.md`,
`docs/COLA.md`, `docs/ESTIMACIONES.md`. Subidas a Vercel: como mucho tres (rama `pruebas`, y el
paso a `main`).

## Fila 318: carpetas sin permiso en la copia de pruebas

- `?demo=1&auto=1&sinpermiso=alumnado,bandeja,centro-de-datos`: esas carpetas de mentira están recordadas y empiezan sin
  permiso (`queryPermission` da `'prompt'` hasta que se llama a `requestPermission`). El panel «Comprobación al entrar» sale
  solo, cuando la demostración ya está montada, con «Dar permiso» en esas filas.
- `&niega=bandeja`: para esos `id`, `requestPermission` da `'denied'`.
- Sin `auto=1`, al pulsar «Entrar con datos de demostración» se piden esos permisos; con `auto=1` no hay pulsación y no se pide nada.
- Código: `js/demo/permisos.js`. Sin `sinpermiso=` la demostración queda igual.

## Fila 319: `masnuevo=`

- `?demo=1&auto=1&masnuevo=alumnado,personal` (claves: `alumnado`, `personal`, `alumnado-bd`): la carpeta del Centro de datos de mentira queda señalada
  sola, con permiso; se toma lo que trae y, unos segundos después, el índice anuncia listados más nuevos de esas claves sin coger. En Herramientas →
  «Traer el alumnado» esas filas salen en ámbar con «Traerlo». Código: `js/demo/mas-nuevo.js` (`Demo.masNuevoListo` avisa a las pruebas).
- El Centro de datos de mentira lleva ahora un `ALUMNADO-BD.json` inventado y válido. Sin `masnuevo=` la demostración queda como siempre, salvo el recuadro nuevo.
- Los ficheros escritos en el disco de mentira conservan la fecha de cuando se escribieron (antes era la hora de leerlos).
