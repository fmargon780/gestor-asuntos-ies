/* ============================================================
   ficha-generar-documento.js — «Generar documento» en la ficha (fila 267,
   docs/GENERAR-DOCUMENTO-DESDE-LA-FICHA.md).

   Un botón junto a «+ Añadir documento» que NO genera nada: abre la mesa
   del hito actual con el desplegable «Generar documento ▾» ya abierto
   (la fila 154 sigue en pie: se genera en un solo sitio, el hito). Solo
   se ve con hitos (css/ficha-asunto.css); sin hitos, el botón de siempre
   sigue en la barra de arriba. Se pinta una sola vez por tarjeta.
   ============================================================ */
(function () {
  /* El hito al que ir, calculado al pulsar: el actual; con todos hechos,
     el último visible. null si no hay ninguno. */
  function hitoDestino(a) {
    var datos = window.Hitos && Hitos.ultimosLeidos && Hitos.ultimosLeidos();
    var entrada = datos && datos.porAsunto && datos.porAsunto[a.nombre];
    if (!entrada || !entrada.hitos || !entrada.hitos.length) return null;
    var actual = Hitos.hitoActualDeAsunto ? Hitos.hitoActualDeAsunto(a) : null;
    if (actual) return actual.id;
    var visibles = Hitos.visibles(entrada.hitos).filter(function (x) { return x.estado !== 'noaplica' && !x.delTipoAnterior; });
    return visibles.length ? visibles[visibles.length - 1].id : null;
  }

  function poner(titulo, a) {
    if (!titulo) return;
    var N = window.FichaNucleo;
    var viejo = titulo.querySelector('.ficha-documentos-generar');
    if (N && N.modoActual !== 'abierto') { if (viejo) viejo.remove(); return; }
    if (viejo) { viejo.onclick = function () { ir(a); }; return; }
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton ficha-documentos-generar';
    b.textContent = 'Generar documento';
    b.title = 'Abre el hito actual, con sus plantillas para generar';
    b.onclick = function () { ir(a); };
    titulo.appendChild(b);
    /* El título pasa a ocupar más: la tarjeta cerrada vuelve a contar cuántos renglones le caben. */
    if (window.FichaTarjetas && FichaTarjetas.ajustarAlto) FichaTarjetas.ajustarAlto();
  }

  function ir(a) {
    var id = hitoDestino(a);
    if (id && window.HitoMesa) HitoMesa.abrirConPanel(a, id, 'generar');
  }

  window.FichaGenerarDocumento = { poner: poner };
})();
