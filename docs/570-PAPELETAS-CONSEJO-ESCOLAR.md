# 570 — Papeletas del Consejo Escolar

## Lo que escribió Francisco
Hay que preparar las papeletas a las elecciones del Consejo Escolar, para el alumnado y para el profesorado. ¿Podemos aprovechar la herramienta que ya tenemos para la elaboración de las etiquetas?
Te adjunto el modelo que se usó en las anteriores elecciones para el alumnado por si te sirve de guía. Te paso también el listado definitivo de candidatos para las elecciones actuales.

(Idea 567. Los adjuntos eran el modelo de papeletas de 2021-22 en Excel y el listado definitivo de candidatos de Séneca de 2026-27. No se copian aquí: llevan datos personales y el repositorio es público. Lo que hace falta de ellos ya está en la pantalla de prueba y en este texto.)

## Lo que entendió Claude (acordado con Francisco el 9-nov-2026)
- No se usa la pantalla de Etiquetas: las papeletas salen de la tarjeta «Candidaturas» del asunto de las elecciones, donde ya están los candidatos, su sector y su estado.
- En la tarjeta, junto a «Lista de candidaturas ▾», un botón nuevo **«Papeletas»**.
- Los cuatro sectores: Alumnado, Madres y padres, Profesorado y PAS.
- «Papeletas» abre una ventana con una fila por sector: sector, número de candidaturas **admitidas**, **cruces que se pueden marcar** (ya puestas, no se escriben) y **papeletas** (se escribe cuántas hacen falta). Un sector sin admitidas no deja escribir. El sector que se deja en blanco no se saca. Si no se escribe ninguno: «Escribe cuántas papeletas hacen falta en algún sector.»
- Las cruces las pone la app según la norma: tantas como puestos a cubrir (Decreto 327/2010, art. 50, 53.4 y 58.6). Con 12 unidades o más: Alumnado 5, Madres y padres 5, Profesorado 8, PAS 1. Con menos de 12: 3, 4, 6 y 1. Bajo la tabla, una línea dice de dónde salen y cuántas unidades tiene el centro.
- En la ventana, la casilla **«La AMPA ha designado representante (madres y padres eligen uno menos)»**: al marcarla, las cruces de madres y padres bajan en uno (Orden de 7-oct-2010, art. 5). El designado no sale en la papeleta.
- La ventana recuerda las papeletas escritas la última vez mientras la ficha siga abierta.
- Sale **un PDF por sector**, cada uno guardado en el asunto como documento propio, con su nombre fijo (`AAMMDD PAPELETAS D26-….pdf`, tipo de documento PAPELETAS, que se crea solo si no existe). Al terminar, un aviso verde dice los PDF guardados, uno por línea, con su sector, y se abren en el visor de siempre con un botón por sector encima para pasar de uno a otro.
- Hojas A4. **Hasta 8 candidatos admitidos en el sector, 10 papeletas por hoja (2 columnas × 5 filas); con más de 8, 8 por hoja (2 × 4)**, con la letra más grande. Las papeletas se separan con una línea discontinua para cortar. La última hoja puede ir incompleta.
- Cada papeleta: «Elecciones al Consejo Escolar 2026-2027» (el curso de la convocatoria), «IES Fuente Lucena · Sector <sector>» (el nombre del centro), «Marca hasta N cruces» («cruz» si es 1) y la lista de candidaturas **admitidas**, numerada, en orden alfabético de apellidos, cada una con su recuadro vacío. En Alumnado, cada candidato lleva su grupo a la derecha.
- Solo nombre y apellidos: ni DNI ni número escolar.
- En el ⋮ de cada candidatura de Madres y padres, **«Es de la AMPA»**: pregunta el nombre de la AMPA y lo apunta en la candidatura. La fila lo enseña como una etiqueta junto al nombre, y en la papeleta sale a la derecha del nombre, **sin cruz puesta** (Orden de 7-oct-2010, art. 9.1.c). Una candidatura marcada así ofrece en su ⋮ «Ya no es de la AMPA», que lo quita.
- No desaparece nada de lo que hay en la tarjeta.

## Pantalla de prueba
- Aprobada el 9-nov-2026: `docs/pantallas/570.html` · https://claude.ai/artifact/WEuX3uEg8QuNeBfyDaExwZ
- El botón «Ampliar»/«Reducir» del visor es solo de la pantalla de prueba (para enseñarla): en la app no se hace; el PDF se abre en el visor de siempre.
- En la prueba, las papeletas se dibujan en la página; en la app son un PDF de verdad.

## Qué NO se hace en esta tarea
- Nada en la pantalla de Etiquetas.
- «Es de la AMPA» (asociación que presenta la candidatura) solo en Madres y padres, no en Alumnado.

## Notas técnicas de Claude
- Código nuevo en `js/candidaturas-papeletas.js` (`CandidaturasPapeletas`), con el PDF hecho con pdf-lib como `js/candidaturas-lista.js` (mismo `limpio` para WinAnsi; si hace falta compartirlo, se saca a un sitio común, sin copiarlo). Se carga después de `js/candidaturas-lista.js`. Ningún fichero pasa de 600 líneas.
- El botón «Papeletas» se pinta en la barra de `js/candidaturas-ficha.js` (`cuerpoHtml`, junto a `#cand-lista-menu`), desactivado en solo consulta como «+ Añadir candidatura». La opción «Es de la AMPA» va en el ⋮ que ya monta ese fichero.
- La AMPA se guarda en la candidatura como `ampa: '<nombre>'` en `ficha.candidaturas`, con `Candidaturas.cambiar` (relee y toca solo esa; nunca se sustituye la lista entera). Quitarla deja `ampa` vacío.
- Unidades del centro: las unidades distintas del listado del alumnado (`Datos`); si no hay listado, se toman 12 o más y la línea de la ventana lo dice.
- Grupo del alumno: el de su ficha en el listado del alumnado, buscado por la clave de `persona`; si no está, sin grupo.
- Curso de la convocatoria: el curso académico en curso de la app; nombre del centro: el de los datos del centro.
- Cada PDF se guarda en la carpeta del asunto con número de documento propio y lo que haga falta para que salga en Registro y documentos como cualquier otro guardado por la app (como el de `js/candidaturas-lista.js`).
- Textos con `docs/VOCABULARIO.md`; añadir «papeleta» si no está.
- `js/novedades.js`: una línea. `docs/contexto/ASUNTOS.md` (apartado de candidaturas) y `docs/CONTEXTO-CORTO.md` sección 5: sustituir la línea, no añadir.
- Prueba nueva `pruebas/candidaturas-papeletas.mjs`, con la copia de pruebas.

## Cómo lo comprueba el segundo revisor
- En el asunto de elecciones de la copia de pruebas, la tarjeta «Candidaturas» tiene «Papeletas» junto a «Lista de candidaturas ▾».
- La ventana enseña una fila por sector con admitidas, cruces ya puestas (5, 5, 8, 1 con 12 unidades o más) y una casilla para las papeletas; un sector sin admitidas no deja escribir.
- Marcar «La AMPA ha designado representante» baja madres y padres en uno; desmarcarla lo devuelve.
- Sin papeletas en ningún sector sale el aviso y no se guarda nada.
- Con papeletas en dos sectores salen dos PDF guardados en el asunto, uno por sector, con el aviso verde que los nombra.
- En el PDF: solo admitidas, numeradas y por apellidos, con recuadro vacío; grupo en Alumnado; «Marca hasta N cruces»; sin DNI ni número escolar.
- Un sector con 8 candidatos admitidos o menos lleva 10 papeletas por hoja; con 9 o más, 8.
- Cambiar una candidatura a «Excluida» la quita de la papeleta y baja la cuenta de admitidas.
- «Es de la AMPA» en Madres y padres pide el nombre, lo enseña en la fila y en la papeleta sin cruz; «Ya no es de la AMPA» lo quita. En los otros sectores el ⋮ no lo ofrece.
- Comparar la ventana, la tarjeta y una hoja del PDF con `docs/pantallas/570.html`.

## Qué mirar al terminar
- En el asunto de las elecciones, pulsa «Papeletas» y mira que las cruces salen ya puestas.
- Marca a la candidata de la AMPA con «Es de la AMPA» y saca las papeletas de Madres y padres: su AMPA sale al lado, sin cruz.
- Saca las de Profesorado y mira que van 8 por hoja y se leen bien.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
