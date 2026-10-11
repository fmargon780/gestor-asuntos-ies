# El Gestor se mide solo

Fila 332 de `docs/COLA.md` (si en la tabla lleva otro número, vale el de la tabla). Diseñada con
Francisco el 11-oct-2026. Lee antes `docs/PLAN-DATOS-DEL-GESTOR.md` (es corto) y `docs/CONTEXTO.md`.
De `docs/contexto/` solo `PANTALLA.md`, por la línea de `js/soporte-cargar.js`.

## Qué quiere Francisco

Saber, con medidas reales, qué es lento o frágil en el Gestor. Hoy el Gestor no mide nada. Esta
fila hace que apunte solo cuánto tarda cada cosa y que mande esas cifras, una vez al día, al buzón
de soporte. Dentro de una semana se mira qué sale.

**Decidido por Francisco:**

1. Las cifras salen del centro **solas**, por el mismo camino que el botón «Soporte». Él no hace nada.
2. Viajan **solo tiempos, tamaños de fichero y cuántos asuntos hay**. Ningún nombre de persona,
   de asunto ni de documento.

**Decidido en la conversación, sin pregunta:** las medidas no se escriben en ninguna carpeta; viven
en el `localStorage` de cada ordenador hasta que el buzón dice que las tiene. Se mide siempre,
también en la copia de pruebas; enviar, solo fuera de ella.

## Qué hay que hacer

Cambios quirúrgicos. No leas el repositorio entero. Ficheros que se tocan:

- Nuevos: `js/medidas.js`, `js/medidas-enviar.js`, `js/medidas-enganches.js`,
  `js/medidas-pantalla.js`, `pruebas/medidas.mjs`.
- Una o dos líneas en cada uno: `js/nucleo.js` (el botón «Entrar»), `js/carpetas.js`,
  `js/reintentar-escritura.js`, `js/cola-guardado.js`, `js/conflictos.js`, `js/util.js`
  (`U.fallo`, `U.accesorio` y `U.ordenador`), `js/archivo-indice.js` (`leerDisco`),
  `js/soporte-cargar.js` (sacar la dirección del buzón a un sitio común),
  `js/envolturas-esperadas.js`, `js/ajustes-reparto.js` (la tarjeta nueva), `index.html`,
  `js/novedades.js`, `js/version.js`.

Nada más. Si hace falta tocar otro, dilo en la nota de la fila.

### 1. El apuntador (`js/medidas.js`, `window.Medidas`)

Se carga pronto en `index.html`, antes de `js/reintentar-escritura.js` y `js/carpetas.js`. No
depende de nada. Quien lo llama lo hace siempre con `if (window.Medidas)`.

- `Medidas.tiempo(rotulo)` devuelve una función; al llamarla apunta los milisegundos pasados
  (`performance.now()`). `Medidas.cuenta(rotulo)` suma uno. `Medidas.peso(rotulo, bytes)` apunta
  el último tamaño y el mayor. `Medidas.foto(objeto)` guarda los recuentos del día.
- De cada tiempo se guarda, por día: cuántas veces, la suma, el máximo y siete cubos (menos de
  100 ms, de 300, de 1 s, de 3 s, de 10 s, de 30 s, y más). Nada más: ni cada medida suelta ni la hora.
- **La regla que no se puede romper: un rótulo nunca se monta con un dato.** Todo rótulo sale de
  la tabla fija del propio fichero. Para un fichero, `Medidas.rotuloDeFichero(carpeta, nombre)`:
  - si `nombre` está en la lista fija, ese nombre. La lista: los de `FICHEROS` de `js/copias.js`,
    más `indice-archivo.json`, `_ficha.json`, `HISTORIAL DE TRAMITACION.txt`, `usuarios.json`,
    `rutas.json`, `centro-de-datos.json`, `datos-origen.json`, `control-registro.json`,
    `actividades.json`, `encargos.json`, `perfiles.json`, `RegAlum.csv`, `ALUMNADO-BD.json`,
    `solicitantes.csv`, `personal.csv`, `empresas.csv`, `otros.csv`, `tutores.csv`,
    `administraciones.json`. Repásala contra la tabla «Lo que la aplicación guarda en `_GESTOR`»
    de `docs/CONTEXTO.md` y añade los que falten;
  - si la carpeta se llama exactamente `indice-archivo`, `presencia`, `copias`, `medidas`, `base` o
    `control-registro`: `indice-por-curso`, `presencia`, `copia`, `medidas`, `base` y
    `registro-por-año`. **Nunca el nombre del fichero**: el de `presencia` lleva el nombre de quien entra;
  - en cualquier otro caso, `otro.` más la extensión si es de una lista corta (`json`, `txt`, `csv`,
    `pdf`, `docx`), o `otro`.
- Guarda en `localStorage`, clave `gestor-medidas-<AAAA-MM-DD>`, como mucho cada 30 segundos y al
  ocultarse la página (`visibilitychange`, `pagehide`). Todo dentro de `try`: **medir nunca puede
  dar un error ni frenar nada.** Si `localStorage` no deja escribir, se mide en memoria y ya está.
- Borra los días de más de 30.
- `U.ordenador()` en `js/util.js` (regla 5.2 del plan): seis caracteres al azar, clave
  `gestor-ordenador`.

### 2. Qué se mide

Los rótulos son estos, escritos así. Lo que no esté aquí no se mide en esta fila.

| Rótulo | Dónde se engancha |
|---|---|
| `entrar.total`, `entrar.comprobar`, `entrar.cargar`, `entrar.lista` | `js/nucleo.js`, botón «Entrar». El total empieza **después** de los permisos y de `ActualizarCopia.alEntrar` (ahí espera a una persona), y acaba tras `App.irVista`. `comprobar` es `Copias.comprobarTodos`; `cargar`, de `App.cargarTipos` a `App.cargarRegistro`; `lista`, `App.verAbiertos` |
| `lista.repintar` | `App.verAbiertos`, las veces que no son la de entrar |
| `asunto.abrir` | `App.abrirFicha`, hasta que la ficha está pintada |
| `asunto.archivar`, `asunto.reabrir` | `App.cerrarAsunto`, `App.reabrirAsunto`, de fuera (con todas sus envolturas) |
| `archivo.leer-indice` | `IndiceArchivo.leerDisco` |
| `leer:<fichero>`, `escribir:<fichero>` | `Carpetas.leerTexto`, `escribirTexto` y `escribirBytes`: el tiempo, y `Medidas.peso` con los bytes |
| `guardar.espera:<fichero>`, `guardar.dura:<fichero>` | `ColaGuardado.poner`: lo que espera en la fila y lo que tarda su función |
| `reintento:<fichero>` (cuenta), `sin-remedio:<fichero>` (cuenta) | `js/reintentar-escritura.js`: cada reintento, y cada vez que se rinde |
| `conflicto:<fichero>` (cuenta) | `js/conflictos.js`: cada copia en conflicto encontrada |
| `fallo:<nombre del error>`, `accesorio:<nombre del error>` (cuentas) | `U.fallo` y `U.accesorio`: solo `e.name` y solo si está en una lista fija (`FicheroRoto`, `LecturaVacia`, `EsquemaMasNuevo`, `CopiaNoVerificada`, `AsuntoCerrado`, `SoloConsulta`, `NotFoundError`, `NotAllowedError`, `NotReadableError`, `InvalidStateError`, `NoModificationAllowedError`, `AbortError`, `QuotaExceededError`, `TypeError`); si no, `otro`. **Nunca el mensaje** |

`<fichero>` es siempre `Medidas.rotuloDeFichero(...)`. En `ColaGuardado.poner` la clave que llega
se pasa por la misma función (sin carpeta).

Las envolturas (`App.abrirFicha`, `App.cerrarAsunto`, `App.reabrirAsunto`, `App.verAbiertos`) van
en `js/medidas-enganches.js`, con `U.envolver`, cargado justo antes de
`js/envolturas-esperadas.js` y apuntadas en él. Son las únicas envolturas de la fila: lo demás es
una línea dentro de la función medida.

Una vez por sesión, 30 segundos después de entrar, `Medidas.foto`:

- `abiertos` (asuntos de `App.E.registro`), `sueltos` (`App.E.sueltos`), `conHitos` (asuntos con
  entrada en `hitos.json`), `tipos`, `archivados` (solo si el resumen del índice ya está en
  memoria: no se lee para esto);
- `entorno`: `protocolo` (`file` o `https`), `version` (`App.VERSION`), `soloConsulta`, `perfil`
  (`administracion` o `directivo`, nunca el nombre), `nucleos` (`navigator.hardwareConcurrency`),
  `memoria` (`navigator.deviceMemory`), `cros` (si el navegador es de ChromeOS) y `guiones`
  (cuántos `<script>` tiene la página).

### 3. El envío (`js/medidas-enviar.js`)

- La dirección del buzón es la de `js/soporte-cargar.js` sin lo que va detrás de `?`. Sácala a
  una variable común en ese fichero y úsala desde aquí: no la copies.
- Se envía con `fetch`, `POST`, `Content-Type: text/plain` y el cuerpo en JSON (así funciona
  también desde la copia sin internet):
  `{ "tipo": "medidas", "repo": "fmargon780/gestor-asuntos-ies", "version": "…", "dia": "AAAA-MM-DD", "ordenador": "…", "medidas": { "tiempos": {…}, "cuentas": {…}, "pesos": {…}, "foto": {…} } }`.
- Cuándo: 60 segundos después de entrar, después cada hora, y al volver la conexión (`online`).
  Cada vez: primero los días pasados que no estén confirmados, de uno en uno; después el día de
  hoy, como mucho una vez cada tres horas (el buzón sustituye el mismo día y ordenador).
- **Confirmado** es que la respuesta traiga `ok: true` y `medidas: true`. Solo entonces se borra
  ese día pasado del `localStorage`. El buzón de hoy todavía no entiende las medidas (lo hará con
  la fila 6 de `fmargon780/soporte-apps`) y contesta `ok: false`: se guarda y se reintenta en la
  siguiente pasada. **Nunca se enseña nada en pantalla por esto**, ni aviso ni error.
- El cuerpo no pasa de 60.000 caracteres. Con la lista fija de rótulos no puede pasar; si pasara,
  se mandan solo `tiempos` y `foto`.
- No se envía en la copia de pruebas (`demo=1`) ni bajo un navegador manejado por un programa
  (`navigator.webdriver`), salvo que la dirección lleve `medidas=1`. Mismo criterio que
  `sePide()` de `js/soporte-cargar.js`.

### 4. La tarjeta (`js/medidas-pantalla.js`)

En Herramientas → «Puesta a punto y reparaciones», una tarjeta plegada más, «Medidas»
(`js/ajustes-reparto.js`). Dentro:

- una frase: «El Gestor apunta cuánto tarda cada cosa. Solo cifras: ningún nombre de persona, de
  asunto ni de documento.»;
- una tabla del día de hoy en este ordenador, con cuatro columnas: «Qué», «Veces», «Lo normal»
  (el cubo donde cae la mediana, dicho en llano: «menos de 1 segundo») y «Lo peor». Los rótulos se
  enseñan en castellano con una tabla fija («Entrar», «Abrir un asunto», «Archivar», «Leer
  asuntos.json»…); ajusta las palabras a `docs/VOCABULARIO.md`;
- una línea: «Enviado por última vez: <fecha y hora>» o «Sin enviar todavía», y «Días guardados
  sin enviar: N».

Sin botones. Aprovecha el ancho.

### 5. Pruebas (`pruebas/medidas.mjs`)

Con los datos de demostración y la dirección del buzón interceptada (no sale nada de verdad):

1. Tras entrar, hay `entrar.total` con una vez. Tras abrir un asunto, `asunto.abrir`. Tras
   archivar, `asunto.archivar`, y `escribir:asuntos.json` con su peso.
2. `rotuloDeFichero`: `asuntos.json` da `asuntos.json`; un fichero de la carpeta `presencia` da
   `presencia`; un PDF con nombre de persona da `otro.pdf`; un nombre cualquiera, `otro`.
3. **La prueba que más importa:** tras recorrer la demostración (entrar, abrir tres asuntos,
   archivar uno, abrir Archivo, provocar un fallo de guardado), el cuerpo que se enviaría no
   contiene el nombre de ninguna persona, tercero, asunto, tipo ni documento de la demostración,
   ni el nombre de quien entra. Se comprueba buscando cada uno en el texto del JSON.
4. Con el buzón contestando `ok: false`, el día sigue guardado y no hay ningún aviso en pantalla.
   Con `ok: true, medidas: true`, un día pasado se borra y el de hoy no.
5. Con `localStorage` que lanza al escribir, la aplicación entra y guarda igual.
6. Sin `medidas=1`, bajo el navegador de pruebas no se hace ninguna petición al buzón.

### 6. Documentos

- `js/novedades.js`: una línea corta al principio. Por ejemplo: «El Gestor apunta ya cuánto tarda
  cada cosa (Herramientas → Puesta a punto), solo con cifras.»
- `docs/CONTEXTO-CORTO.md`: una línea en la sección 5 y una regla en la 6 («un rótulo de
  `Medidas` nunca se monta con un dato: sale de su lista fija»). Regla 5.6 del plan.
- `docs/contexto/PANTALLA.md` (el módulo), `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`,
  `docs/HISTORIA.md`.
- `docs/LOS-DATOS-DEL-CENTRO.md`, en «Esto sale»: las cifras de velocidad, sin nombres, que van a
  la carpeta de avisos de soporte del Drive de Francisco. Y una línea en «Lo que queda por hablar
  con Francisco» de `docs/COLA.md`: la copia de esa página que hay en el Dropbox del centro se ha
  quedado vieja.

## No se hace en esta fila

- Arreglar nada de lo que salga lento. Eso se decide con las cifras delante.
- Medir cada documento, cada pantalla o cada pulsación. La lista del apartado 2 es cerrada.
- Escribir las medidas en `_GESTOR` ni en ninguna carpeta.
- Tocar el programa del buzón: es la fila 6 de `fmargon780/soporte-apps`.

## Cuidado

- Sigue `CLAUDE.md`: rama `fila-332`, revisor en local y, con su APROBADA, a `main`; una sola
  publicación. Mientras programas, `npm test -- medidas soporte guardar-en-fila copias conflictos
  envolturas novedades scripts`; la pasada completa, una sola vez, antes de fusionar.
- `js/carpetas.js` y `js/cola-guardado.js` son el camino de todo guardado: el enganche es una
  línea antes y una después, dentro de `try`, sin cambiar lo que devuelven ni lo que lanzan.
- `EN_SOLITARIO` está en su tope: la prueba nueva espera a condiciones, no a pausas.
- No preguntes nada: decide y apúntalo en la nota de la fila.

## Qué decirle a Francisco al terminar

En tres frases. Que el Gestor ya apunta cuánto tarda en entrar, abrir un asunto, archivar y
guardar, y que se ve en Herramientas → Puesta a punto → «Medidas». Que las cifras empezarán a
llegarle a Claude cuando esté publicada la fila 6 del Soporte, y que mientras tanto no se pierden.
Y que dentro de una semana Claude las mira con él.

## Cómo sabemos que está bien

1. Abrir `?demo=1&auto=1`. Ir a Herramientas → «Puesta a punto y reparaciones» y desplegar
   «Medidas». Se ve la frase de «solo cifras» y una tabla con una fila «Entrar» con una vez y un tiempo.
2. Volver a Inicio, abrir un asunto y volver a la tarjeta «Medidas». Hay una fila de abrir un
   asunto con, al menos, una vez.
3. Archivar un asunto desde Inicio y volver a la tarjeta. Hay una fila de archivar con una vez, y
   filas de leer y de guardar con nombres de fichero como «asuntos.json».
4. Leer la tabla entera. No aparece el nombre de ninguna persona, de ningún asunto ni de ningún
   documento: solo nombres de cosas de la aplicación.
5. Mirar la línea de abajo de la tarjeta. Dice «Sin enviar todavía» y cuántos días hay guardados.
   No hay ningún aviso de error en la pantalla.
6. Recargar la página y volver a la tarjeta. Las veces de «Entrar» han subido a dos: lo de antes
   no se ha perdido.
7. Ir a Inicio, crear un asunto nuevo y guardarlo. Se crea igual que siempre, sin avisos nuevos.
