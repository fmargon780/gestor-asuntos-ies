# Los once PDF oficiales ya están en `formularios/`

**20-sep-2026.** Esto cierra lo que pedía la fila 85 de `docs/COLA.md`, que llevaba
BLOQUEADA desde las filas 63 y 84 por el mismo motivo: ninguna sesión de Claude Code de las
que trabajan esta cola tiene salida a internet, y estos impresos hay que bajarlos de la web
de la Junta de Andalucía.

**Los once PDF están en `formularios/`, comprobados uno a uno.** No hay que descargarlos
otra vez, ni hay que volver a intentarlo desde ninguna sesión.

## Qué queda por hacer (es texto, se puede hacer desde cualquier sesión)

1. **Corregir dos direcciones en `datos/formularios.json`.** Las entradas `O11:VI` y
   `O11:VII` (las dos que llevan clave `f`, es decir, las que tienen PDF descargable) tienen
   hoy en su clave `u` esta dirección:

       https://www.juntadeandalucia.es/boja/2011/132/1

   **No es un PDF: es una página web** con el texto de la disposición. Quien la use para
   descargar se baja una página HTML con la extensión `.pdf`, que ningún visor abre. Esto
   importa de verdad, porque la vigilancia diaria de normativa usa la clave `u` para
   sustituir el PDF cuando cambia el enlace (ver `docs/IMPRESOS-QUE-CAMBIAN.md`): tal como
   está, el primer refresco automático machacaría el PDF bueno con una página web.

   La dirección buena del PDF de esa misma disposición es:

       https://www.juntadeandalucia.es/boja/2011/132/d1.pdf

   **Cambiar la clave `u` solo en `O11:VI` y en `O11:VII`.** Las entradas `O11:I`, `O11:II`,
   `O11:III` y `O11:IV` también apuntan a esa página web, pero esas son `"via":"protocolo"`:
   no tienen PDF que descargar y su enlace es para leer el texto, así que **se quedan como
   están**. Las otras nueve direcciones del fichero son correctas y no se tocan.

2. **Marcar la fila 85 de `docs/COLA.md` como HECHA (20-sep-2026)** y apuntar la línea que
   toque en `docs/HISTORIA.md`.

## Los once ficheros, para comprobarlos

El tamaño es en bytes; el segundo número es el identificador de git de cada fichero
(`git hash-object <fichero>`). Todos coinciden con los del original descargado de la Junta.

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
`O11-VI.pdf` y `O11-VII.pdf`. Por eso se repiten tamaño e identificador. Es correcto, y es
lo que pedía la fila 85.

Qué es cada uno, comprobado abriéndolos:

- `O-I` y `O-II`: la Orden de escolarización publicada en el BOJA extraordinario 503 de 2020.
- `O-III` a `O-IX`: los Anexos III, IV, V, VI, VII, VIII y IX de esa misma Orden, cada uno en
  su fichero, en blanco y tal cual los publica la Consejería.
- `O11-VI` y `O11-VII`: la Orden de 20 de junio de 2011, de promoción de la convivencia
  (BOJA núm. 132, de 7 de julio de 2011).

## Cómo llegaron ahí, para no repetir el rodeo

La sesión de Cowork del 20-sep-2026 sí tenía internet: bajó los once, los abrió y comprobó
que eran los correctos. Pero **no podía subirlos**: un PDF es un fichero binario, y las
herramientas de la interfaz de GitHub (`push_files`, `create_or_update_file`) solo admiten
texto. Si se les pasa el contenido de un PDF, lo que sube no es el PDF, sino una ristra de
caracteres rotos con el mismo nombre: parece estar y no abre en ningún visor.

Así que los subió Francisco a mano, desde el navegador. Se intentó de tres maneras y solo
funcionó la tercera, que es la que hay que recordar:

1. Arrastrar el `.zip` a **Add file → Upload files**: sube el zip, no su contenido. No sirve.
2. Arrastrar los PDF sueltos a esa misma página: caen en la raíz del repositorio, no en la
   carpeta. Hubo que borrarlos después, uno a uno.
3. **Abrir directamente `https://github.com/<usuario>/<repositorio>/upload/main/<carpeta>`**
   y arrastrar ahí los ficheros sueltos. Esa página sube dentro de esa carpeta, la cree o no
   de antemano. Es la forma buena, y no hace falta pelearse con carpetas en el Chromebook.

**Regla para la próxima vez que haya que meter un fichero binario en el repositorio** (un
PDF, una imagen, una fuente): no lo intente ninguna sesión que solo tenga la interfaz de
GitHub. O lo sube Francisco con el método 3, o lo sube una sesión con `git push` de verdad.

Los borrados de la raíz y del zip se hicieron en una rama aparte y se fusionaron de una vez,
para no gastar doce publicaciones de Vercel (`docs/NO-GASTAR-PUBLICACIONES.md`).
