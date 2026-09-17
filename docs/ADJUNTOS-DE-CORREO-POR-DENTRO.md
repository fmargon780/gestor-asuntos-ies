# Leer por dentro los documentos adjuntos de un correo

Acordado con Francisco el 18 de septiembre de 2026.

Hoy la bandeja de correos (dentro de "Por clasificar", barra "Correos sin clasificar") propone
tercero y tipo mirando **solo el correo**: las direcciones del hilo y el texto del asunto y del
cuerpo. Los documentos adjuntos se guardan tal cual y entran en la carpeta del asunto al crearlo:
nadie los abre.

El problema es que el correo suele ser dos líneas ("le adjunto la solicitud") y el dato bueno —el
DNI, el registro de Séneca, la fecha del documento, la palabra que identifica el tipo— está dentro
del PDF adjunto.

Esta instrucción hace que la bandeja lea también esos adjuntos y **complete** la propuesta.
Completa; no decide sola, y no pisa lo que el correo ya dijo.

Es la hermana de `docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md` (fila 41), que hizo lo mismo para los
documentos sueltos. **Se reutiliza todo aquello**: no se escribe otro lector.

## Lo que se decidió, y no se vuelve a discutir

- **Manda el correo.** Lo que salga del PDF solo rellena los huecos que el correo deja vacíos.
- Se lee en el navegador con pdf.js, que ya está en `js/lib/`. Nada sale del centro.
- **Ningún servicio de inteligencia artificial por internet.** Descartado.
- **No hay OCR.** Un PDF escaneado sin texto no se lee, y todo se queda exactamente como hoy.
- Sigue sin crearse nada solo: la propuesta se ve, y Francisco la acepta.
- El alta de terceros nuevos desde el documento (`docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md`,
  fila 42) **no entra aquí**. Esta instrucción no pinta el botón "Dar de alta" en la bandeja.

## 1. Qué se lee

De cada correo de la bandeja, sus ficheros adjuntos: el campo `adjuntos` de su `.json`, que trae
los nombres tal como están guardados en la carpeta `GESTOR-BANDEJA`.

- Solo los que sean PDF. Word, imágenes y hojas de cálculo ni se intentan.
- **Como mucho los 3 primeros adjuntos** de cada correo, y 5 páginas de cada uno.
- **No se lee `pdf` ni `pdfMensaje`** (el PDF del hilo de correo que fabrica el script): ahí no hay
  nada que el texto del correo no tenga ya.
- Cada fichero se lee con `carpeta.getFileHandle(nombre)` + `.getFile()`, igual que hace
  `leerElCorreo` en `js/bandeja-correos.js`, y el texto se saca con `RegistroLector.textoDe(fichero, 5)`.
- El análisis es `LectorDocumentos.analizar(texto, contexto)`, el mismo de la fila 41, con el mismo
  contexto (tipos, alumnado, personal, empresas). **No se copia ni se duplica esa función.**
- Si hay varios adjuntos, se juntan los análisis: gana el primer adjunto que traiga cada dato.

## 2. Cómo se mezcla con lo que el correo ya sabía

`Bandeja.proponer(datos)` (en `js/bandeja-correos.js`) devuelve hoy `{ tercero, categoria, tipo }`.
Esta instrucción **no cambia esa función**: la mezcla se hace fuera, con lo que ella devuelva.

| Dato | Quién manda |
|---|---|
| Tercero | El del correo. Si el correo no encuentra ninguno, vale el del PDF |
| Categoría | La del tercero que acabe mandando |
| Tipo | El del correo. Si el correo no lo adivina, vale el del PDF |
| Fecha de inicio del asunto | **Siempre la del correo.** El PDF no la toca |
| Registro de Séneca | Solo del PDF |
| Fecha del documento | Solo del PDF |

Si el PDF encuentra un tercero **distinto** del que encontró el correo, manda el del correo y no se
avisa de nada: el remitente sabe más de quién escribe que el papel que manda.

## 3. Qué se ve en la tarjeta del correo

En la tarjeta de cada correo de la bandeja (`tarjeta(item)`, en `js/bandeja-pantalla.js`), debajo
de la línea de propuesta que ya existe (`.propuesta-correo`), otra línea del mismo estilo
(`tarjeta-pie`), dentro de `.tarjeta-texto`:

- Mientras se lee: "Leyendo los documentos…", en gris.
- Al terminar, lo que haya salido del PDF y no estuviera ya en la línea de arriba, separado por
  puntos: `Del documento: 26EM0368 · 10-sep-2026 · SOLICITUD · García Pérez, Ana`.
- Si el PDF no aporta nada nuevo, **la línea se quita entera** y la tarjeta queda como hoy.
- Si el correo no traía adjuntos PDF, la línea no llega a salir.
- Los botones de la tarjeta no cambian de sitio ni de nombre. El único efecto de lo leído es que
  la propuesta llegue más completa a la pantalla de asunto nuevo (`llevarANuevo`).

## 4. Cuándo se lee, y cuánto

- Solo al desplegar la barra "Correos sin clasificar". **Con la barra plegada no se lee nada**, y
  nunca al arrancar la aplicación.
- De uno en uno, con una cola, igual que `js/documentos-sueltos-lector.js`. **Nunca en paralelo y
  nunca bloqueando la pantalla.**
- Lo leído se guarda en memoria con el identificador del correo como clave, mientras dure la
  pantalla: volver a la lista no vuelve a leer nada.
- Si un fichero falla, se sigue con el siguiente y no se avisa de nada: mejor esfuerzo.

## 5. Ficheros que hay que tocar

- `js/bandeja-adjuntos-lector.js` — **nuevo**. La cola, la lectura, la mezcla del punto 2 y la
  línea del punto 3. Es el hermano de `js/documentos-sueltos-lector.js`; se parece todo lo posible
  a él, y **reutiliza su forma de montar el contexto** en vez de escribirla otra vez (si para eso
  hay que sacar esa función a un sitio común, se saca, sin cambiar lo que hoy funciona).
- `js/bandeja-pantalla.js` — el gancho mínimo dentro de `tarjeta(item)`: una llamada al módulo
  nuevo, nada más. `tarjeta` no está exportada, así que aquí no vale la envoltura de siempre.
- `js/bandeja-correos.js` — solo si hace falta exponer algo en `window.Bandeja`. No se cambia
  `proponer`, ni `llevarANuevo`, ni la recogida de correos.
- `index.html` — el `<script>` del módulo nuevo, en su sitio (después de `js/registro-lector.js`,
  `js/lector-documentos.js` y `js/bandeja-pantalla.js`).
- `pruebas/` — ver el punto 6.
- `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/HISTORIA.md`, `docs/COLA.md` al terminar.

**No se toca** `apps-script/gestor-correos.gs`: el script ya guarda los adjuntos en la carpeta, que
es todo lo que hace falta. Francisco no tiene que volver a pegar nada por esta fila.

## 6. Pruebas

En `pruebas/`, sobre la bandeja con jsdom (el camino de `pruebas/correos.mjs`), con PDF de mentira
—doblando `RegistroLector.textoDe` para que devuelva un texto escrito a mano, sin pdf.js—:

1. Correo sin tercero reconocible y adjunto con el DNI de un alumno de la lista: la propuesta acaba
   con ese alumno.
2. Correo que ya reconoce al alumno y adjunto con el DNI de **otro**: manda el del correo.
3. Correo sin tipo y adjunto con las palabras clave de un tipo: sale ese tipo.
4. Correo con tipo y adjunto que apunta a otro tipo: manda el del correo.
5. Correo sin adjuntos: no sale la línea nueva y todo queda como antes.
6. Adjunto que no es PDF: ni se intenta leer.
7. Adjunto ilegible (la lectura lanza un error): la tarjeta queda como hoy y nada se rompe.

Y comprobar que la batería que ya existe (`pruebas/correos.mjs`, `pruebas/correo-dos-buzones.mjs`,
`pruebas/envios.mjs`, `pruebas/documentos-sueltos.mjs`) sigue en verde sin tocarla más de lo justo.

**Aviso:** el doble de un fichero de la carpeta de la bandeja tiene que traer su `getFile()`. Sin
él, la lectura no arranca y no se queja de nada (pasó ya con el panel de lectura, 10-sep-2026).

## 7. Cómo trabajar esta instrucción

- **Sube directamente a `main`, sin abrir ninguna pull request.** Si la sesión no lo permite (ver
  la nota del final de `docs/COLA.md`), abre el pull request y fúsalo tú mismo en cuanto esté en
  verde y sin conflictos.
- **Cambios quirúrgicos.** No reescribas ficheros enteros.
- **No leas el repositorio entero.** `docs/CONTEXTO-CORTO.md` siempre, y de `docs/CONTEXTO.md` solo
  los apartados de los módulos de la lista de arriba.
- Cualquier fichero de los que toques que pase de unas 400 líneas, pártelo.
- **Una sola tanda de pruebas al final** (`npm test`), no una comprobación después de cada cambio.
- Como mucho dos subidas por esta fila (regla 13 de la cola).
- Comprueba lo publicado con `curl`. No des la publicación por hecha.
- A Francisco no le preguntes nada. Al final, un mensaje corto: qué verá distinto en pantalla.

## 8. Al terminar

- Marca la fila como **HECHA** en `docs/COLA.md`, con la fecha y la versión publicada.
- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, no
  añadiendo otra debajo.
- Anota en `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- `App.VERSION` con la hora de verdad (`TZ='Europe/Madrid' date`), nunca a ojo.
