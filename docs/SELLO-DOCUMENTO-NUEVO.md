# Un papel con sello que es un documento nuevo (fila 233)

Diseñado con Francisco el 1-oct-2026 (aviso de soporte del 30-sep-2026, pantalla «Ficha de un
asunto»; conversación https://claude.ai/code/session_01R9XC868KMwhzLd5Sq5ePjw). Lee antes
`docs/CONTEXTO.md` y `docs/contexto/DOCUMENTOS.md` (apartados «Registrar un documento en un paso»
y el del sello detectado) y `docs/contexto/NOMBRES-FIJOS.md`.

## El problema

Cuando en la carpeta de un asunto hay un PDF con el sello de registro de Séneca y sin el nombre de
la aplicación, la ficha enseña arriba el aviso ámbar «Este papel trae el sello de registro 26SM0657
(SALIDA, 30/09/2026). ¿De qué documento es el registro?» (`js/ficha-sellos.js`, máquina en
`js/registro-sellado.js`). Solo hay dos respuestas: elegir un documento anterior de la carpeta
(«Elige un documento…») o «No es un registro».

Falta el caso más corriente: el papel registrado **es un documento nuevo**, que no tiene ningún
documento anterior en la carpeta (por ejemplo, el certificado firmado por el director, registrado
de salida en Séneca y descargado a la carpeta; o un escrito que llega con registro de entrada).
Hoy no hay forma de anotarlo y nombrarlo desde ese aviso.

## Lo que hay que hacer

1. En el aviso ámbar de cada papel sellado, junto al desplegable «Elige un documento…» y al botón
   «No es un registro», un tercer botón: **«Es un documento nuevo»**. Va el primero de los tres
   botones si la carpeta no tiene ningún documento con nombre de la aplicación (en ese caso el
   desplegable no sirve de nada y se puede ocultar).
2. Al pulsarlo se abre **el mismo cuadro de poner nombre** que usa «Poner nombre» de la lista de
   documentos (`App.verDocumentos(a, { ponerNombre })` o lo que use hoy esa fila), sobre ese PDF,
   con lo ya leído del sello puesto: «Está registrado en Séneca» marcado, las cuatro piezas del
   registro (año, E/S, M/A, número) y la fecha del registro. No se vuelve a leer el PDF si el
   sello ya está en la memoria de `RegistroSellado`.
3. El tipo de documento sale **propuesto** como en el resto de la aplicación (memoria de tipos,
   texto por defecto del hito o del tipo de documento, fila 201), cambiable.
4. El documento queda **asociado al hito en curso** del asunto (el primero sin terminar), igual
   que si se hubiera añadido desde la mesa de ese hito; se puede cambiar en el propio cuadro si ya
   permite elegir hito, y si no, con «Asociar a un hito» después.
5. El nombre sigue la regla de la fila 239: `AAMMDD TIPO D26-01234.pdf`, con número de documento
   nuevo; el registro **no** va en el nombre: se guarda en la ficha del documento
   (`DocumentosDatos`), como hoy al nombrar un documento registrado, y se encuentra con el
   buscador. Nota en el asunto como hoy al registrar («Registrado 26SM0657 · <documento>»,
   `Notas.sustituir`), y en el registro del asunto (fila 229) si ya lo anota solo.
6. Al guardar, el PDF deja de salir en el aviso (ya tiene nombre de la aplicación). Si se cierra
   el cuadro sin guardar, el aviso sigue igual.
7. **Tarea del hito marcada sola.** Si el hito al que queda asociado tiene una tarea sin marcar de
   registro o de descarga del documento registrado (por ejemplo «Descargar el documento registrado
   a la carpeta del asunto y anotar registro»), se marca hecha, con el mismo mecanismo con el que
   hoy se marcan solas las tareas al «Registrar» o al «Añadir documento» (`docs/contexto/HITO-MESA.md`).
   Si no hay ninguna que encaje, no se marca nada.
8. Lo mismo en la mesa del hito si ahí también sale el aviso del sello.
9. Datos de demostración: un asunto con un PDF sellado suelto y sin documento anterior, para que el
   revisor pueda probarlo.

Textos de pantalla con `docs/VOCABULARIO.md`. No se toca lo que hacen hoy «Elige un documento…» ni
«No es un registro».

## Cómo sabemos que está bien

1. En un asunto con un PDF sellado suelto, el aviso ámbar enseña tres salidas, entre ellas «Es un
   documento nuevo».
2. Si la carpeta no tiene ningún documento con nombre de la aplicación, «Es un documento nuevo» va
   el primero y no sale un desplegable vacío.
3. Al pulsarlo se abre el cuadro de poner nombre con el registro (cuatro piezas) y su fecha ya
   puestos, y un tipo de documento propuesto.
4. Al guardar, el fichero queda como `AAMMDD TIPO D26-xxxxx.pdf`, el registro aparece en la ficha
   del documento y el buscador lo encuentra por el código de registro.
5. El documento queda asociado al hito en curso y sale en «Documentos del hito» de su mesa.
6. La tarea de registro/descarga de ese hito queda marcada; un hito sin esa tarea no cambia.
7. El aviso desaparece tras guardar; cerrar el cuadro sin guardar lo deja como estaba.
8. «Elige un documento…» y «No es un registro» siguen funcionando igual (`pruebas/registro-sellado.mjs`
   en verde).
9. Prueba nueva `pruebas/sello-documento-nuevo.mjs` con los puntos 1 a 7, y `npm test` completo en verde.
