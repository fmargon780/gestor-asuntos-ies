# Acuerdo entre la base de datos de alumnado y el gestor de asuntos

Cerrado con Francisco el 25-sep-2026 y **rehecho ese mismo día** (versión 2). **Este mismo
documento vive, idéntico, en los dos repositorios**: `fmargon780/bd-alumnado-ies` y
`fmargon780/gestor-asuntos-ies`, en `docs/ACUERDO-ALUMNADO.md`. Si se cambia en uno, se cambia en
el otro en la misma sesión.

**Qué cambió en la versión 2**: la versión 1 servía el alumnado por una dirección web con clave.
El control de seguridad de Claude Code la paró (datos de menores abiertos a quien tuviera la
línea, sin registro, con una clave que no caduca) y Francisco la descartó. **Nada de dirección
web ni de clave: un archivo en Drive.** Además, el archivo lleva **todo** lo que sabe la base de
datos de cada alumno, no una selección.

## 1. El reparto

- **Todo lo que viene de Séneca sobre alumnado entra por la base de datos de alumnado.** Allí se
  limpia y se cruza, una sola vez.
- **El gestor de asuntos no prepara listas de alumnado de Séneca por su cuenta.** Usa lo que le
  da la base de datos de alumnado.
- El gestor sigue leyendo `RegAlum.csv` como hasta ahora. Lo del archivo se **suma** a eso.
- Lo que une las dos aplicaciones es **este acuerdo**. Da igual cómo esté hecha cada una por
  dentro. Si la base de datos pasa un día de cuaderno de Google Sheets a aplicación web, basta con
  que siga dejando el mismo archivo.

## 2. Cómo llega

- Al terminar «Actualizar los datos», el cuaderno escribe `ALUMNADO-BD.json` en la carpeta de
  Drive **«Datos de matrícula»** (la privada de Francisco, la misma donde ya viven los CSV).
- **Siempre el mismo archivo**: se sobrescribe el que hay (Drive admite dos archivos con el mismo
  nombre, y eso no puede pasar).
- En el ordenador del trabajo, Google Drive para ordenador muestra esa carpeta como una carpeta
  más. El gestor la señala una vez (como las del Dropbox) y lee el archivo de ahí.
- El gestor guarda una copia en `_GESTOR/datos/ALUMNADO-BD.json`, en el Dropbox del centro, para
  quien no tenga señalada la carpeta de Drive (el compañero). Trabaja siempre con esa copia.
- **Ningún dato viaja por una dirección web.** Solo existen el archivo en Drive y su copia en el
  Dropbox del centro, donde ya están hoy el RegAlum y el resto de ficheros de Séneca.

## 3. La forma: `ALUMNADO-BD.json`

Un objeto JSON en UTF-8. La idea: **cada archivo se describe a sí mismo**. La lista `campos` dice
qué datos trae y cómo se llaman; el gestor la lee y no necesita cambiar cuando aparecen datos
nuevos.

    {
      "acuerdo": 2,
      "generado": "2026-09-25T10:30:00+02:00",
      "origen": "bd-alumnado-ies",
      "cursoAcademico": "2026-2027",
      "campos": [
        { "clave": "unidad", "etiqueta": "Grupo", "apartado": "Matrícula", "tipo": "texto" },
        { "clave": "centroProcedencia", "etiqueta": "Centro de procedencia", "apartado": "Procedencia", "tipo": "texto" },
        { "clave": "materias", "etiqueta": "Materias matriculadas", "apartado": "Materias", "tipo": "tabla",
          "columnas": [ { "clave": "materia", "etiqueta": "Materia" }, { "clave": "situacion", "etiqueta": "Situación" } ] }
      ],
      "alumnos": [
        { "idEscolar": "1234567", "matriculado": true, "datos": { "unidad": "1º ESO A", "centroProcedencia": "…", "materias": [ … ] } }
      ]
    }

- `acuerdo`: la versión de este documento. Hoy, `2`.
- `generado`: cuándo se construyeron los datos (la última pulsación de «Actualizar los datos»).
- `campos`: un elemento por dato. `clave` (fija, sin espacios ni tildes), `etiqueta` (lo que ve
  Francisco), `apartado` (para agruparlos en la ficha), `tipo` y, si hace falta, `descripcion`.
  Tipos: `texto`, `numero`, `fecha` (`AAAA-MM-DD`), `si-no`, `lista` (varios textos) y `tabla`
  (varias filas, con sus `columnas`). Un tipo que el gestor no conozca lo enseña como texto.
- `alumnos`: **todos** los alumnos que conoce la base de datos, matriculados y antiguos, con toda
  su historia. `idEscolar` (Nº de identificación escolar) es obligatorio y es la clave que une
  todo. `matriculado` dice si está este curso. `datos` lleva el valor de cada campo; lo que no
  aplica o no se sabe, `null` o ausente. Nunca se inventa nada.

**Qué tiene que ir, como mínimo** (y además todo lo demás que tenga la base de datos):

- Identidad: apellidos, nombre, sexo, fecha de nacimiento, documento.
- Matrícula de este curso: enseñanza, curso, grupo, estado, **materias matriculadas**.
- Historia: cursos anteriores (año, centro, curso, grupo, resultado), repeticiones, PIL,
  pendientes, materias no superadas, datos de Primaria y Secundaria que ya cruza.
- **Centro de procedencia** (imprescindible en 1º de ESO).
- NEAE: lo que tenga el censo.
- Contacto del alumno y de sus tutores legales.
- Las marcas de Jefatura que ya se cruzan.

## 4. Cómo se cambia sin romper nada

- **Añadir** un dato nuevo es lo normal y no rompe nada: se añade a `campos` y a los alumnos. El
  gestor lo recoge solo. No hace falta tocar el gestor ni subir `acuerdo`.
- **No se quita ni se renombra una `clave`** que ya haya salido: el gestor puede estar usándola en
  una plantilla o en un grupo. Si un dato deja de existir, se deja de rellenar. Cambiar la
  `etiqueta` sí se puede.
- Solo un cambio de la forma general (lo de arriba de `campos` y `alumnos`) sube `acuerdo` a `3`.
- Si el gestor recibe un `acuerdo` que no conoce, o un alumno sin `idEscolar`, no usa esos datos:
  sigue con la última copia buena y avisa en ámbar.

## 5. Datos personales

- Son datos de menores. Nunca se suben a ningún repositorio, ni en pruebas: las pruebas usan
  alumnos inventados.
- Nunca se sirven por una dirección web.
- Solo existen en la carpeta de Drive de Francisco y en el Dropbox del centro.
