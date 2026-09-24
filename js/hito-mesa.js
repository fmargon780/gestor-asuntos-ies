/* ============================================================
   hito-mesa.js — el hito a pantalla completa: la mesa de trabajo
   (24-sep-2026, fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md).

   Dentro de la tarjeta "Hitos" abierta en grande (fila 107), la lista
   de hitos es compacta: una línea por hito. Pulsar uno abre su mesa,
   que ocupa todo el sitio: la cabecera (camino, título, etiquetas de
   estado, plazo y responsable, "Marcar hito como hecho", menú ⋯ y la
   tira de hitos) y, debajo, las tres columnas que ya pinta
   js/hitos-panel-lista.js en el cuerpo del hito (guion, documentos y
   formularios, consulta).

   No hay pantalla nueva: la mesa es el mismo `.hito` con su
   `.hito-cuerpo` visible y la clase `con-mesa` en `#ficha-guia`, que
   esconde los demás. El hito abierto se recuerda aquí (por asunto), así
   que un repintado no la cierra: js/hitos-panel.js llama a `aplicar`
   después de cada repintado.

   - Escape (js/usabilidad.js, `cerrarSiAbierta`) vuelve a la lista; el
     siguiente, a lo de la fila 107.
   - Desde "Qué me toca" (`HitosPanel.desplegarAlAbrir`) se entra
     directo en la mesa de ese hito.

   Las columnas las rellenan js/hito-mesa-guion.js y
   js/hito-mesa-documentos.js.
   ============================================================ */
var HitoMesa = (function () {

  var abierta = null;   /* { clave, idHito } */
  var ultimo = null;    /* { caja, a, hitos, ajustes, abierto } del último pintado */

  function $(id) { return document.getElementById(id); }

  function hitoPorId(hitos, id) { return window.Hitos ? Hitos.buscar(hitos || [], id) : null; }

  /* ---------- abrir y cerrar ---------- */

  function abrir(a, idHito) {
    abierta = { clave: a.nombre, idHito: idHito };
    if (ultimo && ultimo.a && ultimo.a.nombre === a.nombre) {
      aplicar(ultimo.caja, ultimo.a, ultimo.hitos, ultimo.ajustes, ultimo.abierto);
    }
    if (window.FichaTarjetas && FichaTarjetas.abierta && FichaTarjetas.abierta() !== 'hitos' && FichaTarjetas.abrir) {
      FichaTarjetas.abrir('hitos');
    }
    window.scrollTo(0, 0);
  }

  /* Para "Qué me toca": se abrirá en cuanto se pinte ese asunto. */
  function abrirAlPintar(clave, idHito) { abierta = { clave: clave, idHito: idHito }; }

  function cerrar() {
    abierta = null;
    if (ultimo) aplicar(ultimo.caja, ultimo.a, ultimo.hitos, ultimo.ajustes, ultimo.abierto);
  }

  function estaAbierta() {
    var caja = $('ficha-guia');
    return !!(abierta && caja && caja.classList.contains('con-mesa') && caja.offsetParent);
  }

  function cerrarSiAbierta() {
    if (!estaAbierta()) return false;
    cerrar();
    return true;
  }

  /* ---------- después de cada repintado de los hitos ---------- */

  function aplicar(caja, a, hitos, ajustes, abierto) {
    if (!caja) return;
    ultimo = { caja: caja, a: a, hitos: hitos, ajustes: ajustes, abierto: abierto };
    var fila = null;
    if (abierta && a && abierta.clave === a.nombre) {
      fila = caja.querySelector('.hito[data-id="' + abierta.idHito + '"]');
      if (!fila || !fila.querySelector('.hito-cuerpo')) fila = null;
    }
    Array.prototype.forEach.call(caja.querySelectorAll('.hito'), function (f) {
      var enMesa = f === fila;
      f.classList.toggle('hito-en-mesa', enMesa);
      var cuerpo = f.querySelector(':scope > .hito-cuerpo');
      if (cuerpo) cuerpo.classList.toggle('oculto', !enMesa);
    });
    caja.classList.toggle('con-mesa', !!fila);
    if (!fila) {
      if (window.FichaTarjetas && FichaTarjetas.alCambiarLaMesa) FichaTarjetas.alCambiarLaMesa();
      return;
    }
    var h = hitoPorId(hitos, abierta.idHito);
    pintarCabecera(fila, a, h, hitos, ajustes, abierto);
    if (window.HitoMesaGuion) HitoMesaGuion.pintar(fila, a, h, abierto);
    if (window.HitoMesaDocumentos) HitoMesaDocumentos.enganchar(fila, a, h, hitos, abierto);
    if (window.FichaTarjetas && FichaTarjetas.alCambiarLaMesa) FichaTarjetas.alCambiarLaMesa();
  }

  /* ---------- la cabecera de la mesa ---------- */

  var ESTADOS = [
    { valor: 'pendiente', texto: 'Pendiente' },
    { valor: 'encurso', texto: 'En curso' },
    { valor: 'hecho', texto: 'Hecho' },
    { valor: 'noaplica', texto: 'No aplica' }
  ];

  function textoEstado(e) {
    var x = ESTADOS.filter(function (s) { return s.valor === e; })[0];
    return x ? x.texto : 'Pendiente';
  }

  /* "Vence el 15-oct · quedan N días hábiles", con los no lectivos de
     Ajustes › Hitos; colores de Plazos.de. */
  function textoPlazo(fecha, ajustes) {
    if (!fecha) return { texto: 'Sin plazo', clase: 'mesa-etq-gris' };
    var p = Plazos.de(fecha);
    var habiles = 0;
    if (p && p.dias > 0) {
      var hoy = U.hoyIso();
      var noLectivos = (ajustes && ajustes.noLectivos) || [];
      while (habiles < 400 && Plazos.sumarDiasHabiles(hoy, habiles + 1, noLectivos) <= fecha) habiles++;
    }
    var corto = Plazos.etiquetaVencimiento ? Plazos.etiquetaVencimiento(fecha).texto : Plazos.legible(fecha);
    var texto = p && p.dias > 0
      ? corto.replace(/ · quedan \d+ días?$/, '') + ' · quedan ' + habiles + (habiles === 1 ? ' día hábil' : ' días hábiles')
      : corto;
    var clase = !p ? 'mesa-etq-gris' : (p.clase === 'plazo-vencido' ? 'mesa-etq-rojo' : p.clase === 'plazo-cerca' ? 'mesa-etq-ambar' : 'mesa-etq-verde');
    return { texto: texto, clase: clase };
  }

  function contextoDe(a) {
    var f = a.ficha || {};
    return { tercero: f.tercero || (a.leido && a.leido.resto) || '', relacionados: f.relacionados || [], tutor: null };
  }

  function guardar(control, queNo, hacer) {
    if (window.HitosPanelLista && HitosPanelLista.guardarHito) return HitosPanelLista.guardarHito(control, queNo, hacer);
    return hacer();
  }

  function pintarCabecera(fila, a, h, hitos, ajustes, abierto) {
    var cab = fila.querySelector(':scope > .hito-cuerpo > .mesa-cabecera');
    if (!cab || !h) return;
    var visibles = Hitos.visibles(hitos).filter(function (x) { return x.estado !== 'noaplica' && !x.delTipoAnterior; });
    var n = visibles.indexOf(visibles.filter(function (x) { return x.id === h.id; })[0]) + 1;
    var plazo = textoPlazo(h.fecha, ajustes);
    var resp = h.responsable ? Hitos.resolverResponsable(h.responsable, ajustes, contextoDe(a)) : null;
    var guion = Hitos.guionDe ? Hitos.guionDe(a, h) : [];
    var cuenta = Hitos.cuentaGuion ? Hitos.cuentaGuion(guion) : { hechos: 0, total: 0 };
    var completo = cuenta.total > 0 && cuenta.hechos === cuenta.total && h.estado !== 'hecho';

    cab.innerHTML =
      '<div class="mesa-fila-arriba">' +
        '<button type="button" class="boton mesa-volver">← Volver a la lista de hitos</button>' +
        '<span class="mesa-camino">Asuntos abiertos › ' + U.escapar(a.nombre) + ' › Hito ' + (n || '?') + ' de ' + visibles.length + '</span>' +
      '</div>' +
      '<div class="mesa-titulo-fila">' +
        '<h3 class="mesa-titulo">' + U.escapar(h.titulo || '') + '</h3>' +
        (abierto && h.clase !== 'decision'
          ? '<button type="button" class="boton' + (completo ? ' boton-principal mesa-hecho-resaltado' : '') + ' mesa-marcar-hecho">' +
            (h.estado === 'hecho' ? 'Hecho ✓ (desmarcar)' : 'Marcar hito como hecho') + '</button>' : '') +
        (abierto ? '<button type="button" class="boton mesa-mas" title="Más opciones">⋯</button>' : '') +
      '</div>' +
      '<div class="mesa-etiquetas">' +
        '<button type="button" class="mesa-etq mesa-etq-estado mesa-etq-' + h.estado + '">' + U.escapar(textoEstado(h.estado)) + '</button>' +
        '<button type="button" class="mesa-etq mesa-etq-plazo ' + plazo.clase + '">' + U.escapar(plazo.texto) + '</button>' +
        '<button type="button" class="mesa-etq mesa-etq-resp">' + U.escapar(resp ? resp.texto : 'Sin responsable') + '</button>' +
      '</div>' +
      '<div class="mesa-tira">' + visibles.map(function (x, i) {
        return '<button type="button" class="mesa-tira-hito' + (x.id === h.id ? ' actual' : '') +
          (x.estado === 'hecho' ? ' hecho' : '') + '" data-id="' + U.escapar(x.id) + '" title="' + U.escapar(x.titulo || '') + '">' +
          (x.estado === 'hecho' ? '✓ ' : '') + (i + 1) + '. ' + U.escapar(x.titulo || '') + '</button>';
      }).join('') + '</div>';

    cab.querySelector('.mesa-volver').onclick = cerrar;
    Array.prototype.forEach.call(cab.querySelectorAll('.mesa-tira-hito'), function (b) {
      b.onclick = function () { abrir(a, b.dataset.id); };
    });
    if (!abierto || !window.FichaMenus) return;

    /* "Marcar hito como hecho": la casilla de siempre, pulsada por debajo
       (así sigue avisando de lo obligatorio sin reunir). */
    var marcarBtn = cab.querySelector('.mesa-marcar-hecho');
    if (marcarBtn) marcarBtn.onclick = function () {
      var casilla = fila.querySelector(':scope > .hito-linea .hito-casilla');
      if (casilla) casilla.click();
    };

    FichaMenus.montar(cab.querySelector('.mesa-etq-estado'), ESTADOS.map(function (e) {
      return { texto: e.texto, alPulsar: function () {
        guardar(null, 'cambiar el estado', function () { return Hitos.marcar(a.nombre, h.id, e.valor, ''); });
      } };
    }));
    FichaMenus.montar(cab.querySelector('.mesa-etq-plazo'), [
      { texto: 'Cambiar la fecha…', alPulsar: async function () {
        var ok = await U.preguntar('Fecha límite de este hito',
          '<input type="date" class="campo" id="mesa-fecha-nueva" value="' + U.escapar(h.fecha || '') + '">', 'Guardar');
        if (!ok) return;
        var v = ($('mesa-fecha-nueva') && $('mesa-fecha-nueva').value) || '';
        guardar(null, 'guardar la fecha', function () { return Hitos.guardarCampos(a.nombre, h.id, { fecha: v }); });
      } },
      { texto: 'Quitar la fecha', alPulsar: function () {
        guardar(null, 'quitar la fecha', function () { return Hitos.guardarCampos(a.nombre, h.id, { fecha: '' }); });
      } }
    ]);
    var responsables = ((ajustes && ajustes.responsables) || []).concat(Hitos.PAPELES || []);
    FichaMenus.montar(cab.querySelector('.mesa-etq-resp'), [{ texto: '(sin responsable)', alPulsar: function () {
      guardar(null, 'guardar el responsable', function () { return Hitos.guardarCampos(a.nombre, h.id, { responsable: '' }); });
    } }].concat(responsables.map(function (r) {
      return { texto: r.nombre, alPulsar: function () {
        guardar(null, 'guardar el responsable', function () { return Hitos.guardarCampos(a.nombre, h.id, { responsable: r.id }); });
      } };
    })));
    var mas = cab.querySelector('.mesa-mas');
    if (mas) FichaMenus.montar(mas, [
      { texto: h.soloInformativo ? 'Pedírmelo a mí' : 'Dejarlo solo informativo', alPulsar: function () {
        var b = fila.querySelector('.hito-solo-informativo'); if (b) b.click();
      } },
      { raya: true },
      { texto: 'Quitar este hito', clase: 'ficha-menu-peligro', alPulsar: function () {
        var b = fila.querySelector('.hito-quitar'); if (b) b.click();
      } }
    ]);
  }

  return {
    abrir: abrir, abrirAlPintar: abrirAlPintar, cerrar: cerrar, aplicar: aplicar,
    cerrarSiAbierta: cerrarSiAbierta, estaAbierta: estaAbierta,
    abierta: function () { return abierta; }, textoPlazo: textoPlazo
  };
})();
window.HitoMesa = HitoMesa;
