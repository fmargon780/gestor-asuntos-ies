# Sacar los once PDF de `formularios.zip` y cerrar la fila 85

**20-sep-2026.** Esto cierra la fila 85 de `docs/COLA.md`, que llevaba BLOQUEADA porque
ninguna sesión de Claude Code tenía salida a internet para descargar los PDF oficiales.

**Ya no hace falta internet.** Los once PDF están descargados, comprobados y dentro del
propio repositorio, en un fichero comprimido en la raíz: `formularios.zip`. Lo subió
Francisco a mano desde la web de GitHub el 20-sep-2026. Solo hay que descomprimirlo.

## AVISO IMPORTANTE, LÉELO ANTES DE TOCAR NADA

Un PDF es un fichero binario. **Las herramientas `push_files` y `create_or_update_file` de la
interfaz de GitHub solo admiten texto**: si les pasas el contenido de un PDF, lo que sube no
es el PDF, sino una ristra de caracteres rotos con el mismo nombre. El fichero parece estar
ahí y no abre en ningún visor. Eso es mucho peor que no subirlo, porque nadie se da cuenta
hasta que alguien intenta usar el formulario.

Por eso, **los once PDF solo se pueden meter en el repositorio de una de estas dos maneras**:

- con `git push` de verdad, desde una sesión que lo tenga; o
- subiéndolos Francisco a mano desde la web de GitHub, arrastrándolos a **Add file → Upload
  files**.

**Comprueba primero si tienes `git push`.** Prueba con `git push --dry-run` contra este
repositorio:

- **Si funciona**: sigue con los pasos de abajo, todos.
- **Si no funciona** (sale un 403, o "access denied by the git proxy", o "git push está
  bloqueado"): **para aquí**. No intentes subir los PDF de ninguna otra forma. Haz solo los
  pasos 4 y 5 de abajo, que son texto y sí se pueden hacer, deja `formularios.zip` donde
  está sin borrarlo, y deja la fila 85 BLOQUEADA con este motivo en una línea: *"los PDF
  están en formularios.zip dentro del repositorio, pero esta sesión no tiene git push y los
  binarios no se pueden subir con la interfaz de GitHub; los saca la primera sesión que
  tenga git push, o Francisco a mano"*.

## Lo que hay que hacer

1. Descomprimir `formularios.zip` en la raíz del repositorio. Dentro trae ya una carpeta
   llamada `formularios`, así que los PDF quedan en `formularios/` sin mover nada.
2. Comprobar que están los once ficheros y que cada uno mide lo que pone la tabla de abajo.
   Si alguno no cuadra, parar y dejar la fila 85 BLOQUEADA con el motivo.
3. **Borrar `formularios.zip`** de la raíz. No tiene que quedarse: son 6,6 MB duplicados y
   Vercel publica la raíz entera, así que el zip quedaría descargable desde internet. Esto
   se hace **solo si los once PDF han subido bien**, nunca antes.
4. Corregir una dirección equivocada en `datos/formularios.json` (ver más abajo).
5. Marcar la fila 85 de `docs/COLA.md` como HECHA con la fecha, y apuntar la línea que toque
   en `docs/HISTORIA.md`.

No hay que tocar nada de código ni ninguna prueba. Es solo mover ficheros.

**Después de subir los PDF, compruébalos uno a uno**: baja cada uno del repositorio y mira
que el tamaño coincide con la tabla y que empieza por `%PDF`. Si alguno no coincide, bórralo
y deja la fila 85 BLOQUEADA: más vale ninguno que uno roto.

## Los once ficheros

El tamaño es en bytes, y el segundo número es el identificador de git de cada fichero
(`git hash-object <fichero>`), por si se quiere comprobar que han llegado byte a byte.

| Fichero | Bytes | git hash-object |
|---|---|---|
| `formularios/O-I.pdf` | 1328240 | dd303ffc5df93ea02473af1334c166a048d820b0 |
| `formularios/O-II.pdf` | 1328240 | dd303ffc5df93ea02473af1334c166a048d820b0 |
| `formularios/O-III.pdf` | 555881 | 5157315c46453b5a827fe9b0b68a9e33a506b043 |
| `formularios/O-IV.pdf` | 372625 | 4d597e5edc21d46e63c8eeada2716bfc92e6d324 |
| `formularios/O-V.pdf` | 380996 | ed5f06eb328ecea8fa0b1bfd119dade3e2c3936d |
| `formularios/O-VI.pdf` | 297702 | 98f80783897eadba155dfad3995ad161d6abc499 |
| `formularios/O-VII.pdf` | 297503 | 8d73769ca4345d197fdce879e4a8b1ea1d89abee |
| `formularios/O-VIII.pdf` | 300407 | c4667930db26f3741bcb507c902728fe3369bfa0 |
| `formularios/O-IX.pdf` | 301161 | a6fe3881033468ac5f73154ed9b4ef2771605042 |
| `formularios/O11-VI.pdf` | 747544 | 8799a536ec35ffd0dd0baa0259ba403607072de0 |
| `formularios/O11-VII.pdf` | 747544 | 8799a536ec35ffd0dd0baa0259ba403607072de0 |

`O-I.pdf` y `O-II.pdf` son el mismo documento con dos nombres, y lo mismo pasa con
`O11-VI.pdf` y `O11-VII.pdf`. Por eso se repiten el tamaño y el identificador. Es correcto,
y es lo que pedía la fila 85.

Qué es cada uno, comprobado abriéndolos uno a uno:

- `O-I` y `O-II`: la Orden de escolarización publicada en el BOJA extraordinario 503 de 2020.
- `O-III` a `O-IX`: los Anexos III, IV, V, VI, VII, VIII y IX de esa misma Orden, cada uno en
  su fichero, en blanco y tal cual los publica la Consejería.
- `O11-VI` y `O11-VII`: la Orden de 20 de junio de 2011, de promoción de la convivencia
  (BOJA núm. 132, de 7 de julio de 2011).

## La dirección que hay que corregir en `datos/formularios.json`

Las entradas de `O11-VI.pdf` y `O11-VII.pdf` tienen hoy esta dirección en su clave `u`:

    https://www.juntadeandalucia.es/boja/2011/132/1

**Esa dirección no es un PDF: es una página web** con el texto de la disposición. Quien la
use para descargar se baja una página HTML con la extensión `.pdf`, que ningún visor abre.
La dirección buena del PDF de esa misma disposición es:

    https://www.juntadeandalucia.es/boja/2011/132/d1.pdf

Sustituir la clave `u` de esas dos entradas por la segunda. Las otras nueve direcciones del
fichero están bien y no se tocan. **Esta corrección es texto, así que se puede hacer siempre**,
tenga o no la sesión `git push`.

## Dónde estaba el atasco, para que no se repita

La fila 85 se bloqueó tres veces (filas 63, 84 y 85) por lo mismo: las sesiones de Claude
Code que trabajan esta cola no tienen salida a internet, y estos PDF hay que bajarlos de la
web de la Junta. La sesión de Cowork del 20-sep-2026 sí tenía internet, los bajó y los
comprobó, pero no podía subir ficheros binarios al repositorio: para eso hace falta `git
push`, y esa sesión solo tenía la interfaz de GitHub, que únicamente admite texto.

De ahí el rodeo del fichero comprimido: Francisco lo subió a mano desde el navegador, y así
los PDF entran en el repositorio sin que ninguna sesión necesite internet. **Si algún día hay
que volver a meter ficheros binarios en el repositorio, este es el camino corto**: que los
suba Francisco desde la web, ya con la carpeta y los nombres buenos, sin pasar por un zip.
