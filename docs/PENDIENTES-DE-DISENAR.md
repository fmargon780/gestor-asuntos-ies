# Pendientes de diseñar

Ideas aceptadas pero **sin diseñar todavía**. No son instrucciones: no entran en
`docs/COLA.md` hasta que Francisco cierre el diseño en una conversación.

Cuando Francisco pregunte por tareas pendientes de diseñar, se le lee esta lista.

---

## 1. El equipo usa el gestor sin entrar en él («camino 1»)

**Fecha:** 26-sep-2026. **Diseñado el mismo día: es la fila 182** (`docs/AVISOS-A-QUIEN-LO-PIDE.md`). Sale de `claude/Analisis-estabilidad-crecimiento-2026-09-26.md`
(proyecto de Claude). Decidido con Francisco: dirección quiere que el equipo **consulte y encargue**,
no que tramite. La app no se abre a más usuarios; Administración sigue siendo la única que escribe.

**La idea.** El resto del centro se relaciona con los asuntos por correo. Son tres piezas, cada una
una conversación de diseño y una fila de la cola:

1. **Aviso automático a quien lo pidió** («Lo pide» ya guarda su correo) cuando el asunto cambia de
   hito o se cierra. Texto corto, con el paso en el que está.
2. **Resumen de estado con un clic**, desde la ficha o la mesa: «Tu asunto va por el paso 3 de 7:
   pendiente de firma», por correo a quien lo pidió o a quien se elija.
3. **Informe periódico para dirección** por correo (lo que hoy es «Cuentas» y «Qué me toca», por
   órgano), sin que dirección tenga que entrar en la app.

**Lo que habría que decidir antes de escribir nada:** si el aviso del punto 1 sale solo o se
confirma antes; qué plantilla usa cada pieza; cada cuánto y a quién va el informe del punto 3; y si
la entrada de encargos con datos (un formulario que llegue por correo con etiqueta) se diseña ya o
se espera a la cuenta de correo común del centro.

**Va después** de la tanda de estabilidad (filas 176-178) y de las tandas 2 y 3 de usabilidad.

---

## 2. Trabajar desde casa: la aplicación conectada directamente al Dropbox del centro

**Fecha:** 2-oct-2026. Sale del aviso de la fila 260 (`docs/SOLO-CONSULTA-EN-ESTE-ORDENADOR.md`,
que es la protección de mientras tanto). **Sin diseñar.** Elegido por Francisco como camino de
fondo, a la espera de una conversación suya en el centro.

**El problema.** En casa (Chromebook) Francisco no tiene el Dropbox del centro. Trabajaba sobre
una copia de las dos carpetas en su Google Drive, que sube su ordenador del centro con «Drive para
ordenadores». Lo de casa solo llega al centro si ese ordenador está encendido, y llega a trozos,
mezclado con lo que hace el compañero. El 2-oct-2026 hubo cambios que no aparecían, fichas sin
carpeta y números de asunto repartidos por separado en cada copia.

**La idea.** Desde casa, la aplicación entra en el Dropbox del centro por internet (con permiso de
Dropbox dado una vez), sin carpeta local, sin la copia de Drive y sin depender de ningún ordenador
encendido. Una sola copia de los datos: la del centro.

**Lo que falta saber o decidir antes de escribir nada:**

1. **El permiso.** Francisco no tiene la contraseña del Dropbox del centro. Puede pedir a quien la
   tiene un paso de una sola vez, sin que le den la contraseña (no pudo ser el 2-oct-2026). Dos
   formas: compartir las dos carpetas (asuntos vivos y ARCHIVO) con una cuenta de Dropbox de
   Francisco, o autorizar la aplicación en la cuenta del centro. Hay que saber antes cómo está
   montada esa cuenta (una cuenta común o un equipo de Dropbox) y cuánto ocupan las dos carpetas:
   en una cuenta gratuita caben 2 GB y las carpetas compartidas cuentan.
2. **Dar de alta la aplicación en Dropbox** (una clave de aplicación): un paso de puesta en marcha
   de Francisco, una vez, con su guía paso a paso.
3. **Cómo se hace por dentro.** Hoy 43 ficheros de `js/` usan directamente los manejadores de
   carpetas del navegador. El disco de demostración (`js/demo/disco.js`) ya imita esos manejadores
   en memoria: un «disco de Dropbox» con la misma forma parece viable, pero no está comprobado a
   fondo (velocidad al listar muchas carpetas, límites de Dropbox, ficheros grandes). Es un trabajo
   grande, de varias filas.
4. **Qué pasa con lo demás:** el centro sigue con sus carpetas locales y la copia sin internet; el
   modo «solo consulta» de la fila 260 se queda para quien trabaje sobre una copia.

**Caminos que se vieron y no se eligieron:** manejar a distancia el ordenador del centro desde el
Chromebook (no hay que programar nada, pero el ordenador tiene que estar encendido y la red del
centro puede bloquearlo); dejar la copia de Drive solo para consultar (es la fila 260).

**Mientras tanto:** en casa, solo consulta, y nunca cambiar nada sobre la copia de Drive.

## Mover un hito desde la mesa, en los demás asuntos (fila 300)

«Hito ▾» → «Cambiar» → «Colocar después de», guardado «A la guía», solo mueve el hito en los demás asuntos si está vacío (`propagarCambio`); «Cambiar la guía» (fila 300) recoloca todos los sin hacer. Hablar con Francisco si deben ser la misma regla.
