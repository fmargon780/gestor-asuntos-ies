# Cargar el contenido de la biblioteca de hitos

Fila 80 de `docs/COLA.md`. Acordada con Francisco el 20-sep-2026, en la conversación en la que se
repasaron sus 55 Tipos de Asunto uno a uno.

**Esta fila va DESPUÉS de la 79.** Sin la fila 79 no existen ni la biblioteca
(`_GESTOR/hitos-biblioteca.json`), ni el campo `soloInformativo`, ni el campo `normativa`, ni el
nombre corto del tipo. Si la 79 no está HECHA, deja esta BLOQUEADA y sigue con otra.

**Sube directamente a `main`, sin abrir ninguna petición de cambios.** No leas el repositorio
entero. Una sola tanda de pruebas al final.

---

## 1. Qué hay que hacer

Tres cosas, en este orden:

1. **Dar de alta los Tipos de Asunto que faltan** en `_GESTOR/tipos.json`, con su nombre largo, su
   nombre corto y su categoría.
2. **Poner el nombre corto** a los tipos que ya existen: su nombre de hoy pasa a ser el nombre
   corto, y el nombre largo es el que dicen los documentos de contenido.
3. **Crear los hitos modelo** en `_GESTOR/hitos-biblioteca.json` y **escribir la guía de cada
   tipo** en `_GESTOR/guias.json` con sus pasos, traídos de la biblioteca.

El contenido está en tres documentos:

- `docs/contenido/BIBLIOTECA-ALUMNADO.md`
- `docs/contenido/BIBLIOTECA-PERSONAL.md`
- `docs/contenido/BIBLIOTECA-EMPRESAS-Y-OTROS.md`

## 2. Cómo se lee el contenido

Cada tipo se escribe así:

    ### CORTO — Nombre largo del tipo
    Encarga: Jefatura de Estudios · Campos: Colectivo
    NUEVO
    1. [i] Título del hito · Responsable · plazo · reunir: A; B · comunica: C · norma: Cita {bloque|clave}

- **`### CORTO — Nombre largo`**: `CORTO` es el `nombreCorto` (lo que entra en la carpeta) y
  `Nombre largo` es el `nombre` del tipo. Si el corto y el largo coinciden, se escribe una sola
  vez y `nombreCorto` queda vacío.
- **`NUEVO`** en una línea suelta significa que ese tipo **no existe todavía** y hay que crearlo.
  Si no aparece, el tipo ya está en `tipos.json` con el nombre corto como nombre: hay que
  **renombrarlo al nombre largo y ponerle el corto**, no crear uno nuevo.
- **`Encarga`** es informativo, para Francisco. No es un campo de `tipos.json`.
- **`Campos`**, cuando aparece, son campos propios que hay que crear y asignar a ese tipo.
- Cada línea numerada es un hito: `titulo · responsable · plazo · requisitos · comunicación ·
  normativa`. Los tramos que no aparezcan van vacíos.
- **`[i]`** al principio del título significa `soloInformativo: true`. Sin `[i]`, es un hito
  normal que sí le toca a Administración.
- **`reunir:`** son los requisitos, separados por punto y coma. Van como casillas, igual que las
  de la fila 59.
- **`comunica:`** es a quién se avisa. No es el texto del correo: las plantillas se escriben
  después, con el uso.
- **`norma:`** es una referencia de normativa. Puede haber varias, separadas por ` + `. El tramo
  entre llaves es `{bloque|clave}` del sistema de normativa del centro. **Si no hay llaves, la
  referencia va solo con su cita, sin bloque ni clave**: se ve el texto y no enlaza. No inventes
  claves.

## 3. Reglas al cargar

- **Un hito que se repite en varios tipos se guarda UNA SOLA VEZ en la biblioteca** y se trae a
  cada tipo. Ese es el sentido de la fila 79. Antes de crear un modelo nuevo, mira si ya existe
  uno con el mismo título y el mismo responsable.
- **`soloInformativo` lo manda el documento**, no la regla automática del apartado 4.6 de la fila
  79: aquí las marcas están puestas a mano, tipo por tipo.
- **No toques los asuntos ya creados.** Ni sus hitos, ni sus carpetas. El nombre corto solo afecta
  a los asuntos nuevos.
- **No borres ningún tipo.** Lo que sobra ya lo quitará Francisco desde la aplicación.
- **Los plazos que el documento deja vacíos, se dejan vacíos.** No los rellenes por tu cuenta: hay
  normas que todavía no están en el sistema de normativa del centro, y están apuntadas en
  `docs/NORMAS-QUE-FALTAN.md` del repositorio `fmargon780/normativa-escolarizacion`.
- **Las plantillas de correo y de Séneca no se cargan en esta fila.** Se escriben con el uso.

## 4. Cómo se carga

No a mano. Escribe un programa de una sola vez, `herramientas/cargar-biblioteca.mjs`, que lea los
tres documentos y genere los dos ficheros de salida (`hitos-biblioteca.json` y los pasos de
`guias.json`, más las altas de `tipos.json`) en una carpeta local. Francisco los coloca en su
`_GESTOR` con un botón de Ajustes → Mantenimiento: **"Cargar la biblioteca del centro"**, que:

- lee los tres ficheros generados, que van dentro de la aplicación como datos estáticos,
- **fusiona, no pisa**: un modelo que ya exista con el mismo `id` se deja como está; un tipo que
  ya tenga guía escrita no se toca, y se avisa de cuáles se han saltado,
- enseña al terminar un resumen: cuántos tipos, cuántos modelos y cuántas guías.

Así Francisco lo pulsa cuando quiera, y puede volver a pulsarlo si mañana se amplía el contenido.

## 5. Al terminar

`npm test` en verde, subida a `main`, comprobar lo publicado con `curl`, y marcar la fila 80 como
HECHA. Un mensaje corto a Francisco: cuántos tipos nuevos hay, dónde está el botón y qué verá al
pulsarlo.
