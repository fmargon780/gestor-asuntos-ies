# Ir al asunto tras añadirle un documento (tema 402, idea 399)

Diseñado con Francisco el 23-oct-2026. Aviso de usuario de origen (idea 399, 21-oct-2026,
pantalla Inicio): «Cuando añadimos un documento de la bandeja Por Clasificar a un asunto ya
existente el sistema nos debería dar la opción de ir al asunto a seguir trabajando con él.»

## Qué hay hoy (no se rehace, se cambia)

- En «Ver todo» (`#zona-clasificar`, `App.irVista('clasificar')`), guardar un documento suelto en
  un asunto que ya existe pasa por `App.llevarSueltoA` (`js/documentos-sueltos.js`): mueve el
  fichero con `Carpetas.moverFichero`, abre el cuadro de ponerle nombre y, al final, saca
  `Navegacion.avisoConIr(...)` (fila 119). Guardar un correo de la bandeja de Gmail en un asunto
  que ya existe pasa por `guardarEnAsunto` (`js/bandeja-guardar.js`), con el mismo aviso.
- Ese aviso (`U.aviso` con `accion`, `js/util.js`) **se borra solo a los 8 segundos**. Francisco
  no llegaba a verlo: por eso pidió la idea.
- «Ir al asunto» (`Navegacion.abrirAbierto`) abre la ficha con `trasVolverA('abiertos')`: su
  «← Volver» lleva a la lista de Inicio, no a «Ver todo».

## Qué hay que hacer

1. **El aviso con «Ir al asunto» no se borra solo.** Cuando se guarda un documento suelto o un
   correo en un asunto **abierto** que ya existe, el aviso verde «Documento guardado en …» /
   «Guardado en …» / «Anotado en …» con su botón «Ir al asunto» se queda en pantalla hasta que
   pase una de estas cuatro cosas: se pulsa «Ir al asunto», se pulsa una ✕ nueva del propio aviso,
   se sale de «Ver todo» a cualquier otra pantalla, o se guarda otro documento o correo en un
   asunto (entonces sale el aviso nuevo y el viejo se quita: nunca dos de estos avisos a la vez).
   Hacerlo con una opción nueva de `U.aviso` (por
   ejemplo `accion.fijo`), sin cambiar cuánto duran los demás avisos de la app. Los otros usos de
   `Navegacion.avisoConIr` (encargos, papelera, estado del hito, unir asuntos) siguen como hoy,
   con sus 8 segundos.
   Si el asunto está en el ARCHIVO y se guardó «sin reabrir», sigue el aviso de siempre, sin
   botón (no hay ficha de abierto a la que ir).
2. **«Ir al asunto» lleva al hito.** Se abre la ficha del asunto en la pestaña «Trabajo»
   (fila 425):
   - si el documento se guardó desde un hito (`opciones.hito` en `App.llevarSueltoA`), con ese
     hito abierto;
   - si no, con el hito en curso, como al abrir la ficha normalmente.
   Para un correo, siempre el hito en curso.
3. **Vuelta a «Ver todo».** Cuando la ficha se ha abierto desde ese aviso, su botón de siempre
   «← Volver» (`#ficha-volver`, `js/ficha-asunto.js`) dice **«← Volver a Ver todo»** y lleva de
   vuelta a «Ver todo», tal como estaba: misma parte (solo correos, solo documentos o las dos,
   `App.irVista('clasificar', soloQue)`) y mismo punto de la página. No es un botón nuevo: es el
   mismo «← Volver», con otro rótulo y otro destino. Si la ficha se abre de cualquier otra forma,
   el botón sigue como hoy («← Volver», a donde se estaba).
4. **El documento no se queda también en la bandeja.** Francisco cree haber visto que, tras
   guardarlo en un asunto, el documento seguía en «Ver todo». No recuerda si seguía al recargar.
   Hay que cubrir las dos posibilidades:
   - **Copia que se queda de verdad.** En `Carpetas.moverFichero` (`js/carpetas.js`), si la copia
     sale bien pero borrar el original de la bandeja falla (`removeEntry`), hoy el error sube y
     `App.llevarSueltoA` dice «El documento no ha podido entrar en el asunto. Sigue en Por
     clasificar», lo que es falso: ya está en el asunto. Ese caso tiene que reintentar el borrado
     una vez y, si sigue fallando, seguir adelante como guardado (cuadro de nombre, registro,
     aviso con «Ir al asunto»), y además un aviso ámbar (`U.accesorio`) que diga: «El documento ya
     está en el asunto, pero no he podido quitarlo de la bandeja. Bórralo de Ver todo.» Mismo
     criterio en `js/bandeja-guardar.js` si el PDF del correo se copia y no se puede quitar de la
     bandeja.
   - **Lista sin poner al día.** Al terminar de guardar, «Ver todo» se repinta
     (`App.pintarSueltos`) y el documento ya no sale. Comprobarlo con una prueba.

## Ficheros que se tocan

`js/util.js`, `js/navegacion.js`, `js/documentos-sueltos.js`, `js/bandeja-guardar.js`,
`js/carpetas.js`, `js/ficha-asunto.js`, `js/novedades.js` (línea nueva) y una prueba nueva
`pruebas/ir-al-asunto-tras-anadir.mjs`. Cambios quirúrgicos; ninguno de estos ficheros pasa de
600 líneas. Una sola tanda de pruebas al final: la nueva y las de lo tocado
(`node pruebas/ejecutar.mjs sueltos`, `bandeja`, `navegacion`, `ficha`).

## Ejemplo con datos reales

Un justificante que llega a «Ha llegado» y se guarda en el asunto de Nicolás Amortegui
(A26-0464), que tiene un hito en curso. En la demostración, cualquier documento suelto y
cualquier asunto abierto con guía.

## Cómo sabré que está bien

1. Guardo un documento de «Ver todo» en un asunto que ya existe y le pongo nombre: el aviso verde
   con «Ir al asunto» se queda en pantalla hasta que lo cierro con la ✕, guardo otro documento o me voy de «Ver todo».
2. Pulso «Ir al asunto»: se abre ese asunto en la pestaña «Trabajo», con el hito en curso abierto
   (o con el hito donde cayó el documento, si lo guardé desde un hito).
3. En esa ficha, el botón de volver dice «← Volver a Ver todo» y me devuelve a «Ver todo». Si
   abro la ficha de otra forma, el botón dice «← Volver», como siempre.
4. Lo mismo con un correo de la bandeja de Gmail guardado en un asunto que ya existe.
5. El documento guardado desaparece de «Ver todo» y no vuelve a salir al recargar la app.

[SOLO FRANCISCO]: el ejemplo real, con A26-0464, en el ordenador del centro.
