/* ============================================================
   avisos-exposicion.js — «Termina la exposición de …» (15-nov-2026, fila 672, docs/672-ACCIONES-QUE-HACEN-ALGO-2.md).

   Una tarea de «Publicar» marcada con «Publicado» y una fecha en «Expuesto hasta» (`hechoCon.hasta`, js/tarea-hecha.js)
   pone, el día de esa fecha, un trozo en la franja de avisos de Inicio (js/avisos-linea.js): «Termina la exposición de
   <tarea> (<asunto>)». Solo cuenta mientras la tarea sigue hecha: «Deshacer» (o desmarcarla) lo quita. No es una nota del tablón.
   Se calcula leyendo los hitos de los asuntos abiertos, cada vez que la aplicación repinta (con un pequeño margen entre lecturas).
   ============================================================ */
var AvisosExposicion = (function () {

  var ID = 'exposiciones';
  var ultima = 0, leyendo = false;

  function hoy() { return (window.U && U.hoyIso && U.hoyIso()) || ''; }

  /* Las exposiciones que terminan en la fecha `dia`, a partir de los datos de hitos y de los asuntos abiertos:
     [{ asunto, tarea }]. Pura, para poder probarla. */
  function queTerminan(datos, asuntos, dia, guionDe) {
    var lista = [];
    (asuntos || []).forEach(function (a) {
      var e = datos && datos.porAsunto && datos.porAsunto[a.nombre];
      ((e && e.hitos) || []).forEach(function (h) {
        var hecho = h.guionHecho || {};
        Object.keys(hecho).forEach(function (id) {
          var x = hecho[id];
          if (!x || !x.hecho || !x.hechoCon || String(x.hechoCon.hasta || '').slice(0, 10) !== dia) return;
          var g = guionDe ? (guionDe(a, h) || []).filter(function (l) { return l.id === id; })[0] : null;
          if (guionDe && !g) return;   /* la tarea ya no está en el asunto */
          lista.push({ asunto: a.nombre, a: a, tarea: (g && g.texto) || '' });
        });
      });
    });
    return lista;
  }

  function textoDe(lista) {
    return lista.map(function (x) { return 'Termina la exposición de «' + x.tarea + '» (' + x.asunto + ')'; }).join(' · ');
  }

  async function pintar() {
    if (!window.AvisosLinea || !window.Hitos || !window.Gestor || leyendo || Date.now() - ultima < 3000) return;
    leyendo = true;
    try {
      var datos = await Hitos.leer();
      var lista = queTerminan(datos, Gestor.asuntos ? Gestor.asuntos() : [], hoy(), Hitos.guionDe);
      AvisosLinea.registrar(ID, textoDe(lista), false, undefined, lista.map(function (x) { return x.a; }));
    } catch (e) { /* sin aviso: lo demás no depende de esto */ }
    ultima = Date.now();
    leyendo = false;
  }

  function arrancar() {
    if (!window.Gestor || !Gestor.alRefrescar) return;
    Gestor.alRefrescar.push(pintar);
    pintar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();

  return { queTerminan: queTerminan, textoDe: textoDe, pintar: function () { ultima = 0; return pintar(); } };
})();
window.AvisosExposicion = AvisosExposicion;
