/* ============================================================
   control-registro-avisos.js — los dos trozos de Inicio del control del
   registro y el campo de Ajustes (2-oct-2026, fila 259,
   docs/CONTROL-DEL-REGISTRO.md).

   - «N apuntes de registro sin asunto» (entrada + salida).
   - «Registro sin revisar desde el DD/MM» (o «Registro de salida sin
     revisar desde…» si solo se ha quedado atrás un libro).
   Sin la fecha «Revisar desde» puesta, ningún aviso (y no se lee nada).
   Se recalcula al refrescar, como mucho una vez cada 2 minutos, y al
   cambiar algo en la pantalla (`calcular(true)`).
   ============================================================ */
var ControlRegistroAvisos = (function () {

  var ULTIMA = 0, MARGEN_MS = 2 * 60 * 1000, ENMARCHA = false;

  function abrirControl() {
    if (window.App && App.ir) App.ir('herramientas');
    if (window.ControlRegistroPantalla) ControlRegistroPantalla.abrir();
  }

  function trozoAtraso(r) {
    var libros = r.atrasados;
    if (!libros.length) return '';
    var fechas = libros.map(function (x) { return x.desde; }).filter(Boolean).sort();
    var desde = fechas[0] ? fechas[0].slice(8, 10) + '/' + fechas[0].slice(5, 7) : '';
    var cual = libros.length === 2 ? '' : (libros[0].libro === 'E' ? ' de entrada' : ' de salida');
    return 'Registro' + cual + ' sin revisar' + (desde ? ' desde el ' + desde : ' todavía');
  }

  /* Texto de los dos trozos a partir del resumen (sin pantalla, para probarlo). */
  function trozos(r) {
    if (!r.activo) return { sinAsunto: '', atraso: '' };
    return {
      sinAsunto: r.sinAsunto ? r.sinAsunto + (r.sinAsunto === 1 ? ' apunte de registro sin asunto' : ' apuntes de registro sin asunto') : '',
      atraso: trozoAtraso(r)
    };
  }

  async function calcular(forzar) {
    if (!window.AvisosLinea || !window.ControlRegistro || ENMARCHA) return;
    if (!forzar && Date.now() - ULTIMA < MARGEN_MS) return;
    if (!window.App || !App.E || !App.E.gestor) return;
    ENMARCHA = true;
    try {
      var estado = await ControlRegistro.cargar();
      if (!estado.control.desde) {
        AvisosLinea.registrar('registro-sin-asunto', '', false);
        AvisosLinea.registrar('registro-atrasado', '', false);
        return;
      }
      var asuntos = await ControlRegistro.contextoDeAsuntos();
      var r = ControlRegistro.resumenParaAvisos(estado, ControlRegistro.clasificar(estado, asuntos), ControlRegistro.diasDeAviso());
      var t = trozos(r);
      AvisosLinea.registrar('registro-sin-asunto', t.sinAsunto, false, abrirControl);
      AvisosLinea.registrar('registro-atrasado', t.atraso, false, abrirControl);
    } catch (e) { /* un fallo al leer no tumba Inicio: simplemente no hay aviso */ }
    finally { ULTIMA = Date.now(); ENMARCHA = false; }
  }

  /* Ajustes → El centro → «Días de aviso». */
  function pintarAjustes() {
    var campo = document.getElementById('dias-registro');
    if (!campo) return;
    campo.value = String(ControlRegistro.diasDeAviso());
    campo.onchange = async function () {
      var n = parseInt(campo.value, 10);
      if (isNaN(n) || n < 1) { campo.value = String(ControlRegistro.diasDeAviso()); return; }
      try {
        await App.guardarRegistroFresco(function (registro) {
          registro.ajustesAvisos = registro.ajustesAvisos || {};
          registro.ajustesAvisos.diasRegistro = n;
        });
        U.aviso('Se avisará si el registro de Séneca lleva más de ' + n + ' días sin revisar.', 'bueno');
        calcular(true);
      } catch (e) {
        U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      }
    };
  }

  function enganchar() {
    if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(function () { calcular(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { calcular: calcular, pintarAjustes: pintarAjustes, trozos: trozos };
})();
window.ControlRegistroAvisos = ControlRegistroAvisos;
