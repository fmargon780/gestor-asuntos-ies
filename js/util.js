/* ============================================================
   util.js — piezas sueltas que usa todo lo demás.
   ============================================================ */
var U = (function () {

  /* Quita tildes, sobra de espacios y mayúsculas. Sirve para comparar y buscar. */
  function normalizar(v) {
    return String(v === null || v === undefined ? '' : v)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim().toLowerCase();
  }

  /* Windows no admite estos caracteres en el nombre de una carpeta.
     Tampoco se puede terminar en punto ni en espacio. */
  function limpiarNombre(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[. ]+$/, '')
      .trim();
  }

  /* Fecha de hoy en formato AAAA-MM-DD, que es el que entiende el campo de fecha. */
  function hoyIso() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dd;
  }

  /* AAAA-MM-DD  ->  AAMMDD, que es como empiezan los nombres de las carpetas. */
  function aAaMmDd(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    return p[0].slice(2) + p[1] + p[2];
  }

  /* AAMMDD -> texto legible. */
  function fechaLegible(aammdd) {
    if (!/^\d{6}$/.test(aammdd)) return '';
    return aammdd.slice(4, 6) + '/' + aammdd.slice(2, 4) + '/20' + aammdd.slice(0, 2);
  }

  /* El año académico que toca hoy. De septiembre a diciembre, el que empieza. */
  function cursoActual() {
    var d = new Date();
    var a = d.getFullYear() % 100;
    if (d.getMonth() + 1 < 9) a = a - 1;
    var b = (a + 1) % 100;
    return String(a).padStart(2, '0') + '-' + String(b).padStart(2, '0');
  }

  function ahora() {
    return new Date().toISOString();
  }

  /* El año en que empieza un curso -> el curso académico.
     Séneca escribe 2026 en la columna "Año de la matrícula", y eso es
     el curso 26-27. */
  function cursoDeAno(ano) {
    var a = parseInt(ano, 10);
    if (!a) return '';
    var b = (a + 1) % 100;
    return String(a % 100).padStart(2, '0') + '-' + String(b).padStart(2, '0');
  }

  /* Una fecha de Séneca (DD/MM/AAAA) pasada a Date. Devuelve null si no
     se entiende o si viene vacía. */
  function aFecha(texto) {
    var t = String(texto || '').trim();
    var esp = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    var iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (esp) return new Date(+esp[3], +esp[2] - 1, +esp[1]);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    return null;
  }

  /* True si esa fecha ya pasó. El mismo día todavía no ha pasado: quien
     cesa hoy sigue estando hoy en el centro. */
  function yaPaso(texto) {
    var f = aFecha(texto);
    if (!f) return false;
    var hoy = new Date();
    hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return f.getTime() < hoy.getTime();
  }

  /* La edad que tiene hoy alguien nacido en esa fecha.
     Séneca escribe DD/MM/AAAA. Se admite también AAAA-MM-DD. */
  function edadDesde(fecha) {
    var t = String(fecha || '').trim();
    var d, m, a;
    var esp = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    var iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (esp) { d = +esp[1]; m = +esp[2]; a = +esp[3]; }
    else if (iso) { a = +iso[1]; m = +iso[2]; d = +iso[3]; }
    else return '';
    var hoy = new Date();
    var edad = hoy.getFullYear() - a;
    var mesHoy = hoy.getMonth() + 1;
    if (mesHoy < m || (mesHoy === m && hoy.getDate() < d)) edad--;
    if (edad < 0 || edad > 120) return '';
    return edad;
  }

  /* Avisos flotantes de la esquina. Nunca detienen nada. */
  function aviso(texto, clase) {
    var caja = document.getElementById('mensajes');
    var d = document.createElement('div');
    d.className = 'mensaje' + (clase ? ' ' + clase : '');
    d.textContent = texto;
    caja.appendChild(d);
    setTimeout(function () { d.remove(); }, clase === 'malo' ? 9000 : 4500);
  }

  /* Cuadro de confirmación. Devuelve una promesa con true o false.
     Con 'sinCancelar' a true se esconde el botón de Cancelar, para los
     cuadros que solo enseñan algo. */
  function preguntar(titulo, cuerpoHtml, textoAceptar, sinCancelar) {
    return new Promise(function (resolver) {
      var capa = document.getElementById('capa');
      document.getElementById('cuadro-titulo').textContent = titulo;
      document.getElementById('cuadro-cuerpo').innerHTML = cuerpoHtml;
      var aceptar = document.getElementById('cuadro-aceptar');
      var cancelar = document.getElementById('cuadro-cancelar');
      aceptar.textContent = textoAceptar || 'Aceptar';
      cancelar.classList.toggle('oculto', !!sinCancelar);
      capa.classList.remove('oculto');

      function cerrar(valor) {
        capa.classList.add('oculto');
        aceptar.onclick = null;
        cancelar.onclick = null;
        resolver(valor);
      }
      aceptar.onclick = function () { cerrar(true); };
      cancelar.onclick = function () { cerrar(false); };
    });
  }

  function escapar(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    normalizar: normalizar, limpiarNombre: limpiarNombre, hoyIso: hoyIso,
    aAaMmDd: aAaMmDd, fechaLegible: fechaLegible, cursoActual: cursoActual,
    cursoDeAno: cursoDeAno, edadDesde: edadDesde,
    aFecha: aFecha, yaPaso: yaPaso,
    ahora: ahora, aviso: aviso, preguntar: preguntar, escapar: escapar
  };
})();
