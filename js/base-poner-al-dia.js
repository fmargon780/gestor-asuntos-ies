/* ============================================================
   base-poner-al-dia.js — la única manera de apuntar en las tablas
   (fila 334, docs/DATOS-2-TABLAS-PARA-INFORMES.md).

   `BasePonerAlDia.ponerAlDia({ claves })` compara lo archivado (el índice del
   ARCHIVO) con lo apuntado en `_GESTOR/base/` y añade lo que falta:
     - cada asunto archivado sin apunte, o con la `marca` distinta (la marca es
       `cerradoEl|tercero`), lee su `_ficha.json` y los hitos del final del
       HISTORIAL DE TRAMITACION y añade su `alta` (si falta alguno de los dos,
       el alta lleva lo que da el índice y `incompleto: true`);
     - cada apuntado que ya no está en el índice, una `baja`.
   Sin `claves`, todo. Se puede repetir sin estropear nada y cortar en
   cualquier momento: lo escrito vale y la siguiente pasada sigue. Escribe en
   tandas de 50 como mucho, cede el paso entre una y otra y espera si hay un
   guardado en marcha. Nunca corre en «solo consultar» ni con perfil directivo.
   La pasada completa deja `base/poniendo-al-dia-<ordenador>.json`; si hay uno
   de otro ordenador de menos de 30 minutos, no arranca.
   ============================================================ */
var BasePonerAlDia = (function () {

  var TANDA = 50;
  var TREINTA_MINUTOS = 30 * 60000;
  var DIEZ_MINUTOS = 10 * 60000;
  var HISTORIAL = 'HISTORIAL DE TRAMITACION.txt';
  var CLAVE_DIA = 'gestor-base-dia';

  var corriendo = false;
  var ultimo = null;   /* { cuando, apuntados } de la última pasada completa de esta sesión */

  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function marcaDe(e) { return (e.cerradoEl || '') + '|' + (e.tercero || ''); }

  /* Cede el paso y, si hay un guardado en marcha, espera (como mucho medio minuto por vez). */
  async function cederPaso() {
    await esperar(0);
    var n = 0;
    while (window.ColaGuardado && ColaGuardado.hayGuardado() && n++ < 30) await esperar(1000);
  }

  async function leerHitos(handle) {
    try {
      var texto = await Carpetas.leerTexto(handle, HISTORIAL);
      return texto ? Hitos.leerHitosDeHistorial(texto) : null;
    } catch (e) { return null; }
  }

  /* El alta de una entrada del índice: su carpeta, su ficha y su historial. */
  async function altaDe(entrada, gente, personasNuevas) {
    var ficha = null, historial = null;
    try {
      var r = await IndiceArchivo.resolverHandle(entrada);
      if (r) {
        ficha = window.FichaArchivo ? await FichaArchivo.leer(r.handle) : null;
        historial = await leerHitos(r.handle);
      }
    } catch (e) { /* se apunta con lo que da el índice */ }
    var filas = BaseFilas.filasDe(ficha || {}, historial ? historial.hitos : [], entrada, { incompleto: !ficha || !historial });
    Object.keys(filas.gente).forEach(function (c) {
      var g = gente[c], nuevo = filas.gente[c];
      if (!g || g.nombre !== nuevo.nombre || g.categoria !== nuevo.categoria) {
        gente[c] = nuevo;
        personasNuevas.push({ v: Base.V, cuando: new Date().toISOString(), codigo: c, categoria: nuevo.categoria, nombre: nuevo.nombre, clase: nuevo.clase });
      }
    });
    return Base.lineaAlta(entrada.nombre, marcaDe(entrada), filas);
  }

  /* ---------- que no se pisen dos ordenadores ---------- */

  function nombreAviso() { return 'poniendo-al-dia-' + Base.ordenador() + '.json'; }

  async function otroTrabajando() {
    try {
      var b = await Base.carpetaBase(false);
      if (!b) return false;
      var c = await Carpetas.contenido(b);
      for (var i = 0; i < c.ficheros.length; i++) {
        var n = c.ficheros[i].nombre;
        if (!/^poniendo-al-dia-.*\.json$/.test(n) || n === nombreAviso()) continue;
        try {
          var o = JSON.parse((await Carpetas.leerTexto(b, n)) || '{}');
          if (o && Date.now() - Date.parse(o.cuando) < TREINTA_MINUTOS) return true;
        } catch (e) { /* roto: no cuenta */ }
      }
    } catch (e) { /* no se puede mirar: se sigue */ }
    return false;
  }

  async function marcarEnMarcha(si) {
    try {
      var b = await Base.carpetaBase(si);
      if (!b) return;
      if (si) await Carpetas.escribirTexto(b, nombreAviso(), JSON.stringify({ cuando: new Date().toISOString() }));
      else await b.removeEntry(nombreAviso());
    } catch (e) { /* nada */ }
  }

  /* ---------- la pasada ---------- */

  async function ponerAlDia(op) {
    op = op || {};
    var completa = !op.claves;
    if (corriendo) return { ok: false, motivo: 'ya-corre' };
    if (Base.soloConsulta()) return { ok: false, motivo: 'solo-consulta' };
    if (!window.App || !App.E || !App.E.gestor || !window.IndiceArchivo) return { ok: false, motivo: 'sin-carpeta' };
    if (completa && await otroTrabajando()) return { ok: false, motivo: 'otro-ordenador' };

    corriendo = true;
    var fin = window.Medidas ? Medidas.tiempo('base.poner-al-dia') : function () {};
    var resultado = { ok: true, apuntados: 0, bajas: 0, total: 0, incompletos: 0 };
    try {
      if (completa) await marcarEnMarcha(true);
      var idx = await IndiceArchivo.leerDisco({ todos: true });
      if (!idx.ok) return { ok: false, motivo: idx.motivo };
      var entradas = idx.datos.asuntos || [];
      var pedidas = op.claves ? op.claves.reduce(function (m, c) { m[c] = true; return m; }, {}) : null;

      var cursos = pedidas ? Object.keys(pedidas).map(function (c) { return Base._cursoDe(c); }).filter(function (c, i, l) { return l.indexOf(c) === i; }) : 'todos';
      var apuntado = await Base.cargar(cursos);
      var enIndice = {};
      entradas.forEach(function (e) { enIndice[e.nombre] = true; });

      var pendientes = entradas.filter(function (e) {
        if (pedidas && !pedidas[e.nombre]) return false;
        var ap = apuntado.porClave[e.nombre];
        if (!ap || ap.que === 'baja') return true;
        if (ap.marca !== marcaDe(e)) return true;
        if (ap.asunto && ap.asunto.incompleto) return !!pedidas && Date.now() - Date.parse(ap.cuando) < DIEZ_MINUTOS;   /* recién archivado: aún pudo no estar escrito el historial */
        return false;
      });
      var bajas = Object.keys(apuntado.porClave).filter(function (c) {
        return apuntado.porClave[c].que === 'alta' && !enIndice[c] && (!pedidas || pedidas[c]);
      });
      resultado.total = entradas.length;
      var hechos = 0, totalTrabajo = pendientes.length + bajas.length;

      for (var i = 0; i < pendientes.length; i += TANDA) {
        await cederPaso();
        if (Base.soloConsulta()) break;
        var tanda = pendientes.slice(i, i + TANDA);
        var porCurso = {}, personasNuevas = [];
        for (var j = 0; j < tanda.length; j++) {
          var alta = await altaDe(tanda[j], apuntado.gente, personasNuevas);
          (porCurso[Base._cursoDe(tanda[j].nombre)] = porCurso[Base._cursoDe(tanda[j].nombre)] || []).push(alta);
          if (alta.asunto.incompleto) resultado.incompletos++;
        }
        await Base.escribirPersonas(personasNuevas);
        await Base.escribir(porCurso);
        hechos += tanda.length;
        resultado.apuntados += tanda.length;
        if (op.alAvanzar) op.alAvanzar(hechos, totalTrabajo);
      }
      if (bajas.length) {
        await cederPaso();
        var porCursoBajas = {};
        bajas.forEach(function (c) { (porCursoBajas[Base._cursoDe(c)] = porCursoBajas[Base._cursoDe(c)] || []).push(Base.lineaBaja(c)); });
        await Base.escribir(porCursoBajas);
        resultado.bajas = bajas.length;
        if (op.alAvanzar) op.alAvanzar(totalTrabajo, totalTrabajo);
      }
      if (completa) {
        ultimo = { cuando: new Date().toISOString(), apuntados: resultado.apuntados };
        if (window.Medidas && Medidas.fotoMas) {
          Medidas.fotoMas({ apuntados: Object.keys(apuntado.porClave).filter(function (c) { return apuntado.porClave[c].que === 'alta' && enIndice[c]; }).length + resultado.apuntados,
            archivados: entradas.length, incompletos: resultado.incompletos });
        }
      }
      return resultado;
    } catch (e) {
      if (window.Medidas) Medidas.cuentaError('accesorio', e);
      return { ok: false, motivo: 'error' };
    } finally {
      corriendo = false;
      try { fin(); } catch (e) { /* nada */ }
      if (completa) await marcarEnMarcha(false);
    }
  }

  /* Cuántos asuntos archivados están apuntados, de cuántos. */
  async function contar() {
    var idx = await IndiceArchivo.leerDisco({ todos: true });
    var entradas = (idx.ok && idx.datos.asuntos) || [];
    var apuntado = await Base.cargar('todos');
    var n = 0, incompletos = 0;
    entradas.forEach(function (e) {
      var ap = apuntado.porClave[e.nombre];
      if (ap && ap.que === 'alta' && ap.marca === marcaDe(e)) { n++; if (ap.asunto && ap.asunto.incompleto) incompletos++; }
    });
    return { apuntados: n, total: entradas.length, incompletos: incompletos, ultimo: ultimo };
  }

  /* ---------- una vez al día, 90 segundos después de entrar ---------- */

  function alEntrar() {
    try {
      if (!window.Base || Base.soloConsulta() || (window.Perfil && Perfil.esDirectivo && Perfil.esDirectivo())) return;
      var hoy = U.hoyIso();
      try { if (window.localStorage.getItem(CLAVE_DIA) === hoy) return; } catch (e) { /* sin memoria: se hace */ }
      setTimeout(function () {
        ponerAlDia().then(function (r) {
          if (r && r.ok) { try { window.localStorage.setItem(CLAVE_DIA, hoy); } catch (e) { /* nada */ } }
        }, function () {});
      }, 90000);
    } catch (e) { /* nada */ }
  }
  var yaEntro = false;
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(function () { if (!yaEntro) { yaEntro = true; alEntrar(); } });

  return { ponerAlDia: ponerAlDia, contar: contar, marcaDe: marcaDe, estaCorriendo: function () { return corriendo; }, ultimo: function () { return ultimo; } };
})();
window.BasePonerAlDia = BasePonerAlDia;
