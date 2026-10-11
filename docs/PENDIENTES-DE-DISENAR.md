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

## 3. Aviso de actividad extraescolar solo al profesorado afectado (idea 306, 8-oct-2026)

Proyecto futuro, apuntado por Francisco: hoy no está listo. El aviso de una actividad extraescolar
se manda a todo el profesorado. Francisco quiere afinarlo: mandarlo solo al profesorado que da
clase a las unidades convocadas, en las horas de esos días. Para saberlo, el gestor tendría que
enlazarse con la otra aplicación del centro que lleva los horarios y las ausencias. Hasta que ese
enlace exista, el aviso sigue yendo a todo el profesorado (así se diseña la idea 306).

## 4. Importar las actividades extraescolares antiguas (idea 306, 8-oct-2026)

El compañero de Francisco tiene una base de datos de Access con todas las actividades
extraescolares de cursos anteriores. Francisco quiere importarlas, no teclearlas; el 8-oct-2026 no
tenía acceso al fichero. **No se puede diseñar sin verlo**: cuando lo tenga (el fichero de Access o
sus tablas pasadas a Excel), se adjunta en una conversación y se diseña la importación.

Lo que ya está preparado: una actividad antigua es una actividad de `_GESTOR/actividades.json` con
`asunto: null` y `antigua: true` (fila 310, `docs/ACTIVIDADES-EXTRAESCOLARES-PANTALLA.md`): nombre,
fechas, lugar, departamento, horas y profesorado con «Organiza» o «Acompaña», por nombre y, si se
sabe, DNI. La importación solo tiene que escribir actividades con esa forma, avisando de las
repetidas (mismo nombre y misma fecha de inicio).

## 5. Otros controles parecidos al de actividades extraescolares (idea 306, 8-oct-2026)

Francisco intuye un sistema general: que un asunto sirva de formulario para apuntar una línea en
una lista de datos, que de ahí salgan documentos y comunicaciones con su plantilla, y que otros
asuntos saquen documentos con los datos de muchas líneas juntas. Eligió empezar solo por las
actividades extraescolares (filas 306, 309, 310 y 311) y diseñar lo general cuando haya un segundo
caso real. **Pidió que, cuando encargue otro control semejante, se le recuerde que ya se empezó
por este.** Lo que hay para reutilizar: el fichero compartido con una línea por actividad, la marca
en el tipo de asunto, la tarjeta propia en la ficha, la tabla de datos calculada para los huecos
`{{TABLA …}}` y la pantalla de consulta en Herramientas.

---

## 6. La mudanza a Google: asuntos vivos, ARCHIVO y datos en una unidad compartida de Drive

**Fecha:** 11-oct-2026. Sale de la idea 332 (`docs/PLAN-DATOS-DEL-GESTOR.md`). **Sin diseñar.**
Espera a dos cosas que no dependen de la aplicación.

**Lo que quiere Francisco.** Tiene entendido que Dropbox no es un sitio permitido por la Junta para
lo que guarda el centro. Mientras el centro use Dropbox no va a mover las carpetas por su cuenta,
pero quiere acabar así:

- **En Dropbox, solo la Bandeja de Entrada.** Es la única carpeta de la aplicación que usa el resto
  del centro, para dejar documentos que hay que trabajar. No se les cambia la costumbre.
- **En una unidad compartida de Drive del centro: los asuntos vivos, el ARCHIVO y los datos del
  Gestor** (`_GESTOR`). Esas carpetas solo las usan Francisco y su compañero.

**Decidido con él:** se va **directo a la unidad compartida**, sin pasar antes por su cuenta
`g.educaand.es`. Hoy los datos no dependen de él (están en el Dropbox del centro); en su cuenta
dependerían de él. En una unidad compartida los ficheros son del centro.

**De qué depende (le toca a Francisco):**

1. Hablar con quien gestiona la unidad compartida del centro (cree que existe).
2. Plantear la mudanza a dirección. Mover los expedientes del centro no es decisión suya.

**La duda legal, que no resuelve la aplicación.** Lo publicado por la Junta describe Google
Workspace para fines educativos; no nombra la gestión administrativa ni los expedientes. En 2026
el Consejo de Transparencia y Protección de Datos de Andalucía sancionó a la Consejería por cómo
usa Google, con mención a los datos sensibles; no prohíbe usarlo. Pasar de Dropbox a Google mejora
la situación, no la cierra: lo deciden dirección y el Delegado de Protección de Datos.

**Lo que se vio al mirar el código (11-oct-2026), para no repetirlo:**

- La aplicación ya trabaja sobre carpetas de Drive que el ordenador enseña como carpetas normales:
  la del Centro de datos y la de la bandeja de correos. Técnicamente se puede.
- Los datos se alcanzan casi siempre por `App.E.gestor`. Solo tres sitios crean o buscan `_GESTOR`
  dentro de la carpeta de asuntos: `js/nucleo.js` (el botón «Entrar» y la lista de nombres de la
  entrada) y `js/perfil.js` (el perfil, antes de entrar). `js/versiones-previas.js` lo nombra para
  saltárselo.
- Los documentos sueltos salen de leer la raíz de la carpeta de asuntos vivos
  (`js/asuntos-lista.js`, `App.E.sueltos`). Unos treinta y cinco ficheros usan `App.E.abiertos`;
  los que mueven un documento suelto a un asunto habría que repasarlos uno a uno
  (`js/documentos-sueltos.js`, `js/documentos-vigilancia.js`, `js/bandeja-guardar.js`,
  `js/repartir-crear.js`, `js/pdf-separar-unir.js`, `js/encargos-llegada.js`, entre otros).
- Las protecciones de «solo consultar», los permisos al entrar, «Entrar sola» y la comprobación
  al entrar cuentan hoy con dos carpetas (asuntos vivos y ARCHIVO). Con cuatro, hay que ponerlas
  al día todas.

**Lo que hay que saber antes de diseñar nada:**

1. **Cómo se porta Drive cuando los dos guardan a la vez.** Con Dropbox queda una «copia en
   conflicto» y la aplicación une las dos (`js/conflictos.js`, que reconoce esos nombres). Si
   Drive se queda solo con la última, se perderían cambios sin aviso. Hay que probarlo con dos
   ordenadores de verdad. Las tablas de la fila 334 ya están hechas para no depender de esto.
2. **Si un ARCHIVO de miles de carpetas se abre rápido** con los ficheros de Drive sin bajar al
   ordenador. Las medidas de la fila 332 darán la referencia de hoy.

**Lo que tendrá que llevar el diseño:**

1. **Cuatro carpetas señaladas por separado** en cada ordenador: Bandeja de Entrada, asuntos
   vivos, ARCHIVO y datos del Gestor. Se propuso el 11-oct-2026 como paso previo y **se sacó de la
   cola al escribir la instrucción**: sin la mudanza no sirve para nada y es peligroso solo. Si un
   ordenador señala una carpeta de datos distinta y el otro no, cada uno trabaja sobre datos
   diferentes y nadie avisa.
2. **Que eso no pueda pasar.** Una carpeta de datos solo se acepta si ya lleva los datos del
   Gestor. La carpeta vieja se queda con una marca («los datos se han mudado a…») y, con esa
   marca, la aplicación no entra y pide señalar la nueva.
3. **La mudanza en sí, hecha por la aplicación**: copiar, comprobar y marcar, con vuelta atrás. Sin
   tareas manuales de Francisco más allá de señalar las carpetas en cada ordenador.
4. **Trabajar desde casa** (punto 2 de esta lista) queda resuelto con la mudanza: el Chromebook
   ya tiene Drive, y sobra la copia de hoy y la contraseña del Dropbox.
5. Qué pasa con la copia sin internet del programa, que hoy vive en el Dropbox.
