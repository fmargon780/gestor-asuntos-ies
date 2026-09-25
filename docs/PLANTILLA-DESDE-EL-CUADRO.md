# Fila 151 — Crear y editar la plantilla desde el propio cuadro de Séneca y de Correo

Diseño cerrado con Francisco el 25-sep-2026.

## Qué pide Francisco

Cuando va a comunicar algo por Séneca (o iPasen) y ese tipo de asunto no tiene plantilla, quiere
poder crearla desde ahí mismo, sin ir a Ajustes. Si ya la tiene, quiere poder editarla desde ahí.
Y, al guardar, que el mensaje que está preparando se rellene con la plantilla nueva o corregida.

**iPasen no es una vía nueva.** Para Francisco es el mensaje de Séneca (las familias lo reciben en
iPasen). No se añade nada a «Comunicar».

## Cómo tiene que quedar

En el cuadro de «Mensaje de Séneca» **y** en el de «Correo electrónico** (la plantilla es la misma
para los dos: `_GESTOR/plantillas.json`, `window.Plantillas`), junto al desplegable «Plantilla»:

1. **Sin ninguna plantilla para ese tipo de asunto**: hoy el desplegable no se pinta. En su lugar
   sale un botón **«Crear plantilla»**.
2. **Con plantilla**: al lado del desplegable, un botón **«Editar plantilla»**, que edita la que
   esté elegida en ese momento.
3. El editor se abre **dentro del mismo cuadro**, nunca con un segundo `U.preguntar` (solo hay una
   capa de diálogo). Mismo patrón que `#correo-formulario` / `#correo-resumen` en
   `js/correo-cuadro.js`: dos bloques hermanos que se alternan con la clase `oculto`. «Volver» o
   «Cancelar» devuelven al cuadro **sin perder nada** de lo escrito (Para, asunto, cuerpo,
   destinatarios, documentos marcados).
4. El editor lleva lo mismo que el de Ajustes (`js/plantillas-ajustes.js`): nombre y texto, el
   botón **«Insertar hueco»** (`HuecosBuscador.montar`, que ya cuelga del `<body>` y no usa
   `U.preguntar`), con todos los huecos del sistema y los campos propios del tipo, y una **vista
   previa en vivo con los datos reales del asunto en el que se está** (no con el primer asunto
   abierto del tipo). Reutilizar lo de `js/plantillas-ajustes.js` sacándolo a una función común
   si hace falta; no duplicar el editor.
5. El tipo y la categoría de la plantilla nueva son los del asunto abierto: no se preguntan.
6. **Al guardar**: se guarda como en Ajustes (`Plantillas.guardar`, releyendo el fichero antes,
   compartido con el compañero), se vuelve al cuadro, la plantilla queda elegida en el
   desplegable (que ahora sí se pinta) y **el cuerpo del mensaje se rellena con ella**. Si el
   cuerpo tenía texto escrito a mano, se usa la confirmación en línea que ya existe
   (`#correo-plantilla-confirmar`) antes de pisarlo. El aviso ámbar «Faltan datos: …» se
   recalcula.
7. Funciona igual desde la ficha del asunto y desde «Comunicar» dentro de un hito (la mesa), porque
   los dos acaban en `js/correo.js`, `abrirCuadro`. Comprobarlo.

## Ficheros que hay que tocar

- `js/correo.js` (desplegable «Plantilla» en `camposComunes`/`interiorDeComunes`, `#correo-comunes`)
- `js/seneca-cuadro.js`
- `js/correo-cuadro.js`
- `js/plantillas-ajustes.js` (sacar el editor a una función reutilizable)
- `js/plantillas.js` solo si hace falta una función pública nueva
- `css/correo.css` y `css/seneca.css` si hace falta
- Una prueba nueva: `pruebas/plantilla-desde-el-cuadro.mjs`
- Al cerrar: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, `docs/contexto/CORREO-Y-SENECA.md`,
  `docs/HISTORIA.md`

Si alguno de estos ficheros pasa de 600 líneas al tocarlo, se parte por temas (regla del
repositorio).

## Cómo trabajar

- Sube directamente a `main`, sin abrir ninguna pull request (si la sesión lo tiene forzado, la
  nota de `docs/COLA.md` sobre fusionar sola se aplica).
- Cambios quirúrgicos: no reescribas ficheros enteros.
- No leas el repositorio entero: `docs/CONTEXTO.md` y `docs/contexto/CORREO-Y-SENECA.md` bastan.
- Una sola prueba al final, en navegador de verdad: tipo sin plantilla → «Crear plantilla» → se
  inserta un hueco → la vista previa sale con los datos del asunto → guardar → el cuerpo del
  mensaje de Séneca sale relleno. Y otra pasada: «Editar plantilla» sobre una existente, con
  texto escrito a mano en el cuerpo → pide confirmar antes de pisarlo. Que no se pierda el «Para»
  ni el asunto al ir y volver del editor. Que siga en verde `pruebas/plantillas.mjs`,
  `pruebas/plantillas-huecos.mjs` y `pruebas/seneca-cuadro-ancho.mjs`.

## Qué verá Francisco

En «Comunicar» → Séneca o Correo: un botón «Crear plantilla» si el tipo no tiene ninguna, o
«Editar plantilla» si la tiene. Al guardar, el mensaje ya sale escrito con ella.
