/* ============================================================
   plantillas-documento-elegir.js — elegir entre varias plantillas de documento
   (fila 530: trozo de js/plantillas-documento.js, que se pasaba de 400
   líneas; mismo código, solo cambia de fichero). Se carga justo antes de
   js/plantillas-documento.js, que lo llama (`PlantillasDocumentoElegir.elegir`).
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }
  /* ==========================================================
     ELEGIR ENTRE VARIAS PLANTILLAS

     Como Relacionados.elegirTercero: se pinta dentro del cuadro
     compartido (#capa), sin usar U.preguntar, porque aquí la elección
     se hace pulsando una de la lista, no un botón de "Aceptar". Solo
     un cuadro de diálogo a la vez en toda la aplicación.
     ========================================================== */

  /* `lista` puede ser un array (lo de siempre) o, desde un hito (fila
     102), `{ delPaso: [...], delTipo: [...] }`: dos grupos con rótulo,
     y una plantilla que esté en los dos sale solo en "De este paso". */
  function elegirPlantilla(lista) {
    var grupos = Array.isArray(lista) ? [{ rotulo: '', lista: lista }] : (function () {
      var delPaso = lista.delPaso || [];
      var ids = {};
      delPaso.forEach(function (p) { ids[p.id] = true; });
      var delTipo = (lista.delTipo || []).filter(function (p) { return !ids[p.id]; });
      return [{ rotulo: 'De este paso', lista: delPaso }, { rotulo: 'Otras de este tipo de asunto', lista: delTipo }]
        .filter(function (g) { return g.lista.length; });
    })();
    return new Promise(function (resolver) {
      var resuelto = false;
      function resolverUnaVez(v) { if (resuelto) return; resuelto = true; resolver(v); }

      var capa = $('capa');
      $('cuadro-titulo').textContent = 'Elegir plantilla de documento';
      var cuerpo = $('cuadro-cuerpo');
      var hay = grupos.some(function (g) { return g.lista.length; });
      cuerpo.innerHTML = '<p class="explica">' + (hay ? 'Elige con cuál generar.' : 'Este hito no tiene plantillas: búscala entre todas las del centro.') + '</p>' +
        '<div id="pd-elegir-lista"></div>';
      $('cuadro-aceptar').classList.add('oculto');
      capa.classList.remove('oculto');

      function cerrar() {
        capa.classList.add('oculto');
        $('cuadro-aceptar').classList.remove('oculto');
        $('cuadro-cancelar').onclick = null;
      }
      $('cuadro-cancelar').onclick = function () { cerrar(); resolverUnaVez(null); };

      grupos.forEach(function (g) {
        if (g.rotulo) {
          var r = document.createElement('div');
          r.className = 'etiqueta pd-elegir-rotulo';
          r.textContent = g.rotulo;
          $('pd-elegir-lista').appendChild(r);
        }
        g.lista.forEach(function (p) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'boton pd-elegir-opcion';
          b.textContent = p.nombre;
          b.onclick = function () { cerrar(); resolverUnaVez(p); };
          $('pd-elegir-lista').appendChild(b);
        });
      });

      /* «Buscar otra plantilla…» (fila 126, js/plantilla-buscar.js), en el mismo cuadro. */
      if (!Array.isArray(lista) && lista.buscar && window.PlantillaBuscar) {
        var caja = document.createElement('div');
        caja.className = 'pd-buscar-caja';
        var enlace = document.createElement('button');
        enlace.type = 'button';
        enlace.className = 'enlace pd-buscar-otra';
        enlace.textContent = 'Buscar otra plantilla…';
        function abrirBuscador() {
          enlace.classList.add('oculto');
          PlantillaBuscar.montar(caja, function (p) { cerrar(); resolverUnaVez(p); });
        }
        enlace.onclick = abrirBuscador;
        $('pd-elegir-lista').appendChild(enlace);
        $('pd-elegir-lista').appendChild(caja);
        if (!hay) abrirBuscador();
      }
    });
  }

  window.PlantillasDocumentoElegir = { elegir: elegirPlantilla };
})();
