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
  campos: { propios: [], porTipo: {} },   /* los campos de cada tipo de asunto, ver js/campos.js */
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
App.FICHERO_CAMPOS = 'campos.json';

App.TITULO = 'Gestor de Asuntos';
App.SEGUNDOS_ENTRE_MIRADAS = 20;

/* App.VERSION vive en js/version.js, cargado justo después de este
   fichero: así cambiar la versión no obliga a resubir nucleo.js
   entero, que es de los ficheros más grandes. */

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
  App.pintarListaUsuarios();
};

/* ---------- la lista de nombres de quien entra (19-sep-2026, fila 72,
   docs/DETALLES-DE-MANTENIMIENTO.md, punto 2) ----------

   Un desplegable con los nombres ya usados, más "Otro…" para escribir
   uno nuevo. Si la lista está vacía (primera vez, o sin permiso
   todavía sobre la carpeta), no se pinta nada y el campo de texto se
   comporta exactamente como hasta ahora. El campo de texto sigue
   siendo la fuente de verdad que lee btn-entrar: el desplegable solo
   le escribe el valor elegido y se aparta. */
App.pintarListaUsuarios = async function () {
  var lista = $('campo-usuario-lista');
  var campo = $('campo-usuario');
  if (!lista || !campo || !App.E.abiertos) return;
  var tienePermiso = await Carpetas.permiso(App.E.abiertos, false);
  if (!tienePermiso) return;

  var gestor;
  try { gestor = await Carpetas.crear(App.E.abiertos, App.CARPETA_GESTOR); }
  catch (e) { return; }
  var nombres = await Usuarios.cargar(gestor);
  if (!nombres.length) return;

  lista.innerHTML = '';
  nombres.forEach(function (n) {
    var op = document.createElement('option');
    op.value = n;
    op.textContent = n;
    lista.appendChild(op);
  });
  var otro = document.createElement('option');
  otro.value = '';
  otro.textContent = 'Otro…';
  lista.appendChild(otro);

  var actual = campo.value.trim();
  if (actual && nombres.indexOf(actual) !== -1) {
    lista.value = actual;
    campo.classList.add('oculto');
  } else {
    lista.value = '';
    campo.classList.remove('oculto');
  }
  lista.classList.remove('oculto');

  lista.onchange = function () {
    if (lista.value) {
      campo.value = lista.value;
      campo.classList.add('oculto');
    } else {
      campo.value = '';
      campo.classList.remove('oculto');
      campo.focus();
    }
  };
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

$('btn-abiertos').onclick = async function () {
  await App.pedirCarpeta('abiertos', 'gestor-abiertos', 'estado-abiertos');
  App.pintarListaUsuarios();
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

    var rotos = await Copias.comprobarTodos(App.E.gestor);
    if (rotos.length) {
      App.avisoFicherosRotos(rotos);
      return;
    }
    $('aviso-roto').classList.add('oculto');

    /* Después de comprobarTodos, nunca antes ni en paralelo: si esto
       escribiera a la vez que comprobarTodos lee, podría pillar
       usuarios.json a medio escribir y darlo por roto (pasó de
       verdad, fila 72). Se espera, para no dejarlo escribiendo de
       fondo mientras ya se está leyendo el resto de ficheros. */
    if (window.Usuarios) await Usuarios.anadirSiHaceFalta(App.E.gestor, App.E.usuario);

    await App.cargarTipos();
    await App.cargarTiposDocumento();
    await App.cargarEstados();
    await App.cargarCampos();
    if (window.Grupos) await Grupos.cargar();
    await App.cargarRegistro();

    Documentos.configurar({
      tipos: function () { return App.E.tiposDocumento; },
      curso: function (fecha) { return U.cursoDeFecha(fecha); },
      /* Para poder crear un tipo de documento desde el propio cuadro,
         sin ir a Ajustes. Se guarda en _GESTOR, así que lo ve todo el
         que abra la aplicación. */
      crearTipo: async function (nombre) {
        await Borrados.revivir(App.E.gestor, 'tiposDocumento', nombre);
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
    '</strong><p>Puede ser un corte a media escritura, o un conflicto de Dropbox mal resuelto ' +
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
        U.aviso('No he podido restaurar ' + nombre + ': ' + e.message, 'malo');
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
  var fusion = await App.fusionarConDisco(
    App.FICHERO_ESTADOS, App.E.estados, function (e) { return e.nombre; });
  fusion = await Borrados.filtrarActivos(
    App.E.gestor, 'estados', fusion, function (e) { return e.nombre; });
  App.E.estados = App.normalizarEstados(fusion);
  await Copias.guardar(App.E.gestor, App.FICHERO_ESTADOS, App.E.estados);
};

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

App.cargarRegistro = async function () {
  var r = await Carpetas.leerJson(App.E.gestor, App.FICHERO_ASUNTOS);
  App.E.registro = (r && r.asuntos) ? r : { asuntos: {} };
};

/* La única forma correcta de escribir el registro entero (fila 61,
   docs/GUARDAR-SIN-PISAR.md): vuelve a leer el fichero del disco,
   deja que 'cambiar' mute lo que haga falta sobre esa copia fresca,
   guarda y repinta. Es el mismo patrón que ya usa Hitos.cambiar en
   js/hitos.js. Cualquier sitio que necesite escribir el registro
   entero pasa por aquí: nunca App.E.registro directo ni
   Copias.guardar(..., App.FICHERO_ASUNTOS, ...) fuera de este
   fichero (salvo js/conflictos.js, que fusiona una copia en
   conflicto que ya se acaba de leer). */
App.guardarRegistroFresco = async function (cambiar) {
  await App.cargarRegistro();
  await cambiar(App.E.registro);
  await Copias.guardar(App.E.gestor, App.FICHERO_ASUNTOS, App.E.registro);
  App.refrescarFichas();
};

/* Se relee antes de escribir, por si el compañero ha tocado algo
   desde el otro ordenador mientras tanto. */
App.anotar = async function (clave, datos) {
  await App.guardarRegistroFresco(function (registro) {
    var antes = registro.asuntos[clave] || {};
    registro.asuntos[clave] = Object.assign(antes, datos);
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
