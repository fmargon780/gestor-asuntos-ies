/* ============================================================
   plantillas-pantalla.js — la pantalla «Plantillas» de Herramientas
   (10-oct-2026, fila 320, docs/PANTALLA-DE-PLANTILLAS.md).

   Todas las plantillas del centro en un sitio: las de Word y las de
   correo, cada una en su pestaña, con los hitos que las usan
   (js/plantillas-uso.js). Un bloque de Herramientas con el botón
   «Abrir las plantillas» y una vista a todo el ancho que sustituye a la
   lista de bloques mientras está abierta, como el control del registro
   (js/control-registro-pantalla.js).

   Desde aquí: Ver, Cambiar (los cuadros de siempre: no se hace otro),
   + Nueva plantilla, Sustituir el fichero (Word, js/plantillas-fichero.js)
   y Borrar (a la Papelera, Plantillas.borrarConPapelera).
   No cambia `plantillas.json`: ni su forma ni sus claves.
   ============================================================ */
var PlantillasPantalla = (function () {

  var CLAVE_PESTANA = 'gestor.plantillas.pestana';
  var NOMBRES_DE_LA_APP = ['Aviso de avance', 'Aviso de cierre'];

  var E = { pestana: 'word', orden: 'nombre', texto: '', tipo: '', sinHito: false, abierta: false,
    datos: null, uso: {}, falta: {}, desplegados: {}, turno: 0, fuera: false };

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function n(t) { return U.normalizar(String(t || '')); }

  function pestanaGuardada() {
    try { var v = window.localStorage.getItem(CLAVE_PESTANA); return v === 'correo' ? 'correo' : 'word'; } catch (e) { return 'word'; }
  }
  function guardarPestana(v) { try { window.localStorage.setItem(CLAVE_PESTANA, v); } catch (e) { /* sin memoria: nada */ } }

  /* ---------- los datos ---------- */

  async function leer() {
    var g = App.E.gestor;
    E.datos = await Plantillas.cargar(g);
    var guias = {}, tipos = App.E.tipos || [];
    if (window.GuiasDelCentro) {
      try { await GuiasDelCentro.ponerAlDia(); } catch (e) { /* se queda con la guía que hay */ }
      tipos.forEach(function (t) { guias[t.tipo] = GuiasDelCentro.pasosDe(t.tipo); });
    }
    var modelos = [];
    if (window.HitosBiblioteca) { try { modelos = (await HitosBiblioteca.leer()).modelos || []; } catch (e) { modelos = []; } }
    E.uso = PlantillasUso.calcular({ plantillas: E.datos, guias: guias, tipos: tipos, modelos: modelos });
    /* Qué ficheros de Word faltan: una sola lectura de la carpeta. */
    E.falta = {};
    try {
      var presentes = (await Carpetas.ficheros(await PlantillasDocumento._interno.carpetaDePlantillas())).map(function (f) { return n(f.nombre); });
      (E.datos.documentos || []).forEach(function (d) { if (d.fichero && presentes.indexOf(n(d.fichero)) === -1) E.falta[d.id] = true; });
    } catch (e) { /* sin carpeta no se marca nada */ }
  }

  function lista() { return E.pestana === 'word' ? (E.datos.documentos || []) : (E.datos.lista || []); }

  function esDeLaApp(p) { return E.pestana === 'correo' && !p.tipo && !p.categoria && NOMBRES_DE_LA_APP.indexOf(p.nombre) !== -1; }
  function tipoExiste(p) { return !p.tipo || !window.TiposNombre || !!TiposNombre.tipoPorNombre(p.tipo); }
  function usos(p) { return E.uso[p.id] || []; }
  function enUso(p) { return Plantillas.enUso(p); }
  function cuantasFuera(l) { return (l || []).filter(function (p) { return !enUso(p); }).length; }
  /* «12» o «12 · 2 fuera de uso» */
  function cuenta(l) { var f = cuantasFuera(l); return (l || []).length + (f ? ' · ' + f + ' fuera de uso' : ''); }

  function textoBuscable(p) {
    return n([p.nombre, p.tipo, p.categoria, p.tipoDocumento, p.fichero].concat(usos(p).map(function (u) { return u.etiqueta + ' ' + u.tipo; })).join(' '));
  }

  function filtradas() {
    var palabras = n(E.texto).split(/\s+/).filter(Boolean);
    var l = lista().filter(function (p) {
      if (E.tipo && n(p.tipo) !== n(E.tipo)) return false;
      if (E.sinHito && usos(p).length) return false;
      if (E.fuera && enUso(p)) return false;
      var t = textoBuscable(p);
      return palabras.every(function (w) { return t.indexOf(w) !== -1; });
    });
    l.sort(function (a, b) {
      /* Las fuera de uso, al final, en cualquiera de los dos órdenes. */
      if (enUso(a) !== enUso(b)) return enUso(a) ? -1 : 1;
      if (E.orden === 'tipo') {
        var ta = n(a.tipo), tb = n(b.tipo);
        if (ta !== tb) return ta < tb ? -1 : 1;
      }
      return n(a.nombre) < n(b.nombre) ? -1 : (n(a.nombre) > n(b.nombre) ? 1 : 0);
    });
    return l;
  }

  /* ---------- pintar ---------- */

  function celdaHitos(p) {
    var u = usos(p);
    if (!u.length) return '<span class="suave">Ninguno</span>';
    var abierto = !!E.desplegados[p.id];
    var ver = abierto ? u : u.slice(0, 2);
    var consulta = soloConsulta();
    var html = ver.map(function (x) {
      var texto = esc(x.etiqueta) + (x.tipo ? ' <span class="suave">(' + esc(x.tipo) + ')</span>' : '');
      if (x.hitoId && x.tipo && !consulta && window.GuiasDelCentro) {
        return '<div><button type="button" class="enlace pt-hito" data-tipo="' + esc(x.tipo) + '" data-hito="' + esc(x.hitoId) + '">' + esc(x.etiqueta) + '</button> <span class="suave">(' + esc(x.tipo) + ')</span></div>';
      }
      return '<div>' + texto + '</div>';
    }).join('');
    if (u.length > 2) {
      html += '<div><button type="button" class="enlace pt-mas" data-solo-lectura data-id="' + esc(p.id) + '">' +
        (abierto ? 'ver menos' : 'y ' + (u.length - 2) + ' más') + '</button></div>';
    }
    return html;
  }

  function celdaTipo(p) {
    if (!p.tipo) return '<span class="suave">Cualquier tipo</span>';
    var html = esc(p.tipo) + (p.categoria ? ' <span class="suave">' + esc(p.categoria) + '</span>' : '');
    if (!tipoExiste(p)) html += '<div class="pt-ambar">Este tipo ya no existe</div>';
    return html;
  }

  function acciones(p) {
    var off = soloConsulta() ? ' disabled' : '';
    var deLaApp = esDeLaApp(p);
    var menu = (E.pestana === 'word' ? '<button type="button" class="boton" data-accion="sustituir"' + off + '>Sustituir el fichero…</button>' : '') +
      (enUso(p)
        ? '<button type="button" class="boton" data-accion="fuera"' + (deLaApp ? ' disabled title="La aplicación la necesita para avisar a quien lo pide."' : off) + '>Dejar fuera de uso…</button>'
        : '<button type="button" class="boton" data-accion="activar"' + off + '>Volver a activar</button>') +
      '<button type="button" class="boton boton-peligro" data-accion="borrar"' + (deLaApp ? ' disabled title="La aplicación la vuelve a crear sola."' : off) + '>Borrar</button>';
    return '<td class="pt-acciones"><button type="button" class="boton" data-accion="ver" data-solo-lectura>Ver</button> ' +
      (E.pestana === 'word' ? '<button type="button" class="boton" data-accion="retocar"' +
        (E.falta[p.id] ? ' disabled title="El fichero «' + esc(p.fichero) + '» no está en la carpeta de plantillas."' : off) + '>Retocar</button> ' : '') +
      '<button type="button" class="boton" data-accion="cambiar"' + off + '>Cambiar</button> ' +
      '<details class="pt-mas-menu"><summary title="Más" data-solo-lectura>⋮</summary><div class="pt-menu">' + menu + '</div></details></td>';
  }

  function cabecera() {
    var orden = function (clave, texto) {
      return '<button type="button" class="enlace pt-ordenar' + (E.orden === clave ? ' activa' : '') + '" data-solo-lectura data-orden="' + clave + '">' + texto + '</button>';
    };
    if (E.pestana === 'word') {
      return '<tr><th>' + orden('nombre', 'Nombre') + '</th><th>Tipo de documento</th><th>' + orden('tipo', 'Tipo de asunto') +
        '</th><th>Hitos que la usan</th><th>Fichero</th><th></th></tr>';
    }
    return '<tr><th>' + orden('nombre', 'Nombre') + '</th><th>' + orden('tipo', 'Tipo de asunto') + '</th><th>Hitos que la usan</th><th>Séneca</th><th></th></tr>';
  }

  function fila(p) {
    var nombre = esc(p.nombre) + (esDeLaApp(p) ? ' <span class="pt-etiqueta">De la aplicación</span>' : '') +
      (enUso(p) ? '' : ' <span class="pt-etiqueta pt-etiqueta-fuera">' + esc(PlantillasFueraDeUso.etiqueta(p)) + '</span>');
    var clase = enUso(p) ? '' : ' class="pt-fuera"';
    if (E.pestana === 'word') {
      return '<tr' + clase + ' data-id="' + esc(p.id) + '"><td class="pt-nombre">' + nombre + '</td><td class="pt-tipodoc">' + esc(p.tipoDocumento) + '</td><td>' + celdaTipo(p) + '</td><td>' + celdaHitos(p) +
        '</td><td class="pt-fichero">' + esc(p.fichero) + (E.falta[p.id] ? ' <span class="pt-ambar pt-falta">Falta el fichero</span>' : '') + '</td>' + acciones(p) + '</tr>';
    }
    return '<tr' + clase + ' data-id="' + esc(p.id) + '"><td class="pt-nombre">' + nombre + '</td><td>' + celdaTipo(p) + '</td><td>' + celdaHitos(p) +
      '</td><td>' + (String(p.textoSeneca || '').trim() ? 'Sí' : '—') + '</td>' + acciones(p) + '</tr>';
  }

  function opcionesDeTipo() {
    var vistos = {}, tipos = [];
    lista().forEach(function (p) { if (p.tipo && !vistos[n(p.tipo)]) { vistos[n(p.tipo)] = true; tipos.push(p.tipo); } });
    if (E.tipo && !vistos[n(E.tipo)]) tipos.push(E.tipo);
    tipos.sort(function (a, b) { return n(a) < n(b) ? -1 : 1; });
    return '<option value="">Todos</option>' + tipos.map(function (t) {
      return '<option value="' + esc(t) + '"' + (n(t) === n(E.tipo) ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('');
  }

  function pintarCuerpo() {
    var cuerpo = $('pt-cuerpo');
    if (!cuerpo) return;
    var todas = lista(), l = filtradas();
    var clase = E.pestana === 'word' ? 'Word' : 'correo';
    if (!todas.length) {
      cuerpo.innerHTML = '<div class="vacio">Todavía no hay ninguna plantilla de ' + clase + '.</div>';
    } else if (!l.length) {
      cuerpo.innerHTML = '<div class="vacio">Ninguna plantilla tiene esas palabras.</div>';
    } else {
      cuerpo.innerHTML = '<table class="pt-tabla"><thead>' + cabecera() + '</thead><tbody>' + l.map(fila).join('') + '</tbody></table>';
    }
    enlazarCuerpo(cuerpo);
  }

  function pintarCabecera() {
    var vista = $('plantillas-vista');
    var off = soloConsulta() ? ' disabled' : '';
    vista.innerHTML =
      '<div class="pt-barra"><button type="button" class="boton" id="pt-volver" data-solo-lectura>← Volver a Herramientas</button>' +
        '<h3 class="pt-titulo">Plantillas</h3></div>' +
      '<div class="pt-pestanas">' +
        '<button type="button" class="pt-pestana' + (E.pestana === 'word' ? ' activa' : '') + '" data-solo-lectura data-pestana="word">Word (' + cuenta(E.datos.documentos) + ')</button>' +
        '<button type="button" class="pt-pestana' + (E.pestana === 'correo' ? ' activa' : '') + '" data-solo-lectura data-pestana="correo">Correo (' + cuenta(E.datos.lista) + ')</button>' +
      '</div>' +
      '<div class="pt-filtros">' +
        '<input id="pt-buscar" class="campo" data-solo-lectura placeholder="Buscar entre las plantillas…" value="' + esc(E.texto) + '">' +
        '<label class="pt-etq">Tipo de asunto <select id="pt-tipo" class="campo" data-solo-lectura>' + opcionesDeTipo() + '</select></label>' +
        '<label class="pt-etq"><input type="checkbox" id="pt-sin-hito" data-solo-lectura' + (E.sinHito ? ' checked' : '') + '> Sin ningún hito</label>' +
        '<label class="pt-etq"><input type="checkbox" id="pt-fuera" data-solo-lectura' + (E.fuera ? ' checked' : '') + '> Fuera de uso</label>' +
        '<button type="button" class="boton boton-principal pt-nueva" id="pt-nueva"' + off + '>+ Nueva plantilla</button>' +
      '</div>' +
      '<div id="pt-cuerpo"></div>';
    $('pt-volver').onclick = cerrar;
    Array.prototype.forEach.call(vista.querySelectorAll('[data-pestana]'), function (b) {
      b.onclick = function () { E.pestana = b.dataset.pestana; guardarPestana(E.pestana); E.tipo = ''; pintar(); };
    });
    $('pt-buscar').oninput = function () { E.texto = this.value; pintarCuerpo(); };
    $('pt-tipo').onchange = function () { E.tipo = this.value; pintarCuerpo(); };
    $('pt-sin-hito').onchange = function () { E.sinHito = this.checked; pintarCuerpo(); };
    $('pt-fuera').onchange = function () { E.fuera = this.checked; pintarCuerpo(); };
    $('pt-nueva').onclick = function () { nueva(); };
  }

  function pintar() {
    if (!E.datos || !$('plantillas-vista')) return;
    pintarCabecera();
    pintarCuerpo();
  }

  /* ---------- las pulsaciones de la tabla ---------- */

  function porId(id) { return lista().filter(function (p) { return p.id === id; })[0] || null; }

  function enlazarCuerpo(cuerpo) {
    Array.prototype.forEach.call(cuerpo.querySelectorAll('[data-orden]'), function (b) {
      b.onclick = function () { E.orden = b.dataset.orden; pintarCuerpo(); };
    });
    Array.prototype.forEach.call(cuerpo.querySelectorAll('.pt-mas'), function (b) {
      b.onclick = function () { E.desplegados[b.dataset.id] = !E.desplegados[b.dataset.id]; pintarCuerpo(); };
    });
    Array.prototype.forEach.call(cuerpo.querySelectorAll('.pt-hito'), function (b) {
      b.onclick = function () { return GuiasDelCentro.escribir(b.dataset.tipo, { irA: b.dataset.hito }); };
    });
    Array.prototype.forEach.call(cuerpo.querySelectorAll('[data-accion]'), function (b) {
      b.onclick = function () {
        var p = porId(b.closest('tr').dataset.id);
        var det = b.closest('details');
        if (det) det.open = false;
        if (p) return hacer(b.dataset.accion, p);
      };
    });
  }

  async function hacer(accion, p) {
    if (accion === 'ver') return ver(p);
    if (accion === 'retocar') return PlantillaRetocarPantalla.abrir(p, recargar);
    if (accion === 'cambiar') return cambiar(p);
    if (accion === 'sustituir') return PlantillasFichero.sustituir(p, recargar);
    if (accion === 'fuera') return PlantillasFueraDeUso.dejar(p, E.pestana === 'word' ? 'documento' : 'correo', usos(p), recargar);
    if (accion === 'activar') return PlantillasFueraDeUso.volverAActivar(p, E.pestana === 'word' ? 'documento' : 'correo', recargar);
    if (accion === 'borrar') { if (await Plantillas.borrarConPapelera(p, E.pestana === 'word' ? 'documento' : 'correo')) { await recargar(); if (typeof App.pintarPapelera === 'function') App.pintarPapelera(); } }
  }

  async function ver(p) {
    if (E.pestana === 'word') {
      try {
        var dir = await PlantillasDocumento._interno.carpetaDePlantillas();
        var h = await dir.getFileHandle(p.fichero);
        delete E.falta[p.id];
        return WordVisor.abrir({ handle: h, nombre: p.fichero, soloVer: true });
      } catch (e) {
        E.falta[p.id] = true;
        U.aviso('No encuentro «' + p.fichero + '» en la carpeta de plantillas.', 'malo');
        pintarCuerpo();
        return;
      }
    }
    var cuerpo = '<pre class="pt-texto">' + esc(p.texto) + '</pre>' +
      (String(p.textoSeneca || '').trim() ? '<label class="etiqueta">Texto para Séneca</label><pre class="pt-texto">' + esc(p.textoSeneca) + '</pre>' : '');
    await U.preguntar(p.nombre, cuerpo, 'Cerrar', true);
  }

  async function cambiar(p) {
    if (E.pestana === 'word') return PlantillasDocumento.abrirCuadroDePlantillaDoc(p, null, recargar);
    return PlantillasAjustes.abrirCuadroDePlantilla(p, null, recargar);
  }

  function nueva() {
    var t = E.tipo ? (App.E.tipos || []).filter(function (x) { return n(x.tipo) === n(E.tipo); })[0] || null : null;
    if (E.pestana === 'word') return PlantillasDocumento.abrirCuadroDePlantillaDoc(null, t, recargar);
    return PlantillasAjustes.abrirCuadroDePlantilla(null, t, recargar);
  }

  /* ---------- abrir, cerrar, recargar ---------- */

  async function recargar() {
    var mio = ++E.turno;
    try { await leer(); } catch (e) {
      var v = $('plantillas-vista');
      if (v) v.innerHTML = '<div class="aviso aviso-rojo">No he podido leer las plantillas: ' + esc(U.mensajeDeError(e)) + '</div>';
      return;
    }
    if (mio !== E.turno) return;
    pintar();
    pintarBloque();
  }

  /* `opciones`: { pestana, tipo }. Desde la pantalla de un tipo (Ajustes) también vale: primero va a Herramientas. */
  async function abrir(opciones) {
    opciones = opciones || {};
    if (opciones.pestana) { E.pestana = opciones.pestana; guardarPestana(E.pestana); } else E.pestana = pestanaGuardada();
    E.tipo = opciones.tipo || '';
    E.texto = ''; E.sinHito = false; E.fuera = false;
    var herr = $('pantalla-herramientas');
    if (herr && herr.classList.contains('oculto') && App.ir) App.ir('herramientas');
    E.abierta = true;
    var l = $('herramientas-lista'), vista = $('plantillas-vista');
    if (!vista) return;
    if (l) l.classList.add('oculto');
    var otra = $('control-registro-vista');
    if (otra) otra.classList.add('oculto');
    vista.classList.remove('oculto');
    vista.innerHTML = '<p class="explica">Abriendo las plantillas…</p>';
    await recargar();
  }

  function cerrar() {
    E.abierta = false;
    var l = $('herramientas-lista'), vista = $('plantillas-vista');
    if (l) l.classList.remove('oculto');
    if (vista) vista.classList.add('oculto');
    pintarBloque();
  }

  /* La línea del bloque de Herramientas: «12 de Word · 30 de correo». */
  async function pintarBloque() {
    var linea = $('plantillas-resumen');
    if (!linea || !App.E.gestor) return;
    try {
      var d = E.datos && E.abierta ? E.datos : await Plantillas.cargar(App.E.gestor);
      var fuera = cuantasFuera(d.documentos) + cuantasFuera(d.lista);
      linea.textContent = (d.documentos || []).length + ' de Word · ' + (d.lista || []).length + ' de correo' + (fuera ? ' · ' + fuera + ' fuera de uso' : '');
    } catch (e) { linea.textContent = ''; }
    var b = $('plantillas-abrir');
    if (b && !b.onclick) b.onclick = function () { return abrir(); };
  }

  /* El enlace «Ver todas las plantillas» de la pantalla de un tipo. */
  function enlaceDeTipo(despuesDe, pestana, tipo) {
    if (!despuesDe || !despuesDe.parentNode) return;
    var siguiente = despuesDe.nextElementSibling;
    if (siguiente && siguiente.classList.contains('pt-ver-todas')) return;
    var p = document.createElement('p');
    p.className = 'pt-ver-todas';
    p.innerHTML = '<button type="button" class="enlace" data-solo-lectura>Ver todas las plantillas</button>';
    p.firstChild.onclick = function () { return abrir({ pestana: pestana, tipo: tipo }); };
    despuesDe.parentNode.insertBefore(p, despuesDe.nextSibling);
  }

  return { abrir: abrir, cerrar: cerrar, recargar: recargar, pintarBloque: pintarBloque, enlaceDeTipo: enlaceDeTipo,
    estaAbierta: function () { return E.abierta; } };
})();
window.PlantillasPantalla = PlantillasPantalla;
