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

  return { de: de, anotar: anotar, registroDe: registroDe, enriquecer: enriquecer, deFichero: deFichero, resumen: resumen };
})();
window.DocumentosDatos = DocumentosDatos;
