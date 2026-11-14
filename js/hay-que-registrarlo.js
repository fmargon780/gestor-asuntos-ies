/* ============================================================
   hay-que-registrarlo.js — la casilla «Hay que registrarlo» (14-nov-2026, fila 670, docs/667-HAY-QUE-REGISTRARLO.md; tema 667).

   Sustituye a «Pendiente de registro». La casilla no hace nada hasta «Guardar»: entonces el documento cuelga de una tarea
   «Registrar» sin hacer del hito (la que ya había con este documento, o la que espera su tipo de documento), o se crea esa
   tarea. Aquí:

     - `cuelga(a, nombre)`: ¿el documento ya cuelga de una tarea «Registrar» sin hacer? (la casilla sale ya marcada).
     - `hitoDelDocumento(a, nombre)`: el hito del que cuelga el documento (donde está apuntado), o ''.
     - `html()` / `montar(caja, a)` / `hitoElegido()`: el desplegable «Hito» (con «+ Añadir hito») que sale al marcar la casilla
       cuando no se sabe el hito.
     - `aplicar(a, hitoId, nombre, tipo, viejo)`: al guardar, cuelga el documento de la tarea «Registrar» (existente o nueva).
     - `migrar(a)`: pasa solo a tareas «Registrar» las marcas antiguas «Pendiente de registro» (`ficha.pendientesRegistro`).
   ============================================================ */
window.HayQueRegistrarlo = (function () {

  var migrados = {};
  var S = null;

  function esc(t) { return U.escapar(t == null ? '' : String(t)); }
  function norm(t) { return U.normalizar(String(t || '')); }

  function abierta(g) { return !!g && !g.pregunta && !g.hecho && !g.noaplica && g.accion === 'registrar'; }

  function guion(a, h) { try { return Hitos.guionDe(a, h); } catch (e) { return []; } }

  function docDe(h, g) { var e = window.TareasConDocumento ? TareasConDocumento.de(h, g.id) : null; return (e && e.doc) || ''; }

  function mismo(x, y) { return window.TareasConDocumento ? TareasConDocumento.mismo(x, y) : (!!x && x === y); }

  /* Los hitos que se ven (con los de las opciones), sin preguntas. */
  function elegibles(hitos) { return window.DocumentoATarea ? DocumentoATarea.hitosElegibles(hitos) : []; }

  async function hitosDe(a) { try { return await Hitos.hitosDe(a.nombre); } catch (e) { return []; } }

  /* ¿Cuelga el documento de una tarea «Registrar» sin hacer, en algún hito? */
  async function cuelga(a, nombre) {
    var hitos = await hitosDe(a);
    var si = false;
    TareasConDocumento.recorrer(hitos, function (h) {
      guion(a, h).forEach(function (g) { if (abierta(g) && docDe(h, g) && mismo(docDe(h, g), nombre)) si = true; });
    });
    return si;
  }

  /* El hito donde está apuntado el documento (el último que lo tiene), o ''. */
  async function hitoDelDocumento(a, nombre) {
    var hitos = elegibles(await hitosDe(a));
    var id = '';
    hitos.forEach(function (h) { if ((h.documentos || []).some(function (n) { return mismo(n, nombre); })) id = h.id; });
    return id;
  }

  /* ---------- la tarea ---------- */

  /* Cuelga `nombre` de una tarea «Registrar» sin hacer del hito `hitoId`: la que ya lo tiene (o tenía `viejo`); si no, una que
     espera su tipo de documento y aún no tiene documento; si no, crea «Registrar» con «Qué documento» = el tipo. Devuelve true. */
  async function aplicar(a, hitoId, nombre, tipo, viejo) {
    var hitos = await hitosDe(a);
    var h = Hitos.buscar(hitos, hitoId);
    if (!h) throw new Error('Ese hito ya no está.');
    var abiertas = guion(a, h).filter(abierta);
    var suya = abiertas.filter(function (g) { var d = docDe(h, g); return d && (mismo(d, nombre) || (viejo && mismo(d, viejo))); })[0];
    if (!suya) {
      suya = abiertas.filter(function (g) { return !docDe(h, g) && tipo && g.tipoDocumento && norm(g.tipoDocumento) === norm(tipo); })[0];
    }
    if (!suya) {
      var extras = { accion: 'registrar' };
      if (tipo) extras.tipoDocumento = tipo;
      if (!(await DondeSeGuardaTareas.nueva(a, h, 'Registrar', null, extras))) throw new Error('No he podido crear la tarea «Registrar».');
      var h2 = Hitos.buscar(await hitosDe(a), hitoId) || h;
      var propias = guion(a, h2).filter(function (g) { return abierta(g) && !docDe(h2, g); });
      suya = propias[propias.length - 1];
      if (!suya) throw new Error('No he podido crear la tarea «Registrar».');
    }
    await TareasConDocumento.asignar(a.nombre, hitoId, suya.id, nombre);
    if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
    return true;
  }

  /* ---------- el desplegable «Hito» (cuando no se sabe el hito) ---------- */

  function html() {
    return '<div class="bloque-tarea oculto" id="doc-registrar-hito"></div>';
  }

  async function leer() {
    var datos = await Hitos.leer();
    var entrada = datos.porAsunto[S.a.nombre];
    var hitos = entrada ? entrada.hitos : [];
    S.lista = elegibles(hitos);
    S.numerados = Hitos.numerados ? Hitos.numerados(hitos) : S.lista;
  }

  function pintar() {
    var n = S.lista.length;
    S.caja.innerHTML = '<label class="etiqueta" for="doc-registrar-hito-sel">Hito</label><div class="hito-linea">' +
      '<select id="doc-registrar-hito-sel" class="campo"' + (n ? '' : ' disabled') + '><option value="">' + (n ? 'Elige el hito…' : 'No hay hitos') + '</option>' +
      S.lista.map(function (x) {
        var i = S.numerados.indexOf(x) + 1;
        return '<option value="' + esc(x.id) + '"' + (x.id === S.id ? ' selected' : '') + '>' + (i ? i + '. ' : '') + esc(x.titulo || 'Hito') + '</option>';
      }).join('') + '</select><button type="button" class="boton boton-chico" id="doc-registrar-hito-nuevo">+ Añadir hito</button></div>' +
      '<p class="suave">La tarea «Registrar» va a ese hito.</p>';
    S.caja.querySelector('#doc-registrar-hito-sel').onchange = function (e) { S.id = e.target.value; };
    S.caja.querySelector('#doc-registrar-hito-nuevo').onclick = anadirHito;
  }

  async function anadirHito() {
    var tanda = S;
    var antes = [];
    try { antes = (await Hitos.hitosDe(S.a.nombre)).map(function (x) { return x.id; }); } catch (e) { antes = []; }
    if (!window.AnadirHito) return;
    await AnadirHito.abrir(S.a, undefined, async function () {
      if (S !== tanda || !tanda.caja.isConnected) return;
      try {
        await leer();
        var nuevo = S.lista.filter(function (x) { return antes.indexOf(x.id) === -1; }).slice(-1)[0];
        if (nuevo) S.id = nuevo.id;
        pintar();
      } catch (e2) { U.accesorio('No he podido poner al día la lista de hitos', e2); }
    });
  }

  /* `caja`: el `html()` ya puesto en el cuadro. Se enseña cuando se marca la casilla. */
  async function montar(caja, a) {
    S = { caja: caja, a: a, id: '', lista: [], numerados: [] };
    try { await leer(); } catch (e) { U.accesorio('No he podido leer los hitos del asunto', e); }
    pintar();
  }

  function mostrar(si) {
    var c = document.getElementById('doc-registrar-hito');
    if (c) c.classList.toggle('oculto', !si);
  }

  function hitoElegido() {
    var c = document.getElementById('doc-registrar-hito');
    return S && c && c === S.caja ? S.id : '';
  }

  /* ---------- las marcas antiguas ---------- */

  function nombreDe(p) { return typeof p === 'string' ? p : ((p && p.nombre) || ''); }

  /* Las marcas «Pendiente de registro» de un asunto pasan solas a tareas «Registrar». Una vez por asunto y sesión. */
  async function migrar(a) {
    if (!a || !a.nombre || migrados[a.nombre] || !window.Hitos || !window.DondeSeGuardaTareas) return;
    var lista = ((a.ficha && a.ficha.pendientesRegistro) || []).map(nombreDe).filter(Boolean);
    if (!lista.length) return;
    migrados[a.nombre] = true;
    var pasados = [], tareas = [];
    for (var i = 0; i < lista.length; i++) {
      var n = lista[i];
      try {
        if (window.Registro && Registro.tieneRegistro(n, a)) { pasados.push(n); continue; }
        if (await cuelga(a, n)) { pasados.push(n); continue; }
        var hitos = await hitosDe(a);
        var buenos = elegibles(hitos);
        var propio = buenos.filter(function (h) { return (h.documentos || []).some(function (x) { return mismo(x, n); }); })[0] ||
          buenos.filter(function (h) { return h.estado !== 'hecho'; })[0];
        if (!propio) continue;   /* sin hitos: se queda la marca antigua hasta que se registre */
        var leido = window.Documentos && Documentos.leerNombre ? Documentos.leerNombre(n, a.ficha) : {};
        await aplicar(a, propio.id, n, (leido && leido.tipo) || '');
        pasados.push(n);
        tareas.push(n);
      } catch (e) { /* este se queda con su marca y se vuelve a intentar en otra sesión */ }
    }
    if (pasados.length) {
      try { await App.anotarLista(a.nombre, 'pendientesRegistro', { quitar: pasados }); } catch (e2) { /* se reintenta otro día */ }
    }
    if (tareas.length && window.RegistroAsunto) {
      await RegistroAsunto.auto(a, 'Las marcas «Pendiente de registro» (' + tareas.length + ') pasan a tareas «Registrar».', null);
    }
  }

  return { cuelga: cuelga, hitoDelDocumento: hitoDelDocumento, aplicar: aplicar, html: html, montar: montar, mostrar: mostrar,
           hitoElegido: hitoElegido, migrar: migrar };
})();
