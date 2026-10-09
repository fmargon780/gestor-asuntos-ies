/* ============================================================
   plantilla-retocar-pantalla.js — la pantalla de «Retocar» una plantilla
   de Word (fila 322, docs/RETOCAR-UNA-PLANTILLA.md).

   A pantalla completa, con el aspecto del primer paso de «Convertir en
   plantilla» (css/convertir-en-plantilla.css): a la izquierda el Word de
   la plantilla con sus huecos resaltados; a la derecha «Lo que has
   cambiado». Seleccionando un trozo sale el menú de
   js/plantilla-seleccion.js con cinco opciones. La lógica (cambios,
   aplicar desde el original, guardar) está en js/plantilla-retocar.js.
   ============================================================ */
var PlantillaRetocarPantalla = (function () {

  var capa = null, plantilla = null, sesion = null, sel = null, cerrandose = false, resolverApertura = null;

  function $(q) { return capa.querySelector(q); }
  function esc(t) { return U.escapar(t); }
  function textoVeces(n) { return n + (n === 1 ? ' vez' : ' veces'); }
  function caja() { return capa && capa.querySelector('.cep-doc .cep-hoja-interior'); }

  /* ---------- la capa ---------- */

  function construir() {
    capa = document.createElement('div');
    capa.id = 'retocar-plantilla';
    capa.className = 'cep';
    capa.innerHTML =
      '<div class="cep-barra"><span class="cep-titulo">Retocar</span><span class="cep-nombre"></span></div>' +
      '<div class="cep-avisos"></div>' +
      '<div class="cep-cuerpo cep-paso1">' +
        '<div class="cep-doc"></div>' +
        '<div class="cep-lateral">' +
          '<h3 class="cer-titulo"></h3>' +
          '<p class="nota">Selecciona con el ratón el trozo que quieras cambiar.</p>' +
          '<div class="cep-rotulo">Lo que has cambiado</div>' +
          '<div class="cep-lineas"></div>' +
          '<p class="nota cer-pie-nota">Para añadir párrafos, tablas o cambiar el formato: corrígelo en Word y usa «Sustituir el fichero».</p>' +
        '</div>' +
      '</div>' +
      '<div class="cep-pie"><span class="cep-pie-texto"></span><span class="cep-pie-botones"></span></div>';
    document.body.appendChild(capa);
    document.body.classList.add('con-cep');
    $('.cep-nombre').textContent = plantilla.nombre;
    $('.cer-titulo').textContent = 'Retocar «' + plantilla.nombre + '»';
    document.addEventListener('keydown', alEscape, true);
    sel = PlantillaSeleccion.montar({
      documento: caja,
      activo: function () { return !!capa; },
      conHuecos: true,
      opciones: function (s) {
        return [
          ['Cambiar por un dato…', function () { cambiarPorUnDato(s); }],
          ['Cambiar por otro texto…', function () { cambiarPorOtroTexto(s); }],
          ['Esto se pregunta cada vez', function () { sePreguntaCadaVez(s); }],
          ['Quitar del documento', function () { anadir({ tipo: 'quitar', buscar: s.texto, poner: '' }); }],
          ['Quitar el párrafo entero', function () { quitarElParrafo(s); }]
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

  function alEscape(ev) {
    if (ev.key !== 'Escape' || !capa || document.querySelector('#capa:not(.oculto)') || document.getElementById('huecos-cuadro')) return;
    ev.stopPropagation();
    ev.preventDefault();
    if (sel && sel.hayMenu()) { sel.ocultar(); return; }
    cancelar();
  }

  /* Cancelar o Escape: con cambios sin guardar, pregunta antes. */
  async function cancelar() {
    if (cerrandose) return;
    cerrandose = true;
    try {
      if (sesion.tocado()) {
        var n = sesion.lineas.length;
        var espera = U.preguntar('Has cambiado ' + n + (n === 1 ? ' cosa' : ' cosas') + '. ¿Salir sin guardar?',
          '<p>Lo que has cambiado se perderá. No se ha escrito nada.</p>', 'Salir sin guardar');
        var seguir = document.getElementById('cuadro-cancelar');
        if (seguir) seguir.textContent = 'Seguir retocando';
        var ok = await espera;
        if (seguir) seguir.textContent = 'Cancelar';
        if (!ok) return;
      }
      destruir();
      if (resolverApertura) resolverApertura(false);
    } finally { cerrandose = false; }
  }

  /* ---------- el documento ---------- */

  /* Resalta en verde lo que se ha puesto en lugar de otra cosa. */
  function resaltarCambios(raiz) {
    sesion.lineas.forEach(function (l) {
      if ((l.tipo !== 'texto' && l.tipo !== 'cadavez') || !l.poner || /[{}]/.test(l.poner)) return;
      var recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null), nodos = [], n;
      while ((n = recorrido.nextNode())) { if (n.parentNode.nodeName !== 'STYLE' && n.nodeValue.indexOf(l.poner) !== -1) nodos.push(n); }
      nodos.forEach(function (nodo) {
        var texto = nodo.nodeValue, ultimo = 0, i, frag = document.createDocumentFragment();
        while ((i = texto.indexOf(l.poner, ultimo)) !== -1) {
          if (i > ultimo) frag.appendChild(document.createTextNode(texto.slice(ultimo, i)));
          var m = document.createElement('mark');
          m.className = 'cep-cambio'; m.dataset.linea = l.id; m.textContent = l.poner;
          frag.appendChild(m);
          ultimo = i + l.poner.length;
        }
        if (ultimo < texto.length) frag.appendChild(document.createTextNode(texto.slice(ultimo)));
        nodo.parentNode.replaceChild(frag, nodo);
      });
    });
  }

  async function pintarDocumento() {
    await PlantillaSeleccion.pintarDocumento($('.cep-doc'), sesion.trabajo.blob, null);
    if (caja()) resaltarCambios(caja());
  }

  function irADocumento(l) {
    var c = caja();
    if (!c || l.tipo === 'parrafo') return;
    var destino = c.querySelector('mark.cep-cambio[data-linea="' + l.id + '"]') ||
      (l.poner && Array.prototype.filter.call(c.querySelectorAll('mark.cep-hueco'), function (m) { return l.poner.indexOf(m.dataset.hueco) !== -1; })[0]) ||
      PlantillaSeleccion.primerSitioDeTexto(c, l.buscar);
    if (destino) destino.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* ---------- la lista ---------- */

  function filaDeLinea(l) {
    var fila = document.createElement('div');
    fila.className = 'cep-linea';
    fila.dataset.linea = l.id;
    var d = PlantillaRetocar.descripcion(l);
    var texto = document.createElement('span');
    texto.className = 'cep-linea-texto';
    texto.innerHTML = '<span class="cep-antes">' + esc(d.antes) + '</span>' +
      (d.despues ? ' → <span class="cep-despues">' + esc(d.despues) + '</span> · <span class="cep-veces">' + textoVeces(sesion.veces(l)) + '</span>' : '');
    texto.onclick = function () { irADocumento(l); };
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'cer-x'; x.textContent = '✕'; x.title = 'Deshacer este cambio';
    x.onclick = async function () { await sesion.quitar(l.id); await refrescar(); };
    fila.appendChild(texto);
    fila.appendChild(x);
    return fila;
  }

  function pintarLineas() {
    var c = $('.cep-lineas');
    c.innerHTML = '';
    if (!sesion.lineas.length) { c.innerHTML = '<p class="nota">Todavía no has cambiado nada.</p>'; return; }
    sesion.lineas.forEach(function (l) { c.appendChild(filaDeLinea(l)); });
  }

  function pintarPie() {
    var botones = $('.cep-pie-botones');
    botones.innerHTML = '';
    var cancelarB = document.createElement('button');
    cancelarB.type = 'button'; cancelarB.className = 'boton'; cancelarB.textContent = 'Cancelar';
    cancelarB.onclick = cancelar;
    var guardarB = document.createElement('button');
    guardarB.type = 'button'; guardarB.className = 'boton boton-principal'; guardarB.id = 'cer-guardar';
    guardarB.textContent = 'Guardar los cambios';
    guardarB.disabled = !sesion.tocado();
    guardarB.onclick = function () { guardar(guardarB); };
    botones.appendChild(cancelarB);
    botones.appendChild(guardarB);
  }

  async function refrescar() {
    sel.ocultar();
    pintarLineas();
    pintarPie();
    await pintarDocumento();
  }

  /* ---------- lo que se hace con lo seleccionado ---------- */

  async function anadir(m) {
    var r = await sesion.anadir(m);
    sel.ocultar();
    if (r.aviso) U.aviso(r.aviso, 'ambar');
    await refrescar();
  }

  function cambiarPorUnDato(s) {
    PlantillaSeleccion.cambiarPorUnDato(s, function (hueco) { anadir({ tipo: 'dato', buscar: s.texto, poner: hueco }); });
  }

  async function cambiarPorOtroTexto(s) {
    sel.ocultar();
    var nuevo = await PlantillaSeleccion.cuadroCambiarTexto(s.texto);
    if (nuevo) await anadir({ tipo: 'texto', buscar: s.texto, poner: nuevo });
  }

  /* Un nombre que ya es un hueco del catálogo o un campo del tipo no vale como «se pregunta cada vez». */
  function nombreOcupado(nombre) {
    var k = U.normalizar(nombre).replace(/\s+/g, '');
    if (Plantillas.HUECOS.some(function (h) { return U.normalizar(h.clave).replace(/\s+/g, '') === k || U.normalizar(h.etiqueta).replace(/\s+/g, '') === k; })) return true;
    var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[plantilla.tipo]) || [];
    return config.some(function (cfg) {
      try { return U.normalizar(Campos.nombreDeCampo(cfg, App.E.campos)).replace(/\s+/g, '') === k; } catch (e) { return false; }
    });
  }

  async function sePreguntaCadaVez(s) {
    sel.ocultar();
    var ok = await U.preguntar('¿Cómo se llama este dato?',
      '<input id="cep-nombre-dato" class="campo" placeholder="Motivo de la salida" autocomplete="off">' +
      '<p class="nota">Se preguntará cada vez que se genere el documento, en «Faltan datos para este documento».</p>', 'Aceptar');
    if (!ok) return;
    var nombre = ((document.getElementById('cep-nombre-dato') || {}).value || '').trim();
    if (!nombre) return;
    if (nombreOcupado(nombre)) { U.aviso('Ya hay un dato con ese nombre. Elígelo en «Cambiar por un dato…».', 'ambar'); return; }
    await anadir({ tipo: 'cadavez', buscar: s.texto, poner: '{campo:' + nombre + '}', nombreDato: nombre });
  }

  async function quitarElParrafo(s) {
    var c = caja();
    var parrafos = Array.prototype.filter.call(c.querySelectorAll('p'), function (p) { return !p.closest('header, footer'); });
    var pos = parrafos.indexOf(s.parrafo);
    var indice = sesion.parrafoOriginal(parrafos.map(function (p) { return p.textContent; }), pos);
    sel.ocultar();
    if (indice === null) {
      U.aviso('No sé cuál de los párrafos iguales quieres quitar. Quítalo en Word y usa «Sustituir el fichero».', 'ambar');
      return;
    }
    await anadir({ tipo: 'parrafo', indice: indice, resumen: PlantillaRetocar.principio(s.parrafo.textContent) });
  }

  /* ---------- guardar ---------- */

  async function guardar(boton) {
    boton.disabled = true;
    var hecho = false;
    try { hecho = await U.mientrasGuarda(boton, function () { return PlantillaRetocar.guardar(plantilla, sesion, alTerminar); }); }
    catch (e) { U.fallo('No he podido guardar los cambios', e); }
    if (!hecho) { if (capa) boton.disabled = !sesion.tocado(); return; }
    destruir();
    if (resolverApertura) resolverApertura(true);
  }

  var alTerminar = null;

  /* Abre la pantalla sobre la plantilla de Word `p`. `fin()` repinta lo de fuera al guardar o deshacer.
     Devuelve una promesa: true si se guardó, false si se salió sin guardar. */
  async function abrir(p, fin) {
    if (capa) return false;
    var buffer;
    try {
      var dir = await PlantillasDocumento._interno.carpetaDePlantillas();
      var h = await dir.getFileHandle(p.fichero);
      buffer = await (await h.getFile()).arrayBuffer();
    } catch (e) {
      U.aviso('No encuentro «' + p.fichero + '» en la carpeta de plantillas.', 'malo');
      return false;
    }
    plantilla = p;
    alTerminar = fin;
    sesion = PlantillaRetocar.nueva(buffer);
    try { await sesion.aplicar(); } catch (e) { U.fallo('No he podido abrir este Word', e); return false; }
    construir();
    pintarLineas();
    pintarPie();
    await pintarDocumento();
    return new Promise(function (r) { resolverApertura = r; });
  }

  return { abrir: abrir, abierta: function () { return !!capa; }, cancelar: cancelar };
})();
window.PlantillaRetocarPantalla = PlantillaRetocarPantalla;
