# Fila 72 — Cinco detalles de mantenimiento

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, partes 2.8 y 4.

Cinco cosas pequeñas e independientes. Se pueden hacer en cualquier orden, y si alguna se complica
se deja para otra fila.

---

## 1. La versión, sacada del reloj y no escrita a mano

> **19-sep-2026: separado a la fila 76.** No se hizo en la fila 72 porque las dos formas de
> hacerlo tienen un riesgo real que esta sesión no podía comprobar de verdad: un paso de GitHub
> Actions que comprometa `js/version.js` puede acabar en un bucle de commits o duplicar
> publicaciones de Vercel (justo lo que la regla 13 de la cola quiere evitar), y generar
> `js/version.js` en el momento de publicar necesita tocar `vercel.json` con un `buildCommand`
> nuevo (hoy no hay ninguno: la web se sirve tal cual, sin construir nada) que solo se puede
> probar de verdad publicando en el Vercel real, cosa que esta sesión no puede hacer. Mejor
> dejarlo pendiente que arriesgar la cuota o romper la publicación entera a ciegas.

### Qué pasa hoy

`js/version.js` tiene la fecha y la hora escritas a mano:

    App.VERSION = '18-sep-2026 · 20:36';

El propio fichero avisa, con letras grandes, de que hay que sacarla del reloj de verdad y no a ojo.
Y aun así, el 17-sep-2026 salieron versiones con horas por delante de la real. La regla 4 de la cola
existe solo por esto.

Es un dato que sirve para una cosa: saber si lo que se está viendo en el navegador es lo último
publicado. Si va mal, engaña justo cuando más falta hace.

### Qué hay que hacer

Que salga sola. La forma más simple, sin montar nada: un paso en el flujo de GitHub
(`.github/workflows/`) que, al subir a `main`, escriba la fecha y la hora de verdad en `js/version.js`
antes de que Vercel publique.

**Cuidado con dos cosas:**

- Si ese paso hace un commit, dispara otra publicación de Vercel. Hay que comprobar que el
  `ignoreCommand` no la salta por error, y que no se monta un bucle de commits.
- Si se complica, la alternativa buena es más tonta y también sirve: que `js/version.js` se genere en
  el momento de publicar, no en el repositorio.

**Si las dos salen mal, se deja como está y se apunta.** Vale más una versión a mano correcta que un
automatismo que se pelee con la cuota de publicaciones.

## 2. El nombre de usuario, de una lista

### Qué pasa hoy

Al entrar se escribe un nombre en un campo de texto libre. Sin lista y sin comprobación. Ese nombre
queda escrito en cada nota, en cada línea de historial de hito y en la señal de presencia.

Si un día se escribe "Francsico", queda así para siempre en esos apuntes. Y "Francisco",
"francisco" y "Francisco M." son tres personas distintas para la aplicación.

### Qué hay que hacer

- Una lista de nombres en Ajustes → El centro, guardada en `_GESTOR` como un fichero compartido más
  (o dentro del de ajustes que ya haya).
- En la pantalla de entrada, un desplegable con esos nombres, más la opción "Otro…" que abre el campo
  de texto de siempre. Quien escriba un nombre nuevo, que entre en la lista.
- Si la lista está vacía (primera vez), se comporta exactamente como hoy.
- **No** tocar los nombres ya escritos en las notas. Eso es historia y no se reescribe.

## 3. Los borrados de las listas, que se fusionen entre ordenadores

> **19-sep-2026: separado a la fila 77.** Al mirarlo de cerca, "respeta el borrado si es más
> nuevo que el alta del otro lado" necesita saber cuándo se dio de alta cada elemento, y hoy
> ninguno de los cuatro ficheros lo guarda (`tipos.json` es solo `{tipo, categoria}`, sin fecha).
> Sin eso, un borrado y un alta hecha en el otro ordenador después no se pueden distinguir de un
> borrado y una alta vieja que todavía no había llegado. La forma de resolverlo sin fechas por
> elemento (una alta a mano siempre "gana" a un borrado antiguo, por ser un gesto explícito y
> posterior) toca los cuatro ficheros, sus altas y bajas, y la pantalla de Ajustes de cada uno:
> más para hacer de una sentada de lo que le tocaba a esta fila, que es cinco cosas pequeñas e
> independientes. Mejor como fila propia.

### Qué pasa hoy

Está escrito en `docs/CONTEXTO-CORTO.md`, en "Qué falta": los borrados en `tipos.json`,
`estados.json`, `tipos-documento.json` y `recurrentes.json` **no se fusionan** entre ordenadores.
Solo las altas.

Consecuencia práctica: Francisco borra un tipo de asunto que ya no se usa; su compañero abre la
aplicación y el tipo reaparece, porque su ordenador tenía la lista con el tipo dentro y al guardar
se suman las dos.

Con dos personas ya molesta. Con tres, sería peor.

### Qué hay que hacer

Que borrar no sea quitar de la lista, sino **marcar como borrado**. Añadir a cada elemento un campo
`borradoEl` con la fecha, y que la fusión respete el borrado si es más nuevo que el alta del otro
lado.

Los elementos marcados no se enseñan en ningún sitio, salvo en una línea de Ajustes →
Mantenimiento que diga cuántos hay y permita quitarlos del todo pasado un tiempo.

Mirar cómo lo hace `App.fusionarConDisco` en `js/nucleo.js`, que es donde vive la fusión de altas
de hoy.

## 4. Las copias de seguridad, con caducidad

### Qué pasa hoy

`js/copias.js` guarda **las últimas 30 copias de cada uno de los trece ficheros** de `_GESTOR`. Por
número, no por fecha.

Cuando `asuntos.json` pese 3 MB, eso son 90 MB de copias. Con 9 MB, 270 MB. No es problema de
espacio, pero son 30 fotos completas de los datos del centro en una carpeta que nadie mira.

### Qué hay que hacer

Añadir una caducidad además del número: **se borran las de más de 90 días, aunque no se hayan
llegado a 30**. Las copias de un fichero que se detectó roto siguen sin borrarse nunca, como hoy.

Configurable en Ajustes → El centro, con 90 días por defecto.

Si se hace **después** de la fila 64, esto casi deja de importar: con `asuntos.json` por debajo de
medio megabyte, 30 copias son 15 MB. Aun así, la caducidad conviene por lo que son, no por lo que
pesan.

## 5. Las librerías de PDF, al día

### Qué pasa hoy

`js/lib/pdf.min.js` es pdf.js **versión 3.11.174**, que es de 2023. `pdf-lib` va por el mismo
camino. Están copiadas dentro del repositorio a propósito, que es lo correcto: así no se traen de un
servidor ajeno cada vez.

Pero eso significa que **no van a recibir nunca un arreglo de seguridad** salvo que alguien las
cambie a mano. Y pdf.js es la que abre los PDF que llegan por correo desde fuera del centro.

El riesgo es bajo. No es cero.

### Qué hay que hacer

Poco, y casi todo escribir:

- Mirar qué versión hay hoy de pdf.js y si hay avisos de seguridad de la 3.11.174.
- Si los hay, cambiar el fichero por el de la versión nueva y probar a fondo: leer el sello de un
  PDF registrado, las miniaturas de separar/unir, y "Ajustar tamaño". La cabecera de
  `js/registro-lector.js` ya dice cómo se cambia de versión.
- Si no los hay, dejarlo y **apuntar en `docs/COMPROBAR-A-MANO.md` que hay que mirarlo una vez al
  año**. Eso es lo que de verdad resuelve esto.

---

## 6. Cómo se comprueba

- `npm test` en verde, con las pruebas que pida cada punto.
- Prueba nueva para el punto 3, `pruebas/borrados-que-se-fusionan.mjs`: un tipo borrado en un
  ordenador no reaparece al fusionar con el otro; un tipo dado de alta después del borrado, sí entra.
- Prueba nueva para el punto 4, dentro de `pruebas/copias.mjs`, que ya existe: una copia de hace 100
  días se borra; una de hace 10, no.
- El punto 1 se comprueba publicando y mirando que la versión de abajo a la izquierda es la hora de
  verdad.
- Los puntos 2 y 5, a mano.

## 7. Qué NO hay que hacer

- **No** reescribir los nombres de usuario ya guardados en las notas.
- **No** borrar del todo los elementos marcados como borrados hasta que hayan pasado meses.
- **No** cambiar las librerías de PDF sin probar los tres sitios que las usan.
- **No** empeñarse con el punto 1 si se pelea con la cuota de publicaciones.

## 8. Cuánto es

Un día los cinco. Si alguno se atasca, se deja y se apunta: son independientes.
