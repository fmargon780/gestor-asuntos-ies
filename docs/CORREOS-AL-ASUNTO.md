# Instrucción: enlazar correos a un asunto ya creado, y seguir el hilo

Acordada con Francisco el 16 de septiembre de 2026. Fila 11 de `docs/COLA.md`.

**Sube directamente a `main`. No abras ninguna pull request.**
**No leas el repositorio entero.** Baja solo los ficheros de la lista de abajo.
**Cambios quirúrgicos.** No reescribas ficheros enteros.
**Una sola pasada de pruebas al final**, no una comprobación después de cada cambio.

---

## 1. Qué pasa hoy, y qué falla

La bandeja (`js/bandeja-correos.js`) pinta una tarjeta morada por cada correo recogido en
`GESTOR-BANDEJA`. Para cada uno intenta adivinar el asunto de destino comparando el asunto del
correo (sin `Re:` / `RV:` / `Fwd:`) con el nombre de los asuntos de `asuntos.json`, exigiendo
al menos 12 letras de coincidencia por los dos lados.

Tres fallos:

1. Si no acierta, la única salida es **crear un asunto nuevo**. No hay forma de elegir a mano
   un asunto cualquiera de la lista.
2. Cuando el correo se guarda, **no queda ningún identificador del hilo**. Solo una nota con la
   URL ya montada. El correo siguiente del mismo hilo vuelve a empezar de cero.
3. El recolector de Apps Script quita la etiqueta `GESTOR` al procesar el hilo. Las respuestas
   posteriores —recibidas o enviadas por Francisco— ya no las recoge nadie.

## 2. Qué hay que construir

### 2.1 Botón "Elegir asunto" en la tarjeta morada

Cada tarjeta de la bandeja lleva un botón nuevo, **"Elegir asunto"**, junto a los que ya tiene.

Abre un cuadro con:

- Arriba, **"Podrían encajar"**: como mucho cinco asuntos, ordenados por puntuación de parecido
  (sección 2.2). Si ninguno pasa el mínimo, este bloque no se pinta.
- Debajo, **"Todos los asuntos"**: la lista completa con buscador por texto, abiertos primero y
  archivados después, con la etiqueta "Archivado" bien visible.

Al elegir uno:

- Si está abierto: se guarda ahí, reutilizando exactamente el camino que ya existe hoy para
  "Guardar en ese asunto" (PDF del hilo, adjuntos, nota `Notas.anadir` con `correo`, `enlace` y
  `enlaceTexto`, antiduplicado con `Notas.yaTieneCorreo`, borrado del `.json` y sus ficheros de
  la bandeja). **No se toca el estado del asunto.**
- Si está archivado: se ofrece **"Reabrir y guardar aquí"** (con `App.reabrirAsunto`) y
  **"Guardar sin reabrir"**, igual que hoy.

Recuerda: solo hay un cuadro de diálogo (`U.preguntar`). No abras un segundo mientras el
primero espera.

### 2.2 Cómo se mide el parecido

Puntuación sobre los asuntos de `asuntos.json`, sumando:

- **+50** si el correo del remitente (`de.correo`) o alguna dirección de `correos` coincide con
  el correo guardado del tercero del asunto o de alguno de sus terceros relacionados.
- **+40** si el nombre del tercero del asunto (apellidos y nombre, en cualquier orden) aparece
  en el asunto del correo o en su texto.
- **+10 por cada palabra** de cuatro letras o más del asunto del correo (ya limpio de
  `Re:`/`RV:`/`Fwd:`) que aparezca en el nombre del asunto. Ignora palabras vacías
  (`para`, `sobre`, `desde`, `con`, `los`, `las`, `del`, …).
- **+15** si el asunto está abierto.
- **+10** si el asunto se creó o se movió en los últimos 30 días.

Se muestran los que pasen de **40 puntos**, como mucho cinco, de mayor a menor.

La adivinación automática que ya existe (12 letras por los dos lados) **se mantiene tal cual**:
si acierta, la tarjeta sigue diciendo "Respuesta de \<nombre del asunto\>" y su botón principal
sigue siendo "Guardar en ese asunto", sin abrir nada.

### 2.3 La huella del hilo

Al guardar un correo en un asunto —por el camino que sea— se apunta la huella en la ficha del
asunto, dentro de `_GESTOR/asuntos.json`:

```
hilos: [
  { id: "<id del hilo de Gmail>", asunto: "<asunto del correo, limpio>", visto: 2 }
]
```

- `id`: el campo `id` del `.json` de la bandeja (es el identificador del hilo, no el Message-ID).
- `asunto`: el asunto del correo sin `Re:` / `RV:` / `Fwd:`, recortado y en minúsculas.
- `visto`: el campo `mensajes` del `.json` en el momento de guardar.

Reglas:

- Si el `id` ya está en `hilos`, se actualiza `visto`, no se añade una entrada nueva.
- Un asunto puede tener varios hilos. Un hilo pertenece a un solo asunto.
- `hilos` es opcional: los asuntos viejos no lo tienen y todo debe seguir funcionando sin él.
- Antes de escribir `asuntos.json`, **reléelo**, y escribe con `Copias.guardar`, nunca con
  `Carpetas.guardarJson`.

### 2.4 Correos siguientes del mismo hilo

Cuando llega a la bandeja un `.json` cuyo `id` ya está en el `hilos` de algún asunto:

- La tarjeta se pinta como **"Respuesta de \<nombre del asunto\>"**, con el botón principal
  **"Guardar en ese asunto"**. Esto va **antes** que la adivinación por texto: la huella manda.
- **Nunca se guarda solo.** Siempre hay que pulsar.
- Si el `.json` trae `enviado: true`, la tarjeta lo dice con una línea: "Lo enviaste tú".
- "Elegir asunto" y "Descartar" siguen disponibles, por si la huella se equivocó. Si Francisco
  elige otro asunto, el `id` del hilo se quita del asunto viejo y se apunta en el nuevo.

### 2.5 Qué se guarda en la carpeta del asunto

- Cada mensaje nuevo entra como su propio documento: `AAMMDD CORREO <asunto recortado>.pdf`,
  con la fecha del mensaje.
- El PDF del hilo completo (`AAMMDD HILO …`) **se sustituye** por el actualizado: no se
  acumulan copias del hilo entero. Si existe uno anterior en la carpeta, va a la papelera con
  el camino normal, no se borra a pelo.
- Los adjuntos nuevos entran como `AAMMDD ADJUNTO <nombre>`, como hoy.

### 2.6 El recolector de Apps Script

`apps-script/gestor-correos.gs`. **No se despliega desde el repositorio**: Francisco lo pega a
mano en su cuenta. Deja el fichero listo y con un comentario de cabecera de tres líneas que
diga qué hay que hacer para actualizarlo.

Además, arrastra el arreglo pendiente del enlace (`enlaceAlHilo` con
`#search/rfc822msgid:<Message-ID sin < >>`), que sigue sin pegarse desde el 9-sep-2026.

Cambios:

1. La app escribe en `GESTOR-BANDEJA` un fichero **`seguidos.json`**: una lista de los `id` de
   hilo que aparecen en el `hilos` de cualquier asunto, con su `visto`. Se reescribe entero
   cada vez que se guarda un correo en un asunto o se cambia de asunto.
2. En cada pasada (`recogerCorreos`, cada 5 minutos), el script:
   - Hace lo de siempre con los hilos etiquetados `GESTOR`.
   - Lee `seguidos.json`. Para cada `id`, abre el hilo con `GmailApp.getThreadById` y compara
     su número de mensajes con `visto`.
   - Si hay mensajes nuevos, escribe en `GESTOR-BANDEJA` un `.json` con la forma de siempre,
     más dos campos: `respuestaDe: "<id del hilo>"` y `enviado: true` si el último mensaje lo
     mandó el propio usuario. El PDF que deja es el del hilo entero, actualizado.
   - Si `getThreadById` devuelve nulo (hilo borrado), se salta ese `id` sin fallar.
3. El `.json` se sigue escribiendo **el último**, después del PDF y de los adjuntos. Para el
   Gestor un correo existe cuando existe su `.json`.
4. Si `seguidos.json` no existe o está roto, el script sigue con su trabajo normal sin quejarse.

### 2.7 Lo que no se toca

- `enlaceAGmail` de `js/bandeja-correos.js` conserva el rescate de los enlaces viejos con
  `#all/`: si el enlace guardado es de esos, lo tira y monta uno nuevo buscando por asunto y
  remitente.
- No se mete Gmail en un marco. No se usa `#all/<id de hilo>`.
- La pantalla de Duplicados y la papelera no se tocan.

## 3. Ficheros que hay que tocar

| Fichero | Qué |
|---|---|
| `js/bandeja-correos.js` | Partirlo (ver abajo). Huella del hilo, `respuestaDe`, `enviado`, escritura de `seguidos.json` |
| `js/bandeja-enlace.js` | **Nuevo.** Botón "Elegir asunto", cuadro con "Podrían encajar" y lista completa, puntuación de parecido |
| `apps-script/gestor-correos.gs` | Hilos seguidos, `seguidos.json`, `respuestaDe`, `enviado`, y el arreglo pendiente de `enlaceAlHilo` |
| `index.html` | Añadir `js/bandeja-enlace.js` **después** de `js/lector.js` y de `js/bandeja-correos.js` |
| `pruebas/correos.mjs` | Pruebas nuevas (sección 4) |
| `docs/CONTEXTO-CORTO.md` | Sustituir la línea de la bandeja por la nueva realidad. Máximo 160 líneas |
| `docs/CONTEXTO.md` | El detalle: `hilos` en `asuntos.json`, `seguidos.json`, campos nuevos del `.json` |
| `docs/HISTORIA.md` | Anotar el cambio con su fecha |
| `docs/COLA.md` | Fila 11 a EN CURSO al empezar y a HECHA al terminar |
| `claude/Correos-a-asuntos.md` | Está en el proyecto de Claude, **no en el repositorio**: no lo toques, pero no lo contradigas |

`js/bandeja-correos.js` pasa de 400 líneas y hay que tocarlo, así que **pártelo en dos**:

- `js/bandeja-correos.js`: leer la carpeta de Drive, pintar las tarjetas, adivinar por texto y
  por huella, guardar en un asunto, descartar, `enlaceAGmail`.
- `js/bandeja-enlace.js`: todo lo de elegir asunto a mano y la puntuación de parecido.

Comprueba que el nombre de cada función nueva de `App` no esté ya cogido. Si añades un panel a
la derecha, apúntalo en `PANELES_DE_LA_DERECHA` de `js/vista.js` (no debería hacer falta: el
cuadro de elegir asunto es un diálogo, no un panel).

## 4. Pruebas

En `pruebas/correos.mjs`, con el Drive de mentira que ya usa. Cada prueba debe fallar sin su
cambio antes de darla por buena. Los dobles de fichero deben traer su `getFile()`.

1. Un correo cuyo hilo está en el `hilos` de un asunto se pinta como "Respuesta de …", aunque
   su asunto de texto no se parezca en nada al nombre del asunto.
2. Guardar un correo en un asunto elegido a mano deja la huella en `hilos` y la entrada en
   `seguidos.json`.
3. Guardar dos veces el mismo hilo no duplica la entrada en `hilos`: actualiza `visto`.
4. La puntuación de parecido pone primero el asunto cuyo tercero tiene el correo del remitente.
5. Un asunto sin `hilos` (de los viejos) sigue funcionando igual que antes.
6. Nada se guarda sin pulsar: pintar la bandeja no escribe en `asuntos.json`.

Levanta `python3 -m http.server 8123` y ejecuta las pruebas con Playwright usando
`executablePath '/opt/pw-browsers/chromium'`. No ejecutes `npx playwright install`.
No dejes el repositorio con las pruebas en rojo.

## 5. Al terminar

- Versión `App.VERSION` con fecha y hora de España.
- Comprueba con `curl` que `https://gestor-de-asuntos.vercel.app` sirve los ficheros nuevos,
  usando `?v=<algo distinto>`. No des la publicación por hecha.
- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**.
- Fila 11 de `docs/COLA.md` a HECHA, con fecha y versión.
- Mensaje corto para Francisco, en español, sin jerga: qué has hecho, qué versión está
  publicada, si las pruebas están en verde, y **recuérdale que tiene que pegar el recolector
  nuevo en Apps Script**, diciéndole que el fichero es `apps-script/gestor-correos.gs` y que
  hasta entonces las respuestas de los hilos no aparecerán solas.
