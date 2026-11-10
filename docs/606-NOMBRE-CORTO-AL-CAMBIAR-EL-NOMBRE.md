# 606 — Nombre corto al cambiar el nombre del tipo

## Lo que escribió Diego (aviso de usuario, idea 485)

Aviso de usuario (propuesta de mejora)
App: Gestor de Asuntos · Pantalla: Ficha de un asunto · Contexto: copia sin internet · perfil Administración
Quién lo envía: Diego Herrera · Fecha: 2026-10-29 09:43 · Versión de la app: 28-oct-2026 · 16:31

Texto:
Cuando cambio el nombre de un asunto, el sistema debe proponer el cambio también para el nombre corto

## Lo que entendió Claude (acordado con Francisco el 10-nov-2026)

- Un asunto no tiene nombre corto; lo tiene su **tipo** (Ajustes → tipo de asunto). El aviso se
  refiere a cambiar el nombre de un tipo de asunto.
- En el cuadro «Cambiar el nombre del tipo», si el tipo tiene nombre corto, debajo de «Nombre
  nuevo» sale la casilla «Nombre corto», rellena con el nombre corto de hoy, para cambiarlo o
  vaciarlo. Vacía quiere decir que se usa el nombre largo, igual que en Ajustes.
- La casilla tiene las mismas comprobaciones que el campo «Nombre corto» de Ajustes: en
  mayúsculas, como mucho 25 caracteres con su contador, y sin repetir el de otro tipo.
- Si el tipo no tiene nombre corto, el cuadro queda como hoy (no se ofrece ponerle uno ahí).
- Al pulsar «Cambiar», las carpetas de los asuntos abiertos de ese tipo pasan a llevar el nombre
  que le toque al tipo en las carpetas: el nombre corto nuevo, o el nombre largo nuevo si el corto
  queda vacío o el tipo no tenía.
- Se arregla un fallo de hoy: si el tipo tiene nombre corto, al cambiarle el nombre las carpetas
  abiertas se recortan mal (la app quita de la carpeta tantas letras como tiene el nombre largo
  viejo, aunque la carpeta lleva el corto). Tras el arreglo, solo cambia el trozo del tipo y el
  resto del nombre de la carpeta queda igual.
- Las carpetas del archivo no se tocan, como hoy.

## Pantalla de prueba

- Sin pantalla: solo añade una casilla a un cuadro que ya existe (decidido por Francisco).

## Qué NO se hace en esta tarea

- Ofrecer ponerle nombre corto a un tipo que no lo tiene desde este cuadro: se sigue haciendo en
  Ajustes → tipo de asunto.
- Nada en los tipos de documento.

## Notas técnicas de Claude

- El cuadro está en `App.renombrarTipo` (`js/tipos-nombre.js`). El campo de Ajustes con sus
  comprobaciones está en `js/ajustes-tipo.js` (alrededor de la línea 108); conviene sacar esas
  comprobaciones a una función común y usarla en los dos sitios, sin cambiar lo que hace Ajustes.
- El fallo: el bucle de `afectadas` hace
  `a.nombre.slice(0, desde) + nombreNuevo + a.nombre.slice(desde + nombreViejo.length)`, pero
  `Nombres.leer` reconoce el tipo también por su nombre corto, y la carpeta lleva
  `Nombres.tipoParaCarpeta(tipo)` (el corto si lo hay). El trozo que se quita tiene que ser el que
  lleva de verdad la carpeta (el corto viejo o el largo viejo), y el que se pone, el nombre para
  carpeta del tipo ya cambiado. Comprobar que la carpeta empieza por ese trozo en esa posición; si
  no, va a `fallos` sin tocarla.
- El nombre corto se guarda en `tipos.json` (`tipo.nombreCorto`) en el mismo `App.guardarTipos()`
  que el nombre. `TiposNombre.mover` y los alias, como hoy; el nombre corto viejo también pasa a
  `alias` si deja de usarse, para que el buscador siga reconociendo las carpetas viejas.
- Si el nombre largo no cambia pero el corto sí, el cuadro también guarda y renombra las
  carpetas abiertas.
- Prueba nueva en `pruebas/` con la demo: un tipo con nombre corto y un asunto abierto; se cambian
  nombre y corto, y la carpeta queda bien; y otro caso vaciando el corto.

## Cómo lo comprueba el segundo revisor

- En Ajustes → un tipo **con** nombre corto → «Cambiar el nombre»: sale la casilla «Nombre corto»
  con el corto de hoy.
- En un tipo **sin** nombre corto, el cuadro no la enseña.
- Más de 25 caracteres o el corto de otro tipo: no deja guardar y lo avisa, como en Ajustes.
- Cambiando nombre y corto: la carpeta de un asunto abierto de ese tipo lleva el corto nuevo y el
  resto de su nombre (número, tercero…) igual que antes.
- Vaciando el corto: la carpeta lleva el nombre largo nuevo, con el resto igual.
- En Ajustes → el tipo, el campo «Nombre corto» enseña lo guardado.

## Qué mirar al terminar

- Cambia el nombre de un tipo que tenga nombre corto y mira que sale su casilla.
- Mira el nombre de la carpeta de un asunto abierto de ese tipo: solo cambia el trozo del tipo.

## Revisión y respuestas durante el trabajo

- Segundo revisor (10-nov-2026, otro ayudante, con su propio script contra la app local y datos inventados):
  - Casilla con el corto de hoy en un tipo con corto: coincide.
  - Tipo sin corto, sin casilla: coincide (visto en código y en la prueba de la fila, no en su script).
  - Corto de otro tipo: coincide (aviso en vivo, el cuadro vuelve con el motivo, no se guarda). Más de 25: coincide, visto en código y en la prueba de la fila.
  - Nombre y corto cambiados: coincide, el resto de la carpeta queda igual (también con número A26-xxxx, por la prueba de la fila).
  - Corto vaciado: coincide, la carpeta lleva el largo nuevo; el corto viejo queda como alias.
  - Ajustes enseña lo guardado: no lo he podido ver del todo (no abrió la pantalla de Ajustes; comprobó en datos que `nombreCorto` queda guardado o quitado). Las comprobaciones comunes sustituyen a las de Ajustes con la misma lógica.
  - Casos límite bien: carpeta con alias, carpeta con el largo viejo en un tipo con corto, solo el largo, solo el corto, nada cambia. Sin riesgo de perder carpetas ni fichas; sin errores de consola.
  - Corregido tras el informe: un corto igual al largo nuevo ya no se guarda (queda vacío).
  - Anotado, sin cambiar: el motivo sale dos veces en el cuadro reabierto (cosmético); con el nombre nuevo vacío el cuadro se cierra sin guardar (como ya hacía); si el largo nuevo coincide con otro tipo salta «Unir» y el corto escrito no se aplica (norma anterior de unir).
- Prueba `nombre-corto-al-cambiar-el-nombre.mjs`: pasa. Tanda de lo tocado (tipo, nombre, renombr, ajustes, carpetas-perdidas, borrados, avisar): 32 de 33 bien; falla `tipos-unir.mjs` por el entorno (falta el paquete jsdom en esta sesión), no por la app.
