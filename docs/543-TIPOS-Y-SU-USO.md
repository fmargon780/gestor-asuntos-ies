# 543 — Tipos y su uso (limpieza antes de pasar las guías)

## Lo que escribió Francisco

Tema 540, «Pasar las guías a las listas comunes». En el diseño, el 6-nov-2026:

> Cuando empecé a diseñar te pedí que montaras las guías "Tipo" que podrían existir en nuestro ámbito administrativo y así lo hizo. Pero hacer esto fue un gran error, porque las guías creadas pensaba los procedimientos desde un punto de vista general, pero nosotros solo trabajamos un ámbito reducido, el del departamento de administración. No somos el director, ni la secretaria ni Jefatura, ni el inspector, ni dada de eso. Nos limitamos dentro de esos procedimiento a realizar una serie de tareas concretas. ¿Adónde quiero ir a parar? A que casi todas esas guías no nos están sirviendo para nada más que confundirnos. Algunas las hemos modificado, otras las estamos haciendo nuevas.
> ¿Qué recomiendo? Poder ver realmente esas guías. Las que no se haya usado nunca, junto con el tipo de asunto asociado, desactivarlas. Y hacer después nuestra tarea sobre las que queden, que sí se hayan usado en alguna ocasión.

> todo esto es una cuestión técnica para conseguir un desarrollo, no para tener una funcionalidad que después usemos . Esto es solo para el proceso de "limpieza"

## Lo que entendió Claude (acordado con Francisco el 6-nov-2026)

Primera de las tres partes del tema 540. Es una herramienta de un solo uso: se quita en la parte 3.

1. **Dónde:** bloque «Tipos y su uso» en Herramientas, junto a «Pasar las guías a las listas comunes».
2. **Tabla de todos los tipos:** nombre, categoría, asuntos abiertos, asuntos archivados, fecha del último uso («Nunca» si no tiene) y si está desactivado.
3. **Buscador y filtros:** Todos, Sin usar, Usados y Desactivados, con su número.
4. **Ver la guía:** al pulsar un tipo se ve su guía a la derecha: hitos, tareas y lo que hace cada tarea. «Abrir en el editor de la guía» lleva al editor de siempre, donde se quita lo que no es de Administración.
5. **Desactivar varios a la vez:** los tipos activos sin usar salen marcados de partida. Se desmarcan los que van a llegar. «Marcar los que se ven» y «Quitar todas las marcas». El botón dice cuántos desactiva.
6. **Antes de desactivar,** un cuadro con la lista: dejarán de salir al crear asuntos, sus guías y plantillas se conservan y se pueden volver a activar. Avisa de los asuntos abiertos que siguen igual y de los tipos que se repiten solos, que dejarán de crearse. Con eso basta: la app solo avisa (Francisco, 6-nov-2026: «Me parece bien»).
7. **Activar:** cada tipo desactivado tiene su «Activar» en la tabla.
8. **«Enviar las guías activas a Claude»:** un cuadro dice cuántas guías, hitos y tareas se envían y que no va ningún dato de asuntos ni de personas. Los desactivados no se envían. Al terminar: «Enviadas N guías a Claude. Dile en la conversación que ya están.» Se puede enviar más de una vez.

**Lo que desaparece o se sustituye:** nada. El Activar y el Desactivar de cada tipo en Ajustes siguen como hoy.

## Pantalla de prueba (aprobada el 6-nov-2026)

- `docs/pantallas/540.html` · https://claude.ai/artifact/8A7B6wiNdoMCr94cofDu5Y
- Sus tipos y guías son inventados.
- La marca «Guía sin pasar» y su aviso al activar no se programan aquí: dependen de la parte 3.

## Qué NO se hace en esta tarea

- Editar una guía en esta pantalla: se usa el editor de siempre.
- Unir tareas, aplicar nada a las listas comunes ni quitar las tareas libres, «+ Traer un hito de otro tipo» o «Nueva tarea…»: parte 3 (fila 545).
- Decidir qué se desactiva y limpiar las guías: lo hacen Francisco y Claude (fila 544).
- Qué pasa con la guía de un tipo que se active después de pasar las demás: se resuelve en la fila 545.

## Notas técnicas de Claude

- Fichero nuevo `js/tipos-y-su-uso.js` (como mucho 400 líneas), cargado en `index.html`. Bloque `bloque-tipos-uso` colgado como `js/comunes-propuesta.js`, y línea en `js/ajustes-reparto.js` con `donde: 'herramientas'`, junto a `bloque-comunes-propuesta`. Estilos con la regla común de cuadros (`.capa > .cuadro`, `U.preguntar`).
- Usos: partir de `App.usosDeTipos` (`js/tipos-buscador.js`), separando abiertos (`App.E.listaAbiertos`) de archivados (`App.E.registro.asuntos` que no estén abiertos). Último uso: la fecha más reciente del asunto; si el registro no la trae, los seis dígitos `AAMMDD` del principio del nombre de la carpeta.
- Desactivar en bloque: una función nueva en `js/tipos-desactivar.js` que marca `desactivado: true` en todos y guarda `tipos.json` una sola vez. El cuadro individual de `TiposDesactivar.desactivar` no se usa aquí. Avisos con `contarAbiertos` y `Recurrentes.contarDeTipo`.
- Guías: `GuiasDelCentro.recargar()` y `GuiasDelCentro.todas()`. Abrir el editor por el mismo camino que la pantalla del tipo.
- **Enviar sin tocar el buzón:** un `fetch` POST (`Content-Type: text/plain`) a `SoporteCargar.buzon`, con un aviso normal: `{ tipo: 'mejora', repo: 'fmargon780/gestor-asuntos-ies', app: 'Gestor de Asuntos', pantalla: 'Herramientas', quien, fecha, version, texto }`. `texto` es `GUIAS-PARA-CLAUDE` y, en la línea siguiente, el JSON con, por cada tipo activo: nombre, categoría, abiertos, archivados, último uso y su guía tal como está en `guias.json` (también preguntas y ramas). Comprobado en `apps-script/soporte.gs` de `fmargon780/soporte-apps`: admite hasta 6.000.000 de caracteres, guarda el texto entero en `SOPORTE-AVISOS`, que Claude lee con el conector de Google Drive, y en la cola apunta solo una fila «Aviso de usuario» con el enlace. Esa fila la cierra Claude. No se manda nada de `asuntos.json`, personas ni correos.
- La respuesta vale si trae `ok: true`. Si no, aviso rojo con su `motivo` (`U.fallo`).
- No se envía en la demostración ni bajo `navigator.webdriver` (mismo criterio que `MedidasEnviar.sePuedeEnviar`): ahí el botón dice lo que enviaría y no llama. Las pruebas comprueban el cuerpo con el `fetch` sustituido.
- Desactivar respeta «solo consultar», como todo lo que escribe; enviar no escribe y funciona también ahí. Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- El bloque sale en Herramientas, entrando directo, sin pasar antes por Ajustes.
- La tabla enseña todos los tipos, con abiertos, archivados y último uso; los filtros y el buscador funcionan y sus números cuadran.
- Pulsar un tipo enseña su guía, y «Abrir en el editor de la guía» abre el editor de siempre.
- Los tipos activos sin usar salen marcados; desmarcar, «Marcar los que se ven» y «Quitar todas las marcas» cambian el número del botón.
- Desactivar enseña la lista y sus avisos; al confirmar, esos tipos no salen en «Nuevo asunto», sus guías siguen en el disco y sus asuntos abiertos no cambian. `tipos.json` se escribe una sola vez.
- «Activar» lo devuelve a «Nuevo asunto».
- Enviar: el cuadro da las cifras de los activos; el cuerpo enviado no trae desactivados ni ningún dato de asuntos ni de personas.
- [SOLO FRANCISCO] El envío real llega al buzón y Claude lo lee.

## Revisión y respuestas durante el trabajo

### Segundo revisor, vuelta 1 (6-nov-2026)

Puntos de «Lo que entendió Claude»:
1. Dónde: NO COINCIDE. El bloque «Tipos y su uso» no existe al entrar directo en Herramientas (ni al volver a ella tras pasar por Inicio); solo aparece después de entrar una vez en Ajustes. Con eso hecho, sale en Herramientas, justo debajo de «Pasar las guías a las listas comunes».
2. Tabla: coincide en columnas y orden (Desactivar, Tipo, Categoría, Abiertos, Archivados, Último uso) con 540.html. Diferencias: la tabla es más estrecha y está en una caja con scroll propio (los últimos tipos quedan cortados), los nombres se parten en varias líneas, y categorías/nombres salen en MAYÚSCULAS (datos). En datos de prueba un tipo muestra último uso 20-nov-2026, futuro (ACTIVIDAD EXTRAESCOLAR).
3. Buscador y filtros: coincide. Todos (17), Sin usar (3), Usados (14), Desactivados (0); los números cuadran con las filas y se actualizan al desactivar; el buscador filtra («cert» da 4).
4. Ver la guía: coincide en lo esencial (clic en un tipo enseña hitos y tareas a la derecha y «Abrir en el editor de la guía»). No he abierto el editor. Diferencia con 540.html: el panel es estrecho y las tareas llevan la etiqueta «Otra cosa» en vez de «Añadir documento», «Firmar»… (datos de prueba).
5. Desactivar varios: coincide. Los 3 sin usar salen marcados; el botón dice «Desactivar 3 tipos»; «Marcar los que se ven» (con búsqueda suma solo los vistos, 3 pasa a 7), «Quitar todas las marcas» (botón pasa a «Desactivar» sin número), igual que 540.html.
6. Cuadro de confirmación: coincide (lista, texto de «se conservan y se pueden volver a activar», aviso «3 asuntos abiertos siguen igual.»). No he podido ver el aviso de «se repite solo» porque en los datos de prueba no hay tipo repetitivo. Tras confirmar, los tipos desaparecen de «Nuevo asunto» y los asuntos abiertos siguen en 34. Que el disco se escribe una sola vez y que las guías siguen en el disco: no lo he podido ver (disco de mentira).
7. Activar: coincide en el efecto (el tipo vuelve a «Nuevo asunto» y los contadores se actualizan). NO COINCIDE en lo visible: en la vista Desactivados, la columna con «Desactivado» y el botón «Activar» queda cortada a la derecha (se ve «Acti») y a 800 px también la columna «Último uso»; hay que desplazar la tabla de lado para llegar al botón.
8. Enviar: coincide. El cuadro dice «Se enviarán 14 guías, con 35 hitos y 37 tareas» (solo activos), el texto de «no va ningún dato de asuntos ni de personas» y «Los tipos desactivados no se envían»; mensaje final «Enviadas 14 guías a Claude. Dile en la conversación que ya están.» El cuerpo enviado (fetch sustituido) trae solo nombre, categoría, abiertos, archivados, último uso y guía de los 14 activos; ningún desactivado.

Puntos de «Cómo lo comprueba el segundo revisor»:
1. Sale en Herramientas sin pasar por Ajustes: NO COINCIDE (ver 1 arriba).
2. Tabla, filtros y números: coincide.
3. Pulsar un tipo enseña la guía: coincide; «Abrir en el editor de la guía»: no lo he podido ver (no abierto).
4. Marcas, «Marcar los que se ven», «Quitar todas las marcas» y número del botón: coincide.
5. Desactivar con lista y avisos; fuera de «Nuevo asunto»; abiertos sin cambio: coincide. Guías en disco y `tipos.json` escrito una sola vez: no lo he podido ver.
6. «Activar» lo devuelve a «Nuevo asunto»: coincide (con el defecto visual del botón cortado, ver 7).
7. Enviar: cifras y cuerpo: coincide.
8. [SOLO FRANCISCO] envío real al buzón: no lo he podido ver.

Otras diferencias con 540.html: el botón del cuadro de desactivar y su texto coinciden; la cabecera añade «Herramienta temporal de limpieza…» y el resumen «17 tipos · 14 activos · 0 sin usar» (en 540.html está sin la frase). A 800 px no hay desplazamiento horizontal de la página, pero sí dentro de la tabla. Nada más que el texto no pida.

### Segundo revisor, vuelta 2 (6-nov-2026)

Puntos de «Lo que entendió Claude»:
1. Dónde: coincide. Entrando directo en Herramientas, sin pasar por Ajustes, está el bloque «Tipos y su uso» (plegado; se abre con un clic).
2. Tabla: coincide en columnas y datos (17 tipos; abiertos, archivados, último uso o «Nunca»). Diferencias visibles con 540.html: la tabla está en una caja más estrecha y los nombres largos se parten; categorías/nombres en MAYÚSCULAS (datos de prueba); el panel derecho es más estrecho.
3. Buscador y filtros: coincide (Todos 17, Sin usar 3, Usados 14, Desactivados 0; tras desactivar 3, 17/0/14/3).
4. Ver la guía: NO COINCIDE en «Abrir en el editor de la guía». Se ve bien la guía al pulsar un tipo (hitos; en los datos de prueba 0 tareas, sin etiquetas de acción). Pero el botón abre el editor de un tipo vacío: arriba solo «OTROS», «Guía (0 hitos)», y en «Datos del tipo» el «Nombre» sale en blanco; no es el tipo pulsado. Pasos: Herramientas > Tipos y su uso (abrir) > pulsar «CERTIFICADO» (o cualquier fila) > «Abrir en el editor de la guía». Causa probable: `js/tipos-y-su-uso.js` línea 170 llama a `App.abrirTipoDeAsunto(st.sel)` con el nombre (texto), y esa función espera el objeto del tipo (como en `js/ajustes.js` 279/285).
5. Desactivar varios: coincide (3 marcados de partida, «Desactivar 3 tipos», «Marcar los que se ven», «Quitar todas las marcas»; en vuelta 1 se vio el número cambiar).
6. Cuadro de confirmación: coincide (lista de tipos, «Dejarán de salir al crear asuntos. Sus guías y plantillas se conservan, y se pueden volver a activar.», Cancelar/Desactivar). Avisos de abiertos/repetición no vistos en esta vuelta (los 3 tipos sin usar no tienen asuntos abiertos ni repetición).
7. Activar: NO COINCIDE en lo visible. En la vista «Desactivados» el botón «Activar» sigue cortado a 1300 px (botón termina en x=1000 y la caja de la tabla en x=904; tabla 713 px dentro de 609 px) y a 800 px (se corta ya la columna «Último uso» y «Activar» queda fuera, hay que desplazar la tabla de lado). El efecto sí funciona (pulsado a la fuerza, Desactivados pasa de 3 a 2). Pasos: desactivar los 3 marcados, pulsar «Desactivados (3)».
8. Enviar: coincide. Cuadro «Se enviarán 15 guías, con 36 hitos y 42 tareas» (14 activos + 1 reactivado; los desactivados no cuentan), texto de «no va ningún dato de asuntos ni de personas» y «Los tipos desactivados no se envían»; un solo POST (fetch sustituido) y mensaje «Enviadas 15 guías a Claude. Dile en la conversación que ya están.» No he vuelto a leer el cuerpo enviado en esta vuelta (vuelta 1 sí).

Puntos de «Cómo lo comprueba el segundo revisor»:
1. Sale en Herramientas sin pasar por Ajustes: coincide.
2. Tabla, filtros y números: coincide.
3. Pulsar un tipo enseña su guía: coincide. «Abrir en el editor de la guía» abre el editor de siempre pero de un tipo en blanco, no el del tipo pulsado: NO COINCIDE (ver 4).
4. Marcas y número del botón: coincide.
5. Desactivar con lista y avisos: coincide en la lista. Fuera de «Nuevo asunto», abiertos sin cambio, `tipos.json` escrito una sola vez, guías en disco: no lo he podido ver con certeza (disco de mentira; en «Nuevo asunto» no localicé con fiabilidad el tipo antes de desactivar).
6. «Activar» lo devuelve a «Nuevo asunto»: coincide el efecto (contadores correctos); defecto visual del botón cortado, ver 7.
7. Enviar, cifras y cuerpo: cifras coinciden; cuerpo no releído en esta vuelta.
8. [SOLO FRANCISCO] envío real al buzón: no lo he podido ver.

Otras diferencias con 540.html: cabecera con «Herramienta temporal de limpieza…» y resumen «17 tipos · 14 activos · 0 sin usar»; en la vista Desactivados aparece una frase suelta «3 tipos desactivados.» que 540.html no tiene; el botón «Desactivar» queda gris sin marcas, coherente.
