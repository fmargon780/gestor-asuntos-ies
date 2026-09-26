# La papelera se vacía sola a los 90 días, con aviso y constancia (fila 186)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Cierra la pregunta que arrastraba
`docs/COLA.md` desde el informe del 18-sep-2026 («la papelera, ¿se vacía sola?»). **Va después de
la fila 185.**

Idea de fondo: con datos de menores, un borrado que nunca ocurre no es lo ideal. Hoy la papelera
avisa a los 30 días y no borra nada sin que alguien pulse. Pasa a vaciarse sola a los **90 días**,
avisando **7 días antes**, y dejando constancia de cada borrado.

## Ficheros que se tocan

- `js/papelera.js` (288 líneas), `js/papelera-ajustes.js` (407: partir antes),
  `js/papelera-devolver.js` (`borrarDelTodo`)
- `js/avisos-que-faltan.js` (el aviso de papelera vieja) y `js/avisos-linea.js` (fila 181)
- `js/ajustes-centro.js` (los días, configurables)
- `docs/contexto/ASUNTOS-ARCHIVO.md`, `docs/CONTEXTO.md` (tabla de `_GESTOR`)
- Una prueba nueva en `pruebas/` (sin navegador, fechas relativas a hoy)

No leas el repositorio entero. Cambios quirúrgicos.

## Qué hay que hacer

### 1. Los plazos

- En El centro › «Días de aviso» (fila 184): **«La papelera se vacía a los N días»** (90 de partida)
  y **«Avisar M días antes»** (7). Se guardan en `frescura.json` o donde vivan los demás días, con
  relectura antes de escribir.
- Lo de la papelera lleva su fecha de entrada (`papelera.json`, `cuando`): el día del borrado es
  entrada + N.

### 2. El aviso, 7 días antes

En la línea de avisos de Inicio (fila 181), un trozo: **«12 cosas se borrarán del todo el 3-oct ·
Ver»**. «Ver» abre Herramientas › Papelera filtrada a esas (con la fecha de borrado en cada fila,
en rojo cuando falten menos de 7 días). Desde ahí, «Devolver» las rescata como hoy. El aviso de
«más de 30 días» que existe hoy desaparece: lo sustituye este.

### 3. El vaciado

- Al entrar en la app y una vez al día mientras esté abierta (con el vistazo de fondo, y solo si no
  hay guardado en marcha), se buscan las entradas de `papelera.json` con fecha de borrado pasada y
  se borran del todo con el mismo `borrarDelTodo` de hoy, de una en una, en la cola de
  `papelera.json`.
- **Dos ordenadores no se pisan**: antes de borrar cada entrada se relee `papelera.json`; si la
  entrada ya no está (el otro la borró o la devolvió), se salta.
- Si un borrado falla (fichero cogido por Dropbox), se deja para el día siguiente; aviso ámbar solo
  si lleva tres días fallando.

### 4. La constancia

- Cada borrado, automático o a mano, se apunta en **`_GESTOR/papelera-borrados.json`** (lista;
  releída antes de escribir; en la cola): `{ nombre, queEra, deDonde, entroEl, borradoEl, como:
  'automatico' | 'a mano', quien }` (`quien` = «la aplicación» si es automático). Sin el contenido:
  solo el rastro.
- En Herramientas › Papelera, un desplegable plegado al final: **«Borrados del todo (N)»**, con
  buscador como el de la papelera, y un botón «Vaciar el registro de antes de <hace 2 años>».
- Este fichero entra en los ficheros con copia de seguridad (`Copias.FICHEROS`), para que el rastro
  no se pierda.

### 5. Lo que ya existía y se queda

«Borrar del todo» a mano sigue, con su confirmación, y ahora deja constancia (punto 4). «Devolver»
sigue igual. El plazo de conservación por tipo (`js/conservacion.js`) no cambia: sigue avisando y no
borrando; lo que él manda a la papelera entra en este circuito como todo lo demás.

## Lo que no se hace

- No se borra nada de la carpeta de asuntos abiertos ni del ARCHIVO que no haya pasado antes por la
  papelera.
- No se acorta el plazo de la papelera de Dropbox (30 días más, por su cuenta): se menciona en el
  texto del aviso, como hoy.

## Prueba

Prueba sin navegador con el disco de mentira: una entrada de hace 91 días se borra al entrar y queda
en `papelera-borrados.json` como automática; una de hace 85 sale en el aviso con su fecha; una
devuelta a tiempo no se borra; si otro ordenador la borró antes, no falla. `npm test` entero al
final.

## Al terminar

`docs/contexto/ASUNTOS-ARCHIVO.md` (papelera: plazos, aviso, vaciado, constancia), `docs/CONTEXTO.md`
(tabla de `_GESTOR`: `papelera-borrados.json`; `Copias.FICHEROS` pasa a diecinueve),
`docs/CONTEXTO-CORTO.md` sección 5 (la línea de la papelera) y sección 8 (quitar «Decisión: ¿la
papelera se vacía sola?»). Quitar el punto correspondiente de «Lo que queda por hablar con
Francisco» en `docs/COLA.md`. Entrada en `docs/HISTORIA.md`. Sube directamente a `main`, sin pull
request, en como mucho dos subidas.
