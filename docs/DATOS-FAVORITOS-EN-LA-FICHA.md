# Datos del tercero a la vista, junto al nombre del asunto (fila 272)

Cerrado con Francisco el 6-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/1-Fy34L5DT6gTrVkudFzoC7OITKa24wBj/view?usp=drivesdk).

## Qué pasó

Desde la fila 239 el nombre de la carpeta de un asunto es corto: `AAMMDD A26-0137 TIPO Tercero`.
El grupo, el año académico y lo demás ya no van en el nombre. Francisco escribió: «hemos perdido
la visualización directa de alguna información». Pide ver, a la derecha del nombre del asunto,
hasta 3 datos «favoritos», que se puedan elegir según la clase de tercero. Su ejemplo: para el
alumnado, la unidad.

## Qué quiere Francisco (decidido con él, punto por punto)

1. Los datos salen **solo de la persona o empresa** (el tercero). No del asunto: ni año académico,
   ni texto libre, ni campos del tipo.
2. Se ven **solo en la ficha del asunto**, junto al nombre. No en la tabla de Inicio, ni en la mesa
   del hito, ni en ninguna otra lista.
3. Se eligen **en la propia ficha**, con un botón pequeño «Elegir datos». No en Ajustes.
4. La elección es **una sola para todo el centro**: la ven igual los dos ordenadores.
5. Lo elegido vale para **todos los asuntos de esa clase de tercero** (las seis de
   `Nombres.CATEGORIAS`: alumnado, personal, empresas, otros, tutores legales, Administraciones).
6. Como mucho **3 datos** por clase.
7. Cada dato sale **con su nombre delante**: «Unidad: 2º ESO A».
8. Si esa persona no tiene ese dato, **no sale nada** en su sitio (ni el nombre del dato, ni un
   guion, ni un hueco).
9. El alumnado **empieza con «Unidad» ya elegida**. Las otras cinco clases empiezan sin ninguno:
   solo se ve el botón.

## Qué hay que hacer

### 1. Dónde se ven

- En la cabecera de la ficha del asunto, en la primera línea (`.ficha-linea1`,
  `js/ficha-asunto.js`), **pegados a la derecha del nombre** y de sus «⋯», no al fondo de la
  línea. «Archivar» sigue a la derecha del todo. Hoy el `<h2 class="ficha-nombre">` crece hasta
  ocupar todo el hueco; lo natural es que deje de crecer y que el hueco lo ocupe el bloque nuevo.
  Si ves un camino más limpio, úsalo: lo que cuenta es lo que se ve.
- Letra más pequeña y gris que el nombre, como la línea gris de la cabecera. Los datos, separados
  por « · ». El nombre del dato en gris, el valor en el color normal del texto.
- Detrás del último dato, el botón **«Elegir datos»**, pequeño y discreto (secundario, sin
  `boton-principal`). Texto de ayuda: «Elige hasta 3 datos para verlos aquí, en todos los asuntos
  de <clase>», con la clase en minúscula, tal como la escribe `Nombres` en `lista`
  («alumnado», «personal», «empresas»…).
- Un valor largo se recorta con puntos suspensivos (unos 40 caracteres) y va entero en su `title`.
- En una pantalla estrecha el bloque baja entero a su propia línea, sin partirse por la mitad de
  un dato.
- **Con la cabecera encogida** (al bajar por la página): los datos siguen a la vista, en una sola
  línea y recortados si no caben; el botón «Elegir datos» se esconde.
- **El sitio se reserva desde el primer pintado.** Los datos del tercero llegan tarde
  (`Datos.cargar`). El bloque existe, vacío, desde que se pinta la cabecera, y al llegar los datos
  solo se rellena: no puede cambiar el alto de la cabecera ni mover la página (es el mismo cuidado
  que explica `js/ficha-nombre-acciones.js` en la fila de copiar; ver `pruebas/cabecera-fija.mjs`).
- Si el asunto no dice de qué clase es su tercero, no sale nada: ni datos ni botón.
- Si se conoce la clase pero no se encuentra a la persona (ya no está en el fichero y la ficha no
  guarda su contacto), no sale ningún dato y **sí** sale el botón.
- Sale igual en un asunto abierto, en uno del ARCHIVO y en uno reservado.

### 2. Qué datos se pueden elegir

- Para cada clase, **todos los datos que la app ya tiene de un tercero de esa clase**: los mismos
  que enseña su ficha en «Personas y empresas» (`js/ficha-persona.js`,
  `js/ficha-persona-reparto.js`, `Datos.destacadosAlumno`, `Datos.destacadosPersona` y lo
  equivalente para empresas, otros, tutores legales y Administraciones), incluidos los que suma la
  base de datos de alumnado. Las tablas de la base de alumnado (materias y parecidas) no: solo
  datos de una línea.
- No se ofrecen el nombre ni los apellidos: ya están en el nombre del asunto.
- **La lista sale de las columnas que existen, no de las que esta persona tiene rellenas.**
  Recuerda la trampa de `p.campos`: solo trae las columnas con dato; para saber qué columnas hay,
  se mira la cabecera del CSV.
- Cada dato se guarda por una clave estable: su título normalizado (`U.normalizar`), con los
  mismos sinónimos de `js/ficha-persona-reparto.js` («unidad» y «grupo» son el mismo dato). Un dato
  que está en dos fuentes sale una sola vez.
- **El grupo del alumno se llama aquí «Unidad»**, en la lista y en la cabecera: es la palabra de
  Francisco y la de Séneca. Es el dato `persona.unidad`. No cambies cómo se llama en el resto de la
  app.

### 3. El cuadro «Elegir datos»

- Al pulsar el botón se abre un cuadro (`U.preguntar`, uno solo a la vez) con el título
  «Elegir datos · <Clase>» (por ejemplo «Elegir datos · Alumnado»).
- Debajo del título, una línea: «Marca hasta 3. Se verán junto al nombre en todos los asuntos de
  <clase>, en todos los ordenadores del centro.»
- Después, la lista de datos de esa clase, cada uno con su casilla. A la derecha de cada nombre,
  en gris, el valor que tiene el tercero de este asunto, como ejemplo («Unidad — 2º ESO A»). Si no
  lo tiene, el nombre solo.
- Arriba van los que ya están marcados. El resto, por orden alfabético.
- Con más de 12 datos, una caja «Buscar…» encima de la lista, que la filtra al escribir.
- Con 3 marcados, las demás casillas se apagan y aparece «Máximo 3». Al desmarcar una, vuelven.
- Los datos se ven en la cabecera **en el orden en que se marcaron**.
- Botones «Guardar» y «Cancelar». «Guardar» cierra el cuadro, la cabecera cambia al momento, sin
  recargar, y sale el aviso verde de siempre. «Cancelar» y Escape no cambian nada.
- Se puede guardar sin ninguno marcado: entonces solo queda el botón.

### 4. Dónde se guarda

- En `_GESTOR`, con los demás ajustes del centro: dentro de `registro.ajustesAvisos`, una clave
  nueva (por ejemplo `datosFavoritos = { 'ALUMNADO': ['unidad'], 'EMPRESAS': [] … }`), guardada con
  `App.guardarRegistroFresco`, como `App.guardarDiasCaducidadCopias` (`js/ajustes-centro.js`).
  Nunca en `localStorage`.
- Una clase **sin clave** todavía usa lo de fábrica: `['unidad']` para el alumnado, `[]` para las
  demás. Una clase **con lista vacía** es que alguien eligió no ver ninguno: se respeta.
- Solo se guarda la clase que se ha cambiado; las demás claves no se tocan.
- Si se guarda una clave que ya no existe en el fichero (una columna que Séneca dejó de mandar),
  no se enseña y no da error. En el cuadro sigue saliendo, marcada, con «(ya no está en el
  fichero)», para poder quitarla.

### 5. Cuándo el botón está apagado

- En «solo consultar» (`SoloConsulta.activo()`) y en modo consulta (el compañero está dentro):
  apagado, como los demás controles que cambian algo (`js/ficha-consulta.js`). Los datos se siguen
  viendo.
- En un asunto del ARCHIVO el botón funciona: no cambia el asunto, cambia un ajuste del centro.

## Qué NO se toca

- La tabla de Inicio, la mesa del hito, «Ver todo», Archivo y las fichas de «Personas y empresas».
- La línea «Datos y contacto» del tercero, la fila de copiar y la línea gris de la cabecera.
- Ajustes: no se añade ninguna sección. Solo se elige desde la ficha.
- El nombre de las carpetas y de los documentos.
- Los campos del asunto (propios, calculados, de hito): no son datos del tercero y no se ofrecen.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/ASUNTOS.md` (el apartado
  «La cabecera de la ficha»), `docs/contexto/PERSONAS.md`, `docs/contexto/PANTALLA.md` (solo «La
  cabecera se queda arriba, y se encoge») y los ficheros de la lista basta.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- Ningún fichero de `js/` pasa de 600 líneas. Lo nuevo va en ficheros nuevos; en
  `js/ficha-asunto.js` (361 líneas) solo entran el hueco del bloque en la cabecera y la llamada.
- Lo nuevo **no envuelve** nada (`U.envolver`): `pintarLaFicha` lo llama directamente.
- El repintado asíncrono lleva contador de turno: si se cambia de asunto mientras llegan los datos,
  los del asunto anterior no se pintan en el nuevo.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Rama `fila-272`, revisor en local y, con su APROBADA, a `main`. Nada se queda en una petición de
  cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs datos-favoritos
  cabecera-del-asunto cabecera-compacta cabecera-fija`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- `js/datos-favoritos.js` (nuevo): la parte sin pantalla. Qué datos tiene cada clase, leer y
  guardar la elección del centro, y los valores de una persona para lo elegido.
- `js/ficha-datos-favoritos.js` (nuevo): pintar el bloque en la cabecera y el cuadro «Elegir
  datos». Si todo cabe con holgura en un solo fichero, vale uno.
- `js/ficha-asunto.js`: el hueco del bloque en `.ficha-linea1` y la llamada desde `pintarLaFicha`.
- `css/ficha-asunto.css` (311 líneas): los estilos del bloque y el cambio del `<h2>`; si pasan de
  unas 25 líneas, en un `css/ficha-datos-favoritos.css` nuevo.
- `index.html` (los ficheros nuevos; y la lista de la copia sin internet, si lleva una propia).
- `js/ficha-consulta.js`: solo si el botón no queda apagado solo en modo consulta.
- `js/demo/`: solo si al alumnado inventado le falta la unidad o a alguna clase le faltan datos
  para los puntos de abajo.
- `pruebas/datos-favoritos.mjs` (nueva, con los puntos de abajo); `pruebas/cabecera-del-asunto.mjs`,
  `pruebas/cabecera-compacta.mjs` y `pruebas/cabecera-fija.mjs` solo si alguno de sus pasos cuenta
  lo que hay en la primera línea de la cabecera.
- `js/novedades.js`: «En la ficha de un asunto, junto al nombre, se ven hasta 3 datos de la
  persona o empresa (para el alumnado, la unidad). Con «Elegir datos» decides cuáles, para todos
  los asuntos de esa clase.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (en la línea de la ficha del asunto, sin alargarla),
  `docs/contexto/ASUNTOS.md` (apartado de la cabecera) y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en la ficha de un asunto, a la derecha del nombre, ya se ve la unidad del
alumno, y que con «Elegir datos» puede cambiar qué 3 datos se ven para cada clase de tercero.

## Cómo sabemos que está bien

Para todos los puntos, datos inventados: un asunto abierto a nombre de un alumno matriculado
(«Prueba Inventada, Persona», unidad «2º ESO A»), otro a nombre de un alumno no matriculado (sin
unidad), y otro a nombre de una empresa inventada con NIF y teléfono.

1. En la ficha del asunto del alumno matriculado, a la derecha del nombre y de sus «⋯», se lee
   «Unidad: 2º ESO A» y, detrás, el botón «Elegir datos». «Archivar» sigue a la derecha del todo.
2. En la ficha del asunto del alumno sin unidad no sale «Unidad» ni ningún hueco: solo el botón.
3. En la ficha del asunto de la empresa, sin haber elegido nada, solo sale el botón.
4. En el asunto del alumno, «Elegir datos» abre un cuadro titulado «Elegir datos · Alumnado», con
   la línea «Marca hasta 3…», «Unidad» marcada y arriba, y junto a ella «2º ESO A» en gris.
5. En la lista no están el nombre ni los apellidos, y sí hay datos que este alumno tiene vacíos.
6. Marcar dos datos más y pulsar «Guardar»: el cuadro se cierra y en la cabecera salen los tres,
   en el orden en que se marcaron, cada uno con su nombre delante y separados por « · », sin
   recargar la página.
7. Volver a abrir el cuadro: con 3 marcados, las demás casillas están apagadas y se lee
   «Máximo 3». Al desmarcar una, se encienden.
8. «Cancelar» y Escape cierran el cuadro sin cambiar lo que se ve en la cabecera.
9. Abrir otro asunto de alumnado: salen los mismos tres datos, con los valores de ese alumno.
10. El asunto de la empresa sigue sin ningún dato: lo elegido para el alumnado no le afecta.
    Elegir «NIF» para las empresas lo enseña en ese asunto y en ningún asunto de alumnado.
11. Recargar la página y volver a entrar: todo lo elegido sigue igual.
12. Desmarcar todos los del alumnado y guardar: queda solo el botón, y sigue así tras recargar (no
    vuelve «Unidad» por su cuenta).
13. Bajar por la ficha hasta que la cabecera se encoge: los datos siguen a la vista en una sola
    línea y el botón «Elegir datos» no se ve. La cabecera no tiembla ni cambia de alto al llegar
    los datos.
14. En la ficha de un asunto del ARCHIVO se ven los datos y el botón funciona.
15. En modo consulta y en «solo consultar», los datos se ven y el botón está apagado: pulsarlo no
    abre nada.
16. La tabla de Inicio y la mesa de un hito no enseñan estos datos.
17. A 1280 px de ancho, el bloque baja entero a su línea sin taparse con «Archivar» ni con el
    nombre.
18. **[SOLO FRANCISCO]** Con los datos reales del centro: en un asunto de un alumno se ve su unidad
    de verdad, y lo que elige en un ordenador lo ve su compañero en el otro.
