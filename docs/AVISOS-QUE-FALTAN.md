# Fila 68 — Los avisos que faltan

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, partes 2.3 y 4.

Tres cosas que la aplicación ya sabe, pero que no dice. Independientes entre sí.

---

## 1. Las fichas huérfanas no avisan

### Qué pasa hoy

Si alguien renombra o mueve una carpeta de asunto desde el explorador de archivos, su ficha se
queda huérfana: sigue en `asuntos.json` con las notas y todo, pero no se ve en ningún sitio.

`js/fichas-huerfanas.js` las encuentra y deja enlazarlas o borrarlas. Está bien hecho. **Pero hay
que ir a buscarlo a Ajustes → Mantenimiento.** Si no sabes que esa pantalla existe, no te enteras
nunca.

### Qué hay que hacer

Que en la pantalla de asuntos abiertos salga una línea discreta cuando haya alguna: *"Hay 2 fichas
sin carpeta. Verlas."*, que lleve al bloque de Ajustes que ya existe.

Ojo con el coste: `calcular()` llama a `App.verArchivo()` si el archivo no se ha leído esta sesión,
y eso recorre carpetas. **No hacerlo al arrancar.** Dos opciones, y recomiendo la segunda:

1. Contarlas solo cuando el ARCHIVO ya esté leído por otro motivo.
2. Contarlas con el índice del ARCHIVO (`_GESTOR/indice-archivo.json`), que ya tiene los nombres de
   todas las carpetas archivadas y no cuesta nada. Si el índice no está hecho, no se cuenta y no sale
   la línea.

Con la fila 64 hecha, este cálculo cambia: la ficha de un archivado ya no está en `asuntos.json`.
**Si la 64 va antes, hay que rehacer el cálculo entero.** Si va después, la 64 ya avisa de esto.

## 2. Los asuntos dormidos

### Qué pasa hoy

Nada avisa de un asunto abierto desde hace ocho meses sin una sola nota. "Qué me toca" cruza los
**hitos** pendientes, no los asuntos olvidados: un asunto sin hitos, o con todos sus hitos hechos
pero sin archivar, no sale por ningún lado.

### Qué hay que hacer

Un bloque más en "Qué me toca", debajo de los tres que ya tiene: **"Dormidos"**. Los asuntos
abiertos en los que no ha pasado nada en más de N días.

- "No ha pasado nada" = ni nota, ni cambio de estado, ni documento nuevo en la carpeta, ni hito
  tocado. Casi todo eso ya está en la ficha (`notaEl`, `situacionEl`, `editadoEl`); el documento más
  nuevo de la carpeta hay que mirarlo, y eso cuesta, así que **con lo de la ficha basta**.
- N por defecto, **60 días**, configurable en Ajustes → El centro.
- Cada línea, con los días que lleva y un botón para abrir la ficha.
- Y un botón "Ocultar este por 30 días", que guarde la fecha en la ficha: hay asuntos que de verdad
  están esperando a algo de fuera, y no se puede estar avisando de ellos toda la vida.

## 3. La papelera no se vacía sola

### Qué pasa hoy

`js/papelera.js` avisa de lo que lleva más de 30 días y ofrece un botón. Pero **hay que pulsarlo**.
Si nadie lo pulsa, los asuntos borrados —con sus documentos enteros— se quedan dentro del Dropbox
del centro para siempre.

Para datos de menores, un borrado que nunca ocurre no es lo ideal.

### Qué hay que hacer

Lo mínimo, y a propósito: **no borrar nada solo**.

- Que el aviso de más de 30 días salga también en la pantalla de asuntos abiertos, no solo dentro de
  la papelera, y que no se pueda quitar sin decidir.
- Que diga cuántas cosas son y cuánto ocupan.
- Dejar el botón como está.

Y una decisión que es de Francisco, no de quien programe: **si la papelera debe vaciarse sola a los
N días.** Si él dice que sí, se hace en esta misma fila; si dice que no, se queda solo el aviso más
insistente y se apunta la decisión en `docs/HISTORIA.md`. **Preguntárselo antes de empezar esta
parte.**

## 4. Cómo se comprueba

Prueba nueva, `pruebas/avisos-que-faltan.mjs`, sin navegador:

1. Con una ficha cuya carpeta no está, sale la línea de fichas huérfanas con la cuenta bien; sin
   ninguna, no sale nada.
2. Contar las huérfanas **no** dispara un recorrido del ARCHIVO.
3. Un asunto con la última nota de hace 90 días sale en "Dormidos"; uno de hace 10, no.
4. Ocultar un dormido lo quita durante 30 días y lo devuelve después.
5. La papelera con algo de hace 40 días saca el aviso en la pantalla principal.

## 5. Qué NO hay que hacer

- **No** borrar nada automáticamente en esta fila sin que Francisco lo haya dicho.
- **No** convertir los avisos en cuadros que interrumpen. Son líneas discretas que se pueden ignorar
  ese día.
- **No** mirar la fecha de los documentos de cada carpeta para saber si un asunto está dormido:
  costaría un recorrido entero del disco cada vez que se abre "Qué me toca".

## 6. Cuánto es

Un día los tres.
