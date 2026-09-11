# Que no se dupliquen los asuntos

Instrucción para Claude Code. Escrita el 11 de septiembre de 2026.
Lee antes `docs/CONTEXTO.md`.

## Lo que ha pasado

Francisco creó dos veces el mismo asunto, el mismo día y del mismo alumno:

    260904 TRANSPORTE 26-27 1ºD State, Ricardo Catalán 7731644
    260904 TRANSPORTE 26-27 State, Ricardo Catalán 7731644

La diferencia es solo el grupo. Las dos carpetas existen y las dos están abiertas.

`js/duplicados.js` **sí lo detectó**: compara tercero y tipo, no el nombre de la carpeta.
El problema es que el aviso es una franja ámbar encima de la vista previa, fácil de pasar por
alto, y no ofrece nada que hacer. Palabras del propio fichero: *"Es solo un aviso: nunca impide
crear nada"*.

Así que aquí no se cambia la detección por otra: **se le sube el volumen y se le da una salida**.

## 1. El aviso pasa a ser un cuadro de confirmación

Cuando se pulsa el botón de crear el asunto en la pantalla de Nuevo asunto, y antes de crear
ninguna carpeta, se comprueba si ya hay uno igual. Si lo hay, **se para y sale un cuadro**.

Qué se considera "uno igual":

- Mismo **tercero** y mismo **tipo** — lo que `Duplicados.delTercero` y `Duplicados.delTipo`
  ya hacen hoy. No cambies ese criterio.
- Y además el mismo **año académico**. Saca el curso de cada carpeta candidata con
  `Nombres.leer(nombre, App.E.tipos)` y compáralo con el que se ha elegido, normalizado con
  `U.normalizar`. **Si a alguno de los dos le falta el curso, cuenta como coincidencia**: más
  vale preguntar de más.
- **El grupo y el texto libre no se miran nunca.** Son justo lo que hizo que estas dos carpetas
  parecieran distintas a simple vista.
- Se miran los abiertos y el ARCHIVO de ese tercero, como ahora.

El cuadro, con `U.preguntar` (recuerda: solo hay un `#capa`, ver `docs/CONTEXTO.md`):

- Título: **Este asunto ya existe**.
- Debajo, el nombre entero de la carpeta que ya existe, y si está en el ARCHIVO, dilo.
  Si hay varias, se listan todas.
- Botón principal, el destacado: **Abrir el que ya existe**. Si el asunto está abierto, cierra
  el cuadro y lleva a su ficha (la misma navegación que al pulsar su nombre en la lista). Si
  está archivado, lleva a su carpeta en el ARCHIVO.
- Botón secundario, discreto: **Crear otro de todas formas**. Sigue adelante y crea la carpeta
  como hasta ahora.
- Botón **Cancelar**.

Con varios candidatos, "Abrir el que ya existe" abre el que se haya elegido de la lista; de
partida, el abierto más reciente.

La franja ámbar de antes **se queda donde está**: sigue avisando mientras se rellena el
formulario. Lo nuevo es la parada al crear.

## 2. Unir dos asuntos duplicados que ya existen

En la pantalla de asuntos abiertos, cuando dos o más asuntos de la lista coincidan en tercero,
tipo y año académico, sale encima de ellos una franja: **Parecen el mismo asunto**, con los
nombres y un botón **Unir**.

Al pulsar Unir:

1. Un cuadro pregunta **cuál se queda**. De partida, el de nombre más largo, que suele ser el
   más completo. Francisco puede elegir el otro.
2. Los ficheros del que se va pasan al que se queda, con `Carpetas.moverFichero`.
3. Las notas del que se va se añaden a la ficha del que se queda, en su orden, conservando
   `quien` y `cuando`. Los campos de correo (`correo`, `enlace`, `enlaceTexto`) viajan con la
   nota. Igual con `pasosHechos` y `pasosElegidos`: si el que se queda no tiene ninguno, se
   copian los del otro.
4. La ficha del que se va se borra de `_GESTOR/asuntos.json`, **releyendo el fichero justo
   antes de escribirlo**, como todo lo compartido.
5. La carpeta vacía se borra con `removeEntry`.
6. Se apunta una nota en el que se queda: *"Unido con la carpeta «…» el dd/mm/aaaa"*.

**Si en las dos carpetas hay un fichero con el mismo nombre, no se sobrescribe nada.** Se para
todo antes de mover ni un fichero, se dice cuáles chocan y se deja que Francisco los renombre
desde "Gestionar documentos". Nada a medias: o se puede unir entero, o no se une.

## Cómo hacerlo

- Todo lo nuevo va en `js/duplicados.js`, menos la franja de la lista, que va en un fichero
  nuevo `js/unir-asuntos.js` cargado **después** de `js/asuntos-lista.js`. Acuérdate de su
  línea en `index.html` y de su fila en la tabla de ficheros de `docs/CONTEXTO.md`.
- Antes de colgar cualquier función de `App`, comprueba con un `grep` por `js/` que ese nombre
  no está cogido. Pasó con `App.elegirTipo`.
- La franja va **encima de la lista**, no dentro de una tarjeta: la lista blanca
  `BOTONES_DE_LA_TARJETA` de `js/ficha-asunto.js` no deja meter botones en las tarjetas.
- Estilos en `css/duplicados.css` si hace falta uno nuevo.
- Prueba en `pruebas/duplicados.mjs`: el caso real de arriba (las dos carpetas de State, Ricardo
  Catalán) tiene que dar coincidencia, y dos MATRICULA del mismo alumno de cursos distintos
  **no**. Prueba también la unión con nombres de fichero que chocan. Comprueba que la prueba
  falla sin el arreglo antes de darla por buena.
- Sube `App.VERSION` con la hora de España.
- Apunta las dos cosas en `docs/CONTEXTO.md`, en la sección 5.

## Lo que Francisco verá

Al crear un asunto que ya existe, la aplicación se para y le ofrece abrir el que ya tiene.
Y en su lista de asuntos abiertos verá hoy mismo la franja para unir los dos de TRANSPORTE.
