# 618 — El aviso de correos parados mira primero la carpeta

## Lo que escribió Francisco

Aviso de soporte (Francisco Javier Marmolejo González, 12-nov-2026 08:32, pantalla «Inicio», copia sin
internet, perfil Administración, versión 11-nov-2026 · 14:30):

> No están entrando los correos nuevos. He revisado el script y tengo el código actualizado. He vuelto
> a ejecutar prepararTodo y he implementado una nueva versión, pero siguen sin llegar.

Sin nota y sin adjuntos.

## Lo que entendió Claude (acordado con Francisco el 12-nov-2026)

- Causa, confirmada por Francisco: el script iba bien. El 11-nov-2026 Google Drive del ordenador
  «Propietario» pasó a `C:\Google Drive` y la app seguía mirando la `GESTOR-BANDEJA` de la ruta de antes.
  Señalando la carpeta nueva en Ajustes → Mantenimiento → «Bandeja de correos» volvieron a entrar.
- El fallo de la app: su aviso solo mandaba al script. No decía que la carpeta señalada puede ser otra.
- Qué verá quien use la app, una cosa por línea:
  - En el cuadro que se abre al pulsar el aviso de Inicio «La recogida de correos está parada…» (y el de
    «…no da señales…»), el **primer paso** es comprobar la carpeta de correos de este ordenador: dice que,
    si Google Drive ha cambiado de sitio en este ordenador, la app sigue mirando la carpeta de antes, y
    lleva el botón **«Cambiar la carpeta»**, que abre lo mismo que el de Ajustes → Mantenimiento →
    «Bandeja de correos».
  - Detrás van los pasos del script que ya había, sin cambiarlos.
  - Al señalar con ese botón una carpeta con señal reciente, el aviso se quita y los correos salen, sin
    tener que cerrar el cuadro y esperar.
  - Si la carpeta señalada **ya no existe**, en Inicio, en vez de «La bandeja de correos necesita
    permiso otra vez», sale en ámbar: «La carpeta de correos ya no está donde estaba. Señálala otra
    vez.», con el botón «Cambiar la carpeta».
  - Si lo que falta es solo el permiso, sigue saliendo lo de hoy («…necesita permiso otra vez» y «Dar
    permiso a la bandeja»).
- Esto no lo pidió y decidió que va aquí: dejar apuntado en el paso de «Pasar a Drive» (fila 460) que,
  al cambiar Drive de sitio, en cada ordenador hay que volver a señalar la carpeta de correos.

## Pantalla de prueba

- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea

- No se toca el script de Apps Script ni su versión.
- La app no intenta adivinar cuál de las dos cosas falla (el script o la carpeta): no puede saber la
  ruta de una carpeta. Ofrece las dos, la carpeta primero.
- No se cambia la ventana «Pasar a Drive» de la app; solo su documento.

## Notas técnicas de Claude

- Cuadro de pasos: `pasos()` y `abrirPasos()` en `js/bandeja-latido.js`. El botón llama a
  `Bandeja.elegirCarpeta` (ya existe, `js/bandeja-correos.js`); después, `BandejaLatido.mirar(true)`.
  Hoy `mirar` calla el aviso los 10 primeros minutos desde que se abrió la app: tras señalar con el
  botón no debe esperar.
- Carpeta que ya no existe: en `mirar()` de `js/bandeja-correos.js` el `catch` deja `correos = null`,
  igual que sin permiso. Distinguir el fallo de «no encontrada» (`NotFoundError`) y pintarlo aparte en
  `pintarCaja` de `js/bandeja-pantalla.js`. Con la carpeta desaparecida, `BandejaLatido` no debe añadir
  además su aviso de «no da señales».
- Textos con las palabras de `docs/VOCABULARIO.md`.
- `docs/PASAR-A-DRIVE.md`: añadir a los pasos de cada ordenador «señalar otra vez la carpeta de correos
  (Ajustes → Mantenimiento → «Bandeja de correos» → «Cambiar la carpeta») en `C:\Google Drive\GESTOR-BANDEJA`».
  La fila 460 de la cola ya lo lleva apuntado (lo puso Claude al pasar esta fila a PENDIENTE).
- Pruebas: ampliar `pruebas/bandeja-latido.mjs` (primer paso y botón; señalar quita el aviso) y una para
  la carpeta desaparecida. Línea en `js/novedades.js`. Poner al día `docs/contexto/CORREO-Y-SENECA.md`.

## Cómo lo comprueba el segundo revisor

- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar

- En la copia de pruebas, abre https://asuntos.fmargon.com/?demo=1&auto=1&latido=viejo, pulsa el aviso
  «La recogida de correos está parada…» y mira que el primer paso habla de la carpeta y lleva el botón
  «Cambiar la carpeta».
- El día que el Drive del ordenador de Diego pase a `C:\Google Drive`: mira que el aviso le lleva a
  señalar la carpeta de correos y que, al señalarla, entran.

## Revisión y respuestas durante el trabajo

- Revisión de la sesión (tarea pequeña, sin segundo revisor), 12-nov-2026, contra el texto, lo entendido y la prueba `pruebas/bandeja-latido.mjs`:
  - Primer paso del cuadro = comprobar la carpeta de correos de este ordenador, con lo de Google Drive y el botón «Cambiar la carpeta», antes de los pasos del script: coincide (prueba 8).
  - Los pasos del script siguen detrás: coincide; el texto de introducción y el primer paso del script se han reescrito un poco para encajar con el paso nuevo (se quita «Hay que despertar…» como frase de entrada).
  - El botón abre el mismo elegidor que Ajustes → Mantenimiento: coincide (prueba 8, con el elegidor sustituido); al señalar otra carpeta se mira la señal sin esperar los 10 minutos del arranque: coincide por código, **no lo he podido ver** con un elegidor de carpetas real (la copia de pruebas no tiene uno).
  - Carpeta que ya no existe: Inicio dice en ámbar «La carpeta de correos ya no está donde estaba. Señálala otra vez.» con «Cambiar la carpeta», sin «necesita permiso», y el latido no añade su aviso: coincide (prueba 9, con una carpeta que lanza `NotFoundError`). **No he podido ver** cómo responde Chrome de verdad con una carpeta borrada o movida.
  - Solo permiso: sigue igual que hoy (no tocado).
  - `docs/PASAR-A-DRIVE.md` apunta volver a señalar la carpeta de correos en cada ordenador: coincide. No se toca el script ni «Pasar a Drive»: coincide.
  - Lo que hace la app sin que el texto lo pida: nada.
- Nota de la sesión: `pruebas/plantilla-de-lo-escrito.mjs` fallaba ya en `main` (no es de esta fila): leía la vista previa del cuadro de Séneca antes de que se rellenara (se rellena con una promesa). Arreglada la prueba esperando a esa condición, sin tocar la app.
