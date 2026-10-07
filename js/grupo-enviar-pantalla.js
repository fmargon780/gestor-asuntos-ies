/* ============================================================
   grupo-enviar-pantalla.js — la pantalla de «Enviar…» y de «Enviar un aviso…» de la tarjeta
   «Personas del grupo» (fila 295, docs/TRABAJO-EN-BLOQUE-ENVIAR-A-TODOS.md). A pantalla completa,
   en dos columnas:

     Izquierda: la plantilla, el asunto, el texto (una vez para todos) y debajo el correo de muestra,
                con su Para, su asunto, su saludo y el nombre de su adjunto, y ◀ ▶ para ver el de otra.
     Derecha:   a quién (la lista), en ámbar quién no tiene correo, en gris quién ya lo tiene y quién
                no está registrado todavía; con alumnado, «A quién» (el alumno, su familia o todas).
     Abajo:     «Enviar a los N» y «Cancelar»; al enviar, la barra «Enviando 12 de 28…» con «Parar»,
                y después el resultado, con «Reintentar» y, si Google corta, «Seguir enviando».

   Sin conexión de envío, el botón queda apagado. La tanda en sí vive en js/grupo-enviar.js.
   ============================================================ */
var GrupoEnviarPantalla = (function () {

  var abierta = null;   /* una sola pantalla a la vez */

  function esc(t) { return U.escapar(t); }
  function nombreLimpio(p) { return GrupoEnviar.soloElNombre(p.nombre) || p.nombre; }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  async function ficherosDe(a) {
    try { return (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); } catch (e) { return []; }
  }

  /* op: { trabajo, aviso: true (uno nuevo), conRegistro }. Devuelve una promesa que acaba al cerrarse. */
  async function abrir(a, op) {
    if (abierta) return abierta;
    op = op || {};
    if (!GrupoEnviar.puedeEnviar(a)) { U.aviso('Ahora no puedes enviar desde aquí: está en solo consulta o lo tiene el compañero.', 'ambar'); return; }
    try { await App.cargarRegistro(); } catch (e) { /* con lo que haya */ }
    var S = { a: a, aQuien: 'todas', indice: 0, valores: {}, fallos: [], enviando: false, parar: false, algoEnviado: false,
      conRegistro: !!op.conRegistro, avisoId: '', texto: '', asunto: '', plantillaId: '' };
    var ficha = GrupoEnviar.fichaDe(a);
    var avisoViejo = op.trabajo && GrupoEnviar.esAviso(op.trabajo) ? (ficha.avisosEnBloque || []).filter(function (v) { return 'aviso:' + v.id === op.trabajo; })[0] : null;
    S.esAviso = !!(op.aviso || avisoViejo);
    if (avisoViejo) { S.avisoId = avisoViejo.id; S.asunto = avisoViejo.asunto || ''; S.texto = avisoViejo.texto || ''; }
    S.trabajo = S.esAviso ? 'aviso:' + (S.avisoId || 'nuevo') : op.trabajo;
    S.est = PersonasDelGrupo.estado(a, await ficherosDe(a));
    S.personas = await GrupoEnviar.cargarPersonas(S.est);

    var plantillas = [];
    try {
      var datos = await Plantillas.cargar(App.E.gestor);
      var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
      var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
      plantillas = Plantillas.deTipo(datos, categoria, tipo) || [];
    } catch (e1) { plantillas = []; }
    S.plantillas = plantillas;
    var propia = S.esAviso ? null : GrupoEnviar.plantillaPropia(plantillas);
    if (!avisoViejo) {
      S.plantillaId = propia ? propia.id : '';
      S.texto = propia ? propia.texto : (S.esAviso ? '' : 'Le enviamos adjunto el documento.');
      S.asunto = S.esAviso ? '' : ((window.CorreoNucleo && CorreoNucleo.asuntoDelCorreo) ? CorreoNucleo.asuntoDelCorreo(a) : a.nombre);
    }

    abierta = new Promise(function (resolver) { montar(S, resolver); });
    return abierta;
  }

  function montar(S, resolver) {
    var a = S.a;
    var capa = document.createElement('div');
    capa.id = 'grupo-enviar';
    capa.className = 'grupo-enviar';
    capa.innerHTML =
      '<div class="ge-barra"><strong class="ge-titulo">' + (S.esAviso ? 'Enviar un aviso a las personas del grupo' : 'Enviar a las personas del grupo') + '</strong>' +
        '<span class="suave ge-asunto-nombre">' + esc(a.nombre) + '</span></div>' +
      '<div class="ge-cuerpo">' +
        '<section class="ge-izq">' +
          '<label class="ge-campo">Plantilla <select class="campo ge-plantilla"></select></label>' +
          '<label class="ge-campo">Asunto del correo' + (S.esAviso ? ' (obligatorio)' : '') + ' <input class="campo ge-asunto" type="text"></label>' +
          '<label class="ge-campo">Texto, igual para todos <textarea class="campo ge-texto" rows="6"></textarea></label>' +
          '<div class="ge-nav"><button type="button" class="boton boton-chico ge-ant" title="El correo de la anterior">◀</button>' +
            '<span class="ge-nav-texto"></span><button type="button" class="boton boton-chico ge-sig" title="El correo de la siguiente">▶</button></div>' +
          '<div class="ge-muestra"></div>' +
        '</section>' +
        '<section class="ge-der"><div class="ge-resultado"></div><div class="ge-quien"></div></section>' +
      '</div>' +
      '<div class="ge-pie"><span class="ge-estado"></span><span class="ge-botones">' +
        '<button type="button" class="boton boton-principal ge-enviar"></button>' +
        '<button type="button" class="boton ge-parar oculto">Parar</button>' +
        '<button type="button" class="boton ge-cancelar">Cancelar</button></span></div>';
    document.body.appendChild(capa);
    document.body.classList.add('con-grupo-enviar');

    function q(c) { return capa.querySelector(c); }
    var clas = null;

    function cerrar() {
      if (S.enviando) return;
      document.removeEventListener('keydown', alTeclear, true);
      capa.remove();
      document.body.classList.remove('con-grupo-enviar');
      abierta = null;
      if (window.PersonasDelGrupo) PersonasDelGrupo.repintar(a);
      resolver();
    }
    function alTeclear(ev) {
      if (ev.key !== 'Escape' || S.enviando) return;
      if (document.querySelector('.capa:not(.oculto)')) return;
      ev.stopPropagation();
      cerrar();
    }
    document.addEventListener('keydown', alTeclear, true);

    function recalcular() {
      clas = GrupoEnviar.clasificar(S.est, S.trabajo, { personas: S.personas, aQuien: S.aQuien, registro: S.conRegistro });
      if (S.indice >= clas.envian.length) S.indice = Math.max(0, clas.envian.length - 1);
    }

    /* ---- izquierda ---- */
    var selPl = q('.ge-plantilla');
    selPl.innerHTML = '<option value="">Sin plantilla</option>' + S.plantillas.map(function (p) {
      return '<option value="' + esc(p.id) + '">' + esc(p.nombre) + '</option>';
    }).join('');
    selPl.value = S.plantillaId;
    selPl.onchange = function () {
      var p = S.plantillas.filter(function (x) { return x.id === selPl.value; })[0];
      S.plantillaId = selPl.value;
      S.texto = p ? p.texto : (S.esAviso ? '' : 'Le enviamos adjunto el documento.');
      q('.ge-texto').value = S.texto;
      pintarMuestra(); pintarPie();
    };
    var campoAsunto = q('.ge-asunto'), campoTexto = q('.ge-texto');
    campoAsunto.value = S.asunto;
    campoTexto.value = S.texto;
    campoAsunto.oninput = function () { S.asunto = campoAsunto.value; pintarMuestra(); pintarPie(); };
    campoTexto.oninput = function () { S.texto = campoTexto.value; pintarMuestra(); pintarPie(); };
    q('.ge-ant').onclick = function () { if (S.indice > 0) { S.indice--; pintarMuestra(); } };
    q('.ge-sig').onclick = function () { if (S.indice < clas.envian.length - 1) { S.indice++; pintarMuestra(); } };

    async function pintarMuestra() {
      var turno = S.turnoMuestra = (S.turnoMuestra || 0) + 1;
      var caja = q('.ge-muestra');
      var n = clas.envian.length;
      q('.ge-nav-texto').textContent = n ? (S.indice + 1) + ' de ' + n : '';
      q('.ge-ant').disabled = S.indice <= 0;
      q('.ge-sig').disabled = S.indice >= n - 1;
      var x = clas.envian[S.indice];
      if (!x) { caja.innerHTML = '<p class="explica">No hay nadie a quien enviar ahora.</p>'; return; }
      var k = x.persona.categoria + '|' + x.persona.nombre;
      var valores = S.valores[k] || (S.valores[k] = await GrupoEnviar.valoresDe(a, x.persona));
      if (turno !== S.turnoMuestra || !capa.isConnected) return;
      var adjunto = !S.esAviso && x.hecho && x.hecho.generado ? x.hecho.generado.fichero : '';
      caja.innerHTML =
        '<div class="ge-correo"><p><span class="suave">Para</span> <strong class="ge-m-para">' + esc(x.correos.join(', ')) + '</strong></p>' +
        '<p><span class="suave">Asunto</span> <strong class="ge-m-asunto">' + esc(S.asunto) + '</strong></p>' +
        '<pre class="ge-m-texto">' + esc(GrupoEnviar.cuerpoPara(x.persona, valores, S.texto)) + '</pre>' +
        (adjunto ? '<p><span class="suave">Adjunto</span> <button type="button" class="enlace ge-m-adjunto" data-fichero="' + esc(adjunto) + '">' + esc(adjunto) + '</button></p>' : '') + '</div>';
      var b = caja.querySelector('.ge-m-adjunto');
      if (b) b.onclick = async function () {
        try { Visor.abrir(await a.handle.getFileHandle(adjunto), adjunto, { asunto: a, carpeta: a.handle }); }
        catch (e) { U.aviso('Ya no está ese documento en la carpeta.', 'ambar'); }
      };
    }

    /* ---- derecha ---- */
    function pintarQuien() {
      var c = clas, html = '';
      if (S.est.personas.some(function (p) { return p.categoria === 'ALUMNADO'; })) {
        html += '<label class="ge-campo">A quién <select class="campo ge-aquien">' +
          [['alumno', 'Al alumno o alumna'], ['familia', 'A su familia'], ['todas', 'A todas las direcciones de su ficha']].map(function (o) {
            return '<option value="' + o[0] + '"' + (o[0] === S.aQuien ? ' selected' : '') + '>' + o[1] + '</option>';
          }).join('') + '</select></label>';
      }
      html += '<h3 class="ge-se-envia">Se envía a ' + plural(c.envian.length, 'persona', 'personas') + '</h3><ul class="ge-lista">' +
        c.envian.map(function (x) { return '<li><strong>' + esc(nombreLimpio(x.persona)) + '</strong> <span class="suave">' + esc(x.correos.join(', ')) + '</span></li>'; }).join('') + '</ul>';
      if (c.sinCorreo.length) {
        html += '<div class="ge-ambar aviso-ambar"><strong>Sin correo (' + c.sinCorreo.length + ')</strong> ' +
          '<button type="button" class="boton boton-chico ge-copiar">Copiar los nombres</button>' +
          '<div class="ge-nombres">' + esc(c.sinCorreo.map(nombreLimpio).join(', ')) + '</div>' +
          '<p class="explica">No se envía nada por ellas: mándaselo por Séneca.</p></div>';
      }
      if (c.yaEnviado.length) html += '<details class="ge-gris"><summary>Ya enviado (' + c.yaEnviado.length + ')</summary><div class="ge-nombres">' + esc(c.yaEnviado.map(nombreLimpio).join(', ')) + '</div></details>';
      if (S.conRegistro && c.sinRegistrar.length) html += '<details class="ge-gris"><summary>Sin registrar todavía (' + c.sinRegistrar.length + ')</summary><div class="ge-nombres">' + esc(c.sinRegistrar.map(nombreLimpio).join(', ')) + '</div></details>';
      var caja = q('.ge-quien');
      caja.innerHTML = html;
      var sel = caja.querySelector('.ge-aquien');
      if (sel) sel.onchange = function () { S.aQuien = sel.value; recalcular(); pintarQuien(); pintarMuestra(); pintarPie(); };
      var cp = caja.querySelector('.ge-copiar');
      if (cp) cp.onclick = function () {
        var t = c.sinCorreo.map(function (p) { return window.Relacionados ? Relacionados.nombreEnOrdenNormal({ categoria: p.categoria, nombre: p.nombre }) : p.nombre; }).join('\n');
        U.copiar(t, null, { avisoFallo: 'No he podido copiarlos.' });
      };
    }

    /* ---- abajo ---- */
    function sePuede() {
      if (S.enviando || !clas.envian.length || !GrupoEnviar.puedeEnviar(a)) return false;
      if (!(window.CorreoEnviar && CorreoEnviar.tieneConexion())) return false;
      if (S.esAviso && (!S.asunto.trim() || !S.texto.trim())) return false;
      return true;
    }
    function pintarPie() {
      var n = clas.envian.length;
      var b = q('.ge-enviar');
      b.textContent = 'Enviar a ' + (n === 1 ? '1 persona' : 'los ' + n);
      b.disabled = !sePuede();
      b.classList.toggle('oculto', S.enviando);
      q('.ge-parar').classList.toggle('oculto', !S.enviando);
      var cancel = q('.ge-cancelar');
      cancel.textContent = S.algoEnviado ? 'Cerrar' : 'Cancelar';
      cancel.disabled = S.enviando;
      if (!S.enviando) {
        q('.ge-estado').textContent = !(window.CorreoEnviar && CorreoEnviar.tieneConexion())
          ? 'Para enviar, conecta antes el envío de correo en Ajustes › Mantenimiento.'
          : (S.esAviso && (!S.asunto.trim() || !S.texto.trim()) ? 'Escribe el asunto y el texto del aviso.' : '');
      }
      capa.classList.toggle('ge-enviando', S.enviando);
      Array.prototype.forEach.call(capa.querySelectorAll('input, select, textarea'), function (e) { e.disabled = S.enviando; });
    }

    function pintarResultado(res, quedan) {
      var caja = q('.ge-resultado');
      var html = '<p class="ge-hechos"><strong>' + plural(res.enviados.length, 'enviado', 'enviados') + '.</strong>' +
        (res.fallos.length && !res.tope ? ' ' + (res.fallos.length === 1 ? '1 no ha salido:' : res.fallos.length + ' no han salido:') : '') + '</p>';
      if (res.fallos.length) {
        html += '<ul class="ge-fallos">' + res.fallos.map(function (f) { return '<li><strong>' + esc(nombreLimpio(f.rel)) + '</strong>: ' + esc(f.motivo) + '</li>'; }).join('') + '</ul>';
        if (!res.tope) html += '<button type="button" class="boton ge-reintentar">Reintentar los ' + res.fallos.length + '</button>';
      }
      if (res.tope) html += '<p class="aviso-ambar ge-tope">' + esc(GrupoEnviar.textoDeParada(res, quedan)) + '</p>';
      if (res.parado) html += '<p class="nota">Lo has parado. Quedan ' + quedan + ' por enviar.</p>';
      caja.innerHTML = html;
      var r = caja.querySelector('.ge-reintentar');
      if (r) r.onclick = function () { enviar(res.fallos.map(function (f) { return f.rel.categoria + '|' + f.rel.nombre; })); };
    }

    /* ---- enviar ---- */
    async function enviar(soloEstas) {
      if (S.enviando) return;
      if (!GrupoEnviar.puedeEnviar(a)) { U.aviso('Ahora no puedes enviar desde aquí.', 'ambar'); return; }
      S.enviando = true; S.parar = false;
      pintarPie();
      try {
        await App.cargarRegistro();   /* se relee la ficha: lo que ya salió desde el otro ordenador no se repite */
        S.est = PersonasDelGrupo.estado(a, await ficherosDe(a));
        recalcular();
        var items = clas.envian.filter(function (x) { return !soloEstas || soloEstas.indexOf(x.persona.categoria + '|' + x.persona.nombre) !== -1; });
        if (!items.length) { U.aviso('No queda nadie a quien enviar.', 'ambar'); return; }
        if (S.esAviso && !S.avisoId) {
          S.avisoId = await GrupoAvisos.registrar(a, S.asunto, S.texto);
          S.trabajo = 'aviso:' + S.avisoId;
        }
        var primero = items[0], valores1 = S.valores[primero.persona.categoria + '|' + primero.persona.nombre] || await GrupoEnviar.valoresDe(a, primero.persona);
        var muestra = GrupoEnviar.cuerpoPara(primero.persona, valores1, S.texto);
        var lote = { trabajo: S.trabajo, aviso: S.esAviso ? S.avisoId : '', asunto: S.asunto.trim(), texto: S.texto,
          tanda: Date.now().toString(36), items: items.map(function (x) {
            return { rel: { categoria: x.persona.categoria, nombre: x.persona.nombre }, correos: x.correos, nombreDoc: !S.esAviso && x.hecho && x.hecho.generado ? x.hecho.generado.fichero : '' };
          }) };
        window.onbeforeunload = function () { return 'Se están enviando correos.'; };
        var res = await GrupoEnviar.enviarTanda(a, lote, {
          parado: function () { return S.parar; },
          avanzar: function (i, total) { q('.ge-estado').textContent = 'Enviando ' + i + ' de ' + total + '… No cierres esta pestaña.'; }
        });
        S.est = PersonasDelGrupo.estado(a, await ficherosDe(a));
        recalcular();
        await GrupoEnviar.cerrarTanda(a, lote, res, muestra, clas.envian.length);
        if (res.enviados.length) S.algoEnviado = true;
        S.est = PersonasDelGrupo.estado(a, await ficherosDe(a));
        recalcular();
        pintarResultado(res, clas.envian.length);
      } catch (e) {
        U.fallo('No he podido enviar', e);
      } finally {
        window.onbeforeunload = null;
        S.enviando = false;
        pintarPie(); pintarQuien(); pintarMuestra();
        if (S.algoEnviado && window.PersonasDelGrupo) PersonasDelGrupo.repintar(a);
      }
    }

    q('.ge-enviar').onclick = function () { enviar(null); };
    q('.ge-parar').onclick = function (ev) { S.parar = true; ev.currentTarget.disabled = true; q('.ge-estado').textContent = 'Parando…'; };
    q('.ge-cancelar').onclick = cerrar;

    recalcular();
    pintarQuien(); pintarPie(); pintarMuestra();
    campoAsunto.focus();
  }

  return { abrir: abrir, abierta: function () { return !!abierta; } };
})();
window.GrupoEnviarPantalla = GrupoEnviarPantalla;
