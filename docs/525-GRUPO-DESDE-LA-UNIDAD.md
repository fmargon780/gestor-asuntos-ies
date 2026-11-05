# 525 — El campo Grupo sale vacío en los asuntos nuevos de alumnado

## Lo que escribió Diego Herrera (aviso del botón de soporte, 5-nov-2026 12:58)

Pantalla: Ficha de un asunto · copia sin internet · perfil Administración · versión 30-oct-2026 · 10:52.

> Cuando inserto hueco en la plantilla del correo, no muestra el grupo de la unidad donde está matriculado

Captura: asunto 261027 A26-0510 ANULACIÓN MATRÍCULA de Ivanyi, Borka; plantilla «Comunicación baja
matrícula»; aviso «Faltan datos: Grupo»; el texto acaba en «…en el grupo», sin nada detrás; la
cabecera de la ficha sí enseña la unidad 1º ESO B.
Aviso completo: https://drive.google.com/file/d/1C7VPRUWSgEQr_jVoHnvaW6UysyT7btQJ/view?usp=drivesdk

## Lo que entendió Claude (acordado con Francisco el 5-nov-2026)

- El campo Grupo de una plantilla de correo o de documento se rellena con la unidad del alumno cuando
  el asunto no trae grupo propio.
- Orden: primero el grupo del asunto (ficha o nombre de la carpeta), como hoy. Si no hay, la unidad
  de este curso del alumno. Si ya no está matriculado, su última unidad.
- Asuntos de grupo, terceros que no son alumnado y alumnos que no se encuentran: como hoy (vacío y
  aviso «Faltan datos: Grupo»).
- No se toca ninguna plantilla. Vale para todas las que usan Grupo.
- Se pone **la última de la cola**, detrás de las filas 528 a 531 (decisión de Francisco).

## Pantalla de prueba

- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea

- No se guarda el grupo en la ficha al crear el asunto ni se vuelve a poner en el nombre de la carpeta.
- No se cambia la plantilla «Comunicación baja matrícula».
- No se toca la lista de campos ni la ventana de elegir campo (filas 528 a 531).

## Notas técnicas de Claude

- Causa: `js/plantillas-valores.js`, `valoresDeAsunto`, toma `grupo: p.grupo` de `piezasDelNombreDe`,
  que solo mira `ficha.grupo` y el nombre. Desde las filas 239 y 251 los asuntos nuevos no traen ni
  uno ni otro. El grupo se queda vacío aunque `persona` esté cargada.
- Arreglo: `grupo: p.grupo || unidadDeLaPersona`, con `persona.unidad || persona.unidadUltima`, solo
  si `categoria` es ALUMNADO. `persona` ya es `null` en un asunto de grupo. `unidadUltima` ya existe
  en `js/datos-alumnado.js`. `ficha.grupo` puede ser un objeto en un asunto de grupo: `piezasDelNombreDe`
  ya lo descarta.
- Correo y documentos usan `valoresDeAsunto`: un solo cambio vale para los dos.
- Limitación aceptada: un asunto de un curso pasado sin grupo guardado toma la unidad de hoy, si se
  vuelve a generar el documento.
- Añadir su línea a `js/novedades.js` y una prueba en lo que ya prueba `valoresDeAsunto`.

## Cómo lo comprueba el segundo revisor

- Asunto de alumnado creado nuevo (sin grupo en ficha ni nombre), alumno matriculado: correo con una
  plantilla que use Grupo: sale su unidad y no sale «Faltan datos: Grupo».
- Lo mismo al generar un documento Word con una plantilla que use Grupo.
- Alumno no matriculado con unidad anterior: sale su última unidad.
- Asunto antiguo con grupo propio distinto de la unidad: sale el del asunto.
- Asunto de grupo y asunto de personal o empresa: sale el aviso de hoy, sin ninguna unidad inventada.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
