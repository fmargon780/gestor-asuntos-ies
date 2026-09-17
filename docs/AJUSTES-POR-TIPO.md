# Ajustes: el tipo de asunto, en una sola pantalla

Acordado con Francisco el 17 de septiembre de 2026. Es la fila 39 de `docs/COLA.md`.

## El problema

La ventana de Ajustes ha crecido hasta ser inmanejable. Seis cosas cuelgan del tipo de asunto
—campos, pasos de la guía, plantillas de correo, plantillas de Word, días de plazo y
recurrencia— y hoy cada una vive en un bloque distinto de la pantalla. Para dejar un tipo
terminado hay que entrar y salir de seis sitios, y en ninguno de ellos se ve el tipo entero.

## Lo que hay que conseguir

Ajustes pasa a tener **tres pestañas** en lo alto: **Tipos de asunto** · **El centro** ·
**Mantenimiento**. Y el tipo de asunto pasa a tener **pantalla propia**, con todo lo suyo dentro.

### Pestaña 1: Tipos de asunto

Es lo que ya hay hoy, sin perder nada: el desplegable y las cuatro pestañas de categoría
(ALUMNADO · PERSONAL · EMPRESAS · OTROS) con su cuenta, la rejilla de tarjetas, el buscador
cruzado, el aviso en vivo de nombres repetidos al escribir uno nuevo, y la categoría recordada
en `localStorage`.

Cambia una sola cosa: **pulsar una tarjeta abre la pantalla del tipo**. El menú de tres puntos de
la tarjeta se queda con Cambiar el nombre y Quitar; la entrada "Campos" desaparece de ahí,
porque los campos ya están dentro de la pantalla del tipo.

### La pantalla de un tipo de asunto

Pantalla entera, no cuadro emergente. Arriba, el nombre del tipo, su categoría y un botón de
volver a la lista (y Escape, como en el resto de la aplicación). Debajo, **dos columnas** que se
vuelven una sola por debajo de 1000 píxeles, con estas siete secciones, todas a la vista, sin
plegar:

| Sección | Qué lleva | Quién lo hace hoy |
|---|---|---|
| Datos del tipo | Nombre, categoría | `js/ajustes.js` |
| Campos | Los campos del tipo, en orden, con Obligatorio y Añadir al nombre, y el catálogo debajo con su buscador | `App.abrirCamposDeTipo`, `js/campos.js` |
| Pasos del trámite | La guía del tipo, con sus preguntas y bifurcaciones | `js/guias-enganche.js`, `js/guias.js` |
| Plantillas de correo y de Séneca | Las plantillas pegadas a este tipo, con su editor de huecos | `js/plantillas-ajustes.js` |
| Plantilla de documento de Word | El `.docx` colgado de este tipo y su tipo de documento | `js/plantillas-ajustes.js` |
| Plazo | Los días de plazo por defecto del tipo | `js/ajustes.js` |
| Se repite | La recurrencia de este tipo: cada cuánto, qué día y para qué tercero. Varias filas si son varios terceros | `js/recurrentes.js` |

**Los editores no se reescriben.** Cada sección llama al editor que ya existe y lo pinta dentro
de su hueco de la pantalla del tipo, en vez de abrirlo como cuadro suelto. Si un editor solo sabe
vivir dentro de `U.preguntar`, se le saca la parte que pinta a una función que reciba el elemento
donde pintarse, y el cuadro pasa a llamar a esa misma función. Nada de duplicar lógica: si
aparece copiada, es que está mal hecho.

**Lo que se comparte, avisa.** Un campo propio y una plantilla pueden estar en uso en otros
tipos. Al cambiarlos desde la pantalla de un tipo, sale una línea ámbar que dice en cuántos tipos
más se usan (`Campos.tiposQueUsanPropio` ya lo sabe), sin bloquear nada. Borrar sigue pidiendo
confirmación, como hoy.

**Crear sobre la marcha.** Desde la sección Campos se puede crear un campo propio nuevo sin salir
de la pantalla del tipo: se guarda en el catálogo general y queda enganchado a este tipo. Lo mismo
con una plantilla de correo nueva.

### Pestaña 2: El centro

Las listas que valen para todos los tipos, cada una en su bloque:

- Estados de tramitación, con sus flechas de orden.
- Tipos de documento.
- Catálogo de campos propios (verlos todos, crear y borrar, con aviso de en qué tipos se usan).
- Grupos de personas (`js/grupos.js`).
- Responsables y días no lectivos de los hitos (`js/hitos-ajustes.js`).
- Datos del centro y firma: `firma`, `centro`, `localidad`, `direccion`, `codigo`, `cargo`.

El aviso en vivo de nombre repetido de estados y tipos de documento (`App.pintarAvisoSimple`) se
queda tal cual.

### Pestaña 3: Mantenimiento

Lo que no relaciona nada con nada: carpetas señaladas de este ordenador y nombre de usuario,
carpeta de la bandeja de correo, aviso de `RegAlum.csv` viejo, copias de seguridad, papelera,
conflictos de Dropbox, duplicados descartados y fichas sin carpeta. Se mueven enteros, sin tocar
por dentro.

## Cómo tiene que verse

- Ajustes conserva su tope de 1600 píxeles. La pantalla del tipo usa todo ese ancho.
- Página densa: nada de renglones estrechos con hueco a los lados. El título de una sección
  termina en el mismo borde que su texto.
- Se entra y se sale de la pantalla del tipo sin que la lista pierda la categoría ni el buscador.
- La pestaña abierta se recuerda en `localStorage`, como ya se recuerda la categoría.

## Los ficheros

`js/ajustes.js` pasa de 52 KB, así que **hay que partirlo** (regla del ahorro de cuota):

- `js/ajustes.js` — se queda solo con el marco: las tres pestañas, la lista de tipos y el
  buscador cruzado.
- `js/ajustes-tipo.js` — **nuevo**: la pantalla de un tipo de asunto y sus siete secciones.
- `js/ajustes-centro.js` — **nuevo**: la pestaña El centro.
- `js/ajustes-mantenimiento.js` — **nuevo**: la pestaña Mantenimiento.

También se tocan: `index.html` (el HTML de Ajustes y el orden de los `<script>`, que importa para
las envolturas) y `css/ajustes.css`.

Se llaman, pero **no se reescriben**: `js/campos.js`, `js/plantillas-ajustes.js`,
`js/guias-enganche.js`, `js/recurrentes.js`, `js/grupos.js`, `js/hitos-ajustes.js`,
`js/conflictos.js`, `js/copias.js`, `js/papelera.js`, `js/duplicados.js`,
`js/fichas-huerfanas.js`, `js/frescura.js`.

Pruebas: actualizar `pruebas/ajustes-agil.mjs` (sigue a 1905 píxeles) y añadir
`pruebas/ajustes-por-tipo.mjs`, que abre un tipo, comprueba que sus siete secciones están, cambia
algo en dos de ellas y vuelve a la lista sin perder la categoría.

## Cómo trabajarlo

- Cambios quirúrgicos: mover y envolver lo que ya existe, no reescribir módulos.
- No leer el repositorio entero: `docs/CONTEXTO.md`, `js/ajustes.js` y los módulos de la lista
  de arriba bastan.
- Antes de colgar una función nueva de `App`, comprobar que el nombre no está cogido.
- Una sola pasada de pruebas al final, no una comprobación por cambio.
- Subir directo a `main`, sin abrir ninguna petición de cambios. Si esta sesión obliga a trabajar
  con pull request, fusionarlo en cuanto esté en verde, según el permiso permanente del final de
  `docs/COLA.md`.
- Al terminar: comprobar lo publicado con `curl`, y actualizar `docs/CONTEXTO-CORTO.md` y
  `docs/CONTEXTO.md` sustituyendo la línea vieja, más la nota en `docs/HISTORIA.md`.

## Nada que preguntarle a Francisco

El diseño está cerrado. Las tres decisiones que tomó el 17-sep-2026: la recurrencia va dentro de
la pantalla del tipo; la pantalla del tipo es entera y a dos columnas, no un cuadro emergente; y
Ajustes queda con tres pestañas.
