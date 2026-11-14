# 651 — Acciones que faltan en «Qué se hace»

Primera de las cuatro partes del tema 650 («Crear tareas e hitos con fluidez»). Las otras tres (repaso de la lista común, crear tareas e hitos con fases, bandeja) van detrás, cada una con su instrucción. De dónde se parte: `docs/notas-diseno/650.md`.

## Lo que escribió Francisco

14-nov-2026, durante el diseño del tema 650:

> También sería interesante analizar si nos falta algún tipo de acción que se pueda necesitar asociar a las tareas.

> Me pregunto si no existen otros métodos para esto que no se basen exclusivamente en el nombre si no en la funcionalidad, acciones, objetivos????

Eligió que las acciones nuevas entren en el tema como primera parte (opción 1) y que, de momento, solo clasifiquen (opción 3: «Empezar por la 1 y dejar los comportamientos propios como ideas aparte, una por acción»).

## Lo que entendió Claude (acordado con Francisco el 14-nov-2026)

- A la lista «Qué se hace» de una tarea se añaden cinco acciones: «En Séneca», «Entregar o recoger en mano», «Publicar», «Cobrar o pagar» y «Comprobar».
- Van al final de la lista, detrás de «Llamar por teléfono», en ese orden.
- «Sin acción (se marca a mano)» pasa a llamarse «Otra cosa» y se queda en su sitio.
- Las cinco se marcan a mano, igual que «Otra cosa»: no llevan botón, no piden nada y no hacen nada solas. Solo dicen de qué clase es la tarea.
- La tarea enseña el nombre de su acción en la etiqueta que ya lleva junto al nombre (como hoy «Añadir documento» o «Generar documento»).
- Salen en todos los sitios donde hoy se elige «Qué se hace»: «+ Añadir tarea» del asunto, «Cambiar» de una tarea, la guía del tipo y la ventana de la lista común de tareas (en su columna de clases, cada una con su cuenta).
- Las tareas que ya existen no cambian: las que no tienen acción siguen como «Otra cosa» hasta el repaso de la lista común (segunda parte del tema).
- No desaparece nada.

## Pantalla de prueba

- No se pidió: solo cambian las opciones de una lista y un texto.

## Qué NO se hace en esta tarea

- Que cada acción nueva haga algo propio. Son ideas aparte: «En Séneca» (652), «Entregar o recoger en mano» (653), «Publicar» (654), «Cobrar o pagar» (655) y «Comprobar» (656).
- Poner acción a las tareas que hoy no la tienen, unir repetidos o poner fase a los hitos: es la segunda parte del tema 650.
- Ordenar la lista «Qué se hace» o ponerle buscador: tema 643.

## Notas técnicas de Claude

- La lista está dos veces: `HACE` en `js/comunes.js` y la del formulario en `js/guias-guion.js` (ahí está el texto «Sin acción (se marca a mano)»). Valores nuevos: `seneca`, `entregar`, `publicar`, `cobrar`, `comprobar`. `Comunes.accionValida` tiene que darlos por buenos.
- Repasar dónde se decide el botón de la tarea y si se marca sola (`js/hito-mesa-guion.js`, `js/hitos-guion.js`, `js/hito-mesa-recetas.js`): las cinco se tratan como la acción vacía. Ningún sitio debe caerse ni pintar un botón con un valor que no conoce.
- Las guías y los asuntos guardados con esos valores tienen que leerse igual en la copia sin internet y en el otro ordenador con una versión anterior: comprobar que una versión que no conoce el valor lo trata como «Otra cosa» y no lo borra al guardar.
- Repasar los textos que nombran «Sin acción» (`js/ayudas-rotulos.js`, `js/ayudas-textos.js`, `docs/VOCABULARIO.md`).
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- En un asunto, «+ Añadir tarea»: la lista «Qué se hace» trae «Otra cosa» donde estaba «Sin acción (se marca a mano)» y, al final, «En Séneca», «Entregar o recoger en mano», «Publicar», «Cobrar o pagar» y «Comprobar», en ese orden.
- Añadir una tarea con cada una de las cinco: queda en la lista con su etiqueta, sin botón, y se marca y desmarca a mano.
- «Cambiar» de una tarea y la guía del tipo ofrecen las mismas opciones.
- La ventana de la lista común de tareas enseña las cinco clases nuevas en su columna, con su cuenta.
- Una tarea que ya existía sin acción se sigue viendo y marcando igual, y su «Cambiar» dice «Otra cosa».
- En ninguna pantalla queda el texto «Sin acción (se marca a mano)».

## Qué mirar al terminar

- En un asunto cualquiera, «+ Añadir tarea»: abre «Qué se hace» y mira las cinco nuevas al final y «Otra cosa» en lugar de «Sin acción».
- Añade una tarea «En Séneca» y márcala: mira su etiqueta.

## Revisión y respuestas durante el trabajo

- (14-nov-2026, segundo revisor, en local con datos de demo) 1. coincide: «Otra cosa» donde estaba «Sin acción» y las cinco al final en orden. 2. coincide: las cinco quedan con su etiqueta, sin botón, y se marcan a mano (marcada y desmarcada a mano solo «En Séneca»; las otras cuatro, sin marcar una a una). 3. coincide: «Cambiar» y el editor de la guía ofrecen las mismas opciones. 4. coincide: la lista común enseña las cinco con su cuenta (a 0 en la demo; al crear una «Publicar» pasó a 1). 5. coincide: una tarea antigua sin acción se ve y se marca igual y su «Cambiar» dice «Otra cosa». 6. coincide: no queda «Sin acción (se marca a mano)» en ninguna pantalla. Sin errores de consola.
- No lo ha podido ver: «+ Añadir tarea» en un hito con guía real de un asunto abierto; un guardado real en el editor de la guía; guardar un «Cambiar» a una acción nueva; cuentas distintas de 0 o 1 en la lista común.
- De más (no pedido, coherente): la lista común también cuenta «Otra cosa»; el formulario «Tarea nueva» de esa ventana ofrece las cinco. «Copiar a otra carpeta» no sale en «+ Añadir tarea» del asunto (ya era así).
- Aviso de compatibilidad: una versión anterior de la app que lea una guía con una de las cinco acciones la trata como «Otra cosa» y, si guarda, la pierde. Se resuelve recargando con la versión nueva en todos los ordenadores.
