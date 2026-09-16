# Instrucción: mandar los documentos de un asunto en un correo

Acordada con Francisco el 16 de septiembre de 2026. Fila 13 de `docs/COLA.md`.
Es el punto 7 de `docs/PROXIMOS-ASUNTOS.md`.

**Sube directamente a `main`. No abras ninguna pull request.**
**No leas el repositorio entero.** Baja solo los ficheros de la lista de abajo.
**Cambios quirúrgicos.** No reescribas ficheros enteros.
**Una sola pasada de pruebas al final**, no una comprobación después de cada cambio.

**Depende de la fila 11** (`docs/CORREOS-AL-ASUNTO.md`), que trae la huella del hilo
(`hilos` en `asuntos.json`). Si la fila 11 no estuviera hecha, esta instrucción se hace igual:
sin `hilos`, todos los borradores salen como correo nuevo y nada falla.

---

## 1. Qué pasa hoy, y qué falla

El botón "Correo" de la ficha de un asunto (`js/correo.js`) prepara tres piezas —a quién va, el
asunto y el cuerpo— y abre la ventana de redactar de Gmail con todo puesto.

Los documentos del asunto no puede ponerlos: **Gmail no deja que una página web le enganche
ficheros**. Ni la dirección de redactar (`view=cm`) ni `mailto:` admiten adjuntos. Hoy, para
mandar un papel del expediente, Francisco tiene que buscarlo a mano en el Dropbox y adjuntarlo
con el clip.

La salida es la carpeta que ya existe: `GESTOR-BANDEJA`, en el Drive de `g.educaand.es`. La
aplicación escribe allí el encargo con las copias de los documentos, y el script de Apps Script
—que sí puede adjuntar— monta un **borrador** en Gmail. Francisco lo abre, lo lee y lo envía.

Decidido con él: **siempre borrador, nunca envío automático.**

## 2. Qué hay que construir

### 2.1 El bloque de documentos, dentro del cuadro "Correo"

En el cuadro que abre el botón "Correo" (solo ahí: en el de Séneca **no**, porque Séneca no
admite esto), debajo del cuerpo, un bloque nuevo: **"Documentos de este asunto"**.

- La lista de los ficheros que hay en la carpeta del asunto, con una casilla en cada uno.
- **Desmarcados de partida.** Aquí lo normal es mandar uno, no todos.
- Cada línea: el nombre del fichero y su tamaño en la parte suave.
- Si la carpeta no tiene ningún documento, el bloque no se pinta.
- Si la suma de lo marcado pasa de **20 MB**, no se deja preparar el borrador: aviso en rojo
  diciendo el tamaño y que Gmail no admite tanto.

Debajo, un botón: **"Preparar borrador con los documentos"**. Solo se enciende con al menos una
casilla marcada.

Si la carpeta de la bandeja no está señalada en Ajustes, el bloque sale igual pero en vez del
botón se explica en una línea que hay que señalar `GESTOR-BANDEJA` en Ajustes para poder
mandar documentos.

Recuerda: solo hay un cuadro de diálogo (`U.preguntar`). No abras un segundo mientras el
primero espera.

### 2.2 El encargo que escribe la aplicación

Al pulsar, la aplicación escribe en la carpeta de la bandeja (`GESTOR-BANDEJA`):

1. Una copia de cada documento marcado, con el nombre `<id> - <nombre original>`.
2. **Al final**, el encargo `<id>.envio.json`:

```
{
  "id": "envio-260916-103245-4821",
  "creado": "2026-09-16T10:32:45",
  "para": "madre@correo.es, padre@correo.es",
  "asunto": "260916 SANCION 26-27 2ºESOB Pérez López, Ana 1234567",
  "cuerpo": "Estimados tutores legales de …",
  "adjuntos": ["envio-260916-103245-4821 - 260910 CERTIFICADO.pdf"],
  "hilo": "18f2c9…",
  "asuntoCarpeta": "260916 SANCION 26-27 2ºESOB Pérez López, Ana 1234567"
}
```

- `id`: `envio-` + fecha + hora + cuatro dígitos al azar. Nunca se repite.
- `para`, `asunto` y `cuerpo`: exactamente lo que hay en el cuadro al pulsar, con las casillas
  de destinatario que estén marcadas y el "Otro correo" si lo hay.
- `hilo`: el hilo del asunto, sacado de `hilos` en `asuntos.json` (fila 11). Si hay varios, el
  último apuntado. Si el asunto no tiene `hilos`, va cadena vacía.
- El `.envio.json` **se escribe el último**: para el script, un encargo existe cuando existe su
  `.json`. Así nunca coge uno a medio escribir. Es la misma regla que ya usa la bandeja al
  revés.
- El nombre acaba en `.envio.json` para que `js/bandeja-correos.js` **no** lo confunda con un
  correo recogido. Añade ese filtro en `mirar()`.

### 2.3 La espera, que se ve aunque se cierre el cuadro

El encargo vivo se apunta en `_GESTOR/envios.json`, junto a los demás ficheros compartidos:

```
[ { "id": "envio-…", "asunto": "<nombre de la carpeta del asunto>", "para": "…",
    "creado": "2026-09-16T10:32:45" } ]
```

En la pantalla de asuntos abiertos, encima de la bandeja de correos, una tarjeta por cada
encargo vivo: **"Borrador en camino — \<nombre del asunto\>"**. Así se ve aunque haya cerrado
el cuadro y esté en otra pantalla.

La aplicación mira la carpeta de la bandeja **cada 15 segundos** mientras haya algún encargo
vivo (y solo entonces; sin encargos, nada cambia):

- Si aparece `<id>.listo.json`: la tarjeta pasa a **"Abrir el borrador en Gmail"**, con el
  enlace que trae el fichero. Al pulsar, se abre en otra pestaña, el `.listo.json` se borra de
  la bandeja y el encargo sale de `envios.json`.
- Si aparece `<id>.error.json`: aviso en rojo con el motivo en una línea, botón "Entendido" que
  borra el fichero y quita el encargo.
- Si pasan **3 minutos** sin respuesta: la tarjeta lo dice en ámbar —el script de Gmail podría
  no estar en marcha— y ofrece "Dejarlo" (quita el encargo y borra sus ficheros de la bandeja).
  No se borra nada solo.

Antes de escribir `envios.json`, **reléelo**, y escribe con `Copias.guardar`, nunca con
`Carpetas.guardarJson`. Es un fichero compartido: el compañero puede tener el suyo en marcha.

### 2.4 El rastro en el asunto

Se reutiliza el rastro que ya escribe `js/correo.js` (`apuntarElRastro`), añadiéndole los
documentos:

> Correo a madre@correo.es — asunto: "…" · con 2 documentos: 260910 CERTIFICADO.pdf, …

Sigue siendo **una sola nota por cada vez que se abre el cuadro**, y en un asunto archivado no
se escribe ninguna. El botón de poner el asunto a la espera del tercero se queda como está.

### 2.5 El script de Apps Script

`apps-script/gestor-correos.gs`. **No se despliega desde el repositorio**: Francisco lo pega a
mano. La cabecera de tres líneas que ya lo advierte se mantiene y se actualiza.

Cambios:

1. `prepararTodo()` pone el disparador **cada minuto** en vez de cada cinco (borrando antes el
   que hubiera, como ya hace).
2. En cada pasada, **antes** de recoger correos, una función nueva `mandarBorradores()`:
   - Busca en `GESTOR-BANDEJA` los ficheros que acaben en `.envio.json`.
   - De cada uno lee el encargo y coge los blobs de sus `adjuntos` de la misma carpeta.
   - Si `hilo` trae algo y `GmailApp.getThreadById` lo encuentra: borrador de respuesta dentro
     de ese hilo (`createDraftReply`), con los adjuntos.
   - Si no: borrador nuevo (`GmailApp.createDraft`) con `para`, `asunto`, `cuerpo` y adjuntos.
   - Borra de la carpeta el `.envio.json` y sus adjuntos, y escribe `<id>.listo.json` con
     `{ id, hecho, enlace }`.
   - Si algo falla, escribe `<id>.error.json` con `{ id, motivo }` en una línea y borra también
     los ficheros del encargo. Un encargo roto no puede repetirse cada minuto para siempre.
3. El enlace es la lista de borradores, sin más:
   `https://mail.google.com/mail/u/?authuser=<correo>#drafts`. El borrador recién hecho sale el
   primero. **No inventes una dirección con el identificador del borrador**: es exactamente el
   error que ya dio `#all/<id de hilo>` y que costó dos sesiones arreglar.
4. Si la carpeta no tiene encargos, `mandarBorradores()` no hace nada y no se queja.

### 2.6 Lo que no se toca

- El cuadro de Séneca: allí no hay adjuntos.
- La recogida de correos, la pantalla de Duplicados y la papelera.
- No se manda nada solo: siempre borrador.

## 3. Ficheros que hay que tocar

| Fichero | Qué |
|---|---|
| `js/correo-adjuntos.js` | **Nuevo.** Bloque de documentos con casillas, tamaño, escritura del encargo y `envios.json` |
| `js/correo.js` | Enganche del bloque nuevo dentro del cuadro de correo, y los documentos en el texto de la nota |
| `js/bandeja-correos.js` | Exponer la carpeta de la bandeja para escribir en ella; no leer los `.envio.json` como si fueran correos; tarjeta "Borrador en camino" y vigilancia cada 15 segundos |
| `apps-script/gestor-correos.gs` | `mandarBorradores()`, disparador cada minuto, `.listo.json` y `.error.json` |
| `index.html` | Añadir `js/correo-adjuntos.js` **después** de `js/correo.js` y de `js/bandeja-correos.js` |
| `pruebas/envios.mjs` | **Nuevo.** Pruebas de la sección 4, con el Drive de mentira que ya usa `pruebas/correos.mjs` |
| `docs/CONTEXTO-CORTO.md` | Sustituir la línea del correo por la nueva realidad. Máximo 160 líneas |
| `docs/CONTEXTO.md` | El detalle: `envios.json`, `.envio.json`, `.listo.json`, `.error.json` |
| `docs/HISTORIA.md` | Anotar el cambio con su fecha |
| `docs/COLA.md` | Fila 13 a EN CURSO al empezar y a HECHA al terminar |

Comprueba que el nombre de cada función nueva de `App` no esté ya cogido. Si añades un panel a
la derecha, apúntalo en `PANELES_DE_LA_DERECHA` de `js/vista.js` (no debería hacer falta).

## 4. Pruebas

En `pruebas/envios.mjs`. Cada prueba debe fallar sin su cambio antes de darla por buena. Los
dobles de fichero deben traer su `getFile()`.

1. Marcar dos documentos y preparar deja en la bandeja las dos copias y el `.envio.json`, y el
   `.json` es el último que se escribe.
2. El encargo lleva el `hilo` del asunto cuando lo tiene, y cadena vacía cuando el asunto no
   tiene `hilos`.
3. Si lo marcado suma más de 20 MB no se prepara nada y sale el aviso.
4. Cuando aparece `<id>.listo.json`, la tarjeta pasa a "Abrir el borrador en Gmail" y el
   encargo sale de `envios.json`.
5. Con `<id>.error.json`, sale el motivo y el encargo desaparece; no se queda dando vueltas.
6. Un `.envio.json` en la carpeta **no** aparece como un correo en la bandeja.

Levanta `python3 -m http.server 8123` y ejecuta las pruebas con Playwright usando
`executablePath '/opt/pw-browsers/chromium'`. No ejecutes `npx playwright install`.
No dejes el repositorio con las pruebas en rojo.

## 5. Al terminar

- Versión `App.VERSION` con fecha y hora de España.
- Comprueba con `curl` que `https://gestor-de-asuntos.vercel.app` sirve los ficheros nuevos,
  usando `?v=<algo distinto>`. No des la publicación por hecha.
- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**.
- Fila 13 de `docs/COLA.md` a HECHA, con fecha y versión.
- Mensaje corto para Francisco, en español, sin jerga: qué has hecho, qué versión está
  publicada, si las pruebas están en verde, y **recuérdale que tiene que volver a pegar el
  script en Apps Script y ejecutar `prepararTodo()` una vez** para que el disparador pase a
  cada minuto; hasta entonces no aparecerá ningún borrador.
