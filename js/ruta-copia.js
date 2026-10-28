/* ============================================================
   ruta-copia.js — registrado de Séneca guardado desde la «Ruta» de un
   documento (28-oct-2026, fila 478, docs/REGISTRADO-DESDE-LA-RUTA-DEL-DOCUMENTO.md).

   Al pulsar el «Ruta» pequeño de un PDF (js/copiar-ruta.js), antes de que
   Francisco suba el PDF a Séneca, la app guarda por dentro una copia en la
   subcarpeta oculta `_copia-ruta` del asunto. Si luego guarda encima el
   registrado de Séneca con esa misma ruta, el original ya no existe en el
   disco: esta copia es lo único que lo conserva.

   Dónde se apunta qué copias hay: `_GESTOR/copias-ruta.json`, `{ items: [
   { asunto, doc, tamano, fecha } ] }` (tamaño y fecha del documento cuando
   se hizo la copia). Lo ven los dos ordenadores y solo se miran esos
   documentos, no todas las carpetas.

   Cuándo se mira (`mirar`): al volver el foco a la pestaña, cada
   `App.SEGUNDOS_ENTRE_MIRADAS` (js/documentos-vigilancia.js) y al abrir la
   ficha del asunto (js/ficha-asunto.js).

   Si el documento ha cambiado, `queHaLlegado` decide qué es (una sola
   función, para que el tema 392 añada «trae firma» sin rehacer nada):
     - 'registrado': trae sello de registro. Se hace lo mismo que
       `RegistroSellado.asociar` (el original pasa a previas como «SIN
       SELLAR», se anota el registro y la nota, se marca la tarea).
     - 'sinSello': lo llegado se queda; el original va a previas como
       «<nombre> ANTERIOR». No se anota nada.

   Dos ordenadores: antes de resolver, se renombra la copia a
   `<nombre>.resolviendo-<ordenador>-<hora>`; si falla o aparece otro
   reciente, no se hace nada. Uno de más de una hora se da por abandonado.

   `_copia-ruta` la ignora todo lo que recorre carpetas
   (`Carpetas.esCarpetaTemporalDeSincronizacion`): archivar, comprobar
   tamaños, cambio de nube, copia sin internet. Las escrituras de la propia
   app sobre ese PDF la borran (`alEscribir`, llamado desde js/carpetas.js).
   ============================================================ */
window.RutaCopia = (function () {

  var CARPETA = '_copia-ruta';
  var FICHERO = 'copias-ruta.json';
  var MARCA = '.resolviendo-';
  var HORA = 60 * 60 * 1000;
  var mirando = false;

  function esPdf(nombre) { return /\.pdf$/i.test(String(nombre || '')); }

  function idDeEsteOrdenador() {
    var clave = 'gestor-id-ordenador';
    try {
      var id = window.localStorage.getItem(clave);
      if (!id) { id = Math.random().toString(36).slice(2, 8); window.localStorage.setItem(clave, id); }
      return id;
    } catch (e) { return 'sin-id'; }
  }

  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  /* ---------- la lista compartida ---------- */

  async function leerLista() {
    if (!window.App || !App.E || !App.E.gestor) return null;
    try {
      var d = await Carpetas.leerJson(App.E.gestor, FICHERO);
      return (d && d.items) || [];
    } catch (e) { return null; }
  }

  /* Relee antes de guardar y aplica `cambiar(items)`, que devuelve true si algo cambió. */
  async function cambiarLista(cambiar) {
    if (!window.App || !App.E || !App.E.gestor) return;
    var hacer = async function () {
      var items = (await leerLista()) || [];
      if (!cambiar(items)) return;
      if (items.length) await Copias.guardar(App.E.gestor, FICHERO, { items: items });
      else if (await Carpetas.existeFichero(App.E.gestor, FICHERO)) await Copias.guardar(App.E.gestor, FICHERO, { items: [] });
    };
    if (window.ColaGuardado) await ColaGuardado.poner(FICHERO, hacer);
    else await hacer();
  }

  function quitarDeLista(asunto, doc) {
    return cambiarLista(function (items) {
      var antes = items.length;
      for (var i = items.length - 1; i >= 0; i--) if (items[i].asunto === asunto && items[i].doc === doc) items.splice(i, 1);
      return items.length !== antes;
    });
  }

  /* ---------- la subcarpeta ---------- */

  async function subcarpeta(dirAsunto) {
    try { return await dirAsunto.getDirectoryHandle(CARPETA); } catch (e) { return null; }
  }

  async function borrarSiVacia(dirAsunto, sub) {
    try {
      var quedan = await Carpetas.contenido(sub);
      if (!quedan.ficheros.length && !quedan.carpetas.length) await dirAsunto.removeEntry(CARPETA);
    } catch (e) { /* si no se puede, se queda vacía */ }
  }

  /* Quita la subcarpeta entera (al unir asuntos). */
  async function quitarCarpeta(dirAsunto) {
    try { await dirAsunto.removeEntry(CARPETA, { recursive: true }); } catch (e) { /* no estaba */ }
  }

  /* ---------- la copia al pulsar «Ruta» ---------- */

  /* Solo un PDF de la carpeta principal de un asunto abierto. */
  function toca(a, modo, doc) {
    return !!(a && a.handle && doc && esPdf(doc.nombre) && !doc.subcarpeta && modo === 'abierto' && !soloConsulta());
  }

  async function alCopiarRuta(a, modo, doc) {
    if (!toca(a, modo, doc)) return;
    try {
      var fh = await a.handle.getFileHandle(doc.nombre);
      var f = await fh.getFile();
      var sub = await a.handle.getDirectoryHandle(CARPETA, { create: true });
      await Carpetas.copiarFicheroEn(sub, fh, doc.nombre);
      await cambiarLista(function (items) {
        for (var i = items.length - 1; i >= 0; i--) if (items[i].asunto === a.nombre && items[i].doc === doc.nombre) items.splice(i, 1);
        items.push({ asunto: a.nombre, doc: doc.nombre, tamano: f.size, fecha: f.lastModified || 0 });
        return true;
      });
    } catch (e) {
      U.aviso('No he podido guardar una copia de seguridad del documento.', 'ambar');
    }
  }

  /* La propia app escribe, renombra o mueve un PDF: su copia ya no sirve. */
  async function alEscribir(dir, nombre) {
    if (!dir || !esPdf(nombre) || dir.name === CARPETA) return;
    try {
      var sub = await subcarpeta(dir);
      if (!sub) return;
      try { await sub.getFileHandle(nombre); } catch (e0) { return; }
      await sub.removeEntry(nombre);
      await borrarSiVacia(dir, sub);
      await quitarDeLista(dir.name, nombre);
    } catch (e) { /* accesorio: la mirada lo arreglará */ }
  }

  /* ---------- qué ha llegado (una sola función; el tema 392 añadirá «firmado») ---------- */

  function queHaLlegado(sello) { return sello ? 'registrado' : 'sinSello'; }

  /* ---------- la mirada ---------- */

  async function iguales(f1, f2) {
    if (f1.size !== f2.size) return false;
    var a = new Uint8Array(await f1.arrayBuffer()), b = new Uint8Array(await f2.arrayBuffer());
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function sinExtension(n) { var p = n.lastIndexOf('.'); return p === -1 ? n : n.slice(0, p); }
  function extensionCon(n) { var p = n.lastIndexOf('.'); return p === -1 ? '' : n.slice(p); }

  /* Se queda con la copia para sí; false si otro ordenador la está resolviendo o falla el renombrado. */
  async function reclamar(sub, doc) {
    var mio = doc + MARCA + idDeEsteOrdenador() + '-' + Date.now();
    var nombres = (await Carpetas.ficheros(sub)).map(function (f) { return f.nombre; });
    var ajenos = nombres.filter(function (n) { return n.indexOf(doc + MARCA) === 0; });
    var vigente = ajenos.filter(function (n) { var t = Number((/-(\d+)$/.exec(n) || [])[1]); return t && Date.now() - t < HORA; });
    if (vigente.length) return false;
    var origen = nombres.indexOf(doc) !== -1 ? doc : ajenos[0];   /* sin copia limpia, la abandonada */
    if (!origen) return false;
    try { await Carpetas.renombrarFichero(sub, origen, mio); } catch (e) { return false; }
    var despues = (await Carpetas.ficheros(sub)).map(function (f) { return f.nombre; })
      .filter(function (n) { return n.indexOf(doc + MARCA) === 0 && n !== mio; });
    if (despues.length) { try { await Carpetas.renombrarFichero(sub, mio, doc); } catch (e2) { /* ya se verá */ } return false; }
    return mio;
  }

  /* ¿Se puede anotar el registro en este documento? (mismos requisitos que RegistroSellado.asociar.) */
  async function sePuedeRegistrar(a, doc, sello, tmp) {
    var codigo = Nombres.codigoRegistro({ ano: sello.anio, sentido: sello.tipo, modo: sello.serie, numero: sello.numero });
    if (!codigo) return '';
    var previo = Documentos.leerNombre(doc, a.ficha);
    if (previo.numero && previo.fecha && previo.tipo) return codigo;
    var nuevo = RegistroSellado.nombreParaSello(doc, sello);
    if (!nuevo) return '';
    var nombres = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }).filter(function (n) { return n !== tmp; });
    return RegistroSellado.hayColision(nombres, nuevo) ? '' : codigo;
  }

  async function aPrevias(a, sub, claim, doc, sufijo) {
    var prev = await VersionesPrevias.carpeta(a.handle, true);
    var existentes = (await Carpetas.ficheros(prev)).map(function (f) { return f.nombre; });
    var destino = RegistroSellado.nombreLibreEntre(existentes, sinExtension(doc) + sufijo + extensionCon(doc));
    await Carpetas.moverFichero(sub, claim, prev, destino);
    return VersionesPrevias.nombreDeCarpeta(a.handle);
  }

  async function repintar(a) {
    var N = window.FichaNucleo;
    if (!N || !N.actual || N.actual.nombre !== a.nombre) return;
    try {
      N.pintarDocumentos(N.actual);
      if (window.Notas) { N.actual.ficha.notas = await Notas.frescas(N.actual); N.pintarNotas(N.actual, N.modoActual === 'abierto'); }
    } catch (e) { /* solo pintar */ }
  }

  /* El documento ha cambiado: se decide qué hacer. */
  async function resolver(a, sub, item, f) {
    var claim = await reclamar(sub, item.doc);
    if (!claim) return false;
    try { return await resolverReclamada(a, sub, item, f, claim); }
    catch (e) {
      /* Si algo falla antes de usar la copia, se suelta para la próxima mirada. */
      try { if (await Carpetas.existeFichero(sub, claim)) await Carpetas.renombrarFichero(sub, claim, item.doc); } catch (e2) { /* ya se verá */ }
      throw e;
    }
  }

  async function resolverReclamada(a, sub, item, f, claim) {
    var doc = item.doc;
    var sello = null;
    try { sello = window.RegistroLector ? await RegistroLector.leerSello(f) : null; } catch (e) { sello = null; }
    var caso = queHaLlegado(sello);
    var codigo = '';
    if (caso === 'registrado') {
      var tmp = RegistroSellado.nombreLibreEntre(
        (await Carpetas.ficheros(a.handle)).map(function (x) { return x.nombre; }), sinExtension(doc) + ' (llegado)' + extensionCon(doc));
      codigo = await sePuedeRegistrar(a, doc, sello, tmp);
      if (codigo) {
        await Carpetas.renombrarFichero(a.handle, doc, tmp);
        await Carpetas.moverFichero(sub, claim, a.handle, doc);
        var nuevo = await RegistroSellado.asociar(a, tmp, doc, sello, { conCodigo: true });
        await quitarDeLista(a.nombre, doc);
        await borrarSiVacia(a.handle, sub);
        await repintar(a);
        return !!nuevo;
      }
    }
    var carpetaPrevias = await aPrevias(a, sub, claim, doc, ' ANTERIOR');
    await quitarDeLista(a.nombre, doc);
    await borrarSiVacia(a.handle, sub);
    U.aviso(caso === 'registrado'
      ? 'Lo que has guardado encima de ' + doc + ' trae sello de registro, pero el nombre del documento no permite anotarlo. Lo he dejado; el anterior se conserva en «' + carpetaPrevias + '».'
      : 'Lo que has guardado encima de ' + doc + ' no trae sello de registro. Lo he dejado; el anterior se conserva en «' + carpetaPrevias + '».', 'ambar');
    await repintar(a);
    return true;
  }

  async function revisar(a, item) {
    var sub = await subcarpeta(a.handle);
    if (!sub) { await quitarDeLista(item.asunto, item.doc); return; }
    var fh;
    try { fh = await a.handle.getFileHandle(item.doc); }
    catch (e) {
      /* Borrado o renombrado: la copia ya no sirve. */
      try { await sub.removeEntry(item.doc); } catch (e1) { /* sin copia limpia */ }
      await borrarSiVacia(a.handle, sub);
      await quitarDeLista(item.asunto, item.doc);
      return;
    }
    var f = await fh.getFile();
    if (f.size === item.tamano && (f.lastModified || 0) === item.fecha) return;
    var copia;
    try { copia = await (await sub.getFileHandle(item.doc)).getFile(); }
    catch (e2) { copia = null; }
    if (copia && await iguales(f, copia)) {
      /* Mismo contenido con otra fecha: se apunta la nueva para no releerlo cada vez. */
      await cambiarLista(function (items) {
        var x = items.filter(function (i) { return i.asunto === item.asunto && i.doc === item.doc; })[0];
        if (!x || (x.tamano === f.size && x.fecha === (f.lastModified || 0))) return false;
        x.tamano = f.size; x.fecha = f.lastModified || 0;
        return true;
      });
      return;
    }
    await resolver(a, sub, item, f);
  }

  /* Mira las copias apuntadas. Nunca molesta: cualquier fallo se calla. */
  async function mirar() {
    if (mirando || !window.App || !App.E || !App.E.abiertos || !App.E.gestor) return;
    if (soloConsulta() || (window.ColaGuardado && ColaGuardado.hayGuardado())) return;
    if (!App.E.listaAbiertos || !App.E.listaAbiertos.length) return;
    mirando = true;
    try {
      var items = await leerLista();
      if (!items || !items.length) return;
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var a = App.E.listaAbiertos.filter(function (x) { return x.nombre === item.asunto; })[0];
        try {
          if (!a) { await quitarDeLista(item.asunto, item.doc); continue; }   /* archivado o renombrado */
          await revisar(a, item);
        } catch (e) { /* esta, otra vez en la próxima mirada */ }
      }
    } catch (e) { /* sin permiso o sin disco: ya se verá */ } finally { mirando = false; }
  }

  return {
    CARPETA: CARPETA, FICHERO: FICHERO, alCopiarRuta: alCopiarRuta, alEscribir: alEscribir, quitarCarpeta: quitarCarpeta,
    mirar: mirar, queHaLlegado: queHaLlegado, toca: toca
  };
})();
