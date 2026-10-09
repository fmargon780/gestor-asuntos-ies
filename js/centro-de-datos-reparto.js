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

  /* La fecha (ms) del dato que el gestor ya tiene de eso, o 0 si no hay. */
  async function fechaDelGestor(e) {
    var d = datos();
    if (!d) return 0;
    if (e.clave === 'alumnado') return Carpetas.fechaFichero(d, 'RegAlum.csv');
    if (e.clave === 'personal' || e.clave === 'tutorias') return Carpetas.fechaFichero(d, e.fichero || '');
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
  function contexto() { return { repasar: false, tablas: false }; }

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
        await TraerDatos.copiarUno(h, 'ALUMNADO'); ctx.repasar = true; return true;
      case 'personal':
        await TraerDatos.copiarUno(h, 'PERSONAL'); ctx.repasar = true; return true;
      case 'alumnado-bd': {
        var f = await h.getFile();
        var nuevo;
        try { nuevo = JSON.parse(await f.text()); } catch (x) { throw new Error('el archivo no se puede leer'); }
        var r = await AlumnadoBD.aceptar(nuevo);
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

  return { fechaDelGestor: fechaDelGestor, contexto: contexto, terminar: terminar, entregar: entregar };
})();
window.CentroDeDatosReparto = CentroDeDatosReparto;
