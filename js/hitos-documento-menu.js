/* ============================================================
   hitos-documento-menu.js — el menú de tres puntos de cada documento
   de un hito (23-sep-2026, fila 103, docs/EL-HITO-MESA-DE-TRABAJO.md,
   sección 2), en vez de la ✕ de siempre.

   Mismo criterio que js/ficha-documentos.js para Registrar (solo si
   falta) y Separar/Unir/Sacar páginas/Ajustar tamaño (solo PDF), pero
   con `modo: 'asunto'` y, al terminar, apuntando al MISMO hito todo lo
   que haya salido nuevo en la carpeta: se lee Carpetas.ficheros(a.handle)
   antes de abrir la herramienta y otra vez al terminar, y los nombres
   que no estaban antes son los nuevos (ficherosNuevos, pura, sin
   navegador). Si la herramienta ya devolviera los nombres creados se
   usarían esos, pero ninguna de las de hoy lo hace.

   "Quitar del hito" es lo que hacía la ✕: solo desapunta, nunca borra.
   En un documento "(ya no está)" el menú solo trae esa opción.

   Se carga después de js/hitos-panel-lista.js, y lo llama ese fichero
   (window.HitosDocumentoMenu.botonHTML/engancharTodos).
   ============================================================ */
window.HitosDocumentoMenu = (function () {

  /* La resta "ficheros nuevos": los nombres de `despues` que no
     estaban en `antes`, sin repetir. Pura, sobre listas de nombres
     (nunca objetos con handle): quien llama ya hace el `.map`. */
  function ficherosNuevos(antes, despues) {
    var estabanAntes = {};
    (antes || []).forEach(function (n) { estabanAntes[n] = true; });
    var vistos = {};
    var salida = [];
    (despues || []).forEach(function (n) {
      if (estabanAntes[n] || vistos[n]) return;
      vistos[n] = true;
      salida.push(n);
    });
    return salida;
  }

  function nombresDe(lista) {
    return (lista || []).map(function (f) { return typeof f === 'string' ? f : f.nombre; });
  }

  function botonHTML(nombre) {
    return '<button type="button" class="hito-doc-menu-boton" data-doc="' +
      U.escapar(nombre) + '" title="Más opciones">⋯</button>';
  }

  /* Tras cualquier herramienta, o tras quitarlo: el hito se queda
     desplegado (docs/EL-HITO-MESA-DE-TRABAJO.md pide
     HitosPanel.desplegarAlAbrir antes de repintar) y, si hay algo
     nuevo en la carpeta, se apunta al mismo hito. La ficha de
     documentos (fuera del panel de hitos) también se repinta: una
     herramienta puede haber dejado un fichero nuevo que esa lista
     tiene que enseñar. */
  async function ficherosDeLaCarpeta(a) {
    try {
      var lista = await Carpetas.ficheros(a.handle);
      return nombresDe(window.IndiceExpediente ? IndiceExpediente.fuera(lista) : lista);   /* fila 137 */
    }
    catch (e) { return []; }
  }

  async function trasElCambio(a, hito, antesNombres) {
    var despuesNombres = await ficherosDeLaCarpeta(a);
    var nuevos = ficherosNuevos(antesNombres, despuesNombres);
    for (var i = 0; i < nuevos.length; i++) {
      try { await Hitos.anadirDocumento(a.nombre, hito.id, nuevos[i]); }
      catch (e) { /* no crítico: la herramienta ya ha hecho su trabajo */ }
    }
    if (window.HitosPanel) {
      window.HitosPanel.desplegarAlAbrir(a.nombre, hito.id);
      window.HitosPanel.programarRepintado();
    }
    if (window.FichaDocumentos) { try { FichaDocumentos.pintar(a); } catch (e) { /* no crítico */ } }
  }

  async function accionRegistrar(a, hito, nombre) {
    var antesNombres = await ficherosDeLaCarpeta(a);
    await Registro.abrirCuadro(a, nombre, function () {
      trasElCambio(a, hito, antesNombres);
      if (Hitos.marcarGuionPorAccion) Hitos.marcarGuionPorAccion(a, hito.id, 'registrar');   /* fila 109 */
    });
  }

  async function abrirHerramientaPdf(a, hito, nombre, accion) {
    var antesNombres = await ficherosDeLaCarpeta(a);
    var handle;
    try { handle = await a.handle.getFileHandle(nombre); }
    catch (e) { U.aviso('No he podido abrir el documento: ' + U.mensajeDeError(e), 'malo'); return; }
    accion({
      modo: 'asunto', dir: a.handle, nombre: nombre, handle: handle, asunto: a,
      alTerminar: function () { trasElCambio(a, hito, antesNombres); }
    });
  }

  async function quitarDelHito(a, hito, nombre) {
    try {
      await Hitos.quitarDocumento(a.nombre, hito.id, nombre);
    } catch (e) {
      U.aviso('No he podido quitarlo: ' + U.mensajeDeError(e), 'malo');
      return;
    }
    if (window.HitosPanel) {
      window.HitosPanel.desplegarAlAbrir(a.nombre, hito.id);
      window.HitosPanel.programarRepintado();
    }
  }

  function opcionesDelMenu(a, hito, nombre, falta) {
    var opciones = [];
    if (!falta) {
      if (window.Registro && !Registro.tieneRegistro(nombre)) {
        opciones.push({ texto: 'Registrar', alPulsar: function () { accionRegistrar(a, hito, nombre); } });
      }
      if (window.PdfSepararUnir && window.PdfHerramientas && PdfHerramientas.esPdf(nombre, '')) {
        opciones.push({ texto: 'Separar', alPulsar: function () {
          abrirHerramientaPdf(a, hito, nombre, PdfSepararUnir.separar);
        } });
        opciones.push({ texto: 'Unir', alPulsar: function () {
          abrirHerramientaPdf(a, hito, nombre, PdfSepararUnir.unir);
        } });
        opciones.push({ texto: 'Sacar páginas', alPulsar: function () {
          abrirHerramientaPdf(a, hito, nombre, PdfSepararUnir.sacarPaginas);
        } });
        if (window.PrepararDocumento) {
          opciones.push({ texto: 'Ajustar tamaño', alPulsar: function () {
            abrirHerramientaPdf(a, hito, nombre, PrepararDocumento.abrir);
          } });
        }
      }
    }
    /* Fila 109 (la mesa del hito): renombrar el documento (el cuadro de
       siempre, que ya cambia su nombre también en el hito) y moverlo a
       otro hito. */
    if (!falta && window.Documentos && Documentos.abrir) {
      opciones.push({ texto: 'Renombrar', alPulsar: function () { Documentos.abrir(a, { hito: hito, ponerNombre: nombre }); } });
    }
    if (window.HitoMesaDocumentos && HitoMesaDocumentos.moverAOtroHito) {
      opciones.push({ texto: 'Mover a otro hito', alPulsar: function () {
        var datos = Hitos.ultimosLeidos && Hitos.ultimosLeidos();
        var entrada = datos && datos.porAsunto && datos.porAsunto[a.nombre];
        HitoMesaDocumentos.moverAOtroHito(a, hito, entrada ? entrada.hitos : [], [nombre]);
      } });
    }
    if (opciones.length) opciones.push({ raya: true });
    opciones.push({
      texto: 'Quitar del hito', clase: 'ficha-menu-peligro',
      alPulsar: function () { quitarDelHito(a, hito, nombre); }
    });
    return opciones;
  }

  /* `caja` es el `.hito-documentos` ya pintado: cada `.hito-documento`
     lleva su nombre en `data-doc` y, si ya no está en la carpeta, el
     botón de abrir con la clase `.hito-doc-falta` (lo pinta
     js/hitos-panel-lista.js con lo que ya sabía). No hace falta que
     nos vuelvan a pasar la lista de la carpeta: se lee del propio DOM
     recién pintado. */
  function engancharTodos(caja, a, hito) {
    if (!caja || !window.FichaMenus) return;
    Array.prototype.forEach.call(caja.querySelectorAll('.hito-documento'), function (span) {
      var boton = span.querySelector('.hito-doc-menu-boton');
      if (!boton) return;
      var nombre = span.dataset.doc;
      var falta = !!span.querySelector('.hito-doc-falta');
      FichaMenus.montar(boton, opcionesDelMenu(a, hito, nombre, falta));
    });
  }

  return { ficherosNuevos: ficherosNuevos, botonHTML: botonHTML, engancharTodos: engancharTodos };
})();
