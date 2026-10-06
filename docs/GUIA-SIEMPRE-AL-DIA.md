# La guía que se usa es siempre la guardada (fila 273)

Cerrado con Francisco el 6-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/11Mpx41dWgbknjUr1EkR46D8HBIJHpc0U/view?usp=drivesdk).

## Qué pasó

Francisco escribió, desde «Ajustes de un tipo de asunto»: «esta guía tiene 2 pasos, después de que
fuera modificada. Sin embargo, creamos un nuevo asunto con dicho tipo y vuelven a aparecer los 5
hitos que tenía antes».

Lo comprobado con él, en el centro:

- La guía se cambió y el asunto se creó en el mismo ordenador.
- Tras recargar la página, un asunto nuevo de ese tipo sale con 2 hitos. Así que `guias.json`
  estaba bien: tenía la guía de 2 hitos.

La causa, leída en el código (no reproducida todavía):

- Las guías se leen del disco **una sola vez**, al arrancar (`arrancar` en
  `js/guias-enganche.js`, que solo corre si `yaLeido` es falso). A partir de ahí viven en la
  variable `guias` de ese fichero, y `GuiasDelCentro.pasosDe` devuelve siempre esa copia.
- Esa copia solo se refresca cuando **esa misma ventana** abre el editor de una guía
  (`escribirGuia` llama a `cargar`), guarda una (`conFichero`) o cambia la guía desde un asunto.
- Una ventana abierta desde antes del cambio (otra pestaña del mismo ordenador, o el ordenador
  del compañero) conserva la guía vieja. Con ella:
  - **crea** los hitos de un asunto nuevo (`pasosOMinima` → `crearDesdeGuia`, `js/hitos.js`);
  - **añade** a un asunto ya creado los hitos que cree que le faltan, al abrir su ficha
    (`completarSiToca` en `js/hitos-panel.js` → `Hitos.completarAsuntoConGuia`,
    `js/hitos-sincronizar.js`), y los deja escritos en `hitos.json` para todos;
  - enseña la guía vieja en el resumen de «Nuevo asunto» y en Ajustes de ese tipo.

No se sabe cuál de las dos cosas pasó aquel día (crear con la guía vieja, o crear bien y añadir
después). El arreglo cubre las dos.

## Qué hay que hacer

### 1. Reproducirlo antes de arreglarlo

Escribe primero la prueba (apartado «Ficheros») y comprueba que **falla** con el código de hoy:
una sesión arrancada con una guía de 5 hitos, `guias.json` cambiado por fuera a 2 hitos (como
haría otra ventana), y un asunto nuevo de ese tipo. Hoy sale con 5. Si no falla, la causa es
otra: búscala antes de seguir y déjalo dicho en la nota de la fila.

### 2. Una función que pone las guías al día

En `js/guias-enganche.js`, una función nueva en `window.GuiasDelCentro` (por ejemplo
`ponerAlDia()`), asíncrona, que vuelve a leer `guias.json` y deja la copia en memoria igual que
el disco. Devuelve si ha cambiado algo. Con estas condiciones:

- **Barata.** La llaman sitios que se repiten (la ficha se repinta a menudo). No debe leer y
  analizar el fichero entero cada vez: mira antes si el fichero ha cambiado (fecha de
  modificación; `js/carpetas.js` ya lee `lastModified` en otro sitio) y, si no puede saberse,
  como mucho una lectura cada pocos segundos. Dos llamadas a la vez comparten la misma lectura.
- **Callada.** Si la lectura falla, se queda la copia que había y no sale ningún aviso (el aviso
  rojo de `cargar` es para cuando lo pide la usuaria).
- **Sin pisar un guardado.** Con un guardado de `guias.json` en marcha o en la cola
  (`ColaGuardado`), no lee: lo que quede en memoria tras ese guardado ya es lo del disco.
- **Sin tocar lo que se está escribiendo.** El editor de una guía trabaja sobre su propia copia;
  ponerse al día no lo cierra ni le cambia nada.
- En modo «solo consultar» también lee: no escribe nada.

### 3. Dónde se llama

Cuatro sitios, los cuatro acordados con Francisco:

1. **Antes de crear los hitos de un asunto.** `pasosOMinima` (`js/hitos.js`), que usan
   `crearDesdeGuia` y `crearDesdeGuiaImportando`: se pone al día y después lee los pasos.
2. **Antes de añadir hitos a un asunto que ya los tiene.** `crearSiToca` y `completarSiToca`
   (`js/hitos-panel.js`): se ponen al día antes de leer `pasosDe(tipo)`. Así el camino de «los
   hitos nuevos de la guía llegan a los abiertos» nunca añade un hito que la guía guardada ya no
   tiene.
3. **Al entrar en «Nuevo asunto».** `App.prepararNuevo` (`js/asuntos-nuevo.js`): se pone al día
   y, si algo ha cambiado, repinta el resumen de la guía (`pintarGuiaNuevo`). No debe retrasar
   que el formulario aparezca.
4. **Al abrir Ajustes de un tipo.** Donde se pone `App.E.tipoAjustesActual` (`js/ajustes-tipo.js`):
   se pone al día y, si algo ha cambiado, repinta la sección «Guía» y su resumen. Con eso, los
   pasos que captura el aviso «Ver el cambio» de la biblioteca también son los de ahora.

Lo nuevo no envuelve nada: se le llama.

### 4. El comentario que ya no es verdad

En `js/conflictos.js`, sobre `refrescarTrasResolver`, el comentario dice que las guías «se leen
justo al abrir su propia pantalla». Corrígelo con lo que quede siendo verdad tras esta fila.

## Qué NO se toca

- Un asunto que ya tiene hitos de más no se corrige solo. Francisco los borra en el propio asunto
  («Hito ▾» → «Borrar» → «Solo en este asunto»). Ya lo sabe.
- La regla de la fila 118: a un asunto abierto se le añaden los hitos nuevos de la guía, y nada
  de lo que ya tiene se toca, se reordena ni se borra.
- Cómo se guarda una guía (`conFichero`, `guardarTipo`, `guardarPasos`) y la guía mínima.
- No hay textos de pantalla nuevos, ni línea en `js/novedades.js`: no cambia nada que se vea.
- Otros datos que también se lean una sola vez al arrancar (biblioteca de hitos, plantillas,
  campos): no se arreglan aquí. Si al trabajar ves que alguno tiene el mismo fallo, apúntalo en
  una línea en «Lo que queda por hablar con Francisco» de `docs/COLA.md`.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/HITOS-Y-GUIAS.md` y los
  ficheros de la lista basta.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- **`js/hitos.js` tiene 647 líneas**, por encima del tope de 600. No puede ganar ni una: el
  cambio en `pasosOMinima` cabe en las líneas que ya tiene. `js/guias-enganche.js` tiene 340,
  `js/hitos-panel.js` 420, `js/ajustes-tipo.js` 522 y `js/asuntos-nuevo.js` 508.
- Rama `fila-273`, revisor en local y, con su APROBADA, a `main`. Nada se queda en una petición de
  cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs guia
  datos-entre-ordenadores nuevo-asunto hitos`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- `js/guias-enganche.js` (la función nueva en `GuiasDelCentro`).
- `js/hitos.js` (`pasosOMinima`, sin ganar líneas).
- `js/hitos-panel.js` (`crearSiToca` y `completarSiToca`).
- `js/asuntos-nuevo.js` (`App.prepararNuevo`) y `js/ajustes-tipo.js` (al abrir un tipo).
- `js/conflictos.js` (solo el comentario).
- `pruebas/guia-siempre-al-dia.mjs` (nueva; sin navegador, con el disco de mentira, como
  `pruebas/datos-entre-ordenadores.mjs`, que ya cambia `guias.json` «por fuera»). Comprueba:
  1. Sesión con guía de 5 hitos en memoria, disco cambiado por fuera a 2: un asunto nuevo sale
     con 2.
  2. Asunto creado con 2 hitos, sesión con la guía vieja de 5 en memoria: al abrir su ficha
     sigue con 2, y `hitos.json` no se escribe.
  3. Disco cambiado por fuera de 2 a 3 hitos: al abrir la ficha de un asunto abierto de ese tipo
     le llega el tercero (la fila 118 sigue funcionando, ahora también entre ventanas).
  4. Sin cambios en el disco, varias llamadas seguidas no vuelven a leer el fichero entero.
  5. Con un guardado de la guía en marcha, ponerse al día no lee ni pisa nada.
  6. Si la lectura falla, se conserva la copia que había y no sale aviso.
- Al terminar: `docs/contexto/HITOS-Y-GUIAS.md` (cuándo se leen las guías: sustituyendo lo que
  diga hoy), `docs/CONTEXTO-CORTO.md` (solo si alguna línea deja de ser verdad; sin alargarlo) y
  `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En dos o tres frases: que un asunto nuevo coge siempre la guía guardada en ese momento, aunque la
ventana lleve horas abierta o la guía se haya cambiado en otro sitio; y que en pantalla no cambia
nada más.

## Cómo sabemos que está bien

Los puntos 5 a 7 necesitan cambiar la guía «desde otra ventana». La copia de demostración guarda
su disco en la memoria de cada pestaña, así que dos pestañas no lo comparten: si el revisor no
puede cambiar el disco por fuera, esos tres puntos quedan cubiertos por la prueba
`guia-siempre-al-dia` y se dice así en la nota de la fila.

Para todos los puntos: un tipo de asunto inventado («PRUEBA GUIA») con una guía de cinco hitos
(«Uno», «Dos», «Tres», «Cuatro», «Cinco») y una persona inventada («Prueba Inventada, Persona»).

1. Crear un asunto de ese tipo para esa persona: sale con los cinco hitos, «Hito 1 de 5».
2. Abrir Ajustes de ese tipo, pulsar «Cambiar la guía», borrar «Tres», «Cuatro» y «Cinco» y
   guardar: la sección «Guía» dice «2 hitos».
3. Entrar en «Nuevo asunto» y elegir ese tipo: el resumen de la guía dice «2 hitos».
4. Crear otro asunto de ese tipo: sale con dos hitos, «Hito 1 de 2». El primer asunto sigue con
   sus cinco.
5. Con la aplicación abierta en una ventana, cambiar la guía de ese tipo desde otra (de dos
   hitos a uno) y, sin recargar la primera, crear en ella un asunto de ese tipo: sale con un
   hito.
6. En esa primera ventana, sin recargar, abrir la ficha del asunto del punto 4: sigue con sus
   dos hitos; no le aparece ninguno de los borrados.
7. Desde la otra ventana, añadir a la guía un hito nuevo («Seis») y, sin recargar la primera,
   abrir en ella la ficha del asunto del punto 5: le llega «Seis».
8. Abrir y cerrar varias veces la ficha de un asunto con guía: se abre igual de rápido que
   antes, sin avisos nuevos.
9. Abrir Ajustes de ese tipo, pulsar «Cambiar la guía», escribir un título a medias en un hito y
   dejarlo unos segundos: lo escrito no se pierde ni se cierra el cuadro.
10. Crear un asunto de un tipo sin guía: sale con los tres hitos de siempre («Tramitar»,
    «Esperar respuesta», «Archivar»), como antes.
