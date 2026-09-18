# Comunicar desde el hito

Instrucción para Claude Code. Acordada con Francisco el 18 de septiembre de 2026.
Fila 60 de `docs/COLA.md`.

**Antes de empezar**: lee `docs/CONTEXTO-CORTO.md` y, de `docs/CONTEXTO.md`, solo los apartados de
hitos, guías, plantillas y correo. **No leas el repositorio entero.** Los ficheros que hay que
tocar están listados abajo.

**Va después de la fila 59** (`docs/REQUISITOS-DE-HITO.md`): las dos tocan el editor de un paso
del trámite y el panel de hitos. Si la 59 no está hecha, hazla primero.

**Cómo subirlo**: directamente a `main`, sin abrir ninguna petición de cambios (si la sesión es en
la nube y no puede tocar `main`, pull request y fusionarlo tú mismo, según la nota final de
`docs/COLA.md`). Cambios quirúrgicos: no reescribas ficheros enteros. Como máximo dos subidas
(regla 13 de la cola). Una sola comprobación al final.

---

## 1. El problema

Hoy la plantilla de correo y la de Séneca son del **tipo de asunto** entero: una sola para todo el
trámite. Pero un trámite no se comunica una vez. Se pide un papel al principio, se avisa de una
resolución al final, y los dos textos no se parecen en nada. Además hay que subir a la cabecera de
la ficha para comunicar, aunque lo que toca esté escrito en el hito que se tiene delante.

## 2. Qué hay que hacer, en corto

1. Cada paso del trámite de un tipo puede llevar **su propio texto de comunicación**, para correo,
   para Séneca, o para los dos.
2. El hito de ese paso enseña un botón **Comunicar**, y solo lo enseña si hay texto escrito.
3. El destinatario lo propone el propio hito, a partir de su responsable.
4. Al preparar el mensaje queda constancia, una sola vez, en el historial del hito y en las notas
   del asunto.

La plantilla general del tipo **no se toca**: sigue donde está y sigue siendo la que usa el botón
Comunicar de la cabecera de la ficha. Un paso sin texto propio funciona exactamente como hoy.

## 3. Dónde se guarda

En `_GESTOR/guias.json`, cada paso gana un campo nuevo, opcional:

    comunicacion: {
      correo:  { asunto: '', cuerpo: '' },
      seneca:  { asunto: '', cuerpo: '' }
    }

- Las dos partes son opcionales e independientes: se puede tener solo correo, solo Séneca, o las
  dos.
- Se considera "vacía" si el cuerpo está en blanco, aunque haya asunto.
- Los pasos de dentro de una opción de una pregunta (bifurcación) también pueden llevarla.
- En `_GESTOR/hitos.json` **no se guarda copia del texto**: el hito lo lee de la guía de su tipo
  por `origenGuia` cuando se pulsa el botón. Si Francisco cambia el texto del paso, los asuntos
  vivos usan el nuevo. Eso es lo que se quiere.

## 4. En la pantalla del tipo

Ajustes › Tipos de asunto › un tipo › Pasos del trámite › el editor de un paso: sección plegable
**Comunicación de este paso**, debajo de la de la fila 59. En la cabecera de la sección, una marca
gris con lo que tiene escrito (`Correo · Séneca`, `Correo`, o nada).

Dentro, dos pestañas, **Correo** y **Mensaje de Séneca**, cada una con campo de asunto, campo de
texto y el botón **Insertar hueco** que ya existe (`js/huecos-buscador.js`). Los huecos son los
mismos que los de las plantillas del tipo, sin inventar ninguno nuevo; si la fila 59 está hecha,
también `{{LO QUE FALTA}}`.

**No escribas un editor nuevo.** Reutiliza el de `js/plantillas-ajustes.js`, pasándole dónde
guardar. Si para eso hace falta sacar su formulario a una función que reciba el objeto
`{asunto, cuerpo}` y un callback de guardado, hazlo: es un cambio pequeño y evita dos editores que
se van separando con el tiempo.

Se guarda con el mismo botón de guardar del paso. Nada de un guardado aparte.

## 5. En el hito

Botón **Comunicar** en la fila de acciones del hito, **solo si su paso de origen tiene texto**. Si
hay texto para los dos canales, el botón abre el mismo menú pequeño (`js/ficha-menus.js`) con
**Correo** y **Mensaje de Séneca**; si solo hay uno, abre ese directamente, sin menú.

Abre el cuadro de siempre (`js/correo.js` o `js/seneca-cuadro.js`), con el asunto y el texto del
paso ya puestos y los huecos resueltos con los datos del asunto. Todo editable antes de copiar.
Como siempre: **la aplicación prepara el mensaje, no lo envía**.

### El destinatario

Se propone así, en este orden:

1. Si el responsable del hito es un papel (`tercero`, `tutor`, `relacionado`), el destinatario es
   esa persona. Para `relacionado`, si hay más de uno, se ponen todos.
2. En cualquier otro caso (responsable del centro, o sin responsable), el tercero del asunto.

Si de ahí no sale ninguna dirección de correo (o ningún usuario IdEA, en Séneca), el cuadro se
abre con el destinatario vacío y su aviso de siempre. Nunca se bloquea el botón por eso.

### La constancia

Al pulsar el botón que copia o prepara el mensaje (el mismo punto en que hoy se apunta la nota de
"Correo preparado"), se escribe **una sola vez**:

- Una línea en el historial del hito: `Comunicado a <nombre> por correo · 18-sep-2026`.
- Una nota en el asunto con el mismo texto (`App.anotar`, releyendo antes, como siempre).

Un solo apunte por cada mensaje preparado. Si el cuadro se cierra sin copiar nada, no se apunta
nada.

## 6. Ficheros que hay que tocar

| Fichero | Qué |
|---|---|
| `js/guias.js` | Normalizar `comunicacion` al leer y al guardar un paso. Solo eso |
| `js/guias-comunicacion.js` | **Nuevo.** La sección del editor de un paso: las dos pestañas y el guardado. Menos de 400 líneas |
| `js/plantillas-ajustes.js` | Sacar el formulario de asunto + cuerpo + Insertar hueco a una función reutilizable. Cambio quirúrgico |
| `js/hitos-comunicar.js` | **Nuevo.** El botón del hito: decidir si hay texto, elegir canal, resolver destinatario, abrir el cuadro y apuntar la constancia. Se engancha a `window.Hitos`, como `js/hitos-archivo.js` |
| `js/hitos-panel-lista.js` | Pintar el botón en el hito |
| `js/correo.js`, `js/seneca-cuadro.js` | Aceptar, al abrirse, un asunto y un cuerpo ya dados y un destinatario propuesto. Si ya existe ese camino (la fila 59 lo usa), reutilízalo |
| `index.html` | Los dos `<script>` nuevos, en su orden |
| `css/` | Lo mínimo, en la hoja que ya usen los hitos y la de Ajustes |
| `pruebas/comunicar-desde-hito.mjs` | **Nueva** |

## 7. La prueba

Una sola, al final, sin navegador:

1. Un paso con `comunicacion.correo.cuerpo` escrito hace que su hito tenga botón Comunicar; un
   paso sin nada, no.
2. Con texto solo de Séneca, el botón abre Séneca sin pasar por el menú.
3. El destinatario propuesto es el tutor cuando el responsable del hito es `tutor`, y el tercero
   del asunto cuando el responsable es una persona del centro.
4. Los huecos del cuerpo salen resueltos con los datos del asunto.
5. Preparar el mensaje deja una línea en el historial del hito y una nota en el asunto, una sola
   vez.

Comprueba que la prueba falla sin el cambio antes de darla por buena.

## 8. Al terminar

- `docs/CONTEXTO-CORTO.md`: sustituir la línea de hitos o la de plantillas por una que diga que
  cada paso puede llevar su propia comunicación. No añadir línea debajo. Máximo 160 líneas.
- `docs/CONTEXTO.md`: apartados de hitos, guías y plantillas al día, y los ficheros nuevos.
- `docs/HISTORIA.md`: entrada con la fecha.
- `docs/COLA.md`: fila 60 a HECHA.
- Comprobar lo publicado con `curl` sobre `https://gestor-de-asuntos.vercel.app`.
- Mensaje final para Francisco, tres frases.
