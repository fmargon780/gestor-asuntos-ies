# Fila 62 — Renombrar un asunto sin perder sus hitos

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, parte 2.3, fallo **GRAVE 2**.

---

## 1. Qué pasa hoy

El nombre de la carpeta de un asunto es la clave con la que se guardan sus cosas. Pero no se usa en
un solo fichero, sino en tres:

| Fichero | Qué guarda con esa clave |
|---|---|
| `_GESTOR/asuntos.json` | la ficha del asunto |
| `_GESTOR/hitos.json` | los hitos de ese asunto (`porAsunto[clave]`) |
| `_GESTOR/presencia.json` | quién está dentro de ese asunto ahora mismo |

**Cuando el nombre cambia, solo se mueve la ficha.** Los hitos y la presencia se quedan apuntados
al nombre viejo.

Y el daño es silencioso. `crearSiToca`, en `js/hitos-panel.js`, ve que el asunto no tiene hitos y
**los vuelve a crear desde la guía del tipo**, importando solo `pasosHechos` y `pasosElegidos`, que
sí viajan dentro de la ficha. Así que en pantalla aparecen hitos que parecen correctos.

Lo que se pierde, sin que nadie lo diga:

- la fecha límite de cada paso,
- el responsable de cada paso,
- las notas del historial de cada hito,
- los documentos apuntados a cada hito,
- lo marcado en "lo que hay que reunir", con los valores escritos (fila 59),
- la constancia de las comunicaciones enviadas desde un hito (fila 60).

Y la entrada vieja se queda en `hitos.json` para siempre, sin que nadie la vea ni la limpie.

## 2. Los cuatro caminos que lo provocan

Están todos localizados:

1. **`js/asuntos-editar.js`, `App.editarAsunto`** — Editar un asunto. Renombra la carpeta y mueve la
   ficha de clave. Es el camino más frecuente: corregir una errata en un apellido, arreglar una
   fecha mal puesta, cambiar el tipo.
2. **`js/asuntos-editar.js`, `App.renombrarAsuntosDelTercero`** — cuando a un aspirante a plaza se le
   escribe su número de identificación escolar, la aplicación renombra **sola** todas las carpetas
   de sus asuntos abiertos. Aquí se pueden perder los hitos de varios asuntos de una vez, sin que
   nadie haya tocado nada.
3. **`js/unir-asuntos.js`, `fusionarFicha`** — unir dos asuntos. Funde las dos fichas y borra la que
   se va. Los hitos del asunto que desaparece se quedan huérfanos, y los del que se queda no
   heredan nada.
4. **`js/fichas-huerfanas.js`, `enlazar`** — enlazar una ficha huérfana con otra carpeta. Mueve la
   ficha a la clave nueva. Los hitos, no.

Y un quinto, distinto: **`js/papelera.js`, `mandarAsunto`** — al borrar, los hitos se quedan en
`hitos.json` para siempre, y al devolver el asunto desde la papelera no vuelven.

## 3. Qué hay que hacer

### 3.1 Un solo sitio

Escribir **una función y solo una** que diga "este asunto pasa a llamarse así". Fichero nuevo,
`js/asunto-renombrar.js`, cargado después de `js/hitos.js` y de `js/presencia.js` en
`index.html`. Algo como `AsuntoRenombrar.mover(claveVieja, claveNueva, datosExtra)`:

- vuelve a leer el registro y mueve la ficha (con los datos extra que traiga quien llame),
- vuelve a leer `hitos.json` y mueve `porAsunto[claveVieja]` a `porAsunto[claveNueva]`,
- si en el destino ya había una entrada de hitos, **no la pisa**: se queda con la del destino y deja
  una nota en el asunto diciendo que había hitos en los dos sitios (caso raro, pero posible al
  unir),
- mueve también la señal de `presencia.json` si la hubiera,
- guarda los tres, cada uno con su camino de siempre (`Copias.guardar` para los dos primeros,
  directo para presencia).

Y una hermana, `AsuntoRenombrar.quitar(clave)`, para el borrado: se lleva la ficha, los hitos y la
presencia a la vez, y **devuelve los hitos** para que `js/papelera.js` los guarde dentro de la ficha
de la papelera y pueda devolverlos al restaurar.

### 3.2 Que los cuatro caminos pasen por ahí

Cambiar los cuatro (más el de la papelera) para que llamen a la función nueva en vez de mover la
ficha a mano. Ninguno debe seguir tocando `App.E.registro.asuntos` por su cuenta para esto.

En el caso de **unir dos asuntos** hace falta además decidir qué pasa con los hitos de los dos:
quedarse con los del asunto que sobrevive, y **añadir al final** los del que se va que no estén ya
(por su identificador), igual que hace `unirPorId` en `js/conflictos.js`. Ese código ya existe y se
puede reutilizar; no escribir otro.

### 3.3 Limpiar lo que ya está roto

Puede que en el `hitos.json` del centro ya haya entradas huérfanas de renombrados anteriores.
Añadir en **Ajustes → Mantenimiento**, junto al bloque de fichas huérfanas que ya existe, una línea
que las cuente y un botón para borrarlas. Que enseñe antes cuántas son y de qué asuntos, y que no
borre nada sin confirmar.

## 4. Cómo se comprueba

Prueba nueva, `pruebas/renombrar-asunto.mjs`, sin navegador, con el disco de mentira:

1. Asunto con hitos que tengan de todo: fecha límite, responsable, una nota de historial, un
   documento apuntado y un requisito marcado con su valor.
2. Se renombra el asunto.
3. **Se comprueba que los hitos siguen enteros bajo la clave nueva**, con las seis cosas. Hoy esta
   comprobación falla.
4. Se comprueba que no queda nada bajo la clave vieja.
5. Lo mismo para los otros tres caminos: renombrado en cadena de un aspirante, unir dos asuntos
   (con hitos en los dos), y enlazar una ficha huérfana.
6. Borrar y devolver desde la papelera, comprobando que los hitos vuelven.

**Esta prueba es la mitad del valor de la fila**: hoy no hay ninguna que edite el nombre de un
asunto ni que una dos, y por eso el fallo lleva ahí desde que existen los hitos.

## 5. Qué NO hay que hacer

- **No** cambiar la forma de guardar los hitos ni la clave que usan. Sería otra fila mucho más
  grande, y con esto basta.
- **No** tocar `crearSiToca` de `js/hitos-panel.js`: recrear los hitos cuando de verdad no los hay
  está bien y hay que dejarlo.
- **No** intentar adivinar a qué asunto pertenecía una entrada huérfana vieja. Se cuenta, se enseña
  y se ofrece borrarla; nada más.

## 6. Cuánto es

Un día, contando las pruebas.
