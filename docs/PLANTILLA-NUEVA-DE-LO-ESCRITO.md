# Guardar lo escrito como plantilla nueva, en el cuadro de Correo y en el de Séneca (fila 270)

Cerrado con Francisco el 6-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/1v3esLEkNWMlRXKpeOcqjdmdXWs81uZob/view?usp=drivesdk).

## Qué pidió

Desde la ficha de un asunto escribió: «Estudiar la posibilidad de que al escribir un mensaje en las
ventanas de correo o Séneca nos dé la opción de crear una plantilla nueva basándose en lo escrito y
con la posibilidad de editar y añadir campos. Ya existe la opción de editar una plantilla previa,
pero no la de crear una».

## Cómo está hoy (leído en el código el 6-oct-2026, antes de la fila 271)

- `bloqueCuerpo` de `js/correo-cuadro.js` y de `js/seneca-cuadro.js`: si el tipo tiene alguna
  plantilla en la lista, sale el desplegable «Plantilla» y un solo botón, que edita la plantilla
  elegida («Cambiar la plantilla» en Correo, «Editar plantilla» en Séneca). «Crear plantilla» solo
  sale cuando la lista está vacía, y abre el editor en blanco.
- Como «Aviso de avance» y «Aviso de cierre» valen para cualquier tipo, la lista casi nunca está
  vacía: en la práctica no hay forma de crear una plantilla desde el cuadro.
- El editor es `PlantillasAjustes.montarEditorEnLinea(contenedor, a, existente, alGuardar,
  alCancelar)` (`js/plantillas-ajustes.js`), dentro del propio cuadro. Guarda la plantilla para el
  tipo y la categoría del asunto abierto.
- El texto del cuadro es **saludo + medio + firma** (`cuerpoDelMedio`, `js/correo.js`). La
  plantilla guarda **solo el medio**: el saludo y la firma los pone la app sola en cada mensaje.
- La fila 271 (EN CURSO al escribir esto) toca estos mismos `bloqueCuerpo`. **Antes de empezar, lee
  cómo los ha dejado** y trabaja sobre eso.

## Qué hay que hacer

### 1. El botón

En los dos cuadros, junto al botón que edita la plantilla elegida, un botón nuevo:
**«Guardar como plantilla nueva»**. Está siempre que sale el desplegable, también con «Sin
plantilla» elegida y también cuando el cuadro se abre desde un hito con texto propio.

Cuando la lista está vacía y hoy sale «Crear plantilla», ese botón se queda con su nombre y pasa a
hacer lo mismo que el nuevo: abre el editor con lo que haya escrito (apartado 2). Con nada escrito
entre el saludo y la firma, el editor se abre en blanco, como hoy.

De paso, el botón de editar se llama igual en los dos cuadros: **«Cambiar la plantilla»** (hoy en
Séneca dice «Editar plantilla»).

### 2. Qué texto llega al editor

Al pulsar el botón se coge lo que hay en ese momento en el texto del mensaje (`#correo-cuerpo-texto`
o `#seneca-cuerpo-texto`), y se le hacen dos cosas, en este orden:

**a) Se quitan el saludo y la firma.** Si el texto empieza exactamente por el saludo que la app
puso, se quita; si termina exactamente por la firma que la app puso, se quita. Si la usuaria los ha
cambiado a mano y ya no coinciden, se dejan donde están: no se adivina. Para esto `js/correo.js`
expone en `window.CorreoNucleo` el saludo y la firma del asunto abierto (hoy solo existen dentro de
`cuerpoDelMedio`); no se copia la regla del saludo en otro fichero.

**b) Los datos de este asunto se cambian por su hueco.** Con los mismos valores que usa el cuadro
para rellenar (`valoresActuales` de `js/correo.js`, que ya llevan el hito; expónlos también en
`CorreoNucleo`), se busca cada valor en el texto y se sustituye por su hueco, escrito igual que lo
inserta el buscador de huecos (`js/huecos-buscador.js`, catálogo `Plantillas.HUECOS`).

Solo se cambian los datos que **cambian de un asunto a otro**:

- del tercero: `nombre`, `nombreNatural`, `referencia`, `dni`, `telefono`, `correo`;
- de sus tutores: `tutor1`, `tutor1telefono`, `tutor1correo`, `tutor2`, `tutor2telefono`,
  `tutor2correo`;
- del asunto: `grupo`, `curso`, `registro`, `limite`, `descripcion`, `departamento`,
  `organismooficial`, y los campos propios del asunto (`{campo:Nombre del campo}`);
- del hito: `{{HITO}}` y `{{PLAZO DEL HITO}}`;
- la fecha de hoy: `hoy` y `hoyLargo`.

**No** se cambian los datos que son siempre los mismos (centro, localidad, provincia, dirección,
código, cargo, quien firma, consejería), ni el tipo de asunto, ni el estado, ni `{{HITON}}` y
`{{HITOSM}}`.

Reglas de la búsqueda:

- Un valor vacío o de menos de 4 caracteres no se busca (da falsos aciertos: «Sí», «50», «2A»).
- Se busca la palabra o frase entera, no un trozo dentro de otra palabra, y sin distinguir
  mayúsculas de minúsculas.
- Primero los valores más largos, para que el nombre completo gane a una de sus partes.
- Si dos huecos tienen el mismo valor (el teléfono del tercero y el del primer tutor, o la fecha
  límite y la de hoy), gana el primero en el orden de la lista de arriba.
- Se cambian todas las veces que aparezca.

Es una función pura (texto + valores → texto nuevo + lista de cambios), con su prueba sin
navegador.

### 3. El editor, cuando viene de lo escrito

Es el editor en línea de siempre, con estas diferencias. `montarEditorEnLinea` recibe un parámetro
más, opcional (el texto de partida y la lista de cambios); sin él, se comporta como hoy.

- **Nombre de la plantilla**: vacío, con el foco puesto.
- **Texto**: el del apartado 2, ya sin saludo ni firma y con los huecos puestos. Se puede retocar,
  y «Insertar hueco» funciona como siempre.
- **Texto para Séneca (opcional)**: vacío y plegado, como en una plantilla nueva. Lo escrito va
  siempre a «Texto», se cree desde el cuadro de Correo o desde el de Séneca: así la plantilla vale
  para los dos.
- Debajo del texto, si se ha cambiado algún dato, el rótulo **«He cambiado estos datos por su
  hueco. Revísalos:»** y una línea por cada cambio, con el dato, una flecha, el hueco y un botón
  **«Deshacer»**. Ejemplo: `Prueba Inventada, Persona → {nombre}  [Deshacer]`.
  - «Deshacer» devuelve ese dato al texto, en todos los sitios donde se puso ese hueco, y quita la
    línea. Los demás cambios siguen.
  - Pulsar la línea (no el botón) deja seleccionado ese hueco dentro del texto, para verlo.
  - Si la usuaria borra a mano ese hueco del texto, su línea desaparece sola.
  - Si no se ha cambiado ningún dato, no sale ni el rótulo ni la lista.
- Una nota fija, en gris: **«El saludo y la firma no van en la plantilla: la app los pone sola en
  cada mensaje.»**
- **Vista previa**: como siempre, con los datos del asunto abierto. Recién abierto el editor, se
  lee igual que lo que la usuaria había escrito.
- **Guardar**: hace falta el nombre y el texto (aviso rojo de siempre). Además, si en ese tipo de
  asunto ya hay una plantilla con ese nombre (sin distinguir mayúsculas ni tildes), no guarda y
  avisa en rojo: **«Ya hay una plantilla con ese nombre en este tipo de asunto.»** Esta
  comprobación vale también al crear desde «Crear plantilla».
- Se guarda como cualquier plantilla nueva: para el tipo y la categoría del asunto abierto, en
  `_GESTOR/plantillas.json`, por `Plantillas.guardar`.

### 4. Al volver al cuadro

- **Guardar**: se vuelve al cuadro. La plantilla nueva sale en el desplegable y queda elegida. **El
  texto del mensaje no se toca**: sigue exactamente como lo dejó la usuaria, con su saludo y su
  firma, listo para enviar. No se pregunta «Lo que hay escrito en el texto se perderá» (hoy, al
  guardar desde el editor, se llama a `elegirPlantilla`, que sí lo pregunta: aquí no). «Para»,
  asunto, adjuntos y destinatarios tampoco cambian. Aviso verde: **«Plantilla guardada. Queda
  elegida en este cuadro.»**
- Si después la usuaria cambia de plantilla en el desplegable, la confirmación de siempre sigue
  funcionando igual.
- **Cancelar**: se vuelve al cuadro con todo como estaba, y no se crea nada.

### 5. No se engancha a ningún hito

La plantilla queda en el tipo de asunto. No se añade a ningún hito ni a ninguna tarea, aunque el
cuadro se haya abierto desde un hito. La próxima vez se elige en el desplegable. Engancharla a un
hito se hace como hoy, desde la guía.

## Qué NO se toca

- «Cambiar la plantilla» sobre la plantilla elegida: sigue editándola, como hoy (salvo el nombre
  del botón en Séneca).
- La regla de con qué plantilla se abre el cuadro (fila 271).
- Las plantillas de Ajustes y su cuadro «Nueva plantilla» / «Editar plantilla».
- El asunto del correo: no es parte de la plantilla.
- El modo «solo consultar»: el botón nuevo se porta igual que «Cambiar la plantilla».

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, el apartado «Plantillas de correo y de
  mensaje de Séneca» de `docs/contexto/CORREO-Y-SENECA.md` y los ficheros de la lista basta.
- **`js/correo-cuadro.js` tiene 600 líneas justas**, el tope: no puede ganar ni una. Lo nuevo va en
  un fichero propio (`js/plantilla-de-lo-escrito.js`). Para hacer sitio, saca a ese fichero lo que
  hoy está repetido casi igual en los dos cuadros: `abrirEditorPlantilla` y
  `cerrarEditorPlantilla`. Los dos cuadros pasan a llamar a una sola función compartida.
- Lo nuevo no envuelve nada: se le llama.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- Textos de pantalla: los de este documento, tal cual. Palabras de `docs/VOCABULARIO.md`
  («plantilla», «hueco»).
- Rama `fila-270`, revisor en local y, con su APROBADA, a `main`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs plantilla
  seneca-cuadro correos comunicar`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- `js/plantilla-de-lo-escrito.js` (nuevo): quitar saludo y firma, cambiar datos por huecos, la
  lista de cambios con «Deshacer», y abrir/cerrar el editor desde los dos cuadros. Añádelo a
  `index.html`, detrás de `js/plantillas-ajustes.js`.
- `js/correo.js`: `CorreoNucleo` expone el saludo, la firma y los valores del asunto abierto.
- `js/plantillas-ajustes.js`: `montarEditorEnLinea` con el parámetro opcional y la comprobación
  del nombre repetido.
- `js/correo-cuadro.js` y `js/seneca-cuadro.js`: el botón nuevo, su enganche, y lo que pasa al
  guardar (apartado 4).
- `css/`: solo si la lista de cambios necesita estilo propio; mejor con clases que ya existan.
- `pruebas/plantilla-de-lo-escrito.mjs` (nueva): la función pura y los puntos de abajo en
  navegador. `pruebas/plantilla-desde-el-cuadro.mjs` tiene que seguir pasando (cambia el nombre del
  botón en Séneca).
- `js/novedades.js`: «En el cuadro de Correo y en el de Séneca hay un botón nuevo, «Guardar como
  plantilla nueva»: convierte lo que has escrito en una plantilla, con los datos del asunto ya
  cambiados por su hueco.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (en la línea de «Plantillas de correo», sustituyendo, sin
  alargarla), `docs/contexto/CORREO-Y-SENECA.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en los dos cuadros hay un botón «Guardar como plantilla nueva», que el editor
se abre con lo escrito y los datos ya cambiados por su hueco, y que al guardar el mensaje sigue
como estaba.

## Cómo sabemos que está bien

Para todos los puntos: dos asuntos abiertos inventados del mismo tipo, que tiene una plantilla de
correo propia («Plantilla del tipo»). El primero, a nombre de «Prueba Inventada, Persona», con
grupo «2º ESO B» y fecha límite 20/10/2026. El segundo, a nombre de «Ejemplo Ficticio, Otra», con
grupo «1º BACH A» y fecha límite 05/11/2026.

1. Abrir el cuadro de Correo del primer asunto. Junto al desplegable «Plantilla» hay dos botones:
   «Cambiar la plantilla» y «Guardar como plantilla nueva».
2. Elegir «Sin plantilla» y escribir, entre el saludo y la firma: «Le informamos de que la
   solicitud de Persona Prueba Inventada, del grupo 2º ESO B, está lista. Puede recogerla hasta el
   20/10/2026.» Pulsar «Guardar como plantilla nueva». Se abre el editor dentro del mismo cuadro,
   con el nombre vacío.
3. En «Texto» no están ni el saludo ni la firma. En lugar del nombre, del grupo y de la fecha hay
   tres huecos.
4. Debajo sale «He cambiado estos datos por su hueco. Revísalos:» con tres líneas, cada una con su
   «Deshacer», y la nota de que el saludo y la firma los pone la app sola.
5. La vista previa dice lo mismo que se había escrito, con el nombre, el grupo y la fecha.
6. Pulsar «Deshacer» en la línea del grupo: «2º ESO B» vuelve al texto, su línea desaparece y las
   otras dos siguen.
7. Pulsar «Guardar» sin nombre: aviso rojo, no se guarda. Poner de nombre «Plantilla del tipo»:
   aviso rojo «Ya hay una plantilla con ese nombre en este tipo de asunto.», no se guarda.
8. Poner de nombre «Recogida» y pulsar «Guardar». Se vuelve al cuadro, el desplegable tiene
   «Recogida» elegida, y el texto del mensaje sigue exactamente como se dejó: el saludo, la frase
   escrita y la firma, una sola vez cada uno. Sale el aviso verde. No sale ninguna pregunta de «se
   perderá».
9. Abrir el cuadro de Correo del segundo asunto y elegir «Recogida». El texto lleva el nombre de
   «Otra Ejemplo Ficticio» y la fecha 05/11/2026; el grupo sigue siendo «2º ESO B» (se deshizo en
   el punto 6). El saludo y la firma salen una sola vez.
10. En el primer asunto, escribir otra frase, pulsar «Guardar como plantilla nueva» y después
    «Cancelar». Se vuelve al cuadro con la frase intacta y en el desplegable no hay ninguna
    plantilla más.
11. Repetir los puntos 1 a 8 en el cuadro de Séneca, con el nombre «Recogida Séneca». El botón de
    editar se llama «Cambiar la plantilla». Después, abrir el cuadro de Correo de ese asunto:
    «Recogida Séneca» está también en su desplegable.
12. Abrir un hito del primer asunto, pulsar «Comunicar ▾» → Correo, escribir una frase que
    contenga el título de ese hito y pulsar «Guardar como plantilla nueva». En «Texto», el título
    del hito está cambiado por su hueco.
13. Ir a Ajustes, al tipo de asunto, a sus plantillas de correo: «Recogida» está en la lista y se
    abre y se edita como cualquier otra.
14. Con una plantilla elegida, pulsar «Cambiar la plantilla»: se abre el editor con esa plantilla
    y su nombre, como antes.
