/* ============================================================
   documentos-datos.js — los datos de cada documento, en la ficha del
   asunto (30-sep-2026, fila 239, docs/NOMBRES-FIJOS-CON-NUMERO.md,
   apartado 2).

   Con la estructura fija el nombre de un documento nuevo es
   `AAMMDD TIPO D26-01234.ext`: el registro de Séneca, los campos del
   tipo de documento y el texto adicional ya no entran en el nombre. Se
   guardan aquí, en `ficha.documentos[<número de documento>]`:

       { tipo, fecha, registros: [{ ano, sentido, modo, numero, codigo }],
         campos: [valor, …], texto, hito }

   Un mismo documento puede estar en varios asuntos (todas sus copias
   llevan el mismo número), y cada ficha guarda lo suyo. La versión
   sellada y la sin sellar son el mismo documento: mismo número.

   Los documentos de antes, sin número, siguen llevando todo eso en el
   nombre, y se siguen leyendo igual (`Documentos.leerNombre`).
   ============================================================ */
var DocumentosDatos = (function () {

  function de(ficha, numero) {
    return (ficha && ficha.documentos && numero && ficha.documentos[numero]) || null;
  }

  /* Sin la ficha a mano (la mesa del hito, las listas…), los datos se buscan
     por número en todas las fichas del registro: el número es único en todo
     el centro. Se reconstruye solo cuando el registro cambia. */
  var cache = { registro: null, mapa: {} };
  function porNumero(numero) {
    var r = window.App && App.E && App.E.registro;
    if (!r || !numero) return null;
    if (cache.registro !== r) {
      cache = { registro: r, mapa: {} };
      Object.keys(r.asuntos || {}).forEach(function (n) {
        var docs = (r.asuntos[n] || {}).documentos;
        if (docs) Object.keys(docs).forEach(function (k) { if (!cache.mapa[k]) cache.mapa[k] = docs[k]; });
      });
    }
    return cache.mapa[numero] || null;
  }

  /* Funde `datos` en los del documento, dentro de la cola de asuntos.json
     y releyendo antes el disco. `registros`, si viene, sustituye a la lista;
     `anadirRegistro` añade uno sin repetir. */
  function anotar(asuntoNombre, numero, datos) {
    if (!numero || !window.App || !App.guardarRegistroFresco) return Promise.resolve();
    return App.guardarRegistroFresco(async function (registro) {
      await App.comprobarNoCerrado(asuntoNombre);
      var ficha = registro.asuntos[asuntoNombre] || (registro.asuntos[asuntoNombre] = {});
      var todos = ficha.documentos || (ficha.documentos = {});
      var actual = todos[numero] || {};
      var nuevo = Object.assign({}, actual);
      Object.keys(datos || {}).forEach(function (k) {
        if (k === 'anadirRegistro') return;
        nuevo[k] = datos[k];
      });
      if (datos && datos.anadirRegistro) {
        var lista = (nuevo.registros || []).slice();
        var codigo = datos.anadirRegistro.codigo;
        if (!lista.some(function (r) { return r.codigo === codigo; })) lista.push(datos.anadirRegistro);
        nuevo.registros = lista;
      }
      todos[numero] = nuevo;
    });
  }

  /* El registro de Séneca como el que entiende el formulario
     ({ ano, sentido, modo, numero }) más su código de ocho caracteres. */
  function registroDe(r) {
    if (!r) return null;
    return { ano: r.ano, sentido: r.sentido, modo: r.modo, numero: r.numero,
             codigo: Nombres.codigoRegistro(r) };
  }

  /* A lo que lee `Documentos.leerNombre`, añade lo que dice la ficha. */
  function enriquecer(salida, ficha) {
    if (!salida || !salida.numero) return salida;
    var d = de(ficha, salida.numero) || porNumero(salida.numero);
    if (!d) return salida;
    if (d.tipo) salida.tipo = d.tipo;
    if (d.fecha) salida.fecha = d.fecha;
    var regs = Array.isArray(d.registros) ? d.registros : [];
    salida.registros = regs;
    if (regs.length) salida.registro = { ano: regs[0].ano, sentido: regs[0].sentido, modo: regs[0].modo, numero: regs[0].numero };
    salida.camposDelDocumento = Array.isArray(d.campos) ? d.campos : [];
    salida.valoresDeCampos = (d.valores && typeof d.valores === 'object') ? d.valores : null;
    salida.curso = d.texto || '';
    return salida;
  }

  /* Los datos de un documento por su nombre de fichero, o null. */
  function deFichero(ficha, nombre) {
    var n = window.Numeros ? Numeros.delNombreDeDocumento(nombre) : '';
    return de(ficha, n);
  }

  /* Una línea para la fila del documento: «Registro 26EM0123 · campos · texto». */
  function resumen(d) {
    if (!d) return '';
    var partes = [];
    (d.registros || []).forEach(function (r) { if (r.codigo) partes.push('Registro ' + r.codigo); });
    (d.campos || []).forEach(function (c) { if (c) partes.push(c); });
    if (d.texto) partes.push(d.texto);
    return partes.join(' · ');
  }

  /* Fila 436 (tema 390, docs/DOCUMENTOS-CON-PERSONA-Y-LINEA-DE-DATOS.md, parte B): la línea de
     datos que va bajo el nombre del documento en TODAS las listas de documentos de un asunto.
     «Registro 26EM0123 · Candidato: Garrido Mérida, Francisco Manuel · Alumno: Amortegui, Nicolás · texto».
     Cada campo anotado dice cuál es («Nombre del campo: valor»); el nombre sale de los campos del
     tipo de documento y, si el campo ya no existe, se enseña solo el valor. Un documento de una
     candidatura lleva «Candidato: …» aunque no tenga campos. `opciones.soloCampos` quita el registro
     y el texto adicional (la mesa del hito ya tiene su columna de registro). */
  function camposConNombre(d) {
    var defs = window.DocCampos && d.tipo ? DocCampos.campos(d.tipo) : [];
    var texto = function (v) { return window.DocCampos ? DocCampos.textoDe(v) : String(v == null ? '' : v).trim(); };
    var partes = [];
    var conNombre = function (def, v) {
      var t = texto(v);
      if (t) partes.push(def && def.nombre ? def.nombre + ': ' + t : t);
    };
    if (d.valores && typeof d.valores === 'object') {
      var vistos = {};
      defs.forEach(function (def) { vistos[def.id] = true; conNombre(def, d.valores[def.id]); });
      Object.keys(d.valores).forEach(function (id) { if (!vistos[id]) conNombre(null, d.valores[id]); });
    } else {
      var emparejar = (d.campos || []).length === defs.length;
      (d.campos || []).forEach(function (c, i) { conNombre(emparejar ? defs[i] : null, c); });
    }
    return partes;
  }

  function linea(a, nombreFichero, opciones) {
    var ficha = a && a.ficha;
    var d = deFichero(ficha, nombreFichero);
    if (!d && window.Numeros) d = porNumero(Numeros.delNombreDeDocumento(nombreFichero));
    var solo = !!(opciones && opciones.soloCampos);
    var partes = [];
    if (d && !solo) (d.registros || []).forEach(function (r) { if (r.codigo) partes.push('Registro ' + r.codigo); });
    if (window.Candidaturas && Candidaturas.lista) {
      var cand = Candidaturas.lista(a).filter(function (c) { return (c.documentos || []).indexOf(nombreFichero) !== -1; })[0];
      if (cand && cand.persona) partes.push('Candidato: ' + Candidaturas.visible(cand.persona));
    }
    if (d) camposConNombre(d).forEach(function (t) { partes.push(t); });
    if (d && d.texto && !solo) partes.push(d.texto);
    return partes.join(' · ');
  }

  /* El `<div>` de la línea (vacío si no hay nada). Se corta con «…» y el texto entero sale al pasar el ratón. */
  function lineaHTML(a, nombreFichero, opciones, claseExtra) {
    var t = linea(a, nombreFichero, opciones);
    return t ? '<div class="doc-datos ' + (claseExtra || '') + '" title="' + U.escapar(t) + '">' + U.escapar(t) + '</div>' : '';
  }

  return { de: de, anotar: anotar, registroDe: registroDe, enriquecer: enriquecer, deFichero: deFichero, resumen: resumen, linea: linea, lineaHTML: lineaHTML };
})();
window.DocumentosDatos = DocumentosDatos;
