# Aviso cuando la persona buscada está en otra lista

Fila 386 de `docs/COLA.md`. Aviso del botón de soporte de Diego Herrera (20-oct-2026, «Ficha de un
asunto», perfil Administración, copia sin internet, versión 19-oct-2026 · 22:25; aviso completo:
https://drive.google.com/file/d/1KqvA6l5fleeh98jtyBrFCzsS3xVBZ1tQ/view?usp=drivesdk). Texto del
usuario: «Al preparar el correo para enviar el certificado de la profesora no encuentra la dirección
de correo electrónico». Diseñada con Francisco el 21-oct-2026.

## El problema

El asunto A26-0462 («CERTIFICADO Díaz Torres, María 686R») se abrió con un tipo de **alumnado**
(«Envío de un certificado del alumnado») para **María Díaz Torres, que es profesora del centro y está
en la lista de profesorado (RelPerCen)** — confirmado por Francisco.

Al elegir primero un tipo de alumnado, el buscador de personas de Nuevo asunto
(`App.buscarTercero`, `js/asuntos-nuevo.js`) busca **solo** en la categoría de ese tipo
(`App.E.nuevo.categoria`). María no sale, el buscador ofrece «dar de alta un solicitante», y lo más
probable es que se diera de alta a mano como alumna (`App.altaTercero`,
`js/asuntos-nuevo-alta.js`). Después, el cuadro de correo (`js/correo.js`, `buscarPersona`) la busca
solo entre el alumnado, no encuentra su correo («No he encontrado a … en los ficheros de datos»), y el
saludo sale «Estimados tutores legales de …».

Decisión de Francisco: se arregla **al crear el asunto**, no en el correo. El cuadro de correo no se
toca.

## Lo que hay que hacer

1. **En el buscador de personas de Nuevo asunto.** Cuando hay un tipo (o una categoría) elegido y la
   búsqueda **no encuentra a nadie en esa categoría**, se busca el mismo texto en la **otra** de
   estas dos: **ALUMNADO** y **PERSONAL** (solo esas dos, con `App.buscarEnCategorias`; tutores
   legales, empresas, administraciones y otros no se miran, para no dar avisos falsos). Si alguna
   devuelve a alguien, en lugar del mensaje de vacío de siempre sale un aviso, uno por persona
   encontrada (como mucho 5), con este texto:

   «**María Díaz Torres** está en **Personal**. Este tipo es de **alumnado**.»

   (los nombres de las listas, los de siempre en pantalla, con `Nombres.textoCategoria`: «Personal»,
   no «Profesorado» — decidido con Francisco; el de la categoría del tipo, en minúscula en mitad de
   la frase), y dos botones:

   - **«Es esa persona: elegir otro tipo»**. Hace `App.fijarTercero(persona)`: la
     persona queda puesta, el tipo elegido se olvida (ya lo hace `App.fijarTercero` cuando la
     categoría no coincide) y la parrilla enseña solo los tipos de la categoría de la persona.
   - **«Es otra persona»**. Quita el aviso y enseña lo de hoy: el mensaje de vacío y el botón de dar
     de alta, si la categoría lo admite.

   Si solo hay **categoría** elegida y ningún tipo, el texto es «… está en **Personal**. Has
   elegido **Alumnado**.» y el primer botón dice «Es esa persona: cambiar»; hace lo mismo.

   Detalles técnicos ya decididos: «Es esa persona» deja también `App.E.nuevo.tipoEnLinea` en
   false (como hace `App.nuevoAsuntoCon`, `js/asuntos-nuevo.js` hacia la línea 325). Las tarjetas
   del aviso no llevan los botones de copiar que añade `js/copiar.js` a `#resultados-tercero`.

   Si la búsqueda **sí** encuentra a alguien en la categoría del tipo, todo sigue como hoy, sin
   aviso (aunque también haya alguien con ese nombre en otra lista).

2. **Al dar de alta a mano desde el buscador de Nuevo asunto**, con tipo o categoría elegidos
   (solo ahí: no en la pantalla Personas, `js/archivo-personas.js`, ni en «Cambiar el asunto»,
   `js/asuntos-editar.js`; la comprobación va en el botón de alta de Nuevo asunto, no dentro de
   `App.altaTercero`). Si para ese mismo texto ya se pulsó «Es otra persona», no se vuelve a avisar.
   Antes de abrir el cuadro de alta, se busca el nombre escrito en las demás categorías
   de personas. Si aparece alguien, sale el mismo aviso con los mismos dos botones: «Es esa persona:
   elegir otro tipo» hace lo mismo que en el punto 1 y no da de alta a nadie; «Es otra persona»
   abre el cuadro de alta como hoy.

3. Lo mismo vale si a Nuevo asunto se llega desde otro sitio (Por clasificar, bandeja de correo,
   encargos…): el buscador es el mismo. El buscador de «Cambiar el asunto»
   (`App.pintarBuscadorDeTercero`) se queda como está.

4. **No se toca**: el cuadro de correo, el saludo, las plantillas, ni el asunto A26-0462 ya creado
   (lo corrige Diego a mano). Tampoco se cambia el comportamiento cuando no hay tipo ni categoría
   elegidos (el buscador ya mira todas las listas).

## Ejemplo con datos reales

María Díaz Torres, profesora del centro, en la lista de profesorado (RelPerCen). Tipo usado por
error: «Envío de un certificado del alumnado». En la copia de pruebas (demo) no tiene por qué existir:
para probar, usar cualquier persona de la lista de profesorado de la demo y un tipo de alumnado; si
hace falta, añadir a la demo una profesora «Díaz Torres, María» (`js/demo/datos.js`).

## Cómo sabré que está bien

1. En Nuevo asunto elijo «Envío de un certificado del alumnado» y busco «María Díaz Torres». Sale el
   aviso de que está en Personal, con los dos botones.
2. Pulso «Es esa persona: elegir otro tipo». María queda puesta y solo se ven tipos de personal.
3. Pulso «Es otra persona». Todo sigue como hoy (mensaje de vacío y botón de dar de alta).
4. Si intento darla de alta a mano como alumna, sale el mismo aviso.
5. Con un alumno que sí está en la lista de alumnos, no sale ningún aviso.

## Pruebas

Una prueba nueva, `pruebas/persona-en-otra-lista.mjs`, que cubra los cinco puntos anteriores en la
demo. `npm test` completo en verde antes de subir (reglas de `docs/COLA.md`).
