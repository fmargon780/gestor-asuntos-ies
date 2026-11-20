# 724 — Crear varios asuntos desde el aviso de la intranet

**Título llano:** Crear de una vez los asuntos del aula de convivencia pegando el aviso de la intranet
**Para qué:** que, cuando el aviso de la intranet trae varios alumnos para el aula de convivencia, los asuntos se creen de una vez, cada uno con su alumno, su primer día y sus días, sin escribir nada a mano.
**Parte de:** la instrucción 723 (tema 581). Necesita la fila 723 HECHA.

## Lo que escribió Francisco

20-nov-2026, hablando con Claude:

> «Para saber esa información, una vez avisados, entramos en la intranet y miramos qué alumnos son los expulsados al aula de convivencia y sus fechas.»

> «Normalmente el aviso en la intranet incluye a varios alumnos. ¿Podríamos hacerlos en un asunto?» (Eligió **un asunto por alumno, creados todos de una vez con la lista**.)

Dos avisos reales, con los nombres cambiados:

```
ALUMNADO PARA EL AULA DE CONVIVENCIA
Apellido Uno Dos, Nombre Uno (1º ESO B) 3 días, del 18 al 20 de noviembre.
Enviado el 14/11/2026 06:31:02 por Apellidos, Nombre
```

```
ALUMNADO PARA EL AULA DE CONVIVENCIA
Apellido Tres Cuatro, Nombre Dos (1º ESO C) 4 días, del martes 3 al viernes 6 de noviembre.
Apellido Cinco , Nombre Tres Cuatro (1º ESO C) 3 días, del martes 3 al viernes 5 de noviembre.
Enviado el 27/10/2026 12:16:48 por Apellidos, Nombre
```

(En el segundo aviso, la última línea no cuadra: el 5 de noviembre de 2026 es jueves. Hay que enseñarlo.)

## Lo que entendió Claude (acordado con Francisco el 20-nov-2026)

- **Qué hace quien usa la app:**
  - En «Nuevo asunto» hay un botón nuevo, **«Crear varios desde una lista»**. Pega el aviso entero de la intranet. Solo vale para el tipo «EXPULSIÓN AULA CONVICENCIA».
  - La app enseña una fila por alumno con lo que ha entendido: alumno (reconocido), grupo, primer día y días. Cada fila tiene su casilla, marcada.
  - Si una línea no se entiende, o el alumno no se reconoce, o algo no cuadra, esa fila sale en **amarillo**, sin marcar, con lo que falta o no cuadra, y se puede corregir ahí mismo.
  - Al pulsar «Crear», se crea **un asunto por cada fila marcada**, como los crea hoy «Nuevo asunto», con «Primer día» y «Días lectivos» ya puestos. No se crea nada sin pulsar.
  - Si el alumno ya tiene un asunto abierto de este tipo con el mismo primer día, la fila sale gris, «Ya existe», sin marcar.
- **Cómo se lee el aviso:**
  - Se ignoran la línea del título y la de «Enviado el … por …». Esa línea da el año de las fechas; si no está, la fila sale en amarillo pidiendo el año.
  - Cada línea: «Apellidos, Nombre (grupo) N días, del [día de la semana] D al [día de la semana] D de mes.» Un espacio antes de la coma no cuenta.
  - El alumno se reconoce por el nombre (sin tildes ni mayúsculas) y el grupo entre paréntesis lo comprueba. Si dos alumnos se llaman igual, decide el grupo. Si el grupo no coincide con el del alumno, amarillo.
  - Primer día = la primera fecha. Días lectivos = el número del aviso.
  - **Lo que no cuadra** sale en amarillo con el motivo y se elige cuál vale. Se comprueba: el número de días lectivos entre la primera y la última fecha (sin fines de semana ni festivos del centro); y el día de la semana escrito, si lo hay, contra la fecha.
  - Una línea con otra forma (un solo día, fechas de dos meses u otra) se intenta leer; si no se entiende, amarillo, a rellenar a mano. Nunca se inventa un dato.
- **Qué desaparece:** crear los asuntos uno a uno con «Nuevo asunto» y escribir las fechas en cada uno. «Nuevo asunto» sigue igual para lo demás.

## Pantalla de prueba

- Sin pantalla: lo que verá y hará quien use la app está escrito arriba y es lo que se aprueba (decidido por Francisco el 20-nov-2026).

## Qué NO se hace en esta tarea

- Generar la nota ni enviarla: eso es de cada asunto (instrucción 723).
- Un asunto de grupo con varios alumnos: descartado (cada alumno lleva su propio seguimiento).
- Leer otros avisos ni otros tipos. Si el aviso del aula cambia de forma, se cambiará aquí.
- Tocar «Pegar una lista» de los asuntos de grupo: sigue igual.

## No se habló y no está en la pantalla de prueba

- Que el botón esté en «Nuevo asunto» y solo valga para este tipo.
- Que una fila ya existente salga gris y sin marcar.
- Que, sin año en el aviso, se pida a mano.

## Notas técnicas de Claude

- Cada asunto se crea por el mismo camino que «Nuevo asunto» (`App.crearAsuntoDelFormulario`), uno detrás de otro y por `ColaGuardado`; número de asunto anual y carpeta con la regla de nombres de la fila 239. Mirar antes si hay un camino ya hecho para crear sin pasar por el formulario (por ejemplo, el de otras creaciones en bloque); si no, no reescribir: llamar al formulario por código.
- Reconocer al alumno con lo que ya usa la app para buscar alumnado (`U.normalizar`; el grupo es la `unidad` del contacto). Días lectivos: el mismo cálculo de días hábiles y festivos del centro que usa la fila 704 (Ajustes › Hitos: festivos).
- Pieza nueva, por debajo de 400 líneas, en su `js/cargar-piezas-N.js`. Un texto para cada motivo de amarillo, en lenguaje llano, con las palabras de `docs/VOCABULARIO.md`.
- Los dos avisos de arriba (con los nombres inventados) van a la demostración y a `docs/CASOS-DE-PRUEBA.md`, con la línea que no cuadra. **Nunca se guardan en el repositorio nombres reales de alumnos.** Línea en `js/novedades.js`.
- Respeta `SoloConsulta.activo()`.

## Cómo lo comprueba el segundo revisor

- En «Nuevo asunto» con el tipo «EXPULSIÓN AULA CONVICENCIA», «Crear varios desde una lista» está; con otro tipo, no.
- Pegando el primer aviso: una fila, con alumno, grupo «1º ESO B», primer día 18 de noviembre y 3 días, sin amarillo.
- Pegando el segundo: dos filas; la primera, sin amarillo (3 de noviembre, 4 días); la segunda, en amarillo con «las fechas no cuadran» y la elección.
- El espacio antes de la coma no impide reconocer al alumno.
- Una línea sin sentido sale en amarillo, no se crea hasta corregirla.
- Un alumno que no existe sale en amarillo.
- «Crear» crea un asunto por fila marcada, cada uno con «Primer día» y «Días lectivos» y las tres tareas de la fila 723; y nada más.
- Volver a pegar el mismo aviso deja las filas en gris, «Ya existe».
- Sin la línea «Enviado el…», pide el año.
- «Nuevo asunto» sin usar el botón funciona como antes.

## Qué mirar al terminar

- Pega un aviso de la intranet con varios alumnos: mira lo que ha entendido cada fila.
- Corrige una fila en amarillo y crea los asuntos.
- Abre uno de los asuntos creados: mira los dos datos y las tres tareas.
- Vuelve a pegar el mismo aviso: mira que no crea nada de nuevo.

## Revisión y respuestas durante el trabajo

- (20-nov-2026, Claude Code) Revisor APROBADA a la primera, con datos inventados de la demostración (los avisos usan alumnos de la copia de pruebas: Navarro Gil, Ortega Paz y Pardo Luna, grupo «2º B»). Coinciden los diez puntos de «Cómo lo comprueba el segundo revisor», más consola, pantallas y crear/archivar un asunto.
- Lo que hace la pantalla y el texto no pide: al elegir entre las dos fechas que no cuadran, cambian a la vez el primer día y los días de la fila (viernes 6 → 4 días); avisa con un mensaje por asunto creado además del resumen; con el grupo del aviso distinto del del alumno sale amarillo con «Es este alumno, seguir». Lo primero es lo acordado («se elige cuál vale»); lo demás es pequeño, dime si lo quitas.
- No lo he podido ver: los avisos reales de la intranet (nombres reales no se guardan); el formato del grupo real («1º ESO B») frente al de la demostración («2º B») se compara por curso y letra (1º ESO B y 1º B dan lo mismo); eso no está probado con un grupo escrito así, solo con «2º B».
- Aviso del revisor que no es de esta fila: la ficha de un asunto nuevo dice «Siguiente paso: Generar documento.» (el vocabulario pide «hito» o «tarea»).
- (20-nov-2026, Claude en el chat, con Chrome, en la dirección de prueba, versión 20-nov-2026 · 12:21) Bien. Con un aviso inventado: «Ortega Paz , Darío (2º ESO B)» sale reconocido con el espacio antes de la coma y el grupo escrito como en la intranet (3-nov, 4 días); «Pardo Luna» en amarillo por «viernes 5» y, elegido el jueves, queda en 3 días; un alumno que no existe y una línea sin sentido, en amarillo y sin marcar. «Crear 2 asuntos» crea los dos, con «Primer día», «Días lectivos» y las tres tareas. Volver a pegar el mismo aviso: los dos en gris «Ya existe» y «Crear 0 asuntos». Con «Sanción» el botón no está. Consola sin errores de la app. Fila a PENDIENTE con «vista (…)»: se fusiona la rama `claude/jolly-bohr-rlxuyx` y se publica.
