# La explicación del hito, en «Crear» y «Cambiar» (fila 228)

Diseñado con Francisco el 1-oct-2026 en Cowork. Idea 228 de la cola, apuntada desde el Centro de
mando: «El botón Cambiar del menú Hito no modifica lo que previamente se ha escrito en su
descripción».

## Qué pasa hoy

En la mesa de un hito, el menú «Hito ▾» → «Cambiar» (`abrirCambiar` en
`js/hitos-desde-el-asunto.js`) solo trae Título, Colocar después de, Responsable y Plazo. No trae
la **explicación del hito**: el texto con viñetas que se ve debajo del título en la mesa
(`h.cuerpo`, pintado como `.hito-explicacion` en `js/hitos-panel-lista.js`). En la guía es el
cuadro «Explicación del hito» (`.paso-cuerpo`, `contenteditable`, en `js/guias-editor.js`, campo
`cuerpo` del paso). Ejemplo real del recorte de Francisco:

> Si es factura, comprobamos la validez fiscal de la misma:
> - Dice: FACTURA
> - Tiene Número de identificación fiscal
> - Tiene expresado base imponible y tipo impositivo si no es simplificada.

Desde el asunto no hay forma de cambiar ese texto. Tampoco se puede escribir al crear un hito.

## Qué quiere Francisco

1. **«Cambiar este hito»** lleva un cuadro nuevo **«Explicación»** (opcional), debajo del Título,
   con el texto que ya tiene el hito, listo para corregirlo.
2. El cuadro conserva el formato: viñetas, negritas y saltos de línea, igual que el cuadro
   «Explicación del hito» de la guía en Ajustes. Mismo tipo de caja (`contenteditable`) y mismo
   limpiado (`Guias.limpiar`) al leerlo. Si en Ajustes hay botones de viñeta o atajos, que sirvan
   también aquí; si no los hay, al menos que pegar un texto con viñetas las conserve.
3. **«Crear un hito»** lleva el mismo cuadro, vacío. Si se elige un hito de la biblioteca, el
   cuadro se rellena con su explicación (`modelo.explicacion`), que se puede cambiar antes de
   guardar.
4. Se guarda con la pregunta de siempre, **«¿Dónde se guarda?»** (fila 235,
   `js/donde-se-guarda.js`), sin nada nuevo:
   - «A la guía de <tipo>»: la explicación cambia en el paso de la guía (`cuerpo`) y llega a los
     asuntos abiertos del tipo con las mismas reglas que el título (`propagarCambio`: en el propio
     asunto siempre; en los demás, solo si el hito sigue vacío). El «Deshacer» del aviso verde la
     devuelve como estaba, igual que el título.
   - «Solo en este asunto»: cambia solo `h.cuerpo` de este hito (`cambiarSoloAsunto` →
     `Hitos.guardarCampos`, que hoy no acepta `cuerpo`: añadirlo en `js/hitos-archivo.js`).
   - Un hito propio que se lleva a la guía (`cambiarYLlevarALaGuia`, `llevarHitoEntero`) se lleva
     también su explicación.
5. Al crear «Solo en este asunto» o «A la guía» (`crearSoloAsunto`, `crearConGuia`), el hito
   nuevo y su paso llevan el `cuerpo` escrito. Con la biblioteca (`crearDesdeBiblioteca`), si se
   ha cambiado el texto, el paso nuevo lleva el texto cambiado; la biblioteca no se toca.
6. Explicación vacía: se guarda vacía (el hito deja de enseñarla). No es obligatoria.
7. Ventana grande: el cuadro crece con el texto (sin barra de desplazamiento propia hasta unas 12
   líneas). La ventana sigue cabiendo a 1280 px de ancho y con «Guardar» a la vista.

## Antes de empezar

- Comprobar si la sincronización de guías (`js/hitos-sincronizar.js`, `Hitos.leer`) vuelve a
  copiar el `cuerpo` de la guía sobre el hito: si lo hace, un cambio «Solo en este asunto» se
  perdería al recargar. Si pasa, marcar el hito como cambiado aquí (igual que se hace con el
  título si ya existe ese mecanismo) para que la guía no lo pise.
- Mirar que no haya otro nombre para el mismo dato (`explicacion` en la biblioteca,
  `cuerpo` en guía y hito) y no inventar un tercero.
- Texto de pantalla con `docs/VOCABULARIO.md`: la etiqueta es «Explicación», con «(opcional)»
  en gris, como Responsable y Plazo.

## Ficheros

- `js/hitos-desde-el-asunto.js`: `cuerpoFormulario` (cuadro nuevo), `leerFormulario`
  (`cuerpo`), `abrirCrear`, `abrirCambiar`, `crearSoloAsunto`, `crearConGuia`,
  `crearDesdeBiblioteca`, `cambiarSoloAsunto`, `cambiarConGuia`, `propagarCambio`. Si pasa de 600
  líneas, partir por temas (regla de `docs/CONTEXTO-CORTO.md` §6).
- `js/hitos-archivo.js`: `guardarCampos` acepta `cuerpo` (pasado por `Guias.limpiar`).
- `js/hitos-desde-el-asunto-guia.js`: la instantánea y el «Deshacer» incluyen `cuerpo`.
- CSS del cuadro (el mismo aspecto que `.paso-cuerpo` de Ajustes).
- Datos de demostración: que al menos un hito de un tipo con guía tenga una explicación con
  viñetas, para el revisor.
- Prueba nueva `pruebas/explicacion-del-hito-al-cambiar.mjs`, con los puntos de abajo.
- Documentación al terminar: `docs/CONTEXTO-CORTO.md` (§5, línea de Hitos, sustituyendo),
  `docs/contexto/HITO-MESA.md`, `docs/contexto/HITOS-Y-GUIAS.md`, `docs/HISTORIA.md` y
  `docs/COLA.md`.

## Qué dirá Claude Code a Francisco al terminar

En «Hito ▾» → «Cambiar» ya sale la explicación del hito, con sus viñetas, para corregirla; y en
«Crear» se puede escribir una. Se guarda en la guía o solo en el asunto, con la pregunta de
siempre.

## Cómo sabemos que está bien

1. Abrir un asunto de un tipo con guía y la mesa de un hito que tenga explicación con viñetas.
   Pulsar «Hito ▾» → «Cambiar»: sale el cuadro «Explicación» con ese mismo texto y sus viñetas.
2. Cambiar una palabra de la explicación, dejar «A la guía de <tipo>» marcada y Guardar: la mesa
   enseña el texto nuevo, con las viñetas. En Ajustes → la guía de ese tipo, el hito tiene el
   texto nuevo. Otro asunto abierto del mismo tipo con ese hito vacío también lo tiene.
3. Pulsar «Deshacer» en el aviso verde: la explicación vuelve a la de antes en la guía y en el
   otro asunto; aquí se queda el cambio, como «solo en este asunto» (igual que el título,
   `docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md`, punto 5).
4. Cambiar la explicación eligiendo «Solo en este asunto»: cambia aquí; la guía y el otro asunto
   siguen con la de antes. Recargar la página: el cambio sigue aquí.
5. «Hito ▾» → «Crear»: sale el cuadro «Explicación» vacío. Escribir un título y una explicación
   con dos viñetas y guardar «Solo en este asunto»: el hito nuevo enseña la explicación con sus
   viñetas.
6. «Crear», buscar un hito de la biblioteca y elegirlo: el cuadro se rellena con su explicación.
7. Borrar todo el texto de la explicación en «Cambiar» y guardar: el hito ya no enseña
   explicación, sin error.
8. A 1280 px de ancho, con una explicación de 15 líneas, la ventana cabe y «Guardar» se ve sin
   desplazar la página.
