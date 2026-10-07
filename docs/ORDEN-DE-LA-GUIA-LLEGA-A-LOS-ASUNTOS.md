# El orden nuevo de la guía llega a los asuntos abiertos (fila 300 de la cola)

Diseño cerrado con Francisco el 7-oct-2026, en Cowork. Sale de un aviso de usuario (Diego Herrera,
el compañero de Francisco, 7-oct-2026 12:02, versión 06-oct-2026 · 20:14, pantalla «Ficha de un
asunto»):

> Estoy intentando subir el Hito "Ajuste Planificación" al paso 2, uso la pantalla Cambiar la
> guía, guardo y no realiza la acción

## Qué pasó (compruébalo antes de tocar nada)

Lo más probable: la guía **sí** se guardó con el orden nuevo, pero el asunto que Diego tenía
abierto siguió igual. Es la regla de la fila 118 (`docs/GUIA-NUEVA-LLEGA-A-LOS-ASUNTOS.md`): los
hitos nuevos de una guía llegan a los asuntos abiertos, pero «nunca se reordena lo que ya existe,
aunque el paso se haya movido en la guía». Como entró a «Cambiar la guía» desde un asunto y al
volver lo vio igual, pensó que no se había guardado. El aviso verde tampoco decía nada del orden.

Esto no se ha reproducido: sale de leer `js/hitos-sincronizar.js`. Primer paso de la fila:
reprodúcelo en la copia de demostración (un asunto abierto con hitos, «Cambiar la guía», subir un
hito, Guardar, y mirar `guias.json` y los hitos del asunto). Si la causa es esta, sigue con lo de
abajo. **Si además la guía no guarda el orden, arregla también eso** y cuéntalo en
`docs/HISTORIA.md`.

## 1. Lo que ve el usuario

Decidido por Francisco: cuando se cambia el orden de los hitos en una guía, el orden nuevo llega
también a los asuntos abiertos de ese tipo, **solo para los hitos sin hacer**.

1. Al guardar «Cambiar la guía» con el orden de los hitos cambiado, cada asunto **abierto** de ese
   tipo que ya tiene hitos recoloca sus hitos **sin hacer** en el orden de la guía.
2. Los hitos **hechos** no se mueven.
3. Los hitos que son **solo de ese asunto** (no están en la guía) se quedan donde estaban. Igual
   los que vienen del tipo anterior (`delTipoAnterior`) y los de una rama no elegida (`noaplica`).
4. Los asuntos del **ARCHIVO** no cambian. Tampoco los que pasaron de tipo al unir dos tipos
   (`ficha.tipoUnidoDe`), como ya pasa con los hitos nuevos.
5. El **hito actual** de un asunto es su primer hito sin hacer. Si el hito que se ha subido queda
   por delante del que estaba en curso, pasa a ser el hito actual. Vale para todos los asuntos
   abiertos del tipo, también los del compañero, y puede mover un asunto entre «En Administración»
   y «En espera». Francisco lo sabe y lo quiere así.
6. El hito que deja de ser el actual vuelve a pendiente **sin perder nada** de lo apuntado: tareas
   marcadas, notas, documentos, campos y plazo se quedan en él.
7. Si quien guarda tiene un asunto de ese tipo a la vista (ficha o mesa de un hito), se repinta
   con el orden nuevo sin recargar. Inicio enseña el «Hito actual» nuevo.
8. El aviso verde lo dice. Con las palabras de `docs/VOCABULARIO.md`:
   - Solo orden: «Guía de X guardada: N hitos. El orden nuevo ha llegado a 3 asuntos abiertos.»
   - Orden e hitos nuevos: las dos frases, primero la de los hitos nuevos (la de hoy) y después
     la del orden.
   - Si el orden cambió pero ningún asunto abierto tenía hitos sin hacer que mover, el aviso de
     siempre, sin frase de orden.
   - Con 1 asunto: «…ha llegado a 1 asunto abierto.»

No cambia nada más de «Cambiar la guía». Guardar una guía **sin** cambiar el orden no recoloca
nada en ningún asunto.

## 2. Cómo hacerlo

### La regla exacta, nivel a nivel

Función pura nueva en `js/hitos-sincronizar.js`, junto a `pasosQueFaltan`, sin disco ni DOM:
`Hitos.ordenDeLaGuia(hitos, pasosAntes, pasosAhora)` → `{ hitos, movidos, actual }`.

- Se trabaja **por nivel**: el nivel superior, y dentro de cada opción de cada pregunta que exista
  en el asunto, a cualquier profundidad (misma forma de bajar que `completarNivel`).
- Un nivel solo se toca si **en esta guardada** ha cambiado el orden relativo de los pasos que
  están tanto en `pasosAntes` como en `pasosAhora` de ese nivel. Si no ha cambiado, ese nivel del
  asunto se deja como está. Así no se deshace un hito movido a mano «Solo en este asunto» cada vez
  que alguien cambia otra cosa de la guía.
- En un nivel que sí cambia: se cogen los hitos **movibles** = con `origenGuia` de un paso de ese
  nivel de `pasosAhora`, sin `delTipoAnterior`, y con estado `pendiente` o `encurso`. Esos hitos se
  reparten, en el orden de `pasosAhora`, **en los mismos huecos que ocupaban entre todos**. Todo lo
  demás (hechos, `noaplica`, solo de este asunto, del tipo anterior) no cambia de posición.
  Ejemplo: asunto A(hecho) B(en curso) C D; la guía pasa de A B C D a A D B C → queda A D B C.
- Un paso que ha cambiado de nivel en la guía (de fuera a dentro de una opción, o al revés) no se
  mueve en los asuntos: se queda donde está.
- `movidos` = cuántos hitos han cambiado de posición (0 = no se escribe nada por esto).

### El hito actual después de recolocar

Solo si `movidos > 0`:

- Si el primer hito visible sin hacer (`Hitos.visibles`) ya es el que está `encurso`, nada.
- Si no: el que estaba `encurso` pasa a `pendiente` (conservando todo lo suyo) y el primero sin
  hacer pasa a `encurso` con `desde` de hoy, igual que hace `Hitos.recomputeEnCurso`. Después,
  `Hitos.aplicarEstadoDelHito(clave, hito)` para el estado del asunto, como en `llevarAAbiertos`.
- **Excepción**: si el hito `encurso` tiene `cadena` (un «Hacer este hito» a medias, fila 285:
  `esperando-sello` o `listo-para-enviar`), sigue siendo el actual hasta que se termine. El orden de
  la lista sí cambia. Al darlo por hecho, el siguiente sale ya por el orden nuevo.
- Mira cómo deja hoy un hito de estar en curso el camino de «desmarcar» y haz lo mismo con sus
  campos (`desde`, y lo que haya); no inventes otra forma.

### Dónde se engancha

- `js/guias-enganche.js`, `escribirGuia`: antes de abrir el editor ya tiene los pasos de antes
  (`pasosDe(nombreTipo)`); guarda una copia y pásala a `llevarAAbiertos(nombreTipo, pasos,
  pasosAntes)`. **Solo este camino recoloca** (es el de «Cambiar la guía» desde Ajustes, desde la
  ficha y desde «···» de la mesa: los tres llaman a `GuiasDelCentro.escribir`).
- `guardarPasos` (unir tipos, cargar la biblioteca, plazos del centro, cambiar el nombre de un
  tipo, los cambios desde la mesa) **no pasa `pasosAntes` y no recoloca nada**. No lo cambies.
- `Hitos.llevarGuiaAAbiertos(tipo, pasos, pasosAntes)`: en la **misma** escritura de `hitos.json`
  (un solo `Hitos.cambiar`, por la cola de guardado), después de `completarEntrada`, aplica
  `ordenDeLaGuia` a cada entrada cuando llega `pasosAntes`. Devuelve los dos números (asuntos con
  hitos nuevos, asuntos recolocados). Mira quién usa hoy el número que devuelve y no rompas a
  ninguno (`guardarPasos` lo devuelve a `js/hitos-desde-el-asunto.js`).
- La red de seguridad al abrir la ficha (`Hitos.completarAsuntoConGuia`) **no recoloca nunca**:
  sin `pasosAntes` no se sabe si el orden cambió.
- Repintado: hoy `HitosPanel.programarRepintado()` solo se llama si llegaron hitos nuevos; que se
  llame también si se recolocó alguno. Comprueba que la mesa de un hito abierta se entera.
- Solo consultar y perfil directivo: no hay nada que hacer, «Cambiar la guía» ya está apagado
  para ellos. No es una escritura de fondo.

### Lo que no entra en esta fila

Mover un hito desde la mesa («Hito ▾» → «Cambiar» → «Colocar después de», guardado «A la guía»)
sigue con su regla de hoy: en los demás asuntos solo se mueve si el hito está vacío
(`propagarCambio`, `js/hitos-desde-el-asunto.js`, que ya pasa de 600 líneas y no se toca aquí). Es
una regla distinta de la de esta fila. Apúntalo en `docs/PENDIENTES-DE-DISENAR.md` en dos líneas,
para hablarlo con Francisco; no lo cambies.

## 3. Ficheros que se tocan

- `js/hitos-sincronizar.js` (la función pura, `llevarAAbiertos`, y el comentario de cabecera, que
  hoy dice «ni se reordena»)
- `js/guias-enganche.js` (`escribirGuia`, `llevarAAbiertos` y el texto del aviso)
- `js/novedades.js` (una línea: «Al cambiar el orden de los hitos de una guía, los asuntos abiertos
  de ese tipo recolocan sus hitos sin hacer. Los hechos no se mueven.»)
- `js/demo/datos.js` (solo si falta: un tipo con guía de cuatro hitos o más y dos asuntos abiertos
  de ese tipo, uno de ellos con el primer hito hecho)
- `pruebas/orden-de-la-guia-llega-a-los-asuntos.mjs` (nueva, mismo patrón con `vm` que
  `pruebas/guia-nueva-llega-a-los-asuntos.mjs`), y esa otra prueba solo si alguna comprobación suya
  deja de ser verdad
- `docs/GUIA-NUEVA-LLEGA-A-LOS-ASUNTOS.md` (sustituir la frase «Nunca se reordena lo que ya
  existe…» por una que remita a este documento), `docs/contexto/HITOS-Y-GUIAS.md`,
  `docs/CONTEXTO-CORTO.md` (sustituyendo «Los hitos nuevos de una guía llegan a los asuntos
  abiertos de su tipo.»), `docs/PENDIENTES-DE-DISENAR.md`, `docs/HISTORIA.md`

Cambios quirúrgicos: no se reescribe ningún módulo ni se lee el repositorio entero. Mientras se
trabaja, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs guia`, `orden`); la pasada
completa, una vez al final. Rama `fila-300`, revisor y publicación, como dice la cola.

## 4. Pruebas

En `pruebas/orden-de-la-guia-llega-a-los-asuntos.mjs`:

1. Guía A B C D → A D B C; asunto A(hecho) B(en curso) C D: queda A D B C, con D en curso, B
   pendiente y A sin tocar.
2. Lo apuntado en B (una tarea marcada, una nota, un documento) sigue en B después.
3. Un hito hecho en medio no se mueve: A(hecho) B C(hecho) D con la guía A D B C → A D C B.
4. Un hito solo de este asunto entre B y C sigue en su posición.
5. Guardar la guía cambiando solo un título (mismo orden): un asunto con un hito movido a mano no
   cambia, y no se escribe `hitos.json` por el orden.
6. Dentro de una opción de una pregunta: se recoloca solo ese nivel.
7. El hito en curso con `cadena`: la lista cambia de orden y el actual sigue siendo el mismo.
8. Paso nuevo y orden cambiado en la misma guardada: llega el hito nuevo y el orden, en **una**
   sola escritura de `hitos.json`; los dos números salen bien.
9. Asuntos del archivo, de otro tipo, sin hitos todavía y con `tipoUnidoDe`: no cambian.
10. Llamarla dos veces seguidas con los mismos datos: la segunda no mueve nada.
11. `guardarPasos` con una guía en otro orden no recoloca nada.

## Cómo sabemos que está bien

1. En la copia de demostración, abrir un asunto del tipo preparado que tenga el primer hito hecho.
   Apuntar el orden de sus hitos y cuál es el actual.
2. «Cambiar la guía», subir el último hito al segundo puesto y Guardar: el aviso verde dice «El
   orden nuevo ha llegado a N asuntos abiertos.»
3. Sin recargar, el asunto enseña ese hito en segundo lugar y como hito actual. El primero sigue
   hecho y en su sitio.
4. El hito que antes era el actual sigue en la lista, sin hacer, con lo que tuviera apuntado.
5. El otro asunto abierto del mismo tipo también tiene el orden nuevo.
6. En Inicio, la columna «Hito actual» de esos asuntos dice el hito nuevo.
7. Abrir «Cambiar la guía» y Guardar sin tocar nada: el aviso no habla del orden y los asuntos no
   cambian.
8. Un asunto abierto de otro tipo no ha cambiado.

En la copia de demostración (`?demo=1&auto=1`): el tipo preparado es **AJUSTE DE PLANIFICACION** (hitos:
Recoger la petición, Valorar el ajuste, Ajustar la planificación, Comunicar el ajuste). «Pozo Mena, Alba»
tiene el primero hecho y el segundo en curso; «Cano Lara, Sergio» está sin tocar. Se llega a «Cambiar la
guía» desde Ajustes → Guías, o desde la ficha de cualquiera de los dos.
