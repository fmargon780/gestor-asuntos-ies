# Nuevo asunto más cómodo (fila 489)

Tema 486, ideas 482 y 483 (avisos de Diego Herrera desde el botón de soporte, 28-oct-2026).
Diseñado con Francisco el 29-oct-2026. Una sola sesión de Claude Code.

## Por qué

- Idea 482 (Diego): «Que una vez seleccionado el tipo de asunto para el tercero, el cursor se ponga
  en campo de busqueda». En su captura venía de crear un asunto con un documento escaneado: eligió el
  tipo en la parrilla y tuvo que pulsar a mano en «Escribe dos letras del nombre».
- Idea 483 (Diego): «Al dar de alta un alumno nuevo para el sistema, en la ficha de registro debe
  poner Apellidos y Nombre, en lugar de Nombre». En su captura, en la casilla «Nombre» del cuadro
  «Dar de alta un solicitante» escribió «Martinez Martinez. Daniel», con punto en vez de coma: el
  formato de la regla de nombres (`Apellido1 Apellido2, Nombre`, `docs/CONTEXTO-CORTO.md` sección 4)
  no se ve en ningún sitio.

## Ficha del cambio

### Resumen que aprobó Francisco (máx. cinco líneas)
- En «Nuevo asunto», al elegir un tipo o una persona, el cursor salta solo al siguiente hueco que falte, y ese hueco se ilumina un instante.
- Al dar de alta o cambiar una persona de Alumnado o de Personal, «Nombre» se sustituye por dos casillas: «Apellidos» y «Nombre». La app pone la coma al guardar.
- Lo que se guarda no cambia: sigue siendo «Apellidos, Nombre» en una sola columna.
- Desaparece la casilla única «Nombre» en esas dos categorías; «Otros», «Empresas» y «Administraciones» siguen como hoy.

### Qué verá y hará la usuaria cuando esté terminado
1. En «Nuevo asunto», sin persona elegida, pulsa un tipo en la parrilla (o lo elige en «Buscar tipo»): el cursor queda en el buscador de persona («Escribe dos letras del nombre») y ese buscador se ilumina un instante. Puede escribir sin pulsar antes en él.
2. En «Nuevo asunto», sin tipo elegido, elige una persona: el cursor queda en «Buscar tipo» y se ilumina un instante.
3. Con persona y tipo ya elegidos (elija lo que elija el último), el cursor va a la primera casilla vacía de «Datos del asunto» (los campos propios del tipo); si el tipo no tiene campos o están todos rellenos, al botón «Crear el asunto», de modo que Intro lo crea.
4. Al dar de alta un solicitante (Alumnado) o a alguien de Personal, desde cualquier sitio, el cuadro trae «Apellidos» y «Nombre» en la misma fila (Apellidos más ancha), en el sitio donde hoy está «Nombre». Debajo, en gris, «Se guardará como: Martínez Martínez, Daniel», que se pone al día mientras escribe.
5. Si pega o escribe en «Apellidos» un nombre entero con coma («García López, Ana»), al salir de la casilla la app lo reparte sola: «García López» en Apellidos y «Ana» en Nombre.
6. Al cambiar los datos de una persona de Alumnado o Personal ya dada de alta, las dos casillas salen rellenas, partiendo lo guardado por la primera coma. Si lo guardado no tiene coma, todo va a «Apellidos», «Nombre» queda vacío y sale un aviso ámbar dentro del cuadro: «Este nombre no tiene coma. Revisa qué parte son los apellidos y cuál el nombre.»
7. Para guardar hacen falta los dos: con «Apellidos» o «Nombre» vacío, «Guardar» no cierra el cuadro y avisa «Faltan los apellidos» o «Falta el nombre».

### Qué NO cambia
- Cómo se guarda la persona: una sola columna «Nombre» en `solicitantes.csv` y `personal.csv`, con el texto `Apellidos, Nombre`. Las carpetas, los buscadores y las búsquedas siguen igual.
- Las categorías Empresas, Otros y Administraciones, y los Tutores legales (sin alta a mano).
- La preparación de «Nuevo asunto» al entrar (`App.prepararNuevo`), la parrilla de tipos, el buscador de tipos y la pastilla de categoría.
- Los nombres de personas que vienen del RegAlum, del Centro de datos o de la BD de alumnado: no pasan por este cuadro.

### Qué NO se hace en esta tarea
- Corregir los nombres ya guardados sin coma: solo se avisa al abrir su cuadro de cambiar datos.
- Mover el cursor en otras pantallas que no sean «Nuevo asunto».
- Partir en dos casillas el buscador de personas.

### Qué más se ve afectado (y qué pasa con cada cosa)
- El cuadro común `App.cuadroDeTercero` (`js/asuntos-nuevo-alta.js`): es el único cuadro de alta y de cambio de datos de un tercero; ahí va el cambio de las dos casillas, y así llega a todos los sitios — decidido por Claude.
- Sus llamadas, que no hay que tocar salvo lo que diga la siguiente línea: alta en «Nuevo asunto» (`App.altaTercero`), personas relacionadas (`js/relacionados.js`), Personas y empresas (`js/archivo-personas.js`), cambiar el tercero de un asunto (`js/asuntos-editar-tercero.js`), «Cambiar los datos» (`js/tercero-cambiar-datos.js`) y «Dar de alta: …» del lector de documentos (`js/documentos-sueltos-lector.js`) — decidido por Claude.
- Lo que llega ya escrito al cuadro (lo tecleado en el buscador, o el nombre leído de un documento): se reparte con la misma regla del punto 6; sin coma, todo a «Apellidos», sin aviso ámbar en un alta (el aviso es solo al cambiar una persona ya guardada) — decidido por Claude.
- `TerceroRenombrar.textoDeValores` y el renombrado de carpetas al cambiar el nombre: reciben el mismo objeto de siempre, con la columna «Nombre» ya unida — decidido por Claude.
- La vista previa del nombre de carpeta y el resto de «Nuevo asunto»: igual — decidido por Claude.

### Decisiones
- De Francisco en el debate:
  - Adónde va el cursor al elegir el tipo → al primer hueco que falte (1-2).
  - Camino al revés → al elegir la persona, el cursor va al buscador de tipos (2-1).
  - La casilla del nombre → dos casillas, «Apellidos» y «Nombre», y la app pone la coma (3-3).
  - Dónde se aplica → altas y cambios de Alumnado y Personal; «Otros» sigue con «Nombre» (4-2).
- Medidas para los contras de lo elegido (Francisco las aceptó todas):
  - El cursor que se mueve solo puede despistar → solo salta al elegir un tipo o una persona, nunca mientras se escribe, y el destino se ilumina un instante.
  - Dos casillas son un cambio más grande → si se pega el nombre entero con coma en «Apellidos», se reparte solo.
  - Las personas ya guardadas tienen el nombre en una línea → al cambiar sus datos salen las dos casillas rellenas, partiendo por la coma; sin coma, todo a «Apellidos» con aviso ámbar.
  - Toca más pantallas → el cambio va en el cuadro común, el mismo en todos los sitios.
  - Más que probar → pruebas automáticas de los dos caminos; Francisco no prueba nada.
- De Claude:
  - El cambio del nombre se hace solo en la pantalla del cuadro; se guarda unido → no hay que migrar datos ni tocar buscadores.
  - Partir por la **primera** coma; lo que va detrás, recortado de espacios → los nombres compuestos («María José») quedan enteros en Nombre.
  - Al unir: `Apellidos.trim() + ', ' + Nombre.trim()`, con espacios dobles reducidos a uno.
  - «Iluminarse un instante»: la clase de foco de siempre (`.campo:focus`) más un resplandor azul claro (`--azul-claro`) que se apaga solo en un segundo; nada de animaciones largas.
  - El salto del cursor se hace al terminar de pintar lo que cambia tras elegir (no antes), para que no se lo quite un repintado: con un único punto, `App.irAlSiguienteHueco()`, llamado al final de `App.elegirTipo` y de `App.fijarTercero` solo cuando la elección viene de una pulsación de la usuaria (no cuando `App.nuevoAsuntoCon` rellena el formulario solo al entrar).
  - «Siguiente hueco», en este orden: buscador de persona (si no hay persona y el asunto no es de grupo), «Buscar tipo» (si no hay tipo), primera casilla vacía de «Datos del asunto», botón «Crear el asunto».
  - Al elegir «Es para un grupo de personas» no se mueve el cursor.
  - Cuenta como elección de la usuaria (y mueve el cursor): pulsar un tipo de la parrilla, elegirlo en «Buscar tipo» o en la línea de tipo con «Cambiar» (`js/tipo-en-linea.js`), «+ Crear tipo nuevo», pulsar una persona de los resultados, terminar un alta (la persona nueva queda elegida) y «Es esa persona» del aviso de otra lista. No cuenta: lo que rellena `App.nuevoAsuntoCon` al entrar, `App.prepararNuevo`, ni la llamada que `App.elegirTipo` hace por dentro a `App.fijarTercero`. Se pasa un indicador (o se llama a `App.irAlSiguienteHueco()` al final de esos manejadores) para que el salto ocurra **una sola vez** por elección.
  - Si el siguiente hueco es «Crear el asunto» y el botón está desactivado mientras llega el número del asunto, el foco espera a que se active (como mucho unos segundos; si no llega, se queda donde estaba).
  - Si «Buscar tipo» no está a la vista: con la línea de tipo de `js/tipo-en-linea.js`, el foco va a su caja de búsqueda si está abierta; si no hay ninguna caja de tipo visible, el cursor no se mueve.
  - El escuchador del botón de aceptar se quita al cerrar el cuadro (Guardar o Cancelar): ese botón es el mismo para todos los cuadros.
  - Al cambiar los datos de una persona: si la usuaria no ha tocado ninguna de las dos casillas, se devuelve el nombre tal como estaba guardado, sin volver a unirlo; así no salta la pregunta de renombrar carpetas por un espacio o una coma sin espacio.
  - Por dentro, el valor unido es el que llega a la columna «Nombre» (`puestos.Nombre`); las dos casillas visibles no llevan las dos `data-campo="Nombre"`. En Alumnado y Personal el aviso «Hace falta al menos el nombre» se sustituye por «Faltan los apellidos» / «Falta el nombre».
  - La línea gris «Se guardará como: …» solo sale con las dos casillas rellenas.
  - Modo grupo: es el estado que guarda `js/asunto-de-grupo.js` para «Nuevo asunto»; en ese modo el paso de la persona se salta y el siguiente hueco empieza en «Buscar tipo».
  - En «Datos del asunto», un desplegable con un valor elegido y una fecha puesta cuentan como rellenos; vacíos, como huecos.
  - Que «Guardar» no cierre el cuadro con una casilla vacía: `U.preguntar` no tiene hoy forma de impedirlo, así que dentro de `App.cuadroDeTercero` se engancha al botón de aceptar de ese cuadro un escuchador (en fase de captura) que, con una casilla vacía, para la pulsación y enseña el aviso; `U.preguntar` no se cambia para el resto de cuadros.

### Pendiente (lo que Francisco aún no tiene claro; no se programa)
- Nada.

### Cómo sabré que está bien (lo que mira Francisco en pantalla)
1. En «Nuevo asunto», pulso un tipo y escribo directamente: las letras salen en el buscador de persona.
2. Si elijo primero la persona, el cursor está en «Buscar tipo».
3. Al dar de alta un solicitante, el cuadro trae «Apellidos» y «Nombre», y debajo «Se guardará como: Martínez Martínez, Daniel».
4. Si pego «García López, Ana» en «Apellidos», se reparte sola en las dos casillas.

### Cómo se comprueba (para Claude Code; un punto por cada línea de «Qué verá y hará la usuaria»)
1. Demo, «Nuevo asunto» vacío: pulsar un tipo de la parrilla y escribir «Mar» sin pulsar nada más → el texto está en `#buscar-tercero` y salen resultados. Igual eligiéndolo desde «Buscar tipo». El buscador lleva el resplandor y al segundo ya no.
2. Demo, «Nuevo asunto» vacío: buscar y pulsar una persona → `document.activeElement` es la caja de «Buscar tipo».
3. Con persona y tipo con campos propios vacíos → foco en la primera casilla vacía de «Datos del asunto»; con un tipo sin campos → foco en `#btn-crear` e Intro crea el asunto. Entrar en «Nuevo asunto» con `App.nuevoAsuntoCon` (desde la ficha de una persona) no mueve el cursor.
4. Alta de solicitante desde «Nuevo asunto», desde Personas y empresas, desde personas relacionadas y desde «Dar de alta: …» del lector; y alta en Personal → el cuadro tiene «Apellidos» y «Nombre» y no tiene la casilla única «Nombre». Escribir «Martínez Martínez» y «Daniel» → la línea gris dice «Se guardará como: Martínez Martínez, Daniel»; guardar → la persona queda guardada como `Martínez Martínez, Daniel` en `solicitantes.csv` y queda elegida en «Nuevo asunto». En Empresas y Otros el cuadro es el de hoy.
5. Pegar «García López, Ana» en «Apellidos» y salir → «García López» / «Ana».
6. «Cambiar los datos» de una persona guardada como `Pérez Ruiz, Lucía` → «Pérez Ruiz» / «Lucía», sin aviso; de una guardada como `Lucía Pérez Ruiz` (sin coma) → todo en «Apellidos», «Nombre» vacío y el aviso ámbar. Guardar sin cambiar nada una con coma no cambia el nombre ni pregunta por carpetas.
7. Con una de las dos casillas vacía, «Guardar» no cierra el cuadro y sale el aviso que toca.
- Además: las pruebas de lo tocado (`npm test -- nuevo-asunto alta tercero relacionados`) y una prueba nueva `pruebas/nuevo-asunto-mas-comodo.mjs` con los puntos 1 a 7.

### Respuestas de Francisco durante el trabajo
- (las apunta Claude Code si tiene que preguntarle algo)
