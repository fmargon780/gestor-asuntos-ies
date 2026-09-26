# Ajustes de un tipo de arriba abajo, y la pestaña «Herramientas» (fila 184)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Segunda parte de la «tanda 3» del análisis
de usabilidad (`claude/Analisis-usabilidad-2026-09-26.md`, propuesta P6). **Va después de la fila
183.**

Idea de fondo: la pantalla de un tipo tiene ocho secciones plegadas, cuatro formas de guardar y
dependencias que no se ven hasta que algo falla. Y en Ajustes viven cosas de uso diario que no son
ajustes.

## Ficheros que se tocan

- `js/ajustes-tipo.js` (466 líneas: partir antes; puntos 1, 2 y 3), `js/ajustes-plegado.js`
- `js/ajustes-tipo-palabras-clave.js`, `js/campos.js`, `js/campos-catalogo.js`,
  `js/campos-calculados-editor.js` (punto 2: guardar al cambiar; punto 5: campos en un sitio)
- `js/ajustes-centro.js` (punto 5: «Campos propios» pasa a enlace; punto 6: juntar copias y días)
- `js/ajustes-mantenimiento.js` (punto 6)
- `js/guias-documentos.js`, `js/guias-comunicacion.js`, `js/guias-paso-bloques.js`,
  `js/guias-guion.js` (punto 4)
- `js/barra.js`, `index.html`, `js/ajustes.js` (punto 7: la pestaña «Herramientas»)
- `js/papelera-ajustes.js`, `js/traer-datos.js`, `js/tablas-datos-pantalla.js`, `js/copias.js` y
  el bloque de restaurar (punto 7: se mueven de pantalla, no cambian por dentro)
- `js/guias-editor.js` (punto 8: el texto desfasado)
- `docs/contexto/CAMPOS-Y-TIPOS.md`, `docs/contexto/PANTALLA.md`
- Una prueba nueva en `pruebas/`

No leas el repositorio entero. Cambios quirúrgicos.

## Qué hay que hacer

### 1. Una lista de comprobación arriba de la pantalla del tipo

Siempre visible, encima de las secciones, con una línea por cosa y una casilla marcada o vacía:

- ☑ Nombre corto
- ☐ Quién lo encarga
- ☐ Guía (N hitos)
- ☐ Plantilla de documento — solo si algún hito de la guía tiene la tarea «Generar un documento»; si
  falta la plantilla, dice «el hito 2 la necesita»
- ☐ Plantilla de correo — solo si algún hito tiene «Comunicar» o «avisar a quien lo pide»
- ☑ Plazo
- ☐ Palabras clave (para que la bandeja acierte el tipo)
- ☐ Plazo de conservación

Cada línea es un enlace: abre la sección que toca y la despliega. Las que no aplican no salen. Si
todo está marcado, la lista se pliega sola en una línea verde «Este tipo está completo». Se calcula
al pintar y tras cada guardado.

### 2. Una sola forma de guardar en la pantalla del tipo

Todo se guarda **al cambiar**, con el aviso verde de siempre, como ya hacen «Datos del tipo» y
«Plazo». Desaparecen los botones «Guardar campos» y «Guardar palabras clave»; los cuadros de crear
(plantilla, recurrente, hito) conservan su «Crear», porque son altas. La doble confirmación de la
guía con biblioteca se queda: es una decisión, no un guardado.

### 3. El plazo del tipo, en un solo sitio

Se queda en «Datos del tipo». Se quita de la tarjeta de la parrilla de tipos (la tarjeta lo enseña,
pero no lo edita).

### 4. En cada hito de la guía, un solo sitio para documentos y comunicaciones

Las secciones «Documentos de este paso» y «Comunicación de este paso» desaparecen del editor del
paso. Su contenido pasa a **tareas** del hito: cada plantilla marcada se convierte en una tarea
«Generar un documento → plantilla X»; el texto de comunicación, en una tarea «Comunicar → plantilla
Y» (si no había plantilla, se crea una con ese texto, con el nombre del hito). La conversión se
hace **al abrir el editor** de cada paso que aún tenga esas secciones, sin preguntar, y se guarda
con la guía. Los asuntos abiertos no cambian. `HitosBiblioteca.CAMPOS_COMPARABLES` deja de comparar
esos dos campos.

### 5. Los campos, en un solo sitio

El panel «+ Añadir campo» del tipo (tres pestañas: del tipo, propios, calculados) es el único sitio.
«Campos propios» de El centro se queda como una línea con un enlace «Se configuran dentro de cada
tipo». «Campos del nombre» de Tipos de documento no se toca (es otra cosa: el nombre del fichero).

### 6. Juntar lo que va junto en El centro

«Caducidad de las copias» (El centro) y «Copias de seguridad» (Mantenimiento) pasan a una sola
sección «Copias de seguridad» en El centro. «Asuntos dormidos (días)» y «Avisos de vencimiento
(días)» pasan a una sola sección «Días de aviso» en El centro.

### 7. La pestaña «Herramientas»

- Nueva pestaña en el menú lateral, **justo encima de «Ajustes»** (el orden de la fila 181 se queda
  igual por arriba): **Inicio · Nuevo asunto · Archivo · Personas y empresas · Impresos · Cuentas ·
  Herramientas**, línea, **Ajustes**.
- Contiene, en este orden, tal cual están hoy (se mueven los bloques, no se reescriben):
  **Papelera**, **Traer el alumnado** (ficheros de Séneca y datos de la BD de alumnado), **Tablas de
  datos**, **Restaurar una copia de seguridad**. Cada uno con su título y plegado como hoy.
- En Ajustes desaparecen de donde estaban; si algún enlace de la app llevaba allí («Ver la
  papelera», el aviso de papelera vieja, el de alumnado desfasado), ahora lleva a Herramientas.
- Ajustes se queda con: Tipos de asunto, Tipos de documento, El centro, Hitos (biblioteca y
  ajustes), Mantenimiento (lo que sea mantenimiento de verdad: conflictos, fichas sin carpeta,
  cargar plantillas del centro, ordenar el archivo).

### 8. El texto desfasado

En el editor de la guía, quitar «Dentro de cada asunto salen con una casilla para ir marcando lo que
ya está hecho» (era de antes de los hitos). En su lugar: «Cada hito de la guía es un hito del
asunto, con sus tareas».

## Lo que no se hace

- No se cambia ningún dato ni ningún fichero de `_GESTOR` salvo la conversión del punto 4 en
  `guias.json`.
- No se toca la biblioteca de hitos más allá de los campos comparables.

## Prueba

Prueba de navegador: un tipo recién creado enseña la lista con «Nombre corto» marcado y lo demás
vacío; añadir una guía con «Generar un documento» hace aparecer «Plantilla de documento — el hito 1
la necesita»; cambiar una palabra clave guarda sin botón; la pestaña «Herramientas» existe con los
cuatro bloques y Ajustes ya no los tiene; abrir un paso con «Documentos de este paso» lo convierte
en una tarea. `npm test` entero al final.

## Al terminar

`docs/contexto/CAMPOS-Y-TIPOS.md` (lista de comprobación, guardar al cambiar, campos en un sitio),
`docs/contexto/PANTALLA.md` (menú con Herramientas), `docs/contexto/HITOS-Y-GUIAS.md` (fuera
«Documentos de este paso» y «Comunicación de este paso»), `docs/CONTEXTO-CORTO.md` sección 5.
Entrada en `docs/HISTORIA.md`. Sube directamente a `main`, sin pull request, en como mucho dos
subidas.
