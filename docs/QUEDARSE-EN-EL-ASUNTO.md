# Quedarse en el asunto después de guardar un documento

Acordado con Francisco el 17 de septiembre de 2026.

## El problema, con sus palabras

> Tras guardar un documento en un asunto, la aplicación nos expulsa fuera del asunto, a la lista
> de asuntos que tengamos seleccionada. Esto nos obliga a volver a entrar en el asunto para poder
> seguir trabajando en dicho asunto.

## Lo que tiene que pasar

Al guardar un documento dentro de un asunto, la pantalla se queda en la ficha de ese asunto.
Nunca se vuelve a la lista de asuntos abiertos, ni a "Por clasificar", ni se cambia de montón.

Vale para todas las acciones que guardan un documento dentro de un asunto, no solo para una:

- Registrar un documento (`js/registro.js`, desde la ficha y desde "Gestionar documentos").
- Añadir o renombrar un documento en "Gestionar documentos" (`js/documentos.js`).
- Asociar un PDF que ya trae el sello de Séneca (`js/registro-sellado.js`).
- Generar un documento desde una plantilla de Word (`js/plantillas-documento.js`).
- Separar, Unir y Sacar páginas de un PDF dentro del asunto (`js/pdf-separar-unir.js`).
- Meter un documento suelto, o un correo, en un asunto **que ya se está viendo**
  (`js/documentos-sueltos.js`, `js/elegir-asunto.js`, `js/bandeja-*.js`).
- Preparar un correo con documentos adjuntos (`js/correo-adjuntos.js`).

Además:

1. La lista de documentos de la ficha se refresca sola: el documento nuevo se ve sin recargar
   nada. Eso ya lo hace `FichaDocumentos.pintar`; solo hay que asegurarse de que se sigue
   llamando después de cada una de esas acciones.
2. Si el guardado falla, tampoco se sale: se queda en la ficha con el aviso rojo de siempre.
3. Los tres casos que **sí** deben seguir devolviendo a la lista se quedan como están, porque el
   asunto deja de existir o deja de llamarse igual: **Editar**, **Archivar / Reabrir** y **Borrar
   el asunto**. No se toca `volverALaLista` en esos tres sitios.

## Dónde buscar el fallo

Esta conversación ya ha revisado, y **no** son la causa (no cambian de pantalla al guardar):

- `js/ficha-asunto.js` — solo sale de la ficha en Editar, Archivar/Reabrir y Borrar.
- `js/ficha-documentos.js` — repinta en su sitio.
- `js/documentos.js` y `js/registro.js` — se quedan dentro de su propio cuadro.
- `js/nucleo.js` (`App.anotar`, `App.refrescarFichas`) — no navega.
- `js/asuntos-lista.js` (`App.verAbiertos`, `App.pintarAbiertos`) — no navega.
- `js/frescura.js`, `js/puente.js`, `js/salir.js` — descartados.

Así que la causa está en uno de estos dos sitios, y hay que encontrarla antes de arreglar nada:

**a) Alguien llama a `App.ir(...)`, `App.irVista(...)` o `Gestor.filtrarPorPlazo(...)` después de
guardar.** Busca en todo `js/` las llamadas a esas tres funciones (`grep -n "App\.ir(\|App\.irVista(\|filtrarPorPlazo" js/*.js`)
y mira cuáles pueden dispararse con la ficha de un asunto abierta.

**b) La vigilancia automática de la carpeta.** `App.vigilarLaCarpeta()` se llama al entrar
(`js/nucleo.js`) y mira la carpeta cada `App.SEGUNDOS_ENTRE_MIRADAS` (20 segundos). Guardar un
documento cambia la carpeta; si esa vigilancia, al notar el cambio, repinta la pantalla de
asuntos abiertos o la enseña, expulsa de la ficha justo después de guardar, que es exactamente lo
que describe Francisco. Búscala (`grep -rn "vigilarLaCarpeta" js/`) y comprueba qué hace cuando
detecta un cambio.

La causa puede ser una de las dos, o las dos a la vez. Arregla todas las que encuentres.

## Cómo arreglarlo

Dos piezas, las dos pequeñas:

**1. Una barrera en la propia ficha.** En `js/ficha-asunto.js`, publica el asunto que se está
viendo, por ejemplo `App.fichaAbierta = function () { return actual ? actual.nombre : ''; }`
(comprueba antes que ese nombre no esté ya cogido en `App`, como manda `docs/CONTEXTO.md`).
Cualquier repintado **automático** —el que no ha pedido Francisco pulsando un botón— consulta esa
función y, si hay una ficha abierta, refresca los datos pero **no** llama a `App.ir(...)` ni a
`App.irVista(...)`.

**2. Volver a enganchar el asunto tras releer la carpeta.** `App.verAbiertos()` crea objetos de
asunto nuevos, así que el que tiene la ficha en la mano se queda viejo. Después de releer, si hay
ficha abierta, hay que cogerlo otra vez de `App.E.listaAbiertos` por su nombre y repintar la
ficha. Ese apaño ya existe, escrito a mano, dentro de `anadirTipo` en `js/ficha-asunto.js`:
sácalo a una función y úsala en los dos sitios, en vez de repetirlo.

Si el asunto ya no está en la lista (porque se ha archivado o borrado desde el otro ordenador),
entonces sí se vuelve a la lista, con un aviso de una línea.

## Reglas de esta instrucción

- Cambios quirúrgicos. No reescribas ningún fichero entero.
- **No partas ningún fichero en esta instrucción**, aunque pase de 400 líneas: son cambios de
  pocas líneas y partir ahora `js/ficha-asunto.js` costaría más de lo que arregla.
- No leas el repositorio entero: solo `docs/CONTEXTO.md` y los ficheros que toques.
- Una sola pasada de pruebas al final, no después de cada cambio.
- **Sube directamente a `main`. No abras ningún pull request.**

## Prueba

Prueba nueva `pruebas/quedarse-en-el-asunto.mjs`, con el disco de mentira que ya usan las demás:

1. Abrir la ficha de un asunto, guardar un documento en su carpeta y comprobar que
   `#pantalla-asunto` sigue a la vista y `#pantalla-abiertos` sigue oculta.
2. Comprobar que el documento nuevo aparece en `#ficha-documentos` sin recargar nada.
3. Simular el repaso automático de la carpeta con la ficha abierta y comprobar que no cambia de
   pantalla, y que la ficha sigue enseñando el mismo asunto.
4. Comprobar que Archivar sí devuelve a la lista (que no se ha roto lo que debía seguir igual).

Al terminar: batería completa en verde, `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`
actualizados sustituyendo la línea vieja, y la fecha en `docs/HISTORIA.md`.
