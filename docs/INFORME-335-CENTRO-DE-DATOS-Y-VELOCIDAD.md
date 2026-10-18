# Informe de la fila 335: Centro de datos y velocidad

Hecho el 18-oct-2026. Revisión única: no se ha cambiado la app ni se ha publicado nada.

**Centro de datos: sí.** El Gestor coge todo lo que le toca de la carpeta (alumnado, personal, alumnado de la base de datos, función tutorial, Consejo Escolar y los dos registros) y los datos del centro. Lo que no coge, o lo coge y no lo usa, está en la sección 1.3; son decisiones antiguas o cosas pequeñas, y cada una queda apuntada como idea.

**Velocidad: sí en los cambios, sin cifras todavía.** Los siete cambios de velocidad que he encontrado siguen puestos en `main`, y la web publicada sirve los mismos ficheros. Lo que no he podido ver son las medidas de la semana: el buzón las guarda en un Drive donde mis sesiones no entran (sección 2.3). Hasta que Francisco las pase, no se puede decir con números si algo va lento.

## Cómo he mirado

- **El Centro de datos real no lo he podido abrir**: la carpeta de Drive no está en mi sesión. Lo he comprobado con tres cosas: el contrato que escribe el Centro de datos (`docs/CONTRATO.md` de `fmargon780/centro-de-datos-ies`), el código del Gestor y el último parte de comprobaciones que el propio Centro de datos deja en su repositorio (`comprobaciones/ultima.json`, del 18-oct-2026 a las 00:02, con las cuentas reales de su índice). El apunte `_GESTOR/centro-de-datos.json` de cada ordenador tampoco lo he podido leer.
- **Los cambios de velocidad** salen de buscar en la cola, en la historia y en los documentos de cada fila. Puede que me haya dejado alguno que no habla de velocidad con esas palabras.
- **Prueba de que siguen funcionando**: he pasado las pruebas de lo que toca (`centro-de-datos`, `personal-del-centro`, `guardar-en-fila`, `archivo-indice`, `ficha-del-archivo`, `copias`, `medidas`). Pasan todas menos una, explicada en la sección 3.

## 1. Centro de datos

### 1.1 Lo que ofrece hoy (cuentas del 17-18-oct-2026)

El índice tiene 120 entradas y 118 ficheros; el Centro de datos dice que todo cuadra (ninguno falta, ninguno sobra).

| Qué ofrece | Entradas | ¿Lo coge el Gestor? | ¿Lo usa en pantalla? |
|---|---|---|---|
| Alumnado de Séneca (`RegAlum`) | 1 | Sí, al entrar, byte a byte | Sí: terceros, fichas, edades |
| Alumnado de la base de datos (`ALUMNADO-BD.json`) | 1 | Sí | Sí: ficha del alumnado |
| Personal (listados) | 67, de 37 cursos | Sí. Si hay «parte hecha» del curso, coge la parte; si no, el listado | Sí: personal, tutores, cargos, aviso al claustro |
| Personal ya hecho (una parte por curso) | 37 | Sí (fila 327) | Sí |
| Función tutorial (PDF) | 20, uno por curso | Sí, solo el del curso actual (a propósito) | Sí: Tablas de datos |
| Consejo Escolar | 13 periodos | Sí, todos | Sí: Tablas de datos |
| Registro de entrada y de salida | 1 y 1 | Sí, si «Revisar desde» está puesto | Sí: Control del registro |
| Datos del centro y firma (`configuracion.json`) | 1 | Sí: nombre, código, dirección, localidad, provincia y firma | Sí: plantillas y Ajustes |
| Lo que el Gestor entrega: empresas, Administraciones, cargos | 3 entregas | Las entrega el Gestor. El Centro de datos las ha aceptado (18, 10 y 7 registros; la última hace 1 día; ningún campo ignorado) | — |

La última fila prueba que la conexión está viva: el Centro de datos recibió las tres listas del Gestor hace uno a cuatro días.

### 1.2 Lo que ofrece y el Gestor no coge, por decisión escrita

| Qué | Entradas | Por qué no |
|---|---|---|
| Matrícula por nivel | 8 | Es de BD Alumnado, no del Gestor |
| Expedientes de Primaria, uno por alumno | 171 | Es de BD Alumnado |
| Censo NEAE | 1 | Es de BD Alumnado |
| Solicitudes de admisión, sobres, matrícula provisional, planificación | las que haya | Son de BD Alumnado |
| Partes «hechas» del alumnado | varias | El Gestor usa la ficha completa (`ALUMNADO-BD.json`), que es la unión de todas |

### 1.3 Lo que ofrece y el Gestor no coge o no usa (apuntado como idea)

1. **Teléfono del centro y correo común del centro** (`configuracion.json`). El Gestor los lee y los apunta, pero ninguna pantalla ni plantilla los usa.
2. **Libros de texto** (4 listados, ya con su ficha hecha). El contrato dice «Gestor de asuntos (más adelante)»: está previsto y todavía no se hace.
3. **Tutoría ya hecha** (grupo y tutor/a de hoy, calculado por el Centro de datos). El Gestor lee el PDF por su cuenta y calcula lo suyo, así que no le falta nada; solo hay dos maneras de saber lo mismo.

### 1.4 Cosas del propio Centro de datos (no son del Gestor)

Tres de sus comprobaciones salen en «mal»: `diagnostico-limpio` y las dos de «ensayo» de tutorías y Consejo (el ensayo de tutorías sale con las 20 partes distintas). Es trabajo de ese proyecto. Lo dejo dicho por si Francisco quiere que se mire allí.

## 2. Velocidad

### 2.1 Los cambios hechos para ir más rápido, y si siguen puestos

| Fila | Qué cambió | Puesto en `main` | Publicado | Prueba |
|---|---|---|---|---|
| 42 (buscador del ARCHIVO) | Índice guardado del ARCHIVO, búsqueda por palabras ya preparada y un recuento barato para saber si está al día | Sí (`js/archivo-indice.js`, `archivo-indice-construir.js`) | Sí (mismo tamaño que en el repositorio) | `archivo-indice.mjs`: bien |
| 64 | La ficha de un asunto archivado baja a su carpeta: `asuntos.json` solo lleva los abiertos y no crece | Sí (`js/ficha-archivo.js`; igual para el historial de hitos, `js/hitos-archivo.js`) | Sí | `ficha-del-archivo.mjs`: bien |
| 99 | Guardar en fila; la copia del día se hace una vez y se recuerda en memoria; `asuntos.json` y `hitos.json` sin sangría; lectura con reintentos; las tareas de fondo se saltan si hay un guardado en marcha | Sí (`js/cola-guardado.js`, `js/copias.js`, `Carpetas.guardarJson`) | Sí | `guardar-en-fila.mjs` y `copias.mjs`: bien |
| 132 | `estados.json` ya no se carga al entrar | Sí (`js/nucleo.js`) | Sí | — |
| 177 | El índice del ARCHIVO se parte por curso y se lee solo el que hace falta | Sí (`migrarSiHaceFalta`, un fichero por curso) | Sí | `archivo-indice.mjs`: bien |
| Datos de terceros | Los CSV se leen una vez por sesión (`Datos`) y se olvidan solo si el fichero cambia | Sí (`js/datos.js`) | Sí | — |
| 332 | El Gestor se mide solo (entrar, abrir un asunto, archivar, leer y guardar cada fichero) y manda las cifras al buzón | Sí (`js/medidas*.js`) | Sí | `medidas.mjs`: bien |

Comprobado también en la web: `asuntos.fmargon.com` y `gestor-de-asuntos.vercel.app` sirven la misma versión (`16-oct-2026 · 23:17`) y `cola-guardado.js`, `archivo-indice-construir.js`, `ficha-archivo.js` y `medidas.js` publicados pesan exactamente lo mismo que los de `main`. Ninguna fila posterior ha deshecho ninguno de estos cambios.

Dos avisos sobre la fila 64: (a) los asuntos archivados **antes** de esa fila siguen dentro de `asuntos.json` hasta que se pulsa Ajustes → Mantenimiento → «Poner en orden las fichas del ARCHIVO»; desde aquí no sé si se pulsó. (b) Las filas 208 y 333 aceleran las **pruebas**, no la aplicación; no cuentan aquí.

### 2.2 Los cambios que se han probado y no se han hecho

Está apuntado en `docs/PLAN-DATOS-DEL-GESTOR.md`: primero se mide, después se decide, y hasta entonces no se toca cómo se guardan los asuntos. No hay ningún cambio de fondo más pendiente de comprobar.

### 2.3 Las cifras de la semana

**No he podido verlas.** El buzón de soporte guarda las medidas en el Drive del centro (`SOPORTE-AVISOS/_MEDIDAS`), no en el repositorio `soporte-apps`, y desde mi sesión no se llega a ellas. Como pedía la instrucción, no las he buscado por otro camino. El Gestor sí las apunta y las manda (código puesto y publicado, prueba en verde), así que, si el buzón está en marcha, ya debería tener la semana entera; no he podido confirmarlo.

Lo que falta para dar el «sí» con números: los tiempos de entrar, abrir un asunto, archivar, leer y guardar ficheros, y los reintentos, conflictos y fallos de la semana. Queda apuntado como paso de Francisco en la cola.

## 3. Una prueba que falla

`pruebas/centro-de-datos.mjs` falla en mi sesión, y también a solas, en una comprobación: «al entrar, con un guardado en marcha, espera y luego lo toma». Falla igual sin tocar nada del código. La prueba cuenta cuántas veces se pregunta si hay un guardado en marcha, y en este entorno otra tarea de fondo se come esas preguntas antes de que llegue el Centro de datos; la app hace lo que debe (espera y luego toma). Es un fallo de la prueba o del entorno, no de la app. Queda apuntado como idea.

## 4. Lo apuntado al final de `docs/COLA.md`

- Ideas 355, 356 y 357: las tres cosas de la sección 1.3.
- Idea 358: la prueba frágil de la sección 3.
- Idea 359: el paso de Francisco para las cifras de la semana.
