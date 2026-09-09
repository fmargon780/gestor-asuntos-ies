/* ============================================================
   duplicados.js — ¿esto no lo hicimos ya?

   Antes de abrir un asunto conviene saber si ese mismo tercero ya
   tuvo otro igual. Aquí se mira, y se mira barato: no se lee el
   ARCHIVO entero, solo la carpeta de ese tercero
   (ARCHIVO / CATEGORÍA / Apellidos, Nombre 1234567) y la lista de
   asuntos abiertos, que ya está en memoria.

   Este fichero hace dos cosas:

   - Deja a mano la consulta, para que la use la ficha del asunto.
   - Pone un aviso en "Nuevo asunto" cuando el tercero y el tipo
     elegidos ya tienen asuntos así. Es solo un aviso: nunca impide
     crear nada, porque dos matrículas del mismo alumno en cursos
     distintos son legítimas.

   Solo funciona cuando se sabe quién es el tercero. En las carpetas
   viejas hechas a mano, muchas veces no se sabe.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* ---------- la consulta ---------- */

  /* La carpeta de ese tercero dentro del ARCHIVO, si existe. */
  async function carpetaDelTercero(categoria, tercero) {
    if (!App.E.archivo || !categoria || !tercero) return null;
    try {
      var cat = await App.E.archivo.getDirectoryHandle(categoria);
      return await cat.getDirectoryHandle(tercero);
    } catch (e) {
      return null;    /* todavía no hay nada archivado de ese tercero */
    }
  }

  function tipoDeNombre(nombre) {
    var leido = Nombres.leer(nombre, App.E.tipos);
    return (leido && leido.tipo) || '';
  }

  /* Todos los asuntos de un tercero: los que están en el ARCHIVO y
     los que siguen abiertos. */
  async function delTercero(categoria, tercero) {
    var salida = { archivados: [], abiertos: [] };
    if (!categoria || !tercero) return salida;

    var carpeta = await carpetaDelTercero(categoria, tercero);
    if (carpeta) {
      var hijas = await Carpetas.subcarpetas(carpeta);
      salida.archivados = hijas.map(function (c) { return c.nombre; });
    }

    /* Entre los abiertos se busca por el nombre del tercero, que va
       al final del nombre de la carpeta. */
    var clave = U.normalizar(tercero);
    if (clave) {
      salida.abiertos = App.E.listaAbiertos.filter(function (a) {
        var suyo = (a.ficha && a.ficha.tercero) || (a.leido && a.leido.resto) || '';
        return U.normalizar(suyo).indexOf(clave) !== -1;
      }).map(function (a) { return a.nombre; });
    }
    return salida;
  }

  function delTipo(nombres, tipo) {
    if (!tipo) return [];
    var t = U.normalizar(tipo);
    return (nombres || []).filter(function (n) {
      return U.normalizar(tipoDeNombre(n)) === t;
    });
  }

  window.Duplicados = {
    delTercero: delTercero,
    delTipo: delTipo,
    tipoDeNombre: tipoDeNombre
  };

  /* ---------- el aviso al crear un asunto ----------

     Se engancha a la vista previa del nombre: cada vez que se repinta
     (al elegir tipo, tercero o fecha) se mira si eso ya existe. Se
     recuerda la última consulta para no leer la carpeta a cada tecla. */

  var caja = null;
  var ultimaConsulta = '';

  function cajaDelAviso() {
    if (caja && caja.parentNode) return caja;
    var previa = document.querySelector('#bloque-detalles .vista-previa');
    if (!previa) return null;
    caja = document.createElement('div');
    caja.id = 'aviso-duplicado';
    caja.className = 'oculto';
    previa.parentNode.insertBefore(caja, previa);
    return caja;
  }

  function esconder(c) {
    c.className = 'oculto';
    c.innerHTML = '';
    ultimaConsulta = '';
  }

  function comoLista(nombres) {
    return '<ul class="lista-repetidos">' + nombres.slice(0, 6).map(function (n) {
      return '<li>' + U.escapar(n) + '</li>';
    }).join('') + '</ul>' +
    (nombres.length > 6 ? '<p class="nota">Y ' + (nombres.length - 6) + ' más.</p>' : '');
  }

  async function mirarSiYaExiste() {
    var c = cajaDelAviso();
    if (!c) return;

    var categoria = App.E.nuevo.categoria;
    var tipo = App.E.nuevo.tipo;
    var persona = App.E.nuevo.tercero;
    if (!categoria || !tipo || !persona) { esconder(c); return; }

    var tercero = App.textoTercero(persona);
    var consulta = categoria + '|' + tercero + '|' + tipo;
    if (consulta === ultimaConsulta) return;
    ultimaConsulta = consulta;

    var todo = await delTercero(categoria, tercero);
    /* Si mientras se leía la carpeta el usuario ha cambiado algo, lo
       que acaba de llegar ya no vale. */
    if (consulta !== ultimaConsulta) return;

    var archivados = delTipo(todo.archivados, tipo);
    var abiertos = delTipo(todo.abiertos, tipo);
    if (!archivados.length && !abiertos.length) {
      c.className = 'oculto';
      c.innerHTML = '';
      return;
    }

    c.className = 'aviso aviso-ambar';
    c.innerHTML = '<strong>Este tercero ya tiene asuntos de tipo ' + U.escapar(tipo) + '.</strong>' +
      (abiertos.length
        ? '<p>Abiertos ahora mismo:</p>' + comoLista(abiertos) : '') +
      (archivados.length
        ? '<p>En el archivo:</p>' + comoLista(archivados) : '') +
      '<p class="nota">Es solo un aviso. Si el asunto nuevo es distinto de verdad ' +
      '(otro curso, otra gestión), créalo sin más.</p>';
  }

  /* Se envuelve la función que repinta la vista previa, para no tener
     que tocar la pantalla de Nuevo asunto. */
  (function () {
    var comoEra = App.refrescarVista;
    App.refrescarVista = function () {
      comoEra();
      try { mirarSiYaExiste(); } catch (e) { /* el aviso nunca estorba */ }
    };
  })();

})();
