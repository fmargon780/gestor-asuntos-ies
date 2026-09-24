# Fila 122 — El editor de la guía, en acordeón

Cerrado con Francisco el 24-sep-2026.

## El problema

En Ajustes → tipo → «Pasos del trámite», al escribir la guía, todos los pasos salen abiertos con
todos sus campos a la vista. Con varios pasos, la pantalla se hace larguísima y no se ve el trámite
de un vistazo.

## Lo que tiene que pasar

1. **Cada paso cerrado ocupa una sola línea**: el número, el título y unas marcas pequeñas con lo que
   tiene dentro. Marcas: «Normativa (N)», «Documentos (N)», «Guion (N)», «Pregunta» si el paso es una
   pregunta, «Solo informativo» si lo es, y el responsable si lo tiene. Si no tiene nada, solo número y
   título. Las flechas ↑ ↓ y «Quitar» siguen en la línea, también con el paso cerrado.
2. **Al pulsar la línea (fuera de los botones), el paso se abre** con todos sus campos, como hoy.
   Pulsarla otra vez lo cierra.
3. **Solo un paso abierto a la vez** en todo el editor. Abrir uno cierra el que estuviera abierto.
   Vale igual para los pasos que van dentro de una opción de una pregunta («+ Añadir un paso a esta
   opción»): abrir uno de esos cierra cualquier otro, pero **no** cierra el paso-pregunta que lo
   contiene (ese sigue abierto para que se vea dónde está).
4. **«Añadir un paso»** (y «+ Añadir un paso a esta opción», y «+ Traer de la biblioteca»): el paso
   nuevo aparece ya abierto y con el cursor en su título. Los demás, cerrados.
5. **Subir o bajar un paso con las flechas** no lo cierra ni lo abre: se queda como estaba, y la
   pantalla lo sigue para que no se pierda de vista.
6. **Al entrar en la guía, todos los pasos cerrados.** Excepción: si se entra desde el mapa pulsando una
   caja, ese paso se abre (y los pasos-pregunta que lo contienen).
7. **Si se pierde el foco al repintar** (hoy `pintar()` reconstruye y `restaurarAbierto` recuerda qué
   `<details>` estaban abiertos): el paso abierto tiene que seguir abierto tras cualquier repintado,
   igual que ya pasa con los apartados de dentro.
8. **Los apartados de dentro del paso siguen plegados como hoy.** Pero «Documentos de este paso» y
   «Guion de este paso» tienen que tener la misma caja gris y el mismo tamaño de letra que
   «Responsable, estado y plazo», «Lo que hay que reunir», «Comunicación de este paso» y «Normativa».
   Hoy salen sin caja y con letra más grande.
9. Un paso con un error al guardar (por ejemplo, título vacío) se abre solo para que se vea.

## Ficheros

- `js/guias.js` (1.204 líneas): **hay que partirlo antes de tocarlo**, como dicen las reglas. Lo del
  acordeón va a un fichero nuevo `js/guias-plegado.js` (qué paso está abierto, la línea resumida, las
  marcas, abrir/cerrar). Si con eso `js/guias.js` sigue por encima de unas 400 líneas en la parte que
  hay que tocar, saca también a otro fichero lo que tenga sentido separar (por ejemplo, el pintado de
  un paso). Cargar el fichero nuevo donde se cargan los demás `js/guias-*.js`.
- `js/guias-documentos.js` y `js/guias-guion.js`: solo la clase del `<details>` para que tomen el
  estilo de los demás apartados (punto 8).
- `js/guias-mapa.js`: que pulsar una caja abra ese paso (punto 6), si hoy solo lo desplaza.
- `css/guias.css`: la línea resumida, las marcas y la caja gris común.
- Una prueba nueva `pruebas/guia-en-acordeon.mjs`: entrar (todo cerrado), abrir uno, abrir otro (el
  primero se cierra), añadir un paso (sale abierto y con el cursor en el título), mover con flechas
  (sigue abierto), paso dentro de una opción (el paso-pregunta sigue abierto).
- `js/version.js`, `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md` (o su hijo de
  `docs/contexto/`), `docs/HISTORIA.md`.

## Cómo trabajar

- **No leas el repositorio entero.** Solo los ficheros de arriba y lo que ellos llamen.
- **Cambios quirúrgicos**, no reescribir ficheros enteros (salvo el partido de `js/guias.js`).
- **Sube directamente a `main`, sin pull request** (o, si la sesión lo tiene forzado, pull request y
  fusión automática según la nota de `docs/COLA.md`).
- **Una sola prueba al final**: `npm test`.
- No cambia nada de lo que se guarda: la guía se guarda igual que hoy. Es solo cómo se ve al editarla.
