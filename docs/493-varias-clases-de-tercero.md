# 493 — Varias clases de tercero en un tipo de asunto

Tema 492 (idea 491, aviso de Francisco del 30-oct-2026). Diseñado con Francisco el 30-oct-2026.

## Lo que escribió Francisco (manda)

> Dependiendo de lo que decidamos como opción óptima pasaríamos de trabajar como hasta ahora: cada
> tipo de asunto permita tener vinculado un tipo de tercero y en el caso concreto estudiado
> deberíamos tener un mismo tipo de asunto para cada tipo de tercero, o si decidimos poder vincular
> más de un tipo de tercero para un mismo tipo de asunto, cuando se configure el tipo de asunto se le
> asignaría los tipos de tercero permitidos para el tipo de asunto. En este caso, el usuario al
> crear un asunto de este tipo, podría elegir de entre los tipos de tercero relacionados.

Eligió la segunda forma («Yo prefiero la 2»): un tipo admite varias clases de tercero.

El aviso de origen (idea 491): el tipo «Comunicación recibida» está ligado a terceros de «Otros» y
ha llegado un comunicado de una Administración.

## Lo que entendió Claude (aprobado por Francisco el 30-oct-2026)

- En los Ajustes de un tipo de asunto se marcan las clases de tercero permitidas: una o varias.
- Al crear un asunto de ese tipo, quien lo usa elige al tercero entre esas clases (nunca de otra:
  con Otros y Administraciones, un alumno no sale).
- Desaparece la clase única de cada tipo; los tipos de hoy se quedan con la suya como única
  permitida.

## Pantalla de prueba (aprobada el 30-oct-2026)

- `docs/pantallas/493.html` · https://claude.ai/artifact/MNZ2bjRi54vCFPXdHqRKP3
- **Ajustes de un tipo, «Datos del tipo»**: la fila «Categoría» pasa a **«Clases de tercero»**, con
  una casilla por clase (Alumnado, Tutores legales, Personal, Empresas, Otros, Administraciones). Se
  guarda al cambiar, sin botón. La última marcada no se puede desmarcar (casilla apagada): un tipo
  tiene siempre al menos una. La marca de la cabecera junto al nombre del tipo enseña todas sus
  clases.
- **Nuevo asunto, tipo elegido primero**: las pastillas de clase son solo las permitidas para ese
  tipo, y el buscador busca solo en ellas. Ninguna pastilla pulsada: salen terceros de todas las
  permitidas. Pulsar una la fija (se colorea y solo salen de esa); pulsarla otra vez la suelta.
  **No hay pastilla «Todas»** (Francisco la quitó: en la app no existe). Encima, la línea
  «<TIPO> admite: Otros · Administraciones.»
- **Nuevo asunto, persona elegida primero**: la parrilla de tipos enseña los tipos que admiten su
  clase (por ejemplo, una Administración ve «Comunicación recibida» si ese tipo tiene marcada
  Administraciones). Cada botón de tipo lleva debajo sus clases.
- Lo comprobó Francisco: con Administraciones marcada en «Comunicación recibida», al elegir el tipo
  encuentra a la Delegación Territorial y al Ayuntamiento; Administraciones pulsada una vez solo
  enseña Administraciones, y pulsada otra vez vuelven Administraciones y Otros.

## Qué NO se hace en esta tarea

- Que «Cambiar el asunto» deje de avisar (aviso ámbar) cuando el tercero es de una clase permitida
  del tipo: idea aparte, fila 494. Aquí el aviso se queda como hoy, comparando con la primera clase
  del tipo.
- Nada cambia en el Archivo ni en los asuntos ya creados.
- No se añade la pastilla «Todas».

## Notas técnicas de Claude

- Hoy cada tipo guarda `categoria` (texto). Pasa a `categorias` (lista, en el orden de
  `Nombres.CATEGORIAS`), y `categoria` se mantiene igual a la primera de la lista para todo lo que
  ya la lee (96 usos en `js/`; mirar con `grep -rn "\.categoria\b" js`). Al cargar un tipo sin
  `categorias`, se rellena con `[categoria]`: nada que migrar a mano, y el otro ordenador con una
  versión vieja sigue leyendo `categoria`.
- `Nombres.categoriaDeTipo` sigue devolviendo la primera; añadir `Nombres.categoriasDeTipo` (lista)
  y usarla donde se decide **qué se puede elegir**: `App.pintarCategorias` y `App.pulsarCategoriaNuevo`
  (`js/asuntos-nuevo.js`), la parrilla (`categoriaDeLaParrilla`, `App.pintarTipos`: un tipo entra si
  su lista incluye la clase), `App.buscarEnCategorias`, el contador «N tipos» de cada pastilla, y
  `App.fijarTercero` (un tipo se olvida solo si su lista no incluye la clase del tercero).
- **La clase guardada en el asunto (`ficha.categoria`) es la del tercero elegido**, no la del tipo:
  hoy sale del tipo (`js/asuntos-editar.js`, línea ~403, y el alta de «Nuevo asunto»). Es la que
  decide la carpeta del Archivo (`[ficha.categoria, ficha.tercero]`), así que un asunto de una
  Administración se archiva con las Administraciones. Leer un nombre de carpeta
  (`js/nombres.js`, candidatos de tipo con su categoría) no puede deducir ya la clase solo del tipo:
  tomarla de la ficha cuando la haya.
- Ajustes: `construirSeccionDatos` (`js/ajustes-tipo.js`) y la marca `#tipo-asunto-categoria`
  (una marca por clase). Guardado por la vía de siempre de los tipos (`ColaGuardado`). Al crear un
  tipo al vuelo o desde «Buscar o crear», nace con `categorias: [la elegida]`. «Unir con otro tipo»
  (`js/tipos-unir.js`) se queda las clases del que se queda.
- Datos de demostración: «COMUNICACION RECIBIDA» con solo Otros, como en la pantalla.
- Prueba nueva `pruebas/varias-clases-de-tercero.mjs` con los puntos de abajo.

## Cómo lo comprueba el segundo revisor

1. Ajustes → un tipo → «Datos del tipo»: sale «Clases de tercero» con seis casillas y solo la suya
   marcada; la marcada única está apagada.
2. Marcar Administraciones en «COMUNICACION RECIBIDA»: la cabecera enseña Otros y Administraciones;
   recargando, sigue marcada.
3. Nuevo asunto → elegir «COMUNICACION RECIBIDA»: solo salen las pastillas Otros y
   Administraciones, la línea «… admite: Otros · Administraciones.» y en el buscador terceros de las
   dos; un alumno no sale aunque se escriba su nombre.
4. Pulsar Administraciones: solo Administraciones. Pulsarla otra vez: vuelven las dos. No hay
   pastilla «Todas».
5. Nuevo asunto → elegir primero una Administración: «COMUNICACION RECIBIDA» sale en la parrilla, y
   cada tipo lleva debajo sus clases.
6. Crear el asunto con esa Administración: se crea, y su ficha dice que el tercero es de
   Administraciones (no de Otros).
7. Un tipo de una sola clase (por ejemplo, de Alumnado) se comporta como hoy en «Nuevo asunto».

## Revisión y respuestas durante el trabajo

- Segundo revisor (30-oct-2026, otro ayudante sin ver el código; app de demostración en Chromium):
  - 1 Ajustes, seis casillas, solo Otros marcada y apagada: coincide.
  - 2 Marcar Administraciones, cabecera «OTROS · ADMINISTRACIONES»: coincide. «Sigue marcada al recargar»: no lo ha podido ver (la demo no guarda); lo cubre la prueba `pruebas/varias-clases-de-tercero.mjs` (se relee de tipos.json y al reabrir el tipo).
  - 3 Nuevo asunto con el tipo: solo pastillas Otros y Administraciones y la línea «admite»: coincide. Terceros de Otros en la demo: no los ha visto (no hay ninguno con esas letras); la prueba sí, con un Ayuntamiento. Un alumno no sale: coincide.
  - 4 Pulsar/soltar Administraciones, sin «Todas»: coincide. 5 Persona primero, parrilla con clases debajo: coincide. 6 Crear: la ficha dice ADMINISTRACIONES: coincide. 7 Tipo de una clase como hoy: coincide.
  - No coincidía y se corrigió: (a) el orden de las casillas (ahora el de la pantalla de prueba); (b) la marca del título de «Datos del tipo» no se ponía al día al marcar; (c) «Dar de alta» ofrecía clases que el tipo no admite (ahora solo las del tipo).
  - La app hace sin que el texto lo pida: el aviso verde al guardar las casillas (igual que «Reservado»); se deja. Sin tocar, por idea aparte: los contadores por clase de la lista de Ajustes cuentan el tipo solo en su primera clase.
  - No visto por el revisor: la persistencia al recargar (cubierta por la prueba) y los nombres exactos de Francisco (Delegación Territorial, Ayuntamiento).
