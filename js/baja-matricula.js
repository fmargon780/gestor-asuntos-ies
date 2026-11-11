/* ============================================================
   baja-matricula.js — el tipo BAJA MATRICULA llega solo al centro
   (11-nov-2026, fila 592, docs/592-BAJA-MATRICULA.md).

   Una pasada, una sola vez por centro, al entrar (o al montar la copia de
   pruebas). Con el contenido de `datos-biblioteca/baja-matricula.json` y las
   plantillas `plantillas/*.md` del tipo «BAJA MATRICULA»:

   1. El tipo «BAJA» (o «Baja del alumnado») pasa a llamarse «Baja de matrícula»,
      con nombre corto BAJA MATRICULA; el nombre de antes queda de `alias`
      (las carpetas viejas se siguen reconociendo) y se lleva su guía, campos y
      plantillas (`TiposNombre.mover`). Si no hay tipo de baja, se crea. Si
      estaba desactivado, se vuelve a activar.
   2. Sus plantillas (resolución, anexos I y II, dos correos) se dan de alta,
      sin duplicar las que ya estén.
   3. Los datos del asunto (campos propios; el motivo se pide al crear).
   4. Las tareas y los hitos, en las listas comunes (se reutiliza el que ya sea
      igual) y la guía de seis hitos, que sustituye a la de antes. Los asuntos
      abiertos siguen con los hitos que tenían.

   La marca `baja-matricula.json` de `_GESTOR` dice que ya se hizo: no se
   repite. Nunca con solo consulta ni con un guardado en marcha. La lógica de
   las listas y la guía, en js/baja-matricula-guia.js.
   ============================================================ */
var BajaMatricula = (function () {

  var VERSION = 1;
  var MARCA = 'baja-matricula.json';
  var RUTA = 'datos-biblioteca/baja-matricula.json';
  var corriendo = false;

  function n(t) { return U.normalizar(String(t || '')).trim(); }
  function gestor() { return window.Gestor && window.Gestor.carpetaGestor(); }

  /* El tipo de baja que ya hay en el centro (por nombre, nombre corto o alias), o null. Solo de alumnado. */
  function buscarTipo(d) {
    var nombres = [d.largo, d.corto].concat(d.antes || []).map(n);
    var candidatos = (App.E.tipos || []).filter(function (t) {
      var propios = [t.tipo, t.nombreCorto].concat(t.alias || []).map(n);
      return propios.some(function (x) { return nombres.indexOf(x) !== -1; });
    });
    /* El que ya se llama como ahora, antes que uno de los de antes. */
    var ya = candidatos.filter(function (t) { return n(t.tipo) === n(d.largo) || n(t.nombreCorto) === n(d.corto); })[0];
    return ya || candidatos.filter(function (t) { return t.categoria === d.categoria; })[0] || null;
  }

  /* 1. El tipo: renombrado, creado o reactivado. Devuelve { tipo, renombrado, creado }. */
  async function asegurarTipo(d) {
    var t = buscarTipo(d), r = { tipo: t, renombrado: false, creado: false, reactivado: false };
    if (!t) {
      t = await App.crearTipo({ nombre: d.largo, categoria: d.categoria, nombreCorto: d.corto });
      r.tipo = t; r.creado = true;
      return r;
    }
    var viejo = t.tipo;
    var cambia = n(t.tipo) !== n(d.largo) || n(t.nombreCorto) !== n(d.corto);
    if (cambia) {
      t.alias = t.alias || [];
      [t.tipo, t.nombreCorto].concat(d.antes || []).forEach(function (a) {
        if (a && n(a) !== n(d.largo) && n(a) !== n(d.corto) && !t.alias.some(function (x) { return n(x) === n(a); })) t.alias.push(a);
      });
      t.tipo = d.largo; t.nombreCorto = d.corto;
      if (viejo !== t.tipo) {
        /* Como App.renombrarTipo: sin esto, otro ordenador devolvería el nombre viejo como tipo fantasma. */
        await Borrados.marcar(App.E.gestor, 'tipos', viejo);
        await Borrados.revivir(App.E.gestor, 'tipos', t.tipo);
      }
      r.renombrado = true;
    }
    if (t.desactivado) { delete t.desactivado; r.reactivado = true; }
    if (cambia || r.reactivado) await App.guardarTipos();
    if (viejo !== t.tipo && window.TiposNombre) await TiposNombre.mover(viejo, t.tipo);
    return r;
  }

  /* 3. Los campos propios y su sitio en el tipo. Devuelve { nombre: id del propio }. */
  async function ponerCampos(d, tipo) {
    var campos = await Campos.leer(App.E.gestor);
    var ids = {}, nuevos = 0;
    for (var i = 0; i < d.campos.length; i++) {
      var c = d.campos[i];
      var propio = (campos.propios || []).filter(function (p) { return n(p.nombre) === n(c.nombre); })[0];
      if (!propio) {
        propio = { id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36) + i, nombre: c.nombre, clase: c.clase, valores: c.valores };
        campos = await Campos.guardarPropios(App.E.gestor, function (lista) { lista.push(propio); return lista; });
        nuevos++;
      }
      ids[c.nombre] = propio.id;
    }
    var lista = ((campos.porTipo || {})[tipo.tipo] || []).slice(), cambia = false;
    function yaEsta(e) {
      return lista.some(function (x) { return x.origen === e.origen && (e.columna ? x.columna === e.columna : x.id === e.id); });
    }
    d.campos.forEach(function (c) {
      var e = { origen: 'propio', id: ids[c.nombre], obligatorio: false, enNombre: false };
      if (c.donde === 'general') e.sinPedirAlCrear = true;
      if (!yaEsta(e)) { lista.push(e); cambia = true; }
    });
    /* Lo que sale del alumno (su curso y su fecha de nacimiento) entra al crear el asunto, ya relleno, para que la resolución lo lleve. */
    (d.camposDelAlumno || []).forEach(function (f) {
      var e = { origen: f.origen, obligatorio: false, enNombre: false };
      if (f.columna) e.columna = f.columna; else e.id = f.id;
      if (!yaEsta(e)) { lista.push(e); cambia = true; }
    });
    if (cambia) campos = await Campos.guardarConfigDeTipo(App.E.gestor, tipo.tipo, lista);
    App.E.campos = campos;
    return { ids: ids, nuevos: nuevos };
  }

  /* 2. Las plantillas del tipo: se dan de alta y se devuelve { nombre: id }. */
  async function ponerPlantillas(d, tipo) {
    var r = await PlantillasCentro.cargar({ soloTipo: d.indice, tipoReal: tipo.tipo });
    var datos = await Plantillas.cargar(App.E.gestor);
    var ids = {};
    (datos.documentos || []).concat(datos.lista || []).forEach(function (p) {
      if (p.categoria === d.categoria && n(p.tipo) === n(tipo.tipo)) ids[p.nombre] = p.id;
    });
    return { ids: ids, nuevas: r.documentosNuevos + r.correoNuevos };
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
    if (!gestor() || !App.E || !App.E.tipos) return null;
    corriendo = true;
    try {
      if (!forzar && await leerMarca()) return null;
      var datos = (opciones && opciones.datos) || await App.leerFicheroDeLaApp(RUTA, 'json');
      var t = await asegurarTipo(datos.tipo);
      var pl = await ponerPlantillas(datos.tipo, t.tipo);
      var ca = await ponerCampos(datos, t.tipo);
      var g = await BajaMatriculaGuia.poner(datos, t.tipo, { campos: ca.ids, plantillas: pl.ids });
      await Copias.guardar(gestor(), MARCA, { version: VERSION, aplicado: new Date().toISOString() });
      return { tipo: t.tipo.tipo, renombrado: t.renombrado, creado: t.creado, reactivado: t.reactivado,
               plantillasNuevas: pl.nuevas, camposNuevos: ca.nuevos, tareasNuevas: g.tareas, hitosNuevos: g.hitos, hitos: g.pasos };
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
        /* La copia de pruebas y los navegadores automáticos (las pruebas, con su disco de mentira) solo la llevan con ?baja=1. */
        if ((/[?&]demo=1/.test(location.search) || navigator.webdriver) && !/[?&]baja=1/.test(location.search)) return;   /* la copia de pruebas hace su propia pasada al acabar de montar */
        try {
          var r = await pasada();
          if (r) U.aviso('El tipo «BAJA MATRICULA» ya está al día: guía de ' + r.hitos + ' hitos, con sus datos y plantillas.', 'bueno');
        } catch (e) { U.accesorio('No he podido poner al día el tipo BAJA MATRICULA', e); }
      }, 4000);
    })();
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return {
    VERSION: VERSION, MARCA: MARCA, pasada: pasada, buscarTipo: buscarTipo,
    /* para las pruebas */
    _alEntrar: function () { yaMirado = false; alEntrar(); }
  };
})();
window.BajaMatricula = BajaMatricula;
