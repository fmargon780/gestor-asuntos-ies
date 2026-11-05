/* ============================================================
   datos-de-plantilla.js — la lista de datos que usa una plantilla, cada
   uno con su valor en este asunto o marcado como «falta» (fila 530,
   docs/530-DATOS-EN-EL-ASUNTO.md, punto 3).

   Se saca con la misma función que rellena los huecos (`Plantillas.rellenar`,
   con su `faltan`) y con la decisión de los textos condicionales
   (`TextoCondicional.decidir`), así que lo que esta lista llama «falta» es
   exactamente lo que saldría en amarillo al generar. Un dato por nombre,
   en el orden en que aparece en la plantilla:

     datosDeTextos(textos, valores, a) → [{ nombre, valor, falta, info }]
     datosDeLaPlantilla(a, plantilla, clase, hito) → lo mismo, con los textos
       de la plantilla (la de correo: asunto y texto; la de Word: el texto de
       su documento) y los valores del asunto.

   Las marcas que no son un dato (`{{LO QUE FALTA}}`, `{{MEMBRETE}}`,
   `{hecho:…}`, `{DATO …}`, `{TABLA …}`, `{HITO}`…) no entran.
   ============================================================ */
var DatosDePlantilla = (function () {

  var IGNORAR = /^(lo que falta|membrete|hito|plazo del hito|hiton|hitosm|hecho\s*:|dato\s|tabla\s|actividad|formularios)/i;
  var cacheWord = {};

  function norm(t) { return U.normalizar(String(t === undefined || t === null ? '' : t).trim()); }

  /* Las marcas de un texto: [{ marca, clave, esSi, campo }], sin repetir. */
  function marcasDe(texto) {
    var t = String(texto || ''), salida = [], vistas = {};
    function anadir(m) { var k = norm(m.marca); if (!vistas[k]) { vistas[k] = true; salida.push(m); } }
    t = t.replace(/\{si:\s*([^=}]*?)\s*=\s*([^}]*?)\s*\}/gi, function (todo, campo) { anadir({ marca: todo, esSi: true, campo: campo }); return ' '; });
    t = t.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, function (todo, clave) { if (!IGNORAR.test(clave.trim())) anadir({ marca: todo, clave: clave }); return ' '; });
    t.replace(/\{([^{}]+)\}/g, function (todo, clave) { if (!IGNORAR.test(clave.trim())) anadir({ marca: todo, clave: clave }); return todo; });
    return salida;
  }

  /* Los datos de un texto con los valores de un asunto. */
  function datosDeTexto(texto, valores, a) {
    var datos = [];
    marcasDe(texto).forEach(function (m) {
      var nombre, valor = '', falta = false;
      if (m.esSi) {
        nombre = m.campo.trim();
        var clave = Object.keys((valores && valores.campos) || {}).filter(function (k) { return norm(k) === norm(nombre); })[0];
        valor = clave === undefined ? '' : String(valores.campos[clave] || '');
        falta = !valor.trim();
      } else {
        var r = Plantillas.rellenar(m.marca, valores);
        if (r.faltan.length) { falta = true; nombre = r.faltan[0]; }
        else if (r.texto === m.marca) return;   /* ni se reconoce ni falta: no es un dato */
        else if (!String(r.texto).trim()) return;   /* un hueco que sale vacío a propósito */
        else { nombre = m.clave.replace(/^campo\s*:\s*/i, '').trim(); valor = r.texto; }
      }
      if (!nombre || datos.some(function (d) { return norm(d.nombre) === norm(nombre); })) return;
      datos.push({ nombre: nombre, valor: valor, falta: falta, info: DatosDelAsunto.infoDe(nombre, a, valores) });
    });
    return datos;
  }

  function datosDeTextos(textos, valores, a) {
    var todos = [];
    (textos || []).forEach(function (t) {
      datosDeTexto(t, valores, a).forEach(function (d) {
        var ya = todos.filter(function (x) { return norm(x.nombre) === norm(d.nombre); })[0];
        if (!ya) todos.push(d);
        else if (d.falta) ya.falta = true;
      });
    });
    return todos;
  }

  /* El texto de un Word: un párrafo por línea (las marcas partidas en varios trozos de texto salen enteras). */
  function textoDeXml(xml) {
    var plano = String(xml || '').replace(/<\/w:p>/g, '\n').replace(/<w:tab\/>/g, ' ').replace(/<[^>]+>/g, '');
    return Docx.interno.decodificarEntidades(plano);
  }

  async function textoDeWord(p) {
    var k = (p.id || '') + '|' + (p.fichero || '');
    if (cacheWord[k]) return cacheWord[k];
    var carpeta = await Carpetas.crear(App.E.gestor, 'PLANTILLAS');
    var h = await carpeta.getFileHandle(p.fichero);
    var buffer = await (await h.getFile()).arrayBuffer();
    var texto = textoDeXml(await Docx.leerEntradaDeTexto(buffer, 'word/document.xml'));
    cacheWord[k] = texto;
    return texto;
  }

  function olvidar() { cacheWord = {}; }

  /* Los datos de una plantilla de correo (`clase` 'lista') o de documento (`clase` 'documentos') para este asunto. */
  async function datosDeLaPlantilla(a, p, clase, hito, via) {
    var textos = [];
    if (clase === 'documentos') textos.push(await textoDeWord(p));
    else {
      textos.push(p.asunto || '');
      textos.push(via === 'seneca' && String(p.textoSeneca || '').trim() ? p.textoSeneca : (p.texto || ''));
    }
    var valores = await Plantillas.valoresDeAsunto(a, { hito: hito || null, plantilla: clase === 'documentos' ? p : undefined, conLoQueFalta: false });
    return { datos: datosDeTextos(textos, valores, a), valores: valores };
  }

  return { marcasDe: marcasDe, datosDeTexto: datosDeTexto, datosDeTextos: datosDeTextos, datosDeLaPlantilla: datosDeLaPlantilla,
    textoDeXml: textoDeXml, olvidar: olvidar };
})();
window.DatosDePlantilla = DatosDePlantilla;
