/* ============================================================
   centro-de-datos-configuracion.js — los datos del centro y la firma,
   desde el Centro de datos (fila 313, 9-oct-2026,
   docs/CONFIGURACION-DEL-CENTRO-DE-DATOS.md; va con la fila 312).

   Francisco escribe los datos del centro y la firma de los correos una
   sola vez, en el Centro de datos (`configuracion.json`, junto a
   `indice.json`). Aquí, en la misma pasada de js/centro-de-datos.js:

   - se lee `configuracion.json` (solo si su `actualizado` ha cambiado);
   - cada valor que NO esté vacío y sea distinto del que tiene el gestor
     se copia a `_GESTOR/plantillas.json`, en una sola escritura (un
     valor vacío quiere decir «no está puesto», no «bórralo»);
   - se apunta en `_GESTOR/centro-de-datos.json` (`configuracion`) de
     cuándo es y qué campos vienen de fuera;
   - Ajustes › El centro › «Datos del centro y firma» enseña esos
     campos sin poder escribir en ellos: «Se cambia en el Centro de datos».

   Fila 316: también `soporte.buzon` (la dirección del buzón de soporte): se copia a
   `registro.ajustesAvisos.urlSoporte` si empieza por https:// y en Ajustes › «Buzón de soporte» sale
   sin poder cambiarse. La dirección con la que cada persona envía correo no se toca.
   ============================================================ */
var CentroDeDatosConfiguracion = (function () {

  /* configuracion.json → plantillas.json → campo de Ajustes */
  var CAMPOS = [
    { origen: ['centro', 'nombre'], destino: 'centro', campo: 'plantillas-centro' },
    { origen: ['centro', 'codigo'], destino: 'codigo', campo: 'plantillas-codigo' },
    { origen: ['centro', 'direccion'], destino: 'direccion', campo: 'plantillas-direccion' },
    { origen: ['centro', 'localidad'], destino: 'localidad', campo: 'plantillas-localidad' },
    { origen: ['centro', 'provincia'], destino: 'provincia', campo: 'plantillas-provincia' },
    { origen: ['correo', 'firma'], destino: 'firma', campo: 'plantillas-firma' }
  ];

  function $(id) { return document.getElementById(id); }

  function valorDe(conf, origen) {
    var x = conf && conf[origen[0]];
    var v = x && x[origen[1]];
    return typeof v === 'string' ? v : '';
  }

  function urlDeRegistro() {
    var r = window.App && App.E && App.E.registro;
    var u = r && r.ajustesAvisos && r.ajustesAvisos.urlSoporte;
    return typeof u === 'string' ? u.trim() : '';
  }

  /* Lee y copia. Devuelve { centro, buzon }: true en lo que se ha copiado de verdad. */
  async function tomar(dir, indice, apuntes) {
    var conf = await Carpetas.leerJson(dir, 'configuracion.json');
    var NADA = { centro: false, buzon: false };
    if (!conf || typeof conf !== 'object') return NADA;
    if ((conf.contrato || 1) > CentroDeDatos.CONTRATO) return NADA;
    var previo = apuntes && apuntes.configuracion;
    if (previo && previo.actualizado && previo.actualizado === conf.actualizado) return NADA;

    var vienen = [], cambios = {};
    var actuales = await Plantillas.cargar(App.E.gestor);
    CAMPOS.forEach(function (c) {
      var v = valorDe(conf, c.origen);
      if (!v.trim()) return;
      vienen.push(c.destino);
      if (v !== actuales[c.destino]) cambios[c.destino] = v;
    });
    var hay = Object.keys(cambios).length > 0;
    if (hay) {
      await Plantillas.guardar(App.E.gestor, function (actual) {
        Object.keys(cambios).forEach(function (k) { actual[k] = cambios[k]; });
        return actual;
      });
    }
    /* Fila 316: la dirección del buzón de soporte, a donde ya vive. */
    var buzon = conf.soporte && typeof conf.soporte.buzon === 'string' ? conf.soporte.buzon.trim() : '';
    var buzonVale = /^https:\/\//i.test(buzon);
    var buzonCopiado = false;
    if (buzonVale && buzon !== urlDeRegistro()) {
      await App.guardarRegistroFresco(function (reg) {
        reg.ajustesAvisos = reg.ajustesAvisos || {};
        reg.ajustesAvisos.urlSoporte = buzon;
      });
      buzonCopiado = true;
    }
    await CentroDeDatos.apuntarConfiguracion({
      actualizado: conf.actualizado || '', actualizadoPor: conf.actualizadoPor || '', tomadoEl: U.ahora ? U.ahora() : new Date().toISOString(),
      vienen: vienen,
      telefono: (conf.centro && conf.centro.telefono) || '',
      direccionDelCentro: (conf.correo && conf.correo.direccionDelCentro) || '',
      web: (indice && typeof indice.web === 'string') ? indice.web : '',
      buzonSoporte: buzonVale
    });
    return { centro: hay, buzon: buzonCopiado };
  }

  /* ---------- Ajustes ---------- */

  /* Fila 316: el campo «Dirección del buzón de soporte». */
  function marcarBuzon(ap) {
    var campo = $('soporte-url');
    if (!campo) return;
    var viene = !!(ap && ap.buzonSoporte);
    campo.readOnly = viene;
    campo.classList.toggle('viene-de-fuera', viene);
    if (viene && campo.offsetParent && urlDeRegistro() && campo.value !== urlDeRegistro()) campo.value = urlDeRegistro();
    var nota = $('soporte-url-nota-centro');
    if (viene && !nota) {
      nota = document.createElement('p');
      nota.id = 'soporte-url-nota-centro';
      nota.className = 'nota';
      nota.textContent = 'Se cambia en el Centro de datos';
      campo.parentNode.insertBefore(nota, campo.nextSibling);
    } else if (!viene && nota) nota.remove();
  }

  async function marcarCampos() {
    if (!window.CentroDeDatos) return;
    var ap = null;
    try { ap = (await CentroDeDatos.leerApuntes()).configuracion; } catch (e) { ap = null; }
    marcarBuzon(ap);
    var cuerpo = $('centro-firma-cuerpo');
    if (!cuerpo) return;
    var vienen = (ap && ap.vienen) || [];
    var datos = null;
    if (vienen.length && cuerpo.offsetParent && App.E && App.E.gestor) { try { datos = await Plantillas.cargar(App.E.gestor); } catch (e) { datos = null; } }
    CAMPOS.forEach(function (c) {
      var campo = $(c.campo);
      if (!campo) return;
      var viene = vienen.indexOf(c.destino) !== -1;
      campo.readOnly = viene;
      campo.classList.toggle('viene-de-fuera', viene);
      if (viene && datos && datos[c.destino] !== undefined && campo.value !== datos[c.destino]) campo.value = datos[c.destino];
      var nota = $(c.campo + '-nota-centro');
      if (viene && !nota) {
        nota = document.createElement('p');
        nota.id = c.campo + '-nota-centro';
        nota.className = 'nota';
        nota.textContent = 'Se cambia en el Centro de datos';
        campo.parentNode.insertBefore(nota, campo.nextSibling);
      } else if (!viene && nota) nota.remove();
    });
    var linea = $('centro-de-datos-configuracion-linea');
    if (!vienen.length) { if (linea) linea.remove(); return; }
    var cuando = ap.actualizado ? CentroDeDatos.fechaCorta(ap.actualizado, true) : '';
    var quien = String(ap.actualizadoPor || '').split('@')[0];
    var texto = 'Estos datos vienen del Centro de datos' + (cuando || quien ? ' (cambiados' + (cuando ? ' el ' + cuando : '') + (quien ? ' por ' + quien : '') + ')' : '') + '.';
    var web = /^https:\/\//.test(ap.web || '') ? ap.web : '';
    var firma = texto + '|' + web;
    if (!linea) {
      linea = document.createElement('p');
      linea.id = 'centro-de-datos-configuracion-linea';
      linea.className = 'explica';
      cuerpo.insertBefore(linea, cuerpo.firstChild);
    }
    if (linea.dataset.firma === firma) return;
    linea.dataset.firma = firma;
    linea.textContent = texto;
    if (web) {
      linea.appendChild(document.createTextNode(' '));
      var a = document.createElement('a');
      a.href = web; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Abrir el Centro de datos';
      linea.appendChild(a);
    }
  }

  return { CAMPOS: CAMPOS, tomar: tomar, marcarCampos: marcarCampos };
})();
window.CentroDeDatosConfiguracion = CentroDeDatosConfiguracion;
