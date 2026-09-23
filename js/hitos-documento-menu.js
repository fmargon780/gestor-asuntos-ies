/* ============================================================
   hitos-documento-menu.js — el menú de tres puntos de cada documento
   apuntado a un hito (23-sep-2026, fila 103,
   docs/EL-HITO-MESA-DE-TRABAJO.md, 2).

   Sustituye a la ✕ de la fila 31. Trae, con el mismo criterio que la
   lista de documentos de la ficha (js/ficha-documentos.js):

     - Registrar (solo si le falta el registro): `Registro.abrirCuadro`.
     - Separar, Unir, Sacar páginas, Ajustar tamaño (solo PDF): las
       mismas llamadas, con `modo: 'asunto'`.
     - Quitar del hito: lo que hacía la ✕. Solo lo desapunta.

   Lo que salga de ahí (la copia sellada, las partes, el unido, el
   ajustado) queda apuntado al MISMO hito. Para saber qué ficheros son
   nuevos sin tocar por dentro ninguna herramienta, se lee la carpeta
   antes de abrirla y otra vez en su `alTerminar`: lo que no estaba
   antes es lo nuevo (`nuevos`, pura).

   En un documento «(ya no está)» el menú solo trae «Quitar del hito».
   Lo llama js/hitos-panel-lista.js. Se carga después de
   js/hitos-anadir.js (usa `HitosAnadir.apuntar`/`repintar`).
   ============================================================ */
window.HitosDocumentoMenu = (function () {

  /* Pura: los nombres de `despues` que no estaban en `antes`, sin
     repetir y en el orden de `despues`. */
  function nuevos(antes, despues) {
    var salida = [];
    (despues || []).forEach(function (n) {
      if ((antes || []).indexOf(n) === -1 && salida.indexOf(n) === -1) salida.push(n);
    });
    return salida;
  }

  /* Pura: qué opciones lleva el menú de un documento. */
  function queOpciones(o) {
    if (o.falta) return ['quitar'];
    var lista = [];
    if (!o.registrado) lista.push('registrar');
    if (o.pdf) {
      lista.push('separar', 'unir', 'sacar');
      if (o.ajustar) lista.push('ajustar');
    }
    lista.push('quitar');
    return lista;
  }

  async function nombresDeLaCarpeta(a) {
    try { return (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); }
    catch (e) { return null; }
  }

  /* Lanza una herramienta que llama a `alTerminar` cuando algo ha
     cambiado; apunta al hito lo que haya salido nuevo. */
  async function conLoNuevo(a, h, lanzar) {
    var antes = await nombresDeLaCarpeta(a);
    async function alTerminar() {
      var despues = await nombresDeLaCarpeta(a);
      var lista = (antes && despues) ? nuevos(antes, despues) : [];
      if (despues) antes = despues;
      if (lista.length) await window.HitosAnadir.apuntar(a, h, lista);
      else window.HitosAnadir.repintar(a, h);
    }
    await lanzar(function () {
      alTerminar().catch(function (e) { U.accesorio('Hecho, pero no he podido apuntarlo en el hito', e); });
    });
  }

  function herramientaPdf(a, h, nombre, accion) {
    return function () {
      return conLoNuevo(a, h, async function (alTerminar) {
        var handle = await a.handle.getFileHandle(nombre);
        return accion({ modo: 'asunto', dir: a.handle, nombre: nombre, handle: handle, asunto: a, alTerminar: alTerminar });
      });
    };
  }

  function registrar(a, h, nombre) {
    return function () {
      return conLoNuevo(a, h, function (alTerminar) { return Registro.abrirCuadro(a, nombre, alTerminar); });
    };
  }

  function quitar(a, h, nombre, boton) {
    return async function () {
      try {
        await U.mientrasGuarda(boton, function () { return Hitos.quitarDocumento(a.nombre, h.id, nombre); });
      } catch (e) {
        U.fallo('No he podido quitar el documento del hito', e);
      }
      window.HitosAnadir.repintar(a, h);
    };
  }

  function botonHTML(nombre) {
    return '<button type="button" class="hito-doc-menu" data-doc="' + U.escapar(nombre) + '"' +
      ' title="Más acciones" aria-haspopup="true">⋮</button>';
  }

  /* `boton` es el de tres puntos ya pintado; `falta`, si el documento
     ya no está en la carpeta. */
  function enganchar(boton, a, h, nombre, falta) {
    if (!boton || !window.FichaMenus) return;
    var claves = queOpciones({
      falta: falta,
      registrado: !window.Registro || Registro.tieneRegistro(nombre),
      pdf: !!(window.PdfSepararUnir && window.PdfHerramientas && PdfHerramientas.esPdf(nombre, '')),
      ajustar: !!window.PrepararDocumento
    });
    function conAviso(hacer) {
      return async function () {
        try { await hacer(); } catch (e) { U.fallo('No he podido hacerlo', e); }
      };
    }
    var opciones = {
      registrar: { texto: 'Registrar', alPulsar: conAviso(registrar(a, h, nombre)) },
      separar: { texto: 'Separar', alPulsar: conAviso(herramientaPdf(a, h, nombre, function (c) { return PdfSepararUnir.separar(c); })) },
      unir: { texto: 'Unir', alPulsar: conAviso(herramientaPdf(a, h, nombre, function (c) { return PdfSepararUnir.unir(c); })) },
      sacar: { texto: 'Sacar páginas', alPulsar: conAviso(herramientaPdf(a, h, nombre, function (c) { return PdfSepararUnir.sacarPaginas(c); })) },
      ajustar: { texto: 'Ajustar tamaño', alPulsar: conAviso(herramientaPdf(a, h, nombre, function (c) { return PrepararDocumento.abrir(c); })) },
      quitar: { texto: 'Quitar del hito', clase: 'hito-doc-menu-quitar', alPulsar: quitar(a, h, nombre, boton) }
    };
    var lista = [];
    claves.forEach(function (k) {
      if (k === 'quitar' && lista.length) lista.push({ raya: true });
      lista.push(opciones[k]);
    });
    FichaMenus.montar(boton, lista);
  }

  return { nuevos: nuevos, queOpciones: queOpciones, botonHTML: botonHTML, enganchar: enganchar };
})();
