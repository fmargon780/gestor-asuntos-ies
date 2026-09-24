# Fila 125 — Personas y empresas: matriculados primero, buscar por la familia, ficha que acompaña y hermanos

Diseño cerrado con Francisco el 24-sep-2026. No preguntes nada: todo lo que hace falta está aquí.

## El problema

En la pantalla **Personas y empresas** (categoría Alumnado):

- La lista sale en orden alfabético, mezclando el alumnado matriculado este curso con el antiguo
  (las tarjetas naranjas «No matriculado este curso»). El alumno que se busca puede quedar muy
  abajo, entre antiguos.
- Al pulsar un alumno que está abajo, su ficha se pinta arriba a la derecha: hay que subir para
  verla, y al subir se pierde el alumno de vista.
- No se puede buscar por el padre, la madre o el tutor legal. En secretaría es lo más habitual:
  llama «María Eugenia Farfán» y hay que saber de quién es madre.

## Lo que hay que hacer (cuatro puntos)

### 1. Primero el alumnado matriculado este curso

- Solo en la categoría ALUMNADO. En las demás categorías, la lista no cambia.
- La lista de resultados sale en dos bloques: arriba los matriculados este curso (el mismo criterio
  que ya pinta la tarjeta blanca frente a la naranja: `App.claseDeResultado` / `p.matriculado`);
  debajo, un bloque **plegado** con el título «Antiguos (N)», que se despliega al pulsarlo.
- Los aspirantes (`p.solicitante`) van con los matriculados, arriba, con su marca de siempre.
- Si la búsqueda solo encuentra antiguos, el bloque de antiguos sale ya desplegado (si no, la
  pantalla parecería vacía).
- El límite de 60 resultados de `Datos.buscar` se aplica por separado a cada bloque, para que los
  antiguos nunca se coman el sitio de los matriculados.
- Dentro de cada bloque, el orden que ya trae `Datos.buscar`.

### 2. Buscar también por padre, madre o tutor legal

- Solo en ALUMNADO. Lo escrito se busca también en los datos de los tutores legales de cada alumno
  **matriculado este curso** (los antiguos no entran en esta búsqueda): nombre, apellidos, DNI,
  teléfono y correo, de tutor 1 y tutor 2. Usa `js/datos-tutores.js` (el nombre entero del tutor
  ya se monta bien ahí, fila 108), no leas las columnas a mano otra vez.
- Misma forma de buscar que el resto: lo escrito normalizado (sin tildes ni mayúsculas) y partido
  en palabras; un tutor casa si su texto tiene **todas** las palabras, en cualquier orden. El DNI y
  el teléfono se comparan sin espacios, puntos ni guiones.
- Los tutores que casan salen **encima de todo**, en un bloque «Familias» (solo si hay alguno).
  Una tarjeta por tutor, con: su nombre entero, «Tutora 1 / Tutor 2 / Tutor legal N» (lo mismo
  que usa la ventana «Ver todo», fila 108), su DNI, teléfono y correo en una línea, y debajo sus
  hijos matriculados en el centro, cada uno con su nombre, grupo y curso (una línea por hijo).
- Pulsar un hijo abre su ficha, igual que pulsarlo en la lista.
- **Un mismo tutor que aparece en varios alumnos es una sola tarjeta**, con todos sus hijos. Se
  reconoce por su DNI (normalizado); si no tiene DNI, por su nombre entero normalizado.
- Si un alumno ya aparece arriba por su propio nombre y también como hijo de un tutor encontrado,
  sale en los dos sitios: no es un problema.
- Con menos de 3 caracteres escritos, no se busca por tutores (sería lento y no sirve).

### 3. La ficha acompaña al bajar

- El panel de la ficha de la derecha (`#ficha-persona`) se queda fijo en pantalla al desplazarse
  la lista (`position: sticky`, por debajo de la cabecera fija de la pantalla, fila «Cabecera de
  cada pantalla fija al bajar»), con su propia barra de desplazamiento si la ficha es más alta que
  la ventana.
- Vale para todas las categorías, no solo ALUMNADO.
- La tarjeta del alumno que se está viendo queda marcada en la lista (borde o fondo más oscuro),
  para saber de un vistazo de quién es la ficha.

### 4. Hermanos en el centro

- En la ficha de un alumno (`App.verFicha`), una línea más entre los datos de arriba, justo después
  de «Curso»: **«Hermanos en el centro»**, con los alumnos **matriculados este curso** que
  comparten al menos un tutor legal con él (mismo criterio que el punto 2: DNI del tutor; sin DNI,
  nombre entero). Nunca él mismo.
- Cada hermano con su nombre y su grupo, pulsable: abre su ficha.
- Si no tiene ninguno, la línea no sale.

## Rendimiento

- El índice de tutores (texto de búsqueda de cada tutor → sus hijos matriculados) se calcula **una
  vez** al cargar la lista de ALUMNADO (`App.pintarPersonas`) y se guarda junto a
  `App.personasCargadas`. Nunca se recalcula en cada pulsación de tecla. Se rehace solo cuando se
  vuelve a cargar la lista (`Datos.olvidar`).
- El mismo índice sirve para los hermanos del punto 4.

## Ficheros que hay que tocar

- `js/archivo-personas.js` (16 KB): `App.buscarPersonas` y `App.verFicha`. Si al tocarlo pasa de
  unas 400 líneas, saca la parte nueva a un fichero propio.
- **Fichero nuevo** `js/personas-familias.js` (`window.PersonasFamilias`): el índice de tutores,
  la búsqueda por familia, las tarjetas «Familias» y el cálculo de hermanos. Funciones puras donde
  se pueda, para probarlas sin navegador. Se engancha llamándolo desde `js/archivo-personas.js`,
  **no envolviendo** nada. Su `<script>` en `index.html`, después de `js/datos-tutores.js` y antes
  de `js/archivo-personas.js`.
- El CSS de la pantalla de Personas (búscalo por `#ficha-persona` / `#lista-personas` en `css/`):
  el panel fijo, el bloque plegado «Antiguos (N)», las tarjetas de Familias y la marca del
  seleccionado. Diseño denso, que aproveche el ancho (el monitor del trabajo es de 1905 px).
- `js/version.js`: la versión, con la hora sacada del reloj.
- **Prueba nueva** `pruebas/personas-familias.mjs`: sin navegador, con un RegAlum de mentira de
  seis alumnos (dos hermanos matriculados con la misma madre; un tercer hermano ya no matriculado;
  un tutor sin DNI que se reconoce por nombre; un antiguo con el apellido buscado). Comprueba:
  matriculados antes que antiguos; buscar la madre por nombre, por apellido, por DNI y por teléfono
  devuelve una sola tarjeta con los dos hermanos matriculados y no el antiguo; hermanos de uno
  devuelve al otro y no a sí mismo. Una sola pasada de `npm test` al final.
- Documentación al cerrar: `docs/COLA.md` (fila 125 HECHA), `docs/CONTEXTO-CORTO.md` (sección 5,
  una línea), `docs/contexto/PERSONAS.md` (sección nueva), `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`
  (el fichero nuevo y la prueba) y `docs/HISTORIA.md`.

## Cómo trabajar

- No leas el repositorio entero: con los ficheros de arriba, `docs/CONTEXTO.md` y
  `docs/contexto/PERSONAS.md` basta.
- Cambios quirúrgicos: no reescribas ficheros enteros que no hace falta reescribir.
- Sube directamente a `main`, sin abrir ninguna pull request (si la sesión solo puede con pull
  request, la fusionas tú en verde, según el permiso permanente de `docs/COLA.md`).
- Como mucho dos subidas (regla 13 de la cola). Comprueba lo publicado con `curl` al terminar.

## Qué va a ver Francisco

En Personas y empresas → Alumnado: arriba los alumnos de este curso y los antiguos plegados
debajo; al escribir el nombre de una madre o un padre, su tarjeta con sus hijos del centro; la
ficha siempre a la vista al bajar; y en la ficha de un alumno, sus hermanos en el centro.
