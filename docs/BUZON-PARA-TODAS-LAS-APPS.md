# El buzón de soporte, para todas las apps (fila 261 de la cola)

Diseño cerrado con Francisco el 2-oct-2026, en Cowork (conversación del proyecto BD Alumnado).

## Qué se quiere

El buzón de soporte (`apps-script/soporte.gs`) se hizo pensando en todas las apps de Francisco,
pero hoy solo admite avisos del Gestor. Ya hay otra app con el botón (Ausencias y Guardias) y
otra en camino (BD Alumnado), y Francisco quiere el botón en todas.

Decisión de Francisco: el botón se pone app por app, cada una en su cola; **el buzón se abre a
todas de una sola vez**, para que él solo tenga que volver a pegar el script una vez.

Esta fila solo toca el buzón y sus documentos. No toca el botón del Gestor (`js/soporte.js`) ni
nada de lo que se ve en la aplicación.

## 1. La lista de repositorios permitidos

`REPOS_PERMITIDOS` pasa a ser esta lista (todos de `fmargon780/`):

- `gestor-asuntos-ies`
- `bd-alumnado-ies`
- `ausencias-guardias-ies`
- `normativa-escolarizacion`
- `migracion-dropbox-drive`
- `Disciplina-IES`
- `club-tolox-corre`
- `comparador-listas`
- `Partituras-de-Caja-Clara`
- `Cancionero-Parroquia`
- `Parroquia_Conteo_Colectas`
- `ERP-Nutricion`

Que un repositorio esté en la lista no hace nada por sí solo: hasta que esa app tenga su botón,
no manda avisos. Lo que venga de un repositorio que no esté en la lista se sigue rechazando.

## 2. La fila IDEA, en la forma de cada cola

Hoy el buzón escribe siempre una fila de tres columnas, la del Gestor. Las colas de las demás apps
tienen cuatro (`| Nº | Instrucción | Estado | Notas |`). El buzón tiene que mirar la cabecera de
la tabla de la cola que va a tocar:

- **Tres columnas** (Gestor): como ahora, sin cambiar nada:
  `| N | Aviso de usuario: error en «<pantalla>» | IDEA (fecha): enviada por un usuario desde el botón de soporte · aviso completo: <enlace> |`
- **Cuatro columnas**: el estado, solo, en su columna, y lo demás en Notas:
  `| N | Aviso de usuario: error en «<pantalla>» | IDEA (fecha) | Enviada por un usuario desde el botón de soporte · aviso completo: <enlace> |`
- **Sin tabla** (una cola con apartados `## N. Título — ESTADO`): un apartado nuevo al final,
  `## N. Aviso de usuario: error en «<pantalla>» — IDEA (fecha)`, y debajo una línea con
  «Enviada por un usuario desde el botón de soporte · aviso completo: <enlace>».

El número sigue siendo el siguiente al más alto de la cola (mirando filas y apartados). La fila
sigue sin llevar **nada** del texto del usuario ni de la captura, sea público o privado el
repositorio. Si la cola de una app no existe o no se entiende, no se inventa nada: el aviso queda
en Drive y pasa lo del punto 4.

## 3. Tolerar lo que ya mandan otras apps

Ausencias y Guardias manda hoy dos campos de otra forma, y el buzón los rechaza o los pierde. Se
arreglará también allí, pero el buzón tiene que aceptarlos:

- `captura` puede llegar con el principio `data:image/…;base64,`. Se quita ese principio antes de
  validar y de guardar. Si no es JPEG (PNG, por ejemplo), se guarda con su extensión y su tipo.
- `errores` puede llegar como una lista. Se junta en un solo texto, una línea por error.

## 4. Que un aviso que no llega a la cola no se quede callado

Hoy, si el aviso se guarda en Drive pero no se puede apuntar en la cola (falta el permiso de
GitHub para ese repositorio, la cola no existe, tres conflictos seguidos), el buzón contesta
`ok: true` con `colaApuntada: false` y nadie se entera: el aviso no sale en el Centro de mando.

Desde esta fila, en ese caso el buzón manda además **un correo al dueño del script** (la cuenta
que lo ejecuta), con: la app, el repositorio, el motivo (lo que respondió GitHub) y el enlace al
aviso en Drive. Como mucho **un correo por repositorio y día** (se apunta en las propiedades del
script cuándo se mandó el último). El correo no lleva el texto del usuario: solo el enlace.

La respuesta a la app no cambia (`ok: true`, `colaApuntada: false`): la persona que avisa no ve
un error que no puede arreglar.

Esto añade el permiso de enviar correo al script. Francisco lo autoriza al ejecutar
`prepararTodo` (punto 6).

## 5. `prepararTodo` comprueba todos los repositorios

Hoy solo lee la cola del primero de la lista. Tiene que recorrer la lista entera y escribir en el
registro una línea por repositorio, solo leyendo:

- «Bien: fmargon780/… (cola de N filas)».
- «OJO: fmargon780/… — el permiso de GitHub no llega a este repositorio» (401, 403, o 404 del
  repositorio).
- «Sin cola: fmargon780/… — el permiso llega, pero no tiene `docs/COLA.md`» (404 del fichero con
  el repositorio visible; si con el permiso que hay no se puede distinguir de lo anterior, una
  sola línea «OJO: no llego a la cola de …»).

Y al final un resumen en una línea: cuántos bien, cuántos con OJO. Además manda a Francisco un
correo de prueba con ese mismo resumen, que sirve para autorizar el permiso de correo.

## 6. Los pasos de Francisco

Pon al día `docs/PONER-EN-MARCHA-SOPORTE.md`:

- El paso 1 (permiso de GitHub) ya no habla de un solo repositorio: el permiso tiene que llegar,
  con escritura en *Contents*, a todos los de la lista del punto 1. (Francisco cree que ya lo
  tiene hecho; `prepararTodo` se lo confirma.)
- La sección «Cuando cambie el script» gana un paso: después de pegar el script y antes de
  «Nueva versión», ejecutar `prepararTodo`, autorizar el permiso nuevo (correo) y leer el
  registro. Los repositorios con «OJO» son los que le faltan al permiso de GitHub.

Añade a `docs/COMPROBAR-A-MANO.md` y a «Lo que queda por hablar con Francisco» de la cola una
línea: **volver a pegar `apps-script/soporte.gs`, ejecutar `prepararTodo`, e «Implementar» →
«Administrar implementaciones» → «Nueva versión»**. Si todavía tenía pendiente el pegado de la
fila 240, es el mismo pegado: uno solo vale para las dos.

Cambia `VERSION_SCRIPT`.

## 7. Pruebas

En `pruebas/soporte-script.mjs` (Drive, GitHub y correo falsos):

- Un aviso de cada repositorio de la lista se acepta; uno de otro repositorio se rechaza.
- Cola de tres columnas: la fila sale como hasta ahora, sin cambiar una coma.
- Cola de cuatro columnas: `IDEA (fecha)` solo en la tercera, y el enlace en la cuarta.
- Cola de apartados: apartado nuevo al final, con el número siguiente.
- En los tres casos la fila no lleva el texto del usuario.
- `captura` con el principio `data:image/jpeg;base64,` se guarda bien; `errores` en lista se
  guarda como texto.
- GitHub responde 403: la respuesta es `ok: true, colaApuntada: false`, sale un correo, y un
  segundo aviso del mismo repositorio el mismo día no manda otro.
- `prepararTodo` con un repositorio bien y otro con 403: una línea «Bien» y una «OJO», y no
  escribe en ninguna cola.

`npm test` completo en verde antes de publicar.

## 8. Fuera de esta fila

- El botón de cada app: va en la cola de cada app. BD Alumnado: fila 33 de su cola
  (`docs/BOTON-DE-SOPORTE.md` de `bd-alumnado-ies`). Ausencias y Guardias: fila 14 de la suya.
- Dónde se guardan los avisos de las apps que no son del instituto (parroquia, club, nutrición):
  hoy todo va a la carpeta `SOPORTE-AVISOS` de la cuenta que ejecuta el script. Se decide con
  Francisco cuando se diseñe el botón de la primera de esas apps, no aquí.

## Cómo sabemos que está bien

Esta fila no cambia nada que se vea en la aplicación; se comprueba con la prueba del script.

1. `node pruebas/soporte-script.mjs` termina en verde y su salida nombra, uno por uno, los casos
   del punto 7.
2. En esa salida, un aviso de `fmargon780/bd-alumnado-ies` y otro de
   `fmargon780/ausencias-guardias-ies` se aceptan, y uno de `fmargon780/otro-cualquiera` se
   rechaza con «Este repositorio no puede mandar avisos.»
3. En esa salida, la fila escrita en una cola de cuatro columnas tiene cuatro celdas, con
   `IDEA (fecha)` sola en la tercera.
4. En esa salida, con GitHub respondiendo 403 hay un correo y solo uno tras dos avisos seguidos.
5. Abrir la aplicación con datos de demostración: el botón «Soporte» sigue abajo a la derecha y
   su ventana se abre y se cierra como antes (no se ha tocado).
6. `docs/PONER-EN-MARCHA-SOPORTE.md` explica, en lenguaje llano, el paso de ejecutar
   `prepararTodo` y leer qué repositorios salen con «OJO».
7. **[SOLO FRANCISCO]** Pegar el script, ejecutar `prepararTodo` y leer el registro: todos los
   repositorios en «Bien» (o «Sin cola»), ninguno en «OJO». Llega el correo de prueba.
8. **[SOLO FRANCISCO]** Tras «Nueva versión», enviar un aviso desde Ausencias y Guardias: aparece
   una IDEA nueva de esa app en el Centro de mando.
