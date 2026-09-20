# Fila 83 · Las plantillas de documento y de correo del centro

Acordado con Francisco el 20-sep-2026. **Sube directamente a `main`, sin abrir ninguna petición
de cambios.** Cambios quirúrgicos, sin leer el repositorio entero, y una sola pasada de pruebas
al final.

**Esta fila va después de la 81 y de la 82**, y las necesita: usa los cargos, el membrete y los
formularios que aquellas montan.

Lee antes `docs/CONTEXTO.md`, `docs/contexto/DOCUMENTOS-PDF.md` (plantillas de Word),
`docs/contexto/CORREO-Y-SENECA.md` (plantillas de correo y de Séneca) y los tres documentos de
contenido de la fila 80: `docs/contenido/BIBLIOTECA-ALUMNADO.md`,
`docs/contenido/BIBLIOTECA-PERSONAL.md` y `docs/contenido/BIBLIOTECA-EMPRESAS-Y-OTROS.md`.

---

## Por qué

La fila 17 montó la máquina de plantillas de documento, y la 14 la de correo. Las dos están
vacías: no hay ni un texto escrito. La fila 80 llenó la biblioteca de hitos, así que ahora hay
55 tipos de asunto con sus pasos, su normativa y lo que hay que reunir en cada uno — pero cuando
llega el momento de escribir el papel o el correo, sigue sin haber nada.

Esta fila escribe esos textos y los mete en la aplicación sin que Francisco tenga que subir
ficheros a mano.

---

## Parte 1 · De dónde salen los `.docx`

Hoy Francisco tiene que dejar a mano los `.docx` en `_GESTOR/PLANTILLAS`. Eso se acaba.

- Las plantillas viven **en el repositorio**, en `plantillas/`, como ficheros de texto
  (`.md`) con su cuerpo escrito, no como `.docx` binarios. Así se leen, se corrigen y se
  versionan como cualquier otro documento.
- Un script, **`scripts/hacer-plantillas.mjs`**, convierte cada `.md` en un `.docx`, y lo deja en
  la misma carpeta `plantillas/`. Monta el `.docx` a mano (es un ZIP, como ya hace `js/docx.js`
  para leerlos), con lo mínimo que Word necesita: `[Content_Types].xml`, `_rels/.rels`,
  `word/document.xml`, `word/styles.xml` y `word/_rels/document.xml.rels`. Sin imágenes: el
  membrete lo mete la aplicación al generar (fila 81).
  - Formato del `.md` de una plantilla: **frontmatter** con `nombre`, `tipo`, `categoria`,
    `tipoDocumento`, `texto`, `firmante` y `vistoBueno`; debajo, el cuerpo.
  - Marcas que entiende el script: `# ` título, `## ` subtítulo, línea vacía = párrafo,
    `- ` lista, `> ` bloque a la derecha (para la fórmula de firma), y `---` salto de línea
    grueso. Nada más: no hace falta un conversor de Markdown completo.
  - El script se ejecuta a mano (`node scripts/hacer-plantillas.mjs`) y deja los `.docx` en el
    repositorio. **No se ejecuta en Vercel ni en las pruebas.**
- **`plantillas/indice.json`**: la lista de todas, con sus datos del frontmatter y el nombre del
  `.docx`.
- En **Ajustes → Mantenimiento**, botón nuevo **"Cargar las plantillas del centro"**: lee
  `plantillas/indice.json` del propio sitio web, descarga cada `.docx`, lo escribe en
  `_GESTOR/PLANTILLAS` con `Carpetas.escribirBytes`, y da de alta su fila en `plantillas.json`.
  **Fusiona y no pisa**: si ya hay una plantilla con ese mismo `nombre` y `tipo`, la deja como
  está y lo dice. Al terminar, un resumen: cuántas nuevas, cuántas ya estaban.
  Mismo patrón que "Cargar la biblioteca del centro" de la fila 80.

## Parte 2 · Qué plantillas se escriben

**Una plantilla de documento** por cada tipo de asunto de la biblioteca cuyo trámite produzca un
papel del centro (los que en la biblioteca llevan un hito con un documento que emite el
instituto). **Una plantilla de correo** por cada tipo cuyo trámite se comunique a la familia, al
personal o a una empresa.

No hay que inventar tipos: sal de `docs/contenido/BIBLIOTECA-*.md` y escribe para los que ya
están. Si un tipo no produce papel ni correo, no lleva plantilla, y no pasa nada.

### Reglas de redacción

Estas reglas valen para todas. Francisco las revisará leyendo, no probando.

1. **Castellano administrativo llano.** Frases cortas. Nada de "en virtud de lo anteriormente
   expuesto" si basta con "por lo anterior".
2. **Siempre se cita la norma** que ampara el trámite, con su nombre completo la primera vez, y
   el artículo concreto. La cita sale de la normativa que la fila 79 ya puso en cada hito: úsala,
   no la inventes.
3. **Nunca se afirma un dato que la aplicación no tenga.** Todo dato variable va en un hueco de
   `Plantillas.HUECOS`. Si hace falta un dato que no existe como hueco, se deja un hueco
   descriptivo entre corchetes para rellenar a mano (`[motivo]`), nunca un dato inventado.
4. **El membrete no se escribe**: se pone el hueco `{{MEMBRETE}}` en la primera línea.
5. **El pie de firma** va siempre así, con los huecos de la fila 81:

       > En {{LUGAR Y FECHA}}
       >
       > {{TRATAMIENTO FIRMANTE}}
       >
       > Fdo.: {{FIRMANTE}}

   Y, si lleva visto bueno, a su izquierda:

       > V.º B.º {{TRATAMIENTO VISTO BUENO}}
       >
       > Fdo.: {{VISTO BUENO}}

6. **Protección de datos**: en todo documento que salga del centro con datos de una persona, un
   párrafo final en letra pequeña con la información básica de protección de datos
   (responsable: el centro; finalidad: la gestión del trámite; derechos: acceso, rectificación,
   supresión). Texto igual en todas: escríbelo una vez y repítelo.
7. **Los correos son cortos**: cuatro o cinco líneas, con el asunto en una sola línea, y sin
   membrete (el correo no lo lleva). El correo dice qué se pide o qué se comunica, y de qué
   asunto se trata.
8. **Formularios**: si el trámite necesita un impreso oficial, la plantilla de correo lleva su
   enlace, sacado del catálogo de la fila 82 con el hueco `{{FORMULARIOS}}` (nuevo: monta una
   lista con el nombre y la dirección de cada formulario del tipo y de sus hitos).

### Ejemplo de plantilla de documento

Fichero `plantillas/citacion-audiencia.md`:

    ---
    nombre: Citación a audiencia
    tipo: CONDUCTA CONTRARIA
    categoria: ALUMNADO
    tipoDocumento: CITACION
    texto: audiencia
    firmante: jefatura-estudios
    vistoBueno: direccion
    ---

    {{MEMBRETE}}

    # Citación a trámite de audiencia

    Por la presente se cita a {{TUTOR1}}, como persona que ejerce la tutela legal del alumno o
    alumna {{NOMBRE NATURAL}}, del grupo {{GRUPO}}, para comparecer en este centro en trámite de
    audiencia.

    El motivo es la conducta contraria a las normas de convivencia registrada el [fecha de los
    hechos], y que se detalla en el expediente {{ASUNTO}}.

    Este trámite se realiza conforme al artículo 35 del Decreto 327/2010, de 13 de julio, por el
    que se aprueba el Reglamento Orgánico de los institutos de educación secundaria, y a la
    Orden de 20 de junio de 2011.

    La comparecencia tendrá lugar el día [día] a las [hora], en la Jefatura de Estudios.

    > En {{LUGAR Y FECHA}}
    >
    > {{TRATAMIENTO FIRMANTE}}
    >
    > Fdo.: {{FIRMANTE}}

### Ejemplo de plantilla de correo

    ---
    nombre: Aviso de citación
    tipo: CONDUCTA CONTRARIA
    categoria: ALUMNADO
    ---

    Asunto: {{ASUNTO}}

    Buenos días:

    Le informamos de que se ha citado a la familia de {{NOMBRE NATURAL}}, del grupo {{GRUPO}},
    para un trámite de audiencia en el centro. Adjuntamos la citación con el día y la hora.

    Puede responder a este correo para cualquier aclaración.

    Un saludo.
    {{CENTRO}}

---

## Parte 3 · El hueco que falta

`Plantillas.HUECOS` gana **`{{FORMULARIOS}}`**: la lista de los formularios oficiales del tipo de
asunto y de sus hitos (fila 82), uno por línea, con su nombre y su dirección. Si no hay ninguno,
el hueco se queda vacío y no deja una línea suelta.

---

## Qué hay que actualizar al terminar

- `docs/CONTEXTO-CORTO.md`, sección 5: sustituye la línea de las plantillas por una que diga que
  el centro ya tiene sus textos escritos y que se cargan con un botón.
- `docs/CONTEXTO.md`: `_GESTOR/PLANTILLAS` deja de ser "solo lo que Francisco sube a mano".
- `docs/contexto/DOCUMENTOS-PDF.md` y `docs/contexto/CORREO-Y-SENECA.md`.
- `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`: `plantillas/`, `scripts/hacer-plantillas.mjs`.
- `docs/HISTORIA.md`: una entrada con fecha.

## Pruebas

`pruebas/plantillas-del-centro.mjs` (sin navegador): que `plantillas/indice.json` cite un fichero
que existe para cada entrada; que cada `.md` de `plantillas/` traiga los campos obligatorios del
frontmatter; que todo hueco `{{...}}` usado en los cuerpos esté en `Plantillas.HUECOS` (esta es la
prueba que de verdad importa: un hueco mal escrito sale en el papel tal cual); y que el `.docx`
generado por el script se pueda volver a leer con `Docx.leerEntradaDeTexto`.

## Aviso de tamaño

Son muchas plantillas. **Repártelas en varias subidas si hace falta**, respetando la regla 13 de
`docs/COLA.md` en lo que toca a publicaciones de Vercel: los ficheros de `plantillas/` que no
sean `.docx` no disparan publicación si van solos, pero el código sí. Agrupa: una subida con el
código y el script, y las demás solo con contenido.
