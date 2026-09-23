# El estado del asunto sale del hito abierto

Fila 104 de `docs/COLA.md`. Diseño cerrado con Francisco el 23-sep-2026.

Lee antes `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md` y `docs/contexto/HITOS-Y-GUIAS.md`. Si
tocas la lista de asuntos abiertos, lee también el hijo de `docs/contexto/` que la describe.
**No leas el repositorio entero**: solo los ficheros de la lista de abajo y lo que ellos llamen.

## Reglas de esta instrucción

- Sube directamente a `main`, **sin abrir ninguna pull request** (si la sesión lo tiene forzado,
  vale la nota "Sube directamente a main" de `docs/COLA.md`: fusiónala tú en cuanto esté en verde).
- Cambios quirúrgicos. No reescribas ficheros enteros.
- Si un fichero que tienes que tocar pasa de unas 400 líneas, pártelo en dos.
- Una sola prueba al final, no una comprobación después de cada cambio.
- No le preguntes nada a Francisco. Decide, apunta la decisión en la documentación y sigue.
- Como máximo dos subidas (regla 13 de la cola).

## El problema

En Administración tienen que ver de un vistazo dos cosas: qué asuntos tienen que mover ellos, y
qué asuntos están esperando a otra persona. Hoy eso depende del estado manual del asunto, que hay
que ir cambiando a mano. Desde que el hito es la mesa de trabajo (filas 102 y 103), el hito
abierto ya dice a quién le toca. El estado tiene que salir de ahí, solo.

## Lo que hay que hacer

### 1. Cada responsable se clasifica: Administración o terceros

- En **Ajustes › Hitos**, en la lista de responsables, cada uno lleva una marca
  **Administración** (sí/no). Un clic, guardado en `hitos.json → ajustes.responsables`, releyendo
  antes de escribir, por la cola de guardado de siempre.
- De partida, son de Administración `yo` y `companero` (los mismos que hoy usa "En tu tejado" de
  "Qué me toca") y cualquier responsable que ya esté configurado como Administración para
  `HitosBiblioteca.naceSoloInformativo`. **Mira cómo se decide eso hoy y usa ese mismo dato**: no
  puede haber dos sitios que digan quién es Administración.
- Los papeles fijos (`tercero`, `tutor`, `relacionado`) son siempre terceros, sin marca.
- Un hito sin responsable cuenta como Administración: alguien de la casa tiene que decidir.

### 2. El asunto se coloca solo según su primer hito sin terminar

- Función pura nueva en `js/hitos.js`, `Hitos.aQuienLeToca(hitos)`. Devuelve
  `{ lado: 'administracion' | 'terceros' | null, quien: <nombre visible>, hito: <id> }`.
- Criterio: el primer hito de `Hitos.visibles` que no esté `hecho` ni `noaplica`, saltando los
  `soloInformativo`. Un hito de clase `decision` sin responder es Administración.
- Si hubiera más de uno abierto a la vez y alguno es de Administración, gana Administración.
- Sin ningún hito abierto (todos hechos) → Administración: toca archivarlo.
- Sin hitos → `null`: el asunto se coloca por su estado manual (punto 4).
- `Hitos.estadoDelAsunto` sigue siendo la única que decide el estado escrito del asunto; si hace
  falta, que llame a esta. No dupliques el criterio.

### 3. Dos bloques en Asuntos abiertos

- La lista de asuntos abiertos se parte en dos bloques, en este orden:
  **Pendiente de Administración** y **Pendiente de terceros**. Cada uno con su cuenta.
- En **Pendiente de terceros**, cada tarjeta dice quién lo tiene, en pequeño: «Dirección»,
  «Familia», «Jefatura»… (el nombre resuelto por `Hitos.resolverResponsable`; los papeles fijos,
  con su nombre de siempre: tercero, tutor legal, relacionado).
- Los filtros y el buscador de siempre siguen funcionando igual, dentro de los dos bloques.
- La tarjeta no gana botones: se queda con lo justo (`BOTONES_DE_LA_TARJETA`).
- Para no leer `hitos.json` en cada repintado: léelo una vez al pintar la lista, igual que hace
  "Qué me toca", y vuelve a leerlo por `window.Gestor.alRefrescar`.
- Al marcar un hito hecho, el asunto cambia de bloque solo, sin que Francisco toque nada.

### 4. Asuntos sin hitos

- Siguen con su estado manual, como ahora.
- Para saber en qué bloque van, cada estado de `estados.json` lleva la misma marca
  **Administración** (sí/no), en Ajustes, en la rejilla de estados. De partida: los estados cuyo
  nombre contenga «espera» o «tercero» son de terceros; el resto, de Administración.
- Un asunto sin hitos y sin estado va a **Pendiente de Administración**.

### 5. Lo que no entra

- El aviso de devolver el asunto a Administración cuando vence el plazo de un hito de terceros.
  Queda para más adelante, cuando se vea el uso.
- No se renombra ninguna carpeta: el estado nunca va en el nombre.
- "Qué me toca" no cambia de nombres ni de bloques. Solo, si ya decide "En tu tejado" con
  `yo`/`companero` a pelo, que pase a usar la marca Administración del punto 1.

## Ficheros

A tocar, con pocas líneas cada uno:

- `js/hitos.js` — `Hitos.aQuienLeToca`.
- `js/hitos-ajustes.js` — la marca Administración de cada responsable.
- `js/hitos-biblioteca.js` (o donde viva `naceSoloInformativo`) — leer la marca del punto 1.
- `js/asuntos-lista.js` — los dos bloques y el «quién lo tiene».
- El fichero de Ajustes que pinta la rejilla de estados — la marca Administración de cada estado.
- `js/que-me-toca.js` — solo si decide "En tu tejado" a pelo.
- El CSS de la lista de asuntos — los dos bloques.

Nuevos:

- `pruebas/estado-por-el-hito.mjs` — sin navegador, sobre `Hitos.aQuienLeToca`: hito de
  Administración, de terceros, `decision` sin responder, `soloInformativo` saltado, todos hechos,
  sin hitos. Y un caso de estado manual con la marca de terceros.

Antes de colgar algo de `App` o de `Hitos`, comprueba que el nombre no está cogido.

## Al terminar

- `docs/CONTEXTO-CORTO.md`, sección 5: sustituir «Estado del asunto, vía de comunicación
  preferente y fecha límite.» por una línea que diga que el asunto se coloca solo en «Pendiente de
  Administración» o «Pendiente de terceros» según su hito abierto.
- `docs/contexto/HITOS-Y-GUIAS.md`: apartado nuevo con esto, y sustituir el punto «Estado del
  asunto» de la sección de los hitos.
- `docs/COLA.md`: fila 104 HECHA, y quitar de "Lo que queda por hablar" la línea que ya
  resuelve esta fila.
- `docs/HISTORIA.md`: una entrada corta.
- Mensaje a Francisco: dos frases. Qué va a ver en Asuntos abiertos, y dónde se marca en Ajustes
  quién es de Administración.
