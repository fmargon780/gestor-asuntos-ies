/* ============================================================
   solo-si.js — «Cuándo se hace» de un hito y de una tarea de la guía
   (fila 576, docs/576-SOLO-SI-EN-HITOS-Y-TAREAS.md).

   Un hito o una tarea puede llevar `soloSi: { campo, valores: [..] }`: solo
   sale en el asunto si el campo de lista `campo` del asunto vale uno de
   `valores`. Sin `soloSi`, «Siempre». Los campos son los campos de lista del
   tipo de asunto (los mismos que usan los textos condicionales, fila 510).

   En el asunto, para cada condición:
     'sale'  el campo tiene uno de los valores marcados;
     'quita' el campo tiene otro valor: no sale (salvo si ya está hecho);
     'falta' el campo está vacío (o el tipo ya no lo tiene): sale marcado en
             amarillo con «Falta: <campo>».

   Pura salvo `valoresDe` / `marcarTodo`, que leen lo que ya hay en memoria
   (App.E.registro y App.E.campos). Lo que se marca en los hitos (`h.cond`)
   se recalcula en cada lectura de hitos.json y no se guarda.
   ============================================================ */
var SoloSi = (function () {

  /* Fila 701: «Solo si el tercero es de tal clase». Es un dato más que se puede elegir, solo en la guía de un tipo «sin hitos»:
     el «campo» se llama así y sus valores son las clases de tercero del tipo (con el nombre de la lista de Ajustes). */
  var CAMPO_TERCERO = 'Clase del tercero';

  /* Fila 781: «Solo si el alumno es de E.S.O.»: la enseñanza sale sola de la unidad del alumno (la de la ficha del asunto
     o la del Centro de datos). La Diversificación (PMAR) cuenta como E.S.O. */
  var CAMPO_ENSENANZA = 'Enseñanza del alumno';
  var ENSENANZAS = ['E.S.O.', 'Bachillerato', 'Formación Profesional'];
  var ensenanzas = {};   /* clave del asunto -> enseñanza sacada de la unidad que dio el Centro de datos (se rellena en `cargarEnsenanzas`) */

  function ensenanzaDeUnidad(unidad) {
    if (!unidad || !window.Nombres || !Nombres.nivelYEnsenanza) return '';
    var e = Nombres.nivelYEnsenanza(String(unidad)).ensenanza;
    return e === 'PMAR' ? 'E.S.O.' : (e || '');
  }

  function clasesDelTipo(tipo) {
    var t = ((window.App && App.E && App.E.tipos) || []).filter(function (x) { return x.tipo === tipo; })[0];
    if (!t || !window.Nombres) return [];
    return Nombres.categoriasDe(t).map(function (c) { return Nombres.textoCategoria(c, 'lista'); });
  }

  function claseDelAsunto(a, tipo) {
    var cat = (a && a.ficha && a.ficha.categoria) || (a && a.leido && a.leido.categoria) || '';
    if (cat && window.Nombres) return Nombres.textoCategoria(cat, 'lista');
    var clases = clasesDelTipo(tipo);
    return clases.length === 1 ? clases[0] : '';
  }

  function igual(a, b) {
    if (window.TextoCondicional) return TextoCondicional.igual(a, b);
    return String(a === undefined || a === null ? '' : a).trim().toLowerCase() === String(b === undefined || b === null ? '' : b).trim().toLowerCase();
  }

  function claveDe(objeto, nombre) {
    var n = String(nombre || '').trim().toLowerCase();
    return Object.keys(objeto || {}).filter(function (k) { return k.trim().toLowerCase() === n; })[0];
  }

  /* { campo, valores } con al menos un valor, o null («Siempre»). */
  function normalizar(x) {
    if (!x || !String(x.campo || '').trim()) return null;
    var vistos = {}, valores = (Array.isArray(x.valores) ? x.valores : []).map(function (v) { return String(v === undefined || v === null ? '' : v).trim(); })
      .filter(function (v) { if (!v || vistos[v]) return false; vistos[v] = true; return true; });
    if (!valores.length) return null;
    var salida = { campo: String(x.campo).trim(), valores: valores };
    /* `ademas`: otras condiciones que tienen que cumplirse a la vez (solo las deja una guía con preguntas dentro de respuestas de otro campo). */
    var ademas = (Array.isArray(x.ademas) ? x.ademas : []).map(function (y) { return normalizar({ campo: y && y.campo, valores: y && y.valores }); }).filter(Boolean);
    if (ademas.length) salida.ademas = ademas;
    return salida;
  }

  /* Las dos condiciones a la vez (la de arriba y la de dentro), para pasar un hito de dentro de una respuesta a la lista única. */
  function sumar(a, b) {
    a = normalizar(a); b = normalizar(b);
    if (!a) return b;
    if (!b) return a;
    if (igual(a.campo, b.campo) && !a.ademas && !b.ademas) {
      var comunes = a.valores.filter(function (v) { return b.valores.some(function (w) { return igual(v, w); }); });
      return comunes.length ? { campo: a.campo, valores: comunes } : a;
    }
    /* Dos campos distintos: las dos condiciones a la vez. */
    return normalizar({ campo: a.campo, valores: a.valores, ademas: (a.ademas || []).concat([{ campo: b.campo, valores: b.valores }], b.ademas || []) });
  }

  /* 'sale' | 'quita' | 'falta'. `v`: { campos: nombre -> valor, camposLista: nombre -> opciones }. */
  function estado(c, v) { return detalle(c, v).estado; }

  /* { estado, campo }: además, el nombre del campo que falta (el primero) si el estado es 'falta'. */
  function detalle(c, v) {
    c = normalizar(c);
    if (!c) return { estado: 'sale', campo: '' };
    var todas = [{ campo: c.campo, valores: c.valores }].concat(c.ademas || []);
    var falta = '';
    for (var i = 0; i < todas.length; i++) {
      var e = una(todas[i], v);
      if (e === 'quita') return { estado: 'quita', campo: '' };
      if (e === 'falta' && !falta) falta = todas[i].campo;
    }
    return falta ? { estado: 'falta', campo: falta } : { estado: 'sale', campo: '' };
  }

  function una(c, v) {
    v = v || {};
    var nombre = c.campo;
    if (v.camposLista) {
      var k = claveDe(v.camposLista, c.campo);
      if (k === undefined) return 'falta';
      nombre = k;
    }
    var kc = claveDe(v.campos, nombre);
    var valor = kc === undefined ? '' : String(v.campos[kc] === undefined || v.campos[kc] === null ? '' : v.campos[kc]).trim();
    if (!valor) {
      if (c.campo === CAMPO_ENSENANZA && v.clave) pedirEnsenanza(v.clave);   /* fila 781: la unidad del Centro de datos llega aparte */
      return 'falta';
    }
    return c.valores.some(function (x) { return igual(x, valor); }) ? 'sale' : 'quita';
  }

  /* La frase de la etiqueta amarilla: «Solo si Quién lo pide: Familia o Alumno mayor de edad». */
  function etiqueta(c) {
    c = normalizar(c);
    if (!c) return '';
    if (c.campo === CAMPO_TERCERO && !(c.ademas || []).length) return 'Solo si el tercero es ' + c.valores.join(' o ');   /* fila 701 */
    if (c.campo === CAMPO_ENSENANZA && !(c.ademas || []).length) return 'Solo si el alumno es de ' + c.valores.join(' o ');   /* fila 781 */
    return 'Solo si ' + [c].concat(c.ademas || []).map(function (x) { return x.campo + ': ' + x.valores.join(' o '); }).join(' y ');
  }

  /* La etiqueta amarilla del asunto: «Falta: <campo>». '' si no falta nada. */
  function faltaHTML(campo) {
    return campo ? ' <span class="solo-si-etiqueta" data-solo-si-falta="' + U.escapar(campo) + '">Falta: ' + U.escapar(campo) + '</span>' : '';
  }

  /* ---------- lo que vale en un asunto ---------- */

  function tipoDe(a) {
    if (!a) return '';
    if (window.App && typeof App.tipoDeAsunto === 'function') {
      try { var t = App.tipoDeAsunto(a); if (t) return t; } catch (e) { /* se prueba la ficha */ }
    }
    return (a.ficha && a.ficha.tipo) || (a.leido && a.leido.tipo) || '';
  }

  /* { campos, camposLista } de un asunto { ficha, ... }; null si no hay con qué decidir. */
  function valoresDe(a) {
    if (!a || !window.Campos || !window.App || !App.E || !App.E.campos || !window.TextoCondicional) return null;
    var tipo = tipoDe(a);
    var config = (App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
    var guardados = (a.ficha && a.ficha.campos) || {};
    var campos = {};
    Campos.camposDeAsunto(config, a.ficha).forEach(function (cfg) {
      var g = guardados[Campos.claveDeCampo(cfg)];
      if (g && g.valor) campos[Campos.nombreDeCampo(cfg, App.E.campos)] = String(g.valor);
    });
    var listas = TextoCondicional.listasPorNombre(tipo, a.ficha);
    listas[CAMPO_TERCERO] = clasesDelTipo(tipo);   /* fila 701 */
    var clase = claseDelAsunto(a, tipo);
    if (clase) campos[CAMPO_TERCERO] = clase;
    listas[CAMPO_ENSENANZA] = ENSENANZAS.slice();   /* fila 781 */
    var unidadFicha = a.ficha && typeof a.ficha.grupo === 'string' ? a.ficha.grupo : '';
    var ensenanza = ensenanzaDeUnidad(unidadFicha) || ensenanzas[a.nombre] || '';
    if (ensenanza) campos[CAMPO_ENSENANZA] = ensenanza;
    return { campos: campos, camposLista: listas, clave: a.nombre };
  }

  function asuntoDeClave(clave) {
    var registro = window.App && App.E && App.E.registro;
    var ficha = registro && registro.asuntos && registro.asuntos[clave];
    if (!ficha) return null;
    /* El asunto de la lista (trae `leido`, que usa App.tipoDeAsunto) con la ficha más reciente del registro. */
    var deLista = (window.Gestor && typeof Gestor.asuntos === 'function') ? Gestor.asuntos().filter(function (x) { return x.nombre === clave; })[0] : null;
    return { nombre: clave, ficha: ficha, leido: (deLista && deLista.leido) || {} };
  }

  /* Pone `cond` ('quita' | 'falta') en cada hito de la lista que lleve condición, o se la quita. */
  function marcarLista(hitos, v) {
    (hitos || []).forEach(function (h) {
      if (!h) return;
      var d = h.soloSi ? detalle(h.soloSi, v) : { estado: 'sale', campo: '' };
      if (d.estado === 'sale') delete h.cond; else h.cond = d.estado;
      if (h.faltaCampo !== undefined) delete h.faltaCampo;
      if (d.estado === 'falta') h.faltaCampo = d.campo;
      if (h.clase === 'decision') (h.opciones || []).forEach(function (o) { marcarLista(o.hitos, v); });
    });
  }

  /* Fila 781: un asunto que pide la enseñanza y aún no la sabe (por ejemplo, recién creado) la busca una sola vez
     en el Centro de datos y, al llegar, vuelve a leer los hitos para que se repinte. */
  var pedidas = {};
  async function pedirEnsenanza(clave) {
    if (pedidas[clave] || ensenanzas[clave] || !window.Plantillas || typeof Plantillas.valoresDeAsunto !== 'function') return;
    pedidas[clave] = true;
    var a = asuntoDeClave(clave);
    if (!a) { pedidas[clave] = false; return; }
    try { ensenanzas[clave] = ensenanzaDeUnidad((await Plantillas.valoresDeAsunto(a)).grupo) || ''; } catch (e) { return; }
    if (ensenanzas[clave] && window.Hitos && typeof Hitos.leer === 'function') { try { Hitos.leer(); } catch (e) { /* se verá al volver a entrar */ } }
  }

  function usaEnsenanza(c) {
    c = c || {};
    return c.campo === CAMPO_ENSENANZA || (c.ademas || []).some(function (y) { return y && y.campo === CAMPO_ENSENANZA; });
  }

  /* Fila 781: antes de marcar, la enseñanza de los alumnos de los asuntos que la piden, con la unidad del Centro de
     datos (`Plantillas.valoresDeAsunto(...).grupo`: la de la ficha o, si no, la de este curso o la última). */
  async function cargarEnsenanzas(datos) {
    if (!datos || !datos.porAsunto || !window.Plantillas || typeof Plantillas.valoresDeAsunto !== 'function') return datos;
    var claves = Object.keys(datos.porAsunto);
    for (var i = 0; i < claves.length; i++) {
      var clave = claves[i], entrada = datos.porAsunto[clave], pide = false;
      if (!entrada || ensenanzas[clave]) continue;
      (function ver(ls) { (ls || []).forEach(function (h) { if (h && usaEnsenanza(h.soloSi)) pide = true; if (h && h.clase === 'decision') (h.opciones || []).forEach(function (o) { ver(o.hitos); }); }); })(entrada.hitos);
      if (!pide) continue;
      var a = asuntoDeClave(clave);
      if (!a) continue;
      try { ensenanzas[clave] = ensenanzaDeUnidad((await Plantillas.valoresDeAsunto(a)).grupo) || ''; } catch (e) { /* sin unidad: «Falta» */ }
    }
    return datos;
  }

  /* Tras leer hitos.json: las condiciones de todos los asuntos con lo que dice su ficha ahora. */
  function marcarTodo(datos) {
    if (!datos || !datos.porAsunto) return datos;
    Object.keys(datos.porAsunto).forEach(function (clave) {
      var entrada = datos.porAsunto[clave];
      if (!entrada || !(entrada.hitos || []).length) return;
      entrada.hitos.forEach(function (h) { if (h && h.listaDeTareas) h.claveAsunto = clave; });   /* fila 701: para contar sus tareas con «Solo si» (js/hitos-a-quien.js) */
      var hay = false;
      (function ver(ls) { (ls || []).forEach(function (h) { if (h && h.soloSi) hay = true; if (h && h.clase === 'decision') (h.opciones || []).forEach(function (o) { ver(o.hitos); }); }); })(entrada.hitos);
      if (!hay) return;
      marcarLista(entrada.hitos, valoresDe(asuntoDeClave(clave)));
    });
    return datos;
  }

  function recorrer(hitos, fn) {
    (hitos || []).forEach(function (h) {
      if (!h) return;
      fn(h);
      if (h.clase === 'decision') (h.opciones || []).forEach(function (o) { recorrer(o.hitos, fn); });
    });
  }

  /* Al cambiar el campo, el hito «en curso» puede haberse ido (o no haber ninguno): el escondido vuelve a pendiente y
     el siguiente que sale pasa a en curso. true si ha escrito algo. Solo si algún hito del asunto lleva «Solo si». */
  async function ajustarEnCurso(clave, hitos) {
    if (!window.Hitos || !(hitos || []).length) return false;
    var hay = false, escondido = false;
    recorrer(hitos, function (h) { if (h.soloSi) hay = true; if (h.estado === 'encurso' && h.cond === 'quita') escondido = true; });
    if (!hay) return false;
    var vis = Hitos.visibles(hitos);
    var sinHacer = vis.filter(function (h) { return h.estado === 'pendiente' || h.estado === 'encurso'; });
    /* El en curso es siempre el primero sin hacer de los que salen: si vuelve uno de más arriba, pasa a ser él. */
    var desordenado = !!sinHacer[0] && sinHacer[0].estado !== 'encurso' && !sinHacer.some(function (h) { return h.estado === 'encurso' && h.cadena; });
    if (!escondido && !desordenado) return false;
    var nuevo = null;
    await Hitos.cambiar(function (d) {
      var e = d.porAsunto[clave];
      if (!e) return d;
      recorrer(e.hitos, function (h) { if (h.estado === 'encurso' && (h.cond === 'quita' || desordenado)) { h.estado = 'pendiente'; delete h.desde; } });
      nuevo = Hitos.recomputeEnCurso(e.hitos);
      return d;
    });
    if (nuevo) await Hitos.aplicarEstadoDelHito(clave, nuevo);
    return true;
  }

  /* ¿Este hito o esta tarea no sale ahora? (ya hecho, siempre sale) */
  function fuera(x) { return !!x && x.cond === 'quita' && x.estado !== 'hecho'; }

  return {
    CAMPO_TERCERO: CAMPO_TERCERO, clasesDelTipo: clasesDelTipo, CAMPO_ENSENANZA: CAMPO_ENSENANZA, ENSENANZAS: ENSENANZAS, ensenanzaDeUnidad: ensenanzaDeUnidad, cargarEnsenanzas: cargarEnsenanzas,
    normalizar: normalizar, sumar: sumar, estado: estado, detalle: detalle, etiqueta: etiqueta, igual: igual, faltaHTML: faltaHTML,
    tipoDe: tipoDe, valoresDe: valoresDe, asuntoDeClave: asuntoDeClave, marcarLista: marcarLista, marcarTodo: marcarTodo, fuera: fuera, ajustarEnCurso: ajustarEnCurso, recorrer: recorrer
  };
})();
window.SoloSi = SoloSi;
