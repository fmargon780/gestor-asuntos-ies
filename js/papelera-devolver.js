/* ============================================================
   papelera-devolver.js — devolver a su sitio lo que está en la papelera, y borrarlo del todo.

   Sacado tal cual de js/papelera.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Lo compartido se pide a `Papelera._interno` (I). Se carga justo
   detrás de js/papelera.js.
   ============================================================ */
(function () {
  if (typeof Papelera === 'undefined' || !Papelera._interno) return;
  var I = Papelera._interno;

  function $(id) { return document.getElementById(id); }

  /* ---------- devolver a su sitio ---------- */

  /* Devuelve { ok: true } o { ok: false, motivo: '...' }. Nunca lanza:
     todo lo que puede ir mal se cuenta como motivo para no devolver. */
  async function devolver(ficha) {
    try {
      switch (ficha.clase) {
        case 'documento': return await devolverDocumento(ficha);
        case 'suelto': return await devolverSuelto(ficha);
        case 'asunto': return await devolverAsunto(ficha);
        case 'archivado': return await devolverArchivado(ficha);
        case 'tipo': return await devolverTipo(ficha);
        case 'estado': return await devolverEstado(ficha);
        case 'tipo-documento': return await devolverTipoDocumento(ficha);
        case 'campo-propio': return await devolverCampoPropio(ficha);
        case 'tercero': return await devolverTercero(ficha);
        case 'nota-tablon': return await devolverNotaTablon(ficha);
        case 'grupo': return await devolverGrupo(ficha);
        default: return { ok: false, motivo: 'No sé devolver esto.' };
      }
    } catch (e) {
      return { ok: false, motivo: U.mensajeDeError(e) };
    }
  }

  async function quitarDeIndice(id) {
    await I.cambiar(function (l) { return l.filter(function (x) { return x.id !== id; }); });
  }

  /* Quita la subcarpeta de la papelera, si ya está vacía (el fichero o
     la carpeta que llevaba ya se ha movido a su sitio). */
  async function limpiarSubcarpeta(ficha) {
    if (!ficha.carpeta) return;
    try {
      var pap = await I.carpetaPapelera();
      await pap.removeEntry(ficha.carpeta, { recursive: true });
    } catch (e) { /* no pasa nada si no se puede: se queda ahí */ }
  }

  async function devolverDocumento(ficha) {
    var sitio = await I.buscarCarpetaDeAsunto(ficha.origen && ficha.origen.asunto);
    if (!sitio) {
      return {
        ok: false,
        motivo: 'El asunto "' + ficha.origen.asunto + '" ya no existe.',
        ofrecerSuelto: true
      };
    }
    if (await Carpetas.existeFichero(sitio.handle, ficha.nombre)) {
      return { ok: false, motivo: 'Ya hay un documento llamado "' + ficha.nombre + '" en esa carpeta.' };
    }
    var pap = await I.carpetaPapelera();
    var sub = await pap.getDirectoryHandle(ficha.carpeta);
    await Carpetas.moverFichero(sub, ficha.nombre, sitio.handle, ficha.nombre);
    await quitarDeIndice(ficha.id);
    await limpiarSubcarpeta(ficha);
    if (window.Notas) {
      try {
        var falso = { nombre: ficha.origen.asunto, handle: sitio.handle };
        await window.Notas.anadir(falso, (I.quienSoy() || 'Alguien') + ' devolvió de la papelera: ' + ficha.nombre);
      } catch (e) { /* no pasa nada si la nota no se puede apuntar */ }
    }
    return { ok: true };
  }

  /* Cuando el asunto de un documento ya no existe: se ofrece llevarlo
     a "Por clasificar" en vez de a su asunto. */
  async function devolverDocumentoComoSuelto(ficha) {
    if (await Carpetas.existeFichero(App.E.abiertos, ficha.nombre)) {
      return { ok: false, motivo: 'Ya hay algo llamado "' + ficha.nombre + '" en Por clasificar.' };
    }
    var pap = await I.carpetaPapelera();
    var sub = await pap.getDirectoryHandle(ficha.carpeta);
    await Carpetas.moverFichero(sub, ficha.nombre, App.E.abiertos, ficha.nombre);
    await quitarDeIndice(ficha.id);
    await limpiarSubcarpeta(ficha);
    return { ok: true };
  }

  async function devolverSuelto(ficha) {
    if (await Carpetas.existeFichero(App.E.abiertos, ficha.nombre)) {
      return { ok: false, motivo: 'Ya hay algo llamado "' + ficha.nombre + '" en Por clasificar.' };
    }
    var pap = await I.carpetaPapelera();
    var sub = await pap.getDirectoryHandle(ficha.carpeta);
    await Carpetas.moverFichero(sub, ficha.nombre, App.E.abiertos, ficha.nombre);
    await quitarDeIndice(ficha.id);
    await limpiarSubcarpeta(ficha);
    return { ok: true };
  }

  async function devolverAsunto(ficha) {
    if (await Carpetas.existe(App.E.abiertos, ficha.nombre)) {
      return { ok: false, motivo: 'Ya hay un asunto abierto llamado "' + ficha.nombre + '".' };
    }
    var pap = await I.carpetaPapelera();
    await Carpetas.trasladar(pap, ficha.carpeta, App.E.abiertos, ficha.nombre);
    await App.guardarRegistroFresco(function (registro) {
      if (!registro.asuntos) registro.asuntos = {};
      registro.asuntos[ficha.nombre] = ficha.datos || {};
    });
    /* Los hitos vuelven con el asunto (fila 62,
       docs/RENOMBRAR-SIN-PERDER-HITOS.md). */
    if (ficha.hitos && window.AsuntoRenombrar) await AsuntoRenombrar.restaurar(ficha.nombre, ficha.hitos);
    await quitarDeIndice(ficha.id);
    return { ok: true };
  }

  /* Un asunto del ARCHIVO (fila 136): vuelve a su sitio del ARCHIVO
     (categoría y tercero, o la ruta donde estaba suelto) y a su índice. */
  async function devolverArchivado(ficha) {
    var o = ficha.origen || {};
    if (!App.E.archivo) return { ok: false, motivo: 'No está señalada la carpeta del ARCHIVO.' };
    var padre;
    if (o.sueltoEn === 'bajo la categoría') {
      padre = await Carpetas.crear(App.E.archivo, o.categoria);
    } else if (o.sueltoEn) {
      padre = App.E.archivo;
      var trozos = String(o.ruta || '').split(' / ').filter(Boolean);
      for (var i = 0; i < trozos.length; i++) padre = await Carpetas.crear(padre, trozos[i]);
    } else {
      if (!o.categoria || !o.tercero) return { ok: false, motivo: 'No sé dónde estaba en el ARCHIVO.' };
      padre = await Carpetas.crear(await Carpetas.crear(App.E.archivo, o.categoria), o.tercero);
    }
    if (await Carpetas.existe(padre, ficha.nombre)) {
      return { ok: false, motivo: 'Ya hay un asunto llamado "' + ficha.nombre + '" en su sitio del ARCHIVO.' };
    }
    var pap = await I.carpetaPapelera();
    await Carpetas.trasladar(pap, ficha.carpeta, padre, ficha.nombre);
    var entrada = ficha.datos && ficha.datos.entrada;
    if (entrada && window.IndiceArchivo) {
      try { await IndiceArchivo.anadirEntrada(entrada); }
      catch (e) { U.accesorio('Devuelto, pero no he podido apuntarlo en el índice del ARCHIVO', e); }
    }
    await quitarDeIndice(ficha.id);
    return { ok: true };
  }

  async function devolverTipo(ficha) {
    var tipo = (ficha.datos && ficha.datos.tipo) || { tipo: ficha.nombre, categoria: 'OTROS' };
    var yaEsta = App.E.tipos.some(function (t) { return t.tipo === tipo.tipo; });
    if (yaEsta) return { ok: false, motivo: 'Ya hay un tipo llamado "' + tipo.tipo + '".' };
    await Borrados.revivir(App.E.gestor, 'tipos', tipo.tipo);
    App.E.tipos.push(tipo);
    await App.guardarTipos();
    if (ficha.datos && ficha.datos.guia && ficha.datos.guia.length) {
      try {
        var guias = (await Carpetas.leerJson(App.E.gestor, 'guias.json')) || {};
        if (!guias[tipo.tipo]) {
          guias[tipo.tipo] = ficha.datos.guia;
          await Copias.guardar(App.E.gestor, 'guias.json', guias);
        }
      } catch (e) { /* si la guía no se puede devolver, el tipo ya está devuelto */ }
    }
    await quitarDeIndice(ficha.id);
    return { ok: true };
  }

  /* Fila 132: ya no hay estados escritos a mano (el estado del asunto es
     su hito actual), así que un estado borrado de antes no se devuelve. */
  async function devolverEstado() {
    return { ok: false, motivo: 'Los estados escritos a mano ya no existen: el estado de cada asunto es su hito actual.' };
  }

  async function devolverTipoDocumento(ficha) {
    var nombre = (ficha.datos && ficha.datos.nombre) || ficha.nombre;
    var yaEsta = App.E.tiposDocumento.indexOf(nombre) !== -1;
    if (yaEsta) return { ok: false, motivo: 'Ya hay un tipo de documento llamado "' + nombre + '".' };
    var pos = (ficha.datos && typeof ficha.datos.posicion === 'number') ? ficha.datos.posicion : App.E.tiposDocumento.length;
    if (pos < 0 || pos > App.E.tiposDocumento.length) pos = App.E.tiposDocumento.length;
    await Borrados.revivir(App.E.gestor, 'tiposDocumento', nombre);
    App.E.tiposDocumento.splice(pos, 0, nombre);
    await App.guardarTiposDocumento();
    await quitarDeIndice(ficha.id);
    return { ok: true };
  }

  /* El propio grupo lo guarda js/grupos.js, que ya sabe leer y
     escribir _GESTOR/grupos.json fusionando con el disco: aquí solo se
     limpia el índice de la papelera cuando ha ido bien. */
  async function devolverGrupo(ficha) {
    if (!window.Grupos) return { ok: false, motivo: 'No se puede devolver un grupo ahora mismo.' };
    var salida = await Grupos.devolver(ficha);
    if (salida.ok) await quitarDeIndice(ficha.id);
    return salida;
  }

  async function devolverCampoPropio(ficha) {
    var propio = ficha.datos && ficha.datos.propio;
    if (!propio) return { ok: false, motivo: 'No tengo guardados sus datos.' };
    var yaEsta = (App.E.campos.propios || []).some(function (p) {
      return U.normalizar(p.nombre) === U.normalizar(propio.nombre);
    });
    if (yaEsta) return { ok: false, motivo: 'Ya hay un campo propio llamado "' + propio.nombre + '".' };
    App.E.campos = await Campos.guardarPropios(App.E.gestor, function (lista) {
      lista.push(propio);
      return lista;
    });
    await quitarDeIndice(ficha.id);
    return { ok: true };
  }

  async function devolverTercero(ficha) {
    var categoria = ficha.origen && ficha.origen.categoria;
    var campos = (ficha.datos && ficha.datos.campos) || {};
    if (!categoria) return { ok: false, motivo: 'No sé de qué categoría era.' };
    var actual = await Datos.cargar(App.E.datos, categoria);
    var yaEsta = actual.lista.some(function (p) { return U.normalizar(p.nombre) === U.normalizar(ficha.nombre); });
    if (yaEsta) return { ok: false, motivo: 'Ya hay alguien llamado "' + ficha.nombre + '" en esa lista.' };
    await Datos.anadirALista(App.E.datos, categoria, campos);
    await quitarDeIndice(ficha.id);
    return { ok: true };
  }

  async function devolverNotaTablon(ficha) {
    var g = I.gestor();
    if (!g) return { ok: false, motivo: 'No hay carpeta señalada.' };
    var nota = ficha.datos;
    if (!nota) return { ok: false, motivo: 'No tengo guardados sus datos.' };
    /* En fila con los demás guardados de tablon.json (fila 130). */
    var enFila = function (f, fn) { return window.ColaGuardado ? ColaGuardado.poner(f, fn) : fn(); };
    await enFila('tablon.json', async function () {
      var leido = await Carpetas.leerJson(g, 'tablon.json');
      var lista = (leido && Array.isArray(leido.notas)) ? leido.notas.slice() : [];
      lista.push(nota);
      await Copias.guardar(g, 'tablon.json', { notas: lista });
    });
    await quitarDeIndice(ficha.id);
    return { ok: true };
  }

  /* ---------- borrar del todo ---------- */

  async function borrarDelTodo(ficha) {
    if (ficha.carpeta) {
      try {
        var pap = await I.carpetaPapelera();
        await pap.removeEntry(ficha.carpeta, { recursive: true });
      } catch (e) { /* si ya no está, no pasa nada */ }
    }
    await quitarDeIndice(ficha.id);
  }

  Object.assign(Papelera, {
    devolver: devolver,
    borrarDelTodo: borrarDelTodo
  });
  Object.assign(I, {
    devolver: devolver,
    borrarDelTodo: borrarDelTodo,
    devolverDocumentoComoSuelto: devolverDocumentoComoSuelto
  });
})();
