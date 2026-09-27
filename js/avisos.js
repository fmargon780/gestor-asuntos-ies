/* ============================================================
   avisos.js — el aviso de lo que vence.

   La aplicación no tiene servidor detrás: solo funciona cuando alguien
   la abre en el navegador. Por eso el aviso es al abrirla, no un correo
   a las ocho de la mañana. En la práctica basta, porque se abre todos
   los días para trabajar.

   Este módulo se cuelga de window.Gestor y no toca nada de app.js.
   ============================================================ */
(function () {

  var CLAVE_DIAS = 'avisos-dias';
  var DIAS_POR_DEFECTO = 7;

  function $(id) { return document.getElementById(id); }

  /* Con cuántos días de antelación se avisa. Es de este ordenador: cada
     uno lo pone como le convenga. */
  function diasDeAviso() {
    var v = '';
    try { v = window.localStorage.getItem(CLAVE_DIAS) || ''; } catch (e) {}
    var n = parseInt(v, 10);
    return (!isNaN(n) && n >= 0) ? n : DIAS_POR_DEFECTO;
  }

  function guardarDias(n) {
    try { window.localStorage.setItem(CLAVE_DIAS, String(n)); } catch (e) {}
  }

  function esVencido(a) {
    var p = Plazos.de((a.ficha && a.ficha.limite) || '');
    return !!(p && p.dias <= 0);
  }
  function esProximo(a, margen) {
    var p = Plazos.de((a.ficha && a.ficha.limite) || '');
    return !!(p && p.dias > 0 && p.dias <= margen);
  }

  /* Cuenta los asuntos abiertos que ya han vencido y los que vencen
     dentro del plazo de aviso. Los dos montones son distintos: un asunto
     vencido no se cuenta otra vez como próximo. Fila 209: además de la
     cuenta, las dos listas de asuntos (para que el aviso, al pulsarlo,
     filtre la tabla de Inicio). */
  function contar() {
    var asuntos = (window.Gestor && window.Gestor.asuntos) ? window.Gestor.asuntos() : [];
    var margen = diasDeAviso();
    var listaVencidos = asuntos.filter(esVencido);
    var listaProximos = asuntos.filter(function (a) { return esProximo(a, margen); });
    return { vencidos: listaVencidos.length, proximos: listaProximos.length, margen: margen,
             listaVencidos: listaVencidos, listaProximos: listaProximos };
  }

  /* Fila 193, apartado 1: ya no pinta su propia caja. Cada montón (los
     vencidos, los que vencen pronto) es un trozo de la franja única de
     js/avisos-linea.js. Solo el de vencidos pone la franja en rojo
     (docs/AVISOS-MENU-Y-VOLVER.md: "roja si hay algo vencido..."). Fila
     209: el botón ya no lleva a #filtro-plazo (window.Gestor.filtrarPorPlazo
     se deja sin borrar, por si otro documento lo referencia, pero ya no
     tiene llamador): el filtro-de-tabla de la propia franja
     (AvisosLinea → InicioTabla.filtrarPorAviso) es el único mecanismo. */
  function pintar() {
    if (!window.AvisosLinea) return;
    var c = contar();

    AvisosLinea.registrar('vencidos',
      c.vencidos ? (c.vencidos === 1 ? '1 vencido' : c.vencidos + ' vencidos') : '',
      true, undefined, c.listaVencidos);

    var textoProximos = '';
    if (c.proximos) {
      textoProximos = c.margen === 7
        ? (c.proximos === 1 ? '1 vence esta semana' : c.proximos + ' vencen esta semana')
        : (c.proximos === 1
            ? '1 vence en los próximos ' + c.margen + ' días'
            : c.proximos + ' vencen en los próximos ' + c.margen + ' días');
    }
    AvisosLinea.registrar('proximos', textoProximos, false, undefined, c.listaProximos);
  }

  /* El ajuste de los días, en la pantalla de Ajustes. El hueco está en
     el index; aquí solo se rellena. */
  function prepararAjuste() {
    var campo = $('avisos-dias');
    if (!campo) return;
    campo.value = String(diasDeAviso());
    campo.onchange = function () {
      var n = parseInt(campo.value, 10);
      if (isNaN(n) || n < 0) { campo.value = String(diasDeAviso()); return; }
      guardarDias(n);
      pintar();
      U.aviso('Se avisará con ' + n + ' días de antelación.', 'bueno');
    };
  }

  /* Se apunta para que la aplicación lo llame cada vez que repinta la
     lista de asuntos. */
  function arrancar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(pintar);
    prepararAjuste();
    pintar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})();
