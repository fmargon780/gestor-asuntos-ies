# La ficha de una persona, en tarjetas (fila 252)

Fila 252 de `docs/COLA.md`. Cerrada con Francisco el 1-oct-2026 (nació de un aviso suyo desde el
botón de soporte).

## Qué pasa hoy

- En **Personas y empresas** (`js/archivo-personas.js`, `App.verFicha`), la ficha de un alumno es
  una columna de pares «título – valor» que no se acaba: los destacados de `Datos.destacadosAlumno`,
  los hermanos, «Ver los demás datos del fichero (N)» y «Sus asuntos». Con el alumnado, la columna
  es larguísima y se aprovecha mal el ancho.
- Los datos de la **base de datos de alumnado** (`ALUMNADO-BD.json`, fila 144: materias
  matriculadas, procedencia, historia, repeticiones, NEAE…) **no salen nunca en Personas y
  empresas**. Solo salen en la ventana «Ver todo» de «Datos y contacto» dentro de un asunto
  (`js/ficha-tercero.js` → `js/ficha-tercero-alumno.js` → `AlumnadoBDVer.tarjetas`). Francisco
  creía que la fila 144 no se había hecho, porque busca a los alumnos en Personas y empresas.
- La copia de Francisco sí tiene el archivo (4823 alumnos, 81 datos, del 30-09-2026), y el archivo
  sí trae las materias (`bd-alumnado-ies`, `ParaElGestorDatos.gs`, `materiasPorAlumno_`).

## Qué quiere Francisco

Una ficha **sintética**, agrupada por categorías, en **tarjetas desplegables**, que aproveche el
ancho (sus reglas: páginas densas, sin huecos, sin obligar a bajar). Y que **la misma ficha** se
vea igual en toda la aplicación.

### 1. La ficha de un alumno

**Cabecera, siempre a la vista, en dos líneas como mucho:** nombre, grupo, edad, si está
matriculado (o antiguo / aspirante), Nº escolar y DNI (con su ⧉ de copiar, como hoy). A la
derecha, en la misma cabecera, «+ Nuevo asunto para esta persona» y «Cambiar los datos» (si
sale hoy) y «Borrar» (si sale hoy). «FALTA EL DNI» sigue saliendo donde salga hoy.

**Debajo, tarjetas**, en **dos columnas** cuando el ancho lo permite (desde unos 1100 px de
ancho de la ficha; por debajo, una columna). Cada tarjeta es plegable y lleva **en el título un
resumen de una línea** con lo más útil, para no tener que abrirla. Las tarjetas sin nada dentro
no salen. En este orden:

| # | Tarjeta | Abierta al entrar | Qué lleva | Resumen del título (ejemplo) |
|---|---|---|---|---|
| 1 | Familia y contacto | Sí | Tutores legales (nombre, DNI, teléfonos, correo, con ⧉), teléfono(s) y correo del alumno, «Hermanos en el centro» (con lo que hace hoy la fila 125: pulsar abre su ficha), «Correo a la familia» y «Copiar todo el contacto» (los dos botones de la ventana «Ver todo» de hoy) | «Tutora 1: María López · 655 645 995» |
| 2 | Sus asuntos | Sí | Lo que sale hoy en «Sus asuntos», **abiertos primero**, después archivados | «2 abiertos · 3 archivados» |
| 3 | Matrícula | No | Curso, grupo, enseñanza, estado de la matrícula, tutor/a de la unidad, edad a 31/12 | «2º ESO B · Matriculado» |
| 4 | Materias | No | La tabla de materias matriculadas (materia y situación) y los datos sueltos de ese apartado (modalidad, optativas, religión…) | «9 materias» |
| 5 | Trayectoria | No | Matrículas en el centro (tabla), repeticiones, PIL, pendientes, materias no superadas, datos de Primaria y Secundaria | «Repite 1 vez · 2 pendientes» |
| 6 | Procedencia y NEAE | No | Centro de procedencia, centros en Secundaria, NEAE, diversificación, medidas y recursos, y el reparto definitivo de Jefatura | «CEIP Los Llanos · NEAE: Sí» |
| 7 | Datos personales | No | Fecha y localidad de nacimiento, nacionalidad, sexo, domicilio, código postal, localidad, provincia | «12-03-2012 · Alhaurín el Grande» |
| 8 | Otros datos del fichero | No | Todo lo que no ha encajado en ninguna de las anteriores (del RegAlum y de la base de datos), incluidas las observaciones | «18 datos» |

Al pie de las tarjetas que traen algo de la base de datos de alumnado, la fecha de los datos
(«Datos de la base de datos de alumnado del 30-09-2026»), como hoy.

**Qué tarjeta lleva cada dato:**

- Los de la base de datos de alumnado, por su `apartado` (`docs/ACUERDO-ALUMNADO.md`): Identidad →
  Datos personales (salvo nombre, apellidos y documento, que ya están en la cabecera); Contacto →
  Familia y contacto (los tutores de la base no se repiten si ya están los del RegAlum); Matrícula →
  Matrícula; Materias → Materias; Historia → Trayectoria; Procedencia, Apoyos y Reparto
  definitivo → Procedencia y NEAE; Observaciones y **cualquier apartado que no esté en esta
  lista** → Otros datos del fichero. Así un apartado nuevo de la base aparece solo, sin tocar el
  gestor (la regla de la fila 144 se mantiene: el código no nombra ningún **dato**; solo esta
  tabla de apartados).
- Los del RegAlum (y de cualquier otro CSV del alumnado), por el título de su columna, con una
  tabla de reglas en un solo sitio del código (tutor/padre/madre → Familia; teléfono/correo del
  alumno → Familia y contacto; curso/unidad/estado → Matrícula; nacimiento, nacionalidad,
  dirección, localidad, provincia, código postal, sexo → Datos personales; el resto → Otros datos
  del fichero).
- **Un dato que está en los dos sitios sale una sola vez**, con la regla de la fila 144: manda el
  de la base salvo que la base sea más vieja que el RegAlum.
- La fila «Hermanos en el centro» y lo de las familias (`js/personas-familias.js`) van dentro de
  «Familia y contacto».

**Recordar lo abierto:** si se abre o se cierra una tarjeta, se recuerda **en ese ordenador**
(`localStorage`, una clave para toda la aplicación, por categoría de persona y tarjeta, por
ejemplo `gestor.fichaPersona.abiertas`; siempre envuelto en `try/catch`, y sin él se usa lo de la
tabla). Vale para todas las personas de esa categoría, no persona a persona.

### 2. La misma ficha en toda la aplicación

- La ventana **«Ver todo»** de «Datos y contacto» dentro de un asunto (`js/ficha-tercero.js`,
  `abrirVerTodo`) deja de tener su propio diseño para el alumnado y **pinta esta misma ficha**
  (cabecera + tarjetas), sin «Sus asuntos» si eso hace la ventana demasiado alta (se deja a juicio
  de quien programa; lo importante es que el resto sea idéntico). Lo de la fila 108
  (`docs/CONTACTO-EN-TARJETAS.md`: teléfonos legibles, «mismo que la tutora 1», ⧉ en cada dato,
  «Correo a la familia», «Copiar todo el contacto») **se conserva** dentro de la tarjeta «Familia
  y contacto».
- Un solo módulo nuevo, por ejemplo `js/ficha-persona.js` (y `js/ficha-persona-reparto.js` si
  pasa de 600 líneas), con una función tipo `FichaPersona.pintar(caja, persona, opciones)` que
  usan Personas y empresas y «Ver todo». `AlumnadoBDVer.tarjetas` deja de pintar tarjetas por su
  cuenta: entrega los datos por apartado y la ficha los reparte.

### 3. Personal, empresas y demás categorías

La misma forma: cabecera de una o dos líneas y tarjetas plegables con resumen.

- **Personal:** cabecera (nombre, puesto, si sigue en el centro, DNI con ⧉) y tarjetas «Puesto y
  contacto» (abierta: lo de `Datos.destacadosPersona`), «Sus asuntos» (abierta) y «Otros datos
  del fichero».
- **Empresas, Administraciones y tutores legales** (`App.FICHAS_DE_CATEGORIA`, y el resto):
  cabecera (nombre o razón social, NIF o código) y tarjetas «Datos» (abierta: lo que pinta hoy
  su `html`, sin perder lo que hace su `enganchar`, como los departamentos de una Administración),
  «Sus asuntos» (abierta) y, si hay, «Otros datos». Los ganchos de `App.trasPintarFicha` (por
  ejemplo, los asuntos de los tutores de `js/tutores-legales.js`) siguen funcionando: si pintan
  un bloque, va dentro de la tarjeta que le corresponda o, si no se sabe, al final.

### 4. Lo que no cambia

- La lista de la izquierda de Personas y empresas (búsqueda, familias, antiguos plegados).
- «Dar de alta», «Cambiar los datos», «Borrar» y «+ Nuevo asunto para esta persona» hacen lo
  mismo que hoy.
- Los huecos de plantillas y los grupos de terceros relacionados con datos de la base
  (`AlumnadoBDVer.huecos`, `pintarGrupo`, `comoTabla`): no se tocan.
- Los datos que trae cada persona: aquí solo cambia cómo se ven, no qué se lee ni qué se guarda.

## Antes de empezar

- Lee `docs/CONTEXTO.md` y los hijos de `docs/contexto/` de personas, terceros y tablas de datos
  (`docs/contexto/TABLAS-DE-DATOS.md`), `docs/ALUMNADO-BD-DESDE-DRIVE.md`,
  `docs/ACUERDO-ALUMNADO.md` y `docs/CONTACTO-EN-TARJETAS.md`.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Un módulo nuevo **no envuelve**: se engancha por los puntos que ya hay (`App.verFicha`,
  `abrirVerTodo`) cambiando la llamada en su sitio.

## Ficheros

- Nuevos: `js/ficha-persona.js` (cabecera, tarjetas, recordar lo abierto) y, si hace falta,
  `js/ficha-persona-reparto.js` (qué tarjeta lleva cada dato); `css/ficha-persona.css`.
- Cambian: `js/archivo-personas.js` (`App.verFicha` llama a la ficha nueva), `js/ficha-tercero.js`
  y `js/ficha-tercero-alumno.js` («Ver todo»), `js/alumnado-bd-ver.js` (entrega datos por
  apartado), `css/personas.css`, `index.html` (los dos ficheros nuevos), `js/novedades.js`
  (regla 21).
- Pruebas: poner al día `pruebas/ficha-tercero.mjs`, `pruebas/personas-familias.mjs` y
  `pruebas/personas-archivo-y-menu.mjs`; una nueva, `pruebas/ficha-persona-tarjetas.mjs`, con un
  `ALUMNADO-BD.json` inventado (un matriculado con materias, historia y procedencia; un antiguo;
  un apartado desconocido).
- Documentación: `docs/CONTEXTO-CORTO.md` (sustituir las líneas de Personas y de «Ver todo»),
  el hijo de `docs/contexto/` que toque, `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en Personas y empresas la ficha va ahora en tarjetas, que las materias
matriculadas están en la tarjeta «Materias», y que lo mismo sale en «Ver todo» dentro de un
asunto.

## Cómo sabemos que está bien

1. En Personas y empresas, Alumnado, abrir un alumno matriculado que tenga datos en la base de
   datos de alumnado: arriba, en dos líneas como mucho, nombre, grupo, edad, «Matriculado», Nº
   escolar y DNI con ⧉; en la misma cabecera, «+ Nuevo asunto para esta persona».
2. Debajo salen las tarjetas en este orden: Familia y contacto (abierta), Sus asuntos (abierta),
   Matrícula, Materias, Trayectoria, Procedencia y NEAE, Datos personales, Otros datos del fichero
   (cerradas). Cada título lleva su resumen de una línea. Una tarjeta sin datos no sale.
3. A 1280 px de ancho de ventana, las tarjetas van en dos columnas y la ficha cerrada (solo las
   dos abiertas) cabe sin bajar en un alumno con dos tutores y tres asuntos. Sin barra horizontal.
4. Abrir «Materias»: sale la tabla con las materias del archivo (materia y situación) y, al pie,
   «Datos de la base de datos de alumnado del …».
5. Ningún dato sale dos veces en la ficha (por ejemplo, el grupo o el teléfono que están en el
   RegAlum y en la base). Un dato de un apartado desconocido del archivo sale en «Otros datos del
   fichero».
6. Abrir «Trayectoria» y cerrar «Sus asuntos»; recargar la página y abrir otro alumno: Trayectoria
   abierta y Sus asuntos cerrada. Con `localStorage` bloqueado, la ficha sale igual, con lo de la
   tabla.
7. «Hermanos en el centro» está dentro de Familia y contacto y, al pulsar un hermano, se abre su
   ficha, como hoy.
8. Dentro de un asunto de un alumno, «Datos y contacto» → «Ver todo»: la misma cabecera y las
   mismas tarjetas; «Correo a la familia» y «Copiar todo el contacto» funcionan como hoy.
9. Un alumno antiguo (sin datos de este curso) y un aspirante: cabecera con «Antiguo» o
   «Aspirante», y solo las tarjetas que traen algo.
10. Personal: cabecera y tarjetas «Puesto y contacto», «Sus asuntos» y «Otros datos del fichero».
    Una empresa y una Administración con departamentos: cabecera y «Datos» con todo lo de hoy
    (departamentos incluidos), «Sus asuntos». Un tutor legal: lo de hoy, con los asuntos de sus
    hijos.
11. Sin `ALUMNADO-BD.json` (copia de demostración sin él): la ficha del alumno sale igual, solo
    con lo del RegAlum, sin errores en la consola.
12. «Cambiar los datos», «Borrar» y «+ Nuevo asunto para esta persona» hacen lo mismo que antes.
