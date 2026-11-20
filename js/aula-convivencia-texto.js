/* ============================================================
   aula-convivencia-texto.js — los huecos {{PRIMER DÍA}}, {{DURACIÓN}} y {{COMENZARÁN}}
   (20-nov-2026, fila 723, docs/723-AULA-CONVIVENCIA-NOTA-Y-SEGUIMIENTO.md).

   Salen de los dos datos del asunto «Primer día» (fecha) y «Días lectivos» (número) del tipo
   «EXPULSIÓN AULA CONVICENCIA». `Plantillas.valoresDeAsunto` llama a `poner(valores)` con lo que lleva ya:
     - primer día: «lunes 9 de noviembre»;
     - duración: «3 días lectivos» o «1 día lectivo»;
     - comenzarán: «comenzarán» o, con 1 día, «comenzará».
   Sin dato, el hueco queda vacío y sale en «Faltan datos» con el nombre del dato.
   ============================================================ */
var AulaConvivenciaTexto = (function () {

  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function dato(campos, nombre) {
    var k = Object.keys(campos || {}).filter(function (x) { return U.normalizar(x) === U.normalizar(nombre); })[0];
    return k ? String(campos[k] || '').trim() : '';
  }

  /* Funciones puras. `texto`: «09/11/2026» (como lo enseña el dato) o «2026-11-09». */
  function primerDia(texto) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto) || /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
    if (!m) return '';
    var iso = m[1].length === 4;
    var d = new Date(+(iso ? m[1] : m[3]), +m[2] - 1, +(iso ? m[3] : m[1]));
    return isNaN(d.getTime()) ? '' : DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()];
  }
  function dias(texto) {
    var n = parseInt(String(texto || '').replace(/[^\d]/g, ''), 10);
    return n >= 1 ? n : 0;
  }
  function duracion(n) { return n ? (n === 1 ? '1 día lectivo' : n + ' días lectivos') : ''; }
  function comenzaran(n) { return n === 1 ? 'comenzará' : 'comenzarán'; }

  function poner(valores) {
    var n = dias(dato(valores.campos, 'Días lectivos'));
    valores['primer día'] = primerDia(dato(valores.campos, 'Primer día'));
    valores['duración'] = duracion(n);
    valores['comenzarán'] = comenzaran(n);
  }

  return { poner: poner, primerDia: primerDia, duracion: duracion, comenzaran: comenzaran, dias: dias };
})();
window.AulaConvivenciaTexto = AulaConvivenciaTexto;
