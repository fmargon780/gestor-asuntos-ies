/* ============================================================
   cuentas-informe.js — «Preparar informe para dirección» (27-sep-2026,
   fila 196, docs/AVISOS-A-QUIEN-LO-PIDE.md, apartado 4).

   Botón en la pantalla Cuentas: abre el cuadro de Correo, sin
   destinatario (lo elige quien lo manda), con el texto calculado al
   momento con lo que Cuentas ya sabe. Texto plano, en párrafos
   cortos, sin tablas. Ningún correo sale sin pulsar "Enviar" —
   js/correo-cuadro.js, como siempre — y sin recordatorio automático:
   solo este botón.

   _GESTOR/informes.json ({ ultimoEnviado: 'AAAA-MM-DD' }), para la
   sección 4 ("cerrados desde el último informe"): se relee antes de
   guardar, y solo se pone al día cuando el correo se ha enviado de
   verdad (CorreoNucleo._interno.envioRealizado), no solo al abrir el
   cuadro.
   ============================================================ */
(function () {

  var FICHERO = 'informes.json';
  var DIAS_POR_DEFECTO = 30;

  function $(id) { return document.getElementById(id); }

  function hoyIso() { return U.hoyIso ? U.hoyIso() : new Date().toISOString().slice(0, 10); }

  function haceDias(n) {
    var d = new Date(Date.now() - n * 86400000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
      '-' + String(d.getDate()).padStart(2, '0');
  }

  async function ultimoEnviado(gestor) {
    if (!gestor) return '';
    try {
      var d = await Carpetas.leerJson(gestor, FICHERO);
      return (d && d.ultimoEnviado) || '';
    } catch (e) { return ''; }
  }

  async function marcarEnviado(gestor) {
    if (!gestor) return;
    await Copias.guardar(gestor, FICHERO, { ultimoEnviado: hoyIso() });
  }

  /* Reservados sin el tercero (apartado 4 del encargo). */
  function nombreParaInforme(a) {
    if (window.Reservados && Reservados.tapar(a)) return '(reservado)';
    return (window.QueMeToca ? QueMeToca.terceroDe(a) : '') || a.nombre;
  }

  /* ---------- las cinco secciones ---------- */

  function seccionPorOrgano(entradas) {
    if (!window.Cuentas || !window.Cuentas._porOrgano) return '';
    var filas = Cuentas._porOrgano(entradas, '', function (tipo) {
      return window.TiposOrgano ? TiposOrgano.deNombre(tipo) : '';
    }).filter(function (f) { return f.abiertos > 0; });
    if (!filas.length) return 'Abiertos por quién lo encarga: ninguno.';
    return 'Abiertos por quién lo encarga:\n' + filas.map(function (f) {
      return '- ' + f.organo + ': ' + f.abiertos;
    }).join('\n');
  }

  function seccionVencidos() {
    var asuntos = window.Gestor ? Gestor.asuntos() : [];
    var lista = [];
    asuntos.forEach(function (a) {
      var p = window.Plazos ? Plazos.de((a.ficha && a.ficha.limite) || '') : null;
      if (!p || p.dias > 0) return;
      var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
      lista.push(tipo + ' · ' + nombreParaInforme(a) + ' · ' +
        (p.dias === 0 ? 'vence hoy' : (-p.dias) + (p.dias === -1 ? ' día de retraso' : ' días de retraso')));
    });
    if (!lista.length) return 'Vencidos: ninguno.';
    return 'Vencidos (' + lista.length + '):\n' + lista.slice(0, 20).map(function (t) { return '- ' + t; }).join('\n');
  }

  async function seccionEsperando() {
    if (!window.QueMeToca) return '';
    var datos = await QueMeToca.reunir();
    var items = QueMeToca.unoPorAsunto(datos.items);
    var g = QueMeToca.clasificar(items, datos.ajustes);
    var largos = (g.otros || []).filter(function (it) { return QueMeToca.diasParado(it.hito) > 15; });
    if (!largos.length) return 'Esperando a otros hace más de 15 días: ninguno.';
    return 'Esperando a otros hace más de 15 días (' + largos.length + '):\n' +
      largos.slice(0, 20).map(function (it) {
        var tipo = (it.asunto.leido && it.asunto.leido.tipo) || (it.asunto.ficha && it.asunto.ficha.tipo) || '';
        return '- ' + tipo + ' · ' + nombreParaInforme(it.asunto) + ' · ' + QueMeToca.diasParado(it.hito) + ' días';
      }).join('\n');
  }

  function seccionCerrados(entradas, desde) {
    var n = entradas.filter(function (e) {
      return !e.abierta && e.cerradoEl && e.cerradoEl >= desde;
    }).length;
    var desdeLegible = (window.U && U.fechaLegible && U.aAaMmDd) ? U.fechaLegible(U.aAaMmDd(desde)) : desde;
    return 'Cerrados desde el ' + desdeLegible + ': ' + n + '.';
  }

  function seccionTiempoMedio(entradas) {
    if (!window.Cuentas || !window.Cuentas._tiempoDeTramite) return '';
    var curso = window.U && U.cursoActual ? U.cursoActual() : '';
    var t = Cuentas._tiempoDeTramite(entradas, curso);
    if (!t.cuantos) return '';
    return 'Tiempo medio de tramitación este curso: ' + t.media + ' días (máximo ' + t.maximo + ' días).';
  }

  /* ---------- montar el texto y abrir el cuadro ---------- */

  async function prepararTexto(desde) {
    var datos = window.Cuentas && Cuentas.cargar ? await Cuentas.cargar() : { entradas: [] };
    var partes = [
      seccionPorOrgano(datos.entradas),
      seccionVencidos(),
      await seccionEsperando(),
      seccionCerrados(datos.entradas, desde),
      seccionTiempoMedio(datos.entradas)
    ].filter(Boolean);
    return partes.join('\n\n');
  }

  async function abrir() {
    if (!window.CorreoNucleo) return;
    var gestor = window.Gestor ? Gestor.carpetaGestor() : null;
    var desde = (await ultimoEnviado(gestor)) || haceDias(DIAS_POR_DEFECTO);
    var texto = await prepararTexto(desde);
    var fecha = (window.U && U.fechaLegible && U.aAaMmDd) ? U.fechaLegible(U.aAaMmDd(hoyIso())) : hoyIso();
    var asuntoFalso = { nombre: 'Informe de asuntos', ficha: {}, leido: {} };

    await CorreoNucleo.abrirCuadro(asuntoFalso, false, {
      asuntoListo: 'Informe de asuntos · ' + fecha,
      medioListo: texto
    });

    /* Solo se pone al día si se ha enviado de verdad: "sin recordatorio
       automático, solo el botón" no debe traducirse en perder de vista
       los cierres de una tanda que se abrió pero no se llegó a enviar. */
    if (CorreoNucleo._interno && CorreoNucleo._interno.envioRealizado) {
      try { await marcarEnviado(gestor); } catch (e) { /* el correo ya ha salido */ }
    }
  }

  function ponerBoton() {
    if ($('btn-informe-direccion')) return;
    var acciones = document.querySelector('#pantalla-cuentas .cabecera .acciones');
    if (!acciones) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'btn-informe-direccion';
    b.className = 'boton';
    b.textContent = 'Preparar informe para dirección';
    b.onclick = function () { abrir(); };
    /* "← Volver" siempre el último de la barra (fila 194). */
    var volver = $('cuentas-volver');
    if (volver) acciones.insertBefore(b, volver); else acciones.appendChild(b);
  }

  ponerBoton();

  window.CuentasInforme = { abrir: abrir, _prepararTexto: prepararTexto };
})();
