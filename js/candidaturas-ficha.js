/* ============================================================
   candidaturas-ficha.js — la tarjeta «Candidaturas» de la ficha del asunto
   (15-oct-2026, fila 347, docs/CANDIDATURAS-CONSEJO-ESCOLAR.md, apartado 3).

   Solo sale en un asunto de un tipo con «Lleva candidaturas» (o que ya lleve alguna). Cerrada, un resumen:
   «N candidaturas · Alumnado N · Madres y padres N · Profesorado N · PAS N». Abierta, un bloque por sector, por
   apellidos; cada fila: nombre, fecha y registro, el documento (se abre al pulsar) y el estado, que se cambia
   en la propia fila y se guarda al cambiar (Presentada, Admitida, Excluida —pide el motivo— o Retirada).
   El ⋮ de cada fila: «Cambiar el sector», «Quitar la candidatura» y «Ver su ficha». «+ Añadir candidatura»
   apunta una sin documento (llegó en papel). «Lista de candidaturas ▾» saca el PDF (js/candidaturas-lista.js).
   Los datos y el guardado viven en js/candidaturas.js. Se pinta desde js/ficha-asunto.js.
   ============================================================ */
var CandidaturasFicha = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(v) { return U.escapar(String(v === undefined || v === null ? '' : v)); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  var actual = null;   /* el asunto cuya tarjeta está a la vista */

  function fechaCorta(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '';
  }

  function resumenDe(cands) {
    var c = Candidaturas.cuentas(cands);
    return [plural(cands.length, 'candidatura', 'candidaturas')]
      .concat(Candidaturas.SECTORES.map(function (s) { return s + ' ' + c[s]; })).join(' · ');
  }

  /* ---------- una fila ---------- */

  function filaHtml(c, ficheros) {
    var docs = (c.documentos || []).map(function (d) {
      return ficheros[d]
        ? '<button type="button" class="enlace cand-doc" data-doc="' + esc(d) + '">' + esc(d) + '</button>'
        : '<span class="suave cand-doc-falta" title="Ese documento ya no está en la carpeta">' + esc(d) + ' (ya no está)</span>';
    }).join(' ');
    var off = soloConsulta() ? ' disabled' : '';
    return '<li class="cand-fila" data-id="' + esc(c.id) + '">' +
      '<div class="cand-fila-datos"><strong class="cand-nombre">' + esc(Candidaturas.visible(c.persona)) + '</strong>' +
        '<span class="suave cand-cuando">' + esc([fechaCorta(c.fecha), c.registro].filter(Boolean).join(' · ')) + '</span>' +
        '<span class="cand-docs">' + (docs || '<span class="suave">Sin documento</span>') + '</span></div>' +
      '<div class="cand-fila-estado">' +
        '<select class="campo cand-estado" aria-label="Estado de la candidatura de ' + esc(Candidaturas.visible(c.persona)) + '"' + off + '>' +
        Candidaturas.ESTADOS.map(function (e) { return '<option value="' + e + '"' + (e === c.estado ? ' selected' : '') + '>' + e + '</option>'; }).join('') +
        '</select>' +
        '<span class="cand-menu"></span></div>' +
      (c.estado === 'Excluida' && c.motivo ? '<p class="nota cand-motivo">Motivo: ' + esc(c.motivo) + '</p>' : '') +
    '</li>';
  }

  function cuerpoHtml(a, ficheros) {
    var cands = Candidaturas.lista(a);
    var off = soloConsulta() ? ' disabled' : '';
    var bloques = Candidaturas.SECTORES.map(function (s) {
      var fs = Candidaturas.porSector(cands, s);
      return '<div class="cand-bloque" data-sector="' + esc(s) + '"><h4>' + esc(s) + ' <span class="suave">(' + fs.length + ')</span></h4>' +
        (fs.length ? '<ul class="cand-filas">' + fs.map(function (c) { return filaHtml(c, ficheros); }).join('') + '</ul>' : '<p class="nota">Ninguna.</p>') + '</div>';
    });
    var sueltas = cands.filter(function (c) { return Candidaturas.SECTORES.indexOf(c.sector) === -1; });
    if (sueltas.length) {
      bloques.push('<div class="cand-bloque" data-sector=""><h4>Sin sector <span class="suave">(' + sueltas.length + ')</span></h4><ul class="cand-filas">' +
        sueltas.map(function (c) { return filaHtml(c, ficheros); }).join('') + '</ul></div>');
    }
    return '<div class="cand-barra">' +
        '<button type="button" class="boton" id="cand-anadir"' + off + '>+ Añadir candidatura</button>' +
        '<span class="cand-lista-menu" id="cand-lista-menu"></span>' +
      '</div>' +
      '<div class="cand-bloques">' + bloques.join('') + '</div>';
  }

  /* ---------- pintar ---------- */

  async function ficherosDe(a) {
    var mapa = {};
    try { (await Carpetas.ficheros(a.handle)).forEach(function (f) { mapa[f.nombre] = f; }); } catch (e) { /* sin carpeta: ningún documento se ve como presente */ }
    return mapa;
  }

  var turno = 0;

  async function pintar(a) {
    actual = a || null;
    var caja = $('ficha-candidaturas');
    if (!caja || !a) return;
    var mio = ++turno;
    var cands = Candidaturas.lista(a);
    caja.dataset.resumen = resumenDe(cands);
    var ficheros = await ficherosDe(a);
    if (mio !== turno || !caja.isConnected) return;
    caja.className = '';
    caja.innerHTML = cuerpoHtml(a, ficheros);
    enganchar(a, caja, ficheros);
  }

  /* Repintar con la ficha fresca (tras guardar desde el cuadro de nombre, o desde otro ordenador). */
  function repintar() {
    if (!actual) return;
    var caja = $('ficha-candidaturas');
    if (!caja || !caja.isConnected) return;
    var fresca = App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[actual.nombre];
    if (fresca) actual.ficha = fresca;
    pintar(actual);
  }

  /* ---------- las acciones ---------- */

  function candidatura(id) { return Candidaturas.lista(actual).filter(function (c) { return c.id === id; })[0] || null; }

  async function cambiarEstado(c, estado, select) {
    var motivo = c.motivo || '';
    if (estado === 'Excluida') {
      var ok = await U.preguntar('Excluir la candidatura',
        '<p>¿Por qué se excluye la candidatura de «' + esc(Candidaturas.visible(c.persona)) + '»?</p>' +
        '<label class="etiqueta">Motivo</label><textarea id="cand-motivo" class="campo" rows="3" maxlength="400">' + esc(motivo) + '</textarea>', 'Excluirla');
      var campo = $('cand-motivo');
      motivo = campo ? campo.value.trim() : '';
      if (!ok || !motivo) {
        if (ok && !motivo) U.aviso('Hace falta el motivo de la exclusión.', 'malo');
        select.value = c.estado;
        return;
      }
    } else motivo = '';
    try {
      await Candidaturas.cambiar(actual, c.id, function (x) { x.estado = estado; x.motivo = motivo; });
      if (window.RegistroAsunto) await RegistroAsunto.auto(actual, 'Candidatura de ' + Candidaturas.visible(c.persona) + ': ' + estado.toLowerCase() + (motivo ? ' (' + motivo + ')' : ''));
    } catch (e) { U.fallo('No he podido cambiar el estado', e); select.value = c.estado; }
    repintar();
  }

  async function cambiarSector(c) {
    var ok = await U.preguntar('Cambiar el sector',
      '<p>Sector de la candidatura de «' + esc(Candidaturas.visible(c.persona)) + '»:</p>' +
      '<select id="cand-nuevo-sector" class="campo">' + Candidaturas.SECTORES.map(function (s) {
        return '<option value="' + esc(s) + '"' + (s === c.sector ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>', 'Cambiar');
    var campo = $('cand-nuevo-sector');
    if (!ok || !campo || campo.value === c.sector) return;
    try { await Candidaturas.cambiar(actual, c.id, function (x) { x.sector = campo.value; }); }
    catch (e) { U.fallo('No he podido cambiar el sector', e); }
    repintar();
  }

  async function quitar(c) {
    var ok = await U.preguntar('Quitar la candidatura',
      '<p>¿Quitar la candidatura de «' + esc(Candidaturas.visible(c.persona)) + '»? La persona sigue relacionada con el asunto y su documento sigue en la carpeta.</p>', 'Quitarla');
    if (!ok) return;
    try {
      await Candidaturas.quitar(actual, c.id);
      if (window.RegistroAsunto) await RegistroAsunto.auto(actual, 'Candidatura de ' + Candidaturas.visible(c.persona) + ' quitada');
    } catch (e) { U.fallo('No he podido quitar la candidatura', e); }
    repintar();
  }

  function botonMenu(texto, alPulsar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = texto;
    b.onclick = alPulsar;
    return b;
  }

  async function verFicha(c) {
    var p = c.persona || {};
    try {
      var fuente = await Datos.cargar(App.E.datos, p.categoria);
      var hallado = fuente.lista.filter(function (x) { return App.textoTercero(x) === p.nombre; })[0];
      if (!hallado) { U.aviso('No encuentro su ficha: ya no está en las listas.', 'ambar'); return; }
      if ($('filtro-personas')) $('filtro-personas').value = p.categoria;
      App.ir('personas');
      if (App.pintarPersonas) await App.pintarPersonas();
      App.verFicha(hallado);
    } catch (e) { U.aviso('No he podido abrir su ficha: ' + U.mensajeDeError(e), 'malo'); }
  }

  async function anadirSinDocumento() {
    var persona = await elegirPersona();
    if (!persona) return;
    var p = { categoria: persona.categoria, nombre: App.textoTercero(persona), visible: persona.nombre, clave: Candidaturas.claveDe(persona) };
    var sector = Candidaturas.sectorDe(p.categoria, persona);
    if (Candidaturas.deLaPersona(actual, p.categoria, p.nombre, p.clave)) { U.aviso('Ya tiene candidatura en este asunto.', 'ambar'); return; }
    if (!sector) {
      var ok = await U.preguntar('Sector',
        '<p>«' + esc(Candidaturas.visible(p)) + '» no encaja por su categoría en ninguno de los cuatro sectores. Elige el suyo:</p>' +
        '<select id="cand-nuevo-sector" class="campo">' + Candidaturas.SECTORES.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select>', 'Apuntarla');
      var campo = $('cand-nuevo-sector');
      if (!ok || !campo) return;
      sector = campo.value;
    }
    try {
      await Candidaturas.apuntar(actual, p, sector, {});
      if (window.RegistroAsunto) await RegistroAsunto.auto(actual, 'Candidatura presentada: ' + Candidaturas.visible(p) + ' (' + sector + ')');
      U.aviso('Candidatura de ' + Candidaturas.visible(p) + ' apuntada en «' + sector + '».', 'bueno');
    } catch (e) { U.fallo('No he podido apuntar la candidatura', e); }
    repintar();
  }

  /* El buscador de personas de «Nuevo asunto», en el cuadro de siempre. Devuelve la persona, o null. */
  function elegirPersona() {
    return new Promise(function (resolver) {
      var hecho = false;
      function fin(v) { if (hecho) return; hecho = true; resolver(v); }
      var capa = $('capa');
      $('cuadro-titulo').textContent = 'Añadir una candidatura';
      $('cuadro-cuerpo').innerHTML = '<p class="explica">¿De quién es la candidatura?</p><div id="cand-picker-cuadro"></div>';
      $('cuadro-aceptar').classList.add('oculto');
      capa.classList.remove('oculto');
      function cerrar() { capa.classList.add('oculto'); $('cuadro-aceptar').classList.remove('oculto'); $('cuadro-cancelar').onclick = null; }
      $('cuadro-cancelar').onclick = function () { cerrar(); fin(null); };
      App.pintarBuscadorDeTercero($('cand-picker-cuadro'), null, function (categoria, persona) {
        cerrar();
        if (!persona) { U.aviso('Aquí solo se elige a alguien que ya esté en las listas. Si falta, dalo de alta antes en «Personas y empresas».', 'ambar'); fin(null); return; }
        persona.categoria = persona.categoria || categoria;
        fin(persona);
      });
    });
  }

  /* «Lista de candidaturas ▾»: un botón de verdad (no el ⋮ de las filas) que despliega las dos listas. */
  function menuDeLista(a) {
    var env = document.createElement('div');
    env.className = 'fila-menu-envoltorio';
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton cand-lista-btn';
    boton.textContent = 'Lista de candidaturas ▾';
    boton.title = 'Sacar la lista en PDF para el tablón';
    boton.setAttribute('aria-haspopup', 'true');
    var menu = document.createElement('div');
    menu.className = 'fila-menu oculto';
    function cerrar() { menu.classList.add('oculto'); document.removeEventListener('mousedown', fuera, true); }
    function fuera(e) { if (!env.contains(e.target)) cerrar(); }
    [['Lista provisional', 'provisional'], ['Lista definitiva', 'definitiva']].forEach(function (x) {
      menu.appendChild(botonMenu(x[0], function () { cerrar(); CandidaturasLista.hacer(a, x[1]); }));
    });
    boton.onclick = function (e) {
      e.stopPropagation();
      if (!menu.classList.contains('oculto')) { cerrar(); return; }
      menu.classList.remove('oculto');
      document.addEventListener('mousedown', fuera, true);
    };
    env.appendChild(boton); env.appendChild(menu);
    return env;
  }

  function enganchar(a, caja, ficheros) {
    var anadir = $('cand-anadir');
    if (anadir) anadir.onclick = anadirSinDocumento;
    var menuLista = $('cand-lista-menu');
    if (menuLista && window.CandidaturasLista) menuLista.appendChild(menuDeLista(a));
    Array.prototype.forEach.call(caja.querySelectorAll('.cand-fila'), function (fila) {
      var c = candidatura(fila.getAttribute('data-id'));
      if (!c) return;
      var sel = fila.querySelector('.cand-estado');
      sel.onchange = function () { if (sel.value !== c.estado) cambiarEstado(c, sel.value, sel); };
      var botones = [botonMenu('Ver su ficha', function () { verFicha(c); })];
      if (!soloConsulta()) {
        botones.push(botonMenu('Cambiar el sector', function () { cambiarSector(c); }));
        botones.push(botonMenu('Quitar la candidatura', function () { quitar(c); }));
      }
      fila.querySelector('.cand-menu').appendChild(U.menuDeAcciones(botones));
      Array.prototype.forEach.call(fila.querySelectorAll('.cand-doc'), function (b) {
        b.onclick = function () {
          var f = ficheros[b.getAttribute('data-doc')];
          if (f && window.Visor) Visor.abrir(f.handle, f.nombre, { asunto: a, carpeta: a.handle });
        };
      });
    });
  }

  return { pintar: pintar, repintar: repintar, resumenDe: resumenDe };
})();
window.CandidaturasFicha = CandidaturasFicha;
