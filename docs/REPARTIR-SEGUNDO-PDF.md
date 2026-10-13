# Repartir entre terceros: el segundo PDF y el salto al siguiente trozo

Fila 339 de `docs/COLA.md`. Aviso del botón de soporte de Francisco (13-oct-2026, perfil
Administración, copia sin internet), diseñado con él ese mismo día.

## De dónde sale esto

Francisco repartía entre terceros (cuadro de trozos por páginas, fila 141, `js/repartir-pantalla.js`)
dos PDF de un mismo asunto. Encontró dos fallos:

1. Al elegir el alumno de un trozo, la lista vuelve arriba del todo. Tiene que bajar al siguiente
   trozo sin asignar.
2. En el segundo PDF del asunto, todos los trozos salen ya con alumno, los mismos que en el primero.
   Aunque los cambie por los buenos, al pulsar «Repartir» el resumen avisa de una docena de alumnos
   «se ha quedado sin trozo», que en realidad ya recibieron el suyo con el primer PDF.

Lo que pasa por dentro (comprobado en el código, para que no tengas que buscarlo):

- `asignar()` pone primero lo leído del trozo y, a los trozos que quedan, les da por orden los
  relacionados libres. En un segundo PDF eso reparte la misma lista otra vez, en el mismo orden.
- El aviso «se ha quedado sin trozo» (`sinTrozo`, en el resumen) mira solo los trozos de este PDF.
- El cuadro entero se repinta al elegir (`elegir` → `pintar`), y el repintado deja la lista arriba.

## Lo que se pide

### 1. Al elegir el alumno de un trozo, bajar al siguiente sin asignar

- Tras elegir (desplegable o «Buscar a otra persona del alumnado…»), la lista del cuadro se
  desplaza sola hasta el siguiente trozo, hacia abajo, que no tenga alumno, no esté «Hecho» y no
  sea «Se queda en este asunto». Ese trozo queda a la vista (arriba de la zona visible) y, si el
  visor grande de la derecha existe (fila 337), enseña sus páginas.
- Si por debajo no queda ninguno sin asignar, se busca desde arriba. Si no queda ninguno en todo el
  PDF, la lista baja hasta el final, donde está el botón para seguir al resumen.
- Elegir «Sin asignar» o tocar «+1 página»/«−1 página» no mueve la lista: se queda donde estaba
  (hoy salta arriba; eso también se arregla, conservando la posición del desplazamiento al repintar).
- En el cuadro de ficheros sueltos (`js/repartir-ficheros.js`, fila 337) ya se pasa al siguiente sin
  asignar en el visor; comprueba que la lista también baja igual. Si no, aplica lo mismo.

### 2. El segundo PDF empieza sin asignar y propone leyendo

- «Segundo PDF» = el asunto de origen ya tiene en su ficha, en `repartos`, algún reparto de **otro**
  documento (`RepartirCrear.repartoAnterior` mira solo el mismo nombre; aquí se mira el resto).
  Vale tanto para repartos de PDF por trozos como para repartos de ficheros sueltos (fila 337):
  lee las dos formas que guarda `js/repartir-crear.js`.
- En ese caso, `asignar()` **no** reparte por orden: cada trozo lleva el alumno que la app lee
  dentro (`N.leerTrozo`, como ahora, con sus marcas verde y ámbar) y, si no reconoce a nadie, queda
  «Sin asignar», en ámbar. Si el PDF es escaneado (sin texto), todos los trozos salen sin asignar y
  la frase «los trozos se han asignado por orden» no sale; en su lugar: «Este PDF es escaneado:
  elige el alumno de cada trozo.»
- El primer PDF de un asunto (sin otros repartos) sigue exactamente como hoy, con el relleno por
  orden.
- Volver a abrir el mismo PDF ya repartido sigue como hoy (lo hecho, «Hecho»; lo demás, se
  reintenta).

### 3. El aviso «se ha quedado sin trozo» cuenta los otros PDF

- En el resumen, un relacionado solo sale como «se ha quedado sin trozo» si no tiene trozo en este
  PDF **ni** lo recibió (trozo o fichero con `ok`) en otro reparto ya hecho del mismo asunto.
- El resto del resumen (trozos sin repartir, «ya tiene un asunto de…») no cambia.

## Qué ficheros tocar

- `js/repartir-pantalla.js`: `asignar`, el resumen (`sinTrozo`), el enganche del cambio de alumno y
  el repintado (conservar el desplazamiento y bajar al siguiente).
- `js/repartir-crear.js`: si hace falta, una función pequeña que diga qué terceros ya recibieron
  algo en otros repartos del asunto (por ejemplo `RepartirCrear.yaRecibidos(origen, nombrePdf)`).
- `js/repartir-ficheros.js`: solo si el punto 1 no se cumple ya allí.
- `js/novedades.js`: una línea (cambia lo que se ve).
- Ningún fichero de `js/` pasa de 600 líneas.

## Reglas de trabajo

- Las de `CLAUDE.md`: rama `fila-339`, revisor en local, fusión en `main` y una sola publicación a
  propósito.
- Cambios quirúrgicos: no reescribir ficheros enteros.
- No leas el repositorio entero: `docs/CONTEXTO.md`, el hijo de `docs/contexto/` que hable del
  reparto, `docs/REPARTIR-VARIOS-FICHEROS.md` y los ficheros de esta lista.
- Pruebas: mientras trabajas, `node pruebas/ejecutar.mjs repartir`; la pasada completa, una vez al final.

## La prueba

`pruebas/repartir-segundo-pdf.mjs`, con navegador y el disco de mentira:

- Un asunto con 4 relacionados y dos PDF con texto de 4 trozos de una página cada uno. El primero
  lleva el nombre de los 4 alumnos; el segundo, el de 3 alumnos (en otro orden) y una página sin
  nombre.
- Repartir el primero: como hoy.
- Abrir el reparto del segundo: los 3 trozos con nombre llevan su alumno, el cuarto «Sin asignar»;
  ninguno copia el orden del primero.
- Elegir alumno en el trozo 1 de una lista larga (usa un PDF de 12 trozos para esto): la lista del
  cuadro queda con el siguiente sin asignar a la vista, no arriba del todo.
- En el resumen del segundo, ningún alumno sale «se ha quedado sin trozo» (todos recibieron el suyo
  en el primero).
- Las pruebas `repartir-entre-terceros.mjs` y `repartir-ficheros.mjs` siguen pasando sin cambios.

## Para Francisco al terminar

Lo que va a ver: al repartir, la lista baja sola al siguiente trozo sin alumno; el segundo PDF de un
asunto ya no sale con el reparto del primero; y el resumen deja de avisar de alumnos que ya
recibieron su trozo en otro PDF. No hay nada que tenga que hacer él.

## Cómo sabemos que está bien

1. En la demo, en el cuadro de trozos de un PDF con muchos trozos, al elegir el alumno de un trozo
   la lista no vuelve arriba: queda a la vista el siguiente trozo sin alumno.
2. Al elegir el último que faltaba, la lista baja hasta el final, donde se sigue al resumen.
3. Tocar «+1 página» o «−1 página» deja la lista donde estaba.
4. En un asunto con un PDF ya repartido, el reparto de un segundo PDF sale con el alumno leído en
   cada trozo, y sin asignar (en ámbar) los que no se reconocen; no repite el reparto del primero.
5. En ese segundo PDF, el resumen no avisa «se ha quedado sin trozo» de los alumnos que recibieron
   su trozo en el primero; sí avisa de quien no tiene trozo en ninguno.
6. El primer PDF de un asunto sigue repartiendo por orden lo que no se lee, como antes.
7. Volver a abrir un PDF ya repartido sigue enseñando sus trozos «Hecho».
