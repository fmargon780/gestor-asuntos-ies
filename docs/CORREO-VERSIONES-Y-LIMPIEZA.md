# Correo que no sale dos veces, versiones que se reconocen, y limpieza (fila 178)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Tercera y última parte de la «tanda de
estabilidad» (`claude/Analisis-estabilidad-crecimiento-2026-09-26.md`, en el proyecto de Claude).
**Va después de la fila 177.**

Idea de fondo: seis arreglos pequeños e independientes. Ninguno cambia lo que se hace en pantalla;
dos añaden un aviso.

## Ficheros que se tocan

- `apps-script/gestor-correos.gs` y `js/correo-enviar.js` (puntos 1 y 2)
- `js/copias.js`, `js/carpetas.js`, `js/conflictos.js`, `js/nucleo.js` (punto 3)
- `js/actualizar-copia.js` o un fichero nuevo `js/aviso-version-web.js` (punto 4)
- `js/copias.js` (punto 5)
- `vercel.json` (punto 6)
- `pruebas/relacionados.mjs`, `pruebas/logica.mjs`, `pruebas/ficha-tercero.mjs` (punto 7)
- `js/hitos-archivo.js` (punto 8)
- `docs/contexto/CORREO-Y-SENECA.md`, `docs/CONTEXTO.md`, `docs/ENVIO-CUENTA-DEL-SCRIPT.md`
- Una prueba nueva en `pruebas/` (sin navegador)

No leas el repositorio entero. Cambios quirúrgicos. `js/conflictos.js` (593 líneas) y `js/nucleo.js`
(529) pasan de 400: si la fila 176 no los partió ya, se parten antes de tocarlos.

## Qué hay que hacer

### 1. El script recuerda los envíos de forma permanente

Hoy el script rechaza un `idEnvio` repetido solo durante **seis horas** (`CacheService`, el máximo).
Un reintento más tarde manda el correo otra vez.

- En `gestor-correos.gs`, además de la caché, apuntar cada `idEnvio` enviado en
  `PropertiesService.getScriptProperties()`, agrupados por día (`enviados-AAMMDD` → lista de ids),
  y borrar los grupos de más de **60 días** en cada pasada del disparador. Antes de enviar, mirar la
  caché y, si no está, los grupos de los últimos 60 días. La respuesta sigue siendo `yaEnviado: true`.
- `VERSION_SCRIPT` sube (fecha y fila). La cabecera del `.gs` apunta el cambio, como siempre.

### 2. La app sabe qué versión de script tiene delante

El script ya devuelve `version` en cada respuesta; la app **no la lee**. Un script viejo con una app
nueva falla en silencio (por ejemplo, reenvía porque no conoce `idEnvio`).

- En `js/correo-enviar.js`, una constante `SCRIPT_ESPERADO` con el `VERSION_SCRIPT` de este cambio.
  Tras cada respuesta (también la de «Probar») se compara: si el script es más viejo, aviso ámbar
  persistente en Ajustes › Enviar correo y, al abrir el cuadro de Correo, una línea ámbar: «El
  script de Gmail es más antiguo que la app (tienes X; hace falta Y). Vuelve a pegarlo:
  `docs/ENVIO-CUENTA-DEL-SCRIPT.md`». Si es más nuevo, no se avisa. El envío no se bloquea.
- «Probar» enseña la versión del script en el resultado.

### 3. Número de esquema en los ficheros compartidos

Los ficheros de `_GESTOR` no llevan versión. Una app vieja abierta en un ordenador puede escribir el
formato antiguo sobre datos ya migrados por el otro.

- `Copias.guardar` escribe en cada uno de los dieciocho ficheros que son un objeto (no en
  `envios.json`, que es una lista) la clave de primer nivel **`_esquema: N`**, con `N = 1` ahora,
  guardada en una constante única (`Copias.ESQUEMA`). Cada migración futura que cambie el formato
  sube `N`.
- Al leer uno de esos ficheros para escribirlo (en `Copias.guardar`, que ya relee), si el fichero
  trae un `_esquema` **mayor** que `Copias.ESQUEMA`, no se escribe: error con nombre
  (`EsquemaMasNuevo`) y `U.fallo('En el otro ordenador hay una versión más nueva de la aplicación.
  Recarga la página para ponerte al día.')`. La lectura para enseñar sigue funcionando.
- `App.fusionarConDisco` y las fusiones de `js/conflictos.js` conservan `_esquema` (el mayor de los
  dos). `Copias.comprobarTodos` lo ignora (un fichero sin `_esquema` es válido: es de antes).

### 4. Aviso de versión nueva también en la web

La copia sin internet ya avisa con una franja cuando hay versión nueva. La web no: quien la tiene
abierta trabaja con la vieja hasta que recarga.

- Cada 30 minutos (y al recuperar el foco, como mucho una vez cada 10 minutos), cuando la app se
  sirve por `https://` y no hay guardado en marcha, pedir `js/version.js?v=<hora>` y leer su
  `App.VERSION`. Si es distinta de la cargada, la **misma franja** de arriba que usa la copia sin
  internet: «Hay una versión nueva. Recargar». Nunca recarga sola. Reutilizar la franja de
  `js/actualizar-copia.js`; si ese fichero no debe cargarse en la web, fichero nuevo
  `js/aviso-version-web.js` con solo esto.

### 5. La copia de seguridad se comprueba antes de sobrescribir el original

`js/copias.js` escribe la copia del día y, sin más, escribe el original encima. Si la copia quedó
mal escrita, la red de seguridad no existe.

- Tras escribir la copia, releerla y hacerle `JSON.parse`. Si falla, reintentar una vez; si vuelve
  a fallar, **no** escribir el original: error con nombre (`CopiaNoVerificada`) y `U.fallo('No he
  podido guardar: la copia de seguridad no se ha escrito bien. Vuelve a intentarlo.')`. Solo se
  comprueba la primera escritura del día de cada fichero (las demás no hacen copia), así que no
  encarece cada guardado.

### 6. Política de scripts en las cabeceras de seguridad

`docs/CONTEXTO.md` dice que no se pone `script-src` porque hay manejadores en línea. Ya no los hay
(`grep 'onclick="' index.html` da cero; los manejadores son propiedades). Añadir a la
`Content-Security-Policy` de `vercel.json`: `script-src 'self' blob:` (el `blob:` por el trabajador de
pdf.js). **Comprobar con las pruebas de navegador** que siguen funcionando el visor de PDF, el de
Word (docx-preview, JSZip, html2canvas) y las herramientas de PDF. Si algo se rompe y no se arregla
en dos intentos, se quita la política y se apunta en `docs/CONTEXTO.md` el motivo concreto.

### 7. Datos de prueba que no parezcan personas reales

En `pruebas/relacionados.mjs` (~84), `pruebas/logica.mjs` (~411) y `pruebas/ficha-tercero.mjs`
(~280-281) hay nombres con DNI cuya letra de control es correcta, teléfonos y correos con el patrón
real de `g.educaand.es`. Sustituirlos por datos claramente inventados: nombres tipo «Pérez Ejemplo,
Prueba», DNI `00000000T` / `11111111H` (letra correcta pero números de relleno), teléfonos
`600000001…`, correos en `@ejemplo.invalid`. Las pruebas tienen que seguir en verde.

### 8. Los hitos no se quedan huérfanos si falla el historial al archivar

En `js/hitos-archivo.js` (~393), si falla la escritura del historial, los hitos del asunto se quedan
en `hitos.json` sin dueño y solo se avisa. Que el aviso siga (ámbar, accesorio), pero que la entrada
de `hitos.json` se quite igualmente en la misma operación de la cola, y que el historial se
reintente una vez.

## Lo que no se hace

- No se cambia la cuenta que ejecuta el script ni cómo se despliega (sigue pegándose a mano; eso es
  de `docs/LAS-CUENTAS.md`).
- No se empaquetan los scripts de `index.html` ni se cambia `Cache-Control`.
- No se migra ningún fichero: `_esquema` se añade la primera vez que cada uno se guarde.

## Prueba

Una prueba nueva sin navegador:

1. `Copias.guardar` sobre un fichero con `_esquema` mayor lanza `EsquemaMasNuevo` y no escribe;
   sobre uno sin `_esquema` escribe y lo añade.
2. Una copia del día que no se puede releer como JSON hace que `Copias.guardar` no toque el original.
3. Una respuesta del script con `version` más vieja que `SCRIPT_ESPERADO` deja el aviso ámbar; con la
   misma, no.

Además, las pruebas de navegador de PDF y Word tienen que pasar con la política del punto 6.
`npm test` completo al final, una sola vez.

## Al terminar

Actualizar `docs/contexto/CORREO-Y-SENECA.md` (memoria de envíos de 60 días; versión del script
comprobada), `docs/CONTEXTO.md` (`_esquema`; cabeceras; copia verificada; aviso de versión en la
web) y `docs/ENVIO-CUENTA-DEL-SCRIPT.md` (que el script hay que volver a pegarlo). Una línea en
`docs/HISTORIA.md`. En `docs/CONTEXTO-CORTO.md`, sección 8, sustituir «Envío: pegar el script nuevo
(filas 117 y 130)» por «Envío: pegar el script nuevo (filas 117, 130 y 178), «Nueva versión» y
«Probar»». **El mensaje final a Francisco tiene que decir, en una línea, que hay que pegar el script
una vez** (la app se lo recordará en Ajustes hasta que lo haga). Sube directamente a `main`, sin pull
request, en como mucho dos subidas.
