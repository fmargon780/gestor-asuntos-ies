/* ============================================================
   grupo-registro.js — reconocer los PDF sellados de Séneca, persona por persona
   (fila 294, docs/TRABAJO-EN-BLOQUE-PDF-Y-REGISTRO.md, apartado 4).

   El registro se sigue haciendo en Séneca, a mano. Aquí solo se reconoce lo que vuelve:
     - Cada PDF de un trabajo en bloque lleva escrito como texto su número de documento
       («Ref. D26-01234», js/grupo-generar.js). Séneca añade su sello sin tocar las páginas.
     - Cuando en la carpeta aparece un PDF con sello que no tiene nombre de la aplicación
       (`RegistroSellado.detectar`) se busca su referencia: primero en el nombre del fichero, después en el
       texto del PDF (sin espacios: pdf.js parte el texto). Con una sola referencia que cuadra (documento de
       este asunto, sin registro, que sigue en la carpeta) se coloca sin preguntar con `RegistroSellado.asociar`.
       Con varias, una por página o grupo de páginas seguidas, se parte por referencia y cada trozo sigue ese
       camino. Sin referencia, o si no cuadra, NO se decide: sale en la tarjeta, «PDF sellados sin colocar»,
       con «¿De quién es?». Un registro mal puesto es peor que una pregunta.
     - Solo en un asunto con `ficha.registroPorPersona` (la casilla «Estos documentos se registran en Séneca»;
       sale marcada sola si el hito actual tiene una tarea de registrar).
     - Se mira al abrir la ficha (`PersonasDelGrupo.pintar`) y en la pasada de fondo
       (`HacerEsteHitoSello.alRefrescar`): no en solo consulta, no con un guardado en marcha, no si el
       compañero tiene el mando, nunca dos a la vez.
   ============================================================ */
var GrupoRegistro = (function () {

  var REF = /D\d{2}-\d{5}/g;
  var ESPERA_ENTRE_PASADAS = 15000;
  var corriendo = {};      /* por asunto: ya se está mirando */
  var ultimoSin = {};      /* por asunto: lo que quedó sin colocar */
  var analisis = {};       /* por asunto|nombre|tamaño: qué referencias trae */
  var pasando = false, ultimaPasada = 0;

  function fichaDe(a) {
    var viva = a && window.App && App.E && App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre];
    return viva || (a && a.ficha) || {};
  }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function hitoActual(a) { return window.PersonasDelGrupo && PersonasDelGrupo.hitoActual ? PersonasDelGrupo.hitoActual(a) : null; }

  /* La casilla: lo que se haya elegido; si no se ha tocado, marcada si el hito actual tiene una tarea de registrar. */
  function activo(a) {
    var f = fichaDe(a);
    if (typeof f.registroPorPersona === 'boolean') return f.registroPorPersona;
    try {
      var h = hitoActual(a);
      return !!(h && window.Hitos && Hitos.guionDe(a, h).some(function (g) { return g.accion === 'registrar'; }));
    } catch (e) { return false; }
  }

  /* ¿Hay documentos generados sin registro? (una mirada a la ficha, sin tocar la carpeta). */
  function hayPendientes(a) {
    var docs = fichaDe(a).documentos || {};
    return Object.keys(docs).some(function (n) { return docs[n] && docs[n].generadoDe && docs[n].generadoDe !== 'informe-actividad' && !(docs[n].registros || []).length; });   /* fila 309: el informe de la actividad no se registra */
  }

  function puedeEscribir(a) {
    if (soloConsulta()) return false;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return false;
    if (window.Presencia && Presencia.ocupantePor && Presencia.ocupantePor(a.nombre)) return false;
    return true;
  }

  /* ---------- las referencias ---------- */

  /* Sin espacios (pdf.js parte el texto), las `D26-01234` distintas, en orden. */
  function refsEn(texto) {
    var t = String(texto || '').replace(/\s+/g, '');
    var salida = [], m;
    REF.lastIndex = 0;
    while ((m = REF.exec(t))) { if (salida.indexOf(m[0]) === -1) salida.push(m[0]); }
    return salida;
  }

  /* De las referencias de cada página, los trozos [{ ref, paginas }] de páginas seguidas; null si no cuadra
     (una página con dos referencias, la primera sin ninguna, o la misma en dos sitios separados). */
  function trozosPorReferencia(porPagina) {
    var trozos = [], vistas = [];
    for (var i = 0; i < porPagina.length; i++) {
      var l = porPagina[i], ref;
      if (l.length > 1) return null;
      if (l.length === 1) ref = l[0];
      else if (trozos.length) ref = trozos[trozos.length - 1].ref;   /* sin referencia: sigue con el trozo anterior */
      else return null;
      var ultimo = trozos[trozos.length - 1];
      if (ultimo && ultimo.ref === ref) { ultimo.paginas.push(i); continue; }
      if (vistas.indexOf(ref) !== -1) return null;
      vistas.push(ref);
      trozos.push({ ref: ref, paginas: [i] });
    }
    return trozos;
  }

  async function referenciasDe(a, d, lista) {
    var f = lista.filter(function (x) { return x.nombre === d.nombre; })[0];
    if (!f) return null;
    var fichero = await f.handle.getFile();
    var clave = a.nombre + '|' + d.nombre + '|' + fichero.size;
    if (analisis[clave]) return analisis[clave];
    var res = { ref: '', trozos: null };
    var deNombre = refsEn(d.nombre);
    if (deNombre.length === 1) res.ref = deNombre[0];
    else {
      var paginas = (window.RegistroLector && await RegistroLector.textoPorPagina(fichero)) || [];
      var porPagina = paginas.map(refsEn), todas = [];
      porPagina.forEach(function (l) { l.forEach(function (r) { if (todas.indexOf(r) === -1) todas.push(r); }); });
      if (todas.length === 1) res.ref = todas[0];
      else if (todas.length > 1) res.trozos = trozosPorReferencia(porPagina);
    }
    analisis[clave] = res;
    return res;
  }

  /* El documento de la aplicación al que se le pone este registro: de este asunto, sin registro y que sigue en
     la carpeta (mejor su PDF que su Word). '' si no cuadra. */
  function originalDe(a, ref, lista) {
    var f = fichaDe(a), doc = (f.documentos || {})[ref];
    if (!doc || !doc.generadoDe || (doc.registros || []).length) return '';
    var partes = String(doc.generadoDe).split('|'), nombre = partes.slice(2).join('|');
    if (!(f.relacionados || []).some(function (r) { return r.categoria === partes[1] && r.nombre === nombre; })) return '';
    var cand = lista.map(function (x) { return x.nombre; }).filter(function (n) { return n.indexOf(ref) !== -1 && Documentos.pareceDeLaAplicacion(n); });
    return cand.filter(function (n) { return /\.pdf$/i.test(n); })[0] || cand[0] || '';
  }

  /* Qué hacer con un PDF sellado: { tipo: 'una', original } | { tipo: 'varias', trozos } | null (preguntar). */
  async function planDe(a, d, lista) {
    var info = await referenciasDe(a, d, lista);
    if (!info) return null;
    if (info.ref) {
      var original = originalDe(a, info.ref, lista);
      return original ? { tipo: 'una', original: original } : null;
    }
    if (info.trozos && info.trozos.length > 1 && info.trozos.every(function (t) { return originalDe(a, t.ref, lista); })) {
      return { tipo: 'varias', trozos: info.trozos };
    }
    return null;
  }

  /* Un PDF con varias referencias: un fichero por referencia, y el entero a «Versiones previas». */
  async function partir(a, d, trozos, lista) {
    var f = lista.filter(function (x) { return x.nombre === d.nombre; })[0];
    var bytes = new Uint8Array(await (await f.handle.getFile()).arrayBuffer());
    var base = d.nombre.replace(/\.pdf$/i, ''), nombres = lista.map(function (x) { return x.nombre; }), escritos = [];
    try {
      for (var i = 0; i < trozos.length; i++) {
        var nombre = RegistroSellado.nombreLibreEntre(nombres, base + ' (' + (i + 1) + ' de ' + trozos.length + ').pdf');
        await Carpetas.escribirBytes(a.handle, nombre, await PdfHerramientas.sacarPaginas(bytes, trozos[i].paginas), 'application/pdf');
        nombres.push(nombre);
        escritos.push(nombre);
      }
    } catch (e) {
      for (var j = 0; j < escritos.length; j++) { try { await a.handle.removeEntry(escritos[j]); } catch (e2) { /* se queda */ } }
      throw e;
    }
    if (window.VersionesPrevias) await VersionesPrevias.mover(a.handle, d.nombre);
    return escritos.length;
  }

  /* «No es de este trabajo»: se acuerda este ordenador y lo deja para el aviso de siempre de la ficha. */
  function claveNoEs(a) { return 'grupo-no-es:' + a.nombre; }
  async function leerNoEs(a) { return (await Almacen.leer(claveNoEs(a))) || []; }

  /* ---------- mirar la carpeta ---------- */

  async function trabajar(a, profundidad) {
    var escribir = puedeEscribir(a);
    var noEs = await leerNoEs(a);
    var detectados = (await RegistroSellado.detectar(a)).filter(function (d) { return noEs.indexOf(d.nombre) === -1; });
    var sin = [], colocados = 0, partidos = 0;
    for (var i = 0; i < detectados.length; i++) {
      var d = detectados[i];
      var lista = await Carpetas.ficheros(a.handle);
      var plan = await planDe(a, d, lista);
      if (plan && escribir) {
        if (plan.tipo === 'una') {
          if (await RegistroSellado.asociar(a, d.nombre, plan.original, d.sello)) { colocados++; continue; }
        } else if (await partir(a, d, plan.trozos, lista)) { partidos++; continue; }
      }
      var s = d.sello;
      sin.push({ nombre: d.nombre, sello: s, codigo: Nombres.codigoRegistro({ ano: s.anio, sentido: s.tipo, modo: s.serie, numero: s.numero }) || '' });
    }
    if (partidos && !profundidad) {   /* cada trozo sigue el camino de uno solo */
      var otra = await trabajar(a, 1);
      return { sinColocar: otra.sinColocar, colocados: colocados + otra.colocados };
    }
    return { sinColocar: sin, colocados: colocados };
  }

  /* Devuelve { sinColocar: [{ nombre, sello, codigo }], colocados }. */
  async function revisar(a) {
    if (!window.RegistroSellado || !a || !a.handle) return { sinColocar: [], colocados: 0 };
    if (corriendo[a.nombre]) return { sinColocar: ultimoSin[a.nombre] || [], colocados: 0 };
    corriendo[a.nombre] = true;
    try {
      var r = await trabajar(a, 0);
      ultimoSin[a.nombre] = r.sinColocar;
      if (r.colocados && puedeEscribir(a)) await marcarSiTodos(a);
      return r;
    } catch (e) {
      return { sinColocar: ultimoSin[a.nombre] || [], colocados: 0 };
    } finally { corriendo[a.nombre] = false; }
  }

  /* Todas las personas con documento ya tienen registro: la tarea de registrar del hito actual, una vez. */
  async function marcarSiTodos(a) {
    if (fichaDe(a).registroPorPersonaMarcado || !window.PersonasDelGrupo) return;
    var nombres = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; });
    var est = PersonasDelGrupo.estado(a, nombres);
    if (!est.trabajos.length) return;
    var c = PersonasDelGrupo.cuentas(est, est.trabajos[est.trabajos.length - 1].clave);
    if (!c.generados || c.registrados !== c.generados) return;
    var h = hitoActual(a);
    try {
      if (h && window.Hitos && Hitos.marcarGuionPorAccion) await Hitos.marcarGuionPorAccion(a, h.id, 'registrar');
      await App.anotar(a.nombre, { registroPorPersonaMarcado: U.ahora() });
    } catch (e) { U.accesorio('Están registrados, pero no he podido marcar la tarea', e); return; }
    U.aviso('Los ' + c.generados + ' están registrados.', 'bueno');
  }

  /* La pasada de fondo, solo sobre los asuntos con la casilla y alguien pendiente. */
  async function pasada() {
    if (pasando || !window.RegistroSellado || !window.Gestor || !Gestor.carpetaGestor()) return;
    if (soloConsulta()) return;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
    if (Date.now() - ultimaPasada < ESPERA_ENTRE_PASADAS) return;
    pasando = true;
    ultimaPasada = Date.now();
    try {
      var abiertos = Gestor.asuntos ? Gestor.asuntos() : [];
      for (var i = 0; i < abiertos.length; i++) {
        var a = abiertos[i];
        if (!hayPendientes(a) || !activo(a) || !puedeEscribir(a)) continue;
        var r = await revisar(a);
        if (r.colocados && window.PersonasDelGrupo) PersonasDelGrupo.repintar(a);
      }
    } catch (e) { /* una mirada de fondo: se vuelve a mirar en el siguiente refresco */
    } finally { pasando = false; }
  }

  /* El aviso ámbar de la ficha no sale por estos PDF (van a la lista), salvo los de «No es de este trabajo». */
  async function filtrarAviso(a, detectados) {
    if (!detectados.length || !activo(a) || !hayPendientes(a)) return detectados;
    var noEs = await leerNoEs(a);
    return detectados.filter(function (d) { return noEs.indexOf(d.nombre) !== -1; });
  }

  /* ---------- lo que pinta la tarjeta ---------- */

  function pendientesDe(est, trabajo) {
    var salida = [];
    est.personas.forEach(function (p, i) {
      var h = trabajo && p.hechos[trabajo];
      if (h && h.generado && !h.registrado.length) salida.push({ i: i, persona: p, fichero: h.generado.fichero });
    });
    return salida;
  }

  function soloElNombre(t) { return String(t || '').replace(/\s+\S*\d\S*\s*$/, '').trim(); }

  function html(est, trabajo, conRegistro, sin) {
    var salida = '<label class="pg-registro-casilla"><input type="checkbox" class="pg-registro-por" data-solo-lectura' + (conRegistro ? ' checked' : '') +
      '> Estos documentos se registran en Séneca</label>';
    if (!conRegistro) return salida;
    var pend = pendientesDe(est, trabajo);
    if (pend.length) {
      salida += '<p class="pg-registro-linea">' + (pend.length === 1 ? 'Firma y registra el documento en Séneca y guarda aquí el PDF que descargues.'
        : 'Firma y registra los ' + pend.length + ' en Séneca y guarda aquí los PDF que descargues.') + ' <span class="pg-ruta"></span></p>';
    }
    if (sin.length) {
      salida += '<div class="aviso aviso-ambar pg-sin-colocar"><strong>PDF sellados sin colocar (' + sin.length + ')</strong><ul>' +
        sin.map(function (s, k) {
          return '<li data-k="' + k + '"><span class="pg-sc-codigo">' + U.escapar(s.codigo || '(sin número)') + '</span>' +
            '<span class="suave">' + U.escapar(s.nombre) + '</span>' +
            '<button type="button" class="boton boton-chico pg-sc-ver" data-solo-lectura>Ver</button>' +
            '<select class="campo pg-sc-quien" data-solo-lectura><option value="">¿De quién es?</option>' +
              pend.map(function (x) { return '<option value="' + x.i + '">' + U.escapar(soloElNombre(x.persona.nombre) || x.persona.nombre) + '</option>'; }).join('') +
            '</select>' +
            '<button type="button" class="boton boton-chico pg-sc-no" data-solo-lectura>No es de este trabajo</button></li>';
        }).join('') + '</ul></div>';
    }
    return salida;
  }

  /* Engancha lo que ha pintado `html`. `alCambiar()`: volver a pintar la tarjeta. */
  function enganchar(caja, a, est, trabajo, sin, propia, alCambiar) {
    var casilla = caja.querySelector('.pg-registro-por');
    casilla.disabled = !propia;
    casilla.onchange = async function () {
      try { await App.anotar(a.nombre, { registroPorPersona: casilla.checked }); }
      catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
      alCambiar();
    };
    var sitio = caja.querySelector('.pg-ruta');
    if (sitio && window.RutaCarpetas) sitio.appendChild(RutaCarpetas.boton(a, 'abierto'));
    var pend = pendientesDe(est, trabajo);
    Array.prototype.forEach.call(caja.querySelectorAll('.pg-sin-colocar li'), function (li) {
      var s = sin[parseInt(li.dataset.k, 10)];
      var quien = li.querySelector('.pg-sc-quien');
      quien.disabled = !propia;
      li.querySelector('.pg-sc-no').disabled = !propia;
      li.querySelector('.pg-sc-ver').onclick = async function () {
        try { if (window.Visor) Visor.abrir(await a.handle.getFileHandle(s.nombre), s.nombre, { asunto: a, carpeta: a.handle }); }
        catch (e) { U.aviso('Ya no está ese PDF en la carpeta.', 'ambar'); }
      };
      quien.onchange = async function () {
        if (quien.value === '') return;
        var x = pend.filter(function (p) { return String(p.i) === quien.value; })[0];
        if (!x) return;
        quien.disabled = true;
        var nuevo = await RegistroSellado.asociar(a, s.nombre, x.fichero, s.sello);
        if (nuevo) delete analisis[a.nombre + '|' + s.nombre];
        alCambiar();
      };
      li.querySelector('.pg-sc-no').onclick = async function () {
        var lista = await leerNoEs(a);
        if (lista.indexOf(s.nombre) === -1) lista.push(s.nombre);
        await Almacen.guardar(claveNoEs(a), lista);
        alCambiar();
      };
    });
  }

  return { activo: activo, hayPendientes: hayPendientes, revisar: revisar, pasada: pasada, filtrarAviso: filtrarAviso,
           html: html, enganchar: enganchar, pendientesDe: pendientesDe,
           _interno: { refsEn: refsEn, trozosPorReferencia: trozosPorReferencia, reiniciar: function () { ultimaPasada = 0; analisis = {}; } } };
})();
window.GrupoRegistro = GrupoRegistro;
