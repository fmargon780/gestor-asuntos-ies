/* ============================================================
   correos-a-mano.js — el correo de una persona que la aplicación no
   tenía, escrito a mano al enviarle algo (7-oct-2026, fila 299,
   docs/CORREO-AL-TUTOR-DEL-GRUPO.md, apartado 1.4).

   `_GESTOR/correos-a-mano.json`:
   { _esquema, porClave: { <clave de la persona>: { correo, nombre, quien, cuando } } }
   La clave es el documento de la persona (solo dígitos, como las tablas
   de datos). Hoy solo lo usa el tutor o tutora del grupo
   (js/tutor-del-grupo.js; se escribe desde js/correo-tutor.js al enviar).
   Va por `ColaGuardado`, se relee antes de escribir, se funde por clave
   y entra en las copias diarias (`Copias.FICHEROS`).
   ============================================================ */
var CorreosAMano = (function () {

  var FICHERO = 'correos-a-mano.json';

  function normalizar(leido) {
    var l = (leido && typeof leido === 'object') ? leido : {};
    var por = (l.porClave && typeof l.porClave === 'object' && !Array.isArray(l.porClave)) ? l.porClave : {};
    return { _esquema: Math.max(1, Number(l._esquema) || 0), porClave: por };
  }

  function gestor() { return window.Gestor && Gestor.carpetaGestor ? Gestor.carpetaGestor() : (window.App && App.E && App.E.gestor); }

  /* { clave: { correo, nombre, quien, cuando } } (vacío si no hay fichero). */
  async function leerTodos() {
    var g = gestor();
    if (!g) return {};
    try { return normalizar(await Carpetas.leerJson(g, FICHERO)).porClave; } catch (e) { return {}; }
  }

  /* Guarda (o sustituye) el correo de una persona. */
  async function guardar(clave, correo, nombre) {
    var g = gestor();
    var c = String(correo || '').trim();
    if (!g || !clave || !c) return false;
    var hacer = async function () {
      var leido = null;
      try { leido = await Carpetas.leerJson(g, FICHERO); } catch (e) { leido = null; }
      var actual = normalizar(leido);
      actual.porClave[clave] = { correo: c, nombre: String(nombre || ''), quien: (window.App && App.E && App.E.usuario) || '', cuando: U.hoyIso() };
      await Copias.guardar(g, FICHERO, actual);
    };
    await (window.ColaGuardado ? ColaGuardado.poner(FICHERO, hacer) : hacer());
    return true;
  }

  /* Un conflicto de Dropbox: se funde por clave (si los dos ordenadores tocan la misma, gana la del fichero real). */
  async function fusionarConflicto(g, nombreConflicto) {
    var real, conflicto;
    try {
      real = await Carpetas.leerJson(g, FICHERO);
      conflicto = JSON.parse(await Carpetas.leerTexto(g, nombreConflicto));
    } catch (e) { return false; }
    if (!conflicto || typeof conflicto.porClave !== 'object') return false;
    var fusion = { porClave: Object.assign({}, normalizar(conflicto).porClave, normalizar(real).porClave) };
    var I = window.Conflictos && Conflictos._interno;
    if (I && I.conservarEsquemaMayor) I.conservarEsquemaMayor(fusion, real, conflicto);
    await Copias.guardar(g, FICHERO, fusion);
    if (I && I.archivarConflicto) await I.archivarConflicto(g, nombreConflicto);
    return true;
  }

  return { FICHERO: FICHERO, leerTodos: leerTodos, guardar: guardar, fusionarConflicto: fusionarConflicto, _normalizar: normalizar };
})();
window.CorreosAMano = CorreosAMano;
