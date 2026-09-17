# No pisarse cuando los dos entran en el mismo asunto

Acordado con Francisco el 17-sep-2026. Fila 24 de `docs/COLA.md`.

## El problema

La aplicación la usan dos personas: Francisco y su compañero administrativo. Los asuntos son
comunes. Hoy nada avisa de que el otro está tocando el mismo asunto en ese momento, y los dos
pueden escribir encima del trabajo del otro.

## La decisión ya tomada

- **Todo por Dropbox, sin nada en internet.** Se habló de montar una base de datos pequeña en la
  nube para que el aviso fuera instantáneo, y **se descartó** por ahora: no compensa la
  configuración ni la dependencia de la conexión. Queda escrito por si algún día se replantea; si
  se hace, iría solo el identificador del asunto y el nombre de quien lo abre, nunca el nombre de
  la carpeta ni dato alguno de alumnado o personal, y con servidor en la Unión Europea.
- **Entrar siempre se puede.** Nunca se deja a nadie fuera de un asunto. Lo que cambia es que se
  entra **en modo consulta**: se ve todo, pero no se toca nada.
- **Y siempre hay salida**: un botón para tomar el mando aunque el otro figure dentro.

## Qué hay que hacer

### 1. La señal de presencia

- Fichero compartido nuevo: `_GESTOR/presencia.json`. Es el decimotercero (o el decimocuarto si
  antes se ha hecho la fila 21, que crea `grupos.json`): cuenta los que haya y ajusta la cifra en
  `docs/CONTEXTO-CORTO.md` y en `docs/CONTEXTO.md`.
- Contenido: para cada asunto abierto por alguien, quién lo tiene (`Gestor.usuario()`, el mismo
  nombre que ya usan la papelera y el tablón) y la hora de la última señal.
- Se escribe al abrir la ficha de un asunto. Se renueva cada **30 segundos** mientras la ficha
  siga abierta. Se borra al cerrar la ficha, al salir de la aplicación y al cerrar la pestaña.
- **Caduca a los 3 minutos** sin renovarse. Una señal caducada se ignora y se limpia: es lo que
  salva el caso de que a alguien se le cierre el navegador de golpe.
- El fichero es diminuto y se escribe muy a menudo: **no puede entrar en las copias de seguridad
  diarias, ni en la papelera, ni en la fusión de conflictos de Dropbox como los demás**. Si dos
  versiones chocan, se quedan las dos entradas (una por persona) y punto; nunca se pide nada al
  usuario por este fichero.
- La aplicación relee `presencia.json` cada **10 segundos** mientras haya una ficha abierta. El
  desfase real será el que tarde Dropbox en pasar el fichero, que con un fichero así son segundos.

### 2. Lo que se ve en pantalla

Al abrir un asunto que ya tiene otro dentro:

- Línea de aviso arriba de la ficha, bien visible pero sin cuadro de diálogo:
  **"Juan está en este asunto ahora mismo. Estás mirando, no puedes modificar."**
- Todos los botones y campos que modifican el asunto salen **apagados** (cambiar estado, fecha
  límite, vía, editar, hitos, notas, archivar, generar documento, correo…). Lo que solo lee
  (abrir un documento, ver el historial, copiar un nombre) sigue funcionando.
- Botón a la derecha del aviso: **"Tomar el mando"**. Pide confirmación en una línea
  ("¿Seguro? Juan podría estar escribiendo ahora mismo") y, si se acepta, la ficha pasa a modo
  normal y la señal cambia de dueño.
- Si mientras estás dentro el otro sale, el aviso desaparece solo y los botones se encienden, sin
  salir y volver a entrar. (La fila 23 arregla justo esto para el resto de la ficha; sigue su
  misma regla de repintar.)
- En la lista de "Asuntos abiertos", el asunto que tiene a alguien dentro lleva una marca pequeña
  con la inicial o el nombre, para verlo antes de entrar.

### 3. Dónde tocar

- Módulo nuevo `js/presencia.js`, colgado de `window.Presencia`. No metas esto dentro de
  `js/ficha-asunto.js`, que ya es grande.
- `js/ficha-asunto.js` — abrir y cerrar la ficha, el aviso, apagar y encender los botones.
- `js/asuntos-lista.js` — la marca en la tarjeta.
- `js/datos.js` y `js/almacen.js` — leer y escribir el fichero compartido.
- `js/copias.js`, `js/papelera.js` y `js/conflictos.js` — dejar `presencia.json` fuera.
- `index.html` — el `<script>` nuevo, en el orden que toque.

Si algún fichero de esos pasa de unas 400 líneas y hay que tocarlo a fondo, pártelo en dos.

### 4. Cómo lo compruebas tú

- Pruebas nuevas en `pruebas/presencia.mjs`: señal que caduca, dos personas a la vez, tomar el
  mando, y que el fichero no entra en copias ni en papelera.
- Batería completa (`npm test`) en verde antes de subir.
- Comprueba lo publicado con `curl`.

## Reglas de esta instrucción

- Cambios quirúrgicos; no reescribas ficheros enteros.
- No leas el repositorio entero: `docs/CONTEXTO.md` y los ficheros de la lista.
- **Sube directamente a `main`, sin pull request** (si la sesión es de la nube y no puede, vale el
  pull request con el permiso de fusión de la nota final de la cola).
- Una sola tanda de pruebas al final.
- No toca `apps-script/gestor-correos.gs`.
- Al terminar: `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` sustituyendo la línea vieja, y la
  anotación en `docs/HISTORIA.md`.
