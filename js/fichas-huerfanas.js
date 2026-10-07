/* ============================================================
   fichas-huerfanas.js — asuntos.json apunta por el nombre exacto de la
   carpeta. Si alguien renombra o mueve una carpeta a mano, por fuera
   de la aplicación, la ficha se queda huérfana: no se ve en ningún
   lado, pero sigue en el fichero.

   Fila 291 (docs/PROBLEMAS-CON-SU-SOLUCION.md): ya no pinta una
   sección de Ajustes sino la tarjeta «N asuntos han perdido su
   carpeta» de la pestaña «Problemas» (js/problemas.js): buscar su
   carpeta, o quitar el asunto de la lista.
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

  /* Las carpetas ABIERTAS que no tienen ficha: son las candidatas
     para enlazar una huérfana con ellas. Desde la fila 64
     (docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md) las carpetas archivadas
     ya no cuentan: su ficha vive en su propia _ficha.json, así que no
     tener entrada en asuntos.json es lo normal, no una huérfana. */
  function carpetasSinFicha() {
    var salida = [];
    App.E.listaAbiertos.forEach(function (a) {
      if (!App.E.registro.asuntos[a.nombre]) salida.push({ nombre: a.nombre, donde: 'Abiertos' });
    });
    return salida;
  }

  function resumenNotas(ficha) {
    var notas = ficha.notas || [];
    if (!notas.length) return 'Sin notas.';
    var ultima = notas[notas.length - 1];
    return (notas.length === 1 ? '1 nota' : notas.length + ' notas') +
           '  ·  la última: "' + String(ultima.texto || '').slice(0, 80) + '"';
  }

  async function enlazar(clave) {
    var candidatos = carpetasSinFicha();
    if (!candidatos.length) {
      U.aviso('No hay ninguna carpeta sin asunto. Puede que la carpeta se haya borrado o esté fuera de la carpeta de ' +
        'asuntos abiertos. Si la encuentras, devuélvela a su sitio y vuelve a mirar.', 'ambar');
      return;
    }
    var opciones = candidatos.map(function (c) {
      return '<option value="' + U.escapar(c.nombre) + '">' + U.escapar(c.nombre) +
             '  ·  ' + U.escapar(c.donde) + '</option>';
    }).join('');
    var ok = await U.preguntar('Buscar su carpeta',
      '<p class="explica">El asunto <strong>' + U.escapar(clave) + '</strong> pasa a ser el de ' +
      'la carpeta que elijas. Queda como estaba, con sus hitos y sus notas.</p>' +
      '<label class="etiqueta">Carpeta</label>' +
      '<select id="huerfana-destino" class="campo">' + opciones + '</select>', 'Enlazar');
    if (!ok) return;

    var destino = $('huerfana-destino').value;
    try {
      await App.cargarRegistro();
      if (!App.E.registro.asuntos[clave]) {
        U.aviso('Ese asunto ya no está: puede que el compañero lo haya tocado.', 'malo');
        return;
      }
      /* La ficha pasa a la carpeta nueva, y con ella sus hitos y su
         señal de presencia si la hubiera (fila 62,
         docs/RENOMBRAR-SIN-PERDER-HITOS.md). */
      await AsuntoRenombrar.mover(clave, destino, {});
      U.aviso('Asunto enlazado con ' + destino + '.', 'bueno');
      await App.pintarAjustes();
      if (App.verAbiertos) App.verAbiertos();
    } catch (e) {
      U.aviso('No he podido enlazarlo: ' + U.mensajeDeError(e), 'malo');
    }
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

  async function pintarTarjeta() {
    var mio = ++turno;
    var claves = await calcular();
    if (mio !== turno) return claves;
    if (window.Problemas && window.ProblemasTextos) {
      if (!claves.length) Problemas.registrar('carpetas', null);
      else {
        var d = ProblemasTextos.carpetas(claves.map(function (k) {
          var ficha = App.E.registro.asuntos[k] || {};
          return { nombre: k, detalle: hitoActual(k, ficha) + '  ·  ' + cuentaDeNotas(ficha) };
        }));
        claves.forEach(function (k, i) {
          var ficha = App.E.registro.asuntos[k] || {};
          d.elementos[i].acciones[0].alPulsar = function () { return enlazar(k); };
          d.elementos[i].acciones[1].alPulsar = function () { return borrar(k, ficha); };
        });
        Problemas.registrar('carpetas', d);
      }
    }
    return claves;
  }

  App.pintarFichasHuerfanas = pintarTarjeta;
  if (window.Problemas) Problemas.calculador('carpetas', pintarTarjeta);

  /* Para js/avisos-que-faltan.js (fila 68, 1): la misma cuenta, sin
     duplicar la lógica. */
  window.FichasHuerfanas = { calcular: calcular, pintarTarjeta: pintarTarjeta };
})();
