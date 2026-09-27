# El HILO de correos, sin repetir y con lo último arriba (fila 210)

Acordado con Francisco el 27-sep-2026. Diseño cerrado.

**Si esta fila todavía no está en `docs/COLA.md`**, apúntala tú al final de la tabla, detrás de la
fila 206, en el mismo commit que la marca EN CURSO:
`| 210 | \`docs/HILO-SIN-REPETIR.md\` (el PDF del HILO de correos: lo último arriba, sin citas repetidas, y adjuntos sin repetir) | PENDIENTE (27-sep-2026) |`
(la conversación no pudo subir `docs/COLA.md`).

Valen las cláusulas comunes de `docs/REPARTO-DE-LA-COLA-2026-09-27.md` (a `main` sin pull request,
como mucho tres subidas, nada se sube con `npm test` en rojo). **No leas el repositorio entero**:
basta con los ficheros de la lista. Cambios quirúrgicos, no reescribir ficheros. Una sola pasada
completa de pruebas al final.

## El problema

El PDF `AAMMDD HILO <asunto>.pdf` (lo monta `hiloEnPdf` en `apps-script/gestor-correos.gs`) tiene
tres fallos:

1. **Repite los correos.** Copia cada mensaje con `getPlainBody()` entero, y eso incluye el trozo
   citado que Gmail u Outlook añaden al responder («El lun, 22 sept 2026, Ana <…> escribió: > …»).
   Resultado: nuestro primer correo sale una vez él solo y otra vez citado dentro de la respuesta,
   y cada mensaje nuevo arrastra todos los anteriores.
2. **Orden.** Va del más antiguo al más nuevo. Francisco quiere lo contrario.
3. **Adjuntos repetidos.** `guardarHilo` guarda los adjuntos de **todos** los mensajes del hilo
   cada vez que lo recoge. Cuando un hilo seguido crece (`seguirHilosConocidos`), vuelven a la
   bandeja los adjuntos de los mensajes antiguos, y al guardarlos en el asunto
   (`js/bandeja-guardar.js`, `nombreLibre`) entran otra vez, numerados «(2)».

## Lo que tiene que pasar

### 1. El HILO, del más nuevo al más antiguo

En `hiloEnPdf`, recorrer los mensajes al revés: arriba el último (recibido o enviado, da igual),
debajo los anteriores, hasta el primero. La cabecera de cada mensaje (De, Para, Fecha) no cambia.

### 2. En el HILO, de cada mensaje solo lo nuevo

Función nueva `soloLoNuevo(texto)` en el script: devuelve el cuerpo cortado justo antes de la
primera línea que empiece una cita. Se considera inicio de cita (sin distinguir mayúsculas; el
encabezado puede ocupar dos líneas, porque Gmail parte las largas):

- Gmail en español: una línea que acaba en `escribió:` (p. ej. `El lun, 22 sept 2026 a las 10:15,
  Ana Pérez (<ana@correo.es>) escribió:`).
- Gmail en inglés: una línea que acaba en `wrote:` y empieza por `On `.
- Outlook: `-----Mensaje original-----`, `-----Original Message-----`, o un bloque que empieza por
  `De:`/`From:` y en las 4 líneas siguientes trae `Enviado:`/`Sent:` o `Fecha:`/`Date:`.
- Un bloque final de líneas que empiezan por `>`.

**No se corta** un reenvío (`---------- Forwarded message ---------`, `---------- Mensaje
reenviado ---------`): lo reenviado es contenido nuevo para el hilo.

Se quitan las líneas en blanco del final. **Si al cortar queda vacío, se deja el mensaje
entero**: mejor repetido que perdido.

`hiloEnPdf` usa `soloLoNuevo(m.getPlainBody())`. El **primer** mensaje del hilo (el más antiguo)
también pasa por `soloLoNuevo`: puede ser un reenvío con cita dentro, y la regla de no cortar
reenvíos ya lo protege.

**No cambia** `mensajeEnPdf` (el `AAMMDD CORREO …pdf` de cada mensaje suelto): sigue entero, con
su cita. Tampoco cambia el campo `texto` de la ficha.

### 3. Adjuntos: solo los de los mensajes nuevos

`guardarHilo(hilo, carpeta, respuestaDe, desde)`: parámetro nuevo `desde`, el número de mensajes
ya vistos. Solo se guardan los adjuntos de los mensajes con índice `>= desde`.

- Desde `recogerCorreos` (etiqueta `GESTOR`): `desde = 0`, todos, como ahora.
- Desde `seguirHilosConocidos`: `desde = visto` (el `vistoLocal` que ya se calcula ahí).

La aplicación no cambia: lo que no llega a la bandeja no entra en el asunto.

### 4. Versión del script

Subir `VERSION_SCRIPT` a `'27-sep-2026 · fila 210'` y, en `js/correo-enviar.js`,
`SCRIPT_ESPERADO` al mismo valor. Así la aplicación avisa sola de que hay que volver a pegar el
script (el aviso ámbar que ya existe desde la fila 178). Añadir una entrada de cabecera al
principio del script, como las anteriores, con la fecha y la fila.

`apps-script/gestor-correos.gs` pasa de 400 líneas, pero **no se parte**: Francisco lo pega entero
en un solo fichero de script.google.com. Excepción consciente a la regla de tamaño.

## Ficheros

- `apps-script/gestor-correos.gs` — `hiloEnPdf`, `soloLoNuevo` (nueva), `guardarHilo`,
  `seguirHilosConocidos`, `recogerCorreos`, `VERSION_SCRIPT`, cabecera.
- `js/correo-enviar.js` — solo `SCRIPT_ESPERADO`.
- `pruebas/hilo-sin-repetir.mjs` — nueva, con `vm` y `GmailApp`/`Utilities`/`DriveApp` de mentira,
  mismo patrón que `pruebas/envio-apps-script.mjs`. Comprueba:
  1. `soloLoNuevo` corta en la cita de Gmail en español (encabezado en una y en dos líneas), en la
     de Gmail en inglés, en la de Outlook y en un bloque de `>`.
  2. No corta un reenvío.
  3. Si todo el mensaje es cita, devuelve el mensaje entero.
  4. El HTML del HILO lleva los mensajes del más nuevo al más antiguo, y el texto del primer
     correo aparece **una sola vez**.
  5. Un hilo seguido de 3 mensajes con `visto = 2` guarda solo los adjuntos del tercero; recogido
     por etiqueta, los de los tres.
- Si alguna prueba existente comprueba `VERSION_SCRIPT` o `SCRIPT_ESPERADO` con el valor viejo,
  ponerla al día.

## Documentación, al terminar

- `docs/contexto/CORREO-Y-SENECA.md`, en «Qué entra en la carpeta del asunto»: el HILO va del más
  nuevo al más antiguo y sin texto citado; los adjuntos de un hilo seguido, solo los nuevos.
- `docs/CONTEXTO-CORTO.md`, sección 8: la línea «Envío: pegar el script nuevo (filas 117, 130 y
  178)…» pasa a decir «(filas 117, 130, 178 y 210)». Sustituir, no añadir.
- `docs/HISTORIA.md`: una entrada con la fecha.

## Lo que Francisco verá

Nada hasta que vuelva a pegar el script en script.google.com. Después, en cada HILO nuevo: el
último correo arriba, cada mensaje sin la cita de los anteriores, y sin adjuntos repetidos en la
carpeta del asunto. Los HILO ya guardados no cambian.
