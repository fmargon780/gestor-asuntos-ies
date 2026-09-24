# Crear un tipo de asunto sin salir de «Nuevo asunto» (fila 128)

Cerrado con Francisco el 24-sep-2026. Idea suya: poder crear el tipo de asunto desde la propia
creación del asunto da agilidad.

**Cambia una decisión de siempre.** Hasta hoy, `docs/CONTEXTO.md` (sección 1) decía: «Los tipos
de asunto solo se crean en Ajustes, nunca sobre la marcha». Desde esta fila, también se crean
desde Nuevo asunto, con lo mínimo. Al terminar, sustituir esa línea (ver «Al cerrar»).

## Qué ve Francisco

1. En Nuevo asunto, elige la categoría y escribe en el buscador de tipos.
2. Si ningún tipo le vale, debajo del buscador sale un botón **«+ Crear tipo nuevo»**. Sale
   siempre que el buscador tenga texto, no solo cuando no hay resultados (puede que salgan
   parecidos que no le sirven). Sin texto escrito, sale también, más discreto, al final de la
   parrilla.
3. Al pulsarlo se abre un cuadro pequeño con **tres datos, y solo tres**:
   - **Nombre** (ya relleno con lo escrito en el buscador, en mayúsculas).
   - **Nombre corto** (opcional, como en Ajustes).
   - **Categoría** (ya puesta la que tenía elegida; se puede cambiar).
4. «Crear» guarda el tipo y el cuadro se cierra. Vuelve a Nuevo asunto **con el tipo nuevo ya
   elegido** y todo lo que había escrito intacto (tercero, textos, campos). Aviso verde: «Tipo
   creado. Su guía, campos y plantillas se añaden en Ajustes.»
5. «Cancelar» o Escape: vuelve a Nuevo asunto como estaba.

Nada más en ese cuadro: ni guía, ni campos propios, ni plantillas, ni plazo. Eso sigue en
Ajustes, como hoy.

## Reglas

- La misma guardia de nombres que en Ajustes: `U.dejaCrear(nombre, hay, 'tipo')`. Si ya existe
  escrito de otra manera, no se crea y se ofrece **elegir el que ya hay** (botón que lo deja
  elegido en Nuevo asunto). Si solo se parece, se avisa y se deja decidir.
- Igual que `$('btn-anadir-tipo').onclick` de `js/ajustes.js`: `Borrados.revivir(App.E.gestor,
  'tipos', nombre)`, `App.E.tipos.push({ tipo, categoria, nombreCorto })`, `await
  App.guardarTipos()`. No inventar otra forma de guardar. Sacar esa lógica a una función común
  (`App.crearTipo({ nombre, categoria, nombreCorto })`) y que la usen los dos sitios.
- `U.mientrasGuarda` sobre el botón «Crear»; si falla, `U.fallo` y el cuadro sigue abierto.
- **Un solo cuadro de diálogo** (`U.preguntar`). Si Nuevo asunto ya es un cuadro de `#capa`, no
  abrir otro encima: el cuadro pequeño va **dentro** de la misma pantalla de Nuevo asunto (panel
  desplegable bajo el buscador), no como segundo diálogo.
- Tras crear: refrescar la parrilla de tipos (`js/tipos-buscador.js`) y el buscador, y dejar el
  tipo nuevo marcado exactamente como si se hubiera pulsado su botón (vista previa del nombre de
  carpeta incluida).
- Módulo nuevo que **no envuelve**: se engancha a `js/tipos-buscador.js` (añadir ahí un punto
  para el botón si hace falta). Antes de colgar `App.crearTipo`, comprobar que el nombre no está
  cogido.

## Ficheros

- Nuevo: `js/tipo-al-vuelo.js` (el botón, el panel de tres datos y la vuelta con el tipo
  elegido).
- Nuevo: `css/tipo-al-vuelo.css`, si hace falta estilo propio.
- `js/ajustes.js`: sacar la creación a `App.crearTipo` y usarla en `btn-anadir-tipo`.
- `js/tipos-buscador.js`: el punto donde se pinta el botón y refrescar tras crear.
- `js/asuntos-nuevo.js`: **solo** si hace falta una función pública para dejar elegido un tipo.
  Cambio quirúrgico: el fichero pasa de 400 líneas; no reescribirlo.
- `index.html`: las líneas del `<script>` y del `<link>` (después de `tipos-buscador.js`).
- Nueva prueba: `pruebas/tipo-desde-el-asunto.mjs` (crear un tipo desde Nuevo asunto, que quede
  elegido, que no se pierda lo escrito, que un nombre repetido no se duplique, que aparezca en
  Ajustes).
- Documentación al cerrar: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, `docs/contexto/ASUNTOS.md`,
  `docs/CONTEXTO.md` (sección 1), `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`,
  `docs/HISTORIA.md`.

## Cómo trabajar

- No leer el repositorio entero: solo `docs/CONTEXTO.md`, `docs/contexto/ASUNTOS.md`,
  `docs/contexto/CAMPOS-Y-TIPOS.md` y los ficheros de arriba.
- Cambios quirúrgicos, no reescribir ficheros enteros.
- Subir directamente a `main`, sin abrir ninguna pull request (si la sesión no puede, seguir la
  nota «Sube directamente a main» de `docs/COLA.md`).
- Una sola prueba al final (`npm test`), no una comprobación tras cada cambio.
- Comprobar lo publicado con `curl` (regla 19 de la cola).

## Al cerrar

- `docs/CONTEXTO.md`, sección 1: sustituir «Los tipos de asunto solo se crean en Ajustes, nunca
  sobre la marcha.» por «Los tipos de asunto se crean en Ajustes o, con nombre, nombre corto y
  categoría, desde Nuevo asunto («+ Crear tipo nuevo», `js/tipo-al-vuelo.js`); la guía, los
  campos y las plantillas, siempre en Ajustes.»
- `docs/CONTEXTO-CORTO.md`, sección 5: añadir a la primera línea «; se crea un tipo nuevo sin
  salir de Nuevo asunto».
