/* ============================================================
   documentos-sueltos.js — lo que llega y lo que se archiva.

   Un fichero suelto en la carpeta de asuntos abiertos es trabajo que
   todavía no tiene carpeta: casi siempre, algo que ha dejado ahí el
   equipo directivo. Se enseñan arriba del todo, y los que llegan con
   la aplicación abierta se marcan como nuevos.

   Aquí están también la vigilancia que mira cada poco si ha llegado
   alguno, y el archivado y la reapertura de asuntos.
   ============================================================ */

App.pintarSueltos = async function () {
  var q = U.normalizar($('buscar-abiertos').value);
  var lista = App.E.sueltos.filter(function (s) {
    return !q || U.normalizar(s.nombre).indexOf(q) !== -1;
  });

  var cuantosNuevos = Object.keys(App.E.reciales).length;
  $('btn-sueltos-visto').classList.toggle('oculto', !cuantosNuevos);
  var rotulo = $('nuevos-sueltos');
  rotulo.textContent = cuantosNuevos === 1 ? '1 nuevo' : cuantosNuevos + ' nuevos';
  rotulo.classList.toggle('oculto', !cuantosNuevos);
  App.pintarCuentas();

  /* Saber la fecha de cada documento obliga a abrirlo, así que solo se
     hace cuando esta lista está a la vista. */
  if (App.E.vista !== 'clasificar') return;

  var caja = $('lista-sueltos');
  caja.innerHTML = '';
  if (!lista.length) {
    caja.innerHTML = '<div class="vacio">' + (App.E.sueltos.length
      ? 'Ningún documento coincide con lo que buscas.'
      : 'No hay documentos sueltos. Todo lo que ha llegado está ya dentro de su asunto.') +
      '</div>';
    return;
  }

  var conFecha = lista.length <= 40;
  for (var i = 0; i < lista.length; i++) {
    var s = lista[i];
    var pie = '';
    if (conFecha) {
      try {
        var f = await s.handle.getFile();
        var d = new Date(f.lastModified);
        pie = isNaN(d.getTime()) ? ''
            : 'Puesto ahí el ' + d.toLocaleDateString('es-ES') + ' a las ' +
              String(d.getHours()).padStart(2, '0') + ':' +
              String(d.getMinutes()).padStart(2, '0');
      } catch (e) { pie = ''; }
    }
    caja.appendChild(App.tarjetaSuelto(s, pie, !!App.E.reciales[s.nombre]));
  }
};

App.tarjetaSuelto = function (s, pie, esNuevo) {
  var div = document.createElement('div');
  div.className = 'tarjeta tarjeta-suelto' + (esNuevo ? ' tarjeta-nueva' : '');
  var ext = Nombres.extensionDe(s.nombre);
  div.innerHTML = App.ICONO_DOCUMENTO +
    '<div class="tarjeta-texto">' +
      '<div class="tarjeta-nombre">' +
        (esNuevo ? '<span class="marca-nueva">NUEVO</span>' : '') +
        (ext ? '<span class="marca-ext">' + U.escapar(ext.toUpperCase()) + '</span>' : '') +
        U.escapar(s.nombre) +
      '</div>' +
      '<div class="tarjeta-pie">' + U.escapar(pie) + '</div>' +
    '</div>';

  var acciones = document.createElement('div');
  acciones.className = 'acciones';

  var ver = document.createElement('button');
  ver.className = 'boton';
  ver.textContent = 'Abrir';
  ver.title = 'Lo abre en otra pestaña para verlo';
  ver.onclick = function () { App.abrirSuelto(s); };
  acciones.appendChild(ver);

  var crear = document.createElement('button');
  crear.className = 'boton boton-principal';
  crear.textContent = 'Crear asunto con él';
  crear.onclick = function () { App.empezarAsuntoCon(s); };
  acciones.appendChild(crear);

  var meter = document.createElement('button');
  meter.className = 'boton';
  meter.textContent = 'Meter en un asunto';
  meter.title = 'Para cuando este documento es de un asunto que ya existe';
  meter.onclick = function () { App.meterSueltoEnAsunto(s); };
  acciones.appendChild(meter);

  div.appendChild(acciones);
  return div;
};

/* ---------- meter un documento suelto en un asunto que ya existe ----------

   Las dos piezas que hacen falta ya existen y se usan juntas al crear
   un asunto desde un documento suelto (js/asuntos-nuevo.js):
   Carpetas.moverFichero y, justo después, App.verDocumentos para abrir
   el cuadro de ponerle nombre. Aquí es igual, sin crear la carpeta. */
(function () {

  /* Lo único que se sabe de un documento suelto es el nombre de su
     fichero: sin extensión, sin la fecha AAMMDD si la trae delante y
     sin un código de registro de Séneca (26EM1234), que tampoco dicen
     nada del asunto al que pertenece. */
  function limpiarNombreDeSuelto(nombre) {
    var sinExt = String(nombre || '').replace(/\.[A-Za-z0-9]{1,8}$/, '');
    sinExt = sinExt.replace(/^\d{6}\s+/, '');
    sinExt = sinExt.replace(/^\d{2}[ES][MA]\d{4,6}\s+/i, '');
    return sinExt;
  }

  function puntuarAsuntoParaSuelto(nombreFichero, asunto) {
    var limpio = limpiarNombreDeSuelto(nombreFichero);
    var nombreAsuntoNorm = U.normalizar(asunto.nombre);
    var puntos = 0;

    ElegirAsunto.palabrasUtilesDe(limpio).forEach(function (p) {
      if (nombreAsuntoNorm.indexOf(p) !== -1) puntos += 10;
    });

    var tercero = ElegirAsunto.terceroDe(asunto);
    if (tercero && U.normalizar(limpio).indexOf(U.normalizar(tercero)) !== -1) puntos += 40;

    if (!asunto.archivado) puntos += 15;
    if (ElegirAsunto.creadoOMovidoHaceMenosDe30Dias(asunto)) puntos += 10;

    return puntos;
  }

  /* Mueve el documento a la carpeta del asunto y abre el cuadro de
     ponerle nombre. Si algo falla, el documento se queda en Por
     clasificar: nunca se pierde. */
  async function moverSueltoAAsunto(s, carpetaDestino, nombreAsunto) {
    var ruta = nombreAsunto + '/' + s.nombre;
    if (ruta.length > App.LARGO_MAXIMO_NOMBRE) {
      var seguir = await U.preguntar('El nombre es muy largo',
        '<p>La ruta de destino tendría ' + ruta.length + ' caracteres:</p>' +
        '<p class="nota">' + U.escapar(ruta) + '</p>' +
        '<p>Las rutas muy largas dan problemas en un Dropbox sincronizado.</p>', 'Meterlo igual');
      if (!seguir) return;
    }

    try {
      var yaEsta = await Carpetas.ficheros(carpetaDestino);
      var repetido = yaEsta.some(function (f) { return f.nombre === s.nombre; });
      if (repetido) {
        U.aviso('Ya hay un documento llamado "' + s.nombre + '" en ese asunto. Sigue en Por clasificar.', 'malo');
        return;
      }

      await Carpetas.moverFichero(App.E.abiertos, s.nombre, carpetaDestino);
      delete App.E.reciales[s.nombre];
      App.actualizarTitulo();
      U.aviso('Documento metido en el asunto.', 'bueno');
      await App.verAbiertos();

      var recien = App.E.listaAbiertos.filter(function (a) { return a.nombre === nombreAsunto; })[0];
      if (recien) await App.verDocumentos(recien);
    } catch (e) {
      U.aviso('El documento no ha podido entrar en el asunto. Sigue en Por clasificar: ' + e.message, 'malo');
    }
  }

  App.meterSueltoEnAsunto = async function (s) {
    var res = await ElegirAsunto.abrir({
      titulo: 'Meter en un asunto',
      calcularPuntuacion: function (a) { return puntuarAsuntoParaSuelto(s.nombre, a); }
    });
    if (res.accion !== 'elegido') return;
    var asunto = res.asunto;

    if (!asunto.archivado) {
      await moverSueltoAAsunto(s, asunto.handle, asunto.nombre);
      return;
    }

    var eleccion = await ElegirAsunto.preguntarSiReabrir(asunto.nombre);
    if (!eleccion) return;

    if (eleccion === 'sin-reabrir') {
      await moverSueltoAAsunto(s, asunto.handle, asunto.nombre);
      return;
    }

    await App.reabrirAsunto({ nombre: asunto.nombre, padre: asunto.padre });
    var reabierto = await Carpetas.existe(App.E.abiertos, asunto.nombre);
    if (!reabierto) return;   /* canceló el segundo aviso, o ha fallado */
    var carpetaDestino = await App.E.abiertos.getDirectoryHandle(asunto.nombre);
    await moverSueltoAAsunto(s, carpetaDestino, asunto.nombre);
  };

})();

App.abrirSuelto = async function (s) {
  try {
    var f = await s.handle.getFile();
    var url = URL.createObjectURL(f);
    window.open(url, '_blank');
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  } catch (e) {
    U.aviso('No he podido abrir el documento: ' + e.message, 'malo');
  }
};

App.empezarAsuntoCon = function (s) {
  App.E.pendiente = s;
  delete App.E.reciales[s.nombre];
  App.actualizarTitulo();
  App.ir('nuevo');
};

App.pintarPendiente = function () {
  var caja = $('aviso-pendiente');
  if (!App.E.pendiente) { caja.classList.add('oculto'); caja.innerHTML = ''; return; }
  caja.classList.remove('oculto');
  caja.innerHTML = '<strong>Este asunto se crea con un documento.</strong>' +
    '<p>' + U.escapar(App.E.pendiente.nombre) + ' se meterá dentro de la carpeta nueva. ' +
    'Después se abrirá el cuadro para ponerle el nombre.</p>';
  var b = document.createElement('button');
  b.className = 'boton';
  b.textContent = 'Dejarlo donde está';
  b.onclick = function () { App.E.pendiente = null; App.pintarPendiente(); };
  caja.appendChild(b);
};

$('btn-sueltos-visto').onclick = function () {
  App.E.reciales = {};
  App.actualizarTitulo();
  App.pintarSueltos();
};

/* ---------- mirar cada poco si ha llegado algo ----------

   El navegador no avisa solo cuando aparece un fichero, así que hay
   que ir a mirar. Solo se leen los nombres de la carpeta, no se abre
   nada, y por eso no se nota aunque haya cientos de asuntos.

   Mientras la pestaña esté cerrada no hay aviso: esto solo funciona
   con la aplicación abierta. */
App.mirando = false;

App.vigilarLaCarpeta = function () {
  setInterval(App.mirarLaCarpeta, App.SEGUNDOS_ENTRE_MIRADAS * 1000);
  window.addEventListener('focus', App.mirarLaCarpeta);
};

App.mirarLaCarpeta = async function () {
  if (!App.E.abiertos || App.mirando) return;
  if ($('aplicacion').classList.contains('oculto')) return;
  App.mirando = true;
  try {
    var hay = await Carpetas.contenido(App.E.abiertos);

    var antes = App.E.sueltos.map(function (f) { return f.nombre; });
    var ahora = hay.ficheros
      .filter(function (f) { return App.esDocumentoDeTrabajo(f.nombre); })
      .map(function (f) { return f.nombre; });
    var llegados = ahora.filter(function (n) { return antes.indexOf(n) === -1; });

    var carpetasAntes = App.E.listaAbiertos.map(function (a) { return a.nombre; }).join('|');
    var carpetasAhora = hay.carpetas
      .filter(function (c) { return c.nombre.charAt(0) !== '_'; })
      .map(function (c) { return c.nombre; }).join('|');

    var algoCambia = llegados.length || antes.length !== ahora.length ||
                     carpetasAntes !== carpetasAhora;
    if (!algoCambia) return;

    llegados.forEach(function (n) { App.E.reciales[n] = true; });
    await App.verAbiertos(hay);

    if (llegados.length === 1) {
      U.aviso('Ha llegado un documento nuevo: ' + llegados[0], 'bueno');
    } else if (llegados.length > 1) {
      U.aviso('Han llegado ' + llegados.length + ' documentos nuevos.', 'bueno');
    }
  } catch (e) {
    /* Si se ha perdido el permiso sobre la carpeta, ya se verá al
       pulsar cualquier botón. Aquí no se molesta al usuario. */
  } finally {
    App.mirando = false;
  }
};

/* El contador de la pestaña del navegador, para enterarse aunque se
   esté trabajando en otra ventana. */
App.actualizarTitulo = function () {
  var n = Object.keys(App.E.reciales).length;
  document.title = n ? '(' + n + ') ' + App.TITULO : App.TITULO;
};

/* ---------- archivar un asunto ---------- */

App.cerrarAsunto = async function (a) {
  var categoria = a.ficha.categoria || a.leido.categoria || '';
  var tercero = a.ficha.tercero || '';

  if (!categoria || !tercero) {
    var opciones = Nombres.CATEGORIAS.map(function (c) {
      return '<option value="' + c + '"' + (c === categoria ? ' selected' : '') + '>' + c + '</option>';
    }).join('');
    var ok = await U.preguntar('¿Dónde va esta carpeta?',
      '<p class="explica">Este asunto no lo creó la aplicación, así que hace falta saber ' +
      'en qué parte del archivo va.</p>' +
      '<label class="etiqueta">Categoría</label>' +
      '<select id="cierre-categoria" class="campo">' + opciones + '</select>' +
      '<label class="etiqueta">Carpeta del tercero</label>' +
      '<input id="cierre-tercero" class="campo" value="' + U.escapar(Nombres.terceroDeResto(a.leido.resto)) + '">' +
      '<p class="nota">Se creará dentro de la categoría si todavía no existe.</p>',
      'Continuar');
    if (!ok) return;
    categoria = $('cierre-categoria').value;
    tercero = U.limpiarNombre($('cierre-tercero').value);
    if (!tercero) { U.aviso('Hace falta el nombre de la carpeta del tercero.', 'malo'); return; }
  }

  var confirmar = await U.preguntar('Archivar el asunto',
    '<p>Se llevará la carpeta a:</p>' +
    '<div class="vista-previa"><div class="vista-nombre">' +
      U.escapar(App.E.archivo.name + ' / ' + categoria + ' / ' + tercero) +
    '</div></div>' +
    '<p class="nota">Se copia primero y se comprueba que ha llegado todo. ' +
    'Si algo falla, la carpeta se queda donde está.</p>', 'Archivar el asunto');
  if (!confirmar) return;

  try {
    var destino = await Carpetas.bajar(App.E.archivo, [categoria, tercero], true);
    var n = await Carpetas.mover(App.E.abiertos, a.nombre, destino);
    await App.anotar(a.nombre, {
      estado: 'cerrado', categoria: categoria, tercero: tercero,
      cerradoEl: U.ahora(), cerradoPor: App.E.usuario, ficheros: n
    });
    U.aviso('Asunto archivado.', 'bueno');
    await App.verAbiertos();
  } catch (e) {
    U.aviso('No se ha podido archivar: ' + e.message, 'malo');
  }
};

/* ---------- reabrir ---------- */

App.reabrirAsunto = async function (a) {
  var confirmar = await U.preguntar('Reabrir el asunto',
    '<p>La carpeta volverá a <strong>' + U.escapar(App.E.abiertos.name) + '</strong>.</p>',
    'Reabrir');
  if (!confirmar) return;
  try {
    await Carpetas.mover(a.padre, a.nombre, App.E.abiertos);
    await App.anotar(a.nombre, { estado: 'abierto', reabiertoEl: U.ahora(), reabiertoPor: App.E.usuario });
    U.aviso('Asunto reabierto.', 'bueno');
    await App.verAbiertos();
    await App.verArchivo();
  } catch (e) {
    U.aviso('No se ha podido reabrir: ' + e.message, 'malo');
  }
};
