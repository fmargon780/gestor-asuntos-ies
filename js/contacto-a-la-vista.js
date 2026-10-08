/* ============================================================
   contacto-a-la-vista.js — el teléfono o el correo apuntado en «El
   encargo», siempre a la vista junto a «Lo pide: …», con un botón para
   copiarlo (fila 305, docs/CONTACTO-DEL-ENCARGO-DONDE-HACE-FALTA.md).

   Lo pintan la cabecera de la ficha (js/ficha-asunto.js) y la del hito
   (js/hito-mesa.js) con la misma función, para que salga igual. Qué
   dato sale lo decide LoPide.contactoDe; aquí solo se dibuja. Solo
   lee: nada se guarda.
   ============================================================ */
var ContactoALaVista = (function () {

  function trozo(av) {
    return '<span class="contacto-vista" title="' + U.escapar(av.titulo || av.texto) + '">' +
      (av.clase === 'telefono' ? 'Tel. ' : '') + U.escapar(av.texto) + '</span>' +
      '<button type="button" class="contacto-copiar" data-copia="' + U.escapar(av.copia) +
      '" title="Copiar" aria-label="Copiar el contacto">⧉</button>';
  }

  /* La marca entera para el asunto `a`: «Lo pide: María (madre) · Tel. 600 111 222 ⧉»,
     «Contacto: Tel. 600 111 222 ⧉» si no hay «quién lo pide», la de
     siempre sin dato a la vista, o cadena vacía si no hay nada. */
  function html(a) {
    var ficha = (a && a.ficha) || {};
    var lp = ficha.loPide;
    var quien = lp && lp.nombre;
    var av = window.LoPide ? LoPide.contactoDe(ficha).aLaVista : null;
    if (!quien && !av) return '';
    return '<span class="marca-lopide marca-contacto">' +
      (quien
        ? '<span class="lp-nombre">Lo pide: ' + U.escapar(LoPide.etiqueta(lp)) + '</span>' + (av ? '<span class="lp-sep"> · </span>' : '')
        : '<span class="lp-nombre">Contacto:&nbsp;</span>') +
      (av ? trozo(av) : '') + '</span>';
  }

  /* Los botones se pintan y se repintan con innerHTML (la ficha, el
     hito), así que un solo oyente en el documento los atiende a todos.
     `enganchar` queda para quien quiera asegurarse de que está puesto. */
  var puesto = false;
  function enganchar() {
    if (puesto) return;
    puesto = true;
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('.contacto-copiar');
      if (!b) return;
      ev.stopPropagation();
      U.copiar(b.dataset.copia, b, { avisoFallo: 'No he podido copiar el contacto.' });
    });
  }
  enganchar();

  return { html: html, enganchar: enganchar };
})();
