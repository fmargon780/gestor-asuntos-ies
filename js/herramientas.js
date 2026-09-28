/* ============================================================
   herramientas.js — la pestaña "Herramientas" (fila 200, apartado 7,
   docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md).

   El marco no tiene nada propio: los cuatro bloques (Papelera, Traer
   el alumnado, Tablas de datos, Restaurar una copia de seguridad) los
   pintan sus propios módulos de siempre (js/papelera-ajustes.js,
   js/traer-datos.js + js/alumnado-bd.js, js/tablas-datos-pantalla.js,
   js/ajustes-mantenimiento.js), tal cual lo hacían dentro de
   Ajustes → Mantenimiento; aquí solo se los llama cada vez que se
   entra en la pantalla, igual que hacía App.pintarAjustesMantenimiento
   con ellos. Se llama desde App.ir (js/nucleo.js). */

App.pintarHerramientas = async function () {
  if (typeof App.pintarPapelera === 'function') await App.pintarPapelera();
  if (typeof App.pintarCopias === 'function') await App.pintarCopias();
  if (window.TablasDatosPantalla) await TablasDatosPantalla.pintar();
  if (window.AlumnadoBD) await AlumnadoBD.pintarAjustes();
};
