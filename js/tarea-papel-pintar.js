/* ============================================================
   tarea-papel-pintar.js — lo que se ve de una tarea de papel (fila 703, docs/703-TAREA-DE-PAPEL.md).
   La lógica y lo guardado están en js/tarea-papel.js; la lista de tareas, en js/asunto-sin-hitos.js.

   En lugar de la casilla: el icono 📄, la frase, el tipo de documento y los pasos de su recorrido en una línea
   («Generado › Firmado › Registrado › Enviado»; con ✓ los hechos, resaltado el que toca). A la derecha, el botón del
   paso que toca: «Generar documento» (con una plantilla del tipo la abre; con varias deja elegir; con ninguna ofrece
   «Otra plantilla…» y «+ Nueva plantilla…») o «Añadir documento» (la ventana de Windows). En el ⋮: «Marcar el paso a
   mano», «Quitar el documento» y, con el envío apuntado, «Corregir el envío» (fila 705: «Enviar correo» / «Marcar enviado»).
   ============================================================ */
var TareaPapelPintar = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function norm(t) { return U.normalizar(String(t || '')); }

  /* Los tipos de documento que se pueden elegir como papel. */
  function tiposDeDocumento() { return ((window.App && App.E && App.E.tiposDocumento) || []).slice().sort(function (x, y) { return x.localeCompare(y, 'es'); }); }

  /* El desplegable «Sin papel» / «Papel: <tipo>» de «+ Añadir tarea» y de la guía. */
  function selectorHTML(clase, valor, etiqueta) {
    return '<select class="campo ' + clase + '" aria-label="' + esc(etiqueta || 'Papel de la tarea') + '"><option value="">Sin papel</option>' +
      tiposDeDocumento().map(function (t) { return '<option value="' + esc(t) + '"' + (norm(t) === norm(valor) ? ' selected' : '') + '>Papel: ' + esc(t) + '</option>'; }).join('') +
      '</select>';
  }

  function pasosHTML(est) {
    return est.pasos.map(function (p, i) {
      return '<span class="tp-paso' + (p.hecho ? ' hecho' : '') + (i === est.toca ? ' toca' : '') + '"' +
        (p.aMano ? ' title="Marcado a mano' + (p.quien ? ' por ' + esc(p.quien) : '') + '"' : '') + '>' + (p.hecho ? '✓ ' : '') + esc(p.t) + '</span>';
    }).join('<span class="tp-flecha" aria-hidden="true"> › </span>');
  }

  /* Lo que va en lugar de la casilla y la frase: el icono, la frase y la línea del recorrido. */
  function centroHTML(g, a) {
    var est = TareaPapel.estado(a, g);
    return '<span class="tp-icono" title="Tarea de papel">📄</span><div class="tp-centro"><span class="ash-texto-tarea">' + esc(g.texto) + '</span>' +
      '<div class="tp-recorrido"><span class="tp-tipo">' + esc(g.papel) + '</span>' + pasosHTML(est) + '</div></div>';
  }

  /* El hueco del botón del paso que toca. */
  function botonHTML(g, a, puede) {
    var b = puede ? TareaPapel.botonDe(TareaPapel.estado(a, g)) : null;
    return b ? '<button type="button" class="boton boton-chico tp-boton" data-paso="' + b.k + '">' + esc(b.texto) + '</button>' : '';
  }

  /* La frase del panel: «Siguiente paso: Generar documento.» (o, sin botón, el paso que falta). */
  function siguienteTexto(g, a) {
    var est = TareaPapel.estado(a, g), b = TareaPapel.botonDe(est);
    if (b) return 'Siguiente paso: ' + b.texto + '.';
    if (est.pideSello && est.toca !== -1 && est.pasos[est.toca].k === 'registrado') return 'Falta guardar el PDF sellado.';   /* fila 704 */
    var p = est.toca === -1 ? null : est.pasos[est.toca];
    return p ? 'Falta: ' + p.t.toLowerCase() + '.' : '';
  }

  /* ---------- los botones ---------- */

  async function generarCon(a, h, g, p, boton, guardar) {
    guardar(boton, 'generar el documento', async function () {
      var r = await PlantillasDocumento.generar(a, p, 'abierto', {});
      if (r && r.numero) await TareaPapel.asignar(a, h, g, { numero: r.numero, nombre: r.nombre, firmas: TareaPapel.firmasDePlantilla(p), quienFirma: [p.firmante, p.vistoBueno].map(function (x) { return String(x || '').trim(); }).filter(Boolean).join(' y ') });
      await TareaPapel.sincronizar(a, h, g.id);
    });
  }

  async function montarGenerar(el, a, h, g, boton, guardar) {
    var lista = [];
    try { lista = (await PlantillasDocumento.plantillasDelAsunto(a)).filter(function (p) { return norm(p.tipoDocumento) === norm(g.papel); }); }
    catch (e) { lista = []; }
    if (!boton.isConnected) return;
    var con = function (p) { generarCon(a, h, g, p, boton, guardar); };
    if (lista.length === 1) { boton.onclick = function () { con(lista[0]); }; return; }
    boton.textContent = 'Generar documento ▾';
    var opciones = lista.map(function (p) { return { texto: p.nombre, alPulsar: function () { con(p); } }; });
    if (window.GenerarEnviarCabecera) {
      opciones.push({ texto: 'Otra plantilla…', alPulsar: function () { GenerarEnviarCabecera.otraPlantilla(a, boton, function (_a, p) { con(p); }); } });
      opciones.push({ texto: '+ Nueva plantilla…', alPulsar: function () { GenerarEnviarCabecera.nuevaPlantilla(a, boton, function () { if (window.HitosPanel) HitosPanel.programarRepintado(); }); } });
    }
    if (window.FichaMenus) FichaMenus.montar(boton, opciones);
  }

  /* «Registrar» (fila 704): copia la ruta del documento, como el botón «Ruta», y deja la tarea con «Falta el sellado». */
  async function registrar(a, h, g, boton, guardar) {
    var numero = (g.papelDoc && g.papelDoc.numero) || '', nombre = '';
    try {
      var ficheros = await Carpetas.ficheros(a.handle);
      var suyos = ficheros.filter(function (f) { return numero && f.nombre.indexOf(numero) !== -1; });
      var pdf = suyos.filter(function (f) { return /\.pdf$/i.test(f.nombre); })[0];
      nombre = (pdf || suyos[0] || {}).nombre || '';
    } catch (e) { nombre = ''; }
    if (!nombre) { U.aviso('No encuentro el documento en la carpeta del asunto.', 'ambar'); return; }
    var copiar = RutaCarpetas.botonDocumento(a, RutaCarpetas.modoDe(a), { nombre: nombre });
    copiar.click();   /* la misma ruta que «Ruta» (pide la carpeta si falta) y la copia de seguridad del PDF */
    guardar(boton, 'apuntar que falta el sellado', function () { return TareaPapel.pedirSello(a, h, g); });
  }

  function enganchar(el, a, h, g, guardar) {
    var boton = el.querySelector('.tp-boton');
    if (!boton) return;
    if (boton.dataset.paso === 'generar') montarGenerar(el, a, h, g, boton, guardar);
    else if (boton.dataset.paso === 'firmar') boton.onclick = function () { guardar(boton, 'poner el documento a la firma', function () { return TareaPapel.ponerAFirma(a, h, g); }); };   /* fila 704 */
    else if (boton.dataset.paso === 'registrar') boton.onclick = function () { registrar(a, h, g, boton, guardar); };
    else if (boton.dataset.paso === 'marcarenviado') boton.onclick = function () { guardar(boton, 'apuntar el envío', async function () { await PapelEnviado.marcarEnviado(a, h, g); await TareaPapel.sincronizar(a, h); }); };   /* fila 705 */
    else if (boton.dataset.paso === 'enviarcorreo') PapelEnviado.montarEnviarCorreo(a, h, g, boton);   /* fila 705 */
    else boton.onclick = function () {
      guardar(boton, 'abrir la ventana', async function () {
        await Documentos.abrir(a, { irDirectoAAnadir: true, tipoDocumento: g.papel });   /* propone el tipo de la tarea */
        await TareaPapel.sincronizar(a, h, g.id);
      });
    };
  }

  /* Las opciones del ⋮ de una tarea de papel. */
  function opcionesMenu(a, h, g, guardar, menu) {
    var est = TareaPapel.estado(a, g), lista = [];
    if (!est.todos) lista.push({ texto: 'Marcar el paso a mano', clase: 'tp-mano-opcion', alPulsar: function () {
      guardar(menu, 'marcar el paso', async function () { await TareaPapel.marcarAMano(a, h, g); await TareaPapel.sincronizar(a, h); });
    } });
    if (g.papelDoc && g.papelDoc.numero) lista.push({ texto: 'Quitar el documento', clase: 'tp-quitar-opcion', alPulsar: function () {
      guardar(menu, 'quitar el documento', async function () { await TareaPapel.quitarDocumento(a, h, g); await TareaPapel.sincronizar(a, h); });
    } });
    var corregir = window.PapelEnviado ? PapelEnviado.opcionMenu(a, h, g, guardar, menu) : null;   /* fila 705 */
    if (corregir) lista.push(corregir);
    return lista;
  }

  return { selectorHTML: selectorHTML, centroHTML: centroHTML, botonHTML: botonHTML, siguienteTexto: siguienteTexto, enganchar: enganchar, opcionesMenu: opcionesMenu };
})();
window.TareaPapelPintar = TareaPapelPintar;
