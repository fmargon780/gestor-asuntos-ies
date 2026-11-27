# 787 — El botón «Pasar los tipos al molde nuevo»

**Título llano:** Pasar de una vez los tipos de asunto al molde nuevo
**Para qué:** que los asuntos nuevos de casi todos los tipos nazcan ya como lista de tareas, con su guía escrita desde lo que Administración hace de verdad, sin pasarlos uno a uno a mano.

## Lo que escribió Francisco
27-nov-2026: «Ahora mismo tenemos muchos tipos de asunto. Muchos no se han usado nunca y tienen una
estructura de hitos y tareas que se diseñó al principio desde un enfoque no adecuado para aquel
momento. Otros tipos de asunto se generaron con un molde standard de hitos [...]. Otros tipos (los
menos) se trataron de diseñar adaptándolos a nuestro trabajo. [...] Me gustaría analizar todo esto y
ver si podemos de alguna forma agilizar en algunos casos el traspaso al molde nuevo».

## Lo que entendió Claude (acordado con Francisco el 27-nov-2026)

Qué se ve:
- En Herramientas sale un bloque **«Pasar los tipos al molde nuevo»**. Al abrirlo enseña, sin cambiar
  nada, la lista de lo que va a cambiar: los tipos que pasan con su guía nueva (con el número de
  tareas de cada uno), los que pasan con la guía vacía, los dos tipos que se unen, los tipos de
  documento que se crean o se unen, los recorridos que se ponen, los datos nuevos y los correos que
  cambian. Y aparte, **«No encontrado»** y **«Se salta»** (lo que ya estaba hecho o ya tenía algo
  escrito).
- Un solo botón, **«Pasarlos»**, con una confirmación. Lo hace todo de una vez y dice lo que ha hecho.
- Una vez hecho, el bloque no vuelve a salir.

Qué cambia:
- **54 tipos** pasan a «Sin hitos»: 23 con guía escrita (70 tareas en total), IPASEN TUTOR LEGAL con
  la guía de IPASEN ALUMNADO, y 30 con la guía vacía, que se escribe el primer día que se usen.
- «Certificado de desempeño de la función tutorial» se une con FUNCIÓN TUTORIAL, que se queda y
  sigue con sus hitos por ahora.
- **Los asuntos abiertos no cambian.** Solo los nuevos. Los hitos de antes se quedan guardados, sin usarse.
- Los 14 tipos largos (los de más tareas) no se tocan: se harán uno a uno.
- Todo lo que cambia, tipo por tipo, está en `docs/787-DATOS.json`. Sale de las cinco tandas
  repasadas con Francisco (`docs/notas-diseno/694-tanda-1.md` a `-5.md`).

Lo que cambia respecto a las tandas, por el repaso contra el código (`docs/notas-diseno/694-repaso.md`):
- **Las esperas** van con «Después se espera a» (fila 785): Jefatura en la matrícula; la familia en
  el requerimiento de admisión y al pedir la cuenta de la ayuda de transporte; el centro de origen en
  las dos tareas de recibir el expediente; Orientación en el recibí; el equipo educativo en su informe.
- **CREDENCIAL IPASEN se queda sin recorrido**, como hoy: así la tarea sigue diciendo «Añadir
  documento» en IPASEN ALUMNADO, que ya se usa.
- **El plazo de admisión** («2 días hábiles») va escrito en la frase de la tarea: en el molde nuevo
  el plazo es del asunto.
- **SOLICITUD NACIONALIDAD** no nace vacía: lleva la única tarea que tenía («Pedir a los tutores el
  documento de nacionalidad»).
- En el expediente que llega de otro centro hay dos tareas con el mismo papel: lo que llega por la
  bandeja se añade desde su tarea. Lo dice «Cómo se hace».
- El recibí de la ayuda de transporte dice «Recibido» al generarlo para imprimir; queda bien al
  llegar el sellado. Lo dice «Cómo se hace».
- **La conformidad de limpieza usa el tipo de documento PARTE DE CONFORMIDAD**, que ya existe (Francisco, 27-nov-2026: «1»); no se crea CONFORMIDAD SERVICIO. Lleva el recorrido aprobado: lo firma la secretaria, se registra de salida y va a la empresa por correo.
- Correo nuevo de la conformidad: «Adjunto le enviamos la conformidad con el servicio de limpieza
  del mes de {Mes del servicio}.», a la empresa, con copia al correo del centro.

## Pantalla de prueba
- No se pidió. Lo que se ve es el bloque de Herramientas descrito arriba, como el de «Aplicar el plan
  de las guías» (fila 551).

## Qué NO se hace en esta tarea
- Los 14 tipos largos (se diseñan uno a uno, después).
- Unir otros tipos de asunto repetidos (apuntado en el repaso).
- El recorrido «nos llega y lo devolvemos resuelto» (idea 777), elegir quién firma (778), los tipos
  de informe (780) y la conformidad creada sola cada mes (784).

## Notas técnicas de Claude
- **Necesita las filas 779, 781, 782, 783, 785 y 786.**
- Copiar `docs/787-DATOS.json` tal cual a `datos-biblioteca/molde-nuevo.json`. No retocar frases.
- Modelo: `js/aula-convivencia.js` (fila 723) para poner casilla, datos, tipos de documento,
  recorridos y guía sin pisar; `js/plan-guias-pantalla.js` y `js/plan-guias-aplicar.js` (fila 551)
  para el bloque de Herramientas, la lista previa, la copia de seguridad de `guias.json` antes de
  aplicar y la marca en `_GESTOR` (`molde-nuevo.json`, con versión). Ficheros nuevos, por debajo de
  400 líneas, apuntados en su `js/cargar-piezas-N.js`.
- **Los tipos se buscan por su nombre exacto** (`t.tipo`), nunca por nombre corto ni alias: 24
  nombres los comparten dos tipos del centro (no usar `AulaConvivencia.buscarTipo`).
- Orden: (1) `unirTipos` con `TiposUnir.unir` (renombra las carpetas de los asuntos abiertos: si
  falla a medias, ámbar y se sigue; el resto no depende de ello); (2) `unirTiposDocumento` (lista,
  recorrido con `RecorridoTipo.mover`, plantillas y campos que nombren el viejo); (3)
  `tiposDocumentoNuevos`; (4) `recorridos`, solo a los tipos que no tengan ya uno
  (`RecorridoTipo.tiene`); los de `sinRecorridoAProposito` no se tocan; (5) `aQuienSeEspera`: cada
  nombre se busca en la lista de «A quién esperamos» sin mayúsculas ni tildes («Familia» es `tutor`)
  y, si no está, se crea como hace «+ Nuevo…»; (6) `campos`: los nuevos se crean y se cuelgan de sus
  `tipos`; los `yaExiste` solo se cuelgan (y `obligatorio` si lo dice); «Estado de los libros», con
  la definición que trae su plantilla (fila 779); (7) `guias` y `guiaCopiada`: un paso
  `listaDeTareas` con `texto`, `papel`, `soloSi`, `comoSeHace` y `esperaA` (el id resuelto en 5); si
  el tipo ya tiene una lista de tareas escrita, se salta y se dice; los pasos de antes se conservan;
  `guardarPasos` con `{ sinLlevar: true }`; (8) `copiar`: la tarea común «Copiar a otra carpeta»
  (fila 783) con ese nombre de fichero; la carpeta se elige en cada ordenador la primera vez, como
  hoy; (9) `correos`: en `_GESTOR/plantillas.json`, por tipo y nombre, sustituir el trozo solo si
  está tal cual (si no, «No encontrado»); el nuevo, solo si no existe; la copia al correo del
  centro, con el dato del centro que ya usa la app; (10) al final, la casilla `sinHitos` de cada
  tipo de `guias`, `guiaCopiada` y `guiasVacias`.
- Si la tarea de arriba de una `copiar` no es de papel, se dice en la lista previa (no debería pasar).
- Nada de fondo: solo al pulsar. Con solo consulta, el botón no sale. Cada fichero por su cola.
- La copia de pruebas: con `?demo=1`, el bloque sale y aplica sobre los datos inventados; añadir a
  `pruebas/apoyo` los tipos que hagan falta y casos en `docs/CASOS-DE-PRUEBA.md`.
- Línea en `js/novedades.js`. Poner al día `docs/CONTEXTO-CORTO.md` y `docs/contexto/`.

## Cómo lo comprueba el segundo revisor
- En Herramientas sale «Pasar los tipos al molde nuevo» y, al abrirlo, la lista de lo que cambia, sin
  cambiar nada.
- Tras «Pasarlos», un asunto nuevo de MATRICULA es una lista de ocho tareas; la segunda lleva
  «Después se espera a: Jefatura de Estudios».
- Un asunto nuevo de ADMISION con «¿Hay que subsanar?» vacío enseña la tarea de requerir en amarillo
  con «Falta: ¿Hay que subsanar?».
- Un asunto nuevo de BECA es una lista de tareas vacía.
- Un asunto que ya estaba abierto de MATRICULA sigue con sus hitos.
- El tipo «Certificado de desempeño de la función tutorial» ya no está; FUNCIÓN TUTORIAL tiene el
  dato «Cursos que pide».
- En Ajustes, el tipo de documento OFICIO dice «Firma: Secretaría, con visto bueno de Dirección · se
  registra de salida · a Otro centro u organismo por Correo electrónico»; CREDENCIAL IPASEN sigue
  sin recorrido.
- El bloque ya no sale en Herramientas.

## Qué mirar al terminar
- En la demostración: abrir el bloque y leer la lista; pulsar «Pasarlos».
- Crear un asunto de matrícula, uno de permiso y uno de beca y mirar sus tareas.
- En el instituto, con los datos de verdad: abrir el bloque y mirar «No encontrado» antes de pulsar.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
