# Fila 163 — Aviso de asuntos parecidos mientras se crea uno

Cerrado con Francisco el 25-sep-2026, en conversación.

## Qué quiere Francisco

Evitar asuntos duplicados. Mientras rellena «Nuevo asunto», **antes de pulsar «Crear»**, la
aplicación le enseña lo que ese tercero ya tiene y que puede ser el mismo asunto.

## Lo que ya existe (no se tira)

`js/duplicados.js` ya tiene dos cosas:

1. **Un aviso ámbar** (`mirarSiYaExiste`, caja `#aviso-duplicado`, colgado de
   `App.refrescarVista`): solo sale con tercero **y** tipo elegidos, y solo enseña los asuntos
   del **mismo tipo** (abiertos y todos los archivados, sin mirar fechas).
2. **La parada al pulsar «Crear»** (mismo tercero, tipo y año académico). **Se queda tal cual.**

Esta fila **sustituye el aviso ámbar (1)** por el recuadro nuevo. La parada (2) no se toca.

## El recuadro nuevo

Mismo sitio que el aviso de hoy (`#aviso-duplicado`, encima de la vista previa), misma forma de
engancharse (no se añade ninguna envoltura nueva: la que ya hay sobre `App.refrescarVista`).

- **Sale en cuanto hay tercero elegido**, aunque todavía no haya tipo.
- **Contenido**, en este orden:
  1. **Abiertos del mismo tipo** que el elegido: en rojo (clase propia, por ejemplo
     `.parecido-mismo-tipo`), arriba. Título: «Ya tiene abierto un asunto de este tipo».
  2. **Archivados del mismo tipo** cuya fecha de apertura esté a **15 días o menos** (antes o
     después) de la fecha del asunto nuevo (`#campo-fecha`). La fecha del archivado sale de las
     seis primeras cifras de su nombre de carpeta (`AAMMDD`); si no se puede leer, no sale. Cada
     uno con la etiqueta «archivado». Título: «Archivado hace poco, del mismo tipo».
  3. **El resto de sus abiertos** (otros tipos): en gris. Título: «Otros asuntos abiertos de este
     tercero».
- Sin tipo elegido todavía: solo el bloque 3 con todos sus abiertos, en gris.
- **Si no hay nada que enseñar, el recuadro no sale.**
- Cada asunto es pulsable: un abierto abre su ficha (mismo camino que `irAlCandidatoAbierto`); un
  archivado abre su carpeta del ARCHIVO (mismo camino que usa hoy la parada al crear). Antes de
  salir de «Nuevo asunto», lo escrito no debe perderse: si el camino de hoy lo pierde, basta con
  que el enlace se abra sin salir (panel lateral o visor), lo que resulte más sencillo con lo que
  ya existe; no inventar pantallas nuevas.
- Como mucho 6 por bloque y «y N más» (el `comoLista` de hoy).
- **Reservados**: con candado y el rótulo tapado de `Reservados.nombreParaVer(a)` (o su
  equivalente para un nombre de carpeta del ARCHIVO), salvo que esté pulsado «Mostrar reservados».
- **Se pone al día solo** al cambiar tercero, tipo o fecha. La clave de `ultimaConsulta` pasa a
  incluir la fecha. Se mantiene la regla de hoy: lo que llega tarde de una consulta vieja se tira.
- Nota al pie, en gris y en una línea: «Es solo un aviso. Si es otra gestión, créalo sin más.»
- Todo dentro de `try/catch`, como hoy: **el recuadro nunca puede impedir crear un asunto**.

## Ficheros que se tocan

- `js/duplicados.js`: solo `mirarSiYaExiste` y sus ayudantes (`delTercero` ya da abiertos y
  archivados de ese tercero; hace falta una función pura para la fecha del nombre y la diferencia
  en días). El fichero tiene 358 líneas: si pasa de 400, sacar el recuadro a
  `js/duplicados-aviso.js` (cargado justo después, en `index.html`) sin envolver nada nuevo.
- `css/unir-asuntos.css` o el CSS donde viva hoy `#aviso-duplicado`: rojo y gris del recuadro.
- `pruebas/duplicados.mjs`: añadir casos (ver abajo).
- Documentación de cierre: `docs/contexto/ASUNTOS.md` (sección «Que no se dupliquen los asuntos»,
  sustituyendo lo que diga del aviso ámbar), `docs/CONTEXTO-CORTO.md` (la línea «Aviso de
  duplicado; pantalla "Duplicados"» pasa a decir «Al crear, recuadro con lo que ya tiene el
  tercero; parada si es idéntico; pantalla "Duplicados"»), `docs/COLA.md` y `docs/HISTORIA.md`.

## Cómo trabajar

- Subir directamente a `main`, sin abrir ninguna pull request (si la sesión lo impide, la nota
  del final de `docs/COLA.md`).
- Cambios quirúrgicos: no reescribir `js/duplicados.js` entero.
- No leer el repositorio entero: basta con `docs/CONTEXTO.md`, `docs/contexto/ASUNTOS.md`,
  `js/duplicados.js`, `js/reservados.js` y lo que estos señalen.
- **Una sola prueba al final**, `pruebas/duplicados.mjs`, con estos casos:
  1. Tercero sin asuntos: no sale nada.
  2. Tercero con abiertos de otro tipo y sin tipo elegido: bloque gris.
  3. Abierto del mismo tipo: rojo y arriba.
  4. Archivado del mismo tipo a 10 días: sale; a 20 días: no sale; de otro tipo a 3 días: no sale.
  5. Cambiar la fecha del formulario vuelve a calcular el bloque de archivados.
  6. Un reservado sale tapado.
  7. La parada al pulsar «Crear» sigue igual (los casos que ya tenía la prueba siguen en verde).
