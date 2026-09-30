# Certificado de miembro del Consejo Escolar (fila 238)

Diseño cerrado con Francisco el 30-sep-2026. Un tipo de asunto nuevo que genera, para una persona,
un solo certificado con todos los periodos en que ha sido miembro del Consejo Escolar del centro.
Los datos salen de los CSV que da Séneca («Registro de miembros del Consejo Escolar»).

**Antes de empezar:** lee `docs/contexto/TABLAS-DE-DATOS.md`. Esto es gemelo de la tabla TUTORIAS y
del «Certificado de función tutorial» (filas 110 y 123): se hace con el mismo mecanismo, no con uno
nuevo. No leas el repositorio entero.

## 1. Los ficheros de Séneca

Nombre: `RegMieConEsc <año>-<año>.csv` (puede llevar un prefijo de números y guiones bajos en vez de
espacios). Codificación Latin-1. Cuatro columnas, **leídas por su título, no por su sitio**:

- `Sector`, `Miembro` (o `Miembros`), una cuyo título contiene «Nombramiento» (puede traer HTML
  pegado: `Nombramiento<font class="asterisco"> *</font>`) y otra cuyo título contiene «Cese».
  Ojo: el fichero 2024-2025 trae Cese antes que Nombramiento.
- `Miembro` es `Apellidos, Nombre`, a veces con el cargo entre paréntesis al final:
  `Pradillo Abuin, Miguel (DIRECTOR/A)`, `… (CONCEJAL O REPRESENTANTE DEL AYUNTAMIENTO)`,
  `… (REPRESENTANTE DE LA A.M.P.A. MAYORITARIA)`. El cargo se separa del nombre.
- `Sector` a veces lleva el cargo: `Profesorado (Impulsor de medidas de Igualdad)` → sector
  Profesorado, cargo «Impulsor de medidas de Igualdad». El sector `Fomento Igualdad` trae el mismo
  cargo en el nombre, en mayúsculas.
- Fechas `dd/mm/aaaa`, o vacías. El Equipo Directivo (miembros natos) nunca trae fechas.
- Nombres enteros en mayúsculas se pasan a tipo título. `Mª` cuenta como `María` al comparar.

## 2. La tabla CONSEJO ESCOLAR

Una tabla más de `TablasDatos`, leída de los CSV cuyo nombre normalizado empieza por `regmieconesc`,
en la carpeta de datos (donde ya se buscan los PDF de tutorías) y en `datos/Tablas/`.

- **Una fila por nombramiento**, no por fichero: el mismo miembro con el mismo sector, cargo y fecha
  de nombramiento en dos ficheros es una sola fila. El cese es el del fichero más reciente que lo
  traiga. Fila: `{ apellidos, nombre, sector, cargo, desde, hasta, periodos: [ '2006-2007', … ] }`.
- Los miembros natos (sin fecha): una fila por persona y cargo, con `periodos` y sin fechas.
- **Se une a la persona por el nombre**, no por el DNI (Séneca no lo da, y hay madres, padres,
  alumnado y concejales): nombre completo sin tildes, mayúsculas, comas ni orden, con la misma idea
  que `TablasDatos.especialidadPorNombre`. No unir por parecido: `Sellés Manzanares, Rosa Carmen` y
  `Selles Manzanares, Miguel Isidro` son dos personas.
- Sale en Ajustes → Mantenimiento → «Tablas de datos» y en «Datos de las tablas» de la ficha del
  tercero, como las demás.

## 3. Subir los ficheros desde la aplicación

En Ajustes → Mantenimiento → «Tablas de datos», un botón **«Añadir ficheros del Consejo Escolar»**:
deja elegir uno o varios CSV, los copia a `datos/Tablas/` con su nombre limpio
(`RegMieConEsc 2024-2025.csv`; si ya existe, lo sustituye, preguntando antes) y vuelve a leer las
tablas. Así, cada vez que se renueve el Consejo, basta con subir el fichero nuevo. Si un fichero
elegido no es de este tipo (no trae las columnas), aviso ámbar y no se copia.

Después de leer, una línea de avisos bajo la tabla, en ámbar, sin bloquear nada:

- nombramientos con fecha posterior al periodo del nombre del fichero (1-sep del primer año a
  31-ago del segundo);
- dos ficheros de periodos distintos con el mismo contenido;
- el mismo nombramiento con ceses distintos según el fichero.

## 4. El tipo de asunto y el campo

En `datos-biblioteca/biblioteca-centro.json` y `docs/contenido/`, como se hizo con DESEMPEÑO FUNCIÓN
TUTORIAL (sin regenerar el JSON con `herramientas/cargar-biblioteca.mjs`, que pierde los guiones):

- Tipo **CERTIFICADO MIEMBRO CONSEJO ESCOLAR**, nombre corto `CertConsEsc`. Vale para cualquier
  categoría de tercero (personal, alumnado, tutores legales, otros): si el tipo obliga a una sola
  categoría, PERSONAL, y que el aviso ámbar de «el tipo no encaja» no bloquee (ya es así).
- Campo propio de texto **«DNI para el certificado»**: se usa cuando el tercero no trae documento.

## 5. El hueco y la plantilla

- `{{TABLA CONSEJO ESCOLAR}}`: tabla de Word con **Sector · Cargo · Nombramiento · Cese**, una fila
  por nombramiento, ordenadas por fecha, mismo aspecto que `{{TABLA TUTORIAS}}`.
  - Sin cargo, la celda queda vacía.
  - Sin cese y nombramiento en el Consejo más reciente cargado: «Hasta la actualidad».
  - Sin cese en un Consejo antiguo: `[falta: Cese]` resaltado en amarillo y sumado al aviso ámbar
    (el mecanismo de `TablasDatos.resaltarResultado`), para que se complete a mano en el Word.
  - Miembro nato sin fechas: en Nombramiento, «Cursos » + sus periodos; Cese, vacío.
  - Persona sin ninguna fila: `[falta: Consejo Escolar]`.
- `{{DNI}}` en este tipo: el documento del tercero y, si no lo hay, el campo «DNI para el
  certificado»; sin ninguno, `[falta: DNI]`.
- Plantilla `plantillas/certificado-miembro-consejo-escolar.md` (+ `.docx` con
  `node scripts/hacer-plantillas.mjs`, que actualiza `plantillas/indice.json`), calcada de
  `certificado-funcion-tutorial.md`: tipo de documento CERTIFICADO, texto `consejo escolar`, firma
  **Secretaría**, V.º B.º **Dirección**, con el membrete. Texto aprobado por Francisco:

  > D./D.ª {{FIRMANTE}}, Secretario/a del {{CENTRO}}, de {{LOCALIDAD}},
  >
  > **C E R T I F I C A:**
  >
  > Que, según los datos que constan en esta Secretaría, D./D.ª {{NOMBRE}}, con DNI {{DNI}}, ha sido
  > miembro del Consejo Escolar de este centro en los siguientes periodos:
  >
  > {{TABLA CONSEJO ESCOLAR}}
  >
  > Y para que conste, a petición de la persona interesada, se expide el presente certificado, con
  > el V.º B.º del/de la Director/a, en {{LOCALIDAD}}, a {{HOY}}.
  >
  > (firmas en dos columnas, como el de función tutorial)

  Usa los nombres de hueco y las marcas de género que ya usa la plantilla de función tutorial.

## 6. Ficheros que se tocan

- `js/tablas-datos.js` y `js/tablas-datos-leer.js` (la tabla nueva y su unión por nombre). Si alguno
  pasa de 400 líneas, el lector va en un fichero nuevo `js/tablas-datos-consejo.js`, cargado en
  `index.html` justo después.
- `js/tablas-datos-pantalla.js` (el botón de subir y los avisos).
- `js/plantillas.js` (catálogo `HUECOS`, `{{DNI}}` con el campo de reserva).
- `plantillas/certificado-miembro-consejo-escolar.md`, su `.docx`, `plantillas/indice.json`.
- `datos-biblioteca/biblioteca-centro.json`, `docs/contenido/BIBLIOTECA-PERSONAL.md`.
- `js/demo/datos.js`: dos ficheros inventados del Consejo y un asunto de este tipo.
- `pruebas/consejo-escolar.mjs` (nueva) y `pruebas/plantillas-del-centro.mjs` si hace falta.
- `docs/contexto/TABLAS-DE-DATOS.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`.

Cambios quirúrgicos: no reescribas ficheros enteros. **Ningún dato real en el repositorio**: los
nombres de este documento son solo ejemplos del formato; las pruebas y la demostración, con
nombres inventados.

## 7. Cómo se sube

Según las reglas de `docs/COLA.md`: rama `pruebas`, revisor, y con su APROBADA directo a `main`,
**sin abrir ninguna pull request**. Una sola pasada de `npm test` al final.

## Cómo sabemos que está bien

1. En la copia de pruebas, Ajustes → Mantenimiento → «Tablas de datos» enseña la tabla CONSEJO
   ESCOLAR con sus periodos y filas, y el botón «Añadir ficheros del Consejo Escolar».
2. Al elegir con el botón un fichero que no es del Consejo, sale un aviso ámbar y no se añade.
3. En «Nuevo asunto» se puede crear un CERTIFICADO MIEMBRO CONSEJO ESCOLAR para una persona de la
   demostración que fue miembro, y la ficha del tercero enseña sus periodos en «Datos de las tablas».
4. El Word generado trae el texto de arriba y una tabla con una fila por nombramiento; una persona
   que está en dos ficheros con el mismo nombramiento sale una sola vez.
5. Un nombramiento del Consejo más reciente sin cese pone «Hasta la actualidad»; uno antiguo sin
   cese sale resaltado en amarillo y en el aviso ámbar.
6. Un fichero con Cese y Nombramiento en orden inverso (como el 2024-2025) da las fechas en su
   columna correcta.
7. Sin documento en el tercero, el certificado usa el campo «DNI para el certificado».
8. [SOLO FRANCISCO] Con los ficheros reales subidos, el certificado de una persona conocida
   coincide con la hoja «Consejo Escolar - Historial de miembros 2002-2025».
