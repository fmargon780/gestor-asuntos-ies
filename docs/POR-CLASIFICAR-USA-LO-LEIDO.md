# Por clasificar, la bandeja y «Poner nombre» usan lo que ya se ha leído (fila 174)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Segunda parte de la «tanda 1» del análisis
de usabilidad. **Va después de la fila 173**: usa su `App.nuevoAsuntoCon`.

Idea de fondo: el lector de documentos ya lee el sello de registro, la fecha y el tercero de cada
PDF, y lo enseña en la tarjeta. Pero dos clics después la aplicación lo vuelve a pedir en blanco.
Eso se acaba: **lo leído viaja con el documento hasta el cuadro de ponerle nombre.**

## Ficheros que se tocan

- `js/documentos-formulario.js` (punto 1)
- `js/documentos.js` (puntos 1 y 2: pasar `propuesta` a `pintarFormulario`)
- `js/documentos-guardar.js` (punto 3)
- `js/documentos-sueltos.js` (puntos 2 y 4)
- `js/documentos-sueltos-lector.js` (puntos 1 y 4: exponer lo leído, un solo botón)
- `js/asuntos-nuevo-crear.js` (punto 2: el documento traído abre directo su cuadro de nombre)
- `js/bandeja-guardar.js` y `js/bandeja-adjuntos-lector.js` (punto 5)
- `js/registro.js` (punto 6)
- Una prueba nueva en `pruebas/`

No leas el repositorio entero. Cambios quirúrgicos. `js/documentos-sueltos.js` tiene 546 líneas:
si pasa de 600, pártelo.

## Qué hay que hacer

### 1. El cuadro de «Poner nombre» nace relleno

`pintarFormulario(opciones)` (`js/documentos-formulario.js`) acepta un `opciones.propuesta`
opcional con `{ fecha, registro }` en el formato que devuelve `LectorDocumentos.analizar`
(`registro: { anio, tipo, serie, numero }`). Reglas:

- **Lo que ya trae el nombre del fichero manda** (`previo`, de `N.leerNombre`). La propuesta solo
  rellena lo que el nombre no trae.
- `fecha`: si el nombre no la trae, la de la propuesta; si tampoco, hoy (como ahora).
- `registro`: si el nombre no lo trae y la propuesta sí, marcar «Está registrado en Séneca» y
  rellenar Año, Entrada/Salida, Serie y Número. Debajo, la línea verde «Leído del sello de
  Séneca.», la misma que usa `js/registro.js`.
- **Tipo de documento**: el lector no lo lee. Si el nombre no lo trae, el desplegable arranca en
  **el último tipo de documento que se guardó en un asunto de ese mismo tipo de asunto**, en este
  ordenador (memoria en `localStorage`, clave `gestor-ultimo-tipo-doc`, un objeto
  `{ TIPO_DE_ASUNTO: TIPO_DE_DOCUMENTO }`, con `try/catch`). Se apunta al guardar. Sin memoria,
  como hoy.

Quien tenga la propuesta la pasa. Para los sueltos: `LectorDeSueltos.resultadoDe(nombre)`
(`js/documentos-sueltos-lector.js`). Como el fichero cambia de nombre al entrar en el asunto,
guarda la propuesta junto al documento pendiente (`App.E.pendiente.propuesta`, y en `meter…` una
variable local) **antes** de moverlo.

### 2. Tras meter o crear, se abre el cuadro de nombre, no la lista

- En `js/documentos-sueltos.js`, al terminar de meter un suelto en un asunto, hoy se llama
  `App.verDocumentos(asunto, opciones)` y solo con hito se pasa `ponerNombre`. Pasar **siempre**
  `{ ponerNombre: s.nombre, propuesta: … }` (más el `hito` si lo hay).
- En `js/asuntos-nuevo-crear.js`, al crear un asunto con documento traído (`traido`), igual:
  `App.verDocumentos(recien, { ponerNombre: traido.nombre, propuesta: … })`.
- `js/documentos.js`: el `ponerNombre` ya abre el formulario directo; que pase también
  `propuesta` a `pintarFormulario`.

### 3. Guardar cierra el cuadro cuando se abrió para eso

En `js/documentos-guardar.js`, al final de `guardar`: si el cuadro se abrió con `ponerNombre`,
tras guardar bien **cerrar el cuadro** (en vez de `N.pintarLista()`). Abierto desde la lista
(«Poner nombre» de una fila), se vuelve a la lista como hoy. Excepción, el punto 5: si quedan
adjuntos de correo por nombrar, pasar al siguiente.

### 4. Un solo botón para crear el asunto desde un suelto

Hoy la tarjeta de «Por clasificar» tiene «Crear asunto con él» (va a Nuevo asunto **vacío**) y,
si el lector acierta tipo y tercero, un segundo botón «Aceptar» / «Crear asunto nuevo».

- Queda **uno solo: «Crear asunto con él»**, en su sitio de siempre. Quitar «Aceptar» /
  «Crear asunto nuevo» de `js/documentos-sueltos-lector.js`.
- Lo que hace, según lo leído (`LectorDeSueltos.resultadoDe`):
  - con tipo **y** tercero: lo mismo que hacía «Aceptar» (`App.crearAsuntoConPropuesta`), y su
    `title` lo dice: «Crea el asunto con lo leído y mete el documento dentro».
  - con tercero y sin tipo: `App.nuevoAsuntoCon({ tercero, fecha })` (fila 173) con el documento
    pendiente, y la franja de siempre «Este asunto se crea con un documento…».
  - sin nada, o sin haber terminado de leer: como hoy.
  - En los tres casos, la fecha leída del documento va a «Fecha de inicio».
- Con sugerencias («Podría ir en: … [Meter aquí]»), el botón deja de ser el principal (clase
  `boton` en vez de `boton-principal`), como hacía «Aceptar».
- La línea gris de lo leído y el botón «Dar de alta: …» no cambian.

### 5. Los adjuntos de un correo pasan por el cuadro de nombre

Hoy, al crear un asunto desde la bandeja o guardar el correo en uno, los adjuntos entran como
`AAMMDD ADJUNTO <nombre original>.pdf` y nadie los nombra.

- Al terminar `engancharCorreo` / `guardarEnAsunto` (`js/bandeja-guardar.js`), si ha entrado
  algún adjunto, abrir `App.verDocumentos(asunto, { ponerNombre: <primer adjunto>, propuesta })`,
  con la propuesta leída de **ese** adjunto por `js/bandeja-adjuntos-lector.js` (hoy junta la de
  todos; que guarde también la de cada fichero, por su nombre, y la exponga).
- Al guardar ese nombre, si queda otro adjunto de ese mismo correo con el nombre `… ADJUNTO …`,
  abrir el cuadro para él. Al cerrar el cuadro sin guardar, se acaba la serie.
- El PDF del correo (`CORREO`) y el del hilo (`HILO`) no se nombran: se quedan como están.

### 6. «Registrar» deja el original en «Versiones previas»

Hoy el botón «Registrar» (`js/registro.js`, `guardar`) copia el PDF sellado con su nombre nuevo y
deja el original tal cual, que sigue saliendo como «Sin registrar». El camino del sello detectado
(`js/registro-sellado.js`) ya hace lo correcto. Igualarlos:

- Tras copiar bien el sellado, **renombrar el original** con ` SIN SELLAR` al final (misma regla
  que `js/registro-sellado.js`, líneas 142-148; reutiliza su función si está expuesta, o
  exponla) y **moverlo a «Versiones previas»** con `VersionesPrevias.mover` y
  `VersionesPrevias.ordenarTrasCambio`.
- Solo si el sellado es un fichero distinto del original. Si el usuario eligió el mismo fichero
  que ya estaba en la carpeta, no se toca nada más.
- Si falla ese movimiento, es accesorio (`U.accesorio`): el registro ya está hecho.

## Lo que no se hace

- No se cambian los textos de los botones salvo el del punto 4.
- No se toca el lector (`js/lector-documentos.js`): se usa lo que ya devuelve.
- No se lee ningún PDF más veces de las que se lee hoy.

## Prueba

Una prueba nueva en `pruebas/` (navegador): un PDF suelto con sello `26EM0368` y fecha
10-09-2026 de un alumno conocido; «Crear asunto con él» → el asunto se crea (o el formulario sale
con el alumno fijado, según tenga tipo o no) → el cuadro de nombre sale **directo**, con la
fecha 2026-09-10 y el registro marcado y relleno → «Guardar» cierra el cuadro. Y `npm test`
entero en verde.

## Al terminar

Reglas de siempre de `docs/COLA.md`. En `docs/CONTEXTO-CORTO.md`, sustituir las líneas de
«Por clasificar» y «Registrar» de la sección 5. Poner al día `docs/contexto/DOCUMENTOS.md`,
`docs/contexto/DOCUMENTOS-PDF.md` y la parte de la bandeja de `docs/contexto/CORREO-Y-SENECA.md`.
Entrada en `docs/HISTORIA.md`.
