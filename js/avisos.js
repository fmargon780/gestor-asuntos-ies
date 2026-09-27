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

  /* Cuenta los asuntos abiertos que ya han vencido y los que vencen
     dentro del plazo de aviso. Los dos montones son distintos: un asunto
     vencido no se cuenta otra vez como próximo. */
  function contar() {
    var asuntos = (window.Gestor && window.Gestor.asuntos) ? window.Gestor.asuntos() : [];
    var margen = diasDeAviso();
    var vencidos = 0, proximos = 0;
    asuntos.forEach(function (a) {
      var p = Plazos.de((a.ficha && a.ficha.limite) || '');
      if (!p) return;
      if (p.dias <= 0) vencidos++;
      else if (p.dias <= margen) proximos++;
    });
    return { vencidos: vencidos, proximos: proximos, margen: margen };
  }

  /* Fila 193: los dos trozos de este módulo en la línea de avisos de
     arriba (js/avisos-linea.js), en vez de su propia caja de color. */
  function pintar() {
    if (!window.AvisosLinea) return;
    var c = contar();

    AvisosLinea.registrar('plazo-vencidos', c.vencidos ? {
      texto: (c.vencidos === 1 ? '1 vencido' : c.vencidos + ' vencidos'),
      rojo: true,
      onclick: function () { window.Gestor.filtrarPorPlazo('vencidos'); }
    } : null);

    AvisosLinea.registrar('plazo-proximos', c.proximos ? {
      texto: (c.proximos === 1
        ? '1 vence esta semana'
        : c.proximos + ' vencen esta semana'),
      rojo: false,
      onclick: function () { window.Gestor.filtrarPorPlazo('pronto'); }
    } : null);
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
