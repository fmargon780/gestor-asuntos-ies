/* ============================================================
   carpetas-perdidas-enlazar.js — enlazar un asunto perdido con su carpeta
   (fila 303, docs/CARPETAS-PERDIDAS-QUE-ESTAN-ARCHIVADAS.md, apartado 5).

   Tres casos, siempre por `AsuntoRenombrar` y la cola de guardado (nada de escribir asuntos.json, hitos.json ni
   _ficha.json a mano):
     a) carpeta de asuntos abiertos, sin asunto: el asunto se muda a ella (`AsuntoRenombrar.mover`);
     b) carpeta de asuntos abiertos, con asunto: se unen en uno, que es el de la carpeta;
     c) carpeta del ARCHIVO: el asunto termina archivado, en esa carpeta y con su nombre. La carpeta ni se mueve
        ni cambia de nombre y no se toca ningún documento.

   La unión de fichas: campo a campo manda el asunto de la carpeta; lo que él tenga vacío se rellena con lo del
   perdido; las listas (notas, hilos, relacionados, pendientesRegistro, encargos) se funden por elemento, con la
   misma identidad que `App.anotarLista`; los hitos, por título (lo hecho en cualquiera de los dos cuenta).

   «Deshacer» devuelve todo a como estaba: la clave en asuntos.json, sus hitos, y el _ficha.json, el historial de
   hitos y la entrada del índice de la carpeta tal como eran (o su ausencia).

   Se carga después de js/carpetas-perdidas-buscar.js, js/asunto-renombrar.js, js/ficha-archivo.js y
   js/hitos-archivo.js.
   ============================================================ */
var CarpetasPerdidasEnlazar = (function () {

  var LISTAS = ['notas', 'hilos', 'relacionados', 'pendientesRegistro', 'encargos'];

  function copia(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  function vacio(v) {
    if (v === undefined || v === null || v === '') return true;
    if (Array.isArray(v)) return !v.length;
    return typeof v === 'object' && !Object.keys(v).length;
  }

  /* La ficha de la carpeta manda; lo vacío se rellena con lo del asunto perdido. */
  function unirFichas(dueno, otra) {
    var salida = copia(dueno) || {};
    var b = copia(otra) || {};
    Object.keys(b).forEach(function (k) {
      if (LISTAS.indexOf(k) !== -1) {
        var lista = App.unirPorIdentidad(salida[k], b[k], App.IDENTIDAD_LISTA[k] || JSON.stringify);
        if (k === 'notas') lista.sort(function (x, y) { return String(x.cuando || '').localeCompare(String(y.cuando || '')); });
        if (lista.length) salida[k] = lista;
      } else if (vacio(salida[k]) && !vacio(b[k])) {
        salida[k] = b[k];
      }
    });
    return salida;
  }

  function errorSalto(texto) { var e = new Error(texto); e.name = 'AsuntoSinFicha'; return e; }

  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  /* ---------- un asunto ---------- */

  /* `carpeta`: una candidata de CarpetasPerdidasBuscar. Devuelve la foto de cómo estaba todo (para deshacer). */
  async function enlazarUno(clave, carpeta) {
    if (soloConsulta()) throw (window.SoloConsulta && SoloConsulta.error ? SoloConsulta.error() : new Error('Solo consulta'));
    await App.cargarRegistro();
    var registro = App.E.registro.asuntos;
    if (!registro[clave]) throw errorSalto('Ese asunto ya no está: puede que el compañero lo haya tocado.');

    var hitosAhora = window.Hitos ? await Hitos.leer() : { porAsunto: {} };
    var foto = {
      clave: clave, destino: carpeta.nombre, caso: 'a',
      fichaPerdido: copia(registro[clave]), fichaRegDestino: copia(registro[carpeta.nombre]),
      hitos: { clave: copia(hitosAhora.porAsunto[clave]), destino: copia(hitosAhora.porAsunto[carpeta.nombre]) },
      carpeta: null
    };

    if (carpeta.donde === 'abiertos') {
      if (!foto.fichaRegDestino) {
        await AsuntoRenombrar.mover(clave, carpeta.nombre, {});   /* a) */
      } else {
        foto.caso = 'b';
        await unirConAbierto(clave, carpeta.nombre);
      }
    } else {
      foto.caso = 'c';
      await pasarAlArchivo(clave, carpeta, foto, hitosAhora);
    }
    return foto;
  }

  /* b) El asunto perdido se une al de la carpeta. */
  async function unirConAbierto(clave, destino) {
    await App.guardarRegistroFresco(async function (registro) {
      var perdido = registro.asuntos[clave];
      if (!perdido) throw errorSalto('Ese asunto ya no está: puede que el compañero lo haya tocado.');
      registro.asuntos[destino] = unirFichas(registro.asuntos[destino], perdido);
      delete registro.asuntos[clave];
      if (window.Borrados) await Borrados.marcar(App.E.gestor, 'asuntos', clave, 'unido');
    });
    if (window.Encargos) await Encargos.alMoverAsunto(clave, destino);
    if (window.Hitos) await AsuntoRenombrar.pasarHitos(clave, destino);
    if (window.Presencia && Presencia.mover) { try { await Presencia.mover(clave, destino); } catch (e) { /* no crítico */ } }
  }

  /* c) El asunto termina archivado en la carpeta del ARCHIVO. */
  async function pasarAlArchivo(clave, carpeta, foto, hitosAhora) {
    var handle = await CarpetasPerdidasBuscar.carpetaDe(carpeta);
    if (!handle) throw new Error('No encuentro esa carpeta en el ARCHIVO. Puede que se haya movido o que Dropbox la esté sincronizando.');
    var registro = App.E.registro.asuntos;
    var fichaPerdido = registro[clave];
    var fichaCarpeta = await FichaArchivo.leer(handle);
    var dueno = fichaCarpeta || registro[carpeta.nombre] || null;

    /* El historial de hitos que ya hubiera: si existe y no se puede leer, no se toca nada. */
    var perdidoHitos = hitosAhora.porAsunto[clave];
    var textoPrevio = null;
    try { textoPrevio = await Carpetas.leerTexto(handle, Hitos.NOMBRE_HISTORIAL); } catch (e) { textoPrevio = null; }
    var previo = textoPrevio ? Hitos._leerHitosDeHistorial(textoPrevio) : null;
    if (textoPrevio && !previo && perdidoHitos && (perdidoHitos.hitos || []).length) {
      throw new Error('El historial de hitos de esa carpeta no se puede leer. No he cambiado nada.');
    }

    var entradaVieja = carpeta.entrada ? copia(carpeta.entrada) : null;
    foto.carpeta = { handle: handle, fichaVieja: copia(fichaCarpeta) || null, historialViejo: textoPrevio, entradaVieja: entradaVieja };

    var ficha = dueno ? unirFichas(dueno, fichaPerdido) : copia(fichaPerdido);
    ficha.estado = 'cerrado';
    ficha.categoria = carpeta.categoria || ficha.categoria;
    ficha.tercero = carpeta.tercero || ficha.tercero;
    ficha.cerradoEl = (dueno && dueno.cerradoEl) || fichaPerdido.cerradoEl || U.ahora();
    await FichaArchivo.escribir(handle, ficha);

    if (perdidoHitos && (perdidoHitos.hitos || []).length) {
      var hitos = previo ? AsuntoRenombrar.unirHitosPorTitulo(previo.hitos, perdidoHitos.hitos) : perdidoHitos.hitos;
      var creados = (previo && previo.creados) || perdidoHitos.creados || U.hoyIso();
      await Carpetas.escribirTexto(handle, Hitos.NOMBRE_HISTORIAL, Hitos._textoHistorial(carpeta.nombre, hitos, creados));
    }

    await App.guardarRegistroFresco(async function (reg) {
      delete reg.asuntos[clave];
      if (window.Borrados) await Borrados.marcar(App.E.gestor, 'asuntos', clave, 'archivado');
      if (reg.asuntos[carpeta.nombre]) {   /* un archivado de los de antes, con su ficha todavía en asuntos.json: ya va en _ficha.json */
        delete reg.asuntos[carpeta.nombre];
        if (window.Borrados) await Borrados.marcar(App.E.gestor, 'asuntos', carpeta.nombre, 'archivado');
      }
    });
    if (window.Hitos) await Hitos.quitarAsunto(clave);
    if (window.Presencia && Presencia.borrarClave) { try { await Presencia.borrarClave(clave); } catch (e) { /* no crítico */ } }
    if (window.Encargos) await Encargos.alMoverAsunto(clave, carpeta.nombre);

    if (window.IndiceArchivo) {
      try {
        var cat = carpeta.categoria, ter = carpeta.tercero;
        var e = await IndiceArchivo.entradaDe(handle, carpeta.nombre, cat, ter,
          (entradaVieja && entradaVieja.ruta) || (cat + ' / ' + ter), (entradaVieja && entradaVieja.sueltoEn) || '', App.E.tipos, ficha);
        await IndiceArchivo.anadirEntrada(e);
      } catch (e2) { /* el índice es prescindible: se puede reconstruir entero */ }
    }
  }

  /* ---------- deshacer ---------- */

  async function deshacerUno(f) {
    if (window.Borrados) {
      await Borrados.revivir(App.E.gestor, 'asuntos', f.clave);
      if (f.fichaRegDestino) await Borrados.revivir(App.E.gestor, 'asuntos', f.destino);
    }
    await App.guardarRegistroFresco(function (registro) {
      registro.asuntos[f.clave] = copia(f.fichaPerdido);
      if (f.fichaRegDestino) registro.asuntos[f.destino] = copia(f.fichaRegDestino);
      else delete registro.asuntos[f.destino];
    });
    if (window.Hitos) {
      await Hitos.cambiar(function (d) {
        [['clave', f.clave], ['destino', f.destino]].forEach(function (p) {
          if (f.hitos[p[0]]) d.porAsunto[p[1]] = copia(f.hitos[p[0]]); else delete d.porAsunto[p[1]];
        });
        return d;
      });
    }
    if (f.caso === 'c' && f.carpeta) {
      var h = f.carpeta.handle;
      if (f.carpeta.fichaVieja) await FichaArchivo.escribir(h, f.carpeta.fichaVieja); else await FichaArchivo.borrar(h);
      if (f.carpeta.historialViejo !== null) await Carpetas.escribirTexto(h, Hitos.NOMBRE_HISTORIAL, f.carpeta.historialViejo);
      else { try { await h.removeEntry(Hitos.NOMBRE_HISTORIAL); } catch (e) { /* no estaba */ } }
      if (window.IndiceArchivo) {
        try {
          if (f.carpeta.entradaVieja) await IndiceArchivo.anadirEntrada(f.carpeta.entradaVieja);
          else await IndiceArchivo.quitarEntrada(f.destino);
        } catch (e) { /* el índice es prescindible */ }
      }
    }
  }

  /* ---------- varios, uno detrás de otro ---------- */

  async function ponerAlDia(hubo) {
    try {
      if (App.pintarAjustes) await App.pintarAjustes();
      if (App.verAbiertos) await App.verAbiertos();
      if (hubo && App.E.archivoVisitado && App.verArchivo) await App.verArchivo();
    } catch (e) { /* solo pintar */ }
  }

  /* `lista`: [{ clave, carpeta }]. Si uno falla, los demás siguen. Devuelve { hechos, fallos, deshacer }. */
  async function enlazar(lista, alAvanzar) {
    var hechos = [], fallos = [];
    for (var i = 0; i < lista.length; i++) {
      if (alAvanzar) alAvanzar(i, lista.length);
      try { hechos.push(await enlazarUno(lista[i].clave, lista[i].carpeta)); }
      catch (e) { fallos.push({ clave: lista[i].clave, motivo: e && e.name === 'AsuntoSinFicha' ? e.message : U.mensajeDeError(e) }); }
    }
    var hayArchivados = hechos.some(function (f) { return f.caso === 'c'; });
    await ponerAlDia(hayArchivados);
    return {
      hechos: hechos, fallos: fallos,
      deshacer: async function () {
        for (var j = hechos.length - 1; j >= 0; j--) await deshacerUno(hechos[j]);
        await ponerAlDia(hayArchivados);
        if (window.Problemas) await Problemas.recalcular('carpetas');
      }
    };
  }

  return {
    enlazar: enlazar, enlazarUno: enlazarUno, deshacerUno: deshacerUno, ponerAlDia: ponerAlDia,
    /* para las pruebas */
    _unirFichas: unirFichas
  };
})();
window.CarpetasPerdidasEnlazar = CarpetasPerdidasEnlazar;
