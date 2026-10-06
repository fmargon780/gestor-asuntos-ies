/* ============================================================
   plazos-del-centro.js — los plazos legales llegan solos al centro
   (6-oct-2026, fila 284, docs/PLAZOS-LEGALES-EN-LA-BIBLIOTECA.md, apartado 4).

   Una pasada, la primera vez que un ordenador del centro abre esta versión
   (o cuando se pulsa «Cargar la biblioteca del centro»):

   1. Los modelos comunes nuevos (`b-comun-…`) que falten en
      `_GESTOR/hitos-biblioteca.json` se añaden.
   2. Un modelo del centro sin plazo recibe el del contenido; uno que ya lo
      tiene, no se toca.
   3. En cada guía, un paso del nivel de arriba que venga de un modelo con
      plazo y no tenga plazo lo recibe, contando desde el paso que dice la
      tabla `plazosPorTipo` del contenido o, si no hay (o ya no está), desde
      el de arriba. Sin ninguno encima, se queda sin plazo.

   Nada sube la `revision` de un modelo ni enciende el aviso «hay un cambio
   en la biblioteca». No toca los asuntos abiertos. La marca `plazosDelCentro`
   vive en el propio fichero de la biblioteca (que ya pasa por Copias).
   Se engancha por `Gestor.alRefrescar`; se carga después de
   js/cargar-biblioteca.js.
   ============================================================ */
var PlazosDelCentro = (function () {

  var VERSION = 2;
  var corriendo = false;

  function esNuevo(m) { return !!m && String(m.id || '').indexOf('b-comun-') === 0; }
  function mismo(a, b) { return U.normalizar(String(a || '')) === U.normalizar(String(b || '')); }
  function plazoDe(m) { return { dias: m.plazo.dias, desde: '', cuenta: Plazos.cuentaValida(m.plazo.cuenta) }; }
  function conPlazo(p) { return !!(p && p.plazo && parseInt(p.plazo.dias, 10) > 0); }
  function origenDe(p) { return (p.origenBiblioteca && p.origenBiblioteca.id) || p.id; }

  /* PURA. `modelos`: los del centro (se cambian en su sitio). */
  function completarModelos(modelos, datos) {
    var r = { nuevos: 0, plazos: 0 };
    var yaEsta = {};
    modelos.forEach(function (m) { yaEsta[m.id] = m; });
    (datos.modelos || []).forEach(function (d) {
      if (!d || !d.id) return;
      if (!yaEsta[d.id]) {
        if (!esNuevo(d)) return;
        modelos.push(HitosBiblioteca._normalizarModelo(d));
        r.nuevos++;
        return;
      }
      if (d.plazo && d.plazo.dias && !conPlazo(yaEsta[d.id])) { yaEsta[d.id].plazo = plazoDe(d); r.plazos++; }
    });
    return r;
  }

  /* La fila de la tabla que toca a una guía (por nombre largo o corto del tipo). */
  function tablaDe(tipo, datos) {
    var entrada = (datos.tipos || []).filter(function (t) { return mismo(t.nombreLargo, tipo) || mismo(t.nombreCorto, tipo); })[0];
    var tabla = datos.plazosPorTipo || {};
    return (entrada && tabla[entrada.nombreLargo]) || tabla[tipo] || {};
  }

  /* PURA. `guias`: { tipo: [pasos] } tal como está en guias.json (se cambia en su sitio). */
  function completarGuias(guias, datos) {
    var conPlazoDeModelo = {};
    (datos.modelos || []).forEach(function (m) { if (m && m.plazo && m.plazo.dias) conPlazoDeModelo[m.id] = m; });
    var r = { pasos: 0, guias: 0, tipos: [] };
    Object.keys(guias || {}).forEach(function (tipo) {
      var pasos = guias[tipo];
      if (!Array.isArray(pasos)) return;
      var tabla = tablaDe(tipo, datos);
      var puestos = 0;
      pasos.forEach(function (p, i) {
        if (!p || typeof p !== 'object' || (p.opciones || []).length) return;
        var m = conPlazoDeModelo[origenDe(p)];
        if (!m || conPlazo(p)) return;
        var desde = '';
        var deLaTabla = tabla[origenDe(p)];
        if (deLaTabla) {
          pasos.forEach(function (q) { if (q && q !== p && !(q.opciones || []).length && origenDe(q) === deLaTabla) desde = q.id; });
        }
        if (!desde && i > 0 && pasos[i - 1] && pasos[i - 1].id) desde = pasos[i - 1].id;
        if (!desde) return;
        p.plazo = { dias: parseInt(m.plazo.dias, 10), desde: desde, cuenta: Plazos.cuentaValida(m.plazo.cuenta) };
        puestos++;
      });
      if (puestos) { r.pasos += puestos; r.guias++; r.tipos.push(tipo); }
    });
    return r;
  }

  /* El contenido del centro: su propia lectura (no la caché de CargarBiblioteca, que otras pruebas sustituyen). */
  var datosLeidos = null;
  async function leerDatos() {
    if (!datosLeidos) datosLeidos = await App.leerFicheroDeLaApp('datos-biblioteca/biblioteca-centro.json', 'json');
    return datosLeidos;
  }

  /* La pasada entera. `opciones.datos`: el contenido ya leído (lo pasa el botón de Mantenimiento). `forzar`: el botón de Mantenimiento, aunque la marca ya esté puesta.
     Devuelve el resumen, o null si no ha corrido. */
  async function pasada(opciones) {
    var forzar = !!(opciones && opciones.forzar);
    if (corriendo) return null;
    if (window.SoloConsulta && SoloConsulta.activo()) return null;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return null;
    if (!window.Gestor || !Gestor.carpetaGestor()) return null;
    corriendo = true;
    try {
      var biblioteca = await HitosBiblioteca.leer();
      if (!forzar && biblioteca.plazosDelCentro >= VERSION) return null;
      /* Un centro que no ha cargado nunca su biblioteca (ninguna hito modelo) no tiene nada que completar:
         ahí no se hace nada, ni se pone la marca; el botón de Mantenimiento lo trae todo. */
      if (!forzar && !biblioteca.modelos.length) return null;
      var datos = (opciones && opciones.datos) || await leerDatos();
      var resumen = { modelosNuevos: 0, modelosConPlazo: 0, pasos: 0, guias: 0 };

      await HitosBiblioteca.cambiar(function (d) {
        var r = completarModelos(d.modelos, datos);
        resumen.modelosNuevos = r.nuevos;
        resumen.modelosConPlazo = r.plazos;
        return d;
      });

      var enDisco = null;
      try { enDisco = await Carpetas.leerJson(App.E.gestor, 'guias.json'); } catch (e) { enDisco = null; }
      enDisco = (enDisco && typeof enDisco === 'object') ? enDisco : {};
      var g = completarGuias(enDisco, datos);
      resumen.pasos = g.pasos;
      resumen.guias = g.guias;
      /* Como traerGuiones: una escritura de guias.json (con su copia) y un guardarPasos
         del último tipo, que relee el fichero y refresca la pantalla. */
      if (g.tipos.length) {
        await Copias.guardar(App.E.gestor, 'guias.json', enDisco);
        var ultimo = g.tipos[g.tipos.length - 1];
        await GuiasDelCentro.guardarPasos(ultimo, enDisco[ultimo]);
      }

      await HitosBiblioteca.cambiar(function (d) { d.plazosDelCentro = VERSION; return d; });
      return resumen;
    } finally {
      corriendo = false;
    }
  }

  function textoDelAviso(r) {
    var t = [];
    if (r.pasos) t.push('Plazos legales puestos en ' + r.pasos + (r.pasos === 1 ? ' hito' : ' hitos') +
      ' de ' + r.guias + (r.guias === 1 ? ' guía.' : ' guías.'));
    if (r.modelosNuevos) t.push('La biblioteca tiene ' + r.modelosNuevos +
      (r.modelosNuevos === 1 ? ' hito común nuevo.' : ' hitos comunes nuevos.'));
    return t.join(' ');
  }

  function irAFestivos() {
    App.ir('ajustes');
    if (typeof App.cambiarPestanaAjustes === 'function') App.cambiarPestanaAjustes('centro');
    setTimeout(function () {
      var b = document.getElementById('bloque-hitos');
      if (b) { b.open = true; if (b.scrollIntoView) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, 50);
  }

  async function avisar(r) {
    var texto = textoDelAviso(r);
    if (!texto) return;
    U.aviso(texto, 'bueno');
    try {
      var aj = (await Hitos.leer()).ajustes;
      if (!aj.festivos || !aj.festivos.length) {
        U.aviso('Faltan los festivos: sin ellos los días hábiles se cuentan mal.', 'ambar',
          { boton: 'Ponerlos', alPulsar: irAFestivos });
      }
    } catch (e) { /* el aviso de los festivos es un extra */ }
  }

  /* Al entrar: en segundo plano, nunca con un guardado en marcha; si falla, solo ámbar. */
  var yaMirado = false;
  function alEntrar() {
    if (yaMirado || !window.App || !App.E || !App.E.gestor || !window.Gestor || !Gestor.carpetaGestor()) return;
    yaMirado = true;
    var intentos = 0;
    (function turno() {
      setTimeout(async function () {
        if (window.ColaGuardado && ColaGuardado.hayGuardado() && ++intentos < 10) return turno();
        if (window.Demo && Demo.montando) return;   /* la copia de pruebas hace su propia pasada al acabar de montar */
        try {
          var r = await pasada();
          if (r) await avisar(r);
        } catch (e) { U.accesorio('No he podido poner los plazos legales en la biblioteca', e); }
      }, 3000);
    })();
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return {
    VERSION: VERSION, pasada: pasada, avisar: avisar, textoDelAviso: textoDelAviso,
    /* para las pruebas */
    _completarModelos: completarModelos, _completarGuias: completarGuias, _alEntrar: function () { yaMirado = false; alEntrar(); }
  };
})();
window.PlazosDelCentro = PlazosDelCentro;
