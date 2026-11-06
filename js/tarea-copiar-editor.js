/* ============================================================
   tarea-copiar-editor.js — el formulario de la tarea «Copiar a otra carpeta»
   (fila 552, docs/552-COPIAR-A-OTRA-CARPETA.md). Lo usan «Tarea nueva» y
   «Cambiar la tarea» de la lista común (js/comunes-ventana-nuevo.js,
   js/comunes-cambiar.js) y el editor de la guía (js/guias-guion.js).

   Carpeta (con «Elegir carpeta»), «Qué copia» (solo se lee) y «Nombre del
   fichero copiado», con «Insertar campo» (la ventana de elegir campo de las
   plantillas) y debajo «Saldrá así: …». La receta es la de js/tarea-copiar.js:
   `{ carpeta, carpetaId, patron }`.
   ============================================================ */
window.TareaCopiarEditor = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  var QUE_COPIA = 'El documento de la tarea de registrar de este hito, cuando llega registrado.';

  /* El formulario. `r`: la receta que se ve al empezar. */
  function formularioHTML(r) {
    r = r || {};
    return '<div class="tcp-form" data-carpeta="' + esc(r.carpeta || '') + '" data-carpetaid="' + esc(r.carpetaId || '') + '">' +
      '<div class="dato"><span class="etiqueta">Carpeta</span> <span class="tcp-carpeta">' +
        (r.carpeta ? esc(r.carpeta) : '<span class="suave">Ninguna elegida</span>') + '</span> ' +
        '<button type="button" class="boton boton-chico tcp-elegir">Elegir carpeta</button></div>' +
      '<div class="dato"><span class="etiqueta">Qué copia</span> <span class="suave">' + QUE_COPIA + '</span></div>' +
      '<div class="dato"><label class="etiqueta" for="tcp-patron">Nombre del fichero copiado</label>' +
        '<span class="en-linea"><input id="tcp-patron" class="campo tcp-patron" value="' + esc(r.patron || '') +
        '" placeholder="Sin nada: el mismo nombre del documento" autocomplete="off">' +
        '<button type="button" class="boton boton-chico tcp-insertar">Insertar campo</button></span></div>' +
      '<div class="ejemplo tcp-ejemplo pequeno suave">Saldrá así: …</div></div>';
  }

  /* La receta que dice el formulario `raiz` (null si no dice nada). */
  function leer(raiz) {
    var f = raiz && raiz.querySelector('.tcp-form');
    if (!f) return null;
    var p = f.querySelector('.tcp-patron');
    return GuiasGuion.normalizarReceta('copiar', { carpeta: f.dataset.carpeta, carpetaId: f.dataset.carpetaid, patron: p ? p.value : '' });
  }

  async function pintarEjemplo(f) {
    var e = f.querySelector('.tcp-ejemplo'), p = f.querySelector('.tcp-patron');
    if (!e || !p) return;
    var turno = f._turno = (f._turno || 0) + 1;
    var texto = await TareaCopiar.ejemplo(p.value);
    if (turno === f._turno) e.textContent = 'Saldrá así: ' + texto;
  }

  /* Pone la carpeta en el formulario y la deja recordada en este ordenador. */
  async function elegirCarpeta(f) {
    var h = await TareaCopiar.elegirCarpeta();
    if (!h) return false;
    var id = f.dataset.carpetaid || U.nuevoId('cp');
    f.dataset.carpetaid = id;
    f.dataset.carpeta = h.name;
    await TareaCopiar.recordar({ carpetaId: id }, h);
    var s = f.querySelector('.tcp-carpeta');
    if (s) s.textContent = h.name;
    return true;
  }

  function insertarCampo(f) {
    var p = f.querySelector('.tcp-patron');
    var ini = p.selectionStart, fin = p.selectionEnd;
    CamposElegir.abrir({ tipo: '', alElegir: function (c) {
      var v = p.value, a = typeof ini === 'number' ? ini : v.length, b = typeof fin === 'number' ? fin : a;
      p.value = v.slice(0, a) + c.marca + v.slice(b);
      p.focus();
      p.dispatchEvent(new Event('input', { bubbles: true }));
    } }).catch(function (e) { U.fallo('No he podido abrir la lista de campos', e); });
  }

  /* Engancha el formulario de `raiz` (uno suelto, como en las ventanas de la lista común). */
  function enganchar(raiz) {
    var f = raiz && raiz.querySelector('.tcp-form');
    if (!f) return;
    f.querySelector('.tcp-elegir').onclick = function () {
      elegirCarpeta(f).then(function () {
        Array.prototype.forEach.call(document.querySelectorAll('#cn-err, #cc-err'), function (e) { e.innerHTML = ''; });   /* el aviso de «Elige la carpeta» ya no vale */
        pintarEjemplo(f);
      }).catch(function (e) { U.fallo('No he podido elegir la carpeta', e); });
    };
    f.querySelector('.tcp-insertar').onclick = function () { insertarCampo(f); };
    f.querySelector('.tcp-patron').addEventListener('input', function () { pintarEjemplo(f); });
    pintarEjemplo(f);
  }

  /* El mismo formulario dentro del editor de la guía (js/guias-guion.js › recetaHTML). La receta se lee de él en `leerFila`. */
  function bloqueGuiaHTML(r) {
    return '<div class="guion-fila-linea guion-receta guion-receta-copiar" data-carpeta="' + esc((r && r.carpeta) || '') +
      '" data-carpetaid="' + esc((r && r.carpetaId) || '') + '">' + formularioHTML(r).replace(/ id="tcp-patron"/, '').replace(/ for="tcp-patron"/, '') + '</div>';
  }

  /* En la guía todo el bloque se repinta: lo de dentro se engancha desde fuera con `guia(fila)`. */
  function guia(fila, alCambiar) {
    var b = fila.querySelector(':scope > .guion-receta-copiar');
    var f = b && b.querySelector('.tcp-form');
    if (!f) return;
    function sincronizar() { b.dataset.carpeta = f.dataset.carpeta; b.dataset.carpetaid = f.dataset.carpetaid; }
    f.querySelector('.tcp-elegir').onclick = function () {
      elegirCarpeta(f).then(function (ok) { if (ok) { sincronizar(); alCambiar(function () { /* solo repintar con lo leído */ }); } })
        .catch(function (e) { U.fallo('No he podido elegir la carpeta', e); });
    };
    f.querySelector('.tcp-insertar').onclick = function () { insertarCampo(f); };
    f.querySelector('.tcp-patron').addEventListener('input', function () { pintarEjemplo(f); });
    pintarEjemplo(f);
  }

  /* La receta que lee el editor de la guía de un bloque `.guion-receta-copiar`. */
  function leerGuia(bloque) {
    var p = bloque.querySelector('.tcp-patron');
    return { carpeta: bloque.dataset.carpeta, carpetaId: bloque.dataset.carpetaid, patron: p ? p.value : '' };
  }

  return { formularioHTML: formularioHTML, leer: leer, enganchar: enganchar, bloqueGuiaHTML: bloqueGuiaHTML, guia: guia, leerGuia: leerGuia };
})();
