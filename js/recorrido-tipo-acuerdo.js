/* ============================================================
   recorrido-tipo-acuerdo.js — los tipos de documento se ponen de acuerdo
   (17-nov-2026, fila 698, docs/698-RECORRIDO-DEL-TIPO-DE-DOCUMENTO.md).

   Una pasada, una sola vez por centro, al entrar, sin preguntar:
   1. RESOLUCIÓN (con tilde) se une con RESOLUCION, y CERTIFICACION con
      CERTIFICADO: el nombre viejo sale de la lista, y sus plantillas, su
      extracto propio y su recorrido pasan al nombre que se queda.
   2. Se añaden a la lista del centro: ACUERDO, DILIGENCIA, CITACION,
      AUTORIZACION, RENUNCIA y FICHA ENTREGA LIBROS.

   No se toca el nombre de ningún fichero ya guardado en las carpetas. La marca
   `recorridos-tipos-acuerdo.json` de `_GESTOR` dice que ya se hizo. Nunca con
   solo consulta ni con un guardado en marcha.
   ============================================================ */
var RecorridoTipoAcuerdo = (function () {

  var VERSION = 1;
  var MARCA = 'recorridos-tipos-acuerdo.json';
  /* [nombres de antes, nombre que se queda] */
  var UNIONES = [
    [['RESOLUCIÓN'], 'RESOLUCION'],
    [['CERTIFICACION', 'CERTIFICACIÓN'], 'CERTIFICADO']
  ];
  var NUEVOS = ['ACUERDO', 'DILIGENCIA', 'CITACION', 'AUTORIZACION', 'RENUNCIA', 'FICHA ENTREGA LIBROS'];
  var corriendo = false;

  function gestor() { return window.App && App.E && App.E.gestor; }
  function mayus(t) { return String(t || '').trim().toUpperCase(); }
  function n(t) { return U.normalizar(String(t || '')); }

  async function leerMarca() {
    try { var m = await Carpetas.leerJson(gestor(), MARCA); return (m && m.version >= VERSION) ? m : null; }
    catch (e) { return null; }
  }

  /* Pasa lo de `viejo` a `nuevo` en plantillas.json: el tipo de las plantillas de documento y el extracto propio. */
  async function pasarPlantillas(viejo, nuevo) {
    if (!window.Plantillas) return 0;
    var cuenta = 0;
    await App.enFila('plantillas.json', function () {
      return Plantillas.guardar(gestor(), function (actual) {
        (actual.documentos || []).forEach(function (p) {
          if (mayus(p.tipoDocumento) === mayus(viejo)) { p.tipoDocumento = nuevo; cuenta++; }
        });
        var ex = actual.extractosPorTipo;
        if (ex && typeof ex === 'object' && Object.prototype.hasOwnProperty.call(ex, viejo)) {
          if (!ex[nuevo]) ex[nuevo] = ex[viejo];
          delete ex[viejo];
        }
        return actual;
      });
    });
    return cuenta;
  }

  async function ponerEnLista(nombre) {
    await Borrados.revivir(gestor(), 'tiposDocumento', nombre);
    if (App.E.tiposDocumento.indexOf(nombre) === -1) App.E.tiposDocumento.push(nombre);
  }

  /* La pasada entera. `forzar`: aunque la marca esté puesta. Devuelve el resumen, o null si no ha corrido. */
  async function pasada(opciones) {
    var forzar = !!(opciones && opciones.forzar);
    if (corriendo) return null;
    if (window.SoloConsulta && SoloConsulta.activo()) return null;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return null;
    if (!gestor() || !App.E || !Array.isArray(App.E.tiposDocumento)) return null;
    corriendo = true;
    try {
      if (!forzar && await leerMarca()) return null;
      var r = { unidos: [], anadidos: [], plantillas: 0 };
      for (var i = 0; i < UNIONES.length; i++) {
        var nuevo = UNIONES[i][1];
        var hay = UNIONES[i][0].filter(function (v) { return App.E.tiposDocumento.some(function (x) { return mayus(x) === mayus(v); }); });
        for (var j = 0; j < hay.length; j++) {
          var viejo = App.E.tiposDocumento.filter(function (x) { return mayus(x) === mayus(hay[j]); })[0];
          if (viejo === nuevo) continue;
          await ponerEnLista(nuevo);
          App.E.tiposDocumento = App.E.tiposDocumento.filter(function (x) { return x !== viejo; });
          await Borrados.marcar(gestor(), 'tiposDocumento', viejo);
          if (window.RecorridoTipo) await RecorridoTipo.mover(viejo, nuevo);
          r.plantillas += await pasarPlantillas(viejo, nuevo);
          r.unidos.push(viejo + ' → ' + nuevo);
        }
        /* Las plantillas que ya dicen el nombre de antes aunque el tipo ya no esté en la lista. */
        for (var k = 0; k < UNIONES[i][0].length; k++) r.plantillas += await pasarPlantillas(UNIONES[i][0][k], nuevo);
      }
      for (var m = 0; m < NUEVOS.length; m++) {
        if (App.E.tiposDocumento.some(function (x) { return n(x) === n(NUEVOS[m]); })) continue;
        await ponerEnLista(NUEVOS[m]);
        r.anadidos.push(NUEVOS[m]);
      }
      if (r.unidos.length || r.anadidos.length) await App.guardarTiposDocumento();
      await Copias.guardar(gestor(), MARCA, { version: VERSION, aplicado: new Date().toISOString() });
      if (App.pintarTiposDeDocumento) App.pintarTiposDeDocumento();
      return r;
    } finally {
      corriendo = false;
    }
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
        if (window.Demo && Demo.montando) return turno();
        try { await pasada(); }
        catch (e) { U.accesorio('No he podido poner de acuerdo los tipos de documento', e); }
      }, 4000);
    })();
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return {
    VERSION: VERSION, MARCA: MARCA, UNIONES: UNIONES, NUEVOS: NUEVOS, pasada: pasada,
    _alEntrar: function () { yaMirado = false; alEntrar(); }
  };
})();
window.RecorridoTipoAcuerdo = RecorridoTipoAcuerdo;
