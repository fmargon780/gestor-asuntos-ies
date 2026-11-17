# 647 — La ventana de elegir archivo vuelve a abrirse en su carpeta

## Lo que escribió Francisco
Aviso de usuario (algo no funciona), enviado desde el botón de soporte el 13-nov-2026 a las 09:47,
pantalla «Ficha de un asunto», copia sin internet, perfil Administración, versión 13-nov-2026 · 08:59:

> En mi ordenador también me sale este error, pero al querer añadir un documento a la tarea

La captura dice:

> No he podido abrir ese fichero: Failed to execute 'showOpenFilePicker' on 'Window': Failed to read the 'startIn' property from 'FilePickerOptions': The provided value '[object FileSystemDirectoryHandle]' is not a valid enum value of type WellKnownDirectory.

Aviso completo: https://drive.google.com/file/d/13k5N1E4osyXs5ucfkDZeOboEOR8Vxlc1/view?usp=drivesdk

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- Es un fallo, no una idea nueva. Tarea pequeña.
- La causa: desde el paso a Drive (fila 458) la app envuelve cada carpeta para conservar las fechas
  originales de los ficheros. Al abrir la ventana de Windows para elegir un archivo, la app pedía
  empezar en la carpeta del asunto y le daba al navegador la carpeta envuelta. El navegador no la
  acepta y da ese error. El modo «En este ordenador, solo consultar» envuelve las carpetas con otro
  envoltorio y falla igual.
- En «Añadir documento» ya no pasa: las filas 678 y 686 abren la ventana sin pedir carpeta. Eso se
  queda como está.
- Quedan dos sitios que siguen dando al navegador la carpeta envuelta, y son los que se arreglan:
  - «Registrar» un documento (elegir la copia sellada): hoy sale el aviso naranja «No he podido
    abrir la carpeta del asunto; elige el archivo.» y la ventana se abre en otra carpeta.
  - «Traer datos» (los CSV de Séneca): hoy no hace nada y no avisa.
- Qué verá y hará quien use la app:
  - Al registrar un documento, la ventana de Windows se abre en la carpeta del asunto, sin aviso naranja.
  - Al pulsar «Traer datos», la ventana de Windows se abre.
  - Lo mismo con las carpetas en Drive y en «solo consultar».
  - Todo lo demás sigue igual.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- «Añadir documento» no cambia: sigue abriendo la ventana sin carpeta de inicio (fila 686).
- El aviso de «Traer datos» cuando el navegador rechaza la carpeta, y repetir sin ella: es la fila 690.
- No se quita el segundo intento sin carpeta de la fila 678: se queda como red por si el navegador
  rechaza la carpeta por otro motivo.
- No se toca cómo se envuelven las carpetas ni ningún otro sitio.

## Notas técnicas de Claude
- Leído en `main` el 17-nov-2026 (5497a77). `startIn` solo se usa en dos funciones:
  `elegirFichero` (`js/carpetas-ficheros.js`; con carpeta solo la llama `prepararEstado` de
  `js/registro.js`, con `asunto.handle`) y `elegirFicheros` (`js/traer-datos.js`, con `App.E.datos`).
- Las carpetas se envuelven en `js/nucleo.js` (líneas 255-258) y `js/pasar-a-drive.js` con
  `FechasOrigen.envolver` (un `Proxy`), y en «solo consultar» con el de `js/solo-consulta.js`. Los dos
  tienen `crudo(h)`, que devuelve la carpeta de verdad. Modelo: `crudo()` de `js/carpetas-en-drive.js`.
- 1. En `js/carpetas-ficheros.js`, una función pequeña que quite los dos envoltorios (repetir
  `FechasOrigen.crudo` y `SoloConsulta.crudo` hasta que no cambie, mirando que existan) y usarla al
  poner `opciones.startIn` en `elegirFichero`. Exponerla en `CarpetasNucleo` y en `Carpetas`
  (mirar antes que el nombre esté libre).
- 2. En `js/traer-datos.js`, `elegirFicheros`: poner `opciones.startIn` con esa misma función.
- 3. Solo esos dos ficheros de código (más `js/carpetas.js` si hace falta para exponer la función).
  Cambios quirúrgicos; ninguno pasa del tope de líneas.
- 4. Prueba nueva `pruebas/ventana-en-su-carpeta.mjs`: con una lista de fechas puesta
  (`FechasOrigen.fijar`) y una carpeta envuelta, un `showOpenFilePicker` falso que rechaza con
  `TypeError` si `startIn` no es la carpeta de verdad (comparar con `===`): (a) `Carpetas.elegirFichero(envuelta)`
  lo llama una sola vez, con la carpeta de verdad y sin aviso; (b) lo mismo con el envoltorio de
  «solo consultar»; (c) «Traer datos» lo llama con la carpeta de verdad. Las pruebas
  `abrir-ventana-de-subir` y `soltar-documento` siguen en verde.
- 5. Cambia algo visible: línea en `js/novedades.js` (fila 248): «Al registrar un documento y en
  «Traer datos», la ventana de Windows vuelve a abrirse en su carpeta.»
- 6. Una sola tanda de pruebas al final: `npm test -- ventana abrir-ventana soltar-documento registro datos-que-tengo`.
  Publicar una sola vez.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En el instituto, con las carpetas en Drive: en un asunto, «Registrar» un documento. La ventana de
  Windows se abre en la carpeta del asunto y no sale el aviso naranja.
- En el instituto: Ajustes → «Traer datos». Se abre la ventana de Windows.
- No se puede ver en la demostración: allí las carpetas no van envueltas y la ventana es simulada.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
