/* ============================================================
   bandeja-latido.js — el aviso de que la recogida de correos está
   parada (13-oct-2026, fila 336, docs/AVISO-RECOGIDA-DE-CORREOS-PARADA.md).

   El script de Gmail (apps-script/gestor-correos.gs) deja en la carpeta
   de la bandeja un fichero `latido.json` con la hora de su última vuelta.
   Aquí se mira:

     - señal de hace menos de una hora: nada;
     - señal de hace más de una hora: aviso en la franja de Inicio con la
       fecha y la hora de la última señal;
     - sin `latido.json` (o roto): aviso sin fecha.

   Pulsar el aviso abre un cuadro corto con los pasos y sus enlaces. Se
   vuelve a mirar cada 5 minutos con la aplicación abierta; cuando la
   señal vuelve a ser reciente, el aviso se quita solo.

   No avisa: sin carpeta de bandeja señalada (o sin su permiso), con un
   perfil de directivo (no usa la bandeja), ni en los 10 primeros minutos
   desde que se abrió la aplicación (Drive tarda en bajar el fichero
   nuevo y saldría un aviso falso al encender el ordenador).

   En la copia de pruebas, `?latido=viejo` y `?latido=ninguno` montan los
   otros dos casos (js/demo/datos.js), y no se esperan los 10 minutos.
   ============================================================ */
window.BandejaLatido = (function () {

  var FICHERO = 'latido.json';
  var UNA_HORA_MS = 60 * 60 * 1000;
  var CADA_MS = 5 * 60 * 1000;
  var ARRANQUE_MS = 10 * 60 * 1000;
  var ID = 'recogida-correos';
  var ENLACE_SCRIPT = 'https://script.google.com/home';
  var ENLACE_PAPELERA = 'https://script.google.com/home/trash';
  var ENLACE_CODIGO = 'https://raw.githubusercontent.com/fmargon780/gestor-asuntos-ies/main/apps-script/gestor-correos.gs';

  var cuentaDelLatido = '';   /* fila 411: la cuenta con la que el script recoge, de la última señal leída */
  var abierta = Date.now();
  var ultimaMirada = 0;
  var mirando = false;

  function esDemo() { return !!(window.Demo && window.Demo.datos); }

  /* PURA: la señal (o null) y la hora de ahora -> { estado, hora }.
     estado: 'reciente', 'viejo' o 'ninguno'. */
  function juzgar(senal, ahora) {
    var t = senal && typeof senal === 'object' ? Date.parse(senal.hora) : NaN;
    if (isNaN(t)) return { estado: 'ninguno', hora: '' };
    return { estado: ahora - t > UNA_HORA_MS ? 'viejo' : 'reciente', hora: new Date(t).toISOString() };
  }

  function texto(r) {
    if (r.estado === 'viejo') {
      var cuando = window.Bandeja && Bandeja.fechaHoraLegible ? Bandeja.fechaHoraLegible(r.hora) : '';
      return 'La recogida de correos está parada' + (cuando ? ' desde ' + cuando : '') +
        '. Los correos nuevos no llegan.';
    }
    if (r.estado === 'ninguno') return 'La recogida de correos no da señales: puede estar parada o sin actualizar.';
    return '';
  }

  function pasos() {
    return '<p>Hay que despertar el programa de Google que recoge los correos:</p>' +
      '<ol>' +
      '<li>Abre <a href="' + ENLACE_SCRIPT + '" target="_blank" rel="noopener">script.google.com</a> con la cuenta de Administración ' +
      'y busca «Gestor - Correos». Si no está, mira la <a href="' + ENLACE_PAPELERA + '" target="_blank" rel="noopener">papelera</a> y pulsa «Restaurar».</li>' +
      '<li>Ábrelo, elige <code>prepararTodo</code> en el desplegable de arriba y pulsa «Ejecutar».</li>' +
      '<li>Si la aplicación avisa de que el script es viejo, pega antes <a href="' + ENLACE_CODIGO + '" target="_blank" rel="noopener">el código nuevo</a> ' +
      'en lugar del que hay.</li>' +
      '</ol>' +
      '<p class="nota">Cuando vuelva la señal, este aviso se quita solo.</p>';
  }

  function abrirPasos() {
    U.preguntar('La recogida de correos', pasos(), 'Entendido', true);
  }

  function registrar(t) {
    if (window.AvisosLinea) AvisosLinea.registrar(ID, t, false, t ? abrirPasos : undefined);
  }

  /* Lee la señal y pone o quita el aviso. Devuelve el resultado, o null si
     no toca mirar nada (sin carpeta, sin permiso, directivo, arranque). */
  async function mirar(aLaFuerza) {
    if (window.Perfil && Perfil.esDirectivo()) { registrar(''); return null; }   /* sin esperar a los 5 minutos: si entra otro nombre, el aviso se va ya */
    if (mirando) return null;
    if (!aLaFuerza && ultimaMirada && Date.now() - ultimaMirada < CADA_MS) return null;
    mirando = true;
    try {
      if (window.Perfil && Perfil.esDirectivo()) { registrar(''); return null; }
      var carpeta = window.Bandeja && Bandeja.carpeta();
      if (!carpeta) { registrar(''); return null; }
      if (!(await Carpetas.permiso(carpeta, false).catch(function () { return false; }))) { registrar(''); return null; }
      var senal = null;
      try { senal = await Carpetas.leerJson(carpeta, FICHERO); } catch (e) { senal = null; }
      ultimaMirada = Date.now();
      cuentaDelLatido = (senal && typeof senal === 'object' && typeof senal.cuenta === 'string') ? senal.cuenta.trim() : '';
      if (window.CorreoEnviar && CorreoEnviar.repintarCuenta) CorreoEnviar.repintarCuenta();   /* fila 411 */
      var r = juzgar(senal, Date.now());
      var enArranque = !esDemo() && Date.now() - abierta < ARRANQUE_MS;
      registrar(enArranque ? '' : texto(r));
      return r;
    } catch (e) {
      return null;   /* un aviso roto no puede tumbar la aplicación */
    } finally {
      mirando = false;
    }
  }

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () { mirar(false); });
  }
  enganchar();
  if (!window.Gestor) document.addEventListener('DOMContentLoaded', enganchar);

  return { mirar: mirar, cuenta: function () { return cuentaDelLatido; }, _juzgar: juzgar, _texto: texto, FICHERO: FICHERO };
})();
