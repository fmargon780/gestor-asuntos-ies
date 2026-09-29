# Fila 219 — El tercero se elige con buscador en «Cambiar el asunto»

Diseño cerrado con Francisco el 29-sep-2026.

## Lo que pasa hoy

En la ficha del asunto, el botón «Cambiar» (`App.editarAsunto`, `js/asuntos-editar.js`) abre el
cuadro «Cambiar el asunto». Ahí el tercero es un campo de texto libre (`#ed-tercero`). Si se
escribe mal, el nombre de la carpeta queda con un tercero que no corresponde a nadie dado de alta,
y el asunto deja de estar unido a su persona (buscador, ficha del tercero, «Asuntos de…»).

## Lo que se quiere

1. **Solo buscador, sin texto libre.** El campo «Tercero» del cuadro pasa a ser el mismo buscador
   de personas de «Nuevo asunto» (`App.buscarTercero`, `App.buscarEnCategorias`, tarjetas con
   `App.claseDeResultado`/`App.pieDe`, listas propias de `App.LISTAS_DE_CATEGORIA` para
   Administraciones). Se escriben dos letras o más, salen los resultados y se pulsa uno. No se puede
   guardar un nombre escrito a mano.
2. **Busca en todas las categorías** (alumnado, personal, tutores legales, administraciones,
   empresas, otros…: `Nombres.CATEGORIAS`), como «Nuevo asunto» sin pastilla elegida. No hay
   pastillas de categoría en este cuadro.
3. **Al abrir el cuadro**, el tercero actual aparece ya elegido (como una tarjeta o línea «Tercero:
   Nombre · categoría» con un «Cambiar» o «✕» para buscar otro). Si no se toca, al guardar el
   tercero no cambia, aunque sea un asunto antiguo cuyo tercero no aparezca hoy en ninguna lista.
4. **Si no aparece**, los mismos botones de alta de «Nuevo asunto» (`App.botonesAlta` /
   `App.botonAlta`). El tercero recién dado de alta queda elegido en el cuadro «Cambiar el asunto»,
   sin pulsar nada más, y el cuadro sigue abierto con lo demás que se hubiera tocado (fecha, tipo,
   descripción, campos). Ojo: hoy el alta está pensada para `App.E.nuevo`; hay que hacer que
   funcione también desde este cuadro sin ensuciar el estado de «Nuevo asunto» (ver fila 220:
   `App.nuevoEnBlanco`, `App.E.nuevoVisita`).
5. **El texto del tercero** que va al nombre de la carpeta es exactamente el que produce «Nuevo
   asunto» al elegir a esa persona (`App.fijarTercero`): mismo formato por categoría (alumnado
   `Apellido1 Apellido2, Nombre` + NIE, etc.). La vista previa «Se llamará» se refresca al elegir.
6. **Categoría distinta del tipo.** Si el tercero elegido es de otra categoría y el tipo de asunto
   elegido en el cuadro no le encaja (`Nombres.categoriaDeTipo`), sale un aviso ámbar dentro del
   cuadro, junto al tipo: «Este tipo es de <categoría>; <nombre> es de <categoría>. Cambia el tipo
   si no encaja.» **No impide guardar.** El aviso desaparece en cuanto encajan.
7. **Administraciones.** El selector de departamento que ya pone
   `AdministracionesFicha.htmlEditar(a)` sigue funcionando y se rehace al elegir otro organismo
   (o desaparece si el nuevo tercero no es una administración). Reutilizar `App.alFijarTercero`
   si encaja.
8. **Datos guardados del tercero.** Si el asunto guarda algo del tercero además del nombre
   (categoría, `ficha.contacto`, departamento, marca de reservado…), al cambiar de tercero se pone
   al día igual que al crear un asunto nuevo. Si el tercero no cambia, no se toca nada.
9. **Asuntos reservados.** Con candado, el cuadro sigue enseñando el tercero solo a quien ya puede
   verlo hoy; no abrir ninguna vía nueva para ver el nombre.

Todo lo demás del cuadro (renombrar la carpeta copiando primero, comprobaciones de longitud y de
ruta de Dropbox, cambio de guía al cambiar de tipo) no cambia.

## Vocabulario en pantalla

Usar solo las palabras acordadas (`docs/VOCABULARIO-EN-PANTALLA.md` y filas 189-190): «Tercero»,
«Dar de alta», «Cambiar», «Quitar». Nada de «persona elegida», «contacto» ni «interesado».

## Cómo sabemos que está bien

1. En la ficha de un asunto, «Cambiar» abre el cuadro con el tercero actual ya elegido; guardar
   sin tocarlo deja el nombre de la carpeta igual.
2. Al escribir dos letras en «Tercero» salen personas de todas las categorías; al pulsar una, «Se
   llamará» cambia con el formato correcto y, al guardar, la carpeta se renombra.
3. No hay forma de guardar un tercero escrito a mano.
4. Si la persona no aparece, «Dar de alta» la crea y la deja elegida en el mismo cuadro, sin
   perder lo ya cambiado; «Nuevo asunto» sigue en blanco después.
5. Elegir un tercero de otra categoría enseña el aviso ámbar junto al tipo, y aun así deja guardar.
6. Con un organismo de Administraciones sale el selector de departamento; con otra categoría, no.

## Pruebas

- Prueba nueva `pruebas/tercero-con-buscador-al-cambiar.mjs` con los seis puntos de arriba.
- Poner al día las pruebas existentes que escriban en `#ed-tercero` como texto libre.
- `npm test` completo en verde, y el revisor como siempre (`docs/REVISOR-ANTES-DE-PUBLICAR.md`).

## Nota para la cola

La conversación de diseño (Cowork, 29-sep-2026) no pudo cambiar la fila 219 de `docs/COLA.md`
(sin permiso de `git push` y el fichero pasa de 100 KB, demasiado para subirlo entero por la
herramienta de GitHub; reglas 12 y 17 de la cola). La fila correcta es:

    | 219 | `docs/TERCERO-CON-BUSCADOR-AL-CAMBIAR.md` (en «Cambiar el asunto», el tercero se elige con el buscador de «Nuevo asunto», en todas las categorías, con alta desde ahí; sin texto libre; aviso ámbar sin bloquear si el tipo no encaja con la categoría) | PENDIENTE (29-sep-2026) |
