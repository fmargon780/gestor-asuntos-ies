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

  /* Fila 133 (docs/PARTIR-FICHEROS-GRANDES.md): partido por temas, sin
     cambiar nada de lo que hace. Aquí, el índice y mandar a la papelera;
     devolver y borrar del todo, en js/papelera-devolver.js; el bloque de
     Ajustes, en js/papelera-ajustes.js. Se hablan por `Papelera._interno`
     (I), y cada uno cuelga de `Papelera` sus nombres de siempre. */
  var I = {};

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

  /* Distinto a propósito de U.nuevoId (fila 71, docs/COSAS-REPETIDAS.md):
     este no va en base 36, va con cifras sueltas. No es de los cinco
     que compartían la misma forma, así que se queda como estaba. */
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
  /* Desde la fila 100 (docs/AVISOS-QUE-DICEN-LA-VERDAD.md): primero se
     apunta en papelera.json (con la ficha fresca y una copia de sus
     hitos) y DESPUÉS se mueve la carpeta, para que nunca quede una
     carpeta en la papelera sin apuntar. Si el traslado falla, se quita
     el apunte y se lanza el error (lo principal). Quitar la ficha y los
     hitos de su sitio es accesorio: si falla, ámbar, y no se lanza. */
  async function mandarAsunto(a) {
    var pap = await carpetaPapelera();
    var nombreSub = marcaDeTiempo() + ' ' + a.nombre;

    await App.cargarRegistro();
    var fresca = (App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha || {};
    /* Los hitos viajan dentro de la ficha de la papelera (fila 62,
       docs/RENOMBRAR-SIN-PERDER-HITOS.md): si no, se quedarían para
       siempre en hitos.json bajo un nombre que ya no existe, y al
       devolver el asunto no habría manera de recuperarlos. */
    var hitosCopia = null;
    if (window.Hitos) {
      var todos = await Hitos.leer();
      hitosCopia = todos.porAsunto[a.nombre] ? JSON.parse(JSON.stringify(todos.porAsunto[a.nombre])) : null;
    }
    var ficha = {
      id: nuevoId(), clase: 'asunto', nombre: a.nombre, carpeta: nombreSub,
      origen: null, datos: JSON.parse(JSON.stringify(fresca)), hitos: hitosCopia,
      quien: quienSoy(), cuando: U.ahora()
    };
    await cambiar(function (l) { l.unshift(ficha); return l; });

    try {
      await Carpetas.trasladar(App.E.abiertos, a.nombre, pap, nombreSub);
    } catch (e) {
      try { await cambiar(function (l) { return l.filter(function (x) { return x.id !== ficha.id; }); }); }
      catch (e2) { /* se queda un apunte sin carpeta: la papelera lo enseña igual y se puede quitar */ }
      throw e;
    }

    try {
      if (window.AsuntoRenombrar) await AsuntoRenombrar.quitar(a.nombre);
      await App.guardarRegistroFresco(async function (registro) {
        if (registro.asuntos) delete registro.asuntos[a.nombre];
        /* Fila 176, punto 2: la lápida, en la misma operación de la
           cola que borra la clave. */
        if (window.Borrados) await Borrados.marcar(App.E.gestor, 'asuntos', a.nombre, 'papelera');
      });
    } catch (e3) {
      U.accesorio('El asunto está en la papelera, pero no he podido quitar su ficha o sus hitos. ' +
        'Pulsa Recargar', e3);
    }
  }

  /* ---------- un asunto del ARCHIVO (fila 136, docs/PLAZO-DE-CONSERVACION.md) ----------

     Para los que han cumplido su plazo de conservación (js/conservacion.js):
     la carpeta entera va a la papelera, con su _ficha.json dentro, y se
     apunta de dónde venía (categoría, tercero, ruta) para poder
     devolverla a su sitio. `entrada` es la del índice del ARCHIVO. */
  async function mandarArchivado(entrada) {
    var sitio = window.IndiceArchivo ? await IndiceArchivo.resolverHandle(entrada) : null;
    if (!sitio) throw new Error('No encuentro su carpeta en el ARCHIVO.');
    var pap = await carpetaPapelera();
    var nombreSub = marcaDeTiempo() + ' ' + entrada.nombre;
    var ficha = {
      id: nuevoId(), clase: 'archivado', nombre: entrada.nombre, carpeta: nombreSub,
      origen: { categoria: entrada.categoria || '', tercero: entrada.tercero || '',
                ruta: entrada.ruta || '', sueltoEn: entrada.sueltoEn || '' },
      datos: { entrada: JSON.parse(JSON.stringify(entrada)) },
      quien: quienSoy(), cuando: U.ahora()
    };
    await cambiar(function (l) { l.unshift(ficha); return l; });
    try {
      await Carpetas.trasladar(sitio.padre, entrada.nombre, pap, nombreSub);
    } catch (e) {
      try { await cambiar(function (l) { return l.filter(function (x) { return x.id !== ficha.id; }); }); }
      catch (e2) { /* se queda un apunte sin carpeta: la papelera lo enseña igual y se puede quitar */ }
      throw e;
    }
    try {
      await IndiceArchivo.quitarEntrada(entrada.nombre);
    } catch (e3) {
      U.accesorio('El asunto está en la papelera, pero no he podido quitarlo del índice del ARCHIVO. ' +
        'Pulsa "Reconstruir el índice"', e3);
    }
    if (App.E.listaArchivo) {
      App.E.listaArchivo = App.E.listaArchivo.filter(function (a) { return a.nombre !== entrada.nombre; });
    }
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

  Object.assign(I, {
    DIAS_AVISO: DIAS_AVISO, gestor: gestor, quienSoy: quienSoy, leer: leer, cambiar: cambiar,
    carpetaPapelera: carpetaPapelera, buscarCarpetaDeAsunto: buscarCarpetaDeAsunto,
    mandarFichero: mandarFichero,   /* fila 137: el índice del expediente viejo, sin nota en el asunto */
    mandarDato: mandarDato, mandarSuelto: mandarSuelto
  });

  return {
    FICHERO: FICHERO, CARPETA: CARPETA, DIAS_AVISO: DIAS_AVISO,
    leer: leer,
    mandarDocumentoDeAsunto: mandarDocumentoDeAsunto,
    mandarSuelto: mandarSuelto,
    mandarAsunto: mandarAsunto,
    mandarArchivado: mandarArchivado,
    mandarDato: mandarDato,
    mandarFichero: mandarFichero,   /* fila 149: el logo del centro */
    _interno: I
  };
})();
