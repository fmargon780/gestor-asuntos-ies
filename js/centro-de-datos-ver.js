/* ============================================================
   centro-de-datos-ver.js — lo que se ve del Centro de datos (fila 312,
   docs/BEBER-DEL-CENTRO-DE-DATOS.md). El dato vive en js/centro-de-datos.js.

   - Ajustes › Este ordenador: bloque «Carpeta del Centro de datos»
     (#bloque-centro-de-datos): señalar, olvidar, de cuándo es el índice,
     «Volver a dar permiso».
   - Una línea gris «Datos del Centro de datos, del 8-oct-2026 · …» donde
     hoy se sube a mano (Traer ficheros de Séneca, Tablas de datos,
     Control del registro), solo cuando hay algo apuntado de esa clave.
   - Herramientas › «Traer ahora del Centro de datos».
   - Control del registro: «Hay listados nuevos del registro…» mientras
     falte la fecha «Revisar desde»; al ponerla, se toman solos.

   Las pantallas se pintan de nuevo a menudo: un observador las vigila
   y esto se vuelve a poner, sin repetirse (todo es idempotente).
   ============================================================ */
var CentroDeDatosVer = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(t); }

  var avisoDeCarpeta = '';
  var pintando = false;
  var otraVez = false;
  var tomandoElRegistro = false;

  function bloque(id, titulo, pie, cuerpo) {
    var det = document.createElement('details');
    det.className = 'bloque-ajustes';
    det.id = id;
    det.innerHTML = '<summary><span class="bloque-titulo">' + titulo + '</span><span class="bloque-pie">' + pie + '</span></summary>' +
      '<div class="bloque-cuerpo">' + cuerpo + '</div>';
    return det;
  }

  function avisoCarpeta(texto) {
    avisoDeCarpeta = texto || '';
    pintar();
  }

  /* «Datos del Centro de datos, del 8-oct-2026 · 812 alumnos · los subió fmargon780» */
  function textoDe(ap) {
    var quien = String(ap.subidoPor || '').split('@')[0];
    return 'Datos del Centro de datos, del ' + CentroDeDatos.fechaCorta(ap.subido, true) +
      (ap.resumen ? ' · ' + ap.resumen : '') + (quien ? ' · los subió ' + quien : '');
  }

  /* Una línea gris por clave con algo apuntado, dentro de `caja`, antes de `antes` (o al final). */
  function lineas(caja, antes, claves, apuntes, marca) {
    if (!caja) return;
    var hechas = claves.map(function (c) {
      var ap = CentroDeDatos.apunteDe(apuntes, c);
      return ap ? '<div class="suave centro-linea" data-clave="' + c + '">' + esc(CentroDeDatos.TITULOS[c]) + ': ' + esc(textoDe(ap)) + '</div>' : '';
    }).join('');
    var ya = caja.querySelector('[data-centro-lineas="' + marca + '"]');
    if (!hechas) { if (ya) ya.remove(); return; }
    if (ya) {
      if (ya.innerHTML !== hechas) ya.innerHTML = hechas;
      return;
    }
    var div = document.createElement('div');
    div.className = 'centro-lineas';
    div.dataset.centroLineas = marca;
    div.style.margin = '6px 0';
    div.innerHTML = hechas;
    if (antes && antes.parentNode === caja) caja.insertBefore(div, antes); else caja.appendChild(div);
  }

  /* ---------- Ajustes ---------- */

  async function pintarAjustes() {
    var centro = $('ajustes-tab-centro');
    if (centro && !$('bloque-centro-de-datos')) {
      var det = bloque('bloque-centro-de-datos', 'Carpeta del Centro de datos', 'De dónde salen los listados de Séneca, en este ordenador',
        '<p class="explica">Señala la carpeta «CENTRO DE DATOS» de Google Drive para ordenador, la que tiene ' +
        '<code>indice.json</code>. Es de este ordenador: el otro usa lo que traiga este. Aquí solo se lee, nunca se escribe.</p>' +
        '<p class="explica" id="centro-de-datos-carpeta"></p>' +
        '<div class="alta-tipo"><button type="button" class="boton" id="centro-de-datos-senalar">Señalar la carpeta</button>' +
        '<button type="button" class="boton" id="centro-de-datos-olvidar">Olvidarla</button>' +
        '<button type="button" class="boton oculto" id="centro-de-datos-permiso">Volver a dar permiso</button></div>' +
        '<p class="explica" id="centro-de-datos-indice"></p>' +
        '<div class="aviso aviso-ambar oculto" id="centro-de-datos-aviso"></div>');
      var ancla = $('bloque-alumnado-bd');
      if (ancla && ancla.parentNode === centro) centro.insertBefore(det, ancla.nextSibling); else centro.appendChild(det);
      $('centro-de-datos-senalar').onclick = function () { return CentroDeDatos.senalarCarpeta(); };
      $('centro-de-datos-olvidar').onclick = function () { return CentroDeDatos.olvidarCarpeta(); };
      $('centro-de-datos-permiso').onclick = async function () {
        var d = await CentroDeDatos.carpeta();
        if (d && (await CentroDeDatos.permiso(d, true))) { await CentroDeDatos.traer({ avisar: true, pedir: true }); }
        pintar();
      };
    }
    var bloqueAjustes = $('bloque-centro-de-datos');
    if (!bloqueAjustes) return;
    var dir = await CentroDeDatos.carpeta();
    var visible = !!bloqueAjustes.offsetParent;   /* oculto: no se lee su índice del disco */
    var carpetaP = $('centro-de-datos-carpeta'), indiceP = $('centro-de-datos-indice');
    var aviso = $('centro-de-datos-aviso'), permiso = $('centro-de-datos-permiso');
    var texto = '', ambar = avisoDeCarpeta, conPermiso = true, indiceTexto = '';
    if (dir) {
      texto = 'Carpeta señalada: ' + dir.name + '.';
      conPermiso = visible ? await CentroDeDatos.permiso(dir, false) : true;
      if (!conPermiso) ambar = ambar || 'El navegador ha dejado de dar permiso a la carpeta del Centro de datos.';
      else if (visible) {
        var r = await CentroDeDatos.leerIndice(dir);
        if (r.ok) {
          var ind = r.indice, n = (ind.listados || []).filter(function (e) { return CentroDeDatos.CLAVES.indexOf(e.clave) !== -1; }).length;
          var cuando = ind.actualizado ? new Date(ind.actualizado) : null;
          indiceTexto = 'Índice del ' + (cuando && !isNaN(cuando.getTime()) ? CentroDeDatos.fechaCorta(ind.actualizado, true) + ' ' +
            String(cuando.getHours()).padStart(2, '0') + ':' + String(cuando.getMinutes()).padStart(2, '0') : 'sin fecha') +
            ' · ' + n + (n === 1 ? ' listado' : ' listados') + ' para el gestor';
          if ((ind.contrato || 1) > CentroDeDatos.CONTRATO) ambar = ambar || 'El Centro de datos es más nuevo que esta aplicación.';
        } else ambar = ambar || 'Esta carpeta no es la del Centro de datos.';
      }
    } else {
      texto = 'Sin carpeta señalada en este ordenador: se usa lo que traiga el otro.';
    }
    if (carpetaP && carpetaP.textContent !== texto) carpetaP.textContent = texto;
    if (indiceP && visible) {
      indiceP.textContent = indiceTexto;
      indiceP.classList.toggle('oculto', !indiceTexto);
      var web = null;
      if (dir && indiceTexto) { try { web = (await CentroDeDatos.leerIndice(dir)).indice.web; } catch (e) { web = null; } }
      if (web && /^https:\/\//.test(web)) {
        indiceP.appendChild(document.createTextNode(' · '));
        var a = document.createElement('a');
        a.href = web; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Abrir el Centro de datos';
        indiceP.appendChild(a);
      }
    }
    if (aviso) { aviso.textContent = ambar; aviso.classList.toggle('oculto', !ambar); }
    if (permiso) permiso.classList.toggle('oculto', !(dir && !conPermiso));
    var olv = $('centro-de-datos-olvidar');
    if (olv) olv.classList.toggle('oculto', !dir);
  }

  /* ---------- las líneas y el botón de Herramientas ---------- */

  function ponerBoton() {
    var caja = $('herramientas-traer-seneca');
    if (!caja || $('btn-centro-traer')) return;
    var fila = document.createElement('div');
    fila.className = 'alta-tipo';
    fila.innerHTML = '<button type="button" class="boton" id="btn-centro-traer">Traer ahora del Centro de datos</button>' +
      '<span class="suave">Coge lo nuevo de la carpeta del Centro de datos, como al entrar.</span>';
    caja.appendChild(fila);
    $('btn-centro-traer').onclick = function () {
      return U.mientrasGuarda($('btn-centro-traer'), function () { return CentroDeDatos.traer({ avisar: true, pedir: true }); });
    };
  }

  async function pintarRegistro(apuntes) {
    var vista = $('control-registro-vista');
    if (!vista || vista.classList.contains('oculto')) return;
    var fila = vista.querySelector('.cr-fila');
    if (!fila) return;
    var estado = window.ControlRegistroPantalla && ControlRegistroPantalla._estado && ControlRegistroPantalla._estado.estado;
    var desde = estado && estado.control && estado.control.desde;
    var esperando = await CentroDeDatos.registroEsperando();
    var ya = vista.querySelector('.centro-registro-aviso');
    var hacer = esperando && !desde;
    if (hacer && !ya) {
      var a = document.createElement('div');
      a.className = 'aviso aviso-ambar cr-aviso centro-registro-aviso';
      a.textContent = 'Hay listados nuevos del registro en el Centro de datos. Pon la fecha «Revisar desde» y se traerán solos.';
      fila.parentNode.insertBefore(a, fila.nextSibling);
    } else if (!hacer && ya) ya.remove();
    if (esperando && desde && !tomandoElRegistro) {
      tomandoElRegistro = true;
      try { await CentroDeDatos.traer({ avisar: false, pedir: false }); }
      finally { tomandoElRegistro = false; }
    }
    lineas(vista, vista.querySelector('.cr-pestanas'), ['registro-entrada', 'registro-salida'], apuntes, 'registro');
  }

  async function pintar() {
    if (pintando) { otraVez = true; return; }
    pintando = true;
    try {
      do {
        otraVez = false;
        await pintarAjustes();
        var apuntes = await CentroDeDatos.leerApuntes();
        ponerBoton();
        if (window.CentroDeDatosConfiguracion) await CentroDeDatosConfiguracion.marcarCampos();
        var seneca = $('herramientas-traer-seneca');
        lineas(seneca && seneca.parentNode, seneca, ['alumnado', 'personal', 'alumnado-bd'], apuntes, 'seneca');
        var tablas = $('bloque-tablas-datos');
        var cuerpo = tablas && tablas.querySelector('.bloque-cuerpo');
        lineas(cuerpo, $('tablas-datos-lista'), ['tutorias', 'consejo-escolar'], apuntes, 'tablas');
        await pintarRegistro(apuntes);
      } while (otraVez);
    } catch (e) { /* una pantalla que no está: la próxima vez */ }
    finally { pintando = false; }
  }

  function vigilar() {
    if (typeof MutationObserver !== 'function') return;
    var espera = null;
    new MutationObserver(function () {
      if (espera) return;
      espera = setTimeout(function () { espera = null; pintar(); }, 250);
    }).observe(document.body, { childList: true, subtree: true });
  }

  function arrancar() { pintar(); vigilar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

  return { pintar: pintar, avisoCarpeta: avisoCarpeta };
})();
window.CentroDeDatosVer = CentroDeDatosVer;
