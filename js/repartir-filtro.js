/* ============================================================
   repartir-filtro.js — «Filtrar el alumnado» en los dos cuadros de
   repartir entre terceros (fila 342, 13-oct-2026,
   docs/REPARTIR-CON-FILTRO.md): el de un PDF en trozos
   (js/repartir-pantalla.js) y el de varios ficheros
   (js/repartir-ficheros.js).

   Una zona plegable con los criterios de «Por datos del alumnado»
   (js/alumnado-bd-ver.js) y los atajos de unidad, nivel y enseñanza
   (js/relacionados.js). Se pueden poner varios, y un alumno entra solo
   si cumple todos. Sin ningún criterio no hay filtro y los cuadros
   funcionan como siempre.

   - crear(fuente, relacionados) → el filtro, o null si no hay alumnado.
     `fuente`: lo que devuelve Datos.cargar(…, 'ALUMNADO').
   - f.activo(), f.usado, f.nombres(), f.entra(nombre), f.leer(texto).
   - Fila 350 (docs/ETIQUETAS-BUSCADOR-VERTICAL-FILTRO.md): cada criterio se elige escribiendo
     (js/caja-con-sugerencias.js) y, debajo, sale la lista de las personas que cumplen el filtro con su casilla,
     todas marcadas (js/lista-con-casillas.js). f.todas() son las que cumplen los criterios; f.personas()
     (y f.nombres(), f.entra) solo las marcadas: son las que cuentan en repartos, «Señalar los N» y exportar.
     `opciones.sinLista`: sin esa lista (Etiquetas pinta la suya, con las personas que suma el buscador).
   - html(f) y enganchar(f, raiz, alCambiar): la zona.
   - nombresParaElegir, avisoDeLectura: las listas y lo que lee la app.
   - cuentasHTML y enganchar de cuentas: la línea de abajo.
   ============================================================ */
var RepartirFiltro = (function () {

  function esc(t) { return U.escapar(t); }

  async function crear(fuente, relacionados, opciones) {
    opciones = opciones || {};
    var lista = (fuente && fuente.lista) || [];
    if (!lista.length) return null;
    var datos = null;
    try { datos = window.AlumnadoBD ? await AlumnadoBD.leer() : null; } catch (e) { datos = null; }
    var unidades = Datos.unidadesDistintas(lista);
    var ne = Relacionados.nivelesYEnsenanzas(unidades);
    var todos = lista.map(function (p) { return { tercero: App.textoTercero(p), categoria: 'ALUMNADO' }; });
    var vistos = {};
    todos.forEach(function (p) { vistos[p.tercero] = true; });
    /* Los relacionados que no están en el alumnado también se pueden leer. */
    (relacionados || []).forEach(function (p) { if (!vistos[p.tercero]) { vistos[p.tercero] = true; todos.push(p); } });
    var f = {
      lista: lista, datos: datos, unidades: unidades, niveles: ne.niveles, ensenanzas: ne.ensenanzas, candidatos: todos,
      conds: [], antiguos: false, abierto: !!opciones.abierto, usado: false, cache: null, cacheMarcadas: null, memo: {},
      desmarcadas: {}, sinLista: !!opciones.sinLista,
      alSenalar: opciones.alSenalar || null   /* fila 345: con función, sale «Señalar los N» */
    };
    f.activo = function () { return f.conds.length > 0; };
    f.todas = function () { if (!f.cache) f.cache = calcular(f); return f.cache; };
    f.clave = function (p) { return App.textoTercero(p); };
    f.personas = function () {
      if (!f.cacheMarcadas) f.cacheMarcadas = f.todas().filter(function (p) { return !f.desmarcadas[f.clave(p)]; });
      return f.cacheMarcadas;
    };
    f.nombres = function () { return f.personas().map(function (p) { return App.textoTercero(p); }); };
    f.entra = function (nombre) { return f.nombres().indexOf(nombre) !== -1; };
    /* Lo que se lee en un texto, entre todo el alumnado (no solo el filtro). */
    f.leer = function (texto) {
      var k = String(texto || '');
      if (!Object.prototype.hasOwnProperty.call(f.memo, k)) f.memo[k] = RepartirNucleo.leerTrozo(k, f.candidatos);
      return f.memo[k];
    };
    return f;
  }

  /* Las personas del RegAlum que cumplen todos los criterios. */
  function calcular(f) {
    var lista = f.lista;
    f.conds.forEach(function (c) {
      if (c.tipo === 'unidad') lista = Relacionados.filtrarPorUnidad(lista, c.valor);
      else if (c.tipo === 'nivel') lista = Relacionados.filtrarPorNivel(lista, c.valor);
      else if (c.tipo === 'ensenanza') lista = Relacionados.filtrarPorEnsenanza(lista, c.valor);
    });
    var dato = f.conds.filter(function (c) { return c.tipo === 'dato'; });
    if (dato.length && f.datos) {
      var ids = {};
      AlumnadoBDVer.filtrar(f.datos, dato.map(function (c) { return { clave: c.clave, valor: c.valor }; }), f.antiguos)
        .forEach(function (a) { ids[String(a.idEscolar).trim()] = true; });
      lista = lista.filter(function (p) { return ids[String(p.id || '').trim()]; });
    }
    return lista;
  }

  function cambiar(f, alCambiar) {
    f.cache = null;
    f.cacheMarcadas = null;
    f.usado = true;
    f.abierto = true;
    alCambiar();
  }

  /* ---------- la zona ---------- */

  function opciones(lista, primera) {
    return '<option value="">' + esc(primera) + '</option>' + lista.map(function (o) {
      return '<option value="' + esc(o.valor) + '">' + esc(o.texto) + '</option>';
    }).join('');
  }

  function textoCond(f, c) {
    if (c.tipo === 'unidad') return 'Unidad = ' + c.valor;
    if (c.tipo === 'nivel') return 'Nivel = ' + c.valor;
    if (c.tipo === 'ensenanza') return 'Enseñanza = ' + c.valor;
    var campos = f.datos ? AlumnadoBD.porClave(f.datos) : {};
    return AlumnadoBDVer.etiqueta(campos[c.clave] || { clave: c.clave }) + ' = ' + c.valor;
  }

  function cuantos(n) { return n === 1 ? '1 alumno en el filtro' : n + ' alumnos en el filtro'; }

  function html(f) {
    var sueltos = f.datos ? f.datos.campos.filter(function (c) { return c && c.clave && c.tipo !== 'tabla'; }) : [];
    return '<details class="repartir-filtro"' + (f.abierto ? ' open' : '') + '>' +
      '<summary>Filtrar el alumnado' + (f.activo() ? ' <span class="repartir-filtro-cuantos">' + esc(cuantos(f.personas().length)) + '</span>' : '') + '</summary>' +
      (sueltos.length
        ? '<div class="atajo-fila"><span>Por datos del alumnado</span>' +
            CajaConSugerencias.html('rf-dato', { placeholder: 'Escribe un dato…' }) +
            CajaConSugerencias.html('rf-valor', { placeholder: 'Su valor…', deshabilitada: true }) + '</div>' : '') +
      (f.unidades.length
        ? '<div class="atajo-fila"><span>Toda una unidad</span>' + CajaConSugerencias.html('rf-unidad', { placeholder: 'Escribe la unidad…' }) + '</div>' +
          '<div class="atajo-fila"><span>Todo un nivel</span>' + CajaConSugerencias.html('rf-nivel', { placeholder: 'Escribe el nivel…' }) + '</div>' +
          '<div class="atajo-fila"><span>Toda una enseñanza</span>' + CajaConSugerencias.html('rf-ensenanza', { placeholder: 'Escribe la enseñanza…' }) + '</div>' : '') +
      (sueltos.length ? '<div class="atajo-fila"><label><input type="checkbox" id="rf-antiguos"' + (f.antiguos ? ' checked' : '') + '> Incluir antiguos</label></div>' : '') +
      '<div class="bd-grupo-conds repartir-pastillas">' + f.conds.map(function (c, i) {
        return '<span class="bd-grupo-cond">' + esc(textoCond(f, c)) +
          ' <button type="button" class="boton-mini" data-quitar="' + i + '" aria-label="Quitar">✕</button></span>';
      }).join('') + '</div>' +
      '<p class="repartir-filtro-resumen explica">' + (f.activo() ? esc(cuantos(f.personas().length)) : (f.alSenalar ? 'Pon algún criterio para ver a quién señalar.' : 'Sin criterios: se ve todo como siempre.')) + '</p>' +
      (f.alSenalar ? '<p class="repartir-filtro-senalar"><button type="button" class="boton boton-principal" id="rf-senalar"' + (f.activo() && f.personas().length ? '' : ' disabled') + '>' +
        esc(f.personas().length === 1 ? 'Señalar 1' : 'Señalar los ' + f.personas().length) + '</button></p>' : '') +
      FiltroExportar.botonHTML(f.activo() && f.personas().length > 0) +
      (f.activo() && !f.sinLista ? ListaConCasillas.html(itemsDeLista(f), f.desmarcadas, { id: 'rf' }) : '') +
      '</details>';
  }

  /* La lista con casillas: las que cumplen los criterios, marcadas o no. */
  function itemsDeLista(f) {
    return f.todas().map(function (p) { return { clave: f.clave(p), texto: p.nombre + (p.unidad ? ' · ' + p.unidad : '') }; });
  }

  /* Pone un criterio (el mismo tipo y dato lo sustituye). */
  function poner(f, c) {
    f.conds = f.conds.filter(function (k) { return !(k.tipo === c.tipo && (c.tipo !== 'dato' || k.clave === c.clave)); }).concat([c]);
  }

  function enganchar(f, raiz, alCambiar) {
    var det = raiz.querySelector('.repartir-filtro');
    if (!det) return;
    det.addEventListener('toggle', function () { f.abierto = det.open; });
    var q = function (id) { return det.querySelector('#' + id); };
    var dato = q('rf-dato'), valor = q('rf-valor'), datoElegido = '';
    if (dato) {
      var sueltos = f.datos.campos.filter(function (c) { return c && c.clave && c.tipo !== 'tabla'; })
        .map(function (c) { return { valor: c.clave, texto: AlumnadoBDVer.etiqueta(c) }; });
      CajaConSugerencias.enganchar(det, 'rf-dato', {
        fuente: CajaConSugerencias.deLista(sueltos),
        alElegir: function (o) { datoElegido = o.valor; valor.disabled = false; valor.value = ''; valor.focus(); }
      });
      dato.addEventListener('input', function () { datoElegido = ''; valor.disabled = true; valor.value = ''; });
      CajaConSugerencias.enganchar(det, 'rf-valor', {
        fuente: function (texto) {
          if (!datoElegido) return [];
          var valores = AlumnadoBDVer.valoresDe(f.datos, datoElegido, f.antiguos).map(function (v) { return { valor: v, texto: v }; });
          return CajaConSugerencias.deLista(valores)(texto);
        },
        alElegir: function (o) { poner(f, { tipo: 'dato', clave: datoElegido, valor: o.valor }); cambiar(f, alCambiar); }
      });
    }
    [['rf-unidad', 'unidad', function () { return f.unidades.map(function (u) { return { valor: u.unidad, texto: u.unidad + ' (' + u.cuantos + ')' }; }); }],
     ['rf-nivel', 'nivel', function () { return f.niveles.map(function (v) { return { valor: v, texto: v }; }); }],
     ['rf-ensenanza', 'ensenanza', function () { return f.ensenanzas.map(function (v) { return { valor: v, texto: v }; }); }]].forEach(function (par) {
      if (!q(par[0])) return;
      CajaConSugerencias.enganchar(det, par[0], {
        fuente: CajaConSugerencias.deLista(par[2]()),
        alElegir: function (o) { poner(f, { tipo: par[1], valor: o.valor }); cambiar(f, alCambiar); }
      });
    });
    if (!f.sinLista) {
      ListaConCasillas.enganchar(det, itemsDeLista(f), f.desmarcadas, { alCambiar: function () { f.cacheMarcadas = null; f.usado = true; alCambiar(); } });
    }
    var senalar = q('rf-senalar');
    if (senalar) senalar.onclick = function () { if (f.alSenalar && f.activo()) f.alSenalar(f.personas().slice()); };
    FiltroExportar.enganchar(det, function () { return FiltroExportar.listaDeAlumnado(f); });
    var antiguos = q('rf-antiguos');
    if (antiguos) antiguos.onchange = function () { f.antiguos = antiguos.checked; cambiar(f, alCambiar); };
    Array.prototype.forEach.call(det.querySelectorAll('[data-quitar]'), function (b) {
      b.onclick = function () { f.conds.splice(Number(b.getAttribute('data-quitar')), 1); cambiar(f, alCambiar); };
    });
  }

  /* ---------- las listas y lo que lee la app ---------- */

  /* Con filtro: los alumnos del filtro que aún no tienen documento (`asignados`: { nombre: true } de los
     demás), y el que ya lleva este trozo o fichero, esté o no en el filtro. */
  function nombresParaElegir(f, asignados, actual) {
    var salida = f.nombres().filter(function (n) { return !asignados[n] || n === actual; });
    if (actual && salida.indexOf(actual) === -1) salida.push(actual);
    return salida;
  }

  /* Lo que la app lee (`r`: { tercero, marca } o null), visto desde el filtro:
     { tipo: 'libre' } se asigna solo; 'fuera' y 'ya' no (se avisa en ámbar). */
  function avisoDeLectura(f, r, asignados) {
    if (!r) return null;
    if (!f.entra(r.tercero)) return { tipo: 'fuera', tercero: r.tercero };
    if (asignados[r.tercero]) return { tipo: 'ya', tercero: r.tercero };
    return { tipo: 'libre', tercero: r.tercero };
  }

  function avisoHTML(a) {
    if (!a || a.tipo === 'libre') return '';
    var texto = a.tipo === 'fuera' ? 'Está fuera del filtro: ' : 'Ya tiene documento: ';
    return '<span class="repartir-marca repartir-marca-ambar repartir-aviso-lectura">' + esc(texto + a.tercero) +
      '</span> <button type="button" class="boton boton-chico repartir-igualmente" data-tercero="' + esc(a.tercero) + '">Asignarlo igualmente</button>';
  }

  /* ---------- la línea de cuentas ---------- */

  /* `d`: { docs: [{ texto, i }] (los documentos sin alumno), alumnos: [nombres] | null (sin filtro) };
     `estado.ver`: '' | 'docs' | 'alumnos' (lo desplegado). */
  function cuentasHTML(d, estado) {
    var desplegable = '';
    if (estado.ver === 'docs') {
      desplegable = '<ul class="repartir-cuentas-lista">' + (d.docs.length ? d.docs.map(function (x) {
        return '<li><button type="button" class="enlace" data-ir="' + x.i + '">' + esc(x.texto) + '</button></li>';
      }).join('') : '<li class="suave">Ninguno.</li>') + '</ul>';
    } else if (estado.ver === 'alumnos' && d.alumnos) {
      desplegable = '<ul class="repartir-cuentas-lista">' + (d.alumnos.length ? d.alumnos.map(function (n) {
        return '<li>' + esc(n) + '</li>';
      }).join('') : '<li class="suave">Ninguno.</li>') + '</ul>';
    }
    return '<div class="repartir-cuentas"><p class="repartir-cuentas-linea">Documentos sin alumno: ' +
      '<button type="button" class="enlace" data-cuenta="docs">' + d.docs.length + '</button>' +
      (d.alumnos ? ' · Alumnos del filtro sin documento: <button type="button" class="enlace" data-cuenta="alumnos">' + d.alumnos.length + '</button>' : '') +
      '</p>' + desplegable + '</div>';
  }

  function enganchaCuentas(raiz, estado, repintar, ir) {
    Array.prototype.forEach.call(raiz.querySelectorAll('.repartir-cuentas [data-cuenta]'), function (b) {
      b.onclick = function () {
        var c = b.getAttribute('data-cuenta');
        estado.ver = estado.ver === c ? '' : c;
        repintar();
      };
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('.repartir-cuentas [data-ir]'), function (b) {
      b.onclick = function () { ir(Number(b.getAttribute('data-ir'))); };
    });
  }

  return {
    crear: crear, html: html, enganchar: enganchar, nombresParaElegir: nombresParaElegir,
    avisoDeLectura: avisoDeLectura, avisoHTML: avisoHTML, cuentasHTML: cuentasHTML, enganchaCuentas: enganchaCuentas
  };
})();
window.RepartirFiltro = RepartirFiltro;
