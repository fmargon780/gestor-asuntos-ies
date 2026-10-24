/* ============================================================
   correo-tutor-botones.js — «+ Tutor/a de 1º ESO G» en el cuadro de Correo
   (15-oct-2026, fila 348, docs/CORREO-AL-TUTOR-DEL-GRUPO.md, apartados 1 a 3).

   Si el tercero del asunto es alumnado matriculado este curso (o el asunto es de un grupo con alumnado matriculado),
   junto a «Para» y a «Copia oculta» sale un botón pequeño que añade el correo del tutor o tutora de su unidad a ese
   campo, sin quitar lo que hubiera y sin repetir una dirección. Con alumnado de varias unidades, un solo botón por campo:
   «+ Tutores (3 grupos)». Si a alguna unidad le falta el correo, el botón añade los que hay y debajo sale un aviso en ámbar
   por cada tutor sin correo, con una casilla y «Guardar» para escribirlo allí mismo (fila 434); si no hay ninguno, el
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
      (sin ? ' disabled data-motivo-clave="sin-correo-de-tutores"' : '') + '>' + esc(textoDelBoton(d)) + '</button>';
  }

  /* Un renglón: el nombre del campo y, a su lado, el botón. */
  function cabeceraHtml(zona, rotuloExtra, estilo) {
    var boton = botonHtml(zona);
    if (!boton) return '';
    return '<div class="correo-campo-cabecera"><label class="etiqueta"' + (estilo ? ' style="' + estilo + '"' : '') + '>' + ZONAS[zona] + (rotuloExtra || '') + '</label>' + boton + '</div>';
  }

  /* Debajo de los campos: una línea ámbar por cada tutor al que le falta el correo, con su casilla para escribirlo y «Guardar»
     (fila 434, docs/ARREGLOS-DEL-HITO-EN-TRABAJO.md, punto 2). Sin tutor en la tabla, solo el aviso; sin clave, tampoco se puede guardar. */
  function avisosHtml() {
    var d = datos();
    if (!d || !d.faltan.length) return '';
    var lineas = [];
    d.unidades.forEach(function (u) {
      if (!u.tutores.length) { lineas.push('<p class="aviso aviso-ambar correo-tutor-falta">Falta el correo del tutor/a de ' + esc(u.unidad) + '</p>'); return; }
      u.tutores.forEach(function (t) {
        if ((t.correos || []).length) return;
        if (!t.clave) { lineas.push('<p class="aviso aviso-ambar correo-tutor-falta">Falta el correo de ' + esc(t.nombre) + ' (tutor/a de ' + esc(u.unidad) + ')</p>'); return; }
        lineas.push('<p class="aviso aviso-ambar correo-tutor-falta" data-clave="' + esc(t.clave) + '">Falta el correo de ' + esc(t.nombre) +
          ' (tutor/a de ' + esc(u.unidad) + ')<br><input type="email" class="campo correo-tutor-escribir" data-clave="' + esc(t.clave) + '" data-nombre="' + esc(t.nombre) +
          '" placeholder="Escribe su correo" aria-label="Correo de ' + esc(t.nombre) + '"> ' +
          '<button type="button" class="boton boton-chico correo-tutor-guardar" data-clave="' + esc(t.clave) + '">Guardar</button></p>');
      });
    });
    return '<div id="correo-tutor-faltas">' + lineas.join('') + '</div>';
  }

  /* PURA. Apunta el correo en el tutor `clave` de los datos del cuadro y recalcula lo que sale de ahí. */
  function aplicarCorreo(d, clave, correo) {
    d.unidades.forEach(function (u) {
      u.tutores.forEach(function (t) { if (t.clave === clave) { t.correos = [correo]; t.aMano = true; } });
    });
    Object.assign(d, TutorDelGrupo.resumenParaElCuadro(d.unidades));
  }

  async function guardarCorreo(clave, nombre, texto) {
    var m = String(texto || '').match(Destinatarios.RE_CORREO);
    if (!m || m.length !== 1) { U.aviso('Escribe un correo válido (una sola dirección).', 'ambar'); return false; }
    var correo = m[0];
    var d = datos();
    if (!d) return false;
    try {
      /* Al momento, sin esperar al envío: mismo fichero y mismo guardado que al enviar (js/correos-a-mano.js). */
      if (!(await CorreosAMano.guardar(clave, correo, nombre))) { U.aviso('No he podido guardar el correo.', 'malo'); return false; }
    } catch (e) { U.fallo('No he podido guardar el correo', e); return false; }
    aplicarCorreo(d, clave, correo);
    if (window.CorreoTutor && CorreoTutor.apuntarAMano) CorreoTutor.apuntarAMano(clave, correo);
    anadirAPara([correo]);
    repintar();
    return true;
  }

  function repintar() {
    var caja = $('correo-tutor-faltas');
    if (!caja) return;
    var d = datos();
    var nuevo = document.createElement('div');
    nuevo.innerHTML = avisosHtml();
    if (nuevo.firstChild) caja.replaceWith(nuevo.firstChild); else caja.remove();
    var cajaNueva = $('correo-tutor-faltas');
    if (cajaNueva) engancharAvisos(cajaNueva);
    /* Los botones «+ Tutor/a de…» (apagados si no había ningún correo) se vuelven a pintar. */
    Array.prototype.forEach.call(document.querySelectorAll('.correo-tutor-anadir'), function (b) { if (d && d.correos.length) { b.disabled = false; b.removeAttribute('data-ayuda'); } });
  }

  function engancharAvisos(caja) {
    Array.prototype.forEach.call(caja.querySelectorAll('.correo-tutor-guardar'), function (b) {
      var campo = caja.querySelector('.correo-tutor-escribir[data-clave="' + b.getAttribute('data-clave') + '"]');
      b.onclick = function () { if (campo) U.mientrasGuarda(b, function () { return guardarCorreo(campo.getAttribute('data-clave'), campo.getAttribute('data-nombre'), campo.value); }); };
      if (campo) campo.onkeydown = function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); b.click(); } };
    });
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
    var faltas = $('correo-tutor-faltas');
    if (faltas) engancharAvisos(faltas);
  }

  return { botonHtml: botonHtml, cabeceraHtml: cabeceraHtml, avisosHtml: avisosHtml, enganchar: enganchar, correos: correos, anadirAPara: anadirAPara, aplicarCorreo: aplicarCorreo };
})();
window.CorreoTutorBotones = CorreoTutorBotones;
