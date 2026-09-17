# Repaso de la cola: filas que faltaban y dos ficheros que arreglar

Escrita el 17-sep-2026 desde la conversación de Cowork, después de repasar `docs/COLA.md` entera
y compararla con lo que hay de verdad en `docs/` y en `js/`. No toca código de la aplicación ni
publica versión nueva: es papeleo de la cola, más un comando de git.

**Apúntate tú mismo en la cola** como **fila 41**, estado EN CURSO, en tu primer commit, y márcala
HECHA al terminar. Va la primera de todas: es corta y deja la cola en orden para las demás.

---

## 1. Dos instrucciones diseñadas que se quedaron fuera de la cola

Los dos documentos existen en `docs/` desde el 17-sep-2026, pero nadie les puso fila, así que
nunca se han trabajado. **Comprobado: no están hechos.**

Añade estas dos filas al final de la tabla de `docs/COLA.md`:

    | 42 | `docs/BUSCADOR-ARCHIVO-INDICE.md` | PENDIENTE | Se subió a `main` el 17-sep-2026 a las 17:34 sin fila propia. **No está hecha**: `js/archivo-indice.js` no existe. Índice guardado del ARCHIVO y búsqueda por palabras sueltas, en los nombres de los documentos, en el número de registro de Séneca y en la ficha del asunto. Es la primera de tres instrucciones sobre el buscador del ARCHIVO; las otras dos están sin diseñar. |
    | 43 | `docs/ARCHIVAR-ATASCOS.md` | PENDIENTE | Escrita el 17-sep-2026 pidiendo ser la fila 33, pero ese número se lo llevó `TABLON-NO-SE-BORRA.md` y la instrucción se quedó fuera de la cola. **No está hecha**: `U.mensajeDeError` no existe en `js/util.js`. Traducir al castellano los errores del navegador al archivar, no contar ni copiar los ficheros temporales de Dropbox, y reconocer que la carpeta ya estaba archivada o reabierta. Antes de empezar, comprueba qué queda por hacer de verdad: las filas 32, 33 y 34 tocaron esta misma zona después de escribirse el documento. |

## 2. Arregla la cabecera de `docs/ARCHIVAR-ATASCOS.md`

Ese documento dice que se apunte como "fila 33". Ya no vale: ahora es la **fila 43**. Sustituye
esas dos líneas de su cabecera por el número bueno, y añade ahí mismo el aviso de que las filas
32, 33 y 34 tocaron después la misma zona y hay que mirar qué queda por hacer.

## 3. Pon al día la línea "Orden de trabajo" de `docs/COLA.md`

Debe quedar así, con este orden y este motivo:

> **Orden de trabajo:** quedan pendientes las filas 41, 43, 36, 37, 40, 38, 39 y 42, en ese orden.
> La 41 (esta) va la primera por ser papeleo corto. La 43 va después por ser un fallo que Francisco
> sufre al archivar. La 37 va después de la 36 y la 40 después de la 37: comparten pantalla.
> Las filas 1 a 35 están hechas.

## 4. Restaura `docs/HISTORIA.md`, que está a medias

Está en **69.836 bytes** y de verdad tiene **140.232**. Se rompió el 17-sep-2026 y una sesión
posterior lo dejó a medio restaurar.

**Comprobado con un clon del repositorio:** lo que hay ahora es un trozo exacto de la versión
buena, sin ni una línea nueva. Así que se restaura entero de un golpe, sin mirar nada:

    git checkout 0aea5b3daa4170c46b1c47af18e8dc29bbe81a87 -- docs/HISTORIA.md

Comprueba el tamaño (**140.232 bytes**) antes de darlo por bueno. **No le añadas ninguna entrada
nueva** por las filas 33, 34 o 35: como ya dice la nota de la fila 35, no le hace falta.

Después, en `docs/COLA.md`, cambia el apartado **"Pendiente de arreglar: `docs/HISTORIA.md`"** por
uno que diga que quedó restaurado el 17-sep-2026, con el tamaño comprobado.

## 5. Al terminar

- Sube directo a `main`, sin pull request. Vuelve a bajar `main` antes de cada subida (regla 10).
- No hace falta tocar `App.VERSION` ni publicar: aquí no cambia nada de la aplicación.
- `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` no cambian por esto.
- Sigue con la fila 43 y con el resto de la cola, sin parar.
