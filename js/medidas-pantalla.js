/* ============================================================
   medidas-pantalla.js — la tarjeta «Medidas» de Herramientas → Puesta a
   punto y reparaciones (fila 332, docs/DATOS-1-MEDIDAS.md, apartado 4).

   Enseña lo apuntado HOY en este ordenador: qué, cuántas veces, lo normal
   (el cubo donde cae la mediana, dicho en llano) y lo peor. Los rótulos
   salen de una tabla fija en castellano (nunca un dato); sin botones.
   Debajo: cuándo se envió por última vez y cuántos días hay guardados sin
   enviar. La tarjeta va plegada y solo se pinta al abrirla.
   ============================================================ */
var MedidasPantalla = (function () {

  var ROTULOS = {
    'entrar.total': 'Entrar', 'entrar.comprobar': 'Entrar: comprobar los ficheros', 'entrar.cargar': 'Entrar: cargar tipos y asuntos',
    'entrar.lista': 'Entrar: pintar Inicio', 'lista.repintar': 'Repintar Inicio', 'asunto.abrir': 'Abrir un asunto',
    'asunto.archivar': 'Archivar', 'asunto.reabrir': 'Reabrir', 'archivo.leer-indice': 'Leer el índice del ARCHIVO',
    'base.poner-al-dia': 'Poner al día las tablas para informes'
  };
  var FICHEROS = { 'otro': 'otros ficheros', 'indice-por-curso': 'los índices del ARCHIVO', 'copia': 'las copias de seguridad',
    'registro-por-año': 'el control del registro', 'presencia': 'la presencia', 'medidas': 'las medidas', 'base': 'la base' };
  var ERRORES = { FicheroRoto: 'fichero roto', LecturaVacia: 'lectura vacía', EsquemaMasNuevo: 'fichero de una versión más nueva',
    CopiaNoVerificada: 'copia sin verificar', AsuntoCerrado: 'asunto ya cerrado', SoloConsulta: 'solo consultar', NotFoundError: 'no se encuentra',
    NotAllowedError: 'sin permiso', NotReadableError: 'no se puede leer', InvalidStateError: 'fichero ocupado', NoModificationAllowedError: 'fichero bloqueado',
    AbortError: 'cortado', QuotaExceededError: 'sin espacio', TypeError: 'error del programa', otro: 'otro' };
  var NORMAL = ['casi al instante', 'menos de medio segundo', 'menos de 1 segundo', 'menos de 3 segundos', 'menos de 10 segundos',
    'menos de 30 segundos', 'más de 30 segundos'];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(t); }

  function fichero(x) {
    if (FICHEROS[x]) return FICHEROS[x];
    var m = /^otro\.(\w+)$/.exec(x);
    return m ? 'otros ficheros .' + m[1] : x;
  }

  /* La palabra en castellano de un rótulo, o el propio rótulo si no se conoce. */
  function rotuloEnLlano(r) {
    if (ROTULOS[r]) return ROTULOS[r];
    var i = r.indexOf(':');
    var clase = i === -1 ? r : r.slice(0, i), resto = i === -1 ? '' : r.slice(i + 1);
    switch (clase) {
      case 'leer': return 'Leer ' + fichero(resto);
      case 'escribir': return 'Escribir ' + fichero(resto) + ' en el disco';
      case 'guardar.espera': return 'Esperar turno para guardar ' + fichero(resto);
      case 'guardar.dura': return 'Guardar ' + fichero(resto) + ', entero';
      case 'reintento': return 'Reintentos al escribir ' + fichero(resto);
      case 'sin-remedio': return 'Cambios que nunca llegaron a guardarse: ' + fichero(resto);
      case 'tarde': return 'Cambios que salieron tarde, en un reintento: ' + fichero(resto);   /* fila 364 */
      case 'conflicto': return 'Copias en conflicto de ' + fichero(resto);
      case 'fallo': return 'Avisos rojos (' + (ERRORES[resto] || resto) + ')';
      case 'accesorio': return 'Avisos ámbar (' + (ERRORES[resto] || resto) + ')';
    }
    return r;
  }

  function segundos(ms) {
    if (ms < 1000) return Math.round(ms) + ' ms';
    return (ms / 1000).toFixed(ms < 10000 ? 1 : 0).replace('.', ',') + ' s';
  }

  /* El cubo donde cae la mediana. */
  function loNormal(t) {
    var mitad = t.n / 2, acumulado = 0;
    for (var i = 0; i < t.cubos.length; i++) { acumulado += t.cubos[i]; if (acumulado >= mitad) return NORMAL[i]; }
    return NORMAL[NORMAL.length - 1];
  }

  function fechaHora(iso) {
    var d = new Date(iso || '');
    if (isNaN(d.getTime())) return '';
    function dos(n) { return (n < 10 ? '0' : '') + n; }
    return d.getDate() + '-' + dos(d.getMonth() + 1) + '-' + d.getFullYear() + ' · ' + dos(d.getHours()) + ':' + dos(d.getMinutes());
  }

  /* Las filas de hoy: tiempos primero (por su rótulo), después los recuentos. */
  function filas() {
    var d = window.Medidas ? Medidas.leerDia(Medidas.hoy()) : { tiempos: {}, cuentas: {} };
    var salida = [];
    Object.keys(d.tiempos || {}).sort().forEach(function (r) {
      var t = d.tiempos[r];
      salida.push({ que: rotuloEnLlano(r), veces: t.n, normal: loNormal(t), peor: segundos(t.max) });
    });
    Object.keys(d.cuentas || {}).sort().forEach(function (r) {
      salida.push({ que: rotuloEnLlano(r), veces: d.cuentas[r], normal: '—', peor: '—' });
    });
    return salida;
  }

  function pintar() {
    var cuerpo = $('medidas-cuerpo');
    if (!cuerpo) return;
    var lista = filas();
    var estado = window.MedidasEnviar ? MedidasEnviar.estado() : {};
    var dias = window.Medidas ? Medidas.diasGuardados().length : 0;
    cuerpo.innerHTML = '<table class="medidas-tabla"><thead><tr><th>Qué</th><th>Veces</th><th>Lo normal</th><th>Lo peor</th></tr></thead><tbody>' +
      (lista.length ? lista.map(function (f) {
        return '<tr><td>' + esc(f.que) + '</td><td>' + f.veces + '</td><td>' + esc(f.normal) + '</td><td>' + esc(f.peor) + '</td></tr>';
      }).join('') : '<tr><td colspan="4" class="suave">Todavía no hay nada apuntado hoy.</td></tr>') + '</tbody></table>' +
      '<p class="suave" id="medidas-envio">' + (estado.ultimoConfirmado ? 'Enviado por última vez: ' + esc(fechaHora(estado.ultimoConfirmado)) : 'Sin enviar todavía') + '</p>' +
      '<p class="suave" id="medidas-dias">Días guardados sin enviar: ' + dias + '</p>';
  }

  function montar() {
    var puesta = $('herramientas-puesta-cuerpo');
    if (!puesta || $('bloque-medidas')) return;
    var det = document.createElement('details');
    det.className = 'bloque-ajustes';
    det.id = 'bloque-medidas';
    det.innerHTML = '<summary><span class="bloque-titulo">Medidas</span><span class="bloque-pie">Cuánto tarda el Gestor en cada cosa, solo con cifras</span></summary>' +
      '<div class="bloque-cuerpo"><p class="explica">El Gestor apunta cuánto tarda cada cosa. Solo cifras: ningún nombre de persona, de asunto ni de documento.</p>' +
      '<div id="medidas-cuerpo"></div></div>';
    puesta.appendChild(det);
    det.addEventListener('toggle', function () { if (det.open) pintar(); });
    /* La pantalla de Herramientas se vuelve a pintar con el bloque ya abierto: no hay «toggle». Mientras se ve, se refresca. */
    setInterval(function () { if (det.open && det.offsetParent !== null) pintar(); }, 2000);
    det.addEventListener('click', function () { setTimeout(function () { if (det.open) pintar(); }, 0); });
  }

  function arrancar() { montar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();

  return { pintar: pintar, filas: filas, rotuloEnLlano: rotuloEnLlano };
})();
window.MedidasPantalla = MedidasPantalla;
