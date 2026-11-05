/* ============================================================
   datos-del-asunto-vista.js — la lista de datos de una plantilla, con lo
   que falta para escribir ahí mismo (fila 530, docs/530-DATOS-EN-EL-ASUNTO.md,
   puntos 3, 4, 5 y 7; pantalla docs/pantallas/518.html, «En un asunto»).

   Una fila por dato (`DatosDePlantilla`): el que existe, con su valor; el
   que falta, con una caja para escribirlo y «Pedirlo antes». Lo escrito se
   guarda en el asunto al salir de la caja (`DatosDelAsunto.guardar`) y
   ninguna otra plantilla lo vuelve a pedir. Un dato ya escrito en el asunto
   se puede cambiar: los documentos ya generados no cambian, el siguiente
   que se genere usa el valor nuevo.

   «Pedirlo antes» abre debajo dos desplegables: dónde se pide (al crear el
   asunto, la parte general sin pedirlo al crear, o un hito) y para quién
   (este asunto y los siguientes, o solo este asunto) (js/campo-colocar.js).

   Lo usan la tarea de generar o comunicar (js/datos-de-la-tarea.js), el
   cuadro de Correo y el de Séneca (js/datos-del-asunto-cuadro.js) y la ventana
   «Faltan datos» (js/word-faltan.js).
   ============================================================ */
var DatosDelAsuntoVista = (function () {

  var contador = 0;

  function esc(t) { return U.escapar(String(t === undefined || t === null ? '' : t)); }

  function controlHtml(d, id) {
    var info = d.info || {};
    var valor = d.falta ? '' : d.valor;
    var e = 'data-nombre="' + esc(d.nombre) + '" aria-label="' + esc(d.nombre) + '"';
    if (info.clase === 'lista' && info.valores && info.valores.length) {
      return '<select id="' + id + '" class="campo dap-control" ' + e + '><option value="">Elige</option>' + info.valores.map(function (v) {
        return '<option' + (v === valor ? ' selected' : '') + '>' + esc(v) + '</option>';
      }).join('') + '</select>';
    }
    if (info.clase && info.clase !== 'texto' && window.CamposClases) {
      var base = CamposClases.htmlControl(id, info.clase, info.valores, d.falta ? '' : (info.guardado ? DatosDelAsunto.valorGuardado(d.a, info.clave) : valor));
      return base.replace('class="campo', e + ' class="campo dap-control');
    }
    return '<input id="' + id + '" class="campo dap-control" ' + e + ' value="' + esc(valor) + '" placeholder="Escríbelo aquí">';
  }

  function filaHtml(d, prefijo, i, o) {
    var id = prefijo + '-' + i;
    var editable = !o.soloLectura && (d.falta || (d.info && d.info.guardado));
    return '<div class="dap-fila' + (d.falta ? ' dap-falta' : '') + '" data-nombre="' + esc(d.nombre) + '">' +
      '<label class="dap-nombre" for="' + id + '">' + esc(d.nombre) + '</label>' +
      (editable ? '<span class="dap-valor">' + controlHtml(d, id) + '</span>' : '<span class="dap-valor dap-fijo">' + esc(d.valor) + '</span>') +
      (d.falta && !o.soloLectura && o.pedirAntes !== false ? '<button type="button" class="boton boton-chico dap-antes-boton" data-nombre="' + esc(d.nombre) + '">Pedirlo antes</button>' : '<span></span>') +
      '</div>';
  }

  /* La frase de arriba: «Falta 1 de 7 datos; el resto ya está.» */
  function resumenHtml(datos, titulo) {
    var f = datos.filter(function (d) { return d.falta; }).length;
    return (titulo ? esc(titulo) + '. ' : '') + (f
      ? 'Falta' + (f > 1 ? 'n ' : ' ') + f + ' de ' + datos.length + (datos.length > 1 ? ' datos' : ' dato') + (f < datos.length ? '; el resto ya está.' : '.')
      : (datos.length ? 'Ya están todos los datos.' : 'No usa ningún dato.'));
  }

  /* `datos`: lo que da DatosDePlantilla. `o`: { titulo, prefijo, soloLectura, pedirAntes, sinResumen } */
  function html(a, datos, o) {
    o = o || {};
    var prefijo = o.prefijo || ('dap' + (++contador));
    datos.forEach(function (d) { d.a = a; });
    return '<div class="dap" data-prefijo="' + esc(prefijo) + '">' +
      (o.sinResumen ? '' : '<div class="pequeno suave dap-resumen">' + resumenHtml(datos, o.titulo) + '</div>') +
      datos.map(function (d, i) { return filaHtml(d, prefijo, i, o); }).join('') +
      '<div class="dap-antes-caja"></div></div>';
  }

  /* ---------- «Pedirlo antes» ---------- */

  function opcionesPara(sitio, a) {
    var s = CampoColocar.sitiosPara(a).filter(function (x) { return x.valor === sitio; })[0];
    var lista = [];
    if (s && s.guia) lista.push('<option value="guia">Este asunto y los siguientes (en la guía)</option>');
    lista.push('<option value="aqui">Solo este asunto</option>');
    return lista.join('');
  }

  function abrirAntes(raiz, a, d, o) {
    var caja = raiz.querySelector('.dap-antes-caja');
    if (!caja) return;
    var sitios = CampoColocar.sitiosPara(a);
    caja.innerHTML = '<div class="dap-antes"><div><label class="etiqueta" for="dap-donde">Pedir «' + esc(d.nombre) + '» en</label>' +
      '<select id="dap-donde" class="campo">' + sitios.map(function (s) { return '<option value="' + esc(s.valor) + '">' + esc(s.texto) + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="etiqueta" for="dap-para">Para</label><select id="dap-para" class="campo">' + opcionesPara('crear', a) + '</select></div>' +
      '<div class="fila-botones"><button type="button" class="boton boton-principal boton-chico" id="dap-aplicar">Aplicar</button>' +
      '<button type="button" class="boton boton-chico" id="dap-cancelar">Cancelar</button></div></div>';
    var donde = caja.querySelector('#dap-donde'), para = caja.querySelector('#dap-para');
    donde.onchange = function () { para.innerHTML = opcionesPara(donde.value, a); };
    caja.querySelector('#dap-cancelar').onclick = function () { caja.innerHTML = ''; };
    caja.querySelector('#dap-aplicar').onclick = async function () {
      var boton = this;
      try {
        await U.mientrasGuarda(boton, async function () {
          var r = await DatosDelAsunto.entradaDe(d.nombre, a, d.info && d.info.valores);
          var sitio = CampoColocar.dondeDe(a, donde.value);
          await CampoColocar.colocar(a, r.entrada, sitio, para.value);
          U.aviso(CampoColocar.aviso(d.nombre, sitio, para.value), 'bueno');
        });
      } catch (e) { U.fallo('No he podido cambiar dónde se pide «' + d.nombre + '»', e); return; }
      caja.innerHTML = '';
      if (o.alCambiar) o.alCambiar(d.nombre);
    };
  }

  /* ---------- guardar lo escrito ---------- */

  /* Tras guardar un dato, las demás listas de datos ya pintadas y «Campos del asunto» se ponen al día (fila 530). */
  function alGuardarAlgo(a) {
    try { if (window.DatosDeLaTarea) DatosDeLaTarea.repintarTodas(); } catch (e) { U.accesorio('Guardado, pero no he podido poner al día las otras listas', e); }
    try { if (window.CampoDesdeElAsunto) CampoDesdeElAsunto._i.repintar(a); } catch (e2) { /* repintar ya avisa */ }
  }

  /* Engancha las cajas y los botones de la lista pintada con `html`. `o.alCambiar(nombre)` se llama tras guardar. */
  function enganchar(raiz, a, datos, o) {
    o = o || {};
    Array.prototype.forEach.call(raiz.querySelectorAll('.dap-control'), function (el) {
      var d = datos.filter(function (x) { return x.nombre === el.dataset.nombre; })[0];
      if (!d) return;
      var clase = (d.info && d.info.clase) || 'texto';
      if (window.CamposClases) CamposClases.engancharControl(el, clase);
      el.onkeydown = function (ev) { if (ev.key === 'Enter' && el.tagName === 'INPUT') { ev.preventDefault(); el.blur(); } };
      el.onchange = async function () {
        if (el.dataset.guardando) return;
        el.dataset.guardando = '1';
        try {
          var r = await DatosDelAsunto.guardar(a, d.nombre, el.value, d.info && d.info.valores);
          if (!r.ok) { el.classList.add('campo-ambar'); U.aviso(r.aviso, 'ambar'); return; }
          el.classList.remove('campo-ambar');
          if (r.sinCambio) return;
          U.aviso(r.valor ? '«' + d.nombre + '» guardado en el asunto.' : '«' + d.nombre + '» quitado del asunto.', 'bueno');
          alGuardarAlgo(a);
          if (o.alCambiar) o.alCambiar(d.nombre, r);
        } catch (e) { U.fallo('No he podido guardar «' + d.nombre + '»', e); }
        finally { delete el.dataset.guardando; }
      };
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('.dap-antes-boton'), function (b) {
      b.onclick = function () {
        var d = datos.filter(function (x) { return x.nombre === b.dataset.nombre; })[0];
        if (d) abrirAntes(b.closest('.dap'), a, d, o);
      };
    });
  }

  return { alGuardarAlgo: alGuardarAlgo, html: html, enganchar: enganchar, resumenHtml: resumenHtml, filaHtml: filaHtml };
})();
window.DatosDelAsuntoVista = DatosDelAsuntoVista;
