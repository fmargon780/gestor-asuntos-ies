/* ============================================================
   fichas-huerfanas.js — asuntos.json apunta por el nombre exacto de la
   carpeta. Si alguien renombra o mueve una carpeta a mano, por fuera
   de la aplicación, la ficha se queda huérfana: no se ve en ningún
   lado, pero sigue en el fichero.

   Fila 291 (docs/PROBLEMAS-CON-SU-SOLUCION.md): ya no pinta una
   sección de Ajustes sino la tarjeta «N asuntos han perdido su
   carpeta» de la pestaña «Problemas» (js/problemas.js): buscar su
   carpeta, o quitar el asunto de la lista.

   Fila 303 (docs/CARPETAS-PERDIDAS-QUE-ESTAN-ARCHIVADAS.md): la app busca sola la
   carpeta de cada asunto perdido (js/carpetas-perdidas-buscar.js), también entre las
   archivadas, y la enseña en un bloque con un solo botón «Enlazar los N»
   (js/carpetas-perdidas-enlazar.js). «Buscar su carpeta» pasa a buscar por palabras
   entre todas las carpetas. Esa búsqueda solo se hace con «Problemas» a la vista,
   nunca de fondo.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* Las claves de asuntos.json cuya carpeta no está ni en abiertos ni
     en el archivo.

     Hasta la fila 68 (docs/AVISOS-QUE-FALTAN.md, 1) esto forzaba un
     recorrido entero del ARCHIVO si no se había leído ya esta sesión
     (`App.verArchivo()`), solo para poder pintar un número. Ahora se
     usa el índice guardado (`_GESTOR/indice-archivo.json`), que ya
     tiene el nombre de cada carpeta archivada y no cuesta nada; si el
     índice no está hecho, se aprovecha el ARCHIVO si ya se ha leído
     por otro motivo, pero nunca se fuerza esa lectura desde aquí. Sin
     ninguna de las dos cosas, un asunto cerrado no se puede comprobar
     todavía: mejor no acusarlo de huérfano por error. */
  async function calcular() {
    var hayCarpeta = {};
    App.E.listaAbiertos.forEach(function (a) { hayCarpeta[a.nombre] = true; });

    /* Fila 177: una ficha huérfana puede ser de un curso cualquiera. */
    var indice = window.IndiceArchivo ? await IndiceArchivo.leerDisco({ todos: true }) : { ok: false };
    if (indice.ok) {
      indice.datos.asuntos.forEach(function (e) { hayCarpeta[e.nombre] = true; });
    } else if (App.E.listaArchivo.length) {
      App.E.listaArchivo.forEach(function (a) { hayCarpeta[a.nombre] = true; });
    }

    var claves = Object.keys(App.E.registro.asuntos).filter(function (k) { return !hayCarpeta[k]; });
    if (!indice.ok && !App.E.listaArchivo.length) {
      claves = claves.filter(function (k) { return App.E.registro.asuntos[k].estado !== 'cerrado'; });
    }
    return claves;
  }

  function resumenNotas(ficha) {
    var notas = ficha.notas || [];
    if (!notas.length) return 'Sin notas.';
    var ultima = notas[notas.length - 1];
    return (notas.length === 1 ? '1 nota' : notas.length + ' notas') +
           '  ·  la última: "' + String(ultima.texto || '').slice(0, 80) + '"';
  }

  /* ---------- «Buscar su carpeta»: el cuadro con su buscador (fila 303, apartado 4) ---------- */

  function nombreDeDonde(c) {
    return c.donde === 'abiertos' ? 'En asuntos abiertos' : 'En el ARCHIVO · ' + c.categoria + ' / ' + c.tercero;
  }

  async function enlazar(clave) {
    var B = window.CarpetasPerdidasBuscar;
    var ctx = await B.contexto();
    var lista = await B.candidatas(clave, ctx);
    var sinIndice = !ctx.indiceHecho;
    var elegida = null;       /* el nombre de la carpeta elegida */
    var porNombre = {};

    var capa = document.querySelector('#capa .cuadro');
    if (capa) capa.classList.add('cuadro-ancho');
    var promesa = U.preguntar('Buscar su carpeta',
      '<p class="explica">El asunto <strong>' + U.escapar(clave) + '</strong> pasa a ser el de ' +
      'la carpeta que elijas. Queda como estaba, con sus hitos y sus notas.</p>' +
      (sinIndice ? '<p class="explica" id="huerfana-sin-indice">El ARCHIVO no está leído entero: de lo archivado solo busco en la carpeta de esta persona. ' +
        '<button type="button" class="enlace" id="huerfana-reconstruir">Reconstruir el índice</button></p>' : '') +
      '<input type="search" id="huerfana-buscar" class="campo" placeholder="Buscar entre todas las carpetas…" autocomplete="off">' +
      '<div id="huerfana-destino"></div><p id="huerfana-union" class="explica"></p>', 'Enlazar');
    var aceptar = document.getElementById('cuadro-aceptar');
    var caja = document.getElementById('huerfana-buscar');
    var cont = document.getElementById('huerfana-destino');
    var union = document.getElementById('huerfana-union');
    var enConsulta = !!(window.SoloConsulta && SoloConsulta.activo());
    if (enConsulta) aceptar.disabled = true;

    function ponerBoton() {
      var c = elegida && porNombre[elegida];
      var unirse = !!(c && c.tieneAsunto);
      aceptar.textContent = unirse ? 'Unir y enlazar' : 'Enlazar';
      union.textContent = unirse
        ? 'Esta carpeta ya tiene su asunto. Se unen en uno: se queda con los hitos y las notas de los dos, sin repetir los que sean iguales.' : '';
      if (!enConsulta) aceptar.disabled = !c;
    }

    async function marcarDetalle(c) {
      var ya = await B.completar(c);
      var span = cont.querySelector('[data-ya="' + CSS.escape(c.nombre) + '"]');
      if (span) span.textContent = ya ? ' · Ya tiene su asunto' : '';
      if (elegida === c.nombre) ponerBoton();
    }

    async function contarDe(c) {
      var n = await B.contarDocumentos(c);
      var span = cont.querySelector('[data-docs="' + CSS.escape(c.nombre) + '"]');
      if (span) span.textContent = n === null ? '' : n === 0 ? ' · sin documentos' : n === 1 ? ' · 1 documento' : ' · ' + n + ' documentos';
    }

    function pintar() {
      var r = B.buscar(clave, lista, caja.value);
      r.resultados.forEach(function (x) { porNombre[x.candidato.nombre] = x.candidato; });
      var visibles = r.resultados.map(function (x) { return x.candidato.nombre; });
      if (!elegida || visibles.indexOf(elegida) === -1) elegida = visibles[0] || null;
      if (!r.resultados.length) {
        cont.innerHTML = '<p class="explica">' + (lista.length ? 'Ninguna carpeta tiene todas esas palabras.' : 'No hay ninguna carpeta que mostrar.') + '</p>';
      } else {
        cont.innerHTML = r.resultados.map(function (x, i) {
          var c = x.candidato;
          return (x.parece ? '<div class="etiqueta">Parece esta:</div>' : '') +
            '<label class="huerfana-opcion" style="display:block;margin:6px 0"><input type="radio" name="huerfana-destino" value="' +
            U.escapar(c.nombre) + '"' + (c.nombre === elegida ? ' checked' : '') + '> <strong>' + U.escapar(c.nombre) + '</strong>' +
            '<br><span class="suave">' + U.escapar(nombreDeDonde(c)) + '<span data-ya="' + U.escapar(c.nombre) + '">' +
            (c.tieneAsunto ? ' · Ya tiene su asunto' : '') + '</span><span data-docs="' + U.escapar(c.nombre) + '"></span></span></label>';
        }).join('') + (r.mas ? '<p class="explica">y ' + r.mas + ' más: escribe otra palabra.</p>' : '');
        r.resultados.forEach(function (x) { if (x.candidato.tieneAsunto === null || x.candidato.tieneAsunto === undefined) marcarDetalle(x.candidato); });
        if (elegida) contarDe(porNombre[elegida]);
      }
      Array.prototype.forEach.call(cont.querySelectorAll('input[name="huerfana-destino"]'), function (radio) {
        radio.onchange = function () {
          elegida = radio.value;
          var c = porNombre[elegida];
          B.completar(c).then(function () { marcarDetalle(c); ponerBoton(); });
          contarDe(c);
          ponerBoton();
        };
      });
      ponerBoton();
    }

    caja.oninput = pintar;
    var reconstruir = document.getElementById('huerfana-reconstruir');
    if (reconstruir) {
      reconstruir.onclick = async function () {
        await App.reconstruirIndiceArchivo(reconstruir);
        ctx = await B.contexto();
        lista = await B.candidatas(clave, ctx);
        var linea = document.getElementById('huerfana-sin-indice');
        if (linea && ctx.indiceHecho) linea.remove();
        pintar();
      };
    }
    pintar();
    var ok = await promesa;
    if (capa) capa.classList.remove('cuadro-ancho');
    aceptar.disabled = false;
    if (!ok || !elegida || enConsulta) return;

    var destino = porNombre[elegida];
    try {
      var r = await CarpetasPerdidasEnlazar.enlazar([{ clave: clave, carpeta: destino }]);
      if (r.fallos.length) { U.aviso('No he podido enlazarlo: ' + r.fallos[0].motivo, 'malo'); }
      else {
        U.aviso('Asunto enlazado con ' + destino.nombre + '.', 'bueno', { boton: 'Deshacer', alPulsar: deshacerCon(r) });
      }
      if (window.Problemas) await Problemas.recalcular('carpetas');
    } catch (e) {
      U.aviso('No he podido enlazarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  function deshacerCon(resultado) {
    return async function () {
      try { await resultado.deshacer(); U.aviso('Deshecho.', 'bueno'); }
      catch (e) { U.fallo('No he podido deshacerlo', e); }
    };
  }

  /* ---------- «Enlazar los N»: la lista de lo que la app ha encontrado sola (apartado 3) ---------- */

  async function enlazarLista(claves, boton, progreso) {
    var lista = estado.propuestas.filter(function (p) { return claves.indexOf(p.clave) !== -1; });
    if (!lista.length) return;
    if (boton) { boton.disabled = true; boton.textContent = 'Enlazando…'; }
    var r;
    try {
      r = await CarpetasPerdidasEnlazar.enlazar(lista, progreso);
    } catch (e) {
      U.aviso('No he podido enlazarlos: ' + U.mensajeDeError(e), 'malo');
      if (window.Problemas) await Problemas.recalcular('carpetas');
      return;
    }
    var n = r.hechos.length;
    if (!r.fallos.length) {
      U.aviso(n === 1 ? '1 asunto enlazado con su carpeta.' : n + ' asuntos enlazados con su carpeta.', 'bueno',
        { boton: 'Deshacer', alPulsar: deshacerCon(r) });
    } else {
      var cuales = r.fallos.map(function (f) { return f.clave + ' (' + f.motivo + ')'; }).join('; ');
      U.aviso((n ? n + (n === 1 ? ' asunto enlazado' : ' asuntos enlazados') + '. ' : '') + 'No he podido enlazar: ' + cuales,
        n ? 'ambar' : 'malo', n ? { boton: 'Deshacer', alPulsar: deshacerCon(r) } : undefined);
    }
    estado.firma = '';   /* lo que queda se busca de nuevo */
    if (window.Problemas) await Problemas.recalcular('carpetas');
  }

  async function borrar(clave, ficha) {
    var ok = await U.preguntar('Quitar el asunto de la lista',
      '<p>Se quita de la lista el asunto <strong>' + U.escapar(clave) + '</strong>, que ya no existe.</p>' +
      '<p class="nota">' + U.escapar(resumenNotas(ficha)) + '</p>' +
      '<p class="nota">Antes de quitarlo se guarda una copia de seguridad, así que se puede recuperar ' +
      'si era un error.</p>', 'Quitar');
    if (!ok) return;
    try {
      await App.guardarRegistroFresco(function (registro) {
        delete registro.asuntos[clave];
      });
      U.aviso('Asunto quitado de la lista.', 'bueno');
      await App.pintarAjustes();
    } catch (e) {
      U.aviso('No he podido quitarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* ---------- la tarjeta de «Problemas» ---------- */

  /* El hito en el que está el asunto, de lo último que se leyó de hitos.json (sin leer nada más). */
  function hitoActual(clave, ficha) {
    var d = window.Hitos && Hitos.ultimosLeidos && Hitos.ultimosLeidos();
    var lista = (d && d.porAsunto && d.porAsunto[clave] && d.porAsunto[clave].hitos) || [];
    var h = lista.filter(function (x) { return x.estado === 'encurso'; })[0] ||
      lista.filter(function (x) { return x.estado !== 'hecho'; })[0];
    return (h && h.titulo) || ficha.situacion || 'Sin hito';
  }

  function cuentaDeNotas(ficha) {
    var n = (ficha.notas || []).length;
    return n === 0 ? 'sin notas' : n === 1 ? '1 nota' : n + ' notas';
  }

  /* Calcula y pone (o quita) la tarjeta. Sin Problemas cargado, devuelve solo la lista. */
  var turno = 0;   /* si llegan dos cálculos a la vez, solo vale el último */

  /* Fila 303: lo que la app ha encontrado sola. Solo se busca con «Problemas» a la vista, y no más de una vez
     cada diez minutos mientras los asuntos perdidos sean los mismos (nunca de fondo en cada repintado). */
  var estado = { firma: '', cuando: 0, buscando: false, propuestas: [], claves: [] };
  var turnoBusqueda = 0;
  var CADA = 10 * 60 * 1000;

  function problemasALaVista() {
    var p = $('pantalla-ajustes');
    return !!p && !p.classList.contains('oculto') && App.E.pestanaAjustes === 'problemas';
  }

  function hitosSinHacer(clave) {
    var d = window.Hitos && Hitos.ultimosLeidos && Hitos.ultimosLeidos();
    var lista = (d && d.porAsunto && d.porAsunto[clave] && d.porAsunto[clave].hitos) || [];
    return lista.filter(function (h) { return h.estado !== 'hecho' && h.estado !== 'noaplica'; }).length;
  }

  function filaDe(p) {
    var c = p.carpeta, avisos = [];
    if (c.tieneAsunto) avisos.push('Ya tiene su asunto: se unen en uno.');
    var pendientes = hitosSinHacer(p.clave);
    if (c.donde === 'archivo' && pendientes) avisos.push('Queda archivado con ' + pendientes + (pendientes === 1 ? ' hito sin hacer.' : ' hitos sin hacer.'));
    return { clave: p.clave, nombre: p.clave, carpeta: c.nombre, donde: c.donde === 'abiertos' ? 'En asuntos abiertos' : 'En el ARCHIVO', avisos: avisos };
  }

  function registrarTarjeta(claves) {
    if (!window.Problemas || !window.ProblemasTextos) return;
    if (!claves.length) { Problemas.registrar('carpetas', null); return; }
    var d = ProblemasTextos.carpetas(claves.map(function (k) {
      var ficha = App.E.registro.asuntos[k] || {};
      return { nombre: k, detalle: hitoActual(k, ficha) + '  ·  ' + cuentaDeNotas(ficha) };
    }));
    claves.forEach(function (k, i) {
      var ficha = App.E.registro.asuntos[k] || {};
      d.elementos[i].acciones[0].alPulsar = function () { return enlazar(k); };
      d.elementos[i].acciones[1].alPulsar = function () { return borrar(k, ficha); };
    });
    if (estado.buscando) {
      d.bloque = { titulo: 'Buscando sus carpetas…', buscando: true, filas: [] };
    } else {
      var filas = estado.propuestas.filter(function (p) { return claves.indexOf(p.clave) !== -1; }).map(filaDe);
      if (filas.length) {
        d.bloque = {
          titulo: 'La app ha encontrado la carpeta de ' + filas.length + ' de ellos',
          filas: filas, alEnlazar: enlazarLista
        };
      }
    }
    Problemas.registrar('carpetas', d);
  }

  async function buscarSiToca(forzar) {
    if (!window.CarpetasPerdidasBuscar || !window.CarpetasPerdidasEnlazar) return;
    if (estado.buscando || !problemasALaVista()) return;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
    var claves = estado.claves.slice();
    if (!claves.length) { estado.propuestas = []; estado.firma = ''; return; }
    var firma = claves.slice().sort().join('|');
    if (!forzar && firma === estado.firma && Date.now() - estado.cuando < CADA) return;
    var mio = ++turnoBusqueda;
    estado.buscando = true;
    estado.firma = firma;
    registrarTarjeta(claves);
    try {
      var r = await CarpetasPerdidasBuscar.proponer(claves);
      if (mio === turnoBusqueda) { estado.propuestas = r.propuestas; estado.cuando = Date.now(); }
    } catch (e) {
      if (mio === turnoBusqueda) { estado.propuestas = []; estado.firma = ''; }   /* se vuelve a intentar la próxima vez */
    } finally {
      if (mio === turnoBusqueda) estado.buscando = false;
    }
    registrarTarjeta(estado.claves);
  }

  async function pintarTarjeta() {
    var mio = ++turno;
    var claves = await calcular();
    if (mio !== turno) return claves;
    estado.claves = claves;
    registrarTarjeta(claves);
    buscarSiToca();   /* sin esperar: la tarjeta ya está puesta, el bloque llega cuando la búsqueda acaba */
    return claves;
  }

  /* Al abrir la pestaña «Problemas» (o Ajustes con ella a la vista) se busca. */
  if (window.U && U.envolver && App.pintarPestanaAjustes) {
    U.envolver(App, 'App.pintarPestanaAjustes', 'fichas-huerfanas.js', function (comoEra) {
      return function () {
        var r = comoEra.apply(this, arguments);
        buscarSiToca();
        return r;
      };
    });
  }

  App.pintarFichasHuerfanas = pintarTarjeta;
  if (window.Problemas) Problemas.calculador('carpetas', pintarTarjeta);

  /* Para js/avisos-que-faltan.js (fila 68, 1): la misma cuenta, sin
     duplicar la lógica. */
  window.FichasHuerfanas = { calcular: calcular, pintarTarjeta: pintarTarjeta, _buscarSiToca: buscarSiToca, _estado: estado };
})();
