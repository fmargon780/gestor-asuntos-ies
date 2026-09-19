/* ============================================================
   tipos-buscador.js — encontrar el tipo de asunto sin leerlos todos.

   Con veinte o treinta tipos, la parrilla de botones se hace larga y
   hay que leerla entera. Aquí se añaden dos cosas encima de ella:

   - Un buscador: se escriben tres letras y quedan solo los que
     cuadran.
   - Un orden por uso: arriba salen los tipos que más veces habéis
     usado, y de partida solo se enseñan esos. Con "Ver todos" salen
     los demás.

   Las veces que se ha usado cada tipo se sacan del registro de
   asuntos (_GESTOR/asuntos.json), que incluye también los que ya
   están archivados. No se guarda ninguna cuenta aparte.
   ============================================================ */
(function () {

  var CUANTOS_DE_PARTIDA = 10;

  var caja = null;
  var campo = null;
  var botonVerTodos = null;
  var vacio = null;
  var verTodos = false;
  var categoriaAnterior = null;

  function $(id) { return document.getElementById(id); }

  /* Cuántas veces se ha usado cada tipo.

     Se cuentan dos sitios: el registro de asuntos, que incluye los ya
     archivados, y las carpetas que hay ahora mismo abiertas, que es
     lo único que hay de las creadas a mano. Cada carpeta se cuenta
     una sola vez, aunque esté en los dos sitios. */
  function usos() {
    var cuenta = {};
    var yaContado = {};

    function apuntar(nombre, tipo) {
      if (!nombre || yaContado[nombre]) return;
      yaContado[nombre] = true;
      if (!tipo) {
        var leido = Nombres.leer(nombre, App.E.tipos);
        tipo = leido && leido.tipo;
      }
      if (tipo) cuenta[tipo] = (cuenta[tipo] || 0) + 1;
    }

    var asuntos = (App.E.registro && App.E.registro.asuntos) || {};
    Object.keys(asuntos).forEach(function (nombre) {
      apuntar(nombre, (asuntos[nombre] || {}).tipo);
    });
    (App.E.listaAbiertos || []).forEach(function (a) {
      apuntar(a.nombre, (a.ficha && a.ficha.tipo) || (a.leido && a.leido.tipo));
    });
    return cuenta;
  }

  function preparar() {
    var lista = $('tipos-lista');
    if (!lista) return;
    if (caja && caja.parentNode) return;

    caja = document.createElement('div');
    caja.className = 'buscador-tipos';
    caja.innerHTML =
      '<input id="buscar-tipo" type="search" class="campo" ' +
        'placeholder="Buscar tipo: escribe tres letras">' +
      '<button type="button" class="boton" id="btn-ver-tipos"></button>';
    lista.parentNode.insertBefore(caja, lista);

    vacio = document.createElement('div');
    vacio.className = 'nota oculto';
    vacio.id = 'tipos-sin-nada';
    vacio.textContent = 'Ningún tipo de esta categoría se llama así.';
    lista.parentNode.insertBefore(vacio, lista.nextSibling);

    campo = $('buscar-tipo');
    botonVerTodos = $('btn-ver-tipos');

    campo.addEventListener('input', aplicar);
    botonVerTodos.onclick = function () { verTodos = !verTodos; aplicar(); };
  }

  function aplicar() {
    var lista = $('tipos-lista');
    if (!lista || !campo) return;

    var q = U.normalizar(campo.value);
    var cuenta = usos();
    var botones = Array.prototype.slice.call(lista.querySelectorAll('.tipo-boton'));
    if (!botones.length) {
      if (caja) caja.classList.add('oculto');
      return;
    }
    if (caja) caja.classList.remove('oculto');

    /* Primero los más usados; a igualdad de uso, por orden alfabético. */
    botones.sort(function (a, b) {
      var na = a.textContent.trim(), nb = b.textContent.trim();
      var ca = cuenta[na] || 0, cb = cuenta[nb] || 0;
      if (cb !== ca) return cb - ca;
      return na < nb ? -1 : 1;
    });
    botones.forEach(function (b) { lista.appendChild(b); });

    var ensenados = 0;
    botones.forEach(function (b) {
      var texto = U.normalizar(b.textContent);
      var cabe = !q || texto.indexOf(q) !== -1;

      /* Sin buscar nada, solo los más usados, salvo que se pida verlos
         todos. El que ya está elegido no se esconde nunca. */
      if (cabe && !q && !verTodos &&
          ensenados >= CUANTOS_DE_PARTIDA && !b.classList.contains('elegido')) {
        cabe = false;
      }
      if (cabe) ensenados++;
      b.classList.toggle('oculto', !cabe);
    });

    vacio.classList.toggle('oculto', ensenados > 0);

    var sobran = botones.length - CUANTOS_DE_PARTIDA;
    if (q || sobran <= 0) {
      botonVerTodos.classList.add('oculto');
    } else {
      botonVerTodos.classList.remove('oculto');
      botonVerTodos.textContent = verTodos
        ? 'Ver solo los más usados'
        : 'Ver todos (' + botones.length + ')';
    }
  }

  /* Cada vez que la aplicación repinta los tipos se vuelve a ordenar y
     a filtrar. Al cambiar de categoría se limpia lo buscado, que si no
     se queda una lista vacía sin saber por qué. */
  U.envolver(App, 'App.pintarTipos', 'tipos-buscador.js', function (comoEra) {
    return function () {
      comoEra();
      preparar();
      if (App.E.nuevo.categoria !== categoriaAnterior) {
        categoriaAnterior = App.E.nuevo.categoria;
        verTodos = false;
        if (campo) campo.value = '';
      }
      aplicar();
    };
  });

})();
