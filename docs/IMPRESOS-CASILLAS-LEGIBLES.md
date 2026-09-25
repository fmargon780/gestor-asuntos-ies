# Fila 146 · Las casillas de un impreso, con nombres que se entienden

Acordado con Francisco el 25-sep-2026. Cambios quirúrgicos, sin leer el repositorio entero, y una
sola pasada de pruebas al final.

Lee antes `docs/CONTEXTO.md`, `docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md` (fila 84, que montó
esta pantalla) y `docs/contexto/DOCUMENTOS-PDF.md`. El código está en `js/formularios-rellenar.js`
(bloque «AJUSTES → EL CENTRO → "IMPRESOS OFICIALES"»).

---

## Por qué

En Ajustes → El centro → «Impresos oficiales», al abrir un impreso (por ejemplo, «Anexo III ·
Solicitud de admisión») salen decenas de filas con el nombre interno de cada casilla del PDF:
`form1[0].#pageSet[0].Página_2[0].CABECERA[0].datos[0].apellido1encab[0]`. Francisco no puede
saber qué es cada una ni dónde está en el papel. Además, casi todas son datos de la persona, que
por la regla de la fila 84 **nunca** se rellenan: sobran en esa lista.

## La regla de la fila 84 sigue igual

Solo se rellenan los siete huecos del centro (`{{CENTRO}}`, `{{CODIGO CENTRO}}`,
`{{DIRECCION CENTRO}}`, `{{LOCALIDAD}}`, `{{PROVINCIA}}`, `{{CURSO}}`, `{{HOY}}`). Esta fila solo
cambia cómo se ve y se configura la lista. `_GESTOR/formularios-campos.json` no cambia de forma:
sigue guardando el nombre interno completo de cada casilla.

---

## 1 · Un nombre que se entiende

Función sin efectos nueva, `Formularios.nombreLegible(nombreInterno)` → `{ pagina, texto }`:

- Página: el número de `Página_N` (o `Page N`, `page_N`, `pagina N`) que aparezca en el nombre; si
  no hay, `null`. Si hay varios índices del mismo número de página (`Página_2[0]`, `Página_2[1]`),
  es la misma página repetida: se toma el número tal cual.
- Texto: el **último tramo** del nombre, sin los `[n]`, partiendo por `_`, guiones, puntos y
  cambios de minúscula a mayúscula; separando letras de números (`apellido1` → `apellido 1`); sin
  sufijos de maquetación (`encab`, `enca`, `enc`, `cab`, `txt`, `campo`, `field`, `datos`); con una
  tabla corta de palabras conocidas: `apellido 1` → «Primer apellido», `apellido 2` → «Segundo
  apellido», `nombre` → «Nombre», `dni`/`nif`/`nie` → en mayúsculas, `cp` → «Código postal»,
  `tfno`/`telf` → «Teléfono», `num`/`numero` → «Número»… y el resto con la primera letra en
  mayúscula.
- En pantalla: «Página 2 · Primer apellido». El nombre interno completo queda en el `title` de la
  fila (se ve al pasar el ratón), por si hace falta.

**Casillas repetidas**: si varias casillas dan el mismo texto legible (el Anexo III repite la
cabecera «Primer apellido» en cada página), van en **una sola fila**, «Primer apellido (en 3
páginas)», con un solo desplegable que guarda el mismo hueco para todas ellas.

## 2 · Ver dónde está en el papel

Al lado de cada fila, una miniatura de su página (pdf.js, que ya está en la aplicación) con la
casilla marcada con un recuadro de color. Posición de la casilla: el rectángulo de su primer widget
en pdf-lib (`campo.acroField.getWidgets()[0].getRectangle()`) y su página (la del widget; si no
se puede saber, la de su nombre). Pulsar la miniatura la abre en grande, dentro de la misma
pantalla (nunca un segundo cuadro; `U.preguntar` va de uno en uno). Si no se puede situar la
casilla, sin miniatura, y la fila sigue igual.

La miniatura se pinta al desplegar la fila o al pasar por encima, no todas de golpe al abrir el
impreso: un PDF de la Junta puede tener muchas páginas.

## 3 · Tres grupos, y solo uno a la vista

Función sin efectos nueva, `Formularios.clasificarCasilla(nombreInterno)` → `'centro'`,
`'persona'` u `'otra'`:

- **centro**: la que `proponerMapa` sabe asignar, o la que ya tiene hueco guardado.
- **persona**: su texto contiene (sin mayúsculas ni tildes) apellido, nombre, dni, nif, nie,
  pasaporte, domicilio o direccion (sin `centro`), telefono, movil, correo, email, firma,
  nacimiento, sexo, nacionalidad, tutor, padre, madre, progenitor, alumno, solicitante,
  representante, hermano, cp, codigo postal. **Va antes que la regla de centro**: `fecha de
  nacimiento` es de persona, no `{{HOY}}` (hoy `proponerMapa` la propondría como `{{HOY}}`:
  arréglalo haciendo que `proponerMapa` no proponga nada para una casilla de persona).
- **otra**: el resto (`Barras`, `Numero_inscripcion`…).

En la pantalla del impreso:

- Arriba, abiertas, las **del centro**.
- Debajo, plegado: «Otras casillas (N)».
- Debajo, plegado: «Datos de la persona (N) — no se rellenan nunca». Dentro, las filas se ven
  igual, con su desplegable, por si alguna estuviera mal clasificada.
- Si no hay ninguna del centro: una línea en gris, «Este impreso no tiene casillas del centro:
  saldrá en blanco». No es un fallo.

## 4 · La propuesta se guarda sola

Hoy la propuesta automática solo se enseña en el desplegable, y el impreso sigue diciendo «Sin
configurar» hasta que alguien toca algo. Cambio: al leer las casillas de un impreso **que no tiene
nada guardado**, la propuesta se guarda en `formularios-campos.json` (una sola escritura, por
`ColaGuardado` como todo `_GESTOR`) y se avisa en verde: «He puesto N casillas del centro. Revísalas
si quieres». Si ya había algo guardado, no se toca.

El resumen del impreso (título plegado) dice lo que hay:

- «N casillas del centro puestas»
- «Sin casillas del centro» (leído, sin ninguna)
- «Sin leer todavía» (nunca se ha pulsado «Leer las casillas del PDF»; sustituye a «Sin configurar»)

## 5 · Comprobar que lo rellenado se ve

Los impresos de la Junta son formularios XFA con copia AcroForm (de ahí `form1[0]…`). pdf-lib
rellena la parte AcroForm; Adobe Reader puede enseñar la parte XFA y no lo que se ha rellenado.
Comprueba con uno de `formularios/` (el Anexo III, `O-III.pdf` o el que sea): si el PDF trae
`/XFA` en su `AcroForm`, al preparar el impreso para el tercero quita esa entrada
(`form.acroForm.dict.delete(PDFLib.PDFName.of('XFA'))`) para que todos los visores enseñen la
parte rellenada, y las casillas sigan escribiéndose. Si al quitarla el PDF deja de abrirse bien o
pierde casillas, no la quites y apúntalo en «Lo que queda por hablar con Francisco» de
`docs/COLA.md`.

---

## Pruebas

Amplía `pruebas/formularios-rellenar.mjs` (sin navegador):

- `nombreLegible`: los nombres de la captura del Anexo III dan «Página 2 · Primer apellido»,
  «Página 2 · Segundo apellido», «Página 2 · Nombre», «Página 2 · Número inscripción» y «Página 1
  · Barras».
- `clasificarCasilla`: `apellido1encab` y `fecha_nacimiento` → persona; `nombre_centro`,
  `codigo_centro` y `fecha` → centro; `Barras` → otra.
- `proponerMapa` ya no propone nada para `fecha_nacimiento` ni para `domicilio` sin `centro`.
- La agrupación de repetidas: tres casillas `…Página_2[0]…apellido1encab[0]`,
  `…Página_2[1]…apellido1encab[0]`, `…Página_3[0]…apellido1encab[0]` dan una sola fila.
- Con un PDF de formulario montado con pdf-lib y una entrada `/XFA` de mentira: tras rellenar, no
  queda `/XFA` y las casillas no rellenadas siguen escribiéndose.

Y una prueba de navegador corta (o ampliar la de Ajustes que ya despliega los impresos): el Anexo
III enseña las del centro arriba, los dos grupos plegados, y ningún nombre que empiece por
`form1[0]` a la vista.

## Qué hay que actualizar al terminar

- `docs/CONTEXTO-CORTO.md`, sección 5: la línea de «Formularios» gana «casillas con nombre legible,
  miniatura y solo las del centro a la vista».
- `docs/contexto/DOCUMENTOS-PDF.md`: esta fila, sustituyendo lo que deje de ser verdad de la 84
  (propuesta que ahora se guarda sola, «Sin configurar»).
- `docs/HISTORIA.md`: entrada con fecha.
- Si `js/formularios-rellenar.js` pasa de 600 líneas, parte la pantalla de Ajustes a
  `js/formularios-ajustes.js` y apúntalo en `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`.
