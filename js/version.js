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

   OJO al escribir esta línea: coge la hora de verdad, nunca a ojo ni
   sumando algo al valor de antes (17-sep-2026, aviso de Francisco: las
   versiones estaban saliendo con horas por delante de la real). Antes
   de cambiarla, en la terminal:

       TZ='Europe/Madrid' date '+%d %m %Y %H:%M' | { read d m y hm; \
         meses=(ene feb mar abr may jun jul ago sep oct nov dic); \
         echo "$d-${meses[$((10#$m-1))]}-$y · $hm"; }
   ============================================================ */
App.VERSION = '24-sep-2026 · 13:14';
