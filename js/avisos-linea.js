/* ============================================================
   avisos-linea.js — todos los avisos de arriba, en una sola línea
   (27-sep-2026, fila 193, docs/AVISOS-MENU-Y-VOLVER.md, apartado 1).

   Antes había hasta cinco cajas de color apiladas (js/avisos.js,
   js/recurrentes.js, js/frescura.js, js/avisos-que-faltan.js), más el
   botón de duplicados de la cabecera (js/unir-asuntos.js) y el aviso
   de aspirantes de Inicio (js/inicio.js). Cada módulo sigue calculando
   lo mismo; en vez de pintar su propia caja, registra aquí su trozo
   con AvisosLinea.registrar(id, trozo | null), y este módulo pinta
   la franja entera, en el orden de ORDEN.

   Cargado nada más js/version.js, antes que cualquiera de esos
   módulos: así todos pueden llamar a AvisosLinea.registrar en cuanto
   arrancan, sin comprobar si existe. */
(function () {

  var CLAVE_CERRADA = 'avisos-linea-cerrada';

  /* El orden del ejemplo del encargo: vencidos primero, luego lo
     próximo, recurrentes, duplicados, papelera, huérfanas, frescura,
     y por último aspirantes. Un id que no esté aquí va al final. */
  var ORDEN = ['plazo-vencidos', 'plazo-proximos', 'recurrentes', 'duplicados',
    'papelera-vieja', 'huerfanas', 'frescura', 'aspirantes'];

  var trozos = {};   /* id -> { texto, rojo, onclick, id, clase } | undefined */

  function $(id) { return document.getElementById(id); }

  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  function firmaDe(ids) { return ids.slice().sort().join('|'); }

  function leerCerrada() {
    try {
      var v = JSON.parse(window.localStorage.getItem(CLAVE_CERRADA));
      if (!v || typeof v.dia !== 'string' || typeof v.firma !== 'string') return null;
      return v;
    } catch (e) { return null; }
  }

  /* Cerrada hoy, y solo mientras el conjunto de avisos sea el mismo de
     cuando se cerró: si aparece uno nuevo, vuelve a salir. */
  function estaCerrada(ids) {
    var g = leerCerrada();
    return !!g && g.dia === hoy() && g.firma === firmaDe(ids);
  }

  function cerrarPorHoy(ids) {
    try {
      window.localStorage.setItem(CLAVE_CERRADA, JSON.stringify({ dia: hoy(), firma: firmaDe(ids) }));
    } catch (e) { /* sin localStorage, el aviso simplemente no se puede callar */ }
    pintar();
  }

  function idsOrdenados() {
    return Object.keys(trozos)
      .filter(function (id) { return !!trozos[id]; })
      .sort(function (a, b) {
        var ia = ORDEN.indexOf(a); if (ia === -1) ia = ORDEN.length;
        var ib = ORDEN.indexOf(b); if (ib === -1) ib = ORDEN.length;
        return ia - ib || a.localeCompare(b);
      });
  }

  function pintar() {
    var c = $('avisos-linea');
    if (!c) return;
    var ids = idsOrdenados();

    if (!ids.length || estaCerrada(ids)) {
      c.className = 'oculto';
      c.innerHTML = '';
      return;
    }

    var rojo = ids.some(function (id) { return trozos[id].rojo; });
    c.className = 'aviso-linea ' + (rojo ? 'aviso-linea-rojo' : 'aviso-linea-ambar');
    c.innerHTML = '';

    ids.forEach(function (id, i) {
      if (i) {
        var sep = document.createElement('span');
        sep.className = 'aviso-linea-sep';
        sep.textContent = ' · ';
        c.appendChild(sep);
      }
      var t = trozos[id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'aviso-linea-trozo' + (t.clase ? ' ' + t.clase : '');
      if (t.id) b.id = t.id;
      b.dataset.aviso = id;
      b.textContent = t.texto;
      b.onclick = t.onclick || null;
      c.appendChild(b);
    });

    var ocultar = document.createElement('button');
    ocultar.type = 'button';
    ocultar.className = 'boton aviso-linea-ocultar';
    ocultar.textContent = 'Ocultar por hoy';
    ocultar.onclick = function () { cerrarPorHoy(ids); };
    c.appendChild(ocultar);
  }

  /* trozo: { texto, rojo, onclick, id, clase } o null/undefined para
     quitarlo. Cada módulo llama a esto cada vez que recalcula lo suyo. */
  function registrar(id, trozo) {
    trozos[id] = trozo || null;
    pintar();
  }

  window.AvisosLinea = { registrar: registrar, _pintar: pintar };
})();
