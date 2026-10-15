/* ============================================================
   plantilla-va-a.js — «Va a:» de una plantilla de correo
   (15-oct-2026, fila 348, docs/CORREO-AL-TUTOR-DEL-GRUPO.md, apartados 4 y 6).

   Cada plantilla de correo dice a quién va: `vaA` = 'familia' | 'tutor' | 'quien-lo-pide'. Al abrir el cuadro de
   Correo con ella, «Para» se rellena solo con eso (js/correo-cuadro.js). Una plantilla sin `vaA` (las de antes de la
   revisión de js/plantilla-va-a-revision.js) se comporta como siempre.

   - selectHTML(id, actual) y leer(id): el desplegable «Va a:» de los dos editores de js/plantillas-ajustes.js.
   - deducir(plantilla): PURA, el «Va a» que le toca a una plantilla que ya existe (apartado 5).
   - sinSaludo(texto) y conSaludoBuenas(texto): PURAS, el saludo de una plantilla que va al tutor o tutora (apartado 6).
   ============================================================ */
var PlantillaVaA = (function () {

  var TEXTOS = { 'familia': 'La familia', 'tutor': 'El tutor o tutora del grupo', 'quien-lo-pide': 'Quien lo pide' };
  var ORDEN = ['familia', 'tutor', 'quien-lo-pide'];
  var SALUDO = 'Buenas:';

  function valido(v) { return ORDEN.indexOf(v) !== -1; }
  function texto(v) { return TEXTOS[v] || ''; }

  function selectHTML(id, actual) {
    return '<label class="etiqueta">Va a:</label>' +
      '<select id="' + id + '" class="campo">' +
      (valido(actual) ? '' : '<option value=""' + (actual ? '' : ' selected') + '>Sin indicar (como hasta ahora)</option>') +
      ORDEN.map(function (v) { return '<option value="' + v + '"' + (v === actual ? ' selected' : '') + '>' + TEXTOS[v] + '</option>'; }).join('') +
      '</select>' +
      '<p class="nota">Al preparar el correo con esta plantilla, «Para» se rellena solo con esto y con nada más.</p>';
  }

  function leer(id) {
    var s = document.getElementById(id);
    return s && valido(s.value) ? s.value : '';
  }

  /* PURA. Su nombre habla del tutor o tutora (sin ser de «tutores legales») → el tutor; sin tipo de asunto (los avisos a quien lo
     pidió) → quien lo pide; el resto, hoy, escribe a la familia. */
  function deducir(p) {
    var nombre = U.normalizar(String((p && p.nombre) || ''));
    if (/tutor\/a|\btutora?\b/.test(nombre) && !/tutores legales/.test(nombre)) return 'tutor';
    if (p && !p.tipo) return 'quien-lo-pide';
    return 'familia';
  }

  var RE_SALUDO = /^\s*(estimad[oa]s?|querid[oa]s?|apreciad[oa]s?|hola|buenos d[ií]as|buenas tardes|buenas noches|buenas)\b[^\n]*?[:,]/i;

  /* PURA. El texto sin su saludo (hasta los dos puntos o la coma de la primera línea) ni las líneas en blanco que lo seguían. */
  function sinSaludo(t) {
    var s = String(t || '');
    var m = RE_SALUDO.exec(s);
    if (!m || m[0].indexOf('\n') !== -1) return s;
    return s.slice(m[0].length).replace(/^[ \t]*\r?\n+/, '').replace(/^[ \t]+/, '');
  }

  /* PURA. El mismo texto con «Buenas:» donde estaba su saludo; si no tenía, igual. */
  function conSaludoBuenas(t) {
    var s = String(t || '');
    var m = RE_SALUDO.exec(s);
    if (!m || m[0].indexOf('\n') !== -1) return s;
    return SALUDO + s.slice(m[0].length);
  }

  return { TEXTOS: TEXTOS, ORDEN: ORDEN, SALUDO: SALUDO, valido: valido, texto: texto, selectHTML: selectHTML, leer: leer,
           deducir: deducir, sinSaludo: sinSaludo, conSaludoBuenas: conSaludoBuenas };
})();
window.PlantillaVaA = PlantillaVaA;
