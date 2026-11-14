/* ============================================================
   tareas-con-documento-vista.js — lo que se ve de la fila 522
   (docs/522-TAREAS-CON-DOCUMENTO.md; pantalla de prueba docs/pantallas/516.html):
   el documento colgado de cada tarea de generar o registrar, en la mesa del hito.

     - Con documento: su nombre (pulsable: se abre en la columna de la derecha), «Ruta»,
       sus datos en gris y, si la tarea no está hecha (ni es de generar), «Cambiar».
     - Hecha, con la versión con la que quedó: el nombre que tiene en «_Previas», sin «Ruta».
     - Sin documento: «Saldrá aquí al generar …» si una tarea de generar pendiente va antes;
       si no, «Elegir documento» (un desplegable con los documentos del asunto).

   El dato y sus reglas están en js/tareas-con-documento.js. Lo pinta y lo engancha
   js/hito-mesa-guion.js (`HitoMesaGuion.pintar`).
   ============================================================ */
window.TareasConDocumentoVista = (function () {

  var T = function () { return window.TareasConDocumento; };

  /* idTarea -> los documentos entre los que se elige (solo mientras el desplegable está abierto). */
  var eligiendo = {};

  function extension(n) { return ((window.Nombres && Nombres.extensionDe(n)) || '').toUpperCase(); }

  /* El documento tal como se llama ahora: entre los de los hitos con la misma clave de gemelo, el PDF (no el
     «SIN SELLAR» ni el Word) si lo hay; si no, el nombre guardado. */
  function nombreActual(guardado, hitos) {
    var HD = window.HitoMesaDocumentos;
    if (!HD || !hitos) return guardado;
    var candidatos = [];
    T().recorrer(hitos, function (h) {
      (h.documentos || []).forEach(function (n) { if (T().mismo(n, guardado) && candidatos.indexOf(n) === -1) candidatos.push(n); });
    });
    var grupos = HD.agrupar(candidatos, null);
    return grupos.length ? grupos[0].nombre : guardado;
  }

  /* «Saldrá aquí al generar <lo que sea>.»: la tarea de generar pendiente que va antes. */
  function textoDeSaldra(g, guion) {
    var i = guion.map(function (x) { return x.id; }).indexOf(g.id);
    for (var k = i - 1; k >= 0; k--) {
      var x = guion[k];
      if (x.accion === 'generar' && !x.hecho && !x.noaplica) {
        var queSale = x.texto.replace(/^generar\s+/i, '').trim();
        return 'Saldrá aquí al generar ' + (queSale || 'el documento') + '.';
      }
    }
    return '';
  }

  function lineaDocumentoHTML(a, nombre, abierto) {
    var HD = window.HitoMesaDocumentos;
    return '<span class="tcd-ext">' + U.escapar(extension(nombre) || 'DOC') + '</span>' +
      '<button type="button" class="enlace tcd-abrir" data-doc="' + U.escapar(nombre) + '" title="' + U.escapar(nombre) + '">' + U.escapar(nombre) + '</button>' +
      (window.RutaCarpetas ? RutaCarpetas.huecoHTML(nombre) : '') +
      (window.ExtractoDocumento ? ExtractoDocumento.huecoHTML(nombre) : '') +   /* fila 638: «Ruta» y «Extracto» */
      (HD && HD.datosDeLaLinea ? HD.datosDeLaLinea(a, nombre, false, true) : '');
  }

  /* Lo que cuelga de la tarea `g`, o ''. `ctx`: { guion, hitos, abierto }. */
  function colgadoHTML(a, h, g, ctx) {
    if (!T() || !T().colgable(g) || g.noaplica) return '';
    var soloAnadir = g.accion === 'anadir';   /* fila 638: su documento es el que se añade; no se elige ni se cambia aquí */
    var ent = T().de(h, g.id);
    var cuerpo = '';
    var apagado = false;
    if (ctx.abierto && eligiendo[g.id]) {
      cuerpo = '<select class="campo tcd-selector"><option value="">Elige un documento…</option>' +
        eligiendo[g.id].map(function (n) { return '<option value="' + U.escapar(n) + '">' + U.escapar(n) + '</option>'; }).join('') +
        '</select><button type="button" class="enlace tcd-cancelar">Cancelar</button>';
    } else if (g.hecho && ent && ent.version) {
      apagado = true;
      cuerpo = '<span class="tcd-ext">' + U.escapar(extension(ent.version) || 'DOC') + '</span>' +
        '<button type="button" class="enlace tcd-abrir-version" data-doc="' + U.escapar(ent.version) + '" title="' + U.escapar(ent.version) + '">' + U.escapar(ent.version) + '</button>';
    } else if (ent && ent.doc) {
      apagado = !!g.hecho;
      cuerpo = lineaDocumentoHTML(a, nombreActual(ent.doc, ctx.hitos), ctx.abierto) +
        (!g.hecho && g.accion !== 'generar' && !soloAnadir && ctx.abierto ? '<button type="button" class="enlace tcd-cambiar">Cambiar</button>' : '');
    } else if (g.accion === 'generar' || g.hecho || soloAnadir) {
      return '';
    } else {
      var saldra = textoDeSaldra(g, ctx.guion);
      /* Fila 638: comunicar sin documento va libre (sin «Elegir documento»); registrar y firmar lo piden. */
      cuerpo = saldra ? '<span class="tcd-saldra">' + U.escapar(saldra) + '</span>'
        : (ctx.abierto && g.accion !== 'comunicar' ? '<button type="button" class="enlace tcd-elegir">Elegir documento</button>' : '');
      if (!cuerpo) return '';
    }
    return '<div class="tcd' + (apagado ? ' tcd-apagado' : '') + '" data-tarea="' + U.escapar(g.id) + '">' + cuerpo + '</div>';
  }

  /* Los documentos del asunto, de cualquier hito y los sueltos de la carpeta (sin «SIN SELLAR» ni Word repetidos). */
  async function documentosDelAsunto(a, hitos) {
    var enCarpeta = [], previas = [];
    try { enCarpeta = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); } catch (e) { enCarpeta = []; }
    try { if (window.VersionesPrevias) previas = (await VersionesPrevias.listar(a.handle)).map(function (f) { return f.nombre; }); } catch (e2) { previas = []; }
    var nombres = [];
    function sumar(n) { if (n && nombres.indexOf(n) === -1 && previas.indexOf(n) === -1 && /\.(pdf|docx?|odt)$/i.test(n)) nombres.push(n); }
    T().recorrer(hitos, function (x) { (x.documentos || []).forEach(sumar); });
    enCarpeta.forEach(sumar);
    return window.HitoMesaDocumentos.agrupar(nombres.filter(function (n) { return !enCarpeta.length || enCarpeta.indexOf(n) !== -1; }), enCarpeta)
      .map(function (g) { return g.nombre; });
  }

  /* Engancha lo colgado de las tareas ya pintadas en `caja`. `repintar()`: repinta solo esta tarjeta. */
  function enganchar(caja, a, h, hitos, abierto, repintar) {
    var modo = abierto ? 'abierto' : 'archivado';
    var HD = window.HitoMesaDocumentos;
    Array.prototype.forEach.call(caja.querySelectorAll('.tcd'), function (c) {
      var id = c.dataset.tarea;
      if (window.RutaCarpetas) RutaCarpetas.enganchar(c, a, modo);
      if (window.ExtractoDocumento) ExtractoDocumento.enganchar(c, a);   /* fila 638 */
      var abrir = c.querySelector('.tcd-abrir');
      if (abrir) abrir.onclick = function () { if (HD && HD.abrirEnVisor) HD.abrirEnVisor(a, abrir.dataset.doc, modo); };
      var version = c.querySelector('.tcd-abrir-version');
      if (version) version.onclick = function () { if (window.VersionesPrevias) VersionesPrevias.abrir(a, version.dataset.doc, modo); };
      var pedir = c.querySelector('.tcd-elegir') || c.querySelector('.tcd-cambiar');
      if (pedir) pedir.onclick = async function () {
        pedir.disabled = true;
        try { eligiendo[id] = await documentosDelAsunto(a, hitos); }
        catch (e) { U.aviso('No he podido ver los documentos del asunto: ' + U.mensajeDeError(e), 'ambar'); }
        repintar();
      };
      var cancelar = c.querySelector('.tcd-cancelar');
      if (cancelar) cancelar.onclick = function () { delete eligiendo[id]; repintar(); };
      var selector = c.querySelector('.tcd-selector');
      if (selector) selector.onchange = function () {
        if (!selector.value) return;
        var elegido = selector.value;
        delete eligiendo[id];
        T().asignar(a.nombre, h.id, id, elegido).then(function () {
          if (window.HitosPanel) HitosPanel.programarRepintado();
        }).catch(function (err) { U.fallo('No he podido colgar el documento de la tarea', err); repintar(); });
      };
    });
    comprobarQueEstan(caja, a);
  }

  /* «(ya no está)» en lo colgado que no está en la carpeta (nombre actual) ni en «_Previas» (versión). */
  async function comprobarQueEstan(caja, a) {
    var botones = caja.querySelectorAll('.tcd-abrir, .tcd-abrir-version');
    if (!botones.length) return;
    var enCarpeta, previas = [];
    try { enCarpeta = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); } catch (e) { return; }
    try { if (window.VersionesPrevias) previas = (await VersionesPrevias.listar(a.handle)).map(function (f) { return f.nombre; }); } catch (e2) { previas = []; }
    Array.prototype.forEach.call(botones, function (b) {
      var lista = b.classList.contains('tcd-abrir-version') ? previas : enCarpeta;
      if (lista.indexOf(b.dataset.doc) !== -1 || /ya no está/.test(b.textContent)) return;
      b.textContent = b.dataset.doc + ' (ya no está)';
      b.classList.add('tcd-falta');
    });
  }

  /* ---------- «Qué se hace» (nueva tarea y «Cambiar») ---------- */

  function quitarBotonPlantilla(raiz) {
    Array.prototype.forEach.call(raiz.querySelectorAll('.guia-plantilla-ver'), function (b) { b.remove(); });
  }

  /* Los desplegables de la receta de esa acción (los mismos que la guía). */
  function recetaHTML(accion, receta) {
    if (!window.GuiasGuion) return '';
    return GuiasGuion.recetaHTML({ accion: accion || '', receta: receta || null }, false);
  }

  /* `g`: { accion, receta } con lo que se ve al empezar. */
  function formularioHTML(g) {
    if (!window.GuiasGuion) return '';
    var accion = (g && g.accion) || '';
    return '<div class="tcd-form"><label class="dato"><span class="etiqueta">Qué se hace</span>' +
      '<select class="campo tcd-accion">' + GuiasGuion.ACCIONES.filter(function (x) { return x.valor !== 'copiar'; }).map(function (x) {   /* fila 552: solo en la lista común */
        return '<option value="' + U.escapar(x.valor) + '"' + (x.valor === accion ? ' selected' : '') + '>' + U.escapar(x.texto) + '</option>';
      }).join('') + '</select></label><span class="tcd-receta">' + recetaHTML(accion, g && g.receta) + '</span>' +
      (window.DondeCampo ? DondeCampo.html({ accion: accion, donde: g && g.donde, receta: g && g.receta, tipoDocumento: g && g.tipoDocumento, aQuien: g && g.aQuien }) : '') + '</div>';   /* fila 659 */
  }

  /* Lo que escribe la usuaria en el formulario: { accion, receta } (receta null si no dice nada). */
  function leerFormulario(raiz) {
    var sel = raiz && raiz.querySelector('.tcd-accion');
    var accion = sel ? sel.value : '';
    var leida = {};
    [['a', '.guion-receta-a'], ['via', '.guion-receta-via'], ['plantilla', '.guion-receta-plantilla'], ['sentido', '.guion-receta-sentido'], ['firmas', '.guion-receta-firmas']]
      .forEach(function (x) { var c = raiz && raiz.querySelector(x[1]); if (c) leida[x[0]] = c.value; });
    var rz = raiz && raiz.querySelector('.guion-receta');   /* fila 659: la vía de antes ya no se elige; se conserva */
    if (rz && rz.dataset.via && leida.via === undefined) leida.via = rz.dataset.via;
    var forma = { accion: accion, receta: window.GuiasGuion ? GuiasGuion.normalizarReceta(accion, leida) : null };
    if (window.DondeCampo) Object.assign(forma, DondeCampo.leer(raiz));   /* fila 659: donde, tipoDocumento, aQuien */
    return forma;
  }

  /* Al cambiar «Qué se hace», se cambian sus desplegables. `alCambiar(forma)` avisa de cualquier cambio. */
  function engancharFormulario(raiz, alCambiar) {
    var sel = raiz && raiz.querySelector('.tcd-accion');
    if (!sel) return;
    var zona = raiz.querySelector('.tcd-receta');
    quitarBotonPlantilla(zona);
    var previa = sel.value;   /* fila 659: la acción de antes, para saber si el sitio propuesto se ha tocado */
    function avisar() { if (alCambiar) alCambiar(leerFormulario(raiz)); }
    sel.onchange = function () {
      zona.innerHTML = recetaHTML(sel.value, null);
      quitarBotonPlantilla(zona);
      if (window.DondeCampo) DondeCampo.alCambiarAccion(raiz, sel.value, previa);
      previa = sel.value;
      avisar();
    };
    zona.onchange = avisar;
    if (window.DondeCampo) DondeCampo.enganchar(raiz, avisar);
  }

  return { colgadoHTML: colgadoHTML, saldra: textoDeSaldra, enganchar: enganchar, formularioHTML: formularioHTML, leerFormulario: leerFormulario,
           engancharFormulario: engancharFormulario, nombreActual: nombreActual };
})();
