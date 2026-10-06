# Problemas que hoy no se pueden arreglar bien (fila 292)

Cerrado con Francisco el 6-oct-2026. Tercera de tres filas del mismo diseño. Va después de la 288
(`docs/AJUSTES-EN-CUATRO-PESTANAS.md`) y de la 291 (`docs/PROBLEMAS-CON-SU-SOLUCION.md`), que deja
cada problema en una tarjeta con «Qué pasa», «Por qué» y «Qué hacer».

## Qué pasó

Al repasar todos los avisos para la fila 291 salieron varios que, aunque se expliquen bien, no
dejan arreglar el problema, o lo dejan arreglar a ciegas:

- Los hitos de un asunto que ya no existe con ese nombre solo se pueden borrar. Si el asunto sigue
  vivo con otro nombre, sus hitos se pierden.
- «Buscar su carpeta» enseña un desplegable con todas las carpetas sin asunto, sin proponer cuál.
- Cuando dos ordenadores guardan a la vez, hay que elegir una versión sin saber en qué se
  diferencian.
- En Inicio, «N asuntos que se repiten toca crearlos» los crea al pulsarlo, sin decirlo antes.
- En Inicio, «N aspirantes sin Nº de identificación escolar» lleva a una lista y no dice qué hacer.
- «Borrados que se fusionan» enseña su texto y la lista vacía: nadie llama a lo que la pinta.

## Qué quiere Francisco

Lo acordado el 6-oct-2026: «los hitos huérfanos podrán volver a su asunto (hoy solo se pueden
borrar). Los conflictos de Dropbox enseñarán en qué se diferencian las dos versiones antes de
elegir.» Y en el ejemplo que aceptó, «Buscar su carpeta» **propone** la carpeta que más se parece.

## Qué hay que hacer

### 1. Los hitos vuelven a su asunto

En la tarjeta «Hay hitos guardados de N asuntos que ya no existen con ese nombre», cada línea
pasa a tener dos botones:

- **Son de este asunto…** (lo normal): «Eliges el asunto al que pertenecen. Los hitos pasan a él.»
- **Quitar**: como en la fila 291.

Se quita la frase «Si reconoces el asunto, no los quites todavía.»

Al pulsar «Son de este asunto…»:

- Un cuadro con un buscador de asuntos abiertos, el mismo de siempre (por tercero, tipo, número
  del asunto). Arriba, ya propuesto, **el que más se parece** al nombre viejo (apartado 3), con la
  línea «Parece este:». Si ninguno se parece, la caja sale vacía.
- Debajo, lo que se va a mover: «N hitos, M hechos», y los títulos de los tres primeros.
- Si el asunto elegido **no tiene hitos**: los recibe tal cual. Botón «Pasar los hitos».
- Si **ya tiene hitos**: se dice antes, «Este asunto ya tiene N hitos. Se unen: los que tengan el
  mismo título cuentan como uno, y se queda con lo hecho en cualquiera de los dos.» Botón «Unir
  los hitos». Es la unión que ya existe (`AsuntoRenombrar`), no otra nueva.
- Después, aviso verde «Hitos pasados a <asunto>.» con «Deshacer», que los devuelve a donde
  estaban.
- Todo por `AsuntoRenombrar` y la cola de guardado; nunca escribiendo `hitos.json` a mano.

### 2. «Buscar su carpeta» propone

En la tarjeta «N asuntos han perdido su carpeta», al pulsar «Buscar su carpeta»:

- En vez del desplegable de hoy, la lista de carpetas sin asunto, **ordenada de más a menos
  parecida** (apartado 3). La primera sale marcada y lleva «Parece esta:» si el parecido es claro.
- Cada carpeta enseña su nombre y cuántos documentos tiene dentro.
- Con una sola candidata y parecido claro, el cuadro lo dice: «Solo hay una carpeta sin asunto, y
  encaja.»
- Lo demás (qué se mueve, el aviso de después) no cambia.

### 3. Qué es «parecerse»

Una sola función para los apartados 1 y 2, sin pantalla, con su prueba. De más a menos peso:

1. El mismo número del asunto (`A26-0137`) en los dos nombres: es el mismo, sin más.
2. El mismo tercero (por su Nº de identificación escolar, sus cuatro últimos caracteres del
   documento o su NIF, que van en el nombre de la carpeta).
3. El mismo tipo de asunto.
4. La misma fecha de inicio (`AAMMDD`).
5. Palabras del nombre en común.

«Parecido claro» es: el mismo número, o el mismo tercero y el mismo tipo, sin otra candidata que
empate. Si hay empate, se ordena pero no se marca ninguna.

### 4. Ver en qué se diferencian las dos versiones

En la tarjeta «N cosas se guardaron a la vez en dos ordenadores», cada línea lleva, antes de los
dos botones, **«Qué cambia»**:

- De cuándo es cada versión (día y hora) y, si se sabe, de qué ordenador o persona.
- Las diferencias, en palabras y con nombres, no con datos internos. Para la lista de asuntos:
  «Solo en este ordenador: <asunto> (creado)», «Solo en el otro: <asunto>», «Distinto: <asunto> —
  hito actual, 2 notas». Para el tablón: las notas que solo están en una. Para los hitos: el
  asunto y el hito que cambia. Para otros ficheros, lo que se pueda decir con sentido; si no se
  puede, «No se puede enseñar la diferencia de este fichero.»
- Como mucho diez líneas, y «y N más».
- Si las dos versiones resultan ser iguales en lo que importa: «Las dos dicen lo mismo.» y un solo
  botón, «Resolver», que se queda con la de este ordenador.

Solo se lee: enseñar la diferencia no escribe nada.

### 5. Dos avisos de Inicio que no avisaban

- **«N asuntos que se repiten toca crearlos»**: al pulsarlo ya no los crea directamente. Abre un
  cuadro con la lista (tipo y tercero de cada uno) y los botones «Crear N asuntos» y «Cancelar».
- **«N aspirantes sin Nº de identificación escolar»**: sigue llevando a la lista, y encima de ella
  sale una línea: «Cuando tengas su Nº de identificación escolar, escríbelo en su ficha. Sus
  carpetas cambian de nombre solas.»

### 6. «Borrados que se fusionan»

Su lista sale siempre vacía porque `App.pintarBorradosFusion` no lo llama nadie. Comprobarlo y,
si es así, llamarlo al pintar su sección (ahora en Herramientas → «Puesta a punto y
reparaciones»). Su texto de arriba se reescribe con palabras de usuario: qué recuerda la app, para
qué, y qué pasa al quitar los de más de 90 días.

## Lo que no cambia

- Cómo se detecta cada problema.
- «Quitar», «El asunto ya no existe» y los dos botones de elegir versión: hacen lo mismo.
- El aviso «N hitos que ya no aplican» de la ficha de un asunto: es otra cosa y no se toca.

## Cómo hacerlo (orientación; decide la sesión)

- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`,
  `docs/contexto/HITOS-Y-GUIAS.md`, `docs/contexto/ASUNTOS.md` y los ficheros de abajo.
- `js/conflictos.js` ya sabe unir solo varios ficheros; lo que llega a la tarjeta es lo que no pudo
  unir. La diferencia se calcula con lo que ya lee.

## Ficheros

- `js/parecido-de-carpetas.js`: nuevo. La función del apartado 3.
- `js/hitos-de-asuntos-perdidos.js`: nuevo. El cuadro «Son de este asunto…» y su «Deshacer».
- `js/asunto-renombrar.js`: solo lo que haga falta para pasar o unir hitos de un nombre viejo a un
  asunto, si `mover`/`fusionar` no bastan.
- `js/fichas-huerfanas.js`: el cuadro de «Buscar su carpeta».
- `js/conflictos.js` y, si pasa de 600 líneas, `js/conflictos-diferencias.js` (nuevo): «Qué cambia».
- `js/recurrentes.js`, `js/inicio.js`: los dos avisos del apartado 5.
- `js/borrados-fusion.js`: el apartado 6.
- `js/problemas.js` (o `js/problemas-textos.js`): los botones y textos nuevos de las tarjetas.
- `js/demo/datos.js`: que los datos de demostración den para los puntos de abajo (unos hitos con
  un nombre viejo cuyo asunto sigue abierto con otro nombre y el mismo número; dos carpetas sin
  asunto, una que encaja con el asunto perdido y otra que no; dos versiones de la lista de asuntos
  que se diferencian en dos asuntos).
- `pruebas/`: nuevas `parecido-de-carpetas.mjs` (los cinco criterios, el empate, sin candidatas),
  `hitos-vuelven-a-su-asunto.mjs` (pasar, unir, deshacer) y `conflictos-que-cambia.mjs`; se ponen
  al día `huerfanas.mjs`, `conflictos.mjs`, `recurrentes.mjs` y `problemas.mjs`.
- `js/novedades.js`: «En Ajustes → Problemas, los hitos de un asunto que cambió de nombre pueden
  volver a él, «Buscar su carpeta» propone la que más se parece, y al elegir entre dos versiones
  se ve en qué se diferencian.»
- Al terminar: `docs/CONTEXTO-CORTO.md`, `docs/contexto/HITOS-Y-GUIAS.md`,
  `docs/contexto/ASUNTOS.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que los hitos pueden volver a su asunto, que «Buscar su carpeta» propone, que al
elegir versión se ve la diferencia, y que los asuntos que se repiten ya preguntan antes de crearse.

## Cómo sabemos que está bien

En la copia de demostración, en Ajustes → «Problemas».

1. En la tarjeta de los hitos de asuntos que ya no existen, cada línea lleva «Son de este asunto…
   (lo normal)» y «Quitar».
2. Pulsar «Son de este asunto…» en los hitos cuyo asunto sigue abierto con otro nombre: el cuadro
   sale con ese asunto ya propuesto bajo «Parece este:», y dice cuántos hitos se van a mover.
3. Pulsar «Pasar los hitos»: sale el aviso verde con «Deshacer», la línea desaparece de la tarjeta,
   y al abrir ese asunto desde Inicio tiene sus hitos.
4. Pulsar «Deshacer»: la línea vuelve a la tarjeta y el asunto se queda sin esos hitos.
5. Repetir eligiendo un asunto que ya tiene hitos: el cuadro avisa de que se unen y el botón dice
   «Unir los hitos». Al aceptar, el asunto tiene los hitos de los dos, sin repetir los del mismo
   título.
6. En la tarjeta de los asuntos que han perdido su carpeta, pulsar «Buscar su carpeta»: sale una
   lista de carpetas, la primera marcada con «Parece esta:», y es la que encaja. La otra está
   debajo. Cada una dice cuántos documentos tiene.
7. En la tarjeta de lo guardado a la vez en dos ordenadores, la línea de la lista de asuntos enseña
   «Qué cambia», con la fecha y hora de cada versión y los dos asuntos que se diferencian, por su
   nombre.
8. En Inicio, pulsar «asuntos que se repiten toca crearlos»: se abre un cuadro con la lista y
   «Crear N asuntos» / «Cancelar». Pulsar «Cancelar»: no se ha creado ninguno.
9. En Inicio, pulsar «aspirantes sin Nº de identificación escolar»: encima de la lista sale la
   línea que dice qué hacer.
10. Abrir Herramientas → «Borrados que se fusionan»: la lista ya no sale vacía si hay algo
    recordado, y su texto no nombra ningún fichero.
11. **[SOLO FRANCISCO]** Con los datos del centro: si en «Problemas» hay hitos de asuntos que ya no
    existen, comprobar con uno que «Parece este:» propone el asunto correcto.
