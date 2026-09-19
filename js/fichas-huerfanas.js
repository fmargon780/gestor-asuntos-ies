/* ============================================================
   fichas-huerfanas.js — asuntos.json apunta por el nombre exacto de la
   carpeta. Si alguien renombra o mueve una carpeta a mano, por fuera
   de la aplicación, la ficha se queda huérfana: no se ve en ningún
   lado, pero sigue en el fichero.

   Este bloque de Ajustes las encuentra y deja enlazarlas con una
   carpeta que no tenga ficha, o borrarlas si ya no hacen falta.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* Las claves de asuntos.json cuya carpeta no está ni en abiertos ni
     en el archivo. Si el archivo todavía no se ha leído esta sesión,
     se lee ahora: es la única manera de saber si de verdad falta. */
  async function calcular() {
    if (!App.E.listaArchivo.length) await App.verArchivo();

    var hayCarpeta = {};
    App.E.listaAbiertos.forEach(function (a) { hayCarpeta[a.nombre] = true; });
    App.E.listaArchivo.forEach(function (a) { hayCarpeta[a.nombre] = true; });

    return Object.keys(App.E.registro.asuntos).filter(function (k) { return !hayCarpeta[k]; });
  }

  /* Las carpetas (abiertas o archivadas) que no tienen ficha: son las
     candidatas para enlazar una huérfana con ellas. */
  function carpetasSinFicha() {
    var salida = [];
    App.E.listaAbiertos.forEach(function (a) {
      if (!App.E.registro.asuntos[a.nombre]) salida.push({ nombre: a.nombre, donde: 'Abiertos' });
    });
    App.E.listaArchivo.forEach(function (a) {
      if (!App.E.registro.asuntos[a.nombre]) salida.push({ nombre: a.nombre, donde: 'Archivo: ' + a.ruta });
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
      U.aviso('No hay ninguna carpeta sin ficha con la que enlazarla.', 'malo');
      return;
    }
    var opciones = candidatos.map(function (c) {
      return '<option value="' + U.escapar(c.nombre) + '">' + U.escapar(c.nombre) +
             '  ·  ' + U.escapar(c.donde) + '</option>';
    }).join('');
    var ok = await U.preguntar('Enlazar la ficha con una carpeta',
      '<p class="explica">La ficha de <strong>' + U.escapar(clave) + '</strong> pasa a ser la de ' +
      'la carpeta que elijas. La que tenía antes se queda como estaba.</p>' +
      '<label class="etiqueta">Carpeta</label>' +
      '<select id="huerfana-destino" class="campo">' + opciones + '</select>', 'Enlazar');
    if (!ok) return;

    var destino = $('huerfana-destino').value;
    try {
      await App.cargarRegistro();
      if (!App.E.registro.asuntos[clave]) {
        U.aviso('Esa ficha ya no está: puede que el compañero la haya tocado.', 'malo');
        return;
      }
      /* La ficha pasa a la carpeta nueva, y con ella sus hitos y su
         señal de presencia si la hubiera (fila 62,
         docs/RENOMBRAR-SIN-PERDER-HITOS.md). */
      await AsuntoRenombrar.mover(clave, destino, {});
      U.aviso('Ficha enlazada con ' + destino + '.', 'bueno');
      await App.pintarAjustes();
    } catch (e) {
      U.aviso('No he podido enlazarla: ' + e.message, 'malo');
    }
  }

  async function borrar(clave, ficha) {
    var ok = await U.preguntar('Borrar la ficha',
      '<p>Se borra la ficha huérfana de <strong>' + U.escapar(clave) + '</strong>.</p>' +
      '<p class="nota">' + U.escapar(resumenNotas(ficha)) + '</p>' +
      '<p class="nota">Antes de borrar se guarda una copia de asuntos.json en ' +
      '_GESTOR/copias, así que se puede recuperar a mano si hiciera falta.</p>', 'Borrar');
    if (!ok) return;
    try {
      await App.guardarRegistroFresco(function (registro) {
        delete registro.asuntos[clave];
      });
      U.aviso('Ficha borrada.', 'bueno');
      await App.pintarAjustes();
    } catch (e) {
      U.aviso('No he podido borrarla: ' + e.message, 'malo');
    }
  }

  /* ---------- el bloque de Ajustes ---------- */

  function bloqueDeAjustes() {
    var ya = $('bloque-huerfanas');
    if (ya) return ya;
    /* 17-sep-2026, fila 39: este bloque vive en la pestaña
       "Mantenimiento", no en la pantalla de Ajustes entera. */
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-huerfanas';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Fichas sin carpeta</span>' +
        '<span class="bloque-pie" id="huerfanas-pie">Cuando una carpeta se ha renombrado o movido a mano</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">La ficha de un asunto (su estado, sus notas, su guía) se guarda con ' +
        'el nombre exacto de su carpeta. Si alguien renombra o mueve una carpeta desde el ' +
        'explorador de archivos, en vez de desde "Editar", la ficha se queda huérfana: sigue en ' +
        '<code>asuntos.json</code> pero no se ve en ningún lado. Aquí se puede enlazar con la ' +
        'carpeta que le corresponda, o borrarla si ya no hace falta.</p>' +
        '<div id="tabla-huerfanas" class="lista"></div>' +
      '</div>';
    pantalla.appendChild(d);
    return d;
  }

  function puntoDeLaBarra() {
    var boton = document.querySelector('.pestana[data-pantalla="ajustes"]');
    if (!boton) return null;
    var punto = boton.querySelector('#punto-huerfanas');
    if (punto) return punto;
    punto = document.createElement('span');
    punto.id = 'punto-huerfanas';
    punto.className = 'punto-ambar oculto';
    punto.title = 'Hay fichas sin carpeta';
    boton.appendChild(punto);
    return punto;
  }

  App.pintarFichasHuerfanas = async function () {
    bloqueDeAjustes();
    var huerfanas = await calcular();

    var punto = puntoDeLaBarra();
    if (punto) punto.classList.toggle('oculto', !huerfanas.length);

    var pie = $('huerfanas-pie');
    if (pie) pie.textContent = huerfanas.length
      ? huerfanas.length + (huerfanas.length === 1 ? ' ficha sin carpeta' : ' fichas sin carpeta')
      : 'Cuando una carpeta se ha renombrado o movido a mano';

    var caja = $('tabla-huerfanas');
    if (!caja) return;
    caja.innerHTML = '';
    if (!huerfanas.length) {
      caja.innerHTML = '<div class="vacio">Ninguna. Todas las fichas tienen su carpeta.</div>';
      return;
    }
    huerfanas.forEach(function (clave) {
      var ficha = App.E.registro.asuntos[clave] || {};
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(clave) + '</span>' +
        '<span class="suave" style="flex:1">' +
        U.escapar((ficha.situacion || 'Sin estado') + '  ·  ' + resumenNotas(ficha)) + '</span>';

      var enlazarBtn = document.createElement('button');
      enlazarBtn.className = 'boton';
      enlazarBtn.textContent = 'Enlazar con una carpeta';
      enlazarBtn.onclick = function () { enlazar(clave); };
      f.appendChild(enlazarBtn);

      var borrarBtn = document.createElement('button');
      borrarBtn.className = 'boton boton-peligro';
      borrarBtn.textContent = 'Borrar la ficha';
      borrarBtn.onclick = function () { borrar(clave, ficha); };
      f.appendChild(borrarBtn);

      caja.appendChild(f);
    });
  };
})();
