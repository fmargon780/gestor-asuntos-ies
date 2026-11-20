# 722 — Datos propios de cada persona, desde la lista del grupo

**Título llano:** Datos propios de cada persona, sacados de la lista que pegas para formar el grupo
**Para qué:** que un documento o un correo para varias personas pueda llevar un dato distinto para cada una (un número, una fecha, una nota) aunque la app no lo tenga, usando las columnas de la lista del grupo. Vale para cualquier asunto de grupo, no solo para los títulos.

## Lo que escribió Francisco

Tema 393 (21-oct-2026): «Documentos para varias personas y envío de una vez. Para qué: que un tipo de asunto pueda hacer el mismo documento para varias personas a la vez y mandárselo a cada una por correo de una sola vez.»

20-nov-2026, hablando con Claude:

> «La tarea no consiste únicamente en enviar un correo personalizado a cada alumno (plantilla de correo), si no que además, debe llevar un adjunto también personalizado (Plantilla de documento). Y aunque ahora el caso concreto es para el envío de la notificación de la llegada de los títulos al instituto, no quisiera desarrollar algo concreto, útil solo para estos casos, si no algo general que me permita atender otros asuntos en los que me encuentra con la misma necesidad.»

> «Pues no lo sé, pero entiendo que puedan darse casos. ¿Estaríamos preparados para ello? Es posible que esos datos estuvieran en algún listado relativo al asunto que podríamos incorporar.»

## Lo que entendió Claude (acordado con Francisco el 20-nov-2026)

- Lo de generar un documento para cada persona del grupo y enviárselo con un correo suyo **ya existe** («Generar para todos» y «Enviar…», filas 293 a 296) y vale para cualquier tipo de asunto. Claude lo probó el 20-nov-2026 con la copia de pruebas, en un asunto sin hitos: ejemplo, 8 documentos, 7 correos con su adjunto cada uno y la persona sin correo aparte. No se toca.
- Lo que falta es un dato distinto para cada persona que la app no tenga. Hoy la lista pegada solo sirve para reconocer a las personas y sus demás columnas se tiran; y un dato del asunto vale uno para todo el asunto.
- Qué verá y hará Francisco:
  - Pega la lista como siempre, ahora con cabecera en la primera línea. El cuadro dice qué columnas se guardan en el asunto («Se guardan estas columnas: …»). La columna que sirve para reconocer a la persona (nombre, Nº escolar, DNI) no cuenta como dato.
  - Sin cabecera no se guardan columnas, y el cuadro lo dice.
  - Volver a pegar una lista pone al día los datos de esas personas y deja los de las demás.
  - En el editor de plantillas de documento y de correo hay un grupo nuevo de datos, «De la lista del asunto», con las columnas guardadas. Se pone en el texto como cualquier otro dato.
  - Al generar o enviar, cada persona lleva su valor. Si a una le falta, sale en amarillo como lo que falta hoy, y se puede seguir.
- «Un valor por dato y asunto» se mantiene. En un asunto de grupo se añade un valor distinto para cada persona; nada más cambia.
- Va también aquí un arreglo pequeño: la casilla «Estos documentos se registran en Séneca» de la tarjeta «Personas del grupo». Claude no consiguió desmarcarla con un clic normal en la prueba (sí cambiando su estado por programa). Si con un clic de verdad no se queda desmarcada, se arregla: sin ella desmarcada, un documento que no se registra no se puede enviar.
- Desaparece: nada.

## Pantalla de prueba

Sin pantalla: el cambio visible es una línea en un cuadro y un grupo más en una lista de datos que Francisco ya conoce; lo que verá está escrito arriba.

## Qué NO se hace en esta tarea

- Apuntar quién ha recogido ya su título (o cualquier «hecho por persona» que no sea generar, registrar o enviar). No se pidió.
- Cambiar «Generar para todos», «Enviar…», «Enviar un aviso…» ni cómo se reconoce a las personas de la lista.

## Notas técnicas de Claude

- Sitios a mirar (nada más): `js/lista-pegada.js` y `js/lista-pegada-pantalla.js` (hoy tiran las columnas y solo guardan a la persona reconocida; el cuadro ya conoce la cabecera y la línea de cada persona), `js/plantillas-valores.js` (`asuntoParaPersona` arma el asunto de cada persona: ahí se superponen sus valores, y así llegan solos al documento, al correo y a «lo que falta»), `js/campos-lista.js` y `js/campos-elegir.js` (el grupo «De la lista del asunto»), `js/grupo-registro.js` (la casilla: `onchange` en `enganchar`, y su repintado).
- Dónde se guarda: no en `asuntos.json` (un grupo de 600 personas pesa; `docs/TRABAJO-EN-BLOQUE.md`, «Trampas»). Un fichero de datos en la carpeta del asunto, leído de una sola pasada, con la persona por su clave (`CATEGORÍA|nombre`) y por `ColaGuardado`. Claude Code elige el nombre y lo apunta en `docs/contexto/` donde toque. Si una persona cambia de nombre o de Nº escolar, `js/tercero-renombrar.js` mueve también sus datos.
- Nombres de columna: se guardan tal cual vienen y se comparan sin tildes ni mayúsculas, con `U.normalizar`. Dos columnas con el mismo nombre: la segunda se ignora y el cuadro lo dice.
- El editor de plantillas, abierto desde un asunto de grupo, ofrece sus columnas; abierto desde Ajustes, las de los asuntos de grupo de ese tipo. Una plantilla que usa una columna que el asunto no tiene deja el hueco en amarillo, sin romper nada.
- Los asuntos de grupo que ya existen no cambian: sin columnas guardadas, todo como hoy.
- Fichero nuevo por debajo de 400 líneas; se apunta en su lista `js/cargar-piezas-N.js`. Añadir su caso a la demostración (un grupo con una columna de datos) y a `docs/CASOS-DE-PRUEBA.md`. Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- Pegar una lista con cabecera y dos columnas de datos: el cuadro dice «Se guardan estas columnas: …» y las dos aparecen en «De la lista del asunto».
- Pegar una lista sin cabecera: no se guarda ninguna columna y el cuadro lo dice.
- Una plantilla de documento con una columna: «Generar para todos» pone en cada documento su valor, distinto para cada persona.
- Una plantilla de correo con la misma columna: el correo de ejemplo de cada persona (◀ ▶) lleva su valor.
- A una persona sin valor: el hueco sale en amarillo y se puede seguir.
- Volver a pegar la lista con un valor cambiado: solo cambia el de esa persona.
- Una persona que cambia de nombre conserva su dato.
- En la tarjeta «Personas del grupo», con un clic normal la casilla «Estos documentos se registran en Séneca» se desmarca, se queda desmarcada, y «Enviar…» deja enviar los documentos sin registrar.
- Un asunto de grupo anterior sin columnas funciona igual que antes.

## Qué mirar al terminar

- En el instituto, con una lista real de Séneca o de una hoja tuya con cabecera: pegarla y ver que el cuadro nombra las columnas bien. (Solo puede hacerlo Francisco: son datos reales.)
- Hacer una plantilla de documento con una columna y generar para todos: ver que cada documento lleva su dato.
- Enviar de verdad a una o dos personas de prueba. (Solo puede hacerlo Francisco: es correo real.)
- Desmarcar la casilla del registro con un clic.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
