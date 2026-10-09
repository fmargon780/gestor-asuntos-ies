# La fecha que no dejaba escribir el año (fila 314)

Cerrado con Francisco el 9-oct-2026. Sale de la idea 314, apuntada por él desde el Centro de
mando. Sigue a `docs/CONTROL-DEL-REGISTRO.md` (fila 259).

## Qué pidió

> Es imposible poner el año en este campo de fechas

Adjuntó un recorte de Herramientas → «Control del registro»: el campo «Revisar desde el día» con
`01/01/0020`, y al lado «Entrada: sin subir todavía».

## Qué pasa hoy

En `pintar` de `js/control-registro-pantalla.js`, el campo `#cr-desde` guarda con `onchange`. En
Chrome, un campo de fecha lanza `change` en cuanto la fecha es válida, y lo es con la primera cifra
del año (año 0002). La aplicación guarda esa fecha (`cambiarDesde` → `ControlRegistro.ponerDesde`)
y vuelve a dibujar la pantalla entera (`recargar`). El campo se dibuja de nuevo, pierde el foco y
no se puede seguir escribiendo. Así quedó guardado el año 0020.

Hay un daño añadido: adelantar la fecha quita los apuntes anteriores **sin preguntar**. Cada
cifra tecleada es una fecha distinta que se guarda.

## Qué quiere Francisco (decidido por él el 9-oct-2026)

1. «Revisar desde el día» se guarda **al salir del campo o al pulsar Intro**. Mientras se escribe
   no se guarda nada ni se vuelve a dibujar nada.
2. Solo se acepta un año **de 2000 en adelante**. Si no, aviso en ámbar y la fecha se queda como
   estaba.
3. La fecha `01/01/0020` que quedó guardada cuenta como **sin fecha puesta**.
4. Si adelantar la fecha va a quitar apuntes, la aplicación **pregunta antes**: «Se van a quitar N
   apuntes anteriores al día X», con «Quitar» y «Cancelar». Con «Cancelar», la fecha se queda como
   estaba y no se quita nada.
5. Se repasan los demás campos de fecha de la aplicación y se arreglan igual los que guarden
   mientras se escribe.

Decidido por Claude en el diseño:

- El tope de arriba es el año 2099 (así el campo no deja escribir un año de cinco cifras).
- Elegir el día con el ratón en el calendario del campo guarda en el momento: ahí no se está
  escribiendo. Si no se consigue distinguirlo de forma fiable del teclado, se guarda solo al salir
  o con Intro, que es lo que Francisco pidió.
- Si la fecha no ha cambiado, no se guarda ni se dibuja nada.
- En los cargos (ver el punto 4 de abajo) el año mínimo es 1950, no 2000: alguien puede ocupar un
  cargo desde antes de 2000.

## Qué hay que hacer

### 1. Una sola función para «he terminado de escribir la fecha»

En `js/util-pantalla.js` (250 líneas), una función nueva, `U.alTerminarFecha(campo, alTerminar,
opciones)`. Antes de colgarla de `U`, mira que el nombre esté libre.

- `opciones.minimo` (por defecto `'2000-01-01'`), `opciones.maximo` (por defecto `'2099-12-31'`),
  `opciones.vacioVale` (por defecto `false`).
- Pone en el campo los atributos `min` y `max`.
- Recuerda el valor que tiene el campo al engancharse (el «valor guardado»).
- **No guarda con `change` mientras se teclea.** Termina cuando:
  - el campo pierde el foco (`blur`), o
  - se pulsa Intro dentro del campo, o
  - llega un `change` sin que se haya pulsado ninguna tecla en el campo desde que cogió el foco
    (día elegido con el ratón en el calendario).
- Al terminar:
  - Si el valor es igual al guardado, no hace nada.
  - Si está vacío y `vacioVale` es falso, devuelve el campo al valor guardado y no hace nada más.
  - Si la fecha no es válida o cae fuera de `minimo`–`maximo`: devuelve el campo al valor
    guardado y avisa en ámbar: «El año tiene que estar entre 2000 y 2099. La fecha se queda como
    estaba.» (con los años de `minimo` y `maximo`).
  - Si vale, llama a `alTerminar(valor)`. Si `alTerminar` devuelve `false` (o una promesa que da
    `false`), devuelve el campo al valor guardado. Si no, el valor nuevo pasa a ser el guardado.
- Nunca termina dos veces por la misma escritura (Intro seguido de `blur`).
- No toca los demás tipos de campo.

### 2. «Revisar desde el día»

En `js/control-registro-pantalla.js` (386 líneas):

- `#cr-desde` deja de usar `onchange` y se engancha con `U.alTerminarFecha`.
- `cambiarDesde(valor)`:
  1. Pide a `ControlRegistro.cuantosQuitaria(valor)` cuántos apuntes se quitarían.
  2. Si son más de cero, pregunta con `U.preguntar`: título «Revisar desde el día…», texto «Se van
     a quitar N apuntes anteriores al día DD/MM/AAAA.» (en singular, «Se va a quitar 1 apunte
     anterior al día…») y debajo «Lo que ya decidiste sobre ellos no se pierde. Para volver a
     verlos hay que atrasar la fecha y subir otra vez los listados de Séneca.». Botones «Quitar» y
     «Cancelar».
  3. Con «Cancelar»: no se guarda nada, el campo vuelve a la fecha que tenía y no se dibuja nada
     más.
  4. Con «Quitar», o si no había nada que quitar: se guarda como hoy. Se quedan el aviso verde
     «Se han quitado N apuntes anteriores a esa fecha.» y el ámbar «Vuelve a subir los listados
     para revisar esos días.» al atrasarla.
- El cuadro de la primera vez (`#cr-desde-propuesta`, en `subirFicheros`) ya tiene botón y no
  guarda al escribir. Solo se le añaden `min` y `max`, y si la fecha cae fuera, el aviso ámbar de
  arriba y no se sube.

En `js/control-registro.js` (458 líneas):

- Función nueva `desdeValida(iso)`: cierta solo si es `AAAA-MM-DD`, fecha real, entre 2000-01-01 y
  2099-12-31.
- Al leer `control-registro.json` (donde hoy se completan `decisiones` y `clasesSinAsunto`), un
  `desde` que no pase `desdeValida` se lee como `''`. Solo en memoria: no se escribe nada por
  ello (regla de `SoloConsulta` y de no escribir de fondo). Tiene que valer también para
  `leerControlDisco`, que es de donde `ponerDesde` saca la fecha de antes.
- `ponerDesde(iso)`: si `iso` no pasa `desdeValida`, no guarda y lanza un error con ese motivo.
  Quita los apuntes anteriores a `iso` **siempre que los haya**, no solo cuando la fecha de antes
  era anterior (con la fecha de antes leída como vacía, hoy no quitaría nada).
- Función nueva `cuantosQuitaria(iso)`: cuenta los apuntes guardados con fecha anterior a `iso`,
  sin escribir nada. Sale en lo que exporta `ControlRegistro`.
- Las decisiones (`control.decisiones`) siguen sin tocarse al quitar apuntes. Compruébalo: la
  frase «Lo que ya decidiste sobre ellos no se pierde» tiene que ser verdad. Si no lo fuera, haz
  que lo sea.

### 3. El repaso de los demás campos de fecha

La regla: un campo de fecha que **guarda o vuelve a dibujar la pantalla con `change`**, sin un
botón de por medio, se engancha con `U.alTerminarFecha`. Un campo dentro de un cuadro con su botón
(«Guardar», «Aceptar») no se toca.

Los campos de fecha que hay hoy (`type="date"`), para mirarlos uno a uno:

- `js/cargos.js`, `desde` y `hasta` de cada ocupante (unas líneas antes de `guardarCambio`):
  **guardan con `onchange`. Se arreglan** (punto 4).
- `js/tablon-compacto.js` (`#tablon-para`): solo guarda un borrador en una variable. No se toca.
- `js/campos-clases.js` (campo propio de clase Fecha) y `js/documentos-campos.js`: mira desde dónde
  se pintan y si alguno de esos sitios guarda al cambiar. Si guarda, se arregla.
- `js/lo-pide.js` (`.lopide-fecha`), `js/asuntos-lista.js` (`#plazo-fecha`), `js/asuntos-editar.js`
  (`#ed-fecha`), `js/hito-mesa.js` (`#mesa-fecha-nueva`), `js/documentos-formulario.js`
  (`#doc-fecha`), `js/encargos-nuevo.js` (`#encargo-para`), `js/por-liquidar-liquidar.js`
  (`#liq-fecha`), `js/pdf-separar-unir.js` (`#pdf-nombre-fecha`) y los dos cuadros de
  `js/cargos.js` (`#cargo-nueva-desde`, `#cargo-fecha-cese`): parecen ir con botón. Compruébalo;
  si es así, no se tocan.

Busca también campos de fecha creados de otra forma (`.type = 'date'`). Deja escrito en la nota de
la fila, en una línea, cuáles has arreglado.

### 4. Los cargos

En `js/cargos.js` (413 líneas), en la fila de cada ocupante:

- `desde` y `hasta` dejan `onchange` y se enganchan con `U.alTerminarFecha`, con
  `minimo: '1950-01-01'`. `hasta` lleva `vacioVale: true` (vacío quiere decir que sigue en el
  cargo). `desde` vacío: mira qué hace hoy `Cargos.editarOcupante` y respétalo.
- `nombre` y `sexo` se quedan como están.

## Lo que no cambia

- Qué hace la fecha «Revisar desde el día»: lo anterior no se mira ni avisa.
- La subida de listados, las pestañas, las decisiones y los avisos de Inicio.
- Los campos de fecha que van dentro de un cuadro con botón.
- El aspecto de los campos de fecha.

## Cómo hacerlo (orientación; decide la sesión)

- Sigue `CLAUDE.md`: rama `fila-314`, revisor en local y, con su aprobación, a `main`.
- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`,
  `docs/CONTROL-DEL-REGISTRO.md` y los ficheros de abajo.
- Ningún fichero de los que se tocan pasa de 600 líneas ni va a pasar.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Mientras programas, solo las pruebas de lo tocado (`npm test -- fecha control-registro cargos`).
  La pasada completa, una sola vez, al final.

## Ficheros

- `js/util-pantalla.js`: `U.alTerminarFecha`.
- `js/control-registro-pantalla.js`: el enganche de `#cr-desde`, `cambiarDesde` con la pregunta, y
  `min`/`max` en `#cr-desde-propuesta`.
- `js/control-registro.js`: `desdeValida`, la lectura del `desde` disparatado como vacío,
  `ponerDesde` y `cuantosQuitaria`.
- `js/cargos.js`: `desde` y `hasta` de cada ocupante.
- Los que salgan del repaso del punto 3, solo si guardan al cambiar.
- `pruebas/fecha-al-terminar.mjs`: nueva, con Chromium real y la demostración, **tecleando** en el
  campo (cifra a cifra, no poniendo el valor de golpe). Comprueba:
  1. En «Control del registro», con la fecha vacía, se teclea `01092026` seguido: el campo sigue
     siendo el mismo elemento y conserva el foco hasta el final, queda `2026-09-01`, y
     `control.desde` no cambia hasta salir del campo (o Intro). Al salir, vale `2026-09-01`.
  2. Con Intro en vez de salir, lo mismo, y se guarda una sola vez.
  3. Teclear una fecha del año 0020 y salir: aviso ámbar, el campo vuelve a la fecha de antes y
     `control.desde` no cambia.
  4. Con `control-registro.json` trayendo `desde: '0020-01-01'`: la pantalla sale sin fecha, con
     el aviso «Pon la fecha «Revisar desde el día…»», y en Inicio no hay avisos del registro.
  5. Con los dos listados de `pruebas/` subidos, adelantar la fecha: sale la pregunta con el
     número de apuntes; con «Cancelar», mismos apuntes y misma fecha; con «Quitar», se quitan y la
     fecha cambia. Una decisión «No necesita asunto» tomada antes sigue en `control.decisiones`.
  6. Atrasar la fecha no pregunta nada y deja el aviso ámbar de volver a subir.
  7. Dejar la fecha igual y salir del campo: no se guarda ni se dibuja nada.
  8. En Ajustes → El centro, cargos: teclear el año entero en «desde» de un ocupante sin que el
     campo pierda el foco; se guarda al salir. «hasta» vacío se guarda como vacío.
- `pruebas/control-registro.mjs`: el apartado 6 («adelantar y atrasar la fecha») sigue en verde;
  añade `cuantosQuitaria` y que `ponerDesde('0020-01-01')` no guarda.
- `pruebas/cargos.mjs`: sigue en verde.
- `js/novedades.js`: «En «Control del registro», la fecha «Revisar desde el día» ya deja escribir
  el año: se guarda al salir del campo o al pulsar Intro, y pregunta antes de quitar apuntes.»
- Al terminar: `docs/CONTROL-DEL-REGISTRO.md` (cómo se guarda la fecha y la pregunta),
  `docs/CONTEXTO.md` o el hijo de `docs/contexto/` que toque (`U.alTerminarFecha` y la regla del
  punto 3), `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (la prueba nueva) y `docs/HISTORIA.md`. En
  `docs/CONTEXTO-CORTO.md`, sección 6, una línea: «Un campo de fecha que guarda sin botón se
  engancha con `U.alTerminarFecha`, nunca con `change` (fila 314).»

## Qué dirá Claude Code a Francisco al terminar

En tres frases: que «Revisar desde el día» ya deja escribir el año y se guarda al salir del campo
o con Intro; que antes de quitar apuntes pregunta; y qué otros campos de fecha tenían el mismo
fallo y están arreglados.

## Cómo sabemos que está bien

En la copia de demostración. Para los puntos 5 a 8 hacen falta apuntes: se suben
`pruebas/control-registro-entrada.csv` y `pruebas/control-registro-salida.csv`. Las fechas se
escriben **con el teclado, cifra a cifra**.

1. Herramientas → «Control del registro». En «Revisar desde el día», escribir `01/09/2026` entero
   sin que el campo se salga solo ni se borre nada a mitad. Mientras se escribe, la pantalla no
   parpadea ni cambia.
2. Pulsar fuera del campo: la fecha se queda en 01/09/2026 y desaparece el aviso «Pon la fecha…».
3. Recargar la página y volver a la pantalla: la fecha sigue siendo 01/09/2026.
4. Cambiar el año a 0020 y pulsar Intro: sale un aviso ámbar que dice que el año tiene que estar
   entre 2000 y 2099, y el campo vuelve a 01/09/2026.
5. «Subir listados de Séneca» con los dos ficheros: salen apuntes en las pestañas «Entrada» y
   «Salida». Marcar con «No necesita asunto» uno del 29 o del 30 de septiembre.
6. Cambiar la fecha a 01/10/2026 y pulsar Intro: sale un cuadro que dice cuántos apuntes se van a
   quitar y hasta qué día, con los botones «Quitar» y «Cancelar».
7. «Cancelar»: la fecha vuelve a 01/09/2026 y los apuntes siguen todos ahí.
8. Repetir el cambio y pulsar «Quitar»: la fecha queda en 01/10/2026, los apuntes de septiembre
   desaparecen, los de octubre siguen, y sale el aviso verde con cuántos se han quitado.
9. Cambiar la fecha a 01/09/2026: no pregunta nada y sale el aviso ámbar «Vuelve a subir los
   listados para revisar esos días.». Subirlos otra vez: el apunte del punto 5 sigue en «No
   necesitan asunto».
10. Elegir un día con el ratón en el calendario del campo: la fecha se guarda (o, si no, se guarda
    al pulsar fuera). En ningún caso se pierde.
11. Ajustes → El centro, cargos: en la fecha «desde» de una persona, escribir una fecha entera con
    su año sin que el campo se salga solo. Al pulsar fuera, queda guardada; al recargar, sigue.
12. [SOLO FRANCISCO] En el centro, abrir «Control del registro»: la fecha sale vacía (ya no
    01/01/0020), se pone la buena y se suben los listados.
