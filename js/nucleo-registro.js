/* ============================================================
   nucleo-registro.js — guardar el registro, anotar y cambiar de pantalla (fila 536: trozo de js/nucleo.js, que sigue siendo el que
   explica el conjunto; mismo código, solo cambia de fichero). Se carga
   justo después de nucleo-tipos.js.
   ============================================================ */
/* La única forma correcta de escribir el registro entero (fila 61,
   docs/GUARDAR-SIN-PISAR.md): vuelve a leer el fichero del disco,
   deja que 'cambiar' mute lo que haga falta sobre esa copia fresca,
   guarda y repinta. Es el mismo patrón que ya usa Hitos.cambiar en
   js/hitos.js. Cualquier sitio que necesite escribir el registro
   entero pasa por aquí: nunca App.E.registro directo ni
   Copias.guardar(..., App.FICHERO_ASUNTOS, ...) fuera de este
   fichero (salvo js/conflictos.js, que fusiona una copia en
   conflicto que ya se acaba de leer). */
/* Desde la fila 99 (docs/GUARDAR-EN-FILA.md): en fila con los demás
   guardados de asuntos.json (ColaGuardado), y sobre una copia leída
   en una variable local, que solo pasa a App.E.registro cuando la
   escritura ha terminado bien. */
/* Sin js/cola-guardado.js cargado, se guarda igual, sin fila (la
   lección de la fila 92: un módulo que falta nunca deja sin guardar). */
App.enFila = function (fichero, fn) {
  return window.ColaGuardado ? window.ColaGuardado.poner(fichero, fn) : fn();
};

/* Fila 364 (docs/GUARDAR-SIN-PERDER-Y-ARCHIVAR-RAPIDO.md, js/guardado-pendiente.js): si la
   escritura acaba con un error de sincronización después de los reintentos de siempre, el cambio
   no se tira: queda pendiente (también en el navegador), la pantalla ya lo enseña y se reintenta
   solo. Quien lo pidió espera, sin bloquear la cola, a que salga de verdad. Antes de cada guardado
   se pone encima del disco lo que siga pendiente, para que un cambio posterior nunca lo deshaga.
   `esReintento` es el reintento solo del propio módulo: nunca apunta ni espera. */
App.guardarRegistroFresco = async function (cambiar, esReintento) {
  var GP = window.GuardadoPendiente;
  var quedaPendiente = await App.enFila(App.FICHERO_ASUNTOS, async function () {
    var registro = await App.leerRegistroDelDisco();
    var aplicado = GP ? await GP.superponer(registro, true) : false;
    if (esReintento && !aplicado) return null;
    var antes = GP ? JSON.stringify(registro) : null;
    if (GP) GP.empiezaCambio();
    try { await cambiar(registro); }
    catch (e) { if (GP) GP.sueltaComprobadas(); throw e; }
    try {
      await Copias.guardar(App.E.gestor, App.FICHERO_ASUNTOS, registro, { sinPendiente: true });
    } catch (e) {
      var claves = (GP && !esReintento && Reintentar.esErrorDeSincronizacion(e)) ? GP.apuntarAsuntos(antes, registro) : null;
      if (GP) GP.sueltaComprobadas();
      if (!claves) throw e;
      App.E.asuntosEnDisco = Math.max(App.E.asuntosEnDisco, App.contarAsuntos(registro));
      App.E.registro = registro;
      App.refrescarFichas();
      return claves;
    }
    if (GP) GP.sueltaComprobadas();
    App.E.asuntosEnDisco = App.contarAsuntos(registro);
    App.E.registro = registro;
    if (aplicado) GP.guardado(GP.ASUNTOS, true);
    App.refrescarFichas();
    return null;
  });
  if (quedaPendiente) await GP.esperar(GP.ASUNTOS, quedaPendiente);
};

/* Un asunto con una acción larga en marcha (archivar, reabrir,
   renombrar, unir) queda marcado mientras dura (fila 100,
   docs/AVISOS-QUE-DICEN-LA-VERDAD.md): una segunda acción sobre él no
   arranca, y su tarjeta sale con los botones apagados aunque se
   repinte (App.tarjetaAsunto). */
App.conOcupado = async function (nombre, fn) {
  if (App.E.ocupados[nombre]) {
    U.aviso('Ese asunto ya tiene una acción en marcha. Espera a que termine.', 'ambar');
    return;
  }
  App.E.ocupados[nombre] = true;
  try { return await fn(); }
  finally {
    delete App.E.ocupados[nombre];
    if (typeof App.pintarAbiertos === 'function') { try { App.pintarAbiertos(); } catch (e) { /* solo pintar */ } }
  }
};

/* Fila 176 (docs/DATOS-ENTRE-ORDENADORES.md, punto 2): si 'clave' lleva
   una lápida (archivada, a la papelera, unida o renombrada por
   cualquiera de los dos ordenadores), ni App.anotar ni App.anotarLista
   la resucitan. Lo lanza App.anotar/App.anotarLista mismos, dentro de
   la cola, con el disco ya releído: quien llama lo enseña con
   U.fallo/U.aviso. */
App.comprobarNoCerrado = async function (clave) {
  if (window.GuardadoPendiente) GuardadoPendiente.anotaComprobada(clave);   /* fila 364: ese cambio se tira si luego resulta cerrado */
  if (!window.Borrados) return;
  if (await Borrados.estaCerrada(App.E.gestor, 'asuntos', clave)) {
    var e = new Error('Este asunto ya está archivado en el otro ordenador. Recarga la lista.');
    e.name = 'AsuntoCerrado';
    throw e;
  }
};

/* Se relee antes de escribir, por si el compañero ha tocado algo
   desde el otro ordenador mientras tanto. */
App.anotar = async function (clave, datos) {
  await App.guardarRegistroFresco(async function (registro) {
    await App.comprobarNoCerrado(clave);
    var antes = registro.asuntos[clave] || {};
    registro.asuntos[clave] = Object.assign(antes, datos);
  });
};

/* Fila 176, punto 1 (docs/DATOS-ENTRE-ORDENADORES.md): funde una LISTA
   de la ficha (hilos, relacionados, pendientesRegistro, notas...)
   elemento a elemento, en vez de sustituirla entera: lo que el otro
   ordenador haya añadido en ese minuto no desaparece. 'anadir' entra
   sin repetir según 'identidad' (si ya hay uno con la misma identidad,
   se sustituye por el nuevo: así sirve también para "sustituir esta
   nota concreta"); 'quitar' se compara con la misma 'identidad'. */
App.IDENTIDAD_LISTA = {
  notas: function (n) { return (n && n.cuando || '') + '|' + (n && n.texto || ''); },
  hilos: function (h) { return (h && h.id) || ''; },
  relacionados: function (r) { return (r && r.categoria || '') + '|' + (r && r.nombre || ''); },
  pendientesRegistro: function (p) { return typeof p === 'string' ? p : ((p && p.nombre) || ''); },
  encargos: function (e) { return (e && e.id) || ''; },   /* fila 289 */
  avisosActividad: function (x) { return (x && x.cuando) || ''; },   /* fila 309 */
  candidaturas: function (c) { return (c && c.id) || ''; }   /* fila 347 */
};

App.unirPorIdentidad = function (a, b, identidad) {
  var vistos = {}, salida = [];
  (a || []).concat(b || []).forEach(function (x) {
    var id = identidad(x);
    if (vistos[id]) return;
    vistos[id] = true;
    salida.push(x);
  });
  return salida;
};

App.anotarLista = async function (clave, campo, opciones) {
  opciones = opciones || {};
  var anadir = opciones.anadir || [];
  var quitar = opciones.quitar || [];
  var identidad = opciones.identidad || App.IDENTIDAD_LISTA[campo] || JSON.stringify;
  await App.guardarRegistroFresco(async function (registro) {
    await App.comprobarNoCerrado(clave);
    var ficha = registro.asuntos[clave] || (registro.asuntos[clave] = {});
    var lista = Array.isArray(ficha[campo]) ? ficha[campo].slice() : [];
    if (quitar.length) {
      var fuera = {};
      quitar.forEach(function (x) { fuera[identidad(x)] = true; });
      lista = lista.filter(function (x) { return !fuera[identidad(x)]; });
    }
    anadir.forEach(function (nuevo) {
      var id = identidad(nuevo);
      var sitio = -1;
      lista.forEach(function (x, i) { if (identidad(x) === id) sitio = i; });
      if (sitio === -1) lista.push(nuevo); else lista[sitio] = nuevo;
    });
    ficha[campo] = lista;
    /* 'extra': algún otro campo suelto que cambie a la vez (notaEl,
       notaPor...), en la misma pasada de la cola. */
    if (opciones.extra) Object.assign(ficha, opciones.extra);
  });
};

/* Al releer el registro, las tarjetas ya pintadas se quedan con la
   ficha vieja. Aquí se les vuelve a enganchar la buena. */
App.refrescarFichas = function () {
  App.E.listaAbiertos.forEach(function (a) { a.ficha = App.E.registro.asuntos[a.nombre] || {}; });
  App.E.listaArchivo.forEach(function (a) { a.ficha = App.E.registro.asuntos[a.nombre] || {}; });
};

/* ==========================================================
   NAVEGACIÓN
   ========================================================== */

App.PANTALLAS = ['abiertos', 'nuevo', 'archivo', 'personas', 'herramientas', 'ajustes'];

Array.prototype.forEach.call(document.querySelectorAll('.pestana'), function (b) {
  b.onclick = function () {
    App.ir(b.dataset.pantalla);
    /* Fila 367: pulsar «Inicio» en el menú devuelve la lista a su orden de siempre. */
    if (b.dataset.pantalla === 'abiertos' && window.InicioOrden && InicioOrden.reiniciar() && App.repintarLaPestanaActiva) {
      App.repintarLaPestanaActiva();
    }
    /* Fila 353: pulsar «Inicio» en el menú vuelve a aplicar la regla de
       apertura del tablón (nota para hoy → sale abierto). */
    if (b.dataset.pantalla === 'abiertos' && window.InicioPlegados) InicioPlegados.alEntrarEnInicio();
  };
});

/* Fila 214: pantallas del menú de verdad (los botones .pestana), las
   únicas cuya vuelta a Inicio deja "clasificar" atrás si se había
   dejado a medias. App.PANTALLAS también lleva pantallas que no son
   del menú (la ficha, "asunto", empuja la suya con App.PANTALLAS.push
   en js/ficha-asunto.js, y lo mismo tipo-asunto/cuentas/formularios/
   duplicados): volver de esas es un «Volver» normal, no un «ir a
   Inicio desde el menú», y no debe tocar "clasificar". */
var MENU_PANTALLAS = ['nuevo', 'archivo', 'personas', 'herramientas', 'ajustes'];

App.ir = function (cual) {
  if (cual !== 'abiertos' && window.U && U.quitarAvisosFijos) U.quitarAvisosFijos();   /* fila 449: salir de «Ver todo» */
  /* De qué pantalla se viene, para la comprobación de más abajo. Se
     mira antes de que las líneas de abajo cambien qué pantalla está a
     la vista. */
  var pantallaDeAntes = window.Navegacion ? Navegacion.pantallaVisible() : '';

  /* Fila 194: se apunta de dónde se viene antes de cambiar de pantalla,
     para que «Volver» (js/navegacion.js) sepa adónde volver desde
     cualquier pantalla, no solo desde la ficha. La ficha apunta su
     origen a mano (js/ficha-asunto.js) antes de llamar a App.ir('asunto'),
     así que aquí se deja fuera para no pisarlo. */
  if (window.Navegacion && cual !== 'asunto') Navegacion.apuntar();
  App.PANTALLAS.forEach(function (p) {
    $('pantalla-' + p).classList.toggle('oculto', p !== cual);
  });
  Array.prototype.forEach.call(document.querySelectorAll('.pestana'), function (b) {
    b.classList.toggle('activa', b.dataset.pantalla === cual);
  });
  /* Fila 214: volver a Inicio desde otra pantalla del MENÚ (Archivo,
     Ajustes…) lo deja normal, sin la zona de "clasificar" a la vista
     si se había dejado a medias; volver desde la ficha de un asunto
     (abierta desde dentro de "clasificar" o no) no toca nada de esto. */
  if (cual === 'abiertos' && MENU_PANTALLAS.indexOf(pantallaDeAntes) !== -1 &&
      App.E.vista === 'clasificar' && App.irVista) {
    App.irVista('departamento');
  }
  if (cual === 'abiertos' && App.pintarAbiertosSiPendiente) App.pintarAbiertosSiPendiente();
  /* Fila 212, docs/INICIO-A-TODO-EL-ANCHO.md, apartado 4: los filtros
     de Inicio empiezan siempre cerrados al entrar. */
  if (cual === 'abiertos' && window.Vista && Vista.cerrarFiltros) Vista.cerrarFiltros();
  if (cual === 'nuevo') App.prepararNuevo();
  /* Fila 175, punto 3: el Archivo carga solo la primera vez de la
     sesión; las siguientes, la lista ya está en memoria. */
  if (cual === 'archivo' && !App.E.archivoVisitado) { App.E.archivoVisitado = true; App.verArchivo(); }
  if (cual === 'ajustes') {
    App.pintarAjustes();
    /* Los bloques de Ajustes que pintan los módulos (biblioteca, hitos…)
       ya no se repintan con la lista si Ajustes no se ve (fila 101):
       se les avisa al entrar. */
    if (App.avisarALosModulos) App.avisarALosModulos();
  }
  if (cual === 'personas') App.pintarPersonas();
  /* Fila 200, apartado 7, docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md. */
  if (cual === 'herramientas') App.pintarHerramientas();
};
