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

- (las apunta Claude Code)
