/* ============================================================
   nucleo-tipos.js — los ficheros rotos al entrar, los tipos, los campos y el registro (fila 536: trozo de js/nucleo.js, que sigue siendo el que
   explica el conjunto; mismo código, solo cambia de fichero). Se carga
   justo después de nucleo.js.
   ============================================================ */

/* ==========================================================
   FICHEROS ROTOS, AL ENTRAR
   ========================================================== */

/* Si alguno de los ficheros compartidos no se puede leer, no se
   entra: se avisa en rojo, con un botón para restaurar la última copia
   de cada uno. Ver js/copias.js. */
App.avisoFicherosRotos = function (rotos) {
  var caja = $('aviso-roto');
  caja.classList.remove('oculto');
  caja.innerHTML = '<strong>' +
    (rotos.length === 1 ? 'Un fichero no se puede leer.' : rotos.length + ' ficheros no se pueden leer.') +
    '</strong><p>Puede ser un corte a media escritura, o un conflicto de la nube mal resuelto ' +
    'a mano. No se entra para no escribir encima de nada. Restaura la última copia de cada uno:</p>';

  var lista = document.createElement('ul');
  lista.className = 'lista-repetidos';
  rotos.forEach(function (nombre) {
    var li = document.createElement('li');
    li.textContent = nombre + '  ';
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.textContent = 'Restaurar la última copia';
    b.onclick = async function () {
      b.disabled = true;
      try {
        var ok = await Copias.restaurar(App.E.gestor, nombre);
        if (ok) {
          U.aviso(nombre + ' restaurado.', 'bueno');
          li.appendChild(document.createTextNode('  restaurado ✓'));
          b.remove();
        } else {
          U.aviso('No hay ninguna copia de ' + nombre + ' todavía.', 'malo');
          b.disabled = false;
        }
      } catch (e) {
        U.aviso('No he podido restaurar ' + nombre + ': ' + U.mensajeDeError(e), 'malo');
        b.disabled = false;
      }
    };
    li.appendChild(b);
    lista.appendChild(li);
  });
  caja.appendChild(lista);

  var reintentar = document.createElement('button');
  reintentar.type = 'button';
  reintentar.className = 'boton boton-principal';
  reintentar.textContent = 'Volver a intentar entrar';
  reintentar.onclick = function () { $('btn-entrar').click(); };
  caja.appendChild(reintentar);
};

/* ==========================================================
   CONFIGURACIÓN COMPARTIDA (_GESTOR)
   ========================================================== */

App.cargarTipos = async function () {
  var t = await Carpetas.leerJson(App.E.gestor, App.FICHERO_TIPOS);
  if (!t || !t.length) {
    t = Nombres.POR_DEFECTO.slice();
    await Copias.guardar(App.E.gestor, App.FICHERO_TIPOS, t);
  }
  App.E.tipos = t;
};

/* Fila 422 (docs/DESACTIVAR-UN-TIPO.md): un tipo desactivado lleva
   `desactivado: true` en tipos.json; sin ese dato, está activo. Sigue
   existiendo para todo lo que ya lo usa (asuntos, ajustes, búsquedas),
   pero no se ofrece para asuntos nuevos ni cambiados: todos los sitios
   donde se ELIGE un tipo piden la lista a `App.tiposParaElegir`. */
App.tipoDesactivado = function (t) {
  return !!(t && t.desactivado);
};

App.tiposParaElegir = function () {
  return (App.E.tipos || []).filter(function (t) { return !t.desactivado; });
};

App.cargarTiposDocumento = async function () {
  var t = await Carpetas.leerJson(App.E.gestor, App.FICHERO_TIPOS_DOC);
  if (!t || !t.length) {
    t = Nombres.TIPOS_DOCUMENTO_POR_DEFECTO.slice();
    await Copias.guardar(App.E.gestor, App.FICHERO_TIPOS_DOC, t);
  }
  App.E.tiposDocumento = t;
};

App.guardarTiposDocumento = async function () {
  App.E.tiposDocumento.sort();
  App.E.tiposDocumento = await App.fusionarConDisco(
    App.FICHERO_TIPOS_DOC, App.E.tiposDocumento, function (x) { return x; });
  App.E.tiposDocumento = await Borrados.filtrarActivos(
    App.E.gestor, 'tiposDocumento', App.E.tiposDocumento, function (x) { return x; });
  App.E.tiposDocumento.sort();
  await Copias.guardar(App.E.gestor, App.FICHERO_TIPOS_DOC, App.E.tiposDocumento);
};

/* Los campos de cada tipo de asunto (js/campos.js). No hace falta
   fusionar con el disco al arrancar: se relee entero cada vez que se
   necesita de verdad (al abrir el cuadro de Campos en Ajustes, o al
   guardar), que es donde de verdad importa no pisar al otro
   ordenador. Aquí solo se deja preparado para el resto de pantallas
   (Nuevo asunto, Editar, la ficha del asunto), que lo leen de memoria. */
App.cargarCampos = async function () {
  App.E.campos = await Campos.leer(App.E.gestor);
};

/* Se relee el fichero justo antes de escribirlo, por si el compañero ha
   añadido algo desde el otro ordenador mientras tanto: lo que él tenga
   y nosotros no, se suma a lo nuestro. Esta función, por sí sola, no
   detecta sus borrados (si él ha quitado algo y nosotros todavía lo
   tenemos en memoria, volvería a aparecer): quien la llama para
   guardar tipos, estados, tipos de documento o recurrentes pasa el
   resultado por Borrados.filtrarActivos (js/borrados-fusion.js,
   20-sep-2026, fila 77) justo después, que es donde de verdad se
   respeta un borrado hecho desde otro ordenador. 'clave' dice cómo se
   identifica cada elemento de la lista. */
App.fusionarConDisco = async function (fichero, listaLocal, clave) {
  var disco;
  try { disco = await Carpetas.leerJson(App.E.gestor, fichero); }
  catch (e) { return listaLocal; }
  if (!disco || !disco.length) return listaLocal;
  var claves = {};
  listaLocal.forEach(function (x) { claves[clave(x)] = true; });
  var extra = disco.filter(function (x) { return !claves[clave(x)]; });
  return listaLocal.concat(extra);
};

/* Los estados de tramitación escritos a mano ya no existen (fila 129: el
   estado del asunto es su hito actual; fila 132: fuera su código).
   `estados.json` se queda en el Dropbox, sin tocar; solo lo lee una vez
   js/estado-migracion.js. */

App.guardarTipos = async function () {
  App.E.tipos = await App.fusionarConDisco(
    App.FICHERO_TIPOS, App.E.tipos, function (t) { return t.tipo; });
  App.E.tipos = await Borrados.filtrarActivos(
    App.E.gestor, 'tipos', App.E.tipos, function (t) { return t.tipo; });
  App.E.tipos.sort(function (a, b) {
    var ka = a.categoria + ' ' + a.tipo, kb = b.categoria + ' ' + b.tipo;
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
  await Copias.guardar(App.E.gestor, App.FICHERO_TIPOS, App.E.tipos);
};

/* Lee asuntos.json. Si llega vacío (no está, o sin asuntos) y la
   última vez que se leyó o se escribió del disco sí tenía asuntos
   (`App.E.asuntosEnDisco`), no se lo cree a la primera: Dropbox puede
   estar cambiando el fichero justo en ese instante. Espera y relee
   (dos veces). Si sigue vacío, lanza un error en vez de devolver un
   registro vacío que el siguiente guardado escribiría encima de todo
   (fila 99, docs/GUARDAR-EN-FILA.md, punto 5.1). */
App.LECTURA_VACIA_ESPERAS_MS = [700, 1500];

App.contarAsuntos = function (r) {
  return (r && r.asuntos) ? Object.keys(r.asuntos).length : 0;
};

App.E.asuntosEnDisco = 0;

App.leerRegistroDelDisco = async function () {
  var enMemoria = App.E.asuntosEnDisco;
  for (var i = 0; ; i++) {
    var r = await Carpetas.leerJson(App.E.gestor, App.FICHERO_ASUNTOS);
    var leido = (r && r.asuntos) ? r : { asuntos: {} };
    if (!enMemoria || App.contarAsuntos(leido)) {
      App.E.asuntosEnDisco = App.contarAsuntos(leido);
      return leido;
    }
    if (i >= App.LECTURA_VACIA_ESPERAS_MS.length) {
      var e = new Error('asuntos.json ha llegado vacío y hace un momento tenía ' + enMemoria +
        ' asuntos. No he guardado nada para no borrarlos. Espera un poco (la nube puede estar ' +
        'sincronizando) y vuelve a intentarlo.');
      e.name = 'LecturaVacia';
      throw e;
    }
    await new Promise(function (ok) { setTimeout(ok, App.LECTURA_VACIA_ESPERAS_MS[i]); });
  }
};

/* Si la lectura llega vacía sin motivo, se queda con lo que había en
   memoria (sin escribir nada) en vez de dejar la lista vacía. */
App.cargarRegistro = async function () {
  try {
    App.E.registro = await App.leerRegistroDelDisco();
  } catch (e) {
    if (e.name !== 'LecturaVacia') throw e;
    console.warn(e.message);
  }
  /* Fila 364: lo que sigue sin guardarse se sigue viendo, y lo de la sesión anterior se recupera. */
  if (window.GuardadoPendiente) await GuardadoPendiente.alCargar(App.E.registro);
};
