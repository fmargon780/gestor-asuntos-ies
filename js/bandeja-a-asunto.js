/* ============================================================
   bandeja-a-asunto.js — un documento de la bandeja entra en un asunto al pulsar «Guardar» (14-nov-2026, fila 661,
   docs/661-BANDEJA-CON-HITO-Y-TAREA.md; pantalla de prueba docs/pantallas/661.html).

   Un documento suelto de «Por clasificar», o un adjunto de un correo, ya no se mueve al elegir el asunto: se abre el cuadro del
   nombre (el de «Añadir documento», con el fichero todavía en la bandeja) y entra en el asunto al pulsar «Guardar», con su nombre
   y colgado de su tarea (bloque «¿De qué tarea es?», js/documento-tarea-bloque.js). «Volver», «Cerrar» y la ✕ no guardan nada.

     - `suelto(s, nombreAsunto, ficha, opciones)`: lo llama App.llevarSueltoA (js/documentos-sueltos.js).
     - `adjuntos(asunto, d, item)`: los adjuntos que quedan de un correo, uno detrás de otro («Correo de X · adjunto 2 de 3»). El PDF del
       correo y el del hilo ya han entrado con el correo (js/bandeja-guardar.js). Los que no se guardan siguen en la bandeja, con el correo.
     - `faltan(d)`: los adjuntos del correo que siguen en la bandeja.
   ============================================================ */
window.BandejaAAsunto = (function () {

  function carpeta() { return window.BandejaNucleo && BandejaNucleo.carpeta(); }

  async function quitar(dir, nombre) {
    try { await dir.removeEntry(nombre); return true; }
    catch (e) {
      if (e && e.name === 'NotFoundError') return true;
      try { await dir.removeEntry(nombre); return true; } catch (e2) { return !!e2 && e2.name === 'NotFoundError'; }
    }
  }

  /* Lo que el cuadro necesita saber del fichero de la bandeja: de dónde viene, y qué hacer antes y después de guardarlo. */
  function origen(dir, nombre, handle, nombreVista) {
    var db = { dir: dir, nombre: nombre, handle: handle, nombreVista: nombreVista || '', guardado: false, sinBorrar: false };
    /* Las rutas muy largas dan problemas en una carpeta sincronizada: se avisa y se deja decidir. */
    db.antes = async function (a, nombreNuevo) {
      var ruta = a.nombre + '/' + nombreNuevo;
      if (ruta.length <= App.LARGO_MAXIMO_NOMBRE) return true;
      return await U.preguntar('La ruta es muy larga',
        '<p>El documento quedaría en una ruta de ' + ruta.length + ' caracteres:</p><p class="nota">' + U.escapar(ruta) + '</p>' +
        '<p>Las rutas muy largas dan problemas en una carpeta sincronizada.</p>', 'Guardarlo igual');
    };
    /* Ya está dentro del asunto: sale de la bandeja. Si no se puede quitar, el documento SÍ está en el asunto (fila 449). */
    db.despues = async function () {
      db.guardado = true;
      delete App.E.reciales[nombre];
      db.sinBorrar = !(await quitar(dir, nombre));
      try { await App.verAbiertos(); } catch (e) { /* solo repintar */ }
    };
    return db;
  }

  function completo(asunto) {
    return Object.assign({ leido: Nombres.leer(asunto.nombre, App.E.tipos), ficha: (App.E.registro.asuntos || {})[asunto.nombre] || {} }, asunto);
  }

  /* ---------- un documento suelto ---------- */

  async function suelto(s, nombreAsunto, ficha, opciones) {
    var E = window.ElegirAsunto;
    /* Lo leído del documento viaja hasta el cuadro de ponerle nombre (fila 174). */
    var propuesta = window.LectorDeSueltos ? LectorDeSueltos.resultadoDe(s.nombre) : null;
    var destino;
    try { destino = await E.carpetaDelAsunto(nombreAsunto, ficha); }
    catch (e) { U.aviso('No encuentro la carpeta de ese asunto: ' + U.mensajeDeError(e), 'malo'); return; }
    var dir = (window.Entrada && Entrada.dir()) || App.E.abiertos;
    var handle;
    try { handle = s.handle || await dir.getFileHandle(s.nombre); }
    catch (e2) { U.aviso('No encuentro el documento en Por clasificar: ' + U.mensajeDeError(e2), 'malo'); return; }
    var db = origen(dir, s.nombre, handle, '');
    var hito = opciones && opciones.hito;
    try {
      await App.verDocumentos({
        nombre: nombreAsunto, handle: destino,
        ficha: (App.E.registro.asuntos || {})[nombreAsunto] || {},
        leido: Nombres.leer(nombreAsunto, App.E.tipos)
      }, Object.assign({}, opciones, { desdeBandeja: db, propuesta: propuesta }));
    } catch (e3) { U.accesorio('No he podido abrir el cuadro para ponerle nombre', e3); }
    if (!db.guardado) return;   /* «Volver», «Cerrar» o la ✕: no se ha guardado nada, sigue en «Por clasificar» */
    if (db.sinBorrar) U.accesorio('El documento ya está en el asunto, pero no he podido quitarlo de la bandeja. Bórralo de Ver todo');   /* fila 449 */
    var idHito = (hito && hito.id) || '';   /* solo si se llegó desde un hito (fila 103): «Ir al asunto» lleva a ese */
    if (window.Navegacion) Navegacion.avisoAnadido('Documento guardado en ' + nombreAsunto + '.', nombreAsunto, idHito || undefined);   /* fila 119 */
    else U.aviso('Documento guardado en ' + nombreAsunto + '.', 'bueno');
    if (idHito && window.HitosPanel) { HitosPanel.desplegarAlAbrir(nombreAsunto, idHito); HitosPanel.programarRepintado(); }
  }

  /* ---------- los adjuntos de un correo ---------- */

  async function faltan(d) {
    var salida = [], dir = carpeta();
    if (!dir) return salida;
    for (var i = 0; i < ((d && d.adjuntos) || []).length; i++) {
      try { await dir.getFileHandle(d.adjuntos[i]); salida.push(d.adjuntos[i]); } catch (e) { /* ya no está: ya se guardó */ }
    }
    return salida;
  }

  function propuestaDe(d, nombre) {
    return (window.BandejaAdjuntosLector && BandejaAdjuntosLector.propuestaDeAdjunto) ? BandejaAdjuntosLector.propuestaDeAdjunto(d.id, nombre) : null;
  }

  /* El cuadro de un adjunto: `serie` lleva lo de los que faltan (`restantes`) para pasar al siguiente al guardar. */
  async function opcionesDeAdjunto(serie, nombre) {
    var dir = carpeta();
    var handle = await dir.getFileHandle(nombre);
    var db = origen(dir, nombre, handle, window.Bandeja && Bandeja.nombreDeAdjunto ? Bandeja.nombreDeAdjunto(nombre, serie.d) : nombre);
    return { modo: 'anadir', handle: handle, nombreActual: nombre, nombreVista: db.nombreVista, ponerNombre: true,
             propuesta: propuestaDe(serie.d, nombre), desdeBandeja: db, serieAdjuntos: serie };
  }

  async function adjuntos(asunto, d, item) {
    var Bd = window.Bandeja;
    var pendientes = await faltan(d);
    if (!pendientes.length) { if (item && Bd) await Bd.borrarDeLaBandeja(item); return; }
    var a = completo(asunto);
    var quien = (d.de && (d.de.nombre || d.de.correo)) || 'remitente desconocido';
    var serie = { d: d, item: item, quien: quien, total: pendientes.length, restantes: pendientes.slice(1) };
    try {
      var primero = await opcionesDeAdjunto(serie, pendientes[0]);
      await App.verDocumentos(a, { desdeBandeja: primero.desdeBandeja, propuesta: primero.propuesta, serieAdjuntos: serie });
    } catch (e) { U.accesorio('No he podido abrir el cuadro de los adjuntos', e); }
    var quedan = await faltan(d);
    if (!quedan.length) { if (item && Bd) await Bd.borrarDeLaBandeja(item); return; }
    U.aviso('El correo queda en el Registro. ' + (quedan.length === 1 ? 'Un adjunto no se ha guardado: sigue' : quedan.length + ' adjuntos no se han guardado: siguen') +
      ' en la bandeja, con el correo.', 'ambar');
  }

  /* Al guardar un adjunto, el siguiente en el mismo cuadro (el gancho de js/documentos-guardar.js). */
  if (window.Documentos && Documentos._interno && Documentos._interno.alTerminarPonerNombre) {
    Documentos._interno.alTerminarPonerNombre.push(async function (nombreGuardado, opciones) {
      var serie = opciones && opciones.serieAdjuntos;
      if (!serie || !serie.d || !opciones.desdeBandeja || !serie.restantes.length) return false;
      var siguiente = Object.assign({}, serie, { restantes: serie.restantes.slice(1) });
      try {
        var nuevas = await opcionesDeAdjunto(siguiente, serie.restantes[0]);
        await Documentos._interno.pintarFormulario(nuevas);
        return true;
      } catch (e) { return false; }
    });
  }

  return { suelto: suelto, adjuntos: adjuntos, faltan: faltan };
})();
