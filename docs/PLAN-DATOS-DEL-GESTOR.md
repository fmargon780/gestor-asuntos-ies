# Plan «los datos del Gestor» (idea 332)

Diseñado con Francisco el 11-oct-2026. Es el documento común de las filas 332 y 334.
**Léelo antes de trabajar cualquiera de las dos: es corto.** No contiene ningún dato personal.

Sale del mismo análisis que se hizo ese día con BD Alumnado (su idea 106,
`docs/PLAN-DATOS-EN-EL-NAVEGADOR.md` de `fmargon780/bd-alumnado-ies`). Las cuatro preguntas eran las
mismas; las respuestas, no.

## 1. Las preguntas de Francisco, y lo que salió

1. **¿Dónde viven los datos y por qué?** En ficheros de la carpeta `_GESTOR`, dentro de la carpeta
   de asuntos vivos del Dropbox del centro. Sin servidor ni base de datos. Se decidió así porque
   los datos no salen del centro, funciona con la red del instituto bloqueada y la carpeta se puede
   abrir sin la aplicación (`docs/HISTORIA.md`, informe del 18-sep-2026).
2. **¿Qué lo hace lento o frágil, con medidas reales?** No se sabe: **el Gestor no mide nada.**
   Todo lo escrito sobre su velocidad (`claude/Analisis-estabilidad-crecimiento-2026-09-26.md` del
   proyecto de Claude) son cálculos, no medidas. BD Alumnado tenía un problema medido (abrir
   tardaba entre 65 y 90 segundos); aquí no hay ninguno medido.
3. **¿Algo que nos acerque a una base de datos profesional, sin saltarnos las normas?** Para
   guardar, no: un servidor y una base de datos dentro del navegador siguen descartados por los
   motivos de entonces. Para **relacionar y sacar estadísticas**, sí: la historia de un asunto
   archivado está guardada para leer ese asunto, no para cruzar muchos (apartado 4).
4. **¿Lo de Séneca llega todo del Centro de datos?** Sí desde la fila 312 (alumnado, personal,
   tutorías, Consejo Escolar y los dos listados del registro). El Gestor guarda copia en
   `_GESTOR/datos` y la subida a mano sigue como salida de emergencia, que es lo que Francisco
   decidió para el personal en la fila 327. **No se cambia nada.**

## 2. Lo que decidió Francisco (no se cambia)

1. **Primero se mide, después se decide.** El Gestor apunta solo cuánto tarda cada cosa. Tras una
   semana de uso real se mira si hay algo lento o frágil que arreglar. Hasta entonces no se toca
   cómo se guardan los asuntos.
2. **Las medidas le llegan a Claude solas, por el buzón de soporte.** Llevan solo tiempos, tamaños
   de fichero y cuántos asuntos hay. **Ningún nombre de persona, de asunto ni de documento.**
   Francisco no hace nada.
3. **Tablas para estadísticas y cruces.** Al archivar, el asunto queda apuntado además en unas
   tablas: asuntos, hitos, personas de cada asunto y documentos. **Cada persona lleva un código
   fijo.** Las carpetas se quedan como están; las tablas son un duplicado ordenado que se rehace
   desde las carpetas. Incluyen lo ya archivado. En pantalla no cambia nada todavía: son la base
   de los informes que pida después.
4. **La mudanza a Google no se diseña ahora.** Francisco quiere acabar con los asuntos vivos, el
   ARCHIVO y los datos del Gestor en una unidad compartida de Drive del centro, y dejar en Dropbox
   solo la Bandeja de Entrada, que es la única carpeta que usa el resto del centro. Depende de
   dirección y de quien gestiona esa unidad. Está en `docs/PENDIENTES-DE-DISENAR.md`, punto 6, con
   todo lo que se vio.

## 3. Lo decidido al diseñar

1. **Las medidas no se escriben en ninguna carpeta.** Viven en el `localStorage` de cada
   ordenador hasta que el buzón dice que las tiene. Así medir no añade ni una escritura a Dropbox,
   no choca con nadie y vale también en «solo consultar».
2. **Un rótulo de una medida nunca sale de un dato.** Sale de una lista fija escrita en el código
   («asuntos.json», «abrir un asunto»). Lo que no está en la lista se apunta como «otro». Es lo que
   garantiza que no viaje ningún nombre.
3. **Las tablas se escriben añadiendo líneas, un fichero por ordenador y mes.** Cada ordenador
   escribe solo los suyos: no puede haber copias en conflicto, ni en Dropbox ni el día de mañana
   en Drive. Nunca se reescribe un fichero grande al archivar.
4. **Una sola manera de apuntar en las tablas: «poner al día».** Compara lo archivado con lo
   apuntado y añade lo que falta, leyendo la carpeta de cada asunto. Sirve igual para el asunto
   que se acaba de archivar, para los miles de antes y para arreglar un fallo. Se puede repetir sin
   estropear nada.
5. **El código de una persona se calcula, no se reparte.** Sale de lo que la identifica (el Nº de
   identificación escolar, el NIF…), así que los dos ordenadores calculan el mismo sin ponerse de
   acuerdo.
6. **Señalar las carpetas por separado no entra en la cola.** Se propuso en la conversación como
   paso previo a la mudanza. Al escribir la instrucción se vio que, sin la mudanza, no sirve para
   nada, y que es peligroso: si un ordenador señala una carpeta de datos distinta y el otro no,
   cada uno trabaja sobre datos diferentes. Va con la mudanza, en el mismo punto 6.

## 4. Por qué hacen falta las tablas (lo que se vio el 11-oct-2026)

- La ficha de un asunto archivado baja a `_ficha.json` y sus hitos a «HISTORIAL DE TRAMITACION.txt»,
  dentro de su propia carpeta. Un fichero por asunto.
- El índice del ARCHIVO (`_GESTOR/indice-archivo/<curso>.json`) lleva una línea por asunto, pensada
  para buscar y pintar: tipo, tercero, fechas, quién lo pidió. **No lleva los hitos.** Saber qué
  hito retrasa más obligaría a abrir miles de carpetas.
- Las personas se enlazan por el texto de su nombre (`tercero`, `relacionados` por
  `categoria + nombre`). No hay ningún código de persona en todo el código.
- Los campos propios van al índice como texto corrido (`camposTexto`): un importe o una fecha de
  un asunto archivado no se puede sumar ni filtrar.

## 5. Reglas comunes a las dos filas

1. **El repositorio es público.** Ni un nombre real, ni un número de identificación real, en el
   código, las pruebas, los documentos, los commits ni la nota de la cola.
2. **El identificador del ordenador** es uno solo para las dos filas: seis caracteres `[a-z0-9]` al
   azar, en `localStorage`, clave `gestor-ordenador`. La fila que llegue primero crea
   `U.ordenador()` en `js/util.js`; la otra la usa. No es un nombre de persona ni de máquina.
3. **Nada de esto corre con un guardado en marcha** (`ColaGuardado.hayGuardado()`), y lo que
   escribe en carpetas no corre en «solo consultar» ni con perfil directivo.
4. **Un módulo nuevo no envuelve** si hay un punto previsto. Donde no lo haya, `U.envolver` y su
   línea en `js/envolturas-esperadas.js`.
5. **Ningún fichero de `js/` pasa de 600 líneas**; los nuevos, por debajo de 400.
6. `docs/CONTEXTO-CORTO.md` está hoy en 43.699 caracteres, por encima de su tope de 40.000. Al
   añadir tu línea, bájalo del tope pasando detalle a los hijos de `docs/contexto/`.

## 6. Las dos filas, y la del buzón

| Fila | Dónde | Qué hace | Documento |
|---|---|---|---|
| 332 | Gestor | El Gestor se mide solo y manda las cifras al buzón de soporte | `DATOS-1-MEDIDAS.md` |
| 334 | Gestor | Tablas para estadísticas y cruces, con código fijo por persona | `DATOS-2-TABLAS-PARA-INFORMES.md` |
| 6 | `fmargon780/soporte-apps` | El buzón recibe las medidas y las guarda en Drive | `docs/06-RECIBIR-MEDIDAS.md` de aquel repositorio |

La 332 no espera a la fila 6 del buzón: guarda hasta 30 días y los manda cuando el buzón los
acepte. La 334 no depende de ninguna.

## 7. Lo que queda fuera (a propósito)

- **Cambiar cómo se guardan los asuntos abiertos** (`asuntos.json`, `hitos.json`). Se decide con
  las medidas delante, no antes.
- **Una pantalla de estadísticas o exportar las tablas.** Llegará con el primer informe que
  Francisco pida.
- **Quitar la copia de los listados o la subida a mano.** Ver 1.4.
- **Un motor de base de datos dentro del navegador o un servidor.** Siguen descartados
  (`docs/HISTORIA.md`).

## 8. Dentro de una semana

Claude lee las medidas con el conector de Google Drive (carpeta `SOPORTE-AVISOS/_MEDIDAS`, fichero
«MEDIDAS gestor-asuntos-ies AAAA-MM.json») y vuelve a la conversación con Francisco: qué tarda,
qué falla, y si merece una fila.
