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
  var CLAVE_CERRADO = 'avisos-cerrado-el';
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

  /* El aviso se puede cerrar, pero solo por hoy: mañana vuelve. */
  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  function cerradoHoy() {
    try { return window.localStorage.getItem(CLAVE_CERRADO) === hoy(); } catch (e) { return false; }
  }

  function cerrarPorHoy() {
    try { window.localStorage.setItem(CLAVE_CERRADO, hoy()); } catch (e) {}
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

  function frase(c) {
    var trozos = [];
    if (c.vencidos) {
      trozos.push(c.vencidos === 1 ? '1 asunto vencido' : c.vencidos + ' asuntos vencidos');
    }
    if (c.proximos) {
      trozos.push(c.proximos === 1
        ? '1 que vence en los próximos ' + c.margen + ' días'
        : c.proximos + ' que vencen en los próximos ' + c.margen + ' días');
    }
    return trozos.join(' y ') + '.';
  }

  /* El panel de arriba de la pantalla de asuntos abiertos. */
  function pintar() {
    var caja = $('panel-avisos');
    if (!caja) return;

    var c = contar();
    if ((!c.vencidos && !c.proximos) || cerradoHoy()) {
      caja.classList.add('oculto');
      caja.innerHTML = '';
      return;
    }

    caja.className = 'aviso ' + (c.vencidos ? 'aviso-rojo' : 'aviso-ambar');
    caja.innerHTML = '<strong>Tienes ' + frase(c) + '</strong>';

    var botones = document.createElement('div');
    botones.className = 'avisos-botones';

    if (c.vencidos) {
      var bv = document.createElement('button');
      bv.className = 'boton boton-principal';
      bv.textContent = 'Ver los vencidos';
      bv.onclick = function () { window.Gestor.filtrarPorPlazo('vencidos'); };
      botones.appendChild(bv);
    }

    var bp = document.createElement('button');
    bp.className = 'boton';
    bp.textContent = c.vencidos ? 'Ver también los de esta semana' : 'Ver los que vencen pronto';
    bp.onclick = function () { window.Gestor.filtrarPorPlazo('pronto'); };
    botones.appendChild(bp);

    var bc = document.createElement('button');
    bc.className = 'boton';
    bc.textContent = 'Ocultar por hoy';
    bc.onclick = function () { cerrarPorHoy(); pintar(); };
    botones.appendChild(bc);

    caja.appendChild(botones);
    caja.classList.remove('oculto');
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
