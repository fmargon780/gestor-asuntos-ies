/* ============================================================
   centro-de-datos-reparto.js — a dónde va cada listado que se toma del
   Centro de datos (fila 312, docs/BEBER-DEL-CENTRO-DE-DATOS.md).

   No hay ninguna importación nueva: cada clave se entrega a la función
   con la que hoy se sube a mano ese mismo fichero.

     alumnado, personal  → TraerDatos.copiarUno (js/traer-datos.js)
     alumnado-bd         → AlumnadoBD.aceptar (js/alumnado-bd.js)
     tutorias            → copia del PDF a _GESTOR/datos (lo lee TablasDatos)
     consejo-escolar     → TablasDatosPantalla.anadirFicherosDelConsejo
     registro-*          → ControlRegistro.subir (pide la fecha «Revisar desde»)

   Cada entrega devuelve true (tomado), false (no hacía falta) o, solo
   el registro sin fecha «Revisar desde», 'sin-fecha'.
   ============================================================ */
var CentroDeDatosReparto = (function () {

  function datos() { return window.App && App.E && App.E.datos; }

  /* CSV de Séneca: UTF-8 si lo es, y si no Latin-1. */
  function decodificar(bytes) {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch (e) { return new TextDecoder('windows-1252').decode(bytes); }
  }

  /* Fila 317: el nombre con el que se guarda un fichero de personal. `js/datos-personal.js` saca el curso de
     cada RelPerCen de su NOMBRE (sin curso en el nombre supone el de hoy), así que si el Centro de datos sabe
     el curso y el nombre no lo dice igual, o dos entradas se llamarían igual, se le pone uno que lo diga.
     `elegidas`: las entradas elegidas de esta tanda. */
  function nombreDePersonal(e, elegidas) {
    var original = e.fichero || '';
    if (!e.cursoEscolar) return original;
    var norma = function (c) { return (window.Datos && Datos.cursoEnElNombre ? Datos.cursoEnElNombre(c) : '') || c; };
    var curso = norma(e.cursoEscolar);
    var enNombre = window.Datos && Datos.cursoEnElNombre ? Datos.cursoEnElNombre(original) : '';
    var repetido = (elegidas || []).some(function (o) { return o !== e && o.clave === 'personal' && o.fichero === e.fichero; });
    if (enNombre && enNombre === curso && !repetido) return original;
    var prefijo = e.ambito === 'docentes' ? 'RelPerCen' : (e.ambito === 'no-docentes' ? 'RelPerCenNodocente' : 'RelPerCenTodo');
    return prefijo + ' ' + curso + '.csv';
  }

  /* Fila 319: por dónde llega (js/datos-que-tengo.js): la fecha de la entrada del índice y quién la subió. */
  function origenDe(e) { return { via: 'centro-de-datos', fechaOriginal: e.subido, subidoPor: e.subidoPor || '', nombreOriginal: e.fichero || '' }; }

  /* La fecha (ms) del dato que el gestor ya tiene de eso, o 0 si no hay. `elegidas`: las de esta tanda. */
  async function fechaDelGestor(e, elegidas) {
    var d = datos();
    if (!d) return 0;
    if (e.clave === 'alumnado') return Carpetas.fechaFichero(d, 'RegAlum.csv');
    if (e.clave === 'personal') return Carpetas.fechaFichero(d, nombreDePersonal(e, elegidas));
    if (e.clave === 'tutorias') return Carpetas.fechaFichero(d, e.fichero || '');
    if (e.clave === 'alumnado-bd') {
      var copia = await AlumnadoBD.leer();
      var t = copia && new Date(copia.generado).getTime();
      return t && !isNaN(t) ? t : 0;
    }
    if (e.clave === 'consejo-escolar') {
      try { return await Carpetas.fechaFichero(await d.getDirectoryHandle('Tablas'), e.fichero || ''); }
      catch (x) { return 0; }
    }
    return 0;
  }

  /* Lo que hay que repasar al final de una tanda (una sola vez, no por fichero). */
  function contexto(elegidas) { return { repasar: false, tablas: false, elegidas: elegidas || [] }; }

  async function terminar(ctx) {
    if (ctx.repasar && window.TraerDatos) TraerDatos.repasar();
    if (ctx.tablas && window.TablasDatos) {
      TablasDatos.olvidar();
      if (window.TablasDatosPantalla) { try { await TablasDatosPantalla.pintar(); } catch (e) { /* a la siguiente */ } }
    }
  }

  async function entregar(e, h, ctx) {
    if (!datos()) throw new Error('todavía no hay carpeta de datos');
    switch (e.clave) {
      case 'alumnado':
        await TraerDatos.copiarUno(h, 'ALUMNADO', undefined, origenDe(e)); ctx.repasar = true; return true;
      case 'personal':
        await TraerDatos.copiarUno(h, 'PERSONAL', nombreDePersonal(e, ctx.elegidas), origenDe(e)); ctx.repasar = true; return true;
      case 'alumnado-bd': {
        var f = await h.getFile();
        var nuevo;
        try { nuevo = JSON.parse(await f.text()); } catch (x) { throw new Error('el archivo no se puede leer'); }
        var r = await AlumnadoBD.aceptar(nuevo, origenDe(e));
        ctx.repasar = ctx.repasar || r.copiado;
        return r.copiado;
      }
      case 'tutorias':
        await Carpetas.copiarFicheroEn(datos(), h, e.fichero || h.name); ctx.tablas = true; return true;
      case 'consejo-escolar': {
        var puestos = await TablasDatosPantalla.anadirFicherosDelConsejo([await h.getFile()], { sustituir: true, silencioso: true });
        ctx.tablas = true;
        return puestos > 0;
      }
      case 'registro-entrada':
      case 'registro-salida': {
        var c = (await ControlRegistro.cargar()).control;
        if (!c.desde) return 'sin-fecha';
        var fi = await h.getFile();
        var texto = decodificar(new Uint8Array(await fi.arrayBuffer()));
        var s = await ControlRegistro.subir([{ nombre: e.fichero || fi.name, texto: texto }]);
        if (!s.ok) throw new Error(s.motivo);
        if (s.rechazados && s.rechazados.length) throw new Error(s.rechazados[0].motivo);
        if (window.ControlRegistroPantalla && ControlRegistroPantalla._estado.abierta) { try { await ControlRegistroPantalla.recargar(); } catch (x) { /* no está abierta */ } }
        return true;
      }
    }
    return false;
  }

  return { fechaDelGestor: fechaDelGestor, nombreDePersonal: nombreDePersonal, contexto: contexto, terminar: terminar, entregar: entregar };
})();
window.CentroDeDatosReparto = CentroDeDatosReparto;
