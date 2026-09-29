# Fila 231 — Crear un asunto desde un documento de «Por clasificar»: el formulario siempre completo

Apuntada el 29-sep-2026 desde una conversación de Cowork. Francisco confirmó que el diseño está
cerrado (opción 1). Es un arreglo de la fila 220 (`docs/CREAR-ASUNTO-DESDE-TODOS-LOS-SITIOS.md`),
que ya pedía que todas las entradas a «Nuevo asunto» sacaran el mismo formulario.

## Lo que ve Francisco

En «Ver todo» (documentos por clasificar), pulsa «Crear asunto con él» en un documento. **Unas
veces** «Nuevo asunto» sale bien; **otras** (él no ve la lógica) sale sin las partes para elegir:
ni pastillas de categoría, ni buscador de personas, ni parrilla de tipos de asunto. Solo quedan
«Fecha de inicio», «Año académico», «Descripción corta», «Fecha límite», «Quién lo pide y por qué
vía», el recuadro «SE CREARÁ ESTA CARPETA» vacío y el botón gris «Falta elegir la persona y el
tipo de asunto». No hay forma de seguir.

Captura del caso: una factura, `AmazonBusiness_Invoice_ES61X3IQIAEUD.pdf`, con el cuadro ámbar
«Este asunto se crea con un documento» arriba (recorte en el Centro de mando,
`c602051bf31a715f910e9c1add9d7853`).

### Cómo se reproduce (lo ha encontrado Francisco, 29-sep-2026)

- Recién entrado en la aplicación, «Crear asunto con él» **funciona bien**.
- Si pulsa **«Cancelar»** en «Nuevo asunto» y vuelve a pulsar «Crear asunto con él», el
  formulario **ya sale sin** categoría, buscador ni parrilla.
- Si sale de la aplicación y vuelve a entrar, funciona otra vez; tras cancelar, vuelve a fallar.

Es decir: **lo que deja «Cancelar» estropea la siguiente entrada**. Empezar por ahí: qué hace
«Cancelar» (el de abajo y el de arriba a la derecha) con el estado del formulario, qué esconde o
quita que `App.prepararNuevo` no vuelve a poner, y si la fila 220 lo dejó cubierto solo para
otras entradas. Mirar también «← Volver», que puede tener el mismo fallo.

## Lo que tiene que pasar (decidido con Francisco)

- Desde un documento de «Por clasificar», «Nuevo asunto» sale **siempre completo**, igual que
  desde el botón de la barra: pastillas de categoría, buscador de personas, parrilla de tipos
  (8 más usados + «Ver todos»), vista previa de la carpeta y «Crear el asunto».
- Si la app reconoce en el documento a la persona o el tipo, **salen ya elegidos**, pero se
  pueden cambiar o quitar como en cualquier otro caso.
- Si no reconoce nada, sale completo y vacío (solo con la fecha leída, si la hay).
- El cuadro ámbar «Este asunto se crea con un documento» sigue igual.

## Qué hay que hacer

1. **Reproducirlo.** Con `?demo=1`, crear asuntos desde varios documentos sueltos distintos:
   uno sin nada reconocible (como una factura de una empresa no dada de alta), uno con tercero
   reconocido y sin tipo, uno con tercero y tipo, uno pulsado antes de que el lector termine de
   leerlo, y el mismo documento dos veces seguidas. Alternar con entradas por la barra.
2. **Encontrar la causa y quitarla.** Pistas, sin darlas por buenas:
   - `App.empezarAsuntoCon` (`js/documentos-sueltos.js`) va por tres caminos según lo leído
     (crear de un tirón, `App.nuevoAsuntoCon` con tercero, o solo con fecha). Mirar si alguno
     llega al formulario sin pasar por `App.prepararNuevo` o después de que este haya pintado;
   - que el tercero propuesto por el lector no exista en las listas de hoy, o sea de una
     categoría sin pastilla, y el formulario esconda el buscador y la parrilla en vez de
     mostrarlos vacíos;
   - que el camino «crear de un tirón» (`App.crearAsuntoConPropuesta`) falle a medias y deje
     el formulario pintado sin sus partes;
   - orden de pintado: algo que esconde las partes mientras llegan los datos y no las vuelve a
     enseñar.
   Escribir la causa en `docs/HISTORIA.md`.
3. **Ninguna forma de llegar a «Nuevo asunto» puede dejarlo sin buscador ni parrilla.** Si
   se descubre otra entrada con el mismo fallo (bandeja de correos, «Guardar en un asunto» →
   «No está: crear un asunto nuevo con él»), se arregla en la misma fila.

## Pruebas

- Ampliar la prueba de la fila 220 (o una nueva, `pruebas/crear-asunto-desde-por-clasificar.mjs`)
  con los casos del punto 1: en todos, pastillas, buscador de personas y parrilla de tipos a la
  vista; lo reconocido ya elegido y cambiable; «Crear el asunto» llega al final y el documento
  queda dentro de la carpeta nueva.
- `npm test` completo antes de subir a `pruebas`.

## Cómo sabemos que está bien

1. En la copia de pruebas, «Ver todo» → en un documento suelto sin nada reconocible, «Crear asunto
   con él»: «Nuevo asunto» sale con las pastillas de categoría, el buscador de personas y la
   parrilla de tipos, y el cuadro ámbar arriba.
2. En un documento con persona reconocida: la persona sale ya elegida, y se puede cambiar por otra
   con el buscador.
3. En un documento con persona y tipo reconocidos: el asunto se crea o el formulario sale con los
   dos elegidos; en ningún caso sale sin buscador ni parrilla.
4. Pulsar «Crear asunto con él» en un documento, salir con «Cancelar» y volver a pulsarlo, en el
   mismo documento y en otro distinto, cinco veces seguidas, sin recargar la página: siempre sale
   completo. Lo mismo saliendo con «← Volver» y con el «Cancelar» de arriba a la derecha.
5. Elegir persona y tipo y pulsar «Crear el asunto»: se crea la carpeta, el documento queda dentro
   y se abre el cuadro para ponerle nombre.
6. «+ Nuevo asunto» de la barra sigue saliendo completo y vacío, como antes.

## Cómo trabajar

Reglas de la cola (`docs/COLA.md`), con el revisor de `docs/REVISOR-ANTES-DE-PUBLICAR.md`.
