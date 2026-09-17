# Leer los documentos que entran en "Por clasificar"

Acordado con Francisco el 17 de septiembre de 2026.

Hoy, un documento suelto en "Por clasificar" solo se puede abrir, borrar, convertir en asunto
nuevo o meter en uno existente. La aplicación no mira lo que pone dentro: el tipo, la fecha, el
registro y el tercero los escribe Francisco a mano, documento a documento. La mayoría son PDF
de Séneca, que traen todo eso escrito.

Esta instrucción hace que la aplicación lea el texto del documento y **proponga** lo que ha
encontrado. Propone; no decide sola.

La parte de dar de alta terceros que todavía no existen va en `docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md`,
la fila siguiente de la cola. Esta instrucción no la toca.

## Lo que se decidió, y no se vuelve a discutir

- **Lee el navegador, con pdf.js**, que ya está en `js/lib/`. Nada sale del centro.
- **No se usa ningún servicio de inteligencia artificial por internet.** Descartado.
- **No hay OCR.** Un PDF escaneado sin texto no se lee, y se queda exactamente como hoy.
- **El tipo se acierta con palabras clave escritas por Francisco**, más el propio nombre del tipo.
  Nada de aprendizaje automático: descartado por ahora.
- **La propuesta se ve en la lista**, no solo dentro del formulario.

## 1. Sacar el texto del documento

`js/registro-lector.js` ya sabe cargar pdf.js una sola vez y sacar el texto de varias páginas,
pero esa función (`textoHastaElSello`) es privada y para en cuanto encuentra el sello.

- Añadir a `RegistroLector` una función pública `textoDe(fichero, topePaginas)` que devuelva el
  texto de hasta `topePaginas` (por defecto 5), sin buscar nada.
- `textoHastaElSello` sigue como está: no se cambia el comportamiento del sello, que ya funciona.
- **No cargar pdf.js dos veces ni copiar la forma de sacar el texto.** Se reutiliza `cargarPdfJs`.
- Si el fichero no es PDF, o pdf.js falla, `textoDe` devuelve cadena vacía y no se avisa de nada.

## 2. Qué se busca en ese texto

Módulo nuevo `js/lector-documentos.js`, con una función `analizar(texto, contexto)` **pura**: sin
tocar el disco, ni la pantalla, ni pdf.js. Recibe el texto ya extraído y las listas con las que
cotejar. Devuelve un objeto con lo encontrado y, en cada dato, de dónde ha salido.

1. **Registro de Séneca.** Se llama a `RegistroLector.buscarEnTexto`, que ya está hecho y probado.
   De ahí salen serie, número, entrada/salida y la fecha del sello.
2. **Fecha del documento.** La del sello si la hay. Si no, la primera fecha del texto en
   `dd/mm/aaaa`, `dd-mm-aaaa` o "17 de septiembre de 2026". Si no aparece ninguna, se deja vacía;
   nunca se pone la fecha de hoy como si fuera la del documento.
3. **Documentos de identidad.** Todos los que aparezcan en el texto: DNI (8 cifras + letra), NIE
   (X/Y/Z + 7 cifras + letra), NIF de empresa (letra + 7 cifras + control) y Nº de identificación
   escolar. Se comprueba la letra del DNI y del NIE antes de darlos por buenos.
4. **Tercero.** Se cotejan esos documentos, y también los nombres, contra las listas que ya tiene
   la aplicación: alumnado de `RegAlum.csv`, personal y empresas. Un documento de identidad que
   cuadra vale más que un nombre que cuadra. Si cuadran dos terceros distintos, no se propone
   ninguno: se deja el hueco y Francisco elige.
5. **Tipo de asunto.** Se cuentan las coincidencias de las palabras clave de cada tipo, más su
   propio nombre. Gana el que más tenga. **Si empatan dos, no se propone tipo.** Las
   comparaciones se hacen sin tildes, sin mayúsculas y por palabras enteras, para que "baja" no
   dispare con "trabaja".

## 3. Palabras clave por tipo

Cada tipo de asunto gana una clave nueva `palabrasClave` (lista de textos) en `tipos.json`.

- Se edita en Ajustes, en la pantalla propia de cada tipo que crea `docs/AJUSTES-POR-TIPO.md`
  (fila 39 de la cola). **Esta instrucción va después de aquella**, y añade su casilla ahí, junto
  a los campos y las plantillas de ese tipo.
- Una sola casilla de texto, palabras separadas por comas, con ayuda debajo: "Palabras que
  aparecen en los documentos de este tipo. Sin tildes ni mayúsculas, da igual."
- Los tipos que ya existen se quedan con la lista vacía. Nadie tiene que rellenar nada para que
  esto funcione: el nombre del tipo ya se busca solo.
- El fichero `tipos.json` se sigue fusionando como hasta ahora; esta clave no cambia esa mecánica.

## 4. Qué se ve en "Por clasificar"

En cada tarjeta de documento suelto, debajo del nombre del fichero:

- Mientras se lee, una línea gris: "Leyendo el documento…". La lectura es de fondo: la pantalla
  se pinta enseguida y cada tarjeta se completa cuando le toca. **Nunca se bloquea la pantalla.**
- Cuando termina, una línea con lo encontrado, separado por puntos:
  `26EM0368 · 10-sep-2026 · SOLICITUD · García Pérez, Ana`. Lo que no se haya encontrado, no sale.
- Si hay **tipo y tercero**, un botón **"Aceptar"**: crea el asunto con esos datos y mete el
  documento dentro, de un solo clic, sin preguntar nada. Es exactamente lo que hoy hace "crear un
  asunto nuevo", pero con el formulario ya resuelto: se reutiliza ese mismo camino, no se escribe
  otro. Los campos propios del tipo se rellenan solos como ya hacen hoy (`js/campos.js`).
- Si falta el tipo o el tercero, **no hay botón "Aceptar"**: solo la línea con lo encontrado. Al
  entrar a mano, el formulario ya viene relleno con esos datos.
- El aviso de asunto duplicado que ya existe sigue funcionando igual desde el botón "Aceptar": si
  el asunto ya existe, se para y se avisa, como siempre.
- Si no se encuentra nada, o el PDF es una foto sin texto, la tarjeta se queda **exactamente como
  hoy**, sin línea, sin botón y sin mensaje de error.
- Un documento que no sea PDF (Word, imagen, hoja de cálculo) ni se intenta leer.

## 5. Cuándo se lee, y cuánto

- Solo al abrir la pantalla "Por clasificar". **Nunca al arrancar la aplicación.**
- Máximo 5 páginas por documento y los ficheros de uno en uno, no todos a la vez.
- Lo leído se guarda en memoria mientras dure la pantalla, con el nombre y la fecha del fichero
  como clave: volver a la lista no vuelve a leer nada.
- La bandeja de correos que vive encima no se toca en esta instrucción.

## 6. Ficheros que hay que tocar

- `js/registro-lector.js` — añadir `textoDe`.
- `js/lector-documentos.js` — **nuevo**. El análisis puro del punto 2.
- `js/documentos-sueltos.js` — la línea de propuesta y el botón "Aceptar" en cada tarjeta.
- `js/ajustes-tipo.js` (el que sale de la fila 39; si esa fila no estuviera hecha todavía,
  `js/ajustes.js`) — la casilla de palabras clave.
- `js/campos.js` y `js/asuntos-nuevo.js` — solo lo justo para reaprovechar la creación de asuntos.
- `index.html` — el `<script>` del módulo nuevo, en su sitio.
- `pruebas/` — pruebas del punto 2.
- `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/HISTORIA.md`, `docs/COLA.md` al terminar.

Si algún nombre de módulo no cuadra con lo que hay de verdad en el repositorio, manda el
repositorio: mira `docs/CONTEXTO.md` y usa el que sea, sin cambiar la arquitectura.

## 7. Cómo trabajar esta instrucción

- **Sube directamente a `main`, sin abrir ninguna pull request.** Si la sesión no lo permite (ver
  la nota del final de `docs/COLA.md`), abre el pull request y fúsalo tú mismo en cuanto esté en
  verde y sin conflictos.
- **Cambios quirúrgicos.** No reescribas ficheros enteros.
- **No leas el repositorio entero.** `docs/CONTEXTO-CORTO.md` siempre, y de `docs/CONTEXTO.md`
  solo los apartados de los módulos de la lista de arriba.
- Cualquier fichero de los que toques que pase de unas 400 líneas, pártelo.
- **Una sola tanda de pruebas al final** (`npm test`), no una comprobación después de cada cambio.
- Comprueba lo publicado con `curl`. No des la publicación por hecha.
- A Francisco no le preguntes nada. Al final, un mensaje corto: qué verá distinto en pantalla.

## 8. Pruebas

En `pruebas/`, sobre `analizar` y sin pdf.js ni navegador, con textos de mentira:

1. Un texto con sello de Séneca: salen registro, fecha y entrada/salida.
2. Un texto con un DNI de un alumno de la lista: sale ese alumno.
3. Un texto con dos alumnos distintos: no sale ninguno.
4. Un texto donde dos tipos empatan en palabras clave: no sale tipo.
5. Un DNI con la letra mal: no se da por bueno.
6. Un texto vacío: no sale nada y no se rompe.

## 9. Al terminar

- Marca la fila como **HECHA** en `docs/COLA.md`, con la fecha y la versión publicada.
- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, no
  añadiendo otra debajo. En "Qué falta", quita lo que esta instrucción haya resuelto.
- Anota en `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- `App.VERSION` con la hora de verdad (`TZ='Europe/Madrid' date`), nunca a ojo.
