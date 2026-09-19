/* ============================================================
   papelera.js — borrar con papelera (11-sep-2026).

   Hasta ahora no se podía borrar nada desde la aplicación. Desde hoy
   sí, pero nada se borra de verdad a la primera: se manda a una
   papelera compartida, de la que se puede devolver a su sitio. Las
   carpetas viven en el Dropbox del centro y las usan dos
   administrativos: un borrado de verdad desaparecería también del
   ordenador del compañero, sin aviso y sin deshacer.

   Ver docs/PAPELERA.md para el encargo completo.

   Este fichero centraliza TODO lo de la papelera:
     - la carpeta _GESTOR/PAPELERA y el índice _GESTOR/papelera.json
     - mandar, devolver y borrar del todo, para cada clase de cosa
     - el bloque de Ajustes
     - los botones que se añaden a las pantallas que no tenían ya uno
       (documentos sueltos, personas y empresas dadas de alta a mano),
       envolviendo lo que ya existe, como hace js/dni.js.

   Los sitios que YA tenían un botón de quitar o borrar (tipos,
   estados, tipos de documento y campos propios en Ajustes; las notas
   del tablón) se han tocado en su propio fichero para que ese botón
   pase por la papelera, en vez de duplicarlo aquí.

   Se carga después de js/dni.js y antes de js/inicio.js, para poder
   envolver lo que ya está definido en App a esas alturas.
   ============================================================ */
var Papelera = (function () {

  var FICHERO = 'papelera.json';
  var CARPETA = 'PAPELERA';
  var DIAS_AVISO = 30;

  function $(id) { return document.getElementById(id); }

  function dos(n) { return String(n).padStart(2, '0'); }

  /* AAMMDD-HHMM, para que dos borrados del mismo nombre no choquen. */
  function marcaDeTiempo() {
    var d = new Date();
    return String(d.getFullYear()).slice(2) + dos(d.getMonth() + 1) + dos(d.getDate()) +
           '-' + dos(d.getHours()) + dos(d.getMinutes());
  }

  function nuevoId() {
    return 'b' + Date.now() + Math.floor(Math.random() * 1000);
  }

  function gestor() {
    return window.Gestor && window.Gestor.carpetaGestor();
  }

  function quienSoy() {
    return (window.Gestor && window.Gestor.usuario && window.Gestor.usuario()) || '';
  }

  /* ---------- leer y escribir el índice ---------- */

  async function leer() {
    var g = gestor();
    if (!g) return [];
    var leido = await Carpetas.leerJson(g, FICHERO);
    var lista = (leido && Array.isArray(leido.fichas)) ? leido.fichas : [];
    return lista;
  }

  /* Como todo fichero compartido: se relee justo antes de escribir,
     para no pisar lo que el compañero haya mandado a la papelera desde
     el otro ordenador mientras tanto. */
  async function cambiar(hacer) {
    var g = gestor();
    if (!g) return [];
    var lista = await leer();
    lista = hacer(lista.slice()) || lista;
    await Copias.guardar(g, FICHERO, { fichas: lista });
    return lista;
  }

  function carpetaPapelera() {
    return Carpetas.crear(gestor(), CARPETA);
  }

  /* ---------- mandar a la papelera ---------- */

  /* Un fichero suelto (no dentro de ningún asunto): documento suelto,
     o un documento de dentro de un asunto (dirOrigen es la carpeta del
     asunto). */
  async function mandarFichero(dirOrigen, nombre, clase, origen) {
    var pap = await carpetaPapelera();
    var nombreSub = marcaDeTiempo() + ' ' + nombre;
    var sub = await Carpetas.crear(pap, nombreSub);
    await Carpetas.moverFichero(dirOrigen, nombre, sub, nombre);
    var ficha = {
      id: nuevoId(), clase: clase, nombre: nombre, carpeta: nombreSub,
      origen: origen || null, datos: null, quien: quienSoy(), cuando: U.ahora()
    };
    await cambiar(function (l) { l.unshift(ficha); return l; });
    return ficha;
  }

  /* Una carpeta entera: un asunto. */
  async function mandarCarpeta(dirOrigen, nombre, clase, datos) {
    var pap = await carpetaPapelera();
    var nombreSub = marcaDeTiempo() + ' ' + nombre;
    await Carpetas.trasladar(dirOrigen, nombre, pap, nombreSub);
    var ficha = {
      id: nuevoId(), clase: clase, nombre: nombre, carpeta: nombreSub,
      origen: null, datos: datos || null, quien: quienSoy(), cuando: U.ahora()
    };
    await cambiar(function (l) { l.unshift(ficha); return l; });
    return ficha;
  }

  /* Algo sin fichero: un tipo, un estado, un tipo de documento, un
     campo propio, un tercero dado de alta a mano, una nota del
     tablón. Se guarda entero su dato en el índice. */
  async function mandarDato(clase, nombre, origen, datos) {
    var ficha = {
      id: nuevoId(), clase: clase, nombre: nombre, carpeta: null,
      origen: origen || null, datos: datos || null, quien: quienSoy(), cuando: U.ahora()
    };
    await cambiar(function (l) { l.unshift(ficha); return l; });
    return ficha;
  }

  /* ---------- borrar un asunto abierto ---------- */

  /* Fila 61 (docs/GUARDAR-SIN-PISAR.md): la carpeta se traslada
     primero, y solo entonces se relee asuntos.json, lo más pegado
     posible al momento de escribir. La ficha que se guarda en la
     papelera es la fresca (App.E.registro, ya releído), no la que
     traía 'a' desde antes de mover la carpeta: si no, se archivaría
     una versión vieja y se perdería lo mismo al devolverla. */
  async function mandarAsunto(a) {
    var pap = await carpetaPapelera();
    var nombreSub = marcaDeTiempo() + ' ' + a.nombre;
    await Carpetas.trasladar(App.E.abiertos, a.nombre, pap, nombreSub);

    await App.cargarRegistro();
    var fresca = (App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha || {};
    /* Los hitos viajan dentro de la ficha de la papelera (fila 62,
       docs/RENOMBRAR-SIN-PERDER-HITOS.md): si no, se quedarían para
       siempre en hitos.json bajo un nombre que ya no existe, y al
       devolver el asunto no habría manera de recuperarlos. */
    var hitosGuardados = window.AsuntoRenombrar ? await AsuntoRenombrar.quitar(a.nombre) : null;
    var ficha = {
      id: nuevoId(), clase: 'asunto', nombre: a.nombre, carpeta: nombreSub,
      origen: null, datos: JSON.parse(JSON.stringify(fresca)), hitos: hitosGuardados,
      quien: quienSoy(), cuando: U.ahora()
    };
    await cambiar(function (l) { l.unshift(ficha); return l; });

    await App.guardarRegistroFresco(function (registro) {
      if (registro.asuntos) delete registro.asuntos[a.nombre];
    });
  }

  /* ---------- borrar un documento (de un asunto o suelto) ---------- */

  async function mandarDocumentoDeAsunto(a, nombreFichero) {
    await mandarFichero(a.handle, nombreFichero, 'documento', { asunto: a.nombre });
    if (window.Notas) {
      try {
        await window.Notas.anadir(a, (quienSoy() || 'Alguien') + ' mandó a la papelera: ' + nombreFichero);
      } catch (e) { /* si no se puede apuntar la nota, el borrado ya se ha hecho */ }
    }
  }

  async function mandarSuelto(s) {
    await mandarFichero(App.E.abiertos, s.nombre, 'suelto', null);
  }

  /* ---------- buscar la carpeta de un asunto por su nombre ----------

     Para devolver un documento hay que encontrar la carpeta de su
     asunto, que puede estar abierta o ya archivada. Se mira primero en
     abiertos (rápido, en memoria); si no está, se recorre el archivo,
     igual que App.verAsuntosDeTercero. */
  async function buscarCarpetaDeAsunto(nombre) {
    try {
      var h = await App.E.abiertos.getDirectoryHandle(nombre);
      return { handle: h, padre: App.E.abiertos };
    } catch (e) { /* no está abierto */ }
    try {
      var categorias = await Carpetas.subcarpetas(App.E.archivo);
      for (var i = 0; i < categorias.length; i++) {
        var terceros = await Carpetas.subcarpetas(categorias[i].handle);
        for (var j = 0; j < terceros.length; j++) {
          try {
            var h2 = await terceros[j].handle.getDirectoryHandle(nombre);
            return { handle: h2, padre: terceros[j].handle };
          } catch (e2) { /* no es este */ }
        }
      }
    } catch (e3) { /* no se ha podido mirar el archivo */ }
    return null;
  }

  /* ---------- devolver a su sitio ---------- */

  /* Devuelve { ok: true } o { ok: false, motivo: '...' }. Nunca lanza:
     todo lo que puede ir mal se cuenta como motivo para no devolver. */
  async function devolver(ficha) {
    try {
      switch (ficha.clase) {
        case 'documento': return await devolverDocumento(ficha);
        case 'suelto': return await devolverSuelto(ficha);
        case 'asunto': return await devolverAsunto(ficha);
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
      return { ok: false, motivo: e.message };
    }
  }

  async function quitarDeIndice(id) {
    await cambiar(function (l) { return l.filter(function (x) { return x.id !== id; }); });
  }

  /* Quita la subcarpeta de la papelera, si ya está vacía (el fichero o
     la carpeta que llevaba ya se ha movido a su sitio). */
  async function limpiarSubcarpeta(ficha) {
    if (!ficha.carpeta) return;
    try {
      var pap = await carpetaPapelera();
      await pap.removeEntry(ficha.carpeta, { recursive: true });
    } catch (e) { /* no pasa nada si no se puede: se queda ahí */ }
  }

  async function devolverDocumento(ficha) {
    var sitio = await buscarCarpetaDeAsunto(ficha.origen && ficha.origen.asunto);
    if (!sitio) {
      return {
        ok: false,
        motivo: 'El asunto "' + ficha.origen.asunto + '" ya no existe.',
        ofrecerSuelto: true
      };
    }
    if (await Carpetas.existe(sitio.handle, ficha.nombre)) {
      return { ok: false, motivo: 'Ya hay un documento llamado "' + ficha.nombre + '" en esa carpeta.' };
    }
    var pap = await carpetaPapelera();
    var sub = await pap.getDirectoryHandle(ficha.carpeta);
    await Carpetas.moverFichero(sub, ficha.nombre, sitio.handle, ficha.nombre);
    await quitarDeIndice(ficha.id);
    await limpiarSubcarpeta(ficha);
    if (window.Notas) {
      try {
        var falso = { nombre: ficha.origen.asunto, handle: sitio.handle };
        await window.Notas.anadir(falso, (quienSoy() || 'Alguien') + ' devolvió de la papelera: ' + ficha.nombre);
      } catch (e) { /* no pasa nada si la nota no se puede apuntar */ }
    }
    return { ok: true };
  }

  /* Cuando el asunto de un documento ya no existe: se ofrece llevarlo
     a "Por clasificar" en vez de a su asunto. */
  async function devolverDocumentoComoSuelto(ficha) {
    if (await Carpetas.existe(App.E.abiertos, ficha.nombre)) {
      return { ok: false, motivo: 'Ya hay algo llamado "' + ficha.nombre + '" en Por clasificar.' };
    }
    var pap = await carpetaPapelera();
    var sub = await pap.getDirectoryHandle(ficha.carpeta);
    await Carpetas.moverFichero(sub, ficha.nombre, App.E.abiertos, ficha.nombre);
    await quitarDeIndice(ficha.id);
    await limpiarSubcarpeta(ficha);
    return { ok: true };
  }

  async function devolverSuelto(ficha) {
    if (await Carpetas.existe(App.E.abiertos, ficha.nombre)) {
      return { ok: false, motivo: 'Ya hay algo llamado "' + ficha.nombre + '" en Por clasificar.' };
    }
    var pap = await carpetaPapelera();
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
    var pap = await carpetaPapelera();
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

  async function devolverTipo(ficha) {
    var tipo = (ficha.datos && ficha.datos.tipo) || { tipo: ficha.nombre, categoria: 'OTROS' };
    var yaEsta = App.E.tipos.some(function (t) { return t.tipo === tipo.tipo; });
    if (yaEsta) return { ok: false, motivo: 'Ya hay un tipo llamado "' + tipo.tipo + '".' };
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

  async function devolverEstado(ficha) {
    var estado = (ficha.datos && ficha.datos.estado) || { nombre: ficha.nombre, espera: false };
    var yaEsta = App.E.estados.some(function (e) { return e.nombre === estado.nombre; });
    if (yaEsta) return { ok: false, motivo: 'Ya hay un estado llamado "' + estado.nombre + '".' };
    var pos = (ficha.datos && typeof ficha.datos.posicion === 'number') ? ficha.datos.posicion : App.E.estados.length;
    if (pos < 0 || pos > App.E.estados.length) pos = App.E.estados.length;
    App.E.estados.splice(pos, 0, estado);
    await App.guardarEstados();
    await quitarDeIndice(ficha.id);
    return { ok: true };
  }

  async function devolverTipoDocumento(ficha) {
    var nombre = (ficha.datos && ficha.datos.nombre) || ficha.nombre;
    var yaEsta = App.E.tiposDocumento.indexOf(nombre) !== -1;
    if (yaEsta) return { ok: false, motivo: 'Ya hay un tipo de documento llamado "' + nombre + '".' };
    var pos = (ficha.datos && typeof ficha.datos.posicion === 'number') ? ficha.datos.posicion : App.E.tiposDocumento.length;
    if (pos < 0 || pos > App.E.tiposDocumento.length) pos = App.E.tiposDocumento.length;
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
    var g = gestor();
    if (!g) return { ok: false, motivo: 'No hay carpeta señalada.' };
    var leido = await Carpetas.leerJson(g, 'tablon.json');
    var lista = (leido && Array.isArray(leido.notas)) ? leido.notas.slice() : [];
    var nota = ficha.datos;
    if (!nota) return { ok: false, motivo: 'No tengo guardados sus datos.' };
    lista.push(nota);
    await Copias.guardar(g, 'tablon.json', { notas: lista });
    await quitarDeIndice(ficha.id);
    return { ok: true };
  }

  /* ---------- borrar del todo ---------- */

  async function borrarDelTodo(ficha) {
    if (ficha.carpeta) {
      try {
        var pap = await carpetaPapelera();
        await pap.removeEntry(ficha.carpeta, { recursive: true });
      } catch (e) { /* si ya no está, no pasa nada */ }
    }
    await quitarDeIndice(ficha.id);
  }

  /* ---------- cuánto ocupa (fila 68, docs/AVISOS-QUE-FALTAN.md, 3) ----------

     Solo se llama para el aviso de lo viejo, nunca al pintar la lista
     entera: recorrer cada carpeta cuesta. */
  async function tamanoDeCarpeta(handle) {
    var total = 0;
    for await (var par of handle.entries()) {
      var h = par[1];
      if (h.kind === 'file') {
        try { total += (await h.getFile()).size; } catch (e) { /* seguimos */ }
      } else if (h.kind === 'directory') {
        total += await tamanoDeCarpeta(h);
      }
    }
    return total;
  }

  /* Cuánto ocupan en total, en bytes, las cosas de `viejas` (una lista
     de fichas de la papelera, como las que devuelve `leer()` filtradas
     por `_diasDesde`). Lo que no tenga carpeta (un tipo, un estado…)
     no ocupa nada aparte: solo cuenta el propio índice. */
  async function tamanoDeViejas(viejas) {
    var pap;
    try { pap = await carpetaPapelera(); } catch (e) { return 0; }
    var total = 0;
    for (var i = 0; i < viejas.length; i++) {
      if (!viejas[i].carpeta) continue;
      try {
        var h = await pap.getDirectoryHandle(viejas[i].carpeta);
        total += await tamanoDeCarpeta(h);
      } catch (e) { /* puede que ya no esté */ }
    }
    return total;
  }

  /* ---------- cuánto hace ----------

     En lenguaje llano, para la pantalla de la papelera. */
  function haceCuanto(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var dias = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (dias <= 0) return 'hoy';
    if (dias === 1) return 'ayer';
    return 'hace ' + dias + ' días';
  }

  function diasDesde(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  var ICONOS = {
    documento: '📄', suelto: '📄', asunto: '📁', tipo: '📋', estado: '📋',
    'tipo-documento': '📋', 'campo-propio': '📋', tercero: '📋', 'nota-tablon': '📋', grupo: '👥'
  };

  function deDonde(ficha) {
    if (ficha.clase === 'documento') return 'Documento de ' + ((ficha.origen && ficha.origen.asunto) || '?');
    if (ficha.clase === 'suelto') return 'Documento suelto';
    if (ficha.clase === 'asunto') return 'Asunto abierto';
    if (ficha.clase === 'tipo') return 'Tipo de asunto';
    if (ficha.clase === 'estado') return 'Estado del asunto';
    if (ficha.clase === 'tipo-documento') return 'Tipo de documento';
    if (ficha.clase === 'campo-propio') return 'Campo propio';
    if (ficha.clase === 'tercero') return 'Persona o empresa' +
      ((ficha.origen && ficha.origen.categoria) ? ' (' + ficha.origen.categoria + ')' : '');
    if (ficha.clase === 'nota-tablon') return 'Nota del tablón';
    if (ficha.clase === 'grupo') return 'Grupo de personas';
    return '';
  }

  /* ---------- el bloque de Ajustes ---------- */

  App.pintarPapelera = async function () {
    var caja = $('tabla-papelera');
    var avisoViejas = $('aviso-papelera-vieja');
    if (!caja) return;

    var lista;
    try {
      lista = await leer();
    } catch (e) {
      caja.innerHTML = '<div class="vacio">No he podido leer la papelera: ' + U.escapar(e.message) + '</div>';
      if (avisoViejas) avisoViejas.classList.add('oculto');
      return;
    }

    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">La papelera está vacía.</div>';
      if (avisoViejas) avisoViejas.classList.add('oculto');
      return;
    }

    var viejas = lista.filter(function (f) { return diasDesde(f.cuando) > DIAS_AVISO; });
    if (avisoViejas) {
      if (viejas.length) {
        avisoViejas.classList.remove('oculto');
        avisoViejas.innerHTML = '<strong>Hay ' + viejas.length + ' cosa' + (viejas.length === 1 ? '' : 's') +
          ' en la papelera desde hace más de ' + DIAS_AVISO + ' días.</strong> ';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'boton boton-peligro';
        btn.textContent = 'Borrar del todo lo de más de ' + DIAS_AVISO + ' días';
        btn.onclick = async function () {
          var ok = await U.preguntar('Borrar del todo',
            '<p>Se borran del todo ' + viejas.length + ' cosas de más de ' + DIAS_AVISO + ' días.</p>' +
            '<p class="nota">Esto sí lo quita de verdad. Dropbox aún lo guarda 30 días más en su ' +
            'propia papelera.</p>', 'Borrar del todo');
          if (!ok) return;
          for (var i = 0; i < viejas.length; i++) {
            try { await borrarDelTodo(viejas[i]); } catch (e) { /* seguimos con las demás */ }
          }
          U.aviso('Borradas del todo.', 'bueno');
          App.pintarPapelera();
        };
        avisoViejas.appendChild(btn);
      } else {
        avisoViejas.classList.add('oculto');
        avisoViejas.innerHTML = '';
      }
    }

    caja.innerHTML = '';
    lista.forEach(function (ficha) { caja.appendChild(filaDePapelera(ficha)); });
  };

  function filaDePapelera(ficha) {
    var f = document.createElement('div');
    f.className = 'fila-tipo fila-papelera';

    var icono = document.createElement('span');
    icono.className = 'papelera-icono';
    icono.textContent = ICONOS[ficha.clase] || '📄';
    f.appendChild(icono);

    var texto = document.createElement('span');
    texto.style.flex = '1';
    texto.innerHTML = '<span class="nombre-tipo">' + U.escapar(ficha.nombre) + '</span>' +
      '<br><span class="suave">' + U.escapar(deDonde(ficha)) + '  ·  ' +
      U.escapar(ficha.quien || 'alguien') + '  ·  ' + U.escapar(haceCuanto(ficha.cuando)) + '</span>';
    f.appendChild(texto);

    var devolver_ = document.createElement('button');
    devolver_.type = 'button';
    devolver_.className = 'boton';
    devolver_.textContent = 'Devolver a su sitio';
    devolver_.onclick = function () { pulsarDevolver(ficha); };
    f.appendChild(devolver_);

    var borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'boton boton-peligro';
    borrar.textContent = 'Borrar del todo';
    borrar.style.marginLeft = 'auto';
    borrar.onclick = async function () {
      var ok = await U.preguntar('Borrar del todo',
        '<p><strong>' + U.escapar(ficha.nombre) + '</strong></p>' +
        '<p class="nota">Esto sí lo quita de verdad. Dropbox aún lo guarda 30 días más en su ' +
        'propia papelera.</p>', 'Borrar del todo');
      if (!ok) return;
      try {
        await borrarDelTodo(ficha);
        U.aviso('Borrado del todo.', 'bueno');
        App.pintarPapelera();
      } catch (e) {
        U.aviso('No he podido borrarlo: ' + e.message, 'malo');
      }
    };
    f.appendChild(borrar);

    return f;
  }

  async function pulsarDevolver(ficha) {
    var r = await devolver(ficha);
    if (r.ok) {
      U.aviso((ficha.nombre) + ' devuelto a su sitio.', 'bueno');
      App.pintarPapelera();
      if (typeof App.verAbiertos === 'function') { try { await App.verAbiertos(); } catch (e) {} }
      if (typeof App.pintarAjustes === 'function') { try { await App.pintarAjustes(); } catch (e) {} }
      return;
    }
    if (r.ofrecerSuelto) {
      var ok = await U.preguntar('El asunto ya no existe',
        '<p>' + U.escapar(r.motivo) + '</p>' +
        '<p class="nota">¿Lo llevo a "Por clasificar", como documento suelto?</p>', 'Llevarlo ahí');
      if (ok) {
        try {
          await devolverDocumentoComoSuelto(ficha);
          U.aviso('Llevado a Por clasificar.', 'bueno');
          App.pintarPapelera();
          if (typeof App.verAbiertos === 'function') await App.verAbiertos();
        } catch (e) {
          U.aviso('No he podido devolverlo: ' + e.message, 'malo');
        }
      }
      return;
    }
    await U.preguntar('No se puede devolver', '<p>' + U.escapar(r.motivo) + '</p>', 'Vale', true);
  }

  /* ---------- el cuadro de confirmación de siempre ----------

     Uno solo, título fijo, sin escribir nada para confirmar. */
  async function preguntarBorrar(nombre, notaExtra) {
    return U.preguntar('¿Mandar a la papelera?',
      '<p><strong>' + U.escapar(nombre) + '</strong></p>' +
      (notaExtra || '') +
      '<p class="nota">Se podrá recuperar desde Ajustes › Papelera.</p>',
      'Sí, a la papelera');
  }

  /* ---------- botones que faltaban por poner ----------

     Documento suelto y persona/empresa dada de alta a mano no tenían
     ningún botón de borrar todavía: se añaden envolviendo lo que ya
     pinta la tarjeta, igual que hace js/dni.js con el pie del alumno. */

  function botonBorrar(alPulsar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-peligro';
    b.textContent = 'Borrar';
    b.style.marginLeft = 'auto';
    b.onclick = alPulsar;
    return b;
  }

  U.envolver(App, 'App.tarjetaSuelto', 'papelera.js', function (comoEra) {
    return function (s, pie, esNuevo) {
      var div = comoEra(s, pie, esNuevo);
      var acciones = div.querySelector('.acciones');
      if (!acciones) return div;
      var borrar = botonBorrar(async function () {
        var ok = await preguntarBorrar(s.nombre);
        if (!ok) return;
        try {
          await mandarSuelto(s);
          U.aviso('Documento mandado a la papelera.', 'bueno');
          await App.verAbiertos();
        } catch (e) {
          U.aviso('No he podido mandarlo a la papelera: ' + e.message, 'malo');
        }
      });
      /* Entra el último del menú de tres puntos que ya monta
         js/documentos-sueltos.js (17-sep-2026, fila 36); sin menú (no
         debería darse: "Abrir" siempre lo crea), se cae en la fila. */
      var menu = acciones.querySelector('.fila-menu');
      if (menu) menu.appendChild(borrar);
      else acciones.appendChild(borrar);
      return div;
    };
  });

  U.envolver(App, 'App.verFicha', 'papelera.js', function (comoEra) {
    return function (p) {
      comoEra(p);
      if (!App.sePuedeCambiarElTercero || !App.sePuedeCambiarElTercero(p)) return;
      var botones = $('ver-sus-asuntos');
      if (!botones || !botones.parentNode) return;
      var caja = botones.parentNode;
      caja.appendChild(botonBorrar(async function () {
        var enUso = 0;
        try {
          var todo = await window.Duplicados.delTercero(p.categoria, p.nombre);
          enUso = (todo.abiertos.length || 0) + (todo.archivados.length || 0);
        } catch (e) { enUso = 0; }
        if (enUso) {
          await U.preguntar('No se puede borrar',
            '<p>' + U.escapar(p.nombre) + ' tiene ' + enUso + ' asunto' + (enUso === 1 ? '' : 's') +
            '. No se puede borrar mientras tenga alguno.</p>', 'Vale', true);
          return;
        }
        var ok = await preguntarBorrar(p.nombre);
        if (!ok) return;
        try {
          await mandarDato('tercero', p.nombre, { categoria: p.categoria },
            { campos: Object.assign({}, p.campos) });
          await Datos.quitarDeLista(App.E.datos, p.categoria, p.nombre);
          Datos.olvidar(p.categoria);
          U.aviso('Mandado a la papelera.', 'bueno');
          App.pintarPersonas();
        } catch (e) {
          U.aviso('No he podido mandarlo a la papelera: ' + e.message, 'malo');
        }
      }));
    };
  });

  return {
    FICHERO: FICHERO, CARPETA: CARPETA, DIAS_AVISO: DIAS_AVISO,
    leer: leer,
    mandarDocumentoDeAsunto: mandarDocumentoDeAsunto,
    mandarSuelto: mandarSuelto,
    mandarAsunto: mandarAsunto,
    mandarDato: mandarDato,
    devolver: devolver,
    borrarDelTodo: borrarDelTodo,
    preguntarBorrar: preguntarBorrar,
    botonBorrar: botonBorrar,
    haceCuanto: haceCuanto,
    tamanoDeViejas: tamanoDeViejas,
    /* para las pruebas */
    _diasDesde: diasDesde
  };
})();
