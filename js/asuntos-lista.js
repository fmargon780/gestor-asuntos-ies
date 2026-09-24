/* ============================================================
   asuntos-lista.js — la pantalla de asuntos abiertos.

   Las tres tarjetas de arriba, las tarjetas por tipo de asunto que
   salen dentro de dos de ellas, el orden, los filtros y la tarjeta de
   cada asunto. También el estado, la vía de comunicación y la fecha
   límite, que son los tres datos que se cambian desde la propia
   tarjeta sin abrir nada.

   Fila 133 (docs/PARTIR-FICHEROS-GRANDES.md): partido por temas, sin
   cambiar nada de lo que hace. Aquí, leer la carpeta, el orden, la
   fecha límite y la vía; las tres tarjetas de arriba, los montones por
   tipo, a qué montón va cada asunto y el filtro, en
   js/asuntos-lista-montones.js; pintar la lista y la tarjeta de cada
   asunto, en js/asuntos-lista-pintar.js. Se cargan en ese orden.
   ============================================================ */

/* Se lee la carpeta entera de una vez: las carpetas son los asuntos,
   y los ficheros sueltos son trabajo que todavía no tiene carpeta. */
/* El último que empieza gana (fila 101): si mientras se lee la carpeta
   arranca otro App.verAbiertos, el viejo no toca nada y espera al
   nuevo (así quien lo llamó sigue encontrando la lista ya al día). */
App.turnoVerAbiertos = 0;
App.promesaVerAbiertos = null;

App.verAbiertos = function (yaLeido) {
  var p = App.verAbiertosPorTurno(yaLeido);
  App.promesaVerAbiertos = p;
  return p;
};

App.verAbiertosPorTurno = async function (yaLeido) {
  var turno = ++App.turnoVerAbiertos;
  var hay = yaLeido || await Carpetas.contenido(App.E.abiertos);
  if (turno !== App.turnoVerAbiertos) return App.promesaVerAbiertos;

  App.E.listaAbiertos = hay.carpetas
    .filter(function (c) {
      if (c.nombre.charAt(0) === '_') return false;
      if (App.E.registro.asuntos[c.nombre]) return true;
      return !Carpetas.esCarpetaTemporalDeSincronizacion(c.nombre);
    })
    .map(function (c) {
      var leido = Nombres.leer(c.nombre, App.E.tipos);
      var ficha = App.E.registro.asuntos[c.nombre] || {};
      /* Las notas entran en la búsqueda (fila 73,
         docs/BUSCAR-EN-LAS-NOTAS.md): buscaSinNotas se queda aparte
         para saber, al buscar, si una palabra solo aparece por una
         nota (y entonces enseñar el trocito de la nota, punto 2.3). */
      /* Los dos nombres del tipo, el largo y el corto (fila 97): la
         carpeta solo lleva uno de los dos. */
      var buscaSinNotas = U.normalizar(c.nombre + ' ' +
        (leido.tipo ? Nombres.nombresDeTipo(leido.tipo, App.E.tipos).join(' ') : ''));
      var notasTexto = window.Notas ? Notas.textoParaBuscar(ficha) : '';
      return { nombre: c.nombre, handle: c.handle, leido: leido, ficha: ficha,
               buscaSinNotas: buscaSinNotas, notasTexto: notasTexto,
               busca: buscaSinNotas + ' ' + U.normalizar(notasTexto) };
    });

  App.E.sueltos = hay.ficheros.filter(function (f) { return App.esDocumentoDeTrabajo(f.nombre); });

  /* Un documento que ya se ha metido en su carpeta deja de estar recién
     llegado: se quita del contador de la pestaña del navegador. */
  Object.keys(App.E.reciales).forEach(function (n) {
    var sigue = App.E.sueltos.some(function (f) { return f.nombre === n; });
    if (!sigue) delete App.E.reciales[n];
  });
  App.actualizarTitulo();

  $('cuenta-abiertos').textContent = App.E.listaAbiertos.length || '';
  App.pintarFiltroEstado();
  App.pintarCuentas();
  App.pintarAbiertos();
  await App.pintarSueltos();
};

/* Windows y Dropbox dejan por ahí ficheros suyos que no son trabajo
   de nadie, y Word deja los temporales que empiezan por ~$. */
App.FICHEROS_DEL_SISTEMA = ['desktop.ini', 'thumbs.db', '.ds_store', 'icon\r'];

App.esDocumentoDeTrabajo = function (nombre) {
  var n = String(nombre || '');
  if (!n) return false;
  if (n.charAt(0) === '.' || n.charAt(0) === '_') return false;
  if (n.indexOf('~$') === 0) return false;
  if (App.FICHEROS_DEL_SISTEMA.indexOf(n.toLowerCase()) !== -1) return false;
  return true;
};

/* Cómo se ordenan los asuntos abiertos.

   Por defecto, del más antiguo al más reciente: lo que lleva más
   tiempo abierto es lo que hay que mirar primero. El orden elegido se
   recuerda en este ordenador. */
App.ORDENES = {
  'fecha-asc':  function (a, b) { return App.claveDeFecha(a.leido.fecha) < App.claveDeFecha(b.leido.fecha) ? -1 : 1; },
  'fecha-desc': function (a, b) { return App.claveDeFecha(a.leido.fecha) > App.claveDeFecha(b.leido.fecha) ? -1 : 1; },
  'tipo':       function (a, b) { return App.textoDeOrden(a, 'tipo') < App.textoDeOrden(b, 'tipo') ? -1 : 1; },
  'tercero':    function (a, b) { return App.textoDeOrden(a, 'tercero') < App.textoDeOrden(b, 'tercero') ? -1 : 1; },
  'estado':     function (a, b) {
    var d = App.posEstado(a) - App.posEstado(b);
    if (d) return d;
    return App.claveDeFecha(a.leido.fecha) < App.claveDeFecha(b.leido.fecha) ? -1 : 1;
  },
  /* Lo que antes vence, arriba. Los que no tienen fecha límite van al
     final: no urgen, pero siguen estando. */
  'limite':     function (a, b) {
    var ka = a.ficha.limite || '9999-99-99';
    var kb = b.ficha.limite || '9999-99-99';
    if (ka !== kb) return ka < kb ? -1 : 1;
    return App.claveDeFecha(a.leido.fecha) < App.claveDeFecha(b.leido.fecha) ? -1 : 1;
  }
};

/* Por dónde va el asunto (fila 129: su hito actual). Primero los que
   van por el principio; los listos para archivar y los sin hitos, al
   final. */
App.posEstado = function (a) {
  var l = App.ladoDe(a);
  if (l.sinHitos) return 9999;
  if (l.listo) return 1000;
  return Math.round(100 * (l.n || 0) / Math.max(l.m || 1, 1));
};

/* Un asunto sin fecha en el nombre se va al final en los dos sentidos. */
App.claveDeFecha = function (fecha) {
  return /^\d{6}$/.test(fecha) ? fecha : '999999';
};

App.textoDeOrden = function (a, cual) {
  if (cual === 'tipo') return U.normalizar(a.leido.tipo || 'zzz');
  return U.normalizar(a.ficha.tercero || a.leido.resto || 'zzz');
};

/* ---------- la fecha límite de un asunto ----------

   Las cuentas y los textos están en plazos.js. Aquí solo queda lo que
   necesita saber de los tipos y de las fichas de los asuntos. */

/* Los días de plazo que el centro le ha puesto a un tipo en Ajustes.
   Devuelve null si ese tipo no tiene plazo. */
App.plazoDeTipo = function (nombreTipo) {
  for (var i = 0; i < App.E.tipos.length; i++) {
    if (App.E.tipos[i].tipo === nombreTipo) {
      var n = parseInt(App.E.tipos[i].plazo, 10);
      return (!isNaN(n) && n > 0) ? n : null;
    }
  }
  return null;
};

/* El plazo de un asunto, ya masticado. Null si no tiene fecha límite. */
App.plazoDe = function (a) {
  return Plazos.de((a.ficha && a.ficha.limite) || '');
};

/* Cuadro para poner, cambiar o quitar la fecha límite de un asunto que
   ya está abierto. */
/* `control` (opcional, fila 100): el botón que lo abrió, en
   «Guardando…» solo mientras se guarda, no con el cuadro abierto. */
App.editarPlazo = async function (a, control) {
  var p = App.plazoDe(a);
  var delTipo = App.plazoDeTipo(a.leido.tipo || (a.ficha && a.ficha.tipo) || '');
  var sugerida = '';
  if (!p && delTipo && a.ficha && a.ficha.abiertoEl) {
    sugerida = Plazos.sumarDias(String(a.ficha.abiertoEl).slice(0, 10), delTipo);
  }

  var ok = await U.preguntar('Fecha límite del asunto',
    '<p class="explica">Hasta cuándo hay de plazo para resolverlo. ' +
    'No sale en el nombre de la carpeta: se guarda en la carpeta del centro ' +
    'y lo ve todo el que abra la aplicación.</p>' +
    '<label class="etiqueta">Fecha límite</label>' +
    '<input id="plazo-fecha" type="date" class="campo" value="' +
    U.escapar(p ? p.limite : sugerida) + '">' +
    (delTipo ? '<p class="nota">El tipo ' + U.escapar(a.leido.tipo || '') +
               ' tiene ' + delTipo + ' días de plazo en Ajustes.</p>' : '') +
    '<p class="nota">Déjala en blanco para que el asunto se quede sin plazo.</p>',
    'Guardar');
  if (!ok) return;

  var valor = $('plazo-fecha').value;
  try {
    await U.mientrasGuarda(control || null, function () {
      return App.anotar(a.nombre, {
        limite: valor,
        limiteEl: U.ahora(),
        limitePor: App.E.usuario
      });
    });
  } catch (e) {
    U.fallo('No he podido guardarla', e);
    return;
  }
  U.aviso(valor ? 'Fecha límite guardada.' : 'Asunto sin fecha límite.', 'bueno');
  try { App.pintarAbiertos(); }
  catch (e2) { U.accesorio('Fecha guardada, pero no he podido repintar la lista', e2); }
};

App.nombreVia = function (clave) {
  var v = Nombres.via(clave);
  return v ? v.texto : (clave || '');
};

/* "Teléfono: 600 11 22 33", para el pie de la tarjeta. */
App.textoVia = function (ficha) {
  if (!ficha || !ficha.via) return '';
  var n = App.nombreVia(ficha.via);
  return ficha.viaDato ? n + ': ' + ficha.viaDato : n;
};


/* Cuadro para apuntar por dónde prefiere hablar el tercero EN ESTE
   asunto. Se guarda en la carpeta del centro, así que lo ve todo el
   que abra la aplicación sobre ella. */
App.editarVia = async function (a) {
  var actual = a.ficha.via || '';
  var opciones = '<option value="">Sin indicar</option>' +
    Nombres.VIAS.map(function (v) {
      return '<option value="' + v.clave + '"' + (v.clave === actual ? ' selected' : '') +
             '>' + U.escapar(v.texto) + '</option>';
    }).join('');

  var ok = await U.preguntar('Vía de comunicación preferente',
    '<p class="explica">Es solo de este asunto. Los datos de siempre de la persona ' +
    'están en su ficha; aquí va lo que haya dicho para esta gestión.</p>' +
    '<label class="etiqueta">Por dónde prefiere que le hablemos</label>' +
    '<select id="via-clave" class="campo">' + opciones + '</select>' +
    '<label class="etiqueta">Teléfono, correo o aclaración <span class="suave">(opcional)</span></label>' +
    '<input id="via-dato" class="campo" value="' + U.escapar(a.ficha.viaDato || '') + '" ' +
    'placeholder="Por ejemplo: 600 11 22 33">',
    'Guardar');
  if (!ok) return;

  try {
    await App.anotar(a.nombre, {
      via: $('via-clave').value,
      viaDato: $('via-dato').value.trim(),
      viaEl: U.ahora(),
      viaPor: App.E.usuario
    });
    App.pintarAbiertos();
    App.pintarArchivo();
    U.aviso('Vía de comunicación guardada.', 'bueno');
  } catch (e) {
    U.aviso('No he podido guardarla: ' + U.mensajeDeError(e), 'malo');
  }
};
