/* ============================================================
   medidas-enviar.js — la foto del día y el envío de las medidas al buzón
   de soporte (fila 332, docs/DATOS-1-MEDIDAS.md, apartado 3).

   - 30 segundos después de entrar, una sola vez por sesión: `Medidas.foto`
     con los recuentos (asuntos abiertos, sueltos, con hitos, tipos) y el
     entorno (protocolo, versión, solo consultar, perfil, núcleos, memoria,
     ChromeOS, scripts). Solo números y palabras fijas: nunca un nombre.
   - 60 segundos después de entrar, después cada hora y al volver la
     conexión (`online`): primero los días pasados sin confirmar, de uno en
     uno; después el de hoy, como mucho cada tres horas (el buzón sustituye
     el mismo día y ordenador).
   - Confirmado es que la respuesta traiga `ok: true` y `medidas: true`; solo
     entonces se borra ese día pasado. El buzón de hoy puede no entender las
     medidas: contesta otra cosa y todo se queda guardado para la siguiente
     pasada. NUNCA se enseña nada en pantalla por esto.
   - No se envía en la copia de pruebas (?demo=1) ni bajo un navegador
     manejado por un programa (navigator.webdriver), salvo que la dirección
     lleve `medidas=1` (el mismo criterio que js/soporte-cargar.js).
   La dirección del buzón es la de js/soporte-cargar.js (`SoporteCargar.buzon`).
   ============================================================ */
var MedidasEnviar = (function () {

  var CLAVE_ENVIO = 'gestor-medidas-envio';
  var REPO = 'fmargon780/gestor-asuntos-ies';
  var LIMITE_CUERPO = 60000;
  var TRES_HORAS_MS = 3 * 3600000;
  var UNA_HORA_MS = 3600000;

  var enviando = false;
  var yaEntro = false;

  function sePuedeEnviar() {
    if (/(^|[?&])medidas=1(&|$)/.test(location.search)) return true;
    if (/(^|[?&])demo=1(&|$)/.test(location.search)) return false;
    return !(navigator && navigator.webdriver);
  }

  /* Lo último enviado: { ultimoConfirmado: ISO, hoyEnviado: ISO }. */
  function estado() {
    try { var o = JSON.parse(window.localStorage.getItem(CLAVE_ENVIO) || 'null'); if (o && typeof o === 'object') return o; } catch (e) { /* nada */ }
    return {};
  }
  function guardarEstado(o) { try { window.localStorage.setItem(CLAVE_ENVIO, JSON.stringify(o)); } catch (e) { /* nada */ } }

  /* ---------- la foto ---------- */

  async function tomarFoto() {
    try {
      if (!window.Medidas || !window.App || !App.E || !App.E.registro) return;
      if (window.ColaGuardado && ColaGuardado.hayGuardado()) { setTimeout(tomarFoto, 5000); return; }
      var f = {
        abiertos: Object.keys((App.E.registro && App.E.registro.asuntos) || {}).length,
        sueltos: (App.E.sueltos || []).length,
        tipos: (App.E.tipos || []).length
      };
      try { if (window.Hitos && Hitos.leer) f.conHitos = Object.keys(((await Hitos.leer()) || {}).porAsunto || {}).length; } catch (e) { /* sin hitos */ }
      var ua = String(navigator.userAgent || '');
      f.entorno = {
        protocolo: location.protocol === 'file:' ? 'file' : 'https',
        version: String((App && App.VERSION) || ''),
        soloConsulta: !!(window.SoloConsulta && SoloConsulta.activo()),
        perfil: (window.Perfil && Perfil.esDirectivo && Perfil.esDirectivo()) ? 'directivo' : 'administracion',
        nucleos: navigator.hardwareConcurrency || 0,
        memoria: navigator.deviceMemory || 0,
        cros: /\bCrOS\b/.test(ua),
        guiones: document.getElementsByTagName('script').length
      };
      Medidas.foto(f);
    } catch (e) { /* medir nunca da error */ }
  }

  /* ---------- el cuerpo ---------- */

  function cuerpoDe(dia, datos) {
    var medidas = { tiempos: datos.tiempos || {}, cuentas: datos.cuentas || {}, pesos: datos.pesos || {}, foto: datos.foto || {} };
    var base = { tipo: 'medidas', repo: REPO, version: String((window.App && App.VERSION) || ''), dia: dia,
      ordenador: (window.U && U.ordenador) ? U.ordenador() : '', medidas: medidas };
    var texto = JSON.stringify(base);
    if (texto.length > LIMITE_CUERPO) {   /* con la lista fija de rótulos no puede pasar: se manda lo importante */
      base.medidas = { tiempos: medidas.tiempos, foto: medidas.foto };
      texto = JSON.stringify(base);
    }
    return texto;
  }

  /* true si el buzón confirma ese día. Nunca lanza. */
  async function enviarDia(dia) {
    try {
      var buzon = window.SoporteCargar && SoporteCargar.buzon;
      if (!buzon) return false;
      var r = await fetch(buzon, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: cuerpoDe(dia, Medidas.leerDia(dia)) });
      var j = await r.json();
      return !!(j && j.ok === true && j.medidas === true);
    } catch (e) { return false; }
  }

  /* Una pasada: los días pasados sin confirmar, de uno en uno, y después el de hoy (como mucho cada tres horas). */
  async function pasada() {
    if (enviando || !window.Medidas || !sePuedeEnviar()) return;
    enviando = true;
    try {
      var hoy = Medidas.hoy();
      var dias = Medidas.diasGuardados();
      for (var i = 0; i < dias.length; i++) {
        if (dias[i] >= hoy) continue;
        if (await enviarDia(dias[i])) {
          Medidas.borrarDia(dias[i]);
          var e1 = estado(); e1.ultimoConfirmado = new Date().toISOString(); guardarEstado(e1);
        }
      }
      var e = estado();
      if (!e.hoyEnviado || Date.now() - new Date(e.hoyEnviado).getTime() >= TRES_HORAS_MS) {
        e.hoyEnviado = new Date().toISOString();
        guardarEstado(e);
        if (await enviarDia(hoy)) { var e2 = estado(); e2.ultimoConfirmado = new Date().toISOString(); guardarEstado(e2); }
      }
    } catch (x) { /* a la siguiente pasada */ }
    enviando = false;
  }

  /* ---------- cuándo ---------- */

  function alEntrar() {
    if (yaEntro || !window.App || !App.E || !App.E.registro) return;
    yaEntro = true;
    setTimeout(tomarFoto, 30000);
    setTimeout(pasada, 60000);
    setInterval(pasada, UNA_HORA_MS);
    window.addEventListener('online', pasada);
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return { pasada: pasada, tomarFoto: tomarFoto, estado: estado, cuerpoDe: cuerpoDe, sePuedeEnviar: sePuedeEnviar, CLAVE_ENVIO: CLAVE_ENVIO };
})();
window.MedidasEnviar = MedidasEnviar;
