/* ============================================================
   puente.js — el puente para los módulos de fuera.

   Los módulos que se cuelgan de la aplicación (los avisos, los asuntos
   que se repiten) no tocan App directamente. Miran y trabajan por
   aquí, y así se pueden añadir módulos nuevos sin volver a abrir los
   ficheros de las pantallas.
   ============================================================ */

window.Gestor = {
  /* Los asuntos abiertos tal y como están ahora en memoria. */
  asuntos: function () { return App.E.listaAbiertos.slice(); },
  tipos: function () { return App.E.tipos.slice(); },
  usuario: function () { return App.E.usuario; },

  /* Deja la lista con los asuntos que cumplan ese filtro de plazo y
     enseña el montón del departamento, que es donde se trabaja. */
  filtrarPorPlazo: function (valor) {
    App.$('filtro-plazo').value = valor;
    App.$('filtro-estado').value = '';
    App.$('buscar-abiertos').value = '';
    App.ir('abiertos');
    App.irVista('departamento');
  },

  /* Las dos carpetas y la de _GESTOR, para que un módulo pueda crear
     carpetas y guardar sus propios ficheros de configuración usando
     Carpetas, igual que hace la aplicación. */
  carpetaAbiertos: function () { return App.E.abiertos; },
  carpetaGestor: function () { return App.E.gestor; },

  /* Apunta o cambia la ficha de un asunto en asuntos.json. */
  anotar: function (nombre, datos) { return App.anotar(nombre, datos); },

  /* Vuelve a leer la carpeta y repinta. Se llama después de crear
     carpetas desde fuera. */
  recargar: function () { return App.verAbiertos(); },

  /* Funciones que se llaman cada vez que se repinta la lista de
     asuntos abiertos. Los módulos se apuntan aquí. */
  alRefrescar: []
};

/* La aplicación llama a esto cada vez que repinta la lista. */
App.avisarALosModulos = function () {
  (window.Gestor.alRefrescar || []).forEach(function (f) {
    try { f(); } catch (e) { /* un módulo roto no puede tumbar la aplicación */ }
  });
};
