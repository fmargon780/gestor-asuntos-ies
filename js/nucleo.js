/* ============================================================
   nucleo.js — el corazón de la aplicación.

   Aquí están el estado, el arranque, los ficheros de configuración de
   _GESTOR y el cambio de pantalla.

   Todo lo demás cuelga del objeto App, que se crea aquí. Cada fichero
   añade sus funciones a App, y así se llaman entre ellos sin que
   ninguno tenga que ser gigante.
   ============================================================ */

/* Todo cuelga de aquí. */
var App = {};

App.E = {
  abiertos: null,      /* carpeta de asuntos abiertos */
  archivo: null,       /* carpeta ARCHIVO */
  gestor: null,        /* _GESTOR, dentro de la de abiertos */
  datos: null,         /* _GESTOR/datos */
  usuario: '',
  tipos: [],
  tiposDocumento: [],
  estados: [],         /* estados de tramitación, compartidos en _GESTOR */
  registro: { asuntos: {} },
  listaAbiertos: [],
  vista: 'departamento',   /* cuál de las tres tarjetas está elegida */
  listaArchivo: [],
  sueltos: [],         /* documentos sueltos en la carpeta de abiertos */
  reciales: {},        /* los que han llegado con la aplicación abierta */
  pendiente: null,     /* el suelto que se va a meter en el asunto que se está creando */
  nuevo: { tipo: null, categoria: null, tercero: null }
};

App.DESCRIPCION_CATEGORIA = {
  ALUMNADO: 'Alumnos y alumnas',
  PERSONAL: 'Profesorado y personal del centro',
  EMPRESAS: 'Proveedores y empresas',
  OTROS: 'Todo lo demás'
};

App.CARPETA_GESTOR = '_GESTOR';
App.FICHERO_TIPOS = 'tipos.json';
App.FICHERO_TIPOS_DOC = 'tipos-documento.json';
App.FICHERO_ASUNTOS = 'asuntos.json';
App.FICHERO_ESTADOS = 'estados.json';

App.TITULO = 'Gestor de Asuntos';
App.SEGUNDOS_ENTRE_MIRADAS = 20;

/* La fecha y la hora de la última versión publicada. Sale en la
   pantalla de entrada y, ya dentro, abajo a la izquierda debajo del
   nombre. Sirve para saber de un vistazo si se está mirando lo último:
   si la hora no es la del último cambio, o Vercel no ha publicado
   todavía, o el navegador se ha quedado con la página vieja.

   La hora es la de España, la del reloj de Francisco. */
App.VERSION = '10-sep-2026 · 10:25';

/* El atajo de siempre para coger un elemento de la página. Es global
   para todos los ficheros de la aplicación, y también cuelga de App
   para que lo use el puente. */
function $(id) { return document.getElementById(id); }
App.$ = $;

/* ==========================================================
   ARRANQUE
   ========================================================== */

App.arrancar = async function () {
  if (!Carpetas.soportado()) {
    $('aviso-navegador').classList.remove('oculto');
    $('paso-carpetas').classList.add('oculto');
    return;
  }
  var a = await Almacen.leer('abiertos');
  var b = await Almacen.leer('archivo');
  var u = await Almacen.leer('usuario');
  if (a) { App.E.abiertos = a; App.marcarCarpeta('estado-abiertos', a.name); }
  if (b) { App.E.archivo = b; App.marcarCarpeta('estado-archivo', b.name); }
  if (u) { App.E.usuario = u; $('campo-usuario').value = u; }
  App.ponerVersion();
  App.revisarArranque();
};

/* La versión, también en la pantalla de entrada. Así se puede ver sin
   entrar si el navegador se ha quedado con una copia vieja. */
App.ponerVersion = function () {
  var nota = document.querySelector('#paso-carpetas .nota');
  if (!nota || nota.querySelector('.version')) return;
  var v = document.createElement('span');
  v.className = 'version suave';
  v.textContent = 'Versión ' + App.VERSION;
  nota.appendChild(document.createElement('br'));
  nota.appendChild(v);
};

App.marcarCarpeta = function (id, nombre) {
  var d = $(id);
  d.textContent = nombre;
  d.classList.add('puesta');
};

App.revisarArranque = function () {
  $('btn-entrar').disabled = !(App.E.abiertos && App.E.archivo);
};

/* Si el usuario cierra el cuadro de elegir carpeta, el navegador devuelve
   AbortError y no hay nada que decir. Cualquier otro fallo sí se cuenta:
   callarlo dejaría el botón de Entrar apagado sin explicación. */
App.pedirCarpeta = async function (cual, idCuadro, idEstado) {
  try {
    var h = await Carpetas.elegir(idCuadro);
    App.E[cual] = h;
    App.marcarCarpeta(idEstado, h.name);
    App.revisarArranque();
    await Almacen.guardar(cual, h);
  } catch (e) {
    if (e.name === 'AbortError') return;
    U.aviso('No he podido usar esa carpeta: ' + e.message, 'malo');
  }
};

$('btn-abiertos').onclick = function () {
  App.pedirCarpeta('abiertos', 'gestor-abiertos', 'estado-abiertos');
};

$('btn-archivo').onclick = function () {
  App.pedirCarpeta('archivo', 'gestor-archivo', 'estado-archivo');
};

$('btn-entrar').onclick = async function () {
  try {
    var ok1 = await Carpetas.permiso(App.E.abiertos, true);
    var ok2 = await Carpetas.permiso(App.E.archivo, true);
    if (!ok1 || !ok2) {
      U.aviso('Sin permiso sobre alguna de las dos carpetas. Vuelve a elegirla.', 'malo');
      return;
    }
    App.E.usuario = $('campo-usuario').value.trim();
    await Almacen.guardar('usuario', App.E.usuario);

    App.E.gestor = await Carpetas.crear(App.E.abiertos, App.CARPETA_GESTOR);
    App.E.datos = await Carpetas.crear(App.E.gestor, 'datos');
    await App.cargarTipos();
    await App.cargarTiposDocumento();
    await App.cargarEstados();
    await App.cargarRegistro();

    Documentos.configurar({
      tipos: function () { return App.E.tiposDocumento; },
      curso: function (fecha) { return U.cursoDeFecha(fecha); },
      /* Para poder crear un tipo de documento desde el propio cuadro,
         sin ir a Ajustes. Se guarda en _GESTOR, así que lo ve todo el
         que abra la aplicación. */
      crearTipo: async function (nombre) {
        if (App.E.tiposDocumento.indexOf(nombre) === -1) App.E.tiposDocumento.push(nombre);
        await App.guardarTiposDocumento();
        return nombre;
      }
    });

    $('arranque').classList.add('oculto');
    $('aplicacion').classList.remove('oculto');
    $('usuario-pie').textContent = (App.E.usuario ? 'Sesión de ' + App.E.usuario + '  ·  ' : '') +
                                   'versión ' + App.VERSION;
    App.E.vista = App.vistaGuardada();
    await App.verAbiertos();
    App.irVista(App.E.vista);
    App.vigilarLaCarpeta();
  } catch (e) {
    U.aviso('No he podido entrar: ' + e.message, 'malo');
  }
};

/* ==========================================================
   CONFIGURACIÓN COMPARTIDA (_GESTOR)
   ========================================================== */

App.cargarTipos = async function () {
  var t = await Carpetas.leerJson(App.E.gestor, App.FICHERO_TIPOS);
  if (!t || !t.length) {
    t = Nombres.POR_DEFECTO.slice();
    await Carpetas.guardarJson(App.E.gestor, App.FICHERO_TIPOS, t);
  }
  App.E.tipos = t;
};

App.cargarTiposDocumento = async function () {
  var t = await Carpetas.leerJson(App.E.gestor, App.FICHERO_TIPOS_DOC);
  if (!t || !t.length) {
    t = Nombres.TIPOS_DOCUMENTO_POR_DEFECTO.slice();
    await Carpetas.guardarJson(App.E.gestor, App.FICHERO_TIPOS_DOC, t);
  }
  App.E.tiposDocumento = t;
};

App.guardarTiposDocumento = async function () {
  App.E.tiposDocumento.sort();
  await Carpetas.guardarJson(App.E.gestor, App.FICHERO_TIPOS_DOC, App.E.tiposDocumento);
};

/* Los estados de tramitación. Se guardan en el orden en que los pone
   el usuario, que es el orden del trámite: no se ordenan solos.

   Cada estado es { nombre, espera }. Las primeras versiones guardaban
   solo el nombre, así que aquí se admiten las dos formas y el fichero
   se deja ya con la nueva. */
App.normalizarEstados = function (lista) {
  var deFabrica = {};
  Nombres.ESTADOS_POR_DEFECTO.forEach(function (e) { deFabrica[e.nombre] = e.espera; });
  return (lista || []).map(function (e) {
    if (typeof e === 'string') return { nombre: e, espera: !!deFabrica[e] };
    return { nombre: String((e && e.nombre) || ''), espera: !!(e && e.espera) };
  }).filter(function (e) { return e.nombre; });
};

App.cargarEstados = async function () {
  var leido = await Carpetas.leerJson(App.E.gestor, App.FICHERO_ESTADOS);
  var eraTexto = !!(leido && leido.length && typeof leido[0] === 'string');
  var e = App.normalizarEstados(leido);
  if (!e.length) e = Nombres.ESTADOS_POR_DEFECTO.map(function (x) {
    return { nombre: x.nombre, espera: x.espera };
  });
  App.E.estados = e;
  if (!leido || !leido.length || eraTexto) await App.guardarEstados();
};

/* El sitio que ocupa un estado en la lista, y si es de los que
   significan "esto ya no depende de nosotros". */
App.posDeEstado = function (nombre) {
  for (var i = 0; i < App.E.estados.length; i++) {
    if (App.E.estados[i].nombre === nombre) return i;
  }
  return -1;
};

App.esDeEspera = function (nombre) {
  var i = App.posDeEstado(nombre);
  return i !== -1 && !!App.E.estados[i].espera;
};

App.guardarEstados = async function () {
  await Carpetas.guardarJson(App.E.gestor, App.FICHERO_ESTADOS, App.E.estados);
};

App.guardarTipos = async function () {
  App.E.tipos.sort(function (a, b) {
    var ka = a.categoria + ' ' + a.tipo, kb = b.categoria + ' ' + b.tipo;
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
  await Carpetas.guardarJson(App.E.gestor, App.FICHERO_TIPOS, App.E.tipos);
};

App.cargarRegistro = async function () {
  var r = await Carpetas.leerJson(App.E.gestor, App.FICHERO_ASUNTOS);
  App.E.registro = (r && r.asuntos) ? r : { asuntos: {} };
};

/* Se relee antes de escribir, por si el compañero ha tocado algo
   desde el otro ordenador mientras tanto. */
App.anotar = async function (clave, datos) {
  await App.cargarRegistro();
  var antes = App.E.registro.asuntos[clave] || {};
  App.E.registro.asuntos[clave] = Object.assign(antes, datos);
  await Carpetas.guardarJson(App.E.gestor, App.FICHERO_ASUNTOS, App.E.registro);
  App.refrescarFichas();
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

App.PANTALLAS = ['abiertos', 'nuevo', 'archivo', 'personas', 'ajustes'];

Array.prototype.forEach.call(document.querySelectorAll('.pestana'), function (b) {
  b.onclick = function () { App.ir(b.dataset.pantalla); };
});

App.ir = function (cual) {
  App.PANTALLAS.forEach(function (p) {
    $('pantalla-' + p).classList.toggle('oculto', p !== cual);
  });
  Array.prototype.forEach.call(document.querySelectorAll('.pestana'), function (b) {
    b.classList.toggle('activa', b.dataset.pantalla === cual);
  });
  if (cual === 'nuevo') App.prepararNuevo();
  if (cual === 'ajustes') App.pintarAjustes();
  if (cual === 'personas') App.pintarPersonas();
};
