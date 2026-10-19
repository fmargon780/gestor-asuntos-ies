/* ============================================================
   tablon-hora.js — la hora de una nota del tablón (fila 372,
   docs/TABLON-AVISO-A-HORA-FIJA.md): los dos controles que van junto
   al día (hora y «Avisar») y cómo se escribe una hora. Se carga justo
   detrás de js/tablon-compacto.js, que lo usa al escribir o cambiar
   una nota y al enseñarla; la ventana del aviso está en
   js/tablon-avisos.js.
   ============================================================ */
(function () {

  var ETIQUETAS = { 0: 'a la hora justa', 15: '15 minutos antes', 30: '30 minutos antes', 60: '1 hora antes' };

  function legible(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '';
  }

  /* '09:30' → '9:30' */
  function corta(hora) {
    var p = String(hora || '').split(':');
    return p.length === 2 ? String(Number(p[0])) + ':' + p[1] : '';
  }

  function ahora() { return window.TablonAvisos ? TablonAvisos.ahora() : new Date(); }

  function hoyIso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* Una nota con hora ya pasada de su cita (de hoy o de otro día). */
  function pasada(n) {
    var c = n.hora ? Tablon.cita(n) : null;
    return !!c && c.getTime() < ahora().getTime();
  }

  /* «martes 20/10/2026 a las 9:30» */
  function cuando(n) {
    var c = Tablon.cita(n);
    var dia = c ? c.toLocaleDateString('es-ES', { weekday: 'long' }) : '';
    return dia + ' ' + legible(n.para) + ' a las ' + corta(n.hora);
  }

  /* La marca de la fila compacta: «🕘 Hoy 9:30», «🕘 20/10/2026 9:30 · pasada». */
  function marca(n) {
    var dia = n.para === hoyIso(ahora()) ? 'Hoy' : legible(n.para);
    return '🕘 ' + dia + ' ' + corta(n.hora) + (pasada(n) ? ' · pasada' : '');
  }

  /* La del papel entero: «Para hoy a las 9:30», «Pasada: 19/10/2026 a las 9:30». */
  function marcaLarga(n) {
    if (pasada(n)) return 'Pasada: ' + legible(n.para) + ' a las ' + corta(n.hora);
    return (n.para === hoyIso(ahora()) ? 'Para hoy' : 'Para el ' + legible(n.para)) + ' a las ' + corta(n.hora);
  }

  /* Hora y antelación. `alCambiar(hora, antes)` se llama con cada cambio
     (el borrador de la fila 33). `fijarFecha(valor)`: sin día no hay
     hora; el desplegable solo se ve cuando hay hora. */
  function controles(idHora, idAntes, hora, antes, alCambiar) {
    var caja = document.createElement('div');
    caja.className = 'tablon-fila tablon-fila-hora';

    var h = document.createElement('input');
    h.type = 'time';
    h.id = idHora;
    h.className = 'campo tablon-hora';
    h.title = 'A qué hora es, si tiene hora (hace falta poner el día)';
    h.value = hora || '';
    caja.appendChild(h);

    var envoltura = document.createElement('label');
    envoltura.className = 'tablon-avisar';
    var rotulo = document.createElement('span');
    rotulo.textContent = 'Avisar';
    envoltura.appendChild(rotulo);
    var sel = document.createElement('select');
    sel.id = idAntes;
    sel.className = 'campo';
    Tablon.ANTELACIONES.forEach(function (m) {
      var o = document.createElement('option');
      o.value = String(m);
      o.textContent = ETIQUETAS[m];
      sel.appendChild(o);
    });
    sel.value = String(typeof antes === 'number' ? antes : Tablon.ANTES_DE_FABRICA);
    envoltura.appendChild(sel);
    caja.appendChild(envoltura);

    function repasar() {
      envoltura.hidden = !h.value;
      if (alCambiar) alCambiar(h.value, Number(sel.value));
    }
    h.onchange = h.oninput = repasar;
    sel.onchange = repasar;
    envoltura.hidden = !h.value;

    caja.fijarFecha = function (valor) {
      h.disabled = !valor;
      if (!valor) { h.value = ''; envoltura.hidden = true; if (alCambiar) alCambiar('', Number(sel.value)); }
    };
    caja.valores = function () {
      return { hora: h.disabled ? '' : h.value, antes: Number(sel.value) };
    };
    return caja;
  }

  window.TablonHora = {
    controles: controles, corta: corta, legible: legible, pasada: pasada,
    cuando: cuando, marca: marca, marcaLarga: marcaLarga, hoyIso: hoyIso
  };

})();
