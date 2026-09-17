/* ============================================================
   version.js — la fecha y la hora de la última versión publicada.

   Sale en la pantalla de entrada y, ya dentro, abajo a la izquierda
   debajo del nombre. Sirve para saber de un vistazo si se está mirando
   lo último: si la hora no es la del último cambio, o Vercel no ha
   publicado todavía, o el navegador se ha quedado con la página vieja.

   La hora es la de España, la del reloj de Francisco.

   Va en su propio fichero, cargado justo después de js/nucleo.js, para
   que cambiar la versión no obligue a resubir nucleo.js entero: es de
   los ficheros más grandes, y cada subida es una publicación de Vercel
   que hace cola con las demás.
   ============================================================ */
App.VERSION = '17-sep-2026 · 04:23';
