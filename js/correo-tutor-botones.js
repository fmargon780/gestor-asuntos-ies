/* ============================================================
   correo-tutor-botones.js — «+ Tutor/a de 1º ESO G» en el cuadro de Correo
   (15-oct-2026, fila 348, docs/CORREO-AL-TUTOR-DEL-GRUPO.md, apartados 1 a 3).

   Si el tercero del asunto es alumnado matriculado este curso (o el asunto es de un grupo con alumnado matriculado),
   junto a «Para» y a «Copia oculta» sale un botón pequeño que añade el correo del tutor o tutora de su unidad a ese
   campo, sin quitar lo que hubiera y sin repetir una dirección. Con alumnado de varias unidades, un solo botón por campo:
   «+ Tutores (3 grupos)». Si a alguna unidad le falta el correo, el botón añade los que hay y debajo sale un aviso en ámbar
   por cada unidad («Falta el correo del tutor/a de 1º ESO G») con un enlace a la tabla de tutorías; si no hay ninguno, el
   botón sale apagado. Quién es el tutor lo decide js/tutor-del-grupo.js (`paraElCuadro`, la tabla TUTORIAS de la fila 299);
   el cuadro (js/correo-cuadro.js) pinta lo de aquí y le pasa `anadirCco`. El cuadro de Séneca no lleva nada de esto.
   ============================================================ */
var CorreoTutorBotones = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  var ZONAS = { para: 'Para', cco: 'Copia oculta' };

  function datos() {
    var d = window.CorreoNucleo && CorreoNucleo._interno && CorreoNucleo._interno.tutoresDelAlumno;
    return d && d.aplica ? d : null;
  }

  /* Los correos de los tutores, sin repetir. */
  function correos() { var d = datos(); return d ? d.correos.slice() : []; }

  function textoDelBoton(d) {
    return d.unidades.length === 1 ? '+ Tutor/a de ' + d.unidades[0].unidad : '+ Tutores (' + d.unidades.length + ' grupos)';
  }

  /* El botón de un campo ('para' o 'cco'), o ''. */
  function botonHtml(zona) {
    var d = datos();
    if (!d) return '';
    var sin = !d.correos.length;
    return '<button type="button" class="boton boton-chico correo-tutor-anadir" data-zona="' + zona + '"' +
      (sin ? ' disabled title="Ninguno de los tutores tiene correo apuntado"' : '') + '>' + esc(textoDelBoton(d)) + '</button>';
  }

  /* Un renglón: el nombre del campo y, a su lado, el botón. */
  function cabeceraHtml(zona, rotuloExtra, estilo) {
    var boton = botonHtml(zona);
    if (!boton) return '';
    return '<div class="correo-campo-cabecera"><label class="etiqueta"' + (estilo ? ' style="' + estilo + '"' : '') + '>' + ZONAS[zona] + (rotuloExtra || '') + '</label>' + boton + '</div>';
  }

  /* Debajo de los campos: una línea ámbar por cada unidad a la que le falta algún correo, con su enlace. */
  function avisosHtml() {
    var d = datos();
    if (!d || !d.faltan.length) return '';
    return '<div id="correo-tutor-faltas">' + d.faltan.map(function (t) {
      return '<p class="aviso aviso-ambar correo-tutor-falta">' + esc(t) + ' · <button type="button" class="enlace correo-tutor-completar">Completarlo en Tablas de datos</button></p>';
    }).join('') + '</div>';
  }

  /* Añade las direcciones al campo «Para» (en «Otro correo»), sin repetir ninguna de las que ya van. */
  function anadirAPara(dirs) {
    var otro = $('correo-otro');
    if (!otro) return 0;
    var yaVan = {};
    Array.prototype.forEach.call(document.querySelectorAll('.correo-marca'), function (c) { if (c.checked) yaVan[c.value.toLowerCase()] = true; });
    otro.value.split(/[,;]/).forEach(function (x) { if (x.trim()) yaVan[x.trim().toLowerCase()] = true; });
    var nuevas = dirs.filter(function (d) { return !yaVan[d.toLowerCase()]; });
    if (nuevas.length) otro.value = (otro.value.trim() ? otro.value.trim().replace(/[,;]\s*$/, '') + ', ' : '') + nuevas.join(', ');
    return nuevas.length;
  }

  function completar() {
    var aceptar = $('cuadro-aceptar');
    if (aceptar) aceptar.click();
    if (window.App && App.ir) App.ir('herramientas');
    setTimeout(function () {
      var b = $('bloque-tablas-datos');
      if (b) { b.open = true; if (b.scrollIntoView) b.scrollIntoView(); }
    }, 300);
  }

  /* Engancha los botones que haya en el cuadro. `cb.anadirCco(dirs)`: lo pone el cuadro (la copia oculta es suya). */
  function enganchar(cb) {
    var caja = $('correo-caja');
    if (!caja) return;
    Array.prototype.forEach.call(caja.querySelectorAll('.correo-tutor-anadir'), function (b) {
      b.onclick = function () {
        var dirs = correos();
        if (!dirs.length) return;
        if (b.getAttribute('data-zona') === 'cco') cb.anadirCco(dirs); else anadirAPara(dirs);
      };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('.correo-tutor-completar'), function (b) { b.onclick = completar; });
  }

  return { botonHtml: botonHtml, cabeceraHtml: cabeceraHtml, avisosHtml: avisosHtml, enganchar: enganchar, correos: correos, anadirAPara: anadirAPara };
})();
window.CorreoTutorBotones = CorreoTutorBotones;
