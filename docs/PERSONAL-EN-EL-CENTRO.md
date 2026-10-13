# El personal que sí está en el centro sale como «Ya no está en el centro»

Fila 340 de `docs/COLA.md`. Diseñada con Francisco el 13-oct-2026, a partir de un aviso del botón
de soporte.

## De dónde sale esto

Aviso del 13-oct-2026 11:37, pantalla «Nuevo asunto», copia sin internet, perfil Administración,
versión 13-oct-2026 · 11:40. Texto del usuario:

> Estamos intentando crear asunto con el personal del centro (No docente) con el Docente no hemos
> probado aún y nos dice que no estamos en el centro este curso. Sin embargo en el listado de
> personal o no tenemos fecha de cese puesto o lo tiene para una fecha futura, no hoy ni anterior.

Aviso completo y captura en Drive (misma carpeta):
https://drive.google.com/file/d/1MXR-kTV-v8OvLl32BSZ3A2UgsFZ7lPq7/view ·
https://drive.google.com/file/d/1Vqh0CgmZjhZ24AJdI6mG7tB3fZGHkuSb/view

Lo que se ve: en el buscador de «Nuevo asunto», personas del personal no docente que siguen en el
centro salen en ámbar con «Ya no está en el centro» (`App.piePersona`, `App.claseDeResultado`).

## Lo decidido con Francisco

1. **Es un fallo y se arregla para todo el personal**, docente y no docente.
2. **Regla**: está en el centro quien sale en los datos de personal de este curso y no tiene
   fecha de cese, o la tiene **hoy o más adelante**. El día del cese todavía cuenta como en el
   centro; deja de estarlo desde el día siguiente. (`U.yaPaso` ya compara así: comprobarlo, no
   cambiarlo.)
3. **Quien de verdad ya se fue: solo aviso, nunca bloqueo.** Sigue saliendo en ámbar con «Ya no
   está en el centro», y se le puede crear el asunto igual (certificados de servicios y similares).
   Si en algún sitio hoy se bloquea o se pregunta «¿Seguro?», se quita.
4. **La ficha de la persona dice por qué la app cree que se fue**: «cesó el …» o «no sale en los
   datos de personal de este curso (su último curso aquí: …)». Hoy `App.piePersona` lo dice solo
   en parte; que se vea igual en la ficha (`js/ficha-persona.js`, cabecera) y en el buscador.

## Dónde mirar (hipótesis, sin datos reales delante)

La regla vive en `js/datos-personal.js`, `cargarPersonal`:
`r.enElCentro = r.esteCurso && !U.yaPaso(r.fechaCese)`, con `esteCurso` = la persona sale en algún
fichero o parte del **curso más alto de todos**. Como el cese está vacío o en el futuro, lo que
falla casi seguro es `esteCurso`. Candidatos, por orden de sospecha:

1. **La parte del Centro de datos tapa el CSV del mismo curso** (filas 327/328): si existe
   `PERSONAL-HECHO …json` del curso 26-27 y gana a lo subido a mano, todos los `RelPerCen*` de ese
   curso se descartan. Si esa parte solo trae a una clase de personal (por ejemplo, solo docentes),
   los no docentes quedan solo en cursos viejos y salen como «ya no está». Comprobar qué trae
   `DatosPersonalHecho.filasDe` y si `tipoPersonal` distingue docente y no docente. Si la parte
   no cubre una clase de personal, el CSV de esa clase y ese curso no debe descartarse.
2. **Un fichero con un curso equivocado en el nombre** (o una parte con `curso` mal puesto) que
   sube `cursoMasAlto` por encima de 26-27: entonces nadie sale como «este curso» salvo los de ese
   fichero. `cursoEnElNombre` / `cursoDelFichero` con nombres como `RelPerCenNodocente 2627.csv`,
   `RelPerCen.csv` sin año y los de la carpeta de la copia sin internet.
3. **La fecha de cese con otro formato** (AAAA-MM-DD, con hora, o con texto) que `U.aFecha` lee
   mal. Menos probable: el aviso dice «no está en el centro este curso», y eso apunta a `esteCurso`.

Si `cursoMasAlto` se calcula por separado para docentes y no docentes porque vienen de ficheros
distintos, el criterio bueno es: **está este curso quien sale en el dato más reciente de su clase de
personal** (docente / no docente), no en el más reciente de todos.

Lo que se encuentre, con el porqué, a `docs/HISTORIA.md`; y la regla, en una línea, a
`docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo) y al hijo de `docs/contexto/` que toque.

## Qué ficheros tocar

- `js/datos-personal.js` (la regla; arreglar la causa que sea).
- `js/asuntos-nuevo.js` (`App.piePersona`, `App.claseDeResultado`) y `js/asuntos-nuevo-campos.js`
  (línea con `!p.enElCentro`): que solo avisen.
- `js/ficha-persona.js`: el porqué en la cabecera.
- `js/novedades.js`: una línea (cambia lo que se ve).
- Prueba nueva en `pruebas/`.

## Reglas de trabajo

Las de siempre de la cola (`CLAUDE.md`, `docs/COLA.md`): rama `fila-340`, revisor en local,
pasada completa al final, una publicación a propósito tras fusionar en `main`, ningún fichero de
`js/` por encima de 600 líneas, el personal siempre por `Datos.cargarPersonal`.

## La prueba

`pruebas/personal-en-el-centro.mjs`, con datos inventados:

- Una parte del Centro de datos del curso 26-27 y un `RelPerCenNodocente 2627.csv` del mismo curso:
  docentes y no docentes sin cese salen «en el centro».
- Cese ayer: «Ya no está en el centro (cesó el …)». Cese hoy y cese el mes que viene: en el centro.
- Alguien que solo sale en un fichero de 25-26: «Ya no está en el centro (su último curso aquí:
  25-26)».
- Un fichero sin año en el nombre no sube el curso por encima del de hoy.
- A una persona que ya se fue se le puede crear un asunto sin ninguna pregunta de más.

## Para Francisco al terminar

Lo que va a ver: el personal que sigue en el centro deja de salir en ámbar. Quien de verdad se fue
sigue en ámbar, con el motivo, y se le puede crear el asunto igual. No tiene que hacer nada; si
algún nombre sigue saliendo mal, que lo avise por el botón de soporte con el nombre.

## Cómo sabemos que está bien

1. Con las pruebas de arriba en verde y la pasada completa en verde.
2. En la demo, en «Nuevo asunto», el personal docente y el no docente sin cese salen sin ámbar.
3. Una persona con cese hoy sale sin ámbar; con cese ayer, en ámbar con «cesó el …».
4. Una persona solo de cursos viejos sale en ámbar con «su último curso aquí: …».
5. A una persona en ámbar se le puede crear el asunto sin bloqueo ni pregunta.
6. La ficha de esa persona dice el mismo motivo que el buscador.
7. La causa encontrada está escrita en `docs/HISTORIA.md`.
