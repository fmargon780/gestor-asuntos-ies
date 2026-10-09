/* ============================================================
   convertir-en-plantilla-pantalla.js — la pantalla de «Convertir en
   plantilla» (fila 280, docs/CONVERTIR-EN-PLANTILLA.md, apartados 3 a 8).

   Una capa a pantalla completa, como la del visor de Word, con dos pasos:
     1. «Revisar»: a la izquierda el documento (la copia de trabajo, con
        cada hueco resaltado en amarillo) y a la derecha los cambios, el
        membrete y los datos de la plantilla. Seleccionando texto del
        documento sale un menú con tres opciones.
     2. «Comparar y guardar»: el original y la plantilla ya rellena con
        este mismo asunto, lado a lado.
   La lógica (estado, copia de trabajo, guardado) está en
   js/convertir-en-plantilla.js; aquí solo se pinta y se recoge.
   ============================================================ */
var ConvertirEnPlantillaPantalla = (function () {

  var GRUPOS = [
    { clave: 'datos', rotulo: 'Datos de este asunto' },
    { clave: 'firma', rotulo: 'Quien firma' },
    { clave: 'genero', rotulo: 'Para que sirva con hombre y con mujer' },
    { clave: 'quitar', rotulo: 'Quitar' },
    { clave: 'manual', rotulo: 'Lo que has marcado tú' }
  ];

  var capa = null, api = null, st = null, paso = 1, cerrandose = false;
  var sel = null;   /* el menú sobre lo seleccionado (js/plantilla-seleccion.js) */

  function $(sel, raiz) { return (raiz || capa).querySelector(sel); }
  function esc(t) { return U.escapar(t); }

  /* ---------- la capa ---------- */

  function construir() {
    if (capa) capa.remove();
    capa = document.createElement('div');
    capa.id = 'convertir-plantilla';
    capa.className = 'cep';
    capa.innerHTML =
      '<div class="cep-barra"><span class="cep-titulo">Convertir en plantilla</span><span class="cep-nombre"></span></div>' +
      '<div class="cep-avisos"></div>' +
      '<div class="cep-cuerpo"></div>' +
      '<div class="cep-pie"><span class="cep-pie-texto"></span><span class="cep-pie-botones"></span></div>';
    document.body.appendChild(capa);
    document.body.classList.add('con-cep');
    $('.cep-nombre').textContent = st.nombre;
    document.addEventListener('keydown', alEscape, true);
    sel = PlantillaSeleccion.montar({
      documento: function () { return capa && capa.querySelector('.cep-doc .cep-hoja-interior'); },
      activo: function () { return !!capa && paso === 1; },
      opciones: function (s) {
        return [
          ['Cambiar por un dato…', function () { cambiarPorUnDato(s); }],
          ['Cambiar por otro texto…', function () { cambiarPorOtroTexto(s); }],
          ['Esto se pregunta cada vez', function () { sePreguntaCadaVez(s); }],
          ['Quitar del documento', function () { quitarDelDocumento(s); }]
        ];
      }
    });
  }

  function destruir() {
    document.removeEventListener('keydown', alEscape, true);
    if (sel) sel.destruir();
    sel = null;
    if (capa) capa.remove();
    capa = null;
    document.body.classList.remove('con-cep');
  }

  function abierta() { return !!capa; }

  /* Cancelar o Escape: con algo cambiado respecto a lo propuesto, pregunta antes. */
  async function cancelar() {
    if (cerrandose) return;
    cerrandose = true;
    try {
      if (st.tocado) {
        var ok = await U.preguntar('¿Salir sin guardar la plantilla?', '<p>Lo que has cambiado se perderá. No se ha escrito nada.</p>', 'Salir sin guardar');
        if (!ok) return;
      }
      destruir();
      if (resolverApertura) resolverApertura(false);
    } finally { cerrandose = false; }
  }

  function alEscape(ev) {
    if (ev.key !== 'Escape' || !capa || document.querySelector('#capa:not(.oculto)') || document.getElementById('huecos-cuadro')) return;
    ev.stopPropagation();
    ev.preventDefault();
    if (sel && sel.hayMenu()) { sel.ocultar(); return; }
    cancelar();
  }

  var resolverApertura = null;

  async function abrir(apiRecibida, estado) {
    api = apiRecibida;
    st = estado;
    paso = 1;
    construir();
    await pintarPaso1();
    return new Promise(function (r) { resolverApertura = r; });
  }

  /* ---------- el documento, con los huecos en amarillo (js/plantilla-seleccion.js) ---------- */

  function pintarDocumento(hoja, blob) { return PlantillaSeleccion.pintarDocumento(hoja, blob, irALinea); }

  /* Pulsar un hueco del documento lleva a su línea de la lista. */
  function irALinea(hueco) {
    var todas = st.prop.lineas.concat(st.manuales);
    var l = todas.filter(function (x) { return x.poner && x.poner.indexOf(hueco) !== -1; })[0];
    var el = l && capa.querySelector('[data-linea="' + l.id + '"]');
    if (!el) return;
    el.scrollIntoView({ block: 'nearest' });
    el.classList.add('cep-destello');
    setTimeout(function () { el.classList.remove('cep-destello'); }, 1200);
  }

  /* Pulsar una línea lleva el documento hasta el primer sitio de ese cambio. */
  function irADocumento(l) {
    var caja = capa.querySelector('.cep-doc .cep-hoja-interior');
    if (!caja) return;
    var destino = null;
    if (st.activos[l.id]) {
      destino = Array.prototype.slice.call(caja.querySelectorAll('mark.cep-hueco')).filter(function (m) {
        return l.poner && l.poner.indexOf(m.dataset.hueco) !== -1;
      })[0] || null;
      if (!destino && l.poner === '') destino = null;
    }
    if (!destino) destino = PlantillaSeleccion.primerSitioDeTexto(caja, l.buscar);
    if (destino) destino.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* La línea fija de arriba: de qué se parte, si no es un .docx tal cual. */
  function avisoDeOrigen() {
    if (st.orig.desdePdf) return '<div class="cep-aviso-gemelo">Este PDF no tiene su Word: he copiado solo el texto. Las tablas y los recuadros no se copian.</div>';
    return st.orig.usaGemelo ? '<div class="cep-aviso-gemelo">He encontrado el Word de este PDF y uso ese.</div>' : '';
  }

  /* El PDF de verdad, página a página (pdf.js), para compararlo con la plantilla. */
  async function pintarPdf(hoja, buffer) {
    var caja = hoja.querySelector('.cep-hoja-interior');
    if (!caja) { caja = document.createElement('div'); caja.className = 'cep-hoja-interior'; hoja.appendChild(caja); }
    caja.innerHTML = '';
    try {
      var pdfjsLib = await App.cargarPdfJs();
      var doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise;
      for (var n = 1; n <= doc.numPages; n++) {
        var pagina = await doc.getPage(n), vista = pagina.getViewport({ scale: 1.1 });
        var lienzo = document.createElement('canvas');
        lienzo.className = 'cep-pdf-pagina';
        lienzo.width = vista.width; lienzo.height = vista.height;
        caja.appendChild(lienzo);
        await pagina.render({ canvasContext: lienzo.getContext('2d'), viewport: vista }).promise;
      }
    } catch (e) {
      caja.innerHTML = '<p class="explica">No he podido enseñar este PDF: ' + esc(U.mensajeDeError(e)) + '</p>';
    }
  }

  /* ---------- paso 1: revisar ---------- */

  function textoVeces(n) { return n + (n === 1 ? ' vez' : ' veces'); }

  function filaDeLinea(l) {
    var fila = document.createElement('div');
    fila.className = 'cep-linea' + (l.grupo === 'quitar' && !st.membrete ? ' cep-linea-apagada' : '');
    fila.dataset.linea = l.id;
    var casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.checked = !!st.activos[l.id];
    casilla.disabled = l.grupo === 'quitar' && !st.membrete;
    casilla.onchange = async function () { await api.activar(l.id, casilla.checked); await refrescar(); };
    var texto = document.createElement('span');
    texto.className = 'cep-linea-texto';
    var antes = l.mostrar || l.buscar;
    var despues = l.grupo === 'quitar' ? 'se quita' : (l.mostrarPoner || l.etiqueta);
    var tipoManual = l.tipo === 'cadavez' ? 'Se pregunta cada vez: ' + l.nombreDato : null;
    texto.innerHTML = '<span class="cep-antes">' + esc(antes) + '</span> → <span class="cep-despues">' + esc(tipoManual || despues) + '</span>' +
      ' · <span class="cep-veces">' + textoVeces(api.veces(l)) + '</span>' +
      (l.nota ? ' <span class="cep-nota">' + esc(l.nota) + '</span>' : '');
    texto.onclick = function () { irADocumento(l); };
    fila.appendChild(casilla);
    fila.appendChild(texto);
    return fila;
  }

  function pintarLineas() {
    var caja = $('.cep-lineas');
    caja.innerHTML = '';
    var hay = false;
    GRUPOS.forEach(function (g) {
      var lineas = g.clave === 'manual' ? st.manuales : st.prop.lineas.filter(function (l) { return l.grupo === g.clave; });
      if (!lineas.length) return;
      hay = true;
      var rotulo = document.createElement('div');
      rotulo.className = 'cep-rotulo';
      rotulo.textContent = g.rotulo;
      caja.appendChild(rotulo);
      lineas.forEach(function (l) { caja.appendChild(filaDeLinea(l)); });
    });
    if (!hay) caja.innerHTML = '<p class="nota">No he encontrado nada que cambiar solo. Selecciona texto del documento para marcarlo tú.</p>';
  }

  function pintarMembrete() {
    var caja = $('.cep-membrete');
    caja.innerHTML = '';
    if (st.tieneMembrete) return;
    caja.innerHTML =
      '<label class="cep-casilla"><input type="checkbox" id="cep-membrete"' + (st.membrete ? ' checked' : '') + '> Poner el membrete de la app</label>' +
      (st.membrete ? '<label class="cep-casilla cep-casilla-sangrada"><input type="checkbox" id="cep-logo"' + (st.conLogo ? ' checked' : '') + '> Con el logo del centro</label>' : '');
    $('#cep-membrete').onchange = async function () { await api.cambiarMembrete(this.checked); await refrescar(); };
    var logo = $('#cep-logo');
    if (logo) logo.onchange = function () { st.conLogo = this.checked; api.marcarTocado(); };
  }

  function opcionesDeCategoria() {
    return Nombres.CATEGORIAS.map(function (c) { return '<option value="' + esc(c) + '"' + (c === st.plantilla.categoria ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
  }

  function opcionesDeHitos() {
    var lista = api.hitosDeLaGuia(st.plantilla.tipo);
    return '<option value="">Ninguno (sale en todos los hitos de este tipo)</option>' + lista.map(function (h) {
      return '<option value="' + esc(h.id) + '"' + (h.id === st.plantilla.hitoId ? ' selected' : '') + '>' + esc(h.titulo) + '</option>';
    }).join('');
  }

  function opcionesDeTiposDoc() {
    var lista = (App.E.tiposDocumento || []).slice();
    var actual = st.plantilla.tipoDocumento;
    if (actual && lista.indexOf(actual) === -1) lista.unshift(actual);
    return '<option value="">(elige uno)</option>' + lista.map(function (t) {
      return '<option value="' + esc(t) + '"' + (t === actual ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('');
  }

  function opcionesDeCargos(idElegido, conNinguno) {
    return (conNinguno ? '<option value="">(ninguno)</option>' : '') + (st.todosLosCargos || []).map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === idElegido ? ' selected' : '') + '>' + esc(c.nombre) + '</option>';
    }).join('');
  }

  function pintarDatosDePlantilla() {
    var caja = $('.cep-datos');
    var d = st.plantilla;
    caja.innerHTML =
      '<div class="cep-rotulo">Datos de la plantilla</div>' +
      '<label class="etiqueta" for="cep-nombre-plantilla">Nombre de la plantilla</label>' +
      '<input id="cep-nombre-plantilla" class="campo" value="' + esc(d.nombre) + '">' +
      '<div class="etiqueta">Tipo de asunto</div><div id="cep-tipo-asunto"></div>' +
      '<label class="etiqueta" for="cep-tipo-doc">Tipo de documento</label>' +
      '<select id="cep-tipo-doc" class="campo">' + opcionesDeTiposDoc() + '</select>' +
      '<label class="etiqueta" for="cep-texto">Texto adicional <span class="suave">(opcional)</span></label>' +
      '<input id="cep-texto" class="campo" value="' + esc(d.texto) + '">' +
      '<label class="etiqueta" for="cep-firmante">Quien firma</label>' +
      '<select id="cep-firmante" class="campo">' + opcionesDeCargos(d.firmante, true) + '</select>' +
      '<label class="etiqueta" for="cep-hito">Hito de la guía</label>' +
      '<select id="cep-hito" class="campo">' + opcionesDeHitos() + '</select>';
    $('#cep-nombre-plantilla').oninput = function () { d.nombre = this.value; api.marcarTocado(); };
    $('#cep-tipo-doc').onchange = function () { d.tipoDocumento = this.value; api.marcarTocado(); };
    $('#cep-texto').oninput = function () { d.texto = this.value; api.marcarTocado(); };
    $('#cep-firmante').onchange = function () { d.firmante = this.value; api.marcarTocado(); };
    $('#cep-hito').onchange = function () { d.hitoId = this.value; api.marcarTocado(); };
    if (window.TipoEnLinea) {
      TipoEnLinea.montar($('#cep-tipo-asunto'), {
        prefijo: 'cep-tipo', rotulo: '', tipo: d.tipo,
        alElegir: function (t) {
          d.tipo = t.tipo; d.categoria = t.categoria; d.hitoId = '';
          api.marcarTocado();
          $('#cep-hito').innerHTML = opcionesDeHitos();
        }
      });
    }
  }

  async function pintarPaso1() {
    paso = 1;
    st.todosLosCargos = st.todosLosCargos || await cargosTodos();
    var cuerpo = $('.cep-cuerpo');
    cuerpo.className = 'cep-cuerpo cep-paso1';
    cuerpo.innerHTML =
      '<div class="cep-doc"></div>' +
      '<div class="cep-lateral">' +
        '<div class="cep-lineas"></div><div class="cep-membrete"></div><div class="cep-datos"></div>' +
      '</div>';
    $('.cep-avisos').innerHTML = avisoDeOrigen();
    pintarLineas();
    pintarMembrete();
    pintarDatosDePlantilla();
    pintarPie();
    await pintarDocumento($('.cep-doc'), st.trabajo.blob);
  }

  async function cargosTodos() {
    try { return Cargos.ordenados(await Cargos.leer()); } catch (e) { return []; }
  }

  /* Tras marcar o desmarcar algo: la copia de trabajo ya está recalculada. */
  async function refrescar() {
    pintarLineas();
    pintarMembrete();
    await pintarDocumento($('.cep-doc'), st.trabajo.blob);
  }

  function pintarPie() {
    var botones = $('.cep-pie-botones');
    botones.innerHTML = '';
    function boton(texto, clase, accion) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'boton ' + (clase || ''); b.textContent = texto; b.onclick = function () { accion(b); };
      botones.appendChild(b);
      return b;
    }
    if (paso === 1) {
      boton('Cancelar', '', cancelar);
      boton('Ver cómo queda', 'boton-principal', verComoQueda);
    } else {
      boton('← Volver a corregir', '', volverACorregir);
      boton('Cancelar', '', cancelar);
      boton('Guardar plantilla', 'boton-principal', guardar);
    }
  }

  /* ---------- lo que se hace con lo seleccionado (el menú: js/plantilla-seleccion.js) ---------- */

  async function marcarManual(m) {
    await api.anadirManual(m);
    sel.ocultar();
    await refrescar();
  }

  function cambiarPorUnDato(s) {
    PlantillaSeleccion.cambiarPorUnDato(s, function (hueco) {
      marcarManual({ tipo: 'dato', buscar: s.texto, poner: hueco, mostrarPoner: hueco, etiqueta: ConvertirEnPlantillaPropuestas.etiquetaDe(hueco) });
    });
  }

  /* Fila 322: un trozo por otro texto, que se escribe. Entra en «Lo que has marcado tú» como los demás. */
  async function cambiarPorOtroTexto(s) {
    sel.ocultar();
    var nuevo = await PlantillaSeleccion.cuadroCambiarTexto(s.texto);
    if (nuevo) await marcarManual({ tipo: 'otrotexto', buscar: s.texto, poner: nuevo, mostrarPoner: nuevo, etiqueta: nuevo });
  }

  async function sePreguntaCadaVez(s) {
    sel.ocultar();
    var ok = await U.preguntar('¿Cómo se llama este dato?',
      '<input id="cep-nombre-dato" class="campo" placeholder="Motivo de la salida" autocomplete="off">' +
      '<p class="nota">Se preguntará cada vez que se genere el documento, en «Faltan datos para este documento».</p>', 'Aceptar');
    if (!ok) return;
    var nombre = ((document.getElementById('cep-nombre-dato') || {}).value || '').trim();
    if (!nombre) return;
    if (api.nombreDeDatoOcupado(nombre)) {
      U.aviso('Ya hay un dato con ese nombre. Elígelo en «Cambiar por un dato…».', 'ambar');
      return;
    }
    await marcarManual({ tipo: 'cadavez', buscar: s.texto, poner: '{campo:' + nombre + '}', nombreDato: nombre, etiqueta: nombre });
  }

  function quitarDelDocumento(s) {
    marcarManual({ tipo: 'quitar', buscar: s.texto, poner: '', mostrarPoner: 'se quita', etiqueta: 'Quitar' });
  }

  /* ---------- paso 2: comparar y guardar ---------- */

  async function verComoQueda(boton) {
    var d = st.plantilla;
    if (!String(d.nombre || '').trim()) { U.aviso('Pon un nombre a la plantilla.', 'malo'); $('#cep-nombre-plantilla').focus(); return; }
    if (!d.tipoDocumento) { U.aviso('Elige el tipo de documento.', 'malo'); $('#cep-tipo-doc').focus(); return; }
    d.nombre = d.nombre.trim();
    boton.disabled = true;
    try {
      var relleno = await api.rellenarEnMemoria();
      await pintarPaso2(relleno);
    } catch (e) {
      U.fallo('No he podido preparar la comparación', e);
      boton.disabled = false;
    }
  }

  async function pintarPaso2(relleno) {
    paso = 2;
    sel.ocultar();
    var cuerpo = $('.cep-cuerpo');
    cuerpo.className = 'cep-cuerpo cep-paso2';
    cuerpo.innerHTML =
      '<div class="cep-pestanas"><button type="button" class="cep-pestana activa" data-col="0">El original</button>' +
      '<button type="button" class="cep-pestana" data-col="1">Con la plantilla nueva</button></div>' +
      '<div class="cep-comparar">' +
        '<div class="cep-col" data-col="0"><h3>El original</h3><div class="cep-hoja-ext"></div></div>' +
        '<div class="cep-col" data-col="1"><h3>Con la plantilla nueva</h3><div class="cep-hoja-ext"></div></div>' +
      '</div>';
    $('.cep-avisos').innerHTML = avisoDeOrigen() +
      (relleno.faltan.length ? '<div class="cep-aviso-falta">Hay ' + relleno.faltan.length + (relleno.faltan.length === 1 ? ' dato que' : ' datos que') +
        ' este asunto no tiene: ' + esc(relleno.faltan.join(', ')) + '.</div>' : '');
    Array.prototype.forEach.call(cuerpo.querySelectorAll('.cep-pestana'), function (p) {
      p.onclick = function () {
        Array.prototype.forEach.call(cuerpo.querySelectorAll('.cep-pestana'), function (x) { x.classList.toggle('activa', x === p); });
        Array.prototype.forEach.call(cuerpo.querySelectorAll('.cep-col'), function (c) { c.classList.toggle('cep-col-visible', c.dataset.col === p.dataset.col); });
      };
    });
    cuerpo.querySelector('.cep-col[data-col="0"]').classList.add('cep-col-visible');
    pintarPie();
    var cols = cuerpo.querySelectorAll('.cep-hoja-ext');
    if (st.orig.desdePdf) await pintarPdf(cols[0], st.orig.pdfBuffer);
    else await pintarDocumento(cols[0], new Blob([st.orig.buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    await pintarDocumento(cols[1], relleno.blob);
  }

  async function volverACorregir() {
    $('.cep-avisos').innerHTML = '';
    await pintarPaso1();
  }

  async function guardar(boton) {
    boton.disabled = true;
    try {
      var hecho = await U.mientrasGuarda(boton, function () { return api.guardar(); });
      if (!hecho) { boton.disabled = false; return; }
    } catch (e) { boton.disabled = false; U.fallo('No he podido guardar la plantilla', e); return; }
    var a = st.asunto;
    destruir();
    U.aviso('Plantilla guardada. Ya sale en «Generar documento» de este tipo de asunto.', 'bueno');
    if (window.FichaDocumentos) { try { FichaDocumentos.pintar(a); } catch (e2) { /* solo pintar */ } }
    if (window.HitosPanel) HitosPanel.programarRepintado();
    if (resolverApertura) resolverApertura(true);
  }

  return { abrir: abrir, abierta: abierta, cancelar: cancelar, _irADocumento: irADocumento };
})();
window.ConvertirEnPlantillaPantalla = ConvertirEnPlantillaPantalla;
