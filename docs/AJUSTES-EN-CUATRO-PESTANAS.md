# Ajustes en cuatro pestañas, con buscador (fila 288)

Cerrado con Francisco el 6-oct-2026. Primera de tres filas del mismo diseño: después van la 291
(`docs/PROBLEMAS-CON-SU-SOLUCION.md`) y la 292 (`docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md`).

## Qué pasó

Francisco lleva varios días usando Ajustes y escribió: «el módulo de ajustes es un caos […] me
cuesta encontrar las opciones. En los avisos no sé qué hacer».

Hoy Ajustes tiene unas cuarenta secciones en tres pestañas («Tipos de asunto», «El centro»,
«Mantenimiento»), sin buscador y sin un criterio de reparto:

- Lo que es de «este ordenador» está en dos pestañas distintas.
- «Impresos» sale en tres sitios. El alumnado, en cuatro.
- «Herramientas» es a la vez una pantalla del menú y una sección de Mantenimiento.
- «Campos propios» es una sección vacía, con solo un enlace.
- Los avisos de fallo están mezclados con secciones de configuración.

## Qué quiere Francisco

Encontrar cualquier opción sin tener que saber dónde está. Que el reparto responda a «a qué
vengo», no a cómo se fue construyendo la aplicación.

## Qué hay que hacer

### 1. Las cuatro pestañas

En este orden, con estos nombres exactos:

1. **Lo de cada día**
2. **El centro**
3. **Este ordenador**
4. **Problemas**

Desaparece la pestaña «Mantenimiento». La pestaña que se recuerda en el ordenador sigue
recordándose; si lo recordado era «Mantenimiento», se abre «Lo de cada día».

Debajo de las pestañas, una línea gris que dice para qué es cada una:

- Lo de cada día: «Lo que se cambia a menudo. Vale para todos los ordenadores del centro.»
- El centro: «Lo que se pone una vez, o una vez por curso. Vale para todos los ordenadores del centro.»
- Este ordenador: «Lo de esta pestaña se guarda solo en este ordenador. En otro ordenador hay que
  ponerlo otra vez.»
- Problemas: «Lo que la aplicación ha encontrado mal y hay que arreglar.»

### 2. Qué va en cada pestaña

Cada sección, entera, en un solo sitio. El orden es el de la lista. Todas siguen plegadas, con su
resumen en el título, como hoy.

**Lo de cada día**

1. Los tipos de asunto: las pastillas de categoría, el buscador y la rejilla, como hoy, sin plegar,
   bajo el título «Tipos de asunto».
2. Tipos de documento.
3. Grupos de personas.
4. Biblioteca de hitos.
5. Quién encarga cada tipo.

**El centro**

1. Datos del centro y firma.
2. Cargos del centro.
3. Quién usa la aplicación (la crea la fila 287; si existe, va aquí).
4. Membrete.
5. Sello y firma en el papel.
6. Calendario y responsables. Es la sección que hoy se llama «Hitos» (responsables, festivos y días
   no lectivos). Cambia de nombre para no confundirla con «Biblioteca de hitos».
7. Días de aviso. El campo que se guarda solo en este ordenador lleva al lado «(solo en este
   ordenador)».
8. Copias de seguridad. Debajo de la caducidad, un enlace «Restaurar una copia» que lleva a
   Herramientas → «Restaurar una copia de seguridad».
9. Impresos. Una sola sección: lo que hoy hay en «El centro» (qué casilla recibe qué dato) y, dentro,
   lo que hoy hay en Mantenimiento → Herramientas → «Impresos» (poner al día el catálogo).
10. Alumnado y personal. Una sola sección que lleva dentro, en este orden: «Ficheros de datos»,
    «Aviso de fichero de alumnado viejo» y «Cómo se abrevia cada grupo». Arriba, dos enlaces:
    «Traer el alumnado» (lleva a Herramientas) y «Carpeta de la base de datos de alumnado» (lleva
    a «Este ordenador»).
11. Buzón de soporte.

**Este ordenador**

1. Carpetas de este ordenador (con la casilla «En este ordenador, solo consultar»).
2. Rutas de las carpetas. La parte que vale para todo el centro lleva al lado «(para todo el
   centro)».
3. Largo de las rutas.
4. Carpeta de la base de datos de alumnado.
5. Bandeja de correos.
6. Enviar correo.
7. El ayudante de Séneca.

**Problemas**

Las secciones de fallo que hoy suben arriba en «Mantenimiento», tal como están: «Conflictos de
Dropbox», «Fichas sin carpeta», «Hitos huérfanos», «Envolturas de la aplicación» y «Plazo de
conservación cumplido». Cada una se ve solo si tiene algo, igual que hoy.

- Si no hay ninguna a la vista, la pestaña dice, en verde: **«Todo en orden. No hay nada que
  arreglar.»**
- Si hay alguna, el botón de la pestaña lleva un punto ámbar.
- El aviso de alumnado viejo: su sección ya no sube ni se abre sola (ahora vive en «El centro»).
  Mientras haya aviso, en «Problemas» sale una línea ámbar con el mismo texto de hoy y un botón
  «Verlo», que lleva a esa sección.

El contenido de cada problema no se reescribe aquí: es la fila 291.

### 3. Lo que sale de Ajustes

Pasan a la pantalla **Herramientas** del menú, debajo de lo que ya tiene, bajo un título nuevo
**«Puesta a punto y reparaciones»** con la línea gris «Botones que se pulsan muy de vez en
cuando.». En este orden:

1. Plantillas del centro.
2. Cargar tipos, guías y tareas del instituto. Es la sección que hoy se llama «Biblioteca del
   centro»; cambia de nombre para no confundirla con «Biblioteca de hitos».
3. Poner en orden las fichas del ARCHIVO.
4. Guardar el contacto de los asuntos abiertos.
5. Versiones previas.
6. Duplicados descartados.
7. Pasar a Administraciones.
8. Borrados que se fusionan.

Desaparecen:

- La sección «Herramientas» de dentro de Ajustes (el contenedor): ya no hay dos cosas con ese
  nombre.
- La sección «Campos propios» de «El centro» (estaba vacía).

Nada de esto cambia lo que hace cada sección: solo dónde está y, en los tres casos dichos, cómo se
llama.

### 4. El buscador

- Una caja «Buscar en Ajustes…», en la misma línea que las pestañas, a la derecha. Ocupa el ancho
  que quede libre.
- Busca al escribir, sin acentos ni mayúsculas, por palabras sueltas en cualquier orden
  (`U.normalizar`).
- Busca en: el título de cada sección, su línea gris, los rótulos de los campos y botones que lleva
  dentro, y una lista de **otras palabras** por sección (apartado 5).
- También encuentra lo que **no está en Ajustes** pero se suele buscar aquí: las secciones de la
  pantalla Herramientas y las secciones de la pantalla de un tipo de asunto.
- Los resultados salen en una lista debajo de la caja, por encima de la pestaña. Cada línea:
  **título de la sección** · dónde está («El centro», «Este ordenador», «Herramientas», «Dentro de
  cada tipo de asunto»). Como mucho diez.
- Pulsar un resultado (o Intro con el primero): va a su pestaña, abre la sección, la deja a la vista
  y la resalta un momento. Si el resultado es de Herramientas, va a esa pantalla y abre su sección.
  Si es de «Dentro de cada tipo de asunto», va a «Lo de cada día» y enseña la línea «Se pone dentro
  de cada tipo: pulsa un tipo y busca «<sección>».»
- Sin resultados: «Nada con ese nombre. Prueba con otra palabra.»
- Esc o borrar la caja: la lista se quita y la pestaña queda como estaba.
- No sustituye a los buscadores de tipos de asunto y de tipos de documento, que siguen igual.

### 5. Las otras palabras de cada sección

Para que se encuentre por la palabra que usa Francisco y no solo por el título. Lista de partida;
la sesión la completa leyendo cada sección:

| Sección | Otras palabras |
|---|---|
| Datos del centro y firma | nombre del instituto, código, dirección, localidad, provincia, firma |
| Cargos del centro | director, secretaria, jefatura, quién firma |
| Membrete | logo, cabecera, Junta, Consejería |
| Sello y firma en el papel | tamaño, centímetros, sello de registro |
| Calendario y responsables | festivos, días no lectivos, vacaciones, responsables, plazos, hitos |
| Días de aviso | dormidos, vencimiento, antelación, papelera, registro |
| Copias de seguridad | copia, restaurar, recuperar, caducidad |
| Impresos | casillas, PDF, anexo, catálogo |
| Alumnado y personal | RegAlum, RelPerCen, Séneca, CSV, fichero viejo, épocas, grupos, unidades |
| Buzón de soporte | soporte, avisos, mejoras, dirección del buzón |
| Carpetas de este ordenador | Dropbox, abiertos, ARCHIVO, señalar carpetas, solo consultar |
| Rutas de las carpetas | ruta, copiar ruta, dónde está Dropbox |
| Bandeja de correos | Gmail, Drive, correos que llegan, etiqueta GESTOR |
| Enviar correo | Gmail, script, enviar, cuenta |
| El ayudante de Séneca | marcador, favoritos, mensaje de Séneca |
| Papelera (Herramientas) | borrados, recuperar |
| Plantillas de correo y de Séneca (dentro de cada tipo) | plantilla, correo, mensaje |
| Plantilla de documento de Word (dentro de cada tipo) | plantilla, Word, documento, certificado |
| Guía (dentro de cada tipo) | hitos, tareas, procedimiento |
| Campos (dentro de cada tipo) | campos propios, campo calculado, importe |
| Plazo (dentro de cada tipo) | días, vencimiento |
| Al terminar el asunto (dentro de cada tipo) | por liquidar, archivar, avisar |
| Se repite (dentro de cada tipo) | recurrente, cada año, cada mes |

### 6. Los saltos que ya existen

Todo lo que hoy lleva a una sección de Ajustes tiene que seguir llegando, aunque haya cambiado de
pestaña o se haya ido a Herramientas: los trozos del cuadro de avisos de Inicio («fichas sin
carpeta», fichero de alumnado), «Arreglarlo» de la comprobación al entrar (sus once filas), el
aviso de «Enviar correo», el enlace de plazo de conservación y cualquier otro.

La comprobación al entrar ya lo resuelve bien: busca la sección, mira en qué pestaña está y la
abre (`llevarA` en `js/comprobacion-entrada.js`). Se saca a un sitio común (por ejemplo
`App.irASeccionDeAjustes(selector)`, mirando antes que el nombre esté libre) y lo usan también el
buscador y los demás saltos, en vez de cada uno con su «ir a Mantenimiento».

## Lo que no cambia

- La pantalla de un tipo de asunto, con su lista de comprobación y sus secciones.
- Lo que hace cada sección y dónde guarda.
- Las cinco secciones que ya tenía la pantalla Herramientas.
- El contenido de los avisos de fallo (fila 291) y sus botones (fila 292).
- Solo consulta: las secciones siguen apagadas igual que hoy, estén donde estén.

## Cómo hacerlo (orientación; decide la sesión)

- Casi treinta módulos cuelgan su sección de `#ajustes-tab-centro` o de
  `#ajustes-tab-mantenimiento`. **No hace falta tocarlos uno a uno**: hoy `js/ajustes-plegado.js`
  ya recoloca cada sección según una tabla (`CENTRO`, `MANTENIMIENTO`, `FALLOS`, `HERRAMIENTAS`).
  Lo mismo, con una sola tabla: sección → pestaña (o Herramientas), orden y otras palabras.
- `js/ajustes-plegado.js` tiene 574 líneas y el tope es 600: el reparto y el buscador van en
  ficheros nuevos, y de `ajustes-plegado.js` sale lo que sobre.
- Una sección que no esté en la tabla (la cuelga un módulo nuevo) no puede quedarse en un
  contenedor que no se ve: va al final de «El centro».
- Lo abierto se recuerda por sección (`gestor-ajustes-plegado`). Si la clave cambia de nombre al
  mudarse, no pasa nada por que la primera vez salga plegada.
- Cambios quirúrgicos. No se reescribe ningún módulo de sección. No leas el repositorio entero:
  con `docs/CONTEXTO.md`, `docs/contexto/PANTALLA.md` y los ficheros de abajo basta.

## Ficheros

- `index.html`: los botones de las pestañas, los contenedores nuevos, la caja del buscador, el
  título «Puesta a punto y reparaciones» en Herramientas; se quita «Campos propios».
- `js/ajustes-reparto.js`: nuevo. La tabla y el reparto.
- `js/ajustes-buscador.js`: nuevo. El buscador.
- `js/ajustes-plegado.js`: deja de ordenar «Mantenimiento» y de crear el contenedor
  «Herramientas»; conserva lo demás.
- `js/ajustes.js`: la lista de pestañas, la pestaña recordada, el salto común.
- `js/ajustes-centro.js`: se quita el enlace de «Campos propios».
- `js/comprobacion-entrada.js`, `js/avisos-que-faltan.js`, `js/frescura.js`, `js/correo-enviar.js`:
  solo el salto.
- `js/hitos-ajustes.js`, `js/cargar-biblioteca.js`: solo el título de su sección.
- `css/ajustes.css`: la línea de pestañas con el buscador, la lista de resultados, el punto ámbar.
- `js/demo/datos.js`: una ficha sin carpeta en los datos de demostración, para que «Problemas»
  tenga algo que enseñar (y la fila 291 la aproveche).
- `pruebas/`: unas treinta pruebas entran en Ajustes por su pestaña (`grep -l
  "ajustes-tab-\|ajustes-pestana\|cambiarPestanaAjustes" pruebas/*.mjs`). Se ponen al día las que
  dependan de la pestaña «Mantenimiento» o del sitio de una sección. Una prueba nueva,
  `pruebas/ajustes-cuatro-pestanas.mjs`: las cuatro pestañas, que cada sección de la tabla está
  en su sitio y solo en uno, que ninguna queda en un contenedor oculto, el buscador (por título,
  por otra palabra, sin acentos, resultado de Herramientas, resultado de dentro de un tipo, sin
  resultados) y «Todo en orden».
- `js/novedades.js`: «Ajustes está ordenado en cuatro pestañas —Lo de cada día, El centro, Este
  ordenador y Problemas— y tiene un buscador arriba. Las reparaciones que se usan muy de vez en
  cuando están ahora en Herramientas.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (la línea de «Ajustes» y la del menú, sustituyendo, sin
  alargar), `docs/contexto/PANTALLA.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que Ajustes tiene cuatro pestañas y un buscador; que nada ha cambiado de lo que
hace cada sección; qué tres secciones han cambiado de nombre; y que las reparaciones están en
Herramientas.

## Cómo sabemos que está bien

En la copia de demostración, entrando por el menú «Ajustes».

1. Abrir Ajustes: hay cuatro pestañas, en este orden: «Lo de cada día», «El centro», «Este
   ordenador», «Problemas». No existe «Mantenimiento».
2. Pulsar cada pestaña: debajo sale su línea gris, distinta en cada una.
3. En «Lo de cada día»: arriba la rejilla de tipos de asunto con su buscador, y debajo, plegadas,
   «Tipos de documento», «Grupos de personas», «Biblioteca de hitos» y «Quién encarga cada tipo».
4. En «El centro»: las secciones salen en el orden del apartado 2. Existe «Calendario y
   responsables» y no existe ninguna que se llame solo «Hitos». No existe «Campos propios».
5. Abrir «Impresos» en «El centro»: dentro están las casillas de cada impreso y el botón de poner
   al día el catálogo. En ninguna otra pestaña de Ajustes hay otra sección «Impresos».
6. Abrir «Alumnado y personal»: dentro están «Ficheros de datos», «Aviso de fichero de alumnado
   viejo» y «Cómo se abrevia cada grupo», y arriba los enlaces «Traer el alumnado» y «Carpeta de
   la base de datos de alumnado». Pulsar cada enlace: lleva a su sitio.
7. En «Este ordenador»: están las siete secciones del apartado 2 y ninguna más.
8. En «Problemas», con los datos de demostración: sale «Fichas sin carpeta» con una ficha, y el
   botón de la pestaña lleva un punto ámbar.
9. Quitar esa ficha con su botón: la pestaña pasa a decir «Todo en orden. No hay nada que
   arreglar.» y el punto ámbar desaparece.
10. Abrir el menú «Herramientas»: debajo de lo de siempre está el título «Puesta a punto y
    reparaciones» con sus ocho secciones. Existe «Cargar tipos, guías y tareas del instituto».
11. Volver a Ajustes y escribir «festivos» en «Buscar en Ajustes…»: sale «Calendario y
    responsables · El centro». Pulsarlo: se abre «El centro» con esa sección abierta y a la vista.
12. Escribir «logo»: sale «Membrete · El centro». Escribir «dropbox»: sale al menos «Carpetas de
    este ordenador · Este ordenador».
13. Escribir «papelera»: sale un resultado de «Herramientas». Pulsarlo: abre la pantalla
    Herramientas con la Papelera abierta.
14. Escribir «plantilla»: sale al menos un resultado «Dentro de cada tipo de asunto». Pulsarlo:
    queda «Lo de cada día» a la vista con la línea que dice que se pone dentro de cada tipo.
15. Escribir «zzzz»: «Nada con ese nombre. Prueba con otra palabra.» Pulsar Esc: la lista se quita.
16. Pulsar la marca de comprobación de la barra lateral y, en una fila con «Arreglarlo», pulsarlo:
    lleva a su sección, abierta, en la pestaña que le toca ahora.
17. Dejar abierta una sección, salir a Inicio y volver a Ajustes: sigue en la misma pestaña y con
    esa sección abierta.
