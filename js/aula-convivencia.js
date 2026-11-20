/* ============================================================
   aula-convivencia.js — el tipo «EXPULSIÓN AULA CONVICENCIA» recibe su guía de Administración
   (20-nov-2026, fila 723, docs/723-AULA-CONVIVENCIA-NOTA-Y-SEGUIMIENTO.md).

   Una pasada, una sola vez por centro, al entrar (o al montar la copia de pruebas), con
   `datos-biblioteca/aula-convivencia.json` y las plantillas `plantillas/*.md` del tipo. Como la de
   BAJA MATRICULA (js/baja-matricula.js), fusiona y no pisa:

   1. El tipo (se casa por su nombre, su nombre corto o su alias; sin renombrar) pasa a «Sin hitos»
      (fila 699): solo cambian los asuntos nuevos; los abiertos siguen como están. Si el centro no
      tiene ese tipo, no se crea.
   2. Dos datos del asunto, «Primer día» y «Días lectivos», que se piden al crear.
   3. Dos tipos de documento con su recorrido (fila 698): «NOTA AULA CONVIVENCIA» (lo hacemos nosotros,
      firma Jefatura de Estudios, se registra de salida, se envía a la familia por correo) y
      «FIRMADO AULA CONVIVENCIA» (nos llega, solo recibido). Un tipo que ya tenga recorrido no se toca.
   4. Las dos plantillas (el Word de la nota, con el compromiso en la segunda hoja, y el correo).
   5. La guía: una lista de tres tareas, sin rótulos. Si el tipo ya tiene una lista de tareas escrita,
      se deja como está.

   La marca `aula-convivencia.json` de `_GESTOR` dice que ya se hizo. Nunca con solo consulta ni con un
   guardado en marcha.
   ============================================================ */
var AulaConvivencia = (function () {

  var VERSION = 1;
  var MARCA = 'aula-convivencia.json';
  var RUTA = 'datos-biblioteca/aula-convivencia.json';
  var corriendo = false;

  function n(t) { return U.normalizar(String(t || '')).trim(); }
  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  /* El tipo del centro, por nombre, nombre corto o alias; null si no está. */
  function buscarTipo(d) {
    var nombres = [d.nombre].concat(d.alias || []).map(n);
    return (App.E.tipos || []).filter(function (t) {
      return [t.tipo, t.nombreCorto].concat(t.alias || []).map(n).some(function (x) { return nombres.indexOf(x) !== -1; });
    })[0] || null;
  }

  /* 1. Pasa a «Sin hitos». Devuelve true si ha cambiado. */
  async function ponerSinHitos(tipo) {
    if (tipo.sinHitos) return false;
    tipo.sinHitos = true;
    await App.guardarTipos();
    return true;
  }

  /* 2. Los datos del asunto y su sitio en el tipo (se piden al crear). Devuelve cuántos propios nuevos. */
  async function ponerCampos(d, tipo) {
    var campos = await Campos.leer(App.E.gestor);
    var ids = {}, nuevos = 0;
    for (var i = 0; i < d.campos.length; i++) {
      var c = d.campos[i];
      var propio = (campos.propios || []).filter(function (p) { return n(p.nombre) === n(c.nombre); })[0];
      if (!propio) {
        propio = { id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36) + i, nombre: c.nombre, clase: c.clase, valores: c.valores || [] };
        campos = await Campos.guardarPropios(App.E.gestor, function (lista) { lista.push(propio); return lista; });
        nuevos++;
      }
      ids[c.nombre] = propio.id;
    }
    var lista = ((campos.porTipo || {})[tipo.tipo] || []).slice(), cambia = false;
    d.campos.forEach(function (c) {
      var e = { origen: 'propio', id: ids[c.nombre], obligatorio: false, enNombre: false };
      if (!lista.some(function (x) { return x.origen === 'propio' && x.id === e.id; })) { lista.push(e); cambia = true; }
    });
    if (cambia) campos = await Campos.guardarConfigDeTipo(App.E.gestor, tipo.tipo, lista);
    App.E.campos = campos;
    return nuevos;
  }

  /* 3. Los tipos de documento y su recorrido. Devuelve cuántos tipos de documento nuevos. */
  async function ponerTiposDeDocumento(d) {
    var nuevos = 0;
    for (var i = 0; i < d.tiposDocumento.length; i++) {
      var t = d.tiposDocumento[i];
      if (!App.E.tiposDocumento.some(function (x) { return n(x) === n(t.nombre); })) {
        await Borrados.revivir(App.E.gestor, 'tiposDocumento', t.nombre);
        App.E.tiposDocumento.push(t.nombre);
        nuevos++;
      }
      if (window.RecorridoTipo && !RecorridoTipo.tiene(t.nombre)) await RecorridoTipo.poner(t.nombre, t.recorrido);
    }
    if (nuevos) { await App.guardarTiposDocumento(); if (App.pintarTiposDeDocumento) App.pintarTiposDeDocumento(); }
    return nuevos;
  }

  /* 4. Las plantillas del tipo. */
  async function ponerPlantillas(d, tipo) {
    var r = await PlantillasCentro.cargar({ soloTipo: d.tipo.indice, tipoReal: tipo.tipo });
    return r.documentosNuevos + r.correoNuevos;
  }

  /* 5. La guía: la lista de tareas, si el tipo aún no tiene una escrita. Devuelve cuántas tareas ha puesto. */
  async function ponerGuia(d, tipo) {
    try { await GuiasDelCentro.ponerAlDia(); } catch (e) { /* se sigue con la que hay */ }
    var pasos = GuiasDelCentro.todas()[tipo.tipo] || [];   /* en bruto: con los pasos de antes, que se guardan sin usarse */
    var hay = pasos.filter(function (p) { return p && p.listaDeTareas && (p.guion || []).length; })[0];
    if (hay) return 0;
    var guion = d.tareas.map(function (t) {
      var g = { id: t.id, texto: t.texto, comoSeHace: t.comoSeHace };
      if (t.papel) g.papel = t.papel;
      if (t.esperaAlEnviar) g.esperaAlEnviar = true;
      return g;
    });
    var resto = pasos.filter(function (p) { return !(p && p.listaDeTareas); });
    var nuevo = { id: Guias.nuevoId(), titulo: 'Tareas', cuerpo: '', opciones: [], listaDeTareas: true, guion: guion };
    await GuiasDelCentro.guardarPasos(tipo.tipo, Guias.normalizar(resto.concat([nuevo])), { sinLlevar: true });
    return guion.length;
  }

  async function leerMarca() {
    try { var m = await Carpetas.leerJson(gestor(), MARCA); return (m && m.version >= VERSION) ? m : null; }
    catch (e) { return null; }
  }

  /* La pasada entera. `forzar`: aunque la marca esté puesta (la copia de pruebas). Devuelve el resumen, o null si no ha corrido. */
  async function pasada(opciones) {
    var forzar = !!(opciones && opciones.forzar);
    if (corriendo) return null;
    if (window.SoloConsulta && SoloConsulta.activo()) return null;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return null;
    if (!gestor() || !App.E || !App.E.tipos || !Array.isArray(App.E.tiposDocumento)) return null;
    corriendo = true;
    try {
      if (!forzar && await leerMarca()) return null;
      var datos = (opciones && opciones.datos) || await App.leerFicheroDeLaApp(RUTA, 'json');
      var tipo = buscarTipo(datos.tipo);
      if (!tipo) return null;   /* este centro no tiene el tipo: no se crea ni se marca */
      var r = { tipo: tipo.tipo };
      r.sinHitos = await ponerSinHitos(tipo);
      r.camposNuevos = await ponerCampos(datos, tipo);
      r.tiposDocumentoNuevos = await ponerTiposDeDocumento(datos);
      r.plantillasNuevas = await ponerPlantillas(datos, tipo);
      r.tareas = await ponerGuia(datos, tipo);
      await Copias.guardar(gestor(), MARCA, { version: VERSION, aplicado: new Date().toISOString() });
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
        if (window.Demo && Demo.montando) return;
        /* La copia de pruebas y los navegadores automáticos (las pruebas, con su disco de mentira) solo la llevan con ?aula=1. */
        if ((/[?&]demo=1/.test(location.search) || navigator.webdriver) && !/[?&]aula=1/.test(location.search)) return;   /* la copia de pruebas hace su propia pasada al acabar de montar */
        try {
          var r = await pasada();
          if (r && (r.sinHitos || r.tareas)) U.aviso('El tipo «' + r.tipo + '» ya lleva su guía de tareas, con la nota a la familia.', 'bueno');
        } catch (e) { U.accesorio('No he podido poner al día el tipo de la expulsión al aula de convivencia', e); }
      }, 4500);
    })();
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return {
    VERSION: VERSION, MARCA: MARCA, pasada: pasada, buscarTipo: buscarTipo,
    /* para las pruebas */
    _alEntrar: function () { yaMirado = false; alEntrar(); }
  };
})();
window.AulaConvivencia = AulaConvivencia;
