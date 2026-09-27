# Unir dos tipos de asunto en uno (fila 207)

Diseño cerrado con Francisco el 27-sep-2026, en conversación.

## Para qué

A veces hay dos tipos de asunto con nombre parecido que son lo mismo (por ejemplo, uno creado al
vuelo y otro de la biblioteca). Francisco quiere quedarse con uno solo **a partir de ese momento**,
sin tener que cambiar los asuntos de uno en uno.

## Lo que ve Francisco

1. En **Ajustes › pantalla de un tipo**, junto a «Cambiar el nombre», un botón nuevo:
   **«Unir con otro tipo»**.
2. Al pulsarlo, se elige en una lista (con buscador, como el de tipos de Nuevo asunto) **el tipo
   que se queda**. El tipo cuya pantalla está abierta es el que **desaparece**. El texto del
   cuadro lo dice así, sin ambigüedad: «"X" desaparece y todo pasa a "Y"».
3. Antes de hacer nada, la app enseña un resumen y pide confirmación (`U.preguntar`):
   - cuántos asuntos abiertos se van a pasar al tipo que se queda (y que sus carpetas cambian de
     nombre);
   - que la guía que vale desde ahora es la del tipo que se queda;
   - que el ARCHIVO no se toca.
4. Al confirmar:
   - Los **asuntos abiertos** del tipo que desaparece pasan al tipo que se queda. **Su carpeta se
     renombra** (el TIPO del nombre de carpeta pasa a ser el del tipo que se queda, con su nombre
     corto si lo tiene).
   - Esos asuntos **conservan sus hitos, sus tareas, su historial y sus notas tal como estaban**. No
     se les ofrece la guía nueva y no les llegan los hitos de la guía del tipo que se queda.
   - El tipo que desaparece **sale de la lista de tipos** y no vuelve a aparecer desde el otro
     ordenador.
   - Aviso verde final: «Unidos. N asuntos abiertos pasados a "Y"». Si alguno no se pudo
     renombrar, aviso ámbar con cuáles (lo principal —el tipo unido— ya está hecho).
5. **El ARCHIVO no se toca.** Las carpetas archivadas conservan su nombre. El buscador tiene que
   seguir encontrándolas al buscar por el tipo que se queda (ver «Alias», abajo).

## Qué pasa con cada cosa del tipo que desaparece

| Cosa | Qué se hace |
|---|---|
| Guía (`guias.json`) | Vale la del tipo que se queda. La del que desaparece va a la **papelera** (`Papelera.mandarDato('guia', …)`). Excepción: si el que se queda no tiene guía o solo la guía mínima (`EstadoHito.esGuiaMinima`), se queda la del que desaparece. **Ojo**: `TiposNombre.mover` hoy se queda con «la que más pasos tenga»; aquí la regla es otra. |
| Campos propios (`campos.json › porTipo`) | Se **suman**: los campos del que desaparece que no existan ya (por nombre, sin tildes ni mayúsculas) se añaden al final de los del que se queda. Nada se borra. |
| Plantillas de correo y de documento | Pasan al tipo que se queda (como hace `moverPlantillas`). Nada se borra. |
| Recurrentes | Pasan al tipo que se queda (como `moverRecurrentes`). |
| `repartirTipo` de otros tipos | Si apuntaban al que desaparece, pasan a apuntar al que se queda (como en `mover`). |
| Formularios, palabras clave, plazo de conservación | Los del tipo que se queda. Las palabras clave del que desaparece se **suman** a las suyas, sin repetir. |
| Quién lo encarga, reservado, categoría | Los del tipo que se queda. **Excepción**: si el que desaparece era **reservado** y el que se queda no, cada asunto abierto que se pasa queda marcado como reservado **uno a uno** (la marca por asunto de la fila 135, `js/reservados.js`), para que no se destape nada. |
| Nombre del que desaparece (y su nombre corto y sus alias) | Se añaden como **alias** del tipo que se queda. Así el buscador, las plantillas (`TiposNombre.nombresDe`) y el arreglo al entrar (`TiposNombre.arreglar`) lo reconocen, y las carpetas del ARCHIVO con el nombre viejo se encuentran. |
| El tipo en `tipos.json` | Se quita con la lápida de borrados que ya usan los tipos (`borrados`, `js/borrados-fusion.js`), para que no reaparezca desde el otro ordenador. |

## Cómo hacerlo (para Claude Code)

- **Módulo nuevo `js/tipos-unir.js`** (`TiposUnir.unir(queDesaparece, queSeQueda)`). Reutiliza lo
  de `js/tipos-nombre.js` que sirva (`moverPlantillas`, `moverRecurrentes`, `tipoPorNombre`);
  si hace falta exponer esas funciones, se exponen, sin cambiar lo que hacen para
  `App.renombrarTipo`. La guía y los campos llevan su propia regla (tabla de arriba), no la de
  `mover`.
- Cada fichero de `_GESTOR` por su cola (`App.enFila`), releyendo antes de escribir.
- **Renombrar cada asunto abierto solo por el camino de siempre**: el mismo de «Cambiar» un asunto
  (`js/asuntos-editar.js`: `Carpetas.renombrar` + `AsuntoRenombrar.mover`), **sin**
  `ofrecerGuiaNueva`. Si ya existe una carpeta abierta con el nombre nuevo, ese asunto se salta y
  sale en el aviso ámbar. Uno detrás de otro, no en paralelo.
- **Que no les lleguen los hitos de la guía nueva**: mirar cómo decide hoy la app que «los hitos
  nuevos de una guía llegan a los asuntos abiertos de su tipo» (casan por `origenGuia`, el `id` de
  cada paso) y comprobar que los asuntos pasados no reciben los pasos de la guía del tipo que se
  queda. Si los recibirían, marcar esos asuntos (por ejemplo, un campo en su ficha
  `tipoUnidoDe: "<nombre viejo>"`) y hacer que ese reparto los salte. Punto de enganche previsto,
  sin envolturas.
- El botón, en `js/ajustes-tipo.js`, junto a «Cambiar el nombre» (línea ~73). No añadir más de
  unas 20 líneas ahí: el cuadro y la lógica van en `js/tipos-unir.js`.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md` (guía, hito, tarea, tipo).
- Orden: primero todo lo de `_GESTOR` del tipo (guía, campos, plantillas, recurrentes, alias,
  lápida); después los asuntos abiertos. Si falla lo primero: aviso rojo (`U.fallo`) y no se toca
  ningún asunto. Si falla algo de los asuntos: ámbar (`U.accesorio`).

## Ficheros

- Nuevo: `js/tipos-unir.js`, `pruebas/tipos-unir.mjs`.
- Cambiar: `js/ajustes-tipo.js` (el botón), `js/tipos-nombre.js` (solo si hay que exponer
  funciones), `index.html` (cargar el módulo nuevo), el fichero del reparto de hitos a asuntos
  abiertos si hace falta el salto, `js/envolturas-esperadas.js` no (no se envuelve nada).
- Documentación: `docs/contexto/CAMPOS-Y-TIPOS.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`,
  `docs/CONTEXTO-CORTO.md` (una línea en la sección 5, sustituyendo si procede), `docs/HISTORIA.md`,
  `docs/COLA.md`.

## Prueba (`pruebas/tipos-unir.mjs`, una sola al final)

Con datos inventados: dos tipos «A» y «A BIS», cada uno con guía, un campo propio distinto y uno
repetido, una plantilla y un recurrente; dos asuntos abiertos de «A BIS» (uno con hitos ya
avanzados) y uno archivado. Unir «A BIS» en «A» y comprobar:

1. «A BIS» ya no está en los tipos y tiene lápida; «A» lleva «A BIS» como alias.
2. La guía de «A» no ha cambiado; la de «A BIS» está en la papelera.
3. Los campos de «A» son los suyos más el distinto de «A BIS», sin repetir el común.
4. La plantilla y el recurrente dicen «A».
5. Las dos carpetas abiertas se llaman ya con «A», y sus hitos son los mismos de antes (mismo
   número, mismos estados), sin pasos de la guía de «A».
6. La carpeta archivada no ha cambiado.
7. Si «A BIS» era reservado y «A» no, los dos asuntos pasados quedan reservados uno a uno.

## Cláusulas comunes

Las de `docs/REPARTO-DE-LA-COLA-2026-09-27.md` (a `main` sin pull request, como mucho tres
subidas, nada se sube con `npm test` en rojo, cambios quirúrgicos, no leer el repositorio entero).
