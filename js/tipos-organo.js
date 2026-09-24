/* ============================================================
   tipos-organo.js — quién encarga cada tipo de asunto (fila 134,
   25-sep-2026, docs/QUIEN-ENCARGA-CADA-TIPO.md).

   El trabajo de los administrativos lo encargan Secretaría, Dirección
   y Jefatura de Estudios. Cada tipo de `tipos.json` lleva `organo`:
   SECRETARIA, DIRECCION, JEFATURA, VARIOS o vacío («Sin asignar»). Un
   tipo de antes, sin él, se lee como vacío. Viaja con el resto del
   tipo, así que se fusiona como todo `tipos.json`.

   Aquí vive todo lo del dato, y cada sitio que lo usa llama a una sola
   función, sin envolver nada:

   - `filaDeTipo(tipo)`: el desplegable «Quién lo encarga» de la
     pantalla de un tipo (js/ajustes-tipo.js, junto a la categoría).
   - `opcionesHtml(valor)`: las opciones, para el panel de «+ Crear tipo
     nuevo» (js/tipo-al-vuelo.js).
   - `agruparParrilla(lista, botones)`: la parrilla de tipos de Nuevo
     asunto, agrupada por órgano (js/tipos-buscador.js).
   - `pasaFiltro(nombreDeTipo, filtro)`: el filtro «Lo encarga» de
     Asuntos abiertos (js/asuntos-lista-pintar.js).
   - `deNombre(nombreDeTipo)`, `texto(valor)`: para Cuentas (js/cuentas.js).
   - `pintarAjustes()`: el bloque «Quién encarga cada tipo» de
     Ajustes › Tipos de asunto (lo llama App.pintarAjustes).
   ============================================================ */
var TiposOrgano = (function () {

  var ORGANOS = [
    { valor: 'SECRETARIA', texto: 'Secretaría' },
    { valor: 'DIRECCION', texto: 'Dirección' },
    { valor: 'JEFATURA', texto: 'Jefatura de Estudios' },
    { valor: 'VARIOS', texto: 'Varios' },
    { valor: '', texto: 'Sin asignar' }
  ];
  /* En el filtro de Asuntos abiertos, «Sin asignar» no puede ser el
     valor vacío (ese es «Todos»). */
  var FILTRO_SIN = 'SIN';

  function $(id) { return document.getElementById(id); }

  function normalizar(v) {
    var s = String(v || '').trim().toUpperCase();
    return ORGANOS.some(function (o) { return o.valor && o.valor === s; }) ? s : '';
  }

  function deTipo(tipo) { return tipo ? normalizar(tipo.organo) : ''; }

  function texto(valor) {
    var v = normalizar(valor);
    return ORGANOS.filter(function (o) { return o.valor === v; })[0].texto;
  }

  function tipos() { return (window.App && App.E && App.E.tipos) || []; }

  /* El tipo de ese nombre (o de uno de sus nombres de antes). */
  function tipoPorNombre(nombre) {
    var lista = tipos();
    return lista.filter(function (t) { return t.tipo === nombre; })[0] ||
      lista.filter(function (t) { return (t.alias || []).indexOf(nombre) !== -1; })[0] || null;
  }

  function deNombre(nombre) { return deTipo(tipoPorNombre(nombre)); }

  function pasaFiltro(nombreDeTipo, filtro) {
    if (!filtro) return true;
    var o = deNombre(nombreDeTipo);
    return filtro === FILTRO_SIN ? o === '' : o === filtro;
  }

  function opcionesHtml(valor) {
    var v = normalizar(valor);
    return ORGANOS.map(function (o) {
      return '<option value="' + o.valor + '"' + (o.valor === v ? ' selected' : '') + '>' + U.escapar(o.texto) + '</option>';
    }).join('');
  }

  /* Guarda el órgano de un tipo. Sobre el tipo que haya AHORA en
     memoria con ese nombre (si se ha releído tipos.json mientras
     tanto, el objeto de antes ya no es el bueno), y en fila con los
     demás guardados de tipos.json. */
  function guardar(tipo, valor) {
    var t = tipoPorNombre(tipo.tipo) || tipo;
    var v = normalizar(valor);
    if (v) t.organo = v; else delete t.organo;
    if (t !== tipo) { if (v) tipo.organo = v; else delete tipo.organo; }
    return App.enFila(App.FICHERO_TIPOS, function () { return App.guardarTipos(); });
  }

  function desplegable(tipo, alGuardar) {
    var sel = document.createElement('select');
    sel.className = 'campo tipo-organo';
    sel.innerHTML = opcionesHtml(deTipo(tipo));
    sel.onchange = async function () {
      var antes = deTipo(tipo);
      sel.disabled = true;
      try {
        await guardar(tipo, sel.value);
        U.aviso(tipo.tipo + ': lo encarga ' + texto(sel.value) + '.', 'bueno');
        if (alGuardar) alGuardar();
      } catch (e) {
        [tipoPorNombre(tipo.tipo) || tipo, tipo].forEach(function (x) {
          if (antes) x.organo = antes; else delete x.organo;
        });
        sel.value = antes;
        U.fallo('No he podido guardarlo', e);
      }
      sel.disabled = false;
    };
    return sel;
  }

  /* ---------- la pantalla de un tipo ---------- */

  function filaDeTipo(tipo) {
    var fila = document.createElement('div');
    fila.className = 'tipo-organo-fila';
    var etiqueta = document.createElement('label');
    etiqueta.className = 'etiqueta';
    etiqueta.textContent = 'Quién lo encarga';
    fila.appendChild(etiqueta);
    fila.appendChild(desplegable(tipo));
    return fila;
  }

  /* ---------- la parrilla de Nuevo asunto ----------

     `botones` ya viene ordenado (y con los que no se enseñan marcados
     con `.oculto`) por js/tipos-buscador.js. Aquí solo se reparten por
     órgano, sin cambiar el orden dentro de cada uno. Si todos los de la
     categoría son del mismo órgano (por ejemplo, todos sin asignar), no
     se pone ningún rótulo: no diría nada. */
  function agruparParrilla(lista, botones) {
    Array.prototype.forEach.call(lista.querySelectorAll('.tipos-grupo-organo'), function (r) { r.remove(); });
    var deCada = {};
    botones.forEach(function (b) {
      var o = deNombre(b.textContent.trim());
      (deCada[o] = deCada[o] || []).push(b);
    });
    if (Object.keys(deCada).length < 2) return;
    ORGANOS.forEach(function (o) {
      var suyos = deCada[o.valor];
      if (!suyos) return;
      var rotulo = document.createElement('div');
      rotulo.className = 'tipos-grupo-organo';
      rotulo.textContent = o.texto;
      rotulo.classList.toggle('oculto', !suyos.some(function (b) { return !b.classList.contains('oculto'); }));
      lista.appendChild(rotulo);
      suyos.forEach(function (b) { lista.appendChild(b); });
    });
  }

  /* ---------- Ajustes › Tipos de asunto › «Quién encarga cada tipo» ---------- */

  var bloque = null;
  var soloSin = false;

  function sinAsignar() { return tipos().filter(function (t) { return !deTipo(t); }).length; }

  function pintarResumen() {
    if (!bloque || !window.AjustesPlegado) return;
    var n = sinAsignar();
    AjustesPlegado.ponerResumen(bloque.sec, n ? n + ' sin asignar' : 'Todos asignados');
  }

  function pintarFilas() {
    var caja = bloque.cuerpo.querySelector('.tipos-organo-filas');
    caja.innerHTML = '';
    var lista = tipos().filter(function (t) { return !soloSin || !deTipo(t); });
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">' + (soloSin ? 'Ninguno sin asignar.' : 'No hay tipos todavía.') + '</div>';
      return;
    }
    lista.forEach(function (t) {
      var fila = document.createElement('div');
      fila.className = 'fila-tipo tipos-organo-fila';
      fila.innerHTML = '<span class="nombre-tipo">' + U.escapar(t.tipo) + '</span>' +
        '<span class="suave tipos-organo-categoria">' + U.escapar(t.categoria) + '</span>';
      /* Al cambiarlo, la fila se queda donde está aunque se esté viendo
         «Solo los sin asignar»: que no salte debajo del ratón. */
      fila.appendChild(desplegable(t, pintarResumen));
      caja.appendChild(fila);
    });
  }

  function construir() {
    var tab = $('ajustes-tab-tipos');
    if (!tab || !window.AjustesPlegado) return false;
    bloque = AjustesPlegado.seccion('organos', 'Quién encarga cada tipo',
      'Secretaría, Dirección, Jefatura de Estudios o Varios');
    bloque.sec.id = 'bloque-tipos-organo';
    bloque.sec.classList.add('tipos-organo-bloque');
    bloque.cuerpo.innerHTML =
      '<p class="explica">Se guarda al cambiar cada desplegable. Sirve para agrupar los tipos en ' +
      'Nuevo asunto, para el filtro «Lo encarga» de Asuntos abiertos y para Cuentas.</p>' +
      '<label class="tipos-organo-solo"><input type="checkbox" id="tipos-organo-solo-sin"> ' +
      'Solo los sin asignar</label>' +
      '<div class="lista tipos-organo-filas"></div>';
    bloque.cuerpo.querySelector('#tipos-organo-solo-sin').onchange = function (e) {
      soloSin = e.target.checked;
      pintarFilas();
    };
    tab.appendChild(bloque.sec);
    return true;
  }

  function pintarAjustes() {
    if (!bloque || !bloque.sec.isConnected) { if (!construir()) return; }
    pintarFilas();
    pintarResumen();
  }

  return {
    ORGANOS: ORGANOS, FILTRO_SIN: FILTRO_SIN,
    normalizar: normalizar, deTipo: deTipo, deNombre: deNombre, texto: texto,
    pasaFiltro: pasaFiltro, opcionesHtml: opcionesHtml, guardar: guardar,
    filaDeTipo: filaDeTipo, agruparParrilla: agruparParrilla, pintarAjustes: pintarAjustes
  };
})();
window.TiposOrgano = TiposOrgano;
