# Fila 352 — «Avisar al claustro» va al profesorado que está hoy en el centro

Idea 352 de Francisco, diseñada con él el 16-oct-2026. Una sola sesión de Claude Code.

## Qué pasa hoy

En una actividad extraescolar (tarjeta «La actividad» de un asunto de grupo con `ficha.actividad`),
el botón «Avisar al claustro» (`js/actividades-informe.js`, función `avisar`, fila 309) genera el
informe en PDF y abre el cuadro de Correo con un **grupo propio** puesto en Copia oculta. Ese grupo
se elige en Ajustes → El centro → «Aviso de actividades extraescolares» → «Grupo que lo recibe»
(`ajustesAvisos.grupoActividades`) o, si no hay ninguno elegido, el grupo que se llame
«Profesorado» o «Claustro» (`grupoDeAviso`). Ese grupo hay que mantenerlo a mano.

## Qué tiene que pasar

1. **Destinatarios.** El aviso va, en **Copia oculta** (nunca en «Para»), al **personal docente
   que está hoy en el centro**: de `Datos.cargar(App.E.datos, 'PERSONAL').lista`, las personas con
   `enElCentro: true` y `tipoPersonal === 'docente'` (regla de la fila 354, `js/datos-personal.js`).
   El personal no docente no recibe el aviso. Quien ya no está en el centro, tampoco.
   Quien no lleva `tipoPersonal` (altas a mano en `PERSONAL_MANUAL`, o un listado «RelPerCenTodo…»
   sin clase por fila) **se queda fuera** (decidido con Francisco: el profesorado llega del Centro
   de datos con su clase).
   El personal se pide siempre a `Datos` (regla de `docs/CONTEXTO-CORTO.md`, sección 6).
2. **Correo de cada docente:** el que trae su dato de personal (columna «Correo» del listado o
   `correo` de la parte del Centro de datos). Si una persona tiene más de uno, se usan todos, como ya
   hace Correo con los grupos (`combinarCorreosDeGrupo`).
3. **Cómo llegan al cuadro de Correo.** `avisar` deja de usar `extra.grupoInicial` y pasa la lista
   de personas en un dato nuevo de `extra` (por ejemplo `personasCopiaOculta`), que el cuadro añade
   a Copia oculta por el mismo camino que un grupo. **Docentes sin correo:** el correo se abre igual,
   con los que sí tienen; la línea que ya pinta el cuadro para quien no tiene correo
   (`js/correo-cuadro.js`, «N no tienen correo: …») sale **en ámbar** en este caso, con el texto
   «N docentes del centro no tienen correo: <Apellidos, Nombre>, <…>». No se añade otra línea
   aparte. Para los grupos normales esa línea se queda como está. Enviar no se impide.
4. **Sin ningún docente** (no ha llegado el listado del personal docente): aviso ámbar «No hay
   datos del profesorado del centro. Tráelos desde el Centro de datos.» con enlace a la sección de
   Ajustes «Traer el alumnado» (`App.irASeccionDeAjustes('#bloque-traer-alumnado')`). El
   cuadro se abre igual, con la Copia oculta vacía.
5. **Se quita el desplegable** «Grupo que lo recibe» de Ajustes → El centro → «Aviso de
   actividades extraescolares». Si esa sección se queda sin nada más, se quita entera, y su línea
   de `js/ajustes-reparto.js` (`bloque-aviso-actividades`) también. La clave
   `ajustesAvisos.grupoActividades` deja de leerse; no hace falta borrarla del fichero. Se quitan
   `grupoDeAviso`, `pintarAjustes` y el aviso «No hay ningún grupo con el profesorado…» de
   `js/actividades-informe.js`, y lo que los llame.
6. **Los grupos propios no se tocan.** El grupo «Profesorado» que Francisco creó sigue existiendo
   en Ajustes → Grupos de personas; solo deja de usarse para este aviso. El desplegable «Añadir un
   grupo» del cuadro de Correo sigue igual.
7. **«Volver a avisar»** (lista cambiada desde el aviso) funciona igual, con los mismos
   destinatarios nuevos.
8. **Demo** (el personal se escribe en `js/demo/datos.js`): que tenga al menos tres docentes en el
   centro con correo, uno en el centro sin correo, uno que ya se fue (fecha de cese pasada) y uno no
   docente con correo. Ojo: hoy Vidal Cano, Ramón (Ordenanza) va en «RelPerCen <curso>.csv» y
   cuenta como docente; hay que pasarlo a un «RelPerCenNodocente <curso>.csv». El grupo
   «Profesorado» de `js/demo/datos-actividades.js` se puede dejar: ya no influye.
9. `docs/TE-TOCA.md`: en el paso de la fila 309, añadir al final «(Desde la fila 352 el grupo ya no
   hace falta: el aviso va solo al profesorado del centro.)». Línea en `js/novedades.js`: «El aviso
   al claustro de una actividad va ahora solo al profesorado que está hoy en el centro, sacado del
   personal docente. Ya no hay que mantener un grupo.»

## Ejemplo con datos reales

**Bonilla Cascado, Manuel**, docente, ya no está en el centro este curso. En una actividad real,
al pulsar «Avisar al claustro», su correo **no** sale en la Copia oculta. [SOLO FRANCISCO]: este
punto solo se puede ver con los datos reales; copiarlo a `docs/COMPROBAR-A-MANO.md`.

## Cómo sabré que está bien

1. En Ajustes → El centro ya no sale el desplegable «Grupo que lo recibe».
2. Al pulsar «Avisar al claustro» en una actividad, el correo lleva en Copia oculta a los docentes
   que están hoy en el centro.
3. Un docente que ya se fue del centro no sale en esa Copia oculta (en la demo, el docente que ya
   se fue; con datos reales, Bonilla Cascado, Manuel — [SOLO FRANCISCO]).
4. El personal no docente tampoco sale.
5. Si a algún docente le falta el correo, sale un aviso ámbar con su nombre, y el correo se puede
   enviar igual.

## Pruebas

En `pruebas/actividades-aviso.mjs` se borra el bloque 7 (desplegable, `grupoDeAviso`, aviso «No hay
ningún grupo…») y se escriben comprobaciones nuevas de los puntos 2 a 5 con la demo. Pasar también `actividades` y `ajustes`.
