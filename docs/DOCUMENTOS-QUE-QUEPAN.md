# Fila 65 — Documentos que quepan en una subida

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, partes 3.3 y 3.4.

Esta fila no toca código. Arregla el método, que es lo que ha roto ficheros tres veces.

---

## 1. Qué pasa hoy

`docs/CONTEXTO.md` pesa 244 KB. `docs/HISTORIA.md` pesa 226 KB. Casi medio megabyte de texto que la
regla 8 de la cola obliga a actualizar al terminar **cualquier** instrucción.

Ya ha fallado tres veces:

- **17-sep-2026**: `CONTEXTO.md` se quedó en `main` con la palabra `PLACEHOLDER_WILL_REPLACE` y nada
  más. Hubo que recuperarlo del historial.
- **17-sep-2026**: `HISTORIA.md` se subió cortado a la mitad.
- **17-sep-2026**: `COLA.md` se quedó en 35 bytes, con un comando de shell sin ejecutar dentro.
- **18-sep-2026**: las filas 53 a 56 se subieron **sin actualizar ninguno de los dos**, porque ya no
  cabían. Está confesado al final de `docs/COLA.md`.

De ahí salieron las reglas 10, 11, 12 y 14. Las cuatro dicen lo mismo: *ten cuidado al reescribir un
fichero grande*.

**Cuando la solución a un problema es "ten más cuidado", el problema no está resuelto: está
aplazado.** Las reglas dependen de que cada sesión se acuerde, y ya se ha visto que a veces no.

La causa no es el descuido. Es que una sesión sin `git` de verdad tiene que reescribir un fichero
enorme entero para cambiar dos frases. Lo que hay que quitar es eso.

## 2. Qué hay que hacer

### 2.1 Partir `CONTEXTO.md` por módulos

`docs/CONTEXTO.md` se queda como **índice y reglas comunes**, por debajo de 30 KB: qué es cada
carpeta, las tablas de ficheros de `_GESTOR` y de columnas de CSV, las trampas técnicas que valen
para todo, y una tabla de contenidos que diga qué hay en cada documento hijo.

El resto baja a una carpeta `docs/contexto/`, un documento por zona. La partición sale de las
secciones que ya tiene hoy; propuesta de arranque, a ajustar al hacerlo:

| Documento | Qué lleva |
|---|---|
| `docs/contexto/ASUNTOS.md` | crear, editar, listar, archivar, reabrir, unir, duplicados, papelera |
| `docs/contexto/PERSONAS.md` | terceros, RegAlum, personal, empresas, grupos, DNI, ficha del tercero |
| `docs/contexto/DOCUMENTOS.md` | registro, nombres de documento, lector de PDF, separar/unir, ajustar tamaño |
| `docs/contexto/CORREO-Y-SENECA.md` | bandeja, adjuntos, plantillas, cuadro de Séneca, ayudante, Apps Script |
| `docs/contexto/HITOS-Y-GUIAS.md` | guías, hitos, requisitos, comunicar desde el hito, Qué me toca |
| `docs/contexto/CAMPOS-Y-TIPOS.md` | tipos de asunto, campos propios, campos calculados, Ajustes |
| `docs/contexto/PANTALLA.md` | cabecera fija, refresco, usabilidad, visor, tablón, notas |

Cada uno debe quedar **por debajo de 40 KB**. Si alguno se pasa, se parte otra vez.

Al principio de `docs/CONTEXTO.md` y de cada hijo, una línea que diga a cuál pertenece y cuándo hay
que actualizarlo.

**Importante:** partir es mover texto, no reescribirlo. No se resume ni se mejora nada en esta fila,
porque entonces no se sabría si se ha perdido algo. Al terminar, la suma de los trozos tiene que
llevar lo mismo que llevaba el original.

### 2.2 Cortar `HISTORIA.md` por fecha

`HISTORIA.md` es un diario. Se escribe siempre por arriba y no se relee casi nunca.

- Se queda con **las entradas de los dos últimos meses**.
- Todo lo anterior se mueve tal cual a `docs/HISTORIA-ANTERIOR.md`, que no se vuelve a tocar.
- Al final del fichero vivo, una línea con el enlace al anterior.
- Cuando el fichero vivo vuelva a pasar de 60 KB, se repite el corte. Que quede escrito en el propio
  documento.

Eso deja el fichero vivo en 30 o 40 KB.

### 2.3 Cambiar las reglas de la cola

Esto es lo que de verdad arregla el método. En `docs/COLA.md`:

- **Regla 8**: el único documento obligatorio de actualizar **en la misma subida que el código** es
  `docs/CONTEXTO-CORTO.md`. `CONTEXTO.md`, sus hijos y `HISTORIA.md` pueden ir en una subida aparte,
  incluso al día siguiente.
- **Regla 13**: sube a **tres** subidas por fila como máximo: la de marcar EN CURSO, la del trabajo,
  y una tercera opcional solo de documentación. Como esa tercera solo toca `docs/`, el
  `ignoreCommand` de `vercel.json` la salta y **no gasta ninguna publicación**. No hay motivo para
  seguir apretándolo todo en una.
- **Reglas 11, 12 y 14**: se quedan como aviso, pero añadiendo una línea que diga que si un documento
  de `docs/` pasa de 40 KB, lo que toca es partirlo, no reescribirlo con cuidado.

### 2.4 Podar `CONTEXTO-CORTO.md`

Tiene **exactamente 160 líneas**, y el tope es 160. Está lleno hasta el borde: la próxima fila ya no
cabe.

Y el tope se ha esquivado por el otro lado. Hay líneas de **más de 1.300 caracteres**: párrafos
enteros escritos como una sola línea para que cuenten como una. La sección "Qué está hecho" es casi
toda así.

Qué hacer:

- Cambiar el tope: **de 160 líneas a 14.000 caracteres**, y escribirlo en el propio documento y en la
  regla 9 de la cola. Un tope de líneas no protege de nada si las líneas pueden medir lo que
  quieran.
- Podar la sección "Qué está hecho" hasta dejarla por debajo de ese tope. El detalle de cada fila ya
  está en `HISTORIA.md` y en el documento de su instrucción: aquí sobra. Una línea por cosa, sin
  números de fila ni fechas.
- Actualizar la dirección vieja por `https://asuntos.fmargon.com` donde siga apareciendo, que ya
  estaba apuntado como pendiente.

## 3. Cómo se comprueba

No hay prueba automática que valga para esto. Lo que hay que comprobar a mano:

1. Ningún documento de `docs/` pasa de 40 KB, salvo `HISTORIA-ANTERIOR.md`, que no se toca nunca.
2. `docs/CONTEXTO-CORTO.md` está por debajo del tope nuevo de caracteres.
3. Al partir, no se ha perdido texto: comparar el tamaño del original con la suma de los trozos.
4. Buscar por todo el repositorio las menciones a `docs/CONTEXTO.md` y a `docs/HISTORIA.md`
   (`README.md`, `docs/COLA.md`, `docs/REPARTO-CONTEXTO.md`, `plantilla/`, la línea de lanzamiento de
   la cola) y actualizarlas donde apunten a algo que se ha movido.
5. `npm test` en verde, aunque no debería tocarle nada.

## 4. Qué NO hay que hacer

- **No** borrar `HISTORIA.md` ni resumirlo. Se corta y se mueve, entero.
- **No** aprovechar para reescribir ni mejorar el contenido de `CONTEXTO.md`. Mover, y punto.
- **No** subir esta fila junto con ninguna otra.

## 5. Cuánto es

Medio día. Es la fila que más tiempo va a ahorrar de aquí en adelante.
