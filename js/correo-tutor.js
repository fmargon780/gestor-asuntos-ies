/* ============================================================
   correo-tutor.js — lo que lleva el cuadro de Correo cuando el correo
   va al tutor o tutora del grupo (7-oct-2026, fila 299,
   docs/CORREO-AL-TUTOR-DEL-GRUPO.md, apartados 1.2 a 1.4).

   `extraDe(grupo)` convierte lo que decide js/tutor-del-grupo.js en lo que
   `HitosComunicar.comunicar` pasa por `extra` a `CorreoNucleo.abrirCuadro`:
   el saludo «Buenas:» y los avisos del cuadro. Este fichero no busca al
   tutor: solo pinta (la línea ámbar de arriba, «No tengo el correo de…» /
   «Correo de…, escrito a mano… · Cambiar» bajo «Otro correo») y, al
   enviar de verdad (js/correo-rastro.js), recuerda la dirección escrita
   a mano (js/correos-a-mano.js) cuando sin ambigüedad es de ese profesor.
   ============================================================ */
var CorreoTutor = (function () {

  var SALUDO = 'Buenas:';
  var cambiando = {};   /* clave -> true: se ha pulsado «Cambiar», la dirección nueva sustituirá a la recordada */

  function $(id) { return document.getElementById(id); }
  function actual() { return (window.CorreoNucleo && CorreoNucleo._interno && CorreoNucleo._interno.tutorDelGrupo) || null; }

  /* PURA. `grupo`: { unidad, tutores, motivo } de TutorDelGrupo.deAsunto. */
  function extraDe(grupo) {
    var g = grupo || { unidad: '', tutores: [], motivo: '' };
    return {
      saludo: SALUDO,
      tutorDelGrupo: {
        aviso: window.TutorDelGrupo ? TutorDelGrupo.textoDelMotivo(g.motivo, g.unidad) : '',
        tutores: (g.tutores || []).map(function (t) {
          return { nombre: t.nombre, clave: t.clave, correos: t.aMano ? [] : (t.correos || []).slice(), tieneCorreo: !!(t.correos || []).length && !t.aMano,
                   aMano: t.aMano ? { correo: t.correos[0], cuando: t.cuando || '' } : null };
        })
      }
    };
  }

  /* ---------- lo que se pinta ---------- */

  function arribaHtml() {
    var t = actual();
    return t && t.aviso ? '<p class="aviso aviso-ambar" id="correo-tutor-aviso">' + U.escapar(t.aviso) + '</p>' : '';
  }

  function fechaLegible(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; }

  /* Una línea por cada tutor al que le falta el correo en su ficha. */
  function debajoDeOtroHtml() {
    var t = actual();
    if (!t) return '';
    return (t.tutores || []).map(function (p) {
      if (p.tieneCorreo) return '';
      if (p.aMano) {
        return '<p class="nota correo-tutor-linea" data-clave="' + U.escapar(p.clave) + '">Correo de ' + U.escapar(p.nombre) +
          ', escrito a mano' + (p.aMano.cuando ? ' el ' + fechaLegible(p.aMano.cuando) : '') +
          ' · <button type="button" class="enlace correo-tutor-cambiar" data-clave="' + U.escapar(p.clave) + '">Cambiar</button></p>';
      }
      return '<p class="nota correo-tutor-linea" data-clave="' + U.escapar(p.clave) + '">No tengo el correo de ' + U.escapar(p.nombre) +
        '. Escríbelo aquí y lo recordaré.</p>';
    }).join('');
  }

  function enganchar() {
    cambiando = {};
    Array.prototype.forEach.call(document.querySelectorAll('.correo-tutor-cambiar'), function (b) {
      b.onclick = function () {
        cambiando[b.dataset.clave] = true;
        var otro = $('correo-otro');
        if (otro) { otro.value = ''; otro.focus(); }
        var linea = b.closest('.correo-tutor-linea');
        if (linea) linea.innerHTML = 'Escribe el correo nuevo en «Otro correo»: sustituirá al anterior al enviar.';
      };
    });
  }

  /* ---------- recordar al enviar ---------- */

  function direcciones(texto) {
    return (String(texto || '').match(Destinatarios.RE_CORREO) || []);
  }

  /* PURA. `tutores`: los de `extraDe`; `otro`: lo escrito en «Otro correo»; `cambiando`: { clave: true }.
     Devuelve { clave, correo, nombre } o null. Solo con UN tutor sin dirección conocida y UNA dirección
     nueva: con dos y dos no se adivina cuál es de quién. */
  function aRecordar(tutores, otro, cambiandoClaves) {
    var cam = cambiandoClaves || {};
    var conocidas = {};
    (tutores || []).forEach(function (t) {
      if (t.tieneCorreo) { (t.correos || []).forEach(function (d) { conocidas[String(d).toLowerCase()] = true; }); return; }   /* el de su ficha: ya viene puesto */
      if (t.aMano && !cam[t.clave]) conocidas[String(t.aMano.correo).toLowerCase()] = true;
    });
    var nuevas = direcciones(otro).filter(function (d, i, l) {
      return !conocidas[d.toLowerCase()] && l.map(function (x) { return x.toLowerCase(); }).indexOf(d.toLowerCase()) === i;
    });
    var faltan = (tutores || []).filter(function (t) { return !t.tieneCorreo && (!t.aMano || cam[t.clave]); });
    if (faltan.length !== 1 || nuevas.length !== 1) return null;
    return { clave: faltan[0].clave, correo: nuevas[0], nombre: faltan[0].nombre };
  }

  /* Al enviar de verdad: lo llama js/correo-rastro.js. Accesorio: si falla, el correo ya ha salido. */
  async function recordarAlEnviar() {
    var t = actual();
    if (!t || !window.CorreosAMano) return;
    try {
      var r = aRecordar(t.tutores, $('correo-otro') ? $('correo-otro').value : '', cambiando);
      if (r) { await CorreosAMano.guardar(r.clave, r.correo, r.nombre); cambiando = {}; }
    } catch (e) { if (U.accesorio) U.accesorio('Enviado, pero no he podido recordar el correo de ese profesor', e); }
  }

  return { SALUDO: SALUDO, extraDe: extraDe, arribaHtml: arribaHtml, debajoDeOtroHtml: debajoDeOtroHtml, enganchar: enganchar,
           aRecordar: aRecordar, recordarAlEnviar: recordarAlEnviar };
})();
window.CorreoTutor = CorreoTutor;
