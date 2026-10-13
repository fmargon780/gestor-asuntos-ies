/* ============================================================
   repartir-ficheros.js — «Repartir ficheros entre terceros» (fila 337,
   13-oct-2026, docs/REPARTIR-VARIOS-FICHEROS.md).

   El botón sale en la tarjeta «Documentos» de un asunto ABIERTO con al
   menos dos documentos (js/ficha-documentos.js). Pasos, todos en el mismo
   cuadro (U.preguntar ancho): 1. se marcan los ficheros (uno por alumno);
   2. la lista, una fila por fichero con su persona propuesta —primero por
   el nombre del fichero y, si es un PDF con texto, por lo de dentro; nunca
   por orden— y, a la derecha, el visor grande; 3. el resumen y
   «Confirmar y repartir» (js/repartir-crear.js, `repartirFicheros`).

   Comparte con js/repartir-pantalla.js el estado de relacionados y los
   ayudantes (`Repartir._interno`). Las cuentas, en js/repartir-nucleo.js.
   ============================================================ */
var RepartirFicheros = (function () {

  var N = RepartirNucleo;
  var F = null;   /* el estado del cuadro abierto */
  var ANCHO_MINI = 70;

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(t); }
  function interno() { return Repartir._interno; }

  function puede(a, cuantos) {
    return !!(window.Repartir && Repartir.puede(a)) && cuantos >= 2;
  }

  /* ---------- asignar y marcar ---------- */

  /* Fila 342: con filtro puesto, la lectura es entre TODO el alumnado (para poder avisar de quien está fuera). */
  function filtroActivo() { return !!(F.filtro && F.filtro.activo()); }

  function leidoDe(f) {
    if (filtroActivo()) {
      var n = N.leerTrozo(String(f.nombre || '').replace(/\.[A-Za-z0-9]{1,5}$/, ''), F.filtro.candidatos);
      if (n) return n;
      return F.hayTexto && f.texto ? F.filtro.leer(f.texto) : null;
    }
    var r = N.proponerPorNombre(f.nombre, F.personas);
    if (r) return r;
    return F.hayTexto && f.texto ? N.leerTrozo(f.texto, F.personas) : null;
  }

  /* Los nombres ya asignados a algún fichero (menos el fichero `salvo`). */
  function asignadosMenos(salvo) {
    var m = {};
    F.ficheros.forEach(function (x, j) { if (j !== salvo && x.tercero) m[x.tercero] = true; });
    return m;
  }

  /* Ya no quita nada: solo asigna a los que no tienen persona (también al cambiar el filtro). */
  function asignar() {
    var usados = asignadosMenos(-1);
    F.ficheros.forEach(function (f) {
      if (f.tercero) return;
      var r = leidoDe(f);
      if (filtroActivo()) {
        var av = RepartirFiltro.avisoDeLectura(F.filtro, r, usados);
        if (av && av.tipo === 'libre') { f.tercero = av.tercero; usados[av.tercero] = true; }
        return;
      }
      if (r && !usados[r.tercero]) { f.tercero = r.tercero; usados[r.tercero] = true; }
    });
  }

  function marcaDe(f) {
    if (!f.tercero) return 'ambar';
    var r = leidoDe(f);
    if (!r) return '';
    return (r.tercero === f.tercero && r.marca === 'verde') ? 'verde' : 'ambar';
  }

  var TEXTO_MARCA = { verde: 'Leído del documento', ambar: 'Revísalo', '': '' };

  /* ---------- 1. elegir los ficheros ---------- */

  function pintarElegir() {
    $('cuadro-cuerpo').innerHTML =
      '<p>Marca los ficheros que son de una persona cada uno (por ejemplo, todos menos el oficio).</p>' +
      '<div class="repartir-elegir">' + F.todos.map(function (f, i) {
        return '<label class="repartir-elegir-fila"><input type="checkbox" data-i="' + i + '"' + (f.marcado ? ' checked' : '') + '> ' + esc(f.nombre) + '</label>';
      }).join('') + '</div>' +
      '<div class="alta-tipo"><button type="button" class="boton boton-principal" id="repartir-seguir"' + (F.todos.some(function (f) { return f.marcado; }) ? '' : ' disabled') + '>Seguir</button></div>';
    Array.prototype.forEach.call($('cuadro-cuerpo').querySelectorAll('.repartir-elegir input'), function (c) {
      c.onchange = function () {
        F.todos[Number(c.dataset.i)].marcado = c.checked;
        $('repartir-seguir').disabled = !F.todos.some(function (f) { return f.marcado; });
      };
    });
    $('repartir-seguir').onclick = seguir;
  }

  async function seguir() {
    var boton = $('repartir-seguir');
    boton.disabled = true;
    boton.textContent = 'Leyendo los ficheros…';
    var ya = {};
    F.ficheros.forEach(function (f) { ya[f.nombre] = f; });
    var nuevos = [];
    for (var i = 0; i < F.todos.length; i++) {
      var t = F.todos[i];
      if (!t.marcado) continue;
      var f = ya[t.nombre] || { nombre: t.nombre, handle: t.handle, tercero: '', texto: '' };
      if (!ya[t.nombre] && PdfHerramientas.esPdf(t.nombre, '')) {
        try {
          var bytes = new Uint8Array(await (await t.handle.getFile()).arrayBuffer());
          f.pdfDoc = await interno().abrirPdf(bytes);
          f.texto = (await interno().textos(f.pdfDoc)).join(' ');
        } catch (e) { f.pdfDoc = null; f.texto = ''; }
      }
      nuevos.push(f);
    }
    F.ficheros = nuevos;
    F.hayTexto = nuevos.some(function (f) { return String(f.texto).trim(); });
    asignar();
    F.actual = -1;
    pintarLista();
  }

  /* ---------- 2. la lista ---------- */

  function opcionesTercero(f, i) {
    var asignados = asignadosMenos(i);
    var conFiltro = filtroActivo();
    var nombres = conFiltro ? RepartirFiltro.nombresParaElegir(F.filtro, asignados, f.tercero) : F.personas.map(function (p) { return p.tercero; });
    if (f.tercero && nombres.indexOf(f.tercero) === -1) nombres.push(f.tercero);
    return '<option value=""' + (!f.tercero ? ' selected' : '') + '>Sin asignar</option>' + nombres.map(function (n) {
      return '<option value="' + esc(n) + '"' + (f.tercero === n ? ' selected' : '') + '>' + esc(!conFiltro && asignados[n] ? interno().tachado(n) : n) + '</option>';
    }).join('');
  }

  function filaHTML(f, i) {
    var marca = marcaDe(f);
    return '<div class="repartir-trozo repartir-' + (marca || 'nada') + (i === F.actual ? ' repartir-actual' : '') + '" data-i="' + i + '">' +
      '<div class="repartir-minis">' + (f.pdfDoc ? '<canvas class="repartir-mini" data-i="' + i + '" width="' + ANCHO_MINI + '" height="' + Math.round(ANCHO_MINI * 1.41) + '"></canvas>' : '') + '</div>' +
      '<div class="repartir-datos">' +
        '<div><strong>' + esc(f.nombre) + '</strong></div>' +
        '<select class="campo repartir-tercero">' + opcionesTercero(f, i) + '</select>' +
        '<input class="campo repartir-buscar" list="repartir-alumnado" placeholder="Buscar a otra persona del alumnado…">' +
        (marca ? '<span class="repartir-marca repartir-marca-' + marca + '">' + esc(TEXTO_MARCA[marca]) + '</span>' : '') +
        avisosDelFiltro(f, i) +
      '</div></div>';
  }

  /* Fila 342: «Fuera del filtro» si lo asignado no está en el filtro; y, sin asignar, lo que se lee en el
     fichero cuando está fuera del filtro o ya tiene fichero. */
  function avisosDelFiltro(f, i) {
    if (!filtroActivo()) return '';
    if (f.tercero) return F.filtro.entra(f.tercero) ? '' : ' <span class="repartir-marca repartir-marca-ambar repartir-fuera">Fuera del filtro</span>';
    return RepartirFiltro.avisoHTML(RepartirFiltro.avisoDeLectura(F.filtro, leidoDe(f), asignadosMenos(i)));
  }

  /* La línea de cuentas de abajo. */
  function cuentasDelCuadro() {
    var asignados = asignadosMenos(-1);
    return RepartirFiltro.cuentasHTML({
      docs: F.ficheros.map(function (f, i) { return { f: f, i: i }; }).filter(function (x) { return !x.f.tercero; })
        .map(function (x) { return { i: x.i, texto: x.f.nombre }; }),
      alumnos: filtroActivo() ? F.filtro.nombres().filter(function (n) { return !asignados[n]; }) : null
    }, F.cuentas);
  }

  function alCambiarFiltro() {
    asignar();
    pintarLista();
  }

  function pintarLista() {
    var antes = document.querySelector('.repartir-lista');
    var top = antes ? antes.scrollTop : 0;
    pintarListaHtml();
    var lista = document.querySelector('.repartir-lista');
    if (!lista) return;
    lista.scrollTop = top;
    /* Fila 339: el fichero que toca ahora (el siguiente sin asignar) queda a la vista. */
    var fila = F.actual >= 0 ? lista.querySelector('.repartir-trozo[data-i="' + F.actual + '"]') : null;
    if (fila && F.bajar) lista.scrollTop = fila.offsetTop;
    F.bajar = false;
  }

  function pintarListaHtml() {
    var cuerpo = $('cuadro-cuerpo');
    var ficheros = F.ficheros;
    var tipos = (App.E.tipos || []).map(function (t) { return t.tipo; });
    var tiposDoc = (App.E.tiposDocumento || []).slice();
    var sel = interno().seleccionHTML;
    cuerpo.innerHTML = '<div class="repartir-dos"><div class="repartir-izq">' +
      (F.filtro ? RepartirFiltro.html(F.filtro) : '') +
      (F.personas.length || filtroActivo() ? '' : '<p class="aviso aviso-ambar">Este asunto no tiene terceros relacionados: se busca en todo el alumnado.</p>') +
      '<datalist id="repartir-alumnado">' + F.alumnado.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>' +
      '<div class="repartir-lista">' + ficheros.map(filaHTML).join('') + '</div>' +
      '<div class="repartir-abajo">' + cuentasDelCuadro() +
        '<label class="etiqueta">Crear para cada persona un asunto de tipo…</label>' + sel('repartir-tipo', tipos, F.tipo, 'Elige el tipo') +
        '<label class="etiqueta">Tipo de documento de cada fichero</label>' + sel('repartir-tipodoc', tiposDoc, F.tipoDocumento, 'Elige el tipo de documento') +
        '<p class="aviso-en-vivo" id="repartir-falta"></p>' +
        '<button type="button" class="boton" id="repartir-atras">Elegir otros ficheros</button> ' +
        '<button type="button" class="boton boton-principal" id="repartir-ir">Repartir</button>' +
      '</div></div>' +
      '<div class="repartir-visor" id="repartir-visor"><p class="suave repartir-visor-vacio">Pulsa un fichero para verlo aquí en grande.</p></div></div>';
    enganchar(cuerpo);
    pintarMiniaturas(cuerpo);
    if (F.actual >= 0 && ficheros[F.actual]) RepartirVisor.fichero($('repartir-visor'), ficheros[F.actual].nombre, ficheros[F.actual].handle);
  }

  function pintarMiniaturas(cuerpo) {
    Array.prototype.forEach.call(cuerpo.querySelectorAll('.repartir-mini'), function (c) {
      var f = F.ficheros[Number(c.dataset.i)];
      if (!f || !f.pdfDoc) return;
      f.pdfDoc.getPage(1).then(function (pag) {
        var base = pag.getViewport({ scale: 1 });
        var vp = pag.getViewport({ scale: ANCHO_MINI / base.width });
        c.width = vp.width; c.height = vp.height;
        return pag.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      }).catch(function () {});
    });
  }

  function ver(i) {
    F.actual = i;
    Array.prototype.forEach.call(document.querySelectorAll('.repartir-trozo'), function (fila) {
      fila.classList.toggle('repartir-actual', Number(fila.dataset.i) === i);
    });
    var f = F.ficheros[i];
    if (f) RepartirVisor.fichero($('repartir-visor'), f.nombre, f.handle);
  }

  function elegir(i, valor) {
    F.ficheros.forEach(function (x, j) { if (j !== i && valor && x.tercero === valor) x.tercero = ''; });
    F.ficheros[i].tercero = valor;
    /* El visor pasa solo al siguiente fichero sin asignar. */
    var siguiente = -1;
    for (var k = 1; k <= F.ficheros.length && valor; k++) {
      var j = (i + k) % F.ficheros.length;
      if (!F.ficheros[j].tercero) { siguiente = j; break; }
    }
    F.actual = siguiente >= 0 ? siguiente : i;
    F.bajar = valor && siguiente >= 0;
    pintarLista();
  }

  function enganchar(cuerpo) {
    if (F.filtro) RepartirFiltro.enganchar(F.filtro, cuerpo, alCambiarFiltro);
    RepartirFiltro.enganchaCuentas(cuerpo, F.cuentas, function () { pintarLista(); }, function (i) {
      ver(i);
      var fila = document.querySelector('.repartir-lista .repartir-trozo[data-i="' + i + '"]');
      if (fila) document.querySelector('.repartir-lista').scrollTop = fila.offsetTop;
    });
    Array.prototype.forEach.call(cuerpo.querySelectorAll('.repartir-trozo'), function (fila) {
      var i = Number(fila.dataset.i);
      fila.onclick = function (ev) { if (!ev.target.closest('button,select,input')) ver(i); };
      var s = fila.querySelector('.repartir-tercero');
      s.onchange = function () { elegir(i, s.value); };
      var igual = fila.querySelector('.repartir-igualmente');
      if (igual) igual.onclick = function () { elegir(i, igual.getAttribute('data-tercero')); };
      var buscar = fila.querySelector('.repartir-buscar');
      buscar.onchange = function () {
        var v = buscar.value.trim();
        if (F.alumnado.indexOf(v) === -1) return;
        if (!F.personas.some(function (p) { return p.tercero === v; })) {
          F.personas.push({ tercero: v, categoria: 'ALUMNADO' });
          F.deFuera.push({ categoria: 'ALUMNADO', nombre: v });
        }
        elegir(i, v);
      };
    });
    var tipo = cuerpo.querySelector('.repartir-tipo'), tdoc = cuerpo.querySelector('.repartir-tipodoc');
    tipo.onchange = function () { F.tipo = tipo.value; };
    tdoc.onchange = function () { F.tipoDocumento = tdoc.value; };
    $('repartir-atras').onclick = pintarElegir;
    $('repartir-ir').onclick = resumen;
  }

  /* ---------- 3. el resumen y el reparto ---------- */

  async function resumen() {
    var falta = $('repartir-falta');
    var aCrear = F.ficheros.filter(function (f) { return f.tercero; });
    if (!aCrear.length) {
      falta.className = 'aviso-en-vivo aviso-en-vivo-ambar';
      falta.textContent = 'No hay nada que repartir: ningún fichero tiene persona.';
      return;
    }
    if (!F.tipo || !F.tipoDocumento) {
      falta.className = 'aviso-en-vivo aviso-en-vivo-malo';
      falta.textContent = 'Elige el tipo de asunto y el tipo de documento de cada fichero.';
      return;
    }
    var conFichero = {};
    aCrear.forEach(function (f) { conFichero[f.tercero] = true; });
    var sinFichero = F.personas.filter(function (p) { return !conFichero[p.tercero]; }).map(function (p) { return p.tercero; });
    var yaTienen = await RepartirCrear.yaTienen(F.tipo);
    var repetidos = aCrear.map(function (f) { return f.tercero; }).filter(function (n) { return yaTienen[n]; });
    var sinAsignar = F.ficheros.filter(function (f) { return !f.tercero; });
    $('cuadro-cuerpo').innerHTML =
      '<p><strong>Se van a crear ' + aCrear.length + (aCrear.length === 1 ? ' asunto' : ' asuntos') + ' de tipo ' + esc(F.tipo) + ', ya archivados.</strong></p>' +
      (sinAsignar.length ? '<p class="aviso aviso-ambar">' + sinAsignar.length + (sinAsignar.length === 1 ? ' fichero se queda' : ' ficheros se quedan') +
        ' sin asignar y no se reparten: ' + sinAsignar.map(function (f) { return esc(f.nombre); }).join(', ') + '.</p>' : '') +
      sinFichero.map(function (n) { return '<p class="aviso aviso-ambar">' + esc(n) + ' se ha quedado sin fichero.</p>'; }).join('') +
      repetidos.map(function (n) {
        return '<label class="aviso aviso-ambar repartir-repetido"><input type="checkbox" checked data-tercero="' + esc(n) + '"> ' +
          esc(n) + ' ya tiene un asunto de ' + esc(F.tipo) + '. Crear igual</label>';
      }).join('') +
      '<p id="repartir-progreso" class="explica"></p>' +
      '<div class="alta-tipo"><button type="button" class="boton boton-principal" id="repartir-confirmar">Confirmar y repartir</button>' +
      '<button type="button" class="boton" id="repartir-volver">Volver</button></div>';
    $('repartir-volver').onclick = pintarLista;
    $('repartir-confirmar').onclick = confirmar;
  }

  async function confirmar() {
    var noCrear = {};
    Array.prototype.forEach.call(document.querySelectorAll('.repartir-repetido input'), function (c) { if (!c.checked) noCrear[c.dataset.tercero] = true; });
    var personas = {};
    F.personas.forEach(function (p) { personas[p.tercero] = { categoria: p.categoria }; });
    /* Fila 342: si se ha usado el filtro, quedan relacionados solo los que reciben fichero. */
    var deFuera = F.deFuera;
    if (F.filtro && F.filtro.usado) {
      var antes = {}, nuevos = {};
      F.originales.forEach(function (n) { antes[n] = true; });
      deFuera = [];
      F.ficheros.forEach(function (f) {
        if (!f.tercero || antes[f.tercero] || nuevos[f.tercero]) return;
        nuevos[f.tercero] = true;
        deFuera.push({ categoria: 'ALUMNADO', nombre: f.tercero });
        if (!personas[f.tercero]) personas[f.tercero] = { categoria: 'ALUMNADO' };
      });
    }
    var cerrar = $('cuadro-aceptar');
    cerrar.disabled = true;
    $('repartir-confirmar').disabled = true;
    $('repartir-volver').disabled = true;
    var progreso = $('repartir-progreso');
    var resultados = [];
    try {
      resultados = await RepartirCrear.repartirFicheros(F.origen, F.ficheros.filter(function (f) { return f.tercero; }), {
        tipo: F.tipo, tipoDocumento: F.tipoDocumento, noCrear: noCrear, personas: personas, deFuera: deFuera
      }, function (n, total) { progreso.textContent = 'Creando ' + n + ' de ' + total + '…'; });
    } catch (e) {
      U.fallo('No he podido repartirlo', e);
    }
    cerrar.disabled = false;
    var hechos = resultados.filter(function (r) { return r.ok; }).length;
    var fallos = resultados.filter(function (r) { return !r.ok; });
    progreso.textContent = fallos.length
      ? 'Hecho, con fallos: ' + fallos.map(function (r) { return r.nombre + ' (' + r.tercero + ')'; }).join(', ') + '. Vuelve a abrir el cuadro: esos ficheros siguen en el asunto.'
      : 'Hecho.';
    if (fallos.length) U.aviso(hechos + ' asuntos creados y archivados; fallaron ' + fallos.length + '.', 'ambar');
    else if (resultados.length) U.aviso(hechos + (hechos === 1 ? ' asunto creado y archivado.' : ' asuntos creados y archivados.'), 'bueno');
    if (F && F.alTerminar) { try { F.alTerminar(); } catch (e2) { /* solo pintar */ } }
  }

  /* ---------- abrir ---------- */

  async function abrir(contexto) {
    var a = contexto.asunto;
    var lista = await Carpetas.ficheros(a.handle);
    if (window.IndiceExpediente) lista = IndiceExpediente.fuera(lista);
    var ficha = (App.E.registro.asuntos || {})[a.nombre] || a.ficha || {};
    var alumnado = [], fuente = null;
    try {
      if (App.E.datos) {
        fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
        alumnado = fuente.lista.map(function (p) { return App.textoTercero(p); });
      }
    } catch (e) { alumnado = []; fuente = null; }
    var tipoOrigen = interno().tipoPorNombre((a.leido && a.leido.tipo) || ficha.tipo) || {};
    F = {
      origen: { nombre: a.nombre, handle: a.handle, ficha: ficha },
      alTerminar: contexto.alTerminar, alumnado: alumnado, deFuera: [], ficheros: [], hayTexto: false, actual: -1,
      todos: lista.map(function (f) { return { nombre: f.nombre, handle: f.handle, marcado: false }; }),
      personas: (ficha.relacionados || []).map(function (r) { return { tercero: r.nombre, categoria: r.categoria || 'ALUMNADO' }; }),
      tipo: tipoOrigen.repartirTipo || '', tipoDocumento: tipoOrigen.repartirTipoDocumento || ''
    };
    F.originales = F.personas.map(function (p) { return p.tercero; });
    F.cuentas = { ver: '' };
    F.filtro = null;
    try { F.filtro = fuente ? await RepartirFiltro.crear(fuente, F.personas) : null; } catch (e3) { F.filtro = null; }
    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.add('cuadro-ancho', 'cuadro-repartir');
    var promesa = U.preguntar('Repartir ficheros entre terceros', '', 'Cerrar', true);
    pintarElegir();
    await promesa;
    if (cuadro) cuadro.classList.remove('cuadro-ancho', 'cuadro-repartir');
    F = null;
  }

  return { abrir: abrir, puede: puede };
})();
window.RepartirFicheros = RepartirFicheros;
