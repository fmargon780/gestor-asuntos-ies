# El asunto del mensaje es siempre el nombre de la carpeta

Instrucción acordada con Francisco el 18-sep-2026. Fila 55 de `docs/COLA.md`.

**Va después de la fila 53** (`docs/SENECA-CUADRO-ANCHO.md`), que rehace el cuadro de Séneca y
mueve su código a `js/seneca-cuadro.js`. Si la 53 ya está hecha, este cambio se aplica sobre el
resultado de la 53.

## Qué pasa hoy

Debajo del campo **Asunto** hay dos botones que eligen cómo se escribe ese asunto:

- **Nombre de la carpeta**
- **Versión legible**

Están en el cuadro de **Correo** y en el de **Mensaje de Séneca**.

## Qué se quiere

Que no haya elección. El asunto del mensaje es **siempre el nombre de la carpeta del asunto**, tal
cual, sin recortes ni adornos.

Motivo de Francisco: el nombre de la carpeta es el que es, y es lo que permite reconocer después a
qué asunto pertenece cada mensaje del hilo. Una versión "legible" rompe esa pista.

## Qué hay que hacer

1. **Quitar los dos botones** de debajo del campo Asunto, en los dos cuadros (Correo y Mensaje de
   Séneca). Quitar también el texto de ayuda que los acompañe, si lo hay.
2. **Dejar el campo Asunto** donde está y como está: se ve y se puede editar a mano antes de
   enviar, igual que ahora.
3. **El valor de partida del campo Asunto es siempre el nombre de la carpeta.** Nunca la versión
   legible, ni en Correo ni en Séneca.
4. **Borrar el código que ya no se usa**: la función que fabricaba la "versión legible" del
   asunto, el estado que guardaba cuál de las dos estaba elegida (si se guardaba en `_GESTOR` o en
   el navegador, también eso), y los estilos propios de esos botones.
5. **No tocar nada más del cuadro**: ni destinatarios, ni cuerpo del mensaje, ni plantillas, ni
   `apps-script/gestor-correos.gs`. El enganche del hilo por matrícula sigue igual.
6. Si alguna plantilla de correo o de Séneca usaba el asunto legible a través de un hueco, ese
   hueco pasa a devolver el nombre de la carpeta.

## Ficheros que hay que tocar

- `js/correo.js` (el cuadro de Correo; y también el de Séneca si la fila 53 aún no está hecha).
- `js/seneca-cuadro.js` y `css/seneca.css`, si la fila 53 ya los ha creado.
- El CSS donde estén los estilos de esos dos botones.
- `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/HISTORIA.md` y `docs/COLA.md` al terminar.

No leas el repositorio entero: busca por el texto `Nombre de la carpeta` y por el texto de la
versión legible, y toca solo lo que salga.

Cambios quirúrgicos, no reescribir ficheros enteros. **Una sola prueba al final**, no una
comprobación después de cada cambio.

## Aviso

En `docs/CONTEXTO-CORTO.md`, sección 8, queda pendiente comprobar con Séneca si Comunicaciones
acepta el largo del asunto que le damos. Esto no lo resuelve: lo deja pendiente igual, porque el
nombre de la carpeta es el asunto más largo de los dos. Déjalo escrito ahí como está.

## Cómo se sube

Sube directamente a `main`, sin abrir ninguna petición de cambios. Como máximo dos subidas
(regla 13 de la cola).
