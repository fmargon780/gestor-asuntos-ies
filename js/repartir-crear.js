/* ============================================================
   repartir-crear.js — repartir un PDF entre terceros: lo que se escribe
   (fila 141, 25-sep-2026, docs/REPARTIR-ENTRE-TERCEROS.md).

   Por cada trozo de una persona: crea su asunto (tipo elegido, ese
   tercero, fecha = la del documento original, año académico como en
   cualquier asunto nuevo, sin guía ni hitos), guarda dentro el trozo
   con el nombre de siempre (`Nombres.montarDocumento`, mismo registro de
   Séneca que el original), le apunta «Viene de …» y lo ARCHIVA en el
   momento con el archivado de siempre (`App.cerrarAsunto`, sin su
   pregunta: `App.E.archivarSinPreguntar`; hace también su índice del
   expediente).

   En el asunto de origen: el PDF completo se queda; los trozos «Se queda
   en este asunto» se guardan como documentos propios; una nota con el
   reparto; y en su ficha, `repartos` (documento, fecha y, por trozo,
   páginas, tercero, asunto creado y si salió bien). Volver a repartir el
   mismo PDF solo reintenta lo que falló.

   Todo lo de asuntos.json por App.anotar / App.guardarRegistroFresco
   (en fila de ColaGuardado), nunca directo.
   ============================================================ */
var RepartirCrear = (function () {

  /* Fecha (AAAA-MM-DD) y registro de Séneca del nombre del PDF original. */
  function datosDelOriginal(nombre) {
    var l = (window.Documentos && Documentos.leerNombre) ? Documentos.leerNombre(nombre) : { fecha: '', registro: null };
    var r = l.registro;
    return { fecha: l.fecha || U.hoyIso(), codigo: r ? r.ano + r.sentido + r.modo + r.numero : '' };
  }

  function tipoPorNombre(nombre) {
    return (App.E.tipos || []).filter(function (t) { return t.tipo === nombre; })[0] || null;
  }

  function nombreDelAsunto(tipo, tercero, fecha) {
    var t = tipoPorNombre(tipo);
    return Nombres.montarAsunto({ fecha: fecha, tipo: t ? Nombres.tipoParaCarpeta(t) : tipo,
      curso: U.cursoDeFecha(fecha), grupo: '', campos: [], descripcion: '', tercero: tercero }).nombre;
  }

  function nombreDelDocumento(tipoDocumento, datos) {
    return Nombres.montarDocumento({ fecha: datos.fecha, codigo: datos.codigo, tipo: tipoDocumento || 'DOCUMENTO', extension: 'pdf' });
  }

  /* Quién tiene ya un asunto de ese tipo, abierto o archivado. { tercero: true } */
  async function yaTienen(tipo) {
    var salida = {};
    (App.E.listaAbiertos || []).forEach(function (a) {
      var t = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo);
      if (t === tipo && a.ficha && a.ficha.tercero) salida[a.ficha.tercero] = true;
    });
    if (window.IndiceArchivo) {
      try {
        /* Fila 177: quién ya tiene un asunto de este tipo se mira en
           todos los cursos, no solo en el actual. */
        var r = await IndiceArchivo.leerDisco({ todos: true });
        if (r.ok) r.datos.asuntos.forEach(function (e) { if (e.tipo === tipo && e.tercero) salida[e.tercero] = true; });
      } catch (e) { /* sin índice, no se sabe: no se avisa */ }
    }
    return salida;
  }

  function indices(t) { var l = []; for (var p = t.desde; p <= t.hasta; p++) l.push(p - 1); return l; }

  /* Crea, guarda, anota y archiva el asunto de un trozo. Nunca lanza:
     devuelve { ok, asunto, motivo }. */
  async function crearUno(origen, bytes, trozo, persona, op, datos) {
    var nombre = nombreDelAsunto(op.tipo, trozo.tercero, datos.fecha);
    var carpeta;
    try {
      if (await Carpetas.existe(App.E.abiertos, nombre)) return { ok: false, asunto: nombre, motivo: 'ya hay un asunto abierto con ese nombre' };
      carpeta = await Carpetas.crear(App.E.abiertos, nombre);
      await App.anotar(nombre, {
        estado: 'abierto', tipo: op.tipo, categoria: (persona && persona.categoria) || 'ALUMNADO',
        tercero: trozo.tercero, curso: U.cursoDeFecha(datos.fecha), grupo: '', descripcion: '', campos: {},
        abiertoEl: U.ahora(), abiertoPor: App.E.usuario, repartidoDe: origen.nombre
      });
      var doc = await PdfHerramientas.sacarPaginas(bytes, indices(trozo));
      await Carpetas.escribirBytes(carpeta, nombreDelDocumento(op.tipoDocumento, datos), doc, 'application/pdf');
      var a = { nombre: nombre, handle: carpeta, leido: Nombres.leer(nombre, App.E.tipos),
                ficha: App.E.registro.asuntos[nombre] || {} };
      if (window.Notas) await Notas.anadir(a, 'Viene de ' + origen.nombre + ', ' + RepartirNucleo.textoPaginas(trozo).toLowerCase());
      a.ficha = App.E.registro.asuntos[nombre] || a.ficha;
      App.E.archivarSinPreguntar = true;
      try { await App.cerrarAsunto(a); } finally { App.E.archivarSinPreguntar = false; }
      var archivado = false;
      try {
        var destino = await Carpetas.bajar(App.E.archivo, [a.ficha.categoria || 'ALUMNADO', trozo.tercero], false);
        archivado = await Carpetas.existe(destino, nombre);
      } catch (e) { archivado = false; }
      return archivado ? { ok: true, asunto: nombre } : { ok: false, asunto: nombre, motivo: 'creado, pero no se ha podido archivar' };
    } catch (e) {
      return { ok: false, asunto: nombre, motivo: U.mensajeDeError(e) };
    }
  }

  /* Un trozo que se queda en el asunto de origen, como documento propio. */
  async function guardarEnOrigen(origen, bytes, trozo, op, datos) {
    try {
      var doc = await PdfHerramientas.sacarPaginas(bytes, indices(trozo));
      var nombre = nombreDelDocumento(op.tipoDocumentoOrigen, datos);
      if (await Carpetas.existeFichero(origen.handle, nombre)) nombre = await Carpetas.nombreLibreConSufijo(origen.handle, nombre);
      await Carpetas.escribirBytes(origen.handle, nombre, doc, 'application/pdf');
      return { ok: true, documento: nombre };
    } catch (e) {
      return { ok: false, motivo: U.mensajeDeError(e) };
    }
  }

  /* `trozos`: los de la pantalla (con `hecho` los que ya salieron bien
     otra vez). `op`: { tipo, tipoDocumento, tipoDocumentoOrigen, noCrear:
     { tercero: true }, personas: { tercero: { categoria } }, deFuera: [
     { categoria, nombre }] }. `progreso(n, total)`. */
  async function repartir(origen, fichero, trozos, op, progreso) {
    var bytes = new Uint8Array(await (await fichero.handle.getFile()).arrayBuffer());
    var datos = datosDelOriginal(fichero.nombre);
    var porHacer = trozos.filter(function (t) { return !t.hecho && (t.quedarse || (t.tercero && !(op.noCrear || {})[t.tercero])); });
    var resultados = [], hechos = 0;
    for (var i = 0; i < trozos.length; i++) {
      var t = trozos[i];
      var r = { desde: t.desde, hasta: t.hasta, quedarse: !!t.quedarse, tercero: t.tercero || '' };
      if (t.hecho) { resultados.push(Object.assign(r, t.resultado || {}, { ok: true })); continue; }
      if (porHacer.indexOf(t) === -1) { resultados.push(Object.assign(r, { ok: false, omitido: true })); continue; }
      if (progreso) progreso(++hechos, porHacer.length);
      var hecho = t.quedarse
        ? await guardarEnOrigen(origen, bytes, t, op, datos)
        : await crearUno(origen, bytes, t, (op.personas || {})[t.tercero], op, datos);
      resultados.push(Object.assign(r, hecho));
    }

    /* El asunto de origen: relacionados nuevos, la nota y `repartos`. */
    var lineas = resultados.filter(function (x) { return !x.omitido; }).map(function (x) {
      var pag = RepartirNucleo.textoPaginas(x);
      if (x.quedarse) return pag + ' → se queda en este asunto' + (x.documento ? ' (' + x.documento + ')' : '') + (x.ok ? '' : ' — NO SE PUDO');
      return pag + ' → ' + x.tercero + (x.asunto ? ' (asunto ' + x.asunto + ')' : '') + (x.ok ? '' : ' — NO SE PUDO: ' + (x.motivo || ''));
    });
    try {
      await App.guardarRegistroFresco(function (registro) {
        var f = registro.asuntos[origen.nombre] || (registro.asuntos[origen.nombre] = {});
        if ((op.deFuera || []).length && window.Relacionados) {
          f.relacionados = Relacionados.combinarRelacionados(f.relacionados || [], f.categoria, f.tercero, op.deFuera).finales;
        }
        f.repartos = (f.repartos || []).filter(function (x) { return x.documento !== fichero.nombre; }).concat([{
          documento: fichero.nombre, fecha: U.ahora(),
          trozos: resultados.map(function (x) {
            var s = { desde: x.desde, hasta: x.hasta, ok: !!x.ok };
            if (x.quedarse) { s.quedarse = true; if (x.documento) s.documento = x.documento; }
            else { s.tercero = x.tercero; if (x.asunto) s.asunto = x.asunto; }
            return s;
          })
        }]);
      });
      if (window.Notas && lineas.length) {
        var a = { nombre: origen.nombre, ficha: App.E.registro.asuntos[origen.nombre] || {} };
        await Notas.anadir(a, 'Reparto de ' + fichero.nombre + ':\n' + lineas.join('\n'));
      }
    } catch (e) {
      U.accesorio('Reparto hecho, pero no he podido apuntarlo en el asunto de origen', e);
    }
    try { await App.verAbiertos(); } catch (e2) { /* solo pintar */ }
    return resultados;
  }

  /* Lo ya repartido de este PDF, si se repartió antes. */
  function repartoAnterior(origen, nombrePdf) {
    var f = (App.E.registro.asuntos || {})[origen.nombre] || origen.ficha || {};
    return (f.repartos || []).filter(function (r) { return r.documento === nombrePdf; })[0] || null;
  }

  return { datosDelOriginal: datosDelOriginal, nombreDelAsunto: nombreDelAsunto, yaTienen: yaTienen,
           repartir: repartir, repartoAnterior: repartoAnterior };
})();
window.RepartirCrear = RepartirCrear;
