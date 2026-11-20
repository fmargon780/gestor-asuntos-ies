/* ============================================================
   aula-aviso-pantalla.js — «Crear varios desde una lista» en «Nuevo asunto», solo con el tipo
   «EXPULSIÓN AULA CONVICENCIA» (20-nov-2026, fila 724, docs/724-CREAR-VARIOS-DESDE-EL-AVISO.md).

   Se pega el aviso de la intranet; una fila por alumno con lo que se ha entendido (alumno, grupo,
   primer día y días). Lo que no se entiende, o no cuadra, sale en amarillo, sin marcar, y se corrige
   ahí mismo. «Crear» hace un asunto por fila marcada por el MISMO camino que «Nuevo asunto»
   (App.nuevoAsuntoCon y App.crearAsuntoDelFormulario), uno detrás de otro. No se crea nada sin pulsar.
   Lee el aviso js/aula-aviso-leer.js.
   ============================================================ */
var AulaAvisoPantalla = (function () {

  var TIPO = { nombre: 'EXPULSIÓN AULA CONVICENCIA', alias: ['EXPULSIÓN CASA'] };
  var sitio = null, panel = null, filas = [], ajustes = {}, lista = [], anioManual = 0, trabajando = false;

  function tipoAula() { return window.AulaConvivencia ? AulaConvivencia.buscarTipo(TIPO) : null; }
  function n(t) { return U.normalizar(String(t || '')).replace(/[,;.]/g, ' ').split(' ').filter(Boolean).sort().join(' '); }
  function enLetra(f) { return AulaAviso.enLetra(f); }

  /* ---------- reconocer ---------- */

  function indice(personas) {
    var ix = {};
    personas.forEach(function (p) {
      [p.nombre, p.nombreNatural].forEach(function (t) {
        var k = n(t);
        if (!k) return;
        (ix[k] = ix[k] || []);
        if (ix[k].indexOf(p) === -1) ix[k].push(p);
      });
    });
    return ix;
  }

  /* ¿Ya hay un asunto abierto de este tipo, de esta persona, con ese primer día? */
  function yaExiste(persona, desde, campoId) {
    var tipo = tipoAula(), texto = App.textoTercero(persona);
    var clave = Campos.claveDeCampo({ origen: 'propio', id: campoId });
    return (App.E.listaAbiertos || []).some(function (a) {
      var f = a.ficha || {};
      return f.tipo === tipo.tipo && f.tercero === texto && f.campos && f.campos[clave] && f.campos[clave].valor === desde;
    });
  }

  /* Pone al día lo que depende de la persona y de las fechas (los avisos «duros» no se tocan). */
  function evaluar(f) {
    f.avisos = f.avisos.filter(function (a) { return a.tipo !== 'grupo'; });
    if (f.persona && f.grupo && !f.grupoOk && AulaAviso.claveGrupo(f.persona.unidad || '') !== AulaAviso.claveGrupo(f.grupo)) {
      f.avisos.push({ tipo: 'grupo', texto: 'El grupo del aviso es «' + f.grupo + '» y el del alumno es «' + (f.persona.unidad || 'sin grupo') + '».',
        opciones: [{ texto: 'Es este alumno, seguir', aceptar: true }] });
    }
    f.ya = !!(f.persona && f.desde && yaExiste(f.persona, f.desde, f.campoId));
    var valido = !!(f.persona && f.desde && /^[1-9]\d*$/.test(String(f.dias)));
    f.listo = valido && !f.avisos.length && !f.ya;
    if (!f.listo) f.marcada = false;
  }

  function fila(l, ix, anio) {
    var f = { linea: l.linea, texto: l.apellidos ? l.apellidos + ', ' + l.nombre : l.linea, grupo: l.grupo, persona: null, candidatas: [],
              desde: l.desde, dias: l.dias || '', avisos: [], marcada: false, ya: false, listo: false, campoId: '' };
    if (!l.entendida) {
      f.avisos.push({ tipo: l.apellidos && !anio ? 'anio' : 'linea', opciones: [],
        texto: l.apellidos && !anio ? 'Falta el año: no encuentro la línea «Enviado el …» del aviso. Escríbelo abajo.' : 'No entiendo esta línea. Escribe el alumno, el primer día y los días.' });
    }
    var hallados = l.apellidos ? (ix[n(l.apellidos + ' ' + l.nombre)] || []) : [];
    var delGrupo = hallados.filter(function (p) { return AulaAviso.claveGrupo(p.unidad || '') === AulaAviso.claveGrupo(l.grupo); });
    var unicos = hallados.length === 1 ? hallados : (delGrupo.length === 1 ? delGrupo : []);
    if (unicos.length) f.persona = unicos[0];
    else if (hallados.length) { f.candidatas = hallados; f.avisos.push({ tipo: 'alumno', texto: 'Hay varios alumnos con este nombre: elige cuál es.', opciones: [] }); }
    else if (l.apellidos) f.avisos.push({ tipo: 'alumno', texto: 'No encuentro a este alumno entre el alumnado. Búscalo abajo.', opciones: [] });
    if (l.entendida) f.avisos = f.avisos.concat(AulaAviso.revisar(l, ajustes));
    return f;
  }

  async function reconocer() {
    var caja = panel.querySelector('#aa-resultado');
    var texto = panel.querySelector('#aa-texto').value;
    if (!texto.trim()) { caja.innerHTML = '<div class="explica">Pega primero el aviso de la intranet.</div>'; return; }
    caja.innerHTML = '<div class="explica">Leyendo…</div>';
    try { lista = (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista || []; } catch (e) { lista = []; }
    try { ajustes = ((await Hitos.leer()) || {}).ajustes || {}; } catch (e2) { ajustes = {}; }
    var campos = await Campos.leer(App.E.gestor);
    var propio = (campos.propios || []).filter(function (p) { return U.normalizar(p.nombre) === 'primer dia'; })[0];
    var leido = AulaAviso.leer(anioManual && !/enviado\s+el/i.test(texto) ? texto + '\nEnviado el 01/01/' + anioManual : texto);
    var ix = indice(lista);
    filas = leido.lineas.map(function (l) { var f = fila(l, ix, leido.anio); f.campoId = propio ? propio.id : ''; return f; });
    filas.forEach(function (f) { evaluar(f); f.marcada = f.listo; });
    pintar();
  }

  /* ---------- pintar ---------- */

  function e(t) { return U.escapar(String(t)); }

  function htmlFila(f, i) {
    var clase = 'aa-fila' + (f.ya ? ' aa-gris' : (f.listo ? '' : ' aa-amarilla'));
    var h = '<div class="' + clase + '" data-i="' + i + '"><div class="aa-cabecera">' +
      '<label class="aa-quien"><input type="checkbox" class="aa-marca"' + (f.marcada ? ' checked' : '') + (f.listo ? '' : ' disabled') + '> ' +
      '<strong>' + e(f.persona ? f.persona.nombre : f.texto) + '</strong> <small>' + e(f.grupo || '') + '</small></label>' +
      (f.ya ? '<span class="aa-ya">Ya existe</span>' : '') + '</div>' +
      '<div class="aa-datos"><label>Primer día <input type="date" class="campo aa-desde" value="' + e(f.desde) + '"></label>' +
      '<label>Días lectivos <input class="campo aa-dias" inputmode="numeric" size="3" value="' + e(f.dias) + '"></label></div>';
    f.avisos.forEach(function (a, k) {
      h += '<div class="aa-aviso"><span>' + e(a.texto) + '</span>';
      (a.opciones || []).forEach(function (o, j) { h += ' <button type="button" class="boton aa-opcion" data-k="' + k + '" data-j="' + j + '">' + e(o.texto) + '</button>'; });
      if (a.tipo === 'anio') h += ' <input class="campo aa-anio" size="5" inputmode="numeric" placeholder="2026">';
      h += '</div>';
    });
    if (!f.persona) {
      h += '<div class="aa-buscar"><input class="campo aa-buscar-texto" placeholder="Buscar al alumno por su nombre">' +
        '<select class="campo aa-candidatos">' + (f.candidatas.length ? '<option value="">Elige…</option>' + f.candidatas.map(function (p, k) {
          return '<option value="' + k + '">' + e(p.nombre + (p.unidad ? ' · ' + p.unidad : '')) + '</option>';
        }).join('') : '<option value="">—</option>') + '</select></div>';
    }
    return h + '</div>';
  }

  function pintar() {
    var caja = panel.querySelector('#aa-resultado');
    if (!filas.length) { caja.innerHTML = '<div class="explica">No he encontrado ningún alumno en el texto.</div>'; return; }
    var marcadas = filas.filter(function (f) { return f.marcada; }).length;
    caja.innerHTML = filas.map(htmlFila).join('') +
      '<div class="lp-pie"><button type="button" class="boton boton-principal" id="aa-crear"' + (marcadas ? '' : ' disabled') + '>' +
      (marcadas === 1 ? 'Crear 1 asunto' : 'Crear ' + marcadas + ' asuntos') + '</button></div>';
    Array.prototype.forEach.call(caja.querySelectorAll('.aa-fila'), function (el) { enganchar(el, filas[+el.dataset.i]); });
    caja.querySelector('#aa-crear').onclick = function () { return U.mientrasGuarda(caja.querySelector('#aa-crear'), crear); };
  }

  function elegirPersona(f, p) {
    f.persona = p; f.candidatas = [];
    f.avisos = f.avisos.filter(function (a) { return a.tipo !== 'alumno'; });
    evaluar(f); f.marcada = f.listo; pintar();
  }

  function enganchar(el, f) {
    el.querySelector('.aa-marca').onchange = function (ev) { f.marcada = ev.target.checked; pintar(); };
    /* Corregir a mano un dato borra los avisos de fechas: quien lo corrige decide. */
    function corregido() {
      f.avisos = f.avisos.filter(function (a) { return ['semana', 'dias', 'linea', 'anio'].indexOf(a.tipo) === -1; });
      evaluar(f); f.marcada = f.listo; pintar();
    }
    el.querySelector('.aa-desde').onchange = function (ev) { f.desde = ev.target.value; corregido(); };
    el.querySelector('.aa-dias').onchange = function (ev) { f.dias = ev.target.value.trim(); corregido(); };
    Array.prototype.forEach.call(el.querySelectorAll('.aa-opcion'), function (b) {
      b.onclick = function () {
        var o = f.avisos[+b.dataset.k].opciones[+b.dataset.j];
        if (o.aceptar) { f.grupoOk = true; evaluar(f); f.marcada = f.listo; pintar(); return; }
        f.desde = o.desde; f.dias = o.dias; corregido();
      };
    });
    var anio = el.querySelector('.aa-anio');
    if (anio) anio.onchange = function () { if (/^\d{4}$/.test(anio.value.trim())) { anioManual = +anio.value.trim(); reconocer(); } };
    var cand = el.querySelector('.aa-candidatos'), buscar = el.querySelector('.aa-buscar-texto');
    if (cand) cand.onchange = function () { if (cand.value !== '' && f.candidatas[+cand.value]) elegirPersona(f, f.candidatas[+cand.value]); };
    if (buscar) buscar.oninput = function () {
      var t = U.normalizar(buscar.value);
      f.candidatas = t.length < 2 ? [] : Datos.buscar(lista, buscar.value, 8);
      cand.innerHTML = '<option value="">' + (f.candidatas.length ? 'Elige…' : '—') + '</option>' + f.candidatas.map(function (p, k) {
        return '<option value="' + k + '">' + e(p.nombre + (p.unidad ? ' · ' + p.unidad : '')) + '</option>';
      }).join('');
    };
  }

  /* ---------- crear ---------- */

  function esperarCampos() {
    return new Promise(function (ok) {
      var t0 = Date.now();
      (function mirar() {
        var items = App.E.nuevo.configCampos || [];
        var pd = items.filter(function (x) { return U.normalizar(x.nombre) === 'primer dia'; })[0];
        var dl = items.filter(function (x) { return U.normalizar(x.nombre) === 'dias lectivos'; })[0];
        if ((pd && dl) || Date.now() - t0 > 3000) return ok(pd && dl ? { pd: pd, dl: dl } : null);
        setTimeout(mirar, 40);
      })();
    });
  }

  async function crear() {
    var tipo = tipoAula(), hechos = [], fallos = [];
    if (!tipo) return;
    trabajando = true;
    try {
      var marcadas = filas.filter(function (f) { return f.marcada && f.listo; });
      for (var i = 0; i < marcadas.length; i++) {
        var f = marcadas[i], antes = Object.keys(App.E.registro.asuntos || {}).length;
        App.nuevoAsuntoCon({ tipo: tipo.tipo, tercero: f.persona });
        var c = await esperarCampos();
        if (!c) { fallos.push(f.persona.nombre + ' (el tipo aún no pide «Primer día» y «Días lectivos»)'); break; }
        c.pd.entradaEl.value = f.desde;
        c.dl.entradaEl.value = String(f.dias);
        try { await App.crearAsuntoDelFormulario(); } catch (err) { fallos.push(f.persona.nombre + ' (' + U.mensajeDeError(err) + ')'); continue; }
        if (Object.keys(App.E.registro.asuntos || {}).length > antes) hechos.push(f); else fallos.push(f.persona.nombre);
      }
    } finally { trabajando = false; }
    if (hechos.length) { cerrar(); try { App.ir('abiertos'); } catch (e1) { /* la lista ya está */ } }
    if (hechos.length) U.aviso(hechos.length === 1 ? 'Asunto creado.' : 'Asuntos creados: ' + hechos.length + '.', 'bueno');
    if (fallos.length) U.aviso('No he podido crear: ' + fallos.join('; ') + '.', 'malo');
  }

  /* ---------- el cuadro y el botón ---------- */

  function cerrar() {
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null; filas = []; anioManual = 0;
  }

  function abrir() {
    if (panel) return;
    panel = document.createElement('div');
    panel.className = 'lp-cuadro aa-cuadro';
    panel.innerHTML =
      '<label class="etiqueta" for="aa-texto">Pega aquí el aviso de la intranet entero.</label>' +
      '<textarea id="aa-texto" class="campo lp-texto" rows="6" spellcheck="false"></textarea>' +
      '<div class="lp-fila"><button type="button" class="boton boton-principal" id="aa-leer">Leer el aviso</button>' +
      '<button type="button" class="boton" id="aa-cancelar">Cancelar</button></div><div id="aa-resultado"></div>';
    sitio.appendChild(panel);
    panel.querySelector('#aa-texto').focus();
    panel.querySelector('#aa-leer').onclick = reconocer;
    panel.querySelector('#aa-cancelar').onclick = cerrar;
  }

  function montar() {
    if (sitio) return true;
    var antes = document.querySelector('.vista-previa-nuevo');
    if (!antes || !antes.parentNode) return false;
    sitio = document.createElement('div');
    sitio.id = 'aula-aviso-sitio';
    sitio.className = 'aa-sitio oculto';
    sitio.innerHTML = '<button type="button" class="boton" id="aa-abrir">Crear varios desde una lista</button>';
    antes.parentNode.insertBefore(sitio, antes);
    sitio.querySelector('#aa-abrir').onclick = abrir;
    return true;
  }

  /* Cada vez que se repinta «Nuevo asunto»: el botón solo con este tipo y fuera de solo consulta. */
  function alRefrescar() {
    if (!montar()) return;
    var tipo = tipoAula();
    var ver = !!(tipo && App.E.nuevo && App.E.nuevo.tipo === tipo.tipo && !(window.SoloConsulta && SoloConsulta.activo()));
    sitio.classList.toggle('oculto', !ver);
    if (!ver && panel && !trabajando) cerrar();
  }

  var refrescar = App.refrescarVista;
  App.refrescarVista = function () { var r = refrescar.apply(this, arguments); try { alRefrescar(); } catch (err) { /* el botón no es esencial */ } return r; };

  return { alRefrescar: alRefrescar, _filas: function () { return filas; } };
})();
window.AulaAvisoPantalla = AulaAvisoPantalla;
