/* ============================================================
   exportar-ventana.js — el botón «Exportar ▾» de Inicio y su ventana
   (1-oct-2026, fila 241, docs/EXPORTAR-ASUNTOS.md, secciones 2 y 3).

   «Exportar ▾» da dos opciones, «Hoja de cálculo» e «Informe en PDF».
   Las dos abren la misma ventana (un solo cuadro a la vez, U.preguntar):

     - «Incluir también los archivados» (desmarcada): suma a lo que se
       ve los asuntos del ARCHIVO que cumplen los mismos filtros.
     - Las columnas, con una casilla cada una: las del asunto y los
       campos propios de los tipos que salen. La primera vez van las de
       la tabla de Inicio; después, la última elección (por ordenador y
       por separado para la hoja y para el PDF).
     - «Incluir los hitos» (solo el PDF; desmarcada).

   Se exporta lo que se ve (pestaña abierta, los seis filtros y el
   buscador, en el orden de la tabla). La parte de datos está en
   js/exportar-datos.js; la hoja, en js/exportar-hoja.js; el informe, en
   js/exportar-informe.js.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }
  var E = function () { return window.ExportarAsuntos; };

  var TITULOS = { hoja: 'Exportar a hoja de cálculo', pdf: 'Exportar a informe en PDF' };

  function avisoGris(texto) { U.aviso(texto); }

  function tiposDe(lista) {
    var vistos = [];
    lista.forEach(function (a) {
      var t = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
      if (t && vistos.indexOf(t) === -1) vistos.push(t);
    });
    return vistos;
  }

  function casilla(id, texto, marcada, extra) {
    return '<label class="exportar-casilla"><input type="checkbox" data-col="' + U.escapar(id) + '"' +
      (marcada ? ' checked' : '') + (extra || '') + '> ' + U.escapar(texto) + '</label>';
  }

  function marcadasAhora() {
    var salida = {};
    Array.prototype.forEach.call(document.querySelectorAll('#exp-columnas input[data-col]'), function (c) {
      if (c.checked) salida[c.dataset.col] = true;
    });
    return salida;
  }

  /* El bloque de columnas: las del asunto y, aparte, los campos propios. */
  function columnasHtml(marcadas, campos, conArchivados) {
    var del = E().COLUMNAS.map(function (c) {
      var forzada = c.id === 'situacion' && conArchivados;
      return casilla(c.id, c.titulo, forzada || !!marcadas[c.id], forzada ? ' disabled' : '');
    }).join('');
    var propios = campos.length
      ? '<p class="exportar-grupo">Campos propios de los tipos</p><div class="exportar-columnas">' +
        campos.map(function (c) { return casilla(c.id, c.titulo, !!marcadas[c.id]); }).join('') + '</div>'
      : '';
    return '<p class="exportar-grupo">Del asunto</p><div class="exportar-columnas">' + del + '</div>' + propios;
  }

  async function abrirVentana(destino) {
    var datos = E();
    var filtros = datos.filtrosActuales();
    var abiertos = datos.abiertosDeLaVista();
    var tiposAbiertos = tiposDe(abiertos);

    var guardadas = datos.columnasGuardadas(destino);
    var marcadas = {};
    (guardadas || datos.columnasPorDefecto()).forEach(function (id) { marcadas[id] = true; });

    var camposAbiertos = datos.columnasDeCampos([], tiposAbiertos);
    var html =
      '<p class="explica">Se exporta lo que se ve ahora en «' + U.escapar(filtros.pestanaTexto) + '»' +
      (filtros.palabras.length ? ', con ' + U.escapar(filtros.palabras.join(' · ')) : '') + '.</p>' +
      '<label class="exportar-casilla exportar-archivados"><input type="checkbox" id="exp-archivados"> Incluir también los archivados</label>' +
      '<p class="nota exportar-nota oculto" id="exp-nota"></p>' +
      '<div id="exp-columnas">' + columnasHtml(marcadas, camposAbiertos, false) + '</div>' +
      (destino === 'pdf'
        ? '<label class="exportar-casilla"><input type="checkbox" id="exp-hitos"> Incluir los hitos</label>' : '');

    var promesa = U.preguntar(TITULOS[destino], html, 'Exportar');
    var aceptar = $('cuadro-aceptar');
    var entradas = null;            /* los archivados que cumplen (si se piden) */
    var turno = 0;

    function pintarVacio() {
      var marcado = $('exp-archivados') && $('exp-archivados').checked;
      var hay = abiertos.length > 0 || (marcado && entradas && entradas.length > 0);
      var cargando = marcado && entradas === null;
      var nota = $('exp-nota');
      if (aceptar) aceptar.disabled = !hay;
      if (aceptar) aceptar.title = hay ? '' : 'No hay asuntos que exportar con estos filtros';
      if (!nota) return;
      if (cargando) { nota.textContent = 'Mirando los archivados…'; nota.classList.remove('oculto'); }
      else if (!hay) { nota.textContent = 'No hay asuntos que exportar con estos filtros'; nota.classList.remove('oculto'); }
      else nota.classList.add('oculto');
    }

    async function alCambiarArchivados() {
      var marcado = $('exp-archivados').checked;
      var miTurno = ++turno;
      if (!marcado) { entradas = null; repintarColumnas([]); pintarVacio(); return; }
      entradas = null;
      repintarColumnas([]);   /* «Situación» pasa a ir siempre, sin esperar a leer el archivo */
      pintarVacio();
      var lista = [];
      try {
        lista = await datos.entradasDeArchivados(filtros, function (t) { var n = $('exp-nota'); if (n) { n.textContent = t; n.classList.remove('oculto'); } });
      } catch (e) {
        if (miTurno !== turno) return;
        var n = $('exp-nota');
        if (n) { n.textContent = 'No he podido leer los archivados: ' + U.mensajeDeError(e); n.classList.remove('oculto'); }
        $('exp-archivados').checked = false;
        entradas = null;
        repintarColumnas([]);
        return;
      }
      if (miTurno !== turno) return;
      entradas = lista;
      repintarColumnas(tiposDeEntradas(lista));
      pintarVacio();
    }

    function tiposDeEntradas(lista) {
      var vistos = [];
      lista.forEach(function (e) { if (e.tipo && vistos.indexOf(e.tipo) === -1) vistos.push(e.tipo); });
      return vistos;
    }

    function repintarColumnas(tiposExtra) {
      var ahora = marcadasAhora();
      var conArchivados = $('exp-archivados') && $('exp-archivados').checked;
      var todos = tiposAbiertos.concat(tiposExtra.filter(function (t) { return tiposAbiertos.indexOf(t) === -1; }));
      var campos = datos.columnasDeCampos([], todos);
      var caja = $('exp-columnas');
      if (caja) caja.innerHTML = columnasHtml(ahora, campos, conArchivados);
    }

    if ($('exp-archivados')) $('exp-archivados').onchange = alCambiarArchivados;
    pintarVacio();

    var ok = await promesa;
    if (aceptar) { aceptar.disabled = false; aceptar.title = ''; }
    if (!ok) { turno++; return; }

    var conArchivados = $('exp-archivados') && $('exp-archivados').checked;
    var conHitos = !!($('exp-hitos') && $('exp-hitos').checked);
    var elegidas = marcadasAhora();
    if (conArchivados) elegidas.situacion = true;
    var ids = Object.keys(elegidas);
    var guardables = ids.filter(function (id) { return id !== 'situacion' || !conArchivados; });
    datos.guardarColumnas(destino, guardables);
    var entradasFinal = entradas;
    turno++;
    await exportar(destino, { filtros: filtros, abiertos: abiertos, conArchivados: conArchivados, conHitos: conHitos,
                              ids: ids, entradas: entradasFinal, tiposAbiertos: tiposAbiertos });
  }

  async function exportar(destino, o) {
    var datos = E();
    try {
      U.aviso('Preparando la exportación…');
      var camposTodos = datos.columnasDeCampos([], o.tiposAbiertos.concat(
        (o.entradas || []).map(function (e) { return e.tipo; }).filter(function (t, i, l) { return t && l.indexOf(t) === i && o.tiposAbiertos.indexOf(t) === -1; })));
      var columnas = datos.COLUMNAS.concat(camposTodos).filter(function (c) { return o.ids.indexOf(c.id) !== -1; });

      var registros = await datos.registrosDeAbiertos(o.abiertos, { conDocumentos: o.ids.indexOf('nDocumentos') !== -1 });
      if (o.conArchivados) {
        var entradas = o.entradas;
        if (entradas === null) entradas = await datos.entradasDeArchivados(o.filtros, function (t) { U.aviso(t); });
        var lista = datos.ordenarArchivados(entradas);
        if (lista.length) U.aviso('Leyendo los archivados (' + lista.length + ')…');
        var archivados = await datos.registrosDeArchivados(lista, { conHitos: destino === 'hoja' || o.conHitos });
        registros = registros.concat(archivados);
      }
      /* Con campos propios de los archivados que salen solo al leerlos. */
      var nombresVistos = {};
      camposTodos.forEach(function (c) { nombresVistos[c.nombreCampo] = true; });
      var extra = datos.columnasDeCampos(registros, []).filter(function (c) { return !nombresVistos[c.nombreCampo] && o.ids.indexOf(c.id) !== -1; });
      columnas = columnas.concat(extra);

      if (!registros.length) { avisoGris('No hay asuntos que exportar con estos filtros'); return; }

      var tabla = datos.tabla(registros, columnas);
      if (destino === 'hoja') {
        var blob = await ExportarHoja.deAsuntos(tabla, datos.filasDeHitos(registros));
        var nombre = ExportarHoja.nombreDeFichero(o.filtros.tipo && o.filtros.tipo !== App.SIN_TIPO ? o.filtros.tipo : '');
        ExportarHoja.descargar(blob, nombre);
        U.aviso('Hoja de cálculo descargada: ' + nombre, 'bueno');
      } else {
        await ExportarInforme.abrir({
          tabla: tabla, registros: registros, filtros: o.filtros, conHitos: o.conHitos,
          incluyeArchivados: o.conArchivados, por: (App.E && App.E.usuario) || ''
        });
      }
    } catch (e) {
      U.fallo('No he podido exportar', e);
    }
  }

  /* ---------- el botón y su menú ---------- */

  function engancharMenu() {
    var boton = $('btn-exportar'), menu = $('exportar-menu');
    if (!boton || !menu) return;

    function cerrarMenu() {
      menu.classList.add('oculto');
      boton.setAttribute('aria-expanded', 'false');
      document.removeEventListener('mousedown', alPulsarFuera, true);
      document.removeEventListener('keydown', alPulsarTecla, true);
    }
    function alPulsarFuera(ev) { if (!$('exportar-envoltorio').contains(ev.target)) cerrarMenu(); }
    function alPulsarTecla(ev) { if (ev.key === 'Escape') { ev.stopPropagation(); cerrarMenu(); } }

    boton.onclick = function (ev) {
      ev.stopPropagation();
      if (!menu.classList.contains('oculto')) { cerrarMenu(); return; }
      menu.classList.remove('oculto');
      boton.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', alPulsarFuera, true);
      document.addEventListener('keydown', alPulsarTecla, true);
    };
    $('btn-exportar-hoja').onclick = function () { cerrarMenu(); abrirVentana('hoja'); };
    $('btn-exportar-pdf').onclick = function () { cerrarMenu(); abrirVentana('pdf'); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', engancharMenu);
  else engancharMenu();

  window.ExportarVentana = { abrir: abrirVentana };

})();
