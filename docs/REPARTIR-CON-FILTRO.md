# Repartir entre terceros con un filtro del alumnado

Fila 342 de `docs/COLA.md`. Aviso del botón de soporte de Francisco (13-oct-2026, perfil
Administración, copia sin internet, pantalla «Ficha de un asunto»), diseñado con él ese mismo día.
Aviso completo: https://drive.google.com/file/d/1foDt88TnlRjr0sXcCdcandOL_eALcamd/view?usp=drivesdk

## De dónde sale esto

Para repartir documentos entre alumnos (por ejemplo, los informes de un colegio), Francisco primero
relaciona con el asunto un colectivo entero con «Añadir varios relacionados» → «Por datos del
alumnado» (por ejemplo, centro de procedencia = CEIP Jorge Guillén). Eso relaciona a todos los que
cumplen la condición, y después es muy difícil que los documentos y esos nombres cuadren en número y
en orden.

Lo que pide: filtrar el alumnado **dentro del propio cuadro de reparto**, con varios criterios a la
vez, y elegir de esa lista el alumno de cada documento o trozo. El alumno elegido desaparece de la
lista. Así se ve enseguida si sobra o falta alguien.

## Lo que se pide

Vale para los dos cuadros de reparto: el de un PDF en trozos (`js/repartir-pantalla.js`, fila 141)
y el de varios ficheros sueltos (`js/repartir-ficheros.js`, fila 337).

### 1. El filtro

- Arriba del cuadro, una zona plegable «Filtrar el alumnado» con los mismos criterios que ya tiene
  «Por datos del alumnado» (`js/alumnado-bd-ver.js`: `filtrar`, `valoresDe`, la pareja
  dato/valor y la casilla «Incluir antiguos») más los atajos de unidad, nivel y enseñanza del
  cuadro de relacionados (`js/relacionados.js`). Reutiliza ese código; no lo copies.
- Se pueden poner varios criterios. Cada uno sale como una pastilla con su ✕. Un alumno entra en la
  lista solo si cumple **todos** (como ya hace `filtrar`).
- Junto al filtro, «N alumnos en el filtro».
- **Sin filtro, el cuadro funciona exactamente como hoy** (relacionados del asunto, relleno por
  orden en el primer PDF, «Buscar a otra persona del alumnado…»).

### 2. Elegir de la lista

- Con filtro puesto, el desplegable de alumno de cada trozo o fichero ofrece solo los alumnos del
  filtro **que aún no tienen documento** en este reparto.
- Al asignar un alumno, desaparece de las listas de los demás trozos o ficheros. Si se le quita
  («Sin asignar» o se cambia por otro), vuelve a salir.
- Con filtro puesto **no se rellena nada por orden**: cada trozo o fichero lleva solo lo que la app
  lee (punto 3) o queda «Sin asignar».
- «Buscar a otra persona del alumnado…» sigue ahí, para elegir a alguien de fuera del filtro.
- Cambiar el filtro con documentos ya asignados no quita ninguna asignación. Los asignados que
  queden fuera del filtro nuevo se marcan en ámbar «Fuera del filtro».

### 3. La propuesta automática dentro del filtro

- La lectura del nombre del fichero o del contenido del trozo (`N.leerTrozo` y lo de la fila 337)
  solo asigna sola si el alumno leído está en el filtro y aún no tiene documento.
- Si lee a alguien de fuera del filtro, no lo asigna. Enseña en ámbar «Está fuera del filtro:
  <nombre>» con un botón «Asignarlo igualmente».
- Si lee a alguien que ya tiene documento en este reparto, tampoco lo asigna: ámbar «Ya tiene
  documento: <nombre>», con el mismo botón (permite corregir un error de lectura anterior: al
  asignarlo aquí se le quita del otro).

### 4. La línea de cuentas

- Abajo, en el pie fijo del cuadro, junto a los botones, una línea que se pone al día con cada
  cambio: «Documentos sin alumno: N · Alumnos del filtro sin documento: N».
- Cada número se pulsa y despliega quiénes son (los documentos, por su nombre o «Trozo N, págs.
  X–Y»; los alumnos, por su nombre). Pulsar un documento de esa lista lo lleva a la vista.
- La segunda cifra solo sale con filtro puesto.
- Avisa, **no impide** terminar.

### 5. Quién queda relacionado

- Al terminar el reparto, solo los alumnos que han recibido un documento quedan como relacionados
  del asunto de origen. Los del filtro sin documento no se relacionan.
- Si hoy el reparto ya añade a los que reciben su documento, se deja igual; si no lo hace, que lo
  haga solo con filtro puesto (sin filtro, nada cambia).

## Qué ficheros tocar

- Un módulo nuevo para el filtro compartido por los dos cuadros, por ejemplo
  `js/repartir-filtro.js` (`RepartirFiltro`): pinta la zona, guarda los criterios y dice qué
  alumnos entran. Usa `AlumnadoBDVer`/`AlumnadoBD` y las personas del RegAlum (`porId`).
- `js/repartir-pantalla.js` y `js/repartir-ficheros.js`: enganchar el filtro, las listas sin los
  ya asignados, la propuesta dentro del filtro y la línea de cuentas.
- `js/alumnado-bd-ver.js` y `js/relacionados.js`: solo para exponer lo que haga falta reutilizar,
  sin cambiar su comportamiento.
- `js/novedades.js`: una línea (cambia lo que se ve).
- Ningún fichero de `js/` pasa de 600 líneas. El pie fijo del cuadro sigue la regla de la fila 341
  (`docs/CUADROS-CON-BOTONES-A-LA-VISTA.md`) si ya está hecha.

## Reglas de trabajo

- Las de `CLAUDE.md`: rama `fila-342`, revisor en local, fusión en `main` y una sola publicación a
  propósito.
- Cambios quirúrgicos: no reescribir ficheros enteros.
- No leas el repositorio entero: `docs/CONTEXTO.md`, el hijo de `docs/contexto/` que hable del
  reparto, `docs/REPARTIR-VARIOS-FICHEROS.md`, `docs/REPARTIR-SEGUNDO-PDF.md` y los ficheros de
  esta lista.
- Pruebas: mientras trabajas, `node pruebas/ejecutar.mjs repartir`; la pasada completa, una vez al final.

## La prueba

`pruebas/repartir-con-filtro.mjs`, con navegador y el disco de mentira:

- Alumnado de demostración con al menos 8 alumnos de un mismo centro de procedencia, de dos niveles.
- Un asunto sin relacionados y un PDF con texto de 6 trozos: 4 con el nombre de alumnos del filtro,
  1 con el de un alumno de fuera del filtro y 1 sin nombre.
- Poner dos criterios (centro de procedencia y nivel): la cuenta de «alumnos en el filtro» es la de
  los que cumplen los dos.
- Los 4 trozos con alumno del filtro llevan su alumno; el de fuera sale en ámbar con «Asignarlo
  igualmente», sin asignar; el sin nombre, «Sin asignar». Nada se rellena por orden.
- Un alumno asignado no aparece en el desplegable de otro trozo; al quitarlo, vuelve a aparecer.
- La línea de cuentas dice los documentos sin alumno y los alumnos del filtro sin documento, y al
  pulsar cada cifra salen sus nombres.
- Terminar con un trozo sin alumno: deja terminar. Solo los que recibieron trozo quedan como
  relacionados.
- Lo mismo, en corto, con el cuadro de varios ficheros.
- Sin filtro, `repartir-entre-terceros.mjs`, `repartir-ficheros.mjs` y `repartir-segundo-pdf.mjs`
  siguen pasando sin cambios.

## Para Francisco al terminar

Lo que va a ver: en los cuadros de reparto hay un filtro del alumnado con varios criterios. El
alumno que se asigna desaparece de la lista, y abajo se ve cuántos documentos quedan sin alumno y
cuántos alumnos del filtro sin documento. No hay nada que tenga que hacer él.

## Cómo sabemos que está bien

1. En la demo, en el cuadro de reparto de un PDF en trozos, hay una zona «Filtrar el alumnado» y se
   pueden poner dos criterios a la vez; la cuenta de alumnos solo incluye a quien cumple los dos.
2. Con filtro puesto, ningún trozo se rellena por orden: los que no se leen quedan «Sin asignar».
3. Un alumno asignado a un trozo no aparece en el desplegable de los demás; al quitarlo, vuelve.
4. Un trozo que lleva el nombre de un alumno de fuera del filtro sale en ámbar «Está fuera del
   filtro» con «Asignarlo igualmente», y ese botón lo asigna.
5. La línea de abajo dice «Documentos sin alumno: N · Alumnos del filtro sin documento: N»; al
   pulsar cada cifra salen quiénes son; se puede terminar aunque no cuadre.
6. Al terminar, solo quedan relacionados con el asunto los alumnos que recibieron documento.
7. Lo mismo funciona en el cuadro de repartir varios ficheros.
8. Sin poner filtro, los dos cuadros funcionan como antes.
