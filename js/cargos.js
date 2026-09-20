/* ============================================================
   cargos.js — los cargos del centro y quién los ocupa, con fechas
   (20-sep-2026, fila 81, docs/FIRMANTES-Y-MEMBRETE.md, parte 1).

   Hasta hoy la firma de un documento era un texto fijo en
   plantillas.json: si cambiaba el equipo directivo, había que
   corregirla a mano, y un documento antiguo no decía quién firmaba
   entonces. Aquí se guarda, por cargo, la lista de quién lo ha
   ocupado y desde/hasta cuándo, en un fichero compartido nuevo,
   _GESTOR/cargos.json (el decimoséptimo, ver js/copias.js).

   Mismo patrón que js/plantillas.js: `cargar`/`guardar` releen antes
   de escribir, y las funciones que consultan una fecha son puras
   (reciben los datos ya cargados, nunca leen el disco), para poder
   probarlas sin navegador.
   ============================================================ */
var Cargos = (function () {

  var ARCHIVO = 'cargos.json';

  /* Los cargos de fábrica, sin ningún ocupante, si el fichero no
     existe todavía. */
  var DE_FABRICA = [
    { id: 'direccion', nombre: 'Dirección', orden: 1, tratamiento: 'El Director' },
    { id: 'vicedireccion', nombre: 'Vicedirección', orden: 2, tratamiento: 'El Vicedirector' },
    { id: 'jefatura-estudios', nombre: 'Jefatura de Estudios', orden: 3, tratamiento: 'El Jefe de Estudios' },
    { id: 'secretaria', nombre: 'Secretaría', orden: 4, tratamiento: 'El Secretario' },
    { id: 'administracion', nombre: 'Administración', orden: 5, tratamiento: 'El Auxiliar Administrativo' },
    { id: 'orientacion', nombre: 'Orientación', orden: 6, tratamiento: 'El Orientador' }
  ];

  var cache = null;

  function cargoLimpio(c) {
    c = c || {};
    return {
      id: c.id || '',
      nombre: c.nombre || '',
      orden: (typeof c.orden === 'number') ? c.orden : 99,
      tratamiento: c.tratamiento || '',
      ocupantes: Array.isArray(c.ocupantes) ? c.ocupantes.map(function (o) {
        return { id: o.id || idNuevoOcupante(), persona: o.persona || '', desde: o.desde || '', hasta: o.hasta || '' };
      }) : []
    };
  }

  function limpio(leido) {
    var l = (leido && typeof leido === 'object') ? leido : {};
    var cargos = Array.isArray(l.cargos) ? l.cargos : null;
    if (!cargos) cargos = DE_FABRICA.map(function (c) { return Object.assign({}, c, { ocupantes: [] }); });
    return { cargos: cargos.map(cargoLimpio) };
  }

  async function cargar(gestor) {
    var leido = null;
    try { leido = gestor ? await Carpetas.leerJson(gestor, ARCHIVO) : null; } catch (e) { leido = null; }
    cache = limpio(leido);
    return cache;
  }

  function olvidar() { cache = null; }

  async function guardar(gestor, mutar) {
    var leido = null;
    try { leido = await Carpetas.leerJson(gestor, ARCHIVO); } catch (e) { leido = null; }
    var actual = limpio(leido);
    var nuevo = mutar(actual) || actual;
    await Copias.guardar(gestor, ARCHIVO, nuevo);
    cache = nuevo;
    return nuevo;
  }

  function idNuevo() { return 'cg-' + Date.now() + Math.floor(Math.random() * 1000); }
  function idNuevoOcupante() { return 'oc-' + Date.now() + Math.floor(Math.random() * 1000); }

  function deId(datos, id) {
    return ((datos && datos.cargos) || []).filter(function (c) { return c.id === id; })[0] || null;
  }

  function ordenados(datos) {
    return ((datos && datos.cargos) || []).slice().sort(function (a, b) { return a.orden - b.orden; });
  }

  /* ---------- funciones puras, sobre un cargo ya cargado ----------

     Comparación por texto AAAA-MM-DD, sin objetos Date: las fechas se
     comparan bien así, y evita líos de huso horario. */

  function ocupanteVigenteEn(cargo, fecha) {
    var vigentes = ((cargo && cargo.ocupantes) || []).filter(function (o) {
      return o.desde && o.desde <= fecha && (!o.hasta || fecha <= o.hasta);
    });
    if (!vigentes.length) return null;
    /* Si hay más de uno vigente a la vez (un solape mal resuelto a
       mano), se queda con el de alta más reciente. */
    vigentes.sort(function (a, b) { return a.desde < b.desde ? 1 : -1; });
    return vigentes[0];
  }

  /* { persona, tratamiento, nombre } del ocupante vigente de idCargo
     en esa fecha, o null si no hay ninguno o el cargo no existe. */
  function enFecha(datos, idCargo, fecha) {
    var cargo = deId(datos, idCargo);
    if (!cargo) return null;
    var o = ocupanteVigenteEn(cargo, fecha);
    if (!o) return null;
    return { persona: o.persona, tratamiento: cargo.tratamiento, nombre: cargo.nombre };
  }

  function vigente(datos, idCargo) {
    return enFecha(datos, idCargo, U.hoyIso());
  }

  /* Los pares de ocupantes de un cargo cuyas fechas se pisan. Solo
     para avisar en pantalla: nunca impide guardar. */
  function solapes(cargo) {
    var ocupantes = (cargo && cargo.ocupantes) || [];
    var pares = [];
    for (var i = 0; i < ocupantes.length; i++) {
      for (var j = i + 1; j < ocupantes.length; j++) {
        var a = ocupantes[i], b = ocupantes[j];
        if (!a.desde || !b.desde) continue;
        var finA = a.hasta || '9999-99-99';
        var finB = b.hasta || '9999-99-99';
        if (a.desde <= finB && b.desde <= finA) pares.push([a, b]);
      }
    }
    return pares;
  }

  return {
    ARCHIVO: ARCHIVO, DE_FABRICA: DE_FABRICA,
    cargar: cargar, olvidar: olvidar, guardar: guardar,
    idNuevo: idNuevo, idNuevoOcupante: idNuevoOcupante,
    deId: deId, ordenados: ordenados,
    enFecha: enFecha, vigente: vigente, solapes: solapes
  };
})();
