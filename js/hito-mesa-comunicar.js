/* ============================================================
   hito-mesa-comunicar.js — el bloque "Comunicar" de la mesa del hito
   (24-sep-2026, fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md, 5).

   Chips marcables con los destinatarios posibles: el tercero, sus
   tutores legales (js/datos-tutores.js) y los relacionados del asunto,
   premarcados según el responsable del hito (la misma lógica de
   `resolverDestinatario` de js/hitos-comunicar.js: tutor → el tutor
   legal 1, o el 2; relacionado → los relacionados; si no, el tercero).
   "Preparar correo" y "Mensaje de Séneca" abren los cuadros de siempre
   (`HitosComunicar.comunicar`) con esos destinatarios y los documentos
   del hito premarcados. "Pedir lo que falta", solo si falta algo.

   Lo llama js/hito-mesa-documentos.js con la mesa abierta.
   ============================================================ */
var HitoMesaComunicar = (function () {

  var turno = 0;

  async function candidatos(a, h) {
    var lista = [];
    var persona = window.HitosComunicar && HitosComunicar.buscarPersonaDelAsunto
      ? await HitosComunicar.buscarPersonaDelAsunto(a) : null;
    var nombreTercero = (a.ficha && a.ficha.tercero) || (persona && persona.nombre) || a.nombre;
    var correosTercero = [];
    if (persona) {
      Object.keys(persona.campos || {}).forEach(function (k) {
        if (/tutor|padre|madre|responsable|familia/i.test(U.normalizar(k))) return;
        String(persona.campos[k] || '').replace(/[^\s,;<>()"]+@[^\s,;<>()"]+\.[A-Za-z]{2,}/g, function (dir) {
          if (correosTercero.indexOf(dir) === -1) correosTercero.push(dir);
        });
      });
    }
    lista.push({ id: 'tercero', nombre: String(nombreTercero).replace(/\s+\S*\d\S*\s*$/, ''), correos: correosTercero });
    if (persona && window.Datos && Datos.tutoresDe) {
      Datos.tutoresDe(persona).forEach(function (t) {
        var etiqueta = window.FichaTerceroAlumno ? FichaTerceroAlumno.etiquetaDeTutor(t) : 'Tutor legal ' + t.numero;
        lista.push({ id: 'tutor' + t.numero, nombre: (t.nombre || etiqueta) + ' (' + etiqueta.toLowerCase() + ')',
                     soloNombre: t.nombre || etiqueta, correos: t.correos.slice() });
      });
    }
    ((a.ficha && a.ficha.relacionados) || []).forEach(function (r, i) {
      lista.push({ id: 'rel' + i, nombre: r.nombre, correos: [], relacionado: r });
    });
    return lista;
  }

  function premarcados(h, lista) {
    if (h.responsable === 'tutor') {
      var t = lista.filter(function (c) { return /^tutor/.test(c.id); })[0];
      if (t) return [t.id];
    }
    if (h.responsable === 'relacionado') {
      var rel = lista.filter(function (c) { return /^rel/.test(c.id); }).map(function (c) { return c.id; });
      if (rel.length) return rel;
    }
    return ['tercero'];
  }

  async function pintar(fila, a, h) {
    var caja = fila.querySelector('.mesa-destinatarios');
    if (!caja || !h || h.clase === 'decision') return;
    var mio = ++turno;
    var lista = await candidatos(a, h);
    if (mio !== turno || !caja.isConnected) return;
    var marcados = premarcados(h, lista);

    var falta = window.HitosRequisitos && HitosRequisitos.textoLoQueFalta ? HitosRequisitos.textoLoQueFalta(h) : '';
    caja.innerHTML =
      '<div class="mesa-chips">' + lista.map(function (c) {
        return '<label class="mesa-chip"><input type="checkbox" data-id="' + U.escapar(c.id) + '"' +
          (marcados.indexOf(c.id) !== -1 ? ' checked' : '') + '><span>' + U.escapar(c.nombre) + '</span></label>';
      }).join('') + '</div>' +
      '<div class="mesa-comunicar-botones">' +
        '<button type="button" class="boton boton-chico mesa-preparar-correo">Preparar correo</button>' +
        '<button type="button" class="boton boton-chico mesa-mensaje-seneca">Mensaje de Séneca</button>' +
      '</div>' +
      (falta ? '<button type="button" class="enlace mesa-pedir-falta">Pedir lo que falta</button>' : '');

    function elegidos() {
      return Array.prototype.filter.call(caja.querySelectorAll('.mesa-chip input'), function (c) { return c.checked; })
        .map(function (c) { return lista.filter(function (x) { return x.id === c.dataset.id; })[0]; }).filter(Boolean);
    }
    async function correosDe(sel) {
      var correos = [];
      for (var i = 0; i < sel.length; i++) {
        var c = sel[i];
        var dirs = c.correos;
        if (c.relacionado && !dirs.length && window.CorreoGrupos && CorreoGrupos.resolverMiembros) {
          try {
            var r = await CorreoGrupos.resolverMiembros([c.relacionado]);
            dirs = (r || []).reduce(function (acc, m) { return acc.concat(HitosComunicar.correosDePersona(m.persona)); }, []);
          } catch (e) { dirs = []; }
        }
        dirs.forEach(function (d) { if (correos.indexOf(d) === -1) correos.push(d); });
      }
      return correos;
    }
    function nombres(sel) { return sel.map(function (c) { return c.soloNombre || c.nombre; }); }
    function adjuntos() {
      var marcadosDocs = window.HitoMesaDocumentos ? HitoMesaDocumentos.marcados(fila) : [];
      return marcadosDocs.length ? marcadosDocs : null;
    }

    caja.querySelector('.mesa-preparar-correo').onclick = async function () {
      var sel = elegidos();
      var op = { correos: await correosDe(sel), nombres: nombres(sel) };
      var adj = adjuntos();
      if (adj) op.adjuntos = adj;
      HitosComunicar.comunicar(a, h, 'correo', op);
    };
    caja.querySelector('.mesa-mensaje-seneca').onclick = function () {
      HitosComunicar.comunicar(a, h, 'seneca', { nombres: nombres(elegidos()) });
    };
    var pedir = caja.querySelector('.mesa-pedir-falta');
    if (pedir && window.CorreoNucleo && CorreoNucleo.montarBotonComunicar) {
      CorreoNucleo.montarBotonComunicar(pedir, a, { loQueFalta: falta });
    }
  }

  return { pintar: pintar, premarcados: premarcados };
})();
window.HitoMesaComunicar = HitoMesaComunicar;
