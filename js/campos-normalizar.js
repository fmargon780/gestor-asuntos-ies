/* ============================================================
   campos-normalizar.js — las constantes y cómo se normaliza lo leído de campos.json (fila 536: trozo de js/campos.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/campos.js.
   ============================================================ */
var CamposNucleo = CamposNucleo || {};
(function () {

  var I = CamposNucleo;
  var FICHERO = 'campos.json';

  /* ---------- leer y normalizar ---------- */

  function normalizarPropio(p) {
    return {
      id: String((p && p.id) || ''),
      nombre: String((p && p.nombre) || ''),
      clase: (p && window.CamposClases && CamposClases.esValida(p.clase)) ? p.clase : ((p && p.clase === 'lista') ? 'lista' : 'texto'),   /* fila 244: cinco clases */
      valores: (p && Array.isArray(p.valores)) ? p.valores.map(String).filter(Boolean) : [],
      grupo: (p && ['Persona', 'Tutores', 'Asunto', 'Centro', 'Firmantes'].indexOf(p.grupo) !== -1) ? p.grupo : 'Asunto'   /* fila 528: el grupo de la lista de campos */
    };
  }

  /* Los campos calculados que crea Francisco (fila 56, 18-sep-2026,
     docs/CAMPOS-CATALOGO-Y-CALCULADOS.md), hermanos de los propios:
     la receta que evalúa `js/campos-calculo.js` (`Calculo.evaluar`).
     Se descartan las que no traigan id, nombre u operación conocida
     (`Calculo.OPERACIONES`), y las repetidas por id (se queda la
     primera: protege el alta del "curso" de fábrica contra una
     carrera de dos sesiones leyendo a la vez, ver `leer()`). */
  function normalizarCalculado(c) {
    return {
      id: String((c && c.id) || ''),
      nombre: String((c && c.nombre) || ''),
      categorias: (c && Array.isArray(c.categorias)) ? c.categorias.filter(Boolean) : [],
      origen: (c && c.origen && typeof c.origen === 'object') ? c.origen : null,
      operacion: String((c && c.operacion) || ''),
      parametros: (c && c.parametros && typeof c.parametros === 'object') ? c.parametros : {}
    };
  }

  function normalizarListaCalculados(lista) {
    var vistos = {};
    return (Array.isArray(lista) ? lista : [])
      .map(normalizarCalculado)
      .filter(function (c) {
        if (!c.id || !c.nombre || !c.origen || !(window.Calculo && Calculo.OPERACIONES[c.operacion])) return false;
        if (vistos[c.id]) return false;
        vistos[c.id] = true;
        return true;
      });
  }

  function normalizarCampoDeTipo(c) {
    var origen = (c && c.origen) || '';
    var salida = { origen: origen };
    if (origen === 'fichero') salida.columna = String((c && c.columna) || '');
    else salida.id = String((c && c.id) || '');
    /* Fila 255: `hito` (opcional) es el `id` del paso de la guía al que pertenece el campo. */
    var hito = String((c && c.hito) || '');
    if (hito) salida.hito = hito;
    salida.obligatorio = !!(c && c.obligatorio) && !hito;   /* un campo de un hito no se pide al crear */
    salida.enNombre = !!(c && c.enNombre);
    return salida;
  }

  function normalizarCampoDeDocumento(c) {
    var clase = (c && (c.clase === 'lista' || c.clase === 'fecha' || c.clase === 'persona')) ? c.clase : 'texto';
    var salida = {
      id: String((c && c.id) || '') || U.nuevoId('d'),
      nombre: String((c && c.nombre) || '').trim(),
      clase: clase,
      valores: (clase === 'lista' && c && Array.isArray(c.valores))
        ? c.valores.map(function (v) { return String(v).trim(); }).filter(Boolean) : [],
      obligatorio: !!(c && c.obligatorio)
    };
    /* Fila 435: «Persona de las listas» guarda en qué categorías de terceros busca. */
    if (clase === 'persona') {
      var validas = (window.Nombres && Nombres.CATEGORIAS) || null;
      var vistas = {};
      salida.listas = ((c && Array.isArray(c.listas)) ? c.listas : []).filter(function (k) {
        if (typeof k !== 'string' || vistas[k] || (validas && validas.indexOf(k) === -1)) return false;
        vistas[k] = true;
        return true;
      });
    }
    return salida;
  }

  function normalizarListaDeDocumento(lista) {
    return (Array.isArray(lista) ? lista : []).map(normalizarCampoDeDocumento)
      .filter(function (c) { return c.nombre; });
  }

  function normalizar(leido) {
    var c = leido || {};
    var propios = (Array.isArray(c.propios) ? c.propios : [])
      .map(normalizarPropio)
      .filter(function (p) { return p.id && p.nombre; });

    var calculados = normalizarListaCalculados(c.calculados);

    var porTipo = {};
    var origen = (c.porTipo && typeof c.porTipo === 'object') ? c.porTipo : {};
    Object.keys(origen).forEach(function (tipo) {
      var lista = Array.isArray(origen[tipo]) ? origen[tipo] : [];
      porTipo[tipo] = lista.map(normalizarCampoDeTipo).filter(function (x) {
        return x.origen === 'fichero' ? !!x.columna : !!x.id;
      });
    });

    var salida = { propios: propios, calculados: calculados, porTipo: porTipo };

    /* Fila 96: solo si hay alguno, para no cambiar la forma del
       fichero de nadie que no lo use. */
    var origenDoc = (c.porTipoDocumento && typeof c.porTipoDocumento === 'object') ? c.porTipoDocumento : {};
    var porTipoDocumento = {};
    Object.keys(origenDoc).forEach(function (tipoDoc) {
      var lista = normalizarListaDeDocumento(origenDoc[tipoDoc]);
      if (lista.length) porTipoDocumento[tipoDoc] = lista;
    });
    if (Object.keys(porTipoDocumento).length) salida.porTipoDocumento = porTipoDocumento;

    /* Fila 201 (docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md, apartado 1): el
       «Texto por defecto» de un tipo de documento, con los mismos
       huecos que una plantilla ({nombre}, {curso}, {grupo}, {tipo},
       {campo:...}…). Solo se propone cuando el hito no trae ya el suyo
       propio (ver js/documentos-formulario.js). Solo si hay alguno,
       como `porTipoDocumento`. */
    var origenTextoDoc = (c.textoPorTipoDocumento && typeof c.textoPorTipoDocumento === 'object') ? c.textoPorTipoDocumento : {};
    var textoPorTipoDocumento = {};
    Object.keys(origenTextoDoc).forEach(function (tipoDoc) {
      var t = String(origenTextoDoc[tipoDoc] || '').trim();
      if (t) textoPorTipoDocumento[tipoDoc] = t;
    });
    if (Object.keys(textoPorTipoDocumento).length) salida.textoPorTipoDocumento = textoPorTipoDocumento;
    return salida;
  }

  /* La receta de fábrica del calculado "curso" (fila 56, 18-sep-2026,
     docs/CAMPOS-CATALOGO-Y-CALCULADOS.md, 7): antes vivía solo en
     `CALCULADOS`, escrita en el código; ahora es una receta más, que
     Francisco ve y puede cambiar. Misma cuenta que hacía
     `calcularCurso` sobre el grupo compacto: por eso `CALCULADOS` se
     deja tal cual, como respaldo (más abajo). */
  var RECETA_CURSO_DE_FABRICA = {
    id: 'curso', nombre: 'Curso', categorias: ['ALUMNADO'],
    origen: { clase: 'grupo' }, operacion: 'quitarFinal', parametros: { n: 1, soloSiEsLetra: true }
  };

  I.FICHERO = FICHERO;
  I.normalizarListaCalculados = normalizarListaCalculados;
  I.normalizarCampoDeTipo = normalizarCampoDeTipo;
  I.normalizarListaDeDocumento = normalizarListaDeDocumento;
  I.normalizar = normalizar;
  I.RECETA_CURSO_DE_FABRICA = RECETA_CURSO_DE_FABRICA;
})();
