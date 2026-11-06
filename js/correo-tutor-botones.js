/* ============================================================
   correo-tutor-botones.js — «Falta el correo de …» del tutor o tutora del grupo en el cuadro de Correo
   (15-oct-2026, fila 348, docs/CORREO-AL-TUTOR-DEL-GRUPO.md; fila 434).

   Desde la fila 555 (docs/555-A-QUIEN-VA-CADA-CORREO.md) ya no hay botones «+ Tutor/a de …»: el tutor o tutora se busca
   escribiendo en Para, Copia o Copia oculta (js/correo-para.js). Queda aquí el aviso en ámbar por cada tutor sin correo, con
   su casilla y «Guardar» para escribirlo allí mismo (fila 434): al guardarlo ya se puede elegir y se pone en «Para». Quién es el
   tutor lo decide js/tutor-del-grupo.js (`paraElCuadro`, la tabla TUTORIAS de la fila 299).
   ============================================================ */
var CorreoTutorBotones = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function datos() {
    var d = window.CorreoNucleo && CorreoNucleo._interno && CorreoNucleo._interno.tutoresDelAlumno;
    return d && d.aplica ? d : null;
  }

  /* Los correos de los tutores, sin repetir. */
  function correos() { var d = datos(); return d ? d.correos.slice() : []; }

  /* Debajo de los campos: una línea ámbar por cada tutor al que le falta el correo, con su casilla para escribirlo y «Guardar»
     (fila 434, docs/ARREGLOS-DEL-HITO-EN-TRABAJO.md, punto 2). Sin tutor en la tabla, solo el aviso; sin clave, tampoco se puede guardar. */
  function avisosHtml() {
    var d = datos();
    if (!d || !d.faltan.length) return '';
    var lineas = [];
    d.unidades.forEach(function (u) {
      if (!u.tutores.length) { lineas.push('<p class="aviso aviso-ambar correo-tutor-falta">No sé quién es el tutor o tutora de ' + esc(u.unidad) + '. Las tutorías se suben al Centro de datos.</p>'); return; }   /* fila 376 */
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
    if (window.CorreoPara) { CorreoPara.actualizarCorreo('tutor:' + clave, correo); CorreoPara.repintar(); }
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
  }

  function engancharAvisos(caja) {
    Array.prototype.forEach.call(caja.querySelectorAll('.correo-tutor-guardar'), function (b) {
      var campo = caja.querySelector('.correo-tutor-escribir[data-clave="' + b.getAttribute('data-clave') + '"]');
      b.onclick = function () { if (campo) U.mientrasGuarda(b, function () { return guardarCorreo(campo.getAttribute('data-clave'), campo.getAttribute('data-nombre'), campo.value); }); };
      if (campo) campo.onkeydown = function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); b.click(); } };
    });
  }

  /* Engancha los avisos que haya en el cuadro. */
  function enganchar() {
    var faltas = $('correo-tutor-faltas');
    if (faltas) engancharAvisos(faltas);
  }

  return { avisosHtml: avisosHtml, enganchar: enganchar, correos: correos, aplicarCorreo: aplicarCorreo };
})();
window.CorreoTutorBotones = CorreoTutorBotones;
