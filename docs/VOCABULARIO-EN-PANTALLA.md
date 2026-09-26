# Una sola palabra para cada cosa (fila 176)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Primera parte de la «tanda 2» del análisis
de usabilidad. **Va después de las filas 173, 174 y 175.**

El usuario se pierde porque la misma cosa se llama de tres o cuatro maneras según la pantalla
(paso, hito, guion, receta…). Se fija un vocabulario y se cambian **todos los textos visibles**
para que lo cumplan. El vocabulario está en `docs/VOCABULARIO.md`: léelo entero antes de empezar.

## Ficheros que se tocan

Solo textos visibles: `index.html` y los `js/` donde salen. Búscalos con `grep`, no leyendo
ficheros enteros. Estos son los que se han encontrado el 26-sep-2026 (puede haber más):

- Hito en vez de paso: `js/estado-hito.js`, `js/estado-migracion.js`, `js/hito-mesa.js`,
  `js/hitos-panel-lista.js`, `js/ficha-tarjetas-resumen.js`, `js/guias-vista.js`,
  `js/hitos-a-quien.js`, `js/guias-editor.js`, `js/guias-opciones-editor.js`,
  `js/guias-mapa.js`, `js/ajustes-tipo.js`, `js/ajustes-plegado.js`, `js/cuentas.js`,
  `js/que-me-toca.js`.
- Tareas en vez de guion y receta: `js/guias-guion.js`, `js/guias-paso-bloques.js`,
  `js/hito-mesa-guion.js`, `js/hito-mesa-tarjetas.js`, `js/hito-mesa-recetas.js`,
  `js/hito-mesa-comunicar.js`, `js/hito-mesa-documentos.js`, `index.html`.
- Hito de la biblioteca: `js/guias-biblioteca.js`, `js/hitos-biblioteca.js`,
  `js/cargar-biblioteca.js`.
- Impreso: `js/barra.js`, `js/formularios.js`, `js/formularios-ajustes.js`,
  `js/formularios-casillas.js`, `js/formularios-rellenar.js`, `js/ficha-bloques.js`,
  `js/ficha-asunto.js`, `js/ajustes-tipo.js`, `js/ajustes-centro.js`, `js/guias-paso-bloques.js`,
  `js/guias-vista.js`, `js/hito-mesa.js`, `index.html`.
- Guardar en el asunto: `js/documentos-sueltos.js`, `js/documentos-sueltos-lector.js`,
  `js/elegir-asunto.js`, `js/visor.js`, `js/hitos-anadir.js`, `js/bandeja-correos.js`,
  `js/bandeja-enlace.js`, `js/bandeja-pantalla.js`.
- Cambiar, quitar, borrar, cancelar: los que salgan con `grep` de «Editar», «Renombrar»,
  «Poner nombre», «Dejarlo», «Borrar» y «Quitar».
- Tercero y familia: `js/nombres.js`, `js/guias-guion.js`, `js/guias-toca.js`.
- Las pruebas de `pruebas/` que busquen los textos viejos: cambiarlas a los nuevos.

No leas el repositorio entero. Cambios quirúrgicos: solo la cadena de texto.

## Qué hay que hacer

1. **Recorrer la tabla de `docs/VOCABULARIO.md`** y cambiar cada texto visible que use una
   palabra de la columna «No usar». Ejemplos que tienen que quedar así:
   - «Paso 3 de 7 · título» → «Hito 3 de 7 · título»; «Paso actual» → «Hito actual»;
     «Saltar a este paso» → «Saltar a este hito».
   - En la guía (Ajustes): la sección «Pasos del trámite» → «Guía»; «Añadir un paso» → «Añadir
     un hito»; «Guion de este paso» → «Tareas de este hito»; «+ Añadir un paso al guion» →
     «+ Añadir una tarea»; la fila «Receta:» → «Detalles:».
   - En la mesa: «Qué hay que hacer» → «Tareas del hito»; «+ Añadir un paso solo para este
     asunto» → «+ Añadir una tarea solo para este asunto»; «✎ Cambiar el guion de este hito…» →
     «✎ Cambiar las tareas de este hito (para todos los asuntos de este tipo)»; «Pasos
     pendientes de comunicar / de generar» → «Tareas pendientes de comunicar / de generar»;
     «Paso: …» en el menú «Registrar» → «Tarea: …»; «+ Añadir un paso a la guía del tipo» →
     «+ Añadir un hito a la guía del tipo».
   - «Formularios» (pantalla, menú, línea de la ficha, sección del tipo) → «Impresos»;
     «Formularios oficiales de este tipo» → «Impresos de este tipo»; «Impresos oficiales»
     (Ajustes) → «Impresos»; «Buscar un formulario…» → «Buscar un impreso…».
   - «Meter en un asunto» → «Guardar en un asunto»; «Meter aquí» → «Guardar aquí»; «Elegir
     asunto» (bandeja) → «Guardar en un asunto»; «Meter el documento en un asunto» (título del
     cuadro) → «Guardar el documento en un asunto»; «Documento metido en X.» → «Documento
     guardado en X.».
   - «Editar el asunto» → «Cambiar el asunto»; «Poner nombre» y «Renombrar» → «Cambiar el
     nombre»; «Editar plantilla» → «Cambiar la plantilla»; los «Editar» de Ajustes → «Cambiar»;
     «Dejarlo» → «Cancelar».
   - «La familia (tutores legales)» → «La familia»; «Con quién es el asunto» → «Tercero».
2. **Borrar y quitar.** Revisa cada botón «Borrar» y «Quitar»: si lo que hace pasa por la
   papelera, se llama «Borrar» y su `title` dice «Va a la papelera»; si no pasa por la papelera,
   se llama «Quitar». Cambia los que no cumplan.
3. **Impresos «de la Junta» o «del centro».** Si el catálogo de impresos (`formularios/` y
   `js/formularios.js`) ya distingue quién hace el impreso, enseñar esa etiqueta en la lista. Si
   no lo distingue, no inventes el dato: déjalo apuntado en `docs/COLA.md`, en «Lo que queda por
   hablar con Francisco» (él quiere poder poner también impresos hechos por el centro).
4. **Lo que no se cambia**: los nombres de tipos de asunto y de documento que ha escrito el
   usuario, los textos de las plantillas, y los nombres de fichero y de carpeta.
5. **Una regla para el futuro.** En `docs/CONTEXTO-CORTO.md`, sección 2, una línea: «Textos de
   pantalla: siempre con las palabras de `docs/VOCABULARIO.md`».

## Prueba

Una prueba nueva en `pruebas/` que busque en `index.html` y en `js/*.js` las cadenas visibles
prohibidas más claras («Paso actual», «Qué hay que hacer», «Meter en un asunto», «Receta:»,
«Formularios oficiales», «Poner nombre», «Editar el asunto») y falle si aparece alguna fuera de
comentarios. Y `npm test` entero en verde, con las pruebas viejas ya puestas al día.

## Al terminar

Reglas de siempre de `docs/COLA.md`. En `docs/CONTEXTO-CORTO.md`, además de la línea del punto 5,
cambiar a las palabras nuevas lo que describa pantallas. Entrada en `docs/HISTORIA.md`.
