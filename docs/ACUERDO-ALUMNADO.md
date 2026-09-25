# Acuerdo entre la base de datos de alumnado y el gestor de asuntos

Cerrado con Francisco el 25-sep-2026. **Este mismo documento vive, idéntico, en los dos
repositorios**: `fmargon780/bd-alumnado-ies` y `fmargon780/gestor-asuntos-ies`, en
`docs/ACUERDO-ALUMNADO.md`. Si se cambia en uno, se cambia en el otro en la misma sesión.

## 1. El reparto

- **Todo lo que viene de Séneca sobre alumnado entra por la base de datos de alumnado.** Allí se
  limpia y se cruza, una sola vez.
- **El gestor de asuntos no prepara listas de alumnado de Séneca por su cuenta.** Consulta el
  resultado de la base de datos de alumnado.
- Durante la transición, el gestor sigue leyendo `RegAlum.csv` como respaldo. Se retira solo
  cuando Francisco lo decida, con el gestor ya funcionando con los datos nuevos.
- Lo que une las dos aplicaciones es **este acuerdo**: cómo se pide el alumnado y qué forma tiene.
  Da igual cómo esté hecha cada una por dentro. Si la base de datos de alumnado pasa un día de
  cuaderno de Google Sheets a aplicación web, basta con que siga cumpliendo este acuerdo.

## 2. Cómo se pide

- La base de datos de alumnado ofrece **una dirección web con clave** (`…?k=<clave>`).
- Quien la pide recibe el alumnado entero en el formato de la sección 3.
- Devuelve lo que hay en la base de datos en ese momento: lo de la última vez que Francisco pulsó
  el menú del cuaderno. No recalcula nada al pedirlo.
- Sin la clave correcta, no devuelve nada. La clave no se escribe en ningún repositorio.
- El gestor guarda lo recibido en `_GESTOR/datos/ALUMNADO-BD.json`, en el Dropbox del centro. Así
  la carpeta tiene siempre la última copia, y el gestor funciona con ella si la dirección no
  responde.

## 3. La forma: `ALUMNADO-BD.json`

Un objeto JSON en UTF-8:

    {
      "acuerdo": 1,
      "generado": "2026-09-25T10:30:00+02:00",
      "origen": "bd-alumnado-ies",
      "cursoAcademico": "2026-2027",
      "alumnos": [ { ... }, { ... } ]
    }

- `acuerdo`: la versión de este documento. Hoy, `1`.
- `generado`: cuándo se construyeron los datos (la última pulsación del menú), no cuándo se pidieron.
- `alumnos`: una entrada por alumno. Están **todos los del RegAlum**: los matriculados este curso
  y los antiguos (`matriculado: false`). Los datos académicos solo se rellenan para los matriculados.

Cada alumno (un campo vacío o que no aplica va como `null`; nunca se inventa):

| Campo | Qué es |
|---|---|
| `idEscolar` | Nº de identificación escolar. **Es la clave que une todo.** Obligatorio. |
| `apellido1`, `apellido2`, `nombre` | Por separado. |
| `sexo` | `"H"` o `"M"`, como lo trae Séneca. |
| `fechaNacimiento` | `AAAA-MM-DD`. |
| `documento` | DNI/NIE del alumno, si lo tiene. |
| `matriculado` | `true` si está matriculado este curso. |
| `unidad` | El grupo (p. ej. `2º ESO B`). |
| `curso`, `ensenanza` | Curso y enseñanza (ESO, Bachillerato…). |
| `contacto` | `{ telefono, movil, correo, domicilio, localidad, codigoPostal, provincia }` del alumno. |
| `tutores` | Lista de hasta dos tutores legales: `{ orden, apellido1, apellido2, nombre, documento, sexo, telefono, movil, correo }`. |
| `academico` | Solo matriculados: `{ repeticiones, pil, pendientes, materiasNoSuperadas, neae }`. |

- `repeticiones`: número de cursos repetidos. `pil`: `true`/`false` (`null` en Bachillerato).
  `pendientes` y `materiasNoSuperadas`: listas de texto. `neae`: `true`/`false` (solo si consta en el
  censo NEAE; sin detalle del tipo, que es dato de salud).
- Lo que el gestor lee hoy de `RegAlum.csv` tiene que estar aquí. Si falta algo, se añade a esta
  tabla.

## 4. Cómo se cambia sin romper nada

- **Añadir** un campo nuevo no rompe nada: el que lee ignora lo que no conoce. No hace falta
  subir `acuerdo`.
- **Quitar o renombrar** un campo, o cambiar su significado, sí rompe: se sube `acuerdo` a `2`, y
  se prepara primero el gestor para leer las dos versiones.
- El gestor, si recibe un `acuerdo` que no conoce o le falta `idEscolar`, no usa esos datos: sigue
  con la última copia buena y avisa en ámbar.

## 5. Datos personales

- Son datos de menores: domicilios, teléfonos, documentos. Nunca se suben a ningún repositorio,
  ni en pruebas: las pruebas usan alumnos inventados.
- Solo viajan entre la cuenta de Google de Francisco y el Dropbox del centro.
