/* ============================================================
   conflictos.js — las copias en conflicto que deja Dropbox.

   Dropbox tarda segundos en sincronizar. Si los dos ordenadores del
   centro guardan casi a la vez en el mismo fichero de _GESTOR, Dropbox
   no se inventa nada: deja el fichero de uno como está y deja aparte
   una "copia en conflicto" con el cambio del otro, con un nombre como

     asuntos (copia en conflicto de PC2 2026-09-11).json
     asuntos (PC2's conflicted copy 2026-09-11).json

   Sin este módulo, esas copias se quedan ahí para siempre y nadie las
   mira: el cambio del otro ordenador se pierde en la práctica.

   Al entrar, y cada cinco minutos, se busca en _GESTOR algún fichero
   con "conflicto" o "conflicted" en el nombre.

   - `asuntos.json`, `tablon.json` y `hitos.json` se fusionan solos: son
     los ficheros en los que los dos ordenadores escriben todo el rato,
     y se sabe fusionar por clave (el nombre del asunto, el id de la
     nota o el id del hito) sin perder nada de ninguno de los dos.
   - Los demás (tipos, estados, tipos de documento, guías, recurrentes,
     frescura) se cambian mucho menos, y mezclarlos a ciegas es más
     fácil que se note mal. Ahí se avisa en Ajustes y se deja elegir
     con cuál de los dos quedarse; el que no se elija no se pierde,
     porque los dos se guardan antes en _GESTOR/copias.

   Fila 176 (docs/PARTIR-FICHEROS-GRANDES.md): partido por temas, sin
   cambiar nada de lo que hacía. Aquí, las fusiones automáticas
   (asuntos/hitos/tablon, con las lápidas de la fila 176), el cajón de
   "no se fusionan solos" y su bloque de Ajustes, y la revisión
   principal. Los CSV de terceros, administraciones.json y "los
   terceros se releen solos" viven en js/conflictos-datos.js, que se
   carga justo después y comparte lo necesario por `Conflictos._interno`
   (I). ============================================================ */
(function () {
  /* Lo que usa js/conflictos-datos.js. */
  var I = {};

  var CADA_MS = 5 * 60 * 1000;
  var ultimaRevision = 0;
  var pendientes = [];   /* { real, nombreConflicto } de los que no se fusionan solos */
  I.pendientesPush = function (p) { pendientes.push(p); };
  I.pintarBloque = function () { pintarBloque(); };

  function $(id) { return document.getElementById(id); }

  /* "asuntos (copia en conflicto de PC2 2026-09-11).json"  ->  "asuntos.json"
     "asuntos (PC2's conflicted copy 2026-09-11).json"      ->  "asuntos.json" */
  function ficheroReal(nombreConflicto) {
    var m = nombreConflicto.match(/^(.+?)\s*\([^)]*conflic[^)]*\)\.json$/i);
    return m ? m[1].trim() + '.json' : '';
  }

  /* ---------- fusionar una ficha de asuntos.json ----------

     Se queda con los campos sueltos de la que se haya tocado más tarde
     (por la última nota, o por editadoEl/pasosEl), y con la UNIÓN de
     notas, pasos hechos y pasos elegidos: así no desaparece nada de lo
     que haya apuntado ninguno de los dos ordenadores. */
  function ultimoCambio(f) {
    var notas = (f && f.notas) || [];
    var ultimaNota = notas.length ? notas[notas.length - 1].cuando : '';
    return [f && f.editadoEl, f && f.pasosEl, ultimaNota].filter(Boolean).sort().pop() || '';
  }

  /* Fila 176, punto 1: las listas que hoy funde App.anotarLista se
     unen aquí con la MISMA identidad (App.unirPorIdentidad), en vez de
     quedarse solo con las de la ficha que ganó por fecha: antes de este
     arreglo, un hilo o un relacionado guardado desde el otro ordenador
     justo antes del conflicto se perdía si su ficha no era la elegida. */
  function unirLista(a, b, campo) {
    return App.unirPorIdentidad(a[campo], b[campo], App.IDENTIDAD_LISTA[campo]);
  }

  function fusionarFicha(a, b) {
    a = a || {}; b = b || {};
    var base = (ultimoCambio(a) >= ultimoCambio(b)) ? Object.assign({}, b, a) : Object.assign({}, a, b);

    base.notas = unirLista(a, b, 'notas');

    var hechos = {};
    (a.pasosHechos || []).concat(b.pasosHechos || []).forEach(function (id) { hechos[id] = true; });
    base.pasosHechos = Object.keys(hechos);

    base.pasosElegidos = Object.assign({}, a.pasosElegidos || {}, b.pasosElegidos || {});
    base.hilos = unirLista(a, b, 'hilos');
    base.relacionados = unirLista(a, b, 'relacionados');
    base.pendientesRegistro = unirLista(a, b, 'pendientesRegistro');
    return base;
  }

  async function archivarConflicto(g, nombreConflicto) {
    var copias = await Carpetas.crear(g, 'copias');
    await Carpetas.moverFichero(g, nombreConflicto, copias, nombreConflicto);
  }

  /* Fila 99 (docs/GUARDAR-EN-FILA.md): en la misma fila que los demás
     guardados de asuntos.json, así no cambia App.E.registro a mitad de
     otra acción; y parte de una copia ENTERA del fichero real (antes
     montaba uno nuevo solo con `asuntos` y se perdían `ajustesAvisos`
     y cualquier otro dato de primer nivel). */
  function fusionarAsuntos(g, nombreConflicto) {
    var hacer = function () { return fusionarAsuntosYa(g, nombreConflicto); };
    return window.ColaGuardado ? ColaGuardado.poner(App.FICHERO_ASUNTOS, hacer) : hacer();
  }

  async function fusionarAsuntosYa(g, nombreConflicto) {
    var real, conflicto;
    try {
      real = await Carpetas.leerJson(g, App.FICHERO_ASUNTOS);
      conflicto = JSON.parse(await Carpetas.leerTexto(g, nombreConflicto));
    } catch (e) { return false; }
    if (!conflicto || typeof conflicto.asuntos !== 'object') return false;
    var registroReal = (real && real.asuntos) ? real : { asuntos: {} };

    /* Fila 176, punto 2: una clave con lápida (archivada, a la
       papelera, unida o renombrada) no vuelve, esté en el lado que
       esté: sin esto, un asunto que un ordenador acaba de cerrar
       resucitaba en cuanto la copia en conflicto del otro (que todavía
       lo tenía) se fusionaba. */
    var lapidas = {};
    if (window.Borrados) {
      (await Borrados.leer(g)).asuntos.forEach(function (x) { lapidas[x.clave] = true; });
    }

    var claves = {};
    Object.keys(registroReal.asuntos).forEach(function (k) { claves[k] = true; });
    Object.keys(conflicto.asuntos).forEach(function (k) { claves[k] = true; });

    var fusion = Object.assign({}, conflicto, registroReal, { asuntos: {} });
    /* Fila 178, punto 3: el Object.assign de arriba se queda con el
       _esquema de registroReal (va el último), aunque el de la copia
       en conflicto sea mayor; aquí se corrige al mayor de los dos. */
    fusion._esquema = Math.max(conflicto._esquema || 0, registroReal._esquema || 0);
    Object.keys(claves).forEach(function (k) {
      if (lapidas[k]) return;
      var a = registroReal.asuntos[k], b = conflicto.asuntos[k];
      fusion.asuntos[k] = (a && b) ? fusionarFicha(a, b) : (a || b);
    });

    await Copias.guardar(g, App.FICHERO_ASUNTOS, fusion);
    App.E.registro = fusion;
    App.refrescarFichas();
    await archivarConflicto(g, nombreConflicto);
    return true;
  }

  /* ---------- fusionar hitos.json (16-sep-2026) ----------

     Se unen los asuntos por su clave, y dentro de cada uno los hitos
     por su id, sin repetir (si los dos ordenadores tocaron el MISMO
     hito, se queda con el de este ordenador: no hay más remedio sin
     complicar esto mucho más, y es un caso raro). En `ajustes` solo se
     fusionan las ALTAS de `responsables` y `noLectivos`; los borrados
     no se fusionan, igual que en el resto de listas de _GESTOR. */
  function unirPorId(a, b) {
    var vistos = {}, salida = [];
    (a || []).concat(b || []).forEach(function (x) {
      var id = x && x.id;
      if (!id || vistos[id]) return;
      vistos[id] = true;
      salida.push(x);
    });
    return salida;
  }

  function fusionarHitos(g, nombreConflicto) {
    var hacer = function () { return fusionarHitosYa(g, nombreConflicto); };
    return window.ColaGuardado ? ColaGuardado.poner('hitos.json', hacer) : hacer();
  }

  async function fusionarHitosYa(g, nombreConflicto) {
    var real, conflicto;
    try {
      real = await Carpetas.leerJson(g, 'hitos.json');
      conflicto = JSON.parse(await Carpetas.leerTexto(g, nombreConflicto));
    } catch (e) { return false; }
    if (!conflicto || typeof conflicto !== 'object') return false;
    var base = (real && typeof real === 'object') ? real : {};
    /* Fila 178, punto 3: se conserva el mayor de los dos _esquema. */
    base._esquema = Math.max((real && real._esquema) || 0, (conflicto && conflicto._esquema) || 0);
    base.ajustes = base.ajustes || {};
    base.porAsunto = base.porAsunto || {};
    var confAjustes = conflicto.ajustes || {};
    var confPorAsunto = conflicto.porAsunto || {};

    base.ajustes.responsables = unirPorId(base.ajustes.responsables, confAjustes.responsables);
    var noLectivos = {};
    (base.ajustes.noLectivos || []).concat(confAjustes.noLectivos || []).forEach(function (f) { noLectivos[f] = true; });
    base.ajustes.noLectivos = Object.keys(noLectivos).sort();
    /* Fila 131: los festivos, igual (solo se fusionan las altas). */
    var festivos = {};
    (base.ajustes.festivos || []).concat(confAjustes.festivos || []).forEach(function (f) { festivos[f] = true; });
    base.ajustes.festivos = Object.keys(festivos).sort();

    /* Fila 176, punto 2: igual que en asuntos.json, una clave con
       lápida no vuelve a hitos.json. */
    var lapidas = {};
    if (window.Borrados) {
      (await Borrados.leer(g)).asuntos.forEach(function (x) { lapidas[x.clave] = true; });
    }

    var claves = {};
    Object.keys(base.porAsunto).forEach(function (k) { claves[k] = true; });
    Object.keys(confPorAsunto).forEach(function (k) { claves[k] = true; });
    claves = Object.keys(claves).filter(function (k) { return !lapidas[k]; });
    Object.keys(lapidas).forEach(function (k) { delete base.porAsunto[k]; });
    for (var i = 0; i < claves.length; i++) {
      var clave = claves[i];
      var a = base.porAsunto[clave], b = confPorAsunto[clave];
      if (a && b) {
        base.porAsunto[clave] = { creados: a.creados || b.creados, hitos: unirPorId(a.hitos, b.hitos),
          pasosConocidos: (a.pasosConocidos || []).concat(b.pasosConocidos || []) };   /* fila 118 */
      } else {
        base.porAsunto[clave] = a || b;
      }
    }

    await Copias.guardar(g, 'hitos.json', base);
    await archivarConflicto(g, nombreConflicto);
    return true;
  }

  /* ---------- fusionar el tablón: unión de notas por id ---------- */
  /* En fila con los demás guardados de tablon.json (fila 130). */
  function fusionarTablon(g, nombreConflicto) {
    var hacer = function () { return fusionarTablonYa(g, nombreConflicto); };
    return window.ColaGuardado ? ColaGuardado.poner('tablon.json', hacer) : hacer();
  }

  async function fusionarTablonYa(g, nombreConflicto) {
    var real, conflicto;
    try {
      real = await Carpetas.leerJson(g, 'tablon.json');
      conflicto = JSON.parse(await Carpetas.leerTexto(g, nombreConflicto));
    } catch (e) { return false; }
    if (!conflicto || !Array.isArray(conflicto.notas)) return false;

    function clave(n) { return n.id || ((n.texto || '') + '|' + (n.creado || '')); }
    var mapa = {}, orden = [];
    ((real && real.notas) || []).concat(conflicto.notas).forEach(function (n) {
      var k = clave(n);
      if (!mapa[k]) orden.push(k);
      mapa[k] = mapa[k] ? Object.assign({}, mapa[k], n) : n;
    });

    /* Fila 178, punto 3: se conserva el mayor de los dos _esquema. */
    var esquemaTablon = Math.max((real && real._esquema) || 0, (conflicto && conflicto._esquema) || 0);
    await Copias.guardar(g, 'tablon.json',
      { notas: orden.map(function (k) { return mapa[k]; }), _esquema: esquemaTablon });
    await archivarConflicto(g, nombreConflicto);
    return true;
  }

  /* Fila 130: una fila de un CSV de terceros que choca por el nombre,
     resuelta desde js/conflictos-datos.js. */
  async function quedarseConLaFilaDelOtro(p) {
    try {
      await Datos.guardarEnLista(App.E.datos, p.categoria, p.nombre, p.fila);
      pendientes = pendientes.filter(function (x) { return x !== p; });
      pintarBloque();
      U.aviso('Se guardan los datos del otro ordenador para ' + p.nombre + '.', 'bueno');
    } catch (e) {
      U.fallo('No he podido guardarlo', e);
    }
  }
  I.quedarseConLaFilaDelOtro = quedarseConLaFilaDelOtro;

  /* ---------- los ficheros que no se fusionan solos ---------- */

  function yaPendiente(real, nombreConflicto) {
    return pendientes.some(function (p) { return p.real === real && p.nombreConflicto === nombreConflicto; });
  }

  async function quedarseConEsteOrdenador(p) {
    var g = window.Gestor.carpetaGestor();
    try {
      await archivarConflicto(g, p.nombreConflicto);
      pendientes = pendientes.filter(function (x) { return x !== p; });
      pintarBloque();
      U.aviso('Se guarda el de este ordenador. El otro queda a salvo en _GESTOR/copias.', 'bueno');
    } catch (e) {
      U.aviso('No he podido resolverlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* Los tres ficheros que App mantiene en memoria se recargan solos.
     Los demás (guías, recurrentes, frescura) se leen justo al abrir su
     propia pantalla, así que basta con avisar. */
  async function refrescarTrasResolver(real) {
    if (real === App.FICHERO_TIPOS) { await App.cargarTipos(); App.pintarAjustes(); }
    else if (real === App.FICHERO_TIPOS_DOC) { await App.cargarTiposDocumento(); App.pintarAjustes(); }
    else { U.aviso('Guardado. Para verlo aquí, cierra sesión y vuelve a entrar.', 'bueno'); }
  }

  async function quedarseConElOtro(p) {
    var g = window.Gestor.carpetaGestor();
    try {
      var contenido = JSON.parse(await Carpetas.leerTexto(g, p.nombreConflicto));
      await Copias.guardar(g, p.real, contenido);
      await archivarConflicto(g, p.nombreConflicto);
      pendientes = pendientes.filter(function (x) { return x !== p; });
      await refrescarTrasResolver(p.real);
      pintarBloque();
      U.aviso('Se guarda el del otro ordenador. El que había queda a salvo en _GESTOR/copias.', 'bueno');
    } catch (e) {
      U.aviso('No he podido resolverlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* ---------- el bloque de Ajustes ---------- */

  function bloqueDeAjustes() {
    var ya = $('bloque-conflictos');
    if (ya) return ya;
    /* 17-sep-2026, fila 39: este bloque vive en la pestaña
       "Mantenimiento", no en la pantalla de Ajustes entera. */
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-conflictos';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Conflictos de Dropbox</span>' +
        '<span class="bloque-pie" id="conflictos-pie">Cuando los dos ordenadores guardan casi a la vez</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Los cambios de <code>asuntos.json</code> y <code>tablon.json</code> se ' +
        'unen solos, sin preguntar. Los de las demás listas —que cambian mucho menos— se avisan ' +
        'aquí, para elegir con cuál de los dos ordenadores quedarse. El que no se elija no se ' +
        'pierde: se guarda en <code>_GESTOR/copias</code>.</p>' +
        '<div id="tabla-conflictos" class="lista"></div>' +
      '</div>';
    pantalla.appendChild(d);
    return d;
  }

  function pintarBloque() {
    bloqueDeAjustes();
    var caja = $('tabla-conflictos');
    var pie = $('conflictos-pie');
    if (!caja) return;
    if (pie) pie.textContent = pendientes.length
      ? pendientes.length + (pendientes.length === 1 ? ' conflicto por resolver' : ' conflictos por resolver')
      : 'Cuando los dos ordenadores guardan casi a la vez';
    caja.innerHTML = '';
    if (!pendientes.length) {
      caja.innerHTML = '<div class="vacio">Sin conflictos pendientes.</div>';
      return;
    }
    pendientes.forEach(function (p) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      /* Fila 130: una fila de un CSV de terceros que choca por el nombre. */
      if (p.fila) {
        f.innerHTML = '<span class="nombre-tipo">' + U.escapar(p.real) + '</span>' +
          '<span class="suave" style="flex:1">' + U.escapar(p.nombre) + ': el otro ordenador tenía ' +
          U.escapar(Object.keys(p.fila).map(function (k) { return p.fila[k]; }).filter(Boolean).join(' · ')) + '</span>';
        var deja = document.createElement('button');
        deja.className = 'boton';
        deja.textContent = 'Dejar los de este ordenador';
        deja.onclick = function () { pendientes = pendientes.filter(function (x) { return x !== p; }); pintarBloque(); };
        f.appendChild(deja);
        var toma = document.createElement('button');
        toma.className = 'boton';
        toma.textContent = 'Quedarse con los del otro';
        toma.onclick = function () { quedarseConLaFilaDelOtro(p); };
        f.appendChild(toma);
        caja.appendChild(f);
        return;
      }
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(p.real) + '</span>' +
        '<span class="suave" style="flex:1">' + U.escapar(p.nombreConflicto) + '</span>';
      var esteOrdenador = document.createElement('button');
      esteOrdenador.className = 'boton';
      esteOrdenador.textContent = 'Quedarse con el de este ordenador';
      esteOrdenador.onclick = function () { quedarseConEsteOrdenador(p); };
      f.appendChild(esteOrdenador);
      var otro = document.createElement('button');
      otro.className = 'boton';
      otro.textContent = 'Quedarse con el otro';
      otro.onclick = function () { quedarseConElOtro(p); };
      f.appendChild(otro);
      caja.appendChild(f);
    });
  }

  /* ---------- la revisión ---------- */

  async function revisar() {
    var g = window.Gestor && window.Gestor.carpetaGestor();
    if (!g) return;
    var ficheros;
    try { ficheros = await Carpetas.ficheros(g); } catch (e) { return; }

    for (var i = 0; i < ficheros.length; i++) {
      var nombre = ficheros[i].nombre;
      var real = ficheroReal(nombre);
      /* Fila 176, punto 5: antes solo se miraban los conflictos de los
         ficheros de Copias.FICHEROS; plantillas.json, envios.json,
         rutas.json, margenes-pdf.json y cualquier otro de _GESTOR se
         ignoraban del todo. Ahora entran en el mismo cajón de "no se
         fusionan solos" que ya tenían tipos, estados... */
      if (!real) continue;

      if (real === App.FICHERO_ASUNTOS) {
        if (await fusionarAsuntos(g, nombre)) {
          U.aviso('Se han unido los cambios de los dos ordenadores en ' + real + '.', '');
        }
        continue;
      }
      if (real === 'tablon.json') {
        if (await fusionarTablon(g, nombre)) {
          U.aviso('Se han unido los cambios de los dos ordenadores en ' + real + '.', '');
        }
        continue;
      }
      if (real === 'hitos.json') {
        if (await fusionarHitos(g, nombre)) {
          U.aviso('Se han unido los cambios de los dos ordenadores en ' + real + '.', '');
        }
        continue;
      }
      if (!yaPendiente(real, nombre)) pendientes.push({ real: real, nombreConflicto: nombre });
    }
    if (I.revisarCsv) { try { await I.revisarCsv(g); } catch (e) { /* a la siguiente pasada */ } }
    try { await revisarPresencia(g); } catch (e) { /* se intenta la próxima vez */ }
    if (I.revisarFechasDatos) { try { await I.revisarFechasDatos(); } catch (e) { /* no crítico */ } }
    pintarBloque();
  }

  /* Fila 176, punto 5: presencia.json pasa a un fichero por usuario
     dentro de _GESTOR/presencia (js/presencia.js), que cada ordenador
     escribe solo, así que ya no debería dejar copias en conflicto; si
     alguna queda (o del presencia.json viejo, ya migrado), se borra sin
     preguntar: es un dato que caduca solo, sin copia de seguridad. */
  async function revisarPresencia(g) {
    var carpeta;
    try { carpeta = await Carpetas.crear(g, 'presencia'); } catch (e) { return; }
    var lista;
    try { lista = await Carpetas.ficheros(carpeta); } catch (e) { return; }
    for (var i = 0; i < lista.length; i++) {
      if (!ficheroReal(lista[i].nombre)) continue;
      try { await carpeta.removeEntry(lista[i].nombre); } catch (e) { /* se intenta la próxima vez */ }
    }
  }

  /* Para las pruebas, y por si algún día hace falta forzar una revisión
     desde otro sitio (el botón "Actualizar", por ejemplo). unirPorId
     se reutiliza también en js/asunto-renombrar.js (fila 62): fusionar
     dos listas de hitos por su identificador es el mismo problema que
     fusionar una copia en conflicto. js/conflictos-datos.js añade aquí
     mismo unirCsv, fusionarCsv, categoriasCambiadas y
     revisarFechasDatos, y rellena I.revisarCsv/I.revisarFechasDatos. */
  window.Conflictos = {
    revisar: revisar, pendientes: function () { return pendientes.slice(); }, unirPorId: unirPorId,
    _interno: I
  };

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      var g = window.Gestor.carpetaGestor();
      if (!g) return;
      /* Con un guardado en marcha, a la siguiente pasada (fila 99). */
      if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
      var ahora = Date.now();
      if (ultimaRevision && ahora - ultimaRevision < CADA_MS) return;
      ultimaRevision = ahora;
      revisar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar);
  } else {
    enganchar();
  }
})();
