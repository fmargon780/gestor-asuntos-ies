/* ============================================================
   documento-tarea-bloque.js — el bloque «¿De qué tarea es?» del cuadro del nombre, cuando el documento viene de la
   bandeja (14-nov-2026, fila 661, docs/661-BANDEJA-CON-HITO-Y-TAREA.md; pantalla de prueba docs/pantallas/661.html).

   Va dentro del cuadro de ponerle nombre, justo debajo de «Tipo de documento» (js/documentos-formulario.js). No hay
   ventana aparte. Sin hito y sin tarea no se guarda.

     - Con propuesta: si en algún hito del asunto hay una tarea de «Añadir documento», sin hacer, cuyo «Qué documento» es
       justo el tipo elegido, el bloque la trae puesta (la del hito actual si hay varias; si no, la primera), con «Cambiar».
     - Sin propuesta: sale vacío, con el desplegable «Hito», «+ Añadir hito» (la ventana de la fila 660) y, al elegir el hito,
       sus tareas que esperan un documento y, la última, «Tarea nueva: «TIPO»».
     - Al cambiar el tipo, la propuesta se vuelve a calcular; lo elegido a mano no se toca (solo cambia el nombre de «Tarea nueva»).

   `montar(caja, a, { tipo, hito, tarea })` lo pinta; `cambioDeTipo()` lo repinta si el tipo ha cambiado; `destino()` devuelve
   { hitoId, tareaId } (tareaId null = tarea nueva) o { aviso }. Lo guarda DocumentoATarea.colgar (con `conMarca`).
   ============================================================ */
window.DocumentoTareaBloque = (function () {

  var S = null;

  function esc(t) { return U.escapar(t == null ? '' : String(t)); }
  function norm(t) { return U.normalizar(String(t || '')); }

  function html() { return '<div class="bloque-tarea" id="doc-tarea-bloque"></div>'; }

  async function leerHitos() {
    var datos = await Hitos.leer();
    var entrada = datos.porAsunto[S.a.nombre];
    var hitos = entrada ? entrada.hitos : [];
    S.lista = DocumentoATarea.hitosElegibles(hitos);
    S.numerados = Hitos.numerados ? Hitos.numerados(hitos) : S.lista;
    S.idActual = window.EstadoHito && EstadoHito.idActual ? EstadoHito.idActual(hitos, datos.ajustes) : null;
  }

  function hitoPor(id) { return S.lista.filter(function (x) { return x.id === id; })[0] || null; }
  function esperan(h) { return h ? DocumentoATarea.tareasQueEsperan(S.a, h) : []; }
  function tareaPor(h, id) { return esperan(h).filter(function (g) { return g.id === id; })[0] || null; }
  function espera(g, tipo) { return !!tipo && !!g.tipoDocumento && norm(g.tipoDocumento) === norm(tipo); }

  function nombreHito(h) {
    var n = S.numerados.indexOf(h) + 1;
    return (n ? n + '. ' : '') + (h.titulo || 'Hito') + (h.id === S.idActual ? ' (el actual)' : '');
  }

  /* La primera tarea sin hacer que espera ese tipo: primero en el hito preferido (el de donde se llega, o el actual). */
  function buscarPropuesta(tipo, soloHito) {
    var orden = soloHito ? [soloHito] : S.lista.slice().sort(function (x, y) {
      var p = S.preferido || S.idActual;
      return (y.id === p ? 1 : 0) - (x.id === p ? 1 : 0);
    });
    for (var i = 0; i < orden.length; i++) {
      var g = esperan(orden[i]).filter(function (x) { return espera(x, tipo); })[0];
      if (g) return { h: orden[i], g: g };
    }
    return null;
  }

  function proponer() {
    var hallada = buscarPropuesta(S.tipo());
    S.aMano = false;
    if (hallada) { S.hitoId = hallada.h.id; S.tareaId = hallada.g.id; S.propuesta = true; }
    else { S.hitoId = ''; S.tareaId = ''; S.propuesta = false; }
  }

  function notaTareaNueva() {
    var enGuia = !!window.MarcaGuia && MarcaGuia.enGuia(S.a);
    return 'La app la crea en ese hito y la deja hecha, ' + (enGuia ? 'y va también a la guía.' : 'solo en este asunto.');
  }

  function pintar() {
    var tipo = S.tipo(), h = hitoPor(S.hitoId), sinHitos = !S.lista.length, t = '<h4>¿De qué tarea es?</h4>';
    var g = S.propuesta && !S.aMano && h ? tareaPor(h, S.tareaId) : null;
    if (g) {
      t += '<div class="propuesta"><p><span class="suave">Hito:</span> <b>' + esc(nombreHito(h)) + '</b></p>' +
        '<p><span class="suave">Tarea:</span> <b>' + esc(g.texto) + '</b></p>' +
        '<p class="suave">' + (g.tipoDocumento ? 'Esa tarea espera un documento de tipo ' + esc(g.tipoDocumento) + '. Queda hecha.' : 'Esa tarea espera un documento. Queda hecha.') + '</p>' +
        '<button type="button" class="boton boton-chico" id="dtb-cambiar">Cambiar</button></div>';
    } else {
      var nota = sinHitos ? 'Este asunto no tiene hitos. Añade el hito del que cuelga el documento.'
        : (S.aMano ? '' : 'Ninguna tarea espera un documento de tipo ' + tipo + '. Elige el hito y la tarea.');
      if (nota) t += '<p class="suave" id="dtb-nota">' + esc(nota) + '</p>';
      t += '<label class="etiqueta" for="dtb-hito">Hito</label><div class="hito-linea"><select id="dtb-hito" class="campo"' + (sinHitos ? ' disabled' : '') + '>' +
        '<option value="">' + (sinHitos ? 'No hay hitos' : 'Elige el hito…') + '</option>' +
        S.lista.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === S.hitoId ? ' selected' : '') + '>' + esc(nombreHito(x)) + '</option>'; }).join('') +
        '</select><button type="button" class="boton boton-chico" id="dtb-anadir-hito">+ Añadir hito</button></div>';
      if (h) {
        t += '<div class="etiqueta">Tarea</div>';
        esperan(h).forEach(function (x) {
          t += '<label class="pt-op"><input type="radio" name="dtb-tarea" value="' + esc(x.id) + '"' + (S.tareaId === x.id ? ' checked' : '') + '><span>' + esc(x.texto) +
            '<br><small>' + (x.tipoDocumento ? 'Espera un documento de tipo ' + esc(x.tipoDocumento) + '.' : 'Espera un documento.') + ' Queda hecha.</small></span></label>';
        });
        t += '<label class="pt-op"><input type="radio" name="dtb-tarea" value="nueva"' + (S.tareaId === 'nueva' ? ' checked' : '') + '><span>Tarea nueva: «' + esc(tipo) +
          '»<br><small>' + esc(notaTareaNueva()) + '</small></span></label>';
      }
    }
    S.caja.innerHTML = t;
    enganchar();
  }

  function enganchar() {
    var c = S.caja, cambiar = c.querySelector('#dtb-cambiar'), sel = c.querySelector('#dtb-hito'), nuevo = c.querySelector('#dtb-anadir-hito');
    if (cambiar) cambiar.onclick = function () { S.aMano = true; pintar(); };
    if (sel) sel.onchange = function () {
      S.hitoId = sel.value; S.tareaId = ''; S.aMano = true; S.propuesta = false;
      pintar();
      var otra = S.caja.querySelector('#dtb-hito'); if (otra) otra.focus();
    };
    if (nuevo) nuevo.onclick = anadirHito;
    Array.prototype.forEach.call(c.querySelectorAll('input[name="dtb-tarea"]'), function (r) {
      r.onchange = function () { S.tareaId = r.value; S.aMano = true; };
    });
  }

  /* «+ Añadir hito»: la ventana de la fila 660, la misma. Al cerrarla, si hay un hito nuevo se vuelve con él puesto (y su tarea, si
     alguna espera este tipo). Si se cancela, el cuadro queda como estaba. */
  async function anadirHito() {
    var antes = [];
    try { antes = (await Hitos.hitosDe(S.a.nombre)).map(function (x) { return x.id; }); } catch (e) { antes = []; }
    var tanda = S;
    function alCerrar() { despuesDeAnadir(tanda, antes); }
    if (!window.AnadirHito) return;
    await AnadirHito.abrir(S.a, undefined, alCerrar);
  }

  async function despuesDeAnadir(tanda, antes) {
    if (S !== tanda || !tanda.caja.isConnected) return;
    try {
      await leerHitos();
      var nuevo = S.lista.filter(function (x) { return antes.indexOf(x.id) === -1; }).slice(-1)[0];
      if (!nuevo) return;
      var hallada = buscarPropuesta(S.tipo(), nuevo);
      S.aMano = false;
      S.hitoId = nuevo.id;
      if (hallada) { S.tareaId = hallada.g.id; S.propuesta = true; }
      else { S.tareaId = ''; S.propuesta = false; S.aMano = true; }
      pintar();
    } catch (e) { U.accesorio('No he podido poner al día el bloque de la tarea', e); }
  }

  /* `o`: { tipo: () => tipo elegido, hito: el hito desde el que se llega (o null), tarea: su tarea (o null) }. */
  async function montar(caja, a, o) {
    o = o || {};
    S = { caja: caja, a: a, tipo: o.tipo || function () { return ''; }, ultimoTipo: '', preferido: o.hito && o.hito.id || '',
          hitoId: '', tareaId: '', aMano: false, fijo: false, propuesta: false, lista: [], numerados: [], idActual: null };
    try { await leerHitos(); }
    catch (e) { U.accesorio('No he podido leer los hitos del asunto', e); }
    S.ultimoTipo = S.tipo();
    if (S.preferido && hitoPor(S.preferido)) {
      var hp = hitoPor(S.preferido);
      if (o.tarea && tareaPor(hp, o.tarea)) { S.hitoId = hp.id; S.tareaId = o.tarea; S.propuesta = true; S.fijo = true; }
      else {
        var hallada = buscarPropuesta(S.tipo(), hp);
        if (hallada) { S.hitoId = hp.id; S.tareaId = hallada.g.id; S.propuesta = true; }
        else { S.hitoId = hp.id; S.aMano = true; }
      }
    } else proponer();
    pintar();
  }

  /* Se llama en cada cambio del cuadro: solo hace algo si cambió el tipo. Sin nada elegido a mano, la propuesta se calcula otra vez;
     con algo elegido a mano (o traído de un hito y su tarea), no se toca: solo cambia el nombre de «Tarea nueva». */
  function cambioDeTipo() {
    if (!S || !S.caja || !S.caja.isConnected) return;
    var tipo = S.tipo();
    if (tipo === S.ultimoTipo) return;
    S.ultimoTipo = tipo;
    if (!S.aMano && !S.fijo) proponer();
    pintar();
  }

  /* { hitoId, tareaId } (tareaId null = tarea nueva) o { aviso }. */
  function destino() {
    if (!S || !S.caja || !S.caja.isConnected) return { aviso: 'Elige el hito y la tarea de los que cuelga el documento.' };
    if (!S.hitoId || !hitoPor(S.hitoId)) {
      return { aviso: S.lista.length ? 'Elige el hito y la tarea de los que cuelga el documento.' : 'Añade antes el hito del que cuelga el documento.' };
    }
    if (!S.tareaId) return { aviso: 'Elige la tarea de la que cuelga el documento.' };
    return { hitoId: S.hitoId, tareaId: S.tareaId === 'nueva' ? null : S.tareaId };
  }

  return { html: html, montar: montar, cambioDeTipo: cambioDeTipo, destino: destino };
})();
