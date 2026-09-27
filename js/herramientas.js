/* ============================================================
   herramientas.js — la pantalla "Herramientas" del menú lateral
   (27-sep-2026, fila 200, docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md,
   apartado 7).

   Cuatro cosas de uso diario que no eran ajustes, antes repartidas
   entre Ajustes → Mantenimiento y Ajustes → El centro: Papelera,
   Traer el alumnado, Tablas de datos y Restaurar una copia de
   seguridad. Cada bloque lo sigue pintando su propio módulo, tal cual
   lo hacía dentro de Ajustes (js/papelera-ajustes.js, js/alumnado-
   bd.js + js/traer-datos.js, js/tablas-datos-pantalla.js, js/ajustes-
   mantenimiento.js): aquí solo se llama a los cuatro, en orden,
   cuando se entra en la pantalla (App.ir, js/nucleo.js).
   ============================================================ */

App.pintarHerramientas = async function () {
  if (typeof App.pintarPapelera === 'function') await App.pintarPapelera();
  /* Crea (la primera vez) y pone al día "Traer el alumnado", con el
     botón de "Traer ficheros de Séneca" colgado en el mismo bloque. */
  if (window.AlumnadoBD) await AlumnadoBD.pintarAjustes();
  if (window.TablasDatosPantalla) await TablasDatosPantalla.pintar();
  if (typeof App.pintarCopias === 'function') await App.pintarCopias();
};
