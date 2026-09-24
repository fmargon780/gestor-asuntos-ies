/* ============================================================
   guias-vista.js — la guía en modo lectura y la de marcar: vista, casillas, cuenta y el cuadro de abrir.

   Sacado tal cual de js/guias.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Lo del modelo (normalizar, limpiar, esPregunta…) se pide a `Guias` (G).
   Se carga justo detrás de js/guias.js.
   ============================================================ */
(function () {
  var G = window.Guias || Guias;

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     ENSEÑAR LA GUÍA
     ========================================================== */

  /* La guía en modo lectura. Sin casillas sirve de recordatorio
     (por ejemplo, al crear el asunto); con casillas, de lista de
     control dentro del asunto. */
  function vista(lista, hechos, conCasillas, elegidas) {
    var pasos = G.normalizar(lista);
    if (!pasos.length) return '';
    var marcados = hechos || [];
    var elegido = elegidas || {};
    return '<ol class="guia-lectura">' + pasos.map(function (p, i) {
      return unPaso(p, i, marcados, elegido, conCasillas);
    }).join('') + '</ol>';
  }

  function unPaso(p, i, marcados, elegidas, conCasillas) {
    var pregunta = G.esPregunta(p);
    var cual = pregunta ? String(elegidas[p.id] || '') : '';
    /* Una pregunta cuenta como hecha en cuanto se elige una opción. */
    var hecho = pregunta ? !!cual : marcados.indexOf(p.id) !== -1;
    var conCuerpo = G.tieneTexto(p.cuerpo);

    var control;
    if (!conCasillas) control = '<span class="paso-numero">' + (i + 1) + '</span>';
    else if (pregunta) control = '<span class="paso-numero paso-marca-pregunta">?</span>';
    else control = '<input type="checkbox" class="paso-casilla" data-paso="' +
                   U.escapar(p.id) + '"' + (hecho ? ' checked' : '') + '>';

    /* Un paso marcado se pliega y se queda solo con su título tachado:
       con cuatro pasos explicados, la guía se comía la pantalla. El
       botoncito de la esquina lo vuelve a abrir para releerlo. Solo
       tiene sentido donde hay casillas, que es dentro de un asunto.
       En una pregunta no se pliega: hay que seguir viendo qué se
       preguntaba. */
    var verlo = (conCasillas && conCuerpo && !pregunta)
      ? '<button type="button" class="paso-ver" ' +
        'title="Ver o esconder la explicación de este paso">ver</button>'
      : '';

    var titulo = '<span class="paso-titulo-texto">' +
                 U.escapar(p.titulo || 'Paso ' + (i + 1)) +
                 (p.soloInformativo ? ' <span class="suave">(informativo)</span>' : '') + '</span>';
    /* La pregunta no lleva <label>: no hay casilla que marcar, y con
       label el clic en el título no haría nada. */
    var cabecera = pregunta
      ? '<div class="paso-linea">' + control + titulo + '</div>'
      : '<label class="paso-linea">' + control + titulo + '</label>';

    var ramas = '';
    if (pregunta) {
      /* Los botones de elegir, y debajo TODAS las ramas ya pintadas.
         Solo se ve la elegida: así elegir es enseñar y esconder, sin
         volver a pintar nada y sin perder lo que ya estuviera marcado
         en la otra rama. */
      ramas =
        '<div class="guia-opciones">' + p.opciones.map(function (o) {
          return '<button type="button" class="guia-opcion' +
                 (o.id === cual ? ' elegida' : '') + '" data-paso="' + U.escapar(p.id) +
                 '" data-opcion="' + U.escapar(o.id) + '">' +
                 U.escapar(o.titulo || 'Opción') + '</button>';
        }).join('') +
        /* El aviso se pinta siempre y se enseña o se esconde: si solo se
           pintara al haber respuesta, no aparecería al responder, que es
           justo cuando hace falta. */
        (conCasillas
          ? '<span class="guia-opcion-nota' + (cual ? '' : ' oculto') +
            '">Vuelve a pulsarla para cambiar la respuesta.</span>'
          : '') +
        '</div>' +
        '<div class="guia-ramas">' + p.opciones.map(function (o) {
          var dentro = o.pasos.length
            ? vista(o.pasos, marcados, conCasillas, elegidas)
            : '<p class="explica">Con elegir esta opción basta: no hay más pasos.</p>';
          return '<div class="guia-rama' + (o.id === cual ? ' rama-activa' : '') +
                 '" data-opcion="' + U.escapar(o.id) + '">' + dentro + '</div>';
        }).join('') + '</div>';
    }

    return '<li class="paso-lectura' + (hecho ? ' paso-hecho' : '') +
           (pregunta ? ' paso-pregunta' : '') + '">' +
           cabecera + verlo +
           (conCuerpo ? '<div class="paso-cuerpo-texto">' + G.limpiar(p.cuerpo) + '</div>' : '') +
           (window.HitosNormativa ? HitosNormativa.listaHTML(p.normativa) : '') +
           (window.Formularios ? Formularios.listaHTML(p.formularios) : '') +
           (window.GuiasDocumentos ? GuiasDocumentos.lineaHTML(p.plantillasDocumento) : '') +
           ramas +
           '</li>';
  }

  /* Quién se entera de que se ha elegido una opción, para guardarlo en
     la ficha del asunto. Solo hay una guía en pantalla a la vez, así
     que con un solo hueco basta; el cuadro de la guía se guarda el
     anterior y lo devuelve al cerrarse. */
  var alElegirOpcion = null;

  function cuandoSeElige(fn) {
    var antes = alElegirOpcion;
    alElegirOpcion = fn || null;
    return antes;
  }

  /* Los enganches de lo que se pulsa dentro de una guía: plegar un paso
     hecho y elegir una opción. Van una sola vez sobre el documento
     entero, y no en cada sitio que pinta una guía: la guía sale en la
     ficha del asunto y en su propio cuadro, y así los dos se comportan
     igual sin repetir código.

     Con `closest` basta: el clic puede caer en el botón o en algo de
     dentro. */
  function engancharLaGuia() {
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('.paso-ver') : null;
      if (!b) return;
      ev.preventDefault();
      var li = b.closest('.paso-lectura');
      if (!li) return;
      b.textContent = li.classList.toggle('paso-abierto') ? 'esconder' : 'ver';
    });

    /* Elegir una opción de una pregunta. Se apaga la otra rama y se
       enciende la elegida, sin volver a pintar nada. Volver a pulsar la
       que ya estaba elegida deja la pregunta sin responder, que es como
       se cambia de idea. */
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('.guia-opcion') : null;
      if (!b) return;
      ev.preventDefault();
      var li = b.closest('.paso-lectura');
      if (!li) return;
      var nueva = b.classList.contains('elegida') ? '' : String(b.dataset.opcion || '');

      Array.prototype.forEach.call(li.querySelectorAll(':scope > .guia-opciones .guia-opcion'),
        function (x) { x.classList.toggle('elegida', !!nueva && x.dataset.opcion === nueva); });
      Array.prototype.forEach.call(li.querySelectorAll(':scope > .guia-ramas > .guia-rama'),
        function (r) { r.classList.toggle('rama-activa', !!nueva && r.dataset.opcion === nueva); });
      li.classList.toggle('paso-hecho', !!nueva);

      var nota = li.querySelector(':scope > .guia-opciones .guia-opcion-nota');
      if (nota) nota.classList.toggle('oculto', !nueva);

      if (alElegirOpcion) alElegirOpcion(String(b.dataset.paso || ''), nueva);
    });

    /* Al desmarcar, el paso se abre solo otra vez: así el botón no se
       queda diciendo "esconder" sobre un paso que ya está abierto. */
    document.addEventListener('change', function (ev) {
      var c = ev.target;
      if (!c || !c.classList || !c.classList.contains('paso-casilla')) return;
      var li = c.closest ? c.closest('.paso-lectura') : null;
      if (!li) return;
      li.classList.remove('paso-abierto');
      var b = li.querySelector('.paso-ver');
      if (b) b.textContent = 'ver';
    });
  }
  engancharLaGuia();

  /* Cuántos pasos hay y cuántos están hechos, contando solo la rama
     elegida de cada pregunta: los pasos de la opción que no se ha
     elegido no se hacen, así que tampoco se cuentan. La pregunta en sí
     cuenta como un paso, hecho en cuanto se responde. */
  function cuenta(lista, hechos, elegidas) {
    var pasos = G.normalizar(lista);
    var marcados = hechos || [];
    var elegido = elegidas || {};
    var total = 0, n = 0;
    pasos.forEach(function (p) {
      total++;
      if (G.esPregunta(p)) {
        var cual = elegido[p.id];
        if (!cual) return;
        n++;
        var rama = p.opciones.filter(function (o) { return o.id === cual; })[0];
        if (!rama) return;
        var c = cuenta(rama.pasos, marcados, elegido);
        total += c.total;
        n += c.hechos;
        return;
      }
      if (marcados.indexOf(p.id) !== -1) n++;
    });
    return { hechos: n, total: total };
  }

  function hechosDe(lista, hechos, elegidas) {
    return cuenta(lista, hechos, elegidas).hechos;
  }

  /* La guía de un asunto, en su propio cuadro y con casillas.
     'alMarcar' recibe la lista completa de pasos marcados cada vez
     que se toca una casilla, para que la guarde quien la abrió. */
  async function abrir(titulo, lista, hechos, alMarcar, elegidas, alElegir) {
    var marcados = (hechos || []).slice();
    var elegido = Object.assign({}, elegidas || {});
    var pasos = G.normalizar(lista);
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-medio');

    var esperar = U.preguntar(titulo,
      '<p class="explica" id="guia-cuenta"></p>' +
      '<div id="guia-cuerpo">' + vista(pasos, marcados, true, elegido) + '</div>',
      'Cerrar', true);

    function contar() {
      var c = cuenta(pasos, marcados, elegido);
      $('guia-cuenta').textContent =
        c.hechos + ' de ' + c.total + ' pasos hechos. ' +
        'Lo que marques aquí lo ve todo el que abra la aplicación.';
    }
    contar();

    Array.prototype.forEach.call(document.querySelectorAll('#guia-cuerpo .paso-casilla'),
      function (c) {
        c.onchange = function () {
          var id = c.dataset.paso;
          var i = marcados.indexOf(id);
          if (c.checked && i === -1) marcados.push(id);
          if (!c.checked && i !== -1) marcados.splice(i, 1);
          c.closest('.paso-lectura').classList.toggle('paso-hecho', c.checked);
          contar();
          if (alMarcar) alMarcar(marcados.slice());
        };
      });

    /* El hueco de las opciones se toma prestado mientras el cuadro está
       abierto y se devuelve al cerrarlo, para no dejar sin él a la
       ficha del asunto que hay debajo. */
    var antes = cuandoSeElige(function (idPaso, idOpcion) {
      if (idOpcion) elegido[idPaso] = idOpcion;
      else delete elegido[idPaso];
      contar();
      if (alElegir) alElegir(Object.assign({}, elegido));
    });

    await esperar;
    cuandoSeElige(antes);
    cuadro.classList.remove('cuadro-medio');
    return marcados;
  }

  Object.assign(G, {
    vista: vista,
    hechosDe: hechosDe,
    cuenta: cuenta,
    cuandoSeElige: cuandoSeElige,
    abrir: abrir
  });
})();
