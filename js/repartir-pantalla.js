/* ============================================================
   repartir-pantalla.js — «Repartir entre terceros» (fila 141,
   25-sep-2026, docs/REPARTIR-ENTRE-TERCEROS.md): el cuadro.

   Sale en el menú de cada PDF de la ficha de un asunto ABIERTO
   (js/ficha-documentos.js). Parte el PDF en trozos (uno por persona),
   con miniaturas, +1/−1 página, el tercero de cada trozo (los
   relacionados del asunto, por orden, o el que se lea en el propio PDF
   si trae texto) y su marca: verde «Leído del documento», ámbar
   «Revísalo», o nada. Debajo, el tipo de asunto que se crea y los tipos
   de documento. «Repartir» enseña el resumen EN EL MISMO CUADRO y
   «Confirmar y repartir» lo hace (js/repartir-crear.js).

   Las cuentas, sin pantalla, en js/repartir-nucleo.js.
   ============================================================ */
var Repartir = (function () {

  var N = RepartirNucleo;
  var QUEDARSE = '__quedarse';
  var ANCHO_MINI = 70, MAX_MINIS = 8;
  var E = null;   /* el estado del cuadro abierto */

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(t); }
  function tachado(t) { return String(t).split('').map(function (c) { return c + '̶'; }).join(''); }

  function tipoPorNombre(nombre) {
    return (App.E.tipos || []).filter(function (t) { return t.tipo === nombre; })[0] || null;
  }

  /* ---------- leer el PDF ---------- */

  async function abrirPdf(bytes) {
    var pdfjsLib = await App.cargarPdfJs();
    return pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  }

  /* `cadaPagina(n, texto)`, si se da, se llama con cada página leída (fila 343: quién es); cada 10 páginas se cede el paso
     a la pantalla y se pone «Leyendo página N de M…» dentro del cuadro. */
  async function textos(pdfDoc, cadaPagina) {
    var salida = [];
    for (var n = 1; n <= pdfDoc.numPages; n++) {
      var t = '';
      try {
        var c = await (await pdfDoc.getPage(n)).getTextContent();
        t = c.items.map(function (i) { return i.str; }).join(' ');
      } catch (e) { t = ''; }
      salida.push(t);
      if (cadaPagina) {
        try { cadaPagina(n, t); } catch (e2) { /* la lectura de quién es no puede romper el cuadro */ }
        if (n % 10 === 0) {
          var l = document.getElementById('repartir-leyendo');
          if (l) l.textContent = 'Leyendo página ' + n + ' de ' + pdfDoc.numPages + '…';
          await new Promise(function (r) { setTimeout(r, 0); });
        }
      }
    }
    return salida;
  }

  function textoDe(t) { return E.textos.slice(t.desde - 1, t.hasta).join(' '); }

  /* Fila 343: lo que hace falta para saber quién es cada página: el alumnado, por número escolar y por nombre. */
  function contextoDeLectura(fuente, alumnado) {
    var ctx = { personas: [], porId: {} };
    if (!fuente || !fuente.lista) return ctx;
    fuente.lista.forEach(function (p, i) {
      var persona = { tercero: alumnado[i], id: String(p.id || '').trim() };
      ctx.personas.push(persona);
      if (persona.id) ctx.porId[persona.id] = persona;
    });
    return ctx;
  }

  /* ---------- asignar y marcar ---------- */

  /* Fila 342: con filtro puesto, la lectura es entre TODO el alumnado (para poder avisar de quien está fuera). */
  function filtroActivo() { return !!(E.filtro && E.filtro.activo()); }
  function leer(texto) { return filtroActivo() ? E.filtro.leer(texto) : N.leerTrozo(texto, E.personas); }

  /* Los nombres ya asignados a algún trozo (menos el trozo `salvo`). */
  function asignadosMenos(salvo) {
    var m = {};
    E.trozos.forEach(function (x, j) { if (j !== salvo && x.tercero && !x.quedarse) m[x.tercero] = true; });
    return m;
  }

  /* Lo leído manda; al resto, los relacionados que queden, por orden. Fila 342: con filtro puesto no se
     rellena por orden, y lo leído solo se asigna si está en el filtro y aún no tiene trozo; con `conservar`
     (al cambiar el filtro) no se quita ninguna asignación. */
  function asignar(trozos, conservar) {
    var usados = {};
    if (conservar) trozos.forEach(function (t) { if (t.tercero && !t.quedarse) usados[t.tercero] = true; });
    trozos.forEach(function (t) {
      if (t.quedarse || t.hecho || (conservar && t.tercero)) { if (t.tercero) usados[t.tercero] = true; return; }
      var r = E.hayTexto ? leer(textoDe(t)) : null;
      if (filtroActivo()) {
        var av = RepartirFiltro.avisoDeLectura(E.filtro, r, usados);
        t.tercero = av && av.tipo === 'libre' ? av.tercero : '';
      } else {
        t.tercero = (r && !usados[r.tercero]) ? r.tercero : '';
      }
      if (t.tercero) usados[t.tercero] = true;
    });
    if (filtroActivo() || E.corte) return trozos;
    /* Fila 339: en el segundo PDF de un asunto (ya hubo otro reparto) no se rellena por orden: sería repetir el primero. */
    if (E.otros && E.otros.hay) return trozos;
    var libres = E.personas.map(function (p) { return p.tercero; }).filter(function (n) { return !usados[n]; });
    trozos.forEach(function (t) { if (!t.quedarse && !t.hecho && !t.tercero && libres.length) t.tercero = libres.shift(); });
    return trozos;
  }

  function marcaDe(t) {
    if (t.hecho) return 'hecho';
    if (t.quedarse) return '';
    if (!t.tercero) return 'ambar';
    /* Fila 343: lo que dijo el corte por alumno, mientras no se haya cambiado a mano. */
    if (t.lectura && t.lectura.tercero === t.tercero) return t.lectura.marca;
    if (!E.hayTexto) return '';
    var r = leer(textoDe(t));
    if (!r) return '';
    return (r.tercero === t.tercero && r.marca === 'verde') ? 'verde' : 'ambar';
  }

  var TEXTO_MARCA = { verde: 'Leído del documento', ambar: 'Revísalo', hecho: 'Hecho', '': '',
    mismo: 'Mismo alumno que el trozo anterior: dos documentos', nueva: 'No está en el alumnado: se crea con los datos del informe' };

  /* ---------- pintar ---------- */

  function opcionesTercero(t, i) {
    var asignados = {};
    E.trozos.forEach(function (x, j) { if (j !== i && x.tercero) asignados[x.tercero] = true; });
    var html = '<option value=""' + (!t.quedarse && !t.tercero ? ' selected' : '') + '>Sin asignar</option>' +
      '<option value="' + QUEDARSE + '"' + (t.quedarse ? ' selected' : '') + '>Se queda en este asunto</option>';
    var conFiltro = filtroActivo();
    var nombres = conFiltro ? RepartirFiltro.nombresParaElegir(E.filtro, asignados, t.quedarse ? '' : t.tercero) : E.personas.map(function (p) { return p.tercero; });
    if (t.tercero && nombres.indexOf(t.tercero) === -1) nombres.push(t.tercero);
    return html + nombres.map(function (n) {
      return '<option value="' + esc(n) + '"' + (!t.quedarse && t.tercero === n ? ' selected' : '') + '>' +
        esc(!conFiltro && asignados[n] ? tachado(n) : n) + '</option>';
    }).join('');
  }

  function filaHTML(t, i) {
    var marca = marcaDe(t);
    var minis = '';
    for (var p = t.desde; p <= Math.min(t.hasta, t.desde + MAX_MINIS - 1); p++) {
      minis += '<canvas class="repartir-mini" data-pagina="' + p + '" width="' + ANCHO_MINI + '" height="' + Math.round(ANCHO_MINI * 1.41) + '"></canvas>';
    }
    if (t.hasta - t.desde + 1 > MAX_MINIS) minis += '<span class="suave">…</span>';
    return '<div class="repartir-trozo repartir-' + (marca || 'nada') + '" data-i="' + i + '">' +
      '<div class="repartir-minis">' + minis + '</div>' +
      '<div class="repartir-datos">' +
        '<div><strong>' + esc(N.textoPaginas(t)) + '</strong>' +
          (t.hecho ? '' : ' <button type="button" class="boton boton-chico repartir-mas">+1 página</button>' +
            '<button type="button" class="boton boton-chico repartir-menos">−1 página</button>') + '</div>' +
        '<select class="campo repartir-tercero"' + (t.hecho ? ' disabled' : '') + '>' + opcionesTercero(t, i) + '</select>' +
        (t.hecho ? '' : '<input class="campo repartir-buscar" list="repartir-alumnado" placeholder="Buscar a otra persona del alumnado…">') +
        (marca ? '<span class="repartir-marca repartir-marca-' + marca + '">' + esc(TEXTO_MARCA[marca]) + '</span>' : '') +
        avisosDelFiltro(t, i) +
      '</div></div>';
  }

  /* Fila 342: «Fuera del filtro» si lo asignado no está en el filtro; y, si el trozo está sin asignar, lo que
     se lee en él cuando está fuera del filtro o ya tiene trozo. */
  function avisosDelFiltro(t, i) {
    if (!filtroActivo() || t.hecho || t.quedarse) return '';
    if (t.tercero) {
      return E.filtro.entra(t.tercero) ? '' : ' <span class="repartir-marca repartir-marca-ambar repartir-fuera">Fuera del filtro</span>';
    }
    if (!E.hayTexto) return '';
    return RepartirFiltro.avisoHTML(RepartirFiltro.avisoDeLectura(E.filtro, leer(textoDe(t)), asignadosMenos(i)));
  }

  function seleccionHTML(clase, lista, valor, vacio) {
    return '<select class="campo ' + clase + '">' + (vacio ? '<option value="">' + esc(vacio) + '</option>' : '') +
      lista.map(function (x) { return '<option value="' + esc(x) + '"' + (x === valor ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') +
      '</select>';
  }

  var pintando = false;   /* fila 337: al reemplazar el cuadro, el campo con foco dispara su «change» y volvería a pintar a mitad */

  /* Fila 339: al repintar, la lista conserva su desplazamiento; con `siguienteDesde` (el trozo recién asignado),
     baja al siguiente trozo sin alumno, o hasta el final si no queda ninguno. */
  function pintar(siguienteDesde) {
    if (pintando) return;
    pintando = true;
    var antes = document.querySelector('.repartir-lista');
    var top = antes ? antes.scrollTop : 0;
    try { pintarCuadro(); } finally { pintando = false; }
    var lista = document.querySelector('.repartir-lista');
    if (!lista) return;
    lista.scrollTop = top;
    if (typeof siguienteDesde !== 'number') return;
    var n = E.trozos.length, idx = -1;
    for (var k = 1; k <= n; k++) {
      var j = (siguienteDesde + k) % n;
      var t = E.trozos[j];
      if (!t.tercero && !t.hecho && !t.quedarse) { idx = j; break; }
    }
    if (idx === -1) { lista.scrollTop = lista.scrollHeight; return; }
    mostrar(idx);
  }

  /* El trozo `idx` arriba de la lista y en el visor grande. */
  function mostrar(idx) {
    var lista = document.querySelector('.repartir-lista');
    var fila = lista && lista.querySelector('.repartir-trozo[data-i="' + idx + '"]');
    if (!fila) return;
    lista.scrollTop = fila.offsetTop;
    if (window.RepartirVisor && E.pdfDoc) RepartirVisor.pdf($('repartir-visor'), E.pdfDoc, E.trozos[idx].desde, E.trozos[idx].hasta);
  }

  /* Fila 342: la línea de cuentas de abajo. */
  function cuentasDelCuadro() {
    var asignados = asignadosMenos(-1);
    return RepartirFiltro.cuentasHTML({
      docs: E.trozos.map(function (t, i) { return { t: t, i: i }; }).filter(function (x) { return !x.t.hecho && !x.t.quedarse && !x.t.tercero; })
        .map(function (x) { return { i: x.i, texto: 'Trozo ' + (x.i + 1) + ', ' + (x.t.desde === x.t.hasta ? 'pág. ' + x.t.desde : 'págs. ' + x.t.desde + '–' + x.t.hasta) }; }),
      alumnos: filtroActivo() ? E.filtro.nombres().filter(function (n) { return !asignados[n]; }) : null
    }, E.cuentas);
  }

  function alCambiarFiltro() {
    E.trozos = asignar(E.trozos, true);
    pintar();
  }

  function pintarCuadro() {
    var cuerpo = $('cuadro-cuerpo');
    var sinRel = !E.personas.length;
    var aviso = E.corte ? '' : N.avisoDivision(E.total, E.primera, E.personas.length);
    var tipos = (App.E.tipos || []).map(function (t) { return t.tipo; });
    var tiposDoc = (App.E.tiposDocumento || []).slice();
    cuerpo.innerHTML = '<div class="repartir-dos"><div class="repartir-izq">' +
      (E.filtro ? RepartirFiltro.html(E.filtro) : '') +
      (sinRel && !filtroActivo() && !E.corte ? '<p class="aviso aviso-ambar">Este asunto no tiene terceros relacionados: los trozos se quedan sin asignar ' +
        'y se busca en todo el alumnado. <button type="button" class="enlace" id="repartir-relacionados">Añadir relacionados</button></p>' : '') +
      (E.corte ? '<p class="suave repartir-corte">' + esc(E.corte) + '</p>' : '') +
      (E.hayTexto ? '' : '<p class="suave">Este PDF es escaneado: ' + (filtroActivo() || (E.otros && E.otros.hay) ? 'elige el alumno de cada trozo.' : 'los trozos se han asignado por orden.') + '</p>') +
      '<div class="alta-tipo repartir-arriba">' +
        '<label>El primer trozo empieza en la página <input type="number" min="1" max="' + E.total + '" class="campo campo-plazo" id="repartir-primera" value="' + E.primera + '"' + (E.anterior ? ' disabled' : '') + '></label>' +
        '<label>Páginas de cada trozo <input type="number" min="1" class="campo campo-plazo" id="repartir-por" value="' + E.porTrozo + '"' + (E.anterior ? ' disabled' : '') + '></label>' +
      '</div>' +
      (aviso && !E.anterior ? '<p class="aviso-en-vivo aviso-en-vivo-ambar">' + esc(aviso) + '</p>' : '') +
      '<datalist id="repartir-alumnado">' + E.alumnado.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>' +
      '<div class="repartir-lista">' + E.trozos.map(filaHTML).join('') + '</div>' +
      '<div class="repartir-abajo">' + cuentasDelCuadro() +
        '<label class="etiqueta">Crear para cada persona un asunto de tipo…</label>' + seleccionHTML('repartir-tipo', tipos, E.tipo, 'Elige el tipo') +
        '<label class="etiqueta">Tipo de documento de cada trozo</label>' + seleccionHTML('repartir-tipodoc', tiposDoc, E.tipoDocumento, 'Elige el tipo de documento') +
        (E.trozos.some(function (t) { return t.quedarse; })
          ? '<label class="etiqueta">Tipo de documento de lo que se queda en este asunto</label>' + seleccionHTML('repartir-tipodoc-origen', tiposDoc, E.tipoDocumentoOrigen, '') : '') +
        '<p class="aviso-en-vivo" id="repartir-falta"></p>' +
        '<button type="button" class="boton boton-principal" id="repartir-ir">Repartir</button>' +
      '</div></div>' +
      /* Fila 337: el visor grande, a la derecha. */
      '<div class="repartir-visor" id="repartir-visor"><p class="suave repartir-visor-vacio">Pulsa un trozo para verlo aquí en grande.</p></div></div>';
    enganchar(cuerpo);
    pintarMiniaturas(cuerpo);
  }

  function pintarMiniaturas(cuerpo) {
    if (!E.pdfDoc || !window.IntersectionObserver) return;
    var obs = new IntersectionObserver(function (entradas, o) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        o.unobserve(en.target);
        var c = en.target;
        E.pdfDoc.getPage(Number(c.dataset.pagina)).then(function (pag) {
          var base = pag.getViewport({ scale: 1 });
          var vp = pag.getViewport({ scale: ANCHO_MINI / base.width });
          c.width = vp.width; c.height = vp.height;
          return pag.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        }).catch(function () {});
      });
    }, { rootMargin: '200px' });
    Array.prototype.forEach.call(cuerpo.querySelectorAll('.repartir-mini'), function (c) { obs.observe(c); });
  }

  function recalcular() {
    E.corte = '';   /* fila 343: al cambiar el tamaño a mano, vuelve el corte de tamaño fijo */
    E.trozos = asignar(N.proponer(E.total, E.primera, E.porTrozo));
    pintar();
  }

  function enganchar(cuerpo) {
    if (E.filtro) RepartirFiltro.enganchar(E.filtro, cuerpo, alCambiarFiltro);
    RepartirFiltro.enganchaCuentas(cuerpo, E.cuentas, function () { pintar(); }, mostrar);
    var rel = $('repartir-relacionados');
    if (rel) rel.onclick = function () {
      $('cuadro-aceptar').click();
      if (window.Relacionados) Relacionados.agregarVarios(E.origen);
    };
    var primera = $('repartir-primera'), por = $('repartir-por');
    if (primera) primera.onchange = function () {
      E.primera = Math.max(1, Math.min(E.total, parseInt(primera.value, 10) || 1));
      E.porTrozo = N.porTrozoPropuesto(E.total, E.primera, E.personas.length);
      recalcular();
    };
    if (por) por.onchange = function () { E.porTrozo = Math.max(1, parseInt(por.value, 10) || 1); recalcular(); };
    Array.prototype.forEach.call(cuerpo.querySelectorAll('.repartir-trozo'), function (fila) {
      var i = Number(fila.dataset.i);
      fila.onclick = function (ev) {
        if (ev.target.closest('button,select,input')) return;
        var tr = E.trozos[i];
        if (window.RepartirVisor && E.pdfDoc) RepartirVisor.pdf($('repartir-visor'), E.pdfDoc, tr.desde, tr.hasta);
      };
      var mas = fila.querySelector('.repartir-mas'), menos = fila.querySelector('.repartir-menos');
      if (mas) mas.onclick = function () { E.trozos = N.moverCorte(E.trozos, i, 1, E.total); pintar(); };
      if (menos) menos.onclick = function () { E.trozos = N.moverCorte(E.trozos, i, -1, E.total); pintar(); };
      var sel = fila.querySelector('.repartir-tercero');
      sel.onchange = function () { elegir(i, sel.value); };
      var igual = fila.querySelector('.repartir-igualmente');
      if (igual) igual.onclick = function () { elegir(i, igual.getAttribute('data-tercero')); };
      var buscar = fila.querySelector('.repartir-buscar');
      if (buscar) buscar.onchange = function () {
        var v = buscar.value.trim();
        if (E.alumnado.indexOf(v) === -1) return;
        if (!E.personas.some(function (p) { return p.tercero === v; })) {
          E.personas.push({ tercero: v, categoria: 'ALUMNADO' });
          E.deFuera.push({ categoria: 'ALUMNADO', nombre: v });
        }
        elegir(i, v);
      };
    });
    ['tipo', 'tipodoc', 'tipodoc-origen'].forEach(function (c) {
      var s = cuerpo.querySelector('.repartir-' + c);
      if (s) s.onchange = function () {
        if (c === 'tipo') E.tipo = s.value; else if (c === 'tipodoc') E.tipoDocumento = s.value; else E.tipoDocumentoOrigen = s.value;
      };
    });
    $('repartir-ir').onclick = resumen;
  }

  function elegir(i, valor) {
    var t = E.trozos[i];
    if (valor === QUEDARSE) { t.quedarse = true; t.tercero = ''; }
    else {
      delete t.quedarse;
      E.trozos.forEach(function (x, j) { if (j !== i && valor && x.tercero === valor && !x.hecho) x.tercero = ''; });
      t.tercero = valor;
    }
    pintar(valor && valor !== QUEDARSE ? i : undefined);
  }

  /* ---------- el resumen, en el mismo cuadro ---------- */

  async function resumen() {
    var falta = $('repartir-falta');
    var aCrear = E.trozos.filter(function (t) { return !t.hecho && !t.quedarse && t.tercero; });
    var quedan = E.trozos.filter(function (t) { return !t.hecho && t.quedarse; });
    if (aCrear.length && (!E.tipo || !E.tipoDocumento)) {
      falta.className = 'aviso-en-vivo aviso-en-vivo-malo';
      falta.textContent = 'Elige el tipo de asunto y el tipo de documento de cada trozo.';
      return;
    }
    if (quedan.length && !E.tipoDocumentoOrigen) {
      falta.className = 'aviso-en-vivo aviso-en-vivo-malo';
      falta.textContent = 'Elige el tipo de documento de lo que se queda en este asunto.';
      return;
    }
    if (!aCrear.length && !quedan.length) {
      falta.className = 'aviso-en-vivo aviso-en-vivo-ambar';
      falta.textContent = 'No hay nada que repartir: ningún trozo tiene persona.';
      return;
    }
    var conTrozo = {};
    E.trozos.forEach(function (t) { if (t.tercero) conTrozo[t.tercero] = true; });
    var sinTrozo = E.personas.filter(function (p) { return !conTrozo[p.tercero] && !(E.otros && E.otros.recibieron[p.tercero]); }).map(function (p) { return p.tercero; });
    var yaTienen = await RepartirCrear.yaTienen(E.tipo);
    var repetidos = aCrear.map(function (t) { return t.tercero; }).filter(function (n, k, l) { return yaTienen[n] && l.indexOf(n) === k; });
    var sinAsignar = E.trozos.filter(function (t) { return !t.hecho && !t.quedarse && !t.tercero; }).length;
    $('cuadro-cuerpo').innerHTML =
      '<p><strong>Se van a crear ' + aCrear.length + (aCrear.length === 1 ? ' asunto' : ' asuntos') + ' de tipo ' + esc(E.tipo || '—') +
        ', ya archivados, y ' + quedan.length + (quedan.length === 1 ? ' documento se queda' : ' documentos se quedan') + ' en este asunto.</strong></p>' +
      (sinAsignar ? '<p class="aviso aviso-ambar">' + sinAsignar + (sinAsignar === 1 ? ' trozo se queda' : ' trozos se quedan') + ' sin repartir.</p>' : '') +
      sinTrozo.map(function (n) { return '<p class="aviso aviso-ambar">' + esc(n) + ' se ha quedado sin trozo.</p>'; }).join('') +
      repetidos.map(function (n) {
        return '<label class="aviso aviso-ambar repartir-repetido"><input type="checkbox" checked data-tercero="' + esc(n) + '"> ' +
          esc(n) + ' ya tiene un asunto de ' + esc(E.tipo) + '. Crear igual</label>';
      }).join('') +
      '<p id="repartir-progreso" class="explica"></p>' +
      '<div class="alta-tipo"><button type="button" class="boton boton-principal" id="repartir-confirmar">Confirmar y repartir</button>' +
      '<button type="button" class="boton" id="repartir-volver">Volver</button></div>';
    $('repartir-volver').onclick = pintar;
    $('repartir-confirmar').onclick = confirmar;
  }

  async function confirmar() {
    var noCrear = {};
    Array.prototype.forEach.call(document.querySelectorAll('.repartir-repetido input'), function (c) { if (!c.checked) noCrear[c.dataset.tercero] = true; });
    var personas = {};
    E.personas.forEach(function (p) { personas[p.tercero] = { categoria: p.categoria }; });
    /* Fila 342: si se ha usado el filtro, quedan relacionados solo los que reciben documento. */
    var deFuera = E.deFuera;
    /* Fila 343: lo mismo con el corte por alumno (nadie estaba relacionado antes). */
    if ((E.filtro && E.filtro.usado) || E.corteUsado) {
      var antes = {}, nuevos = {};
      E.originales.forEach(function (n) { antes[n] = true; });
      deFuera = [];
      E.trozos.forEach(function (t) {
        if (t.hecho || t.quedarse || !t.tercero || antes[t.tercero] || nuevos[t.tercero]) return;
        nuevos[t.tercero] = true;
        deFuera.push({ categoria: 'ALUMNADO', nombre: t.tercero });
        if (!personas[t.tercero]) personas[t.tercero] = { categoria: 'ALUMNADO' };
      });
    }
    E.trozos.forEach(function (t) { if (t.tercero && !t.quedarse && !personas[t.tercero]) personas[t.tercero] = { categoria: 'ALUMNADO' }; });
    var cerrar = $('cuadro-aceptar');
    cerrar.disabled = true;
    $('repartir-confirmar').disabled = true;
    $('repartir-volver').disabled = true;
    var progreso = $('repartir-progreso');
    var resultados = [];
    try {
      resultados = await RepartirCrear.repartir(E.origen, E.fichero, E.trozos, {
        tipo: E.tipo, tipoDocumento: E.tipoDocumento, tipoDocumentoOrigen: E.tipoDocumentoOrigen,
        noCrear: noCrear, personas: personas, deFuera: deFuera
      }, function (n, total) { progreso.textContent = 'Creando ' + n + ' de ' + total + '…'; });
    } catch (e) {
      U.fallo('No he podido repartirlo', e);
    }
    cerrar.disabled = false;
    var hechos = resultados.filter(function (r) { return r.ok && !r.omitido && !r.quedarse; }).length;
    var fallos = resultados.filter(function (r) { return !r.ok && !r.omitido; });
    progreso.textContent = fallos.length
      ? 'Hecho, con fallos: ' + fallos.map(function (r) { return N.textoPaginas(r) + ' (' + (r.tercero || 'este asunto') + ')'; }).join(', ') + '. Volver a repartir este PDF reintenta solo esos.'
      : 'Hecho.';
    if (fallos.length) U.aviso(hechos + ' asuntos creados y archivados; fallaron ' + fallos.length + '.', 'ambar');
    else if (resultados.length) U.aviso(hechos + (hechos === 1 ? ' asunto creado y archivado.' : ' asuntos creados y archivados.'), 'bueno');
    if (E.alTerminar) { try { E.alTerminar(); } catch (e2) { /* solo pintar */ } }
  }

  /* ---------- abrir ---------- */

  function puede(a) {
    return !!(a && (App.E.listaAbiertos || []).some(function (x) { return x.nombre === a.nombre; }));
  }

  async function abrir(contexto) {
    var a = contexto.asunto;
    var bytes, pdfDoc, tx;
    try {
      bytes = new Uint8Array(await (await contexto.handle.getFile()).arrayBuffer());
      pdfDoc = await abrirPdf(bytes);
    } catch (e) {
      U.fallo('No he podido abrir el PDF', e);
      return;
    }
    var ficha = (App.E.registro.asuntos || {})[a.nombre] || a.ficha || {};
    var alumnado = [], fuente = null;
    try {
      if (App.E.datos) {
        fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
        alumnado = fuente.lista.map(function (p) { return App.textoTercero(p); });
      }
    } catch (e) { alumnado = []; fuente = null; }
    /* Fila 343: la lectura del PDF va dentro del cuadro, con su «Leyendo página N de M…», y de paso se mira quién es cada página. */
    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.add('cuadro-ancho', 'cuadro-repartir');
    var promesa = U.preguntar('Repartir "' + contexto.nombre + '" entre terceros', '', 'Cerrar', true);
    var cerrado = false;
    promesa.then(function () { cerrado = true; });
    var cuerpoLeyendo = $('cuadro-cuerpo');
    if (cuerpoLeyendo) cuerpoLeyendo.innerHTML = '<p class="suave" id="repartir-leyendo">Leyendo página 1 de ' + pdfDoc.numPages + '…</p>';
    var ctx = contextoDeLectura(fuente, alumnado), paginas = [];
    try {
      tx = await textos(pdfDoc, function (n, t) { paginas.push({ ident: N.identificarPagina(t, ctx), texto: t }); });
    } catch (e) {
      if (!cerrado) $('cuadro-aceptar').click();
      U.fallo('No he podido abrir el PDF', e);
      return;
    }
    if (cerrado) { if (cuadro) cuadro.classList.remove('cuadro-ancho', 'cuadro-repartir'); return; }
    var tipoOrigen = tipoPorNombre((a.leido && a.leido.tipo) || ficha.tipo) || {};
    var tiposDoc = App.E.tiposDocumento || [];
    E = {
      origen: { nombre: a.nombre, handle: a.handle, ficha: ficha },
      fichero: { nombre: contexto.nombre, handle: contexto.handle },
      alTerminar: contexto.alTerminar, pdfDoc: pdfDoc, total: pdfDoc.numPages, textos: tx,
      hayTexto: tx.some(function (t) { return String(t).trim(); }),
      personas: (ficha.relacionados || []).map(function (r) { return { tercero: r.nombre, categoria: r.categoria || 'ALUMNADO' }; }),
      deFuera: [], alumnado: alumnado, primera: 1,
      tipo: tipoOrigen.repartirTipo || '', tipoDocumento: tipoOrigen.repartirTipoDocumento || '',
      tipoDocumentoOrigen: tiposDoc.indexOf('OFICIO') !== -1 ? 'OFICIO' : (tiposDoc[0] || ''),
      anterior: RepartirCrear.repartoAnterior({ nombre: a.nombre, ficha: ficha }, contexto.nombre),
      otros: RepartirCrear.otrosRepartos({ nombre: a.nombre, ficha: ficha }, contexto.nombre)   /* fila 339 */
    };
    E.originales = E.personas.map(function (p) { return p.tercero; });
    E.cuentas = { ver: '' };
    E.corte = '';
    E.corteUsado = false;
    E.filtro = null;
    try { E.filtro = fuente ? await RepartirFiltro.crear(fuente, E.personas) : null; } catch (e3) { E.filtro = null; }
    E.porTrozo = N.porTrozoPropuesto(E.total, 1, E.personas.length);
    if (E.anterior) {
      /* Ya se repartió: lo que salió bien, «Hecho»; lo demás se reintenta. */
      E.trozos = E.anterior.trozos.map(function (t) {
        var x = { desde: t.desde, hasta: t.hasta };
        if (t.quedarse) x.quedarse = true; else x.tercero = t.tercero || '';
        if (t.ok) { x.hecho = true; x.resultado = { asunto: t.asunto, documento: t.documento }; }
        return x;
      });
    } else {
      var porAlumno = null;
      if (E.hayTexto) {
        paginas.forEach(function (p) { p.huella = N.huella(p.texto, p.ident); });
        porAlumno = N.proponerPorAlumno(paginas);
      }
      if (porAlumno) {
        E.corte = 'Cortado donde cambia el ' + porAlumno.por + ': ' + porAlumno.cuantos + (porAlumno.cuantos === 1 ? ' trozo' : ' trozos');
        E.corteUsado = true;
        E.trozos = porAlumno.trozos;
      } else {
        E.trozos = asignar(N.proponer(E.total, 1, E.porTrozo));
      }
    }
    pintar();
    await promesa;
    if (cuadro) cuadro.classList.remove('cuadro-ancho', 'cuadro-repartir');
    E = null;
  }

  /* ---------- la pantalla de un tipo (Ajustes) ---------- */

  function filaDeTipo(tipo) {
    var fila = document.createElement('div');
    fila.className = 'tipo-repartir-fila';
    var tipos = (App.E.tipos || []).map(function (t) { return t.tipo; }).filter(function (n) { return n !== tipo.tipo; });
    fila.innerHTML =
      '<label class="etiqueta">Al repartir un PDF entre terceros, crear asuntos de tipo…</label>' +
      seleccionHTML('tipo-repartir-tipo', tipos, tipo.repartirTipo || '', 'Sin elegir') +
      '<label class="etiqueta">…con documentos de tipo</label>' +
      seleccionHTML('tipo-repartir-tipodoc', App.E.tiposDocumento || [], tipo.repartirTipoDocumento || '', 'Sin elegir');
    function guardar(campo, valor) {
      var t = tipoPorNombre(tipo.tipo) || tipo;
      [t, tipo].forEach(function (x) { if (valor) x[campo] = valor; else delete x[campo]; });
      return App.enFila(App.FICHERO_TIPOS, function () { return App.guardarTipos(); })
        .then(function () { U.aviso(tipo.tipo + ': guardado.', 'bueno'); }, function (e) { U.fallo('No he podido guardarlo', e); });
    }
    fila.querySelector('.tipo-repartir-tipo').onchange = function (ev) { guardar('repartirTipo', ev.target.value); };
    fila.querySelector('.tipo-repartir-tipodoc').onchange = function (ev) { guardar('repartirTipoDocumento', ev.target.value); };
    return fila;
  }

  /* Lo que comparte el cuadro de varios ficheros (js/repartir-ficheros.js, fila 337). */
  var interno = { abrirPdf: abrirPdf, textos: textos, seleccionHTML: seleccionHTML, tachado: tachado, tipoPorNombre: tipoPorNombre };

  return { abrir: abrir, puede: puede, filaDeTipo: filaDeTipo, QUEDARSE: QUEDARSE, _interno: interno };
})();
window.Repartir = Repartir;
