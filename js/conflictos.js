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
   (asuntos/hitos/tablón, con las lápidas de la fila 176), el cajón de
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
  I.archivarConflicto = function (g, nombre) { return archivarConflicto(g, nombre); };   /* fila 287 */
  I.pintarBloque = function () { pintarBloque(); };

  /* Fila 178, punto 3: deja en 'destino' (el objeto que se va a guardar
     con Copias.guardar) el mayor `_esquema` de los dos lados del
     conflicto que se acaban de fusionar, para no perder el de un lado
     que tuviera una versión más nueva de la aplicación. Copias.guardar
     nunca lo baja de ESQUEMA por su cuenta, pero tampoco puede saber
     lo que traía 'conflicto': eso solo se sabe aquí. */
  I.conservarEsquemaMayor = function (destino, a, b) {
    var mayor = Math.max(Number(a && a._esquema) || 0, Number(b && b._esquema) || 0);
    if (mayor > 0) destino._esquema = mayor; else delete destino._esquema;
  };

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
    Object.keys(claves).forEach(function (k) {
      if (lapidas[k]) return;
      var a = registroReal.asuntos[k], b = conflicto.asuntos[k];
      fusion.asuntos[k] = (a && b) ? fusionarFicha(a, b) : (a || b);
    });
    I.conservarEsquemaMayor(fusion, registroReal, conflicto);

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

    I.conservarEsquemaMayor(base, base, conflicto);
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

    var fusionTablon = { notas: orden.map(function (k) { return mapa[k]; }) };
    I.conservarEsquemaMayor(fusionTablon, real, conflicto);
    await Copias.guardar(g, 'tablon.json', fusionTablon);
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
     Recurrentes y frescura se leen justo al abrir su propia pantalla, así
     que basta con avisar. Las guías se ponen al día solas (fila 273,
     GuiasDelCentro.ponerAlDia) al crear o completar hitos, al entrar en
     «Nuevo asunto» y al abrir Ajustes de un tipo. */
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

  /* ---------- la tarjeta de «Problemas» ----------

     Fila 291 (docs/PROBLEMAS-CON-SU-SOLUCION.md): ya no es una sección de Ajustes sino la tarjeta
     «N cosas se guardaron a la vez en dos ordenadores». Cada una dice qué es con palabras. */

  var COMO_SE_LLAMA = {
    'tipos.json': 'la lista de tipos de asunto', 'tipos-documento.json': 'la lista de tipos de documento',
    'estados.json': 'la lista de estados', 'campos.json': 'los campos propios', 'guias.json': 'las guías',
    'recurrentes.json': 'los asuntos que se repiten', 'frescura.json': 'los avisos del fichero de alumnado',
    'grupos.json': 'los grupos de personas', 'cargos.json': 'los cargos del centro', 'usuarios.json': 'la lista de usuarios',
    'hitos-biblioteca.json': 'la biblioteca de hitos', 'formularios-campos.json': 'las casillas de los impresos',
    'plantillas.json': 'las plantillas', 'rutas.json': 'las rutas de las carpetas', 'margenes-pdf.json': 'los márgenes de los PDF',
    'no-duplicados.json': 'los duplicados descartados', 'papelera.json': 'la papelera', 'envios.json': 'los envíos de correo',
    'asuntos.json': 'la lista de asuntos', 'tablon.json': 'el tablón', 'hitos.json': 'los hitos',
    'perfiles.json': 'los perfiles', 'encargos.json': 'los encargos', 'correos-a-mano.json': 'los correos escritos a mano', 'actividades.json': 'las actividades extraescolares'
  };

  function comoSeLlama(real) { return COMO_SE_LLAMA[real] || 'una lista de la aplicación'; }

  var turnoBloque = 0;   /* si llegan dos pintados a la vez, solo vale el último */

  async function pintarBloque() {
    if (!window.Problemas || !window.ProblemasTextos) return;
    if (!pendientes.length) { turnoBloque++; Problemas.registrar('conflictos', null); return; }
    var mio = ++turnoBloque;
    var lista = pendientes.slice();
    var g = window.Gestor && window.Gestor.carpetaGestor();
    /* Fila 292: «Qué cambia», solo leyendo (js/conflictos-diferencias.js). */
    var cambios = await Promise.all(lista.map(function (p) {
      if (p.fila || !g || !window.ConflictosDiferencias) return null;
      return ConflictosDiferencias.describir(g, p).catch(function () { return null; });
    }));
    if (mio !== turnoBloque) return;
    var d = ProblemasTextos.conflictos(lista.map(function (p, i) {
      if (p.fila) {
        return { fila: true, nombre: 'Los datos de ' + p.nombre,
          detalle: 'el otro ordenador tenía ' + Object.keys(p.fila).map(function (k) { return p.fila[k]; }).filter(Boolean).join(' · ') };
      }
      var c = cambios[i];
      return { nombre: comoSeLlama(p.real).replace(/^./, function (c) { return c.toUpperCase(); }), detalle: '',
        igual: !!(c && c.igual), queCambia: c ? { cuando: c.cuando, lineas: c.lineas, mas: c.mas } : null };
    }));
    lista.forEach(function (p, i) {
      var acc = d.elementos[i].acciones;
      acc[0].alPulsar = p.fila
        ? function () { pendientes = pendientes.filter(function (x) { return x !== p; }); pintarBloque(); }
        : function () { return quedarseConEsteOrdenador(p); };
      if (acc[1]) acc[1].alPulsar = p.fila ? function () { return quedarseConLaFilaDelOtro(p); } : function () { return quedarseConElOtro(p); };
    });
    Problemas.registrar('conflictos', d);
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
      if (real === 'perfiles.json' && window.Perfil) {   /* fila 287: por nombre */
        if (await Perfil.fusionarConflicto(g, nombre)) U.aviso('Se han unido los cambios de los dos ordenadores en ' + real + '.', '');
        continue;
      }
      if (real === 'encargos.json' && window.Encargos) {   /* fila 289: por id */
        if (await Encargos.fusionarConflicto(g, nombre)) U.aviso('Se han unido los cambios de los dos ordenadores en ' + real + '.', '');
        continue;
      }
      if (real === 'correos-a-mano.json' && window.CorreosAMano) {   /* fila 299: por clave */
        if (await CorreosAMano.fusionarConflicto(g, nombre)) U.aviso('Se han unido los cambios de los dos ordenadores en ' + real + '.', '');
        continue;
      }
      if (real === 'actividades.json' && window.Actividades) {   /* fila 306: por id */
        if (await Actividades.fusionarConflicto(g, nombre)) U.aviso('Se han unido los cambios de los dos ordenadores en ' + real + '.', '');
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
    await pintarBloque();
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
